const Behaviour = require('../../../apps/hff/behaviours/get-service-query');
const reqres = require('hof').utils.reqres;

let utils = require('../../../utils')
jest.mock('../../../utils');

// jest.mock('../../../config.js', () => {
//   const originalModule = jest.requireActual('../../../config.js');
//   return {
//     ...originalModule,
//     hmac: {
//       queryKey: 'skeletonKey',
//       algorithm: 'sha256',
//       encoding: 'hex'
//     }
//   };
// });

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
    process.env.QUERY_KEY = 'skeletonKey';
  });


  describe('The \'configure\' method', () => {
    beforeEach(() => {
      Base.prototype.configure = jest.fn().mockReturnValue(req, res, next);

      req.query = {
        form: 'ASC',
        returnUrl: 'https://www.fake-service.homeoffice.gov.uk',
        mac: '686173686564616e6468657865640a'
      };

      utils.createHmacDigest.mockReturnValue('686173686564616e6468657865640a');
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
      expect(utils.createHmacDigest).toHaveBeenCalledWith('sha256', 'skeletonKey', '', 'hex');
    });

   test('does not add a service name query value to session if it does not match the proper format', () => {
      req.query.form = 'ASC!',
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-name')).toBe(undefined);
    });

    test('does not add a returnUrl query value to session if it does not match the proper format', () => {
      req.query.returnUrl = 'fake-service.homeoffice.gov.uk';
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-url')).toBe(undefined);
    });

    test('does not add a returnUrl query value to session if form value wasn\'t present', () => {
      req.query.form = undefined;
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-url')).toBe(undefined);
    });

    test('does not set service-referrer-name and -url if no mac is added to query', () => {
      req.query = {
        form: 'ASC',
        returnUrl: 'https://www.fake-service.homeoffice.gov.uk',
      };
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-name')).toBe(undefined);
      expect(req.sessionModel.get('service-referrer-url')).toBe(undefined);
    });

    test('does not set service-referrer-name and -url if the query mac does not have the same signature as a new hash', () => {
      req.query = {
        form: 'ASC',
        returnUrl: 'https://www.fake-service.homeoffice.gov.uk',
        mac: '786173686564616e6468657865640b'
      };
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-name')).toBe(undefined);
      expect(req.sessionModel.get('service-referrer-url')).toBe(undefined);
    });

    test('returns early and do not attempt to create digest or store values if no query.mac is found', () => {
      req.query = {
        form: 'ASC',
        returnUrl: 'https://www.fake-service.homeoffice.gov.uk',
      };
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-name')).toBe(undefined);
      expect(req.sessionModel.get('service-referrer-url')).toBe(undefined);
      expect(utils.createHmacDigest).not.toHaveBeenCalled();
    });
  });

  describe('...when no QUERY_KEY exists in environment', () => {
    beforeAll(() => {
      delete process.env.QUERY_KEY;
    })

    test('returns early and do not attempt to create digest or store values', () => {
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-name')).toBe(undefined);
      expect(req.sessionModel.get('service-referrer-url')).toBe(undefined);
      expect(utils.createHmacDigest).not.toHaveBeenCalled();
    });
  })
});
