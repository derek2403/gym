import { useState } from "react";
import { useRouter } from "next/router";
import { Dumbbell } from "lucide-react";
import { useAuth } from "./_app";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body = mode === "login" ? { email, password } : { name, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      await refresh();
      router.replace("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10">
        <Dumbbell size={36} className="text-emerald-500" />
      </div>
      <h1 className="text-title-lg text-center">Gym Tracker</h1>
      <p className="text-caption mt-3 text-center max-w-[260px]">
        {mode === "login" ? "Welcome back. Sign in to continue." : "Create an account to get started."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 w-full max-w-[320px] space-y-4">
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-2xl bg-black/[0.04] px-4 py-3.5 text-[17px] tracking-tight text-black/90 placeholder:text-black/25 outline-none focus:bg-black/[0.06] focus:ring-2 focus:ring-emerald-500/20"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-2xl bg-black/[0.04] px-4 py-3.5 text-[17px] tracking-tight text-black/90 placeholder:text-black/25 outline-none focus:bg-black/[0.06] focus:ring-2 focus:ring-emerald-500/20"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-2xl bg-black/[0.04] px-4 py-3.5 text-[17px] tracking-tight text-black/90 placeholder:text-black/25 outline-none focus:bg-black/[0.06] focus:ring-2 focus:ring-emerald-500/20"
        />

        {error && <p className="text-[13px] text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-full bg-emerald-500 py-3.5 text-[17px] font-semibold text-white tracking-tight shadow-sm transition-all active:scale-[0.96] hover:bg-emerald-600 disabled:opacity-40"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            mode === "login" ? "Sign in" : "Create account"
          )}
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
        className="mt-6 text-[15px] text-black/40 transition-colors hover:text-black/60"
      >
        {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

LoginPage.getLayout = (page: React.ReactElement) => page;
