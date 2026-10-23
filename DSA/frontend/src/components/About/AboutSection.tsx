import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Zap,
  Cpu,
  Search,
  Bot,
  Heart,
  X,
  Terminal,
  Mail,
  MessageSquare,
} from 'lucide-react';

interface AboutSectionProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback?: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ isOpen, onClose, onOpenFeedback }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 sm:p-6 flex justify-center items-start sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl my-auto rounded-3xl border border-zinc-700/80 bg-[#0c0f17] p-6 sm:p-8 shadow-[0_0_60px_rgba(16,185,129,0.18)] text-zinc-100 overflow-hidden"
        >
          {/* Ambient background glow accents */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all border border-zinc-700/80 shadow-md hover:scale-105"
            title="Close"
          >
            <X size={18} />
          </button>

          {/* Top Profile Section: Fully Visible with BIG Fixed Photo */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-zinc-800/80">
            {/* BIG Animated Photo: FIXED & STATIC (Permanent) */}
            <div className="relative shrink-0">
              {/* Rotating Multi-Color Conic Aura Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-2 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 opacity-80 blur-md"
              />

              {/* Floating Bobbing Frame: BIG Size (size-32 / size-36) */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="relative size-32 sm:size-36 rounded-full overflow-hidden border-4 border-emerald-400 bg-[#090c12] shadow-2xl flex items-center justify-center"
              >
                {/* Real photo DP of Binit */}
                <img
                  src="/binit-dp.jpg?v=2"
                  alt="Binit"
                  className="size-full object-cover scale-105"
                />
              </motion.div>

              {/* Online status indicator */}
              <span className="absolute bottom-1 right-1 flex size-4">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full size-4 bg-emerald-500 border-2 border-[#0c0f17]"></span>
              </span>
            </div>

            {/* Profile Info & Stack Badges */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Binit
                </h1>
                <Sparkles size={20} className="text-amber-400 animate-pulse" />
              </div>

              <p className="text-xs sm:text-sm font-semibold tracking-widest text-emerald-400 uppercase font-mono mt-1">
                Creator & Lead Architect
              </p>

              {/* Tech stack badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900/90 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-medium">
                  <Zap size={12} className="text-amber-400" />
                  Python 3.12
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900/90 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-medium">
                  <Cpu size={12} className="text-indigo-400" />
                  React 19 + TS
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900/90 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-medium">
                  <Search size={12} className="text-cyan-400" />
                  sys.settrace
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900/90 border border-rose-500/30 text-rose-300 font-mono text-xs font-medium">
                  <Bot size={12} className="text-rose-400" />
                  AI Explainer
                </span>
              </div>
            </div>
          </div>

          {/* Generous Spacing Between Lines: 2-3 High-Impact Sentences */}
          <div className="my-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-5 sm:p-6 shadow-inner">
            {/* Sentence 1 with generous leading */}
            <p className="text-sm sm:text-base font-medium text-zinc-100 leading-loose">
              &ldquo;Ratta maarne se DSA kabhi samajh nahi aayega — jab tak code run hote hue pointers aur memory ko live hilte nahi dekhoge, tab tak feel nahi aayegi!&rdquo;
            </p>

            {/* Sentence 2 with generous leading */}
            <p className="text-xs sm:text-sm text-zinc-300 mt-3.5 leading-loose">
              Har complex algorithm, recursion stack, aur data structure ko aasan, visual, aur real-time interactive banana hi CodeFlow ka mission hai.
            </p>

            <div className="text-xs font-mono text-emerald-400/90 mt-4 text-right font-medium">
              — Binit, while debugging sys.settrace at 3 AM
            </div>
          </div>

          {/* Clean Terminal Box: Well Spaced Lines */}
          <div className="rounded-2xl border border-zinc-800 bg-[#080a10] overflow-hidden shadow-xl">
            {/* Terminal Titlebar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#121520] border-b border-zinc-800 font-mono text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-[#ff5f56]" />
                <span className="size-3 rounded-full bg-[#ffbd2e]" />
                <span className="size-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 font-semibold">
                <Terminal size={13} className="text-emerald-400" />
                <span>binit@codeflow: ~/dev-diaries</span>
              </div>
            </div>

            {/* Terminal Body with Generous Line Heights */}
            <div className="p-4 sm:p-5 space-y-3.5 font-mono text-xs">
              {/* Entry 1 */}
              <div className="rounded-xl bg-zinc-900/60 border border-emerald-500/30 p-3.5">
                <div className="text-emerald-400 font-bold text-xs sm:text-[13px] leading-relaxed">
                  $ git commit -m &quot;execution-driven visualizer&quot;
                </div>
                <div className="text-zinc-200 text-xs sm:text-[12.5px] mt-2 pl-3 border-l-2 border-emerald-400 leading-loose">
                  DSA ke pointers aur recursion ne dimag ka dahi kiya tha... toh rone ke bajaye pura execution-driven visualizer hi khada kar diya! 🔥
                </div>
              </div>

              {/* Entry 2 */}
              <div className="rounded-xl bg-zinc-900/60 border border-amber-500/30 p-3.5">
                <div className="text-amber-400 font-bold text-xs sm:text-[13px] leading-relaxed">
                  $ run recursion_safety.py
                </div>
                <div className="text-zinc-200 text-xs sm:text-[12.5px] mt-2 pl-3 border-l-2 border-amber-400 leading-loose">
                  Zindagi me break lena aur recursion me base case lagana — dono bohot zaroori hain, warna seedha Stack Overflow! 🧠
                </div>
              </div>

              {/* Entry 3 */}
              <div className="rounded-xl bg-zinc-900/60 border border-cyan-500/30 p-3.5">
                <div className="text-cyan-400 font-bold text-xs sm:text-[13px] leading-relaxed">
                  $ vite build --status
                </div>
                <div className="text-zinc-200 text-xs sm:text-[12.5px] mt-2 pl-3 border-l-2 border-cyan-400 leading-loose">
                  Chai khatam, execution shuru. Zero warnings ke saath real-time dynamic visualizer ready hai! ☕
                </div>
              </div>
            </div>
          </div>

          {/* Quick Direct Feedback to Binit's Email */}
          <div className="mt-5 p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Mail size={16} className="text-emerald-400 shrink-0" />
              <div>
                <span className="text-zinc-200 font-semibold block">Got Feedback or Found a Bug?</span>
                <span className="text-zinc-400 text-[11px]">Direct email: <code className="text-emerald-400 font-mono">b33022659@gmail.com</code></span>
              </div>
            </div>
            {onOpenFeedback && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFeedback();
                }}
                className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
              >
                <MessageSquare size={13} />
                <span>Contact Us</span>
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Heart size={13} className="text-rose-400 fill-rose-400" />
              Made with chai, code, and dedication by Binit.
            </span>
            <span className="text-zinc-500">CodeFlow v2.0</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
