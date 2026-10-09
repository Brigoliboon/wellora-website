"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { kits } from "@/constants/kits";

export default function KitGallery() {
  const [active, set_active] = useState(0);
  const [opened, set_opened] = useState(false);

  const count = kits.length;
  const prev = (active + count - 1) % count;
  const next = (active + 1) % count;
  const order = [prev, active, next];
  const active_kit = kits[active];

  const select = (idx: number) => {
    set_opened(false);
    set_active(idx);
  };

  return (
    <div data-kit="gallery" className="w-full">
      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.div
            key="gallery"
            data-kit="boxes"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -32, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center gap-0 md:gap-4"
          >
            {order.map((idx) => {
              const kit = kits[idx];
              const centered = idx === active;
              return (
                <motion.button
                  key={kit.id}
                  type="button"
                  layout
                  data-kit={centered ? "box-active" : "box-side"}
                  aria-label={
                    centered
                      ? kit.contents.length
                        ? `Open the ${kit.label} to see what's inside`
                        : kit.label
                      : `Show the ${kit.label}`
                  }
                  onClick={() =>
                    centered
                      ? kit.contents.length && set_opened(true)
                      : select(idx)
                  }
                  initial={false}
                  animate={{
                    scale: centered ? 1 : 0.78,
                    opacity: 1,
                  }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={centered ? { scale: 1.04 } : undefined}
                  whileTap={centered ? { scale: 0.97 } : undefined}
                  className={`block min-w-0 flex-none cursor-pointer basis-[44vw] md:flex-1 md:basis-auto ${
                    centered ? "z-10 basis-[62vw] md:max-w-md" : "md:max-w-xs"
                  }`}
                >
                  <Image
                    src={kit.box.src}
                    alt={kit.box.alt}
                    width={kit.box.width}
                    height={kit.box.height}
                    priority={centered}
                    sizes="(max-width: 768px) 62vw, 360px"
                    className="h-auto w-full drop-shadow-2xl"
                  />
                </motion.button>
              );
            })}
          </motion.div>
        ) : (
          <motion.button
            key="contents"
            type="button"
            data-kit="contents"
            aria-label={`Pack the ${active_kit.label} back up`}
            onClick={() => set_opened(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto block w-full max-w-4xl cursor-pointer"
          >
            <span className="flex snap-x snap-mandatory items-center gap-4 overflow-x-auto px-4 pb-4 md:snap-none md:gap-6 md:overflow-visible md:px-0 md:pb-0">
              {active_kit.contents.map((c) => (
                <motion.span
                  key={c.src}
                  data-kit="content-item"
                  initial={{ opacity: 0, y: 72, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: 0.15,
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="block w-[78vw] max-w-sm shrink-0 snap-center md:w-1/3 md:max-w-xs"
                >
                  <Image
                    src={c.src}
                    alt={c.alt}
                    width={c.width}
                    height={c.height}
                    sizes="(max-width: 768px) 80vw, 300px"
                    className="h-auto w-full drop-shadow-xl"
                  />
                </motion.span>
              ))}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
      <div data-kit="dots" className="mt-6 flex items-center justify-center gap-2">
        {kits.map((kit, idx) => (
          <button
            key={kit.id}
            type="button"
            aria-label={`Show the ${kit.label}`}
            aria-current={idx === active}
            onClick={() => select(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === active
                ? "w-8 bg-ocean"
                : "w-2 bg-abyss/20 hover:bg-abyss/40"
            }`}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.h2
          key={active_kit.id}
          data-kit="title"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 text-center font-display text-2xl font-bold tracking-tight text-abyss md:text-3xl"
        >
          {active_kit.label}
        </motion.h2>
      </AnimatePresence>
    </div>
  );
}
