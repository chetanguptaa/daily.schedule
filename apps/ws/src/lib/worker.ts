import * as mediasoup from "mediasoup";
import config from "../config";
import { Worker } from "mediasoup/node/lib/WorkerTypes";
import { Router } from "mediasoup/node/lib/RouterTypes";
import { Transport } from "mediasoup/node/lib/TransportTypes";
import { Producer } from "mediasoup/node/lib/ProducerTypes";
import { Consumer } from "mediasoup/node/lib/ConsumerTypes";
import { User } from "./user";

export default class WorkerManager {
  public rooms: Map<string, {
    router: Router,
    producerTransports: Map<string, Transport>,
    consumerTransports: Map<string, Transport>,
    videoProducers: Map<string, Producer>,
    audioProducers: Map<string, Producer>,
    videoConsumers: Map<string, Consumer>,
    audioConsumers: Map<string, Consumer>,
  }>;
  public users: User[];
  private workers: Worker[]
  private nextMediasoupWorkerIdx;
  private static instance: WorkerManager;
  private constructor() {
    this.workers = [];
    this.nextMediasoupWorkerIdx = 0;
    this.rooms = new Map();
    this.users = [];
  }
  static async getInstance() {
    if(!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
      await WorkerManager.instance.initWorkers();
    }
    return WorkerManager.instance;
  }
  private async initWorkers() {
    console.log('initializeWorkers() [num:%d]', config.mediasoup.numWorkers);
    if (this.workers.length > 0) {
      return;
    }
    for (let i = 0; i < config.mediasoup.numWorkers; ++i) {
      const worker = await mediasoup.createWorker(config.mediasoup.worker);
      worker.once('died', () => {
        console.error('worker::died [pid:%d] exiting in 2 seconds...', worker.pid);
        setTimeout(() => process.exit(1), 2000);
      });
      this.workers.push(worker);
    }
  };
  async createRouter (worker: Worker) {
    const mediasoupRouter = await worker.createRouter(config.mediasoup.router);
    return mediasoupRouter;
  }
  getNextWorker() {
    if (this.workers.length === 0) {
      throw new Error("No workers initialized");
    }
    const worker = this.workers[this.nextMediasoupWorkerIdx];
    this.nextMediasoupWorkerIdx = (this.nextMediasoupWorkerIdx + 1) % this.workers.length;
    return worker;
  }

  releaseWorkers () {
    for (const worker of this.workers) {
      worker.close();
    }
    this.workers.length = 0;
  };
  cleanupRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (
      room.producerTransports.size === 0 &&
      room.consumerTransports.size === 0 &&
      room.videoProducers.size === 0 &&
      room.audioProducers.size === 0 &&
      room.videoConsumers.size === 0 &&
      room.audioConsumers.size === 0
    ) {
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} deleted.`);
    }
  }
  removeTransport(roomId: string, transportId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.producerTransports.has(transportId)) {
      room.producerTransports.get(transportId)?.close();
      room.producerTransports.delete(transportId);
    } else if (room.consumerTransports.has(transportId)) {
      room.consumerTransports.get(transportId)?.close();
      room.consumerTransports.delete(transportId);
    }
  }
  removeConsumer(roomId: string, consumerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.videoConsumers.has(consumerId)) {
      room.videoConsumers.get(consumerId)?.close();
      room.videoConsumers.delete(consumerId);
    } else if (room.audioConsumers.has(consumerId)) {
      room.audioConsumers.get(consumerId)?.close();
      room.audioConsumers.delete(consumerId);
    }
  }
  removeProducer(roomId: string, producerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.videoProducers.has(producerId)) {
      room.videoProducers.get(producerId)?.close();
      room.videoProducers.delete(producerId);
    } else if (room.audioProducers.has(producerId)) {
      room.audioProducers.get(producerId)?.close();
      room.audioProducers.delete(producerId);
    }
  }
}