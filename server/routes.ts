import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertProductSchema, 
  insertPriceHistorySchema, 
  insertNotificationSchema,
  productInfoSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: express.Express): Promise<Server> {
  const apiRouter = express.Router();

  // User routes
  apiRouter.post("/users/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser(userData);
      res.status(201).json({ id: user.id, username: user.username, email: user.email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Product routes
  apiRouter.get("/products", async (req, res) => {
    try {
      const userId = Number(req.query.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const products = await storage.getProductsByUserId(userId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  apiRouter.get("/products/:id", async (req, res) => {
    try {
      const productId = Number(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  apiRouter.post("/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      
      // Add initial price history
      await storage.addPriceHistory({
        productId: product.id,
        price: product.currentPrice,
      });
      
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  apiRouter.put("/products/:id", async (req, res) => {
    try {
      const productId = Number(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updateData = req.body;
      const updatedProduct = await storage.updateProduct(productId, updateData);
      
      // If price changed, add to price history
      if (updateData.currentPrice && updateData.currentPrice !== product.currentPrice) {
        await storage.addPriceHistory({
          productId,
          price: updateData.currentPrice,
        });
        
        // Check for price drop and create notification if needed
        if (product.isAlertSet && 
            product.alertPrice && 
            updateData.currentPrice <= product.alertPrice && 
            product.currentPrice > product.alertPrice) {
          await storage.createNotification({
            userId: product.userId,
            productId,
            message: `Price for ${product.title} dropped to ${updateData.currentPrice}! (Your alert was set at ${product.alertPrice})`,
          });
        }
      }
      
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  apiRouter.delete("/products/:id", async (req, res) => {
    try {
      const productId = Number(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const deleted = await storage.deleteProduct(productId);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Price history routes
  apiRouter.get("/price-history/:productId", async (req, res) => {
    try {
      const productId = Number(req.params.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const history = await storage.getPriceHistory(productId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch price history" });
    }
  });

  // Notification routes
  apiRouter.get("/notifications", async (req, res) => {
    try {
      const userId = Number(req.query.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  apiRouter.post("/notifications/read/:id", async (req, res) => {
    try {
      const notificationId = Number(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }

      const success = await storage.markNotificationAsRead(notificationId);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Chrome extension specific endpoint - extract product info
  apiRouter.post("/extract-product", async (req, res) => {
    try {
      const productInfo = productInfoSchema.parse(req.body);
      res.json({ success: true, productInfo });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to extract product information" });
    }
  });

  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
