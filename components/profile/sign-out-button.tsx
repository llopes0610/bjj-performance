import { LogOut } from "lucide-react";

import { signOut } from "@/lib/auth";

export function SignOutButton() {
  async function handleSignOut() {
    "use server";

    await signOut({
      redirectTo: "/login",
    });
  }

  return (
    <form action={handleSignOut}>
      <button
        type="submit"
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-red-400 transition hover:border-red-500/40 hover:bg-red-500/5 active:scale-[0.98]"
      >
        <LogOut
          size={18}
          aria-hidden="true"
        />

        Sair da conta
      </button>
    </form>
  );
}
