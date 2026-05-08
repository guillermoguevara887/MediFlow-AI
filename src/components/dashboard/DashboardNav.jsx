"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "Real-time triage intelligence",
  },
  {
    href: "/dashboard/alerts",
    label: "Critical alerts",
    description: "Immediate review cases",
  },
  {
    href: "/dashboard/anomalies",
    label: "Anomaly insights",
    description: "AI monitoring layer",
  },
  {
    href: "/dashboard/records",
    label: "Recent records",
    description: "Filtered patient table",
  },
];

export default function DashboardNav() {
  const pathname = usePathname();

  function isActive(href) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  return (
    <div className="border-b border-slate-200 bg-[#f4f7fb] px-6 pt-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              MediFlow AI
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Hospital Intelligence Console
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Navigate through triage overview, critical alerts, anomaly
              detection, and recent patient records.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            ← Back to home
          </Link>
        </div>

        <nav className="flex gap-3 overflow-x-auto pb-4">
          {tabs.map((tab) => {
            const active = isActive(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`min-w-52.5 rounded-2xl border px-4 py-3 text-left transition ${active
                  ? "border-blue-600 bg-white shadow-sm"
                  : "border-slate-200 bg-white/70 hover:border-blue-200 hover:bg-white"
                  }`}
              >
                <p
                  className={`text-sm font-bold ${active ? "text-blue-700" : "text-slate-700"
                    }`}
                >
                  {tab.label}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {tab.description}
                </p>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}