import Link from "next/link";
import { serverClient } from "@/lib/sanity";
import { ALL_ALERTS_QUERY, ALL_MEMBERS_WITH_ALL_RESPONSES_QUERY } from "@/lib/queries";
import { MembersByAlert } from "./MembersByAlert";

export type Alert = {
  _id: string;
  title: string;
  subtitle?: string | null;
  status: string;
  createdAt?: string | null;
};

export type MemberWithResponses = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  medicalConditions?: string | null;
  lastKnownLat?: number;
  lastKnownLng?: number;
  responses: Array<{
    _id: string;
    status: string;
    adminMarkedSafe?: boolean;
    markedSafeBy?: string | null;
    respondedAt?: string | null;
    alertId: string;
    alert?: { _id: string; title: string; createdAt?: string | null } | null;
    statusChanges?: Array<{
      status: string;
      changedAt: string | null;
      changedBy: string | null;
    }>;
  }>;
};

function deduplicateMembersByEmail(members: MemberWithResponses[]): MemberWithResponses[] {
  const byEmail = new Map<string, MemberWithResponses>();
  for (const m of members) {
    const key = (m.email ?? "").trim().toLowerCase();
    const existing = key ? byEmail.get(key) : undefined;
    if (!existing) {
      byEmail.set(key, { ...m });
    } else {
      const merged = new Map(existing.responses.map((r) => [r._id, r]));
      for (const r of m.responses) {
        if (!merged.has(r._id)) merged.set(r._id, r);
      }
      byEmail.set(key, { ...existing, responses: Array.from(merged.values()) });
    }
  }
  return Array.from(byEmail.values());
}

export default async function AdminMembersPage() {
  const [alerts, membersRaw] = await Promise.all([
    serverClient.fetch<Alert[]>(ALL_ALERTS_QUERY),
    serverClient.fetch<MemberWithResponses[]>(ALL_MEMBERS_WITH_ALL_RESPONSES_QUERY),
  ]);

  const members = deduplicateMembersByEmail(membersRaw ?? []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-slate-600 hover:text-slate-900">
            Back
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">View Members</h1>
        </div>
      </header>
      <main className="p-4 max-w-4xl mx-auto">
        <p className="mb-6 text-sm text-slate-600">
          Choose a notification to see member statuses. Click a member for details or to mark them safe.
        </p>
        <MembersByAlert
          alerts={alerts ?? []}
          members={members ?? []}
        />
      </main>
    </div>
  );
}
