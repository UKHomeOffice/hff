const serviceReferrerNameRegex = require('../../../config').regex.serviceReferrerName;

module.exports = superclass => class extends superclass {
  configure(req, res, next) {
    const { form, returnUrl } = req.query;

    if (serviceReferrerNameRegex.test(form)) {
      req.sessionModel.set('service-referrer-name', form);
    }

    if (URL.canParse(returnUrl) && returnUrl.endsWith('.homeoffice.gov.uk')) {
      req.sessionModel.set('service-referrer-url', returnUrl);
    }

    super.configure(req, res, next);
  }
};
