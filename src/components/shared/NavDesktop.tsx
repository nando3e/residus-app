"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutGrid,
  History,
  ImageIcon,
  Truck,
  Users,
  UserCircle,
  LogOut,
  Workflow,
} from "lucide-react";
import { t } from "@/lib/textos";
import { cn } from "@/lib/utils";

interface NavDesktopProps {
  rol: string;
  nomUsuari: string;
}

const itemsNav = [
  { href: "/tauler", label: t.nav.tauler, icon: LayoutGrid, rols: ["superadmin", "gestio"] },
  { href: "/tauler/bustia", label: t.nav.bustiaFotos, icon: ImageIcon, rols: ["superadmin", "gestio"] },
  { href: "/tauler/historial", label: t.nav.historial, icon: History, rols: ["superadmin", "gestio"] },
  { href: "/admin/camions", label: t.nav.camions, icon: Truck, rols: ["superadmin"] },
  { href: "/admin/clients", label: t.nav.clients, icon: UserCircle, rols: ["superadmin", "gestio"] },
  { href: "/admin/usuaris", label: t.nav.usuaris, icon: Users, rols: ["superadmin"] },
  { href: "/admin/fluxos", label: "Flux d'esdeveniments", icon: Workflow, rols: ["superadmin"] },
];

export default function NavDesktop({ rol, nomUsuari }: NavDesktopProps) {
  const pathname = usePathname();

  const items = itemsNav.filter((item) => item.rols.includes(rol));

  return (
    <aside className="w-56 bg-blue-900 text-white flex flex-col min-h-full shrink-0">
      <div className="p-4 flex items-center gap-3 border-b border-blue-800">
        <Image src="/images/logo-empresa.png" alt="Logo" width={36} height={36} className="rounded-lg" />
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{t.app.nom}</p>
          <p className="text-xs text-blue-300 truncate">{nomUsuari}</p>
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/tauler" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-blue-700 text-white font-medium"
                  : "text-blue-200 hover:bg-blue-800 hover:text-white"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-blue-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-blue-200 hover:bg-blue-800 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          {t.auth.sortir}
        </button>
      </div>
    </aside>
  );
}
