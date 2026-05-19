import express, { Application } from "express";
import helmet from "helmet";
import cors, { CorsOptions } from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

type MiddlewareInitOptions = {
  cors?: {
    allowlist?: string[];
    allowNoOrigin?: boolean;
    credentials?: boolean;
  };
  disablePoweredBy?: boolean;
  trustProxy?: number | boolean;
  bodyLimit?: string;
  urlencodedLimit?: string;
  helmetOptions?: Parameters<typeof helmet>[0];
};

const buildCorsOptions = (
  corsOptions: MiddlewareInitOptions["cors"],
): CorsOptions => {
  const allowlist = corsOptions?.allowlist ?? [];
  const allowNoOrigin = corsOptions?.allowNoOrigin ?? true;
  const credentials = corsOptions?.credentials ?? true;

  return {
    origin(origin, callback) {
      if (!origin) {
        return allowNoOrigin
          ? callback(null, true)
          : callback(new Error("CORS origin missing"), false);
      }

      if (allowlist.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials,
  };
};

export const middlewares = (
  app: Application,
  options: MiddlewareInitOptions = {},
) => {
  const isDev = process.env.NODE_ENV !== "production";
  const bodyLimit = options.bodyLimit ?? "5mb";
  const urlencodedLimit = options.urlencodedLimit ?? "5mb";
  const trustProxy = options.trustProxy ?? 1;

  app.set("trust proxy", trustProxy);

  if (options.disablePoweredBy) {
    app.disable("x-powered-by");
  }

  app.use(
    helmet(
      options.helmetOptions ?? {
        referrerPolicy: { policy: "no-referrer" },
      },
    ),
  );

  app.use(cors(buildCorsOptions(options.cors)));

  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ extended: false, limit: urlencodedLimit }));

  app.use(morgan(isDev ? "dev" : "combined"));

  app.use(cookieParser());
};
