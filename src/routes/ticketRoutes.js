const express = require('express');
const ticketController = require('../controllers/ticketController');

const router = express.Router();

// Create a new ticket
router.post('/', ticketController.createTicket);

// Get all tickets (with optional filtering)
router.get('/', ticketController.getTickets);

// Get a specific ticket
router.get('/:id', ticketController.getTicketById);

// Update a ticket
router.put('/:id', ticketController.updateTicket);

// Note: No delete route as per requirements

module.exports = router;