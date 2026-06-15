"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  meta?: {
    model: string;
    tier: string;
    latency_ms: number;
    tokens_used: number;
    cache_hit: boolean;
    estimated_cost_usd: number;
    subtasks_count: number;
    complexity_score: number;
    routing_reasoning: string;
    subtasks: string[];
  };
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  simple:  { label: "Simple",  color: "#10B981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)",  dot: "#10B981" },
  medium:  { label: "Medium",  color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  dot: "#F59E0B" },
  complex: { label: "Complex", color: "#EF4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   dot: "#EF4444" },
};

const MODEL_SHORT: Record<string, string> = {
  "llama-3.1-8b-instant":          "Llama 3.1 · 8B",
  "llama-3.3-70b-versatile":       "Llama 3.3 · 70B",
  "deepseek-r1-distill-llama-70b": "DeepSeek R1 · 70B",
};

const GPT4O_COST_PER_1K = 0.03;

const SUGGESTIONS = [
  { text: "What is 2 + 2?", tier: "simple" },
  { text: "Explain how transformers work in NLP", tier: "medium" },
  { text: "Design a distributed rate limiter for 10M req/sec", tier: "complex" },
];

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "14px 18px" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "#6366F1",
          display: "inline-block",
          animation: "dotpulse 1.2s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

function RoutingPanel({ meta }: { meta: NonNullable<Message["meta"]> }) {
  const [open, setOpen] = useState(false);
  const tier = TIER_CONFIG[meta.tier] || TIER_CONFIG.medium;
  const score = meta.complexity_score;
  const barPct = (score / 10) * 100;

  return (
    <div style={{ marginTop: 6 }}>
      {/* Compact badge row */}
      <div style={{
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8,
        padding: "8px 14px", borderRadius: open ? "10px 10px 0 0" : 10,
        background: tier.bg, border: `1px solid ${tier.border}`,
        fontSize: 11, fontFamily: "'Space Grotesk', sans-serif",
        cursor: "pointer", userSelect: "none",
        borderBottom: open ? "none" : undefined,
      }} onClick={() => setOpen(o => !o)}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: tier.dot }} />
          <span style={{ color: tier.color, fontWeight: 700, letterSpacing: "0.04em" }}>{meta.tier.toUpperCase()}</span>
        </span>
        <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
        <span style={{ color: "rgba(255,255,255,0.5)" }}>{MODEL_SHORT[meta.model] || meta.model}</span>
        <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
        <span style={{ color: "rgba(255,255,255,0.5)" }}>{meta.latency_ms.toFixed(0)}ms</span>
        <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
        <span style={{ color: "rgba(255,255,255,0.5)" }}>${meta.estimated_cost_usd.toFixed(6)}</span>
        <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
        <span style={{ color: "rgba(255,255,255,0.5)" }}>{meta.tokens_used} tokens</span>
        {meta.cache_hit && <><span style={{ color: "rgba(255,255,255,0.25)" }}>·</span><span style={{ color: "#10B981", fontWeight: 700 }}>⚡ Cached</span></>}
        <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{open ? "▲ hide" : "▼ routing"}</span>
      </div>

      {/* Expandable routing explanation */}
      {open && (
        <div style={{
          background: "rgba(10,12,24,0.95)",
          border: `1px solid ${tier.border}`,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderRadius: "0 0 10px 10px",
          padding: "14px 16px",
          fontSize: 12,
          animation: "fadeSlideUp 0.2s ease forwards",
        }}>
          {/* Complexity score bar */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: "0.06em" }}>COMPLEXITY SCORE</span>
              <span style={{ color: tier.color, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{score}/10</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${barPct}%`,
                background: `linear-gradient(90deg, #6366F1, ${tier.color})`,
                borderRadius: 3, transition: "width 0.6s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "'Space Grotesk', sans-serif" }}>
              <span>SIMPLE (1–4)</span><span>MEDIUM (5–7)</span><span>COMPLEX (8–10)</span>
            </div>
          </div>

          {/* Routing reasoning */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: "0.06em", marginBottom: 5 }}>ROUTING DECISION</div>
            <div style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
              Scored <strong style={{ color: tier.color }}>{score}/10</strong> → routed to <strong style={{ color: "#818CF8" }}>{MODEL_SHORT[meta.model]}</strong>
              {meta.routing_reasoning && <> · <span style={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>{meta.routing_reasoning}</span></>}
            </div>
          </div>

          {/* Subtasks */}
          {meta.subtasks && meta.subtasks.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: "0.06em", marginBottom: 6 }}>SUBTASKS EXECUTED ({meta.subtasks.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {meta.subtasks.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 18, height: 18, borderRadius: 5, background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#818CF8", fontWeight: 700, flexShrink: 0 }}>{i+1}</span>
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost comparison */}
          <div style={{
            display: "flex", gap: 10,
            padding: "10px 12px", borderRadius: 8,
            background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
          }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.06em", marginBottom: 3 }}>AGENTROUTER</div>
              <div style={{ color: "#10B981", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", fontSize: 14 }}>${meta.estimated_cost_usd.toFixed(6)}</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.06em", marginBottom: 3 }}>GPT-4o EQUIV.</div>
              <div style={{ color: "#F87171", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", fontSize: 14 }}>${((meta.tokens_used / 1000) * GPT4O_COST_PER_1K).toFixed(6)}</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.06em", marginBottom: 3 }}>SAVED</div>
              <div style={{ color: "#FBBF24", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", fontSize: 14 }}>
                {(((meta.tokens_used / 1000) * GPT4O_COST_PER_1K - meta.estimated_cost_usd) / ((meta.tokens_used / 1000) * GPT4O_COST_PER_1K) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalSaved, setTotalSaved] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (query?: string) => {
    const text = (query || input).trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Add streaming placeholder
    const placeholderId = Date.now();
    setMessages(prev => [...prev, { role: "assistant", content: "", streaming: true }]);

    try {
      // First call /query for routing metadata
      const res = await fetch("https://agentrouter-backend.onrender.com/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json();

      // Now stream the answer token by token for visual effect
      let streamed = "";
      const fullAnswer = data.answer;

      // Simulate streaming by revealing tokens progressively
      const words = fullAnswer.split(" ");
      for (let i = 0; i < words.length; i++) {
        streamed += (i === 0 ? "" : " ") + words[i];
        const current = streamed;
        setMessages(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.streaming) copy[copy.length - 1] = { ...last, content: current };
          return copy;
        });
        await new Promise(r => setTimeout(r, 18));
      }

      // Finalize with full meta
      const savedThisMsg = ((data.tokens_used / 1000) * GPT4O_COST_PER_1K) - data.estimated_cost_usd;
      setTotalSaved(prev => prev + savedThisMsg);

      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: fullAnswer,
          streaming: false,
          meta: {
            model: data.model_used,
            tier: data.tier,
            latency_ms: data.latency_ms,
            tokens_used: data.tokens_used,
            cache_hit: data.cache_hit,
            estimated_cost_usd: data.estimated_cost_usd,
            subtasks_count: data.subtasks_count,
            complexity_score: data.complexity_score,
            routing_reasoning: data.routing_reasoning,
            subtasks: data.subtasks,
          },
        };
        return copy;
      });
    } catch {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: "⚠️ Could not reach backend on port 8000." };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050810; }
        @keyframes dotpulse { 0%,80%,100%{opacity:0.2;transform:scale(0.85)} 40%{opacity:1;transform:scale(1)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .msg-anim { animation: fadeSlideUp 0.22s ease forwards; }
        textarea:focus { outline: none; }
        textarea { resize: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 4px; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#050810", fontFamily: "'Inter', sans-serif" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px", height: 60,
          borderBottom: "1px solid rgba(99,102,241,0.15)",
          background: "rgba(5,8,16,0.95)", backdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: "linear-gradient(135deg, #6366F1, #22D3EE)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#fff", letterSpacing: "-0.02em" }}>AgentRouter</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>COST-AWARE MULTI-AGENT ORCHESTRATION</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Live cost savings counter */}
            {totalSaved > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "6px 14px", borderRadius: 8,
                background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>SAVED vs GPT-4o</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>${totalSaved.toFixed(5)}</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'Space Grotesk', sans-serif" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block", boxShadow: "0 0 6px #10B981" }} />
              Live
            </div>
            <Link href="/dashboard" style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "7px 16px", borderRadius: 8,
              background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
              color: "#818CF8", fontSize: 12, fontWeight: 500,
              textDecoration: "none", fontFamily: "'Space Grotesk', sans-serif",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Dashboard
            </Link>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 0" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>

            {/* Empty state */}
            {messages.length === 0 && (
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(34,211,238,0.1))",
                  border: "1px solid rgba(99,102,241,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 24px",
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", marginBottom: 10 }}>
                  Intelligent routing, zero waste
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.7, maxWidth: 400, margin: "0 auto 36px" }}>
                  Every query is analyzed, scored, and routed to the cheapest model that can handle it — saving up to 95% vs GPT-4o.
                </p>

                {/* Tier cards */}
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 36 }}>
                  {[
                    { tier: "simple",  model: "Llama 3.1 8B",  desc: "Facts & math",   score: "1–4" },
                    { tier: "medium",  model: "Llama 3.3 70B", desc: "Reasoning",       score: "5–7" },
                    { tier: "complex", model: "DeepSeek R1",    desc: "Deep analysis",  score: "8–10" },
                  ].map(t => {
                    const cfg = TIER_CONFIG[t.tier];
                    return (
                      <div key={t.tier} style={{
                        padding: "12px 16px", borderRadius: 10,
                        background: cfg.bg, border: `1px solid ${cfg.border}`,
                        textAlign: "left", minWidth: 145,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot }} />
                          <span style={{ color: cfg.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", fontFamily: "'Space Grotesk', sans-serif" }}>{t.tier.toUpperCase()} · {t.score}</span>
                        </div>
                        <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{t.model}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{t.desc}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Suggestions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 520, margin: "0 auto" }}>
                  {SUGGESTIONS.map((s, i) => {
                    const cfg = TIER_CONFIG[s.tier];
                    return (
                      <button key={i} onClick={() => sendMessage(s.text)} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 18px", borderRadius: 10, cursor: "pointer",
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                        textAlign: "left", transition: "all 0.15s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                        <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{s.text}</span>
                        <span style={{ marginLeft: "auto", color: cfg.color, fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", fontFamily: "'Space Grotesk', sans-serif" }}>{s.tier.toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg, i) => (
              <div key={i} className="msg-anim" style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 20,
              }}>
                {msg.role === "assistant" && (
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: "linear-gradient(135deg, #6366F1, #22D3EE)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginRight: 10, marginTop: 2,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                  </div>
                )}
                <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #6366F1, #4F46E5)"
                      : "rgba(255,255,255,0.04)",
                    border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                    color: msg.role === "user" ? "#fff" : "rgba(255,255,255,0.88)",
                    fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {msg.content}
                    {msg.streaming && <span style={{ display: "inline-block", width: 2, height: 14, background: "#6366F1", marginLeft: 2, animation: "dotpulse 0.8s infinite" }} />}
                  </div>
                  {msg.meta && !msg.streaming && <RoutingPanel meta={msg.meta} />}
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.streaming === false && (
              <div className="msg-anim" style={{ display: "flex", marginBottom: 20 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #6366F1, #22D3EE)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px 16px 16px 4px" }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{
          padding: "16px 24px 20px",
          borderTop: "1px solid rgba(99,102,241,0.12)",
          background: "rgba(5,8,16,0.95)", backdropFilter: "blur(12px)",
        }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{
              display: "flex", alignItems: "flex-end", gap: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: 14, padding: "12px 14px",
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask anything — I'll route it to the right model..."
                rows={1}
                style={{
                  flex: 1, background: "transparent", border: "none",
                  color: "#fff", fontSize: 14, fontFamily: "'Inter', sans-serif",
                  lineHeight: 1.6, maxHeight: 120, overflowY: "auto",
                }}
                onInput={e => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 120) + "px";
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                style={{
                  width: 36, height: 36, borderRadius: 9, border: "none",
                  background: loading || !input.trim() ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg, #6366F1, #4F46E5)",
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all 0.15s",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 10, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.02em" }}>
              AgentRouter · Black-Box Protocol 2026 · Autonomous AI & Agent Orchestration
            </p>
          </div>
        </div>
      </div>
    </>
  );
}