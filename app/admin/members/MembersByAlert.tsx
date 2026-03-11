"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { setMemberResponseStatus } from "@/lib/actions";
import type { Alert, MemberWithResponses } from "./page";

/** Radio-style options: red = Need help, gray = Unconfirmed, green = Safe. */
function StatusSwitch({
  status,
  isLoading,
  onSelect,
}: {
  status: string;
  isLoading: boolean;
  onSelect: (status: "safe" | "need_help" | "unconfirmed", e: React.MouseEvent) => void;
}) {
  const isSafe = status === "safe";
  const isNeedHelp = status === "need_help";
  const isUnconfirmed = !isSafe && !isNeedHelp;

  const base =
    "h-6 w-6 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50";
  const red =
    isNeedHelp
      ? "border-red-600 bg-red-500 ring-2 ring-red-400 ring-offset-1"
      : "border-red-400 bg-red-200 hover:bg-red-300";
  const gray =
    isUnconfirmed
      ? "border-slate-600 bg-slate-500 ring-2 ring-slate-400 ring-offset-1"
      : "border-slate-400 bg-slate-200 hover:bg-slate-300";
  const green =
    isSafe
      ? "border-green-600 bg-green-500 ring-2 ring-green-400 ring-offset-1"
      : "border-green-400 bg-green-200 hover:bg-green-300";

  return (
    <div className="flex items-center gap-2 shrink-0" role="radiogroup" aria-label="Status">
      <button
        type="button"
        role="radio"
        disabled={isLoading}
        onClick={(e) => onSelect("need_help", e)}
        title="Need help"
        aria-checked={isNeedHelp}
        className={`${base} ${red} focus:ring-red-400`}
      />
      <button
        type="button"
        role="radio"
        disabled={isLoading}
        onClick={(e) => onSelect("unconfirmed", e)}
        title="Unconfirmed"
        aria-checked={isUnconfirmed}
        className={`${base} ${gray} focus:ring-slate-400`}
      />
      <button
        type="button"
        role="radio"
        disabled={isLoading}
        onClick={(e) => onSelect("safe", e)}
        title="Safe"
        aria-checked={isSafe}
        className={`${base} ${green} focus:ring-green-400`}
      />
    </div>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

interface MembersByAlertProps {
  alerts: Alert[];
  members: MemberWithResponses[];
}

export function MembersByAlert({ alerts, members }: MembersByAlertProps) {
  const router = useRouter();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, "safe" | "need_help" | "unconfirmed">>({});

  const selectedMember = selectedMemberId
    ? members.find((m) => m._id === selectedMemberId)
    : null;

  function getStatusForAlert(member: MemberWithResponses, alertId: string) {
    const r = member.responses.find((res) => res.alertId === alertId);
    return r
      ? { status: r.status, adminMarkedSafe: r.adminMarkedSafe ?? false, markedSafeBy: r.markedSafeBy ?? null }
      : { status: "unconfirmed" as const, adminMarkedSafe: false, markedSafeBy: null };
  }

  const OPTIMISTIC_KEY_SEP = "::";

  function handleSetStatus(memberId: string, alertId: string, status: "safe" | "need_help" | "unconfirmed", e: React.MouseEvent) {
    e.stopPropagation();
    const key = `${memberId}${OPTIMISTIC_KEY_SEP}${alertId}`;
    setOptimisticStatus((prev) => ({ ...prev, [key]: status }));
    setLoadingKeys((prev) => new Set(prev).add(key));
    setMemberResponseStatus(memberId, alertId, status)
      .then(() => router.refresh())
      .catch(() => {
        setOptimisticStatus((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      })
      .finally(() => {
        setLoadingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      });
  }

  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(
    alerts.length > 0 ? alerts[0]._id : null
  );
  const [sortBy, setSortBy] = useState<"name" | "status">("name");
  const [searchQuery, setSearchQuery] = useState("");

  const selectedAlert = selectedAlertId
    ? alerts.find((a) => a._id === selectedAlertId)
    : null;

  // When server data catches up after refresh, clear optimistic status so we don't hold stale state
  useEffect(() => {
    if (!selectedAlertId) return;
    setOptimisticStatus((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const key of Object.keys(next)) {
        const [memberId, alertId] = key.split(OPTIMISTIC_KEY_SEP);
        if (memberId && alertId) {
          const member = members.find((m) => m._id === memberId);
          if (member) {
            const { status: serverStatus } = getStatusForAlert(member, alertId);
            if (serverStatus === prev[key]) {
              delete next[key];
              changed = true;
            }
          }
        }
      }
      return changed ? next : prev;
    });
  }, [members, selectedAlertId]);

  const sortedMembers =
    selectedAlert && members.length > 0
      ? [...members].sort((a, b) => {
          if (sortBy === "name") {
            return (a.fullName ?? "").localeCompare(b.fullName ?? "", undefined, { sensitivity: "base" });
          }
          const statusOrder = { need_help: 0, unconfirmed: 1, safe: 2 };
          const sa = getStatusForAlert(a, selectedAlert._id).status;
          const sb = getStatusForAlert(b, selectedAlert._id).status;
          const na = statusOrder[sa as keyof typeof statusOrder] ?? 2;
          const nb = statusOrder[sb as keyof typeof statusOrder] ?? 2;
          if (na !== nb) return na - nb;
          return (a.fullName ?? "").localeCompare(b.fullName ?? "", undefined, { sensitivity: "base" });
        })
      : members;

  const q = searchQuery.trim().toLowerCase();
  const filteredMembers = q
    ? sortedMembers.filter((m) => {
        const name = (m.fullName ?? "").toLowerCase();
        const email = (m.email ?? "").toLowerCase();
        const phone = (m.phone ?? "").toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      })
    : sortedMembers;

  if (alerts.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-600">
        No notifications sent yet. Create an alert from the admin map menu.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <label htmlFor="alert-select" className="block text-sm font-medium text-slate-700 mb-2">
          Select notification
        </label>
        <select
          id="alert-select"
          value={selectedAlertId ?? ""}
          onChange={(e) => setSelectedAlertId(e.target.value || null)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {alerts.map((alert) => (
            <option key={alert._id} value={alert._id}>
              {alert.title} — {formatDate(alert.createdAt)}
              {alert.status === "active" ? " (Active)" : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedAlert && (
        <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">{selectedAlert.title}</h2>
              <p className="mt-0.5 text-xs text-slate-600">
                {formatDate(selectedAlert.createdAt)}
                {selectedAlert.status === "active" && (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
                    Active
                  </span>
                )}
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
              <input
                type="search"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 md:flex-1 md:w-auto"
                aria-label="Search members by name, email, or phone"
              />
              <label htmlFor="sort-select" className="text-sm text-slate-600">
                Sort by
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "name" | "status")}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="name">Name (A–Z)</option>
                <option value="status">Status</option>
              </select>
              <Link
                href={`/admin/map?alertId=${encodeURIComponent(selectedAlert._id)}`}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                <MapPin className="h-4 w-4" />
                Map
              </Link>
            </div>
          </div>
          <div className="flex w-full items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 shrink-0">
              Status
            </span>
          </div>
          {filteredMembers.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              {q ? "No members match your search." : "No members for this notification."}
            </p>
          ) : (
          <ul className="divide-y divide-slate-100">
            {filteredMembers.map((member) => {
              const { status: serverStatus } = getStatusForAlert(member, selectedAlert._id);
              const markKey = `${member._id}${OPTIMISTIC_KEY_SEP}${selectedAlert._id}`;
              const status = optimisticStatus[markKey] ?? serverStatus;
              const isLoading = loadingKeys.has(markKey);
              return (
                <li key={`${selectedAlert._id}-${member._id}`}>
                  <div className="flex w-full items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setSelectedMemberId(member._id)}
                      className="min-w-0 flex-1 text-left font-medium text-slate-900 hover:underline truncate"
                    >
                      {member.fullName}
                    </button>
                    <StatusSwitch
                      status={status}
                      isLoading={isLoading}
                      onSelect={(newStatus, e) =>
                        handleSetStatus(member._id, selectedAlert._id, newStatus, e)
                      }
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          )}
        </section>
      )}

      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 border-b border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">{selectedMember.fullName}</h2>
              <dl className="mt-3 space-y-1 text-sm">
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd className="text-slate-900">{selectedMember.email}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="text-slate-900">{selectedMember.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Address</dt>
                  <dd className="text-slate-900">{selectedMember.address || "—"}</dd>
                </div>
                {selectedMember.medicalConditions && (
                  <div>
                    <dt className="text-slate-500">Medical conditions (if need help)</dt>
                    <dd className="text-slate-900 whitespace-pre-wrap">
                      {selectedMember.medicalConditions}
                    </dd>
                  </div>
                )}
                {selectedMember.lastKnownLat != null && selectedMember.lastKnownLng != null && (
                  <div>
                    <dt className="text-slate-500">Last known location</dt>
                    <dd className="text-slate-900">
                      {selectedMember.lastKnownLat.toFixed(4)}, {selectedMember.lastKnownLng.toFixed(4)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            <div className="p-6 pt-4">
              <h3 className="text-sm font-medium text-slate-700">Status by notification</h3>
              <ul className="mt-3 space-y-4">
                {alerts.map((alert) => {
                  const r = selectedMember.responses.find((res) => res.alertId === alert._id);
                  const changes = r?.statusChanges ?? [];
                  return (
                    <li key={alert._id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">{alert.title}</p>
                      <p className="text-xs text-slate-500 mb-2">{formatDate(alert.createdAt)}</p>
                      {changes.length > 0 ? (
                        <ul className="space-y-1.5 text-sm">
                          {changes.map((c, i) => (
                            <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-slate-700">
                              <span className={
                                c.status === "safe" ? "text-green-700 font-medium" :
                                c.status === "need_help" ? "text-red-700 font-medium" :
                                "text-slate-600"
                              }>
                                {c.status === "safe" ? "Safe" : c.status === "need_help" ? "Need help" : "Unconfirmed"}
                              </span>
                              <span className="text-slate-500">by {c.changedBy ?? "—"}</span>
                              <span className="text-slate-400 text-xs">{formatDate(c.changedAt)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">No updates yet</p>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-slate-500">
                Use the radio buttons: red = Need help, gray = Unconfirmed, green = Safe.
              </p>
            </div>
            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() => setSelectedMemberId(null)}
                className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
