"use client";

import { useState, useRef, useEffect } from "react";
import type { Exercise } from "@/lib/supabase";
import type { FormFeedback } from "@/lib/llm-analysis-claude";
import type { FormEvaluationResult } from "@/lib/formEvaluation/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatBoxProps {
  exercise: Exercise;
  feedback: FormFeedback;
  evaluation: FormEvaluationResult | any;
}

export default function ChatBox({ exercise, feedback, evaluation }: ChatBoxProps) {
  const score = evaluation?.overallScore ?? evaluation?.formScore ?? 75;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `I've analyzed your ${exercise.name} form. You scored ${Math.round(score)}/100. Feel free to ask me any questions about your form, technique, or how to improve!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise,
          feedback,
          evaluation,
          conversationHistory: messages
            .slice(1)
            .map((m) => ({ role: m.role, content: m.content })),
          userMessage: userMessage.content,
        }),
      });

      let data;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        console.error("Chat API error:", { status: response.status, data });
        const errorMsg = data?.error || data?.details || `Server error (${response.status})`;
        throw new Error(errorMsg);
      }

      if (!data.response) {
        throw new Error(data.error || "No response from AI");
      }

      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      let errorContent = "Sorry, I encountered an error. Please try again.";
      if (error instanceof Error) {
        const errorMsg = error.message;
        if (errorMsg.includes("Authentication failed")) {
          errorContent = "Authentication error: Please check your API key configuration.";
        } else if (errorMsg.includes("Failed to get chat response")) {
          errorContent = `Sorry, I couldn't get a response. Error: ${errorMsg}. Please try again.`;
        } else {
          errorContent = `Sorry, I encountered an error: ${errorMsg}. Please try again.`;
        }
      }
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex flex-col"
      style={{
        height: "600px",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <svg className="w-5 h-5" style={{ color: "var(--accent-teal)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Ask About Your Form
        </h3>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Get personalized answers about your {exercise.name} technique
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[80%] px-4 py-3"
              style={{
                background: message.role === "user" ? "var(--accent-teal)" : "var(--bg-elevated)",
                color: message.role === "user" ? "white" : "var(--text-secondary)",
                borderRadius: "2px",
              }}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className="text-xs mt-1"
                style={{
                  color: message.role === "user" ? "rgba(255,255,255,0.6)" : "var(--text-muted)",
                }}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-3" style={{ background: "var(--bg-elevated)", borderRadius: "2px" }}>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent-teal)", animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent-teal)", animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent-teal)", animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your form..."
            className="flex-1 px-4 py-3 text-sm resize-none transition-colors duration-200"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              borderRadius: "2px",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-teal)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-5 py-3 text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{
              background: "var(--accent-lime)",
              color: "var(--bg-primary)",
              borderRadius: "2px",
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = "var(--accent-lime-dark)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--accent-lime)";
            }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4" style={{ border: "2px solid var(--bg-primary)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span>Sending</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
