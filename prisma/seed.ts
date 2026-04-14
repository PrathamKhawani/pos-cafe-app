import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Deterministic ID generator for reproducibility
function makeId(prefix: string, idx: number): string {
  return `${prefix}-${String(idx).padStart(3, '0')}`;
}

// ──────────────────────────────────────────────
// CATEGORY DEFINITIONS (15 categories)
// ──────────────────────────────────────────────
const CATEGORIES = [
  { id: 'cat-coffee',       name: 'Coffee',           color: '#6F4E37', order: 0 },
  { id: 'cat-tea',          name: 'Tea & Infusions',  color: '#2E8B57', order: 1 },
  { id: 'cat-smoothies',    name: 'Smoothies & Juices', color: '#FF6347', order: 2 },
  { id: 'cat-softdrinks',   name: 'Soft Drinks',      color: '#1E90FF', order: 3 },
  { id: 'cat-breakfast',    name: 'Breakfast',         color: '#FFD700', order: 4 },
  { id: 'cat-appetizers',   name: 'Appetizers',       color: '#FF8C00', order: 5 },
  { id: 'cat-burgers',      name: 'Burgers & Sliders', color: '#DC143C', order: 6 },
  { id: 'cat-pizza',        name: 'Artisan Pizza',    color: '#FF4500', order: 7 },
  { id: 'cat-pasta',        name: 'Pasta & Risotto',  color: '#CD853F', order: 8 },
  { id: 'cat-maincourse',   name: 'Main Course',      color: '#8B0000', order: 9 },
  { id: 'cat-indian',       name: 'Indian Delights',  color: '#E67E22', order: 10 },
  { id: 'cat-salads',       name: 'Salads & Bowls',   color: '#228B22', order: 11 },
  { id: 'cat-sandwiches',   name: 'Sandwiches & Wraps', color: '#DAA520', order: 12 },
  { id: 'cat-sides',        name: 'Sides & Extras',   color: '#F4A460', order: 13 },
  { id: 'cat-desserts',     name: 'Decadent Desserts', color: '#FF69B4', order: 14 },
  { id: 'cat-specials',     name: "Chef's Specials",  color: '#9400D3', order: 15 },
];

// ──────────────────────────────────────────────
// PRODUCT DEFINITIONS (105 products)
// ──────────────────────────────────────────────
interface ProductDef {
  id: string; name: string; categoryId: string; price: number; tax: number; description: string; uom?: string; imageUrl?: string;
  isVegetarian: boolean;
  variants?: Array<{ attribute: string; value: string; extraPrice: number }>;
}

// Category → representative Unsplash image (w=400&q=80 for fast loading)
const CAT_IMAGES: Record<string, string> = {
  'cat-coffee':     'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80',
  'cat-tea':        'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
  'cat-smoothies':  'https://images.unsplash.com/photo-1638176066823-d0f6a8a99fcf?w=400&q=80',
  'cat-softdrinks': 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80',
  'cat-breakfast':  'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80',
  'cat-starters':   'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&q=80',
  'cat-burgers':    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  'cat-pizza':      'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&q=80',
  'cat-pasta':      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&q=80',
  'cat-maincourse': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
  'cat-sandwiches': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80',
  'cat-sides':      'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80',
  'cat-desserts':   'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80',
  'cat-specials':   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
};

const PROD_IMAGES: Record<string, string> = {
  // ── Coffee (10) ──
  'p-caf-001': 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&q=80', // Espresso
  'p-caf-002': 'https://images.unsplash.com/photo-1521302200778-33500795e128?w=400&q=80', // Americano
  'p-caf-003': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80', // Cappuccino
  'p-caf-004': 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=400&q=80', // Latte
  'p-caf-005': 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&q=80', // Mocha
  'p-caf-006': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', // Cold Brew
  'p-caf-007': 'https://images.unsplash.com/photo-1598908314732-07113901949e?w=400&q=80', // Caramel Macchiato
  'p-caf-008': 'https://images.unsplash.com/photo-1541173103083-057bf00f40f2?w=400&q=80', // Cortado
  'p-caf-009': 'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=400&q=80', // Flat White
  'p-caf-010': 'https://images.unsplash.com/photo-1514066558159-fc8c737ef259?w=400&q=80', // Irish Coffee

  // ── Tea & Infusions (10) ──
  'p-tea-001': 'https://images.unsplash.com/photo-1564890369478-c89ca3d9cde4?w=400&q=80', // Masala Chai
  'p-tea-002': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', // Green Tea
  'p-tea-003': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80', // Earl Grey
  'p-tea-004': 'https://images.unsplash.com/photo-1608575737767-3549c2461440?w=400&q=80', // Chamomile
  'p-tea-005': 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&q=80', // Matcha Latte
  'p-tea-006': 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&q=80', // Iced Lemon Tea
  'p-tea-007': 'https://images.unsplash.com/photo-1597481499750-3e6b22637536?w=400&q=80', // Rose Tea
  'p-tea-008': 'https://images.unsplash.com/photo-1544787210-2827448b3bd3?w=400&q=80', // Oolong Tea
  'p-tea-009': 'https://images.unsplash.com/photo-1523920290228-4f321a939b4c?w=400&q=80', // Jasmine Tea
  'p-tea-010': 'https://images.unsplash.com/photo-1594631252845-29fc458695d7?w=400&q=80', // Hibiscus Infusion

  // ── Smoothies & Juices (10) ──
  'p-smo-001': 'https://images.unsplash.com/photo-1638176066823-d0f6a8a99fcf?w=400&q=80', // Berry Smoothie
  'p-smo-002': 'https://images.unsplash.com/photo-1571006682040-4c1c3b3d7e22?w=400&q=80', // Mango Lassi
  'p-smo-003': 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80', // Avocado Shake
  'p-smo-004': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', // Watermelon Juice
  'p-smo-005': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', // Orange Juice
  'p-smo-006': 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&q=80', // Green Detox
  'p-smo-007': 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&q=80', // Tropical Juice
  'p-smo-008': 'https://images.unsplash.com/photo-1589733901241-5e5da4bbefbb?w=400&q=80', // Strawberry Smoothie
  'p-smo-009': 'https://images.unsplash.com/photo-1628559847493-8af0d4df01ef?w=400&q=80', // Pineapple Juice
  'p-smo-010': 'https://images.unsplash.com/photo-1615478503562-ec2e8aa0e241?w=400&q=80', // Carrot & Ginger

  // ── Soft Drinks (8) ──
  'p-sof-001': 'https://images.unsplash.com/photo-1598343175492-9e5428c4bb2b?w=400&q=80', // Sparkling Water
  'p-sof-002': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80', // Cola
  'p-sof-003': 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&q=80', // Lemonade
  'p-sof-004': 'https://images.unsplash.com/photo-1609951651556-5334e2706168?w=400&q=80', // Virgin Mojito
  'p-sof-005': 'https://images.unsplash.com/photo-1585621386284-b648a64e5136?w=400&q=80', // Ginger Ale
  'p-sof-006': 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80', // Blue Lagoon
  'p-sof-007': 'https://images.unsplash.com/photo-1543253687-c931c8e01820?w=400&q=80', // Tonic Water
  'p-sof-008': 'https://images.unsplash.com/photo-1619158403521-ed9795026d47?w=400&q=80', // Root Beer

  // ── Breakfast (12) ──
  'p-brk-001': 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&q=80', // Eggs Benedict
  'p-brk-002': 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400&q=80', // Avocado Toast
  'p-brk-003': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80', // Pancakes
  'p-brk-004': 'https://images.unsplash.com/photo-1504387432042-8aca549e4729?w=400&q=80', // Granola
  'p-brk-005': 'https://images.unsplash.com/photo-1484723091739-30a460e5c78c?w=400&q=80', // French Toast
  'p-brk-006': 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400&q=80', // Omelette
  'p-brk-007': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80', // English Breakfast
  'p-brk-008': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80', // Croissants
  'p-brk-009': 'https://images.unsplash.com/photo-1509482560494-4126f8225994?w=400&q=80', // Waffles
  'p-brk-010': 'https://images.unsplash.com/photo-1517433662-2211d2b76239?w=400&q=80', // Shakshuka
  'p-brk-011': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80', // Acai Bowl
  'p-brk-012': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80', // Bagel with Lox

  // ── Appetizers (12) ──
  'p-app-001': 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&q=80', // Bruschetta
  'p-app-002': 'https://images.unsplash.com/photo-1619519713157-3c67c738bce1?w=400&q=80', // Garlic Bread
  'p-app-003': 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80', // Chicken Wings
  'p-app-004': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80', // Tomato Soup
  'p-app-005': 'https://images.unsplash.com/photo-1541696490-8744a5db7f34?w=400&q=80', // Spring Rolls
  'p-app-006': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80', // Hummus
  'p-app-007': 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&q=80', // Nachos
  'p-app-008': 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&q=80', // Calamari Rings
  'p-app-009': 'https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=400&q=80', // Mozzarella Sticks
  'p-app-010': 'https://images.unsplash.com/photo-1563379091339-03b21ef4a4f8?w=400&q=80', // Garlic Shrimp
  'p-app-011': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&q=80', // Arancini
  'p-app-012': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80', // Meatballs

  // ── Burgers & Sliders (10) ──
  'p-bur-001': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80', // Beef Burger
  'p-bur-002': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80', // Chicken Burger
  'p-bur-003': 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400&q=80', // Veggie Burger
  'p-bur-004': 'https://images.unsplash.com/photo-1596956470007-2bf6095e7e16?w=400&q=80', // Double Classic
  'p-bur-005': 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80', // BBQ Burger
  'p-bur-006': 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=400&q=80', // Fish Slider
  'p-bur-007': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', // Mushroom Swiss
  'p-bur-008': 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&q=80', // Pulled Pork
  'p-bur-009': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=80', // Breakfast Burger
  'p-bur-010': 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80', // Korean Chicken Burger

  // ── Artisan Pizza (10) ──
  'p-piz-001': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', // Margherita
  'p-piz-002': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80', // Pepperoni
  'p-piz-003': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', // BBQ Chicken
  'p-piz-004': 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&q=80', // Veggie Supreme
  'p-piz-005': 'https://images.unsplash.com/photo-1548369937-47519962c11a?w=400&q=80', // Quatro Formaggi
  'p-piz-006': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80', // Hawaiian
  'p-piz-007': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80', // Truffle Mushroom
  'p-piz-008': 'https://images.unsplash.com/photo-1593504049359-74330189a355?w=400&q=80', // Meat Lovers
  'p-piz-009': 'https://images.unsplash.com/photo-1573821663912-56990524baac?w=400&q=80', // Seafood Pizza
  'p-piz-010': 'https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=400&q=80', // Pesto Chicken

  // ── Pasta & Risotto (10) ──
  'p-pas-001': 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400&q=80', // Bolognese
  'p-pas-002': 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=80', // Arrabbiata
  'p-pas-003': 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400&q=80', // Alfredo
  'p-pas-004': 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&q=80', // Aglio E Olio
  'p-pas-005': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&q=80', // Carbonara
  'p-pas-006': 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&q=80', // Mac & Cheese
  'p-pas-007': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80', // Pesto Genovese
  'p-pas-008': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&q=80', // Seafood Pasta
  'p-pas-009': 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80', // Mushroom Risotto
  'p-pas-010': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80', // Lasagna

  // ── Main Course (15) ──
  'p-mai-001': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&q=80', // Grilled Chicken
  'p-mai-002': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', // Fish & Chips
  'p-mai-003': 'https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80', // Ribeye Steak
  'p-mai-004': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80', // Lamb Chops
  'p-mai-005': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80', // Roasted Salmon
  'p-mai-006': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80', // Roasted Chicken
  'p-mai-007': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', // BBQ Pork Ribs
  'p-mai-008': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80', // Duck Confit
  'p-mai-009': 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&q=80', // Thai Green Curry
  'p-mai-010': 'https://images.unsplash.com/photo-1551326844-4df70f2d7ccd?w=400&q=80', // Seafood Risotto
  'p-mai-011': 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=400&q=80', // Roast Beef
  'p-mai-012': 'https://images.unsplash.com/photo-1560717845-968823efbee1?w=400&q=80', // Grilled Snapper
  'p-mai-013': 'https://images.unsplash.com/photo-1579366948929-444fe7933162?w=400&q=80', // Pork Tenderloin
  'p-mai-014': 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&q=80', // Red Thai Curry
  'p-mai-015': 'https://images.unsplash.com/photo-1546241072-48010ad2862c?w=400&q=80', // Pan-Seared Tofu

  // ── Indian Delights (12) ──
  'p-ind-001': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80', // Butter Chicken
  'p-ind-002': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80', // Paneer Tikka
  'p-ind-003': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80', // Chicken Biryani
  'p-ind-004': 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=80', // Dal Makhani
  'p-ind-005': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97eb4?w=400&q=80', // Chana Masala
  'p-ind-006': 'https://images.unsplash.com/photo-1533777857419-3746f56fa436?w=400&q=80', // Garlic Naan
  'p-ind-007': 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=400&q=80', // Palak Paneer
  'p-ind-008': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80', // Samosa Platter
  'p-ind-009': 'https://images.unsplash.com/photo-1604153322567-0208e9ca3307?w=400&q=80', // Tandoori Chicken
  'p-ind-010': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80', // Aloo Gobi
  'p-ind-011': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80', // Lamb Rogan Josh
  'p-ind-012': 'https://images.unsplash.com/photo-1631515233215-a2d593025686?w=400&q=80', // Malai Kofta

  // ── Salads & Bowls (10) ──
  'p-sal-001': 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&q=80', // Caesar Salad
  'p-sal-002': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80', // Greek Salad
  'p-sal-003': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80', // Buddha Bowl
  'p-sal-004': 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=400&q=80', // Poke Bowl (Salmon)
  'p-sal-005': 'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?w=400&q=80', // Quinoa Salad
  'p-sal-006': 'https://images.unsplash.com/photo-1547496502-affa22d38842?w=400&q=80', // Cobb Salad
  'p-sal-007': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80', // Mediterranean Bowl
  'p-sal-008': 'https://images.unsplash.com/photo-1515544832467-24b3356fc59a?w=400&q=80', // Roasted Veggie Salad
  'p-sal-009': 'https://images.unsplash.com/photo-1623855244183-52fd8d3ce2f7?w=400&q=80', // Thai Beef Salad
  'p-sal-010': 'https://images.unsplash.com/photo-1464306311696-a24929849202?w=400&q=80', // Caprese Salad

  // ── Sandwiches & Wraps (10) ──
  'p-san-001': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80', // Club Sandwich
  'p-san-002': 'https://images.unsplash.com/photo-1475090169767-40ed8d18f67d?w=400&q=80', // Grilled Cheese
  'p-san-003': 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&q=80', // Chicken Shawarma
  'p-san-004': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80', // Falafel Wrap
  'p-san-005': 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&q=80', // BLT
  'p-san-006': 'https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=400&q=80', // Panini Caprese
  'p-san-007': 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&q=80', // Veggie Sub
  'p-san-008': 'https://images.unsplash.com/photo-1539252554453-80ab4537583b?w=400&q=80', // Egg Mayo Sandwich
  'p-san-009': 'https://images.unsplash.com/photo-1511204040777-6f810738012b?w=400&q=80', // Steak Sandwich
  'p-san-010': 'https://images.unsplash.com/photo-1564758564527-b97d79cb27c1?w=400&q=80', // Turkey Wrap

  // ── Sides & Extras (10) ──
  'p-sid-001': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80', // French Fries
  'p-sid-002': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80', // Sweet Potato Fries
  'p-sid-003': 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&q=80', // Onion Rings
  'p-sid-004': 'https://images.unsplash.com/photo-1615886753865-45d4e12e8412?w=400&q=80', // Mashed Potato
  'p-sid-005': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', // Coleslaw
  'p-sid-006': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80', // Grilled Asparagus
  'p-sid-007': 'https://images.unsplash.com/photo-1467453108440-238b144fa990?w=400&q=80', // Garlic Mushrooms
  'p-sid-008': 'https://images.unsplash.com/photo-1506459225024-1428097a7e18?w=400&q=80', // Corn on the cob
  'p-sid-009': 'https://images.unsplash.com/photo-1534080564614-74b0696b473c?w=400&q=80', // Cheesy Fries
  'p-sid-010': 'https://images.unsplash.com/photo-1599321956726-587dad7b0ef6?w=400&q=80', // Steamed Veggies

  // ── Decadent Desserts (12) ──
  'p-des-001': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80', // Lava Cake
  'p-des-002': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80', // Tiramisu
  'p-des-003': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80', // Cheesecake
  'p-des-004': 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&q=80', // Artisanal Gelato
  'p-des-005': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80', // Chocolate Brownies
  'p-des-006': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80', // Apple Pie
  'p-des-007': 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&q=80', // Creme Brulee
  'p-des-008': 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&q=80', // Fruit Tart
  'p-des-009': 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&q=80', // Brownie Sundae
  'p-des-010': 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400&q=80', // Macarons
  'p-des-011': 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&q=80', // Panna Cotta
  'p-des-012': 'https://images.unsplash.com/photo-1514849302-984523450cf4?w=400&q=80', // Red Velvet Cake

  // ── Chef's Specials (8) ──
  'p-spc-001': 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&q=80', // Lobster Thermidor
  'p-spc-002': 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&q=80', // Wagyu Sliders
  'p-spc-003': 'https://images.unsplash.com/photo-1551326844-4df70f2d7ccd?w=400&q=80', // Saffron Risotto
  'p-spc-004': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', // Black Truffle Pasta
  'p-spc-005': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80', // Beef Wellington
  'p-spc-006': 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80', // Pan-Seared Scallops
  'p-spc-007': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&q=80', // Grilled Octopus
  'p-spc-008': 'https://images.unsplash.com/photo-1546793665-c74683c339c1?w=400&q=80', // Chilean Sea Bass
};

const PRODUCTS: ProductDef[] = [
  // ── Coffee ──
  { id: 'p-caf-001', name: 'Signature Espresso', categoryId: 'cat-coffee', price: 120, tax: 5, isVegetarian: true, description: 'Rich and intense' },
  { id: 'p-caf-002', name: 'Caffe Americano', categoryId: 'cat-coffee', price: 150, tax: 5, isVegetarian: true, description: 'Double shot with hot water' },
  { id: 'p-caf-003', name: 'Classic Cappuccino', categoryId: 'cat-coffee', price: 180, tax: 5, isVegetarian: true, description: 'Espresso with steamed milk foam' },
  { id: 'p-caf-004', name: 'Velvety Caffe Latte', categoryId: 'cat-coffee', price: 190, tax: 5, isVegetarian: true, description: 'Espresso with silky steamed milk' },
  { id: 'p-caf-005', name: 'Dark Chocolate Mocha', categoryId: 'cat-coffee', price: 210, tax: 5, isVegetarian: true, description: 'Espresso with premium cocoa' },
  { id: 'p-caf-006', name: 'Slow Steeped Cold Brew', categoryId: 'cat-coffee', price: 220, tax: 5, isVegetarian: true, description: '12-hour cold steep' },
  { id: 'p-caf-007', name: 'Caramel Macchiato', categoryId: 'cat-coffee', price: 230, tax: 5, isVegetarian: true, description: 'Layered with vanilla and caramel' },
  { id: 'p-caf-008', name: 'Spanish Cortado', categoryId: 'cat-coffee', price: 170, tax: 5, isVegetarian: true, description: 'Equal parts espresso and milk' },
  { id: 'p-caf-009', name: 'Aussie Flat White', categoryId: 'cat-coffee', price: 190, tax: 5, isVegetarian: true, description: 'Thin layer of microfoam' },
  { id: 'p-caf-010', name: 'Irish Coffee (Non-Alc)', categoryId: 'cat-coffee', price: 250, tax: 5, isVegetarian: true, description: 'Whipped cream and nut flavor' },

  // ── Tea & Infusions ──
  { id: 'p-tea-001', name: 'Spiced Masala Chai', categoryId: 'cat-tea', price: 90, tax: 5, isVegetarian: true, description: 'Traditional Indian spice blend' },
  { id: 'p-tea-002', name: 'Organic Green Tea', categoryId: 'cat-tea', price: 110, tax: 5, isVegetarian: true, description: 'High-antioxidant steeps' },
  { id: 'p-tea-003', name: 'Classic Earl Grey', categoryId: 'cat-tea', price: 120, tax: 5, isVegetarian: true, description: 'Bergamot-infused black tea' },
  { id: 'p-tea-004', name: 'Soothing Chamomile', categoryId: 'cat-tea', price: 120, tax: 5, isVegetarian: true, description: 'Calming floral infusion' },
  { id: 'p-tea-005', name: 'Ceremonial Matcha Latte', categoryId: 'cat-tea', price: 240, tax: 5, isVegetarian: true, description: 'Stone-ground Japanese matcha' },
  { id: 'p-tea-006', name: 'Iced Lemon Tea', categoryId: 'cat-tea', price: 130, tax: 5, isVegetarian: true, description: 'Refreshing citrus tea' },
  { id: 'p-tea-007', name: 'Persian Rose Tea', categoryId: 'cat-tea', price: 150, tax: 5, isVegetarian: true, description: 'Floral and aromatic' },
  { id: 'p-tea-008', name: 'Mountain Oolong', categoryId: 'cat-tea', price: 180, tax: 5, isVegetarian: true, description: 'Partial oxidation tea' },
  { id: 'p-tea-009', name: 'Jasmine Pearl Tea', categoryId: 'cat-tea', price: 190, tax: 5, isVegetarian: true, description: 'Hand-rolled floral pearls' },
  { id: 'p-tea-010', name: 'Hibiscus Zest', categoryId: 'cat-tea', price: 140, tax: 5, isVegetarian: true, description: 'Tart and ruby red' },

  // ── Smoothies ──
  { id: 'p-smo-001', name: 'Wild Berry Smoothie', categoryId: 'cat-smoothies', price: 210, tax: 5, isVegetarian: true, description: 'Strawberry, blueberry, raspberry' },
  { id: 'p-smo-002', name: 'Royal Mango Lassi', categoryId: 'cat-smoothies', price: 160, tax: 5, isVegetarian: true, description: 'Alphonso mango with yogurt' },
  { id: 'p-smo-003', name: 'Creamy Avocado Shake', categoryId: 'cat-smoothies', price: 250, tax: 5, isVegetarian: true, description: 'Honey and toasted nuts' },
  { id: 'p-smo-004', name: 'Fresh Watermelon Mint', categoryId: 'cat-smoothies', price: 140, tax: 5, isVegetarian: true, description: 'Pure summer refresh' },
  { id: 'p-smo-005', name: 'Cold Pressed Orange', categoryId: 'cat-smoothies', price: 180, tax: 5, isVegetarian: true, description: '100% pure Valencia' },
  { id: 'p-smo-006', name: 'Green Detox Juice', categoryId: 'cat-smoothies', price: 220, tax: 5, isVegetarian: true, description: 'Kale, spinach, apple, cucumber' },
  { id: 'p-smo-007', name: 'Tropical Sunshine', categoryId: 'cat-smoothies', price: 200, tax: 5, isVegetarian: true, description: 'Pineapple, passion fruit, mango' },
  { id: 'p-smo-008', name: 'Strawberry Banana', categoryId: 'cat-smoothies', price: 190, tax: 5, isVegetarian: true, description: 'Classic energy boost' },
  { id: 'p-smo-009', name: 'Pure Pineapple Blast', categoryId: 'cat-smoothies', price: 150, tax: 5, isVegetarian: true, description: 'Freshly juiced' },
  { id: 'p-smo-010', name: 'Carrot Ginger Kick', categoryId: 'cat-smoothies', price: 180, tax: 5, isVegetarian: true, description: 'Zesty and healthy' },

  // ── Soft Drinks ──
  { id: 'p-sof-001', name: 'Perrier Sparkling', categoryId: 'cat-softdrinks', price: 180, tax: 18, isVegetarian: true, description: 'Premium sparkling water' },
  { id: 'p-sof-002', name: 'Classic Cola Float', categoryId: 'cat-softdrinks', price: 140, tax: 18, isVegetarian: true, description: 'Cola with vanilla scoop' },
  { id: 'p-sof-003', name: 'Pink Lemonade', categoryId: 'cat-softdrinks', price: 130, tax: 18, isVegetarian: true, description: 'Home-style citrus' },
  { id: 'p-sof-004', name: 'Classic Virgin Mojito', categoryId: 'cat-softdrinks', price: 170, tax: 18, isVegetarian: true, description: 'Lime and fresh mint' },
  { id: 'p-sof-005', name: 'Spiced Ginger Ale', categoryId: 'cat-softdrinks', price: 120, tax: 18, isVegetarian: true, description: 'Bold and tingly' },
  { id: 'p-sof-006', name: 'Tropical Blue Lagoon', categoryId: 'cat-softdrinks', price: 180, tax: 18, isVegetarian: true, description: 'Curacao and citrus' },
  { id: 'p-sof-007', name: 'Indian Tonic Water', categoryId: 'cat-softdrinks', price: 110, tax: 18, isVegetarian: true, description: 'Crisp and bitter' },
  { id: 'p-sof-008', name: 'Premium Root Beer', categoryId: 'cat-softdrinks', price: 160, tax: 18, isVegetarian: true, description: 'Traditional botanical brew' },

  // ── Breakfast ──
  { id: 'p-brk-001', name: 'Truffle Eggs Benedict', categoryId: 'cat-breakfast', price: 450, tax: 5, isVegetarian: false, description: 'Poached eggs on sourdough' },
  { id: 'p-brk-002', name: 'Smashed Avocado Toast', categoryId: 'cat-breakfast', price: 380, tax: 5, isVegetarian: true, description: 'Dukkah and chili flakes' },
  { id: 'p-brk-003', name: 'Blueberry Buttermilk Pancakes', categoryId: 'cat-breakfast', price: 320, tax: 5, isVegetarian: true, description: 'Maple syrup and butter' },
  { id: 'p-brk-004', name: 'Honey Nut Granola', categoryId: 'cat-breakfast', price: 280, tax: 5, isVegetarian: true, description: 'Greek yogurt and berries' },
  { id: 'p-brk-005', name: 'Brioche French Toast', categoryId: 'cat-breakfast', price: 340, tax: 5, isVegetarian: true, description: 'Caramelized banana' },
  { id: 'p-brk-006', name: 'Garden Herb Omelette', categoryId: 'cat-breakfast', price: 290, tax: 5, isVegetarian: false, description: 'Farm fresh eggs and feta' },
  { id: 'p-brk-007', name: 'The Full English', categoryId: 'cat-breakfast', price: 550, tax: 5, isVegetarian: false, description: 'Eggs, sausage, bacon, beans' },
  { id: 'p-brk-008', name: 'Butter Croissant Basket', categoryId: 'cat-breakfast', price: 220, tax: 5, isVegetarian: true, description: 'House-made strawberry jam' },
  { id: 'p-brk-009', name: 'Belgian Waffle Tower', categoryId: 'cat-breakfast', price: 360, tax: 5, isVegetarian: true, description: 'Choco-hazelnut drizzle' },
  { id: 'p-brk-010', name: 'Classic Shakshuka', categoryId: 'cat-breakfast', price: 410, tax: 5, isVegetarian: false, description: 'Spiced tomato and eggs' },
  { id: 'p-brk-011', name: 'Amazonian Acai Bowl', categoryId: 'cat-breakfast', price: 450, tax: 5, isVegetarian: true, description: 'Nut butter and seeds' },
  { id: 'p-brk-012', name: 'NY Style Bagel & Lox', categoryId: 'cat-breakfast', price: 480, tax: 5, isVegetarian: false, description: 'Smoked salmon and cream cheese' },

  // ── Appetizers ──
  { id: 'p-app-001', name: 'Tomato Basil Bruschetta', categoryId: 'cat-appetizers', price: 240, tax: 5, isVegetarian: true, description: 'Balsamic reduction' },
  { id: 'p-app-002', name: 'Cheesy Garlic Bread', categoryId: 'cat-appetizers', price: 190, tax: 5, isVegetarian: true, description: 'Mozzarella and herbs' },
  { id: 'p-app-003', name: 'Honey BBQ Chicken Wings', categoryId: 'cat-appetizers', price: 380, tax: 5, isVegetarian: false, description: 'Blue cheese dip' },
  { id: 'p-app-004', name: 'Creamy Tomato Bisque', categoryId: 'cat-appetizers', price: 220, tax: 5, isVegetarian: true, description: 'Sourdough croutons' },
  { id: 'p-app-005', name: 'Crispy Veg Spring Rolls', categoryId: 'cat-appetizers', price: 260, tax: 5, isVegetarian: true, description: 'Sweet chili sauce' },
  { id: 'p-app-006', name: 'Truffle Hummus Dip', categoryId: 'cat-appetizers', price: 310, tax: 5, isVegetarian: true, description: 'Warm pita bread' },
  { id: 'p-app-007', name: 'Loaded Nachos Grande', categoryId: 'cat-appetizers', price: 350, tax: 5, isVegetarian: true, description: 'Guacamole and sour cream' },
  { id: 'p-app-008', name: 'Salt & Pepper Calamari', categoryId: 'cat-appetizers', price: 420, tax: 5, isVegetarian: false, description: 'Garlic aioli' },
  { id: 'p-app-009', name: 'Crispy Mozzarella Sticks', categoryId: 'cat-appetizers', price: 280, tax: 5, isVegetarian: true, description: 'Marinara sauce' },
  { id: 'p-app-010', name: 'Garlic Butter Prawns', categoryId: 'cat-appetizers', price: 520, tax: 5, isVegetarian: false, description: 'Lemon and parsley' },
  { id: 'p-app-011', name: 'Truffle Mac Arancini', categoryId: 'cat-appetizers', price: 340, tax: 5, isVegetarian: true, description: 'Parmesan crust' },
  { id: 'p-app-012', name: 'Italian Braised Meatballs', categoryId: 'cat-appetizers', price: 410, tax: 5, isVegetarian: false, description: 'Pomodoro sauce' },

  // ── Burgers ──
  { id: 'p-bur-001', name: 'Angus Beef Cheese Burger', categoryId: 'cat-burgers', price: 420, tax: 5, isVegetarian: false, description: 'Aged cheddar and pickles' },
  { id: 'p-bur-002', name: 'Crispy Zinger Burger', categoryId: 'cat-burgers', price: 380, tax: 5, isVegetarian: false, description: 'Spicy slaw and mayo' },
  { id: 'p-bur-003', name: 'Grilled Halloumi Burger', categoryId: 'cat-burgers', price: 390, tax: 5, isVegetarian: true, description: 'Pesto and arugula' },
  { id: 'p-bur-004', name: 'The Double Decker', categoryId: 'cat-burgers', price: 550, tax: 5, isVegetarian: false, description: 'Twice the beef and cheese' },
  { id: 'p-bur-005', name: 'Hickory BBQ Bacon Burger', categoryId: 'cat-burgers', price: 490, tax: 5, isVegetarian: false, description: 'Onion rings and bacon' },
  { id: 'p-bur-006', name: 'Baja Fish Sliders', categoryId: 'cat-burgers', price: 450, tax: 5, isVegetarian: false, description: 'Cod fillet with tartare' },
  { id: 'p-bur-007', name: 'Wild Mushroom Swiss', categoryId: 'cat-burgers', price: 460, tax: 5, isVegetarian: true, description: 'Creamy mushroom sauce' },
  { id: 'p-bur-008', name: 'Slow Cooked Pulled Pork', categoryId: 'cat-burgers', price: 520, tax: 5, isVegetarian: false, description: 'Apple cider slaw' },
  { id: 'p-bur-009', name: 'The Early Bird Burger', categoryId: 'cat-burgers', price: 480, tax: 5, isVegetarian: false, description: 'Fried egg and hashbrown' },
  { id: 'p-bur-010', name: 'Korean Gochujang Chicken', categoryId: 'cat-burgers', price: 440, tax: 5, isVegetarian: false, description: 'Pickled radish' },

  // ── Pizza ──
  { id: 'p-piz-001', name: 'Neapolitan Margherita', categoryId: 'cat-pizza', price: 380, tax: 5, isVegetarian: true, description: 'Fresh mozzarella and basil' },
  { id: 'p-piz-002', name: 'Double Pepperoni Feast', categoryId: 'cat-pizza', price: 460, tax: 5, isVegetarian: false, description: 'Spicy pepperoni and jalapenos' },
  { id: 'p-piz-003', name: 'BBQ Pollo Pizza', categoryId: 'cat-pizza', price: 490, tax: 5, isVegetarian: false, description: 'Grilled chicken and red onions' },
  { id: 'p-piz-004', name: 'Garden Veggie Supreme', categoryId: 'cat-pizza', price: 420, tax: 5, isVegetarian: true, description: 'Bell peppers, olives, corn' },
  { id: 'p-piz-005', name: 'Four Cheese Bianca', categoryId: 'cat-pizza', price: 480, tax: 5, isVegetarian: true, description: 'Gorgonzola, feta, mozz, parm' },
  { id: 'p-piz-006', name: 'Classic Hawaiian', categoryId: 'cat-pizza', price: 440, tax: 5, isVegetarian: false, description: 'Pineapple and honey ham' },
  { id: 'p-piz-007', name: 'Black Truffle & Mushroom', categoryId: 'cat-pizza', price: 580, tax: 5, isVegetarian: true, description: 'White base and truffle oil' },
  { id: 'p-piz-008', name: 'Ultimate Meat Lovers', categoryId: 'cat-pizza', price: 590, tax: 5, isVegetarian: false, description: 'Sausage, bacon, pepperoni' },
  { id: 'p-piz-009', name: 'Mediterranean Seafood', categoryId: 'cat-pizza', price: 650, tax: 5, isVegetarian: false, description: 'Prawns, squid, mussels' },
  { id: 'p-piz-010', name: 'Pesto Chicken & Sun-dried', categoryId: 'cat-pizza', price: 520, tax: 5, isVegetarian: false, description: 'Emerald pesto base' },

  // ── Pasta ──
  { id: 'p-pas-001', name: 'Slow Braised Bolognese', categoryId: 'cat-pasta', price: 450, tax: 5, isVegetarian: false, description: 'Rich beef and tomato ragu' },
  { id: 'p-pas-002', name: 'Spicy Penne Arrabbiata', categoryId: 'cat-pasta', price: 380, tax: 5, isVegetarian: true, description: 'Garlic and chili flakes' },
  { id: 'p-pas-003', name: 'Wild Mushroom Alfredo', categoryId: 'cat-pasta', price: 420, tax: 5, isVegetarian: true, description: 'Fettuccine in white sauce' },
  { id: 'p-pas-004', name: 'Prawn Aglio E Olio', categoryId: 'cat-pasta', price: 550, tax: 5, isVegetarian: false, description: 'Olive oil and toasted garlic' },
  { id: 'p-pas-005', name: 'Classic Carbonara', categoryId: 'cat-pasta', price: 480, tax: 5, isVegetarian: false, description: 'Guanciale and pecorino' },
  { id: 'p-pas-006', name: 'Four Cheese Mac', categoryId: 'cat-pasta', price: 390, tax: 5, isVegetarian: true, description: 'Panko breadcrumb crust' },
  { id: 'p-pas-007', name: 'Artisan Pesto Genovese', categoryId: 'cat-pasta', price: 410, tax: 5, isVegetarian: true, description: 'Pinewood nuts and basil' },
  { id: 'p-pas-008', name: 'Linguine Frutti Di Mare', categoryId: 'cat-pasta', price: 620, tax: 5, isVegetarian: false, description: 'Mixed seafood in white wine' },
  { id: 'p-pas-009', name: 'Truffle Mushroom Risotto', categoryId: 'cat-pasta', price: 580, tax: 5, isVegetarian: true, description: 'Arborio rice with porcini' },
  { id: 'p-pas-010', name: 'Baked Beef Lasagna', categoryId: 'cat-pasta', price: 490, tax: 5, isVegetarian: false, description: 'Layers of pasta and bechamel' },

  // ── Main Course ──
  { id: 'p-mai-001', name: 'Lemon Herb Grilled Chicken', categoryId: 'cat-maincourse', price: 580, tax: 5, isVegetarian: false, description: 'Mashed potatoes and greens' },
  { id: 'p-mai-002', name: 'Crispy Fish & Chips', categoryId: 'cat-maincourse', price: 520, tax: 5, isVegetarian: false, description: 'Beer battered cod and peas' },
  { id: 'p-mai-003', name: 'Premium Ribeye Steak', categoryId: 'cat-maincourse', price: 1250, tax: 5, isVegetarian: false, description: '300g Argentinian beef' },
  { id: 'p-mai-004', name: 'Herb Crusted Lamb Chops', categoryId: 'cat-maincourse', price: 950, tax: 5, isVegetarian: false, description: 'Mint jus and root veg' },
  { id: 'p-mai-005', name: 'Pan Seared Atlantic Salmon', categoryId: 'cat-maincourse', price: 890, tax: 5, isVegetarian: false, description: 'Asparagus and lemon butter' },
  { id: 'p-mai-006', name: 'Roasted Half Chicken', categoryId: 'cat-maincourse', price: 640, tax: 5, isVegetarian: false, description: 'Country style gravy' },
  { id: 'p-mai-007', name: 'Sticky BBQ Pork Ribs', categoryId: 'cat-maincourse', price: 820, tax: 5, isVegetarian: false, description: 'Corn bread and slaw' },
  { id: 'p-mai-008', name: 'Slow Braised Duck Confit', categoryId: 'cat-maincourse', price: 780, tax: 5, isVegetarian: false, description: 'Orange reduction' },
  { id: 'p-mai-009', name: 'Spicy Thai Green Curry', categoryId: 'cat-maincourse', price: 460, tax: 5, isVegetarian: false, description: 'Chicken and jasmine rice' },
  { id: 'p-mai-010', name: 'Seafood Paella Royal', categoryId: 'cat-maincourse', price: 1150, tax: 5, isVegetarian: false, description: 'Saffron rice and shellfish' },
  { id: 'p-mai-011', name: 'Balsamic Roast Beef', categoryId: 'cat-maincourse', price: 720, tax: 5, isVegetarian: false, description: 'Yorkshire pudding side' },
  { id: 'p-mai-012', name: 'Grilled Snapper Fillet', categoryId: 'cat-maincourse', price: 680, tax: 5, isVegetarian: false, description: 'Caper butter sauce' },
  { id: 'p-mai-013', name: 'Pork Tenderloin Roast', categoryId: 'cat-maincourse', price: 620, tax: 5, isVegetarian: false, description: 'Glazed with maple mustard' },
  { id: 'p-mai-014', name: 'Vegetable Red Thai Curry', categoryId: 'cat-maincourse', price: 410, tax: 5, isVegetarian: true, description: 'Bamboo shoots and peppers' },
  { id: 'p-mai-015', name: 'Sesame Crusted Tofu Steak', categoryId: 'cat-maincourse', price: 440, tax: 5, isVegetarian: true, description: 'Stir-fry vegetables' },

  // ── Indian Delights ──
  { id: 'p-ind-001', name: 'Old Delhi Butter Chicken', categoryId: 'cat-indian', price: 540, tax: 5, isVegetarian: false, description: 'Creamy tomato gravy' },
  { id: 'p-ind-002', name: 'Paneer Tikka Masala', categoryId: 'cat-indian', price: 480, tax: 5, isVegetarian: true, description: 'Charred cottage cheese' },
  { id: 'p-ind-003', name: 'Hyderabadi Dum Biryani', categoryId: 'cat-indian', price: 590, tax: 5, isVegetarian: false, description: 'Long grain basmati and spices' },
  { id: 'p-ind-004', name: 'Dal Makhani Bukhara', categoryId: 'cat-indian', price: 420, tax: 5, isVegetarian: true, description: 'Slow cooked black lentils' },
  { id: 'p-ind-005', name: 'Amritsari Chana Masala', categoryId: 'cat-indian', price: 380, tax: 5, isVegetarian: true, description: 'Tangy and spicy chickpeas' },
  { id: 'p-ind-006', name: 'Assorted Naan Basket', categoryId: 'cat-indian', price: 290, tax: 5, isVegetarian: true, description: 'Garlic, butter, and plain' },
  { id: 'p-ind-007', name: 'Lasooni Palak Paneer', categoryId: 'cat-indian', price: 460, tax: 5, isVegetarian: true, description: 'Spinach and cottage cheese' },
  { id: 'p-ind-008', name: 'Cocktail Samosa Platter', categoryId: 'cat-indian', price: 240, tax: 5, isVegetarian: true, description: 'Mint chutney dip' },
  { id: 'p-ind-009', name: 'Tandoori Sizzler Chicken', categoryId: 'cat-indian', price: 620, tax: 5, isVegetarian: false, description: 'Classic yogurt marinade' },
  { id: 'p-ind-010', name: 'Homestyle Aloo Gobi', categoryId: 'cat-indian', price: 340, tax: 5, isVegetarian: true, description: 'Potato and cauliflower' },
  { id: 'p-ind-011', name: 'Kashmiri Lamb Rogan Josh', categoryId: 'cat-indian', price: 750, tax: 5, isVegetarian: false, description: 'Aromatic red chili gravy' },
  { id: 'p-ind-012', name: 'Sweet & Creamy Malai Kofta', categoryId: 'cat-indian', price: 490, tax: 5, isVegetarian: true, description: 'Dumplings in cashewnut gravy' },

  // ── Salads ──
  { id: 'p-sal-001', name: 'Classic Chicken Caesar', categoryId: 'cat-salads', price: 320, tax: 5, isVegetarian: false, description: 'Parmesan and croutons' },
  { id: 'p-sal-002', name: 'Greek Feta Salad', categoryId: 'cat-salads', price: 280, tax: 5, isVegetarian: true, description: 'Kalamata olives and oregan' },
  { id: 'p-sal-003', name: 'Rainbow Buddha Bowl', categoryId: 'cat-salads', price: 450, tax: 5, isVegetarian: true, description: 'Quinoa, pulses, and greens' },
  { id: 'p-sal-004', name: 'Pacific Salmon Poke', categoryId: 'cat-salads', price: 680, tax: 5, isVegetarian: false, description: 'Edamame and sushi rice' },
  { id: 'p-sal-005', name: 'Superfood Quinoa Salad', categoryId: 'cat-salads', price: 360, tax: 5, isVegetarian: true, description: 'Pomegranate and citrus' },
  { id: 'p-sal-006', name: 'Loaded American Cobb', categoryId: 'cat-salads', price: 480, tax: 5, isVegetarian: false, description: 'Eggs, bacon, and blue cheese' },
  { id: 'p-sal-007', name: 'Warm Mediterranean Bowl', categoryId: 'cat-salads', price: 390, tax: 5, isVegetarian: true, description: 'Roasted chickpeas and tahini' },
  { id: 'p-sal-008', name: 'Roasted Autumn Veggies', categoryId: 'cat-salads', price: 340, tax: 5, isVegetarian: true, description: 'Honey balsamic glaze' },
  { id: 'p-sal-009', name: 'Spicy Thai Beef Salad', categoryId: 'cat-salads', price: 520, tax: 5, isVegetarian: false, description: 'Nam jim dressing' },
  { id: 'p-sal-010', name: 'Caprese Buffalo Mozzarella', categoryId: 'cat-salads', price: 440, tax: 5, isVegetarian: true, description: 'Balsamic and fresh basil' },

  // ── Sandwiches ──
  { id: 'p-san-001', name: 'Triple Decker Club', categoryId: 'cat-sandwiches', price: 380, tax: 5, isVegetarian: false, description: 'Turkey, bacon, and egg' },
  { id: 'p-san-002', name: 'Gourmet Grilled Cheese', categoryId: 'cat-sandwiches', price: 290, tax: 5, isVegetarian: true, description: 'Three cheese blend' },
  { id: 'p-san-003', name: 'Lebanese Chicken Shawarma', categoryId: 'cat-sandwiches', price: 340, tax: 5, isVegetarian: false, description: 'Tahini and pickles' },
  { id: 'p-san-004', name: 'Crispy Falafel Wrap', categoryId: 'cat-sandwiches', price: 280, tax: 5, isVegetarian: true, description: 'Hummus and lettuce' },
  { id: 'p-san-005', name: 'Classic Smokehouse BLT', categoryId: 'cat-sandwiches', price: 350, tax: 5, isVegetarian: false, description: 'Toasted whole wheat' },
  { id: 'p-san-006', name: 'Italian Panini Caprese', categoryId: 'cat-sandwiches', price: 320, tax: 5, isVegetarian: true, description: 'Pesto and mozzarella' },
  { id: 'p-san-007', name: 'Veggie Garden Sub', categoryId: 'cat-sandwiches', price: 270, tax: 5, isVegetarian: true, description: 'Avocado and sprouts' },
  { id: 'p-san-008', name: 'Truffle Egg Mayo', categoryId: 'cat-sandwiches', price: 290, tax: 5, isVegetarian: false, description: 'English mustard and cress' },
  { id: 'p-san-009', name: 'Philly Cheese Steak', categoryId: 'cat-sandwiches', price: 540, tax: 5, isVegetarian: false, description: 'Bell peppers and beef' },
  { id: 'p-san-010', name: 'Honey Mustard Turkey', categoryId: 'cat-sandwiches', price: 360, tax: 5, isVegetarian: false, description: 'Cranberry and swiss' },

  // ── Sides ──
  { id: 'p-sid-001', name: 'Skin-on French Fries', categoryId: 'cat-sides', price: 150, tax: 5, isVegetarian: true, description: 'With house-made dip' },
  { id: 'p-sid-002', name: 'Sweet Potato Fries', categoryId: 'cat-sides', price: 190, tax: 5, isVegetarian: true, description: 'Smoky paprika salt' },
  { id: 'p-sid-003', name: 'Tempura Onion Rings', categoryId: 'cat-sides', price: 180, tax: 5, isVegetarian: true, description: 'Garlic aioli' },
  { id: 'p-sid-004', name: 'Buttery Mashed Potato', categoryId: 'cat-sides', price: 160, tax: 5, isVegetarian: true, description: 'Creamy and smooth' },
  { id: 'p-sid-005', name: 'Creamy Apple Slaw', categoryId: 'cat-sides', price: 140, tax: 5, isVegetarian: true, description: 'Zesty dressing' },
  { id: 'p-sid-006', name: 'Charred Garlic Asparagus', categoryId: 'cat-sides', price: 280, tax: 5, isVegetarian: true, description: 'Lemon zest' },
  { id: 'p-sid-007', name: 'Truffle Garlic Mushrooms', categoryId: 'cat-sides', price: 310, tax: 5, isVegetarian: true, description: 'Sauteed with herbs' },
  { id: 'p-sid-008', name: 'Mexican Street Corn', categoryId: 'cat-sides', price: 240, tax: 5, isVegetarian: true, description: 'Chili, lime, and cotija' },
  { id: 'p-sid-009', name: 'Loaded Cheesy Fries', categoryId: 'cat-sides', price: 290, tax: 5, isVegetarian: true, description: 'Jalapenos and scallions' },
  { id: 'p-sid-010', name: 'Garden Steamed Veggies', categoryId: 'cat-sides', price: 190, tax: 5, isVegetarian: true, description: 'Light butter glase' },

  // ── Desserts ──
  { id: 'p-des-001', name: 'Belgian Lava Cake', categoryId: 'cat-desserts', price: 280, tax: 5, isVegetarian: true, description: 'Warm melting center' },
  { id: 'p-des-002', name: 'Authentic Tiramisu', categoryId: 'cat-desserts', price: 320, tax: 5, isVegetarian: true, description: 'Coffee soaked savoiardi' },
  { id: 'p-des-003', name: 'NY Baked Cheesecake', categoryId: 'cat-desserts', price: 350, tax: 5, isVegetarian: true, description: 'NY style with berry compote' },
  { id: 'p-des-004', name: 'Artisanal Gelato Scoop', categoryId: 'cat-desserts', price: 150, tax: 5, isVegetarian: true, description: 'Various flavors' },
  { id: 'p-des-005', name: 'Fudgy Walnut Brownies', categoryId: 'cat-desserts', price: 220, tax: 5, isVegetarian: true, description: 'Warm and gooey' },
  { id: 'p-des-006', name: 'Spiced Apple Crumble Pie', categoryId: 'cat-desserts', price: 310, tax: 5, isVegetarian: true, description: 'Vanilla ice cream' },
  { id: 'p-des-007', name: 'Vanilla Bean Creme Brulee', categoryId: 'cat-desserts', price: 380, tax: 5, isVegetarian: true, description: 'Torched sugar crust' },
  { id: 'p-des-008', name: 'Seasonal Fruit Tart', categoryId: 'cat-desserts', price: 290, tax: 5, isVegetarian: true, description: 'Custard filled' },
  { id: 'p-des-009', name: 'Epic Brownie Sundae', categoryId: 'cat-desserts', price: 420, tax: 5, isVegetarian: true, description: 'Marshmallows and hot fudge' },
  { id: 'p-des-010', name: 'Rainbow Macaron Box', categoryId: 'cat-desserts', price: 550, tax: 5, isVegetarian: true, description: 'Set of 6 mixed' },
  { id: 'p-des-011', name: 'Rosewater Panna Cotta', categoryId: 'cat-desserts', price: 340, tax: 5, isVegetarian: true, description: 'Pistachio brittle' },
  { id: 'p-des-012', name: 'Velvety Red Velvet Cake', categoryId: 'cat-desserts', price: 360, tax: 5, isVegetarian: true, description: 'Cream cheese frosting' },

  // ── Chef's Specials ──
  { id: 'p-spc-001', name: 'Grand Lobster Thermidor', categoryId: 'cat-specials', price: 2450, tax: 5, isVegetarian: false, description: 'Cognac cream and Gruyere' },
  { id: 'p-spc-002', name: 'Mini Wagyu Sliders', categoryId: 'cat-specials', price: 1150, tax: 5, isVegetarian: false, description: 'Truffle mayo and brie' },
  { id: 'p-spc-003', name: 'Saffron & Gold Risotto', categoryId: 'cat-specials', price: 1400, tax: 5, isVegetarian: true, description: 'Edible gold leaf garnish' },
  { id: 'p-spc-004', name: 'Black Truffle Tagliatelle', categoryId: 'cat-specials', price: 1850, tax: 5, isVegetarian: true, description: 'Freshly shaved Umbrian truffle' },
  { id: 'p-spc-005', name: 'Angus Beef Wellington', categoryId: 'cat-specials', price: 2100, tax: 5, isVegetarian: false, description: 'Parma ham and mushroom duxelles' },
  { id: 'p-spc-006', name: 'Pan-Seared Hokkaido Scallops', categoryId: 'cat-specials', price: 1650, tax: 5, isVegetarian: false, description: 'Cauliflower puree' },
  { id: 'p-spc-007', name: 'Chargrilled Spanish Octopus', categoryId: 'cat-specials', price: 1550, tax: 5, isVegetarian: false, description: 'Chorizo and potato' },
  { id: 'p-spc-008', name: 'Chilean Sea Bass Glazed', categoryId: 'cat-specials', price: 1950, tax: 5, isVegetarian: false, description: 'Miso marinade' },
].map(p => ({ ...p, imageUrl: PROD_IMAGES[p.id] ?? CAT_IMAGES[p.categoryId] }));

// ──────────────────────────────────────────────
// HELPER: Seeded random number generator
// ──────────────────────────────────────────────
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rng = seededRandom(42);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(arr: T[], min: number, max: number): T[] {
  const n = min + Math.floor(rng() * (max - min + 1));
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

async function main() {
  console.log('🚀 Seeding database with comprehensive data...\n');

  // ═══════════════════════════════════════════
  // 0. CLEANUP (Full Reset)
  // ═══════════════════════════════════════════
  const isForcedReset = process.env.FORCED_RESET === 'true';
  
  if (isForcedReset) {
    console.log('🧹 FORCED RESET: Cleaning up old data...');
    await prisma.table.deleteMany({});
    await prisma.floor.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.branch.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    console.log('✅ Base cleanup complete.');
  } else {
    console.log('ℹ️ Skipping cleanup. Use FORCED_RESET=true to wipe database.');
  }


  // ═══════════════════════════════════════════
  // 1. ADMIN USER
  // ═══════════════════════════════════════════
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@posca.fe' },
    update: {},
    create: { name: 'Admin', email: 'admin@posca.fe', password: hashedPassword, role: 'ADMIN' },
  });
  console.log('✅ Admin user:', admin.email);

  // ═══════════════════════════════════════════
  // 2. CATEGORIES (15)
  // ═══════════════════════════════════════════
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, color: cat.color, order: cat.order },
      create: cat,
    });
  }
  console.log(`✅ Categories: ${CATEGORIES.length}`);

  // ═══════════════════════════════════════════
  // 3. PRODUCTS (105) + Variants
  // ═══════════════════════════════════════════
  for (const prod of PRODUCTS) {
    const { variants, ...productData } = prod;
    await prisma.product.upsert({
      where: { id: prod.id },
      update: { name: prod.name, price: prod.price, tax: prod.tax, description: prod.description, categoryId: prod.categoryId, isVegetarian: prod.isVegetarian },
      create: productData,
    });

    if (variants && variants.length > 0) {
      // Delete existing variants for this product to avoid duplicates on re-seed
      await prisma.productVariant.deleteMany({ where: { productId: prod.id } });
      for (let vi = 0; vi < variants.length; vi++) {
        await prisma.productVariant.create({
          data: {
            id: `var-${prod.id}-${vi}`,
            productId: prod.id,
            attribute: variants[vi].attribute,
            value: variants[vi].value,
            extraPrice: variants[vi].extraPrice,
          },
        });
      }
    }
  }
  console.log(`✅ Products: ${PRODUCTS.length} (with variants)`);

  // 4. BRANCHES, FLOORS & TABLES (Dynamic 10 Branches)
  // ═══════════════════════════════════════════
  const existingBranches = await prisma.branch.findMany({
    include: { _count: { select: { floors: true } } }
  });

  if (existingBranches.length === 0 || isForcedReset) {
    console.log('🏗️  Creating 10 Premium Branches with Dynamic Layouts...');
    
    const BRANCH_CONFIGS = [
      { name: 'Downtown Cafe', type: 'SEATING', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800' },
      { name: 'Harbor Bistro', type: 'SEATING', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800' },
      { name: 'Skyline Lounge', type: 'MIXED', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800' },
      { name: 'Garden Terrace', type: 'SEATING', image: 'https://images.unsplash.com/photo-1533055640609-24b498dfd74c?auto=format&fit=crop&q=80&w=800' },
      { name: 'Urban Express', type: 'TAKEAWAY', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800' },
      { name: 'Old Town Tavern', type: 'SEATING', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800' },
      { name: 'Seaside Grill', type: 'MIXED', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800' },
      { name: 'The Roastery', type: 'SEATING', image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&q=80&w=800' },
      { name: 'Mountain Peak', type: 'SEATING', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800' },
      { name: 'Metro Plaza', type: 'TAKEAWAY', image: 'https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&q=80&w=800' }
    ];

    for (const b of BRANCH_CONFIGS) {
      await prisma.branch.upsert({
        where: { name: b.name },
        update: {},
        create: {
          name: b.name,
          type: b.type as any,
          imageUrl: b.image,
        }
      });
    }
  }

  // Reload branches to process layouts for all (existing and new)
  const allBranches = await prisma.branch.findMany({
    include: { _count: { select: { floors: true } } }
  });

  const allTables = [];
  const floorPool = [
    'Grand Ballroom', 'Sunlit Terrace', 'Vintage Loft', 'Mezzanine Bar', 
    'Library Lounge', 'Rooftop Garden', 'Secret Cellar', 'Main Atrium', 
    'Gallery Walk', 'Sky Deck', 'Cozy Corner'
  ];

  for (const branch of allBranches) {
    if (branch.type === 'TAKEAWAY') continue;

    // Only seed if branch has no floors
    if (branch._count.floors === 0 || isForcedReset) {
      console.log(`🏗️  Seeding dynamic layout for branch: ${branch.name}...`);
      const floorCount = Math.floor(rng() * 3) + 1;
      const selectedFloors = pickN(floorPool, floorCount, floorCount);

      for (const floorName of selectedFloors) {
        const floor = await prisma.floor.create({
          data: {
            name: floorName,
            branchId: branch.id,
          }
        });

        const tableCount = Math.floor(rng() * 8) + 6; 
        for (let i = 1; i <= tableCount; i++) {
          const prefix = floorName.split(' ').map(w => w[0]).join('').toUpperCase();
          const t = await prisma.table.create({
            data: {
              number: `${prefix}${i}`,
              seats: pick([2, 4, 4, 4, 6, 8, 10]),
              floorId: floor.id,
              isActive: true,
              tableType: pick(['Table', 'Booth', 'Bar', 'Table']),
            }
          });
          allTables.push(t);
        }
      }
    } else {
        const existingTables = await prisma.table.findMany({
            where: { floor: { branchId: branch.id } }
        });
        allTables.push(...existingTables);
    }
  }

  console.log(`✅ Current tables across all branches: ${allTables.length}`);



  // ═══════════════════════════════════════════
  // 5. POS CONFIG
  // ═══════════════════════════════════════════
  await prisma.pOSConfig.upsert({
    where: { id: 'default-config' },
    update: {},
    create: { id: 'default-config', cashEnabled: true, digitalEnabled: true, upiEnabled: true },
  });
  console.log('✅ POS Config');

  // ═══════════════════════════════════════════
  // 6. SESSION
  // ═══════════════════════════════════════════
  const session = await prisma.session.create({
    data: { userId: admin.id, openingCash: 5000 },
  });
  console.log('✅ Session created');

  // ═══════════════════════════════════════════
  // 7. GENERATE 300 REALISTIC ORDERS
  // ═══════════════════════════════════════════
  console.log('\n📦 Generating 300 orders (this may take a moment)...');

  const ORDER_COUNT = 50;
  const BATCH_SIZE = 5;           // process 5 orders at a time
  const BATCH_DELAY_MS = 1200;    // pause between batches to avoid pool exhaustion
  const MAX_RETRIES = 5;

  const paymentMethods: Array<'CASH' | 'DIGITAL' | 'UPI'> = ['CASH', 'DIGITAL', 'UPI'];
  const now = new Date();

  // Helper: retry a prisma call on P2024 timeout
  async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        if (err?.code === 'P2024' && attempt < retries) {
          console.log(`   ⚠️  Pool timeout, retrying (${attempt}/${retries - 1})...`);
          await new Promise(r => setTimeout(r, 1500 * attempt));
        } else {
          throw err;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  // Helper: sleep
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  // Pre-compute all order data (no DB calls yet)
  interface OrderPlan {
    table: any; // Using any for simplicity in seeder to avoid complex Prisma include types
    orderProducts: typeof PRODUCTS;
    daysAgo: number;
    hoursOffset: number;
    minutes: number;
    status: 'PAID' | 'READY' | 'PREPARING' | 'SENT';
    payMethod: 'CASH' | 'DIGITAL' | 'UPI';
  }

  const plans: OrderPlan[] = [];
  for (let i = 0; i < ORDER_COUNT; i++) {
    const table = pick(allTables);
    const orderProducts = pickN(PRODUCTS, 1, 5);
    const daysAgo = Math.floor(rng() * 30);
    const hoursOffset = 8 + Math.floor(rng() * 14);
    const minutes = Math.floor(rng() * 60);
    const statusRoll = rng();
    let status: 'PAID' | 'READY' | 'PREPARING' | 'SENT' = 'PAID';
    if (statusRoll > 0.98) status = 'SENT';
    else if (statusRoll > 0.95) status = 'PREPARING';
    else if (statusRoll > 0.90) status = 'READY';
    plans.push({ table, orderProducts, daysAgo, hoursOffset, minutes, status, payMethod: pick(paymentMethods) });
  }

  // Process in batches
  let created = 0;
  for (let b = 0; b < plans.length; b += BATCH_SIZE) {
    const batch = plans.slice(b, b + BATCH_SIZE);

    for (const plan of batch) {
      const orderDate = new Date(now);
      orderDate.setDate(orderDate.getDate() - plan.daysAgo);
      orderDate.setHours(plan.hoursOffset, plan.minutes, 0, 0);

      const items = plan.orderProducts.map(p => ({
        productId: p.id,
        quantity: 1 + Math.floor(rng() * 3),
        price: p.price,
        isPrepared: true,
      }));

      const orderTotal = items.reduce((sum, it) => {
        const prod = PRODUCTS.find(p => p.id === it.productId)!;
        return sum + it.price * it.quantity * (1 + prod.tax / 100);
      }, 0);

      // Get branchId for the table
      const tableInfo = await prisma.table.findUnique({
        where: { id: plan.table.id },
        include: { floor: true }
      });
      const branchId = tableInfo?.floor.branchId;

      const order = await withRetry(() => prisma.order.create({
        data: {
          tableId: plan.table.id,
          sessionId: session.id,
          userId: admin.id,
          branchId: branchId,
          status: plan.status,
          total: Math.round(orderTotal * 100) / 100,
          createdAt: orderDate,
          updatedAt: orderDate,
          items: { create: items },
        },
      }));

      if (plan.status === 'PAID') {
        await withRetry(() => prisma.payment.create({
          data: {
            orderId: (order as any).id,
            method: plan.payMethod,
            amount: (order as any).total,
            paidAt: orderDate,
          },
        }));
      }

      created++;
    }

    if (created % 50 === 0) console.log(`   📦 ${created}/${ORDER_COUNT} orders created...`);

    // Pause between batches to let the connection pool breathe
    if (b + BATCH_SIZE < plans.length) await sleep(BATCH_DELAY_MS);
  }
  console.log(`\n✅ Orders: ${ORDER_COUNT} generated across 30 days`);

  // ═══════════════════════════════════════════
  // 8. SUMMARY
  // ═══════════════════════════════════════════
  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    orders: await prisma.order.count(),
    payments: await prisma.payment.count(),
    tables: await prisma.table.count(),
  };
  console.log('\n═══════════════════════════════════════');
  console.log('🎉 SEED COMPLETE');
  console.log(`   Categories:  ${counts.categories}`);
  console.log(`   Products:    ${counts.products}`);
  console.log(`   Orders:      ${counts.orders}`);
  console.log(`   Payments:    ${counts.payments}`);
  console.log(`   Tables:      ${counts.tables}`);
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
