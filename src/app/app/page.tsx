import { redirectToOrganizationEntry } from "@/server/organizations/service";

export default async function PrivateAppPage() {
  await redirectToOrganizationEntry();
}
