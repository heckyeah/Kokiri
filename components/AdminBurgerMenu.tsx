"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function AdminBurgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg hover:bg-slate-700"
        aria-label="Menu"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      {open && (
        <div className="absolute bottom-14 right-0 min-w-[180px] rounded-lg border border-slate-200 bg-white py-2 shadow-xl">
          <Link
            href="/admin/alert/new"
            className="block px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            Create Alert
          </Link>
          <Link
            href="/admin/members"
            className="block px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setOpen(false)}
          >
            View Members
          </Link>
        </div>
      )}
    </div>
  );
}
