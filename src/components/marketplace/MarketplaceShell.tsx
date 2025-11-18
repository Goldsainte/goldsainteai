import React from "react";

interface MarketplaceShellProps {
  title: string;
  subtitle: string;
  filters: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  resultCount?: number;
  sortControl?: React.ReactNode;
}

export function MarketplaceShell({
  title,
  subtitle,
  filters,
  headerRight,
  children,
  resultCount,
  sortControl,
}: MarketplaceShellProps) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 lg:flex-row lg:gap-10">
      <aside className="w-full shrink-0 space-y-4 rounded-2xl border bg-white/80 p-4 shadow-sm lg:w-72">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
        </div>
        <div className="h-px bg-slate-200" />
        {filters}
      </aside>

      <main className="flex-1 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-600">
            {typeof resultCount === "number" && (
              <span>
                {resultCount} {resultCount === 1 ? "match" : "matches"} for your
                current filters
              </span>
            )}
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {sortControl}
            {headerRight}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
