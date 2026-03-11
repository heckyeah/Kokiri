interface AlertBannerProps {
  title: string;
  subtitle?: string | null;
}

export function AlertBanner({ title, subtitle }: AlertBannerProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm opacity-90">{subtitle}</p>}
    </div>
  );
}
