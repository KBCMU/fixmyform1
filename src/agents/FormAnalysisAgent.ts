import { Agent, callable } from "agents";

/**
 * FormAnalysisAgent - Main agent for coordinating exercise form analysis
 * 
 * This agent:
 * - Manages analysis sessions via WebSocket connections
 * - Coordinates workflows for video processing and analysis
 * - Stores session state and analysis history
 * - Provides real-time updates to clients
 */
export interface FormAnalysisState {
  sessionId: string;
  userId?: string;
  exerciseType?: string;
  videoUrl?: string;
  status: "idle" | "uploading" | "processing" | "analyzing" | "complete" | "error";
  analysisResult?: AnalysisResult;
  createdAt: number;
  updatedAt: number;
}

export interface AnalysisResult {
  formScore: number; // 0-100
  keyFindings: string[];
  improvementTips: string[];
  poseComparison?: PoseComparison;
  avatarData?: AvatarPoseData;
}

export interface PoseComparison {
  userPose: PoseKeypoints;
  referencePose: PoseKeypoints;
  differences: PoseDifference[];
}

export interface PoseKeypoints {
  // Standard pose estimation keypoints (17 keypoints from COCO format)
  nose?: [number, number, number]; // x, y, confidence
  leftEye?: [number, number, number];
  rightEye?: [number, number, number];
  leftEar?: [number, number, number];
  rightEar?: [number, number, number];
  leftShoulder?: [number, number, number];
  rightShoulder?: [number, number, number];
  leftElbow?: [number, number, number];
  rightElbow?: [number, number, number];
  leftWrist?: [number, number, number];
  rightWrist?: [number, number, number];
  leftHip?: [number, number, number];
  rightHip?: [number, number, number];
  leftKnee?: [number, number, number];
  rightKnee?: [number, number, number];
  leftAnkle?: [number, number, number];
  rightAnkle?: [number, number, number];
}

export interface PoseDifference {
  joint: string;
  angleDifference: number; // degrees
  positionDifference: number; // pixels or normalized
  severity: "minor" | "moderate" | "major";
}

export interface AvatarPoseData {
  // 3D pose data for avatar visualization
  keypoints3D: PoseKeypoints;
  skeleton: SkeletonConnection[];
}

export interface SkeletonConnection {
  from: string;
  to: string;
}

export class FormAnalysisAgent extends Agent<Env, FormAnalysisState> {
  /**
   * Initialize agent state when first created
   */
  onStart() {
    const initialState: FormAnalysisState = {
      sessionId: this.name,
      status: "idle",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.setState(initialState);
  }

  /**
   * Start a new form analysis session
   * Called when user uploads a video
   */
  @callable()
  async startAnalysis(exerciseType: string, videoUrl: string, userId?: string) {
    const state = this.state;

    // Update state
    this.setState({
      ...state,
      exerciseType,
      videoUrl,
      userId,
      status: "processing",
      updatedAt: Date.now(),
    });

    // Notify connected clients
    this.broadcast({
      type: "status_update",
      status: "processing",
      message: "Starting analysis...",
    });

    // Start the analysis workflow
    try {
      const workflowResult = await this.env.FORM_ANALYSIS_WORKFLOW.create({
        sessionId: this.name,
        exerciseType,
        videoUrl,
        agentName: this.name,
      });

      // Workflow will update state via callbacks
      return {
        success: true,
        sessionId: this.name,
        workflowId: workflowResult.id,
      };
    } catch (error) {
      this.setState({
        ...state,
        status: "error",
        updatedAt: Date.now(),
      });

      this.broadcast({
        type: "error",
        message: error instanceof Error ? error.message : "Analysis failed",
      });

      throw error;
    }
  }

  /**
   * Update analysis progress
   * Called by workflow during processing
   */
  @callable()
  async updateProgress(progress: {
    stage: string;
    percentage: number;
    message?: string;
  }) {
    const state = this.state;

    this.setState({
      ...state,
      updatedAt: Date.now(),
    });

    this.broadcast({
      type: "progress",
      ...progress,
    });
  }

  /**
   * Complete analysis and store results
   * Called by workflow when analysis is complete
   */
  @callable()
  async completeAnalysis(result: AnalysisResult) {
    const state = this.state;

    this.setState({
      ...state,
      status: "complete",
      analysisResult: result,
      updatedAt: Date.now(),
    });

    // Store in D1 for history
    await this.env.DB.prepare(
      `INSERT INTO analysis_history (session_id, user_id, exercise_type, form_score, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(this.name, state.userId || null, state.exerciseType || null, result.formScore, Date.now())
      .run();

    this.broadcast({
      type: "complete",
      result,
    });

    return { success: true };
  }

  /**
   * Get analysis history for a user
   */
  @callable()
  async getHistory(userId: string, limit: number = 10) {
    const results = await this.env.DB.prepare(
      `SELECT * FROM analysis_history 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`
    )
      .bind(userId, limit)
      .all();

    return results.results;
  }

  /**
   * Chat with the agent about form improvement
   */
  @callable()
  async chat(message: string) {
    const state = this.state;

    if (!state.analysisResult) {
      return {
        response: "Please complete an analysis first before asking questions.",
      };
    }

    // Use LLM to generate contextual response
    const { response } = await this.env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages: [
          {
            role: "system",
            content: `You are a fitness coach helping users improve their exercise form. 
            The user has just completed a form analysis with a score of ${state.analysisResult.formScore}/100.
            Key findings: ${state.analysisResult.keyFindings.join(", ")}
            Improvement tips: ${state.analysisResult.improvementTips.join(", ")}
            
            Provide helpful, encouraging, and specific advice based on the analysis results.`,
          },
          {
            role: "user",
            content: message,
          },
        ],
      }
    );

    return {
      response: response as string,
    };
  }

  /**
   * Handle WebSocket connections for real-time updates
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      const upgradeHeader = request.headers.get("Upgrade");
      if (upgradeHeader !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }

      const [client, server] = Object.values(new WebSocketPair());
      this.acceptWebSocket(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // Handle HTTP requests
    if (request.method === "GET") {
      return Response.json(this.state);
    }

    return new Response("Not found", { status: 404 });
  }

  /**
   * Broadcast message to all connected WebSocket clients
   */
  private broadcast() {
    // Implementation will be handled by Agents SDK
    // This is a placeholder for the concept
  }
}

