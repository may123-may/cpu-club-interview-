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

const roleKeywords: Record<string, string[]> = {
  President: ["leader", "vision", "team", "motivat", "responsibility", "manage"],
  "Project Manager": ["project", "plan", "task", "deadline", "scope", "milestone"],
  "Logistics Manager": ["logistic", "event", "supply", "transport", "setup", "venue"],
  "Media Manager": ["content", "social", "media", "design", "post", "reach"],
  "HR Manager": ["recruit", "onboard", "culture", "member", "team", "conflict"],
  "Technical Manager": ["tech", "code", "workshop", "develop", "skill", "repository"],
  "Sponsorship Manager": ["sponsor", "partner", "fund", "pitch", "company", "proposal"],
  "Finance Manager": ["budget", "finance", "expense", "income", "report", "fund"],
  "Organization Manager": ["organize", "document", "process", "structure", "coordinate"],
};

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

    // Simple role-topic validation: warn if reply lacks role keywords
    const keywords = roleKeywords[c.role] ?? [];
    const hasKeyword = keywords.some(kw => reply.toLowerCase().includes(kw));
    if (!hasKeyword && !complete && reply.length > 20) {
      console.warn(`[ARIA] Reply for ${c.role} (${c.name}) missing role keywords — may be off-topic`);
    }

    return { reply, complete };
  });


// ---------- 4) AI Detection — analyze if text is AI-generated ----------
export const detectAI = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ text: z.string().min(1).max(4000) }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.GROQ_API_KEY ?? "MISSING_KEY";
    if (apiKey === "MISSING_KEY" || apiKey.length < 10) {
      return { percent: null };
    }
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an AI text detector. Analyze the text and estimate probability (0-100) it was written by an AI.

Consider:
- Burstiness: humans vary sentence lengths; AI is uniform
- Perplexity: humans use unexpected word choices; AI is predictable
- Specificity: humans give real personal details; AI is generic
- Structure: humans are organic; AI overuses perfect paragraphs and transitions

Return ONLY a single integer 0-100. No other text.`,
          },
          { role: "user", content: data.text },
        ],
        temperature: 0.1,
        max_tokens: 10,
      }),
    });
    if (!res.ok) return { percent: null };
    const json = await res.json() as { choices?: Array<{ message: { content: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const num = parseInt(raw, 10);
    return { percent: isNaN(num) ? null : Math.max(0, Math.min(100, num)) };
  });

// ---------- 5) Save completed interview ----------
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
