export type TicketClass = 'REQUEST' | 'COMMENT' | 'COMPLAINT';
export type TicketStatus = 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';

export interface SupportTicket {
    id?: string;
    ticketId: string;
    ticketClass: TicketClass;
    fullName: string;
    email: string;
    userId?: string;
    message: string;
    status: TicketStatus;
    adminReply?: string;
    adminNotes?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: string;
    updatedAt?: string;
}
