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

const MemoryStore = createMemoryStore(session);

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
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private suppliers: Map<number, Supplier>;
  private products: Map<number, Product>;
  private transactions: Map<number, Transaction>;
  private purchaseOrders: Map<number, PurchaseOrder>;
  private purchaseOrderItems: Map<number, PurchaseOrderItem>;
  private forecastData: Map<number, ForecastData>;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private supplierIdCounter: number;
  private productIdCounter: number;
  private transactionIdCounter: number;
  private purchaseOrderIdCounter: number;
  private purchaseOrderItemIdCounter: number;
  private forecastDataIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.suppliers = new Map();
    this.products = new Map();
    this.transactions = new Map();
    this.purchaseOrders = new Map();
    this.purchaseOrderItems = new Map();
    this.forecastData = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.supplierIdCounter = 1;
    this.productIdCounter = 1;
    this.transactionIdCounter = 1;
    this.purchaseOrderIdCounter = 1;
    this.purchaseOrderItemIdCounter = 1;
    this.forecastDataIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Initialize with some default data
    this.seedInitialData();
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async listCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  // Supplier operations
  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = this.supplierIdCounter++;
    const supplier: Supplier = { ...insertSupplier, id };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  async listSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.barcode === barcode,
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async listProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.isActive);
  }

  async getProductsWithLowStock(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.isActive && product.currentStock <= product.reorderPoint
    );
  }

  // Transaction operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      transactionDate: new Date()
    };
    this.transactions.set(id, transaction);
    
    // Update product stock
    const product = this.products.get(transaction.productId);
    if (product) {
      let newStock = product.currentStock;
      
      switch (transaction.transactionType) {
        case 'receive':
          newStock += transaction.quantity;
          break;
        case 'sale':
          newStock -= transaction.quantity;
          break;
        case 'adjustment':
          newStock += transaction.quantity; // Can be + or - for adjustments
          break;
        case 'count':
          newStock = transaction.quantity; // Override with counted value
          break;
      }
      
      this.products.set(product.id, { ...product, currentStock: newStock });
    }
    
    return transaction;
  }

  async listTransactions(productId?: number): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values());
    
    if (productId) {
      transactions = transactions.filter(t => t.productId === productId);
    }
    
    return transactions.sort((a, b) => 
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );
  }

  // Purchase order operations
  async getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined> {
    return this.purchaseOrders.get(id);
  }

  async createPurchaseOrder(insertOrder: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const id = this.purchaseOrderIdCounter++;
    const orderNumber = generateOrderNumber();
    
    const order: PurchaseOrder = { 
      ...insertOrder, 
      id,
      orderNumber,
      orderDate: new Date()
    };
    
    this.purchaseOrders.set(id, order);
    return order;
  }

  async updatePurchaseOrderStatus(id: number, status: PurchaseOrder["status"]): Promise<PurchaseOrder | undefined> {
    const order = this.purchaseOrders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, status };
    this.purchaseOrders.set(id, updatedOrder);
    
    // If status is completed, update inventory
    if (status === 'completed') {
      const items = await this.listPurchaseOrderItems(id);
      
      for (const item of items) {
        const product = this.products.get(item.productId);
        if (product) {
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
    
    return updatedOrder;
  }

  async listPurchaseOrders(status?: PurchaseOrder["status"]): Promise<PurchaseOrder[]> {
    let orders = Array.from(this.purchaseOrders.values());
    
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    
    return orders.sort((a, b) => 
      new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
  }

  // Purchase order item operations
  async createPurchaseOrderItem(insertItem: InsertPurchaseOrderItem): Promise<PurchaseOrderItem> {
    const id = this.purchaseOrderItemIdCounter++;
    const item: PurchaseOrderItem = { ...insertItem, id };
    this.purchaseOrderItems.set(id, item);
    
    // Update purchase order total value
    const order = this.purchaseOrders.get(item.purchaseOrderId);
    if (order) {
      const updatedOrder = { 
        ...order, 
        totalValue: (order.totalValue || 0) + item.totalPrice 
      };
      this.purchaseOrders.set(order.id, updatedOrder);
    }
    
    return item;
  }

  async listPurchaseOrderItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]> {
    return Array.from(this.purchaseOrderItems.values())
      .filter(item => item.purchaseOrderId === purchaseOrderId);
  }

  // Forecast operations
  async createForecastData(insertForecast: InsertForecastData): Promise<ForecastData> {
    const id = this.forecastDataIdCounter++;
    const forecast: ForecastData = { ...insertForecast, id };
    this.forecastData.set(id, forecast);
    return forecast;
  }

  async getProductForecast(productId: number): Promise<ForecastData[]> {
    return Array.from(this.forecastData.values())
      .filter(forecast => forecast.productId === productId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Add some initial data for testing
  private async seedInitialData() {
    // Create default admin user
    await this.createUser({
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
    
    // Create some purchase orders
    const po1 = await this.createPurchaseOrder({
      supplierId: freshFarms.id,
      expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      status: "completed",
      notes: "Regular weekly order",
      isAutomated: false,
      userId: 2 // Manager
    });
    
    const po2 = await this.createPurchaseOrder({
      supplierId: organicValley.id,
      expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      status: "in_progress",
      notes: "Emergency order",
      isAutomated: false,
      userId: 2 // Manager
    });
    
    const po3 = await this.createPurchaseOrder({
      supplierId: bakerySupplies.id,
      expectedDeliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      status: "pending",
      notes: "Auto-generated based on low stock",
      isAutomated: true,
      userId: 2 // Manager
    });
    
    // Create PO items
    await this.createPurchaseOrderItem({
      purchaseOrderId: po1.id,
      productId: apples.id,
      quantity: 50,
      unitPrice: apples.price,
      totalPrice: 50 * apples.price
    });
    
    await this.createPurchaseOrderItem({
      purchaseOrderId: po2.id,
      productId: milk.id,
      quantity: 40,
      unitPrice: milk.price,
      totalPrice: 40 * milk.price
    });
    
    await this.createPurchaseOrderItem({
      purchaseOrderId: po3.id,
      productId: bread.id,
      quantity: 30,
      unitPrice: bread.price,
      totalPrice: 30 * bread.price
    });
    
    // Add some transaction history
    await this.createTransaction({
      productId: apples.id,
      quantity: 50,
      transactionType: "receive",
      notes: "Initial stock",
      userId: 2
    });
    
    await this.createTransaction({
      productId: apples.id,
      quantity: 38,
      transactionType: "sale",
      notes: "Daily sales",
      userId: 3
    });
    
    await this.createTransaction({
      productId: milk.id,
      quantity: 50,
      transactionType: "receive",
      notes: "Initial stock",
      userId: 2
    });
    
    await this.createTransaction({
      productId: milk.id,
      quantity: 35,
      transactionType: "sale",
      notes: "Daily sales",
      userId: 3
    });
    
    await this.createTransaction({
      productId: bread.id,
      quantity: 30,
      transactionType: "receive",
      notes: "Initial stock",
      userId: 2
    });
    
    await this.createTransaction({
      productId: bread.id,
      quantity: 22,
      transactionType: "sale",
      notes: "Daily sales",
      userId: 3
    });
    
    // Create some forecast data
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      
      await this.createForecastData({
        productId: apples.id,
        date: forecastDate,
        forecastedDemand: 5 + Math.random() * 3,
        modelParameters: {
          confidence: 0.85,
          method: "moving_average"
        }
      });
      
      await this.createForecastData({
        productId: milk.id,
        date: forecastDate,
        forecastedDemand: 7 + Math.random() * 4,
        modelParameters: {
          confidence: 0.82,
          method: "moving_average"
        }
      });
      
      await this.createForecastData({
        productId: bread.id,
        date: forecastDate,
        forecastedDemand: 4 + Math.random() * 2,
        modelParameters: {
          confidence: 0.79,
          method: "moving_average"
        }
      });
    }
  }
}

export const storage = new MemStorage();
