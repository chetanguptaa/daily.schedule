import { WEBSOCKET_URL } from "@/constants";
import { useEffect, useState } from "react";

export const useSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const token = localStorage.getItem("auth_token") || "";
  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(WEBSOCKET_URL + `?token=${token}`);
    ws.onopen = () => {
      console.log("WebSocket connected");
      setSocket(() => ws);
    };
    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setSocket(null);
    };
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    return () => {
      if (ws) ws.close();
    };
  }, [token]);
  return socket;
};
