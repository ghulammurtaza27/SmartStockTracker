// Using direct imports without dotenv since environment is already set up
import { db } from '../server/db.js';
import { products, suppliers, categories, transactions, purchaseOrders, purchaseOrderItems, forecastData } from '../shared/schema.js';
import { sql } from 'drizzle-orm';

async function seedData() {
  console.log('Starting database seed process...');
  
  // Add more categories
  console.log('Adding categories...');
  await db.insert(categories)
    .values([
      { name: 'Dairy', description: 'Milk, cheese, and other dairy products' },
      { name: 'Bakery', description: 'Bread, pastries, and baked goods' },
      { name: 'Meat', description: 'Fresh and frozen meat products' },
      { name: 'Beverages', description: 'Drinks, juices, and bottled water' },
      { name: 'Snacks', description: 'Chips, nuts, and snack foods' }
    ])
    .onConflictDoNothing();
    
  // Fetch all category IDs
  const fetchedCategories = await db.select().from(categories);
  console.log('Categories in database:', fetchedCategories.map(c => ({ id: c.id, name: c.name })));
    
  // Add more suppliers
  console.log('Adding suppliers...');
  const supplierIds = await db.insert(suppliers)
    .values([
      { 
        name: 'Dairy Delight', 
        contactName: 'Sarah Johnson', 
        email: 'sarah@dairydelight.com', 
        phone: '555-123-4567', 
        address: '123 Milk Road, Dairy City, DC 12345',
        paymentTerms: 'Net 30'
      },
      { 
        name: 'Baker Bros', 
        contactName: 'Mike Baker', 
        email: 'mike@bakerbros.com', 
        phone: '555-765-4321', 
        address: '456 Bread Street, Bakerville, BV 67890',
        paymentTerms: 'Net 15'
      },
      { 
        name: 'Prime Meats', 
        contactName: 'John Smith', 
        email: 'john@primemeats.com', 
        phone: '555-987-6543', 
        address: '789 Butcher Avenue, Meattown, MT 13579',
        paymentTerms: 'Net 45'
      },
      { 
        name: 'Refreshing Beverages Inc', 
        contactName: 'Linda Waters', 
        email: 'linda@refreshingbeverages.com', 
        phone: '555-246-8135', 
        address: '321 Fountain Lane, Drinkville, DV 24680',
        paymentTerms: 'Net 30'
      }
    ])
    .onConflictDoNothing()
    .returning({ id: suppliers.id });
  
  // Fetch all suppliers
  const fetchedSuppliers = await db.select().from(suppliers);
  console.log('Suppliers in database:', fetchedSuppliers.map(s => ({ id: s.id, name: s.name })));
  
  // Map category names to IDs for easier reference
  const categoryMap = {};
  fetchedCategories.forEach(cat => {
    categoryMap[cat.name.toLowerCase()] = cat.id;
  });
  
  // Default to produce category if needed
  const defaultCategoryId = fetchedCategories[0]?.id || 1;
  
  // Add more products
  console.log('Adding products...');
  const productIds = await db.insert(products)
    .values([
      {
        name: 'Whole Milk',
        description: 'Fresh whole milk, 1 gallon',
        sku: 'DAIRY-MILK-01',
        barcode: '7891234567890',
        categoryId: categoryMap['dairy'] || defaultCategoryId,
        supplierId: 1,
        price: 3.99,
        cost: 2.50,
        unit: 'gallon',
        currentStock: 25,
        reorderPoint: 10,
        reorderQuantity: 20,
        location: 'A1-B2'
      },
      {
        name: 'Artisan Sourdough Bread',
        description: 'Freshly baked sourdough loaf',
        sku: 'BAKERY-BREAD-01',
        barcode: '7891234567891',
        categoryId: categoryMap['bakery'] || defaultCategoryId,
        supplierId: 1,
        price: 4.99,
        cost: 2.25,
        unit: 'loaf',
        currentStock: 15,
        reorderPoint: 5,
        reorderQuantity: 15,
        location: 'B3-C4'
      },
      {
        name: 'Premium Ground Beef',
        description: 'Grass-fed ground beef, 1 pound',
        sku: 'MEAT-BEEF-01',
        barcode: '7891234567892',
        categoryId: categoryMap['meat'] || defaultCategoryId,
        supplierId: 1,
        price: 6.99,
        cost: 4.50,
        unit: 'lb',
        currentStock: 18,
        reorderPoint: 8,
        reorderQuantity: 15,
        location: 'C5-D6'
      },
      {
        name: 'Spring Water',
        description: 'Natural spring water, 24-pack',
        sku: 'BEV-WATER-01',
        barcode: '7891234567893',
        categoryId: categoryMap['beverages'] || defaultCategoryId,
        supplierId: 1,
        price: 5.99,
        cost: 3.25,
        unit: 'pack',
        currentStock: 30,
        reorderPoint: 10,
        reorderQuantity: 20,
        location: 'D7-E8'
      },
      {
        name: 'Organic Potato Chips',
        description: 'Kettle-cooked potato chips, 8oz bag',
        sku: 'SNACK-CHIPS-01',
        barcode: '7891234567894',
        categoryId: categoryMap['snacks'] || defaultCategoryId,
        supplierId: 1,
        price: 3.49,
        cost: 1.75,
        unit: 'bag',
        currentStock: 45,
        reorderPoint: 15,
        reorderQuantity: 30,
        location: 'E9-F10'
      }
    ])
    .onConflictDoNothing()
    .returning({ id: products.id });
  
  // Fetch all products first before creating transactions
  const fetchedProducts = await db.select().from(products);
  console.log('Products in database:', fetchedProducts.map(p => ({ id: p.id, name: p.name })));
  
  // Create some transactions only if we have products
  if (fetchedProducts.length > 0) {
    console.log('Adding transactions...');
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    // Prepare transaction entries using valid product IDs
    const transactionEntries = [];
    
    // Add transactions for the first product
    if (fetchedProducts.length >= 1) {
      transactionEntries.push({
        productId: fetchedProducts[0].id,
        transactionType: 'sale',
        quantity: 5,
        transactionDate: threeDaysAgo,
        notes: 'Regular sale'
      });
      
      transactionEntries.push({
        productId: fetchedProducts[0].id,
        transactionType: 'sale',
        quantity: 3,
        transactionDate: twoDaysAgo,
        notes: 'Regular sale'
      });
      
      transactionEntries.push({
        productId: fetchedProducts[0].id,
        transactionType: 'sale',
        quantity: 4,
        transactionDate: yesterday,
        notes: 'Regular sale'
      });
    }
    
    // Add transactions for the second product
    if (fetchedProducts.length >= 2) {
      transactionEntries.push({
        productId: fetchedProducts[1].id,
        transactionType: 'sale',
        quantity: 2,
        transactionDate: threeDaysAgo,
        notes: 'Regular sale'
      });
      
      transactionEntries.push({
        productId: fetchedProducts[1].id,
        transactionType: 'sale',
        quantity: 3,
        transactionDate: twoDaysAgo,
        notes: 'Regular sale'
      });
      
      transactionEntries.push({
        productId: fetchedProducts[1].id,
        transactionType: 'receive',
        quantity: 10,
        transactionDate: yesterday,
        notes: 'Regular stock replenishment'
      });
    }
    
    // Add transactions for additional products
    if (fetchedProducts.length >= 3) {
      transactionEntries.push({
        productId: fetchedProducts[2].id,
        transactionType: 'sale',
        quantity: 3,
        transactionDate: threeDaysAgo,
        notes: 'Regular sale'
      });
    }
    
    if (fetchedProducts.length >= 4) {
      transactionEntries.push({
        productId: fetchedProducts[3].id,
        transactionType: 'sale',
        quantity: 5,
        transactionDate: twoDaysAgo,
        notes: 'Regular sale'
      });
    }
    
    if (fetchedProducts.length >= 5) {
      transactionEntries.push({
        productId: fetchedProducts[4].id,
        transactionType: 'sale',
        quantity: 8,
        transactionDate: yesterday,
        notes: 'Regular sale'
      });
    }
    
    // Insert transactions if we have any to insert
    if (transactionEntries.length > 0) {
      await db.insert(transactions)
        .values(transactionEntries)
        .onConflictDoNothing();
    }
  } else {
    console.log('Skipping transactions - no products available');
  }
  
  // Already have fetchedProducts, no need to fetch again

  // Create some purchase orders - make sure we use valid supplier IDs
  console.log('Adding purchase orders...');
  const orderDate = new Date();
  const expectedDeliveryDate = new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  // Use first supplier ID as default if needed
  const defaultSupplierId = fetchedSuppliers[0]?.id || 1;
  
  const orderIds = await db.insert(purchaseOrders)
    .values([
      {
        orderNumber: 'PO-2023-001',
        supplierId: defaultSupplierId,
        orderDate,
        expectedDeliveryDate,
        status: 'pending',
        totalValue: 150.00,
        notes: 'Regular dairy order',
        isAutomated: false
      },
      {
        orderNumber: 'PO-2023-002',
        supplierId: defaultSupplierId,
        orderDate,
        expectedDeliveryDate,
        status: 'in_progress',
        totalValue: 112.50,
        notes: 'Bakery items order',
        isAutomated: true
      },
      {
        orderNumber: 'PO-2023-003',
        supplierId: defaultSupplierId,
        orderDate: new Date(orderDate.getTime() - 14 * 24 * 60 * 60 * 1000),
        expectedDeliveryDate: new Date(orderDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        status: 'completed',
        totalValue: 225.00,
        notes: 'Meat products order',
        isAutomated: false
      }
    ])
    .onConflictDoNothing()
    .returning({ id: purchaseOrders.id });
  
  if (orderIds && orderIds.length > 0 && fetchedProducts.length > 0) {
    // Add purchase order items, ensuring valid product IDs are used
    console.log('Adding purchase order items...');
    
    // Get valid product IDs - use first product as default if needed
    const defaultProductId = fetchedProducts[0].id;
    
    // Create an array of values for order items, using the actual product IDs
    const orderItemValues = [];
    
    // For each order, add an item with a valid product ID
    if (orderIds.length >= 1 && fetchedProducts.length >= 1) {
      orderItemValues.push({
        purchaseOrderId: orderIds[0].id,
        productId: fetchedProducts[0].id,
        quantity: 60,
        unitPrice: 2.50,
        totalPrice: 150.00
      });
    }
    
    if (orderIds.length >= 2 && fetchedProducts.length >= 1) {
      orderItemValues.push({
        purchaseOrderId: orderIds[1].id,
        productId: fetchedProducts[0].id,
        quantity: 50,
        unitPrice: 2.25,
        totalPrice: 112.50
      });
    }
    
    if (orderIds.length >= 3 && fetchedProducts.length >= 1) {
      orderItemValues.push({
        purchaseOrderId: orderIds[2].id,
        productId: fetchedProducts[0].id,
        quantity: 50,
        unitPrice: 4.50,
        totalPrice: 225.00
      });
    }
    
    // Insert the order items if we have any
    if (orderItemValues.length > 0) {
      await db.insert(purchaseOrderItems)
        .values(orderItemValues)
        .onConflictDoNothing();
    }
  }
  
  // Create forecast data only if we have products to create it for
  if (fetchedProducts.length > 0) {
    console.log('Adding forecast data...');
    const startDate = new Date();
    
    // Generate forecast data for each product
    for (let i = 0; i < 14; i++) {
      const forecastDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      
      // Create forecast entries for each product
      const forecastEntries = fetchedProducts.map(product => ({
        productId: product.id,
        date: forecastDate,
        forecastedDemand: Math.floor(Math.random() * 10) + 5,
        actualDemand: i < 3 ? Math.floor(Math.random() * 10) + 3 : null,
        confidence: Math.random() * 0.2 + 0.8
      }));
      
      // Only proceed if we have forecast entries to add
      if (forecastEntries.length > 0) {
        await db.insert(forecastData)
          .values(forecastEntries)
          .onConflictDoNothing();
      }
    }
  } else {
    console.log('Skipping forecast data - no products available');
  }
  
  console.log('Seed data has been added successfully!');
}

seedData()
  .then(() => {
    console.log('Database seeding complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });