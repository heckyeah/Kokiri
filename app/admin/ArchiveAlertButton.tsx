"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { archiveAlert } from "@/lib/actions";

export function ArchiveAlertButton({
  alertId,
  status,
}: {
  alertId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isArchived = status === "closed";

  if (isArchived) return null;

  async function handleArchive() {
    setLoading(true);
    try {
      await archiveAlert(alertId);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleArchive}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      <Archive className="h-4 w-4" />
      {loading ? "…" : "Archive"}
    </button>
  );
}
