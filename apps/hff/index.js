'use strict';

module.exports = {
  name: 'hff',
  baseUrl: '/',
  steps: {
    '/feedback': {
      fields: [],
      next: '/feedback-sent'
    }
  }
};
