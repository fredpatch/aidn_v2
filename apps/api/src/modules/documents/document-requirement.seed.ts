import { DocumentRequirementModel } from "./document-requirement.model.js";
import { writeAuditLog } from "../audit/audit.service.js";
import type { AuthUser } from "../../shared/guards/auth-context.js";

const FORMAL_REQUEST_REQUIREMENTS = [
  {
    code: "formal_request_letter",
    label: "Lettre de demande officielle d'agrÃ©ment d'OMA",
    requirementLevel: "gate",
    documentType: "formal_request_letter",
    isRepeatable: false,
    sortOrder: 10,
  },
  {
    code: "oma_approval_form",
    label: "Formulaire de demande d'agrÃ©ment d'OMA",
    formCode: "DN-AIR-R2-3-F-E-010",
    requirementLevel: "expected",
    documentType: "oma_approval_form",
    isRepeatable: false,
    sortOrder: 20,
  },
  {
    code: "management_personnel_acceptance",
    label: "Demande d'acceptation du personnel d'encadrement",
    formCode: "DN-AIR-R2-3-F-E-012",
    requirementLevel: "expected",
    documentType: "management_personnel_acceptance_form",
    isRepeatable: true,
    sortOrder: 30,
  },
  {
    code: "management_cv",
    label: "CV du personnel d'encadrement",
    requirementLevel: "expected",
    documentType: "cv",
    isRepeatable: true,
    sortOrder: 40,
  },
  {
    code: "management_qualifications",
    label: "Qualifications du personnel d'encadrement",
    requirementLevel: "expected",
    documentType: "qualification",
    isRepeatable: true,
    sortOrder: 50,
  },
  {
    code: "certification_staff_list",
    label: "Liste du personnel de certification",
    requirementLevel: "expected",
    documentType: "certification_staff_list",
    isRepeatable: false,
    sortOrder: 60,
  },
  {
    code: "mpm",
    label: "Manuel des ProcÃ©dures de Maintenance",
    requirementLevel: "expected",
    documentType: "mpm",
    isRepeatable: false,
    sortOrder: 70,
  },
  {
    code: "quality_manual",
    label: "Manuel QualitÃ©, si non intÃ©grÃ© au MPM",
    requirementLevel: "conditional",
    documentType: "quality_manual",
    isRepeatable: false,
    sortOrder: 80,
  },
  {
    code: "sgs_manual",
    label: "Manuel SGS",
    requirementLevel: "expected",
    documentType: "sgs_manual",
    isRepeatable: false,
    sortOrder: 90,
  },
  {
    code: "capability_list",
    label: "Liste des capacitÃ©s, sauf si intÃ©grÃ©e au MPM",
    requirementLevel: "conditional",
    documentType: "capability_list",
    isRepeatable: false,
    sortOrder: 100,
  },
  {
    code: "training_program",
    label: "Manuel ou programme de formation, sauf si intÃ©grÃ© au MPM",
    requirementLevel: "conditional",
    documentType: "training_program",
    isRepeatable: false,
    sortOrder: 110,
  },
  {
    code: "subcontractor_contracts",
    label: "Contrats avec les sous-traitants ou lettres d'intention",
    requirementLevel: "conditional",
    documentType: "subcontractor_contract",
    isRepeatable: true,
    sortOrder: 120,
  },
  {
    code: "technical_structure_documents",
    label: "Documents techniques requis relatifs Ã  la capacitÃ© de la structure",
    requirementLevel: "expected",
    documentType: "technical_structure_document",
    isRepeatable: true,
    sortOrder: 130,
  },
  {
    code: "compliance_statement",
    label: "Ã‰tat de conformitÃ© Ã  la rÃ¨glementation en vigueur",
    formCode: "DN-AIR-R2-3-F-E-011",
    requirementLevel: "expected",
    documentType: "compliance_statement",
    isRepeatable: false,
    sortOrder: 140,
  },
] as const;

type FormalRequestRequirementSeed = (typeof FORMAL_REQUEST_REQUIREMENTS)[number];

export type SeedDocumentRequirementAction = "created" | "updated" | "unchanged";

export type SeedDocumentRequirementsResult = {
  phaseKey: "formal_request";
  total: number;
  created: number;
  updated: number;
  unchanged: number;
  requirements: Array<{
    id: string;
    code: string;
    action: SeedDocumentRequirementAction;
  }>;
};

function toSeedPayload(requirement: FormalRequestRequirementSeed) {
  return {
    phaseKey: "formal_request" as const,
    isActive: true,
    ...requirement,
  };
}

function serializeComparableSeedFields(input: Record<string, unknown>) {
  return JSON.stringify({
    phaseKey: input.phaseKey,
    code: input.code,
    label: input.label,
    formCode: input.formCode,
    requirementLevel: input.requirementLevel,
    documentType: input.documentType,
    isRepeatable: input.isRepeatable,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
  });
}

export const seedFormalRequestDocumentRequirements = async (
  actor?: AuthUser,
): Promise<SeedDocumentRequirementsResult> => {
  const result: SeedDocumentRequirementsResult = {
    phaseKey: "formal_request",
    total: FORMAL_REQUEST_REQUIREMENTS.length,
    created: 0,
    updated: 0,
    unchanged: 0,
    requirements: [],
  };

  for (const requirement of FORMAL_REQUEST_REQUIREMENTS) {
    const payload = toSeedPayload(requirement);
    const existing = await DocumentRequirementModel.findOne({
      phaseKey: "formal_request",
      code: requirement.code,
    }).lean();

    const before = existing
      ? serializeComparableSeedFields(existing as Record<string, unknown>)
      : null;

    const document = await DocumentRequirementModel.findOneAndUpdate(
      { phaseKey: "formal_request", code: requirement.code },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const after = serializeComparableSeedFields(document.toObject());
    const action: SeedDocumentRequirementAction = !existing
      ? "created"
      : before === after
        ? "unchanged"
        : "updated";

    result[action] += 1;
    result.requirements.push({
      id: document._id.toString(),
      code: requirement.code,
      action,
    });
  }

  if (actor) {
    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "document_requirements.seed_formal_request",
      entityType: "document_requirement",
      metadata: {
        phaseKey: "formal_request",
        created: result.created,
        updated: result.updated,
        unchanged: result.unchanged,
        total: result.total,
      },
    });
  }

  return result;
};
