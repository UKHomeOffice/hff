const { prettyPrintSentence } = require('../../utils');

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
