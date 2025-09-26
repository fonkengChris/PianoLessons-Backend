import Queue from 'bull';
import emailService from '../services/emailService.js';

class EmailQueue {
  constructor() {
    this.queue = new Queue('email processing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.setupEventListeners();
    this.setupProcessors();
  }

  setupEventListeners() {
    this.queue.on('completed', (job, result) => {
      console.log(`Email job ${job.id} completed successfully`);
    });

    this.queue.on('failed', (job, err) => {
      console.error(`Email job ${job.id} failed:`, err.message);
    });

    this.queue.on('stalled', (job) => {
      console.warn(`Email job ${job.id} stalled`);
    });

    this.queue.on('progress', (job, progress) => {
      console.log(`Email job ${job.id} progress: ${progress}%`);
    });
  }

  setupProcessors() {
    // Welcome email processor
    this.queue.process('welcome', 5, async (job) => {
      const { userId } = job.data;
      return await emailService.sendWelcomeEmail(userId);
    });

    // Password reset email processor
    this.queue.process('password-reset', 5, async (job) => {
      const { userId, resetCode } = job.data;
      return await emailService.sendPasswordResetEmail(userId, resetCode);
    });

    // Lesson completed email processor
    this.queue.process('lesson-completed', 5, async (job) => {
      const { userId, lessonId, courseId } = job.data;
      return await emailService.sendLessonCompletedEmail(userId, lessonId, courseId);
    });

    // Subscription expired email processor
    this.queue.process('subscription-expired', 5, async (job) => {
      const { userId } = job.data;
      return await emailService.sendSubscriptionExpiredEmail(userId);
    });

    // Course recommendation email processor
    this.queue.process('course-recommendation', 5, async (job) => {
      const { userId, courseId, reason } = job.data;
      return await emailService.sendCourseRecommendationEmail(userId, courseId, reason);
    });

    // Custom email processor
    this.queue.process('custom', 5, async (job) => {
      const { to, subject, template, data } = job.data;
      return await emailService.sendCustomEmail(to, subject, template, data);
    });

    // Bulk email processor
    this.queue.process('bulk', 2, async (job) => {
      const { users, template, subject, data } = job.data;
      return await emailService.sendBulkEmails(users, template, subject, data);
    });
  }

  // Queue management methods
  async addWelcomeEmail(userId, options = {}) {
    return await this.queue.add('welcome', { userId }, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      ...options,
    });
  }

  async addPasswordResetEmail(userId, resetCode, options = {}) {
    return await this.queue.add('password-reset', { userId, resetCode }, {
      priority: 10, // High priority for password reset
      delay: options.delay || 0,
      ...options,
    });
  }

  async addLessonCompletedEmail(userId, lessonId, courseId, options = {}) {
    return await this.queue.add('lesson-completed', { userId, lessonId, courseId }, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      ...options,
    });
  }

  async addSubscriptionExpiredEmail(userId, options = {}) {
    return await this.queue.add('subscription-expired', { userId }, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      ...options,
    });
  }

  async addCourseRecommendationEmail(userId, courseId, reason, options = {}) {
    return await this.queue.add('course-recommendation', { userId, courseId, reason }, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      ...options,
    });
  }

  async addCustomEmail(to, subject, template, data, options = {}) {
    return await this.queue.add('custom', { to, subject, template, data }, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      ...options,
    });
  }

  async addBulkEmail(users, template, subject, data, options = {}) {
    return await this.queue.add('bulk', { users, template, subject, data }, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      ...options,
    });
  }

  // Queue statistics and management
  async getStats() {
    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length,
    };
  }

  async getJobStats() {
    const stats = await this.getStats();
    const jobs = {
      waiting: await this.queue.getWaiting(0, 10),
      active: await this.queue.getActive(0, 10),
      failed: await this.queue.getFailed(0, 10),
    };

    return {
      ...stats,
      recentJobs: jobs,
    };
  }

  async pauseQueue() {
    await this.queue.pause();
    console.log('Email queue paused');
  }

  async resumeQueue() {
    await this.queue.resume();
    console.log('Email queue resumed');
  }

  async clearQueue() {
    await this.queue.empty();
    console.log('Email queue cleared');
  }

  async retryFailedJobs() {
    const failed = await this.queue.getFailed();
    for (const job of failed) {
      await job.retry();
    }
    console.log(`Retried ${failed.length} failed jobs`);
  }

  async removeJob(jobId) {
    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.remove();
      console.log(`Job ${jobId} removed`);
    }
  }

  async getJob(jobId) {
    return await this.queue.getJob(jobId);
  }

  // Scheduled email methods
  async scheduleEmail(type, data, scheduleTime, options = {}) {
    const delay = new Date(scheduleTime).getTime() - Date.now();
    
    if (delay <= 0) {
      throw new Error('Schedule time must be in the future');
    }

    return await this.queue.add(type, data, {
      delay,
      ...options,
    });
  }

  // Recurring email methods
  async addRecurringEmail(type, data, interval, options = {}) {
    const job = await this.queue.add(type, data, {
      repeat: { every: interval },
      ...options,
    });

    return job;
  }

  // Cleanup old jobs
  async cleanup() {
    // Remove completed jobs older than 24 hours
    await this.queue.clean(24 * 60 * 60 * 1000, 'completed');
    
    // Remove failed jobs older than 7 days
    await this.queue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
    
    console.log('Email queue cleanup completed');
  }

  // Graceful shutdown
  async close() {
    await this.queue.close();
    console.log('Email queue closed');
  }
}

// Create singleton instance
const emailQueue = new EmailQueue();

export default emailQueue;
