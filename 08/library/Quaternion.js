function Quaternion(x, y, z, w)
{
    var _this = this;
    _this.x = x || 0;
    _this.y = y || 0;
    _this.z = z || 0;
    _this.w = w || 0;
}


Quaternion.create = function ()
{
    return new Quaternion();
}

var __proto__ = Quaternion.prototype;


__proto__.log = function (msg)
{
    var _this = this;
    console.log(msg);
    console.log(number_format("{%n,%n,%n,%n},\n%n",
        _this.x, _this.y, _this.z, _this.w, 
        _this.w*_this.w + _this.x*_this.x + _this.z*_this.z + _this.y*_this.y));
}

__proto__.fromEuler = function (x, y, z, angle)
{
    var _this = this;

    var c1 = Math.cos( x / 2 );
    var c2 = Math.cos( y / 2 );
    var c3 = Math.cos( z / 2 );
    var s1 = Math.sin( x / 2 );
    var s2 = Math.sin( y / 2 );
    var s3 = Math.sin( z / 2 );
    
    // XYZ
    _this.x = s1 * c2 * c3 + c1 * s2 * s3;
    _this.y = c1 * s2 * c3 - s1 * c2 * s3;
    _this.z = c1 * c2 * s3 + s1 * s2 * c3;
    _this.w = c1 * c2 * c3 - s1 * s2 * s3;

    return _this;
}


__proto__.multiply = function (a, b)
{
    var _this = this;
    // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm
    var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w,
    qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

    _this.x =  qax * qbw + qay * qbz - qaz * qby + qaw * qbx;
    _this.y = -qax * qbz + qay * qbw + qaz * qbx + qaw * qby;
    _this.z =  qax * qby - qay * qbx + qaz * qbw + qaw * qbz;
    _this.w = -qax * qbx - qay * qby - qaz * qbz + qaw * qbw;

    return this;

}


__proto__.fromAxis = function (x, y, z, angle)
{
    var _this = this;

    var halfAngle = angle/2, s = Math.sin(halfAngle);

    _this.x = x * s,
    _this.y = y * s,
    _this.z = z * s,
    _this.w = Math.cos(halfAngle);

    return _this;
}


__proto__.toMatrix4 = function (m)
{
    var _this = this;

    var w = _this.w;
    var x = _this.x;
    var y = _this.y;
    var z = _this.z;

    var n = w * w + x * x + y * y + z * z;
    var s = n === 0 ? 0 : 2 / n;
    var wx = s * w * x, wy = s * w * y, wz = s * w * z;
    var xx = s * x * x, xy = s * x * y, xz = s * x * z;
    var yy = s * y * y, yz = s * y * z, zz = s * z * z;


    m.m00 = 1 - (yy + zz),
    m.m01 = xy - wz,
    m.m02 = xz + wy,
    m.m03 = 0,

    m.m10 = xy + wz,
    m.m11 = 1 - (xx + zz),
    m.m12 = yz - wx,
    m.m13 = 0,

    m.m20 = xz - wy,
    m.m21 = yz + wx,
    m.m22 = 1 - (xx + yy),
    m.m23 = 0,

    m.m30 = 0,
    m.m31 = 0,
    m.m32 = 0,
    m.m33 = 1

    return m;
}