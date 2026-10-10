"use client";

import { motion } from "framer-motion";
import { BadgeCheck, PackageCheck, FileText } from "lucide-react";

const points = [
  {
    index: "01",
    icon: BadgeCheck,
    title: "Accredited labs",
    text: "Every sample is processed by accredited partner labs — the same grade of testing clinics rely on.",
  },
  {
    index: "02",
    icon: PackageCheck,
    title: "Tracked end-to-end",
    text: "From rider pickup or clinic drop-off to lab arrival, your kit's journey is visible the whole way.",
  },
  {
    index: "03",
    icon: FileText,
    title: "Results in plain language",
    text: "No cryptic PDFs. Scan your card or enter your code and read results written for humans.",
  },
];

export default function WhyWellOra() {
  return (
    <section
      id="why-wellora"
      data-section="why-wellora"
      className="relative bg-white px-6 py-24 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-5xl">
        <motion.p
          data-section="eyebrow"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-xs font-semibold uppercase tracking-widest text-teal-dark"
        >
          Why WellOra
        </motion.p>

        <motion.h2
          data-section="headline"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight text-abyss md:text-5xl"
        >
          Lab-grade testing, without the waiting room.
        </motion.h2>

        <ol
          data-section="points"
          className="mt-16 grid gap-12 md:grid-cols-3 md:gap-0 md:divide-x md:divide-abyss/10"
        >
          {points.map((point, i) => (
            <motion.li
              key={point.index}
              data-section="point"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                delay: i * 0.1,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="md:px-10 md:first:pl-0 md:last:pr-0"
            >
              <point.icon
                size={40}
                strokeWidth={1.25}
                aria-hidden
                className="text-ocean"
              />
              <h3 className="mt-6 font-display text-xl font-bold text-abyss md:text-2xl">
                {point.title}
              </h3>
              <p className="mt-3 leading-relaxed text-slate">{point.text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
