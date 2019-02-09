/**
 * Created by legend on 16/12/7.
 */
/*
 * Copyright (C) 2012 Legend Chen.  All rights reserved.
 */
// 2015-11-20 foundation of graphics
// 2016-12-12 uniform points on cubic bezier curve

(function() {
    var style = document.createElement("style"),
        styleText = "body {position:absolute; top:0; left:0; right:0; bottom:0; cursor:default}";
    style.type = 'text/css';
    style.appendChild(document.createTextNode(styleText));
    document.getElementsByTagName('head')[0].appendChild(style);
})();


    var isNeedRedrawing = true;


    var TimeScale = 1;

    function onDrawing(stage)
    {
        var Vector3 = Engine.Vector3;


        var camera = stage._camera;

        var last_timestamp;

        var movement = new Vector3D();

        function draw(timestamp) {
            var time_elapsed = (timestamp - last_timestamp) * TimeScale || 0;
            last_timestamp = timestamp;

            stage._fps_update(time_elapsed);

            // if (isNeedRedrawing)
            {
                var nscroll = nScrollOriginDelta - nScrollDelta;
                movement.x = (pMouseOrigin.x - pMouse.x);
                movement.y = (pMouseOrigin.y - pMouse.y);

                var isCameraUpdated = false;

                if (Math.abs(nscroll) > 0.1) {
                    camera.radius += nscroll * 0.5;
                    nScrollOriginDelta -= nscroll * 0.5;

                    isCameraUpdated = true;
                }

                if (Math.abs(movement.x) > 0.001 ||
                    Math.abs(movement.y) > 0.001) {
                    camera.rotationX -= movement.x * 0.001
                    camera.rotationY -= movement.y * 0.001

                    pMouseOrigin.x -= movement.x * 0.05;
                    pMouseOrigin.y -= movement.y * 0.05;

                    isCameraUpdated = true;
                }

                if (isCameraUpdated) {
                    camera.composeCameraMatrix();
                } else {
                    isNeedRedrawing = false;
                }

                stage.render(time_elapsed);
                fps_calcuated = true;
            }

            requestAnimationFrame(draw);
        }

        requestAnimationFrame(draw);

        var isMoving;
        var isCaptured;

        var pMouseOrigin = new Vector3();
        var pMouse = new Vector3();

        function disableDefault(event) {
            event.stopPropagation();
            event.preventDefault();
        };

        function onMouseDown(event) {
            var pageX = event.pageX;
            var pageY = event.pageY;
            var clientRect = event.target.getBoundingClientRect();

            var center = stage._center;

            pMouse.x = pageX - center.x - clientRect.left;
            pMouse.y = pageY - center.y - clientRect.top;

            pMouseOrigin.x = pMouse.x;
            pMouseOrigin.y = pMouse.y;

            isCaptured = true;

            //trace("mousedown", event.target.offsetLeft)
        }

        function onMouseMove() {
            if (isCaptured) {
                var pageX = event.pageX;
                var pageY = event.pageY;
                var clientRect = event.target.getBoundingClientRect();

                var center = stage._center;

                pMouse.x = pageX - center.x - clientRect.left;
                pMouse.y = pageY - center.y - clientRect.top;

                isNeedRedrawing = true;
                isMoving = true;
                //trace("mousemoe", vSelectedPoint)
            }
        }

        function onMouseUp() {
            if (isCaptured && !isMoving) {
                var pageX = event.pageX;
                var pageY = event.pageY;
                var clientRect = event.target.getBoundingClientRect();

                var center = stage._center;
                pMouse.x = pageX - center.x - clientRect.left;
                pMouse.y = pageY - center.y - clientRect.top;

                //var ground = stage.container.background;

                // ground.onTouch(pMouse.x, -pMouse.y);

            }

            isMoving = false;
            isCaptured = false;
        }

        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        document.addEventListener("mousewheel", onScrollMove);

        var nScrollDelta = 0;
        var nScrollOriginDelta = 0;

        function onScrollMove(event) {

            var delta = event.wheelDelta;
            var deltaX = event.wheelDeltaX;
            var deltaY = event.wheelDeltaY;

            nScrollDelta += delta*0.3;
            isNeedRedrawing = true;

            // event.preventDefault();
            disableDefault(event);
        }

        document.addEventListener("keydown", function(event)
        {
            if (event.keyCode == 68) //&& event.metaKey)
            {
                disableDefault(event)
                //                println("cmd + shirt+ d");
                saveCanvas("demo.png", stage._canvas);
            }
        });
    }