const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  { id: 'cat-hot-bev', name: 'Hot Beverages', color: '#7C5C3E', order: 1 },
  { id: 'cat-cold-bev', name: 'Cold Beverages', color: '#3A86FF', order: 2 },
  { id: 'cat-breakfast', name: 'Breakfast', color: '#FFBE0B', order: 3 },
  { id: 'cat-appetizers', name: 'Appetizers', color: '#FB5607', order: 4 },
  { id: 'cat-pizza', name: 'Pizza', color: '#FF006E', order: 5 },
  { id: 'cat-pasta', name: 'Pasta', color: '#8338EC', order: 6 },
  { id: 'cat-burgers', name: 'Burgers & Sandwiches', color: '#DC143C', order: 7 },
  { id: 'cat-indian-main', name: 'Indian Main Course', color: '#8B0000', order: 8 },
  { id: 'cat-rice', name: 'Rice & Biryani', color: '#FF8C00', order: 9 },
  { id: 'cat-desserts', name: 'Desserts', color: '#FF69B4', order: 10 }
];

const products = [
  // HOT BEVERAGES (cat-hot-bev)
  { name: 'Classic Espresso', price: 120, isVeg: true, cat: 'cat-hot-bev', img: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=800&q=80', desc: 'Single shot of intense espresso.' },
  { name: 'Double Espresso', price: 160, isVeg: true, cat: 'cat-hot-bev', img: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=800&q=80', desc: 'Double shot of concentrated espresso.' },
  { name: 'Caffe Latte', price: 180, isVeg: true, cat: 'cat-hot-bev', img: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=80', desc: 'Espresso with steamed milk and a thin layer of foam.' },
  { name: 'Cappuccino', price: 180, isVeg: true, cat: 'cat-hot-bev', img: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=800&q=80', desc: 'Equal parts espresso, steamed milk, and milk foam.' },
  { name: 'Flat White', price: 190, isVeg: true, cat: 'cat-hot-bev', img: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=800&q=80', desc: 'Espresso with velvety microfoam milk.' },
  { name: 'Americano', price: 140, isVeg: true, cat: 'cat-hot-bev', img: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=800&q=80', desc: 'Espresso diluted with hot water.' },
  { name: 'Caffe Mocha', price: 210, isVeg: true, cat: 'cat-hot-bev', img: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80', desc: 'Espresso with chocolate sauce, milk and foam.' },
  { name: 'Caramel Macchiato', price: 230, isVeg: true, cat: 'cat-hot-bev', img: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=800&q=80', desc: 'Espresso stained with milk and caramel drizzle.' },
  { name: 'Masala Chai', price: 90, isVeg: true, cat: 'cat-hot-bev', img: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=800&q=80', desc: 'Authentic Indian tea with spices.' },
  { name: 'Ginger Tea', price: 80, isVeg: true, cat: 'cat-hot-bev', img: 'https://images.unsplash.com/photo-1582731252121-3116ad1ad339?w=800&q=80', desc: 'Refreshing tea brewed with fresh ginger.' },
  { name: 'Green Tea', price: 110, isVeg: true, cat: 'cat-hot-bev', img: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80', desc: 'Light and antioxidant-rich green tea.' },
  { name: 'Hot Chocolate', price: 190, isVeg: true, cat: 'cat-hot-bev', img: 'https://images.unsplash.com/photo-1544787210-22134260d5b2?w=800&q=80', desc: 'Rich and creamy hot cocoa.' },
  { name: 'Earl Grey Tea', price: 120, isVeg: true, cat: 'cat-hot-bev', img: 'https://images.unsplash.com/photo-1594631252845-29fc45862d6f?w=800&q=80', desc: 'Classic black tea with bergamot notes.' },
  { name: 'Turkish Coffee', price: 220, isVeg: true, cat: 'cat-hot-bev', img: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800&q=80', desc: 'Strong, unfiltered coffee brewed in a cezve.' },
  { name: 'Cortado', price: 170, isVeg: true, cat: 'cat-hot-bev', img: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&q=80', desc: 'Equal parts espresso and warm milk.' },

  // COLD BEVERAGES (cat-cold-bev)
  { name: 'Iced Americano', price: 150, isVeg: true, cat: 'cat-cold-bev', img: 'https://images.unsplash.com/photo-1517701550927-30cf4bb1dba5?w=800&q=80', desc: 'Chilled espresso over ice.' },
  { name: 'Iced Latte', price: 190, isVeg: true, cat: 'cat-cold-bev', img: 'https://images.unsplash.com/photo-1517701632966-d39f4007b0ec?w=800&q=80', desc: 'Chilled milk and espresso over ice.' },
  { name: 'Cold Brew Coffee', price: 220, isVeg: true, cat: 'cat-cold-bev', img: 'https://images.unsplash.com/photo-1499961024600-ad094db305cc?w=800&q=80', desc: 'Coffee steeped in cold water for 12 hours.' },
  { name: 'Peach Iced Tea', price: 160, isVeg: true, cat: 'cat-cold-bev', img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80', desc: 'Sweetened tea with natural peach flavor.' },
  { name: 'Lemon Iced Tea', price: 150, isVeg: true, cat: 'cat-cold-bev', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80', desc: 'Classic lemon flavored iced tea.' },
  { name: 'Virgin Mojito', price: 180, isVeg: true, cat: 'cat-cold-bev', img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80', desc: 'Lime, mint, and soda classic mocktail.' },
  { name: 'Blue Lagoon', price: 190, isVeg: true, cat: 'cat-cold-bev', img: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=800&q=80', desc: 'Curaçao blue mocktail with a citrus punch.' },
  { name: 'Strawberry Milkshake', price: 220, isVeg: true, cat: 'cat-cold-bev', img: 'https://images.unsplash.com/photo-1579954115545-a95591f28bc0?w=800&q=80', desc: 'Creamy shake with real strawberries.' },
  { name: 'Chocolate Milkshake', price: 220, isVeg: true, cat: 'cat-cold-bev', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80', desc: 'Rich chocolate blended with cold milk.' },
  { name: 'Vanilla Blast Shake', price: 210, isVeg: true, cat: 'cat-cold-bev', img: 'https://images.unsplash.com/photo-1626078297492-97ad503d3042?w=800&q=80', desc: 'Smooth vanilla bean milkshake.' },
  { name: 'Oreo Cookie Shake', price: 240, isVeg: true, cat: 'cat-cold-bev', img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80', desc: 'Oreo cookies blended into a creamy shake.' },
  { name: 'Lemonade', price: 120, isVeg: true, cat: 'cat-cold-bev', img: 'https://images.unsplash.com/photo-1523371052140-588001c1031d?w=800&q=80', desc: 'Freshly squeezed lemonade.' },
  { name: 'Cold Coffee with Ice Cream', price: 240, isVeg: true, cat: 'cat-cold-bev', img: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=80', desc: 'Frothy cold coffee topped with vanilla ice cream.' },
  { name: 'Mango Smoothie', price: 230, isVeg: true, cat: 'cat-cold-bev', img: 'https://images.unsplash.com/photo-1550586678-f7225f03c44b?w=800&q=80', desc: 'Fresh mango pulp blended with yogurt.' },
  { name: 'Fresh Lime Soda', price: 110, isVeg: true, cat: 'cat-cold-bev', img: 'https://images.unsplash.com/photo-1523371052140-588001c1031d?w=800&q=80', desc: 'Sparkling water with fresh lime.' },

  // BREAKFAST (cat-breakfast)
  { name: 'Fluffy Pancakes', price: 280, isVeg: true, cat: 'cat-breakfast', img: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80', desc: 'Stacked pancakes with maple syrup.' },
  { name: 'Classic Omelette', price: 220, isVeg: false, cat: 'cat-breakfast', img: 'https://images.unsplash.com/photo-1510627489930-0c1b0ba8aa2e?w=800&q=80', desc: 'Three-egg omelette served with toast.' },
  { name: 'Eggs Benedict', price: 350, isVeg: false, cat: 'cat-breakfast', img: 'https://images.unsplash.com/photo-1608039829572-7852bf5c7c01?w=800&q=80', desc: 'Poached eggs on toasted muffins with hollandaise.' },
  { name: 'Avocado Toast', price: 380, isVeg: true, cat: 'cat-breakfast', img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80', desc: 'Smashed avocado on sourdough bread.' },
  { name: 'Breakfast Burrito', price: 290, isVeg: false, cat: 'cat-breakfast', img: 'https://images.unsplash.com/photo-1626700051175-656fc7c32af1?w=800&q=80', desc: 'Scrambled eggs, beans and cheese in a tortilla.' },
  { name: 'Oatmeal Bowl', price: 180, isVeg: true, cat: 'cat-breakfast', img: 'https://images.unsplash.com/photo-1517673132405-a506bb803063?w=800&q=80', desc: 'Warm oats with honey and fresh fruits.' },
  { name: 'French Toast', price: 310, isVeg: true, cat: 'cat-breakfast', img: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80', desc: 'Brioche bread dipped in custard and grilled.' },
  { name: 'Egg White Frittata', price: 270, isVeg: false, cat: 'cat-breakfast', img: 'https://images.unsplash.com/photo-1510627489930-0c1b0ba8aa2e?w=800&q=80', desc: 'Healthy egg whites with spinach and turkey.' },
  { name: 'English Breakfast', price: 450, isVeg: false, cat: 'cat-breakfast', img: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80', desc: 'Eggs, beans, sausage, mushrooms and bacon.' },
  { name: 'Fruit Parfait', price: 240, isVeg: true, cat: 'cat-breakfast', img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80', desc: 'Yogurt, granola and fresh berry layers.' },
  { name: 'Belgian Waffle', price: 320, isVeg: true, cat: 'cat-breakfast', img: 'https://images.unsplash.com/photo-1562329265-95a6d7a428ec?w=800&q=80', desc: 'Crispy waffle with whipped cream.' },
  { name: 'Paneer Stuffed Paratha', price: 160, isVeg: true, cat: 'cat-breakfast', img: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800&q=80', desc: 'Indian flatbread stuffed with spiced paneer.' },
  { name: 'Aloo Paratha', price: 140, isVeg: true, cat: 'cat-breakfast', img: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800&q=80', desc: 'Stuffed potato flatbread with butter.' },
  { name: 'Poori Bhaji', price: 180, isVeg: true, cat: 'cat-breakfast', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80', desc: 'Deep-fried bread with spicy potato curry.' },
  { name: 'Bagel with Cream Cheese', price: 190, isVeg: true, cat: 'cat-breakfast', img: 'https://images.unsplash.com/photo-1518013147077-212b2a16223b?w=800&q=80', desc: 'Toasted bagel with Philadelphia cream cheese.' },

  // APPETIZERS (cat-appetizers)
  { name: 'Chicken Wings (BBQ)', price: 350, isVeg: false, cat: 'cat-appetizers', img: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800&q=80', desc: 'Spicy and smoky chicken wings.' },
  { name: 'Cheesy Loaded Nachos', price: 280, isVeg: true, cat: 'cat-appetizers', img: 'https://images.unsplash.com/photo-1513456852971-30c0b81c9d23?w=800&q=80', desc: 'Tortilla chips with melted cheese and jalapenos.' },
  { name: 'Paneer Tikka (Grilled)', price: 320, isVeg: true, cat: 'cat-appetizers', img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c175f0?w=800&q=80', desc: 'Clay-oven roasted cottage cheese.' },
  { name: 'Crispy Spring Rolls', price: 220, isVeg: true, cat: 'cat-appetizers', img: 'https://images.unsplash.com/photo-1606335543042-57c525922933?w=800&q=80', desc: 'Golden fried vegetable spring rolls.' },
  { name: 'Fish Fingers', price: 390, isVeg: false, cat: 'cat-appetizers', img: 'https://images.unsplash.com/photo-1585238341267-1cfec2046a55?w=800&q=80', desc: 'Crumbed and fried fish fillets.' },
  { name: 'Mozzarella Sticks', price: 260, isVeg: true, cat: 'cat-appetizers', img: 'https://images.unsplash.com/photo-1531749910660-179888062f2e?w=800&q=80', desc: 'Battered and deep-fried cheese sticks.' },
  { name: 'Chicken Drumsticks', price: 360, isVeg: false, cat: 'cat-appetizers', img: 'https://images.unsplash.com/photo-1516684669134-de6f7c473a2a?w=800&q=80', desc: 'Tender chicken drumsticks with spices.' },
  { name: 'Bruschetta (3pc)', price: 240, isVeg: true, cat: 'cat-appetizers', img: 'https://images.unsplash.com/photo-1572656631137-7935297eff55?w=800&q=80', desc: 'Toasted bread with tomato and basil.' },
  { name: 'Chili Paneer (Dry)', price: 290, isVeg: true, cat: 'cat-appetizers', img: 'https://images.unsplash.com/photo-1567184109411-b2862d7c072c?w=800&q=80', desc: 'Spiced cottage cheese with bell peppers.' },
  { name: 'Dynamite Shrimp', price: 420, isVeg: false, cat: 'cat-appetizers', img: 'https://images.unsplash.com/photo-1559742811-822873691df0?w=800&q=80', desc: 'Crispy shrimp tossed in spicy mayo.' },
  { name: 'Hara Bhara Kabab', price: 210, isVeg: true, cat: 'cat-appetizers', img: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800&q=80', desc: 'Spinach and pea spiced patties.' },
  { name: 'Garlic Butter Prawns', price: 480, isVeg: false, cat: 'cat-appetizers', img: 'https://images.unsplash.com/photo-1559742811-822873691df0?w=800&q=80', desc: 'Juicy prawns sautéed in garlic butter.' },
  { name: 'Chicken Satay', price: 340, isVeg: false, cat: 'cat-appetizers', img: 'https://images.unsplash.com/photo-1616428782352-73a11440af42?w=800&q=80', desc: 'Grilled skewers served with peanut sauce.' },
  { name: 'Veg Manchurian (Dry)', price: 230, isVeg: true, cat: 'cat-appetizers', img: 'https://images.unsplash.com/photo-1512058460702-44e80671677a?w=800&q=80', desc: 'Vegetable dumplings in Indo-Chinese sauce.' },
  { name: 'Hummus & Pita', price: 280, isVeg: true, cat: 'cat-appetizers', img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80', desc: 'Creamy chickpeas dip with warm pita bread.' },

  // PIZZA (cat-pizza)
  { name: 'Margherita Pizza', price: 390, isVeg: true, cat: 'cat-pizza', img: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?w=800&q=80', desc: 'Classic mozzarella and tomato.' },
  { name: 'Pepperoni Pizza', price: 490, isVeg: false, cat: 'cat-pizza', img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80', desc: 'Loaded with spicy beef pepperoni.' },
  { name: 'BBQ Chicken Pizza', price: 480, isVeg: false, cat: 'cat-pizza', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', desc: 'Grilled chicken and smoky BBQ sauce.' },
  { name: 'Veggie Supreme', price: 440, isVeg: true, cat: 'cat-pizza', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80', desc: 'Olives, onions, corn and peppers.' },
  { name: 'Meat Lovers Pizza', price: 550, isVeg: false, cat: 'cat-pizza', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', desc: 'Loaded with pepperoni, ham and sausage.' },
  { name: 'Paneer Tikka Pizza', price: 460, isVeg: true, cat: 'cat-pizza', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80', desc: 'Fusion of tandoori paneer and cheese.' },
  { name: 'Hawaiian Pizza', price: 440, isVeg: false, cat: 'cat-pizza', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', desc: 'Classic ham and pineapple combo.' },
  { name: 'Four Cheese Pizza', price: 520, isVeg: true, cat: 'cat-pizza', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', desc: 'Mozzarella, Cheddar, Parmesan and Gouda.' },
  { name: 'Chicken Tikka Pizza', price: 480, isVeg: false, cat: 'cat-pizza', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80', desc: 'Tandoori chicken chunks and onions.' },
  { name: 'Mushroom & Olive Pizza', price: 420, isVeg: true, cat: 'cat-pizza', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80', desc: 'Fresh mushrooms and black olives.' },
  { name: 'Buffalo Chicken Pizza', price: 490, isVeg: false, cat: 'cat-pizza', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', desc: 'Spicy buffalo sauce and chunks of chicken.' },
  { name: 'Truffle Mushroom Pizza', price: 580, isVeg: true, cat: 'cat-pizza', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', desc: 'Exotic mushrooms with truffle oil drizzle.' },
  { name: 'Garden Fresh Pizza', price: 410, isVeg: true, cat: 'cat-pizza', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80', desc: 'Bell peppers, red onions and tomatoes.' },
  { name: 'Tandoori Paneer Pizza', price: 460, isVeg: true, cat: 'cat-pizza', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80', desc: 'Paneer, capsicum and tandoori drizzle.' },
  { name: 'Double Cheese Pizza', price: 420, isVeg: true, cat: 'cat-pizza', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80', desc: 'Extra layer of gooey mozzarella cheese.' },

  // PASTA (cat-pasta)
  { name: 'Penne Arrabbiata', price: 340, isVeg: true, cat: 'cat-pasta', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80', desc: 'Spicy tomato sauce with garlic and chili.' },
  { name: 'Creamy Alfredo Pasta', price: 380, isVeg: true, cat: 'cat-pasta', img: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=800&q=80', desc: 'White sauce pasta with parmesan cheese.' },
  { name: 'Spaghetti Bolognese', price: 450, isVeg: false, cat: 'cat-pasta', img: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=800&q=80', desc: 'Spaghetti in hearty beef meat sauce.' },
  { name: 'Pesto Fettuccine', price: 410, isVeg: true, cat: 'cat-pasta', img: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=800&q=80', desc: 'Rich basil pesto with roasted pine nuts.' },
  { name: 'Classic Carbonara', price: 430, isVeg: false, cat: 'cat-pasta', img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80', desc: 'Creamy egg-based sauce with bacon chunks.' },
  { name: 'Mac & Cheese', price: 320, isVeg: true, cat: 'cat-pasta', img: 'https://images.unsplash.com/photo-1543339308-43e59d60a444?w=800&q=80', desc: 'Comforting cheesy elbow pasta.' },
  { name: 'Pink Sauce Pasta', price: 370, isVeg: true, cat: 'cat-pasta', img: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=800&q=80', desc: 'Perfect blend of red and white sauce.' },
  { name: 'Lasagna (Veggie)', price: 490, isVeg: true, cat: 'cat-pasta', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80', desc: 'Layered pasta with veggies and béchamel.' },
  { name: 'Lasagna (Meat)', price: 580, isVeg: false, cat: 'cat-pasta', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80', desc: 'Layered pasta with minced meat and cheese.' },
  { name: 'Ravioli w/ Spinach', price: 460, isVeg: true, cat: 'cat-pasta', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80', desc: 'Handmade ravioli in butter sage sauce.' },
  { name: 'Mushroom Risotto', price: 480, isVeg: true, cat: 'cat-pasta', img: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80', desc: 'Creamy Arborio rice with wild mushrooms.' },
  { name: 'Spaghetti w/ Meatballs', price: 490, isVeg: false, cat: 'cat-pasta', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80', desc: 'Classic pasta with juicy beef meatballs.' },
  { name: 'Aglio e Olio', price: 310, isVeg: true, cat: 'cat-pasta', img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80', desc: 'Garlic, olive oil and chili flakes simple pasta.' },
  { name: 'Shrimp Linguine', price: 540, isVeg: false, cat: 'cat-pasta', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80', desc: 'Pasta with prawns in lemon garlic sauce.' },
  { name: 'Gnocchi Sorentina', price: 420, isVeg: true, cat: 'cat-pasta', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80', desc: 'Potato gnocchi in tomato and mozzarella.' },

  // BURGERS & SANDWICHES (cat-burgers)
  { name: 'Classic Cheese Burger', price: 290, isVeg: false, cat: 'cat-burgers', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', desc: 'Beef patty with melted cheddar cheese.' },
  { name: 'Veggie Delite Burger', price: 240, isVeg: true, cat: 'cat-burgers', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80', desc: 'High protein veggie patty burger.' },
  { name: 'Crispy Chicken Zinger', price: 320, isVeg: false, cat: 'cat-burgers', img: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&q=80', desc: 'Spicy fried chicken fillet burger.' },
  { name: 'Paneer Maharaja Burger', price: 310, isVeg: true, cat: 'cat-burgers', img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80', desc: 'Double layer tandoori paneer burger.' },
  { name: 'BBQ Bacon Burger', price: 410, isVeg: false, cat: 'cat-burgers', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', desc: 'Smoky BBQ sauce and crispy bacon.' },
  { name: 'Classic Club Sandwich', price: 340, isVeg: false, cat: 'cat-burgers', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80', desc: 'Triple layer sandwich with chicken and egg.' },
  { name: 'Grilled Cheese Sandwich', price: 210, isVeg: true, cat: 'cat-burgers', img: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=800&q=80', desc: 'Golden brown melted cheese sandwich.' },
  { name: 'Veg Grilled Sandwich', price: 190, isVeg: true, cat: 'cat-burgers', img: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=800&q=80', desc: 'Bombay style grilled veg sandwich.' },
  { name: 'Chicken Tikka Sandwich', price: 280, isVeg: false, cat: 'cat-burgers', img: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=800&q=80', desc: 'Tandoori chicken in a toasted sandwich.' },
  { name: 'Paneer Tikka Wrap', price: 260, isVeg: true, cat: 'cat-burgers', img: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&q=80', desc: 'Grilled paneer in a soft wrap.' },
  { name: 'Chicken Shawarma', price: 290, isVeg: false, cat: 'cat-burgers', img: 'https://images.unsplash.com/photo-1561651823-34fed0225304?w=800&q=80', desc: 'Classic middle-eastern chicken wrap.' },
  { name: 'BLT Sandwich', price: 320, isVeg: false, cat: 'cat-burgers', img: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=800&q=80', desc: 'Bacon, lettuce and tomato classic.' },
  { name: 'Turkey & Swiss Sandwich', price: 380, isVeg: false, cat: 'cat-burgers', img: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=800&q=80', desc: 'Salami turkey with swiss cheese.' },
  { name: 'Avocado Veggie Wrap', price: 340, isVeg: true, cat: 'cat-burgers', img: 'https://images.unsplash.com/photo-1626700051175-656fc7c32af1?w=800&q=80', desc: 'Vibrant wrap with avocado and sprouts.' },
  { name: 'Chicken Mayo Burger', price: 280, isVeg: false, cat: 'cat-burgers', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', desc: 'Simple chicken patty with loads of mayo.' },

  // INDIAN MAIN COURSE (cat-indian-main)
  { name: 'Butter Chicken', price: 480, isVeg: false, cat: 'cat-indian-main', img: 'https://images.unsplash.com/photo-1603894584114-61c0211a7f6f?w=800&q=80', desc: 'Rich and creamy tomato gravy chicken.' },
  { name: 'Paneer Butter Masala', price: 390, isVeg: true, cat: 'cat-indian-main', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80', desc: 'Spiced cottage cheese in butter gravy.' },
  { name: 'Dal Makhani', price: 350, isVeg: true, cat: 'cat-indian-main', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80', desc: 'Overnight slow-cooked black lentils.' },
  { name: 'Kadhai Paneer', price: 380, isVeg: true, cat: 'cat-indian-main', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80', desc: 'Cottage cheese with capsicum in spicy gravy.' },
  { name: 'Mutton Rogan Josh', price: 580, isVeg: false, cat: 'cat-indian-main', img: 'https://images.unsplash.com/photo-1603894584114-61c0211a7f6f?w=800&q=80', desc: 'Classic Kashmiri lamb curry.' },
  { name: 'Dal Tadka', price: 240, isVeg: true, cat: 'cat-indian-main', img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80', desc: 'Yellow lentils with garlic tempering.' },
  { name: 'Chicken Tikka Masala', price: 460, isVeg: false, cat: 'cat-indian-main', img: 'https://images.unsplash.com/photo-1603894584114-61c0211a7f6f?w=800&q=80', desc: 'Grilled chicken in spicy tomato gravy.' },
  { name: 'Malai Kofta', price: 360, isVeg: true, cat: 'cat-indian-main', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80', desc: 'Fried veggie dumplings in velvet gravy.' },
  { name: 'Palak Paneer', price: 360, isVeg: true, cat: 'cat-indian-main', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80', desc: 'Cottage cheese in creamy spinach sauce.' },
  { name: 'Chana Masala', price: 280, isVeg: true, cat: 'cat-indian-main', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80', desc: 'Spiced chickpeas cooked in traditional style.' },
  { name: 'Aloo Gobi Adraki', price: 260, isVeg: true, cat: 'cat-indian-main', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80', desc: 'Potato and cauliflower with ginger.' },
  { name: 'Chicken Curry', price: 420, isVeg: false, cat: 'cat-indian-main', img: 'https://images.unsplash.com/photo-1603894584114-61c0211a7f6f?w=800&q=80', desc: 'Classic home-style chicken curry.' },
  { name: 'Kadai Mushroom', price: 340, isVeg: true, cat: 'cat-indian-main', img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80', desc: 'Fresh mushrooms in spicy onion gravy.' },
  { name: 'Fish Curry', price: 490, isVeg: false, cat: 'cat-indian-main', img: 'https://images.unsplash.com/photo-1603894584114-61c0211a7f6f?w=800&q=80', desc: 'Coastal style fish curry in coconut milk.' },
  { name: 'Chicken Korma', price: 480, isVeg: false, cat: 'cat-indian-main', img: 'https://images.unsplash.com/photo-1603894584114-61c0211a7f6f?w=800&q=80', desc: 'Braised chicken in creamy nut sauce.' },

  // RICE & BIRYANI (cat-rice)
  { name: 'Chicken Biryani', price: 450, isVeg: false, cat: 'cat-rice', img: 'https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=800&q=80', desc: 'Aromatic basmati rice with chicken.' },
  { name: 'Veg Hyderabadi Biryani', price: 360, isVeg: true, cat: 'cat-rice', img: 'https://images.unsplash.com/photo-1589302168068-1c499278638c?w=800&q=80', desc: 'Spicy veg biryani with fried onions.' },
  { name: 'Mutton Biryani', price: 580, isVeg: false, cat: 'cat-rice', img: 'https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=800&q=80', desc: 'Premium basmati rice with succulent lamb.' },
  { name: 'Egg Biryani', price: 340, isVeg: false, cat: 'cat-rice', img: 'https://images.unsplash.com/photo-1589302168068-1c499278638c?w=800&q=80', desc: 'Spiced biryani rice with boiled eggs.' },
  { name: 'Jeera Rice', price: 180, isVeg: true, cat: 'cat-rice', img: 'https://images.unsplash.com/photo-1589302168068-1c499278638c?w=800&q=80', desc: 'Basmati rice tempered with cumin.' },
  { name: 'Veg Pulao', price: 290, isVeg: true, cat: 'cat-rice', img: 'https://images.unsplash.com/photo-1589302168068-1c499278638c?w=800&q=80', desc: 'Basmati rice with mixed vegetables.' },
  { name: 'Steamed Basmati Rice', price: 150, isVeg: true, cat: 'cat-rice', img: 'https://images.unsplash.com/photo-1589302168068-1c499278638c?w=800&q=80', desc: 'Simple fluffy steamed white rice.' },
  { name: 'Kashmiri Pulao', price: 320, isVeg: true, cat: 'cat-rice', img: 'https://images.unsplash.com/photo-1589302168068-1c499278638c?w=800&q=80', desc: 'Sweet rice with nuts and saffron.' },
  { name: 'Paneer Biryani', price: 390, isVeg: true, cat: 'cat-rice', img: 'https://images.unsplash.com/photo-1589302168068-1c499278638c?w=800&q=80', desc: 'Layered biryani with spiced paneer cubes.' },
  { name: 'Veg Fried Rice', price: 280, isVeg: true, cat: 'cat-rice', img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80', desc: 'Wok-tossed rice with fine vegetables.' },
  { name: 'Chicken Fried Rice', price: 340, isVeg: false, cat: 'cat-rice', img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80', desc: 'Wok-tossed rice with shredded chicken.' },
  { name: 'Schezwan Fried Rice', price: 310, isVeg: true, cat: 'cat-rice', img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80', desc: 'Spicy fried rice with Schezwan sauce.' },
  { name: 'Burnt Garlic Fried Rice', price: 320, isVeg: true, cat: 'cat-rice', img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80', desc: 'Fragrant rice with roasted garlic.' },
  { name: 'Lemon Rice', price: 210, isVeg: true, cat: 'cat-rice', img: 'https://images.unsplash.com/photo-1589302168068-1c499278638c?w=800&q=80', desc: 'South Indian style lemon tempered rice.' },
  { name: 'Curd Rice', price: 180, isVeg: true, cat: 'cat-rice', img: 'https://images.unsplash.com/photo-1589302168068-1c499278638c?w=800&q=80', desc: 'Cooling rice mixed with seasoned yogurt.' },

  // DESSERTS (cat-desserts)
  { name: 'Tiramisu', price: 380, isVeg: true, cat: 'cat-desserts', img: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80', desc: 'Italian coffee-flavored dessert.' },
  { name: 'New York Cheesecake', price: 420, isVeg: true, cat: 'cat-desserts', img: 'https://images.unsplash.com/photo-1524351199679-46cddf30449a?w=800&q=80', desc: 'Dense and creamy baked cheesecake.' },
  { name: 'Chocolate Brownie', price: 220, isVeg: true, cat: 'cat-desserts', img: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=800&q=80', desc: 'Fudgy dark chocolate brownie.' },
  { name: 'Gulab Jamun (2pc)', price: 120, isVeg: true, cat: 'cat-desserts', img: 'https://images.unsplash.com/photo-1589119908995-c6800ffca830?w=800&q=80', desc: 'Sweet milk dumplings in sugar syrup.' },
  { name: 'Rasmalai (2pc)', price: 160, isVeg: true, cat: 'cat-desserts', img: 'https://images.unsplash.com/photo-1589119908995-c6800ffca830?w=800&q=80', desc: 'Spongy cottage cheese discs in milk.' },
  { name: 'Apple Pie', price: 280, isVeg: true, cat: 'cat-desserts', img: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=800&q=80', desc: 'Classic spiced apple filling in crust.' },
  { name: 'Choco Lava Cake', price: 260, isVeg: true, cat: 'cat-desserts', img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80', desc: 'Warm cake with a molten chocolate center.' },
  { name: 'Red Velvet Cake Slice', price: 310, isVeg: true, cat: 'cat-desserts', img: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?w=800&q=80', desc: 'Vibrant red cake with cream cheese foam.' },
  { name: 'Vanilla Bean Ice Cream', price: 150, isVeg: true, cat: 'cat-desserts', img: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&q=80', desc: 'Double scoop of premium vanilla.' },
  { name: 'Blueberry Muffin', price: 140, isVeg: true, cat: 'cat-desserts', img: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800&q=80', desc: 'Moist muffin with fresh blueberries.' },
  { name: 'Creme Brulee', price: 340, isVeg: true, cat: 'cat-desserts', img: 'https://images.unsplash.com/photo-1470333738087-5f16361efc91?w=800&q=80', desc: 'Rich custard with caramelized sugar top.' },
  { name: 'Chocolate Truffles (4pc)', price: 210, isVeg: true, cat: 'cat-desserts', img: 'https://images.unsplash.com/photo-1548598082-a35a633a6f7b?w=800&q=80', desc: 'Handcrafted dark chocolate truffles.' },
  { name: 'Baklava (2pc)', price: 240, isVeg: true, cat: 'cat-desserts', img: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800&q=80', desc: 'Layered pastry with nuts and honey.' },
  { name: 'Mango Custard', price: 180, isVeg: true, cat: 'cat-desserts', img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80', desc: 'Creamy fruit custard with mango chunks.' },
  { name: 'Brownie with Ice Cream', price: 290, isVeg: true, cat: 'cat-desserts', img: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=800&q=80', desc: 'Sizzling brownie topped with vanilla scoop.' }
];

async function main() {
  console.log('--- RESETTING DATABASE ---');
  await prisma.orderItem.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  console.log('Database cleared.');

  console.log('--- CREATING CATEGORIES ---');
  for (const cat of categories) {
    await prisma.category.create({ data: cat });
  }
  console.log(`${categories.length} Categories created.`);

  console.log('--- CREATING PRODUCTS ---');
  let count = 0;
  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        price: p.price,
        description: p.desc,
        imageUrl: p.img,
        isVegetarian: p.isVeg,
        isAvailable: true,
        categoryId: p.cat,
        tax: 5 // Default 5% tax for all items
      }
    });
    count++;
    if (count % 10 === 0) console.log(`${count} products added...`);
  }
  console.log(`TOTAL: ${count} products added successfully.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
