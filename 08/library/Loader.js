/**
 * Created by legend on 17/01/25.
 */
/*
 * Copyright (C) 2012 Legend Chen.  All rights reserved.
 */

function Loader ()
{
    var _this = this;

    _this._count = 0;
    _this._max = 0;
    
}

var __proto__ = Loader.prototype;

__proto__._request = function (url, type, callback)
{
    var _this = this;

    _this._max++;

    var xhr = new XMLHttpRequest();
    xhr.responseType = type;
    xhr.open('POST', url, true);

    xhr.onload = function ()
    {
        callback (xhr.response, xhr.responseUrl, xhr.responseType);
        (++_this._count == _this._max) && _this._onReady.call(_this._target);
    }

    xhr.send();
}

__proto__._image = function (url, callback)
{
    var _this = this;
    _this._max++;

    var image = new Image()
    image.src = url;

    image.onload = function ()
    {
        callback.call(this, image);
        (++_this._count == _this._max) && _this._onReady.call(_this._target);
    }
}

__proto__._async = function (callback)
{
    var _this = this;

    _this._max++;

    return function thread(result)
    {
        callback.apply(this, arguments);
        (++_this._count == _this._max) && _this._onReady.call(_this._target);
    }
}


Loader.createWithCompleted = function (func, target)
{
    var _this = new Loader();
    _this._onReady = func;
    _this._target = target;
    return _this
}

function saveVideo (name, video)
{
    var video = video.get(0);
    var scale = 1;
    var canvas = document.createElement("canvas");
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    saveCanvas(name, canvas);
}

function saveCanvas (fName, canvas)
{   
    var url = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");   
    // var url = URL.createObjectURL(new Blob([fBlob], {type:'application/x-download'}));
    var link = document.createElement('a');
    link.href = url;
    link.download = fName;

    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('click');
    link.dispatchEvent(event);
    //URL.revokeObjectURL(url);
}

function saveAs (fName, buffer)
{   
    // var url = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");   
    var url = URL.createObjectURL(new Blob([buffer], {type:'application/x-download'}));
    var link = document.createElement('a');
    link.href = url;
    link.download = fName;

    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('click');
    link.dispatchEvent(event);
    //URL.revokeObjectURL(url);
}
