import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { serverClient } from "@/lib/sanity";
import { MEMBER_BY_ID_NO_PASSWORD_QUERY } from "@/lib/queries";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login");

  const member = await serverClient.fetch<{
    fullName: string;
    email: string;
    phone: string;
    address: string;
    medicalConditions?: string | null;
  } | null>(MEMBER_BY_ID_NO_PASSWORD_QUERY, { id: userId });

  if (!member) redirect("/dashboard");

  const isAdmin = (session.user as { role?: string }).role === "admin";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-900">Edit profile</h1>
        {isAdmin && (
          <Link
            href="/admin"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Admin
          </Link>
        )}
      </header>
      <main className="p-4 max-w-md mx-auto">
        <ProfileForm
          defaultValues={{
            fullName: member.fullName,
            email: member.email,
            phone: member.phone ?? "",
            address: member.address ?? "",
            medicalConditions: member.medicalConditions ?? "",
          }}
        />
      </main>
    </div>
  );
}
