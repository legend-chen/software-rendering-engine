var Texture = (function () {
    
    function Texture() {}

    var __proto__ = Texture.prototype;

    __proto__._map = function (tu, tv, color)
    {
        var _this = this;

        if (_this._internalBuffer)
        {
            var u = (tu * (_this.width-1))  >> 0;
            var v = (tv * (_this.height-1))  >> 0;

            var pos = (u + v * _this.width) * 4;

            var r = _this._internalBuffer.data[pos];
            var g = _this._internalBuffer.data[pos + 1];
            var b = _this._internalBuffer.data[pos + 2];
            var a = _this._internalBuffer.data[pos + 3];

            
            color.r = r / 255.0;
            color.g = g / 255.0;
            color.b = b / 255.0;
            color.a = a / 255.0;
        }
    };

    __proto__._map = function symmetrically(tu, tv, color)
    {
        var _this = this;
        var uvTransform = _this._uvTransform;

        if (_this._internalBuffer)
        {
            if (uvTransform)
            {
                tu = uvTransform[0] * tu - uvTransform[2];
                tv = uvTransform[1] * tv - uvTransform[3];
            }
            
            tv = tv % 2

            if (tv >= 1)
            {
                tv = tv - 1
            }
            else if (tv >= 0)
            {
                tv = 1 - tv
            }
            else if (tv > -1)
            {
                tv = 1 + tv
            }
            else
            {
                tv = -tv - 1
            }

            tu = tu % 2

            if (tu >= 1)
            {
                tu = 2 - tu
            }
            else if (tu >= 0)
            {

            }
            else if (tu > -1)
            {
                tu = -tu
            }
            else
            {
                tu = 2 + tu
            }

            var u = (tu * (_this.width-1))  >> 0;
            var v = (tv * (_this.height-1))  >> 0;

            var pos = (u + v * _this.width) * 4;

            var r = _this._internalBuffer.data[pos];
            var g = _this._internalBuffer.data[pos + 1];
            var b = _this._internalBuffer.data[pos + 2];
            var a = _this._internalBuffer.data[pos + 3];

            
            color.r = r / 255.0;
            color.g = g / 255.0;
            color.b = b / 255.0;
            color.a = a / 255.0;
        }
    }

    Texture.createWithLoader = function (filename)
    {
        var _this  = new Texture();
        _this.name = filename;
        var imageTexture = new Image();
        
        imageTexture.onload = function ()
        {
            var internalCanvas = document.createElement("canvas");
            _this.height = this.height;
            _this.width = this.width;
            internalCanvas.width = _this.width;
            internalCanvas.height = _this.height;

            var internalContext = internalCanvas.getContext("2d");
            internalCanvas.imageSmoothingEnabled = false;
            _this._internalContext = internalContext;
            internalContext.drawImage(imageTexture, 0, 0);
            _this._internalBuffer = internalContext.getImageData(0, 0, _this.width, _this.height);

            isNeedRedrawing = true;
        };

        imageTexture.src = filename;
        return _this;
    }

    return Texture;
})();