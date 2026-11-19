/** Shared client helper for the contact endpoint (used by the form widget and the letter object). */
export async function sendContactMessage(input: { name: string; email: string; subject?: string; message: string; website?: string; renderedAt: number }) {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: input.name, email: input.email, subject: input.subject ?? "", message: input.message, website: input.website ?? "", t: input.renderedAt }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
}
