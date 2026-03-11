"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "safe" | "need_help" | null;

interface SafeNeedHelpButtonsProps {
  alertId: string;
  currentStatus: Status;
  submitResponse: (status: "safe" | "need_help", alertId: string, lat?: number, lng?: number) => Promise<void>;
}

export function SafeNeedHelpButtons({ alertId, currentStatus, submitResponse }: SafeNeedHelpButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"safe" | "need_help" | null>(null);

  async function handleClick(status: "safe" | "need_help") {
    setLoading(status);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          // continue without coords
        }
      }
      await submitResponse(status, alertId, lat, lng);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2 max-w-md mx-auto">
      {currentStatus && (
        <p className="text-xs text-slate-500 text-center">
          Current: <span className={currentStatus === "safe" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
            {currentStatus === "safe" ? "Safe" : "Need help"}
          </span>
          {" "}— tap to change.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleClick("safe")}
          disabled={!!loading}
          className={`rounded-lg py-3 font-medium text-white shadow focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
            currentStatus === "safe"
              ? "bg-green-700 ring-2 ring-green-500 ring-offset-2 hover:bg-green-800"
              : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
          }`}
        >
          {loading === "safe" ? "…" : "I'm safe"}
        </button>
        <button
          type="button"
          onClick={() => handleClick("need_help")}
          disabled={!!loading}
          className={`rounded-lg py-3 font-medium text-white shadow focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
            currentStatus === "need_help"
              ? "bg-red-700 ring-2 ring-red-500 ring-offset-2 hover:bg-red-800"
              : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
          }`}
        >
          {loading === "need_help" ? "…" : "I need help"}
        </button>
      </div>
    </div>
  );
}
