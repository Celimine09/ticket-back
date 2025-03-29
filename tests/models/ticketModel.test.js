// tests/backend/models/ticketModel.test.js
const mongoose = require('mongoose');
const Ticket = require('../../src/models/ticketModel');

describe('Ticket Model Test', () => {
  beforeAll(async () => {
    // Make sure this test file uses the in-memory database connection
    // established in setup.js
  });

  it('should create and save a ticket successfully', async () => {
    const validTicket = new Ticket({
      title: 'Test Ticket',
      description: 'This is a test ticket description',
      contact: {
        name: 'Test User',
        info: 'test@example.com'
      }
    });

    const savedTicket = await validTicket.save();
    
    // Check the saved ticket
    expect(savedTicket._id).toBeDefined();
    expect(savedTicket.title).toBe('Test Ticket');
    expect(savedTicket.description).toBe('This is a test ticket description');
    expect(savedTicket.contact.name).toBe('Test User');
    expect(savedTicket.contact.info).toBe('test@example.com');
    expect(savedTicket.status).toBe('pending'); // Default status
    expect(savedTicket.history.length).toBe(1); // Creation history event
    expect(savedTicket.history[0].action).toBe('created');
  });

  it('should fail when required fields are missing', async () => {
    const invalidTicket = new Ticket({
      title: 'Invalid Ticket' // Missing description and contact
    });

    let error;
    try {
      await invalidTicket.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe('ValidationError');
  });

  it('should validate status enum values', async () => {
    const ticket = new Ticket({
      title: 'Status Test',
      description: 'Testing status enum validation',
      contact: {
        name: 'Test User',
        info: 'test@example.com'
      },
      status: 'invalid-status' // Invalid status value
    });

    let error;
    try {
      await ticket.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.name).toBe('ValidationError');
    expect(error.message).toContain('status');
  });

  it('should update timestamps on save', async () => {
    const ticket = new Ticket({
      title: 'Timestamp Test',
      description: 'Testing timestamp updates',
      contact: {
        name: 'Test User',
        info: 'test@example.com'
      }
    });

    const savedTicket = await ticket.save();
    const originalCreatedAt = savedTicket.createdAt;
    const originalUpdatedAt = savedTicket.updatedAt;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update and save the ticket
    savedTicket.title = 'Updated Timestamp Test';
    await savedTicket.save();

    // Check timestamps
    expect(savedTicket.createdAt.getTime()).toBe(originalCreatedAt.getTime()); // Should remain the same
    expect(savedTicket.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime()); // Should be updated
  });

  it('should add history entry on creation', async () => {
    const ticket = new Ticket({
      title: 'History Test',
      description: 'Testing history tracking',
      contact: {
        name: 'History User',
        info: 'history@example.com'
      }
    });

    const savedTicket = await ticket.save();
    
    expect(savedTicket.history.length).toBe(1);
    expect(savedTicket.history[0].action).toBe('created');
    expect(savedTicket.history[0].newValue.title).toBe('History Test');
    expect(savedTicket.history[0].newValue.description).toBe('Testing history tracking');
    expect(savedTicket.history[0].newValue.contact.name).toBe('History User');
    expect(savedTicket.history[0].newValue.status).toBe('pending');
  });
});