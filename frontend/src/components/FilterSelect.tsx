type Props = {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

export default function FilterSelect({ value, onChange, options }: Props) {
  return (
    <div className="relative mt-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--bg)] py-2.5 pr-10 pl-3 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)] focus:ring-1 focus:ring-[color:var(--accent)]/30"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[color:var(--surface-raised)] text-[color:var(--ink)]">
            {opt.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[color:var(--muted)]">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  )
}

function FilterToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg)] px-3 py-3 transition hover:border-[color:var(--border-strong)]">
      <div>
        <p className="text-sm font-medium text-[color:var(--ink)]">{title}</p>
        <p className="text-xs text-[color:var(--muted)]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[color:var(--accent)]' : 'bg-[color:var(--toggle-off)]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  )
}

export { FilterToggle }
