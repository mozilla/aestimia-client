const Api = require('./api');
const _ = require('underscore');

const models = require('./models');

const DEFAULT_MIN_WORDS = 0;
const DEFAULT_CANNED_RESPONSES = [
  'You did a great job!',
  'You went above and beyond.',
  'Keep up the good work!',
  'Good job.',
  'You met all the criteria needed to earn this badge.',
  'Creative and thoughtful work.',
  'Nice reflection of your work.',
  'You didn\'t submit relevant evidence.',
  'Your evidence did not properly reflect the criteria.',
  'Good work! But you still have a few criteria to meet to earn this badge. Make sure you take a look at all the criteria before reapplying.'
];
const DEFAULT_RUBRIC = {
  text: 'Has done some work',
  required: true
}

exports = module.exports = function (config) {
  // The Aestimia server URL
  const ENDPOINT = config.endpoint;
  // Aestimia authentication secret
  const SECRET = config.secret;

  // Minimum word count required for valid application descriptions
  const MIN_WORDS = config.minWords || DEFAULT_MIN_WORDS;
  // List of responses to use in sensitive-applicant situations
  const CANNED_RESPONSES = config.cannedResponses || DEFAULT_CANNED_RESPONSES;
  // Logging callback function
  const LOGGER = config.logger || function (data) {};

  if (!ENDPOINT)
    throw new ReferenceError('endpoint is not defined');
  if (!SECRET)
    throw new ReferenceError('secret is not defined');
  if (!_.isFunction(LOGGER))
    throw new TypeError('logger is not of type `function`');

  var aestimia = new Api(ENDPOINT, {

    /**
     * Submit an application to an Aestimia server
     *
     * @param {Application} application The <application> to be submitted
     * @param {function} callback Callback function
     */
    submit: function (application, callback) {
      var api = this;
      var description = (application.description||'').trim().replace(/[^a-z0-9\s]/ig, '');
      var wordcount = !!description ? description.split(/\s+/).length : 0;

      application.getEvidence(function(err, evidence) {
        if (err)
          return callback(err);

        if (!evidence)
          evidence = [];

        if (!_.isArray(evidence))
          return callback(new TypeError('evidence not of type `array`'));

        if (!evidence.length && wordcount < MIN_WORDS)
          return callback(new Error('Insufficient evidence for this application'));

        application.getApplicant(function(err, applicant) {
          if (err)
            return callback(err);

          application.getBadge(function(err, badge) {
            if (err)
              return callback(err);

            var rubric = badge.rubric || [DEFAULT_RUBRIC];
            if (_.isArray(rubric))
              rubric = {items: rubric};

            var submission = {
              criteriaUrl: application.getCriteriaUrl(badge),
              onChangeUrl: application.getCallbackUrl(badge),
              achievement: {
                name: badge.name,
                description: badge.description,
                imageUrl: badge.image
              },
              classifications: badge.categories || [],
              evidence: [],
              rubric: rubric
            };

            if (applicant.email)
              submission.email = applicant.email;

            if (applicant.sensitive)
              submission.cannedResponses = CANNED_RESPONSES;

            if (application.description) {
              submission.evidence.push({
                url: application.getUrl(badge),
                mediaType: 'link',
                reflection: application.description
              });
            }

            if (application.meta) {
              submission.meta = application.meta;
            }

            evidence.forEach(function(item, index) {
              var type = item.mediaType.split('/')[0];
              if (type !== 'image') type = 'link';

              submission.evidence.push({
                url: item.getUrl(),
                reflection: item.description,
                mediaType: type
              });

              LOGGER(submission);

              api.post('/submission', {json:submission}, function (err, rsp) {
                if (err)
                  return callback(err);

                callback(null, (rsp||{}).id);
              });
            });
          });
        });
      });
    },

    /**
     * Retrieve latest information about an application from an Aestimia server
     *
     * @param {Application} application The <application> to be updated
     * @param {function} callback Callback function
     */
    update: function (application, callback) {
      var api = this;

      var submissionId = application.submissionId;

      if (!submissionId)
        return callback(new Error('Application has not yet been submitted'));

      this.get('/submissions/' + submissionId, function (err, submission) {
        if (err)
          return callback(err);

        var rubrics = submission.rubric.items;
        var reviews = submission.reviews;

        // Bail early, if there are no reviews - nothing to do
        if (!reviews.length) {
          submission.review = null;
          submission.accepted = false;
          return callback(null, submission);
        }

        // Sort the reviews by (ascending) date, if required
        if (reviews.length > 1) {
          reviews.sort(function (a, b) {
            if (a.date === b.date)
              return 0;
            return a.date < b.date;
          });
        }

        var review = reviews.pop();
        var satisfiedRubrics = review.satisfiedRubrics;
        var satisfied = false;

        if (satisfiedRubrics.length) {
          satisfied = true;

          rubrics.forEach(function (rubric, index) {
            var rubricSatisfied = !rubric.required || (satisfiedRubrics.indexOf(index) >= 0);
            satisfied &= rubricSatisfied;
          });
        }

        submission.review = review;
        submission.accepted = satisfied;

        callback(null, submission);
      });
    }
  });

  aestimia.defaultOptions = {
    auth: {
      username: 'api',
      password: SECRET,
      sendImmediately: false
    }
  };

  /**
   * Tell Aestimia server that a review has been processed
   *
   * @param {Application} application The <application> the review belongs to
   * @param {string} reviewId The ID of the review to be processed
   * @param {function} callback Callback function
   */
  aestimia.process = function (application, reviewId, callback) {
    console.log('Notify:', arguments);

    var api = this;

    var submissionId = application.submissionId;

    if (!submissionId)
      return callback(new Error('Application has not yet been submitted'));

    this.post('/submissions/' + submissionId + '/reviews/' + reviewId, function (err) {
      if (typeof callback === 'function')
        callback(err);
    });
  }

  /**
   * Middleware endpoint to handle callbacks from Aestimia server when the state
   * of an application changes
   * e.g.
   *  app.use('/mount/point', aestimia.endpoint(function(submission, callback) {
   *    // Process the submission here
   *    callback(); // when finished processing, optionally with an error
   *  }));
   *
   * @param {function} handler Function to process incoming submission
   */
  aestimia.endpoint = function (handler) {
    return function (req, res, next) {
      if (req.url !== '/')
        return next();

      function end (err) {
        if (err)
          return res.status(err.status || 400).json({error: err.message || err});

        return res.status(202).send('');
      }

      var submissionId = req.body['_id'];

      if (!submissionId)
        return end(new Error('Could not find _id in request'));

      aestimia.update({submissionId: submissionId}, function (err, submission) {
        if (err)
          return end(err);

        handler(submission, function (err) {
          if (err)
            return end(err);

          aestimia.process({submissionId: submissionId}, submission.review._id, logger);
          end();
        });
      });

    }
  }

  Object.keys(models).forEach(function(model) {
    aestimia[model] = models[model];
  });

  return aestimia;
}
