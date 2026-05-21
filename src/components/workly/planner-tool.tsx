import { useState } from "react";
import { callAI } from "@/lib/ai-client";
import { ErrorBanner, ResponsibleFooter, ToolHeader } from "./shared";
import { ListChecks, Loader2 } from "lucide-react";

type Task = {
  title: string;
  quadrant: "urgent-important" | "not-urgent-important" | "urgent-not-important" | "not-urgent-not-important";
  day: string;
  notes?: string;
};

const QUADRANTS: { id: Task["quadrant"]; label: string; sub: string; tone: string }[] = [
  { id: "urgent-important", label: "Do now", sub: "Urgent · Important", tone: "from-[#ff7a59]/20 to-[#ff4d8d]/10 border-[#ff7a59]/30" },
  { id: "not-urgent-important", label: "Schedule", sub: "Important · Not urgent", tone: "from-blue-500/15 to-blue-500/5 border-blue-500/30" },
  { id: "urgent-not-important", label: "Delegate", sub: "Urgent · Not important", tone: "from-amber-500/15 to-amber-500/5 border-amber-500/30" },
  { id: "not-urgent-not-important", label: "Later", sub: "Not urgent · Not important", tone: "from-white/5 to-white/0 border-white/10" },
];

export function TaskPlannerTool() {
  const [input, setInput] = useState(
    "- Prepare client deck for Friday\n- Reply to investor emails\n- Gym session\n- Review pull request from Alex\n- Plan Q3 team offsite\n- Order new monitor",
  );
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function plan() {
    setLoading(true);
    setErr(null);
    try {
      const raw = await callAI({
        system:
          'You are a productivity planner. Take a raw task list and return ONLY JSON (no fences). Schema: {"tasks": [{"title": string, "quadrant": "urgent-important" | "not-urgent-important" | "urgent-not-important" | "not-urgent-not-important", "day": "Mon"|"Tue"|"Wed"|"Thu"|"Fri"|"Sat"|"Sun", "notes": string}]}. Use Eisenhower urgency+importance matrix.',
        messages: [{ role: "user", content: input }],
      });
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as { tasks: Task[] };
      setTasks(parsed.tasks);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <ToolHeader title="AI Task Planner & Scheduler" subtitle="Prioritize your week with an urgency × importance matrix." />
      <ErrorBanner message={err} />

      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        <div className="card-surface rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground/90">
            <ListChecks className="size-4 text-[#ff7a59]" /> Your tasks
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={12}
            className="w-full resize-y rounded-lg input-surface p-4 text-sm outline-none focus:border-[#ff7a59]/60 focus:ring-2 focus:ring-[#ff7a59]/20"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={plan}
              disabled={loading || !input.trim()}
              className="btn-coral inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "Planning…" : "Plan My Week"}
            </button>
          </div>
        </div>

        <div className="card-surface rounded-2xl p-5">
          {!tasks ? (
            <div className="rounded-lg border border-dashed border-white/10 p-10 text-center text-sm text-muted-foreground">
              Your prioritized schedule will appear here.
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {QUADRANTS.map((q) => (
                  <div
                    key={q.id}
                    className={`rounded-xl border bg-gradient-to-br ${q.tone} p-3`}
                  >
                    <div className="mb-2">
                      <div className="text-sm font-semibold text-foreground">{q.label}</div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{q.sub}</div>
                    </div>
                    <ul className="space-y-1.5">
                      {tasks.filter((t) => t.quadrant === q.id).map((t, i) => (
                        <li key={i} className="rounded-md bg-black/30 px-2.5 py-1.5 text-xs">
                          <div className="font-medium text-foreground/95">{t.title}</div>
                          <div className="mt-0.5 text-[10px] text-muted-foreground">
                            {t.day}{t.notes ? ` · ${t.notes}` : ""}
                          </div>
                        </li>
                      ))}
                      {tasks.filter((t) => t.quadrant === q.id).length === 0 && (
                        <li className="text-[11px] italic text-muted-foreground">Nothing here</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
              <ResponsibleFooter />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
