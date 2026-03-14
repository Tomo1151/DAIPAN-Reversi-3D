export const SIGNALING_TYPES = {
  CREATE_ROOM: "create_room",
  ROOM_CREATED: "room_created",
  LIST_ROOMS: "list_rooms",
  ROOM_LIST: "room_list",
  JOIN_ROOM: "join_room",
  ROOM_JOINED: "room_joined",
  PEER_JOINED: "peer_joined",
  PEER_LEFT: "peer_left",
  SIGNAL: "signal",
  ERROR: "error",
};

export const P2P_TYPES = {
  MATCH_START: "match_start",
  ACTION_PUT: "action_put",
  ACTION_BANG_PREVIEW: "action_bang_preview",
  ACTION_BANG_RESULT: "action_bang_result",
  ACTION_PASS: "action_pass",
  ACTION_RESTART: "action_restart",
  STATE_SYNC: "state_sync",
  PING: "ping",
  PONG: "pong",
};

export function createActionMessage(type, payload, seq, matchId, senderRole) {
  return {
    type,
    payload,
    seq,
    matchId,
    senderRole,
    timestamp: Date.now(),
  };
}
