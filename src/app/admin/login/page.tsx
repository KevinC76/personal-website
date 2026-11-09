import Link from "next/link";
import { isSupabaseConfigured, OWNER_EMAIL } from "@/lib/config";
import { login } from "../actions";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = isSupabaseConfigured();
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <Link href="/" className="eyebrow nav-link">
        ← Back to the newspaper
      </Link>
      <p className="eyebrow border-t-4 border-black pt-6 mt-12">
        Private editorial office
      </p>
      <h1 className="font-headline text-6xl italic my-6">
        Behind the edition.
      </h1>
      <p className="leading-relaxed mb-8">
        Manage the stories, images, and details that make up your portfolio.
      </p>
      {error && (
        <p role="alert" className="border-l-4 border-red-800 pl-4 mb-6">
          {error === "access"
            ? "This Google account has not been granted CMS access. The owner must be registered in Supabase first."
            : "Sign-in did not complete or your session expired. Please try again."}
        </p>
      )}
      {configured ? (
        <form action={login}>
          <button className="ink-button w-full" type="submit">
            Continue with Google →
          </button>
          <p className="text-sm mt-4">Authorized owner: {OWNER_EMAIL}</p>
        </form>
      ) : (
        <div role="status" className="border border-black/20 p-6">
          <h2 className="font-headline text-2xl mb-3">Cloud setup required</h2>
          <p className="text-sm leading-relaxed">
            Supabase has not been connected. Follow the repository setup guide
            to configure Google sign-in and register the owner. CMS access
            remains locked until setup is complete.
          </p>
        </div>
      )}
    </main>
  );
}
