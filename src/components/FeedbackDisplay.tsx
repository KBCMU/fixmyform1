"use client";

import type { FormFeedback } from "@/lib/llm-analysis-claude";
import type { FormEvaluationResult } from "@/lib/formEvaluation/types";
import type { Exercise } from "@/lib/supabase";
import ChatBox from "./ChatBox";

interface FeedbackDisplayProps {
  feedback: FormFeedback;
  evaluation: FormEvaluationResult | null | undefined;
  exercise: Exercise;
  onReset: () => void;
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 85 ? "var(--accent-emerald)" :
      score >= 70 ? "var(--accent-teal)" :
        score >= 60 ? "var(--warning)" :
          "var(--danger)";

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          transform="rotate(-90 60 60)"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute text-center">
        <div
          className="text-4xl font-bold"
          style={{ fontFamily: "var(--font-bebas-neue), sans-serif", color }}
        >
          {Math.round(score)}
        </div>
        <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          / 100
        </div>
      </div>
    </div>
  );
}

function FeedbackSection({
  title,
  icon,
  color,
  items,
  numbered = false,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: string[];
  numbered?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className="p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
        <span style={{ color }}>{icon}</span>
        {title}
      </h3>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            {numbered ? (
              <span
                className="shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold"
                style={{ background: color, color: "var(--bg-primary)", borderRadius: "2px" }}
              >
                {idx + 1}
              </span>
            ) : (
              <span className="shrink-0 w-1.5 h-1.5 mt-2" style={{ background: color, borderRadius: "1px" }} />
            )}
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FeedbackDisplay({
  feedback,
  evaluation,
  exercise,
  onReset,
}: FeedbackDisplayProps) {
  const score = evaluation?.overallScore ?? evaluation?.formScore ?? 75;

  return (
    <div className="space-y-4">
      {/* Score Card */}
      <div className="p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <ScoreRing score={score} />
        <p className="text-xs uppercase tracking-[0.2em] mt-4 mb-3" style={{ color: "var(--text-muted)" }}>
          Form Score
        </p>
        <p className="text-sm max-w-lg mx-auto" style={{ color: "var(--text-secondary)" }}>
          {feedback.summary}
        </p>
      </div>

      {/* Feedback Sections */}
      <FeedbackSection
        title="What You're Doing Well"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        color="var(--accent-emerald)"
        items={feedback.strengths}
      />

      <FeedbackSection
        title="Areas for Improvement"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
        color="var(--warning)"
        items={feedback.improvements}
      />

      {feedback.compensatoryPatterns && (
        <FeedbackSection
          title="Compensatory Patterns"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          color="var(--warning)"
          items={feedback.compensatoryPatterns}
        />
      )}

      {feedback.injuryRisks && (
        <FeedbackSection
          title="Potential Injury Risks"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          color="var(--danger)"
          items={feedback.injuryRisks}
        />
      )}

      {/* Movement Metrics Table */}
      {feedback.movementMetrics && feedback.movementMetrics.length > 0 && (
        <div className="p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <svg className="w-5 h-5" style={{ color: "var(--accent-teal)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Biomechanical Metrics
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "var(--accent-teal)" }}>Metric</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "var(--accent-teal)" }}>Observed</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "var(--accent-teal)" }}>Range</th>
                </tr>
              </thead>
              <tbody>
                {feedback.movementMetrics.map((metric, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{metric.metric}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>{metric.value}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{metric.normalRange || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Tips */}
      <FeedbackSection
        title="Detailed Tips"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        }
        color="var(--accent-teal)"
        items={feedback.detailedTips}
        numbered
      />

      {/* Progression Advice */}
      {feedback.progressionAdvice && (
        <div className="p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <svg className="w-5 h-5" style={{ color: "var(--accent-lime)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Next Steps
          </h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{feedback.progressionAdvice}</p>
        </div>
      )}

      {/* Chat Box */}
      <div className="mt-6">
        <ChatBox exercise={exercise} feedback={feedback} evaluation={evaluation} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onReset}
          className="flex-1 py-4 text-sm font-bold transition-all duration-200"
          style={{ background: "var(--accent-lime)", color: "var(--bg-primary)", borderRadius: "2px" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent-lime-dark)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--accent-lime)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Analyze Another Video
        </button>
        <button
          className="px-6 py-4 text-sm font-medium transition-all duration-200"
          style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "2px" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-teal)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-subtle)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          Save Results
        </button>
      </div>
    </div>
  );
}
