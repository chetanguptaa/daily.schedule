import { types } from "mediasoup";
import * as mediasoup from "mediasoup";
import { User } from "./User";
import config from "../config";
import { ESocketOutgoingMessages } from "../types";

interface Room {
  router: types.Router;
  users: Set<User>;
}

export class MediaSoupSFU {
  private worker!: types.Worker;
  private rooms: Map<string, Room>;
  private static instance: MediaSoupSFU;
  constructor() {
    this.rooms = new Map();
  }
  public static getInstance(): MediaSoupSFU {
    if (!MediaSoupSFU.instance) {
      MediaSoupSFU.instance = new MediaSoupSFU();
    }
    return MediaSoupSFU.instance;
  }

  async init() {
    this.worker = await mediasoup.createWorker({
      logLevel: config.mediasoup.worker.logLevel,
      logTags: config.mediasoup.worker.logTags,
      rtcMinPort: config.mediasoup.worker.rtcMinPort,
      rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });
    this.worker.on("died", () => {
      console.error("MediaSoup worker died, exiting...");
      process.exit(1);
    });
  }
  async createOrJoinRoom(user: User, roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.users.add(user);
      user.send({ type: ESocketOutgoingMessages.ROOM_JOINED, rtpCapabilities: room.router.rtpCapabilities });
    } else {
      const mediaCodecs = config.mediasoup.router.mediaCodecs;
      const router = await this.worker.createRouter({
        mediaCodecs,
      });
      this.rooms.set(roomId, { router, users: new Set([user]) });
      user.send({ type: ESocketOutgoingMessages.ROOM_JOINED, rtpCapabilities: router.rtpCapabilities });
    }
  }
  async createSendWebRTCTransport(user: User) {
    const room = this.findRoomForUser(user);
    if (!room) return;
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate } = config.mediasoup.webRtcTransport;
    const transport = await room.router.createWebRtcTransport({
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
    user.addTransport(transport.id, transport);
    user.send({
      type: ESocketOutgoingMessages.SEND_TRANSPORT_CREATED,
      transportOptions: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    });
  }
  async createReceiveWebRTCTransport(user: User) {
    const room = this.findRoomForUser(user);
    if (!room) return;
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate } = config.mediasoup.webRtcTransport;
    const transport = await room.router.createWebRtcTransport({
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
    user.addTransport(transport.id, transport);
    user.send({
      type: ESocketOutgoingMessages.RECIEVE_TRANSPORT_CREATED,
      transportOptions: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    });
  }
  async connectProducerTransport(user: User, data: any) {
    const transport = user.getTransport(data.transportId);
    if (!transport) return console.log("transport not found of produce");
    try {
      await transport.connect({ dtlsParameters: data.dtlsParameters });
    } catch (error) {
      console.error("Error connecting producer transport:", error);
    }
  }
  async connectReceiveTransport(user: User, data: any) {
    const transport = user.getTransport(data.transportId);
    if (!transport) return console.log("transport not found of receive ");
    try {
      await transport.connect({ dtlsParameters: data.dtlsParameters });
    } catch (error) {
      console.error("Error connecting receive transport:", error);
    }
  }
  async produceMedia(user: User, data: any) {
    const transport = user.getTransport(data.transportId);
    if (!transport) return console.log("transport not found while creating producer");
    try {
      const producer = await transport.produce({
        kind: data.kind,
        rtpParameters: data.rtpParameters,
      });
      if (!producer) return console.log("Producer is not created");
      user.addProducer(producer.id, producer);
      const room = this.findRoomForUser(user);
      if (!room) return console.log("Room not found");
      room.users.forEach((peer) => {
        if (peer !== user) {
          peer.send({
            type: ESocketOutgoingMessages.NEW_PEER_PRODUCER,
            producerId: producer.id,
            kind: data.kind,
          });
        }
      });
      room.users.forEach((peer) => {
        if (peer !== user) {
          user.send({
            type: ESocketOutgoingMessages.PRODUCERS_EXIST,
            producerId: peer.getProducersId(),
          });
        }
      });
    } catch (error) {
      console.error("Error while producing ", error);
    }
  }
  async consumeMedia(user: User, data: any) {
    const room = this.findRoomForUser(user);
    if (!room) return;
    const transport = user.getTransport(data.transportId);
    if (!transport) return;
    const canConsume = room.router.canConsume({ producerId: data.producerId, rtpCapabilities: data.rtpCapabilities });
    if (!canConsume) {
      console.error("Cannot consume: Incompatible RTP capabilities");
      return;
    }
    const consumer = await transport.consume({
      producerId: data.producerId,
      rtpCapabilities: data.rtpCapabilities,
      paused: true,
    });
    user.addConsumer(consumer.id, consumer);
    user.send({
      type: ESocketOutgoingMessages.MEDIA_CONSUMED,
      consumerId: consumer.id,
      producerId: data.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    });
  }
  async resume(user: User, data: any) {
    let consumer = user.getConsumer(data.consumerId);
    if (!consumer) {
      console.error("Consumer not found:", data.consumerId);
      return;
    }
    try {
      consumer.resume();
    } catch (error) {
      console.error(error);
    }
  }
  async broadCastMessage(user: User, msg: string) {
    const room = this.findRoomForUser(user);
    if (!room) return;
    room.users.forEach((peer) => {
      if (peer !== user) {
        peer.send({
          type: ESocketOutgoingMessages.MESSAGE,
          user: user.id,
          text: msg,
        });
      }
    });
  }
  private findRoomForUser(user: User): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.users.has(user)) {
        return room;
      }
    }
    return undefined;
  }
  async removeUserFromRoom(user: User) {
    const room = this.findRoomForUser(user);
    if (!room) return;
    room.users.delete(user);
    let producersId = user.getProducersId();
    room.users.forEach((peer) => {
      peer.send({ type: ESocketOutgoingMessages.USER_LEFT, producersId });
    });
    if (room.users.size === 0) {
      for (const [roomId, r] of this.rooms.entries()) {
        if (r === room) {
          this.rooms.delete(roomId);
          break;
        }
      }
    }
  }
}
