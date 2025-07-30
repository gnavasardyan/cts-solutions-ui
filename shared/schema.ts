import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("auditor"), // administrator, factory_operator, warehouse_keeper, site_master, auditor
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Element status enum
export const elementStatusEnum = pgEnum("element_status", [
  "production",
  "ready_to_ship",
  "in_transit",
  "in_storage",
  "in_assembly",
  "in_operation",
]);

// Element type enum
export const elementTypeEnum = pgEnum("element_type", [
  "beam",
  "column", 
  "truss",
  "connection",
]);

// Control points
export const controlPoints = pgTable("control_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // factory, storage, usage_site
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Metal structure elements
export const elements = pgTable("elements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(), // Unique DataMatrix code
  type: elementTypeEnum("type").notNull(),
  status: elementStatusEnum("status").notNull().default("production"),
  drawing: varchar("drawing"), // Technical drawing reference
  batch: varchar("batch"), // Production batch
  gost: varchar("gost"), // GOST standard
  length: decimal("length", { precision: 10, scale: 2 }),
  width: decimal("width", { precision: 10, scale: 2 }),
  height: decimal("height", { precision: 10, scale: 2 }),
  weight: decimal("weight", { precision: 10, scale: 2 }),
  currentLocationId: varchar("current_location_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Movement tracking
export const movements = pgTable("movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  elementId: varchar("element_id").notNull(),
  fromLocationId: varchar("from_location_id"),
  toLocationId: varchar("to_location_id").notNull(),
  operation: varchar("operation").notNull(), // reception, shipping, inventory
  operatorId: varchar("operator_id").notNull(),
  comments: text("comments"),
  photoUrl: varchar("photo_url"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  timestamp: timestamp("timestamp").defaultNow(),
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

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Element = typeof elements.$inferSelect;
export type InsertElement = z.infer<typeof insertElementSchema>;
export type Movement = typeof movements.$inferSelect;
export type InsertMovement = z.infer<typeof insertMovementSchema>;
export type ControlPoint = typeof controlPoints.$inferSelect;
export type InsertControlPoint = z.infer<typeof insertControlPointSchema>;
