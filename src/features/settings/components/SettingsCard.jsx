export default function SettingsCard({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-ui-line bg-ui-surface p-5 sm:p-6">
      <header className="mb-5 flex items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
            <Icon size={18} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ui-ink">{title}</h3>
          {description && (
            <p className="mt-0.5 text-sm leading-5 text-ui-muted">{description}</p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}
