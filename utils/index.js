// Print values from select options in ordinary sentence format.
const prettyPrintSentence = string => {
  if (!string || typeof string !== 'string') {
    throw new Error('Cannot pretty print a non string parameter');
  } else return string.replaceAll('-', ' ').replace(/^./, string[0].toUpperCase());
};

module.exports = { prettyPrintSentence };
