import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';
import Queue from 'bull';
import { User } from '../models/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class EmailService {
  constructor() {
    this.transporter = null;
    this.emailQueue = new Queue('email processing', {
      redis: process.env.REDIS_URL || {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    });
    
    this.initializeTransporter();
    this.setupQueueProcessors();
  }

  initializeTransporter() {
    // Configure email transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production configuration using SMTP settings
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development configuration (Ethereal for testing)
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
          pass: process.env.ETHEREAL_PASS || 'ethereal.pass',
        },
      });
    }
  }

  setupQueueProcessors() {
    // Process welcome emails
    this.emailQueue.process('welcome', async (job) => {
      const { userId } = job.data;
      return await this.sendWelcomeEmail(userId);
    });

    // Process password reset emails
    this.emailQueue.process('password-reset', async (job) => {
      const { userId, resetCode } = job.data;
      return await this.sendPasswordResetEmail(userId, resetCode);
    });

    // Process lesson completion emails
    this.emailQueue.process('lesson-completed', async (job) => {
      const { userId, lessonId, courseId } = job.data;
      return await this.sendLessonCompletedEmail(userId, lessonId, courseId);
    });

    // Process subscription expired emails
    this.emailQueue.process('subscription-expired', async (job) => {
      const { userId } = job.data;
      return await this.sendSubscriptionExpiredEmail(userId);
    });

    // Process course recommendation emails
    this.emailQueue.process('course-recommendation', async (job) => {
      const { userId, courseId, reason } = job.data;
      return await this.sendCourseRecommendationEmail(userId, courseId, reason);
    });

    // Process custom emails
    this.emailQueue.process('custom', async (job) => {
      const { to, subject, template, data } = job.data;
      return await this.sendCustomEmail(to, subject, template, data);
    });
  }

  async loadTemplate(templateName) {
    try {
      const templatePath = join(__dirname, '..', 'templates', `${templateName}.html`);
      const templateSource = readFileSync(templatePath, 'utf8');
      return handlebars.compile(templateSource);
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Piano Lessons <noreply@pianolessons.com>',
        to,
        subject,
        html,
        text: text || this.htmlToText(html),
      };

      const result = await this.transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  htmlToText(html) {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  // Queue email sending methods
  async queueWelcomeEmail(userId) {
    return await this.emailQueue.add('welcome', { userId }, {
      attempts: 3,
      backoff: 'exponential',
    });
  }

  async queuePasswordResetEmail(userId, resetCode) {
    return await this.emailQueue.add('password-reset', { userId, resetCode }, {
      attempts: 3,
      backoff: 'exponential',
    });
  }

  async queueLessonCompletedEmail(userId, lessonId, courseId) {
    return await this.emailQueue.add('lesson-completed', { userId, lessonId, courseId }, {
      attempts: 3,
      backoff: 'exponential',
    });
  }

  async queueSubscriptionExpiredEmail(userId) {
    return await this.emailQueue.add('subscription-expired', { userId }, {
      attempts: 3,
      backoff: 'exponential',
    });
  }

  async queueCourseRecommendationEmail(userId, courseId, reason) {
    return await this.emailQueue.add('course-recommendation', { userId, courseId, reason }, {
      attempts: 3,
      backoff: 'exponential',
    });
  }

  async queueCustomEmail(to, subject, template, data) {
    return await this.emailQueue.add('custom', { to, subject, template, data }, {
      attempts: 3,
      backoff: 'exponential',
    });
  }

  // Direct email sending methods
  async sendWelcomeEmail(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const template = await this.loadTemplate('welcome');
      const html = template({
        name: user.name,
        email: user.email,
        joinDate: user.createdAt.toLocaleDateString(),
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?token=${user._id}`,
        contactUrl: `${process.env.FRONTEND_URL}/contact`,
      });

      return await this.sendEmail(user.email, 'Welcome to Piano Lessons!', html);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(userId, resetCode) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const template = await this.loadTemplate('password-reset');
      const html = template({
        name: user.name,
        email: user.email,
        resetCode,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?code=${resetCode}&email=${user.email}`,
        contactUrl: `${process.env.FRONTEND_URL}/contact`,
      });

      return await this.sendEmail(user.email, 'Password Reset Request', html);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  async sendLessonCompletedEmail(userId, lessonId, courseId) {
    try {
      const user = await User.findById(userId).populate('progress.lessonId');
      if (!user) {
        throw new Error('User not found');
      }

      // Get lesson and course details (you'll need to import these models)
      // const lesson = await Lesson.findById(lessonId);
      // const course = await Course.findById(courseId);
      
      // For now, using placeholder data
      const lesson = { title: 'Sample Lesson' };
      const course = { title: 'Sample Course' };

      const template = await this.loadTemplate('lesson-completed');
      const html = template({
        name: user.name,
        lessonTitle: lesson.title,
        courseTitle: course.title,
        courseProgress: 75, // Calculate actual progress
        lessonsCompleted: user.progress.filter(p => p.completed).length,
        totalWatchTime: Math.round(user.progress.reduce((total, p) => total + (p.watchTime || 0), 0) / 60),
        streak: 7, // Calculate actual streak
        nextLessonUrl: `${process.env.FRONTEND_URL}/courses/${courseId}/lessons/${lessonId + 1}`,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?token=${user._id}`,
      });

      return await this.sendEmail(user.email, 'Lesson Completed - Great Job!', html);
    } catch (error) {
      console.error('Error sending lesson completed email:', error);
      throw error;
    }
  }

  async sendSubscriptionExpiredEmail(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const template = await this.loadTemplate('subscription-expired');
      const html = template({
        name: user.name,
        email: user.email,
        expiryDate: new Date().toLocaleDateString(),
        discountPrice: 9.99,
        originalPrice: 19.99,
        discountPercent: 50,
        renewUrl: `${process.env.FRONTEND_URL}/pricing?renew=true`,
        contactUrl: `${process.env.FRONTEND_URL}/contact`,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?token=${user._id}`,
      });

      return await this.sendEmail(user.email, 'Your Subscription Has Expired', html);
    } catch (error) {
      console.error('Error sending subscription expired email:', error);
      throw error;
    }
  }

  async sendCourseRecommendationEmail(userId, courseId, reason) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get course details (you'll need to import Course model)
      // const course = await Course.findById(courseId);
      
      // For now, using placeholder data
      const course = {
        title: 'Advanced Piano Techniques',
        description: 'Master advanced piano techniques and improve your playing skills.',
        lessonCount: 15,
        duration: 8,
        rating: 4.8,
        features: [
          'Advanced chord progressions',
          'Complex rhythm patterns',
          'Performance techniques',
          'Music theory applications'
        ]
      };

      const template = await this.loadTemplate('course-recommendation');
      const html = template({
        name: user.name,
        recommendationReason: reason,
        courseTitle: course.title,
        courseDescription: course.description,
        lessonCount: course.lessonCount,
        duration: course.duration,
        rating: course.rating,
        features: course.features,
        completedCourses: 3, // Calculate actual count
        totalWatchTime: 25, // Calculate actual time
        courseUrl: `${process.env.FRONTEND_URL}/courses/${courseId}`,
        allCoursesUrl: `${process.env.FRONTEND_URL}/courses`,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?token=${user._id}`,
      });

      return await this.sendEmail(user.email, 'Perfect Course Recommendation for You!', html);
    } catch (error) {
      console.error('Error sending course recommendation email:', error);
      throw error;
    }
  }

  async sendCustomEmail(to, subject, templateName, data) {
    try {
      const template = await this.loadTemplate(templateName);
      const html = template(data);

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      console.error('Error sending custom email:', error);
      throw error;
    }
  }

  // Bulk email methods
  async sendBulkEmails(users, templateName, subject, data) {
    const promises = users.map(user => 
      this.queueCustomEmail(user.email, subject, templateName, {
        ...data,
        name: user.name,
        email: user.email,
      })
    );

    return await Promise.all(promises);
  }

  // Email preferences and unsubscribe
  async updateEmailPreferences(userId, preferences) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.emailPreferences = preferences;
      await user.save();
      return user.emailPreferences;
    } catch (error) {
      console.error('Error updating email preferences:', error);
      throw error;
    }
  }

  async unsubscribeUser(token) {
    try {
      const user = await User.findById(token);
      if (!user) {
        throw new Error('User not found');
      }

      user.emailPreferences = {
        welcome: false,
        lessons: false,
        promotions: false,
        updates: false,
      };
      await user.save();
      return true;
    } catch (error) {
      console.error('Error unsubscribing user:', error);
      throw error;
    }
  }

  // Queue management
  async getQueueStats() {
    const waiting = await this.emailQueue.getWaiting();
    const active = await this.emailQueue.getActive();
    const completed = await this.emailQueue.getCompleted();
    const failed = await this.emailQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async clearQueue() {
    await this.emailQueue.empty();
  }

  async retryFailedJobs() {
    const failed = await this.emailQueue.getFailed();
    for (const job of failed) {
      await job.retry();
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;
