"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Apple, Play } from "lucide-react";
import { useSyncExternalStore } from "react";

type Store = "ios" | "android" | "unknown";

const store_meta = {
  ios: {
    label: "Download on the App Store",
    title: "App Store",
    icon: Apple,
  },
  android: {
    label: "Get it on Google Play",
    title: "Google Play",
    icon: Play,
  },
} as const;

function detect_store(): Store {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "unknown";
}

function subscribe_store() {
  return () => {};
}

function get_client_store(): Store {
  return detect_store();
}

function get_server_store(): Store {
  return "unknown";
}

export default function DownloadApp() {
  const store = useSyncExternalStore(
    subscribe_store,
    get_client_store,
    get_server_store
  );

  const stores_to_show: (keyof typeof store_meta)[] =
    store === "unknown" ? ["ios", "android"] : [store];

  return (
    <section
      id="download"
      data-section="download"
      className="relative bg-white px-6 py-24 md:px-12 md:py-32"
    >
      <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
        <motion.div
          data-section="phone"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-xs md:max-w-sm"
        >
          <Image
            src="/app-model.png"
            alt="WellOra mobile app showing home collection kit options"
            width={521}
            height={479}
            sizes="(max-width: 768px) 80vw, 400px"
            className="h-auto w-full drop-shadow-2xl"
          />
        </motion.div>

        <div className="text-center md:text-left">
          <motion.p
            data-section="eyebrow"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-xs font-semibold uppercase tracking-widest text-teal-dark"
          >
            Get the app
          </motion.p>

          <motion.h2
            data-section="headline"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 font-display text-3xl font-bold tracking-tight text-abyss md:text-5xl"
          >
            Your results, on your phone.
          </motion.h2>

          <motion.p
            data-section="subcopy"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-4 max-w-xl leading-relaxed text-slate md:mx-0"
          >
            Activate kits, track your sample, and read results in plain
            language — all in one place.
          </motion.p>

          <motion.div
              data-section="badges"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                delay: 0.2,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start"
            >
              {stores_to_show.map((key) => {
                const meta = store_meta[key];
                const Icon = meta.icon;
                return (
                  <a
                    key={key}
                    href="#download"
                    aria-label={meta.label}
                    className="flex items-center gap-3 rounded-2xl bg-abyss px-6 py-3.5 text-left transition-colors hover:bg-ocean-dark"
                  >
                    <Icon size={28} aria-hidden className="text-white" />
                    <span>
                      <span className="block text-xs text-white/60">
                        {key === "ios" ? "Download on the" : "Get it on"}
                      </span>
                      <span className="block font-display text-lg font-bold leading-tight text-white">
                        {meta.title}
                      </span>
                    </span>
                  </a>
                );
              })}
            </motion.div>
        </div>
      </div>
    </section>
  );
}
