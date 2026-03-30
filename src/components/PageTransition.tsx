"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Newspaper page-flip transition.
 * Wraps page content with a 3-D rotateY that simulates
 * turning a broadsheet page from right to left.
 */
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ rotateY: -90, opacity: 0, transformOrigin: "right center" }}
        animate={{ rotateY: 0, opacity: 1, transformOrigin: "right center" }}
        exit={{ rotateY: 90, opacity: 0, transformOrigin: "left center" }}
        transition={{
          duration: 0.55,
          ease: [0.32, 0, 0.67, 0],
        }}
        style={{ perspective: 1400 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
