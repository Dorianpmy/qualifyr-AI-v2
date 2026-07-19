import { ArrowRight, Check, ChevronDown, Component, Database, Layers3, Palette, Sparkles } from "lucide-react";

import { QualifyrShell } from "@/components/layout/qualifyr-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, Radio, Switch } from "@/components/ui/choice-controls";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const foundations = [
  { icon: Palette, title: "Identité Qualifyr", detail: "Palette crème, mauve signature et surfaces premium." },
  { icon: Component, title: "Primitives cohérentes", detail: "États, focus et interactions partagés." },
  { icon: Layers3, title: "Tokens centralisés", detail: "Couleurs, rayons, ombres, espaces et mouvements." },
];

export default function HomePage() {
  return (
    <QualifyrShell>
      <section aria-labelledby="page-title" className="flex flex-col gap-8">
        <PageHeader
          eyebrow={<Badge><Sparkles className="size-3" />Identité V1</Badge>}
          titleId="page-title"
          title="Le design Qualifyr, reconstruit sur des fondations neuves."
          description="Une démonstration strictement visuelle des tokens, composants et interactions. Aucune donnée et aucune logique métier."
          actions={<>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="secondary">Composants <ChevronDown /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Design system</DropdownMenuLabel>
                <DropdownMenuGroup><DropdownMenuItem>Fondations</DropdownMenuItem><DropdownMenuItem>Navigation</DropdownMenuItem><DropdownMenuItem>Formulaires</DropdownMenuItem></DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>Fonctions métier non incluses</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog>
              <DialogTrigger asChild><Button>Aperçu modal <ArrowRight /></Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Une surface claire et premium</DialogTitle><DialogDescription>La modale reprend les rayons, l’ombre et les états de focus de Qualifyr sans introduire de comportement métier.</DialogDescription></DialogHeader>
                <DialogFooter><DialogClose asChild><Button variant="secondary">Fermer</Button></DialogClose><DialogClose asChild><Button><Check />Compris</Button></DialogClose></DialogFooter>
              </DialogContent>
            </Dialog>
          </>}
        />

        <section aria-labelledby="palette-title">
          <SectionHeader title="Palette de marque" description="Mauve, blanc et noir — toutes les valeurs sont consommées via des tokens sémantiques." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[{ name: "Primary", value: "bg-primary" }, { name: "Ink", value: "bg-sidebar" }, { name: "Surface", value: "bg-surface" }, { name: "Background", value: "bg-background" }].map((color) => <div key={color.name} className="qualifyr-card overflow-hidden"><div className={`h-20 ${color.value}`} /><p className="px-4 py-3 text-sm font-semibold">{color.name}</p></div>)}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {foundations.map(({ icon: Icon, title, detail }) => <Card key={title}><CardHeader><span className="mb-2 grid size-10 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"><Icon className="size-4" /></span><CardTitle>{title}</CardTitle><CardDescription>{detail}</CardDescription></CardHeader></Card>)}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.05fr]">
          <Card>
            <CardHeader><CardTitle>Formulaires</CardTitle><CardDescription>États calmes, lisibles et clairement perceptibles au clavier.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Libellé" hint="Une aide courte et utile."><Input placeholder="Saisir une valeur" /></Field>
              <Field label="Sélection"><Select defaultValue="one"><option value="one">Première option</option><option value="two">Deuxième option</option></Select></Field>
              <Field className="sm:col-span-2" label="Description"><Textarea placeholder="Écrire quelques lignes…" /></Field>
              <Field label="État d’erreur" error="Cette valeur doit être vérifiée."><Input aria-invalid="true" defaultValue="Valeur invalide" /></Field>
              <Field label="État désactivé"><Input disabled defaultValue="Indisponible" /></Field>
            </CardContent>
            <CardFooter><Button>Action principale</Button><Button variant="secondary">Secondaire</Button><Button variant="ghost">Discrète</Button></CardFooter>
          </Card>

          <Card>
            <CardHeader><CardTitle>États et navigation</CardTitle><CardDescription>Une hiérarchie visuelle uniforme sur toutes les surfaces.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Badges</p><div className="flex flex-wrap gap-2"><Badge>Neutre</Badge><Badge variant="success">Succès</Badge><Badge variant="warning">Attention</Badge><Badge variant="danger">Erreur</Badge></div></div>
              <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Boutons</p><div className="flex flex-wrap gap-2"><Button size="sm">Principal</Button><Button size="sm" variant="outline">Glass hover</Button><Button size="sm" variant="destructive">Danger</Button><Button size="sm" disabled>Désactivé</Button></div></div>
              <div><p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Sélections</p><div className="grid sm:grid-cols-3"><Checkbox label="Checkbox" defaultChecked /><Radio label="Radio" name="preview" defaultChecked /><Switch label="Switch" defaultChecked /></div></div>
              <div className="qualifyr-glass rounded-[var(--radius-xl)] p-4"><p className="text-sm font-bold">Surface glass mesurée</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Blur léger, contraste préservé et aucune animation décorative excessive.</p></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Table</CardTitle><CardDescription>Structure générique et responsive, sans ressource métier.</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Exemple de densité et de hiérarchie du design system.</TableCaption>
              <TableHeader><TableRow><TableHead>Composant</TableHead><TableHead>Fondation</TableHead><TableHead>État</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell className="font-semibold">Bouton</TableCell><TableCell>Glass hover et focus visible</TableCell><TableCell><Badge variant="success">Prêt</Badge></TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Carte</TableCell><TableCell>Surface, rayon et ombre tokenisés</TableCell><TableCell><Badge variant="success">Prêt</Badge></TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Navigation</TableCell><TableCell>Header et sidebar responsive</TableCell><TableCell><Badge variant="success">Prêt</Badge></TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Alertes et onglets</CardTitle><CardDescription>États génériques du design system, sans notification métier.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="preview"><TabsList><TabsTrigger value="preview">Aperçu</TabsTrigger><TabsTrigger value="states">États</TabsTrigger></TabsList><TabsContent value="preview" className="mt-4"><Alert title="Fondations visuelles prêtes">Les composants partagent la même palette et les mêmes états accessibles.</Alert></TabsContent><TabsContent value="states" className="mt-4"><Alert variant="danger" title="Exemple d’erreur">Un message d’erreur reste lisible sans dépendre uniquement de la couleur.</Alert></TabsContent></Tabs>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Chargement et état vide</CardTitle><CardDescription>Les attentes restent explicites et visuellement sobres.</CardDescription></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2"><div className="space-y-3 rounded-[var(--radius-xl)] border p-4" aria-label="Exemple de chargement"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /><Button size="sm" loading>Chargement</Button></div><EmptyState icon={Database} title="Aucun élément" description="Un état vide générique, sans créer de ressource métier." /></CardContent>
          </Card>
        </div>
      </section>
    </QualifyrShell>
  );
}
