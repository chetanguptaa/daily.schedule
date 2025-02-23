import WebSocket from "ws";
import { createWorker } from "./worker";

const WebSocketConnection = async (websocket: WebSocket.Server) => {
  try {
    let mediasoupRouter;
    mediasoupRouter = await createWorker();
  } catch (error) {
    throw error;
  }
  websocket.on("connection", (ws: WebSocket) => {
    ws.on("message", (message: BinaryType) => {
      console.log("mesasge ", message.toString());
      ws.send("Hello world");
    });
  });
};

export { WebSocketConnection };
