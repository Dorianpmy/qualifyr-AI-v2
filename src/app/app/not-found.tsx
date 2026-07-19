import Link from "next/link";
import { ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function PrivateNotFound() {
  return <main className="mx-auto grid min-h-dvh w-full max-w-2xl place-items-center p-4 sm:p-8"><EmptyState icon={ShieldX} title="Organisation inaccessible" description="Cet espace n’existe pas ou votre compte n’y possède pas de membership actif." action={<Button asChild variant="glass"><Link href="/app">Revenir à mes organisations</Link></Button>} /></main>;
}
