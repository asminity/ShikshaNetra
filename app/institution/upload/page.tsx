"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Institution admins don't upload sessions themselves; teachers do from their own
 * accounts. Keep this route alive for old links but send admins to their overview.
 */
export default function InstitutionUploadPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/institution/dashboard");
  }, [router]);

  return null;
}
