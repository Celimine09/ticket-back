const mongoose = require('mongoose');

// Define the ticket schema with only the new contact format
const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  // Only use the new structured contact information format
  contact: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    info: {
      type: String,
      required: true,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'resolved', 'rejected'],
    default: 'pending'
  },
  // History tracking for detailed audit trail
  history: [
    {
      action: {
        type: String,
        enum: ['created', 'status_updated', 'information_updated'],
        required: true
      },
      oldValue: {
        type: mongoose.Schema.Types.Mixed
      },
      newValue: {
        type: mongoose.Schema.Types.Mixed
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update timestamp and add creation event to history
ticketSchema.pre('save', function(next) {
  // Always update the timestamp when saving
  this.updatedAt = Date.now();
  
  // Add creation event to history for new tickets
  if (this.isNew) {
    if (!this.history) {
      this.history = [];
    }
    
    this.history.push({
      action: 'created',
      newValue: {
        title: this.title,
        description: this.description,
        contact: {
          name: this.contact.name,
          info: this.contact.info
        },
        status: this.status
      },
      timestamp: this.createdAt
    });
  }
  
  next();
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;