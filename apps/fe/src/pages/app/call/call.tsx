import { useSocket } from "@/hooks/use-socket";
import { useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";

export default function CallPage() {
  const socket = useSocket()
  const [, setDevice] = useState<Device | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if(!socket || socket.CONNECTING || socket.CLOSED) return;
    socket.onmessage = (event) => handleServerMessage(event.data);
  }, [socket])

  const handleServerMessage = async (message: BinaryType) => {
    const data = JSON.parse(message);
    if (data.type === "routerCapabilities") {
      const device = new Device();
      await device.load({ routerRtpCapabilities: data.routerRtpCapabilities });
      setDevice(device);
      startStreaming(device);
    }
  };
  const startStreaming = async (device: Device) => {
    if(!socket || !videoRef || !videoRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (videoRef.current) videoRef.current.srcObject = stream;
    socket.send(JSON.stringify({ type: "createTransport" }));
    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "transportOptions") {
        const sendTransport = device.createSendTransport(data.transportOptions);
        sendTransport.on("connect", ({ dtlsParameters }, callback) => {
          socket.send(JSON.stringify({ type: "connectTransport", dtlsParameters }));
          callback();
        });
        sendTransport.on("produce", async ({ kind, rtpParameters }, callback) => {
          socket.send(JSON.stringify({ type: "produce", kind, rtpParameters }));
          socket.onmessage = (event) => {
            const response = JSON.parse(event.data);
            if (response.type === "producerId") {
              callback(response.id);
            }
          };
        });
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        await sendTransport.produce({ track: videoTrack });
        await sendTransport.produce({ track: audioTrack });
      }
    };
  };
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <video ref={videoRef} autoPlay playsInline className="w-full max-w-lg rounded-lg bg-black" />
    </div>
  );
}
