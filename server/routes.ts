import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertElementSchema, insertMovementSchema, insertControlPointSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock user for development without auth
  const mockUser = {
    id: "mock-user-1",
    email: "user@example.com",
    firstName: "Тестовый",
    lastName: "Пользователь",
    role: "administrator",
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Auth routes (mocked)
  app.get('/api/auth/user', async (req: any, res) => {
    res.json(mockUser);
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await storage.getElementStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/recent-movements', async (req, res) => {
    try {
      const movements = await storage.getRecentMovements(10);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching recent movements:", error);
      res.status(500).json({ message: "Failed to fetch recent movements" });
    }
  });

  // Element routes
  app.post('/api/elements', async (req: any, res) => {
    try {
      const elementData = insertElementSchema.parse(req.body);
      const element = await storage.createElement(elementData);
      res.json(element);
    } catch (error) {
      console.error("Error creating element:", error);
      res.status(400).json({ message: "Failed to create element" });
    }
  });

  app.get('/api/elements', async (req, res) => {
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

  app.get('/api/elements/:id', async (req, res) => {
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

  app.get('/api/elements/code/:code', async (req, res) => {
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

  app.patch('/api/elements/:id/status', async (req, res) => {
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
  app.post('/api/movements', async (req: any, res) => {
    try {
      const movementData = insertMovementSchema.parse({
        ...req.body,
        operatorId: mockUser.id,
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

  app.get('/api/movements/element/:elementId', async (req, res) => {
    try {
      const movements = await storage.getMovementsByElement(req.params.elementId);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching element movements:", error);
      res.status(500).json({ message: "Failed to fetch element movements" });
    }
  });

  // Control point routes
  app.post('/api/control-points', async (req, res) => {
    try {
      const pointData = insertControlPointSchema.parse(req.body);
      const point = await storage.createControlPoint(pointData);
      res.json(point);
    } catch (error) {
      console.error("Error creating control point:", error);
      res.status(400).json({ message: "Failed to create control point" });
    }
  });

  app.get('/api/control-points', async (req, res) => {
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
