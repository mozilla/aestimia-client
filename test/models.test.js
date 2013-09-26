var test = require('tap').test;
var models = require('../models');

test('Can we create a new model type?', function (t) {
  var TestModel = new models._Model('TestModel', {
    id: {type: 'string', required: true},
    tags: {type: ['string'], required: true},
    count: {type: 'number', default: 0}
  });
  t.ok(TestModel, 'TestModel created');

  t.test('- Can we instantiate our new TestModel?', function (t) {
    var instance = new TestModel({
      id: 'id1',
      tags: ['tag']
    });
    t.ok(instance, 'TestModel instantiated');

    t.equal(instance.count, 0, 'instance.count correctly set to default');

    t.end();
  });

  t.end();
});

test('Can we create a new application?', function (t) {
  var application = new models.Application({
    description: 'Description'
  });

  t.ok(application);
  t.end();
});