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
// var m1 = Matrix4.create();

// var q1 = new Quaternion();
// q1.fromAxis(1,0,0,1);
// q1.log();
// q1.toMatrix4(m1).log();
var quaternion = Quaternion.create();
var rotation_matrix = Matrix4.create();
var rotation_x = Matrix4.create(); 
var rotation_y = Matrix4.create(); 
var rotation_z = Matrix4.create();

function Bone(){}

var __proto__ = Bone.prototype;

__proto__.calculateTransform = function ()
{
    var _this = this;
    var a, s, c;

    var transform = _this.Transform;

    transform.identify();

    transform.m03 = _this._translation.x;
    transform.m13 = _this._translation.y;
    transform.m23 = _this._translation.z;

    a = _this._rotation.z, 
    s = Math.sin(a), c = Math.cos(a);
    rotation_z.m00 = c;
    rotation_z.m01 = -s;
    rotation_z.m10 = s;
    rotation_z.m11 = c;

    a = _this._rotation.y, 
    s = Math.sin(a), c = Math.cos(a);
    rotation_y.m00 = c;
    rotation_y.m02 = s;
    rotation_y.m20 = -s;
    rotation_y.m22 = c;

    a = _this._rotation.x, 
    s = Math.sin(a), c = Math.cos(a);
    rotation_x.m11 = c;
    rotation_x.m22 = c;
    rotation_x.m21 = s;
    rotation_x.m12 = -s;

    transform.multiply(rotation_z, transform);
    transform.multiply(rotation_y, transform);
    transform.multiply(rotation_x, transform);

    if (_this._parentId > -1)
    {
        _this.parent.temp_Transform.multiply(transform, _this.temp_Transform);
    }
}

__proto__.updateBone = function ()
{
    var _this = this;
    var vertex1 = _this._vertex1;
    var vertex2 = _this._vertex2;

    if (_this._parentId > -1)
    {
        vertex1.ox = 0;
        vertex1.oy = 0;
        vertex1.oz = 0;

        transformOriginCoordinates(_this.parent.temp_Transform, vertex1);

        vertex2.ox = 0;
        vertex2.oy = 0;
        vertex2.oz = 0;

        transformOriginCoordinates(_this.temp_Transform, vertex2);
    }
}

__proto__.stickToMesh = function (mesh)
{
    var _this = this;

    var vertex1 = _this._vertex1;
    var vertex2 = _this._vertex2;

    if (_this._parentId > -1)
    {
        vertex1.ox = 0;
        vertex1.oy = 0;
        vertex1.oz = 0;

        transformOriginCoordinates(_this.parent.temp_Transform, vertex1);
        mesh.addVertex(vertex1);

        vertex2.ox = 0;
        vertex2.oy = 0;
        vertex2.oz = 0;

        transformOriginCoordinates(_this.temp_Transform, vertex2);
        mesh.addVertex(vertex2);

        var face = mesh.addFace(vertex1, vertex2, vertex2);
        face.name = _this._name;
    }
}

function SkeletonHelper (data)
{
    var _this = this;
    var boneSize = data.length;

    _this.Bones = new Array(boneSize);

    for (var i=0; i<boneSize; i++)
    {
        var bone = _this.Bones[i] = new Bone();
        var item = data[i];

        // bone._scale = item.scale.x;
        bone._rotation = item.rotation;
        bone._translation = item.translation;
        bone._parentId = item.parentId;
        bone._name = item.name;

        _this.Bones[item.name] = bone;

        if (bone._parentId > -1)
        {
            bone.parent = _this.Bones[bone._parentId]
        }

        bone.Transform = Matrix4.create();
        bone.temp_Transform = Matrix4.create();
        bone.boneTransform  = Matrix4.create();
        bone.invTransform   = Matrix4.create();
        bone._vertex1       = new Vertex();
        bone._vertex2       = new Vertex();

        
        bone._Transform     = Matrix4.create();
        bone._Transform.m00 = item.invTransform.M11;
        bone._Transform.m01 = item.invTransform.M21;
        bone._Transform.m02 = item.invTransform.M31;
        bone._Transform.m03 = item.invTransform.M41;

        bone._Transform.m10 = item.invTransform.M12;
        bone._Transform.m11 = item.invTransform.M22;
        bone._Transform.m12 = item.invTransform.M32;
        bone._Transform.m13 = item.invTransform.M42;

        bone._Transform.m20 = item.invTransform.M13;
        bone._Transform.m21 = item.invTransform.M23;
        bone._Transform.m22 = item.invTransform.M33;
        bone._Transform.m23 = item.invTransform.M43;

        // bone._Transform.m30 = item.invTransform.M14;
        // bone._Transform.m31 = item.invTransform.M24;
        // bone._Transform.m32 = item.invTransform.M34;
        // bone._Transform.m33 = item.invTransform.M44;

        bone.calculateTransform();
        Matrix4._inverse(bone.temp_Transform, bone.invTransform);
        bone.temp_Transform.multiply(bone.invTransform, bone.boneTransform);
    }
}


function lerp(LHS, RHS, Weight)
{
    return LHS * (1 - Weight) + RHS * Weight;
}

function herp(LHS, RHS, LS, RS, Diff, Weight)
{
    var result;

    result = LHS + (LHS - RHS) * (2 * Weight - 3) * Weight * Weight;
    result += (Diff * (Weight - 1)) * (LS * (Weight - 1) + RS * Weight);

    return result;
}

function interpolate (frames, value)
{
    if (frames.length == 1) return frames[0].Value;

    for (var i=0; i<frames.length-1; i++)
    {
        if (value >= frames[i].Frame && value <= frames[i+1].Frame)
        {
            var LHS = frames[i], RHS = frames[i+1];

            var FrameDiff = value - LHS.Frame;
            var Weight = FrameDiff / (RHS.Frame - LHS.Frame);

            return herp(
                LHS.Value, RHS.Value,
                LHS.Slope, RHS.Slope,
                FrameDiff,
                Weight);
            
            // return lerp(LHS.Value, RHS.Value, Weight);
        }
    }

    throw("bad data");
}
    
function SkeletonMotion(){}
function SkeletonAnimationHelper (data)
{
    var _this = this;

    var FrameCount = data.FrameCount;
    var boneSize   = data.Bones.length;

    _this.FramesCount = data.FramesCount;

    _this.Motions = new Array(boneSize);

    for (var i=0; i<boneSize; i++)
    {
        var motion = _this.Motions[i] = new SkeletonMotion();
        var item = data.Bones[i];

        motion.name = item.Name;

        _this.Motions[item.Name] = motion;

        if (item.TranslationX) motion.TranslationX = item.TranslationX;
        if (item.TranslationY) motion.TranslationY = item.TranslationY;
        if (item.TranslationZ) motion.TranslationZ = item.TranslationZ;

        if (item.RotationX) motion.RotationX = item.RotationX;
        if (item.RotationY) motion.RotationY = item.RotationY;
        if (item.RotationZ) motion.RotationZ = item.RotationZ;

        if (item.IsAxisAngle) motion.AxisAngle = true;

        for (var j=0,m=_this.Bones.length; j<m; j++)
        {
            if (_this.Bones[j]._name == item.Name)
            {
                motion._bone = _this.Bones[j];
                motion._boneId = j;
                break;
            }
        }
    }

    _this._updateBones = function (framestamp)
    {
        
        var frameId = (framestamp * 0.02) % _this.FramesCount;

        _this.Motions.forEach(function (motion)
        {
            var bone = motion._bone;
            var temp = bone.Transform.identify();

                temp.m03 = bone._translation.x;
                temp.m13 = bone._translation.y;
                temp.m23 = bone._translation.z;

            if (motion.TranslationX) temp.m03 = interpolate(motion.TranslationX, frameId);
            if (motion.TranslationY) temp.m13 = interpolate(motion.TranslationY, frameId);
            if (motion.TranslationZ) temp.m23 = interpolate(motion.TranslationZ, frameId);

            if (motion.AxisAngle)
            {
                var x = y = z = 0;

                if (motion.RotationX) x = interpolate(motion.RotationX, frameId);
                if (motion.RotationY) y = interpolate(motion.RotationY, frameId);
                if (motion.RotationZ) z = interpolate(motion.RotationZ, frameId);
                
                var w = Math.sqrt(x*x+y*y+z*z);
                if (w == 0) return;
                var o = 1/w;
                x *= o;
                y *= o;
                z *= o;

                quaternion.fromAxis(x, y, z, w*2);
                quaternion.toMatrix4(rotation_matrix);

                temp.multiply(rotation_matrix, temp);
            }
            else
            {
                throw("unexpect")
            }
            
        });
        
        // _this.Motions.forEach(function (motion)
        // {
        //     if (motion.TranslationX) motion._bone._translation.x = interpolate(motion.TranslationX, frameId);
        //     if (motion.TranslationY) motion._bone._translation.y = interpolate(motion.TranslationY, frameId);
        //     if (motion.TranslationZ) motion._bone._translation.z = interpolate(motion.TranslationZ, frameId);

        //     // if (motion.AxisAngle)
        //     {
        //         if (motion.RotationX) motion._bone._rotation.x = interpolate(motion.RotationX, frameId);
        //         if (motion.RotationY) motion._bone._rotation.y = interpolate(motion.RotationY, frameId);
        //         if (motion.RotationZ) motion._bone._rotation.z = interpolate(motion.RotationZ, frameId);
        //     }
        // })

        _this.Bones.forEach(function (bone)
        {
            if (bone._parentId > -1)
            {
                var temp = bone.Transform;
                bone.parent.temp_Transform.multiply(temp, bone.temp_Transform);
            }

            // bone.calculateTransform();
            bone.updateBone()
            bone.temp_Transform.multiply(bone.invTransform, bone.boneTransform);

            // bone.Transform.log();
        })
        
        // motion._bone.boneTransform.log()
    }


    _this._transformFunc = function (vertex, index)
    {
        var x = y = z = 0;
        var nx = ny = nz = 0;

        for (var j=0, m=vertex.indices.length; j<m; j++)
        {
            if (vertex.weights[j] > 0)
            {
                transformOriginCoordinates(_this.Bones[vertex.indices[j]].boneTransform, vertex);
                x += vertex.weights[j] * vertex.x;
                y += vertex.weights[j] * vertex.y;
                z += vertex.weights[j] * vertex.z;


                transformOriginNormalCoordinates(_this.Bones[vertex.indices[j]].boneTransform, vertex);
                nx += vertex.weights[j] * vertex.normalX;
                ny += vertex.weights[j] * vertex.normalY;
                nz += vertex.weights[j] * vertex.normalZ;
            }

        }

        vertex.x = x;
        vertex.y = y;
        vertex.z = z;
        vertex.w = 1;   

        vertex.normalX = nx;
        vertex.normalY = ny;
        vertex.normalZ = nz;  
    }


}


function transformOriginCoordinates(matrix, vertex)
{
    var x = matrix.m00 * vertex.ox + matrix.m01 * vertex.oy + matrix.m02 * vertex.oz + matrix.m03;
    var y = matrix.m10 * vertex.ox + matrix.m11 * vertex.oy + matrix.m12 * vertex.oz + matrix.m13;
    var z = matrix.m20 * vertex.ox + matrix.m21 * vertex.oy + matrix.m22 * vertex.oz + matrix.m23;
    // var w = matrix.m30 * vertex.ox + matrix.m31 * vertex.oy + matrix.m32 * vertex.oz + matrix.m33;

    vertex.x = x;
    vertex.y = y;
    vertex.z = z;

    return vertex;
};

function transformOriginNormalCoordinates(matrix, vertex)
{
    var x = matrix.m00 * vertex.oNormalX + matrix.m01 * vertex.oNormalY + matrix.m02 * vertex.oNormalZ;
    var y = matrix.m10 * vertex.oNormalX + matrix.m11 * vertex.oNormalY + matrix.m12 * vertex.oNormalZ;
    var z = matrix.m20 * vertex.oNormalX + matrix.m21 * vertex.oNormalY + matrix.m22 * vertex.oNormalZ;
    // var w = matrix.m30 * vertex.ox + matrix.m31 * vertex.oy + matrix.m32 * vertex.oz + matrix.m33;

    vertex.normalX = x;
    vertex.normalY = y;
    vertex.normalZ = z;

    return vertex;
};

function request(url, type, callback)
{
    if (!callback)
    {
        type = 'blob';
        callback = type;
    }

    var xhr = new XMLHttpRequest();
    xhr.responseType = type;
    xhr.open('POST', url, true);

    xhr.onload = function ()
    {
        if (this.status == 200 || this.status == 0)
        {
            callback (xhr.response, xhr.responseUrl, xhr.responseType);
        }
        else
        {
            console.error("failed to load: " + url + "[" + this.status + "]");
        }
    }

    xhr.send();
}


function SubMesh()
{
    this._indices = [];
    this._vertices = [];
}

var D3M_Pokemon = (function(){
    
    var Vector3 = Engine.Vector3;


    function D3M_Pokemon (stage)
    {
        var _this = this;

        // var squareVertexes = [
        // [100,100,0],[-100,100,0],
        // [-100,-100, 0],[100,-100,0]];

        var vertices = new Array();

        // var GIS_23 = [{"position":[149.3842,4.2837,-117.6441],"uvs":[0.4234,1.4763],"normal":[0,0.8661,-0.4998]},{"position":[152.6233,4.2837,-117.6441],"uvs":[0.5104,1.4763],"normal":[0,0.8661,-0.4998]},{"position":[152.6233,4.2312,-117.8401],"uvs":[0.5104,1.4661],"normal":[0,1,0]},{"position":[149.3843,4.2312,-117.8401],"uvs":[0.4234,1.4661],"normal":[0,1,0]},{"position":[149.3842,4.4273,-117.5004],"uvs":[0.4234,1.4865],"normal":[0,0.5,-0.866]},{"position":[152.6233,4.4273,-117.5004],"uvs":[0.5104,1.4865],"normal":[0,0.5,-0.866]},{"position":[149.3842,4.6235,-117.4479],"uvs":[0.4234,1.4967],"normal":[0,0.0001,-1]},{"position":[152.6233,4.6235,-117.4479],"uvs":[0.5104,1.4967],"normal":[0,0,-1]},{"position":[149.3843,4.8196,-117.5004],"uvs":[0.4234,1.5069],"normal":[0,-0.4999,-0.8661]},{"position":[152.6233,4.8196,-117.5004],"uvs":[0.5104,1.5069],"normal":[0,-0.4999,-0.8661]},{"position":[149.3842,4.9633,-117.6441],"uvs":[0.4234,1.5171],"normal":[0,-0.866,-0.5]},{"position":[152.6233,4.9633,-117.6441],"uvs":[0.5104,1.5171],"normal":[0,-0.866,-0.5]},{"position":[149.3843,5.0159,-117.8401],"uvs":[0.4234,1.5273],"normal":[0,-1,-0.0001]},{"position":[152.6233,5.0159,-117.8401],"uvs":[0.5104,1.5273],"normal":[0,-1,0]},{"position":[152.6233,4.8196,-118.18],"uvs":[0.5104,1.5069],"normal":[0,-0.4999,0.8661]},{"position":[152.6233,4.9633,-118.0363],"uvs":[0.5104,1.5171],"normal":[0,-0.866,0.5]},{"position":[149.3843,4.9633,-118.0363],"uvs":[0.4234,1.5171],"normal":[0,-0.866,0.5]},{"position":[149.3842,4.8196,-118.18],"uvs":[0.4234,1.5069],"normal":[0,-0.4999,0.8661]},{"position":[149.3843,4.6235,-118.2324],"uvs":[0.4234,1.4967],"normal":[0,-0.0001,1]},{"position":[152.6233,4.6235,-118.2324],"uvs":[0.5104,1.4967],"normal":[0,-0.0001,1]},{"position":[149.3842,4.4273,-118.18],"uvs":[0.4234,1.4865],"normal":[0,0.5001,0.866]},{"position":[152.6233,4.4273,-118.18],"uvs":[0.5104,1.4865],"normal":[0,0.5,0.866]},{"position":[149.3843,4.2837,-118.0362],"uvs":[0.4234,1.4763],"normal":[0,0.8662,0.4997]},{"position":[152.6233,4.2837,-118.0362],"uvs":[0.5104,1.4763],"normal":[0,0.8662,0.4997]},{"position":[150.5405,4.527,-117.5645],"uvs":[0.54,1.5478],"normal":[-0.5001,0,-0.866]},{"position":[150.5405,4.1367,-117.5645],"uvs":[0.513,1.5478],"normal":[-0.5001,0,-0.866]},{"position":[150.3749,4.1368,-117.5201],"uvs":[0.513,1.5573],"normal":[-0.0001,0,-1]},{"position":[150.3749,4.5271,-117.52],"uvs":[0.54,1.5573],"normal":[-0.0003,0,-1]},{"position":[150.6617,4.527,-117.6857],"uvs":[0.54,1.5381],"normal":[-0.866,0,-0.5001]},{"position":[150.6617,4.1368,-117.6857],"uvs":[0.513,1.5381],"normal":[-0.866,0,-0.5001]},{"position":[150.7061,4.5271,-117.8512],"uvs":[0.54,1.5287],"normal":[-1,0,0]},{"position":[150.7061,4.1368,-117.8513],"uvs":[0.513,1.5287],"normal":[-1,0,-0.0001]},{"position":[150.6617,4.5271,-118.0169],"uvs":[0.54,1.5195],"normal":[-0.866,0,0.5]},{"position":[150.6617,4.1368,-118.0169],"uvs":[0.513,1.5195],"normal":[-0.866,0,0.5001]},{"position":[150.5405,4.527,-118.1381],"uvs":[0.54,1.5107],"normal":[-0.5001,0,0.866]},{"position":[150.5405,4.1368,-118.1381],"uvs":[0.513,1.5107],"normal":[-0.5,0,0.866]},{"position":[150.3748,4.527,-118.1825],"uvs":[0.54,1.5017],"normal":[0.0001,0,1]},{"position":[150.3749,4.1367,-118.1825],"uvs":[0.513,1.5017],"normal":[0.0001,0,1]},{"position":[150.2093,4.1368,-117.5644],"uvs":[0.513,1.5478],"normal":[0.5,0,-0.866]},{"position":[150.2093,4.527,-117.5644],"uvs":[0.54,1.5478],"normal":[0.5,0,-0.866]},{"position":[150.088,4.1367,-117.6856],"uvs":[0.513,1.5381],"normal":[0.866,-0.0001,-0.5]},{"position":[150.0881,4.527,-117.6856],"uvs":[0.54,1.5381],"normal":[0.866,0,-0.5001]},{"position":[150.0437,4.1368,-117.8513],"uvs":[0.513,1.5287],"normal":[1,0,0.0001]},{"position":[150.0437,4.527,-117.8513],"uvs":[0.54,1.5287],"normal":[1,0,0.0001]},{"position":[150.0881,4.1368,-118.0168],"uvs":[0.513,1.5195],"normal":[0.8659,0,0.5001]},{"position":[150.0881,4.5271,-118.0168],"uvs":[0.54,1.5195],"normal":[0.8659,0,0.5001]},{"position":[150.2093,4.1368,-118.1381],"uvs":[0.513,1.5107],"normal":[0.5001,0,0.866]},{"position":[150.2093,4.527,-118.1381],"uvs":[0.54,1.5107],"normal":[0.5002,0,0.8659]},{"position":[150.3631,4.0805,-117.857],"uvs":[0.2496,1.6434],"normal":[0,1,0]},{"position":[150.3631,4.0806,-118.2243],"uvs":[0.2101,1.6326],"normal":[-0.0001,0.6531,0.7572]},{"position":[150.1795,4.0806,-118.1751],"uvs":[0.21,1.6538],"normal":[0.3783,0.6533,0.6558]},{"position":[150.045,4.0806,-118.0407],"uvs":[0.2205,1.6722],"normal":[0.6557,0.6532,0.3786]},{"position":[149.9958,4.0806,-117.857],"uvs":[0.2388,1.6829],"normal":[0.7574,0.6529,0]},{"position":[150.045,4.0805,-117.6734],"uvs":[0.26,1.683],"normal":[0.656,0.6529,-0.3787]},{"position":[150.1795,4.0806,-117.539],"uvs":[0.2784,1.6725],"normal":[0.3783,0.6533,-0.6558]},{"position":[150.3631,4.0806,-117.4898],"uvs":[0.2891,1.6542],"normal":[-0.0001,0.6529,-0.7574]},{"position":[150.5467,4.0806,-117.539],"uvs":[0.2892,1.633],"normal":[-0.3787,0.6529,-0.656]},{"position":[150.6812,4.0806,-117.6734],"uvs":[0.2787,1.6146],"normal":[-0.6557,0.6532,-0.3787]},{"position":[150.7304,4.0806,-117.857],"uvs":[0.2604,1.6039],"normal":[-0.758,0.6523,0.0002]},{"position":[150.6812,4.0806,-118.0407],"uvs":[0.2392,1.6038],"normal":[-0.6559,0.6529,0.3788]},{"position":[150.5467,4.0806,-118.1751],"uvs":[0.2208,1.6143],"normal":[-0.3787,0.6537,0.6552]},{"position":[150.1794,4.11,-118.1751],"uvs":[0.8741,1.9388],"normal":[0.5,0,0.866]},{"position":[150.3631,4.11,-118.2243],"uvs":[0.8846,1.9388],"normal":[-0.0001,-0.0001,1]},{"position":[150.3631,4.1493,-118.2243],"uvs":[0.8846,1.9235],"normal":[0,0.0002,1]},{"position":[150.1794,4.1492,-118.1751],"uvs":[0.8741,1.9235],"normal":[0.5001,0,0.866]},{"position":[150.045,4.11,-118.0407],"uvs":[0.9887,1.9388],"normal":[0.8661,-0.0003,0.4999]},{"position":[150.1794,4.11,-118.1751],"uvs":[0.9995,1.9388],"normal":[0.5,0,0.866]},{"position":[150.1794,4.1492,-118.1751],"uvs":[0.9995,1.9235],"normal":[0.5001,0,0.866]},{"position":[150.045,4.1492,-118.0407],"uvs":[0.9887,1.9235],"normal":[0.8661,0,0.4998]},{"position":[149.9958,4.11,-117.857],"uvs":[0.9783,1.9388],"normal":[1,-0.0003,-0.0001]},{"position":[149.9958,4.1492,-117.857],"uvs":[0.9783,1.9235],"normal":[1,0.0002,0]},{"position":[150.045,4.11,-117.6734],"uvs":[0.9677,1.9388],"normal":[0.866,-0.0003,-0.5]},{"position":[150.045,4.1492,-117.6734],"uvs":[0.9677,1.9235],"normal":[0.866,0.0001,-0.5001]},{"position":[150.1794,4.11,-117.539],"uvs":[0.9571,1.9388],"normal":[0.5001,0,-0.866]},{"position":[150.1794,4.1492,-117.539],"uvs":[0.9571,1.9235],"normal":[0.4999,0,-0.8661]},{"position":[150.3631,4.11,-117.4898],"uvs":[0.9463,1.9388],"normal":[0.0002,-0.0001,-1]},{"position":[150.3631,4.1492,-117.4898],"uvs":[0.9463,1.9235],"normal":[-0.0001,0.0001,-1]},{"position":[150.5467,4.11,-117.539],"uvs":[0.9356,1.9388],"normal":[-0.5,-0.0005,-0.866]},{"position":[150.5467,4.1492,-117.539],"uvs":[0.9356,1.9235],"normal":[-0.4997,0,-0.8662]},{"position":[150.6812,4.11,-117.6734],"uvs":[0.9251,1.9388],"normal":[-0.866,0,-0.5001]},{"position":[150.6812,4.1492,-117.6734],"uvs":[0.9251,1.9235],"normal":[-0.866,0,-0.5]},{"position":[150.7303,4.11,-117.857],"uvs":[0.9148,1.9387],"normal":[-1,-0.0012,-0.0001]},{"position":[150.7303,4.1492,-117.857],"uvs":[0.9148,1.9235],"normal":[-1,0.0007,0]},{"position":[150.6812,4.11,-118.0406],"uvs":[0.9047,1.9388],"normal":[-0.8661,-0.0003,0.4998]},{"position":[150.6812,4.1492,-118.0407],"uvs":[0.9047,1.9235],"normal":[-0.866,-0.0004,0.5001]},{"position":[150.5467,4.11,-118.1751],"uvs":[0.8947,1.9388],"normal":[-0.4998,-0.0001,0.8662]},{"position":[150.5467,4.1492,-118.1751],"uvs":[0.8947,1.9235],"normal":[-0.5001,-0.0002,0.866]},{"position":[150.3631,4.1983,-118.2243],"uvs":[0.5607,0.0319],"normal":[0.0001,-0.6531,0.7572]},{"position":[150.3631,4.1983,-117.857],"uvs":[0.5632,0.0644],"normal":[0,-1,0]},{"position":[150.1794,4.1982,-118.1751],"uvs":[0.5448,0.0375],"normal":[0.3787,-0.653,0.6559]},{"position":[150.045,4.1983,-118.0407],"uvs":[0.5338,0.0503],"normal":[0.6558,-0.653,0.3788]},{"position":[149.9958,4.1983,-117.857],"uvs":[0.5307,0.0668],"normal":[0.7572,-0.6532,0]},{"position":[150.045,4.1983,-117.6734],"uvs":[0.5363,0.0827],"normal":[0.6558,-0.6532,-0.3785]},{"position":[150.1794,4.1983,-117.539],"uvs":[0.549,0.0937],"normal":[0.3787,-0.653,-0.6558]},{"position":[150.3631,4.1983,-117.4898],"uvs":[0.5656,0.0968],"normal":[-0.0001,-0.6534,-0.757]},{"position":[150.5467,4.1983,-117.539],"uvs":[0.5815,0.0912],"normal":[-0.3787,-0.6531,-0.6558]},{"position":[150.6812,4.1983,-117.6734],"uvs":[0.5925,0.0785],"normal":[-0.6558,-0.6532,-0.3786]},{"position":[150.7304,4.1983,-117.857],"uvs":[0.5956,0.0619],"normal":[-0.7577,-0.6526,-0.0001]},{"position":[150.6811,4.1982,-118.0407],"uvs":[0.59,0.046],"normal":[-0.6554,-0.6534,0.3787]},{"position":[150.5467,4.1983,-118.1751],"uvs":[0.5773,0.035],"normal":[-0.3789,-0.6528,0.656]},{"position":[150.1794,4.1492,-118.1751],"uvs":[0.0087,1.4971],"normal":[0.5001,0,0.866]},{"position":[150.3631,4.1493,-118.2243],"uvs":[0.0289,1.4971],"normal":[0,0.0002,1]},{"position":[150.3631,4.1983,-118.2243],"uvs":[0.0289,1.4923],"normal":[0.0001,-0.6531,0.7572]},{"position":[150.1794,4.1982,-118.1751],"uvs":[0.0087,1.4923],"normal":[0.3787,-0.653,0.6559]},{"position":[150.3631,4.11,-118.2243],"uvs":[0.0289,1.501],"normal":[-0.0001,-0.0001,1]},{"position":[150.1794,4.11,-118.1751],"uvs":[0.0087,1.501],"normal":[0.5,0,0.866]},{"position":[150.1795,4.0806,-118.1751],"uvs":[0.0087,1.5039],"normal":[0.3783,0.6533,0.6558]},{"position":[150.3631,4.0806,-118.2243],"uvs":[0.0289,1.5039],"normal":[-0.0001,0.6531,0.7572]},{"position":[150.045,4.1492,-118.0407],"uvs":[0.2276,1.4971],"normal":[0.8661,0,0.4998]},{"position":[150.1794,4.1492,-118.1751],"uvs":[0.2481,1.4971],"normal":[0.5001,0,0.866]},{"position":[150.1794,4.1982,-118.1751],"uvs":[0.2481,1.4923],"normal":[0.3787,-0.653,0.6559]},{"position":[150.045,4.1983,-118.0407],"uvs":[0.2276,1.4923],"normal":[0.6558,-0.653,0.3788]},{"position":[150.1794,4.11,-118.1751],"uvs":[0.2481,1.501],"normal":[0.5,0,0.866]},{"position":[150.045,4.11,-118.0407],"uvs":[0.2276,1.501],"normal":[0.8661,-0.0003,0.4999]},{"position":[150.045,4.0806,-118.0407],"uvs":[0.2276,1.5039],"normal":[0.6557,0.6532,0.3786]},{"position":[150.1795,4.0806,-118.1751],"uvs":[0.2481,1.5039],"normal":[0.3783,0.6533,0.6558]},{"position":[149.9958,4.1492,-117.857],"uvs":[0.2076,1.4971],"normal":[1,0.0002,0]},{"position":[149.9958,4.1983,-117.857],"uvs":[0.2076,1.4923],"normal":[0.7572,-0.6532,0]},{"position":[149.9958,4.11,-117.857],"uvs":[0.2076,1.501],"normal":[1,-0.0003,-0.0001]},{"position":[149.9958,4.0806,-117.857],"uvs":[0.2076,1.5039],"normal":[0.7574,0.6529,0]},{"position":[150.045,4.1492,-117.6734],"uvs":[0.1874,1.4971],"normal":[0.866,0.0001,-0.5001]},{"position":[150.045,4.1983,-117.6734],"uvs":[0.1874,1.4923],"normal":[0.6558,-0.6532,-0.3785]},{"position":[150.045,4.11,-117.6734],"uvs":[0.1874,1.501],"normal":[0.866,-0.0003,-0.5]},{"position":[150.045,4.0805,-117.6734],"uvs":[0.1874,1.5039],"normal":[0.656,0.6529,-0.3787]},{"position":[150.1794,4.1492,-117.539],"uvs":[0.1671,1.4971],"normal":[0.4999,0,-0.8661]},{"position":[150.1794,4.1983,-117.539],"uvs":[0.1671,1.4923],"normal":[0.3787,-0.653,-0.6558]},{"position":[150.1794,4.11,-117.539],"uvs":[0.1671,1.501],"normal":[0.5001,0,-0.866]},{"position":[150.1795,4.0806,-117.539],"uvs":[0.1671,1.5039],"normal":[0.3783,0.6533,-0.6558]},{"position":[150.3631,4.1492,-117.4898],"uvs":[0.1466,1.4971],"normal":[-0.0001,0.0001,-1]},{"position":[150.3631,4.1983,-117.4898],"uvs":[0.1466,1.4923],"normal":[-0.0001,-0.6534,-0.757]},{"position":[150.3631,4.11,-117.4898],"uvs":[0.1466,1.501],"normal":[0.0002,-0.0001,-1]},{"position":[150.3631,4.0806,-117.4898],"uvs":[0.1466,1.5039],"normal":[-0.0001,0.6529,-0.7574]},{"position":[150.5467,4.1492,-117.539],"uvs":[0.1262,1.4971],"normal":[-0.4997,0,-0.8662]},{"position":[150.5467,4.1983,-117.539],"uvs":[0.1262,1.4923],"normal":[-0.3787,-0.6531,-0.6558]},{"position":[150.5467,4.11,-117.539],"uvs":[0.1262,1.501],"normal":[-0.5,-0.0005,-0.866]},{"position":[150.5467,4.0806,-117.539],"uvs":[0.1262,1.5039],"normal":[-0.3787,0.6529,-0.656]},{"position":[150.6812,4.1492,-117.6734],"uvs":[0.1061,1.4971],"normal":[-0.866,0,-0.5]},{"position":[150.6812,4.1983,-117.6734],"uvs":[0.1061,1.4923],"normal":[-0.6558,-0.6532,-0.3786]},{"position":[150.6812,4.11,-117.6734],"uvs":[0.1061,1.501],"normal":[-0.866,0,-0.5001]},{"position":[150.6812,4.0806,-117.6734],"uvs":[0.1061,1.5039],"normal":[-0.6557,0.6532,-0.3787]},{"position":[150.7303,4.1492,-117.857],"uvs":[0.0864,1.4971],"normal":[-1,0.0007,0]},{"position":[150.7304,4.1983,-117.857],"uvs":[0.0864,1.4923],"normal":[-0.7577,-0.6526,-0.0001]},{"position":[150.7303,4.11,-117.857],"uvs":[0.0864,1.501],"normal":[-1,-0.0012,-0.0001]},{"position":[150.7304,4.0806,-117.857],"uvs":[0.0864,1.5039],"normal":[-0.758,0.6523,0.0002]},{"position":[150.6812,4.1492,-118.0407],"uvs":[0.0671,1.4971],"normal":[-0.866,-0.0004,0.5001]},{"position":[150.6811,4.1982,-118.0407],"uvs":[0.0671,1.4923],"normal":[-0.6554,-0.6534,0.3787]},{"position":[150.6812,4.11,-118.0406],"uvs":[0.0671,1.501],"normal":[-0.8661,-0.0003,0.4998]},{"position":[150.6812,4.0806,-118.0407],"uvs":[0.0671,1.5039],"normal":[-0.6559,0.6529,0.3788]},{"position":[150.5467,4.1492,-118.1751],"uvs":[0.048,1.4971],"normal":[-0.5001,-0.0002,0.866]},{"position":[150.5467,4.1983,-118.1751],"uvs":[0.048,1.4923],"normal":[-0.3789,-0.6528,0.656]},{"position":[150.5467,4.11,-118.1751],"uvs":[0.048,1.501],"normal":[-0.4998,-0.0001,0.8662]},{"position":[150.5467,4.0806,-118.1751],"uvs":[0.048,1.5039],"normal":[-0.3787,0.6537,0.6552]},{"position":[149.3843,4.6205,-117.834],"uvs":[0.252,1.6441],"normal":[-1,0,0]},{"position":[149.3842,4.2371,-118.0549],"uvs":[0.2125,1.6333],"normal":[-0.6536,0.6558,0.3779]},{"position":[149.3842,4.178,-117.8336],"uvs":[0.2124,1.6545],"normal":[-0.6533,0.7571,-0.0008]},{"position":[149.3842,4.2375,-117.6125],"uvs":[0.2229,1.6729],"normal":[-0.6534,0.6553,-0.3791]},{"position":[149.3843,4.3996,-117.4506],"uvs":[0.2412,1.6836],"normal":[-0.6533,0.3779,-0.656]},{"position":[149.3842,4.6208,-117.3916],"uvs":[0.2624,1.6837],"normal":[-0.6531,-0.0006,-0.7573]},{"position":[149.3842,4.842,-117.451],"uvs":[0.2808,1.6732],"normal":[-0.653,-0.3792,-0.6556]},{"position":[149.3842,5.0038,-117.613],"uvs":[0.2916,1.6548],"normal":[-0.6529,-0.6563,-0.3782]},{"position":[149.3842,5.0629,-117.8343],"uvs":[0.2916,1.6336],"normal":[-0.6529,-0.7574,0.0005]},{"position":[149.3842,5.0034,-118.0555],"uvs":[0.2811,1.6153],"normal":[-0.6537,-0.6549,0.379]},{"position":[149.3842,4.8414,-118.2173],"uvs":[0.2628,1.6046],"normal":[-0.6531,-0.3783,0.6561]},{"position":[149.3842,4.6201,-118.2764],"uvs":[0.2416,1.6044],"normal":[-0.6535,0.0007,0.757]},{"position":[149.3842,4.399,-118.217],"uvs":[0.2232,1.615],"normal":[-0.6533,0.3789,0.6555]},{"position":[149.3051,4.178,-117.8336],"uvs":[0.6239,1.5772],"normal":[0.653,0.7573,-0.0006]},{"position":[149.3842,4.178,-117.8336],"uvs":[0.6293,1.5772],"normal":[-0.6533,0.7571,-0.0008]},{"position":[149.3842,4.2371,-118.0549],"uvs":[0.6293,1.5676],"normal":[-0.6536,0.6558,0.3779]},{"position":[149.3051,4.2371,-118.0549],"uvs":[0.6239,1.5676],"normal":[0.6529,0.6563,0.3782]},{"position":[149.3051,4.2375,-117.6125],"uvs":[0.6239,1.4768],"normal":[0.6532,0.6554,-0.3791]},{"position":[149.3842,4.2375,-117.6125],"uvs":[0.6293,1.4768],"normal":[-0.6534,0.6553,-0.3791]},{"position":[149.3842,4.178,-117.8336],"uvs":[0.6293,1.4672],"normal":[-0.6533,0.7571,-0.0008]},{"position":[149.3051,4.178,-117.8336],"uvs":[0.6239,1.4672],"normal":[0.653,0.7573,-0.0006]},{"position":[149.3051,4.3996,-117.4506],"uvs":[0.6239,1.4862],"normal":[0.653,0.3782,-0.6562]},{"position":[149.3843,4.3996,-117.4506],"uvs":[0.6293,1.4862],"normal":[-0.6533,0.3779,-0.656]},{"position":[149.3051,4.6209,-117.3916],"uvs":[0.6239,1.4953],"normal":[0.6535,-0.0006,-0.7569]},{"position":[149.3842,4.6208,-117.3916],"uvs":[0.6293,1.4953],"normal":[-0.6531,-0.0006,-0.7573]},{"position":[149.3051,4.842,-117.451],"uvs":[0.6239,1.5043],"normal":[0.6534,-0.3791,-0.6553]},{"position":[149.3842,4.842,-117.451],"uvs":[0.6293,1.5043],"normal":[-0.653,-0.3792,-0.6556]},{"position":[149.3051,5.0038,-117.6131],"uvs":[0.6239,1.5133],"normal":[0.6535,-0.6559,-0.3779]},{"position":[149.3842,5.0038,-117.613],"uvs":[0.6293,1.5133],"normal":[-0.6529,-0.6563,-0.3782]},{"position":[149.3051,5.0628,-117.8344],"uvs":[0.6239,1.5222],"normal":[0.6537,-0.7568,0.0005]},{"position":[149.3842,5.0629,-117.8343],"uvs":[0.6293,1.5222],"normal":[-0.6529,-0.7574,0.0005]},{"position":[149.3051,5.0035,-118.0555],"uvs":[0.6239,1.5311],"normal":[0.6528,-0.6557,0.3793]},{"position":[149.3842,5.0034,-118.0555],"uvs":[0.6293,1.5311],"normal":[-0.6537,-0.6549,0.379]},{"position":[149.3051,4.8414,-118.2173],"uvs":[0.6239,1.5401],"normal":[0.6533,-0.3782,0.6559]},{"position":[149.3842,4.8414,-118.2173],"uvs":[0.6293,1.5401],"normal":[-0.6531,-0.3783,0.6561]},{"position":[149.3051,4.6201,-118.2764],"uvs":[0.6239,1.5491],"normal":[0.6531,0.0007,0.7573]},{"position":[149.3842,4.6201,-118.2764],"uvs":[0.6293,1.5491],"normal":[-0.6535,0.0007,0.757]},{"position":[149.3051,4.399,-118.217],"uvs":[0.6239,1.5583],"normal":[0.6532,0.3791,0.6555]},{"position":[149.3842,4.399,-118.217],"uvs":[0.6293,1.5583],"normal":[-0.6533,0.3789,0.6555]},{"position":[149.3051,4.2371,-118.0549],"uvs":[0.5609,0.0339],"normal":[0.6529,0.6563,0.3782]},{"position":[149.3051,4.6204,-117.834],"uvs":[0.5633,0.0664],"normal":[1,0,0]},{"position":[149.3051,4.178,-117.8336],"uvs":[0.545,0.0395],"normal":[0.653,0.7573,-0.0006]},{"position":[149.3051,4.2375,-117.6125],"uvs":[0.534,0.0523],"normal":[0.6532,0.6554,-0.3791]},{"position":[149.3051,4.3996,-117.4506],"uvs":[0.5308,0.0688],"normal":[0.653,0.3782,-0.6562]},{"position":[149.3051,4.6209,-117.3916],"uvs":[0.5364,0.0847],"normal":[0.6535,-0.0006,-0.7569]},{"position":[149.3051,4.842,-117.451],"uvs":[0.5492,0.0957],"normal":[0.6534,-0.3791,-0.6553]},{"position":[149.3051,5.0038,-117.6131],"uvs":[0.5657,0.0988],"normal":[0.6535,-0.6559,-0.3779]},{"position":[149.3051,5.0628,-117.8344],"uvs":[0.5817,0.0932],"normal":[0.6537,-0.7568,0.0005]},{"position":[149.3051,5.0035,-118.0555],"uvs":[0.5927,0.0804],"normal":[0.6528,-0.6557,0.3793]},{"position":[149.3051,4.8414,-118.2173],"uvs":[0.5958,0.0639],"normal":[0.6533,-0.3782,0.6559]},{"position":[149.3051,4.6201,-118.2764],"uvs":[0.5902,0.048],"normal":[0.6531,0.0007,0.7573]},{"position":[149.3051,4.399,-118.217],"uvs":[0.5774,0.037],"normal":[0.6532,0.3791,0.6555]},{"position":[151.0654,4.1516,-117.793],"uvs":[0.5228,0.483],"normal":[-0.9659,0,-0.2588]},{"position":[151.0061,4.1516,-117.7337],"uvs":[0.5228,0.4694],"normal":[-0.2588,0,-0.9659]},{"position":[151.0061,4.2922,-117.7337],"uvs":[0.4921,0.4694],"normal":[-0.2588,0,-0.9659]},{"position":[151.0654,4.2922,-117.793],"uvs":[0.4921,0.483],"normal":[-0.9659,0,-0.2589]},{"position":[151.0437,4.1516,-117.874],"uvs":[0.5228,0.4965],"normal":[-0.7071,0,0.7071]},{"position":[151.0437,4.2922,-117.874],"uvs":[0.4921,0.4965],"normal":[-0.7072,0,0.707]},{"position":[150.9627,4.1516,-117.8957],"uvs":[0.5228,0.5067],"normal":[0.2588,0,0.9659]},{"position":[150.9627,4.2922,-117.8957],"uvs":[0.4921,0.5067],"normal":[0.2587,0,0.9659]},{"position":[150.9627,4.1516,-117.8957],"uvs":[0.5228,0.5033],"normal":[0.2588,0,0.9659]},{"position":[150.9627,4.2922,-117.8957],"uvs":[0.4921,0.5033],"normal":[0.2587,0,0.9659]},{"position":[150.9034,4.2922,-117.8364],"uvs":[0.4921,0.4897],"normal":[0.9659,0,0.2588]},{"position":[150.9034,4.1516,-117.8364],"uvs":[0.5228,0.4897],"normal":[0.9659,0,0.2588]},{"position":[150.9251,4.1516,-117.7554],"uvs":[0.5228,0.4762],"normal":[0.7071,0,-0.7072]},{"position":[150.9251,4.2922,-117.7554],"uvs":[0.4921,0.4762],"normal":[0.7071,0,-0.7072]},{"position":[151.0061,4.1516,-117.7337],"uvs":[0.5228,0.466],"normal":[-0.2588,0,-0.9659]},{"position":[151.0061,4.2922,-117.7337],"uvs":[0.4921,0.466],"normal":[-0.2588,0,-0.9659]},{"position":[151.0061,4.1516,-117.7337],"uvs":[0.825,0.7583],"normal":[0,1,0]},{"position":[151.0654,4.1516,-117.793],"uvs":[0.7982,0.7458],"normal":[0,1,0]},{"position":[151.0437,4.1516,-117.874],"uvs":[0.7956,0.7164],"normal":[0,1,0]},{"position":[150.9034,4.1516,-117.8364],"uvs":[0.8466,0.7119],"normal":[0,1,0]},{"position":[151.0437,4.1516,-117.874],"uvs":[0.7956,0.7164],"normal":[0,1,0.0001]},{"position":[150.9627,4.1516,-117.8957],"uvs":[0.8198,0.6994],"normal":[0,1,0.0001]},{"position":[150.9034,4.1516,-117.8364],"uvs":[0.8466,0.7119],"normal":[0,1,0.0001]},{"position":[151.0061,4.1516,-117.7337],"uvs":[0.825,0.7583],"normal":[0,1,0]},{"position":[150.9034,4.1516,-117.8364],"uvs":[0.8466,0.7119],"normal":[0,1,0]},{"position":[150.9251,4.1516,-117.7554],"uvs":[0.8492,0.7414],"normal":[0,1,0]},{"position":[150.2339,5.3148,-117.6166],"uvs":[0.5158,0.6303],"normal":[0,-0.6327,0.7744]},{"position":[150.2793,5.3148,-117.6166],"uvs":[0.5246,0.6303],"normal":[0,-0.6327,0.7744]},{"position":[150.2793,5.3697,-117.5387],"uvs":[0.5246,0.5717],"normal":[0,-0.9614,0.2751]},{"position":[150.2339,5.3697,-117.5387],"uvs":[0.5158,0.5717],"normal":[0,-0.9614,0.2751]},{"position":[150.2339,5.2925,-117.6264],"uvs":[0.4443,0.8128],"normal":[1,0,0]},{"position":[150.2339,5.3148,-117.6166],"uvs":[0.4393,0.8096],"normal":[1,0,0]},{"position":[150.2339,5.3697,-117.5387],"uvs":[0.3695,0.8096],"normal":[1,0,0]},{"position":[150.2339,5.2524,-117.5874],"uvs":[0.4395,0.8262],"normal":[1,0,0]},{"position":[150.2339,5.3685,-117.518],"uvs":[0.3647,0.8127],"normal":[1,0,0]},{"position":[150.2339,5.3296,-117.4998],"uvs":[0.3647,0.823],"normal":[1,0,0]},{"position":[150.2339,5.3073,-117.5096],"uvs":[0.3696,0.8262],"normal":[1,0,0]},{"position":[150.2339,5.2536,-117.6082],"uvs":[0.4443,0.8231],"normal":[1,0,0]},{"position":[150.2339,5.3296,-117.4998],"uvs":[0.5158,0.5582],"normal":[0.0001,-0.4235,-0.9059]},{"position":[150.2339,5.3685,-117.518],"uvs":[0.5158,0.5668],"normal":[0,-0.4234,-0.9059]},{"position":[150.2793,5.3685,-117.518],"uvs":[0.5246,0.5668],"normal":[0.0001,-0.4235,-0.9059]},{"position":[150.2793,5.3296,-117.4998],"uvs":[0.5246,0.5582],"normal":[0.0002,-0.4236,-0.9058]},{"position":[150.2793,5.2536,-117.6082],"uvs":[0.5246,0.4899],"normal":[0,0.4232,0.9061]},{"position":[150.2793,5.2925,-117.6264],"uvs":[0.5246,0.4812],"normal":[0,0.4232,0.9061]},{"position":[150.2339,5.2925,-117.6264],"uvs":[0.5158,0.4812],"normal":[0,0.4232,0.9061]},{"position":[150.2339,5.2536,-117.6082],"uvs":[0.5158,0.4899],"normal":[0,0.4232,0.9061]},{"position":[150.2793,5.2524,-117.5875],"uvs":[0.5246,0.4947],"normal":[-0.0001,0.9616,-0.2746]},{"position":[150.2339,5.2524,-117.5874],"uvs":[0.5158,0.4947],"normal":[-0.0001,0.9615,-0.2748]},{"position":[150.2339,5.3073,-117.5096],"uvs":[0.5158,0.5533],"normal":[0,0.6324,-0.7746]},{"position":[150.2793,5.3073,-117.5096],"uvs":[0.5246,0.5533],"normal":[0.0001,0.6325,-0.7745]},{"position":[150.2339,5.2925,-117.6264],"uvs":[0.5158,0.6352],"normal":[0,-0.4017,0.9158]},{"position":[150.2793,5.2925,-117.6264],"uvs":[0.5246,0.6352],"normal":[0,-0.4017,0.9158]},{"position":[150.2793,5.3685,-117.518],"uvs":[0.5246,0.5668],"normal":[0,-0.9984,-0.0566]},{"position":[150.2339,5.3685,-117.518],"uvs":[0.5158,0.5668],"normal":[0,-0.9984,-0.0566]},{"position":[150.2339,5.3296,-117.4998],"uvs":[0.5158,0.5582],"normal":[0.0001,0.401,-0.9161]},{"position":[150.2793,5.3296,-117.4998],"uvs":[0.5246,0.5582],"normal":[0.0002,0.4012,-0.916]},{"position":[150.2793,5.2536,-117.6082],"uvs":[0.5246,0.4899],"normal":[0,0.9984,0.0573]},{"position":[150.2339,5.2536,-117.6082],"uvs":[0.5158,0.4899],"normal":[0,0.9984,0.0573]},{"position":[149.4927,4.1581,-118.0176],"uvs":[0.5552,0.7117],"normal":[0,1,0]},{"position":[149.5617,4.1581,-117.8999],"uvs":[0.4844,0.7115],"normal":[0,1,0.0001]},{"position":[149.6793,4.1581,-117.9689],"uvs":[0.4846,0.6408],"normal":[0,1,0]},{"position":[149.6104,4.1581,-118.0865],"uvs":[0.5553,0.641],"normal":[0,1,0]},{"position":[149.5617,4.1581,-117.8999],"uvs":[0.4844,0.7516],"normal":[0.8627,0,-0.5056]},{"position":[149.4927,4.1581,-118.0176],"uvs":[0.5552,0.7517],"normal":[0.8627,0,-0.5056]},{"position":[149.4927,4.1707,-118.0176],"uvs":[0.5551,0.7583],"normal":[0.8627,0,-0.5056]},{"position":[149.5617,4.1707,-117.8999],"uvs":[0.4844,0.7581],"normal":[0.8627,0,-0.5056]},{"position":[149.4927,4.1581,-118.0176],"uvs":[0.4548,0.7117],"normal":[0.5058,0,0.8627]},{"position":[149.6104,4.1581,-118.0865],"uvs":[0.455,0.641],"normal":[0.5058,0,0.8627]},{"position":[149.6104,4.1707,-118.0865],"uvs":[0.4615,0.641],"normal":[0.5058,0,0.8627]},{"position":[149.4927,4.1707,-118.0176],"uvs":[0.4614,0.7117],"normal":[0.5058,0,0.8627]},{"position":[149.6104,4.1581,-118.0865],"uvs":[0.5553,0.759],"normal":[-0.8626,0,0.5058]},{"position":[149.6793,4.1581,-117.9689],"uvs":[0.4846,0.7588],"normal":[-0.8626,0,0.5058]},{"position":[149.6793,4.1707,-117.9689],"uvs":[0.4846,0.7523],"normal":[-0.8626,0,0.5058]},{"position":[149.6104,4.1707,-118.0865],"uvs":[0.5554,0.7525],"normal":[-0.8626,0,0.5058]},{"position":[149.6793,4.1581,-117.9689],"uvs":[0.463,0.6408],"normal":[-0.5058,0,-0.8627]},{"position":[149.5617,4.1581,-117.8999],"uvs":[0.4628,0.7115],"normal":[-0.5058,0,-0.8627]},{"position":[149.5617,4.1707,-117.8999],"uvs":[0.4563,0.7115],"normal":[-0.5058,0,-0.8627]},{"position":[149.6793,4.1707,-117.9689],"uvs":[0.4564,0.6407],"normal":[-0.5058,0,-0.8627]},{"position":[149.679,4.1706,-118.1016],"uvs":[0.6095,0.5173],"normal":[-0.6506,-0.0014,0.7594]},{"position":[149.7284,4.1706,-118.0043],"uvs":[0.6095,0.529],"normal":[-0.997,-0.0012,0.0771]},{"position":[149.7281,4.4183,-118.0041],"uvs":[0.5821,0.529],"normal":[-0.9971,-0.0012,0.0766]},{"position":[149.6787,4.4183,-118.1014],"uvs":[0.5821,0.5173],"normal":[-0.6505,-0.0014,0.7595]},{"position":[149.6945,4.1706,-117.9005],"uvs":[0.6095,0.5454],"normal":[-0.7596,-0.0003,-0.6504]},{"position":[149.6942,4.4184,-117.9003],"uvs":[0.5821,0.5453],"normal":[-0.7591,-0.0003,-0.6509]},{"position":[149.5971,4.1706,-117.8511],"uvs":[0.6095,0.5618],"normal":[-0.0773,0.0008,-0.997]},{"position":[149.5968,4.4184,-117.8509],"uvs":[0.5821,0.5617],"normal":[-0.0767,0.0008,-0.9971]},{"position":[149.4933,4.1706,-117.885],"uvs":[0.6095,0.5779],"normal":[0.6505,0.0014,-0.7595]},{"position":[149.4931,4.4184,-117.8847],"uvs":[0.5821,0.5778],"normal":[0.6506,0.0014,-0.7594]},{"position":[149.6787,4.4183,-118.1014],"uvs":[0.5821,0.5212],"normal":[-0.6505,-0.0014,0.7595]},{"position":[149.5749,4.4183,-118.1353],"uvs":[0.5821,0.537],"normal":[0.0774,-0.0008,0.997]},{"position":[149.5752,4.1706,-118.1355],"uvs":[0.6095,0.5371],"normal":[0.0767,-0.0008,0.9971]},{"position":[149.679,4.1706,-118.1016],"uvs":[0.6095,0.5212],"normal":[-0.6506,-0.0014,0.7594]},{"position":[149.4776,4.4184,-118.0858],"uvs":[0.5821,0.5535],"normal":[0.7596,0.0003,0.6504]},{"position":[149.4779,4.1706,-118.0861],"uvs":[0.6095,0.5536],"normal":[0.7591,0.0003,0.6509]},{"position":[149.4437,4.4184,-117.9821],"uvs":[0.5821,0.5699],"normal":[0.997,0.0012,-0.077]},{"position":[149.444,4.1706,-117.9823],"uvs":[0.6095,0.5699],"normal":[0.9971,0.0012,-0.0766]},{"position":[149.4931,4.4184,-117.8847],"uvs":[0.5821,0.5819],"normal":[0.6506,0.0014,-0.7594]},{"position":[149.4933,4.1706,-117.885],"uvs":[0.6095,0.5818],"normal":[0.6505,0.0014,-0.7595]},{"position":[149.5862,4.1706,-117.9933],"uvs":[0.552,0.6728],"normal":[0.0001,1,-0.0001]},{"position":[149.7284,4.1706,-118.0043],"uvs":[0.5555,0.6943],"normal":[0.0001,1,-0.0001]},{"position":[149.679,4.1706,-118.1016],"uvs":[0.5393,0.6904],"normal":[0.0001,1,-0.0001]},{"position":[149.5752,4.1706,-118.1355],"uvs":[0.5305,0.6762],"normal":[0.0001,1,-0.0001]},{"position":[149.4779,4.1706,-118.0861],"uvs":[0.5344,0.66],"normal":[0.0001,1,-0.0001]},{"position":[149.444,4.1706,-117.9823],"uvs":[0.5486,0.6513],"normal":[0,1,-0.0001]},{"position":[149.4933,4.1706,-117.885],"uvs":[0.5648,0.6551],"normal":[0,1,-0.0001]},{"position":[149.5971,4.1706,-117.8511],"uvs":[0.5735,0.6693],"normal":[0.0001,1,-0.0001]},{"position":[149.6945,4.1706,-117.9005],"uvs":[0.5697,0.6855],"normal":[0.0001,1,-0.0001]},{"position":[152.6233,4.4273,-117.5004],"uvs":[0.4207,0.1259],"normal":[-1,0,0]},{"position":[152.6233,4.6235,-117.4479],"uvs":[0.4248,0.1412],"normal":[-1,0,0]},{"position":[152.6233,4.8196,-117.5004],"uvs":[0.4207,0.1565],"normal":[-1,0,0]},{"position":[152.6233,4.2312,-117.8401],"uvs":[0.3942,0.1106],"normal":[-1,0,0]},{"position":[152.6233,4.8196,-117.5004],"uvs":[0.4207,0.1565],"normal":[-1,0,0]},{"position":[152.6233,4.9633,-117.6441],"uvs":[0.4095,0.1677],"normal":[-1,0,0]},{"position":[152.6233,5.0159,-117.8401],"uvs":[0.3942,0.1718],"normal":[-1,0,0]},{"position":[152.6233,4.8196,-118.18],"uvs":[0.3677,0.1565],"normal":[-1,0,0]},{"position":[152.6233,5.0159,-117.8401],"uvs":[0.3942,0.1718],"normal":[-1,0,0]},{"position":[152.6233,4.9633,-118.0363],"uvs":[0.3789,0.1677],"normal":[-1,0,0]},{"position":[152.6233,4.8196,-118.18],"uvs":[0.3677,0.1565],"normal":[-1,0,0]},{"position":[152.6233,4.6235,-118.2324],"uvs":[0.3636,0.1412],"normal":[-1,0,0]},{"position":[152.6233,4.4273,-118.18],"uvs":[0.3677,0.1259],"normal":[-1,0,0]},{"position":[152.6233,4.2837,-118.0362],"uvs":[0.3789,0.1147],"normal":[-1,0,0]},{"position":[152.6233,4.2837,-117.6441],"uvs":[0.4095,0.1147],"normal":[-1,0,0]},{"position":[149.6677,4.8369,-118.2585],"uvs":[0.6095,0.5173],"normal":[-0.0168,-0.7769,0.6294]},{"position":[149.6678,4.8366,-118.1249],"uvs":[0.5863,0.5173],"normal":[-0.0219,-0.9998,-0.0024]},{"position":[149.5718,4.7993,-118.1249],"uvs":[0.5863,0.529],"normal":[0.6919,-0.722,-0.0021]},{"position":[149.5718,4.7996,-118.2585],"uvs":[0.6095,0.529],"normal":[0.5372,-0.5613,0.6295]},{"position":[149.5304,4.705,-118.1249],"uvs":[0.5863,0.5452],"normal":[0.9998,-0.0211,-0.0005]},{"position":[149.5303,4.7053,-118.2585],"uvs":[0.6095,0.5454],"normal":[0.7763,-0.0173,0.6301]},{"position":[149.5677,4.6091,-118.1249],"uvs":[0.5863,0.5617],"normal":[0.722,0.6919,0.0014]},{"position":[149.5676,4.6094,-118.2585],"uvs":[0.6095,0.5618],"normal":[0.5608,0.5363,0.6308]},{"position":[149.6619,4.5676,-118.1249],"uvs":[0.5863,0.5778],"normal":[0.0217,0.9998,0.0024]},{"position":[149.6619,4.5679,-118.2585],"uvs":[0.6095,0.5779],"normal":[0.017,0.7755,0.6311]},{"position":[149.6678,4.8366,-118.1249],"uvs":[0.5863,0.5212],"normal":[-0.0219,-0.9998,-0.0024]},{"position":[149.6677,4.8369,-118.2585],"uvs":[0.6095,0.5212],"normal":[-0.0168,-0.7769,0.6294]},{"position":[149.7619,4.7954,-118.2585],"uvs":[0.6095,0.5371],"normal":[-0.5609,-0.5374,0.6298]},{"position":[149.762,4.7951,-118.1249],"uvs":[0.5863,0.5369],"normal":[-0.7227,-0.6911,-0.0014]},{"position":[149.7992,4.6995,-118.2585],"uvs":[0.6095,0.5536],"normal":[-0.776,0.0165,0.6305]},{"position":[149.7993,4.6992,-118.1249],"uvs":[0.5863,0.5535],"normal":[-0.9998,0.0223,0.0005]},{"position":[149.7578,4.6052,-118.2585],"uvs":[0.6095,0.5699],"normal":[-0.5367,0.5602,0.631]},{"position":[149.7578,4.6049,-118.1249],"uvs":[0.5863,0.5699],"normal":[-0.6913,0.7225,0.0021]},{"position":[149.6619,4.5679,-118.2585],"uvs":[0.6095,0.5818],"normal":[0.017,0.7755,0.6311]},{"position":[149.6619,4.5676,-118.1249],"uvs":[0.5863,0.5818],"normal":[0.0217,0.9998,0.0024]},{"position":[149.6648,4.7025,-118.2585],"uvs":[0.5032,0.7408],"normal":[0,0.0001,1]},{"position":[149.6677,4.8369,-118.2585],"uvs":[0.4905,0.7585],"normal":[-0.0168,-0.7769,0.6294]},{"position":[149.5718,4.7996,-118.2585],"uvs":[0.5067,0.7623],"normal":[0.5372,-0.5613,0.6295]},{"position":[149.7619,4.7954,-118.2585],"uvs":[0.4817,0.7443],"normal":[-0.5609,-0.5374,0.6298]},{"position":[149.7992,4.6995,-118.2585],"uvs":[0.4855,0.7281],"normal":[-0.776,0.0165,0.6305]},{"position":[149.7578,4.6052,-118.2585],"uvs":[0.4997,0.7193],"normal":[-0.5367,0.5602,0.631]},{"position":[149.6619,4.5679,-118.2585],"uvs":[0.5159,0.7232],"normal":[0.017,0.7755,0.6311]},{"position":[149.5676,4.6094,-118.2585],"uvs":[0.5247,0.7373],"normal":[0.5608,0.5363,0.6308]},{"position":[149.5303,4.7053,-118.2585],"uvs":[0.5209,0.7536],"normal":[0.7763,-0.0173,0.6301]},{"position":[149.5792,4.6148,-118.2912],"uvs":[0.6057,0.8239],"normal":[0.5778,0.5748,0.5795]},{"position":[149.7439,4.6148,-118.2913],"uvs":[0.5716,0.8239],"normal":[-0.5778,0.5748,0.5795]},{"position":[149.7439,4.7933,-118.2912],"uvs":[0.5716,0.8608],"normal":[-0.5769,-0.5799,0.5752]},{"position":[149.5792,4.7933,-118.2912],"uvs":[0.6057,0.8608],"normal":[0.5769,-0.5799,0.5752]},{"position":[149.5792,4.6142,-118.2078],"uvs":[0.8926,0.7825],"normal":[0.7053,0.7089,0.0058]},{"position":[149.5792,4.6148,-118.2912],"uvs":[0.8793,0.7825],"normal":[0.5778,0.5748,0.5795]},{"position":[149.5792,4.7933,-118.2912],"uvs":[0.8793,0.8392],"normal":[0.5769,-0.5799,0.5752]},{"position":[149.5792,4.7926,-118.2078],"uvs":[0.8926,0.8392],"normal":[0.7089,-0.7052,-0.0058]},{"position":[149.5792,4.7926,-118.2078],"uvs":[0.7205,0.5403],"normal":[0.7089,-0.7052,-0.0058]},{"position":[149.5792,4.7933,-118.2912],"uvs":[0.7205,0.527],"normal":[0.5769,-0.5799,0.5752]},{"position":[149.7439,4.7933,-118.2912],"uvs":[0.6681,0.527],"normal":[-0.5769,-0.5799,0.5752]},{"position":[149.7439,4.7926,-118.2078],"uvs":[0.6681,0.5403],"normal":[-0.7089,-0.7052,-0.0058]},{"position":[149.7439,4.7926,-118.2078],"uvs":[0.9089,0.8392],"normal":[-0.7089,-0.7052,-0.0058]},{"position":[149.7439,4.7933,-118.2912],"uvs":[0.9222,0.8392],"normal":[-0.5769,-0.5799,0.5752]},{"position":[149.7439,4.6148,-118.2913],"uvs":[0.9222,0.7825],"normal":[-0.5778,0.5748,0.5795]},{"position":[149.7439,4.6142,-118.2078],"uvs":[0.9089,0.7825],"normal":[-0.7053,0.7089,0.0058]},{"position":[149.7439,4.6142,-118.2078],"uvs":[0.6082,0.9192],"normal":[-0.7053,0.7089,0.0058]},{"position":[149.7439,4.6148,-118.2913],"uvs":[0.6082,0.9272],"normal":[-0.5778,0.5748,0.5795]},{"position":[149.5792,4.6148,-118.2912],"uvs":[0.64,0.9272],"normal":[0.5778,0.5748,0.5795]},{"position":[149.5792,4.6142,-118.2078],"uvs":[0.64,0.9192],"normal":[0.7053,0.7089,0.0058]},{"position":[151.0221,4.8349,-118.252],"uvs":[0.6095,0.5173],"normal":[-0.1515,-0.7621,0.6295]},{"position":[151.0221,4.8346,-118.0845],"uvs":[0.5821,0.5173],"normal":[-0.1952,-0.9808,-0.0021]},{"position":[150.9151,4.8132,-118.0845],"uvs":[0.5821,0.529],"normal":[0.5559,-0.8312,-0.0017]},{"position":[150.9151,4.8136,-118.252],"uvs":[0.6095,0.529],"normal":[0.4316,-0.646,0.6296]},{"position":[150.8544,4.7225,-118.0845],"uvs":[0.5821,0.5453],"normal":[0.9809,-0.1945,-0.0004]},{"position":[150.8544,4.7228,-118.252],"uvs":[0.6095,0.5454],"normal":[0.7615,-0.1517,0.6301]},{"position":[150.8757,4.6154,-118.0845],"uvs":[0.5821,0.5617],"normal":[0.8312,0.5559,0.0012]},{"position":[150.8757,4.6157,-118.252],"uvs":[0.6095,0.5618],"normal":[0.6454,0.4309,0.6307]},{"position":[150.9665,4.5547,-118.0845],"uvs":[0.5821,0.5778],"normal":[0.195,0.9808,0.0021]},{"position":[150.9665,4.5551,-118.252],"uvs":[0.6095,0.5779],"normal":[0.1514,0.7609,0.631]},{"position":[151.0221,4.8346,-118.0845],"uvs":[0.5821,0.5212],"normal":[-0.1952,-0.9808,-0.0021]},{"position":[151.0221,4.8349,-118.252],"uvs":[0.6095,0.5212],"normal":[-0.1515,-0.7621,0.6295]},{"position":[151.1129,4.7743,-118.252],"uvs":[0.6095,0.5371],"normal":[-0.6456,-0.4317,0.6299]},{"position":[151.1129,4.7739,-118.0845],"uvs":[0.5821,0.537],"normal":[-0.8317,-0.5552,-0.0012]},{"position":[151.1342,4.6672,-118.252],"uvs":[0.6095,0.5536],"normal":[-0.7614,0.151,0.6304]},{"position":[151.1342,4.6668,-118.0845],"uvs":[0.5821,0.5535],"normal":[-0.9807,0.1955,0.0004]},{"position":[151.0735,4.5764,-118.252],"uvs":[0.6095,0.5699],"normal":[-0.4313,0.645,0.6309]},{"position":[151.0735,4.576,-118.0845],"uvs":[0.5821,0.5699],"normal":[-0.5554,0.8316,0.0018]},{"position":[150.9665,4.5551,-118.252],"uvs":[0.6095,0.5818],"normal":[0.1514,0.7609,0.631]},{"position":[150.9665,4.5547,-118.0845],"uvs":[0.5821,0.5819],"normal":[0.195,0.9808,0.0021]},{"position":[150.9943,4.695,-118.252],"uvs":[0.5875,0.8259],"normal":[0,0.0001,1]},{"position":[151.0221,4.8349,-118.252],"uvs":[0.5747,0.8435],"normal":[-0.1515,-0.7621,0.6295]},{"position":[150.9151,4.8136,-118.252],"uvs":[0.591,0.8473],"normal":[0.4316,-0.646,0.6296]},{"position":[151.1129,4.7743,-118.252],"uvs":[0.566,0.8293],"normal":[-0.6456,-0.4317,0.6299]},{"position":[151.1342,4.6672,-118.252],"uvs":[0.5698,0.8131],"normal":[-0.7614,0.151,0.6304]},{"position":[151.0735,4.5764,-118.252],"uvs":[0.584,0.8043],"normal":[-0.4313,0.645,0.6309]},{"position":[150.9665,4.5551,-118.252],"uvs":[0.6002,0.8082],"normal":[0.1514,0.7609,0.631]},{"position":[150.8757,4.6157,-118.252],"uvs":[0.609,0.8224],"normal":[0.6454,0.4309,0.6307]},{"position":[150.8544,4.7228,-118.252],"uvs":[0.6051,0.8386],"normal":[0.7615,-0.1517,0.6301]},{"position":[151.0135,4.7919,-118.3244],"uvs":[0.6095,0.5173],"normal":[-0.1514,-0.7617,0.63]},{"position":[151.0135,4.7916,-118.1639],"uvs":[0.6033,0.5173],"normal":[-0.1951,-0.9808,-0.0015]},{"position":[150.9394,4.7769,-118.1639],"uvs":[0.6033,0.529],"normal":[0.556,-0.8312,-0.0013]},{"position":[150.9394,4.7771,-118.3243],"uvs":[0.6095,0.529],"normal":[0.4317,-0.6456,0.63]},{"position":[150.8974,4.714,-118.1638],"uvs":[0.6033,0.5453],"normal":[0.9809,-0.1944,-0.0003]},{"position":[150.8974,4.7142,-118.3243],"uvs":[0.6095,0.5454],"normal":[0.7616,-0.1513,0.6301]},{"position":[150.9122,4.6398,-118.1638],"uvs":[0.6033,0.5618],"normal":[0.8313,0.5559,0.0008]},{"position":[150.9122,4.6401,-118.3242],"uvs":[0.6095,0.5618],"normal":[0.6455,0.4312,0.6303]},{"position":[150.975,4.5978,-118.1638],"uvs":[0.6033,0.5778],"normal":[0.1951,0.9808,0.0015]},{"position":[150.975,4.598,-118.3242],"uvs":[0.6095,0.5779],"normal":[0.1515,0.7612,0.6305]},{"position":[151.0135,4.7916,-118.1639],"uvs":[0.6033,0.5212],"normal":[-0.1951,-0.9808,-0.0015]},{"position":[151.0135,4.7919,-118.3244],"uvs":[0.6095,0.5212],"normal":[-0.1514,-0.7617,0.63]},{"position":[151.0764,4.7499,-118.3243],"uvs":[0.6095,0.5371],"normal":[-0.6455,-0.4314,0.6302]},{"position":[151.0764,4.7496,-118.1639],"uvs":[0.6033,0.5371],"normal":[-0.8317,-0.5552,-0.0008]},{"position":[151.0912,4.6757,-118.3243],"uvs":[0.6095,0.5536],"normal":[-0.7613,0.1514,0.6305]},{"position":[151.0912,4.6754,-118.1639],"uvs":[0.6033,0.5536],"normal":[-0.9807,0.1955,0.0003]},{"position":[151.0492,4.6128,-118.3242],"uvs":[0.6095,0.5699],"normal":[-0.4312,0.6454,0.6306]},{"position":[151.0492,4.6126,-118.1638],"uvs":[0.6033,0.5699],"normal":[-0.5554,0.8316,0.0013]},{"position":[150.975,4.598,-118.3242],"uvs":[0.6095,0.5818],"normal":[0.1515,0.7612,0.6305]},{"position":[150.975,4.5978,-118.1638],"uvs":[0.6033,0.5818],"normal":[0.1951,0.9808,0.0015]},{"position":[150.9943,4.695,-118.3243],"uvs":[0.5875,0.8259],"normal":[0.0003,0.0007,1]},{"position":[151.0135,4.7919,-118.3244],"uvs":[0.5747,0.8435],"normal":[-0.1514,-0.7617,0.63]},{"position":[150.9394,4.7771,-118.3243],"uvs":[0.591,0.8473],"normal":[0.4317,-0.6456,0.63]},{"position":[151.0764,4.7499,-118.3243],"uvs":[0.566,0.8293],"normal":[-0.6455,-0.4314,0.6302]},{"position":[151.0912,4.6757,-118.3243],"uvs":[0.5698,0.8131],"normal":[-0.7613,0.1514,0.6305]},{"position":[151.0492,4.6128,-118.3242],"uvs":[0.584,0.8043],"normal":[-0.4312,0.6454,0.6306]},{"position":[150.975,4.598,-118.3242],"uvs":[0.6002,0.8082],"normal":[0.1515,0.7612,0.6305]},{"position":[150.9122,4.6401,-118.3242],"uvs":[0.609,0.8224],"normal":[0.6455,0.4312,0.6303]},{"position":[150.8974,4.7142,-118.3243],"uvs":[0.6051,0.8386],"normal":[0.7616,-0.1513,0.6301]},{"position":[151.0111,4.4579,-118.2232],"uvs":[0.6095,0.5173],"normal":[-0.1515,-0.3461,0.9259]},{"position":[151.0111,4.4846,-118.1765],"uvs":[0.5821,0.5173],"normal":[-0.1953,-0.8513,0.487]},{"position":[150.9465,4.4734,-118.1701],"uvs":[0.5821,0.529],"normal":[0.5561,-0.7214,0.4127]},{"position":[150.9465,4.4467,-118.2168],"uvs":[0.6095,0.529],"normal":[0.4317,-0.2454,0.868]},{"position":[150.9099,4.426,-118.1427],"uvs":[0.5821,0.5453],"normal":[0.981,-0.1684,0.0964]},{"position":[150.9099,4.3993,-118.1894],"uvs":[0.6095,0.5454],"normal":[0.7616,0.1832,0.6216]},{"position":[150.9228,4.3701,-118.1104],"uvs":[0.5821,0.5617],"normal":[0.831,0.4828,-0.2762]},{"position":[150.9228,4.3434,-118.1571],"uvs":[0.6095,0.5618],"normal":[0.6453,0.6883,0.3313]},{"position":[150.9775,4.3384,-118.0921],"uvs":[0.5821,0.5778],"normal":[0.1949,0.8514,-0.487]},{"position":[150.9775,4.3117,-118.1388],"uvs":[0.6095,0.5779],"normal":[0.1514,0.9743,0.1669]},{"position":[151.0111,4.4846,-118.1765],"uvs":[0.5821,0.5212],"normal":[-0.1953,-0.8513,0.487]},{"position":[151.0111,4.4579,-118.2232],"uvs":[0.6095,0.5212],"normal":[-0.1515,-0.3461,0.9259]},{"position":[151.0658,4.4262,-118.2049],"uvs":[0.6095,0.5371],"normal":[-0.6458,-0.0595,0.7612]},{"position":[151.0658,4.4529,-118.1582],"uvs":[0.5821,0.537],"normal":[-0.8319,-0.4816,0.2755]},{"position":[151.0787,4.3702,-118.1726],"uvs":[0.6095,0.5536],"normal":[-0.7614,0.4458,0.4708]},{"position":[151.0787,4.397,-118.1259],"uvs":[0.5821,0.5535],"normal":[-0.9806,0.1701,-0.0973]},{"position":[151.0421,4.3228,-118.1452],"uvs":[0.6095,0.5699],"normal":[-0.4312,0.8738,0.2246]},{"position":[151.0421,4.3495,-118.0985],"uvs":[0.5821,0.5699],"normal":[-0.5552,0.7219,-0.413]},{"position":[150.9775,4.3117,-118.1388],"uvs":[0.6095,0.5818],"normal":[0.1514,0.9743,0.1669]},{"position":[150.9775,4.3384,-118.0921],"uvs":[0.5821,0.5819],"normal":[0.1949,0.8514,-0.487]},{"position":[150.9943,4.3848,-118.181],"uvs":[0.5875,0.8259],"normal":[0,0.5001,0.866]},{"position":[151.0111,4.4579,-118.2232],"uvs":[0.5747,0.8435],"normal":[-0.1515,-0.3461,0.9259]},{"position":[150.9465,4.4467,-118.2168],"uvs":[0.591,0.8473],"normal":[0.4317,-0.2454,0.868]},{"position":[151.0658,4.4262,-118.2049],"uvs":[0.566,0.8293],"normal":[-0.6458,-0.0595,0.7612]},{"position":[151.0787,4.3702,-118.1726],"uvs":[0.5698,0.8131],"normal":[-0.7614,0.4458,0.4708]},{"position":[151.0421,4.3228,-118.1452],"uvs":[0.584,0.8043],"normal":[-0.4312,0.8738,0.2246]},{"position":[150.9775,4.3117,-118.1388],"uvs":[0.6002,0.8082],"normal":[0.1514,0.9743,0.1669]},{"position":[150.9228,4.3434,-118.1571],"uvs":[0.609,0.8224],"normal":[0.6453,0.6883,0.3313]},{"position":[150.9099,4.3993,-118.1894],"uvs":[0.6051,0.8386],"normal":[0.7616,0.1832,0.6216]},{"position":[151.0059,4.4225,-118.2325],"uvs":[0.6095,0.5173],"normal":[-0.1514,-0.3454,0.9262]},{"position":[151.0059,4.4481,-118.1878],"uvs":[0.6033,0.5173],"normal":[-0.1952,-0.8508,0.488]},{"position":[150.9612,4.4404,-118.1834],"uvs":[0.6033,0.529],"normal":[0.5561,-0.7209,0.4135]},{"position":[150.9612,4.4148,-118.2281],"uvs":[0.6095,0.529],"normal":[0.4317,-0.2448,0.8682]},{"position":[150.9359,4.4076,-118.1644],"uvs":[0.6033,0.5453],"normal":[0.981,-0.1685,0.0966]},{"position":[150.9359,4.3819,-118.2091],"uvs":[0.6095,0.5454],"normal":[0.7616,0.1836,0.6215]},{"position":[150.9447,4.3688,-118.142],"uvs":[0.6033,0.5618],"normal":[0.8311,0.4824,-0.2767]},{"position":[150.9447,4.3432,-118.1867],"uvs":[0.6095,0.5618],"normal":[0.6454,0.6885,0.3308]},{"position":[150.9827,4.3469,-118.1293],"uvs":[0.6033,0.5778],"normal":[0.1949,0.8508,-0.488]},{"position":[150.9827,4.3213,-118.174],"uvs":[0.6095,0.5779],"normal":[0.1514,0.9744,0.1662]},{"position":[151.0059,4.4481,-118.1878],"uvs":[0.6033,0.5212],"normal":[-0.1952,-0.8508,0.488]},{"position":[151.0059,4.4225,-118.2325],"uvs":[0.6095,0.5212],"normal":[-0.1514,-0.3454,0.9262]},{"position":[151.0438,4.4005,-118.2199],"uvs":[0.6095,0.5371],"normal":[-0.6457,-0.0591,0.7613]},{"position":[151.0438,4.4262,-118.1752],"uvs":[0.6033,0.5371],"normal":[-0.8318,-0.4815,0.2761]},{"position":[151.0527,4.3618,-118.1975],"uvs":[0.6095,0.5536],"normal":[-0.7613,0.446,0.4706]},{"position":[151.0527,4.3874,-118.1528],"uvs":[0.6033,0.5536],"normal":[-0.9807,0.1698,-0.0974]},{"position":[151.0274,4.329,-118.1785],"uvs":[0.6095,0.5699],"normal":[-0.4312,0.874,0.2241]},{"position":[151.0274,4.3546,-118.1338],"uvs":[0.6033,0.5699],"normal":[-0.5553,0.7214,-0.4138]},{"position":[150.9827,4.3213,-118.174],"uvs":[0.6095,0.5818],"normal":[0.1514,0.9744,0.1662]},{"position":[150.9827,4.3469,-118.1293],"uvs":[0.6033,0.5818],"normal":[0.1949,0.8508,-0.488]},{"position":[150.9943,4.3719,-118.2033],"uvs":[0.5875,0.8259],"normal":[0.0002,0.5003,0.8658]},{"position":[151.0059,4.4225,-118.2325],"uvs":[0.5747,0.8435],"normal":[-0.1514,-0.3454,0.9262]},{"position":[150.9612,4.4148,-118.2281],"uvs":[0.591,0.8473],"normal":[0.4317,-0.2448,0.8682]},{"position":[151.0438,4.4005,-118.2199],"uvs":[0.566,0.8293],"normal":[-0.6457,-0.0591,0.7613]},{"position":[151.0527,4.3618,-118.1975],"uvs":[0.5698,0.8131],"normal":[-0.7613,0.446,0.4706]},{"position":[151.0274,4.329,-118.1785],"uvs":[0.584,0.8043],"normal":[-0.4312,0.874,0.2241]},{"position":[150.9827,4.3213,-118.174],"uvs":[0.6002,0.8082],"normal":[0.1514,0.9744,0.1662]},{"position":[150.9447,4.3432,-118.1867],"uvs":[0.609,0.8224],"normal":[0.6454,0.6885,0.3308]},{"position":[150.9359,4.3819,-118.2091],"uvs":[0.6051,0.8386],"normal":[0.7616,0.1836,0.6215]}];

        // var offvector = new Vector3(150.96420288085938, 4.725100040435791,-117.85800170898438)
        // for (var i=0, n=GIS_23.length; i<n; i++)
        // {
        //     var params = GIS_23[i];

        //     var vertex = new Vertex();

        //     if (params.position.length > 0)
        //     {
        //         vertex.x = (params.position[0]-offvector.x)*50;
        //         vertex.y = (params.position[1]-offvector.y)*50;
        //         vertex.z = (params.position[2]-offvector.z)*50;

        //         vertex.normalX = params.normal[0]
        //         vertex.normalY = params.normal[1]
        //         vertex.normalZ = params.normal[2]
        //     }

        //     vertices.push(vertex);
        // }

        // _this._vertices = vertices;
        // _this._indices  = //[0, 1, 2, 2, 3, 0];
        // [0,1,2,0,2,3,4,5,1,4,1,0,6,7,5,6,5,4,8,9,7,8,7,6,10,11,9,10,9,8,12,13,11,12,11,10,14,15,16,14,16,17,18,19,14,18,14,17,20,21,19,20,19,18,22,23,21,22,21,20,3,2,23,3,23,22,16,15,13,16,13,12,24,25,26,24,26,27,28,29,25,28,25,24,30,31,29,30,29,28,32,33,31,32,31,30,34,35,33,34,33,32,36,37,35,36,35,34,27,26,38,27,38,39,39,38,40,39,40,41,41,40,42,41,42,43,43,42,44,43,44,45,45,44,46,45,46,47,47,46,37,47,37,36,48,49,50,48,50,51,48,51,52,48,52,53,48,53,54,48,54,55,48,55,56,48,56,57,48,57,58,48,58,59,48,59,60,48,60,49,61,62,63,61,63,64,65,66,67,65,67,68,69,65,68,69,68,70,71,69,70,71,70,72,73,71,72,73,72,74,75,73,74,75,74,76,77,75,76,77,76,78,79,77,78,79,78,80,81,79,80,81,80,82,83,81,82,83,82,84,85,83,84,85,84,86,62,85,86,62,86,63,87,88,89,89,88,90,90,88,91,91,88,92,92,88,93,93,88,94,94,88,95,95,88,96,96,88,97,97,88,98,98,88,99,99,88,87,100,101,102,100,102,103,104,105,106,104,106,107,108,109,110,108,110,111,112,113,114,112,114,115,116,108,111,116,111,117,113,118,119,113,119,114,120,116,117,120,117,121,118,122,123,118,123,119,124,120,121,124,121,125,122,126,127,122,127,123,128,124,125,128,125,129,126,130,131,126,131,127,132,128,129,132,129,133,130,134,135,130,135,131,136,132,133,136,133,137,134,138,139,134,139,135,140,136,137,140,137,141,138,142,143,138,143,139,144,140,141,144,141,145,142,146,147,142,147,143,148,144,145,148,145,149,146,150,151,146,151,147,101,148,149,101,149,102,150,104,107,150,107,151,152,153,154,152,154,155,152,155,156,152,156,157,152,157,158,152,158,159,152,159,160,152,160,161,152,161,162,152,162,163,152,163,164,152,164,153,165,166,167,165,167,168,169,170,171,169,171,172,173,174,170,173,170,169,175,176,174,175,174,173,177,178,176,177,176,175,179,180,178,179,178,177,181,182,180,181,180,179,183,184,182,183,182,181,185,186,184,185,184,183,187,188,186,187,186,185,189,190,188,189,188,187,168,167,190,168,190,189,191,192,193,193,192,194,194,192,195,195,192,196,196,192,197,197,192,198,198,192,199,199,192,200,200,192,201,201,192,202,202,192,203,203,192,191,204,205,206,204,206,207,208,204,207,208,207,209,210,208,209,210,209,211,212,213,214,212,214,215,216,215,214,216,214,217,218,216,217,218,217,219,220,221,222,220,222,223,224,225,226,227,228,229,230,231,232,230,232,233,234,235,236,234,236,237,236,238,239,236,239,237,239,240,237,241,234,237,242,243,244,242,244,245,246,247,248,246,248,249,250,251,252,250,252,253,254,255,231,254,231,230,233,232,256,233,256,257,258,259,253,258,253,252,260,261,251,260,251,250,262,263,264,262,264,265,266,267,268,266,268,269,270,271,272,270,272,273,274,275,276,274,276,277,278,279,280,278,280,281,282,283,284,282,284,285,283,286,287,283,287,284,286,288,289,286,289,287,288,290,291,288,291,289,292,293,294,292,294,295,293,296,297,293,297,294,296,298,299,296,299,297,298,300,301,298,301,299,302,303,304,302,304,305,302,305,306,302,306,307,302,307,308,302,308,309,302,310,303,302,309,310,311,312,313,311,313,314,315,316,317,315,317,318,319,320,321,321,322,323,321,323,314,323,324,314,313,321,314,325,311,314,326,327,328,326,328,329,329,328,330,329,330,331,331,330,332,331,332,333,333,332,334,333,334,335,336,337,338,336,338,339,339,338,340,339,340,341,341,340,342,341,342,343,343,342,344,343,344,345,346,347,348,346,349,347,346,350,349,346,351,350,346,352,351,346,353,352,346,348,354,346,354,353,355,356,357,355,357,358,359,360,361,359,361,362,363,364,365,363,365,366,367,368,369,367,369,370,371,372,373,371,373,374,375,376,377,375,377,378,378,377,379,378,379,380,380,379,381,380,381,382,382,381,383,382,383,384,385,386,387,385,387,388,388,387,389,388,389,390,390,389,391,390,391,392,392,391,393,392,393,394,395,396,397,395,398,396,395,399,398,395,400,399,395,401,400,395,402,401,395,397,403,395,403,402,404,405,406,404,406,407,407,406,408,407,408,409,409,408,410,409,410,411,411,410,412,411,412,413,414,415,416,414,416,417,417,416,418,417,418,419,419,418,420,419,420,421,421,420,422,421,422,423,424,425,426,424,427,425,424,428,427,424,429,428,424,430,429,424,431,430,424,426,432,424,432,431,433,434,435,433,435,436,436,435,437,436,437,438,438,437,439,438,439,440,440,439,441,440,441,442,443,444,445,443,445,446,446,445,447,446,447,448,448,447,449,448,449,450,450,449,451,450,451,452,453,454,455,453,456,454,453,457,456,453,458,457,453,459,458,453,460,459,453,455,461,453,461,460,462,463,464,462,464,465,465,464,466,465,466,467,467,466,468,467,468,469,469,468,470,469,470,471,472,473,474,472,474,475,475,474,476,475,476,477,477,476,478,477,478,479,479,478,480,479,480,481,482,483,484,482,485,483,482,486,485,482,487,486,482,488,487,482,489,488,482,484,490,482,490,489];
        // _this._indices.reverse();

        
        
        _this._timestamp = 0;


        var workspace = "./pm0001_00_2/";

        var bodyName01 = [
        "pm0001_00_indices.0_0.json",
        "pm0001_00_indices.0_1.json",
        "pm0001_00_mesh.0.json",
        "pm0001_00_BodyA1.png", [2,1,0,0]];

        var bodyName02 = [
        "pm0001_00_indices.2_0.json",
        "pm0001_00_mesh.2.json",
        "pm0001_00_BodyB1.png", [2,1,0,1],
        ];

        var bodyName03 = [
        "pm0001_00_indices.1_0.json",
        "pm0001_00_mesh.1.json",
        "pm0001_00_Eye1_Merged.png",[2,1,0,0]];

        var bodyName04 = [
        "pm0001_00_indices.3_0.json",
        "pm0001_00_mesh.3.json",
        "pm0001_00_BodyA1.png"];


        function convertToVertex(data)
        {
            var vertex = new Vertex();
            vertex.ox = data.Position[0];
            vertex.oy = data.Position[1];
            vertex.oz = data.Position[2];

            vertex.x = vertex.ox;
            vertex.y = vertex.oy;
            vertex.z = vertex.oz;

            vertex.u = data.TexCoord0[0];
            vertex.v = data.TexCoord0[1];

            vertex.oNormalX = data.Normal[0];
            vertex.oNormalY = data.Normal[1];
            vertex.oNormalZ = data.Normal[2];

            vertex.normalX = vertex.oNormalX;
            vertex.normalY = vertex.oNormalY;
            vertex.normalZ = vertex.oNormalZ;

            vertex.indices =  data.Indices;
            vertex.weights =  data.Weights;

            return vertex;
        };

        _this._loader = Loader.createWithCompleted(_this._init, _this);
        _this._meshes = [new SubMesh(), new SubMesh(), new SubMesh()];

        var texture = _this._meshes[0]._texture = new Texture.createWithLoader(workspace + bodyName01[3])
        texture._uvTransform = bodyName01[4];

        _this._loader._request(workspace + bodyName01[0], "json", function (data){
            _this._meshes[0]._indices0 = data;
        })

        _this._loader._request(workspace + bodyName01[1], "json", function (data){
            _this._meshes[0]._indices1 = data;
        })

        _this._loader._request(workspace + bodyName01[2], "json", function (data){
            _this._meshes[0]._vertices = data.map(convertToVertex);
        })



        texture = _this._meshes[1]._texture = new Texture.createWithLoader(workspace + bodyName02[2])
        texture._uvTransform = bodyName02[3];

        _this._loader._request(workspace + bodyName02[0], "json", function (data){
            _this._meshes[1]._indices = data;
        })

        _this._loader._request(workspace + bodyName02[1], "json", function (data){
            _this._meshes[1]._vertices = data.map(convertToVertex);
        })


        texture = _this._meshes[2]._texture = new Texture.createWithLoader(workspace + bodyName03[2])
        texture._uvTransform = bodyName03[3];

        _this._loader._request(workspace + bodyName03[0], "json", function (data){
            _this._meshes[2]._indices = data;
        })

        _this._loader._request(workspace + bodyName03[1], "json", function (data){
            _this._meshes[2]._vertices = data.map(convertToVertex);
        })


        var skeletonName00 = ["pm0001_00_motion.6.json", "pm0001_00_skeleton.json"];

        _this._loader._request(workspace + skeletonName00[0], "json", function (data){
            _this._animation_data = data;
        })

        _this._loader._request(workspace + skeletonName00[1], "json", function (data){
            _this._skeleton_data = data;
        })

        _this._modelMatrix = Matrix4.RotationX(Math.PI/2);
        _this._transformMatrix = Matrix4.create();

        _this._completed = false;

    }
    
    var __proto__  = D3M_Pokemon.prototype;

    // D3M_Pokemon.prototype.__proto__ = Object3D.prototype;

    __proto__._init = function ()
    {
        var _this = this;

        _this._meshes[0]._indices = _this._meshes[0]._indices0.concat(_this._meshes[0]._indices1);

        SkeletonHelper.call(_this, _this._skeleton_data);
        SkeletonAnimationHelper.call(_this, _this._animation_data);

        // _this._wireframe();
        isNeedRedrawing = true;
        _this._completed = true;
    }


    __proto__._wireframe = function ()
    {
        var _this = this;

        _this._meshes.forEach(function (mesh)
            {
                var caches = {};

                mesh._wireframes = [];

                function isUnique(a, b)
                {
                    var hash = b > a ? a + "-" + b : b + "-" + a;
                    if (!caches[hash])
                    {
                        caches[hash] = true;
                        return true
                    }
                    return false;
                }

                for (var i=0, n=mesh._indices.length-2; i<n; i+=3)
                {
                    var i4 = mesh._indices[i];
                    var i5 = mesh._indices[i+1];
                    var i6 = mesh._indices[i+2];

                    isUnique(i4, i5) && mesh._wireframes.push(i4, i5);
                    isUnique(i6, i5) && mesh._wireframes.push(i6, i5);
                    isUnique(i4, i6) && mesh._wireframes.push(i4, i6);
                }
            });
    }

    __proto__._update = function (dt)
    {
        var _this = this;

        if (_this._completed)
        {
             _this._timestamp += dt;
            // isNeedRedrawing = true;
            _this._updateBones(_this._timestamp);
        }
       
    }

    var presetColor = new Engine.Color4(1, 1, 1, 1);
    var presetLightPosition = new Vector3D(3, 2, 5).normalize();
    var pColor = new Engine.Color4(1, 1, 1, 1);

    function computeDotLight(face, pLight)
    {
        var dot = face.normalX * pLight.x + face.normalY * pLight.y + face.normalZ * pLight.z;
        // return Math.max(0, dot);

        return (Math.max(0, dot)*0.5 + 0.5);
    }

    __proto__.render = function (graphics, cameraMatrix)
    {
        var _this = this;

        if (!_this._completed) return;

        var transformMatrix = _this._transformMatrix;
        cameraMatrix.multiply(_this._modelMatrix, _this._transformMatrix);

        _this._meshes.forEach(function (mesh)
        {
            mesh._vertices.forEach(function (vertex, index)
            {
                transformCoordinates(transformMatrix, vertex);
                _this._transformFunc(vertex, index);
                // graphics._drawBCircle(vertex.cameraX, vertex.cameraY, 3);
            
            });

            if (!!mesh._wireframes) for (var i=0, n=mesh._wireframes.length-1; i<n; i+=2)
            {
                var v0 = mesh._vertices[mesh._wireframes[i]];
                var v1 = mesh._vertices[mesh._wireframes[i+1]];

                graphics._drawBline(v0, v1);
            }

            for (var i=0, n=mesh._indices.length-2; i<n; i+=3)
            {
                var v4 = mesh._vertices[mesh._indices[i]];
                var v5 = mesh._vertices[mesh._indices[i+1]];
                var v6 = mesh._vertices[mesh._indices[i+2]];


                    if ((v5.cameraX - v4.cameraX) * (v6.cameraY - v4.cameraY) - (v5.cameraY - v4.cameraY) * (v6.cameraX - v4.cameraX) <= 0 
                
                 &&  v4.cameraX < graphics._centerX && v4.cameraX > -graphics._centerX &&
                    v4.cameraY < graphics._centerY && v4.cameraY > -graphics._centerY &&

                    v5.cameraX < graphics._centerX && v5.cameraX > -graphics._centerX &&
                    v5.cameraY < graphics._centerY && v5.cameraY > -graphics._centerY &&

                    v6.cameraX < graphics._centerX && v6.cameraX > -graphics._centerX &&
                    v6.cameraY < graphics._centerY && v6.cameraY > -graphics._centerY )
            
                {

                    // var difLight = 1; //computeDotLight(pFace, presetLightPosition);
                    v4._difLight = computeDotLight(v4, presetLightPosition);
                    v5._difLight = computeDotLight(v5, presetLightPosition);
                    v6._difLight = computeDotLight(v6, presetLightPosition);
                    graphics._drawTriangle(v4, v5, v6, pColor, mesh._texture);
                }

                // graphics._drawBline(v4, v5);
                // graphics._drawBline(v5, v6);
                // graphics._drawBline(v6, v4);
            }

        });

        

        


    }

    return D3M_Pokemon;

})();


