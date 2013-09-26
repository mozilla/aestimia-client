var test = require('tap').test;
var models = require('../models');

test('Can we create and instantiate a new model type?', function (t) {
  var TestModel = new models._Model('TestModel', {
    id: {type: 'number', required: true},
    tags: {type: ['string'], required: true}
  });
  t.ok(TestModel);

  var instance = new TestModel({
    id: 1,
    tags: ['tag']
  });
  t.ok(instance);

  t.end();
});

test('Can we create a new application?', function (t) {
  var application = new models.Application({
    description: 'Description'
  });

  t.ok(application);
  t.end();
});