import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

/*
 * A landing page pública será criada na
 * etapa 30. Até lá, a raiz encaminha para
 * o app (ou para o login).
 */
export default async function Home() {
  const session = await auth();

  if (session?.user?.email) {
    redirect("/dashboard");
  }

  redirect("/login");
}
