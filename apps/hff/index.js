'use strict';
const getServiceQuery = require('./behaviours/get-service-query');
const submitFeedback = require('./behaviours/submit-feedback');

module.exports = {
  name: 'hff',
  baseUrl: '/',
  steps: {
    '/feedback': {
      fields: ['satisfaction', 'improvements'],
      behaviours: [getServiceQuery, submitFeedback],
      next: '/feedback-sent'
    },
    '/feedback-sent': {
      clearSession: true,
      backLink: false
    }
  }
};
