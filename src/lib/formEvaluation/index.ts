/**
 * Form Evaluation Module
 * Deterministic form analysis system for machine exercises
 * 
 * @module formEvaluation
 */

// Core types
export type {
    PoseFrame,
    Rep,
    FormIssue,
    FormEvaluationResult,
    RepSegmentationConfig,
    ExerciseEvaluator,
} from "./types";

// Rep segmentation
export {
    segmentReps,
    calculatePhaseDurations,
    getDefaultLegExtensionConfig,
} from "./repSegmentation";

// Evaluators
export { LegExtensionEvaluator } from "./legExtensionEvaluator";
export { MachinePecDeckEvaluator } from "./machinePecDeckEvaluator";

// Utilities
export { convertToPoseFrames, calculateAverageConfidence } from "./utils";

// Supabase service
export {
    saveFormEvaluation,
    getFormEvaluation,
    getUserFormEvaluations,
    getLatestEvaluation,
} from "./formEvaluationService";

export type { StoredFormEvaluation } from "./formEvaluationService";
