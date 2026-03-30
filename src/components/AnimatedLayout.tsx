"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Lives in the root layout so AnimatePresence can see BOTH the old and
 * new page children during a route change.
 *
 * Newspaper page-flip: the exiting page folds away to the left while the
 * entering page unfolds from the right — like turning a broadsheet.
 */
export default function AnimatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{
          opacity: 0,
          rotateY: -12,
          x: "3%",
        }}
        animate={{
          opacity: 1,
          rotateY: 0,
          x: "0%",
        }}
        exit={{
          opacity: 0,
          rotateY: 10,
          x: "-3%",
        }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          transformOrigin: "center top",
          transformPerspective: 1200,
        }}
        className="flex flex-col min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
