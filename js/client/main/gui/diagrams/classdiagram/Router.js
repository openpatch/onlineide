onmessage = function (e) {
    let ri = e.data;
    if (ri.xMax == null)
        return; // BugFix 06.06.2020: Monaco Editor sends messages to everyone...
    let router = new Router(ri);
    router.arrows = ri.arrows;
    let result = router.routeAllArrows();
    //@ts-ignore
    postMessage(result);
    self.close();
};
class Router {
    constructor(routingInput) {
        this.routingInput = routingInput;
        this.rectangles = [];
        this.initRoutingRectangles(routingInput.rectangles);
        this.arrows = routingInput.arrows;
        this.arrowPointField = new Array(this.routingInput.xMax).fill(0).map(() => new Array(this.routingInput.yMax).fill(null));
    }
    initRoutingRectangles(rectangles) {
        if (rectangles == null)
            return;
        for (let r of rectangles) {
            this.rectangles.push({
                left: r.left,
                width: r.width,
                top: r.top,
                height: r.height,
                slots: [
                    {
                        arrowDirectionOutward: { x: 0, y: -1 },
                        deltaFromSlotToSlot: { x: 1, y: 0 },
                        min: 1 - Math.round(r.width / 2),
                        max: r.width - Math.round(r.width / 2) - 1,
                        mid: { x: r.left + Math.round(r.width / 2), y: r.top },
                        lastDelta: -1
                    },
                    {
                        arrowDirectionOutward: { x: 1, y: 0 },
                        deltaFromSlotToSlot: { x: 0, y: 1 },
                        min: 1 - Math.round(r.height / 2),
                        max: r.height - Math.round(r.height / 2) - 1,
                        mid: { x: r.left + r.width, y: r.top + Math.round(r.height / 2) },
                        lastDelta: -1
                    },
                    {
                        arrowDirectionOutward: { x: 0, y: 1 },
                        deltaFromSlotToSlot: { x: 1, y: 0 },
                        min: 1 - Math.round(r.width / 2),
                        max: r.width - Math.round(r.width / 2) - 1,
                        mid: { x: r.left + Math.round(r.width / 2), y: r.top + r.height },
                        lastDelta: -1
                    },
                    {
                        arrowDirectionOutward: { x: -1, y: 0 },
                        deltaFromSlotToSlot: { x: 0, y: 1 },
                        min: 1 - Math.round(r.height / 2),
                        max: r.height - Math.round(r.height / 2) - 1,
                        mid: { x: r.left, y: r.top + Math.round(r.height / 2) },
                        lastDelta: -1
                    }
                ]
            });
        }
    }
    initWeights() {
        this.weights = new Array(this.routingInput.xMax).fill(0).map(() => new Array(this.routingInput.yMax).fill(-1));
        this.locks = new Array(this.routingInput.xMax).fill(0).map(() => new Array(this.routingInput.yMax).fill(0));
    }
    prepareRectangles() {
        let distanceFromRectangles = this.routingInput.distanceFromRectangles;
        if (distanceFromRectangles == null)
            distanceFromRectangles = 1;
        for (let r of this.rectangles) {
            let left = r.left - distanceFromRectangles;
            if (left < 0)
                left = 0;
            let right = r.left + r.width + distanceFromRectangles;
            if (right > this.routingInput.xMax - 1)
                right = this.routingInput.xMax - 1;
            let top = r.top - distanceFromRectangles;
            if (top < 0)
                top = 0;
            let bottom = r.top + r.height + distanceFromRectangles;
            if (bottom > this.routingInput.yMax - 1)
                bottom = this.routingInput.yMax - 1;
            for (let y = top; y <= bottom; y++) {
                for (let x = left; x <= right; x++) {
                    this.locks[x][y] = Router.RectangleWeight;
                }
            }
        }
    }
    smoothArrows() {
        this.weights = new Array(this.routingInput.xMax).fill(0).map(() => new Array(this.routingInput.yMax).fill(0));
        for (let a of this.arrows) {
            if (a.points == null)
                continue;
            for (let p of a.points) {
                this.weights[p.x][p.y]++;
            }
        }
        this.locks = new Array(this.routingInput.xMax).fill(0).map(() => new Array(this.routingInput.yMax).fill(0));
        this.prepareRectangles();
        let done = false;
        while (!done) {
            done = true;
            let p = [null, null, null, null];
            let delta = [null, null, null];
            for (let a of this.arrows) {
                if (a.points == null || a.minimalPoints == null)
                    continue;
                let arrowDirty = false;
                let debug = a.identifier == "a3";
                if (debug)
                    debugger;
                if (a.minimalPoints.length > 4) {
                    for (let i = 0; i < a.minimalPoints.length - 4; i++) {
                        for (let j = 0; j <= 3; j++) {
                            p[j] = a.minimalPoints[i + j];
                        }
                        for (let j = 0; j <= 2; j++) {
                            delta[j] = { x: p[j + 1].x - p[j].x, y: p[j + 1].y - p[j].y };
                        }
                        if (this.sameDirection(delta[0], delta[2]) &&
                            !this.sameDirection(delta[0], delta[1])) {
                            let d01 = Math.abs(delta[0].x) + Math.abs(delta[0].y);
                            let d12 = Math.abs(delta[1].x) + Math.abs(delta[1].y);
                            let d23 = Math.abs(delta[2].x) + Math.abs(delta[2].y);
                            // if(d12 > 20 || d23 > 20) continue;
                            let x = p[0].x;
                            let y = p[0].y;
                            // if(x == 8 && y == 2) debugger;
                            let free = true;
                            for (let i = 1; i <= Math.round(d12); i++) {
                                x += Math.sign(delta[1].x);
                                y += Math.sign(delta[1].y);
                                if (this.weights[x][y] != 0 || this.locks[x][y] != 0) {
                                    free = false;
                                    break;
                                }
                            }
                            for (let i = 1; i < Math.round(d01); i++) {
                                x += Math.sign(delta[0].x);
                                y += Math.sign(delta[0].y);
                                if (this.weights[x][y] != 0 || this.locks[x][y] != 0) {
                                    free = false;
                                    break;
                                }
                            }
                            if (free) {
                                x = p[0].x;
                                y = p[0].y;
                                for (let i = 1; i <= Math.round(d12); i++) {
                                    x += Math.sign(delta[1].x);
                                    y += Math.sign(delta[1].y);
                                    this.weights[x][y] = 1;
                                }
                                for (let i = 1; i < Math.round(d01); i++) {
                                    x += Math.sign(delta[0].x);
                                    y += Math.sign(delta[0].y);
                                    this.weights[x][y] = 1;
                                }
                                x = p[0].x;
                                y = p[0].y;
                                for (let i = 1; i <= Math.round(d01); i++) {
                                    x += Math.sign(delta[0].x);
                                    y += Math.sign(delta[0].y);
                                    this.weights[x][y] = 0;
                                }
                                for (let i = 1; i < Math.round(d12); i++) {
                                    x += Math.sign(delta[1].x);
                                    y += Math.sign(delta[1].y);
                                    this.weights[x][y] = 0;
                                }
                                let s = a.identifier + ": ";
                                for (let p of a.minimalPoints)
                                    s += "(" + p.x + ", " + p.y + "),";
                                p[1].x = p[0].x + delta[1].x;
                                p[1].y = p[0].y + delta[1].y;
                                let delete2And3 = p[1].x == p[3].x && p[1].y == p[3].y;
                                a.minimalPoints.splice(i + 2, delete2And3 ? 2 : 1);
                                arrowDirty = true;
                                i--;
                                done = false;
                            }
                        }
                    }
                }
                if (arrowDirty) {
                    for (let i = 0; i < a.minimalPoints.length - 2; i++) {
                        if (a.minimalPoints[i + 0].x == a.minimalPoints[i + 1].x &&
                            a.minimalPoints[i + 1].x == a.minimalPoints[i + 2].x ||
                            a.minimalPoints[i + 0].y == a.minimalPoints[i + 1].y &&
                                a.minimalPoints[i + 1].y == a.minimalPoints[i + 2].y) {
                            a.minimalPoints.splice(i + 1, 1);
                            i--;
                        }
                    }
                    let s = "->";
                    for (let p of a.minimalPoints)
                        s += "(" + p.x + ", " + p.y + "),";
                }
            }
        }
    }
    sameDirection(p1, p2) {
        return Math.sign(p1.x) == Math.sign(p2.x) && Math.sign(p1.y) == Math.sign(p2.y);
    }
    prepareArrowLocks(newArrow) {
        for (let a of this.arrows) {
            if (a == newArrow)
                return;
            let joinArrow = a.arrowType == newArrow.arrowType && a.destinationIdentifier == newArrow.destinationIdentifier;
            for (let p of a.points) {
                if (joinArrow) {
                    this.locks[p.x][p.y] = 0;
                    this.weights[p.x][p.y] = 0;
                }
                else {
                    let w = 6;
                    this.locks[p.x][p.y] += w;
                }
            }
        }
    }
    calculateWeights(xStart, yStart, dxStart, dyStart) {
        if (this.weights[xStart + dxStart] == null) {
            return;
        }
        this.weights[xStart + dxStart][yStart + dyStart] = 1;
        this.weights[xStart][yStart] = 0;
        let d = this.routingInput.straightArrowSectionAfterRectangle;
        if (d == null)
            d = 3;
        let normalX = 1 - Math.abs(dxStart);
        let normalY = 1 - Math.abs(dyStart);
        let i = 0;
        while (i < d + 3) {
            let x = xStart + dxStart * i;
            let y = yStart + dyStart * i;
            if (x > 0 && x < this.routingInput.xMax &&
                y > 0 && y < this.routingInput.yMax &&
                this.locks[x][y] > 0) {
                this.locks[x][y] = 0;
            }
            i++;
        }
        i = 0;
        while (i <= d) {
            let x = xStart + dxStart * i;
            let y = yStart + dyStart * i;
            if (x > 0 && x < this.routingInput.xMax &&
                y > 0 && y < this.routingInput.yMax) {
                this.locks[x + normalX][y + normalY] = 1000;
                this.locks[x - normalX][y - normalY] = 1000;
            }
            i++;
        }
        let stack = [];
        for (let y = 0; y < this.routingInput.yMax; y++) {
            for (let x = 0; x < this.routingInput.xMax; x++) {
                if (this.weights[x][y] >= 0) {
                    stack.push({ x: x, y: y });
                }
            }
        }
        // stack.push({ x: xStart + dxStart, y: yStart + dyStart });
        while (stack.length > 0) {
            let stack1 = stack;
            stack = [];
            for (let p of stack1) {
                let x = p.x;
                let y = p.y;
                let w = this.weights[x][y];
                if (x > 0) {
                    let w1 = this.weights[x - 1][y];
                    let l1 = this.locks[x - 1][y];
                    if ((w1 < 0 || w1 > w + 1) && l1 < 1000) { // w1 < 0
                        this.weights[x - 1][y] = w + 1;
                        stack.push({ x: x - 1, y: y });
                    }
                }
                if (x < this.routingInput.xMax - 1) {
                    let w1 = this.weights[x + 1][y];
                    let l1 = this.locks[x + 1][y];
                    if ((w1 < 0 || w1 > w + 1) && l1 < 1000) { // w1 < 0
                        this.weights[x + 1][y] = w + 1;
                        stack.push({ x: x + 1, y: y });
                    }
                }
                if (y > 0) {
                    let w1 = this.weights[x][y - 1];
                    let l1 = this.locks[x][y - 1];
                    if ((w1 < 0 || w1 > w + 1) && l1 < 1000) { // w1 < 0
                        this.weights[x][y - 1] = w + 1;
                        stack.push({ x: x, y: y - 1 });
                    }
                }
                if (y < this.routingInput.yMax - 1) {
                    let w1 = this.weights[x][y + 1];
                    let l1 = this.locks[x][y + 1];
                    if ((w1 < 0 || w1 > w + 1) && l1 < 1000) { // w1 < 0
                        this.weights[x][y + 1] = w + 1;
                        stack.push({ x: x, y: y + 1 });
                    }
                }
            }
        }
    }
    addPoint(x, y, arrow) {
        if (x < this.arrowPointField.length && y < this.arrowPointField[x].length) {
            arrow.points.push({ x: x, y: y });
            let arrows = this.arrowPointField[x][y];
            if (arrows != null) {
                for (let a of arrows) {
                    if (a.arrowType == arrow.arrowType && a.destinationIdentifier == arrow.destinationIdentifier) {
                        return a;
                    }
                }
            }
        }
    }
    addArrowToArrowPointsField(arrow) {
        if (arrow.points == null)
            return;
        for (let p of arrow.points) {
            let arrows = this.arrowPointField[p.x][p.y];
            if (arrows == null) {
                this.arrowPointField[p.x][p.y] = [arrow];
            }
            else {
                arrows.push(arrow);
            }
        }
    }
    // addPoint(x: number, y: number, arrow: RoutingArrow): RoutingArrow {
    //     arrow.points.push({ x: x, y: y });
    //     let arrows: RoutingArrow[] = this.arrowPointField[x][y];
    //     if (arrows == null) {
    //         arrows = [];
    //         this.arrowPointField[x][y] = arrows;
    //     } else {
    //         for (let a of arrows) {
    //             if (a.arrowType == arrow.arrowType && a.destinationIdentifier == arrow.destinationIdentifier) {
    //                 arrows.push(arrow);
    //                 return a;
    //             }
    //         }
    //     }
    //     arrows.push(arrow);
    // }
    routeAllArrows() {
        if (this.arrows != null) {
            for (let a of this.arrows) {
                this.routeArrowOptimized(a, a.debug == true);
            }
            this.smoothArrows();
        }
        return {
            xMax: this.routingInput.xMax,
            yMax: this.routingInput.yMax,
            arrows: this.arrows,
            rectangles: this.rectangles,
            weights: this.weights,
            locks: this.locks,
            version: this.routingInput.version
        };
    }
    routeArrowOptimized(a, debug = false) {
        let routeVariants = [];
        let sourceRect = this.rectangles[a.sourceRectangleIndex];
        let destRect = this.rectangles[a.destRectangleIndex];
        let slotDistance = this.routingInput.slotDistance;
        for (let sourceDirection = 0; sourceDirection < 4; sourceDirection++) {
            // for (let sourceSlotDelta of [-1, 1]) 
            {
                for (let destDirection = 0; destDirection < 4; destDirection++) {
                    // for (let destSlotDelta of [-1, 1]) 
                    {
                        let sourceSlot = sourceRect.slots[sourceDirection];
                        let destSlot = destRect.slots[destDirection];
                        let sourceDeltaFromMid = 0;
                        let sourceSlotDelta = sourceSlot.lastDelta * -1;
                        sourceSlot.lastDelta *= -1;
                        let destSlotDelta = destSlot.lastDelta * -1;
                        destSlot.lastDelta *= -1;
                        if (sourceSlot.usedFrom != null) {
                            sourceDeltaFromMid = sourceSlotDelta > 0 ?
                                sourceSlot.usedTo + slotDistance : sourceSlot.usedFrom - slotDistance;
                            if (sourceDeltaFromMid < sourceSlot.min || sourceDeltaFromMid > sourceSlot.max) {
                                continue;
                            }
                        }
                        let sourcePos = {
                            x: sourceSlot.mid.x + sourceSlot.deltaFromSlotToSlot.x * sourceDeltaFromMid,
                            y: sourceSlot.mid.y + sourceSlot.deltaFromSlotToSlot.y * sourceDeltaFromMid
                        };
                        let destDeltaFromMid = 0;
                        if (destSlot.usedFrom != null) {
                            destDeltaFromMid = destSlotDelta > 0 ?
                                destSlot.usedTo + slotDistance : destSlot.usedFrom - slotDistance;
                            if (destDeltaFromMid < destSlot.min || destDeltaFromMid > destSlot.max) {
                                continue;
                            }
                        }
                        let destPos = {
                            x: destSlot.mid.x + destSlot.deltaFromSlotToSlot.x * destDeltaFromMid,
                            y: destSlot.mid.y + destSlot.deltaFromSlotToSlot.y * destDeltaFromMid
                        };
                        a.source = sourcePos;
                        a.dest = destPos;
                        a.sourceDirection = sourceSlot.arrowDirectionOutward;
                        a.destDirection = { x: destSlot.arrowDirectionOutward.x, y: destSlot.arrowDirectionOutward.y };
                        a.endsOnArrowWithIdentifier = null;
                        if (Math.abs(sourcePos.x - destPos.x) + Math.abs(sourcePos.y - destPos.y) > 2 * this.routingInput.straightArrowSectionAfterRectangle) {
                            this.routeArrow(a, false);
                            let weight = 0;
                            for (let p of a.points) {
                                let w = this.weights[p.x][p.y];
                                weight += (w < 0 ? 1000 : w);
                                let l = this.locks[p.x][p.y];
                                if (l > 11 && l < 1000) { // Intersection of arrows
                                    weight += 500;
                                }
                            }
                            routeVariants.push({
                                dest: destPos,
                                source: sourcePos,
                                destDeltaFromMid: destDeltaFromMid,
                                sourceDeltaFromMid: sourceDeltaFromMid,
                                destDirection: a.destDirection,
                                sourceDirection: a.sourceDirection,
                                weightSum: weight,
                                endsOnArrowWithIdentifier: a.endsOnArrowWithIdentifier,
                                points: a.points,
                                minimalPoints: a.minimalPoints,
                                sourceSlot: sourceSlot,
                                destSlot: destSlot
                            });
                        }
                    }
                }
            }
        }
        let minWeight = 1000000;
        let bestVariant = null;
        for (let v of routeVariants) {
            if (v.weightSum > 3 && v.weightSum < minWeight) {
                bestVariant = v;
                minWeight = v.weightSum;
            }
        }
        if (bestVariant != null) {
            a.source = bestVariant.source;
            a.dest = bestVariant.dest;
            a.sourceDirection = bestVariant.sourceDirection;
            a.destDirection = bestVariant.destDirection;
            a.endsOnArrowWithIdentifier = bestVariant.endsOnArrowWithIdentifier;
            a.minimalPoints = bestVariant.minimalPoints;
            a.points = bestVariant.points;
            if (bestVariant.sourceDeltaFromMid < 0) {
                bestVariant.sourceSlot.usedFrom = bestVariant.sourceDeltaFromMid;
                if (bestVariant.sourceSlot.usedTo == null)
                    bestVariant.sourceSlot.usedTo = 0;
            }
            else {
                bestVariant.sourceSlot.usedTo = bestVariant.sourceDeltaFromMid;
                if (bestVariant.sourceSlot.usedFrom == null)
                    bestVariant.sourceSlot.usedFrom = 0;
            }
            if (bestVariant.destDeltaFromMid < 0) {
                bestVariant.destSlot.usedFrom = bestVariant.destDeltaFromMid;
                if (bestVariant.destSlot.usedTo == null)
                    bestVariant.destSlot.usedTo = 0;
            }
            else {
                bestVariant.destSlot.usedTo = bestVariant.destDeltaFromMid;
                if (bestVariant.destSlot.usedFrom == null)
                    bestVariant.destSlot.usedFrom = 0;
            }
            this.addArrowToArrowPointsField(a);
        }
    }
    routeArrow(a, debug = false) {
        if (debug == true)
            debugger;
        this.initWeights();
        this.prepareRectangles();
        this.prepareArrowLocks(a);
        this.calculateWeights(a.dest.x, a.dest.y, a.destDirection.x, a.destDirection.y);
        // this.render(ctx);
        let dx = a.sourceDirection.x;
        let dy = a.sourceDirection.y;
        a.points = [];
        this.addPoint(a.source.x, a.source.y, a);
        let x = a.source.x + a.sourceDirection.x * 2;
        let y = a.source.y + a.sourceDirection.y * 2;
        if (x < 0 || x >= this.routingInput.xMax || y < 0 || y >= this.routingInput.yMax) {
            return;
        }
        let lockWeight = 6;
        this.locks[x][y] = lockWeight;
        let fertig = false;
        let endsInArrow = null;
        this.addPoint(a.source.x + a.sourceDirection.x, a.source.y + a.sourceDirection.y, a);
        endsInArrow = this.addPoint(x, y, a);
        let routeStrategies = [];
        for (let straight = 5; straight >= 0; straight--) {
            for (let normal = 0; normal <= 5; normal++) {
                if (straight != 0 || normal != 0) {
                    routeStrategies.push({ straight: straight, normal: normal, bonus: -Math.abs(straight) - Math.abs(normal) + 1 });
                    if (normal != 0)
                        routeStrategies.push({ straight: straight, normal: -normal, bonus: -Math.abs(straight) - Math.abs(normal) + 1 });
                }
            }
        }
        let lastLength = 0;
        while (!fertig) {
            let newDirectionX = 0;
            let newDirectionY = 0;
            if (Math.abs(a.dest.x - x) + Math.abs(a.dest.y - y) < 4) {
                newDirectionX = a.dest.x - x;
                newDirectionY = a.dest.y - y;
                fertig = true;
            }
            else {
                let minimumWeight = 1000000;
                let w = this.weights[x][y];
                let from = { x: x, y: y };
                if (debug == true)
                    console.log("Position: " + x + "/" + y + ", weight: " + this.weights[x][y] + "+" + this.locks[x][y] + " = " + w);
                for (let rs of routeStrategies) {
                    let ndx = rs.straight * dx + rs.normal * dy;
                    let ndy = rs.straight * dy - rs.normal * dx;
                    let xNew = x + ndx;
                    let yNew = y + ndy;
                    if (xNew < 0 || yNew < 0 || xNew > this.routingInput.xMax - 1 || yNew > this.routingInput.yMax - 1) {
                        continue;
                    }
                    let weight = this.getWeight(from, { x: xNew, y: yNew });
                    let newWeight = weight.destWeight + Math.sqrt(weight.wayWeight); //this.weights[xNew][yNew] + this.locks[xNew][yNew];
                    let s = "Trying " + xNew + "/" + yNew + ": w = " + this.weights[xNew][yNew] + "+" +
                        this.locks[xNew][yNew] + " = " + newWeight + ", Bonus = " + rs.bonus;
                    if (newWeight > w) {
                        newWeight += 3;
                        s += " Verschlechterung => Strafe -3! ";
                    }
                    newWeight -= rs.bonus;
                    // deltaW /= rs.length;
                    if (newWeight < minimumWeight) {
                        minimumWeight = newWeight;
                        newDirectionX = ndx;
                        newDirectionY = ndy;
                        s += " -> new Minimum!";
                    }
                    if (debug == true)
                        console.log(s);
                }
                if (x == a.dest.x && y == a.dest.y || newDirectionX == 0 && newDirectionY == 0) {
                    fertig = true;
                }
            }
            if (x + newDirectionX < 0 || x + newDirectionX > this.routingInput.xMax - 1
                || y + newDirectionY < 0 || y + newDirectionY > this.routingInput.yMax - 1) {
                fertig = true;
                break;
            }
            let weightSumFirstXThenY = 0;
            let weightSumFirstYThenX = 0;
            // first x then y
            let xn = x;
            let yn = y;
            for (let i = 1; i <= Math.abs(newDirectionX); i++) {
                xn += Math.sign(newDirectionX);
                weightSumFirstXThenY += this.weights[xn][yn] + this.locks[xn][yn];
            }
            for (let i = 1; i <= Math.abs(newDirectionY); i++) {
                yn += Math.sign(newDirectionY);
                weightSumFirstXThenY += this.weights[xn][yn] + this.locks[xn][yn];
            }
            // first y then x
            xn = x;
            yn = y;
            for (let i = 1; i <= Math.abs(newDirectionY); i++) {
                yn += Math.sign(newDirectionY);
                weightSumFirstYThenX += this.weights[xn][yn] + this.locks[xn][yn];
            }
            for (let i = 1; i <= Math.abs(newDirectionX); i++) {
                xn += Math.sign(newDirectionX);
                weightSumFirstYThenX += this.weights[xn][yn] + this.locks[xn][yn];
            }
            if (weightSumFirstXThenY <= weightSumFirstYThenX) {
                if (newDirectionX != 0) {
                    for (let i = 1; i <= Math.abs(newDirectionX); i++) {
                        if (endsInArrow != null)
                            break;
                        x += Math.sign(newDirectionX);
                        this.locks[x][y] += lockWeight;
                        endsInArrow = this.addPoint(x, y, a);
                    }
                    dx = Math.sign(newDirectionX);
                    dy = 0;
                }
                if (newDirectionX * newDirectionY != 0) {
                    this.locks[x][y] += 1;
                }
                if (newDirectionY != 0 && endsInArrow == null) {
                    for (let i = 1; i <= Math.abs(newDirectionY); i++) {
                        if (endsInArrow != null)
                            break;
                        y += Math.sign(newDirectionY);
                        this.locks[x][y] += lockWeight;
                        endsInArrow = this.addPoint(x, y, a);
                    }
                    dx = 0;
                    dy = Math.sign(newDirectionY);
                }
            }
            else {
                for (let i = 1; i <= Math.abs(newDirectionY); i++) {
                    if (endsInArrow != null)
                        break;
                    y += Math.sign(newDirectionY);
                    this.locks[x][y] += lockWeight;
                    endsInArrow = this.addPoint(x, y, a);
                }
                this.locks[x][y] += 1;
                for (let i = 1; i <= Math.abs(newDirectionX); i++) {
                    if (endsInArrow != null)
                        break;
                    x += Math.sign(newDirectionX);
                    this.locks[x][y] += lockWeight;
                    endsInArrow = this.addPoint(x, y, a);
                }
                dy = 0;
                dx = Math.sign(newDirectionX);
            }
            if (a.points.length > 1000 || a.points.length == lastLength)
                fertig = true;
            lastLength = a.points.length;
            if (endsInArrow != null) {
                fertig = true;
            }
        }
        if (endsInArrow == null) {
            this.addPoint(x, y, a);
        }
        a.minimalPoints = [];
        if (a.points.length > 0) {
            let lastEdge = a.points[0];
            a.minimalPoints.push(lastEdge);
            let lastPoint = a.points[0];
            let i = 0;
            for (let p of a.points) {
                if (p.x != lastEdge.x && p.y != lastEdge.y || i == a.points.length - 1) {
                    a.minimalPoints.push(lastPoint);
                    lastEdge = lastPoint;
                }
                lastPoint = p;
                i++;
            }
            a.minimalPoints.push(lastPoint);
        }
        if (endsInArrow != null) {
            a.endsOnArrowWithIdentifier = endsInArrow.identifier;
        }
    }
    getWeight(from, to) {
        let dx = to.x - from.x;
        let dy = to.y - from.y;
        let length = Math.abs(dx) + Math.abs(dy);
        let weightFirstHorizontal = 0;
        let weightFirstVertical = 0;
        let x = from.x;
        let y = from.y;
        for (let delta = 1; delta <= Math.abs(dx); delta++) {
            x += Math.sign(dx);
            let w = this.weights[x][y];
            let l = this.locks[x][y];
            weightFirstHorizontal += l;
        }
        for (let delta = 1; delta <= Math.abs(dy); delta++) {
            y += Math.sign(dy);
            let w = this.weights[x][y];
            let l = this.locks[x][y];
            weightFirstHorizontal += l;
        }
        x = from.x;
        y = from.y;
        for (let delta = 1; delta <= Math.abs(dy); delta++) {
            y += Math.sign(dy);
            let w = this.weights[x][y];
            let l = this.locks[x][y];
            weightFirstVertical += l;
        }
        for (let delta = 1; delta <= Math.abs(dx); delta++) {
            x += Math.sign(dx);
            let w = this.weights[x][y];
            let l = this.locks[x][y];
            weightFirstVertical += l;
        }
        let firstHorizontal = weightFirstHorizontal < weightFirstVertical;
        return {
            wayWeight: firstHorizontal ? weightFirstHorizontal : weightFirstVertical,
            firstHorizontal: firstHorizontal,
            destWeight: this.weights[to.x][to.y] + this.locks[to.x][to.y]
        };
    }
    dist(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    }
}
Router.RectangleWeight = 1000;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9kaWFncmFtcy9jbGFzc2RpYWdyYW0vUm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsR0FBRyxVQUFVLENBQUM7SUFFbkIsSUFBSSxFQUFFLEdBQWlCLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFFOUIsSUFBRyxFQUFFLENBQUMsSUFBSSxJQUFJLElBQUk7UUFBRSxPQUFPLENBQUMsaUVBQWlFO0lBRTdGLElBQUksTUFBTSxHQUFXLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3BDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQztJQUUxQixJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUM7SUFFckMsWUFBWTtJQUNaLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUVwQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFFakIsQ0FBQyxDQUFBO0FBK0ZELE1BQU0sTUFBTTtJQVlSLFlBQW1CLFlBQTBCO1FBQTFCLGlCQUFZLEdBQVosWUFBWSxDQUFjO1FBSjdDLGVBQVUsR0FBdUIsRUFBRSxDQUFDO1FBS2hDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDO1FBQ2xDLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDN0gsQ0FBQztJQUVELHFCQUFxQixDQUFDLFVBQXVCO1FBQ3pDLElBQUcsVUFBVSxJQUFJLElBQUk7WUFBRSxPQUFPO1FBQzlCLEtBQUssSUFBSSxDQUFDLElBQUksVUFBVSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUNqQixJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUk7Z0JBQ1osS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLO2dCQUNkLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRztnQkFDVixNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU07Z0JBQ2hCLEtBQUssRUFBRTtvQkFDSDt3QkFDSSxxQkFBcUIsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO3dCQUN0QyxtQkFBbUIsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTt3QkFDbkMsR0FBRyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO3dCQUNoQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQzt3QkFDMUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFO3dCQUN0RCxTQUFTLEVBQUUsQ0FBQyxDQUFDO3FCQUNoQjtvQkFDRDt3QkFDSSxxQkFBcUIsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTt3QkFDckMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7d0JBQ25DLEdBQUcsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQzt3QkFDakMsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7d0JBQzVDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFO3dCQUNqRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO3FCQUNoQjtvQkFDRDt3QkFDSSxxQkFBcUIsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTt3QkFDckMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7d0JBQ25DLEdBQUcsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQzt3QkFDaEMsR0FBRyxFQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7d0JBQzFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFO3dCQUNqRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO3FCQUNoQjtvQkFDRDt3QkFDSSxxQkFBcUIsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO3dCQUN0QyxtQkFBbUIsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTt3QkFDbkMsR0FBRyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO3dCQUNqQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQzt3QkFDNUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFO3dCQUN2RCxTQUFTLEVBQUUsQ0FBQyxDQUFDO3FCQUNoQjtpQkFDSjthQUNKLENBQUMsQ0FBQTtTQUNMO0lBQ0wsQ0FBQztJQUVELFdBQVc7UUFFUCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0csSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVoSCxDQUFDO0lBRUQsaUJBQWlCO1FBRWIsSUFBSSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLHNCQUFzQixDQUFDO1FBQ3RFLElBQUksc0JBQXNCLElBQUksSUFBSTtZQUFFLHNCQUFzQixHQUFHLENBQUMsQ0FBQztRQUUvRCxLQUFLLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDM0IsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxzQkFBc0IsQ0FBQztZQUMzQyxJQUFJLElBQUksR0FBRyxDQUFDO2dCQUFFLElBQUksR0FBRyxDQUFDLENBQUM7WUFDdkIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLHNCQUFzQixDQUFDO1lBQ3RELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxHQUFHLENBQUM7Z0JBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztZQUMzRSxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLHNCQUFzQixDQUFDO1lBQ3pDLElBQUksR0FBRyxHQUFHLENBQUM7Z0JBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNyQixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsc0JBQXNCLENBQUM7WUFDdkQsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEdBQUcsQ0FBQztnQkFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1lBQzdFLEtBQUssSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2hDLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ2hDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQztpQkFDN0M7YUFDSjtTQUVKO0lBQ0wsQ0FBQztJQUVELFlBQVk7UUFFUixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlHLEtBQUssSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUN2QixJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksSUFBSTtnQkFBRSxTQUFTO1lBQy9CLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRTtnQkFDcEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7YUFDNUI7U0FDSjtRQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFFekIsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDO1FBQ2pCLE9BQU8sQ0FBQyxJQUFJLEVBQUU7WUFDVixJQUFJLEdBQUcsSUFBSSxDQUFDO1lBRVosSUFBSSxDQUFDLEdBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxQyxJQUFJLEtBQUssR0FBWSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFeEMsS0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUN2QixJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxhQUFhLElBQUksSUFBSTtvQkFBRSxTQUFTO2dCQUUxRCxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7Z0JBRXZCLElBQUksS0FBSyxHQUFZLENBQUMsQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDO2dCQUMxQyxJQUFJLEtBQUs7b0JBQUUsUUFBUSxDQUFDO2dCQUVwQixJQUFJLENBQUMsQ0FBQyxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFFNUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTt3QkFFakQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTs0QkFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO3lCQUNqQzt3QkFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFOzRCQUN6QixLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3lCQUNqRTt3QkFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDdEMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTs0QkFFekMsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ3RELElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUN0RCxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFFdEQscUNBQXFDOzRCQUVyQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNmLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBRWYsaUNBQWlDOzRCQUVqQyxJQUFJLElBQUksR0FBWSxJQUFJLENBQUM7NEJBQ3pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dDQUN2QyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQzNCLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQ0FDM0IsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQ0FDbEQsSUFBSSxHQUFHLEtBQUssQ0FBQztvQ0FDYixNQUFNO2lDQUNUOzZCQUNKOzRCQUVELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dDQUN0QyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQzNCLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQ0FDM0IsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQ0FDbEQsSUFBSSxHQUFHLEtBQUssQ0FBQztvQ0FDYixNQUFNO2lDQUNUOzZCQUNKOzRCQUVELElBQUksSUFBSSxFQUFFO2dDQUNOLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUNYLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUNYLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO29DQUN2QyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0NBQzNCLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQ0FDM0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7aUNBQzFCO2dDQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO29DQUN0QyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0NBQzNCLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQ0FDM0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7aUNBQzFCO2dDQUVELENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUNYLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUNYLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO29DQUN2QyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUks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QUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxFQUFlLFNBQVM7d0JBQzdELElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQy9CLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztxQkFDbEM7aUJBQ0o7Z0JBQ0QsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFO29CQUNoQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDaEMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzlCLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksRUFBRSxFQUFlLFNBQVM7d0JBQzdELElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQy9CLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztxQkFDbEM7aUJBQ0o7Z0JBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUNQLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNoQyxJ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Qzs7QUF6ekJNLHNCQUFlLEdBQUcsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsib25tZXNzYWdlID0gZnVuY3Rpb24gKGUpIHtcclxuXHJcbiAgICBsZXQgcmk6IFJvdXRpbmdJbnB1dCA9IGUuZGF0YTtcclxuICAgIFxyXG4gICAgaWYocmkueE1heCA9PSBudWxsKSByZXR1cm47IC8vIEJ1Z0ZpeCAwNi4wNi4yMDIwOiBNb25hY28gRWRpdG9yIHNlbmRzIG1lc3NhZ2VzIHRvIGV2ZXJ5b25lLi4uXHJcblxyXG4gICAgbGV0IHJvdXRlcjogUm91dGVyID0gbmV3IFJvdXRlcihyaSk7XHJcbiAgICByb3V0ZXIuYXJyb3dzID0gcmkuYXJyb3dzO1xyXG5cclxuICAgIGxldCByZXN1bHQgPSByb3V0ZXIucm91dGVBbGxBcnJvd3MoKTtcclxuXHJcbiAgICAvL0B0cy1pZ25vcmVcclxuICAgIHBvc3RNZXNzYWdlKHJlc3VsdCk7XHJcblxyXG4gICAgc2VsZi5jbG9zZSgpO1xyXG5cclxufVxyXG5cclxuZXhwb3J0IHR5cGUgUm91dGluZ0lucHV0ID0ge1xyXG4gICAgeE1heDogbnVtYmVyLFxyXG4gICAgeU1heDogbnVtYmVyLFxyXG4gICAgc3RyYWlnaHRBcnJvd1NlY3Rpb25BZnRlclJlY3RhbmdsZT86IG51bWJlcixcclxuICAgIGRpc3RhbmNlRnJvbVJlY3RhbmdsZXM6IG51bWJlcixcclxuICAgIHNsb3REaXN0YW5jZTogbnVtYmVyLFxyXG4gICAgcmVjdGFuZ2xlczogUmVjdGFuZ2xlW107XHJcbiAgICBhcnJvd3M6IFJvdXRpbmdBcnJvd1tdO1xyXG4gICAgdmVyc2lvbj86IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgUm91dGluZ091dHB1dCA9IHtcclxuICAgIHhNYXg6IG51bWJlcixcclxuICAgIHlNYXg6IG51bWJlcixcclxuICAgIGFycm93czogUm91dGluZ0Fycm93W10sXHJcbiAgICByZWN0YW5nbGVzOiBSZWN0YW5nbGVbXSxcclxuICAgIHdlaWdodHM6IG51bWJlcltdW10sXHJcbiAgICBsb2NrczogbnVtYmVyW11bXSxcclxuICAgIHZlcnNpb246IG51bWJlclxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBSZWN0YW5nbGUgPSB7IHRvcDogbnVtYmVyLCBsZWZ0OiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyIH07XHJcblxyXG50eXBlIFNsb3QgPSB7XHJcbiAgICBhcnJvd0RpcmVjdGlvbk91dHdhcmQ6IFBvaW50LFxyXG4gICAgZGVsdGFGcm9tU2xvdFRvU2xvdDogUG9pbnQsXHJcbiAgICB1c2VkRnJvbT86IG51bWJlcixcclxuICAgIHVzZWRUbz86IG51bWJlcixcclxuICAgIGxhc3REZWx0YTogbnVtYmVyLFxyXG4gICAgbWlkOiBQb2ludCxcclxuICAgIG1pbjogbnVtYmVyLFxyXG4gICAgbWF4OiBudW1iZXJcclxufVxyXG5cclxudHlwZSBSb3V0aW5nUmVjdGFuZ2xlID0gUmVjdGFuZ2xlICYge1xyXG4gICAgc2xvdHM6IFNsb3RbXTtcclxufTtcclxuXHJcbmV4cG9ydCB0eXBlIFJvdXRpbmdBcnJvdyA9IHtcclxuICAgIGlkZW50aWZpZXI6IHN0cmluZyxcclxuXHJcbiAgICAvLyBpbnB1dFxyXG4gICAgc291cmNlPzogUG9pbnQsXHJcbiAgICBzb3VyY2VEaXJlY3Rpb24/OiBQb2ludCxcclxuICAgIHNvdXJjZVJlY3RhbmdsZUluZGV4OiBudW1iZXI7XHJcblxyXG4gICAgZGVzdD86IFBvaW50LFxyXG4gICAgZGVzdERpcmVjdGlvbj86IFBvaW50LFxyXG4gICAgZGVzdFJlY3RhbmdsZUluZGV4OiBudW1iZXI7XHJcblxyXG4gICAgYXJyb3dUeXBlOiBzdHJpbmcsXHJcbiAgICBkZXN0aW5hdGlvbklkZW50aWZpZXI6IHN0cmluZyxcclxuICAgIGRlYnVnPzogYm9vbGVhbixcclxuXHJcbiAgICAvLyBvdXRwdXRcclxuICAgIHBvaW50cz86IFBvaW50W10sXHJcbiAgICBtaW5pbWFsUG9pbnRzPzogUG9pbnRbXSxcclxuICAgIGVuZHNPbkFycm93V2l0aElkZW50aWZpZXI/OiBzdHJpbmcsXHJcbiAgICBjb2xvcj86IHN0cmluZ1xyXG59XHJcblxyXG50eXBlIHJvdXRlVmFyaWFudCA9IHtcclxuICAgIHNvdXJjZTogUG9pbnQsXHJcbiAgICBzb3VyY2VEaXJlY3Rpb246IFBvaW50LFxyXG5cclxuICAgIHNvdXJjZURlbHRhRnJvbU1pZDogbnVtYmVyLFxyXG5cclxuXHJcbiAgICBkZXN0OiBQb2ludCxcclxuICAgIGRlc3REaXJlY3Rpb246IFBvaW50LFxyXG5cclxuICAgIGRlc3REZWx0YUZyb21NaWQ6IG51bWJlcixcclxuXHJcbiAgICAvLyBvdXRwdXRcclxuICAgIHBvaW50cz86IFBvaW50W10sXHJcbiAgICBtaW5pbWFsUG9pbnRzPzogUG9pbnRbXSxcclxuICAgIGVuZHNPbkFycm93V2l0aElkZW50aWZpZXI/OiBzdHJpbmcsXHJcblxyXG4gICAgd2VpZ2h0U3VtOiBudW1iZXIsXHJcblxyXG4gICAgc291cmNlU2xvdDogU2xvdCxcclxuICAgIGRlc3RTbG90OiBTbG90XHJcbn1cclxuXHJcblxyXG5leHBvcnQgdHlwZSBQb2ludCA9IHsgeDogbnVtYmVyLCB5OiBudW1iZXIgfTtcclxuXHJcbnR5cGUgUm91dGVTdHJhdGVneSA9IHtcclxuICAgIHN0cmFpZ2h0OiBudW1iZXIsXHJcbiAgICBub3JtYWw6IG51bWJlcixcclxuICAgIGJvbnVzOiBudW1iZXJcclxufTtcclxuXHJcbmNsYXNzIFJvdXRlciB7XHJcblxyXG4gICAgd2VpZ2h0czogbnVtYmVyW11bXTtcclxuICAgIGxvY2tzOiBudW1iZXJbXVtdO1xyXG4gICAgYXJyb3dQb2ludEZpZWxkOiBSb3V0aW5nQXJyb3dbXVtdW107XHJcblxyXG4gICAgc3RhdGljIFJlY3RhbmdsZVdlaWdodCA9IDEwMDA7XHJcblxyXG4gICAgcmVjdGFuZ2xlczogUm91dGluZ1JlY3RhbmdsZVtdID0gW107XHJcbiAgICBhcnJvd3M6IFJvdXRpbmdBcnJvd1tdO1xyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcm91dGluZ0lucHV0OiBSb3V0aW5nSW5wdXQpIHtcclxuICAgICAgICB0aGlzLmluaXRSb3V0aW5nUmVjdGFuZ2xlcyhyb3V0aW5nSW5wdXQucmVjdGFuZ2xlcyk7XHJcbiAgICAgICAgdGhpcy5hcnJvd3MgPSByb3V0aW5nSW5wdXQuYXJyb3dzO1xyXG4gICAgICAgIHRoaXMuYXJyb3dQb2ludEZpZWxkID0gbmV3IEFycmF5KHRoaXMucm91dGluZ0lucHV0LnhNYXgpLmZpbGwoMCkubWFwKCgpID0+IG5ldyBBcnJheSh0aGlzLnJvdXRpbmdJbnB1dC55TWF4KS5maWxsKG51bGwpKTtcclxuICAgIH1cclxuXHJcbiAgICBpbml0Um91dGluZ1JlY3RhbmdsZXMocmVjdGFuZ2xlczogUmVjdGFuZ2xlW10pIHtcclxuICAgICAgICBpZihyZWN0YW5nbGVzID09IG51bGwpIHJldHVybjtcclxuICAgICAgICBmb3IgKGxldCByIG9mIHJlY3RhbmdsZXMpIHtcclxuICAgICAgICAgICAgdGhpcy5yZWN0YW5nbGVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgbGVmdDogci5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IHIud2lkdGgsXHJcbiAgICAgICAgICAgICAgICB0b3A6IHIudG9wLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiByLmhlaWdodCxcclxuICAgICAgICAgICAgICAgIHNsb3RzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgeyAgIC8vIHRvcFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJvd0RpcmVjdGlvbk91dHdhcmQ6IHsgeDogMCwgeTogLTEgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsdGFGcm9tU2xvdFRvU2xvdDogeyB4OiAxLCB5OiAwIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbjogMSAtIE1hdGgucm91bmQoci53aWR0aCAvIDIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXg6IHIud2lkdGggLSBNYXRoLnJvdW5kKHIud2lkdGggLyAyKSAtIDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pZDogeyB4OiByLmxlZnQgKyBNYXRoLnJvdW5kKHIud2lkdGggLyAyKSwgeTogci50b3AgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdERlbHRhOiAtMVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyAgIC8vIHJpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycm93RGlyZWN0aW9uT3V0d2FyZDogeyB4OiAxLCB5OiAwIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhRnJvbVNsb3RUb1Nsb3Q6IHsgeDogMCwgeTogMSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW46IDEgLSBNYXRoLnJvdW5kKHIuaGVpZ2h0IC8gMiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heDogci5oZWlnaHQgLSBNYXRoLnJvdW5kKHIuaGVpZ2h0IC8gMikgLSAxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtaWQ6IHsgeDogci5sZWZ0ICsgci53aWR0aCwgeTogci50b3AgKyBNYXRoLnJvdW5kKHIuaGVpZ2h0IC8gMikgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdERlbHRhOiAtMVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyAgIC8vIGJvdHRvbVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJvd0RpcmVjdGlvbk91dHdhcmQ6IHsgeDogMCwgeTogMSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWx0YUZyb21TbG90VG9TbG90OiB7IHg6IDEsIHk6IDAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWluOiAxIC0gTWF0aC5yb3VuZChyLndpZHRoIC8gMiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heDogci53aWR0aCAtIE1hdGgucm91bmQoci53aWR0aCAvIDIpIC0gMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWlkOiB7IHg6IHIubGVmdCArIE1hdGgucm91bmQoci53aWR0aCAvIDIpLCB5OiByLnRvcCArIHIuaGVpZ2h0IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3REZWx0YTogLTFcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgICAvLyBsZWZ0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycm93RGlyZWN0aW9uT3V0d2FyZDogeyB4OiAtMSwgeTogMCB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWx0YUZyb21TbG90VG9TbG90OiB7IHg6IDAsIHk6IDEgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWluOiAxIC0gTWF0aC5yb3VuZChyLmhlaWdodCAvIDIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXg6IHIuaGVpZ2h0IC0gTWF0aC5yb3VuZChyLmhlaWdodCAvIDIpIC0gMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWlkOiB7IHg6IHIubGVmdCwgeTogci50b3AgKyBNYXRoLnJvdW5kKHIuaGVpZ2h0IC8gMikgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdERlbHRhOiAtMVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdFdlaWdodHMoKSB7XHJcblxyXG4gICAgICAgIHRoaXMud2VpZ2h0cyA9IG5ldyBBcnJheSh0aGlzLnJvdXRpbmdJbnB1dC54TWF4KS5maWxsKDApLm1hcCgoKSA9PiBuZXcgQXJyYXkodGhpcy5yb3V0aW5nSW5wdXQueU1heCkuZmlsbCgtMSkpO1xyXG4gICAgICAgIHRoaXMubG9ja3MgPSBuZXcgQXJyYXkodGhpcy5yb3V0aW5nSW5wdXQueE1heCkuZmlsbCgwKS5tYXAoKCkgPT4gbmV3IEFycmF5KHRoaXMucm91dGluZ0lucHV0LnlNYXgpLmZpbGwoMCkpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwcmVwYXJlUmVjdGFuZ2xlcygpIHtcclxuXHJcbiAgICAgICAgbGV0IGRpc3RhbmNlRnJvbVJlY3RhbmdsZXMgPSB0aGlzLnJvdXRpbmdJbnB1dC5kaXN0YW5jZUZyb21SZWN0YW5nbGVzO1xyXG4gICAgICAgIGlmIChkaXN0YW5jZUZyb21SZWN0YW5nbGVzID09IG51bGwpIGRpc3RhbmNlRnJvbVJlY3RhbmdsZXMgPSAxO1xyXG5cclxuICAgICAgICBmb3IgKGxldCByIG9mIHRoaXMucmVjdGFuZ2xlcykge1xyXG4gICAgICAgICAgICBsZXQgbGVmdCA9IHIubGVmdCAtIGRpc3RhbmNlRnJvbVJlY3RhbmdsZXM7XHJcbiAgICAgICAgICAgIGlmIChsZWZ0IDwgMCkgbGVmdCA9IDA7XHJcbiAgICAgICAgICAgIGxldCByaWdodCA9IHIubGVmdCArIHIud2lkdGggKyBkaXN0YW5jZUZyb21SZWN0YW5nbGVzO1xyXG4gICAgICAgICAgICBpZiAocmlnaHQgPiB0aGlzLnJvdXRpbmdJbnB1dC54TWF4IC0gMSkgcmlnaHQgPSB0aGlzLnJvdXRpbmdJbnB1dC54TWF4IC0gMTtcclxuICAgICAgICAgICAgbGV0IHRvcCA9IHIudG9wIC0gZGlzdGFuY2VGcm9tUmVjdGFuZ2xlcztcclxuICAgICAgICAgICAgaWYgKHRvcCA8IDApIHRvcCA9IDA7XHJcbiAgICAgICAgICAgIGxldCBib3R0b20gPSByLnRvcCArIHIuaGVpZ2h0ICsgZGlzdGFuY2VGcm9tUmVjdGFuZ2xlcztcclxuICAgICAgICAgICAgaWYgKGJvdHRvbSA+IHRoaXMucm91dGluZ0lucHV0LnlNYXggLSAxKSBib3R0b20gPSB0aGlzLnJvdXRpbmdJbnB1dC55TWF4IC0gMTtcclxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IHRvcDsgeSA8PSBib3R0b207IHkrKykge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeCA9IGxlZnQ7IHggPD0gcmlnaHQ7IHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9ja3NbeF1beV0gPSBSb3V0ZXIuUmVjdGFuZ2xlV2VpZ2h0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzbW9vdGhBcnJvd3MoKSB7XHJcblxyXG4gICAgICAgIHRoaXMud2VpZ2h0cyA9IG5ldyBBcnJheSh0aGlzLnJvdXRpbmdJbnB1dC54TWF4KS5maWxsKDApLm1hcCgoKSA9PiBuZXcgQXJyYXkodGhpcy5yb3V0aW5nSW5wdXQueU1heCkuZmlsbCgwKSk7XHJcbiAgICAgICAgZm9yIChsZXQgYSBvZiB0aGlzLmFycm93cykge1xyXG4gICAgICAgICAgICBpZiAoYS5wb2ludHMgPT0gbnVsbCkgY29udGludWU7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHAgb2YgYS5wb2ludHMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMud2VpZ2h0c1twLnhdW3AueV0rKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5sb2NrcyA9IG5ldyBBcnJheSh0aGlzLnJvdXRpbmdJbnB1dC54TWF4KS5maWxsKDApLm1hcCgoKSA9PiBuZXcgQXJyYXkodGhpcy5yb3V0aW5nSW5wdXQueU1heCkuZmlsbCgwKSk7XHJcbiAgICAgICAgdGhpcy5wcmVwYXJlUmVjdGFuZ2xlcygpO1xyXG5cclxuICAgICAgICBsZXQgZG9uZSA9IGZhbHNlO1xyXG4gICAgICAgIHdoaWxlICghZG9uZSkge1xyXG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIGxldCBwOiBQb2ludFtdID0gW251bGwsIG51bGwsIG51bGwsIG51bGxdO1xyXG4gICAgICAgICAgICBsZXQgZGVsdGE6IFBvaW50W10gPSBbbnVsbCwgbnVsbCwgbnVsbF07XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBhIG9mIHRoaXMuYXJyb3dzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYS5wb2ludHMgPT0gbnVsbCB8fCBhLm1pbmltYWxQb2ludHMgPT0gbnVsbCkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFycm93RGlydHkgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgZGVidWc6IGJvb2xlYW4gPSBhLmlkZW50aWZpZXIgPT0gXCJhM1wiO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRlYnVnKSBkZWJ1Z2dlcjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoYS5taW5pbWFsUG9pbnRzLmxlbmd0aCA+IDQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhLm1pbmltYWxQb2ludHMubGVuZ3RoIC0gNDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8PSAzOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBbal0gPSBhLm1pbmltYWxQb2ludHNbaSArIGpdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8PSAyOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhW2pdID0geyB4OiBwW2ogKyAxXS54IC0gcFtqXS54LCB5OiBwW2ogKyAxXS55IC0gcFtqXS55IH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNhbWVEaXJlY3Rpb24oZGVsdGFbMF0sIGRlbHRhWzJdKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIXRoaXMuc2FtZURpcmVjdGlvbihkZWx0YVswXSwgZGVsdGFbMV0pKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGQwMSA9IE1hdGguYWJzKGRlbHRhWzBdLngpICsgTWF0aC5hYnMoZGVsdGFbMF0ueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZDEyID0gTWF0aC5hYnMoZGVsdGFbMV0ueCkgKyBNYXRoLmFicyhkZWx0YVsxXS55KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBkMjMgPSBNYXRoLmFicyhkZWx0YVsyXS54KSArIE1hdGguYWJzKGRlbHRhWzJdLnkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmKGQxMiA+IDIwIHx8IGQyMyA+IDIwKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgeCA9IHBbMF0ueDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB5ID0gcFswXS55O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmKHggPT0gOCAmJiB5ID09IDIpIGRlYnVnZ2VyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmcmVlOiBib29sZWFuID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IE1hdGgucm91bmQoZDEyKTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeCArPSBNYXRoLnNpZ24oZGVsdGFbMV0ueCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeSArPSBNYXRoLnNpZ24oZGVsdGFbMV0ueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMud2VpZ2h0c1t4XVt5XSAhPSAwIHx8IHRoaXMubG9ja3NbeF1beV0gIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmVlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IE1hdGgucm91bmQoZDAxKTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeCArPSBNYXRoLnNpZ24oZGVsdGFbMF0ueCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeSArPSBNYXRoLnNpZ24oZGVsdGFbMF0ueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMud2VpZ2h0c1t4XVt5XSAhPSAwIHx8IHRoaXMubG9ja3NbeF1beV0gIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmVlID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZnJlZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHggPSBwWzBdLng7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeSA9IHBbMF0ueTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBNYXRoLnJvdW5kKGQxMik7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4ICs9IE1hdGguc2lnbihkZWx0YVsxXS54KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeSArPSBNYXRoLnNpZ24oZGVsdGFbMV0ueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2VpZ2h0c1t4XVt5XSA9IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgTWF0aC5yb3VuZChkMDEpOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeCArPSBNYXRoLnNpZ24oZGVsdGFbMF0ueCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkgKz0gTWF0aC5zaWduKGRlbHRhWzBdLnkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndlaWdodHNbeF1beV0gPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeCA9IHBbMF0ueDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ID0gcFswXS55O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IE1hdGgucm91bmQoZDAxKTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHggKz0gTWF0aC5zaWduKGRlbHRhWzBdLngpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5ICs9IE1hdGguc2lnbihkZWx0YVswXS55KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53ZWlnaHRzW3hdW3ldID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBNYXRoLnJvdW5kKGQxMik7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4ICs9IE1hdGguc2lnbihkZWx0YVsxXS54KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeSArPSBNYXRoLnNpZ24oZGVsdGFbMV0ueSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2VpZ2h0c1t4XVt5XSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcyA9IGEuaWRlbnRpZmllciArIFwiOiBcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBwIG9mIGEubWluaW1hbFBvaW50cykgcyArPSBcIihcIiArIHAueCArIFwiLCBcIiArIHAueSArIFwiKSxcIjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcFsxXS54ID0gcFswXS54ICsgZGVsdGFbMV0ueDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwWzFdLnkgPSBwWzBdLnkgKyBkZWx0YVsxXS55O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZGVsZXRlMkFuZDM6IGJvb2xlYW4gPSBwWzFdLnggPT0gcFszXS54ICYmIHBbMV0ueSA9PSBwWzNdLnk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGEubWluaW1hbFBvaW50cy5zcGxpY2UoaSArIDIsIGRlbGV0ZTJBbmQzID8gMiA6IDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycm93RGlydHkgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpLS07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoYXJyb3dEaXJ0eSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGEubWluaW1hbFBvaW50cy5sZW5ndGggLSAyOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGEubWluaW1hbFBvaW50c1tpICsgMF0ueCA9PSBhLm1pbmltYWxQb2ludHNbaSArIDFdLnggJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGEubWluaW1hbFBvaW50c1tpICsgMV0ueCA9PSBhLm1pbmltYWxQb2ludHNbaSArIDJdLnggfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGEubWluaW1hbFBvaW50c1tpICsgMF0ueSA9PSBhLm1pbmltYWxQb2ludHNbaSArIDFdLnkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGEubWluaW1hbFBvaW50c1tpICsgMV0ueSA9PSBhLm1pbmltYWxQb2ludHNbaSArIDJdLnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYS5taW5pbWFsUG9pbnRzLnNwbGljZShpICsgMSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpLS07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHMgPSBcIi0+XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgcCBvZiBhLm1pbmltYWxQb2ludHMpIHMgKz0gXCIoXCIgKyBwLnggKyBcIiwgXCIgKyBwLnkgKyBcIiksXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzYW1lRGlyZWN0aW9uKHAxOiBQb2ludCwgcDI6IFBvaW50KTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguc2lnbihwMS54KSA9PSBNYXRoLnNpZ24ocDIueCkgJiYgTWF0aC5zaWduKHAxLnkpID09IE1hdGguc2lnbihwMi55KTtcclxuICAgIH1cclxuXHJcbiAgICBwcmVwYXJlQXJyb3dMb2NrcyhuZXdBcnJvdzogUm91dGluZ0Fycm93KSB7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGEgb2YgdGhpcy5hcnJvd3MpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChhID09IG5ld0Fycm93KSByZXR1cm47XHJcbiAgICAgICAgICAgIGxldCBqb2luQXJyb3c6IGJvb2xlYW4gPSBhLmFycm93VHlwZSA9PSBuZXdBcnJvdy5hcnJvd1R5cGUgJiYgYS5kZXN0aW5hdGlvbklkZW50aWZpZXIgPT0gbmV3QXJyb3cuZGVzdGluYXRpb25JZGVudGlmaWVyO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgcCBvZiBhLnBvaW50cykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGpvaW5BcnJvdykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9ja3NbcC54XVtwLnldID0gMDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndlaWdodHNbcC54XVtwLnldID0gMDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHcgPSA2O1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9ja3NbcC54XVtwLnldICs9IHc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIGNhbGN1bGF0ZVdlaWdodHMoeFN0YXJ0OiBudW1iZXIsIHlTdGFydDogbnVtYmVyLCBkeFN0YXJ0OiBudW1iZXIsIGR5U3RhcnQ6IG51bWJlcikge1xyXG5cclxuICAgICAgICBpZih0aGlzLndlaWdodHNbeFN0YXJ0ICsgZHhTdGFydF0gPT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMud2VpZ2h0c1t4U3RhcnQgKyBkeFN0YXJ0XVt5U3RhcnQgKyBkeVN0YXJ0XSA9IDE7XHJcbiAgICAgICAgdGhpcy53ZWlnaHRzW3hTdGFydF1beVN0YXJ0XSA9IDA7XHJcblxyXG4gICAgICAgIGxldCBkID0gdGhpcy5yb3V0aW5nSW5wdXQuc3RyYWlnaHRBcnJvd1NlY3Rpb25BZnRlclJlY3RhbmdsZTtcclxuICAgICAgICBpZiAoZCA9PSBudWxsKSBkID0gMztcclxuXHJcbiAgICAgICAgbGV0IG5vcm1hbFggPSAxIC0gTWF0aC5hYnMoZHhTdGFydCk7XHJcbiAgICAgICAgbGV0IG5vcm1hbFkgPSAxIC0gTWF0aC5hYnMoZHlTdGFydCk7XHJcblxyXG4gICAgICAgIGxldCBpOiBudW1iZXIgPSAwO1xyXG4gICAgICAgIHdoaWxlIChpIDwgZCArIDMpIHtcclxuICAgICAgICAgICAgbGV0IHggPSB4U3RhcnQgKyBkeFN0YXJ0ICogaTtcclxuICAgICAgICAgICAgbGV0IHkgPSB5U3RhcnQgKyBkeVN0YXJ0ICogaTtcclxuICAgICAgICAgICAgaWYgKHggPiAwICYmIHggPCB0aGlzLnJvdXRpbmdJbnB1dC54TWF4ICYmXHJcbiAgICAgICAgICAgICAgICB5ID4gMCAmJiB5IDwgdGhpcy5yb3V0aW5nSW5wdXQueU1heCAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5sb2Nrc1t4XVt5XSA+IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubG9ja3NbeF1beV0gPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGkrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGkgPSAwO1xyXG4gICAgICAgIHdoaWxlIChpIDw9IGQpIHtcclxuICAgICAgICAgICAgbGV0IHggPSB4U3RhcnQgKyBkeFN0YXJ0ICogaTtcclxuICAgICAgICAgICAgbGV0IHkgPSB5U3RhcnQgKyBkeVN0YXJ0ICogaTtcclxuICAgICAgICAgICAgaWYgKHggPiAwICYmIHggPCB0aGlzLnJvdXRpbmdJbnB1dC54TWF4ICYmXHJcbiAgICAgICAgICAgICAgICB5ID4gMCAmJiB5IDwgdGhpcy5yb3V0aW5nSW5wdXQueU1heCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sb2Nrc1t4ICsgbm9ybWFsWF1beSArIG5vcm1hbFldID0gMTAwMDtcclxuICAgICAgICAgICAgICAgIHRoaXMubG9ja3NbeCAtIG5vcm1hbFhdW3kgLSBub3JtYWxZXSA9IDEwMDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHN0YWNrOiBQb2ludFtdID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgdGhpcy5yb3V0aW5nSW5wdXQueU1heDsgeSsrKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy5yb3V0aW5nSW5wdXQueE1heDsgeCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy53ZWlnaHRzW3hdW3ldID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHsgeDogeCwgeTogeSB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHN0YWNrLnB1c2goeyB4OiB4U3RhcnQgKyBkeFN0YXJ0LCB5OiB5U3RhcnQgKyBkeVN0YXJ0IH0pO1xyXG5cclxuXHJcbiAgICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDApIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBzdGFjazE6IFBvaW50W10gPSBzdGFjaztcclxuICAgICAgICAgICAgc3RhY2sgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IHAgb2Ygc3RhY2sxKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgeCA9IHAueDtcclxuICAgICAgICAgICAgICAgIGxldCB5ID0gcC55O1xyXG4gICAgICAgICAgICAgICAgbGV0IHc6IG51bWJlciA9IHRoaXMud2VpZ2h0c1t4XVt5XTtcclxuICAgICAgICAgICAgICAgIGlmICh4ID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB3MSA9IHRoaXMud2VpZ2h0c1t4IC0gMV1beV07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGwxID0gdGhpcy5sb2Nrc1t4IC0gMV1beV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCh3MSA8IDAgfHwgdzEgPiB3ICsgMSkgJiYgbDEgPCAxMDAwKSB7ICAgICAgICAgICAgICAvLyB3MSA8IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53ZWlnaHRzW3ggLSAxXVt5XSA9IHcgKyAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHsgeDogeCAtIDEsIHk6IHkgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHggPCB0aGlzLnJvdXRpbmdJbnB1dC54TWF4IC0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB3MSA9IHRoaXMud2VpZ2h0c1t4ICsgMV1beV07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGwxID0gdGhpcy5sb2Nrc1t4ICsgMV1beV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCh3MSA8IDAgfHwgdzEgPiB3ICsgMSkgJiYgbDEgPCAxMDAwKSB7ICAgICAgICAgICAgICAvLyB3MSA8IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53ZWlnaHRzW3ggKyAxXVt5XSA9IHcgKyAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHsgeDogeCArIDEsIHk6IHkgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHkgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHcxID0gdGhpcy53ZWlnaHRzW3hdW3kgLSAxXTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbDEgPSB0aGlzLmxvY2tzW3hdW3kgLSAxXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoKHcxIDwgMCB8fCB3MSA+IHcgKyAxKSAmJiBsMSA8IDEwMDApIHsgICAgICAgICAgICAgIC8vIHcxIDwgMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndlaWdodHNbeF1beSAtIDFdID0gdyArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goeyB4OiB4LCB5OiB5IC0gMSB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoeSA8IHRoaXMucm91dGluZ0lucHV0LnlNYXggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHcxID0gdGhpcy53ZWlnaHRzW3hdW3kgKyAxXTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbDEgPSB0aGlzLmxvY2tzW3hdW3kgKyAxXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoKHcxIDwgMCB8fCB3MSA+IHcgKyAxKSAmJiBsMSA8IDEwMDApIHsgICAgICAgICAgICAgIC8vIHcxIDwgMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndlaWdodHNbeF1beSArIDFdID0gdyArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goeyB4OiB4LCB5OiB5ICsgMSB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIGFkZFBvaW50KHg6IG51bWJlciwgeTogbnVtYmVyLCBhcnJvdzogUm91dGluZ0Fycm93KTogUm91dGluZ0Fycm93IHtcclxuICAgICAgICBpZih4IDwgdGhpcy5hcnJvd1BvaW50RmllbGQubGVuZ3RoICYmIHkgPCB0aGlzLmFycm93UG9pbnRGaWVsZFt4XS5sZW5ndGgpe1xyXG4gICAgICAgICAgICBhcnJvdy5wb2ludHMucHVzaCh7IHg6IHgsIHk6IHkgfSk7XHJcbiAgICAgICAgICAgIGxldCBhcnJvd3M6IFJvdXRpbmdBcnJvd1tdID0gdGhpcy5hcnJvd1BvaW50RmllbGRbeF1beV07XHJcbiAgICAgICAgICAgIGlmIChhcnJvd3MgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYSBvZiBhcnJvd3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYS5hcnJvd1R5cGUgPT0gYXJyb3cuYXJyb3dUeXBlICYmIGEuZGVzdGluYXRpb25JZGVudGlmaWVyID09IGFycm93LmRlc3RpbmF0aW9uSWRlbnRpZmllcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkQXJyb3dUb0Fycm93UG9pbnRzRmllbGQoYXJyb3c6IFJvdXRpbmdBcnJvdykge1xyXG4gICAgICAgIGlmIChhcnJvdy5wb2ludHMgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIGZvciAobGV0IHAgb2YgYXJyb3cucG9pbnRzKSB7XHJcbiAgICAgICAgICAgIGxldCBhcnJvd3M6IFJvdXRpbmdBcnJvd1tdID0gdGhpcy5hcnJvd1BvaW50RmllbGRbcC54XVtwLnldO1xyXG4gICAgICAgICAgICBpZiAoYXJyb3dzID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXJyb3dQb2ludEZpZWxkW3AueF1bcC55XSA9IFthcnJvd107XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhcnJvd3MucHVzaChhcnJvdyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYWRkUG9pbnQoeDogbnVtYmVyLCB5OiBudW1iZXIsIGFycm93OiBSb3V0aW5nQXJyb3cpOiBSb3V0aW5nQXJyb3cge1xyXG4gICAgLy8gICAgIGFycm93LnBvaW50cy5wdXNoKHsgeDogeCwgeTogeSB9KTtcclxuICAgIC8vICAgICBsZXQgYXJyb3dzOiBSb3V0aW5nQXJyb3dbXSA9IHRoaXMuYXJyb3dQb2ludEZpZWxkW3hdW3ldO1xyXG4gICAgLy8gICAgIGlmIChhcnJvd3MgPT0gbnVsbCkge1xyXG4gICAgLy8gICAgICAgICBhcnJvd3MgPSBbXTtcclxuICAgIC8vICAgICAgICAgdGhpcy5hcnJvd1BvaW50RmllbGRbeF1beV0gPSBhcnJvd3M7XHJcbiAgICAvLyAgICAgfSBlbHNlIHtcclxuICAgIC8vICAgICAgICAgZm9yIChsZXQgYSBvZiBhcnJvd3MpIHtcclxuICAgIC8vICAgICAgICAgICAgIGlmIChhLmFycm93VHlwZSA9PSBhcnJvdy5hcnJvd1R5cGUgJiYgYS5kZXN0aW5hdGlvbklkZW50aWZpZXIgPT0gYXJyb3cuZGVzdGluYXRpb25JZGVudGlmaWVyKSB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgYXJyb3dzLnB1c2goYXJyb3cpO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgIHJldHVybiBhO1xyXG4gICAgLy8gICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgICB9XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gICAgIGFycm93cy5wdXNoKGFycm93KTtcclxuICAgIC8vIH1cclxuXHJcbiAgICByb3V0ZUFsbEFycm93cygpOiBSb3V0aW5nT3V0cHV0IHtcclxuICAgICAgICBpZih0aGlzLmFycm93cyAhPSBudWxsKXtcclxuICAgICAgICAgICAgZm9yIChsZXQgYSBvZiB0aGlzLmFycm93cykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yb3V0ZUFycm93T3B0aW1pemVkKGEsIGEuZGVidWcgPT0gdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5zbW9vdGhBcnJvd3MoKTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4TWF4OiB0aGlzLnJvdXRpbmdJbnB1dC54TWF4LFxyXG4gICAgICAgICAgICB5TWF4OiB0aGlzLnJvdXRpbmdJbnB1dC55TWF4LFxyXG4gICAgICAgICAgICBhcnJvd3M6IHRoaXMuYXJyb3dzLFxyXG4gICAgICAgICAgICByZWN0YW5nbGVzOiB0aGlzLnJlY3RhbmdsZXMsXHJcbiAgICAgICAgICAgIHdlaWdodHM6IHRoaXMud2VpZ2h0cyxcclxuICAgICAgICAgICAgbG9ja3M6IHRoaXMubG9ja3MsXHJcbiAgICAgICAgICAgIHZlcnNpb246IHRoaXMucm91dGluZ0lucHV0LnZlcnNpb25cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHJvdXRlQXJyb3dPcHRpbWl6ZWQoYTogUm91dGluZ0Fycm93LCBkZWJ1ZzogYm9vbGVhbiA9IGZhbHNlKSB7XHJcblxyXG4gICAgICAgIGxldCByb3V0ZVZhcmlhbnRzOiByb3V0ZVZhcmlhbnRbXSA9IFtdO1xyXG4gICAgICAgIGxldCBzb3VyY2VSZWN0ID0gdGhpcy5yZWN0YW5nbGVzW2Euc291cmNlUmVjdGFuZ2xlSW5kZXhdO1xyXG4gICAgICAgIGxldCBkZXN0UmVjdCA9IHRoaXMucmVjdGFuZ2xlc1thLmRlc3RSZWN0YW5nbGVJbmRleF07XHJcbiAgICAgICAgbGV0IHNsb3REaXN0YW5jZSA9IHRoaXMucm91dGluZ0lucHV0LnNsb3REaXN0YW5jZTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgc291cmNlRGlyZWN0aW9uID0gMDsgc291cmNlRGlyZWN0aW9uIDwgNDsgc291cmNlRGlyZWN0aW9uKyspIHtcclxuICAgICAgICAgICAgLy8gZm9yIChsZXQgc291cmNlU2xvdERlbHRhIG9mIFstMSwgMV0pIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBkZXN0RGlyZWN0aW9uID0gMDsgZGVzdERpcmVjdGlvbiA8IDQ7IGRlc3REaXJlY3Rpb24rKykge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGZvciAobGV0IGRlc3RTbG90RGVsdGEgb2YgWy0xLCAxXSkgXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNvdXJjZVNsb3QgPSBzb3VyY2VSZWN0LnNsb3RzW3NvdXJjZURpcmVjdGlvbl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBkZXN0U2xvdCA9IGRlc3RSZWN0LnNsb3RzW2Rlc3REaXJlY3Rpb25dO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNvdXJjZURlbHRhRnJvbU1pZCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc291cmNlU2xvdERlbHRhID0gc291cmNlU2xvdC5sYXN0RGVsdGEgKiAtMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlU2xvdC5sYXN0RGVsdGEgKj0gLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBkZXN0U2xvdERlbHRhID0gZGVzdFNsb3QubGFzdERlbHRhICogLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RTbG90Lmxhc3REZWx0YSAqPSAtMTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2VTbG90LnVzZWRGcm9tICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VEZWx0YUZyb21NaWQgPSBzb3VyY2VTbG90RGVsdGEgPiAwID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VTbG90LnVzZWRUbyArIHNsb3REaXN0YW5jZSA6IHNvdXJjZVNsb3QudXNlZEZyb20gLSBzbG90RGlzdGFuY2U7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoc291cmNlRGVsdGFGcm9tTWlkIDwgc291cmNlU2xvdC5taW4gfHwgc291cmNlRGVsdGFGcm9tTWlkID4gc291cmNlU2xvdC5tYXgpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc291cmNlUG9zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogc291cmNlU2xvdC5taWQueCArIHNvdXJjZVNsb3QuZGVsdGFGcm9tU2xvdFRvU2xvdC54ICogc291cmNlRGVsdGFGcm9tTWlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogc291cmNlU2xvdC5taWQueSArIHNvdXJjZVNsb3QuZGVsdGFGcm9tU2xvdFRvU2xvdC55ICogc291cmNlRGVsdGFGcm9tTWlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZGVzdERlbHRhRnJvbU1pZCA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZXN0U2xvdC51c2VkRnJvbSAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzdERlbHRhRnJvbU1pZCA9IGRlc3RTbG90RGVsdGEgPiAwID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXN0U2xvdC51c2VkVG8gKyBzbG90RGlzdGFuY2UgOiBkZXN0U2xvdC51c2VkRnJvbSAtIHNsb3REaXN0YW5jZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihkZXN0RGVsdGFGcm9tTWlkIDwgZGVzdFNsb3QubWluIHx8IGRlc3REZWx0YUZyb21NaWQgPiBkZXN0U2xvdC5tYXgpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZGVzdFBvcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IGRlc3RTbG90Lm1pZC54ICsgZGVzdFNsb3QuZGVsdGFGcm9tU2xvdFRvU2xvdC54ICogZGVzdERlbHRhRnJvbU1pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IGRlc3RTbG90Lm1pZC55ICsgZGVzdFNsb3QuZGVsdGFGcm9tU2xvdFRvU2xvdC55ICogZGVzdERlbHRhRnJvbU1pZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGEuc291cmNlID0gc291cmNlUG9zO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhLmRlc3QgPSBkZXN0UG9zO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhLnNvdXJjZURpcmVjdGlvbiA9IHNvdXJjZVNsb3QuYXJyb3dEaXJlY3Rpb25PdXR3YXJkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhLmRlc3REaXJlY3Rpb24gPSB7IHg6IGRlc3RTbG90LmFycm93RGlyZWN0aW9uT3V0d2FyZC54LCB5OiBkZXN0U2xvdC5hcnJvd0RpcmVjdGlvbk91dHdhcmQueSB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhLmVuZHNPbkFycm93V2l0aElkZW50aWZpZXIgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKHNvdXJjZVBvcy54IC0gZGVzdFBvcy54KSArIE1hdGguYWJzKHNvdXJjZVBvcy55IC0gZGVzdFBvcy55KSA+IDIgKiB0aGlzLnJvdXRpbmdJbnB1dC5zdHJhaWdodEFycm93U2VjdGlvbkFmdGVyUmVjdGFuZ2xlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJvdXRlQXJyb3coYSwgZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB3ZWlnaHQgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgcCBvZiBhLnBvaW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB3ID0gdGhpcy53ZWlnaHRzW3AueF1bcC55XTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ZWlnaHQgKz0gKHcgPCAwID8gMTAwMCA6IHcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsID0gdGhpcy5sb2Nrc1twLnhdW3AueV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYobCA+IDExICYmIGwgPCAxMDAwKXsgLy8gSW50ZXJzZWN0aW9uIG9mIGFycm93c1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ZWlnaHQgKz0gNTAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3V0ZVZhcmlhbnRzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc3Q6IGRlc3RQb3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBzb3VyY2VQb3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzdERlbHRhRnJvbU1pZDogZGVzdERlbHRhRnJvbU1pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VEZWx0YUZyb21NaWQ6IHNvdXJjZURlbHRhRnJvbU1pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXN0RGlyZWN0aW9uOiBhLmRlc3REaXJlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlRGlyZWN0aW9uOiBhLnNvdXJjZURpcmVjdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ZWlnaHRTdW06IHdlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRzT25BcnJvd1dpdGhJZGVudGlmaWVyOiBhLmVuZHNPbkFycm93V2l0aElkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzOiBhLnBvaW50cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5pbWFsUG9pbnRzOiBhLm1pbmltYWxQb2ludHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlU2xvdDogc291cmNlU2xvdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXN0U2xvdDogZGVzdFNsb3RcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbWluV2VpZ2h0ID0gMTAwMDAwMDtcclxuICAgICAgICBsZXQgYmVzdFZhcmlhbnQ6IHJvdXRlVmFyaWFudCA9IG51bGw7XHJcbiAgICAgICAgZm9yIChsZXQgdiBvZiByb3V0ZVZhcmlhbnRzKSB7XHJcbiAgICAgICAgICAgIGlmICh2LndlaWdodFN1bSA+IDMgJiYgdi53ZWlnaHRTdW0gPCBtaW5XZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgIGJlc3RWYXJpYW50ID0gdjtcclxuICAgICAgICAgICAgICAgIG1pbldlaWdodCA9IHYud2VpZ2h0U3VtO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYmVzdFZhcmlhbnQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBhLnNvdXJjZSA9IGJlc3RWYXJpYW50LnNvdXJjZTtcclxuICAgICAgICAgICAgYS5kZXN0ID0gYmVzdFZhcmlhbnQuZGVzdDtcclxuICAgICAgICAgICAgYS5zb3VyY2VEaXJlY3Rpb24gPSBiZXN0VmFyaWFudC5zb3VyY2VEaXJlY3Rpb247XHJcbiAgICAgICAgICAgIGEuZGVzdERpcmVjdGlvbiA9IGJlc3RWYXJpYW50LmRlc3REaXJlY3Rpb247XHJcbiAgICAgICAgICAgIGEuZW5kc09uQXJyb3dXaXRoSWRlbnRpZmllciA9IGJlc3RWYXJpYW50LmVuZHNPbkFycm93V2l0aElkZW50aWZpZXI7XHJcbiAgICAgICAgICAgIGEubWluaW1hbFBvaW50cyA9IGJlc3RWYXJpYW50Lm1pbmltYWxQb2ludHM7XHJcbiAgICAgICAgICAgIGEucG9pbnRzID0gYmVzdFZhcmlhbnQucG9pbnRzO1xyXG5cclxuICAgICAgICAgICAgaWYgKGJlc3RWYXJpYW50LnNvdXJjZURlbHRhRnJvbU1pZCA8IDApIHtcclxuICAgICAgICAgICAgICAgIGJlc3RWYXJpYW50LnNvdXJjZVNsb3QudXNlZEZyb20gPSBiZXN0VmFyaWFudC5zb3VyY2VEZWx0YUZyb21NaWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoYmVzdFZhcmlhbnQuc291cmNlU2xvdC51c2VkVG8gPT0gbnVsbCkgYmVzdFZhcmlhbnQuc291cmNlU2xvdC51c2VkVG8gPSAwO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYmVzdFZhcmlhbnQuc291cmNlU2xvdC51c2VkVG8gPSBiZXN0VmFyaWFudC5zb3VyY2VEZWx0YUZyb21NaWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoYmVzdFZhcmlhbnQuc291cmNlU2xvdC51c2VkRnJvbSA9PSBudWxsKSBiZXN0VmFyaWFudC5zb3VyY2VTbG90LnVzZWRGcm9tID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoYmVzdFZhcmlhbnQuZGVzdERlbHRhRnJvbU1pZCA8IDApIHtcclxuICAgICAgICAgICAgICAgIGJlc3RWYXJpYW50LmRlc3RTbG90LnVzZWRGcm9tID0gYmVzdFZhcmlhbnQuZGVzdERlbHRhRnJvbU1pZDtcclxuICAgICAgICAgICAgICAgIGlmIChiZXN0VmFyaWFudC5kZXN0U2xvdC51c2VkVG8gPT0gbnVsbCkgYmVzdFZhcmlhbnQuZGVzdFNsb3QudXNlZFRvID0gMDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGJlc3RWYXJpYW50LmRlc3RTbG90LnVzZWRUbyA9IGJlc3RWYXJpYW50LmRlc3REZWx0YUZyb21NaWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoYmVzdFZhcmlhbnQuZGVzdFNsb3QudXNlZEZyb20gPT0gbnVsbCkgYmVzdFZhcmlhbnQuZGVzdFNsb3QudXNlZEZyb20gPSAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFkZEFycm93VG9BcnJvd1BvaW50c0ZpZWxkKGEpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJvdXRlQXJyb3coYTogUm91dGluZ0Fycm93LCBkZWJ1ZzogYm9vbGVhbiA9IGZhbHNlKSB7XHJcblxyXG4gICAgICAgIGlmIChkZWJ1ZyA9PSB0cnVlKSBkZWJ1Z2dlcjtcclxuICAgICAgICB0aGlzLmluaXRXZWlnaHRzKCk7XHJcbiAgICAgICAgdGhpcy5wcmVwYXJlUmVjdGFuZ2xlcygpO1xyXG4gICAgICAgIHRoaXMucHJlcGFyZUFycm93TG9ja3MoYSk7XHJcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVXZWlnaHRzKGEuZGVzdC54LCBhLmRlc3QueSwgYS5kZXN0RGlyZWN0aW9uLngsIGEuZGVzdERpcmVjdGlvbi55KTtcclxuXHJcbiAgICAgICAgLy8gdGhpcy5yZW5kZXIoY3R4KTtcclxuICAgICAgICBsZXQgZHggPSBhLnNvdXJjZURpcmVjdGlvbi54O1xyXG4gICAgICAgIGxldCBkeSA9IGEuc291cmNlRGlyZWN0aW9uLnk7XHJcblxyXG4gICAgICAgIGEucG9pbnRzID0gW107XHJcblxyXG4gICAgICAgIHRoaXMuYWRkUG9pbnQoYS5zb3VyY2UueCwgYS5zb3VyY2UueSwgYSk7XHJcblxyXG4gICAgICAgIGxldCB4ID0gYS5zb3VyY2UueCArIGEuc291cmNlRGlyZWN0aW9uLnggKiAyO1xyXG4gICAgICAgIGxldCB5ID0gYS5zb3VyY2UueSArIGEuc291cmNlRGlyZWN0aW9uLnkgKiAyO1xyXG5cclxuICAgICAgICBpZiAoeCA8IDAgfHwgeCA+PSB0aGlzLnJvdXRpbmdJbnB1dC54TWF4IHx8IHkgPCAwIHx8IHkgPj0gdGhpcy5yb3V0aW5nSW5wdXQueU1heCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbG9ja1dlaWdodCA9IDY7XHJcbiAgICAgICAgdGhpcy5sb2Nrc1t4XVt5XSA9IGxvY2tXZWlnaHQ7XHJcblxyXG4gICAgICAgIGxldCBmZXJ0aWcgPSBmYWxzZTtcclxuICAgICAgICBsZXQgZW5kc0luQXJyb3c6IFJvdXRpbmdBcnJvdyA9IG51bGw7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkUG9pbnQoYS5zb3VyY2UueCArIGEuc291cmNlRGlyZWN0aW9uLngsIGEuc291cmNlLnkgKyBhLnNvdXJjZURpcmVjdGlvbi55LCBhKTtcclxuICAgICAgICBlbmRzSW5BcnJvdyA9IHRoaXMuYWRkUG9pbnQoeCwgeSwgYSk7XHJcblxyXG4gICAgICAgIGxldCByb3V0ZVN0cmF0ZWdpZXM6IFJvdXRlU3RyYXRlZ3lbXSA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBzdHJhaWdodCA9IDU7IHN0cmFpZ2h0ID49IDA7IHN0cmFpZ2h0LS0pIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgbm9ybWFsID0gMDsgbm9ybWFsIDw9IDU7IG5vcm1hbCsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyYWlnaHQgIT0gMCB8fCBub3JtYWwgIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJvdXRlU3RyYXRlZ2llcy5wdXNoKHsgc3RyYWlnaHQ6IHN0cmFpZ2h0LCBub3JtYWw6IG5vcm1hbCwgYm9udXM6IC1NYXRoLmFicyhzdHJhaWdodCkgLSBNYXRoLmFicyhub3JtYWwpICsgMSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChub3JtYWwgIT0gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgcm91dGVTdHJhdGVnaWVzLnB1c2goeyBzdHJhaWdodDogc3RyYWlnaHQsIG5vcm1hbDogLW5vcm1hbCwgYm9udXM6IC1NYXRoLmFicyhzdHJhaWdodCkgLSBNYXRoLmFicyhub3JtYWwpICsgMSB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgbGV0IGxhc3RMZW5ndGggPSAwO1xyXG4gICAgICAgIHdoaWxlICghZmVydGlnKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgbmV3RGlyZWN0aW9uWCA9IDA7XHJcbiAgICAgICAgICAgIGxldCBuZXdEaXJlY3Rpb25ZID0gMDtcclxuICAgICAgICAgICAgaWYgKE1hdGguYWJzKGEuZGVzdC54IC0geCkgKyBNYXRoLmFicyhhLmRlc3QueSAtIHkpIDwgNCkge1xyXG4gICAgICAgICAgICAgICAgbmV3RGlyZWN0aW9uWCA9IGEuZGVzdC54IC0geDtcclxuICAgICAgICAgICAgICAgIG5ld0RpcmVjdGlvblkgPSBhLmRlc3QueSAtIHk7XHJcbiAgICAgICAgICAgICAgICBmZXJ0aWcgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGV0IG1pbmltdW1XZWlnaHQgPSAxMDAwMDAwO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCB3ID0gdGhpcy53ZWlnaHRzW3hdW3ldO1xyXG4gICAgICAgICAgICAgICAgbGV0IGZyb206IFBvaW50ID0geyB4OiB4LCB5OiB5IH07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGRlYnVnID09IHRydWUpIGNvbnNvbGUubG9nKFwiUG9zaXRpb246IFwiICsgeCArIFwiL1wiICsgeSArIFwiLCB3ZWlnaHQ6IFwiICsgdGhpcy53ZWlnaHRzW3hdW3ldICsgXCIrXCIgKyB0aGlzLmxvY2tzW3hdW3ldICsgXCIgPSBcIiArIHcpO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgcnMgb2Ygcm91dGVTdHJhdGVnaWVzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZHggPSBycy5zdHJhaWdodCAqIGR4ICsgcnMubm9ybWFsICogZHk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5keSA9IHJzLnN0cmFpZ2h0ICogZHkgLSBycy5ub3JtYWwgKiBkeDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHhOZXcgPSB4ICsgbmR4O1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB5TmV3ID0geSArIG5keTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHhOZXcgPCAwIHx8IHlOZXcgPCAwIHx8IHhOZXcgPiB0aGlzLnJvdXRpbmdJbnB1dC54TWF4IC0gMSB8fCB5TmV3ID4gdGhpcy5yb3V0aW5nSW5wdXQueU1heCAtIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgd2VpZ2h0ID0gdGhpcy5nZXRXZWlnaHQoZnJvbSwgeyB4OiB4TmV3LCB5OiB5TmV3IH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgbmV3V2VpZ2h0ID0gd2VpZ2h0LmRlc3RXZWlnaHQgKyBNYXRoLnNxcnQod2VpZ2h0LndheVdlaWdodCk7IC8vdGhpcy53ZWlnaHRzW3hOZXddW3lOZXddICsgdGhpcy5sb2Nrc1t4TmV3XVt5TmV3XTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgczogc3RyaW5nID0gXCJUcnlpbmcgXCIgKyB4TmV3ICsgXCIvXCIgKyB5TmV3ICsgXCI6IHcgPSBcIiArIHRoaXMud2VpZ2h0c1t4TmV3XVt5TmV3XSArIFwiK1wiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2Nrc1t4TmV3XVt5TmV3XSArIFwiID0gXCIgKyBuZXdXZWlnaHQgKyBcIiwgQm9udXMgPSBcIiArIHJzLmJvbnVzO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXdXZWlnaHQgPiB3KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1dlaWdodCArPSAzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzICs9IFwiIFZlcnNjaGxlY2h0ZXJ1bmcgPT4gU3RyYWZlIC0zISBcIjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3V2VpZ2h0IC09IHJzLmJvbnVzO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGRlbHRhVyAvPSBycy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1dlaWdodCA8IG1pbmltdW1XZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWluaW11bVdlaWdodCA9IG5ld1dlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGlyZWN0aW9uWCA9IG5keDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3RGlyZWN0aW9uWSA9IG5keTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcyArPSBcIiAtPiBuZXcgTWluaW11bSFcIjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlYnVnID09IHRydWUpIGNvbnNvbGUubG9nKHMpO1xyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoeCA9PSBhLmRlc3QueCAmJiB5ID09IGEuZGVzdC55IHx8IG5ld0RpcmVjdGlvblggPT0gMCAmJiBuZXdEaXJlY3Rpb25ZID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBmZXJ0aWcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoeCArIG5ld0RpcmVjdGlvblggPCAwIHx8IHggKyBuZXdEaXJlY3Rpb25YID4gdGhpcy5yb3V0aW5nSW5wdXQueE1heCAtIDFcclxuICAgICAgICAgICAgICAgIHx8IHkgKyBuZXdEaXJlY3Rpb25ZIDwgMCB8fCB5ICsgbmV3RGlyZWN0aW9uWSA+IHRoaXMucm91dGluZ0lucHV0LnlNYXggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICBmZXJ0aWcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCB3ZWlnaHRTdW1GaXJzdFhUaGVuWSA9IDA7XHJcbiAgICAgICAgICAgIGxldCB3ZWlnaHRTdW1GaXJzdFlUaGVuWCA9IDA7XHJcblxyXG4gICAgICAgICAgICAvLyBmaXJzdCB4IHRoZW4geVxyXG4gICAgICAgICAgICBsZXQgeG4gPSB4O1xyXG4gICAgICAgICAgICBsZXQgeW4gPSB5O1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBNYXRoLmFicyhuZXdEaXJlY3Rpb25YKTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB4biArPSBNYXRoLnNpZ24obmV3RGlyZWN0aW9uWCk7XHJcbiAgICAgICAgICAgICAgICB3ZWlnaHRTdW1GaXJzdFhUaGVuWSArPSB0aGlzLndlaWdodHNbeG5dW3luXSArIHRoaXMubG9ja3NbeG5dW3luXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBNYXRoLmFicyhuZXdEaXJlY3Rpb25ZKTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB5biArPSBNYXRoLnNpZ24obmV3RGlyZWN0aW9uWSk7XHJcbiAgICAgICAgICAgICAgICB3ZWlnaHRTdW1GaXJzdFhUaGVuWSArPSB0aGlzLndlaWdodHNbeG5dW3luXSArIHRoaXMubG9ja3NbeG5dW3luXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZmlyc3QgeSB0aGVuIHhcclxuICAgICAgICAgICAgeG4gPSB4O1xyXG4gICAgICAgICAgICB5biA9IHk7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IE1hdGguYWJzKG5ld0RpcmVjdGlvblkpOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHluICs9IE1hdGguc2lnbihuZXdEaXJlY3Rpb25ZKTtcclxuICAgICAgICAgICAgICAgIHdlaWdodFN1bUZpcnN0WVRoZW5YICs9IHRoaXMud2VpZ2h0c1t4bl1beW5dICsgdGhpcy5sb2Nrc1t4bl1beW5dO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IE1hdGguYWJzKG5ld0RpcmVjdGlvblgpOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHhuICs9IE1hdGguc2lnbihuZXdEaXJlY3Rpb25YKTtcclxuICAgICAgICAgICAgICAgIHdlaWdodFN1bUZpcnN0WVRoZW5YICs9IHRoaXMud2VpZ2h0c1t4bl1beW5dICsgdGhpcy5sb2Nrc1t4bl1beW5dO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAod2VpZ2h0U3VtRmlyc3RYVGhlblkgPD0gd2VpZ2h0U3VtRmlyc3RZVGhlblgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChuZXdEaXJlY3Rpb25YICE9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBNYXRoLmFicyhuZXdEaXJlY3Rpb25YKTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbmRzSW5BcnJvdyAhPSBudWxsKSBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgeCArPSBNYXRoLnNpZ24obmV3RGlyZWN0aW9uWCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9ja3NbeF1beV0gKz0gbG9ja1dlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kc0luQXJyb3cgPSB0aGlzLmFkZFBvaW50KHgsIHksIGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBkeCA9IE1hdGguc2lnbihuZXdEaXJlY3Rpb25YKTsgZHkgPSAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKG5ld0RpcmVjdGlvblggKiBuZXdEaXJlY3Rpb25ZICE9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvY2tzW3hdW3ldICs9IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobmV3RGlyZWN0aW9uWSAhPSAwICYmIGVuZHNJbkFycm93ID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8PSBNYXRoLmFicyhuZXdEaXJlY3Rpb25ZKTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbmRzSW5BcnJvdyAhPSBudWxsKSBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgeSArPSBNYXRoLnNpZ24obmV3RGlyZWN0aW9uWSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9ja3NbeF1beV0gKz0gbG9ja1dlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kc0luQXJyb3cgPSB0aGlzLmFkZFBvaW50KHgsIHksIGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBkeCA9IDA7IGR5ID0gTWF0aC5zaWduKG5ld0RpcmVjdGlvblkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gTWF0aC5hYnMobmV3RGlyZWN0aW9uWSk7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmRzSW5BcnJvdyAhPSBudWxsKSBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB5ICs9IE1hdGguc2lnbihuZXdEaXJlY3Rpb25ZKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvY2tzW3hdW3ldICs9IGxvY2tXZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5kc0luQXJyb3cgPSB0aGlzLmFkZFBvaW50KHgsIHksIGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5sb2Nrc1t4XVt5XSArPSAxO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gTWF0aC5hYnMobmV3RGlyZWN0aW9uWCk7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmRzSW5BcnJvdyAhPSBudWxsKSBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB4ICs9IE1hdGguc2lnbihuZXdEaXJlY3Rpb25YKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvY2tzW3hdW3ldICs9IGxvY2tXZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5kc0luQXJyb3cgPSB0aGlzLmFkZFBvaW50KHgsIHksIGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZHkgPSAwOyBkeCA9IE1hdGguc2lnbihuZXdEaXJlY3Rpb25YKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGEucG9pbnRzLmxlbmd0aCA+IDEwMDAgfHwgYS5wb2ludHMubGVuZ3RoID09IGxhc3RMZW5ndGgpIGZlcnRpZyA9IHRydWU7XHJcbiAgICAgICAgICAgIGxhc3RMZW5ndGggPSBhLnBvaW50cy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICBpZiAoZW5kc0luQXJyb3cgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZmVydGlnID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChlbmRzSW5BcnJvdyA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkUG9pbnQoeCwgeSwgYSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhLm1pbmltYWxQb2ludHMgPSBbXTtcclxuICAgICAgICBpZiAoYS5wb2ludHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBsZXQgbGFzdEVkZ2UgPSBhLnBvaW50c1swXTtcclxuICAgICAgICAgICAgYS5taW5pbWFsUG9pbnRzLnB1c2gobGFzdEVkZ2UpO1xyXG4gICAgICAgICAgICBsZXQgbGFzdFBvaW50ID0gYS5wb2ludHNbMF07XHJcbiAgICAgICAgICAgIGxldCBpID0gMDtcclxuICAgICAgICAgICAgZm9yIChsZXQgcCBvZiBhLnBvaW50cykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHAueCAhPSBsYXN0RWRnZS54ICYmIHAueSAhPSBsYXN0RWRnZS55IHx8IGkgPT0gYS5wb2ludHMubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGEubWluaW1hbFBvaW50cy5wdXNoKGxhc3RQb2ludCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdEVkZ2UgPSBsYXN0UG9pbnQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsYXN0UG9pbnQgPSBwO1xyXG4gICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGEubWluaW1hbFBvaW50cy5wdXNoKGxhc3RQb2ludCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZW5kc0luQXJyb3cgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBhLmVuZHNPbkFycm93V2l0aElkZW50aWZpZXIgPSBlbmRzSW5BcnJvdy5pZGVudGlmaWVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0V2VpZ2h0KGZyb206IFBvaW50LCB0bzogUG9pbnQpOiB7IGRlc3RXZWlnaHQ6IG51bWJlciwgd2F5V2VpZ2h0OiBudW1iZXIsIGZpcnN0SG9yaXpvbnRhbDogYm9vbGVhbiB9IHtcclxuXHJcbiAgICAgICAgbGV0IGR4ID0gdG8ueCAtIGZyb20ueDtcclxuICAgICAgICBsZXQgZHkgPSB0by55IC0gZnJvbS55O1xyXG5cclxuICAgICAgICBsZXQgbGVuZ3RoID0gTWF0aC5hYnMoZHgpICsgTWF0aC5hYnMoZHkpO1xyXG5cclxuICAgICAgICBsZXQgd2VpZ2h0Rmlyc3RIb3Jpem9udGFsID0gMDtcclxuICAgICAgICBsZXQgd2VpZ2h0Rmlyc3RWZXJ0aWNhbCA9IDA7XHJcblxyXG4gICAgICAgIGxldCB4ID0gZnJvbS54O1xyXG4gICAgICAgIGxldCB5ID0gZnJvbS55O1xyXG4gICAgICAgIGZvciAobGV0IGRlbHRhID0gMTsgZGVsdGEgPD0gTWF0aC5hYnMoZHgpOyBkZWx0YSsrKSB7XHJcbiAgICAgICAgICAgIHggKz0gTWF0aC5zaWduKGR4KTtcclxuICAgICAgICAgICAgbGV0IHcgPSB0aGlzLndlaWdodHNbeF1beV07XHJcbiAgICAgICAgICAgIGxldCBsID0gdGhpcy5sb2Nrc1t4XVt5XTtcclxuICAgICAgICAgICAgd2VpZ2h0Rmlyc3RIb3Jpem9udGFsICs9IGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGRlbHRhID0gMTsgZGVsdGEgPD0gTWF0aC5hYnMoZHkpOyBkZWx0YSsrKSB7XHJcbiAgICAgICAgICAgIHkgKz0gTWF0aC5zaWduKGR5KTtcclxuICAgICAgICAgICAgbGV0IHcgPSB0aGlzLndlaWdodHNbeF1beV07XHJcbiAgICAgICAgICAgIGxldCBsID0gdGhpcy5sb2Nrc1t4XVt5XTtcclxuICAgICAgICAgICAgd2VpZ2h0Rmlyc3RIb3Jpem9udGFsICs9IGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB4ID0gZnJvbS54O1xyXG4gICAgICAgIHkgPSBmcm9tLnk7XHJcbiAgICAgICAgZm9yIChsZXQgZGVsdGEgPSAxOyBkZWx0YSA8PSBNYXRoLmFicyhkeSk7IGRlbHRhKyspIHtcclxuICAgICAgICAgICAgeSArPSBNYXRoLnNpZ24oZHkpO1xyXG4gICAgICAgICAgICBsZXQgdyA9IHRoaXMud2VpZ2h0c1t4XVt5XTtcclxuICAgICAgICAgICAgbGV0IGwgPSB0aGlzLmxvY2tzW3hdW3ldO1xyXG4gICAgICAgICAgICB3ZWlnaHRGaXJzdFZlcnRpY2FsICs9IGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGRlbHRhID0gMTsgZGVsdGEgPD0gTWF0aC5hYnMoZHgpOyBkZWx0YSsrKSB7XHJcbiAgICAgICAgICAgIHggKz0gTWF0aC5zaWduKGR4KTtcclxuICAgICAgICAgICAgbGV0IHcgPSB0aGlzLndlaWdodHNbeF1beV07XHJcbiAgICAgICAgICAgIGxldCBsID0gdGhpcy5sb2Nrc1t4XVt5XTtcclxuICAgICAgICAgICAgd2VpZ2h0Rmlyc3RWZXJ0aWNhbCArPSBsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGZpcnN0SG9yaXpvbnRhbCA9IHdlaWdodEZpcnN0SG9yaXpvbnRhbCA8IHdlaWdodEZpcnN0VmVydGljYWw7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHdheVdlaWdodDogZmlyc3RIb3Jpem9udGFsID8gd2VpZ2h0Rmlyc3RIb3Jpem9udGFsIDogd2VpZ2h0Rmlyc3RWZXJ0aWNhbCxcclxuICAgICAgICAgICAgZmlyc3RIb3Jpem9udGFsOiBmaXJzdEhvcml6b250YWwsXHJcbiAgICAgICAgICAgIGRlc3RXZWlnaHQ6IHRoaXMud2VpZ2h0c1t0by54XVt0by55XSArIHRoaXMubG9ja3NbdG8ueF1bdG8ueV1cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgZGlzdCh4MTogbnVtYmVyLCB5MTogbnVtYmVyLCB4MjogbnVtYmVyLCB5MjogbnVtYmVyKSB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCgoeDEgLSB4MikgKiAoeDEgLSB4MikgKyAoeTEgLSB5MikgKiAoeTEgLSB5MikpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG59Il19