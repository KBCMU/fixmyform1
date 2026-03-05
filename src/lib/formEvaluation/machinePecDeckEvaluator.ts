import { FormIssue, FormEvaluationResult, ExerciseEvaluator, PoseFrame } from './types';

const PEC_DECK_THRESHOLDS = {
    // Elbow angles (degrees)
    ELBOW_SETUP_IDEAL_MIN: 80,
    ELBOW_SETUP_IDEAL_MAX: 100,
    ELBOW_ECCENTRIC_PEAK_MIN: 145,       // fault below this
    ELBOW_ECCENTRIC_PEAK_WARN: 150,      // warning below this
    ELBOW_ECCENTRIC_PEAK_IDEAL_MAX: 170,
    ELBOW_LOCKOUT_IDEAL_MIN: 65,
    ELBOW_LOCKOUT_IDEAL_MAX: 85,
    ELBOW_LOCKOUT_FAULT: 90,             // fault if can't close below this
    ELBOW_MIN_TOTAL_ROM: 60,             // critical if total ROM < 60°

    // Torso angles (degrees from vertical)
    TORSO_IDEAL_MIN: 82,
    TORSO_IDEAL_MAX: 98,
    TORSO_WARN_DEVIATION: 8,             // ±8° from 90° = warn
    TORSO_FAULT_DEVIATION: 12,           // ±12° from 90° = fault

    // Shoulder elevation (ratio: ear-shoulder gap / torso height)
    SHOULDER_ELEVATION_IDEAL_MIN: 0.18,
    SHOULDER_ELEVATION_WARN: 0.14,
    SHOULDER_ELEVATION_FAULT: 0.11,

    // Wrist alignment (degrees — 180° = fully neutral)
    WRIST_IDEAL_MIN: 160,
    WRIST_WARN: 155,
    WRIST_FAULT: 150,

    // Phase transition thresholds
    PHASE_TRANSITION_ELBOW_OPEN: 105,    // eccentric begins when elbow opens past this
    PHASE_VELOCITY_STILL: 1.0,           // px/frame — "at rest" threshold
    PHASE_MIN_HOLD_FRAMES: 4,            // debounce frames for phase change

    // Scoring weights (must sum to 100)
    SCORE_WEIGHT_ROM: 30,
    SCORE_WEIGHT_TORSO: 22,
    SCORE_WEIGHT_SHOULDER_ELEVATION: 22,
    SCORE_WEIGHT_WRIST: 11,
    SCORE_WEIGHT_KNEE_ANGLE: 9,
    SCORE_WEIGHT_FOOT_STABILITY: 6,
} as const;

// ============================================================
// Geometry Utilities
// ============================================================
interface Point2D { x: number; y: number; }
class GeometryUtils {
    static angleDeg(a: Point2D, vertex: Point2D, b: Point2D): number {
        const vecA = { x: a.x - vertex.x, y: a.y - vertex.y };
        const vecB = { x: b.x - vertex.x, y: b.y - vertex.y };
        const dot = vecA.x * vecB.x + vecA.y * vecB.y;
        const magA = Math.sqrt(vecA.x ** 2 + vecA.y ** 2);
        const magB = Math.sqrt(vecB.x ** 2 + vecB.y ** 2);
        if (magA === 0 || magB === 0) return 0;
        return Math.acos(Math.max(-1, Math.min(1, dot / (magA * magB)))) * (180 / Math.PI);
    }

    static angleFromVertical(from: Point2D, to: Point2D): number {
        const vec = { x: to.x - from.x, y: to.y - from.y };
        // Vertical reference points straight up (negative Y in image coords)
        const dot = vec.x * 0 + vec.y * -1;
        const mag = Math.sqrt(vec.x ** 2 + vec.y ** 2);
        if (mag === 0) return 90;
        return Math.acos(Math.max(-1, Math.min(1, dot / mag))) * (180 / Math.PI);
    }

    static midpoint(a: Point2D, b: Point2D): Point2D {
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }

    static distance(a: Point2D, b: Point2D): number {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }
}

// ============================================================
// Per-Frame Metric Extraction
// ============================================================
interface FrameMetrics {
    frameIndex: number;
    timestampMs: number;
    leftElbowAngle: number;
    rightElbowAngle: number;
    avgElbowAngle: number;
    torsoAngleFromVertical: number;
    leftShoulderElevationRatio: number;
    rightShoulderElevationRatio: number;
    avgShoulderElevationRatio: number;
    leftWristAngle: number;
    rightWristAngle: number;
    leftShoulderAbduction: number;
    rightShoulderAbduction: number;
    elbowAngleVelocity: number;
    leftKneeAngle: number;
    rightKneeAngle: number;
    leftAnkle: Point2D;
    rightAnkle: Point2D;
    torsoHeight: number;
}

type ExercisePhase = 'SETUP' | 'ECCENTRIC' | 'TRANSITION' | 'CONCENTRIC' | 'LOCKOUT' | 'UNKNOWN';

interface PhaseSnapshot {
    phase: ExercisePhase;
    startFrame: number;
    endFrame: number;
    peakElbowAngle: number;
    lockoutElbowAngle: number;
    totalROM: number;
}

// ============================================================
// Main Evaluator
// ============================================================
export class MachinePecDeckEvaluator implements ExerciseEvaluator {
    private readonly EXERCISE_NAME = 'Machine Pec-Deck';
    private readonly T = PEC_DECK_THRESHOLDS;

    evaluate(frames: PoseFrame[]): FormEvaluationResult {
        if (frames.length < 10) {
            return this.buildEmptyResult(frames, 'Insufficient frames for evaluation');
        }

        const metrics = this.extractFrameMetrics(frames);
        const phases = this.detectPhases(metrics);
        const issues: FormIssue[] = [];

        this.detectShoulderElevation(metrics, phases, issues);
        this.detectForwardTorsoLean(metrics, phases, issues);
        this.detectIncompleteROM(phases, issues);
        this.detectWristCollapse(metrics, phases, issues);
        this.detectFootInstability(metrics, phases, issues);
        this.detectKneeAngleDeviation(metrics, phases, issues);

        const score = this.calculateScore(metrics, phases, issues);
        const repCount = phases.filter(p => p.phase === 'LOCKOUT').length;

        return {
            exerciseName: this.EXERCISE_NAME,
            overallScore: score,
            repCount,
            validReps: repCount, // Assume valid for now
            totalReps: repCount,
            issues,
            positives: [
                { type: 'ROM', message: 'Good overall range of motion.' }
            ],
            phaseSnapshots: phases as any,
            jointAngleSummary: this.buildJointSummary(metrics),
            metadata: {
                totalFrames: frames.length,
                durationMs: frames[frames.length - 1].timestampMs - frames[0].timestampMs,
                evaluatedAt: new Date().toISOString(),
            },
        };
    }

    private extractFrameMetrics(frames: PoseFrame[]): FrameMetrics[] {
        return frames.map((frame, i) => {
            const lm = frame.landmarks;

            const leftElbow = GeometryUtils.angleDeg(lm.leftShoulder, lm.leftElbow, lm.leftWrist);
            const rightElbow = GeometryUtils.angleDeg(lm.rightShoulder, lm.rightElbow, lm.rightWrist);
            const leftKnee = GeometryUtils.angleDeg(lm.leftHip, lm.leftKnee, lm.leftAnkle);
            const rightKnee = GeometryUtils.angleDeg(lm.rightHip, lm.rightKnee, lm.rightAnkle);

            const hipMid = GeometryUtils.midpoint(lm.leftHip, lm.rightHip);
            const shoulderMid = GeometryUtils.midpoint(lm.leftShoulder, lm.rightShoulder);
            const torsoAngle = GeometryUtils.angleFromVertical(hipMid, shoulderMid);

            const torsoHeight = GeometryUtils.distance(hipMid, shoulderMid);
            const leftElevRatio = torsoHeight > 0
                ? Math.abs(lm.leftEar?.y - lm.leftShoulder.y) / torsoHeight
                : 0.2;
            const rightElevRatio = torsoHeight > 0
                ? Math.abs(lm.rightEar?.y - lm.rightShoulder.y) / torsoHeight
                : 0.2;

            const leftWristAngle = GeometryUtils.angleDeg(lm.leftElbow, lm.leftWrist, {
                x: lm.leftWrist.x + (lm.leftWrist.x - lm.leftElbow.x),
                y: lm.leftWrist.y + (lm.leftWrist.y - lm.leftElbow.y),
            });
            const rightWristAngle = GeometryUtils.angleDeg(lm.rightElbow, lm.rightWrist, {
                x: lm.rightWrist.x + (lm.rightWrist.x - lm.rightElbow.x),
                y: lm.rightWrist.y + (lm.rightWrist.y - lm.rightElbow.y),
            });

            const leftShoulderAbd = GeometryUtils.angleDeg(lm.leftHip, lm.leftShoulder, lm.leftElbow);
            const rightShoulderAbd = GeometryUtils.angleDeg(lm.rightHip, lm.rightShoulder, lm.rightElbow);

            const prevAvgElbow = i > 0
                ? (GeometryUtils.angleDeg(frames[i - 1].landmarks.leftShoulder, frames[i - 1].landmarks.leftElbow, frames[i - 1].landmarks.leftWrist) +
                    GeometryUtils.angleDeg(frames[i - 1].landmarks.rightShoulder, frames[i - 1].landmarks.rightElbow, frames[i - 1].landmarks.rightWrist)) / 2
                : (leftElbow + rightElbow) / 2;

            const avgElbow = (leftElbow + rightElbow) / 2;

            return {
                frameIndex: frame.frameIndex,
                timestampMs: frame.timestampMs,
                leftElbowAngle: leftElbow,
                rightElbowAngle: rightElbow,
                avgElbowAngle: avgElbow,
                torsoAngleFromVertical: torsoAngle,
                leftShoulderElevationRatio: leftElevRatio,
                rightShoulderElevationRatio: rightElevRatio,
                avgShoulderElevationRatio: (leftElevRatio + rightElevRatio) / 2,
                leftWristAngle,
                rightWristAngle,
                leftShoulderAbduction: leftShoulderAbd,
                rightShoulderAbduction: rightShoulderAbd,
                elbowAngleVelocity: avgElbow - prevAvgElbow,
                leftKneeAngle: leftKnee,
                rightKneeAngle: rightKnee,
                leftAnkle: lm.leftAnkle,
                rightAnkle: lm.rightAnkle,
                torsoHeight,
            };
        });
    }

    private detectPhases(metrics: FrameMetrics[]): PhaseSnapshot[] {
        const snapshots: PhaseSnapshot[] = [];
        let currentPhase: ExercisePhase = 'SETUP';
        let phaseStartFrame = 0;
        let debounceCount = 0;
        let pendingPhase: ExercisePhase | null = null;
        let peakElbowInPhase = metrics[0]?.avgElbowAngle ?? 90;
        let lockoutElbowInPhase = metrics[0]?.avgElbowAngle ?? 90;

        const commitPhase = (nextPhase: ExercisePhase, frameIndex: number) => {
            snapshots.push({
                phase: currentPhase,
                startFrame: phaseStartFrame,
                endFrame: frameIndex - 1,
                peakElbowAngle: peakElbowInPhase,
                lockoutElbowAngle: lockoutElbowInPhase,
                totalROM: peakElbowInPhase - lockoutElbowInPhase,
            });
            currentPhase = nextPhase;
            phaseStartFrame = frameIndex;
            peakElbowInPhase = metrics[frameIndex]?.avgElbowAngle ?? 90;
            lockoutElbowInPhase = metrics[frameIndex]?.avgElbowAngle ?? 90;
        };

        for (let i = 1; i < metrics.length; i++) {
            const m = metrics[i];
            const angle = m.avgElbowAngle;
            const vel = m.elbowAngleVelocity;

            if (angle > peakElbowInPhase) peakElbowInPhase = angle;
            if (angle < lockoutElbowInPhase) lockoutElbowInPhase = angle;

            let expectedNext: ExercisePhase | null = null;

            if (currentPhase === 'SETUP' && angle > this.T.PHASE_TRANSITION_ELBOW_OPEN && vel > 1.5) {
                expectedNext = 'ECCENTRIC';
            } else if (currentPhase === 'ECCENTRIC' && (angle >= this.T.ELBOW_ECCENTRIC_PEAK_MIN && Math.abs(vel) < this.T.PHASE_VELOCITY_STILL)) {
                expectedNext = 'TRANSITION';
            } else if (currentPhase === 'TRANSITION' && vel < -1.5) {
                expectedNext = 'CONCENTRIC';
            } else if (currentPhase === 'CONCENTRIC' && angle <= this.T.ELBOW_LOCKOUT_IDEAL_MAX && Math.abs(vel) < this.T.PHASE_VELOCITY_STILL) {
                expectedNext = 'LOCKOUT';
            } else if (currentPhase === 'LOCKOUT' && vel > 1.5) {
                expectedNext = 'ECCENTRIC';
            }

            if (expectedNext !== null && expectedNext !== currentPhase) {
                if (expectedNext === pendingPhase) {
                    debounceCount++;
                    if (debounceCount >= this.T.PHASE_MIN_HOLD_FRAMES) {
                        commitPhase(expectedNext, i - debounceCount + 1);
                        pendingPhase = null;
                        debounceCount = 0;
                    }
                } else {
                    pendingPhase = expectedNext;
                    debounceCount = 1;
                }
            } else {
                pendingPhase = null;
                debounceCount = 0;
            }
        }

        snapshots.push({
            phase: currentPhase,
            startFrame: phaseStartFrame,
            endFrame: metrics.length - 1,
            peakElbowAngle: peakElbowInPhase,
            lockoutElbowAngle: lockoutElbowInPhase,
            totalROM: peakElbowInPhase - lockoutElbowInPhase,
        });

        return snapshots;
    }

    private detectShoulderElevation(metrics: FrameMetrics[], phases: PhaseSnapshot[], issues: FormIssue[]): void {
        const criticalFrames: number[] = [];
        const warnFrames: number[] = [];

        for (const m of metrics) {
            const ratio = m.avgShoulderElevationRatio;
            if (ratio < this.T.SHOULDER_ELEVATION_FAULT) criticalFrames.push(m.frameIndex);
            else if (ratio < this.T.SHOULDER_ELEVATION_WARN) warnFrames.push(m.frameIndex);
        }

        if (criticalFrames.length >= 3) {
            const worstFrame = metrics.reduce((prev, curr) => curr.avgShoulderElevationRatio < prev.avgShoulderElevationRatio ? curr : prev);
            issues.push({
                type: 'SHOULDER_ELEVATION_CRITICAL',
                severity: 'high',
                message: 'Severe shoulder shrugging detected.',
                timestamp: worstFrame.timestampMs,
            });
        } else if (warnFrames.length >= 5) {
            const worstFrame = metrics.reduce((prev, curr) => curr.avgShoulderElevationRatio < prev.avgShoulderElevationRatio ? curr : prev);
            issues.push({
                type: 'SHOULDER_ELEVATION_WARNING',
                severity: 'medium',
                message: 'Mild shoulder elevation detected.',
                timestamp: worstFrame.timestampMs,
            });
        }
    }

    private detectForwardTorsoLean(metrics: FrameMetrics[], phases: PhaseSnapshot[], issues: FormIssue[]): void {
        let maxDeviation = 0;
        let worstFrameIndex = 0;

        for (const m of metrics) {
            const deviation = Math.abs(m.torsoAngleFromVertical - 90);
            if (deviation > maxDeviation) {
                maxDeviation = deviation;
                worstFrameIndex = m.frameIndex;
            }
        }

        if (maxDeviation >= this.T.TORSO_FAULT_DEVIATION) {
            issues.push({
                type: 'TORSO_FORWARD_LEAN',
                severity: maxDeviation >= 18 ? 'high' : 'medium',
                message: `Torso deviated ${Math.round(maxDeviation)}° from vertical.`,
                timestamp: metrics.find(m => m.frameIndex === worstFrameIndex)?.timestampMs ?? 0,
            });
        }
    }

    private detectIncompleteROM(phases: PhaseSnapshot[], issues: FormIssue[]): void {
        const transitionPhases = phases.filter(p => p.phase === 'TRANSITION');
        const lockoutPhases = phases.filter(p => p.phase === 'LOCKOUT');

        for (const snap of transitionPhases) {
            if (snap.peakElbowAngle < this.T.ELBOW_ECCENTRIC_PEAK_MIN) {
                issues.push({
                    type: 'INCOMPLETE_ECCENTRIC_STRETCH',
                    severity: snap.peakElbowAngle < 135 ? 'high' : 'medium',
                    message: `Arms only opened to ${Math.round(snap.peakElbowAngle)}° at peak eccentric.`,
                });
            }
        }

        for (const snap of lockoutPhases) {
            if (snap.lockoutElbowAngle > this.T.ELBOW_LOCKOUT_FAULT) {
                issues.push({
                    type: 'INCOMPLETE_CONCENTRIC_SQUEEZE',
                    severity: snap.lockoutElbowAngle > 100 ? 'high' : 'medium',
                    message: `Arms only closed to ${Math.round(snap.lockoutElbowAngle)}° at lockout.`,
                });
            }
        }
    }

    private detectWristCollapse(metrics: FrameMetrics[], phases: PhaseSnapshot[], issues: FormIssue[]): void {
        const faultFrames = metrics.filter(m => m.leftWristAngle < this.T.WRIST_FAULT || m.rightWristAngle < this.T.WRIST_FAULT);
        if (faultFrames.length >= 3) {
            issues.push({
                type: 'WRIST_COLLAPSE',
                severity: 'medium',
                message: 'Wrist alignment collapsed under load.',
                timestamp: faultFrames[0].timestampMs
            });
        }
    }

    private detectFootInstability(metrics: FrameMetrics[], phases: PhaseSnapshot[], issues: FormIssue[]): void {
        const faultFrames: number[] = [];
        for (let i = 1; i < metrics.length; i++) {
            const curr = metrics[i];
            const prev = metrics[i - 1];
            const leftDrift = GeometryUtils.distance(curr.leftAnkle, prev.leftAnkle) / curr.torsoHeight;
            const rightDrift = GeometryUtils.distance(curr.rightAnkle, prev.rightAnkle) / curr.torsoHeight;
            if (Math.max(leftDrift, rightDrift) > 0.04) faultFrames.push(curr.frameIndex);
        }
        if (faultFrames.length >= 3) {
            issues.push({
                type: 'FOOT_INSTABILITY',
                severity: 'high',
                message: 'Significant foot movement detected. Loss of base stability.',
                timestamp: metrics.find(m => m.frameIndex === faultFrames[0])?.timestampMs
            });
        }
    }

    private detectKneeAngleDeviation(metrics: FrameMetrics[], phases: PhaseSnapshot[], issues: FormIssue[]): void {
        const setupFrames = metrics.filter(m =>
            this.getPhaseForFrame(m.frameIndex, phases) === 'SETUP' ||
            this.getPhaseForFrame(m.frameIndex, phases) === 'ECCENTRIC'
        );
        if (setupFrames.length === 0) return;

        const avgKneeAngle = setupFrames.reduce((sum, m) => sum + (m.leftKneeAngle + m.rightKneeAngle) / 2, 0) / setupFrames.length;
        if (avgKneeAngle > 110) {
            issues.push({
                type: 'KNEE_ANGLE_SEAT_TOO_HIGH',
                severity: 'high',
                message: `Knee angle ${Math.round(avgKneeAngle)}° — seat is likely too high.`,
                timestamp: setupFrames[0].timestampMs
            });
        } else if (avgKneeAngle < 75) {
            issues.push({
                type: 'KNEE_ANGLE_SEAT_TOO_LOW',
                severity: 'high',
                message: `Knee angle ${Math.round(avgKneeAngle)}° — seat is likely too low.`,
                timestamp: setupFrames[0].timestampMs
            });
        }
    }

    private calculateScore(metrics: FrameMetrics[], phases: PhaseSnapshot[], issues: FormIssue[]): number {
        const T = this.T;
        let romScore = 100, torsoScore = 100, elevationScore = 100, wristScore = 100;

        const transitionPhases = phases.filter(p => p.phase === 'TRANSITION');
        if (transitionPhases.length > 0) {
            const avgPeakOpen = transitionPhases.reduce((sum, p) => sum + p.peakElbowAngle, 0) / transitionPhases.length;
            const lockoutPhases = phases.filter(p => p.phase === 'LOCKOUT');
            const avgLockout = lockoutPhases.length > 0 ? lockoutPhases.reduce((sum, p) => sum + p.lockoutElbowAngle, 0) / lockoutPhases.length : 90;
            const openScore = Math.min(100, Math.max(0, ((avgPeakOpen - T.ELBOW_ECCENTRIC_PEAK_MIN) / (T.ELBOW_ECCENTRIC_PEAK_IDEAL_MAX - T.ELBOW_ECCENTRIC_PEAK_MIN)) * 100));
            const closeScore = Math.min(100, Math.max(0, ((T.ELBOW_LOCKOUT_FAULT - avgLockout) / (T.ELBOW_LOCKOUT_FAULT - T.ELBOW_LOCKOUT_IDEAL_MIN)) * 100));
            romScore = (openScore + closeScore) / 2;
        }

        const avgTorsoDeviation = metrics.reduce((sum, m) => sum + Math.abs(m.torsoAngleFromVertical - 90), 0) / metrics.length;
        torsoScore = Math.max(0, 100 - (avgTorsoDeviation / T.TORSO_FAULT_DEVIATION) * 100);

        const minElevation = metrics.reduce((min, m) => Math.min(min, m.avgShoulderElevationRatio), Infinity);
        if (minElevation < T.SHOULDER_ELEVATION_FAULT) elevationScore = 0;
        else if (minElevation < T.SHOULDER_ELEVATION_IDEAL_MIN) elevationScore = ((minElevation - T.SHOULDER_ELEVATION_FAULT) / (T.SHOULDER_ELEVATION_IDEAL_MIN - T.SHOULDER_ELEVATION_FAULT)) * 100;

        const avgWrist = metrics.reduce((sum, m) => sum + Math.min(m.leftWristAngle, m.rightWristAngle), 0) / metrics.length;
        wristScore = Math.min(100, Math.max(0, ((avgWrist - T.WRIST_FAULT) / (180 - T.WRIST_FAULT)) * 100));

        const rawScore = (romScore * T.SCORE_WEIGHT_ROM) / 100 + (torsoScore * T.SCORE_WEIGHT_TORSO) / 100 + (elevationScore * T.SCORE_WEIGHT_SHOULDER_ELEVATION) / 100 + (wristScore * T.SCORE_WEIGHT_WRIST) / 100;

        let penalty = 0;
        for (const issue of issues) {
            if (issue.severity === 'high') penalty += 15;
            else if (issue.severity === 'medium') penalty += 8;
            else penalty += 3;
        }

        return Math.round(Math.max(0, Math.min(100, rawScore - penalty)));
    }

    private getPhaseForFrame(frameIndex: number, phases: PhaseSnapshot[]): ExercisePhase {
        for (const snap of phases) {
            if (frameIndex >= snap.startFrame && frameIndex <= snap.endFrame) return snap.phase;
        }
        return 'UNKNOWN';
    }

    private buildJointSummary(metrics: FrameMetrics[]) {
        return {
            // Provide some raw data
            elbowPeakOpen: Math.max(...metrics.map(m => m.avgElbowAngle)),
            elbowPeakClosed: Math.min(...metrics.map(m => m.avgElbowAngle)),
        };
    }

    private buildEmptyResult(frames: PoseFrame[], reason: string): FormEvaluationResult {
        return {
            exerciseName: this.EXERCISE_NAME,
            overallScore: 0,
            repCount: 0,
            validReps: 0,
            totalReps: 0,
            issues: [{ type: 'EVALUATION_ERROR', severity: 'medium', message: reason }],
            positives: [],
            metadata: { totalFrames: frames.length, durationMs: 0, evaluatedAt: new Date().toISOString() }
        };
    }
}
