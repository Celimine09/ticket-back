const mongoose = require('mongoose');
const ticketController = require('../../src/controllers/ticketController');
const Ticket = require('../../src/models/ticketModel');

// Mock request and response objects
const mockRequest = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Ticket Controller Test', () => {
  beforeEach(async () => {
    await Ticket.deleteMany({});
  });

  describe('createTicket', () => {
    it('should create a new ticket successfully', async () => {
      const req = mockRequest({
        title: 'Test Ticket',
        description: 'Test Description',
        contactName: 'John Doe',
        contactInfo: 'john@example.com'
      });
      const res = mockResponse();

      await ticketController.createTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      
      // Check the response data
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.title).toBe('Test Ticket');
      expect(responseData.description).toBe('Test Description');
      expect(responseData.contact.name).toBe('John Doe');
      expect(responseData.contact.info).toBe('john@example.com');
      expect(responseData.status).toBe('pending');
    });

    it('should return 400 when required fields are missing', async () => {
      // Missing description
      const req = mockRequest({
        title: 'Incomplete Ticket',
        contactName: 'John Doe',
        contactInfo: 'john@example.com'
      });
      const res = mockResponse();

      await ticketController.createTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getTickets', () => {
    beforeEach(async () => {
      // Create some test tickets
      await Ticket.create([
        {
          title: 'Pending Ticket',
          description: 'This is a pending ticket',
          contact: { name: 'User 1', info: 'user1@example.com' },
          status: 'pending',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01')
        },
        {
          title: 'Resolved Ticket',
          description: 'This is a resolved ticket',
          contact: { name: 'User 2', info: 'user2@example.com' },
          status: 'resolved',
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-03')
        },
        {
          title: 'Another Pending',
          description: 'Another pending ticket',
          contact: { name: 'User 3', info: 'user3@example.com' },
          status: 'pending',
          createdAt: new Date('2023-01-04'),
          updatedAt: new Date('2023-01-04')
        }
      ]);
    });

    it('should get all tickets without filters', async () => {
      const req = mockRequest(null, null, {});
      const res = mockResponse();

      await ticketController.getTickets(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const tickets = res.json.mock.calls[0][0];
      expect(tickets.length).toBe(3);
    });

    it('should filter tickets by status', async () => {
      const req = mockRequest(null, null, { status: 'pending' });
      const res = mockResponse();

      await ticketController.getTickets(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const tickets = res.json.mock.calls[0][0];
      expect(tickets.length).toBe(2);
      expect(tickets.every(t => t.status === 'pending')).toBe(true);
    });

    it('should sort tickets by createdAt by default', async () => {
      const req = mockRequest(null, null, {});
      const res = mockResponse();

      await ticketController.getTickets(req, res);

      const tickets = res.json.mock.calls[0][0];
      // Default sort is { createdAt: -1 } (newest first)
      expect(new Date(tickets[0].createdAt).getTime()).toBeGreaterThan(
        new Date(tickets[tickets.length - 1].createdAt).getTime()
      );
    });

    it('should sort tickets by updatedAt when sort=latest', async () => {
      const req = mockRequest(null, null, { sort: 'latest' });
      const res = mockResponse();

      await ticketController.getTickets(req, res);

      const tickets = res.json.mock.calls[0][0];
      // For 'latest' sort order is { updatedAt: -1 }
      expect(new Date(tickets[0].updatedAt).getTime()).toBeGreaterThan(
        new Date(tickets[tickets.length - 1].updatedAt).getTime()
      );
    });
  });

  describe('getTicketById', () => {
    let testTicketId;

    beforeEach(async () => {
      // Create a test ticket
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'This is a test ticket',
        contact: { name: 'Test User', info: 'test@example.com' },
        status: 'pending'
      });
      testTicketId = ticket._id.toString();
    });

    it('should get a ticket by ID', async () => {
      const req = mockRequest(null, { id: testTicketId });
      const res = mockResponse();

      await ticketController.getTicketById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const ticket = res.json.mock.calls[0][0];
      expect(ticket._id.toString()).toBe(testTicketId);
      expect(ticket.title).toBe('Test Ticket');
    });

    it('should return 404 for non-existent ticket ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
      const req = mockRequest(null, { id: nonExistentId });
      const res = mockResponse();

      await ticketController.getTicketById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Ticket not found'
        })
      );
    });

    it('should handle invalid ID format', async () => {
      const req = mockRequest(null, { id: 'invalid-id' });
      const res = mockResponse();

      await ticketController.getTicketById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String)
        })
      );
    });
  });

  describe('updateTicket', () => {
    let testTicketId;

    beforeEach(async () => {
      // Create a test ticket
      const ticket = await Ticket.create({
        title: 'Original Title',
        description: 'Original Description',
        contact: { name: 'Original User', info: 'original@example.com' },
        status: 'pending'
      });
      testTicketId = ticket._id.toString();
    });

    it('should update ticket information', async () => {
      const req = mockRequest(
        { 
          title: 'Updated Title',
          description: 'Updated Description'
        }, 
        { id: testTicketId }
      );
      const res = mockResponse();

      await ticketController.updateTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedTicket = res.json.mock.calls[0][0];
      expect(updatedTicket.title).toBe('Updated Title');
      expect(updatedTicket.description).toBe('Updated Description');
      expect(updatedTicket.status).toBe('pending'); // Status should remain the same
      
      // Check history entry for information update
      const infoUpdateEntry = updatedTicket.history.find(
        h => h.action === 'information_updated'
      );
      expect(infoUpdateEntry).toBeDefined();
      expect(infoUpdateEntry.oldValue.title).toBe('Original Title');
      expect(infoUpdateEntry.newValue.title).toBe('Updated Title');
    });

    it('should update ticket status', async () => {
      const req = mockRequest(
        { status: 'resolved' }, 
        { id: testTicketId }
      );
      const res = mockResponse();

      await ticketController.updateTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedTicket = res.json.mock.calls[0][0];
      expect(updatedTicket.status).toBe('resolved');
      
      // Check history entry for status update
      const statusUpdateEntry = updatedTicket.history.find(
        h => h.action === 'status_updated'
      );
      expect(statusUpdateEntry).toBeDefined();
      expect(statusUpdateEntry.oldValue.status).toBe('pending');
      expect(statusUpdateEntry.newValue.status).toBe('resolved');
    });

    it('should update contact information', async () => {
      const req = mockRequest(
        { 
          contactName: 'New User',
          contactInfo: 'new@example.com'
        }, 
        { id: testTicketId }
      );
      const res = mockResponse();

      await ticketController.updateTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const updatedTicket = res.json.mock.calls[0][0];
      expect(updatedTicket.contact.name).toBe('New User');
      expect(updatedTicket.contact.info).toBe('new@example.com');
      
      // Check history entry for information update
      const infoUpdateEntry = updatedTicket.history.find(
        h => h.action === 'information_updated'
      );
      expect(infoUpdateEntry).toBeDefined();
      expect(infoUpdateEntry.oldValue.contact.name).toBe('Original User');
      expect(infoUpdateEntry.newValue.contact.name).toBe('New User');
    });

    it('should return 404 for non-existent ticket', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
      const req = mockRequest(
        { title: 'Updated Title' }, 
        { id: nonExistentId }
      );
      const res = mockResponse();

      await ticketController.updateTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String)
        })
      );
    });

    it('should not update if no changes are provided', async () => {
      const req = mockRequest({}, { id: testTicketId });
      const res = mockResponse();

      await ticketController.updateTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      // Verify no history entries were added for information or status updates
      const updatedTicket = res.json.mock.calls[0][0];
      const updatedEntries = updatedTicket.history.filter(h => 
        h.action === 'information_updated' || h.action === 'status_updated'
      );
      expect(updatedEntries.length).toBe(0);
    });
  });
});