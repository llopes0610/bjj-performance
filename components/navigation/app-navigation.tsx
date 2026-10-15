"use client";

import {
  Dumbbell,
  History,
  Home,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    label: "Início",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Treino",
    href: "/workout",
    icon: Dumbbell,
  },
  {
    label: "Histórico",
    href: "/history",
    icon: History,
  },
  {
    label: "Perfil",
    href: "/profile",
    icon: UserRound,
  },
] as const;

type AppNavigationProps = {
  children: React.ReactNode;
  athleteName?: string | null;
};

export function AppNavigation({
  children,
  athleteName,
}: AppNavigationProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* ================================= */}
      {/* SIDEBAR — DESKTOP */}
      {/* ================================= */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card lg:flex lg:flex-col">
        {/* MARCA */}

        <div className="border-b border-border px-6 py-6">
          <Link
            href="/dashboard"
            className="block"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              BJJ
            </p>

            <p className="mt-0.5 text-lg font-bold tracking-tight">
              Performance
            </p>
          </Link>
        </div>

        {/* NAVEGAÇÃO */}

        <nav className="flex-1 px-3 py-5">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
            Navegação
          </p>

          <div className="mt-3 space-y-1">
            {navigationItems.map(
              (item) => {
                const active =
                  isActiveRoute(
                    pathname,
                    item.href
                  );

                const Icon =
                  item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <Icon
                      size={20}
                      strokeWidth={
                        active
                          ? 2.5
                          : 2
                      }
                    />

                    <span>
                      {item.label}
                    </span>
                  </Link>
                );
              }
            )}
          </div>
        </nav>

        {/* ATLETA */}

        <div className="border-t border-border p-4">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-surface"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound
                size={19}
              />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                Atleta
              </p>

              <p className="mt-0.5 truncate text-sm font-semibold">
                {athleteName ||
                  "Meu perfil"}
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* ================================= */}
      {/* CONTEÚDO */}
      {/* ================================= */}

      <div className="min-h-dvh lg:pl-64">
        {children}
      </div>

      {/* ================================= */}
      {/* BOTTOM NAVIGATION — MOBILE/TABLET */}
      {/* ================================= */}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur lg:hidden"
        aria-label="Navegação principal"
      >
        <div
          className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1.5"
          style={{
            paddingBottom:
              "max(0.375rem, env(safe-area-inset-bottom))",
          }}
        >
          {navigationItems.map(
            (item) => {
              const active =
                isActiveRoute(
                  pathname,
                  item.href
                );

              const Icon =
                item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl px-1 transition ${
                    active
                      ? "text-primary"
                      : "text-muted"
                  }`}
                >
                  <div
                    className={`flex h-8 min-w-11 items-center justify-center rounded-full px-3 transition ${
                      active
                        ? "bg-primary/10"
                        : ""
                    }`}
                  >
                    <Icon
                      size={20}
                      strokeWidth={
                        active
                          ? 2.5
                          : 2
                      }
                    />
                  </div>

                  <span className="text-[10px] font-semibold">
                    {item.label}
                  </span>
                </Link>
              );
            }
          )}
        </div>
      </nav>
    </div>
  );
}

function isActiveRoute(
  pathname: string,
  href: string
) {
  if (pathname === href) {
    return true;
  }

  return pathname.startsWith(
    `${href}/`
  );
}