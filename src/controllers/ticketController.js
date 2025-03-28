const Ticket = require('../models/ticketModel');

// Utility function to add history entry
const addHistoryEntry = (ticket, action, oldValue = null, newValue = null) => {
  if (!ticket.history) {
    ticket.history = [];
  }
  
  ticket.history.push({
    action,
    ...(oldValue && { oldValue }),
    ...(newValue && { newValue }),
    timestamp: Date.now()
  });
};

// Validate ticket input data
const validateTicketData = (data) => {
  const { title, description, contactName, contactInfo } = data;
  const errors = [];
  
  if (!title || typeof title !== 'string' || title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!description || typeof description !== 'string' || description.trim() === '') {
    errors.push('Description is required');
  }
  
  if (!contactName || typeof contactName !== 'string' || contactName.trim() === '') {
    errors.push('Contact name is required');
  }
  
  if (!contactInfo || typeof contactInfo !== 'string' || contactInfo.trim() === '') {
    errors.push('Contact information is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Create a new ticket
exports.createTicket = async (req, res) => {
  try {
    // Extract data from request body
    const { title, description, contactName, contactInfo } = req.body;
    
    // Validate input data
    const validation = validateTicketData({ title, description, contactName, contactInfo });
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.errors
      });
    }
    
    // Create ticket with new schema structure
    const newTicket = new Ticket({
      title,
      description,
      contact: {
        name: contactName,
        info: contactInfo
      }
    });
    
    console.log('Creating new ticket:', JSON.stringify(newTicket, null, 2));
    
    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all tickets with optional filtering
exports.getTickets = async (req, res) => {
  try {
    const { status, sort } = req.query;
    let query = {};
    let sortOption = {};
    
    // Apply status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Set sorting options
    if (sort === 'latest') {
      sortOption = { updatedAt: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }
    
    const tickets = await Ticket.find(query).sort(sortOption);
    res.status(200).json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get a specific ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Error fetching ticket by ID:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update a ticket
exports.updateTicket = async (req, res) => {
  try {
    console.log('Update request body:', req.body);
    
    // Extract all possible fields from request
    const { title, description, contactName, contactInfo, status } = req.body;
    
    // Find ticket by ID
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Initialize old values for history tracking
    const oldValues = {
      title: ticket.title,
      description: ticket.description,
      contact: {
        name: ticket.contact.name,
        info: ticket.contact.info
      },
      status: ticket.status
    };

    let isStatusChanged = false;
    let isInfoChanged = false;
    
    // Update basic fields if provided
    if (title && title !== ticket.title) {
      ticket.title = title;
      isInfoChanged = true;
    }
    
    if (description && description !== ticket.description) {
      ticket.description = description;
      isInfoChanged = true;
    }
    
    // Handle contact information update
    if (contactName && contactName !== ticket.contact.name) {
      ticket.contact.name = contactName;
      isInfoChanged = true;
    }
    
    if (contactInfo && contactInfo !== ticket.contact.info) {
      ticket.contact.info = contactInfo;
      isInfoChanged = true;
    }
    
    // Handle status update
    if (status && status !== ticket.status) {
      ticket.status = status;
      isStatusChanged = true;
      
      // Add status change to history
      addHistoryEntry(ticket, 'status_updated', 
        { status: oldValues.status }, 
        { status }
      );
    }
    
    // Add information updates to history
    if (isInfoChanged) {
      const newValues = {
        title: ticket.title,
        description: ticket.description,
        contact: {
          name: ticket.contact.name,
          info: ticket.contact.info
        }
      };
      
      addHistoryEntry(ticket, 'information_updated',
        {
          title: oldValues.title,
          description: oldValues.description,
          contact: oldValues.contact
        },
        newValues
      );
    }
    
    // Update the timestamp
    ticket.updatedAt = Date.now();
    
    // Save the updated ticket
    const updatedTicket = await ticket.save();
    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(400).json({ message: error.message });
  }
};