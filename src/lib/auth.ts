import { createClient } from "@/lib/supabase/server";

export type AuthView = {
  signedIn: boolean;
  username: string | null;
};

function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getAuthView(): Promise<AuthView> {
  if (!hasSupabaseConfig()) {
    return { signedIn: false, username: null };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { signedIn: false, username: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  return {
    signedIn: true,
    username: profile?.username ?? null
  };
}
