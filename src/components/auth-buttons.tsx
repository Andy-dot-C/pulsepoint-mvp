"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthButtonsProps = {
  nextPath: string;
};

function safeNext(nextPath: string): string {
  return nextPath.startsWith("/") ? nextPath : "/";
}

export function AuthButtons({ nextPath }: AuthButtonsProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const next = safeNext(nextPath);

  async function signInWithMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setMessage("Magic link sent. Check your inbox.");
  }

  async function signInWithGoogle() {
    setMessage(null);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });

    if (signInError) {
      setError(signInError.message);
    }
  }

  return (
    <div className="auth-panel">
      <form onSubmit={signInWithMagicLink} className="auth-form">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
        <button type="submit">Send magic link</button>
      </form>

      <button type="button" className="oauth-btn" onClick={signInWithGoogle}>
        Continue with Google
      </button>

      {message ? <p className="auth-success">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  );
}
