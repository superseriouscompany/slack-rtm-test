// A slack stub server
var express         = require('express');
var WebSocketServer = require('ws').Server;
var async           = require('async');
var app             = express();
var debug           = require('debug')('slack-rtm-test');

module.exports.serve = function(port, cb) {
  app.get('*', function(req, res) {
    res.json({
      ok: true,
      // TODO: don't hardcode these
      users: [
        { name: 'neil', id: 'n0'},
        { name: 'thebigdog', id: 's1'}
      ],
      channels: [
        { name: 'general', id: 'CG0'}
      ],
      url: 'ws://localhost:6970'
    })
  })

  // TODO: don't hardcode this
  app.listen(port || 6969, cb);

  var wss = new WebSocketServer({port: 6970});
  wss.on('connection', function(ws) {
    module.exports.socket = {
      send: function(message) {
        if( message.text && !message.type ) { message.type = 'message'; }
        ws.send(JSON.stringify(message), {mask: true});
      },
      shouldReceive: function(text, cb) {
        ws.on('message', listener);

        function listener(message) {
          if( JSON.parse(message).text.match(text) ) {
            cb();
            ws.removeListener('message', listener);
            debug(message, "Received expected message");
            return;
          }
          debug(message, "unknown message");
        }
      }
    }

    module.exports.expectConversation = function expectConversation(conversation, cb) {
      async.series(conversation.map(function(message) {
        return function(cb) {
          if( !!message.response ) {
            return module.exports.socket.shouldReceive(message.response, cb);
          }

          module.exports.socket.send(message);
          cb();
        }
      }), cb);
    }
  });
}
