console.log("angular-app.js");
var myApp = angular.module("listenToThis",['ngRoute']);

myApp.filter('formatText', function() {
  return function(text) {
    var indices = [];
    for(var i=0; i<text.length;i++) {
      if (text[i] === "." && i%5 == 0) {
        indices.push(i);
      }
    }
    
    if(indices.length > 2){
      text = text.split('');
      for (var i=0; i<indices.length; i++){
        text[indices[i]] = '\n';
      }
      text = text.join('');
    }
    return text;
  };
});


myApp.controller('myController', ['$scope' , '$http' , '$routeParams' , 'formatTextFilter' , function($scope ,$http, $routeParams){
  var effects = ["bounceInLeft","bounceInRight","bounceInUp","bounceInDown","zoomInUp","zoomIn","zoomInLeft","zoomInRight"];
  var artist_bio = "";
  var current_playlist = $routeParams.id;

  $("html, body").animate({ scrollTop: 0 }, "slow");


  // when submitting the add form, send the text to the node API
  $http.get('/api/playlist/' + current_playlist + '/tracks')
    .success(function(data) {
        $scope.tracks = data;
        console.log(data);
    })
    .error(function(data) {
        console.log('Error: ' + data);
    });

  $http.get('/api/playlists/' + current_playlist)
    .success(function(data) {
        $scope.playlist_uri = data[0].href;
        // console.log(data);
        var playlist_params = data[0].href.split('/users/')[1].split('/playlists/');
        console.log("i dont even wanna talk about it");
        $('#spotify_player').attr('src',"https://embed.spotify.com/?uri=spotify:user:" + playlist_params[0] + ":playlist:" + playlist_params[1]);
    })
    .error(function(data) {
        console.log('Error: ' + data);
    });
  
  $scope.artist_bio = "Click on an album above to get more info";
  $scope.playlists = {};
  $scope.tracks = {};
  $scope.artist_name = "";
  $scope.track_name = "";
  $scope.album_name = "";

  $scope.randeff = function(){
    return effects[Math.floor(Math.random() * effects.length)];
  };

  $scope.bio = function(artist_name,album_name,track_name){
    var x = artist_name.replace(" ","%20");
    $http.get("http://developer.echonest.com/api/v4/artist/biographies?api_key=EVUVGQSETIVR4BVWC&name="+x+"&format=json&results=1&start=0&license=cc-by-sa")
        .success(function(data) {
            $scope.artist_bio = data.response.biographies[0].text;
            $scope.artist_name = artist_name;
            $scope.track_name = track_name; 
            $scope.album_name = album_name;
            console.log(artist_bio);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });
  };

  $scope.events = function(artist_name){
    var x = artist_name.replace(" ","%20");
    $http.get("http://api.bandsintown.com/artists/" + "/events.json")
        .success(function(data) {
            console.log(artist_bio);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });
  };
  

  $scope.container1 = [{attributes:"left: 0; top: 0; width: 280px; height: 280px;"},
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


  $scope.container2 = [{attributes:"left: 0px; top: 0px; width: 280px; height: 280px;"},
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


  $scope.container3 = [{attributes:"left: 0px; top: 0px; width: 280px; height: 280px;"},
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


}]);

myApp.controller('playlistController', function($scope ,$http){
    // when landing on the page, get all todos and show them  
  $http.get('/api/playlists')
    .success(function(data) {
        $scope.playlists = data;
        console.log(data);
    })
    .error(function(data) {
        console.log('Error: ' + data);
    });


});



myApp.config(function ($routeProvider){
  $routeProvider
    .when("/", {
      templateUrl : "angular/views/home2.html",
      controller : "myController"
    })
    .when("/playlists",{
      templateUrl : "angular/views/playlists.html",
      controller : "playlistController"
    })
    .when('/playlists/:id',{
      templateUrl : "angular/views/tracks.html",
      controller : "myController"
    })
})