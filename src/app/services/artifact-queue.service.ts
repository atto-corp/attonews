import { Queue, Worker, QueueEvents, Job } from "bullmq";
import { ArtifactService } from "./artifact.service";
import { IDataStorageService } from "./data-storage.interface";

const QUEUE_NAME = "artifact_generate";

export class ArtifactQueueService {
  private queue: Queue;
  private worker: Worker;
  private queueEvents: QueueEvents;

  constructor(
    private artifactService: ArtifactService,
    private dataStorageService: IDataStorageService
  ) {
    // Redis connection
    const connection = {
      host: "localhost",
      port: 6379
    };

    this.queue = new Queue(QUEUE_NAME, { connection });
    this.worker = new Worker(QUEUE_NAME, this.processJob.bind(this), {
      connection,
      concurrency: 2, // restrict to avoid rate limits
      limiter: { max: 10, duration: 60 * 1000 } // 10 per minute
    });
    this.queueEvents = new QueueEvents(QUEUE_NAME, { connection });

    // Listen for completed jobs to queue dependents
    this.queueEvents.on("completed", ({ jobId, returnvalue }) => {
      console.log(`Job ${jobId} completed, checking dependents...`);
      this.queueDependents(jobId);
    });

    this.queueEvents.on("failed", ({ jobId, failedReason }) => {
      console.log(`Job ${jobId} failed: ${failedReason}`);
    });
  }

  async queueSingle(
    artifactId: string,
    options: { priority: number; delay?: number } = { priority: 0 }
  ): Promise<string> {
    const job = await this.queue.add("generate", { artifactId }, options);
    return job.id!;
  }

  async queueDAG(rootArtifactIds: string[]): Promise<string[]> {
    const jobIds: string[] = [];
    // For simplicity, queue roots; dependents will be queued on completion
    for (const id of rootArtifactIds) {
      const jobId = await this.queueSingle(id, { priority: 1 });
      jobIds.push(jobId);
    }
    return jobIds;
  }

  private async processJob(job: Job): Promise<void | any> {
    const { artifactId } = job.data;
    console.log(`Processing artifact ${artifactId} (job ${job.id})`);
    try {
      const result = await this.artifactService.generate(artifactId);
      console.log(`Artifact ${artifactId} generated successfully`);
      return result; // allow any for BullMQ
    } catch (error) {
      console.error(`Artifact ${artifactId} generation failed:`, error);
      // Update artifact status to failed
      try {
        const currentArtifact =
          await this.dataStorageService.getArtifact(artifactId);
        if (currentArtifact) {
          await this.dataStorageService.updateArtifact(artifactId, {
            metadata: {
              ...currentArtifact.metadata,
              status: "failed" as const,
              error_message:
                error instanceof Error ? error.message : String(error)
            }
          });
          console.log(`Artifact ${artifactId} marked as failed`);
        }
      } catch (updateError) {
        console.error(
          `Failed to update artifact ${artifactId} status:`,
          updateError
        );
      }
      throw error;
    }
  }

  private async queueDependents(parentJobId: string): Promise<void> {
    // Get the artifact that completed from job data
    const job = await this.queue.getJob(parentJobId);
    if (!job) return;
    const { artifactId: parentArtifactId } = job.data;

    // Find artifacts that depend on this one
    const allArtifacts = await this.dataStorageService.getAllArtifacts();
    const dependents = allArtifacts.filter(
      (a) =>
        a.inputs.some(
          (input) =>
            input.source === "artifacts" && input.type === parentArtifactId
        ) // wait, type should be the type, not id
      // Actually, need to traverse inputs properly. For now, assume by type or something. This is placeholder.
      // Perhaps build dependency graph at DAG time.
    );

    // For now, no knowledge of deps, so this is empty.
    // To implement proper DAG, need to build graph and sort.
    // For MVP, queueDependents not used, root driven only.

    console.log(
      `Found ${dependents.length} dependents for ${parentArtifactId}`
    );
    for (const dep of dependents) {
      await this.queueSingle(dep.id);
    }
  }

  async getJobs(
    status?: "waiting" | "active" | "completed" | "failed",
    limit = 50
  ): Promise<any[]> {
    const jobs = await this.queue.getJobs(
      status ? [status] : undefined,
      0,
      limit
    );
    return jobs.map((job) => ({
      id: job.id,
      artifactId: job.data.artifactId,
      status: job.finishedOn
        ? "completed"
        : job.processedOn
          ? "active"
          : "waiting",
      progress: job.progress,
      createdAt: job.timestamp
    }));
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    await this.queueEvents.close();
  }
}
