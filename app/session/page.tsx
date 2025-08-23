"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentSession } from "@/utils/storage";

export default function SessionPage() {
  const router = useRouter();

  useEffect(() => {
    const currentSession = getCurrentSession();

    if (currentSession) {
      router.replace("/session/active");
    } else {
      router.replace("/session/setup");
    }
  }, [router]);

  return (
    <div className="py-8 text-center">
      <div className="text-neutral-600">Redirecting...</div>
    </div>
  );
}
