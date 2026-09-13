import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    // These are integration tests: they talk to a real Postgres, real object
    // storage and a real SMTP server. Nodemailer opens a fresh connection per
    // message, so with several workers sending at once a handshake can queue
    // for seconds — which showed up as unrelated tests timing out at random.
    // The work is genuinely I/O-bound; 5s was the wrong default for it.
    testTimeout: 20_000,
  },
});
