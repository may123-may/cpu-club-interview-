// SERVER-ONLY: contains Grok API keys. Never import from client code.
// The *.server.ts suffix is blocked from client bundles by Vite.

export type Language = "fr" | "en" | "zh";

export const roleQuestions: Record<string, string> = {
  President: `
Focus ALL 10 questions on leadership and vision:
1. Why they want to lead the CPU Club and what is their long-term vision for it
2. How they would motivate and unify a diverse team of 13+ managers
3. A real experience where they led a group or project from start to finish
4. How they handle internal conflicts or disagreements between team members
5. Their strategy to grow the club's visibility and reputation on campus
6. How they would attract company sponsors or industry partnerships
7. Their plan for organizing major technical events or hackathons
8. How they balance heavy club responsibilities with academic workload
9. How they react and recover when a key project fails mid-semester
10. What one lasting S-Rank legacy they would leave for the CPU Club
`,
  "Project Manager": `
Focus ALL 10 questions on project management and planning skills:
1. A project they managed from start to finish — scope, team, and outcome
2. How they define a project's goals, milestones, and success criteria
3. Tools they use to plan and track tasks (Trello, Notion, Jira, GitHub Projects…)
4. How they handle scope creep when a project grows beyond its original plan
5. Their approach to splitting a big project into smaller deliverable tasks
6. How they communicate project status and blockers to team leads and stakeholders
7. A time a project got delayed — what went wrong and how they recovered
8. How they ensure quality before a project is considered done
9. Managing multiple simultaneous projects — how they stay organized
10. A club project they would propose and manage from day one
`,
  "Logistics Manager": `
Focus ALL 10 questions on logistics, operations, and event support:
1. A real situation where they managed the logistics of an event or activity
2. How they create a checklist and timeline for an event's physical setup
3. How they handle last-minute supply shortages or venue problems
4. Their approach to coordinating transportation, equipment, and space booking
5. How they communicate logistics needs to other team managers
6. Managing a limited budget for event materials and supplies
7. How they ensure everything is ready before an event starts
8. Dealing with a supplier or vendor who fails to deliver on time
9. Post-event logistics: packing up, returning equipment, writing summary reports
10. A logistics plan they would build for a large CPU Club hackathon
`,
  "Media Manager": `
Focus ALL 10 questions on media, content creation, and visual communication:
1. A content piece they created that they are most proud of — concept, execution, and results
2. Their design and video editing tools (Canva, Photoshop, Premiere, CapCut…)
3. How they would visually represent the CPU Club's brand across all platforms
4. Their process for creating a consistent aesthetic for the club's social media
5. How they brainstorm and produce content for a club event from scratch
6. How they collaborate with other managers to align messaging
7. Handling negative comments or a badly received post — crisis communication
8. How they use analytics to improve future content (reach, saves, shares)
9. Their photography or videography experience — equipment, style, and editing
10. One creative media campaign to make the CPU Club go viral on campus
`,
  "HR Manager": `
Focus ALL 10 questions on human resources, member management, and team culture:
1. Why they want to be responsible for managing people in a student club
2. How they would run the recruitment process for new CPU Club members
3. Their approach to onboarding new members and making them feel welcomed
4. How they track member engagement and detect disengagement early
5. How they handle a conflict between two club members professionally
6. Strategies to motivate volunteers who receive no financial compensation
7. How they would evaluate performance and give constructive feedback to managers
8. Creating a positive, inclusive team culture — what does that look like to them
9. How they maintain communication and cohesion across 13+ different managers
10. An HR initiative or program they would introduce to strengthen the club team
`,
  "Technical Manager": `
Focus ALL 10 questions on technical skills, development leadership, and club tech strategy:
1. Their strongest technical skill and a project that showcases it
2. Programming languages and frameworks they are most proficient in
3. How they would assess the technical skills of new club members
4. Their approach to planning and leading a technical workshop for club members
5. How they manage a technical team working on different parts of one project
6. Their strategy for keeping the club's tech stack modern and relevant
7. How they handle a situation where a developer is stuck or blocked on a task
8. Code review culture — why it matters and how they implement it in a team
9. How they document technical decisions and share knowledge within the team
10. A technical project they would build or lead for the CPU Club this year
`,
  "Sponsorship Manager": `
Focus ALL 10 questions on sponsorship, fundraising, and external partnerships:
1. Why they want to lead the club's sponsorship and fundraising efforts
2. Their experience with outreach, negotiation, or sales (even informally)
3. How they would identify companies that are good sponsorship targets
4. Their strategy for writing a compelling sponsorship proposal or pitch deck
5. How they would approach a company for the first time to request sponsorship
6. Handling rejection — a company says no, what do they do next
7. Managing a sponsorship relationship over time — delivering value back to sponsors
8. How they keep track of all sponsorship leads, negotiations, and agreements
9. How they coordinate with the finance manager for proper fund handling
10. One creative sponsorship deal they would secure for the CPU Club
`,
  "Finance Manager": `
Focus ALL 10 questions on financial management, budgeting, and accountability:
1. Why they want to be responsible for managing the club's finances
2. Experience with budgeting, accounting, or financial planning
3. How they would create and manage the annual budget of the CPU Club
4. How they track income and expenses across multiple events throughout the year
5. Their approach to cost optimization when the club has limited funds
6. How they ensure financial transparency and accountability to club leadership
7. Handling a situation where actual spending exceeds the allocated budget
8. How they coordinate with the sponsorship manager for incoming funds
9. Tools they use or would use for financial tracking
10. A financial report or budget plan they would build for next semester
`,
  "Organization Manager": `
Focus ALL 10 questions on organizational systems, planning, and administrative efficiency:
1. Why they want to be the person who keeps the entire club organized
2. Their experience with administrative work, documentation, or process management
3. How they would design the internal organizational structure of the CPU Club
4. Their system for keeping all club documents and meeting notes organized
5. How they schedule and coordinate meetings across 13+ managers
6. How they ensure decisions made in meetings are followed up on and executed
7. Handling overlapping responsibilities between two teams
8. Tools they use to structure the club's operations (Notion, Google Workspace…)
9. How they onboard a new manager mid-year and bring them up to speed
10. One organizational system they would implement to improve efficiency
`,
};

export interface Candidate {
  id: string;
  name: string;
  keywords: string[]; // lowercased substrings to match against free-text self-definition
  role: string;
  password: string;
  apiKey: string; // Grok API key (xAI) — shared across all candidates
  model: string;
  personalAngle?: string; // unique detail about this candidate to differentiate from others in the same role
}

// ──────────────────────────────────────────────────────────────────────────────
// SHARED GROK KEY — one key for all candidates (set in .env as GROK_KEY)
// ──────────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
// SHARED KEY — using Groq (free tier, OpenAI-compatible)
// ──────────────────────────────────────────────────────────────────────────────
const SHARED_KEY = process.env.GROQ_API_KEY ?? "MISSING_KEY";

const MODEL = "llama-3.3-70b-versatile"; // Best free Groq model

// ──────────────────────────────────────────────────────────────────────────────
// CANDIDATES — replace names / keywords / passwords / questionsHint with
// your real participants. Each candidate gets a tailored interview topic.
// ──────────────────────────────────────────────────────────────────────────────
export const candidates: Candidate[] = [
  // ── 1 · President ──────────────────────────────────────────────────────────
  {
    id: "c1",
    name: "Hamza Ganouni",
    keywords: ["Hamza", "Ganouni", "c1", "president", "hamza ganouni", "hamza-ganouni", "admin"],
    role: "President",
    password: "CPU_HG",
    apiKey: SHARED_KEY,
    model: MODEL,
    personalAngle: "a déjà organisé le hackathon CPU et connaît bien les défis logistiques du club",
  },

  // ── 2 · President ─────────────────────────────────────────────────────
  {
    id: "c2",
    name: "Farah Ben Ammar",
    keywords: ["Farah", "Ben Ammar", "c2", "farah ben ammar", "farah-ben-ammar"],
    role: "President",
    password: "CPU_FBA",
    apiKey: SHARED_KEY,
    model: MODEL,
    personalAngle: "vient du pôle médias avec une forte expérience en communication et branding",
  },

  // ── 3 · Project Manager ──────────────────────────────────────────────────────
  {
    id: "c3",
    name: "Chahd Jabbari",
    keywords: ["Chahd", "Jabbari", "c3", "chahd jabbari", "chahd-jabbari"],
    role: "Project Manager",
    password: "CPU_CJ",
    apiKey: SHARED_KEY,
    model: MODEL,
    personalAngle: "a une formation en design et apporte une sensibilité créative à la gestion de projet",
  },

  // ── 4 · Logistics Manager ──────────────────────────────────────────────
  {
    id: "c4",
    name: "Mayar Abdellaoui",
    keywords: ["Mayar", "Abdellaoui", "c4", "mayar abdellaoui", "mayar-abdellaoui"],
    role: "Logistics Manager",
    password: "CPU_MA",
    apiKey: SHARED_KEY,
    model: MODEL,
    personalAngle: "a géré l'organisation des événements CPU en tant que bénévole pendant 2 ans",
  },

  // ── 5 · Media Manager ──────────────────────────────────────────────────────
  {
    id: "c5",
    name: "Rania Belhaj",
    keywords: ["Rania", "Belhaj", "c5", "rania belhaj", "rania-belhaj"],
    role: "Media Manager",
    password: "CPU_RB",
    apiKey: SHARED_KEY,
    model: MODEL,
    personalAngle: "passionnée de photographie et storytelling visuel, spécialisée Instagram",
  },

  // ── 6 · HR Manager ─────────────────────────────────────────────────────
  {
    id: "c6",
    name: "Soulayma Afrit",
    keywords: ["Soulayma", "Afrit", "c6", "soulayma afrit", "soulayma-afrit"],
    role: "HR Manager",
    password: "CPU_SA",
    apiKey: SHARED_KEY,
    model: MODEL,
    personalAngle: "a déjà participé au recrutement des membres CPU et connaît les besoins RH du club",
  },

  // ── 7 · Technical Manager ────────────────────────────────────────────
  {
    id: "c7",
    name: "Kattoussi Khoubaib",
    keywords: ["Kattoussi", "Khoubaib", "c7", "kattoussi khoubaib", "kattoussi-khoubaib"],
    role: "Technical Manager",
    password: "CPU_CK",
    apiKey: SHARED_KEY,
    model: MODEL,
    personalAngle: "spécialiste en robotique et systèmes embarqués (STM32, Arduino)",
  },

  // ── 8 · Media Manager ──────────────────────────────────────────────────────
  {
    id: "c8",
    name: "Naoures Dardouri",
    keywords: ["Naoures", "Dardouri", "c8", "naoures dardouri", "naoures-dardouri"],
    role: "Media Manager",
    password: "CPU_ND",
    apiKey: SHARED_KEY,
    model: MODEL,
    personalAngle: "experte en montage vidéo et motion design (After Effects, Premiere)",
  },

  // ── 9 · Technical Manager ───────────────────────────────────────────────────
  {
    id: "c9",
    name: "Aymen Zarrad",
    keywords: ["Aymen", "Zarrad", "c9", "aymen zarrad", "aymen-zarrad"],
    role: "Technical Manager",
    password: "CPU_AZ",
    apiKey: SHARED_KEY,
    model: MODEL,
    personalAngle: "fort en développement web et mobile (React, Flutter), aime le mentoring technique",
  },

  // ── 10 · Project Manager ──────────────────────────────────────────────────────
  {
    id: "c10",
    name: "Yassmin Harrath",
    keywords: ["Yassmin", "Harrath", "c10", "yassmin harrath", "yassmin-harrath"],
    role: "Project Manager",
    password: "CPU_YH",
    apiKey: SHARED_KEY,
    model: MODEL,
    personalAngle: "excellente en organisation et suivi, méthodique et orientée résultats",
  },

  // ── 11 · Sponsorship Manager ────────────────────────────────────────────────────
  {
    id: "c11",
    name: "Takwa Souguir",
    keywords: ["Takwa", "Souguir", "c11", "takwa souguir", "takwa-souguir"],
    role: "Sponsorship Manager",
    password: "CPU_TS",
    apiKey: SHARED_KEY,
    model: MODEL,
    personalAngle: "a une expérience en négociation et relations publiques, très à l'aise à l'oral",
  },
  // ── 12 · Finance Manager ────────────────────────────────────────────────────
  {
    id: "c12",
    name: "Ranim Chahata",
    keywords: ["Ranim", "Chahata", "c12", "ranim chahata", "ranim-chahata"],
    role: "Finance Manager",
    password: "CPU_RC",
    apiKey: SHARED_KEY,
    model: MODEL,
    personalAngle: "rigoureuse et méthodique, à l'aise avec les chiffres et les tableaux de bord",
  },
  // ── 13 · Organization Manager ────────────────────────────────────────────────────
  {
    id: "c13",
    name: "Monatasar Bensaid",
    keywords: ["Monatasar", "Bensaid", "c13", "monatasar bensaid", "monatasar-bensaid"],
    role: "Organization Manager",
    password: "CPU_MB",
    apiKey: SHARED_KEY,
    model: MODEL,
    personalAngle: "très organisé et structuré, excelle dans la documentation et les processus",
  },

  // ── Admin / Shadow Monarch (internal testing) ──────────────────────────────
  {
    id: "admin",
    name: "admin",
    keywords: ["admin", "administrator", "monarch", "shadow monarch"],
    role: "Shadow Monarch",
    password: "may123",
    apiKey: SHARED_KEY,
    model: MODEL,
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

/** Strips accents/diacritics from a string for fuzzy matching (e.g. "é" → "e"). */
function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function findCandidateByText(text: string): Candidate | null {
  const raw = text.trim().toLowerCase();
  const t = normalize(raw); // accent-insensitive version
  console.log("SERVER IDENTIFY DEBUG: Looking for", `"${t}" (raw: "${raw}")`);

  if (!t) return null;

  // 1. Try exact or keyword match (with accent normalization)
  for (const c of candidates) {
    const nameStr = normalize(c.name.toLowerCase());
    const keywords = c.keywords.map(k => normalize(k.toLowerCase()));

    if (nameStr === t || keywords.includes(t)) {
      console.log("EXACT MATCH:", c.name);
      return c;
    }
  }

  // 2. Try partial / substring match (broad)
  for (const c of candidates) {
    const nameStr = normalize(c.name.toLowerCase());
    const keywords = c.keywords.map(k => normalize(k.toLowerCase()));

    if (
      nameStr.includes(t) ||
      t.includes(nameStr) ||
      keywords.some(k => t.includes(k) || k.includes(t))
    ) {
      console.log("PARTIAL MATCH:", c.name);
      return c;
    }
  }

  // 3. Token-level match — check if any word in the input matches any name token
  const inputTokens = t.split(/\s+/).filter(Boolean);
  for (const c of candidates) {
    const nameTokens = normalize(c.name.toLowerCase()).split(/\s+/);
    const keywords = c.keywords.map(k => normalize(k.toLowerCase()));

    const hasTokenMatch =
      inputTokens.some(tok =>
        nameTokens.some(nt => nt === tok || nt.startsWith(tok) || tok.startsWith(nt)) ||
        keywords.some(k => k === tok || k.startsWith(tok) || tok.startsWith(k))
      );

    if (hasTokenMatch) {
      console.log("TOKEN MATCH:", c.name, "for input tokens:", inputTokens);
      return c;
    }
  }

  console.log("FAILURE: No match for", t, "Available keys:", candidates.map(c => c.name).join(", "));
  return null;
}

export function getCandidateById(id: string): Candidate | null {
  return candidates.find((c) => c.id === id) ?? null;
}

export function buildSystemPrompt(c: Candidate, language: Language, questionNumber?: number): string {
  const isFinalTurn = questionNumber !== undefined && questionNumber >= 10;
  const langName = { fr: "French", en: "English", zh: "Chinese" }[language] ?? "English";

  const fullHint = roleQuestions[c.role] ?? "";
  const currentNum = questionNumber ?? 1;
  const hintLines = fullHint.split("\n");
  const relevantLines = hintLines.filter(line => {
    const match = line.match(/^\s*(\d+)\./);
    if (!match) return true;
    const num = parseInt(match[1]);
    return num >= currentNum && num <= currentNum + 1;
  });
  const roleSection = relevantLines.join("\n").trim();
  const roleBlock = roleSection
    ? `\n━━━━━━━━━ 🎯 QUESTIONS PAR RÔLE ━━━━━━━━━\n${roleSection}\n`
    : "";

  const angleBlock = c.personalAngle
    ? `\n━━━━━━━━━ 📌 NOTE SUR LE CANDIDAT ━━━━━━━━━\n${c.personalAngle}\n`
    : "";

  return `You are ARIA, a professional AI interviewer for the CPU Club (ISET'COM University). You conduct structured, neutral, and objective interviews.

━━━━━━━━━ 🔴 OPENING MESSAGE ━━━━━━━━━
Your VERY FIRST message MUST start with this exact block (keep [RED] and [/RED] tags):

[RED]
Welcome to the CPU Club interview process.

This is not a test of right or wrong answers.
We are here to understand who you are, how you think, and what you bring to this role.

The role of ${c.role} is a real responsibility. People will depend on you.
We don't need perfection. We need honesty, effort, and the willingness to grow.

So speak freely. Be yourself. Every answer helps us see the real you.
[/RED]

Then immediately ask your first question.

━━━━━━━━━ 🎯 STRUCTURE ━━━━━━━━━
- Ask EXACTLY 10 questions, ONE at a time. Never reveal the total or current number.
- Each question must be specific to the role of ${c.role}. Never mix topics from other roles.
- Follow the topics below. Adapt them naturally.
${roleBlock}
${angleBlock}

━━━━━━━━━ 🧠 EXACT BEHAVIOR RULES ━━━━━━━━━
Follow these rules strictly for EVERY candidate response:

1. ONE question per message. Never ask two questions in the same message. Never ask a follow-up before getting an answer to the current question.

2. ALWAYS let the candidate answer before moving on. Wait for their response.

3. NEUTRAL at all times. Never praise ("good answer", "très bien", "excellent", "good start"). Never comfort ("no problem", "c'est normal", "pas de souci"). Never criticize. Acknowledge briefly and move on.

4. If answer is CORRECT or ACCEPTABLE → Give a brief neutral acknowledgment. Then transition to next question.

5. If answer is WRONG → Give the correct answer in 1 short sentence. Then move to next question. Do NOT ask them to try again.

6. If answer is OFF-TOPIC or INCOMPLETE → Give a short warning: "Your answer does not address the question. Let's move on." Then move to next question. Do NOT rephrase or give a second chance.

7. If answer is "I don't know", "it's not my responsibility", or similar evasion → Give a short attention warning: "This role requires accountability. Not knowing is acceptable, but avoiding responsibility is not. Let's continue." Then move to next question.

8. TRANSITIONS: Simply state the next question naturally. A simple transition is fine.

━━━━━━━━━ 🚫 FORBIDDEN ━━━━━━━━━
- Never praise, motivate, comfort, or encourage the candidate
- Never ask multiple questions at once
- Never ask follow-up questions
- Never give second chances or rephrase questions
- Never help the candidate arrive at an answer
- Never use dramatic themes (dungeon, hunter, mana, S-Rank) outside [RED] block
- Never reveal question numbers

━━━━━━━━━ 🎤 CLOSING ━━━━━━━━━
After question 10, the interview is over. Deliver a short closing message:
1. Thank the candidate by name.
2. End with a neutral closing note.
3. On its own line: [INTERVIEW_COMPLETE]

${isFinalTurn ? `FINAL TURN: The candidate answered question 10. Close now and end with [INTERVIEW_COMPLETE].\n` : ""}

━━━━━━━━━ ⚠️ LANGUAGE ━━━━━━━━━
- Reply ONLY in ${langName} for the entire interview. No mixing.`;
}