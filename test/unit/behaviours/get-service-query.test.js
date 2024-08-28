const Behaviour = require('../../../apps/hff/behaviours/get-service-query');
const reqres = require('hof').utils.reqres;

const utils = require('../../../utils');
jest.mock('../../../utils', () => {
  const originalModule = jest.requireActual('../../../utils');
  return {
    ...originalModule,
    createHmacDigest: jest.fn().mockReturnValue('5045060455395a109a61689ee2f5d989e3df3dc24e1768e00853b34b800df148')
  };
});

describe('get-service-query behaviour', () => {
  test('Behaviour exports a function', () => {
    expect(typeof Behaviour).toBe('function');
  });

  class Base {
    configure() {}
  }

  let req;
  let res;
  let instance;
  let next;
  let GetServiceQuery;

  beforeEach(() => {
    req = reqres.req();
    res = reqres.res();
    next = jest.fn();

    GetServiceQuery = Behaviour(Base);
    instance = new GetServiceQuery;
    Base.prototype.configure = jest.fn().mockReturnValue(req, res, next);
  });


  describe('The \'configure\' method', () => {
    beforeEach(() => {
      req.query = {
        // 'ASC' in hex
        form: '415343',
        // 'https://www.fake-service.homeoffice.gov.uk' in hex
        returnUrl: '68747470733a2f2f7777772e66616b652d736572766963652e686f6d656f66666963652e676f762e756b',
        mac: '5045060455395a109a61689ee2f5d989e3df3dc24e1768e00853b34b800df148'
      };
    });


    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should be called', () => {
      instance.configure(req, res, next);
      expect(Base.prototype.configure).toHaveBeenCalled();
    });

    test('adds req.query values to the session under correct keys and values', () => {
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-name')).toBe('ASC');
      expect(req.sessionModel.get('service-referrer-url')).toBe('https://www.fake-service.homeoffice.gov.uk');
      expect(utils.createHmacDigest).toHaveBeenCalledWith(
        'sha256',
        'skeletonKey',
        JSON.stringify({ form: req.query.form, returnUrl: req.query.returnUrl }),
        'hex'
      );
    });

    test('adds form values containing spaces to sessionModel', () => {
      // 'new form' in hex
      req.query.form = '6e657720666f726d';
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-name')).toBe('new form');
    });

    test('does not add a service name query value to session if it does not match the proper format', () => {
      // 'ASC!' in hex
      req.query.form = '41534321';
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-name')).toBe(undefined);
    });

    test('does not add a returnUrl query value to session if it does not match the proper format', () => {
      // 'fake-service.homeoffice.gov.uk' in hex
      req.query.returnUrl = '66616b652d736572766963652e686f6d656f66666963652e676f762e756b';
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-url')).toBe(undefined);
    });

    test('does not set service-referrer-name and -url if the query mac does not match a new hash', () => {
      req.query = {
        // 'ASC!' in hex
        form: '41534321',
        // 'https://www.fake-service.homeoffice.gov.uk' in hex
        returnUrl: '68747470733a2f2f7777772e66616b652d736572766963652e686f6d656f66666963652e676f762e756b',
        mac: '786173686564616e6468657865640b'
      };
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-name')).toBe(undefined);
      expect(req.sessionModel.get('service-referrer-url')).toBe(undefined);
    });

    test('returns early and do not attempt to create digest or store values if no query.mac is found', () => {
      req.query = {
        // 'ASC' in hex
        form: '415343',
        // 'https://www.fake-service.homeoffice.gov.uk' in hex
        returnUrl: '68747470733a2f2f7777772e66616b652d736572766963652e686f6d656f66666963652e676f762e756b'
      };
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-name')).toBe(undefined);
      expect(req.sessionModel.get('service-referrer-url')).toBe(undefined);
      expect(utils.createHmacDigest).not.toHaveBeenCalled();
    });

    test('still returns if an error that was detected in validation', () => {
      utils.createHmacDigest.mockImplementation(() => {
        throw new Error('Test error');
      });
      instance.configure(req, res, next);
      expect(Base.prototype.configure).toHaveReturned();
    });
  });

  describe('When no QUERY_KEY exists in environment', () => {
    const originalEnv = process.env;

    beforeAll(() => {
      delete process.env.QUERY_KEY;
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    test('returns early and does not attempt to create digest or store values', () => {
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-name')).toBe(undefined);
      expect(req.sessionModel.get('service-referrer-url')).toBe(undefined);
      expect(utils.createHmacDigest).not.toHaveBeenCalled();
    });
  });
});
