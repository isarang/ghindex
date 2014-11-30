/**
 * This script imports CSV file produced by BigQuery into redis
 * WIP
 */
var inputFile = require('fs').createReadStream('./no_gh_link_clean.csv'),
  redis = require("redis"),
  client = redis.createClient(),
  csv = require('csv-parse'),
  parser = csv();

var processed = 0;
parser.on('readable', saveLine);
parser.on('end', function() { client.unref(); });

inputFile.pipe(parser);

function saveLine() {
  var line = parser.read();
  var repo = line[0];
  var login = line[1];

  // we want to fix twitter. Normally we should not care about it
  // but in this it has to be changed, since it is so popular
  if (login === 'twitter' && repo === 'bootstrap') {
    login = 'twbs';
  }
  if (!repo || repo.indexOf('/') <= 0) return; // ignore invalid data.

  processed += 1;
  if (processed % 10000 === 0) console.log('Saved: ', processed);
  client.sadd('repo:' + repo, login, printError('repo', repo, login));
  client.sadd('user:' + login, repo, printError('user', repo, login));
}

function printError(type, repo, login) {
  return function(err, res) {
    if (err) console.log('!! Failed to save ' + type + ': ' + repo + '/' + login, err);
  };
}
