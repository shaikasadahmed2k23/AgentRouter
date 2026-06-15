"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area } from "recharts";
import Link from "next/link";

interface MetricsSummary {
  total_requests: number;
  cache_hit_rate: number;
  avg_latency_ms: number;
  total_cost_usd: number;
  total_tokens: number;
  gpt4o_equivalent_cost: number;
  cost_savings_usd: number;
  cost_savings_pct: number;
  model_distribution: Record<string, number>;
  recent: Array<{
    created_at: string;
    query_preview: string;
    complexity: string;
    model_used: string;
    latency_ms: number;
    tokens_used: number;
    cache_hit: boolean;
    estimated_cost_usd: number;
    routing_reasoning: string;
  }>;
}

const MODEL_SHORT: Record<string, string> = {
  "llama-3.1-8b-instant":          "Llama 3.1 8B",
  "llama-3.3-70b-versatile":       "Llama 3.3 70B",
  "deepseek-r1-distill-llama-70b": "DeepSeek R1",
};
const TIER_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  simple:  { color: "#10B981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.3)" },
  medium:  { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)" },
  complex: { color: "#EF4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)" },
};
const MODEL_COLORS = ["#6366F1", "#22D3EE", "#FBBF24"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) return (
    <div style={{ background: "#0D1117", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 4 }}>{label}</p>
      <p style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{payload[0].value}</p>
    </div>
  );
  return null;
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [animatedSavings, setAnimatedSavings] = useState(0);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("https://agentrouter-backend.onrender.com/api/metrics");
      const data = await res.json();
      setMetrics(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchMetrics(); const iv = setInterval(fetchMetrics, 5000); return () => clearInterval(iv); }, []);

  // Animate savings counter
  useEffect(() => {
    if (!metrics?.cost_savings_usd) return;
    const target = metrics.cost_savings_usd;
    const duration = 1200;
    const steps = 60;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setAnimatedSavings(target * (step / steps));
      if (step >= steps) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [metrics?.cost_savings_usd]);

  const modelData = metrics?.model_distribution
    ? Object.entries(metrics.model_distribution).map(([name, count], i) => ({
        name: MODEL_SHORT[name] || name,
        count, color: MODEL_COLORS[i % MODEL_COLORS.length],
      }))
    : [];

  const latencyData = metrics?.recent
    ? [...metrics.recent].reverse().map((r, i) => ({
        i: i + 1, latency: Math.round(r.latency_ms), tier: r.complexity,
      }))
    : [];

  const costCompareData = [
    { name: "GPT-4o", cost: metrics?.gpt4o_equivalent_cost || 0, fill: "#EF4444" },
    { name: "AgentRouter", cost: metrics?.total_cost_usd || 0, fill: "#10B981" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 4px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.3s ease forwards; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#050810", fontFamily: "'Inter', sans-serif", color: "#fff" }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px", height: 60,
          borderBottom: "1px solid rgba(99,102,241,0.15)",
          position: "sticky", top: 0, background: "rgba(5,8,16,0.97)", backdropFilter: "blur(12px)", zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/" style={{
              display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(255,255,255,0.5)", fontSize: 12, textDecoration: "none", fontFamily: "'Space Grotesk', sans-serif",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </Link>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}>System Dashboard</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Cost savings · Routing analytics · Performance</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'Space Grotesk', sans-serif" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block", boxShadow: "0 0 6px #10B981" }} />
            Live · {lastUpdated || "—"}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 32px" }}>
          {loading ? (
            <div style={{ textAlign: "center", paddingTop: 120, color: "rgba(255,255,255,0.3)", fontFamily: "'Space Grotesk', sans-serif" }}>Loading...</div>
          ) : !metrics || metrics.total_requests === 0 ? (
            <div style={{ textAlign: "center", paddingTop: 120 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, color: "#fff", marginBottom: 8 }}>No data yet</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24 }}>Send some queries in the chat first</div>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", color: "#818CF8", textDecoration: "none", fontSize: 13, fontFamily: "'Space Grotesk', sans-serif" }}>
                Go to Chat →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="fade-up">

              {/* 💰 Cost Savings Hero Banner */}
              <div style={{
                padding: "28px 32px", borderRadius: 16,
                background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(99,102,241,0.08))",
                border: "1px solid rgba(16,185,129,0.25)",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20,
              }}>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", marginBottom: 8 }}>TOTAL SAVINGS vs GPT-4o</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 48, fontWeight: 700, color: "#10B981", letterSpacing: "-0.03em" }}>
                      ${animatedSavings.toFixed(5)}
                    </span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, color: "#FBBF24", fontWeight: 700 }}>
                      {metrics.cost_savings_pct}% cheaper
                    </span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 6 }}>
                    AgentRouter cost <strong style={{ color: "#10B981" }}>${metrics.total_cost_usd.toFixed(5)}</strong> vs GPT-4o's <strong style={{ color: "#F87171" }}>${metrics.gpt4o_equivalent_cost.toFixed(5)}</strong> for {metrics.total_tokens.toLocaleString()} tokens
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 200 }}>
                  {[
                    { label: "AgentRouter", val: `$${metrics.total_cost_usd.toFixed(5)}`, color: "#10B981" },
                    { label: "GPT-4o equiv.", val: `$${metrics.gpt4o_equivalent_cost.toFixed(5)}`, color: "#F87171" },
                    { label: "You saved", val: `$${metrics.cost_savings_usd.toFixed(5)}`, color: "#FBBF24" },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'Space Grotesk', sans-serif" }}>{r.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: r.color, fontFamily: "'Space Grotesk', sans-serif" }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                {[
                  { label: "TOTAL REQUESTS", value: metrics.total_requests, accent: "#6366F1" },
                  { label: "CACHE HIT RATE", value: `${metrics.cache_hit_rate}%`, accent: "#22D3EE" },
                  { label: "AVG LATENCY", value: `${Math.round(metrics.avg_latency_ms)}ms`, accent: "#FBBF24" },
                  { label: "TOTAL TOKENS", value: metrics.total_tokens.toLocaleString(), accent: "#10B981" },
                ].map(c => (
                  <div key={c.label} style={{
                    padding: "18px 20px", borderRadius: 12,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                    borderTop: `2px solid ${c.accent}`,
                  }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.07em", marginBottom: 8 }}>{c.label}</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{c.value}</div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Cost comparison bar */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px" }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em", marginBottom: 20 }}>COST COMPARISON vs GPT-4o</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={costCompareData} barSize={48}>
                      <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(4)}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="cost" radius={[6,6,0,0]}>
                        {costCompareData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Model distribution pie */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px" }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em", marginBottom: 20 }}>MODEL ROUTING DISTRIBUTION</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <ResponsiveContainer width="55%" height={180}>
                      <PieChart>
                        <Pie data={modelData} dataKey="count" cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3}>
                          {modelData.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                      {modelData.map((d, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{d.name}</div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: d.color, fontFamily: "'Space Grotesk', sans-serif" }}>
                            {Math.round((d.count / metrics.total_requests) * 100)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Latency trend */}
              {latencyData.length > 1 && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px" }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em", marginBottom: 20 }}>LATENCY TREND — last {latencyData.length} requests (ms)</div>
                  <ResponsiveContainer width="100%" height={130}>
                    <AreaChart data={latencyData}>
                      <defs>
                        <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="i" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="latency" stroke="#6366F1" strokeWidth={2} fill="url(#latGrad)" dot={{ fill: "#6366F1", r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent requests table */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.07em", marginBottom: 20 }}>RECENT REQUESTS</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                        {["Query", "Tier", "Model", "Routing Reason", "Latency", "Cost", "Cache"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "0 12px 12px 0", color: "rgba(255,255,255,0.3)", fontWeight: 500, fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: "0.05em" }}>{h.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.recent.map((r, i) => {
                        const tc = TIER_CONFIG[r.complexity] || TIER_CONFIG.medium;
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <td style={{ padding: "12px 12px 12px 0", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(255,255,255,0.75)" }}>{r.query_preview}</td>
                            <td style={{ padding: "12px 12px 12px 0" }}>
                              <span style={{ padding: "3px 10px", borderRadius: 20, background: tc.bg, border: `1px solid ${tc.border}`, color: tc.color, fontSize: 10, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.05em" }}>
                                {r.complexity?.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: "12px 12px 12px 0", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap", fontSize: 11 }}>{MODEL_SHORT[r.model_used] || r.model_used}</td>
                            <td style={{ padding: "12px 12px 12px 0", color: "rgba(255,255,255,0.35)", fontStyle: "italic", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11 }}>{r.routing_reasoning || "—"}</td>
                            <td style={{ padding: "12px 12px 12px 0", color: "rgba(255,255,255,0.45)", fontFamily: "'Space Grotesk', sans-serif" }}>{Math.round(r.latency_ms)}ms</td>
                            <td style={{ padding: "12px 12px 12px 0", color: "rgba(255,255,255,0.45)", fontFamily: "'Space Grotesk', sans-serif" }}>${r.estimated_cost_usd?.toFixed(6)}</td>
                            <td style={{ padding: "12px 0" }}>
                              {r.cache_hit ? <span style={{ color: "#10B981", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>⚡ Hit</span> : <span style={{ color: "rgba(255,255,255,0.2)" }}>Miss</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}