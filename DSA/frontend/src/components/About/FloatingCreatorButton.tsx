import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface FloatingCreatorButtonProps {
  onClick: () => void;
}

export const FloatingCreatorButton: React.FC<FloatingCreatorButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="group relative flex items-center justify-center cursor-pointer outline-none focus:outline-none"
        title="About Binit — Creator & Lead Architect"
      >
        {/* Animated Rotating Conic Halo */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-300 to-cyan-400 opacity-80 blur-[6px] group-hover:opacity-100 transition-opacity"
        />

        {/* Floating Bobbing Frame */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative size-14 sm:size-16 rounded-full overflow-hidden border-[2.5px] border-emerald-400 bg-[#0c0f17] shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center justify-center"
        >
          {/* Binit's Real Photo DP */}
          <img
            src="/binit-dp.jpg?v=2"
            alt="Binit"
            className="size-full object-cover scale-105 group-hover:scale-115 transition-transform duration-300"
          />

          {/* Sparkle icon badge in corner */}
          <div className="absolute top-1 right-1 p-0.5 rounded-full bg-zinc-950/80 border border-emerald-500/60 shadow">
            <Sparkles size={10} className="text-amber-400 animate-pulse" />
          </div>
        </motion.div>

        {/* Pulsing online status indicator */}
        <span className="absolute bottom-0 right-0 flex size-3.5">
          <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald-400 opacity-80"></span>
          <span className="relative inline-flex rounded-full size-3.5 bg-emerald-500 border-2 border-[#0c0f17]"></span>
        </span>
      </motion.button>
    </div>
  );
};
