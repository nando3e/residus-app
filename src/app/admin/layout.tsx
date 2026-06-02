import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NavDesktop from "@/components/shared/NavDesktop";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const rol = (session.user as any).rol;
  if (rol === "conductor") redirect("/conductor");

  return (
    <div className="flex h-full">
      <NavDesktop rol={rol} nomUsuari={session.user?.name || ""} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
