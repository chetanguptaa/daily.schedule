import WebSocket from "ws";
import { createWorker } from "./worker";

let mediasoupRouter;

const WebSocketConnection = async (websocket: WebSocket.Server) => {
  try {
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
