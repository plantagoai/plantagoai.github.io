import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition"
        style={{ background: "hsl(var(--ink))", color: "hsl(var(--bg))" }}
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 right-6 z-40 w-[88vw] max-w-sm rounded-2xl border border-border bg-bg p-4 shadow-2xl"
          >
            <p className="text-meta uppercase tracking-[0.18em]">Chat with my AI</p>
            <p className="mt-2 text-sm text-muted">
              Quick questions about my career or work? Ask here, or scroll to the full chat
              panel.
            </p>
            <a
              href="#chat"
              onClick={() => setOpen(false)}
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Open the full chat →
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
