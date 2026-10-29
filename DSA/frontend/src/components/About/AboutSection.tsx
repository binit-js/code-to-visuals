import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Terminal,
  Mail,
  MessageSquare,
  Heart,
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
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl my-auto rounded-2xl border border-[#222b26] bg-[#0a0d0b] p-6 sm:p-8 shadow-2xl text-[#c5d2cb] overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-20 p-2 rounded-lg bg-[#111513] hover:bg-[#171d19] text-[#95a49c] hover:text-white transition-colors border border-[#222b26] shadow-sm cursor-pointer"
            title="Close"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>

          {/* Top Profile Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-[#222b26]">
            {/* Real photo DP of Binit */}
            <div className="relative shrink-0">
              <div className="relative size-28 sm:size-32 rounded-full overflow-hidden border-2 border-[#0eb37c] bg-[#111513] shadow-lg flex items-center justify-center">
                <img
                  src="/binit-dp.jpg?v=2"
                  alt="Binit"
                  className="size-full object-cover scale-105"
                />
              </div>

              {/* Status indicator */}
              <span className="absolute bottom-1 right-1 flex size-4">
                <span className="relative inline-flex rounded-full size-4 bg-[#0eb37c] border-2 border-[#0a0d0b]"></span>
              </span>
            </div>

            {/* Profile Info & Stack Badges */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-heading">
                Binit
              </h1>

              <p className="text-xs sm:text-sm font-semibold tracking-wider text-[#0eb37c] uppercase font-mono mt-1">
                Creator & Lead Architect
              </p>

              {/* Tech stack badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3.5">
                <span className="px-2.5 py-1 rounded-md bg-[#111513] border border-[#222b26] text-[#c5d2cb] font-mono text-xs">
                  Python 3.12
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#111513] border border-[#222b26] text-[#c5d2cb] font-mono text-xs">
                  React 19 + TS
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#111513] border border-[#222b26] text-[#c5d2cb] font-mono text-xs">
                  sys.settrace
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#111513] border border-[#222b26] text-[#c5d2cb] font-mono text-xs">
                  AI Explainer
                </span>
              </div>
            </div>
          </div>

          {/* High-Impact Statement */}
          <div className="my-6 rounded-xl border border-[#222b26] bg-[#111513] p-5 sm:p-6">
            <p className="text-sm sm:text-base font-medium text-[#f0f4f2] leading-relaxed">
              &ldquo;Ratta maarne se DSA kabhi samajh nahi aayega — jab tak code run hote hue pointers aur memory ko live hilte nahi dekhoge, tab tak feel nahi aayegi!&rdquo;
            </p>

            <p className="text-xs sm:text-sm text-[#95a49c] mt-3 leading-relaxed">
              Har complex algorithm, recursion stack, aur data structure ko aasan, visual, aur real-time interactive banana hi CodeFlow ka mission hai.
            </p>

            <div className="text-xs font-mono text-[#0eb37c] mt-4 text-right font-medium">
              — Binit, while debugging sys.settrace at 3 AM
            </div>
          </div>

          {/* Clean Terminal Box */}
          <div className="rounded-xl border border-[#222b26] bg-[#0a0d0b] overflow-hidden shadow-lg">
            {/* Terminal Titlebar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#111513] border-b border-[#222b26] font-mono text-xs text-[#95a49c]">
              <div className="flex items-center gap-2">
                <Terminal size={13} className="text-[#0eb37c]" />
                <span className="font-medium text-[#c5d2cb]">binit@codeflow: ~/dev-diaries</span>
              </div>
              <span className="text-[11px] text-[#728279]">bash</span>
            </div>

            {/* Terminal Body */}
            <div className="p-4 sm:p-5 space-y-3 font-mono text-xs">
              <div className="rounded-lg bg-[#111513] border border-[#222b26] p-3.5">
                <div className="text-[#0eb37c] font-semibold text-xs leading-relaxed">
                  $ git commit -m &quot;execution-driven visualizer&quot;
                </div>
                <div className="text-[#c5d2cb] text-xs mt-2 pl-3 border-l-2 border-[#0eb37c] leading-relaxed">
                  DSA ke pointers aur recursion ne dimag ka dahi kiya tha... toh rone ke bajaye pura execution-driven visualizer hi khada kar diya!
                </div>
              </div>

              <div className="rounded-lg bg-[#111513] border border-[#222b26] p-3.5">
                <div className="text-[#e69500] font-semibold text-xs leading-relaxed">
                  $ run recursion_safety.py
                </div>
                <div className="text-[#c5d2cb] text-xs mt-2 pl-3 border-l-2 border-[#e69500] leading-relaxed">
                  Zindagi me break lena aur recursion me base case lagana — dono bohot zaroori hain, warna seedha Stack Overflow!
                </div>
              </div>

              <div className="rounded-lg bg-[#111513] border border-[#222b26] p-3.5">
                <div className="text-[#07a6c2] font-semibold text-xs leading-relaxed">
                  $ vite build --status
                </div>
                <div className="text-[#c5d2cb] text-xs mt-2 pl-3 border-l-2 border-[#07a6c2] leading-relaxed">
                  Chai khatam, execution shuru. Zero warnings ke saath real-time dynamic visualizer ready hai!
                </div>
              </div>
            </div>
          </div>

          {/* Quick Direct Feedback to Binit's Email */}
          <div className="mt-5 p-3.5 rounded-xl bg-[#111513] border border-[#222b26] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Mail size={16} className="text-[#0eb37c] shrink-0" />
              <div>
                <span className="text-[#f0f4f2] font-semibold block">Got Feedback or Found a Bug?</span>
                <span className="text-[#95a49c] text-[11px]">Direct email: <code className="text-[#0eb37c] font-mono">b33022659@gmail.com</code></span>
              </div>
            </div>
            {onOpenFeedback && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFeedback();
                }}
                className="px-4 py-2 rounded-lg bg-[#0eb37c] text-black hover:bg-[#12c286] font-semibold text-xs shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
              >
                <MessageSquare size={13} />
                <span>Contact Us</span>
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-[#222b26] flex items-center justify-between text-xs text-[#95a49c] font-mono">
            <span className="flex items-center gap-1.5 text-[#95a49c]">
              <Heart size={13} className="text-[#ea3954] fill-[#ea3954]" />
              Made with chai, code, and dedication by Binit.
            </span>
            <span className="text-[#728279]">CodeFlow v2.0</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
