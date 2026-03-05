/**
 * Environment types for Cloudflare bindings
 * This extends the auto-generated env.d.ts with our custom bindings
 */

import type { CloudflareEnv } from "../../env.d";

declare global {
  interface Env extends CloudflareEnv {
    // Durable Objects
    FORM_ANALYSIS_AGENT: DurableObjectNamespace<FormAnalysisAgent>;

    // Workflows
    FORM_ANALYSIS_WORKFLOW: WorkflowEntrypoint<AnalyzeFormWorkflow>;

    // R2 Buckets
    VIDEOS_BUCKET: R2Bucket;

    // Vectorize
    VECTORIZE_INDEX: VectorizeIndex;

    // D1 Database
    DB: D1Database;

    // Workers AI
    AI: Ai;

    // Optional: External pose estimation worker URL
    POSE_ESTIMATION_WORKER_URL?: string;
  }
}

// Type declarations for our classes
declare class FormAnalysisAgent extends DurableObject<Env> {}
declare class AnalyzeFormWorkflow implements WorkflowEntrypoint<Env, unknown, unknown> {}

