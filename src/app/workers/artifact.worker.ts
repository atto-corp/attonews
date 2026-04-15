import { ServiceContainer } from "../services/service-container";

async function run() {
  console.log("Starting artifact worker...");
  const container = ServiceContainer.getInstance();
  await container.getArtifactQueueService(); // initializes and starts worker
  console.log("Artifact worker is running. Press Ctrl+C to exit.");
  // Keep process alive
  process.on("SIGINT", async () => {
    console.log("Shutting down artifact worker...");
    await container.disconnect();
    process.exit(0);
  });
}

run().catch(console.error);
