import { auth } from "@/lib/auth";
import TaulerClient from "@/components/tauler/TaulerClient";

export default async function TaulerPage() {
  const session = await auth();
  const rol = (session?.user as any)?.rol || "gestio";
  return <TaulerClient rol={rol} />;
}
