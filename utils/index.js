const { createHmac } = require('node:crypto');

// Print values from select options in ordinary sentence format.
const prettyPrintSentence = string => {
  if (!string || typeof string !== 'string') {
    throw new Error('Cannot pretty print a non string parameter');
  } else return string.replaceAll('-', ' ').replace(/^./, string[0].toUpperCase());
};

// Create a HMAC digest from key and message
const createHmacDigest = (algorithm, key, message, encoding) => {
  if (!algorithm) {
    throw new Error('You must provide a hashing algorithm e.g. \'sha256\'');
  } else if (!key) {
    throw new Error('You must provide a HMAC key');
  } else if (!message) {
    throw new Error('You must provide a message to hash');
  } else if (!encoding) {
    throw new Error('You must provide an output encoding e.g. \'hex\'');
  }
  return createHmac(algorithm, key).update(message).digest(encoding);
};

module.exports = { prettyPrintSentence, createHmacDigest };
