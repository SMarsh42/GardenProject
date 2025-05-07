import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendEmail } from "./email";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import {
  insertUserSchema,
  insertApplicationSchema,
  insertWorkDaySchema,
  insertWorkDayAttendanceSchema,
  insertPaymentSchema,
  insertForumQuestionSchema,
  insertForumAnswerSchema,
  insertMessageSchema,
  insertEventSchema,
  insertNotificationSchema,
  loginSchema
} from "@shared/schema";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 24 hours
      store: new SessionStore({ checkPeriod: 86400000 }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "garden-management-secret",
    })
  );

  // Setup passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport configuration
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Invalid username or password" });
      }
      if (user.password !== password) {
        return done(null, false, { message: "Invalid username or password" });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const isManager = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated() && (req.user as any).role === "manager") {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  const isManagerOrCommittee = (req: Request, res: Response, next: any) => {
    if (
      req.isAuthenticated() && 
      ((req.user as any).role === "manager" || (req.user as any).role === "committee")
    ) {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // Auth routes
  app.post("/api/auth/login", (req, res, next) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: info.message });
        }
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.json({ 
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
          });
        });
      })(req, res, next);
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.get("/api/users", isManagerOrCommittee, async (req, res) => {
    const users = await storage.getUsers();
    // Filter out sensitive info
    const filteredUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role
    }));
    res.json(filteredUsers);
  });

  // Plot routes
  app.get("/api/plots", async (req, res) => {
    const plots = await storage.getPlots();
    res.json(plots);
  });

  app.get("/api/plots/:id", async (req, res) => {
    const plot = await storage.getPlot(parseInt(req.params.id));
    if (!plot) {
      return res.status(404).json({ message: "Plot not found" });
    }
    res.json(plot);
  });

  app.post("/api/plots", isManager, async (req, res) => {
    try {
      const plotData = insertWorkDaySchema.parse(req.body);
      const plot = await storage.createPlot(plotData);
      res.status(201).json(plot);
    } catch (error) {
      res.status(400).json({ message: "Invalid plot data" });
    }
  });

  app.put("/api/plots/:id", isManager, async (req, res) => {
    try {
      const plotId = parseInt(req.params.id);
      const plot = await storage.getPlot(plotId);
      if (!plot) {
        return res.status(404).json({ message: "Plot not found" });
      }
      
      const updatedPlot = await storage.updatePlot(plotId, req.body);
      res.json(updatedPlot);
    } catch (error) {
      res.status(400).json({ message: "Error updating plot" });
    }
  });

  // Application routes
  app.post("/api/applications", isAuthenticated, async (req, res) => {
    try {
      const applicationData = insertApplicationSchema.parse({
        ...req.body,
        userId: (req.user as any).id
      });
      
      const application = await storage.createApplication(applicationData);
      
      // If this is a returning gardener, calculate priority based on previous participation
      if (application.gardenerType === "returning") {
        // For demo purposes, just assigning a priority between 5-10 for returning gardeners
        const priority = Math.floor(Math.random() * 6) + 5;
        await storage.updateApplication(application.id, { priority });
      }
      
      res.status(201).json(application);
    } catch (error) {
      res.status(400).json({ message: "Invalid application data" });
    }
  });

  app.get("/api/applications", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    // Managers and committee members can see all applications
    if (user.role === "manager" || user.role === "committee") {
      const applications = await storage.getApplications();
      return res.json(applications);
    }
    
    // Regular gardeners can only see their own applications
    const applications = await storage.getUserApplications(user.id);
    res.json(applications);
  });

  app.get("/api/applications/:id", isAuthenticated, async (req, res) => {
    const applicationId = parseInt(req.params.id);
    const application = await storage.getApplication(applicationId);
    
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    const user = req.user as any;
    
    // Only allow access to the user's own applications or managers/committee
    if (
      application.userId !== user.id && 
      user.role !== "manager" && 
      user.role !== "committee"
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    res.json(application);
  });

  app.put("/api/applications/:id", isManagerOrCommittee, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // If changing status to 'approved', record who processed it and when
      if (req.body.status === "approved" && application.status !== "approved") {
        const updatedApplication = await storage.updateApplication(applicationId, {
          ...req.body,
          processedBy: (req.user as any).id,
          processedAt: new Date()
        });
        
        // Get the applicant details
        const applicant = await storage.getUser(application.userId);
        
        // If we have an applicant with email
        if (applicant && applicant.email) {
          // Send notification email
          await sendEmail({
            to: applicant.email,
            subject: "Your Garden Plot Application Has Been Approved",
            text: `Dear ${applicant.firstName},\n\nCongratulations! Your application for a garden plot has been approved. Please login to your account to view the plot assignment and make the required payment.\n\nThank you,\nCommunity Garden Management`
          });
        }
        
        return res.json(updatedApplication);
      }
      
      // For other status changes
      const updatedApplication = await storage.updateApplication(applicationId, req.body);
      res.json(updatedApplication);
    } catch (error) {
      res.status(400).json({ message: "Error updating application" });
    }
  });

  // Work day routes
  app.get("/api/workdays", async (req, res) => {
    const workDays = await storage.getWorkDays();
    res.json(workDays);
  });

  app.post("/api/workdays", isManagerOrCommittee, async (req, res) => {
    try {
      const workDayData = insertWorkDaySchema.parse({
        ...req.body,
        createdBy: (req.user as any).id
      });
      
      // Create the work day
      const workDay = await storage.createWorkDay(workDayData);
      
      // Create a notification for all users
      try {
        // Format date for notification message
        const date = new Date(workDay.date);
        const formattedDate = date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        });
        
        // Create a global notification for all users
        await storage.createNotification({
          title: 'New Work Day Scheduled',
          message: `A new work day has been scheduled: "${workDay.title}" on ${formattedDate} from ${workDay.startTime} to ${workDay.endTime}.`,
          type: 'work_day',
          priority: 'medium',
          status: 'unread',
          userId: null,
          isGlobal: true,
          relatedEntityType: 'work_day',
          relatedEntityId: workDay.id,
          createdAt: new Date(),
          readAt: null,
          expiresAt: null,
          actionLink: `/workdays/${workDay.id}`
        });
        
        // Get all users with email addresses for notifications
        const users = await storage.getUsers();
        
        // Attempt to send email notifications
        for (const user of users) {
          if (user.email) {
            try {
              // Import dynamically to avoid circular dependency
              const { sendWorkDayEmail } = await import('./notificationEmails');
              await sendWorkDayEmail(workDay, user).catch(e => console.error('Email error:', e));
            } catch (emailError) {
              console.error('Failed to send email notification to user:', user.id, emailError);
            }
          }
        }
        
      } catch (notificationError) {
        // Log error but don't fail the work day creation
        console.error('Error creating work day notification:', notificationError);
      }
      
      res.status(201).json(workDay);
    } catch (error) {
      res.status(400).json({ message: "Invalid work day data" });
    }
  });

  app.get("/api/workdays/:id", async (req, res) => {
    const workDayId = parseInt(req.params.id);
    const workDay = await storage.getWorkDay(workDayId);
    
    if (!workDay) {
      return res.status(404).json({ message: "Work day not found" });
    }
    
    res.json(workDay);
  });

  app.get("/api/workdays/:id/attendances", async (req, res) => {
    const workDayId = parseInt(req.params.id);
    const attendances = await storage.getWorkDayAttendances(workDayId);
    res.json(attendances);
  });

  app.post("/api/workdays/:id/attend", isAuthenticated, async (req, res) => {
    try {
      const workDayId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
      // Check if user already signed up
      const userAttendances = await storage.getUserWorkDayAttendances(userId);
      const alreadySignedUp = userAttendances.some(a => a.workDayId === workDayId);
      
      if (alreadySignedUp) {
        return res.status(400).json({ message: "Already signed up for this work day" });
      }
      
      const attendance = await storage.createWorkDayAttendance({
        workDayId,
        userId,
        status: "signed_up"
      });
      
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Error signing up for work day" });
    }
  });

  app.put("/api/workdays/:workDayId/attendances/:id", isManagerOrCommittee, async (req, res) => {
    try {
      const attendanceId = parseInt(req.params.id);
      const updatedAttendance = await storage.updateWorkDayAttendance(attendanceId, req.body);
      
      if (!updatedAttendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      
      res.json(updatedAttendance);
    } catch (error) {
      res.status(400).json({ message: "Error updating attendance" });
    }
  });

  // Payment routes
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    // Managers can see all payments
    if (user.role === "manager") {
      const payments = await storage.getPayments();
      return res.json(payments);
    }
    
    // Regular users can only see their own payments
    const payments = await storage.getUserPayments(user.id);
    res.json(payments);
  });

  app.post("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        userId: (req.user as any).id
      });
      
      const payment = await storage.createPayment(paymentData);
      
      // If payment status is set to 'paid', record the payment date
      if (payment.status === "paid") {
        await storage.updatePayment(payment.id, { paidDate: new Date() });
      }
      
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ message: "Invalid payment data" });
    }
  });

  app.put("/api/payments/:id", isAuthenticated, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const payment = await storage.getPayment(paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      const user = req.user as any;
      
      // Only allow managers or the payment owner to update payments
      if (payment.userId !== user.id && user.role !== "manager") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // If updating to 'paid' status, record the payment date
      if (req.body.status === "paid" && payment.status !== "paid") {
        req.body.paidDate = new Date();
      }
      
      const updatedPayment = await storage.updatePayment(paymentId, req.body);
      res.json(updatedPayment);
    } catch (error) {
      res.status(400).json({ message: "Error updating payment" });
    }
  });

  // Forum routes
  app.get("/api/forum", async (req, res) => {
    const questions = await storage.getForumQuestions();
    res.json(questions);
  });

  app.get("/api/forum/:id", async (req, res) => {
    const questionId = parseInt(req.params.id);
    const question = await storage.getForumQuestion(questionId);
    
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    const answers = await storage.getForumAnswers(questionId);
    
    res.json({
      question,
      answers
    });
  });

  app.post("/api/forum", isAuthenticated, async (req, res) => {
    try {
      const questionData = insertForumQuestionSchema.parse({
        ...req.body,
        userId: (req.user as any).id
      });
      
      const question = await storage.createForumQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data" });
    }
  });

  app.post("/api/forum/:id/answers", isAuthenticated, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const question = await storage.getForumQuestion(questionId);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      const answerData = insertForumAnswerSchema.parse({
        ...req.body,
        userId: (req.user as any).id,
        questionId
      });
      
      const answer = await storage.createForumAnswer(answerData);
      res.status(201).json(answer);
    } catch (error) {
      res.status(400).json({ message: "Invalid answer data" });
    }
  });

  // Message routes
  app.get("/api/messages", isAuthenticated, async (req, res) => {
    const messages = await storage.getMessages((req.user as any).id);
    res.json(messages);
  });

  app.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: (req.user as any).id
      });
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
  });

  app.put("/api/messages/:id/read", isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.markMessageAsRead(messageId, new Date());
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: "Error marking message as read" });
    }
  });

  // Events routes
  app.get("/api/events", async (req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.post("/api/events", isManagerOrCommittee, async (req, res) => {
    try {
      const eventData = insertEventSchema.parse({
        ...req.body,
        createdBy: (req.user as any).id
      });
      
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  // Statistics/dashboard route
  app.get("/api/dashboard", isAuthenticated, async (req, res) => {
    try {
      // Get all plots
      const plots = await storage.getPlots();
      const totalPlots = plots.length;
      const availablePlots = plots.filter(p => p.status === "available").length;
      
      // Get applications data
      const applications = await storage.getApplications();
      const totalApplications = applications.length;
      const pendingApplications = applications.filter(a => a.status === "pending").length;
      const approvedApplications = applications.filter(a => a.status === "approved").length;
      
      // Get work days
      const workDays = await storage.getWorkDays();
      
      // Get upcoming work days (those in the future)
      const now = new Date();
      const upcomingWorkDays = workDays
        .filter(wd => new Date(wd.date) > now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const nextWorkDay = upcomingWorkDays.length > 0 ? upcomingWorkDays[0] : null;
      
      // Get work day signups
      let workDaySignups = 0;
      if (nextWorkDay) {
        const attendances = await storage.getWorkDayAttendances(nextWorkDay.id);
        workDaySignups = attendances.length;
      }
      
      // Calculate payments
      const payments = await storage.getPayments();
      const outstandingPayments = payments.filter(p => p.status !== "paid");
      const totalOutstanding = outstandingPayments.reduce((sum, p) => sum + p.amount, 0);
      
      const dashboardData = {
        plots: {
          total: totalPlots,
          available: availablePlots,
          percentAssigned: totalPlots > 0 ? Math.round(((totalPlots - availablePlots) / totalPlots) * 100) : 0
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          approved: approvedApplications,
          new: pendingApplications // For simplicity, assuming new applications are pending ones
        },
        workDay: nextWorkDay ? {
          nextDate: nextWorkDay.date,
          title: nextWorkDay.title,
          signups: workDaySignups,
          maxAttendees: nextWorkDay.maxAttendees
        } : null,
        payments: {
          outstanding: totalOutstanding,
          outstandingCount: outstandingPayments.length
        },
        events: upcomingWorkDays.slice(0, 3).map(wd => ({
          id: wd.id,
          title: wd.title,
          date: wd.date,
          startTime: wd.startTime,
          endTime: wd.endTime,
          attendees: 0  // This would require a lookup for each event
        }))
      };
      
      res.json(dashboardData);
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard data" });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const notifications = await storage.getNotifications(userId);
      
      // Sort by created date, most recent first
      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });
  
  app.get("/api/notifications/unread/count", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const count = await storage.getUnreadNotificationsCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Error fetching unread notifications count" });
    }
  });
  
  app.post("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      
      // Only managers or committee members can create global notifications
      const user = req.user as any;
      if (notificationData.isGlobal && 
          user.role !== "manager" && 
          user.role !== "committee") {
        return res.status(403).json({ message: "Only managers or committee members can create global notifications" });
      }
      
      // Create the notification in the database
      const notification = await storage.createNotification(notificationData);
      
      // Try to send email notification for high and urgent priority notifications
      if (notification.priority === "high" || notification.priority === "urgent") {
        try {
          // Import here to avoid circular dependency
          const { sendNotificationEmail } = await import('./notificationEmails');
          
          // If it's a user-specific notification, try to find user's email
          if (notification.userId) {
            const targetUser = await storage.getUser(notification.userId);
            if (targetUser && targetUser.email) {
              sendNotificationEmail({
                notification,
                recipient: {
                  email: targetUser.email,
                  name: `${targetUser.firstName} ${targetUser.lastName}`
                }
              }).catch(err => console.error('Failed to send notification email:', err));
            }
          } 
          // If it's a global notification, consider sending to all users
          else if (notification.isGlobal && ["urgent", "high"].includes(notification.priority)) {
            // For now, we're not sending global emails to all users to avoid
            // spamming users, but you could implement this feature by getting
            // all users and sending individual emails
            console.log('Global notification created:', notification.title);
          }
        } catch (emailError) {
          // Don't fail the notification creation if email sending fails
          console.error('Failed to send notification email:', emailError);
        }
      }
      
      res.status(201).json(notification);
    } catch (error) {
      res.status(400).json({ message: "Invalid notification data" });
    }
  });
  
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId, new Date());
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Error marking notification as read" });
    }
  });
  
  app.patch("/api/notifications/read-all", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      await storage.markAllNotificationsAsRead(userId, new Date());
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Error marking all notifications as read" });
    }
  });
  
  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const result = await storage.deleteNotification(notificationId);
      
      if (!result) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting notification" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
