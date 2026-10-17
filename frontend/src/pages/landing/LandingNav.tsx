import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Menu, X } from "lucide-react";

import { ButtonLink } from "@/components/ui";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Logo } from "@/components/Logo";

const sectionLinks = [
  { href: "#problem", key: "landing.nav.problem" },
  { href: "#how-it-works", key: "landing.nav.how" },
  { href: "#roles", key: "landing.nav.roles" },
] as const;

const linkClass =
  "min-h-11 inline-flex items-center px-3 rounded-md text-body-sm text-text-secondary hover:text-text-primary hover:bg-surface-alt";

export function LandingNav() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close the mobile menu when the viewport reaches tablet width.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const close = () => setOpen(false);

  return (
    <header
      className="sticky top-0 z-40 bg-surface/80 backdrop-blur border-b border-border"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          close();
          buttonRef.current?.focus();
        }
      }}
    >
      <nav
        aria-label={t("landing.nav.label")}
        className="mx-auto max-w-6xl px-4 md:px-6 h-16 flex items-center justify-between gap-4"
      >
        <Link
          to="/welcome"
          aria-label={t("landing.nav.home")}
          className="inline-flex min-h-11 items-center rounded-md"
        >
          <Logo className="h-8" />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {sectionLinks.map((l) => (
            <a key={l.href} href={l.href} className={linkClass}>
              {t(l.key)}
            </a>
          ))}
          <LanguageSwitch className="min-h-11" />
          <ButtonLink to="/login" size="lg" className="ms-2">
            {t("auth.signIn")}
          </ButtonLink>
        </div>

        <button
          ref={buttonRef}
          className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-md text-text-secondary hover:bg-surface-alt active:bg-border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          aria-label={t(open ? "landing.nav.closeMenu" : "landing.nav.openMenu")}
          aria-expanded={open}
          aria-controls="landing-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div
          id="landing-menu"
          className="md:hidden bg-surface border-b border-border shadow-md px-4 py-3 space-y-1"
        >
          {sectionLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={close}
              className={`${linkClass} flex w-full`}
            >
              {t(l.key)}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <LanguageSwitch fullLabel className="min-h-11 justify-start" />
            <ButtonLink to="/login" size="lg" fullWidth onClick={close}>
              {t("auth.signIn")}
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
