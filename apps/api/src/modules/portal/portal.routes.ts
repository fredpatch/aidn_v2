import { Router, type RequestHandler } from "express";
import multer from "multer";

import {
  listPortalNotifications,
  markAllPortalNotificationsRead,
  markPortalNotificationRead,
} from "../notifications/notification.service.js";
import { listPortalMeetings } from "../meetings/meeting.service.js";

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
  downloadPortalDossierDocument,
  getPortalDossier,
  uploadCompletedPreEvaluationForm,
} from "../oma-phases/oma-phase.service.js";
import { downloadPortalFormalRequestTemplate } from "../document-templates/document-template.service.js";
import {
  registerFormalRequestCourrier,
  uploadFormalRequestSupportingDocument,
} from "../oma-phases/formal-request.service.js";
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

const handlePreEvalFormUpload: RequestHandler = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new HttpError(413, "File is too large"));
      return;
    }

    if (error) {
      next(error);
      return;
    }

    next();
  });
};

portalRouter.get(
  "/dossiers/:id",
  requireAuth({ scope: "portal" }),
  asyncHandler(async (req, res) => {
    res.json(await getPortalDossier(String(req.params.id), req.user!));
  }),
);

portalRouter.get(
  "/dossiers/:id/documents/:documentId",
  requireAuth({ scope: "portal" }),
  asyncHandler(async (req, res) => {
    const { buffer, mimeType, fileName } = await downloadPortalDossierDocument(
      String(req.params.id),
      String(req.params.documentId),
      req.user!,
    );
    res.set("Content-Type", mimeType);
    res.set("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.set("Content-Length", String(buffer.length));
    res.end(buffer);
  }),
);

portalRouter.post(
  "/dossiers/:id/preliminary/upload-pre-evaluation-form",
  requireAuth({ scope: "portal" }),
  handlePreEvalFormUpload,
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await uploadCompletedPreEvaluationForm(String(req.params.id), req.file, req.user!),
    );
  }),
);

portalRouter.post(
  "/dossiers/:id/phases/formal-request/courrier",
  requireAuth({ scope: "portal" }),
  handleCourrierUpload,
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await registerFormalRequestCourrier(
        String(req.params.id),
        req.file,
        {
          source: "portal_upload",
          officialReference:
            typeof req.body.officialReference === "string" ? req.body.officialReference : undefined,
          notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
        req.user!,
      ),
    );
  }),
);

portalRouter.get(
  "/document-templates/:id/download",
  requireAuth({ scope: "portal" }),
  asyncHandler(async (req, res) => {
    const { buffer, mimeType, fileName } = await downloadPortalFormalRequestTemplate(
      String(req.params.id),
      req.user!,
    );
    res.set("Content-Type", mimeType);
    res.set("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.set("Content-Length", String(buffer.length));
    res.end(buffer);
  }),
);

portalRouter.post(
  "/dossiers/:id/phases/formal-request/documents/:requirementId",
  requireAuth({ scope: "portal" }),
  handleCourrierUpload,
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await uploadFormalRequestSupportingDocument(
        String(req.params.id),
        String(req.params.requirementId),
        req.file,
        {
          source: "portal_upload",
          notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
        req.user!,
      ),
    );
  }),
);

portalRouter.post(
  "/requests/:id/submit",
  requireAuth({ scope: "portal" }),
  handleCourrierUpload,
  asyncHandler(async (req, res) => {
    res.json(
      await submitPortalRequest(
        String(req.params.id),
        {
          requestType: typeof req.body.requestType === "string" ? req.body.requestType : undefined,
          subject: typeof req.body.subject === "string" ? req.body.subject : undefined,
          message: typeof req.body.message === "string" ? req.body.message : undefined,
          courrierSource: typeof req.body.courrierSource === "string" ? req.body.courrierSource : undefined,
          plannedPhysicalDepositDate:
            typeof req.body.plannedPhysicalDepositDate === "string"
              ? req.body.plannedPhysicalDepositDate
              : undefined,
          expectedDepositDate:
            typeof req.body.expectedDepositDate === "string"
              ? req.body.expectedDepositDate
              : undefined,
          depositLocation:
            typeof req.body.depositLocation === "string"
              ? req.body.depositLocation
              : undefined,
          location: typeof req.body.location === "string" ? req.body.location : undefined,
          notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
        req.file,
        req.user!,
      ),
    );
  }),
);

portalRouter.get(
  "/meetings",
  requireAuth({ scope: "portal" }),
  asyncHandler(async (req, res) => {
    res.json(
      await listPortalMeetings(
        {
          from: typeof req.query.from === "string" ? req.query.from : undefined,
          to: typeof req.query.to === "string" ? req.query.to : undefined,
          status: typeof req.query.status === "string" ? req.query.status : undefined,
        },
        req.user!,
      ),
    );
  }),
);

portalRouter.get(
  "/notifications",
  requireAuth({ scope: "portal" }),
  asyncHandler(async (req, res) => {
    res.json(
      await listPortalNotifications(
        {
          status: typeof req.query.status === "string" ? req.query.status : undefined,
          limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
        },
        req.user!,
      ),
    );
  }),
);

portalRouter.post(
  "/notifications/read-all",
  requireAuth({ scope: "portal" }),
  asyncHandler(async (req, res) => {
    res.json(await markAllPortalNotificationsRead(req.user!));
  }),
);

portalRouter.post(
  "/notifications/:id/read",
  requireAuth({ scope: "portal" }),
  asyncHandler(async (req, res) => {
    res.json(
      await markPortalNotificationRead(String(req.params.id), req.user!),
    );
  }),
);
