import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    "Supabase Admin credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
}

// Admin client for backend-only database interactions that bypass RLS
export const supabaseAdmin = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseServiceRoleKey || "placeholder-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
