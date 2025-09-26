import emailQueue from '../queue/emailQueue.js';
import { User } from '../models/user.js';

// Middleware to send welcome email after user registration
export const sendWelcomeEmail = async (req, res, next) => {
  try {
    // Only send welcome email for new user registrations
    if (req.method === 'POST' && req.originalUrl.includes('/api/users')) {
      const user = res.locals.user || req.body;
      
      if (user && user._id) {
        // Queue welcome email
        await emailQueue.addWelcomeEmail(user._id, {
          delay: 5000, // Send after 5 seconds
        });
        
        console.log(`Welcome email queued for user: ${user._id}`);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in sendWelcomeEmail middleware:', error);
    // Don't fail the request if email sending fails
    next();
  }
};

// Middleware to send lesson completed email
export const sendLessonCompletedEmail = async (req, res, next) => {
  try {
    if (req.method === 'PUT' && req.originalUrl.includes('/api/progress')) {
      const { lessonId, courseId, completed } = req.body;
      const userId = req.user?._id;
      
      if (userId && lessonId && courseId && completed) {
        // Queue lesson completed email
        await emailQueue.addLessonCompletedEmail(userId, lessonId, courseId, {
          delay: 2000, // Send after 2 seconds
        });
        
        console.log(`Lesson completed email queued for user: ${userId}`);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in sendLessonCompletedEmail middleware:', error);
    next();
  }
};

// Middleware to send subscription expired email
export const sendSubscriptionExpiredEmail = async (req, res, next) => {
  try {
    if (req.method === 'PUT' && req.originalUrl.includes('/api/subscriptions')) {
      const { subscriptionActive } = req.body;
      const userId = req.params.userId || req.user?._id;
      
      // Check if subscription is being deactivated
      if (userId && subscriptionActive === false) {
        // Queue subscription expired email
        await emailQueue.addSubscriptionExpiredEmail(userId, {
          delay: 10000, // Send after 10 seconds
        });
        
        console.log(`Subscription expired email queued for user: ${userId}`);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in sendSubscriptionExpiredEmail middleware:', error);
    next();
  }
};

// Middleware to send course recommendation email
export const sendCourseRecommendationEmail = async (req, res, next) => {
  try {
    // This would typically be triggered by a scheduled job or admin action
    // For now, we'll create a utility function that can be called manually
    
    next();
  } catch (error) {
    console.error('Error in sendCourseRecommendationEmail middleware:', error);
    next();
  }
};

// Utility function to send course recommendation email
export const recommendCourse = async (userId, courseId, reason) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.emailPreferences?.promotions) {
      return false; // User doesn't want promotional emails
    }
    
    await emailQueue.addCourseRecommendationEmail(userId, courseId, reason, {
      delay: 0, // Send immediately
    });
    
    console.log(`Course recommendation email queued for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error recommending course:', error);
    return false;
  }
};

// Utility function to send password reset email
export const sendPasswordResetEmail = async (userId, resetCode) => {
  try {
    await emailQueue.addPasswordResetEmail(userId, resetCode, {
      priority: 10, // High priority
      delay: 0, // Send immediately
    });
    
    console.log(`Password reset email queued for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

// Utility function to send bulk emails to users
export const sendBulkEmail = async (userIds, template, subject, data) => {
  try {
    const users = await User.find({ 
      _id: { $in: userIds },
      'emailPreferences.marketing': true // Only send to users who opted in
    });
    
    if (users.length === 0) {
      return { success: false, message: 'No users found with marketing preferences enabled' };
    }
    
    const job = await emailQueue.addBulkEmail(users, template, subject, data, {
      delay: 0, // Send immediately
    });
    
    console.log(`Bulk email queued for ${users.length} users`);
    return { success: true, jobId: job.id, userCount: users.length };
  } catch (error) {
    console.error('Error sending bulk email:', error);
    return { success: false, message: error.message };
  }
};

// Utility function to send scheduled emails
export const scheduleEmail = async (type, data, scheduleTime) => {
  try {
    const job = await emailQueue.scheduleEmail(type, data, scheduleTime);
    
    console.log(`Email scheduled for ${scheduleTime}`);
    return { success: true, jobId: job.id };
  } catch (error) {
    console.error('Error scheduling email:', error);
    return { success: false, message: error.message };
  }
};

// Utility function to get users who should receive specific email types
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

// Utility function to update user's last email sent timestamp
export const updateLastEmailSent = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, { lastEmailSent: new Date() });
  } catch (error) {
    console.error('Error updating last email sent timestamp:', error);
  }
};

// Utility function to check if user can receive email (rate limiting)
export const canSendEmail = async (userId, maxEmailsPerDay = 5) => {
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

export default {
  sendWelcomeEmail,
  sendLessonCompletedEmail,
  sendSubscriptionExpiredEmail,
  sendCourseRecommendationEmail,
  recommendCourse,
  sendPasswordResetEmail,
  sendBulkEmail,
  scheduleEmail,
  getUsersForEmailType,
  updateLastEmailSent,
  canSendEmail,
};
