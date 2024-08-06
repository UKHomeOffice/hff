const config = require('../../../config');
const logger = require('hof/lib/logger')({ env: config.env });
const { notifyApiKey, feedbackInbox, feedbackSubmissionTemplateId } = config.govukNotify;

const { getLabel } = require('../../../utils');

const NotifyClient = require('notifications-node-client').NotifyClient;
const Notify = new NotifyClient(notifyApiKey);

module.exports = superclass => class extends superclass {
  async saveValues(req, res, next) {
    const satisfactionValue = req.form.values.satisfaction;
    let satisfaction;
    if (satisfactionValue && typeof satisfactionValue === 'string') {
      satisfaction = getLabel('satisfaction', satisfactionValue) ?? satisfactionValue;
    }
    const improvements = req.form.values.improvements;

    // redirect to /feedback-sent without further action if no feedback supplied in submission
    if (!satisfaction && !improvements) return super.saveValues(req, res, next);

    const serviceName = req.sessionModel.get('service-referrer-name');
    const serviceReturnUrl = req.sessionModel.get('service-referrer-url');
    const serviceLink = serviceName && serviceReturnUrl ? `[${serviceName}](${serviceReturnUrl})` : serviceName;

    const emailProps = {
      service_given: serviceName ? 'yes' : 'no',
      service_name: serviceName || '',
      service_link: serviceLink || '',
      satisfaction: satisfaction || 'Not supplied',
      improvements: improvements || 'Not supplied'
    };

    try {
      await Notify.sendEmail(feedbackSubmissionTemplateId, feedbackInbox, { personalisation: emailProps });
      logger.info(`Feedback sent successfully for: ${serviceName ?? 'service/form name not given'}`);
    } catch (error) {
      const errorDetails = error.response?.data ? `Cause: ${JSON.stringify(error.response.data)}` : '';
      const errorCode = error.code ? `${error.code} -` : '';
      const errorMessage = `${errorCode} ${error.message}; ${errorDetails}`;

      logger.error(`Failed to send feedback email: ${errorMessage}`);
      return next(error);
    }

    return super.saveValues(req, res, next);
  }
};
