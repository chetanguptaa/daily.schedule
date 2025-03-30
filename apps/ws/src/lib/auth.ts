import { config } from "dotenv";
config();
import jwt from "jsonwebtoken";
import { WebSocket } from "ws";
import { User } from "./user";


const JWT_SECRET = process.env.JWT_SECRET!;

export type TUserJwtClaims = {
    id: string,
    email?: string,
    name?: string,
    username?: string,  // incase of guest
}

export const extractAuthUser = async (token: string, ws: WebSocket) => {
    const decoded = jwt.verify(token, JWT_SECRET) as TUserJwtClaims;
    if (decoded.id) {
        return new User(decoded, ws);
    }
    return null;
};