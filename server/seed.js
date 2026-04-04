import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import Seller from './models/Seller.js';
import Certification from './models/Certification.js';
import Product from './models/Product.js';
import Order from './models/Order.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/greencart';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Seller.deleteMany({}),
    Certification.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  const passwordHash = await bcrypt.hash('password123', 12);

  // ── Users ──
  const buyerUser = await User.create({ name: 'Alex Green', email: 'buyer@greencart.com', passwordHash, role: 'buyer' });

  const sellerUsers = await User.create([
    { name: 'Maya Forest', email: 'maya@greencart.com', passwordHash, role: 'seller' },
    { name: 'Oliver Bloom', email: 'oliver@greencart.com', passwordHash, role: 'seller' },
    { name: 'Priya Earthwell', email: 'priya@greencart.com', passwordHash, role: 'seller' },
  ]);

  const adminUser = await User.create({ name: 'Admin', email: 'admin@greencart.com', passwordHash, role: 'admin' });

  // ── Sellers ──
  const sellers = await Seller.create([
    {
      user: sellerUsers[0]._id,
      businessName: 'EcoThreads',
      description: 'Sustainable fashion made from organic & recycled fabrics. Zero-waste packaging guaranteed.',
      avatarUrl: 'https://placehold.co/120x120/1A4A2E/F9F6F0?text=ET',
      ecoScore: 80,
      isVerified: true,
    },
    {
      user: sellerUsers[1]._id,
      businessName: 'PureHarvest Foods',
      description: 'Organic, locally-sourced food delivered with carbon-neutral shipping.',
      avatarUrl: 'https://placehold.co/120x120/1A4A2E/F9F6F0?text=PH',
      ecoScore: 60,
      isVerified: true,
    },
    {
      user: sellerUsers[2]._id,
      businessName: 'GreenHome Co',
      description: 'Eco-friendly home goods — bamboo, recycled glass, compostable cleaning supplies.',
      avatarUrl: 'https://placehold.co/120x120/1A4A2E/F9F6F0?text=GH',
      ecoScore: 40,
      isVerified: false,
    },
  ]);

  // ── Certifications ──
  const certs = await Certification.create([
    { seller: sellers[0]._id, name: 'GOTS Organic Textile', issuingBody: 'Global Organic Textile Standard', issueDate: new Date('2024-03-01'), expiryDate: new Date('2027-03-01'), status: 'approved' },
    { seller: sellers[0]._id, name: 'Fair Trade Certified', issuingBody: 'Fair Trade USA', issueDate: new Date('2024-06-15'), expiryDate: new Date('2026-06-15'), status: 'approved' },
    { seller: sellers[1]._id, name: 'USDA Organic', issuingBody: 'US Department of Agriculture', issueDate: new Date('2023-11-01'), expiryDate: new Date('2026-11-01'), status: 'approved' },
    { seller: sellers[1]._id, name: 'Carbon Neutral Delivery', issuingBody: 'Climate Partner', issueDate: new Date('2024-01-10'), status: 'pending' },
    { seller: sellers[2]._id, name: 'FSC Certified', issuingBody: 'Forest Stewardship Council', issueDate: new Date('2024-09-01'), expiryDate: new Date('2027-09-01'), status: 'pending' },
  ]);

  // Link certs to sellers
  sellers[0].certifications = [certs[0]._id, certs[1]._id];
  sellers[1].certifications = [certs[2]._id, certs[3]._id];
  sellers[2].certifications = [certs[4]._id];
  await Promise.all(sellers.map((s) => s.save()));

  // ── Products ──
  const productsData = [
    // EcoThreads (fashion)
    { seller: sellers[0]._id, name: 'Organic Cotton T-Shirt', description: 'Classic crew-neck tee made from 100% GOTS-certified organic cotton. Naturally dyed, zero microplastics.', price: 34.99, category: 'fashion', images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'], carbonFootprint: 1.2, ecoScore: 92, stock: 120, tags: ['organic', 'cotton', 'basics'] },
    { seller: sellers[0]._id, name: 'Recycled Denim Jacket', description: 'Vintage-wash denim jacket crafted from 80% post-consumer recycled cotton. Each jacket saves 1,800L of water.', price: 89.99, category: 'fashion', images: ['https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400'], carbonFootprint: 3.4, ecoScore: 85, stock: 45, tags: ['recycled', 'denim', 'outerwear'] },
    { seller: sellers[0]._id, name: 'Hemp Canvas Sneakers', description: 'Lightweight sneakers with hemp upper, natural rubber sole, and cork insole. Fully compostable.', price: 64.99, category: 'fashion', images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400'], carbonFootprint: 1.8, ecoScore: 88, stock: 78, tags: ['hemp', 'footwear', 'compostable'] },
    { seller: sellers[0]._id, name: 'Bamboo Fiber Socks (3-pack)', description: 'Ultra-soft bamboo socks with reinforced heels. Antibacterial and moisture-wicking, naturally.', price: 18.99, category: 'fashion', images: ['https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400'], carbonFootprint: 0.4, ecoScore: 90, stock: 300, tags: ['bamboo', 'socks', 'basics'] },

    // PureHarvest Foods (food)
    { seller: sellers[1]._id, name: 'Organic Quinoa (1 kg)', description: 'Fair-trade Bolivian Royal quinoa. High-protein superfood, triple-washed and ready to cook.', price: 12.49, category: 'food', images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'], carbonFootprint: 0.8, ecoScore: 78, stock: 200, tags: ['organic', 'superfood', 'gluten-free'] },
    { seller: sellers[1]._id, name: 'Cold-Pressed Olive Oil (500 ml)', description: 'Single-estate extra virgin olive oil from regenerative farms in Portugal. Glass bottle.', price: 16.99, category: 'food', images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'], carbonFootprint: 1.1, ecoScore: 82, stock: 150, tags: ['organic', 'mediterranean', 'glass-bottle'] },
    { seller: sellers[1]._id, name: 'Raw Wildflower Honey (350 g)', description: 'Unfiltered, unpasteurized honey from bee-friendly wildflower meadows. Supports pollinator habitats.', price: 11.99, category: 'food', images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400'], carbonFootprint: 0.3, ecoScore: 91, stock: 180, tags: ['raw', 'honey', 'bee-friendly'] },
    { seller: sellers[1]._id, name: 'Plant-Based Protein Bars (12-pack)', description: 'Pea-protein bars with dark chocolate and oat. Compostable wrappers, no palm oil.', price: 29.99, category: 'food', images: ['https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=400'], carbonFootprint: 0.9, ecoScore: 75, stock: 250, tags: ['plant-based', 'protein', 'snack'] },
    { seller: sellers[1]._id, name: 'Single-Origin Coffee Beans (250 g)', description: 'Shade-grown Colombian beans, direct-trade. Medium roast, notes of caramel & citrus.', price: 14.99, category: 'food', images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400'], carbonFootprint: 1.5, ecoScore: 70, stock: 100, tags: ['coffee', 'single-origin', 'shade-grown'] },
    { seller: sellers[1]._id, name: 'Organic Matcha Powder (100 g)', description: 'Ceremonial-grade matcha from Uji, Japan. Stone-milled, packed in a reusable tin.', price: 24.99, category: 'food', images: ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400'], carbonFootprint: 0.6, ecoScore: 84, stock: 90, tags: ['matcha', 'organic', 'japanese'] },

    // GreenHome Co (home, beauty, tech)
    { seller: sellers[2]._id, name: 'Bamboo Cutting Board Set', description: 'Set of 3 FSC-certified bamboo boards. Naturally antimicrobial, knife-friendly, and sustainable.', price: 29.99, category: 'home', images: ['https://images.unsplash.com/photo-1594226801341-41427b4e5c22?w=400'], carbonFootprint: 1.0, ecoScore: 86, stock: 85, tags: ['bamboo', 'kitchen', 'FSC'] },
    { seller: sellers[2]._id, name: 'Recycled Glass Vase', description: 'Hand-blown vase from 100% post-consumer recycled glass. Each piece is unique.', price: 42.99, category: 'home', images: ['https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400'], carbonFootprint: 2.1, ecoScore: 73, stock: 40, tags: ['recycled-glass', 'decor', 'handmade'] },
    { seller: sellers[2]._id, name: 'Compostable Cleaning Pods (30-pack)', description: 'All-purpose cleaning pods in water-soluble film. Plant-derived surfactants, zero plastic packaging.', price: 15.99, category: 'home', images: ['https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400'], carbonFootprint: 0.2, ecoScore: 95, stock: 400, tags: ['cleaning', 'compostable', 'zero-waste'] },
    { seller: sellers[2]._id, name: 'Natural Beeswax Wrap Set', description: 'Reusable food wraps — organic cotton coated with beeswax, jojoba, and tree resin. Replaces cling film.', price: 19.99, category: 'home', images: ['https://images.unsplash.com/photo-1608181831718-c9fbc4b08c73?w=400'], carbonFootprint: 0.3, ecoScore: 93, stock: 200, tags: ['beeswax', 'zero-waste', 'food-storage'] },
    { seller: sellers[2]._id, name: 'Shea Butter Body Lotion (200 ml)', description: 'Cold-pressed shea butter lotion in aluminium pump bottle. Vegan, cruelty-free, no parabens.', price: 22.99, category: 'beauty', images: ['https://images.unsplash.com/photo-1600857544200-b2f468e9b2c5?w=400'], carbonFootprint: 0.5, ecoScore: 80, stock: 130, tags: ['vegan', 'cruelty-free', 'skincare'] },
    { seller: sellers[2]._id, name: 'Charcoal Bamboo Toothbrush (4-pack)', description: 'BPA-free charcoal-infused bamboo bristles. Handle composts in 6 months.', price: 9.99, category: 'beauty', images: ['https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400'], carbonFootprint: 0.1, ecoScore: 97, stock: 500, tags: ['bamboo', 'oral-care', 'compostable'] },
    { seller: sellers[2]._id, name: 'Solar Power Bank (10,000 mAh)', description: 'IP67-rated solar charger with recycled aluminium case. Charges phones 3× over.', price: 49.99, category: 'tech', images: ['https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400'], carbonFootprint: 4.5, ecoScore: 62, stock: 60, tags: ['solar', 'tech', 'recycled-aluminium'] },
    { seller: sellers[2]._id, name: 'Cork Wireless Mouse', description: 'Ergonomic wireless mouse with natural cork shell. Bluetooth 5.1, USB-C rechargeable.', price: 38.99, category: 'tech', images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'], carbonFootprint: 2.8, ecoScore: 58, stock: 70, tags: ['cork', 'wireless', 'eco-tech'] },
    { seller: sellers[2]._id, name: 'Recycled Ocean Plastic Phone Case', description: 'Slim phone case made from 100% recovered ocean plastic. Fits iPhone 15/16 series.', price: 27.99, category: 'tech', images: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400'], carbonFootprint: 1.3, ecoScore: 76, stock: 160, tags: ['ocean-plastic', 'phone-case', 'recycled'] },
  ];

  const products = await Product.create(productsData);
  console.log(`Seeded ${products.length} products`);

  // ── Sample Order ──
  await Order.create({
    buyer: buyerUser._id,
    items: [
      { product: products[0]._id, qty: 2, priceAtPurchase: products[0].price },
      { product: products[6]._id, qty: 1, priceAtPurchase: products[6].price },
    ],
    totalCarbon: products[0].carbonFootprint * 2 + products[6].carbonFootprint,
    status: 'confirmed',
  });

  console.log('Seeded 1 sample order');
  console.log('\n✅ Seed complete!');
  console.log('\nTest accounts:');
  console.log('  Buyer:  buyer@greencart.com / password123');
  console.log('  Seller: maya@greencart.com  / password123');
  console.log('  Seller: oliver@greencart.com / password123');
  console.log('  Seller: priya@greencart.com / password123');
  console.log('  Admin:  admin@greencart.com / password123');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
