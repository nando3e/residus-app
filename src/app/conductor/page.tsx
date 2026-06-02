import { auth } from "@/lib/auth";
import ConductorClient from "@/components/conductor/ConductorClient";

export default async function ConductorPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id || "";
  return <ConductorClient userId={userId} />;
}
