import {
  users,
  elements,
  movements,
  controlPoints,
  products,
  orders,
  orderItems,
  cartItems,
  factories,
  type User,
  type UpsertUser,
  type Element,
  type InsertElement,
  type Movement,
  type InsertMovement,
  type ControlPoint,
  type InsertControlPoint,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type CartItem,
  type InsertCartItem,
  type Factory,
  type InsertFactory,
  type UpdateOrder,
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

  // Product operations
  getProducts(filters?: { category?: string; search?: string }): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Cart operations
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<void>;
  removeFromCart(id: string): Promise<void>;

  // Order operations
  getOrdersByCustomer(customerId: string): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]>;
  getAllOrders(): Promise<(Order & { items: (OrderItem & { product: Product })[], customer: User })[]>;
  sendOrderToFactory(orderId: string, updateData: UpdateOrder): Promise<Order | undefined>;
  getFactoryOrders(filters?: { status?: string; priority?: string }): Promise<(Order & { items: (OrderItem & { product: Product })[], customer: User, factory?: Factory })[]>;

  // Factory operations
  getFactories(): Promise<Factory[]>;
  getFactoryById(id: string): Promise<Factory | undefined>;
  createFactory(factory: InsertFactory): Promise<Factory>;
  updateFactory(id: string, updates: Partial<InsertFactory>): Promise<Factory | undefined>;
  deleteFactory(id: string): Promise<boolean>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // SQLite doesn't support upsert in the same way, so we'll do insert or update
    const existingUser = await this.getUserByEmail(userData.email);
    
    if (existingUser) {
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      return user;
    } else {
      return this.createUser(userData);
    }
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
    const updateData: any = { status, updatedAt: Math.floor(Date.now() / 1000) };
    if (locationId) {
      updateData.currentLocationId = locationId;
    }
    
    await db
      .update(elements)
      .set(updateData)
      .where(eq(elements.id, id));
  }

  async getElements(filters?: { status?: string; type?: string; locationId?: string }): Promise<Element[]> {
    if (filters?.status || filters?.type || filters?.locationId) {
      const conditions = [];
      if (filters.status) conditions.push(eq(elements.status, filters.status));
      if (filters.type) conditions.push(eq(elements.type, filters.type));
      if (filters.locationId) conditions.push(eq(elements.currentLocationId, filters.locationId));
      
      return await db.select().from(elements).where(and(...conditions)).orderBy(desc(elements.createdAt));
    }
    
    return await db.select().from(elements).orderBy(desc(elements.createdAt));
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
    // SQLite uses different syntax for conditional aggregation
    const [stats] = await db
      .select({
        totalElements: count(),
        inOperation: sql<number>`sum(case when status = 'in_operation' then 1 else 0 end)`,
        inTransit: sql<number>`sum(case when status = 'in_transit' then 1 else 0 end)`,
        inStorage: sql<number>`sum(case when status = 'in_storage' then 1 else 0 end)`,
      })
      .from(elements);
    
    return {
      totalElements: Number(stats.totalElements),
      inOperation: Number(stats.inOperation),
      inTransit: Number(stats.inTransit),
      inStorage: Number(stats.inStorage),
    };
  }

  // Product operations
  async getProducts(filters?: { category?: string; search?: string }): Promise<Product[]> {
    if (filters?.category || filters?.search) {
      const conditions = [];
      conditions.push(eq(products.isActive, 'true'));
      
      if (filters.category) {
        conditions.push(eq(products.category, filters.category));
      }
      
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        conditions.push(
          sql`${products.name} LIKE ${searchTerm} OR ${products.description} LIKE ${searchTerm}`
        );
      }
      
      return await db.select().from(products).where(and(...conditions)).orderBy(products.name);
    }
    
    return await db
      .select()
      .from(products)
      .where(eq(products.isActive, 'true'))
      .orderBy(products.name);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set({
        ...updates,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await db
      .update(products)
      .set({
        isActive: 'false',
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(products.id, id));
  }

  // Cart operations
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    return await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        product: products
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.createdAt));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.userId, cartItem.userId),
        eq(cartItems.productId, cartItem.productId)
      ));

    if (existing) {
      // Update quantity if item already exists
      const [updated] = await db
        .update(cartItems)
        .set({
          quantity: existing.quantity + cartItem.quantity,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return updated;
    } else {
      // Insert new cart item
      const [newItem] = await db
        .insert(cartItems)
        .values(cartItem)
        .returning();
      return newItem;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<void> {
    await db
      .update(cartItems)
      .set({
        quantity,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(cartItems.id, id));
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  // Order operations
  async getOrdersByCustomer(customerId: string): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]> {
    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      customerOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            createdAt: orderItems.createdAt,
            product: products
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));
        
        return { ...order, items };
      })
    );

    return ordersWithItems;
  }

  async getAllOrders(): Promise<(Order & { items: (OrderItem & { product: Product })[], customer: User })[]> {
    const allOrders = await db
      .select({
        id: orders.id,
        customerId: orders.customerId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customer: users
      })
      .from(orders)
      .innerJoin(users, eq(orders.customerId, users.id))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      allOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            createdAt: orderItems.createdAt,
            product: products
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));
        
        return {
          id: order.id,
          customerId: order.customerId,
          status: order.status,
          totalAmount: order.totalAmount,
          notes: order.notes,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          items,
          customer: order.customer
        };
      })
    );

    return ordersWithItems;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    await db
      .update(orders)
      .set({
        status,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(orders.id, id));
  }

  // Factory operations
  async getFactories(): Promise<Factory[]> {
    return await db.select().from(factories).where(eq(factories.isActive, "true"));
  }

  async getFactoryById(id: string): Promise<Factory | undefined> {
    const result = await db.select().from(factories).where(eq(factories.id, id)).limit(1);
    return result[0];
  }

  async createFactory(factory: InsertFactory): Promise<Factory> {
    const newFactoryData = {
      ...factory,
      id: crypto.randomUUID().replace(/-/g, '').toUpperCase(),
      isActive: "true",
      specializations: Array.isArray(factory.specializations) 
        ? JSON.stringify(factory.specializations)
        : factory.specializations,
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    };
    const [newFactory] = await db.insert(factories).values(newFactoryData).returning();
    return newFactory;
  }

  async updateFactory(id: string, updates: Partial<InsertFactory>): Promise<Factory | undefined> {
    const [updatedFactory] = await db.update(factories)
      .set(updates)
      .where(eq(factories.id, id))
      .returning();
    return updatedFactory;
  }

  async deleteFactory(id: string): Promise<boolean> {
    const result = await db.update(factories)
      .set({ isActive: "false" })
      .where(eq(factories.id, id));
    
    return result.changes > 0;
  }

  // Enhanced order operations
  async sendOrderToFactory(orderId: string, updateData: UpdateOrder): Promise<Order | undefined> {
    const [updatedOrder] = await db.update(orders)
      .set({
        ...updateData,
        updatedAt: Math.floor(Date.now() / 1000)
      })
      .where(eq(orders.id, orderId))
      .returning();
    return updatedOrder;
  }

  async getFactoryOrders(filters?: { status?: string; priority?: string }): Promise<(Order & { items: (OrderItem & { product: Product })[], customer: User, factory?: Factory })[]> {
    let whereConditions = [];
    
    if (filters?.status) {
      whereConditions.push(eq(orders.status, filters.status));
    } else {
      // Default to orders sent to factory or in production
      whereConditions.push(sql`${orders.status} IN ('sent_to_factory', 'new', 'in_production')`);
    }
    
    if (filters?.priority) {
      whereConditions.push(eq(orders.priority, filters.priority));
    }

    const orderResults = await db.select({
      order: orders,
      customer: users,
      factory: factories
    }).from(orders)
      .leftJoin(users, eq(orders.customerId, users.id))
      .leftJoin(factories, eq(orders.factoryId, factories.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const ordersWithItems = await Promise.all(
      orderResults.map(async (result) => {
        const items = await db.select({
          orderItem: orderItems,
          product: products
        }).from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, result.order.id));

        return {
          ...result.order,
          items: items.map(item => ({
            ...item.orderItem,
            product: item.product!
          })),
          customer: result.customer!,
          factory: result.factory || undefined
        };
      })
    );

    return ordersWithItems;
  }
}

export const storage = new DatabaseStorage();
