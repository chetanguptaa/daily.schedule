import * as mediasoup from "mediasoup";
import config from "../config";
import { Worker } from "mediasoup/node/lib/WorkerTypes";
import { Room } from "./room";
import { User } from "./user";

export default class WorkerManager {
  workers: Worker[];
  nextMediasoupWorkerIdx: number;
  roomList: Map<string, Room>;
  userRoomMapping: Map<User, Room[]>;
  private static instance: WorkerManager;
  private constructor() {
    this.workers = [];
    this.nextMediasoupWorkerIdx = 0;
    this.roomList = new Map();
    this.userRoomMapping = new Map();
  }
  static async getInstance() {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
      await WorkerManager.instance.initWorkers();
    }
    return WorkerManager.instance;
  }
  private async initWorkers() {
    const { numWorkers } = config.mediasoup;
    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: config.mediasoup.worker.logLevel,
        logTags: config.mediasoup.worker.logTags,
        rtcMinPort: config.mediasoup.worker.rtcMinPort,
        rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
      });
      worker.on("died", () => {
        console.error("mediasoup worker died, exiting in 2 seconds... [pid:%d]", worker.pid);
        setTimeout(() => process.exit(1), 2000);
      });
      this.workers.push(worker);
      setInterval(async () => {
        const usage = await worker.getResourceUsage();
        console.info("mediasoup Worker resource usage [pid:%d]: %o", worker.pid, usage);
      }, 120000);
    }
  }
  getMediasoupWorker() {
    const worker = this.workers[this.nextMediasoupWorkerIdx];
    if (++this.nextMediasoupWorkerIdx === this.workers.length) {
      this.nextMediasoupWorkerIdx = 0;
    }
    return worker;
  }
}
