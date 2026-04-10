import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="min-w-0 flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <ScrollRestoration />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            background: '#0f172a',
            color: '#fff',
          },
        }}
      />
    </div>
  )
}

