import { sql } from "drizzle-orm";
import {
  index,
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(), // JSON stored as text
    expire: integer("expire").notNull(), // Unix timestamp
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with authentication
export const users = sqliteTable("users", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  email: text("email").unique().notNull(),
  password: text("password").notNull(), // Hashed password
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("customer_operator"), // administrator, customer_operator, factory_operator, warehouse_keeper, site_master
  isActive: text("is_active").notNull().default("true"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

// Element status values (SQLite doesn't have enums)
export const elementStatusValues = [
  "production",
  "ready_to_ship", 
  "in_transit",
  "in_storage",
  "in_assembly",
  "in_operation",
] as const;

// Element type values (SQLite doesn't have enums)
export const elementTypeValues = [
  "beam",
  "column", 
  "truss",
  "connection",
] as const;

// Control points
export const controlPoints = sqliteTable("control_points", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  name: text("name").notNull(),
  type: text("type").notNull(), // factory, storage, usage_site
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

// Metal structure elements
export const elements = sqliteTable("elements", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  code: text("code").notNull().unique(), // Unique DataMatrix code
  type: text("type").notNull(),
  status: text("status").notNull().default("production"),
  drawing: text("drawing"), // Technical drawing reference
  batch: text("batch"), // Production batch
  gost: text("gost"), // GOST standard
  length: real("length"),
  width: real("width"),
  height: real("height"),
  weight: real("weight"),
  currentLocationId: text("current_location_id"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

// Movement tracking
export const movements = sqliteTable("movements", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  elementId: text("element_id").notNull(),
  fromLocationId: text("from_location_id"),
  toLocationId: text("to_location_id").notNull(),
  operation: text("operation").notNull(), // reception, shipping, inventory
  operatorId: text("operator_id").notNull(),
  comments: text("comments"),
  photoUrl: text("photo_url"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  timestamp: integer("timestamp").default(sql`(unixepoch())`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  movements: many(movements),
}));

export const elementsRelations = relations(elements, ({ one, many }) => ({
  currentLocation: one(controlPoints, {
    fields: [elements.currentLocationId],
    references: [controlPoints.id],
  }),
  movements: many(movements),
}));

export const controlPointsRelations = relations(controlPoints, ({ many }) => ({
  elementsAtLocation: many(elements),
  movementsFrom: many(movements, { relationName: "movementsFrom" }),
  movementsTo: many(movements, { relationName: "movementsTo" }),
}));

export const movementsRelations = relations(movements, ({ one }) => ({
  element: one(elements, {
    fields: [movements.elementId],
    references: [elements.id],
  }),
  fromLocation: one(controlPoints, {
    fields: [movements.fromLocationId],
    references: [controlPoints.id],
    relationName: "movementsFrom",
  }),
  toLocation: one(controlPoints, {
    fields: [movements.toLocationId],
    references: [controlPoints.id],
    relationName: "movementsTo",
  }),
  operator: one(users, {
    fields: [movements.operatorId],
    references: [users.id],
  }),
}));

// Product catalog table for customer operators
export const products = sqliteTable("products", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // beam, column, truss, connection, slab
  price: real("price").notNull(),
  weight: real("weight"),
  dimensions: text("dimensions"), // stored as JSON string
  imageUrl: text("image_url"),
  gost: text("gost"),
  specifications: text("specifications"), // technical specifications
  inStock: integer("in_stock").notNull().default(0),
  isActive: text("is_active").notNull().default("true"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

// Orders table - updated with factory support and production workflow
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  orderNumber: text("order_number").notNull().unique(),
  customerId: text("customer_id").notNull(),
  factoryId: text("factory_id"), // Reference to assigned factory
  status: text("status").notNull().default("draft"), // draft, sent_to_factory, new, in_production, ready_to_ship, shipped, delivered, cancelled
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  totalAmount: real("total_amount").notNull().default(0),
  deadline: integer("deadline"), // Unix timestamp for delivery deadline
  notes: text("notes"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

// Order items table - updated with production tracking
export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  orderId: text("order_id").notNull(),
  productId: text("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
  specifications: text("specifications"), // Additional specs for this order item
  status: text("status").notNull().default("pending"), // pending, in_production, completed
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

// Shopping cart table
export const cartItems = sqliteTable("cart_items", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  userId: text("user_id").notNull(),
  productId: text("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

// Factories table
export const factories = sqliteTable("factories", {
  id: text("id").primaryKey().default(sql`(hex(randomblob(16)))`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  address: text("address").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  capacity: integer("capacity").notNull(),
  specializations: text("specializations").notNull(), // JSON array of product categories
  isActive: text("is_active").notNull().default("true"),
  createdAt: integer("created_at").default(sql`(unixepoch())`),
});

// Additional relations
export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  cartItems: many(cartItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
  factory: one(factories, {
    fields: [orders.factoryId],
    references: [factories.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

// Factory relations
export const factoriesRelations = relations(factories, ({ many }) => ({
  orders: many(orders),
}));

// Insert schemas
export const insertElementSchema = createInsertSchema(elements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMovementSchema = createInsertSchema(movements).omit({
  id: true,
  timestamp: true,
});

export const insertControlPointSchema = createInsertSchema(controlPoints).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

export const registerSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  firstName: z.string().min(1, "Имя обязательно"),
  lastName: z.string().min(1, "Фамилия обязательна"),
  role: z.enum(["administrator", "customer_operator", "factory_operator", "warehouse_keeper", "site_master"]).default("customer_operator"),
});

// New schemas for products and orders
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Factory insert schema
export const insertFactorySchema = createInsertSchema(factories).omit({
  id: true,
  createdAt: true,
});

// Updated order schema to include new fields
export const updateOrderSchema = z.object({
  orderNumber: z.string().optional(),
  factoryId: z.string().optional(),
  status: z.enum(["draft", "sent_to_factory", "new", "in_production", "ready_to_ship", "shipped", "delivered", "cancelled"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  deadline: z.number().optional(),
  notes: z.string().optional(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, 'password'>; // User without password for frontend
export type Element = typeof elements.$inferSelect;
export type InsertElement = z.infer<typeof insertElementSchema>;
export type Movement = typeof movements.$inferSelect;
export type InsertMovement = z.infer<typeof insertMovementSchema>;
export type ControlPoint = typeof controlPoints.$inferSelect;
export type InsertControlPoint = z.infer<typeof insertControlPointSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Factory = typeof factories.$inferSelect;
export type InsertFactory = z.infer<typeof insertFactorySchema>;
export type UpdateOrder = z.infer<typeof updateOrderSchema>;

// Role constants for easy reference
export const UserRoles = {
  ADMINISTRATOR: "administrator",
  CUSTOMER_OPERATOR: "customer_operator",
  FACTORY_OPERATOR: "factory_operator",
  WAREHOUSE_KEEPER: "warehouse_keeper",
  SITE_MASTER: "site_master"
} as const;
