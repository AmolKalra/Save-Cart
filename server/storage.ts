import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  priceHistory, type PriceHistory, type InsertPriceHistory,
  notifications, type Notification, type InsertNotification
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByUserId(userId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Price history operations
  getPriceHistory(productId: number): Promise<PriceHistory[]>;
  addPriceHistory(priceHistory: InsertPriceHistory): Promise<PriceHistory>;
  
  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private priceHistories: Map<number, PriceHistory>;
  private notifications: Map<number, Notification>;
  private currentUserId: number;
  private currentProductId: number;
  private currentPriceHistoryId: number;
  private currentNotificationId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.priceHistories = new Map();
    this.notifications = new Map();
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentPriceHistoryId = 1;
    this.currentNotificationId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByUserId(userId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.userId === userId,
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const now = new Date();
    const product: Product = {
      ...insertProduct,
      id,
      createdAt: now,
      lastUpdated: now
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct: Product = {
      ...product,
      ...updateData,
      lastUpdated: new Date()
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Price history operations
  async getPriceHistory(productId: number): Promise<PriceHistory[]> {
    return Array.from(this.priceHistories.values()).filter(
      (history) => history.productId === productId,
    );
  }

  async addPriceHistory(insertPriceHistory: InsertPriceHistory): Promise<PriceHistory> {
    const id = this.currentPriceHistoryId++;
    const priceHistory: PriceHistory = {
      ...insertPriceHistory,
      id,
      date: new Date()
    };
    this.priceHistories.set(id, priceHistory);
    return priceHistory;
  }

  // Notification operations
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notification) => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const notification: Notification = {
      ...insertNotification,
      id,
      isRead: false,
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    notification.isRead = true;
    this.notifications.set(id, notification);
    return true;
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }
}

export const storage = new MemStorage();
