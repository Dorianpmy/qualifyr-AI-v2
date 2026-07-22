import { AlertTriangle, Bot, CheckCircle2, FileImage, MessageCircleMore, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWhatsappDashboard } from "@/server/whatsapp/dashboard";

export default async function WhatsappChannelPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  const dashboard = await getWhatsappDashboard(organizationSlug);
  const operational = dashboard.configured && dashboard.migrationReady;
  const metrics = [
    { label: "Messages", value: String(dashboard.messageCount), icon: MessageCircleMore },
    { label: "Médias sécurisés", value: `${dashboard.mediaReadyCount}/${dashboard.mediaCount}`, icon: FileImage },
    { label: "Alertes ouvertes", value: String(dashboard.alerts.length), icon: AlertTriangle },
    { label: "IA", value: dashboard.aiEnabled ? "Active" : "Secours", icon: Bot },
  ];
  return <main className="mx-auto grid w-full max-w-[var(--content-max)] gap-6 p-4 sm:p-8">
    <div>
      <Badge variant={operational ? "success" : "neutral"}>{operational ? "Connecté" : "Configuration requise"}</Badge>
      <h1 className="mt-3 text-3xl font-black tracking-[-.04em]">Canal WhatsApp</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">Suivez les demandes reçues, l’analyse IA, les pièces jointes et les incidents sans exposer aucun secret Meta.</p>
    </div>
    {!dashboard.aiEnabled ? <Card className="border-[var(--warning)]"><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="text-[var(--warning)]" />IA prête mais désactivée</CardTitle><CardDescription>WhatsApp continue avec une réponse de secours. Pour activer les questions intelligentes, ajoutez des crédits Vercel AI Gateway puis définissez AI_PROVIDER sur vercel-ai-gateway.</CardDescription></CardHeader></Card> : null}
    <div className="grid gap-4 md:grid-cols-4">
      {metrics.map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="pt-6"><Icon className="size-5 text-primary" /><p className="mt-4 text-2xl font-black">{value}</p><p className="text-sm text-muted-foreground">{label}</p></CardContent></Card>)}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>État de production</CardTitle><CardDescription>Identifiants sensibles masqués et jamais envoyés au navigateur.</CardDescription></CardHeader><CardContent className="grid gap-3 text-sm">
        <p className="flex items-center justify-between"><span>Numéro Meta</span><strong>{dashboard.phoneNumberSuffix ? `•••• ${dashboard.phoneNumberSuffix}` : "Absent"}</strong></p>
        <p className="flex items-center justify-between"><span>Modèle</span><strong>{dashboard.aiModel}</strong></p>
        <p className="flex items-center justify-between"><span>Dernier message</span><strong>{dashboard.latestMessageAt ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(dashboard.latestMessageAt)) : "Aucun"}</strong></p>
        <p className="flex items-center justify-between"><span>Échecs récents</span><strong>{dashboard.failedCount}</strong></p>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Protections actives</CardTitle><CardDescription>Le prospect fournit les données ; l’entreprise conserve la décision finale.</CardDescription></CardHeader><CardContent className="grid gap-3 text-sm">
        {["Signature Meta vérifiée avant traitement", "Déduplication des webhooks", "Photos et PDF dans un stockage privé", "Suggestions IA non confirmées automatiquement", "Réponse de secours en cas de panne IA"].map((item) => <p key={item} className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />{item}</p>)}
      </CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Parcours désormais couvert</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-6">{["Message reçu", "Besoin extrait", "Question suivante", "Photo/PDF privé", "Dossier complété", "Validation humaine"].map((step, index) => <div key={step} className="rounded-[var(--radius-lg)] border p-4"><CheckCircle2 className="size-5 text-primary" /><p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Étape {index + 1}</p><p className="mt-1 text-sm font-semibold">{step}</p></div>)}</CardContent></Card>
    {dashboard.alerts.length ? <Card className="border-[var(--warning)]"><CardHeader><CardTitle>Alertes à vérifier</CardTitle></CardHeader><CardContent className="grid gap-2">{dashboard.alerts.map((alert) => <div key={alert.id} className="rounded-[var(--radius-md)] border p-3 text-sm"><strong>{alert.code}</strong><p className="text-muted-foreground">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(alert.created_at))}</p></div>)}</CardContent></Card> : null}
  </main>;
}
