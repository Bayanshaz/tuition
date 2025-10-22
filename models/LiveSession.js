const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  meetLink: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LiveSession', liveSessionSchema);