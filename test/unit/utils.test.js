const { getLabel, createHmacDigest } = require('../../utils');

describe('Utilities \'getLabel\' ', () => {
  test('replaces the correct label from value for \'satisfaction\' field', () => {
    expect(getLabel('satisfaction', 'very-satisfied')).toBe('Very satisfied');
    expect(getLabel('satisfaction', 'satisfied')).toBe('Satisfied');
    expect(getLabel('satisfaction', 'neither-satisfied-or-dissatisfied')).toBe('Neither satisfied or dissatisfied');
    expect(getLabel('satisfaction', 'dissatisfied')).toBe('Dissatisfied');
    expect(getLabel('satisfaction', 'very-dissatisfied')).toBe('Very dissatisfied');
  });

  test('returns undefined when an unexpected fieldKey parameter is passed', () => {
    expect(getLabel('cheese', 'very-satisfied')).toBe(undefined);
    expect(getLabel(null, 'very-satisfied')).toBe(undefined);
    expect(getLabel(undefined, 'very-satisfied')).toBe(undefined);
  });

  test('returns undefined when an unexpected fieldValue parameter is passed', () => {
    expect(getLabel('satisfaction', 'very-cheese')).toBe(undefined);
    expect(getLabel('satisfaction', null)).toBe(undefined);
    expect(getLabel('satisfaction', undefined)).toBe(undefined);
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
