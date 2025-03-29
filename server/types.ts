// Custom type declarations
import session from "express-session";

// Declare the SessionStore type
declare module "express-session" {
  interface SessionStore {
    all: (callback: (err: any, sessions?: session.SessionData[] | { [sid: string]: session.SessionData }) => void) => void;
    destroy: (sid: string, callback?: (err?: any) => void) => void;
    clear: (callback?: (err?: any) => void) => void;
    length: (callback: (err: any, length?: number) => void) => void;
    get: (sid: string, callback: (err: any, session?: session.SessionData | null) => void) => void;
    set: (sid: string, session: session.SessionData, callback?: (err?: any) => void) => void;
    touch: (sid: string, session: session.SessionData, callback?: (err?: any) => void) => void;
  }
}