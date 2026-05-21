import { useState } from "react";
import { callAI } from "@/lib/ai-client";
import {
  CopyButton,
  EditableOutput,
  ErrorBanner,
  OutputCard,
  ResponsibleFooter,
  ToolHeader,
} from "./shared";
import { Mail, Send } from "lucide-react";

const TONES = ["Formal", "Friendly", "Persuasive", "Concise", "Apologetic"];

export function EmailGeneratorTool() {
  const [context, setContext] = useState(
    "- Follow up with client about proposal sent last week\n- Confirm meeting time on Thursday\n- Mention pricing flexibility",
  );
  const [tone, setTone] = useState("Friendly");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setErr(null);
    try {
      const content = await callAI({
        system:
          "You are a professional email writer. Write a clear, well-structured email using the requested tone. Output ONLY the email (Subject line, greeting, body, sign-off). No commentary.",
        messages: [
          {
            role: "user",
            content: `Tone: ${tone}\n\nContext / bullet points:\n${context}`,
          },
        ],
      });
      setOutput(content.trim());
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <ToolHeader
        title="Smart Email Generator"
        subtitle="Turn bullet points into a polished, on-brand email in seconds."
      />
      <ErrorBanner message={err} />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-surface rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground/90">
            <Mail className="size-4 text-[#ff7a59]" /> Email context
          </div>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={10}
            placeholder="Paste your notes or bullet points…"
            className="w-full resize-y rounded-lg input-surface p-4 text-sm outline-none focus:border-[#ff7a59]/60 focus:ring-2 focus:ring-[#ff7a59]/20"
          />

          <div className="mt-4 flex items-center gap-3">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="rounded-md input-surface px-3 py-2 text-sm outline-none focus:border-[#ff7a59]/60"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              onClick={generate}
              disabled={loading || !context.trim()}
              className="btn-coral ml-auto inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              <Send className="size-4" />
              {loading ? "Generating…" : "Generate Email"}
            </button>
          </div>
        </div>

        <OutputCard title="Generated email" loading={loading}>
          {output ? (
            <>
              <div className="mb-2 flex justify-end">
                <CopyButton getText={() => output} />
              </div>
              <EditableOutput value={output} onChange={setOutput} minRows={12} />
              <ResponsibleFooter />
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
              Your generated email will appear here. Click <span className="coral-link">Generate Email</span>.
            </div>
          )}
        </OutputCard>
      </div>
    </div>
  );
}
