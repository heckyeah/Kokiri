import Link from "next/link";
import { serverClient } from "@/lib/sanity";
import { SignOutButton } from "@/components/SignOutButton";
import { ARCHIVED_ALERTS_WITH_COUNTS_QUERY } from "@/lib/queries";
import { Map } from "lucide-react";
import { RestoreAlertButton } from "./RestoreAlertButton";

type AlertWithCounts = {
  _id: string;
  title: string;
  subtitle?: string | null;
  status: string;
  createdAt?: string | null;
  needHelpCount: number;
  safeCount: number;
  unconfirmedCount: number;
};

export default async function AdminArchivesPage() {
  const alerts = await serverClient.fetch<AlertWithCounts[]>(
    ARCHIVED_ALERTS_WITH_COUNTS_QUERY
  );
  const list = alerts ?? [];

  function formatDate(iso: string | null | undefined) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-NZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-slate-900">
            Kōkiri – Admin
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/members"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              View Members
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Exit admin
            </Link>
            <SignOutButton className="text-sm text-slate-600 hover:text-slate-900" />
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        <section>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Archived notifications
            </h2>
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              ← All notifications
            </Link>
          </div>
          {list.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No archived notifications yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {list.map((alert) => (
                <li
                  key={alert._id}
                  className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {alert.title}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatDate(alert.createdAt)}
                      {" · "}
                      <span className="text-slate-500">Archived</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {alert.needHelpCount} need help · {alert.safeCount} safe ·{" "}
                      {alert.unconfirmedCount} unconfirmed
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RestoreAlertButton alertId={alert._id} />
                    <Link
                      href={`/admin/map?alertId=${encodeURIComponent(alert._id)}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                    >
                      <Map className="h-4 w-4" />
                      Map
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
