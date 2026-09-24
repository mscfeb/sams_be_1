import app from "./index.js";
import { env } from "./src/config/env.js";

const server = app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});

server.on("error", (error) => {
  console.error("Backend failed to start", error);
  process.exitCode = 1;
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down.`);

  server.close(() => {
    process.exit(0);
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));