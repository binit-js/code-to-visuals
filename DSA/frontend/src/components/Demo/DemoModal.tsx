import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  X,
  ChevronRight,
  ChevronLeft,
  Video,
  Code2,
  Cpu,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset?: (presetId: string) => void;
}

interface Chapter {
  id: number;
  badge: string;
  title: string;
  summary: string;
  duration: number; // in seconds
}

const CHAPTERS: Chapter[] = [
  {
    id: 0,
    badge: '1. Code & Presets',
    title: 'Choose a Preset or Write Python Code',
    summary: 'Pick from ready-made DSA algorithms (Linked Lists, Binary Trees, Stacks, Queues, Graphs) or type your own Python logic in the Monaco editor.',
    duration: 7,
  },
  {
    id: 1,
    badge: '2. Isolated Sandbox',
    title: 'Click Run Code (or press Ctrl+Enter)',
    summary: 'Your code executes safely inside an isolated Python 3.12 sandbox with automated AST instrumentation, timeout protection, and step capture.',
    duration: 6,
  },
  {
    id: 2,
    badge: '3. Dynamic Visuals',
    title: 'Real-Time Dynamic Data Structure Rendering',
    summary: 'Watch your actual memory objects, pointers, and reference chains come to life with animated nodes and pointer arrows—no hardcoded templates!',
    duration: 7,
  },
  {
    id: 3,
    badge: '4. Simple Explanations',
    title: 'Beginner-Friendly 3-Part Explanations',
    summary: 'For every execution step, see What is happening, Why it is happening, and What changed visually—in simple, natural English without jargon.',
    duration: 7,
  },
  {
    id: 4,
    badge: '5. Time Travel',
    title: 'Step Forward, Backward & Replay Timeline',
    summary: 'Scrub through time, pause at any line, step back to see previous states, or adjust playback speed from 0.5x up to 5x.',
    duration: 6,
  },
];

export const DEMO_SEEN_STORAGE_KEY = 'codeflow_has_seen_demo_v1';

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose, onSelectPreset }) => {
  const [currentChapter, setCurrentChapter] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0); // 0 to 100 within current chapter
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);

  const timerRef = useRef<any>(null);

  // Reset chapter and playback when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentChapter(0);
      setProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  // Video playback loop
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const currentDurationMs = CHAPTERS[currentChapter].duration * 1000;
    const intervalMs = 100;
    const increment = (intervalMs / currentDurationMs) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next chapter or loop
          setCurrentChapter((ch) => {
            if (ch < CHAPTERS.length - 1) {
              return ch + 1;
            } else {
              // At end of demo: pause on last chapter
              setIsPlaying(false);
              return ch;
            }
          });
          return 0;
        }
        return prev + increment;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPlaying, currentChapter]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(DEMO_SEEN_STORAGE_KEY, 'true');
      } catch (e) {
        // ignore
      }
    }
    onClose();
  };

  const handleSelectChapter = (idx: number) => {
    setCurrentChapter(idx);
    setProgress(0);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentChapter((prev) => Math.max(0, prev - 1));
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentChapter((prev) => Math.min(CHAPTERS.length - 1, prev + 1));
    setProgress(0);
  };

  const activeChap = CHAPTERS[currentChapter];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 flex justify-center items-start sm:items-center"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-6xl my-auto rounded-2xl border border-[#222b26] bg-[#0a0d0b] shadow-2xl text-[#c5d2cb] overflow-hidden flex flex-col"
        >
          {/* Modal Header */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#222b26]">
            <div className="flex items-center gap-3">
              <Video size={22} className="text-[#0eb37c] shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight font-heading">
                    Interactive Walkthrough & Demo
                  </h2>
                  <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded border border-[#222b26] text-[#95a49c]">
                    60 SEC GUIDE • FULLSCREEN HD
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#95a49c]">
                  Quick visual overview of writing, executing, and exploring DSA algorithms
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-lg bg-[#111513] hover:bg-[#171d19] text-[#95a49c] hover:text-white transition-colors border border-[#222b26] shadow-sm cursor-pointer"
              title="Close Demo"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Interactive Simulated Video Player Screen */}
          <div className="relative z-10 p-5 sm:p-6 pb-2">
            <div className="relative w-full rounded-xl border border-[#222b26] bg-[#050706] shadow-lg overflow-hidden">
              {/* Top Video Player Bar */}
              <div className="flex items-center justify-between px-5 py-3 bg-[#111513] border-b border-[#222b26] text-xs">
                <span className="font-mono text-[#c5d2cb] font-medium">
                  CodeFlow Demo Player — Chapter {currentChapter + 1} of {CHAPTERS.length}
                </span>

                <div className="flex items-center gap-2 text-[#95a49c] font-mono text-xs">
                  <span className="size-2 rounded-full bg-[#0eb37c]" />
                  <span>Interactive HD Simulation</span>
                </div>
              </div>

              {/* Video Screen Content */}
              <div className="relative h-[480px] sm:h-[530px] md:h-[560px] w-full p-6 sm:p-8 flex flex-col justify-between overflow-hidden bg-[#050706]">
                {/* Background Subtle Grid */}
                <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                {/* Chapter-Specific Animated Screen Content */}
                <div className="relative z-10 flex-1 flex flex-col justify-center">
                  {/* CHAPTER 0: CODE EDITOR & PRESETS */}
                  {currentChapter === 0 && (
                    <motion.div
                      key="ch0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col md:flex-row items-center gap-6"
                    >
                      <div className="flex-1 w-full bg-zinc-950/95 border border-zinc-800 rounded-2xl p-5 font-mono text-xs sm:text-sm text-zinc-300 shadow-xl">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80 text-xs text-zinc-400">
                          <span className="text-emerald-400 flex items-center gap-2 font-semibold">
                            <Code2 size={16} /> linked_list.py
                          </span>
                          <span className="bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/30 text-xs font-semibold">
                            Preset: Linked List Insertion
                          </span>
                        </div>
                        <div className="space-y-1.5 leading-relaxed">
                          <div><span className="text-zinc-600 mr-2">1</span>  <span className="text-purple-400">class</span> <span className="text-yellow-300">Node</span>:</div>
                          <div><span className="text-zinc-600 mr-2">2</span>      <span className="text-purple-400">def</span> <span className="text-blue-400">__init__</span>(self, val):</div>
                          <div><span className="text-zinc-600 mr-2">3</span>          self.val = val; self.next = <span className="text-amber-400">None</span></div>
                          <div><span className="text-zinc-600 mr-2">4</span>  head = <span className="text-yellow-300">Node</span>(<span className="text-emerald-300">10</span>)</div>
                          <div className="bg-emerald-500/10 -mx-5 px-5 py-0.5 border-l-4 border-emerald-400 flex items-center justify-between">
                            <span><span className="text-zinc-600 mr-2">5</span>  head.next = <span className="text-yellow-300">Node</span>(<span className="text-emerald-300">20</span>)</span>
                            <span className="text-xs text-emerald-400 font-sans animate-pulse font-medium">← Active typing line</span>
                          </div>
                          <div><span className="text-zinc-600 mr-2">6</span>  new_node = <span className="text-yellow-300">Node</span>(<span className="text-amber-300">25</span>)</div>
                          <div><span className="text-zinc-600 mr-2">7</span>  new_node.next = head.next; head.next = new_node</div>
                        </div>
                      </div>

                      <div className="w-full md:w-72 flex flex-col gap-3">
                        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700/70 text-xs sm:text-sm shadow-md">
                          <span className="text-emerald-400 font-bold block mb-1.5 text-sm sm:text-base">⚡ Instant Presets</span>
                          <span className="text-zinc-300 leading-relaxed block">
                            Choose from Binary Trees, Recursion, Bubble Sort, Stacks, or Graphs directly from the top Presets dropdown.
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700/70 text-xs sm:text-sm shadow-md">
                          <span className="text-cyan-400 font-bold block mb-1.5 text-sm sm:text-base">✍️ Full Editor Freedom</span>
                          <span className="text-zinc-300 leading-relaxed block">
                            Type any custom Python code with classes, loops, and pointers with full Monaco IntelliSense.
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* CHAPTER 1: RUN CODE SANDBOX */}
                  {currentChapter === 1 && (
                    <motion.div
                      key="ch1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center gap-6 text-center"
                    >
                      {/* Animated Run Button Simulation */}
                      <div className="relative group">
                        <motion.div
                          animate={{ scale: [1, 1.06, 1], boxShadow: ['0 0 0 rgba(16,185,129,0)', '0 0 35px rgba(16,185,129,0.5)', '0 0 0 rgba(16,185,129,0)'] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="px-8 py-4 rounded-2xl bg-emerald-500 text-zinc-950 font-extrabold text-base sm:text-lg flex items-center gap-3 shadow-xl"
                        >
                          <Play size={20} fill="currentColor" />
                          <span>Run Code & Visualize</span>
                          <span className="text-xs font-mono bg-emerald-600/70 text-emerald-950 px-2 py-0.5 rounded ml-2">
                            Ctrl+Enter
                          </span>
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-3 text-left">
                        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-emerald-500/40 text-xs sm:text-sm shadow-md">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1.5 text-sm">
                            <ShieldCheck size={17} /> Subprocess Sandbox
                          </div>
                          <span className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed block">
                            Protected with strict memory caps, 5s timeout, and safe system limits.
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-cyan-500/40 text-xs sm:text-sm shadow-md">
                          <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1.5 text-sm">
                            <Cpu size={17} /> AST Instrumentation
                          </div>
                          <span className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed block">
                            Captures every line execution, variable mutation, and pointer change.
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-purple-500/40 text-xs sm:text-sm shadow-md">
                          <div className="flex items-center gap-2 text-purple-400 font-bold mb-1.5 text-sm">
                            <CheckCircle2 size={17} /> Zero Templates
                          </div>
                          <span className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed block">
                            Derives visuals strictly from your program's real memory addresses.
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* CHAPTER 2: DYNAMIC REAL-TIME VISUALS */}
                  {currentChapter === 2 && (
                    <motion.div
                      key="ch2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center gap-6"
                    >
                      <div className="text-sm font-mono text-zinc-300 font-semibold bg-zinc-900/80 px-4 py-1 rounded-full border border-zinc-800">
                        Live Memory Graph • Step 4 of 12 (Linked List Dynamic Insertion)
                      </div>

                      {/* Animated Linked List Graphic (BIGGER NODES & ARROWS) */}
                      <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                        {/* Head Pointer */}
                        <div className="flex flex-col items-center">
                          <span className="text-xs sm:text-sm font-mono text-emerald-400 font-extrabold mb-1">head</span>
                          <div className="text-emerald-400 text-2xl font-bold">↓</div>
                        </div>

                        {/* Node 10 */}
                        <div className="flex items-center gap-3">
                          <div className="px-5 py-3.5 rounded-xl bg-[#111513] border-2 border-[#0eb37c] text-white font-mono font-bold text-base sm:text-lg shadow-sm min-w-[75px] text-center">
                            <span className="text-[#95a49c] text-[11px] block font-sans">val</span>10
                          </div>
                          <span className="text-[#0eb37c] font-extrabold text-2xl">→</span>
                        </div>

                        {/* Node 20 */}
                        <div className="flex items-center gap-3">
                          <div className="px-5 py-3.5 rounded-xl bg-[#111513] border-2 border-[#0eb37c] text-white font-mono font-bold text-base sm:text-lg shadow-sm min-w-[75px] text-center">
                            <span className="text-[#95a49c] text-[11px] block font-sans">val</span>20
                          </div>
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            className="font-extrabold text-2xl sm:text-3xl text-[#0eb37c]"
                          >
                            →
                          </motion.span>
                        </div>

                        {/* Animated Inserting Node 25 */}
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                          className="flex items-center gap-3"
                        >
                          <div className="px-5 py-3.5 rounded-xl bg-[#171d19] border-2 border-[#e69500] text-amber-200 font-mono font-bold text-base sm:text-lg shadow-sm min-w-[85px] text-center">
                            <span className="text-[#e69500] text-[11px] block font-sans font-bold">new_node</span>25
                          </div>
                          <span className="text-[#e69500] font-extrabold text-2xl">→</span>
                        </motion.div>

                        {/* Node 30 */}
                        <div className="flex items-center gap-3">
                          <div className="px-5 py-3.5 rounded-xl bg-[#111513] border-2 border-[#222b26] text-[#c5d2cb] font-mono font-bold text-base sm:text-lg min-w-[75px] text-center">
                            <span className="text-[#728279] text-[11px] block font-sans">val</span>30
                          </div>
                          <span className="text-[#728279] text-base font-mono">→ None</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-xs sm:text-sm font-mono text-[#c5d2cb] mt-3 bg-[#111513] px-6 py-2 rounded-full border border-[#222b26] shadow-sm">
                        <span className="text-[#0eb37c] font-semibold">● Active Pointer Linked</span>
                        <span className="text-[#e69500] font-semibold">● Node 25 Inserted</span>
                        <span className="text-[#95a49c]">● Live Memory ID #44029</span>
                      </div>
                    </motion.div>
                  )}

                  {/* CHAPTER 3: SIMPLE 3-PART EXPLANATIONS */}
                  {currentChapter === 3 && (
                    <motion.div
                      key="ch3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="w-full max-w-3xl mx-auto space-y-3.5 text-sm sm:text-base font-sans"
                    >
                      {/* What is happening */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-blue-950/40 border border-blue-500/40 flex items-start gap-4 shadow-md">
                        <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 font-mono font-bold text-xs shrink-0 mt-0.5">
                          1. WHAT IS HAPPENING?
                        </span>
                        <p className="text-zinc-100 leading-relaxed text-sm sm:text-base">
                          We are connecting our new node with value <strong className="text-white font-bold">25</strong> directly into the linked list chain between 20 and 30.
                        </p>
                      </div>

                      {/* Why is it happening */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-4 shadow-md">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs shrink-0 mt-0.5">
                          2. WHY IS IT HAPPENING?
                        </span>
                        <p className="text-zinc-100 leading-relaxed text-sm sm:text-base">
                          Line 14 executed <code className="text-emerald-300 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded">curr.next = new_node</code>, which reassigns the pointer of node 20 to target the newly allocated node.
                        </p>
                      </div>

                      {/* What changed visually */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-4 shadow-md">
                        <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-xs shrink-0 mt-0.5">
                          3. WHAT CHANGED?
                        </span>
                        <p className="text-zinc-100 leading-relaxed text-sm sm:text-base">
                          The pointer arrow from 20 was disconnected from 30 and redirected to point directly to node 25.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* CHAPTER 4: TIMELINE CONTROLS & TIME TRAVEL */}
                  {currentChapter === 4 && (
                    <motion.div
                      key="ch4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center gap-6 text-center max-w-2xl mx-auto"
                    >
                      <div className="w-full bg-zinc-900/95 border border-zinc-700/80 rounded-2xl p-6 shadow-2xl">
                        {/* Scrubber simulation */}
                        <div className="flex items-center justify-between text-sm font-mono text-zinc-300 mb-3">
                          <span className="text-emerald-400 font-bold text-base">Step 14 of 28</span>
                          <span>Execution Time: 00:02.40</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-3 rounded-full bg-[#171d19] overflow-hidden mb-5">
                          <motion.div
                            animate={{ width: ['20%', '50%', '75%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="h-full bg-[#0eb37c]"
                          />
                        </div>

                        {/* Playback Controls */}
                        <div className="flex items-center justify-center gap-3 sm:gap-4">
                          <button className="px-3.5 py-2 rounded-lg bg-[#111513] border border-[#222b26] text-[#c5d2cb] hover:text-white text-xs sm:text-sm font-medium">
                            |◀ Start
                          </button>
                          <button className="px-3.5 py-2 rounded-lg bg-[#111513] border border-[#222b26] text-[#c5d2cb] hover:text-white text-xs sm:text-sm font-medium">
                            ◀ Prev
                          </button>
                          <button className="px-6 py-2.5 rounded-lg bg-[#0eb37c] text-black font-semibold text-sm flex items-center gap-2 shadow-sm">
                            <Pause size={15} fill="currentColor" /> Pause
                          </button>
                          <button className="px-3.5 py-2 rounded-lg bg-[#111513] border border-[#222b26] text-[#c5d2cb] hover:text-white text-xs sm:text-sm font-medium">
                            Next ▶
                          </button>
                          <button className="px-3.5 py-2 rounded-lg bg-[#111513] border border-[#222b26] text-[#c5d2cb] hover:text-white text-xs sm:text-sm font-medium">
                            End ▶|
                          </button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl">
                        Drag the scrubber to inspect past execution states, re-run tricky loops, or change playback speed from <strong className="text-white">0.5x</strong> (slow motion) to <strong className="text-white">5x</strong> (turbo).
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Video Player Scrubber & Mini Transport */}
                <div className="relative z-10 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying((p) => !p)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                      title={isPlaying ? 'Pause Demo' : 'Play Demo'}
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>

                    <button
                      onClick={handlePrev}
                      disabled={currentChapter === 0}
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30"
                      title="Previous Chapter"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    <button
                      onClick={handleNext}
                      disabled={currentChapter === CHAPTERS.length - 1}
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30"
                      title="Next Chapter"
                    >
                      <ChevronRight size={14} />
                    </button>

                    <span className="text-zinc-400 font-mono text-[11px]">
                      {activeChap.badge}
                    </span>
                  </div>

                  {/* Chapter Progress Gauge */}
                  <div className="flex items-center gap-2">
                    <div className="w-24 sm:w-36 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chapter Navigation Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3.5">
              {CHAPTERS.map((chap, idx) => {
                const isActive = idx === currentChapter;
                return (
                  <button
                    key={chap.id}
                    onClick={() => handleSelectChapter(idx)}
                    className={`flex flex-col text-left p-2.5 rounded-lg border transition-colors text-xs cursor-pointer ${
                      isActive
                        ? 'bg-[#171d19] border-[#0eb37c] text-white shadow-sm'
                        : 'bg-[#111513] border-[#222b26] hover:bg-[#171d19] text-[#95a49c]'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        isActive ? 'text-[#0eb37c]' : 'text-[#728279]'
                      }`}
                    >
                      0{idx + 1}
                    </span>
                    <span
                      className={`font-semibold line-clamp-1 mt-0.5 ${
                        isActive ? 'text-white' : 'text-[#c5d2cb]'
                      }`}
                    >
                      {chap.badge.split('. ')[1] || chap.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer with One-Time Choice & Action CTAs */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-[#222b26] bg-[#0a0d0b] text-xs">
            {/* Don't show again checkbox */}
            <label className="flex items-center gap-2 text-[#95a49c] hover:text-[#c5d2cb] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-[#222b26] bg-[#111513] text-[#0eb37c] focus:ring-0"
              />
              <span>Don't show this walkthrough automatically on next visit</span>
            </label>

            {/* Buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {onSelectPreset && (
                <button
                  onClick={() => {
                    handleClose();
                    onSelectPreset('linked-list-insertion');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#111513] hover:bg-[#171d19] text-[#c5d2cb] font-medium border border-[#222b26] transition-colors text-xs cursor-pointer"
                >
                  Try Linked List Preset
                </button>
              )}

              <button
                onClick={handleClose}
                className="px-5 py-2 rounded-lg bg-[#0eb37c] hover:bg-[#12c286] text-black font-semibold shadow-sm transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <span>Start Exploring</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
