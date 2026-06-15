# AgentRouter 🚀
### Cost-Aware Multi-Agent Orchestration System

> Built for **Black-Box Protocol 2026** · Track: Autonomous AI & Agent Orchestration

AgentRouter eliminates the biggest problem in production AI systems — blindly routing every query to the most expensive model. It analyzes query complexity, decomposes tasks, and intelligently routes each subtask to the optimal LLM — reducing costs by **98%+** compared to GPT-4o while maintaining response quality.

---

## 🎯 The Problem

Most multi-agent systems route every query to the most powerful (and expensive) model regardless of complexity. A question like "What is 2+2?" costs the same as "Design a distributed system architecture." This is wasteful, slow, and unscalable.

---

## ✅ The Solution

AgentRouter introduces a **4-agent pipeline** with intelligent cost-aware routing:

```
User Query → Planner Agent → Complexity Scorer → Router → Executor → Synthesizer
```

- **Simple queries (1–4)** → Llama 3.1 8B · fastest & cheapest
- **Medium queries (5–7)** → Llama 3.3 70B · balanced
- **Complex queries (8–10)** → Llama 3.3 70B · deep reasoning

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js Frontend                  │
│         Chat UI · Dashboard · Cost Analytics        │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP
┌─────────────────────▼───────────────────────────────┐
│                  FastAPI Backend                     │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │ Planner  │→ │  Router  │→ │  Executor Agents   │ │
│  │  Agent   │  │  Agent   │  │ (model-specific)   │ │
│  └──────────┘  └──────────┘  └────────────────────┘ │
│                                        │             │
│  ┌──────────────┐          ┌───────────▼──────────┐  │
│  │ Redis Cache  │          │  Synthesizer Agent   │  │
│  │ (Upstash)    │          └──────────────────────┘  │
└──┴──────────────┴───────────────────────────────────┘
                      │
        ┌─────────────▼──────────┐
        │   Supabase PostgreSQL  │
        │  (metrics · history)   │
        └────────────────────────┘
```

---

## ⚡ Key Features

- **Intelligent Routing** — complexity scoring (1–10) routes queries to the optimal model
- **Cost Savings Calculator** — live comparison vs GPT-4o, shows % saved per query
- **Routing Explanation Panel** — every response shows why it was routed, subtasks breakdown, cost comparison
- **Semantic Caching** — Redis caches responses, repeat queries return instantly at $0
- **Streaming Responses** — word-by-word streaming for better UX
- **Real-time Dashboard** — latency trends, model distribution, cost analytics, all from Supabase
- **Multi-Agent Pipeline** — Planner → Router → Executor → Synthesizer
- **Production Ready** — deployed on Render (backend) + Vercel (frontend)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React, Tailwind CSS, Recharts |
| Backend | FastAPI, Python 3.12, Uvicorn |
| AI / LLM | LangChain, Groq API (Llama 3.1 8B, Llama 3.3 70B) |
| Caching | Redis (Upstash) |
| Database | Supabase (PostgreSQL) |
| Deployment | Render (backend), Vercel (frontend) |

---

## 📁 Project Structure

```
agentrouter/
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── agents/
│   │   ├── planner.py          # Task decomposition + complexity scoring
│   │   ├── router.py           # Model selection logic
│   │   ├── executor.py         # LLM execution per subtask
│   │   └── synthesizer.py      # Result aggregation
│   ├── core/
│   │   ├── config.py           # Environment + model config
│   │   ├── cache.py            # Redis semantic cache
│   │   ├── metrics.py          # Supabase logging + analytics
│   │   └── supabase_client.py  # Supabase connection
│   ├── api/
│   │   └── routes.py           # API endpoints
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── page.tsx            # Chat UI with streaming
    │   └── dashboard/
    │       └── page.tsx        # Cost & performance dashboard
    └── package.json
```

---

## 🚀 Running Locally

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Add your keys to .env (see .env.example)
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
```env
GROQ_API_KEY=your_groq_key
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
```

---

## 📊 Results

| Metric | Value |
|---|---|
| Cost reduction vs GPT-4o | **98.6%** |
| Simple query latency | ~300ms |
| Cache hit response time | <50ms |
| Supported model tiers | 3 |

---

## 🏆 Hackathon

**Event:** Black-Box Protocol: Stage 01 // System Escalation
**Track:** Autonomous AI & Agent Orchestration
**Challenge Theme:** Cost & Latency Optimization

---

## 📄 License

MIT License — built with ❤️ for Black-Box Protocol 2026

