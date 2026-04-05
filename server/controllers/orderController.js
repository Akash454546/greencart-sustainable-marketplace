import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Seller from '../models/Seller.js';

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body; // [{ product: id, qty }]

    if (!items?.length) return res.status(400).json({ message: 'Items required' });

    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true });

    if (products.length !== items.length) {
      return res.status(400).json({ message: 'Some products are invalid or inactive' });
    }

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    let totalCarbon = 0;
    let subtotal = 0;
    const orderItems = items.map((item) => {
      const prod = productMap.get(item.product.toString());
      if (!prod) {
        throw new Error(`Product not found: ${item.product}`);
      }
      totalCarbon += prod.carbonFootprint * item.qty;
      subtotal += prod.price * item.qty;
      return {
        product: prod._id,
        qty: item.qty,
        priceAtPurchase: prod.price,
      };
    });

    // Decrement stock
    for (const item of items) {
      const prod = productMap.get(item.product.toString());
      if (prod.stock < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for ${prod.name}` });
      }
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
    }

    // 5% eco discount
    const ecoDiscount = Math.round(subtotal * 0.05 * 100) / 100;

    const order = await Order.create({
      buyer: req.user.id,
      items: orderItems,
      totalCarbon,
      ecoDiscount,
      shippingAddress: shippingAddress || undefined,
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({ message: error.message || 'Failed to create order' });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    // Get orders without pagination first to ensure we get all
    const orders = await Order.find({ buyer: req.user.id })
      .populate({
        path: 'items.product',
        select: 'name price images carbonFootprint seller',
      })
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 })
      .lean(); // Use lean for faster queries

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const order = await Order.findById(req.params.id).populate('items.product', 'seller');
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Verify the seller owns at least one product in this order
  const seller = await Seller.findOne({ user: req.user.id });
  if (!seller) return res.status(403).json({ message: 'Seller profile required' });

  const sellerOwnsProduct = order.items.some(
    (item) => item.product?.seller?.toString() === seller._id.toString()
  );
  if (!sellerOwnsProduct) {
    return res.status(403).json({ message: 'You do not have products in this order' });
  }

  order.status = status;
  await order.save();

  res.json(order);
};
