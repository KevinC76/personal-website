import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "@/lib/config";
export async function serverSupabase() {
  const { url, key } = supabaseConfig();
  const jar = await cookies();
  return createServerClient(url, key, {
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: AbortSignal.any([
            AbortSignal.timeout(30000),
            ...(init?.signal ? [init.signal] : []),
          ]),
        }),
    },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          );
        } catch {
          /* Server Component writes are handled by the auth proxy. */
        }
      },
    },
  });
}
