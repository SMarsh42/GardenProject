// User types
export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "manager" | "committee" | "gardener";
  createdAt: string;
}

// Plot types
export interface Plot {
  id: number;
  plotNumber: string;
  size: string;
  status: "available" | "occupied" | "maintenance";
  userId?: number;
  notes?: string;
}

// Application types
export interface Application {
  id: number;
  userId: number;
  plotId?: number;
  status: "pending" | "approved" | "rejected";
  applicationType: "new" | "returning";
  priority: "standard" | "high";
  appliedDate: string;
  notes?: string;
}

// Payment types
export interface Payment {
  id: number;
  userId: number;
  plotId: number;
  amount: number;
  paymentDate: string;
  paymentType: "cash" | "check" | "online";
  notes?: string;
}

// Work Day types
export interface WorkDay {
  id: number;
  title: string;
  date: string;
  description?: string;
  maxAttendees?: number;
}

export interface WorkDayAttendee {
  id: number;
  workDayId: number;
  userId: number;
  attended: boolean;
}

// Forum types
export interface ForumCategory {
  id: number;
  name: string;
  description?: string;
}

export interface ForumTopic {
  id: number;
  title: string;
  content: string;
  userId: number;
  categoryId: number;
  createdAt: string;
  // Virtual properties
  author?: User;
  replyCount?: number;
}

export interface ForumReply {
  id: number;
  content: string;
  userId: number;
  topicId: number;
  createdAt: string;
  // Virtual properties
  author?: User;
}
