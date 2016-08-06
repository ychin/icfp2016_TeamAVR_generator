var global = window;

var canvasWidth=300;

var solutionCanvas = document.getElementById('solution_canvas');
var problemCanvas = document.getElementById('problem_canvas');
var sctx = solutionCanvas.getContext('2d');
var pctx = problemCanvas.getContext("2d");

function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.stroke();
}

function drawLines(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.stroke();
}

function parseFraction(text) {
    var outputNum;
    if (text.search('/') == -1) {
        outputNum = parseInt(text);
    }
    else {
        var textSplit = text.split('/');
        outputNum = parseInt(textSplit[0]) / parseInt(textSplit[1]);
    }
    return outputNum;
}

function parseSolution(text) {
    var output = {
        positions: [],
        facets: [],
        dest: [],

        // TODO: add solution size calculator
        solutionSize: 0
    };

    var lines = text.split('\n').map(function(line) {return line.trim();}).filter(function(line) { if (line == "") return false; return true; });


    var currentIndex = 0;
    var numPos = parseInt(lines[currentIndex++]);
    for (var i = 0; i < numPos; i++) {
        var curLine = lines[currentIndex++];
        var curLineSplit = curLine.split(',');
        output.positions.push({
            x: parseFraction(curLineSplit[0]),
            y: parseFraction(curLineSplit[1])
        });
    }

    var numFacets = parseInt(lines[currentIndex++]);
    for (var i = 0; i < numFacets; ++i) {
        var curLine = lines[currentIndex++];
        var curLineSplit = curLine.split(' ');
        var facetVertCount = parseInt(curLineSplit[0]);

        var newFacet = [];
        for (var j = 0; j < facetVertCount; j++) {
            var facetStr = curLineSplit[j + 1];
            var facetNum = parseInt(facetStr);
            newFacet.push(facetNum);
        }
        output.facets.push(newFacet);
    }

    for (var i = 0; i < numPos; i++) {
        var curLine = lines[currentIndex++];
        var curLineSplit = curLine.split(',');
        output.dest.push({
            x: parseFraction(curLineSplit[0]),
            y: parseFraction(curLineSplit[1])
        });
    }

    return output;
}


function normalizePointToCanvas(pt, boundaryWidth) {
    var realWidth = canvasWidth - boundaryWidth * 2;
    return {
        x : pt.x * realWidth + boundaryWidth,
        y : pt.y * realWidth + boundaryWidth
    };
}

function drawSolution(solution) {
    sctx.clearRect(0,0,canvasWidth,canvasWidth);
    pctx.clearRect(0,0,canvasWidth,canvasWidth);
    for (var i = 0; i < solution.facets.length; i++){
        var facet = solution.facets[i];
        var points = facet.map(function(ptIdx) { return solution.positions[ptIdx]; });
        var pointsUnNorm  = points.map(function(pt) {
            return normalizePointToCanvas(pt, 2);
        });
        drawLines(sctx, pointsUnNorm);

        var destPoints = facet.map(function(ptIdx) { return solution.dest[ptIdx]; });
        var destPtUnNorm = destPoints.map(function(pt) {
            // May need to make smaller for out of bounds
            return normalizePointToCanvas(pt, 2);
        });
        drawLines(pctx, destPtUnNorm);
    }
}

function injectPtToSolution(solution, pt) {
}

function generate() {
    var solutionTxt = document.getElementById('solutionTxt');
    var solution = parseSolution(solutionTxt.value);
    drawSolution(solution);
}

function log(text) {
    var logElem = document.getElementById('log');
    logElem.innerHTML = text;
}

drawLine(sctx, 0,0, canvasWidth, canvasWidth);
drawLine(sctx, canvasWidth,0, 0, canvasWidth);
drawLine(pctx, 0,0, canvasWidth, canvasWidth);
drawLine(pctx, canvasWidth,0, 0, canvasWidth);
