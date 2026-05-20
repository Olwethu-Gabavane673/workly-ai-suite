import { useEffect, useRef, useState } from "react";
import { callAI, type AiMessage } from "@/lib/ai-client";
import { ErrorBanner, ResponsibleFooter, ToolHeader } from "./shared";
import { Send, Bot, User, Loader2 } from "lucide-react";

export function ChatTool() {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm your Workly assistant. Ask me to draft a message, plan your day, summarize something, or just think out loud with you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: AiMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setErr(null);
    try {
      const reply = await callAI({
        system:
          "You are Workly, a concise, friendly AI workplace assistant by CAPACITI. Format with markdown when helpful. Keep replies practical.",
        messages: next,
      });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <ToolHeader title="AI Chat" subtitle="Multi-turn workplace assistant — ask anything." />
      <ErrorBanner message={err} />

      <div className="card-surface flex-1 overflow-y-auto rounded-2xl p-5">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff7a59] to-[#ff4d8d] text-white">
                  <Bot className="size-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#ff7a59] text-white"
                    : "bg-[#0d1117] border border-white/10 text-foreground/95"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <User className="size-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff7a59] to-[#ff4d8d] text-white">
                <Bot className="size-4" />
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0d1117] px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="inline size-4 animate-spin" /> Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="mt-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-white/10 bg-[#0d1117] p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Message Workly…"
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="btn-coral inline-flex size-10 items-center justify-center rounded-xl disabled:opacity-60"
            aria-label="Send"
          >
            <Send className="size-4" />
          </button>
        </div>
        <div className="mx-auto max-w-3xl">
          <ResponsibleFooter />
        </div>
      </div>
    </div>
  );
}
