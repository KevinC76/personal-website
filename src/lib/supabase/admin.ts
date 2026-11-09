import "server-only";
import { OWNER_EMAIL } from "@/lib/config";
import { serverSupabase } from "./server";
export async function requireAdmin() {
  const client = await serverSupabase();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (
    error ||
    !user ||
    user.email?.toLowerCase() !== OWNER_EMAIL ||
    !user.email_confirmed_at
  )
    throw new Error(
      "Your session has expired or this account is not authorized.",
    );
  const { data: allowed, error: permissionError } =
    await client.rpc("is_portfolio_admin");
  if (permissionError || allowed !== true)
    throw new Error("This account has not been granted CMS access.");
  return { client, user };
}
