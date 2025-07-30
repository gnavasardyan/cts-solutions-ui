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
  role: text("role").notNull().default("auditor"), // administrator, factory_operator, warehouse_keeper, site_master, auditor
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
  role: z.enum(["administrator", "factory_operator", "warehouse_keeper", "site_master", "auditor"]).default("auditor"),
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
