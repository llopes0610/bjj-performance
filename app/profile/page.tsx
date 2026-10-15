import {
  Activity,
  ArrowRight,
  Award,
  CalendarDays,
  Dumbbell,
  Flame,
  Medal,
  Ruler,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppNavigation } from "@/components/navigation/app-navigation";
import { auth } from "@/lib/auth";
import { calculateLevel } from "@/lib/gamification/calculate-level";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user =
    await prisma.user.findUnique({
      where: {
        email:
          session.user.email,
      },

      select: {
        name: true,
        email: true,
        onboardingCompleted:
          true,

        athleteProfile: {
          select: {
            age: true,
            weightKg: true,
            heightCm: true,

            belt: true,
            beltDegree: true,
            experience: true,

            giTraining: true,
            noGiTraining: true,

            bjjDaysPerWeek:
              true,

            strengthDaysPerWeek:
              true,

            sessionDurationMinutes:
              true,

            goals: true,

            trainingPreferences:
              true,

            gamificationProfile: {
              select: {
                totalXp: true,
                currentStreak: true,
                longestStreak: true,
              },
            },

            restrictions: {
              where: {
                active: true,
              },

              select: {
                id: true,
                bodyArea: true,
                description: true,
                recovered: true,
                medicallyCleared:
                  true,
                currentlyPainful:
                  true,
              },
            },
          },
        },
      },
    });

  if (!user) {
    redirect("/login");
  }

  if (
    !user.onboardingCompleted ||
    !user.athleteProfile
  ) {
    redirect("/onboarding");
  }

  const athlete =
    user.athleteProfile;

  /*
   * ========================================
   * GAMIFICAÇÃO
   * ========================================
   *
   * Nível e XP do nível são calculados pela
   * engine central de gamificação.
   */

  const totalXp =
    athlete.gamificationProfile?.totalXp ?? 0;

  const levelProgress =
    calculateLevel(totalXp);

  const currentLevel =
    levelProgress.level;

  const currentXp =
    levelProgress.currentLevelXp;

  const currentStreak =
    athlete.gamificationProfile
      ?.currentStreak ?? 0;

  const longestStreak =
    athlete.gamificationProfile
      ?.longestStreak ?? 0;

  const athleteName =
    user.name ||
    session.user.name ||
    "Atleta";

  const modalities =
    [
      athlete.giTraining
        ? "Gi"
        : null,

      athlete.noGiTraining
        ? "No-Gi"
        : null,
    ].filter(
      (
        value
      ): value is string =>
        value !== null
    );

  return (
    <AppNavigation
      athleteName={
        athleteName
      }
    >
      <main className="min-h-dvh bg-background text-foreground">
        <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 sm:py-10 sm:pb-28 lg:pb-12">
          {/* ================================= */}
          {/* HEADER */}
          {/* ================================= */}

          <header>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Conta do atleta
            </p>

            <div className="mt-2 flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserRound
                  size={27}
                />
              </div>

              <div className="min-w-0">
                <h1 className="break-words text-2xl font-bold sm:text-3xl">
                  {athleteName}
                </h1>

                <p className="mt-1 truncate text-sm text-muted">
                  {user.email}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <ProfileBadge>
                    {formatBelt(
                      athlete.belt
                    )}

                    {athlete.belt !==
                      "BLACK" &&
                      athlete.beltDegree >
                        0 &&
                      ` • ${athlete.beltDegree}º grau`}
                  </ProfileBadge>

                  <ProfileBadge>
                    Nível{" "}
                    {
                      currentLevel
                    }
                  </ProfileBadge>
                </div>
              </div>
            </div>
          </header>

          {/* ================================= */}
          {/* DADOS PRINCIPAIS */}
          {/* ================================= */}

          <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              icon={
                <CalendarDays
                  size={19}
                />
              }
              value={`${athlete.age}`}
              label="Idade"
              suffix="anos"
            />

            <MetricCard
              icon={
                <Scale
                  size={19}
                />
              }
              value={formatNumber(
                athlete.weightKg
              )}
              label="Peso"
              suffix="kg"
            />

            <MetricCard
              icon={
                <Ruler
                  size={19}
                />
              }
              value={formatNumber(
                athlete.heightCm
              )}
              label="Altura"
              suffix="cm"
            />

            <MetricCard
              icon={
                <Award
                  size={19}
                />
              }
              value={formatExperience(
                athlete.experience
              )}
              label="Experiência"
            />
          </section>

          {/* ================================= */}
          {/* JIU-JITSU */}
          {/* ================================= */}

          <ProfileSection
            icon={
              <Medal size={21} />
            }
            eyebrow="Jiu-Jitsu"
            title="Perfil de treino"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <InformationCard
                label="Graduação"
                value={formatBelt(
                  athlete.belt
                )}
              />

              <InformationCard
                label="Grau"
                value={
                  athlete.belt ===
                  "BLACK"
                    ? `${athlete.beltDegree}`
                    : athlete.beltDegree >
                        0
                      ? `${athlete.beltDegree}º`
                      : "Sem grau"
                }
              />

              <InformationCard
                label="BJJ por semana"
                value={`${athlete.bjjDaysPerWeek}x`}
              />

              <InformationCard
                label="Musculação"
                value={`${athlete.strengthDaysPerWeek}x/sem`}
              />

              <InformationCard
                label="Sessão"
                value={`${athlete.sessionDurationMinutes} min`}
              />

              <InformationCard
                label="Modalidade"
                value={
                  modalities.length >
                  0
                    ? modalities.join(
                        " + "
                      )
                    : "Não informada"
                }
              />
            </div>
          </ProfileSection>

          {/* ================================= */}
          {/* OBJETIVOS */}
          {/* ================================= */}

          <ProfileSection
            icon={
              <Target size={21} />
            }
            eyebrow="Preparação física"
            title="Objetivos"
          >
            {athlete.goals.length >
            0 ? (
              <div className="flex flex-wrap gap-2">
                {athlete.goals.map(
                  (goal) => (
                    <Tag
                      key={goal}
                    >
                      {formatGoal(
                        goal
                      )}
                    </Tag>
                  )
                )}
              </div>
            ) : (
              <EmptyText>
                Nenhum objetivo
                informado.
              </EmptyText>
            )}
          </ProfileSection>

          {/* ================================= */}
          {/* PREFERÊNCIAS */}
          {/* ================================= */}

          <ProfileSection
            icon={
              <Dumbbell
                size={21}
              />
            }
            eyebrow="Personalização"
            title="Preferências de treino"
          >
            {athlete
              .trainingPreferences
              .length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {athlete.trainingPreferences.map(
                  (
                    preference
                  ) => (
                    <Tag
                      key={
                        preference
                      }
                    >
                      {formatPreference(
                        preference
                      )}
                    </Tag>
                  )
                )}
              </div>
            ) : (
              <EmptyText>
                Nenhuma preferência
                específica.
              </EmptyText>
            )}
          </ProfileSection>

          {/* ================================= */}
          {/* RESTRIÇÕES */}
          {/* ================================= */}

          <ProfileSection
            icon={
              <ShieldCheck
                size={21}
              />
            }
            eyebrow="Segurança"
            title="Restrições registradas"
          >
            {athlete.restrictions
              .length === 0 ? (
              <div className="rounded-xl bg-surface p-4">
                <p className="text-sm font-semibold">
                  Nenhuma restrição
                  ativa
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  Não há restrições
                  ativas registradas no
                  seu perfil.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {athlete.restrictions.map(
                  (
                    restriction
                  ) => (
                    <div
                      key={
                        restriction.id
                      }
                      className="rounded-xl border border-border bg-surface p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold">
                            {
                              restriction.bodyArea
                            }
                          </p>

                          <p className="mt-1 text-xs leading-5 text-muted">
                            {
                              restriction.description
                            }
                          </p>
                        </div>

                        {restriction.currentlyPainful && (
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                            Dor atual
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold text-muted">
                        {restriction.recovered && (
                          <span className="rounded-full border border-border px-2.5 py-1">
                            Recuperada
                          </span>
                        )}

                        {restriction.medicallyCleared && (
                          <span className="rounded-full border border-border px-2.5 py-1">
                            Liberação
                            médica
                          </span>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </ProfileSection>

          {/* ================================= */}
          {/* PROGRESSO */}
          {/* ================================= */}

          <ProfileSection
            icon={
              <Sparkles
                size={21}
              />
            }
            eyebrow="Progressão"
            title="Sua evolução"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <InformationCard
                label="Nível"
                value={`${currentLevel}`}
              />

              <InformationCard
                label="XP atual"
                value={`${currentXp}`}
              />

              <InformationCard
                label="XP total"
                value={`${totalXp}`}
              />

              <InformationCard
                label="Sequência"
                value={`${currentStreak}`}
              />
            </div>

            <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Flame size={19} />
              </div>

              <div>
                <p className="text-sm font-bold">
                  Maior sequência:{" "}
                  {
                    longestStreak
                  }
                </p>

                <p className="mt-0.5 text-xs text-muted">
                  Semanas completas
                  seguidas.
                </p>
              </div>
            </div>

            <Link
              href="/progress"
              className="mt-3 flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm font-semibold transition hover:border-primary/40"
            >
              Ver progresso e conquistas
              <ArrowRight
                size={17}
                className="shrink-0 text-primary"
              />
            </Link>
          </ProfileSection>

          {/* ================================= */}
          {/* STATUS */}
          {/* ================================= */}

          <section className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Activity
                  size={21}
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  Perfil
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  Configuração ativa
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Estes dados são
                  utilizados pelo motor
                  para personalizar sua
                  preparação física e
                  progressão.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </AppNavigation>
  );
}

/*
 * ========================================
 * SECTION
 * ========================================
 */

function ProfileSection({
  icon,
  eyebrow,
  title,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-lg font-bold">
            {title}
          </h2>
        </div>
      </div>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}

/*
 * ========================================
 * METRIC CARD
 * ========================================
 */

function MetricCard({
  icon,
  value,
  label,
  suffix,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-4">
      <div className="text-primary">
        {icon}
      </div>

      <p className="mt-3 break-words text-lg font-bold sm:text-xl">
        {value}

        {suffix && (
          <span className="ml-1 text-xs font-medium text-muted">
            {suffix}
          </span>
        )}
      </p>

      <p className="mt-1 text-[11px] text-muted">
        {label}
      </p>
    </div>
  );
}

/*
 * ========================================
 * INFORMATION
 * ========================================
 */

function InformationCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-surface p-3.5">
      <p className="truncate text-sm font-bold">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-muted">
        {label}
      </p>
    </div>
  );
}

/*
 * ========================================
 * BADGES
 * ========================================
 */

function ProfileBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted">
      {children}
    </span>
  );
}

function Tag({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold">
      {children}
    </span>
  );
}

function EmptyText({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="text-sm text-muted">
      {children}
    </p>
  );
}

/*
 * ========================================
 * FORMATTERS
 * ========================================
 */

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      maximumFractionDigits: 1,
    }
  ).format(value);
}

function formatBelt(
  belt: string
) {
  switch (belt) {
    case "WHITE":
      return "Faixa branca";

    case "BLUE":
      return "Faixa azul";

    case "PURPLE":
      return "Faixa roxa";

    case "BROWN":
      return "Faixa marrom";

    case "BLACK":
      return "Faixa preta";

    default:
      return belt;
  }
}

function formatExperience(
  experience: string
) {
  switch (experience) {
    case "BEGINNER":
      return "Iniciante";

    case "INTERMEDIATE":
      return "Intermediário";

    case "ADVANCED":
      return "Avançado";

    default:
      return experience;
  }
}

function formatGoal(
  goal: string
) {
  switch (goal) {
    case "STRENGTH":
      return "Força";

    case "GRIP":
      return "Pegada";

    case "POWER":
      return "Explosão";

    case "CONDITIONING":
      return "Condicionamento";

    case "MOBILITY":
      return "Mobilidade";

    case "HYPERTROPHY":
      return "Hipertrofia";

    case "ENDURANCE":
      return "Resistência";

    case "INJURY_PREVENTION":
      return "Prevenção de lesões";

    default:
      return goal;
  }
}

function formatPreference(
  preference: string
) {
  switch (preference) {
    case "AVOID_BARBELL":
      return "Evitar barra";

    case "AVOID_HIGH_IMPACT":
      return "Evitar alto impacto";

    case "PREFER_MACHINES":
      return "Preferência por máquinas";

    case "PREFER_DUMBBELLS":
      return "Preferência por halteres";

    case "PREFER_CABLES":
      return "Preferência por cabos";

    case "PREFER_BODYWEIGHT":
      return "Preferência por peso corporal";

    default:
      return preference;
  }
}