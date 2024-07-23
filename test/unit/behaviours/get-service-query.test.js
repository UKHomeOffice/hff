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
        returnUrl: 'https://...'
      };

      instance.configure(req, res, next);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should be called', () => {
      expect(Base.prototype.configure).toHaveBeenCalled()
    });

    test('should add req.query values to the session under correct keys', () => {
      expect(req.sessionModel.get('service-referrer-name')).toBe('ASC');
      expect(req.sessionModel.get('service-referrer-url')).toBe('https://...');
    });
  });
});