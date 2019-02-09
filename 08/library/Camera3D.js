var Camera3D = (function(){
   	
    

    function Camera3D ()
    {
        var _this = this;

        // _this._perspective_matrix = Matrix3D.PerspectiveFovLH(90, 1, 0.1, 1000, new Matrix3D);

        //trace(_this._perspective_matrix);

        var perspective_matrix = Matrix4.create();

        var h = 1;
        perspective_matrix.m00 = h;
        perspective_matrix.m11 = h;
        perspective_matrix.m22 = h;
        perspective_matrix.m32 = 1;
        perspective_matrix.m33 = 0;

        // function perspective(fov, aspect, znear, zfar)
        // {
        //     var matrix = Matrix4.create();
        //     var tan = 1.0 / (Math.tan(fov * Math.PI / 360));
        //     matrix.m00 = tan / aspect;
        //     matrix.m01 = matrix.m02 = matrix.m03 = matrix.m10 = 0.0;
        //     matrix.m11 = tan;
        //     matrix.m12 = matrix.m13 = matrix.m20 = matrix.m21 = 0.0;
        //     matrix.m22 = (znear + zfar) / (znear - zfar);
        //     matrix.m23 = 2 * znear * zfar / (znear - zfar);

        //     matrix.m30 = matrix.m31 = matrix.m33 = 0.0;
        //     matrix.m32 = -1.0;
        //     return matrix;
        // };

        var ratio = document.body.offsetHeight/document.body.offsetWidth;
        // _this._perspective_matrix = perspective_matrix;
        _this._perspective_matrix = Matrix4.PerspectiveFovLH(90, 1, 0.1, 1000);
        _this._rotation_matrix = Matrix4.create();
        _this._projection_matrix = Matrix4.create();
        _this._projection_matrix_inv = Matrix4.create();


        // _this._perspective_matrix = Matrix4.create();
        // _this._perspective_matrix = perspective_matrix

        _this.radius  = 150;
        _this.rotationY = 0;
		_this.rotationX = 0;
		_this.rotationZ = Math.PI/2;

        // _this._perspective_matrix = new Matrix4();
        // var h = 1;
        // _this._perspective_matrix.m00 = h;
        // _this._perspective_matrix.m11 = h;
        // _this._perspective_matrix.m22 = h;
        // _this._perspective_matrix.m32 = 1;
        // _this._perspective_matrix.m33 = 0;

        _this.composeCameraMatrix();
        // _this._rotation_matrix.log();
        // _this._perspective_matrix.log();

    }
    
    var __proto__  = Camera3D.prototype;

    __proto__.composeCameraMatrix = function ()
    {
        var _this = this;

    	var matrix = _this._rotation_matrix;

        var cosx = Math.cos(_this.rotationX);
        var sinx = Math.sin(_this.rotationX);
        var cosy = Math.cos(_this.rotationY);
        var siny = Math.sin(_this.rotationY);

        var x = _this.radius * cosy * cosx;
        var y = _this.radius * cosy * sinx;
        var z = _this.radius * siny;

        var eye = new Vector3D(x, y, z);

        _this.x = x;
        _this.y = y;
        _this.z = z;

        var xAxis = new Vector3D();
        xAxis.x = sinx;
        xAxis.y = - cosx;
        xAxis.z = 0;
        xAxis.normalize();

        var zAxis = new Vector3D(-x, -y, -z);
        zAxis.normalize();

        var yAxis = new Vector3D();
        yAxis.copy(zAxis).cross(xAxis);
        yAxis.normalize();

        var ex = -xAxis.dot(eye);
        var ey = -yAxis.dot(eye);
        var ez = -zAxis.dot(eye);

        matrix.m00 = xAxis.x;
        matrix.m01 = xAxis.y;
        matrix.m02 = xAxis.z;

        matrix.m10 = yAxis.x;
        matrix.m11 = yAxis.y;
        matrix.m12 = yAxis.z;

        matrix.m20 = zAxis.x;
        matrix.m21 = zAxis.y;
        matrix.m22 = zAxis.z;

        matrix.m03 = ex;
        matrix.m13 = ey;
        matrix.m23 = ez;

        matrix.m30 = 0;
        matrix.m31 = 0;
        matrix.m32 = 0;
        matrix.m33 = 1;


        _this._perspective_matrix.multiply(_this._rotation_matrix, _this._projection_matrix);
    }

    __proto__.toJSON = function ()
    {
    	return JSON.stringify(this);
    }

    return Camera3D;	
})();