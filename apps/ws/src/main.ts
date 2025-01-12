import { WebSocket } from "ws";
import { WebSocketConnection } from "./lib/ws";
import express from "express";
import http from "http";

const main = async () => {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });
  WebSocketConnection(wss);
  const port = 8080;
  server.listen(port, () => {
    console.log("server is listening on port ", port);
  });
};

export { main };
