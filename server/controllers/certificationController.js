import Certification from '../models/Certification.js';
import Seller from '../models/Seller.js';

export const createCertification = async (req, res) => {
  const seller = await Seller.findOne({ user: req.user.id });
  if (!seller) return res.status(403).json({ message: 'Seller profile required' });

  const cert = await Certification.create({ ...req.body, seller: seller._id });

  // Add to seller's certifications array
  seller.certifications.push(cert._id);
  await seller.save();

  res.status(201).json(cert);
};

export const getCertification = async (req, res) => {
  const cert = await Certification.findById(req.params.id).populate('seller', 'businessName');
  if (!cert) return res.status(404).json({ message: 'Certification not found' });
  res.json(cert);
};

export const updateCertificationStatus = async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be approved or rejected' });
  }

  const cert = await Certification.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!cert) return res.status(404).json({ message: 'Certification not found' });

  // Recalculate seller ecoScore based on approved certs
  const approvedCerts = await Certification.countDocuments({ seller: cert.seller, status: 'approved' });
  const ecoScore = Math.min(100, approvedCerts * 20);
  await Seller.findByIdAndUpdate(cert.seller, { ecoScore });

  res.json(cert);
};
