import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Seller from '../models/Seller.js';

const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const validRole = ['buyer', 'seller'].includes(role) ? role : 'buyer';
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({ name, email, passwordHash, role: validRole, addresses: [] });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  // If seller, include sellerId
  let sellerId = null;
  if (user.role === 'seller') {
    const seller = await Seller.findOne({ user: user._id });
    if (seller) sellerId = seller._id;
  }

  res.json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role, sellerId },
    accessToken,
    refreshToken,
  });
};

export const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return res.status(401).json({ message: 'Refresh token required' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== token) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const accessToken = generateAccessToken(user);
  const newRefresh = generateRefreshToken(user);
  user.refreshToken = newRefresh;
  await user.save();

  res.json({ accessToken, refreshToken: newRefresh });
};
