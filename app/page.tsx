import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowRight,
  Check,
  ChevronDown,
  Dumbbell,
  Flame,
  HeartPulse,
  ListChecks,
  PlayCircle,
  ShieldCheck,
  Target,
  TrendingUp,
  UserCog,
} from "lucide-react";

import { auth } from "@/lib/auth";
import {
  getOfferPriceLabel,
  PRODUCT_OFFER,
} from "@/lib/billing/plan";

export const metadata: Metadata = {
  title: {
    absolute:
      "BJJ Performance | Preparação física para Jiu-Jitsu",
  },

  description:
    "Programa de preparação física individual para o seu Jiu-Jitsu, que se ajusta toda semana ao seu desempenho e à sua recuperação. Pagamento único, acesso permanente.",

  openGraph: {
    title:
      "BJJ Performance | Preparação física para Jiu-Jitsu",
    description:
      "Programa individual que se ajusta toda semana ao seu desempenho e à sua recuperação.",
    locale: "pt_BR",
    type: "website",
    siteName: "BJJ Performance",
  },
};

interface LandingItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const STEPS: LandingItem[] = [
  {
    icon: UserCog,
    title: "Conte como você treina",
    description:
      "Dias de tatame e de academia, Gi ou No-Gi, tempo por sessão, objetivos, restrições e dores atuais.",
  },
  {
    icon: ListChecks,
    title: "Receba seu programa",
    description:
      "Um bloco de 6 semanas com 2 ou 3 treinos de força por semana, dosados para não competir com o Jiu-Jitsu.",
  },
  {
    icon: PlayCircle,
    title: "Treine e registre",
    description:
      "Siga a prescrição pelo celular, veja o vídeo de cada exercício e anote cargas, repetições, tempo ou distância.",
  },
  {
    icon: TrendingUp,
    title: "A próxima semana se ajusta",
    description:
      "Com base no que você fez e em como se recuperou, cada exercício progride, se mantém ou recua.",
  },
];

const FEATURES: LandingItem[] = [
  {
    icon: Target,
    title: "Feito para o tatame",
    description:
      "Força, pegada, core, quadril e condicionamento com exercícios escolhidos pela transferência para o Jiu-Jitsu.",
  },
  {
    icon: HeartPulse,
    title: "Recuperação e dor contam",
    description:
      "Fadiga alta reduz o volume. Dor relatada segura a progressão ou recua a carga, em vez de forçar.",
  },
  {
    icon: PlayCircle,
    title: "Vídeo de cada exercício",
    description:
      "Execução, erros comuns e o porquê de cada movimento no seu jogo, direto na tela do treino.",
  },
  {
    icon: Flame,
    title: "Consistência, não excesso",
    description:
      "XP, sequência semanal e conquistas premiam completar o que foi prescrito. Treino extra não vale ponto.",
  },
];

const FAQ = [
  {
    question: "Preciso de academia?",
    answer:
      "Sim. O programa usa equipamentos comuns de academia, como máquinas, cabos, halteres e barra fixa.",
  },
  {
    question: "Serve para quem nunca fez musculação?",
    answer:
      "Serve. Todo programa começa pela fase de fundação, com cargas e esforço moderados, e só avança quando você responde bem.",
  },
  {
    question: "Quantas vezes por semana vou treinar?",
    answer:
      "Duas ou três sessões de força, conforme a sua frequência de Jiu-Jitsu. Quem treina muito no tatame recebe menos sessões para controlar a fadiga.",
  },
  {
    question: "E se eu sentir dor?",
    answer:
      "Você informa no feedback pós-treino e a progressão da semana seguinte é segurada ou reduzida. O BJJ Performance não substitui avaliação médica ou fisioterapia.",
  },
  {
    question: "Como funciona o pagamento?",
    answer:
      "É um pagamento único, feito pelo Stripe. Depois de confirmado, o acesso fica liberado para sempre.",
  },
  {
    question: "Funciona no celular?",
    answer:
      "Sim. O app foi pensado para ser usado no celular durante o treino.",
  },
];

export default async function Home() {
  const session = await auth();

  if (session?.user?.email) {
    redirect("/dashboard");
  }

  const priceLabel =
    await getOfferPriceLabel();

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-primary"
          >
            <Dumbbell
              size={20}
              aria-hidden="true"
            />

            <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">
              BJJ Performance
            </span>
          </Link>

          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-muted transition hover:text-foreground"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <ShieldCheck
            size={14}
            aria-hidden="true"
          />
          Preparação física para Jiu-Jitsu
        </p>

        <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          Fique mais forte para o tatame com
          um treino que se ajusta a você toda
          semana.
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
          O BJJ Performance monta sua
          preparação física a partir da sua
          rotina de Jiu-Jitsu e adapta a
          semana seguinte ao seu desempenho e
          à sua recuperação.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-hover active:scale-[0.98]"
          >
            Criar minha conta
            <ArrowRight
              size={18}
              aria-hidden="true"
            />
          </Link>

          <a
            href="#como-funciona"
            className="flex min-h-12 items-center justify-center rounded-xl border border-border px-6 py-3 font-semibold transition hover:bg-card"
          >
            Ver como funciona
          </a>
        </div>

        <p className="mt-4 text-xs text-muted">
          Pagamento único · acesso permanente
        </p>
      </section>

      {/* COMO FUNCIONA */}
      <section
        id="como-funciona"
        className="scroll-mt-16 border-t border-border bg-surface"
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <SectionHeading
            eyebrow="Como funciona"
            title="Do cadastro ao treino da próxima semana"
          />

          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon
                      size={20}
                      aria-hidden="true"
                    />
                  </div>

                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                    Passo {index + 1}
                  </p>
                </div>

                <h3 className="mt-4 font-semibold">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <SectionHeading
            eyebrow="Por que funciona"
            title="Treino de academia pensado para quem luta"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon
                    size={20}
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* OFERTA */}
      <section
        id="preco"
        className="scroll-mt-16 border-t border-border bg-surface"
      >
        <div className="mx-auto w-full max-w-xl px-4 py-14 sm:px-6 sm:py-20">
          <SectionHeading
            eyebrow="Acesso"
            title="Um pagamento, acesso para sempre"
            centered
          />

          <div className="mt-8 rounded-2xl border border-primary/40 bg-card p-5 sm:p-6">
            <p className="text-sm font-semibold text-primary">
              {PRODUCT_OFFER.name}
            </p>

            <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
              {priceLabel && (
                <span className="text-3xl font-bold">
                  {priceLabel}
                </span>
              )}

              <span className="text-sm text-muted">
                {PRODUCT_OFFER.paymentLabel}
              </span>
            </p>

            <ul className="mt-5 space-y-3">
              {PRODUCT_OFFER.features.map(
                (feature) => (
                  <li
                    key={feature}
                    className="flex gap-2.5 text-sm leading-6"
                  >
                    <Check
                      size={18}
                      className="mt-0.5 shrink-0 text-green-500"
                      aria-hidden="true"
                    />

                    {feature}
                  </li>
                )
              )}
            </ul>

            <Link
              href="/register"
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover active:scale-[0.98]"
            >
              Criar conta e comprar
              <ArrowRight
                size={18}
                aria-hidden="true"
              />
            </Link>

            <p className="mt-3 text-center text-xs leading-5 text-muted">
              Você cria sua conta, faz o
              pagamento seguro pelo Stripe e o
              acesso fica liberado.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
          <SectionHeading
            eyebrow="Dúvidas"
            title="Perguntas frequentes"
            centered
          />

          <div className="mt-8 space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-border bg-card"
              >
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                  {item.question}

                  <ChevronDown
                    size={18}
                    className="shrink-0 text-muted transition group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>

                <p className="px-5 pb-4 text-sm leading-6 text-muted">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-2xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Pronto para treinar com método?
          </h2>

          <p className="mt-3 text-muted">
            Monte seu programa em poucos
            minutos.
          </p>

          <Link
            href="/register"
            className="mx-auto mt-8 flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-hover active:scale-[0.98]"
          >
            Criar minha conta
            <ArrowRight
              size={18}
              aria-hidden="true"
            />
          </Link>

          <p className="mt-4 text-sm text-muted">
            Já possui conta?{" "}
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center font-semibold text-foreground"
            >
              Entrar
            </Link>
          </p>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 text-xs leading-5 text-muted sm:px-6">
          <p>
            © {new Date().getFullYear()} BJJ
            Performance. As orientações do app
            não substituem acompanhamento
            médico ou profissional.
          </p>
        </div>
      </footer>
    </main>
  );
}

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  centered?: boolean;
}

function SectionHeading({
  eyebrow,
  title,
  centered = false,
}: SectionHeadingProps) {
  return (
    <div
      className={
        centered ? "text-center" : undefined
      }
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}
