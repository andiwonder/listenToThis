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
var bodyParser = require('body-parser');

var client_id = 'bea5abbf99764aa8b25ca9850a24783e'; // Your client id
var client_secret = '82db5fa7525d4369ad543ad6035017bf'; // Your client secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('tracks.db');

app.use(express.static(__dirname + '/public'));
console.log('Listening on 8888');
app.listen(8888);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

var session = require('express-session');
var SQLiteStore = require('connect-sqlite3')(session);


app.use(express.static('public'));
app.use(session({
  store: new SQLiteStore({
    table: 'sessions', //Database table name
    db: 'tracks.db' //Database file name (defaults to table name)
  }),
  genid: function(req) {
    return genuuid() // use UUIDs for session IDs
  },
  secret: 'your secret',
  cookie: { path: 'listenToThis', maxAge: 7 * 24 * 60 * 60 * 1000 }, // 1 week
  saveUninitialized: true,
  resave: true
}));




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




app.get('/add',function(req,res){
  var html = fs.readFileSync("public/add.html","utf8");
  res.send(html);
})

app.get('/session', function(req, res) {
  res.cookie('cookiename', 'cookievalue', { maxAge: 900000, httpOnly: true });
  var sess = req.session;
  console.log(req.cookies);
  console.log(req.session);
  res.send(req.cookies);
  // if (sess.views) {
  //   sess.views++
  //   res.setHeader('Content-Type', 'text/html')
  //   res.write('<p>views: ' + sess.views + '</p>')
  //   res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's</p>')
  //   res.end()
  // } else {
  //   sess.views = 1
  //   res.end('welcome to the session demo. refresh!')
  // }
});



app.get("/index",function(req,res){
  // res.redirect("/login");
  res.send("hi")
});

app.get('/login', function(req, res) {
  // console.log("hello! world!!!");
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
        res.cookie('access_token', access_token, { maxAge: 900000 });
        res.cookie('refresh_token', refresh_token, { maxAge: 900000 });
        res.redirect('/form');
      }
    });
  };
});

app.get('/testplay', function(req,res){

  var access_token = req.cookies['access_token'];
  console.log(req.cookies);
  console.log(access_token);
  var options = {
    url: 'https://api.spotify.com/v1/users/1218489850/playlists/2qFKmUtIe35ZkRLFi6yHWy',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  // use the access token to access the Spotify Web API
  request.get(options, function(error, response, body) {
    console.log(body);
    console.log(body.href);
    console.log(body.images[0]['url']);
    console.log(body.tracks.items[0]);
  });
  res.send('yea');
});



// app.get('/callback',function (req,res){
//   // var url_parts = url.parse(req.url);
//   console.log("on /callback and being redirectred");
//   console.log(req.url);
//   var code = req.query.code || null;
//   var state = req.query.state || null;
//   res.cookie('spotfiy_code',code, { maxAge: 900000, httpOnly: true });
//   console.log(code, state);
//   // sess = req.session;
//   // console.log(req.session);
//   // sess.sid = req.url;
//   // console.log(req.query);
//   // console.log(req);
//   res.redirect('/');
// })

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
  db.all("SELECT * FROM tracks where playlist_id = 13;" , function (err,rows){
    // console.log(rows);
    var html = fs.readFileSync("./index.html.ejs","utf8");
    var rendered = ejs.render(html,{tracks:data, rows:rows, tracks2:data2 , tracks3:data3});
    res.send(rendered);
  });
});


app.get("/api/playlists",function (req,res){
  db.all("select playlist.id, playlist.image , playlist.href, playlist.name, count(tracks.id) as count from playlist inner join tracks on playlist.id=tracks.playlist_id Group by playlist.id;" , function (err,rows){
    // select playlist.name, count(tracks.id) from playlist inner join tracks on playlist.id=tracks.playlist_id where playlist.id = 1;
    // select playlist.id, count(tracks.id) from playlist inner join tracks on playlist.id=tracks.playlist_id group by playlist.name;
    // select count(tracks.id), playlist.name from tracks inner join playlist on tracks.playlist_id = playlist.id where playlist.id = 1;
    // console.log(rows);
    res.send(JSON.stringify(rows));
  });
});

app.get("/api/playlists/:id",function (req,res){
  db.all("select id, image , href, name from playlist WHERE id=?;", req.params.id , function (err,rows){
    // select playlist.name, count(tracks.id) from playlist inner join tracks on playlist.id=tracks.playlist_id where playlist.id = 1;
    // select playlist.id, count(tracks.id) from playlist inner join tracks on playlist.id=tracks.playlist_id group by playlist.name;
    // select count(tracks.id), playlist.name from tracks inner join playlist on tracks.playlist_id = playlist.id where playlist.id = 1;
    console.log(rows);
    res.send(JSON.stringify(rows));
  });
});



app.get("/api/playlist/:id/tracks",function(req,res){
  db.all("SELECT id, artist_name, track_name , track_uri , album_name , album_url, playlist_id FROM tracks WHERE playlist_id=?", req.params.id , function (err,rows){
    res.send(JSON.stringify(rows));
  })
});

app.get('/',function (req,res){
  res.redirect('/music');
})

app.get("/music", function (req,res){
  console.log(req.session);
  var html = fs.readFileSync("public/angular/views/home.html","utf8");
  res.send(html);
});

app.get("/layout", function (req,res){
  var html = fs.readFileSync("public/index3.html","utf8");
  res.send(html);
});

app.get("/form", function (req,res){
  if (req.cookies['access_token']) {
    var html = fs.readFileSync("public/form.html","utf8");
    res.send(html);
  } else {
    res.redirect('/login');
  }
});

// app.post("/blogs",function (req,res){
//   console.log(req.body.uri);
//   console.log(req.body.name);
//   console.log(req.cookies);
//   res.redirect('/form');
// });

app.post('/blogs', function(req,res){
  // console.log(req.body);
  var uri = req.body.uri;
  var user = uri.split(':')[2]
  var playlist_uri = uri.split(':')[4]
  var playlist_name = '';
  var access_token = req.cookies['access_token'];
  var options = {
    url: 'https://api.spotify.com/v1/users/' + user + '/playlists/' + playlist_uri,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };
  // use the access token to access the Spotify Web API
  request.get(options, function(error, response, body) {
    // console.log(error);
    // console.log(body);
    // console.log(body.name);
    // console.log(body.images[0]);
    // console.log(body.tracks.items.length);


    db.run("INSERT INTO playlist(name,image,href) VALUES(?,?,?)", body.name, body.images[0]['url'], body.href, function(err){
      db.get("SELECT id from playlist ORDER BY id DESC LIMIT 1", function(err,row){
        // console.log(row.id);
        var newplayistid = row.id;
        // console.log(newplayistid);

        body.tracks.items.forEach(function (el , index){  
          db.run("INSERT INTO tracks(artist_name, track_name, track_pos, track_uri, album_name, album_url , playlist_id) VALUES (?,?,?,?,?,?,?)", el.track.artists[0].name, el.track.name, index, el.track.uri, 
          el.track.album.name, el.track.album.images[0].url, newplayistid, function(err){
            if(err){
              console.log(err);
            } else {
            // console.log("its done man!")
            }
          });
        });
        res.redirect('/test#/playlists');
      });
    });
  });
});



// app.get('/callback', function(req, res) {

//   // your application requests refresh and access tokens
//   // after checking the state parameter
//   // http://localhost:8888/#access_token=BQCmtiNSdvhjJce1SO5nkVfBtiuJF57sPMmkyGyu_IEWFUCfCB4EmQH9UezfVVR17FKfSQVu3t0UnQevFZ7bTFjGZSYJ6liK69rWxkCH_oYunOWbUDB8ehRufgi0HDAho9ihPKsM-AL-bunZdiUN0rRoAhVua_0gtkg
//   // &refresh_token=AQBtrsN2eEbR7-fWVqx6pGDzcvPd6-nPZS5roYCIdAYlYtP7IjVuuZF7Xg7rCjA_XD9Pw0I_fABVCqDd4Pa2gs2KZp4eojA9iNQN1f-nd3eJg0hnRPHvBtjRukIOEJjJuy4
//   console.log(req);
//   var code = req.query.code || null;
//   var state = req.query.state || null;
//   var storedState = req.cookies ? req.cookies[stateKey] : null;

//   if (state === null || state !== storedState) {
//     res.redirect('/#' +
//       querystring.stringify({
//         error: 'state_mismatch'
//       }));
//   } else {
//     res.clearCookie(stateKey);
//     var authOptions = {
//       url: 'https://accounts.spotify.com/api/token',
//       form: {
//         code: code,
//         redirect_uri: redirect_uri,   
//         grant_type: 'authorization_code'
//       },
//       headers: {
//         'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
//       },
//       json: true
//     };

//     request.post(authOptions, function(error, response, body) {
//       if (!error && response.statusCode === 200) {

//         var access_token = body.access_token,
//         refresh_token = body.refresh_token;


//          // spotify:user:mattlowden:playlist:3RDAQfvtsCNDytx74lDONb
//          // spotify:user:1218489850:playlist:6WzVxht3wPXC8OVONSrtXC
//          // spotify:user:1218489850:playlist:6sBLLDG7teo6M8RCiyVygd
//          // spotify:user:1218489850:playlist:2qFKmUtIe35ZkRLFi6yHWy     

//          var options = {
//           url: 'https://api.spotify.com/v1/users/1218489850/playlists/2qFKmUtIe35ZkRLFi6yHWy',
//           headers: { 'Authorization': 'Bearer ' + access_token },
//           json: true
//         };

//         // use the access token to access the Spotify Web API
//         request.get(options, function(error, response, body) {
//           console.log(body);
//           // console.log(body.images[0]);
//           // console.log(body.tracks.items.length);

//           db.run("INSERT INTO playlist(name) VALUES(?)", body.name , function(err){
//           db.get("SELECT id from playlist ORDER BY id DESC LIMIT 1", function(err,row){
//             console.log(row.id);
//             var newplayistid = row.id + 1;
//             console.log(newplayistid)

//             body.tracks.items.forEach(function (el){  

//               var x = el.track.artists[0].name
//               x = x.split(" ").join("+");
//             // console.log(x);
//             var count = 0;
//             var requestURL = "http://developer.echonest.com/api/v4/artist/biographies?api_key=EVUVGQSETIVR4BVWC&name="+x+"&format=json&results=1&start=0&license=cc-by-sa" 
//             request.get(requestURL, function (err,response,body){
//               count++;
//               // console.log(count);
//               var myData = JSON.parse(body);
//               try {
//                 var bio = myData.response.biographies[0].text;
//                 db.run("INSERT INTO tracks(artist_name, track_name, track_uri, album_name, album_url , artist_bio, playlist_id) VALUES (?,?,?,?,?,?,?)", el.track.artists[0].name, el.track.name, el.track.uri, el.track.album.name, el.track.album.images[0].url, bio ,newplayistid, function(err){
//               if(err){
//                 console.log(err);
//               } else {
//                 // console.log("its done man!")
//               }
//             });
//               } 
//               catch(e) {
//                 // console.log(count);
//               }
//               // console.log(bio);
//               // console.log(myData);

//             });



//           });
//         });
//     });
//     });  


//         // we can also pass the token to the browser to make requests from there
//         res.redirect('/#' +
//           querystring.stringify({
//             access_token: access_token,
//             refresh_token: refresh_token
//           }));
//       } else {
//         res.redirect('/#' +
//           querystring.stringify({
//             error: 'invalid_token'
//           }));
//       }
//     });
//   }
// });

// var Genius = require("node-genius");
// var geniusClient = new Genius('N70dqFrzAeb7EGtGTk3_BI6jaWScOiuW8ea1kZ6XzL5uM8inNGeJuGHCnuzkQbtG');

// geniusClient.getSong("378195", function (error, song) {
//   if (error)
//     console.error("Whops. Something went wrong:", error);
//   else
//     console.log("Hoorah. Here is the song: ", song);
// });



