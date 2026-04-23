import { createBrowserRouter, Navigate } from 'react-router-dom'
import { GuestOnly } from '../components/GuestOnly'
import { RequireAdmin } from '../components/RequireAdmin'
import { AdminLayout } from '../components/layout/AdminLayout'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { OrdersPage } from '../pages/OrdersPage'
import { OrderDetailPage } from '../pages/OrderDetailPage'
import { ProductsPage } from '../pages/ProductsPage'
import { DesignsPage } from '../pages/DesignsPage'
import { CustomerDetailPage } from '../pages/CustomerDetailPage'
import { CustomersPage } from '../pages/CustomersPage'
import { InventoryPage } from '../pages/InventoryPage'
import { CouponsPage } from '../pages/CouponsPage'
import { AnalyticsPage } from '../pages/AnalyticsPage'
import { SettingsPage } from '../pages/SettingsPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestOnly>
        <LoginPage />
      </GuestOnly>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'orders/:orderNumber', element: <OrderDetailPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'designs', element: <DesignsPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/:userId', element: <CustomerDetailPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'coupons', element: <CouponsPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

