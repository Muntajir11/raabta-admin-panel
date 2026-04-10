export type GsmTier = 180 | 210 | 240

export type Product = {
  productId: string
  name: string
  category: string
  image: string
  basePrice: number
  sizes: string[]
  colors: string[]
  gsmOptions: Array<{ gsm: GsmTier; price: number; isActive?: boolean }>
  isActive: boolean
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'

export type OrderItem = {
  productId: string
  name: string
  size: string
  color: string
  gsm: GsmTier
  qty: number
  unitPrice: number
  designId?: string
}

export type Order = {
  id: string
  createdAt: string
  customerName: string
  customerEmail: string
  phone?: string
  city?: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  paymentStatus: PaymentStatus
  status: OrderStatus
  notes?: string
}

export type DesignView = 'front' | 'back' | 'profile-left' | 'profile-right'

export type DesignLayer =
  | {
      id: string
      type: 'image'
      x: number
      y: number
      width: number
      height: number
      rotation: number
      src: string
    }
  | {
      id: string
      type: 'text'
      x: number
      y: number
      width: number
      height: number
      rotation: number
      text: string
      fontFamily: string
      fontSize: number
      fill: string
      fontStyle: 'normal' | 'italic' | 'bold' | 'bold italic'
      align: 'left' | 'center' | 'right'
      verticalAlign: 'top' | 'middle' | 'bottom'
    }

export type CustomDesign = {
  id: string
  createdAt: string
  customerName: string
  customerEmail: string
  productId: string
  gsm: GsmTier
  sides: Array<{ view: DesignView; hasPrint: boolean; printSize: 'S' | 'M' | 'L' | 'XL' }>
  layersByView: Record<DesignView, DesignLayer[]>
  status: 'new' | 'reviewed' | 'approved' | 'rejected' | 'printed'
  totalRs: number
}

export type Customer = {
  id: string
  name: string
  email: string
  phone?: string
  city?: string
  createdAt: string
  ordersCount: number
  totalSpent: number
  tags?: string[]
}

export type InventorySku = {
  sku: string
  productId: string
  size: string
  color: string
  gsm: GsmTier
  onHand: number
  reserved: number
  reorderPoint: number
  updatedAt: string
}

export type Coupon = {
  code: string
  type: 'percent' | 'flat'
  value: number
  isActive: boolean
  startsAt?: string
  endsAt?: string
  minOrder?: number
  usageLimit?: number
  usedCount: number
}

export type SupportTicket = {
  id: string
  createdAt: string
  customerName: string
  customerEmail: string
  type: 'return' | 'exchange' | 'refund' | 'delivery' | 'custom-print'
  status: 'open' | 'in_progress' | 'resolved'
  orderId?: string
  summary: string
}

