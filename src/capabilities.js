// Structured knowledge base for the Custom Skills LLC concierge.
// Each section is independently citable via its `id`.
// Edit this file to update what the chatbot knows.

export const CAPABILITIES = [
  {
    id: "overview",
    title: "Overview",
    body: `Custom Skills LLC provides end-to-end AI engineering and strategic
integration. We transform raw data into autonomous business assets. Our
focus is on building "reasoning engines" — systems that don't just process
text, but execute complex workflows, manage internal knowledge, and engage
customers with expert-level precision.

We don't sell off-the-shelf software. We build custom, deeply integrated
AI solutions that act as an operating system for our clients' business
operations. Engagements are small, senior, and outcome-driven.

We work with founders, operators, and enterprise teams who need real
systems, not pilots that die in the demo.`,
  },

  {
    id: "services-summary",
    title: "Services Summary",
    body: `Custom Skills LLC offers five interconnected practices:

1. Knowledge Orchestration & RAG — grounding AI in your private data with
   retrieval-augmented generation and vector databases.
2. Connectivity & Infrastructure (MCP) — building secure bridges that let
   AI models access internal tools, databases, and file systems via the
   Model Context Protocol.
3. Agentic Operations & Marketing — autonomous agents that execute
   multi-step tasks across platforms, not just generate text.
4. Internal Business Solutions — automating operational friction like
   project tracking, compliance audits, and cross-department coordination.
5. Application & Web Development — production-grade web apps, mobile
   experiences, marketing sites, and internal tools, engineered to host
   the reasoning engines we build or stand on their own.`,
  },

  {
    id: "knowledge-rag",
    title: "Knowledge Orchestration & RAG",
    body: `RAG stands for Retrieval-Augmented Generation. Think of it like
giving the AI an open-book exam.

The problem we solve: standard AI models hallucinate. They make up facts,
invent policies that don't exist, and can't be trusted with specialized
business data. This makes standard chatbots a liability for any
specialized business use case.

Our approach: instead of forcing the AI to memorize a company's entire
history, we build a system that acts like a lightning-fast research
librarian. When a user asks a question, the system instantly scans the
client's private libraries (PDFs, wikis, websites, documents), extracts
the exact relevant paragraphs, and hands them to the AI. The AI then
writes a perfectly accurate response based only on the facts it was just
handed.

What we build:
- Advanced RAG with high-accuracy document retrieval
- Vector database integration (Pinecone, Milvus, Weaviate)
- Website-specific concierges: intelligent, context-aware chatbots
  trained on the client's site architecture, documentation, and product
  catalogs
- Footnoted responses with source citations linking directly back to the
  original documents, for 100% verifiability

How this is different from a custom GPT: custom GPTs still guess and have
strict data limits. RAG doesn't guess. It actively acts like a search
engine for the client's private files, reads the exact text in real
time, and summarizes it perfectly. When the client's data changes, the
AI instantly knows — no retraining required.

Can it handle messy data: yes. The system ingests unstructured text,
breaks it down, and indexes it so the AI can navigate thousands of pages
of messy documentation in milliseconds.

Public examples of authoritative RAG products: Consensus (for medical
research), FinChat (for financial data). We build that level of
infrastructure for client businesses.`,
  },

  {
    id: "mcp",
    title: "Connectivity & Infrastructure (MCP)",
    body: `MCP stands for Model Context Protocol. Think of it as a secure,
universal plug or data bridge between AI models and a business's
internal systems.

The problem we solve: advanced AI models (like Claude or ChatGPT) are
brilliant consultants sitting in an isolated room. They're incredibly
smart, but they're blind to a client's actual business. They cannot see
the CRM, check inventory, or look at private databases. To use AI today,
employees have to constantly copy and paste data back and forth — slow,
inefficient, and a security risk.

Our approach: we build custom digital pipes that plug the AI directly
into the client's internal software, servers, and local file systems.
Instead of just talking to a generic chatbot, the AI becomes a secure
teammate. It can safely "read" from the company's internal tools to pull
a live client file, scan an internal database, or verify private records
instantly — without the data ever leaving the company's control.

What we build:
- Custom MCP servers: secure bridges between LLMs and internal APIs,
  databases, and local file systems
- AI-native architecture optimized for reasoning engines and high-token
  context windows
- Enterprise-grade connections that let AI safely access private files
  and query databases in real time

On security: we don't use client data to train public AI models. We
build a secure, private bridge so the AI can look at the data inside the
client's own walls, answer the question, and leave. Data stays entirely
with the client.

Systems we can connect to: standard cloud databases, custom internal
APIs, older local file systems — we build the custom connectors to
bridge them all together.`,
  },

  {
    id: "agentic",
    title: "Agentic Operations & Marketing",
    body: `An "agent" is an AI that has been given a goal, a set of tools, and
the autonomy to execute multi-step tasks without a human holding its
hand. A traditional chatbot is like a calculator: it only works when you
press the buttons. An AI agent is like a hired digital employee. You
give it an objective and the agent maps out its own steps, uses the
software needed, reviews its own work, and completes the project
end-to-end.

The problem we solve: most business automation today is passive. A user
types a prompt, AI generates text, then a human has to copy that text,
paste it into an email, schedule a campaign, or build a landing page
manually. The AI can think, but it cannot do. This leaves employees
stuck doing the heavy lifting of execution.

Our approach: we deploy AI agents that take action, not just generate
text. The client gives the system a business objective, and it deploys
specialized agents to execute the workflow end-to-end.

What we build:
- Agentic Marketing: autonomous systems for lead generation, content
  distribution, and personalized customer journey mapping
- Automated Content Generation: AI-driven landing page creation and
  dynamic web content that scales with the client's SEO strategy
- Autonomous research, qualification, and outreach workflows
- Lead-generation funnel management without constant human intervention

Human-in-the-Loop guardrails: clients control exactly how much autonomy
the agent has. The agent can do 95% of the heavy lifting (gathering
data, building pages, drafting campaigns) and then pause to send a
notification to a manager for final approval before anything goes live.

Example of an operational agentic workflow: a system that automatically
monitors technical updates or industry advisories. The moment a critical
change drops, the agent autonomously flags how it impacts the business,
alerts the right team member, drafts a response plan, and updates the
relevant internal tracking project — turning days of manual oversight
into an instant, automated reaction.`,
  },

  {
    id: "internal",
    title: "Internal Business Solutions",
    body: `Most mid-to-large businesses are bogged down by "operational friction"
— the invisible hours employees waste every day on repetitive,
administrative tasks. Hunting down project updates across departments,
manually auditing compliance and security advisories, sorting quarterly
tax logistics, coordinating overlapping timelines. This overhead drains
profitability and pulls top technical talent away from revenue work.

Our approach: we build custom, deeply integrated AI solutions that act
as an invisible, hyper-efficient Chief of Staff for the client's
operations. We don't sell off-the-shelf software. We look at the
specific bottlenecks in the client's workflow — project management,
quality assurance, compliance tracking, internal logistics — and build
intelligent, automated pipelines that handle the heavy lifting.

What we build:
- Autonomous Workflows: agents that monitor security advisories, manage
  payroll tax logistics, or coordinate complex technical project
  timelines
- Custom Tooling: internal AI tools that interface with existing
  software stacks (Slack, GitHub, CRMs, project boards like Jira and
  ClickUp)
- Continuous compliance and security audits — running 24/7 rather than
  once a quarter
- Project tracking that updates itself because the AI is reading code
  repositories or developer logs
- Anomaly flagging for human review before official submission

Do clients have to replace existing software: no. Our philosophy is the
opposite. We don't ask clients to learn a new platform. We build the AI
solutions to live inside the tools their team already uses every day,
making the existing stack significantly smarter.

Can this handle sensitive operations: yes. Because we build these as
private, secure architectures, the AI can securely ingest complex
internal regulations, quarterly logistical data, or security feeds. It
acts as an automated first line of defense — auditing data, organizing
records, and flagging anomalies for human review before any official
submission.`,
  },

  {
    id: "app-web-development",
    title: "Application & Web Development",
    body: `We ship the products around the intelligence. Production-grade web
applications, mobile experiences, marketing sites, and internal tools,
engineered to host the reasoning engines we build or to stand on their
own.

We're stack-agnostic: we work in whatever language and framework
fits the client's existing systems and the problem at hand. In
practice, that's most often TypeScript and React/Next.js on the
front end, and Python, Node, or Go on the back end. Most of our
AI work is in Python because the AI ecosystem lives there, but we
ship production systems in many languages.

What we build:
- Full-stack applications and APIs across modern stacks (TypeScript,
  Python, Go, React, Next.js, and others as the project requires)
- AI-heavy backends, agents, and data pipelines, typically in Python
- Mobile and cross-platform builds
- Marketing sites, landing pages, and SEO-tuned funnels
- Internal dashboards, admin tooling, and client portals

This practice exists because clients who buy AI integrations almost
always need the surrounding application surface to use them: chat
UIs, admin panels, marketing pages, customer dashboards. Having both
disciplines in-house removes handoffs.`,
  },

  {
    id: "cadence-lab",
    title: "Cadence Lab (Featured Work)",
    body: `Cadence Lab is an open-source semantic AI video editor built by
Custom Skills LLC. It's the studio's featured public work and a
concrete demonstration of every service practice in one product. It
is free and open source. It is NOT a service Custom Skills LLC sells,
but it shows what Custom Skills can build for clients.

What it does:
Cadence Lab edits long-form spoken-word video by listening to the
transcript instead of scrubbing the waveform. It transcribes audio
with Whisper, sends the transcript to Claude for context-aware
classification of every pause (filler, hesitation, breath, emphasis,
pre-laughter, transition, listening), then proposes cuts with a
human-in-the-loop review UI. An agentic "Ask Cadence" layer lets
users refine edits in natural language.

Why it exists:
The studio built Cadence Lab to validate one thesis: LLMs make
better editing decisions than waveform thresholds because they
understand context. The product is open source so clients can audit
the engineering quality before hiring Custom Skills LLC.

What it demonstrates that Custom Skills sells:
- Grounded LLM classification (the same RAG pattern, applied to
  transcripts instead of documents)
- A multi-stage agentic pipeline (transcribe → classify → splice →
  render → review)
- Claude tool-use, MCP-style, for the conversational refinement layer
- Hardware-aware engineering (Apple Silicon video encoding at 5–15x
  CPU)
- A production-grade application stack: Python + FastAPI on the
  backend, React 19 + TypeScript + Tauri 2 for the native desktop
  shell, plus the cadencelab.dev marketing site

Where to find it:
- Marketing site: https://cadencelab.dev
- Source code: https://github.com/JosephLeon/Cadence-Lab

Cost note for users: Cadence Lab uses your own Anthropic and Groq
API keys, so per-video cost is in the $0.60-$2.00 range for a
30-minute video.`,
  },

  {
    id: "engagement",
    title: "Engagement Model",
    body: `Engagements come in three shapes:
- Discovery sprint — mapping data silos, internal tools, and the
  workflows that bleed the most hours, producing a concrete system
  design.
- Project engagement — building specific systems (a RAG concierge, an
  MCP connector, an agentic workflow, an internal tool).
- Fractional or retainer — ongoing AI engineering capacity for teams
  that don't need a full hire.

The studio's three-step delivery pattern:
1. Discovery & Architecture — map data silos and workflows, produce a
   concrete system design.
2. Build & Ground — engineer the retrieval layer, MCP connectors, and
   reasoning agents, all grounded in the client's data with verifiable
   citations.
3. Deploy & Operate — integrate inside the existing stack with
   human-in-the-loop controls, observability, and continuous evaluation.

To start a conversation, prospects can use the contact form on this
site, which routes to contact@customskillsllc.com. Discovery calls are
30 minutes, no obligation, with a response within one business day.`,
  },
];

// Render the full source corpus into a single string for the system prompt.
// Each section is marked with its ID so the model can cite it.
export function formatCapabilitiesForPrompt() {
  return CAPABILITIES.map(
    (s) => `[section id="${s.id}" title="${s.title}"]\n${s.body.trim()}\n[/section]`
  ).join("\n\n");
}

// Look up a section by id (for client-side citation rendering).
export function sectionTitle(id) {
  const s = CAPABILITIES.find((s) => s.id === id);
  return s ? s.title : null;
}
