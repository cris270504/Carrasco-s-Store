import { relations } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
 
// ============================================================
// ENUMS
// ============================================================
export const itemTypeEnum = pgEnum('item_type', ['service', 'physical', 'digital'])
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending', 'confirmed', 'in_progress', 'completed', 'cancelled',
])
export const bookingModalityEnum = pgEnum('booking_modality', ['remote', 'in_person'])
export const orderStatusEnum = pgEnum('order_status', [
  'pending_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'refunded',
])
export const licenseStatusEnum = pgEnum('license_status', ['available', 'reserved', 'delivered'])
 
// ============================================================
// CATÁLOGO
// ============================================================
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 140 }).notNull().unique(),
  parentId: uuid('parent_id'),
}).enableRLS()
 
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => categories.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 280 }).notNull().unique(),
  description: text('description'),
  brand: varchar('brand', { length: 120 }),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  type: itemTypeEnum('type').notNull().default('physical'),
  stock: integer('stock').default(0), // solo aplica a physical (variantId null)
  requiresShipping: boolean('requires_shipping').default(true),
  // specs libres para faceted search: { "capacidad": "1TB", "compatibilidad": "PS5" }
  specs: jsonb('specs').$type<Record<string, string | number | boolean>>().default({}),
  images: jsonb('images').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('products_category_idx').on(table.categoryId),
  typeIdx: index('products_type_idx').on(table.type),
  brandIdx: index('products_brand_idx').on(table.brand),
})).enableRLS()
 
// Variantes para productos físicos (capacidad, color, talla...)
export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(), // "Capacidad"
  value: varchar('value', { length: 120 }).notNull(), // "1TB"
  priceModifier: decimal('price_modifier', { precision: 10, scale: 2 }).default('0'),
  stock: integer('stock').default(0),
  sku: varchar('sku', { length: 100 }),
}).enableRLS()
 
// Códigos/licencias para productos digitales
export const digitalLicenses = pgTable('digital_licenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  code: text('code').notNull(), // cifrar a nivel de aplicación antes de guardar
  status: licenseStatusEnum('status').notNull().default('available'),
  orderItemId: uuid('order_item_id'),
  deliveredAt: timestamp('delivered_at'),
}).enableRLS()
 
// Detalle de servicios técnicos (agendamiento)
export const serviceDetails = pgTable('service_details', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }).unique(),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  defaultModality: bookingModalityEnum('default_modality').notNull().default('remote'),
}).enableRLS()
 
// ============================================================
// USUARIOS Y DIRECCIONES
// (userId referencia auth.users de Supabase; sin FK física por vivir en otro schema)
// ============================================================
export const addresses = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  fullName: varchar('full_name', { length: 200 }).notNull(),
  line1: varchar('line1', { length: 255 }).notNull(),
  line2: varchar('line2', { length: 255 }),
  city: varchar('city', { length: 120 }).notNull(),
  region: varchar('region', { length: 120 }),
  country: varchar('country', { length: 2 }).notNull().default('PE'),
  phone: varchar('phone', { length: 30 }),
  isDefault: boolean('is_default').default(false),
}).enableRLS()
 
// ============================================================
// CARRITO
// ============================================================
export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'), // null = invitado, se identifica por sessionId
  sessionId: varchar('session_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()
 
export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  variantId: uuid('variant_id').references(() => productVariants.id),
  itemType: itemTypeEnum('item_type').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  // solo relevante si itemType = 'service'
  preferredScheduleAt: timestamp('preferred_schedule_at'),
  preferredModality: bookingModalityEnum('preferred_modality'),
}).enableRLS()
 
// ============================================================
// ÓRDENES
// ============================================================
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  status: orderStatusEnum('status').notNull().default('pending_payment'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 10, scale: 2 }).notNull().default('0'),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  shippingAddressId: uuid('shipping_address_id').references(() => addresses.id),
  mpPaymentId: varchar('mp_payment_id', { length: 100 }),
  mpPreferenceId: varchar('mp_preference_id', { length: 100 }),
  paymentStatus: varchar('payment_status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('orders_user_idx').on(table.userId),
})).enableRLS()
 
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  variantId: uuid('variant_id').references(() => productVariants.id),
  itemType: itemTypeEnum('item_type').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  digitalLicenseId: uuid('digital_license_id').references(() => digitalLicenses.id),
}).enableRLS()
 
export const serviceBookings = pgTable('service_bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  productId: uuid('product_id').notNull().references(() => products.id),
  scheduledAt: timestamp('scheduled_at'),
  modality: bookingModalityEnum('modality').notNull(),
  status: bookingStatusEnum('status').notNull().default('pending'),
  notes: text('notes'),
}).enableRLS()
 
// ============================================================
// RELATIONS (para queries anidadas con db.query.products.findMany({ with: {...} }))
// ============================================================
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  variants: many(productVariants),
  licenses: many(digitalLicenses),
  serviceDetail: one(serviceDetails, { fields: [products.id], references: [serviceDetails.productId] }),
}))
 
export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}))
 
export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [cartItems.variantId], references: [productVariants.id] }),
}))
 
export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  shippingAddress: one(addresses, { fields: [orders.shippingAddressId], references: [addresses.id] }),
}))
 
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  booking: one(serviceBookings, { fields: [orderItems.id], references: [serviceBookings.orderItemId] }),
}))

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { 
    fields: [productVariants.productId], 
    references: [products.id] 
  }),
}))

export const digitalLicensesRelations = relations(digitalLicenses, ({ one }) => ({
  product: one(products, { 
    fields: [digitalLicenses.productId], 
    references: [products.id] 
  }),
}))

export const serviceDetailsRelations = relations(serviceDetails, ({ one }) => ({
  product: one(products, { 
    fields: [serviceDetails.productId], 
    references: [products.id] 
  }),
}))