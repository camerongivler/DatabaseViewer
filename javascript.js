/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
"use strict";
var a = {}, socket = null, numTilesPerPage = 50, edit = false, resizeTimer = null, changes = [];
a.imageList = new Array();

$(function() {
    a.divProps = {};
    a.divProps.size = 150;
    a.divProps.spacing = {W: 50, H: 100};
    a.divProps.zoomMult = 1.3;
    $(window).resize(function() {
        //set a timer so the resize function only fires when the resize has ended
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            a.width = $(document).width();
            a.height = $(document).height();
            createDivs();
        }, 150);
    });

    $("#titleInput").focus();
    $('#titleInput').on('keyup', function(e) {
        if ((e.keyCode || e.which) === 13 && $(this).val() !== '') {
            document.activeElement.blur();
            $(this).blur();
            var sort = {};
            sort[$('#sort').val()] = $('#ad').val();
            var query = $(this).val() === '' ? {} : {title: {$regex: $(this).val(), $options: 'i'}};
            getData(query, sort);
        }
    });
    $('#back').hide();
    $('#prev').hide();
    $('#next').hide();
    $('#submitEdits').hide();
    $('#submit').click(function() {
        var sort = {};
        sort[$('#sort').val()] = $('#ad').val();
        var query = $(this).val() === '' ? {} : {title: {$regex: $(this).val(), $options: 'i'}};
        getData(query, sort);
    });
    $('#back').click(function() {
        $('#albums').empty();
        $('#back').hide();
        $('#prev').hide();
        $('#next').hide();
        $('#query').show();
        $("#titleInput").focus();
        $('h1').text('Query Database');
        a.imageList = [];
        a.len = 0;
        a.data = {};
    });
    $('#prev').hover(function() {
        $(this).css('color', 'red');
    }, function() {
        $(this).css('color', 'blue');
    });
    $('#next').hover(function() {
        $(this).css('color', 'red');
    }, function() {
        $(this).css('color', 'blue');
    });
    $('#back').hover(function() {
        $(this).css('color', 'red');
    }, function() {
        $(this).css('color', 'blue');
    });
    $('#prev').click(dispPrev);
    $('#next').click(dispNext);
    connect();
});

var getData = function(find, sort) {
    a.imageList = [];
    a.len = 0;
    a.data = {};
    find = find || {};
    sort = sort || {date: -1};
    socket.emit('retrieve', {find: find, sort: sort});
    $('#query').hide();
};

var connect = function() {
    socket = io.connect('http://mosaic.disp.duke.edu:8080');
    socket.on('data', function(imgs) {
        extractData(imgs);
    });
    socket.on('updated', function() {
        $('#submitEdits').css({color: 'green', cursor: 'default'});
        $('#submitEdits').unbind('mouseenter mouseleave click');
    });
};

var getKeys = function(obj) {
    var keys = [];
    for (var key in obj) {
        keys.push(key);
    }
    return keys;
};

var extractData = function(imgs) {
    //add the response of the query to the webpage
    a.data = {thumbs: [], names: [], urls: [], images: imgs};
    if (window.location.search === '?mode=edit') {
        edit = true;
        numTilesPerPage = 20;
    }
    for (var k = 0; k < imgs.length; k++) {
        a.data.thumbs[k] = imgs[k].urlLocation + "/" + JSON.parse(imgs[k].outputFiles.replace(/\'/g, '"')).zoomify + '/TileGroup0/0-0-0.jpg';
        a.data.names[k] = imgs[k].title;
        a.data.urls[k] = '/ZoomIndex.html?' + imgs[k].urlLocation + "/" + JSON.parse(imgs[k].outputFiles.replace(/\'/g, '"')).zoomify;
    }
    dispNext();

};


var dispNext = function() {
    window.scrollTo(0, 0);
    $('#albums').empty();
    a.imageList = [];
    var prevLen = a.len;
    if (a.data.thumbs.length <= a.len + numTilesPerPage)
        a.len = a.data.thumbs.length;
    else
        a.len += numTilesPerPage;
    for (var k = prevLen; k < a.len; k++) {
        addImage(a.data.thumbs[k], a.data.names[k], a.data.urls[k], a.data.images[k]);
    }
    initialize("Composites");
};

var dispPrev = function() {
    window.scrollTo(0, 0);
    $('#albums').empty();
    a.imageList = [];
    if (a.len % numTilesPerPage !== 0)
        a.len = a.len - a.len % numTilesPerPage;
    else
        a.len -= numTilesPerPage;
    for (var k = a.len - numTilesPerPage; k < a.len; k++) {
        addImage(a.data.thumbs[k], a.data.names[k], a.data.urls[k], a.data.images[k]);
    }
    initialize("Composites");
};

var initialize = function(albumName) {
    $('#next').hide();
    $('#prev').hide();
    $('#back').show();
    a.width = $(document).width();
    a.height = $(document).height();
    $('h1').text(albumName);
    createDivs();
};

var addImage = function(thumbnail, name, url, image) {
    a.imageList.push({thumbnail: thumbnail, name: name, url: url, image: image});
};

var createDivs = function() {
    if (edit) {
        a.divProps.spacing.W = 200;
    }
    $('#albums').empty();
    var numDivsWide = Math.floor((a.width - a.divProps.spacing.W) / (a.divProps.size + a.divProps.spacing.W));
    var lBorder = (a.width - (numDivsWide * (a.divProps.size + a.divProps.spacing.W) - a.divProps.spacing.W)) / 2;
    var k = 0;
    var temp, temp2, temp3, posH, keys, image, keyLength, height = 0;
    for (posH = 200; k < a.imageList.length; posH += a.divProps.size + a.divProps.spacing.H) {        //iterating vertically
        keyLength = 0;
        for (var posW = lBorder; posW < a.width - lBorder && k < a.imageList.length; posW += a.divProps.size + a.divProps.spacing.W) {     // iterating horizontally
            temp = $('<div class="album"></div>');
            $('#albums').append(temp);
            temp.css({left: posW,
                top: posH,
                background: "url('" + a.imageList[k].thumbnail + "') no-repeat 100%",
                'background-size': 'cover',
                'background-position': 'center'});
            if (!edit) {
                temp.data({'original_position': temp.offset(), number: k});
                $('#albums').append('<div class="caption">' + a.imageList[k].name + '</div>');
                temp.data('caption', $('.caption:last-child'));
                temp.data('caption').data('original_position', {top: (posH + a.divProps.size + 10), left: posW});
                temp.data('caption').css({left: posW, top: (posH + a.divProps.size + 10)});
            } else {
                image = a.imageList[k].image;
                keys = getKeys(image);
                if (keys.length > keyLength) {
                    keyLength = keys.length;
                    a.divProps.spacing.H = 25 * keyLength + 50;
                }
                for (var i = 0; i < keys.length; i++) {
                    temp2 = $('<input type="text" id="' + k + keys[i] + '" value="' + image[keys[i]] + '">');
                    temp2.data('image', image);
                    temp2.data('key', keys[i]);
                    temp3 = $('<label>' + keys[i] + ':</label>');
                    temp3.css({position: 'absolute', 'text-align': 'right', right: a.width - posW + 10, top: posH + a.divProps.size + 10 + 25 * i, 'z-index': 1});
                    temp2.css({position: 'absolute', left: posW, top: posH + a.divProps.size + 10 + 25 * i, 'z-index': 2});
                    temp2.focus(function() {
                        changes[changes.length] = {element: $(this), key: $(this).data('key'), _id: $(this).data('image')._id};
                        $('#submitEdits').show();
                        $('#submitEdits').hover(function() {
                            $(this).css('color', 'red');
                        }, function() {
                            $(this).css('color', 'blue');
                        });
                        $('#submitEdits').css({color: 'blue', cursor: 'pointer'});
                        $('#submitEdits').click(function() {
                            var set = {};
                            for (var k = 0; k < changes.length; k++) {
                                set[changes[k].key] = changes[k].element.val();
                                socket.emit('edit', {find: {_id: changes[k]._id}, replace: set});
                            }
                        });
                    });
                    $('#albums').append(temp2);
                    $('#albums').append(temp3);
                }
            }
            height = posH + a.divProps.size + a.divProps.spacing.H;
            k++;
        }
    }

    if (edit) {
        $('#submitEdits').css('top', height);
        height += 70;
    }

    if (a.len < a.data.thumbs.length)
        $('#next').show();
    if (a.len > numTilesPerPage)
        $('#prev').show();

    $('#next').css({top: height});
    $('#prev').css({top: height});

    if (!edit)
        $('.album').hover(function() {
            $(this).stop().animate({
                left: $(this).data('original_position').left - a.divProps.size * (a.divProps.zoomMult - 1) / 2,
                top: $(this).data('original_position').top - a.divProps.size * (a.divProps.zoomMult - 1) / 2,
                width: a.divProps.size * a.divProps.zoomMult,
                height: a.divProps.size * a.divProps.zoomMult,
                'z-index': 2
            }, 300);
            $(this).data('caption').stop().animate({
                top: $(this).data('caption').data('original_position').top + a.divProps.size * (a.divProps.zoomMult - 1) / 2,
                left: $(this).data('caption').data('original_position').left - a.divProps.size * (a.divProps.zoomMult - 1) / 2,
                'font-size': 20 * a.divProps.zoomMult * .95 + 'px',
                width: a.divProps.size * a.divProps.zoomMult,
                'z-index': 3
            }, 300);
        }, function() {
            $(this).stop().animate({
                left: $(this).data('original_position').left,
                top: $(this).data('original_position').top,
                width: a.divProps.size,
                height: a.divProps.size,
                'z-index': 0
            }, 300);
            $(this).data('caption').stop().animate({
                top: $(this).data('caption').data('original_position').top,
                left: $(this).data('caption').data('original_position').left,
                'font-size': '20px',
                width: a.divProps.size,
                'z-index': 1
            }, 300);
        });

    $('.album').click(function() {
        window.location = a.imageList[$(this).data('number')].url;
    });
};