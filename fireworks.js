var gl; var canvas;
var program; var program2;
var bufferId; var bufferId2; var buffer2Size = 64000;
var vPosition; var vInitialPosition; var vFinalPosition; var vColor;
var vVelocity; var vExplosionVelocity; var vExplosionVelocity2; var vLaunchTime;
var isDrawing = false; var isAutomatic = false; var secondLevel = false;
var startPos; var endPos;
var vertices = []; var points = []; var nPoints = 0; var colorIndex = 0; 
var colors = [vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 1.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0), vec4(1.0, 1.0, 0.0, 1.0), vec4(1.0, 0.0, 1.0, 1.0), vec4(0.0, 1.0, 1.0, 1.0)];
var omegaIndex = 0; 
var omega = [0.0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
var t = 0.0;

/* runs when window is loaded */
window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }
    
    // Mouse events
    canvas.addEventListener("mousedown", mousedown);
    canvas.addEventListener("mouseup", mouseup);
    canvas.addEventListener("mousemove", mousemove);
    window.addEventListener("keydown", keyEvents); 
    
    // Configure WebGL
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader"); // vertex shader for interactivity
    gl.useProgram(program);
    
    // Load the data into the GPU
    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, 32, gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    program2 = initShaders(gl, "vertex-shader2", "fragment-shader"); // vertex shader for points
    gl.useProgram(program2);
    
    bufferId2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId2);
    gl.bufferData(gl.ARRAY_BUFFER, 8*16*buffer2Size, gl.STATIC_DRAW);
    
    vInitialPosition = gl.getAttribLocation(program2, "vInitialPosition");
    gl.vertexAttribPointer(vInitialPosition, 4, gl.FLOAT, false, 128, 0);
    gl.enableVertexAttribArray(vInitialPosition);
    
    vFinalPosition = gl.getAttribLocation(program2, "vFinalPosition");
    gl.vertexAttribPointer(vFinalPosition, 4, gl.FLOAT, false, 128, 16);
    gl.enableVertexAttribArray(vFinalPosition);
    
    vLaunchTime = gl.getAttribLocation(program2, "vLaunchTime");
    gl.vertexAttribPointer(vLaunchTime, 4, gl.FLOAT, false, 128, 32);
    gl.enableVertexAttribArray(vLaunchTime);
    
    vExplosionVelocity = gl.getAttribLocation(program2, "vExplosionVelocity");
    gl.vertexAttribPointer(vExplosionVelocity, 4, gl.FLOAT, false, 128, 48);
    gl.enableVertexAttribArray(vExplosionVelocity);
    
    vExplosionVelocity2 = gl.getAttribLocation(program2, "vExplosionVelocity2");
    gl.vertexAttribPointer(vExplosionVelocity2, 4, gl.FLOAT, false, 128, 64);
    gl.enableVertexAttribArray(vExplosionVelocity2);

    vColor = gl.getAttribLocation(program2, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 128, 80);
    gl.enableVertexAttribArray(vColor);

    vFallTime = gl.getAttribLocation(program2, "vFallTime");
    gl.vertexAttribPointer(vFallTime, 4, gl.FLOAT, false, 128, 96);
    gl.enableVertexAttribArray(vFallTime);

    vFallSpeed = gl.getAttribLocation(program2, "vFallSpeed");
    gl.vertexAttribPointer(vFallSpeed, 4, gl.FLOAT, false, 128, 112);
    gl.enableVertexAttribArray(vFallSpeed);
    
    gl.useProgram(program);
    render();
}

function mousedown(ev) {
    if (ev.button == 0) {
        startPos = getMousePos(ev, canvas);
        endPos = getMousePos(ev, canvas);
        isDrawing = true;
        handelers();
    }
}

function mouseup(ev) {
    if (ev.button == 0) {
        isDrawing = false;
        handelers();
        generatePoints("ManualLaunch");
    }
}

function mousemove(ev) {
    if (ev.button == 0) {
        if (isDrawing) {
            endPos = getMousePos(ev, canvas);
            if (endPos[1] < startPos[1]) {
                endPos[1] = startPos[1];
            }
            handelers();
        }
    }
}

function keyEvents(ev) {
    switch (ev.which) {
        case 32:
            isAutomatic = !isAutomatic; // space event
            break;
        case 83:
            secondLevel = !secondLevel; // s event
    }
}

function handelers() {
    vertice = [];
    vertices[0] = startPos;
    vertices[1] = endPos;
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices));
}

function getMousePos(ev, canvas) {
    var x = -1 + 2 * (ev.offsetX/canvas.width);
    var y = 1 - 2 * (ev.offsetY/canvas.height);
    return vec4(x, y, 1.0, 1.0);
}

function generatePoints(code) {
    var p; var v;
    if (code == "ManualLaunch") { // runs on manual mode
        p = startPos;
        v = endPos;
    } else if (code == "Space") { // runs on automatic mode
        var x = getRandomBetween(-0.9, 0.9);
        p = vec4(x, -1, 1.0, 1.0); 
        v = vec4(x, getRandomBetween(0.2, 0.6), 1.0, 1.0);
    }
    var tim = vec4(t, t, 1.0, 1.0);
    var numberPoints;
    if (secondLevel) {
        numberPoints = getRandomBetween(200, 250);
    } else {
        numberPoints = getRandomBetween(10, 250);
    }
    
    var speedY = v[1] - p[1];
    var timeFallPoints = (-speedY / (-0.8)) - 0.35;
    var numberFallPoints;
    if (numberPoints >= 150) {
        numberFallPoints = numberPoints/4;
    } else {
        numberFallPoints = 0;
    }

    for (var i = numberPoints; i > 0; i--) {
        var explosionVel;
        if (secondLevel) {
            var om = omega[omegaIndex]; omegaIndex = (omegaIndex + 1) % omega.length;
            explosionVel = vec4(Math.cos(om)*0.25, Math.sin(om)*0.25, 0.0, 0.0);
        } else {
            explosionVel = vec4(0.0, 0.0, 0.0, 0.0);
        }
        var theta = getRandomBetween(0, 2*Math.PI);
        var intensity = getRandomBetween(0.0, 0.2);
        var explosionVel2 = vec4(Math.cos(theta)*intensity, Math.sin(theta)*intensity, 0.0, 0.0);
        points[nPoints%buffer2Size] = p; nPoints++;
        points[nPoints%buffer2Size] = v; nPoints++;
        points[nPoints%buffer2Size] = tim; nPoints++;
        points[nPoints%buffer2Size] = explosionVel; nPoints++;
        points[nPoints%buffer2Size] = explosionVel2; nPoints++;
        points[nPoints%buffer2Size] = colors[colorIndex]; nPoints++;
        if (numberPoints - i < numberFallPoints && speedY > 0.5) {
            var fallTime = t + ((timeFallPoints / numberFallPoints) * (numberPoints - i));
            points[nPoints%buffer2Size] = vec4(fallTime, fallTime, fallTime, fallTime); nPoints++;
            var fallAngle = getRandomBetween(5*Math.PI/4, 7*Math.PI/4);
            points[nPoints%buffer2Size] = vec4(Math.cos(fallAngle)*intensity, Math.sin(fallAngle)*intensity, 0.0, 0.0); nPoints++;
        } else {
            points[nPoints%buffer2Size] = vec4(0.0, 0.0, 0.0, 0.0); nPoints++;
            points[nPoints%buffer2Size] = vec4(0.0, 0.0, 0.0, 0.0); nPoints++;
        }
    }
    colorIndex = (colorIndex + 1) % colors.length;
}

function getRandomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    if (isDrawing) { // runs when user is drawing the line
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINES, 0, 2);
        gl.drawArrays(gl.POINTS, 0, 1);
    }
    gl.useProgram(program2);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId2);
    gl.vertexAttribPointer(vInitialPosition, 4, gl.FLOAT, false, 128, 0);
    gl.vertexAttribPointer(vFinalPosition, 4, gl.FLOAT, false, 128, 16);
    gl.vertexAttribPointer(vLaunchTime, 4, gl.FLOAT, false, 128, 32);
    gl.vertexAttribPointer(vExplosionVelocity, 4, gl.FLOAT, false, 128, 48);
    gl.vertexAttribPointer(vExplosionVelocity2, 4, gl.FLOAT, false, 128, 64);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 128, 80);
    gl.vertexAttribPointer(vFallTime, 4, gl.FLOAT, false, 128, 96);
    gl.vertexAttribPointer(vFallSpeed, 4, gl.FLOAT, false, 128, 112);
    // runs on automatic mode
    if (isAutomatic && Math.round(t * 100) % 60 == 0) {
        generatePoints("Space");
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
    
    var time = gl.getUniformLocation(program2, "time");
    t = t + (1/60); // increment time
    gl.uniform4f(time, t, t, t, t);
    gl.drawArrays(gl.POINTS, 0, nPoints/8);
    requestAnimFrame(render);
}