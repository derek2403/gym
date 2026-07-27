import BottomNav from "./BottomNav";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="mx-auto min-h-screen max-w-lg">
      {/* Bottom padding clears the tab bar plus the home indicator, so the last
          row of any list can still be reached and read. */}
      <main className="px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">{children}</main>
      <BottomNav />
    </div>
  );
}
