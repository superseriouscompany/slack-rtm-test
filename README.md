# slack-rtm-test

Provides utilities for testing slack bots.

## Usage:
    var slackTest = require('slack-rtm-test');

    describe('it', function() {
      before(function() {
        slackTest.serve(8000);
        var slackBaseUrl = 'http://localhost:8000'; // pass this to your slack client
      })

      it('works', function(done) {
        var conversation = [
          { text: 'ping', channel: 'abc123' }, // sends exactly this message over the slack websocket

          { response: /pong/ }, // expects this message within 200ms

          { text: 'ping longer', channel: '#general' },

          { response: /pong/, timeout: 2000 }, // expects this message within 2000ms
        ]

        slackTest.expectConversation(conversation, done);
      })
    })
