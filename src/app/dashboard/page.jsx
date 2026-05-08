import Link from "next/link";
import { fetchAllTriageRecords } from "@/lib/triage-data";
import {
  normalizeColor,
  getLastDaysData,
  getAnomalyInsights,
  getTopClinicalPattern,
} from "@/lib/triage-analytics";
import AlertsList from "@/components/dashboard/AlertsList";
import AnomalyInsights from "@/components/dashboard/AnomalyInsights";

export const dynamic = "force-dynamic";

function formatShortDate(dateString) {
  if (!dateString) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(1)}%`;
}

function StatCard({ title, value, description, color, footer, href }) {
  const styles = {
    RED: {
      badge: "bg-red-50 text-red-700 border-red-200",
      dot: "bg-red-500",
      hover: "hover:border-red-200",
    },
    YELLOW: {
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
      hover: "hover:border-amber-200",
    },
    GREEN: {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
      hover: "hover:border-emerald-200",
    },
    BLUE: {
      badge: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
      hover: "hover:border-blue-200",
    },
    PURPLE: {
      badge: "bg-violet-50 text-violet-700 border-violet-200",
      dot: "bg-violet-500",
      hover: "hover:border-violet-200",
    },
  };

  const current = styles[color] || styles.BLUE;

  const content = (
    <div
      className={`h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${current.hover}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            {value}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </p>

          {footer ? (
            <p className="mt-4 text-xs font-medium text-slate-400">{footer}</p>
          ) : null}
        </div>

        <div
          className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${current.badge}`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${current.dot}`} />
          {color}
        </div>
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}

function CasesChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.total), 1);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Case volume over time
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Triage records generated during the last 14 days.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
            RED
          </span>

          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
            YELLOW
          </span>

          <span>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            GREEN
          </span>
        </div>
      </div>

      <div className="flex h-72 items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {data.map((item) => {
          const height = Math.max((item.total / maxValue) * 100, 4);

          return (
            <div
              key={item.day}
              className="flex h-full flex-1 flex-col items-center justify-end"
            >
              <div className="mb-2 text-xs font-semibold text-slate-500">
                {item.total}
              </div>

              <div
                className="flex w-full flex-col justify-end overflow-hidden rounded-t-xl bg-slate-200"
                style={{ height: `${height}%` }}
                title={`${item.total} cases`}
              >
                <div
                  className="bg-red-500"
                  style={{
                    height: `${item.total ? (item.red / item.total) * 100 : 0
                      }%`,
                  }}
                />

                <div
                  className="bg-amber-400"
                  style={{
                    height: `${item.total ? (item.yellow / item.total) * 100 : 0
                      }%`,
                  }}
                />

                <div
                  className="bg-emerald-500"
                  style={{
                    height: `${item.total ? (item.green / item.total) * 100 : 0
                      }%`,
                  }}
                />
              </div>

              <div className="mt-3 text-xs text-slate-500">
                {formatShortDate(item.day)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TriageDistribution({ total, redCount, yellowCount, greenCount }) {
  const redPercentage = total > 0 ? (redCount / total) * 100 : 0;
  const yellowPercentage = total > 0 ? (yellowCount / total) * 100 : 0;
  const greenPercentage = total > 0 ? (greenCount / total) * 100 : 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Triage distribution
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current severity mix across all loaded records.
          </p>
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {total} total records
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        <div className="flex h-5 w-full">
          <div
            className="bg-red-500"
            style={{ width: `${redPercentage}%` }}
            title={`RED: ${formatPercent(redPercentage)}`}
          />

          <div
            className="bg-amber-400"
            style={{ width: `${yellowPercentage}%` }}
            title={`YELLOW: ${formatPercent(yellowPercentage)}`}
          />

          <div
            className="bg-emerald-500"
            style={{ width: `${greenPercentage}%` }}
            title={`GREEN: ${formatPercent(greenPercentage)}`}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <span>
              <span className="mr-2 inline-block h-3 w-3 rounded-full bg-red-500" />
              RED
            </span>

            <span className="font-bold text-red-700">{redCount}</span>
          </div>

          <p className="mt-2 text-xs text-red-700">
            {formatPercent(redPercentage)} of loaded records
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <span>
              <span className="mr-2 inline-block h-3 w-3 rounded-full bg-amber-400" />
              YELLOW
            </span>

            <span className="font-bold text-amber-700">{yellowCount}</span>
          </div>

          <p className="mt-2 text-xs text-amber-700">
            {formatPercent(yellowPercentage)} of loaded records
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <span>
              <span className="mr-2 inline-block h-3 w-3 rounded-full bg-emerald-500" />
              GREEN
            </span>

            <span className="font-bold text-emerald-700">{greenCount}</span>
          </div>

          <p className="mt-2 text-xs text-emerald-700">
            {formatPercent(greenPercentage)} of loaded records
          </p>
        </div>
      </div>
    </section>
  );
}

function QuickAccessCard({ title, description, href, badge }) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
        {badge}
      </div>

      <h3 className="text-xl font-bold text-slate-900">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

      <p className="mt-4 text-sm font-semibold text-blue-700">
        Open section →
      </p>
    </Link>
  );
}

function DashboardError({ error }) {
  return (
    <main className="px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard error
          </h1>

          <p className="mt-3 text-red-600">
            Records could not be loaded from Supabase.
          </p>

          <pre className="mt-4 overflow-auto rounded-2xl bg-slate-50 p-4 text-sm text-red-700">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}

export default async function DashboardPage() {
  const { records, error } = await fetchAllTriageRecords();

  if (error) {
    return <DashboardError error={error} />;
  }

  const allRecords = records || [];
  const total = allRecords.length;

  const redCount = allRecords.filter(
    (record) => normalizeColor(record.color) === "RED"
  ).length;

  const yellowCount = allRecords.filter(
    (record) => normalizeColor(record.color) === "YELLOW"
  ).length;

  const greenCount = allRecords.filter(
    (record) => normalizeColor(record.color) === "GREEN"
  ).length;

  const redPercentage = total > 0 ? (redCount / total) * 100 : 0;
  const yellowPercentage = total > 0 ? (yellowCount / total) * 100 : 0;
  const greenPercentage = total > 0 ? (greenCount / total) * 100 : 0;

  const criticalAlerts = allRecords
    .filter((record) => normalizeColor(record.color) === "RED")
    .slice(0, 5);

  const chartData = getLastDaysData(allRecords, 14);
  const anomalyInsights = getAnomalyInsights(allRecords);
  const topClinicalPattern = getTopClinicalPattern(allRecords);

  return (
    <main className="px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
                MediFlow AI Hospital Dashboard
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                Real-time triage intelligence
              </h1>

              <p className="mt-3 max-w-3xl text-slate-600">
                Monitor patient intake, severity distribution, critical alerts,
                and abnormal clinical patterns across the hospital triage flow.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-right shadow-sm">
              <p className="text-sm text-slate-500">Loaded records</p>

              <p className="mt-1 text-3xl font-bold text-slate-900">{total}</p>

              <p className="mt-1 text-xs text-slate-400">
                Synthetic demo dataset
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Critical cases"
            value={redCount}
            description={`${formatPercent(
              redPercentage
            )} of all triage records`}
            color="RED"
            footer="Immediate review recommended"
            href="/dashboard/alerts"
          />

          <StatCard
            title="Moderate cases"
            value={yellowCount}
            description={`${formatPercent(
              yellowPercentage
            )} may require same-day or scheduled care`}
            color="YELLOW"
            footer="Clinical follow-up suggested"
            href="/dashboard/records?color=YELLOW"
          />

          <StatCard
            title="Low-risk cases"
            value={greenCount}
            description={`${formatPercent(
              greenPercentage
            )} suitable for non-urgent guidance`}
            color="GREEN"
            footer="Routine care pathway"
            href="/dashboard/records?color=GREEN"
          />

          <StatCard
            title="Top pattern"
            value={topClinicalPattern.count}
            description={topClinicalPattern.label}
            color="PURPLE"
            footer="Derived from symptoms and red flags"
            href="/dashboard/anomalies"
          />
        </section>

        <section className="mb-8 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <CasesChart data={chartData} />

          <AlertsList
            alerts={criticalAlerts}
            title="Latest critical alerts"
          />
        </section>

        <section className="mb-8">
          <AnomalyInsights
            insights={anomalyInsights}
            title="Anomaly signals"
            description="Days with abnormal case volume, increased RED cases, or dominant symptom clusters."
          />
        </section>

        <section className="mb-8">
          <TriageDistribution
            total={total}
            redCount={redCount}
            yellowCount={yellowCount}
            greenCount={greenCount}
          />
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <QuickAccessCard
            title="Critical alerts"
            description="Review RED triage cases that require immediate clinical attention."
            href="/dashboard/alerts"
            badge="Operational urgency"
          />

          <QuickAccessCard
            title="Anomaly insights"
            description="Explore abnormal volume spikes and clinical symptom clusters."
            href="/dashboard/anomalies"
            badge="AI monitoring"
          />

          <QuickAccessCard
            title="Recent records"
            description="Open the patient records table with filters by triage level."
            href="/dashboard/records"
            badge="Patient data"
          />
        </section>
      </div>
    </main>
  );
}