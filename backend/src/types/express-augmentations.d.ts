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
  const passportLocal: any;
  export = passportLocal;
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
  interface Multer {} // placeholder so references to Express.Multer compile

  interface Request {
    user?: any;
    session?: any;
    sessionID?: string;
    file?: any;
    files?: any;
    isAuthenticated?: () => boolean;
    login?: (user: any, cb: (err?: any) => void) => void;
    logout?: (cb?: (err?: any) => void) => void;
  }
}
