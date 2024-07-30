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

    const { mac } = req.query;
    const sentUrl = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
    const queryString = sentUrl.search?.split('&mac=')[0];

    try {
      const hashedAndHexed = createHmacDigest(algorithm, queryKey, queryString, encoding);

      if (mac === hashedAndHexed) {
        const { form, returnUrl } = req.query;

        if (form && serviceReferrerNameRegex.test(form)) {
          req.sessionModel.set('service-referrer-name', form);
        } else {
          logger.info(`Service name is undefined or formatting of ${form} is not valid`);
        }

        if (returnUrl && URL.canParse(returnUrl)) {
          const serviceUrl = new URL(returnUrl);
          const { origin } = serviceUrl;
          req.sessionModel.set('service-referrer-url', origin);
        } else {
          logger.info(`Service URL is undefined or formatting of ${returnUrl} is not valid`);
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
