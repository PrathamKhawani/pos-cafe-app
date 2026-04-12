const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mapping = {
    // COFFEE & TEA
    "Matcha Latte": "1533933909736-2df4b614ce8d",
    "Mocha": "1574340510831-2900fd2e783a",
    "Cold Brew": "1524350300393-db37fec603c0",
    "Caramel Macchiato": "1485808191679-5f86510681a2",
    "Irish Coffee": "1570968915860-54d5c301fa9f",
    "Classic Masala Chai": "1594631252845-29fc4586d517",
    "Green Tea": "1627435601331-e37b54a35bc3",
    "Earl Grey": "1597481416396-98f566e8568c",
    "Chamomile Infusion": "1591147131343-98448f217822",
    "Iced Lemon Tea": "1556679343-c7306c1976bc",
    "Rose Petal Tea": "1558160074-4d7d8bdf4256",
    "Cappuccino": "1534778101976-62847782c213",
    "Latte": "1461023058943-07fcbe16d735",
    "Americano": "1509042239860-f550ce710b93",
    "Espresso": "1510591509098-f4fdc6d0ff04",

    // JUICES & DRINKS
    "Avocado Shake": "1550507992-eb63ffee0847",
    "Mixed Berry Smoothie": "1553530666-da11a7040669",
    "Mango Lassi": "1590740055170-0382379895c1",
    "Watermelon Mint Juice": "1562151662-de362243d52d",
    "Orange Juice": "1613478205836-798b995c9703",
    "Green Detox": "1610970882719-f91c64ec396d",
    "Tropical Paradise": "1592319793237-7f938f379bc0",
    "Sparkling Water": "1621211116262-4309199d2121",
    "Cola": "1554866585-cd94860890b7",
    "Lemonade": "1513558161293-cdaf5a034221",
    "Iced Mojito (Non-Alc)": "1513558161293-cdaf5a034221", // Unique ID check later
    "Ginger Ale": "1591244498870-dfba8dd63ba7",
    "Blue Lagoon": "1536935338218-d413d7242c4d",

    // BREAKFAST
    "Classic Eggs Benedict": "1600271882891-eb616f20d20d",
    "Pancake Stack": "1528207772081-450ca53ad95c",
    "Granola Bowl": "1511690656710-3e232c3f442d",
    "French Toast": "1484723091702-3088236d908a",
    "Omelette": "1510693206265-1d45924d5214",
    "Croissant": "1530610476404-f8974630a84d",
    "Avocado Toast": "1525351484163-7529414344d8",
    "English Breakfast": "1533089860892-a7c6f0a88666",

    // STARTERS & PLATTERS
    "Hummus Platter": "1541518763669-27fef04b14ea",
    "Bruschetta": "1574484284647-ddaa00d20bc0",
    "Garlic Bread": "1573140247632-f817477f88cd",
    "Chicken Wings (6pc)": "1527324688192-2582429b35fd",
    "Soup of the Day": "1547592166-d25089366870",
    "Spring Rolls (4pc)": "1528132593652-cf05ca2022f4",
    "Nachos Grande": "1513456852949-8e169c2ee741",
    "Tasting Platter": "1533777853192-5d755b410d16", // Specific combo plate
    "Fruit Platter": "1619566629579-be3b1111a4cf", // NEW: Fruit Plate
    "Masala Papad": "1601050630597-3f15de5c88ff",

    // BURGERS & SANDWICHES
    "BBQ Bacon Burger": "1568901346375-23c9450c58cd",
    "Classic Beef Burger": "1550547660-3184249a4452",
    "Chicken Burger": "1594212699903-f86320d512ef",
    "Veggie Burger": "1520077202324-4cc46b16ce9d",
    "Double Smash Burger": "1572802419223-f995c645ec74",
    "Fish Burger": "1523465130228-14c9793df53f",
    "Mushroom Swiss Burger": "1512408119287-32c02f4a5ec1",
    "Club Sandwich": "1567237762-dfba8dd63ba7",
    "Grilled Cheese": "1528735602780-2552fd46c7af",
    "Chicken Shawarma Wrap": "1561651823-83eb23924970",
    "Falafel Wrap": "1512621776951-a57e33716094",
    "Club Sandwich": "1528735602780-2552fd46c7af",
    "BLT Sandwich": "1528735602780-2552fd46c7af", // Duplicate check needed
    "Wagyu Sliders (3pcs)": "1568901346375-23c9450c58cd",
    "Panini Caprese": "1567237762-dfba8dd63ba7",
    "Veggie Sub": "1567237762-dfba8dd63ba7",

    // PIZZA
    "BBQ Chicken Pizza": "1565296705-ebbd06160351",
    "Margherita": "1574071318-77520e405d53",
    "Pepperoni": "1628115619366-4196677ec813",
    "Hawaiian": "1594006282639-6505e7f36952",
    "Four Cheese": "1513104890138-7c749659a591",
    "Veggie Supreme": "1565296705-ebbd06160351",
    "Truffle Mushroom": "1571934811-3320f5463f52",

    // PASTA
    "Spaghetti Bolognese": "1622973537401-2a1d1e44c214",
    "Penne Arrabbiata": "1563379011-6d04730d883b",
    "Carbonara": "1546549033-65f1fbe24abc",
    "Mac & Cheese": "1543339308-c31326f60a44",
    "Pesto Pasta": "1473093226735-e51f1f1f1f1f",
    "Alfredo Fettuccine": "1645112481338-341bc8786961",
    "Aglio E Olio": "1551183053-bf91a1d81141",
    "Truffle Mac & Cheese": "1543339308-c31326f60a44",

    // MAINS
    "Fish & Chips": "1529594422-de362243d52d",
    "Grilled Chicken": "1532774946372-ce672346cac4",
    "Steak (200g)": "1600891844638-33cc92102174",
    "Lamb Chops": "1604467727145-c120c81ef494",
    "Butter Chicken": "1588166524941-caca4a22bd31",
    "Paneer Tikka Masala": "1601050630597-3f15de5c88ff",
    "Thai Green Curry": "1455619451913-730c48fca558",
    "Seafood Risotto": "1626078437146-24076ea2887a",
    "Saffron Risotto": "1626078437146-24076ea2887a",
    "Lobster Thermidor": "1532838224-de362243d52d",

    // BOWLS & SALADS
    "Caesar Salad": "1550317144-a1f26403932a",
    "Greek Salad": "1540100719-ea1609315df1",
    "Quinoa Buddha Bowl": "1512621776951-a57e33716094",
    "Poke Bowl": "1546062472-a083b09c48b7",
    "Chicken Protein Bowl": "1543339308-c31326f60a44",
    "Mediterranean Bowl": "1541019170-eb806263df9b",

    // DESSERTS
    "Chocolate Lava Cake": "1624353335747-062f36978503",
    "Tiramisu": "1571875257124-b152345a9b43",
    "Gelato (2 Scoops)": "1501443762622-45e977e38501",
    "Brownie Sundae": "1563848655-eb5bb3cb8c1e",
    "Gulab Jamun": "1593560708920-61dd98c46a4e",
    "Crème Brûlée": "1516600164-2199f1974d6b",
    "Cheesecake": "1533134242-de362243d52d",

    // SIDES
    "French Fries": "1573010184403-f114649bb505",
    "Sweet Potato Fries": "1576109097-abbd06160351",
    "Onion Rings": "1639023013110-394bf3258764",
    "Mozzarella Sticks": "1532774946372-ce672346cac4",
    "Loaded Potato Skins": "1532774946372-ce672346cac4",
    "Coleslaw": "1464454707960-4ca742b5d43b",
  };

  const products = await prisma.product.findMany();
  let updatedCount = 0;
  const usedUrls = new Set();

  for (const product of products) {
    let imageId = mapping[product.name];
    
    // If no direct match, look for keywords
    if (!imageId) {
      const keywords = Object.keys(mapping);
      const match = keywords.find(k => product.name.toLowerCase().includes(k.toLowerCase()));
      if (match) imageId = mapping[match];
    }

    // Fallback based on category name if available
    const url = imageId 
      ? `https://images.unsplash.com/photo-${imageId}?w=800&q=80` 
      : `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80`; // General Food

    // Ensure uniqueness by adding a small variation to the URL if needed
    let finalUrl = url;
    let counter = 1;
    while (usedUrls.has(finalUrl)) {
      finalUrl = `${url}&v=${counter++}`;
    }
    usedUrls.add(finalUrl);

    await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl: finalUrl }
    });
    updatedCount++;
    console.log(`Updated: ${product.name} -> ${finalUrl}`);
  }

  console.log(`Finished! Updated ${updatedCount} products with UNIQUE images.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
