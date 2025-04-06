
// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member' | 'client';
  createdAt: Date;
  organizationId?: string;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: Address;
  taxId?: string;
  currency?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  plan: 'free' | 'pro' | 'business';
  settings: OrganizationSettings;
}

export interface OrganizationSettings {
  allowClientInvites: boolean;
  allowTeamInvites: boolean;
  defaultTaskView: 'list' | 'board' | 'calendar';
  color: string;
}

// Team types
export interface TeamMember {
  id: string;
  userId: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'member';
  invitedBy: string;
  invitedAt: Date;
  joinedAt?: Date;
  status: 'invited' | 'active' | 'inactive';
  permissions: string[];
}

export interface Invite {
  id: string;
  email: string;
  organizationId: string;
  role: 'admin' | 'member' | 'client';
  invitedBy: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'declined';
  token: string;
  expiresAt: Date;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'done' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  createdById: string;
  organizationId: string;
  clientId?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  attachments?: Attachment[];
}

// Chat types
export interface ChatRoom {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'client';
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
}

export interface ChatParticipant {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  readBy: string[];
  attachments?: Attachment[];
}

// Invoicing types
export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  organizationId: string;
  createdById: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  subTotal: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// Client types
export interface Client {
  id: string;
  name: string;
  organizationId: string;
  email: string;
  phone?: string;
  address?: Address;
  contactPerson?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive';
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  data?: any;
  link?: string;
}

// Shared types
export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: Date;
}
