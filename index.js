// A slack stub server
var express         = require('express');
var WebSocketServer = require('ws').Server;
var async           = require('async');
var app             = express();
var debug           = require('debug')('slack-rtm-test');

const DEFAULT_TIMEOUT = 100;

module.exports.serve = function(port, options, cb) {
  if( !cb && typeof options === 'function' ) { cb = options; }
  if( !port ) { return cb(new Error('Port must be specified')); }

  var channels = [
    { name: 'general', id: 'CG0' }
  ]
  var users = [
    { name: 'neil', id: 'n0' },
    { name: 'thebigdog', id: 's1' }
  ]
  if( options.channels ) { channels = options.channels; }
  if( options.users ) { users = options.users; }


  app.get('*', function(req, res) {
    res.json({
      ok: true,
      users: users,
      channels: channels,
      url: 'ws://localhost:6970'
    })
  })

  app.listen(port, cb);

  // TODO: don't hardcode this
  var wss = new WebSocketServer({port: port+1});

  wss.on('connection', function(ws) {
    module.exports.socket = {
      send: function(message) {
        if( message.text && !message.type ) { message.type = 'message'; }
        if( message.channel ) {
          var matchingChannel = channels.find(function(c) {
            return c.id == message.channel || c.name == message.channel.replace(/^#/, '')
          });
          if( !matchingChannel ) { return console.error("No matching channel found for", message.channel) }
          message.channel = matchingChannel.id;
        }
        ws.send(JSON.stringify(message), {mask: true});
      },

      shouldReceive: function(text, options, cb) {
        if( !cb && typeof options === 'function ') { cb = options; }
        options = options || {};
        var timeoutInterval = options.timeout || DEFAULT_TIMEOUT;

        var timer = setTimeout(function() {
          return cb(new Error(`Did not receive message ${text} within ${timeoutInterval}ms. Run with DEBUG=slack-rtm-test for more info.`));
        }, timeoutInterval);

        ws.on('message', listener);

        function listener(message) {
          if( JSON.parse(message).text.match(text) ) {
            clearTimeout(timer);
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
            return module.exports.socket.shouldReceive(message.response, {
              timeout: message.timeout
            }, cb);
          }

          module.exports.socket.send(message);
          cb();
        }
      }), cb);
    }
  });
}
