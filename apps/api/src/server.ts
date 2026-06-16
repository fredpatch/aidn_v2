import { createApp } from "./app.js";
import { env } from "./shared/config/env.js";
import { initializeMariaIfConfigured } from "./shared/database/maria.datasource.js";
import { connectToDatabase } from "./shared/database/mongoose.js";

const start = async () => {
  // Connect to databases
  await connectToDatabase();
  await initializeMariaIfConfigured();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`AIDN API listening on http://localhost:${env.port}`);
  });
};

void start().catch((error) => {
  console.error("Failed to start AIDN API", error);
  process.exit(1);
});

/*
 * Bootstrap admin ready: admin@aidn.local (6a09d77d2895907e44e115e2)
 */
