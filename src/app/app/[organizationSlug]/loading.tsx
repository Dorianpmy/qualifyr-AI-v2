import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationLoading() {
  return <main aria-busy="true" aria-label="Chargement du tableau de bord" className="mx-auto grid w-full max-w-[var(--content-max)] gap-6 p-4 sm:p-8"><Skeleton className="h-32 w-full" /><div className="grid gap-6 lg:grid-cols-2">{[0, 1, 2, 3].map((item) => <Card key={item} className="hover:translate-y-0"><CardHeader><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-28 w-full" /></CardContent></Card>)}</div></main>;
}
