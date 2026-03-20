import BottomNav from "./BottomNav";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="mx-auto min-h-screen max-w-lg pb-20">
      <main className="px-4 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}
