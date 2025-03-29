# Ticketing System - Full Stack Application
This repository contains a full-stack helpdesk support ticket management application with a RESTful API backend and a SPA-styled frontend.
Project Overview

## The application allows users to:
- Create new support tickets with title, description, and contact information
- View and update ticket information and status (pending, accepted, resolved, rejected)
- Filter and sort tickets by various parameters
- Visualize tickets in a Kanban board view
- View analytics and reports on ticket data

![Screenshot](/ex.png)

## Backend
- **Framework**: Express
- **DB**: MongoDB with Mongoose 

## API Endpoints Tickets
- **GET /api/tickets** - Get all tickets (with optional filtering)
- **GET /api/tickets/:id** - Get a specific ticket by ID
- **POST /api/tickets** - Create a new ticket
- **PUT /api/tickets/:id** - Update a ticket

# Features
## Ticket Management

- Create new tickets with detailed information
- View and filter tickets based on various parameters
- Update ticket status and information
- Track ticket history

## Kanban Board

- Visualize tickets in a Kanban-style board
- Drag and drop tickets to change status
- Quick view of ticket distribution by status

## Analytics

- View statistical data on tickets
- Track resolution rates and response times
- Visualize ticket trends over time

## Testing
The backend includes comprehensive test coverage using Jest:

- Unit tests for models, controllers, and routes
- Integration tests for API endpoints
- Mock database tests using MongoDB Memory Server
![Screenshot](/test.png)
