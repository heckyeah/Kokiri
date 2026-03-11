import Link from "next/link";
import { serverClient } from "@/lib/sanity";
import { SignOutButton } from "@/components/SignOutButton";
import {
  MEMBERS_COUNT_QUERY,
  ACTIVE_ALERT_STATS_QUERY,
  ACTIVE_ALERTS_WITH_COUNTS_QUERY,
} from "@/lib/queries";
import { Map, Users, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { ArchiveAlertButton } from "./ArchiveAlertButton";

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

export default async function AdminPage() {
  const [totalMembers, activeStats, allAlerts] = await Promise.all([
    serverClient.fetch<number>(MEMBERS_COUNT_QUERY),
    serverClient.fetch<{
      _id: string;
      title: string;
      needHelpCount: number;
      safeCount: number;
      unconfirmedCount: number;
    } | null>(ACTIVE_ALERT_STATS_QUERY),
    serverClient.fetch<AlertWithCounts[]>(ACTIVE_ALERTS_WITH_COUNTS_QUERY),
  ]);

  const membersCount = totalMembers ?? 0;
  const needHelp = activeStats?.needHelpCount ?? 0;
  const safe = activeStats?.safeCount ?? 0;
  const unconfirmed = activeStats?.unconfirmedCount ?? 0;
  const alerts = allAlerts ?? [];

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
              href="/admin/alert/new"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Create Alert
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
        {/* Stats */}
        <section className="mb-8">
          <h2 className="sr-only">Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Total members</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900">{membersCount}</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <HelpCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Need help</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900">{needHelp}</p>
              <p className="text-xs text-slate-500 mt-0.5">Active alert</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Safe</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900">{safe}</p>
              <p className="text-xs text-slate-500 mt-0.5">Active alert</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Unconfirmed</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900">{unconfirmed}</p>
              <p className="text-xs text-slate-500 mt-0.5">Active alert</p>
            </div>
          </div>
        </section>

        {/* Alerts / Notifications list */}
        <section>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h2 className="text-lg font-semibold text-slate-900">
              All notifications
            </h2>
            <Link
              href="/admin/archives"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Archives
            </Link>
          </div>
          {alerts.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No active alerts. Create an alert to notify members, or view <Link href="/admin/archives" className="text-slate-700 underline">archives</Link>.
            </p>
          ) : (
            <ul className="space-y-3">
              {alerts.map((alert) => (
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
                      <span
                        className={
                          alert.status === "active"
                            ? "text-emerald-600"
                            : "text-slate-500"
                        }
                      >
                        {alert.status === "active" ? "Active" : "Archived"}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {alert.needHelpCount} need help · {alert.safeCount} safe ·{" "}
                      {alert.unconfirmedCount} unconfirmed
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArchiveAlertButton alertId={alert._id} status={alert.status} />
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
