"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { experts } from "@/constants/experts";

export default function Experts() {
  return (
    <section
      id="experts"
      data-section="experts"
      className="relative overflow-hidden bg-white px-6 py-24 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <motion.p
          data-section="eyebrow"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center text-xs font-semibold uppercase tracking-widest text-teal-dark"
        >
          Shaped by experts
        </motion.p>

        <motion.h2
          data-section="headline"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-4 max-w-2xl text-center font-display text-3xl font-bold tracking-tight text-abyss md:text-5xl"
        >
          Guided by people who know health.
        </motion.h2>
      </div>

      <div
        data-section="cards"
        className="mx-auto mt-14 flex max-w-6xl snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 md:justify-center md:overflow-visible md:px-12 md:pb-0"
      >
        {experts.map((expert, i) => (
          <motion.div
            key={expert.src}
            data-section="card"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              delay: i * 0.08,
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-52 shrink-0 snap-center md:w-1/5"
          >
            <Image
              src={expert.src}
              alt={expert.alt}
              width={392}
              height={796}
              sizes="(max-width: 768px) 52vw, 220px"
              className="h-auto w-full"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
