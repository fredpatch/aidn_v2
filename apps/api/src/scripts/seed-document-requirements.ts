import { seedFormalRequestDocumentRequirements } from "../modules/documents/document-requirement.seed.js";
import {
  connectToDatabase,
  disconnectFromDatabase,
} from "../shared/database/mongoose.js";

const run = async () => {
  await connectToDatabase();

  const result = await seedFormalRequestDocumentRequirements();

  console.log(
    `Document requirements seeded: ${result.created} created, ${result.updated} updated, ${result.unchanged} unchanged (total ${result.total})`,
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
