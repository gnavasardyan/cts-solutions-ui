import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertElementSchema, insertMovementSchema, insertControlPointSchema, loginSchema, registerSchema } from "@shared/schema";
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
  app.post('/api/elements', authenticateToken, requireRole(['administrator', 'factory_operator']), async (req: any, res) => {
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

  app.patch('/api/elements/:id/status', authenticateToken, requireRole(['administrator', 'factory_operator', 'warehouse_keeper', 'site_master']), async (req: any, res) => {
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
  app.post('/api/movements', authenticateToken, requireRole(['administrator', 'factory_operator', 'warehouse_keeper', 'site_master']), async (req: any, res) => {
    try {
      const movementData = insertMovementSchema.parse({
        ...req.body,
        operatorId: req.user.id,
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
  app.post('/api/control-points', authenticateToken, requireRole(['administrator']), async (req: any, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
