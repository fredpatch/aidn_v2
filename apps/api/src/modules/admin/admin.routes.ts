import { Router } from "express";
import type { RequestHandler } from "express";
import multer from "multer";

import { requireAuth } from "../../shared/guards/auth.middleware.js";
import { requirePermission } from "../../shared/guards/permission.middleware.js";
import { HttpError } from "../../shared/errors/http-error.js";
import {
  Permissions,
  type Role,
} from "../../shared/permissions/permissions.js";
import { asyncHandler } from "../../shared/utils/async-handler.js";
import {
  approveAccountRequest,
  getAccountRequestDetails,
  listAccountRequests,
  listOrganizations,
  rejectAccountRequest,
} from "../account-requests/account-request.service.js";
import { listAuditLogs } from "../audit/audit.service.js";
import {
  downloadAdminRequestOrientationDocument,
  getAdminRequest,
  getPortalRequestMaxFileSizeBytes,
  listAdminRequests,
  markAdminRequestPrintedForDg,
  openAdminDossierDn,
  recordAdminRequestDgReturn,
  registerAdminPhysicalCourrier,
  requestAdminRequestCorrection,
  sendAdminRequestToDg,
  startAdminRequestIntake,
} from "../requests/request.service.js";
import {
  closePreliminaryPhase,
  downloadAdminDossierDocument,
  getAdminDossier,
  inviteFirstMeeting,
  invitePreliminaryMeeting,
  listAdminDossiers,
  publishPreEvaluationForm,
  recordFirstMeeting,
  recordPreEvalDgReturn,
  recordPreliminaryMeeting,
  sendPreEvalToDg,
  uploadClosureCourrier,
} from "../oma-phases/oma-phase.service.js";
import {
  getAdminFormalRequestPhase,
  recordFormalRequestDgDecision,
  recordFormalRequestDgReturn,
  registerFormalRequestCourrier,
  sendFormalRequestToDg,
} from "../oma-phases/formal-request.service.js";
import {
  createDocumentTemplate,
  listDocumentTemplates,
} from "../document-templates/document-template.service.js";
import {
  downloadDgCircuitTaskDocument,
  listDgCircuitTasks,
} from "../dg-circuit/dg-circuit.service.js";
import {
  activateInternalAccount,
  listInternalAccounts,
  listSiUsers,
  searchPersonnel,
} from "./admin.service.js";
import { resetTestData } from "./dev-reset.service.js";

export const adminRouter = Router();
const physicalCourrierUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getPortalRequestMaxFileSizeBytes() },
});
const handlePhysicalCourrierUpload: RequestHandler = (req, res, next) => {
  physicalCourrierUpload.single("file")(req, res, (error) => {
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
const handleDgReturnUpload: RequestHandler = (req, res, next) => {
  physicalCourrierUpload.single("returnedScannedDocument")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new HttpError(413, "DG return file is too large"));
      return;
    }

    if (error) {
      next(error);
      return;
    }

    next();
  });
};

adminRouter.use(requireAuth({ scope: "admin" }));

const requireAnyPermission =
  (permissions: Array<(typeof Permissions)[keyof typeof Permissions]>): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      next(new HttpError(401, "Authentication required"));
      return;
    }

    if (!permissions.some((permission) => req.user!.permissions.includes(permission))) {
      next(new HttpError(403, "Missing required permission"));
      return;
    }

    next();
  };

const requireDgCircuitTaskAccess = requireAnyPermission([
  Permissions.DG_CIRCUIT_HANDLE,
  Permissions.COURRIER_REGISTER_PHYSICAL,
  Permissions.PRE_EVAL_DG_CIRCUIT_HANDLE,
]);

/* Test connection to SI_ANAC Database */
adminRouter.get(
  "/si-users",
  requirePermission(Permissions.PERSONNEL_SEARCH),
  asyncHandler(async (req, res) => {
    const { q, limit, page, direction, fonction } = req.query;

    const result = await listSiUsers({
      q: q ? String(q) : undefined,
      limit: limit ? Number(limit) : 10,
      page: page ? Number(page) : 1,
      direction: direction ? String(direction) : undefined,
      fonction: fonction ? String(fonction) : undefined,
    });

    res.json(result);
  }),
);

adminRouter.get(
  "/personnel",
  requirePermission(Permissions.PERSONNEL_SEARCH),
  asyncHandler(async (req, res) => {
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 20;
    const page = typeof req.query.page === "string" ? Number(req.query.page) : 1;

    res.json(
      await searchPersonnel({
        search: String(req.query.search ?? ""),
        limit: Number.isFinite(limit) ? limit : 20,
        page: Number.isFinite(page) ? page : 1,
      }),
    );
  }),
);

adminRouter.get(
  "/internal-accounts",
  requirePermission(Permissions.AIDN_USER_ACTIVATE),
  asyncHandler(async (req, res) => {
    res.json({
      items: await listInternalAccounts({
        search:
          typeof req.query.search === "string" ? req.query.search : undefined,
        role: typeof req.query.role === "string" ? req.query.role : undefined,
        status:
          typeof req.query.status === "string" ? req.query.status : undefined,
      }),
    });
  }),
);

adminRouter.post(
  "/internal-accounts/activate",
  requirePermission(Permissions.AIDN_USER_ACTIVATE),
  asyncHandler(async (req, res) => {
    const body = req.body as { personnelId?: string; role?: Role };
    const result = await activateInternalAccount({
      personnelId: body.personnelId ?? "",
      role: body.role as Role,
      activatedById: req.user!.id,
      activatedByRole: req.user!.role,
    });

    res.status(201).json(result);
  }),
);

adminRouter.get(
  "/organizations",
  requirePermission(Permissions.ORGANIZATION_MANAGE),
  asyncHandler(async (req, res) => {
    res.json({
      items: await listOrganizations({
        search:
          typeof req.query.search === "string" ? req.query.search : undefined,
        status:
          typeof req.query.status === "string" ? req.query.status : undefined,
      }),
    });
  }),
);

adminRouter.get(
  "/requests",
  requirePermission(Permissions.REQUEST_VIEW_ALL),
  asyncHandler(async (req, res) => {
    res.json(
      await listAdminRequests({
        status: typeof req.query.status === "string" ? req.query.status : undefined,
        requestType: typeof req.query.requestType === "string" ? req.query.requestType : undefined,
        organizationId: typeof req.query.organizationId === "string" ? req.query.organizationId : undefined,
        submittedById: typeof req.query.submittedById === "string" ? req.query.submittedById : undefined,
        courrierSource: typeof req.query.courrierSource === "string" ? req.query.courrierSource : undefined,
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        from: typeof req.query.from === "string" ? req.query.from : undefined,
        to: typeof req.query.to === "string" ? req.query.to : undefined,
      }),
    );
  }),
);

adminRouter.get(
  "/dg-circuit/tasks",
  requireDgCircuitTaskAccess,
  asyncHandler(async (req, res) => {
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    res.json(
      await listDgCircuitTasks(
        {
          bucket: typeof req.query.bucket === "string" ? req.query.bucket : undefined,
          source: typeof req.query.source === "string" ? req.query.source : undefined,
          search: typeof req.query.search === "string" ? req.query.search : undefined,
          limit: Number.isFinite(limit) ? limit : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.get(
  "/dg-circuit/tasks/:taskId/documents/:documentId",
  requireDgCircuitTaskAccess,
  asyncHandler(async (req, res) => {
    const { buffer, mimeType, fileName } = await downloadDgCircuitTaskDocument(
      String(req.params.taskId),
      String(req.params.documentId),
      req.user!,
    );
    res.set("Content-Type", mimeType);
    res.set("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.set("Content-Length", String(buffer.length));
    res.end(buffer);
  }),
);

adminRouter.get(
  "/requests/:id",
  requirePermission(Permissions.REQUEST_VIEW_ALL),
  asyncHandler(async (req, res) => {
    res.json(await getAdminRequest(String(req.params.id), req.user!));
  }),
);

adminRouter.get(
  "/requests/:id/documents/:documentId",
  requirePermission(Permissions.REQUEST_VIEW_ALL),
  asyncHandler(async (req, res) => {
    const { buffer, mimeType, fileName } = await downloadAdminRequestOrientationDocument(
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

adminRouter.post(
  "/requests/:id/start-intake",
  requirePermission(Permissions.REQUEST_INTAKE_REVIEW),
  asyncHandler(async (req, res) => {
    res.json(await startAdminRequestIntake(String(req.params.id), req.body, req.user!));
  }),
);

adminRouter.post(
  "/requests/:id/open-dossier-dn",
  requirePermission(Permissions.REQUEST_INTAKE_REVIEW),
  asyncHandler(async (req, res) => {
    res.status(201).json(await openAdminDossierDn(String(req.params.id), req.body, req.user!));
  }),
);

adminRouter.post(
  "/requests/:id/request-correction",
  requirePermission(Permissions.REQUEST_INTAKE_REVIEW),
  asyncHandler(async (req, res) => {
    res.json(await requestAdminRequestCorrection(String(req.params.id), req.body, req.user!));
  }),
);

adminRouter.post(
  "/requests/:id/register-physical-courrier",
  requirePermission(Permissions.COURRIER_REGISTER_PHYSICAL),
  handlePhysicalCourrierUpload,
  asyncHandler(async (req, res) => {
    res.json(
      await registerAdminPhysicalCourrier(
        String(req.params.id),
        req.file,
        {
          physicalDepositDate:
            typeof req.body.physicalDepositDate === "string"
              ? req.body.physicalDepositDate
              : undefined,
          officialReference:
            typeof req.body.officialReference === "string"
              ? req.body.officialReference
              : undefined,
          notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/requests/:id/mark-printed-for-dg",
  requirePermission(Permissions.DG_CIRCUIT_HANDLE),
  asyncHandler(async (req, res) => {
    res.json(await markAdminRequestPrintedForDg(String(req.params.id), req.body, req.user!));
  }),
);

adminRouter.post(
  "/requests/:id/record-dg-return",
  requirePermission(Permissions.DG_CIRCUIT_HANDLE),
  handleDgReturnUpload,
  asyncHandler(async (req, res) => {
    res.json(
      await recordAdminRequestDgReturn(
        String(req.params.id),
        req.file,
        {
          decision: typeof req.body.decision === "string" ? req.body.decision : undefined,
          returnedAt: typeof req.body.returnedAt === "string" ? req.body.returnedAt : undefined,
          observations: typeof req.body.observations === "string" ? req.body.observations : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/requests/:id/send-to-dg",
  requirePermission(Permissions.DG_CIRCUIT_HANDLE),
  asyncHandler(async (req, res) => {
    res.json(await sendAdminRequestToDg(String(req.params.id), req.body, req.user!));
  }),
);

adminRouter.get(
  "/account-requests",
  requirePermission(Permissions.POSTULANT_ACCOUNT_REVIEW),
  asyncHandler(async (req, res) => {
    res.json({
      items: await listAccountRequests({
        status:
          typeof req.query.status === "string" ? req.query.status : undefined,
        search:
          typeof req.query.search === "string" ? req.query.search : undefined,
        from: typeof req.query.from === "string" ? req.query.from : undefined,
        to: typeof req.query.to === "string" ? req.query.to : undefined,
      }),
    });
  }),
);

adminRouter.get(
  "/account-requests/:id",
  requirePermission(Permissions.POSTULANT_ACCOUNT_REVIEW),
  asyncHandler(async (req, res) => {
    res.json({ request: await getAccountRequestDetails(String(req.params.id)) });
  }),
);

adminRouter.post(
  "/account-requests/:id/approve",
  requirePermission(Permissions.POSTULANT_ACCOUNT_REVIEW),
  asyncHandler(async (req, res) => {
    res.json(
      await approveAccountRequest(String(req.params.id), req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role,
      }),
    );
  }),
);

adminRouter.post(
  "/account-requests/:id/reject",
  requirePermission(Permissions.POSTULANT_ACCOUNT_REVIEW),
  asyncHandler(async (req, res) => {
    res.json(
      await rejectAccountRequest(String(req.params.id), req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role,
      }),
    );
  }),
);

const handleOmaDocumentUpload: RequestHandler = (req, res, next) => {
  physicalCourrierUpload.single("file")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new HttpError(413, "Document file is too large"));
      return;
    }

    if (error) {
      next(error);
      return;
    }

    next();
  });
};

adminRouter.get(
  "/dossiers",
  requirePermission(Permissions.DOSSIER_VIEW_ALL),
  asyncHandler(async (req, res) => {
    res.json(
      await listAdminDossiers(
        {
          status: typeof req.query.status === "string" ? req.query.status : undefined,
          dossierType: typeof req.query.dossierType === "string" ? req.query.dossierType : undefined,
          search: typeof req.query.search === "string" ? req.query.search : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.get(
  "/dossiers/:id",
  requirePermission(Permissions.DOSSIER_VIEW_ALL),
  asyncHandler(async (req, res) => {
    res.json(await getAdminDossier(String(req.params.id), req.user!));
  }),
);

adminRouter.get(
  "/dossiers/:id/phases/formal-request",
  requirePermission(Permissions.DOSSIER_VIEW_ALL),
  asyncHandler(async (req, res) => {
    res.json(await getAdminFormalRequestPhase(String(req.params.id), req.user!));
  }),
);

adminRouter.post(
  "/dossiers/:id/phases/formal-request/courrier",
  requirePermission(Permissions.DOCUMENT_UPLOAD_INTERNAL),
  handleOmaDocumentUpload,
  asyncHandler(async (req, res) => {
    const source = typeof req.body.source === "string" ? req.body.source : undefined;
    if (source !== "physical_deposit" && source !== "internal_scan") {
      throw new HttpError(400, "source doit être physical_deposit ou internal_scan.");
    }
    res.status(201).json(
      await registerFormalRequestCourrier(
        String(req.params.id),
        req.file,
        {
          source,
          officialReference:
            typeof req.body.officialReference === "string" ? req.body.officialReference : undefined,
          physicalDepositDate:
            typeof req.body.physicalDepositDate === "string" ? req.body.physicalDepositDate : undefined,
          notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/phases/formal-request/send-to-dg",
  requirePermission(Permissions.DG_CIRCUIT_HANDLE),
  asyncHandler(async (req, res) => {
    res.status(201).json(await sendFormalRequestToDg(String(req.params.id), req.user!));
  }),
);

adminRouter.post(
  "/dossiers/:id/phases/formal-request/dg-return",
  requirePermission(Permissions.DG_CIRCUIT_HANDLE),
  handleOmaDocumentUpload,
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await recordFormalRequestDgReturn(
        String(req.params.id),
        req.user!,
        req.file,
        {
          returnedFromDgAt:
            typeof req.body.returnedFromDgAt === "string" ? req.body.returnedFromDgAt : undefined,
          officialReference:
            typeof req.body.officialReference === "string" ? req.body.officialReference : undefined,
          notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
      ),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/phases/formal-request/dg-decision",
  requirePermission(Permissions.DG_DECISION_RECORD),
  asyncHandler(async (req, res) => {
    const decision = req.body.decision as string;
    if (!["approved", "rejected", "reoriented", "pending"].includes(decision)) {
      throw new HttpError(400, "decision doit être approved, rejected, reoriented ou pending.");
    }
    res.status(201).json(
      await recordFormalRequestDgDecision(
        String(req.params.id),
        req.user!,
        {
          decision: decision as "approved" | "rejected" | "reoriented" | "pending",
          orientedDirection:
            typeof req.body.orientedDirection === "string" ? req.body.orientedDirection : undefined,
          observations:
            typeof req.body.observations === "string" ? req.body.observations : undefined,
          decisionRecordedAt:
            typeof req.body.decisionRecordedAt === "string" ? req.body.decisionRecordedAt : undefined,
        },
      ),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/preliminary/invite-first-meeting",
  requirePermission(Permissions.MEETING_MANAGE),
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await inviteFirstMeeting(
        String(req.params.id),
        {
          scheduledAt: typeof req.body.scheduledAt === "string" ? req.body.scheduledAt : undefined,
          location: typeof req.body.location === "string" ? req.body.location : undefined,
          notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/preliminary/record-first-meeting",
  requirePermission(Permissions.MEETING_MANAGE),
  handleOmaDocumentUpload,
  asyncHandler(async (req, res) => {
    res.json(
      await recordFirstMeeting(
        String(req.params.id),
        req.file,
        {
          notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
          visibleToPostulant: req.body.visibleToPostulant === "true",
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/preliminary/publish-pre-evaluation-form",
  requirePermission(Permissions.DOCUMENT_UPLOAD_INTERNAL),
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await publishPreEvaluationForm(String(req.params.id), req.user!),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/preliminary/send-pre-eval-to-dg",
  requirePermission(Permissions.PRE_EVAL_DG_CIRCUIT_HANDLE),
  asyncHandler(async (req, res) => {
    res.json(
      await sendPreEvalToDg(
        String(req.params.id),
        {
          sentAt: typeof req.body.sentAt === "string" ? req.body.sentAt : undefined,
          notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/preliminary/record-pre-eval-dg-return",
  requirePermission(Permissions.PRE_EVAL_DG_CIRCUIT_HANDLE),
  handleOmaDocumentUpload,
  asyncHandler(async (req, res) => {
    res.json(
      await recordPreEvalDgReturn(
        String(req.params.id),
        req.file,
        {
          returnedAt: typeof req.body.returnedAt === "string" ? req.body.returnedAt : undefined,
          notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.get(
  "/dossiers/:id/documents/:documentId",
  requirePermission(Permissions.DOSSIER_VIEW_ALL),
  asyncHandler(async (req, res) => {
    const { buffer, mimeType, fileName } = await downloadAdminDossierDocument(
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

adminRouter.post(
  "/dossiers/:id/preliminary/invite-preliminary-meeting",
  requirePermission(Permissions.MEETING_MANAGE),
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await invitePreliminaryMeeting(
        String(req.params.id),
        {
          scheduledAt: typeof req.body.scheduledAt === "string" ? req.body.scheduledAt : undefined,
          location: typeof req.body.location === "string" ? req.body.location : undefined,
          notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/preliminary/record-preliminary-meeting",
  requirePermission(Permissions.MEETING_MANAGE),
  handleOmaDocumentUpload,
  asyncHandler(async (req, res) => {
    res.json(
      await recordPreliminaryMeeting(
        String(req.params.id),
        req.file,
        { notes: typeof req.body.notes === "string" ? req.body.notes : undefined },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/preliminary/upload-closure-courrier",
  requirePermission(Permissions.DOCUMENT_UPLOAD_INTERNAL),
  handleOmaDocumentUpload,
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await uploadClosureCourrier(
        String(req.params.id),
        req.file,
        { title: typeof req.body.title === "string" ? req.body.title : undefined },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/preliminary/close",
  requirePermission(Permissions.PHASE_CLOSE),
  asyncHandler(async (req, res) => {
    res.json(await closePreliminaryPhase(String(req.params.id), req.user!));
  }),
);

adminRouter.get(
  "/audit-logs",
  requirePermission(Permissions.AUDIT_VIEW),
  asyncHandler(async (req, res) => {
    const limit =
      typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const page =
      typeof req.query.page === "string" ? Number(req.query.page) : undefined;

    res.json(
      await listAuditLogs({
        action:
          typeof req.query.action === "string" ? req.query.action : undefined,
        actorId:
          typeof req.query.actorId === "string" ? req.query.actorId : undefined,
        limit: Number.isFinite(limit) ? limit : undefined,
        page: Number.isFinite(page) ? page : undefined,
      }),
    );
  }),
);

adminRouter.get(
  "/document-templates",
  requirePermission(Permissions.DOCUMENT_UPLOAD_INTERNAL),
  asyncHandler(async (req, res) => {
    res.json(
      await listDocumentTemplates(
        {
          documentType: typeof req.query.documentType === "string" ? req.query.documentType : undefined,
          isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/document-templates",
  requirePermission(Permissions.DOCUMENT_UPLOAD_INTERNAL),
  handleOmaDocumentUpload,
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await createDocumentTemplate(
        req.file,
        {
          code: typeof req.body.code === "string" ? req.body.code : "",
          title: typeof req.body.title === "string" ? req.body.title : "",
          documentType: typeof req.body.documentType === "string" ? req.body.documentType : "",
          phaseKey: typeof req.body.phaseKey === "string" ? req.body.phaseKey : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/dev/reset-test-data",
  requirePermission(Permissions.DEV_DATA_RESET),
  asyncHandler(async (req, res) => {
    res.json(
      await resetTestData(
        {
          confirmation: typeof req.body.confirmation === "string" ? req.body.confirmation : "",
          deleteUploadedFiles: req.body.deleteUploadedFiles === true,
          includeAuditLogs: req.body.includeAuditLogs !== false,
          includeNotifications: req.body.includeNotifications !== false,
        },
        req.user!,
      ),
    );
  }),
);
