import SupportTicket from '../../models/SupportTicket.js';
import { getNextSequence } from '../../services/counterService.js';

// @desc    Create a new support ticket
// @route   POST /api/v1/support/tickets or /api/tickets
// @access  Private
export const createTicket = async (req, res) => {
  try {
    const { subject, category = 'General', priority = 'MEDIUM', message, attachments } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and initial message are required' });
    }

    const ticketNumber = await getNextSequence('tickets', 'TCK');

    const ticket = await SupportTicket.create({
      ticketNumber,
      createdBy: req.user._id,
      subject,
      category,
      priority,
      status: 'OPEN',
      messages: [{
        senderId: req.user._id,
        message,
        attachments: attachments || []
      }]
    });

    res.status(201).json({ success: true, message: 'Support ticket created', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get support tickets
// @route   GET /api/v1/support/tickets or /api/tickets
// @access  Private
export const getTickets = async (req, res) => {
  try {
    const query = req.user.role === 'SUPER_ADMIN' ? {} : { createdBy: req.user._id };
    const tickets = await SupportTicket.find(query)
      .populate('createdBy', 'name mobile role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get ticket by ID
// @route   GET /api/v1/support/tickets/:id or /api/tickets/:id
// @access  Private
export const getTicketById = async (req, res) => {
  try {
    const query = req.user.role === 'SUPER_ADMIN' 
      ? { _id: req.params.id } 
      : { _id: req.params.id, createdBy: req.user._id };

    const ticket = await SupportTicket.findOne(query)
      .populate('createdBy', 'name mobile role')
      .populate('messages.senderId', 'name role');

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add reply message to ticket thread
// @route   POST /api/v1/support/tickets/:id/messages or /api/tickets/:id/reply
// @access  Private
export const replyTicket = async (req, res) => {
  try {
    const { message, attachments } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message cannot be empty' });

    const query = req.user.role === 'SUPER_ADMIN' 
      ? { _id: req.params.id } 
      : { _id: req.params.id, createdBy: req.user._id };

    const ticket = await SupportTicket.findOne(query);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    ticket.messages.push({
      senderId: req.user._id,
      message,
      attachments: attachments || [],
      createdAt: new Date()
    });

    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      ticket.status = 'IN_PROGRESS';
    }

    await ticket.save();
    res.json({ success: true, message: 'Reply sent', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve or close ticket
// @route   POST /api/v1/admin/support/tickets/:id/resolve
// @access  Private (SUPER_ADMIN)
export const resolveTicket = async (req, res) => {
  try {
    const { status = 'RESOLVED' } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    ticket.status = status;
    await ticket.save();

    res.json({ success: true, message: `Ticket marked as ${status}`, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
