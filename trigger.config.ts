import type { TriggerConfig } from "@trigger.dev/sdk";

export const config: TriggerConfig = {
  project: "nextflow",
  maxDuration: 300, // 5 minutes max per task
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    },
  },
  dirs: ["./src/trigger"],
};
