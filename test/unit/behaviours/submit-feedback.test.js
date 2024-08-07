const Behaviour = require('../../../apps/hff/behaviours/submit-feedback');
const reqres = require('hof').utils.reqres;

jest.mock('../../../config.js', () => {
  const originalModule = jest.requireActual('../../../config.js');
  return {
    ...originalModule,
    govukNotify: {
      notifyApiKey: 'test',
      feedbackInbox: 'sas-hof-test@digital.homeoffice.gov.uk',
      feedbackSubmissionTemplateId: '123-123'
    }
  };
});

const utils = require('../../../utils');
jest.mock('../../../utils');

const NotifyClient = require('notifications-node-client').NotifyClient;

describe('submit-feedback behaviour', () => {
  test('Behaviour exports a function', () => {
    expect(typeof Behaviour).toBe('function');
  });

  class Base {
    saveValues() {}
  }

  let req;
  let res;
  let instance;
  let next;
  let emailProps;
  let SubmitFeedback;

  beforeEach(() => {
    req = reqres.req();
    res = reqres.res();
    next = jest.fn();

    SubmitFeedback = Behaviour(Base);
    instance = new SubmitFeedback();
  });

  describe('The \'saveValues\' method', () => {
    beforeEach(() => {
      Base.prototype.saveValues = jest.fn().mockReturnValue(req, res, next);
      NotifyClient.prototype.sendEmail = jest.fn().mockResolvedValue({data: {}});

      req.form.values = {
        satisfaction: 'very-satisfied',
        improvements: 'A list of improvements...'
      };

      utils.getLabel.mockReturnValue('Very satisfied');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('saveValues should be called', async () => {
      await instance.saveValues(req, res, next);
      expect(Base.prototype.saveValues).toHaveBeenCalled();
    });

    test('Notify sendEmail should be called', async () => {
      await instance.saveValues(req, res, next);
      expect(NotifyClient.prototype.sendEmail).toHaveBeenCalled();
    });

    test('Notify sendEmail called with the correct prop object (w/o service info)', async () => {
      emailProps = {
        service_given: 'no',
        service_name: '',
        service_link: '',
        satisfaction: 'Very satisfied',
        improvements: 'A list of improvements...'
      };
      await instance.saveValues(req, res, next);
      expect(NotifyClient.prototype.sendEmail)
        .toHaveBeenCalledWith('123-123', 'sas-hof-test@digital.homeoffice.gov.uk', { personalisation: emailProps });
    });

    test('Notify sendEmail called with the correct prop object (with service info)', async () => {
      req.sessionModel.set('service-referrer-name', 'ASC');
      req.sessionModel.set('service-referrer-url', 'https://...');
      emailProps = {
        service_given: 'yes',
        service_name: 'ASC',
        service_link: '[ASC](https://...)',
        satisfaction: 'Very satisfied',
        improvements: 'A list of improvements...'
      };
      await instance.saveValues(req, res, next);
      expect(NotifyClient.prototype.sendEmail)
        .toHaveBeenCalledWith('123-123', 'sas-hof-test@digital.homeoffice.gov.uk', { personalisation: emailProps });
    });

    test('if getLabel function returns undefined a backup value is assigned to session', async () => {
      utils.getLabel.mockReturnValue(undefined);

      emailProps = {
        service_given: 'no',
        service_name: '',
        service_link: '',
        satisfaction: 'very-satisfied',
        improvements: 'A list of improvements...'
      };
      await instance.saveValues(req, res, next);
      expect(NotifyClient.prototype.sendEmail)
        .toHaveBeenCalledWith('123-123', 'sas-hof-test@digital.homeoffice.gov.uk', { personalisation: emailProps });
    });

    test('(I can\'t get no) Satisfaction', async () => {
      req.form.values.satisfaction = '';
      emailProps = {
        service_given: 'no',
        service_name: '',
        service_link: '',
        satisfaction: 'Not supplied',
        improvements: 'A list of improvements...'
      };
      await instance.saveValues(req, res, next);
      expect(NotifyClient.prototype.sendEmail)
        .toHaveBeenCalledWith('123-123', 'sas-hof-test@digital.homeoffice.gov.uk', { personalisation: emailProps });
    });

    test('Notify sendEmail called with the correct prop object (no improvements)', async () => {
      req.form.values.improvements = '';
      emailProps = {
        service_given: 'no',
        service_name: '',
        service_link: '',
        satisfaction: 'Very satisfied',
        improvements: 'Not supplied'
      };
      await instance.saveValues(req, res, next);
      expect(NotifyClient.prototype.sendEmail)
        .toHaveBeenCalledWith('123-123', 'sas-hof-test@digital.homeoffice.gov.uk', { personalisation: emailProps });
    });

    test('Notify is not called when no feedback is given', async () => {
      req.form.values = {};
      await instance.saveValues(req, res, next);
      expect(NotifyClient.prototype.sendEmail).not.toHaveBeenCalled();
    });

    test('Notify errors are detected and passed to next()', async () => {
      NotifyClient.prototype.sendEmail = jest.fn().mockRejectedValue(new Error('Notify error'));
      await instance.saveValues(req, res, next);
      expect(NotifyClient.prototype.sendEmail).toHaveBeenCalled();
      expect(next).toHaveBeenCalled;
      expect(next).toHaveBeenCalledWith(new Error('Notify error'));
    });
  });
});
