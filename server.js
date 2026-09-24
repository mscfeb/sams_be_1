import { app } from "./index.js";
import { env } from "./src/config/env.js";
import prisma from "./src/lib/prisma.js";

const server = app.listen(env.PORT, () => {
  console.log(`Backend listening on port ${env.PORT}`);
});

server.on("error", (error) => {
  console.error("Backend failed to start", error);
  process.exitCode = 1;
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
