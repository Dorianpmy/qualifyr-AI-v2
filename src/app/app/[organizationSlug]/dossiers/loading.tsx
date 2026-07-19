import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
export default function ServiceRequestsLoading(){return <main aria-busy="true" aria-label="Chargement des Dossiers" className="mx-auto grid w-full max-w-[var(--content-max)] gap-6 p-4 sm:p-8"><Skeleton className="h-28"/><Card className="hover:translate-y-0"><CardHeader><Skeleton className="h-6 w-40"/></CardHeader><CardContent className="grid gap-3">{[1,2,3].map(item=><Skeleton key={item} className="h-16"/>)}</CardContent></Card></main>;}
