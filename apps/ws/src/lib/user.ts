import { WebSocket } from "ws";
import { TUserJwtClaims } from "./auth";

export class User {
    socket: WebSocket;
    id: string;
    username: string | null;
    constructor(user: TUserJwtClaims, socket: WebSocket) {
        this.socket = socket;
        this.id = user.id;
        if(user.name) this.username = user.name;
        else if (user.username) this.username = user.username;
        else this.username = null;
    }
}