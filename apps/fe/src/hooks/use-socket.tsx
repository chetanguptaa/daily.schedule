import { WEBSOCKET_URL } from "@/constants";
import { useEffect, useState } from "react";

export const useSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);
    ws.onopen = () => {
      setSocket(ws);
    };
    ws.onclose = () => {
      setSocket(null);
    };
    return () => {
      ws.close();
    };
  }, []);
  return socket;
};