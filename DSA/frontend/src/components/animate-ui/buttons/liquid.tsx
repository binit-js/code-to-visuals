import * as React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

export interface LiquidButtonProps extends HTMLMotionProps<'button'> {
  delay?: string;
  fillHeight?: string;
  hoverScale?: number;
  tapScale?: number;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
  delay = '0.3s',
  fillHeight = '3px',
  hoverScale = 1,
  tapScale = 0.97,
  className = '',
  style,
  children,
  ...props
}) => {
  return (
    <motion.button
      whileTap={{ scale: tapScale }}
      whileHover={
        hoverScale !== 1
          ? {
              scale: hoverScale,
              '--liquid-button-fill-width': '100%',
              '--liquid-button-fill-height': '100%',
              '--liquid-button-delay': delay,
            }
          : {
              '--liquid-button-fill-width': '100%',
              '--liquid-button-fill-height': '100%',
              '--liquid-button-delay': delay,
            }
      }
      data-slot="liquid-button"
      className={`liquid-button ${className}`}
      style={
        {
          '--liquid-button-fill-width': '-1%',
          '--liquid-button-fill-height': fillHeight,
          '--liquid-button-delay': '0s',
          background:
            'linear-gradient(var(--liquid-button-color, #10b981) 0 0) no-repeat calc(200% - var(--liquid-button-fill-width, -1%)) 100% / 200% var(--liquid-button-fill-height, 0.2em)',
          backgroundColor: 'var(--liquid-button-background-color, #181b24)',
          transition: `background ${delay} var(--liquid-button-delay, 0s), color ${delay} ${delay}, background-position ${delay} calc(${delay} - var(--liquid-button-delay, 0s))`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default LiquidButton;
