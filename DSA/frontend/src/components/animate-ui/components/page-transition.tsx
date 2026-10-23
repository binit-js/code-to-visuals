import React, { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export type PageTransitionEffect =
  | 'fade'
  | 'slide'
  | 'push'
  | 'zoom'
  | 'iris'
  | 'wipe'
  | 'bands'
  | 'stack'
  | 'flow'
  | 'chop'
  | 'random';

export const PAGE_TRANSITION_EFFECTS: PageTransitionEffect[] = [
  'fade',
  'slide',
  'push',
  'zoom',
  'iris',
  'wipe',
  'bands',
  'stack',
  'flow',
  'chop',
  'random',
];

export interface PageTransitionProps {
  effect?: PageTransitionEffect;
  pageKey?: React.Key;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export interface PageTransitionSharedProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const easeOut = [0.16, 1, 0.3, 1] as const;
const easeLeave = [0.7, 0, 0.84, 0] as const;
const easeInOut = [0.25, 1, 0.5, 1] as const;

// Effect definitions for Motion animations
const getVariants = (effect: PageTransitionEffect, direction: number) => {
  const isBack = direction < 0;

  switch (effect) {
    case 'fade':
      return {
        initial: { opacity: 0, filter: 'blur(4px)' },
        animate: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.35, ease: easeOut } },
        exit: { opacity: 0, filter: 'blur(4px)', transition: { duration: 0.2, ease: easeLeave } },
      };

    case 'slide':
      return {
        initial: { opacity: 0, x: isBack ? -60 : 60 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.38, ease: easeOut } },
        exit: { opacity: 0, x: isBack ? 60 : -60, transition: { duration: 0.22, ease: easeLeave } },
      };

    case 'push':
      return {
        initial: { x: isBack ? '-100%' : '100%' },
        animate: { x: '0%', transition: { duration: 0.45, ease: easeInOut } },
        exit: { x: isBack ? '100%' : '-100%', transition: { duration: 0.45, ease: easeInOut } },
      };

    case 'zoom':
      return {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: easeOut } },
        exit: { opacity: 0, scale: 1.06, transition: { duration: 0.22, ease: easeLeave } },
      };

    case 'iris':
      return {
        initial: { clipPath: 'circle(0% at 50% 50%)' },
        animate: { clipPath: 'circle(150% at 50% 50%)', transition: { duration: 0.55, ease: easeOut } },
        exit: { opacity: 0.6, transition: { duration: 0.3 } },
      };

    case 'wipe':
      return {
        initial: { clipPath: isBack ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' },
        animate: { clipPath: 'inset(0 0% 0 0)', transition: { duration: 0.45, ease: easeInOut } },
        exit: { clipPath: isBack ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)', transition: { duration: 0.35 } },
      };

    case 'bands':
      return {
        initial: { opacity: 0, y: isBack ? -30 : 30, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: easeOut } },
        exit: { opacity: 0, y: isBack ? 30 : -30, transition: { duration: 0.25 } },
      };

    case 'stack':
      return {
        initial: { opacity: 0, y: 40, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.42, ease: easeOut } },
        exit: { opacity: 0, y: -20, scale: 1.04, transition: { duration: 0.24 } },
      };

    case 'flow':
      return {
        initial: { opacity: 0, x: isBack ? -40 : 40, skewX: isBack ? 3 : -3 },
        animate: { opacity: 1, x: 0, skewX: 0, transition: { duration: 0.42, ease: easeOut } },
        exit: { opacity: 0, x: isBack ? 40 : -40, skewX: isBack ? -3 : 3, transition: { duration: 0.25 } },
      };

    case 'chop':
      return {
        initial: { opacity: 0, rotate: isBack ? -4 : 4, scale: 0.95 },
        animate: { opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.4, ease: easeOut } },
        exit: { opacity: 0, rotate: isBack ? 4 : -4, scale: 0.95, transition: { duration: 0.22 } },
      };

    default:
      return {
        initial: { opacity: 0, x: isBack ? -50 : 50 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: easeOut } },
        exit: { opacity: 0, x: isBack ? 50 : -50, transition: { duration: 0.2 } },
      };
  }
};

export const PageTransition: React.FC<PageTransitionProps> = ({
  effect = 'slide',
  pageKey,
  children,
  className = '',
  style,
}) => {
  const prevKeyRef = useRef<React.Key | undefined>(pageKey);
  const [direction, setDirection] = useState<number>(1);
  const activeEffectRef = useRef<PageTransitionEffect>(effect);

  if (effect === 'random') {
    const list = PAGE_TRANSITION_EFFECTS.filter((e) => e !== 'random');
    activeEffectRef.current = list[Math.floor(Math.random() * list.length)];
  } else {
    activeEffectRef.current = effect;
  }

  useEffect(() => {
    if (pageKey !== undefined && prevKeyRef.current !== undefined) {
      if (typeof pageKey === 'number' && typeof prevKeyRef.current === 'number') {
        setDirection(pageKey >= prevKeyRef.current ? 1 : -1);
      } else {
        setDirection(1);
      }
    }
    prevKeyRef.current = pageKey;
  }, [pageKey]);

  const variants = getVariants(activeEffectRef.current, direction);

  return (
    <div
      className={`page-transition-wrapper ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={pageKey ?? 'page-transition-content'}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          style={{ width: '100%', height: '100%' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const PageTransitionShared: React.FC<PageTransitionSharedProps> = ({
  name,
  className = '',
  style,
  children,
}) => {
  return (
    <motion.div
      layoutId={name}
      transition={{ duration: 0.45, ease: easeInOut }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};
