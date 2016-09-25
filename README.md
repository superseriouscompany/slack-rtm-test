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
          { text: 'ping', channel: 'abc123' } // sends exactly this message over the slack websocket

          { response: /pong/ } //
        ]

        slackTest.expectConversation(conversation, done);
      })
    })
