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



function getPatientDisplayName(record, index = 0) {
  const rawName = String(record?.nombre || "").trim();

  if (rawName && rawName.toLowerCase() !== "paciente simulado") {
    return rawName;
  }

  const shortId = record?.id
    ? String(record.id).split("-")[0]
    : String(index + 1).padStart(4, "0");

  return `Patient #${shortId}`;
}

function formatDate(dateString) {
  if (!dateString) return "No date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

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


function getDailyStats(records) {
  const map = new Map();

  records.forEach((record) => {
    if (!record.created_at) return;

    const key = new Date(record.created_at).toISOString().slice(0, 10);
    const color = normalizeColor(record.color);
    const text = [
      record.sintomas,
      record.mensaje,
      Array.isArray(record.reasons) ? record.reasons.join(" ") : "",
      Array.isArray(record.red_flags) ? record.red_flags.join(" ") : "",
    ]
      .join(" ")
      .toLowerCase();

    if (!map.has(key)) {
      map.set(key, {
        day: key,
        total: 0,
        red: 0,
        yellow: 0,
        green: 0,
        respiratory: 0,
        gastro: 0,
        heat: 0,
      });
    }

    const item = map.get(key);

    item.total += 1;

    if (color === "RED") item.red += 1;
    if (color === "YELLOW") item.yellow += 1;
    if (color === "GREEN") item.green += 1;

    if (
      text.includes("cough") ||
      text.includes("fever") ||
      text.includes("breath") ||
      text.includes("respiratory") ||
      text.includes("sore throat")
    ) {
      item.respiratory += 1;
    }

    if (
      text.includes("vomit") ||
      text.includes("diarrhea") ||
      text.includes("stomach") ||
      text.includes("abdominal") ||
      text.includes("gastro")
    ) {
      item.gastro += 1;
    }

    if (
      text.includes("heat") ||
      text.includes("thirst") ||
      text.includes("dry skin") ||
      text.includes("collapse")
    ) {
      item.heat += 1;
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.day) - new Date(b.day)
  );
}

function StatCard({ title, value, description, color, footer }) {
  const styles = {
    RED: {
      badge: "bg-red-50 text-red-700 border-red-200",
      dot: "bg-red-500",
    },
    YELLOW: {
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    },
    GREEN: {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    },
    BLUE: {
      badge: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
    },
    PURPLE: {
      badge: "bg-violet-50 text-violet-700 border-violet-200",
      dot: "bg-violet-500",
    },
  };

  const current = styles[color] || styles.BLUE;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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
}

function FilterButton({ href, active, children }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${active
        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
        : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        }`}
    >
      {children}
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
                    height: `${item.total ? (item.red / item.total) * 100 : 0}%`,
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
  return (
    <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">
        Triage distribution
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Current severity mix across all loaded records.
      </p>

      <div className="mt-6 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        <div className="flex h-5 w-full">
          <div
            className="bg-red-500"
            style={{
              width: `${total ? (redCount / total) * 100 : 0}%`,
            }}
          />
          <div
            className="bg-amber-400"
            style={{
              width: `${total ? (yellowCount / total) * 100 : 0}%`,
            }}
          />
          <div
            className="bg-emerald-500"
            style={{
              width: `${total ? (greenCount / total) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
        <span>
          <span className="mr-2 inline-block h-3 w-3 rounded-full bg-red-500" />
          RED: {redCount}
        </span>

        <span>
          <span className="mr-2 inline-block h-3 w-3 rounded-full bg-amber-400" />
          YELLOW: {yellowCount}
        </span>

        <span>
          <span className="mr-2 inline-block h-3 w-3 rounded-full bg-emerald-500" />
          GREEN: {greenCount}
        </span>
      </div>
    </section>
  );
}

function RecentRecordsTable({ records }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Recent records
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest patients registered in the triage system.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Patient</th>
              <th className="px-4 py-3 font-semibold">Symptoms</th>
              <th className="px-4 py-3 font-semibold">Triage level</th>
              <th className="px-4 py-3 font-semibold">Time</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {records.map((record, index) => {
              const color = normalizeColor(record.color);

              const badgeClass =
                color === "RED"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : color === "YELLOW"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700";

              return (
                <tr key={record.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {getPatientDisplayName(record, index)}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {record.sintomas || "Not specified"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${badgeClass}`}
                    >
                      {color || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-500">
                    {formatDate(record.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }) {
  const params = await searchParams;
  const selectedColor = normalizeColor(params?.color || "ALL");

  const { records, error } = await fetchAllTriageRecords();

  if (error) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
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
      </main>
    );
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

  const filteredRecords =
    selectedColor === "ALL"
      ? allRecords
      : allRecords.filter(
        (record) => normalizeColor(record.color) === selectedColor
      );

  const criticalAlerts = allRecords
    .filter((record) => normalizeColor(record.color) === "RED")
    .slice(0, 5);

  const chartData = getLastDaysData(allRecords, 14);
  const recentRecords = filteredRecords.slice(0, 10);
  const anomalyInsights = getAnomalyInsights(allRecords);
  const topClinicalPattern = getTopClinicalPattern(allRecords);

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              ← Back to home
            </Link>
          </div>

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
          />

          <StatCard
            title="Moderate cases"
            value={yellowCount}
            description={`${formatPercent(
              yellowPercentage
            )} may require same-day or scheduled care`}
            color="YELLOW"
            footer="Clinical follow-up suggested"
          />

          <StatCard
            title="Low-risk cases"
            value={greenCount}
            description={`${formatPercent(
              greenPercentage
            )} suitable for non-urgent guidance`}
            color="GREEN"
            footer="Routine care pathway"
          />

          <StatCard
            title="Top pattern"
            value={topClinicalPattern.count}
            description={topClinicalPattern.label}
            color="PURPLE"
            footer="Derived from symptoms and red flags"
          />
        </section>

        <section className="mb-8 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <CasesChart data={chartData} />
          <AlertsList alerts={criticalAlerts} />
        </section>

        <section className="mb-8">
          <AnomalyInsights insights={anomalyInsights} />
        </section>

        <TriageDistribution
          total={total}
          redCount={redCount}
          yellowCount={yellowCount}
          greenCount={greenCount}
        />

        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Filter recent records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current table view:{" "}
                {selectedColor === "ALL" ? "All records" : selectedColor} · Showing{" "}
                <span className="font-semibold text-slate-700">
                  {recentRecords.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {filteredRecords.length}
                </span>{" "}
                matching records
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <FilterButton href="/dashboard" active={selectedColor === "ALL"}>
                All
              </FilterButton>

              <FilterButton
                href="/dashboard?color=RED"
                active={selectedColor === "RED"}
              >
                RED
              </FilterButton>

              <FilterButton
                href="/dashboard?color=YELLOW"
                active={selectedColor === "YELLOW"}
              >
                YELLOW
              </FilterButton>

              <FilterButton
                href="/dashboard?color=GREEN"
                active={selectedColor === "GREEN"}
              >
                GREEN
              </FilterButton>
            </div>
          </div>
        </section>

        <RecentRecordsTable records={recentRecords} />
      </div>
    </main>
  );
}