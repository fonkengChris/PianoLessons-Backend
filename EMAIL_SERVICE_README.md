# Email Notification Service

A comprehensive email notification service for the Piano Lessons application that supports automated emails, queuing, templates, and user preferences.

## Features

- **Email Templates**: Pre-built HTML templates for different notification types
- **Queue System**: Redis-based queue for reliable email delivery
- **User Preferences**: Granular email preferences per user
- **Rate Limiting**: Built-in rate limiting to prevent spam
- **Bulk Emails**: Send emails to multiple users efficiently
- **Scheduled Emails**: Schedule emails for future delivery
- **Email Types**: Welcome, password reset, lesson completion, subscription expiry, course recommendations

## Setup

### 1. Install Dependencies

```bash
npm install nodemailer handlebars bull
```

### 2. Environment Variables

Create a `.env` file with the following variables:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=Piano Lessons <noreply@pianolessons.com>

# Redis Configuration (for email queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Support Email
SUPPORT_EMAIL=support@pianolessons.com
```

### 3. Redis Setup

Install and start Redis:

```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# macOS
brew install redis
brew services start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

## Usage

### Basic Email Sending

```javascript
import emailService from './services/emailService.js';

// Send welcome email
await emailService.sendWelcomeEmail(userId);

// Send password reset email
await emailService.sendPasswordResetEmail(userId, resetCode);

// Send custom email
await emailService.sendCustomEmail(
  'user@example.com',
  'Subject',
  'template-name',
  { name: 'John', data: 'value' }
);
```

### Using the Queue System

```javascript
import emailQueue from './queue/emailQueue.js';

// Queue welcome email
await emailQueue.addWelcomeEmail(userId);

// Queue lesson completed email
await emailQueue.addLessonCompletedEmail(userId, lessonId, courseId);

// Schedule email for future delivery
await emailQueue.scheduleEmail('welcome', { userId }, new Date('2024-12-31'));
```

### Using Helper Functions

```javascript
import { sendWelcomeEmailToUser, sendBulkEmailsToUsers } from './utils/emailHelpers.js';

// Send welcome email
await sendWelcomeEmailToUser(userId);

// Send bulk emails
await sendBulkEmailsToUsers(
  [userId1, userId2, userId3],
  'template-name',
  'Subject',
  { data: 'value' }
);
```

## API Endpoints

### Email Management

- `POST /api/emails/welcome/:userId` - Send welcome email
- `POST /api/emails/password-reset/:userId` - Send password reset email
- `POST /api/emails/lesson-completed` - Send lesson completed email
- `POST /api/emails/subscription-expired/:userId` - Send subscription expired email
- `POST /api/emails/course-recommendation` - Send course recommendation email
- `POST /api/emails/send` - Send custom email
- `POST /api/emails/bulk` - Send bulk emails

### Queue Management

- `GET /api/emails/queue/stats` - Get queue statistics
- `GET /api/emails/queue/job/:jobId` - Get job details
- `POST /api/emails/queue/retry-failed` - Retry failed jobs
- `DELETE /api/emails/queue/clear` - Clear queue
- `POST /api/emails/queue/pause` - Pause queue
- `POST /api/emails/queue/resume` - Resume queue

### User Preferences

- `GET /api/emails/preferences` - Get user email preferences
- `PUT /api/emails/preferences` - Update user email preferences
- `POST /api/emails/unsubscribe/:token` - Unsubscribe user

## Email Templates

The service includes pre-built templates for:

1. **Welcome Email** (`welcome.html`)
   - Sent to new users after registration
   - Includes welcome message and next steps

2. **Password Reset** (`password-reset.html`)
   - Sent when user requests password reset
   - Includes reset code and security notice

3. **Lesson Completed** (`lesson-completed.html`)
   - Sent when user completes a lesson
   - Shows progress and achievements

4. **Subscription Expired** (`subscription-expired.html`)
   - Sent when subscription expires
   - Includes renewal offer and benefits

5. **Course Recommendation** (`course-recommendation.html`)
   - Sent to recommend courses to users
   - Personalized based on user progress

## User Email Preferences

Users can control which emails they receive:

```javascript
{
  welcome: true,      // Welcome emails
  lessons: true,      // Lesson completion emails
  promotions: true,   // Promotional emails
  updates: true,      // System updates
  marketing: false    // Marketing emails
}
```

## Queue Configuration

The email queue supports:

- **Concurrency**: Process multiple emails simultaneously
- **Retry Logic**: Automatic retry for failed emails
- **Rate Limiting**: Prevent email spam
- **Job Management**: Monitor and manage email jobs
- **Scheduling**: Schedule emails for future delivery

## Monitoring

Monitor email queue performance:

```javascript
// Get queue statistics
const stats = await emailQueue.getStats();
console.log(stats);
// {
//   waiting: 5,
//   active: 2,
//   completed: 100,
//   failed: 3,
//   total: 110
// }
```

## Error Handling

The service includes comprehensive error handling:

- Failed emails are automatically retried
- Rate limiting prevents spam
- User preferences are respected
- Queue failures are logged and monitored

## Development

For development, the service uses Ethereal Email for testing:

```env
NODE_ENV=development
ETHEREAL_USER=ethereal.user@ethereal.email
ETHEREAL_PASS=ethereal.pass
```

## Production

For production, configure a real email service:

```env
NODE_ENV=production
EMAIL_SERVICE=sendgrid
EMAIL_USER=your_sendgrid_username
EMAIL_PASSWORD=your_sendgrid_password
```

## Security

- Email preferences are respected
- Rate limiting prevents abuse
- Unsubscribe functionality included
- Secure password reset flow
- Input validation on all endpoints

## Troubleshooting

### Common Issues

1. **Redis Connection Error**
   - Ensure Redis is running
   - Check Redis configuration

2. **Email Sending Fails**
   - Verify email credentials
   - Check SMTP settings
   - Review email service limits

3. **Queue Not Processing**
   - Check Redis connection
   - Verify queue processors
   - Monitor queue statistics

### Debug Mode

Enable debug logging:

```env
EMAIL_LOG_LEVEL=debug
```

## Contributing

When adding new email types:

1. Create HTML template in `templates/`
2. Add email type to `emailTypes` in `config/email.js`
3. Add processor to `emailQueue.js`
4. Add helper function to `emailHelpers.js`
5. Add API endpoint to `routes/emails.js`

## License

This email service is part of the Piano Lessons application.
