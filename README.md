Aestimia Client
===============

An Aestimia API Client

Usage
-----

    var aestimia = require('aestimia-client')({
      // The Aestimia server URL (REQUIRED)
      endpoint: 'http://example.org/aestimia',
      // Aestimia authentication secret (REQUIRED)
      secret: '<secret key>',

      // Minimum word count required for valid application descriptions
      minWords: 10,
      // List of responses to use in sensitive-applicant situations
      cannedResponses: [
        'Response 1',
        'Response 2',
        // ...
        'Response n'
      ],
      // Logging callback function
      logger: function (data) { console.dir(data); }
    });
    
    aestimia.submit(application, function(err, id) {
      if (err) {
        // do something with the error
      }
      
      // do something with the application ID
    });
    
    aestimia.update(application, function(err, status) {
      if (err) {
        // do something with the error
      }
      
      // do something with application status
      /*
        {
          review: <latest review>,
          accepted: <boolean>
        }
      */
    })

Expectations
------------

The following 'interfaces' are expected when using an Aestimia client. All fields and methods are required, unless otherwise stated.

**`Application`:**

* `description`  
  description of application (or full body, if a simple text-based application)
* `submissionId`  
  submission ID of application, if already submitted (as returned by a successful `submit`)
* *`getApplicant`*  
  returns an `<Applicant>` object, via callback *`(err, applicant)`*
* *`getBadge`*  
  returns the `<Badge>` object being applied for, via callback *`(err, badge)`*
* *`getCallbackUrl`*  
  returns a fully formed URL to be hit by Aestimia service when application status changes
* *`getCriteriaUrl`*  
  returns a fully formed URL pointing to the criteria of this application
* *`getEvidence`*  
  returns an array of `<Evidence>` objects, via callback *`(err, evidence)`*

**`Applicant`:**

* `email`  
  the email address of the applicant *(not required)*
* `sensitive`  
  a boolean value indicating whether this a 'sensitive' applicant, e.g. a young learner. If this is `true`, canned responses will be displayed to the auditor, and any email address will be withheld.

**`Badge`:**

* `categories`  
  an array of 'tags' *(not required)*
* `description`  
  a description of the badge  
* `image`  
  a fully formed URL pointing to the badge's image
* `name`  
  the name of the badge
* `rubric`  
  the badge's evaluation rubric *(not required)* - see [Badge API docs](https://github.com/mozilla/openbadger/blob/v2.0/docs/api.md#badge-types)

**`Evidence`:**

* `description`  
  a description of the evidence *(not required)*
* `mediaType`  
  an identifier for the file type
* *`getUrl`*  
  returns a fully formed URL where the item can be found in its raw form