var Engine;
(function (Engine) {
    var Vector3 = (function () {
        function Vector3(x, y, z)
        {
            var _this = this;
            _this.x = x || 0;
            _this.y = y || 0;
            _this.z = z || 0;
        }
        var __proto__ = Vector3.prototype;
        __proto__.toString = function ()
        {
            var _this = this;
            return "{x: " + _this.x + " y:" + _this.y + " z:" + _this.z + "}";
        }
        return Vector3;
    })();
    Engine.Vector3 = Vector3; 
    var Color4 = (function () {
        function Color4(r, g, b, a)
        {
            var _this = this;
            _this.r = r;
            _this.g = g;
            _this.b = b;
            _this.a = a;
        }
        var __proto__ = Color4.prototype;
        __proto__.toString = function ()
        {
            var _this = this;
            return "{R: " + _this.r + " G:" + _this.g + " B:" + _this.b + " A:" + _this.a + "}";
        }
        return Color4;
    })();
    Engine.Color4 = Color4;

    var Device = (function(){
        function Device(width, height)
        {
            var _this = this;
            // _this._canvas = canvas;
            _this.stageWidth = width;
            _this.stageHeight = height;
            // _this._context = _this._canvas.getContext("2d");
            _this._centerX = width >> 1;
            _this._centerY = height >> 1;
            _this._depthbuffer = new Float64Array(width * height);
            _this.backbuffer = new ImageData(width, height);
            _this._emptybuffer = new ImageData(width, height);
        }

        var __proto__ = Device.prototype;

        __proto__.clear = function ()
        {
            var _this = this;
            // _this._context.clearRect(0, 0, _this.stageWidth, _this.stageHeight);
            // _this.backbuffer = _this._context.getImageData(0, 0, _this.stageWidth, _this.stageHeight);
            
            _this.backbuffer.data.set(_this._emptybuffer.data);

            for (var i = 0, n = _this._depthbuffer.length; i < n; i++)
            {
                _this._depthbuffer[i] = -DEFAULT_DEPTH;
            }
        };

        __proto__.present = function (context)
        {
            var _this = this;

            // if (canvas)
            // {
            //     _this._context = canvas.getContext("2d");
            // }

            context.putImageData(_this.backbuffer, 0, 0);
        };

        __proto__.putPixel = function (x, y, z, color)
        {
            var _this = this;
            _this.backbufferdata = _this.backbuffer.data;

            var index = (x >> 0) + (y >> 0) * _this.stageWidth;
            var index4 = index * 4;

            if(_this._depthbuffer[index] <= z)
            {
                return;
            }

            // blend mode
            var r = _this.backbufferdata[index4];
            var g = _this.backbufferdata[index4 + 1];
            var b = _this.backbufferdata[index4 + 2];
            var a = _this.backbufferdata[index4 + 3];

            // _this.backbufferdata[index4]     = color.r*255 + (1-color.a)*r;
            // _this.backbufferdata[index4 + 1] = color.g*255 + (1-color.a)*g;
            // _this.backbufferdata[index4 + 2] = color.b*255 + (1-color.a)*b;
            // _this.backbufferdata[index4 + 3] = color.a*255 + (1-color.a)*a;

            _this._depthbuffer[index] = z;
            _this.backbufferdata[index4] = color.r * 255;
            _this.backbufferdata[index4 + 1] = color.g * 255;
            _this.backbufferdata[index4 + 2] = color.b * 255;
            _this.backbufferdata[index4 + 3] = 255 //color.a * 255;

        };

        // __proto__._transform = function (coord, transMat)
        // {
        //     var point = TransformCoordinates(coord, transMat);
        // };

        var redColor = new Color4(1, 0, 0, 1);

        __proto__._drawPoint = function (x, y, z, color)
        {
            var _this = this;
            
            x = x + _this._centerX;
            y = -y + _this._centerY;

            if(x >= 0 && y >= 0 && x < _this.stageWidth && y < _this.stageHeight)
            {
                _this.putPixel(x, y, z, color || redColor);
            }
        };

        var DEFAULT_DEPTH = -1e7;

        __proto__._drawBline = function (p0, p1, color)
        {
            var _this = this;

            x0 = p0.cameraX >> 0;
            y0 = p0.cameraY >> 0;
            x1 = p1.cameraX >> 0;
            y1 = p1.cameraY >> 0;

            var dx = Math.abs(x1 - x0);
            var dy = Math.abs(y1 - y0);
            var sx = (x0 < x1) ? 1 : -1;
            var sy = (y0 < y1) ? 1 : -1;
            var err = dx - dy;

            while(true)
            {
                _this._drawPoint(x0, y0, DEFAULT_DEPTH, color);

                if((x0 == x1) && (y0 == y1))
                {
                    break;
                }
                var e2 = 2 * err;
                if(e2 > -dy) {
                    err -= dy;
                    x0 += sx;
                }
                if(e2 < dx) {
                    err += dx;
                    y0 += sy;
                }
            }
        };

        __proto__._drawBCircle = function (x, y, r, color)
        {
            var _this = this;

            var ox = x >> 0;
            var oy = y >> 0;
            r  = r  >> 0;

            var tx = 0, ty = r, d = 1 - r;  

            while (tx <= ty)  
            {  
                _this._drawPoint(ox + tx, oy + ty, DEFAULT_DEPTH, color);
                _this._drawPoint(ox + tx, oy - ty, DEFAULT_DEPTH, color);  
                _this._drawPoint(ox - tx, oy + ty, DEFAULT_DEPTH, color);  
                _this._drawPoint(ox - tx, oy - ty, DEFAULT_DEPTH, color);  
                _this._drawPoint(ox + ty, oy - tx, DEFAULT_DEPTH, color);  
                _this._drawPoint(ox + ty, oy + tx, DEFAULT_DEPTH, color);  
                _this._drawPoint(ox - ty, oy + tx, DEFAULT_DEPTH, color);  
                _this._drawPoint(ox - ty, oy - tx, DEFAULT_DEPTH, color);
                
                if (d < 0)
                {
                    d += 2 * tx + 3;  
                }
                else  
                {  
                    d += 2 * (tx - ty) + 5;  
                    --ty;  
                }

                ++tx;  
            }  
        }

        function clamp(value)
        {
            return Math.max(0, Math.min(value, 1));
        }

        function interpolate(min, max, gradient)
        {
            return min + (max - min) * clamp(gradient);
        }

        var t_color = new Color4();
        __proto__._processScanLine = function (y, pa, pb, pc, pd, color, texture)
        {
            var _this = this;
            var gradient1 = pa.y != pb.y ? (y - pa.y) / (pb.y - pa.y) : 1;
            var gradient2 = pc.y != pd.y ? (y - pc.y) / (pd.y - pc.y) : 1;
            
            var sx = interpolate(pa.x, pb.x, gradient1) >> 0;
            var ex = interpolate(pc.x, pd.x, gradient2) >> 0;
            
            var z1 = interpolate(pa.z, pb.z, gradient1);
            var z2 = interpolate(pc.z, pd.z, gradient2);

            var sw = interpolate(pa.w, pb.w, gradient1);
            var ew = interpolate(pc.w, pd.w, gradient2);

            var snl = interpolate(pa._difLight*pa.w, pb._difLight*pb.w, gradient1);
            var enl = interpolate(pc._difLight*pc.w, pd._difLight*pd.w, gradient2);

            var su = interpolate(pa.u*pa.w, pb.u*pb.w, gradient1);
            var eu = interpolate(pc.u*pc.w, pd.u*pd.w, gradient2);

            var sv = interpolate(pa.v*pa.w, pb.v*pb.w, gradient1);
            var ev = interpolate(pc.v*pc.w, pd.v*pd.w, gradient2);

            for(var x = sx; x < ex; x++)
            {
                var gradient = (x - sx) / (ex - sx);
                var w = interpolate(sw, ew, gradient);
                var z = interpolate(z1, z2, gradient);
                var nl = interpolate(snl, enl, gradient)/w;

                t_color.r = color.r;
                t_color.g = color.g;
                t_color.b = color.b;
                t_color.a = color.a;

                if (texture)
                {
                    var u = interpolate(su, eu, gradient)/w;
                    var v = interpolate(sv, ev, gradient)/w;
                    texture._map(u, v, t_color);
                }

                t_color.r *= nl;
                t_color.g *= nl;
                t_color.b *= nl;
                
                // if (t_color.a > 0)
                _this._drawPoint(x, y, z, t_color);
            }
        }

        var p1 = new Vector3();
        var p2 = new Vector3();
        var p3 = new Vector3();

        __proto__._drawTriangle = function (point1, point2, point3, color, texture)
        {
            var _this = this;

            p1.x = point1.cameraX;
            p1.y = point1.cameraY;
            p1.z = point1.cameraZ;
            p1._difLight = point1._difLight;
            p1.u = point1.u;
            p1.v = point1.v;
            p1.w = point1.w;
            
            p2.x = point2.cameraX;
            p2.y = point2.cameraY;
            p2.z = point2.cameraZ;
            p2._difLight = point2._difLight;
            p2.u = point2.u;
            p2.v = point2.v;
            p2.w = point2.w;

            p3.x = point3.cameraX;
            p3.y = point3.cameraY;
            p3.z = point3.cameraZ;
            p3._difLight = point3._difLight;
            p3.u = point3.u;
            p3.v = point3.v;
            p3.w = point3.w;

            if(p1.y > p2.y)
            {
                var temp = p2;
                p2 = p1;
                p1 = temp;
            }

            if(p2.y > p3.y)
            {
                var temp = p2;
                p2 = p3;
                p3 = temp;
            }

            if(p1.y > p2.y)
            {
                var temp = p2;
                p2 = p1;
                p1 = temp;
            }


            var sign = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
            if (sign > 0)
            {
                for(var y = p1.y >> 0, ymax = p3.y >> 0; y <= ymax; y++)
                {
                    if(y < p2.y)
                    {
                        _this._processScanLine(y, p1, p3, p1, p2, color, texture);
                    } else {
                        _this._processScanLine(y, p1, p3, p2, p3, color, texture);
                    }
                }
            }
            else
            {
                for(var y = p1.y >> 0, ymax=p3.y >>0; y <= ymax; y++)
                {
                    if(y < p2.y) {
                        _this._processScanLine(y, p1, p2, p1, p3, color, texture);
                    } else {
                        _this._processScanLine(y, p2, p3, p1, p3, color, texture);
                    }
                }
            }
        };

        return Device;
    })();
    Engine.Device = Device;    
})(Engine || (Engine = {}));
