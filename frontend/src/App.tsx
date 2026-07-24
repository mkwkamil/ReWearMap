import { Outlet } from 'react-router-dom'

export default function App() {
  return (
    <div className="min-h-screen max-w-[100vw] overflow-x-hidden bg-[color:var(--bg)] text-[color:var(--ink)]">
      <main className="mx-auto w-full min-w-0 max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        <Outlet />
      </main>
    </div>
  )
}
