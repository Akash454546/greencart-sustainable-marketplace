import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    certifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Certification' }],
    ecoScore: { type: Number, default: 0, min: 0, max: 100 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Seller', sellerSchema);
