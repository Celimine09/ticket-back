const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const ticketRoutes = require('../../src/routes/ticketRoutes');
const Ticket = require('../../src/models/ticketModel');

describe('Ticket Routes Test', () => {
  let app;

  beforeAll(() => {
    // Set up Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/tickets', ticketRoutes);
  });

  beforeEach(async () => {
    await Ticket.deleteMany({});
  });

  describe('POST /api/tickets', () => {
    it('should create a new ticket', async () => {
      const ticketData = {
        title: 'Test Ticket',
        description: 'This is a test ticket',
        contactName: 'John Doe',
        contactInfo: 'john@example.com'
      };

      const response = await request(app)
        .post('/api/tickets')
        .send(ticketData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Check response data
      expect(response.body._id).toBeDefined();
      expect(response.body.title).toBe(ticketData.title);
      expect(response.body.description).toBe(ticketData.description);
      expect(response.body.contact.name).toBe(ticketData.contactName);
      expect(response.body.contact.info).toBe(ticketData.contactInfo);
      expect(response.body.status).toBe('pending');

      // Verify ticket was saved to database
      const savedTicket = await Ticket.findById(response.body._id);
      expect(savedTicket).toBeTruthy();
      expect(savedTicket.title).toBe(ticketData.title);
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidData = {
        title: 'Incomplete Ticket'
        // Missing description, contactName, contactInfo
      };

      await request(app)
        .post('/api/tickets')
        .send(invalidData)
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });

  describe('GET /api/tickets', () => {
    beforeEach(async () => {
      // Create test tickets
      await Ticket.create([
        {
          title: 'Ticket 1',
          description: 'First ticket description',
          contact: { name: 'User 1', info: 'user1@example.com' },
          status: 'pending'
        },
        {
          title: 'Ticket 2',
          description: 'Second ticket description',
          contact: { name: 'User 2', info: 'user2@example.com' },
          status: 'resolved'
        },
        {
          title: 'Ticket 3',
          description: 'Third ticket description',
          contact: { name: 'User 3', info: 'user3@example.com' },
          status: 'pending'
        }
      ]);
    });

    it('should get all tickets', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.length).toBe(3);
    });

    it('should filter tickets by status', async () => {
      const response = await request(app)
        .get('/api/tickets?status=pending')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body.every(t => t.status === 'pending')).toBe(true);
    });

    it('should sort tickets', async () => {
      // Update one ticket to have a more recent updated date
      const ticket = await Ticket.findOne({ title: 'Ticket 1' });
      ticket.description = 'Updated description';
      await ticket.save();

      const response = await request(app)
        .get('/api/tickets?sort=latest')
        .expect('Content-Type', /json/)
        .expect(200);

      // First ticket should be the recently updated one
      expect(response.body[0].title).toBe('Ticket 1');
    });
  });

  describe('GET /api/tickets/:id', () => {
    let testTicketId;

    beforeEach(async () => {
      // Create a test ticket
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'Test ticket description',
        contact: { name: 'Test User', info: 'test@example.com' },
        status: 'pending'
      });
      testTicketId = ticket._id.toString();
    });

    it('should get a ticket by ID', async () => {
      const response = await request(app)
        .get(`/api/tickets/${testTicketId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body._id).toBe(testTicketId);
      expect(response.body.title).toBe('Test Ticket');
    });

    it('should return 404 for non-existent ticket', async () => {
      const nonExistentId = mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/tickets/${nonExistentId}`)
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });

  describe('PUT /api/tickets/:id', () => {
    let testTicketId;

    beforeEach(async () => {
      // Create a test ticket
      const ticket = await Ticket.create({
        title: 'Original Title',
        description: 'Original description',
        contact: { name: 'Original User', info: 'original@example.com' },
        status: 'pending'
      });
      testTicketId = ticket._id.toString();
    });

    it('should update a ticket', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        status: 'resolved'
      };

      const response = await request(app)
        .put(`/api/tickets/${testTicketId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.status).toBe(updateData.status);

      // Verify changes were saved to database
      const updatedTicket = await Ticket.findById(testTicketId);
      expect(updatedTicket.title).toBe(updateData.title);
      expect(updatedTicket.status).toBe(updateData.status);
    });

    it('should update contact information', async () => {
      const updateData = {
        contactName: 'New User',
        contactInfo: 'new@example.com'
      };

      const response = await request(app)
        .put(`/api/tickets/${testTicketId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.contact.name).toBe(updateData.contactName);
      expect(response.body.contact.info).toBe(updateData.contactInfo);

      // Verify changes were saved to database
      const updatedTicket = await Ticket.findById(testTicketId);
      expect(updatedTicket.contact.name).toBe(updateData.contactName);
      expect(updatedTicket.contact.info).toBe(updateData.contactInfo);
    });

    it('should return 404 for non-existent ticket', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { title: 'Updated Title' };

      await request(app)
        .put(`/api/tickets/${nonExistentId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('should track history when updating status', async () => {
      const updateData = { status: 'resolved' };

      const response = await request(app)
        .put(`/api/tickets/${testTicketId}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      // Find the status update history entry
      const statusUpdateEntry = response.body.history.find(
        h => h.action === 'status_updated'
      );
      
      expect(statusUpdateEntry).toBeDefined();
      expect(statusUpdateEntry.oldValue.status).toBe('pending');
      expect(statusUpdateEntry.newValue.status).toBe('resolved');

      // Verify history was saved to database
      const updatedTicket = await Ticket.findById(testTicketId);
      const dbStatusUpdateEntry = updatedTicket.history.find(
        h => h.action === 'status_updated'
      );
      expect(dbStatusUpdateEntry).toBeTruthy();
    });
  });
});