var test = require('tap').test;

test( 'can we make an instance of the client?', function(t) {
  var c = require('..');
  t.ok(c);
  t.end();
});
