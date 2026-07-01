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
} from "../oma-phases/index.js";
import {
  createFormalMeeting,
  getAdminFormalRequestPhase,
  markFormalMeetingHeld,
  recordFormalRequestDgDecision,
  recordFormalRequestDgReturn,
  registerFormalRequestCourrier,
  sendFormalRequestToDg,
  uploadFormalMeetingReport,
  uploadFormalRequestSupportingDocument,
  reviewFormalRequestDocumentSubmission,
  uploadFormalRecevabilityCourrier,
  uploadFormalClosureCourrier,
  closeFormalRequestPhase,
} from "../oma-phases/index.js";
import {
  createDocumentTemplate,
  listDocumentTemplates,
} from "../document-templates/document-template.service.js";
import { seedFormalRequestDocumentRequirements } from "../documents/document-requirement.seed.js";
import { dgCircuitRouter } from "../dg-circuit/dg-circuit.routes.js";
import { getAdminDashboardSummary } from "../dashboard/dashboard.service.js";
import {
  closeDocumentEvaluationPhase,
  getDocumentEvaluationPaymentState,
  getDocumentEvaluations,
  reviewDocumentEvaluation,
  uploadStudyFeeInvoice,
  validateStudyFeePaymentProof,
} from "../oma-phases/index.js";
import {
  closeInspectionPhase,
  getInspectionPaymentState,
  recordR3Avis,
  uploadAuditFeeInvoice,
  validateAuditFeePaymentProof,
} from "../oma-phases/index.js";
import {
  listPhasePaymentTasks,
  type PhasePaymentTaskFilters,
} from "../payments/phase-payment.service.js";
import {
  activateInternalAccount,
  disableInternalAccount,
  listInternalAccounts,
  listSiUsers,
  reactivateInternalAccount,
  resetInternalAccountPassword,
  searchPersonnel,
  updateInternalAccountRole,
} from "./admin.service.js";
import { resetTestData } from "./dev-reset.service.js";

export const adminRouter = Router();
const physicalCourrierUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getPortalRequestMaxFileSizeBytes() },
});
const handlePhysicalCourrierUpload: RequestHandler = (req, res, next) => {
  physicalCourrierUpload.single("file")(req, res, (error) => {
    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
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
  physicalCourrierUpload.single("returnedScannedDocument")(
    req,
    res,
    (error) => {
      if (
        error instanceof multer.MulterError &&
        error.code === "LIMIT_FILE_SIZE"
      ) {
        next(new HttpError(413, "DG return file is too large"));
        return;
      }

      if (error) {
        next(error);
        return;
      }

      next();
    },
  );
};

adminRouter.use(requireAuth({ scope: "admin" }));

adminRouter.get(
  "/dashboard",
  requirePermission(Permissions.REPORT_VIEW),
  asyncHandler(async (req, res) => {
    res.json(
      await getAdminDashboardSummary(
        {
          preset:
            typeof req.query.preset === "string" ? req.query.preset : undefined,
          from: typeof req.query.from === "string" ? req.query.from : undefined,
          to: typeof req.query.to === "string" ? req.query.to : undefined,
        },
        req.user!,
      ),
    );
  }),
);

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
    const limit =
      typeof req.query.limit === "string" ? Number(req.query.limit) : 20;
    const page =
      typeof req.query.page === "string" ? Number(req.query.page) : 1;

    // console.log("Searching personnel with query:", req.query);

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
    const body = req.body as {
      personnelId?: string;
      matricule?: string;
      role?: Role;
    };
    const matricule = body.matricule ?? body.personnelId ?? "";

    const result = await activateInternalAccount({
      matricule,
      role: body.role as Role,
      activatedById: req.user!.id,
      activatedByRole: req.user!.role,
    });

    res.status(201).json(result);
  }),
);

adminRouter.post(
  "/internal-accounts/:id/reset-password",
  requirePermission(Permissions.AIDN_USER_ACTIVATE),
  asyncHandler(async (req, res) => {
    res.json(
      await resetInternalAccountPassword({
        accountId: String(req.params.id),
        actorId: req.user!.id,
        actorRole: req.user!.role,
      }),
    );
  }),
);

adminRouter.patch(
  "/internal-accounts/:id/role",
  requirePermission(Permissions.AIDN_USER_ACTIVATE),
  asyncHandler(async (req, res) => {
    const body = req.body as { role?: Role };

    res.json(
      await updateInternalAccountRole({
        accountId: String(req.params.id),
        role: body.role as Role,
        actorId: req.user!.id,
        actorRole: req.user!.role,
      }),
    );
  }),
);

adminRouter.post(
  "/internal-accounts/:id/disable",
  requirePermission(Permissions.AIDN_USER_ACTIVATE),
  asyncHandler(async (req, res) => {
    res.json(
      await disableInternalAccount({
        accountId: String(req.params.id),
        actorId: req.user!.id,
        actorRole: req.user!.role,
      }),
    );
  }),
);

adminRouter.post(
  "/internal-accounts/:id/reactivate",
  requirePermission(Permissions.AIDN_USER_ACTIVATE),
  asyncHandler(async (req, res) => {
    res.json(
      await reactivateInternalAccount({
        accountId: String(req.params.id),
        actorId: req.user!.id,
        actorRole: req.user!.role,
      }),
    );
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
        status:
          typeof req.query.status === "string" ? req.query.status : undefined,
        requestType:
          typeof req.query.requestType === "string"
            ? req.query.requestType
            : undefined,
        organizationId:
          typeof req.query.organizationId === "string"
            ? req.query.organizationId
            : undefined,
        submittedById:
          typeof req.query.submittedById === "string"
            ? req.query.submittedById
            : undefined,
        courrierSource:
          typeof req.query.courrierSource === "string"
            ? req.query.courrierSource
            : undefined,
        search:
          typeof req.query.search === "string" ? req.query.search : undefined,
        from: typeof req.query.from === "string" ? req.query.from : undefined,
        to: typeof req.query.to === "string" ? req.query.to : undefined,
      }),
    );
  }),
);

adminRouter.use("/dg-circuit", dgCircuitRouter);

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
    const { buffer, mimeType, fileName } =
      await downloadAdminRequestOrientationDocument(
        String(req.params.id),
        String(req.params.documentId),
        req.user!,
      );
    res.set("Content-Type", mimeType);
    res.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );
    res.set("Content-Length", String(buffer.length));
    res.end(buffer);
  }),
);

adminRouter.post(
  "/requests/:id/start-intake",
  requirePermission(Permissions.REQUEST_INTAKE_REVIEW),
  asyncHandler(async (req, res) => {
    res.json(
      await startAdminRequestIntake(String(req.params.id), req.body, req.user!),
    );
  }),
);

adminRouter.post(
  "/requests/:id/open-dossier-dn",
  requirePermission(Permissions.REQUEST_INTAKE_REVIEW),
  asyncHandler(async (req, res) => {
    res
      .status(201)
      .json(
        await openAdminDossierDn(String(req.params.id), req.body, req.user!),
      );
  }),
);

adminRouter.post(
  "/requests/:id/request-correction",
  requirePermission(Permissions.REQUEST_INTAKE_REVIEW),
  asyncHandler(async (req, res) => {
    res.json(
      await requestAdminRequestCorrection(
        String(req.params.id),
        req.body,
        req.user!,
      ),
    );
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
          notes:
            typeof req.body.notes === "string" ? req.body.notes : undefined,
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
    res.json(
      await markAdminRequestPrintedForDg(
        String(req.params.id),
        req.body,
        req.user!,
      ),
    );
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
          returnedAt:
            typeof req.body.returnedAt === "string"
              ? req.body.returnedAt
              : undefined,
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
    res.json(
      await sendAdminRequestToDg(String(req.params.id), req.body, req.user!),
    );
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
    res.json({
      request: await getAccountRequestDetails(String(req.params.id)),
    });
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
    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
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
          status:
            typeof req.query.status === "string" ? req.query.status : undefined,
          dossierType:
            typeof req.query.dossierType === "string"
              ? req.query.dossierType
              : undefined,
          search:
            typeof req.query.search === "string" ? req.query.search : undefined,
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
    res.json(
      await getAdminFormalRequestPhase(String(req.params.id), req.user!),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/phases/formal-request/courrier",
  requirePermission(Permissions.DOCUMENT_UPLOAD_INTERNAL),
  handleOmaDocumentUpload,
  asyncHandler(async (req, res) => {
    const source =
      typeof req.body.source === "string" ? req.body.source : undefined;
    if (source !== "physical_deposit" && source !== "internal_scan") {
      throw new HttpError(
        400,
        "source doit être physical_deposit ou internal_scan.",
      );
    }
    res.status(201).json(
      await registerFormalRequestCourrier(
        String(req.params.id),
        req.file,
        {
          source,
          officialReference:
            typeof req.body.officialReference === "string"
              ? req.body.officialReference
              : undefined,
          physicalDepositDate:
            typeof req.body.physicalDepositDate === "string"
              ? req.body.physicalDepositDate
              : undefined,
          notes:
            typeof req.body.notes === "string" ? req.body.notes : undefined,
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
    res
      .status(201)
      .json(await sendFormalRequestToDg(String(req.params.id), req.user!));
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
            typeof req.body.returnedFromDgAt === "string"
              ? req.body.returnedFromDgAt
              : undefined,
          officialReference:
            typeof req.body.officialReference === "string"
              ? req.body.officialReference
              : undefined,
          notes:
            typeof req.body.notes === "string" ? req.body.notes : undefined,
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
      throw new HttpError(
        400,
        "decision doit être approved, rejected, reoriented ou pending.",
      );
    }
    res.status(201).json(
      await recordFormalRequestDgDecision(String(req.params.id), req.user!, {
        decision: decision as
          | "approved"
          | "rejected"
          | "reoriented"
          | "pending",
        orientedDirection:
          typeof req.body.orientedDirection === "string"
            ? req.body.orientedDirection
            : undefined,
        observations:
          typeof req.body.observations === "string"
            ? req.body.observations
            : undefined,
        decisionRecordedAt:
          typeof req.body.decisionRecordedAt === "string"
            ? req.body.decisionRecordedAt
            : undefined,
      }),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/phases/formal-request/meeting",
  requirePermission(Permissions.MEETING_MANAGE),
  asyncHandler(async (req, res) => {
    const outlookStatus =
      typeof req.body.outlookEmailStatus === "string"
        ? (req.body.outlookEmailStatus as
            | "not_required"
            | "to_be_sent_manually"
            | "sent_manually")
        : undefined;
    res.status(201).json(
      await createFormalMeeting(String(req.params.id), req.user!, {
        scheduledAt:
          typeof req.body.scheduledAt === "string"
            ? req.body.scheduledAt
            : undefined,
        location:
          typeof req.body.location === "string" ? req.body.location : undefined,
        notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
        outlookEmailStatus: outlookStatus,
        outlookEmailSentAt:
          typeof req.body.outlookEmailSentAt === "string"
            ? req.body.outlookEmailSentAt
            : undefined,
      }),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/phases/formal-request/meeting/mark-held",
  requirePermission(Permissions.MEETING_MANAGE),
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await markFormalMeetingHeld(String(req.params.id), req.user!, {
        heldAt:
          typeof req.body.heldAt === "string" ? req.body.heldAt : undefined,
        notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
      }),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/phases/formal-request/meeting-report",
  requirePermission(Permissions.DOCUMENT_UPLOAD_INTERNAL),
  handleOmaDocumentUpload,
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await uploadFormalMeetingReport(
        String(req.params.id),
        req.user!,
        req.file,
        {
          notes:
            typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
      ),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/phases/formal-request/documents/:requirementId",
  requirePermission(Permissions.DOCUMENT_UPLOAD_INTERNAL),
  handleOmaDocumentUpload,
  asyncHandler(async (req, res) => {
    const source =
      typeof req.body.source === "string" ? req.body.source : undefined;
    if (source !== "physical_deposit" && source !== "internal_scan") {
      throw new HttpError(
        400,
        "source doit être physical_deposit ou internal_scan.",
      );
    }
    res.status(201).json(
      await uploadFormalRequestSupportingDocument(
        String(req.params.id),
        String(req.params.requirementId),
        req.file,
        {
          source,
          notes:
            typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/phases/formal-request/recevability-courrier",
  requirePermission(Permissions.DOCUMENT_UPLOAD_INTERNAL),
  handleOmaDocumentUpload,
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await uploadFormalRecevabilityCourrier(
        String(req.params.id),
        req.file,
        {
          officialReference:
            typeof req.body.officialReference === "string"
              ? req.body.officialReference
              : undefined,
          notes:
            typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/phases/formal-request/closure-courrier",
  requirePermission(Permissions.DOCUMENT_UPLOAD_INTERNAL),
  handleOmaDocumentUpload,
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await uploadFormalClosureCourrier(
        String(req.params.id),
        req.file,
        {
          officialReference:
            typeof req.body.officialReference === "string"
              ? req.body.officialReference
              : undefined,
          notes:
            typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/phases/formal-request/close",
  requirePermission(Permissions.PHASE_CLOSE),
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await closeFormalRequestPhase(String(req.params.id), req.user!, {
        notes: typeof req.body.notes === "string" ? req.body.notes : undefined,
        completeness:
          req.body.completeness === "partial" ||
          req.body.completeness === "complete"
            ? (req.body.completeness as "complete" | "partial")
            : undefined,
        comment:
          typeof req.body.comment === "string" ? req.body.comment : undefined,
      }),
    );
  }),
);

// ── Phase 3 — Évaluation approfondie: payment routes ─────────────────────────

adminRouter.get(
  "/dossiers/:id/phases/document-evaluation/payment",
  requirePermission(Permissions.PAYMENT_VIEW),
  asyncHandler(async (req, res) => {
    res.json(
      await getDocumentEvaluationPaymentState(String(req.params.id), req.user!),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/phases/document-evaluation/invoice",
  requirePermission(Permissions.PAYMENT_INVOICE_UPLOAD),
  handleOmaDocumentUpload,
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await uploadStudyFeeInvoice(
        String(req.params.id),
        req.file,
        {
          invoiceReference:
            typeof req.body.invoiceReference === "string"
              ? req.body.invoiceReference
              : undefined,
          issuedAt:
            typeof req.body.issuedAt === "string"
              ? req.body.issuedAt
              : undefined,
          amount:
            typeof req.body.amount === "string" ? req.body.amount : undefined,
          currency:
            typeof req.body.currency === "string"
              ? req.body.currency
              : undefined,
          notes:
            typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
        req.user!,
      ),
    );
  }),
);

// ── Phase 3 — Évaluation approfondie: payment validation route ───────────────

adminRouter.post(
  "/dossiers/:id/phases/document-evaluation/payment/validate",
  requirePermission(Permissions.PAYMENT_PROOF_VALIDATE),
  asyncHandler(async (req, res) => {
    const decision = req.body.decision as string;
    if (!["validated", "rejected"].includes(decision)) {
      throw new HttpError(400, "decision doit etre validated ou rejected.");
    }
    res.json(
      await validateStudyFeePaymentProof(
        String(req.params.id),
        {
          decision: decision as "validated" | "rejected",
          observations:
            typeof req.body.observations === "string"
              ? req.body.observations
              : undefined,
        },
        req.user!,
      ),
    );
  }),
);

// ── Phase 3 — Évaluation approfondie: close route ─────────────────────────────

adminRouter.post(
  "/dossiers/:id/phases/document-evaluation/close",
  requirePermission(Permissions.PHASE_CLOSE),
  asyncHandler(async (req, res) => {
    res.json(
      await closeDocumentEvaluationPhase(String(req.params.id), req.user!),
    );
  }),
);

// ── Phase 4 — Démonstration et inspection sur site: payment routes ───────────

adminRouter.get(
  "/dossiers/:id/phases/inspection/payment",
  requirePermission(Permissions.PAYMENT_VIEW),
  asyncHandler(async (req, res) => {
    res.json(
      await getInspectionPaymentState(String(req.params.id), req.user!),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/phases/inspection/invoice",
  requirePermission(Permissions.PAYMENT_INVOICE_UPLOAD),
  handleOmaDocumentUpload,
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await uploadAuditFeeInvoice(
        String(req.params.id),
        req.file,
        {
          invoiceReference:
            typeof req.body.invoiceReference === "string"
              ? req.body.invoiceReference
              : undefined,
          issuedAt:
            typeof req.body.issuedAt === "string"
              ? req.body.issuedAt
              : undefined,
          amount:
            typeof req.body.amount === "string" ? req.body.amount : undefined,
          currency:
            typeof req.body.currency === "string"
              ? req.body.currency
              : undefined,
          notes:
            typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/dossiers/:id/phases/inspection/payment/validate",
  requirePermission(Permissions.PAYMENT_PROOF_VALIDATE),
  asyncHandler(async (req, res) => {
    const decision = req.body.decision as string;
    if (!["validated", "rejected"].includes(decision)) {
      throw new HttpError(400, "decision doit etre validated ou rejected.");
    }
    res.json(
      await validateAuditFeePaymentProof(
        String(req.params.id),
        {
          decision: decision as "validated" | "rejected",
          observations:
            typeof req.body.observations === "string"
              ? req.body.observations
              : undefined,
        },
        req.user!,
      ),
    );
  }),
);

// ── Phase 4 — Démonstration et inspection sur site: R3 avis route ────────────

adminRouter.post(
  "/dossiers/:id/phases/inspection/r3-avis",
  requirePermission(Permissions.INSPECTION_AVIS_RECORD),
  handleOmaDocumentUpload,
  asyncHandler(async (req, res) => {
    const decision = req.body.decision as string;
    if (!["conforme", "non_conforme"].includes(decision)) {
      throw new HttpError(
        400,
        "decision doit etre conforme ou non_conforme.",
      );
    }
    res.status(201).json(
      await recordR3Avis(
        String(req.params.id),
        req.file,
        {
          decision: decision as "conforme" | "non_conforme",
          observations:
            typeof req.body.observations === "string"
              ? req.body.observations
              : undefined,
        },
        req.user!,
      ),
    );
  }),
);

// ── Phase 4 — Démonstration et inspection sur site: close route ──────────────

adminRouter.post(
  "/dossiers/:id/phases/inspection/close",
  requirePermission(Permissions.PHASE_CLOSE),
  asyncHandler(async (req, res) => {
    res.json(await closeInspectionPhase(String(req.params.id), req.user!));
  }),
);

// ── Payments — S5 facturation queue ──────────────────────────────────────────

adminRouter.get(
  "/payments/phase-payments",
  requirePermission(Permissions.PAYMENT_VIEW),
  asyncHandler(async (req, res) => {
    const filters: PhasePaymentTaskFilters = {
      status:
        typeof req.query.status === "string"
          ? (req.query.status as PhasePaymentTaskFilters["status"])
          : undefined,
      phaseKey:
        typeof req.query.phaseKey === "string"
          ? (req.query.phaseKey as PhasePaymentTaskFilters["phaseKey"])
          : undefined,
      paymentType:
        typeof req.query.paymentType === "string"
          ? (req.query.paymentType as PhasePaymentTaskFilters["paymentType"])
          : undefined,
    };
    res.json(await listPhasePaymentTasks(filters, req.user!));
  }),
);

// ── Phase 3 — Évaluation approfondie: evaluation routes ──────────────────────

adminRouter.get(
  "/dossiers/:id/phases/document-evaluation/evaluations",
  requirePermission(Permissions.DOCUMENT_REVIEW),
  asyncHandler(async (req, res) => {
    res.json(await getDocumentEvaluations(String(req.params.id), req.user!));
  }),
);

adminRouter.patch(
  "/dossiers/:id/phases/document-evaluation/evaluations/:evaluationId",
  requirePermission(Permissions.DOCUMENT_REVIEW),
  asyncHandler(async (req, res) => {
    res.json(
      await reviewDocumentEvaluation(
        String(req.params.id),
        String(req.params.evaluationId),
        {
          status:
            typeof req.body.status === "string"
              ? (req.body.status as "satisfaisant" | "non_satisfaisant")
              : ("" as never),
          annotation:
            typeof req.body.annotation === "string"
              ? req.body.annotation
              : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/document-submissions/:id/review",
  requirePermission(Permissions.DOCUMENT_REVIEW),
  asyncHandler(async (req, res) => {
    const status = req.body.status as string;
    if (!["validated", "requires_correction", "incomplete"].includes(status)) {
      throw new HttpError(
        400,
        "Statut de revue non autorisé pour la demande formelle.",
      );
    }
    res.json(
      await reviewFormalRequestDocumentSubmission(
        String(req.params.id),
        req.user!,
        {
          status: status as "validated" | "requires_correction" | "incomplete",
          comment:
            typeof req.body.comment === "string" ? req.body.comment : undefined,
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
          scheduledAt:
            typeof req.body.scheduledAt === "string"
              ? req.body.scheduledAt
              : undefined,
          location:
            typeof req.body.location === "string"
              ? req.body.location
              : undefined,
          notes:
            typeof req.body.notes === "string" ? req.body.notes : undefined,
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
          notes:
            typeof req.body.notes === "string" ? req.body.notes : undefined,
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
    res
      .status(201)
      .json(await publishPreEvaluationForm(String(req.params.id), req.user!));
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
          sentAt:
            typeof req.body.sentAt === "string" ? req.body.sentAt : undefined,
          notes:
            typeof req.body.notes === "string" ? req.body.notes : undefined,
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
          returnedAt:
            typeof req.body.returnedAt === "string"
              ? req.body.returnedAt
              : undefined,
          notes:
            typeof req.body.notes === "string" ? req.body.notes : undefined,
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
    res.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );
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
          scheduledAt:
            typeof req.body.scheduledAt === "string"
              ? req.body.scheduledAt
              : undefined,
          location:
            typeof req.body.location === "string"
              ? req.body.location
              : undefined,
          notes:
            typeof req.body.notes === "string" ? req.body.notes : undefined,
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
        {
          notes:
            typeof req.body.notes === "string" ? req.body.notes : undefined,
        },
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
        {
          title:
            typeof req.body.title === "string" ? req.body.title : undefined,
        },
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
          documentType:
            typeof req.query.documentType === "string"
              ? req.query.documentType
              : undefined,
          phaseKey:
            typeof req.query.phaseKey === "string"
              ? req.query.phaseKey
              : undefined,
          isActive:
            req.query.isActive === "true"
              ? true
              : req.query.isActive === "false"
                ? false
                : undefined,
        },
        req.user!,
      ),
    );
  }),
);

adminRouter.post(
  "/document-requirements/seed-formal-request",
  requirePermission(Permissions.DOCUMENT_UPLOAD_INTERNAL),
  asyncHandler(async (req, res) => {
    res.json(await seedFormalRequestDocumentRequirements(req.user!));
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
          documentType:
            typeof req.body.documentType === "string"
              ? req.body.documentType
              : "",
          phaseKey:
            typeof req.body.phaseKey === "string"
              ? req.body.phaseKey
              : undefined,
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
          confirmation:
            typeof req.body.confirmation === "string"
              ? req.body.confirmation
              : "",
          deleteUploadedFiles: req.body.deleteUploadedFiles === true,
          includeAuditLogs: req.body.includeAuditLogs !== false,
          includeNotifications: req.body.includeNotifications !== false,
        },
        req.user!,
      ),
    );
  }),
);

