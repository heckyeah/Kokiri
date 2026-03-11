"use client";

import { useState } from "react";

type Item = {
  _id: string;
  member?: {
    fullName?: string;
    address?: string;
    phone?: string;
    medicalConditions?: string;
  } | null;
};

interface NeedHelpNoLocationPanelProps {
  items: Item[];
}

export function NeedHelpNoLocationPanel({ items }: NeedHelpNoLocationPanelProps) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const count = items.length;

  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col items-start gap-2 pointer-events-none">
      <div className="pointer-events-auto flex flex-col-reverse gap-2 items-start">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg bg-white/95 backdrop-blur shadow-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 text-left flex items-center gap-2"
        >
          <span>Need help (no location)</span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {count}
          </span>
          <span className="text-slate-400 ml-0.5">{open ? "▼" : "▶"}</span>
        </button>
        {open && (
          <div className="rounded-lg bg-white/95 backdrop-blur shadow-lg border border-slate-200 p-3 max-h-[50vh] overflow-y-auto max-w-md w-full">
            <h2 className="text-sm font-medium text-slate-700 mb-2">
              Need help (no location)
            </h2>
            <ul className="space-y-1.5 text-sm">
              {items.map((r) => (
                <li key={r._id} className="flex flex-wrap gap-x-2">
                  <span className="font-medium text-slate-900">
                    {r.member?.fullName ?? "Unknown"}
                  </span>
                  {r.member?.address && (
                    <span className="text-slate-600">{r.member.address}</span>
                  )}
                  {r.member?.phone && (
                    <span className="text-slate-500">{r.member.phone}</span>
                  )}
                  {r.member?.medicalConditions?.trim() && (
                    <span className="text-amber-700 text-xs block w-full mt-0.5">
                      Medical: {r.member.medicalConditions}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
