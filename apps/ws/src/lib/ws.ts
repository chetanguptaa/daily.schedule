import WebSocket from "ws";
import { ESocketIncomingMessage, ESocketOutgoingMessage } from "../types";
import WorkerManager from "./worker";
import url from "url";
import { extractAuthUser } from "./auth";
import { Room } from "./room";

const WebSocketConnection = async (websocket: WebSocket.Server) => {
  try {
    const workerManager = await WorkerManager.getInstance();
    const worker = workerManager.getMediasoupWorker();
    if (!worker) return;
    websocket.on("connection", async (ws: WebSocket, req: Request) => {
      const token: string = url.parse(req.url, true).query.token as string;
      const user = await extractAuthUser(token, ws);
      if (!user) return;
      ws.on("message", async (message: BinaryType) => {
        const data = JSON.parse(message.toString());
        switch (data.type) {
          case ESocketIncomingMessage.CREATE_ROOM: {
            try {
              const roomId = data.roomId;
              if (roomId) {
                if (!workerManager.roomList.has(roomId)) {
                  const worker = workerManager.getMediasoupWorker();
                  const room = new Room(data.roomId, worker, ws);
                  workerManager.roomList.set(roomId, room);
                }
                ws.send(
                  JSON.stringify({
                    type: ESocketOutgoingMessage.ROOM_CREATED,
                    data: {
                      roomId,
                    },
                  })
                );
              }
            } catch (error) {
              console.log("error ", error);
            }
            break;
          }
          case ESocketIncomingMessage.JOIN_ROOM: {
            try {
              const roomId = data.roomId;
              if (roomId) {
                const room = workerManager.roomList.get(roomId);
                if (room) {
                  room.addUser(user);
                  let userRooms = workerManager.userRoomMapping.get(user);
                  if (!userRooms) userRooms = [];
                  userRooms.push(room);
                  workerManager.userRoomMapping.set(user, userRooms);
                  ws.send(
                    JSON.stringify({
                      type: ESocketOutgoingMessage.ROOM_JOINED,
                      data: {
                        roomId,
                      },
                    })
                  );
                }
              }
            } catch (error) {
              console.log("error ", error);
            }
            break;
          }
          case ESocketIncomingMessage.GET_ROUTER_RTP_CAPABILITIES: {
            try {
              const roomId = data.roomId;
              if (roomId) {
                const room = workerManager.roomList.get(roomId);
                if (room) {
                  ws.send(
                    JSON.stringify({
                      type: ESocketOutgoingMessage.ROUTER_RTP_CAPABILITIES,
                      data: {
                        ...room.getRtpCapabilities(),
                      },
                    })
                  );
                }
              }
            } catch (error) {
              console.log("error ", error);
            }
            break;
          }
          case ESocketIncomingMessage.CREATE_TRANSPORT: {
            try {
              const roomId = data.roomId;
              if (roomId) {
                const room = workerManager.roomList.get(roomId);
                if (room) {
                  const params = await room.createWebRtcTransport(user.id);
                  if (params) {
                    ws.send(
                      JSON.stringify({
                        type: ESocketOutgoingMessage.TRANSPORT_CREATED,
                        data: {
                          ...params,
                        },
                      })
                    );
                  }
                }
              }
            } catch (error) {
              console.log("error ", error);
            }
            break;
          }
          case ESocketIncomingMessage.CONNECT_TRANSPORT: {
            try {
              const roomId = data.roomId;
              const transportId = data.transportId;
              const dtlsParameters = data.dtlsParameters;
              if (!roomId || !transportId || !dtlsParameters) return;
              const room = workerManager.roomList.get(roomId);
              if (!room) return;
              await room.connectUserTransport(user.id, transportId, dtlsParameters);
              ws.send(
                JSON.stringify({
                  type: ESocketOutgoingMessage.TRANSPORT_CONNECTED,
                })
              );
            } catch (error) {
              console.log("error ", error);
            }
            break;
          }
          case ESocketIncomingMessage.PRODUCE: {
            try {
              const producerTransportId = data.producerTransportId;
              const kind = data.kind;
              const rtpParameters = data.rtpParameters;
              const roomId = data.roomId;
              if (!producerTransportId || !kind || !rtpParameters || !roomId) return;
              const room = workerManager.roomList.get(roomId);
              if (!room) return;
              const producer = await room.produce(user.id, data.producerTransportId, data.rtpParameters, data.kind);
              if (!producer) return;
              ws.send(
                JSON.stringify({
                  type: ESocketOutgoingMessage.SEND_PRODUCER,
                  producerId: producer.producerId,
                })
              );
            } catch (error) {
              console.log("error ", error);
            }
            break;
          }
          case ESocketIncomingMessage.CONSUME: {
            try {
              const consumerTransportId = data.producerTransportId;
              const producerId = data.producerId;
              const kind = data.kind;
              const rtpParameters = data.rtpParameters;
              const roomId = data.roomId;
              if (consumerTransportId || !producerId || !rtpParameters || !roomId || !kind) return;
              const room = workerManager.roomList.get(roomId);
              if (!room) return;
              const consumer = await room.consume(user.id, data.producerTransportId, data.rtpParameters, data.kind);
              if (!consumer) return;
            } catch (error) {
              console.log("error ", error);
            }
            break;
          }
          case ESocketIncomingMessage.PRODUCER_CLOSED: {
            try {
              const producerId = data.producerId;
              const userRooms = workerManager.userRoomMapping.get(user);
              if (!userRooms || !producerId) return;
              for (let i = 0; i < userRooms.length; i++) {
                const ur = userRooms[i];
                ur.closeProducer(user.id, producerId);
              }
              ws.send(
                JSON.stringify({
                  type: ESocketOutgoingMessage.PRODUCER_CLOSED,
                })
              );
            } catch (error) {
              console.log("error ", error);
            }
            break;
          }
          case ESocketIncomingMessage.EXIT_ROOM: {
            try {
              const roomId = data.roomId;
              if (!roomId) return;
              if (!workerManager.roomList.has(roomId)) {
                return;
              }
              await workerManager.roomList.get(roomId)?.removeUser(user.id);
              if (workerManager.roomList.get(roomId)?.getUsers().size === 0) {
                workerManager.roomList.delete(roomId);
                let userRooms = workerManager.userRoomMapping.get(user);
                if (!userRooms) return;
                userRooms = userRooms.filter((ur) => ur.id !== roomId);
                workerManager.userRoomMapping.set(user, userRooms);
              }
              ws.send(
                JSON.stringify({
                  type: ESocketOutgoingMessage.ROOM_EXITED,
                })
              );
            } catch (error) {
              console.log("error ", error);
            }
            break;
          }
          default: {
            break;
          }
        }
      });
      ws.on("close", () => {
        try {
          const userRooms = workerManager.userRoomMapping.get(user);
          if (!userRooms) return;
          for (let i = 0; i < userRooms.length; i++) {
            const ur = userRooms[i];
            ur.removeUser(user.id);
          }
        } catch (error) {
          console.log("error ", error);
        }
      });
    });
  } catch (error) {
    console.log("error is this ", error);
    return;
  }
};

export { WebSocketConnection };
