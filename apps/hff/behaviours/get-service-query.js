const serviceReferrerNameRegex = require('../../../config').regex.serviceReferrerName;

module.exports = superclass => class extends superclass {
  configure(req, res, next) {
    const { form, returnUrl } = req.query;
    const referrer = req.get('referrer');

    if (typeof form === 'string' && serviceReferrerNameRegex.test(form)) {
      req.sessionModel.set('service-referrer-name', form);
    }

    if (URL.canParse(referrer)) {
      const referrerUrl = new URL(referrer);
      const { origin } = referrerUrl;
      if (typeof origin === 'string' && origin.endsWith('.homeoffice.gov.uk')) {
        req.sessionModel.set('service-referrer-url', origin);
      }
    }

    if (URL.canParse(returnUrl)) {
      const serviceUrl = new URL(returnUrl);
      const { origin } = serviceUrl;
      if (typeof origin === 'string' && origin.endsWith('.homeoffice.gov.uk')) {
        req.sessionModel.set('service-referrer-url', origin);
      }
    }

    super.configure(req, res, next);
  }
};
