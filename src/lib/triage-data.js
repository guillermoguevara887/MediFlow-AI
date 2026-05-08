import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function normalizeArray(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) return parsed;
      if (parsed) return [parsed];

      return [];
    } catch {
      return value.trim() ? [value] : [];
    }
  }

  if (value) return [value];

  return [];
}

export function normalizeTriageRecord(record) {
  if (!record) return null;

  return {
    ...record,
    nombre: record.nombre || "Unknown patient",
    sintomas: record.sintomas || "No symptoms provided",
    color: record.color?.toUpperCase?.() || "GREEN",
    mensaje: record.mensaje || "No triage message available",
    reasons: normalizeArray(record.reasons),
    red_flags: normalizeArray(
      record.red_flags || record.red_flags_detected
    ),
  };
}

export async function fetchAllTriageRecords() {
  if (!supabase) {
    return {
      records: [],
      error: {
        message:
          "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY.",
      },
    };
  }

  const pageSize = 1000;
  const maxRecords = 6000;
  let allRecords = [];

  for (let from = 0; from < maxRecords; from += pageSize) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("triage_records")
      .select(
        "id, nombre, sintomas, color, mensaje, reasons, red_flags, created_at"
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching triage records:", error);

      return {
        records: [],
        error,
      };
    }

    allRecords = [...allRecords, ...(data || [])];

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return {
    records: allRecords.map(normalizeTriageRecord),
    error: null,
  };
}

export async function fetchTriageRecordById(id) {
  if (!supabase) {
    return {
      record: null,
      error: {
        message:
          "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY.",
      },
    };
  }

  if (!id) {
    return {
      record: null,
      error: {
        message: "Missing triage record id.",
      },
    };
  }

  const { data, error } = await supabase
    .from("triage_records")
    .select(
      "id, nombre, sintomas, color, mensaje, reasons, red_flags, created_at"
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching triage record by id:", error);

    return {
      record: null,
      error,
    };
  }

  return {
    record: normalizeTriageRecord(data),
    error: null,
  };
}