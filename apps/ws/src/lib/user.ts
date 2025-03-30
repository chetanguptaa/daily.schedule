import { WebSocket } from "ws";
import { TUserJwtClaims } from "./auth";
import { DtlsParameters } from "mediasoup/node/lib/WebRtcTransportTypes";
import { Transport } from "mediasoup/node/lib/TransportTypes";
import { Consumer } from "mediasoup/node/lib/ConsumerTypes";
import { Producer } from "mediasoup/node/lib/ProducerTypes";
import { MediaKind, RtpCapabilities, RtpParameters } from "mediasoup/node/lib/rtpParametersTypes";

export class User {
  socket: WebSocket;
  id: string;
  username: string | null;
  transports: Map<string, Transport>;
  consumers: Map<string, Consumer>;
  producers: Map<string, Producer>;
  constructor(user: TUserJwtClaims, socket: WebSocket) {
    this.socket = socket;
    this.id = user.id;
    this.transports = new Map();
    this.consumers = new Map();
    this.producers = new Map();
    if (user.name) this.username = user.name;
    else if (user.username) this.username = user.username;
    else this.username = null;
  }
  addTransport(transport: Transport) {
    this.transports.set(transport.id, transport);
  }
  async connectTransport(transportId: string, dtlsParameters: DtlsParameters) {
    const transport = this.transports.get(transportId);
    if (!transport) return;
    await transport.connect({
      dtlsParameters: dtlsParameters,
    });
  }
  async createProducer(producerTransportId: string, rtpParameters: RtpParameters, kind: MediaKind) {
    const transport = this.transports.get(producerTransportId);
    if (!transport) return;
    const producer = await transport.produce({
      kind,
      rtpParameters,
    });
    this.producers.set(producer.id, producer);
    producer.on("transportclose", () => {
      producer.close();
      this.producers.delete(producer.id);
    });
    return producer;
  }
  async createConsumer(consumerTransportId: string, producerId: string, rtpCapabilities: RtpCapabilities) {
    let consumerTransport = this.transports.get(consumerTransportId);
    if (!consumerTransport) return;
    let consumer = null;
    try {
      consumer = await consumerTransport.consume({
        producerId: producerId,
        rtpCapabilities,
        paused: false, // producer.kind === 'video',
      });
    } catch (error) {
      console.error("Consume failed", error);
      return;
    }
    if (consumer.type === "simulcast") {
      await consumer.setPreferredLayers({
        spatialLayer: 2,
        temporalLayer: 2,
      });
    }
    this.consumers.set(consumer.id, consumer);
    consumer.on("transportclose", () => {
      this.consumers.delete(consumer.id);
    });
    return {
      consumer,
      params: {
        producerId: producerId,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
      },
    };
  }
  removeConsumer(consumerId: string) {
    this.consumers.delete(consumerId);
  }
  close() {
    this.transports.forEach((transport) => transport.close());
  }
  closeProducer(producerId: string) {
    try {
      this.producers.get(producerId)?.close();
    } catch (e) {
      console.warn(e);
    }
    this.producers.delete(producerId);
  }
}
