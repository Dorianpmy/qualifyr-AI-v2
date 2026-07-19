import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PlaybookActionForm } from "@/features/playbooks/components/action-form";
import { canValidateQualification } from "@/features/playbooks/permissions";
import { serviceRequestReferenceSchema } from "@/features/service-requests/schemas";
import { associateDossierPlaybookAction, calculateQualificationAction, validateQualificationAction } from "@/server/actions/playbooks";
import { getDossierQualification } from "@/server/playbooks/service";

function FieldControl({ field, value }: { field: NonNullable<Awaited<ReturnType<typeof getDossierQualification>>["schema"]>["fields"][number]; value: unknown }) {
  const common = { name: `value:${field.key}`, defaultValue: typeof value === "string" || typeof value === "number" ? value : "", required: field.required };
  if (field.type === "textarea") return <Textarea {...common} />;
  if (field.type === "country") return <Input {...common} maxLength={2} autoCapitalize="characters" placeholder="BE" />;
  return <Input {...common} type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"} />;
}

export default async function QualificationPage({ params }: { params: Promise<{ organizationSlug: string; reference: string }> }) {
  const { organizationSlug, reference: rawReference } = await params;
  const parsed = serviceRequestReferenceSchema.safeParse(rawReference);
  if (!parsed.success) notFound();
  const reference = parsed.data;
  const data = await getDossierQualification(organizationSlug, reference);
  const result = data.result;
  const storedFields = result?.field_values && typeof result.field_values === "object" && !Array.isArray(result.field_values) ? result.field_values : {};
  const storedEvidence = result?.evidence_values && typeof result.evidence_values === "object" && !Array.isArray(result.evidence_values) ? result.evidence_values : {};
  const missingInformation = Array.isArray(result?.missing_information) ? result.missing_information : [];

  return <main className="mx-auto grid w-full max-w-[var(--content-max)] gap-6 p-4 sm:p-8">
    <PageHeader eyebrow={<Button asChild variant="link"><Link href={`/app/${organizationSlug}/dossiers/${reference}`}><ArrowLeft />Retour au Dossier</Link></Button>} title="Qualification" description={`${data.detail.referenceCode} · ${data.playbookName ?? "Aucun Playbook associé"}`} />
    {!data.schema ? <Card className="hover:translate-y-0"><CardHeader><CardTitle>Associer un Playbook publié</CardTitle><CardDescription>Le Dossier conservera cette version exacte, même après une future publication.</CardDescription></CardHeader><CardContent>{data.publishedVersions.length ? <PlaybookActionForm action={associateDossierPlaybookAction.bind(null, organizationSlug, reference)} label="Associer le Playbook"><Field label="Version publiée"><Select name="versionId" required>{data.publishedVersions.map(version => <option key={version.id} value={version.id}>{version.playbookName} · v{version.versionNumber}</option>)}</Select></Field></PlaybookActionForm> : <p className="text-sm text-muted-foreground">Publiez d’abord un Playbook compatible.</p>}</CardContent></Card> : <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <Card className="hover:translate-y-0"><CardHeader><CardTitle>Informations de qualification</CardTitle><CardDescription>Les règles sont évaluées côté serveur à partir de la version {data.version?.version_number} publiée.</CardDescription></CardHeader><CardContent><PlaybookActionForm action={calculateQualificationAction.bind(null, organizationSlug, reference)} label="Calculer la qualification">{data.schema.fields.map(field => <Field key={field.key} label={`${field.question}${field.required ? " *" : ""}`} hint={field.label}><FieldControl field={field} value={storedFields[field.key]} /></Field>)}{data.schema.proofs.map(proof => { const evidence = storedEvidence[proof.key]; const count = Array.isArray(evidence) ? evidence.length : 0; return <Field key={proof.key} label={proof.label} hint={`Nombre reçu, minimum ${proof.minimum}`}><Input name={`proof:${proof.key}`} type="number" min={0} max={proof.minimum} defaultValue={count} /></Field>;})}</PlaybookActionForm></CardContent></Card>
      <div className="grid h-fit gap-6 xl:sticky xl:top-24">{result ? <Card className="hover:translate-y-0"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Résultat</CardTitle><Badge variant={result.recommended_status === "qualified" ? "success" : result.recommended_status === "incomplete" ? "warning" : "neutral"}>{result.recommended_status}</Badge></div><CardDescription>Évaluation déterministe v{result.evaluation_version}</CardDescription></CardHeader><CardContent className="grid gap-5"><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">Champs requis</dt><dd className="font-semibold">{result.required_fields_completed}/{result.required_fields_total}</dd></div><div><dt className="text-muted-foreground">Preuves</dt><dd className="font-semibold">{result.proofs_received}/{result.proofs_expected}</dd></div></dl>{missingInformation.length ? <div><p className="mb-2 text-sm font-semibold">Informations manquantes</p><ul className="grid gap-2 text-sm text-muted-foreground">{missingInformation.map((item, index) => <li key={`${JSON.stringify(item)}-${index}`} className="flex gap-2"><CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" />{typeof item === "object" && item && !Array.isArray(item) && "label" in item ? String(item.label) : String(item)}</li>)}</ul></div> : <p className="flex gap-2 text-sm text-success"><CheckCircle2 className="size-4" />Toutes les informations sont présentes.</p>}<div><p className="text-xs font-semibold text-muted-foreground">Action suivante</p><p className="text-sm">{result.next_action}</p></div>{canValidateQualification(data.context.role) && result.recommended_status === "needs_review" ? <PlaybookActionForm action={validateQualificationAction.bind(null, organizationSlug, reference)} label="Valider humainement" variant="outline" /> : null}</CardContent></Card> : <Card className="hover:translate-y-0"><CardContent className="pt-6 text-sm text-muted-foreground">Saisissez les informations pour obtenir un résultat explicable.</CardContent></Card>}</div>
    </div>}
  </main>;
}
