import Link from "next/link";
import { CreateAlertForm } from "./CreateAlertForm";

export default function NewAlertPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-slate-600 hover:text-slate-900">
            Back
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">Create Alert</h1>
        </div>
      </header>
      <main className="p-4 max-w-lg mx-auto">
        <CreateAlertForm />
      </main>
    </div>
  );
}
