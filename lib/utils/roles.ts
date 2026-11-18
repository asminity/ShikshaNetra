"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const INSTITUTION_ADMIN = "Institution Admin";

/** Landing page for a role after sign-in. */
export function homeForRole(role?: string | null): string {
  return role === INSTITUTION_ADMIN ? "/institution/dashboard" : "/dashboard";
}

function storedRole(): string | null {
  try {
    const raw = localStorage.getItem("shikshanetra_user");
    return raw ? JSON.parse(raw)?.role ?? null : null;
  } catch {
    return null;
  }
}

/**
 * Teacher-only pages (personal dashboard, upload, history, insights) call this.
 * Institution admins are sent to their own dashboard instead. Returns true while
 * the redirect is pending so the page can render nothing in the meantime.
 */
export function useRedirectInstitutionAdmin(): boolean {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (storedRole() === INSTITUTION_ADMIN) {
      setRedirecting(true);
      router.replace(homeForRole(INSTITUTION_ADMIN));
    }
  }, [router]);

  return redirecting;
}
