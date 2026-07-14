"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function LinkedInLogger() {
  const pathname = usePathname();

  useEffect(() => {
    console.log("[Py] Candidate LinkedIn: https://www.linkedin.com/in/arvind-shahi");
  }, [pathname]);

  return null;
}
