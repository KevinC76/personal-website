"use client";
import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "@/lib/config";
let instance: ReturnType<typeof createBrowserClient> | undefined;
export function browserSupabase() {
  const { url, key } = supabaseConfig();
  return (instance ??= createBrowserClient(url, key));
}
