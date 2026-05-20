import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";

type Body = { system?: string; messages: { role: "user" | "assistant" | "system"; content: string }[] };

function getApiKey(): string | undefined {
  // process.env works on Cloudflare with nodejs_compat for env vars/secrets
  const fromProcess = typeof process !== "undefined" ? process.env?.LOVABLE_API_KEY : undefined;
  return fromProcess;
}

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!body?.messages?.length) {
          return new Response("messages required", { status: 400 });
        }
        const key = getApiKey();
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY on server", { status: 500 });
        }

        const messages = [
          ...(body.system ? [{ role: "system" as const, content: body.system }] : []),
          ...body.messages,
        ];

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages,
          }),
        });

        if (!upstream.ok) {
          const text = await upstream.text();
          return new Response(text || "Upstream error", { status: upstream.status });
        }
        const data = (await upstream.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = data.choices?.[0]?.message?.content ?? "";
        return Response.json({ content });
      },
    },
  },
});
