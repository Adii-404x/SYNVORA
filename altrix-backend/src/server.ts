import app from "./app";
import { env } from "./config/env";
import { createServer } from "http";

const server = createServer(app);

const PORT = env.PORT;

server.listen(PORT, () => {
  console.log(`?? Server running in ${env.NODE_ENV} mode on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received. Closing HTTP server...");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received. Closing HTTP server...");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});

