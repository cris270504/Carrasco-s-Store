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
  uniqueIndex,
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
  // Costo de adquisicion vigente (lo que Carrasco Store paga al proveedor).
  // Nullable: los servicios y productos sin costo cargado quedan en null y
  // cuentan como costo 0 en el margen. Se snapshotea en order_items.unitCost /
  // manual_sales.unitCost al concretar cada venta para que el margen
  // historico no cambie si despues se actualiza este valor.
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  supplierId: uuid('supplier_id').references(() => suppliers.id),
  costUpdatedAt: timestamp('cost_updated_at'),
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
}, (table) => ({
  // Usado por el SELECT...FOR UPDATE SKIP LOCKED de fulfillDigital en cada
  // compra digital (server/utils/fulfillment.ts): sin este indice compuesto,
  // Postgres escanea todas las licencias del producto en cada intento de reclamo.
  productStatusIdx: index('digital_licenses_product_status_idx').on(table.productId, table.status),
})).enableRLS()
 
// Detalle de servicios técnicos (agendamiento)
export const serviceDetails = pgTable('service_details', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }).unique(),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  defaultModality: bookingModalityEnum('default_modality').notNull().default('remote'),
}).enableRLS()
 
// ============================================================
// PROVEEDORES Y COSTOS
// ============================================================
export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 160 }).notNull().unique(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
}, (table) => ({
  userIdx: index('addresses_user_idx').on(table.userId),
})).enableRLS()

// ============================================================
// CARRITO
// ============================================================
export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'), // null = invitado, se identifica por sessionId
  sessionId: varchar('session_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // getOrCreateCart (server/utils/cart.ts) filtra por uno u otro en
  // practicamente cada request que toca el carrito.
  userIdx: index('carts_user_idx').on(table.userId),
  sessionIdx: index('carts_session_idx').on(table.sessionId),
})).enableRLS()

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
}, (table) => ({
  // getCartResponse/findCartItem (cada GET/POST/PATCH de carrito) y la
  // limpieza al eliminar un producto (admin/products/[id].delete.ts) filtran
  // por estas columnas.
  cartIdx: index('cart_items_cart_idx').on(table.cartId),
  productIdx: index('cart_items_product_idx').on(table.productId),
})).enableRLS()
 
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
  // Checkout API via Orders: mpOrderId es el id del recurso /v1/orders (ej.
  // "ORD01..."), mpPaymentId el id del cobro subyacente
  // (transactions.payments[0].id, util para conciliacion/reembolsos), y
  // mpPreferenceId solo se llena si se pudo crear una Preference para
  // habilitar el boton "Mercado Pago Wallet" (Yape) en el Brick.
  // Telefono opcional del comprador para el aviso de compra por WhatsApp
  // (los pedidos con envio fisico ya tienen el de la direccion; este cubre
  // los digitales/servicios).
  buyerPhone: varchar('buyer_phone', { length: 30 }),
  mpOrderId: varchar('mp_order_id', { length: 100 }),
  mpPaymentId: varchar('mp_payment_id', { length: 100 }),
  mpPreferenceId: varchar('mp_preference_id', { length: 100 }),
  // Estado de la ORDEN segun la Orders API (processed | failed | processing |
  // action_required | in_review | canceled | charged_back | expired |
  // created), NO los de la API de Pagos clasica. Solo informativo/para el
  // panel admin: orders.status se mueve unicamente cuando el pago queda
  // 'processed' (ver fulfillOrder).
  paymentStatus: varchar('payment_status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('orders_user_idx').on(table.userId),
})).enableRLS()

// Evidencia de posibles cobros duplicados: si llega una segunda confirmacion
// de pago (id de pago distinto) para una orden que ya no admite cobro, se
// registra aca para revision manual en vez de descartarla en silencio.
export const paymentReviewFlags = pgTable('payment_review_flags', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  mpOrderId: varchar('mp_order_id', { length: 100 }),
  mpPaymentId: varchar('mp_payment_id', { length: 100 }),
  reason: text('reason').notNull(),
  resolved: boolean('resolved').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('payment_review_flags_order_idx').on(table.orderId),
})).enableRLS()
 
export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  variantId: uuid('variant_id').references(() => productVariants.id),
  itemType: itemTypeEnum('item_type').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  // Costo unitario congelado en el momento del pago (copiado de
  // products.costPrice por fulfillOrder). Nullable para ordenes previas a
  // esta funcion; se toma como 0 en el calculo de margen.
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
  digitalLicenseId: uuid('digital_license_id').references(() => digitalLicenses.id),
}, (table) => ({
  // fulfillOrder busca por orderId en cada webhook aprobado; productHasSales
  // (server/utils/productSales.ts) busca por productId en cada carga del
  // listado admin y cada intento de eliminar un producto.
  orderIdx: index('order_items_order_idx').on(table.orderId),
  productIdx: index('order_items_product_idx').on(table.productId),
})).enableRLS()
 
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
// VENTAS PARTICULARES (fuera de la tienda)
// Registro manual de ventas hechas por WhatsApp, presencial, etc. Alimentan
// el dashboard de finanzas junto con las ordenes de la tienda. productId es
// opcional: se puede vender algo que no esta en el catalogo (description
// libre). unitCost se snapshotea al registrar (del producto o a mano).
// ============================================================
export const manualSaleChannelEnum = pgEnum('manual_sale_channel', [
  'whatsapp', 'presencial', 'redes', 'otro',
])

export const manualSales = pgTable('manual_sales', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id),
  description: varchar('description', { length: 255 }).notNull(),
  supplierId: uuid('supplier_id').references(() => suppliers.id),
  customerName: varchar('customer_name', { length: 200 }),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  channel: manualSaleChannelEnum('channel').notNull().default('whatsapp'),
  notes: text('notes'),
  soldAt: timestamp('sold_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  soldAtIdx: index('manual_sales_sold_at_idx').on(table.soldAt),
  productIdx: index('manual_sales_product_idx').on(table.productId),
})).enableRLS()

// ============================================================
// FAVORITOS
// ============================================================
export const favorites = pgTable('favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userProductUnique: uniqueIndex('favorites_user_product_unique').on(table.userId, table.productId),
  userIdx: index('favorites_user_idx').on(table.userId),
})).enableRLS()

// ============================================================
// CONFIGURACIÓN DE LA TIENDA
// Fila única (id=1) editable desde /admin/configuracion. Si no existe fila
// todavía, el backend usa el fallback de shared/utils/pricing.ts.
// ============================================================
export const storeSettings = pgTable('store_settings', {
  id: integer('id').primaryKey().default(1),
  shippingFlatRate: decimal('shipping_flat_rate', { precision: 10, scale: 2 }).notNull().default('15'),
  // Numero para el boton flotante de WhatsApp de la tienda (link wa.me, NO la
  // Cloud API de avisos). Digitos en formato internacional sin '+', ej.
  // 51999888777. Vacio = el boton no se muestra.
  whatsappNumber: varchar('whatsapp_number', { length: 30 }),
  whatsappCta: varchar('whatsapp_cta', { length: 200 }),
  // Contador de ofertas del home: si offerCountdownEndsAt esta en el futuro se
  // muestra la banda; al vencer se oculta sola. Con timezone porque es un
  // instante absoluto que fija el admin (a diferencia de los createdAt).
  offerCountdownEndsAt: timestamp('offer_countdown_ends_at', { withTimezone: true }),
  offerCountdownTitle: varchar('offer_countdown_title', { length: 120 }),
  offerCountdownUrl: varchar('offer_countdown_url', { length: 255 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

// ============================================================
// RELATIONS (para queries anidadas con db.query.products.findMany({ with: {...} }))
// ============================================================
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  supplier: one(suppliers, { fields: [products.supplierId], references: [suppliers.id] }),
  variants: many(productVariants),
  licenses: many(digitalLicenses),
  serviceDetail: one(serviceDetails, { fields: [products.id], references: [serviceDetails.productId] }),
}))

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  products: many(products),
  manualSales: many(manualSales),
}))

export const manualSalesRelations = relations(manualSales, ({ one }) => ({
  product: one(products, { fields: [manualSales.productId], references: [products.id] }),
  supplier: one(suppliers, { fields: [manualSales.supplierId], references: [suppliers.id] }),
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

export const favoritesRelations = relations(favorites, ({ one }) => ({
  product: one(products, { fields: [favorites.productId], references: [products.id] }),
}))