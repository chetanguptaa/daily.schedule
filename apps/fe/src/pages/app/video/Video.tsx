import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Share, Video, VideoOff, MessageSquare, Settings } from "lucide-react";
import * as mediasoup from "mediasoup-client";
import { useNavigate, useParams } from "react-router";
import { BACKEND_URL, WEBSOCKET_URL } from "@/constants";
import { ESocketIncomingMessages, ESocketOutgoingMessages } from "@/schema/socket-message";
import axios from "axios";
import { useMutation, useQuery } from "react-query";
import { useRecoilState, useRecoilValue } from "recoil";
import videoLibAtom from "@/store/atoms/videoLibAtom";
import guestAtom from "@/store/atoms/guestAtom";
import userAtom from "@/store/atoms/userAtom";
import { toast } from "sonner";
import queryClient from "@/lib/queryClient";
import Cookies from "js-cookie";
import Loading from "@/components/loading";

async function getBookingDetails(bookingId: string) {
  const res = await axios.get(BACKEND_URL + "/events/bookings/" + bookingId, {
    withCredentials: true,
  });
  return res.data;
}

async function addUnauthenticatedUserToTheMeeting(bookingId: string, username: string) {
  const res = await axios.post(
    BACKEND_URL + "/events/bookings/" + bookingId + "/add-unauthenticated-user-to-meeting",
    { username },
    { withCredentials: true }
  );
  return res.data;
}

export default function VideoPage() {
  const params = useParams();
  const navigate = useNavigate();
  const bookingId = params.bookingId;
  const { isLoading, isError, error } = useQuery(["getBookingDetails"], () => getBookingDetails(bookingId || ""));
  const [videoLib, setVideoLib] = useRecoilState(videoLibAtom);
  const [username, setUsername] = useState("");
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [guest, setGuest] = useRecoilState(guestAtom);
  const user = useRecoilValue(userAtom);
  const [showAddUsernamePrompt, setShowAddUsernamePrompt] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<{ id: string; stream: MediaStream }[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const localStream = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const deviceRef = useRef<mediasoup.Device | undefined>(undefined);
  const sendTransportRef = useRef<mediasoup.types.Transport<mediasoup.types.AppData> | undefined>(undefined);
  const receiveTransportRef = useRef<mediasoup.types.Transport<mediasoup.types.AppData> | undefined>(undefined);
  const videoProducerRef = useRef<mediasoup.types.Producer | null>(null);
  const audioProducerRef = useRef<mediasoup.types.Producer | null>(null);

  const addUnauthenticatedUserToTheMeetingMutation = useMutation(
    ({ bookingId, username }: { bookingId: string; username: string }) =>
      addUnauthenticatedUserToTheMeeting(bookingId, username),
    {
      onSuccess: (data) => {
        setShowAddUsernamePrompt(false);
        queryClient.invalidateQueries(["getBookingDetails"]);
        Cookies.set("auth_token", data.token);
        localStorage.setItem("auth_token", data.token);
        setGuest({
          guest: {
            exists: true,
            username: data.username,
            id: data.id,
          },
        });
      },
    }
  );

  const handleAddUnauthenticatedUserDetails = () => {
    if (!bookingId || !username) {
      console.error("Booking ID or username is missing");
      return;
    }
    addUnauthenticatedUserToTheMeetingMutation.mutate({ bookingId, username });
  };

  useEffect(() => {
    if (isError) {
      const newError = error as unknown as {
        response: {
          data: {
            message: string;
          };
        };
      };
      toast(newError.response.data.message);
      navigate("/");
    }
  }, [error, isError, navigate]);

  useEffect(() => {
    if (user.isLoggedIn) {
      setShowAddUsernamePrompt(false);
    } else {
      if (!guest.guest?.exists) {
        setShowAddUsernamePrompt(true);
      }
    }
  }, [guest.guest?.exists, user.isLoggedIn]);

  useEffect(() => {
    wsRef.current = new WebSocket(WEBSOCKET_URL + "?token=" + localStorage.getItem("auth_token"));
    wsRef.current.onopen = async () => {
      await startCamera();
    };
    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleServerMessage(message);
    };
    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    wsRef.current.onclose = () => {
      console.log("WebSocket connection closed");
      setRemoteStreams([]);
      // Todo, attempt to reconnect here
    };
    return () => {
      wsRef.current?.close();
      if (localStream) {
        localStream.current?.getTracks().forEach((track) => track.stop());
      }
      setRemoteStreams([]);
    };
  }, []);

  const startCamera = async () => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: ESocketOutgoingMessages.JOIN_ROOM,
            roomId: params.id,
          })
        );
      }
    } catch (error) {
      console.error("Camera/Microphone access denied", error);
    }
  };

  const handleServerMessage = async (message: any) => {
    switch (message.type) {
      case ESocketIncomingMessages.ROOM_JOINED:
        deviceRef.current = new mediasoup.Device();
        await deviceRef.current?.load({ routerRtpCapabilities: message.rtpCapabilities });
        requestSendTransport();
        requestReceiveTransport();
        break;

      case ESocketIncomingMessages.SEND_TRANSPORT_CREATED:
        createSendTransport(message);
        break;

      case ESocketIncomingMessages.RECIEVE_TRANSPORT_CREATED:
        createReceiveTransport(message);
        break;

      case ESocketIncomingMessages.PRODUCERS_EXIST:
        message.producerId.map((id: string) => {
          consumeProducer(id);
        });
        break;

      case ESocketIncomingMessages.NEW_PEER_PRODUCER:
        consumeProducer(message.producerId);
        break;

      case ESocketIncomingMessages.MEDIA_CONSUMED:
        handleMediaConsumed(message);
        break;

      case ESocketIncomingMessages.USER_LEFT:
        message.producersId.map((id: string) => {
          removePeerVideo(id);
        });
        break;
    }
  };

  const requestSendTransport = async () => {
    wsRef.current?.send(
      JSON.stringify({
        type: ESocketOutgoingMessages.REQUEST_SEND_TRANSPORT,
      })
    );
  };

  const requestReceiveTransport = async () => {
    wsRef.current?.send(
      JSON.stringify({
        type: ESocketOutgoingMessages.REQUEST_RECEIVE_TRANSPORT,
      })
    );
  };

  const createSendTransport = async (message: any) => {
    const { transportOptions } = message;

    sendTransportRef.current = deviceRef.current?.createSendTransport(transportOptions);
    if (!sendTransportRef.current) return console.warn("send transport is not created");
    sendTransportRef.current.on("connect", async ({ dtlsParameters }, callback) => {
      try {
        wsRef.current?.send(
          JSON.stringify({
            type: ESocketOutgoingMessages.CONNECT_PRODUCER_TRANSPORT,
            transportId: sendTransportRef.current?.id,
            dtlsParameters,
          })
        );
        callback();
      } catch (error) {
        console.error("Error while connecting ", error);
      }
    });
    sendTransportRef.current.on("produce", async ({ kind, rtpParameters }, callback) => {
      try {
        wsRef.current?.send(
          JSON.stringify({
            type: ESocketOutgoingMessages.PRODUCE_MEDIA,
            transportId: sendTransportRef.current?.id,
            kind,
            rtpParameters,
          })
        );
        callback({ id: transportOptions.id });
      } catch (error) {
        console.error("Error while producing ", error);
      }
    });

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = mediaStream;
      if (localVideoRef.current) {
        localVideoRef.current!.srcObject = mediaStream;
      }
    } catch (error) {
      if (error === "NotAllowedError: Permission denied") {
        console.warn("Camera Permission denied");
      } else {
        console.error("Error while getting user media", error);
      }
    }
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      const audioTrack = localStream.current.getAudioTracks()[0];

      if (sendTransportRef.current) {
        if (videoTrack) {
          try {
            videoProducerRef.current = await sendTransportRef.current.produce({ track: videoTrack });
          } catch (error) {
            console.error("Error producing video track:", error);
          }
        }
        if (audioTrack) {
          try {
            audioProducerRef.current = await sendTransportRef.current.produce({ track: audioTrack });
          } catch (error) {
            console.error("Error producing audio track:", error);
          }
        }
      }
    }
  };

  const createReceiveTransport = async (message: any) => {
    const { transportOptions } = message;
    receiveTransportRef.current = deviceRef.current?.createRecvTransport(transportOptions);
    if (!receiveTransportRef.current) return console.warn("Receive transport is not created");
    receiveTransportRef.current.on("connect", async ({ dtlsParameters }, callback) => {
      wsRef.current?.send(
        JSON.stringify({
          type: ESocketOutgoingMessages.CONNECT_RECEIVE_TRANSPORT,
          transportId: receiveTransportRef.current?.id,
          dtlsParameters,
        })
      );
      callback();
    });
  };

  const consumeProducer = async (producerId: string) => {
    if (!receiveTransportRef.current) {
      return console.warn("No receive transport ref is present ");
    }
    wsRef.current?.send(
      JSON.stringify({
        type: ESocketOutgoingMessages.CONSUME_MEDIA,
        transportId: receiveTransportRef.current?.id,
        producerId: producerId,
        rtpCapabilities: deviceRef.current?.rtpCapabilities,
      })
    );
  };

  const handleMediaConsumed = async (message: any) => {
    const { consumerId, producerId, kind, rtpParameters } = message;
    const consumer = await receiveTransportRef.current?.consume({
      id: consumerId,
      producerId,
      kind,
      rtpParameters,
    });

    if (!consumer) {
      console.error("Failed to create consumer");
      return;
    }
    const track = consumer.track;
    if (kind === "audio") {
      const newAudioStream = new MediaStream([track]);
      setRemoteStreams((prev) => {
        const exists = prev.some((s) => s.id === producerId);
        if (exists) return prev;

        return [...prev, { id: producerId, stream: newAudioStream }];
      });
      wsRef.current?.send(
        JSON.stringify({
          type: ESocketOutgoingMessages.RESUME,
          consumerId,
        })
      );
    } else if (kind === "video") {
      const newVideoStream = new MediaStream([track]);
      setRemoteStreams((prev) => {
        const exists = prev.some((s) => s.id === producerId);
        if (exists) return prev;

        return [...prev, { id: producerId, stream: newVideoStream }];
      });
      wsRef.current?.send(
        JSON.stringify({
          type: ESocketOutgoingMessages.RESUME,
          consumerId,
        })
      );
    }
  };

  const removePeerVideo = (producerId: string) => {
    console.log("remote stream ", remoteStreams);
    setRemoteStreams((prevStreams) => prevStreams.filter((stream) => stream.id !== producerId));
  };

  const toggleCamera = async () => {
    try {
      if (cameraOn && videoProducerRef.current) {
        videoProducerRef.current.pause();
        const videoTrack = localStream.current?.getVideoTracks()[0];
        if (videoTrack) videoTrack.stop();
      } else if (!cameraOn && sendTransportRef.current) {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newStream.getVideoTracks()[0];
        localStream.current = newStream;
        if (localVideoRef.current) {
          localVideoRef.current!.srcObject = newStream;
        }
        if (videoProducerRef.current) {
          await videoProducerRef.current.replaceTrack({ track: newVideoTrack });
          videoProducerRef.current.resume();
        } else {
          videoProducerRef.current = await sendTransportRef.current.produce({ track: newVideoTrack });
        }
      }
      setCameraOn(!cameraOn);
    } catch (error) {
      console.error("Error toggling camera:", error);
    }
  };

  const toggleMic = async () => {
    try {
      if (micOn && audioProducerRef.current) {
        audioProducerRef.current.pause();
        const audioTrack = localStream.current?.getAudioTracks()[0];
        if (audioTrack) audioTrack.stop();
        setMicOn(false);
      } else if (!micOn && sendTransportRef.current) {
        const newAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newAudioTrack = newAudioStream.getAudioTracks()[0];
        if (audioProducerRef.current) {
          await audioProducerRef.current.replaceTrack({ track: newAudioTrack });
          audioProducerRef.current.resume();
        } else {
          audioProducerRef.current = await sendTransportRef.current.produce({ track: newAudioTrack });
        }
      }
      setMicOn(!micOn);
    } catch (error) {
      console.error("Error toggling mic:", error);
    }
  };

  const controls = [
    {
      icon: micOn ? Mic : MicOff,
      label: micOn ? "Mute" : "Unmute",
      onClick: () => toggleMic(),
      isActive: micOn,
      color: "bg-green-600 hover:bg-green-500",
    },
    {
      icon: cameraOn ? Video : VideoOff,
      label: cameraOn ? "Stop Video" : "Start Video",
      onClick: () => toggleCamera(),
      isActive: cameraOn,
      color: "bg-green-600 hover:bg-green-500",
    },
    {
      icon: Share,
      label: "Screen Share",
      onClick: () => setIsSharing(!isSharing),
      isActive: false,
    },
    {
      icon: MessageSquare,
      label: "Chat",
      onClick: () => setIsChatOpen((prev) => !prev),
      isActive: isChatOpen,
      color: "bg-green-600 hover:bg-green-500",
    },
    {
      icon: Settings,
      label: "Settings",
      onClick: () => console.log("Open settings"),
      isActive: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex w-full justify-center items-center h-full min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-3 left-3 grid grid-cols-3 lg:grid-cols-4 gap-2">
        {remoteStreams.map((remoteStream) => (
          <div key={remoteStream.id}>
            <RemoteVideo stream={remoteStream.stream} />
          </div>
        ))}
      </div>
      {localStream && (
        <div className="fixed left-3 bottom-14 z-[1]">
          <video className="w-32 rounded-lg" ref={localVideoRef} muted autoPlay playsInline />
        </div>
      )}
      <div className="fixed bottom-0 left-0 right-0 border-t z-[1] border-slate-700 bg-slate-900 text-white">
        <div className="px-4 py-1">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex items-center justify-center gap-2">
              {controls.map(({ icon: Icon, label, onClick, isActive, color }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className={`flex flex-col items-center p-2 rounded-full transition-colors ${isActive ? color : "bg-slate-700 hover:bg-slate-600"}`}
                >
                  <Icon className="w-6 h-6" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const RemoteVideo = ({ stream }: { stream: MediaStream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={videoRef} autoPlay playsInline className="w-32 rounded-lg" />;
};
