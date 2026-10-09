"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Kits", href: "#kits" },
  { label: "Network", href: "#network" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [open, set_open] = useState(false);

  return (
    <>
      <nav className="flex items-center justify-between bg-transparent px-6 py-4 md:px-12">
        <Link href="#top" aria-label="WellOra home" data-nav="logo">
          <Image
            src="/logo/wellora.png"
            alt="WellOra"
            width={168}
            height={33}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => set_open((v) => !v)}
          className="rounded p-2 text-abyss"
          data-nav="menu-button"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      <div
        data-nav="mobile-menu"
        className={`absolute right-6 top-full z-40 grid w-56 transition-all duration-300 ease-in-out md:right-12 ${
          open
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <ul
            data-nav="links"
            className="flex flex-col gap-1 rounded-2xl border border-abyss/10 bg-white p-3"
          >
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => set_open(false)}
                  className="block rounded-xl px-4 py-2.5 text-base font-medium text-slate transition-colors hover:bg-mist hover:text-ocean-dark"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
