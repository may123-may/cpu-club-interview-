import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import logoUrl from "@/assets/cpu-logo.png";

export default function IntroAnimation({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Logo fades in over 1.2s, holds, then slide-up exit at 2.5s
    const t1 = setTimeout(() => setShow(false), 2500);
    const t2 = setTimeout(onDone, 3300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.7, 0, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          style={{ background: "#050508" }}
        >
          {/* Subtle golden radial backdrop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.7, 0.45], scale: [0.6, 1.8, 1.4] }}
            transition={{ duration: 2.2, times: [0, 0.45, 1], ease: "easeOut" }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "70vmin",
              height: "70vmin",
              background:
                "radial-gradient(circle, rgba(240,180,41,0.55) 0%, rgba(240,180,41,0.15) 35%, rgba(5,5,8,0) 70%)",
              filter: "blur(25px)",
            }}
          />

          {/* Expanding ring */}
          <motion.div
            initial={{ opacity: 0.9, scale: 0.2 }}
            animate={{ opacity: 0, scale: 2.4 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "44vmin",
              height: "44vmin",
              border: "1.5px solid rgba(240,180,41,0.7)",
              boxShadow: "0 0 50px rgba(240,180,41,0.5)",
            }}
          />

          {/* Logo with pulsing golden drop-shadow */}
          <motion.img
            src={logoUrl}
            alt="CPU Club ISET'COM Branch"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              filter: [
                "drop-shadow(0 0 12px rgba(240,180,41,0))",
                "drop-shadow(0 0 35px rgba(240,180,41,0.7))",
                "drop-shadow(0 0 18px rgba(240,180,41,0.35))",
                "drop-shadow(0 0 35px rgba(240,180,41,0.7))",
              ],
            }}
            transition={{
              opacity: { duration: 1.2, ease: "easeOut" },
              scale: { duration: 1.2, ease: [0.2, 0.8, 0.2, 1] },
              filter: { duration: 2.2, times: [0, 0.33, 0.66, 1], ease: "easeInOut" },
            }}
            className="relative z-10 w-[42vmin] max-w-[420px]"
            style={{ mixBlendMode: "screen" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
