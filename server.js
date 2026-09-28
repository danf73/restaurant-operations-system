const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for orders and analytics
let orders = [];
let orderCounter = 1;
let dailyStats = {
  totalOrders: 0,
  totalRevenue: 0,
  averageOrderValue: 0,
  peakHours: {},
  popularItems: {}
};

// Store for promotions and discounts
let promotions = [
  {
    id: 1,
    name: 'Happy Hour',
    description: '20% off beverages between 2-4 PM',
    discount: 0.20,
    category: 'Beverages',
    active: true,
    startTime: '14:00',
    endTime: '16:00'
  },
  {
    id: 2,
    name: 'Family Combo',
    description: 'Buy 2 burgers get 1 fries free',
    discount: 0,
    minItems: 2,
    category: 'Burgers',
    active: true,
    freeItem: 5 // Large Fries ID
  }
];

// Customer feedback storage
let feedback = [];

// Loyalty program
let loyaltyProgram = {
  pointsPerDollar: 10,
  rewardThreshold: 100,
  rewards: [
    { id: 1, name: 'Free Fries', cost: 100, itemId: 5 },
    { id: 2, name: 'Free Drink', cost: 80, category: 'Beverages' },
    { id: 3, name: '10% Off Next Order', cost: 150, discount: 0.10 }
  ]
};

// Order statuses
const ORDER_STATUS = {
  NEW: 'new',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed'
};

// Enhanced menu items with more details
const menuItems = [
  { 
    id: 1, 
    name: 'Classic Double Burger', 
    price: 5.99, 
    category: 'Burgers', 
    prepTime: 180,
    description: 'Two all-beef patties, special sauce, lettuce, cheese, pickles, onions on a sesame seed bun',
    calories: 563,
    image: '🍔',
    allergens: ['gluten', 'dairy', 'sesame'],
    popular: true,
    spicy: false
  },
  { 
    id: 2, 
    name: 'Signature Burger', 
    price: 6.49, 
    category: 'Burgers', 
    prepTime: 240,
    description: 'Quarter pound of 100% fresh beef cooked when you order',
    calories: 520,
    image: '🍔',
    allergens: ['gluten', 'dairy'],
    popular: true,
    spicy: false
  },
  { 
    id: 3, 
    name: 'Crispy Chicken Bites (10pc)', 
    price: 4.99, 
    category: 'Chicken', 
    prepTime: 120,
    description: 'Tender white meat chicken in a crispy coating',
    calories: 440,
    image: '🍗',
    allergens: ['gluten'],
    popular: true,
    spicy: false
  },
  { 
    id: 4, 
    name: 'Crispy Chicken Sandwich', 
    price: 3.99, 
    category: 'Chicken', 
    prepTime: 150,
    description: 'Crispy chicken breast with lettuce and mayo',
    calories: 400,
    image: '🐔',
    allergens: ['gluten', 'eggs'],
    popular: false,
    spicy: false
  },
  { 
    id: 5, 
    name: 'Large Fries', 
    price: 2.79, 
    category: 'Sides', 
    prepTime: 90,
    description: 'Golden crispy fries with our signature salt',
    calories: 340,
    image: '🍟',
    allergens: [],
    popular: true,
    spicy: false
  },
  { 
    id: 6, 
    name: 'House Cola (Large)', 
    price: 1.99, 
    category: 'Beverages', 
    prepTime: 30,
    description: 'Refreshing house cola soft drink',
    calories: 290,
    image: '🥤',
    allergens: [],
    popular: false,
    spicy: false
  },
  { 
    id: 7, 
    name: 'Cookie Cream Sundae', 
    price: 3.49, 
    category: 'Desserts', 
    prepTime: 60,
    description: 'Creamy vanilla soft serve with your choice of mix-ins',
    calories: 510,
    image: '🍦',
    allergens: ['dairy'],
    popular: false,
    spicy: false
  },
  { 
    id: 8, 
    name: 'Spicy Chicken Deluxe', 
    price: 5.79, 
    category: 'Chicken', 
    prepTime: 200,
    description: 'Spicy breaded chicken breast with lettuce, tomato, and mayo',
    calories: 480,
    image: '🌶️',
    allergens: ['gluten', 'eggs'],
    popular: false,
    spicy: true
  },
  
  // Extended Burger Menu
  { 
    id: 9, 
    name: 'Double Signature Burger', 
    price: 8.99, 
    category: 'Burgers', 
    prepTime: 300,
    description: 'Two quarter pound patties of 100% fresh beef',
    calories: 770,
    image: '🍔',
    allergens: ['gluten', 'dairy'],
    popular: true,
    spicy: false
  },
  { 
    id: 10, 
    name: 'Cheeseburger', 
    price: 2.49, 
    category: 'Burgers', 
    prepTime: 120,
    description: 'Classic cheeseburger with pickle, onion, ketchup, and mustard',
    calories: 300,
    image: '🍔',
    allergens: ['gluten', 'dairy'],
    popular: true,
    spicy: false
  },
  { 
    id: 11, 
    name: 'Hamburger', 
    price: 1.99, 
    category: 'Burgers', 
    prepTime: 120,
    description: 'Classic hamburger with pickle, onion, ketchup, and mustard',
    calories: 250,
    image: '🍔',
    allergens: ['gluten'],
    popular: false,
    spicy: false
  },
  { 
    id: 12, 
    name: 'Double Cheeseburger', 
    price: 3.99, 
    category: 'Burgers', 
    prepTime: 180,
    description: 'Two beef patties with cheese, pickle, onion, ketchup, and mustard',
    calories: 450,
    image: '🍔',
    allergens: ['gluten', 'dairy'],
    popular: true,
    spicy: false
  },
  
  // Extended Chicken Menu
  { 
    id: 13, 
    name: 'Crispy Chicken Bites (6pc)', 
    price: 3.49, 
    category: 'Chicken', 
    prepTime: 120,
    description: 'Six pieces of tender white meat chicken',
    calories: 260,
    image: '🍗',
    allergens: ['gluten'],
    popular: true,
    spicy: false
  },
  { 
    id: 14, 
    name: 'Crispy Chicken Bites (20pc)', 
    price: 8.99, 
    category: 'Chicken', 
    prepTime: 180,
    description: 'Twenty pieces of tender white meat chicken',
    calories: 880,
    image: '🍗',
    allergens: ['gluten'],
    popular: false,
    spicy: false
  },
  { 
    id: 15, 
    name: 'Crispy Fish Sandwich', 
    price: 4.49, 
    category: 'Fish', 
    prepTime: 240,
    description: 'Wild-caught Alaska Pollock fillet with tartar sauce and cheese',
    calories: 390,
    image: '🐟',
    allergens: ['gluten', 'dairy', 'fish'],
    popular: false,
    spicy: false
  },
  
  // Extended Sides Menu
  { 
    id: 16, 
    name: 'Medium Fries', 
    price: 2.29, 
    category: 'Sides', 
    prepTime: 90,
    description: 'Golden crispy fries with our signature salt',
    calories: 320,
    image: '🍟',
    allergens: [],
    popular: true,
    spicy: false
  },
  { 
    id: 17, 
    name: 'Small Fries', 
    price: 1.89, 
    category: 'Sides', 
    prepTime: 90,
    description: 'Golden crispy fries with our signature salt',
    calories: 230,
    image: '🍟',
    allergens: [],
    popular: true,
    spicy: false
  },
  { 
    id: 18, 
    name: 'Apple Slices', 
    price: 1.29, 
    category: 'Sides', 
    prepTime: 30,
    description: 'Fresh apple slices with caramel dip',
    calories: 15,
    image: '🍎',
    allergens: [],
    popular: false,
    spicy: false
  },
  
  // Extended Beverages Menu
  { 
    id: 19, 
    name: 'House Cola (Medium)', 
    price: 1.69, 
    category: 'Beverages', 
    prepTime: 30,
    description: 'Refreshing house cola soft drink',
    calories: 210,
    image: '🥤',
    allergens: [],
    popular: true,
    spicy: false
  },
  { 
    id: 20, 
    name: 'House Cola (Small)', 
    price: 1.39, 
    category: 'Beverages', 
    prepTime: 30,
    description: 'Refreshing house cola soft drink',
    calories: 150,
    image: '🥤',
    allergens: [],
    popular: true,
    spicy: false
  },
  { 
    id: 21, 
    name: 'Sprite (Large)', 
    price: 1.99, 
    category: 'Beverages', 
    prepTime: 30,
    description: 'Crisp lemon-lime flavored soda',
    calories: 280,
    image: '🥤',
    allergens: [],
    popular: false,
    spicy: false
  },
  { 
    id: 22, 
    name: 'Orange Juice', 
    price: 2.49, 
    category: 'Beverages', 
    prepTime: 30,
    description: '100% pure orange juice',
    calories: 150,
    image: '🧃',
    allergens: [],
    popular: false,
    spicy: false
  },
  { 
    id: 23, 
    name: 'House Coffee (Large)', 
    price: 2.79, 
    category: 'Beverages', 
    prepTime: 120,
    description: 'Premium roast coffee',
    calories: 0,
    image: '☕',
    allergens: [],
    popular: true,
    spicy: false
  },
  
  // Extended Desserts Menu
  { 
    id: 24, 
    name: 'Apple Pie', 
    price: 1.89, 
    category: 'Desserts', 
    prepTime: 60,
    description: 'Warm apple pie with cinnamon',
    calories: 230,
    image: '🥧',
    allergens: ['gluten'],
    popular: true,
    spicy: false
  },
  { 
    id: 25, 
    name: 'Chocolate Chip Cookie', 
    price: 1.49, 
    category: 'Desserts', 
    prepTime: 30,
    description: 'Freshly baked chocolate chip cookie',
    calories: 160,
    image: '🍪',
    allergens: ['gluten', 'dairy', 'eggs'],
    popular: false,
    spicy: false
  },
  
  // Breakfast Items
  { 
    id: 26, 
    name: 'Breakfast Egg Muffin', 
    price: 4.99, 
    category: 'Breakfast', 
    prepTime: 180,
    description: 'Freshly cracked egg with Canadian bacon and cheese on an English muffin',
    calories: 300,
    image: '🥪',
    allergens: ['gluten', 'dairy', 'eggs'],
    popular: true,
    spicy: false
  },
  { 
    id: 27, 
    name: 'Sausage Breakfast Muffin', 
    price: 4.79, 
    category: 'Breakfast', 
    prepTime: 180,
    description: 'Seasoned sausage with cheese on an English muffin',
    calories: 400,
    image: '🥪',
    allergens: ['gluten', 'dairy'],
    popular: true,
    spicy: false
  },
  { 
    id: 28, 
    name: 'Hotcakes (3pc)', 
    price: 3.99, 
    category: 'Breakfast', 
    prepTime: 240,
    description: 'Three fluffy hotcakes with butter and syrup',
    calories: 580,
    image: '🥞',
    allergens: ['gluten', 'dairy', 'eggs'],
    popular: false,
    spicy: false
  },
  { 
    id: 9, 
    name: 'Fish Filet', 
    price: 4.29, 
    category: 'Fish', 
    prepTime: 140,
    description: 'Wild-caught Alaskan pollock with tartar sauce',
    calories: 380,
    image: '🐟',
    allergens: ['gluten', 'fish'],
    popular: false,
    spicy: false
  },
  { 
    id: 10, 
    name: 'Apple Pie', 
    price: 1.29, 
    category: 'Desserts', 
    prepTime: 45,
    description: 'Warm apple pie with a flaky crust',
    calories: 230,
    image: '🥧',
    allergens: ['gluten'],
    popular: false,
    spicy: false
  },
  { 
    id: 11, 
    name: 'Coffee (Large)', 
    price: 1.49, 
    category: 'Beverages', 
    prepTime: 45,
    description: 'Premium roast coffee, freshly brewed',
    calories: 5,
    image: '☕',
    allergens: [],
    popular: true,
    spicy: false
  },
  { 
    id: 12, 
    name: 'Caesar Salad', 
    price: 6.99, 
    category: 'Salads', 
    prepTime: 120,
    description: 'Fresh romaine lettuce with caesar dressing and croutons',
    calories: 320,
    image: '🥗',
    allergens: ['dairy', 'gluten'],
    popular: false,
    spicy: false
  },
  
  // Value Combo Meals - Professional POS Features
  { 
    id: 29, 
    name: 'Classic Burger Meal', 
    price: 9.99, 
    category: 'Combos', 
    prepTime: 180,
    description: 'Classic burger + medium fries + medium drink',
    calories: 1100,
    image: '🍔🍟🥤',
    allergens: ['gluten', 'dairy', 'sesame'],
    popular: true,
    spicy: false,
    combo: true,
    comboItems: [1, 16, 19], // Classic burger, medium fries, medium drink
    savings: 1.49
  },
  { 
    id: 30, 
    name: 'Signature Burger Meal', 
    price: 10.49, 
    category: 'Combos', 
    prepTime: 240,
    description: 'Signature burger + medium fries + medium drink',
    calories: 1050,
    image: '🍔🍟🥤',
    allergens: ['gluten', 'dairy'],
    popular: true,
    spicy: false,
    combo: true,
    comboItems: [2, 16, 19],
    savings: 1.49
  },
  { 
    id: 31, 
    name: '10pc Chicken Bites Meal', 
    price: 8.99, 
    category: 'Combos', 
    prepTime: 120,
    description: '10pc chicken bites + medium fries + medium drink',
    calories: 870,
    image: '🍗🍟🥤',
    allergens: ['gluten'],
    popular: true,
    spicy: false,
    combo: true,
    comboItems: [3, 16, 19],
    savings: 1.19
  },
  { 
    id: 32, 
    name: 'Double Burger Meal', 
    price: 12.99, 
    category: 'Combos', 
    prepTime: 300,
    description: 'Double burger + large fries + large drink',
    calories: 1400,
    image: '🍔🍟🥤',
    allergens: ['gluten', 'dairy'],
    popular: false,
    spicy: false,
    combo: true,
    comboItems: [9, 5, 6], // Double Quarter, Large Fries, Large Coke
    savings: 1.99
  },
  
  // Happy Meals
  { 
    id: 33, 
    name: 'Kids Meal - 4pc Chicken Bites', 
    price: 4.99, 
    category: 'Happy Meals', 
    prepTime: 120,
    description: '4pc chicken bites + apple slices + small drink + toy',
    calories: 395,
    image: '🍗🍎🥤🎁',
    allergens: ['gluten'],
    popular: true,
    spicy: false,
    combo: true,
    comboItems: [13, 18, 20], // 6pc chicken bites (half), apple slices, small drink
    savings: 0.99
  },
  { 
    id: 34, 
    name: 'Happy Meal - Cheeseburger', 
    price: 4.99, 
    category: 'Happy Meals', 
    prepTime: 120,
    description: 'Cheeseburger + Apple Slices + Small Drink + Toy',
    calories: 565,
    image: '🍔🍎🥤🎁',
    allergens: ['gluten', 'dairy'],
    popular: true,
    spicy: false,
    combo: true,
    comboItems: [10, 18, 20],
    savings: 0.99
  }
];

// Routes

// Serve different interfaces
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/kiosk', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kiosk.html'));
});

app.get('/kitchen', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kitchen.html'));
});

app.get('/assembly', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assembly.html'));
});

app.get('/manager', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manager.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

// Professional POS System Configuration
const paymentMethods = [
  { id: 'cash', name: 'Cash', icon: '💵', enabled: true },
  { id: 'card', name: 'Credit/Debit Card', icon: '💳', enabled: true },
  { id: 'contactless', name: 'Contactless Payment', icon: '📱', enabled: true },
  { id: 'apple_pay', name: 'Apple Pay', icon: '📱', enabled: true },
  { id: 'google_pay', name: 'Google Pay', icon: '📱', enabled: true },
  { id: 'gift_card', name: 'Restaurant Gift Card', icon: '🎁', enabled: true }
];

const orderTypes = [
  { 
    id: 'dine_in', 
    name: 'Dine In', 
    icon: '🍽️', 
    color: '#28a745',
    estimatedTime: 5,
    description: 'Eat in restaurant'
  },
  { 
    id: 'takeout', 
    name: 'Take Out', 
    icon: '🥡', 
    color: '#ffc107',
    estimatedTime: 3,
    description: 'Order to go'
  },
  { 
    id: 'drive_thru', 
    name: 'Drive Thru', 
    icon: '🚗', 
    color: '#dc3545',
    estimatedTime: 2,
    description: 'Quick drive-through service'
  },
  { 
    id: 'delivery', 
    name: 'Delivery', 
    icon: '🛵', 
    color: '#6f42c1',
    estimatedTime: 25,
    description: 'Delivery to your location'
  },
  { 
    id: 'curbside', 
    name: 'Curbside Pickup', 
    icon: '🅿️', 
    color: '#17a2b8',
    estimatedTime: 4,
    description: 'We\'ll bring it to your car'
  }
];

const customizations = {
  burgers: [
    { id: 'no_onions', name: 'No Onions', price: 0 },
    { id: 'no_pickles', name: 'No Pickles', price: 0 },
    { id: 'extra_cheese', name: 'Extra Cheese', price: 0.50 },
    { id: 'extra_sauce', name: 'Extra Signature Sauce', price: 0.25 },
    { id: 'no_lettuce', name: 'No Lettuce', price: 0 },
    { id: 'add_bacon', name: 'Add Bacon', price: 1.50 }
  ],
  fries: [
    { id: 'no_salt', name: 'No Salt', price: 0 },
    { id: 'extra_salt', name: 'Extra Salt', price: 0 }
  ],
  beverages: [
    { id: 'no_ice', name: 'No Ice', price: 0 },
    { id: 'extra_ice', name: 'Extra Ice', price: 0 },
    { id: 'light_ice', name: 'Light Ice', price: 0 }
  ]
};

// Enhanced API Routes
app.get('/api/menu', (req, res) => {
  res.json(menuItems);
});

app.get('/api/payment-methods', (req, res) => {
  res.json(paymentMethods);
});

app.get('/api/order-types', (req, res) => {
  res.json(orderTypes);
});

app.get('/api/customizations', (req, res) => {
  res.json(customizations);
});

app.get('/api/promotions', (req, res) => {
  const activePromotions = promotions.filter(p => p.active);
  res.json(activePromotions);
});

app.get('/api/analytics', (req, res) => {
  // Calculate real-time analytics
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.timestamp).toDateString() === today);
  
  const analytics = {
    ...dailyStats,
    totalOrders: todayOrders.length,
    totalRevenue: todayOrders.reduce((sum, order) => sum + order.total, 0),
    averageOrderValue: todayOrders.length > 0 ? 
      todayOrders.reduce((sum, order) => sum + order.total, 0) / todayOrders.length : 0,
    ordersInProgress: orders.filter(o => o.status !== 'completed').length,
    completedToday: todayOrders.filter(o => o.status === 'completed').length
  };
  
  res.json(analytics);
});

app.post('/api/feedback', (req, res) => {
  const { orderId, rating, comment, category } = req.body;
  
  const feedbackEntry = {
    id: feedback.length + 1,
    orderId,
    rating,
    comment,
    category,
    timestamp: new Date()
  };
  
  feedback.push(feedbackEntry);
  res.json(feedbackEntry);
});

app.get('/api/feedback', (req, res) => {
  res.json(feedback);
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const { items, total, customerName, customerPhone, specialInstructions, loyaltyId } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'An order must contain at least one item' });
  }

  const normalizedItems = items.map(item => {
    const menuItem = menuItems.find(mi => mi.id === item.id);
    const quantity = Number(item.quantity);
    return menuItem && Number.isInteger(quantity) && quantity > 0
      ? { ...menuItem, quantity }
      : null;
  });

  if (normalizedItems.some(item => !item)) {
    return res.status(400).json({ error: 'Order contains an invalid menu item or quantity' });
  }

  const calculatedTotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = {
    id: uuidv4(),
    orderNumber: orderCounter++,
    items: normalizedItems,
    total: Number(calculatedTotal.toFixed(2)),
    customerName: customerName || `Order #${orderCounter - 1}`,
    customerPhone: customerPhone || null,
    specialInstructions: specialInstructions || '',
    loyaltyId: loyaltyId || null,
    status: ORDER_STATUS.NEW,
    timestamp: new Date(),
    estimatedTime: Math.max(...normalizedItems.map(item => item.prepTime)),
    priority: normalizedItems.reduce((sum, item) => sum + item.quantity, 0) > 5 ? 'high' : 'normal',
    orderType: 'dine-in' // Could be 'takeaway', 'delivery'
  };

  orders.push(order);
  
  // Update daily stats
  dailyStats.totalOrders++;
  dailyStats.totalRevenue += total;
  
  // Track popular items
  items.forEach(item => {
    const menuItem = menuItems.find(mi => mi.id === item.id);
    if (menuItem) {
      dailyStats.popularItems[menuItem.name] = (dailyStats.popularItems[menuItem.name] || 0) + item.quantity;
    }
  });
  
  // Emit to all connected clients
  io.emit('newOrder', order);
  io.emit('ordersUpdate', orders);
  io.emit('analyticsUpdate', dailyStats);
  
  res.json(order);
});

app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const order = orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  order.status = status;
  if (status === ORDER_STATUS.PREPARING) {
    order.startTime = new Date();
  } else if (status === ORDER_STATUS.READY) {
    order.readyTime = new Date();
  } else if (status === ORDER_STATUS.COMPLETED) {
    order.completedTime = new Date();
  }
  
  // Emit updates to all clients
  io.emit('orderStatusUpdate', { orderId: id, status });
  io.emit('ordersUpdate', orders);
  
  res.json(order);
});

app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const orderIndex = orders.findIndex(o => o.id === id);
  
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  orders.splice(orderIndex, 1);
  
  // Emit updates to all clients
  io.emit('orderRemoved', id);
  io.emit('ordersUpdate', orders);
  
  res.json({ message: 'Order removed' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Send current orders to newly connected client
  socket.emit('ordersUpdate', orders);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Restaurant System Server running on port ${PORT}`);
  console.log(`Access the interfaces at:`);
  console.log(`- Main Dashboard: http://localhost:${PORT}`);
  console.log(`- Kiosk: http://localhost:${PORT}/kiosk`);
  console.log(`- Kitchen Display: http://localhost:${PORT}/kitchen`);
  console.log(`- Assembly Station: http://localhost:${PORT}/assembly`);
  console.log(`- Manager Dashboard: http://localhost:${PORT}/manager`);
  console.log(`- Analytics: http://localhost:${PORT}/analytics`);
});
