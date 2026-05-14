"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Wraps each child with staggered fade-in animation.
 * Re-triggers animation when `animationKey` changes (e.g., new filter results).
 * Respects prefers-reduced-motion via CSS media query.
 */
interface AnimatedGridProps {
  children: ReactNode;
  animationKey: string;
}

export default function AnimatedGrid({ children, animationKey }: AnimatedGridProps) {
  const [animate, setAnimate] = useState(false);
  const prevKey = useRef(animationKey);

  useEffect(() => {
    // Only animate on key change, not initial mount
    if (prevKey.current !== animationKey) {
      prevKey.current = animationKey;
      setAnimate(false);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [animationKey]);

  const items = Children.toArray(children);

  return (
    <>
      {items.map((child, i) => {
        const staggerClass = animate && i < 12 ? `card-stagger-${i + 1}` : "";
        return (
          <div key={`${animationKey}-${i}`} className={animate ? `card-animate ${staggerClass}` : ""}>
            {child}
          </div>
        );
      })}
    </>
  );
}
