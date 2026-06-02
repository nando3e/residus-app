import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { SignOutButton } from "@/components/shared/SignOutButton";

export default async function ConductorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/images/logo-empresa.png" alt="Logo" width={28} height={28} className="rounded-lg" />
          <span className="font-semibold text-sm">Gestió de Residus</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-blue-200">{session.user?.name}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
