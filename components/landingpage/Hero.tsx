"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import KitGallery from "@/components/landingpage/KitGallery";

type Ripple = {
  id: number;
  x: number;
  y: number;
};

export default function Hero() {
  const [ripples, set_ripples] = useState<Ripple[]>([]);
  const [show_gallery, set_show_gallery] = useState(false);
  const id_ref = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => set_show_gallery(true), 900);
    return () => clearTimeout(timer);
  }, []);

  const spawn_ripple = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    id_ref.current += 1;
    set_ripples((rs) => [
      ...rs.slice(-5),
      {
        id: id_ref.current,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
    ]);
  };

  const remove_ripple = (id: number) =>
    set_ripples((rs) => rs.filter((r) => r.id !== id));
  return (
    <section
      id="top"
      data-hero="root"
      onClick={spawn_ripple}
      className="relative h-[100vh] max-h-[100vh] overflow-hidden bg-neutral-100"
    >
      <div
        data-hero="header"
        className="relative flex flex-col items-center px-6 pt-30 text-center md:pt-15"
      >
        <motion.h1
          data-hero="headline"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-4xl font-display text-2xl font-extrabold leading-[1.05] tracking-tight text-abyss md:text-6xl"
        >
          A healthcare that works{" "}
          <span className="text-sky-400">around your work.</span>
        </motion.h1>

        <motion.p
          data-hero="subcopy"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 text-sm font-medium text-slate md:text-lg"
        >
          Skip the waiting room. Everything you need arrives in one
          box — collect in minutes, and get results you can actually
          understand.
        </motion.p>
      </div>

      <div
        data-hero="kit"
        className="relative z-20 mt-16 flex min-h-64 justify-center px-6 pb-24"
      >
        {show_gallery && <KitGallery />}
      </div>

      {/* Click ripples */}
      <div
        data-hero="ripples"
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30"
      >
        {ripples.map((r) => (
          <span key={r.id} className="absolute" style={{ left: r.x, top: r.y }}>
            {[0, 1, 2].map((ring) => (
              <motion.span
                key={ring}
                initial={{ scale: 0.1, opacity: 0.6 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{
                  delay: ring * 0.15,
                  duration: 0.9,
                  ease: "easeOut",
                }}
                onAnimationComplete={() =>
                  ring === 2 && remove_ripple(r.id)
                }
                className="absolute -ml-32 -mt-32 h-64 w-64 rounded-full border-2 border-gray-400/50"
              />
            ))}
          </span>
        ))}
      </div>
    </section>
  );
}
