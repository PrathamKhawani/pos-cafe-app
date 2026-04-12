const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const imageMap = {
  // Burgers
  "Classic Beef Burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop",
  "Chicken Burger": "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?q=80&w=800&auto=format&fit=crop",
  "Double Smash Burger": "https://images.unsplash.com/photo-1594212202875-c546db954e7d?q=80&w=800&auto=format&fit=crop",
  "Fish Burger": "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop",
  "Veggie Burger": "https://images.unsplash.com/photo-1520072959219-c595dc870360?q=80&w=800&auto=format&fit=crop",
  "Mushroom Swiss Burger": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=800&auto=format&fit=crop",
  "BBQ Bacon Burger": "https://images.unsplash.com/photo-1594212202875-c546db954e7d?q=80&w=800&auto=format&fit=crop",

  // Pizza
  "Margherita": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop",
  "Pepperoni": "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800&auto=format&fit=crop",
  "BBQ Chicken Pizza": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop",
  "Veggie Supreme": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=800&auto=format&fit=crop",
  "Four Cheese": "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop",
  "Hawaiian": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop",
  "Truffle Mushroom": "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop",

  // Coffee
  "Espresso": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop",
  "Americano": "https://images.unsplash.com/photo-1551030173-122aabc4489c?q=80&w=800&auto=format&fit=crop",
  "Cappuccino": "https://images.unsplash.com/photo-1534045558163-e3801f92e737?q=80&w=800&auto=format&fit=crop",
  "Latte": "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?q=80&w=800&auto=format&fit=crop",
  "Mocha": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=800&auto=format&fit=crop",
  "Cold Brew": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=800&auto=format&fit=crop",
  "Caramel Macchiato": "https://images.unsplash.com/photo-1485605481745-f0e73dbccb0c?q=80&w=800&auto=format&fit=crop",
  "Irish Coffee": "https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?q=80&w=800&auto=format&fit=crop",

  // Pasta
  "Spaghetti Bolognese": "https://images.unsplash.com/photo-1622973536968-3ead9e780960?q=80&w=800&auto=format&fit=crop",
  "Penne Arrabbiata": "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?q=80&w=800&auto=format&fit=crop",
  "Alfredo Fettuccine": "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?q=80&w=800&auto=format&fit=crop",
  "Aglio E Olio": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=800&auto=format&fit=crop",
  "Carbonara": "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=800&auto=format&fit=crop",
  "Mac & Cheese": "https://images.unsplash.com/photo-1543339494-b4cd4f7ba68e?q=80&w=800&auto=format&fit=crop",
  "Pesto Pasta": "https://images.unsplash.com/photo-1611270629569-8b357cb88da9?q=80&w=800&auto=format&fit=crop",

  // Main Course
  "Grilled Chicken": "https://images.unsplash.com/photo-1598511796318-7b82ef4ade9b?q=80&w=800&auto=format&fit=crop",
  "Fish & Chips": "https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=800&auto=format&fit=crop",
  "Steak (200g)": "https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=800&auto=format&fit=crop",
  "Lamb Chops": "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?q=80&w=800&auto=format&fit=crop",
  "Butter Chicken": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=800&auto=format&fit=crop",
  "Paneer Tikka Masala": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=800&auto=format&fit=crop",
  "Thai Green Curry": "https://images.unsplash.com/photo-1559314809-0d155014e29e?q=80&w=800&auto=format&fit=crop",
  "Seafood Risotto": "https://images.unsplash.com/photo-1626200419111-6679b38ed6b2?q=80&w=800&auto=format&fit=crop",

  // Defaults for missing specifics below
  "default_Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop",
  "default_Coffee": "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop",
  "default_Tea & Infusions": "https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?q=80&w=800&auto=format&fit=crop",
  "default_Smoothies & Juices": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=800&auto=format&fit=crop",
  "default_Soft Drinks": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop",
  "default_Breakfast": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=800&auto=format&fit=crop",
  "default_Starters": "https://images.unsplash.com/photo-1541014741259-de529411b96a?q=80&w=800&auto=format&fit=crop",
  "default_Burgers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop",
  "default_Pasta": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=800&auto=format&fit=crop",
  "default_Main Course": "https://images.unsplash.com/photo-1544025162-831d3cae8eb6?q=80&w=800&auto=format&fit=crop",
  "default_Salads & Bowls": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
  "default_Sandwiches & Wraps": "https://images.unsplash.com/photo-1481070555726-e2fe8357725c?q=80&w=800&auto=format&fit=crop",
  "default_Chef's Specials": "https://images.unsplash.com/photo-1544025162-831d3cae8eb6?q=80&w=800&auto=format&fit=crop",
  "default_Sides & Snacks": "https://images.unsplash.com/photo-1576107246150-189f7bb1e07b?q=80&w=800&auto=format&fit=crop",
  "default_Desserts": "https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=800&auto=format&fit=crop"
};

const knownNonVegWords = ["beef", "chicken", "bacon", "fish", "lamb", "steak", "meat", "pork", "seafood", "shrimp", "lobster", "salmon"];

async function main() {
  const products = await prisma.product.findMany({ include: { category: true } });
  
  for (const p of products) {
    let url = imageMap[p.name] || imageMap[`default_${p.category.name}`] || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop";
    
    const isVeg = !knownNonVegWords.some(w => p.name.toLowerCase().includes(w));
    
    await prisma.product.update({
      where: { id: p.id },
      data: { imageUrl: url, isVegetarian: isVeg }
    });
  }
  
  console.log("Successfully updated all product images and generated veg/non-veg flags.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
