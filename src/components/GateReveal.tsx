import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * GateReveal
 * Solo Leveling-style gate opening animation:
 * two horizontal panels — top slides up, bottom slides down —
 * splitting the screen to reveal the chat interface beneath.
 */
export default function GateReveal({
    open,
    onDone,
    glow,
}: {
    open: boolean;
    onDone: () => void;
    glow: string;
}) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(t);
    }, [open]);

    if (!open) return null;

    const glowLineStyle = {
        background: `linear-gradient(90deg, transparent 0%, ${glow} 30%, #fff 50%, ${glow} 70%, transparent 100%)`,
        boxShadow: `0 0 18px ${glow}, 0 0 40px ${glow}55`,
    } as const;

    return (
        <AnimatePresence onExitComplete={onDone}>
            {!visible ? null : (
                <motion.div
                    key="gate-overlay"
                    className="absolute inset-0 z-50 pointer-events-none overflow-hidden"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                >
                    {/* ─── TOP PANEL ─── slides from center up */}
                    <motion.div
                        className="absolute left-0 right-0 top-0 h-1/2"
                        style={{
                            transformOrigin: "top center",
                            background: `linear-gradient(180deg, #050508 0%, #0a0a12 100%)`,
                            borderBottom: `1px solid ${glow}`,
                        }}
                        initial={{ y: 0 }}
                        animate={{ y: "-100%" }}
                        transition={{ duration: 0.85, ease: [0.7, 0, 0.2, 1], delay: 0.15 }}
                        onAnimationComplete={() => setVisible(false)}
                    >
                        {/* Glowing rune line at the split edge */}
                        <motion.div
                            className="absolute bottom-0 left-0 right-0 h-[2px]"
                            style={glowLineStyle}
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: [0, 1, 0.6, 1, 0], scaleX: [0, 1, 1, 1, 0] }}
                            transition={{ duration: 1.2, ease: "easeInOut" as const, times: [0, 0.2, 0.5, 0.8, 1] }}
                        />
                        <div
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 font-display text-xs tracking-[0.5em] uppercase select-none whitespace-nowrap"
                            style={{ color: glow, opacity: 0.7, textShadow: `0 0 12px ${glow}` }}
                        >
                            ⚔ SYSTEM GATE OPENING ⚔
                        </div>
                    </motion.div>

                    {/* ─── BOTTOM PANEL ─── slides from center down */}
                    <motion.div
                        className="absolute left-0 right-0 bottom-0 h-1/2"
                        style={{
                            transformOrigin: "bottom center",
                            background: `linear-gradient(0deg, #050508 0%, #0a0a12 100%)`,
                            borderTop: `1px solid ${glow}`,
                        }}
                        initial={{ y: 0 }}
                        animate={{ y: "100%" }}
                        transition={{ duration: 0.85, ease: [0.7, 0, 0.2, 1], delay: 0.15 }}
                    >
                        {/* Glowing rune line at the split edge */}
                        <motion.div
                            className="absolute top-0 left-0 right-0 h-[2px]"
                            style={glowLineStyle}
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: [0, 1, 0.6, 1, 0], scaleX: [0, 1, 1, 1, 0] }}
                            transition={{ duration: 1.2, ease: "easeInOut" as const, times: [0, 0.2, 0.5, 0.8, 1] }}
                        />
                        <div
                            className="absolute top-6 left-1/2 -translate-x-1/2 font-display text-xs tracking-[0.5em] uppercase select-none whitespace-nowrap"
                            style={{ color: glow, opacity: 0.7, textShadow: `0 0 12px ${glow}` }}
                        >
                            ᛟ ENTER THE DUNGEON ᛟ
                        </div>
                    </motion.div>

                    {/* ─── CENTER FLASH LINE ─── */}
                    <motion.div
                        className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[3px] pointer-events-none"
                        style={{
                            background: `linear-gradient(90deg, transparent 0%, ${glow} 20%, #fff 50%, ${glow} 80%, transparent 100%)`,
                            boxShadow: `0 0 30px ${glow}, 0 0 60px ${glow}88`,
                        }}
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 1.0, times: [0, 0.1, 0.8, 1], ease: "easeInOut" as const }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
