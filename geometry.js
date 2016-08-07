
////////////////////////////////////////////////////////////////////////////////
// Vectorize
//
function lerpF(num1, num2, t) {
    // num * (1-t) + num2 * t
    return num1.mul( t.neg().add(1) ).add( num2.mul(t) );
}

function lerpPt(pt1, pt2, t) {
    return { x: lerpF(pt1.x, pt2.x, t), y: lerpF(pt1.y, pt2.y, t) };
}

function subPt(pt1, pt2) {
    return { x: pt1.x.sub(pt2.x), y: pt1.y.sub(pt2.y) };
}
function mulPt(pt1, pt2) {
    return { x: pt1.x.mul(pt2.x), y: pt1.y.mul(pt2.y) };
}
function divPt(pt1, pt2) {
    return { x: pt1.x.div(pt2.x), y: pt1.y.div(pt2.y) };
}
function addPt(pt1, pt2) {
    return { x: pt1.x.add(pt2.x), y: pt1.y.add(pt2.y) };
}
function equalsPt(pt1, pt2) {
    return pt1.x.equals(pt2.x) && pt1.y.equals(pt2.y);
}

function genPt(x, y) {
    return {
        x: new Fraction(x),
        y: new Fraction(y)
    };
}

function genRawPt(pt) { // Fractional -> floating pt for debug only
    return {
        x: pt.x.valueOf(),
        y: pt.y.valueOf(),
    };
}

////////////////////////////////////////////////////////////////////////////////
// Vector math
//
function lineIntersecton(line11, line12, line21, line22, output, clampTRanges) {
    // http://stackoverflow.com/a/565282
    var v1 = subPt(line12 , line11);
    var v2 = subPt(line22 , line21);

    var denomCross = crossProduct(v1, v2);

    if (denomCross.n == 0) {
        return false;
    }
    
    var t1 = crossProduct( (subPt(line21,line11)), v2 ) .div ( denomCross );
    var t2 = crossProduct( (subPt(line21,line11)), v1 ) .div ( denomCross );

    if (output !== undefined) {
        output.t1 = t1;
        output.t2 = t2;
    }

    if (clampTRanges) {
        if (t1.compare(0) > 0 || t1.compare(1) < 0 || t2.compare(0) > 0 || t2.compare(1) < 0) {
            return false;
        }
    }

    return true;
}

function findPoint(positions, pt) {
    for (var i = 0; i < positions.length; i++) {
        if (positions[i].x.equals(pt.x) && positions[i].y.equals(pt.y)) {
            return i;
        }
    }
    return -1;
}

function pointOnLineT(line11, line12, pt) {
    var dx = pt.x.sub(line11.x);
    var dy = pt.y.sub(line11.y);

    var lineDx = line12.x.sub(line11.x);
    var lineDy = line12.y.sub(line11.y);

    var dxRatio, dyRatio;
    if (lineDx.n != 0) {
        dxRatio = dx.div(lineDx);
    }
    if (lineDy.n != 0) {
        dyRatio = dy.div(lineDy);
    }

    if (dxRatio == undefined) {
        // lineDx == 0, line11.x == line12.x 
        if (dx.n != 0)
            return null;

        if (dyRatio == undefined ) { // shouldn't happen
            throw new Error("bad degenerate line: x and y ratios are both zero");
            return null;
        }
            
        return dyRatio;
    }
    else if (dyRatio == undefined) {
        // lineDy == 0, line11.y == line12.y 
        if (dy.n != 0)
            return null;

        return dxRatio;
    }

    if (dxRatio.equals(dyRatio))
        return dxRatio;
    return null;
}

function isPointOnLine(line11, line12, pt) {
    return pointOnLineT(line11, line12, pt) != null;
}

function crossProduct(v1, v2) {
    var det = v1.x.mul(v2.y) .sub( v1.y.mul(v2.x) );
    return det;
}

function signOfPointOnLine(pt, line11, line12) {
    var dpt = subPt(pt, line11);
    var dline = subPt(line12, line11);
    var crossResult = crossProduct(dpt, dline);
    if (crossResult.n == 0) // + = right, 0 = on line, - = left
        return 0;
    return crossResult.s;
}

//function findIntersection(solution, pt) {
    //for (var i = 0; i < solution.facets.length; i++) {
        //var facet = solution.facets;
        //for (var j = 0; j < facet.length; j++) {
            //facet.
        //}
    //}
    //for (var i = 0; i < positions.length; i++) {
        //if (positions[i].x.equals(pt.x) && positions[i].y.equals(pt.y)) {
            //return i;
        //}
    //}
    //return -1;
//}

//function addPoint(solution, pt) {
    //var positions = solution.positions;
    
    //var foundId = findPoint(positions, pt);
    //if (foundId != -1)
        //return;

    //var foundIds = findIntersection(positions, pt);
//}


////////////////////////////////////////////////////////////////////////////////
// Flipping
//
function calculateFlip(pt, line11, line12) {
    if (isPointOnLine(line11, line12, pt)) {
        return pt;
    }

    // Handle the trivial cases first
    if (line11.x.equals(line12.x)) { // x==0
        var delta = line11.x.sub(pt.x).mul(2);
        return { x: pt.x.add(delta), y: pt.y }
    }
    if (line11.y.equals(line12.y)) { // y==0
        var delta = line11.y.sub(pt.y).mul(2);
        return { x: pt.x, y: pt.y.add(delta) };
    }

    // Not horiz/vertical lines. Use right angle flips
    var xdeltaT = {};
    lineIntersecton(pt, {x:pt.x.sub(1), y:pt.y}, line11,line12, xdeltaT);
    var ydeltaT = {};
    lineIntersecton(pt, {x:pt.x, y:pt.y.add(1)}, line11,line12, ydeltaT);

    var distX = xdeltaT.t1;
    var distY = ydeltaT.t1;
    
    var delta = calculateRightAngleTriFlip({x: distX, y: distY});
    return addPt(pt, delta);
}

function calculateRightAngleTriFlip(vec) { 
    if (vec.x.compare(0) < 0 && vec.y.compare(0) < 0) { // x < 0, y < 0
        var flippedFlip = calculateRightAngleTriFlip({x:vec.x.neg(), y:vec.y.neg()});
        return {
            x: flippedFlip.x.neg(),
            y: flippedFlip.y.neg()
        };
    }
    if (vec.x.compare(0) < 0) { // x < 0
        var flippedFlip = calculateRightAngleTriFlip({x:vec.x.neg(), y:vec.y});
        return {
            x: flippedFlip.x.neg(),
            y: flippedFlip.y
        };
    }
    if (vec.y.compare(0) < 0) { // y < 0
        var flippedFlip = calculateRightAngleTriFlip({x:vec.x, y:vec.y.neg()});
        return {
            x: flippedFlip.x,
            y: flippedFlip.y.neg()
        };
    }
    if (vec.x.compare(vec.y) < 0) { // x < y
        var flippedFlip = calculateRightAngleTriFlip({x:vec.y, y:vec.x});
        return {
            x: flippedFlip.y.neg(),
            y: flippedFlip.x.neg()
        };
    }


    // assumption, x >= y, x > 0, y > 0. Basically given right triangle at (0,0), (x,0), (0,y), flip (x,y) around the diagonal, give the new point relative to (x,y)
    var x2 = vec.x.mul(vec.x);
    var y2 = vec.y.mul(vec.y);
    var w2 = (x2.mul(y2)) .div ( x2.add(y2) );
    var newX = (x2.sub(w2.mul(2))) .div (vec.x);
    var newY = vec.y.mul(2) .sub( y2.mul(vec.y).mul(2).div(x2.add(y2)) );
    return { x: newX.sub(vec.x), y: newY };
}

////////////////////////////////////////////////////////////////////////////////
// Operations
//
function splitFacets(solution, pt1, pt2, useDest, onlyInsideLineSegment) {
    // Assumption: (pt1, pt2) are from boundary. I.e. we can't split in the middle
    // TODO: is this always true? We don't have to respond physical paper properties
    for (var i = 0; i < solution.facets.length; i++) {
        var facet = solution.facets[i];

        var splitPts = [];
        var splitAborted = false;

        for (var j = 0; j < facet.length; j++) {
            var nextJ = (j+1) % facet.length;
            var facetSrcPt1 = solution.positions[facet[j]];
            var facetSrcPt2 = solution.positions[facet[nextJ]];
            var facetDestPt1 = solution.dest[facet[j]];
            var facetDestPt2 = solution.dest[facet[nextJ]];

            var facetPt1 = useDest ? facetDestPt1 : facetSrcPt1;
            var facetPt2 = useDest ? facetDestPt2 : facetSrcPt2;

            var sign1 = signOfPointOnLine(facetPt1, pt1, pt2);
            var sign2 = signOfPointOnLine(facetPt2, pt1, pt2);

            if (sign1 == sign2 && sign1 != 0) {
                // On one side, no touching. Don't split
                continue;
            }

            if (sign1 == sign2 && sign1 == 0) {
                // Right on the line, and parallel. Since we assume intersection line is longer than this, no need to split
                continue;
            }

            if (sign1 == 0 || sign2 == 0) {
                // one of the points lie on the split line. Need to read ahead. If both on same sign, then no need to do anything as we basically wrapped around. Otherwise need to do something
                if (sign1 == 0) {
                    var lastIndex = (j-1+facet.length) % facet.length;
                    var prevSign = signOfPointOnLine(
                        useDest ? solution.dest[facet[lastIndex]] : solution.positions[facet[lastIndex]],
                        pt1, pt2 );
                    if (prevSign ==sign2) {
                        // Both one the same side
                        continue;
                    }
                    else if (prevSign == sign1) {
                        // In this case, previous one is right one line and parallel. See above check basically no need to split
                        continue;
                    }
                    else {
                        var pointT = pointOnLineT(pt1, pt2, facetPt1);
                        if (onlyInsideLineSegment && (pointT.compare(1) > 0 || pointT.compare(0) < 0)) {
                            splitAborted = true;
                            break;
                        }

                        splitPts.push(j);
                    }
                }
                else {
                    // We don't handle this case, since we wrap around, so basically each point will be handled twice on either side. Just need to handle it once to avoid duplicating it in splitPts.
                }
            }
            else {
                // line crosses over the two facet points
                var t1t2 = {};
                lineIntersecton(facetPt1, facetPt2, pt1, pt2, t1t2);

                if (onlyInsideLineSegment && (t1t2.t1.compare(1) > 0 || t1t2.t1.compare(0) < 0)) {
                    splitAborted = true;
                    break;
                }

                var newPos = lerpPt(facetSrcPt1, facetSrcPt2, t1t2.t1);
                solution.positions.push(newPos);
                var newDestPos = lerpPt(facetDestPt1, facetDestPt2, t1t2.t1);
                solution.dest.push(newDestPos);

                facet.splice(j + 1, 0, solution.positions.length - 1);
                splitPts.push(j + 1);
                j += 1;
            }
            //var facetPt1T = pointOnLineT(pt1, pt2, facetPt1);
            //var facetPt2T = pointOnLineT(pt1, pt2, facetPt2);
            //if (facetPt1T != null && facetPt2T != null) {
                //// both facet pts are on line, which implies we don't need to split
            //}
            //else if (facetPt1T != null || facetPt2T != null) {
                //// one pt on line
            //}
        }

        if (splitAborted) {
            continue;
        }

        if (splitPts.length != 0 && splitPts.length != 2) {
            throw new Error("Weird number of split pts: " + splitPts.length);
        }

        if (splitPts.length == 2) {
            var split1a = facet.slice(0, splitPts[0] + 1);
            var split2 = facet.slice(splitPts[0], splitPts[1] + 1);
            var split1b = facet.slice(splitPts[1], facet.length);

            var newFacet1 = split1a.concat(split1b);
            var newFacet2 = split2;

            solution.facets[i] = newFacet1;
            solution.facets.splice(i, 1, newFacet1, newFacet2);

            i += 1;
        }
    }
}

function applyPostFlip(solution, pt1, pt2, flip) {
    splitFacets(solution, pt1, pt2, true);
    
    for (var i = 0; i < solution.positions.length; i++) {
        var pos = solution.positions[i];
        var destPos = solution.dest[i];
        
        var sign = signOfPointOnLine(destPos, pt1, pt2);
        if ((!flip && sign > 0) || (flip && sign < 0)) {
            var newDestPt = calculateFlip(destPos, pt1, pt2);
            solution.dest[i] = newDestPt;
        }
    }
}

function buildPosToFacet(solution) {
    var posToFacet = {};
    for (var i = 0; i < solution.positions.length; i++) {
        posToFacet[i] = [];
    }
    for (var i = 0; i < solution.facets.length; i++) {
        var facet = solution.facets[i];
        for (var j = 0; j < facet.length; j++) {
            posToFacet[facet[j]].push({
                facet: i,
                pt: j
            });
        }
    }
    return posToFacet;
}

function applyPostPullOpen(solution, pt1, pt2, flip) {
    // WIP still
    splitFacets(solution, pt1, pt2, true);

    var posToFacet = buildPosToFacet(solution);

    var pointsToFlip = {};
    var pointsProcessed = {};
    
    for (var i = 0; i < solution.positions.length; i++) {
        if (pointsProcessed[i]) {
            continue;
        }
        var pos = solution.positions[i];
        var destPos = solution.dest[i];
        
        var sign = signOfPointOnLine(destPos, pt1, pt2);
        sign = flip ? -sign : sign;
        var toFlipPos = sign > 0;
        
        if (toFlipPos) {
            connectedFacets = posToFacet[i];
            if (connectedFacets.length == 2) { // this only works if it's a single fold as far as I understand
                var bothSimple = true;
                for (var j = 0; j < connectedFacets.length; j++) {
                    var facet = connectedFacets[j];
                    
                    // TODO: only use simple for now for testing
                    var isSimple = true;
                    for (var k = 0; k < facet.length; k++) {
                        if (facet[k] == i)
                            continue;

                        var curSign = signOfPointOnLine(solution.dest[fact[k]], pt1, pt2);
                        if (curSign == 0) { // on the line
                            continue;
                        }

                        var curConnectedFacets = posToFacet[facet[k]];
                        if (curConnectedFacets.length > 1) {
                            isSimple = false;
                            bothSimple = false;
                        }
                    }
                }

                if (bothSimple) {
                    var facet1Info = connectedFacets[0];
                    var facet2Info = connectedFacets[1];
                    var facet1 = solution.facets[facet1Info.facet];
                    var facet2 = solution.facets[facet2Info.facet];
                    for (var k = 0; k < facet2.length; k++) {
                        var curSign = signOfPointOnLine(solution.dest[facet2[k]], pt1, pt2);
                        if (curSign == 0) { // on the line
                            continue;
                        }

                        //pointsToFlip[facet2[k]] = true;
                        pointsProcessed[facet2[k]] = true;
                        pointsToFlip[facet2[k]] = false;
                    }
                    for (var k = 0; k < facet1.length; k++) {
                        var curSign = signOfPointOnLine(solution.dest[facet2[k]], pt1, pt2);
                        if (curSign == 0) { // on the line
                            continue;
                        }
                        pointsProcessed[facet1[k]] = true;
                        pointsToFlip[facet1[k]] = false;
                    }
                }
                else {
                    pointsToFlip[i] = true
                }
            }
            else {
                pointsToFlip[i] = true;
            }
        }


            //var newDestPt = calculateFlip(destPos, pt1, pt2);
            //solution.dest[i] = newDestPt;
    }

    for (var i = 0; i < solution.positions.length; i++) {
        
    }

    for (var i in pointsToFlip) {
        if (!pointsToFlip[i])
            continue;
        var destPos = solution.dest[i];
        var newDestPt = calculateFlip(destPos, pt1, pt2);
        solution.dest[i] = newDestPt;
    }
}
