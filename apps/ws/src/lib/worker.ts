import * as mediasoup from "mediasoup";
import config from "../config";
import { Worker } from "mediasoup/node/lib/WorkerTypes";
import { Router } from "mediasoup/node/lib/RouterTypes";

const worker: Array<{
  worker: Worker;
  router: Router;
}> = [];

let nextMediasoupWorkerIdx = 0;

const createWorker = async () => {
  const worker = await mediasoup.createWorker({
    logLevel: config.mediasoup.worker.logLevel,
    logTags: config.mediasoup.worker.logTags,
    rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    rtcMinPort: config.mediasoup.worker.rtcMinPort,
  });
  worker.on("died", () => {
    console.error("mediasoup worker dies, exiting in 2 seconds... [pid:&d]", worker.pid);
    setTimeout(() => {
      process.exit(1);
    }, 2000);
  });
};

export { createWorker };
