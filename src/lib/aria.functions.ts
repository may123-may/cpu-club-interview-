import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LanguageSchema = z.enum(["fr", "en", "zh"]);
type Lang = z.infer<typeof LanguageSchema>;

// ---------- 1) Identify candidate from free text ----------
export const identifyCandidate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ text: z.string().min(1).max(2000) }).parse(d))
  .handler(async ({ data }) => {
    const { findCandidateByText } = await import("./candidates.server");
    const c = findCandidateByText(data.text);
    if (!c) return { found: false as const };
    return { found: true as const, id: c.id, name: c.name, role: c.role };
  });

// ---------- 2) Verify password ----------
export const verifyPassword = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ candidateId: z.string(), password: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getCandidateById } = await import("./candidates.server");
    const c = getCandidateById(data.candidateId);
    if (!c) return { ok: false as const };
    return { ok: c.password === data.password };
  });

// ---------- 3) Send an interview turn — calls Grok with that candidate's key ----------
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

export const sendInterviewTurn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        candidateId: z.string(),
        language: LanguageSchema,
        history: z.array(MessageSchema).max(50),
        message: z.string().nullable(), // null = ask first question
        apiKey: z.string().optional(), // runtime key supplied by the user in the UI
        questionNumber: z.number().optional(), // which question is being answered (1-10)
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { getCandidateById, buildSystemPrompt } = await import("./candidates.server");
    const c = getCandidateById(data.candidateId);
    if (!c) throw new Error("Unknown candidate");

    // Use the candidate's shared key (loaded from GROQ_API_KEY in .env)
    const resolvedKey = (data.apiKey && data.apiKey.trim()) ? data.apiKey.trim() : c.apiKey;

    const isKeyInvalid = !resolvedKey ||
      resolvedKey === "MISSING_KEY" ||
      resolvedKey.startsWith("REPLACE_WITH_") ||
      resolvedKey.length < 10;

    if (isKeyInvalid) {
      console.error("ARIA ERROR: Missing or invalid Groq API key.");
      return {
        reply: "[⚠ ARIA est hors ligne — clé API Groq manquante. Ajoutez GROQ_API_KEY dans le fichier .env et redémarrez le serveur.]",
        complete: false,
      };
    }

    const systemPrompt = buildSystemPrompt(c, data.language as Lang, data.questionNumber);


    // Build messages in OpenAI format (Groq is OpenAI-compatible)
    // System prompt goes first as a dedicated 'system' message — no role restrictions after that.
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Append conversation history
    for (const m of data.history) {
      messages.push({ role: m.role === "assistant" ? "assistant" : "user", content: m.content });
    }

    // Append the new user message (null = first turn, trigger ARIA's opening)
    if (data.message !== null) {
      messages.push({ role: "user", content: data.message });
    } else {
      // First call: nudge ARIA to deliver its opening statement
      messages.push({ role: "user", content: "Begin the interview now." });
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resolvedKey}`,
      },
      body: JSON.stringify({
        model: c.model, // "llama-3.3-70b-versatile"
        messages,
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Groq API error", res.status, text);
      throw new Error(`Groq API ${res.status}: ${text}`);
    }

    const json = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const complete = raw.includes("[INTERVIEW_COMPLETE]");
    const reply = raw.replace(/\[INTERVIEW_COMPLETE\]/g, "").trim();
    return { reply, complete };
  });


// ---------- 4) Save completed interview ----------
export const saveInterview = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        candidateId: z.string(),
        language: LanguageSchema,
        conversation: z.array(MessageSchema),
        rankReached: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { getCandidateById } = await import("./candidates.server");
    const c = getCandidateById(data.candidateId);
    if (!c) throw new Error("Unknown candidate");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("interviews").insert({
      candidate_id: c.id,
      candidate_name: c.name,
      candidate_role: c.role,
      language: data.language,
      conversation: data.conversation,
      rank_reached: data.rankReached,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
