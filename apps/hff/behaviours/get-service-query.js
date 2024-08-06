const config = require('../../../config');
const serviceReferrerNameRegex = config.regex.serviceReferrerName;
const { queryKey, algorithm, encoding } = config.hmac;
const logger = require('hof/lib/logger')({ env: config.env });
const { createHmacDigest } = require('../../../utils');
module.exports = superclass => class extends superclass {
  configure(req, res, next) {
    if (!req.query || !req.query.mac || !queryKey) {
      return super.configure(req, res, next);
    }

    const { form, returnUrl, mac } = req.query;

    try {
      const comparisonObject = {};

      if (form) {
        comparisonObject.form = decodeURIComponent(form);
      }

      if (returnUrl) {
        comparisonObject.returnUrl = decodeURIComponent(returnUrl);
      }

      const comparisonString = JSON.stringify(comparisonObject);

      const hashedAndHexed = createHmacDigest(null, queryKey, comparisonString, encoding);

      if (mac === hashedAndHexed) {
        logger.info('HMAC matched OK');
        const decodedForm = comparisonObject.form;
        const decodedReturnUrl = comparisonObject.returnUrl;

        if (decodedForm && serviceReferrerNameRegex.test(decodedForm)) {
          req.sessionModel.set('service-referrer-name', decodedForm);
        } else {
          logger.info(`Service name is undefined or formatting of ${decodedForm} is not valid`);
        }

        if (decodedReturnUrl && URL.canParse(decodedReturnUrl)) {
          const serviceUrl = new URL(decodedReturnUrl);
          const { origin } = serviceUrl;
          req.sessionModel.set('service-referrer-url', origin);
        } else {
          logger.info(`Service URL is undefined or formatting of ${decodedReturnUrl} is not valid`);
        }
      } else {
        logger.error('given mac query parameter does not match new HMAC');
      }
    } catch (error) {
      logger.error('There was a problem matching query to validation requirements', error);
    }
    return super.configure(req, res, next);
  }
};
