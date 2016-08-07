
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
    return pointOnLineT(line11, 12, pt) != null;
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
// Operations
//
function splitFacets(solution, pt1, pt2) {
    // Assumption: (pt1, pt2) are from boundary. I.e. we can't split in the middle
    // TODO: is this always true? We don't have to respond physical paper properties
    for (var i = 0; i < solution.facets.length; i++) {
        var facet = solution.facets[i];

        var splitPts = [];

        for (var j = 0; j < facet.length; j++) {
            var nextJ = (j+1) % facet.length;
            var facetPt1 = solution.positions[facet[j]];
            var facetPt2 = solution.positions[facet[nextJ]];

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
                    var prevSign = signOfPointOnLine( solution.positions[facet[lastIndex]], pt1, pt2 );
                    if (prevSign ==sign2) {
                        // Both one the same side
                        continue;
                    }
                    else if (prevSign == sign1) {
                        // In this case, previous one is right one line and parallel. See above check basically no need to split
                        continue;
                    }
                    else {
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
                var newPos = lerpPt(facetPt1, facetPt2, t1t2.t1);
                solution.positions.push(newPos);
                var newDestPos = lerpPt(solution.dest[facet[j]], solution.dest[facet[nextJ]], t1t2.t1);
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

        if (splitPts.length != 0 && splitPts.length != 2) {
            throw new Error("Weird number of split pts: " + splitPts.length);
        }

        if (splitPts.length ==2 ) {
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
