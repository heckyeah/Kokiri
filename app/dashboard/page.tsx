import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { serverClient } from "@/lib/sanity";
import { ACTIVE_ALERT_QUERY, MEMBER_RESPONSE_FOR_ALERT_QUERY } from "@/lib/queries";
import { UserMap } from "@/components/map/UserMap";
import { SafeNeedHelpButtons } from "@/components/SafeNeedHelpButtons";
import { submitResponse } from "@/lib/actions";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login");
  const isAdmin = (session.user as { role?: string }).role === "admin";

  const activeAlert = await serverClient.fetch<{ _id: string; title: string; subtitle?: string | null } | null>(
    ACTIVE_ALERT_QUERY
  );

  const myResponseForAlert = activeAlert
    ? await serverClient.fetch<{ status: string } | null>(MEMBER_RESPONSE_FOR_ALERT_QUERY, {
        memberId: userId,
        alertId: activeAlert._id,
      })
    : null;

  const currentStatus = myResponseForAlert?.status === "safe" ? "safe" : myResponseForAlert?.status === "need_help" ? "need_help" : null;

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-900">
      <header className="relative z-10 flex h-14 shrink-0 items-center justify-between gap-2 px-4 bg-white/95 backdrop-blur border-b border-slate-200/80">
        <h1 className="text-lg font-semibold text-slate-900">Kōkiri</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Admin
            </Link>
          )}
          <Link
            href="/profile"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit profile
          </Link>
          <SignOutButton className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100" />
        </div>
      </header>
      <div className="absolute top-14 left-0 right-0 bottom-0 z-0">
        <UserMap fullScreen />
      </div>
      {activeAlert && (
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-6 bg-white/95 backdrop-blur border-t border-slate-200/80">
          <p className="text-sm font-medium text-slate-700 text-center">{activeAlert.title}</p>
          {activeAlert.subtitle && (
            <p className="text-xs text-slate-500 text-center mt-1 mb-3 whitespace-pre-wrap">{activeAlert.subtitle}</p>
          )}
          {!activeAlert.subtitle && <div className="mb-3" />}
          <SafeNeedHelpButtons
            alertId={activeAlert._id}
            currentStatus={currentStatus}
            submitResponse={submitResponse}
          />
        </div>
      )}
    </div>
  );
}
