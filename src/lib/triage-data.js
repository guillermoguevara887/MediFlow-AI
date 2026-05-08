import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
      return { records: [], error };
    }

    allRecords = [...allRecords, ...(data || [])];

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return { records: allRecords, error: null };
}