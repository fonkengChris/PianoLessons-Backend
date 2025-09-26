import { User } from '../models/user.js';
import emailQueue from '../queue/emailQueue.js';

// Email helper functions for common use cases

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmailToUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user wants welcome emails
    if (!user.emailPreferences?.welcome) {
      console.log(`User ${userId} has disabled welcome emails`);
      return false;
    }

    const job = await emailQueue.addWelcomeEmail(userId, {
      delay: 5000, // Send after 5 seconds
    });

    console.log(`Welcome email queued for user: ${userId}, job: ${job.id}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

/**
 * Send lesson completed email
 */
export const sendLessonCompletedEmailToUser = async (userId, lessonId, courseId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user wants lesson completion emails
    if (!user.emailPreferences?.lessons) {
      console.log(`User ${userId} has disabled lesson emails`);
      return false;
    }

    const job = await emailQueue.addLessonCompletedEmail(userId, lessonId, courseId, {
      delay: 2000, // Send after 2 seconds
    });

    console.log(`Lesson completed email queued for user: ${userId}, job: ${job.id}`);
    return true;
  } catch (error) {
    console.error('Error sending lesson completed email:', error);
    return false;
  }
};

/**
 * Send subscription expired email
 */
export const sendSubscriptionExpiredEmailToUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user wants business emails
    if (!user.emailPreferences?.updates) {
      console.log(`User ${userId} has disabled update emails`);
      return false;
    }

    const job = await emailQueue.addSubscriptionExpiredEmail(userId, {
      delay: 10000, // Send after 10 seconds
    });

    console.log(`Subscription expired email queued for user: ${userId}, job: ${job.id}`);
    return true;
  } catch (error) {
    console.error('Error sending subscription expired email:', error);
    return false;
  }
};

/**
 * Send course recommendation email
 */
export const sendCourseRecommendationEmailToUser = async (userId, courseId, reason) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user wants promotional emails
    if (!user.emailPreferences?.promotions) {
      console.log(`User ${userId} has disabled promotional emails`);
      return false;
    }

    const job = await emailQueue.addCourseRecommendationEmail(userId, courseId, reason, {
      delay: 0, // Send immediately
    });

    console.log(`Course recommendation email queued for user: ${userId}, job: ${job.id}`);
    return true;
  } catch (error) {
    console.error('Error sending course recommendation email:', error);
    return false;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmailToUser = async (userId, resetCode) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const job = await emailQueue.addPasswordResetEmail(userId, resetCode, {
      priority: 10, // High priority for security emails
      delay: 0, // Send immediately
    });

    console.log(`Password reset email queued for user: ${userId}, job: ${job.id}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

/**
 * Send bulk emails to multiple users
 */
export const sendBulkEmailsToUsers = async (userIds, template, subject, data) => {
  try {
    const users = await User.find({ 
      _id: { $in: userIds },
      'emailPreferences.marketing': true // Only send to users who opted in
    });

    if (users.length === 0) {
      console.log('No users found with marketing preferences enabled');
      return { success: false, message: 'No users found with marketing preferences enabled' };
    }

    const job = await emailQueue.addBulkEmail(users, template, subject, data, {
      delay: 0, // Send immediately
    });

    console.log(`Bulk email queued for ${users.length} users, job: ${job.id}`);
    return { success: true, jobId: job.id, userCount: users.length };
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send emails to users based on their preferences
 */
export const sendEmailsByPreference = async (emailType, template, subject, data) => {
  try {
    const preferenceField = `emailPreferences.${emailType}`;
    const users = await User.find({ [preferenceField]: true });

    if (users.length === 0) {
      console.log(`No users found with ${emailType} preference enabled`);
      return { success: false, message: `No users found with ${emailType} preference enabled` };
    }

    const job = await emailQueue.addBulkEmail(users, template, subject, data, {
      delay: 0, // Send immediately
    });

    console.log(`Bulk email queued for ${users.length} users with ${emailType} preference, job: ${job.id}`);
    return { success: true, jobId: job.id, userCount: users.length };
  } catch (error) {
    console.error('Error sending emails by preference:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Schedule email for future delivery
 */
export const scheduleEmailForUser = async (userId, type, data, scheduleTime) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const job = await emailQueue.scheduleEmail(type, data, scheduleTime, {
      delay: 0, // Will be calculated based on scheduleTime
    });

    console.log(`Email scheduled for user: ${userId} at ${scheduleTime}, job: ${job.id}`);
    return { success: true, jobId: job.id };
  } catch (error) {
    console.error('Error scheduling email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get users who should receive specific email types
 */
export const getUsersForEmailType = async (emailType) => {
  try {
    const preferenceField = `emailPreferences.${emailType}`;
    const users = await User.find({ [preferenceField]: true });
    
    return users;
  } catch (error) {
    console.error('Error getting users for email type:', error);
    return [];
  }
};

/**
 * Check if user can receive email (rate limiting)
 */
export const canUserReceiveEmail = async (userId, maxEmailsPerDay = 5) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.lastEmailSent) {
      return true; // No previous emails sent
    }
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return user.lastEmailSent < oneDayAgo;
  } catch (error) {
    console.error('Error checking email rate limit:', error);
    return false; // Err on the side of caution
  }
};

/**
 * Update user's last email sent timestamp
 */
export const updateUserLastEmailSent = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, { lastEmailSent: new Date() });
    console.log(`Updated last email sent timestamp for user: ${userId}`);
  } catch (error) {
    console.error('Error updating last email sent timestamp:', error);
  }
};

/**
 * Send email to all active users
 */
export const sendEmailToAllActiveUsers = async (template, subject, data) => {
  try {
    const users = await User.find({ 
      emailVerified: true,
      'emailPreferences.marketing': true 
    });

    if (users.length === 0) {
      console.log('No active users found with marketing preferences enabled');
      return { success: false, message: 'No active users found with marketing preferences enabled' };
    }

    const job = await emailQueue.addBulkEmail(users, template, subject, data, {
      delay: 0, // Send immediately
    });

    console.log(`Bulk email queued for ${users.length} active users, job: ${job.id}`);
    return { success: true, jobId: job.id, userCount: users.length };
  } catch (error) {
    console.error('Error sending email to all active users:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send email to users by subscription status
 */
export const sendEmailBySubscriptionStatus = async (subscriptionActive, template, subject, data) => {
  try {
    const users = await User.find({ 
      subscriptionActive,
      emailVerified: true,
      'emailPreferences.updates': true 
    });

    if (users.length === 0) {
      console.log(`No users found with subscription status: ${subscriptionActive}`);
      return { success: false, message: `No users found with subscription status: ${subscriptionActive}` };
    }

    const job = await emailQueue.addBulkEmail(users, template, subject, data, {
      delay: 0, // Send immediately
    });

    console.log(`Bulk email queued for ${users.length} users with subscription status: ${subscriptionActive}, job: ${job.id}`);
    return { success: true, jobId: job.id, userCount: users.length };
  } catch (error) {
    console.error('Error sending email by subscription status:', error);
    return { success: false, message: error.message };
  }
};

export default {
  sendWelcomeEmailToUser,
  sendLessonCompletedEmailToUser,
  sendSubscriptionExpiredEmailToUser,
  sendCourseRecommendationEmailToUser,
  sendPasswordResetEmailToUser,
  sendBulkEmailsToUsers,
  sendEmailsByPreference,
  scheduleEmailForUser,
  getUsersForEmailType,
  canUserReceiveEmail,
  updateUserLastEmailSent,
  sendEmailToAllActiveUsers,
  sendEmailBySubscriptionStatus,
};
