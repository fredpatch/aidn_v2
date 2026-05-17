import mongoose from "mongoose";
import { env } from "../config/env.js";

export const connectToDatabase = async (): Promise<typeof mongoose> => {
  mongoose.set("strictQuery", true);
  console.log("Connecting to MongoDB...");
  const connection = await mongoose.connect(env.mongodbUri);
  console.log(
    `Connected to MongoDB at ${connection.connection.host}:${connection.connection.port} (${connection.connection.name})`,
  );
  return connection;
};

export const disconnectFromDatabase = async (): Promise<void> => {
  const connection = mongoose.connection;
  await mongoose.disconnect();
  console.log(
    `Disconnected from MongoDB at ${connection.host}:${connection.port} (${connection.name})`,
  );
};
