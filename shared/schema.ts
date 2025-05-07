import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['gardener', 'manager', 'committee']);
export const applicationStatusEnum = pgEnum('application_status', ['pending', 'approved', 'rejected']);
export const plotStatusEnum = pgEnum('plot_status', ['available', 'assigned', 'paid', 'unavailable']);
export const workDayAttendanceEnum = pgEnum('work_day_attendance', ['signed_up', 'attended', 'missed']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'overdue']);
export const gardenerTypeEnum = pgEnum('gardener_type', ['new', 'returning']);
export const notificationTypeEnum = pgEnum('notification_type', ['event', 'work_day', 'payment', 'weather', 'maintenance', 'application']);
export const notificationPriorityEnum = pgEnum('notification_priority', ['low', 'medium', 'high', 'urgent']);
export const notificationStatusEnum = pgEnum('notification_status', ['unread', 'read', 'archived']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  address: text("address"),
  role: userRoleEnum("role").notNull().default('gardener'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Plots table
export const plots = pgTable("plots", {
  id: serial("id").primaryKey(),
  plotNumber: text("plot_number").notNull().unique(),
  status: plotStatusEnum("status").notNull().default('available'),
  area: text("area").notNull(),
  size: text("size").notNull(),
  yearlyFee: integer("yearly_fee").notNull(),
  notes: text("notes"),
  assignedTo: integer("assigned_to").references(() => users.id),
});

// Applications table
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  status: applicationStatusEnum("status").notNull().default('pending'),
  gardenerType: gardenerTypeEnum("gardener_type").notNull(),
  preferredArea: text("preferred_area"),
  specialRequests: text("special_requests"),
  gardeningExperience: text("gardening_experience"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
  priority: integer("priority").default(0),
});

// Work days table
export const workDays = pgTable("work_days", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  maxAttendees: integer("max_attendees"),
  createdBy: integer("created_by").references(() => users.id),
});

// Work day attendance table
export const workDayAttendance = pgTable("work_day_attendance", {
  id: serial("id").primaryKey(),
  workDayId: integer("work_day_id").notNull().references(() => workDays.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: workDayAttendanceEnum("status").notNull().default('signed_up'),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  plotId: integer("plot_id").notNull().references(() => plots.id),
  amount: integer("amount").notNull(),
  status: paymentStatusEnum("status").notNull().default('pending'),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
});

// Forum questions table
export const forumQuestions = pgTable("forum_questions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Forum answers table
export const forumAnswers = pgTable("forum_answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => forumQuestions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").references(() => users.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isGlobal: boolean("is_global").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").notNull(),
  priority: notificationPriorityEnum("priority").notNull().default('medium'),
  status: notificationStatusEnum("status").notNull().default('unread'),
  userId: integer("user_id").references(() => users.id),
  isGlobal: boolean("is_global").default(false),
  relatedEntityType: text("related_entity_type"), // 'plot', 'work_day', 'payment', etc.
  relatedEntityId: integer("related_entity_id"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
  actionLink: text("action_link"),
});

// Garden events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location"),
  createdBy: integer("created_by").references(() => users.id),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPlotSchema = createInsertSchema(plots).omit({ id: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, submittedAt: true, processedAt: true });
export const insertWorkDaySchema = createInsertSchema(workDays).omit({ id: true });
export const insertWorkDayAttendanceSchema = createInsertSchema(workDayAttendance).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, paidDate: true });
export const insertForumQuestionSchema = createInsertSchema(forumQuestions).omit({ id: true, createdAt: true });
export const insertForumAnswerSchema = createInsertSchema(forumAnswers).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, readAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, readAt: true });

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Plot = typeof plots.$inferSelect;
export type InsertPlot = z.infer<typeof insertPlotSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type WorkDay = typeof workDays.$inferSelect;
export type InsertWorkDay = z.infer<typeof insertWorkDaySchema>;
export type WorkDayAttendance = typeof workDayAttendance.$inferSelect;
export type InsertWorkDayAttendance = z.infer<typeof insertWorkDayAttendanceSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type ForumQuestion = typeof forumQuestions.$inferSelect;
export type InsertForumQuestion = z.infer<typeof insertForumQuestionSchema>;
export type ForumAnswer = typeof forumAnswers.$inferSelect;
export type InsertForumAnswer = z.infer<typeof insertForumAnswerSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Login = z.infer<typeof loginSchema>;
