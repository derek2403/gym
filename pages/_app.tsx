import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import Head from "next/head";
import { useEffect, useState, createContext, useContext } from "react";
import { useRouter } from "next/router";
import type { ReactElement, ReactNode } from "react";
import type { NextPage } from "next";

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    setUser(null);
    router.replace("/login");
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!loading && !user && router.pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, loading, router]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout;

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#f7f7fa" />
        <title>Gym Tracker</title>
      </Head>
      <AppContent Component={Component} pageProps={pageProps} getLayout={getLayout} />
    </AuthProvider>
  );
}

function AppContent({ Component, pageProps, getLayout }: {
  Component: NextPageWithLayout;
  pageProps: any;
  getLayout?: (page: ReactElement) => ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!user && router.pathname !== "/login") return null;

  if (getLayout) return <>{getLayout(<Component {...pageProps} />)}</>;

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
