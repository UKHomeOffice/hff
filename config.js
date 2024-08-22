'use strict';
/* eslint no-process-env: 0 */

const env = process.env.NODE_ENV || 'production';

module.exports = {
  env: env,
  govukNotify: {
    notifyApiKey: process.env.NOTIFY_KEY,
    feedbackInbox: process.env.FEEDBACK_INBOX,
    feedbackSubmissionTemplateId: process.env.FEEDBACK_TEMPLATE_ID
  },
  redis: {
    port: process.env.REDIS_PORT || '6379',
    host: process.env.REDIS_HOST || '127.0.0.1'
  },
  hmac: {
    queryKey: process.env.QUERY_KEY,
    algorithm: 'sha256',
    encoding: 'hex'
  },
  regex: {
    serviceReferrerName: /^[\w\s\-]*$/,
    base64Pattern: /^[A-Za-z0-9+/=]+$/,
    macPattern: /^[a-fA-F0-9]{64}$/
  }
};
