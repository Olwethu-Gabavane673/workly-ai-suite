import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Mail,
  FileText,
  ListChecks,
  Search,
  MessageSquare,
  Clock,
  Zap,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

import { EmailGeneratorTool } from "@/components/workly/email-tool";
import { NotesSummarizerTool } from "@/components/workly/notes-tool";
import { TaskPlannerTool } from "@/components/workly/planner-tool";
import { ResearchTool } from "@/components/workly/research-tool";
import { ChatTool } from "@/components/workly/chat-tool";

type ViewId = "dashboard" | "email" | "notes" | "planner" | "research" | "chat";

const NAV: { id: ViewId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "email", label: "Email Generator", icon: Mail },
  { id: "notes", label: "Notes Summarizer", icon: FileText },
  { id: "planner", label: "Task Planner", icon: ListChecks },
  { id: "research", label: "Research", icon: Search },
  { id: "chat", label: "AI Chat", icon: MessageSquare },
];

export const Route = createFileRoute("/")({
  component: WorklyApp,
  head: () => ({
    meta: [
      { title: "Workly AI by CAPACITI — Your AI workplace assistant" },
      {
        name: "description",
        content:
          "Workly AI by CAPACITI: automate emails, summarize meetings, plan your week, and research smarter — all in one beautiful workspace.",
      },
    ],
  }),
});

function WorklyApp() {
  const [view, setView] = useState<ViewId>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  function navigate(v: ViewId) {
    setView(v);
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top responsible-AI banner */}
      <div className="border-b border-white/5 bg-[#0d1117]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-[11px] text-muted-foreground">
          <AlertTriangle className="size-3.5 text-amber-400/80" />
          <span>AI-generated content may require human review</span>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/5 bg-[#0d1117] transition-transform lg:static lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ marginTop: 0 }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff7a59] to-[#ff4d8d]">
                  <Sparkles className="size-4 text-white" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">Workly AI</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">by CAPACITI</div>
                </div>
              </div>
              <button
                className="lg:hidden rounded-md p-1 text-muted-foreground hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4">
              <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Workspace
              </div>
              <ul className="space-y-1">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const active = view === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => navigate(item.id)}
                        className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                          active
                            ? "bg-white/[0.06] text-foreground border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                            : "text-foreground/70 hover:bg-white/[0.04] hover:text-foreground"
                        }`}
                      >
                        <Icon className={`size-4 ${active ? "text-[#ff7a59]" : ""}`} />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-white/5 px-5 py-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Powered by</div>
              <div className="mt-1 text-sm font-semibold text-foreground">CAPACITI</div>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Mobile header */}
          <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3 lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="text-sm font-semibold">Workly AI</div>
          </div>

          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
            {view === "dashboard" && <Dashboard onOpen={navigate} />}
            {view === "email" && <EmailGeneratorTool />}
            {view === "notes" && <NotesSummarizerTool />}
            {view === "planner" && <TaskPlannerTool />}
            {view === "research" && <ResearchTool />}
            {view === "chat" && <ChatTool />}
          </div>
        </main>
      </div>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: (v: ViewId) => void }) {
  return (
    <div>
      {/* Hero */}
      <section className="card-surface relative overflow-hidden rounded-3xl px-6 py-12 sm:px-10 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 size-[420px] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,77,141,0.22), rgba(255,77,141,0) 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-32 size-[420px] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(196,107,255,0.18), rgba(196,107,255,0) 70%)",
          }}
        />
        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-[#ff7a59]" /> Workly AI workspace
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Your <span className="gradient-text">AI workplace</span> assistant
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Automate emails, summarize meetings, plan your week, and research smarter — all from
            one beautifully simple workspace.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => onOpen("email")}
              className="btn-coral inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium"
            >
              Start with Email <ArrowRight className="size-4" />
            </button>
            <button
              onClick={() => onOpen("chat")}
              className="glass inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-foreground hover:bg-white/[0.08]"
            >
              Open AI Chat <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric icon={Clock} value="8.5h" label="Hours saved per week" />
        <Metric icon={Zap} value="12×" label="Faster response time" />
        <Metric icon={ShieldCheck} value="100%" label="Editable & private" />
      </section>

      {/* Productivity tools */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Productivity tools</h2>
            <p className="text-sm text-muted-foreground">Pick a tool to get started.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCard
            icon={Mail}
            title="Smart Email Generator"
            desc="Turn bullet points into a polished, on-brand email."
            onOpen={() => onOpen("email")}
          />
          <ToolCard
            icon={FileText}
            title="Meeting Notes Summarizer"
            desc="Action items, decisions and deadlines — pulled instantly."
            onOpen={() => onOpen("notes")}
          />
          <ToolCard
            icon={ListChecks}
            title="AI Task Planner"
            desc="Prioritize with an urgency × importance matrix."
            onOpen={() => onOpen("planner")}
          />
          <ToolCard
            icon={Search}
            title="Research Assistant"
            desc="Structured briefings on any topic in seconds."
            onOpen={() => onOpen("research")}
          />
          <ToolCard
            icon={MessageSquare}
            title="AI Chat"
            desc="Multi-turn workplace assistant — ask anything."
            onOpen={() => onOpen("chat")}
          />
          <div className="card-surface rounded-2xl p-5">
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              Coming soon
            </div>
            <div className="text-base font-medium text-foreground/90">More integrations</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Calendar, Slack, Notion and Docs sync — on the way.
            </p>
          </div>
        </div>
      </section>

      {/* Footer attribution */}
      <footer className="mt-12 flex items-center justify-between border-t border-white/5 pt-4 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} CAPACITI · Workly AI</span>
        <a
          href="https://lovable.dev"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 hover:bg-white/10"
        >
          <span className="size-1.5 rounded-full bg-[#ff7a59]" /> Edit with Lovable
        </a>
      </footer>
    </div>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="card-surface flex items-center gap-4 rounded-2xl p-5">
      <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff7a59]/20 to-[#ff4d8d]/10 text-[#ff7a59] border border-[#ff7a59]/20">
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function ToolCard({
  icon: Icon,
  title,
  desc,
  onOpen,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  onOpen: () => void;
}) {
  return (
    <div className="card-surface group rounded-2xl p-5 transition hover:border-white/15">
      <div className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-foreground/90 border border-white/10">
        <Icon className="size-5" />
      </div>
      <div className="mt-4 text-base font-medium">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <button
        onClick={onOpen}
        className="coral-link mt-4 inline-flex items-center gap-1 text-sm font-medium"
      >
        Open tool <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
}
