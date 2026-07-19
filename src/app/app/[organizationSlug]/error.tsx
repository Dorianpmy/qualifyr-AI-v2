"use client";

import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function OrganizationError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto grid w-full max-w-2xl gap-5 p-4 sm:p-8"><Alert variant="danger" title="Le tableau de bord est momentanément indisponible">Aucune donnée technique n’a été affichée. Réessayez ou revenez à la sélection des organisations.</Alert><div className="flex flex-wrap gap-2"><Button type="button" onClick={reset}>Réessayer</Button><Button asChild variant="outline"><Link href="/app">Changer d’organisation</Link></Button></div></main>;
}
