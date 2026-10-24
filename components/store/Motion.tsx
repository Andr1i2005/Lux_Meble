"use client";

import { motion, type Variants, type Transition } from "framer-motion";
import type { ReactNode } from "react";

// Apple-like soft spring — gentle rise with a hint of settle, never bouncy.
export const SPRING: Transition = { type: "spring", stiffness: 150, damping: 20, mass: 0.9 };
export const SPRING_SNAPPY: Transition = { type: "spring", stiffness: 420, damping: 34 };

interface MotionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

/** Animates once on mount — use for above-the-fold content (hero). */
export function FadeIn({ children, className, delay = 0, y = 20 }: MotionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Reveals when scrolled into view — use for below-the-fold sections. */
export function Reveal({ children, className, delay = 0, y = 28 }: MotionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ ...SPRING, delay }}
    >
      {children}
    </motion.div>
  );
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRING },
};

/** Stagger container — reveals children one-by-one when scrolled into view. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

/** A single staggered child with a subtle press-down on tap (Apple-like). */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={item} whileTap={{ scale: 0.97 }} className={className}>
      {children}
    </motion.div>
  );
}
