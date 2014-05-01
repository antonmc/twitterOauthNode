var express = require('express');
var util = require('util');
var oauth = require('oauth');
var http = require('http');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var errorHandler = require('errorhandler');
var logger = require('morgan');


var app = express();
var server = http.createServer(app);

// Get your credentials here: https://dev.twitter.com/apps

var _twitterConsumerKey = "YOUR TWITTER CONSUMER KEY";
var _twitterConsumerSecret = " YOUR TWITTER CONSUMER SECRET";

var consumer = new oauth.OAuth(
    "https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token",
    _twitterConsumerKey, _twitterConsumerSecret, "1.0A", "http://127.0.0.1:8080/sessions/callback", "HMAC-SHA1");

    app.use(errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(logger());
    app.use(cookieParser());
    app.use(session({ secret: "very secret" }));


app.use(function(req, res, next){
  var err = req.session.error,
      msg = req.session.success;
      delete req.session.error;
      delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});

app.get('/sessions/connect', function(req, res){
  consumer.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
    if (error) {
      res.send("Error getting OAuth request token : " + util.inspect(error), 500);
    } else {
      req.session.oauthRequestToken = oauthToken;
      req.session.oauthRequestTokenSecret = oauthTokenSecret;
      res.redirect("https://twitter.com/oauth/authorize?oauth_token="+req.session.oauthRequestToken);
      console.log( 'get sessions connect' );
    }
  });
});

app.get('/sessions/callback', function(req, res){
  util.puts(">>"+req.session.oauthRequestToken);
  util.puts(">>"+req.session.oauthRequestTokenSecret);
  util.puts(">>"+req.query.oauth_verifier);
  consumer.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
    if (error) {
      res.send("Error getting OAuth access token : " + util.inspect(error) + "["+oauthAccessToken+"]"+ "["+oauthAccessTokenSecret+"]"+ "["+util.inspect(results)+"]", 500);
    } else {
      req.session.oauthAccessToken = oauthAccessToken;
      req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;

      console.log( 'get sessions callback' );


      res.redirect('/home');
    }
  });
});

app.get('/home', function(req, res){
    consumer.get("https://api.twitter.com/1.1/account/verify_credentials.json", req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function (error, data, response) {
      if (error) {

          console.log( 'error\n' );
          console.log( error );

          res.redirect('/sessions/connect');
          // res.send("Error getting twitter screen name : " + util.inspect(error), 500);
      } else {
          var parsedData = JSON.parse(data);

          console.log( parsedData );

        // req.session.twitterScreenName = response.screen_name;
        res.send('You are signed in: ' + parsedData.screen_name);
      }
    });
});

app.get('*', function(req, res){
    res.redirect('/home');
});

app.listen(8080);
