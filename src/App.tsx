import { Toaster } from 'react-hot-toast'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
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
    </AuthProvider>
  )
}
