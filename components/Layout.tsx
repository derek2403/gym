import BottomNav from "./BottomNav";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="mx-auto min-h-screen max-w-lg pb-32">
      <main className="px-5 pt-16">{children}</main>
      <BottomNav />
    </div>
  );
}
