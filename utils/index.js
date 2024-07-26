const { createHmac } = require('node:crypto');

// Print values from select options in ordinary sentence format.
const prettyPrintSentence = string => {
  if (!string || typeof string !== 'string') {
    throw new Error('Cannot pretty print a non string parameter');
  } else return string.replaceAll('-', ' ').replace(/^./, string[0].toUpperCase());
};

// Create a HMAC digest from key and message
const createHmacDigest = (algorithm, key, message, encoding) => {
  return createHmac(algorithm, key).update(message).digest(encoding);
};

module.exports = { prettyPrintSentence, createHmacDigest };
