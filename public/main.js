console.log("linked");

$(window).scroll(function(){
    $('#biography').css({
        'left': $(this).scrollLeft() + 15 //Why this 15, because in the CSS, we have set left 15, so as we scroll, we would want this to remain at 15px left
    });
});


 $("#spotify_art").on('click','.squares', function () { 
 	$("#bio_text").text(($(this).text()));
 });



$('.comment_toggle').click(function (){
	$('#comment_field').toggle();
});


