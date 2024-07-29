const { prettyPrintSentence, createHmacDigest } = require('../../utils');

describe('Utilities \'prettyPrintSentence\' ', () => {
  test('replaces all hyphens in a string with spaces', () => {
    const processedString = prettyPrintSentence('test-string-value');
    expect(processedString).toBe('Test string value');
    expect(processedString).not.toContain('-');
  });

  test('replaces the first letter of a string with its uppercase version', () => {
    let processedString = prettyPrintSentence('test-string-value');
    expect(processedString).toBe('Test string value');
    expect(processedString[0]).toBe('T');
    processedString = prettyPrintSentence('14565');
    expect(processedString[0]).toBe('1');
  });

  test('handles unexpected values by throwing an error', () => {
    expect(() => prettyPrintSentence('')).toThrow(new Error('Cannot pretty print a non string parameter'));
    expect(() => prettyPrintSentence(null)).toThrow(new Error('Cannot pretty print a non string parameter'));
    expect(() => prettyPrintSentence(undefined)).toThrow(new Error('Cannot pretty print a non string parameter'));
    expect(() => prettyPrintSentence(12345)).toThrow(new Error('Cannot pretty print a non string parameter'));
    expect(() => prettyPrintSentence()).toThrow(new Error('Cannot pretty print a non string parameter'));
  });
});

describe('Utilities \'createHmacDigest\' ', () => {
  test('returns a string being of the correct length', () => {
    const newMac = createHmacDigest('sha256', 'skeletonKey', 'message to hash', 'hex');
    expect(typeof newMac).toBe('string');
    expect(newMac.length).toBe(64);
  });

  test('HMACs of different messages cannot be matched', () => {
    const mac1 = createHmacDigest('sha256', 'skeletonKey', 'message one', 'hex');
    const mac2 = createHmacDigest('sha256', 'skeletonKey', 'message two', 'hex');
    expect(mac1 === mac2).toBe(false);
  });

  test('HMACs signed with different keys cannot be matched', () => {
    const mac1 = createHmacDigest('sha256', 'skeletonKey', 'my message', 'hex');
    const mac2 = createHmacDigest('sha256', 'fakeSkeletonKey', 'my message', 'hex');
    expect(mac1 === mac2).toBe(false);
  });

  test('returns an error when algorithm parameter is not supplied', () => {
    expect(() => createHmacDigest(null, 'skeletonKey', 'message text', 'hex'))
      .toThrow(new Error('You must provide a hashing algorithm e.g. \'sha256\''));
  });

  test('returns an error when key parameter is not supplied', () => {
    expect(() => createHmacDigest('sha256', null, 'message text', 'hex'))
      .toThrow(new Error('You must provide a HMAC key'));
  });

  test('returns an error when message parameter is not supplied', () => {
    expect(() => createHmacDigest('sha256', 'skeletonKey', null, 'hex'))
      .toThrow(new Error('You must provide a message to hash'));
  });

  test('returns an error when encoding parameter is not supplied', () => {
    expect(() => createHmacDigest('sha256', 'skeletonKey', 'message text'))
      .toThrow(new Error('You must provide an output encoding e.g. \'hex\''));
  });
});
