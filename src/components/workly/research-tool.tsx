import { useState } from "react";
import { callAI } from "@/lib/ai-client";
import { CopyButton, EditableOutput, ErrorBanner, ResponsibleFooter, ToolHeader } from "./shared";
import { Search, Loader2 } from "lucide-react";

type Research = {
  summary: string;
  insights: string[];
  recommendations: string[];
};

export function ResearchTool() {
  const [topic, setTopic] = useState("Trends in AI-powered workplace productivity tools 2025");
  const [data, setData] = useState<Research | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const raw = await callAI({
        system:
          'You are a research assistant. Respond with ONLY valid JSON, no fences. Schema: {"summary": string (3-5 sentences), "insights": string[] (5-7 concise insights), "recommendations": string[] (4-6 concrete actions)}',
        messages: [{ role: "user", content: `Topic: ${topic}` }],
      });
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as Research;
      setData(parsed);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <ToolHeader title="AI Research Assistant" subtitle="Get a structured briefing on any topic." />
      <ErrorBanner message={err} />

      <div className="card-surface mb-5 flex flex-col gap-3 rounded-2xl p-5 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg input-surface px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Search a topic…"
            className="w-full bg-transparent py-2.5 text-sm outline-none"
          />
        </div>
        <button
          onClick={run}
          disabled={loading || !topic.trim()}
          className="btn-coral inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? "Researching…" : "Research"}
        </button>
      </div>

      {!data ? (
        <div className="card-surface rounded-2xl p-10 text-center text-sm text-muted-foreground">
          Enter a topic and hit Research to see a structured briefing.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card-surface lg:col-span-2 rounded-2xl p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Summary</h3>
              <CopyButton getText={() => data.summary} />
            </div>
            <EditableOutput
              value={data.summary}
              onChange={(v) => setData({ ...data, summary: v })}
              minRows={6}
            />
            <ResponsibleFooter />
          </div>
          <div className="card-surface rounded-2xl p-5">
            <h3 className="mb-3 text-sm font-semibold">Key insights</h3>
            <ul className="space-y-2">
              {data.insights.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-[#ff7a59]" />
                  <input
                    value={s}
                    onChange={(e) => {
                      const next = [...data.insights];
                      next[i] = e.target.value;
                      setData({ ...data, insights: next });
                    }}
                    className="w-full bg-transparent outline-none"
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className="card-surface lg:col-span-3 rounded-2xl p-5">
            <h3 className="mb-3 text-sm font-semibold">Actionable recommendations</h3>
            <ol className="grid gap-2 sm:grid-cols-2">
              {data.recommendations.map((s, i) => (
                <li key={i} className="flex gap-3 rounded-lg input-surface px-3 py-2 text-sm">
                  <span className="font-mono text-xs text-[#ff7a59]">{String(i + 1).padStart(2, "0")}</span>
                  <input
                    value={s}
                    onChange={(e) => {
                      const next = [...data.recommendations];
                      next[i] = e.target.value;
                      setData({ ...data, recommendations: next });
                    }}
                    className="w-full bg-transparent outline-none"
                  />
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
