import dotenv from 'dotenv';

dotenv.config();

export const emailConfig = {
  // SMTP Configuration
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },

  // Email Service Configuration
  service: {
    name: process.env.EMAIL_SERVICE_NAME || 'Piano Lessons',
    from: process.env.EMAIL_FROM || 'noreply@pianolessons.com',
    replyTo: process.env.EMAIL_REPLY_TO || 'support@pianolessons.com',
  },

  // Redis Configuration for Queue
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 0,
  },

  // Queue Configuration
  queue: {
    concurrency: parseInt(process.env.EMAIL_QUEUE_CONCURRENCY) || 5,
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY) || 2000,
    removeOnComplete: parseInt(process.env.EMAIL_REMOVE_ON_COMPLETE) || 100,
    removeOnFail: parseInt(process.env.EMAIL_REMOVE_ON_FAIL) || 50,
  },

  // Email Templates Configuration
  templates: {
    baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    logoUrl: process.env.EMAIL_LOGO_URL || `${process.env.FRONTEND_URL}/logo.png`,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@pianolessons.com',
    unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe`,
    contactUrl: `${process.env.FRONTEND_URL}/contact`,
  },

  // Email Preferences
  preferences: {
    defaultPreferences: {
      welcome: true,
      lessons: true,
      promotions: true,
      updates: true,
      marketing: false,
    },
    allowedTypes: ['welcome', 'lessons', 'promotions', 'updates', 'marketing'],
  },

  // Rate Limiting
  rateLimit: {
    maxEmailsPerHour: parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR) || 100,
    maxEmailsPerDay: parseInt(process.env.EMAIL_RATE_LIMIT_PER_DAY) || 1000,
  },

  // Development/Testing
  development: {
    enabled: process.env.NODE_ENV === 'development',
    ethereal: {
      user: process.env.ETHEREAL_USER,
      pass: process.env.ETHEREAL_PASS,
    },
    testEmail: process.env.TEST_EMAIL || 'test@pianolessons.com',
  },

  // Email Validation
  validation: {
    maxSubjectLength: 200,
    maxBodyLength: 10000,
    allowedDomains: process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || [],
    blockedDomains: process.env.BLOCKED_EMAIL_DOMAINS?.split(',') || [],
  },

  // Monitoring and Logging
  monitoring: {
    enabled: process.env.EMAIL_MONITORING_ENABLED === 'true',
    webhookUrl: process.env.EMAIL_MONITORING_WEBHOOK,
    logLevel: process.env.EMAIL_LOG_LEVEL || 'info',
  },
};

// Email template variables that are available globally
export const globalTemplateVariables = {
  companyName: emailConfig.service.name,
  companyEmail: emailConfig.service.from,
  supportEmail: emailConfig.templates.supportEmail,
  baseUrl: emailConfig.templates.baseUrl,
  logoUrl: emailConfig.templates.logoUrl,
  unsubscribeUrl: emailConfig.templates.unsubscribeUrl,
  contactUrl: emailConfig.templates.contactUrl,
  currentYear: new Date().getFullYear(),
};

// Email type configurations
export const emailTypes = {
  welcome: {
    subject: 'Welcome to Piano Lessons!',
    template: 'welcome',
    priority: 1,
    category: 'transactional',
  },
  'password-reset': {
    subject: 'Password Reset Request',
    template: 'password-reset',
    priority: 10,
    category: 'security',
  },
  'lesson-completed': {
    subject: 'Lesson Completed - Great Job!',
    template: 'lesson-completed',
    priority: 2,
    category: 'engagement',
  },
  'subscription-expired': {
    subject: 'Your Subscription Has Expired',
    template: 'subscription-expired',
    priority: 5,
    category: 'business',
  },
  'course-recommendation': {
    subject: 'Perfect Course Recommendation for You!',
    template: 'course-recommendation',
    priority: 3,
    category: 'marketing',
  },
};

export default emailConfig;
