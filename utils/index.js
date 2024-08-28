const { createHmac } = require('node:crypto');
const { Buffer } = require('node:buffer');
const translations = require('../apps/hff/translations/src/en/fields.json');

const getLabel = (fieldKey, fieldValue) => {
  return translations[fieldKey]?.options[fieldValue]?.label;
};

// Create a HMAC digest from key and message
const createHmacDigest = (algorithm, key, message, encoding) => {
  if (!algorithm) {
    throw new Error('You must provide a hashing algorithm e.g. \'sha256\'');
  }

  if (!key) {
    throw new Error('You must provide a HMAC key');
  }

  if (!message) {
    throw new Error('You must provide a message to hash');
  }

  if (!encoding) {
    throw new Error('You must provide an output encoding e.g. \'hex\'');
  }

  return createHmac(algorithm, key).update(message).digest(encoding);
};

const hexDecode = data => {
  return data ? Buffer.from(data, 'hex').toString('utf8') : undefined;
};

module.exports = { getLabel, createHmacDigest, hexDecode };
