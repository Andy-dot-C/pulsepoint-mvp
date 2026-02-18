import { AuthButtons } from "@/components/auth-buttons";

type AuthPageProps = {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

function asSingleValue(input: string | string[] | undefined): string {
  if (!input) return "/";
  return Array.isArray(input) ? input[0] ?? "/" : input;
}

function safeNext(nextPath: string): string {
  return nextPath.startsWith("/") ? nextPath : "/";
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const nextPath = safeNext(asSingleValue(resolvedSearchParams.next));

  return (
    <main className="page-shell auth-shell">
      <article className="detail-card">
        <h1>Sign in to PulsePoint</h1>
        <p className="poll-blurb">
          Vote, submit polls, and manage your anonymous username.
        </p>
        <AuthButtons nextPath={nextPath} />
      </article>
    </main>
  );
}
