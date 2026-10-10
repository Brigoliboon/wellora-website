import Image from "next/image";
import Link from "next/link";

const explore = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Why WellOra", href: "#why-wellora" },
  { label: "FAQ", href: "#faq" },
  { label: "Get the app", href: "#download" },
];

export default function Footer() {
  return (
    <footer
      data-section="footer"
      className="bg-abyss px-6 pb-10 pt-16 text-white md:px-12"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href="#top" aria-label="WellOra home" data-footer="logo">
              <Image
                src="/logo/wellora.png"
                alt="WellOra"
                width={168}
                height={33}
                className="h-8 w-auto brightness-0 invert"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              A home collection kit for lab testing. Collect at home, drop
              once, results online.
            </p>
          </div>

          <nav aria-label="Footer" data-footer="nav">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Explore
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {explore.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Results
            </p>
            <a
              href="https://wellora.ph/results"
              target="_blank"
              rel="noreferrer"
              className="mt-4 block text-sm text-white/70 transition-colors hover:text-white"
            >
              wellora.ph/results
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <p>© 2026 WellOra. All rights reserved.</p>
          <p>Health data handled under RA 10173.</p>
        </div>
      </div>
    </footer>
  );
}
