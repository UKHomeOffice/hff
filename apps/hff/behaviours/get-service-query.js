const config = require('../../../config');
const serviceReferrerNameRegex = config.regex.serviceReferrerName;
const macPatternRegex = config.regex.macPattern;
const hexPatternRegex = config.regex.hexPattern;
const { queryKey, algorithm, encoding } = config.hmac;
const { createHmacDigest, hexDecode } = require('../../../utils');
module.exports = superclass => class extends superclass {
  process(req, res, next) {
    if (!req.query || !req.query.mac || !queryKey) {
      return super.process(req, res, next);
    }

    const { form: encodedForm, returnUrl: encodedReturnUrl, mac } = req.query;

    if (!macPatternRegex.test(mac)) {
      req.log('warn', 'MAC query parameter is not valid');
      return super.process(req, res, next);
    }

    if (encodedForm && !hexPatternRegex.test(encodedForm)) {
      req.log('warn', 'Form query parameter is not valid hex encoding');
      return super.process(req, res, next);
    }

    if (encodedReturnUrl && !hexPatternRegex.test(encodedReturnUrl)) {
      req.log('warn', 'ReturnURL query parameter is not valid hex encoding');
      return super.process(req, res, next);
    }

    try {
      const comparisonObject = {};

      if (encodedForm) {
        comparisonObject.form = encodedForm;
      }

      if (encodedReturnUrl) {
        comparisonObject.returnUrl = encodedReturnUrl;
      }

      const comparisonString = JSON.stringify(comparisonObject);
      const hashedAndHexed = createHmacDigest(algorithm, queryKey, comparisonString, encoding);

      if (mac === hashedAndHexed) {
        req.log('info', 'HMAC matched OK');
        const decodedForm = hexDecode(encodedForm);
        const decodedReturnUrl = hexDecode(encodedReturnUrl);

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
    return super.process(req, res, next);
  }
};
