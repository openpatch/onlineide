import { Klass } from "../../compiler/types/Class.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { doublePrimitiveType, intPrimitiveType, voidPrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { InterpreterState } from "../../interpreter/Interpreter.js";
import { ColorHelper } from "./ColorHelper.js";
export class WorldClass extends Klass {
    constructor(module) {
        super("World", module, "Grafische Zeichenfläche mit Koordinatensystem");
        this.module = module;
        this.setBaseClass(module.typeStore.getType("Object"));
        let groupType = module.typeStore.getType("Group");
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
            let matrix = new PIXI.Matrix().copyFrom(wh.stage.localTransform);
            wh.stage.localTransform.identity();
            wh.stage.localTransform.translate(x, y);
            wh.stage.localTransform.prepend(matrix);
            // wh.stage.localTransform.translate(x,y);
            wh.stage.transform.onChange();
        }, false, false, 'Verschiebt alle Objekte der Welt um x nach rechts und y nach unten.', false));
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
            let matrix = new PIXI.Matrix().copyFrom(wh.stage.localTransform);
            wh.stage.localTransform.identity();
            wh.stage.localTransform.translate(-x, -y);
            wh.stage.localTransform.rotate(-angle / 180 * Math.PI);
            wh.stage.localTransform.translate(x, y);
            wh.stage.localTransform.prepend(matrix);
            // wh.stage.localTransform.translate(-x, -y);
            // wh.stage.localTransform.rotate(-angle / 180 * Math.PI);
            // wh.stage.localTransform.translate(x, y);
            wh.stage.transform.onChange();
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
            let matrix = new PIXI.Matrix().copyFrom(wh.stage.localTransform);
            wh.stage.localTransform.identity();
            wh.stage.localTransform.translate(-x, -y);
            wh.stage.localTransform.scale(factor, factor);
            wh.stage.localTransform.translate(x, y);
            wh.stage.localTransform.prepend(matrix);
            // wh.stage.localTransform.translate(-x, -y);
            // wh.stage.localTransform.scale(factor, factor);
            // wh.stage.localTransform.translate(x, y);
            wh.stage.transform.onChange();
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
            wh.stage.localTransform.identity(); // coordinate system (0/0) to (initialWidth/initialHeight)
            wh.stage.localTransform.translate(-left, -top);
            wh.stage.localTransform.scale(wh.initialWidth / width, wh.initialHeight / height);
            // wh.stage.localTransform.translate(x, y);
            wh.stage.transform.onChange();
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
            return Math.round(wh.width);
        }, false, false, 'Gibt die "Breite" des Grafikbereichs zurück, genauer: die x-Koordinate am rechten Rand.', false));
        this.addMethod(new Method("getHeight", new Parameterlist([]), intPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let wh = o.intrinsicData["World"];
            return Math.round(wh.height);
        }, false, false, 'Gibt die "Höhe" des Grafikbereichs zurück, genauer: die y-Koordinate am unteren Rand.', false));
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
                wh.stage.localTransform.scale(wh.width / breite, wh.height / höhe);
                wh.width = breite;
                wh.height = höhe;
                // this.stage.localTransform.rotate(45/180*Math.PI);
                // this.stage.localTransform.translate(400,300);
                wh.stage.transform.onChange();
                (_d = this.module.main.getRightDiv()) === null || _d === void 0 ? void 0 : _d.adjustWidthToWorld();
            }
            return wh;
        }
        else {
            return new WorldHelper(breite, höhe, this.module, worldObject);
        }
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
        this.shapes = []; // all non-group-shapes (for GNG-Library collision-Functions)
        this.actorsNotFinished = 0;
        this.ticks = 0;
        this.deltaSum = 0;
        this.spriteAnimations = [];
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
        this.initialHeight = height;
        this.initialWidth = width;
        this.interpreter = (_b = (_a = this.module) === null || _a === void 0 ? void 0 : _a.main) === null || _b === void 0 ? void 0 : _b.getInterpreter();
        if (this.interpreter.processingHelper != null) {
            this.interpreter.throwException("Die herkömmliche Grafikausgabe kann nicht zusammen mit Processing genutzt werden.");
        }
        if (this.interpreter.worldHelper != null) {
            this.interpreter.throwException("Es darf nur ein World-Objekt instanziert werden.");
        }
        this.interpreter.worldHelper = this;
        this.$containerOuter = jQuery('<div></div>');
        let $graphicsDiv = this.module.main.getInterpreter().printManager.getGraphicsDiv();
        this.$coordinateDiv = this.module.main.getRightDiv().$rightDiv.find(".jo_coordinates");
        let f = () => {
            let $jo_tabs = $graphicsDiv.parents(".jo_tabs");
            let maxWidth = $jo_tabs.width();
            let maxHeight = $jo_tabs.height();
            // let maxWidth: number = $graphicsDiv.parent().width();
            // let maxHeight: number = $graphicsDiv.parent().height();
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
        this.$containerInner = jQuery('<div></div>');
        this.$containerOuter.append(this.$containerInner);
        $graphicsDiv.append(this.$containerOuter);
        $graphicsDiv.show();
        $graphicsDiv[0].oncontextmenu = function (e) {
            e.preventDefault();
        };
        PIXI.settings.TARGET_FPMS = 30.0 / 1000.0;
        this.app = new PIXI.Application({
            antialias: true,
            width: width, height: height,
        });
        let that = this;
        // let i = 0;
        this.tickerFunction = (delta) => {
            // if (i++ % 2 == 0) 
            that.tick(PIXI.Ticker.shared.elapsedMS);
        };
        this.app.ticker.add(this.tickerFunction);
        this.app.ticker.maxFPS = 30;
        this.interpreter.timerExtern = true;
        this.stage = new PIXI.Container();
        this.app.stage.addChild(this.stage);
        this.$containerInner.append(this.app.view);
        // this.stage.localTransform.translate(-400, -300);
        // this.stage.localTransform.rotate(-45/180*Math.PI);
        // this.stage.localTransform.translate(400,300);
        // this.stage.transform.onChange();
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
                let p = new PIXI.Point(x, y);
                this.stage.localTransform.applyInverse(p, p);
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
            let p = new PIXI.Point(x, y);
            this.stage.localTransform.applyInverse(p, p);
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
    setCursor(cursor) {
        this.$containerInner.css('cursor', cursor);
    }
    tick(delta) {
        var _a;
        this.summedDelta += delta;
        for (let spriteHelper of this.spriteAnimations) {
            spriteHelper.tick(delta);
        }
        if (this.interpreter != null) {
            switch (this.interpreter.state) {
                case InterpreterState.running:
                    if (!this.actorsFinished) {
                        this.actorsNotFinished++;
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
        }
        this.summedDelta = 0;
        if (this.interpreter.state == InterpreterState.running) {
            if (this.actActors.length > 0) {
                this.interpreter.timerFunction(33.33, true, 0.5);
                this.interpreter.timerStopped = false;
                this.interpreter.timerFunction(33.33, false, 0.08);
            }
            else {
                this.interpreter.timerFunction(33.33, false, 0.7);
            }
        }
        while (this.actorHelpersToDestroy.length > 0) {
            let actorHelper = this.actorHelpersToDestroy.pop();
            // actActors: ActorData[] = [];
            // keyPressedActors: ActorData[] = [];
            // actorHelpersToDestroy: ActorHelper[] = [];
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
        let c = ColorHelper.parseColorToOpenGL(color);
        this.app.renderer.backgroundColor = c.color;
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
    destroyWorld() {
        for (let listenerType of ["mouseup", "mousedown", "mousemove", "mouseenter", "mouseleave"]) {
            this.$containerInner.off(listenerType);
        }
        this.spriteAnimations = [];
        this.app.ticker.remove(this.tickerFunction);
        this.app.destroy();
        this.$containerOuter.remove();
        this.module.main.getInterpreter().printManager.getGraphicsDiv().hide();
        this.interpreter.timerExtern = false;
        this.interpreter.worldHelper = null;
        this.$coordinateDiv.hide();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV29ybGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY2xpZW50L3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1dvcmxkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxLQUFLLEVBQWMsTUFBTSwrQkFBK0IsQ0FBQztBQUNsRSxPQUFPLEVBQWEsTUFBTSxFQUFFLGFBQWEsRUFBUyxNQUFNLCtCQUErQixDQUFDO0FBQ3hGLE9BQU8sRUFBRSxtQkFBbUIsRUFBc0IsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUUsbUJBQW1CLEVBQXdCLE1BQU0sd0NBQXdDLENBQUM7QUFHakwsT0FBTyxFQUFFLGdCQUFnQixFQUFlLE1BQU0sa0NBQWtDLENBQUM7QUFJakYsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBTS9DLE1BQU0sT0FBTyxVQUFXLFNBQVEsS0FBSztJQUVqQyxZQUFtQixNQUFjO1FBRTdCLEtBQUssQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLCtDQUErQyxDQUFDLENBQUE7UUFGeEQsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUk3QixJQUFJLENBQUMsWUFBWSxDQUFRLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFFN0QsSUFBSSxTQUFTLEdBQWUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDOUQsSUFBSSxpQkFBaUIsR0FBMkIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7UUFFMUYsOEpBQThKO1FBRTlKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksYUFBYSxDQUFDO1lBQ2pELEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxj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Q0ksSUFBSSxFQUFFLG1CQUFtQjtnQkFDekIsS0FBSyxFQUFFLENBQUM7YUFDWDtZQUNEO2dCQUNJLElBQUksRUFBRSxtQkFBbUI7Z0JBQ3pCLEtBQUssRUFBRSxDQUFDO2FBQ1g7U0FDSixDQUFDO1FBRUYsSUFBSSxZQUFZLElBQUksV0FBVyxJQUFJLFlBQVksSUFBSSxZQUFZLElBQUksWUFBWSxJQUFJLFlBQVksRUFBRTtZQUM3RixhQUFhLENBQUMsSUFBSSxDQUNkO2dCQUNJLElBQUksRUFBRSxnQkFBZ0I7Z0JBQ3RCLEtBQUssRUFBRSxNQUFNO2FBQ2hCLENBQUMsQ0FBQztTQUNWO1FBRUQsSUFBSSxPQUFPLElBQUksSUFBSSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3JFO2FBQU0sSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFO1lBQ3ZCLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUNkO0lBRUwsQ0FBQztDQUVKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgS2xhc3MsIFZpc2liaWxpdHkgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgQXR0cmlidXRlLCBNZXRob2QsIFBhcmFtZXRlcmxpc3QsIFZhbHVlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL1R5cGVzLmpzXCI7XHJcbmltcG9ydCB7IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGZsb2F0UHJpbWl0aXZlVHlwZSwgaW50UHJpbWl0aXZlVHlwZSwgdm9pZFByaW1pdGl2ZVR5cGUsIHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGJvb2xlYW5QcmltaXRpdmVUeXBlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL1ByaW1pdGl2ZVR5cGVzLmpzXCI7XHJcbmltcG9ydCB7IFJ1bnRpbWVPYmplY3QgfSBmcm9tIFwiLi4vLi4vaW50ZXJwcmV0ZXIvUnVudGltZU9iamVjdC5qc1wiO1xyXG5pbXBvcnQgeyBBY3RvckhlbHBlciB9IGZyb20gXCIuL0FjdG9yLmpzXCI7XHJcbmltcG9ydCB7IEludGVycHJldGVyU3RhdGUsIEludGVycHJldGVyIH0gZnJvbSBcIi4uLy4uL2ludGVycHJldGVyL0ludGVycHJldGVyLmpzXCI7XHJcbmltcG9ydCB7IFNoYXBlSGVscGVyIH0gZnJvbSBcIi4vU2hhcGUuanNcIjtcclxuaW1wb3J0IHsgS2V5Ym9hcmRUb29sIH0gZnJvbSBcIi4uLy4uL3Rvb2xzL0tleWJvYXJkVG9vbC5qc1wiO1xyXG5pbXBvcnQgeyBTcHJpdGVIZWxwZXIgfSBmcm9tIFwiLi9TcHJpdGUuanNcIjtcclxuaW1wb3J0IHsgQ29sb3JIZWxwZXIgfSBmcm9tIFwiLi9Db2xvckhlbHBlci5qc1wiO1xyXG5pbXBvcnQgeyBQb2ludCB9IGZyb20gXCJwaXhpLmpzXCI7XHJcbmltcG9ydCB7IFB1bmt0IH0gZnJvbSBcIi4uLy4uL3Rvb2xzL01hdGhlVG9vbHMuanNcIjtcclxuaW1wb3J0IHsgR3JvdXBDbGFzcywgR3JvdXBIZWxwZXIgfSBmcm9tIFwiLi9Hcm91cC5qc1wiO1xyXG5pbXBvcnQgeyBNb3VzZUxpc3RlbmVySW50ZXJmYWNlIH0gZnJvbSBcIi4vTW91c2VMaXN0ZW5lci5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFdvcmxkQ2xhc3MgZXh0ZW5kcyBLbGFzcyB7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIG1vZHVsZTogTW9kdWxlKSB7XHJcblxyXG4gICAgICAgIHN1cGVyKFwiV29ybGRcIiwgbW9kdWxlLCBcIkdyYWZpc2NoZSBaZWljaGVuZmzDpGNoZSBtaXQgS29vcmRpbmF0ZW5zeXN0ZW1cIilcclxuXHJcbiAgICAgICAgdGhpcy5zZXRCYXNlQ2xhc3MoPEtsYXNzPm1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShcIk9iamVjdFwiKSk7XHJcblxyXG4gICAgICAgIGxldCBncm91cFR5cGUgPSA8R3JvdXBDbGFzcz5tb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJHcm91cFwiKTtcclxuICAgICAgICBsZXQgbW91c2VMaXN0ZW5lclR5cGUgPSA8TW91c2VMaXN0ZW5lckludGVyZmFjZT5tb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJNb3VzZUxpc3RlbmVyXCIpO1xyXG5cclxuICAgICAgICAvLyB0aGlzLmFkZEF0dHJpYnV0ZShuZXcgQXR0cmlidXRlKFwiUElcIiwgZG91YmxlUHJpbWl0aXZlVHlwZSwgKG9iamVjdCkgPT4geyByZXR1cm4gTWF0aC5QSSB9LCB0cnVlLCBWaXNpYmlsaXR5LnB1YmxpYywgdHJ1ZSwgXCJEaWUgS3JlaXN6YWhsIFBpICgzLjE0MTUuLi4pXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIldvcmxkXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImJyZWl0ZVwiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImjDtmhlXCIsIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBicmVpdGU6IG51bWJlciA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgaMO2aGU6IG51bWJlciA9IHBhcmFtZXRlcnNbMl0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgZ2g6IFdvcmxkSGVscGVyID0gdGhpcy5nZXRXb3JsZEhlbHBlcihvLCBicmVpdGUsIGjDtmhlKTsgIC8vbmV3IFdvcmxkSGVscGVyKGJyZWl0ZSwgaMO2aGUsIHRoaXMubW9kdWxlLCBvKTtcclxuICAgICAgICAgICAgICAgIG8uaW50cmluc2ljRGF0YVtcIldvcmxkXCJdID0gZ2g7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsIFwiTGVndCBlaW5lbiBuZXVlbiBHcmFmaWtiZXJlaWNoICg9J1dlbHQnKSBhblwiLCB0cnVlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJXb3JsZFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIG51bGwsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGdoOiBXb3JsZEhlbHBlciA9IHRoaXMuZ2V0V29ybGRIZWxwZXIobyk7IC8vIG5ldyBXb3JsZEhlbHBlcig4MDAsIDYwMCwgdGhpcy5tb2R1bGUsIG8pO1xyXG4gICAgICAgICAgICAgICAgby5pbnRyaW5zaWNEYXRhW1wiV29ybGRcIl0gPSBnaDtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgXCJMZWd0IGVpbmVuIG5ldWVuIEdyYWZpa2JlcmVpY2ggKD0nV2VsdCcpIGFuLiBEYXMgS29vcmRpbmF0ZW5zeXN0ZW0gZ2VodCB2b24gMCBiaXMgODAwIGluIHgtUmljaHR1bmcgdW5kIHZvbiAwIC0gNjAwIGluIHktUmljaHR1bmcuXCIsIHRydWUpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInNldEJhY2tncm91bmRDb2xvclwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJjb2xvckFzUkdCQVN0cmluZ1wiLCB0eXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgdm9pZFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbG9yOiBzdHJpbmcgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHdoOiBXb3JsZEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIldvcmxkXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIHdoLnNldEJhY2tncm91bmRDb2xvcihjb2xvcik7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdTZXR6dCBkaWUgSGludGVyZ3J1bmRmYXJiZS4gRGllIEZhcmJlIGlzdCBlbnR3ZWRlciBlaW5lIHZvcmRlZmluaWVydGUgRmFyYmUgKFwic2Nod2FyelwiLCBcInJvdFwiLCAuLi4pIG9kZXIgZWluZSBjc3MtRmFyYmUgZGVyIEFydCBcIiNmZmE3YjNcIiAob2huZSBhbHBoYSksIFwiI2ZmYTdiMzgwXCIgKG1pdCBhbHBoYSksIFwicmdiKDE3MiwgMjIsIDE4KVwiIG9kZXIgXCJyZ2JhKDEyMywgMjIsMTgsIDAuMylcIicsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJtb3ZlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInhcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ5XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgeDogbnVtYmVyID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB5OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzJdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHdoOiBXb3JsZEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIldvcmxkXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBtYXRyaXggPSBuZXcgUElYSS5NYXRyaXgoKS5jb3B5RnJvbSh3aC5zdGFnZS5sb2NhbFRyYW5zZm9ybSk7XHJcbiAgICAgICAgICAgICAgICB3aC5zdGFnZS5sb2NhbFRyYW5zZm9ybS5pZGVudGl0eSgpO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0udHJhbnNsYXRlKHgseSk7XHJcbiAgICAgICAgICAgICAgICB3aC5zdGFnZS5sb2NhbFRyYW5zZm9ybS5wcmVwZW5kKG1hdHJpeCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0udHJhbnNsYXRlKHgseSk7XHJcbiAgICAgICAgICAgICAgICB3aC5zdGFnZS50cmFuc2Zvcm0ub25DaGFuZ2UoKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ1ZlcnNjaGllYnQgYWxsZSBPYmpla3RlIGRlciBXZWx0IHVtIHggbmFjaCByZWNodHMgdW5kIHkgbmFjaCB1bnRlbi4nLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwicm90YXRlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImFuZ2xlSW5EZWdcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ4XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwieVwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgdm9pZFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFuZ2xlOiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHg6IG51bWJlciA9IHBhcmFtZXRlcnNbMl0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgeTogbnVtYmVyID0gcGFyYW1ldGVyc1szXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB3aDogV29ybGRIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJXb3JsZFwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbWF0cml4ID0gbmV3IFBJWEkuTWF0cml4KCkuY29weUZyb20od2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0pO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0uaWRlbnRpdHkoKTtcclxuICAgICAgICAgICAgICAgIHdoLnN0YWdlLmxvY2FsVHJhbnNmb3JtLnRyYW5zbGF0ZSgteCwgLXkpO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0ucm90YXRlKC1hbmdsZSAvIDE4MCAqIE1hdGguUEkpO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0udHJhbnNsYXRlKHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0ucHJlcGVuZChtYXRyaXgpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIHdoLnN0YWdlLmxvY2FsVHJhbnNmb3JtLnRyYW5zbGF0ZSgteCwgLXkpO1xyXG4gICAgICAgICAgICAgICAgLy8gd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0ucm90YXRlKC1hbmdsZSAvIDE4MCAqIE1hdGguUEkpO1xyXG4gICAgICAgICAgICAgICAgLy8gd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0udHJhbnNsYXRlKHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UudHJhbnNmb3JtLm9uQ2hhbmdlKCk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdSb3RpZXJ0IGRpZSBXZWx0IHVtIGRlbiBhbmdlZ2ViZW5lbiBXaW5rZWwgaW0gVXJ6ZWlnZXJzaW5uLiBEcmVocHVua3QgaXN0IGRlciBQdW5rdCAoeC95KS4nLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwic2NhbGVcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiZmFjdG9yXCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwieFwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInlcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgXSksIHZvaWRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBmYWN0b3I6IG51bWJlciA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgeDogbnVtYmVyID0gcGFyYW1ldGVyc1syXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB5OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzNdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHdoOiBXb3JsZEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIldvcmxkXCJdO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbWF0cml4ID0gbmV3IFBJWEkuTWF0cml4KCkuY29weUZyb20od2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0pO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0uaWRlbnRpdHkoKTtcclxuICAgICAgICAgICAgICAgIHdoLnN0YWdlLmxvY2FsVHJhbnNmb3JtLnRyYW5zbGF0ZSgteCwgLXkpO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0uc2NhbGUoZmFjdG9yLCBmYWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0udHJhbnNsYXRlKHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0ucHJlcGVuZChtYXRyaXgpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIHdoLnN0YWdlLmxvY2FsVHJhbnNmb3JtLnRyYW5zbGF0ZSgteCwgLXkpO1xyXG4gICAgICAgICAgICAgICAgLy8gd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0uc2NhbGUoZmFjdG9yLCBmYWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgLy8gd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0udHJhbnNsYXRlKHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UudHJhbnNmb3JtLm9uQ2hhbmdlKCk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdTdHJlY2t0IGRpZSBXZWx0IHVtIGRlbiBhbmdlZ2ViZW5lbiBGYWt0b3IuIFplbnRydW0gZGVyIFN0cmVja3VuZyBpc3QgKHgveSkuJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInNldENvb3JkaW5hdGVTeXN0ZW1cIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwibGVmdFwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInRvcFwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIndpZHRoXCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiaGVpZ2h0XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgbGVmdDogbnVtYmVyID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB0b3A6IG51bWJlciA9IHBhcmFtZXRlcnNbMl0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgd2lkdGg6IG51bWJlciA9IHBhcmFtZXRlcnNbM10udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgaGVpZ2h0OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzRdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHdoOiBXb3JsZEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIldvcmxkXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIHdoLnN0YWdlLmxvY2FsVHJhbnNmb3JtLmlkZW50aXR5KCk7ICAgICAvLyBjb29yZGluYXRlIHN5c3RlbSAoMC8wKSB0byAoaW5pdGlhbFdpZHRoL2luaXRpYWxIZWlnaHQpXHJcbiAgICAgICAgICAgICAgICB3aC5zdGFnZS5sb2NhbFRyYW5zZm9ybS50cmFuc2xhdGUoLWxlZnQsIC10b3ApO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0uc2NhbGUod2guaW5pdGlhbFdpZHRoL3dpZHRoLCB3aC5pbml0aWFsSGVpZ2h0L2hlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gd2guc3RhZ2UubG9jYWxUcmFuc2Zvcm0udHJhbnNsYXRlKHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgd2guc3RhZ2UudHJhbnNmb3JtLm9uQ2hhbmdlKCk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdTdHJlY2t0IGRpZSBXZWx0IHVtIGRlbiBhbmdlZ2ViZW5lbiBGYWt0b3IuIFplbnRydW0gZGVyIFN0cmVja3VuZyBpc3QgKHgveSkuJywgZmFsc2UpKTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJzZXREZWZhdWx0R3JvdXBcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiZ3JvdXBcIiwgdHlwZTogZ3JvdXBUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgdm9pZFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGdyb3VwOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB3aDogV29ybGRIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJXb3JsZFwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICB3aC5kZWZhdWx0R3JvdXAgPSBncm91cCA9PSBudWxsID8gbnVsbCA6IGdyb3VwLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0xlZ3QgZWluZSBHcnVwcGUgZmVzdCwgenUgZGVyIGFiIGpldHp0IGFsbGUgbmV1ZW4gT2JqZWt0ZSBhdXRvbWF0aXNjaCBoaW56dWdlZsO8Z3Qgd2VyZGVuLiBGYWxscyBudWxsIGFuZ2VnZWJlbiB3aXJkLCB3ZXJkZW4gbmV1ZSBPYmpla3RlIHp1IGtlaW5lciBHcnVwcGUgYXV0b21hdGlzY2ggaGluenVnZWbDvGd0LicsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJhZGRNb3VzZUxpc3RlbmVyXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImxpc3RlbmVyXCIsIHR5cGU6IG1vdXNlTGlzdGVuZXJUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgdm9pZFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGxpc3RlbmVyOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB3aDogV29ybGRIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJXb3JsZFwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICB3aC5hZGRNb3VzZUxpc3RlbmVyKGxpc3RlbmVyKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0bDvGd0IGVpbmVuIG5ldWVuIE1vdXNlTGlzdGVuZXIgaGluenUsIGRlc3NlbiBNZXRob2RlbiBiZWkgTWF1c2VyZWlnbmlzc2VuIGF1ZmdlcnVmZW4gd2VyZGVuLicsIGZhbHNlKSk7XHJcblxyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiZ2V0V2lkdGhcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCBpbnRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB3aDogV29ybGRIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJXb3JsZFwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh3aC53aWR0aCk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdHaWJ0IGRpZSBcIkJyZWl0ZVwiIGRlcyBHcmFmaWtiZXJlaWNocyB6dXLDvGNrLCBnZW5hdWVyOiBkaWUgeC1Lb29yZGluYXRlIGFtIHJlY2h0ZW4gUmFuZC4nLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiZ2V0SGVpZ2h0XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICBdKSwgaW50UHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgd2g6IFdvcmxkSGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiV29ybGRcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQod2guaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0dpYnQgZGllIFwiSMO2aGVcIiBkZXMgR3JhZmlrYmVyZWljaHMgenVyw7xjaywgZ2VuYXVlcjogZGllIHktS29vcmRpbmF0ZSBhbSB1bnRlcmVuIFJhbmQuJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInNldEN1cnNvclwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJjdXJzb3JcIiwgdHlwZTogc3RyaW5nUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgXSksIG51bGwsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHdoOiBXb3JsZEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIldvcmxkXCJdO1xyXG4gICAgICAgICAgICAgICAgbGV0IGN1cnNvcjogc3RyaW5nID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICB3aC5zZXRDdXJzb3IoY3Vyc29yKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ8OEbmRlcnQgZGllIEZvcm0gZGVzIE1hdXNjdXJzb3JzIGltIGdlc2FtdGVuIEdyYWZpa2JlcmVpY2guIE3DtmdpY2hlIFdlcnRlOiBzaWVoZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kZS9kb2NzL1dlYi9DU1MvY3Vyc29yLicsIGZhbHNlKSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXRXb3JsZEhlbHBlcih3b3JsZE9iamVjdDogUnVudGltZU9iamVjdCwgYnJlaXRlOiBudW1iZXIgPSA4MDAsIGjDtmhlOiBudW1iZXIgPSA2MDApOiBXb3JsZEhlbHBlciB7XHJcblxyXG4gICAgICAgIGxldCB3aCA9IHRoaXMubW9kdWxlPy5tYWluPy5nZXRJbnRlcnByZXRlcigpPy53b3JsZEhlbHBlcjtcclxuXHJcblxyXG4gICAgICAgIGlmICh3aCAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAod2gud2lkdGggIT0gYnJlaXRlIHx8IHdoLmhlaWdodCAhPSBow7ZoZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCByYXRpbzogbnVtYmVyID0gTWF0aC5yb3VuZChow7ZoZSAvIGJyZWl0ZSAqIDEwMCk7XHJcbiAgICAgICAgICAgICAgICB3aC4kY29udGFpbmVyT3V0ZXIuY3NzKCdwYWRkaW5nLWJvdHRvbScsIHJhdGlvICsgXCIlXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHdoLnN0YWdlLmxvY2FsVHJhbnNmb3JtLnNjYWxlKHdoLndpZHRoIC8gYnJlaXRlLCB3aC5oZWlnaHQgLyBow7ZoZSk7XHJcbiAgICAgICAgICAgICAgICB3aC53aWR0aCA9IGJyZWl0ZTtcclxuICAgICAgICAgICAgICAgIHdoLmhlaWdodCA9IGjDtmhlO1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5zdGFnZS5sb2NhbFRyYW5zZm9ybS5yb3RhdGUoNDUvMTgwKk1hdGguUEkpO1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5zdGFnZS5sb2NhbFRyYW5zZm9ybS50cmFuc2xhdGUoNDAwLDMwMCk7XHJcbiAgICAgICAgICAgICAgICB3aC5zdGFnZS50cmFuc2Zvcm0ub25DaGFuZ2UoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZHVsZS5tYWluLmdldFJpZ2h0RGl2KCk/LmFkanVzdFdpZHRoVG9Xb3JsZCgpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHdoO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFdvcmxkSGVscGVyKGJyZWl0ZSwgaMO2aGUsIHRoaXMubW9kdWxlLCB3b3JsZE9iamVjdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcblxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBNb3VzZUxpc3RlbmVyU2hhcGVEYXRhID0ge1xyXG4gICAgc2hhcGVIZWxwZXI6IFNoYXBlSGVscGVyLFxyXG4gICAgdHlwZXM6IHsgW3R5cGU6IHN0cmluZ106IGJvb2xlYW4gfSxcclxuICAgIG1ldGhvZHM6IHsgW3R5cGU6IHN0cmluZ106IE1ldGhvZCB9XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIE1vdXNlTGlzdGVuZXJEYXRhID0ge1xyXG4gICAgbGlzdGVuZXI6IFJ1bnRpbWVPYmplY3QsXHJcbiAgICB0eXBlczogeyBbdHlwZTogc3RyaW5nXTogYm9vbGVhbiB9LFxyXG4gICAgbWV0aG9kczogeyBbdHlwZTogc3RyaW5nXTogTWV0aG9kIH1cclxufVxyXG5cclxuZXhwb3J0IHR5cGUgQWN0b3JEYXRhID0ge1xyXG4gICAgYWN0b3JIZWxwZXI6IEFjdG9ySGVscGVyLFxyXG4gICAgbWV0aG9kOiBNZXRob2RcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFdvcmxkSGVscGVyIHtcclxuXHJcbiAgICAkY29udGFpbmVyT3V0ZXI6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICAkY29udGFpbmVySW5uZXI6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICBhcHA6IFBJWEkuQXBwbGljYXRpb247XHJcbiAgICBzdGFnZTogUElYSS5Db250YWluZXI7XHJcblxyXG4gICAgYWN0QWN0b3JzOiBBY3RvckRhdGFbXSA9IFtdO1xyXG4gICAga2V5UHJlc3NlZEFjdG9yczogQWN0b3JEYXRhW10gPSBbXTtcclxuICAgIGtleVVwQWN0b3JzOiBBY3RvckRhdGFbXSA9IFtdO1xyXG4gICAga2V5RG93bkFjdG9yczogQWN0b3JEYXRhW10gPSBbXTtcclxuICAgIGFjdG9ySGVscGVyc1RvRGVzdHJveTogQWN0b3JIZWxwZXJbXSA9IFtdO1xyXG5cclxuICAgIG1vdXNlTGlzdGVuZXJTaGFwZXM6IE1vdXNlTGlzdGVuZXJTaGFwZURhdGFbXSA9IFtdO1xyXG4gICAgbW91c2VMaXN0ZW5lcnM6IE1vdXNlTGlzdGVuZXJEYXRhW10gPSBbXTtcclxuXHJcbiAgICBpbnRlcnByZXRlcjogSW50ZXJwcmV0ZXI7XHJcbiAgICBhY3RvcnNGaW5pc2hlZDogYm9vbGVhbiA9IHRydWU7XHJcbiAgICBzdW1tZWREZWx0YTogbnVtYmVyID0gMDtcclxuXHJcbiAgICBkZWZhdWx0R3JvdXA6IEdyb3VwSGVscGVyO1xyXG5cclxuICAgIGluaXRpYWxXaWR0aDogbnVtYmVyO1xyXG4gICAgaW5pdGlhbEhlaWdodDogbnVtYmVyO1xyXG5cclxuICAgICRjb29yZGluYXRlRGl2OiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG5cclxuICAgIHB1YmxpYyBzY2FsZWRUZXh0dXJlczogeyBbbmFtZTogc3RyaW5nXTogUElYSS5UZXh0dXJlIH0gPSB7fTtcclxuXHJcblxyXG4gICAgc2hhcGVzOiBTaGFwZUhlbHBlcltdID0gW107ICAgICAvLyBhbGwgbm9uLWdyb3VwLXNoYXBlcyAoZm9yIEdORy1MaWJyYXJ5IGNvbGxpc2lvbi1GdW5jdGlvbnMpXHJcblxyXG4gICAgdGlja2VyRnVuY3Rpb246ICh0OiBudW1iZXIpID0+IHZvaWQ7XHJcblxyXG4gICAgY2xlYXJBY3Rvckxpc3RzKCkge1xyXG4gICAgICAgIHRoaXMuYWN0QWN0b3JzID0gW107XHJcbiAgICAgICAgdGhpcy5rZXlQcmVzc2VkQWN0b3JzID0gW107XHJcbiAgICAgICAgdGhpcy5rZXlVcEFjdG9ycyA9IFtdO1xyXG4gICAgICAgIHRoaXMua2V5RG93bkFjdG9ycyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyB3aWR0aDogbnVtYmVyLCBwdWJsaWMgaGVpZ2h0OiBudW1iZXIsIHByaXZhdGUgbW9kdWxlOiBNb2R1bGUsIHB1YmxpYyB3b3JsZDogUnVudGltZU9iamVjdCkge1xyXG5cclxuICAgICAgICBQSVhJLnNldHRpbmdzLlNDQUxFX01PREUgPSBQSVhJLlNDQUxFX01PREVTLk5FQVJFU1Q7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdGlhbEhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICB0aGlzLmluaXRpYWxXaWR0aCA9IHdpZHRoO1xyXG5cclxuICAgICAgICB0aGlzLmludGVycHJldGVyID0gdGhpcy5tb2R1bGU/Lm1haW4/LmdldEludGVycHJldGVyKCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmludGVycHJldGVyLnByb2Nlc3NpbmdIZWxwZXIgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnRocm93RXhjZXB0aW9uKFwiRGllIGhlcmvDtm1tbGljaGUgR3JhZmlrYXVzZ2FiZSBrYW5uIG5pY2h0IHp1c2FtbWVuIG1pdCBQcm9jZXNzaW5nIGdlbnV0enQgd2VyZGVuLlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmludGVycHJldGVyLndvcmxkSGVscGVyICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci50aHJvd0V4Y2VwdGlvbihcIkVzIGRhcmYgbnVyIGVpbiBXb3JsZC1PYmpla3QgaW5zdGFuemllcnQgd2VyZGVuLlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIud29ybGRIZWxwZXIgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLiRjb250YWluZXJPdXRlciA9IGpRdWVyeSgnPGRpdj48L2Rpdj4nKTtcclxuICAgICAgICBsZXQgJGdyYXBoaWNzRGl2ID0gdGhpcy5tb2R1bGUubWFpbi5nZXRJbnRlcnByZXRlcigpLnByaW50TWFuYWdlci5nZXRHcmFwaGljc0RpdigpO1xyXG4gICAgICAgIHRoaXMuJGNvb3JkaW5hdGVEaXYgPSB0aGlzLm1vZHVsZS5tYWluLmdldFJpZ2h0RGl2KCkuJHJpZ2h0RGl2LmZpbmQoXCIuam9fY29vcmRpbmF0ZXNcIik7XHJcblxyXG5cclxuICAgICAgICBsZXQgZiA9ICgpID0+IHtcclxuICAgICAgICAgICAgbGV0ICRqb190YWJzID0gJGdyYXBoaWNzRGl2LnBhcmVudHMoXCIuam9fdGFic1wiKTtcclxuICAgICAgICAgICAgbGV0IG1heFdpZHRoOiBudW1iZXIgPSAkam9fdGFicy53aWR0aCgpO1xyXG4gICAgICAgICAgICBsZXQgbWF4SGVpZ2h0OiBudW1iZXIgPSAkam9fdGFicy5oZWlnaHQoKTtcclxuICAgICAgICAgICAgLy8gbGV0IG1heFdpZHRoOiBudW1iZXIgPSAkZ3JhcGhpY3NEaXYucGFyZW50KCkud2lkdGgoKTtcclxuICAgICAgICAgICAgLy8gbGV0IG1heEhlaWdodDogbnVtYmVyID0gJGdyYXBoaWNzRGl2LnBhcmVudCgpLmhlaWdodCgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGhlaWdodCAvIHdpZHRoID4gbWF4SGVpZ2h0IC8gbWF4V2lkdGgpIHtcclxuICAgICAgICAgICAgICAgICRncmFwaGljc0Rpdi5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgICd3aWR0aCc6IHdpZHRoIC8gaGVpZ2h0ICogbWF4SGVpZ2h0ICsgXCJweFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICdoZWlnaHQnOiBtYXhIZWlnaHQgKyBcInB4XCIsXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJGdyYXBoaWNzRGl2LmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgJ2hlaWdodCc6IGhlaWdodCAvIHdpZHRoICogbWF4V2lkdGggKyBcInB4XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3dpZHRoJzogbWF4V2lkdGggKyBcInB4XCIsXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJGdyYXBoaWNzRGl2Lm9mZignc2l6ZUNoYW5nZWQnKTtcclxuICAgICAgICAkZ3JhcGhpY3NEaXYub24oJ3NpemVDaGFuZ2VkJywgZik7XHJcblxyXG4gICAgICAgIGYoKTtcclxuXHJcbiAgICAgICAgdGhpcy4kY29udGFpbmVySW5uZXIgPSBqUXVlcnkoJzxkaXY+PC9kaXY+Jyk7XHJcbiAgICAgICAgdGhpcy4kY29udGFpbmVyT3V0ZXIuYXBwZW5kKHRoaXMuJGNvbnRhaW5lcklubmVyKTtcclxuXHJcbiAgICAgICAgJGdyYXBoaWNzRGl2LmFwcGVuZCh0aGlzLiRjb250YWluZXJPdXRlcik7XHJcbiAgICAgICAgJGdyYXBoaWNzRGl2LnNob3coKTtcclxuXHJcbiAgICAgICAgJGdyYXBoaWNzRGl2WzBdLm9uY29udGV4dG1lbnUgPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgUElYSS5zZXR0aW5ncy5UQVJHRVRfRlBNUyA9IDMwLjAgLyAxMDAwLjA7XHJcblxyXG4gICAgICAgIHRoaXMuYXBwID0gbmV3IFBJWEkuQXBwbGljYXRpb24oe1xyXG4gICAgICAgICAgICBhbnRpYWxpYXM6IHRydWUsXHJcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQsXHJcbiAgICAgICAgICAgIC8vcmVzaXplVG86ICRjb250YWluZXJJbm5lclswXVxyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIC8vIGxldCBpID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy50aWNrZXJGdW5jdGlvbiA9IChkZWx0YSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBpZiAoaSsrICUgMiA9PSAwKSBcclxuICAgICAgICAgICAgdGhhdC50aWNrKFBJWEkuVGlja2VyLnNoYXJlZC5lbGFwc2VkTVMpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuYXBwLnRpY2tlci5hZGQodGhpcy50aWNrZXJGdW5jdGlvbik7XHJcbiAgICAgICAgdGhpcy5hcHAudGlja2VyLm1heEZQUyA9IDMwO1xyXG5cclxuICAgICAgICB0aGlzLmludGVycHJldGVyLnRpbWVyRXh0ZXJuID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdGhpcy5zdGFnZSA9IG5ldyBQSVhJLkNvbnRhaW5lcigpO1xyXG5cclxuICAgICAgICB0aGlzLmFwcC5zdGFnZS5hZGRDaGlsZCh0aGlzLnN0YWdlKTtcclxuXHJcbiAgICAgICAgdGhpcy4kY29udGFpbmVySW5uZXIuYXBwZW5kKHRoaXMuYXBwLnZpZXcpO1xyXG5cclxuXHJcbiAgICAgICAgLy8gdGhpcy5zdGFnZS5sb2NhbFRyYW5zZm9ybS50cmFuc2xhdGUoLTQwMCwgLTMwMCk7XHJcbiAgICAgICAgLy8gdGhpcy5zdGFnZS5sb2NhbFRyYW5zZm9ybS5yb3RhdGUoLTQ1LzE4MCpNYXRoLlBJKTtcclxuICAgICAgICAvLyB0aGlzLnN0YWdlLmxvY2FsVHJhbnNmb3JtLnRyYW5zbGF0ZSg0MDAsMzAwKTtcclxuICAgICAgICAvLyB0aGlzLnN0YWdlLnRyYW5zZm9ybS5vbkNoYW5nZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmludGVycHJldGVyLmtleWJvYXJkVG9vbC5rZXlQcmVzc2VkQ2FsbGJhY2tzLnB1c2goKGtleSkgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBrcGEgb2YgdGhhdC5rZXlQcmVzc2VkQWN0b3JzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhhdC5ydW5BY3RvcldoZW5LZXlFdmVudChrcGEsIGtleSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIua2V5Ym9hcmRUb29sLmtleVVwQ2FsbGJhY2tzLnB1c2goKGtleSkgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBrcGEgb2YgdGhhdC5rZXlVcEFjdG9ycykge1xyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQucnVuQWN0b3JXaGVuS2V5RXZlbnQoa3BhLCBrZXkpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmludGVycHJldGVyLmtleWJvYXJkVG9vbC5rZXlEb3duQ2FsbGJhY2tzLnB1c2goKGtleSkgPT4ge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBrcGEgb2YgdGhhdC5rZXlEb3duQWN0b3JzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhhdC5ydW5BY3RvcldoZW5LZXlFdmVudChrcGEsIGtleSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICBmb3IgKGxldCBsaXN0ZW5lclR5cGUgb2YgW1wibW91c2V1cFwiLCBcIm1vdXNlZG93blwiLCBcIm1vdXNlbW92ZVwiLCBcIm1vdXNlZW50ZXJcIiwgXCJtb3VzZWxlYXZlXCJdKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgZXZlbnRUeXBlID0gbGlzdGVuZXJUeXBlO1xyXG4gICAgICAgICAgICBpZih3aW5kb3cuUG9pbnRlckV2ZW50KXtcclxuICAgICAgICAgICAgICAgIGV2ZW50VHlwZSA9IGV2ZW50VHlwZS5yZXBsYWNlKCdtb3VzZScsICdwb2ludGVyJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuJGNvbnRhaW5lcklubmVyLm9uKGV2ZW50VHlwZSwgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCB4ID0gd2lkdGggKiBlLm9mZnNldFggLyB0aGlzLiRjb250YWluZXJJbm5lci53aWR0aCgpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHkgPSBoZWlnaHQgKiBlLm9mZnNldFkgLyB0aGlzLiRjb250YWluZXJJbm5lci5oZWlnaHQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgcCA9IG5ldyBQSVhJLlBvaW50KHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFnZS5sb2NhbFRyYW5zZm9ybS5hcHBseUludmVyc2UocCwgcCk7XHJcbiAgICAgICAgICAgICAgICB4ID0gcC54O1xyXG4gICAgICAgICAgICAgICAgeSA9IHAueTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0Lm9uTW91c2VFdmVudChsaXN0ZW5lclR5cGUsIHgsIHksIGUuYnV0dG9uKTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLm1vdXNlTGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyLnR5cGVzW2xpc3RlbmVyVHlwZV0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludm9rZU1vdXNlTGlzdGVuZXIobGlzdGVuZXIsIGxpc3RlbmVyVHlwZSwgeCwgeSwgZS5idXR0b24pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZihsaXN0ZW5lclR5cGUgPT0gXCJtb3VzZWRvd25cIil7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGduZ0VyZWlnbmlzYmVoYW5kbHVuZyA9IHRoaXMuaW50ZXJwcmV0ZXIuZ25nRXJlaWduaXNiZWhhbmRsdW5nSGVscGVyO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGduZ0VyZWlnbmlzYmVoYW5kbHVuZyAhPSBudWxsKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ25nRXJlaWduaXNiZWhhbmRsdW5nLmhhbmRsZU1vdXNlQ2xpY2tlZEV2ZW50KHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0ICRjb29yZGluYXRlRGl2ID0gdGhpcy4kY29vcmRpbmF0ZURpdjtcclxuXHJcbiAgICAgICAgbGV0IG1vdXNlUG9pbnRlciA9IHdpbmRvdy5Qb2ludGVyRXZlbnQgPyBcInBvaW50ZXJcIiA6IFwibW91c2VcIjtcclxuXHJcbiAgICAgICAgdGhpcy4kY29udGFpbmVySW5uZXIub24obW91c2VQb2ludGVyICsgXCJtb3ZlXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB4ID0gd2lkdGggKiBlLm9mZnNldFggLyB0aGlzLiRjb250YWluZXJJbm5lci53aWR0aCgpO1xyXG4gICAgICAgICAgICBsZXQgeSA9IGhlaWdodCAqIGUub2Zmc2V0WSAvIHRoaXMuJGNvbnRhaW5lcklubmVyLmhlaWdodCgpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHAgPSBuZXcgUElYSS5Qb2ludCh4LCB5KTtcclxuICAgICAgICAgICAgdGhpcy5zdGFnZS5sb2NhbFRyYW5zZm9ybS5hcHBseUludmVyc2UocCwgcCk7XHJcbiAgICAgICAgICAgIHggPSBNYXRoLnJvdW5kKHAueCk7XHJcbiAgICAgICAgICAgIHkgPSBNYXRoLnJvdW5kKHAueSk7XHJcbiAgICAgICAgICAgICRjb29yZGluYXRlRGl2LnRleHQoYCgke3h9LyR7eX0pYCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuJGNvbnRhaW5lcklubmVyLm9uKG1vdXNlUG9pbnRlciArIFwiZW50ZXJcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgJGNvb3JkaW5hdGVEaXYuc2hvdygpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLiRjb250YWluZXJJbm5lci5vbihtb3VzZVBvaW50ZXIgKyBcImxlYXZlXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICRjb29yZGluYXRlRGl2LmhpZGUoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5tb2R1bGUubWFpbi5nZXRSaWdodERpdigpPy5hZGp1c3RXaWR0aFRvV29ybGQoKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q3Vyc29yKGN1cnNvcjogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy4kY29udGFpbmVySW5uZXIuY3NzKCdjdXJzb3InLCBjdXJzb3IpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBhY3RvcnNOb3RGaW5pc2hlZDogbnVtYmVyID0gMDtcclxuICAgIHRpY2tzOiBudW1iZXIgPSAwO1xyXG4gICAgZGVsdGFTdW06IG51bWJlciA9IDA7XHJcblxyXG4gICAgc3ByaXRlQW5pbWF0aW9uczogU3ByaXRlSGVscGVyW10gPSBbXTtcclxuXHJcbiAgICB0aWNrKGRlbHRhOiBhbnkpIHtcclxuXHJcbiAgICAgICAgdGhpcy5zdW1tZWREZWx0YSArPSBkZWx0YTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgc3ByaXRlSGVscGVyIG9mIHRoaXMuc3ByaXRlQW5pbWF0aW9ucykge1xyXG4gICAgICAgICAgICBzcHJpdGVIZWxwZXIudGljayhkZWx0YSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5pbnRlcnByZXRlciAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAodGhpcy5pbnRlcnByZXRlci5zdGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBJbnRlcnByZXRlclN0YXRlLnJ1bm5pbmc6XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5hY3RvcnNGaW5pc2hlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdG9yc05vdEZpbmlzaGVkKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZpcnN0OiBib29sZWFuID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgYWN0b3JEYXRhIG9mIHRoaXMuYWN0QWN0b3JzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYWN0b3JIZWxwZXIgPSBhY3RvckRhdGEuYWN0b3JIZWxwZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3RvckhlbHBlci50aW1lclBhdXNlZCB8fCBhY3RvckhlbHBlci5pc0Rlc3Ryb3llZCkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHJvZ3JhbSA9IGFjdG9yRGF0YS5tZXRob2Q/LnByb2dyYW07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucnVuQWN0b3IoZmlyc3QsIGFjdG9yRGF0YSwgdGhpcy5zdW1tZWREZWx0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9ncmFtICE9IG51bGwgJiYgIWFjdG9yRGF0YS5hY3RvckhlbHBlci5pc0Rlc3Ryb3llZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3QgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0b3JzRmluaXNoZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgSW50ZXJwcmV0ZXJTdGF0ZS5kb25lOlxyXG4gICAgICAgICAgICAgICAgY2FzZSBJbnRlcnByZXRlclN0YXRlLmVycm9yOlxyXG4gICAgICAgICAgICAgICAgY2FzZSBJbnRlcnByZXRlclN0YXRlLm5vdF9pbml0aWFsaXplZDpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyQWN0b3JMaXN0cygpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zdW1tZWREZWx0YSA9IDA7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmludGVycHJldGVyLnN0YXRlID09IEludGVycHJldGVyU3RhdGUucnVubmluZykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hY3RBY3RvcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci50aW1lckZ1bmN0aW9uKDMzLjMzLCB0cnVlLCAwLjUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci50aW1lclN0b3BwZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIudGltZXJGdW5jdGlvbigzMy4zMywgZmFsc2UsIDAuMDgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci50aW1lckZ1bmN0aW9uKDMzLjMzLCBmYWxzZSwgMC43KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2hpbGUgKHRoaXMuYWN0b3JIZWxwZXJzVG9EZXN0cm95Lmxlbmd0aCA+IDApIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBhY3RvckhlbHBlciA9IHRoaXMuYWN0b3JIZWxwZXJzVG9EZXN0cm95LnBvcCgpO1xyXG5cclxuICAgICAgICAgICAgLy8gYWN0QWN0b3JzOiBBY3RvckRhdGFbXSA9IFtdO1xyXG4gICAgICAgICAgICAvLyBrZXlQcmVzc2VkQWN0b3JzOiBBY3RvckRhdGFbXSA9IFtdO1xyXG4gICAgICAgICAgICAvLyBhY3RvckhlbHBlcnNUb0Rlc3Ryb3k6IEFjdG9ySGVscGVyW10gPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGFjdG9yTGlzdCBvZiBbdGhpcy5rZXlQcmVzc2VkQWN0b3JzLCB0aGlzLmtleVVwQWN0b3JzLCB0aGlzLmtleURvd25BY3RvcnNdKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFjdG9yTGlzdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhY3Rvckxpc3RbaV0uYWN0b3JIZWxwZXIgPT09IGFjdG9ySGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdG9yTGlzdC5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGktLTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubW91c2VMaXN0ZW5lclNoYXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW91c2VMaXN0ZW5lclNoYXBlc1tpXS5zaGFwZUhlbHBlciA9PT0gYWN0b3JIZWxwZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdXNlTGlzdGVuZXJTaGFwZXMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGktLTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmFjdEFjdG9ycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYWN0QWN0b3JzW2ldLmFjdG9ySGVscGVyID09PSBhY3RvckhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0QWN0b3JzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICBpLS07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBkaXNwbGF5T2JqZWN0ID0gKDxTaGFwZUhlbHBlcj5hY3RvckhlbHBlcikuZGlzcGxheU9iamVjdDtcclxuICAgICAgICAgICAgaWYgKGRpc3BsYXlPYmplY3QgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZGlzcGxheU9iamVjdC5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgICAgICAoPFNoYXBlSGVscGVyPmFjdG9ySGVscGVyKS5kaXNwbGF5T2JqZWN0ID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNldEJhY2tncm91bmRDb2xvcihjb2xvcjogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0IGMgPSBDb2xvckhlbHBlci5wYXJzZUNvbG9yVG9PcGVuR0woY29sb3IpO1xyXG4gICAgICAgIHRoaXMuYXBwLnJlbmRlcmVyLmJhY2tncm91bmRDb2xvciA9IGMuY29sb3I7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHJ1bkFjdG9yV2hlbktleUV2ZW50KGFjdG9yRGF0YTogQWN0b3JEYXRhLCBrZXk6IHN0cmluZykge1xyXG5cclxuICAgICAgICBsZXQgcHJvZ3JhbSA9IGFjdG9yRGF0YS5tZXRob2Q/LnByb2dyYW07XHJcbiAgICAgICAgbGV0IGludm9rZSA9IGFjdG9yRGF0YS5tZXRob2Q/Lmludm9rZTtcclxuXHJcbiAgICAgICAgbGV0IHJ0byA9IGFjdG9yRGF0YS5hY3RvckhlbHBlci5ydW50aW1lT2JqZWN0O1xyXG5cclxuICAgICAgICBsZXQgc3RhY2tFbGVtZW50czogVmFsdWVbXSA9IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogcnRvLmNsYXNzLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJ0b1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IGtleVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgaWYgKHByb2dyYW0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnJ1blRpbWVyKGFjdG9yRGF0YS5tZXRob2QsIHN0YWNrRWxlbWVudHMsIG51bGwsIGZhbHNlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGludm9rZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGludm9rZShbXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBydW5BY3RvcihmaXJzdDogYm9vbGVhbiwgYWN0b3JEYXRhOiBBY3RvckRhdGEsIGRlbHRhOiBudW1iZXIpIHtcclxuXHJcbiAgICAgICAgbGV0IHByb2dyYW0gPSBhY3RvckRhdGEubWV0aG9kPy5wcm9ncmFtO1xyXG4gICAgICAgIGxldCBpbnZva2UgPSBhY3RvckRhdGEubWV0aG9kPy5pbnZva2U7XHJcblxyXG4gICAgICAgIGxldCBydG8gPSBhY3RvckRhdGEuYWN0b3JIZWxwZXIucnVudGltZU9iamVjdDtcclxuXHJcbiAgICAgICAgbGV0IHN0YWNrRWxlbWVudHM6IFZhbHVlW10gPSBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IHJ0by5jbGFzcyxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiBydG9cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICBpZiAoYWN0b3JEYXRhLm1ldGhvZC5nZXRQYXJhbWV0ZXJDb3VudCgpID4gMCkge1xyXG4gICAgICAgICAgICBzdGFja0VsZW1lbnRzLnB1c2goXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZGVsdGFcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChwcm9ncmFtICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci5ydW5UaW1lcihhY3RvckRhdGEubWV0aG9kLCBzdGFja0VsZW1lbnRzLCBmaXJzdCA/IChpbnRlcnByZXRlcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5hY3RvcnNGaW5pc2hlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBpbnRlcnByZXRlci50aW1lclN0b3BwZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IDogbnVsbCwgdHJ1ZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChpbnZva2UgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBpbnZva2UoW10pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgZGVzdHJveVdvcmxkKCkge1xyXG4gICAgICAgIGZvciAobGV0IGxpc3RlbmVyVHlwZSBvZiBbXCJtb3VzZXVwXCIsIFwibW91c2Vkb3duXCIsIFwibW91c2Vtb3ZlXCIsIFwibW91c2VlbnRlclwiLCBcIm1vdXNlbGVhdmVcIl0pIHtcclxuICAgICAgICAgICAgdGhpcy4kY29udGFpbmVySW5uZXIub2ZmKGxpc3RlbmVyVHlwZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3ByaXRlQW5pbWF0aW9ucyA9IFtdO1xyXG4gICAgICAgIHRoaXMuYXBwLnRpY2tlci5yZW1vdmUodGhpcy50aWNrZXJGdW5jdGlvbik7XHJcbiAgICAgICAgdGhpcy5hcHAuZGVzdHJveSgpO1xyXG4gICAgICAgIHRoaXMuJGNvbnRhaW5lck91dGVyLnJlbW92ZSgpO1xyXG4gICAgICAgIHRoaXMubW9kdWxlLm1haW4uZ2V0SW50ZXJwcmV0ZXIoKS5wcmludE1hbmFnZXIuZ2V0R3JhcGhpY3NEaXYoKS5oaWRlKCk7XHJcbiAgICAgICAgdGhpcy5pbnRlcnByZXRlci50aW1lckV4dGVybiA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIud29ybGRIZWxwZXIgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuJGNvb3JkaW5hdGVEaXYuaGlkZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uTW91c2VFdmVudChsaXN0ZW5lclR5cGU6IHN0cmluZywgeDogbnVtYmVyLCB5OiBudW1iZXIsIGJ1dHRvbjogbnVtYmVyKSB7XHJcblxyXG4gICAgICAgIHN3aXRjaCAobGlzdGVuZXJUeXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJtb3VzZWRvd25cIjpcclxuICAgICAgICAgICAgY2FzZSBcIm1vdXNldXBcIjpcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMubW91c2VMaXN0ZW5lclNoYXBlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBzaGFwZUhlbHBlcjogU2hhcGVIZWxwZXIgPSBsaXN0ZW5lci5zaGFwZUhlbHBlcjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyLnR5cGVzW2xpc3RlbmVyVHlwZV0gIT0gbnVsbCAmJiAoc2hhcGVIZWxwZXIuY29udGFpbnNQb2ludCh4LCB5KSB8fCBzaGFwZUhlbHBlci50cmFja01vdXNlTW92ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnZva2VTaGFwZU1vdXNlTGlzdGVuZXIobGlzdGVuZXIsIGxpc3RlbmVyVHlwZSwgeCwgeSwgYnV0dG9uKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwibW91c2VlbnRlclwiOlxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5tb3VzZUxpc3RlbmVyU2hhcGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNoYXBlSGVscGVyOiBTaGFwZUhlbHBlciA9IGxpc3RlbmVyLnNoYXBlSGVscGVyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXIudHlwZXNbbGlzdGVuZXJUeXBlXSAhPSBudWxsICYmIHNoYXBlSGVscGVyLmNvbnRhaW5zUG9pbnQoeCwgeSkgJiYgIXNoYXBlSGVscGVyLm1vdXNlTGFzdFNlZW5JbnNpZGVPYmplY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnZva2VTaGFwZU1vdXNlTGlzdGVuZXIobGlzdGVuZXIsIGxpc3RlbmVyVHlwZSwgeCwgeSwgYnV0dG9uLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFwZUhlbHBlci5tb3VzZUxhc3RTZWVuSW5zaWRlT2JqZWN0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwibW91c2VsZWF2ZVwiOlxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5tb3VzZUxpc3RlbmVyU2hhcGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNoYXBlSGVscGVyOiBTaGFwZUhlbHBlciA9IGxpc3RlbmVyLnNoYXBlSGVscGVyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXIudHlwZXNbbGlzdGVuZXJUeXBlXSAhPSBudWxsICYmIHNoYXBlSGVscGVyLm1vdXNlTGFzdFNlZW5JbnNpZGVPYmplY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnZva2VTaGFwZU1vdXNlTGlzdGVuZXIobGlzdGVuZXIsIGxpc3RlbmVyVHlwZSwgeCwgeSwgYnV0dG9uLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFwZUhlbHBlci5tb3VzZUxhc3RTZWVuSW5zaWRlT2JqZWN0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcIm1vdXNlbW92ZVwiOlxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5tb3VzZUxpc3RlbmVyU2hhcGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNoYXBlSGVscGVyOiBTaGFwZUhlbHBlciA9IGxpc3RlbmVyLnNoYXBlSGVscGVyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXIudHlwZXNbXCJtb3VzZW1vdmVcIl0gIT0gbnVsbCB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAobGlzdGVuZXIudHlwZXNbXCJtb3VzZWVudGVyXCJdICE9IG51bGwgJiYgIXNoYXBlSGVscGVyLm1vdXNlTGFzdFNlZW5JbnNpZGVPYmplY3QpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChsaXN0ZW5lci50eXBlc1tcIm1vdXNlbGVhdmVcIl0gIT0gbnVsbCAmJiBzaGFwZUhlbHBlci5tb3VzZUxhc3RTZWVuSW5zaWRlT2JqZWN0KVxyXG4gICAgICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY29udGFpbnNQb2ludCA9IHNoYXBlSGVscGVyLmNvbnRhaW5zUG9pbnQoeCwgeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoc2hhcGVIZWxwZXIudHJhY2tNb3VzZU1vdmUgfHwgY29udGFpbnNQb2ludCkgJiYgbGlzdGVuZXIudHlwZXNbXCJtb3VzZW1vdmVcIl0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnZva2VTaGFwZU1vdXNlTGlzdGVuZXIobGlzdGVuZXIsIFwibW91c2Vtb3ZlXCIsIHgsIHksIGJ1dHRvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5zUG9pbnQgJiYgbGlzdGVuZXIudHlwZXNbXCJtb3VzZWVudGVyXCJdICE9IG51bGwgJiYgIXNoYXBlSGVscGVyLm1vdXNlTGFzdFNlZW5JbnNpZGVPYmplY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW52b2tlU2hhcGVNb3VzZUxpc3RlbmVyKGxpc3RlbmVyLCBcIm1vdXNlZW50ZXJcIiwgeCwgeSwgYnV0dG9uLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hhcGVIZWxwZXIubW91c2VMYXN0U2Vlbkluc2lkZU9iamVjdCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNvbnRhaW5zUG9pbnQgJiYgbGlzdGVuZXIudHlwZXNbXCJtb3VzZWxlYXZlXCJdICE9IG51bGwgJiYgc2hhcGVIZWxwZXIubW91c2VMYXN0U2Vlbkluc2lkZU9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnZva2VTaGFwZU1vdXNlTGlzdGVuZXIobGlzdGVuZXIsIFwibW91c2VsZWF2ZVwiLCB4LCB5LCBidXR0b24sICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGFwZUhlbHBlci5tb3VzZUxhc3RTZWVuSW5zaWRlT2JqZWN0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbnZva2VTaGFwZU1vdXNlTGlzdGVuZXIobGlzdGVuZXI6IE1vdXNlTGlzdGVuZXJTaGFwZURhdGEsIGxpc3RlbmVyVHlwZTogc3RyaW5nLFxyXG4gICAgICAgIHg6IG51bWJlciwgeTogbnVtYmVyLCBidXR0b246IG51bWJlciwgY2FsbGJhY2s/OiAoKSA9PiB2b2lkKSB7XHJcblxyXG4gICAgICAgIGlmICghbGlzdGVuZXIuc2hhcGVIZWxwZXIucmVhY3RUb01vdXNlRXZlbnRzV2hlbkludmlzaWJsZSAmJlxyXG4gICAgICAgICAgICAhbGlzdGVuZXIuc2hhcGVIZWxwZXIuZGlzcGxheU9iamVjdC52aXNpYmxlKSByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBtZXRob2QgPSBsaXN0ZW5lci5tZXRob2RzW2xpc3RlbmVyVHlwZV07XHJcbiAgICAgICAgbGV0IHByb2dyYW0gPSBtZXRob2QucHJvZ3JhbTtcclxuICAgICAgICBsZXQgaW52b2tlID0gbWV0aG9kLmludm9rZTtcclxuXHJcbiAgICAgICAgbGV0IHJ0byA9IGxpc3RlbmVyLnNoYXBlSGVscGVyLnJ1bnRpbWVPYmplY3Q7XHJcblxyXG4gICAgICAgIGxldCBzdGFja0VsZW1lbnRzOiBWYWx1ZVtdID0gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBydG8uY2xhc3MsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogcnRvXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogeFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgIGlmIChsaXN0ZW5lclR5cGUgIT0gXCJtb3VzZW1vdmVcIiAmJiBsaXN0ZW5lclR5cGUgIT0gXCJtb3VzZWVudGVyXCIgJiYgbGlzdGVuZXJUeXBlICE9IFwibW91c2VsZWF2ZVwiKSB7XHJcbiAgICAgICAgICAgIHN0YWNrRWxlbWVudHMucHVzaChcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBidXR0b25cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHByb2dyYW0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnJ1blRpbWVyKG1ldGhvZCwgc3RhY2tFbGVtZW50cywgY2FsbGJhY2ssIGZhbHNlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGludm9rZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGludm9rZShbXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBhZGRNb3VzZUxpc3RlbmVyKGxpc3RlbmVyOiBSdW50aW1lT2JqZWN0KSB7XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICAgIElmIGEgc2hhcGUgaXMgcmVnaXN0ZXJlZCBhcyBNb3VzZUxpc3RlbmVyIG9mIHRoZSB3b3JsZC1vYmplY3QsIGl0IGdldHMgYWxsIG1vdXNlLWV2ZW50cyB0d2ljZS4gXHJcbiAgICAgICAgICAgID0+IERlcmVnaXN0ZXIgc2hhcGUgYXMgbW91c2VMaXN0ZW5lclNoYXBlIGFuZCByZWdpc3RlciBpdCBhcyBtb3VzZSBsaXN0ZW5lciBmb3IgdGhlIHdvcmxkIG9iamVjdC5cclxuICAgICAgICAqL1xyXG4gICAgICAgIGxldCBpbmRleDogbnVtYmVyID0gdGhpcy5tb3VzZUxpc3RlbmVyU2hhcGVzLmZpbmRJbmRleCgobWxzKSA9PiB7cmV0dXJuIG1scy5zaGFwZUhlbHBlci5ydW50aW1lT2JqZWN0ID09IGxpc3RlbmVyfSk7XHJcbiAgICAgICAgaWYoaW5kZXggPj0gMCl7XHJcbiAgICAgICAgICAgIHRoaXMubW91c2VMaXN0ZW5lclNoYXBlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGxpc3RlbmVyVHlwZXMgPSBbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJNb3VzZVVwXCIsIHNpZ25hdHVyZTogXCIoZG91YmxlLCBkb3VibGUsIGludClcIiB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiTW91c2VEb3duXCIsIHNpZ25hdHVyZTogXCIoZG91YmxlLCBkb3VibGUsIGludClcIiB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiTW91c2VNb3ZlXCIsIHNpZ25hdHVyZTogXCIoZG91YmxlLCBkb3VibGUpXCIgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIk1vdXNlRW50ZXJcIiwgc2lnbmF0dXJlOiBcIihkb3VibGUsIGRvdWJsZSlcIiB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiTW91c2VMZWF2ZVwiLCBzaWduYXR1cmU6IFwiKGRvdWJsZSwgZG91YmxlKVwiIH0sXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgbGV0IHNkOiBNb3VzZUxpc3RlbmVyRGF0YSA9IG51bGw7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGx0IG9mIGxpc3RlbmVyVHlwZXMpIHtcclxuICAgICAgICAgICAgbGV0IG1ldGhvZDogTWV0aG9kID0gKDxLbGFzcz5saXN0ZW5lci5jbGFzcykuZ2V0TWV0aG9kQnlTaWduYXR1cmUoXCJvblwiICsgbHQuaWRlbnRpZmllciArIGx0LnNpZ25hdHVyZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAobWV0aG9kPy5wcm9ncmFtICE9IG51bGwgJiYgbWV0aG9kLnByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGggPiAyIHx8IG1ldGhvZD8uaW52b2tlICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2QgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNkID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcjogbGlzdGVuZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVzOiB7fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kczoge31cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW91c2VMaXN0ZW5lcnMucHVzaChzZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc2QudHlwZXNbbHQuaWRlbnRpZmllci50b0xvd2VyQ2FzZSgpXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBzZC5tZXRob2RzW2x0LmlkZW50aWZpZXIudG9Mb3dlckNhc2UoKV0gPSBtZXRob2Q7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcblxyXG4gICAgaW52b2tlTW91c2VMaXN0ZW5lcihsaXN0ZW5lcjogTW91c2VMaXN0ZW5lckRhdGEsIGxpc3RlbmVyVHlwZTogc3RyaW5nLFxyXG4gICAgICAgIHg6IG51bWJlciwgeTogbnVtYmVyLCBidXR0b246IG51bWJlciwgY2FsbGJhY2s/OiAoKSA9PiB2b2lkKSB7XHJcblxyXG4gICAgICAgIGxldCBtZXRob2QgPSBsaXN0ZW5lci5tZXRob2RzW2xpc3RlbmVyVHlwZV07XHJcbiAgICAgICAgbGV0IHByb2dyYW0gPSBtZXRob2QucHJvZ3JhbTtcclxuICAgICAgICBsZXQgaW52b2tlID0gbWV0aG9kLmludm9rZTtcclxuXHJcbiAgICAgICAgbGV0IHJ0byA9IGxpc3RlbmVyLmxpc3RlbmVyO1xyXG5cclxuICAgICAgICBsZXQgc3RhY2tFbGVtZW50czogVmFsdWVbXSA9IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogcnRvLmNsYXNzLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJ0b1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHhcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiB5XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICBpZiAobGlzdGVuZXJUeXBlICE9IFwibW91c2Vtb3ZlXCIgJiYgbGlzdGVuZXJUeXBlICE9IFwibW91c2VlbnRlclwiICYmIGxpc3RlbmVyVHlwZSAhPSBcIm1vdXNlbGVhdmVcIikge1xyXG4gICAgICAgICAgICBzdGFja0VsZW1lbnRzLnB1c2goXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogaW50UHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogYnV0dG9uXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwcm9ncmFtICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci5ydW5UaW1lcihtZXRob2QsIHN0YWNrRWxlbWVudHMsIGNhbGxiYWNrLCBmYWxzZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChpbnZva2UgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBpbnZva2UoW10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG59Il19