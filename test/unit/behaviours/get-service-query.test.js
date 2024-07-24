const Behaviour = require('../../../apps/hff/behaviours/get-service-query');
const reqres = require('hof').utils.reqres;

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
  });


  describe('The \'configure\' method', () => {
    beforeEach(() => {
      Base.prototype.configure = jest.fn().mockReturnValue(req, res, next);

      req.query = {
        form: 'ASC',
        returnUrl: 'https://www.fake-service.homeoffice.gov.uk'
      };
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should be called', () => {
      instance.configure(req, res, next);
      expect(Base.prototype.configure).toHaveBeenCalled();
    });

    test('should add req.query values to the session under correct keys', () => {
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-name')).toBe('ASC');
      expect(req.sessionModel.get('service-referrer-url')).toBe('https://www.fake-service.homeoffice.gov.uk');
    });

    test('should not add a service name query value to session if it does not match the proper format', () => {
      req.query = {
        form: 'ASC!',
        returnUrl: 'https://www.fake-service.homeoffice.gov.uk'
      };
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-name')).toBe(undefined);
    });

    test('should not add a returnUrl query value to session if it does not match the proper format', () => {
      req.query = {
        form: 'ASC',
        returnUrl: 'https://www.fake-service.attacker.com'
      };
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-url')).toBe(undefined);
      req.query = {
        form: 'ASC',
        returnUrl: 'fake-service.homeoffice.gov.uk'
      };
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-url')).toBe(undefined);
    });

    test('Referrer value will be added to session if it matches the proper format', () => {
      req.query = {
        form: 'ASC'
      };
      req.get = jest.fn().mockReturnValue('https://fake-service.homeoffice.gov.uk');
      // req.referrer = 'https://www.fake-service.homeoffice.gov.uk'
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-url')).toBe('https://fake-service.homeoffice.gov.uk');
    });

    test('Referrer value won\'t be added to session if it does not match the proper format', () => {
      req.query = {
        form: 'ASC'
      };
      req.get = jest.fn().mockReturnValue('fake-service.homeoffice.gov.uk');
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-url')).toBe(undefined);
      req.get = jest.fn().mockReturnValue('https://www.fake-service.attacker.com');
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-url')).toBe(undefined);
    });

    test('returnUrl value overrides Referrer value in session if both are present', () => {
      req.query.returnUrl = 'https://return-service.homeoffice.gov.uk'
      req.get = jest.fn().mockReturnValue('https://referrer-service.homeoffice.gov.uk');
      instance.configure(req, res, next);
      expect(req.sessionModel.get('service-referrer-url')).toBe('https://return-service.homeoffice.gov.uk');
    });
  });
});
