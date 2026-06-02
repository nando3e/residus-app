"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
    >
      <LogOut size={16} />
    </button>
  );
}
