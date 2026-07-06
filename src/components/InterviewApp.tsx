import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ArrowRight } from "lucide-react";
import IntroAnimation from "./IntroAnimation";
import DungeonBackground from "./DungeonBackground";
import VideoIntro from "./VideoIntro";
import GateReveal from "./GateReveal";
import logoUrl from "@/assets/cpu-logo.png";
import { RANKS, rankForAnswers, type Rank } from "@/lib/ranks";
import { I18N, type Lang } from "@/lib/i18n";
import {
  identifyCandidate,
  verifyPassword,
  sendInterviewTurn,
  saveInterview,
} from "@/lib/aria.functions";
import { playKey } from "@/lib/keySound";

type Step =
  | "video"
  | "intro"
  | "lang"
  | "selfdef"
  | "unknown"
  | "password"
  | "locked"
  | "interview"
  | "done";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const LANG_OPTIONS: Array<{
  code: Lang;
  flag: string;
  label: string;
  note?: string;
}> = [
    { code: "fr", flag: "🇫🇷", label: "Français" },
    { code: "en", flag: "🇬🇧", label: "English" },
    {
      code: "zh",
      flag: "🇨🇳",
      label: "中文",
      note: "Très courageux... ou très ambitieux 🐉 Le mandarin, c'est le S-Rank des langues. Respect total, Hunter 🫡",
    },
  ];

const ARIA_INTRO =
  "⚔️ Welcome! I am A.R.I.A — your AI interviewer for the CPU Club (Robotics & Tech).\n\n" +
  "To make this interview fun, we design it like a game:\n" +
  "• Hunter = That is you! A candidate ready for a new adventure.\n" +
  "• Dungeon = The interview challenge to test your skills.\n" +
  "• Ranks = Your score, from E-Rank (beginner) to S-Rank (highest level).\n\n" +
  "This system was built by the architect Mohamed Amine May and i'm an AI agent system created from a blend of his personality and CPU data to forge this legendary combination hihi\n\n" +
  "Whether you graduate this year (congrats!) and if you not !, remember: \"A smooth sea never made a skilled sailor! i believe in you<3\"\n\n" +
  "The CPU Club gates are open. But first... what language do you want to use?";
/** Parses [RED]...[/RED] blocks and renders them in red. Everything else renders as normal text. */
function renderMessageContent(content: string) {
  const parts = content.split(/(\[RED\][\s\S]*?\[\/RED\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[RED\]([\s\S]*?)\[\/RED\]$/);
        if (match) {
          return (
            <span
              key={i}
              className="block font-display text-sm tracking-wide mb-3"
              style={{
                color: "#ff5555",
                textShadow: "0 0 12px rgba(255,85,85,0.55)",
                borderLeft: "3px solid #ff5555",
                paddingLeft: "0.75rem",
                whiteSpace: "pre-wrap",
              }}
            >
              {match[1].trim()}
            </span>
          );
        }
        return part ? (
          <span key={i} style={{ whiteSpace: "pre-wrap" }}>
            {part}
          </span>
        ) : null;
      })}
    </>
  );
}

function renderTypewrittenContent(content: string, visibleLength: number) {
  const typedSoFar = content.slice(0, visibleLength);
  let textToParse = typedSoFar;
  if (typedSoFar.includes("[RED]") && !typedSoFar.includes("[/RED]")) {
    textToParse += "[/RED]";
  }
  return renderMessageContent(textToParse);
}

/** Typewriter that calls onDone exactly once. */
function Typewriter({
  text,
  speed = 25,
  onDone,
  onChar,
  enableSound = false,
}: {
  text: string;
  speed?: number;
  onDone?: () => void;
  onChar?: () => void;
  enableSound?: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    setVisibleCount(0);
    doneRef.current = false;
    let i = 0;

    const id = setInterval(() => {
      i++;
      setVisibleCount(i);
      onChar?.();
      if (enableSound && i <= text.length) {
        playKey("key");
      }
      if (i >= text.length) {
        clearInterval(id);
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
      }
    }, speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, enableSound]);

  return <span className="whitespace-pre-wrap">{renderTypewrittenContent(text, visibleCount)}</span>;
}

function RankBadge({ rank, size = 64 }: { rank: Rank; size?: number }) {
  const info = RANKS[rank];
  return (
    <motion.div
      key={rank}
      initial={{ scale: 0.6, opacity: 0, rotateY: -90 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="font-display rank-glow inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        clipPath:
          "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        background: `linear-gradient(135deg, ${info.color} 0%, #050508 100%)`,
        border: `1px solid ${info.glow}`,
        color: info.glow,
        fontSize: size * 0.45,
        fontWeight: 700,
      }}
      aria-label={info.label}
    >
      {rank}
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-2 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-2 rounded-full"
          style={{
            background: "var(--rank-glow)",
            boxShadow: "0 0 8px var(--rank-glow)",
          }}
          animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/** Parses [RED]...[/RED] blocks and renders them in red. Everything else renders as normal text. */
// renderMessageContent moved to the top of the file to support typewriter formatting

export default function InterviewApp() {
  const [step, setStep] = useState<Step>("video");
  const [gateOpen, setGateOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [langChosen, setLangChosen] = useState<Lang | null>(null);
  const [introTyped, setIntroTyped] = useState(false);
  const [candidate, setCandidate] = useState<{ id: string; name: string; role: string } | null>(null);
  const [pwAttempts, setPwAttempts] = useState(0);
  const [pwError, setPwError] = useState(false);
  const [pwShake, setPwShake] = useState(false);
  const [selfDef, setSelfDef] = useState("");
  const [selfDefError, setSelfDefError] = useState<false | "not_found" | "server_error">(false);
  const [selfDefShake, setSelfDefShake] = useState(false);
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [rankFlash, setRankFlash] = useState<Rank | null>(null);
  const [pendingDone, setPendingDone] = useState(false);
  const [recommendation, setRecommendation] = useState<null | "interview" | "meeting">(null);
  const lastRankRef = useRef<Rank>("E");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize chat input height dynamically based on content length
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const identify = useServerFn(identifyCandidate);
  const verifyPw = useServerFn(verifyPassword);
  const sendTurn = useServerFn(sendInterviewTurn);
  const save = useServerFn(saveInterview);

  const rank = rankForAnswers(answeredCount);
  const info = RANKS[rank];
  const t = I18N[lang];

  // Drive --rank-glow / --rank for whole UI
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--rank", info.color);
    root.style.setProperty("--rank-glow", info.glow);
  }, [info]);

  // Rank-up flash
  useEffect(() => {
    if (rank !== lastRankRef.current) {
      lastRankRef.current = rank;
      setRankFlash(rank);
      const id = setTimeout(() => setRankFlash(null), 1500);
      return () => clearTimeout(id);
    }
  }, [rank]);

  // Auto-scroll chat on new messages / loading changes
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, step]);

  // ---------- Handlers ----------
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Key click sound plays only when A.R.I.A types; user input typing is silent
  };

  const handleLang = (code: Lang) => {
    setLang(code);
    setLangChosen(code);
    setTimeout(() => setStep("selfdef"), 700);
  };

  const submitSelfDef = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selfDef.trim() || loading) return;
    console.log("SubmitSelfDef started with:", selfDef.trim());
    setLoading(true);
    setSelfDefError(false);
    try {
      const res = await identify({ data: { text: selfDef.trim() } });
      console.log("Identify result:", res);
      if (!res.found) {
        setSelfDefError("not_found");
        setSelfDefShake(true);
        setTimeout(() => setSelfDefShake(false), 600);
      } else {
        setCandidate({ id: res.id, name: res.name, role: res.role });
        setStep("password");
      }
    } catch (err) {
      console.error("SubmitSelfDef FAILED (server/network error):", err);
      setSelfDefError("server_error");
      setSelfDefShake(true);
      setTimeout(() => setSelfDefShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!candidate || !password || loading) return;
    setLoading(true);
    try {
      const res = await verifyPw({
        data: { candidateId: candidate.id, password },
      });
      if (res.ok) {
        setStep("interview");
        setGateOpen(true);
        try {
          const first = await sendTurn({
            data: {
              candidateId: candidate.id,
              language: lang,
              history: [],
              message: null,
            },
          });
          setMessages([{ role: "assistant", content: first.reply }]);
        } catch (apiErr) {
          console.error("Failed to start interview:", apiErr);
          setMessages([{
            role: "assistant",
            content: "[⚠ ARIA ne peut pas démarrer — vérifiez la clé API dans .env et redémarrez le serveur.]",
          }]);
        }
      } else {
        setPwError(true);
        setPwShake(true);
        setTimeout(() => setPwShake(false), 600);
        const next = pwAttempts + 1;
        setPwAttempts(next);
        setPassword("");
        if (next >= 3) setStep("locked");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const sendChat = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!candidate || !input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    const newHistory = [...messages, { role: "user" as const, content: msg }];
    setMessages(newHistory);
    // Calculate the new count BEFORE the state update (answeredCount is stale in closure)
    const newAnsweredCount = answeredCount + 1;
    setAnsweredCount(newAnsweredCount);
    setLoading(true);
    try {
      // Pass the last user message so ARIA can respond to it.
      // The history already contains the full conversation including this message,
      // but we also pass it as the explicit 'message' field for correct Gemini formatting.
      // We slice off the last item from history (the user's msg) to avoid duplication
      // since aria.functions.ts appends message to contents itself.
      const res = await sendTurn({
        data: {
          candidateId: candidate.id,
          language: lang,
          history: messages, // history WITHOUT the new user message (aria.functions appends it)
          message: msg,      // the actual user message, not null
          questionNumber: newAnsweredCount, // tells server which question this is (triggers close at 10)
        },
      });
      const finalHistory = [
        ...newHistory,
        { role: "assistant" as const, content: res.reply },
      ];
      setMessages(finalHistory);
      // End the interview when 10 questions have been answered (S-rank reached)
      // regardless of what the server says — the limit is enforced client-side.
      if (res.complete || newAnsweredCount >= 10) {
        try {
          await save({
            data: {
              candidateId: candidate.id,
              language: lang,
              conversation: finalHistory,
              rankReached: "S",
            },
          });
        } catch (e) {
          console.error("save failed", e);
        }
        setAnsweredCount(10);
        // Don't navigate immediately — wait for the last Typewriter to finish
        setPendingDone(true);
      }
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "[The dungeon trembles... the connection falters. Try again.]",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [candidate, input, loading, messages, lang, sendTurn, save, answeredCount]);

  // Smooth scroll for new messages (useEffect triggers)
  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  // Instant scroll used character-by-character inside Typewriter
  const scrollToBottomInstant = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // Download conversation as .txt file on the PC
  const downloadConversation = useCallback(() => {
    if (!messages.length) return;
    const lines = messages.map((m) =>
      `[${m.role === "assistant" ? "A.R.I.A" : (candidate?.name ?? "Candidat")}]\n${m.content}`
    );
    const text = [
      `=== CPU Club — Entretien de ${candidate?.name ?? "Candidat"} (${candidate?.role ?? ""}) ===`,
      `Date : ${new Date().toLocaleString("fr-FR")}`,
      `Langue : ${lang.toUpperCase()}`,
      "",
      ...lines,
    ].join("\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `entretien_${(candidate?.name ?? "candidat").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, candidate, lang]);

  const reset = () => {
    setStep("lang");
    setSelfDef("");
    setPassword("");
    setMessages([]);
    setCandidate(null);
    setAnsweredCount(0);
    setPwAttempts(0);
    setPwError(false);
    setSelfDefError(false);
    setLangChosen(null);
    setIntroTyped(false);
    setPendingDone(false);
    setRecommendation(null);
    lastRankRef.current = "E";
  };

  // ---------- Render ----------
  if (step === "video") {
    return <VideoIntro onDone={() => setStep("intro")} />;
  }

  if (step === "intro") {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <DungeonBackground glow={info.glow} />
        <IntroAnimation onDone={() => setStep("lang")} />
      </div>
    );
  }

  const progressPct = Math.min(100, (answeredCount / 10) * 100);

  return (
    <div
      dir={t.dir}
      className="relative h-screen max-h-screen w-full overflow-hidden text-foreground"
    >
      <DungeonBackground glow={info.glow} />

      {/* Rank-up flash banner */}
      <AnimatePresence>
        {rankFlash && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none py-6"
            style={{
              background: `radial-gradient(ellipse at center, ${RANKS[rankFlash].glow}44 0%, transparent 70%)`,
            }}
          >
            <div className="flex items-center gap-4">
              <RankBadge rank={rankFlash} size={48} />
              <div
                className="font-display rank-glow text-xl sm:text-2xl tracking-[0.25em]"
                style={{ color: RANKS[rankFlash].glow }}
              >
                {RANKS[rankFlash].label}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single full-screen dashboard */}
      <main className="relative z-10 mx-auto flex h-full max-h-full w-full max-w-7xl flex-col lg:flex-row gap-4 p-3 sm:p-6 overflow-hidden">
        {/* ───── Left status panel (30%) ───── */}
        <aside
          className="relative w-full lg:w-[30%] lg:h-full rounded-2xl border bg-black/40 backdrop-blur-md p-3 lg:p-6 flex flex-row lg:flex-col lg:gap-6 items-center lg:items-stretch justify-between lg:justify-start gap-4 overflow-hidden"
          style={{
            borderColor: "color-mix(in oklab, var(--rank-glow) 35%, transparent)",
            boxShadow:
              "0 0 30px color-mix(in oklab, var(--rank-glow) 18%, transparent), inset 0 0 30px rgba(0,0,0,0.6)",
          }}
        >
          {/* Mobile top status bar */}
          <div className="flex items-center justify-between w-full lg:hidden gap-3">
            {/* Logo & Hunter */}
            <div className="flex items-center gap-2">
              <img
                src={logoUrl}
                alt="CPU Club"
                className="h-8 w-8 object-contain"
                style={{
                  mixBlendMode: "screen",
                  filter: "drop-shadow(0 0 6px var(--rank-glow))",
                }}
              />
              <div>
                <div className="font-display text-[10px] tracking-wider text-foreground select-none">
                  {candidate?.name ?? "— UNKNOWN —"}
                </div>
                <div className="font-display text-[8px] text-muted-foreground uppercase tracking-widest">
                  {candidate?.role ?? "Trials"}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex-1 max-w-[120px] sm:max-w-[200px] mx-2">
              <div className="flex items-center justify-between text-[8px] font-display tracking-[0.2em] text-muted-foreground mb-1">
                <span>PROGRESS</span>
                <span>{answeredCount}/10</span>
              </div>
              <div className="relative h-1.5 rounded-full overflow-hidden bg-white/5 border border-white/10">
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${progressPct}%`,
                    background: `linear-gradient(90deg, ${info.color}, ${info.glow})`,
                    boxShadow: `0 0 8px ${info.glow}`,
                  }}
                />
              </div>
            </div>

            {/* Rank badge */}
            <div className="flex items-center gap-2">
              <RankBadge rank={rank} size={32} />
              <span
                className="font-display text-[9px] tracking-widest uppercase hidden sm:inline"
                style={{ color: info.glow }}
              >
                {info.label}
              </span>
            </div>
          </div>

          {/* Desktop full panel */}
          <div className="hidden lg:flex lg:flex-col lg:gap-6 lg:h-full lg:w-full lg:justify-between flex-1">
            {/* Floating rune deco */}
            <div
              className="pointer-events-none absolute -right-4 -top-4 text-7xl font-display opacity-10 select-none"
              style={{ color: "var(--rank-glow)" }}
            >
              ᛟ
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img
                  src={logoUrl}
                  alt="CPU Club"
                  className="h-10 w-10 object-contain"
                  style={{
                    mixBlendMode: "screen",
                    filter: "drop-shadow(0 0 10px var(--rank-glow))",
                  }}
                />
                <div>
                  <div className="font-display text-[10px] tracking-[0.3em] text-muted-foreground mb-2">
                    CPU CLUB
                  </div>
                  <div className="font-display text-sm tracking-[0.2em]">
                    ISET'COM
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 py-2">
                <RankBadge rank={rank} size={96} />
                <div
                  className="font-display text-sm tracking-[0.25em] rank-glow"
                  style={{ color: info.glow }}
                >
                  {info.label}
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-display tracking-[0.3em] text-muted-foreground mb-2">
                  <span>PROGRESS</span>
                  <span>{answeredCount}/10</span>
                </div>
                <div className="relative h-2 rounded-full overflow-hidden bg-white/5 border" style={{ borderColor: "color-mix(in oklab, var(--rank-glow) 30%, transparent)" }}>
                  <motion.div
                    className="absolute inset-y-0 left-0"
                    style={{
                      background: `linear-gradient(90deg, ${info.color}, ${info.glow})`,
                      boxShadow: `0 0 12px ${info.glow}`,
                    }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            {/* Identity card */}
            <div className="space-y-3 mt-auto pt-4 border-t border-white/5">
              <div>
                <div className="font-display text-[10px] tracking-[0.3em] text-muted-foreground mb-1">
                  HUNTER
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={candidate?.name ?? "anon"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="font-display text-base tracking-wide"
                  >
                    {candidate?.name ?? "— unknown soul —"}
                  </motion.div>
                </AnimatePresence>
              </div>
              {candidate && (
                <div>
                  <div className="font-display text-[10px] tracking-[0.3em] text-muted-foreground mb-1">
                    ROLE
                  </div>
                  <span
                    className="inline-block rounded-md px-2.5 py-1 text-xs font-display tracking-[0.2em] uppercase"
                    style={{
                      background:
                        "color-mix(in oklab, var(--rank-glow) 15%, transparent)",
                      border:
                        "1px solid color-mix(in oklab, var(--rank-glow) 50%, transparent)",
                      color: "var(--rank-glow)",
                    }}
                  >
                    {candidate.role}
                  </span>
                </div>
              )}
              <div className="pt-2">
                <div className="font-display text-[9px] tracking-[0.35em] text-muted-foreground/70">
                  LANGUAGE · {lang.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ───── Right chat panel (70%) ───── */}
        <section
          className="relative flex-1 rounded-2xl border bg-black/50 backdrop-blur-md flex flex-col overflow-hidden min-h-[70vh] lg:min-h-0"
          style={{
            borderColor:
              "color-mix(in oklab, var(--rank-glow) 35%, transparent)",
            boxShadow:
              "0 0 40px color-mix(in oklab, var(--rank-glow) 20%, transparent), inset 0 0 40px rgba(0,0,0,0.55)",
          }}
        >
          {/* Solo Leveling gate-opening animation */}
          <GateReveal
            open={gateOpen}
            glow={info.glow}
            onDone={() => setGateOpen(false)}
          />
          {/* Scroll area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto no-scrollbar px-5 sm:px-8 py-6 space-y-5"
          >
            {/* LANG step */}
            {step === "lang" && (
              <motion.div
                key="lang"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-7"
              >
                <div
                  className="chat-msg-aria rounded-lg px-4 py-4 text-sm sm:text-base leading-relaxed font-display"
                  style={{ borderLeftWidth: 3 }}
                >
                  <div className="font-display text-[10px] tracking-[0.3em] text-muted-foreground mb-2">
                    A.R.I.A
                  </div>
                  <Typewriter
                    text={ARIA_INTRO}
                    speed={35}
                    onDone={() => setIntroTyped(true)}
                    enableSound={true}
                  />
                </div>

                <AnimatePresence>
                  {introTyped && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2"
                    >
                      {LANG_OPTIONS.map((opt) => {
                        const chosen = langChosen === opt.code;
                        return (
                          <div key={opt.code} className="group relative">
                            <button
                              onClick={() => handleLang(opt.code)}
                              disabled={!!langChosen}
                              className="hunter-button hover:hunter-button-hover w-full flex flex-col items-center gap-2 py-4 disabled:cursor-default"
                              style={
                                chosen
                                  ? {
                                    borderColor: "#ffd966",
                                    color: "#ffd966",
                                    boxShadow:
                                      "0 0 30px rgba(255,217,102,0.7), inset 0 0 20px rgba(255,217,102,0.2)",
                                  }
                                  : undefined
                              }
                            >
                              <span className="text-2xl">{opt.flag}</span>
                              <span className="text-xs">{opt.label}</span>
                            </button>
                            {opt.note && (
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-md border border-amber-400/30 bg-black/95 px-3 py-2 text-xs text-amber-200/90 opacity-0 transition-opacity group-hover:opacity-100 z-20 shadow-lg font-body normal-case tracking-normal">
                                {opt.note}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* SELF DEF step */}
            {step === "selfdef" && (
              <motion.div
                key="selfdef"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="chat-msg-aria rounded-lg px-4 py-4 text-sm sm:text-base leading-relaxed font-display"
                style={{ borderLeftWidth: 3 }}
              >
                <div className="font-display text-[10px] tracking-[0.3em] text-muted-foreground mb-2">
                  A.R.I.A
                </div>
                <Typewriter text={t.selfDefPrompt} speed={35} enableSound={true} />
                {selfDefError === "not_found" && (
                  <p className="mt-3 text-sm text-red-500 font-display tracking-widest animate-pulse">
                    {"// IDENTITÉ NON RECONNUE — Vérifiez votre prénom et nom."}
                  </p>
                )}
                {selfDefError === "server_error" && (
                  <p className="mt-3 text-sm text-orange-400 font-display tracking-widest animate-pulse">
                    {"// ERREUR SERVEUR — Rechargez la page et relancez le serveur."}
                  </p>
                )}
              </motion.div>
            )}

            {/* PASSWORD step */}
            {step === "password" && candidate && (
              <motion.div
                key="password"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div
                  className="chat-msg-user rounded-lg px-4 py-3 text-sm sm:text-base leading-relaxed font-body ml-auto max-w-[85%]"
                  style={{ borderRightWidth: 3 }}
                >
                  {selfDef}
                </div>
                <div
                  className="chat-msg-aria rounded-lg px-4 py-4 text-sm sm:text-base leading-relaxed font-display"
                  style={{ borderLeftWidth: 3 }}
                >
                  <div className="font-display text-[10px] tracking-[0.3em] text-muted-foreground mb-2">
                    A.R.I.A
                  </div>
                  <Typewriter
                    text={t.passwordTitle(candidate.name, candidate.role)}
                    speed={35}
                    enableSound={true}
                  />
                </div>
                {pwError && (
                  <p className="text-center text-sm text-red-400 font-display tracking-widest">
                    {t.passwordWrong}
                  </p>
                )}
              </motion.div>
            )}

            {/* UNKNOWN step */}
            {step === "unknown" && (
              <motion.div
                key="unknown"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div
                  className="chat-msg-aria rounded-lg px-4 py-4 text-sm sm:text-base leading-relaxed font-display"
                  style={{
                    borderLeftWidth: 3,
                    borderLeftColor: "#ff5555",
                    boxShadow: "0 0 24px rgba(255,80,80,0.35)",
                  }}
                >
                  <div className="font-display text-[10px] tracking-[0.3em] text-red-400 mb-2">
                    A.R.I.A · ACCESS DENIED
                  </div>
                  <Typewriter text={t.unknown} speed={35} enableSound={true} />
                </div>
              </motion.div>
            )}

            {/* LOCKED step */}
            {step === "locked" && (
              <motion.div
                key="locked"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg border border-red-500/50 bg-red-950/30 px-5 py-6 text-center font-display tracking-widest"
                style={{ boxShadow: "0 0 40px rgba(255,40,40,0.4)" }}
              >
                <div className="text-red-300 text-lg">{t.passwordLocked}</div>
              </motion.div>
            )}

            {/* INTERVIEW chat */}
            {step === "interview" &&
              messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 0,
                    x: m.role === "assistant" ? -16 : 16,
                  }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`${m.role === "assistant" ? "chat-msg-aria" : "chat-msg-user"
                      } max-w-[88%] rounded-lg px-4 py-3 text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${m.role === "assistant" ? "font-display" : "font-body"
                      }`}
                    style={{
                      borderLeftWidth: m.role === "assistant" ? 3 : undefined,
                      borderRightWidth: m.role === "user" ? 3 : undefined,
                    }}
                  >
                    {m.role === "assistant" && (
                      <div className="font-display text-[10px] tracking-[0.3em] text-muted-foreground mb-1">
                        A.R.I.A
                      </div>
                    )}
                    {m.role === "assistant"
                      ? (i === messages.length - 1
                        ? <Typewriter
                          text={m.content}
                          speed={20}
                          enableSound={true}
                          onChar={scrollToBottomInstant}
                          onDone={() => {
                            scrollToBottom();
                            if (pendingDone) {
                              setPendingDone(false);
                              setStep("done");
                            }
                          }}
                        />
                        : renderMessageContent(m.content))
                      : m.content}
                  </div>
                </motion.div>
              ))}

            {/* DONE */}
            {step === "done" && candidate && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative flex flex-col items-center text-center py-10 gap-6"
              >
                <div
                  className="absolute inset-0 -z-10 pulse-glow"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(240,180,41,0.35) 0%, rgba(157,0,255,0.18) 40%, transparent 70%)",
                    filter: "blur(30px)",
                  }}
                />
                <RankBadge rank="S" size={140} />
                <h2
                  className="font-display text-2xl sm:text-3xl rank-glow"
                  style={{ color: "#ffd966" }}
                >
                  {t.completeTitle(candidate.name)}
                </h2>
                <p className="text-muted-foreground font-display tracking-widest text-sm">
                  {t.completeSub}
                </p>
                <p
                  className="font-display text-sm tracking-[0.3em]"
                  style={{ color: "#ffd966" }}
                >
                  {t.rankAchieved} — S-RANK MONARCH
                </p>



                {/* ── Recommendation card ── */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="w-full max-w-md mt-4 rounded-xl border px-5 py-5 space-y-4"
                  style={{
                    borderColor: "color-mix(in oklab, var(--rank-glow) 40%, transparent)",
                    background: "rgba(0,0,0,0.55)",
                    boxShadow: "0 0 24px color-mix(in oklab, var(--rank-glow) 15%, transparent)",
                  }}
                >
                  <div className="font-display text-[10px] tracking-[0.3em] text-muted-foreground">
                    ⚙️ SYSTEM FEEDBACK
                  </div>
                  <p className="font-display text-sm tracking-wide" style={{ color: "#ffd966" }}>
                    Est-ce que cette méthode d'interview IA est meilleure qu'un simple meeting classique ?
                  </p>
                  {recommendation === null ? (
                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                      <button
                        onClick={() => setRecommendation("interview")}
                        className="hunter-button hover:hunter-button-hover flex-1 text-xs py-2.5"
                      >
                        🏆 Meilleure qu'un meeting
                      </button>
                      <button
                        onClick={() => setRecommendation("meeting")}
                        className="hunter-button hover:hunter-button-hover flex-1 text-xs py-2.5"
                      >
                        💬 Je préfère un meeting
                      </button>
                    </div>
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-display text-sm text-center"
                      style={{ color: recommendation === "interview" ? "#ffd966" : "#8a6cff" }}
                    >
                      {recommendation === "interview"
                        ? "⚔️ Ton verdict est enregistré dans le Système. Merci, Hunter."
                        : "💬 Noté. Le Système apprend de chaque retour. Merci, Hunter."}
                    </motion.p>
                  )}
                </motion.div>

                {/* ── Download Transcript Button ── */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  onClick={downloadConversation}
                  className="mt-2 hunter-button hover:hunter-button-hover px-6 py-2 text-xs"
                >
                  📥 {lang === "fr" ? "Télécharger la transcription" : "Download Transcript"}
                </motion.button>
              </motion.div>
            )}

            {loading && step === "interview" && (
              <div className="flex justify-start">
                <div
                  className="chat-msg-aria rounded-lg px-3"
                  style={{ borderLeftWidth: 3 }}
                >
                  <TypingDots />
                </div>
              </div>
            )}
          </div>

          {/* Input bar (Enter only, no buttons) */}
          {(step === "selfdef" ||
            step === "password" ||
            step === "interview" ||
            step === "unknown" ||
            step === "locked" ||
            step === "done") && (
              <div
                className="border-t px-4 sm:px-6 py-4"
                style={{
                  borderColor:
                    "color-mix(in oklab, var(--rank-glow) 30%, transparent)",
                  background:
                    "linear-gradient(180deg, transparent, rgba(0,0,0,0.5))",
                }}
              >
                {step === "selfdef" && (
                  <form onSubmit={submitSelfDef} className={`relative ${selfDefShake ? "shake" : ""}`}>
                    <input
                      autoFocus
                      type="text"
                      value={selfDef}
                      onChange={(e) => {
                        setSelfDef(e.target.value);
                        setSelfDefError(false);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={t.selfDefPlaceholder}
                      disabled={loading}
                      className={`hunter-input focus:hunter-input-focus w-full rounded-lg pl-4 pr-12 py-3 text-base font-body ${selfDefError ? "!border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.3)]" : ""}`}
                    />
                    <button
                      type="submit"
                      disabled={loading || !selfDef.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-rank-glow hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </form>
                )}
                {step === "password" && (
                  <form onSubmit={submitPassword} className={pwShake ? "shake" : ""}>
                    <div className="relative">
                      <input
                        autoFocus
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPwError(false);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={t.passwordPlaceholder}
                        disabled={loading}
                        className={`hunter-input focus:hunter-input-focus w-full rounded-lg px-4 py-3 text-center text-lg tracking-[0.3em] font-display ${pwError ? "!border-red-500" : ""
                          }`}
                        style={
                          pwError
                            ? { boxShadow: "0 0 30px rgba(255,60,60,0.7)" }
                            : undefined
                        }
                      />
                      <button
                        type="submit"
                        disabled={loading || !password}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-rank-glow hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </form>
                )}

                {step === "interview" && (
                  <form onSubmit={sendChat} className="relative">
                    <textarea
                      autoFocus
                      ref={textareaRef}
                      value={input}
                      rows={1}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendChat(e);
                        } else {
                          handleKeyDown(e);
                        }
                      }}
                      placeholder={t.inputPlaceholder}
                      disabled={loading}
                      style={{ resize: "none" }}
                      className="hunter-input focus:hunter-input-focus w-full rounded-lg pl-4 pr-12 py-3 block text-base font-body"
                    />
                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-rank-glow hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </form>
                )}
                {(step === "unknown" ||
                  step === "locked" ||
                  step === "done") && (
                    <button
                      onClick={reset}
                      className="hunter-button hover:hunter-button-hover w-full"
                    >
                      {step === "done" ? t.returnSurface : t.returnBtn}
                    </button>
                  )}
                {loading && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground font-display tracking-widest">
                    <Loader2 className="h-3 w-3 animate-spin" /> {t.thinking}
                  </div>
                )}
              </div>
            )}
        </section>
      </main>
    </div>
  );
}
