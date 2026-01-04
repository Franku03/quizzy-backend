import { HostUserEvents } from "../enums/websocket.events.enum";

export interface SessionClosed {

      reason: HostUserEvents.HOST_END_SESSION,
      message: string
      
}