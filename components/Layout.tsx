import BottomNav from "./BottomNav";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="mx-auto min-h-screen max-w-lg pb-32">
      {/* Top padding clears the status bar on a standalone iOS install. */}
      <main className="px-5 pt-[max(3.5rem,env(safe-area-inset-top))]">{children}</main>
      <BottomNav />
    </div>
  );
}
