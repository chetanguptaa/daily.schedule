import { WebSocket } from "ws";
import { Consumer, Producer, Transport } from "mediasoup/node/lib/types";
import { MediaSoupSFU } from "./MediaSoupSFU";
import { ESocketIncomingMessages } from "../types";
import { TUserJwtClaims } from "../lib/auth";

export class User {
  private ws: WebSocket;
  public id: string;
  private consumers: Map<string, Consumer>;
  private producers: Map<string, Producer>;
  private transports: Map<string, Transport>;
  private mediaSoupSFU: MediaSoupSFU;
  public username: string | null;
  constructor(user: TUserJwtClaims, ws: WebSocket) {
    this.ws = ws;
    this.id = user.id;
    this.consumers = new Map();
    this.producers = new Map();
    this.transports = new Map();
    this.mediaSoupSFU = MediaSoupSFU.getInstance();
    if (user.name) this.username = user.name;
    else if (user.username) this.username = user.username;
    else this.username = null;
    this.init();
  }
  init() {
    this.ws.on("message", async (data) => {
      try {
        const parsedData = JSON.parse(data.toString());
        switch (parsedData.type) {
          case ESocketIncomingMessages.JOIN_ROOM:
            await this.mediaSoupSFU.createOrJoinRoom(this, parsedData.roomId);
            break;
          case ESocketIncomingMessages.REQUEST_SEND_TRANSPORT:
            await this.mediaSoupSFU.createSendWebRTCTransport(this);
            break;
          case ESocketIncomingMessages.REQUEST_RECEIVE_TRANSPORT:
            await this.mediaSoupSFU.createReceiveWebRTCTransport(this);
            break;
          case ESocketIncomingMessages.CONNECT_PRODUCER_TRANSPORT:
            await this.mediaSoupSFU.connectProducerTransport(this, parsedData);
            break;
          case ESocketIncomingMessages.CONNECT_RECEIVE_TRANSPORT:
            await this.mediaSoupSFU.connectReceiveTransport(this, parsedData);
            break;
          case ESocketIncomingMessages.PRODUCE_MEDIA:
            await this.mediaSoupSFU.produceMedia(this, parsedData);
            break;
          case ESocketIncomingMessages.CONSUME_MEDIA:
            await this.mediaSoupSFU.consumeMedia(this, parsedData);
            break;
          case ESocketIncomingMessages.RESUME:
            await this.mediaSoupSFU.resume(this, parsedData);
            break;
          case ESocketIncomingMessages.MESSAGE:
            await this.mediaSoupSFU.broadCastMessage(this, parsedData.message);
            break;
          default:
            console.warn("Unknown message type:", parsedData.type);
        }
      } catch (error) {
        console.error("Error handling message:", error);
        this.send({ type: "error", message: "Internal server error" });
      }
    });
  }
  public send(message: any): void {
    this.ws.send(JSON.stringify(message));
  }
  public addTransport(id: string, transport: Transport): void {
    this.transports.set(id, transport);
  }
  public getTransport(id: string): Transport | undefined {
    return this.transports.get(id);
  }
  public addProducer(id: string, producer: Producer): void {
    this.producers.set(id, producer);
  }
  public getProducersId(): string[] {
    return Array.from(this.producers.keys());
  }
  public addConsumer(id: string, consumer: Consumer): void {
    this.consumers.set(id, consumer);
  }
  public getConsumer(id: string): any {
    return this.consumers.get(id);
  }
  public cleanup(): void {
    this.consumers.forEach((consumer) => consumer.close());
    this.producers.forEach((producer) => producer.close());
    this.transports.forEach((transport) => transport.close());
    this.consumers.clear();
    this.producers.clear();
    this.transports.clear();
  }
}
