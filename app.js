/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var app= express();
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var ejs = require("ejs");
var fs = require('fs');

var client_id = 'blah'; // Your client id
var client_secret = 'blah'; // Your client secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('tracks.db');
app.use(express.static('public'));

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());


app.get("/index",function(req,res){
  // res.redirect("/login");
  res.send("hi")
});

app.get('/login', function(req, res) {
  console.log("hello! world!!!")
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,   
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
        refresh_token = body.refresh_token;


         // spotify:user:mattlowden:playlist:3RDAQfvtsCNDytx74lDONb     

         var options = {
          url: 'https://api.spotify.com/v1/users/1218489850/playlists/20uItakRpIglO3ikXclbrH',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          // console.log(body);
          console.log(body.images[0]);
          console.log(body.tracks.items.length);

          db.run("INSERT INTO playlist(name) VALUES(?)", body.name , function(err){
          db.get("SELECT id from playlist ORDER BY id DESC LIMIT 1", function(err,row){
            console.log(row.id);
            var newplayistid = row.id + 1;
            console.log(newplayistid)

            body.tracks.items.forEach(function (el){  

              var x = el.track.artists[0].name
              x = x.split(" ").join("+");
            // console.log(x);
            var count = 0;
            var requestURL = "http://developer.echonest.com/api/v4/artist/biographies?api_key=blah&name="+x+"&format=json&results=1&start=0&license=cc-by-sa" 
            request.get(requestURL, function (err,response,body){
              count++;
              // console.log(count);
              var myData = JSON.parse(body);
              try {
                var bio = myData.response.biographies[0].text;
                db.run("INSERT INTO tracks(artist_name, track_name, track_uri, album_name, album_url , artist_bio, playlist_id) VALUES (?,?,?,?,?,?,?)", el.track.artists[0].name, el.track.name, el.track.uri, el.track.album.name, el.track.album.images[0].url, bio ,newplayistid, function(err){
              if(err){
                console.log(err);
              } else {
                // console.log("its done man!")
              }
            });
              } 
              catch(e) {
                // console.log(count);
              }
              // console.log(bio);
              // console.log(myData);

            });



          });
      });
  });
});  


        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
}
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});



var data = [{attributes:"left: 0; top: 0; width: 280px; height: 280px;"},
{attributes:"left: 280px; top: 0px; width: 200px; height: 200px;"},
{attributes:"left: 280px; top: 200px; width: 80px; height: 80px;"},
{attributes:"left: 360px; top: 200px; width: 120px; height: 120px;"},
{attributes:"left: 0px; top: 280px; width: 200px; height: 200px;"},
{attributes:"left: 200px; top: 280px; width: 70px; height: 70px;"},
{attributes:"left: 270px; top: 280px; width: 90px; height: 90px;"},
{attributes:"left: 360px; top: 320px; width: 50px; height: 50px;"},
{attributes:"left: 410px; top: 320px; width: 70px; height: 70px;"},
{attributes:"left: 200px; top: 350px; width: 50px; height: 50px;"},
{attributes:"left: 250px; top: 350px; width: 20px; height: 20px;"},
{attributes:"left: 250px; top: 370px; width: 30px; height: 30px;"},
{attributes:"left: 280px; top: 370px; width: 110px; height: 110px;"},
{attributes:"left: 390px; top: 370px; width: 20px; height: 20px;"},
{attributes:"left: 390px; top: 390px; width: 90px; height: 90px;"},
{attributes:"left: 200px; top: 400px; width: 80px; height: 80px;"}];


var data2 = [{attributes:"left: 0px; top: 0px; width: 280px; height: 280px;"},
            {attributes:"left: 280px; top: 0px; width: 200px; height: 200px;"},
            {attributes:"left: 280px; top: 200px; width: 110px; height: 110px;"},
            {attributes:"left: 390px; top: 200px; width: 90px; height: 90px;"},
            {attributes:"left: 0px; top: 280px; width: 200px; height: 200px;"},
            {attributes:"left: 200px; top: 280px; width: 80px; height: 80px;"},
            {attributes:"left: 390px; top: 290px; width: 20px; height: 20px;"},
            {attributes:"left: 410px; top: 290px; width: 70px; height: 70px;"},
            {attributes:"left: 280px; top: 310px; width: 80px; height: 80px;"},
            {attributes:"left: 360px; top: 310px; width: 50px; height: 50px;"},
            {attributes:"left: 200px; top: 360px; width: 50px; height: 50px;"},
            {attributes:"left: 250px; top: 360px; width: 30px; height: 30px;"},
            {attributes:"left: 360px; top: 360px; width: 120px; height: 120px;"},
            {attributes:"left: 250px; top: 390px; width: 20px; height: 20px;"},
            {attributes:"left: 270px; top: 390px; width: 90px; height: 90px;"},
            {attributes:"left: 200px; top: 410px; width: 70px; height: 70px;"}];


var data3 = [{attributes:"left: 0px; top: 0px; width: 280px; height: 280px;"},
            {attributes:"left: 280px; top: 0px; width: 200px; height: 200px;"},
            {attributes:"left: 280px; top: 200px; width: 90px; height: 90px;"},
            {attributes:"left: 370px; top: 200px; width: 110px; height: 110px;"},
            {attributes:"left: 0px; top: 280px; width: 200px; height: 200px;"},
            {attributes:"left: 200px; top: 280px; width: 80px; height: 80px;"},
            {attributes:"left: 280px; top: 290px; width: 70px; height: 70px;"},
            {attributes:"left: 350px; top: 290px; width: 20px; height: 20px;"},
            {attributes:"left: 350px; top: 310px; width: 50px; height: 50px;"},
            {attributes:"left: 400px; top: 310px; width: 80px; height: 80px;"},
            {attributes:"left: 200px; top: 360px; width: 120px; height: 120px;"},
            {attributes:"left: 320px; top: 360px; width: 50px; height: 50px;"},
            {attributes:"left: 370px; top: 360px; width: 30px; height: 30px;"},
            {attributes:"left: 370px; top: 390px; width: 20px; height: 20px;"},
            {attributes:"left: 390px; top: 390px; width: 90px; height: 90px;"},
            {attributes:"left: 320px; top: 410px; width: 70px; height: 70px;"}];






app.get("/hello",function (req,res){
  console.log(req.params.id);
  app.use(express.static('public'));
  db.all("SELECT * FROM tracks where playlist_id = 5;" , function (err,rows){
    // console.log(rows);
    var html = fs.readFileSync("./index.html.ejs","utf8");
    var rendered = ejs.render(html,{tracks:data, rows:rows, tracks2:data2 , tracks3:data3});
    res.send(rendered);
  });
});





console.log('Listening on 8888');
app.listen(8888);
