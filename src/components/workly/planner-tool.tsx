import { useEffect, useRef, useState } from "react";
import { callAI } from "@/lib/ai-client";
import { ErrorBanner, ResponsibleFooter, ToolHeader } from "./shared";
import { ListChecks, Loader2, Bell, BellOff, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

type Quadrant =
  | "urgent-important"
  | "not-urgent-important"
  | "urgent-not-important"
  | "not-urgent-not-important";

type Task = {
  title: string;
  quadrant: Quadrant;
  day: string;
  notes?: string;
  date?: string; // yyyy-mm-dd
  time?: string; // HH:mm
  alarm?: boolean;
  fired?: boolean;
};

const QUADRANTS: { id: Quadrant; label: string; sub: string; tone: string }[] = [
  { id: "urgent-important", label: "Do now", sub: "Urgent · Important", tone: "from-[#ff7a59]/20 to-[#ff4d8d]/10 border-[#ff7a59]/30" },
  { id: "not-urgent-important", label: "Schedule", sub: "Important · Not urgent", tone: "from-blue-500/15 to-blue-500/5 border-blue-500/30" },
  { id: "urgent-not-important", label: "Delegate", sub: "Urgent · Not important", tone: "from-amber-500/15 to-amber-500/5 border-amber-500/30" },
  { id: "not-urgent-not-important", label: "Later", sub: "Not urgent · Not important", tone: "from-white/5 to-white/0 border-white/10" },
];

const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function nextDateForDay(dayLabel: string): string {
  const target = DAY_MAP[dayLabel];
  const now = new Date();
  if (target == null) return now.toISOString().slice(0, 10);
  const d = new Date(now);
  const diff = (target - now.getDay() + 7) % 7;
  d.setDate(now.getDate() + (diff === 0 ? 0 : diff));
  return d.toISOString().slice(0, 10);
}

function beep() {
  try {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    osc.start();
    osc.stop(ctx.currentTime + 1.3);
  } catch {}
}

export function TaskPlannerTool() {
  const [input, setInput] = useState(
    "- Prepare client deck for Friday\n- Reply to investor emails\n- Gym session\n- Review pull request from Alex\n- Plan Q3 team offsite\n- Order new monitor",
  );
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);

  // Schedule alarms whenever tasks change
  useEffect(() => {
    // Clear previous timers
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    if (!tasks) return;

    tasks.forEach((t, idx) => {
      if (!t.alarm || !t.date || !t.time || t.fired) return;
      const target = new Date(`${t.date}T${t.time}:00`).getTime();
      const delay = target - Date.now();
      if (delay <= 0 || delay > 2_147_483_000) return; // skip past / >24.8d
      const id = window.setTimeout(() => {
        beep();
        toast.success(`⏰ Reminder: ${t.title}`, {
          description: `${t.date} at ${t.time}${t.notes ? ` · ${t.notes}` : ""}`,
          duration: 10000,
        });
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Workly AI · Task reminder", {
            body: `${t.title}\n${t.date} at ${t.time}`,
          });
        }
        setTasks((prev) => {
          if (!prev) return prev;
          const next = [...prev];
          if (next[idx]) next[idx] = { ...next[idx], fired: true };
          return next;
        });
      }, delay);
      timersRef.current.push(id);
    });

    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [tasks]);

  function updateTask(i: number, patch: Partial<Task>) {
    setTasks((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[i] = { ...next[i], ...patch, fired: false };
      return next;
    });
  }

  async function toggleAlarm(i: number, on: boolean) {
    if (on && typeof Notification !== "undefined" && Notification.permission === "default") {
      try { await Notification.requestPermission(); } catch {}
    }
    updateTask(i, { alarm: on });
  }

  async function plan() {
    setLoading(true);
    setErr(null);
    try {
      const raw = await callAI({
        system:
          'You are a productivity planner. Take a raw task list and return ONLY JSON (no fences). Schema: {"tasks": [{"title": string, "quadrant": "urgent-important" | "not-urgent-important" | "urgent-not-important" | "not-urgent-not-important", "day": "Mon"|"Tue"|"Wed"|"Thu"|"Fri"|"Sat"|"Sun", "time": "HH:mm" (24h, sensible work hour), "notes": string}]}. Use Eisenhower urgency+importance matrix.',
        messages: [{ role: "user", content: input }],
      });
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as { tasks: (Task & { time?: string })[] };
      const enriched: Task[] = parsed.tasks.map((t) => ({
        ...t,
        date: nextDateForDay(t.day),
        time: t.time || "09:00",
        alarm: false,
        fired: false,
      }));
      setTasks(enriched);
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
          <p className="mt-3 text-[11px] text-muted-foreground">
            Tip: pick a date & time per task, then toggle <Bell className="inline size-3" /> to get a beep + browser notification when it's due.
          </p>
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
                  <div key={q.id} className={`rounded-xl border bg-gradient-to-br ${q.tone} p-3`}>
                    <div className="mb-2">
                      <div className="text-sm font-semibold text-foreground">{q.label}</div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{q.sub}</div>
                    </div>
                    <ul className="space-y-2">
                      {tasks.map((t, i) => t.quadrant === q.id && (
                        <li key={i} className="rounded-md bg-black/30 px-2.5 py-2 text-xs">
                          <input
                            value={t.title}
                            onChange={(e) => updateTask(i, { title: e.target.value })}
                            className="w-full bg-transparent font-medium text-foreground/95 outline-none"
                          />
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <label className="inline-flex items-center gap-1 rounded border border-white/10 bg-black/30 px-1.5 py-0.5">
                              <Calendar className="size-3 text-muted-foreground" />
                              <input
                                type="date"
                                value={t.date || ""}
                                onChange={(e) => updateTask(i, { date: e.target.value })}
                                className="bg-transparent text-[10px] text-foreground/90 outline-none [color-scheme:dark]"
                              />
                            </label>
                            <label className="inline-flex items-center gap-1 rounded border border-white/10 bg-black/30 px-1.5 py-0.5">
                              <Clock className="size-3 text-muted-foreground" />
                              <input
                                type="time"
                                value={t.time || ""}
                                onChange={(e) => updateTask(i, { time: e.target.value })}
                                className="bg-transparent text-[10px] text-foreground/90 outline-none [color-scheme:dark]"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => toggleAlarm(i, !t.alarm)}
                              title={t.alarm ? "Alarm on" : "Alarm off"}
                              className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] transition ${
                                t.alarm
                                  ? "border-[#ff7a59]/50 bg-[#ff7a59]/15 text-[#ff7a59]"
                                  : "border-white/10 bg-black/30 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {t.alarm ? <Bell className="size-3" /> : <BellOff className="size-3" />}
                              {t.alarm ? "Alarm on" : "Alarm"}
                            </button>
                            {t.fired && (
                              <span className="text-[10px] text-emerald-400">✓ fired</span>
                            )}
                          </div>
                          {t.notes && (
                            <div className="mt-1 text-[10px] text-muted-foreground">{t.notes}</div>
                          )}
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
