import express from 'express';
import Joi from 'joi';
import { User } from '../models/user.js';
import emailService from '../services/emailService.js';
import emailQueue from '../queue/emailQueue.js';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';
import validate from '../middleware/validate.js';

const router = express.Router();

// Validation schemas
const sendEmailSchema = Joi.object({
  to: Joi.string().email().required(),
  subject: Joi.string().max(200).required(),
  template: Joi.string().required(),
  data: Joi.object().default({}),
});

const bulkEmailSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().required()).min(1).required(),
  subject: Joi.string().max(200).required(),
  template: Joi.string().required(),
  data: Joi.object().default({}),
});

const emailPreferencesSchema = Joi.object({
  welcome: Joi.boolean(),
  lessons: Joi.boolean(),
  promotions: Joi.boolean(),
  updates: Joi.boolean(),
  marketing: Joi.boolean(),
});

const scheduleEmailSchema = Joi.object({
  type: Joi.string().valid('welcome', 'password-reset', 'lesson-completed', 'subscription-expired', 'course-recommendation', 'custom').required(),
  data: Joi.object().required(),
  scheduleTime: Joi.date().greater('now').required(),
});

const contactFormSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  subject: Joi.string().min(5).max(200).required(),
  message: Joi.string().min(10).max(1000).required(),
  userId: Joi.string().optional(),
});

// Send welcome email to user
router.post('/welcome/:userId', [auth, admin], async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const job = await emailQueue.addWelcomeEmail(userId);
    
    res.json({
      message: 'Welcome email queued successfully',
      jobId: job.id,
      userId: userId,
    });
  } catch (error) {
    console.error('Error queuing welcome email:', error);
    res.status(500).json({ error: 'Failed to queue welcome email' });
  }
});

// Send password reset email
router.post('/password-reset/:userId', [auth, admin], async (req, res) => {
  try {
    const { userId } = req.params;
    const { resetCode } = req.body;
    
    if (!resetCode) {
      return res.status(400).json({ error: 'Reset code is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const job = await emailQueue.addPasswordResetEmail(userId, resetCode);
    
    res.json({
      message: 'Password reset email queued successfully',
      jobId: job.id,
      userId: userId,
    });
  } catch (error) {
    console.error('Error queuing password reset email:', error);
    res.status(500).json({ error: 'Failed to queue password reset email' });
  }
});

// Send lesson completed email
router.post('/lesson-completed', [auth], async (req, res) => {
  try {
    const { userId, lessonId, courseId } = req.body;
    
    if (!userId || !lessonId || !courseId) {
      return res.status(400).json({ error: 'userId, lessonId, and courseId are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const job = await emailQueue.addLessonCompletedEmail(userId, lessonId, courseId);
    
    res.json({
      message: 'Lesson completed email queued successfully',
      jobId: job.id,
      userId: userId,
    });
  } catch (error) {
    console.error('Error queuing lesson completed email:', error);
    res.status(500).json({ error: 'Failed to queue lesson completed email' });
  }
});

// Send subscription expired email
router.post('/subscription-expired/:userId', [auth, admin], async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const job = await emailQueue.addSubscriptionExpiredEmail(userId);
    
    res.json({
      message: 'Subscription expired email queued successfully',
      jobId: job.id,
      userId: userId,
    });
  } catch (error) {
    console.error('Error queuing subscription expired email:', error);
    res.status(500).json({ error: 'Failed to queue subscription expired email' });
  }
});

// Send course recommendation email
router.post('/course-recommendation', [auth], async (req, res) => {
  try {
    const { userId, courseId, reason } = req.body;
    
    if (!userId || !courseId || !reason) {
      return res.status(400).json({ error: 'userId, courseId, and reason are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const job = await emailQueue.addCourseRecommendationEmail(userId, courseId, reason);
    
    res.json({
      message: 'Course recommendation email queued successfully',
      jobId: job.id,
      userId: userId,
    });
  } catch (error) {
    console.error('Error queuing course recommendation email:', error);
    res.status(500).json({ error: 'Failed to queue course recommendation email' });
  }
});

// Send custom email
router.post('/send', [auth, admin, validate(sendEmailSchema)], async (req, res) => {
  try {
    const { to, subject, template, data } = req.body;
    
    const job = await emailQueue.addCustomEmail(to, subject, template, data);
    
    res.json({
      message: 'Custom email queued successfully',
      jobId: job.id,
      to: to,
    });
  } catch (error) {
    console.error('Error queuing custom email:', error);
    res.status(500).json({ error: 'Failed to queue custom email' });
  }
});

// Send bulk emails
router.post('/bulk', [auth, admin, validate(bulkEmailSchema)], async (req, res) => {
  try {
    const { userIds, subject, template, data } = req.body;
    
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length === 0) {
      return res.status(404).json({ error: 'No users found' });
    }

    const job = await emailQueue.addBulkEmail(users, template, subject, data);
    
    res.json({
      message: 'Bulk email queued successfully',
      jobId: job.id,
      userCount: users.length,
    });
  } catch (error) {
    console.error('Error queuing bulk email:', error);
    res.status(500).json({ error: 'Failed to queue bulk email' });
  }
});

// Schedule email
router.post('/schedule', [auth, admin, validate(scheduleEmailSchema)], async (req, res) => {
  try {
    const { type, data, scheduleTime } = req.body;
    
    const job = await emailQueue.scheduleEmail(type, data, scheduleTime);
    
    res.json({
      message: 'Email scheduled successfully',
      jobId: job.id,
      scheduledFor: scheduleTime,
    });
  } catch (error) {
    console.error('Error scheduling email:', error);
    res.status(500).json({ error: 'Failed to schedule email' });
  }
});

// Get queue statistics
router.get('/queue/stats', [auth, admin], async (req, res) => {
  try {
    const stats = await emailQueue.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({ error: 'Failed to get queue statistics' });
  }
});

// Get job details
router.get('/queue/job/:jobId', [auth, admin], async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await emailQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({
      id: job.id,
      type: job.name,
      data: job.data,
      progress: job.progress(),
      state: await job.getState(),
      createdAt: new Date(job.timestamp),
      processedOn: job.processedOn ? new Date(job.processedOn) : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn) : null,
      failedReason: job.failedReason,
    });
  } catch (error) {
    console.error('Error getting job details:', error);
    res.status(500).json({ error: 'Failed to get job details' });
  }
});

// Retry failed jobs
router.post('/queue/retry-failed', [auth, admin], async (req, res) => {
  try {
    await emailQueue.retryFailedJobs();
    res.json({ message: 'Failed jobs retried successfully' });
  } catch (error) {
    console.error('Error retrying failed jobs:', error);
    res.status(500).json({ error: 'Failed to retry failed jobs' });
  }
});

// Clear queue
router.delete('/queue/clear', [auth, admin], async (req, res) => {
  try {
    await emailQueue.clearQueue();
    res.json({ message: 'Queue cleared successfully' });
  } catch (error) {
    console.error('Error clearing queue:', error);
    res.status(500).json({ error: 'Failed to clear queue' });
  }
});

// Pause queue
router.post('/queue/pause', [auth, admin], async (req, res) => {
  try {
    await emailQueue.pauseQueue();
    res.json({ message: 'Queue paused successfully' });
  } catch (error) {
    console.error('Error pausing queue:', error);
    res.status(500).json({ error: 'Failed to pause queue' });
  }
});

// Resume queue
router.post('/queue/resume', [auth, admin], async (req, res) => {
  try {
    await emailQueue.resumeQueue();
    res.json({ message: 'Queue resumed successfully' });
  } catch (error) {
    console.error('Error resuming queue:', error);
    res.status(500).json({ error: 'Failed to resume queue' });
  }
});

// Update user email preferences
router.put('/preferences', [auth, validate(emailPreferencesSchema)], async (req, res) => {
  try {
    const userId = req.user._id;
    const preferences = req.body;
    
    const updatedPreferences = await emailService.updateEmailPreferences(userId, preferences);
    
    res.json({
      message: 'Email preferences updated successfully',
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error('Error updating email preferences:', error);
    res.status(500).json({ error: 'Failed to update email preferences' });
  }
});

// Get user email preferences
router.get('/preferences', [auth], async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      preferences: user.emailPreferences || {
        welcome: true,
        lessons: true,
        promotions: true,
        updates: true,
        marketing: false,
      },
    });
  } catch (error) {
    console.error('Error getting email preferences:', error);
    res.status(500).json({ error: 'Failed to get email preferences' });
  }
});

// Unsubscribe user
router.post('/unsubscribe/:token', async (req, res) => {
  try {
    const { token } = req.params;
    await emailService.unsubscribeUser(token);
    
    res.json({ message: 'Successfully unsubscribed from all emails' });
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// Contact form submission
router.post('/contact', [validate(contactFormSchema)], async (req, res) => {
  try {
    const { name, email, subject, message, userId } = req.body;
    
    // Generate reference ID
    const referenceId = `CF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const submittedAt = new Date().toLocaleString();
    
    // Determine priority based on subject keywords
    const highPriorityKeywords = ['urgent', 'emergency', 'bug', 'error', 'broken', 'not working'];
    const mediumPriorityKeywords = ['question', 'help', 'support', 'issue', 'problem'];
    const subjectLower = subject.toLowerCase();
    
    let priority = 'low';
    if (highPriorityKeywords.some(keyword => subjectLower.includes(keyword))) {
      priority = 'high';
    } else if (mediumPriorityKeywords.some(keyword => subjectLower.includes(keyword))) {
      priority = 'medium';
    }
    
    // Send emails directly without queue to avoid memory issues
    try {
      // Send confirmation email to user
      const confirmationData = {
        name,
        email,
        subject,
        submittedAt,
        referenceId,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        coursesUrl: `${process.env.FRONTEND_URL}/courses`,
        faqUrl: `${process.env.FRONTEND_URL}/contact#faq`,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?token=${userId || 'anonymous'}`,
      };
      
      await emailService.sendCustomEmail(
        email,
        'Message Received - We\'ll Get Back to You Soon!',
        'contact-confirmation',
        confirmationData
      );
      
      // Send notification email to admin/support
      const adminData = {
        name,
        email,
        subject,
        message,
        userId: userId || 'anonymous',
        submittedAt,
        referenceId,
        priority,
        dashboardUrl: `${process.env.FRONTEND_URL}/admin`,
        contactUrl: `${process.env.FRONTEND_URL}/contact`,
      };
      
      await emailService.sendCustomEmail(
        process.env.SUPPORT_EMAIL || 'admin@pianolessons.com',
        `[${priority.toUpperCase()}] New Contact Form: ${subject}`,
        'contact-form',
        adminData
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue with response even if email fails
    }
    
    res.json({
      message: 'Contact form submitted successfully',
      referenceId,
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({ error: 'Failed to process contact form submission' });
  }
});

// Test email endpoint (development only)
router.post('/test', [auth, admin], async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Test endpoint not available in production' });
  }

  try {
    const { to, subject, template, data } = req.body;
    
    if (!to || !subject || !template) {
      return res.status(400).json({ error: 'to, subject, and template are required' });
    }

    const result = await emailService.sendCustomEmail(to, subject, template, data || {});
    
    res.json({
      message: 'Test email sent successfully',
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

export default router;
