"use client";

import { motion } from "framer-motion";
import { Home, Truck, MonitorSmartphone } from "lucide-react";

const steps = [
  {
    index: "01",
    icon: Home,
    title: "Collect at home",
    text: "Your kit arrives with everything inside. Follow the guide and collect your sample in minutes — no clinic visit.",
  },
  {
    index: "02",
    icon: Truck,
    title: "Drop once",
    text: "Seal it and hand it to our rider, or drop it at any partner clinic. Tracking starts the moment it leaves your hands.",
  },
  {
    index: "03",
    icon: MonitorSmartphone,
    title: "Results online",
    text: "Accredited labs run the tests. Scan your Result Access Card or enter your code to read results in plain language.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      data-section="how-it-works"
      className="relative bg-neutral-100 px-6 py-24 md:px-12 md:py-32"
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
          How it works
        </motion.p>

        <motion.h2
          data-section="headline"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight text-abyss md:text-5xl"
        >
          Healthcare that fits your day, not the other way around.
        </motion.h2>

        <ol data-section="steps" className="mt-16">
          {steps.map((step, i) => (
            <motion.li
              key={step.index}
              data-section="step"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                delay: i * 0.1,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-start gap-6 border-t border-abyss/10 py-10 last:border-b md:items-center md:gap-10"
            >
              <span
                aria-hidden
                className="font-display text-5xl font-bold text-abyss/10 md:text-7xl"
              >
                {step.index}
              </span>
              <step.icon
                size={32}
                strokeWidth={1.5}
                aria-hidden
                className="mt-1 shrink-0 text-ocean md:mt-0"
              />
              <div>
                <h3 className="font-display text-xl font-bold text-abyss md:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xl leading-relaxed text-slate">
                  {step.text}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
