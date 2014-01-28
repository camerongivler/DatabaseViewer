/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$(function() {
    embedpano({swf: "krpano/21_15_36_01_2nd.swf", xml: "krpano/21_15_36_01_2nd.xml", target: "pano", html5: "prefer", passQueryParameters: true});
    $('#logo').mouseover(function() {
        $('.dropDown').css('z-index', '0');
        $('#logoDrop').css('z-index', '1');
    });
    $('#about').mouseover(function() {
        $('.dropDown').css('z-index', '0');
        $('#aboutDrop').css('z-index', '1');
    });
    $('#images').mouseover(function() {
        $('.dropDown').css('z-index', '0');
        $('#imagesDrop').css('z-index', '1');
    });
});

