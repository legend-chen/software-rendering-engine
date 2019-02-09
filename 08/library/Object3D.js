
function number_format (text)
{
    var index = 1;
    var args = arguments;
    return text.replace(/%n/g, function()
    {
        var i = index++;
        var str = args[i]!=undefined ? args[i].toString() : "";
        if (str == undefined) return "";
        if (str.length > 12) str = (str.indexOf("e") > 0 ? str.substr(0, 4) + "?" + str.substr(-7, 7) :str.substr(0, 11) + "?");
        return ("            " + str).substr(-12, 12);
    });
}

var Vertex = (function(){
    
    function Vertex ()
    {
        var _this = this;

        _this.x = 0;
        _this.y = 0;
        _this.z = 0;

        _this.u = 0;
        _this.v = 0;

        _this.cameraX = 0;
        _this.cameraY = 0;
        _this.cameraZ = 0;
    }
    
    var __proto__  = Vertex.prototype;

    __proto__.log = function (msg)
    {
        var _this = this;
        msg != undefined && console.log(msg);
        console.log(number_format("{%n,%n,%n,%n}",
            _this.x, _this.y, _this.z, _this.w,
            _this.u, _this.v,
            _this.cameraX, _this.cameraY, _this.cameraZ));
    }

    return Vertex;

})();

var Line = (function(){
    
    function Line ()
    {
        var _this = this;

        _this.vertex;
        _this.next;
    }
    
    var __proto__  = Line.prototype;

    return Line;
})();

var Face = (function(){
    
    function Face (){}
    
    var __proto__  = Face.prototype;

    __proto__._computeFacesNormals = function ()
    {
        var _this = this;

        var pLine = _this.line;
        
        var A = pLine.vertex;
            pLine = pLine.next;

        var B = pLine.vertex;
            pLine = pLine.next;

        var C = pLine.vertex;

        var ABx = (B.x - A.x);
        var ABy = (B.y - A.y); 
        var ABz = (B.z - A.z);

        var ACx = (C.x - A.x);
        var ACy = (C.y - A.y);
        var ACz = (C.z - A.z);

        var Nx = ((ACz * ABy) - (ACy * ABz));
        var Ny = ((ACx * ABz) - (ACz * ABx));
        var Nz = ((ACy * ABx) - (ACx * ABy));

        var Length = (((Nx * Nx) + (Ny * Ny)) + (Nz * Nz));

        if (Length > 0)
        {
            Length = (1 / Math.sqrt(Length));
            Nx *= Length;
            Ny *= Length;
            Nz *= Length;

            _this.normalX = Nx;
            _this.normalY = Ny;
            _this.normalZ = Nz;
        }
        
        //_this.offset = A.x * Nx + A.y * Ny + A.z * Nz;
    };

    return Face;

})();


function computeDotLight(face, pLightDirection)
{
    var dot = face.normalX * pLightDirection.x + face.normalY * pLightDirection.y + face.normalZ * pLightDirection.z;
    
    return (Math.max(0, dot)*0.5 + 0.5);
}
