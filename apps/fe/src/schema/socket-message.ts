export enum ESocketOutgoingMessage {
    JOIN_CALL = "JOIN_CALL",
    GET_ROUTER_RTP_CAPABILITIES = "GET_ROUTER_RTP_CAPABILITIES",
    CREATE_TRANSPORT = "CREATE_TRANSPORT"
}

export enum ESocketIncomingMessage {
    ROUTER_RTP_CAPABILITIES = "ROUTER_RTP_CAPABILITIES" 
}