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
  const seller = await Seller.findOne({ user: req.user.id });
  if (!seller) return res.status(404).json({ message: 'Seller profile not found' });

  const products = await Product.find({ seller: seller._id }).select('_id');
  const productIds = products.map((p) => p._id);

  const orders = await Order.find({ 'items.product': { $in: productIds } })
    .populate('buyer', 'name email')
    .populate('items.product', 'name price images')
    .sort({ createdAt: -1 });

  res.json(orders);
};
