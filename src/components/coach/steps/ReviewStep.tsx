"use client";

import type { TrainingBackground } from "@/lib/agent/types";

interface ReviewStepProps {
  value: Partial<TrainingBackground>;
  onEdit: (stepIndex: number) => void;
  onSubmit: () => void;
  submitting: boolean;
}

const STEP_LABELS = ["Background", "Frequency", "Injuries", "Preferences"];

function SectionCard({
  title,
  stepIndex,
  onEdit,
  children,
}: {
  title: string;
  stepIndex: number;
  onEdit: (i: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#0A0A0A",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "4px",
        padding: "20px",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#AAAAAA",
            fontFamily: "'Geist Mono', monospace",
          }}
        >
          {title}
        </div>
        <button
          onClick={() => onEdit(stepIndex)}
          style={{
            background: "none",
            border: "none",
            color: "#E66A23",
            fontSize: "12px",
            cursor: "pointer",
            padding: "2px 6px",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#D1834B")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#E66A23")}
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: "rgba(230,106,35,0.12)",
        border: "1px solid rgba(230,106,35,0.3)",
        borderRadius: "4px",
        padding: "4px 10px",
        fontSize: "12px",
        color: "#E2B28B",
      }}
    >
      {label}
    </span>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>{label}</span>
      <span style={{ color: "#ffffff", fontSize: "13px", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const LEVEL_LABELS: Record<string, string> = {
  never: "Never trained",
  beginner: "0–1 years",
  intermediate: "1–3 years",
  advanced: "3+ years",
};

export default function ReviewStep({ value, onEdit, onSubmit, submitting }: ReviewStepProps) {
  return (
    <div>
      <div className="mb-10 text-center">
        <h2
          style={{
            fontFamily: "var(--font-serif), 'Cormorant Garamond', serif",
            fontSize: "clamp(24px, 4vw, 36px)",
            color: "rgba(255,255,255,0.9)",
            letterSpacing: "0.02em",
            marginBottom: "8px",
          }}
        >
          Review Your Profile
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
          Make sure everything looks right before we get started.
        </p>
      </div>

      <div style={{ maxWidth: "540px", margin: "0 auto 36px" }}>
        {/* Background */}
        <SectionCard title={STEP_LABELS[0]} stepIndex={0} onEdit={onEdit}>
          <DataRow
            label="Experience"
            value={value.experienceLevel ? LEVEL_LABELS[value.experienceLevel] ?? value.experienceLevel : "—"}
          />
        </SectionCard>

        {/* Frequency */}
        <SectionCard title={STEP_LABELS[1]} stepIndex={1} onEdit={onEdit}>
          <DataRow
            label="Frequency"
            value={value.trainingFrequency ? `${value.trainingFrequency}x / week` : "—"}
          />
        </SectionCard>

        {/* Injuries */}
        <SectionCard title={STEP_LABELS[2]} stepIndex={2} onEdit={onEdit}>
          {(value.injuries ?? []).length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {value.injuries!.map((inj) => (
                <Tag key={inj} label={inj} />
              ))}
            </div>
          ) : (
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>No injuries reported</span>
          )}
        </SectionCard>

        {/* Preferences */}
        <SectionCard title={STEP_LABELS[3]} stepIndex={3} onEdit={onEdit}>
          <div style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {(value.preferredEquipment ?? []).map((eq) => (
                <Tag key={eq} label={eq} />
              ))}
            </div>
          </div>
          <DataRow label="Diet" value={value.dietApproach ?? "—"} />
          {value.additionalNotes && (
            <div style={{ marginTop: "8px" }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "4px" }}>Notes</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: "1.5" }}>
                {value.additionalNotes}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={onSubmit}
          disabled={submitting}
          style={{
            background: submitting ? "rgba(230,106,35,0.6)" : "#E66A23",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            padding: "16px 48px",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: submitting ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
          }}
          onMouseEnter={(e) => {
            if (!submitting) e.currentTarget.style.background = "#D1834B";
          }}
          onMouseLeave={(e) => {
            if (!submitting) e.currentTarget.style.background = "#E66A23";
          }}
        >
          {submitting ? (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4m-3.93 7.07l-2.83-2.83M7.76 7.76L4.93 4.93"
                />
              </svg>
              Saving...
            </>
          ) : (
            "Start Coaching"
          )}
        </button>
      </div>
    </div>
  );
}
