"use client";

import { motion } from "framer-motion";

export default function SceneLoader() {
  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at 38% 48%, #eeeeee 0%, #dcdcdc 55%, #cccccc 100%)",
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Spinner */}
      <div className="relative w-10 h-10">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{ borderTopColor: "#1a1a1a", borderRightColor: "#1a1a1a" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
        <span className="absolute inset-[5px] rounded-full border border-neutral-400/40" />
      </div>

      <p
        className="mt-4 text-[11px] font-medium tracking-widest uppercase"
        style={{ color: "#6b6b6b" }}
      >
        Loading scene
      </p>
    </motion.div>
  );
}
