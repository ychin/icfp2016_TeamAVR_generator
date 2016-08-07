var global = window;

var canvasWidth=300;

var undoStack = [];
var undoIndex = 0;

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
        outputNum = new Fraction(parseFloat(text));
    }
    else {
        var textSplit = text.split('/');
        outputNum = new Fraction(parseInt(textSplit[0]) , parseInt(textSplit[1]));
    }
    return outputNum;
}

function parsePt(text) {
    var curLineSplit = text.split(',');
    return {
        x: parseFraction(curLineSplit[0]),
        y: parseFraction(curLineSplit[1])
    };
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
        output.positions.push(parsePt(curLine));
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
        output.dest.push(parsePt(curLine));
    }

    return output;
}


function outputFrac(num) {
    var output = '';
    if (num.s < 0)
        output = '-';
    if (num.d == 1) {
        output += num.n + '';
    }
    else {
        output += num.n + '/' + num.d;
    }
    return output;
}

function outputPt(pt) {
    return outputFrac(pt.x) + ',' + outputFrac(pt.y);
}

function outputSolution(solution) {
    var output = '';
    output += solution.positions.length;
    for (var i = 0; i < solution.positions.length; i++) {
        var pos = solution.positions[i];
        output += '\n' + outputPt(pos);
    }

    output += '\n' + solution.facets.length;
    for (var i = 0; i < solution.facets.length; i++) {
        var facet = solution.facets[i];
        output += '\n' + facet.length;
        for (var j = 0; j < facet.length; j++) {
            output += ' ' + facet[j];
        }
    }

    for (var i = 0; i < solution.dest.length; i++) {
        output += '\n' + outputPt(solution.dest[i]);
    }

    return output;
}


function normalizePointToCanvas(pt, boundaryWidth) {
    var realWidth = canvasWidth - boundaryWidth * 2;
    return {
        x : pt.x.valueOf() * realWidth + boundaryWidth,
        y : (1-pt.y.valueOf()) * realWidth + boundaryWidth
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

function displaySolution(solution) {
    var text = outputSolution(solution);
    document.getElementById('solutionTxt').value = text;
    displaySizeOfSolution(text); 
}

function displaySizeOfSolution(text) {
    var sizeOfSolution = 0;
    for (var i = 0; i < text.length; i++) {
        if (text[i] == ' ' || text[i] == '\n' || text[i] == '\t' || text[i] == '\r')
            continue;
        sizeOfSolution++;
    }

    document.getElementById('problemOutput').innerHTML = 'Size: ' + sizeOfSolution;
}

function updateSolution(solution) {
    displaySolution(solution);
    drawSolution(solution);
    // To add later
    //generateInteractiveRollover(solution);
}

function injectPtToSolution(solution, pt) {
}

function generate() {
    var solutionTxt = document.getElementById('solutionTxt');
    var solution = parseSolution(solutionTxt.value);
    drawSolution(solution);
    displaySizeOfSolution(solutionTxt.value);

    global.lastKnownSolution = solution; // for debugging

    undoStack = [];
    undoIndex = -1;
    addUndo();
}

function testFunc() {
    // This is for whatever debug testing for local testing
    var ratio = Math.random();
    splitFacets(lastKnownSolution, genPt(ratio,0), genPt(ratio,1));
    updateSolution(lastKnownSolution);
}

function log(text) {
    var logElem = document.getElementById('log');
    logElem.innerHTML = text;
}

function selectDefaultProblem() {
    var text = global.problemSelect.options[global.problemSelect.selectedIndex].text;
    var solution = known_solutions[text];
    var solutionTxt = document.getElementById('solutionTxt');
    solutionTxt.value = solution.trim();
}

function addFoldFunc() {
    var flipRight = document.getElementById('postFlipRight').checked;
    var flipPt1 = parsePt(document.getElementById('postFlipPt1').value);
    var flipPt2 = parsePt(document.getElementById('postFlipPt2').value);
    applyPostFlip(lastKnownSolution, flipPt1, flipPt2, flipRight);
    updateSolution(lastKnownSolution);

    addUndo();
}

function applyFoldFlipRight() {
    // Doesn't do anything
}

function transformFunc() {
    var s = lastKnownSolution;

    var offsetPt = document.getElementById('translateOffset').value;
    if (offsetPt != '') {
        s.dest = s.dest.map(function(p) { return addPt(p, parsePt(offsetPt)); });
    }

    var flipAlongPt1 = document.getElementById('flipAlong1').value;
    var flipAlongPt2 = document.getElementById('flipAlong2').value;
    if (flipAlongPt1 != '' && flipAlongPt2 != '') {
        var flipP1 = parsePt(flipAlongPt1);
        var flipP2 = parsePt(flipAlongPt2);
        s.dest = s.dest.map(function(p) { return calculateFlip(p, flipP1, flipP2); });
    }

    updateSolution(lastKnownSolution);

    addUndo();
}

function addUndo() {
    var lastSolution = outputSolution(lastKnownSolution);
    undoStack.push(lastSolution);
    undoIndex += 1;
    undoStack.length = undoIndex + 1;
}

function applyUndo() {
    if (undoIndex >= 1) {
        var undoSolution = parseSolution(undoStack[undoIndex - 1]);
        updateSolution(undoSolution);
        global.lastKnownSolution = undoSolution;
        undoIndex -= 1;
    }
}
function applyRedo() {
    if (undoIndex < undoStack.length - 1) {
        var undoSolution = parseSolution(undoStack[undoIndex+1]);
        updateSolution(undoSolution);
        global.lastKnownSolution = undoSolution;
        undoIndex += 1;
    }
}

function OnLoad() {
    global.solutionCanvas = document.getElementById('solution_canvas');
    global.problemCanvas = document.getElementById('problem_canvas');
    global.sctx = solutionCanvas.getContext('2d');
    global.pctx = problemCanvas.getContext("2d");

    global.problemSelect = document.getElementById('defaultProblemSelect');
    var problemList = [];
    for (var problemName in known_solutions) {
        var option = document.createElement("option");
        option.text = problemName;
        global.problemSelect.add(option);
    }
    selectDefaultProblem();

    drawLine(sctx, 0,0, canvasWidth, canvasWidth);
    drawLine(sctx, canvasWidth,0, 0, canvasWidth);
    drawLine(pctx, 0,0, canvasWidth, canvasWidth);
    drawLine(pctx, canvasWidth,0, 0, canvasWidth);
}

OnLoad();
