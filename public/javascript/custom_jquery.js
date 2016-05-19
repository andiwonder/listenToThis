var custom_jquery = function custom_jquery(){

  $(document).ready(function(){
    $(window).scroll(function (event) {
      // what the y position of the scroll is
      var y = $(this).scrollTop();
      if (y > 0) {
        $("#cover_art").css("position", "fixed");
      } else {
        $("#cover_art").css("position", "");
      }
    });
  });
  

};

custom_jquery();