// Minimal ambient declarations to unblock TypeScript builds without external @types packages.

declare module 'cors' {
  const cors: any;
  export = cors;
}

declare module 'cookie-parser' {
  const cookieParser: any;
  export = cookieParser;
}

declare module 'multer' {
  const multer: any;
  export = multer;
}

declare module 'express-session' {
  const session: any;
  export = session;
}

declare module 'passport' {
  const passport: any;
  export = passport;
}

declare module 'passport-local' {
  export class Strategy {
    constructor(...args: any[]);
  }
  const Strategy: any;
  export default Strategy;
}

declare module 'bcryptjs' {
  const bcrypt: any;
  export = bcrypt;
}

declare module 'connect-pg-simple' {
  const connectPgSimple: any;
  export = connectPgSimple;
}

declare module 'archiver' {
  const archiver: any;
  export = archiver;
}

declare namespace Express {
  namespace Multer {
    interface File {
      [key: string]: any;
    }
  }

  interface Multer {} // placeholder type

  interface Request {
    user?: any;
    session?: any;
    sessionID?: string;
    file?: Multer.File;
    files?: Multer.File[] | Record<string, Multer.File[]> | any;
    isAuthenticated?: () => boolean;
    login?: (user: any, cb: (err?: any) => void) => void;
    logout?: (cb?: (err?: any) => void) => void;
  }
}
