import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../auth/AuthContext'

type Props = {
  open: boolean
  onClose: () => void
}

export default function LoginModal({ open, onClose }: Props) {
  const { login } = useAuth()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await login(username.trim(), password)
      setPassword('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logowanie nieudane')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[3000] flex items-end justify-center p-4 sm:items-center">
      <button type="button" aria-label="Zamknij" className="absolute inset-0 bg-[color:var(--overlay)] backdrop-blur-[2px]" onClick={onClose} />
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-[color:var(--border-strong)] bg-[color:var(--surface-raised)] p-5 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-[color:var(--ink)]">Logowanie admina</h2>
        <p className="mt-1 text-xs text-[color:var(--muted)]">Dodawanie, edycja i usuwanie lumpeksów.</p>

        <label className="mt-4 block text-[10px] font-medium uppercase tracking-wide text-[color:var(--muted)]">
          Login
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="mt-1.5 w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--bg)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
          />
        </label>

        <label className="mt-3 block text-[10px] font-medium uppercase tracking-wide text-[color:var(--muted)]">
          Hasło
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--bg)] px-3 py-2.5 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
          />
        </label>

        {error && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-[color:var(--danger)]">{error}</p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[color:var(--border-strong)] px-3 py-2.5 text-sm text-[color:var(--muted-light)] hover:text-[color:var(--ink)]"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={saving || !password}
            className="flex-1 rounded-xl bg-[color:var(--accent)] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[color:var(--accent-hover)] disabled:opacity-50"
          >
            {saving ? 'Loguję…' : 'Zaloguj'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
