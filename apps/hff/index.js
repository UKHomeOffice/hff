'use strict';
const getServiceQuery = require('./behaviours/get-service-query');
const submitFeedback = require('./behaviours/submit-feedback');

module.exports = {
  name: 'hff',
  baseUrl: '/',
  steps: {
    '/': {
      fields: ['satisfaction', 'improvements'],
      behaviours: [getServiceQuery, submitFeedback],
      next: '/feedback-sent',
      template: process.env.TOGGLE == 'true' ? 'feedback' : 'feedback2'
    },
    '/feedback-sent': {
      clearSession: true,
      backLink: false
    },
    '/exit': {}
  },
  pages: {
    '/accessibility': 'static/accessibility'
  }
};