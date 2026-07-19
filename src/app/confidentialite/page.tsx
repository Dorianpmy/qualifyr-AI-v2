import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";

const sections = [
  ["Rôles", "Qualifyr agit comme responsable de traitement pour la gestion des comptes et de la relation commerciale. Pour les demandes métier transmises par une entreprise cliente, Qualifyr agit en principe comme sous-traitant, uniquement sur ses instructions documentées."],
  ["Données traitées", "Identité et coordonnées des utilisateurs, données de connexion et de sécurité, contenu des demandes volontairement transférées, métadonnées techniques de réception, résultats proposés par l’IA et historique des validations humaines."],
  ["Finalités", "Fournir et sécuriser le service, transformer les demandes autorisées en Dossiers, identifier les informations manquantes, permettre la validation humaine, assurer la traçabilité et répondre aux obligations légales."],
  ["Conservation", "Les métadonnées de réception sont conservées selon la durée choisie par l’organisation, entre 30 et 730 jours. Les Dossiers sont conservés jusqu’à leur suppression par l’organisation ou selon la durée définie contractuellement."],
  ["Destinataires et prestataires", "Les données sont accessibles aux membres autorisés de l’organisation et aux prestataires strictement nécessaires : hébergement applicatif, base de données, réception email et, lorsqu’elle est activée, infrastructure IA. La liste contractuelle des sous-traitants et leurs lieux de traitement doit être communiquée avant mise en production commerciale."],
  ["Vos droits", "Selon votre situation, vous pouvez demander accès, rectification, effacement, limitation, opposition ou portabilité. Pour une demande contenue dans le Dossier d’une entreprise cliente, contactez d’abord cette entreprise, responsable du traitement."],
  ["Contact", "Pour toute question relative aux données : qualifyragence@gmail.com. Une identité juridique, une adresse postale et, le cas échéant, les coordonnées du DPO devront être ajoutées avant commercialisation."],
] as const;

export default function PrivacyPage() {
  return <main className="min-h-dvh bg-background px-4 py-10 sm:px-6"><div className="mx-auto max-w-3xl"><Link href="/" className="focus-ring inline-flex items-center gap-3 rounded"><BrandMark className="size-9" /><strong>Qualifyr AI</strong></Link><p className="mt-10 text-xs font-bold uppercase tracking-[.18em] text-primary">Information RGPD</p><h1 className="mt-3 text-4xl font-black tracking-[-.05em]">Politique de confidentialité</h1><p className="mt-4 text-muted-foreground">Version préparatoire du 20 juillet 2026. Ce document décrit le fonctionnement technique actuel et doit être complété avec l’identité juridique de l’éditeur avant commercialisation.</p><div className="mt-10 grid gap-4">{sections.map(([title,content])=><section key={title} className="qualifyr-glass rounded-[var(--radius-xl)] p-6"><h2 className="text-xl font-bold">{title}</h2><p className="mt-3 leading-7 text-muted-foreground">{content}</p></section>)}</div></div></main>;
}
