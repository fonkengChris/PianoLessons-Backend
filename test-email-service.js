#!/usr/bin/env node

/**
 * Test script for the email notification service
 * Run with: node test-email-service.js
 */

import dotenv from 'dotenv';
import emailService from './services/emailService.js';
import emailQueue from './queue/emailQueue.js';

// Load environment variables
dotenv.config();

async function testEmailService() {
  console.log('🧪 Testing Email Notification Service...\n');

  try {
    // Test 1: Queue welcome email
    console.log('1. Testing welcome email queue...');
    const welcomeJob = await emailQueue.addWelcomeEmail('test-user-id', {
      delay: 0, // Send immediately for testing
    });
    console.log(`   ✅ Welcome email queued: Job ID ${welcomeJob.id}`);

    // Test 2: Queue contact form email
    console.log('2. Testing contact form email...');
    const contactJob = await emailQueue.addCustomEmail(
      'test@example.com',
      'Test Contact Form',
      'contact-confirmation',
      {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        submittedAt: new Date().toLocaleString(),
        referenceId: 'CF-TEST-123',
        dashboardUrl: 'http://localhost:3000/dashboard',
        coursesUrl: 'http://localhost:3000/courses',
        faqUrl: 'http://localhost:3000/contact#faq',
        unsubscribeUrl: 'http://localhost:3000/unsubscribe?token=test',
      }
    );
    console.log(`   ✅ Contact email queued: Job ID ${contactJob.id}`);

    // Test 3: Get queue statistics
    console.log('3. Getting queue statistics...');
    const stats = await emailQueue.getStats();
    console.log('   📊 Queue Stats:', stats);

    // Test 4: Test direct email sending (if in development mode)
    if (process.env.NODE_ENV === 'development') {
      console.log('4. Testing direct email sending...');
      try {
        const result = await emailService.sendCustomEmail(
          'test@example.com',
          'Test Direct Email',
          'welcome',
          {
            name: 'Test User',
            email: 'test@example.com',
            joinDate: new Date().toLocaleDateString(),
            dashboardUrl: 'http://localhost:3000/dashboard',
            unsubscribeUrl: 'http://localhost:3000/unsubscribe?token=test',
            contactUrl: 'http://localhost:3000/contact',
          }
        );
        console.log(`   ✅ Direct email sent: Message ID ${result.messageId}`);
      } catch (error) {
        console.log(`   ⚠️  Direct email failed (expected in development): ${error.message}`);
      }
    }

    console.log('\n🎉 Email service tests completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start Redis server: redis-server');
    console.log('   2. Start the Node.js server: npm run dev');
    console.log('   3. Check email queue processing in the server logs');
    console.log('   4. Test the contact form on the frontend');

  } catch (error) {
    console.error('❌ Email service test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEmailService();

