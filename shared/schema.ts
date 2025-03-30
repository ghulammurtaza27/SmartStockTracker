import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table with role-based access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role", { enum: ["admin", "manager", "associate"] }).notNull().default("associate"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Product categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

// Suppliers for products
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  leadTime: integer("lead_time").default(1), // in days
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
});

// Product inventory
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  barcode: text("barcode").unique(),
  sku: text("sku").unique(),
  categoryId: integer("category_id").references(() => categories.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  unit: text("unit").default("each"), // e.g., each, kg, liter
  price: real("price").notNull(),
  currentStock: real("current_stock").notNull().default(0),
  minStockLevel: real("min_stock_level").default(0),
  maxStockLevel: real("max_stock_level"),
  reorderPoint: real("reorder_point").default(0),
  reorderQuantity: real("reorder_quantity").default(0),
  location: text("location"),
  isActive: boolean("is_active").default(true),
  discountPercentage: real("discount_percentage").default(0),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

// Inventory transactions (e.g., stock receipts, sales)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  quantity: real("quantity").notNull(),
  transactionType: text("transaction_type", { enum: ["receive", "sale", "adjustment", "count"] }).notNull(),
  transactionDate: timestamp("transaction_date").defaultNow(),
  notes: text("notes"),
  userId: integer("user_id").references(() => users.id),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  transactionDate: true,
});

// Purchase orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  orderDate: timestamp("order_date").defaultNow(),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  status: text("status", { 
    enum: ["draft", "pending", "approved", "in_progress", "completed", "cancelled"] 
  }).default("draft"),
  totalValue: real("total_value").default(0),
  notes: text("notes"),
  isAutomated: boolean("is_automated").default(false),
  userId: integer("user_id").references(() => users.id),
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  orderDate: true,
  orderNumber: true,
});

// Purchase order items
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id),
  productId: integer("product_id").references(() => products.id),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
  id: true,
});

// AI forecasting model data
export const forecastData = pgTable("forecast_data", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  date: timestamp("date").notNull(),
  forecastedDemand: real("forecasted_demand").notNull(),
  actualDemand: real("actual_demand"),
  accuracy: real("accuracy"),
  modelParameters: jsonb("model_parameters"),
});

export const insertForecastDataSchema = createInsertSchema(forecastData).omit({
  id: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;

export type ForecastData = typeof forecastData.$inferSelect;
export type InsertForecastData = z.infer<typeof insertForecastDataSchema>;