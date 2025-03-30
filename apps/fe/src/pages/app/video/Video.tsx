import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BACKEND_URL } from "@/constants";
import { useSocket } from "@/hooks/use-socket";
import AppLayout from "@/layout/app-layout";
import queryClient from "@/lib/queryClient";
import guestAtom from "@/store/atoms/guestAtom";
import userAtom from "@/store/atoms/userAtom";
import videoLibAtom from "@/store/atoms/videoLibAtom";
import axios from "axios";
import { Video, VideoOff, Mic, MicOff, Headphones, Volume2, Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { useNavigate, useParams } from "react-router";
import { useRecoilState, useRecoilValue } from "recoil";
import { toast } from "sonner";
import mediasoupClient from 'mediasoup-client';
import { ESocketIncomingMessage, ESocketOutgoingMessage } from "@/schema/socket-message";
import Cookies from "node_modules/@types/js-cookie";

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null); 
  const [username, setUsername] = useState("");
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [guest, setGuest] = useRecoilState(guestAtom);
  const user = useRecoilValue(userAtom);
  const [showAddUsernamePrompt, setShowAddUsernamePrompt] = useState(false);
  const addUnauthenticatedUserToTheMeetingMutation = useMutation(
    ({ bookingId, username }: { bookingId: string; username: string }) =>
      addUnauthenticatedUserToTheMeeting(bookingId, username),
    {
      onSuccess: (data) => {
        setShowAddUsernamePrompt(false);
        queryClient.invalidateQueries(["getBookingDetails"]);
        Cookies.set("auth_token", data.token);
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

  
  const handleCloseCamera = () => {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => track.stop());
    }
  };

  const handleCloseMicrophone = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    const getMediaDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === "videoinput");
        const audioDevices = devices.filter(device => device.kind === "audioinput");
        const outputDevices = devices.filter(device => device.kind === "audiooutput");
        setVideoLib(prev => ({
          ...prev,
          cameras: videoDevices,
          speakers: outputDevices,
          microphones: audioDevices,
        }));
      } catch (error) {
        console.error("Error fetching media devices:", error);
      }
    };
    getMediaDevices();
  }, []);

  useEffect(() => {
    const getUserMedia = async () => {
      if (videoLib.camera || videoLib.microphone) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: videoLib.camera ? { deviceId: videoLib.camera.deviceId } : false,
            audio: videoLib.microphone ? { deviceId: videoLib.microphone.deviceId } : false,
          });
          mediaStreamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (error) {
          console.error("Error accessing media devices:", error);
        }
      }
    };
    getUserMedia();
    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [videoLib.camera, videoLib.microphone]);
  
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
    if(user.isLoggedIn) {
      setShowAddUsernamePrompt(false);
    } else {
      if(!guest.guest?.exists) {
        setShowAddUsernamePrompt(true)
      }
    }
  }, [guest.guest?.exists, user.isLoggedIn]);

  
  // ---- MEDIASOUP CLIENT
  const token = Cookies.get('auth_token') || ""
  const socket = useSocket(token);
  const [device, setDevice] = useState<mediasoupClient.Device | null>(null);
  const [sendTransport, setSendTransport] = useState<mediasoupClient.types.Transport | null>(null);
  const [recvTransport, setRecvTransport] = useState<mediasoupClient.types.Transport | null>(null);
  const [producer, setProducer] = useState<mediasoupClient.types.Producer | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if(!socket || socket.CONNECTING || socket.CLOSED || !meetingJoined) return;
    socket.onopen = () => {
      console.log("Connected to WebSocket");
      socket.send(JSON.stringify({ type: ESocketOutgoingMessage.GET_ROUTER_RTP_CAPABILITIES }));
    };
    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log("Received:", message);
      switch (message.type) {
        case ESocketIncomingMessage.ROUTER_RTP_CAPABILITIES:
          await loadDevice(message.data);
          socket.send(JSON.stringify({ type: ESocketOutgoingMessage.CREATE_TRANSPORT }));
          break;
        case "transportCreated":
          createTransports(message.data);
          break;
        case "producerCreated":
          console.log("Producer created:", message.data);
          break;
        case "newProducer":
          socket.send(JSON.stringify({ type: "consume", producerId: message.data.id }));
          break;
        case "consumerCreated":
          handleConsumer(message.data);
          break;
      }
    };
    return () => socket.close();
  }, [meetingJoined, socket]);

  const loadDevice = async (routerRtpCapabilities: mediasoupClient.types.RtpCapabilities) => {
    const mediasoupDevice = new mediasoupClient.Device();
    await mediasoupDevice.load({ routerRtpCapabilities });
    setDevice(mediasoupDevice);
  };
  const createTransports = async (transportData: mediasoupClient.types.TransportOptions) => {
    if (!device || !socket) return;
    const sendTransport = device.createSendTransport(transportData);
    setSendTransport(sendTransport);
    sendTransport.on("connect", ({ dtlsParameters }, callback) => {
      socket.send(JSON.stringify({ type: "connectTransport", dtlsParameters }));
      callback();
    });
    sendTransport.on("produce", ({ kind, rtpParameters }, callback) => {
      socket.send(JSON.stringify({ type: "produce", kind, rtpParameters }));
      callback({ id: "some-id" });
    });
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const videoTrack = stream.getVideoTracks()[0];
    videoRef.current!.srcObject = stream;
    const producer = await sendTransport.produce({ track: videoTrack });
    setProducer(producer);
  };
  const handleConsumer = async (consumerData) => {
    if (!device || !socket) return;
    const recvTransport = device.createRecvTransport(consumerData);
    setRecvTransport(recvTransport);
    recvTransport.on("connect", ({ dtlsParameters }, callback) => {
      socket.send(JSON.stringify({ type: "connectTransport", dtlsParameters }));
      callback();
    });
    const consumer = await recvTransport.consume({
      id: consumerData.id,
      producerId: consumerData.producerId,
      kind: consumerData.kind,
      rtpParameters: consumerData.rtpParameters,
    });
    const remoteStream = new MediaStream();
    remoteStream.addTrack(consumer.track);
    remoteVideoRef.current!.srcObject = remoteStream;
  };

  if (isLoading) {
    return (
      <div className="flex w-full justify-center items-center h-full min-h-screen">
        <Loading />
      </div>
    );
  }

  if (showAddUsernamePrompt) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center w-full h-full min-h-screen">
          <Card className="w-[350px] h-fit">
            <CardHeader>
              <CardTitle>Enter your name</CardTitle>
              <CardDescription>This is how you'll be showcased in the call.</CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Name" onChange={(e) => setUsername(e.target.value)} />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setUsername("");
                  setShowAddUsernamePrompt(false);
                  navigate("/");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddUnauthenticatedUserDetails}>Enter</Button>
            </CardFooter>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if(meetingJoined) {
    return  <AppLayout>
      <div className="flex w-full justify-center items-center h-full min-h-screen">
        <div className="min-h-screen h-full bg-black text-white w-full">
          <header className="flex justify-between items-center p-4">
            <div className="text-xl font-bold">daily.schedule</div>
          </header>
          <main className="max-w-4xl mx-auto p-4">
            <div className="relative aspect-video bg-zinc-900 rounded-lg mb-6">
              {videoLib.camera ?
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full rounded-lg  transform scale-x-[-1]"
                />
              : <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-2xl font-medium">{user.isLoggedIn ? user.user?.name : guest.guest?.username}</div>
                </div>
              }
            </div>
            <div className="flex justify-center gap-4 mb-8">
              <Button
                variant="outline"
                className={`rounded-full p-3 h-auto text-black bg-white ${!videoLib.camera ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500" : ""}`} onClick={() => {
                  if(videoLib.camera) {
                    handleCloseCamera()
                    setVideoLib(prev => ({
                      ...prev,
                      camera: null,
                    }));
                  } else {
                    if(videoLib.cameras.length === 0) {
                      alert("Please give camera permissions")
                      return;
                    }
                    setVideoLib(prev => ({
                      ...prev,
                      camera: videoLib.cameras[0],
                    }));
                  }
                }}>
                {videoLib.camera ?
                  <Video className="h-5 w-5" />
                : <VideoOff className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                className={`rounded-full p-3 h-auto text-black bg-white ${!videoLib.microphone ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500" : ""}`} 
                onClick={() => {
                  if(videoLib.microphone) {
                    handleCloseMicrophone()
                    setVideoLib(prev => ({
                      ...prev,
                      microphone: null,
                    }));
                  } else {
                    if(videoLib.microphones.length === 0) {
                      alert("Please give microphone permissions")
                      return;
                    }
                    setVideoLib(prev => ({
                      ...prev,
                      microphone: videoLib.microphones[0],
                    }));
                  }
                }}>
                {videoLib.microphone ?
                  <Mic className="h-5 w-5" />
                : <MicOff className="h-5 w-5" />}
              </Button>
              <Button variant="outline" className="rounded-full p-3 h-auto text-black bg-white">
                <Headphones className="h-5 w-5" />
              </Button>
            </div>
          </main>
        </div>
      </div>
    </AppLayout>  
  }

  return (
    <AppLayout>
      <div className="flex w-full justify-center items-center h-full min-h-screen">
        <div className="min-h-screen h-full bg-black text-white w-full">
          <header className="flex justify-between items-center p-4">
            <div className="text-xl font-bold">daily.schedule</div>
            <div className="flex items-center gap-4">
              <div className="text-lg">Are you ready to join?</div>
              <Button variant="secondary" className="bg-white text-black hover:bg-gray-200" onClick={() => {
                // navigate(`/video/${bookingId}/call`)
                setMeetingJoined(true)
              }}>
                Join
              </Button>
            </div>
          </header>
          <main className="max-w-4xl mx-auto p-4">
            <div className="relative aspect-video bg-zinc-900 rounded-lg mb-6">
              {videoLib.camera ?
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full rounded-lg  transform scale-x-[-1]"
                />
              : <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-2xl font-medium">{user.isLoggedIn ? user.user?.name : username[0]}</div>
                </div>
              }
            </div>
            <div className="flex justify-center gap-4 mb-8">
              <Button
                variant="outline"
                className={`rounded-full p-3 h-auto text-black bg-white ${!videoLib.camera ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500" : ""}`} onClick={() => {
                  if(videoLib.camera) {
                    handleCloseCamera()
                    setVideoLib(prev => ({
                      ...prev,
                      camera: null,
                    }));
                  } else {
                    if(videoLib.cameras.length === 0) {
                      alert("Please give camera permissions")
                      return;
                    }
                    setVideoLib(prev => ({
                      ...prev,
                      camera: videoLib.cameras[0],
                    }));
                  }
                }}>
                {videoLib.camera ?
                  <Video className="h-5 w-5" />
                : <VideoOff className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                className={`rounded-full p-3 h-auto text-black bg-white ${!videoLib.microphone ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500" : ""}`} 
                onClick={() => {
                  if(videoLib.microphone) {
                    handleCloseMicrophone()
                    setVideoLib(prev => ({
                      ...prev,
                      microphone: null,
                    }));
                  } else {
                    if(videoLib.microphones.length === 0) {
                      alert("Please give microphone permissions")
                      return;
                    }
                    setVideoLib(prev => ({
                      ...prev,
                      microphone: videoLib.microphones[0],
                    }));
                  }
                }}>
                {videoLib.microphone ?
                  <Mic className="h-5 w-5" />
                : <MicOff className="h-5 w-5" />}
              </Button>
              <Button variant="outline" className="rounded-full p-3 h-auto text-black bg-white">
                <Headphones className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Camera
                </label>
                <Select value={videoLib.camera?.deviceId} onValueChange={(deviceId) => {
                  let camera: MediaDeviceInfo | null = null;
                  for(let i = 0; i < videoLib.cameras.length; i++) {
                    if(videoLib.cameras[i].deviceId === deviceId) {
                      camera = videoLib.cameras[i];
                    }
                  }
                  if(!camera) return;
                  setVideoLib(prev => ({
                    ...prev,
                    camera
                  }));
                }}>
                  <SelectTrigger className="w-full bg-zinc-900">
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    <>
                      {videoLib.cameras.map((camera) => (
                        <SelectItem key={camera.deviceId} value={camera.deviceId || "Unknown camera"}>
                        {camera.label}
                        </SelectItem>
                      ))}
                    </>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Microphone
                  </label>
                </div>
                <Select value={videoLib.microphone?.deviceId} onValueChange={(deviceId) => {
                  let microphone: MediaDeviceInfo | null = null;
                  for(let i = 0; i < videoLib.microphones.length; i++) {
                    if(videoLib.microphones[i].deviceId === deviceId) {
                      microphone = videoLib.microphones[i];
                    }
                  }
                  if(!microphone) return;
                  setVideoLib(prev => ({
                    ...prev,
                    microphone
                  }));
                }}>
                  <SelectTrigger className="w-full bg-zinc-900">
                    <SelectValue placeholder="Select microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoLib.microphones.map((microphone) => (
                      <SelectItem key={microphone.deviceId} value={microphone.deviceId || "unknown microphone"}>
                        {microphone.label || "Unknown microphone"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Speakers
                  </label>
                </div>
                <Select value={videoLib.speaker?.deviceId} onValueChange={(deviceId) => {
                  let speaker: MediaDeviceInfo | null = null;
                  for(let i = 0; i < videoLib.speakers.length; i++) {
                    if(videoLib.speakers[i].deviceId === deviceId) {
                      speaker = videoLib.speakers[i];
                    }
                  }
                  if(!speaker) return;
                  setVideoLib(prev => ({
                    ...prev,
                    speaker
                  }));
                }} >
                  <SelectTrigger className="w-full bg-zinc-900">
                    <SelectValue placeholder="Select speakers" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoLib.speakers.map((speaker) => (
                      <SelectItem key={speaker.deviceId} value={speaker.deviceId || "Unknown speaker"}>
                        {speaker.label || "Unknown speaker"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AppLayout>
  );
}