import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Sheet from "@/components/ui/Sheet";
import { List, ListRow } from "@/components/ui/List";
import ProfileSetup from "@/components/calories/ProfileSetup";
import { useAuth } from "@/pages/_app";
import { calculateTDEE, calculateGoalCalories, type Sex, type ActivityLevel, type GoalType } from "@/lib/formulas";
import { Target } from "lucide-react";

interface Profile {
  age: number;
  sex: string;
  heightCm: number;
  weightKg: number;
  activityLevel: string;
  calorieGoal: number;
  goalType: string;
}

interface AccountUI {
  /** Open the account sheet on its main view. */
  openAccount: () => void;
  /** Open the account sheet directly on Profile & Goals. */
  openProfile: () => void;
  /** Increments whenever the profile is saved — pages watching calorie goals
   *  refetch on this instead of polling. */
  profileVersion: number;
}

const AccountUIContext = createContext<AccountUI>({
  openAccount: () => {},
  openProfile: () => {},
  profileVersion: 0,
});

export const useAccountUI = () => useContext(AccountUIContext);

type View = "main" | "profile";

/**
 * One account surface for the whole app.
 *
 * Everything that is about *you* rather than about a day's logging lives here:
 * identity, the profile numbers that drive the calorie target, and the way
 * out. Previously the profile setup hid behind a gear inside Calories — a
 * setting you'd visit twice a year occupying chrome you saw every day.
 */
export default function AccountProvider({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("main");
  // Remembers whether Profile was opened directly (deep link from an empty
  // state) — Back then dismisses rather than revealing a view you never saw.
  const [entryView, setEntryView] = useState<View>("main");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);
  const submitRef = useRef<(() => void) | null>(null);

  const openAccount = useCallback(() => {
    setView("main");
    setEntryView("main");
    setOpen(true);
  }, []);

  const openProfile = useCallback(() => {
    setView("profile");
    setEntryView("profile");
    setOpen(true);
  }, []);

  // Fetch current values when the sheet opens so the form starts from what is
  // actually saved, not from stale state.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setProfileLoaded(false);
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setProfileLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setProfileLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const saveProfile = async (data: {
    age: number;
    sex: string;
    heightCm: number;
    weightKg: number;
    activityLevel: string;
    goalType: string;
  }) => {
    const tdee = calculateTDEE(data.weightKg, data.heightCm, data.age, data.sex as Sex, data.activityLevel as ActivityLevel);
    const calorieGoal = calculateGoalCalories(tdee, data.goalType as GoalType);
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, calorieGoal }),
    });
    setProfileVersion((v) => v + 1);
    setOpen(false);
  };

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";

  const isProfile = view === "profile";

  return (
    <AccountUIContext.Provider value={{ openAccount, openProfile, profileVersion }}>
      {children}

      <Sheet
        open={open}
        title={isProfile ? "Profile & Goals" : "Account"}
        onClose={() => setOpen(false)}
        cancelLabel={isProfile && entryView === "main" ? "Back" : isProfile ? "Cancel" : "Done"}
        onCancel={isProfile && entryView === "main" ? () => setView("main") : undefined}
        confirm={isProfile ? { label: "Save", onConfirm: () => submitRef.current?.() } : undefined}
      >
        {isProfile ? (
          <div className="pb-2">
            {profileLoaded ? (
              <ProfileSetup
                key={profileVersion}
                initial={profile ?? undefined}
                onSave={saveProfile}
                submitRef={submitRef}
              />
            ) : (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            )}
          </div>
        ) : (
          <div className="pb-2">
            <div className="mb-6 flex flex-col items-center pt-2">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[1.375rem] font-semibold text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]">
                {initials}
              </div>
              <h3 className="text-title-md">{user?.name}</h3>
              <p className="text-caption mt-0.5">{user?.email}</p>
            </div>

            <List
              footer={
                profileLoaded && profile?.calorieGoal
                  ? `Daily target ${profile.calorieGoal} kcal. It recalculates when your logged weight changes.`
                  : "Set your age, height and weight to get a daily calorie target."
              }
            >
              <ListRow
                icon={<Target size={16} className="text-emerald-600" />}
                iconBg="bg-emerald-500/15"
                title="Profile & Goals"
                subtitle="Age, height, weight, activity and goal"
                onClick={() => setView("profile")}
                last
              />
            </List>

            <List footer="Signing out keeps your data — it stays on the server and returns when you sign back in.">
              <ListRow title="Sign out" destructive onClick={logout} chevron={false} last />
            </List>
          </div>
        )}
      </Sheet>
    </AccountUIContext.Provider>
  );
}
