import User from '../models/User.js';

export const getAddresses = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.user.id).select('addresses');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure addresses array exists
    if (!Array.isArray(user.addresses)) {
      user.addresses = [];
    }

    res.json(user.addresses);
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ message: 'Failed to fetch addresses' });
  }
};

export const addAddress = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      console.error(`User not found for ID: ${req.user.id}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize addresses array if it doesn't exist
    if (!Array.isArray(user.addresses)) {
      user.addresses = [];
    }

    // Handle default address
    if (req.body.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }
    
    const addr = {
      fullName: req.body.fullName,
      mobile: req.body.mobile,
      pincode: req.body.pincode,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2 || '',
      city: req.body.city,
      state: req.body.state,
      addressType: req.body.addressType || 'home',
      isDefault: user.addresses.length === 0 ? true : (req.body.isDefault || false),
    };

    user.addresses.push(addr);
    await user.save();

    // Get the newly added address (MongoDB auto-generates _id)
    const newAddr = user.addresses[user.addresses.length - 1];
    res.status(201).json(newAddr);
  } catch (error) {
    console.error('Add address error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to add address' });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize addresses array if it doesn't exist
    if (!Array.isArray(user.addresses)) {
      user.addresses = [];
    }

    user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.addressId);
    await user.save();

    res.json(user.addresses);
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Failed to delete address' });
  }
};
