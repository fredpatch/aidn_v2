import { Router, type RequestHandler } from "express";
import multer from "multer";

import { submitAccountRequest } from "../account-requests/account-request.service.js";
import {
  getCurrentPortalUser,
  loginPortalUser,
} from "../auth/auth.service.js";
import { clearAuthCookie, setAuthCookie } from "../auth/auth.cookies.js";
import {
  clearCsrfCookie,
  generateCsrfToken,
  setCsrfCookie,
} from "../auth/auth.csrf.js";
import { requireAuth } from "../../shared/guards/auth.middleware.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import { publicAccountRequestRateLimit } from "./portal-rate-limit.middleware.js";
import {
  createPortalRequest,
  declarePortalPhysicalDeposit,
  getPortalRequest,
  getPortalRequestMaxFileSizeBytes,
  listPortalRequests,
  submitPortalRequest,
  updatePortalRequest,
  uploadPortalRequestCourrier,
} from "../requests/request.service.js";

export const portalRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getPortalRequestMaxFileSizeBytes() },
});
const handleCourrierUpload: RequestHandler = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new HttpError(413, "Courrier file is too large"));
      return;
    }

    if (error) {
      next(error);
      return;
    }

    next();
  });
};

portalRouter.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    const result = await loginPortalUser(email ?? "", password ?? "");
    setAuthCookie(res, result.token, "portal");
    setCsrfCookie(res, generateCsrfToken(), "portal");
    res.json({
      user: result.user,
    });
  }),
);

portalRouter.get(
  "/auth/me",
  requireAuth({ scope: "portal" }),
  asyncHandler(async (req, res) => {
    res.json(await getCurrentPortalUser(req.user!.id));
  }),
);

portalRouter.post(
  "/auth/logout",
  asyncHandler(async (_req, res) => {
    clearAuthCookie(res, "portal");
    clearCsrfCookie(res, "portal");
    res.json({ ok: true });
  }),
);

portalRouter.post(
  "/account-requests",
  publicAccountRequestRateLimit,
  asyncHandler(async (req, res) => {
    const result = await submitAccountRequest(req.body);
    res.status(201).json(result);
  }),
);

portalRouter.post(
  "/requests",
  requireAuth({ scope: "portal" }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createPortalRequest(req.body, req.user!));
  }),
);

portalRouter.get(
  "/requests",
  requireAuth({ scope: "portal" }),
  asyncHandler(async (req, res) => {
    res.json(
      await listPortalRequests(
        {
          status: typeof req.query.status === "string" ? req.query.status : undefined,
          requestType: typeof req.query.requestType === "string" ? req.query.requestType : undefined,
          search: typeof req.query.search === "string" ? req.query.search : undefined,
          from: typeof req.query.from === "string" ? req.query.from : undefined,
          to: typeof req.query.to === "string" ? req.query.to : undefined,
        },
        req.user!,
      ),
    );
  }),
);

portalRouter.get(
  "/requests/:id",
  requireAuth({ scope: "portal" }),
  asyncHandler(async (req, res) => {
    res.json(await getPortalRequest(String(req.params.id), req.user!));
  }),
);

portalRouter.patch(
  "/requests/:id",
  requireAuth({ scope: "portal" }),
  asyncHandler(async (req, res) => {
    res.json(await updatePortalRequest(String(req.params.id), req.body, req.user!));
  }),
);

portalRouter.post(
  "/requests/:id/courrier",
  requireAuth({ scope: "portal" }),
  handleCourrierUpload,
  asyncHandler(async (req, res) => {
    res.json(
      await uploadPortalRequestCourrier(
        String(req.params.id),
        req.file,
        { notes: typeof req.body.notes === "string" ? req.body.notes : undefined },
        req.user!,
      ),
    );
  }),
);

portalRouter.post(
  "/requests/:id/physical-deposit",
  requireAuth({ scope: "portal" }),
  asyncHandler(async (req, res) => {
    res.json(await declarePortalPhysicalDeposit(String(req.params.id), req.body, req.user!));
  }),
);

portalRouter.post(
  "/requests/:id/submit",
  requireAuth({ scope: "portal" }),
  asyncHandler(async (req, res) => {
    res.json(await submitPortalRequest(String(req.params.id), req.user!));
  }),
);
