"use strict";
//variables pertaining to zoom bar
var zoom = {
    slider: null,
    leftBar: null,
    rightBar: null,
    pos: 0,
    scale: 1,
    newScale: 1,
    minScale: 0.1,
    maxScale: 1,
    mult: 0,
    redraw: false,
    prevTransform: {
        scale: 1,
        transformX: 0,
        transformY: 0
    }
},
//variables pertaining to thumbnail
thumb = {
    img: null,
    disp: null,
    isShown: true,
    imgLeft: 20,
    imgTop: 20,
    dispLeft: 20,
    dispTop: 20,
    imgWidth: 100,
    imgHeight: 100,
    dispWidth: 100,
    dispHeight: 100
},
//variables pertaining to the zoomable on-screen image
background = {
    img: null,
    table: null,
    left: 0,
    prevLeft: 0,
    top: 0,
    prevTop: 0,
    width: 640,
    height: 360,
    origX: 0,
    origY: 0,
    xPos: 0.5,
    yPos: 0.5,
    moved: false,
    numTouches: 0,
    scrollTimer: null,
    origWidth: 0,
    origHeight: 0,
    origLeft: 0,
    origTop: 0
},
//variables pertaining to the full-size image and file system
image = {
    height: 0,
    width: 0,
    aspect: 1,
    tileSize: 0,
    zoomLevel: 0,
    zoomWidths: [],
    zoomHeights: [],
    numTilesAcross: [],
    numTilesDown: [],
    root: '',
    levels: [],
    TILES_PER_FOLDER: 256
},
//window height and width
win = {
    height: $(window).height(),
    width: $(window).width(),
    resizeTimer: null
};

function initZoomImg() {
    //calculate the widths and heights of each zoom level, along with the number
    // of tiles horizontally and vertically
    var k = image.width * 2, j = image.height * 2, i = -1, tempW = [], tempH = [];
    do {
        k /= 2;
        j /= 2;
        i++;
        tempW[i] = Math.floor(k);
        tempH[i] = Math.floor(j);
    } while (k > image.tileSize || j > image.tileSize);
    k = tempH.length;
    for (i = 0; i < tempH.length; i++) {
        k--;
        image.zoomWidths[i] = tempW[k];
        image.zoomHeights[i] = tempH[k];
    }
    for (var k = 0; k < image.zoomWidths.length; k++) {
        image.numTilesAcross[k] = Math.ceil(image.zoomWidths[k] / image.tileSize);
    }
    for (var k = 0; k < image.zoomHeights.length; k++) {
        image.numTilesDown[k] = Math.ceil(image.zoomHeights[k] / image.tileSize);
    }
    setFolders();
}
;

var setFolders = function() {
    //image.levels is an array that specifies which image is the 'first' in each
    // directory to decrease image tile loading times
    var sum = 0;
    for (var k = 0; k < image.numTilesAcross.length; k++) {
        image.levels[k] = {folder: Math.floor(sum / image.TILES_PER_FOLDER), index: sum % image.TILES_PER_FOLDER};
        sum += image.numTilesAcross[k] * image.numTilesDown[k];
    }
};

var getPath = function(left, top) {
    //returns the path of the specified image tile at the current zoom level
    var index = image.levels[image.zoomLevel].index + top * image.numTilesAcross[image.zoomLevel] + left;
    var folder = image.levels[image.zoomLevel].folder + Math.floor(index / image.TILES_PER_FOLDER);
    return image.root + '/TileGroup' + folder + '/' + image.zoomLevel + '-' + left + '-' + top + '.jpg';
};

var drawImage = function() {
    //the zoomable image is drawn as a table of divs with specified height percentages
    // and width percentages.  The backgrounds of the divs are the corresponding
    // images
//    background.table.hide();
    //calculate the zoom level

    background.img.css({width: background.width, height: background.height, top: background.top, left: background.left, 'transform': 'none'});
    zoom.redraw = true;
    for (var k = 0; k < image.zoomWidths.length; k++) {
        image.zoomLevel = k;
        if (image.zoomWidths[k] > background.width) {
            break;
        }
    }
    background.table.hide();
    //find the number of rows and columns at the current zoom level
    var numColsNoRound = image.zoomWidths[image.zoomLevel] / image.tileSize;
    var numCols = Math.ceil(numColsNoRound);
    var numRowsNoRound = image.zoomHeights[image.zoomLevel] / image.tileSize;
    var numRows = Math.ceil(numRowsNoRound);
    //find which tiles correspond to the corners of position of the window
    var leftTile = Math.floor(-background.left / background.width * numCols) - 1;
    var topTile = Math.floor(-background.top / background.height * numRows) - 1;
    var rightTile = Math.ceil((-background.left + win.width) / background.width * numCols) - 1;
    var bottomTile = Math.ceil((-background.top + win.height) / background.height * numRows) - 1;
    leftTile = leftTile < 0 ? 0 : leftTile;
    rightTile = rightTile >= numCols ? numCols - 1 : rightTile;
    topTile = topTile < 0 ? 0 : topTile;
    bottomTile = bottomTile >= numRows ? numRows - 1 : bottomTile;
    //calculate whether or not the current window has the bottom or right edge tiles
    //because they are smaller than the regular size
    var hasRightTile = rightTile >= numCols - 1;
    var hasBottomTile = bottomTile >= numRows - 1;
    rightTile = hasRightTile ? numCols - 1 : rightTile;
    bottomTile = hasBottomTile ? numRows - 1 : bottomTile;
    var leftPCG = leftTile / numColsNoRound * 100;
    var topPCG = topTile / numRowsNoRound * 100;
    var widthPCG = (rightTile - leftTile + (hasRightTile ? numColsNoRound % 1 : 1)) / numColsNoRound * 100;
    var heightPCG = (bottomTile - topTile + (hasBottomTile ? numRowsNoRound % 1 : 1)) / numRowsNoRound * 100;
    //calculate the height of the tiles as a percentage of the size of the background
    var tileHeightPCG = 1 / numRowsNoRound / heightPCG * 10000;
    var tileWidthPCG = 1 / numColsNoRound / widthPCG * 10000;
    var lastTileHeightPCG = (numRowsNoRound % 1) / numRowsNoRound / heightPCG * 10000;
    var lastTileWidthPCG = (numColsNoRound % 1) / numColsNoRound / widthPCG * 10000;
    //add the tile divs to the table
    background.table.empty();
    var temp1, temp2;
    for (var j = topTile; j <= bottomTile; j++) {
        if (j + 1 === numRows)
            temp1 = $('<tr class="lastTr"></tr>');
        else
            temp1 = $('<tr class="tr"></tr>');
        background.table.append(temp1);
        for (var k = leftTile; k <= rightTile; k++) {
            if (k + 1 === numCols)
                temp2 = $('<td class="lastTd"></td>');
            else
                temp2 = $('<td class="td"></td>');
            temp2.css({'background-image': 'url(' + getPath(k, j) + ')'});
            temp1.append(temp2);
        }
    }
    //set the sizes and positions of the tiles
    background.table.css({top: topPCG + "%", left: leftPCG + "%", width: widthPCG + "%", height: heightPCG + "%"});
    //background.table.css({top: "0%", left: "0%", width: "100%", height: "100%"});
    //transform(background.table, widthPCG, heightPCG, leftPCG * background.width, topPCG * background.height);
    //background.table.css({transform: 'matrix3d(' + widthPCG / 100 + ', 0, 0, 0, 0, ' + heightPCG / 100 + ', 0, 0, 0, 0, 1, 0, ' +
    //            leftPCG * background.width / 100 + ', ' + topPCG * background.height / 100 + ', 0, 1) rotate(0deg)',
    //    'transform-origin': '50% 50%'});
    //Log(widthPCG / 100 + " - " + heightPCG / 100 + " - " + leftPCG * background.width / 100 + " - " + topPCG * background.height / 100 + " - " + background.width + " - " + background.height);
    $('.tr').height(tileHeightPCG + "%");
    $('.td').width(tileWidthPCG + "%");
    $('.lastTr').height(lastTileHeightPCG + "%");
    $('.lastTd').width(lastTileWidthPCG + "%");
    background.table.show();
};

function getXMLProperties(path) {
    //load image properties from XML document
    var XMLDoc = loadXMLDoc(path + "/ImageProperties.xml");
    image.width = parseInt(XMLDoc.documentElement.getAttribute("WIDTH"), 10);
    image.height = parseInt(XMLDoc.documentElement.getAttribute("HEIGHT"), 10);
    image.tileSize = parseInt(XMLDoc.documentElement.getAttribute("TILESIZE"), 10);
    image.aspect = image.width / image.height;
    image.zoomLevel = 0;
    image.zoomWidths = [];
    image.zoomHeights = [];
}

function loadXMLDoc(XMLname) {
    //loads the XML document from the file system
    var xmlDoc;
    if (window.XMLHttpRequest)
    {
        xmlDoc = new window.XMLHttpRequest();
        xmlDoc.open("GET", XMLname, false);
        xmlDoc.send("");
        return xmlDoc.responseXML;
    }
    console.log("Error loading document!");
    return null;
}

function openSocket(urlQuery) {
    var socket = io.connect('http://mosaic.disp.duke.edu:8080');
    console.log({id: urlQuery.id});
    socket.emit('retrieve', {find: {id: urlQuery.id}});

    socket.on('data', function(imgs) {
        var url;
        console.log(imgs.length);
        if (!imgs[0].outputFiles) {
            console.log('There has been an error loading the image');
            return;
        }
        if (imgs[0].outputFiles.krpano) {
            url = 'http://mosaic.disp.duke.edu:8080' + imgs[0].outputFiles.krpano + '/' + imgs[0].id + '.xml';
            makeKRPano(url);
            return;
        }
        url = imgs[0].urlLocation + "/" + JSON.parse(imgs[0].outputFiles.replace(/\'/g, '"')).zoomify;
        initialize(url);
    });
}

function makeKRPano(url) {
    $('body').empty();
    $('body').append('<div id="pano" style="width:100%;height:100%;"><noscript><table style="width:100%;height:100%;"><tr style="valign:middle;"><td><div style="text-align:center;">ERROR:<br/><br/>Javascript not activated<br/><br/></div></td></tr></table></noscript></div>');
    embedpano({swf: "krpano/21_15_36_01_2nd.swf", xml: url, target: "pano", html5: "prefer", passQueryParameters: true});
    return;
}

$(function() {
    //runs at page load
    //define often-used jquery objects to limit DOM queries
    var urlQuery = {};
    $.each(window.location.search.substring(1).split('&'), function() {
        urlQuery[this.split('=')[0]] = this.split('=')[1];
    });
    openSocket(urlQuery);
});

function initialize(url) {
    image.root = url;
    zoom = {
        slider: $('#zSlider'),
        leftBar: $('#zSlide1'),
        rightBar: $('#zSlide2'),
        pos: 0,
        scale: 1,
        newScale: 1,
        minScale: 0.1,
        maxScale: 1,
        mult: 0,
        redraw: false,
        prevTransform: {
            scale: 1,
            transformX: 0,
            transformY: 0
        }
    };
    thumb.img = $('#thumb');
    thumb.disp = $('#disp');
    background.img = $('#background');
    background.table = $('#table');

    getXMLProperties(image.root);
    initZoomImg();
    thumb.img.attr('src', image.root + '/TileGroup0/0-0-0.jpg');
    thumb.imgWidth = thumb.imgHeight * image.aspect;
    thumb.img.css({height: thumb.imgHeight, width: thumb.imgWidth});
    background.img.css("background-image", 'url(' + image.root + '/TileGroup0/0-0-0.jpg)');
    $.isBrowserChrome = /chrom(e|ium)/.test(navigator.userAgent.toLowerCase()) ? true : false;
    //draw the image
    drawBackground();
    makeThumb();

    $(document).hammer().on('touch', function(ev) {
        ev.gesture.preventDefault();
    });
    $(window).resize(function() {
        //set a timer so the resize function only fires when the resize has ended
        clearTimeout(win.resizeTimer);
        win.resizeTimer = setTimeout(function() {
            //adjust the current size values and the image scale
            win.height = $(window).height();
            win.width = $(window).width();
            if (!background.moved)
                drawBackground();
            else {
                if (image.aspect / win.width * win.height < 1)
                    zoom.maxScale = image.height / win.height;
                else
                    zoom.maxScale = image.width / win.width;
                zoom.mult = (log10(zoom.maxScale) - log10(zoom.minScale)) / 453;
            }
            checkEdges();
            drawImage();
        }, 150);
    });

    background.img.on('mousewheel DOMMouseScroll', function(e) {
        //normalize scroll wheel values between browsers
        e.preventDefault();
        e.delta = null;
        if (e.originalEvent.wheelDelta)
            e.delta = e.originalEvent.wheelDelta / -1;
        else if (e.originalEvent.deltaY)
            e.delta = e.originalEvent.deltaY * 40;
        else if (e.originalEvent.detail)
            e.delta = e.originalEvent.detail * 40;
        if (!e.pageX) {
            e.pageX = e.originalEvent.pageX;
            e.pageY = e.originalEvent.pageY;
        }
        MouseWheelHandler(e);
        clearTimeout(background.scrollTimer);
        background.scrollTimer = setTimeout(function() {
            scrollStop();
        }, 250);
    });

    zoom.slider.hover(function() {
        //show the zoom bar when it is hovered over
        zoom.slider.animate({opacity: 1}, {queue: false});
        zoom.leftBar.animate({opacity: 0.4}, {queue: false});
        zoom.rightBar.animate({opacity: 0.4}, {queue: false});
    }, function() {
        zoom.slider.animate({opacity: 0.5}, {queue: false});
        zoom.leftBar.animate({opacity: 0}, {queue: false});
        zoom.rightBar.animate({opacity: 0}, {queue: false});
    });
    zoom.slider.hammer().on('drag', function(ev) {
        //adjust the slider and image zoom when the slider is dragged
        if (zoom.redraw) {
            background.img.css({top: background.origTop, left: background.origLeft, height: background.origHeight, width: background.origWidth});
            transform(zoom.prevTransform.scale, zoom.prevTransform.transformX, zoom.prevTransform.transformY);
        }
        zoom.slider.css({opacity: 1}, {queue: false});
        zoom.leftBar.css({opacity: 0.4}, {queue: false});
        zoom.rightBar.css({opacity: 0.4}, {queue: false});
        var pos = zoom.pos + ev.gesture.deltaX;
        if (pos > -245 && pos < 208) {
            zoom.slider.css({'margin-left': pos});
            zoom.leftBar.css({width: 251 + pos});
            zoom.rightBar.css({width: 214 - pos});
            var scale = Math.pow(10, zoom.mult * (pos - 208) + log10(zoom.maxScale));
            //transform(scale / zoom.scale, 0, 0);
            scaleTo(scale, false);
        } else if (pos <= -245) {
            zoom.slider.css({'margin-left': -245});
            zoom.leftBar.css({width: 6});
            zoom.rightBar.css({width: 459});
            //transform(zoom.minScale / zoom.scale, 0, 0);
            scaleTo(zoom.minScale, false);
        } else {
            zoom.slider.css({'margin-left': 208});
            zoom.leftBar.css({width: 459});
            zoom.rightBar.css({width: 6});
            //transform(zoom.maxScale / zoom.scale, 0, 0);
            scaleTo(zoom.maxScale, false);
        }
        makeThumb(false);
    });

    zoom.slider.hammer().on('release', function(ev) {
        //check the bounds of the zoom slider and adjust the opacity
        background.moved = true;
        zoom.slider.animate({opacity: 0.5}, {queue: false});
        zoom.leftBar.animate({opacity: 0}, {queue: false});
        zoom.rightBar.animate({opacity: 0}, {queue: false});
        if (zoom.pos + ev.gesture.deltaX > -245 && zoom.pos + ev.gesture.deltaX < 208)
            zoom.pos += ev.gesture.deltaX;
        else if (zoom.pos + ev.gesture.deltaX <= -245)
            zoom.pos = -245;
        else
            zoom.pos = 208;
        zoom.scale = Math.pow(10, zoom.mult * (zoom.pos - 208) + log10(zoom.maxScale));
        zoom.newScale = zoom.scale;
        scaleTo(zoom.scale, false);
        checkEdges();
        drawImage();
    });
    background.img.hammer().on('touch drag pinch', function(ev) {
        if (zoom.redraw) {
            background.img.css({top: background.origTop, left: background.origLeft, height: background.origHeight, width: background.origWidth});
            transform(zoom.prevTransform.scale, zoom.prevTransform.transformX, zoom.prevTransform.transformY);
        }
        if (background.numTouches !== ev.gesture.touches.length) {
            //this code is necessary to complete the zooming if only 1 finger is
            // lifted off the screen
            background.numTouches = ev.gesture.touches.length;
            //background.img.css({width: background.width, height: background.height, top: background.top, left: background.left});

            zoom.scale = background.width / background.origWidth;
            transform(zoom.scale, background.left - background.origLeft, background.top - background.origTop);
            //transform(1, 0, 0);
            zoom.newScale = zoom.scale;
            background.xPos = (ev.gesture.center.pageX - background.left) / background.width;
            background.yPos = (ev.gesture.center.pageY - background.top) / background.height;
            if (zoom.scale > zoom.maxScale) {
                scaleTo(zoom.maxScale, true);
                makeThumb(true);
                drawZoomBar(true, false);
            } else if (zoom.scale < zoom.minScale) {
                scaleTo(zoom.minScale, true);
                makeThumb(true);
                drawZoomBar(true, false);
            } else
                makeThumb(false);
            background.prevWidth = background.width;
            background.prevHeight = background.height;
            background.origX = ev.gesture.center.pageX;
            background.origY = ev.gesture.center.pageY;
            background.prevLeft = background.left;
            background.prevTop = background.top;
        } else if (!background.img.is(':animated')) {
            //scale the picture according to the pinch scale
            background.prevCenter = ev.gesture.center;
            background.width = background.prevWidth * ev.gesture.scale;
            background.height = background.prevHeight * ev.gesture.scale;
            background.left = background.prevLeft + (background.prevWidth - background.width) * background.xPos + ev.gesture.center.pageX - background.origX;
            background.top = background.prevTop + (background.prevHeight - background.height) * background.yPos + ev.gesture.center.pageY - background.origY;
            //background.img.css({width: background.width, height: background.height, top: background.top, left: background.left});
            zoom.scale = background.width / background.origWidth;
            transform(zoom.scale, background.left - background.origLeft, background.top - background.origTop);
            //transform(ev.gesture.scale, ev.gesture.center.pageX - background.origX, ev.gesture.center.pageY - background.origY);

            drawZoomBar(false, false);
            makeThumb(false);
        }
    });
    background.img.hammer().on('release', function() {
        //when the background is released, finish the zoom and check the edges
        //background.img.css({width: background.width, height: background.height, top: background.top, left: background.left});
        zoom.scale = background.width / background.origWidth;
        transform(zoom.scale, background.left - background.origLeft, background.top - background.origTop);
        //transform(1, 0, 0);
        background.moved = true;
        background.numTouches = 0;
        zoom.newScale = zoom.scale;
        background.prevWidth = background.width;
        background.prevHeight = background.height;
        background.prevLeft = background.left;
        background.prevTop = background.top;
        checkEdges();
        drawImage();
    });
}

var drawBackground = function() {
    //draws the image at the correct proportions
    //the image always fills the screen on page load -
    //different calculations depending on image aspect vs window aspect
    if (image.aspect / win.width * win.height < 1) {
        zoom.minScale = 1;
        zoom.maxScale = image.height / win.height;
        background.height = win.height;
        background.width = win.height * image.aspect;
    } else {
        zoom.minScale = 1;
        zoom.maxScale = image.width / win.width;
        background.width = win.width;
        background.height = win.width / image.aspect;
    }
    zoom.mult = (log10(zoom.maxScale) - log10(zoom.minScale)) / 453;
    background.prevWidth = background.width;
    background.prevHeight = background.height;
    background.origWidth = background.width;
    background.origHeight = background.height;
    background.top = (win.height - background.height) * background.yPos;
    background.left = (win.width - background.width) * background.xPos;
    background.origLeft = background.left;
    background.origTop = background.top;
    background.img.css({top: background.top, left: background.left, height: background.height, width: background.width});
    zoom.scale = zoom.minScale;
    zoom.newScale = zoom.scale;
    drawZoomBar(false, false);
    drawImage();
};

var drawZoomBar = function(animate, opaque) {
    //sets the position of the zoom slider when the scale is changed
    if (opaque) {
        var barOpacity = 0.4;
        var sliderOpacity = 1;
    } else {
        var barOpacity = 0;
        var sliderOpacity = 0.5;
    }
    zoom.pos = (log10(zoom.scale) - log10(zoom.maxScale)) / zoom.mult + 208;
    if (animate)
        zoom.slider.animate({'margin-left': zoom.pos, opacity: sliderOpacity}, {queue: false});
    else
        zoom.slider.css({'margin-left': zoom.pos, opacity: sliderOpacity});
    zoom.leftBar.css({width: 251 + zoom.pos, opacity: barOpacity});
    zoom.rightBar.css({width: 214 - zoom.pos, opacity: barOpacity});
};

var scaleTo = function(pct, animate) {
    //scale the image to scale = pct
    var newWidth = background.origWidth * pct;
    var newHeight = background.origHeight * pct;
    background.left += (background.width - newWidth) * background.xPos;
    background.top += (background.height - newHeight) * background.yPos;
    background.width = newWidth;
    background.height = newHeight;
    background.prevWidth = background.width;
    background.prevHeight = background.height;
//    var tempScale = pct / zoom.scale;
//    if (animate)
//        background.img.animate({top: background.top, left: background.left, width: background.width, height: background.height}, {queue: false});
//    else {
//        background.img.css({top: background.top, left: background.left, width: background.width, height: background.height});
//    }
    transform(pct, background.left - background.origLeft, background.top - background.origTop);
    //transform(1, 0, 0);
    zoom.scale = pct;
    zoom.newScale = pct;
};

var MouseWheelHandler = function(e) {
    //zoom the window when the mouse wheel is spun
    if (zoom.redraw) {
        background.img.css({top: background.origTop, left: background.origLeft, height: background.origHeight, width: background.origWidth});
        transform(zoom.prevTransform.scale, zoom.prevTransform.transformX, zoom.prevTransform.transformY);
    }
    background.xPos = (e.pageX - background.left) / background.width;
    background.yPos = (e.pageY - background.top) / background.height;
    zoom.scale *= (background.origWidth + e.delta / 5) / background.origWidth;
    if (zoom.scale < zoom.maxScale && zoom.scale > zoom.minScale) {
        //transform(zoom.newScale / zoom.scale, 0, 0);
        scaleTo(zoom.scale, false);
    } else if (zoom.scale > zoom.maxScale) {
        zoom.scale = zoom.maxScale;
        //transform(zoom.maxScale / zoom.scale, 0, 0);
        scaleTo(zoom.maxScale, false);
    } else {
        zoom.scale = zoom.minScale;
        //transform(zoom.minScale / zoom.scale, 0, 0);

        scaleTo(zoom.minScale, false);
    }
    drawZoomBar(false, true);
    makeThumb(false);
};

var makeThumb = function(animate) {
    //draw the red box on the thumbnail, if the image is larger than the window
    thumb.dispWidth = win.width / background.width * thumb.imgWidth;
    thumb.dispHeight = win.height / background.height * thumb.imgHeight;
    if (thumb.dispWidth > thumb.imgWidth || thumb.dispHeight > thumb.imgHeight) {
        if (thumb.isShown) {
            thumb.disp.hide();
            thumb.isShown = false;
        }
        return;
    }
    if (!thumb.isShown) {
        thumb.disp.show();
        thumb.isShown = true;
    }
    var left = -background.left / background.width * thumb.imgWidth;
    var top = -background.top / background.height * thumb.imgHeight;
    if (animate)
        thumb.disp.animate({height: thumb.dispHeight, width: thumb.dispWidth, 'margin-left': left, 'margin-top': top}, {queue: false});
    else
        thumb.disp.css({height: thumb.dispHeight, width: thumb.dispWidth, 'margin-left': left, 'margin-top': top});
};

var scrollStop = function() {
    //dim the zoom bar and check image placement when the scroll wheel stops
    background.moved = true;
    scaleTo(zoom.newScale);
    zoom.slider.animate({opacity: 0.5}, {queue: false});
    zoom.leftBar.animate({opacity: 0}, {queue: false});
    zoom.rightBar.animate({opacity: 0}, {queue: false});
    checkEdges();
    drawImage();
};

var checkEdges = function() {
    //make sure the window is filled by the image, and if not, adjust accordingly
    if (zoom.scale > zoom.maxScale) {
        scaleTo(zoom.maxScale, true);
        drawZoomBar(true, false);
    } else if (zoom.scale < zoom.minScale) {
        scaleTo(zoom.minScale, true);
        drawZoomBar(true, false);
    }
    if (background.top < 0 && background.top + background.height < win.height) {
        if (win.height > background.height)
            background.top = 0;
        else
            background.top = win.height - background.height;

    } else if (background.top > 0 && background.top + background.height > win.height) {
        if (win.height > background.height)
            background.top = win.height - background.height;
        else
            background.top = 0;
    }
    if (background.left < 0 && background.left + background.width < win.width) {
        if (win.width > background.width)
            background.left = 0;
        else
            background.left = win.width - background.width;

    } else if (background.left > 0 && background.left + background.width > win.width) {
        if (win.width > background.width)
            background.left = win.width - background.width;
        else
            background.left = 0;
    }
    //background.img.animate({top: background.top, left: background.left, width: background.width, height: background.height}, {queue: false});

    transform(zoom.scale, background.left - background.origLeft, background.top - background.origTop);
    makeThumb(true);
};

var transform = function(scale, transformX, transformY) {
    background.img.css({transform: 'matrix3d(' + scale + ', 0, 0, 0, 0, ' + scale + ', 0, 0, 0, 0, 1, 0, ' +
                transformX + ', ' + transformY + ', 0, 1) rotate(0deg)',
        'transform-origin': '0% 0%'});
    zoom.prevTransform = {
        scale: scale,
        transformX: transformX,
        transformY: transformY
    };
};

function log10(val) {
    return Math.log(val) / Math.LN10;
}

function Log(msg) {
    $('#log').html(msg);
}