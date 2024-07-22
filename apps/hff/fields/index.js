'use strict';

module.exports = {
  satisfaction: {
    mixin: 'radio-group',
    options: [
      'very-satisfied',
      'satisfied',
      'neither-satisfied-or-dissatisfied',
      'dissatisfied',
      'very-dissatisfied'
    ]
  },
  improvements: {
    mixin: 'textarea',
    attributes: [{ attribute: 'rows', value: 5 }],
    validate: [
      'notUrl',
      { type: 'regex', arguments: /^[^\[\]\|<>]*$/ },
      { type: 'maxlength', arguments: 10000 }
    ]
  }
};
