"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    q: "How accurate are home-collected samples?",
    a: "Very — your sample is processed by accredited partner labs running the same grade of tests clinics rely on. The guide walks you through collection so the sample arrives in testable condition.",
  },
  {
    q: "How do I get my results?",
    a: "Scan the QR on your Result Access Card or enter your access code at wellora.ph/results. Results are written in plain language, and the app can explain anything unclear.",
  },
  {
    q: "How long until my results are ready?",
    a: "It depends on the test. You can follow each stage — pickup, lab arrival, testing — in the app, and you'll be notified the moment your lab releases the report.",
  },
  {
    q: "What if my sample can't be tested?",
    a: "If the lab flags a sample as unusable, we'll tell you plainly what happened and guide you through collecting again.",
  },
  {
    q: "Where do I return my kit?",
    a: "Either hand it sealed to our rider for pickup, or drop it at any partner clinic. Both paths are tracked from the moment the kit leaves your hands.",
  },
  {
    q: "Is my health data private?",
    a: "Yes. Reports are visible only to you, the processing lab, and WellOra admins in aggregate. Clinics only ever see handoff details — never your results. Consent is collected at activation and kept auditable under RA 10173.",
  },
];

export default function Faq() {
  const [open, set_open] = useState<number | null>(0);

  return (
    <section
      id="faq"
      data-section="faq"
      className="relative bg-white px-6 py-24 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <motion.p
          data-section="eyebrow"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center text-xs font-semibold uppercase tracking-widest text-teal-dark"
        >
          FAQ
        </motion.p>

        <motion.h2
          data-section="headline"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-center font-display text-3xl font-bold tracking-tight text-abyss md:text-5xl"
        >
          Questions, answered.
        </motion.h2>

        <div data-section="items" className="mt-12">
          {faqs.map((faq, i) => {
            const expanded = open === i;
            return (
              <motion.div
                key={faq.q}
                data-section="item"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  delay: i * 0.05,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="border-t border-abyss/10 last:border-b"
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => set_open(expanded ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="font-display text-lg font-bold text-abyss md:text-xl">
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: expanded ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="shrink-0 rounded-full border border-abyss/15 p-1.5 text-ocean"
                  >
                    <Plus size={18} aria-hidden />
                  </motion.span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    expanded
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-2xl pb-6 leading-relaxed text-slate">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
