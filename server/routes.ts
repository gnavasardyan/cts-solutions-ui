import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertElementSchema, insertMovementSchema, insertControlPointSchema, loginSchema, registerSchema, insertProductSchema, insertOrderSchema, insertCartItemSchema, insertFactorySchema, updateOrderSchema, UserRoles } from "@shared/schema";
import { z } from "zod";
import { AuthService, authenticateToken, requireRole, type AuthRequest } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
      }

      const { user, token } = await AuthService.register(userData);
      
      res.status(201).json({
        message: 'Пользователь успешно зарегистрирован',
        user,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ 
        message: error instanceof z.ZodError 
          ? error.errors[0]?.message || 'Ошибка валидации данных' 
          : 'Ошибка регистрации'
      });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      const result = await AuthService.authenticate(credentials.email, credentials.password);
      
      if (!result) {
        return res.status(401).json({ message: 'Неверный email или пароль' });
      }

      res.json({
        message: 'Успешный вход в систему',
        user: result.user,
        token: result.token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ 
        message: error instanceof z.ZodError 
          ? error.errors[0]?.message || 'Ошибка валидации данных' 
          : 'Ошибка входа в систему'
      });
    }
  });

  app.get('/api/auth/user', authenticateToken, async (req: any, res) => {
    res.json(req.user);
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Выход выполнен успешно' });
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', authenticateToken, async (req: any, res) => {
    try {
      const stats = await storage.getElementStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/recent-movements', authenticateToken, async (req: any, res) => {
    try {
      const movements = await storage.getRecentMovements(10);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching recent movements:", error);
      res.status(500).json({ message: "Failed to fetch recent movements" });
    }
  });

  // Element routes
  app.post('/api/elements', authenticateToken, requireRole([UserRoles.ADMINISTRATOR, UserRoles.FACTORY_OPERATOR]), async (req: any, res) => {
    try {
      const elementData = insertElementSchema.parse(req.body);
      const element = await storage.createElement(elementData);
      res.json(element);
    } catch (error) {
      console.error("Error creating element:", error);
      res.status(400).json({ message: "Failed to create element" });
    }
  });

  app.get('/api/elements', authenticateToken, async (req: any, res) => {
    try {
      const { status, type, locationId } = req.query;
      const elements = await storage.getElements({
        status: status as string,
        type: type as string,
        locationId: locationId as string,
      });
      res.json(elements);
    } catch (error) {
      console.error("Error fetching elements:", error);
      res.status(500).json({ message: "Failed to fetch elements" });
    }
  });

  app.get('/api/elements/:id', authenticateToken, async (req: any, res) => {
    try {
      const element = await storage.getElementById(req.params.id);
      if (!element) {
        return res.status(404).json({ message: "Element not found" });
      }
      res.json(element);
    } catch (error) {
      console.error("Error fetching element:", error);
      res.status(500).json({ message: "Failed to fetch element" });
    }
  });

  app.get('/api/elements/code/:code', authenticateToken, async (req: any, res) => {
    try {
      const element = await storage.getElementByCode(req.params.code);
      if (!element) {
        return res.status(404).json({ message: "Element not found" });
      }
      res.json(element);
    } catch (error) {
      console.error("Error fetching element by code:", error);
      res.status(500).json({ message: "Failed to fetch element" });
    }
  });

  app.patch('/api/elements/:id/status', authenticateToken, requireRole([UserRoles.ADMINISTRATOR, UserRoles.FACTORY_OPERATOR, UserRoles.WAREHOUSE_KEEPER, UserRoles.SITE_MASTER]), async (req: any, res) => {
    try {
      const { status, locationId } = req.body;
      await storage.updateElementStatus(req.params.id, status, locationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating element status:", error);
      res.status(500).json({ message: "Failed to update element status" });
    }
  });

  // Movement routes
  app.post('/api/movements', authenticateToken, requireRole([UserRoles.ADMINISTRATOR, UserRoles.FACTORY_OPERATOR, UserRoles.WAREHOUSE_KEEPER, UserRoles.SITE_MASTER]), async (req: any, res) => {
    try {
      const movementData = insertMovementSchema.parse({
        ...req.body,
        operatorId: req.user!.id,
      });
      const movement = await storage.createMovement(movementData);
      
      // Update element status and location
      if (movementData.toLocationId) {
        let newStatus = "in_storage"; // default
        const location = await storage.getControlPointById(movementData.toLocationId);
        if (location?.type === "factory") {
          newStatus = "production";
        } else if (location?.type === "usage_site") {
          newStatus = "in_operation";
        }
        
        await storage.updateElementStatus(
          movementData.elementId,
          newStatus,
          movementData.toLocationId
        );
      }
      
      res.json(movement);
    } catch (error) {
      console.error("Error creating movement:", error);
      res.status(400).json({ message: "Failed to create movement" });
    }
  });

  app.get('/api/movements/element/:elementId', authenticateToken, async (req: any, res) => {
    try {
      const movements = await storage.getMovementsByElement(req.params.elementId);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching element movements:", error);
      res.status(500).json({ message: "Failed to fetch element movements" });
    }
  });

  // Control point routes
  app.post('/api/control-points', authenticateToken, requireRole([UserRoles.ADMINISTRATOR]), async (req: any, res) => {
    try {
      const pointData = insertControlPointSchema.parse(req.body);
      const point = await storage.createControlPoint(pointData);
      res.json(point);
    } catch (error) {
      console.error("Error creating control point:", error);
      res.status(400).json({ message: "Failed to create control point" });
    }
  });

  app.get('/api/control-points', authenticateToken, async (req: any, res) => {
    try {
      const points = await storage.getControlPoints();
      res.json(points);
    } catch (error) {
      console.error("Error fetching control points:", error);
      res.status(500).json({ message: "Failed to fetch control points" });
    }
  });

  // Product routes
  app.get('/api/products', authenticateToken, async (req: any, res) => {
    try {
      const { category, search } = req.query;
      const products = await storage.getProducts({
        category: category as string,
        search: search as string,
      });
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/products', authenticateToken, requireRole([UserRoles.ADMINISTRATOR]), async (req: any, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: "Failed to create product" });
    }
  });

  app.patch('/api/products/:id', authenticateToken, requireRole([UserRoles.ADMINISTRATOR]), async (req: any, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', authenticateToken, requireRole([UserRoles.ADMINISTRATOR]), async (req: any, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.get('/api/products/:id', authenticateToken, async (req: any, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Cart routes (allow admin and customer access)
  app.get('/api/cart', authenticateToken, requireRole([UserRoles.CUSTOMER_OPERATOR, UserRoles.ADMINISTRATOR]), async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const cartItems = await storage.getCartItems(req.user.id);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post('/api/cart', authenticateToken, requireRole([UserRoles.CUSTOMER_OPERATOR, UserRoles.ADMINISTRATOR]), async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const cartData = insertCartItemSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      const cartItem = await storage.addToCart(cartData);
      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(400).json({ message: "Failed to add to cart" });
    }
  });

  app.patch('/api/cart/:id', authenticateToken, requireRole([UserRoles.CUSTOMER_OPERATOR, UserRoles.ADMINISTRATOR]), async (req: any, res) => {
    try {
      const { quantity } = req.body;
      await storage.updateCartItem(req.params.id, quantity);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete('/api/cart/:id', authenticateToken, requireRole([UserRoles.CUSTOMER_OPERATOR, UserRoles.ADMINISTRATOR]), async (req: any, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Order routes for customer operators
  app.get('/api/orders', authenticateToken, async (req: any, res) => {
    try {
      let orders;
      if (req.user?.role === UserRoles.ADMINISTRATOR) {
        orders = await storage.getAllOrders();
      } else if (req.user?.role === UserRoles.CUSTOMER_OPERATOR && req.user?.id) {
        orders = await storage.getOrdersByCustomer(req.user.id);
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/orders', authenticateToken, requireRole([UserRoles.CUSTOMER_OPERATOR]), async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const orderData = insertOrderSchema.parse({
        ...req.body,
        customerId: req.user.id,
      });
      const order = await storage.createOrder(orderData);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ message: "Failed to create order" });
    }
  });

  app.patch('/api/orders/:id/status', authenticateToken, requireRole([UserRoles.ADMINISTRATOR, UserRoles.FACTORY_OPERATOR]), async (req: any, res) => {
    try {
      const { status } = req.body;
      await storage.updateOrderStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Send order to factory (customer operator)
  app.post('/api/orders/:id/send-to-factory', authenticateToken, requireRole([UserRoles.CUSTOMER_OPERATOR, UserRoles.ADMINISTRATOR]), async (req: any, res) => {
    try {
      const { factoryId, priority, deadline, notes } = req.body;
      const orderId = req.params.id;
      
      // Generate order number if not exists
      const orderNumber = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      
      const updatedOrder = await storage.sendOrderToFactory(orderId, {
        factoryId,
        priority: priority || 'normal',
        deadline,
        notes,
        orderNumber,
        status: 'sent_to_factory'
      });
      
      if (!updatedOrder) {
        return res.status(404).json({ message: 'Заказ не найден' });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error sending order to factory:", error);
      res.status(500).json({ message: "Ошибка отправки заказа на завод" });
    }
  });

  // Factory management routes
  app.get('/api/factories', async (req: any, res) => {
    try {
      const factories = await storage.getFactories();
      res.json(factories);
    } catch (error) {
      console.error('Get factories error:', error);
      res.status(500).json({ message: 'Ошибка получения списка заводов' });
    }
  });

  app.post('/api/factories', async (req: any, res) => {
    try {
      // Преобразуем specializations в строку если это массив
      const bodyWithStringSpecializations = {
        ...req.body,
        specializations: Array.isArray(req.body.specializations) 
          ? JSON.stringify(req.body.specializations)
          : req.body.specializations
      };
      
      const factoryData = insertFactorySchema.parse(bodyWithStringSpecializations);
      const factory = await storage.createFactory(factoryData);
      res.status(201).json(factory);
    } catch (error) {
      console.error('Create factory error:', error);
      res.status(400).json({ 
        message: error instanceof z.ZodError 
          ? error.errors[0]?.message || 'Ошибка валидации данных' 
          : 'Ошибка создания завода'
      });
    }
  });

  app.patch('/api/factories/:id', async (req: any, res) => {
    try {
      const id = req.params.id;
      
      // Преобразуем specializations в строку если это массив
      const bodyWithStringSpecializations = {
        ...req.body,
        specializations: Array.isArray(req.body.specializations) 
          ? JSON.stringify(req.body.specializations)
          : req.body.specializations
      };
      
      const updates = insertFactorySchema.partial().parse(bodyWithStringSpecializations);
      const factory = await storage.updateFactory(id, updates);
      
      if (!factory) {
        return res.status(404).json({ message: 'Завод не найден' });
      }
      
      res.json(factory);
    } catch (error) {
      console.error('Update factory error:', error);
      res.status(400).json({ 
        message: error instanceof z.ZodError 
          ? error.errors[0]?.message || 'Ошибка валидации данных' 
          : 'Ошибка обновления завода'
      });
    }
  });

  app.delete('/api/factories/:id', async (req: any, res) => {
    try {
      const id = req.params.id;
      const success = await storage.deleteFactory(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Завод не найден' });
      }
      
      res.json({ message: 'Завод успешно удален' });
    } catch (error) {
      console.error('Delete factory error:', error);
      res.status(500).json({ message: 'Ошибка удаления завода' });
    }
  });

  // Factory orders (for factory operators)
  app.get('/api/factory/orders', authenticateToken, requireRole([UserRoles.FACTORY_OPERATOR, UserRoles.ADMINISTRATOR]), async (req: any, res) => {
    try {
      const { status, priority } = req.query;
      const filters = { 
        status: status as string, 
        priority: priority as string,
        // For factory operators, filter by their assigned factory
        factoryId: req.user.role === 'factory_operator' ? req.user.factoryId : undefined
      };
      
      const orders = await storage.getFactoryOrders(filters);
      res.json(orders);
    } catch (error) {
      console.error('Get factory orders error:', error);
      res.status(500).json({ message: 'Ошибка получения заказов завода' });
    }
  });

  // Production markings API
  app.post('/api/production/markings', authenticateToken, requireRole([UserRoles.FACTORY_OPERATOR, UserRoles.ADMINISTRATOR]), async (req: any, res) => {
    try {
      const { markings } = req.body;
      
      if (!Array.isArray(markings) || markings.length === 0) {
        return res.status(400).json({ message: 'Необходимо указать маркировки' });
      }
      
      const createdMarkings = [];
      for (const marking of markings) {
        const createdMarking = await storage.createProductionMarking({
          ...marking,
          operatorId: req.user.id
        });
        createdMarkings.push(createdMarking);
      }
      
      res.json({ markings: createdMarkings });
    } catch (error) {
      console.error('Create markings error:', error);
      res.status(500).json({ message: 'Ошибка создания маркировок' });
    }
  });

  // Production shipments API
  app.post('/api/production/shipments', authenticateToken, requireRole([UserRoles.FACTORY_OPERATOR, UserRoles.ADMINISTRATOR]), async (req: any, res) => {
    try {
      const { orderIds, ...shipmentData } = req.body;
      
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: 'Необходимо указать заказы для отгрузки' });
      }
      
      // Create shipment
      const shipment = await storage.createShipment({
        ...shipmentData,
        operatorId: req.user.id,
        factoryId: req.user.factoryId || 'DEFAULT_FACTORY' // TODO: get from user or context
      });
      
      // Add orders to shipment
      await storage.addOrdersToShipment(shipment.id, orderIds);
      
      // Update order statuses to 'shipped'
      for (const orderId of orderIds) {
        await storage.updateOrderStatus(orderId, 'shipped');
      }
      
      res.json({ shipment, message: 'Отгрузка создана успешно' });
    } catch (error) {
      console.error('Create shipment error:', error);
      res.status(500).json({ message: 'Ошибка создания отгрузки' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
