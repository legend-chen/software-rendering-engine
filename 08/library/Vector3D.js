// ______________________________________________________________________
//                                                               Vector3D


var Vector3D = (function(){
    
	/**
	* Creates a new Vector3D object whose three-dimensional values are specified by the x, y and z parameters. If you call this constructor function without parameters, a Vector3D with x, y and z properties set to zero is created.
	*
	* @paramxThe horizontal coordinate value. The default value is zero.
	* @paramyThe vertical coordinate value. The default value is zero.
	* @paramzThe depth coordinate value. The default value is zero.
	*/


    function Vector3D (a, b, c)
    {
        var _this = this;
        _this.x = a || 0;
        _this.y = b || 0;
        _this.z = c || 0;
    }
    
    var __proto__  = Vector3D.prototype;

    __proto__.fromValues = function (x, y, z)
    {
        var _this = this;

        _this.x = x;
        _this.y = y;
        _this.z = z;

        return _this;
    },

    __proto__.plus = function (v2)
    {
        var _this = this;

        _this.x += v2.x;
        _this.y += v2.y;
        _this.z += v2.z;

        return _this;
    },

    __proto__.minus = function (v2)
    {
        var _this = this;

        _this.x -= v2.x;
        _this.y -= v2.y;
        _this.z -= v2.z;

        return _this;
    },
        
    __proto__.scale = function (n)
    {
        var _this = this;

        _this.x *= n;
        _this.y *= n;
        _this.z *= n;

        return _this;
    },

    __proto__.invert = function (n)
    {
        var _this = this;

        _this.x = -_this.x;
        _this.y = -_this.y;
        _this.z = -_this.z;

        return _this;
    },
    
    // __proto__.divide = function (n)
    // {
    //     var _this = this;
    //     _this.x /= n;
    //     _this.y /= n;
    //     _this.z /= n;

    //     return _this;
    // },

    __proto__.dot = function (b)
    {
    	var a = this;
        return (a.x * b.x + a.y * b.y + a.z * b.z);
    },

    __proto__.cross = function (b)
    {
    	var a = this;
    	var x = a.y * b.z - a.z * b.y;
    	var y = a.z * b.x - a.x * b.z;
    	var z = a.x * b.y - a.y * b.x;

    	a.x = x;
    	a.y = y;
    	a.z = z;

        return a;
    }

    var __defineProperty__ = Object.defineProperty
    // returns the length of a 2D vector
    __proto__._Length = function ()
    {
        var a = this;
        return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    }

    // returns the squared length of a 2D vector
    __proto__._LengthSq = function ()
    {
        var a = this;
        return a.x * a.x + a.y * a.y + a.z * a.z;
    }

    __defineProperty__(__proto__, "LengthSq", 
    {
        get: __proto__._LengthSq
    });

    __defineProperty__(__proto__, "Length", 
    {
        get: __proto__._Length
    });

    // __proto__.sign = function(v1, v2)
    // {
    //     return v1.x * v2.y > v1.y * v2.x;
    // }
    // sets x and y to zero
    __proto__.zero = function ()
    {
        var _this = this;
        _this.x = 0;
        _this.y = 0;
        _this.z = 0;
        return _this;
    }

    /**
	 * Returns a new Vector3D object that is a clone of the original instance with the same three-dimensional values.
	 *
	 * @returnA new Vector3D instance with the same three-dimensional values as the original Vector3D instance.
	 */

    __proto__.clone = function ()
    {
        var _this = this;
        return new Vector3D(_this.x, _this.y, _this.z);
    }

    __proto__.copy = function (v2)
    {
        var _this = this;
        _this.x = v2.x;
        _this.y = v2.y;
        _this.z = v2.z;
        return _this;
    }

    // normalizes a 2D Vector
    __proto__.normalize = function()
    {
        var _this = this;
        var vector_length = _this._Length();
    
        if (vector_length > 0)
        {
            _this.x /= vector_length;
            _this.y /= vector_length;
            _this.z /= vector_length;
        }
        
        return _this;
    }
    /**
	 * The Vector3D class represents a value in a three-dimensional coordinate system.
	 *
	 * Properties x, y and z represent the horizontal, vertical and z the depth axes respectively.
	 *
	 */
    __proto__.toString = function ()
    {
    	var _this = this;
        return "[" + _this.x + ", " + _this.y + ", " + _this.z + "]";
    }

    __proto__.log = function ()
    {
        var _this = this;
        console.log("[" + _this.cameraX + ", " + _this.cameraY + ", " + _this.cameraZ + "]");
    }

    Vector3D.Cross = function (a, b)
    {
        var c = a.clone();
        
        return c.cross(b);
    }

    Vector3D.Normalize = function (origin)
    {
        var vector = origin.clone();
        
        return vector.normalize();
    }

    return Vector3D;
})();