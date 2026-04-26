# Task: Video Analysis in Coach Chat

## Goal
Let users attach a video in the coach chat and get form feedback within the conversation.

## Flow
1. User clicks attach button in ChatInterface
2. Selects video file
3. Client runs MediaPipe pose estimation (reuse `src/lib/pose-estimation.ts` PoseEstimationService)
4. Client runs form evaluation (reuse evaluators in `src/lib/formEvaluation/`)
5. Evaluation result sent as part of the chat message to `/api/coach/chat`
6. Agent receives evaluation data and provides coaching feedback in conversation

## Files to Create/Modify

### 1. `src/components/coach/VideoAttachment.tsx` (client component)
- File input for video (accept video/*)
- Preview thumbnail after selection
- Progress indicator during MediaPipe processing
- Once processed, calls parent callback with evaluation result
- Reference `src/components/VideoUpload.tsx` for existing upload pattern

### 2. Modify `src/components/coach/ChatInterface.tsx`
- Add attach button (paperclip icon) next to text input
- When video attached: show VideoAttachment inline
- After processing complete: send message with evaluation data embedded
- The message to the API should include `{ message: string, evaluation?: FormEvaluationResult }`

### 3. Modify `src/app/api/coach/chat/route.ts`
- Accept optional `evaluation` field in request body
- If evaluation present: prepend evaluation summary to user message before passing to orchestrator
- Format: "I'm sharing a video of my {exercise}. Here are the evaluation results: Score: X/100, Issues: [...], Positives: [...]"

### 4. `src/lib/agent/tools/analyzeForm.ts`
- Not a DB-fetching tool — receives evaluation data passed as context
- Formats FormEvaluationResult into readable text for the LLM
- Reference `src/lib/llm-coaching.ts` buildEvaluationMessage() for formatting pattern

## Key References
- `src/lib/formEvaluation/types.ts` — FormEvaluationResult type
- `src/lib/formEvaluation/legExtensionEvaluator.ts` — example evaluator
- `src/lib/pose-estimation.ts` — PoseEstimationService class
- `src/components/VideoUpload.tsx` — existing video upload UI
- `src/lib/llm-coaching.ts` lines 143-180 — buildEvaluationMessage pattern
- `DESIGN.md` — styling

## Acceptance Criteria
- [ ] Attach button visible in chat input area
- [ ] Video processes client-side via MediaPipe
- [ ] Evaluation results sent to agent as context
- [ ] Agent responds with form coaching within the conversation
- [ ] `npm run check` passes
