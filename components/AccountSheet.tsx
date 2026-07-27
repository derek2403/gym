import Sheet from "@/components/ui/Sheet";
import { List, ListRow } from "@/components/ui/List";
import { useAuth } from "@/pages/_app";

/**
 * The account sheet, reached from the avatar in the nav bar.
 *
 * Signing out was previously unreachable — the handler existed but nothing in
 * the interface called it. Every app owes the user a way back out.
 */
export default function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();

  return (
    <Sheet open={open} title="Account" onClose={onClose}>
      <div className="pb-2">
        <div className="mb-6 flex flex-col items-center pt-2">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[1.375rem] font-semibold text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]">
            {user?.name
              ?.split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join("") || "?"}
          </div>
          <h3 className="text-title-md">{user?.name}</h3>
          <p className="text-caption mt-0.5">{user?.email}</p>
        </div>

        <List footer="Signing out keeps your data — it stays on the server and returns when you sign back in.">
          <ListRow title="Sign out" destructive onClick={logout} chevron={false} last />
        </List>
      </div>
    </Sheet>
  );
}
