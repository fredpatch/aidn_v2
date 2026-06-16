import { connectToDatabase, disconnectFromDatabase } from "../shared/database/mongoose.js";
import { DocumentRequirementModel } from "../modules/documents/document-requirement.model.js";

const FORMAL_REQUEST_REQUIREMENTS = [
  {
    code: "formal_request_letter",
    label: "Lettre de demande officielle d'agrément d'OMA",
    requirementLevel: "gate",
    documentType: "formal_request_letter",
    isRepeatable: false,
    sortOrder: 10,
  },
  {
    code: "oma_approval_form",
    label: "Formulaire de demande d'agrément d'OMA",
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
    label: "Manuel des Procédures de Maintenance",
    requirementLevel: "expected",
    documentType: "mpm",
    isRepeatable: false,
    sortOrder: 70,
  },
  {
    code: "quality_manual",
    label: "Manuel Qualité, si non intégré au MPM",
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
    label: "Liste des capacités, sauf si intégrée au MPM",
    requirementLevel: "conditional",
    documentType: "capability_list",
    isRepeatable: false,
    sortOrder: 100,
  },
  {
    code: "training_program",
    label: "Manuel ou programme de formation, sauf si intégré au MPM",
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
    label: "Documents techniques requis relatifs à la capacité de la structure",
    requirementLevel: "expected",
    documentType: "technical_structure_document",
    isRepeatable: true,
    sortOrder: 130,
  },
  {
    code: "compliance_statement",
    label: "État de conformité à la règlementation en vigueur",
    formCode: "DN-AIR-R2-3-F-E-011",
    requirementLevel: "expected",
    documentType: "compliance_statement",
    isRepeatable: false,
    sortOrder: 140,
  },
] as const;

const run = async () => {
  await connectToDatabase();

  let upserted = 0;
  let unchanged = 0;

  for (const req of FORMAL_REQUEST_REQUIREMENTS) {
    const result = await DocumentRequirementModel.findOneAndUpdate(
      { phaseKey: "formal_request", code: req.code },
      {
        $set: {
          phaseKey: "formal_request",
          isActive: true,
          ...req,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    if (result.createdAt?.getTime() === result.updatedAt?.getTime()) {
      upserted++;
    } else {
      unchanged++;
    }
  }

  console.log(
    `Document requirements seeded: ${upserted} upserted, ${unchanged} existing (total ${FORMAL_REQUEST_REQUIREMENTS.length})`,
  );
};

void run()
  .catch((error) => {
    console.error("Failed to seed document requirements", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFromDatabase();
  });
