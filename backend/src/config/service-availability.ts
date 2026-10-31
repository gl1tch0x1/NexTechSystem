import { ENV } from './env.js';

export function serviceAvailability() {
  const production = ENV.NODE_ENV === 'production' || process.env.NODE_ENV === 'production';
  return {
    emailDelivery: Boolean(ENV.RESEND_API_KEY) || !production,
    orderEmailVerificationRequired: ENV.REQUIRE_ORDER_EMAIL_OTP,
    payments: {
      TAMARA: Boolean(ENV.TAMARA_API_TOKEN) || !production,
      TABBY: Boolean(ENV.TABBY_SECRET_KEY) || !production,
      CREDIT_CARD: false, // No card gateway adapter has been implemented.
    },
  };
}
