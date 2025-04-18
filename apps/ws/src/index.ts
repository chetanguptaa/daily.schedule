import { WebSocketServer } from "ws";
import { MediaSoupSFU } from "./managers/MediaSoupSFU";
import { extractAuthUser } from "./lib/auth";
import url from "url";

const wss = new WebSocketServer({ port: 8080 });
const mediaSoupSFU = MediaSoupSFU.getInstance();

async function main() {
  try {
    await mediaSoupSFU.init();
    wss.on("connection", async (ws, req: Request) => {
      ws.on("error", console.error);
      console.log("Client connected");
      const token: string = url.parse(req.url, true).query.token as string;
      const user = await extractAuthUser(token, ws);
      if (!user) {
        ws.close();
        return;
      }
      ws.on("close", () => {
        mediaSoupSFU.removeUserFromRoom(user);
        user.cleanup();
      });
    });
  } catch (error) {
    console.log("Error initializing WebSocket server:", error);
    process.exit(1);
  }
}

main().catch(console.error);
