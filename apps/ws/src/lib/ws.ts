import WebSocket from "ws";
import { ESocketIncomingMessage, ESocketOutgoingMessage } from "../types";
import WorkerManager from "./worker";
import { v4 as uuidv4 } from "uuid";
import { Producer } from "mediasoup/node/lib/ProducerTypes";
import url from "url";
import { extractAuthUser } from "./auth";

const WebSocketConnection = async (websocket: WebSocket.Server) => {
  try {
    const workerManager = await WorkerManager.getInstance()
    const worker = workerManager.getNextWorker();
    websocket.on("connection", async (ws: WebSocket, req: Request) => {
      const token: string = url.parse(req.url, true).query.token as string;
      const user = await extractAuthUser(token, ws);
      if(!user) return;
      workerManager.users.push(user);
      ws.on("message", async (message: BinaryType) => {
        const data = JSON.parse(message.toString());
        switch(data.type) {
          case (ESocketIncomingMessage.GET_ROUTER_RTP_CAPABILITIES): {
            const roomId = uuidv4();
            const router = await workerManager.createRouter(worker);
            workerManager.rooms.set(roomId, { 
              router,
              producerTransports: new Map(), 
              consumerTransports: new Map(), 
              videoConsumers: new Map(), 
              videoProducers: new Map() ,
              audioConsumers: new Map(), 
              audioProducers: new Map() 
            });
            ws.send(JSON.stringify({ type: ESocketOutgoingMessage.ROUTER_RTP_CAPABILITIES, data: {
              roomId, 
              rtpCapabilities: router.rtpCapabilities 
            }}));
            break;
          }
          case (ESocketIncomingMessage.CREATE_CONSUMER_TRANSPORT && data.roomId): {
            const roomId = uuidv4();
            const router = await workerManager.createRouter(worker);
            workerManager.rooms.set(roomId, { 
              router, 
              producerTransports: new Map(), 
              consumerTransports: new Map(), 
              videoConsumers: new Map(), 
              videoProducers: new Map() ,
              audioConsumers: new Map(), 
              audioProducers: new Map() 
            });
            ws.send(JSON.stringify({ type: ESocketOutgoingMessage.ROUTER_RTP_CAPABILITIES, data: {
              roomId, 
              rtpCapabilities: router.rtpCapabilities 
            }}));
            ws.send(JSON.stringify({ type: ESocketOutgoingMessage.ROUTER_RTP_CAPABILITIES,  data: {
              rtpCapabilities: router.rtpCapabilities, 
              roomId 
            }}));
            break;
          }
          case (ESocketIncomingMessage.CONNECT_TRANSPORT && data.roomId && data.transportId && data.dtlsParameters): {
            const room = workerManager.rooms.get(data.roomId);
            if(!room) return;
            const transport = room.producerTransports.get(data.transportId) || room.consumerTransports.get(data.transportId);
            if (!transport) return;
            await transport.connect({ dtlsParameters: data.dtlsParameters });
            ws.send(JSON.stringify({ 
              type: ESocketOutgoingMessage.TRANSPORT_CONNECTED 
            }));
            break;
          }
          case (ESocketIncomingMessage.CREATE_PRODUCER_TRANSPORT && data.roomId): {
            const room = workerManager.rooms.get(data.roomId);
            if(!room) return;
            const router = room.router;
            const transport = await router.createWebRtcTransport({
              listenIps: [{ ip: "127.0.0.1", announcedIp: undefined }],
              enableUdp: true,
              enableTcp: true,
              preferUdp: true,
            });
            room.consumerTransports.set(transport.id, transport);
            ws.send(JSON.stringify({ 
              type: ESocketOutgoingMessage.CONSUMER_TRANSPORT_CREATED,
              transportId: transport.id, 
              transportOptions: {
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
              }
            }));
            break;
          }
          case (ESocketIncomingMessage.PRODUCE && data.roomId && data.transportId && data.kind): {
            const room = workerManager.rooms.get(data.roomId);
            if(!room) return;
            const transport = room.producerTransports.get(data.transportId);
            if(!transport) return;
            const producer = await transport.produce({ kind: data.kind, rtpParameters: data.rtpCapabilities });
            if(data.kind === "video") {
              room.videoProducers.set(producer.id, producer);
            }
            if(data.kind === "audio") {
              room.audioProducers.set(producer.id, producer);
            }
            ws.send(JSON.stringify({ 
              type: ESocketOutgoingMessage.PRODUCER_CREATED, 
              producerId: producer.id 
            }));
            break;
          }
          case (ESocketIncomingMessage.CONSUME && data.roomId && data.transportId): {
            const room = workerManager.rooms.get(data.roomId);
            if (!room) return;
            const transport = room.consumerTransports.get(data.transportId);
            if (!transport) return;
            let producer: Producer | undefined;
            if (data.kind === "video") {
              producer = room.videoProducers.values().next().value;
            } else if (data.kind === "audio") {
              producer = room.audioProducers.values().next().value;
            }
            if (!producer) return ws.send(JSON.stringify({ error: "No available producer" }));
            try {
              const consumer = await transport.consume({
                producerId: producer.id,
                rtpCapabilities: data.rtpCapabilities,
                paused: true,
              });
              if (data.kind === "video") {
                room.videoConsumers.set(consumer.id, consumer);
              } else if (data.kind === "audio") {
                room.audioConsumers.set(consumer.id, consumer);
              }
              ws.send(JSON.stringify({
                type: ESocketOutgoingMessage.CONSUMER_CREATED,
                consumerId: consumer.id,
                producerId: producer.id,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
              }));
            } catch (error) {
              console.error("Error consuming producer:", error);
              ws.send(JSON.stringify({ error: "Error consuming producer" }));
            }
          }
          break;
          default: {
            break;
          }
        }
      });
    });
  } catch (error) {
    console.log("error is this ", error);
    return;
  }
};

export { WebSocketConnection };
