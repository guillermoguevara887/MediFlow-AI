import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function normalizeColor(color) {
  return String(color || "").toUpperCase();
}

function formatDate(dateString) {
  if (!dateString) return "Sin fecha";

  return new Intl.DateTimeFormat("es-ES", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatShortDate(dateString) {
  if (!dateString) return "";

  return new Intl.DateTimeFormat("es-ES", {
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

function getLastDaysData(records, days = 14) {
  const map = new Map();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const key = date.toISOString().slice(0, 10);

    map.set(key, {
      day: key,
      total: 0,
    });
  }

  records.forEach((record) => {
    if (!record.created_at) return;

    const key = new Date(record.created_at).toISOString().slice(0, 10);

    if (map.has(key)) {
      map.get(key).total += 1;
    }
  });

  return Array.from(map.values());
}

function getPatientDisplayName(record, index = 0) {
  const rawName = String(record?.nombre || "").trim();

  if (rawName && rawName.toLowerCase() !== "paciente simulado") {
    return rawName;
  }

  const shortId = record?.id
    ? String(record.id).split("-")[0]
    : String(index + 1).padStart(4, "0");

  return `Paciente #${shortId}`;
}

function StatCard({ title, value, description, color }) {
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
  };

  const current = styles[color] || styles.BLUE;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            {value}
          </h2>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${current.badge}`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${current.dot}`} />
          {color}
        </div>
      </div>
    </div>
  );
}

function AlertsList({ alerts }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Alertas críticas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Casos RED más recientes que requieren revisión inmediata.
          </p>
        </div>

        <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
          EN VIVO
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          No hay alertas críticas por el momento.
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <div
              key={alert.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {getPatientDisplayName(alert, index)}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    <span className="font-medium text-slate-800">Síntomas:</span>{" "}
                    {alert.sintomas || "No especificados"}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {alert.mensaje || "Sin mensaje disponible"}
                  </p>
                </div>

                <div className="text-left md:text-right">
                  <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                    RED
                  </span>

                  <p className="mt-2 text-xs text-slate-500">
                    {formatDate(alert.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CasesChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.total), 1);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">
          Casos en el tiempo
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Registros de triaje generados durante los últimos 14 días.
        </p>
      </div>

      <div className="flex h-72 items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {data.map((item) => {
          const height = Math.max((item.total / maxValue) * 100, 4);

          return (
            <div
              key={item.day}
              className="flex h-full flex-1 flex-col items-center justify-end"
            >
              <div className="mb-2 text-xs font-medium text-slate-500">
                {item.total}
              </div>

              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-blue-400 transition-all"
                style={{ height: `${height}%` }}
                title={`${item.total} casos`}
              />

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

export default async function DashboardPage() {
  const { data: records, error } = await supabase
    .from("triage_records")
    .select("id, nombre, sintomas, color, mensaje, reasons, red_flags, created_at")
    .order("created_at", { ascending: false })
    .range(0, 2999);

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Error del dashboard
          </h1>
          <p className="mt-3 text-red-600">
            No se pudieron cargar los registros desde Supabase.
          </p>
          <pre className="mt-4 overflow-auto rounded-2xl bg-slate-50 p-4 text-sm text-red-700">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  const safeRecords = records || [];
  const total = safeRecords.length;

  const redCount = safeRecords.filter(
    (record) => normalizeColor(record.color) === "RED"
  ).length;

  const yellowCount = safeRecords.filter(
    (record) => normalizeColor(record.color) === "YELLOW"
  ).length;

  const greenCount = safeRecords.filter(
    (record) => normalizeColor(record.color) === "GREEN"
  ).length;

  const redPercentage = total > 0 ? ((redCount / total) * 100).toFixed(1) : "0";

  const criticalAlerts = safeRecords
    .filter((record) => normalizeColor(record.color) === "RED")
    .slice(0, 6);

  const chartData = getLastDaysData(safeRecords, 14);

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
              MediFlow AI Hospital Dashboard
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Resumen de triaje en tiempo real
            </h1>

            <p className="mt-3 max-w-3xl text-slate-600">
              Monitoreo de registros de pacientes para identificar distribución
              de severidad, casos críticos y comportamiento general del flujo
              hospitalario.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-right shadow-sm">
            <p className="text-sm text-slate-500">Total de registros</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{total}</p>
          </div>
        </section>

        <section className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Casos críticos"
            value={redCount}
            description={`${redPercentage}% del total de registros`}
            color="RED"
          />

          <StatCard
            title="Casos moderados"
            value={yellowCount}
            description="Pacientes que pueden requerir atención programada"
            color="YELLOW"
          />

          <StatCard
            title="Casos de bajo riesgo"
            value={greenCount}
            description="Pacientes aptos para orientación no urgente"
            color="GREEN"
          />

          <StatCard
            title="Estado del sistema"
            value="Activo"
            description="Validación sintética de triaje en ejecución"
            color="BLUE"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <CasesChart data={chartData} />
          <AlertsList alerts={criticalAlerts} />
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">
            Distribución del triaje
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Proporción actual de severidad sobre todos los registros cargados.
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
      </div>
    </main>
  );
}