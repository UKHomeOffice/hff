const config = require('../../../config');
const logger = require('hof/lib/logger')({ env: config.env });
const { notifyApiKey, feedbackInbox, feedbackSubmissionTemplateId } = config.govukNotify;

const { prettyPrintSentence } = require('../../../utils');

const NotifyClient = require('notifications-node-client').NotifyClient;
const Notify = new NotifyClient(notifyApiKey);

module.exports = superclass => class extends superclass {
  async saveValues(req, res, next) {
    let satisfaction = req.form.values.satisfaction;
    if (satisfaction && typeof satisfaction === 'string') {
      satisfaction = prettyPrintSentence(satisfaction);
    };
    const improvements = req.form.values.improvements;

    // redirect to /feedback-sent without further action if no feedback supplied in submission
    if (!satisfaction && !improvements) return super.saveValues(req, res, next)

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
      logger.error('Failed to send feedback email:', error);
      return next(error);
    }

    return super.saveValues(req, res, next);
  }
};
