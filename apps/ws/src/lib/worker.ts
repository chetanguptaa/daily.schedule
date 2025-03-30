import * as mediasoup from "mediasoup";
import config from "../config";
import { Worker } from "mediasoup/node/lib/WorkerTypes";
import { Router } from "mediasoup/node/lib/RouterTypes";
import { Transport } from "mediasoup/node/lib/TransportTypes";
import { Producer } from "mediasoup/node/lib/ProducerTypes";
import { Consumer } from "mediasoup/node/lib/ConsumerTypes";
import { User } from "./user";

export default class WorkerManager {
  worker: Worker | null;
  router: Router | null;
  producer: Producer | null;
  consumer: Consumer | null;
  producerTransport: Transport | null;
  consumerTransport: Transport | null;
  users: User[]
  private static instance: WorkerManager;
  private constructor() {
     this.worker = null;
     this.router = null;
     this.producer = null;
     this.consumer = null;
     this.producerTransport = null;
     this.consumerTransport = null;
     this.users = [];
  }
  static async getInstance() {
    if(!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
      await WorkerManager.instance.initWorker();
    }
    return WorkerManager.instance;
  }
  private async initWorker(): Promise<Worker> {
    this.worker = await mediasoup.createWorker({
      rtcMinPort: 2000,
      rtcMaxPort: 2020,
    })
    console.log(`worker pid ${this.worker.pid}`)
    this.worker.on('died', error => {
      console.error('mediasoup worker has died')
      setTimeout(() => process.exit(1), 2000);
    })
    return this.worker
  };
  async createRouter (worker: Worker) {
    const mediasoupRouter = await worker.createRouter(config.mediasoup.router);
    return mediasoupRouter;
  }
  async createWebRtcTransport () {
    if(!this.router) return;
    try {
      const webRtcTransport_options = {
        listenIps: [
          {
            ip: '0.0.0.0', // replace with relevant IP address
            announcedIp: '127.0.0.1',
          }
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      }
      let transport = await this.router.createWebRtcTransport(webRtcTransport_options)
      console.log(`transport id: ${transport.id}`)
      transport.on('dtlsstatechange', dtlsState => {
        if (dtlsState === 'closed') {
          transport.close()
        }
      })
      transport.on('@close', () => {
        console.log('transport closed')
      })
      return {
        transport,
         params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        } 
      }
    } catch (error) {
      console.log(error)
      return null;
    }
  }
}