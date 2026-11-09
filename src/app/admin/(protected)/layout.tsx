import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?error=access");
  }
  return children;
}
