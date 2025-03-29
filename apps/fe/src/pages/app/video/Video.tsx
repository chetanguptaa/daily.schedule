import Loading from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BACKEND_URL } from "@/constants";
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
import { useRecoilState, useRecoilValue, useResetRecoilState } from "recoil";
import { toast } from "sonner";

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
  const { isLoading, isError, error } = useQuery(["getBookingDetails"], () => {
    return getBookingDetails(bookingId || "");
  });
  const [videoEnabled, setVideoEnabled] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [videoLib, setVideoLib] = useRecoilState(videoLibAtom);
  const resetVideoLibState = useResetRecoilState(videoLibAtom);
  const [selectedCamera, setSelectedCamera] = useState<string>("Please select a camera");
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("Please select a microphone");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("Please select a speaker");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [username, setUsername] = useState<string>("");
  const [guest, setGuest] = useRecoilState(guestAtom);
  const user = useRecoilValue(userAtom);
  const [showAddUsernamePrompt, setShowAddUsernamePrompt] = useState<boolean>(false);
  const addUnauthenticatedUserToTheMeetingMutation = useMutation(
    ({ bookingId, username }: { bookingId: string; username: string }) =>
      addUnauthenticatedUserToTheMeeting(bookingId, username),
    {
      onSuccess: () => {
        setShowAddUsernamePrompt(false);
        queryClient.invalidateQueries(["getBookingDetails"]);
        localStorage.setItem("username", username)
        setGuest({
          guest: {
            username,
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
    const getMediaDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        const audioDevices = devices.filter((device) => device.kind === "audioinput");
        const outputDevices = devices.filter((device) => device.kind === "audiooutput");
        setVideoLib({
          ...videoLib,
          cameras: videoDevices,
          speakers: outputDevices,
          microphones: audioDevices, 
        });
        if (videoDevices.length > 0) setSelectedCamera(videoDevices[0].deviceId)
        if (audioDevices.length > 0) setSelectedSpeaker(audioDevices[0].deviceId);
        if (outputDevices.length > 0) setSelectedMicrophone(outputDevices[0].deviceId);
      } catch (error) {
        console.error("Error fetching media devices:", error);
      }
    };
    getMediaDevices();
    return () => {
      resetVideoLibState();
      setSelectedCamera("Please select a camera");
      setSelectedMicrophone("Please select a microphone");
      setSelectedSpeaker("Please select a speaker");
    };
  }, []);
  useEffect(() => {
    const getUserMedia = async () => {
      if (videoEnabled || audioEnabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: videoEnabled ? { deviceId: selectedCamera } : false,
            audio: audioEnabled ? { deviceId: selectedMicrophone } : false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error("Error accessing media devices:", error);
        }
      }
    };
    getUserMedia();
  }, [videoEnabled, audioEnabled, selectedCamera, selectedMicrophone]);
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
      if(guest.guest?.username === "") {
        setShowAddUsernamePrompt(true)
      }
    }
  }, [guest.guest?.username, user.isLoggedIn]) 
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
  
    return (
      <AppLayout>
        <div className="flex w-full justify-center items-center h-full min-h-screen">
          <div className="min-h-screen h-full bg-black text-white w-full">
            <header className="flex justify-between items-center p-4">
              <div className="text-xl font-bold">daily.schedule</div>
              <div className="flex items-center gap-4">
                <div className="text-lg">Are you ready to join?</div>
                <Button variant="secondary" className="bg-white text-black hover:bg-gray-200" onClick={() => {
                  navigate(`/video/${bookingId}/call`)
                }}>
                  Join
                </Button>
              </div>
            </header>
            <main className="max-w-4xl mx-auto p-4">
              <div className="relative aspect-video bg-zinc-900 rounded-lg mb-6">
                {videoEnabled ?
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
                  className={`rounded-full p-3 h-auto text-black bg-white ${!videoEnabled ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500" : ""}`}
                  onClick={() => setVideoEnabled(!videoEnabled)}
                >
                  {videoEnabled ?
                    <Video className="h-5 w-5" />
                  : <VideoOff className="h-5 w-5" />}
                </Button>
                <Button
                  variant="outline"
                  className={`rounded-full p-3 h-auto text-black bg-white ${!audioEnabled ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:text-red-500" : ""}`}
                  onClick={() => setAudioEnabled(!audioEnabled)}
                >
                  {audioEnabled ?
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
                  <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                    <SelectTrigger className="w-full bg-zinc-900">
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {videoLib.cameras.map((camera) => (
                        <SelectItem key={camera.deviceId} value={camera.deviceId || "Unknown camera"}>
                          {camera.label || "Unknown camera"}
                        </SelectItem>
                      ))}
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
                  <Select value={selectedMicrophone} onValueChange={setSelectedMicrophone}>
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
                  <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker} >
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
