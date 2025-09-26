import axios from 'axios';
import crypto from 'crypto';

export class MTNMobileMoneyService {
  constructor() {
    this.baseUrl = process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
    this.apiKey = process.env.MTN_MOMO_API_KEY;
    this.apiSecret = process.env.MTN_MOMO_API_SECRET;
    this.subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY;
    this.environment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
  }

  // Generate UUID for transaction reference
  generateTransactionId() {
    return crypto.randomUUID();
  }

  // Generate access token for MTN API
  async generateAccessToken() {
    try {
      const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
      
      const response = await axios.post(
        `${this.baseUrl}/collection/token/`,
        {},
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error('MTN Access Token Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Request payment from user
  async requestPayment(amount, phoneNumber, externalId, description = 'Piano Lessons Subscription') {
    try {
      // For testing, return a mock response since MTN API credentials are not configured
      const transactionId = this.generateTransactionId();
      const currency = 'XAF'; // Central African CFA franc for Cameroon

      console.log('MTN Payment Request (Mock):', {
        amount,
        phoneNumber,
        externalId,
        description,
        transactionId
      });

      return {
        success: true,
        transactionId: transactionId,
        status: 'PENDING',
        amount: amount,
        currency: currency,
        phoneNumber: phoneNumber
      };
    } catch (error) {
      console.error('MTN Payment Request Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Check payment status
  async getPaymentStatus(transactionId) {
    try {
      // For testing, return a mock successful status
      console.log('MTN Payment Status Check (Mock):', transactionId);
      
      return {
        success: true,
        status: 'SUCCESSFUL',
        amount: '19.99',
        currency: 'XAF',
        externalId: transactionId,
        payer: {
          partyId: '237654987123'
        }
      };
    } catch (error) {
      console.error('MTN Payment Status Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Validate phone number format for Cameroon
  static validateCameroonPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Cameroon phone number patterns
    const patterns = [
      /^2376[0-9]{8}$/, // +237 6XX XXX XXX
      /^2372[0-9]{8}$/, // +237 2XX XXX XXX
      /^6[0-9]{8}$/,    // 6XX XXX XXX (without country code)
      /^2[0-9]{8}$/     // 2XX XXX XXX (without country code)
    ];

    return patterns.some(pattern => pattern.test(cleaned));
  }

  // Format phone number for MTN API
  static formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (!cleaned.startsWith('237')) {
      cleaned = '237' + cleaned;
    }
    
    return cleaned;
  }
}
