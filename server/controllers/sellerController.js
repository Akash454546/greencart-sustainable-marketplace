import Seller from '../models/Seller.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

export const onboard = async (req, res) => {
  const existing = await Seller.findOne({ user: req.user.id });
  if (existing) return res.status(409).json({ message: 'Seller profile already exists' });

  const seller = await Seller.create({ ...req.body, user: req.user.id });

  // Update user role to seller
  await User.findByIdAndUpdate(req.user.id, { role: 'seller' });

  res.status(201).json(seller);
};

export const getSellerProfile = async (req, res) => {
  const seller = await Seller.findById(req.params.id)
    .populate('certifications')
    .populate('user', 'name email');
  if (!seller) return res.status(404).json({ message: 'Seller not found' });
  res.json(seller);
};

export const getDashboard = async (req, res) => {
  const seller = await Seller.findOne({ user: req.user.id }).populate('certifications');
  if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

  const listings = await Product.find({ seller: seller._id }).sort({ createdAt: -1 });

  res.json({ seller, listings });
};

export const getSellerOrders = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user.id });
    if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

    // Find all products of this seller
    const products = await Product.find({ seller: seller._id }).select('_id name price');
    const productIds = products.map((p) => p._id);

    if (productIds.length === 0) {
      return res.json([]);
    }

    // Find all orders containing these products
    const orders = await Order.find({ 'items.product': { $in: productIds } })
      .populate('buyer', 'name email mobile')
      .populate('items.product', 'name price images ecoScore')
      .populate('items.product.seller', 'businessName')
      .sort({ createdAt: -1 })
      .lean();

    // Transform to include seller-relevant info
    const sellerOrders = orders.map((order) => ({
      _id: order._id,
      buyerId: order.buyer._id,
      buyerName: order.buyer.name,
      buyerEmail: order.buyer.email,
      buyerMobile: order.buyer.mobile,
      shippingAddress: order.shippingAddress,
      status: order.status,
      items: order.items.map((item) => ({
        ...item,
        // Only include items from this seller
        product: item.product,
      })).filter((item) => productIds.some((id) => id.toString() === item.product._id.toString())),
      total: order.total,
      createdAt: order.createdAt,
    }));

    res.json(sellerOrders);
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};
