/**
 * Created by legend on 17/01/25.
 */
/*
 * Copyright (C) 2012 Legend Chen.  All rights reserved.
 */

function trace()
{
    var args = arguments;
    var traceInfo = (new Error).stack.split("\n")[2];
    var traceLocation = traceInfo.substring(traceInfo.lastIndexOf(" "));
    
    Array.prototype.push.call(args, traceLocation);
    console.log.apply(null, args);
}

function format (text)
{
    var args = arguments;
    return text.replace(/%([1-9])/g, function($1, $2)
    {
        return args[$2] == undefined ? "" : args[$2];
    });
}

// var res = Loader.createWithCompleted(

//     function (){

//         main(res);
//     });

// res._request(workspace + "pm0001_00_motion.6.json", "json", function (data)
//     {
//         res._motion8 = data;
//     });


window.addEventListener("load", main);

function main()
{
    var clientWidth = document.body.offsetWidth;
    var clientHeight = document.body.offsetHeight;
    //initialize a working canvas to draw Graphics
    var stage  = new D3Container(clientWidth, clientHeight);
    var camera = new Camera3D();
    stage._camera = camera;

    stage.addchild(new D3M_Pokemon())
    document.body.appendChild(stage._canvas)

    //stage.debugger
    document.body.insertAdjacentHTML("AfterBegin", "<div style=\"position:absolute\"><div>" + clientWidth + " × " + clientHeight + "<br />devicePixelRatio = " + devicePixelRatio + "</div></div>");

    // stage._div_console = 
    var consoleinfo = document.body.firstChild;

    stage.trace = function() {
        var text = Array.prototype.slice.call(arguments).toString();
        consoleinfo.insertAdjacentHTML("beforeEnd",
            "<pre style=font-family:'Monaco';line-height:12px;font-size:12px>" + text + "</pre>");

        return consoleinfo.lastChild;
    }

    var fps_div = stage.trace();



    var fps_values = [];

    function fps_trace(text)
    {
        fps_div.innerHTML = "<pre style=font-family:'Monaco';line-height:12px;font-size:12px>" + text + "</pre>";
    }

    stage._fps_update = function (time_elapsed)
    {
        // if (!fps_calcuated) return;
        // fps_calcuated = false;

        var trace = stage.trace;

        var fps = 1000 / time_elapsed;
        var average_fps = 0;

        if (fps_values.length < 60) {
            fps_values.push(fps);
        } else {
            fps_values.shift();
            fps_values.push(fps);

            var totalValues = 0;

            for (var i = 0; i < fps_values.length; i++) {
                totalValues += fps_values[i];
            }

            average_fps = totalValues / fps_values.length;
        }

        fps_trace("fps " + fps.toFixed(2) + " / " + average_fps.toFixed(2));    
    }

    onDrawing(stage);
}
