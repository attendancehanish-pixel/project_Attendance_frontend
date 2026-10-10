import PageHeader from "../../../shared/components/PageHeader";
import { useAuth } from "../../../shared/context/AuthContext";
import AppearanceCard from "../components/AppearanceCard";
import ChangePasswordCard from "../components/ChangePasswordCard";

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Shared by the admin and staff layouts (route: /settings).
export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage your account security and how the portal looks."
      />

      <div className="space-y-5">
        <section className="flex items-center gap-4 rounded-2xl border border-ui-line bg-ui-surface p-5 sm:p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent">
            {initials(user?.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-ui-ink">{user?.name}</p>
            <p className="truncate text-sm text-ui-muted">{user?.email}</p>
            {user?.roles?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium capitalize text-accent-text"
                  >
                    {role.replace(/_/g, " ").toLowerCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <AppearanceCard />
        <ChangePasswordCard />
      </div>
    </div>
  );
}
