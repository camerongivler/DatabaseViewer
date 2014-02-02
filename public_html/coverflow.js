"use strict";
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var xOrig = 0, yOrig = 0, posX = 0, deltaX = 0;

$(function() {
    document.body.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, false);
    
      window.onresize();
    $('#container').mousedown(function(e) {
        e.preventDefault();
        xOrig = e.pageX;
        yOrig = e.pageY;
        $(window).mousemove(function(e2) {
            e2.preventDefault();
            deltaX = e2.pageX - xOrig;
            if (posX + deltaX > 350)
                deltaX = 350 - posX;
            else if (posX + deltaX < -350)
                deltaX = -350 - posX;
            $('#move').css('transform', 'translate(' + (posX + e2.pageX - xOrig) + 'px, 0) scale3d(' + ((500 - Math.abs(posX + deltaX)) / 500) + ', ' + ((500 - Math.abs(posX + deltaX)) / 500) + ', 1) rotateY(' + (-(posX + deltaX) / 500 * 140) + 'deg)');
            deltaX = e2.pageX - xOrig;
        });
    });

    $('#move').hover(function(e) {
        e.preventDefault();
        $('#image').css({'-webkit-filter': 'blur(15px)', 'filter': 'blur(15px)'});
        $('#info').css({opacity: 1, 'transform': 'scale3d(1, 1, 1)', 'transition-timing-function': 'ease-out'});
    }, function(e) {
        e.preventDefault();
        $('#image').css({'-webkit-filter': 'blur(0px)', 'filter': 'blur(0px)'});
        $('#info').css({opacity: 0, 'transform': 'scale3d(10, 10, 1)', 'transition-timing-function': 'ease-in'});
    });

    $(window).mouseup(function(e) {
        e.preventDefault();
        posX += deltaX;
        deltaX = 0;
        $(this).off('mousemove');
    });
});


window.onresize = function() {
    $(document.body).width(window.innerWidth).height(window.innerHeight);
};