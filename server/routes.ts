import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertProductSchema, 
  insertTransactionSchema, 
  insertPurchaseOrderSchema,
  insertPurchaseOrderItemSchema,
  insertSupplierSchema,
  insertCategorySchema,
  insertDepartmentSchema
} from "@shared/schema";
import { generateOrderNumber } from "./utils";
import { forecastDemand } from "./forecast";
import multer from "multer";
import { parse } from "csv-parse";
import { format } from "date-fns";
import fs from 'fs';

const upload = multer({ dest: "uploads/" });

export async function registerRoutes(app: Express): Promise<Server> {
  // CSV Upload endpoint
  app.post("/api/products/upload-csv", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const records = [];
      const parser = parse({ columns: true, trim: true });

      const fileStream = fs.createReadStream(req.file.path);

      for await (const record of fileStream.pipe(parser)) {
        const product = {
          name: record.name,
          description: record.description || null,
          barcode: record.barcode || null,
          sku: record.sku || null,
          categoryId: record.categoryId ? parseInt(record.categoryId) : null,
          supplierId: record.supplierId ? parseInt(record.supplierId) : null,
          unit: record.unit || "each",
          price: parseFloat(record.price) || 0,
          currentStock: parseFloat(record.currentStock) || 0,
          minStockLevel: record.minStockLevel ? parseFloat(record.minStockLevel) : null,
          maxStockLevel: record.maxStockLevel ? parseFloat(record.maxStockLevel) : null,
          reorderPoint: record.reorderPoint ? parseFloat(record.reorderPoint) : null,
          reorderQuantity: record.reorderQuantity ? parseFloat(record.reorderQuantity) : null,
          location: record.location || null,
          expiryDate: record.expiryDate ? new Date(record.expiryDate) : null,
          departmentId: record.departmentId ? parseInt(record.departmentId) : null, // Add departmentId
        };

        const validatedData = insertProductSchema.parse(product);
        records.push(await storage.createProduct(validatedData));
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.status(201).json({ 
        message: `Successfully imported ${records.length} products`,
        products: records 
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid CSV data" });
    }
  });

  // Get products near expiry
  app.get("/api/products/near-expiry", async (req, res) => {
    const daysThreshold = parseInt(req.query.days as string) || 30;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const products = await storage.getProductsNearExpiry(thresholdDate);
    res.json(products);
  });
  // Set up authentication routes (/api/login, /api/register, etc.)
  setupAuth(app);

  // Categories API
  app.get("/api/categories", async (req, res) => {
    const categories = await storage.listCategories();
    res.json(categories);
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  // Suppliers API
  app.get("/api/suppliers", async (req, res) => {
    const suppliers = await storage.listSuppliers();
    res.json(suppliers);
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(400).json({ error: "Invalid supplier data" });
    }
  });

  // Products API
  app.get("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const products = await storage.listProducts();

    // Filter products based on user role and department
    if (req.user.role !== 'admin') {
      const filteredProducts = products.filter(p => p.departmentId === req.user.departmentId);
      return res.json(filteredProducts);
    }

    res.json(products);
  });

  app.get("/api/products/low-stock", async (req, res) => {
    const products = await storage.getProductsWithLowStock();
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const product = await storage.getProduct(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const updatedProduct = await storage.updateProduct(id, req.body);
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  // Barcode scanning
  app.get("/api/scan/:barcode", async (req, res) => {
    const barcode = req.params.barcode;
    const product = await storage.getProductByBarcode(barcode);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  });

  // Inventory transactions
  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ error: "Invalid transaction data" });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
    const transactions = await storage.listTransactions(productId);
    res.json(transactions);
  });

  // Purchase orders
  app.get("/api/purchase-orders", async (req, res) => {
    const status = req.query.status as string | undefined;
    const orders = await storage.listPurchaseOrders(status as any);
    res.json(orders);
  });

  app.get("/api/purchase-orders/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const order = await storage.getPurchaseOrder(id);

    if (!order) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    const items = await storage.listPurchaseOrderItems(id);

    res.json({
      ...order,
      items
    });
  });

  app.post("/api/purchase-orders", async (req, res) => {
    try {
      const validatedData = insertPurchaseOrderSchema.parse(req.body);
      const order = await storage.createPurchaseOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: "Invalid purchase order data" });
    }
  });

  app.post("/api/purchase-orders/:id/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getPurchaseOrder(orderId);

      if (!order) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      const validatedData = insertPurchaseOrderItemSchema.parse({
        ...req.body,
        purchaseOrderId: orderId
      });

      const item = await storage.createPurchaseOrderItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid purchase order item data" });
    }
  });

  app.put("/api/purchase-orders/:id/status", async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    try {
      const updatedOrder = await storage.updatePurchaseOrderStatus(id, status);

      if (!updatedOrder) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      res.json(updatedOrder);
    } catch (error) {
      res.status(400).json({ error: "Invalid status update" });
    }
  });

  // Forecasting
  app.get("/api/forecast/:productId", async (req, res) => {
    const productId = parseInt(req.params.productId);
    const product = await storage.getProduct(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const existingForecast = await storage.getProductForecast(productId);

    // If we have recent forecast data, return it
    if (existingForecast.length > 0) {
      res.json(existingForecast);
    } else {
      // Otherwise generate a new forecast
      const transactions = await storage.listTransactions(productId);

      const historicalDemand = transactions
        .filter(t => t.transactionType === "sale")
        .map(t => ({ date: t.transactionDate, demand: t.quantity }));

      try {
        const forecast = forecastDemand(productId, historicalDemand);

        // Save the forecast
        for (const day of forecast) {
          await storage.createForecastData({
            productId,
            date: day.date,
            forecastedDemand: day.demand,
            modelParameters: { method: "moving_average", confidence: 0.8 }
          });
        }

        res.json(forecast);
      } catch (error) {
        res.status(500).json({ error: "Failed to generate forecast" });
      }
    }
  });

  // Auto-replenishment
  app.post("/api/auto-replenish", async (req, res) => {
    try {
      // Get all products below reorder point
      const lowStockProducts = await storage.getProductsWithLowStock();

      if (lowStockProducts.length === 0) {
        return res.json({ message: "No products need replenishment" });
      }

      // Group by supplier
      const supplierGroups = new Map();

      for (const product of lowStockProducts) {
        if (!product.supplierId) continue;

        if (!supplierGroups.has(product.supplierId)) {
          supplierGroups.set(product.supplierId, []);
        }

        supplierGroups.get(product.supplierId).push(product);
      }

      // Create purchase orders by supplier
      const createdOrders = [];

      for (const [supplierId, products] of supplierGroups.entries()) {
        const supplier = await storage.getSupplier(supplierId);
        if (!supplier) continue;

        // Create a new purchase order
        const order = await storage.createPurchaseOrder({
          supplierId,
          expectedDeliveryDate: new Date(Date.now() + supplier.leadTime * 24 * 60 * 60 * 1000),
          status: "pending",
          notes: "Auto-generated based on low stock levels",
          isAutomated: true,
          userId: req.user?.id || 1 // Default to admin if not authenticated
        });

        // Add items to the order
        for (const product of products) {
          const orderQuantity = product.reorderQuantity || 
                               (product.maxStockLevel - product.currentStock) || 
                               10; // Default if no reorder quantity set

          await storage.createPurchaseOrderItem({
            purchaseOrderId: order.id,
            productId: product.id,
            quantity: orderQuantity,
            unitPrice: product.price,
            totalPrice: orderQuantity * product.price
          });
        }

        createdOrders.push(order);
      }

      res.status(201).json({ 
        message: `Created ${createdOrders.length} purchase orders for ${lowStockProducts.length} products`,
        orders: createdOrders
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to auto-generate purchase orders" });
    }
  });

  // Analytics
  app.get("/api/analytics/inventory-summary", async (req, res) => {
    try {
      const products = await storage.listProducts();
      const lowStockCount = products.filter(p => p.currentStock <= p.reorderPoint).length;
      const outOfStockCount = products.filter(p => p.currentStock === 0).length;
      const healthyStockCount = products.filter(p => p.currentStock > p.reorderPoint).length;

      const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.price), 0);

      const orders = await storage.listPurchaseOrders();
      const pendingOrdersCount = orders.filter(o => o.status === "pending").length;
      const inProgressOrdersCount = orders.filter(o => o.status === "in_progress").length;
      const automatedOrdersCount = orders.filter(o => o.isAutomated).length;

      res.json({
        totalProducts: products.length,
        lowStockCount,
        outOfStockCount,
        healthyStockCount,
        totalInventoryValue: totalValue,
        pendingOrdersCount,
        inProgressOrdersCount,
        automatedOrdersCount
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate analytics" });
    }
  });

  // Department management routes
  app.get("/api/departments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const departments = await storage.listDepartments();
    res.json(departments);
  });

  app.post("/api/departments", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }

    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      res.status(201).json(department);
    } catch (error) {
      res.status(400).json({ error: "Invalid department data" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}