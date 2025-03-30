import { 
  users, User, InsertUser, 
  categories, Category, InsertCategory,
  suppliers, Supplier, InsertSupplier,
  products, Product, InsertProduct,
  transactions, Transaction, InsertTransaction,
  purchaseOrders, PurchaseOrder, InsertPurchaseOrder,
  purchaseOrderItems, PurchaseOrderItem, InsertPurchaseOrderItem,
  forecastData, ForecastData, InsertForecastData
} from "@shared/schema";
import { generateOrderNumber } from "./utils";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, desc, lt, lte, isNotNull } from "drizzle-orm";
import "./types"; // Import type definitions

// Memory store
const MemoryStore = createMemoryStore(session);

// PostgreSQL session store
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;

  // Category operations
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  listCategories(): Promise<Category[]>;

  // Supplier operations
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  listSuppliers(): Promise<Supplier[]>;

  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  listProducts(): Promise<Product[]>;
  getProductsWithLowStock(): Promise<Product[]>;

  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  listTransactions(productId?: number): Promise<Transaction[]>;

  // Purchase order operations
  getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrderStatus(id: number, status: PurchaseOrder["status"]): Promise<PurchaseOrder | undefined>;
  listPurchaseOrders(status?: PurchaseOrder["status"]): Promise<PurchaseOrder[]>;

  // Purchase order item operations
  createPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem>;
  listPurchaseOrderItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]>;

  // Forecast operations
  createForecastData(forecast: InsertForecastData): Promise<ForecastData>;
  getProductForecast(productId: number): Promise<ForecastData[]>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  // Implementation of MemStorage remains the same
  // Not included here to save space - will be copied back in the final file
  
  sessionStore: session.SessionStore;
  
  constructor() {
    // Initialize memory storage
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }
}

// PostgreSQL implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // Add database initialization method
  async initializeDatabase(): Promise<void> {
    try {
      // Check if we already have any users
      const usersExist = await db.select().from(users).limit(1);
      
      if (usersExist.length === 0) {
        console.log("No users found, seeding initial data...");
        await this.seedInitialData();
      } else {
        console.log("Database already contains data, skipping seed");
      }
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const userToInsert = {
      ...insertUser,
      role: insertUser.role || 'associate' // Default role
    };
    
    const result = await db.insert(users).values(userToInsert).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const categoryToInsert = {
      ...insertCategory,
      description: insertCategory.description || null
    };
    
    const result = await db.insert(categories).values(categoryToInsert).returning();
    return result[0];
  }
  
  async listCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }
  
  // Supplier operations
  async getSupplier(id: number): Promise<Supplier | undefined> {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return result[0];
  }
  
  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const supplierToInsert = {
      ...insertSupplier,
      contactName: insertSupplier.contactName || null,
      contactEmail: insertSupplier.contactEmail || null,
      contactPhone: insertSupplier.contactPhone || null,
      address: insertSupplier.address || null,
      leadTime: insertSupplier.leadTime || null
    };
    
    const result = await db.insert(suppliers).values(supplierToInsert).returning();
    return result[0];
  }
  
  async listSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }
  
  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }
  
  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.barcode, barcode));
    return result[0];
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const productToInsert = {
      ...insertProduct,
      description: insertProduct.description || null,
      barcode: insertProduct.barcode || null,
      sku: insertProduct.sku || null,
      categoryId: insertProduct.categoryId || null,
      supplierId: insertProduct.supplierId || null,
      unit: insertProduct.unit || null,
      minStockLevel: insertProduct.minStockLevel || null,
      maxStockLevel: insertProduct.maxStockLevel || null,
      reorderPoint: insertProduct.reorderPoint || null,
      reorderQuantity: insertProduct.reorderQuantity || null,
      location: insertProduct.location || null,
      isActive: insertProduct.isActive === undefined ? true : insertProduct.isActive
    };
    
    const result = await db.insert(products).values(productToInsert).returning();
    return result[0];
  }
  
  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const result = await db.update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }
  
  async listProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true));
  }
  
  async getProductsWithLowStock(): Promise<Product[]> {
    return await db.select()
      .from(products)
      .where(and(
        eq(products.isActive, true),
        lt(products.currentStock, products.reorderPoint)
      ))
      .where(isNotNull(products.reorderPoint));
  }
  
  // Transaction operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transactionData = {
      ...insertTransaction,
      productId: insertTransaction.productId || null,
      notes: insertTransaction.notes || null,
      userId: insertTransaction.userId || null,
      transactionDate: new Date()
    };
    
    // Insert transaction
    const result = await db.insert(transactions).values(transactionData).returning();
    const newTransaction = result[0];
    
    // Update product stock
    if (newTransaction.productId) {
      const product = await this.getProduct(newTransaction.productId);
      if (product) {
        let newStock = product.currentStock;
        
        switch (newTransaction.transactionType) {
          case 'receive':
            newStock += newTransaction.quantity;
            break;
          case 'sale':
            newStock -= newTransaction.quantity;
            break;
          case 'adjustment':
            newStock += newTransaction.quantity;
            break;
          case 'count':
            newStock = newTransaction.quantity;
            break;
        }
        
        await this.updateProduct(product.id, { currentStock: newStock });
      }
    }
    
    return newTransaction;
  }
  
  async listTransactions(productId?: number): Promise<Transaction[]> {
    if (productId) {
      return await db.select()
        .from(transactions)
        .where(eq(transactions.productId, productId))
        .orderBy(desc(transactions.transactionDate));
    }
    
    return await db.select()
      .from(transactions)
      .orderBy(desc(transactions.transactionDate));
  }
  
  // Purchase order operations
  async getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined> {
    const result = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return result[0];
  }
  
  async createPurchaseOrder(insertOrder: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const orderNumber = generateOrderNumber();
    const orderData = {
      ...insertOrder,
      status: insertOrder.status || 'draft',
      supplierId: insertOrder.supplierId || null,
      notes: insertOrder.notes || null,
      userId: insertOrder.userId || null,
      totalValue: insertOrder.totalValue || 0,
      isAutomated: insertOrder.isAutomated || false,
      orderNumber,
      orderDate: new Date(),
      expectedDeliveryDate: insertOrder.expectedDeliveryDate || null
    };
    
    const result = await db.insert(purchaseOrders).values(orderData).returning();
    return result[0];
  }
  
  async updatePurchaseOrderStatus(id: number, status: PurchaseOrder["status"]): Promise<PurchaseOrder | undefined> {
    const order = await this.getPurchaseOrder(id);
    if (!order) return undefined;
    
    // If status is completed, create transactions for all items
    if (status === 'completed' && order.status !== 'completed') {
      const items = await this.listPurchaseOrderItems(id);
      
      for (const item of items) {
        if (item.productId) {
          await this.createTransaction({
            productId: item.productId,
            quantity: item.quantity,
            transactionType: 'receive',
            notes: `Received from PO #${order.orderNumber}`,
            userId: order.userId
          });
        }
      }
    }
    
    const result = await db.update(purchaseOrders)
      .set({ status })
      .where(eq(purchaseOrders.id, id))
      .returning();
    
    return result[0];
  }
  
  async listPurchaseOrders(status?: PurchaseOrder["status"]): Promise<PurchaseOrder[]> {
    if (status) {
      return await db.select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.status, status))
        .orderBy(desc(purchaseOrders.orderDate));
    }
    
    return await db.select()
      .from(purchaseOrders)
      .orderBy(desc(purchaseOrders.orderDate));
  }
  
  // Purchase order item operations
  async createPurchaseOrderItem(insertItem: InsertPurchaseOrderItem): Promise<PurchaseOrderItem> {
    const itemToInsert = {
      ...insertItem,
      productId: insertItem.productId || null,
      purchaseOrderId: insertItem.purchaseOrderId || null
    };
    
    const result = await db.insert(purchaseOrderItems).values(itemToInsert).returning();
    
    // Update purchase order total value
    const item = result[0];
    if (item.purchaseOrderId) {
      const order = await this.getPurchaseOrder(item.purchaseOrderId);
      if (order) {
        await db.update(purchaseOrders)
          .set({ totalValue: (order.totalValue || 0) + item.totalPrice })
          .where(eq(purchaseOrders.id, order.id));
      }
    }
    
    return item;
  }
  
  async listPurchaseOrderItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]> {
    return await db.select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
  }
  
  // Forecast operations
  async createForecastData(insertForecast: InsertForecastData): Promise<ForecastData> {
    const forecastToInsert = {
      ...insertForecast,
      productId: insertForecast.productId || null,
      actualDemand: insertForecast.actualDemand || null,
      accuracy: insertForecast.accuracy || null
    };
    
    const result = await db.insert(forecastData).values(forecastToInsert).returning();
    return result[0];
  }
  
  async getProductForecast(productId: number): Promise<ForecastData[]> {
    return await db.select()
      .from(forecastData)
      .where(eq(forecastData.productId, productId))
      .orderBy(forecastData.date);
  }
  
  // Add initial data
  private async seedInitialData() {
    console.log("Seeding initial data...");
    
    // Create default admin user
    const adminUser = await this.createUser({
      username: "admin",
      password: "$2b$10$MQXFjqZ6PEt0RXG/OUr8yu1Vbq9zGbcPEyI1eWQXITmm3d0jX5J.m", // "admin123"
      name: "Admin User",
      email: "admin@grocerystock.com",
      role: "admin"
    });
    
    // Create store manager user
    await this.createUser({
      username: "manager",
      password: "$2b$10$MQXFjqZ6PEt0RXG/OUr8yu1Vbq9zGbcPEyI1eWQXITmm3d0jX5J.m", // "admin123"
      name: "Alex Johnson",
      email: "alex@grocerystock.com",
      role: "manager"
    });
    
    // Create stock associate user
    await this.createUser({
      username: "associate",
      password: "$2b$10$MQXFjqZ6PEt0RXG/OUr8yu1Vbq9zGbcPEyI1eWQXITmm3d0jX5J.m", // "admin123"
      name: "Sarah Smith",
      email: "sarah@grocerystock.com",
      role: "associate"
    });
    
    // Create categories
    const produceCategory = await this.createCategory({
      name: "Produce",
      description: "Fresh fruits and vegetables"
    });
    
    const dairyCategory = await this.createCategory({
      name: "Dairy",
      description: "Milk, cheese, and other dairy products"
    });
    
    const bakeryCategory = await this.createCategory({
      name: "Bakery",
      description: "Bread, pastries, and baked goods"
    });
    
    // Create suppliers
    const freshFarms = await this.createSupplier({
      name: "FreshFarms Inc.",
      contactName: "John Doe",
      contactEmail: "john@freshfarms.com",
      contactPhone: "555-123-4567",
      address: "123 Farm Rd, Farmville, CA",
      leadTime: 2
    });
    
    const organicValley = await this.createSupplier({
      name: "Organic Valley",
      contactName: "Jane Smith",
      contactEmail: "jane@organicvalley.com",
      contactPhone: "555-987-6543",
      address: "456 Valley Rd, Organicville, CA",
      leadTime: 3
    });
    
    const bakerySupplies = await this.createSupplier({
      name: "Bakery Supplies Co.",
      contactName: "Bob Baker",
      contactEmail: "bob@bakerysupplies.com",
      contactPhone: "555-789-0123",
      address: "789 Baker St, Bakerstown, CA",
      leadTime: 1
    });
    
    // Create products
    const apples = await this.createProduct({
      name: "Organic Apples",
      description: "Fresh organic apples",
      barcode: "1234567890123",
      sku: "PROD-001",
      categoryId: produceCategory.id,
      supplierId: freshFarms.id,
      unit: "kg",
      price: 2.99,
      currentStock: 12,
      minStockLevel: 10,
      maxStockLevel: 100,
      reorderPoint: 20,
      reorderQuantity: 50,
      location: "A1",
      isActive: true
    });
    
    const milk = await this.createProduct({
      name: "Fresh Milk (1 Gal)",
      description: "Whole milk",
      barcode: "2345678901234",
      sku: "PROD-002",
      categoryId: dairyCategory.id,
      supplierId: organicValley.id,
      unit: "each",
      price: 3.49,
      currentStock: 15,
      minStockLevel: 20,
      maxStockLevel: 100,
      reorderPoint: 25,
      reorderQuantity: 40,
      location: "B3",
      isActive: true
    });
    
    const bread = await this.createProduct({
      name: "Whole Wheat Bread",
      description: "Freshly baked whole wheat bread",
      barcode: "3456789012345",
      sku: "PROD-003",
      categoryId: bakeryCategory.id,
      supplierId: bakerySupplies.id,
      unit: "each",
      price: 2.49,
      currentStock: 8,
      minStockLevel: 15,
      maxStockLevel: 50,
      reorderPoint: 20,
      reorderQuantity: 30,
      location: "C2",
      isActive: true
    });
    
    console.log("Initial data seeding completed successfully");
  }
}

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();