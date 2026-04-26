"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import VideoAttachment from "./VideoAttachment";
import NotificationOptIn from "./NotificationOptIn";
import type { FormEvaluationResult } from "@/lib/formEvaluation/types";

// ── Types ─────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

// ── Component ─────────────────────────────────────────────────────

export default function ChatInterface() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showVideoAttachment, setShowVideoAttachment] = useState(false);
  const [evaluation, setEvaluation] = useState<FormEvaluationResult | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Scroll to bottom ────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Load conversations on mount ─────────────────────────────────

  useEffect(() => {
    if (!user) return;

    async function loadConversations() {
      try {
        const res = await fetch("/api/coach/conversations");
        if (!res.ok) return;
        const data = (await res.json()) as { conversations?: Conversation[] };
        setConversations(data.conversations ?? []);
      } catch {
        // Silently fail — user can still start a new conversation
      } finally {
        setLoadingConversations(false);
      }
    }
    loadConversations();
  }, [user]);

  // ── Load messages when conversation changes ─────────────────────

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      try {
        const res = await fetch(
          `/api/coach/conversations?id=${activeConversationId}`
        );
        if (!res.ok) return;
        const data = (await res.json()) as { messages?: Message[] };
        setMessages(data.messages ?? []);
      } catch {
        // Silently fail
      }
    }
    loadMessages();
  }, [activeConversationId]);

  // ── Send message ────────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

    // Optimistic: show user message immediately
    const tempId = `temp-${Date.now()}`;
    const userMsg: Message = {
      id: tempId,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const body: {
        conversationId: string | null;
        message: string;
        evaluation?: FormEvaluationResult;
      } = {
        conversationId: activeConversationId,
        message: text,
      };

      if (evaluation) {
        body.evaluation = evaluation;
      }

      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errData.error ?? "Failed to send message");
      }

      const data = (await res.json()) as { conversationId?: string; response?: string; toolsUsed?: string[] };

      // If this was a new conversation, update state
      if (!activeConversationId && data.conversationId) {
        setActiveConversationId(data.conversationId);
        // Add to conversation list
        const newConversation: Conversation = {
          id: data.conversationId,
          title: text.length > 50 ? text.substring(0, 47) + "..." : text,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setConversations((prev) => [newConversation, ...prev]);
      }

      // Add assistant response
      if (data.response) {
        const assistantMsg: Message = {
          id: `resp-${Date.now()}`,
          role: "assistant",
          content: data.response,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      // Show error as an assistant message
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
      setEvaluation(null);
      setShowVideoAttachment(false);
      setAttachmentError(null);
      inputRef.current?.focus();
    }
  }, [input, sending, activeConversationId, evaluation]);

  // ── Handle key press ────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // ── Start new conversation ──────────────────────────────────────

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setShowSidebar(false);
    inputRef.current?.focus();
  }, []);

  // ── Select conversation ─────────────────────────────────────────

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setShowSidebar(false);
  }, []);

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div
      style={{
        background: "#0A0A0A",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "4px",
        height: "600px",
        display: "flex",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Sidebar toggle (mobile) */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          zIndex: 20,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "4px",
          padding: "6px 10px",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontSize: "12px",
          fontFamily: "var(--font-mono), 'Geist Mono', monospace",
          letterSpacing: "0.05em",
        }}
        className="lg:hidden"
      >
        {showSidebar ? "CLOSE" : "CHATS"}
      </button>

      {/* Sidebar */}
      <div
        style={{
          width: "240px",
          minWidth: "240px",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          background: "#050505",
        }}
        className={`${
          showSidebar ? "absolute inset-0 z-10" : "hidden"
        } lg:relative lg:flex`}
      >
        {/* New chat button */}
        <div style={{ padding: "16px 12px 8px" }}>
          <button
            onClick={startNewConversation}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "rgba(230,106,35,0.12)",
              border: "1px solid rgba(230,106,35,0.25)",
              borderRadius: "4px",
              color: "#E66A23",
              cursor: "pointer",
              fontSize: "13px",
              fontFamily: "var(--font-mono), 'Geist Mono', monospace",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            + New Chat
          </button>
        </div>

        {/* Conversation list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "4px 8px",
          }}
        >
          {loadingConversations && (
            <div
              style={{
                padding: "20px 8px",
                color: "rgba(255,255,255,0.25)",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              Loading...
            </div>
          )}

          {!loadingConversations && conversations.length === 0 && (
            <div
              style={{
                padding: "20px 8px",
                color: "rgba(255,255,255,0.2)",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              No conversations yet
            </div>
          )}

          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              style={{
                width: "100%",
                padding: "10px 8px",
                background:
                  conv.id === activeConversationId
                    ? "rgba(230,106,35,0.08)"
                    : "transparent",
                border: "none",
                borderRadius: "4px",
                color:
                  conv.id === activeConversationId
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: "13px",
                textAlign: "left",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: "2px",
              }}
            >
              {conv.title ?? "Untitled"}
            </button>
          ))}
        </div>

        {/* Notification Opt-In */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "12px 8px",
            background: "linear-gradient(to bottom, transparent, rgba(230,106,35,0.02))",
          }}
        >
          <NotificationOptIn />
        </div>
      </div>

      {/* Main chat area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "56px 20px 20px",
          }}
        >
          {/* Video Attachment Component */}
          {showVideoAttachment && (
            <VideoAttachment
              onEvaluationComplete={(evalResult) => {
                setEvaluation(evalResult);
                setShowVideoAttachment(false);
                setAttachmentError(null);
              }}
              onError={(error) => {
                setAttachmentError(error.message);
              }}
              onCancel={() => {
                setShowVideoAttachment(false);
                setAttachmentError(null);
              }}
            />
          )}

          {/* Attachment Error Message */}
          {attachmentError && (
            <div
              style={{
                marginBottom: "12px",
                padding: "12px 16px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "4px",
                color: "rgba(239,68,68,0.9)",
                fontSize: "13px",
              }}
            >
              {attachmentError}
              <button
                onClick={() => setAttachmentError(null)}
                style={{
                  marginLeft: "8px",
                  background: "transparent",
                  border: "none",
                  color: "rgba(239,68,68,0.9)",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "13px",
                }}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Evaluation Summary */}
          {evaluation && (
            <div
              style={{
                marginBottom: "12px",
                padding: "16px",
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: "4px",
                color: "rgba(255,255,255,0.8)",
                fontSize: "13px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                <strong style={{ color: "rgba(34,197,94,0.9)" }}>Form Analysis Ready</strong>
                <button
                  onClick={() => {
                    setEvaluation(null);
                    setAttachmentError(null);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  ×
                </button>
              </div>
              <p style={{ margin: "0 0 8px 0", fontSize: "13px" }}>
                {evaluation.exercise} • Score: {evaluation.overallScore}/100 • {evaluation.validReps}/{evaluation.totalReps} valid reps
              </p>
              {evaluation.issues.length > 0 && (
                <p style={{ margin: "0 0 4px 0", color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>
                  Issues: {evaluation.issues.map((i) => i.name).join(", ")}
                </p>
              )}
              {evaluation.positives.length > 0 && (
                <p style={{ margin: 0, color: "rgba(34,197,94,0.8)", fontSize: "12px" }}>
                  Strengths: {evaluation.positives.join(", ")}
                </p>
              )}
            </div>
          )}
          {messages.length === 0 && !sending && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "rgba(255,255,255,0.2)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  marginBottom: "16px",
                  background: "rgba(230,106,35,0.08)",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="#E66A23"
                  viewBox="0 0 24 24"
                  style={{ opacity: 0.5 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p style={{ fontSize: "14px", maxWidth: "280px" }}>
                Ask me anything about training, form, programming, or nutrition.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent:
                  msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  ...(msg.role === "user"
                    ? {
                        background: "rgba(230,106,35,0.15)",
                        border: "1px solid rgba(230,106,35,0.25)",
                        color: "rgba(255,255,255,0.9)",
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.8)",
                      }),
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {sending && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "14px",
                }}
              >
                <span className="inline-flex items-center gap-1">
                  <span
                    className="animate-pulse"
                    style={{ animationDelay: "0ms" }}
                  >
                    .
                  </span>
                  <span
                    className="animate-pulse"
                    style={{ animationDelay: "200ms" }}
                  >
                    .
                  </span>
                  <span
                    className="animate-pulse"
                    style={{ animationDelay: "400ms" }}
                  >
                    .
                  </span>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "#050505",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "flex-end",
            }}
          >
            {/* Attach button */}
            <button
              onClick={() => setShowVideoAttachment(!showVideoAttachment)}
              disabled={sending}
              style={{
                padding: "10px 12px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                color: showVideoAttachment ? "#E66A23" : "rgba(255,255,255,0.5)",
                cursor: sending ? "not-allowed" : "pointer",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: sending ? 0.5 : 1,
              }}
              title="Attach video"
              onMouseEnter={(e) => {
                if (!sending) {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "#E66A23";
                }
              }}
              onMouseLeave={(e) => {
                if (!showVideoAttachment) {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                }
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your coach..."
              rows={1}
              disabled={sending}
              style={{
                flex: 1,
                resize: "none",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                padding: "10px 14px",
                color: "rgba(255,255,255,0.9)",
                fontSize: "14px",
                fontFamily: "inherit",
                lineHeight: "1.5",
                outline: "none",
                minHeight: "42px",
                maxHeight: "120px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              style={{
                padding: "10px 20px",
                background:
                  sending || !input.trim()
                    ? "rgba(230,106,35,0.2)"
                    : "#E66A23",
                border: "none",
                borderRadius: "4px",
                color:
                  sending || !input.trim()
                    ? "rgba(255,255,255,0.3)"
                    : "#FFFFFF",
                cursor:
                  sending || !input.trim() ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontFamily:
                  "var(--font-mono), 'Geist Mono', monospace",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!sending && input.trim()) {
                  e.currentTarget.style.background = "#A4430F";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#E66A23";
              }}
            >
              {sending ? "..." : evaluation ? "Send with Analysis" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
