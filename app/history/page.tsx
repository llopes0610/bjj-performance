import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Filter,
  Gauge,
  History,
  Layers3,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getWorkoutHistory,
  type WorkoutHistoryItem,
  type WorkoutHistoryPeriod,
} from "@/lib/history/get-workout-history";

type HistoryPageProps = {
  searchParams: Promise<{
    page?: string | string[];
    period?: string | string[];
    workout?: string | string[];
    program?: string | string[];
  }>;
};

const HISTORY_PAGE_SIZE = 15;

export default async function HistoryPage({
  searchParams,
}: HistoryPageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user =
    await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },

      select: {
        onboardingCompleted: true,

        athleteProfile: {
          select: {
            id: true,
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

  const resolvedSearchParams =
    await searchParams;

  const requestedPage =
    parsePageParameter(
      resolvedSearchParams.page
    );

  const period =
    parsePeriodParameter(
      resolvedSearchParams.period
    );

  const workoutCode =
    parseStringParameter(
      resolvedSearchParams.workout
    );

  const programId =
    parseStringParameter(
      resolvedSearchParams.program
    );

  const history =
    await getWorkoutHistory(
      user.athleteProfile.id,
      {
        page: requestedPage,
        pageSize:
          HISTORY_PAGE_SIZE,
        period,
        workoutCode,
        programId,
      }
    );

  const {
    items,
    summary,
    pagination,
    filters,
    filterOptions,
  } = history;

  if (
    requestedPage !==
    pagination.page
  ) {
    redirect(
      buildHistoryUrl({
        page: pagination.page,
        period: filters.period,
        workoutCode:
          filters.workoutCode,
        programId:
          filters.programId,
      })
    );
  }

  const groupedHistory =
    groupHistoryByMonth(items);

  const hasActiveFilters =
    filters.period !== "all" ||
    Boolean(filters.workoutCode) ||
    Boolean(filters.programId);

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 pb-28 pt-6 sm:px-6 sm:py-10 sm:pb-28 lg:pb-12">
        <header>
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <History size={23} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Evolução
              </p>

              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                Histórico
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                Acompanhe suas sessões
                concluídas e consulte a
                evolução do seu
                treinamento.
              </p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            icon={
              <CheckCircle2 size={18} />
            }
            value={`${summary.totalSessions}`}
            label="Treinos"
          />

          <SummaryCard
            icon={<Clock3 size={18} />}
            value={formatTotalTime(
              summary.totalMinutes
            )}
            label="Tempo treinado"
          />

          <SummaryCard
            icon={<Gauge size={18} />}
            value={
              summary.averageSessionRpe !==
              null
                ? summary.averageSessionRpe.toFixed(
                    1
                  )
                : "—"
            }
            label="RPE médio"
          />

          <SummaryCard
            icon={<Layers3 size={18} />}
            value={`${summary.totalSets}`}
            label="Séries"
          />
        </section>

        <HistoryFilters
          period={filters.period}
          workoutCode={
            filters.workoutCode
          }
          programId={filters.programId}
          workoutCodes={
            filterOptions.workoutCodes
          }
          programs={
            filterOptions.programs
          }
          hasActiveFilters={
            hasActiveFilters
          }
        />

        {summary.totalSessions === 0 && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {hasActiveFilters ? (
                <Filter size={25} />
              ) : (
                <Dumbbell size={25} />
              )}
            </div>

            <h2 className="mt-5 text-xl font-bold">
              {hasActiveFilters
                ? "Nenhum treino encontrado"
                : "Nenhum treino concluído"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              {hasActiveFilters
                ? "Não existem sessões concluídas para os filtros selecionados."
                : "Assim que você concluir sua primeira sessão, ela aparecerá aqui."}
            </p>

            {hasActiveFilters ? (
              <Link
                href="/history"
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 font-semibold transition hover:border-primary/40 sm:w-auto"
              >
                <RotateCcw size={18} />
                Limpar filtros
              </Link>
            ) : (
              <Link
                href="/workout"
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:opacity-90 sm:w-auto"
              >
                Ir para treinamento
                <ArrowRight size={18} />
              </Link>
            )}
          </section>
        )}

        {summary.totalSessions > 0 && (
          <section className="mt-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                  Sessões concluídas
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  {hasActiveFilters
                    ? "Resultados"
                    : "Treinos recentes"}
                </h2>
              </div>

              <span className="text-xs text-muted">
                {summary.totalSessions}{" "}
                {summary.totalSessions === 1
                  ? "registro"
                  : "registros"}
              </span>
            </div>

            <div className="mt-5 space-y-7">
              {groupedHistory.map(
                (group) => (
                  <HistoryMonth
                    key={group.key}
                    label={group.label}
                    items={group.items}
                  />
                )
              )}
            </div>

            {pagination.totalPages > 1 && (
              <Pagination
                page={pagination.page}
                totalPages={
                  pagination.totalPages
                }
                hasPreviousPage={
                  pagination.hasPreviousPage
                }
                hasNextPage={
                  pagination.hasNextPage
                }
                period={filters.period}
                workoutCode={
                  filters.workoutCode
                }
                programId={
                  filters.programId
                }
              />
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function HistoryFilters({
  period,
  workoutCode,
  programId,
  workoutCodes,
  programs,
  hasActiveFilters,
}: {
  period: WorkoutHistoryPeriod;
  workoutCode: string | null;
  programId: string | null;
  workoutCodes: string[];
  programs: Array<{
    id: string;
    name: string;
    phase: string;
    startedAt: Date;
  }>;
  hasActiveFilters: boolean;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Filter size={17} />
          </div>

          <div>
            <p className="text-sm font-bold">
              Filtros
            </p>
            <p className="text-[11px] text-muted">
              Analise um recorte do seu histórico.
            </p>
          </div>
        </div>

        {hasActiveFilters && (
          <Link
            href="/history"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-muted transition hover:bg-surface hover:text-foreground"
          >
            <RotateCcw size={15} />
            Limpar
          </Link>
        )}
      </div>

      <form
        action="/history"
        method="get"
        className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.35fr_auto]"
      >
        <FilterField label="Período">
          <select
            name="period"
            defaultValue={period}
            className="min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary"
          >
            <option value="all">
              Todo o período
            </option>
            <option value="30d">
              Últimos 30 dias
            </option>
            <option value="90d">
              Últimos 90 dias
            </option>
            <option value="6m">
              Últimos 6 meses
            </option>
          </select>
        </FilterField>

        <FilterField label="Treino">
          <select
            name="workout"
            defaultValue={
              workoutCode ?? ""
            }
            className="min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary"
          >
            <option value="">
              Todos os treinos
            </option>

            {workoutCodes.map(
              (code) => (
                <option
                  key={code}
                  value={code}
                >
                  Treino {code}
                </option>
              )
            )}
          </select>
        </FilterField>

        <FilterField label="Programa">
          <select
            name="program"
            defaultValue={
              programId ?? ""
            }
            className="min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary"
          >
            <option value="">
              Todos os programas
            </option>

            {programs.map(
              (program) => (
                <option
                  key={program.id}
                  value={program.id}
                >
                  {program.name}
                </option>
              )
            )}
          </select>
        </FilterField>

        <div className="flex items-end">
          <button
            type="submit"
            className="min-h-12 w-full rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:opacity-90 lg:w-auto"
          >
            Aplicar
          </button>
        </div>
      </form>
    </section>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function Pagination({
  page,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  period,
  workoutCode,
  programId,
}: {
  page: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  period: WorkoutHistoryPeriod;
  workoutCode: string | null;
  programId: string | null;
}) {
  return (
    <nav
      className="mt-7 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 sm:p-4"
      aria-label="Paginação do histórico"
    >
      {hasPreviousPage ? (
        <Link
          href={buildHistoryUrl({
            page: page - 1,
            period,
            workoutCode,
            programId,
          })}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-semibold transition hover:border-primary/40 sm:px-4"
        >
          <ArrowLeft size={17} />
          <span className="hidden sm:inline">
            Anterior
          </span>
        </Link>
      ) : (
        <div className="min-h-11 w-11 sm:w-[105px]" />
      )}

      <div className="min-w-0 text-center">
        <p className="text-sm font-bold">
          {page} de {totalPages}
        </p>
        <p className="mt-0.5 text-[11px] text-muted">
          Página
        </p>
      </div>

      {hasNextPage ? (
        <Link
          href={buildHistoryUrl({
            page: page + 1,
            period,
            workoutCode,
            programId,
          })}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-semibold transition hover:border-primary/40 sm:px-4"
        >
          <span className="hidden sm:inline">
            Próxima
          </span>
          <ArrowRight size={17} />
        </Link>
      ) : (
        <div className="min-h-11 w-11 sm:w-[105px]" />
      )}
    </nav>
  );
}

function HistoryMonth({
  label,
  items,
}: {
  label: string;
  items: WorkoutHistoryItem[];
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-3">
        <p className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {items.map(
          (item, index) => (
            <HistoryRow
              key={item.id}
              item={item}
              hasDivider={
                index < items.length - 1
              }
            />
          )
        )}
      </div>
    </div>
  );
}

function HistoryRow({
  item,
  hasDivider,
}: {
  item: WorkoutHistoryItem;
  hasDivider: boolean;
}) {
  const date =
    item.completedAt ??
    item.startedAt;

  return (
    <Link
      href={`/history/${item.id}`}
      className="group block px-3.5 transition hover:bg-surface sm:px-4"
    >
      <div
        className={`flex items-center gap-3 py-3.5 sm:gap-4 ${
          hasDivider
            ? "border-b border-border"
            : ""
        }`}
      >
        <div className="w-11 shrink-0 text-center sm:w-14">
          <p className="text-lg font-bold leading-none">
            {formatDay(date)}
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            {formatShortMonth(date)}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          {item.workout.code}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold sm:text-base">
            {item.workout.name}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted sm:text-xs">
            <span>
              Semana {item.programWeek}
            </span>
            <span
              aria-hidden="true"
              className="text-border"
            >
              •
            </span>
            <span>
              {item.durationMinutes !==
              null
                ? `${item.durationMinutes} min`
                : "—"}
            </span>
            <span
              aria-hidden="true"
              className="text-border"
            >
              •
            </span>
            <span>
              RPE{" "}
              {item.sessionRpe !== null
                ? item.sessionRpe
                : "—"}
            </span>
          </div>
        </div>

        <ArrowRight
          size={18}
          className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </div>
    </Link>
  );
}

function SummaryCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-3.5 sm:p-4">
      <div className="text-primary">
        {icon}
      </div>
      <p className="mt-3 truncate text-xl font-bold">
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-4 text-muted">
        {label}
      </p>
    </div>
  );
}

function groupHistoryByMonth(
  history: WorkoutHistoryItem[]
) {
  const groups = new Map<
    string,
    {
      key: string;
      label: string;
      items: WorkoutHistoryItem[];
    }
  >();

  for (const item of history) {
    const date =
      item.completedAt ??
      item.startedAt;

    const key = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    const existing =
      groups.get(key);

    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.set(key, {
      key,
      label: formatMonthYear(date),
      items: [item],
    });
  }

  return Array.from(
    groups.values()
  );
}

function parsePageParameter(
  value: string | string[] | undefined
) {
  const rawValue = Array.isArray(value)
    ? value[0]
    : value;

  const parsed = Number.parseInt(
    rawValue ?? "1",
    10
  );

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return 1;
  }

  return parsed;
}

function parsePeriodParameter(
  value: string | string[] | undefined
): WorkoutHistoryPeriod {
  const rawValue = Array.isArray(value)
    ? value[0]
    : value;

  if (
    rawValue === "30d" ||
    rawValue === "90d" ||
    rawValue === "6m" ||
    rawValue === "all"
  ) {
    return rawValue;
  }

  return "all";
}

function parseStringParameter(
  value: string | string[] | undefined
) {
  const rawValue = Array.isArray(value)
    ? value[0]
    : value;

  const normalized =
    rawValue?.trim();

  return normalized || null;
}

function buildHistoryUrl({
  page,
  period,
  workoutCode,
  programId,
}: {
  page: number;
  period: WorkoutHistoryPeriod;
  workoutCode: string | null;
  programId: string | null;
}) {
  const params =
    new URLSearchParams();

  if (period !== "all") {
    params.set("period", period);
  }

  if (workoutCode) {
    params.set(
      "workout",
      workoutCode
    );
  }

  if (programId) {
    params.set(
      "program",
      programId
    );
  }

  if (page > 1) {
    params.set(
      "page",
      String(page)
    );
  }

  const query = params.toString();

  return query
    ? `/history?${query}`
    : "/history";
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
    }
  ).format(date);
}

function formatShortMonth(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      month: "short",
    }
  )
    .format(date)
    .replace(".", "");
}

function formatMonthYear(
  date: Date
) {
  const formatted =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        month: "long",
        year: "numeric",
      }
    ).format(date);

  return (
    formatted
      .charAt(0)
      .toUpperCase() +
    formatted.slice(1)
  );
}

function formatTotalTime(
  minutes: number
) {
  if (minutes === 0) {
    return "0 min";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  const remainingMinutes =
    minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}
