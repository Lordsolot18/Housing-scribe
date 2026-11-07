// Netlify Function: turns an interview transcript (or typed notes) into a
// structured draft assessment using Claude. The API key stays on the server.

const MAX_CHARS = 60000;

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "ANTHROPIC_API_KEY is not set in Netlify." }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }

  const { mode, text, sections } = body || {};
  if (!text || !Array.isArray(sections)) return json({ error: "Missing transcript or template." }, 400);
  if (text.length > MAX_CHARS) return json({ error: "The transcript is too long for the prototype." }, 413);

  const sectionList = sections.map(s => `- id "${s.id}": ${s.title} (${s.hint})`).join("\n");
  const source = mode === "notes" ? "a caseworker's brief typed notes" : "a transcript of an intake interview";

  const system = `You draft housing and homelessness intake assessments for caseworkers in Edmonton, Alberta, Canada.
You will be given ${source}. Fill in the assessment template using ONLY information stated in it.

Strict rules:
- Never invent, guess or infer facts. If something was not discussed, say "Not discussed." and set "missing": true.
- If a section was only partly covered, write what was said and set "missing": false.
- Write in clear, neutral, professional third person ("The client reports...").
- Health and safety: record only what the client chose to share. No diagnoses or judgements.
- Do not make eligibility decisions or recommendations beyond the next steps the caseworker stated.
- Keep each section brief: 1 to 4 sentences.
- "followups": a short list of specific questions or gaps the caseworker should follow up on.

Respond with JSON only, no other text, in exactly this shape:
{"sections":[{"id":"...","content":"...","missing":false}],"followups":["..."]}

Template sections:
${sectionList}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-haiku-5-5",
        max_tokens: 2500,
        system,
        messages: [{ role: "user", content: `Here is the ${mode === "notes" ? "notes" : "transcript"}:\n\n${text}` }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return json({ error: data?.error?.message || "Claude API error." }, 502);
    }

    const raw = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    const clean = raw.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{"), end = clean.lastIndexOf("}");
    const parsed = JSON.parse(clean.slice(start, end + 1));

    return json({
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      followups: Array.isArray(parsed.followups) ? parsed.followups : [],
    });
  } catch (err) {
    return json({ error: "Couldn't read the draft from the AI. Try again." }, 502);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
