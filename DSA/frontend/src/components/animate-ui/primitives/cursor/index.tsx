import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence,
  type MotionValue,
  type SpringOptions,
} from 'motion/react';

export type CursorFollowSide = 'top' | 'right' | 'bottom' | 'left';
export type CursorFollowAlign = 'start' | 'center' | 'end';

export interface CursorContextType {
  cursorX: MotionValue<number>;
  cursorY: MotionValue<number>;
  active: boolean;
  global: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  cursorRef: React.RefObject<HTMLDivElement | null>;
}

const CursorContext = createContext<CursorContextType | null>(null);

export function useCursor(): CursorContextType {
  const ctx = useContext(CursorContext);
  if (!ctx) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return ctx;
}

export interface CursorProviderProps {
  children: React.ReactNode;
  global?: boolean;
}

export function CursorProvider({ children, global = false }: CursorProviderProps) {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const [active, setActive] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cleanup: () => void = () => {};

    if (global) {
      const handlePointerMove = (e: PointerEvent) => {
        if (e.pointerType === 'touch') return;
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
        setActive(true);
      };

      const handlePointerOut = (e: PointerEvent | MouseEvent) => {
        if (e instanceof PointerEvent && e.relatedTarget === null) {
          setActive(false);
        }
      };

      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      window.addEventListener('pointerout', handlePointerOut, { passive: true });

      cleanup = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerout', handlePointerOut);
      };
    } else {
      const container = containerRef.current;
      if (!container) return;
      const parent = container.parentElement;
      if (!parent) return;

      if (getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }

      const handlePointerMove = (e: PointerEvent) => {
        if (e.pointerType === 'touch') return;
        const rect = parent.getBoundingClientRect();
        cursorX.set(e.clientX - rect.left);
        cursorY.set(e.clientY - rect.top);
        setActive(true);
      };

      const handlePointerLeave = () => {
        setActive(false);
      };

      parent.addEventListener('pointermove', handlePointerMove, { passive: true });
      parent.addEventListener('pointerleave', handlePointerLeave, { passive: true });

      cleanup = () => {
        parent.removeEventListener('pointermove', handlePointerMove);
        parent.removeEventListener('pointerleave', handlePointerLeave);
      };
    }

    return cleanup;
  }, [global, cursorX, cursorY]);

  return (
    <CursorContext.Provider
      value={{
        cursorX,
        cursorY,
        active,
        global,
        containerRef,
        cursorRef,
      }}
    >
      {children}
    </CursorContext.Provider>
  );
}

export interface CursorContainerProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function CursorContainer({ children, className = '', style }: CursorContainerProps) {
  const { containerRef, global } = useCursor();

  return (
    <div
      ref={containerRef}
      className={`cursor-container ${className}`}
      style={{
        position: global ? 'fixed' : 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface CursorProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Cursor({ children, className = '', style }: CursorProps) {
  const { cursorX, cursorY, active, cursorRef } = useCursor();

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          ref={cursorRef}
          className={`cursor-element ${className}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            x: cursorX,
            y: cursorY,
            pointerEvents: 'none',
            zIndex: 9999,
            ...style,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const DEFAULT_SPRING: SpringOptions = {
  stiffness: 450,
  damping: 35,
  mass: 0.8,
};

export interface CursorFollowProps {
  side?: CursorFollowSide;
  sideOffset?: number;
  align?: CursorFollowAlign;
  alignOffset?: number;
  transition?: SpringOptions;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function CursorFollow({
  side = 'bottom',
  sideOffset = 15,
  align = 'end',
  alignOffset = 5,
  transition = DEFAULT_SPRING,
  children,
  className = '',
  style,
}: CursorFollowProps) {
  const { cursorX, cursorY, active } = useCursor();
  const followRef = useRef<HTMLDivElement | null>(null);

  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);

  const springX = useSpring(targetX, transition);
  const springY = useSpring(targetY, transition);

  const calculateOffsets = useCallback(() => {
    const el = followRef.current;
    const width = el?.offsetWidth ?? 60;
    const height = el?.offsetHeight ?? 28;

    let offsetX = 0;
    let offsetY = 0;

    switch (side) {
      case 'top':
        offsetY = -(height + sideOffset);
        break;
      case 'bottom':
        offsetY = sideOffset + 18;
        break;
      case 'left':
        offsetX = -(width + sideOffset);
        break;
      case 'right':
        offsetX = sideOffset + 18;
        break;
    }

    switch (align) {
      case 'start':
        if (side === 'top' || side === 'bottom') offsetX = -alignOffset;
        if (side === 'left' || side === 'right') offsetY = -alignOffset;
        break;
      case 'center':
        if (side === 'top' || side === 'bottom') offsetX = -(width / 2);
        if (side === 'left' || side === 'right') offsetY = -(height / 2);
        break;
      case 'end':
        if (side === 'top' || side === 'bottom') offsetX = alignOffset + 14;
        if (side === 'left' || side === 'right') offsetY = alignOffset + 14;
        break;
    }

    return { offsetX, offsetY };
  }, [side, sideOffset, align, alignOffset]);

  const updatePosition = useCallback(() => {
    const { offsetX, offsetY } = calculateOffsets();
    targetX.set(cursorX.get() + offsetX);
    targetY.set(cursorY.get() + offsetY);
  }, [calculateOffsets, cursorX, cursorY, targetX, targetY]);

  useEffect(() => {
    updatePosition();
    const unsubX = cursorX.on('change', updatePosition);
    const unsubY = cursorY.on('change', updatePosition);

    return () => {
      unsubX();
      unsubY();
    };
  }, [cursorX, cursorY, updatePosition]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          ref={followRef}
          className={`cursor-follow-element ${className}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            x: springX,
            y: springY,
            pointerEvents: 'none',
            zIndex: 9998,
            ...style,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
