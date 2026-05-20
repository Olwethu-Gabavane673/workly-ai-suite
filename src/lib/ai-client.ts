export type AiMessage = { role: "user" | "assistant" | "system"; content: string };

export async function callAI(opts: { system?: string; messages: AiMessage[] }): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (res.status === 429) throw new Error("Rate limit reached. Please wait a moment and try again.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `AI request failed (${res.status})`);
  }
  const data = (await res.json()) as { content: string };
  return data.content;
}
