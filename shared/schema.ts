import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Departments (e.g., Produce, Dairy, Meat, etc.)
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  managerId: integer("manager_id"),
  locationArea: text("location_area"),
  temperatureRequirement: text("temperature_requirement"),
});

// User table with role-based access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role", { enum: ["admin", "department_head", "associate"] }).notNull().default("associate"),
  departmentId: integer("department_id").references(() => departments.id),
  contactPhone: text("contact_phone"),
  emergencyContact: text("emergency_contact"),
  shift: text("shift", { enum: ["morning", "afternoon", "night"] }),
});

// Product categories within departments
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  departmentId: integer("department_id").references(() => departments.id),
});

// Suppliers
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  leadTime: integer("lead_time").default(1),
  preferredDeliveryTime: text("preferred_delivery_time"),
  paymentTerms: text("payment_terms"),
  rating: integer("rating"),
});

// Product inventory
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  barcode: text("barcode").unique(),
  sku: text("sku").unique(),
  category_id: integer("category_id").references(() => categories.id),
  supplier_id: integer("supplier_id").references(() => suppliers.id),
  unit: text("unit").default("each"),
  price: real("price").notNull(),
  salePrice: real("sale_price"),
  saleStartDate: date("sale_start_date"),
  saleEndDate: date("sale_end_date"),
  current_stock: real("current_stock").notNull().default(0),
  min_stock_level: real("min_stock_level").default(0),
  max_stock_level: real("max_stock_level"),
  reorder_point: real("reorder_point").default(0),
  reorder_quantity: real("reorder_quantity").default(0),
  location: text("location"),
  expiration_date: date("expiration_date"),
  is_perishable: boolean("is_perishable").default(false),
  is_active: boolean("is_active").default(true),
});

// Inventory transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  quantity: real("quantity").notNull(),
  transactionType: text("transaction_type", { 
    enum: ["receive", "sale", "adjustment", "count", "waste", "return"] 
  }).notNull(),
  transactionDate: timestamp("transaction_date").defaultNow(),
  notes: text("notes"),
  userId: integer("user_id").references(() => users.id),
  reason: text("reason"),
  batchNumber: text("batch_number"),
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
  deliveryInstructions: text("delivery_instructions"),
  departmentId: integer("department_id").references(() => departments.id),
});

// Purchase order items
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id),
  productId: integer("product_id").references(() => products.id),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  receivedQuantity: real("received_quantity").default(0),
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
  weatherConditions: text("weather_conditions"),
  seasonalFactor: real("seasonal_factor"),
});

// Create insert schemas
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, transactionDate: true });
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({ id: true, orderDate: true, orderNumber: true });
export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({ id: true });
export const insertForecastDataSchema = createInsertSchema(forecastData).omit({ id: true });

// Export types
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

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