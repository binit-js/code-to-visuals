import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

export type ClickVariant = 'ripple' | 'ring' | 'crosshair' | 'burst' | 'particles';

interface Item {
  id: string;
  x: number;
  y: number;
  variant: ClickVariant;
  color: string;
  size: number;
  duration: number;
}

export interface ClickProps {
  children?: React.ReactNode;
  variant?: ClickVariant;
  color?: string;
  size?: number;
  duration?: number;
  scope?: React.RefObject<HTMLElement | null>;
  disabled?: boolean;
}

export const Click: React.FC<ClickProps> = ({
  children,
  variant = 'crosshair',
  color = '#10b981',
  size = 80,
  duration = 400,
  scope,
  disabled = false,
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const nextIdRef = useRef(0);
  const timersRef = useRef(new Set<number>());

  useEffect(() => {
    if (disabled) return;
    const target = scope?.current ?? document;
    const isDoc = target instanceof Document;
    const el: any = isDoc ? document : target;
    if (!el) return;

    function onPointerUp(e: PointerEvent) {
      if (!isDoc) {
        const rect = (el as HTMLElement).getBoundingClientRect();
        if (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        ) {
          return;
        }
      }

      const x = e.clientX;
      const y = e.clientY;
      const id = String(nextIdRef.current++);
      const item: Item = {
        id,
        x,
        y,
        variant,
        color,
        size,
        duration,
      };

      setItems((prev) => [...prev, item]);

      const timer = window.setTimeout(() => {
        timersRef.current.delete(timer);
        setItems((prev) => prev.filter((it) => it.id !== id));
      }, duration + 300);

      timersRef.current.add(timer);
    }

    el.addEventListener('pointerup', onPointerUp, { passive: true });
    return () => el.removeEventListener('pointerup', onPointerUp);
  }, [scope, variant, color, size, duration, disabled]);

  useEffect(() => {
    const pending = timersRef.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  return (
    <>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 9999999,
            }}
          >
            <AnimatePresence initial={false}>
              {items.map((it) => (
                <EffectRenderer key={it.id} item={it} />
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </>
  );
};

function EffectRenderer({ item }: { item: Item }) {
  if (item.variant === 'crosshair') return <Crosshair item={item} />;
  if (item.variant === 'ring') return <Ring item={item} />;
  if (item.variant === 'ripple') return <Ripple item={item} />;
  if (item.variant === 'burst') return <Burst item={item} />;
  if (item.variant === 'particles') return <Particles item={item} />;
  return null;
}

function Crosshair({ item }: { item: Item }) {
  const d = item.duration / 1000;

  const distanceEnd = Math.max(item.size * 0.65, 56);
  const gapStart = Math.max(item.size * 0.05, 3);
  const lenStart = Math.max(item.size * 0.26, 16);
  const lenEnd = Math.max(lenStart * 0.55, 6);
  const strokeWidth = Math.max(item.size * 0.065, 2);

  const half = distanceEnd + gapStart + lenStart;
  const box = half * 2;
  const cx = half;
  const cy = half;

  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
  ] as const;

  return (
    <motion.svg
      style={{
        position: 'fixed',
        left: item.x - half,
        top: item.y - half,
        width: box,
        height: box,
        display: 'block',
        overflow: 'visible',
        pointerEvents: 'none',
        rotate: '-25deg',
        strokeWidth,
      }}
      viewBox={`0 0 ${box} ${box}`}
    >
      {dirs.map((dir, i) => {
        const x1_0 = cx + dir.dx * gapStart;
        const y1_0 = cy + dir.dy * gapStart;
        const x2_0 = cx + dir.dx * (gapStart + lenStart);
        const y2_0 = cy + dir.dy * (gapStart + lenStart);

        const x1_1 = cx + dir.dx * distanceEnd;
        const y1_1 = cy + dir.dy * distanceEnd;
        const x2_1 = cx + dir.dx * (distanceEnd + lenEnd);
        const y2_1 = cy + dir.dy * (distanceEnd + lenEnd);

        return (
          <motion.line
            key={i}
            x1={x1_0}
            y1={y1_0}
            x2={x2_0}
            y2={y2_0}
            initial={{ pathLength: 1, scale: 1, opacity: 1 }}
            animate={{
              x1: x1_1,
              y1: y1_1,
              x2: x2_1,
              y2: y2_1,
              pathLength: 0,
              scale: 0,
              opacity: [1, 0.8, 0],
            }}
            transition={{ duration: d, ease: [0, 0, 0.7, 1] }}
            stroke={item.color}
            strokeLinecap="round"
          />
        );
      })}
    </motion.svg>
  );
}

function Ring({ item }: { item: Item }) {
  const d = item.duration / 1000;
  const rEnd = Math.max(item.size / 1.5, 50);
  const rStart = Math.max(Math.floor(rEnd * 0.2), 12);
  const strokeStart = Math.max(Math.floor(rEnd * 0.05), 2.5);

  return (
    <motion.svg
      style={{
        position: 'fixed',
        left: item.x - rEnd / 2,
        top: item.y - rEnd / 2,
        width: rEnd,
        height: rEnd,
        display: 'block',
        overflow: 'visible',
        pointerEvents: 'none',
      }}
      viewBox={`0 0 ${rEnd} ${rEnd}`}
    >
      <motion.circle
        cx={rEnd / 2}
        cy={rEnd / 2}
        fill="none"
        stroke={item.color}
        initial={{ r: rStart, strokeWidth: strokeStart, opacity: 1 }}
        animate={{ r: rEnd, strokeWidth: 0, opacity: 0 }}
        transition={{ duration: d, ease: 'easeOut' }}
        strokeLinecap="round"
      />
    </motion.svg>
  );
}

function Ripple({ item }: { item: Item }) {
  const r = item.size;
  const d = item.duration / 1000;

  return (
    <motion.div
      initial={{ opacity: 0.8, scale: 0.2 }}
      animate={{ opacity: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: d, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        left: item.x - r / 2,
        top: item.y - r / 2,
        width: r,
        height: r,
        borderRadius: '9999px',
        background: item.color,
        boxShadow: `0 0 0 2px ${item.color} inset`,
        pointerEvents: 'none',
      }}
    />
  );
}

function Burst({ item }: { item: Item }) {
  const d = item.duration / 1000;
  const rStart = Math.max(item.size * 0.4, 36);
  const rEnd = Math.max(item.size * 0.65, 56);
  const segCount = 4;
  const lenStart = Math.max(item.size * 0.2, 14);
  const lenEnd = Math.max(lenStart * 0.5, 6);
  const strokeWidth = Math.max(item.size * 0.05, 1.5);
  const half = rEnd + lenStart;
  const box = half * 2;
  const cx = half;
  const cy = half;

  return (
    <motion.svg
      style={{
        position: 'fixed',
        left: item.x - half,
        top: item.y - half,
        width: box,
        height: box,
        overflow: 'visible',
        pointerEvents: 'none',
        strokeWidth,
      }}
      viewBox={`0 0 ${box} ${box}`}
    >
      {Array.from({ length: segCount }).map((_, i) => {
        const th = (Math.PI / 2) * i;
        const ux = Math.cos(th);
        const uy = Math.sin(th);
        return (
          <motion.line
            key={i}
            x1={cx + ux * rStart}
            y1={cy + uy * rStart}
            x2={cx + ux * (rStart + lenStart)}
            y2={cy + uy * (rStart + lenStart)}
            initial={{ opacity: 1, scale: 1 }}
            animate={{
              x1: cx + ux * rEnd,
              y1: cy + uy * rEnd,
              x2: cx + ux * (rEnd + lenEnd),
              y2: cy + uy * (rEnd + lenEnd),
              opacity: [1, 0.8, 0],
              scale: [1, 1, 0],
            }}
            transition={{ duration: d, ease: 'easeInOut' }}
            stroke={item.color}
            strokeLinecap="round"
          />
        );
      })}
    </motion.svg>
  );
}

function Particles({ item }: { item: Item }) {
  const d = item.duration / 1000;
  const count = 6;
  const radius = item.size * 0.35;
  const r0 = Math.max(item.size * 0.025, 2.5);
  const half = radius + r0 * 2;
  const box = half * 2;
  const cx = half;
  const cy = half;

  return (
    <motion.svg
      style={{
        position: 'fixed',
        left: item.x - half,
        top: item.y - half,
        width: box,
        height: box,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
      viewBox={`0 0 ${box} ${box}`}
    >
      {Array.from({ length: count }).map((_, i) => {
        const angle = (2 * Math.PI * i) / count;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r={r0}
            fill={item.color}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              cx: cx + x,
              cy: cy + y,
              scale: [0, 1.2, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: d, delay: i * (d * 0.08), ease: 'easeOut' }}
          />
        );
      })}
    </motion.svg>
  );
}

export default Click;
