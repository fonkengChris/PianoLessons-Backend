import pkg from '@paypal/paypal-server-sdk';
const { Client, Environment } = pkg;

// Configure PayPal environment
const environment = process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox;

// Use mock credentials if not provided
const clientId = process.env.PAYPAL_CLIENT_ID || 'mock_client_id';
const clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'mock_client_secret';

const client = new Client({
  clientId: clientId,
  clientSecret: clientSecret,
  environment: environment
});

export class PayPalService {
  static async createOrder(amount, currency = 'USD', description = 'Piano Lessons Subscription') {
    try {
      // For now, return a mock response since PayPal SDK integration needs proper setup
      // In production, you would use the actual PayPal SDK
      const mockOrderId = 'MOCK_ORDER_' + Date.now();
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const mockApprovalUrl = `${frontendUrl}/payment/success?token=${mockOrderId}&PayerID=MOCK_PAYER`;
      
      return {
        success: true,
        orderId: mockOrderId,
        approvalUrl: mockApprovalUrl
      };
    } catch (error) {
      console.error('PayPal create order error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async captureOrder(orderId) {
    try {
      // Mock capture for testing
      return {
        success: true,
        transactionId: 'MOCK_TXN_' + Date.now(),
        payerId: 'MOCK_PAYER',
        amount: '19.99',
        currency: 'USD'
      };
    } catch (error) {
      console.error('PayPal capture order error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async getOrderDetails(orderId) {
    try {
      // Mock order details for testing
      return {
        success: true,
        order: {
          id: orderId,
          status: 'COMPLETED',
          amount: '19.99',
          currency: 'USD'
        }
      };
    } catch (error) {
      console.error('PayPal get order error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
