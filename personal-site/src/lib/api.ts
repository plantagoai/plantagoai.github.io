const API_BASE = "/api";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function sendChat(messages: ChatMessage[]): Promise<string> {
  const r = await fetch(`${API_BASE}/personalChat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!r.ok) throw new Error(`Chat failed (${r.status})`);
  const data = (await r.json()) as { reply: string };
  return data.reply;
}

export async function sendContact(payload: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const r = await fetch(`${API_BASE}/personalContact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Send failed (${r.status})`);
}
