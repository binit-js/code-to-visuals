import React from 'react';
import { motion } from 'motion/react';

interface FloatingCreatorButtonProps {
  onClick: () => void;
}

export const FloatingCreatorButton: React.FC<FloatingCreatorButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="group relative flex items-center justify-center cursor-pointer outline-none focus:outline-none"
        title="About Binit — Creator & Lead Architect"
      >
        {/* Floating Frame with clean 2px brand border and neutral shadow */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative size-14 sm:size-16 rounded-full overflow-hidden border-2 border-[#0eb37c] bg-[#111513] shadow-lg flex items-center justify-center"
        >
          {/* Binit's Real Photo DP */}
          <img
            src="/binit-dp.jpg?v=2"
            alt="Binit"
            className="size-full object-cover scale-105 group-hover:scale-110 transition-transform duration-200"
          />
        </motion.div>

        {/* Status indicator */}
        <span className="absolute bottom-0 right-0 flex size-3.5">
          <span className="relative inline-flex rounded-full size-3.5 bg-[#0eb37c] border-2 border-[#111513]"></span>
        </span>
      </motion.button>
    </div>
  );
};
