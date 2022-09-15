import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { InterpreterState } from "../../interpreter/Interpreter.js";
import { ColorHelper } from "./ColorHelper.js";
import { FilledShapeDefaults } from "./FilledShapeDefaults.js";
export class WorldClass extends Klass {
    constructor(module) {
        super("World", module, "Grafische Zeichenfläche mit Koordinatensystem");
        this.module = module;
        this.setBaseClass(module.typeStore.getType("Object"));
        let groupType = module.typeStore.getType("Group");
        let shapeType = module.typeStore.getType("Shape");
        let mouseListenerType = module.typeStore.getType("MouseListener");
        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));
        this.addMethod(new Method("World", new Parameterlist([
            { identifier: "breite", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "höhe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let breite = parameters[1].value;
            let höhe = parameters[2].value;
            let gh = this.getWorldHelper(o, breite, höhe); //new WorldHelper(breite, höhe, this.module, o);
            o.intrinsicData["World"] = gh;
        }, false, false, "Legt einen neuen Grafikbereich (='Welt') an", true));
        this.addMethod(new Method("World", new Parameterlist([]), null, (parameters) => {
            let o = parameters[0].value;
            let gh = this.getWorldHelper(o); // new WorldHelper(800, 600, this.module, o);
            o.intrinsicData["World"] = gh;
        }, false, false, "Legt einen neuen Grafikbereich (='Welt') an. Das Koordinatensystem geht von 0 bis 800 in x-Richtung und von 0 - 600 in y-Richtung.", true));
        this.addMethod(new Method("setBackgroundColor", new Parameterlist([
            { identifier: "colorAsRGBInt", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let color = parameters[1].value;
            let wh = o.intrinsicData["World"];
            wh.setBackgroundColor(color);
        }, false, false, 'Setzt die Hintergrundfarbe. Die Farbe wird als integer-Zahl erwartet. Am besten schreibt man sie als Hexadezimalzahl, also z.B. setBackgroundColor(0xff8080)."', false));
        this.addMethod(new Method("setBackgroundColor", new Parameterlist([
            { identifier: "colorAsRGBAString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let color = parameters[1].value;
            let wh = o.intrinsicData["World"];
            wh.setBackgroundColor(color);
        }, false, false, 'Setzt die Hintergrundfarbe. Die Farbe ist entweder eine vordefinierte Farbe ("schwarz", "rot", ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)"', false));
        this.addMethod(new Method("move", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let x = parameters[1].value;
            let y = parameters[2].value;
            let wh = o.intrinsicData["World"];
            let matrix = new PIXI.Matrix().copyFrom(wh.stage.projectionTransform);
            wh.stage.projectionTransform.identity();
            wh.stage.projectionTransform.translate(x, y);
            wh.stage.projectionTransform.prepend(matrix);
            wh.computeCurrentWorldBounds();
            wh.shapesNotAffectedByWorldTransforms.forEach((shape) => shape.move(-x, -y));
        }, false, false, 'Verschiebt alle Objekte der Welt um x nach rechts und y nach unten.', false));
        this.addMethod(new Method("follow", new Parameterlist([
            { identifier: "shape", type: shapeType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "margin", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "xMin", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "xMax", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "yMin", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "yMax", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let shape = parameters[1].value;
            let frameWidth = parameters[2].value;
            let xMin = parameters[3].value;
            let xMax = parameters[4].value;
            let yMin = parameters[5].value;
            let yMax = parameters[6].value;
            let wh = o.intrinsicData["World"];
            let shapeHelper = shape.intrinsicData["Actor"];
            let moveX = 0;
            let moveY = 0;
            let shapeX = shapeHelper.getCenterX();
            let shapeY = shapeHelper.getCenterY();
            let outsideRight = shapeX - (wh.currentLeft + wh.currentWidth - frameWidth);
            if (outsideRight > 0 && wh.currentLeft + wh.currentWidth < xMax) {
                moveX = -outsideRight;
            }
            let outsideLeft = (wh.currentLeft + frameWidth) - shapeX;
            if (outsideLeft > 0 && wh.currentLeft > xMin) {
                moveX = outsideLeft;
            }
            let outsideBottom = shapeY - (wh.currentTop + wh.currentHeight - frameWidth);
            if (outsideBottom > 0 && wh.currentTop + wh.currentHeight <= yMax) {
                moveY = -outsideBottom;
            }
            let outsideTop = (wh.currentTop + frameWidth) - shapeY;
            if (outsideTop > 0 && wh.currentTop >= yMin) {
                moveY = outsideTop;
            }
            if (moveX != 0 || moveY != 0) {
                let matrix = new PIXI.Matrix().copyFrom(wh.stage.projectionTransform);
                wh.stage.projectionTransform.identity();
                wh.stage.projectionTransform.translate(moveX, moveY);
                wh.stage.projectionTransform.prepend(matrix);
                wh.computeCurrentWorldBounds();
                wh.shapesNotAffectedByWorldTransforms.forEach((shape) => shape.move(-moveX, -moveY));
            }
        }, false, false, 'Verschiebt die Welt so, dass das übergebene graphische Objekt (shape) sichtbar wird. Verschoben wird nur, wenn das Objekt weniger als frameWidth vom Rand entfernt ist und die Welt nicht über die gegebenen Koordinaten xMin, xMax, yMin und yMax hinausragt.', false));
        this.addMethod(new Method("rotate", new Parameterlist([
            { identifier: "angleInDeg", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let angle = parameters[1].value;
            let x = parameters[2].value;
            let y = parameters[3].value;
            let wh = o.intrinsicData["World"];
            let angleRad = -angle / 180 * Math.PI;
            let matrix = new PIXI.Matrix().copyFrom(wh.stage.projectionTransform);
            wh.stage.projectionTransform.identity();
            wh.stage.projectionTransform.translate(-x, -y);
            wh.stage.projectionTransform.rotate(angleRad);
            wh.stage.projectionTransform.translate(x, y);
            wh.stage.projectionTransform.prepend(matrix);
            wh.computeCurrentWorldBounds();
            wh.shapesNotAffectedByWorldTransforms.forEach((shape) => {
                shape.rotate(-angle, x, y);
            });
        }, false, false, 'Rotiert die Welt um den angegebenen Winkel im Urzeigersinn. Drehpunkt ist der Punkt (x/y).', false));
        this.addMethod(new Method("scale", new Parameterlist([
            { identifier: "factor", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let factor = parameters[1].value;
            let x = parameters[2].value;
            let y = parameters[3].value;
            let wh = o.intrinsicData["World"];
            let matrix = new PIXI.Matrix().copyFrom(wh.stage.projectionTransform);
            wh.stage.projectionTransform.identity();
            wh.stage.projectionTransform.translate(-x, -y);
            wh.stage.projectionTransform.scale(factor, factor);
            wh.stage.projectionTransform.translate(x, y);
            wh.stage.projectionTransform.prepend(matrix);
            wh.computeCurrentWorldBounds();
            wh.shapesNotAffectedByWorldTransforms.forEach((shape) => shape.scale(1 / factor, x, y));
        }, false, false, 'Streckt die Welt um den angegebenen Faktor. Zentrum der Streckung ist (x/y).', false));
        this.addMethod(new Method("setCoordinateSystem", new Parameterlist([
            { identifier: "left", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "top", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "height", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let left = parameters[1].value;
            let top = parameters[2].value;
            let width = parameters[3].value;
            let height = parameters[4].value;
            let wh = o.intrinsicData["World"];
            wh.stage.projectionTransform.identity(); // coordinate system (0/0) to (initialWidth/initialHeight)
            wh.stage.projectionTransform.translate(-left, -top);
            wh.stage.projectionTransform.scale(wh.initialWidth / width, wh.initialHeight / height);
            wh.computeCurrentWorldBounds();
            wh.shapesNotAffectedByWorldTransforms.forEach((shape) => {
                shape.scale(width / wh.initialWidth, left, top);
                shape.move(left, top);
            });
        }, false, false, 'Streckt die Welt um den angegebenen Faktor. Zentrum der Streckung ist (x/y).', false));
        this.addMethod(new Method("setDefaultGroup", new Parameterlist([
            { identifier: "group", type: groupType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let group = parameters[1].value;
            let wh = o.intrinsicData["World"];
            wh.defaultGroup = group == null ? null : group.intrinsicData["Actor"];
        }, false, false, 'Legt eine Gruppe fest, zu der ab jetzt alle neuen Objekte automatisch hinzugefügt werden. Falls null angegeben wird, werden neue Objekte zu keiner Gruppe automatisch hinzugefügt.', false));
        this.addMethod(new Method("addMouseListener", new Parameterlist([
            { identifier: "listener", type: mouseListenerType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let listener = parameters[1].value;
            let wh = o.intrinsicData["World"];
            wh.addMouseListener(listener);
        }, false, false, 'Fügt einen neuen MouseListener hinzu, dessen Methoden bei Mausereignissen aufgerufen werden.', false));
        this.addMethod(new Method("getWidth", new Parameterlist([]), intPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let wh = o.intrinsicData["World"];
            return Math.round(wh.currentWidth);
        }, false, false, 'Gibt die "Breite" des Grafikbereichs zurück, genauer: die x-Koordinate am rechten Rand.', false));
        this.addMethod(new Method("getHeight", new Parameterlist([]), intPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let wh = o.intrinsicData["World"];
            return Math.round(wh.currentHeight);
        }, false, false, 'Gibt die "Höhe" des Grafikbereichs zurück, genauer: die y-Koordinate am unteren Rand.', false));
        this.addMethod(new Method("getTop", new Parameterlist([]), intPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let wh = o.intrinsicData["World"];
            return Math.round(wh.currentTop);
        }, false, false, 'Gibt die y-Koordinate der linken oberen Ecke zurück.', false));
        this.addMethod(new Method("getLeft", new Parameterlist([]), intPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let wh = o.intrinsicData["World"];
            return Math.round(wh.currentLeft);
        }, false, false, 'Gibt die x-Koordinate der linken oberen Ecke zurück.', false));
        this.addMethod(new Method("setCursor", new Parameterlist([
            { identifier: "cursor", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let wh = o.intrinsicData["World"];
            let cursor = parameters[1].value;
            wh.setCursor(cursor);
        }, false, false, 'Ändert die Form des Mauscursors im gesamten Grafikbereich. Mögiche Werte: siehe https://developer.mozilla.org/de/docs/Web/CSS/cursor.', false));
    }
    getWorldHelper(worldObject, breite = 800, höhe = 600) {
        var _a, _b, _c, _d;
        let wh = (_c = (_b = (_a = this.module) === null || _a === void 0 ? void 0 : _a.main) === null || _b === void 0 ? void 0 : _b.getInterpreter()) === null || _c === void 0 ? void 0 : _c.worldHelper;
        if (wh != null) {
            if (wh.width != breite || wh.height != höhe) {
                let ratio = Math.round(höhe / breite * 100);
                wh.$containerOuter.css('padding-bottom', ratio + "%");
                wh.stage.projectionTransform.scale(wh.width / breite, wh.width / höhe);
                (_d = this.module.main.getRightDiv()) === null || _d === void 0 ? void 0 : _d.adjustWidthToWorld();
            }
            return wh;
        }
        else {
            return new WorldHelper(breite, höhe, this.module, worldObject);
        }
    }
}
/**
 * @see https://javascript.plainenglish.io/inside-pixijs-projection-system-897872a3dc17
 */
class WorldContainer extends PIXI.Container {
    constructor(sourceFrame, destinationFrame) {
        super();
        this.sourceFrame = sourceFrame;
        this.destinationFrame = destinationFrame;
        this.projectionTransform = new PIXI.Matrix();
    }
    render(renderer) {
        renderer.projection.projectionMatrix.identity();
        renderer.projection.transform = this.projectionTransform;
        renderer.renderTexture.bind(renderer.renderTexture.current, this.sourceFrame, this.destinationFrame);
        super.render(renderer);
        renderer.batch.flush();
        renderer.batch.flush();
        renderer.projection.projectionMatrix.identity();
        renderer.projection.transform = null;
        renderer.renderTexture.bind(null);
    }
}
export class WorldHelper {
    constructor(width, height, module, world) {
        var _a, _b, _c;
        this.width = width;
        this.height = height;
        this.module = module;
        this.world = world;
        this.actActors = [];
        this.keyPressedActors = [];
        this.keyUpActors = [];
        this.keyDownActors = [];
        this.actorHelpersToDestroy = [];
        this.mouseListenerShapes = [];
        this.mouseListeners = [];
        this.actorsFinished = true;
        this.summedDelta = 0;
        this.scaledTextures = {};
        this.shapes = []; // all shapes incl. groups that aren't part of a group
        this.shapesNotAffectedByWorldTransforms = [];
        this.actorsNotFinished = 0;
        this.ticks = 0;
        this.deltaSum = 0;
        this.spriteAnimations = [];
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
        PIXI.settings.TARGET_FPMS = 30.0 / 1000.0;
        this.globalScale = 1;
        while (height > 1000 || width > 2000) {
            this.globalScale *= 2;
            height /= 2;
            width /= 2;
        }
        this.initialHeight = this.height;
        this.initialWidth = this.width;
        this.currentLeft = 0;
        this.currentTop = 0;
        this.currentWidth = this.width;
        this.currentHeight = this.height;
        this.interpreter = (_b = (_a = this.module) === null || _a === void 0 ? void 0 : _a.main) === null || _b === void 0 ? void 0 : _b.getInterpreter();
        if (this.interpreter.processingHelper != null) {
            this.interpreter.throwException("Die herkömmliche Grafikausgabe kann nicht zusammen mit Processing genutzt werden.");
        }
        if (this.interpreter.worldHelper != null) {
            this.interpreter.throwException("Es darf nur ein World-Objekt instanziert werden.");
        }
        this.interpreter.worldHelper = this;
        let $graphicsDiv = this.module.main.getInterpreter().printManager.getGraphicsDiv();
        this.$coordinateDiv = this.module.main.getRightDiv().$rightDiv.find(".jo_coordinates");
        let f = () => {
            let $jo_tabs = $graphicsDiv.parents(".jo_tabs");
            if ($jo_tabs.length == 0) {
                $jo_tabs = $graphicsDiv.parents(".joe_rightDivInner");
            }
            let maxWidth = $jo_tabs.width();
            let maxHeight = $jo_tabs.height();
            if (height / width > maxHeight / maxWidth) {
                $graphicsDiv.css({
                    'width': width / height * maxHeight + "px",
                    'height': maxHeight + "px",
                });
            }
            else {
                $graphicsDiv.css({
                    'height': height / width * maxWidth + "px",
                    'width': maxWidth + "px",
                });
            }
        };
        $graphicsDiv.off('sizeChanged');
        $graphicsDiv.on('sizeChanged', f);
        f();
        this.$containerOuter = jQuery('<div></div>');
        this.$containerInner = jQuery('<div></div>');
        this.$containerOuter.append(this.$containerInner);
        $graphicsDiv.append(this.$containerOuter);
        $graphicsDiv.show();
        $graphicsDiv[0].oncontextmenu = function (e) {
            e.preventDefault();
        };
        if (this.module.main.pixiApp) {
            this.app = this.module.main.pixiApp;
            this.app.renderer.resize(width, height);
            this.app.renderer.backgroundColor = 0x0;
        }
        else {
            this.app = new PIXI.Application({
                antialias: true,
                width: width, height: height,
            });
            this.module.main.pixiApp = this.app;
        }
        let that = this;
        this.tickerFunction = (delta) => {
            that.tick(PIXI.Ticker.shared.elapsedMS);
        };
        this.app.ticker.add(this.tickerFunction);
        this.app.ticker.maxFPS = 30;
        this.interpreter.timerExtern = true;
        let sourceFrame = new PIXI.Rectangle(0, 0, this.width, this.height);
        let destinationFrame = new PIXI.Rectangle(0, 0, width, height);
        this.stage = new WorldContainer(sourceFrame, destinationFrame);
        this.stage.projectionTransform = new PIXI.Matrix();
        this.app.stage.addChild(this.stage);
        this.$containerInner.append(this.app.view);
        this.interpreter.keyboardTool.keyPressedCallbacks.push((key) => {
            for (let kpa of that.keyPressedActors) {
                that.runActorWhenKeyEvent(kpa, key);
            }
        });
        this.interpreter.keyboardTool.keyUpCallbacks.push((key) => {
            for (let kpa of that.keyUpActors) {
                that.runActorWhenKeyEvent(kpa, key);
            }
        });
        this.interpreter.keyboardTool.keyDownCallbacks.push((key) => {
            for (let kpa of that.keyDownActors) {
                that.runActorWhenKeyEvent(kpa, key);
            }
        });
        for (let listenerType of ["mouseup", "mousedown", "mousemove", "mouseenter", "mouseleave"]) {
            let eventType = listenerType;
            if (window.PointerEvent) {
                eventType = eventType.replace('mouse', 'pointer');
            }
            this.$containerInner.on(eventType, (e) => {
                let x = width * e.offsetX / this.$containerInner.width();
                let y = height * e.offsetY / this.$containerInner.height();
                let p = new PIXI.Point(x * this.globalScale, y * this.globalScale);
                this.stage.projectionTransform.applyInverse(p, p);
                x = p.x;
                y = p.y;
                that.onMouseEvent(listenerType, x, y, e.button);
                for (let listener of this.mouseListeners) {
                    if (listener.types[listenerType] != null) {
                        this.invokeMouseListener(listener, listenerType, x, y, e.button);
                    }
                }
                if (listenerType == "mousedown") {
                    let gngEreignisbehandlung = this.interpreter.gngEreignisbehandlungHelper;
                    if (gngEreignisbehandlung != null) {
                        gngEreignisbehandlung.handleMouseClickedEvent(x, y);
                    }
                }
            });
        }
        let $coordinateDiv = this.$coordinateDiv;
        let mousePointer = window.PointerEvent ? "pointer" : "mouse";
        this.$containerInner.on(mousePointer + "move", (e) => {
            let x = width * e.offsetX / this.$containerInner.width();
            let y = height * e.offsetY / this.$containerInner.height();
            let p = new PIXI.Point(x * this.globalScale, y * this.globalScale);
            this.stage.projectionTransform.applyInverse(p, p);
            x = Math.round(p.x);
            y = Math.round(p.y);
            $coordinateDiv.text(`(${x}/${y})`);
        });
        this.$containerInner.on(mousePointer + "enter", (e) => {
            $coordinateDiv.show();
        });
        this.$containerInner.on(mousePointer + "leave", (e) => {
            $coordinateDiv.hide();
        });
        (_c = this.module.main.getRightDiv()) === null || _c === void 0 ? void 0 : _c.adjustWidthToWorld();
    }
    clearActorLists() {
        this.actActors = [];
        this.keyPressedActors = [];
        this.keyUpActors = [];
        this.keyDownActors = [];
    }
    computeCurrentWorldBounds() {
        let p1 = new PIXI.Point(0, 0);
        this.stage.projectionTransform.applyInverse(p1, p1);
        let p2 = new PIXI.Point(this.initialWidth, this.initialHeight);
        this.stage.projectionTransform.applyInverse(p2, p2);
        this.currentLeft = p1.x;
        this.currentTop = p1.y;
        this.currentWidth = Math.abs(p2.x - p1.x);
        this.currentHeight = Math.abs(p2.y - p1.y);
    }
    hasActors() {
        return this.actActors.length > 0 || this.keyPressedActors.length > 0 || this.keyUpActors.length > 0
            || this.keyDownActors.length > 0 || this.mouseListeners.length > 0 || this.mouseListenerShapes.length > 0;
    }
    setAllHitpolygonsDirty() {
        for (let shape of this.shapes) {
            shape.setHitPolygonDirty(true);
        }
    }
    setCursor(cursor) {
        this.$containerInner.css('cursor', cursor);
    }
    tick(delta) {
        var _a;
        if (this.interpreter != null) {
            switch (this.interpreter.state) {
                case InterpreterState.running:
                    this.summedDelta += delta;
                    for (let spriteHelper of this.spriteAnimations) {
                        spriteHelper.tick(delta);
                    }
                    if (!this.actorsFinished) {
                        this.actorsNotFinished++;
                        break;
                    }
                    if (this.interpreter.pauseUntil != null) {
                        break;
                    }
                    let first = true;
                    for (let actorData of this.actActors) {
                        let actorHelper = actorData.actorHelper;
                        if (actorHelper.timerPaused || actorHelper.isDestroyed)
                            continue;
                        let program = (_a = actorData.method) === null || _a === void 0 ? void 0 : _a.program;
                        this.runActor(first, actorData, this.summedDelta);
                        if (program != null && !actorData.actorHelper.isDestroyed) {
                            first = false;
                            this.actorsFinished = false;
                        }
                    }
                    break;
                case InterpreterState.done:
                case InterpreterState.error:
                case InterpreterState.not_initialized:
                    this.clearActorLists();
                    break;
            }
            this.summedDelta = 0;
            if (this.interpreter.state == InterpreterState.running) {
                if (this.actActors.length > 0) {
                    this.interpreter.timerFunction(33.33, true, 0.5);
                    //@ts-ignore
                    if (this.interpreter.state == InterpreterState.running) {
                        this.interpreter.timerStopped = false;
                        this.interpreter.timerFunction(33.33, false, 0.08);
                    }
                }
                else {
                    this.interpreter.timerFunction(33.33, false, 0.7);
                }
            }
        }
        while (this.actorHelpersToDestroy.length > 0) {
            let actorHelper = this.actorHelpersToDestroy.pop();
            for (let actorList of [this.keyPressedActors, this.keyUpActors, this.keyDownActors]) {
                for (let i = 0; i < actorList.length; i++) {
                    if (actorList[i].actorHelper === actorHelper) {
                        actorList.splice(i, 1);
                        i--;
                    }
                }
            }
            for (let i = 0; i < this.mouseListenerShapes.length; i++) {
                if (this.mouseListenerShapes[i].shapeHelper === actorHelper) {
                    this.mouseListenerShapes.splice(i, 1);
                    i--;
                }
            }
            for (let i = 0; i < this.actActors.length; i++) {
                if (this.actActors[i].actorHelper === actorHelper) {
                    this.actActors.splice(i, 1);
                    i--;
                }
            }
            let displayObject = actorHelper.displayObject;
            if (displayObject != null) {
                displayObject.destroy();
                actorHelper.displayObject = null;
            }
        }
    }
    setBackgroundColor(color) {
        if (typeof color == "string") {
            let c = ColorHelper.parseColorToOpenGL(color);
            this.app.renderer.backgroundColor = c.color;
        }
        else {
            this.app.renderer.backgroundColor = color;
        }
    }
    runActorWhenKeyEvent(actorData, key) {
        var _a, _b;
        let program = (_a = actorData.method) === null || _a === void 0 ? void 0 : _a.program;
        let invoke = (_b = actorData.method) === null || _b === void 0 ? void 0 : _b.invoke;
        let rto = actorData.actorHelper.runtimeObject;
        let stackElements = [
            {
                type: rto.class,
                value: rto
            },
            {
                type: stringPrimitiveType,
                value: key
            }
        ];
        if (program != null) {
            this.interpreter.runTimer(actorData.method, stackElements, null, false);
        }
        else if (invoke != null) {
            invoke([]);
        }
    }
    runActor(first, actorData, delta) {
        var _a, _b;
        let program = (_a = actorData.method) === null || _a === void 0 ? void 0 : _a.program;
        let invoke = (_b = actorData.method) === null || _b === void 0 ? void 0 : _b.invoke;
        let rto = actorData.actorHelper.runtimeObject;
        let stackElements = [
            {
                type: rto.class,
                value: rto
            },
        ];
        if (actorData.method.getParameterCount() > 0) {
            stackElements.push({
                type: doublePrimitiveType,
                value: delta
            });
        }
        let that = this;
        if (program != null) {
            this.interpreter.runTimer(actorData.method, stackElements, first ? (interpreter) => {
                that.actorsFinished = true;
                interpreter.timerStopped = true;
            } : null, true);
        }
        else if (invoke != null) {
            invoke([]);
        }
    }
    cacheAsBitmap() {
        let hasRobot = this.robotWorldHelper != null;
        this.mouseListenerShapes = [];
        let scaleMin = 1.0;
        if (this.currentWidth * this.currentHeight > 2500000)
            scaleMin = Math.sqrt(2500000 / (this.currentWidth * this.currentHeight));
        if (this.currentWidth * this.currentHeight < 1024 * 1024)
            scaleMin = Math.sqrt(1024 * 1024 / (this.currentWidth * this.currentHeight));
        const brt = new PIXI.BaseRenderTexture({
            scaleMode: PIXI.SCALE_MODES.LINEAR,
            width: Math.round(this.currentWidth * scaleMin),
            height: Math.round(this.currentHeight * scaleMin)
        });
        let rt = new PIXI.RenderTexture(brt);
        let transform = new PIXI.Matrix().scale(scaleMin, scaleMin);
        setTimeout(() => {
            if (!hasRobot) {
                this.app.renderer.render(this.stage, {
                    renderTexture: rt,
                    transform: transform
                });
                setTimeout(() => {
                    this.stage.children.forEach(c => c.destroy());
                    this.stage.removeChildren();
                    let sprite = new PIXI.Sprite(rt);
                    sprite.localTransform.scale(this.globalScale, this.globalScale);
                    // debugger;
                    // sprite.localTransform.translate(0, rt.height);
                    //@ts-ignore
                    sprite.transform.onChange();
                    // this.stage.projectionTransform = new PIXI.Matrix().scale(1, -1).translate(0, this.currentHeight);
                    this.stage.projectionTransform = new PIXI.Matrix();
                    this.stage.addChild(sprite);
                }, 300);
            }
        }, 150); // necessary to await Turtle's deferred rendering
    }
    destroyWorld() {
        for (let listenerType of ["mouseup", "mousedown", "mousemove", "mouseenter", "mouseleave"]) {
            this.$containerInner.off(listenerType);
        }
        this.spriteAnimations = [];
        this.app.ticker.remove(this.tickerFunction);
        this.app.stage.children.forEach(c => c.destroy());
        this.app.stage.removeChildren();
        if (this.robotWorldHelper != null) {
            this.robotWorldHelper.destroy();
            this.robotWorldHelper = null;
        }
        jQuery(this.app.view).detach();
        this.$containerOuter.remove();
        this.module.main.getInterpreter().printManager.getGraphicsDiv().hide();
        this.interpreter.timerExtern = false;
        this.interpreter.worldHelper = null;
        this.$coordinateDiv.hide();
        FilledShapeDefaults.initDefaultValues();
    }
    onMouseEvent(listenerType, x, y, button) {
        switch (listenerType) {
            case "mousedown":
            case "mouseup":
                for (let listener of this.mouseListenerShapes) {
                    let shapeHelper = listener.shapeHelper;
                    if (listener.types[listenerType] != null && (shapeHelper.containsPoint(x, y) || shapeHelper.trackMouseMove)) {
                        this.invokeShapeMouseListener(listener, listenerType, x, y, button);
                    }
                }
                break;
            case "mouseenter":
                for (let listener of this.mouseListenerShapes) {
                    let shapeHelper = listener.shapeHelper;
                    if (listener.types[listenerType] != null && shapeHelper.containsPoint(x, y) && !shapeHelper.mouseLastSeenInsideObject) {
                        this.invokeShapeMouseListener(listener, listenerType, x, y, button, () => {
                            shapeHelper.mouseLastSeenInsideObject = true;
                        });
                    }
                }
                break;
            case "mouseleave":
                for (let listener of this.mouseListenerShapes) {
                    let shapeHelper = listener.shapeHelper;
                    if (listener.types[listenerType] != null && shapeHelper.mouseLastSeenInsideObject) {
                        this.invokeShapeMouseListener(listener, listenerType, x, y, button, () => {
                            shapeHelper.mouseLastSeenInsideObject = false;
                        });
                    }
                }
                break;
            case "mousemove":
                for (let listener of this.mouseListenerShapes) {
                    let shapeHelper = listener.shapeHelper;
                    if (listener.types["mousemove"] != null ||
                        (listener.types["mouseenter"] != null && !shapeHelper.mouseLastSeenInsideObject) ||
                        (listener.types["mouseleave"] != null && shapeHelper.mouseLastSeenInsideObject)) {
                        let containsPoint = shapeHelper.containsPoint(x, y);
                        if ((shapeHelper.trackMouseMove || containsPoint) && listener.types["mousemove"] != null) {
                            this.invokeShapeMouseListener(listener, "mousemove", x, y, button);
                        }
                        if (containsPoint && listener.types["mouseenter"] != null && !shapeHelper.mouseLastSeenInsideObject) {
                            this.invokeShapeMouseListener(listener, "mouseenter", x, y, button, () => {
                                shapeHelper.mouseLastSeenInsideObject = true;
                            });
                        }
                        if (!containsPoint && listener.types["mouseleave"] != null && shapeHelper.mouseLastSeenInsideObject) {
                            this.invokeShapeMouseListener(listener, "mouseleave", x, y, button, () => {
                                shapeHelper.mouseLastSeenInsideObject = false;
                            });
                        }
                    }
                }
                break;
        }
    }
    invokeShapeMouseListener(listener, listenerType, x, y, button, callback) {
        if (!listener.shapeHelper.reactToMouseEventsWhenInvisible &&
            !listener.shapeHelper.displayObject.visible)
            return;
        let method = listener.methods[listenerType];
        let program = method.program;
        let invoke = method.invoke;
        let rto = listener.shapeHelper.runtimeObject;
        let stackElements = [
            {
                type: rto.class,
                value: rto
            },
            {
                type: doublePrimitiveType,
                value: x
            },
            {
                type: doublePrimitiveType,
                value: y
            }
        ];
        if (listenerType != "mousemove" && listenerType != "mouseenter" && listenerType != "mouseleave") {
            stackElements.push({
                type: intPrimitiveType,
                value: button
            });
        }
        if (program != null) {
            this.interpreter.runTimer(method, stackElements, callback, false);
        }
        else if (invoke != null) {
            invoke([]);
        }
    }
    addMouseListener(listener) {
        /*
            If a shape is registered as MouseListener of the world-object, it gets all mouse-events twice.
            => Deregister shape as mouseListenerShape and register it as mouse listener for the world object.
        */
        let index = this.mouseListenerShapes.findIndex((mls) => { return mls.shapeHelper.runtimeObject == listener; });
        if (index >= 0) {
            this.mouseListenerShapes.splice(index, 1);
        }
        let listenerTypes = [
            { identifier: "MouseUp", signature: "(double, double, int)" },
            { identifier: "MouseDown", signature: "(double, double, int)" },
            { identifier: "MouseMove", signature: "(double, double)" },
            { identifier: "MouseEnter", signature: "(double, double)" },
            { identifier: "MouseLeave", signature: "(double, double)" },
        ];
        let sd = null;
        for (let lt of listenerTypes) {
            let method = listener.class.getMethodBySignature("on" + lt.identifier + lt.signature);
            if ((method === null || method === void 0 ? void 0 : method.program) != null && method.program.statements.length > 2 || (method === null || method === void 0 ? void 0 : method.invoke) != null) {
                if (sd == null) {
                    sd = {
                        listener: listener,
                        types: {},
                        methods: {}
                    };
                    this.mouseListeners.push(sd);
                }
                sd.types[lt.identifier.toLowerCase()] = true;
                sd.methods[lt.identifier.toLowerCase()] = method;
            }
        }
    }
    invokeMouseListener(listener, listenerType, x, y, button, callback) {
        let method = listener.methods[listenerType];
        let program = method.program;
        let invoke = method.invoke;
        let rto = listener.listener;
        let stackElements = [
            {
                type: rto.class,
                value: rto
            },
            {
                type: doublePrimitiveType,
                value: x
            },
            {
                type: doublePrimitiveType,
                value: y
            }
        ];
        if (listenerType != "mousemove" && listenerType != "mouseenter" && listenerType != "mouseleave") {
            stackElements.push({
                type: intPrimitiveType,
                value: button
            });
        }
        if (program != null) {
            this.interpreter.runTimer(method, stackElements, callback, false);
        }
        else if (invoke != null) {
            invoke([]);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV29ybGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1dvcmxkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUN0RCxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsZ0JBQWdCLEVBQUUsbUJBQW1CLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQztBQUN2SSxPQUFPLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBUyxNQUFNLCtCQUErQixDQUFDO0FBQzdFLE9BQU8sRUFBZSxnQkFBZ0IsRUFBRSxNQUFNLGtDQUFrQyxDQUFDO0FBR2pGLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMvQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQU0vRCxNQUFNLE9BQU8sVUFBVyxTQUFRLEtBQUs7SUFFakMsWUFBbUIsTUFBYztRQUU3QixLQUFLLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSwrQ0FBK0MsQ0FBQyxDQUFBO1FBRnhELFdBQU0sR0FBTixNQUFNLENBQVE7UUFJN0IsSUFBSSxDQUFDLFlBQVksQ0FBUSxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBRTdELElBQUksU0FBUyxHQUFlLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzlELElBQUksU0FBUyxHQUFlLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzlELElBQUksaUJBQWlCLEdBQTJCLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBRTFGLDhKQUE4SjtRQUU5SixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksTUFB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QU0sSUFBSSxJQUFJLEVBQUU7WUFDdkIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ2Q7SUFFTCxDQUFDO0NBRUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2R1bGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBLbGFzcyB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9DbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBkb3VibGVQcmltaXRpdmVUeXBlLCBpbnRQcmltaXRpdmVUeXBlLCBzdHJpbmdQcmltaXRpdmVUeXBlLCB2b2lkUHJpbWl0aXZlVHlwZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBNZXRob2QsIFBhcmFtZXRlcmxpc3QsIFZhbHVlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL1R5cGVzLmpzXCI7XHJcbmltcG9ydCB7IEludGVycHJldGVyLCBJbnRlcnByZXRlclN0YXRlIH0gZnJvbSBcIi4uLy4uL2ludGVycHJldGVyL0ludGVycHJldGVyLmpzXCI7XHJcbmltcG9ydCB7IFJ1bnRpbWVPYmplY3QgfSBmcm9tIFwiLi4vLi4vaW50ZXJwcmV0ZXIvUnVudGltZU9iamVjdC5qc1wiO1xyXG5pbXBvcnQgeyBBY3RvckhlbHBlciB9IGZyb20gXCIuL0FjdG9yLmpzXCI7XHJcbmltcG9ydCB7IENvbG9ySGVscGVyIH0gZnJvbSBcIi4vQ29sb3JIZWxwZXIuanNcIjtcclxuaW1wb3J0IHsgRmlsbGVkU2hhcGVEZWZhdWx0cyB9IGZyb20gXCIuL0ZpbGxlZFNoYXBlRGVmYXVsdHMuanNcIjtcclxuaW1wb3J0IHsgR3JvdXBDbGFzcywgR3JvdXBIZWxwZXIgfSBmcm9tIFwiLi9Hcm91cC5qc1wiO1xyXG5pbXBvcnQgeyBNb3VzZUxpc3RlbmVySW50ZXJmYWNlIH0gZnJvbSBcIi4vTW91c2VMaXN0ZW5lci5qc1wiO1xyXG5pbXBvcnQgeyBTaGFwZUNsYXNzLCBTaGFwZUhlbHBlciB9IGZyb20gXCIuL1NoYXBlLmpzXCI7XHJcbmltcG9ydCB7IFNwcml0ZUhlbHBlciB9IGZyb20gXCIuL1Nwcml0ZS5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFdvcmxkQ2xhc3MgZXh0ZW5kcyBLbGFzcyB7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIG1vZHVsZTogTW9kdWxlKSB7XHJcblxyXG4gICAgICAgIHN1cGVyKFwiV29ybGRcIiwgbW9kdWxlLCBcIkdyYWZpc2NoZSBaZWljaGVuZmzDpGNoZSBtaXQgS29vcmRpbmF0ZW5zeXN0ZW1cIilcclxuXHJcbiAgICAgICAgdGhpcy5zZXRCYXNlQ2xhc3MoPEtsYXNzPm1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShcIk9iamVjdFwiKSk7XHJcblxyXG4gICAgICAgIGxldCBncm91cFR5cGUgPSA8R3JvdXBDbGFzcz5tb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJHcm91cFwiKTtcclxuICAgICAgICBsZXQgc2hhcGVUeXBlID0gPFNoYXBlQ2xhc3M+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiU2hhcGVcIik7XHJcbiAgICAgICAgbGV0IG1vdXNlTGlzdGVuZXJUeXBlID0gPE1vdXNlTGlzdGVuZXJJbnRlcmZhY2U+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiTW91c2VMaXN0ZW5lclwiKTtcclxuXHJcbiAgICAgICAgLy8gdGhpcy5hZGRBdHRyaWJ1dGUobmV3IEF0dHJpYnV0ZShcIlBJXCIsIGRvdWJsZVByaW1pdGl2ZVR5cGUsIChvYmplY3QpID0+IHsgcmV0dXJuIE1hdGguUEkgfSwgdHJ1ZSwgVmlzaWJpbGl0eS5wdWJsaWMsIHRydWUsIFwiRGllIEtyZWlzemFobCBQaSAoMy4xNDE1Li4uKVwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJXb3JsZFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJicmVpdGVcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJow7ZoZVwiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgYnJlaXRlOiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGjDtmhlOiBudW1iZXIgPSBwYXJhbWV0ZXJzWzJdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGdoOiBXb3JsZEhlbHBlciA9IHRoaXMuZ2V0V29ybGRIZWxwZXIobywgYnJlaXRlLCBow7ZoZSk7ICAvL25ldyBXb3JsZEhlbHBlcihicmVpdGUsIGjDtmhlLCB0aGlzLm1vZHVsZSwgbyk7XHJcbiAgICAgICAgICAgICAgICBvLmludHJpbnNpY0RhdGFbXCJXb3JsZFwiXSA9IGdoO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCBcIkxlZ3QgZWluZW4gbmV1ZW4gR3JhZmlrYmVyZWljaCAoPSdXZWx0JykgYW5cIiwgdHJ1ZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiV29ybGRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBnaDogV29ybGRIZWxwZXIgPSB0aGlzLmdldFdvcmxkSGVscGVyKG8pOyAvLyBuZXcgV29ybGRIZWxwZXIoODAwLCA2MDAsIHRoaXMubW9kdWxlLCBvKTtcclxuICAgICAgICAgICAgICAgIG8uaW50cmluc2ljRGF0YVtcIldvcmxkXCJdID0gZ2g7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsIFwiTGVndCBlaW5lbiBuZXVlbiBHcmFmaWtiZXJlaWNoICg9J1dlbHQnKSBhbi4gRGFzIEtvb3JkaW5hdGVuc3lzdGVtIGdlaHQgdm9uIDAgYmlzIDgwMCBpbiB4LVJpY2h0dW5nIHVuZCB2b24gMCAtIDYwMCBpbiB5LVJpY2h0dW5nLlwiLCB0cnVlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJzZXRCYWNrZ3JvdW5kQ29sb3JcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiY29sb3JBc1JHQkludFwiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgdm9pZFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbG9yOiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHdoOiBXb3JsZEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIldvcmxkXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIHdoLnNldEJhY2tncm91bmRDb2xvcihjb2xvcik7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdTZXR6dCBkaWUgSGludGVyZ3J1bmRmYXJiZS4gRGllIEZhcmJlIHdpcmQgYWxzIGludGVnZXItWmFobCBlcndhcnRldC4gQW0gYmVzdGVuIHNjaHJlaWJ0IG1hbiBzaWUgYWxzIEhleGFkZXppbWFsemFobCwgYWxzbyB6LkIuIHNldEJhY2tncm91bmRDb2xvcigweGZmODA4MCkuXCInLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwic2V0QmFja2dyb3VuZENvbG9yXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImNvbG9yQXNSR0JBU3RyaW5nXCIsIHR5cGU6IHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29sb3I6IHN0cmluZyA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgd2g6IFdvcmxkSGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiV29ybGRcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgd2guc2V0QmFja2dyb3VuZENvbG9yKGNvbG9yKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ1NldHp0IGRpZSBIaW50ZXJncnVuZGZhcmJlLiBEaWUgRmFyYmUgaXN0IGVudHdlZGVyIGVpbmUgdm9yZGVmaW5pZXJ0ZSBGYXJiZSAoXCJzY2h3YXJ6XCIsIFwicm90XCIsIC4uLikgb2RlciBlaW5lIGNzcy1GYXJiZSBkZXIgQXJ0IFwiI2ZmYTdiM1wiIChvaG5lIGFscGhhKSwgXCIjZmZhN2IzODBcIiAobWl0IGFscGhhKSwgXCJyZ2IoMTcyLCAyMiwgMTgpXCIgb2RlciBcInJnYmEoMTIzLCAyMiwxOCwgMC4zKVwiJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIm1vdmVcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwieFwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInlcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgXSksIHZvaWRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB4OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHk6IG51bWJlciA9IHBhcmFtZXRlcnNbMl0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgd2g6IFdvcmxkSGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiV29ybGRcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG1hdHJpeCA9IG5ldyBQSVhJLk1hdHJpeCgpLmNvcHlGcm9tKHdoLnN0YWdlLnByb2plY3Rpb25UcmFuc2Zvcm0pO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UucHJvamVjdGlvblRyYW5zZm9ybS5pZGVudGl0eSgpO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UucHJvamVjdGlvblRyYW5zZm9ybS50cmFuc2xhdGUoeCwgeSk7XHJcbiAgICAgICAgICAgICAgICB3aC5zdGFnZS5wcm9qZWN0aW9uVHJhbnNmb3JtLnByZXBlbmQobWF0cml4KTtcclxuXHJcbiAgICAgICAgICAgICAgICB3aC5jb21wdXRlQ3VycmVudFdvcmxkQm91bmRzKCk7XHJcbiAgICAgICAgICAgICAgICB3aC5zaGFwZXNOb3RBZmZlY3RlZEJ5V29ybGRUcmFuc2Zvcm1zLmZvckVhY2goKHNoYXBlKSA9PiBzaGFwZS5tb3ZlKC14LCAteSkpO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnVmVyc2NoaWVidCBhbGxlIE9iamVrdGUgZGVyIFdlbHQgdW0geCBuYWNoIHJlY2h0cyB1bmQgeSBuYWNoIHVudGVuLicsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJmb2xsb3dcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwic2hhcGVcIiwgdHlwZTogc2hhcGVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIm1hcmdpblwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInhNaW5cIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ4TWF4XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwieU1pblwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInlNYXhcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgdm9pZFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoYXBlOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBmcmFtZVdpZHRoOiBudW1iZXIgPSBwYXJhbWV0ZXJzWzJdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHhNaW46IG51bWJlciA9IHBhcmFtZXRlcnNbM10udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgeE1heDogbnVtYmVyID0gcGFyYW1ldGVyc1s0XS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB5TWluOiBudW1iZXIgPSBwYXJhbWV0ZXJzWzVdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHlNYXg6IG51bWJlciA9IHBhcmFtZXRlcnNbNl0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgd2g6IFdvcmxkSGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiV29ybGRcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHNoYXBlSGVscGVyOiBTaGFwZUhlbHBlciA9IHNoYXBlLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbW92ZVg6IG51bWJlciA9IDA7XHJcbiAgICAgICAgICAgICAgICBsZXQgbW92ZVk6IG51bWJlciA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHNoYXBlWDogbnVtYmVyID0gc2hhcGVIZWxwZXIuZ2V0Q2VudGVyWCgpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoYXBlWTogbnVtYmVyID0gc2hhcGVIZWxwZXIuZ2V0Q2VudGVyWSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvdXRzaWRlUmlnaHQgPSBzaGFwZVggLSAod2guY3VycmVudExlZnQgKyB3aC5jdXJyZW50V2lkdGggLSBmcmFtZVdpZHRoKTtcclxuICAgICAgICAgICAgICAgIGlmIChvdXRzaWRlUmlnaHQgPiAwICYmIHdoLmN1cnJlbnRMZWZ0ICsgd2guY3VycmVudFdpZHRoIDwgeE1heCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vdmVYID0gLW91dHNpZGVSaWdodDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgb3V0c2lkZUxlZnQgPSAod2guY3VycmVudExlZnQgKyBmcmFtZVdpZHRoKSAtIHNoYXBlWDtcclxuICAgICAgICAgICAgICAgIGlmIChvdXRzaWRlTGVmdCA+IDAgJiYgd2guY3VycmVudExlZnQgPiB4TWluKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW92ZVggPSBvdXRzaWRlTGVmdDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgb3V0c2lkZUJvdHRvbSA9IHNoYXBlWSAtICh3aC5jdXJyZW50VG9wICsgd2guY3VycmVudEhlaWdodCAtIGZyYW1lV2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG91dHNpZGVCb3R0b20gPiAwICYmIHdoLmN1cnJlbnRUb3AgKyB3aC5jdXJyZW50SGVpZ2h0IDw9IHlNYXgpIHtcclxuICAgICAgICAgICAgICAgICAgICBtb3ZlWSA9IC1vdXRzaWRlQm90dG9tO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvdXRzaWRlVG9wID0gKHdoLmN1cnJlbnRUb3AgKyBmcmFtZVdpZHRoKSAtIHNoYXBlWTtcclxuICAgICAgICAgICAgICAgIGlmIChvdXRzaWRlVG9wID4gMCAmJiB3aC5jdXJyZW50VG9wID49IHlNaW4pIHtcclxuICAgICAgICAgICAgICAgICAgICBtb3ZlWSA9IG91dHNpZGVUb3A7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG1vdmVYICE9IDAgfHwgbW92ZVkgIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtYXRyaXggPSBuZXcgUElYSS5NYXRyaXgoKS5jb3B5RnJvbSh3aC5zdGFnZS5wcm9qZWN0aW9uVHJhbnNmb3JtKTtcclxuICAgICAgICAgICAgICAgICAgICB3aC5zdGFnZS5wcm9qZWN0aW9uVHJhbnNmb3JtLmlkZW50aXR5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgd2guc3RhZ2UucHJvamVjdGlvblRyYW5zZm9ybS50cmFuc2xhdGUobW92ZVgsIG1vdmVZKTtcclxuICAgICAgICAgICAgICAgICAgICB3aC5zdGFnZS5wcm9qZWN0aW9uVHJhbnNmb3JtLnByZXBlbmQobWF0cml4KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgd2guY29tcHV0ZUN1cnJlbnRXb3JsZEJvdW5kcygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHdoLnNoYXBlc05vdEFmZmVjdGVkQnlXb3JsZFRyYW5zZm9ybXMuZm9yRWFjaCgoc2hhcGUpID0+IHNoYXBlLm1vdmUoLW1vdmVYLCAtbW92ZVkpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdWZXJzY2hpZWJ0IGRpZSBXZWx0IHNvLCBkYXNzIGRhcyDDvGJlcmdlYmVuZSBncmFwaGlzY2hlIE9iamVrdCAoc2hhcGUpIHNpY2h0YmFyIHdpcmQuIFZlcnNjaG9iZW4gd2lyZCBudXIsIHdlbm4gZGFzIE9iamVrdCB3ZW5pZ2VyIGFscyBmcmFtZVdpZHRoIHZvbSBSYW5kIGVudGZlcm50IGlzdCB1bmQgZGllIFdlbHQgbmljaHQgw7xiZXIgZGllIGdlZ2ViZW5lbiBLb29yZGluYXRlbiB4TWluLCB4TWF4LCB5TWluIHVuZCB5TWF4IGhpbmF1c3JhZ3QuJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInJvdGF0ZVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJhbmdsZUluRGVnXCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwieFwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInlcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgXSksIHZvaWRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBhbmdsZTogbnVtYmVyID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB4OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzJdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHk6IG51bWJlciA9IHBhcmFtZXRlcnNbM10udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgd2g6IFdvcmxkSGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiV29ybGRcIl07XHJcblxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgYW5nbGVSYWQgPSAtYW5nbGUgLyAxODAgKiBNYXRoLlBJO1xyXG4gICAgICAgICAgICAgICAgbGV0IG1hdHJpeCA9IG5ldyBQSVhJLk1hdHJpeCgpLmNvcHlGcm9tKHdoLnN0YWdlLnByb2plY3Rpb25UcmFuc2Zvcm0pO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UucHJvamVjdGlvblRyYW5zZm9ybS5pZGVudGl0eSgpO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UucHJvamVjdGlvblRyYW5zZm9ybS50cmFuc2xhdGUoLXgsIC15KTtcclxuICAgICAgICAgICAgICAgIHdoLnN0YWdlLnByb2plY3Rpb25UcmFuc2Zvcm0ucm90YXRlKGFuZ2xlUmFkKTtcclxuICAgICAgICAgICAgICAgIHdoLnN0YWdlLnByb2plY3Rpb25UcmFuc2Zvcm0udHJhbnNsYXRlKHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UucHJvamVjdGlvblRyYW5zZm9ybS5wcmVwZW5kKG1hdHJpeCk7XHJcblxyXG4gICAgICAgICAgICAgICAgd2guY29tcHV0ZUN1cnJlbnRXb3JsZEJvdW5kcygpO1xyXG4gICAgICAgICAgICAgICAgd2guc2hhcGVzTm90QWZmZWN0ZWRCeVdvcmxkVHJhbnNmb3Jtcy5mb3JFYWNoKFxyXG4gICAgICAgICAgICAgICAgICAgIChzaGFwZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFwZS5yb3RhdGUoLWFuZ2xlLCB4LCB5KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ1JvdGllcnQgZGllIFdlbHQgdW0gZGVuIGFuZ2VnZWJlbmVuIFdpbmtlbCBpbSBVcnplaWdlcnNpbm4uIERyZWhwdW5rdCBpc3QgZGVyIFB1bmt0ICh4L3kpLicsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJzY2FsZVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJmYWN0b3JcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ4XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwieVwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgdm9pZFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGZhY3RvcjogbnVtYmVyID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB4OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzJdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHk6IG51bWJlciA9IHBhcmFtZXRlcnNbM10udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgd2g6IFdvcmxkSGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiV29ybGRcIl07XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBtYXRyaXggPSBuZXcgUElYSS5NYXRyaXgoKS5jb3B5RnJvbSh3aC5zdGFnZS5wcm9qZWN0aW9uVHJhbnNmb3JtKTtcclxuICAgICAgICAgICAgICAgIHdoLnN0YWdlLnByb2plY3Rpb25UcmFuc2Zvcm0uaWRlbnRpdHkoKTtcclxuICAgICAgICAgICAgICAgIHdoLnN0YWdlLnByb2plY3Rpb25UcmFuc2Zvcm0udHJhbnNsYXRlKC14LCAteSk7XHJcbiAgICAgICAgICAgICAgICB3aC5zdGFnZS5wcm9qZWN0aW9uVHJhbnNmb3JtLnNjYWxlKGZhY3RvciwgZmFjdG9yKTtcclxuICAgICAgICAgICAgICAgIHdoLnN0YWdlLnByb2plY3Rpb25UcmFuc2Zvcm0udHJhbnNsYXRlKHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UucHJvamVjdGlvblRyYW5zZm9ybS5wcmVwZW5kKG1hdHJpeCk7XHJcbiAgICAgICAgICAgICAgICB3aC5jb21wdXRlQ3VycmVudFdvcmxkQm91bmRzKCk7XHJcbiAgICAgICAgICAgICAgICB3aC5zaGFwZXNOb3RBZmZlY3RlZEJ5V29ybGRUcmFuc2Zvcm1zLmZvckVhY2goKHNoYXBlKSA9PiBzaGFwZS5zY2FsZSgxIC8gZmFjdG9yLCB4LCB5KSk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdTdHJlY2t0IGRpZSBXZWx0IHVtIGRlbiBhbmdlZ2ViZW5lbiBGYWt0b3IuIFplbnRydW0gZGVyIFN0cmVja3VuZyBpc3QgKHgveSkuJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInNldENvb3JkaW5hdGVTeXN0ZW1cIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwibGVmdFwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInRvcFwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIndpZHRoXCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiaGVpZ2h0XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgbGVmdDogbnVtYmVyID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB0b3A6IG51bWJlciA9IHBhcmFtZXRlcnNbMl0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgd2lkdGg6IG51bWJlciA9IHBhcmFtZXRlcnNbM10udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgaGVpZ2h0OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzRdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHdoOiBXb3JsZEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIldvcmxkXCJdO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICB3aC5zdGFnZS5wcm9qZWN0aW9uVHJhbnNmb3JtLmlkZW50aXR5KCk7ICAgICAvLyBjb29yZGluYXRlIHN5c3RlbSAoMC8wKSB0byAoaW5pdGlhbFdpZHRoL2luaXRpYWxIZWlnaHQpXHJcbiAgICAgICAgICAgICAgICB3aC5zdGFnZS5wcm9qZWN0aW9uVHJhbnNmb3JtLnRyYW5zbGF0ZSgtbGVmdCwgLXRvcCk7XHJcbiAgICAgICAgICAgICAgICB3aC5zdGFnZS5wcm9qZWN0aW9uVHJhbnNmb3JtLnNjYWxlKHdoLmluaXRpYWxXaWR0aCAvIHdpZHRoLCB3aC5pbml0aWFsSGVpZ2h0IC8gaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIHdoLmNvbXB1dGVDdXJyZW50V29ybGRCb3VuZHMoKTtcclxuICAgICAgICAgICAgICAgIHdoLnNoYXBlc05vdEFmZmVjdGVkQnlXb3JsZFRyYW5zZm9ybXMuZm9yRWFjaCgoc2hhcGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBzaGFwZS5zY2FsZSh3aWR0aCAvIHdoLmluaXRpYWxXaWR0aCwgbGVmdCwgdG9wKTtcclxuICAgICAgICAgICAgICAgICAgICBzaGFwZS5tb3ZlKGxlZnQsIHRvcCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ1N0cmVja3QgZGllIFdlbHQgdW0gZGVuIGFuZ2VnZWJlbmVuIEZha3Rvci4gWmVudHJ1bSBkZXIgU3RyZWNrdW5nIGlzdCAoeC95KS4nLCBmYWxzZSkpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInNldERlZmF1bHRHcm91cFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJncm91cFwiLCB0eXBlOiBncm91cFR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgZ3JvdXA6IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHdoOiBXb3JsZEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIldvcmxkXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIHdoLmRlZmF1bHRHcm91cCA9IGdyb3VwID09IG51bGwgPyBudWxsIDogZ3JvdXAuaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnTGVndCBlaW5lIEdydXBwZSBmZXN0LCB6dSBkZXIgYWIgamV0enQgYWxsZSBuZXVlbiBPYmpla3RlIGF1dG9tYXRpc2NoIGhpbnp1Z2Vmw7xndCB3ZXJkZW4uIEZhbGxzIG51bGwgYW5nZWdlYmVuIHdpcmQsIHdlcmRlbiBuZXVlIE9iamVrdGUgenUga2VpbmVyIEdydXBwZSBhdXRvbWF0aXNjaCBoaW56dWdlZsO8Z3QuJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImFkZE1vdXNlTGlzdGVuZXJcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwibGlzdGVuZXJcIiwgdHlwZTogbW91c2VMaXN0ZW5lclR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgbGlzdGVuZXI6IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHdoOiBXb3JsZEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIldvcmxkXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIHdoLmFkZE1vdXNlTGlzdGVuZXIobGlzdGVuZXIpO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnRsO8Z3QgZWluZW4gbmV1ZW4gTW91c2VMaXN0ZW5lciBoaW56dSwgZGVzc2VuIE1ldGhvZGVuIGJlaSBNYXVzZXJlaWduaXNzZW4gYXVmZ2VydWZlbiB3ZXJkZW4uJywgZmFsc2UpKTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJnZXRXaWR0aFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIGludFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHdoOiBXb3JsZEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIldvcmxkXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHdoLmN1cnJlbnRXaWR0aCk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdHaWJ0IGRpZSBcIkJyZWl0ZVwiIGRlcyBHcmFmaWtiZXJlaWNocyB6dXLDvGNrLCBnZW5hdWVyOiBkaWUgeC1Lb29yZGluYXRlIGFtIHJlY2h0ZW4gUmFuZC4nLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiZ2V0SGVpZ2h0XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICBdKSwgaW50UHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgd2g6IFdvcmxkSGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiV29ybGRcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQod2guY3VycmVudEhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdHaWJ0IGRpZSBcIkjDtmhlXCIgZGVzIEdyYWZpa2JlcmVpY2hzIHp1csO8Y2ssIGdlbmF1ZXI6IGRpZSB5LUtvb3JkaW5hdGUgYW0gdW50ZXJlbiBSYW5kLicsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJnZXRUb3BcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCBpbnRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB3aDogV29ybGRIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJXb3JsZFwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh3aC5jdXJyZW50VG9wKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0dpYnQgZGllIHktS29vcmRpbmF0ZSBkZXIgbGlua2VuIG9iZXJlbiBFY2tlIHp1csO8Y2suJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImdldExlZnRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCBpbnRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB3aDogV29ybGRIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJXb3JsZFwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh3aC5jdXJyZW50TGVmdCk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdHaWJ0IGRpZSB4LUtvb3JkaW5hdGUgZGVyIGxpbmtlbiBvYmVyZW4gRWNrZSB6dXLDvGNrLicsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJzZXRDdXJzb3JcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiY3Vyc29yXCIsIHR5cGU6IHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB3aDogV29ybGRIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJXb3JsZFwiXTtcclxuICAgICAgICAgICAgICAgIGxldCBjdXJzb3I6IHN0cmluZyA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgd2guc2V0Q3Vyc29yKGN1cnNvcik7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICfDhG5kZXJ0IGRpZSBGb3JtIGRlcyBNYXVzY3Vyc29ycyBpbSBnZXNhbXRlbiBHcmFmaWtiZXJlaWNoLiBNw7ZnaWNoZSBXZXJ0ZTogc2llaGUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZGUvZG9jcy9XZWIvQ1NTL2N1cnNvci4nLCBmYWxzZSkpO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0V29ybGRIZWxwZXIod29ybGRPYmplY3Q6IFJ1bnRpbWVPYmplY3QsIGJyZWl0ZTogbnVtYmVyID0gODAwLCBow7ZoZTogbnVtYmVyID0gNjAwKTogV29ybGRIZWxwZXIge1xyXG5cclxuICAgICAgICBsZXQgd2ggPSB0aGlzLm1vZHVsZT8ubWFpbj8uZ2V0SW50ZXJwcmV0ZXIoKT8ud29ybGRIZWxwZXI7XHJcblxyXG5cclxuICAgICAgICBpZiAod2ggIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBpZiAod2gud2lkdGggIT0gYnJlaXRlIHx8IHdoLmhlaWdodCAhPSBow7ZoZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCByYXRpbzogbnVtYmVyID0gTWF0aC5yb3VuZChow7ZoZSAvIGJyZWl0ZSAqIDEwMCk7XHJcbiAgICAgICAgICAgICAgICB3aC4kY29udGFpbmVyT3V0ZXIuY3NzKCdwYWRkaW5nLWJvdHRvbScsIHJhdGlvICsgXCIlXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHdoLnN0YWdlLnByb2plY3Rpb25UcmFuc2Zvcm0uc2NhbGUod2gud2lkdGggLyBicmVpdGUsIHdoLndpZHRoIC8gaMO2aGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMubW9kdWxlLm1haW4uZ2V0UmlnaHREaXYoKT8uYWRqdXN0V2lkdGhUb1dvcmxkKCk7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gd2g7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFdvcmxkSGVscGVyKGJyZWl0ZSwgaMO2aGUsIHRoaXMubW9kdWxlLCB3b3JsZE9iamVjdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcblxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBNb3VzZUxpc3RlbmVyU2hhcGVEYXRhID0ge1xyXG4gICAgc2hhcGVIZWxwZXI6IFNoYXBlSGVscGVyLFxyXG4gICAgdHlwZXM6IHsgW3R5cGU6IHN0cmluZ106IGJvb2xlYW4gfSxcclxuICAgIG1ldGhvZHM6IHsgW3R5cGU6IHN0cmluZ106IE1ldGhvZCB9XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIE1vdXNlTGlzdGVuZXJEYXRhID0ge1xyXG4gICAgbGlzdGVuZXI6IFJ1bnRpbWVPYmplY3QsXHJcbiAgICB0eXBlczogeyBbdHlwZTogc3RyaW5nXTogYm9vbGVhbiB9LFxyXG4gICAgbWV0aG9kczogeyBbdHlwZTogc3RyaW5nXTogTWV0aG9kIH1cclxufVxyXG5cclxuZXhwb3J0IHR5cGUgQWN0b3JEYXRhID0ge1xyXG4gICAgYWN0b3JIZWxwZXI6IEFjdG9ySGVscGVyLFxyXG4gICAgbWV0aG9kOiBNZXRob2RcclxufVxyXG5cclxuLyoqXHJcbiAqIEBzZWUgaHR0cHM6Ly9qYXZhc2NyaXB0LnBsYWluZW5nbGlzaC5pby9pbnNpZGUtcGl4aWpzLXByb2plY3Rpb24tc3lzdGVtLTg5Nzg3MmEzZGMxN1xyXG4gKi9cclxuY2xhc3MgV29ybGRDb250YWluZXIgZXh0ZW5kcyBQSVhJLkNvbnRhaW5lciB7XHJcblxyXG4gICAgcHJvamVjdGlvblRyYW5zZm9ybTogUElYSS5NYXRyaXg7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIHNvdXJjZUZyYW1lOiBQSVhJLlJlY3RhbmdsZSwgcHVibGljIGRlc3RpbmF0aW9uRnJhbWU6IFBJWEkuUmVjdGFuZ2xlKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm0gPSBuZXcgUElYSS5NYXRyaXgoKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIocmVuZGVyZXI6IFBJWEkuUmVuZGVyZXIpIHtcclxuXHJcbiAgICAgICAgcmVuZGVyZXIucHJvamVjdGlvbi5wcm9qZWN0aW9uTWF0cml4LmlkZW50aXR5KCk7XHJcbiAgICAgICAgcmVuZGVyZXIucHJvamVjdGlvbi50cmFuc2Zvcm0gPSB0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm07XHJcbiAgICAgICAgcmVuZGVyZXIucmVuZGVyVGV4dHVyZS5iaW5kKFxyXG4gICAgICAgICAgICByZW5kZXJlci5yZW5kZXJUZXh0dXJlLmN1cnJlbnQsXHJcbiAgICAgICAgICAgIHRoaXMuc291cmNlRnJhbWUsXHJcbiAgICAgICAgICAgIHRoaXMuZGVzdGluYXRpb25GcmFtZSxcclxuICAgICAgICApO1xyXG4gICAgICAgIHN1cGVyLnJlbmRlcihyZW5kZXJlcik7XHJcbiAgICAgICAgcmVuZGVyZXIuYmF0Y2guZmx1c2goKTtcclxuXHJcbiAgICAgICAgcmVuZGVyZXIuYmF0Y2guZmx1c2goKTtcclxuICAgICAgICByZW5kZXJlci5wcm9qZWN0aW9uLnByb2plY3Rpb25NYXRyaXguaWRlbnRpdHkoKTtcclxuICAgICAgICByZW5kZXJlci5wcm9qZWN0aW9uLnRyYW5zZm9ybSA9IG51bGw7XHJcbiAgICAgICAgcmVuZGVyZXIucmVuZGVyVGV4dHVyZS5iaW5kKG51bGwpO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFdvcmxkSGVscGVyIHtcclxuXHJcbiAgICAkY29udGFpbmVyT3V0ZXI6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICAkY29udGFpbmVySW5uZXI6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICBhcHA6IFBJWEkuQXBwbGljYXRpb247XHJcbiAgICBzdGFnZTogV29ybGRDb250YWluZXI7XHJcblxyXG4gICAgYWN0QWN0b3JzOiBBY3RvckRhdGFbXSA9IFtdO1xyXG4gICAga2V5UHJlc3NlZEFjdG9yczogQWN0b3JEYXRhW10gPSBbXTtcclxuICAgIGtleVVwQWN0b3JzOiBBY3RvckRhdGFbXSA9IFtdO1xyXG4gICAga2V5RG93bkFjdG9yczogQWN0b3JEYXRhW10gPSBbXTtcclxuICAgIGFjdG9ySGVscGVyc1RvRGVzdHJveTogQWN0b3JIZWxwZXJbXSA9IFtdO1xyXG5cclxuICAgIG1vdXNlTGlzdGVuZXJTaGFwZXM6IE1vdXNlTGlzdGVuZXJTaGFwZURhdGFbXSA9IFtdO1xyXG4gICAgbW91c2VMaXN0ZW5lcnM6IE1vdXNlTGlzdGVuZXJEYXRhW10gPSBbXTtcclxuXHJcbiAgICBpbnRlcnByZXRlcjogSW50ZXJwcmV0ZXI7XHJcbiAgICBhY3RvcnNGaW5pc2hlZDogYm9vbGVhbiA9IHRydWU7XHJcbiAgICBzdW1tZWREZWx0YTogbnVtYmVyID0gMDtcclxuXHJcbiAgICBkZWZhdWx0R3JvdXA6IEdyb3VwSGVscGVyO1xyXG5cclxuICAgIGluaXRpYWxXaWR0aDogbnVtYmVyO1xyXG4gICAgaW5pdGlhbEhlaWdodDogbnVtYmVyO1xyXG5cclxuICAgICRjb29yZGluYXRlRGl2OiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG5cclxuICAgIHB1YmxpYyBzY2FsZWRUZXh0dXJlczogeyBbbmFtZTogc3RyaW5nXTogUElYSS5UZXh0dXJlIH0gPSB7fTtcclxuXHJcblxyXG4gICAgc2hhcGVzOiBTaGFwZUhlbHBlcltdID0gW107ICAgICAvLyBhbGwgc2hhcGVzIGluY2wuIGdyb3VwcyB0aGF0IGFyZW4ndCBwYXJ0IG9mIGEgZ3JvdXBcclxuXHJcbiAgICBjdXJyZW50TGVmdDogbnVtYmVyO1xyXG4gICAgY3VycmVudFRvcDogbnVtYmVyO1xyXG4gICAgY3VycmVudFdpZHRoOiBudW1iZXI7XHJcbiAgICBjdXJyZW50SGVpZ2h0OiBudW1iZXI7XHJcblxyXG4gICAgc2hhcGVzTm90QWZmZWN0ZWRCeVdvcmxkVHJhbnNmb3JtczogU2hhcGVIZWxwZXJbXSA9IFtdO1xyXG5cclxuICAgIGdsb2JhbFNjYWxlOiBudW1iZXI7XHJcblxyXG4gICAgcm9ib3RXb3JsZEhlbHBlcjogYW55O1xyXG5cclxuICAgIHRpY2tlckZ1bmN0aW9uOiAodDogbnVtYmVyKSA9PiB2b2lkO1xyXG5cclxuICAgIGNsZWFyQWN0b3JMaXN0cygpIHtcclxuICAgICAgICB0aGlzLmFjdEFjdG9ycyA9IFtdO1xyXG4gICAgICAgIHRoaXMua2V5UHJlc3NlZEFjdG9ycyA9IFtdO1xyXG4gICAgICAgIHRoaXMua2V5VXBBY3RvcnMgPSBbXTtcclxuICAgICAgICB0aGlzLmtleURvd25BY3RvcnMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgd2lkdGg6IG51bWJlciwgcHVibGljIGhlaWdodDogbnVtYmVyLCBwcml2YXRlIG1vZHVsZTogTW9kdWxlLCBwdWJsaWMgd29ybGQ6IFJ1bnRpbWVPYmplY3QpIHtcclxuXHJcbiAgICAgICAgUElYSS5zZXR0aW5ncy5TQ0FMRV9NT0RFID0gUElYSS5TQ0FMRV9NT0RFUy5ORUFSRVNUO1xyXG4gICAgICAgIFBJWEkuc2V0dGluZ3MuVEFSR0VUX0ZQTVMgPSAzMC4wIC8gMTAwMC4wO1xyXG5cclxuICAgICAgICB0aGlzLmdsb2JhbFNjYWxlID0gMTtcclxuXHJcbiAgICAgICAgd2hpbGUgKGhlaWdodCA+IDEwMDAgfHwgd2lkdGggPiAyMDAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ2xvYmFsU2NhbGUgKj0gMjtcclxuICAgICAgICAgICAgaGVpZ2h0IC89IDI7XHJcbiAgICAgICAgICAgIHdpZHRoIC89IDI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmluaXRpYWxIZWlnaHQgPSB0aGlzLmhlaWdodDtcclxuICAgICAgICB0aGlzLmluaXRpYWxXaWR0aCA9IHRoaXMud2lkdGg7XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudExlZnQgPSAwO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFRvcCA9IDA7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50V2lkdGggPSB0aGlzLndpZHRoO1xyXG4gICAgICAgIHRoaXMuY3VycmVudEhlaWdodCA9IHRoaXMuaGVpZ2h0O1xyXG5cclxuICAgICAgICB0aGlzLmludGVycHJldGVyID0gdGhpcy5tb2R1bGU/Lm1haW4/LmdldEludGVycHJldGVyKCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmludGVycHJldGVyLnByb2Nlc3NpbmdIZWxwZXIgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnRocm93RXhjZXB0aW9uKFwiRGllIGhlcmvDtm1tbGljaGUgR3JhZmlrYXVzZ2FiZSBrYW5uIG5pY2h0IHp1c2FtbWVuIG1pdCBQcm9jZXNzaW5nIGdlbnV0enQgd2VyZGVuLlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmludGVycHJldGVyLndvcmxkSGVscGVyICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci50aHJvd0V4Y2VwdGlvbihcIkVzIGRhcmYgbnVyIGVpbiBXb3JsZC1PYmpla3QgaW5zdGFuemllcnQgd2VyZGVuLlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIud29ybGRIZWxwZXIgPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgJGdyYXBoaWNzRGl2ID0gdGhpcy5tb2R1bGUubWFpbi5nZXRJbnRlcnByZXRlcigpLnByaW50TWFuYWdlci5nZXRHcmFwaGljc0RpdigpO1xyXG4gICAgICAgIHRoaXMuJGNvb3JkaW5hdGVEaXYgPSB0aGlzLm1vZHVsZS5tYWluLmdldFJpZ2h0RGl2KCkuJHJpZ2h0RGl2LmZpbmQoXCIuam9fY29vcmRpbmF0ZXNcIik7XHJcblxyXG4gICAgICAgIGxldCBmID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgJGpvX3RhYnMgPSAkZ3JhcGhpY3NEaXYucGFyZW50cyhcIi5qb190YWJzXCIpO1xyXG4gICAgICAgICAgICBpZiAoJGpvX3RhYnMubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgICAgICRqb190YWJzID0gJGdyYXBoaWNzRGl2LnBhcmVudHMoXCIuam9lX3JpZ2h0RGl2SW5uZXJcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IG1heFdpZHRoOiBudW1iZXIgPSAkam9fdGFicy53aWR0aCgpO1xyXG4gICAgICAgICAgICBsZXQgbWF4SGVpZ2h0OiBudW1iZXIgPSAkam9fdGFicy5oZWlnaHQoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChoZWlnaHQgLyB3aWR0aCA+IG1heEhlaWdodCAvIG1heFdpZHRoKSB7XHJcbiAgICAgICAgICAgICAgICAkZ3JhcGhpY3NEaXYuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAnd2lkdGgnOiB3aWR0aCAvIGhlaWdodCAqIG1heEhlaWdodCArIFwicHhcIixcclxuICAgICAgICAgICAgICAgICAgICAnaGVpZ2h0JzogbWF4SGVpZ2h0ICsgXCJweFwiLFxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICRncmFwaGljc0Rpdi5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgICdoZWlnaHQnOiBoZWlnaHQgLyB3aWR0aCAqIG1heFdpZHRoICsgXCJweFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICd3aWR0aCc6IG1heFdpZHRoICsgXCJweFwiLFxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRncmFwaGljc0Rpdi5vZmYoJ3NpemVDaGFuZ2VkJyk7XHJcbiAgICAgICAgJGdyYXBoaWNzRGl2Lm9uKCdzaXplQ2hhbmdlZCcsIGYpO1xyXG5cclxuICAgICAgICBmKCk7XHJcblxyXG4gICAgICAgIHRoaXMuJGNvbnRhaW5lck91dGVyID0galF1ZXJ5KCc8ZGl2PjwvZGl2PicpO1xyXG4gICAgICAgIHRoaXMuJGNvbnRhaW5lcklubmVyID0galF1ZXJ5KCc8ZGl2PjwvZGl2PicpO1xyXG4gICAgICAgIHRoaXMuJGNvbnRhaW5lck91dGVyLmFwcGVuZCh0aGlzLiRjb250YWluZXJJbm5lcik7XHJcblxyXG4gICAgICAgICRncmFwaGljc0Rpdi5hcHBlbmQodGhpcy4kY29udGFpbmVyT3V0ZXIpO1xyXG5cclxuICAgICAgICAkZ3JhcGhpY3NEaXYuc2hvdygpO1xyXG5cclxuICAgICAgICAkZ3JhcGhpY3NEaXZbMF0ub25jb250ZXh0bWVudSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5tb2R1bGUubWFpbi5waXhpQXBwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwID0gdGhpcy5tb2R1bGUubWFpbi5waXhpQXBwO1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5yZW5kZXJlci5yZXNpemUod2lkdGgsIGhlaWdodCk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwLnJlbmRlcmVyLmJhY2tncm91bmRDb2xvciA9IDB4MDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmFwcCA9IG5ldyBQSVhJLkFwcGxpY2F0aW9uKHtcclxuICAgICAgICAgICAgICAgIGFudGlhbGlhczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAvL3Jlc2l6ZVRvOiAkY29udGFpbmVySW5uZXJbMF1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMubW9kdWxlLm1haW4ucGl4aUFwcCA9IHRoaXMuYXBwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLnRpY2tlckZ1bmN0aW9uID0gKGRlbHRhKSA9PiB7XHJcbiAgICAgICAgICAgIHRoYXQudGljayhQSVhJLlRpY2tlci5zaGFyZWQuZWxhcHNlZE1TKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmFwcC50aWNrZXIuYWRkKHRoaXMudGlja2VyRnVuY3Rpb24pO1xyXG4gICAgICAgIHRoaXMuYXBwLnRpY2tlci5tYXhGUFMgPSAzMDtcclxuXHJcbiAgICAgICAgdGhpcy5pbnRlcnByZXRlci50aW1lckV4dGVybiA9IHRydWU7XHJcblxyXG4gICAgICAgIGxldCBzb3VyY2VGcmFtZSA9IG5ldyBQSVhJLlJlY3RhbmdsZSgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICAgICAgbGV0IGRlc3RpbmF0aW9uRnJhbWUgPSBuZXcgUElYSS5SZWN0YW5nbGUoMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICAgICAgdGhpcy5zdGFnZSA9IG5ldyBXb3JsZENvbnRhaW5lcihzb3VyY2VGcmFtZSwgZGVzdGluYXRpb25GcmFtZSk7XHJcbiAgICAgICAgdGhpcy5zdGFnZS5wcm9qZWN0aW9uVHJhbnNmb3JtID0gbmV3IFBJWEkuTWF0cml4KCk7XHJcblxyXG4gICAgICAgIHRoaXMuYXBwLnN0YWdlLmFkZENoaWxkKHRoaXMuc3RhZ2UpO1xyXG5cclxuICAgICAgICB0aGlzLiRjb250YWluZXJJbm5lci5hcHBlbmQodGhpcy5hcHAudmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIua2V5Ym9hcmRUb29sLmtleVByZXNzZWRDYWxsYmFja3MucHVzaCgoa2V5KSA9PiB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGtwYSBvZiB0aGF0LmtleVByZXNzZWRBY3RvcnMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0LnJ1bkFjdG9yV2hlbktleUV2ZW50KGtwYSwga2V5KTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5pbnRlcnByZXRlci5rZXlib2FyZFRvb2wua2V5VXBDYWxsYmFja3MucHVzaCgoa2V5KSA9PiB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGtwYSBvZiB0aGF0LmtleVVwQWN0b3JzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhhdC5ydW5BY3RvcldoZW5LZXlFdmVudChrcGEsIGtleSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIua2V5Ym9hcmRUb29sLmtleURvd25DYWxsYmFja3MucHVzaCgoa2V5KSA9PiB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGtwYSBvZiB0aGF0LmtleURvd25BY3RvcnMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0LnJ1bkFjdG9yV2hlbktleUV2ZW50KGtwYSwga2V5KTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgIGZvciAobGV0IGxpc3RlbmVyVHlwZSBvZiBbXCJtb3VzZXVwXCIsIFwibW91c2Vkb3duXCIsIFwibW91c2Vtb3ZlXCIsIFwibW91c2VlbnRlclwiLCBcIm1vdXNlbGVhdmVcIl0pIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBldmVudFR5cGUgPSBsaXN0ZW5lclR5cGU7XHJcbiAgICAgICAgICAgIGlmICh3aW5kb3cuUG9pbnRlckV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICBldmVudFR5cGUgPSBldmVudFR5cGUucmVwbGFjZSgnbW91c2UnLCAncG9pbnRlcicpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLiRjb250YWluZXJJbm5lci5vbihldmVudFR5cGUsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgeCA9IHdpZHRoICogZS5vZmZzZXRYIC8gdGhpcy4kY29udGFpbmVySW5uZXIud2lkdGgoKTtcclxuICAgICAgICAgICAgICAgIGxldCB5ID0gaGVpZ2h0ICogZS5vZmZzZXRZIC8gdGhpcy4kY29udGFpbmVySW5uZXIuaGVpZ2h0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHAgPSBuZXcgUElYSS5Qb2ludCh4ICogdGhpcy5nbG9iYWxTY2FsZSwgeSAqIHRoaXMuZ2xvYmFsU2NhbGUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFnZS5wcm9qZWN0aW9uVHJhbnNmb3JtLmFwcGx5SW52ZXJzZShwLCBwKTtcclxuICAgICAgICAgICAgICAgIHggPSBwLng7XHJcbiAgICAgICAgICAgICAgICB5ID0gcC55O1xyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQub25Nb3VzZUV2ZW50KGxpc3RlbmVyVHlwZSwgeCwgeSwgZS5idXR0b24pO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMubW91c2VMaXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXIudHlwZXNbbGlzdGVuZXJUeXBlXSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW52b2tlTW91c2VMaXN0ZW5lcihsaXN0ZW5lciwgbGlzdGVuZXJUeXBlLCB4LCB5LCBlLmJ1dHRvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lclR5cGUgPT0gXCJtb3VzZWRvd25cIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBnbmdFcmVpZ25pc2JlaGFuZGx1bmcgPSB0aGlzLmludGVycHJldGVyLmduZ0VyZWlnbmlzYmVoYW5kbHVuZ0hlbHBlcjtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ25nRXJlaWduaXNiZWhhbmRsdW5nICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ25nRXJlaWduaXNiZWhhbmRsdW5nLmhhbmRsZU1vdXNlQ2xpY2tlZEV2ZW50KHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0ICRjb29yZGluYXRlRGl2ID0gdGhpcy4kY29vcmRpbmF0ZURpdjtcclxuXHJcbiAgICAgICAgbGV0IG1vdXNlUG9pbnRlciA9IHdpbmRvdy5Qb2ludGVyRXZlbnQgPyBcInBvaW50ZXJcIiA6IFwibW91c2VcIjtcclxuXHJcbiAgICAgICAgdGhpcy4kY29udGFpbmVySW5uZXIub24obW91c2VQb2ludGVyICsgXCJtb3ZlXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB4ID0gd2lkdGggKiBlLm9mZnNldFggLyB0aGlzLiRjb250YWluZXJJbm5lci53aWR0aCgpO1xyXG4gICAgICAgICAgICBsZXQgeSA9IGhlaWdodCAqIGUub2Zmc2V0WSAvIHRoaXMuJGNvbnRhaW5lcklubmVyLmhlaWdodCgpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHAgPSBuZXcgUElYSS5Qb2ludCh4ICogdGhpcy5nbG9iYWxTY2FsZSwgeSAqIHRoaXMuZ2xvYmFsU2NhbGUpO1xyXG4gICAgICAgICAgICB0aGlzLnN0YWdlLnByb2plY3Rpb25UcmFuc2Zvcm0uYXBwbHlJbnZlcnNlKHAsIHApO1xyXG4gICAgICAgICAgICB4ID0gTWF0aC5yb3VuZChwLngpO1xyXG4gICAgICAgICAgICB5ID0gTWF0aC5yb3VuZChwLnkpO1xyXG4gICAgICAgICAgICAkY29vcmRpbmF0ZURpdi50ZXh0KGAoJHt4fS8ke3l9KWApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLiRjb250YWluZXJJbm5lci5vbihtb3VzZVBvaW50ZXIgKyBcImVudGVyXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICRjb29yZGluYXRlRGl2LnNob3coKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy4kY29udGFpbmVySW5uZXIub24obW91c2VQb2ludGVyICsgXCJsZWF2ZVwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAkY29vcmRpbmF0ZURpdi5oaWRlKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kdWxlLm1haW4uZ2V0UmlnaHREaXYoKT8uYWRqdXN0V2lkdGhUb1dvcmxkKCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNvbXB1dGVDdXJyZW50V29ybGRCb3VuZHMoKSB7XHJcblxyXG4gICAgICAgIGxldCBwMTogUElYSS5Qb2ludCA9IG5ldyBQSVhJLlBvaW50KDAsIDApO1xyXG4gICAgICAgIHRoaXMuc3RhZ2UucHJvamVjdGlvblRyYW5zZm9ybS5hcHBseUludmVyc2UocDEsIHAxKTtcclxuXHJcbiAgICAgICAgbGV0IHAyOiBQSVhJLlBvaW50ID0gbmV3IFBJWEkuUG9pbnQodGhpcy5pbml0aWFsV2lkdGgsIHRoaXMuaW5pdGlhbEhlaWdodCk7XHJcbiAgICAgICAgdGhpcy5zdGFnZS5wcm9qZWN0aW9uVHJhbnNmb3JtLmFwcGx5SW52ZXJzZShwMiwgcDIpO1xyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRMZWZ0ID0gcDEueDtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUb3AgPSBwMS55O1xyXG4gICAgICAgIHRoaXMuY3VycmVudFdpZHRoID0gTWF0aC5hYnMocDIueCAtIHAxLngpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudEhlaWdodCA9IE1hdGguYWJzKHAyLnkgLSBwMS55KTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgaGFzQWN0b3JzKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFjdEFjdG9ycy5sZW5ndGggPiAwIHx8IHRoaXMua2V5UHJlc3NlZEFjdG9ycy5sZW5ndGggPiAwIHx8IHRoaXMua2V5VXBBY3RvcnMubGVuZ3RoID4gMFxyXG4gICAgICAgICAgICB8fCB0aGlzLmtleURvd25BY3RvcnMubGVuZ3RoID4gMCB8fCB0aGlzLm1vdXNlTGlzdGVuZXJzLmxlbmd0aCA+IDAgfHwgdGhpcy5tb3VzZUxpc3RlbmVyU2hhcGVzLmxlbmd0aCA+IDA7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0QWxsSGl0cG9seWdvbnNEaXJ0eSgpIHtcclxuICAgICAgICBmb3IgKGxldCBzaGFwZSBvZiB0aGlzLnNoYXBlcykge1xyXG4gICAgICAgICAgICBzaGFwZS5zZXRIaXRQb2x5Z29uRGlydHkodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldEN1cnNvcihjdXJzb3I6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuJGNvbnRhaW5lcklubmVyLmNzcygnY3Vyc29yJywgY3Vyc29yKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgYWN0b3JzTm90RmluaXNoZWQ6IG51bWJlciA9IDA7XHJcbiAgICB0aWNrczogbnVtYmVyID0gMDtcclxuICAgIGRlbHRhU3VtOiBudW1iZXIgPSAwO1xyXG5cclxuICAgIHNwcml0ZUFuaW1hdGlvbnM6IFNwcml0ZUhlbHBlcltdID0gW107XHJcblxyXG4gICAgdGljayhkZWx0YTogYW55KSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmludGVycHJldGVyICE9IG51bGwpIHtcclxuICAgICAgICAgICAgc3dpdGNoICh0aGlzLmludGVycHJldGVyLnN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIEludGVycHJldGVyU3RhdGUucnVubmluZzpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN1bW1lZERlbHRhICs9IGRlbHRhO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IHNwcml0ZUhlbHBlciBvZiB0aGlzLnNwcml0ZUFuaW1hdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3ByaXRlSGVscGVyLnRpY2soZGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmFjdG9yc0ZpbmlzaGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0b3JzTm90RmluaXNoZWQrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5pbnRlcnByZXRlci5wYXVzZVVudGlsICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgZmlyc3Q6IGJvb2xlYW4gPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBhY3RvckRhdGEgb2YgdGhpcy5hY3RBY3RvcnMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBhY3RvckhlbHBlciA9IGFjdG9yRGF0YS5hY3RvckhlbHBlcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdG9ySGVscGVyLnRpbWVyUGF1c2VkIHx8IGFjdG9ySGVscGVyLmlzRGVzdHJveWVkKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwcm9ncmFtID0gYWN0b3JEYXRhLm1ldGhvZD8ucHJvZ3JhbTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ydW5BY3RvcihmaXJzdCwgYWN0b3JEYXRhLCB0aGlzLnN1bW1lZERlbHRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2dyYW0gIT0gbnVsbCAmJiAhYWN0b3JEYXRhLmFjdG9ySGVscGVyLmlzRGVzdHJveWVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RvcnNGaW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBJbnRlcnByZXRlclN0YXRlLmRvbmU6XHJcbiAgICAgICAgICAgICAgICBjYXNlIEludGVycHJldGVyU3RhdGUuZXJyb3I6XHJcbiAgICAgICAgICAgICAgICBjYXNlIEludGVycHJldGVyU3RhdGUubm90X2luaXRpYWxpemVkOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJBY3Rvckxpc3RzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICB0aGlzLnN1bW1lZERlbHRhID0gMDtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmludGVycHJldGVyLnN0YXRlID09IEludGVycHJldGVyU3RhdGUucnVubmluZykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYWN0QWN0b3JzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnRpbWVyRnVuY3Rpb24oMzMuMzMsIHRydWUsIDAuNSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaW50ZXJwcmV0ZXIuc3RhdGUgPT0gSW50ZXJwcmV0ZXJTdGF0ZS5ydW5uaW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIudGltZXJTdG9wcGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIudGltZXJGdW5jdGlvbigzMy4zMywgZmFsc2UsIDAuMDgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci50aW1lckZ1bmN0aW9uKDMzLjMzLCBmYWxzZSwgMC43KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2hpbGUgKHRoaXMuYWN0b3JIZWxwZXJzVG9EZXN0cm95Lmxlbmd0aCA+IDApIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBhY3RvckhlbHBlciA9IHRoaXMuYWN0b3JIZWxwZXJzVG9EZXN0cm95LnBvcCgpO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgYWN0b3JMaXN0IG9mIFt0aGlzLmtleVByZXNzZWRBY3RvcnMsIHRoaXMua2V5VXBBY3RvcnMsIHRoaXMua2V5RG93bkFjdG9yc10pIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWN0b3JMaXN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjdG9yTGlzdFtpXS5hY3RvckhlbHBlciA9PT0gYWN0b3JIZWxwZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0b3JMaXN0LnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaS0tO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5tb3VzZUxpc3RlbmVyU2hhcGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tb3VzZUxpc3RlbmVyU2hhcGVzW2ldLnNoYXBlSGVscGVyID09PSBhY3RvckhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VMaXN0ZW5lclNoYXBlcy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaS0tO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYWN0QWN0b3JzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5hY3RBY3RvcnNbaV0uYWN0b3JIZWxwZXIgPT09IGFjdG9ySGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RBY3RvcnMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGktLTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGRpc3BsYXlPYmplY3QgPSAoPFNoYXBlSGVscGVyPmFjdG9ySGVscGVyKS5kaXNwbGF5T2JqZWN0O1xyXG4gICAgICAgICAgICBpZiAoZGlzcGxheU9iamVjdCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBkaXNwbGF5T2JqZWN0LmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgICAgICg8U2hhcGVIZWxwZXI+YWN0b3JIZWxwZXIpLmRpc3BsYXlPYmplY3QgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2V0QmFja2dyb3VuZENvbG9yKGNvbG9yOiBzdHJpbmcgfCBudW1iZXIpIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBjb2xvciA9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIGxldCBjID0gQ29sb3JIZWxwZXIucGFyc2VDb2xvclRvT3BlbkdMKGNvbG9yKTtcclxuICAgICAgICAgICAgdGhpcy5hcHAucmVuZGVyZXIuYmFja2dyb3VuZENvbG9yID0gYy5jb2xvcjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmFwcC5yZW5kZXJlci5iYWNrZ3JvdW5kQ29sb3IgPSBjb2xvcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJ1bkFjdG9yV2hlbktleUV2ZW50KGFjdG9yRGF0YTogQWN0b3JEYXRhLCBrZXk6IHN0cmluZykge1xyXG5cclxuICAgICAgICBsZXQgcHJvZ3JhbSA9IGFjdG9yRGF0YS5tZXRob2Q/LnByb2dyYW07XHJcbiAgICAgICAgbGV0IGludm9rZSA9IGFjdG9yRGF0YS5tZXRob2Q/Lmludm9rZTtcclxuXHJcbiAgICAgICAgbGV0IHJ0byA9IGFjdG9yRGF0YS5hY3RvckhlbHBlci5ydW50aW1lT2JqZWN0O1xyXG5cclxuICAgICAgICBsZXQgc3RhY2tFbGVtZW50czogVmFsdWVbXSA9IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogcnRvLmNsYXNzLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJ0b1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IGtleVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgaWYgKHByb2dyYW0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnJ1blRpbWVyKGFjdG9yRGF0YS5tZXRob2QsIHN0YWNrRWxlbWVudHMsIG51bGwsIGZhbHNlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGludm9rZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGludm9rZShbXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBydW5BY3RvcihmaXJzdDogYm9vbGVhbiwgYWN0b3JEYXRhOiBBY3RvckRhdGEsIGRlbHRhOiBudW1iZXIpIHtcclxuXHJcbiAgICAgICAgbGV0IHByb2dyYW0gPSBhY3RvckRhdGEubWV0aG9kPy5wcm9ncmFtO1xyXG4gICAgICAgIGxldCBpbnZva2UgPSBhY3RvckRhdGEubWV0aG9kPy5pbnZva2U7XHJcblxyXG4gICAgICAgIGxldCBydG8gPSBhY3RvckRhdGEuYWN0b3JIZWxwZXIucnVudGltZU9iamVjdDtcclxuXHJcbiAgICAgICAgbGV0IHN0YWNrRWxlbWVudHM6IFZhbHVlW10gPSBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IHJ0by5jbGFzcyxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiBydG9cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICBpZiAoYWN0b3JEYXRhLm1ldGhvZC5nZXRQYXJhbWV0ZXJDb3VudCgpID4gMCkge1xyXG4gICAgICAgICAgICBzdGFja0VsZW1lbnRzLnB1c2goXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZGVsdGFcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChwcm9ncmFtICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci5ydW5UaW1lcihhY3RvckRhdGEubWV0aG9kLCBzdGFja0VsZW1lbnRzLCBmaXJzdCA/IChpbnRlcnByZXRlcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5hY3RvcnNGaW5pc2hlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBpbnRlcnByZXRlci50aW1lclN0b3BwZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IDogbnVsbCwgdHJ1ZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChpbnZva2UgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBpbnZva2UoW10pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjYWNoZUFzQml0bWFwKCkge1xyXG5cclxuICAgICAgICBsZXQgaGFzUm9ib3QgPSB0aGlzLnJvYm90V29ybGRIZWxwZXIgIT0gbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5tb3VzZUxpc3RlbmVyU2hhcGVzID0gW107XHJcblxyXG4gICAgICAgIGxldCBzY2FsZU1pbiA9IDEuMDtcclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50V2lkdGggKiB0aGlzLmN1cnJlbnRIZWlnaHQgPiAyNTAwMDAwKSBzY2FsZU1pbiA9IE1hdGguc3FydCgyNTAwMDAwIC8gKHRoaXMuY3VycmVudFdpZHRoICogdGhpcy5jdXJyZW50SGVpZ2h0KSk7XHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFdpZHRoICogdGhpcy5jdXJyZW50SGVpZ2h0IDwgMTAyNCAqIDEwMjQpIHNjYWxlTWluID0gTWF0aC5zcXJ0KDEwMjQgKiAxMDI0IC8gKHRoaXMuY3VycmVudFdpZHRoICogdGhpcy5jdXJyZW50SGVpZ2h0KSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGJydCA9IG5ldyBQSVhJLkJhc2VSZW5kZXJUZXh0dXJlKFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzY2FsZU1vZGU6IFBJWEkuU0NBTEVfTU9ERVMuTElORUFSLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IE1hdGgucm91bmQodGhpcy5jdXJyZW50V2lkdGggKiBzY2FsZU1pbiksXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IE1hdGgucm91bmQodGhpcy5jdXJyZW50SGVpZ2h0ICogc2NhbGVNaW4pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIGxldCBydDogUElYSS5SZW5kZXJUZXh0dXJlID0gbmV3IFBJWEkuUmVuZGVyVGV4dHVyZShicnQpO1xyXG5cclxuICAgICAgICBsZXQgdHJhbnNmb3JtID0gbmV3IFBJWEkuTWF0cml4KCkuc2NhbGUoc2NhbGVNaW4sIHNjYWxlTWluKTtcclxuXHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghaGFzUm9ib3QpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXBwLnJlbmRlcmVyLnJlbmRlcih0aGlzLnN0YWdlLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyVGV4dHVyZTogcnQsXHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2Zvcm1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhZ2UuY2hpbGRyZW4uZm9yRWFjaChjID0+IGMuZGVzdHJveSgpKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YWdlLnJlbW92ZUNoaWxkcmVuKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBzcHJpdGUgPSBuZXcgUElYSS5TcHJpdGUocnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHNwcml0ZS5sb2NhbFRyYW5zZm9ybS5zY2FsZSh0aGlzLmdsb2JhbFNjYWxlLCB0aGlzLmdsb2JhbFNjYWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBkZWJ1Z2dlcjtcclxuICAgICAgICAgICAgICAgICAgICAvLyBzcHJpdGUubG9jYWxUcmFuc2Zvcm0udHJhbnNsYXRlKDAsIHJ0LmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICAgICAgc3ByaXRlLnRyYW5zZm9ybS5vbkNoYW5nZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMuc3RhZ2UucHJvamVjdGlvblRyYW5zZm9ybSA9IG5ldyBQSVhJLk1hdHJpeCgpLnNjYWxlKDEsIC0xKS50cmFuc2xhdGUoMCwgdGhpcy5jdXJyZW50SGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YWdlLnByb2plY3Rpb25UcmFuc2Zvcm0gPSBuZXcgUElYSS5NYXRyaXgoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YWdlLmFkZENoaWxkKHNwcml0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSwgMzAwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIDE1MCk7ICAgLy8gbmVjZXNzYXJ5IHRvIGF3YWl0IFR1cnRsZSdzIGRlZmVycmVkIHJlbmRlcmluZ1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBkZXN0cm95V29ybGQoKSB7XHJcbiAgICAgICAgZm9yIChsZXQgbGlzdGVuZXJUeXBlIG9mIFtcIm1vdXNldXBcIiwgXCJtb3VzZWRvd25cIiwgXCJtb3VzZW1vdmVcIiwgXCJtb3VzZWVudGVyXCIsIFwibW91c2VsZWF2ZVwiXSkge1xyXG4gICAgICAgICAgICB0aGlzLiRjb250YWluZXJJbm5lci5vZmYobGlzdGVuZXJUeXBlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zcHJpdGVBbmltYXRpb25zID0gW107XHJcbiAgICAgICAgdGhpcy5hcHAudGlja2VyLnJlbW92ZSh0aGlzLnRpY2tlckZ1bmN0aW9uKTtcclxuXHJcbiAgICAgICAgdGhpcy5hcHAuc3RhZ2UuY2hpbGRyZW4uZm9yRWFjaChjID0+IGMuZGVzdHJveSgpKTtcclxuICAgICAgICB0aGlzLmFwcC5zdGFnZS5yZW1vdmVDaGlsZHJlbigpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5yb2JvdFdvcmxkSGVscGVyICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5yb2JvdFdvcmxkSGVscGVyLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgdGhpcy5yb2JvdFdvcmxkSGVscGVyID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGpRdWVyeSh0aGlzLmFwcC52aWV3KS5kZXRhY2goKTtcclxuXHJcbiAgICAgICAgdGhpcy4kY29udGFpbmVyT3V0ZXIucmVtb3ZlKCk7XHJcbiAgICAgICAgdGhpcy5tb2R1bGUubWFpbi5nZXRJbnRlcnByZXRlcigpLnByaW50TWFuYWdlci5nZXRHcmFwaGljc0RpdigpLmhpZGUoKTtcclxuICAgICAgICB0aGlzLmludGVycHJldGVyLnRpbWVyRXh0ZXJuID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5pbnRlcnByZXRlci53b3JsZEhlbHBlciA9IG51bGw7XHJcbiAgICAgICAgdGhpcy4kY29vcmRpbmF0ZURpdi5oaWRlKCk7XHJcblxyXG4gICAgICAgIEZpbGxlZFNoYXBlRGVmYXVsdHMuaW5pdERlZmF1bHRWYWx1ZXMoKTtcclxuICAgIH1cclxuXHJcbiAgICBvbk1vdXNlRXZlbnQobGlzdGVuZXJUeXBlOiBzdHJpbmcsIHg6IG51bWJlciwgeTogbnVtYmVyLCBidXR0b246IG51bWJlcikge1xyXG5cclxuICAgICAgICBzd2l0Y2ggKGxpc3RlbmVyVHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIFwibW91c2Vkb3duXCI6XHJcbiAgICAgICAgICAgIGNhc2UgXCJtb3VzZXVwXCI6XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLm1vdXNlTGlzdGVuZXJTaGFwZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2hhcGVIZWxwZXI6IFNoYXBlSGVscGVyID0gbGlzdGVuZXIuc2hhcGVIZWxwZXI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lci50eXBlc1tsaXN0ZW5lclR5cGVdICE9IG51bGwgJiYgKHNoYXBlSGVscGVyLmNvbnRhaW5zUG9pbnQoeCwgeSkgfHwgc2hhcGVIZWxwZXIudHJhY2tNb3VzZU1vdmUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW52b2tlU2hhcGVNb3VzZUxpc3RlbmVyKGxpc3RlbmVyLCBsaXN0ZW5lclR5cGUsIHgsIHksIGJ1dHRvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIm1vdXNlZW50ZXJcIjpcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMubW91c2VMaXN0ZW5lclNoYXBlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBzaGFwZUhlbHBlcjogU2hhcGVIZWxwZXIgPSBsaXN0ZW5lci5zaGFwZUhlbHBlcjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyLnR5cGVzW2xpc3RlbmVyVHlwZV0gIT0gbnVsbCAmJiBzaGFwZUhlbHBlci5jb250YWluc1BvaW50KHgsIHkpICYmICFzaGFwZUhlbHBlci5tb3VzZUxhc3RTZWVuSW5zaWRlT2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW52b2tlU2hhcGVNb3VzZUxpc3RlbmVyKGxpc3RlbmVyLCBsaXN0ZW5lclR5cGUsIHgsIHksIGJ1dHRvbiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGVIZWxwZXIubW91c2VMYXN0U2Vlbkluc2lkZU9iamVjdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIm1vdXNlbGVhdmVcIjpcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMubW91c2VMaXN0ZW5lclNoYXBlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBzaGFwZUhlbHBlcjogU2hhcGVIZWxwZXIgPSBsaXN0ZW5lci5zaGFwZUhlbHBlcjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyLnR5cGVzW2xpc3RlbmVyVHlwZV0gIT0gbnVsbCAmJiBzaGFwZUhlbHBlci5tb3VzZUxhc3RTZWVuSW5zaWRlT2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW52b2tlU2hhcGVNb3VzZUxpc3RlbmVyKGxpc3RlbmVyLCBsaXN0ZW5lclR5cGUsIHgsIHksIGJ1dHRvbiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGVIZWxwZXIubW91c2VMYXN0U2Vlbkluc2lkZU9iamVjdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJtb3VzZW1vdmVcIjpcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMubW91c2VMaXN0ZW5lclNoYXBlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBzaGFwZUhlbHBlcjogU2hhcGVIZWxwZXIgPSBsaXN0ZW5lci5zaGFwZUhlbHBlcjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyLnR5cGVzW1wibW91c2Vtb3ZlXCJdICE9IG51bGwgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgKGxpc3RlbmVyLnR5cGVzW1wibW91c2VlbnRlclwiXSAhPSBudWxsICYmICFzaGFwZUhlbHBlci5tb3VzZUxhc3RTZWVuSW5zaWRlT2JqZWN0KSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAobGlzdGVuZXIudHlwZXNbXCJtb3VzZWxlYXZlXCJdICE9IG51bGwgJiYgc2hhcGVIZWxwZXIubW91c2VMYXN0U2Vlbkluc2lkZU9iamVjdClcclxuICAgICAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNvbnRhaW5zUG9pbnQgPSBzaGFwZUhlbHBlci5jb250YWluc1BvaW50KHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHNoYXBlSGVscGVyLnRyYWNrTW91c2VNb3ZlIHx8IGNvbnRhaW5zUG9pbnQpICYmIGxpc3RlbmVyLnR5cGVzW1wibW91c2Vtb3ZlXCJdICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW52b2tlU2hhcGVNb3VzZUxpc3RlbmVyKGxpc3RlbmVyLCBcIm1vdXNlbW92ZVwiLCB4LCB5LCBidXR0b24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250YWluc1BvaW50ICYmIGxpc3RlbmVyLnR5cGVzW1wibW91c2VlbnRlclwiXSAhPSBudWxsICYmICFzaGFwZUhlbHBlci5tb3VzZUxhc3RTZWVuSW5zaWRlT2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludm9rZVNoYXBlTW91c2VMaXN0ZW5lcihsaXN0ZW5lciwgXCJtb3VzZWVudGVyXCIsIHgsIHksIGJ1dHRvbiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlSGVscGVyLm1vdXNlTGFzdFNlZW5JbnNpZGVPYmplY3QgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjb250YWluc1BvaW50ICYmIGxpc3RlbmVyLnR5cGVzW1wibW91c2VsZWF2ZVwiXSAhPSBudWxsICYmIHNoYXBlSGVscGVyLm1vdXNlTGFzdFNlZW5JbnNpZGVPYmplY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW52b2tlU2hhcGVNb3VzZUxpc3RlbmVyKGxpc3RlbmVyLCBcIm1vdXNlbGVhdmVcIiwgeCwgeSwgYnV0dG9uLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGVIZWxwZXIubW91c2VMYXN0U2Vlbkluc2lkZU9iamVjdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaW52b2tlU2hhcGVNb3VzZUxpc3RlbmVyKGxpc3RlbmVyOiBNb3VzZUxpc3RlbmVyU2hhcGVEYXRhLCBsaXN0ZW5lclR5cGU6IHN0cmluZyxcclxuICAgICAgICB4OiBudW1iZXIsIHk6IG51bWJlciwgYnV0dG9uOiBudW1iZXIsIGNhbGxiYWNrPzogKCkgPT4gdm9pZCkge1xyXG5cclxuICAgICAgICBpZiAoIWxpc3RlbmVyLnNoYXBlSGVscGVyLnJlYWN0VG9Nb3VzZUV2ZW50c1doZW5JbnZpc2libGUgJiZcclxuICAgICAgICAgICAgIWxpc3RlbmVyLnNoYXBlSGVscGVyLmRpc3BsYXlPYmplY3QudmlzaWJsZSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgbWV0aG9kID0gbGlzdGVuZXIubWV0aG9kc1tsaXN0ZW5lclR5cGVdO1xyXG4gICAgICAgIGxldCBwcm9ncmFtID0gbWV0aG9kLnByb2dyYW07XHJcbiAgICAgICAgbGV0IGludm9rZSA9IG1ldGhvZC5pbnZva2U7XHJcblxyXG4gICAgICAgIGxldCBydG8gPSBsaXN0ZW5lci5zaGFwZUhlbHBlci5ydW50aW1lT2JqZWN0O1xyXG5cclxuICAgICAgICBsZXQgc3RhY2tFbGVtZW50czogVmFsdWVbXSA9IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogcnRvLmNsYXNzLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJ0b1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHhcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiB5XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICBpZiAobGlzdGVuZXJUeXBlICE9IFwibW91c2Vtb3ZlXCIgJiYgbGlzdGVuZXJUeXBlICE9IFwibW91c2VlbnRlclwiICYmIGxpc3RlbmVyVHlwZSAhPSBcIm1vdXNlbGVhdmVcIikge1xyXG4gICAgICAgICAgICBzdGFja0VsZW1lbnRzLnB1c2goXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogaW50UHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogYnV0dG9uXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwcm9ncmFtICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci5ydW5UaW1lcihtZXRob2QsIHN0YWNrRWxlbWVudHMsIGNhbGxiYWNrLCBmYWxzZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChpbnZva2UgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBpbnZva2UoW10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgYWRkTW91c2VMaXN0ZW5lcihsaXN0ZW5lcjogUnVudGltZU9iamVjdCkge1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAgICBJZiBhIHNoYXBlIGlzIHJlZ2lzdGVyZWQgYXMgTW91c2VMaXN0ZW5lciBvZiB0aGUgd29ybGQtb2JqZWN0LCBpdCBnZXRzIGFsbCBtb3VzZS1ldmVudHMgdHdpY2UuIFxyXG4gICAgICAgICAgICA9PiBEZXJlZ2lzdGVyIHNoYXBlIGFzIG1vdXNlTGlzdGVuZXJTaGFwZSBhbmQgcmVnaXN0ZXIgaXQgYXMgbW91c2UgbGlzdGVuZXIgZm9yIHRoZSB3b3JsZCBvYmplY3QuXHJcbiAgICAgICAgKi9cclxuICAgICAgICBsZXQgaW5kZXg6IG51bWJlciA9IHRoaXMubW91c2VMaXN0ZW5lclNoYXBlcy5maW5kSW5kZXgoKG1scykgPT4geyByZXR1cm4gbWxzLnNoYXBlSGVscGVyLnJ1bnRpbWVPYmplY3QgPT0gbGlzdGVuZXIgfSk7XHJcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcclxuICAgICAgICAgICAgdGhpcy5tb3VzZUxpc3RlbmVyU2hhcGVzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbGlzdGVuZXJUeXBlcyA9IFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIk1vdXNlVXBcIiwgc2lnbmF0dXJlOiBcIihkb3VibGUsIGRvdWJsZSwgaW50KVwiIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJNb3VzZURvd25cIiwgc2lnbmF0dXJlOiBcIihkb3VibGUsIGRvdWJsZSwgaW50KVwiIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJNb3VzZU1vdmVcIiwgc2lnbmF0dXJlOiBcIihkb3VibGUsIGRvdWJsZSlcIiB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiTW91c2VFbnRlclwiLCBzaWduYXR1cmU6IFwiKGRvdWJsZSwgZG91YmxlKVwiIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJNb3VzZUxlYXZlXCIsIHNpZ25hdHVyZTogXCIoZG91YmxlLCBkb3VibGUpXCIgfSxcclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICBsZXQgc2Q6IE1vdXNlTGlzdGVuZXJEYXRhID0gbnVsbDtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbHQgb2YgbGlzdGVuZXJUeXBlcykge1xyXG4gICAgICAgICAgICBsZXQgbWV0aG9kOiBNZXRob2QgPSAoPEtsYXNzPmxpc3RlbmVyLmNsYXNzKS5nZXRNZXRob2RCeVNpZ25hdHVyZShcIm9uXCIgKyBsdC5pZGVudGlmaWVyICsgbHQuc2lnbmF0dXJlKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtZXRob2Q/LnByb2dyYW0gIT0gbnVsbCAmJiBtZXRob2QucHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCA+IDIgfHwgbWV0aG9kPy5pbnZva2UgIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzZCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyOiBsaXN0ZW5lcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZXM6IHt9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2RzOiB7fVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZUxpc3RlbmVycy5wdXNoKHNkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzZC50eXBlc1tsdC5pZGVudGlmaWVyLnRvTG93ZXJDYXNlKCldID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHNkLm1ldGhvZHNbbHQuaWRlbnRpZmllci50b0xvd2VyQ2FzZSgpXSA9IG1ldGhvZDtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBpbnZva2VNb3VzZUxpc3RlbmVyKGxpc3RlbmVyOiBNb3VzZUxpc3RlbmVyRGF0YSwgbGlzdGVuZXJUeXBlOiBzdHJpbmcsXHJcbiAgICAgICAgeDogbnVtYmVyLCB5OiBudW1iZXIsIGJ1dHRvbjogbnVtYmVyLCBjYWxsYmFjaz86ICgpID0+IHZvaWQpIHtcclxuXHJcbiAgICAgICAgbGV0IG1ldGhvZCA9IGxpc3RlbmVyLm1ldGhvZHNbbGlzdGVuZXJUeXBlXTtcclxuICAgICAgICBsZXQgcHJvZ3JhbSA9IG1ldGhvZC5wcm9ncmFtO1xyXG4gICAgICAgIGxldCBpbnZva2UgPSBtZXRob2QuaW52b2tlO1xyXG5cclxuICAgICAgICBsZXQgcnRvID0gbGlzdGVuZXIubGlzdGVuZXI7XHJcblxyXG4gICAgICAgIGxldCBzdGFja0VsZW1lbnRzOiBWYWx1ZVtdID0gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBydG8uY2xhc3MsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogcnRvXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogeFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgIGlmIChsaXN0ZW5lclR5cGUgIT0gXCJtb3VzZW1vdmVcIiAmJiBsaXN0ZW5lclR5cGUgIT0gXCJtb3VzZWVudGVyXCIgJiYgbGlzdGVuZXJUeXBlICE9IFwibW91c2VsZWF2ZVwiKSB7XHJcbiAgICAgICAgICAgIHN0YWNrRWxlbWVudHMucHVzaChcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBidXR0b25cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHByb2dyYW0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnJ1blRpbWVyKG1ldGhvZCwgc3RhY2tFbGVtZW50cywgY2FsbGJhY2ssIGZhbHNlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGludm9rZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGludm9rZShbXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbn0iXX0=