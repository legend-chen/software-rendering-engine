
function transformCoordinates(matrix, vertex)
{
    var x = matrix.m00 * vertex.x + matrix.m01 * vertex.y + matrix.m02 * vertex.z + matrix.m03;
    var y = matrix.m10 * vertex.x + matrix.m11 * vertex.y + matrix.m12 * vertex.z + matrix.m13;
    var z = matrix.m20 * vertex.x + matrix.m21 * vertex.y + matrix.m22 * vertex.z + matrix.m23;
    var w = matrix.m30 * vertex.x + matrix.m31 * vertex.y + matrix.m32 * vertex.z + matrix.m33;

    vertex.cameraX = 500 * x / w;
    vertex.cameraY = 500 * y / w;
    vertex.cameraZ = z;
    vertex.w = 1 / w;

    return vertex;
};

var D3Container = (function(){
   	
    var Color4  = Engine.Color4;
    var Vector3 = Engine.Vector3;

    function D3Container (width, height)
    {
        var _this = this;
        // _this.camera  = new Camera3D(stage.width, stage.height);

        // _this._width  = width;
        // _this._height = height;

		_this.objects = new Array();
		_this.device  = new Engine.Device(width, height);

        var canvas    = document.createElement("canvas");
        canvas.width  = width;
        canvas.height = height;

        var context = canvas.getContext("2d")
        context.imageSmoothingEnabled = false;

        _this._canvas  = canvas;
        _this._context = context;
        _this._center  = new Vector3(width >> 1, height >> 1);
    }
    
    var __proto__  = D3Container.prototype;

    // var presetColor = new Engine.Color4(0.8, 0.8, 0.8, 1);
    // var presetLightPosition = new Vector3D(1, -5, 10).normalize();
    var pColor = new Color4(1, 1, 1, 1);
    var pLight = new Vector3(0, 0, 0);


    function computeDotLight(face, direction)
    {
        var dot = face.normalX * direction.x + face.normalY * direction.y + face.normalZ * direction.z;
    	return (Math.max(0, dot)*0.5 + 0.5);
    }

    __proto__.addchild = function (child)
    {
        var _this = this;
        _this.objects.push(child);
        child._container = _this;
    }

    __proto__.render = function (time_elapsed)
    {
    	var _this = this;

    	var camera = _this._camera;

    	// var viewMatrix = camera._rotation_matrix;

        _this.objects.forEach(function (object){
                object._update && object._update(time_elapsed);
            });

    	var graphics = _this.device;

  		graphics.clear();

  		for (var i=0, n=_this.objects.length; i<n; i++)
  		{
            var object = _this.objects[i];
            object.render(graphics, camera._projection_matrix);
        }

  		graphics.present(_this._context);

    }

    return D3Container;	
})();


