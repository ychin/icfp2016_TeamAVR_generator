var global = window;

var canvasWidth=400;
var canvasPadding=50;

var undoStack = [];
var undoIndex = 0;

function drawLine(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.stroke();
}

function drawLines(ctx, pts, color, lineWidth) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();

    if (color !== undefined) {
        ctx.strokeStyle = color;
    }
    else {
        ctx.strokeStyle = 'black';
    }

    if (lineWidth !== undefined) {
        ctx.lineWidth = lineWidth;
    }
    else {
        ctx.lineWidth = 1;
    }


    ctx.stroke();
}

function drawGrid(ctx) {
    for (var x = 0; x <= 4; x++) {
        var points = [];
        for (var y = 0; y <= 4; y++) {
            var pt = {x:x/4,y:y/4};
            points.push(pt);
        }
        var pointsUnNorm  = points.map(function(pt) {
            return normalizePointToCanvas(pt, 2);
        });
        drawLines(ctx, pointsUnNorm, 'gray', 0.25);
    }
    for (var y = 0; y <= 4; y++) {
        var points = [];
        for (var x = 0; x <= 4; x++) {
            var pt = {x:x/4,y:y/4};
            points.push(pt);
        }
        var pointsUnNorm  = points.map(function(pt) {
            return normalizePointToCanvas(pt, 2);
        });
        drawLines(ctx, pointsUnNorm, 'gray', 0.25);
    }
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
    boundaryWidth += canvasPadding;
    var realWidth = canvasWidth - boundaryWidth * 2;
    return {
        x : pt.x.valueOf() * realWidth + boundaryWidth,
        y : (1-pt.y.valueOf()) * realWidth + boundaryWidth
    };
}

function drawSolution(solution) {
    sctx.clearRect(0,0,canvasWidth,canvasWidth);
    pctx.clearRect(0,0,canvasWidth,canvasWidth);

    if (global.displayShowGrid) {
        drawGrid(sctx);
        drawGrid(pctx);
    }

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

    if (global.interactiveRolloverPosIdx !== undefined) {
        var ptSrc = solution.positions[global.interactiveRolloverPosIdx];
        var ptDest = solution.dest[global.interactiveRolloverPosIdx];
        var unnormaPtSrc = normalizePointToCanvas(ptSrc, 2);
        var unnormaPtDest = normalizePointToCanvas(ptDest, 2);
        sctx.fillRect(unnormaPtSrc.x - 5, unnormaPtSrc.y - 5, 10, 10);
        pctx.fillRect(unnormaPtDest.x - 5, unnormaPtDest.y - 5, 10, 10);
    }
    if (global.interactiveRolloverDstPosIdx !== undefined) {
        var ptDest = solution.dest[global.interactiveRolloverDstPosIdx];
        for (var i = 0; i < solution.positions.length; i++) {
            if (equalsPt(solution.dest[i], ptDest)) {
                var ptSrc = solution.positions[i];
                var unnormaPtSrc = normalizePointToCanvas(ptSrc, 2);
                var unnormaPtDest = normalizePointToCanvas(ptDest, 2);
                sctx.fillRect(unnormaPtSrc.x - 5, unnormaPtSrc.y - 5, 10, 10);
                pctx.fillRect(unnormaPtDest.x - 5, unnormaPtDest.y - 5, 10, 10);
            }
        }
    }
    if (global.interactiveRolloverFacetIdx !== undefined) {
        var highlightFacetIdx = global.interactiveRolloverFacetIdx;
        var highlightSubPtIdx = global.interactiveRolloverFacetSubpointIdx;
        var facet = solution.facets[highlightFacetIdx];
        var points = facet.map(function(ptIdx) { return solution.positions[ptIdx]; });
        var pointsUnNorm  = points.map(function(pt) {
            return normalizePointToCanvas(pt, 2);
        });
        drawLines(sctx, pointsUnNorm, "red", 7);

        var destPoints = facet.map(function(ptIdx) { return solution.dest[ptIdx]; });
        var destPtUnNorm = destPoints.map(function(pt) {
            // May need to make smaller for out of bounds
            return normalizePointToCanvas(pt, 2);
        });
        drawLines(pctx, destPtUnNorm, "red", 6);

        if (global.interactiveRolloverFacetSubpointIdx !== undefined) {
            var ptSrc = solution.positions[global.interactiveRolloverFacetSubpointIdx];
            var ptDest = solution.dest[global.interactiveRolloverFacetSubpointIdx];
            var unnormaPtSrc = normalizePointToCanvas(ptSrc, 2);
            var unnormaPtDest = normalizePointToCanvas(ptDest, 2);
            sctx.fillRect(unnormaPtSrc.x - 5, unnormaPtSrc.y - 5, 10, 10);
            pctx.fillRect(unnormaPtDest.x - 5, unnormaPtDest.y - 5, 10, 10);
        }
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

    document.getElementById('problemOutput').innerHTML = 'Solution size: ' + sizeOfSolution;
}

function updateSolution(solution) {
    displaySolution(solution);
    drawSolution(solution);
    generateInteractiveRollover(solution);
}

function interactiveRolloverPos(idx, isDest) {
    global.interactiveRolloverFacetIdx = undefined;
    if (isDest) {
        global.interactiveRolloverPosIdx = undefined;
        global.interactiveRolloverDstPosIdx = idx;
    } else {
        global.interactiveRolloverPosIdx = idx;
        global.interactiveRolloverDstPosIdx = undefined;
    }
    drawSolution(lastKnownSolution);
}
function interactiveRolloverFacet(idx, subpointIdx) {
    global.interactiveRolloverPosIdx = undefined;
    global.interactiveRolloverFacetIdx = idx;
    global.interactiveRolloverFacetSubpointIdx = subpointIdx;
    drawSolution(lastKnownSolution);
}

function generateInteractiveRollover(solution) {
    var rolloverElem = document.getElementById('interactiveRollover');

    var output = "<div>Positions</div>";
    for (var i = 0; i < solution.positions.length; i++) {
        var pos = solution.positions[i];
        output += '<div><b>' + i + ':</b> <a href=javascript: onmouseover="interactiveRolloverPos(' + i + ');" >(' + outputPt(pos) + ')</a>';
        var destPos = solution.dest[i];
        output += ' &rArr; <a href=javascript: onmouseover="interactiveRolloverPos(' + i + ',true);" >(' + outputPt(destPos) + ')</a>';
        output += '</div>';
    }

    output += "<hr/><div>Facets</div>";
    for (var i = 0; i < solution.facets.length; i++) {
        output += '<div><a href=javascript: onmouseover="interactiveRolloverFacet(' + i + ');" ><b>' + i + ':</b></a>';
        var facet = solution.facets[i];
        for (var j = 0; j < facet.length; j++) {
            output += ' <a href=javascript: onmouseover="interactiveRolloverFacet(' + i + ', ' + facet[j] + ');" >' + facet[j] + '</a>';
        }
        output += '</div>';
    }

    rolloverElem.innerHTML = output;
}

function generate() {
    var solutionTxt = document.getElementById('solutionTxt');
    var solution = parseSolution(solutionTxt.value);

    global.interactiveRolloverPosIdx = undefined;
    global.interactiveRolloverDstPosIdx = undefined;
    global.interactiveRolloverFacetIdx = undefined;

    drawSolution(solution);
    displaySizeOfSolution(solutionTxt.value);
    generateInteractiveRollover(solution);

    global.lastKnownSolution = solution; // for debugging

    undoStack = [];
    undoIndex = -1;
    addUndo();
}

function runOps() {
    var opsTxt = document.getElementById('operationsTxt');
    var ops = JSON.parse(opsTxt.value);

    if (ops.length == 0)
        return;

    for (var i = 0; i < ops.length; i++) {
        var op = ops[i];
        if (op.type == 'fold') {
            applyPostFlip(lastKnownSolution, parsePt(op.line[0]), parsePt(op.line[1]), op.right);
        }
    }

    updateSolution(lastKnownSolution);
    addUndo();
}

function testFunc() {
    // This is for whatever debug testing for local testing
    var ratio = Math.random();
    splitFacets(lastKnownSolution, genPt(ratio,0), genPt(ratio,1));
    updateSolution(lastKnownSolution);
}

function applyShowGridFunc() {
    var toShow = document.getElementById('showGridCheckbox').checked;
    global.displayShowGrid = toShow;
    if (global.lastKnownSolution)
        drawSolution(lastKnownSolution);
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

function selectDefaultOps() {
    var text = global.opsSelect.options[global.opsSelect.selectedIndex].text;
    var ops = known_operations[text];
    var opsTxt = document.getElementById('operationsTxt');
    opsTxt.value = JSON.stringify(ops, null, '  ');
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
    global.opsSelect = document.getElementById('defaultOpsSelect');
    var problemList = [];
    for (var problemName in known_solutions) {
        var option = document.createElement("option");
        option.text = problemName;
        global.problemSelect.add(option);
    }
    selectDefaultProblem();
    var opsList = [];
    for (var opName in known_operations) {
        var option = document.createElement("option");
        option.text = opName;
        global.opsSelect.add(option);
    }

    drawLine(sctx, 0,0, canvasWidth, canvasWidth);
    drawLine(sctx, canvasWidth,0, 0, canvasWidth);
    drawLine(pctx, 0,0, canvasWidth, canvasWidth);
    drawLine(pctx, canvasWidth,0, 0, canvasWidth);

    selectDefaultProblem();
    generate();
}

OnLoad();
