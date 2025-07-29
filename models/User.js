const mongoose = require('mongoose');

// Define the schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,       // Name is required
    trim: true            // Removes extra spaces
  },
  email: {
    type: String,
    required: true,
    unique: true,         // Prevents duplicate emails
    lowercase: true,      // Stores email in lowercase
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6          // Password must be at least 6 characters
  },
admin:{
  type:Boolean,
}
}, {
  timestamps: true         // Adds createdAt and updatedAt fields
});

// Create the model
const User = mongoose.model('User', userSchema);

// Export the model
module.exports = User;
