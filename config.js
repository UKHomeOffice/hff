'use strict';
/* eslint no-process-env: 0 */

const env = process.env.NODE_ENV || 'production';

module.exports = {
  PRETTY_DATE_FORMAT: 'DD MMMM YYYY',
  dateTimeFormat: 'DD MMM YYYY HH:mm:ss',
  env: env,
  govukNotify: {
    notifyApiKey: process.env.NOTIFY_KEY,
    feedbackInbox: process.env.FEEDBACK_INBOX,
    feedbackSubmissionTemplateId: process.env.FEEDBACK_TEMPLATE_ID
  },
  hosts: {
    acceptanceTests: process.env.ACCEPTANCE_HOST_NAME || `http://localhost:${process.env.PORT || 8080}`
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
    serviceReferrerName: /^[\w\s\-]*$/
  }
};
