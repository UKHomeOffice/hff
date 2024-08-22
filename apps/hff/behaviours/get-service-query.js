const config = require('../../../config');
const serviceReferrerNameRegex = config.regex.serviceReferrerName;
const macPatternRegex = config.regex.macPattern;
const base64PatternRegex = config.regex.base64Pattern;
const { queryKey, algorithm, encoding } = config.hmac;
const { createHmacDigest } = require('../../../utils');
module.exports = superclass => class extends superclass {
  configure(req, res, next) {
    if (!req.query || !req.query.mac || !queryKey) {
      return super.configure(req, res, next);
    }

    const { form: formBase64, returnUrl: returnUrlBase64, mac } = req.query;

    if (!macPatternRegex.test(mac)) {
      req.log('warn', 'MAC query parameter is not valid');
      return super.configure(req, res, next);
    }

    if (!base64PatternRegex.test(formBase64) || !base64PatternRegex.test(returnUrlBase64)) {
      req.log('warn', 'Either form or returnURL query parameter is invalid');
      return super.configure(req, res, next);
    }

    try {
      const comparisonObject = {};

      if (formBase64) {
        comparisonObject.form = formBase64;
      }

      if (returnUrlBase64) {
        comparisonObject.returnUrl = returnUrlBase64;
      }

      const comparisonString = JSON.stringify(comparisonObject);
      const hashedAndHexed = createHmacDigest(algorithm, queryKey, comparisonString, encoding);

      if (mac === hashedAndHexed) {
        req.log('info', 'HMAC matched OK');
        const decodedForm = atob(formBase64);
        const decodedReturnUrl = atob(returnUrlBase64);

        if (decodedForm && serviceReferrerNameRegex.test(decodedForm)) {
          req.sessionModel.set('service-referrer-name', decodedForm);
        } else {
          req.log('warn', `Service name is undefined or formatting of [${decodedForm}] is not valid`);
        }

        if (decodedReturnUrl && URL.canParse(decodedReturnUrl)) {
          const serviceUrl = new URL(decodedReturnUrl);
          const { origin } = serviceUrl;
          req.sessionModel.set('service-referrer-url', origin);
        } else {
          req.log('warn', `Service URL is undefined or formatting of [${decodedReturnUrl}] is not valid`);
        }
      } else {
        req.log('warn', 'Given mac query parameter does not match new HMAC');
      }
    } catch (error) {
      req.log('error', 'There was a problem matching query to validation requirements', error);
    }
    return super.configure(req, res, next);
  }
};
