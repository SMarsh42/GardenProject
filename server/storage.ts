import {
  User, InsertUser,
  Plot, InsertPlot,
  Application, InsertApplication,
  WorkDay, InsertWorkDay,
  WorkDayAttendance, InsertWorkDayAttendance,
  Payment, InsertPayment,
  ForumQuestion, InsertForumQuestion,
  ForumAnswer, InsertForumAnswer,
  Message, InsertMessage,
  Event, InsertEvent,
  Notification, InsertNotification
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Plot methods
  getPlots(): Promise<Plot[]>;
  getPlot(id: number): Promise<Plot | undefined>;
  getPlotByNumber(plotNumber: string): Promise<Plot | undefined>;
  createPlot(plot: InsertPlot): Promise<Plot>;
  updatePlot(id: number, plot: Partial<Plot>): Promise<Plot | undefined>;
  
  // Application methods
  getApplications(): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  getUserApplications(userId: number): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, application: Partial<Application>): Promise<Application | undefined>;
  
  // Work day methods
  getWorkDays(): Promise<WorkDay[]>;
  getWorkDay(id: number): Promise<WorkDay | undefined>;
  createWorkDay(workDay: InsertWorkDay): Promise<WorkDay>;
  updateWorkDay(id: number, workDay: Partial<WorkDay>): Promise<WorkDay | undefined>;
  
  // Work day attendance methods
  getWorkDayAttendances(workDayId: number): Promise<WorkDayAttendance[]>;
  getUserWorkDayAttendances(userId: number): Promise<WorkDayAttendance[]>;
  createWorkDayAttendance(attendance: InsertWorkDayAttendance): Promise<WorkDayAttendance>;
  updateWorkDayAttendance(id: number, attendance: Partial<WorkDayAttendance>): Promise<WorkDayAttendance | undefined>;
  
  // Payment methods
  getPayments(): Promise<Payment[]>;
  getUserPayments(userId: number): Promise<Payment[]>;
  getPlotPayments(plotId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined>;
  
  // Forum methods
  getForumQuestions(): Promise<ForumQuestion[]>;
  getForumQuestion(id: number): Promise<ForumQuestion | undefined>;
  createForumQuestion(question: InsertForumQuestion): Promise<ForumQuestion>;
  
  getForumAnswers(questionId: number): Promise<ForumAnswer[]>;
  createForumAnswer(answer: InsertForumAnswer): Promise<ForumAnswer>;
  
  // Message methods
  getMessages(userId: number): Promise<Message[]>;
  getGlobalMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number, readAt: Date): Promise<Message | undefined>;
  
  // Event methods
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  
  // Notification methods
  getNotifications(userId: number): Promise<Notification[]>;
  getGlobalNotifications(): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, notification: Partial<Notification>): Promise<Notification | undefined>;
  markNotificationAsRead(id: number, readAt: Date): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number, readAt: Date): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private plots: Map<number, Plot>;
  private applications: Map<number, Application>;
  private workDays: Map<number, WorkDay>;
  private workDayAttendances: Map<number, WorkDayAttendance>;
  private payments: Map<number, Payment>;
  private forumQuestions: Map<number, ForumQuestion>;
  private forumAnswers: Map<number, ForumAnswer>;
  private messages: Map<number, Message>;
  private events: Map<number, Event>;
  private notifications: Map<number, Notification>;
  
  currentIds: {
    user: number;
    plot: number;
    application: number;
    workDay: number;
    workDayAttendance: number;
    payment: number;
    forumQuestion: number;
    forumAnswer: number;
    message: number;
    event: number;
    notification: number;
  };

  constructor() {
    this.users = new Map();
    this.plots = new Map();
    this.applications = new Map();
    this.workDays = new Map();
    this.workDayAttendances = new Map();
    this.payments = new Map();
    this.forumQuestions = new Map();
    this.forumAnswers = new Map();
    this.messages = new Map();
    this.events = new Map();
    this.notifications = new Map();
    
    this.currentIds = {
      user: 1,
      plot: 1,
      application: 1,
      workDay: 1,
      workDayAttendance: 1,
      payment: 1,
      forumQuestion: 1,
      forumAnswer: 1,
      message: 1,
      event: 1,
      notification: 1
    };
    
    // Seed some initial data for testing
    this.seedInitialData();
  }
  
  private seedInitialData() {
    // Create a garden manager
    const managerUser: InsertUser = {
      username: "manager",
      password: "password123",
      email: "manager@garden.com",
      firstName: "Maria",
      lastName: "Johnson",
      role: "manager",
      phone: "555-123-4567",
      address: "123 Garden Ave"
    };
    this.createUser(managerUser);
    
    // Create some garden plots
    const plotAreas = ["A", "B", "C", "D", "E", "F"];
    for (let area of plotAreas) {
      for (let i = 1; i <= 8; i++) {
        const plotNumber = `${area}${i}`;
        const status = Math.random() > 0.7 ? "available" : 
                      Math.random() > 0.5 ? "assigned" : 
                      Math.random() > 0.5 ? "paid" : "unavailable";
        
        this.createPlot({
          plotNumber,
          status,
          area,
          size: "10x10",
          yearlyFee: 50,
          notes: `Plot ${plotNumber} in area ${area}`,
          assignedTo: status === "available" || status === "unavailable" ? null : 1
        });
      }
    }
    
    // Create some work days
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    this.createWorkDay({
      title: "Spring Clean-up Work Day",
      description: "Help prepare the garden for spring planting. Bring gloves and tools if you have them.",
      date: new Date(today.getFullYear(), 3, 22), // April 22
      startTime: "9:00 AM",
      endTime: "1:00 PM",
      maxAttendees: 40,
      createdBy: 1
    });
    
    this.createWorkDay({
      title: "Committee Meeting",
      description: "Monthly committee meeting to discuss garden operations.",
      date: new Date(today.getFullYear(), 4, 5), // May 5
      startTime: "6:30 PM",
      endTime: "8:00 PM",
      maxAttendees: 10,
      createdBy: 1
    });
    
    this.createWorkDay({
      title: "Garden Workshop: Companion Planting",
      description: "Learn about companion planting techniques to maximize your garden's productivity.",
      date: new Date(today.getFullYear(), 4, 20), // May 20
      startTime: "10:00 AM",
      endTime: "11:30 AM",
      maxAttendees: 20,
      createdBy: 1
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }
  
  // Plot methods
  async getPlots(): Promise<Plot[]> {
    return Array.from(this.plots.values());
  }
  
  async getPlot(id: number): Promise<Plot | undefined> {
    return this.plots.get(id);
  }
  
  async getPlotByNumber(plotNumber: string): Promise<Plot | undefined> {
    return Array.from(this.plots.values()).find(plot => plot.plotNumber === plotNumber);
  }
  
  async createPlot(insertPlot: InsertPlot): Promise<Plot> {
    const id = this.currentIds.plot++;
    const plot: Plot = { ...insertPlot, id };
    this.plots.set(id, plot);
    return plot;
  }
  
  async updatePlot(id: number, plotUpdate: Partial<Plot>): Promise<Plot | undefined> {
    const plot = this.plots.get(id);
    if (!plot) return undefined;
    
    const updatedPlot = { ...plot, ...plotUpdate };
    this.plots.set(id, updatedPlot);
    return updatedPlot;
  }
  
  // Application methods
  async getApplications(): Promise<Application[]> {
    return Array.from(this.applications.values());
  }
  
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }
  
  async getUserApplications(userId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(app => app.userId === userId);
  }
  
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.currentIds.application++;
    const submittedAt = new Date();
    const application: Application = { ...insertApplication, id, submittedAt, processedAt: null };
    this.applications.set(id, application);
    return application;
  }
  
  async updateApplication(id: number, applicationUpdate: Partial<Application>): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, ...applicationUpdate };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  // Work day methods
  async getWorkDays(): Promise<WorkDay[]> {
    return Array.from(this.workDays.values());
  }
  
  async getWorkDay(id: number): Promise<WorkDay | undefined> {
    return this.workDays.get(id);
  }
  
  async createWorkDay(insertWorkDay: InsertWorkDay): Promise<WorkDay> {
    const id = this.currentIds.workDay++;
    const workDay: WorkDay = { ...insertWorkDay, id };
    this.workDays.set(id, workDay);
    return workDay;
  }
  
  async updateWorkDay(id: number, workDayUpdate: Partial<WorkDay>): Promise<WorkDay | undefined> {
    const workDay = this.workDays.get(id);
    if (!workDay) return undefined;
    
    const updatedWorkDay = { ...workDay, ...workDayUpdate };
    this.workDays.set(id, updatedWorkDay);
    return updatedWorkDay;
  }
  
  // Work day attendance methods
  async getWorkDayAttendances(workDayId: number): Promise<WorkDayAttendance[]> {
    return Array.from(this.workDayAttendances.values()).filter(att => att.workDayId === workDayId);
  }
  
  async getUserWorkDayAttendances(userId: number): Promise<WorkDayAttendance[]> {
    return Array.from(this.workDayAttendances.values()).filter(att => att.userId === userId);
  }
  
  async createWorkDayAttendance(insertAttendance: InsertWorkDayAttendance): Promise<WorkDayAttendance> {
    const id = this.currentIds.workDayAttendance++;
    const attendance: WorkDayAttendance = { ...insertAttendance, id };
    this.workDayAttendances.set(id, attendance);
    return attendance;
  }
  
  async updateWorkDayAttendance(id: number, attendanceUpdate: Partial<WorkDayAttendance>): Promise<WorkDayAttendance | undefined> {
    const attendance = this.workDayAttendances.get(id);
    if (!attendance) return undefined;
    
    const updatedAttendance = { ...attendance, ...attendanceUpdate };
    this.workDayAttendances.set(id, updatedAttendance);
    return updatedAttendance;
  }
  
  // Payment methods
  async getPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }
  
  async getUserPayments(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.userId === userId);
  }
  
  async getPlotPayments(plotId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.plotId === plotId);
  }
  
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.currentIds.payment++;
    const payment: Payment = { ...insertPayment, id, paidDate: null };
    this.payments.set(id, payment);
    return payment;
  }
  
  async updatePayment(id: number, paymentUpdate: Partial<Payment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...paymentUpdate };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }
  
  // Forum methods
  async getForumQuestions(): Promise<ForumQuestion[]> {
    return Array.from(this.forumQuestions.values());
  }
  
  async getForumQuestion(id: number): Promise<ForumQuestion | undefined> {
    return this.forumQuestions.get(id);
  }
  
  async createForumQuestion(insertQuestion: InsertForumQuestion): Promise<ForumQuestion> {
    const id = this.currentIds.forumQuestion++;
    const createdAt = new Date();
    const question: ForumQuestion = { ...insertQuestion, id, createdAt };
    this.forumQuestions.set(id, question);
    return question;
  }
  
  async getForumAnswers(questionId: number): Promise<ForumAnswer[]> {
    return Array.from(this.forumAnswers.values()).filter(answer => answer.questionId === questionId);
  }
  
  async createForumAnswer(insertAnswer: InsertForumAnswer): Promise<ForumAnswer> {
    const id = this.currentIds.forumAnswer++;
    const createdAt = new Date();
    const answer: ForumAnswer = { ...insertAnswer, id, createdAt };
    this.forumAnswers.set(id, answer);
    return answer;
  }
  
  // Message methods
  async getMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      message => message.recipientId === userId || message.isGlobal
    );
  }
  
  async getGlobalMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(message => message.isGlobal);
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentIds.message++;
    const createdAt = new Date();
    const message: Message = { ...insertMessage, id, createdAt, readAt: null };
    this.messages.set(id, message);
    return message;
  }
  
  async markMessageAsRead(id: number, readAt: Date): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, readAt };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  // Event methods
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentIds.event++;
    const event: Event = { ...insertEvent, id };
    this.events.set(id, event);
    return event;
  }
  
  async updateEvent(id: number, eventUpdate: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventUpdate };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  // Notification methods
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      notification => notification.userId === userId || notification.isGlobal
    );
  }

  async getGlobalNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(notification => notification.isGlobal);
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const userNotifications = await this.getNotifications(userId);
    return userNotifications.filter(notification => notification.status === 'unread').length;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentIds.notification++;
    const createdAt = new Date();
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      createdAt, 
      readAt: null 
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async updateNotification(id: number, notificationUpdate: Partial<Notification>): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, ...notificationUpdate };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markNotificationAsRead(id: number, readAt: Date): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, readAt, status: 'read' as const };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number, readAt: Date): Promise<boolean> {
    const userNotifications = await this.getNotifications(userId);
    for (const notification of userNotifications) {
      if (notification.status === 'unread') {
        await this.markNotificationAsRead(notification.id, readAt);
      }
    }
    return true;
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }
}

export const storage = new MemStorage();
