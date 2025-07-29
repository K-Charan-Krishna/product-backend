const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  rating: {
    rate: {
      type: Number,
      required: false
    },
    count: {
      type: Number,
      required: false
    }
  }
}, {
  collection: 'products', // 👈 explicitly sets the MongoDB collection name
  timestamps: true        // optional: adds createdAt and updatedAt
});

const Product=mongoose.model('Product', productSchema);
module.exports = Product
