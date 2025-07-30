import {
  users,
  elements,
  movements,
  controlPoints,
  type User,
  type UpsertUser,
  type Element,
  type InsertElement,
  type Movement,
  type InsertMovement,
  type ControlPoint,
  type InsertControlPoint,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Element operations
  createElement(element: InsertElement): Promise<Element>;
  getElementById(id: string): Promise<Element | undefined>;
  getElementByCode(code: string): Promise<Element | undefined>;
  updateElementStatus(id: string, status: string, locationId?: string): Promise<void>;
  getElements(filters?: { status?: string; type?: string; locationId?: string }): Promise<Element[]>;
  
  // Movement operations
  createMovement(movement: InsertMovement): Promise<Movement>;
  getMovementsByElement(elementId: string): Promise<Movement[]>;
  getRecentMovements(limit?: number): Promise<Movement[]>;
  
  // Control point operations
  createControlPoint(controlPoint: InsertControlPoint): Promise<ControlPoint>;
  getControlPoints(): Promise<ControlPoint[]>;
  getControlPointById(id: string): Promise<ControlPoint | undefined>;
  
  // Dashboard stats
  getElementStats(): Promise<{
    totalElements: number;
    inOperation: number;
    inTransit: number;
    inStorage: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Element operations
  async createElement(element: InsertElement): Promise<Element> {
    const [newElement] = await db
      .insert(elements)
      .values(element)
      .returning();
    return newElement;
  }

  async getElementById(id: string): Promise<Element | undefined> {
    const [element] = await db.select().from(elements).where(eq(elements.id, id));
    return element;
  }

  async getElementByCode(code: string): Promise<Element | undefined> {
    const [element] = await db.select().from(elements).where(eq(elements.code, code));
    return element;
  }

  async updateElementStatus(id: string, status: string, locationId?: string): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (locationId) {
      updateData.currentLocationId = locationId;
    }
    
    await db
      .update(elements)
      .set(updateData)
      .where(eq(elements.id, id));
  }

  async getElements(filters?: { status?: string; type?: string; locationId?: string }): Promise<Element[]> {
    let query = db.select().from(elements);
    
    if (filters?.status || filters?.type || filters?.locationId) {
      const conditions = [];
      if (filters.status) conditions.push(eq(elements.status, filters.status as any));
      if (filters.type) conditions.push(eq(elements.type, filters.type as any));
      if (filters.locationId) conditions.push(eq(elements.currentLocationId, filters.locationId));
      
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(elements.createdAt));
  }

  // Movement operations
  async createMovement(movement: InsertMovement): Promise<Movement> {
    const [newMovement] = await db
      .insert(movements)
      .values(movement)
      .returning();
    return newMovement;
  }

  async getMovementsByElement(elementId: string): Promise<Movement[]> {
    return await db
      .select()
      .from(movements)
      .where(eq(movements.elementId, elementId))
      .orderBy(desc(movements.timestamp));
  }

  async getRecentMovements(limit: number = 10): Promise<Movement[]> {
    return await db
      .select()
      .from(movements)
      .orderBy(desc(movements.timestamp))
      .limit(limit);
  }

  // Control point operations
  async createControlPoint(controlPoint: InsertControlPoint): Promise<ControlPoint> {
    const [newPoint] = await db
      .insert(controlPoints)
      .values(controlPoint)
      .returning();
    return newPoint;
  }

  async getControlPoints(): Promise<ControlPoint[]> {
    return await db.select().from(controlPoints);
  }

  async getControlPointById(id: string): Promise<ControlPoint | undefined> {
    const [point] = await db.select().from(controlPoints).where(eq(controlPoints.id, id));
    return point;
  }

  // Dashboard stats
  async getElementStats(): Promise<{
    totalElements: number;
    inOperation: number;
    inTransit: number;
    inStorage: number;
  }> {
    const [stats] = await db
      .select({
        totalElements: count(),
        inOperation: sql<number>`count(*) filter (where status = 'in_operation')`,
        inTransit: sql<number>`count(*) filter (where status = 'in_transit')`,
        inStorage: sql<number>`count(*) filter (where status = 'in_storage')`,
      })
      .from(elements);
    
    return {
      totalElements: Number(stats.totalElements),
      inOperation: Number(stats.inOperation),
      inTransit: Number(stats.inTransit),
      inStorage: Number(stats.inStorage),
    };
  }
}

export const storage = new DatabaseStorage();
