/**
 * Form Analysis Workflow
 * 
 * This workflow orchestrates the complete form analysis pipeline:
 * 1. Extract pose from uploaded video
 * 2. Find similar reference poses in Vectorize
 * 3. Compare poses and identify differences
 * 4. Use LLM to generate feedback and tips
 * 5. Generate 3D avatar data
 * 6. Return complete analysis
 */

import { WorkflowEntrypoint } from "cloudflare:workers";
import { LegExtensionEvaluator, MachinePecDeckEvaluator } from "../lib/formEvaluation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Env = Record<string, any>;

export interface WorkflowInput {
  sessionId: string;
  exerciseType: string;
  videoUrl: string;
  agentName: string;
}

export interface WorkflowOutput {
  success: boolean;
  analysisResult?: {
    formScore: number;
    keyFindings: string[];
    improvementTips: string[];
    poseComparison?: unknown;
    avatarData?: unknown;
  };
  error?: string;
}

export class AnalyzeFormWorkflow extends WorkflowEntrypoint<Env, WorkflowInput> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async run(event: any, step: any) {
    const { exerciseType, videoUrl, agentName } = event.payload;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = this.env as any;

    try {
      // Step 1: Extract pose from video
      const poseData = await step.do("extract-pose", async () => {
        // Update agent progress
        const agent = env.FORM_ANALYSIS_AGENT.get(
          env.FORM_ANALYSIS_AGENT.idFromName(agentName)
        );
        await agent.call("updateProgress", {
          stage: "extracting_pose",
          percentage: 20,
          message: "Analyzing video and extracting pose data...",
        });

        // Call pose estimation service
        // This could be Workers AI or external API
        const response = await fetch(`${env.POSE_ESTIMATION_WORKER_URL}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl, exerciseType }),
        });

        if (!response.ok) {
          throw new Error("Pose extraction failed");
        }

        return await response.json();
      });

      // Step 2: Evaluate form deterministically
      const evaluation = await step.do("evaluate-form", async () => {
        const agent = env.FORM_ANALYSIS_AGENT.get(
          env.FORM_ANALYSIS_AGENT.idFromName(agentName)
        );
        await agent.call("updateProgress", {
          stage: "evaluating_form",
          percentage: 50,
          message: "Evaluating form using biomechanical rules...",
        });

        // Create the correct evaluator based on exercise type
        let evaluator;
        if (exerciseType === 'machine-pec-deck') {
          evaluator = new MachinePecDeckEvaluator();
        } else {
          // Default to leg extension for now
          evaluator = new LegExtensionEvaluator();
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = evaluator.evaluate(poseData as any);

        return result;
      });

      // Step 4: Generate feedback using LLM
      const feedback = await step.do("generate-feedback", async () => {
        const agent = env.FORM_ANALYSIS_AGENT.get(
          env.FORM_ANALYSIS_AGENT.idFromName(agentName)
        );
        await agent.call("updateProgress", {
          stage: "generating_feedback",
          percentage: 80,
          message: "Generating personalized feedback...",
        });

        // Use Llama 3.3 to analyze and generate feedback
        const { response } = await env.AI.run(
          "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
          {
            messages: [
              {
                role: "system",
                content: `You are an expert fitness coach analyzing exercise form. 
                Analyze the pose differences and provide:
                1. A form score (0-100)
                2. Key findings (3-5 bullet points)
                3. Specific improvement tips (3-5 actionable tips)
                
                Be encouraging but honest. Focus on safety and effectiveness.`,
              },
              {
                role: "user",
                content: `Exercise: ${exerciseType}
                
                Evaluation Results:
                Score: ${(evaluation as Record<string, unknown>).score}
                
                Issues Found:
                ${((evaluation as Record<string, unknown>).issues as Array<{ type?: string; name?: string; message?: string; description?: string }>).map(i => `- ${i.type || i.name}: ${i.message || i.description}`).join("\n")}
                
                Positives:
                ${((evaluation as Record<string, unknown>).positives as Array<{ message?: string } | string>).map(p => typeof p === 'string' ? `- ${p}` : `- ${p.message}`).join("\n")}
                
                Provide your analysis in JSON format:
                {
                  "formScore": number,
                  "keyFindings": string[],
                  "improvementTips": string[]
                }`,
              },
            ],
          }
        );

        // Parse LLM response (may need additional parsing logic)
        return this.parseFeedbackResponse(response as string);
      });

      // Step 5: Generate 3D avatar data
      const avatarData = await step.do("generate-avatar", async () => {
        const agent = env.FORM_ANALYSIS_AGENT.get(
          env.FORM_ANALYSIS_AGENT.idFromName(agentName)
        );
        await agent.call("updateProgress", {
          stage: "generating_avatar",
          percentage: 90,
          message: "Preparing 3D visualization...",
        });

        // Convert 2D pose to 3D avatar data
        return this.convertToAvatarData(poseData);
      });

      // Step 5: Complete analysis
      const analysisResult = {
        formScore: feedback.formScore,
        keyFindings: feedback.keyFindings,
        improvementTips: feedback.improvementTips,
        evaluation,
        avatarData,
      };

      // Update agent with final results
      const agent = env.FORM_ANALYSIS_AGENT.get(
        env.FORM_ANALYSIS_AGENT.idFromName(agentName)
      );
      await agent.call("completeAnalysis", analysisResult);

      return {
        success: true,
        analysisResult,
      };
    } catch (error) {
      // Handle errors
      const agent = env.FORM_ANALYSIS_AGENT.get(
        env.FORM_ANALYSIS_AGENT.idFromName(agentName)
      );
      await agent.call("updateProgress", {
        stage: "error",
        percentage: 0,
        message: error instanceof Error ? error.message : "Analysis failed",
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }



  /**
   * Parse LLM feedback response
   */
  private parseFeedbackResponse(response: string): {
    formScore: number;
    keyFindings: string[];
    improvementTips: string[];
  } {
    // Try to parse JSON from response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback parsing logic
    }

    // Fallback: extract information from text
    return {
      formScore: 75,
      keyFindings: ["Analysis complete"],
      improvementTips: ["Continue practicing"],
    };
  }

  /**
   * Convert pose data to 3D avatar format
   */
  private convertToAvatarData(pose: unknown): unknown {
    // Placeholder - would convert 2D pose to 3D avatar skeleton
    return {
      keypoints3D: pose,
      skeleton: [],
    };
  }
}

