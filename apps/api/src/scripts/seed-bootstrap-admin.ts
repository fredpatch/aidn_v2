import bcrypt from "bcryptjs";

import { env } from "../shared/config/env.js";
import { connectToDatabase, disconnectFromDatabase } from "../shared/database/mongoose.js";
import { Roles } from "../shared/permissions/permissions.js";
import { UserModel } from "../modules/users/user.model.js";

const run = async () => {
  await connectToDatabase();

  const passwordHash = await bcrypt.hash(env.bootstrapAdmin.password, 12);

  const user = await UserModel.findOneAndUpdate(
    { email: env.bootstrapAdmin.email.toLowerCase() },
    {
      userType: "internal",
      fullName: env.bootstrapAdmin.fullName,
      email: env.bootstrapAdmin.email.toLowerCase(),
      role: Roles.BOOTSTRAP_ADMIN,
      passwordHash,
      isActive: true
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Bootstrap admin ready: ${user.email} (${user._id.toString()})`);
};

void run()
  .catch((error) => {
    console.error("Failed to seed bootstrap admin", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFromDatabase();
  });
