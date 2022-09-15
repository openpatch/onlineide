import { ArrayListClass } from "../../runtimelibrary/collections/ArrayList.js";
import { CollectionClass } from "../../runtimelibrary/collections/Collection.js";
import { IterableClass } from "../../runtimelibrary/collections/Iterable.js";
import { IteratorClass } from "../../runtimelibrary/collections/Iterator.js";
import { ListClass } from "../../runtimelibrary/collections/List.js";
import { ListIteratorImplClass } from "../../runtimelibrary/collections/ListIteratorImpl.js";
import { StackClass } from "../../runtimelibrary/collections/Stack.js";
import { VectorClass } from "../../runtimelibrary/collections/Vector.js";
import { SetClass } from "../../runtimelibrary/collections/Set.js";
import { SetIteratorImplClass } from "../../runtimelibrary/collections/SetIteratorImpl.js";
import { HashSetClass } from "../../runtimelibrary/collections/HashSet.js";
import { LinkedHashSetClass } from "../../runtimelibrary/collections/LinkedHashSet.js";
import { QueueClass } from "../../runtimelibrary/collections/Queue.js";
import { DequeClass } from "../../runtimelibrary/collections/Deque.js";
import { LinkedListClass } from "../../runtimelibrary/collections/LinkedList.js";
import { ConsoleClass } from "../../runtimelibrary/Console.js";
import { Actor as ActorClass } from "../../runtimelibrary/graphics/Actor.js";
import { AlignmentClass } from "../../runtimelibrary/graphics/Alignment.js";
import { BitmapClass } from "../../runtimelibrary/graphics/Bitmap.js";
import { CircleClass as CircleClass } from "../../runtimelibrary/graphics/Circle.js";
import { SectorClass } from "../../runtimelibrary/graphics/Sector.js";
import { ArcClass } from "../../runtimelibrary/graphics/Arc.js";
import { ColorClass } from "../../runtimelibrary/graphics/Color.js";
import { EllipseClass } from "../../runtimelibrary/graphics/Ellipse.js";
import { FilledShapeClass } from "../../runtimelibrary/graphics/FilledShape.js";
import { CollisionPairClass, GroupClass } from "../../runtimelibrary/graphics/Group.js";
import { KeyClass } from "../../runtimelibrary/graphics/Key.js";
import { PolygonClass } from "../../runtimelibrary/graphics/Polygon.js";
import { RectangleClass } from "../../runtimelibrary/graphics/Rectangle.js";
import { RepeatTypeClass } from "../../runtimelibrary/graphics/RepeatType.js";
import { RoundedRectangleClass } from "../../runtimelibrary/graphics/RoundedRectangle.js";
import { ScaleModeClass } from "../../runtimelibrary/graphics/ScaleMode.js";
import { ShapeClass } from "../../runtimelibrary/graphics/Shape.js";
import { SoundKlass as SoundClass } from "../../runtimelibrary/graphics/Sound.js";
import { SpriteClass, TileClass } from "../../runtimelibrary/graphics/Sprite.js";
import { SpriteLibraryClass } from "../../runtimelibrary/graphics/SpriteLibraryEnum.js";
import { TextClass } from "../../runtimelibrary/graphics/Text.js";
import { WorldClass } from "../../runtimelibrary/graphics/World.js";
import { InputClass } from "../../runtimelibrary/Input.js";
import { GamepadClass } from "../../runtimelibrary/Gamepad.js";
import { MathClass } from "../../runtimelibrary/Math.js";
import { MathToolsClass } from "../../runtimelibrary/MathToolsClass.js";
import { PrintStreamClass, SystemClass } from "../../runtimelibrary/System.js";
import { KeyListener, SystemToolsClass } from "../../runtimelibrary/SystemTools.js";
import { Runnable, TimerClass } from "../../runtimelibrary/Timer.js";
import { TokenType } from "../lexer/Token.js";
import { Interface, Klass, Visibility } from "../types/Class.js";
import { booleanPrimitiveType, BooleanType, CharacterType, charPrimitiveType, doublePrimitiveType, DoubleType, floatPrimitiveType, FloatType, IntegerType, intPrimitiveType, objectType, stringPrimitiveType, voidPrimitiveType, varType } from "../types/PrimitiveTypes.js";
import { Method, PrimitiveType, Type } from "../types/Types.js";
import { SymbolTable } from "./SymbolTable.js";
import { MapClass } from "../../runtimelibrary/collections/Map.js";
import { HashMapClass } from "../../runtimelibrary/collections/HashMap.js";
import { TriangleClass } from "../../runtimelibrary/graphics/Triangle.js";
import { LocalDateTimeClass, DayOfWeekEnum, MonthEnum } from "../../runtimelibrary/graphics/LocalDateTime.js";
import { LineClass } from "../../runtimelibrary/graphics/Line.js";
import { Vector2Class } from "../../runtimelibrary/Vector2.js";
import { MouseAdapterClass, MouseListenerInterface } from "../../runtimelibrary/graphics/MouseListener.js";
import { WebSocketClass } from "../../runtimelibrary/network/WebSocket.js";
import { WebSocketClientClass } from "../../runtimelibrary/network/WebSocketClient.js";
import { ProcessingClass } from "../../runtimelibrary/graphics/Processing.js";
import { TurtleClass } from "../../runtimelibrary/graphics/Turtle.js";
import { GNGZeichenfensterClass } from "../../runtimelibrary/gng/GNGZeichenfenster.js";
import { GNGRechteckClass } from "../../runtimelibrary/gng/GNGRechteck.js";
import { GNGBaseFigurClass } from "../../runtimelibrary/gng/GNGBaseFigur.js";
import { GNGAktionsempfaengerInterface } from "../../runtimelibrary/gng/GNGAktionsempfaenger.js";
import { GNGDreieckClass } from "../../runtimelibrary/gng/GNGDreieck.js";
import { GNGKreisClass } from "../../runtimelibrary/gng/GNGKreis.js";
import { GNGTurtleClass } from "../../runtimelibrary/gng/GNGTurtle.js";
import { GNGTextClass } from "../../runtimelibrary/gng/GNGText.js";
import { GNGEreignisbehandlung } from "../../runtimelibrary/gng/GNGEreignisbehandlung.js";
import { GNGFigurClass } from "../../runtimelibrary/gng/GNGFigur.js";
import { RandomClass } from "../../runtimelibrary/Random.js";
import { DirectionClass } from "../../runtimelibrary/graphics/Direction.js";
import { Patcher } from "./Patcher.js";
import { KeyEvent as KeyEventClass } from "../../runtimelibrary/graphics/KeyEvent.js";
import { Formatter } from "../../main/gui/Formatter.js";
import { RobotClass, RobotWorldClass } from "../../runtimelibrary/graphics/3d/Robot.js";
export class Module {
    constructor(file, main) {
        this.main = main;
        this.oldErrorDecorations = [];
        this.isSystemModule = false;
        this.breakpoints = [];
        this.breakpointDecorators = [];
        this.decoratorIdToBreakpointMap = {};
        this.errors = [[], [], [], []]; // 1st pass, 2nd pass, 3rd pass
        this.colorInformation = [];
        this.identifierPositions = {};
        this.methodCallPositions = {};
        if (file == null || this.main == null)
            return; // used by AdhocCompiler and ApiDoc
        this.file = file;
        // this.uri = monaco.Uri.from({ path: '/file' + (Module.maxUriNumber++) + '.learnJava', scheme: 'file' });
        let path = file.name;
        let uriCounter = Module.uriMap[path];
        if (uriCounter == null) {
            uriCounter = 0;
        }
        else {
            uriCounter++;
        }
        Module.uriMap[path] = uriCounter;
        if (uriCounter > 0)
            path += " (" + uriCounter + ")";
        this.uri = monaco.Uri.from({ path: path, scheme: 'inmemory' });
        this.model = monaco.editor.createModel(file.text, "myJava", this.uri);
        this.model.updateOptions({ tabSize: 3, bracketColorizationOptions: { enabled: true } });
        let formatter = new Formatter();
        if (main.isEmbedded() && file.text != null && file.text.length > 3) {
            let edits = formatter.format(this.model);
            this.model.applyEdits(edits);
        }
        this.lastSavedVersionId = this.model.getAlternativeVersionId();
        let that = this;
        this.model.onDidChangeContent(() => {
            let versionId = that.model.getAlternativeVersionId();
            if (versionId != that.lastSavedVersionId) {
                that.file.dirty = true;
                that.file.saved = false;
                that.file.identical_to_repository_version = false;
                that.lastSavedVersionId = versionId;
            }
            if (!that.main.isEmbedded()) {
                let main1 = main;
                if (main1.workspacesOwnerId != main1.user.id) {
                    if (that.file.text_before_revision == null || that.file.student_edited_after_revision) {
                        that.file.student_edited_after_revision = false;
                        that.file.text_before_revision = that.file.text;
                        that.file.saved = false;
                        main1.networkManager.sendUpdates(null, false);
                        main1.bottomDiv.homeworkManager.showHomeWorkRevisionButton();
                        main1.projectExplorer.renderHomeworkButton(that.file);
                    }
                }
                else {
                    that.file.student_edited_after_revision = true;
                }
            }
        });
    }
    toExportedModule() {
        return {
            name: this.file.name,
            text: this.getProgramTextFromMonacoModel(),
            identical_to_repository_version: this.file.identical_to_repository_version,
            is_copy_of_id: this.file.is_copy_of_id,
            repository_file_version: this.file.repository_file_version
        };
    }
    getMethodDeclarationAtPosition(position) {
        if (this.classDefinitionsAST == null)
            return null;
        for (let cd of this.classDefinitionsAST) {
            if (cd.type == TokenType.keywordClass || cd.type == TokenType.keywordEnum) {
                for (let methodAST of cd.methods) {
                    if (methodAST.position != null && methodAST.scopeTo != null) {
                        if (methodAST.position.line <= position.lineNumber && methodAST.scopeTo.line >= position.lineNumber) {
                            return methodAST;
                        }
                    }
                }
            }
        }
        return null;
    }
    static restoreFromData(f, main) {
        let patched = Patcher.patch(f.text);
        let f1 = {
            name: f.name,
            text: patched.patchedText,
            text_before_revision: f.text_before_revision,
            submitted_date: f.submitted_date,
            student_edited_after_revision: false,
            dirty: true,
            saved: !patched.modified,
            version: f.version,
            id: f.id,
            is_copy_of_id: f.is_copy_of_id,
            repository_file_version: f.repository_file_version,
            identical_to_repository_version: f.identical_to_repository_version
        };
        let m = new Module(f1, main);
        return m;
    }
    getFileData(workspace) {
        let file = this.file;
        let fd = {
            id: file.id,
            name: file.name,
            text: file.text,
            text_before_revision: file.text_before_revision,
            submitted_date: file.submitted_date,
            student_edited_after_revision: file.student_edited_after_revision,
            version: file.version,
            is_copy_of_id: file.is_copy_of_id,
            repository_file_version: file.repository_file_version,
            identical_to_repository_version: file.identical_to_repository_version,
            workspace_id: workspace.id,
            forceUpdate: false,
            file_type: 0
        };
        return fd;
    }
    pushMethodCallPosition(identifierPosition, commaPositions, possibleMethods, rightBracketPosition) {
        let lines = [];
        lines.push(identifierPosition.line);
        for (let cp of commaPositions) {
            if (lines.indexOf[cp.line] < 0) {
                lines.push(cp.line);
            }
        }
        let mcp = {
            identifierPosition: identifierPosition,
            commaPositions: commaPositions,
            possibleMethods: possibleMethods,
            rightBracketPosition: rightBracketPosition
        };
        for (let line of lines) {
            let mcpList = this.methodCallPositions[line];
            if (mcpList == null) {
                this.methodCallPositions[line] = [];
                mcpList = this.methodCallPositions[line];
            }
            mcpList.push(mcp);
        }
    }
    toggleBreakpoint(lineNumber, rerender) {
        this.getBreakpointPositionsFromEditor();
        if (this.getBreakpoint(lineNumber, true) == null) {
            this.setBreakpoint(lineNumber, 1);
        }
        if (rerender) {
            this.renderBreakpointDecorators();
        }
    }
    getBreakpoint(line, remove = false) {
        for (let i = 0; i < this.breakpoints.length; i++) {
            let b = this.breakpoints[i];
            if (b.line == line) {
                this.breakpoints.splice(i, 1);
                if (b.statement != null) {
                    b.statement.breakpoint = undefined;
                }
                return b;
            }
        }
        return null;
    }
    setBreakpoint(line, column) {
        let breakpoint = {
            line: line,
            column: column,
            statement: null
        };
        this.attachToStatement(breakpoint);
        this.breakpoints.push(breakpoint);
        return breakpoint;
    }
    attachToStatement(breakpoint, programList) {
        var _a;
        if (breakpoint.statement != null) {
            breakpoint.statement.breakpoint = undefined;
        }
        if (programList == null)
            programList = this.getPrograms();
        let nearestStatement = null;
        let nearestDistance = 100000;
        for (let program of programList) {
            for (let statement of program.statements) {
                let line = (_a = statement === null || statement === void 0 ? void 0 : statement.position) === null || _a === void 0 ? void 0 : _a.line;
                if (line != null && line >= breakpoint.line) {
                    if (line - breakpoint.line < nearestDistance) {
                        nearestStatement = statement;
                        nearestDistance = line - breakpoint.line;
                    }
                    break;
                }
            }
        }
        breakpoint.statement = nearestStatement;
        if (nearestStatement != null) {
            nearestStatement.breakpoint = breakpoint;
            // let pp = new ProgramPrinter();
            // console.log("Attached Breakpoint line " + breakpoint.line + ", column " + 
            //     breakpoint.column + " to statement " + pp.print([nearestStatement]));
        }
    }
    getPrograms() {
        let programList = [];
        if (this.mainProgram != null) {
            programList.push(this.mainProgram);
        }
        if (this.typeStore != null) {
            for (let type of this.typeStore.typeList) {
                if (type instanceof Klass) {
                    if (type.attributeInitializationProgram != null) {
                        programList.push(type.attributeInitializationProgram);
                    }
                    for (let method of type.methods) {
                        if (method.program != null) {
                            programList.push(method.program);
                        }
                    }
                    if (type.staticClass.attributeInitializationProgram != null) {
                        programList.push(type.staticClass.attributeInitializationProgram);
                    }
                    for (let method of type.staticClass.methods) {
                        if (method.program != null) {
                            programList.push(method.program);
                        }
                    }
                }
            }
        }
        return programList;
    }
    renderBreakpointDecorators() {
        this.getBreakpointPositionsFromEditor();
        let decorations = [];
        for (let breakpoint of this.breakpoints) {
            decorations.push({
                range: { startLineNumber: breakpoint.line, endLineNumber: breakpoint.line, startColumn: 1, endColumn: 1 },
                options: {
                    isWholeLine: true, className: "jo_decorate_breakpoint",
                    overviewRuler: {
                        color: "#580000",
                        position: monaco.editor.OverviewRulerLane.Left
                    },
                    minimap: {
                        color: "#580000",
                        position: monaco.editor.MinimapPosition.Inline
                    },
                    marginClassName: "jo_margin_breakpoint",
                    stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
                },
                //@ts-ignore
                breakpoint: breakpoint
            });
        }
        this.breakpointDecorators = this.main.getMonacoEditor().deltaDecorations(this.breakpointDecorators, decorations);
        this.decoratorIdToBreakpointMap = {};
        for (let i = 0; i < this.breakpointDecorators.length; i++) {
            this.decoratorIdToBreakpointMap[this.breakpointDecorators[i]] = this.breakpoints[i];
        }
    }
    getBreakpointPositionsFromEditor() {
        for (let decoration of this.main.getMonacoEditor().getModel().getAllDecorations()) {
            if (decoration.options.marginClassName == "margin_breakpoint") {
                let breakpoint = this.decoratorIdToBreakpointMap[decoration.id];
                if (breakpoint != null) {
                    breakpoint.line = decoration.range.startLineNumber;
                }
            }
        }
    }
    findSymbolTableAtPosition(line, column) {
        if (this.mainSymbolTable == null) {
            return null;
        }
        if (line > this.mainSymbolTable.positionTo.line ||
            line == this.mainSymbolTable.positionTo.line && column > this.mainSymbolTable.positionTo.column) {
            line = this.mainSymbolTable.positionTo.line;
            column = this.mainSymbolTable.positionTo.column - 1;
        }
        return this.mainSymbolTable.findTableAtPosition(line, column);
    }
    getErrorCount() {
        let ec = 0;
        for (let el of this.errors) {
            el.forEach(error => ec += error.level == "error" ? 1 : 0);
            // ec += el.length;
        }
        return ec;
    }
    hasMainProgram() {
        if (this.mainProgram == null)
            return false;
        if (this.mainProgram.statements == null)
            return false;
        return this.mainProgram.statements.length > 2 || this.mainProgram.statements.length == 2 && this.mainProgram.statements[0].type == TokenType.callMainMethod;
    }
    getProgramTextFromMonacoModel() {
        return this.model.getValue(monaco.editor.EndOfLinePreference.LF, false);
    }
    addIdentifierPosition(position, element) {
        let positionList = this.identifierPositions[position.line];
        if (positionList == null) {
            positionList = [];
            this.identifierPositions[position.line] = positionList;
        }
        positionList.push({
            position: position,
            element: element
        });
    }
    getTypeAtPosition(line, column) {
        let positionsOnLine = this.identifierPositions[line];
        if (positionsOnLine == null)
            return null;
        let foundPosition = null;
        for (let p of positionsOnLine) {
            if (column >= p.position.column && column <= p.position.column + p.position.length) {
                foundPosition = p;
                let element = foundPosition.element;
                if (element instanceof Method) {
                    return { type: element, isStatic: false };
                }
                // Attribute, Variable
                let type = (element instanceof Type) ? element : element.type;
                //@ts-ignore
                if (foundPosition.position.length > 0 && element.type != null) {
                    //@ts-ignore
                    return { type: type, isStatic: false };
                }
                return { type: type, isStatic: foundPosition.position.length > 0 };
            }
        }
        return null;
    }
    getElementAtPosition(line, column) {
        let positionsOnLine = this.identifierPositions[line];
        if (positionsOnLine == null)
            return null;
        let bestFoundPosition = null;
        for (let p of positionsOnLine) {
            if (column >= p.position.column && column <= p.position.column + p.position.length) {
                if (p.position.length > 0) {
                    if (bestFoundPosition == null) {
                        bestFoundPosition = p;
                    }
                    else {
                        if (p.element instanceof Method && bestFoundPosition.element instanceof Klass) {
                            bestFoundPosition = p;
                        }
                    }
                }
            }
        }
        return bestFoundPosition == null ? null : bestFoundPosition.element;
    }
    copy() {
        let m = new Module(this.file, this.main);
        m.model = this.model;
        m.mainProgram = this.mainProgram;
        this.mainProgram = null;
        m.mainSymbolTable = this.mainSymbolTable;
        this.mainSymbolTable = null;
        m.typeStore = this.typeStore;
        // this.typeStore = null;
        m.isStartable = this.isStartable;
        m.dependsOnModulesWithErrors = this.dependsOnModulesWithErrors;
        m.breakpoints = this.breakpoints;
        this.breakpoints = [];
        let programs = m.getPrograms();
        programs.forEach((p) => p.module = m);
        for (let b of m.breakpoints) {
            this.breakpoints.push({
                line: b.line,
                column: b.column,
                statement: null
            });
            m.attachToStatement(b, programs);
        }
        this.file.dirty = true;
        return m;
    }
    clear() {
        this.identifierPositions = {};
        if (this.file != null && this.file.dirty) {
            // Lexer
            this.tokenList = null;
            this.errors[0] = [];
            // AST Parser
            this.errors[1] = [];
        }
        // type resolver
        this.errors[2] = [];
        this.typeNodes = [];
        this.typeStore = new TypeStore();
        // Code generator
        this.errors[3] = [];
        this.mainSymbolTable = new SymbolTable(null, { line: 1, column: 1, length: 1 }, { line: 100000, column: 1, length: 0 });
        this.mainProgram = null;
        this.methodCallPositions = {};
        this.dependsOnModules = new Map();
    }
    hasErrors() {
        for (let el of this.errors) {
            if (el.find(error => error.level == "error")) {
                return true;
            }
            // if (el.length > 0) {
            //     return true;
            // }
        }
        return false;
    }
    getSortedAndFilteredErrors() {
        let list = [];
        for (let el of this.errors) {
            list = list.concat(el);
        }
        list.sort((a, b) => {
            if (a.position.line > b.position.line) {
                return 1;
            }
            if (b.position.line > a.position.line) {
                return -1;
            }
            if (a.position.column >= b.position.column) {
                return 1;
            }
            return -1;
        });
        for (let i = 0; i < list.length - 1; i++) {
            let e1 = list[i];
            let e2 = list[i + 1];
            if (e1.position.line == e2.position.line && e1.position.column + 10 > e2.position.column) {
                if (this.errorLevelCompare(e1.level, e2.level) == 1) {
                    list.splice(i + 1, 1);
                }
                else {
                    list.splice(i, 1);
                }
                i--;
            }
        }
        return list;
    }
    errorLevelCompare(level1, level2) {
        if (level1 == "error")
            return 1;
        if (level2 == "error")
            return 2;
        if (level1 == "warning")
            return 1;
        if (level2 == "warning")
            return 2;
        return 1;
    }
    renderStartButton() {
        var _a, _b, _c;
        let $buttonDiv = (_c = (_b = (_a = this.file) === null || _a === void 0 ? void 0 : _a.panelElement) === null || _b === void 0 ? void 0 : _b.$htmlFirstLine) === null || _c === void 0 ? void 0 : _c.find('.jo_additionalButtonStart');
        if ($buttonDiv == null)
            return;
        $buttonDiv.find('.jo_startButton').remove();
        if (this.isStartable) {
            let $startButtonDiv = jQuery('<div class="jo_startButton img_start-dark jo_button jo_active" title="Hauptprogramm in der Datei starten"></div>');
            $buttonDiv.append($startButtonDiv);
            let that = this;
            $startButtonDiv.on('mousedown', (e) => e.stopPropagation());
            $startButtonDiv.on('click', (e) => {
                e.stopPropagation();
                that.main.setModuleActive(that);
                that.main.getInterpreter().start();
            });
        }
    }
}
Module.maxUriNumber = 0;
Module.uriMap = {};
export class BaseModule extends Module {
    constructor(main) {
        super({ name: "Base Module", text: "", text_before_revision: null, submitted_date: null, student_edited_after_revision: false, dirty: false, saved: true, version: 1, identical_to_repository_version: true }, main);
        this.isSystemModule = true;
        this.mainProgram = null;
        this.clear();
        this.typeStore.addType(voidPrimitiveType);
        this.typeStore.addType(intPrimitiveType);
        this.typeStore.addType(floatPrimitiveType);
        this.typeStore.addType(doublePrimitiveType);
        this.typeStore.addType(charPrimitiveType);
        this.typeStore.addType(booleanPrimitiveType);
        this.typeStore.addType(stringPrimitiveType);
        this.typeStore.addType(objectType);
        this.typeStore.addType(varType);
        this.typeStore.addType(IntegerType);
        this.typeStore.addType(FloatType);
        this.typeStore.addType(DoubleType);
        this.typeStore.addType(CharacterType);
        this.typeStore.addType(BooleanType);
        // Collections Framework
        this.typeStore.addType(new IteratorClass(this));
        this.typeStore.addType(new IterableClass(this));
        this.typeStore.addType(new CollectionClass(this));
        this.typeStore.addType(new ListClass(this));
        this.typeStore.addType(new ArrayListClass(this));
        this.typeStore.addType(new VectorClass(this));
        this.typeStore.addType(new QueueClass(this));
        this.typeStore.addType(new DequeClass(this));
        this.typeStore.addType(new LinkedListClass(this));
        this.typeStore.addType(new StackClass(this));
        this.typeStore.addType(new ListIteratorImplClass(this));
        this.typeStore.addType(new SetClass(this));
        this.typeStore.addType(new HashSetClass(this));
        this.typeStore.addType(new LinkedHashSetClass(this));
        this.typeStore.addType(new SetIteratorImplClass(this));
        this.typeStore.addType(new MapClass(this));
        this.typeStore.addType(new HashMapClass(this));
        this.typeStore.addType(new ConsoleClass(this));
        this.typeStore.addType(new MathClass(this));
        this.typeStore.addType(new RandomClass(this));
        this.typeStore.addType(new Vector2Class(this));
        this.typeStore.addType(new MathToolsClass(this));
        this.typeStore.addType(new KeyClass(this));
        this.typeStore.addType(new SoundClass(this));
        this.typeStore.addType(new InputClass(this));
        this.typeStore.addType(new Runnable(this));
        this.typeStore.addType(new TimerClass(this));
        this.typeStore.addType(new ColorClass(this));
        this.typeStore.addType(new ActorClass(this));
        this.typeStore.addType(new DirectionClass(this));
        this.typeStore.addType(new ShapeClass(this));
        this.typeStore.addType(new FilledShapeClass(this));
        this.typeStore.addType(new RectangleClass(this));
        this.typeStore.addType(new RoundedRectangleClass(this));
        this.typeStore.addType(new CircleClass(this));
        this.typeStore.addType(new SectorClass(this));
        this.typeStore.addType(new ArcClass(this));
        this.typeStore.addType(new EllipseClass(this));
        this.typeStore.addType(new BitmapClass(this));
        this.typeStore.addType(new AlignmentClass(this));
        this.typeStore.addType(new TextClass(this));
        this.typeStore.addType(new ScaleModeClass(this));
        this.typeStore.addType(new SpriteLibraryClass(this));
        this.typeStore.addType(new RepeatTypeClass(this));
        this.typeStore.addType(new TileClass(this));
        this.typeStore.addType(new SpriteClass(this));
        this.typeStore.addType(new CollisionPairClass(this));
        this.typeStore.addType(new GroupClass(this));
        this.typeStore.addType(new PolygonClass(this));
        this.typeStore.addType(new LineClass(this));
        this.typeStore.addType(new TriangleClass(this));
        this.typeStore.addType(new TurtleClass(this));
        this.typeStore.addType(new MouseListenerInterface(this));
        this.typeStore.addType(new MouseAdapterClass(this));
        this.typeStore.addType(new GamepadClass(this));
        this.typeStore.addType(new WorldClass(this));
        this.typeStore.addType(new ProcessingClass(this));
        this.typeStore.getType("Actor").registerWorldType();
        this.typeStore.addType(new PrintStreamClass(this));
        this.typeStore.addType(new KeyListener(this));
        this.typeStore.addType(new SystemClass(this));
        this.typeStore.addType(new SystemToolsClass(this));
        this.typeStore.addType(new DayOfWeekEnum(this));
        this.typeStore.addType(new MonthEnum(this));
        this.typeStore.addType(new LocalDateTimeClass(this));
        this.typeStore.addType(new WebSocketClientClass(this));
        this.typeStore.addType(new WebSocketClass(this));
        this.typeStore.addType(new RobotWorldClass(this));
        this.typeStore.addType(new RobotClass(this));
        stringPrimitiveType.module = this;
        // stringPrimitiveType.baseClass = <any>(this.typeStore.getType("Object"));
        // stringPrimitiveType.baseClass = objectType;
        // IntegerType.baseClass = objectType;
        // DoubleType.baseClass = objectType;
        // FloatType.baseClass = objectType;
        // CharacterType.baseClass = objectType;
        // BooleanType.baseClass = objectType;
    }
    clearUsagePositions() {
        for (let type of this.typeStore.typeList) {
            type.clearUsagePositions();
        }
    }
}
export class GNGModule extends Module {
    constructor(main, moduleStore) {
        super({ name: "Graphics and Games - Module", text: "", text_before_revision: null, submitted_date: null, student_edited_after_revision: false, dirty: false, saved: true, version: 1, identical_to_repository_version: true }, main);
        this.isSystemModule = true;
        this.mainProgram = null;
        this.clear();
        this.typeStore.addType(new GNGAktionsempfaengerInterface(this));
        this.typeStore.addType(new GNGBaseFigurClass(this, moduleStore));
        this.typeStore.addType(new GNGZeichenfensterClass(this, moduleStore));
        this.typeStore.addType(new GNGEreignisbehandlung(this, moduleStore));
        this.typeStore.addType(new GNGRechteckClass(this, moduleStore));
        this.typeStore.addType(new GNGDreieckClass(this, moduleStore));
        this.typeStore.addType(new GNGKreisClass(this, moduleStore));
        this.typeStore.addType(new GNGTextClass(this, moduleStore));
        this.typeStore.addType(new GNGTurtleClass(this, moduleStore));
        this.typeStore.addType(new GNGFigurClass(this, moduleStore));
        this.typeStore.addType(new KeyEventClass(this, moduleStore));
    }
    clearUsagePositions() {
        for (let type of this.typeStore.typeList) {
            type.clearUsagePositions();
        }
    }
}
export class ModuleStore {
    constructor(main, withBaseModule, additionalLibraries = []) {
        this.main = main;
        this.additionalLibraries = additionalLibraries;
        this.modules = [];
        this.moduleMap = {};
        this.dirty = false;
        if (withBaseModule) {
            this.baseModule = new BaseModule(main);
            this.putModule(this.baseModule);
        }
        // additionalLibraries = ["gng"];
        for (let lib of additionalLibraries) {
            this.addLibraryModule(lib);
        }
    }
    addLibraryModule(identifier) {
        switch (identifier) {
            case "gng":
                this.putModule(new GNGModule(this.main, this));
                break;
        }
    }
    setAdditionalLibraries(additionalLibraries) {
        this.modules = this.modules.filter(m => (!m.isSystemModule) || m instanceof BaseModule);
        this.moduleMap = {};
        for (let m of this.modules) {
            this.moduleMap[m.file.name] = m;
        }
        if (additionalLibraries != null) {
            for (let lib of additionalLibraries) {
                this.addLibraryModule(lib);
            }
        }
    }
    findModuleById(module_id) {
        for (let module of this.modules) {
            if (module.file.id == module_id)
                return module;
        }
        return null;
    }
    getBaseModule() {
        return this.baseModule;
    }
    clearUsagePositions() {
        this.baseModule.clearUsagePositions();
    }
    copy() {
        let ms = new ModuleStore(this.main, true);
        for (let m of this.modules) {
            if (!m.isSystemModule) {
                ms.putModule(m.copy());
            }
        }
        return ms;
    }
    findModuleByFile(file) {
        for (let m of this.modules) {
            if (m.file == file) {
                return m;
            }
        }
        return null;
    }
    hasErrors() {
        for (let m of this.modules) {
            if (m.hasErrors()) {
                return true;
            }
        }
        return false;
    }
    getFirstModule() {
        if (this.modules.length > 0) {
            for (let mo of this.modules) {
                if (!mo.isSystemModule) {
                    return mo;
                }
            }
        }
        return null;
    }
    isDirty() {
        if (this.dirty) {
            this.dirty = false;
            return true;
        }
        let dirty = false;
        for (let m of this.modules) {
            if (m.file.dirty) {
                dirty = true;
                break;
            }
        }
        return dirty;
    }
    getModules(includeSystemModules, excludedModuleName) {
        let ret = [];
        for (let m of this.modules) {
            if (m.file.name != excludedModuleName) {
                if (!m.isSystemModule || includeSystemModules) {
                    ret.push(m);
                }
            }
        }
        return ret;
    }
    putModule(module) {
        this.modules.push(module);
        this.moduleMap[module.file.name] = module;
    }
    removeModuleWithFile(file) {
        for (let m of this.modules) {
            if (m.file == file) {
                this.removeModule(m);
                break;
            }
        }
    }
    removeModule(module) {
        if (this.modules.indexOf(module) < 0)
            return;
        this.modules.splice(this.modules.indexOf(module), 1);
        this.moduleMap[module.file.name] = undefined;
        this.dirty = true;
    }
    getModule(moduleName) {
        return this.moduleMap[moduleName];
    }
    getType(identifier) {
        for (let module of this.modules) {
            if (module.typeStore != null) {
                let type = module.typeStore.getType(identifier);
                if (type != null) {
                    return { type: type, module: module };
                }
            }
        }
        return null;
    }
    getTypeCompletionItems(moduleContext, rangeToReplace) {
        let completionItems = [];
        for (let module of this.modules) {
            if (module.typeStore != null) {
                for (let type of module.typeStore.typeList) {
                    if (module == moduleContext || (type instanceof Klass && type.visibility == Visibility.public)
                        || module.isSystemModule) {
                        let detail = "Klasse";
                        if (type.documentation != null) {
                            detail = type.documentation;
                        }
                        else if (module.isSystemModule) {
                            if (type instanceof PrimitiveType) {
                                detail = "Primitiver Datentyp";
                            }
                            else {
                                detail = "Systemklasse";
                            }
                        }
                        let item = {
                            label: type.identifier,
                            detail: detail,
                            insertText: type.identifier,
                            kind: type instanceof PrimitiveType ?
                                monaco.languages.CompletionItemKind.Struct : monaco.languages.CompletionItemKind.Class,
                            range: rangeToReplace,
                            generic: ((type instanceof Klass || type instanceof Interface) && type.typeVariables.length > 0)
                        };
                        completionItems.push(item);
                    }
                }
            }
        }
        return completionItems;
    }
}
export class TypeStore {
    constructor() {
        this.typeList = [];
        this.typeMap = new Map();
    }
    addType(type) {
        this.typeList.push(type);
        this.typeMap.set(type.identifier, type);
    }
    clear() {
        this.typeList.length = 0;
        this.typeMap.clear();
    }
    getType(identifier) {
        return this.typeMap.get(identifier);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9jb21waWxlci9wYXJzZXIvTW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSwrQ0FBK0MsQ0FBQztBQUMvRSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sZ0RBQWdELENBQUM7QUFDakYsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDhDQUE4QyxDQUFDO0FBQzdFLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSw4Q0FBOEMsQ0FBQztBQUM3RSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sMENBQTBDLENBQUM7QUFDckUsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sc0RBQXNELENBQUM7QUFDN0YsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZFLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSw0Q0FBNEMsQ0FBQztBQUN6RSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0seUNBQXlDLENBQUM7QUFDbkUsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0scURBQXFELENBQUM7QUFDM0YsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLDZDQUE2QyxDQUFDO0FBQzNFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLG1EQUFtRCxDQUFDO0FBQ3ZGLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQztBQUN2RSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sMkNBQTJDLENBQUM7QUFDdkUsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLGdEQUFnRCxDQUFDO0FBQ2pGLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUMvRCxPQUFPLEVBQUUsS0FBSyxJQUFJLFVBQVUsRUFBRSxNQUFNLHdDQUF3QyxDQUFDO0FBQzdFLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSw0Q0FBNEMsQ0FBQztBQUM1RSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0seUNBQXlDLENBQUM7QUFDdEUsT0FBTyxFQUFFLFdBQVcsSUFBSSxXQUFXLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztBQUNyRixPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0seUNBQXlDLENBQUM7QUFDdEUsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLHNDQUFzQyxDQUFDO0FBQ2hFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQztBQUNwRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sMENBQTBDLENBQUM7QUFDeEUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sOENBQThDLENBQUM7QUFDaEYsT0FBTyxFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxNQUFNLHdDQUF3QyxDQUFDO0FBQ3hGLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUNoRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sMENBQTBDLENBQUM7QUFDeEUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDRDQUE0QyxDQUFDO0FBQzVFLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSw2Q0FBNkMsQ0FBQztBQUM5RSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSxtREFBbUQsQ0FBQztBQUMxRixPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sNENBQTRDLENBQUM7QUFDNUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLHdDQUF3QyxDQUFDO0FBQ3BFLE9BQU8sRUFBRSxVQUFVLElBQUksVUFBVSxFQUFFLE1BQU0sd0NBQXdDLENBQUM7QUFDbEYsT0FBTyxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztBQUNqRixPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxvREFBb0QsQ0FBQztBQUN4RixPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sdUNBQXVDLENBQUM7QUFDbEUsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLHdDQUF3QyxDQUFDO0FBQ3BFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUMzRCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFDL0QsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQ3pELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQztBQUN4RSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFDL0UsT0FBTyxFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHFDQUFxQyxDQUFDO0FBQ3BGLE9BQU8sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFHckUsT0FBTyxFQUF1QixTQUFTLEVBQTZCLE1BQU0sbUJBQW1CLENBQUM7QUFDOUYsT0FBTyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDakUsT0FBTyxFQUFFLG9CQUFvQixFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsbUJBQW1CLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLG1CQUFtQixFQUFFLGlCQUFpQixFQUFFLE9BQU8sRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQzdRLE9BQU8sRUFBYSxNQUFNLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBWSxNQUFNLG1CQUFtQixDQUFDO0FBR3JGLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMvQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0seUNBQXlDLENBQUM7QUFDbkUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLDZDQUE2QyxDQUFDO0FBQzNFLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQztBQUUxRSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxNQUFNLGdEQUFnRCxDQUFDO0FBQzlHLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSx1Q0FBdUMsQ0FBQztBQUNsRSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFDL0QsT0FBTyxFQUFFLGlCQUFpQixFQUFFLHNCQUFzQixFQUFFLE1BQU0sZ0RBQWdELENBQUM7QUFDM0csT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDJDQUEyQyxDQUFDO0FBQzNFLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGlEQUFpRCxDQUFDO0FBQ3ZGLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSw2Q0FBNkMsQ0FBQztBQUM5RSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0seUNBQXlDLENBQUM7QUFDdEUsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sK0NBQStDLENBQUM7QUFDdkYsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0seUNBQXlDLENBQUM7QUFDM0UsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sMENBQTBDLENBQUM7QUFDN0UsT0FBTyxFQUFFLDZCQUE2QixFQUFFLE1BQU0sa0RBQWtELENBQUM7QUFDakcsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLHdDQUF3QyxDQUFDO0FBQ3pFLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUNyRSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sdUNBQXVDLENBQUM7QUFDdkUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLHFDQUFxQyxDQUFDO0FBQ25FLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLG1EQUFtRCxDQUFDO0FBQzFGLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUNyRSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFDN0QsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDRDQUE0QyxDQUFDO0FBQzVFLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDdkMsT0FBTyxFQUFFLFFBQVEsSUFBSSxhQUFhLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQztBQUN0RixPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDeEQsT0FBTyxFQUFFLFVBQVUsRUFBRSxlQUFlLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQztBQWlEeEYsTUFBTSxPQUFPLE1BQU07SUFvRGYsWUFBWSxJQUFVLEVBQVMsSUFBYztRQUFkLFNBQUksR0FBSixJQUFJLENBQVU7UUEvQzdDLHdCQUFtQixHQUFhLEVBQUUsQ0FBQztRQUluQyxtQkFBYyxHQUFZLEtBQUssQ0FBQztRQUVoQyxnQkFBVyxHQUFpQixFQUFFLENBQUM7UUFDL0IseUJBQW9CLEdBQWEsRUFBRSxDQUFDO1FBQ3BDLCtCQUEwQixHQUFpQyxFQUFFLENBQUM7UUFFOUQsV0FBTSxHQUFjLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQywrQkFBK0I7UUFFckUscUJBQWdCLEdBQXlDLEVBQUUsQ0FBQztRQXlCNUQsd0JBQW1CLEdBQTZDLEVBQUUsQ0FBQztRQUNuRSx3QkFBbUIsR0FBNkMsRUFBRSxDQUFDO1FBVS9ELElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUk7WUFBRSxPQUFPLENBQUMsbUNBQW1DO1FBRWxGLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLDBHQUEwRztRQUMxRyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBRXJCLElBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsSUFBSSxVQUFVLElBQUksSUFBSSxFQUFFO1lBQ3BCLFVBQVUsR0FBRyxDQUFDLENBQUM7U0FDbEI7YUFBTTtZQUNILFVBQVUsRUFBRSxDQUFDO1NBQ2hCO1FBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUM7UUFFakMsSUFBSSxVQUFVLEdBQUcsQ0FBQztZQUFFLElBQUksSUFBSSxJQUFJLEdBQUcsVUFBVSxHQUFHLEdBQUcsQ0FBQztRQUNwRCxJQUFJLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUMvRCxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN0RSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsMEJBQTBCLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3RGLElBQUksU0FBUyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7UUFFaEMsSUFBRyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFDO1lBQzlELElBQUksS0FBSyxHQUFnQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNoQztRQUVELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFFL0QsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRWhCLElBQUksQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFO1lBQy9CLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztZQUVyRCxJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUU7Z0JBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztnQkFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO2dCQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLCtCQUErQixHQUFHLEtBQUssQ0FBQztnQkFDbEQsSUFBSSxDQUFDLGtCQUFrQixHQUFHLFNBQVMsQ0FBQzthQUN2QztZQUVELElBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFDO2dCQUN2QixJQUFJLEtBQUssR0FBZSxJQUFJLENBQUM7Z0JBQzdCLElBQUcsS0FBSyxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFDO29CQUN4QyxJQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQTZCLEVBQUM7d0JBQ2pGLElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQTZCLEdBQUcsS0FBSyxDQUFDO3dCQUNoRCxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO3dCQUNoRCxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7d0JBQ3hCLEtBQUssQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQzt3QkFDOUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsMEJBQTBCLEVBQUUsQ0FBQzt3QkFDN0QsS0FBSyxDQUFDLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQ3pEO2lCQUNKO3FCQUFNO29CQUNILElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQTZCLEdBQUcsSUFBSSxDQUFDO2lCQUNsRDthQUNKO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFUCxDQUFDO0lBRUQsZ0JBQWdCO1FBQ1osT0FBTztZQUNILElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7WUFDcEIsSUFBSSxFQUFFLElBQUksQ0FBQyw2QkFBNkIsRUFBRTtZQUMxQywrQkFBK0IsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLCtCQUErQjtZQUMxRSxhQUFhLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhO1lBQ3RDLHVCQUF1QixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCO1NBQzdELENBQUE7SUFDTCxDQUFDO0lBRUQsOEJBQThCLENBQUMsUUFBaUQ7UUFFNUUsSUFBRyxJQUFJLENBQUMsbUJBQW1CLElBQUksSUFBSTtZQUFFLE9BQU8sSUFBSSxDQUFDO1FBRWpELEtBQUksSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFDO1lBQ25DLElBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLFdBQVcsRUFBQztnQkFDckUsS0FBSSxJQUFJLFNBQVMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFDO29CQUM1QixJQUFHLFNBQVMsQ0FBQyxRQUFRLElBQUksSUFBSSxJQUFJLFNBQVMsQ0FBQyxPQUFPLElBQUksSUFBSSxFQUFDO3dCQUN2RCxJQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLFFBQVEsQ0FBQyxVQUFVLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksUUFBUSxDQUFDLFVBQVUsRUFBQzs0QkFDL0YsT0FBTyxTQUFTLENBQUM7eUJBQ3BCO3FCQUNKO2lCQUNKO2FBQ0o7U0FDSjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBRWhCLENBQUM7SUFHRCxNQUFNLENBQUMsZUFBZSxDQUFDLENBQVcsRUFBRSxJQUFjO1FBRTlDLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXBDLElBQUksRUFBRSxHQUFTO1lBQ1gsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJO1lBQ1osSUFBSSxFQUFFLE9BQU8sQ0FBQyxXQUFXO1lBQ3pCLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxvQkFBb0I7WUFDNUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxjQUFjO1lBQ2hDLDZCQUE2QixFQUFFLEtBQUs7WUFDcEMsS0FBSyxFQUFFLElBQUk7WUFDWCxLQUFLLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUTtZQUN4QixPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU87WUFDbEIsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFO1lBQ1IsYUFBYSxFQUFFLENBQUMsQ0FBQyxhQUFhO1lBQzlCLHVCQUF1QixFQUFFLENBQUMsQ0FBQyx1QkFBdUI7WUFDbEQsK0JBQStCLEVBQUUsQ0FBQyxDQUFDLCtCQUErQjtTQUNyRSxDQUFBO1FBRUQsSUFBSSxDQUFDLEdBQVcsSUFBSSxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXJDLE9BQU8sQ0FBQyxDQUFDO0lBRWIsQ0FBQztJQUVELFdBQVcsQ0FBQyxTQUFvQjtRQUM1QixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3JCLElBQUksRUFBRSxHQUFhO1lBQ2YsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ1gsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2Ysb0JBQW9CLEVBQUUsSUFBSSxDQUFDLG9CQUFvQjtZQUMvQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWM7WUFDbkMsNkJBQTZCLEVBQUUsSUFBSSxDQUFDLDZCQUE2QjtZQUNqRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87WUFDckIsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1lBQ2pDLHVCQUF1QixFQUFFLElBQUksQ0FBQyx1QkFBdUI7WUFDckQsK0JBQStCLEVBQUUsSUFBSSxDQUFDLCtCQUErQjtZQUNyRSxZQUFZLEVBQUUsU0FBUyxDQUFDLEVBQUU7WUFDMUIsV0FBVyxFQUFFLEtBQUs7WUFDbEIsU0FBUyxFQUFFLENBQUM7U0FDZixDQUFBO1FBRUQsT0FBTyxFQUFFLENBQUM7SUFDZCxDQUFDO0lBRUQsc0JBQXNCLENBQUMsa0JBQWdDLEVBQUUsY0FBOEIsRUFDbkYsZUFBa0MsRUFBRSxvQkFBa0M7UUFFdEUsSUFBSSxLQUFLLEdBQWEsRUFBRSxDQUFDO1FBQ3pCLEtBQUssQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsS0FBSyxJQUFJLEVBQUUsSUFBSSxjQUFjLEVBQUU7WUFDM0IsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQzVCLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3ZCO1NBQ0o7UUFFRCxJQUFJLEdBQUcsR0FBdUI7WUFDMUIsa0JBQWtCLEVBQUUsa0JBQWtCO1lBQ3RDLGNBQWMsRUFBRSxjQUFjO1lBQzlCLGVBQWUsRUFBRSxlQUFlO1lBQ2hDLG9CQUFvQixFQUFFLG9CQUFvQjtTQUM3QyxDQUFDO1FBRUYsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7WUFDcEIsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzdDLElBQUksT0FBTyxJQUFJLElBQUksRUFBRTtnQkFDakIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDcEMsT0FBTyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUM1QztZQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDckI7SUFFTCxDQUFDO0lBR0QsZ0JBQWdCLENBQUMsVUFBa0IsRUFBRSxRQUFpQjtRQUNsRCxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQztRQUN4QyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRTtZQUM5QyxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUNyQztRQUNELElBQUksUUFBUSxFQUFFO1lBQ1YsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7U0FDckM7SUFDTCxDQUFDO0lBRUQsYUFBYSxDQUFDLElBQVksRUFBRSxTQUFrQixLQUFLO1FBRS9DLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM5QyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVCLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLENBQUMsU0FBUyxJQUFJLElBQUksRUFBRTtvQkFDckIsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO2lCQUN0QztnQkFDRCxPQUFPLENBQUMsQ0FBQzthQUNaO1NBQ0o7UUFFRCxPQUFPLElBQUksQ0FBQztJQUVoQixDQUFDO0lBRUQsYUFBYSxDQUFDLElBQVksRUFBRSxNQUFjO1FBRXRDLElBQUksVUFBVSxHQUFlO1lBQ3pCLElBQUksRUFBRSxJQUFJO1lBQ1YsTUFBTSxFQUFFLE1BQU07WUFDZCxTQUFTLEVBQUUsSUFBSTtTQUNsQixDQUFBO1FBRUQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRWxDLE9BQU8sVUFBVSxDQUFDO0lBRXRCLENBQUM7SUFFRCxpQkFBaUIsQ0FBQyxVQUFzQixFQUFFLFdBQXVCOztRQUU3RCxJQUFJLFVBQVUsQ0FBQyxTQUFTLElBQUksSUFBSSxFQUFFO1lBQzlCLFVBQVUsQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztTQUMvQztRQUVELElBQUksV0FBVyxJQUFJLElBQUk7WUFBRSxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRTFELElBQUksZ0JBQWdCLEdBQWMsSUFBSSxDQUFDO1FBQ3ZDLElBQUksZUFBZSxHQUFXLE1BQU0sQ0FBQztRQUVyQyxLQUFLLElBQUksT0FBTyxJQUFJLFdBQVcsRUFBRTtZQUM3QixLQUFLLElBQUksU0FBUyxJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUU7Z0JBRXRDLElBQUksSUFBSSxTQUFHLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxRQUFRLDBDQUFFLElBQUksQ0FBQztnQkFDckMsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxVQUFVLENBQUMsSUFBSSxFQUFFO29CQUN6QyxJQUFJLElBQUksR0FBRyxVQUFVLENBQUMsSUFBSSxHQUFHLGVBQWUsRUFBRTt3QkFDMUMsZ0JBQWdCLEdBQUcsU0FBUyxDQUFDO3dCQUM3QixlQUFlLEdBQUcsSUFBSSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUM7cUJBQzVDO29CQUVELE1BQU07aUJBQ1Q7YUFFSjtTQUVKO1FBRUQsVUFBVSxDQUFDLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQztRQUN4QyxJQUFJLGdCQUFnQixJQUFJLElBQUksRUFBRTtZQUMxQixnQkFBZ0IsQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQ3pDLGlDQUFpQztZQUNqQyw2RUFBNkU7WUFDN0UsNEVBQTRFO1NBQy9FO0lBRUwsQ0FBQztJQUlELFdBQVc7UUFDUCxJQUFJLFdBQVcsR0FBYyxFQUFFLENBQUM7UUFFaEMsSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksRUFBRTtZQUMxQixXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUN0QztRQUVELElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLEVBQUU7WUFFeEIsS0FBSyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRTtnQkFDdEMsSUFBSSxJQUFJLFlBQVksS0FBSyxFQUFFO29CQUN2QixJQUFJLElBQUksQ0FBQyw4QkFBOEIsSUFBSSxJQUFJLEVBQUU7d0JBQzdDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUM7cUJBQ3pEO29CQUNELEtBQUssSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTt3QkFDN0IsSUFBSSxNQUFNLENBQUMsT0FBTyxJQUFJLElBQUksRUFBRTs0QkFDeEIsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7eUJBQ3BDO3FCQUNKO29CQUNELElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsSUFBSSxJQUFJLEVBQUU7d0JBQ3pELFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO3FCQUNyRTtvQkFDRCxLQUFLLElBQUksTUFBTSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFO3dCQUN6QyxJQUFJLE1BQU0sQ0FBQyxPQUFPLElBQUksSUFBSSxFQUFFOzRCQUN4QixXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQzt5QkFDcEM7cUJBQ0o7aUJBQ0o7YUFDSjtTQUVKO1FBRUQsT0FBTyxXQUFXLENBQUM7SUFFdkIsQ0FBQztJQUVELDBCQUEwQjtRQUV0QixJQUFJLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQztRQUV4QyxJQUFJLFdBQVcsR0FBMEMsRUFBRSxDQUFDO1FBRTVELEtBQUssSUFBSSxVQUFVLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNyQyxXQUFXLENBQUMsSUFBSSxDQUFDO2dCQUNiLEtBQUssRUFBRSxFQUFFLGVBQWUsRUFBRSxVQUFVLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRSxVQUFVLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRTtnQkFDekcsT0FBTyxFQUFFO29CQUNMLFdBQVcsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLHdCQUF3QjtvQkFDdEQsYUFBYSxFQUFFO3dCQUNYLEtBQUssRUFBRSxTQUFTO3dCQUNoQixRQUFRLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJO3FCQUNqRDtvQkFDRCxPQUFPLEVBQUU7d0JBQ0wsS0FBSyxFQUFFLFNBQVM7d0JBQ2hCLFFBQVEsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNO3FCQUNqRDtvQkFDRCxlQUFlLEVBQUUsc0JBQXNCO29CQUN2QyxVQUFVLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQywyQkFBMkI7aUJBQy9FO2dCQUNELFlBQVk7Z0JBQ1osVUFBVSxFQUFFLFVBQVU7YUFDekIsQ0FBQyxDQUFDO1NBQ047UUFFRCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFakgsSUFBSSxDQUFDLDBCQUEwQixHQUFHLEVBQUUsQ0FBQztRQUNyQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN2RCxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN2RjtJQUVMLENBQUM7SUFFRCxnQ0FBZ0M7UUFDNUIsS0FBSyxJQUFJLFVBQVUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLGlCQUFpQixFQUFFLEVBQUU7WUFDL0UsSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLGVBQWUsSUFBSSxtQkFBbUIsRUFBRTtnQkFDM0QsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDaEUsSUFBSSxVQUFVLElBQUksSUFBSSxFQUFFO29CQUNwQixVQUFVLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDO2lCQUN0RDthQUNKO1NBQ0o7SUFDTCxDQUFDO0lBRUQseUJBQXlCLENBQUMsSUFBWSxFQUFFLE1BQWM7UUFDbEQsSUFBSSxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksRUFBRTtZQUM5QixPQUFPLElBQUksQ0FBQztTQUNmO1FBRUQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsSUFBSTtZQUMzQyxJQUFJLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsSUFBSSxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQ2pHO1lBQ0UsSUFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztZQUM1QyxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztTQUN2RDtRQUVELE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELGFBQWE7UUFFVCxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDWCxLQUFLLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDeEIsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxLQUFLLENBQUMsS0FBSyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRCxtQkFBbUI7U0FDdEI7UUFFRCxPQUFPLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFFRCxjQUFjO1FBRVYsSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUk7WUFBRSxPQUFPLEtBQUssQ0FBQztRQUMzQyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxJQUFJLElBQUk7WUFBRSxPQUFPLEtBQUssQ0FBQztRQUN0RCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLGNBQWMsQ0FBQztJQUVoSyxDQUFDO0lBRUQsNkJBQTZCO1FBQ3pCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDNUUsQ0FBQztJQUdELHFCQUFxQixDQUFDLFFBQXNCLEVBQUUsT0FBNkM7UUFDdkYsSUFBSSxZQUFZLEdBQXlCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakYsSUFBSSxZQUFZLElBQUksSUFBSSxFQUFFO1lBQ3RCLFlBQVksR0FBRyxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxZQUFZLENBQUM7U0FDMUQ7UUFDRCxZQUFZLENBQUMsSUFBSSxDQUFDO1lBQ2QsUUFBUSxFQUFFLFFBQVE7WUFDbEIsT0FBTyxFQUFFLE9BQU87U0FDbkIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUdELGlCQUFpQixDQUFDLElBQVksRUFBRSxNQUFjO1FBRTFDLElBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyRCxJQUFJLGVBQWUsSUFBSSxJQUFJO1lBQUUsT0FBTyxJQUFJLENBQUM7UUFFekMsSUFBSSxhQUFhLEdBQXVCLElBQUksQ0FBQztRQUM3QyxLQUFLLElBQUksQ0FBQyxJQUFJLGVBQWUsRUFBRTtZQUMzQixJQUFJLE1BQU0sSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxNQUFNLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hGLGFBQWEsR0FBRyxDQUFDLENBQUM7Z0JBQ2xCLElBQUksT0FBTyxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUM7Z0JBQ3BDLElBQUksT0FBTyxZQUFZLE1BQU0sRUFBRTtvQkFDM0IsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDO2lCQUM3QztnQkFDRCxzQkFBc0I7Z0JBQ3RCLElBQUksSUFBSSxHQUFTLENBQUMsT0FBTyxZQUFZLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7Z0JBQ3BFLFlBQVk7Z0JBQ1osSUFBSSxhQUFhLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksT0FBTyxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUU7b0JBQzNELFlBQVk7b0JBQ1osT0FBTyxFQUFFLElBQUksRUFBUSxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDO2lCQUNoRDtnQkFFRCxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsYUFBYSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7YUFFdEU7U0FDSjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxvQkFBb0IsQ0FBQyxJQUFZLEVBQUUsTUFBYztRQUU3QyxJQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckQsSUFBSSxlQUFlLElBQUksSUFBSTtZQUFFLE9BQU8sSUFBSSxDQUFDO1FBRXpDLElBQUksaUJBQWlCLEdBQXVCLElBQUksQ0FBQztRQUNqRCxLQUFLLElBQUksQ0FBQyxJQUFJLGVBQWUsRUFBRTtZQUMzQixJQUFJLE1BQU0sSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxNQUFNLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBRWhGLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUN2QixJQUFJLGlCQUFpQixJQUFJLElBQUksRUFBRTt3QkFDM0IsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO3FCQUN6Qjt5QkFBTTt3QkFDSCxJQUFHLENBQUMsQ0FBQyxPQUFPLFlBQVksTUFBTSxJQUFJLGlCQUFpQixDQUFDLE9BQU8sWUFBWSxLQUFLLEVBQUM7NEJBQ3pFLGlCQUFpQixHQUFHLENBQUMsQ0FBQzt5QkFDekI7cUJBQ0o7aUJBQ0o7YUFDSjtTQUNKO1FBRUQsT0FBTyxpQkFBaUIsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQU0saUJBQWlCLENBQUMsT0FBTyxDQUFDO0lBQzdFLENBQUM7SUFFRCxJQUFJO1FBQ0EsSUFBSSxDQUFDLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUNqQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUN4QixDQUFDLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDekMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDNUIsQ0FBQyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQzdCLHlCQUF5QjtRQUN6QixDQUFDLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDakMsQ0FBQyxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQztRQUUvRCxDQUFDLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDakMsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7UUFDdEIsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRS9CLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFFdEMsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFO1lBQ3pCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO2dCQUNsQixJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUk7Z0JBQ1osTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNO2dCQUNoQixTQUFTLEVBQUUsSUFBSTthQUNsQixDQUFDLENBQUM7WUFFSCxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBRXBDO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBRXZCLE9BQU8sQ0FBQyxDQUFDO0lBQ2IsQ0FBQztJQUVELEtBQUs7UUFFRCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsRUFBRSxDQUFDO1FBRTlCLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDdEMsUUFBUTtZQUNSLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRXBCLGFBQWE7WUFDYixJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUd2QjtRQUVELGdCQUFnQjtRQUNoQixJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNwQixJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNwQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7UUFFakMsaUJBQWlCO1FBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxXQUFXLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN4SCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUV4QixJQUFJLENBQUMsbUJBQW1CLEdBQUcsRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBRXRDLENBQUM7SUFFRCxTQUFTO1FBRUwsS0FBSyxJQUFJLEVBQUUsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ3hCLElBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksT0FBTyxDQUFDLEVBQUM7Z0JBQ3hDLE9BQU8sSUFBSSxDQUFDO2FBQ2Y7WUFDRCx1QkFBdUI7WUFDdkIsbUJBQW1CO1lBQ25CLElBQUk7U0FDUDtRQUVELE9BQU8sS0FBSyxDQUFDO0lBRWpCLENBQUM7SUFFRCwwQkFBMEI7UUFFdEIsSUFBSSxJQUFJLEdBQVksRUFBRSxDQUFDO1FBRXZCLEtBQUssSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUN4QixJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUMxQjtRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDZixJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO2dCQUNuQyxPQUFPLENBQUMsQ0FBQzthQUNaO1lBQ0QsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRTtnQkFDbkMsT0FBTyxDQUFDLENBQUMsQ0FBQzthQUNiO1lBQ0QsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDeEMsT0FBTyxDQUFDLENBQUM7YUFDWjtZQUNELE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN0QyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakIsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNyQixJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDdEYsSUFBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFDO29CQUMvQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7aUJBQ3pCO3FCQUFNO29CQUNILElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2lCQUNyQjtnQkFDRCxDQUFDLEVBQUUsQ0FBQzthQUNQO1NBQ0o7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsaUJBQWlCLENBQUMsTUFBa0IsRUFBRSxNQUFrQjtRQUNwRCxJQUFHLE1BQU0sSUFBSSxPQUFPO1lBQUUsT0FBTyxDQUFDLENBQUM7UUFDL0IsSUFBRyxNQUFNLElBQUksT0FBTztZQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQy9CLElBQUcsTUFBTSxJQUFJLFNBQVM7WUFBRSxPQUFPLENBQUMsQ0FBQztRQUNqQyxJQUFHLE1BQU0sSUFBSSxTQUFTO1lBQUUsT0FBTyxDQUFDLENBQUM7UUFDakMsT0FBTyxDQUFDLENBQUM7SUFDYixDQUFDO0lBRUQsaUJBQWlCOztRQUNiLElBQUksVUFBVSxxQkFBRyxJQUFJLENBQUMsSUFBSSwwQ0FBRSxZQUFZLDBDQUFFLGNBQWMsMENBQUUsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDNUYsSUFBSSxVQUFVLElBQUksSUFBSTtZQUFFLE9BQU87UUFFL0IsVUFBVSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRTVDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNsQixJQUFJLGVBQWUsR0FBRyxNQUFNLENBQUMsa0hBQWtILENBQUMsQ0FBQztZQUNqSixVQUFVLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ25DLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztZQUNoQixlQUFlLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7WUFDNUQsZUFBZSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDOUIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUVwQixJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN2QyxDQUFDLENBQUMsQ0FBQztTQUVOO0lBQ0wsQ0FBQzs7QUF0bkJNLG1CQUFZLEdBQVcsQ0FBQyxDQUFDO0FBK0N6QixhQUFNLEdBQStCLEVBQUUsQ0FBQztBQTRrQm5ELE1BQU0sT0FBTyxVQUFXLFNBQVEsTUFBTTtJQUNsQyxZQUFZLElBQWM7UUFFdEIsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLDZCQUE2QixFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRywrQkFBK0IsRUFBRSxJQUFJLEVBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVyTixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztRQUMzQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUV4QixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFHYixJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDekMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUM3QyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWhDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRXBDLHdCQUF3QjtRQUN4QixJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2hELElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNsRCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNsRCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN4RCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzNDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3JELElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN2RCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzNDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFL0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM3QyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM3QyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFD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cGFjZVNldHRpbmdzIH0gZnJvbSBcIi4uLy4uL2NvbW11bmljYXRpb24vRGF0YS5qc1wiO1xyXG5pbXBvcnQgeyBBY2NvcmRpb25FbGVtZW50IH0gZnJvbSBcIi4uLy4uL21haW4vZ3VpL0FjY29yZGlvbi5qc1wiO1xyXG5pbXBvcnQgeyBNYWluQmFzZSB9IGZyb20gXCIuLi8uLi9tYWluL01haW5CYXNlLmpzXCI7XHJcbmltcG9ydCB7IEFycmF5TGlzdENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL0FycmF5TGlzdC5qc1wiO1xyXG5pbXBvcnQgeyBDb2xsZWN0aW9uQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvQ29sbGVjdGlvbi5qc1wiO1xyXG5pbXBvcnQgeyBJdGVyYWJsZUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL0l0ZXJhYmxlLmpzXCI7XHJcbmltcG9ydCB7IEl0ZXJhdG9yQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvSXRlcmF0b3IuanNcIjtcclxuaW1wb3J0IHsgTGlzdENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL0xpc3QuanNcIjtcclxuaW1wb3J0IHsgTGlzdEl0ZXJhdG9ySW1wbENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL0xpc3RJdGVyYXRvckltcGwuanNcIjtcclxuaW1wb3J0IHsgU3RhY2tDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9jb2xsZWN0aW9ucy9TdGFjay5qc1wiO1xyXG5pbXBvcnQgeyBWZWN0b3JDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9jb2xsZWN0aW9ucy9WZWN0b3IuanNcIjtcclxuaW1wb3J0IHsgU2V0Q2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvU2V0LmpzXCI7XHJcbmltcG9ydCB7IFNldEl0ZXJhdG9ySW1wbENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL1NldEl0ZXJhdG9ySW1wbC5qc1wiO1xyXG5pbXBvcnQgeyBIYXNoU2V0Q2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvSGFzaFNldC5qc1wiO1xyXG5pbXBvcnQgeyBMaW5rZWRIYXNoU2V0Q2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvTGlua2VkSGFzaFNldC5qc1wiO1xyXG5pbXBvcnQgeyBRdWV1ZUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL1F1ZXVlLmpzXCI7XHJcbmltcG9ydCB7IERlcXVlQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvRGVxdWUuanNcIjtcclxuaW1wb3J0IHsgTGlua2VkTGlzdENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL0xpbmtlZExpc3QuanNcIjtcclxuaW1wb3J0IHsgQ29uc29sZUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L0NvbnNvbGUuanNcIjtcclxuaW1wb3J0IHsgQWN0b3IgYXMgQWN0b3JDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9BY3Rvci5qc1wiO1xyXG5pbXBvcnQgeyBBbGlnbm1lbnRDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9BbGlnbm1lbnQuanNcIjtcclxuaW1wb3J0IHsgQml0bWFwQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvQml0bWFwLmpzXCI7XHJcbmltcG9ydCB7IENpcmNsZUNsYXNzIGFzIENpcmNsZUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL0NpcmNsZS5qc1wiO1xyXG5pbXBvcnQgeyBTZWN0b3JDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9TZWN0b3IuanNcIjtcclxuaW1wb3J0IHsgQXJjQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvQXJjLmpzXCI7XHJcbmltcG9ydCB7IENvbG9yQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvQ29sb3IuanNcIjtcclxuaW1wb3J0IHsgRWxsaXBzZUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL0VsbGlwc2UuanNcIjtcclxuaW1wb3J0IHsgRmlsbGVkU2hhcGVDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9GaWxsZWRTaGFwZS5qc1wiO1xyXG5pbXBvcnQgeyBDb2xsaXNpb25QYWlyQ2xhc3MsIEdyb3VwQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvR3JvdXAuanNcIjtcclxuaW1wb3J0IHsgS2V5Q2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvS2V5LmpzXCI7XHJcbmltcG9ydCB7IFBvbHlnb25DbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9Qb2x5Z29uLmpzXCI7XHJcbmltcG9ydCB7IFJlY3RhbmdsZUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1JlY3RhbmdsZS5qc1wiO1xyXG5pbXBvcnQgeyBSZXBlYXRUeXBlQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvUmVwZWF0VHlwZS5qc1wiO1xyXG5pbXBvcnQgeyBSb3VuZGVkUmVjdGFuZ2xlQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvUm91bmRlZFJlY3RhbmdsZS5qc1wiO1xyXG5pbXBvcnQgeyBTY2FsZU1vZGVDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9TY2FsZU1vZGUuanNcIjtcclxuaW1wb3J0IHsgU2hhcGVDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9TaGFwZS5qc1wiO1xyXG5pbXBvcnQgeyBTb3VuZEtsYXNzIGFzIFNvdW5kQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvU291bmQuanNcIjtcclxuaW1wb3J0IHsgU3ByaXRlQ2xhc3MsIFRpbGVDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9TcHJpdGUuanNcIjtcclxuaW1wb3J0IHsgU3ByaXRlTGlicmFyeUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1Nwcml0ZUxpYnJhcnlFbnVtLmpzXCI7XHJcbmltcG9ydCB7IFRleHRDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9UZXh0LmpzXCI7XHJcbmltcG9ydCB7IFdvcmxkQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvV29ybGQuanNcIjtcclxuaW1wb3J0IHsgSW5wdXRDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9JbnB1dC5qc1wiO1xyXG5pbXBvcnQgeyBHYW1lcGFkQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvR2FtZXBhZC5qc1wiO1xyXG5pbXBvcnQgeyBNYXRoQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvTWF0aC5qc1wiO1xyXG5pbXBvcnQgeyBNYXRoVG9vbHNDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9NYXRoVG9vbHNDbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBQcmludFN0cmVhbUNsYXNzLCBTeXN0ZW1DbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9TeXN0ZW0uanNcIjtcclxuaW1wb3J0IHsgS2V5TGlzdGVuZXIsIFN5c3RlbVRvb2xzQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvU3lzdGVtVG9vbHMuanNcIjtcclxuaW1wb3J0IHsgUnVubmFibGUsIFRpbWVyQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvVGltZXIuanNcIjtcclxuaW1wb3J0IHsgV29ya3NwYWNlIH0gZnJvbSBcIi4uLy4uL3dvcmtzcGFjZS9Xb3Jrc3BhY2UuanNcIjtcclxuaW1wb3J0IHsgRXJyb3IsIEVycm9yTGV2ZWwgfSBmcm9tIFwiLi4vbGV4ZXIvTGV4ZXIuanNcIjtcclxuaW1wb3J0IHsgVGV4dFBvc2l0aW9uLCBUb2tlbiwgVG9rZW5UeXBlLCBUZXh0UG9zaXRpb25XaXRob3V0TGVuZ3RoIH0gZnJvbSBcIi4uL2xleGVyL1Rva2VuLmpzXCI7XHJcbmltcG9ydCB7IEludGVyZmFjZSwgS2xhc3MsIFZpc2liaWxpdHkgfSBmcm9tIFwiLi4vdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgYm9vbGVhblByaW1pdGl2ZVR5cGUsIEJvb2xlYW5UeXBlLCBDaGFyYWN0ZXJUeXBlLCBjaGFyUHJpbWl0aXZlVHlwZSwgZG91YmxlUHJpbWl0aXZlVHlwZSwgRG91YmxlVHlwZSwgZmxvYXRQcmltaXRpdmVUeXBlLCBGbG9hdFR5cGUsIEludGVnZXJUeXBlLCBpbnRQcmltaXRpdmVUeXBlLCBvYmplY3RUeXBlLCBzdHJpbmdQcmltaXRpdmVUeXBlLCB2b2lkUHJpbWl0aXZlVHlwZSwgdmFyVHlwZSB9IGZyb20gXCIuLi90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBBdHRyaWJ1dGUsIE1ldGhvZCwgUHJpbWl0aXZlVHlwZSwgVHlwZSwgVmFyaWFibGUgfSBmcm9tIFwiLi4vdHlwZXMvVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgQVNUTm9kZSwgTWV0aG9kRGVjbGFyYXRpb25Ob2RlLCBUeXBlTm9kZSB9IGZyb20gXCIuL0FTVC5qc1wiO1xyXG5pbXBvcnQgeyBCcmVha3BvaW50LCBQcm9ncmFtLCBTdGF0ZW1lbnQgfSBmcm9tIFwiLi9Qcm9ncmFtLmpzXCI7XHJcbmltcG9ydCB7IFN5bWJvbFRhYmxlIH0gZnJvbSBcIi4vU3ltYm9sVGFibGUuanNcIjtcclxuaW1wb3J0IHsgTWFwQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvTWFwLmpzXCI7XHJcbmltcG9ydCB7IEhhc2hNYXBDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9jb2xsZWN0aW9ucy9IYXNoTWFwLmpzXCI7XHJcbmltcG9ydCB7IFRyaWFuZ2xlQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvVHJpYW5nbGUuanNcIjtcclxuaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuLi8uLi9tYWluL01haW4uanNcIjtcclxuaW1wb3J0IHsgTG9jYWxEYXRlVGltZUNsYXNzLCBEYXlPZldlZWtFbnVtLCBNb250aEVudW0gfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvTG9jYWxEYXRlVGltZS5qc1wiO1xyXG5pbXBvcnQgeyBMaW5lQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvTGluZS5qc1wiO1xyXG5pbXBvcnQgeyBWZWN0b3IyQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvVmVjdG9yMi5qc1wiO1xyXG5pbXBvcnQgeyBNb3VzZUFkYXB0ZXJDbGFzcywgTW91c2VMaXN0ZW5lckludGVyZmFjZSB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9Nb3VzZUxpc3RlbmVyLmpzXCI7XHJcbmltcG9ydCB7IFdlYlNvY2tldENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L25ldHdvcmsvV2ViU29ja2V0LmpzXCI7XHJcbmltcG9ydCB7IFdlYlNvY2tldENsaWVudENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L25ldHdvcmsvV2ViU29ja2V0Q2xpZW50LmpzXCI7XHJcbmltcG9ydCB7IFByb2Nlc3NpbmdDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9Qcm9jZXNzaW5nLmpzXCI7XHJcbmltcG9ydCB7IFR1cnRsZUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1R1cnRsZS5qc1wiO1xyXG5pbXBvcnQgeyBHTkdaZWljaGVuZmVuc3RlckNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2duZy9HTkdaZWljaGVuZmVuc3Rlci5qc1wiO1xyXG5pbXBvcnQgeyBHTkdSZWNodGVja0NsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2duZy9HTkdSZWNodGVjay5qc1wiO1xyXG5pbXBvcnQgeyBHTkdCYXNlRmlndXJDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9nbmcvR05HQmFzZUZpZ3VyLmpzXCI7XHJcbmltcG9ydCB7IEdOR0FrdGlvbnNlbXBmYWVuZ2VySW50ZXJmYWNlIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2duZy9HTkdBa3Rpb25zZW1wZmFlbmdlci5qc1wiO1xyXG5pbXBvcnQgeyBHTkdEcmVpZWNrQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ25nL0dOR0RyZWllY2suanNcIjtcclxuaW1wb3J0IHsgR05HS3JlaXNDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9nbmcvR05HS3JlaXMuanNcIjtcclxuaW1wb3J0IHsgR05HVHVydGxlQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ25nL0dOR1R1cnRsZS5qc1wiO1xyXG5pbXBvcnQgeyBHTkdUZXh0Q2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ25nL0dOR1RleHQuanNcIjtcclxuaW1wb3J0IHsgR05HRXJlaWduaXNiZWhhbmRsdW5nIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2duZy9HTkdFcmVpZ25pc2JlaGFuZGx1bmcuanNcIjtcclxuaW1wb3J0IHsgR05HRmlndXJDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9nbmcvR05HRmlndXIuanNcIjtcclxuaW1wb3J0IHsgUmFuZG9tQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvUmFuZG9tLmpzXCI7XHJcbmltcG9ydCB7IERpcmVjdGlvbkNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL0RpcmVjdGlvbi5qc1wiO1xyXG5pbXBvcnQgeyBQYXRjaGVyIH0gZnJvbSBcIi4vUGF0Y2hlci5qc1wiO1xyXG5pbXBvcnQgeyBLZXlFdmVudCBhcyBLZXlFdmVudENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL0tleUV2ZW50LmpzXCI7XHJcbmltcG9ydCB7IEZvcm1hdHRlciB9IGZyb20gXCIuLi8uLi9tYWluL2d1aS9Gb3JtYXR0ZXIuanNcIjtcclxuaW1wb3J0IHsgUm9ib3RDbGFzcywgUm9ib3RXb3JsZENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzLzNkL1JvYm90LmpzXCI7XHJcblxyXG5leHBvcnQgdHlwZSBFeHBvcnRlZFdvcmtzcGFjZSA9IHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIG1vZHVsZXM6IEV4cG9ydGVkTW9kdWxlW107XHJcbiAgICBzZXR0aW5nczogV29ya3NwYWNlU2V0dGluZ3M7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIEV4cG9ydGVkTW9kdWxlID0ge1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgdGV4dDogc3RyaW5nO1xyXG5cclxuICAgIGlzX2NvcHlfb2ZfaWQ/OiBudW1iZXIsXHJcbiAgICByZXBvc2l0b3J5X2ZpbGVfdmVyc2lvbj86IG51bWJlcixcclxuICAgIGlkZW50aWNhbF90b19yZXBvc2l0b3J5X3ZlcnNpb246IGJvb2xlYW4sXHJcblxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBGaWxlID0ge1xyXG4gICAgbmFtZTogc3RyaW5nLFxyXG4gICAgaWQ/OiBudW1iZXIsXHJcbiAgICB0ZXh0OiBzdHJpbmcsXHJcblxyXG4gICAgdGV4dF9iZWZvcmVfcmV2aXNpb246IHN0cmluZyxcclxuICAgIHN1Ym1pdHRlZF9kYXRlOiBzdHJpbmcsXHJcbiAgICBzdHVkZW50X2VkaXRlZF9hZnRlcl9yZXZpc2lvbjogYm9vbGVhbixcclxuXHJcbiAgICBpc19jb3B5X29mX2lkPzogbnVtYmVyLFxyXG4gICAgcmVwb3NpdG9yeV9maWxlX3ZlcnNpb24/OiBudW1iZXIsXHJcbiAgICBpZGVudGljYWxfdG9fcmVwb3NpdG9yeV92ZXJzaW9uOiBib29sZWFuLFxyXG5cclxuICAgIGRpcnR5OiBib29sZWFuLFxyXG4gICAgc2F2ZWQ6IGJvb2xlYW4sXHJcbiAgICB2ZXJzaW9uOiBudW1iZXIsXHJcbiAgICBwYW5lbEVsZW1lbnQ/OiBBY2NvcmRpb25FbGVtZW50XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIElkZW50aWZpZXJQb3NpdGlvbiA9IHtcclxuICAgIHBvc2l0aW9uOiBUZXh0UG9zaXRpb24sXHJcbiAgICBlbGVtZW50OiBUeXBlIHwgTWV0aG9kIHwgQXR0cmlidXRlIHwgVmFyaWFibGU7XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIE1ldGhvZENhbGxQb3NpdGlvbiA9IHtcclxuICAgIGlkZW50aWZpZXJQb3NpdGlvbjogVGV4dFBvc2l0aW9uLFxyXG4gICAgcG9zc2libGVNZXRob2RzOiBNZXRob2RbXSB8IHN0cmluZywgLy8gc3RyaW5nIGZvciBwcmludCwgcHJpbnRsbiwgLi4uXHJcbiAgICBjb21tYVBvc2l0aW9uczogVGV4dFBvc2l0aW9uW10sXHJcbiAgICByaWdodEJyYWNrZXRQb3NpdGlvbjogVGV4dFBvc2l0aW9uXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNb2R1bGUge1xyXG4gICAgZmlsZTogRmlsZTtcclxuICAgIHN0YXRpYyBtYXhVcmlOdW1iZXI6IG51bWJlciA9IDA7XHJcbiAgICB1cmk6IG1vbmFjby5Vcmk7XHJcbiAgICBtb2RlbDogbW9uYWNvLmVkaXRvci5JVGV4dE1vZGVsO1xyXG4gICAgb2xkRXJyb3JEZWNvcmF0aW9uczogc3RyaW5nW10gPSBbXTtcclxuICAgIGxhc3RTYXZlZFZlcnNpb25JZDogbnVtYmVyO1xyXG4gICAgZWRpdG9yU3RhdGU6IG1vbmFjby5lZGl0b3IuSUNvZGVFZGl0b3JWaWV3U3RhdGU7XHJcblxyXG4gICAgaXNTeXN0ZW1Nb2R1bGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICBicmVha3BvaW50czogQnJlYWtwb2ludFtdID0gW107XHJcbiAgICBicmVha3BvaW50RGVjb3JhdG9yczogc3RyaW5nW10gPSBbXTtcclxuICAgIGRlY29yYXRvcklkVG9CcmVha3BvaW50TWFwOiB7IFtpZDogc3RyaW5nXTogQnJlYWtwb2ludCB9ID0ge307XHJcblxyXG4gICAgZXJyb3JzOiBFcnJvcltdW10gPSBbW10sIFtdLCBbXSwgW11dOyAvLyAxc3QgcGFzcywgMm5kIHBhc3MsIDNyZCBwYXNzXHJcblxyXG4gICAgY29sb3JJbmZvcm1hdGlvbjogbW9uYWNvLmxhbmd1YWdlcy5JQ29sb3JJbmZvcm1hdGlvbltdID0gW107XHJcblxyXG4gICAgLy8gMXN0IHBhc3M6IExleGVyXHJcbiAgICB0b2tlbkxpc3Q6IFRva2VuW107XHJcblxyXG4gICAgLy8gMm5kIHBhc3M6IEFTVFBhcnNlclxyXG4gICAgbWFpblByb2dyYW1Bc3Q6IEFTVE5vZGVbXTtcclxuICAgIGNsYXNzRGVmaW5pdGlvbnNBU1Q6IEFTVE5vZGVbXTtcclxuICAgIHR5cGVOb2RlczogVHlwZU5vZGVbXTtcclxuXHJcbiAgICAvLyAzcmQgcGFzczogVHlwZVJlc29sdmVyIGZpbGwgaW4gcmVzb2x2ZWRUeXBlIGluIHR5cGVOb2RlcyBhbmQgcG9wdWxhdGUgdHlwZVN0b3JlXHJcbiAgICB0eXBlU3RvcmU6IFR5cGVTdG9yZTtcclxuXHJcbiAgICAvLyA0dGggcGFzczogZ2VuZXJhdGUgY29kZSBhbmQgc3ltYm9sIHRhYmxlc1xyXG5cclxuICAgIC8qXHJcbiAgICBUaGUgbWFpblByb2dyYW1BU1QgaG9sZHMgc3RhdGVtZW50cyB0bzpcclxuICAgIDEuIGNhbGwgc3RhdGljIGNvbnN0cnVjdG9yIG9mIGVhY2ggdXNlZCBjbGFzc1xyXG4gICAgMi4gZXhlY3V0ZSBtYWluIFByb2dyYW1cclxuICAgICovXHJcblxyXG4gICAgbWFpblByb2dyYW0/OiBQcm9ncmFtO1xyXG4gICAgbWFpblByb2dyYW1FbmQ6IFRleHRQb3NpdGlvbjtcclxuICAgIG1haW5TeW1ib2xUYWJsZTogU3ltYm9sVGFibGU7XHJcblxyXG4gICAgaWRlbnRpZmllclBvc2l0aW9uczogeyBbbGluZTogbnVtYmVyXTogSWRlbnRpZmllclBvc2l0aW9uW10gfSA9IHt9O1xyXG4gICAgbWV0aG9kQ2FsbFBvc2l0aW9uczogeyBbbGluZTogbnVtYmVyXTogTWV0aG9kQ2FsbFBvc2l0aW9uW10gfSA9IHt9O1xyXG5cclxuICAgIGRlcGVuZHNPbk1vZHVsZXM6IE1hcDxNb2R1bGUsIGJvb2xlYW4+O1xyXG4gICAgaXNTdGFydGFibGU6IGJvb2xlYW47XHJcbiAgICBkZXBlbmRzT25Nb2R1bGVzV2l0aEVycm9yczogYm9vbGVhbjtcclxuXHJcbiAgICBzdGF0aWMgdXJpTWFwOiB7IFtuYW1lOiBzdHJpbmddOiBudW1iZXIgfSA9IHt9O1xyXG4gICAgYnJhY2tldEVycm9yOiBzdHJpbmc7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZmlsZTogRmlsZSwgcHVibGljIG1haW46IE1haW5CYXNlKSB7XHJcbiAgICAgICAgaWYgKGZpbGUgPT0gbnVsbCB8fCB0aGlzLm1haW4gPT0gbnVsbCkgcmV0dXJuOyAvLyB1c2VkIGJ5IEFkaG9jQ29tcGlsZXIgYW5kIEFwaURvY1xyXG5cclxuICAgICAgICB0aGlzLmZpbGUgPSBmaWxlO1xyXG4gICAgICAgIC8vIHRoaXMudXJpID0gbW9uYWNvLlVyaS5mcm9tKHsgcGF0aDogJy9maWxlJyArIChNb2R1bGUubWF4VXJpTnVtYmVyKyspICsgJy5sZWFybkphdmEnLCBzY2hlbWU6ICdmaWxlJyB9KTtcclxuICAgICAgICBsZXQgcGF0aCA9IGZpbGUubmFtZTtcclxuXHJcbiAgICAgICAgbGV0IHVyaUNvdW50ZXIgPSBNb2R1bGUudXJpTWFwW3BhdGhdO1xyXG4gICAgICAgIGlmICh1cmlDb3VudGVyID09IG51bGwpIHtcclxuICAgICAgICAgICAgdXJpQ291bnRlciA9IDA7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdXJpQ291bnRlcisrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBNb2R1bGUudXJpTWFwW3BhdGhdID0gdXJpQ291bnRlcjtcclxuXHJcbiAgICAgICAgaWYgKHVyaUNvdW50ZXIgPiAwKSBwYXRoICs9IFwiIChcIiArIHVyaUNvdW50ZXIgKyBcIilcIjtcclxuICAgICAgICB0aGlzLnVyaSA9IG1vbmFjby5VcmkuZnJvbSh7IHBhdGg6IHBhdGgsIHNjaGVtZTogJ2lubWVtb3J5JyB9KTtcclxuICAgICAgICB0aGlzLm1vZGVsID0gbW9uYWNvLmVkaXRvci5jcmVhdGVNb2RlbChmaWxlLnRleHQsIFwibXlKYXZhXCIsIHRoaXMudXJpKTtcclxuICAgICAgICB0aGlzLm1vZGVsLnVwZGF0ZU9wdGlvbnMoeyB0YWJTaXplOiAzLCBicmFja2V0Q29sb3JpemF0aW9uT3B0aW9uczoge2VuYWJsZWQ6IHRydWV9IH0pO1xyXG4gICAgICAgIGxldCBmb3JtYXR0ZXIgPSBuZXcgRm9ybWF0dGVyKCk7XHJcblxyXG4gICAgICAgIGlmKG1haW4uaXNFbWJlZGRlZCgpICYmIGZpbGUudGV4dCAhPSBudWxsICYmIGZpbGUudGV4dC5sZW5ndGggPiAzKXtcclxuICAgICAgICAgICAgbGV0IGVkaXRzID0gPG1vbmFjby5sYW5ndWFnZXMuVGV4dEVkaXRbXT5mb3JtYXR0ZXIuZm9ybWF0KHRoaXMubW9kZWwpO1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsLmFwcGx5RWRpdHMoZWRpdHMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5sYXN0U2F2ZWRWZXJzaW9uSWQgPSB0aGlzLm1vZGVsLmdldEFsdGVybmF0aXZlVmVyc2lvbklkKCk7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5tb2RlbC5vbkRpZENoYW5nZUNvbnRlbnQoKCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgdmVyc2lvbklkID0gdGhhdC5tb2RlbC5nZXRBbHRlcm5hdGl2ZVZlcnNpb25JZCgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZlcnNpb25JZCAhPSB0aGF0Lmxhc3RTYXZlZFZlcnNpb25JZCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5maWxlLmRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRoYXQuZmlsZS5zYXZlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5maWxlLmlkZW50aWNhbF90b19yZXBvc2l0b3J5X3ZlcnNpb24gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHRoYXQubGFzdFNhdmVkVmVyc2lvbklkID0gdmVyc2lvbklkO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZighdGhhdC5tYWluLmlzRW1iZWRkZWQoKSl7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWFpbjE6IE1haW4gPSA8TWFpbj5tYWluO1xyXG4gICAgICAgICAgICAgICAgaWYobWFpbjEud29ya3NwYWNlc093bmVySWQgIT0gbWFpbjEudXNlci5pZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYodGhhdC5maWxlLnRleHRfYmVmb3JlX3JldmlzaW9uID09IG51bGwgfHwgdGhhdC5maWxlLnN0dWRlbnRfZWRpdGVkX2FmdGVyX3JldmlzaW9uKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5maWxlLnN0dWRlbnRfZWRpdGVkX2FmdGVyX3JldmlzaW9uID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZmlsZS50ZXh0X2JlZm9yZV9yZXZpc2lvbiA9IHRoYXQuZmlsZS50ZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmZpbGUuc2F2ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbjEubmV0d29ya01hbmFnZXIuc2VuZFVwZGF0ZXMobnVsbCwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluMS5ib3R0b21EaXYuaG9tZXdvcmtNYW5hZ2VyLnNob3dIb21lV29ya1JldmlzaW9uQnV0dG9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW4xLnByb2plY3RFeHBsb3Jlci5yZW5kZXJIb21ld29ya0J1dHRvbih0aGF0LmZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5maWxlLnN0dWRlbnRfZWRpdGVkX2FmdGVyX3JldmlzaW9uID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICB0b0V4cG9ydGVkTW9kdWxlKCk6IEV4cG9ydGVkTW9kdWxlIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBuYW1lOiB0aGlzLmZpbGUubmFtZSxcclxuICAgICAgICAgICAgdGV4dDogdGhpcy5nZXRQcm9ncmFtVGV4dEZyb21Nb25hY29Nb2RlbCgpLFxyXG4gICAgICAgICAgICBpZGVudGljYWxfdG9fcmVwb3NpdG9yeV92ZXJzaW9uOiB0aGlzLmZpbGUuaWRlbnRpY2FsX3RvX3JlcG9zaXRvcnlfdmVyc2lvbixcclxuICAgICAgICAgICAgaXNfY29weV9vZl9pZDogdGhpcy5maWxlLmlzX2NvcHlfb2ZfaWQsXHJcbiAgICAgICAgICAgIHJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uOiB0aGlzLmZpbGUucmVwb3NpdG9yeV9maWxlX3ZlcnNpb25cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TWV0aG9kRGVjbGFyYXRpb25BdFBvc2l0aW9uKHBvc2l0aW9uOiB7IGxpbmVOdW1iZXI6IG51bWJlcjsgY29sdW1uOiBudW1iZXI7IH0pOiBNZXRob2REZWNsYXJhdGlvbk5vZGUge1xyXG5cclxuICAgICAgICBpZih0aGlzLmNsYXNzRGVmaW5pdGlvbnNBU1QgPT0gbnVsbCkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yKGxldCBjZCBvZiB0aGlzLmNsYXNzRGVmaW5pdGlvbnNBU1Qpe1xyXG4gICAgICAgICAgICBpZihjZC50eXBlID09IFRva2VuVHlwZS5rZXl3b3JkQ2xhc3MgfHwgY2QudHlwZSA9PSBUb2tlblR5cGUua2V5d29yZEVudW0pe1xyXG4gICAgICAgICAgICAgICAgZm9yKGxldCBtZXRob2RBU1Qgb2YgY2QubWV0aG9kcyl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYobWV0aG9kQVNULnBvc2l0aW9uICE9IG51bGwgJiYgbWV0aG9kQVNULnNjb3BlVG8gIT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKG1ldGhvZEFTVC5wb3NpdGlvbi5saW5lIDw9IHBvc2l0aW9uLmxpbmVOdW1iZXIgJiYgbWV0aG9kQVNULnNjb3BlVG8ubGluZSA+PSBwb3NpdGlvbi5saW5lTnVtYmVyKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtZXRob2RBU1Q7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICBcclxuICAgIH1cclxuXHJcblxyXG4gICAgc3RhdGljIHJlc3RvcmVGcm9tRGF0YShmOiBGaWxlRGF0YSwgbWFpbjogTWFpbkJhc2UpOiBNb2R1bGUge1xyXG5cclxuICAgICAgICBsZXQgcGF0Y2hlZCA9IFBhdGNoZXIucGF0Y2goZi50ZXh0KTtcclxuXHJcbiAgICAgICAgbGV0IGYxOiBGaWxlID0ge1xyXG4gICAgICAgICAgICBuYW1lOiBmLm5hbWUsXHJcbiAgICAgICAgICAgIHRleHQ6IHBhdGNoZWQucGF0Y2hlZFRleHQsXHJcbiAgICAgICAgICAgIHRleHRfYmVmb3JlX3JldmlzaW9uOiBmLnRleHRfYmVmb3JlX3JldmlzaW9uLFxyXG4gICAgICAgICAgICBzdWJtaXR0ZWRfZGF0ZTogZi5zdWJtaXR0ZWRfZGF0ZSxcclxuICAgICAgICAgICAgc3R1ZGVudF9lZGl0ZWRfYWZ0ZXJfcmV2aXNpb246IGZhbHNlLFxyXG4gICAgICAgICAgICBkaXJ0eTogdHJ1ZSxcclxuICAgICAgICAgICAgc2F2ZWQ6ICFwYXRjaGVkLm1vZGlmaWVkLFxyXG4gICAgICAgICAgICB2ZXJzaW9uOiBmLnZlcnNpb24sXHJcbiAgICAgICAgICAgIGlkOiBmLmlkLFxyXG4gICAgICAgICAgICBpc19jb3B5X29mX2lkOiBmLmlzX2NvcHlfb2ZfaWQsXHJcbiAgICAgICAgICAgIHJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uOiBmLnJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uLFxyXG4gICAgICAgICAgICBpZGVudGljYWxfdG9fcmVwb3NpdG9yeV92ZXJzaW9uOiBmLmlkZW50aWNhbF90b19yZXBvc2l0b3J5X3ZlcnNpb25cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBtOiBNb2R1bGUgPSBuZXcgTW9kdWxlKGYxLCBtYWluKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG07XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldEZpbGVEYXRhKHdvcmtzcGFjZTogV29ya3NwYWNlKTogRmlsZURhdGEge1xyXG4gICAgICAgIGxldCBmaWxlID0gdGhpcy5maWxlO1xyXG4gICAgICAgIGxldCBmZDogRmlsZURhdGEgPSB7XHJcbiAgICAgICAgICAgIGlkOiBmaWxlLmlkLFxyXG4gICAgICAgICAgICBuYW1lOiBmaWxlLm5hbWUsXHJcbiAgICAgICAgICAgIHRleHQ6IGZpbGUudGV4dCxcclxuICAgICAgICAgICAgdGV4dF9iZWZvcmVfcmV2aXNpb246IGZpbGUudGV4dF9iZWZvcmVfcmV2aXNpb24sXHJcbiAgICAgICAgICAgIHN1Ym1pdHRlZF9kYXRlOiBmaWxlLnN1Ym1pdHRlZF9kYXRlLFxyXG4gICAgICAgICAgICBzdHVkZW50X2VkaXRlZF9hZnRlcl9yZXZpc2lvbjogZmlsZS5zdHVkZW50X2VkaXRlZF9hZnRlcl9yZXZpc2lvbixcclxuICAgICAgICAgICAgdmVyc2lvbjogZmlsZS52ZXJzaW9uLFxyXG4gICAgICAgICAgICBpc19jb3B5X29mX2lkOiBmaWxlLmlzX2NvcHlfb2ZfaWQsXHJcbiAgICAgICAgICAgIHJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uOiBmaWxlLnJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uLFxyXG4gICAgICAgICAgICBpZGVudGljYWxfdG9fcmVwb3NpdG9yeV92ZXJzaW9uOiBmaWxlLmlkZW50aWNhbF90b19yZXBvc2l0b3J5X3ZlcnNpb24sXHJcbiAgICAgICAgICAgIHdvcmtzcGFjZV9pZDogd29ya3NwYWNlLmlkLFxyXG4gICAgICAgICAgICBmb3JjZVVwZGF0ZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGZpbGVfdHlwZTogMFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZkO1xyXG4gICAgfVxyXG5cclxuICAgIHB1c2hNZXRob2RDYWxsUG9zaXRpb24oaWRlbnRpZmllclBvc2l0aW9uOiBUZXh0UG9zaXRpb24sIGNvbW1hUG9zaXRpb25zOiBUZXh0UG9zaXRpb25bXSxcclxuICAgICAgICBwb3NzaWJsZU1ldGhvZHM6IE1ldGhvZFtdIHwgc3RyaW5nLCByaWdodEJyYWNrZXRQb3NpdGlvbjogVGV4dFBvc2l0aW9uKSB7XHJcblxyXG4gICAgICAgIGxldCBsaW5lczogbnVtYmVyW10gPSBbXTtcclxuICAgICAgICBsaW5lcy5wdXNoKGlkZW50aWZpZXJQb3NpdGlvbi5saW5lKTtcclxuICAgICAgICBmb3IgKGxldCBjcCBvZiBjb21tYVBvc2l0aW9ucykge1xyXG4gICAgICAgICAgICBpZiAobGluZXMuaW5kZXhPZltjcC5saW5lXSA8IDApIHtcclxuICAgICAgICAgICAgICAgIGxpbmVzLnB1c2goY3AubGluZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBtY3A6IE1ldGhvZENhbGxQb3NpdGlvbiA9IHtcclxuICAgICAgICAgICAgaWRlbnRpZmllclBvc2l0aW9uOiBpZGVudGlmaWVyUG9zaXRpb24sXHJcbiAgICAgICAgICAgIGNvbW1hUG9zaXRpb25zOiBjb21tYVBvc2l0aW9ucyxcclxuICAgICAgICAgICAgcG9zc2libGVNZXRob2RzOiBwb3NzaWJsZU1ldGhvZHMsXHJcbiAgICAgICAgICAgIHJpZ2h0QnJhY2tldFBvc2l0aW9uOiByaWdodEJyYWNrZXRQb3NpdGlvblxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGZvciAobGV0IGxpbmUgb2YgbGluZXMpIHtcclxuICAgICAgICAgICAgbGV0IG1jcExpc3QgPSB0aGlzLm1ldGhvZENhbGxQb3NpdGlvbnNbbGluZV07XHJcbiAgICAgICAgICAgIGlmIChtY3BMaXN0ID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWV0aG9kQ2FsbFBvc2l0aW9uc1tsaW5lXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgbWNwTGlzdCA9IHRoaXMubWV0aG9kQ2FsbFBvc2l0aW9uc1tsaW5lXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBtY3BMaXN0LnB1c2gobWNwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICB0b2dnbGVCcmVha3BvaW50KGxpbmVOdW1iZXI6IG51bWJlciwgcmVyZW5kZXI6IGJvb2xlYW4pIHtcclxuICAgICAgICB0aGlzLmdldEJyZWFrcG9pbnRQb3NpdGlvbnNGcm9tRWRpdG9yKCk7XHJcbiAgICAgICAgaWYgKHRoaXMuZ2V0QnJlYWtwb2ludChsaW5lTnVtYmVyLCB0cnVlKSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0QnJlYWtwb2ludChsaW5lTnVtYmVyLCAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlcmVuZGVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyQnJlYWtwb2ludERlY29yYXRvcnMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QnJlYWtwb2ludChsaW5lOiBudW1iZXIsIHJlbW92ZTogYm9vbGVhbiA9IGZhbHNlKTogQnJlYWtwb2ludCB7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5icmVha3BvaW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgYiA9IHRoaXMuYnJlYWtwb2ludHNbaV07XHJcbiAgICAgICAgICAgIGlmIChiLmxpbmUgPT0gbGluZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5icmVha3BvaW50cy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYi5zdGF0ZW1lbnQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGIuc3RhdGVtZW50LmJyZWFrcG9pbnQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNldEJyZWFrcG9pbnQobGluZTogbnVtYmVyLCBjb2x1bW46IG51bWJlcik6IEJyZWFrcG9pbnQge1xyXG5cclxuICAgICAgICBsZXQgYnJlYWtwb2ludDogQnJlYWtwb2ludCA9IHtcclxuICAgICAgICAgICAgbGluZTogbGluZSxcclxuICAgICAgICAgICAgY29sdW1uOiBjb2x1bW4sXHJcbiAgICAgICAgICAgIHN0YXRlbWVudDogbnVsbFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hdHRhY2hUb1N0YXRlbWVudChicmVha3BvaW50KTtcclxuICAgICAgICB0aGlzLmJyZWFrcG9pbnRzLnB1c2goYnJlYWtwb2ludCk7XHJcblxyXG4gICAgICAgIHJldHVybiBicmVha3BvaW50O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBhdHRhY2hUb1N0YXRlbWVudChicmVha3BvaW50OiBCcmVha3BvaW50LCBwcm9ncmFtTGlzdD86IFByb2dyYW1bXSkge1xyXG5cclxuICAgICAgICBpZiAoYnJlYWtwb2ludC5zdGF0ZW1lbnQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBicmVha3BvaW50LnN0YXRlbWVudC5icmVha3BvaW50ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHByb2dyYW1MaXN0ID09IG51bGwpIHByb2dyYW1MaXN0ID0gdGhpcy5nZXRQcm9ncmFtcygpO1xyXG5cclxuICAgICAgICBsZXQgbmVhcmVzdFN0YXRlbWVudDogU3RhdGVtZW50ID0gbnVsbDtcclxuICAgICAgICBsZXQgbmVhcmVzdERpc3RhbmNlOiBudW1iZXIgPSAxMDAwMDA7XHJcblxyXG4gICAgICAgIGZvciAobGV0IHByb2dyYW0gb2YgcHJvZ3JhbUxpc3QpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgc3RhdGVtZW50IG9mIHByb2dyYW0uc3RhdGVtZW50cykge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBsaW5lID0gc3RhdGVtZW50Py5wb3NpdGlvbj8ubGluZTtcclxuICAgICAgICAgICAgICAgIGlmIChsaW5lICE9IG51bGwgJiYgbGluZSA+PSBicmVha3BvaW50LmxpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGluZSAtIGJyZWFrcG9pbnQubGluZSA8IG5lYXJlc3REaXN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZWFyZXN0U3RhdGVtZW50ID0gc3RhdGVtZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZWFyZXN0RGlzdGFuY2UgPSBsaW5lIC0gYnJlYWtwb2ludC5saW5lO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYnJlYWtwb2ludC5zdGF0ZW1lbnQgPSBuZWFyZXN0U3RhdGVtZW50O1xyXG4gICAgICAgIGlmIChuZWFyZXN0U3RhdGVtZW50ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgbmVhcmVzdFN0YXRlbWVudC5icmVha3BvaW50ID0gYnJlYWtwb2ludDtcclxuICAgICAgICAgICAgLy8gbGV0IHBwID0gbmV3IFByb2dyYW1QcmludGVyKCk7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQXR0YWNoZWQgQnJlYWtwb2ludCBsaW5lIFwiICsgYnJlYWtwb2ludC5saW5lICsgXCIsIGNvbHVtbiBcIiArIFxyXG4gICAgICAgICAgICAvLyAgICAgYnJlYWtwb2ludC5jb2x1bW4gKyBcIiB0byBzdGF0ZW1lbnQgXCIgKyBwcC5wcmludChbbmVhcmVzdFN0YXRlbWVudF0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgZ2V0UHJvZ3JhbXMoKTogUHJvZ3JhbVtdIHtcclxuICAgICAgICBsZXQgcHJvZ3JhbUxpc3Q6IFByb2dyYW1bXSA9IFtdO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5tYWluUHJvZ3JhbSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHByb2dyYW1MaXN0LnB1c2godGhpcy5tYWluUHJvZ3JhbSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy50eXBlU3RvcmUgIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgdHlwZSBvZiB0aGlzLnR5cGVTdG9yZS50eXBlTGlzdCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgaW5zdGFuY2VvZiBLbGFzcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyYW1MaXN0LnB1c2godHlwZS5hdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBtZXRob2Qgb2YgdHlwZS5tZXRob2RzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtZXRob2QucHJvZ3JhbSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmFtTGlzdC5wdXNoKG1ldGhvZC5wcm9ncmFtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZS5zdGF0aWNDbGFzcy5hdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmFtTGlzdC5wdXNoKHR5cGUuc3RhdGljQ2xhc3MuYXR0cmlidXRlSW5pdGlhbGl6YXRpb25Qcm9ncmFtKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgbWV0aG9kIG9mIHR5cGUuc3RhdGljQ2xhc3MubWV0aG9kcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWV0aG9kLnByb2dyYW0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3JhbUxpc3QucHVzaChtZXRob2QucHJvZ3JhbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvZ3JhbUxpc3Q7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlckJyZWFrcG9pbnREZWNvcmF0b3JzKCkge1xyXG5cclxuICAgICAgICB0aGlzLmdldEJyZWFrcG9pbnRQb3NpdGlvbnNGcm9tRWRpdG9yKCk7XHJcblxyXG4gICAgICAgIGxldCBkZWNvcmF0aW9uczogbW9uYWNvLmVkaXRvci5JTW9kZWxEZWx0YURlY29yYXRpb25bXSA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBicmVha3BvaW50IG9mIHRoaXMuYnJlYWtwb2ludHMpIHtcclxuICAgICAgICAgICAgZGVjb3JhdGlvbnMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICByYW5nZTogeyBzdGFydExpbmVOdW1iZXI6IGJyZWFrcG9pbnQubGluZSwgZW5kTGluZU51bWJlcjogYnJlYWtwb2ludC5saW5lLCBzdGFydENvbHVtbjogMSwgZW5kQ29sdW1uOiAxIH0sXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXNXaG9sZUxpbmU6IHRydWUsIGNsYXNzTmFtZTogXCJqb19kZWNvcmF0ZV9icmVha3BvaW50XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgb3ZlcnZpZXdSdWxlcjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogXCIjNTgwMDAwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBtb25hY28uZWRpdG9yLk92ZXJ2aWV3UnVsZXJMYW5lLkxlZnRcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG1pbmltYXA6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IFwiIzU4MDAwMFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbW9uYWNvLmVkaXRvci5NaW5pbWFwUG9zaXRpb24uSW5saW5lXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBtYXJnaW5DbGFzc05hbWU6IFwiam9fbWFyZ2luX2JyZWFrcG9pbnRcIixcclxuICAgICAgICAgICAgICAgICAgICBzdGlja2luZXNzOiBtb25hY28uZWRpdG9yLlRyYWNrZWRSYW5nZVN0aWNraW5lc3MuTmV2ZXJHcm93c1doZW5UeXBpbmdBdEVkZ2VzXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICBicmVha3BvaW50OiBicmVha3BvaW50XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5icmVha3BvaW50RGVjb3JhdG9ycyA9IHRoaXMubWFpbi5nZXRNb25hY29FZGl0b3IoKS5kZWx0YURlY29yYXRpb25zKHRoaXMuYnJlYWtwb2ludERlY29yYXRvcnMsIGRlY29yYXRpb25zKTtcclxuXHJcbiAgICAgICAgdGhpcy5kZWNvcmF0b3JJZFRvQnJlYWtwb2ludE1hcCA9IHt9O1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5icmVha3BvaW50RGVjb3JhdG9ycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmRlY29yYXRvcklkVG9CcmVha3BvaW50TWFwW3RoaXMuYnJlYWtwb2ludERlY29yYXRvcnNbaV1dID0gdGhpcy5icmVha3BvaW50c1tpXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldEJyZWFrcG9pbnRQb3NpdGlvbnNGcm9tRWRpdG9yKCkge1xyXG4gICAgICAgIGZvciAobGV0IGRlY29yYXRpb24gb2YgdGhpcy5tYWluLmdldE1vbmFjb0VkaXRvcigpLmdldE1vZGVsKCkuZ2V0QWxsRGVjb3JhdGlvbnMoKSkge1xyXG4gICAgICAgICAgICBpZiAoZGVjb3JhdGlvbi5vcHRpb25zLm1hcmdpbkNsYXNzTmFtZSA9PSBcIm1hcmdpbl9icmVha3BvaW50XCIpIHtcclxuICAgICAgICAgICAgICAgIGxldCBicmVha3BvaW50ID0gdGhpcy5kZWNvcmF0b3JJZFRvQnJlYWtwb2ludE1hcFtkZWNvcmF0aW9uLmlkXTtcclxuICAgICAgICAgICAgICAgIGlmIChicmVha3BvaW50ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBicmVha3BvaW50LmxpbmUgPSBkZWNvcmF0aW9uLnJhbmdlLnN0YXJ0TGluZU51bWJlcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmaW5kU3ltYm9sVGFibGVBdFBvc2l0aW9uKGxpbmU6IG51bWJlciwgY29sdW1uOiBudW1iZXIpIHtcclxuICAgICAgICBpZiAodGhpcy5tYWluU3ltYm9sVGFibGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChsaW5lID4gdGhpcy5tYWluU3ltYm9sVGFibGUucG9zaXRpb25Uby5saW5lIHx8XHJcbiAgICAgICAgICAgIGxpbmUgPT0gdGhpcy5tYWluU3ltYm9sVGFibGUucG9zaXRpb25Uby5saW5lICYmIGNvbHVtbiA+IHRoaXMubWFpblN5bWJvbFRhYmxlLnBvc2l0aW9uVG8uY29sdW1uXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIGxpbmUgPSB0aGlzLm1haW5TeW1ib2xUYWJsZS5wb3NpdGlvblRvLmxpbmU7XHJcbiAgICAgICAgICAgIGNvbHVtbiA9IHRoaXMubWFpblN5bWJvbFRhYmxlLnBvc2l0aW9uVG8uY29sdW1uIC0gMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLm1haW5TeW1ib2xUYWJsZS5maW5kVGFibGVBdFBvc2l0aW9uKGxpbmUsIGNvbHVtbik7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RXJyb3JDb3VudCgpOiBudW1iZXIge1xyXG5cclxuICAgICAgICBsZXQgZWMgPSAwO1xyXG4gICAgICAgIGZvciAobGV0IGVsIG9mIHRoaXMuZXJyb3JzKSB7XHJcbiAgICAgICAgICAgIGVsLmZvckVhY2goZXJyb3IgPT4gZWMgKz0gZXJyb3IubGV2ZWwgPT0gXCJlcnJvclwiID8gMSA6IDApO1xyXG4gICAgICAgICAgICAvLyBlYyArPSBlbC5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWM7XHJcbiAgICB9XHJcblxyXG4gICAgaGFzTWFpblByb2dyYW0oKSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm1haW5Qcm9ncmFtID09IG51bGwpIHJldHVybiBmYWxzZTtcclxuICAgICAgICBpZiAodGhpcy5tYWluUHJvZ3JhbS5zdGF0ZW1lbnRzID09IG51bGwpIHJldHVybiBmYWxzZTtcclxuICAgICAgICByZXR1cm4gdGhpcy5tYWluUHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCA+IDIgfHwgdGhpcy5tYWluUHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCA9PSAyICYmIHRoaXMubWFpblByb2dyYW0uc3RhdGVtZW50c1swXS50eXBlID09IFRva2VuVHlwZS5jYWxsTWFpbk1ldGhvZDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0UHJvZ3JhbVRleHRGcm9tTW9uYWNvTW9kZWwoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXRWYWx1ZShtb25hY28uZWRpdG9yLkVuZE9mTGluZVByZWZlcmVuY2UuTEYsIGZhbHNlKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgYWRkSWRlbnRpZmllclBvc2l0aW9uKHBvc2l0aW9uOiBUZXh0UG9zaXRpb24sIGVsZW1lbnQ6IFR5cGUgfCBNZXRob2QgfCBBdHRyaWJ1dGUgfCBWYXJpYWJsZSkge1xyXG4gICAgICAgIGxldCBwb3NpdGlvbkxpc3Q6IElkZW50aWZpZXJQb3NpdGlvbltdID0gdGhpcy5pZGVudGlmaWVyUG9zaXRpb25zW3Bvc2l0aW9uLmxpbmVdO1xyXG4gICAgICAgIGlmIChwb3NpdGlvbkxpc3QgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBwb3NpdGlvbkxpc3QgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5pZGVudGlmaWVyUG9zaXRpb25zW3Bvc2l0aW9uLmxpbmVdID0gcG9zaXRpb25MaXN0O1xyXG4gICAgICAgIH1cclxuICAgICAgICBwb3NpdGlvbkxpc3QucHVzaCh7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbixcclxuICAgICAgICAgICAgZWxlbWVudDogZWxlbWVudFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBnZXRUeXBlQXRQb3NpdGlvbihsaW5lOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyKTogeyB0eXBlOiBUeXBlLCBpc1N0YXRpYzogYm9vbGVhbiB9IHtcclxuXHJcbiAgICAgICAgbGV0IHBvc2l0aW9uc09uTGluZSA9IHRoaXMuaWRlbnRpZmllclBvc2l0aW9uc1tsaW5lXTtcclxuICAgICAgICBpZiAocG9zaXRpb25zT25MaW5lID09IG51bGwpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBsZXQgZm91bmRQb3NpdGlvbjogSWRlbnRpZmllclBvc2l0aW9uID0gbnVsbDtcclxuICAgICAgICBmb3IgKGxldCBwIG9mIHBvc2l0aW9uc09uTGluZSkge1xyXG4gICAgICAgICAgICBpZiAoY29sdW1uID49IHAucG9zaXRpb24uY29sdW1uICYmIGNvbHVtbiA8PSBwLnBvc2l0aW9uLmNvbHVtbiArIHAucG9zaXRpb24ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBmb3VuZFBvc2l0aW9uID0gcDtcclxuICAgICAgICAgICAgICAgIGxldCBlbGVtZW50ID0gZm91bmRQb3NpdGlvbi5lbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBNZXRob2QpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB0eXBlOiBlbGVtZW50LCBpc1N0YXRpYzogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIEF0dHJpYnV0ZSwgVmFyaWFibGVcclxuICAgICAgICAgICAgICAgIGxldCB0eXBlOiBUeXBlID0gKGVsZW1lbnQgaW5zdGFuY2VvZiBUeXBlKSA/IGVsZW1lbnQgOiBlbGVtZW50LnR5cGU7XHJcbiAgICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgIGlmIChmb3VuZFBvc2l0aW9uLnBvc2l0aW9uLmxlbmd0aCA+IDAgJiYgZWxlbWVudC50eXBlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB0eXBlOiA8VHlwZT50eXBlLCBpc1N0YXRpYzogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyB0eXBlOiB0eXBlLCBpc1N0YXRpYzogZm91bmRQb3NpdGlvbi5wb3NpdGlvbi5sZW5ndGggPiAwIH07XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRFbGVtZW50QXRQb3NpdGlvbihsaW5lOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyKTogS2xhc3MgfCBJbnRlcmZhY2UgfCBNZXRob2QgfCBBdHRyaWJ1dGUgfCBWYXJpYWJsZSB7XHJcblxyXG4gICAgICAgIGxldCBwb3NpdGlvbnNPbkxpbmUgPSB0aGlzLmlkZW50aWZpZXJQb3NpdGlvbnNbbGluZV07XHJcbiAgICAgICAgaWYgKHBvc2l0aW9uc09uTGluZSA9PSBudWxsKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgbGV0IGJlc3RGb3VuZFBvc2l0aW9uOiBJZGVudGlmaWVyUG9zaXRpb24gPSBudWxsO1xyXG4gICAgICAgIGZvciAobGV0IHAgb2YgcG9zaXRpb25zT25MaW5lKSB7XHJcbiAgICAgICAgICAgIGlmIChjb2x1bW4gPj0gcC5wb3NpdGlvbi5jb2x1bW4gJiYgY29sdW1uIDw9IHAucG9zaXRpb24uY29sdW1uICsgcC5wb3NpdGlvbi5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocC5wb3NpdGlvbi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJlc3RGb3VuZFBvc2l0aW9uID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmVzdEZvdW5kUG9zaXRpb24gPSBwO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHAuZWxlbWVudCBpbnN0YW5jZW9mIE1ldGhvZCAmJiBiZXN0Rm91bmRQb3NpdGlvbi5lbGVtZW50IGluc3RhbmNlb2YgS2xhc3Mpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmVzdEZvdW5kUG9zaXRpb24gPSBwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYmVzdEZvdW5kUG9zaXRpb24gPT0gbnVsbCA/IG51bGwgOiA8YW55PmJlc3RGb3VuZFBvc2l0aW9uLmVsZW1lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgY29weSgpOiBNb2R1bGUge1xyXG4gICAgICAgIGxldCBtID0gbmV3IE1vZHVsZSh0aGlzLmZpbGUsIHRoaXMubWFpbik7XHJcbiAgICAgICAgbS5tb2RlbCA9IHRoaXMubW9kZWw7XHJcbiAgICAgICAgbS5tYWluUHJvZ3JhbSA9IHRoaXMubWFpblByb2dyYW07XHJcbiAgICAgICAgdGhpcy5tYWluUHJvZ3JhbSA9IG51bGw7XHJcbiAgICAgICAgbS5tYWluU3ltYm9sVGFibGUgPSB0aGlzLm1haW5TeW1ib2xUYWJsZTtcclxuICAgICAgICB0aGlzLm1haW5TeW1ib2xUYWJsZSA9IG51bGw7XHJcbiAgICAgICAgbS50eXBlU3RvcmUgPSB0aGlzLnR5cGVTdG9yZTtcclxuICAgICAgICAvLyB0aGlzLnR5cGVTdG9yZSA9IG51bGw7XHJcbiAgICAgICAgbS5pc1N0YXJ0YWJsZSA9IHRoaXMuaXNTdGFydGFibGU7XHJcbiAgICAgICAgbS5kZXBlbmRzT25Nb2R1bGVzV2l0aEVycm9ycyA9IHRoaXMuZGVwZW5kc09uTW9kdWxlc1dpdGhFcnJvcnM7XHJcblxyXG4gICAgICAgIG0uYnJlYWtwb2ludHMgPSB0aGlzLmJyZWFrcG9pbnRzO1xyXG4gICAgICAgIHRoaXMuYnJlYWtwb2ludHMgPSBbXTtcclxuICAgICAgICBsZXQgcHJvZ3JhbXMgPSBtLmdldFByb2dyYW1zKCk7XHJcblxyXG4gICAgICAgIHByb2dyYW1zLmZvckVhY2goKHApID0+IHAubW9kdWxlID0gbSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGIgb2YgbS5icmVha3BvaW50cykge1xyXG4gICAgICAgICAgICB0aGlzLmJyZWFrcG9pbnRzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgbGluZTogYi5saW5lLFxyXG4gICAgICAgICAgICAgICAgY29sdW1uOiBiLmNvbHVtbixcclxuICAgICAgICAgICAgICAgIHN0YXRlbWVudDogbnVsbFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIG0uYXR0YWNoVG9TdGF0ZW1lbnQoYiwgcHJvZ3JhbXMpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZmlsZS5kaXJ0eSA9IHRydWU7XHJcblxyXG4gICAgICAgIHJldHVybiBtO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyKCkge1xyXG5cclxuICAgICAgICB0aGlzLmlkZW50aWZpZXJQb3NpdGlvbnMgPSB7fTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZmlsZSAhPSBudWxsICYmIHRoaXMuZmlsZS5kaXJ0eSkge1xyXG4gICAgICAgICAgICAvLyBMZXhlclxyXG4gICAgICAgICAgICB0aGlzLnRva2VuTGlzdCA9IG51bGw7XHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzWzBdID0gW107XHJcblxyXG4gICAgICAgICAgICAvLyBBU1QgUGFyc2VyXHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzWzFdID0gW107XHJcblxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHR5cGUgcmVzb2x2ZXJcclxuICAgICAgICB0aGlzLmVycm9yc1syXSA9IFtdO1xyXG4gICAgICAgIHRoaXMudHlwZU5vZGVzID0gW107XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUgPSBuZXcgVHlwZVN0b3JlKCk7XHJcblxyXG4gICAgICAgIC8vIENvZGUgZ2VuZXJhdG9yXHJcbiAgICAgICAgdGhpcy5lcnJvcnNbM10gPSBbXTtcclxuICAgICAgICB0aGlzLm1haW5TeW1ib2xUYWJsZSA9IG5ldyBTeW1ib2xUYWJsZShudWxsLCB7IGxpbmU6IDEsIGNvbHVtbjogMSwgbGVuZ3RoOiAxIH0sIHsgbGluZTogMTAwMDAwLCBjb2x1bW46IDEsIGxlbmd0aDogMCB9KTtcclxuICAgICAgICB0aGlzLm1haW5Qcm9ncmFtID0gbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5tZXRob2RDYWxsUG9zaXRpb25zID0ge307XHJcbiAgICAgICAgdGhpcy5kZXBlbmRzT25Nb2R1bGVzID0gbmV3IE1hcCgpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBoYXNFcnJvcnMoKSB7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGVsIG9mIHRoaXMuZXJyb3JzKSB7XHJcbiAgICAgICAgICAgIGlmKGVsLmZpbmQoZXJyb3IgPT4gZXJyb3IubGV2ZWwgPT0gXCJlcnJvclwiKSl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBpZiAoZWwubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIC8vIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0U29ydGVkQW5kRmlsdGVyZWRFcnJvcnMoKTogRXJyb3JbXSB7XHJcblxyXG4gICAgICAgIGxldCBsaXN0OiBFcnJvcltdID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IGVsIG9mIHRoaXMuZXJyb3JzKSB7XHJcbiAgICAgICAgICAgIGxpc3QgPSBsaXN0LmNvbmNhdChlbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsaXN0LnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgICAgICAgaWYgKGEucG9zaXRpb24ubGluZSA+IGIucG9zaXRpb24ubGluZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGIucG9zaXRpb24ubGluZSA+IGEucG9zaXRpb24ubGluZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChhLnBvc2l0aW9uLmNvbHVtbiA+PSBiLnBvc2l0aW9uLmNvbHVtbikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBlMSA9IGxpc3RbaV07XHJcbiAgICAgICAgICAgIGxldCBlMiA9IGxpc3RbaSArIDFdO1xyXG4gICAgICAgICAgICBpZiAoZTEucG9zaXRpb24ubGluZSA9PSBlMi5wb3NpdGlvbi5saW5lICYmIGUxLnBvc2l0aW9uLmNvbHVtbiArIDEwID4gZTIucG9zaXRpb24uY29sdW1uKSB7XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLmVycm9yTGV2ZWxDb21wYXJlKGUxLmxldmVsLCBlMi5sZXZlbCkgPT0gMSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5zcGxpY2UoaSArIDEsIDEpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsaXN0LnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGktLTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGxpc3Q7XHJcbiAgICB9XHJcblxyXG4gICAgZXJyb3JMZXZlbENvbXBhcmUobGV2ZWwxOiBFcnJvckxldmVsLCBsZXZlbDI6IEVycm9yTGV2ZWwpOiBudW1iZXIge1xyXG4gICAgICAgIGlmKGxldmVsMSA9PSBcImVycm9yXCIpIHJldHVybiAxO1xyXG4gICAgICAgIGlmKGxldmVsMiA9PSBcImVycm9yXCIpIHJldHVybiAyO1xyXG4gICAgICAgIGlmKGxldmVsMSA9PSBcIndhcm5pbmdcIikgcmV0dXJuIDE7XHJcbiAgICAgICAgaWYobGV2ZWwyID09IFwid2FybmluZ1wiKSByZXR1cm4gMjtcclxuICAgICAgICByZXR1cm4gMTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXJTdGFydEJ1dHRvbigpIHtcclxuICAgICAgICBsZXQgJGJ1dHRvbkRpdiA9IHRoaXMuZmlsZT8ucGFuZWxFbGVtZW50Py4kaHRtbEZpcnN0TGluZT8uZmluZCgnLmpvX2FkZGl0aW9uYWxCdXR0b25TdGFydCcpO1xyXG4gICAgICAgIGlmICgkYnV0dG9uRGl2ID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgJGJ1dHRvbkRpdi5maW5kKCcuam9fc3RhcnRCdXR0b24nKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNTdGFydGFibGUpIHtcclxuICAgICAgICAgICAgbGV0ICRzdGFydEJ1dHRvbkRpdiA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvX3N0YXJ0QnV0dG9uIGltZ19zdGFydC1kYXJrIGpvX2J1dHRvbiBqb19hY3RpdmVcIiB0aXRsZT1cIkhhdXB0cHJvZ3JhbW0gaW4gZGVyIERhdGVpIHN0YXJ0ZW5cIj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgJGJ1dHRvbkRpdi5hcHBlbmQoJHN0YXJ0QnV0dG9uRGl2KTtcclxuICAgICAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICAgICAkc3RhcnRCdXR0b25EaXYub24oJ21vdXNlZG93bicsIChlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpKTtcclxuICAgICAgICAgICAgJHN0YXJ0QnV0dG9uRGl2Lm9uKCdjbGljaycsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQubWFpbi5zZXRNb2R1bGVBY3RpdmUodGhhdCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhhdC5tYWluLmdldEludGVycHJldGVyKCkuc3RhcnQoKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH0gXHJcbiAgICB9XHJcblxyXG5cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEJhc2VNb2R1bGUgZXh0ZW5kcyBNb2R1bGUge1xyXG4gICAgY29uc3RydWN0b3IobWFpbjogTWFpbkJhc2UpIHtcclxuXHJcbiAgICAgICAgc3VwZXIoeyBuYW1lOiBcIkJhc2UgTW9kdWxlXCIsIHRleHQ6IFwiXCIsIHRleHRfYmVmb3JlX3JldmlzaW9uOiBudWxsLCBzdWJtaXR0ZWRfZGF0ZTogbnVsbCwgc3R1ZGVudF9lZGl0ZWRfYWZ0ZXJfcmV2aXNpb246IGZhbHNlLCBkaXJ0eTogZmFsc2UsIHNhdmVkOiB0cnVlLCB2ZXJzaW9uOiAxICwgaWRlbnRpY2FsX3RvX3JlcG9zaXRvcnlfdmVyc2lvbjogdHJ1ZX0sIG1haW4pO1xyXG5cclxuICAgICAgICB0aGlzLmlzU3lzdGVtTW9kdWxlID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLm1haW5Qcm9ncmFtID0gbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5jbGVhcigpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZSh2b2lkUHJpbWl0aXZlVHlwZSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShpbnRQcmltaXRpdmVUeXBlKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKGZsb2F0UHJpbWl0aXZlVHlwZSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShkb3VibGVQcmltaXRpdmVUeXBlKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKGNoYXJQcmltaXRpdmVUeXBlKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKGJvb2xlYW5QcmltaXRpdmVUeXBlKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKHN0cmluZ1ByaW1pdGl2ZVR5cGUpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUob2JqZWN0VHlwZSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZSh2YXJUeXBlKTtcclxuXHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShJbnRlZ2VyVHlwZSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShGbG9hdFR5cGUpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUoRG91YmxlVHlwZSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShDaGFyYWN0ZXJUeXBlKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKEJvb2xlYW5UeXBlKTtcclxuXHJcbiAgICAgICAgLy8gQ29sbGVjdGlvbnMgRnJhbWV3b3JrXHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgSXRlcmF0b3JDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgSXRlcmFibGVDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgQ29sbGVjdGlvbkNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBMaXN0Q2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IEFycmF5TGlzdENsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBWZWN0b3JDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgUXVldWVDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgRGVxdWVDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgTGlua2VkTGlzdENsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBTdGFja0NsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBMaXN0SXRlcmF0b3JJbXBsQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFNldENsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBIYXNoU2V0Q2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IExpbmtlZEhhc2hTZXRDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgU2V0SXRlcmF0b3JJbXBsQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IE1hcENsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBIYXNoTWFwQ2xhc3ModGhpcykpO1xyXG5cclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBDb25zb2xlQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IE1hdGhDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgUmFuZG9tQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFZlY3RvcjJDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgTWF0aFRvb2xzQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IEtleUNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBTb3VuZENsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBJbnB1dENsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBSdW5uYWJsZSh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgVGltZXJDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgQ29sb3JDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgQWN0b3JDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgRGlyZWN0aW9uQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFNoYXBlQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IEZpbGxlZFNoYXBlQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFJlY3RhbmdsZUNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBSb3VuZGVkUmVjdGFuZ2xlQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IENpcmNsZUNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBTZWN0b3JDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgQXJjQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IEVsbGlwc2VDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgQml0bWFwQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IEFsaWdubWVudENsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBUZXh0Q2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFNjYWxlTW9kZUNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBTcHJpdGVMaWJyYXJ5Q2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFJlcGVhdFR5cGVDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgVGlsZUNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBTcHJpdGVDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgQ29sbGlzaW9uUGFpckNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBHcm91cENsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBQb2x5Z29uQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IExpbmVDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgVHJpYW5nbGVDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgVHVydGxlQ2xhc3ModGhpcykpO1xyXG5cclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBNb3VzZUxpc3RlbmVySW50ZXJmYWNlKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBNb3VzZUFkYXB0ZXJDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgR2FtZXBhZENsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBXb3JsZENsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBQcm9jZXNzaW5nQ2xhc3ModGhpcykpO1xyXG5cclxuICAgICAgICAoPEFjdG9yQ2xhc3M+dGhpcy50eXBlU3RvcmUuZ2V0VHlwZShcIkFjdG9yXCIpKS5yZWdpc3RlcldvcmxkVHlwZSgpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgUHJpbnRTdHJlYW1DbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgS2V5TGlzdGVuZXIodGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFN5c3RlbUNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBTeXN0ZW1Ub29sc0NsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBEYXlPZldlZWtFbnVtKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBNb250aEVudW0odGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IExvY2FsRGF0ZVRpbWVDbGFzcyh0aGlzKSk7XHJcbiAgICBcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBXZWJTb2NrZXRDbGllbnRDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgV2ViU29ja2V0Q2xhc3ModGhpcykpO1xyXG5cclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBSb2JvdFdvcmxkQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFJvYm90Q2xhc3ModGhpcykpO1xyXG5cclxuICAgIFxyXG5cclxuICAgICAgICBzdHJpbmdQcmltaXRpdmVUeXBlLm1vZHVsZSA9IHRoaXM7XHJcbiAgICAgICAgLy8gc3RyaW5nUHJpbWl0aXZlVHlwZS5iYXNlQ2xhc3MgPSA8YW55Pih0aGlzLnR5cGVTdG9yZS5nZXRUeXBlKFwiT2JqZWN0XCIpKTtcclxuICAgICAgICAvLyBzdHJpbmdQcmltaXRpdmVUeXBlLmJhc2VDbGFzcyA9IG9iamVjdFR5cGU7XHJcbiAgICAgICAgLy8gSW50ZWdlclR5cGUuYmFzZUNsYXNzID0gb2JqZWN0VHlwZTtcclxuICAgICAgICAvLyBEb3VibGVUeXBlLmJhc2VDbGFzcyA9IG9iamVjdFR5cGU7XHJcbiAgICAgICAgLy8gRmxvYXRUeXBlLmJhc2VDbGFzcyA9IG9iamVjdFR5cGU7XHJcbiAgICAgICAgLy8gQ2hhcmFjdGVyVHlwZS5iYXNlQ2xhc3MgPSBvYmplY3RUeXBlO1xyXG4gICAgICAgIC8vIEJvb2xlYW5UeXBlLmJhc2VDbGFzcyA9IG9iamVjdFR5cGU7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyVXNhZ2VQb3NpdGlvbnMoKSB7XHJcbiAgICAgICAgZm9yIChsZXQgdHlwZSBvZiB0aGlzLnR5cGVTdG9yZS50eXBlTGlzdCkge1xyXG4gICAgICAgICAgICB0eXBlLmNsZWFyVXNhZ2VQb3NpdGlvbnMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBHTkdNb2R1bGUgZXh0ZW5kcyBNb2R1bGUge1xyXG4gICAgY29uc3RydWN0b3IobWFpbjogTWFpbkJhc2UsIG1vZHVsZVN0b3JlOiBNb2R1bGVTdG9yZSkge1xyXG5cclxuICAgICAgICBzdXBlcih7IG5hbWU6IFwiR3JhcGhpY3MgYW5kIEdhbWVzIC0gTW9kdWxlXCIsIHRleHQ6IFwiXCIsIHRleHRfYmVmb3JlX3JldmlzaW9uOiBudWxsLCBzdWJtaXR0ZWRfZGF0ZTogbnVsbCwgc3R1ZGVudF9lZGl0ZWRfYWZ0ZXJfcmV2aXNpb246IGZhbHNlLCBkaXJ0eTogZmFsc2UsIHNhdmVkOiB0cnVlLCB2ZXJzaW9uOiAxICwgaWRlbnRpY2FsX3RvX3JlcG9zaXRvcnlfdmVyc2lvbjogdHJ1ZX0sIG1haW4pO1xyXG5cclxuICAgICAgICB0aGlzLmlzU3lzdGVtTW9kdWxlID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLm1haW5Qcm9ncmFtID0gbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5jbGVhcigpO1xyXG5cclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBHTkdBa3Rpb25zZW1wZmFlbmdlckludGVyZmFjZSh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgR05HQmFzZUZpZ3VyQ2xhc3ModGhpcywgbW9kdWxlU3RvcmUpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBHTkdaZWljaGVuZmVuc3RlckNsYXNzKHRoaXMsIG1vZHVsZVN0b3JlKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgR05HRXJlaWduaXNiZWhhbmRsdW5nKHRoaXMsIG1vZHVsZVN0b3JlKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgR05HUmVjaHRlY2tDbGFzcyh0aGlzLCBtb2R1bGVTdG9yZSkpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IEdOR0RyZWllY2tDbGFzcyh0aGlzLCBtb2R1bGVTdG9yZSkpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IEdOR0tyZWlzQ2xhc3ModGhpcywgbW9kdWxlU3RvcmUpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBHTkdUZXh0Q2xhc3ModGhpcywgbW9kdWxlU3RvcmUpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBHTkdUdXJ0bGVDbGFzcyh0aGlzLCBtb2R1bGVTdG9yZSkpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IEdOR0ZpZ3VyQ2xhc3ModGhpcywgbW9kdWxlU3RvcmUpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBLZXlFdmVudENsYXNzKHRoaXMsIG1vZHVsZVN0b3JlKSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyVXNhZ2VQb3NpdGlvbnMoKSB7XHJcbiAgICAgICAgZm9yIChsZXQgdHlwZSBvZiB0aGlzLnR5cGVTdG9yZS50eXBlTGlzdCkge1xyXG4gICAgICAgICAgICB0eXBlLmNsZWFyVXNhZ2VQb3NpdGlvbnMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgTW9kdWxlU3RvcmUge1xyXG5cclxuICAgIHByaXZhdGUgbW9kdWxlczogTW9kdWxlW10gPSBbXTtcclxuICAgIHByaXZhdGUgbW9kdWxlTWFwOiB7W25hbWU6IHN0cmluZ106IE1vZHVsZX0gPSB7fTtcclxuICAgIHByaXZhdGUgYmFzZU1vZHVsZTogQmFzZU1vZHVsZTtcclxuXHJcbiAgICBkaXJ0eTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbWFpbjogTWFpbkJhc2UsIHdpdGhCYXNlTW9kdWxlOiBib29sZWFuLCBwcml2YXRlIGFkZGl0aW9uYWxMaWJyYXJpZXM6IHN0cmluZ1tdID0gW10pIHtcclxuICAgICAgICBpZiAod2l0aEJhc2VNb2R1bGUpIHtcclxuICAgICAgICAgICAgdGhpcy5iYXNlTW9kdWxlID0gbmV3IEJhc2VNb2R1bGUobWFpbik7XHJcbiAgICAgICAgICAgIHRoaXMucHV0TW9kdWxlKHRoaXMuYmFzZU1vZHVsZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGFkZGl0aW9uYWxMaWJyYXJpZXMgPSBbXCJnbmdcIl07XHJcblxyXG4gICAgICAgIGZvcihsZXQgbGliIG9mIGFkZGl0aW9uYWxMaWJyYXJpZXMpe1xyXG4gICAgICAgICAgICB0aGlzLmFkZExpYnJhcnlNb2R1bGUobGliKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkTGlicmFyeU1vZHVsZShpZGVudGlmaWVyOiBzdHJpbmcpe1xyXG4gICAgICAgIHN3aXRjaChpZGVudGlmaWVyKXtcclxuICAgICAgICAgICAgY2FzZSBcImduZ1wiOiB0aGlzLnB1dE1vZHVsZShuZXcgR05HTW9kdWxlKHRoaXMubWFpbiwgdGhpcykpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2V0QWRkaXRpb25hbExpYnJhcmllcyhhZGRpdGlvbmFsTGlicmFyaWVzOiBzdHJpbmdbXSl7XHJcblxyXG4gICAgICAgIHRoaXMubW9kdWxlcyA9IHRoaXMubW9kdWxlcy5maWx0ZXIoIG0gPT4gKCFtLmlzU3lzdGVtTW9kdWxlKSB8fCBtIGluc3RhbmNlb2YgQmFzZU1vZHVsZSk7XHJcbiAgICAgICAgdGhpcy5tb2R1bGVNYXAgPSB7fTtcclxuXHJcbiAgICAgICAgZm9yKGxldCBtIG9mIHRoaXMubW9kdWxlcyl7XHJcbiAgICAgICAgICAgIHRoaXMubW9kdWxlTWFwW20uZmlsZS5uYW1lXSA9ICBtO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoYWRkaXRpb25hbExpYnJhcmllcyAhPSBudWxsKXtcclxuICAgICAgICAgICAgZm9yKGxldCBsaWIgb2YgYWRkaXRpb25hbExpYnJhcmllcyl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZExpYnJhcnlNb2R1bGUobGliKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZmluZE1vZHVsZUJ5SWQobW9kdWxlX2lkOiBudW1iZXIpOiBNb2R1bGUge1xyXG4gICAgICAgIGZvcihsZXQgbW9kdWxlIG9mIHRoaXMubW9kdWxlcyl7XHJcbiAgICAgICAgICAgIGlmKG1vZHVsZS5maWxlLmlkID09IG1vZHVsZV9pZCkgcmV0dXJuIG1vZHVsZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEJhc2VNb2R1bGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYmFzZU1vZHVsZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2xlYXJVc2FnZVBvc2l0aW9ucygpIHtcclxuICAgICAgICB0aGlzLmJhc2VNb2R1bGUuY2xlYXJVc2FnZVBvc2l0aW9ucygpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvcHkoKTogTW9kdWxlU3RvcmUge1xyXG4gICAgICAgIGxldCBtczogTW9kdWxlU3RvcmUgPSBuZXcgTW9kdWxlU3RvcmUodGhpcy5tYWluLCB0cnVlKTtcclxuICAgICAgICBmb3IgKGxldCBtIG9mIHRoaXMubW9kdWxlcykge1xyXG4gICAgICAgICAgICBpZiAoIW0uaXNTeXN0ZW1Nb2R1bGUpIHtcclxuICAgICAgICAgICAgICAgIG1zLnB1dE1vZHVsZShtLmNvcHkoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG1zO1xyXG4gICAgfVxyXG5cclxuICAgIGZpbmRNb2R1bGVCeUZpbGUoZmlsZTogRmlsZSkge1xyXG4gICAgICAgIGZvciAobGV0IG0gb2YgdGhpcy5tb2R1bGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChtLmZpbGUgPT0gZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgaGFzRXJyb3JzKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGZvciAobGV0IG0gb2YgdGhpcy5tb2R1bGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChtLmhhc0Vycm9ycygpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Rmlyc3RNb2R1bGUoKTogTW9kdWxlIHtcclxuICAgICAgICBpZiAodGhpcy5tb2R1bGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgbW8gb2YgdGhpcy5tb2R1bGVzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW1vLmlzU3lzdGVtTW9kdWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGlzRGlydHkoKTogYm9vbGVhbiB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmRpcnR5KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZGlydHkgPSBmYWxzZTtcclxuICAgICAgICBmb3IgKGxldCBtIG9mIHRoaXMubW9kdWxlcykge1xyXG4gICAgICAgICAgICBpZiAobS5maWxlLmRpcnR5KSB7XHJcbiAgICAgICAgICAgICAgICBkaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGlydHk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGdldE1vZHVsZXMoaW5jbHVkZVN5c3RlbU1vZHVsZXM6IGJvb2xlYW4sIGV4Y2x1ZGVkTW9kdWxlTmFtZT86IFN0cmluZyk6IE1vZHVsZVtdIHtcclxuICAgICAgICBsZXQgcmV0ID0gW107XHJcbiAgICAgICAgZm9yIChsZXQgbSBvZiB0aGlzLm1vZHVsZXMpIHtcclxuICAgICAgICAgICAgaWYgKG0uZmlsZS5uYW1lICE9IGV4Y2x1ZGVkTW9kdWxlTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFtLmlzU3lzdGVtTW9kdWxlIHx8IGluY2x1ZGVTeXN0ZW1Nb2R1bGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0LnB1c2gobSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuXHJcbiAgICBwdXRNb2R1bGUobW9kdWxlOiBNb2R1bGUpIHtcclxuICAgICAgICB0aGlzLm1vZHVsZXMucHVzaChtb2R1bGUpO1xyXG4gICAgICAgIHRoaXMubW9kdWxlTWFwW21vZHVsZS5maWxlLm5hbWVdID0gbW9kdWxlO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZU1vZHVsZVdpdGhGaWxlKGZpbGU6IEZpbGUpIHtcclxuICAgICAgICBmb3IgKGxldCBtIG9mIHRoaXMubW9kdWxlcykge1xyXG4gICAgICAgICAgICBpZiAobS5maWxlID09IGZpbGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTW9kdWxlKG0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlTW9kdWxlKG1vZHVsZTogTW9kdWxlKSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm1vZHVsZXMuaW5kZXhPZihtb2R1bGUpIDwgMCkgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLm1vZHVsZXMuc3BsaWNlKHRoaXMubW9kdWxlcy5pbmRleE9mKG1vZHVsZSksIDEpO1xyXG4gICAgICAgIHRoaXMubW9kdWxlTWFwW21vZHVsZS5maWxlLm5hbWVdID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIHRoaXMuZGlydHkgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE1vZHVsZShtb2R1bGVOYW1lOiBzdHJpbmcpOiBNb2R1bGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZHVsZU1hcFttb2R1bGVOYW1lXTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRUeXBlKGlkZW50aWZpZXI6IHN0cmluZyk6IHsgdHlwZTogVHlwZSwgbW9kdWxlOiBNb2R1bGUgfSB7XHJcbiAgICAgICAgZm9yIChsZXQgbW9kdWxlIG9mIHRoaXMubW9kdWxlcykge1xyXG4gICAgICAgICAgICBpZiAobW9kdWxlLnR5cGVTdG9yZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdHlwZSA9IG1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShpZGVudGlmaWVyKTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB0eXBlOiB0eXBlLCBtb2R1bGU6IG1vZHVsZSB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFR5cGVDb21wbGV0aW9uSXRlbXMobW9kdWxlQ29udGV4dDogTW9kdWxlLCByYW5nZVRvUmVwbGFjZTogbW9uYWNvLklSYW5nZSk6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1bXSB7XHJcblxyXG4gICAgICAgIGxldCBjb21wbGV0aW9uSXRlbXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1bXSA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBtb2R1bGUgb2YgdGhpcy5tb2R1bGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChtb2R1bGUudHlwZVN0b3JlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IHR5cGUgb2YgbW9kdWxlLnR5cGVTdG9yZS50eXBlTGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtb2R1bGUgPT0gbW9kdWxlQ29udGV4dCB8fCAodHlwZSBpbnN0YW5jZW9mIEtsYXNzICYmIHR5cGUudmlzaWJpbGl0eSA9PSBWaXNpYmlsaXR5LnB1YmxpYylcclxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgbW9kdWxlLmlzU3lzdGVtTW9kdWxlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZGV0YWlsID0gXCJLbGFzc2VcIjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHR5cGUuZG9jdW1lbnRhdGlvbiAhPSBudWxsKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbCA9IHR5cGUuZG9jdW1lbnRhdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtb2R1bGUuaXNTeXN0ZW1Nb2R1bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlIGluc3RhbmNlb2YgUHJpbWl0aXZlVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbCA9IFwiUHJpbWl0aXZlciBEYXRlbnR5cFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWwgPSBcIlN5c3RlbWtsYXNzZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaXRlbSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiB0eXBlLmlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IGRldGFpbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IHR5cGUuaWRlbnRpZmllcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ6IHR5cGUgaW5zdGFuY2VvZiBQcmltaXRpdmVUeXBlID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5TdHJ1Y3QgOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5DbGFzcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlOiByYW5nZVRvUmVwbGFjZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyaWM6ICgodHlwZSBpbnN0YW5jZW9mIEtsYXNzIHx8IHR5cGUgaW5zdGFuY2VvZiBJbnRlcmZhY2UpICYmIHR5cGUudHlwZVZhcmlhYmxlcy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGxldGlvbkl0ZW1zLnB1c2goaXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY29tcGxldGlvbkl0ZW1zO1xyXG5cclxuICAgIH1cclxuXHJcblxyXG5cclxuXHJcbn1cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgVHlwZVN0b3JlIHtcclxuXHJcbiAgICB0eXBlTGlzdDogVHlwZVtdID0gW107XHJcbiAgICB0eXBlTWFwOiBNYXA8c3RyaW5nLCBUeXBlPiA9IG5ldyBNYXAoKTtcclxuXHJcbiAgICBhZGRUeXBlKHR5cGU6IFR5cGUpIHtcclxuICAgICAgICB0aGlzLnR5cGVMaXN0LnB1c2godHlwZSk7XHJcbiAgICAgICAgdGhpcy50eXBlTWFwLnNldCh0eXBlLmlkZW50aWZpZXIsIHR5cGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyKCkge1xyXG4gICAgICAgIHRoaXMudHlwZUxpc3QubGVuZ3RoID0gMDtcclxuICAgICAgICB0aGlzLnR5cGVNYXAuY2xlYXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRUeXBlKGlkZW50aWZpZXI6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnR5cGVNYXAuZ2V0KGlkZW50aWZpZXIpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG59XHJcbiJdfQ==