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
import { SpriteClass } from "../../runtimelibrary/graphics/Sprite.js";
import { SpriteLibraryClass } from "../../runtimelibrary/graphics/SpriteLibraryEnum.js";
import { TextClass } from "../../runtimelibrary/graphics/Text.js";
import { WorldClass } from "../../runtimelibrary/graphics/World.js";
import { InputClass } from "../../runtimelibrary/Input.js";
import { MathClass } from "../../runtimelibrary/Math.js";
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
export class Module {
    constructor(file, main) {
        this.main = main;
        this.oldErrorDecorations = [];
        this.isSystemModule = false;
        this.breakpoints = [];
        this.breakpointDecorators = [];
        this.decoratorIdToBreakpointMap = {};
        this.errors = [[], [], [], []]; // 1st pass, 2nd pass, 3rd pass
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
        this.model.updateOptions({ tabSize: 3 });
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
        let f1 = {
            name: f.name,
            text: f.text,
            text_before_revision: f.text_before_revision,
            submitted_date: f.submitted_date,
            student_edited_after_revision: false,
            dirty: true,
            saved: true,
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
            if (column >= p.position.column && column < p.position.column + p.position.length) {
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
        this.typeStore.addType(new Vector2Class(this));
        this.typeStore.addType(new KeyClass(this));
        this.typeStore.addType(new SoundClass(this));
        this.typeStore.addType(new InputClass(this));
        this.typeStore.addType(new Runnable(this));
        this.typeStore.addType(new TimerClass(this));
        this.typeStore.addType(new ColorClass(this));
        this.typeStore.addType(new ActorClass(this));
        this.typeStore.addType(new ShapeClass(this));
        this.typeStore.addType(new FilledShapeClass(this));
        this.typeStore.addType(new RectangleClass(this));
        this.typeStore.addType(new RoundedRectangleClass(this));
        this.typeStore.addType(new CircleClass(this));
        this.typeStore.addType(new EllipseClass(this));
        this.typeStore.addType(new BitmapClass(this));
        this.typeStore.addType(new AlignmentClass(this));
        this.typeStore.addType(new TextClass(this));
        this.typeStore.addType(new ScaleModeClass(this));
        this.typeStore.addType(new SpriteLibraryClass(this));
        this.typeStore.addType(new RepeatTypeClass(this));
        this.typeStore.addType(new SpriteClass(this));
        this.typeStore.addType(new CollisionPairClass(this));
        this.typeStore.addType(new GroupClass(this));
        this.typeStore.addType(new PolygonClass(this));
        this.typeStore.addType(new LineClass(this));
        this.typeStore.addType(new TriangleClass(this));
        this.typeStore.addType(new TurtleClass(this));
        this.typeStore.addType(new MouseListenerInterface(this));
        this.typeStore.addType(new MouseAdapterClass(this));
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
        this.modules = [];
        this.moduleMap = new Map();
        this.dirty = false;
        if (withBaseModule) {
            this.baseModule = new BaseModule(main);
            this.putModule(this.baseModule);
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9jb21waWxlci9wYXJzZXIvTW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSwrQ0FBK0MsQ0FBQztBQUMvRSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sZ0RBQWdELENBQUM7QUFDakYsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDhDQUE4QyxDQUFDO0FBQzdFLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSw4Q0FBOEMsQ0FBQztBQUM3RSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sMENBQTBDLENBQUM7QUFDckUsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sc0RBQXNELENBQUM7QUFDN0YsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZFLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSw0Q0FBNEMsQ0FBQztBQUN6RSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0seUNBQXlDLENBQUM7QUFDbkUsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0scURBQXFELENBQUM7QUFDM0YsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLDZDQUE2QyxDQUFDO0FBQzNFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLG1EQUFtRCxDQUFDO0FBQ3ZGLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSwyQ0FBMkMsQ0FBQztBQUN2RSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sMkNBQTJDLENBQUM7QUFDdkUsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLGdEQUFnRCxDQUFDO0FBQ2pGLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUMvRCxPQUFPLEVBQUUsS0FBSyxJQUFJLFVBQVUsRUFBRSxNQUFNLHdDQUF3QyxDQUFDO0FBQzdFLE9BQU8sRUFBRSxj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UUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRCxLQUFLO1FBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVELE9BQU8sQ0FBQyxVQUFrQjtRQUN0QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7Q0FJSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEZpbGVEYXRhIH0gZnJvbSBcIi4uLy4uL2NvbW11bmljYXRpb24vRGF0YS5qc1wiO1xyXG5pbXBvcnQgeyBBY2NvcmRpb25FbGVtZW50IH0gZnJvbSBcIi4uLy4uL21haW4vZ3VpL0FjY29yZGlvbi5qc1wiO1xyXG5pbXBvcnQgeyBNYWluQmFzZSB9IGZyb20gXCIuLi8uLi9tYWluL01haW5CYXNlLmpzXCI7XHJcbmltcG9ydCB7IEFycmF5TGlzdENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL0FycmF5TGlzdC5qc1wiO1xyXG5pbXBvcnQgeyBDb2xsZWN0aW9uQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvQ29sbGVjdGlvbi5qc1wiO1xyXG5pbXBvcnQgeyBJdGVyYWJsZUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL0l0ZXJhYmxlLmpzXCI7XHJcbmltcG9ydCB7IEl0ZXJhdG9yQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvSXRlcmF0b3IuanNcIjtcclxuaW1wb3J0IHsgTGlzdENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL0xpc3QuanNcIjtcclxuaW1wb3J0IHsgTGlzdEl0ZXJhdG9ySW1wbENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL0xpc3RJdGVyYXRvckltcGwuanNcIjtcclxuaW1wb3J0IHsgU3RhY2tDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9jb2xsZWN0aW9ucy9TdGFjay5qc1wiO1xyXG5pbXBvcnQgeyBWZWN0b3JDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9jb2xsZWN0aW9ucy9WZWN0b3IuanNcIjtcclxuaW1wb3J0IHsgU2V0Q2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvU2V0LmpzXCI7XHJcbmltcG9ydCB7IFNldEl0ZXJhdG9ySW1wbENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL1NldEl0ZXJhdG9ySW1wbC5qc1wiO1xyXG5pbXBvcnQgeyBIYXNoU2V0Q2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvSGFzaFNldC5qc1wiO1xyXG5pbXBvcnQgeyBMaW5rZWRIYXNoU2V0Q2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvTGlua2VkSGFzaFNldC5qc1wiO1xyXG5pbXBvcnQgeyBRdWV1ZUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL1F1ZXVlLmpzXCI7XHJcbmltcG9ydCB7IERlcXVlQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvRGVxdWUuanNcIjtcclxuaW1wb3J0IHsgTGlua2VkTGlzdENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL0xpbmtlZExpc3QuanNcIjtcclxuaW1wb3J0IHsgQ29uc29sZUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L0NvbnNvbGUuanNcIjtcclxuaW1wb3J0IHsgQWN0b3IgYXMgQWN0b3JDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9BY3Rvci5qc1wiO1xyXG5pbXBvcnQgeyBBbGlnbm1lbnRDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9BbGlnbm1lbnQuanNcIjtcclxuaW1wb3J0IHsgQml0bWFwQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvQml0bWFwLmpzXCI7XHJcbmltcG9ydCB7IENpcmNsZUNsYXNzIGFzIENpcmNsZUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL0NpcmNsZS5qc1wiO1xyXG5pbXBvcnQgeyBDb2xvckNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL0NvbG9yLmpzXCI7XHJcbmltcG9ydCB7IEVsbGlwc2VDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9FbGxpcHNlLmpzXCI7XHJcbmltcG9ydCB7IEZpbGxlZFNoYXBlQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvRmlsbGVkU2hhcGUuanNcIjtcclxuaW1wb3J0IHsgQ29sbGlzaW9uUGFpckNsYXNzLCBHcm91cENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL0dyb3VwLmpzXCI7XHJcbmltcG9ydCB7IEtleUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL0tleS5qc1wiO1xyXG5pbXBvcnQgeyBQb2x5Z29uQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvUG9seWdvbi5qc1wiO1xyXG5pbXBvcnQgeyBSZWN0YW5nbGVDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9SZWN0YW5nbGUuanNcIjtcclxuaW1wb3J0IHsgUmVwZWF0VHlwZUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1JlcGVhdFR5cGUuanNcIjtcclxuaW1wb3J0IHsgUm91bmRlZFJlY3RhbmdsZUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1JvdW5kZWRSZWN0YW5nbGUuanNcIjtcclxuaW1wb3J0IHsgU2NhbGVNb2RlQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvU2NhbGVNb2RlLmpzXCI7XHJcbmltcG9ydCB7IFNoYXBlQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvU2hhcGUuanNcIjtcclxuaW1wb3J0IHsgU291bmRLbGFzcyBhcyBTb3VuZENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1NvdW5kLmpzXCI7XHJcbmltcG9ydCB7IFNwcml0ZUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1Nwcml0ZS5qc1wiO1xyXG5pbXBvcnQgeyBTcHJpdGVMaWJyYXJ5Q2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvU3ByaXRlTGlicmFyeUVudW0uanNcIjtcclxuaW1wb3J0IHsgVGV4dENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1RleHQuanNcIjtcclxuaW1wb3J0IHsgV29ybGRDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9Xb3JsZC5qc1wiO1xyXG5pbXBvcnQgeyBJbnB1dENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L0lucHV0LmpzXCI7XHJcbmltcG9ydCB7IE1hdGhDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9NYXRoLmpzXCI7XHJcbmltcG9ydCB7IFByaW50U3RyZWFtQ2xhc3MsIFN5c3RlbUNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L1N5c3RlbS5qc1wiO1xyXG5pbXBvcnQgeyBLZXlMaXN0ZW5lciwgU3lzdGVtVG9vbHNDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9TeXN0ZW1Ub29scy5qc1wiO1xyXG5pbXBvcnQgeyBSdW5uYWJsZSwgVGltZXJDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9UaW1lci5qc1wiO1xyXG5pbXBvcnQgeyBXb3Jrc3BhY2UgfSBmcm9tIFwiLi4vLi4vd29ya3NwYWNlL1dvcmtzcGFjZS5qc1wiO1xyXG5pbXBvcnQgeyBFcnJvciwgRXJyb3JMZXZlbCB9IGZyb20gXCIuLi9sZXhlci9MZXhlci5qc1wiO1xyXG5pbXBvcnQgeyBUZXh0UG9zaXRpb24sIFRva2VuLCBUb2tlblR5cGUsIFRleHRQb3NpdGlvbldpdGhvdXRMZW5ndGggfSBmcm9tIFwiLi4vbGV4ZXIvVG9rZW4uanNcIjtcclxuaW1wb3J0IHsgSW50ZXJmYWNlLCBLbGFzcywgVmlzaWJpbGl0eSB9IGZyb20gXCIuLi90eXBlcy9DbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBib29sZWFuUHJpbWl0aXZlVHlwZSwgQm9vbGVhblR5cGUsIENoYXJhY3RlclR5cGUsIGNoYXJQcmltaXRpdmVUeXBlLCBkb3VibGVQcmltaXRpdmVUeXBlLCBEb3VibGVUeXBlLCBmbG9hdFByaW1pdGl2ZVR5cGUsIEZsb2F0VHlwZSwgSW50ZWdlclR5cGUsIGludFByaW1pdGl2ZVR5cGUsIG9iamVjdFR5cGUsIHN0cmluZ1ByaW1pdGl2ZVR5cGUsIHZvaWRQcmltaXRpdmVUeXBlLCB2YXJUeXBlIH0gZnJvbSBcIi4uL3R5cGVzL1ByaW1pdGl2ZVR5cGVzLmpzXCI7XHJcbmltcG9ydCB7IEF0dHJpYnV0ZSwgTWV0aG9kLCBQcmltaXRpdmVUeXBlLCBUeXBlLCBWYXJpYWJsZSB9IGZyb20gXCIuLi90eXBlcy9UeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBBU1ROb2RlLCBNZXRob2REZWNsYXJhdGlvbk5vZGUsIFR5cGVOb2RlIH0gZnJvbSBcIi4vQVNULmpzXCI7XHJcbmltcG9ydCB7IEJyZWFrcG9pbnQsIFByb2dyYW0sIFN0YXRlbWVudCB9IGZyb20gXCIuL1Byb2dyYW0uanNcIjtcclxuaW1wb3J0IHsgU3ltYm9sVGFibGUgfSBmcm9tIFwiLi9TeW1ib2xUYWJsZS5qc1wiO1xyXG5pbXBvcnQgeyBNYXBDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9jb2xsZWN0aW9ucy9NYXAuanNcIjtcclxuaW1wb3J0IHsgSGFzaE1hcENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL0hhc2hNYXAuanNcIjtcclxuaW1wb3J0IHsgVHJpYW5nbGVDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9UcmlhbmdsZS5qc1wiO1xyXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uLy4uL21haW4vTWFpbi5qc1wiO1xyXG5pbXBvcnQgeyBMb2NhbERhdGVUaW1lQ2xhc3MsIERheU9mV2Vla0VudW0sIE1vbnRoRW51bSB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9Mb2NhbERhdGVUaW1lLmpzXCI7XHJcbmltcG9ydCB7IExpbmVDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9MaW5lLmpzXCI7XHJcbmltcG9ydCB7IFZlY3RvcjJDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9WZWN0b3IyLmpzXCI7XHJcbmltcG9ydCB7IE1vdXNlQWRhcHRlckNsYXNzLCBNb3VzZUxpc3RlbmVySW50ZXJmYWNlIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL01vdXNlTGlzdGVuZXIuanNcIjtcclxuaW1wb3J0IHsgV2ViU29ja2V0Q2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvbmV0d29yay9XZWJTb2NrZXQuanNcIjtcclxuaW1wb3J0IHsgV2ViU29ja2V0Q2xpZW50Q2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvbmV0d29yay9XZWJTb2NrZXRDbGllbnQuanNcIjtcclxuaW1wb3J0IHsgUHJvY2Vzc2luZ0NsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1Byb2Nlc3NpbmcuanNcIjtcclxuaW1wb3J0IHsgVHVydGxlQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvVHVydGxlLmpzXCI7XHJcbmltcG9ydCB7IEdOR1plaWNoZW5mZW5zdGVyQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ25nL0dOR1plaWNoZW5mZW5zdGVyLmpzXCI7XHJcbmltcG9ydCB7IEdOR1JlY2h0ZWNrQ2xhc3MgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ25nL0dOR1JlY2h0ZWNrLmpzXCI7XHJcbmltcG9ydCB7IEdOR0Jhc2VGaWd1ckNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2duZy9HTkdCYXNlRmlndXIuanNcIjtcclxuaW1wb3J0IHsgR05HQWt0aW9uc2VtcGZhZW5nZXJJbnRlcmZhY2UgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ25nL0dOR0FrdGlvbnNlbXBmYWVuZ2VyLmpzXCI7XHJcbmltcG9ydCB7IEdOR0RyZWllY2tDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9nbmcvR05HRHJlaWVjay5qc1wiO1xyXG5pbXBvcnQgeyBHTkdLcmVpc0NsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2duZy9HTkdLcmVpcy5qc1wiO1xyXG5pbXBvcnQgeyBHTkdUdXJ0bGVDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9nbmcvR05HVHVydGxlLmpzXCI7XHJcbmltcG9ydCB7IEdOR1RleHRDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9nbmcvR05HVGV4dC5qc1wiO1xyXG5pbXBvcnQgeyBHTkdFcmVpZ25pc2JlaGFuZGx1bmcgfSBmcm9tIFwiLi4vLi4vcnVudGltZWxpYnJhcnkvZ25nL0dOR0VyZWlnbmlzYmVoYW5kbHVuZy5qc1wiO1xyXG5pbXBvcnQgeyBHTkdGaWd1ckNsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L2duZy9HTkdGaWd1ci5qc1wiO1xyXG5cclxuZXhwb3J0IHR5cGUgRmlsZSA9IHtcclxuICAgIG5hbWU6IHN0cmluZyxcclxuICAgIGlkPzogbnVtYmVyLFxyXG4gICAgdGV4dDogc3RyaW5nLFxyXG5cclxuICAgIHRleHRfYmVmb3JlX3JldmlzaW9uOiBzdHJpbmcsXHJcbiAgICBzdWJtaXR0ZWRfZGF0ZTogc3RyaW5nLFxyXG4gICAgc3R1ZGVudF9lZGl0ZWRfYWZ0ZXJfcmV2aXNpb246IGJvb2xlYW4sXHJcblxyXG4gICAgaXNfY29weV9vZl9pZD86IG51bWJlcixcclxuICAgIHJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uPzogbnVtYmVyLFxyXG4gICAgaWRlbnRpY2FsX3RvX3JlcG9zaXRvcnlfdmVyc2lvbjogYm9vbGVhbixcclxuXHJcbiAgICBkaXJ0eTogYm9vbGVhbixcclxuICAgIHNhdmVkOiBib29sZWFuLFxyXG4gICAgdmVyc2lvbjogbnVtYmVyLFxyXG4gICAgcGFuZWxFbGVtZW50PzogQWNjb3JkaW9uRWxlbWVudFxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBJZGVudGlmaWVyUG9zaXRpb24gPSB7XHJcbiAgICBwb3NpdGlvbjogVGV4dFBvc2l0aW9uLFxyXG4gICAgZWxlbWVudDogVHlwZSB8IE1ldGhvZCB8IEF0dHJpYnV0ZSB8IFZhcmlhYmxlO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBNZXRob2RDYWxsUG9zaXRpb24gPSB7XHJcbiAgICBpZGVudGlmaWVyUG9zaXRpb246IFRleHRQb3NpdGlvbixcclxuICAgIHBvc3NpYmxlTWV0aG9kczogTWV0aG9kW10gfCBzdHJpbmcsIC8vIHN0cmluZyBmb3IgcHJpbnQsIHByaW50bG4sIC4uLlxyXG4gICAgY29tbWFQb3NpdGlvbnM6IFRleHRQb3NpdGlvbltdLFxyXG4gICAgcmlnaHRCcmFja2V0UG9zaXRpb246IFRleHRQb3NpdGlvblxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTW9kdWxlIHtcclxuICAgIGZpbGU6IEZpbGU7XHJcbiAgICBzdGF0aWMgbWF4VXJpTnVtYmVyOiBudW1iZXIgPSAwO1xyXG4gICAgdXJpOiBtb25hY28uVXJpO1xyXG4gICAgbW9kZWw6IG1vbmFjby5lZGl0b3IuSVRleHRNb2RlbDtcclxuICAgIG9sZEVycm9yRGVjb3JhdGlvbnM6IHN0cmluZ1tdID0gW107XHJcbiAgICBsYXN0U2F2ZWRWZXJzaW9uSWQ6IG51bWJlcjtcclxuICAgIGVkaXRvclN0YXRlOiBtb25hY28uZWRpdG9yLklDb2RlRWRpdG9yVmlld1N0YXRlO1xyXG5cclxuICAgIGlzU3lzdGVtTW9kdWxlOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgYnJlYWtwb2ludHM6IEJyZWFrcG9pbnRbXSA9IFtdO1xyXG4gICAgYnJlYWtwb2ludERlY29yYXRvcnM6IHN0cmluZ1tdID0gW107XHJcbiAgICBkZWNvcmF0b3JJZFRvQnJlYWtwb2ludE1hcDogeyBbaWQ6IHN0cmluZ106IEJyZWFrcG9pbnQgfSA9IHt9O1xyXG5cclxuICAgIGVycm9yczogRXJyb3JbXVtdID0gW1tdLCBbXSwgW10sIFtdXTsgLy8gMXN0IHBhc3MsIDJuZCBwYXNzLCAzcmQgcGFzc1xyXG5cclxuICAgIC8vIDFzdCBwYXNzOiBMZXhlclxyXG4gICAgdG9rZW5MaXN0OiBUb2tlbltdO1xyXG5cclxuICAgIC8vIDJuZCBwYXNzOiBBU1RQYXJzZXJcclxuICAgIG1haW5Qcm9ncmFtQXN0OiBBU1ROb2RlW107XHJcbiAgICBjbGFzc0RlZmluaXRpb25zQVNUOiBBU1ROb2RlW107XHJcbiAgICB0eXBlTm9kZXM6IFR5cGVOb2RlW107XHJcblxyXG4gICAgLy8gM3JkIHBhc3M6IFR5cGVSZXNvbHZlciBmaWxsIGluIHJlc29sdmVkVHlwZSBpbiB0eXBlTm9kZXMgYW5kIHBvcHVsYXRlIHR5cGVTdG9yZVxyXG4gICAgdHlwZVN0b3JlOiBUeXBlU3RvcmU7XHJcblxyXG4gICAgLy8gNHRoIHBhc3M6IGdlbmVyYXRlIGNvZGUgYW5kIHN5bWJvbCB0YWJsZXNcclxuXHJcbiAgICAvKlxyXG4gICAgVGhlIG1haW5Qcm9ncmFtQVNUIGhvbGRzIHN0YXRlbWVudHMgdG86XHJcbiAgICAxLiBjYWxsIHN0YXRpYyBjb25zdHJ1Y3RvciBvZiBlYWNoIHVzZWQgY2xhc3NcclxuICAgIDIuIGV4ZWN1dGUgbWFpbiBQcm9ncmFtXHJcbiAgICAqL1xyXG5cclxuICAgIG1haW5Qcm9ncmFtPzogUHJvZ3JhbTtcclxuICAgIG1haW5Qcm9ncmFtRW5kOiBUZXh0UG9zaXRpb247XHJcbiAgICBtYWluU3ltYm9sVGFibGU6IFN5bWJvbFRhYmxlO1xyXG5cclxuICAgIGlkZW50aWZpZXJQb3NpdGlvbnM6IHsgW2xpbmU6IG51bWJlcl06IElkZW50aWZpZXJQb3NpdGlvbltdIH0gPSB7fTtcclxuICAgIG1ldGhvZENhbGxQb3NpdGlvbnM6IHsgW2xpbmU6IG51bWJlcl06IE1ldGhvZENhbGxQb3NpdGlvbltdIH0gPSB7fTtcclxuXHJcbiAgICBkZXBlbmRzT25Nb2R1bGVzOiBNYXA8TW9kdWxlLCBib29sZWFuPjtcclxuICAgIGlzU3RhcnRhYmxlOiBib29sZWFuO1xyXG4gICAgZGVwZW5kc09uTW9kdWxlc1dpdGhFcnJvcnM6IGJvb2xlYW47XHJcblxyXG4gICAgc3RhdGljIHVyaU1hcDogeyBbbmFtZTogc3RyaW5nXTogbnVtYmVyIH0gPSB7fTtcclxuICAgIGJyYWNrZXRFcnJvcjogc3RyaW5nO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGZpbGU6IEZpbGUsIHB1YmxpYyBtYWluOiBNYWluQmFzZSkge1xyXG4gICAgICAgIGlmIChmaWxlID09IG51bGwgfHwgdGhpcy5tYWluID09IG51bGwpIHJldHVybjsgLy8gdXNlZCBieSBBZGhvY0NvbXBpbGVyIGFuZCBBcGlEb2NcclxuXHJcbiAgICAgICAgdGhpcy5maWxlID0gZmlsZTtcclxuICAgICAgICAvLyB0aGlzLnVyaSA9IG1vbmFjby5VcmkuZnJvbSh7IHBhdGg6ICcvZmlsZScgKyAoTW9kdWxlLm1heFVyaU51bWJlcisrKSArICcubGVhcm5KYXZhJywgc2NoZW1lOiAnZmlsZScgfSk7XHJcbiAgICAgICAgbGV0IHBhdGggPSBmaWxlLm5hbWU7XHJcblxyXG4gICAgICAgIGxldCB1cmlDb3VudGVyID0gTW9kdWxlLnVyaU1hcFtwYXRoXTtcclxuICAgICAgICBpZiAodXJpQ291bnRlciA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHVyaUNvdW50ZXIgPSAwO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHVyaUNvdW50ZXIrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgTW9kdWxlLnVyaU1hcFtwYXRoXSA9IHVyaUNvdW50ZXI7XHJcblxyXG4gICAgICAgIGlmICh1cmlDb3VudGVyID4gMCkgcGF0aCArPSBcIiAoXCIgKyB1cmlDb3VudGVyICsgXCIpXCI7XHJcbiAgICAgICAgdGhpcy51cmkgPSBtb25hY28uVXJpLmZyb20oeyBwYXRoOiBwYXRoLCBzY2hlbWU6ICdpbm1lbW9yeScgfSk7XHJcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vbmFjby5lZGl0b3IuY3JlYXRlTW9kZWwoZmlsZS50ZXh0LCBcIm15SmF2YVwiLCB0aGlzLnVyaSk7XHJcbiAgICAgICAgdGhpcy5tb2RlbC51cGRhdGVPcHRpb25zKHsgdGFiU2l6ZTogMyB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXN0U2F2ZWRWZXJzaW9uSWQgPSB0aGlzLm1vZGVsLmdldEFsdGVybmF0aXZlVmVyc2lvbklkKCk7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5tb2RlbC5vbkRpZENoYW5nZUNvbnRlbnQoKCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgdmVyc2lvbklkID0gdGhhdC5tb2RlbC5nZXRBbHRlcm5hdGl2ZVZlcnNpb25JZCgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZlcnNpb25JZCAhPSB0aGF0Lmxhc3RTYXZlZFZlcnNpb25JZCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5maWxlLmRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRoYXQuZmlsZS5zYXZlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5maWxlLmlkZW50aWNhbF90b19yZXBvc2l0b3J5X3ZlcnNpb24gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHRoYXQubGFzdFNhdmVkVmVyc2lvbklkID0gdmVyc2lvbklkO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZighdGhhdC5tYWluLmlzRW1iZWRkZWQoKSl7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWFpbjE6IE1haW4gPSA8TWFpbj5tYWluO1xyXG4gICAgICAgICAgICAgICAgaWYobWFpbjEud29ya3NwYWNlc093bmVySWQgIT0gbWFpbjEudXNlci5pZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYodGhhdC5maWxlLnRleHRfYmVmb3JlX3JldmlzaW9uID09IG51bGwgfHwgdGhhdC5maWxlLnN0dWRlbnRfZWRpdGVkX2FmdGVyX3JldmlzaW9uKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5maWxlLnN0dWRlbnRfZWRpdGVkX2FmdGVyX3JldmlzaW9uID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZmlsZS50ZXh0X2JlZm9yZV9yZXZpc2lvbiA9IHRoYXQuZmlsZS50ZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmZpbGUuc2F2ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFpbjEubmV0d29ya01hbmFnZXIuc2VuZFVwZGF0ZXMobnVsbCwgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYWluMS5ib3R0b21EaXYuaG9tZXdvcmtNYW5hZ2VyLnNob3dIb21lV29ya1JldmlzaW9uQnV0dG9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW4xLnByb2plY3RFeHBsb3Jlci5yZW5kZXJIb21ld29ya0J1dHRvbih0aGF0LmZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5maWxlLnN0dWRlbnRfZWRpdGVkX2FmdGVyX3JldmlzaW9uID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXRNZXRob2REZWNsYXJhdGlvbkF0UG9zaXRpb24ocG9zaXRpb246IHsgbGluZU51bWJlcjogbnVtYmVyOyBjb2x1bW46IG51bWJlcjsgfSk6IE1ldGhvZERlY2xhcmF0aW9uTm9kZSB7XHJcblxyXG4gICAgICAgIGlmKHRoaXMuY2xhc3NEZWZpbml0aW9uc0FTVCA9PSBudWxsKSByZXR1cm4gbnVsbDtcclxuICAgICAgICBcclxuICAgICAgICBmb3IobGV0IGNkIG9mIHRoaXMuY2xhc3NEZWZpbml0aW9uc0FTVCl7XHJcbiAgICAgICAgICAgIGlmKGNkLnR5cGUgPT0gVG9rZW5UeXBlLmtleXdvcmRDbGFzcyB8fCBjZC50eXBlID09IFRva2VuVHlwZS5rZXl3b3JkRW51bSl7XHJcbiAgICAgICAgICAgICAgICBmb3IobGV0IG1ldGhvZEFTVCBvZiBjZC5tZXRob2RzKXtcclxuICAgICAgICAgICAgICAgICAgICBpZihtZXRob2RBU1QucG9zaXRpb24gIT0gbnVsbCAmJiBtZXRob2RBU1Quc2NvcGVUbyAhPSBudWxsKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYobWV0aG9kQVNULnBvc2l0aW9uLmxpbmUgPD0gcG9zaXRpb24ubGluZU51bWJlciAmJiBtZXRob2RBU1Quc2NvcGVUby5saW5lID49IHBvc2l0aW9uLmxpbmVOdW1iZXIpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1ldGhvZEFTVDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIFxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBzdGF0aWMgcmVzdG9yZUZyb21EYXRhKGY6IEZpbGVEYXRhLCBtYWluOiBNYWluQmFzZSk6IE1vZHVsZSB7XHJcblxyXG4gICAgICAgIGxldCBmMTogRmlsZSA9IHtcclxuICAgICAgICAgICAgbmFtZTogZi5uYW1lLFxyXG4gICAgICAgICAgICB0ZXh0OiBmLnRleHQsXHJcbiAgICAgICAgICAgIHRleHRfYmVmb3JlX3JldmlzaW9uOiBmLnRleHRfYmVmb3JlX3JldmlzaW9uLFxyXG4gICAgICAgICAgICBzdWJtaXR0ZWRfZGF0ZTogZi5zdWJtaXR0ZWRfZGF0ZSxcclxuICAgICAgICAgICAgc3R1ZGVudF9lZGl0ZWRfYWZ0ZXJfcmV2aXNpb246IGZhbHNlLFxyXG4gICAgICAgICAgICBkaXJ0eTogdHJ1ZSxcclxuICAgICAgICAgICAgc2F2ZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIHZlcnNpb246IGYudmVyc2lvbixcclxuICAgICAgICAgICAgaWQ6IGYuaWQsXHJcbiAgICAgICAgICAgIGlzX2NvcHlfb2ZfaWQ6IGYuaXNfY29weV9vZl9pZCxcclxuICAgICAgICAgICAgcmVwb3NpdG9yeV9maWxlX3ZlcnNpb246IGYucmVwb3NpdG9yeV9maWxlX3ZlcnNpb24sXHJcbiAgICAgICAgICAgIGlkZW50aWNhbF90b19yZXBvc2l0b3J5X3ZlcnNpb246IGYuaWRlbnRpY2FsX3RvX3JlcG9zaXRvcnlfdmVyc2lvblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IG06IE1vZHVsZSA9IG5ldyBNb2R1bGUoZjEsIG1haW4pO1xyXG5cclxuICAgICAgICByZXR1cm4gbTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RmlsZURhdGEod29ya3NwYWNlOiBXb3Jrc3BhY2UpOiBGaWxlRGF0YSB7XHJcbiAgICAgICAgbGV0IGZpbGUgPSB0aGlzLmZpbGU7XHJcbiAgICAgICAgbGV0IGZkOiBGaWxlRGF0YSA9IHtcclxuICAgICAgICAgICAgaWQ6IGZpbGUuaWQsXHJcbiAgICAgICAgICAgIG5hbWU6IGZpbGUubmFtZSxcclxuICAgICAgICAgICAgdGV4dDogZmlsZS50ZXh0LFxyXG4gICAgICAgICAgICB0ZXh0X2JlZm9yZV9yZXZpc2lvbjogZmlsZS50ZXh0X2JlZm9yZV9yZXZpc2lvbixcclxuICAgICAgICAgICAgc3VibWl0dGVkX2RhdGU6IGZpbGUuc3VibWl0dGVkX2RhdGUsXHJcbiAgICAgICAgICAgIHN0dWRlbnRfZWRpdGVkX2FmdGVyX3JldmlzaW9uOiBmaWxlLnN0dWRlbnRfZWRpdGVkX2FmdGVyX3JldmlzaW9uLFxyXG4gICAgICAgICAgICB2ZXJzaW9uOiBmaWxlLnZlcnNpb24sXHJcbiAgICAgICAgICAgIGlzX2NvcHlfb2ZfaWQ6IGZpbGUuaXNfY29weV9vZl9pZCxcclxuICAgICAgICAgICAgcmVwb3NpdG9yeV9maWxlX3ZlcnNpb246IGZpbGUucmVwb3NpdG9yeV9maWxlX3ZlcnNpb24sXHJcbiAgICAgICAgICAgIGlkZW50aWNhbF90b19yZXBvc2l0b3J5X3ZlcnNpb246IGZpbGUuaWRlbnRpY2FsX3RvX3JlcG9zaXRvcnlfdmVyc2lvbixcclxuICAgICAgICAgICAgd29ya3NwYWNlX2lkOiB3b3Jrc3BhY2UuaWQsXHJcbiAgICAgICAgICAgIGZvcmNlVXBkYXRlOiBmYWxzZSxcclxuICAgICAgICAgICAgZmlsZV90eXBlOiAwXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVzaE1ldGhvZENhbGxQb3NpdGlvbihpZGVudGlmaWVyUG9zaXRpb246IFRleHRQb3NpdGlvbiwgY29tbWFQb3NpdGlvbnM6IFRleHRQb3NpdGlvbltdLFxyXG4gICAgICAgIHBvc3NpYmxlTWV0aG9kczogTWV0aG9kW10gfCBzdHJpbmcsIHJpZ2h0QnJhY2tldFBvc2l0aW9uOiBUZXh0UG9zaXRpb24pIHtcclxuXHJcbiAgICAgICAgbGV0IGxpbmVzOiBudW1iZXJbXSA9IFtdO1xyXG4gICAgICAgIGxpbmVzLnB1c2goaWRlbnRpZmllclBvc2l0aW9uLmxpbmUpO1xyXG4gICAgICAgIGZvciAobGV0IGNwIG9mIGNvbW1hUG9zaXRpb25zKSB7XHJcbiAgICAgICAgICAgIGlmIChsaW5lcy5pbmRleE9mW2NwLmxpbmVdIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgbGluZXMucHVzaChjcC5saW5lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IG1jcDogTWV0aG9kQ2FsbFBvc2l0aW9uID0ge1xyXG4gICAgICAgICAgICBpZGVudGlmaWVyUG9zaXRpb246IGlkZW50aWZpZXJQb3NpdGlvbixcclxuICAgICAgICAgICAgY29tbWFQb3NpdGlvbnM6IGNvbW1hUG9zaXRpb25zLFxyXG4gICAgICAgICAgICBwb3NzaWJsZU1ldGhvZHM6IHBvc3NpYmxlTWV0aG9kcyxcclxuICAgICAgICAgICAgcmlnaHRCcmFja2V0UG9zaXRpb246IHJpZ2h0QnJhY2tldFBvc2l0aW9uXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbGluZSBvZiBsaW5lcykge1xyXG4gICAgICAgICAgICBsZXQgbWNwTGlzdCA9IHRoaXMubWV0aG9kQ2FsbFBvc2l0aW9uc1tsaW5lXTtcclxuICAgICAgICAgICAgaWYgKG1jcExpc3QgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tZXRob2RDYWxsUG9zaXRpb25zW2xpbmVdID0gW107XHJcbiAgICAgICAgICAgICAgICBtY3BMaXN0ID0gdGhpcy5tZXRob2RDYWxsUG9zaXRpb25zW2xpbmVdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG1jcExpc3QucHVzaChtY3ApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIHRvZ2dsZUJyZWFrcG9pbnQobGluZU51bWJlcjogbnVtYmVyLCByZXJlbmRlcjogYm9vbGVhbikge1xyXG4gICAgICAgIHRoaXMuZ2V0QnJlYWtwb2ludFBvc2l0aW9uc0Zyb21FZGl0b3IoKTtcclxuICAgICAgICBpZiAodGhpcy5nZXRCcmVha3BvaW50KGxpbmVOdW1iZXIsIHRydWUpID09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRCcmVha3BvaW50KGxpbmVOdW1iZXIsIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVyZW5kZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJCcmVha3BvaW50RGVjb3JhdG9ycygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRCcmVha3BvaW50KGxpbmU6IG51bWJlciwgcmVtb3ZlOiBib29sZWFuID0gZmFsc2UpOiBCcmVha3BvaW50IHtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmJyZWFrcG9pbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBiID0gdGhpcy5icmVha3BvaW50c1tpXTtcclxuICAgICAgICAgICAgaWYgKGIubGluZSA9PSBsaW5lKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJyZWFrcG9pbnRzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGlmIChiLnN0YXRlbWVudCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYi5zdGF0ZW1lbnQuYnJlYWtwb2ludCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2V0QnJlYWtwb2ludChsaW5lOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyKTogQnJlYWtwb2ludCB7XHJcblxyXG4gICAgICAgIGxldCBicmVha3BvaW50OiBCcmVha3BvaW50ID0ge1xyXG4gICAgICAgICAgICBsaW5lOiBsaW5lLFxyXG4gICAgICAgICAgICBjb2x1bW46IGNvbHVtbixcclxuICAgICAgICAgICAgc3RhdGVtZW50OiBudWxsXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmF0dGFjaFRvU3RhdGVtZW50KGJyZWFrcG9pbnQpO1xyXG4gICAgICAgIHRoaXMuYnJlYWtwb2ludHMucHVzaChicmVha3BvaW50KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGJyZWFrcG9pbnQ7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGF0dGFjaFRvU3RhdGVtZW50KGJyZWFrcG9pbnQ6IEJyZWFrcG9pbnQsIHByb2dyYW1MaXN0PzogUHJvZ3JhbVtdKSB7XHJcblxyXG4gICAgICAgIGlmIChicmVha3BvaW50LnN0YXRlbWVudCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGJyZWFrcG9pbnQuc3RhdGVtZW50LmJyZWFrcG9pbnQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocHJvZ3JhbUxpc3QgPT0gbnVsbCkgcHJvZ3JhbUxpc3QgPSB0aGlzLmdldFByb2dyYW1zKCk7XHJcblxyXG4gICAgICAgIGxldCBuZWFyZXN0U3RhdGVtZW50OiBTdGF0ZW1lbnQgPSBudWxsO1xyXG4gICAgICAgIGxldCBuZWFyZXN0RGlzdGFuY2U6IG51bWJlciA9IDEwMDAwMDtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgcHJvZ3JhbSBvZiBwcm9ncmFtTGlzdCkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBzdGF0ZW1lbnQgb2YgcHJvZ3JhbS5zdGF0ZW1lbnRzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGxpbmUgPSBzdGF0ZW1lbnQ/LnBvc2l0aW9uPy5saW5lO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxpbmUgIT0gbnVsbCAmJiBsaW5lID49IGJyZWFrcG9pbnQubGluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsaW5lIC0gYnJlYWtwb2ludC5saW5lIDwgbmVhcmVzdERpc3RhbmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5lYXJlc3RTdGF0ZW1lbnQgPSBzdGF0ZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5lYXJlc3REaXN0YW5jZSA9IGxpbmUgLSBicmVha3BvaW50LmxpbmU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBicmVha3BvaW50LnN0YXRlbWVudCA9IG5lYXJlc3RTdGF0ZW1lbnQ7XHJcbiAgICAgICAgaWYgKG5lYXJlc3RTdGF0ZW1lbnQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBuZWFyZXN0U3RhdGVtZW50LmJyZWFrcG9pbnQgPSBicmVha3BvaW50O1xyXG4gICAgICAgICAgICAvLyBsZXQgcHAgPSBuZXcgUHJvZ3JhbVByaW50ZXIoKTtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJBdHRhY2hlZCBCcmVha3BvaW50IGxpbmUgXCIgKyBicmVha3BvaW50LmxpbmUgKyBcIiwgY29sdW1uIFwiICsgXHJcbiAgICAgICAgICAgIC8vICAgICBicmVha3BvaW50LmNvbHVtbiArIFwiIHRvIHN0YXRlbWVudCBcIiArIHBwLnByaW50KFtuZWFyZXN0U3RhdGVtZW50XSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBnZXRQcm9ncmFtcygpOiBQcm9ncmFtW10ge1xyXG4gICAgICAgIGxldCBwcm9ncmFtTGlzdDogUHJvZ3JhbVtdID0gW107XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm1haW5Qcm9ncmFtICE9IG51bGwpIHtcclxuICAgICAgICAgICAgcHJvZ3JhbUxpc3QucHVzaCh0aGlzLm1haW5Qcm9ncmFtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnR5cGVTdG9yZSAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCB0eXBlIG9mIHRoaXMudHlwZVN0b3JlLnR5cGVMaXN0KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIEtsYXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUuYXR0cmlidXRlSW5pdGlhbGl6YXRpb25Qcm9ncmFtICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3JhbUxpc3QucHVzaCh0eXBlLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG1ldGhvZCBvZiB0eXBlLm1ldGhvZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1ldGhvZC5wcm9ncmFtICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyYW1MaXN0LnB1c2gobWV0aG9kLnByb2dyYW0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlLnN0YXRpY0NsYXNzLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyYW1MaXN0LnB1c2godHlwZS5zdGF0aWNDbGFzcy5hdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBtZXRob2Qgb2YgdHlwZS5zdGF0aWNDbGFzcy5tZXRob2RzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtZXRob2QucHJvZ3JhbSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmFtTGlzdC5wdXNoKG1ldGhvZC5wcm9ncmFtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9ncmFtTGlzdDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyQnJlYWtwb2ludERlY29yYXRvcnMoKSB7XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0QnJlYWtwb2ludFBvc2l0aW9uc0Zyb21FZGl0b3IoKTtcclxuXHJcbiAgICAgICAgbGV0IGRlY29yYXRpb25zOiBtb25hY28uZWRpdG9yLklNb2RlbERlbHRhRGVjb3JhdGlvbltdID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IGJyZWFrcG9pbnQgb2YgdGhpcy5icmVha3BvaW50cykge1xyXG4gICAgICAgICAgICBkZWNvcmF0aW9ucy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHJhbmdlOiB7IHN0YXJ0TGluZU51bWJlcjogYnJlYWtwb2ludC5saW5lLCBlbmRMaW5lTnVtYmVyOiBicmVha3BvaW50LmxpbmUsIHN0YXJ0Q29sdW1uOiAxLCBlbmRDb2x1bW46IDEgfSxcclxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBpc1dob2xlTGluZTogdHJ1ZSwgY2xhc3NOYW1lOiBcImpvX2RlY29yYXRlX2JyZWFrcG9pbnRcIixcclxuICAgICAgICAgICAgICAgICAgICBvdmVydmlld1J1bGVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBcIiM1ODAwMDBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG1vbmFjby5lZGl0b3IuT3ZlcnZpZXdSdWxlckxhbmUuTGVmdFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgbWluaW1hcDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogXCIjNTgwMDAwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBtb25hY28uZWRpdG9yLk1pbmltYXBQb3NpdGlvbi5JbmxpbmVcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG1hcmdpbkNsYXNzTmFtZTogXCJqb19tYXJnaW5fYnJlYWtwb2ludFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0aWNraW5lc3M6IG1vbmFjby5lZGl0b3IuVHJhY2tlZFJhbmdlU3RpY2tpbmVzcy5OZXZlckdyb3dzV2hlblR5cGluZ0F0RWRnZXNcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgIGJyZWFrcG9pbnQ6IGJyZWFrcG9pbnRcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmJyZWFrcG9pbnREZWNvcmF0b3JzID0gdGhpcy5tYWluLmdldE1vbmFjb0VkaXRvcigpLmRlbHRhRGVjb3JhdGlvbnModGhpcy5icmVha3BvaW50RGVjb3JhdG9ycywgZGVjb3JhdGlvbnMpO1xyXG5cclxuICAgICAgICB0aGlzLmRlY29yYXRvcklkVG9CcmVha3BvaW50TWFwID0ge307XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmJyZWFrcG9pbnREZWNvcmF0b3JzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGVjb3JhdG9ySWRUb0JyZWFrcG9pbnRNYXBbdGhpcy5icmVha3BvaW50RGVjb3JhdG9yc1tpXV0gPSB0aGlzLmJyZWFrcG9pbnRzW2ldO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QnJlYWtwb2ludFBvc2l0aW9uc0Zyb21FZGl0b3IoKSB7XHJcbiAgICAgICAgZm9yIChsZXQgZGVjb3JhdGlvbiBvZiB0aGlzLm1haW4uZ2V0TW9uYWNvRWRpdG9yKCkuZ2V0TW9kZWwoKS5nZXRBbGxEZWNvcmF0aW9ucygpKSB7XHJcbiAgICAgICAgICAgIGlmIChkZWNvcmF0aW9uLm9wdGlvbnMubWFyZ2luQ2xhc3NOYW1lID09IFwibWFyZ2luX2JyZWFrcG9pbnRcIikge1xyXG4gICAgICAgICAgICAgICAgbGV0IGJyZWFrcG9pbnQgPSB0aGlzLmRlY29yYXRvcklkVG9CcmVha3BvaW50TWFwW2RlY29yYXRpb24uaWRdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGJyZWFrcG9pbnQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrcG9pbnQubGluZSA9IGRlY29yYXRpb24ucmFuZ2Uuc3RhcnRMaW5lTnVtYmVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZpbmRTeW1ib2xUYWJsZUF0UG9zaXRpb24obGluZTogbnVtYmVyLCBjb2x1bW46IG51bWJlcikge1xyXG4gICAgICAgIGlmICh0aGlzLm1haW5TeW1ib2xUYWJsZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGxpbmUgPiB0aGlzLm1haW5TeW1ib2xUYWJsZS5wb3NpdGlvblRvLmxpbmUgfHxcclxuICAgICAgICAgICAgbGluZSA9PSB0aGlzLm1haW5TeW1ib2xUYWJsZS5wb3NpdGlvblRvLmxpbmUgJiYgY29sdW1uID4gdGhpcy5tYWluU3ltYm9sVGFibGUucG9zaXRpb25Uby5jb2x1bW5cclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgbGluZSA9IHRoaXMubWFpblN5bWJvbFRhYmxlLnBvc2l0aW9uVG8ubGluZTtcclxuICAgICAgICAgICAgY29sdW1uID0gdGhpcy5tYWluU3ltYm9sVGFibGUucG9zaXRpb25Uby5jb2x1bW4gLSAxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFpblN5bWJvbFRhYmxlLmZpbmRUYWJsZUF0UG9zaXRpb24obGluZSwgY29sdW1uKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRFcnJvckNvdW50KCk6IG51bWJlciB7XHJcblxyXG4gICAgICAgIGxldCBlYyA9IDA7XHJcbiAgICAgICAgZm9yIChsZXQgZWwgb2YgdGhpcy5lcnJvcnMpIHtcclxuICAgICAgICAgICAgZWwuZm9yRWFjaChlcnJvciA9PiBlYyArPSBlcnJvci5sZXZlbCA9PSBcImVycm9yXCIgPyAxIDogMCk7XHJcbiAgICAgICAgICAgIC8vIGVjICs9IGVsLmxlbmd0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlYztcclxuICAgIH1cclxuXHJcbiAgICBoYXNNYWluUHJvZ3JhbSgpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMubWFpblByb2dyYW0gPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGlmICh0aGlzLm1haW5Qcm9ncmFtLnN0YXRlbWVudHMgPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1haW5Qcm9ncmFtLnN0YXRlbWVudHMubGVuZ3RoID4gMiB8fCB0aGlzLm1haW5Qcm9ncmFtLnN0YXRlbWVudHMubGVuZ3RoID09IDIgJiYgdGhpcy5tYWluUHJvZ3JhbS5zdGF0ZW1lbnRzWzBdLnR5cGUgPT0gVG9rZW5UeXBlLmNhbGxNYWluTWV0aG9kO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXRQcm9ncmFtVGV4dEZyb21Nb25hY29Nb2RlbCgpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLmdldFZhbHVlKG1vbmFjby5lZGl0b3IuRW5kT2ZMaW5lUHJlZmVyZW5jZS5MRiwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBhZGRJZGVudGlmaWVyUG9zaXRpb24ocG9zaXRpb246IFRleHRQb3NpdGlvbiwgZWxlbWVudDogVHlwZSB8IE1ldGhvZCB8IEF0dHJpYnV0ZSB8IFZhcmlhYmxlKSB7XHJcbiAgICAgICAgbGV0IHBvc2l0aW9uTGlzdDogSWRlbnRpZmllclBvc2l0aW9uW10gPSB0aGlzLmlkZW50aWZpZXJQb3NpdGlvbnNbcG9zaXRpb24ubGluZV07XHJcbiAgICAgICAgaWYgKHBvc2l0aW9uTGlzdCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uTGlzdCA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLmlkZW50aWZpZXJQb3NpdGlvbnNbcG9zaXRpb24ubGluZV0gPSBwb3NpdGlvbkxpc3Q7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHBvc2l0aW9uTGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICBlbGVtZW50OiBlbGVtZW50XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGdldFR5cGVBdFBvc2l0aW9uKGxpbmU6IG51bWJlciwgY29sdW1uOiBudW1iZXIpOiB7IHR5cGU6IFR5cGUsIGlzU3RhdGljOiBib29sZWFuIH0ge1xyXG5cclxuICAgICAgICBsZXQgcG9zaXRpb25zT25MaW5lID0gdGhpcy5pZGVudGlmaWVyUG9zaXRpb25zW2xpbmVdO1xyXG4gICAgICAgIGlmIChwb3NpdGlvbnNPbkxpbmUgPT0gbnVsbCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIGxldCBmb3VuZFBvc2l0aW9uOiBJZGVudGlmaWVyUG9zaXRpb24gPSBudWxsO1xyXG4gICAgICAgIGZvciAobGV0IHAgb2YgcG9zaXRpb25zT25MaW5lKSB7XHJcbiAgICAgICAgICAgIGlmIChjb2x1bW4gPj0gcC5wb3NpdGlvbi5jb2x1bW4gJiYgY29sdW1uIDw9IHAucG9zaXRpb24uY29sdW1uICsgcC5wb3NpdGlvbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGZvdW5kUG9zaXRpb24gPSBwO1xyXG4gICAgICAgICAgICAgICAgbGV0IGVsZW1lbnQgPSBmb3VuZFBvc2l0aW9uLmVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIE1ldGhvZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IGVsZW1lbnQsIGlzU3RhdGljOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gQXR0cmlidXRlLCBWYXJpYWJsZVxyXG4gICAgICAgICAgICAgICAgbGV0IHR5cGU6IFR5cGUgPSAoZWxlbWVudCBpbnN0YW5jZW9mIFR5cGUpID8gZWxlbWVudCA6IGVsZW1lbnQudHlwZTtcclxuICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kUG9zaXRpb24ucG9zaXRpb24ubGVuZ3RoID4gMCAmJiBlbGVtZW50LnR5cGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IDxUeXBlPnR5cGUsIGlzU3RhdGljOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHR5cGUsIGlzU3RhdGljOiBmb3VuZFBvc2l0aW9uLnBvc2l0aW9uLmxlbmd0aCA+IDAgfTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEVsZW1lbnRBdFBvc2l0aW9uKGxpbmU6IG51bWJlciwgY29sdW1uOiBudW1iZXIpOiBLbGFzcyB8IEludGVyZmFjZSB8IE1ldGhvZCB8IEF0dHJpYnV0ZSB8IFZhcmlhYmxlIHtcclxuXHJcbiAgICAgICAgbGV0IHBvc2l0aW9uc09uTGluZSA9IHRoaXMuaWRlbnRpZmllclBvc2l0aW9uc1tsaW5lXTtcclxuICAgICAgICBpZiAocG9zaXRpb25zT25MaW5lID09IG51bGwpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBsZXQgYmVzdEZvdW5kUG9zaXRpb246IElkZW50aWZpZXJQb3NpdGlvbiA9IG51bGw7XHJcbiAgICAgICAgZm9yIChsZXQgcCBvZiBwb3NpdGlvbnNPbkxpbmUpIHtcclxuICAgICAgICAgICAgaWYgKGNvbHVtbiA+PSBwLnBvc2l0aW9uLmNvbHVtbiAmJiBjb2x1bW4gPCBwLnBvc2l0aW9uLmNvbHVtbiArIHAucG9zaXRpb24ubGVuZ3RoKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHAucG9zaXRpb24ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiZXN0Rm91bmRQb3NpdGlvbiA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RGb3VuZFBvc2l0aW9uID0gcDtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihwLmVsZW1lbnQgaW5zdGFuY2VvZiBNZXRob2QgJiYgYmVzdEZvdW5kUG9zaXRpb24uZWxlbWVudCBpbnN0YW5jZW9mIEtsYXNzKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlc3RGb3VuZFBvc2l0aW9uID0gcDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGJlc3RGb3VuZFBvc2l0aW9uID09IG51bGwgPyBudWxsIDogPGFueT5iZXN0Rm91bmRQb3NpdGlvbi5lbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIGNvcHkoKTogTW9kdWxlIHtcclxuICAgICAgICBsZXQgbSA9IG5ldyBNb2R1bGUodGhpcy5maWxlLCB0aGlzLm1haW4pO1xyXG4gICAgICAgIG0ubW9kZWwgPSB0aGlzLm1vZGVsO1xyXG4gICAgICAgIG0ubWFpblByb2dyYW0gPSB0aGlzLm1haW5Qcm9ncmFtO1xyXG4gICAgICAgIHRoaXMubWFpblByb2dyYW0gPSBudWxsO1xyXG4gICAgICAgIG0ubWFpblN5bWJvbFRhYmxlID0gdGhpcy5tYWluU3ltYm9sVGFibGU7XHJcbiAgICAgICAgdGhpcy5tYWluU3ltYm9sVGFibGUgPSBudWxsO1xyXG4gICAgICAgIG0udHlwZVN0b3JlID0gdGhpcy50eXBlU3RvcmU7XHJcbiAgICAgICAgLy8gdGhpcy50eXBlU3RvcmUgPSBudWxsO1xyXG4gICAgICAgIG0uaXNTdGFydGFibGUgPSB0aGlzLmlzU3RhcnRhYmxlO1xyXG4gICAgICAgIG0uZGVwZW5kc09uTW9kdWxlc1dpdGhFcnJvcnMgPSB0aGlzLmRlcGVuZHNPbk1vZHVsZXNXaXRoRXJyb3JzO1xyXG5cclxuICAgICAgICBtLmJyZWFrcG9pbnRzID0gdGhpcy5icmVha3BvaW50cztcclxuICAgICAgICB0aGlzLmJyZWFrcG9pbnRzID0gW107XHJcbiAgICAgICAgbGV0IHByb2dyYW1zID0gbS5nZXRQcm9ncmFtcygpO1xyXG5cclxuICAgICAgICBwcm9ncmFtcy5mb3JFYWNoKChwKSA9PiBwLm1vZHVsZSA9IG0pO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBiIG9mIG0uYnJlYWtwb2ludHMpIHtcclxuICAgICAgICAgICAgdGhpcy5icmVha3BvaW50cy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGxpbmU6IGIubGluZSxcclxuICAgICAgICAgICAgICAgIGNvbHVtbjogYi5jb2x1bW4sXHJcbiAgICAgICAgICAgICAgICBzdGF0ZW1lbnQ6IG51bGxcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBtLmF0dGFjaFRvU3RhdGVtZW50KGIsIHByb2dyYW1zKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmZpbGUuZGlydHkgPSB0cnVlO1xyXG5cclxuICAgICAgICByZXR1cm4gbTtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhcigpIHtcclxuXHJcbiAgICAgICAgdGhpcy5pZGVudGlmaWVyUG9zaXRpb25zID0ge307XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmZpbGUgIT0gbnVsbCAmJiB0aGlzLmZpbGUuZGlydHkpIHtcclxuICAgICAgICAgICAgLy8gTGV4ZXJcclxuICAgICAgICAgICAgdGhpcy50b2tlbkxpc3QgPSBudWxsO1xyXG4gICAgICAgICAgICB0aGlzLmVycm9yc1swXSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgLy8gQVNUIFBhcnNlclxyXG4gICAgICAgICAgICB0aGlzLmVycm9yc1sxXSA9IFtdO1xyXG5cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB0eXBlIHJlc29sdmVyXHJcbiAgICAgICAgdGhpcy5lcnJvcnNbMl0gPSBbXTtcclxuICAgICAgICB0aGlzLnR5cGVOb2RlcyA9IFtdO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlID0gbmV3IFR5cGVTdG9yZSgpO1xyXG5cclxuICAgICAgICAvLyBDb2RlIGdlbmVyYXRvclxyXG4gICAgICAgIHRoaXMuZXJyb3JzWzNdID0gW107XHJcbiAgICAgICAgdGhpcy5tYWluU3ltYm9sVGFibGUgPSBuZXcgU3ltYm9sVGFibGUobnVsbCwgeyBsaW5lOiAxLCBjb2x1bW46IDEsIGxlbmd0aDogMSB9LCB7IGxpbmU6IDEwMDAwMCwgY29sdW1uOiAxLCBsZW5ndGg6IDAgfSk7XHJcbiAgICAgICAgdGhpcy5tYWluUHJvZ3JhbSA9IG51bGw7XHJcblxyXG4gICAgICAgIHRoaXMubWV0aG9kQ2FsbFBvc2l0aW9ucyA9IHt9O1xyXG4gICAgICAgIHRoaXMuZGVwZW5kc09uTW9kdWxlcyA9IG5ldyBNYXAoKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaGFzRXJyb3JzKCkge1xyXG5cclxuICAgICAgICBmb3IgKGxldCBlbCBvZiB0aGlzLmVycm9ycykge1xyXG4gICAgICAgICAgICBpZihlbC5maW5kKGVycm9yID0+IGVycm9yLmxldmVsID09IFwiZXJyb3JcIikpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gaWYgKGVsLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgLy8gICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldFNvcnRlZEFuZEZpbHRlcmVkRXJyb3JzKCk6IEVycm9yW10ge1xyXG5cclxuICAgICAgICBsZXQgbGlzdDogRXJyb3JbXSA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBlbCBvZiB0aGlzLmVycm9ycykge1xyXG4gICAgICAgICAgICBsaXN0ID0gbGlzdC5jb25jYXQoZWwpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGlzdC5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChhLnBvc2l0aW9uLmxpbmUgPiBiLnBvc2l0aW9uLmxpbmUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChiLnBvc2l0aW9uLmxpbmUgPiBhLnBvc2l0aW9uLmxpbmUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoYS5wb3NpdGlvbi5jb2x1bW4gPj0gYi5wb3NpdGlvbi5jb2x1bW4pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aCAtIDE7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgZTEgPSBsaXN0W2ldO1xyXG4gICAgICAgICAgICBsZXQgZTIgPSBsaXN0W2kgKyAxXTtcclxuICAgICAgICAgICAgaWYgKGUxLnBvc2l0aW9uLmxpbmUgPT0gZTIucG9zaXRpb24ubGluZSAmJiBlMS5wb3NpdGlvbi5jb2x1bW4gKyAxMCA+IGUyLnBvc2l0aW9uLmNvbHVtbikge1xyXG4gICAgICAgICAgICAgICAgaWYodGhpcy5lcnJvckxldmVsQ29tcGFyZShlMS5sZXZlbCwgZTIubGV2ZWwpID09IDEpe1xyXG4gICAgICAgICAgICAgICAgICAgIGxpc3Quc3BsaWNlKGkgKyAxLCAxKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpLS07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBsaXN0O1xyXG4gICAgfVxyXG5cclxuICAgIGVycm9yTGV2ZWxDb21wYXJlKGxldmVsMTogRXJyb3JMZXZlbCwgbGV2ZWwyOiBFcnJvckxldmVsKTogbnVtYmVyIHtcclxuICAgICAgICBpZihsZXZlbDEgPT0gXCJlcnJvclwiKSByZXR1cm4gMTtcclxuICAgICAgICBpZihsZXZlbDIgPT0gXCJlcnJvclwiKSByZXR1cm4gMjtcclxuICAgICAgICBpZihsZXZlbDEgPT0gXCJ3YXJuaW5nXCIpIHJldHVybiAxO1xyXG4gICAgICAgIGlmKGxldmVsMiA9PSBcIndhcm5pbmdcIikgcmV0dXJuIDI7XHJcbiAgICAgICAgcmV0dXJuIDE7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyU3RhcnRCdXR0b24oKSB7XHJcbiAgICAgICAgbGV0ICRidXR0b25EaXYgPSB0aGlzLmZpbGU/LnBhbmVsRWxlbWVudD8uJGh0bWxGaXJzdExpbmU/LmZpbmQoJy5qb19hZGRpdGlvbmFsQnV0dG9uU3RhcnQnKTtcclxuICAgICAgICBpZiAoJGJ1dHRvbkRpdiA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgICRidXR0b25EaXYuZmluZCgnLmpvX3N0YXJ0QnV0dG9uJykucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmlzU3RhcnRhYmxlKSB7XHJcbiAgICAgICAgICAgIGxldCAkc3RhcnRCdXR0b25EaXYgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb19zdGFydEJ1dHRvbiBpbWdfc3RhcnQtZGFyayBqb19idXR0b24gam9fYWN0aXZlXCIgdGl0bGU9XCJIYXVwdHByb2dyYW1tIGluIGRlciBEYXRlaSBzdGFydGVuXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgICRidXR0b25EaXYuYXBwZW5kKCRzdGFydEJ1dHRvbkRpdik7XHJcbiAgICAgICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICAgICAgJHN0YXJ0QnV0dG9uRGl2Lm9uKCdtb3VzZWRvd24nLCAoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKSk7XHJcbiAgICAgICAgICAgICRzdGFydEJ1dHRvbkRpdi5vbignY2xpY2snLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0Lm1haW4uc2V0TW9kdWxlQWN0aXZlKHRoYXQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQubWFpbi5nZXRJbnRlcnByZXRlcigpLnN0YXJ0KCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9IFxyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBCYXNlTW9kdWxlIGV4dGVuZHMgTW9kdWxlIHtcclxuICAgIGNvbnN0cnVjdG9yKG1haW46IE1haW5CYXNlKSB7XHJcblxyXG4gICAgICAgIHN1cGVyKHsgbmFtZTogXCJCYXNlIE1vZHVsZVwiLCB0ZXh0OiBcIlwiLCB0ZXh0X2JlZm9yZV9yZXZpc2lvbjogbnVsbCwgc3VibWl0dGVkX2RhdGU6IG51bGwsIHN0dWRlbnRfZWRpdGVkX2FmdGVyX3JldmlzaW9uOiBmYWxzZSwgZGlydHk6IGZhbHNlLCBzYXZlZDogdHJ1ZSwgdmVyc2lvbjogMSAsIGlkZW50aWNhbF90b19yZXBvc2l0b3J5X3ZlcnNpb246IHRydWV9LCBtYWluKTtcclxuXHJcbiAgICAgICAgdGhpcy5pc1N5c3RlbU1vZHVsZSA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5tYWluUHJvZ3JhbSA9IG51bGw7XHJcblxyXG4gICAgICAgIHRoaXMuY2xlYXIoKTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUodm9pZFByaW1pdGl2ZVR5cGUpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUoaW50UHJpbWl0aXZlVHlwZSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShmbG9hdFByaW1pdGl2ZVR5cGUpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUoZG91YmxlUHJpbWl0aXZlVHlwZSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShjaGFyUHJpbWl0aXZlVHlwZSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShib29sZWFuUHJpbWl0aXZlVHlwZSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShzdHJpbmdQcmltaXRpdmVUeXBlKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG9iamVjdFR5cGUpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUodmFyVHlwZSk7XHJcblxyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUoSW50ZWdlclR5cGUpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUoRmxvYXRUeXBlKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKERvdWJsZVR5cGUpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUoQ2hhcmFjdGVyVHlwZSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShCb29sZWFuVHlwZSk7XHJcblxyXG4gICAgICAgIC8vIENvbGxlY3Rpb25zIEZyYW1ld29ya1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IEl0ZXJhdG9yQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IEl0ZXJhYmxlQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IENvbGxlY3Rpb25DbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgTGlzdENsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBBcnJheUxpc3RDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgVmVjdG9yQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFF1ZXVlQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IERlcXVlQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IExpbmtlZExpc3RDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgU3RhY2tDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgTGlzdEl0ZXJhdG9ySW1wbENsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBTZXRDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgSGFzaFNldENsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBMaW5rZWRIYXNoU2V0Q2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFNldEl0ZXJhdG9ySW1wbENsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBNYXBDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgSGFzaE1hcENsYXNzKHRoaXMpKTtcclxuXHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgQ29uc29sZUNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBNYXRoQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFZlY3RvcjJDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgS2V5Q2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFNvdW5kQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IElucHV0Q2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFJ1bm5hYmxlKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBUaW1lckNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBDb2xvckNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBBY3RvckNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBTaGFwZUNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBGaWxsZWRTaGFwZUNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBSZWN0YW5nbGVDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgUm91bmRlZFJlY3RhbmdsZUNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBDaXJjbGVDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgRWxsaXBzZUNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBCaXRtYXBDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgQWxpZ25tZW50Q2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFRleHRDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgU2NhbGVNb2RlQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFNwcml0ZUxpYnJhcnlDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgUmVwZWF0VHlwZUNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBTcHJpdGVDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgQ29sbGlzaW9uUGFpckNsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBHcm91cENsYXNzKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBQb2x5Z29uQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IExpbmVDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgVHJpYW5nbGVDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgVHVydGxlQ2xhc3ModGhpcykpO1xyXG5cclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBNb3VzZUxpc3RlbmVySW50ZXJmYWNlKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBNb3VzZUFkYXB0ZXJDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgV29ybGRDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgUHJvY2Vzc2luZ0NsYXNzKHRoaXMpKTtcclxuXHJcbiAgICAgICAgKDxBY3RvckNsYXNzPnRoaXMudHlwZVN0b3JlLmdldFR5cGUoXCJBY3RvclwiKSkucmVnaXN0ZXJXb3JsZFR5cGUoKTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFByaW50U3RyZWFtQ2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IEtleUxpc3RlbmVyKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBTeXN0ZW1DbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgU3lzdGVtVG9vbHNDbGFzcyh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgRGF5T2ZXZWVrRW51bSh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgTW9udGhFbnVtKHRoaXMpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBMb2NhbERhdGVUaW1lQ2xhc3ModGhpcykpO1xyXG4gICAgXHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgV2ViU29ja2V0Q2xpZW50Q2xhc3ModGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IFdlYlNvY2tldENsYXNzKHRoaXMpKTtcclxuXHJcbiAgICBcclxuXHJcbiAgICAgICAgc3RyaW5nUHJpbWl0aXZlVHlwZS5tb2R1bGUgPSB0aGlzO1xyXG4gICAgICAgIC8vIHN0cmluZ1ByaW1pdGl2ZVR5cGUuYmFzZUNsYXNzID0gPGFueT4odGhpcy50eXBlU3RvcmUuZ2V0VHlwZShcIk9iamVjdFwiKSk7XHJcbiAgICAgICAgLy8gc3RyaW5nUHJpbWl0aXZlVHlwZS5iYXNlQ2xhc3MgPSBvYmplY3RUeXBlO1xyXG4gICAgICAgIC8vIEludGVnZXJUeXBlLmJhc2VDbGFzcyA9IG9iamVjdFR5cGU7XHJcbiAgICAgICAgLy8gRG91YmxlVHlwZS5iYXNlQ2xhc3MgPSBvYmplY3RUeXBlO1xyXG4gICAgICAgIC8vIEZsb2F0VHlwZS5iYXNlQ2xhc3MgPSBvYmplY3RUeXBlO1xyXG4gICAgICAgIC8vIENoYXJhY3RlclR5cGUuYmFzZUNsYXNzID0gb2JqZWN0VHlwZTtcclxuICAgICAgICAvLyBCb29sZWFuVHlwZS5iYXNlQ2xhc3MgPSBvYmplY3RUeXBlO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjbGVhclVzYWdlUG9zaXRpb25zKCkge1xyXG4gICAgICAgIGZvciAobGV0IHR5cGUgb2YgdGhpcy50eXBlU3RvcmUudHlwZUxpc3QpIHtcclxuICAgICAgICAgICAgdHlwZS5jbGVhclVzYWdlUG9zaXRpb25zKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcblxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgR05HTW9kdWxlIGV4dGVuZHMgTW9kdWxlIHtcclxuICAgIGNvbnN0cnVjdG9yKG1haW46IE1haW5CYXNlLCBtb2R1bGVTdG9yZTogTW9kdWxlU3RvcmUpIHtcclxuXHJcbiAgICAgICAgc3VwZXIoeyBuYW1lOiBcIkdyYXBoaWNzIGFuZCBHYW1lcyAtIE1vZHVsZVwiLCB0ZXh0OiBcIlwiLCB0ZXh0X2JlZm9yZV9yZXZpc2lvbjogbnVsbCwgc3VibWl0dGVkX2RhdGU6IG51bGwsIHN0dWRlbnRfZWRpdGVkX2FmdGVyX3JldmlzaW9uOiBmYWxzZSwgZGlydHk6IGZhbHNlLCBzYXZlZDogdHJ1ZSwgdmVyc2lvbjogMSAsIGlkZW50aWNhbF90b19yZXBvc2l0b3J5X3ZlcnNpb246IHRydWV9LCBtYWluKTtcclxuXHJcbiAgICAgICAgdGhpcy5pc1N5c3RlbU1vZHVsZSA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5tYWluUHJvZ3JhbSA9IG51bGw7XHJcblxyXG4gICAgICAgIHRoaXMuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgR05HQWt0aW9uc2VtcGZhZW5nZXJJbnRlcmZhY2UodGhpcykpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IEdOR0Jhc2VGaWd1ckNsYXNzKHRoaXMsIG1vZHVsZVN0b3JlKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgR05HWmVpY2hlbmZlbnN0ZXJDbGFzcyh0aGlzLCBtb2R1bGVTdG9yZSkpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IEdOR0VyZWlnbmlzYmVoYW5kbHVuZyh0aGlzLCBtb2R1bGVTdG9yZSkpO1xyXG4gICAgICAgIHRoaXMudHlwZVN0b3JlLmFkZFR5cGUobmV3IEdOR1JlY2h0ZWNrQ2xhc3ModGhpcywgbW9kdWxlU3RvcmUpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBHTkdEcmVpZWNrQ2xhc3ModGhpcywgbW9kdWxlU3RvcmUpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBHTkdLcmVpc0NsYXNzKHRoaXMsIG1vZHVsZVN0b3JlKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgR05HVGV4dENsYXNzKHRoaXMsIG1vZHVsZVN0b3JlKSk7XHJcbiAgICAgICAgdGhpcy50eXBlU3RvcmUuYWRkVHlwZShuZXcgR05HVHVydGxlQ2xhc3ModGhpcywgbW9kdWxlU3RvcmUpKTtcclxuICAgICAgICB0aGlzLnR5cGVTdG9yZS5hZGRUeXBlKG5ldyBHTkdGaWd1ckNsYXNzKHRoaXMsIG1vZHVsZVN0b3JlKSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyVXNhZ2VQb3NpdGlvbnMoKSB7XHJcbiAgICAgICAgZm9yIChsZXQgdHlwZSBvZiB0aGlzLnR5cGVTdG9yZS50eXBlTGlzdCkge1xyXG4gICAgICAgICAgICB0eXBlLmNsZWFyVXNhZ2VQb3NpdGlvbnMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgTW9kdWxlU3RvcmUge1xyXG5cclxuICAgIHByaXZhdGUgbW9kdWxlczogTW9kdWxlW10gPSBbXTtcclxuICAgIHByaXZhdGUgbW9kdWxlTWFwOiBNYXA8c3RyaW5nLCBNb2R1bGU+ID0gbmV3IE1hcCgpO1xyXG4gICAgcHJpdmF0ZSBiYXNlTW9kdWxlOiBCYXNlTW9kdWxlO1xyXG5cclxuICAgIGRpcnR5OiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBtYWluOiBNYWluQmFzZSwgd2l0aEJhc2VNb2R1bGU6IGJvb2xlYW4sIGFkZGl0aW9uYWxMaWJyYXJpZXM6IHN0cmluZ1tdID0gW10pIHtcclxuICAgICAgICBpZiAod2l0aEJhc2VNb2R1bGUpIHtcclxuICAgICAgICAgICAgdGhpcy5iYXNlTW9kdWxlID0gbmV3IEJhc2VNb2R1bGUobWFpbik7XHJcbiAgICAgICAgICAgIHRoaXMucHV0TW9kdWxlKHRoaXMuYmFzZU1vZHVsZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IobGV0IGxpYiBvZiBhZGRpdGlvbmFsTGlicmFyaWVzKXtcclxuICAgICAgICAgICAgdGhpcy5hZGRMaWJyYXJ5TW9kdWxlKGxpYik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFkZExpYnJhcnlNb2R1bGUoaWRlbnRpZmllcjogc3RyaW5nKXtcclxuICAgICAgICBzd2l0Y2goaWRlbnRpZmllcil7XHJcbiAgICAgICAgICAgIGNhc2UgXCJnbmdcIjogdGhpcy5wdXRNb2R1bGUobmV3IEdOR01vZHVsZSh0aGlzLm1haW4sIHRoaXMpKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZpbmRNb2R1bGVCeUlkKG1vZHVsZV9pZDogbnVtYmVyKTogTW9kdWxlIHtcclxuICAgICAgICBmb3IobGV0IG1vZHVsZSBvZiB0aGlzLm1vZHVsZXMpe1xyXG4gICAgICAgICAgICBpZihtb2R1bGUuZmlsZS5pZCA9PSBtb2R1bGVfaWQpIHJldHVybiBtb2R1bGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRCYXNlTW9kdWxlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmJhc2VNb2R1bGU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsZWFyVXNhZ2VQb3NpdGlvbnMoKSB7XHJcbiAgICAgICAgdGhpcy5iYXNlTW9kdWxlLmNsZWFyVXNhZ2VQb3NpdGlvbnMoKTtcclxuICAgIH1cclxuXHJcbiAgICBjb3B5KCk6IE1vZHVsZVN0b3JlIHtcclxuICAgICAgICBsZXQgbXM6IE1vZHVsZVN0b3JlID0gbmV3IE1vZHVsZVN0b3JlKHRoaXMubWFpbiwgdHJ1ZSk7XHJcbiAgICAgICAgZm9yIChsZXQgbSBvZiB0aGlzLm1vZHVsZXMpIHtcclxuICAgICAgICAgICAgaWYgKCFtLmlzU3lzdGVtTW9kdWxlKSB7XHJcbiAgICAgICAgICAgICAgICBtcy5wdXRNb2R1bGUobS5jb3B5KCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBtcztcclxuICAgIH1cclxuXHJcbiAgICBmaW5kTW9kdWxlQnlGaWxlKGZpbGU6IEZpbGUpIHtcclxuICAgICAgICBmb3IgKGxldCBtIG9mIHRoaXMubW9kdWxlcykge1xyXG4gICAgICAgICAgICBpZiAobS5maWxlID09IGZpbGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGhhc0Vycm9ycygpOiBib29sZWFuIHtcclxuICAgICAgICBmb3IgKGxldCBtIG9mIHRoaXMubW9kdWxlcykge1xyXG4gICAgICAgICAgICBpZiAobS5oYXNFcnJvcnMoKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEZpcnN0TW9kdWxlKCk6IE1vZHVsZSB7XHJcbiAgICAgICAgaWYgKHRoaXMubW9kdWxlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IG1vIG9mIHRoaXMubW9kdWxlcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFtby5pc1N5c3RlbU1vZHVsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtbztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBpc0RpcnR5KCk6IGJvb2xlYW4ge1xyXG5cclxuICAgICAgICBpZiAodGhpcy5kaXJ0eSkge1xyXG4gICAgICAgICAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGRpcnR5ID0gZmFsc2U7XHJcbiAgICAgICAgZm9yIChsZXQgbSBvZiB0aGlzLm1vZHVsZXMpIHtcclxuICAgICAgICAgICAgaWYgKG0uZmlsZS5kaXJ0eSkge1xyXG4gICAgICAgICAgICAgICAgZGlydHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGRpcnR5O1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBnZXRNb2R1bGVzKGluY2x1ZGVTeXN0ZW1Nb2R1bGVzOiBib29sZWFuLCBleGNsdWRlZE1vZHVsZU5hbWU/OiBTdHJpbmcpOiBNb2R1bGVbXSB7XHJcbiAgICAgICAgbGV0IHJldCA9IFtdO1xyXG4gICAgICAgIGZvciAobGV0IG0gb2YgdGhpcy5tb2R1bGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChtLmZpbGUubmFtZSAhPSBleGNsdWRlZE1vZHVsZU5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGlmICghbS5pc1N5c3RlbU1vZHVsZSB8fCBpbmNsdWRlU3lzdGVtTW9kdWxlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldC5wdXNoKG0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHV0TW9kdWxlKG1vZHVsZTogTW9kdWxlKSB7XHJcbiAgICAgICAgdGhpcy5tb2R1bGVzLnB1c2gobW9kdWxlKTtcclxuICAgICAgICB0aGlzLm1vZHVsZU1hcFttb2R1bGUuZmlsZS5uYW1lXSA9IG1vZHVsZTtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVNb2R1bGVXaXRoRmlsZShmaWxlOiBGaWxlKSB7XHJcbiAgICAgICAgZm9yIChsZXQgbSBvZiB0aGlzLm1vZHVsZXMpIHtcclxuICAgICAgICAgICAgaWYgKG0uZmlsZSA9PSBmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZU1vZHVsZShtKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZU1vZHVsZShtb2R1bGU6IE1vZHVsZSkge1xyXG5cclxuICAgICAgICBpZiAodGhpcy5tb2R1bGVzLmluZGV4T2YobW9kdWxlKSA8IDApIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5tb2R1bGVzLnNwbGljZSh0aGlzLm1vZHVsZXMuaW5kZXhPZihtb2R1bGUpLCAxKTtcclxuICAgICAgICB0aGlzLm1vZHVsZU1hcFttb2R1bGUuZmlsZS5uYW1lXSA9IHVuZGVmaW5lZDtcclxuICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRNb2R1bGUobW9kdWxlTmFtZTogc3RyaW5nKTogTW9kdWxlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tb2R1bGVNYXBbbW9kdWxlTmFtZV07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VHlwZShpZGVudGlmaWVyOiBzdHJpbmcpOiB7IHR5cGU6IFR5cGUsIG1vZHVsZTogTW9kdWxlIH0ge1xyXG4gICAgICAgIGZvciAobGV0IG1vZHVsZSBvZiB0aGlzLm1vZHVsZXMpIHtcclxuICAgICAgICAgICAgaWYgKG1vZHVsZS50eXBlU3RvcmUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHR5cGUgPSBtb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoaWRlbnRpZmllcik7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogdHlwZSwgbW9kdWxlOiBtb2R1bGUgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRUeXBlQ29tcGxldGlvbkl0ZW1zKG1vZHVsZUNvbnRleHQ6IE1vZHVsZSwgcmFuZ2VUb1JlcGxhY2U6IG1vbmFjby5JUmFuZ2UpOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10ge1xyXG5cclxuICAgICAgICBsZXQgY29tcGxldGlvbkl0ZW1zOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10gPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbW9kdWxlIG9mIHRoaXMubW9kdWxlcykge1xyXG4gICAgICAgICAgICBpZiAobW9kdWxlLnR5cGVTdG9yZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB0eXBlIG9mIG1vZHVsZS50eXBlU3RvcmUudHlwZUxpc3QpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobW9kdWxlID09IG1vZHVsZUNvbnRleHQgfHwgKHR5cGUgaW5zdGFuY2VvZiBLbGFzcyAmJiB0eXBlLnZpc2liaWxpdHkgPT0gVmlzaWJpbGl0eS5wdWJsaWMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHx8IG1vZHVsZS5pc1N5c3RlbU1vZHVsZSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGRldGFpbCA9IFwiS2xhc3NlXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZih0eXBlLmRvY3VtZW50YXRpb24gIT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWwgPSB0eXBlLmRvY3VtZW50YXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobW9kdWxlLmlzU3lzdGVtTW9kdWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIFByaW1pdGl2ZVR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWwgPSBcIlByaW1pdGl2ZXIgRGF0ZW50eXBcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsID0gXCJTeXN0ZW1rbGFzc2VcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGl0ZW0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogdHlwZS5pZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBkZXRhaWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiB0eXBlLmlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBraW5kOiB0eXBlIGluc3RhbmNlb2YgUHJpbWl0aXZlVHlwZSA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU3RydWN0IDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuQ2xhc3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZTogcmFuZ2VUb1JlcGxhY2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmljOiAoKHR5cGUgaW5zdGFuY2VvZiBLbGFzcyB8fCB0eXBlIGluc3RhbmNlb2YgSW50ZXJmYWNlKSAmJiB0eXBlLnR5cGVWYXJpYWJsZXMubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRpb25JdGVtcy5wdXNoKGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNvbXBsZXRpb25JdGVtcztcclxuXHJcbiAgICB9XHJcblxyXG5cclxuXHJcblxyXG59XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFR5cGVTdG9yZSB7XHJcblxyXG4gICAgdHlwZUxpc3Q6IFR5cGVbXSA9IFtdO1xyXG4gICAgdHlwZU1hcDogTWFwPHN0cmluZywgVHlwZT4gPSBuZXcgTWFwKCk7XHJcblxyXG4gICAgYWRkVHlwZSh0eXBlOiBUeXBlKSB7XHJcbiAgICAgICAgdGhpcy50eXBlTGlzdC5wdXNoKHR5cGUpO1xyXG4gICAgICAgIHRoaXMudHlwZU1hcC5zZXQodHlwZS5pZGVudGlmaWVyLCB0eXBlKTtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhcigpIHtcclxuICAgICAgICB0aGlzLnR5cGVMaXN0Lmxlbmd0aCA9IDA7XHJcbiAgICAgICAgdGhpcy50eXBlTWFwLmNsZWFyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VHlwZShpZGVudGlmaWVyOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50eXBlTWFwLmdldChpZGVudGlmaWVyKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxufVxyXG4iXX0=