import { useState } from "react";
import { useRouter } from "next/router";
import { Dumbbell } from "lucide-react";
import { useAuth } from "./_app";
import { fieldClass } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

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
  // Validation surfaces per field as you leave it, not in a lump on submit.
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const emailError = touched.email && email.length > 0 && !/^\S+@\S+\.\S+$/.test(email) ? "That email doesn't look right." : "";
  const passwordError = touched.password && password.length > 0 && password.length < 6 ? "At least 6 characters." : "";

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

  const markTouched = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6">
      <div className="animate-fade-in flex w-full max-w-[20rem] flex-col items-center">
        <div className="glass mb-7 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.375rem]">
          <Dumbbell size={32} className="text-emerald-600" />
        </div>

        <h1 className="text-title-lg text-center">Gym Tracker</h1>
        <p className="text-caption mt-2 max-w-[16rem] text-center">
          {mode === "login" ? "Welcome back. Sign in to continue." : "Create an account to get started."}
        </p>

        <form onSubmit={handleSubmit} className="mt-7 w-full space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={fieldClass}
            />
          )}

          <div>
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => markTouched("email")}
              required
              aria-invalid={!!emailError}
              className={cn(fieldClass, emailError && "ring-2 ring-red-500/40")}
            />
            {emailError && <p className="mt-1.5 px-1 text-[0.8125rem] text-red-500">{emailError}</p>}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => markTouched("password")}
              required
              minLength={6}
              aria-invalid={!!passwordError}
              className={cn(fieldClass, passwordError && "ring-2 ring-red-500/40")}
            />
            {passwordError && <p className="mt-1.5 px-1 text-[0.8125rem] text-red-500">{passwordError}</p>}
          </div>

          {error && (
            <p role="alert" className="pt-1 text-center text-[0.8125rem] text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="pressable flex w-full items-center justify-center rounded-full bg-emerald-500 py-3.5 text-[1.0625rem] font-semibold tracking-[-0.01em] text-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_14px_-4px_rgba(16,185,129,0.5)] hover:bg-emerald-600 active:bg-emerald-600 disabled:opacity-40"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : mode === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setTouched({}); }}
          className="pressable mt-6 rounded-full px-4 py-2 text-[0.9375rem] text-[color:var(--ink-tertiary)] transition-colors hover:text-[color:var(--ink)]"
        >
          {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

LoginPage.getLayout = (page: React.ReactElement) => page;
