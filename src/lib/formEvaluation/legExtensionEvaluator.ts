/**
 * Leg Extension Evaluator
 * Deterministic form evaluation for leg extension exercise
 */

import type {
    PoseFrame,
    Rep,
    FormEvaluationResult,
    FormIssue,
    ExerciseEvaluator,
} from "./types";
import {
    segmentReps,
    calculatePhaseDurations,
    getDefaultLegExtensionConfig,
} from "./repSegmentation";
import { calculateKneeAngle } from "../angle-calculator";

/**
 * Metrics for a single rep
 */
interface RepMetrics {
    repNumber: number;
    rangeOfMotion: number;
    maxExtension: number;
    hipDisplacement: number;
    eccentricDuration: number;
    confidence: number;
}

/**
 * Aggregated issues across all reps
 */
interface AggregatedIssues {
    incompleteExtension: { count: number; avgConfidence: number };
    hipLift: { count: number; avgConfidence: number };
    bouncing: { count: number; avgConfidence: number };
}

export class LegExtensionEvaluator implements ExerciseEvaluator {
    exerciseName = "leg_extension";

    /**
     * Main evaluation method
     */
    evaluate(frames: PoseFrame[]): FormEvaluationResult {
        // Check for camera setup issues
        const avgConfidence =
            frames.reduce((sum, f) => sum + f.confidence, 0) / frames.length;

        if (avgConfidence < 0.5) {
            return {
                exercise: this.exerciseName,
                totalReps: 0,
                validReps: 0,
                issues: [],
                positives: [],
                overallScore: 0,
                cameraSetupIssue:
                    "Pose tracking confidence is too low. Please ensure your full body is visible and well-lit.",
            };
        }

        // Segment into reps
        const reps = this.segmentReps(frames);
        const validReps = reps.filter((r) => r.isValid);

        if (validReps.length === 0) {
            return {
                exercise: this.exerciseName,
                totalReps: reps.length,
                validReps: 0,
                issues: [],
                positives: [],
                overallScore: 0,
                cameraSetupIssue:
                    reps.length > 0
                        ? "No valid reps detected. Reps may be too fast, too slow, or have low tracking confidence."
                        : "No repetitions detected. Please ensure you perform the exercise within the camera frame.",
            };
        }

        // Calculate metrics for each valid rep
        const repMetrics = validReps.map((rep) =>
            this.calculateRepMetrics(rep, frames)
        );

        // Aggregate issues
        const aggregatedIssues = this.aggregateIssues(repMetrics);

        // Convert to form issues
        const issues = this.createFormIssues(aggregatedIssues, validReps.length);

        // Generate positives
        const positives = this.generatePositives(repMetrics, aggregatedIssues);

        // Calculate overall score
        const overallScore = this.calculateOverallScore(issues, validReps.length);

        return {
            exercise: this.exerciseName,
            totalReps: reps.length,
            validReps: validReps.length,
            issues,
            positives,
            overallScore,
        };
    }

    /**
     * Segment frames into reps
     */
    segmentReps(frames: PoseFrame[]): Rep[] {
        const config = getDefaultLegExtensionConfig();
        return segmentReps(frames, config);
    }

    /**
     * Validate a single rep
     */
    validateRep(rep: Rep): boolean {
        return rep.isValid;
    }

    /**
     * Calculate metrics for a single rep
     */
    private calculateRepMetrics(rep: Rep, frames: PoseFrame[]): RepMetrics {
        const repFrames = frames.slice(rep.startFrame, rep.endFrame + 1);

        // Get knee angles
        const kneeAngles = repFrames.map((f) => {
            const right = calculateKneeAngle(f.pose, "right");
            const left = calculateKneeAngle(f.pose, "left");
            return right ?? left ?? 0;
        });

        // Range of Motion
        const maxExtension = Math.max(...kneeAngles);
        const minFlexion = Math.min(...kneeAngles);
        const rangeOfMotion = maxExtension - minFlexion;

        // Hip Stability - measure vertical hip displacement
        const hipPositions = repFrames.map((f) => {
            const rightHip = f.pose.rightHip;
            const leftHip = f.pose.leftHip;
            const hip = rightHip ?? leftHip;
            return hip ? hip.y : 0;
        });

        const maxHipY = Math.max(...hipPositions);
        const minHipY = Math.min(...hipPositions);
        const hipDisplacement = Math.abs(maxHipY - minHipY);

        // Tempo Control - eccentric phase duration
        const durations = calculatePhaseDurations(rep, frames);
        const eccentricDuration = durations.eccentric;

        // Average confidence for this rep
        const confidence =
            repFrames.reduce((sum, f) => sum + f.confidence, 0) / repFrames.length;

        return {
            repNumber: rep.repNumber,
            rangeOfMotion,
            maxExtension,
            hipDisplacement,
            eccentricDuration,
            confidence,
        };
    }

    /**
     * Aggregate issues across all reps
     */
    private aggregateIssues(repMetrics: RepMetrics[]): AggregatedIssues {
        const issues: AggregatedIssues = {
            incompleteExtension: { count: 0, avgConfidence: 0 },
            hipLift: { count: 0, avgConfidence: 0 },
            bouncing: { count: 0, avgConfidence: 0 },
        };

        const incompleteExtensionConfidences: number[] = [];
        const hipLiftConfidences: number[] = [];
        const bouncingConfidences: number[] = [];

        for (const metrics of repMetrics) {
            // Incomplete Extension: max extension < 160 degrees
            if (metrics.maxExtension < 160) {
                issues.incompleteExtension.count++;
                incompleteExtensionConfidences.push(metrics.confidence);
            }

            // Hip Lift: vertical displacement > 0.05 (normalized coordinates)
            if (metrics.hipDisplacement > 0.05) {
                issues.hipLift.count++;
                hipLiftConfidences.push(metrics.confidence);
            }

            // Bouncing: eccentric phase < 800ms (too fast lowering)
            if (metrics.eccentricDuration < 800) {
                issues.bouncing.count++;
                bouncingConfidences.push(metrics.confidence);
            }
        }

        // Calculate average confidences
        issues.incompleteExtension.avgConfidence =
            incompleteExtensionConfidences.length > 0
                ? incompleteExtensionConfidences.reduce((a, b) => a + b, 0) /
                incompleteExtensionConfidences.length
                : 1.0;

        issues.hipLift.avgConfidence =
            hipLiftConfidences.length > 0
                ? hipLiftConfidences.reduce((a, b) => a + b, 0) / hipLiftConfidences.length
                : 1.0;

        issues.bouncing.avgConfidence =
            bouncingConfidences.length > 0
                ? bouncingConfidences.reduce((a, b) => a + b, 0) / bouncingConfidences.length
                : 1.0;

        return issues;
    }

    /**
     * Create form issues from aggregated data
     */
    private createFormIssues(
        aggregated: AggregatedIssues,
        totalValidReps: number
    ): FormIssue[] {
        const issues: FormIssue[] = [];

        // Incomplete Extension
        if (aggregated.incompleteExtension.count > 0) {
            const frequency = aggregated.incompleteExtension.count / totalValidReps;
            const severity =
                frequency > 0.7 ? "severe" : frequency > 0.4 ? "moderate" : "minor";

            issues.push({
                name: "Incomplete Knee Extension",
                severity,
                affectedReps: aggregated.incompleteExtension.count,
                confidence: aggregated.incompleteExtension.avgConfidence,
                description: `Not achieving full knee extension at the top of the movement (${aggregated.incompleteExtension.count}/${totalValidReps} reps)`,
            });
        }

        // Hip Lift
        if (aggregated.hipLift.count > 0) {
            const frequency = aggregated.hipLift.count / totalValidReps;
            const severity =
                frequency > 0.6 ? "severe" : frequency > 0.3 ? "moderate" : "minor";

            issues.push({
                name: "Hip Lift",
                severity,
                affectedReps: aggregated.hipLift.count,
                confidence: aggregated.hipLift.avgConfidence,
                description: `Hips lifting off the seat during the movement (${aggregated.hipLift.count}/${totalValidReps} reps)`,
            });
        }

        // Bouncing/Uncontrolled Lowering
        if (aggregated.bouncing.count > 0) {
            const frequency = aggregated.bouncing.count / totalValidReps;
            const severity =
                frequency > 0.6 ? "severe" : frequency > 0.3 ? "moderate" : "minor";

            issues.push({
                name: "Bouncing or Uncontrolled Lowering",
                severity,
                affectedReps: aggregated.bouncing.count,
                confidence: aggregated.bouncing.avgConfidence,
                description: `Lowering the weight too quickly, indicating loss of control (${aggregated.bouncing.count}/${totalValidReps} reps)`,
            });
        }

        return issues;
    }

    /**
     * Generate positive feedback
     */
    private generatePositives(
        repMetrics: RepMetrics[],
        aggregated: AggregatedIssues
    ): string[] {
        const positives: string[] = [];
        const totalReps = repMetrics.length;

        // Good extension
        const goodExtensionCount = totalReps - aggregated.incompleteExtension.count;
        if (goodExtensionCount / totalReps >= 0.7) {
            positives.push(
                `Achieving full knee extension on ${goodExtensionCount}/${totalReps} reps`
            );
        }

        // Good hip stability
        const goodHipStabilityCount = totalReps - aggregated.hipLift.count;
        if (goodHipStabilityCount / totalReps >= 0.7) {
            positives.push(
                `Maintaining stable hip position on ${goodHipStabilityCount}/${totalReps} reps`
            );
        }

        // Good tempo control
        const goodTempoCount = totalReps - aggregated.bouncing.count;
        if (goodTempoCount / totalReps >= 0.7) {
            positives.push(
                `Controlled eccentric phase on ${goodTempoCount}/${totalReps} reps`
            );
        }

        // Average ROM
        const avgROM =
            repMetrics.reduce((sum, m) => sum + m.rangeOfMotion, 0) / totalReps;
        if (avgROM >= 70) {
            positives.push(`Good range of motion (average ${Math.round(avgROM)}°)`);
        }

        return positives;
    }

    /**
     * Calculate overall score (0-100)
     */
    private calculateOverallScore(
        issues: FormIssue[],
        totalValidReps: number
    ): number {
        if (totalValidReps === 0) return 0;

        let score = 100;

        for (const issue of issues) {
            const frequency = issue.affectedReps / totalValidReps;
            const weightedConfidence = issue.confidence;

            // Deduct points based on severity and frequency
            let deduction = 0;
            if (issue.severity === "severe") {
                deduction = frequency * 30 * weightedConfidence;
            } else if (issue.severity === "moderate") {
                deduction = frequency * 20 * weightedConfidence;
            } else {
                deduction = frequency * 10 * weightedConfidence;
            }

            score -= deduction;
        }

        return Math.max(0, Math.round(score));
    }
}
