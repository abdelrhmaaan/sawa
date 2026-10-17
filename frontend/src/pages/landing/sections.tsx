import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  EyeOff,
  History,
  Hourglass,
  Languages,
  Send,
  ShieldCheck,
  ShieldQuestion,
  User,
  Users,
} from "lucide-react";

import { ButtonLink, Card } from "@/components/ui";
import { Logo } from "@/components/Logo";

import { ChannelsMock, SawaListMock } from "./mocks";

function Section({
  id,
  labelledby,
  className = "",
  children,
}: {
  id: string;
  labelledby: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledby}
      className={`scroll-mt-20 py-16 md:py-24 ${className}`}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">{children}</div>
    </section>
  );
}

export function PainSection() {
  const { t } = useTranslation();
  const cards = [
    {
      icon: EyeOff,
      iconStyles: "bg-warning-subtle text-warning",
      title: t("landing.pain.visibility.title"),
      quote: t("landing.pain.visibility.quote"),
      body: t("landing.pain.visibility.body"),
    },
    {
      icon: ShieldQuestion,
      iconStyles: "bg-error-subtle text-error",
      title: t("landing.pain.accountability.title"),
      quote: t("landing.pain.accountability.quote"),
      body: t("landing.pain.accountability.body"),
    },
    {
      icon: Hourglass,
      iconStyles: "bg-warning-subtle text-warning",
      title: t("landing.pain.time.title"),
      quote: t("landing.pain.time.quote"),
      body: t("landing.pain.time.body"),
    },
  ];
  return (
    <Section id="problem" labelledby="problem-title">
      <div className="reveal text-center mb-10">
        <h2 id="problem-title" className="text-h1 text-text-primary">
          {t("landing.pain.title")}
        </h2>
        <p className="text-body text-text-secondary mt-2 max-w-2xl mx-auto">
          {t("landing.pain.subtitle")}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(({ icon: Icon, iconStyles, title, quote, body }) => (
          <Card key={title} className="reveal">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${iconStyles}`}
            >
              <Icon size={20} />
            </div>
            <h3 className="text-h3 text-text-primary mb-1">{title}</h3>
            <p className="text-body-sm font-medium text-text-secondary mb-2">
              {quote}
            </p>
            <p className="text-body-sm text-text-secondary">{body}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function ShiftSection() {
  const { t } = useTranslation();
  return (
    <Section id="shift" labelledby="shift-title" className="bg-brand-50">
      <div className="reveal text-center mb-10">
        <h2 id="shift-title" className="text-h1 text-brand-900">
          {t("landing.shift.title")}
        </h2>
        <p className="text-body text-text-secondary mt-2 max-w-2xl mx-auto">
          {t("landing.shift.body")}
        </p>
      </div>
      <div className="reveal flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
        <div className="text-center">
          <p className="text-overline text-text-secondary mb-4">
            {t("landing.shift.before")}
          </p>
          <ChannelsMock />
        </div>
        <ArrowDown
          size={28}
          className="text-brand-600 md:hidden"
          aria-hidden="true"
        />
        <ArrowRight
          size={28}
          className="text-brand-600 hidden md:block rtl:-scale-x-100"
          aria-hidden="true"
        />
        <div className="text-center">
          <p className="text-overline text-text-secondary mb-4">
            {t("landing.shift.after")}
          </p>
          <SawaListMock />
        </div>
      </div>
    </Section>
  );
}

export function HowItWorksSection() {
  const { t } = useTranslation();
  const steps = [
    {
      icon: Send,
      title: t("landing.how.submit.title"),
      body: t("landing.how.submit.body"),
    },
    {
      icon: CheckCircle2,
      title: t("landing.how.review.title"),
      body: t("landing.how.review.body"),
    },
    {
      icon: Activity,
      title: t("landing.how.track.title"),
      body: t("landing.how.track.body"),
    },
  ];
  return (
    <Section id="how-it-works" labelledby="how-title">
      <div className="reveal text-center mb-10">
        <h2 id="how-title" className="text-h1 text-text-primary">
          {t("landing.how.title")}
        </h2>
        <p className="text-body text-text-secondary mt-2 max-w-2xl mx-auto">
          {t("landing.how.subtitle")}
        </p>
      </div>
      <ol className="relative grid gap-8 md:grid-cols-3">
        {/* connector line between steps on >=md */}
        <span
          aria-hidden="true"
          className="hidden md:block absolute top-6 start-[16%] end-[16%] border-t-2 border-dashed border-brand-200"
        />
        {steps.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="reveal relative text-center">
            <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center mx-auto mb-4 relative">
              <Icon size={22} />
            </div>
            <p className="text-overline text-brand-700 mb-1">
              {t("landing.how.step", { n: i + 1 })}
            </p>
            <h3 className="text-h3 text-text-primary mb-2">{title}</h3>
            <p className="text-body-sm text-text-secondary max-w-xs mx-auto">
              {body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function RolesSection() {
  const { t } = useTranslation();
  const roles = [
    {
      icon: User,
      name: t("role.employee"),
      bullets: [
        t("landing.roles.employee.b1"),
        t("landing.roles.employee.b2"),
        t("landing.roles.employee.b3"),
      ],
    },
    {
      icon: Users,
      name: t("role.manager"),
      bullets: [
        t("landing.roles.manager.b1"),
        t("landing.roles.manager.b2"),
        t("landing.roles.manager.b3"),
      ],
    },
    {
      icon: Building2,
      name: t("landing.roles.hr.name"),
      bullets: [
        t("landing.roles.hr.b1"),
        t("landing.roles.hr.b2"),
        t("landing.roles.hr.b3"),
      ],
    },
  ];
  return (
    <Section id="roles" labelledby="roles-title" className="bg-surface-alt">
      <div className="reveal text-center mb-10">
        <h2 id="roles-title" className="text-h1 text-text-primary">
          {t("landing.roles.title")}
        </h2>
        <p className="text-body text-text-secondary mt-2 max-w-2xl mx-auto">
          {t("landing.roles.subtitle")}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map(({ icon: Icon, name, bullets }) => (
          <Card key={name} className="reveal">
            <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-4">
              <Icon size={20} />
            </div>
            <h3 className="text-h3 text-text-primary mb-3">{name}</h3>
            <ul className="space-y-2">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <Check
                    size={16}
                    className="text-success shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="text-body-sm text-text-secondary">{b}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function TrustSection() {
  const { t } = useTranslation();
  const items = [
    {
      icon: ShieldCheck,
      title: t("landing.trust.access.title"),
      body: t("landing.trust.access.body"),
    },
    {
      icon: History,
      title: t("landing.trust.history.title"),
      body: t("landing.trust.history.body"),
    },
    {
      icon: Languages,
      title: t("landing.trust.language.title"),
      body: t("landing.trust.language.body"),
    },
  ];
  return (
    <Section id="trust" labelledby="trust-title" className="py-12 md:py-16">
      <h2 id="trust-title" className="sr-only">
        {t("landing.trust.title")}
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map(({ icon: Icon, title, body }) => (
          <div key={title} className="reveal flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
              <Icon size={18} />
            </div>
            <div>
              <p className="text-body-sm font-semibold text-text-primary">
                {title}
              </p>
              <p className="text-body-sm text-text-secondary">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function FinalCtaSection() {
  const { t } = useTranslation();
  return (
    <Section id="cta" labelledby="cta-title" className="bg-brand-600">
      <div className="reveal text-center">
        <h2 id="cta-title" className="text-h1 text-white">
          {t("landing.cta.title")}
        </h2>
        <p className="text-body text-white mt-2 max-w-xl mx-auto">
          {t("landing.cta.body")}
        </p>
        <ButtonLink
          to="/login"
          size="lg"
          className="mt-8 bg-white! text-brand-700! hover:bg-brand-50! focus-visible:ring-white! focus-visible:ring-offset-brand-600! shadow-sm"
        >
          {t("auth.signIn")}
        </ButtonLink>
      </div>
    </Section>
  );
}

export function LandingFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto max-w-6xl px-4 md:px-6 flex flex-col items-center gap-3 text-center">
        <Logo variant="mono" className="h-7" />
        <p className="text-body-sm text-text-secondary">{t("common.tagline")}</p>
        <p className="text-caption">
          {t("landing.footer.copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
