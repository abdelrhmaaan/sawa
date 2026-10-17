import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { ButtonLink } from "@/components/ui";

import { LandingNav } from "./landing/LandingNav";
import { HeroMock } from "./landing/mocks";
import {
  FinalCtaSection,
  HowItWorksSection,
  LandingFooter,
  PainSection,
  RolesSection,
  ShiftSection,
  TrustSection,
} from "./landing/sections";
import { useReveal } from "./landing/useReveal";

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  useReveal(rootRef);

  useEffect(() => {
    const previous = document.title;
    document.title = t("landing.meta.title");
    return () => {
      document.title = previous;
    };
  }, [i18n.resolvedLanguage, t]);

  return (
    <div
      ref={rootRef}
      className="landing-root min-h-screen bg-page text-text-primary"
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:start-3 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:px-4 focus:rounded-md focus:bg-brand-600 focus:text-white focus:text-body-sm focus:font-semibold focus:shadow-md"
      >
        {t("landing.skipToContent")}
      </a>

      <LandingNav />

      <main id="main">
        {/* Hero */}
        <section
          id="hero"
          aria-labelledby="hero-title"
          className="scroll-mt-20 relative overflow-hidden py-16 md:py-24"
        >
          {/* decorative overlapping circles echoing the logo */}
          <div
            aria-hidden="true"
            className="absolute -end-24 top-10 w-80 h-80 rounded-full bg-brand-50"
          />
          <div
            aria-hidden="true"
            className="absolute -end-10 -bottom-16 w-64 h-64 rounded-full bg-brand-100/70"
          />
          <div className="relative mx-auto max-w-6xl px-4 md:px-6 grid gap-12 lg:grid-cols-2 items-center">
            <div className="reveal text-start">
              <p className="text-overline text-text-secondary mb-3">
                {t("landing.hero.eyebrow")}
              </p>
              <h1
                id="hero-title"
                className="text-display-hero text-text-primary"
              >
                {t("landing.hero.titleLead")}
                <br />
                <span className="text-brand-900">
                  {t("landing.hero.titleAccent")}
                </span>
              </h1>
              <p className="text-body text-text-secondary max-w-xl mt-4">
                {t("landing.hero.subtitle")}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-8">
                <ButtonLink to="/login" size="lg">
                  {t("auth.signIn")}
                </ButtonLink>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-11 items-center rounded-md px-3 text-body-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline underline-offset-2"
                >
                  {t("landing.hero.secondary")}
                </a>
              </div>
            </div>
            <div className="reveal flex justify-center lg:justify-end">
              <HeroMock />
            </div>
          </div>
        </section>

        <PainSection />
        <ShiftSection />
        <HowItWorksSection />
        <RolesSection />
        <TrustSection />
        <FinalCtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
