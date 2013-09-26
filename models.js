const Model = function (name, properties, defaultProperty) {
  function isType (obj, type) {
    if (!type)
      return false;

    if (Object.prototype.toString.call(type) === '[object Array]')
      return type.some(function(type) { return isType(obj, type); });

    var objType = Object.prototype.toString.call(obj).replace(/^\[object (.*)\]$/, '$1').toLowerCase();
    if (objType === (type).toString().toLowerCase())
      return true;

    try {
      return (obj instanceof type)
    } catch (e) {
      var constructor = (obj.constructor || {}).toString().replace(/^function\s*(\w+)[\s\S]*$/gim, '$1');
      return (constructor === type);
    }
  }

  var model = function (data) {
    if (!(this instanceof model))
      return new model(data);

    var data = data || {};
    var defaultType = defaultProperty ? properties[defaultProperty].type : null;
    if (isType(data, defaultType)) {
      this[defaultProperty] = data;
    } else {
      Object.keys(properties).forEach(function (property) {
        if (data[property] === undefined) {
          if (properties[property].required)
            throw new ReferenceError('Missing required property: ' + property);
          else
            return;
        }

        var value = data[property];
        var type = properties[property].type;

        if (Object.prototype.toString.call(type) === '[object Array]') {
          if (!isType(value, 'array'))
            throw new TypeError('Property of wrong type: ' + property + '; expecting type: array');

          if (type.length) {
            value.forEach(function(item) {
              if (!isType(item, type))
                throw new TypeError('Property contains items of wrong type: ' + property + '; expecting type(s): ' + type.join(', '));
            });
          }
        } else {
          if (!isType(value, type))
            throw new TypeError('Property of wrong type: ' + property + '; expecting type: ' + type);
        }

        this[property] = value;
      }.bind(this));
    }
  }

  // Horrible hack
  var str = model.toString().replace(/^(function\s*)[^(]*\(/, '$1' + name + '(');
  model.toString = function () { return str };
  model.prototype.name = name;

  return model
}

Model.propertyWrapper = function (property) {
  return function (cb) {
    if (this[property] === undefined)
      return cb(new Error('Object misssing property: ' + property));
    cb(null, this[property]);
  }
}

exports._Model = Model;

/**
 * Example Application model, which can be used with the Aestimia API
 */
const Application = new Model('Application', {
  description: {type: 'string', required: true},
  applicant: {type: 'Applicant'},
  getApplicant: {type: 'function'},
  badge: {type: 'Badge'},
  getBadge: {type: 'function'},
  callbackUrl: {type: 'string'},
  getCallbackUrl: {type: 'function'},
  criteriaUrl: {type: 'string'},
  getCriteriaUrl: {type: 'function'},
  evidence: {type: 'array'},
  getEvidence: {type: 'function'},
  submissionId: {type: 'string'}
}, 'submissionId');

Application.prototype.getApplicant = Model.propertyWrapper('applicant');
Application.prototype.getBadge = Model.propertyWrapper('badge');
Application.prototype.getCallbackUrl = Model.propertyWrapper('callbackUrl');
Application.prototype.getCriteriaUrl = Model.propertyWrapper('criteriaUrl');
Application.prototype.getEvidence = Model.propertyWrapper('evidence');

exports.Application = Application

/**
 * Example Applicant model, which can be used with the Aestimia API
 */
const Applicant = new Model('Applicant', {
  email: {type: 'string'},
  sensitive: {type: 'boolean'}
});

exports.Applicant = Applicant;

/**
 * Example Badge model, which can be used with the Aestimia API
 */
const Badge = new Model('Badge', {
  categories: {type: 'array'},
  description: {type: 'string', required: true},
  image: {type: 'string', required: true},
  name: {type: 'string', required: true},
  rubric: {type: 'Rubric'}
});

exports.Badge = Badge;

/**
 * Example Evidence model, which can be used with the Aestimia API
 */
const Evidence = new Model('Evidence', {
  description: {type: 'string'},
  mediaType: {type: 'string', required: true},
  url: {type: 'string'},
  getUrl: {type: 'function'}
});

Evidence.prototype.getUrl = Model.propertyWrapper('url');

exports.Evidence = Evidence;

/**
 * Example Rubric model, which can be used with the Aestimia API
 */
const Rubric = new Model('Rubric', {
  items: {type: 'array'}
});

exports.Rubric = Rubric;