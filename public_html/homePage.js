/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$(function() {
    embedpano({swf: "krpano/21_15_36_01_2nd.swf", xml: "krpano/21_15_36_01_2nd.xml", target: "pano", html5: "prefer", passQueryParameters: true});
    document.body.addEventListener('touchmove', function(e) {
        e.preventDefault();
    });
    $('.menuItem').mouseover(function() {
        $('.menuItem').css('border-bottom', '1px solid black');
        $('.dropDown').css('z-index', '0');
        $(this).css('border-bottom', '0px');
    });
    $('#logo').mouseover(function() {
        $('#logoDrop').css('z-index', '1');
    });
    $('#about').mouseover(function() {
        $('#aboutDrop').css('z-index', '1');
    });
    $('#images').mouseover(function() {
        $('#imagesDrop').css('z-index', '1');
    });
});

