module.exports = superclass => class extends superclass {
  configure(req, res, next) {
    req.sessionModel.set('service-referrer-name', req.query.form);
    req.sessionModel.set('service-referrer-url', req.query.returnUrl);
    super.configure(req, res, next);
  }
};
