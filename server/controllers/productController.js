import Product from '../models/Product.js';
import Seller from '../models/Seller.js';

export const getProducts = async (req, res) => {
  const { q, category, minEcoScore, maxCarbon, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;

  const filter = { isActive: true };

  // Case-insensitive search on name, description, and tags
  if (q && q.trim()) {
    const searchRegex = new RegExp(q.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { tags: searchRegex },
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (minEcoScore) {
    filter.ecoScore = { ...filter.ecoScore, $gte: Number(minEcoScore) };
  }

  if (maxCarbon) {
    filter.carbonFootprint = { $lte: Number(maxCarbon) };
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Sort
  let sortObj = { createdAt: -1 };
  if (sort === 'ecoScore_desc') sortObj = { ecoScore: -1 };
  else if (sort === 'price_asc') sortObj = { price: 1 };
  else if (sort === 'price_desc') sortObj = { price: -1 };
  else if (sort === 'newest') sortObj = { createdAt: -1 };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortObj).skip(skip).limit(limitNum).populate('seller', 'businessName ecoScore'),
    Product.countDocuments(filter),
  ]);

  res.json({
    products,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  });
};

export const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('seller', 'businessName ecoScore avatarUrl');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

export const createProduct = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) return res.status(403).json({ message: 'Seller profile required' });

    // Validate required fields
    if (!req.body.name || !req.body.price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const product = await Product.create({ 
      ...req.body, 
      seller: seller._id,
      name: req.body.name.trim(),
      description: req.body.description?.trim() || '',
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error.message);
    res.status(400).json({ message: error.message || 'Failed to create product' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) return res.status(403).json({ message: 'Seller profile required' });

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: seller._id },
      {
        ...req.body,
        name: req.body.name?.trim(),
        description: req.body.description?.trim(),
      },
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ message: 'Product not found or unauthorized' });
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error.message);
    res.status(400).json({ message: error.message || 'Failed to update product' });
  }
};

export const deleteProduct = async (req, res) => {
  const seller = await Seller.findOne({ user: req.user.id });
  if (!seller) return res.status(403).json({ message: 'Seller profile required' });

  const product = await Product.findOneAndDelete({ _id: req.params.id, seller: seller._id });
  if (!product) return res.status(404).json({ message: 'Product not found or unauthorized' });
  res.json({ message: 'Product deleted' });
};
