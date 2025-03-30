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
    const worker = workerManager.worker;
    if(!worker) return;
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
            ws.send(JSON.stringify({ type: ESocketOutgoingMessage.ROUTER_RTP_CAPABILITIES, data: {
              roomId, 
              rtpCapabilities: router.rtpCapabilities 
            }}));
            break;
          }
          case (ESocketIncomingMessage.CREATE_TRANSPORT): {
            if(data.isSender) {
              const transportAndParams = await workerManager.createWebRtcTransport();
              if(!transportAndParams) return;
              workerManager.producerTransport = transportAndParams.transport;
              ws.send(JSON.stringify({ type: ESocketOutgoingMessage.TRANSPORT_CREATED, data: {
                ...transportAndParams.params 
              }}));
            } else {
             const transportAndParams = await workerManager.createWebRtcTransport();
              if(!transportAndParams) return;
              workerManager.consumerTransport = transportAndParams.transport;
              ws.send(JSON.stringify({ type: ESocketOutgoingMessage.TRANSPORT_CREATED, data: {
                ...transportAndParams.params 
              }}));
            }
            break; 
          }
          case (ESocketIncomingMessage.CONNECT_TRANSPORT): {
            if(!workerManager.producerTransport) return;
            await workerManager.producerTransport.connect({ 
              dtlsParameters: data.dtlsParameters 
            })
            break;
          }
          case (ESocketIncomingMessage.RECV_CONNECT): {
            if(!workerManager.consumerTransport || !data.dtlsParameters) return;
            await workerManager.consumerTransport.connect({ 
              dtlsParameters: data.dtlsParameters 
            })
          }
          case (ESocketIncomingMessage.PRODUCE): {
            if(!workerManager.producerTransport || !data.kind || !data.rtpParameters) return;
            workerManager.producer = await workerManager.producerTransport.produce({
              kind: data.kind,
              rtpParameters: data.rtpParameters,
            })
            workerManager.producer.on('transportclose', () => {
              console.log('transport for this producer closed ')
              if(!workerManager.producer) return;
              workerManager.producer.close()
            })
            ws.send(JSON.stringify({
              id: workerManager.producer.id
            }))
            break;
          }
          case (ESocketIncomingMessage.CONSUME): {
            if(!workerManager.router || !workerManager.producer || !data.rtpCapabilities || !workerManager.consumerTransport) return;
            try {
              if (workerManager.router.canConsume({
                producerId: workerManager.producer.id,
                rtpCapabilities: data.rtpCapabilities
              })) {
                workerManager.consumer = await workerManager.consumerTransport.consume({
                  producerId: workerManager.producer.id,
                  rtpCapabilities: data.rtpCapabilities,
                  paused: true,
                })
                workerManager.consumer.on('transportclose', () => {
                  console.log('transport close from consumer')
                })
                workerManager.consumer.on('producerclose', () => {
                  console.log('producer of consumer closed')
                })
                const params = {
                  id: workerManager.consumer.id,
                  producerId: workerManager.producer.id,
                  kind: workerManager.consumer.kind,
                  rtpParameters: workerManager.consumer.rtpParameters,
                }
                ws.send(JSON.stringify(params))
              }
            } catch (error) {
              console.log("error ", error)
            }
            break;
          }
          case (ESocketIncomingMessage.CONSUMER_RESUME): {
            if(!workerManager.consumer) return;
            await workerManager.consumer.resume()
          }
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
