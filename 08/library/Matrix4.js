
var Matrix4 = (function(){
    
    function Matrix4 (){}
    
    var __proto__  = Matrix4.prototype;
    __proto__.constructor = Matrix4;

    __proto__.log = function (msg)
    {
        var _this = this;
        msg != undefined && console.log(msg);
        console.log(number_format("{%n,%n,%n,%n,\n %n,%n,%n,%n,\n %n,%n,%n,%n,\n %n,%n,%n,%n}",
            _this.m00, _this.m01, _this.m02, _this.m03,
            _this.m10, _this.m11, _this.m12, _this.m13,
            _this.m20, _this.m21, _this.m22, _this.m23,
            _this.m30, _this.m31, _this.m32, _this.m33));
    }

    __proto__.fromMatrix = function (matrix)
    {
        var _this = this;

        _this.m00 = matrix.m00;
        _this.m01 = matrix.m01;
        _this.m02 = matrix.m02;
        _this.m03 = matrix.m03;

        _this.m10 = matrix.m10;
        _this.m11 = matrix.m11;
        _this.m12 = matrix.m12;
        _this.m13 = matrix.m13;

        _this.m20 = matrix.m20;
        _this.m21 = matrix.m21;
        _this.m22 = matrix.m22;
        _this.m23 = matrix.m23;

        _this.m30 = matrix.m30;
        _this.m31 = matrix.m31;
        _this.m32 = matrix.m32;
        _this.m33 = matrix.m33;

        return _this;
    }

    __proto__.identify = function ()
    {
        var _this = this;

        _this.m00 = 1;
        _this.m01 = 0;
        _this.m02 = 0;
        _this.m03 = 0;

        _this.m10 = 0;
        _this.m11 = 1;
        _this.m12 = 0;
        _this.m13 = 0;

        _this.m20 = 0;
        _this.m21 = 0;
        _this.m22 = 1;
        _this.m23 = 0;

        _this.m30 = 0;
        _this.m31 = 0;
        _this.m32 = 0;
        _this.m33 = 1;

        return _this;
    }

    __proto__.multiply = function(matrix2, dest)
    {
        var matrix1 = this;

        var A = matrix1.m00,  B = matrix1.m01,  C = matrix1.m02,  D = matrix1.m03,
            E = matrix1.m10,  F = matrix1.m11,  G = matrix1.m12,  H = matrix1.m13,
            I = matrix1.m20,  J = matrix1.m21,  K = matrix1.m22,  L = matrix1.m23,
            M = matrix1.m30,  N = matrix1.m31,  O = matrix1.m32,  P = matrix1.m33,

            a = matrix2.m00,  b = matrix2.m01,  c = matrix2.m02,  d = matrix2.m03,
            e = matrix2.m10,  f = matrix2.m11,  g = matrix2.m12,  h = matrix2.m13,
            i = matrix2.m20,  j = matrix2.m21,  k = matrix2.m22,  l = matrix2.m23,
            m = matrix2.m30,  n = matrix2.m31,  o = matrix2.m32,  p = matrix2.m33;

        dest.m00 = A * a + B * e + C * i + D * m;
        dest.m01 = A * b + B * f + C * j + D * n;
        dest.m02 = A * c + B * g + C * k + D * o;
        dest.m03 = A * d + B * h + C * l + D * p;

        dest.m10 = E * a + F * e + G * i + H * m;
        dest.m11 = E * b + F * f + G * j + H * n;
        dest.m12 = E * c + F * g + G * k + H * o;
        dest.m13 = E * d + F * h + G * l + H * p;

        dest.m20 = I * a + J * e + K * i + L * m;
        dest.m21 = I * b + J * f + K * j + L * n;
        dest.m22 = I * c + J * g + K * k + L * o;
        dest.m23 = I * d + J * h + K * l + L * p;

        dest.m30 = M * a + N * e + O * i + P * m;
        dest.m31 = M * b + N * f + O * j + P * n;
        dest.m32 = M * c + N * g + O * k + P * o;
        dest.m33 = M * d + N * h + O * l + P * p;

        return dest;
    };

    Matrix4.LookAt = function (eye, target, up)
    {
        var zAxis = new Vector3D();
        zAxis.x = target.x-eye.x;
        zAxis.y = target.y-eye.y;
        zAxis.z = target.z-eye.z;
        zAxis.normalize();

        var xAxis = new Vector3D();
        xAxis.copy(up).cross(zAxis);
        xAxis.normalize();

        var yAxis = new Vector3D();
        yAxis.copy(zAxis).cross(xAxis);
        yAxis.normalize();

        var ex = -xAxis.dot(eye);
        var ey = -yAxis.dot(eye);
        var ez = -zAxis.dot(eye);

        var matrix = new Matrix4();

        matrix.m00 = xAxis.x;
        matrix.m10 = yAxis.x;
        matrix.m20 = zAxis.x;
        
        matrix.m01 = xAxis.y;
        matrix.m11 = yAxis.y;
        matrix.m21 = zAxis.y;

        matrix.m02 = xAxis.z;
        matrix.m12 = yAxis.z;
        matrix.m22 = zAxis.z;

        matrix.m03 = ex;
        matrix.m13 = ey;
        matrix.m23 = ez;

        matrix.m30 = 0;
        matrix.m31 = 0;
        matrix.m32 = 0;
        matrix.m33 = 1;

        return matrix;
    }

    Matrix4.create = function ()
    {
        var _this = new Matrix4();

        _this.m00 = 1;
        _this.m01 = 0;
        _this.m02 = 0;
        _this.m03 = 0;

        _this.m10 = 0;
        _this.m11 = 1;
        _this.m12 = 0;
        _this.m13 = 0;

        _this.m20 = 0;
        _this.m21 = 0;
        _this.m22 = 1;
        _this.m23 = 0;

        _this.m30 = 0;
        _this.m31 = 0;
        _this.m32 = 0;
        _this.m33 = 1;

        return _this;
    }

    Matrix4.PerspectiveFovLH = function (fov, aspect, znear, zfar, matrix)
    {
        var matrix = Matrix4.create();
        var tan = 1.0 / (Math.tan(fov * Math.PI / 360));
        matrix.m00 = tan / aspect;
        matrix.m01 = matrix.m02 = matrix.m03 = matrix.m10 = 0.0;
        matrix.m11 = tan;
        matrix.m12 = matrix.m13 = matrix.m20 = matrix.m21 = 0.0;
        matrix.m22 = (- zfar) / (znear - zfar);
        matrix.m23 = (znear * zfar) / (znear - zfar);
        matrix.m30 = matrix.m31 = matrix.m33 = 0.0;
        matrix.m32 = 1.0;
        return matrix;
    };

    Matrix4._transpose = function(matrix, dest)
    {
        var a = matrix.m00,  b = matrix.m01,  c = matrix.m02,  d = matrix.m03,
            e = matrix.m10,  f = matrix.m11,  g = matrix.m12,  h = matrix.m13,
            i = matrix.m20,  j = matrix.m21,  k = matrix.m22,  l = matrix.m23,
            m = matrix.m30,  n = matrix.m31,  o = matrix.m32,  p = matrix.m33;

        dest.m00  = a;  dest.m01  = e; dest.m02  = i;  dest.m03  = m;
        dest.m10  = b;  dest.m11  = f; dest.m12  = j;  dest.m13  = n;
        dest.m20  = c;  dest.m21  = g; dest.m22  = k;  dest.m23  = o;
        dest.m30  = d;  dest.m31  = h; dest.m32  = l;  dest.m33  = p;
        return dest;
    };

    Matrix4._inverse = function(matrix, dest)
    {
        var a = matrix.m00,  b = matrix.m01,  c = matrix.m02,  d = matrix.m03,
            e = matrix.m10,  f = matrix.m11,  g = matrix.m12,  h = matrix.m13,
            i = matrix.m20,  j = matrix.m21,  k = matrix.m22,  l = matrix.m23,
            m = matrix.m30,  n = matrix.m31,  o = matrix.m32,  p = matrix.m33,
            q = a * f - b * e, r = a * g - c * e,
            s = a * h - d * e, t = b * g - c * f,
            u = b * h - d * f, v = c * h - d * g,
            w = i * n - j * m, x = i * o - k * m,
            y = i * p - l * m, z = j * o - k * n,
            A = j * p - l * n, B = k * p - l * o,
            ivd = 1 / (q * B - r * A + s * z + t * y - u * x + v * w);

        dest.m00  = ( f * B - g * A + h * z) * ivd;
        dest.m01  = (-b * B + c * A - d * z) * ivd;
        dest.m02  = ( n * v - o * u + p * t) * ivd;
        dest.m03  = (-j * v + k * u - l * t) * ivd;

        dest.m10  = (-e * B + g * y - h * x) * ivd;
        dest.m11  = ( a * B - c * y + d * x) * ivd;
        dest.m12  = (-m * v + o * s - p * r) * ivd;
        dest.m13  = ( i * v - k * s + l * r) * ivd;

        dest.m20  = ( e * A - f * y + h * w) * ivd;
        dest.m21  = (-a * A + b * y - d * w) * ivd;
        dest.m22 = ( m * u - n * s + p * q) * ivd;
        dest.m23 = (-i * u + j * s - l * q) * ivd;

        dest.m30 = (-e * z + f * x - g * w) * ivd;
        dest.m31 = ( a * z - b * x + c * w) * ivd;
        dest.m32 = (-m * t + n * r - o * q) * ivd;
        dest.m33 = ( i * t - j * r + k * q) * ivd;
        return dest;
    };

    Matrix4.Scale = function (scale)
    {
        var result = Matrix4.create();
        result.m00 = scale;
        result.m11 = scale;
        result.m22 = scale;
        result.m33 = 1.0;
        return result;
    };

    Matrix4.Translate = function (x, y, z)
    {
        var result = Matrix4.create();
        result.m03 = x;
        result.m13 = y;
        result.m23 = z;
        return result;
    };

    Matrix4.RotationX = function (angle)
    {
        var result = Matrix4.create();
        var s = Math.sin(angle);
        var c = Math.cos(angle);
        result.m00 = 1.0;
        result.m33 = 1.0;
        result.m11 = c;
        result.m22 = c;
        result.m21 = s;
        result.m12 = -s;
        return result;
    };

    Matrix4.RotationY = function (angle)
    {
        var result = Matrix4.create();
        var s = Math.sin(angle);
        var c = Math.cos(angle);
        result.m11 = 1.0;
        result.m33 = 1.0;
        result.m00 = c;
        result.m02 = s;
        result.m20 = -s;
        result.m22 = c;
        return result;
    };

    Matrix4.RotationZ = function (angle)
    {
        var result = Matrix4.create()
        var s = Math.sin(angle);
        var c = Math.cos(angle);
        result.m22 = 1.0;
        result.m33 = 1.0;
        result.m00 = c;
        result.m01 = -s;
        result.m10 = s;
        result.m11 = c;
        return result;
    };

    // Matrix3D.Normalize = function (origin)
    // {
    //     var vector = origin.clone();
        
    //     return vector.normalize();
    // }

    return Matrix4;
})();