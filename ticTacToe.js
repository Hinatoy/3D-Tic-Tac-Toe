var gl;
var points = [];
var normals = [];
var texCoords = [];
var ticTacToe = [0, 0, 0, 0, 0, 0, 0, 0, 0];
var currentCell = 0;
var circle = true;
var counterCircle = 0, counterCross = 0;
var circleWin = false;
var pressed = false;

var program0, program2;
var modelViewMatrixLoc0, modelViewMatrixLoc1, modelViewMatrixLoc2;

var eye = vec3(0, 0, 1);
var at = vec3(0, 0, 0);
const up = vec3(0, 1, 0);
var cameraVec = vec3(0, -0.7071, -0.7071); // 1.0/Math.sqrt(2.0)

var theta = 0;
var trballMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
var vertCubeStart, vertCubeEnd;

window.onload = function init()
{
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if( !gl ) {
        alert("WebGL isn't available!");
    }

    generateTexCube();

    // virtual trackball
    var trball = trackball(canvas.width, canvas.height);
    var mouseDown = false;

    canvas.addEventListener("mousedown", function (event) {
        trball.start(event.clientX, event.clientY);

        mouseDown = true;
    });

    canvas.addEventListener("mouseup", function (event) {
        mouseDown = false;
    });

    canvas.addEventListener("mousemove", function (event) {
        if (mouseDown) {
            trball.end(event.clientX, event.clientY);

            trballMatrix = mat4(trball.rotationMatrix);
        }
    });

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);

    // Load shaders and initialize attribute buffers
    program0 = initShaders(gl, "colorVS", "colorFS");
    gl.useProgram(program0);

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program0, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var viewMatrix = lookAt(eye, at, up);
    modelViewMatrixLoc0 = gl.getUniformLocation(program0, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc0, false, flatten(viewMatrix));

    // 3D perspective viewing
    var aspect = canvas.width / canvas.height;
    projectionMatrix = perspective(100, aspect, 0.1, 1000); 
    var projectionMatrixLoc = gl.getUniformLocation(program0, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    ///////////////////////////////////////////////////////////////////////////
    // program2 : Texture Mapping

    program2 = initShaders(gl, "texMapVS", "texMapFS");
    gl.useProgram(program2);

    // Load the data into the GPU
    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    vPosition = gl.getAttribLocation(program2, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Create a buffer object, initialize it, and associate it with 
    // the associated attribute variable in our vertex shader
    nBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    vNormal = gl.getAttribLocation(program2, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var tBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program2, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    modelViewMatrixLoc2 = gl.getUniformLocation(program2, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(viewMatrix));

    // 3D perspective viewing
    projectionMatrixLoc = gl.getUniformLocation(program2, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    setLighting(program2);
    setTexture();

    // Event listeners for buttons
    document.getElementById("left").onclick = function () {
        if(currentCell > 0) {
            currentCell--;
        }
    };
    document.getElementById("right").onclick = function () {
        if(currentCell < 8) {
            currentCell++;
        }
    };
    document.getElementById("up").onclick = function () {
        if(currentCell < 6) {
            currentCell += 3;
        }
    };
    document.getElementById("down").onclick = function () {
        if(currentCell > 2) {
            currentCell -= 3;
        }
    };
    document.getElementById("hit").onclick = function() {
        if(document.getElementById("hit").innerText == "Replay") {
            window.location.reload(false);
        }
        if(ticTacToe[currentCell] == 0) {
            pressed = true;
            if(circle) {
                ticTacToe[currentCell] = 1;
                circle = false;
                document.getElementById("hit").innerText = "X";
                document.getElementById("hit").className = "button green";
                counterCircle++;
            } else {
                ticTacToe[currentCell] = 2;
                circle = true;
                document.getElementById("hit").innerText = "O";
                document.getElementById("hit").className = "button yellow";
                counterCross++;
            }
            if(counterCircle >= 3 || counterCross >= 3) {
                var gameOver = winDetector();
                if(gameOver) {
                    if(circleWin) {
                        console.log("circle win");
                        console.log(ticTacToe);
                    } else {
                        console.log("cross win");
                        console.log(ticTacToe);
                    }
                    document.getElementById("hit").innerText = "Replay";
                    if(circleWin) document.getElementById("result").innerHTML = "NAUGHTS WON!";
                    else document.getElementById("result").innerHTML = "CROSSES WON!";
                    document.getElementById("hit").className = "button replay";
                }
            }
            if(counterCircle + counterCross == 9) {
                document.getElementById("result").innerHTML = "IT IS A DRAW!";
                document.getElementById("hit").className = "button replay";
                document.getElementById("hit").innerText = "Replay";
            }
        }
    }
    renderLightUp();
};

function winDetector() {
    for(var i = 0; i < 7; i++) {
        if(ticTacToe[i] != 0) {
            if(i % 3 == 0) {
                if(ticTacToe[i] == ticTacToe[i+1]) {
                    if(ticTacToe[i+1] == ticTacToe[i+2]) {
                        if(ticTacToe[i] == 1) circleWin = true; 
                        return true;
                    }
                }
            } 
            if(i < 3) {
                if(ticTacToe[i] == ticTacToe[i+3]) {
                    if(ticTacToe[i+3] == ticTacToe[i+6]) {
                        if(ticTacToe[i] == 1) circleWin = true;
                        return true;
                    }
                }
            } 
            if(i == 0) {
                if(ticTacToe[i] == ticTacToe[i + 4]) {
                    if(ticTacToe[i + 4] == ticTacToe[i + 8]) {
                        if(ticTacToe[i] == 1) circleWin = true;
                        return true;
                    }
                }
            } 
            if(i == 2) {
                if(ticTacToe[i] == ticTacToe[i+2]) {
                    if(ticTacToe[i+2] == ticTacToe[i+4]) {
                        if(ticTacToe[i] == 1) circleWin = true;
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function setLighting(program) {
    var lightPos = [0.0, 0.0, 2.0, 0.0];
    var lightAmbient = [0.0, 0.0, 0.0, 1.0];
    var lightDiffuse = [0.8, 0.8, 0.8, 1.0];
    var lightSpecular = [0.8, 0.8, 0.8, 1.0];

    var matAmbient = [1.0, 1.0, 1.0, 1.0];
    var matDiffuse = [0.8, 0.8, 0.8, 1.0];
    var matSpecular = [0.8, 0.8, 0.8, 1.0];
    
    var ambientProduct = mult(lightAmbient, matAmbient);
    var diffuseProduct = mult(lightDiffuse, matDiffuse);
    var specularProduct = mult(lightSpecular, matSpecular);

    var lightPosLoc = gl.getUniformLocation(program, "lightPos");
    gl.uniform4fv(lightPosLoc, lightPos);
    var ambientProductLoc = gl.getUniformLocation(program, "ambientProduct")
    gl.uniform4fv(ambientProductLoc, ambientProduct);
    var diffuseProductLoc = gl.getUniformLocation(program, "diffuseProduct");
    gl.uniform4fv(diffuseProductLoc, diffuseProduct);
    var specularProductLoc = gl.getUniformLocation(program, "specularProduct");
    gl.uniform4fv(specularProductLoc, specularProduct);
    
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), 20.0);    
}

function setTexture() {
    var image = new Image();
    image.src = "images/cross.jpg";
    
    var texture0 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    var image1 = new Image();
    image1.src = "images/circle.jpg";
    
    var texture1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    var image2 = new Image();
    image2.src = "images/clear.jpg";
    
    var texture2 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture2);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image2);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
}

function renderLightUp() {
    if(pressed) {
        if(!circle && theta > -90)
            theta -= 5;
        else if(circle && theta < 90) theta += 5;
    }

    if(theta == 90 || theta == -90) {
        theta = 0;
        pressed = false;
    }
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var viewMatrix = lookAt(eye, at, up);
    
    modelViewMatrix = mult(viewMatrix, trballMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));

    for(var i = 0; i < 9; i++) {
        gl.useProgram(program2);

        var x1 = i % 3 * 2 - 2;
        var y1 = Math.floor(i/3) * 2 - 2;

        if(ticTacToe[i] != 0) {
            if(ticTacToe[i] == 1) {
                var lightAmbient = [1.0, 1.0, 0.0, 1.0];
                var matAmbient = [1.0, 1.0, 1.0, 1.0];    
                var ambientProduct = mult(lightAmbient, matAmbient);
                var ambientProductLoc = gl.getUniformLocation(program2, "ambientProduct")
                gl.uniform4fv(ambientProductLoc, ambientProduct);
                var rMatrix = mult(rotateX(-90), rotateZ(0));
                var modelMatrix = mult(translate(x1, y1, -3), rMatrix);

            } else if(ticTacToe[i] == 2) {
                var lightAmbient = [0.3, 0.9, 0.0, 1.0];
                var matAmbient = [1.0, 1.0, 1.0, 1.0];    
                var ambientProduct = mult(lightAmbient, matAmbient);
                var ambientProductLoc = gl.getUniformLocation(program2, "ambientProduct")
                gl.uniform4fv(ambientProductLoc, ambientProduct);
                var rMatrix = mult(rotateX(90), rotateZ(0));
                var modelMatrix = mult(translate(x1, y1, -3), rMatrix);
            }
        } else {
            var lightAmbient = [0.0, 0.0, 0.0, 1.0];
            var matAmbient = [1.0, 1.0, 1.0, 1.0];    
            var ambientProduct = mult(lightAmbient, matAmbient);
            var ambientProductLoc = gl.getUniformLocation(program2, "ambientProduct")
            gl.uniform4fv(ambientProductLoc, ambientProduct);
            var rMatrix = mult(rotateX(0), rotateZ(0));
            var modelMatrix = mult(translate(x1, y1, -3), rMatrix);
        }
        if (i == currentCell) {
            if(ticTacToe[i] == 1) var lightAmbient = [0.7, 0.7, 0.3, 1.0];
            else if(ticTacToe[i] == 2) var lightAmbient = [0.51, 0.72, 0.31, 1.0];
            else var lightAmbient = [0.3, 0.3, 0.3, 1.0];
            var matAmbient = [1.0, 1.0, 1.0, 1.0];    
            var ambientProduct = mult(lightAmbient, matAmbient);
            var ambientProductLoc = gl.getUniformLocation(program2, "ambientProduct")
            gl.uniform4fv(ambientProductLoc, ambientProduct); 
            if(pressed) {
                if(i == currentCell) {
                    var rMatrix = mult(rotateX(theta), rotateZ(0));
                    var modelMatrix = mult(translate(x1, y1, -3), rMatrix);
                }
            }
        }

        modelMatrix = mult(trballMatrix, modelMatrix);
        modelViewMatrix = mult(viewMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
        gl.uniform1i(gl.getUniformLocation(program2, "texture"), 2); //clear
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.uniform1i(gl.getUniformLocation(program2, "texture"), 0); //cross
        gl.drawArrays(gl.TRIANGLES, 6, 6);
        gl.uniform1i(gl.getUniformLocation(program2, "texture"), 2); //clear
        gl.drawArrays(gl.TRIANGLES, 12, 12);
        gl.uniform1i(gl.getUniformLocation(program2, "texture"), 1); //circle
        gl.drawArrays(gl.TRIANGLES, 24, 6);
        gl.uniform1i(gl.getUniformLocation(program2, "texture"), 2); //cross
        gl.drawArrays(gl.TRIANGLES, 30, 6);
    }
    requestAnimationFrame(renderLightUp);
}

function generateTexCube() {
    vertCubeStart = points.length;
    vertCubeEnd = 0;
    texQuad(1, 0, 3, 2);
    texQuad(2, 3, 7, 6);
    texQuad(3, 0, 4, 7);
    texQuad(4, 5, 6, 7);
    texQuad(5, 4, 0, 1);
    texQuad(6, 5, 1, 2);
}

function texQuad(a, b, c, d) {
    const vertexPos = [
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4( 0.5, -0.5, -0.5, 1.0),
        vec4( 0.5,  0.5, -0.5, 1.0),
        vec4(-0.5,  0.5, -0.5, 1.0),
        vec4(-0.5, -0.5,  0.5, 1.0),
        vec4( 0.5, -0.5,  0.5, 1.0),
        vec4( 0.5,  0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0)
    ];

    const vertexNormals = [
        vec4(-0.57735, -0.57735, -0.57735, 0.0),
        vec4( 0.57735, -0.57735, -0.57735, 0.0),
        vec4( 0.57735,  0.57735, -0.57735, 0.0),
        vec4(-0.57735,  0.57735, -0.57735, 0.0),
        vec4(-0.57735, -0.57735,  0.57735, 0.0),
        vec4( 0.57735, -0.57735,  0.57735, 0.0),
        vec4( 0.57735,  0.57735,  0.57735, 0.0),
        vec4(-0.57735,  0.57735,  0.57735, 0.0)
    ];

    const texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

    // two triangles: (a, b, c) and (a, c, d)
    // solid colored faces
    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    vertCubeEnd++;

    points.push(vertexPos[b]);
    normals.push(vertexNormals[b]);
    texCoords.push(texCoord[1]);
    vertCubeEnd++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    vertCubeEnd++;

    points.push(vertexPos[a]);
    normals.push(vertexNormals[a]);
    texCoords.push(texCoord[0]);
    vertCubeEnd++;

    points.push(vertexPos[c]);
    normals.push(vertexNormals[c]);
    texCoords.push(texCoord[2]);
    vertCubeEnd++;

    points.push(vertexPos[d]);
    normals.push(vertexNormals[d]);
    texCoords.push(texCoord[3]);
    vertCubeEnd++;
}
