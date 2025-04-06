import { Router } from "mediasoup/node/lib/RouterTypes";
import { WebSocket } from "ws";
import config from "../config";
import { Worker } from "mediasoup/node/lib/WorkerTypes";
import { User } from "./user";
import { DtlsParameters } from "mediasoup/node/lib/WebRtcTransportTypes";
import { MediaKind, RtpCapabilities, RtpParameters } from "mediasoup/node/lib/rtpParametersTypes";
import { ESocketOutgoingMessage } from "../types";

export class Room {
  id: string;
  worker: Worker;
  socket: WebSocket;
  router: Router | null = null;
  users: Map<string, User>;
  constructor(roomId: string, worker: Worker, ws: WebSocket) {
    this.id = roomId;
    const mediaCodecs = config.mediasoup.router.mediaCodecs;
    this.worker = worker;
    this.users = new Map();
    this.socket = ws;
    this.worker
      .createRouter({
        mediaCodecs,
      })
      .then((router: Router) => {
        this.router = router;
      });
  }

  addUser(user: User) {
    this.users.set(user.id, user);
  }

  getProducerListForPeer() {
    const producerList: {
      producerId: string;
    }[] = [];
    this.users.forEach((user) => {
      user.producers.forEach((producer) => {
        producerList.push({
          producerId: producer.id,
        });
      });
    });
    return producerList;
  }

  getRtpCapabilities() {
    if (!this.router) return;
    return this.router.rtpCapabilities;
  }

  async createWebRtcTransport(userId: string) {
    if (!this.router) return;
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate } = config.mediasoup.webRtcTransport;
    const transport = await this.router.createWebRtcTransport({
      listenIps: config.mediasoup.webRtcTransport.listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate,
    });
    if (maxIncomingBitrate) {
      try {
        await transport.setMaxIncomingBitrate(maxIncomingBitrate);
      } catch (error) {}
    }
    transport.on("dtlsstatechange", async (dtlsState) => {
      if (dtlsState === "closed") {
        console.log("Transport close", { name: this.users.get(userId)?.username });
        transport.close();
      }
    });
    transport.on("@close", () => {
      console.log("Transport close", { name: this.users.get(userId)?.username });
    });
    console.log("Adding transport", { transportId: transport.id });
    this.users.get(userId)?.addTransport(transport);
    return {
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    };
  }

  async connectUserTransport(userId: string, transportId: string, dtlsParameters: DtlsParameters) {
    const user = this.users.get("userId");
    if (!user) return;
    await user.connectTransport(transportId, dtlsParameters);
  }

  async produce(userId: string, producerTransportId: string, rtpParameters: RtpParameters, kind: MediaKind) {
    const user = this.users.get(userId);
    if (!user) return null;
    const producer = await user.createProducer(producerTransportId, rtpParameters, kind);
    if (!producer) return null;
    return {
      producerId: producer.id,
      userId: user.id,
      kind: producer.kind,
    };
  }

  async consume(userId: string, consumerTransportId: string, producerId: string, rtpCapabilities: RtpCapabilities) {
    const user = this.users.get(userId);
    if (!user || !this.router) return null;
    if (
      !this.router.canConsume({
        producerId: producerId,
        rtpCapabilities,
      })
    ) {
      console.error("can not consume");
      return;
    }
    let consumerParams = await user.createConsumer(consumerTransportId, producerId, rtpCapabilities);
    if (!consumerParams) return;
    consumerParams.consumer.on("producerclose", () => {
      this.users.get(user.id)?.removeConsumer(consumerParams.consumer.id);
      this.socket.send(
        JSON.stringify({
          type: ESocketOutgoingMessage.CONSUMER_CLOSED,
          consumerId: consumerParams.params.id,
        })
      );
    });
    return consumerParams.params;
  }

  async removeUser(userId: string) {
    this.users.get(userId)?.close();
    this.users.delete(userId);
  }

  closeProducer(userId: string, producerId: string) {
    this.users.get(userId)?.closeProducer(producerId);
  }

  getUsers() {
    return this.users;
  }
}
