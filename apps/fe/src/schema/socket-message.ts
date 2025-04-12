export const ESocketOutgoingMessages = {
  JOIN_ROOM: "JOIN_ROOM",
  REQUEST_SEND_TRANSPORT: "REQUEST_SEND_TRANSPORT",
  REQUEST_RECEIVE_TRANSPORT: "REQUEST_RECEIVE_TRANSPORT",
  CONNECT_PRODUCER_TRANSPORT: "CONNECT_PRODUCER_TRANSPORT",
  CONNECT_RECEIVE_TRANSPORT: "CONNECT_RECEIVE_TRANSPORT",
  PRODUCE_MEDIA: "PRODUCE_MEDIA",
  CONSUME_MEDIA: "CONSUME_MEDIA",
  RESUME: "RESUME",
  MESSAGE: "MESSAGE",
};

export const ESocketIncomingMessages = {
  ROOM_JOINED: "ROOM_JOINED",
  SEND_TRANSPORT_CREATED: "REQUEST_SEND_CREATED",
  RECIEVE_TRANSPORT_CREATED: "RECIEVE_TRANSPORT_CREATED",
  CONNECT_PRODUCER_TRANSPORT: "CONNECT_PRODUCER_TRANSPORT",
  CONNECT_RECEIVE_TRANSPORT: "CONNECT_RECEIVE_TRANSPORT",
  PRODUCE_MEDIA: "PRODUCE_MEDIA",
  MEDIA_CONSUMED: "MEDIA_CONSUMED",
  RESUME: "RESUME",
  MESSAGE: "MESSAGE",
  USER_LEFT: "USER_LEFT",
  ERROR: "ERROR",
  NEW_PEER_PRODUCER: "NEW_PEER_PRODUCER",
  PRODUCERS_EXIST: "PRODUCERS_EXIST",
};
