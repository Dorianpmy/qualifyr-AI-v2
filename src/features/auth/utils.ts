export function isSafeInternalPath(value: string | null | undefined): value is string {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\"));
}

export function safeInternalPath(value: string | null | undefined, fallback = "/app") {
  return isSafeInternalPath(value) ? value : fallback;
}

export function maskEmail(email: string) {
  const [localPart = "", domain = ""] = email.split("@");
  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${"•".repeat(Math.max(3, localPart.length - visible.length))}@${domain}`;
}

export function getAuthRedirect(pathname: string, authenticated: boolean, requestedNext?: string | null) {
  const isPrivate = pathname === "/app" || pathname.startsWith("/app/");
  const isGuestOnly = ["/connexion", "/inscription", "/mot-de-passe-oublie"].includes(pathname);
  if (!authenticated && isPrivate) {
    const destination = safeInternalPath(requestedNext ?? pathname, "/app");
    return `/connexion?next=${encodeURIComponent(destination)}`;
  }
  if (authenticated && isGuestOnly) return "/app";
  return null;
}
