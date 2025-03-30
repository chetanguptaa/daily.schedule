import { WEBSOCKET_URL } from "@/constants";
import { useEffect, useState } from "react";

export const useSocket = (token: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  useEffect(() => {
    if(token.length === 0) return;
    const ws = new WebSocket(WEBSOCKET_URL + `?token=${token}`);
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