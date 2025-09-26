import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    unique: true,
    minlength: 2,
    maxlength: 50,
    index: true
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 500
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  courseCount: {
    type: Number,
    default: 0
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field before saving
categorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Generate slug from name if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  next();
});

// Index for better query performance
categorySchema.index({ isActive: 1, sortOrder: 1 });

// Virtual for formatted creation date
categorySchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Ensure virtual fields are serialized
categorySchema.set('toJSON', { virtuals: true });

const Category = mongoose.model("Category", categorySchema);

export { Category };
