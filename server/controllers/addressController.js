import User from '../models/User.js';

export const getAddresses = async (req, res) => {
  const user = await User.findById(req.user.id).select('addresses');
  res.json(user?.addresses || []);
};

export const addAddress = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const addr = req.body;
  if (addr.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }
  if (user.addresses.length === 0) {
    addr.isDefault = true;
  }

  user.addresses.push(addr);
  await user.save();

  res.status(201).json(user.addresses);
};

export const deleteAddress = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.addressId);
  await user.save();

  res.json(user.addresses);
};
