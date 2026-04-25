# Library Exports (generated 2026-04-23)
# fn=function, class=class. Type-only files omitted.

## src\lib
angle-calculator.ts
  fn calculateAngle
  fn calculateKneeAngle
  fn calculateHipAngle
  fn calculateAnkleAngle
  +6 more
csv-exercise-service.ts
  fn loadExercisesFromCSV
  fn clearExerciseCache
  fn getAllExercises
  fn searchExercises
  +1 more
exercise-criteria.ts
  fn getExerciseCriteria
  fn getAllExerciseCriteria
exercises.ts
  fn searchExercises
  fn getExerciseById
  fn getExercisesByCategory
llm-analysis.ts
  fn generateFeedback
  fn generateFeedbackWithLLM
llm-coaching.ts
  fn generateCoachingFeedback
  fn handleCoachingQuestion
pose-analysis.ts
  fn analyzeExerciseForm
  fn formatCheckpointValue
  fn getSeverityColor
  fn getSeverityEmoji
pose-comparison.ts
  fn comparePoses
  fn compareVideoWithReferences
pose-data-converter.ts
  fn convertLandmarksToPoseKeypoints
  fn convertPoseDataToPoseKeypoints
pose-embeddings.ts
  fn generatePoseEmbedding
  fn cosineSimilarity
  fn poseDifferenceScore
  fn generateVectorizeEmbedding
pose-estimation.ts
  class PoseEstimationService
  fn keypointsToArray
  fn normalizeKeypoints
reference-database.ts
  fn generateMockReferencePoses
  fn getReferencePosesForExercise
  fn storeReferenceVideo
supabase-service.ts
  fn getAllExercises
  fn getExerciseById
  fn searchExercises
  fn getUserAnalysisHistory
  +1 more
# 7 single-export files:
d1-database:D1Service  |  llm-analysis-claude:generateFeedbackWithClaude  |  pose-estimation-simple:PoseEstimationService
pose-estimation-v2:PoseEstimationService  |  r2-storage:R2Storage  |  supabase:getSupabaseAdmin
vectorize:VectorizeService

## src\lib\formEvaluation
formEvaluationService.ts
  fn saveFormEvaluation
  fn getFormEvaluation
  fn getUserFormEvaluations
  fn getLatestEvaluation
repSegmentation.ts
  fn segmentReps
  fn calculatePhaseDurations
  fn getDefaultLegExtensionConfig
utils.ts
  fn convertToPoseFrames
  fn calculateAverageConfidence
keyFrameExtractor.ts  fn extractKeyFrames
legExtensionEvaluator.ts  fn LegExtensionEvaluator
machinePecDeckEvaluator.ts  fn MachinePecDeckEvaluator

## src\lib\supabase
client.ts  fn createClient
server.ts  fn createClient
