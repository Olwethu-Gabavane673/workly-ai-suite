import { useState } from "react";
import { callAI } from "@/lib/ai-client";
import { ErrorBanner, ResponsibleFooter, ToolHeader, CopyButton } from "./shared";
import { FileText, Loader2 } from "lucide-react";

type Summary = {
  executiveSummary: string;
  actionItems: string[];
  decisions: string[];
  deadlines: string[];
};

const TABS: { id: keyof Summary; label: string }[] = [
  { id: "executiveSummary", label: "Executive Summary" },
  { id: "actionItems", label: "Action Items" },
  { id: "decisions", label: "Decisions Made" },
  { id: "deadlines", label: "Deadlines" },
];

export function NotesSummarizerTool() {
  const [input, setInput] = useState(
    "Discussed Q3 roadmap. Sarah will own the API rewrite by Aug 15. Decided to defer mobile redesign to Q4. Budget approved for two new hires. Marketing to publish case study next Friday.",
  );
  const [summary, setSummary] = useState<Summary | null>(null);
  const [active, setActive] = useState<keyof Summary>("executiveSummary");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function summarize() {
    setLoading(true);
    setErr(null);
    try {
      const raw = await callAI({
        system:
          'You summarize meeting notes. Respond with ONLY valid JSON, no markdown fences. Schema: {"executiveSummary": string (2-4 sentences), "actionItems": string[] (each: "Owner — Task"), "decisions": string[], "deadlines": string[] (each: "Date — Item")}',
        messages: [{ role: "user", content: input }],
      });
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as Summary;
      setSummary(parsed);
      setActive("executiveSummary");
    } catch (e) {
      setErr((e as Error).message || "Could not parse summary");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <ToolHeader
        title="Meeting Notes Summarizer"
        subtitle="Paste raw notes or a transcript — get clear takeaways."
      />
      <ErrorBanner message={err} />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-surface rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground/90">
            <FileText className="size-4 text-[#ff7a59]" /> Meeting notes / transcript
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={14}
            className="w-full resize-y rounded-lg input-surface p-4 text-sm outline-none focus:border-[#ff7a59]/60 focus:ring-2 focus:ring-[#ff7a59]/20"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={summarize}
              disabled={loading || !input.trim()}
              className="btn-coral inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "Summarizing…" : "Summarize Notes"}
            </button>
          </div>
        </div>

        <div className="card-surface rounded-2xl p-5">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  active === t.id
                    ? "bg-[#ff7a59]/15 text-[#ff7a59] border border-[#ff7a59]/30"
                    : "border border-white/10 text-foreground/70 hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {!summary ? (
            <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
              Summary will appear here once generated.
            </div>
          ) : (
            <div className="rounded-lg input-surface p-4">
              {active === "executiveSummary" ? (
                <textarea
                  value={summary.executiveSummary}
                  onChange={(e) => setSummary({ ...summary, executiveSummary: e.target.value })}
                  rows={6}
                  className="w-full resize-y bg-transparent text-sm leading-relaxed outline-none"
                />
              ) : (
                <EditableList
                  items={summary[active] as string[]}
                  onChange={(items) => setSummary({ ...summary, [active]: items })}
                />
              )}
              <div className="mt-3 flex justify-end">
                <CopyButton
                  getText={() => {
                    if (active === "executiveSummary") return summary.executiveSummary;
                    return (summary[active] as string[]).map((s) => `• ${s}`).join("\n");
                  }}
                />
              </div>
              <ResponsibleFooter />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditableList({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <ul className="space-y-2">
      {items.length === 0 && <li className="text-sm text-muted-foreground">No items.</li>}
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-[#ff7a59]" />
          <input
            value={it}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            className="w-full bg-transparent text-sm outline-none"
          />
        </li>
      ))}
    </ul>
  );
}
