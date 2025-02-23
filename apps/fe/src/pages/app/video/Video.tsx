import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, VideoOff, Mic, MicOff, Headphones, Volume2, Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function VideoPage() {
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const getMediaDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === "videoinput");
        const audioDevices = devices.filter((device) => device.kind === "audioinput");
        const outputDevices = devices.filter((device) => device.kind === "audiooutput");
        setCameras(videoDevices);
        setMicrophones(audioDevices);
        setSpeakers(outputDevices);
        if (videoDevices.length > 0) setSelectedCamera(videoDevices[0].deviceId);
        if (audioDevices.length > 0) setSelectedMicrophone(audioDevices[0].deviceId);
        if (outputDevices.length > 0) setSelectedSpeaker(outputDevices[0].deviceId);
      } catch (error) {
        console.error("Error fetching media devices:", error);
      }
    };
    getMediaDevices();
    return () => {
      setCameras([]);
      setMicrophones([]);
      setSpeakers([]);
      setSelectedCamera("");
      setSelectedMicrophone("");
      setSelectedSpeaker("");
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
  return (
    <div className="flex w-full justify-center items-center h-full min-h-screen">
      <div className="min-h-screen h-full bg-black text-white w-full">
        <header className="flex justify-between items-center p-4">
          <div className="text-xl font-bold">daily.schedule</div>
          <div className="flex items-center gap-4">
            <div className="text-lg">Are you ready to join?</div>
            <Button variant="secondary" className="bg-white text-black hover:bg-gray-200">
              Join
            </Button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto p-4">
          <div className="relative aspect-video bg-zinc-900 rounded-lg mb-6">
            {videoEnabled ?
              <video ref={videoRef} autoPlay playsInline className="w-full h-full rounded-lg  transform scale-x-[-1]" />
            : <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-2xl font-medium">Chetan Gupta</div>
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
                  {cameras.map((camera) => (
                    <SelectItem key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || "Unknown Camera"}
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
                  {microphones.map((microphone) => (
                    <SelectItem key={microphone.deviceId} value={microphone.deviceId}>
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
              <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                <SelectTrigger className="w-full bg-zinc-900">
                  <SelectValue placeholder="Select speakers" />
                </SelectTrigger>
                <SelectContent>
                  {speakers.map((speaker) => (
                    <SelectItem key={speaker.deviceId} value={speaker.deviceId}>
                      {speaker.label || "Unknown Speaker"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
