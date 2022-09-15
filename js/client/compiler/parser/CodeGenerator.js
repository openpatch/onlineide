import { TokenType, TokenTypeReadable } from "../lexer/Token.js";
import { ArrayType } from "../types/Array.js";
import { Klass, Interface, StaticClass, Visibility, getVisibilityUpTo } from "../types/Class.js";
import { booleanPrimitiveType, charPrimitiveType, floatPrimitiveType, intPrimitiveType, stringPrimitiveType, nullType, voidPrimitiveType, varType, doublePrimitiveType } from "../types/PrimitiveTypes.js";
import { Attribute, PrimitiveType, getTypeIdentifier, Parameterlist } from "../types/Types.js";
import { LabelManager } from "./LabelManager.js";
import { SymbolTable } from "./SymbolTable.js";
import { Enum } from "../types/Enum.js";
import { InputClass } from "../../runtimelibrary/Input.js";
export class CodeGenerator {
    constructor() {
        this.initStackFrameNodes = [];
    }
    startAdhocCompilation(module, moduleStore, symbolTable, heap) {
        this.moduleStore = moduleStore;
        this.module = module;
        this.symbolTableStack = [];
        this.symbolTableStack.push(symbolTable);
        this.currentSymbolTable = symbolTable;
        this.heap = heap;
        let oldStackframeSize = symbolTable.stackframeSize;
        this.nextFreeRelativeStackPos = oldStackframeSize;
        this.currentProgram = null;
        this.errorList = [];
        this.breakNodeStack = [];
        this.continueNodeStack = [];
        this.generateMain(true);
        return this.errorList;
    }
    start(module, moduleStore) {
        this.moduleStore = moduleStore;
        this.module = module;
        this.symbolTableStack = [];
        this.currentSymbolTable = null;
        this.currentProgram = null;
        this.errorList = [];
        this.nextFreeRelativeStackPos = 0;
        if (this.module.tokenList.length > 0) {
            let lastToken = this.module.tokenList[this.module.tokenList.length - 1];
            this.module.mainSymbolTable.positionTo = { line: lastToken.position.line, column: lastToken.position.column + 1, length: 1 };
        }
        this.symbolTableStack.push(this.module.mainSymbolTable);
        this.currentSymbolTable = this.module.mainSymbolTable;
        this.breakNodeStack = [];
        this.continueNodeStack = [];
        this.generateMain();
        this.generateClasses();
        this.lookForStaticVoidMain();
        this.module.errors[3] = this.errorList;
    }
    lookForStaticVoidMain() {
        let mainProgram = this.module.mainProgram;
        if (mainProgram != null && mainProgram.statements.length > 2)
            return;
        let mainMethod = null;
        let staticClass = null;
        let classNode1;
        for (let classNode of this.module.classDefinitionsAST) {
            if (classNode.type == TokenType.keywordClass) {
                let ct = classNode.resolvedType;
                for (let m of ct.staticClass.methods) {
                    if (m.identifier == "main" && m.parameterlist.parameters.length == 1) {
                        let pt = m.parameterlist.parameters[0];
                        if (pt.type instanceof ArrayType && pt.type.arrayOfType == stringPrimitiveType) {
                            if (mainMethod != null) {
                                this.pushError("Es existieren mehrere Klassen mit statischen main-Methoden.", classNode.position);
                            }
                            else {
                                mainMethod = m;
                                staticClass = ct.staticClass;
                                classNode1 = classNode;
                            }
                        }
                    }
                }
            }
        }
        if (mainMethod != null) {
            let position = mainMethod.usagePositions[0];
            if (mainMethod.program != null && mainMethod.program.statements.length > 0) {
                position = mainMethod.program.statements[0].position;
            }
            this.initCurrentProgram();
            this.module.mainProgram = this.currentProgram;
            this.pushStatements([{
                    type: TokenType.callMainMethod,
                    position: position,
                    stepFinished: false,
                    method: mainMethod,
                    staticClass: staticClass
                }, {
                    type: TokenType.closeStackframe,
                    position: mainMethod.usagePositions.get(this.module)[0]
                }
            ], false);
        }
    }
    generateClasses() {
        if (this.module.classDefinitionsAST == null)
            return;
        for (let classNode of this.module.classDefinitionsAST) {
            if (classNode.type == TokenType.keywordClass) {
                this.generateClass(classNode);
            }
            if (classNode.type == TokenType.keywordEnum) {
                this.generateEnum(classNode);
            }
            if (classNode.type == TokenType.keywordInterface) {
                let interf = classNode.resolvedType;
                if (interf != null) {
                    this.checkDoubleMethodDeclaration(interf);
                }
            }
        }
    }
    generateEnum(enumNode) {
        if (enumNode.resolvedType == null)
            return;
        this.pushNewSymbolTable(false, enumNode.scopeFrom, enumNode.scopeTo);
        let enumClass = enumNode.resolvedType;
        // this.pushUsagePosition(enumNode.position, enumClass);
        this.currentSymbolTable.classContext = enumClass;
        this.currentProgram = enumClass.attributeInitializationProgram;
        for (let attribute of enumNode.attributes) {
            if (attribute != null && !attribute.isStatic && attribute.initialization != null) {
                this.initializeAttribute(attribute);
            }
        }
        if (enumClass.attributeInitializationProgram.statements.length > 0) {
            this.pushStatements({
                type: TokenType.return,
                position: this.lastStatement.position,
                copyReturnValueToStackframePos0: false,
                stepFinished: false,
                leaveThisObjectOnStack: true
            });
        }
        this.currentProgram.labelManager.resolveNodes();
        for (let methodNode of enumNode.methods) {
            if (methodNode != null && !methodNode.isAbstract && !methodNode.isStatic) {
                this.compileMethod(methodNode);
            }
        }
        this.popSymbolTable(null);
        // constructor calls
        this.pushNewSymbolTable(false, enumNode.scopeFrom, enumNode.scopeTo);
        for (let enumValueNode of enumNode.values) {
            if (enumValueNode.constructorParameters != null) {
                let p = {
                    module: this.module,
                    labelManager: null,
                    statements: []
                };
                this.currentProgram = p;
                this.pushStatements({
                    type: TokenType.pushEnumValue,
                    position: enumValueNode.position,
                    enumClass: enumClass,
                    valueIdentifier: enumValueNode.identifier
                });
                this.processEnumConstructorCall(enumClass, enumValueNode.constructorParameters, enumValueNode.position, enumValueNode.commaPositions, enumValueNode.rightBracketPosition);
                this.pushStatements({
                    type: TokenType.programEnd,
                    position: enumValueNode.position,
                    stepFinished: true
                });
                let enumInfo = enumClass.identifierToInfoMap[enumValueNode.identifier];
                enumInfo.constructorCallProgram = p;
                enumInfo.position = enumValueNode.position;
            }
        }
        this.popSymbolTable(null);
        // static attributes/methods
        this.pushNewSymbolTable(false, enumNode.scopeFrom, enumNode.scopeTo);
        this.currentSymbolTable.classContext = enumClass.staticClass;
        this.currentProgram = enumClass.staticClass.attributeInitializationProgram;
        for (let attribute of enumNode.attributes) {
            if (attribute != null && attribute.isStatic && attribute.initialization != null) {
                this.initializeAttribute(attribute);
            }
        }
        this.currentProgram.labelManager.resolveNodes();
        for (let methodNode of enumNode.methods) {
            if (methodNode != null && methodNode.isStatic) {
                this.compileMethod(methodNode);
            }
        }
        this.checkDoubleMethodDeclaration(enumClass);
        this.popSymbolTable(null);
    }
    processEnumConstructorCall(enumClass, parameterNodes, position, commaPositions, rightBracketPosition) {
        let parameterTypes = [];
        for (let p of parameterNodes) {
            let typeNode = this.processNode(p);
            if (typeNode == null)
                continue;
            parameterTypes.push(typeNode.type);
        }
        let methods = enumClass.getMethodsThatFitWithCasting(enumClass.identifier, parameterTypes, true, Visibility.private);
        this.module.pushMethodCallPosition(position, commaPositions, enumClass.getMethods(Visibility.private, enumClass.identifier), rightBracketPosition);
        if (methods.error != null) {
            this.pushError(methods.error, position);
            return { type: stringPrimitiveType, isAssignable: false }; // try to continue...
        }
        let method = methods.methodList[0];
        for (let i = 0; i < parameterTypes.length; i++) {
            let destType = method.getParameterType[i];
            let srcType = parameterTypes[i];
            if (!srcType.equals(destType)) {
                if (srcType instanceof PrimitiveType && destType instanceof PrimitiveType) {
                    if (srcType.getCastInformation(destType).needsStatement) {
                        this.pushStatements({
                            type: TokenType.castValue,
                            position: null,
                            newType: destType,
                            stackPosRelative: -parameterTypes.length + 1 + i
                        });
                    }
                }
            }
        }
        this.pushStatements({
            type: TokenType.callMethod,
            method: method,
            position: position,
            stepFinished: true,
            isSuperCall: false,
            stackframeBegin: -(parameterTypes.length + 1) // this-object followed by parameters
        });
    }
    generateClass(classNode) {
        if (classNode.resolvedType == null)
            return;
        this.pushNewSymbolTable(false, classNode.scopeFrom, classNode.scopeTo);
        let klass = classNode.resolvedType;
        //this.pushUsagePosition(classNode.position, klass);
        let inheritanceError = klass.checkInheritance();
        if (inheritanceError.message != "") {
            this.pushError(inheritanceError.message, classNode.position, "error", this.getInheritanceQuickFix(classNode.scopeTo, inheritanceError));
        }
        let baseClass = klass.baseClass;
        if (baseClass != null && baseClass.module != klass.module && baseClass.visibility == Visibility.private) {
            this.pushError("Die Basisklasse " + baseClass.identifier + " der Klasse " + klass.identifier + " ist hier nicht sichtbar.", classNode.position);
        }
        this.currentSymbolTable.classContext = klass;
        this.currentProgram = klass.attributeInitializationProgram;
        for (let attribute of classNode.attributes) {
            if (attribute != null && !attribute.isStatic && attribute.initialization != null) {
                this.initializeAttribute(attribute);
            }
        }
        if (klass.attributeInitializationProgram.statements.length > 0) {
            this.pushStatements({
                type: TokenType.return,
                position: this.lastStatement.position,
                copyReturnValueToStackframePos0: false,
                stepFinished: false,
                leaveThisObjectOnStack: true
            });
        }
        this.currentProgram.labelManager.resolveNodes();
        for (let methodNode of classNode.methods) {
            if (methodNode != null && !methodNode.isAbstract && !methodNode.isStatic) {
                this.compileMethod(methodNode);
            }
        }
        this.checkDoubleMethodDeclaration(klass);
        this.popSymbolTable(null);
        // static attributes/methods
        this.pushNewSymbolTable(false, classNode.scopeFrom, classNode.scopeTo);
        this.currentSymbolTable.classContext = klass.staticClass;
        this.currentProgram = klass.staticClass.attributeInitializationProgram;
        for (let attribute of classNode.attributes) {
            if (attribute != null && attribute.isStatic && attribute.initialization != null) {
                this.initializeAttribute(attribute);
            }
        }
        if (klass.staticClass.attributeInitializationProgram.statements.length > 0) {
            this.pushStatements({
                type: TokenType.return,
                position: this.lastStatement.position,
                copyReturnValueToStackframePos0: false,
                stepFinished: false,
                leaveThisObjectOnStack: true
            });
        }
        this.currentProgram.labelManager.resolveNodes();
        for (let methodNode of classNode.methods) {
            if (methodNode != null && methodNode.isStatic) {
                this.compileMethod(methodNode);
            }
        }
        this.popSymbolTable(null);
    }
    checkDoubleMethodDeclaration(cie) {
        let signatureMap = {};
        for (let m of cie.methods) {
            let signature = m.getSignatureWithReturnParameter();
            if (signatureMap[signature] != null) {
                let cieType = "In der Klasse ";
                if (cie instanceof Interface)
                    cieType = "Im Interface ";
                if (cie instanceof Enum)
                    cieType = "Im Enum ";
                this.pushError(cieType + cie.identifier + " gibt es zwei Methoden mit derselben Signatur: " + signature, m.usagePositions.get(this.module)[0], "error");
                this.pushError(cieType + cie.identifier + " gibt es zwei Methoden mit derselben Signatur: " + signature, signatureMap[signature].usagePositions.get(this.module)[0], "error");
            }
            else {
                signatureMap[signature] = m;
            }
        }
    }
    getInheritanceQuickFix(position, inheritanceError) {
        let s = "";
        for (let m of inheritanceError.missingMethods) {
            s += "\tpublic " + (m.returnType == null ? " void" : getTypeIdentifier(m.returnType)) + " " + m.identifier + "(";
            s += m.parameterlist.parameters.map(p => getTypeIdentifier(p.type) + " " + p.identifier).join(", ");
            s += ") {\n\t\t//TODO: Methode füllen\n\t}\n\n";
        }
        return {
            title: "Fehlende Methoden einfügen",
            editsProvider: (uri) => {
                return [
                    {
                        resource: uri,
                        edit: {
                            range: { startLineNumber: position.line, startColumn: position.column - 1, endLineNumber: position.line, endColumn: position.column - 1 },
                            text: s
                        }
                    }
                ];
            }
        };
    }
    compileMethod(methodNode) {
        var _a;
        // Assumption: methodNode != null
        let method = methodNode.resolvedType;
        this.checkIfMethodIsVirtual(method);
        if (method == null)
            return;
        // this.pushUsagePosition(methodNode.position, method);
        this.initCurrentProgram();
        method.program = this.currentProgram;
        this.pushNewSymbolTable(false, methodNode.scopeFrom, methodNode.scopeTo);
        this.currentSymbolTable.method = method;
        let stackPos = 1;
        for (let v of method.getParameterList().parameters) {
            v.stackPos = stackPos++;
            this.currentSymbolTable.variableMap.set(v.identifier, v);
        }
        // " + 1" is for "this"-object
        this.nextFreeRelativeStackPos = methodNode.parameters.length + 1;
        if (method.isConstructor && this.currentSymbolTable.classContext instanceof Klass) {
            let c = this.currentSymbolTable.classContext;
            if (c != null && ((_a = c.baseClass) === null || _a === void 0 ? void 0 : _a.hasConstructor())) {
                let error = false;
                if (methodNode.statements == null || methodNode.statements.length == 0)
                    error = true;
                if (!error) {
                    error = true;
                    if (methodNode.statements[0].type == TokenType.scopeNode) {
                        let stm = methodNode.statements[0].statements;
                        if (stm.length > 0 && stm[0].type == TokenType.superConstructorCall) {
                            error = false;
                        }
                    }
                    else if (methodNode.statements[0].type == TokenType.superConstructorCall) {
                        error = false;
                    }
                }
                if (error) {
                    let quickFix = null;
                    let constructors = c.baseClass.methods.filter(m => m.isConstructor);
                    if (constructors.length == 1) {
                        let methodCall = "super(" + constructors[0].parameterlist.parameters.map(p => p.identifier).join(", ") + ");";
                        let position = methodNode.position;
                        quickFix = {
                            title: 'Aufruf des Konstruktors der Basisklasse einfügen',
                            //06.06.2020
                            editsProvider: (uri) => {
                                return [{
                                        resource: uri,
                                        edit: {
                                            range: {
                                                startLineNumber: position.line + 1, startColumn: 0, endLineNumber: position.line + 1, endColumn: 0,
                                                message: "",
                                                severity: monaco.MarkerSeverity.Error
                                            },
                                            text: "\t\t" + methodCall + "\n"
                                        }
                                    }
                                ];
                            }
                        };
                    }
                    this.pushError("Die Basisklasse der Klasse " + c.identifier + " besitzt Konstruktoren, daher muss diese Konstruktordefinition mit einem Aufruf eines Konstruktors der Basisklasse (super(...)) beginnen.", methodNode.position, "error", quickFix);
                }
            }
        }
        let actorClass = this.moduleStore.getType("Actor").type;
        let methodIdentifiers = ["act", "onKeyTyped", "onKeyDown", "onKeyUp",
            "onMouseDown", "onMouseUp", "onMouseMove", "onMouseEnter", "onMouseLeave"];
        if (methodIdentifiers.indexOf(method.identifier) >= 0 && this.currentSymbolTable.classContext.hasAncestorOrIs(actorClass)) {
            this.pushStatements([
                {
                    type: TokenType.returnIfDestroyed,
                    position: methodNode.position
                },
            ]);
        }
        let withReturnStatement = this.generateStatements(methodNode.statements).withReturnStatement;
        if (!withReturnStatement) {
            this.pushStatements({
                type: TokenType.return,
                position: methodNode.scopeTo,
                copyReturnValueToStackframePos0: false,
                stepFinished: true,
                leaveThisObjectOnStack: false
            });
            let rt = method.getReturnType();
            if (!method.isConstructor && rt != null && rt != voidPrimitiveType) {
                this.pushError("Die Deklaration der Methode verlangt die Rückgabe eines Wertes vom Typ " + rt.identifier + ". Es fehlt (mindestens) eine entsprechende return-Anweisung.", methodNode.position);
            }
        }
        method.reserveStackForLocalVariables = this.nextFreeRelativeStackPos
            - methodNode.parameters.length - 1;
        this.popSymbolTable();
        this.currentProgram.labelManager.resolveNodes();
    }
    /**
     * checks if child classes have method with same signature
     */
    checkIfMethodIsVirtual(method) {
        let klass = this.currentSymbolTable.classContext;
        if (klass != null) {
            for (let mo of this.moduleStore.getModules(false)) {
                for (let c of mo.typeStore.typeList) {
                    if (c instanceof Klass && c != klass && c.hasAncestorOrIs(klass)) {
                        for (let m of c.methods) {
                            if (m != null && method != null && m.signature == method.signature) {
                                method.isVirtual = true;
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    initializeAttribute(attribute) {
        if (attribute == null)
            return;
        // assumption: attribute != null
        if (attribute.identifier == null || attribute.initialization == null)
            return;
        if (attribute.isStatic) {
            this.pushStatements({
                type: TokenType.pushStaticAttribute,
                attributeIndex: attribute.resolvedType.index,
                attributeIdentifier: attribute.resolvedType.identifier,
                position: attribute.initialization.position,
                klass: (this.currentSymbolTable.classContext)
            });
        }
        else {
            this.pushStatements({
                type: TokenType.pushAttribute,
                attributeIndex: attribute.resolvedType.index,
                attributeIdentifier: attribute.identifier,
                position: attribute.initialization.position,
                useThisObject: true
            });
        }
        let initializationType = this.processNode(attribute.initialization);
        if (initializationType != null && initializationType.type != null) {
            if (!this.ensureAutomaticCasting(initializationType.type, attribute.attributeType.resolvedType)) {
                if (attribute.attributeType.resolvedType == null) {
                    this.pushError("Der Datentyp von " + attribute.identifier + " konnte nicht ermittelt werden. ", attribute.position);
                }
                else {
                    this.pushError("Der Wert des Term vom Datentyp " + initializationType.type + " kann dem Attribut " + attribute.identifier + " vom Typ " + attribute.attributeType.resolvedType.identifier + " nicht zugewiesen werden.", attribute.initialization.position);
                }
            }
            this.pushStatements({
                type: TokenType.assignment,
                position: attribute.initialization.position,
                stepFinished: true,
                leaveValueOnStack: false
            });
        }
    }
    initCurrentProgram() {
        this.currentProgram = {
            module: this.module,
            statements: [],
            labelManager: null
        };
        this.currentProgram.labelManager = new LabelManager(this.currentProgram);
        this.lastStatement = null;
    }
    generateMain(isAdhocCompilation = false) {
        this.initCurrentProgram();
        let position = { line: 1, column: 1, length: 0 };
        let mainProgramAst = this.module.mainProgramAst;
        if (mainProgramAst != null && mainProgramAst.length > 0 && mainProgramAst[0] != null) {
            position = this.module.mainProgramAst[0].position;
        }
        if (!isAdhocCompilation) {
            this.pushNewSymbolTable(true, position, { line: 100000, column: 1, length: 0 }, this.currentProgram);
            this.heap = {};
        }
        this.module.mainProgram = this.currentProgram;
        let hasMainProgram = false;
        if (this.module.mainProgramAst != null && this.module.mainProgramAst.length > 0) {
            hasMainProgram = true;
            this.generateStatements(this.module.mainProgramAst);
            if (isAdhocCompilation && this.lastStatement != null && this.lastStatement.type == TokenType.decreaseStackpointer) {
                this.removeLastStatement();
            }
            this.lastPosition = this.module.mainProgramEnd;
            if (this.lastPosition == null)
                this.lastPosition = { line: 100000, column: 0, length: 0 };
            // if(this.lastPosition == null) this.lastPosition = {line: 100000, column: 0, length: 0};
            this.currentSymbolTable.positionTo = this.lastPosition;
            if (!isAdhocCompilation)
                this.popSymbolTable(this.currentProgram, true);
            this.heap = null;
            this.pushStatements({
                type: TokenType.programEnd,
                position: this.lastPosition,
                stepFinished: true,
                pauseAfterProgramEnd: true
            }, true);
        }
        this.currentProgram.labelManager.resolveNodes();
        if (!isAdhocCompilation && !hasMainProgram) {
            this.popSymbolTable(this.currentProgram);
            this.heap = null;
        }
    }
    ensureAutomaticCasting(typeFrom, typeTo, position, nodeFrom) {
        if (typeFrom == null)
            return false;
        if (typeFrom.equals(typeTo)) {
            return true;
        }
        if (typeFrom == null || typeTo == null)
            return false;
        if (!typeFrom.canCastTo(typeTo)) {
            if (typeTo == booleanPrimitiveType && nodeFrom != null) {
                this.checkIfAssignmentInstedOfEqual(nodeFrom);
            }
            return false;
        }
        if (typeFrom["unboxableAs"] != null && typeFrom["unboxableAs"].indexOf(typeTo) >= 0) {
            return true;
        }
        if (typeFrom instanceof Klass && typeTo == stringPrimitiveType) {
            let toStringStatement = this.getToStringStatement(typeFrom, position);
            if (toStringStatement != null) {
                this.pushStatements(toStringStatement);
                return true;
            }
            return false;
        }
        if (typeFrom instanceof PrimitiveType && (typeTo instanceof PrimitiveType || typeTo == stringPrimitiveType)) {
            let castInfo = typeFrom.getCastInformation(typeTo);
            if (!castInfo.automatic) {
                return false;
            }
            if (castInfo.needsStatement) {
                this.pushStatements({
                    type: TokenType.castValue,
                    newType: typeTo,
                    position: position
                });
            }
        }
        return true;
    }
    getToStringStatement(type, position) {
        let toStringMethod = type.getMethodBySignature("toString()");
        if (toStringMethod != null && toStringMethod.getReturnType() == stringPrimitiveType) {
            return {
                type: TokenType.callMethod,
                position: position,
                method: toStringMethod,
                isSuperCall: false,
                stackframeBegin: -1,
                stepFinished: false
            };
        }
        else {
            return null;
        }
    }
    checkIfAssignmentInstedOfEqual(nodeFrom, conditionType) {
        if (nodeFrom == null)
            return;
        if (nodeFrom.type == TokenType.binaryOp && nodeFrom.operator == TokenType.assignment) {
            let pos = nodeFrom.position;
            this.pushError("= ist der Zuweisungsoperator. Du willst sicher zwei Werte vergleichen. Dazu benötigst Du den Vergleichsoperator ==.", pos, conditionType == booleanPrimitiveType ? "warning" : "error", {
                title: '= durch == ersetzen',
                editsProvider: (uri) => {
                    return [{
                            resource: uri,
                            edit: {
                                range: {
                                    startLineNumber: pos.line, startColumn: pos.column, endLineNumber: pos.line, endColumn: pos.column + 1,
                                    message: "",
                                    severity: monaco.MarkerSeverity.Error
                                },
                                text: "=="
                            }
                        }
                    ];
                }
            });
        }
    }
    generateStatements(nodes) {
        if (nodes == null || nodes.length == 0 || nodes[0] == null)
            return { withReturnStatement: false };
        let withReturnStatement = this.processStatementsInsideBlock(nodes);
        let lastNode = nodes[nodes.length - 1];
        let endPosition;
        if (lastNode != null) {
            if (lastNode.type == TokenType.scopeNode) {
                endPosition = lastNode.positionTo;
            }
            else {
                endPosition = Object.assign({}, lastNode.position);
                if (endPosition != null) {
                    endPosition.column += endPosition.length;
                    endPosition.length = 1;
                }
            }
            this.lastPosition = endPosition;
        }
        else {
            endPosition = this.lastPosition;
        }
        return { withReturnStatement: withReturnStatement, endPosition: endPosition };
    }
    processStatementsInsideBlock(nodes) {
        let withReturnStatement = false;
        for (let node of nodes) {
            if (node == null)
                continue;
            let type = this.processNode(node);
            if (type != null && type.withReturnStatement != null && type.withReturnStatement) {
                withReturnStatement = true;
            }
            // If last Statement has value which is not used further then pop this value from stack.
            // e.g. statement 12 + 17 -7;
            // Parser issues a warning in this case, see Parser.checkIfStatementHasNoEffekt
            if (type != null && type.type != null && type.type != voidPrimitiveType) {
                if (this.lastStatement != null &&
                    this.lastStatement.type == TokenType.assignment && this.lastStatement.leaveValueOnStack) {
                    this.lastStatement.leaveValueOnStack = false;
                }
                else {
                    this.pushStatements({
                        type: TokenType.decreaseStackpointer,
                        position: null,
                        popCount: 1,
                        stepFinished: true
                    }, true);
                }
            }
        }
        return withReturnStatement;
    }
    insertStatements(pos, statements) {
        if (statements == null)
            return;
        if (!Array.isArray(statements))
            statements = [statements];
        for (let st of statements) {
            this.currentProgram.statements.splice(pos++, 0, st);
        }
    }
    pushStatements(statement, deleteStepFinishedFlagOnStepBefore = false) {
        if (statement == null)
            return;
        if (deleteStepFinishedFlagOnStepBefore && this.currentProgram.statements.length > 0) {
            let stepBefore = this.currentProgram.statements[this.currentProgram.statements.length - 1];
            stepBefore.stepFinished = false;
        }
        if (Array.isArray(statement)) {
            for (let st of statement) {
                this.currentProgram.statements.push(st);
                if (st.type == TokenType.return || st.type == TokenType.jumpAlways) {
                    if (this.lastStatement != null)
                        this.lastStatement.stepFinished = false;
                }
                if (st.position != null) {
                    this.lastPosition = st.position;
                }
                else {
                    st.position = this.lastPosition;
                }
                this.lastStatement = st;
            }
        }
        else {
            this.currentProgram.statements.push(statement);
            if (statement.type == TokenType.return || statement.type == TokenType.jumpAlways) {
                if (this.lastStatement != null)
                    this.lastStatement.stepFinished = false;
            }
            if (statement.position != null) {
                this.lastPosition = statement.position;
            }
            else {
                statement.position = this.lastPosition;
            }
            this.lastStatement = statement;
        }
    }
    removeLastStatement() {
        let lst = this.currentProgram.statements.pop();
        this.currentProgram.labelManager.removeNode(lst);
    }
    pushNewSymbolTable(beginNewStackframe, positionFrom, positionTo, program) {
        let st = new SymbolTable(this.currentSymbolTable, positionFrom, positionTo);
        this.symbolTableStack.push(this.currentSymbolTable);
        if (beginNewStackframe) {
            st.beginsNewStackframe = true;
            this.currentSymbolTable.stackframeSize = this.nextFreeRelativeStackPos;
            this.nextFreeRelativeStackPos = 0;
            if (program != null) {
                let initStackFrameNode = {
                    type: TokenType.initStackframe,
                    position: positionFrom,
                    reserveForLocalVariables: 0
                };
                program.statements.push(initStackFrameNode);
                this.initStackFrameNodes.push(initStackFrameNode);
            }
        }
        this.currentSymbolTable = st;
        return st;
    }
    popSymbolTable(program, deleteStepFinishedFlagOnStepBefore = false) {
        let st = this.currentSymbolTable;
        this.currentSymbolTable = this.symbolTableStack.pop();
        // if v.declarationError != null then variable has been used before initialization.
        st.variableMap.forEach(v => {
            if (v.declarationError != null && v.usedBeforeInitialization) {
                this.errorList.push(v.declarationError);
                v.declarationError = null;
            }
        });
        // if (!st.beginsNewStackframe && st.variableMap.size == 0 && removeI) {
        //     // empty symbol table => remove it!
        //     if (st.parent != null) {
        //         st.parent.childSymbolTables.pop();
        //     }
        // } else 
        {
            // TODO: add length of token
            if (st.beginsNewStackframe) {
                st.stackframeSize = this.nextFreeRelativeStackPos;
                this.nextFreeRelativeStackPos = this.currentSymbolTable.stackframeSize;
                if (program != null) {
                    let initStackframeNode = this.initStackFrameNodes.pop();
                    if (initStackframeNode != null)
                        initStackframeNode.reserveForLocalVariables = st.stackframeSize;
                    if (program.statements.length > 0 && deleteStepFinishedFlagOnStepBefore) {
                        let statement = program.statements[program.statements.length - 1];
                        // don't set stepFinished = false in jump-statements
                        // as this could lead to infinity-loop is user sets "while(true);" just before program end
                        if ([TokenType.jumpAlways, TokenType.jumpIfTrue, TokenType.jumpIfFalse, TokenType.jumpIfFalseAndLeaveOnStack, TokenType.jumpIfTrueAndLeaveOnStack].indexOf(statement.type) == -1) {
                            program.statements[program.statements.length - 1].stepFinished = false;
                        }
                    }
                    program.statements.push({
                        type: TokenType.closeStackframe,
                        position: st.positionTo
                    });
                }
            }
        }
    }
    pushError(text, position, errorLevel = "error", quickFix) {
        this.errorList.push({
            text: text,
            position: position,
            quickFix: quickFix,
            level: errorLevel
        });
    }
    openBreakScope() {
        this.breakNodeStack.push([]);
    }
    openContinueScope() {
        this.continueNodeStack.push([]);
    }
    pushBreakNode(breakNode) {
        if (this.breakNodeStack.length == 0) {
            this.pushError("Eine break-Anweisung ist nur innerhalb einer umgebenden Schleife oder switch-Anweisung sinnvoll.", breakNode.position);
        }
        else {
            this.breakNodeStack[this.breakNodeStack.length - 1].push(breakNode);
            this.pushStatements(breakNode);
        }
    }
    pushContinueNode(continueNode) {
        if (this.continueNodeStack.length == 0) {
            this.pushError("Eine continue-Anweisung ist nur innerhalb einer umgebenden Schleife oder switch-Anweisung sinnvoll.", continueNode.position);
        }
        else {
            this.continueNodeStack[this.continueNodeStack.length - 1].push(continueNode);
            this.pushStatements(continueNode);
        }
    }
    closeBreakScope(breakTargetLabel, lm) {
        let breakNodes = this.breakNodeStack.pop();
        for (let bn of breakNodes) {
            lm.registerJumpNode(bn, breakTargetLabel);
        }
    }
    closeContinueScope(continueTargetLabel, lm) {
        let continueNodes = this.continueNodeStack.pop();
        for (let bn of continueNodes) {
            lm.registerJumpNode(bn, continueTargetLabel);
        }
    }
    breakOccured() {
        return this.breakNodeStack.length > 0 && this.breakNodeStack[this.breakNodeStack.length - 1].length > 0;
    }
    processNode(node, isLeftSideOfAssignment = false) {
        if (node == null)
            return;
        switch (node.type) {
            case TokenType.binaryOp:
                return this.processBinaryOp(node);
            case TokenType.unaryOp:
                return this.processUnaryOp(node);
            case TokenType.pushConstant:
                return this.pushConstant(node);
            case TokenType.callMethod:
                return this.callMethod(node);
            case TokenType.identifier:
                {
                    let stackType = this.resolveIdentifier(node);
                    let v = node.variable;
                    if (v != null) {
                        if (isLeftSideOfAssignment) {
                            v.initialized = true;
                            if (!v.usedBeforeInitialization) {
                                v.declarationError = null;
                            }
                        }
                        else {
                            if (v.initialized != null && !v.initialized) {
                                v.usedBeforeInitialization = true;
                                this.pushError("Die Variable " + v.identifier + " wird hier benutzt bevor sie initialisiert wurde.", node.position, "info");
                            }
                        }
                    }
                    return stackType;
                }
            case TokenType.selectArrayElement:
                return this.selectArrayElement(node);
            case TokenType.incrementDecrementBefore:
            case TokenType.incrementDecrementAfter:
                return this.incrementDecrementBeforeOrAfter(node);
            case TokenType.superConstructorCall:
                return this.superconstructorCall(node);
            case TokenType.keywordThis:
                return this.pushThisOrSuper(node, false);
            case TokenType.keywordSuper:
                return this.pushThisOrSuper(node, true);
            case TokenType.pushAttribute:
                return this.pushAttribute(node);
            case TokenType.newObject:
                return this.newObject(node);
            case TokenType.keywordWhile:
                return this.processWhile(node);
            case TokenType.keywordDo:
                return this.processDo(node);
            case TokenType.keywordFor:
                return this.processFor(node);
            case TokenType.forLoopOverCollection:
                return this.processForLoopOverCollection(node);
            case TokenType.keywordIf:
                return this.processIf(node);
            case TokenType.keywordSwitch:
                return this.processSwitch(node);
            case TokenType.keywordReturn:
                return this.processReturn(node);
            case TokenType.localVariableDeclaration:
                return this.localVariableDeclaration(node);
            case TokenType.arrayInitialization:
                return this.processArrayLiteral(node);
            case TokenType.newArray:
                return this.processNewArray(node);
            case TokenType.keywordPrint:
            case TokenType.keywordPrintln:
                return this.processPrint(node);
            case TokenType.castValue:
                return this.processManualCast(node);
            case TokenType.keywordBreak:
                this.pushBreakNode({
                    type: TokenType.jumpAlways,
                    position: node.position
                });
                return null;
            case TokenType.keywordContinue:
                this.pushContinueNode({
                    type: TokenType.jumpAlways,
                    position: node.position
                });
                return null;
            case TokenType.rightBracket:
                let type = this.processNode(node.termInsideBrackets);
                if (type != null && type.type instanceof Klass)
                    this.pushTypePosition(node.position, type.type);
                return type;
            case TokenType.scopeNode:
                this.pushNewSymbolTable(false, node.position, node.positionTo);
                let withReturnStatement = this.processStatementsInsideBlock(node.statements);
                this.popSymbolTable();
                return { type: null, isAssignable: false, withReturnStatement: withReturnStatement };
        }
    }
    processManualCast(node) {
        let typeFrom1 = this.processNode(node.whatToCast);
        if (typeFrom1 == null || typeFrom1.type == null)
            return;
        let typeFrom = typeFrom1.type;
        if (typeFrom != null && node.castToType != null && node.castToType.resolvedType != null) {
            let typeTo = node.castToType.resolvedType;
            if (typeFrom.canCastTo(typeTo)) {
                if (typeFrom instanceof PrimitiveType && typeTo instanceof PrimitiveType) {
                    let castInfo = typeFrom.getCastInformation(typeTo);
                    if (castInfo.needsStatement) {
                        this.pushStatements({
                            type: TokenType.castValue,
                            position: node.position,
                            newType: typeTo
                        });
                    }
                }
                else if (typeFrom instanceof Klass && typeTo == stringPrimitiveType) {
                    let toStringMethod = typeFrom.getMethodBySignature("toString()");
                    if (toStringMethod != null && toStringMethod.getReturnType() == stringPrimitiveType) {
                        this.pushStatements({
                            type: TokenType.callMethod,
                            position: node.position,
                            method: toStringMethod,
                            isSuperCall: false,
                            stackframeBegin: -1,
                            stepFinished: false
                        });
                    }
                    else {
                        this.pushError("Der Datentyp " + typeFrom.identifier + " kann (zumindest durch casting) nicht in den Datentyp " + typeTo.identifier + " umgewandelt werden.", node.position);
                        this.pushStatements({
                            type: TokenType.castValue,
                            position: node.position,
                            newType: typeTo
                        });
                    }
                }
                return {
                    isAssignable: typeFrom1.isAssignable,
                    type: typeTo
                };
            }
            if ((typeFrom instanceof Klass || typeFrom instanceof Interface) && (typeTo instanceof Klass || typeTo instanceof Interface)) 
            // if (typeFrom instanceof Klass &&
            //     (typeTo instanceof Klass && !typeFrom.hasAncestorOrIs(typeTo) && typeTo.hasAncestorOrIs(typeFrom)) ||
            //     (typeTo instanceof Interface && !(<Klass>typeFrom).implementsInterface(typeTo))) 
            {
                this.pushStatements({
                    type: TokenType.checkCast,
                    position: node.position,
                    newType: typeTo,
                    stepFinished: false
                });
                return {
                    isAssignable: typeFrom1.isAssignable,
                    type: typeTo
                };
            }
            else {
                this.pushError("Der Datentyp " + typeFrom.identifier + " kann (zumindest durch casting) nicht in den Datentyp " + typeTo.identifier + " umgewandelt werden.", node.position);
            }
        }
    }
    processPrint(node) {
        var _a;
        let type = node.type == TokenType.keywordPrint ? TokenType.print : TokenType.println;
        this.module.pushMethodCallPosition(node.position, node.commaPositions, TokenTypeReadable[node.type], node.rightBracketPosition);
        if (node.text != null) {
            let type = this.processNode(node.text);
            if (type != null) {
                if (!this.ensureAutomaticCasting(type.type, stringPrimitiveType)) {
                    this.pushError("Die Methoden print und println erwarten einen Parameter vom Typ String. Gefunden wurde ein Wert vom Typ " + ((_a = type.type) === null || _a === void 0 ? void 0 : _a.identifier) + ".", node.position);
                }
            }
        }
        let withColor = false;
        if (node.color != null) {
            let type = this.processNode(node.color);
            if (type != null) {
                if (type.type != stringPrimitiveType && type.type != intPrimitiveType) {
                    if (!this.ensureAutomaticCasting(type.type, stringPrimitiveType)) {
                        this.pushError("Die Methoden print und println erwarten als Farbe einen Parameter vom Typ String oder int. Gefunden wurde ein Wert vom Typ " + type.type.identifier + ".", node.position);
                    }
                }
            }
            withColor = true;
        }
        this.pushStatements({
            type: type,
            position: node.position,
            empty: (node.text == null),
            stepFinished: true,
            withColor: withColor
        });
        return null;
    }
    processNewArray(node) {
        if (node.initialization != null) {
            return this.processArrayLiteral(node.initialization);
        }
        // int[7][2][] are 7 arrays each with arrays of length 2 which are empty
        let dimension = 0;
        for (let ec of node.elementCount) {
            if (ec != null) {
                this.processNode(ec); // push number of elements for this dimension on stack
                dimension++;
            }
            else {
                break;
            }
        }
        // for the array above: arrayType is array of array of int; dimension is 2; stack: 7 2
        this.pushStatements({
            type: TokenType.pushEmptyArray,
            position: node.position,
            arrayType: node.arrayType.resolvedType,
            dimension: dimension
        });
        return {
            isAssignable: false,
            type: node.arrayType.resolvedType
        };
    }
    processArrayLiteral(node) {
        let bes = {
            type: TokenType.beginArray,
            position: node.position,
            arrayType: node.arrayType.resolvedType
        };
        this.pushStatements(bes);
        for (let ain of node.nodes) {
            // Did an error occur when parsing a constant?
            if (ain == null) {
                continue;
            }
            if (ain.type == TokenType.arrayInitialization) {
                this.processArrayLiteral(ain);
            }
            else {
                let sType = this.processNode(ain);
                if (sType == null) {
                    return;
                }
                let targetType = node.arrayType.resolvedType.arrayOfType;
                if (!this.ensureAutomaticCasting(sType.type, targetType, ain.position)) {
                    this.pushError("Der Datentyp des Terms (" + sType.type.identifier + ") kann nicht in den Datentyp " + targetType.identifier + " konvertiert werden.", ain.position);
                }
            }
        }
        this.pushStatements({
            type: TokenType.addToArray,
            position: node.position,
            numberOfElementsToAdd: node.nodes.length
        });
        return {
            isAssignable: false,
            type: node.arrayType.resolvedType
        };
    }
    localVariableDeclaration(node, dontWarnWhenNoInitialization = false) {
        if (node.variableType.resolvedType == null) {
            node.variableType.resolvedType = nullType; // Make the best out of it...
        }
        let declareVariableOnHeap = (this.heap != null && this.symbolTableStack.length <= 2);
        let variable = {
            identifier: node.identifier,
            stackPos: declareVariableOnHeap ? null : this.nextFreeRelativeStackPos++,
            type: node.variableType.resolvedType,
            usagePositions: new Map(),
            declaration: { module: this.module, position: node.position },
            isFinal: node.isFinal
        };
        this.pushUsagePosition(node.position, variable);
        if (declareVariableOnHeap) {
            this.pushStatements({
                type: TokenType.heapVariableDeclaration,
                position: node.position,
                pushOnTopOfStackForInitialization: node.initialization != null,
                variable: variable,
                stepFinished: node.initialization == null
            });
            if (this.heap[variable.identifier]) {
                this.pushError("Die Variable " + node.identifier + " darf im selben Sichtbarkeitsbereich (Scope) nicht mehrmals definiert werden.", node.position);
            }
            this.heap[variable.identifier] = variable;
            // only for code completion:
            this.currentSymbolTable.variableMap.set(node.identifier, variable);
        }
        else {
            if (this.currentSymbolTable.variableMap.get(node.identifier)) {
                this.pushError("Die Variable " + node.identifier + " darf im selben Sichtbarkeitsbereich (Scope) nicht mehrmals definiert werden.", node.position);
            }
            this.currentSymbolTable.variableMap.set(node.identifier, variable);
            this.pushStatements({
                type: TokenType.localVariableDeclaration,
                position: node.position,
                pushOnTopOfStackForInitialization: node.initialization != null,
                variable: variable,
                stepFinished: node.initialization == null
            });
        }
        if (node.initialization != null) {
            let initType = this.processNode(node.initialization);
            if (initType != null) {
                if (variable.type == varType) {
                    variable.type = initType.type;
                }
                else if (initType.type == null) {
                    this.pushError("Der Typ des Terms auf der rechten Seite des Zuweisungsoperators (=) konnte nicht bestimmt werden.", node.initialization.position);
                }
                else if (!this.ensureAutomaticCasting(initType.type, variable.type)) {
                    this.pushError("Der Term vom Typ " + initType.type.identifier + " kann der Variable vom Typ " + variable.type.identifier + " nicht zugeordnet werden.", node.initialization.position);
                }
                ;
                this.pushStatements({
                    type: TokenType.assignment,
                    position: node.initialization.position,
                    stepFinished: true,
                    leaveValueOnStack: false
                });
            }
        }
        else {
            if (variable.type == varType) {
                this.pushError("Die Verwendung von var ist nur dann zulässig, wenn eine lokale Variable in einer Anweisung deklariert und initialisiert wird, also z.B. var i = 12;", node.variableType.position);
            }
            else {
                let initializer = " = null";
                if (variable.type == intPrimitiveType)
                    initializer = " = 0";
                if (variable.type == doublePrimitiveType)
                    initializer = " = 0.0";
                if (variable.type == booleanPrimitiveType)
                    initializer = " = false";
                if (variable.type == charPrimitiveType)
                    initializer = " = ' '";
                if (variable.type == stringPrimitiveType)
                    initializer = ' = ""';
                variable.declarationError = {
                    text: "Jede lokale Variable sollte vor ihrer ersten Verwendung initialisiert werden.",
                    position: node.position,
                    quickFix: {
                        title: initializer + " ergänzen",
                        editsProvider: (uri) => {
                            let pos = node.position;
                            return [
                                {
                                    resource: uri,
                                    edit: {
                                        range: { startLineNumber: pos.line, startColumn: pos.column + pos.length, endLineNumber: pos.line, endColumn: pos.column + pos.length },
                                        text: initializer
                                    }
                                }
                            ];
                        }
                    },
                    level: "info"
                };
                variable.usedBeforeInitialization = false;
                variable.initialized = dontWarnWhenNoInitialization;
            }
        }
        return null;
    }
    processReturn(node) {
        let method = this.currentSymbolTable.method;
        if (method == null) {
            this.pushError("Eine return-Anweisung ist nur im Kontext einer Methode erlaubt.", node.position);
            return null;
        }
        if (node.term != null) {
            if (method.getReturnType() == null) {
                this.pushError("Die Methode " + method.identifier + " erwartet keinen Rückgabewert.", node.position);
                return null;
            }
            let type = this.processNode(node.term);
            if (type != null) {
                if (!this.ensureAutomaticCasting(type.type, method.getReturnType(), null, node)) {
                    this.pushError("Die Methode " + method.identifier + " erwaret einen Rückgabewert vom Typ " + method.getReturnType().identifier + ". Gefunden wurde ein Wert vom Typ " + type.type.identifier + ".", node.position);
                }
            }
        }
        else {
            if (method.getReturnType() != null && method.getReturnType() != voidPrimitiveType) {
                this.pushError("Die Methode " + method.identifier + " erwartet einen Rückgabewert vom Typ " + method.getReturnType().identifier + ", daher ist die leere Return-Anweisung (return;) nicht ausreichend.", node.position);
            }
        }
        this.pushStatements({
            type: TokenType.return,
            position: node.position,
            copyReturnValueToStackframePos0: node.term != null,
            stepFinished: true,
            leaveThisObjectOnStack: false
        });
        return { type: null, isAssignable: false, withReturnStatement: true };
    }
    processSwitch(node) {
        let lm = this.currentProgram.labelManager;
        this.pushNewSymbolTable(false, node.scopeFrom, node.scopeTo);
        let ct = this.processNode(node.condition);
        if (ct == null || ct.type == null)
            return;
        let conditionType = ct.type;
        let isString = conditionType == stringPrimitiveType || conditionType == charPrimitiveType;
        let isInteger = conditionType == intPrimitiveType;
        let isEnum = conditionType instanceof Enum;
        if (!(isString || isInteger || isEnum)) {
            this.pushError("Der Unterscheidungsterms einer switch-Anweisung muss den Datentyp String, char, int oder enum besitzen. Dieser hier ist vom Typ " + conditionType.identifier, node.condition.position);
        }
        if (isEnum) {
            this.pushStatements({
                type: TokenType.castValue,
                position: node.condition.position,
                newType: intPrimitiveType
            });
        }
        let switchStatement = {
            type: TokenType.keywordSwitch,
            position: node.position,
            defaultDestination: null,
            switchType: isString ? "string" : "number",
            destinationLabels: [],
            destinationMap: {}
        };
        this.pushStatements(switchStatement);
        // if value not included in case-statement and no default-statement present:
        let endLabel = lm.insertJumpNode(TokenType.jumpAlways, node.position, this);
        switchStatement.stepFinished = true;
        lm.registerSwitchStatement(switchStatement);
        this.openBreakScope();
        let withReturnStatement = node.caseNodes.length > 0;
        for (let caseNode of node.caseNodes) {
            let isDefault = caseNode.caseTerm == null;
            if (!isDefault) {
                let constant = null;
                if (isEnum && caseNode.caseTerm.type == TokenType.identifier) {
                    let en = conditionType;
                    let info = en.identifierToInfoMap[caseNode.caseTerm.identifier];
                    if (info == null) {
                        this.pushError("Die Enum-Klasse " + conditionType.identifier + " hat kein Element mit dem Bezeichner " + caseNode.caseTerm.identifier, caseNode.position, "error");
                    }
                    else {
                        constant = info.ordinal;
                    }
                }
                else {
                    let caseTerm = this.processNode(caseNode.caseTerm);
                    let ls = this.lastStatement;
                    if (ls.type == TokenType.pushConstant) {
                        constant = ls.value;
                    }
                    if (ls.type == TokenType.pushEnumValue) {
                        constant = ls.enumClass.getOrdinal(ls.valueIdentifier);
                    }
                    this.removeLastStatement();
                }
                if (constant == null) {
                    this.pushError("Der Term bei case muss konstant sein.", caseNode.caseTerm.position);
                }
                let label = lm.markJumpDestination(1);
                let statements = this.generateStatements(caseNode.statements);
                if ((statements === null || statements === void 0 ? void 0 : statements.withReturnStatement) == null || !statements.withReturnStatement) {
                    withReturnStatement = false;
                }
                switchStatement.destinationLabels.push({
                    constant: constant,
                    label: label
                });
            }
            else {
                let label = lm.markJumpDestination(1);
                this.generateStatements(caseNode.statements);
                switchStatement.defaultDestination = label;
            }
        }
        lm.markJumpDestination(1, endLabel);
        this.closeBreakScope(endLabel, lm);
        this.popSymbolTable(null);
        return { type: null, isAssignable: false, withReturnStatement: withReturnStatement };
    }
    processIf(node) {
        let lm = this.currentProgram.labelManager;
        let conditionType = this.processNode(node.condition);
        this.checkIfAssignmentInstedOfEqual(node.condition, conditionType === null || conditionType === void 0 ? void 0 : conditionType.type);
        if (conditionType != null && conditionType.type != booleanPrimitiveType) {
            this.pushError("Der Wert des Terms in Klammern hinter 'if' muss den Datentyp boolean besitzen.", node.condition.position);
        }
        let beginElse = lm.insertJumpNode(TokenType.jumpIfFalse, null, this);
        let withReturnStatementIf = this.generateStatements(node.statementsIfTrue).withReturnStatement;
        let endOfIf;
        if (node.statementsIfFalse != null) {
            endOfIf = lm.insertJumpNode(TokenType.jumpAlways, null, this);
        }
        lm.markJumpDestination(1, beginElse);
        let withReturnStatementElse;
        if (node.statementsIfFalse == null || node.statementsIfFalse.length == 0) {
            withReturnStatementElse = false;
        }
        else {
            withReturnStatementElse = this.generateStatements(node.statementsIfFalse).withReturnStatement;
        }
        if (endOfIf != null) {
            lm.markJumpDestination(1, endOfIf);
        }
        return { type: null, isAssignable: false, withReturnStatement: withReturnStatementIf && withReturnStatementElse };
    }
    processFor(node) {
        let lm = this.currentProgram.labelManager;
        this.pushNewSymbolTable(false, node.scopeFrom, node.scopeTo);
        this.generateStatements(node.statementsBefore);
        let labelBeforeCondition = lm.markJumpDestination(1);
        let conditionType = this.processNode(node.condition);
        if (conditionType != null && conditionType.type != booleanPrimitiveType) {
            this.checkIfAssignmentInstedOfEqual(node.condition);
            this.pushError("Der Wert der Bedingung muss den Datentyp boolean besitzen.", node.condition.position);
        }
        let labelAfterForLoop = lm.insertJumpNode(TokenType.jumpIfFalse, null, this);
        this.openBreakScope();
        this.openContinueScope();
        let statements = this.generateStatements(node.statements);
        let withReturnStatement = statements.withReturnStatement;
        let continueLabelIndex = lm.markJumpDestination(1);
        this.closeContinueScope(continueLabelIndex, lm);
        this.generateStatements(node.statementsAfter);
        lm.insertJumpNode(TokenType.jumpAlways, statements.endPosition, this, labelBeforeCondition);
        lm.markJumpDestination(1, labelAfterForLoop);
        this.closeBreakScope(labelAfterForLoop, lm);
        this.popSymbolTable();
        return { type: null, isAssignable: false, withReturnStatement: withReturnStatement };
    }
    processForLoopOverCollection(node) {
        let lm = this.currentProgram.labelManager;
        this.pushNewSymbolTable(false, node.scopeFrom, node.scopeTo);
        // reserve position on stack for collection
        let stackPosForCollection = this.nextFreeRelativeStackPos++;
        // assign value of collection term to collection
        let ct = this.processNode(node.collection);
        if (ct == null)
            return;
        let collectionType = ct.type;
        this.pushStatements({
            type: TokenType.popAndStoreIntoVariable,
            position: node.collection.position,
            stackposOfVariable: stackPosForCollection,
            stepFinished: false
        });
        let collectionElementType;
        let kind = null;
        if (collectionType instanceof ArrayType) {
            collectionElementType = collectionType.arrayOfType;
            kind = "array";
        }
        else if (collectionType instanceof Klass && collectionType.getImplementedInterface("Iterable") != null) {
            if (collectionType.module.isSystemModule) {
                kind = "internalList";
            }
            else {
                kind = "userDefinedIterable";
            }
            let iterableInterface = collectionType.getImplementedInterface("Iterable");
            collectionElementType = collectionType.typeVariables[0].type;
        }
        else if (collectionType instanceof Klass && collectionType.identifier == "Group") {
            kind = "group";
            collectionElementType = this.moduleStore.getType("Shape").type;
        }
        else {
            this.pushError("Mit der vereinfachten for-Schleife (for identifier : collectionOrArray) kann man nur über Arrays oder Klassen, die das Interface Iterable implementieren, iterieren.", node.collection.position);
            return null;
        }
        let variableType = node.variableType.resolvedType;
        if (variableType == null)
            return null;
        let noCastingNeeded = variableType == varType;
        if (noCastingNeeded) {
            variableType = collectionElementType;
            node.variableType.resolvedType = collectionElementType;
        }
        else {
            if (!collectionElementType.canCastTo(variableType)) {
                this.pushError("Der ElementTyp " + collectionElementType.identifier + " der Collection kann nicht in den Typ " + variableType.identifier + " der Iterationsvariable " + node.variableIdentifier + " konvertiert werden.", node.position);
                return null;
            }
        }
        this.localVariableDeclaration({
            type: TokenType.localVariableDeclaration,
            identifier: node.variableIdentifier,
            initialization: null,
            isFinal: false,
            position: node.variablePosition,
            variableType: node.variableType
        }, true);
        let variableStackPos = this.nextFreeRelativeStackPos - 1;
        let stackPosOfCounterVariableOrIterator = this.nextFreeRelativeStackPos++;
        if (kind == "array" || kind == "internalList" || kind == "group") {
            this.pushStatements([{
                    type: TokenType.extendedForLoopInit,
                    position: node.position,
                    stepFinished: false,
                    stackPosOfCollection: stackPosForCollection,
                    stackPosOfElement: variableStackPos,
                    typeOfElement: variableType,
                    stackPosOfCounter: stackPosOfCounterVariableOrIterator
                }], true);
        }
        else {
            // get Iterator from collection
            this.pushStatements([
                {
                    type: TokenType.pushLocalVariableToStack,
                    position: node.position,
                    stackposOfVariable: stackPosOfCounterVariableOrIterator,
                    stepFinished: false
                },
                {
                    type: TokenType.pushLocalVariableToStack,
                    position: node.position,
                    stackposOfVariable: stackPosForCollection,
                    stepFinished: false
                },
                {
                    type: TokenType.callMethod,
                    position: node.position,
                    stepFinished: false,
                    isSuperCall: false,
                    method: collectionType.getMethod("iterator", new Parameterlist([])),
                    stackframeBegin: -1
                },
                {
                    type: TokenType.assignment,
                    position: node.position,
                    stepFinished: true,
                    leaveValueOnStack: false
                }
            ], true);
        }
        let labelBeforeCondition = lm.markJumpDestination(1);
        let labelAfterForLoop;
        let lastStatementBeforeCasting;
        if (kind == "array" || kind == "internalList" || kind == "group") {
            let jumpNode = {
                type: TokenType.extendedForLoopCheckCounterAndGetElement,
                kind: kind,
                position: node.variablePosition,
                stepFinished: true,
                stackPosOfCollection: stackPosForCollection,
                stackPosOfElement: variableStackPos,
                stackPosOfCounter: stackPosOfCounterVariableOrIterator,
                destination: 0 // gets filled in later,
            };
            lastStatementBeforeCasting = jumpNode;
            labelAfterForLoop = lm.registerJumpNode(jumpNode);
            this.pushStatements(jumpNode);
        }
        else {
            // call collection.hasNext()
            this.pushStatements([
                {
                    type: TokenType.pushLocalVariableToStack,
                    position: node.variablePosition,
                    stackposOfVariable: stackPosForCollection,
                    stepFinished: false
                },
                {
                    type: TokenType.callMethod,
                    position: node.position,
                    stepFinished: false,
                    isSuperCall: false,
                    method: collectionType.getMethod("hasNext", new Parameterlist([])),
                    stackframeBegin: -1
                },
            ]);
            labelAfterForLoop = lm.insertJumpNode(TokenType.jumpIfFalse, null, this);
            // call collection.next() and assign to loop variable
            this.pushStatements([
                {
                    type: TokenType.pushLocalVariableToStack,
                    position: node.position,
                    stackposOfVariable: variableStackPos,
                    stepFinished: false
                },
                {
                    type: TokenType.pushLocalVariableToStack,
                    position: node.position,
                    stackposOfVariable: stackPosForCollection,
                    stepFinished: false
                },
                {
                    type: TokenType.callMethod,
                    position: node.position,
                    stepFinished: false,
                    isSuperCall: false,
                    method: collectionType.getMethod("next", new Parameterlist([])),
                    stackframeBegin: -1
                },
                {
                    type: TokenType.assignment,
                    position: node.position,
                    stepFinished: true,
                    leaveValueOnStack: false
                }
            ]);
        }
        if (!noCastingNeeded) {
            let oldStatementCount = this.currentProgram.statements.length;
            this.pushStatements({
                type: TokenType.pushLocalVariableToStack,
                position: node.position,
                stackposOfVariable: variableStackPos,
                stepFinished: false
            });
            this.ensureAutomaticCasting(collectionElementType, variableType);
            if (this.currentProgram.statements.length < oldStatementCount + 2) {
                // casting needed no statement, so delete pushLocalVariabletoStack-Statement
                this.currentProgram.statements.pop();
            }
            else {
                this.pushStatements({
                    type: TokenType.popAndStoreIntoVariable,
                    stackposOfVariable: variableStackPos,
                    position: node.position,
                    stepFinished: true
                });
                lastStatementBeforeCasting.stepFinished = false;
            }
        }
        this.openBreakScope();
        this.openContinueScope();
        let statements = this.generateStatements(node.statements);
        let withReturnStatement = statements.withReturnStatement;
        let continueLabelIndex = lm.markJumpDestination(1);
        this.closeContinueScope(continueLabelIndex, lm);
        lm.insertJumpNode(TokenType.jumpAlways, statements.endPosition, this, labelBeforeCondition);
        lm.markJumpDestination(1, labelAfterForLoop);
        this.closeBreakScope(labelAfterForLoop, lm);
        this.popSymbolTable();
        return { type: null, isAssignable: false, withReturnStatement: withReturnStatement };
    }
    processWhile(node) {
        let lm = this.currentProgram.labelManager;
        this.pushNewSymbolTable(false, node.scopeFrom, node.scopeTo);
        let conditionBeginLabel = lm.markJumpDestination(1);
        let conditionType = this.processNode(node.condition);
        if (conditionType != null && conditionType.type != booleanPrimitiveType) {
            this.checkIfAssignmentInstedOfEqual(node.condition);
            this.pushError("Der Wert des Terms in Klammern hinter 'while' muss den Datentyp boolean besitzen.", node.condition.position);
        }
        let position = node.position;
        if (node.condition != null) {
            position = node.condition.position;
        }
        let afterWhileStatementLabel = lm.insertJumpNode(TokenType.jumpIfFalse, position, this);
        this.openBreakScope();
        this.openContinueScope();
        let statements = this.generateStatements(node.statements);
        let withReturnStatement = statements.withReturnStatement;
        this.closeContinueScope(conditionBeginLabel, lm);
        lm.insertJumpNode(TokenType.jumpAlways, statements.endPosition, this, conditionBeginLabel);
        lm.markJumpDestination(1, afterWhileStatementLabel);
        this.closeBreakScope(afterWhileStatementLabel, lm);
        this.popSymbolTable();
        return { type: null, isAssignable: false, withReturnStatement: withReturnStatement };
    }
    processDo(node) {
        let lm = this.currentProgram.labelManager;
        this.pushNewSymbolTable(false, node.scopeFrom, node.scopeTo);
        let statementsBeginLabel = lm.markJumpDestination(1);
        this.openBreakScope();
        this.openContinueScope();
        let statements = this.generateStatements(node.statements);
        let withReturnStatement = statements.withReturnStatement;
        let continueLabelIndex = lm.markJumpDestination(1);
        this.closeContinueScope(continueLabelIndex, lm);
        let conditionType = this.processNode(node.condition);
        if (conditionType != null && conditionType.type != booleanPrimitiveType) {
            this.checkIfAssignmentInstedOfEqual(node.condition);
            this.pushError("Der Wert des Terms in Klammern hinter 'while' muss den Datentyp boolean besitzen.", node.condition.position);
        }
        lm.insertJumpNode(TokenType.jumpIfTrue, statements.endPosition, this, statementsBeginLabel);
        let endLabel = lm.markJumpDestination(1);
        this.closeBreakScope(endLabel, lm);
        this.popSymbolTable();
        return { type: null, isAssignable: false, withReturnStatement: withReturnStatement };
    }
    newObject(node) {
        var _a;
        if (node.classType == null || node.classType.resolvedType == null)
            return null;
        let resolvedType = node.classType.resolvedType;
        if (!(resolvedType instanceof Klass)) {
            this.pushError(node.classType.identifier + " ist keine Klasse, daher kann davon mit 'new' kein Objekt erzeugt werden.", node.position);
            return null;
        }
        if (resolvedType.isAbstract) {
            this.pushError(`${node.classType.identifier} ist eine abstrakte Klasse, daher kann von ihr mit 'new' kein Objekt instanziert werden. Falls ${node.classType.identifier} nicht-abstrakte Kindklassen besitzt, könntest Du von DENEN mit new Objekte instanzieren...`, node.position);
            return null;
        }
        //this.pushTypePosition(node.rightBracketPosition, classType);
        if (resolvedType.module != this.module && resolvedType.visibility != Visibility.public) {
            this.pushError("Die Klasse " + resolvedType.identifier + " ist hier nicht sichtbar.", node.position);
        }
        let newStatement = {
            type: TokenType.newObject,
            position: node.position,
            class: resolvedType,
            subsequentConstructorCall: false,
            stepFinished: true
        };
        this.pushStatements(newStatement);
        this.pushTypePosition(node.rightBracketPosition, resolvedType); // to enable code completion when typing a point after the closing bracket
        let parameterTypes = [];
        let parameterStatements = [];
        let allStatements = this.currentProgram.statements;
        if (((_a = node.constructorOperands) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            for (let p of node.constructorOperands) {
                let programPointer = allStatements.length;
                let typeNode = this.processNode(p);
                parameterStatements.push(allStatements.splice(programPointer, allStatements.length - programPointer));
                if (typeNode == null) {
                    parameterTypes.push(voidPrimitiveType);
                }
                else {
                    parameterTypes.push(typeNode.type);
                }
            }
        }
        let upToVisibility = getVisibilityUpTo(resolvedType, this.currentSymbolTable.classContext);
        // let methods = resolvedType.getMethodsThatFitWithCasting(resolvedType.identifier,
        //     parameterTypes, true, upToVisibility);
        let methods = resolvedType.getConstructor(parameterTypes, upToVisibility);
        this.module.pushMethodCallPosition(node.position, node.commaPositions, resolvedType.getMethods(Visibility.public, resolvedType.identifier), node.rightBracketPosition);
        // if there's no parameterless constructor then return without error:
        if (parameterTypes.length > 0 || resolvedType.hasConstructor()) {
            if (methods.error != null) {
                this.pushError(methods.error, node.position);
                return { type: resolvedType, isAssignable: false }; // try to continue...
            }
            let method = methods.methodList[0];
            this.pushUsagePosition(node.position, method);
            let staticClassContext = null;
            let classContext = this.currentSymbolTable.classContext;
            if (classContext != null && classContext instanceof Klass) {
                staticClassContext = classContext.staticClass;
            }
            if (method.visibility == Visibility.private && resolvedType != classContext && resolvedType != staticClassContext) {
                this.pushError("Die Konstruktormethode ist private und daher hier nicht sichtbar.", node.position);
            }
            let destType = null;
            for (let i = 0; i < parameterTypes.length; i++) {
                if (i < method.getParameterCount()) { // possible ellipsis!
                    destType = method.getParameterType(i);
                    if (i == method.getParameterCount() - 1 && method.hasEllipsis()) {
                        destType = destType.arrayOfType;
                    }
                }
                let srcType = parameterTypes[i];
                for (let st of parameterStatements[i]) {
                    this.currentProgram.statements.push(st);
                }
                if (!this.ensureAutomaticCasting(srcType, destType, node.constructorOperands[i].position, node.constructorOperands[i])) {
                    this.pushError("Der Wert vom Datentyp " + srcType.identifier + " kann nicht als Parameter (Datentyp " + destType.identifier + ") verwendet werden.", node.constructorOperands[i].position);
                }
            }
            let stackframeDelta = 0;
            if (method.hasEllipsis()) {
                let ellipsisParameterCount = parameterTypes.length - method.getParameterCount() + 1; // last parameter and subsequent ones
                stackframeDelta = -(ellipsisParameterCount - 1);
                this.pushStatements({
                    type: TokenType.makeEllipsisArray,
                    position: node.constructorOperands[method.getParameterCount() - 1].position,
                    parameterCount: ellipsisParameterCount,
                    stepFinished: false,
                    arrayType: method.getParameter(method.getParameterCount() - 1).type
                });
            }
            this.pushStatements({
                type: TokenType.callMethod,
                method: method,
                position: node.position,
                isSuperCall: false,
                stepFinished: resolvedType.getPostConstructorCallbacks() == null,
                stackframeBegin: -(parameterTypes.length + 1 + stackframeDelta) // this-object followed by parameters
            }, true);
            newStatement.subsequentConstructorCall = true;
            newStatement.stepFinished = false;
        }
        if (resolvedType.getPostConstructorCallbacks() != null) {
            this.pushStatements({
                type: TokenType.processPostConstructorCallbacks,
                position: node.position,
                stepFinished: true
            }, true);
        }
        return { type: resolvedType, isAssignable: false };
    }
    pushAttribute(node) {
        if (node.object == null || node.identifier == null)
            return null;
        let ot = this.processNode(node.object);
        if (ot == null) {
            this.pushError('Links vom Punkt steht kein Objekt.', node.position);
            return null;
        }
        if (!(ot.type instanceof Klass || ot.type instanceof StaticClass || ot.type instanceof ArrayType)) {
            if (ot.type == null) {
                this.pushError('Der Ausdruck links vom Punkt hat kein Attribut ' + node.identifier + ".", node.position);
            }
            else {
                this.pushError('Links vom Punkt steht ein Ausdruck vom Datentyp ' + ot.type.identifier + ". Dieser hat kein Attribut " + node.identifier + ".", node.position);
            }
            return null;
        }
        let objectType = ot.type;
        if (objectType instanceof Klass) {
            let visibilityUpTo = getVisibilityUpTo(objectType, this.currentSymbolTable.classContext);
            let attributeWithError = objectType.getAttribute(node.identifier, visibilityUpTo);
            let staticAttributeWithError = null;
            if (attributeWithError.attribute == null) {
                staticAttributeWithError = objectType.staticClass.getAttribute(node.identifier, visibilityUpTo);
            }
            if (attributeWithError.attribute == null && staticAttributeWithError.attribute == null) {
                if (attributeWithError.foundButInvisible || !staticAttributeWithError.foundButInvisible) {
                    this.pushError(attributeWithError.error, node.position);
                }
                else {
                    this.pushError(staticAttributeWithError.error, node.position);
                }
                return {
                    type: objectType,
                    isAssignable: false
                };
            }
            else {
                let attribute;
                if (attributeWithError.attribute != null) {
                    this.pushStatements({
                        type: TokenType.pushAttribute,
                        position: node.position,
                        attributeIndex: attributeWithError.attribute.index,
                        attributeIdentifier: attributeWithError.attribute.identifier,
                        useThisObject: false
                    });
                    attribute = attributeWithError.attribute;
                }
                else {
                    this.pushStatements([{
                            type: TokenType.decreaseStackpointer,
                            position: node.position,
                            popCount: 1
                        }, {
                            type: TokenType.pushStaticAttribute,
                            position: node.position,
                            // klass: (<Klass>objectType).staticClass,
                            klass: staticAttributeWithError.staticClass,
                            attributeIndex: staticAttributeWithError.attribute.index,
                            attributeIdentifier: staticAttributeWithError.attribute.identifier
                        }]);
                    attribute = staticAttributeWithError.attribute;
                }
                this.pushUsagePosition(node.position, attribute);
                return {
                    type: attribute.type,
                    isAssignable: !attribute.isFinal
                };
            }
        }
        else if (objectType instanceof StaticClass) {
            // Static class
            if (objectType.Klass instanceof Enum) {
                this.removeLastStatement(); // remove push static enum class to stack
                let enumInfo = objectType.Klass.enumInfoList.find(ei => ei.identifier == node.identifier);
                if (enumInfo == null) {
                    this.pushError("Die enum-Klasse " + objectType.identifier + " hat keinen enum-Wert mit dem Bezeichner " + node.identifier, node.position);
                }
                this.pushStatements({
                    type: TokenType.pushEnumValue,
                    position: node.position,
                    enumClass: objectType.Klass,
                    valueIdentifier: node.identifier
                });
                return {
                    type: objectType.Klass,
                    isAssignable: false
                };
            }
            else {
                let upToVisibility = getVisibilityUpTo(objectType, this.currentSymbolTable.classContext);
                let staticAttributeWithError = objectType.getAttribute(node.identifier, upToVisibility);
                if (staticAttributeWithError.attribute != null) {
                    // if (staticAttributeWithError.attribute.updateValue != undefined) {
                    //     this.removeLastStatement();
                    //     this.pushStatements({
                    //         type: TokenType.pushStaticAttributeIntrinsic,
                    //         position: node.position,
                    //         attribute: staticAttributeWithError.attribute
                    //     });
                    // } else 
                    {
                        this.removeLastStatement();
                        this.pushStatements({
                            type: TokenType.pushStaticAttribute,
                            position: node.position,
                            attributeIndex: staticAttributeWithError.attribute.index,
                            attributeIdentifier: staticAttributeWithError.attribute.identifier,
                            klass: staticAttributeWithError.staticClass
                        });
                        this.pushUsagePosition(node.position, staticAttributeWithError.attribute);
                    }
                    return {
                        type: staticAttributeWithError.attribute.type,
                        isAssignable: !staticAttributeWithError.attribute.isFinal
                    };
                }
                else {
                    this.pushError(staticAttributeWithError.error, node.position);
                    return {
                        type: objectType,
                        isAssignable: false
                    };
                }
            }
        }
        else {
            if (node.identifier != "length") {
                this.pushError('Der Wert vom Datentyp ' + ot.type.identifier + " hat kein Attribut " + node.identifier, node.position);
                return null;
            }
            this.pushStatements({
                type: TokenType.pushArrayLength,
                position: node.position
            });
            let element = new Attribute("length", intPrimitiveType, null, true, Visibility.public, true, "Länge des Arrays");
            this.module.addIdentifierPosition(node.position, element);
            return {
                type: intPrimitiveType,
                isAssignable: false
            };
        }
    }
    pushThisOrSuper(node, isSuper) {
        let classContext = this.currentSymbolTable.classContext;
        if (isSuper && classContext != null) {
            classContext = classContext.baseClass;
        }
        let methodContext = this.currentSymbolTable.method;
        if (classContext == null || methodContext == null) {
            this.pushError("Das Objekt " + (isSuper ? "super" : "this") + " existiert nur innerhalb einer Methodendeklaration.", node.position);
            return null;
        }
        else {
            this.pushStatements({
                type: TokenType.pushLocalVariableToStack,
                position: node.position,
                stackposOfVariable: 0
            });
            this.pushTypePosition(node.position, classContext);
            return { type: classContext, isAssignable: false, isSuper: isSuper };
        }
    }
    superconstructorCall(node) {
        let classContext = this.currentSymbolTable.classContext;
        if ((classContext === null || classContext === void 0 ? void 0 : classContext.baseClass) == null || classContext.baseClass.identifier == "Object") {
            this.pushError("Die Klasse ist nur Kindklasse der Klasse Object, daher ist der Aufruf des Superkonstruktors nicht möglich.", node.position);
        }
        let methodContext = this.currentSymbolTable.method;
        if (classContext == null || methodContext == null || !methodContext.isConstructor) {
            this.pushError("Ein Aufruf des Superkonstructors ist nur innerhalb des Konstruktors einer Klasse möglich.", node.position);
            return null;
        }
        let superclassType = classContext.baseClass;
        if (superclassType instanceof StaticClass) {
            this.pushError("Statische Methoden haben keine super-Methoden.", node.position);
            return { type: null, isAssignable: false };
        }
        if (superclassType == null)
            superclassType = this.moduleStore.getType("Object").type;
        // Push this-object to stack:
        this.pushStatements({
            type: TokenType.pushLocalVariableToStack,
            position: node.position,
            stackposOfVariable: 0
        });
        let parameterTypes = [];
        if (node.operands != null) {
            let errorInOperands = false;
            for (let p of node.operands) {
                let pt = this.processNode(p);
                if (pt != null) {
                    parameterTypes.push(pt.type);
                }
                else {
                    errorInOperands = true;
                }
            }
            if (errorInOperands) {
                return { type: stringPrimitiveType, isAssignable: false }; // try to continue...
            }
        }
        let methods = superclassType.getConstructor(parameterTypes, Visibility.protected);
        this.module.pushMethodCallPosition(node.position, node.commaPositions, superclassType.getMethods(Visibility.protected, superclassType.identifier), node.rightBracketPosition);
        if (methods.error != null) {
            this.pushError(methods.error, node.position);
            return { type: stringPrimitiveType, isAssignable: false }; // try to continue...
        }
        let method = methods.methodList[0];
        this.pushUsagePosition(node.position, method);
        let stackframeDelta = 0;
        if (method.hasEllipsis()) {
            let ellipsisParameterCount = parameterTypes.length - method.getParameterCount() + 1; // last parameter and subsequent ones
            stackframeDelta = -(ellipsisParameterCount - 1);
            this.pushStatements({
                type: TokenType.makeEllipsisArray,
                position: node.operands[method.getParameterCount() - 1].position,
                parameterCount: ellipsisParameterCount,
                stepFinished: false,
                arrayType: method.getParameter(method.getParameterCount() - 1).type
            });
        }
        this.pushStatements({
            type: TokenType.callMethod,
            method: method,
            isSuperCall: true,
            position: node.position,
            stackframeBegin: -(parameterTypes.length + 1 + stackframeDelta) // this-object followed by parameters
        });
        // Pabst, 21.10.2020:
        // super method is constructor => returns nothing even iv method.getReturnType() is class object
        // return { type: method.getReturnType(), isAssignable: false };
        return { type: null, isAssignable: false };
    }
    incrementDecrementBeforeOrAfter(node) {
        let type = this.processNode(node.operand);
        if (type == null)
            return;
        if (!type.isAssignable) {
            this.pushError("Die Operatoren ++ und -- können nur auf Variablen angewendet werden, nicht auf konstante Werte oder Rückgabewerte von Methoden.", node.position);
            return type;
        }
        if (!type.type.canCastTo(floatPrimitiveType)) {
            this.pushError("Die Operatoren ++ und -- können nur auf Zahlen angewendet werden, nicht auf Werte des Datentyps " + type.type.identifier, node.position);
            return type;
        }
        this.pushStatements({
            type: node.type,
            position: node.position,
            incrementDecrementBy: node.operator == TokenType.doubleMinus ? -1 : 1
        });
        return type;
    }
    selectArrayElement(node) {
        let arrayType = this.processNode(node.object); // push array-object 
        let indexType = this.processNode(node.index); // push index
        if (arrayType == null || indexType == null)
            return;
        if (!(arrayType.type instanceof ArrayType)) {
            this.pushError("Der Typ der Variablen ist kein Array, daher ist [] nicht zulässig. ", node.object.position);
            return null;
        }
        this.module.addIdentifierPosition({
            line: node.position.line,
            column: node.position.column + node.position.length,
            length: 0 // Module.getTypeAtPosition needs length == 0 here to know that this type-position is not in static context for code completion
        }, arrayType.type.arrayOfType);
        if (!this.ensureAutomaticCasting(indexType.type, intPrimitiveType)) {
            this.pushError("Als Index eines Arrays wird ein ganzzahliger Wert erwartet. Gefunden wurde ein Wert vom Typ " + indexType.type.identifier + ".", node.index.position);
            return { type: arrayType.type.arrayOfType, isAssignable: arrayType.isAssignable };
        }
        this.pushStatements({
            type: TokenType.selectArrayElement,
            position: node.position
        });
        return { type: arrayType.type.arrayOfType, isAssignable: arrayType.isAssignable };
    }
    pushTypePosition(position, type) {
        if (position == null)
            return;
        if (position.length > 0) {
            position = {
                line: position.line,
                column: position.column + position.length,
                length: 0
            };
        }
        this.module.addIdentifierPosition(position, type);
    }
    pushUsagePosition(position, element) {
        this.module.addIdentifierPosition(position, element);
        if (element instanceof PrimitiveType) {
            return;
        }
        let positionList = element.usagePositions.get(this.module);
        if (positionList == null) {
            positionList = [];
            element.usagePositions.set(this.module, positionList);
        }
        positionList.push(position);
    }
    resolveIdentifier(node) {
        if (node.identifier == null)
            return null;
        let variable = this.findLocalVariable(node.identifier);
        if (variable != null) {
            this.pushStatements({
                type: TokenType.pushLocalVariableToStack,
                position: node.position,
                stackposOfVariable: variable.stackPos
            });
            this.pushUsagePosition(node.position, variable);
            node.variable = variable;
            return { type: variable.type, isAssignable: !variable.isFinal };
        }
        if (this.heap != null) {
            let variable = this.heap[node.identifier];
            if (variable != null) {
                this.pushStatements({
                    type: TokenType.pushFromHeapToStack,
                    position: node.position,
                    identifier: node.identifier
                });
                this.pushUsagePosition(node.position, variable);
                node.variable = variable;
                return { type: variable.type, isAssignable: !variable.isFinal };
            }
        }
        let attribute = this.findAttribute(node.identifier, node.position);
        if (attribute != null) {
            if (attribute.isStatic) {
                let cc = this.currentSymbolTable.classContext;
                let scc = (cc instanceof StaticClass) ? cc : cc.staticClass;
                while (scc != null && scc.attributes.indexOf(attribute) == -1) {
                    scc = scc.baseClass;
                }
                this.pushStatements({
                    type: TokenType.pushStaticAttribute,
                    position: node.position,
                    klass: scc,
                    attributeIndex: attribute.index,
                    attributeIdentifier: attribute.identifier
                });
            }
            else {
                this.pushStatements({
                    type: TokenType.pushAttribute,
                    position: node.position,
                    attributeIndex: attribute.index,
                    attributeIdentifier: attribute.identifier,
                    useThisObject: true
                });
            }
            this.pushUsagePosition(node.position, attribute);
            return { type: attribute.type, isAssignable: !attribute.isFinal };
        }
        let klassModule = this.moduleStore.getType(node.identifier);
        if (klassModule != null) {
            let klass = klassModule.type;
            if (!(klass instanceof Klass || klass instanceof Interface)) {
                this.pushError("Der Typ " + klass.identifier + " hat keine statischen Attribute/Methoden.", node.position);
            }
            else {
                this.pushStatements({
                    type: TokenType.pushStaticClassObject,
                    position: node.position,
                    klass: klass
                });
                this.pushUsagePosition(node.position, klass);
                return {
                    type: klass instanceof Klass ? klass.staticClass : klass,
                    isAssignable: false
                };
            }
            return {
                type: klass,
                isAssignable: false
            };
        }
        this.pushError("Der Bezeichner " + node.identifier + " ist hier nicht bekannt.", node.position);
    }
    findLocalVariable(identifier) {
        let st = this.currentSymbolTable;
        while (st != null) {
            let variable = st.variableMap.get(identifier);
            if (variable != null && variable.stackPos != null) {
                return variable;
            }
            st = st.parent;
        }
        return null;
    }
    findAttribute(identifier, position) {
        let classContext = this.currentSymbolTable.classContext;
        if (classContext == null) {
            return null;
        }
        let attribute = classContext.getAttribute(identifier, Visibility.private);
        if (attribute.attribute != null)
            return attribute.attribute;
        if (classContext instanceof Klass) {
            let staticAttribute = classContext.staticClass.getAttribute(identifier, Visibility.private);
            if (staticAttribute.attribute != null)
                return staticAttribute.attribute;
        }
        // this.pushError(attribute.error, position);
        return null;
    }
    callMethod(node) {
        let objectNode = null;
        if (node.object == null) {
            // call method of this-class?
            let thisClass = this.currentSymbolTable.classContext;
            if (thisClass != null) {
                this.pushStatements({
                    type: TokenType.pushLocalVariableToStack,
                    position: node.position,
                    stackposOfVariable: 0
                });
                objectNode = {
                    type: thisClass,
                    isAssignable: false
                };
            }
            else {
                this.pushError("Ein Methodenaufruf (hier: " + node.identifier +
                    ") ohne Punktschreibweise ist nur innerhalb anderer Methoden möglich.", node.position);
                return null;
            }
        }
        else {
            objectNode = this.processNode(node.object);
        }
        if (objectNode == null)
            return null;
        if (!((objectNode.type instanceof Klass) || (objectNode.type instanceof StaticClass) ||
            (objectNode.type instanceof Interface) || (objectNode.type instanceof Enum))) {
            if (objectNode.type == null) {
                this.pushError("Werte dieses Datentyps besitzen keine Methoden.", node.position);
            }
            else {
                this.pushError('Werte des Datentyps ' + objectNode.type.identifier + " besitzen keine Methoden.", node.position);
            }
            return null;
        }
        let objectType = objectNode.type;
        let posBeforeParameterEvaluation = this.currentProgram.statements.length;
        let parameterTypes = [];
        let parameterStatements = [];
        let allStatements = this.currentProgram.statements;
        if (node.operands != null) {
            for (let p of node.operands) {
                let programPointer = allStatements.length;
                let typeNode = this.processNode(p);
                parameterStatements.push(allStatements.splice(programPointer, allStatements.length - programPointer));
                if (typeNode == null) {
                    parameterTypes.push(voidPrimitiveType);
                }
                else {
                    parameterTypes.push(typeNode.type);
                }
            }
        }
        let methods;
        if (objectType instanceof Interface) {
            methods = objectType.getMethodsThatFitWithCasting(node.identifier, parameterTypes, false);
        }
        else {
            let upToVisibility = getVisibilityUpTo(objectType, this.currentSymbolTable.classContext);
            methods = objectType.getMethodsThatFitWithCasting(node.identifier, parameterTypes, false, upToVisibility);
        }
        this.module.pushMethodCallPosition(node.position, node.commaPositions, objectType.getMethods(Visibility.private, node.identifier), node.rightBracketPosition);
        if (methods.error != null) {
            this.pushError(methods.error, node.position);
            return { type: stringPrimitiveType, isAssignable: false }; // try to continue...
        }
        let method = methods.methodList[0];
        this.pushUsagePosition(node.position, method);
        // You CAN call a static method on a object..., so:
        if (method.isStatic && objectType instanceof Klass && objectType.identifier != "PrintStream") {
            this.pushError("Es ist kein guter Programmierstil, statische Methoden einer Klasse mithilfe eines Objekts aufzurufen. Besser wäre hier " + objectType.identifier + "." + method.identifier + "(...).", node.position, "info");
            this.insertStatements(posBeforeParameterEvaluation, [{
                    type: TokenType.decreaseStackpointer,
                    position: node.position,
                    popCount: 1
                },
                {
                    type: TokenType.pushStaticClassObject,
                    position: node.position,
                    klass: objectType
                }
            ]);
        }
        let destType = null;
        for (let i = 0; i < parameterTypes.length; i++) {
            if (i < method.getParameterCount()) { // possible ellipsis!
                destType = method.getParameterType(i);
                if (i == method.getParameterCount() - 1 && method.hasEllipsis()) {
                    destType = destType.arrayOfType;
                }
            }
            let srcType = parameterTypes[i];
            for (let st of parameterStatements[i]) {
                this.currentProgram.statements.push(st);
            }
            if (!this.ensureAutomaticCasting(srcType, destType, node.operands[i].position, node.operands[i])) {
                this.pushError("Der Wert vom Datentyp " + srcType.identifier + " kann nicht als Parameter (Datentyp " + destType.identifier + ") verwendet werden.", node.operands[i].position);
            }
            // if (srcType instanceof PrimitiveType && destType instanceof PrimitiveType) {
            //     if (srcType.getCastInformation(destType).needsStatement) {
            //         this.pushStatements({
            //             type: TokenType.castValue,
            //             position: null,
            //             newType: destType,
            //             stackPosRelative: -parameterTypes.length + 1 + i
            //         });
            //     }
            // }
        }
        let stackframeDelta = 0;
        if (method.hasEllipsis()) {
            let ellipsisParameterCount = parameterTypes.length - method.getParameterCount() + 1; // last parameter and subsequent ones
            stackframeDelta = -(ellipsisParameterCount - 1);
            this.pushStatements({
                type: TokenType.makeEllipsisArray,
                position: node.operands[method.getParameterCount() - 1].position,
                parameterCount: ellipsisParameterCount,
                stepFinished: false,
                arrayType: method.getParameter(method.getParameterCount() - 1).type
            });
        }
        if (method.visibility != Visibility.public) {
            let visible = true;
            let classContext = this.currentSymbolTable.classContext;
            if (classContext == null) {
                visible = false;
            }
            else {
                if (classContext != objectType &&
                    !(classContext instanceof Klass && classContext.implements.indexOf(objectType) > 0)) {
                    if (method.visibility == Visibility.private) {
                        visible = false;
                    }
                    else {
                        visible = classContext.hasAncestorOrIs(objectType);
                    }
                }
            }
            if (!visible) {
                this.pushError("Die Methode " + method.identifier + " ist an dieser Stelle des Programms nicht sichtbar.", node.position);
            }
        }
        if (method.isStatic && objectNode.type != null &&
            (objectNode.type instanceof StaticClass) &&
            (objectNode.type.Klass instanceof InputClass)) {
            this.pushStatements({
                type: TokenType.callInputMethod,
                method: method,
                position: node.position,
                stepFinished: true,
                stackframeBegin: -(parameterTypes.length + 1 + stackframeDelta) // this-object followed by parameters
            });
        }
        else {
            this.pushStatements({
                type: TokenType.callMethod,
                method: method,
                position: node.position,
                isSuperCall: objectNode.isSuper == null ? false : objectNode.isSuper,
                stepFinished: true,
                stackframeBegin: -(parameterTypes.length + 1 + stackframeDelta) // this-object followed by parameters
            });
        }
        this.pushTypePosition(node.rightBracketPosition, method.getReturnType());
        return { type: method.getReturnType(), isAssignable: false };
    }
    pushConstant(node) {
        let type;
        switch (node.constantType) {
            case TokenType.integerConstant:
                type = intPrimitiveType;
                break;
            case TokenType.booleanConstant:
                type = booleanPrimitiveType;
                break;
            case TokenType.floatingPointConstant:
                type = floatPrimitiveType;
                break;
            case TokenType.stringConstant:
                type = stringPrimitiveType;
                this.pushTypePosition(node.position, type);
                break;
            case TokenType.charConstant:
                type = charPrimitiveType;
                break;
            case TokenType.keywordNull:
                type = nullType;
                break;
        }
        this.pushStatements({
            type: TokenType.pushConstant,
            dataType: type,
            position: node.position,
            value: node.constant
        });
        return { type: type, isAssignable: false };
    }
    processBinaryOp(node) {
        let isAssignment = CodeGenerator.assignmentOperators.indexOf(node.operator) >= 0;
        if (node.operator == TokenType.ternaryOperator) {
            return this.processTernaryOperator(node);
        }
        let leftType = this.processNode(node.firstOperand, isAssignment);
        let programPosAfterLeftOpoerand = this.currentProgram.statements.length;
        let lazyEvaluationDest = null;
        if (node.operator == TokenType.and) {
            lazyEvaluationDest = this.currentProgram.labelManager.insertJumpNode(TokenType.jumpIfFalseAndLeaveOnStack, node.firstOperand.position, this);
        }
        else if (node.operator == TokenType.or) {
            lazyEvaluationDest = this.currentProgram.labelManager.insertJumpNode(TokenType.jumpIfTrueAndLeaveOnStack, node.firstOperand.position, this);
        }
        let rightType = this.processNode(node.secondOperand);
        if (leftType == null || leftType.type == null || rightType == null || rightType.type == null)
            return null;
        if (isAssignment) {
            if (!this.ensureAutomaticCasting(rightType.type, leftType.type, node.position, node.firstOperand)) {
                this.pushError("Der Wert vom Datentyp " + rightType.type.identifier + " auf der rechten Seite kann der Variablen auf der linken Seite (Datentyp " + leftType.type.identifier + ") nicht zugewiesen werden.", node.position);
                return leftType;
            }
            if (!leftType.isAssignable) {
                this.pushError("Dem Term/der Variablen auf der linken Seite des Zuweisungsoperators (=) kann kein Wert zugewiesen werden.", node.position);
            }
            let statement = {
                //@ts-ignore
                type: node.operator,
                position: node.position,
                stepFinished: true,
                leaveValueOnStack: true
            };
            this.pushStatements(statement);
            return leftType;
        }
        else {
            if (node.firstOperand.type == TokenType.identifier && node.firstOperand.variable != null) {
                let v = node.firstOperand.variable;
                if (v.initialized != null && !v.initialized) {
                    v.usedBeforeInitialization = true;
                    this.pushError("Die Variable " + v.identifier + " wird hier benutzt bevor sie initialisiert wurde.", node.position, "info");
                }
            }
            let resultType = leftType.type.getResultType(node.operator, rightType.type);
            let unboxableLeft = leftType.type["unboxableAs"];
            let unboxableRight = rightType.type["unboxableAs"];
            if (resultType == null && (unboxableLeft != null || unboxableRight != null)) {
                let leftTypes = unboxableLeft == null ? [leftType.type] : unboxableLeft;
                let rightTypes = unboxableRight == null ? [rightType.type] : unboxableRight;
                for (let lt of leftTypes) {
                    for (let rt of rightTypes) {
                        resultType = lt.getResultType(node.operator, rt);
                        if (resultType != null) {
                            leftType.type = lt;
                            rightType.type = rt;
                            break;
                        }
                    }
                    if (resultType != null)
                        break;
                }
            }
            // Situation Object + String: insert toString()-Method
            if (resultType == null && node.operator == TokenType.plus) {
                if (leftType.type instanceof Klass && rightType.type == stringPrimitiveType) {
                    this.insertStatements(programPosAfterLeftOpoerand, this.getToStringStatement(leftType.type, node.firstOperand.position));
                    resultType = stringPrimitiveType;
                }
                else if (rightType.type instanceof Klass && leftType.type == stringPrimitiveType) {
                    this.pushStatements(this.getToStringStatement(rightType.type, node.firstOperand.position));
                    resultType = stringPrimitiveType;
                }
            }
            if (node.operator in [TokenType.and, TokenType.or]) {
                this.checkIfAssignmentInstedOfEqual(node.firstOperand);
                this.checkIfAssignmentInstedOfEqual(node.secondOperand);
            }
            if (resultType == null) {
                let bitOperators = [TokenType.ampersand, TokenType.OR];
                let booleanOperators = ["&& (boolescher UND-Operator)", "|| (boolescher ODER-Operator)"];
                let betterOperators = ["& &", "||"];
                let opIndex = bitOperators.indexOf(node.operator);
                if (opIndex >= 0 && leftType.type == booleanPrimitiveType && rightType.type == booleanPrimitiveType) {
                    this.pushError("Die Operation " + TokenTypeReadable[node.operator] + " ist für die Operanden der Typen " + leftType.type.identifier + " und " + rightType.type.identifier + " nicht definiert. Du meintest wahrscheinlich den Operator " + booleanOperators[opIndex] + ".", node.position, "error", {
                        title: "Operator " + betterOperators[opIndex] + " verwenden statt " + TokenTypeReadable[node.operator],
                        editsProvider: (uri) => {
                            return [
                                {
                                    resource: uri,
                                    edit: {
                                        range: { startLineNumber: node.position.line, startColumn: node.position.column, endLineNumber: node.position.line, endColumn: node.position.column },
                                        text: TokenTypeReadable[node.operator]
                                    }
                                }
                            ];
                        }
                    });
                }
                else {
                    this.pushError("Die Operation " + TokenTypeReadable[node.operator] + " ist für die Operanden der Typen " + leftType.type.identifier + " und " + rightType.type.identifier + " nicht definiert.", node.position);
                }
                return leftType;
            }
            this.pushStatements({
                type: TokenType.binaryOp,
                leftType: leftType.type,
                operator: node.operator,
                position: node.position
            });
            if (lazyEvaluationDest != null) {
                this.currentProgram.labelManager.markJumpDestination(1, lazyEvaluationDest);
            }
            return { type: resultType, isAssignable: false };
        }
    }
    processTernaryOperator(node) {
        let leftType = this.processNode(node.firstOperand);
        if (leftType == null)
            return;
        if (this.ensureAutomaticCasting(leftType.type, booleanPrimitiveType, null, node.firstOperand)) {
            let secondOperand = node.secondOperand;
            if (secondOperand != null) {
                if (secondOperand.type != TokenType.binaryOp || secondOperand.operator != TokenType.colon) {
                    this.pushError("Auf den Fragezeichenoperator müssen - mit Doppelpunkt getrennt - zwei Alternativterme folgen.", node.position);
                }
                else {
                    let lm = this.currentProgram.labelManager;
                    let variantFalseLabel = lm.insertJumpNode(TokenType.jumpIfFalse, node.position, this);
                    let firstType = this.processNode(secondOperand.firstOperand);
                    let endLabel = lm.insertJumpNode(TokenType.jumpAlways, secondOperand.firstOperand.position, this);
                    lm.markJumpDestination(1, variantFalseLabel);
                    let secondType = this.processNode(secondOperand.secondOperand);
                    lm.markJumpDestination(1, endLabel);
                    let type = firstType.type;
                    if (type != secondType.type && type.canCastTo(secondType.type)) {
                        type = secondType.type;
                    }
                    return {
                        type: type,
                        isAssignable: false
                    };
                }
            }
        }
    }
    processUnaryOp(node) {
        let leftType = this.processNode(node.operand);
        if (leftType == null || leftType.type == null)
            return;
        if (node.operator == TokenType.minus) {
            if (!leftType.type.canCastTo(floatPrimitiveType)) {
                this.pushError("Der Operator - ist für den Typ " + leftType.type.identifier + " nicht definiert.", node.position);
                return leftType;
            }
        }
        if (node.operator == TokenType.not) {
            if (!(leftType.type == booleanPrimitiveType)) {
                this.checkIfAssignmentInstedOfEqual(node.operand);
                this.pushError("Der Operator ! ist für den Typ " + leftType.type.identifier + " nicht definiert.", node.position);
                return leftType;
            }
        }
        this.pushStatements({
            type: TokenType.unaryOp,
            operator: node.operator,
            position: node.position
        });
        return leftType;
    }
}
CodeGenerator.assignmentOperators = [TokenType.assignment, TokenType.plusAssignment, TokenType.minusAssignment,
    TokenType.multiplicationAssignment, TokenType.divisionAssignment, TokenType.ANDAssigment, TokenType.ORAssigment,
    TokenType.XORAssigment, TokenType.shiftLeftAssigment, TokenType.shiftRightAssigment, TokenType.shiftRightUnsignedAssigment];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29kZUdlbmVyYXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jbGllbnQvY29tcGlsZXIvcGFyc2VyL0NvZGVHZW5lcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFnQixTQUFTLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUMvRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDOUMsT0FBTyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQ2pHLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBYyxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDdk4sT0FBTyxFQUFFLFNBQVMsRUFBeUIsYUFBYSxFQUFnQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUVwSixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFHakQsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxJQUFJLEVBQVksTUFBTSxrQkFBa0IsQ0FBQztBQUNsRCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFTM0QsTUFBTSxPQUFPLGFBQWE7SUFBMUI7UUE4NkJJLHdCQUFtQixHQUE4QixFQUFFLENBQUM7SUF3cEV4RCxDQUFDO0lBL2lHRyxxQkFBcUIsQ0FBQyxNQUFjLEVBQUUsV0FBd0IsRUFBRSxXQUF3QixFQUFFLElBQVU7UUFFaEcsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1B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WSxFQUFFLFNBQVMsQ0FBQyxrQkFBa0IsRUFBRSxTQUFTLENBQUMsbUJBQW1CLEVBQUUsU0FBUyxDQUFDLDJCQUEyQixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFcnJvciwgUXVpY2tGaXgsIEVycm9yTGV2ZWwgfSBmcm9tIFwiLi4vbGV4ZXIvTGV4ZXIuanNcIjtcclxuaW1wb3J0IHsgVGV4dFBvc2l0aW9uLCBUb2tlblR5cGUsIFRva2VuVHlwZVJlYWRhYmxlIH0gZnJvbSBcIi4uL2xleGVyL1Rva2VuLmpzXCI7XHJcbmltcG9ydCB7IEFycmF5VHlwZSB9IGZyb20gXCIuLi90eXBlcy9BcnJheS5qc1wiO1xyXG5pbXBvcnQgeyBLbGFzcywgSW50ZXJmYWNlLCBTdGF0aWNDbGFzcywgVmlzaWJpbGl0eSwgZ2V0VmlzaWJpbGl0eVVwVG8gfSBmcm9tIFwiLi4vdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgYm9vbGVhblByaW1pdGl2ZVR5cGUsIGNoYXJQcmltaXRpdmVUeXBlLCBmbG9hdFByaW1pdGl2ZVR5cGUsIGludFByaW1pdGl2ZVR5cGUsIHN0cmluZ1ByaW1pdGl2ZVR5cGUsIG9iamVjdFR5cGUsIG51bGxUeXBlLCB2b2lkUHJpbWl0aXZlVHlwZSwgdmFyVHlwZSwgZG91YmxlUHJpbWl0aXZlVHlwZSB9IGZyb20gXCIuLi90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBBdHRyaWJ1dGUsIFR5cGUsIFZhcmlhYmxlLCBWYWx1ZSwgUHJpbWl0aXZlVHlwZSwgVXNhZ2VQb3NpdGlvbnMsIE1ldGhvZCwgSGVhcCwgZ2V0VHlwZUlkZW50aWZpZXIsIFBhcmFtZXRlcmxpc3QgfSBmcm9tIFwiLi4vdHlwZXMvVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgQVNUTm9kZSwgQXR0cmlidXRlRGVjbGFyYXRpb25Ob2RlLCBCaW5hcnlPcE5vZGUsIENsYXNzRGVjbGFyYXRpb25Ob2RlLCBDb25zdGFudE5vZGUsIERvV2hpbGVOb2RlLCBGb3JOb2RlLCBJZGVudGlmaWVyTm9kZSwgSWZOb2RlLCBJbmNyZW1lbnREZWNyZW1lbnROb2RlLCBNZXRob2RjYWxsTm9kZSwgTWV0aG9kRGVjbGFyYXRpb25Ob2RlLCBOZXdPYmplY3ROb2RlLCBSZXR1cm5Ob2RlLCBTZWxlY3RBcnJheUVsZW1lbnROb2RlLCBTZWxlY3RBcnJpYnV0ZU5vZGUsIFN1cGVyY29uc3RydWN0b3JDYWxsTm9kZSwgU3VwZXJOb2RlLCBUaGlzTm9kZSwgVW5hcnlPcE5vZGUsIFdoaWxlTm9kZSwgTG9jYWxWYXJpYWJsZURlY2xhcmF0aW9uTm9kZSwgQXJyYXlJbml0aWFsaXphdGlvbk5vZGUsIE5ld0FycmF5Tm9kZSwgUHJpbnROb2RlLCBDYXN0TWFudWFsbHlOb2RlLCBFbnVtRGVjbGFyYXRpb25Ob2RlLCBUZXJtTm9kZSwgU3dpdGNoTm9kZSwgU2NvcGVOb2RlLCBQYXJhbWV0ZXJOb2RlLCBGb3JOb2RlT3ZlckNvbGxlY2lvbiB9IGZyb20gXCIuL0FTVC5qc1wiO1xyXG5pbXBvcnQgeyBMYWJlbE1hbmFnZXIgfSBmcm9tIFwiLi9MYWJlbE1hbmFnZXIuanNcIjtcclxuaW1wb3J0IHsgTW9kdWxlLCBNb2R1bGVTdG9yZSwgTWV0aG9kQ2FsbFBvc2l0aW9uIH0gZnJvbSBcIi4vTW9kdWxlLmpzXCI7XHJcbmltcG9ydCB7IEFzc2lnbm1lbnRTdGF0ZW1lbnQsIEluaXRTdGFja2ZyYW1lU3RhdGVtZW50LCBKdW1wQWx3YXlzU3RhdGVtZW50LCBQcm9ncmFtLCBTdGF0ZW1lbnQsIEJlZ2luQXJyYXlTdGF0ZW1lbnQsIE5ld09iamVjdFN0YXRlbWVudCwgSnVtcE9uU3dpdGNoU3RhdGVtZW50LCBCcmVha3BvaW50LCBFeHRlbmRlZEZvckxvb3BDaGVja0NvdW50ZXJBbmRHZXRFbGVtZW50IH0gZnJvbSBcIi4vUHJvZ3JhbS5qc1wiO1xyXG5pbXBvcnQgeyBTeW1ib2xUYWJsZSB9IGZyb20gXCIuL1N5bWJvbFRhYmxlLmpzXCI7XHJcbmltcG9ydCB7IEVudW0sIEVudW1JbmZvIH0gZnJvbSBcIi4uL3R5cGVzL0VudW0uanNcIjtcclxuaW1wb3J0IHsgSW5wdXRDbGFzcyB9IGZyb20gXCIuLi8uLi9ydW50aW1lbGlicmFyeS9JbnB1dC5qc1wiO1xyXG5cclxudHlwZSBTdGFja1R5cGUgPSB7XHJcbiAgICB0eXBlOiBUeXBlLFxyXG4gICAgaXNBc3NpZ25hYmxlOiBib29sZWFuLFxyXG4gICAgaXNTdXBlcj86IGJvb2xlYW4sIC8vIHVzZWQgZm9yIG1ldGhvZCBjYWxscyB3aXRoIHN1cGVyLlxyXG4gICAgd2l0aFJldHVyblN0YXRlbWVudD86IGJvb2xlYW5cclxufTtcclxuXHJcbmV4cG9ydCBjbGFzcyBDb2RlR2VuZXJhdG9yIHtcclxuXHJcbiAgICBzdGF0aWMgYXNzaWdubWVudE9wZXJhdG9ycyA9IFtUb2tlblR5cGUuYXNzaWdubWVudCwgVG9rZW5UeXBlLnBsdXNBc3NpZ25tZW50LCBUb2tlblR5cGUubWludXNBc3NpZ25tZW50LCBcclxuICAgICAgICBUb2tlblR5cGUubXVsdGlwbGljYXRpb25Bc3NpZ25tZW50LCBUb2tlblR5cGUuZGl2aXNpb25Bc3NpZ25tZW50LCBUb2tlblR5cGUuQU5EQXNzaWdtZW50LCBUb2tlblR5cGUuT1JBc3NpZ21lbnQsXHJcbiAgICBUb2tlblR5cGUuWE9SQXNzaWdtZW50LCBUb2tlblR5cGUuc2hpZnRMZWZ0QXNzaWdtZW50LCBUb2tlblR5cGUuc2hpZnRSaWdodEFzc2lnbWVudCwgVG9rZW5UeXBlLnNoaWZ0UmlnaHRVbnNpZ25lZEFzc2lnbWVudF07XHJcblxyXG4gICAgbW9kdWxlU3RvcmU6IE1vZHVsZVN0b3JlO1xyXG4gICAgbW9kdWxlOiBNb2R1bGU7XHJcblxyXG4gICAgc3ltYm9sVGFibGVTdGFjazogU3ltYm9sVGFibGVbXTtcclxuICAgIGN1cnJlbnRTeW1ib2xUYWJsZTogU3ltYm9sVGFibGU7XHJcblxyXG4gICAgaGVhcDogSGVhcDtcclxuXHJcbiAgICBjdXJyZW50UHJvZ3JhbTogUHJvZ3JhbTtcclxuXHJcbiAgICBlcnJvckxpc3Q6IEVycm9yW107XHJcblxyXG4gICAgbmV4dEZyZWVSZWxhdGl2ZVN0YWNrUG9zOiBudW1iZXI7XHJcblxyXG4gICAgYnJlYWtOb2RlU3RhY2s6IEp1bXBBbHdheXNTdGF0ZW1lbnRbXVtdO1xyXG4gICAgY29udGludWVOb2RlU3RhY2s6IEp1bXBBbHdheXNTdGF0ZW1lbnRbXVtdO1xyXG5cclxuICAgIHN0YXJ0QWRob2NDb21waWxhdGlvbihtb2R1bGU6IE1vZHVsZSwgbW9kdWxlU3RvcmU6IE1vZHVsZVN0b3JlLCBzeW1ib2xUYWJsZTogU3ltYm9sVGFibGUsIGhlYXA6IEhlYXApOiBFcnJvcltdIHtcclxuXHJcbiAgICAgICAgdGhpcy5tb2R1bGVTdG9yZSA9IG1vZHVsZVN0b3JlO1xyXG4gICAgICAgIHRoaXMubW9kdWxlID0gbW9kdWxlO1xyXG5cclxuICAgICAgICB0aGlzLnN5bWJvbFRhYmxlU3RhY2sgPSBbXTtcclxuICAgICAgICB0aGlzLnN5bWJvbFRhYmxlU3RhY2sucHVzaChzeW1ib2xUYWJsZSk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50U3ltYm9sVGFibGUgPSBzeW1ib2xUYWJsZTtcclxuXHJcbiAgICAgICAgdGhpcy5oZWFwID0gaGVhcDtcclxuXHJcbiAgICAgICAgbGV0IG9sZFN0YWNrZnJhbWVTaXplID0gc3ltYm9sVGFibGUuc3RhY2tmcmFtZVNpemU7XHJcbiAgICAgICAgdGhpcy5uZXh0RnJlZVJlbGF0aXZlU3RhY2tQb3MgPSBvbGRTdGFja2ZyYW1lU2l6ZTtcclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5lcnJvckxpc3QgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5icmVha05vZGVTdGFjayA9IFtdO1xyXG4gICAgICAgIHRoaXMuY29udGludWVOb2RlU3RhY2sgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5nZW5lcmF0ZU1haW4odHJ1ZSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmVycm9yTGlzdDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnQobW9kdWxlOiBNb2R1bGUsIG1vZHVsZVN0b3JlOiBNb2R1bGVTdG9yZSkge1xyXG5cclxuICAgICAgICB0aGlzLm1vZHVsZVN0b3JlID0gbW9kdWxlU3RvcmU7XHJcbiAgICAgICAgdGhpcy5tb2R1bGUgPSBtb2R1bGU7XHJcblxyXG4gICAgICAgIHRoaXMuc3ltYm9sVGFibGVTdGFjayA9IFtdO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlID0gbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5lcnJvckxpc3QgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0RnJlZVJlbGF0aXZlU3RhY2tQb3MgPSAwO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5tb2R1bGUudG9rZW5MaXN0Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgbGV0IGxhc3RUb2tlbiA9IHRoaXMubW9kdWxlLnRva2VuTGlzdFt0aGlzLm1vZHVsZS50b2tlbkxpc3QubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgICAgIHRoaXMubW9kdWxlLm1haW5TeW1ib2xUYWJsZS5wb3NpdGlvblRvID0geyBsaW5lOiBsYXN0VG9rZW4ucG9zaXRpb24ubGluZSwgY29sdW1uOiBsYXN0VG9rZW4ucG9zaXRpb24uY29sdW1uICsgMSwgbGVuZ3RoOiAxIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN5bWJvbFRhYmxlU3RhY2sucHVzaCh0aGlzLm1vZHVsZS5tYWluU3ltYm9sVGFibGUpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlID0gdGhpcy5tb2R1bGUubWFpblN5bWJvbFRhYmxlO1xyXG5cclxuICAgICAgICB0aGlzLmJyZWFrTm9kZVN0YWNrID0gW107XHJcbiAgICAgICAgdGhpcy5jb250aW51ZU5vZGVTdGFjayA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmdlbmVyYXRlTWFpbigpO1xyXG5cclxuICAgICAgICB0aGlzLmdlbmVyYXRlQ2xhc3NlcygpO1xyXG5cclxuICAgICAgICB0aGlzLmxvb2tGb3JTdGF0aWNWb2lkTWFpbigpO1xyXG5cclxuICAgICAgICB0aGlzLm1vZHVsZS5lcnJvcnNbM10gPSB0aGlzLmVycm9yTGlzdDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgbG9va0ZvclN0YXRpY1ZvaWRNYWluKCkge1xyXG5cclxuICAgICAgICBsZXQgbWFpblByb2dyYW0gPSB0aGlzLm1vZHVsZS5tYWluUHJvZ3JhbTtcclxuXHJcbiAgICAgICAgaWYgKG1haW5Qcm9ncmFtICE9IG51bGwgJiYgbWFpblByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGggPiAyKSByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBtYWluTWV0aG9kOiBNZXRob2QgPSBudWxsO1xyXG4gICAgICAgIGxldCBzdGF0aWNDbGFzczogU3RhdGljQ2xhc3MgPSBudWxsO1xyXG4gICAgICAgIGxldCBjbGFzc05vZGUxOiBBU1ROb2RlO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjbGFzc05vZGUgb2YgdGhpcy5tb2R1bGUuY2xhc3NEZWZpbml0aW9uc0FTVCkge1xyXG4gICAgICAgICAgICBpZiAoY2xhc3NOb2RlLnR5cGUgPT0gVG9rZW5UeXBlLmtleXdvcmRDbGFzcykge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBjdCA9IGNsYXNzTm9kZS5yZXNvbHZlZFR5cGU7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbSBvZiBjdC5zdGF0aWNDbGFzcy5tZXRob2RzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG0uaWRlbnRpZmllciA9PSBcIm1haW5cIiAmJiBtLnBhcmFtZXRlcmxpc3QucGFyYW1ldGVycy5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHQgPSBtLnBhcmFtZXRlcmxpc3QucGFyYW1ldGVyc1swXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHB0LnR5cGUgaW5zdGFuY2VvZiBBcnJheVR5cGUgJiYgcHQudHlwZS5hcnJheU9mVHlwZSA9PSBzdHJpbmdQcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWFpbk1ldGhvZCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJFcyBleGlzdGllcmVuIG1laHJlcmUgS2xhc3NlbiBtaXQgc3RhdGlzY2hlbiBtYWluLU1ldGhvZGVuLlwiLCBjbGFzc05vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYWluTWV0aG9kID0gbTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0aWNDbGFzcyA9IGN0LnN0YXRpY0NsYXNzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTm9kZTEgPSBjbGFzc05vZGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtYWluTWV0aG9kICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBwb3NpdGlvbjogVGV4dFBvc2l0aW9uID0gbWFpbk1ldGhvZC51c2FnZVBvc2l0aW9uc1swXTtcclxuICAgICAgICAgICAgaWYgKG1haW5NZXRob2QucHJvZ3JhbSAhPSBudWxsICYmIG1haW5NZXRob2QucHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gbWFpbk1ldGhvZC5wcm9ncmFtLnN0YXRlbWVudHNbMF0ucG9zaXRpb247XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuaW5pdEN1cnJlbnRQcm9ncmFtKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1vZHVsZS5tYWluUHJvZ3JhbSA9IHRoaXMuY3VycmVudFByb2dyYW07XHJcblxyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKFt7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2FsbE1haW5NZXRob2QsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBtYWluTWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgc3RhdGljQ2xhc3M6IHN0YXRpY0NsYXNzXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5jbG9zZVN0YWNrZnJhbWUsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbWFpbk1ldGhvZC51c2FnZVBvc2l0aW9ucy5nZXQodGhpcy5tb2R1bGUpWzBdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXSwgZmFsc2UpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlQ2xhc3NlcygpIHtcclxuICAgICAgICBpZiAodGhpcy5tb2R1bGUuY2xhc3NEZWZpbml0aW9uc0FTVCA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGZvciAobGV0IGNsYXNzTm9kZSBvZiB0aGlzLm1vZHVsZS5jbGFzc0RlZmluaXRpb25zQVNUKSB7XHJcbiAgICAgICAgICAgIGlmIChjbGFzc05vZGUudHlwZSA9PSBUb2tlblR5cGUua2V5d29yZENsYXNzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlQ2xhc3MoY2xhc3NOb2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoY2xhc3NOb2RlLnR5cGUgPT0gVG9rZW5UeXBlLmtleXdvcmRFbnVtKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlRW51bShjbGFzc05vZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChjbGFzc05vZGUudHlwZSA9PSBUb2tlblR5cGUua2V5d29yZEludGVyZmFjZSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGludGVyZiA9IGNsYXNzTm9kZS5yZXNvbHZlZFR5cGU7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJmICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoZWNrRG91YmxlTWV0aG9kRGVjbGFyYXRpb24oaW50ZXJmKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlRW51bShlbnVtTm9kZTogRW51bURlY2xhcmF0aW9uTm9kZSkge1xyXG5cclxuICAgICAgICBpZiAoZW51bU5vZGUucmVzb2x2ZWRUeXBlID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5wdXNoTmV3U3ltYm9sVGFibGUoZmFsc2UsIGVudW1Ob2RlLnNjb3BlRnJvbSwgZW51bU5vZGUuc2NvcGVUbyk7XHJcblxyXG4gICAgICAgIGxldCBlbnVtQ2xhc3MgPSA8RW51bT5lbnVtTm9kZS5yZXNvbHZlZFR5cGU7XHJcblxyXG4gICAgICAgIC8vIHRoaXMucHVzaFVzYWdlUG9zaXRpb24oZW51bU5vZGUucG9zaXRpb24sIGVudW1DbGFzcyk7XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dCA9IGVudW1DbGFzcztcclxuICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtID0gZW51bUNsYXNzLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYXR0cmlidXRlIG9mIGVudW1Ob2RlLmF0dHJpYnV0ZXMpIHtcclxuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZSAhPSBudWxsICYmICFhdHRyaWJ1dGUuaXNTdGF0aWMgJiYgYXR0cmlidXRlLmluaXRpYWxpemF0aW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZUF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZW51bUNsYXNzLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucmV0dXJuLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHRoaXMubGFzdFN0YXRlbWVudC5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIGNvcHlSZXR1cm5WYWx1ZVRvU3RhY2tmcmFtZVBvczA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGxlYXZlVGhpc09iamVjdE9uU3RhY2s6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXIucmVzb2x2ZU5vZGVzKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IG1ldGhvZE5vZGUgb2YgZW51bU5vZGUubWV0aG9kcykge1xyXG4gICAgICAgICAgICBpZiAobWV0aG9kTm9kZSAhPSBudWxsICYmICFtZXRob2ROb2RlLmlzQWJzdHJhY3QgJiYgIW1ldGhvZE5vZGUuaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29tcGlsZU1ldGhvZChtZXRob2ROb2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wb3BTeW1ib2xUYWJsZShudWxsKTtcclxuXHJcbiAgICAgICAgLy8gY29uc3RydWN0b3IgY2FsbHNcclxuICAgICAgICB0aGlzLnB1c2hOZXdTeW1ib2xUYWJsZShmYWxzZSwgZW51bU5vZGUuc2NvcGVGcm9tLCBlbnVtTm9kZS5zY29wZVRvKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgZW51bVZhbHVlTm9kZSBvZiBlbnVtTm9kZS52YWx1ZXMpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChlbnVtVmFsdWVOb2RlLmNvbnN0cnVjdG9yUGFyYW1ldGVycyAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHA6IFByb2dyYW0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlOiB0aGlzLm1vZHVsZSxcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbE1hbmFnZXI6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVtZW50czogW11cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtID0gcDtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaEVudW1WYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogZW51bVZhbHVlTm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBlbnVtQ2xhc3M6IGVudW1DbGFzcyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZUlkZW50aWZpZXI6IGVudW1WYWx1ZU5vZGUuaWRlbnRpZmllclxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzRW51bUNvbnN0cnVjdG9yQ2FsbChlbnVtQ2xhc3MsIGVudW1WYWx1ZU5vZGUuY29uc3RydWN0b3JQYXJhbWV0ZXJzLFxyXG4gICAgICAgICAgICAgICAgICAgIGVudW1WYWx1ZU5vZGUucG9zaXRpb24sIGVudW1WYWx1ZU5vZGUuY29tbWFQb3NpdGlvbnMsIGVudW1WYWx1ZU5vZGUucmlnaHRCcmFja2V0UG9zaXRpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wcm9ncmFtRW5kLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBlbnVtVmFsdWVOb2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGVudW1JbmZvOiBFbnVtSW5mbyA9IGVudW1DbGFzcy5pZGVudGlmaWVyVG9JbmZvTWFwW2VudW1WYWx1ZU5vZGUuaWRlbnRpZmllcl07XHJcbiAgICAgICAgICAgICAgICBlbnVtSW5mby5jb25zdHJ1Y3RvckNhbGxQcm9ncmFtID0gcDtcclxuICAgICAgICAgICAgICAgIGVudW1JbmZvLnBvc2l0aW9uID0gZW51bVZhbHVlTm9kZS5wb3NpdGlvbjtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnBvcFN5bWJvbFRhYmxlKG51bGwpO1xyXG5cclxuXHJcbiAgICAgICAgLy8gc3RhdGljIGF0dHJpYnV0ZXMvbWV0aG9kc1xyXG4gICAgICAgIHRoaXMucHVzaE5ld1N5bWJvbFRhYmxlKGZhbHNlLCBlbnVtTm9kZS5zY29wZUZyb20sIGVudW1Ob2RlLnNjb3BlVG8pO1xyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZS5jbGFzc0NvbnRleHQgPSBlbnVtQ2xhc3Muc3RhdGljQ2xhc3M7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbSA9IGVudW1DbGFzcy5zdGF0aWNDbGFzcy5hdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW07XHJcblxyXG4gICAgICAgIGZvciAobGV0IGF0dHJpYnV0ZSBvZiBlbnVtTm9kZS5hdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChhdHRyaWJ1dGUgIT0gbnVsbCAmJiBhdHRyaWJ1dGUuaXNTdGF0aWMgJiYgYXR0cmlidXRlLmluaXRpYWxpemF0aW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZUF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtLmxhYmVsTWFuYWdlci5yZXNvbHZlTm9kZXMoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbWV0aG9kTm9kZSBvZiBlbnVtTm9kZS5tZXRob2RzKSB7XHJcbiAgICAgICAgICAgIGlmIChtZXRob2ROb2RlICE9IG51bGwgJiYgbWV0aG9kTm9kZS5pc1N0YXRpYykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21waWxlTWV0aG9kKG1ldGhvZE5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY2hlY2tEb3VibGVNZXRob2REZWNsYXJhdGlvbihlbnVtQ2xhc3MpO1xyXG5cclxuICAgICAgICB0aGlzLnBvcFN5bWJvbFRhYmxlKG51bGwpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzRW51bUNvbnN0cnVjdG9yQ2FsbChlbnVtQ2xhc3M6IEVudW0sIHBhcmFtZXRlck5vZGVzOiBUZXJtTm9kZVtdLFxyXG4gICAgICAgIHBvc2l0aW9uOiBUZXh0UG9zaXRpb24sIGNvbW1hUG9zaXRpb25zOiBUZXh0UG9zaXRpb25bXSwgcmlnaHRCcmFja2V0UG9zaXRpb246IFRleHRQb3NpdGlvbikge1xyXG4gICAgICAgIGxldCBwYXJhbWV0ZXJUeXBlczogVHlwZVtdID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IHAgb2YgcGFyYW1ldGVyTm9kZXMpIHtcclxuICAgICAgICAgICAgbGV0IHR5cGVOb2RlID0gdGhpcy5wcm9jZXNzTm9kZShwKTtcclxuICAgICAgICAgICAgaWYgKHR5cGVOb2RlID09IG51bGwpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBwYXJhbWV0ZXJUeXBlcy5wdXNoKHR5cGVOb2RlLnR5cGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IG1ldGhvZHMgPSBlbnVtQ2xhc3MuZ2V0TWV0aG9kc1RoYXRGaXRXaXRoQ2FzdGluZyhlbnVtQ2xhc3MuaWRlbnRpZmllcixcclxuICAgICAgICAgICAgcGFyYW1ldGVyVHlwZXMsIHRydWUsIFZpc2liaWxpdHkucHJpdmF0ZSk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kdWxlLnB1c2hNZXRob2RDYWxsUG9zaXRpb24ocG9zaXRpb24sIGNvbW1hUG9zaXRpb25zLCBlbnVtQ2xhc3MuZ2V0TWV0aG9kcyhWaXNpYmlsaXR5LnByaXZhdGUsIGVudW1DbGFzcy5pZGVudGlmaWVyKSwgcmlnaHRCcmFja2V0UG9zaXRpb24pO1xyXG5cclxuXHJcbiAgICAgICAgaWYgKG1ldGhvZHMuZXJyb3IgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihtZXRob2RzLmVycm9yLCBwb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGlzQXNzaWduYWJsZTogZmFsc2UgfTsgLy8gdHJ5IHRvIGNvbnRpbnVlLi4uXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbWV0aG9kID0gbWV0aG9kcy5tZXRob2RMaXN0WzBdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmFtZXRlclR5cGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBkZXN0VHlwZSA9IG1ldGhvZC5nZXRQYXJhbWV0ZXJUeXBlW2ldO1xyXG4gICAgICAgICAgICBsZXQgc3JjVHlwZSA9IHBhcmFtZXRlclR5cGVzW2ldO1xyXG4gICAgICAgICAgICBpZiAoIXNyY1R5cGUuZXF1YWxzKGRlc3RUeXBlKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzcmNUeXBlIGluc3RhbmNlb2YgUHJpbWl0aXZlVHlwZSAmJiBkZXN0VHlwZSBpbnN0YW5jZW9mIFByaW1pdGl2ZVR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc3JjVHlwZS5nZXRDYXN0SW5mb3JtYXRpb24oZGVzdFR5cGUpLm5lZWRzU3RhdGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmNhc3RWYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VHlwZTogZGVzdFR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFja1Bvc1JlbGF0aXZlOiAtcGFyYW1ldGVyVHlwZXMubGVuZ3RoICsgMSArIGlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5jYWxsTWV0aG9kLFxyXG4gICAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcclxuICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICBzdGVwRmluaXNoZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIGlzU3VwZXJDYWxsOiBmYWxzZSxcclxuICAgICAgICAgICAgc3RhY2tmcmFtZUJlZ2luOiAtKHBhcmFtZXRlclR5cGVzLmxlbmd0aCArIDEpIC8vIHRoaXMtb2JqZWN0IGZvbGxvd2VkIGJ5IHBhcmFtZXRlcnNcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZUNsYXNzKGNsYXNzTm9kZTogQ2xhc3NEZWNsYXJhdGlvbk5vZGUpIHtcclxuXHJcbiAgICAgICAgaWYgKGNsYXNzTm9kZS5yZXNvbHZlZFR5cGUgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLnB1c2hOZXdTeW1ib2xUYWJsZShmYWxzZSwgY2xhc3NOb2RlLnNjb3BlRnJvbSwgY2xhc3NOb2RlLnNjb3BlVG8pO1xyXG5cclxuICAgICAgICBsZXQga2xhc3MgPSA8S2xhc3M+Y2xhc3NOb2RlLnJlc29sdmVkVHlwZTtcclxuXHJcbiAgICAgICAgLy90aGlzLnB1c2hVc2FnZVBvc2l0aW9uKGNsYXNzTm9kZS5wb3NpdGlvbiwga2xhc3MpO1xyXG5cclxuICAgICAgICBsZXQgaW5oZXJpdGFuY2VFcnJvciA9IGtsYXNzLmNoZWNrSW5oZXJpdGFuY2UoKTtcclxuXHJcbiAgICAgICAgaWYgKGluaGVyaXRhbmNlRXJyb3IubWVzc2FnZSAhPSBcIlwiKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKGluaGVyaXRhbmNlRXJyb3IubWVzc2FnZSwgY2xhc3NOb2RlLnBvc2l0aW9uLCBcImVycm9yXCIsIHRoaXMuZ2V0SW5oZXJpdGFuY2VRdWlja0ZpeChjbGFzc05vZGUuc2NvcGVUbywgaW5oZXJpdGFuY2VFcnJvcikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGJhc2VDbGFzcyA9IGtsYXNzLmJhc2VDbGFzcztcclxuICAgICAgICBpZiAoYmFzZUNsYXNzICE9IG51bGwgJiYgYmFzZUNsYXNzLm1vZHVsZSAhPSBrbGFzcy5tb2R1bGUgJiYgYmFzZUNsYXNzLnZpc2liaWxpdHkgPT0gVmlzaWJpbGl0eS5wcml2YXRlKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIEJhc2lza2xhc3NlIFwiICsgYmFzZUNsYXNzLmlkZW50aWZpZXIgKyBcIiBkZXIgS2xhc3NlIFwiICsga2xhc3MuaWRlbnRpZmllciArIFwiIGlzdCBoaWVyIG5pY2h0IHNpY2h0YmFyLlwiLCBjbGFzc05vZGUucG9zaXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50U3ltYm9sVGFibGUuY2xhc3NDb250ZXh0ID0ga2xhc3M7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbSA9IGtsYXNzLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYXR0cmlidXRlIG9mIGNsYXNzTm9kZS5hdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChhdHRyaWJ1dGUgIT0gbnVsbCAmJiAhYXR0cmlidXRlLmlzU3RhdGljICYmIGF0dHJpYnV0ZS5pbml0aWFsaXphdGlvbiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRpYWxpemVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGtsYXNzLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucmV0dXJuLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHRoaXMubGFzdFN0YXRlbWVudC5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIGNvcHlSZXR1cm5WYWx1ZVRvU3RhY2tmcmFtZVBvczA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGxlYXZlVGhpc09iamVjdE9uU3RhY2s6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXIucmVzb2x2ZU5vZGVzKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IG1ldGhvZE5vZGUgb2YgY2xhc3NOb2RlLm1ldGhvZHMpIHtcclxuICAgICAgICAgICAgaWYgKG1ldGhvZE5vZGUgIT0gbnVsbCAmJiAhbWV0aG9kTm9kZS5pc0Fic3RyYWN0ICYmICFtZXRob2ROb2RlLmlzU3RhdGljKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBpbGVNZXRob2QobWV0aG9kTm9kZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY2hlY2tEb3VibGVNZXRob2REZWNsYXJhdGlvbihrbGFzcyk7XHJcblxyXG4gICAgICAgIHRoaXMucG9wU3ltYm9sVGFibGUobnVsbCk7XHJcblxyXG4gICAgICAgIC8vIHN0YXRpYyBhdHRyaWJ1dGVzL21ldGhvZHNcclxuICAgICAgICB0aGlzLnB1c2hOZXdTeW1ib2xUYWJsZShmYWxzZSwgY2xhc3NOb2RlLnNjb3BlRnJvbSwgY2xhc3NOb2RlLnNjb3BlVG8pO1xyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZS5jbGFzc0NvbnRleHQgPSBrbGFzcy5zdGF0aWNDbGFzcztcclxuICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtID0ga2xhc3Muc3RhdGljQ2xhc3MuYXR0cmlidXRlSW5pdGlhbGl6YXRpb25Qcm9ncmFtO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBhdHRyaWJ1dGUgb2YgY2xhc3NOb2RlLmF0dHJpYnV0ZXMpIHtcclxuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZSAhPSBudWxsICYmIGF0dHJpYnV0ZS5pc1N0YXRpYyAmJiBhdHRyaWJ1dGUuaW5pdGlhbGl6YXRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbml0aWFsaXplQXR0cmlidXRlKGF0dHJpYnV0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChrbGFzcy5zdGF0aWNDbGFzcy5hdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnJldHVybixcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmxhc3RTdGF0ZW1lbnQucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICBjb3B5UmV0dXJuVmFsdWVUb1N0YWNrZnJhbWVQb3MwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBsZWF2ZVRoaXNPYmplY3RPblN0YWNrOiB0cnVlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0ubGFiZWxNYW5hZ2VyLnJlc29sdmVOb2RlcygpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBtZXRob2ROb2RlIG9mIGNsYXNzTm9kZS5tZXRob2RzKSB7XHJcbiAgICAgICAgICAgIGlmIChtZXRob2ROb2RlICE9IG51bGwgJiYgbWV0aG9kTm9kZS5pc1N0YXRpYykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21waWxlTWV0aG9kKG1ldGhvZE5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnBvcFN5bWJvbFRhYmxlKG51bGwpO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgY2hlY2tEb3VibGVNZXRob2REZWNsYXJhdGlvbihjaWU6IEtsYXNzIHwgSW50ZXJmYWNlKSB7ICAvLyBOLkIuOiBFbnVtIGV4dGVuZHMgS2xhc3NcclxuXHJcbiAgICAgICAgbGV0IHNpZ25hdHVyZU1hcDogeyBba2V5OiBzdHJpbmddOiBNZXRob2QgfSA9IHt9O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBtIG9mIGNpZS5tZXRob2RzKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgc2lnbmF0dXJlID0gbS5nZXRTaWduYXR1cmVXaXRoUmV0dXJuUGFyYW1ldGVyKCk7XHJcbiAgICAgICAgICAgIGlmIChzaWduYXR1cmVNYXBbc2lnbmF0dXJlXSAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGNpZVR5cGU6IFN0cmluZyA9IFwiSW4gZGVyIEtsYXNzZSBcIjtcclxuICAgICAgICAgICAgICAgIGlmIChjaWUgaW5zdGFuY2VvZiBJbnRlcmZhY2UpIGNpZVR5cGUgPSBcIkltIEludGVyZmFjZSBcIjtcclxuICAgICAgICAgICAgICAgIGlmIChjaWUgaW5zdGFuY2VvZiBFbnVtKSBjaWVUeXBlID0gXCJJbSBFbnVtIFwiO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKGNpZVR5cGUgKyBjaWUuaWRlbnRpZmllciArIFwiIGdpYnQgZXMgendlaSBNZXRob2RlbiBtaXQgZGVyc2VsYmVuIFNpZ25hdHVyOiBcIiArIHNpZ25hdHVyZSwgbS51c2FnZVBvc2l0aW9ucy5nZXQodGhpcy5tb2R1bGUpWzBdLCBcImVycm9yXCIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoY2llVHlwZSArIGNpZS5pZGVudGlmaWVyICsgXCIgZ2lidCBlcyB6d2VpIE1ldGhvZGVuIG1pdCBkZXJzZWxiZW4gU2lnbmF0dXI6IFwiICsgc2lnbmF0dXJlLCBzaWduYXR1cmVNYXBbc2lnbmF0dXJlXS51c2FnZVBvc2l0aW9ucy5nZXQodGhpcy5tb2R1bGUpWzBdLCBcImVycm9yXCIpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNpZ25hdHVyZU1hcFtzaWduYXR1cmVdID0gbTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldEluaGVyaXRhbmNlUXVpY2tGaXgocG9zaXRpb246IFRleHRQb3NpdGlvbiwgaW5oZXJpdGFuY2VFcnJvcjogeyBtZXNzYWdlOiBzdHJpbmc7IG1pc3NpbmdNZXRob2RzOiBNZXRob2RbXTsgfSk6IFF1aWNrRml4IHtcclxuXHJcbiAgICAgICAgbGV0IHM6IHN0cmluZyA9IFwiXCI7XHJcbiAgICAgICAgZm9yIChsZXQgbSBvZiBpbmhlcml0YW5jZUVycm9yLm1pc3NpbmdNZXRob2RzKSB7XHJcbiAgICAgICAgICAgIHMgKz0gXCJcXHRwdWJsaWMgXCIgKyAobS5yZXR1cm5UeXBlID09IG51bGwgPyBcIiB2b2lkXCIgOiBnZXRUeXBlSWRlbnRpZmllcihtLnJldHVyblR5cGUpKSArIFwiIFwiICsgbS5pZGVudGlmaWVyICsgXCIoXCI7XHJcbiAgICAgICAgICAgIHMgKz0gbS5wYXJhbWV0ZXJsaXN0LnBhcmFtZXRlcnMubWFwKHAgPT4gZ2V0VHlwZUlkZW50aWZpZXIocC50eXBlKSArIFwiIFwiICsgcC5pZGVudGlmaWVyKS5qb2luKFwiLCBcIik7XHJcbiAgICAgICAgICAgIHMgKz0gXCIpIHtcXG5cXHRcXHQvL1RPRE86IE1ldGhvZGUgZsO8bGxlblxcblxcdH1cXG5cXG5cIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkZlaGxlbmRlIE1ldGhvZGVuIGVpbmbDvGdlblwiLFxyXG4gICAgICAgICAgICBlZGl0c1Byb3ZpZGVyOiAodXJpKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2U6IHVyaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHsgc3RhcnRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lLCBzdGFydENvbHVtbjogcG9zaXRpb24uY29sdW1uIC0gMSwgZW5kTGluZU51bWJlcjogcG9zaXRpb24ubGluZSwgZW5kQ29sdW1uOiBwb3NpdGlvbi5jb2x1bW4gLSAxIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBjb21waWxlTWV0aG9kKG1ldGhvZE5vZGU6IE1ldGhvZERlY2xhcmF0aW9uTm9kZSkge1xyXG4gICAgICAgIC8vIEFzc3VtcHRpb246IG1ldGhvZE5vZGUgIT0gbnVsbFxyXG4gICAgICAgIGxldCBtZXRob2QgPSBtZXRob2ROb2RlLnJlc29sdmVkVHlwZTtcclxuXHJcbiAgICAgICAgdGhpcy5jaGVja0lmTWV0aG9kSXNWaXJ0dWFsKG1ldGhvZCk7XHJcblxyXG4gICAgICAgIGlmIChtZXRob2QgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyB0aGlzLnB1c2hVc2FnZVBvc2l0aW9uKG1ldGhvZE5vZGUucG9zaXRpb24sIG1ldGhvZCk7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdEN1cnJlbnRQcm9ncmFtKCk7XHJcbiAgICAgICAgbWV0aG9kLnByb2dyYW0gPSB0aGlzLmN1cnJlbnRQcm9ncmFtO1xyXG5cclxuICAgICAgICB0aGlzLnB1c2hOZXdTeW1ib2xUYWJsZShmYWxzZSwgbWV0aG9kTm9kZS5zY29wZUZyb20sIG1ldGhvZE5vZGUuc2NvcGVUbyk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50U3ltYm9sVGFibGUubWV0aG9kID0gbWV0aG9kO1xyXG5cclxuICAgICAgICBsZXQgc3RhY2tQb3M6IG51bWJlciA9IDE7XHJcblxyXG4gICAgICAgIGZvciAobGV0IHYgb2YgbWV0aG9kLmdldFBhcmFtZXRlckxpc3QoKS5wYXJhbWV0ZXJzKSB7XHJcbiAgICAgICAgICAgIHYuc3RhY2tQb3MgPSBzdGFja1BvcysrO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50U3ltYm9sVGFibGUudmFyaWFibGVNYXAuc2V0KHYuaWRlbnRpZmllciwgdik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBcIiArIDFcIiBpcyBmb3IgXCJ0aGlzXCItb2JqZWN0XHJcbiAgICAgICAgdGhpcy5uZXh0RnJlZVJlbGF0aXZlU3RhY2tQb3MgPSBtZXRob2ROb2RlLnBhcmFtZXRlcnMubGVuZ3RoICsgMTtcclxuXHJcbiAgICAgICAgaWYgKG1ldGhvZC5pc0NvbnN0cnVjdG9yICYmIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dCBpbnN0YW5jZW9mIEtsYXNzKSB7XHJcbiAgICAgICAgICAgIGxldCBjOiBLbGFzcyA9IHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dDtcclxuICAgICAgICAgICAgaWYgKGMgIT0gbnVsbCAmJiBjLmJhc2VDbGFzcz8uaGFzQ29uc3RydWN0b3IoKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGVycm9yOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBpZiAobWV0aG9kTm9kZS5zdGF0ZW1lbnRzID09IG51bGwgfHwgbWV0aG9kTm9kZS5zdGF0ZW1lbnRzLmxlbmd0aCA9PSAwKSBlcnJvciA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXRob2ROb2RlLnN0YXRlbWVudHNbMF0udHlwZSA9PSBUb2tlblR5cGUuc2NvcGVOb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzdG0gPSBtZXRob2ROb2RlLnN0YXRlbWVudHNbMF0uc3RhdGVtZW50cztcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0bS5sZW5ndGggPiAwICYmIHN0bVswXS50eXBlID09IFRva2VuVHlwZS5zdXBlckNvbnN0cnVjdG9yQ2FsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWV0aG9kTm9kZS5zdGF0ZW1lbnRzWzBdLnR5cGUgPT0gVG9rZW5UeXBlLnN1cGVyQ29uc3RydWN0b3JDYWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHF1aWNrRml4OiBRdWlja0ZpeCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNvbnN0cnVjdG9ycyA9IGMuYmFzZUNsYXNzLm1ldGhvZHMuZmlsdGVyKG0gPT4gbS5pc0NvbnN0cnVjdG9yKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY29uc3RydWN0b3JzLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtZXRob2RDYWxsID0gXCJzdXBlcihcIiArIGNvbnN0cnVjdG9yc1swXS5wYXJhbWV0ZXJsaXN0LnBhcmFtZXRlcnMubWFwKHAgPT4gcC5pZGVudGlmaWVyKS5qb2luKFwiLCBcIikgKyBcIik7XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwb3NpdGlvbiA9IG1ldGhvZE5vZGUucG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1aWNrRml4ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdBdWZydWYgZGVzIEtvbnN0cnVrdG9ycyBkZXIgQmFzaXNrbGFzc2UgZWluZsO8Z2VuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vMDYuMDYuMjAyMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdHNQcm92aWRlcjogKHVyaSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZTogdXJpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0TGluZU51bWJlcjogcG9zaXRpb24ubGluZSArIDEsIHN0YXJ0Q29sdW1uOiAwLCBlbmRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lICsgMSwgZW5kQ29sdW1uOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V2ZXJpdHk6IG1vbmFjby5NYXJrZXJTZXZlcml0eS5FcnJvclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiXFx0XFx0XCIgKyBtZXRob2RDYWxsICsgXCJcXG5cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgQmFzaXNrbGFzc2UgZGVyIEtsYXNzZSBcIiArIGMuaWRlbnRpZmllciArIFwiIGJlc2l0enQgS29uc3RydWt0b3JlbiwgZGFoZXIgbXVzcyBkaWVzZSBLb25zdHJ1a3RvcmRlZmluaXRpb24gbWl0IGVpbmVtIEF1ZnJ1ZiBlaW5lcyBLb25zdHJ1a3RvcnMgZGVyIEJhc2lza2xhc3NlIChzdXBlciguLi4pKSBiZWdpbm5lbi5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kTm9kZS5wb3NpdGlvbiwgXCJlcnJvclwiLCBxdWlja0ZpeCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBhY3RvckNsYXNzID0gPEtsYXNzPnRoaXMubW9kdWxlU3RvcmUuZ2V0VHlwZShcIkFjdG9yXCIpLnR5cGU7XHJcbiAgICAgICAgbGV0IG1ldGhvZElkZW50aWZpZXJzID0gW1wiYWN0XCIsIFwib25LZXlUeXBlZFwiLCBcIm9uS2V5RG93blwiLCBcIm9uS2V5VXBcIixcclxuICAgICAgICAgICAgXCJvbk1vdXNlRG93blwiLCBcIm9uTW91c2VVcFwiLCBcIm9uTW91c2VNb3ZlXCIsIFwib25Nb3VzZUVudGVyXCIsIFwib25Nb3VzZUxlYXZlXCJdO1xyXG4gICAgICAgIGlmIChtZXRob2RJZGVudGlmaWVycy5pbmRleE9mKG1ldGhvZC5pZGVudGlmaWVyKSA+PSAwICYmIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dC5oYXNBbmNlc3Rvck9ySXMoYWN0b3JDbGFzcykpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyhbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnJldHVybklmRGVzdHJveWVkLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBtZXRob2ROb2RlLnBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB3aXRoUmV0dXJuU3RhdGVtZW50ID0gdGhpcy5nZW5lcmF0ZVN0YXRlbWVudHMobWV0aG9kTm9kZS5zdGF0ZW1lbnRzKS53aXRoUmV0dXJuU3RhdGVtZW50O1xyXG5cclxuICAgICAgICBpZiAoIXdpdGhSZXR1cm5TdGF0ZW1lbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucmV0dXJuLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IG1ldGhvZE5vZGUuc2NvcGVUbyxcclxuICAgICAgICAgICAgICAgIGNvcHlSZXR1cm5WYWx1ZVRvU3RhY2tmcmFtZVBvczA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgbGVhdmVUaGlzT2JqZWN0T25TdGFjazogZmFsc2VcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgcnQgPSBtZXRob2QuZ2V0UmV0dXJuVHlwZSgpO1xyXG4gICAgICAgICAgICBpZiAoIW1ldGhvZC5pc0NvbnN0cnVjdG9yICYmIHJ0ICE9IG51bGwgJiYgcnQgIT0gdm9pZFByaW1pdGl2ZVR5cGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIERla2xhcmF0aW9uIGRlciBNZXRob2RlIHZlcmxhbmd0IGRpZSBSw7xja2dhYmUgZWluZXMgV2VydGVzIHZvbSBUeXAgXCIgKyBydC5pZGVudGlmaWVyICsgXCIuIEVzIGZlaGx0IChtaW5kZXN0ZW5zKSBlaW5lIGVudHNwcmVjaGVuZGUgcmV0dXJuLUFud2Vpc3VuZy5cIiwgbWV0aG9kTm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1ldGhvZC5yZXNlcnZlU3RhY2tGb3JMb2NhbFZhcmlhYmxlcyA9IHRoaXMubmV4dEZyZWVSZWxhdGl2ZVN0YWNrUG9zXHJcbiAgICAgICAgICAgIC0gbWV0aG9kTm9kZS5wYXJhbWV0ZXJzLmxlbmd0aCAtIDE7XHJcblxyXG4gICAgICAgIHRoaXMucG9wU3ltYm9sVGFibGUoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtLmxhYmVsTWFuYWdlci5yZXNvbHZlTm9kZXMoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjaGVja3MgaWYgY2hpbGQgY2xhc3NlcyBoYXZlIG1ldGhvZCB3aXRoIHNhbWUgc2lnbmF0dXJlXHJcbiAgICAgKi9cclxuICAgIGNoZWNrSWZNZXRob2RJc1ZpcnR1YWwobWV0aG9kOiBNZXRob2QpIHtcclxuXHJcbiAgICAgICAgbGV0IGtsYXNzID0gdGhpcy5jdXJyZW50U3ltYm9sVGFibGUuY2xhc3NDb250ZXh0O1xyXG4gICAgICAgIGlmIChrbGFzcyAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBtbyBvZiB0aGlzLm1vZHVsZVN0b3JlLmdldE1vZHVsZXMoZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBjIG9mIG1vLnR5cGVTdG9yZS50eXBlTGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjIGluc3RhbmNlb2YgS2xhc3MgJiYgYyAhPSBrbGFzcyAmJiBjLmhhc0FuY2VzdG9yT3JJcyhrbGFzcykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgbSBvZiBjLm1ldGhvZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtICE9IG51bGwgJiYgbWV0aG9kICE9IG51bGwgJiYgbS5zaWduYXR1cmUgPT0gbWV0aG9kLnNpZ25hdHVyZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZC5pc1ZpcnR1YWwgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIGluaXRpYWxpemVBdHRyaWJ1dGUoYXR0cmlidXRlOiBBdHRyaWJ1dGVEZWNsYXJhdGlvbk5vZGUpIHtcclxuXHJcbiAgICAgICAgaWYgKGF0dHJpYnV0ZSA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIGFzc3VtcHRpb246IGF0dHJpYnV0ZSAhPSBudWxsXHJcbiAgICAgICAgaWYgKGF0dHJpYnV0ZS5pZGVudGlmaWVyID09IG51bGwgfHwgYXR0cmlidXRlLmluaXRpYWxpemF0aW9uID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKGF0dHJpYnV0ZS5pc1N0YXRpYykge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoU3RhdGljQXR0cmlidXRlLFxyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlSW5kZXg6IGF0dHJpYnV0ZS5yZXNvbHZlZFR5cGUuaW5kZXgsXHJcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVJZGVudGlmaWVyOiBhdHRyaWJ1dGUucmVzb2x2ZWRUeXBlLmlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogYXR0cmlidXRlLmluaXRpYWxpemF0aW9uLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAga2xhc3M6IDxTdGF0aWNDbGFzcz4odGhpcy5jdXJyZW50U3ltYm9sVGFibGUuY2xhc3NDb250ZXh0KVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoQXR0cmlidXRlLFxyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlSW5kZXg6IGF0dHJpYnV0ZS5yZXNvbHZlZFR5cGUuaW5kZXgsXHJcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVJZGVudGlmaWVyOiBhdHRyaWJ1dGUuaWRlbnRpZmllcixcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBhdHRyaWJ1dGUuaW5pdGlhbGl6YXRpb24ucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICB1c2VUaGlzT2JqZWN0OiB0cnVlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIGxldCBpbml0aWFsaXphdGlvblR5cGUgPSB0aGlzLnByb2Nlc3NOb2RlKGF0dHJpYnV0ZS5pbml0aWFsaXphdGlvbik7XHJcblxyXG4gICAgICAgIGlmIChpbml0aWFsaXphdGlvblR5cGUgIT0gbnVsbCAmJiBpbml0aWFsaXphdGlvblR5cGUudHlwZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5lbnN1cmVBdXRvbWF0aWNDYXN0aW5nKGluaXRpYWxpemF0aW9uVHlwZS50eXBlLCBhdHRyaWJ1dGUuYXR0cmlidXRlVHlwZS5yZXNvbHZlZFR5cGUpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZS5hdHRyaWJ1dGVUeXBlLnJlc29sdmVkVHlwZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgRGF0ZW50eXAgdm9uIFwiICsgYXR0cmlidXRlLmlkZW50aWZpZXIgKyBcIiBrb25udGUgbmljaHQgZXJtaXR0ZWx0IHdlcmRlbi4gXCIsIGF0dHJpYnV0ZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVyIFdlcnQgZGVzIFRlcm0gdm9tIERhdGVudHlwIFwiICsgaW5pdGlhbGl6YXRpb25UeXBlLnR5cGUgKyBcIiBrYW5uIGRlbSBBdHRyaWJ1dCBcIiArIGF0dHJpYnV0ZS5pZGVudGlmaWVyICsgXCIgdm9tIFR5cCBcIiArIGF0dHJpYnV0ZS5hdHRyaWJ1dGVUeXBlLnJlc29sdmVkVHlwZS5pZGVudGlmaWVyICsgXCIgbmljaHQgenVnZXdpZXNlbiB3ZXJkZW4uXCIsIGF0dHJpYnV0ZS5pbml0aWFsaXphdGlvbi5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuYXNzaWdubWVudCxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBhdHRyaWJ1dGUuaW5pdGlhbGl6YXRpb24ucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBsZWF2ZVZhbHVlT25TdGFjazogZmFsc2VcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIGluaXRDdXJyZW50UHJvZ3JhbSgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbSA9IHtcclxuICAgICAgICAgICAgbW9kdWxlOiB0aGlzLm1vZHVsZSxcclxuICAgICAgICAgICAgc3RhdGVtZW50czogW10sXHJcbiAgICAgICAgICAgIGxhYmVsTWFuYWdlcjogbnVsbFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0ubGFiZWxNYW5hZ2VyID0gbmV3IExhYmVsTWFuYWdlcih0aGlzLmN1cnJlbnRQcm9ncmFtKTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXN0U3RhdGVtZW50ID0gbnVsbDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVNYWluKGlzQWRob2NDb21waWxhdGlvbjogYm9vbGVhbiA9IGZhbHNlKSB7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdEN1cnJlbnRQcm9ncmFtKCk7XHJcblxyXG4gICAgICAgIGxldCBwb3NpdGlvbjogVGV4dFBvc2l0aW9uID0geyBsaW5lOiAxLCBjb2x1bW46IDEsIGxlbmd0aDogMCB9O1xyXG5cclxuICAgICAgICBsZXQgbWFpblByb2dyYW1Bc3QgPSB0aGlzLm1vZHVsZS5tYWluUHJvZ3JhbUFzdDtcclxuICAgICAgICBpZiAobWFpblByb2dyYW1Bc3QgIT0gbnVsbCAmJiBtYWluUHJvZ3JhbUFzdC5sZW5ndGggPiAwICYmIG1haW5Qcm9ncmFtQXN0WzBdICE9IG51bGwpIHtcclxuICAgICAgICAgICAgcG9zaXRpb24gPSB0aGlzLm1vZHVsZS5tYWluUHJvZ3JhbUFzdFswXS5wb3NpdGlvbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaXNBZGhvY0NvbXBpbGF0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaE5ld1N5bWJvbFRhYmxlKHRydWUsIHBvc2l0aW9uLCB7IGxpbmU6IDEwMDAwMCwgY29sdW1uOiAxLCBsZW5ndGg6IDAgfSwgdGhpcy5jdXJyZW50UHJvZ3JhbSk7XHJcbiAgICAgICAgICAgIHRoaXMuaGVhcCA9IHt9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5tb2R1bGUubWFpblByb2dyYW0gPSB0aGlzLmN1cnJlbnRQcm9ncmFtO1xyXG5cclxuICAgICAgICBsZXQgaGFzTWFpblByb2dyYW06IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMubW9kdWxlLm1haW5Qcm9ncmFtQXN0ICE9IG51bGwgJiYgdGhpcy5tb2R1bGUubWFpblByb2dyYW1Bc3QubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICAgICAgaGFzTWFpblByb2dyYW0gPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlU3RhdGVtZW50cyh0aGlzLm1vZHVsZS5tYWluUHJvZ3JhbUFzdCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNBZGhvY0NvbXBpbGF0aW9uICYmIHRoaXMubGFzdFN0YXRlbWVudCAhPSBudWxsICYmIHRoaXMubGFzdFN0YXRlbWVudC50eXBlID09IFRva2VuVHlwZS5kZWNyZWFzZVN0YWNrcG9pbnRlcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVMYXN0U3RhdGVtZW50KCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMubGFzdFBvc2l0aW9uID0gdGhpcy5tb2R1bGUubWFpblByb2dyYW1FbmQ7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxhc3RQb3NpdGlvbiA9PSBudWxsKSB0aGlzLmxhc3RQb3NpdGlvbiA9IHsgbGluZTogMTAwMDAwLCBjb2x1bW46IDAsIGxlbmd0aDogMCB9O1xyXG4gICAgICAgICAgICAvLyBpZih0aGlzLmxhc3RQb3NpdGlvbiA9PSBudWxsKSB0aGlzLmxhc3RQb3NpdGlvbiA9IHtsaW5lOiAxMDAwMDAsIGNvbHVtbjogMCwgbGVuZ3RoOiAwfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLnBvc2l0aW9uVG8gPSB0aGlzLmxhc3RQb3NpdGlvbjtcclxuICAgICAgICAgICAgaWYgKCFpc0FkaG9jQ29tcGlsYXRpb24pIHRoaXMucG9wU3ltYm9sVGFibGUodGhpcy5jdXJyZW50UHJvZ3JhbSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuaGVhcCA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wcm9ncmFtRW5kLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHRoaXMubGFzdFBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgcGF1c2VBZnRlclByb2dyYW1FbmQ6IHRydWVcclxuICAgICAgICAgICAgfSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXIucmVzb2x2ZU5vZGVzKCk7XHJcblxyXG4gICAgICAgIGlmICghaXNBZGhvY0NvbXBpbGF0aW9uICYmICFoYXNNYWluUHJvZ3JhbSkge1xyXG4gICAgICAgICAgICB0aGlzLnBvcFN5bWJvbFRhYmxlKHRoaXMuY3VycmVudFByb2dyYW0pO1xyXG4gICAgICAgICAgICB0aGlzLmhlYXAgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZW5zdXJlQXV0b21hdGljQ2FzdGluZyh0eXBlRnJvbTogVHlwZSwgdHlwZVRvOiBUeXBlLCBwb3NpdGlvbj86IFRleHRQb3NpdGlvbiwgbm9kZUZyb20/OiBBU1ROb2RlKTogYm9vbGVhbiB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlRnJvbSA9PSBudWxsKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICh0eXBlRnJvbS5lcXVhbHModHlwZVRvKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlRnJvbSA9PSBudWxsIHx8IHR5cGVUbyA9PSBudWxsKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICghdHlwZUZyb20uY2FuQ2FzdFRvKHR5cGVUbykpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlVG8gPT0gYm9vbGVhblByaW1pdGl2ZVR5cGUgJiYgbm9kZUZyb20gIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tJZkFzc2lnbm1lbnRJbnN0ZWRPZkVxdWFsKG5vZGVGcm9tKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZUZyb21bXCJ1bmJveGFibGVBc1wiXSAhPSBudWxsICYmIHR5cGVGcm9tW1widW5ib3hhYmxlQXNcIl0uaW5kZXhPZih0eXBlVG8pID49IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZUZyb20gaW5zdGFuY2VvZiBLbGFzcyAmJiB0eXBlVG8gPT0gc3RyaW5nUHJpbWl0aXZlVHlwZSkge1xyXG5cclxuICAgICAgICAgICAgbGV0IHRvU3RyaW5nU3RhdGVtZW50ID0gdGhpcy5nZXRUb1N0cmluZ1N0YXRlbWVudCh0eXBlRnJvbSwgcG9zaXRpb24pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRvU3RyaW5nU3RhdGVtZW50ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHModG9TdHJpbmdTdGF0ZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBpZiAodHlwZUZyb20gaW5zdGFuY2VvZiBQcmltaXRpdmVUeXBlICYmICh0eXBlVG8gaW5zdGFuY2VvZiBQcmltaXRpdmVUeXBlIHx8IHR5cGVUbyA9PSBzdHJpbmdQcmltaXRpdmVUeXBlKSkge1xyXG4gICAgICAgICAgICBsZXQgY2FzdEluZm8gPSB0eXBlRnJvbS5nZXRDYXN0SW5mb3JtYXRpb24odHlwZVRvKTtcclxuICAgICAgICAgICAgaWYgKCFjYXN0SW5mby5hdXRvbWF0aWMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoY2FzdEluZm8ubmVlZHNTdGF0ZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5jYXN0VmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3VHlwZTogdHlwZVRvLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvblxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXRUb1N0cmluZ1N0YXRlbWVudCh0eXBlOiBLbGFzcywgcG9zaXRpb246IFRleHRQb3NpdGlvbik6IFN0YXRlbWVudCB7XHJcbiAgICAgICAgbGV0IHRvU3RyaW5nTWV0aG9kID0gdHlwZS5nZXRNZXRob2RCeVNpZ25hdHVyZShcInRvU3RyaW5nKClcIik7XHJcbiAgICAgICAgaWYgKHRvU3RyaW5nTWV0aG9kICE9IG51bGwgJiYgdG9TdHJpbmdNZXRob2QuZ2V0UmV0dXJuVHlwZSgpID09IHN0cmluZ1ByaW1pdGl2ZVR5cGUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2FsbE1ldGhvZCxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIG1ldGhvZDogdG9TdHJpbmdNZXRob2QsXHJcbiAgICAgICAgICAgICAgICBpc1N1cGVyQ2FsbDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBzdGFja2ZyYW1lQmVnaW46IC0xLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNoZWNrSWZBc3NpZ25tZW50SW5zdGVkT2ZFcXVhbChub2RlRnJvbTogQVNUTm9kZSwgY29uZGl0aW9uVHlwZT86IFR5cGUpIHtcclxuICAgICAgICBpZihub2RlRnJvbSA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmIChub2RlRnJvbS50eXBlID09IFRva2VuVHlwZS5iaW5hcnlPcCAmJiBub2RlRnJvbS5vcGVyYXRvciA9PSBUb2tlblR5cGUuYXNzaWdubWVudCkge1xyXG4gICAgICAgICAgICBsZXQgcG9zID0gbm9kZUZyb20ucG9zaXRpb247XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiPSBpc3QgZGVyIFp1d2Vpc3VuZ3NvcGVyYXRvci4gRHUgd2lsbHN0IHNpY2hlciB6d2VpIFdlcnRlIHZlcmdsZWljaGVuLiBEYXp1IGJlbsO2dGlnc3QgRHUgZGVuIFZlcmdsZWljaHNvcGVyYXRvciA9PS5cIixcclxuICAgICAgICAgICAgICAgIHBvcywgIGNvbmRpdGlvblR5cGUgPT0gYm9vbGVhblByaW1pdGl2ZVR5cGUgPyBcIndhcm5pbmdcIiA6IFwiZXJyb3JcIiwge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICc9IGR1cmNoID09IGVyc2V0emVuJyxcclxuICAgICAgICAgICAgICAgIGVkaXRzUHJvdmlkZXI6ICh1cmkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2U6IHVyaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydExpbmVOdW1iZXI6IHBvcy5saW5lLCBzdGFydENvbHVtbjogcG9zLmNvbHVtbiwgZW5kTGluZU51bWJlcjogcG9zLmxpbmUsIGVuZENvbHVtbjogcG9zLmNvbHVtbiArIDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXCJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXZlcml0eTogbW9uYWNvLk1hcmtlclNldmVyaXR5LkVycm9yXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCI9PVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZVN0YXRlbWVudHMobm9kZXM6IEFTVE5vZGVbXSk6IHsgd2l0aFJldHVyblN0YXRlbWVudDogYm9vbGVhbiwgZW5kUG9zaXRpb24/OiBUZXh0UG9zaXRpb24gfSB7XHJcblxyXG5cclxuICAgICAgICBpZiAobm9kZXMgPT0gbnVsbCB8fCBub2Rlcy5sZW5ndGggPT0gMCB8fCBub2Rlc1swXSA9PSBudWxsKSByZXR1cm4geyB3aXRoUmV0dXJuU3RhdGVtZW50OiBmYWxzZSB9O1xyXG5cclxuICAgICAgICBsZXQgd2l0aFJldHVyblN0YXRlbWVudDogYm9vbGVhbiA9IHRoaXMucHJvY2Vzc1N0YXRlbWVudHNJbnNpZGVCbG9jayhub2Rlcyk7XHJcblxyXG4gICAgICAgIGxldCBsYXN0Tm9kZSA9IG5vZGVzW25vZGVzLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgIGxldCBlbmRQb3NpdGlvbjogVGV4dFBvc2l0aW9uO1xyXG4gICAgICAgIGlmIChsYXN0Tm9kZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGlmIChsYXN0Tm9kZS50eXBlID09IFRva2VuVHlwZS5zY29wZU5vZGUpIHtcclxuICAgICAgICAgICAgICAgIGVuZFBvc2l0aW9uID0gbGFzdE5vZGUucG9zaXRpb25UbztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVuZFBvc2l0aW9uID0gT2JqZWN0LmFzc2lnbih7fSwgbGFzdE5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVuZFBvc2l0aW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbmRQb3NpdGlvbi5jb2x1bW4gKz0gZW5kUG9zaXRpb24ubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIGVuZFBvc2l0aW9uLmxlbmd0aCA9IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5sYXN0UG9zaXRpb24gPSBlbmRQb3NpdGlvbjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBlbmRQb3NpdGlvbiA9IHRoaXMubGFzdFBvc2l0aW9uO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHsgd2l0aFJldHVyblN0YXRlbWVudDogd2l0aFJldHVyblN0YXRlbWVudCwgZW5kUG9zaXRpb246IGVuZFBvc2l0aW9uIH07XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NTdGF0ZW1lbnRzSW5zaWRlQmxvY2sobm9kZXM6IEFTVE5vZGVbXSkge1xyXG4gICAgICAgIGxldCB3aXRoUmV0dXJuU3RhdGVtZW50ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGZvciAobGV0IG5vZGUgb2Ygbm9kZXMpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChub2RlID09IG51bGwpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgbGV0IHR5cGUgPSB0aGlzLnByb2Nlc3NOb2RlKG5vZGUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGUgIT0gbnVsbCAmJiB0eXBlLndpdGhSZXR1cm5TdGF0ZW1lbnQgIT0gbnVsbCAmJiB0eXBlLndpdGhSZXR1cm5TdGF0ZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIHdpdGhSZXR1cm5TdGF0ZW1lbnQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBJZiBsYXN0IFN0YXRlbWVudCBoYXMgdmFsdWUgd2hpY2ggaXMgbm90IHVzZWQgZnVydGhlciB0aGVuIHBvcCB0aGlzIHZhbHVlIGZyb20gc3RhY2suXHJcbiAgICAgICAgICAgIC8vIGUuZy4gc3RhdGVtZW50IDEyICsgMTcgLTc7XHJcbiAgICAgICAgICAgIC8vIFBhcnNlciBpc3N1ZXMgYSB3YXJuaW5nIGluIHRoaXMgY2FzZSwgc2VlIFBhcnNlci5jaGVja0lmU3RhdGVtZW50SGFzTm9FZmZla3RcclxuICAgICAgICAgICAgaWYgKHR5cGUgIT0gbnVsbCAmJiB0eXBlLnR5cGUgIT0gbnVsbCAmJiB0eXBlLnR5cGUgIT0gdm9pZFByaW1pdGl2ZVR5cGUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sYXN0U3RhdGVtZW50ICE9IG51bGwgJiZcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RTdGF0ZW1lbnQudHlwZSA9PSBUb2tlblR5cGUuYXNzaWdubWVudCAmJiB0aGlzLmxhc3RTdGF0ZW1lbnQubGVhdmVWYWx1ZU9uU3RhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RTdGF0ZW1lbnQubGVhdmVWYWx1ZU9uU3RhY2sgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5kZWNyZWFzZVN0YWNrcG9pbnRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcENvdW50OiAxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9LCB0cnVlKVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB3aXRoUmV0dXJuU3RhdGVtZW50O1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBsYXN0UG9zaXRpb246IFRleHRQb3NpdGlvbjtcclxuICAgIGxhc3RTdGF0ZW1lbnQ6IFN0YXRlbWVudDtcclxuXHJcbiAgICBpbnNlcnRTdGF0ZW1lbnRzKHBvczogbnVtYmVyLCBzdGF0ZW1lbnRzOiBTdGF0ZW1lbnQgfCBTdGF0ZW1lbnRbXSkge1xyXG4gICAgICAgIGlmIChzdGF0ZW1lbnRzID09IG51bGwpIHJldHVybjtcclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoc3RhdGVtZW50cykpIHN0YXRlbWVudHMgPSBbc3RhdGVtZW50c107XHJcbiAgICAgICAgZm9yIChsZXQgc3Qgb2Ygc3RhdGVtZW50cykge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHMuc3BsaWNlKHBvcysrLCAwLCBzdCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1c2hTdGF0ZW1lbnRzKHN0YXRlbWVudDogU3RhdGVtZW50IHwgU3RhdGVtZW50W10sIGRlbGV0ZVN0ZXBGaW5pc2hlZEZsYWdPblN0ZXBCZWZvcmU6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG5cclxuICAgICAgICBpZiAoc3RhdGVtZW50ID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKGRlbGV0ZVN0ZXBGaW5pc2hlZEZsYWdPblN0ZXBCZWZvcmUgJiYgdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgbGV0IHN0ZXBCZWZvcmU6IFN0YXRlbWVudCA9IHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50c1t0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgICAgIHN0ZXBCZWZvcmUuc3RlcEZpbmlzaGVkID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzdGF0ZW1lbnQpKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHN0IG9mIHN0YXRlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzLnB1c2goc3QpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0LnR5cGUgPT0gVG9rZW5UeXBlLnJldHVybiB8fCBzdC50eXBlID09IFRva2VuVHlwZS5qdW1wQWx3YXlzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubGFzdFN0YXRlbWVudCAhPSBudWxsKSB0aGlzLmxhc3RTdGF0ZW1lbnQuc3RlcEZpbmlzaGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoc3QucG9zaXRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGFzdFBvc2l0aW9uID0gc3QucG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0LnBvc2l0aW9uID0gdGhpcy5sYXN0UG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RTdGF0ZW1lbnQgPSBzdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5wdXNoKHN0YXRlbWVudCk7XHJcbiAgICAgICAgICAgIGlmIChzdGF0ZW1lbnQudHlwZSA9PSBUb2tlblR5cGUucmV0dXJuIHx8IHN0YXRlbWVudC50eXBlID09IFRva2VuVHlwZS5qdW1wQWx3YXlzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5sYXN0U3RhdGVtZW50ICE9IG51bGwpIHRoaXMubGFzdFN0YXRlbWVudC5zdGVwRmluaXNoZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3RhdGVtZW50LnBvc2l0aW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdFBvc2l0aW9uID0gc3RhdGVtZW50LnBvc2l0aW9uO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc3RhdGVtZW50LnBvc2l0aW9uID0gdGhpcy5sYXN0UG9zaXRpb247XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMubGFzdFN0YXRlbWVudCA9IHN0YXRlbWVudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlTGFzdFN0YXRlbWVudCgpIHtcclxuICAgICAgICBsZXQgbHN0ID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzLnBvcCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0ubGFiZWxNYW5hZ2VyLnJlbW92ZU5vZGUobHN0KTtcclxuICAgIH1cclxuXHJcbiAgICBpbml0U3RhY2tGcmFtZU5vZGVzOiBJbml0U3RhY2tmcmFtZVN0YXRlbWVudFtdID0gW107XHJcblxyXG5cclxuICAgIHB1c2hOZXdTeW1ib2xUYWJsZShiZWdpbk5ld1N0YWNrZnJhbWU6IGJvb2xlYW4sIHBvc2l0aW9uRnJvbTogVGV4dFBvc2l0aW9uLCBwb3NpdGlvblRvOiBUZXh0UG9zaXRpb24sXHJcbiAgICAgICAgcHJvZ3JhbT86IFByb2dyYW0pOiBTeW1ib2xUYWJsZSB7XHJcblxyXG4gICAgICAgIGxldCBzdCA9IG5ldyBTeW1ib2xUYWJsZSh0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZSwgcG9zaXRpb25Gcm9tLCBwb3NpdGlvblRvKTtcclxuXHJcbiAgICAgICAgdGhpcy5zeW1ib2xUYWJsZVN0YWNrLnB1c2godGhpcy5jdXJyZW50U3ltYm9sVGFibGUpO1xyXG5cclxuICAgICAgICBpZiAoYmVnaW5OZXdTdGFja2ZyYW1lKSB7XHJcbiAgICAgICAgICAgIHN0LmJlZ2luc05ld1N0YWNrZnJhbWUgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZS5zdGFja2ZyYW1lU2l6ZSA9IHRoaXMubmV4dEZyZWVSZWxhdGl2ZVN0YWNrUG9zO1xyXG4gICAgICAgICAgICB0aGlzLm5leHRGcmVlUmVsYXRpdmVTdGFja1BvcyA9IDA7XHJcblxyXG4gICAgICAgICAgICBpZiAocHJvZ3JhbSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaW5pdFN0YWNrRnJhbWVOb2RlOiBJbml0U3RhY2tmcmFtZVN0YXRlbWVudCA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuaW5pdFN0YWNrZnJhbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uRnJvbSxcclxuICAgICAgICAgICAgICAgICAgICByZXNlcnZlRm9yTG9jYWxWYXJpYWJsZXM6IDBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBwcm9ncmFtLnN0YXRlbWVudHMucHVzaChpbml0U3RhY2tGcmFtZU5vZGUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbml0U3RhY2tGcmFtZU5vZGVzLnB1c2goaW5pdFN0YWNrRnJhbWVOb2RlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlID0gc3Q7XHJcblxyXG4gICAgICAgIHJldHVybiBzdDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcG9wU3ltYm9sVGFibGUocHJvZ3JhbT86IFByb2dyYW0sIGRlbGV0ZVN0ZXBGaW5pc2hlZEZsYWdPblN0ZXBCZWZvcmU6IGJvb2xlYW4gPSBmYWxzZSk6IHZvaWQge1xyXG5cclxuICAgICAgICBsZXQgc3QgPSB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZSA9IHRoaXMuc3ltYm9sVGFibGVTdGFjay5wb3AoKTtcclxuXHJcbiAgICAgICAgLy8gaWYgdi5kZWNsYXJhdGlvbkVycm9yICE9IG51bGwgdGhlbiB2YXJpYWJsZSBoYXMgYmVlbiB1c2VkIGJlZm9yZSBpbml0aWFsaXphdGlvbi5cclxuICAgICAgICBzdC52YXJpYWJsZU1hcC5mb3JFYWNoKHYgPT4ge1xyXG4gICAgICAgICAgICBpZiAodi5kZWNsYXJhdGlvbkVycm9yICE9IG51bGwgJiYgdi51c2VkQmVmb3JlSW5pdGlhbGl6YXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3JMaXN0LnB1c2godi5kZWNsYXJhdGlvbkVycm9yKTtcclxuICAgICAgICAgICAgICAgIHYuZGVjbGFyYXRpb25FcnJvciA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gaWYgKCFzdC5iZWdpbnNOZXdTdGFja2ZyYW1lICYmIHN0LnZhcmlhYmxlTWFwLnNpemUgPT0gMCAmJiByZW1vdmVJKSB7XHJcbiAgICAgICAgLy8gICAgIC8vIGVtcHR5IHN5bWJvbCB0YWJsZSA9PiByZW1vdmUgaXQhXHJcbiAgICAgICAgLy8gICAgIGlmIChzdC5wYXJlbnQgIT0gbnVsbCkge1xyXG4gICAgICAgIC8vICAgICAgICAgc3QucGFyZW50LmNoaWxkU3ltYm9sVGFibGVzLnBvcCgpO1xyXG4gICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgLy8gfSBlbHNlIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8gVE9ETzogYWRkIGxlbmd0aCBvZiB0b2tlblxyXG5cclxuICAgICAgICAgICAgaWYgKHN0LmJlZ2luc05ld1N0YWNrZnJhbWUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBzdC5zdGFja2ZyYW1lU2l6ZSA9IHRoaXMubmV4dEZyZWVSZWxhdGl2ZVN0YWNrUG9zO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0RnJlZVJlbGF0aXZlU3RhY2tQb3MgPSB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZS5zdGFja2ZyYW1lU2l6ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocHJvZ3JhbSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGluaXRTdGFja2ZyYW1lTm9kZSA9IHRoaXMuaW5pdFN0YWNrRnJhbWVOb2Rlcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5pdFN0YWNrZnJhbWVOb2RlICE9IG51bGwpIGluaXRTdGFja2ZyYW1lTm9kZS5yZXNlcnZlRm9yTG9jYWxWYXJpYWJsZXMgPSBzdC5zdGFja2ZyYW1lU2l6ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGggPiAwICYmIGRlbGV0ZVN0ZXBGaW5pc2hlZEZsYWdPblN0ZXBCZWZvcmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHN0YXRlbWVudCA9IHByb2dyYW0uc3RhdGVtZW50c1twcm9ncmFtLnN0YXRlbWVudHMubGVuZ3RoIC0gMV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkb24ndCBzZXQgc3RlcEZpbmlzaGVkID0gZmFsc2UgaW4ganVtcC1zdGF0ZW1lbnRzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFzIHRoaXMgY291bGQgbGVhZCB0byBpbmZpbml0eS1sb29wIGlzIHVzZXIgc2V0cyBcIndoaWxlKHRydWUpO1wiIGp1c3QgYmVmb3JlIHByb2dyYW0gZW5kXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChbVG9rZW5UeXBlLmp1bXBBbHdheXMsIFRva2VuVHlwZS5qdW1wSWZUcnVlLCBUb2tlblR5cGUuanVtcElmRmFsc2UsIFRva2VuVHlwZS5qdW1wSWZGYWxzZUFuZExlYXZlT25TdGFjaywgVG9rZW5UeXBlLmp1bXBJZlRydWVBbmRMZWF2ZU9uU3RhY2tdLmluZGV4T2Yoc3RhdGVtZW50LnR5cGUpID09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmFtLnN0YXRlbWVudHNbcHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCAtIDFdLnN0ZXBGaW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBwcm9ncmFtLnN0YXRlbWVudHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5jbG9zZVN0YWNrZnJhbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBzdC5wb3NpdGlvblRvXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVzaEVycm9yKHRleHQ6IHN0cmluZywgcG9zaXRpb246IFRleHRQb3NpdGlvbiwgZXJyb3JMZXZlbDogRXJyb3JMZXZlbCA9IFwiZXJyb3JcIiwgcXVpY2tGaXg/OiBRdWlja0ZpeCkge1xyXG4gICAgICAgIHRoaXMuZXJyb3JMaXN0LnB1c2goe1xyXG4gICAgICAgICAgICB0ZXh0OiB0ZXh0LFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24sXHJcbiAgICAgICAgICAgIHF1aWNrRml4OiBxdWlja0ZpeCxcclxuICAgICAgICAgICAgbGV2ZWw6IGVycm9yTGV2ZWxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBvcGVuQnJlYWtTY29wZSgpIHtcclxuICAgICAgICB0aGlzLmJyZWFrTm9kZVN0YWNrLnB1c2goW10pO1xyXG4gICAgfVxyXG5cclxuICAgIG9wZW5Db250aW51ZVNjb3BlKCkge1xyXG4gICAgICAgIHRoaXMuY29udGludWVOb2RlU3RhY2sucHVzaChbXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVzaEJyZWFrTm9kZShicmVha05vZGU6IEp1bXBBbHdheXNTdGF0ZW1lbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5icmVha05vZGVTdGFjay5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkVpbmUgYnJlYWstQW53ZWlzdW5nIGlzdCBudXIgaW5uZXJoYWxiIGVpbmVyIHVtZ2ViZW5kZW4gU2NobGVpZmUgb2RlciBzd2l0Y2gtQW53ZWlzdW5nIHNpbm52b2xsLlwiLCBicmVha05vZGUucG9zaXRpb24pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuYnJlYWtOb2RlU3RhY2tbdGhpcy5icmVha05vZGVTdGFjay5sZW5ndGggLSAxXS5wdXNoKGJyZWFrTm9kZSk7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoYnJlYWtOb2RlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVzaENvbnRpbnVlTm9kZShjb250aW51ZU5vZGU6IEp1bXBBbHdheXNTdGF0ZW1lbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5jb250aW51ZU5vZGVTdGFjay5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkVpbmUgY29udGludWUtQW53ZWlzdW5nIGlzdCBudXIgaW5uZXJoYWxiIGVpbmVyIHVtZ2ViZW5kZW4gU2NobGVpZmUgb2RlciBzd2l0Y2gtQW53ZWlzdW5nIHNpbm52b2xsLlwiLCBjb250aW51ZU5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGludWVOb2RlU3RhY2tbdGhpcy5jb250aW51ZU5vZGVTdGFjay5sZW5ndGggLSAxXS5wdXNoKGNvbnRpbnVlTm9kZSk7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoY29udGludWVOb2RlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xvc2VCcmVha1Njb3BlKGJyZWFrVGFyZ2V0TGFiZWw6IG51bWJlciwgbG06IExhYmVsTWFuYWdlcikge1xyXG4gICAgICAgIGxldCBicmVha05vZGVzID0gdGhpcy5icmVha05vZGVTdGFjay5wb3AoKTtcclxuICAgICAgICBmb3IgKGxldCBibiBvZiBicmVha05vZGVzKSB7XHJcbiAgICAgICAgICAgIGxtLnJlZ2lzdGVySnVtcE5vZGUoYm4sIGJyZWFrVGFyZ2V0TGFiZWwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbG9zZUNvbnRpbnVlU2NvcGUoY29udGludWVUYXJnZXRMYWJlbDogbnVtYmVyLCBsbTogTGFiZWxNYW5hZ2VyKSB7XHJcbiAgICAgICAgbGV0IGNvbnRpbnVlTm9kZXMgPSB0aGlzLmNvbnRpbnVlTm9kZVN0YWNrLnBvcCgpO1xyXG4gICAgICAgIGZvciAobGV0IGJuIG9mIGNvbnRpbnVlTm9kZXMpIHtcclxuICAgICAgICAgICAgbG0ucmVnaXN0ZXJKdW1wTm9kZShibiwgY29udGludWVUYXJnZXRMYWJlbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGJyZWFrT2NjdXJlZCgpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5icmVha05vZGVTdGFjay5sZW5ndGggPiAwICYmIHRoaXMuYnJlYWtOb2RlU3RhY2tbdGhpcy5icmVha05vZGVTdGFjay5sZW5ndGggLSAxXS5sZW5ndGggPiAwO1xyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NOb2RlKG5vZGU6IEFTVE5vZGUsIGlzTGVmdFNpZGVPZkFzc2lnbm1lbnQ6IGJvb2xlYW4gPSBmYWxzZSk6IFN0YWNrVHlwZSB7XHJcblxyXG4gICAgICAgIGlmIChub2RlID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgc3dpdGNoIChub2RlLnR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuYmluYXJ5T3A6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzQmluYXJ5T3Aobm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnVuYXJ5T3A6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzVW5hcnlPcChub2RlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucHVzaENvbnN0YW50OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVzaENvbnN0YW50KG5vZGUpO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5jYWxsTWV0aG9kOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZChub2RlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuaWRlbnRpZmllcjpcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc3RhY2tUeXBlID0gdGhpcy5yZXNvbHZlSWRlbnRpZmllcihub2RlKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdiA9IG5vZGUudmFyaWFibGU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHYgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNMZWZ0U2lkZU9mQXNzaWdubWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXYudXNlZEJlZm9yZUluaXRpYWxpemF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdi5kZWNsYXJhdGlvbkVycm9yID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2LmluaXRpYWxpemVkICE9IG51bGwgJiYgIXYuaW5pdGlhbGl6ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2LnVzZWRCZWZvcmVJbml0aWFsaXphdGlvbiA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgVmFyaWFibGUgXCIgKyB2LmlkZW50aWZpZXIgKyBcIiB3aXJkIGhpZXIgYmVudXR6dCBiZXZvciBzaWUgaW5pdGlhbGlzaWVydCB3dXJkZS5cIiwgbm9kZS5wb3NpdGlvbiwgXCJpbmZvXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdGFja1R5cGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnNlbGVjdEFycmF5RWxlbWVudDpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNlbGVjdEFycmF5RWxlbWVudChub2RlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuaW5jcmVtZW50RGVjcmVtZW50QmVmb3JlOlxyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5pbmNyZW1lbnREZWNyZW1lbnRBZnRlcjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluY3JlbWVudERlY3JlbWVudEJlZm9yZU9yQWZ0ZXIobm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnN1cGVyQ29uc3RydWN0b3JDYWxsOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3VwZXJjb25zdHJ1Y3RvckNhbGwobm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmRUaGlzOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVzaFRoaXNPclN1cGVyKG5vZGUsIGZhbHNlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZFN1cGVyOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVzaFRoaXNPclN1cGVyKG5vZGUsIHRydWUpO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5wdXNoQXR0cmlidXRlOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVzaEF0dHJpYnV0ZShub2RlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubmV3T2JqZWN0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV3T2JqZWN0KG5vZGUpO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkV2hpbGU6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzV2hpbGUobm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmREbzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb2Nlc3NEbyhub2RlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZEZvcjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb2Nlc3NGb3Iobm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmZvckxvb3BPdmVyQ29sbGVjdGlvbjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb2Nlc3NGb3JMb29wT3ZlckNvbGxlY3Rpb24obm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmRJZjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb2Nlc3NJZihub2RlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZFN3aXRjaDpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb2Nlc3NTd2l0Y2gobm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmRSZXR1cm46XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzUmV0dXJuKG5vZGUpO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5sb2NhbFZhcmlhYmxlRGVjbGFyYXRpb246XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5sb2NhbFZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmFycmF5SW5pdGlhbGl6YXRpb246XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzQXJyYXlMaXRlcmFsKG5vZGUpO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5uZXdBcnJheTpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb2Nlc3NOZXdBcnJheShub2RlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZFByaW50OlxyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkUHJpbnRsbjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb2Nlc3NQcmludChub2RlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuY2FzdFZhbHVlOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvY2Vzc01hbnVhbENhc3Qobm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmRCcmVhazpcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEJyZWFrTm9kZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmp1bXBBbHdheXMsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb25cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmRDb250aW51ZTpcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaENvbnRpbnVlTm9kZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmp1bXBBbHdheXMsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb25cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnJpZ2h0QnJhY2tldDpcclxuICAgICAgICAgICAgICAgIGxldCB0eXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLnRlcm1JbnNpZGVCcmFja2V0cyk7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZSAhPSBudWxsICYmIHR5cGUudHlwZSBpbnN0YW5jZW9mIEtsYXNzKSB0aGlzLnB1c2hUeXBlUG9zaXRpb24obm9kZS5wb3NpdGlvbiwgdHlwZS50eXBlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5zY29wZU5vZGU6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hOZXdTeW1ib2xUYWJsZShmYWxzZSwgbm9kZS5wb3NpdGlvbiwgbm9kZS5wb3NpdGlvblRvKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgd2l0aFJldHVyblN0YXRlbWVudCA9IHRoaXMucHJvY2Vzc1N0YXRlbWVudHNJbnNpZGVCbG9jayhub2RlLnN0YXRlbWVudHMpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucG9wU3ltYm9sVGFibGUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyB0eXBlOiBudWxsLCBpc0Fzc2lnbmFibGU6IGZhbHNlLCB3aXRoUmV0dXJuU3RhdGVtZW50OiB3aXRoUmV0dXJuU3RhdGVtZW50IH07XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc01hbnVhbENhc3Qobm9kZTogQ2FzdE1hbnVhbGx5Tm9kZSk6IFN0YWNrVHlwZSB7XHJcblxyXG4gICAgICAgIGxldCB0eXBlRnJvbTEgPSB0aGlzLnByb2Nlc3NOb2RlKG5vZGUud2hhdFRvQ2FzdCk7XHJcblxyXG4gICAgICAgIGlmICh0eXBlRnJvbTEgPT0gbnVsbCB8fCB0eXBlRnJvbTEudHlwZSA9PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgbGV0IHR5cGVGcm9tOiBUeXBlID0gdHlwZUZyb20xLnR5cGU7XHJcblxyXG4gICAgICAgIGlmICh0eXBlRnJvbSAhPSBudWxsICYmIG5vZGUuY2FzdFRvVHlwZSAhPSBudWxsICYmIG5vZGUuY2FzdFRvVHlwZS5yZXNvbHZlZFR5cGUgIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgbGV0IHR5cGVUbyA9IG5vZGUuY2FzdFRvVHlwZS5yZXNvbHZlZFR5cGU7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZUZyb20uY2FuQ2FzdFRvKHR5cGVUbykpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZUZyb20gaW5zdGFuY2VvZiBQcmltaXRpdmVUeXBlICYmIHR5cGVUbyBpbnN0YW5jZW9mIFByaW1pdGl2ZVR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgY2FzdEluZm8gPSB0eXBlRnJvbS5nZXRDYXN0SW5mb3JtYXRpb24odHlwZVRvKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FzdEluZm8ubmVlZHNTdGF0ZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2FzdFZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdUeXBlOiB0eXBlVG9cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlRnJvbSBpbnN0YW5jZW9mIEtsYXNzICYmIHR5cGVUbyA9PSBzdHJpbmdQcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRvU3RyaW5nTWV0aG9kID0gdHlwZUZyb20uZ2V0TWV0aG9kQnlTaWduYXR1cmUoXCJ0b1N0cmluZygpXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0b1N0cmluZ01ldGhvZCAhPSBudWxsICYmIHRvU3RyaW5nTWV0aG9kLmdldFJldHVyblR5cGUoKSA9PSBzdHJpbmdQcmltaXRpdmVUeXBlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5jYWxsTWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IHRvU3RyaW5nTWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNTdXBlckNhbGw6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tmcmFtZUJlZ2luOiAtMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVyIERhdGVudHlwIFwiICsgdHlwZUZyb20uaWRlbnRpZmllciArIFwiIGthbm4gKHp1bWluZGVzdCBkdXJjaCBjYXN0aW5nKSBuaWNodCBpbiBkZW4gRGF0ZW50eXAgXCIgKyB0eXBlVG8uaWRlbnRpZmllciArIFwiIHVtZ2V3YW5kZWx0IHdlcmRlbi5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmNhc3RWYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VHlwZTogdHlwZVRvXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBpc0Fzc2lnbmFibGU6IHR5cGVGcm9tMS5pc0Fzc2lnbmFibGUsXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogdHlwZVRvXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCh0eXBlRnJvbSBpbnN0YW5jZW9mIEtsYXNzIHx8IHR5cGVGcm9tIGluc3RhbmNlb2YgSW50ZXJmYWNlKSAmJiAodHlwZVRvIGluc3RhbmNlb2YgS2xhc3MgfHwgdHlwZVRvIGluc3RhbmNlb2YgSW50ZXJmYWNlKSlcclxuXHJcbiAgICAgICAgICAgIC8vIGlmICh0eXBlRnJvbSBpbnN0YW5jZW9mIEtsYXNzICYmXHJcbiAgICAgICAgICAgIC8vICAgICAodHlwZVRvIGluc3RhbmNlb2YgS2xhc3MgJiYgIXR5cGVGcm9tLmhhc0FuY2VzdG9yT3JJcyh0eXBlVG8pICYmIHR5cGVUby5oYXNBbmNlc3Rvck9ySXModHlwZUZyb20pKSB8fFxyXG4gICAgICAgICAgICAvLyAgICAgKHR5cGVUbyBpbnN0YW5jZW9mIEludGVyZmFjZSAmJiAhKDxLbGFzcz50eXBlRnJvbSkuaW1wbGVtZW50c0ludGVyZmFjZSh0eXBlVG8pKSkgXHJcbiAgICAgICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2hlY2tDYXN0LFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIG5ld1R5cGU6IHR5cGVUbyxcclxuICAgICAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlzQXNzaWduYWJsZTogdHlwZUZyb20xLmlzQXNzaWduYWJsZSxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiB0eXBlVG9cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBEYXRlbnR5cCBcIiArIHR5cGVGcm9tLmlkZW50aWZpZXIgKyBcIiBrYW5uICh6dW1pbmRlc3QgZHVyY2ggY2FzdGluZykgbmljaHQgaW4gZGVuIERhdGVudHlwIFwiICsgdHlwZVRvLmlkZW50aWZpZXIgKyBcIiB1bWdld2FuZGVsdCB3ZXJkZW4uXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc1ByaW50KG5vZGU6IFByaW50Tm9kZSk6IFN0YWNrVHlwZSB7XHJcblxyXG4gICAgICAgIGxldCB0eXBlID0gbm9kZS50eXBlID09IFRva2VuVHlwZS5rZXl3b3JkUHJpbnQgPyBUb2tlblR5cGUucHJpbnQgOiBUb2tlblR5cGUucHJpbnRsbjtcclxuXHJcbiAgICAgICAgdGhpcy5tb2R1bGUucHVzaE1ldGhvZENhbGxQb3NpdGlvbihub2RlLnBvc2l0aW9uLCBub2RlLmNvbW1hUG9zaXRpb25zLCBUb2tlblR5cGVSZWFkYWJsZVtub2RlLnR5cGVdLCBub2RlLnJpZ2h0QnJhY2tldFBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUudGV4dCAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgdHlwZSA9IHRoaXMucHJvY2Vzc05vZGUobm9kZS50ZXh0KTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5lbnN1cmVBdXRvbWF0aWNDYXN0aW5nKHR5cGUudHlwZSwgc3RyaW5nUHJpbWl0aXZlVHlwZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRpZSBNZXRob2RlbiBwcmludCB1bmQgcHJpbnRsbiBlcndhcnRlbiBlaW5lbiBQYXJhbWV0ZXIgdm9tIFR5cCBTdHJpbmcuIEdlZnVuZGVuIHd1cmRlIGVpbiBXZXJ0IHZvbSBUeXAgXCIgKyB0eXBlLnR5cGU/LmlkZW50aWZpZXIgKyBcIi5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgd2l0aENvbG9yOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmIChub2RlLmNvbG9yICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgIGxldCB0eXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLmNvbG9yKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlLnR5cGUgIT0gc3RyaW5nUHJpbWl0aXZlVHlwZSAmJiB0eXBlLnR5cGUgIT0gaW50UHJpbWl0aXZlVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5lbnN1cmVBdXRvbWF0aWNDYXN0aW5nKHR5cGUudHlwZSwgc3RyaW5nUHJpbWl0aXZlVHlwZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgTWV0aG9kZW4gcHJpbnQgdW5kIHByaW50bG4gZXJ3YXJ0ZW4gYWxzIEZhcmJlIGVpbmVuIFBhcmFtZXRlciB2b20gVHlwIFN0cmluZyBvZGVyIGludC4gR2VmdW5kZW4gd3VyZGUgZWluIFdlcnQgdm9tIFR5cCBcIiArIHR5cGUudHlwZS5pZGVudGlmaWVyICsgXCIuXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgd2l0aENvbG9yID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgIGVtcHR5OiAobm9kZS50ZXh0ID09IG51bGwpLFxyXG4gICAgICAgICAgICBzdGVwRmluaXNoZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIHdpdGhDb2xvcjogd2l0aENvbG9yXHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzTmV3QXJyYXkobm9kZTogTmV3QXJyYXlOb2RlKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUuaW5pdGlhbGl6YXRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzQXJyYXlMaXRlcmFsKG5vZGUuaW5pdGlhbGl6YXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gaW50WzddWzJdW10gYXJlIDcgYXJyYXlzIGVhY2ggd2l0aCBhcnJheXMgb2YgbGVuZ3RoIDIgd2hpY2ggYXJlIGVtcHR5XHJcblxyXG4gICAgICAgIGxldCBkaW1lbnNpb24gPSAwO1xyXG4gICAgICAgIGZvciAobGV0IGVjIG9mIG5vZGUuZWxlbWVudENvdW50KSB7XHJcbiAgICAgICAgICAgIGlmIChlYyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NOb2RlKGVjKTsgLy8gcHVzaCBudW1iZXIgb2YgZWxlbWVudHMgZm9yIHRoaXMgZGltZW5zaW9uIG9uIHN0YWNrXHJcbiAgICAgICAgICAgICAgICBkaW1lbnNpb24rKztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmb3IgdGhlIGFycmF5IGFib3ZlOiBhcnJheVR5cGUgaXMgYXJyYXkgb2YgYXJyYXkgb2YgaW50OyBkaW1lbnNpb24gaXMgMjsgc3RhY2s6IDcgMlxyXG4gICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaEVtcHR5QXJyYXksXHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICBhcnJheVR5cGU6IG5vZGUuYXJyYXlUeXBlLnJlc29sdmVkVHlwZSxcclxuICAgICAgICAgICAgZGltZW5zaW9uOiBkaW1lbnNpb25cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgaXNBc3NpZ25hYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgdHlwZTogbm9kZS5hcnJheVR5cGUucmVzb2x2ZWRUeXBlXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJvY2Vzc0FycmF5TGl0ZXJhbChub2RlOiBBcnJheUluaXRpYWxpemF0aW9uTm9kZSk6IFN0YWNrVHlwZSB7XHJcblxyXG4gICAgICAgIGxldCBiZXM6IEJlZ2luQXJyYXlTdGF0ZW1lbnQgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5iZWdpbkFycmF5LFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgYXJyYXlUeXBlOiBub2RlLmFycmF5VHlwZS5yZXNvbHZlZFR5cGVcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKGJlcyk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGFpbiBvZiBub2RlLm5vZGVzKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBEaWQgYW4gZXJyb3Igb2NjdXIgd2hlbiBwYXJzaW5nIGEgY29uc3RhbnQ/XHJcbiAgICAgICAgICAgIGlmIChhaW4gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhaW4udHlwZSA9PSBUb2tlblR5cGUuYXJyYXlJbml0aWFsaXphdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzQXJyYXlMaXRlcmFsKGFpbik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgc1R5cGUgPSB0aGlzLnByb2Nlc3NOb2RlKGFpbik7XHJcbiAgICAgICAgICAgICAgICBpZiAoc1R5cGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxldCB0YXJnZXRUeXBlID0gKDxBcnJheVR5cGU+bm9kZS5hcnJheVR5cGUucmVzb2x2ZWRUeXBlKS5hcnJheU9mVHlwZTtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5lbnN1cmVBdXRvbWF0aWNDYXN0aW5nKHNUeXBlLnR5cGUsIHRhcmdldFR5cGUsIGFpbi5wb3NpdGlvbikpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBEYXRlbnR5cCBkZXMgVGVybXMgKFwiICsgc1R5cGUudHlwZS5pZGVudGlmaWVyICsgXCIpIGthbm4gbmljaHQgaW4gZGVuIERhdGVudHlwIFwiICsgdGFyZ2V0VHlwZS5pZGVudGlmaWVyICsgXCIga29udmVydGllcnQgd2VyZGVuLlwiLCBhaW4ucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5hZGRUb0FycmF5LFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgbnVtYmVyT2ZFbGVtZW50c1RvQWRkOiBub2RlLm5vZGVzLmxlbmd0aFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBpc0Fzc2lnbmFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICB0eXBlOiBub2RlLmFycmF5VHlwZS5yZXNvbHZlZFR5cGVcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGxvY2FsVmFyaWFibGVEZWNsYXJhdGlvbihub2RlOiBMb2NhbFZhcmlhYmxlRGVjbGFyYXRpb25Ob2RlLCBkb250V2FybldoZW5Ob0luaXRpYWxpemF0aW9uOiBib29sZWFuID0gZmFsc2UpOiBTdGFja1R5cGUge1xyXG5cclxuICAgICAgICBpZiAobm9kZS52YXJpYWJsZVR5cGUucmVzb2x2ZWRUeXBlID09IG51bGwpIHtcclxuICAgICAgICAgICAgbm9kZS52YXJpYWJsZVR5cGUucmVzb2x2ZWRUeXBlID0gbnVsbFR5cGU7IC8vIE1ha2UgdGhlIGJlc3Qgb3V0IG9mIGl0Li4uXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZGVjbGFyZVZhcmlhYmxlT25IZWFwID0gKHRoaXMuaGVhcCAhPSBudWxsICYmIHRoaXMuc3ltYm9sVGFibGVTdGFjay5sZW5ndGggPD0gMik7XHJcblxyXG4gICAgICAgIGxldCB2YXJpYWJsZTogVmFyaWFibGUgPSB7XHJcbiAgICAgICAgICAgIGlkZW50aWZpZXI6IG5vZGUuaWRlbnRpZmllcixcclxuICAgICAgICAgICAgc3RhY2tQb3M6IGRlY2xhcmVWYXJpYWJsZU9uSGVhcCA/IG51bGwgOiB0aGlzLm5leHRGcmVlUmVsYXRpdmVTdGFja1BvcysrLFxyXG4gICAgICAgICAgICB0eXBlOiBub2RlLnZhcmlhYmxlVHlwZS5yZXNvbHZlZFR5cGUsXHJcbiAgICAgICAgICAgIHVzYWdlUG9zaXRpb25zOiBuZXcgTWFwKCksXHJcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uOiB7IG1vZHVsZTogdGhpcy5tb2R1bGUsIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uIH0sXHJcbiAgICAgICAgICAgIGlzRmluYWw6IG5vZGUuaXNGaW5hbFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMucHVzaFVzYWdlUG9zaXRpb24obm9kZS5wb3NpdGlvbiwgdmFyaWFibGUpO1xyXG5cclxuICAgICAgICBpZiAoZGVjbGFyZVZhcmlhYmxlT25IZWFwKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5oZWFwVmFyaWFibGVEZWNsYXJhdGlvbixcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgcHVzaE9uVG9wT2ZTdGFja0ZvckluaXRpYWxpemF0aW9uOiBub2RlLmluaXRpYWxpemF0aW9uICE9IG51bGwsXHJcbiAgICAgICAgICAgICAgICB2YXJpYWJsZTogdmFyaWFibGUsXHJcbiAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IG5vZGUuaW5pdGlhbGl6YXRpb24gPT0gbnVsbFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmhlYXBbdmFyaWFibGUuaWRlbnRpZmllcl0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIFZhcmlhYmxlIFwiICsgbm9kZS5pZGVudGlmaWVyICsgXCIgZGFyZiBpbSBzZWxiZW4gU2ljaHRiYXJrZWl0c2JlcmVpY2ggKFNjb3BlKSBuaWNodCBtZWhybWFscyBkZWZpbmllcnQgd2VyZGVuLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5oZWFwW3ZhcmlhYmxlLmlkZW50aWZpZXJdID0gdmFyaWFibGU7XHJcbiAgICAgICAgICAgIC8vIG9ubHkgZm9yIGNvZGUgY29tcGxldGlvbjpcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50U3ltYm9sVGFibGUudmFyaWFibGVNYXAuc2V0KG5vZGUuaWRlbnRpZmllciwgdmFyaWFibGUpO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLnZhcmlhYmxlTWFwLmdldChub2RlLmlkZW50aWZpZXIpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRpZSBWYXJpYWJsZSBcIiArIG5vZGUuaWRlbnRpZmllciArIFwiIGRhcmYgaW0gc2VsYmVuIFNpY2h0YmFya2VpdHNiZXJlaWNoIChTY29wZSkgbmljaHQgbWVocm1hbHMgZGVmaW5pZXJ0IHdlcmRlbi5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLnZhcmlhYmxlTWFwLnNldChub2RlLmlkZW50aWZpZXIsIHZhcmlhYmxlKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmxvY2FsVmFyaWFibGVEZWNsYXJhdGlvbixcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgcHVzaE9uVG9wT2ZTdGFja0ZvckluaXRpYWxpemF0aW9uOiBub2RlLmluaXRpYWxpemF0aW9uICE9IG51bGwsXHJcbiAgICAgICAgICAgICAgICB2YXJpYWJsZTogdmFyaWFibGUsXHJcbiAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IG5vZGUuaW5pdGlhbGl6YXRpb24gPT0gbnVsbFxyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChub2RlLmluaXRpYWxpemF0aW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgbGV0IGluaXRUeXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLmluaXRpYWxpemF0aW9uKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpbml0VHlwZSAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlLnR5cGUgPT0gdmFyVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlLnR5cGUgPSBpbml0VHlwZS50eXBlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpbml0VHlwZS50eXBlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBUeXAgZGVzIFRlcm1zIGF1ZiBkZXIgcmVjaHRlbiBTZWl0ZSBkZXMgWnV3ZWlzdW5nc29wZXJhdG9ycyAoPSkga29ubnRlIG5pY2h0IGJlc3RpbW10IHdlcmRlbi5cIiwgbm9kZS5pbml0aWFsaXphdGlvbi5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZW5zdXJlQXV0b21hdGljQ2FzdGluZyhpbml0VHlwZS50eXBlLCB2YXJpYWJsZS50eXBlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBUZXJtIHZvbSBUeXAgXCIgKyBpbml0VHlwZS50eXBlLmlkZW50aWZpZXIgKyBcIiBrYW5uIGRlciBWYXJpYWJsZSB2b20gVHlwIFwiICsgdmFyaWFibGUudHlwZS5pZGVudGlmaWVyICsgXCIgbmljaHQgenVnZW9yZG5ldCB3ZXJkZW4uXCIsIG5vZGUuaW5pdGlhbGl6YXRpb24ucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuYXNzaWdubWVudCxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5pbml0aWFsaXphdGlvbi5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbGVhdmVWYWx1ZU9uU3RhY2s6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodmFyaWFibGUudHlwZSA9PSB2YXJUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRpZSBWZXJ3ZW5kdW5nIHZvbiB2YXIgaXN0IG51ciBkYW5uIHp1bMOkc3NpZywgd2VubiBlaW5lIGxva2FsZSBWYXJpYWJsZSBpbiBlaW5lciBBbndlaXN1bmcgZGVrbGFyaWVydCB1bmQgaW5pdGlhbGlzaWVydCB3aXJkLCBhbHNvIHouQi4gdmFyIGkgPSAxMjtcIiwgbm9kZS52YXJpYWJsZVR5cGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGV0IGluaXRpYWxpemVyOiBzdHJpbmcgPSBcIiA9IG51bGxcIjtcclxuICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZS50eXBlID09IGludFByaW1pdGl2ZVR5cGUpIGluaXRpYWxpemVyID0gXCIgPSAwXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFyaWFibGUudHlwZSA9PSBkb3VibGVQcmltaXRpdmVUeXBlKSBpbml0aWFsaXplciA9IFwiID0gMC4wXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFyaWFibGUudHlwZSA9PSBib29sZWFuUHJpbWl0aXZlVHlwZSkgaW5pdGlhbGl6ZXIgPSBcIiA9IGZhbHNlXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFyaWFibGUudHlwZSA9PSBjaGFyUHJpbWl0aXZlVHlwZSkgaW5pdGlhbGl6ZXIgPSBcIiA9ICcgJ1wiO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlLnR5cGUgPT0gc3RyaW5nUHJpbWl0aXZlVHlwZSkgaW5pdGlhbGl6ZXIgPSAnID0gXCJcIic7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyaWFibGUuZGVjbGFyYXRpb25FcnJvciA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIkplZGUgbG9rYWxlIFZhcmlhYmxlIHNvbGx0ZSB2b3IgaWhyZXIgZXJzdGVuIFZlcndlbmR1bmcgaW5pdGlhbGlzaWVydCB3ZXJkZW4uXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgcXVpY2tGaXg6XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogaW5pdGlhbGl6ZXIgKyBcIiBlcmfDpG56ZW5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdHNQcm92aWRlcjogKHVyaSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHBvcyA9IG5vZGUucG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2U6IHVyaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHsgc3RhcnRMaW5lTnVtYmVyOiBwb3MubGluZSwgc3RhcnRDb2x1bW46IHBvcy5jb2x1bW4gKyBwb3MubGVuZ3RoLCBlbmRMaW5lTnVtYmVyOiBwb3MubGluZSwgZW5kQ29sdW1uOiBwb3MuY29sdW1uICsgcG9zLmxlbmd0aCB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogaW5pdGlhbGl6ZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgbGV2ZWw6IFwiaW5mb1wiXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyaWFibGUudXNlZEJlZm9yZUluaXRpYWxpemF0aW9uID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB2YXJpYWJsZS5pbml0aWFsaXplZCA9IGRvbnRXYXJuV2hlbk5vSW5pdGlhbGl6YXRpb247XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc1JldHVybihub2RlOiBSZXR1cm5Ob2RlKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgbGV0IG1ldGhvZCA9IHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLm1ldGhvZDtcclxuXHJcbiAgICAgICAgaWYgKG1ldGhvZCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRWluZSByZXR1cm4tQW53ZWlzdW5nIGlzdCBudXIgaW0gS29udGV4dCBlaW5lciBNZXRob2RlIGVybGF1YnQuXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChub2RlLnRlcm0gIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKG1ldGhvZC5nZXRSZXR1cm5UeXBlKCkgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgTWV0aG9kZSBcIiArIG1ldGhvZC5pZGVudGlmaWVyICsgXCIgZXJ3YXJ0ZXQga2VpbmVuIFLDvGNrZ2FiZXdlcnQuXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCB0eXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLnRlcm0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmVuc3VyZUF1dG9tYXRpY0Nhc3RpbmcodHlwZS50eXBlLCBtZXRob2QuZ2V0UmV0dXJuVHlwZSgpLCBudWxsLCBub2RlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIE1ldGhvZGUgXCIgKyBtZXRob2QuaWRlbnRpZmllciArIFwiIGVyd2FyZXQgZWluZW4gUsO8Y2tnYWJld2VydCB2b20gVHlwIFwiICsgbWV0aG9kLmdldFJldHVyblR5cGUoKS5pZGVudGlmaWVyICsgXCIuIEdlZnVuZGVuIHd1cmRlIGVpbiBXZXJ0IHZvbSBUeXAgXCIgKyB0eXBlLnR5cGUuaWRlbnRpZmllciArIFwiLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKG1ldGhvZC5nZXRSZXR1cm5UeXBlKCkgIT0gbnVsbCAmJiBtZXRob2QuZ2V0UmV0dXJuVHlwZSgpICE9IHZvaWRQcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRpZSBNZXRob2RlIFwiICsgbWV0aG9kLmlkZW50aWZpZXIgKyBcIiBlcndhcnRldCBlaW5lbiBSw7xja2dhYmV3ZXJ0IHZvbSBUeXAgXCIgKyBtZXRob2QuZ2V0UmV0dXJuVHlwZSgpLmlkZW50aWZpZXIgKyBcIiwgZGFoZXIgaXN0IGRpZSBsZWVyZSBSZXR1cm4tQW53ZWlzdW5nIChyZXR1cm47KSBuaWNodCBhdXNyZWljaGVuZC5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucmV0dXJuLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgY29weVJldHVyblZhbHVlVG9TdGFja2ZyYW1lUG9zMDogbm9kZS50ZXJtICE9IG51bGwsXHJcbiAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogdHJ1ZSxcclxuICAgICAgICAgICAgbGVhdmVUaGlzT2JqZWN0T25TdGFjazogZmFsc2VcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogbnVsbCwgaXNBc3NpZ25hYmxlOiBmYWxzZSwgd2l0aFJldHVyblN0YXRlbWVudDogdHJ1ZSB9O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzU3dpdGNoKG5vZGU6IFN3aXRjaE5vZGUpOiBTdGFja1R5cGUge1xyXG5cclxuICAgICAgICBsZXQgbG0gPSB0aGlzLmN1cnJlbnRQcm9ncmFtLmxhYmVsTWFuYWdlcjtcclxuXHJcbiAgICAgICAgdGhpcy5wdXNoTmV3U3ltYm9sVGFibGUoZmFsc2UsIG5vZGUuc2NvcGVGcm9tLCBub2RlLnNjb3BlVG8pO1xyXG5cclxuICAgICAgICBsZXQgY3QgPSB0aGlzLnByb2Nlc3NOb2RlKG5vZGUuY29uZGl0aW9uKTtcclxuICAgICAgICBpZiAoY3QgPT0gbnVsbCB8fCBjdC50eXBlID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IGNvbmRpdGlvblR5cGUgPSBjdC50eXBlO1xyXG5cclxuICAgICAgICBsZXQgaXNTdHJpbmcgPSBjb25kaXRpb25UeXBlID09IHN0cmluZ1ByaW1pdGl2ZVR5cGUgfHwgY29uZGl0aW9uVHlwZSA9PSBjaGFyUHJpbWl0aXZlVHlwZTtcclxuICAgICAgICBsZXQgaXNJbnRlZ2VyID0gY29uZGl0aW9uVHlwZSA9PSBpbnRQcmltaXRpdmVUeXBlO1xyXG4gICAgICAgIGxldCBpc0VudW0gPSBjb25kaXRpb25UeXBlIGluc3RhbmNlb2YgRW51bTtcclxuXHJcbiAgICAgICAgaWYgKCEoaXNTdHJpbmcgfHwgaXNJbnRlZ2VyIHx8IGlzRW51bSkpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgVW50ZXJzY2hlaWR1bmdzdGVybXMgZWluZXIgc3dpdGNoLUFud2Vpc3VuZyBtdXNzIGRlbiBEYXRlbnR5cCBTdHJpbmcsIGNoYXIsIGludCBvZGVyIGVudW0gYmVzaXR6ZW4uIERpZXNlciBoaWVyIGlzdCB2b20gVHlwIFwiICsgY29uZGl0aW9uVHlwZS5pZGVudGlmaWVyLCBub2RlLmNvbmRpdGlvbi5wb3NpdGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXNFbnVtKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmNhc3RWYWx1ZSxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLmNvbmRpdGlvbi5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIG5ld1R5cGU6IGludFByaW1pdGl2ZVR5cGVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc3dpdGNoU3RhdGVtZW50OiBKdW1wT25Td2l0Y2hTdGF0ZW1lbnQgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5rZXl3b3JkU3dpdGNoLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgZGVmYXVsdERlc3RpbmF0aW9uOiBudWxsLFxyXG4gICAgICAgICAgICBzd2l0Y2hUeXBlOiBpc1N0cmluZyA/IFwic3RyaW5nXCIgOiBcIm51bWJlclwiLFxyXG4gICAgICAgICAgICBkZXN0aW5hdGlvbkxhYmVsczogW10sXHJcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uTWFwOiB7fVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyhzd2l0Y2hTdGF0ZW1lbnQpO1xyXG5cclxuICAgICAgICAvLyBpZiB2YWx1ZSBub3QgaW5jbHVkZWQgaW4gY2FzZS1zdGF0ZW1lbnQgYW5kIG5vIGRlZmF1bHQtc3RhdGVtZW50IHByZXNlbnQ6XHJcbiAgICAgICAgbGV0IGVuZExhYmVsID0gbG0uaW5zZXJ0SnVtcE5vZGUoVG9rZW5UeXBlLmp1bXBBbHdheXMsIG5vZGUucG9zaXRpb24sIHRoaXMpO1xyXG5cclxuICAgICAgICBzd2l0Y2hTdGF0ZW1lbnQuc3RlcEZpbmlzaGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgbG0ucmVnaXN0ZXJTd2l0Y2hTdGF0ZW1lbnQoc3dpdGNoU3RhdGVtZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy5vcGVuQnJlYWtTY29wZSgpO1xyXG5cclxuICAgICAgICBsZXQgd2l0aFJldHVyblN0YXRlbWVudCA9IG5vZGUuY2FzZU5vZGVzLmxlbmd0aCA+IDA7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGNhc2VOb2RlIG9mIG5vZGUuY2FzZU5vZGVzKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgaXNEZWZhdWx0ID0gY2FzZU5vZGUuY2FzZVRlcm0gPT0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmICghaXNEZWZhdWx0KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGNvbnN0YW50OiBzdHJpbmcgfCBudW1iZXIgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpc0VudW0gJiYgY2FzZU5vZGUuY2FzZVRlcm0udHlwZSA9PSBUb2tlblR5cGUuaWRlbnRpZmllcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBlbjogRW51bSA9IDxFbnVtPmNvbmRpdGlvblR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGluZm8gPSBlbi5pZGVudGlmaWVyVG9JbmZvTWFwW2Nhc2VOb2RlLmNhc2VUZXJtLmlkZW50aWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmZvID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgRW51bS1LbGFzc2UgXCIgKyBjb25kaXRpb25UeXBlLmlkZW50aWZpZXIgKyBcIiBoYXQga2VpbiBFbGVtZW50IG1pdCBkZW0gQmV6ZWljaG5lciBcIiArIGNhc2VOb2RlLmNhc2VUZXJtLmlkZW50aWZpZXIsIGNhc2VOb2RlLnBvc2l0aW9uLCBcImVycm9yXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0YW50ID0gaW5mby5vcmRpbmFsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNhc2VUZXJtID0gdGhpcy5wcm9jZXNzTm9kZShjYXNlTm9kZS5jYXNlVGVybSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBscyA9IHRoaXMubGFzdFN0YXRlbWVudDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxzLnR5cGUgPT0gVG9rZW5UeXBlLnB1c2hDb25zdGFudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdGFudCA9IGxzLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxzLnR5cGUgPT0gVG9rZW5UeXBlLnB1c2hFbnVtVmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3RhbnQgPSBscy5lbnVtQ2xhc3MuZ2V0T3JkaW5hbChscy52YWx1ZUlkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVMYXN0U3RhdGVtZW50KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNvbnN0YW50ID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBUZXJtIGJlaSBjYXNlIG11c3Mga29uc3RhbnQgc2Vpbi5cIiwgY2FzZU5vZGUuY2FzZVRlcm0ucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBsYWJlbCA9IGxtLm1hcmtKdW1wRGVzdGluYXRpb24oMSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgc3RhdGVtZW50cyA9IHRoaXMuZ2VuZXJhdGVTdGF0ZW1lbnRzKGNhc2VOb2RlLnN0YXRlbWVudHMpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZW1lbnRzPy53aXRoUmV0dXJuU3RhdGVtZW50ID09IG51bGwgfHwgIXN0YXRlbWVudHMud2l0aFJldHVyblN0YXRlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpdGhSZXR1cm5TdGF0ZW1lbnQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzd2l0Y2hTdGF0ZW1lbnQuZGVzdGluYXRpb25MYWJlbHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3RhbnQ6IGNvbnN0YW50LFxyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBsYWJlbFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbGFiZWwgPSBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZVN0YXRlbWVudHMoY2FzZU5vZGUuc3RhdGVtZW50cyk7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2hTdGF0ZW1lbnQuZGVmYXVsdERlc3RpbmF0aW9uID0gbGFiZWw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbG0ubWFya0p1bXBEZXN0aW5hdGlvbigxLCBlbmRMYWJlbCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2xvc2VCcmVha1Njb3BlKGVuZExhYmVsLCBsbSk7XHJcblxyXG4gICAgICAgIHRoaXMucG9wU3ltYm9sVGFibGUobnVsbCk7XHJcblxyXG4gICAgICAgIHJldHVybiB7IHR5cGU6IG51bGwsIGlzQXNzaWduYWJsZTogZmFsc2UsIHdpdGhSZXR1cm5TdGF0ZW1lbnQ6IHdpdGhSZXR1cm5TdGF0ZW1lbnQgfTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzSWYobm9kZTogSWZOb2RlKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgbGV0IGxtID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXI7XHJcblxyXG4gICAgICAgIGxldCBjb25kaXRpb25UeXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLmNvbmRpdGlvbik7XHJcblxyXG4gICAgICAgIHRoaXMuY2hlY2tJZkFzc2lnbm1lbnRJbnN0ZWRPZkVxdWFsKG5vZGUuY29uZGl0aW9uLCBjb25kaXRpb25UeXBlPy50eXBlKTtcclxuICAgICAgICBpZiAoY29uZGl0aW9uVHlwZSAhPSBudWxsICYmIGNvbmRpdGlvblR5cGUudHlwZSAhPSBib29sZWFuUHJpbWl0aXZlVHlwZSkge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBXZXJ0IGRlcyBUZXJtcyBpbiBLbGFtbWVybiBoaW50ZXIgJ2lmJyBtdXNzIGRlbiBEYXRlbnR5cCBib29sZWFuIGJlc2l0emVuLlwiLCBub2RlLmNvbmRpdGlvbi5wb3NpdGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYmVnaW5FbHNlID0gbG0uaW5zZXJ0SnVtcE5vZGUoVG9rZW5UeXBlLmp1bXBJZkZhbHNlLCBudWxsLCB0aGlzKTtcclxuXHJcbiAgICAgICAgbGV0IHdpdGhSZXR1cm5TdGF0ZW1lbnRJZiA9IHRoaXMuZ2VuZXJhdGVTdGF0ZW1lbnRzKG5vZGUuc3RhdGVtZW50c0lmVHJ1ZSkud2l0aFJldHVyblN0YXRlbWVudDtcclxuXHJcbiAgICAgICAgbGV0IGVuZE9mSWY6IG51bWJlcjtcclxuICAgICAgICBpZiAobm9kZS5zdGF0ZW1lbnRzSWZGYWxzZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGVuZE9mSWYgPSBsbS5pbnNlcnRKdW1wTm9kZShUb2tlblR5cGUuanVtcEFsd2F5cywgbnVsbCwgdGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEsIGJlZ2luRWxzZSk7XHJcblxyXG4gICAgICAgIGxldCB3aXRoUmV0dXJuU3RhdGVtZW50RWxzZTogYm9vbGVhbjtcclxuICAgICAgICBpZiAobm9kZS5zdGF0ZW1lbnRzSWZGYWxzZSA9PSBudWxsIHx8IG5vZGUuc3RhdGVtZW50c0lmRmFsc2UubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgd2l0aFJldHVyblN0YXRlbWVudEVsc2UgPSBmYWxzZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB3aXRoUmV0dXJuU3RhdGVtZW50RWxzZSA9IHRoaXMuZ2VuZXJhdGVTdGF0ZW1lbnRzKG5vZGUuc3RhdGVtZW50c0lmRmFsc2UpLndpdGhSZXR1cm5TdGF0ZW1lbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZW5kT2ZJZiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxtLm1hcmtKdW1wRGVzdGluYXRpb24oMSwgZW5kT2ZJZik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geyB0eXBlOiBudWxsLCBpc0Fzc2lnbmFibGU6IGZhbHNlLCB3aXRoUmV0dXJuU3RhdGVtZW50OiB3aXRoUmV0dXJuU3RhdGVtZW50SWYgJiYgd2l0aFJldHVyblN0YXRlbWVudEVsc2UgfTtcclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByb2Nlc3NGb3Iobm9kZTogRm9yTm9kZSk6IFN0YWNrVHlwZSB7XHJcblxyXG4gICAgICAgIGxldCBsbSA9IHRoaXMuY3VycmVudFByb2dyYW0ubGFiZWxNYW5hZ2VyO1xyXG5cclxuICAgICAgICB0aGlzLnB1c2hOZXdTeW1ib2xUYWJsZShmYWxzZSwgbm9kZS5zY29wZUZyb20sIG5vZGUuc2NvcGVUbyk7XHJcblxyXG4gICAgICAgIHRoaXMuZ2VuZXJhdGVTdGF0ZW1lbnRzKG5vZGUuc3RhdGVtZW50c0JlZm9yZSk7XHJcblxyXG4gICAgICAgIGxldCBsYWJlbEJlZm9yZUNvbmRpdGlvbiA9IGxtLm1hcmtKdW1wRGVzdGluYXRpb24oMSk7XHJcblxyXG4gICAgICAgIGxldCBjb25kaXRpb25UeXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLmNvbmRpdGlvbik7XHJcblxyXG4gICAgICAgIGlmIChjb25kaXRpb25UeXBlICE9IG51bGwgJiYgY29uZGl0aW9uVHlwZS50eXBlICE9IGJvb2xlYW5QcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hlY2tJZkFzc2lnbm1lbnRJbnN0ZWRPZkVxdWFsKG5vZGUuY29uZGl0aW9uKTtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgV2VydCBkZXIgQmVkaW5ndW5nIG11c3MgZGVuIERhdGVudHlwIGJvb2xlYW4gYmVzaXR6ZW4uXCIsIG5vZGUuY29uZGl0aW9uLnBvc2l0aW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBsYWJlbEFmdGVyRm9yTG9vcCA9IGxtLmluc2VydEp1bXBOb2RlKFRva2VuVHlwZS5qdW1wSWZGYWxzZSwgbnVsbCwgdGhpcyk7XHJcblxyXG4gICAgICAgIHRoaXMub3BlbkJyZWFrU2NvcGUoKTtcclxuICAgICAgICB0aGlzLm9wZW5Db250aW51ZVNjb3BlKCk7XHJcblxyXG4gICAgICAgIGxldCBzdGF0ZW1lbnRzID0gdGhpcy5nZW5lcmF0ZVN0YXRlbWVudHMobm9kZS5zdGF0ZW1lbnRzKTtcclxuICAgICAgICBsZXQgd2l0aFJldHVyblN0YXRlbWVudCA9IHN0YXRlbWVudHMud2l0aFJldHVyblN0YXRlbWVudDtcclxuXHJcbiAgICAgICAgbGV0IGNvbnRpbnVlTGFiZWxJbmRleCA9IGxtLm1hcmtKdW1wRGVzdGluYXRpb24oMSk7XHJcbiAgICAgICAgdGhpcy5jbG9zZUNvbnRpbnVlU2NvcGUoY29udGludWVMYWJlbEluZGV4LCBsbSk7XHJcbiAgICAgICAgdGhpcy5nZW5lcmF0ZVN0YXRlbWVudHMobm9kZS5zdGF0ZW1lbnRzQWZ0ZXIpO1xyXG5cclxuICAgICAgICBsbS5pbnNlcnRKdW1wTm9kZShUb2tlblR5cGUuanVtcEFsd2F5cywgc3RhdGVtZW50cy5lbmRQb3NpdGlvbiwgdGhpcywgbGFiZWxCZWZvcmVDb25kaXRpb24pO1xyXG5cclxuICAgICAgICBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEsIGxhYmVsQWZ0ZXJGb3JMb29wKTtcclxuXHJcbiAgICAgICAgdGhpcy5jbG9zZUJyZWFrU2NvcGUobGFiZWxBZnRlckZvckxvb3AsIGxtKTtcclxuXHJcbiAgICAgICAgdGhpcy5wb3BTeW1ib2xUYWJsZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4geyB0eXBlOiBudWxsLCBpc0Fzc2lnbmFibGU6IGZhbHNlLCB3aXRoUmV0dXJuU3RhdGVtZW50OiB3aXRoUmV0dXJuU3RhdGVtZW50IH07XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NGb3JMb29wT3ZlckNvbGxlY3Rpb24obm9kZTogRm9yTm9kZU92ZXJDb2xsZWNpb24pOiBTdGFja1R5cGUge1xyXG5cclxuICAgICAgICBsZXQgbG0gPSB0aGlzLmN1cnJlbnRQcm9ncmFtLmxhYmVsTWFuYWdlcjtcclxuXHJcbiAgICAgICAgdGhpcy5wdXNoTmV3U3ltYm9sVGFibGUoZmFsc2UsIG5vZGUuc2NvcGVGcm9tLCBub2RlLnNjb3BlVG8pO1xyXG5cclxuICAgICAgICAvLyByZXNlcnZlIHBvc2l0aW9uIG9uIHN0YWNrIGZvciBjb2xsZWN0aW9uXHJcbiAgICAgICAgbGV0IHN0YWNrUG9zRm9yQ29sbGVjdGlvbiA9IHRoaXMubmV4dEZyZWVSZWxhdGl2ZVN0YWNrUG9zKys7XHJcblxyXG4gICAgICAgIC8vIGFzc2lnbiB2YWx1ZSBvZiBjb2xsZWN0aW9uIHRlcm0gdG8gY29sbGVjdGlvblxyXG4gICAgICAgIGxldCBjdCA9IHRoaXMucHJvY2Vzc05vZGUobm9kZS5jb2xsZWN0aW9uKTtcclxuICAgICAgICBpZiAoY3QgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIGxldCBjb2xsZWN0aW9uVHlwZSA9IGN0LnR5cGU7XHJcblxyXG4gICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucG9wQW5kU3RvcmVJbnRvVmFyaWFibGUsXHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLmNvbGxlY3Rpb24ucG9zaXRpb24sXHJcbiAgICAgICAgICAgIHN0YWNrcG9zT2ZWYXJpYWJsZTogc3RhY2tQb3NGb3JDb2xsZWN0aW9uLFxyXG4gICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgbGV0IGNvbGxlY3Rpb25FbGVtZW50VHlwZTogVHlwZTtcclxuXHJcbiAgICAgICAgbGV0IGtpbmQ6IFwiYXJyYXlcIiB8IFwiaW50ZXJuYWxMaXN0XCIgfCBcImdyb3VwXCIgfCBcInVzZXJEZWZpbmVkSXRlcmFibGVcIiA9IG51bGw7XHJcblxyXG4gICAgICAgIGlmIChjb2xsZWN0aW9uVHlwZSBpbnN0YW5jZW9mIEFycmF5VHlwZSkge1xyXG4gICAgICAgICAgICBjb2xsZWN0aW9uRWxlbWVudFR5cGUgPSBjb2xsZWN0aW9uVHlwZS5hcnJheU9mVHlwZTtcclxuICAgICAgICAgICAga2luZCA9IFwiYXJyYXlcIjtcclxuICAgICAgICB9IGVsc2UgaWYgKGNvbGxlY3Rpb25UeXBlIGluc3RhbmNlb2YgS2xhc3MgJiYgY29sbGVjdGlvblR5cGUuZ2V0SW1wbGVtZW50ZWRJbnRlcmZhY2UoXCJJdGVyYWJsZVwiKSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGlmIChjb2xsZWN0aW9uVHlwZS5tb2R1bGUuaXNTeXN0ZW1Nb2R1bGUpIHtcclxuICAgICAgICAgICAgICAgIGtpbmQgPSBcImludGVybmFsTGlzdFwiO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAga2luZCA9IFwidXNlckRlZmluZWRJdGVyYWJsZVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBpdGVyYWJsZUludGVyZmFjZSA9IGNvbGxlY3Rpb25UeXBlLmdldEltcGxlbWVudGVkSW50ZXJmYWNlKFwiSXRlcmFibGVcIik7XHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb25FbGVtZW50VHlwZSA9IGNvbGxlY3Rpb25UeXBlLnR5cGVWYXJpYWJsZXNbMF0udHlwZTtcclxuICAgICAgICB9IGVsc2UgaWYgKGNvbGxlY3Rpb25UeXBlIGluc3RhbmNlb2YgS2xhc3MgJiYgY29sbGVjdGlvblR5cGUuaWRlbnRpZmllciA9PSBcIkdyb3VwXCIpIHtcclxuICAgICAgICAgICAga2luZCA9IFwiZ3JvdXBcIjtcclxuICAgICAgICAgICAgY29sbGVjdGlvbkVsZW1lbnRUeXBlID0gdGhpcy5tb2R1bGVTdG9yZS5nZXRUeXBlKFwiU2hhcGVcIikudHlwZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiTWl0IGRlciB2ZXJlaW5mYWNodGVuIGZvci1TY2hsZWlmZSAoZm9yIGlkZW50aWZpZXIgOiBjb2xsZWN0aW9uT3JBcnJheSkga2FubiBtYW4gbnVyIMO8YmVyIEFycmF5cyBvZGVyIEtsYXNzZW4sIGRpZSBkYXMgSW50ZXJmYWNlIEl0ZXJhYmxlIGltcGxlbWVudGllcmVuLCBpdGVyaWVyZW4uXCIsIG5vZGUuY29sbGVjdGlvbi5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHZhcmlhYmxlVHlwZSA9IG5vZGUudmFyaWFibGVUeXBlLnJlc29sdmVkVHlwZTtcclxuICAgICAgICBpZiAodmFyaWFibGVUeXBlID09IG51bGwpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBsZXQgbm9DYXN0aW5nTmVlZGVkID0gdmFyaWFibGVUeXBlID09IHZhclR5cGU7XHJcbiAgICAgICAgaWYgKG5vQ2FzdGluZ05lZWRlZCkge1xyXG4gICAgICAgICAgICB2YXJpYWJsZVR5cGUgPSBjb2xsZWN0aW9uRWxlbWVudFR5cGU7XHJcbiAgICAgICAgICAgIG5vZGUudmFyaWFibGVUeXBlLnJlc29sdmVkVHlwZSA9IGNvbGxlY3Rpb25FbGVtZW50VHlwZVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICghY29sbGVjdGlvbkVsZW1lbnRUeXBlLmNhbkNhc3RUbyh2YXJpYWJsZVR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBFbGVtZW50VHlwIFwiICsgY29sbGVjdGlvbkVsZW1lbnRUeXBlLmlkZW50aWZpZXIgKyBcIiBkZXIgQ29sbGVjdGlvbiBrYW5uIG5pY2h0IGluIGRlbiBUeXAgXCIgKyB2YXJpYWJsZVR5cGUuaWRlbnRpZmllciArIFwiIGRlciBJdGVyYXRpb25zdmFyaWFibGUgXCIgKyBub2RlLnZhcmlhYmxlSWRlbnRpZmllciArIFwiIGtvbnZlcnRpZXJ0IHdlcmRlbi5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5sb2NhbFZhcmlhYmxlRGVjbGFyYXRpb24oe1xyXG4gICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUubG9jYWxWYXJpYWJsZURlY2xhcmF0aW9uLFxyXG4gICAgICAgICAgICBpZGVudGlmaWVyOiBub2RlLnZhcmlhYmxlSWRlbnRpZmllcixcclxuICAgICAgICAgICAgaW5pdGlhbGl6YXRpb246IG51bGwsXHJcbiAgICAgICAgICAgIGlzRmluYWw6IGZhbHNlLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogbm9kZS52YXJpYWJsZVBvc2l0aW9uLFxyXG4gICAgICAgICAgICB2YXJpYWJsZVR5cGU6IG5vZGUudmFyaWFibGVUeXBlXHJcbiAgICAgICAgfSwgdHJ1ZSlcclxuXHJcbiAgICAgICAgbGV0IHZhcmlhYmxlU3RhY2tQb3MgPSB0aGlzLm5leHRGcmVlUmVsYXRpdmVTdGFja1BvcyAtIDE7XHJcbiAgICAgICAgbGV0IHN0YWNrUG9zT2ZDb3VudGVyVmFyaWFibGVPckl0ZXJhdG9yID0gdGhpcy5uZXh0RnJlZVJlbGF0aXZlU3RhY2tQb3MrKztcclxuXHJcbiAgICAgICAgaWYgKGtpbmQgPT0gXCJhcnJheVwiIHx8IGtpbmQgPT0gXCJpbnRlcm5hbExpc3RcIiB8fCBraW5kID09IFwiZ3JvdXBcIikge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKFt7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuZXh0ZW5kZWRGb3JMb29wSW5pdCxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHN0YWNrUG9zT2ZDb2xsZWN0aW9uOiBzdGFja1Bvc0ZvckNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICBzdGFja1Bvc09mRWxlbWVudDogdmFyaWFibGVTdGFja1BvcyxcclxuICAgICAgICAgICAgICAgIHR5cGVPZkVsZW1lbnQ6IHZhcmlhYmxlVHlwZSxcclxuICAgICAgICAgICAgICAgIHN0YWNrUG9zT2ZDb3VudGVyOiBzdGFja1Bvc09mQ291bnRlclZhcmlhYmxlT3JJdGVyYXRvclxyXG4gICAgICAgICAgICB9XSwgdHJ1ZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gZ2V0IEl0ZXJhdG9yIGZyb20gY29sbGVjdGlvblxyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaExvY2FsVmFyaWFibGVUb1N0YWNrLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrcG9zT2ZWYXJpYWJsZTogc3RhY2tQb3NPZkNvdW50ZXJWYXJpYWJsZU9ySXRlcmF0b3IsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaExvY2FsVmFyaWFibGVUb1N0YWNrLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrcG9zT2ZWYXJpYWJsZTogc3RhY2tQb3NGb3JDb2xsZWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogZmFsc2VcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmNhbGxNZXRob2QsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBpc1N1cGVyQ2FsbDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBjb2xsZWN0aW9uVHlwZS5nZXRNZXRob2QoXCJpdGVyYXRvclwiLCBuZXcgUGFyYW1ldGVybGlzdChbXSkpLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrZnJhbWVCZWdpbjogLTFcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmFzc2lnbm1lbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGxlYXZlVmFsdWVPblN0YWNrOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfV0sIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGxhYmVsQmVmb3JlQ29uZGl0aW9uID0gbG0ubWFya0p1bXBEZXN0aW5hdGlvbigxKTtcclxuICAgICAgICBsZXQgbGFiZWxBZnRlckZvckxvb3A6IG51bWJlcjtcclxuICAgICAgICBsZXQgbGFzdFN0YXRlbWVudEJlZm9yZUNhc3Rpbmc6IFN0YXRlbWVudDtcclxuXHJcbiAgICAgICAgaWYgKGtpbmQgPT0gXCJhcnJheVwiIHx8IGtpbmQgPT0gXCJpbnRlcm5hbExpc3RcIiB8fCBraW5kID09IFwiZ3JvdXBcIikge1xyXG4gICAgICAgICAgICBsZXQganVtcE5vZGU6IEV4dGVuZGVkRm9yTG9vcENoZWNrQ291bnRlckFuZEdldEVsZW1lbnQgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuZXh0ZW5kZWRGb3JMb29wQ2hlY2tDb3VudGVyQW5kR2V0RWxlbWVudCxcclxuICAgICAgICAgICAgICAgIGtpbmQ6IGtpbmQsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS52YXJpYWJsZVBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3RhY2tQb3NPZkNvbGxlY3Rpb246IHN0YWNrUG9zRm9yQ29sbGVjdGlvbixcclxuICAgICAgICAgICAgICAgIHN0YWNrUG9zT2ZFbGVtZW50OiB2YXJpYWJsZVN0YWNrUG9zLFxyXG4gICAgICAgICAgICAgICAgc3RhY2tQb3NPZkNvdW50ZXI6IHN0YWNrUG9zT2ZDb3VudGVyVmFyaWFibGVPckl0ZXJhdG9yLFxyXG4gICAgICAgICAgICAgICAgZGVzdGluYXRpb246IDAgLy8gZ2V0cyBmaWxsZWQgaW4gbGF0ZXIsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGxhc3RTdGF0ZW1lbnRCZWZvcmVDYXN0aW5nID0ganVtcE5vZGU7XHJcbiAgICAgICAgICAgIGxhYmVsQWZ0ZXJGb3JMb29wID0gbG0ucmVnaXN0ZXJKdW1wTm9kZShqdW1wTm9kZSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKFxyXG4gICAgICAgICAgICAgICAganVtcE5vZGVcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gY2FsbCBjb2xsZWN0aW9uLmhhc05leHQoKVxyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaExvY2FsVmFyaWFibGVUb1N0YWNrLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnZhcmlhYmxlUG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhY2twb3NPZlZhcmlhYmxlOiBzdGFja1Bvc0ZvckNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2FsbE1ldGhvZCxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIGlzU3VwZXJDYWxsOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IGNvbGxlY3Rpb25UeXBlLmdldE1ldGhvZChcImhhc05leHRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW10pKSxcclxuICAgICAgICAgICAgICAgICAgICBzdGFja2ZyYW1lQmVnaW46IC0xXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICAgICAgbGFiZWxBZnRlckZvckxvb3AgPSBsbS5pbnNlcnRKdW1wTm9kZShUb2tlblR5cGUuanVtcElmRmFsc2UsIG51bGwsIHRoaXMpO1xyXG4gICAgICAgICAgICAvLyBjYWxsIGNvbGxlY3Rpb24ubmV4dCgpIGFuZCBhc3NpZ24gdG8gbG9vcCB2YXJpYWJsZVxyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaExvY2FsVmFyaWFibGVUb1N0YWNrLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrcG9zT2ZWYXJpYWJsZTogdmFyaWFibGVTdGFja1BvcyxcclxuICAgICAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoTG9jYWxWYXJpYWJsZVRvU3RhY2ssXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhY2twb3NPZlZhcmlhYmxlOiBzdGFja1Bvc0ZvckNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2FsbE1ldGhvZCxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIGlzU3VwZXJDYWxsOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IGNvbGxlY3Rpb25UeXBlLmdldE1ldGhvZChcIm5leHRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW10pKSxcclxuICAgICAgICAgICAgICAgICAgICBzdGFja2ZyYW1lQmVnaW46IC0xXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5hc3NpZ25tZW50LFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBsZWF2ZVZhbHVlT25TdGFjazogZmFsc2VcclxuICAgICAgICAgICAgICAgIH1dKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghbm9DYXN0aW5nTmVlZGVkKSB7XHJcbiAgICAgICAgICAgIGxldCBvbGRTdGF0ZW1lbnRDb3VudCA9IHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGg7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hMb2NhbFZhcmlhYmxlVG9TdGFjayxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgc3RhY2twb3NPZlZhcmlhYmxlOiB2YXJpYWJsZVN0YWNrUG9zLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5lbnN1cmVBdXRvbWF0aWNDYXN0aW5nKGNvbGxlY3Rpb25FbGVtZW50VHlwZSwgdmFyaWFibGVUeXBlKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGggPCBvbGRTdGF0ZW1lbnRDb3VudCArIDIpIHtcclxuICAgICAgICAgICAgICAgIC8vIGNhc3RpbmcgbmVlZGVkIG5vIHN0YXRlbWVudCwgc28gZGVsZXRlIHB1c2hMb2NhbFZhcmlhYmxldG9TdGFjay1TdGF0ZW1lbnRcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5wb3AoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wb3BBbmRTdG9yZUludG9WYXJpYWJsZSxcclxuICAgICAgICAgICAgICAgICAgICBzdGFja3Bvc09mVmFyaWFibGU6IHZhcmlhYmxlU3RhY2tQb3MsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiB0cnVlXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGxhc3RTdGF0ZW1lbnRCZWZvcmVDYXN0aW5nLnN0ZXBGaW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm9wZW5CcmVha1Njb3BlKCk7XHJcbiAgICAgICAgdGhpcy5vcGVuQ29udGludWVTY29wZSgpO1xyXG5cclxuICAgICAgICBsZXQgc3RhdGVtZW50cyA9IHRoaXMuZ2VuZXJhdGVTdGF0ZW1lbnRzKG5vZGUuc3RhdGVtZW50cyk7XHJcbiAgICAgICAgbGV0IHdpdGhSZXR1cm5TdGF0ZW1lbnQgPSBzdGF0ZW1lbnRzLndpdGhSZXR1cm5TdGF0ZW1lbnQ7XHJcblxyXG4gICAgICAgIGxldCBjb250aW51ZUxhYmVsSW5kZXggPSBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEpO1xyXG4gICAgICAgIHRoaXMuY2xvc2VDb250aW51ZVNjb3BlKGNvbnRpbnVlTGFiZWxJbmRleCwgbG0pO1xyXG5cclxuICAgICAgICBsbS5pbnNlcnRKdW1wTm9kZShUb2tlblR5cGUuanVtcEFsd2F5cywgc3RhdGVtZW50cy5lbmRQb3NpdGlvbiwgdGhpcywgbGFiZWxCZWZvcmVDb25kaXRpb24pO1xyXG5cclxuICAgICAgICBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEsIGxhYmVsQWZ0ZXJGb3JMb29wKTtcclxuXHJcbiAgICAgICAgdGhpcy5jbG9zZUJyZWFrU2NvcGUobGFiZWxBZnRlckZvckxvb3AsIGxtKTtcclxuXHJcbiAgICAgICAgdGhpcy5wb3BTeW1ib2xUYWJsZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4geyB0eXBlOiBudWxsLCBpc0Fzc2lnbmFibGU6IGZhbHNlLCB3aXRoUmV0dXJuU3RhdGVtZW50OiB3aXRoUmV0dXJuU3RhdGVtZW50IH07XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NXaGlsZShub2RlOiBXaGlsZU5vZGUpOiBTdGFja1R5cGUge1xyXG5cclxuICAgICAgICBsZXQgbG0gPSB0aGlzLmN1cnJlbnRQcm9ncmFtLmxhYmVsTWFuYWdlcjtcclxuXHJcbiAgICAgICAgdGhpcy5wdXNoTmV3U3ltYm9sVGFibGUoZmFsc2UsIG5vZGUuc2NvcGVGcm9tLCBub2RlLnNjb3BlVG8pO1xyXG5cclxuICAgICAgICBsZXQgY29uZGl0aW9uQmVnaW5MYWJlbCA9IGxtLm1hcmtKdW1wRGVzdGluYXRpb24oMSk7XHJcblxyXG4gICAgICAgIGxldCBjb25kaXRpb25UeXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLmNvbmRpdGlvbik7XHJcblxyXG4gICAgICAgIGlmIChjb25kaXRpb25UeXBlICE9IG51bGwgJiYgY29uZGl0aW9uVHlwZS50eXBlICE9IGJvb2xlYW5QcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hlY2tJZkFzc2lnbm1lbnRJbnN0ZWRPZkVxdWFsKG5vZGUuY29uZGl0aW9uKTtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgV2VydCBkZXMgVGVybXMgaW4gS2xhbW1lcm4gaGludGVyICd3aGlsZScgbXVzcyBkZW4gRGF0ZW50eXAgYm9vbGVhbiBiZXNpdHplbi5cIiwgbm9kZS5jb25kaXRpb24ucG9zaXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gbm9kZS5wb3NpdGlvbjtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUuY29uZGl0aW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgcG9zaXRpb24gPSBub2RlLmNvbmRpdGlvbi5wb3NpdGlvbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBhZnRlcldoaWxlU3RhdGVtZW50TGFiZWwgPSBsbS5pbnNlcnRKdW1wTm9kZShUb2tlblR5cGUuanVtcElmRmFsc2UsIHBvc2l0aW9uLCB0aGlzKTtcclxuXHJcbiAgICAgICAgdGhpcy5vcGVuQnJlYWtTY29wZSgpO1xyXG4gICAgICAgIHRoaXMub3BlbkNvbnRpbnVlU2NvcGUoKTtcclxuXHJcbiAgICAgICAgbGV0IHN0YXRlbWVudHMgPSB0aGlzLmdlbmVyYXRlU3RhdGVtZW50cyhub2RlLnN0YXRlbWVudHMpO1xyXG4gICAgICAgIGxldCB3aXRoUmV0dXJuU3RhdGVtZW50ID0gc3RhdGVtZW50cy53aXRoUmV0dXJuU3RhdGVtZW50O1xyXG5cclxuICAgICAgICB0aGlzLmNsb3NlQ29udGludWVTY29wZShjb25kaXRpb25CZWdpbkxhYmVsLCBsbSk7XHJcbiAgICAgICAgbG0uaW5zZXJ0SnVtcE5vZGUoVG9rZW5UeXBlLmp1bXBBbHdheXMsIHN0YXRlbWVudHMuZW5kUG9zaXRpb24sIHRoaXMsIGNvbmRpdGlvbkJlZ2luTGFiZWwpO1xyXG5cclxuICAgICAgICBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEsIGFmdGVyV2hpbGVTdGF0ZW1lbnRMYWJlbCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2xvc2VCcmVha1Njb3BlKGFmdGVyV2hpbGVTdGF0ZW1lbnRMYWJlbCwgbG0pO1xyXG5cclxuICAgICAgICB0aGlzLnBvcFN5bWJvbFRhYmxlKCk7XHJcblxyXG4gICAgICAgIHJldHVybiB7IHR5cGU6IG51bGwsIGlzQXNzaWduYWJsZTogZmFsc2UsIHdpdGhSZXR1cm5TdGF0ZW1lbnQ6IHdpdGhSZXR1cm5TdGF0ZW1lbnQgfTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc0RvKG5vZGU6IERvV2hpbGVOb2RlKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgbGV0IGxtID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXI7XHJcblxyXG4gICAgICAgIHRoaXMucHVzaE5ld1N5bWJvbFRhYmxlKGZhbHNlLCBub2RlLnNjb3BlRnJvbSwgbm9kZS5zY29wZVRvKTtcclxuXHJcbiAgICAgICAgbGV0IHN0YXRlbWVudHNCZWdpbkxhYmVsID0gbG0ubWFya0p1bXBEZXN0aW5hdGlvbigxKTtcclxuXHJcbiAgICAgICAgdGhpcy5vcGVuQnJlYWtTY29wZSgpO1xyXG4gICAgICAgIHRoaXMub3BlbkNvbnRpbnVlU2NvcGUoKTtcclxuXHJcbiAgICAgICAgbGV0IHN0YXRlbWVudHMgPSB0aGlzLmdlbmVyYXRlU3RhdGVtZW50cyhub2RlLnN0YXRlbWVudHMpO1xyXG4gICAgICAgIGxldCB3aXRoUmV0dXJuU3RhdGVtZW50ID0gc3RhdGVtZW50cy53aXRoUmV0dXJuU3RhdGVtZW50O1xyXG5cclxuICAgICAgICBsZXQgY29udGludWVMYWJlbEluZGV4ID0gbG0ubWFya0p1bXBEZXN0aW5hdGlvbigxKTtcclxuICAgICAgICB0aGlzLmNsb3NlQ29udGludWVTY29wZShjb250aW51ZUxhYmVsSW5kZXgsIGxtKTtcclxuXHJcbiAgICAgICAgbGV0IGNvbmRpdGlvblR5cGUgPSB0aGlzLnByb2Nlc3NOb2RlKG5vZGUuY29uZGl0aW9uKTtcclxuXHJcbiAgICAgICAgaWYgKGNvbmRpdGlvblR5cGUgIT0gbnVsbCAmJiBjb25kaXRpb25UeXBlLnR5cGUgIT0gYm9vbGVhblByaW1pdGl2ZVR5cGUpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGVja0lmQXNzaWdubWVudEluc3RlZE9mRXF1YWwobm9kZS5jb25kaXRpb24pO1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBXZXJ0IGRlcyBUZXJtcyBpbiBLbGFtbWVybiBoaW50ZXIgJ3doaWxlJyBtdXNzIGRlbiBEYXRlbnR5cCBib29sZWFuIGJlc2l0emVuLlwiLCBub2RlLmNvbmRpdGlvbi5wb3NpdGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsbS5pbnNlcnRKdW1wTm9kZShUb2tlblR5cGUuanVtcElmVHJ1ZSwgc3RhdGVtZW50cy5lbmRQb3NpdGlvbiwgdGhpcywgc3RhdGVtZW50c0JlZ2luTGFiZWwpO1xyXG5cclxuICAgICAgICBsZXQgZW5kTGFiZWwgPSBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEpO1xyXG5cclxuICAgICAgICB0aGlzLmNsb3NlQnJlYWtTY29wZShlbmRMYWJlbCwgbG0pO1xyXG5cclxuICAgICAgICB0aGlzLnBvcFN5bWJvbFRhYmxlKCk7XHJcblxyXG4gICAgICAgIHJldHVybiB7IHR5cGU6IG51bGwsIGlzQXNzaWduYWJsZTogZmFsc2UsIHdpdGhSZXR1cm5TdGF0ZW1lbnQ6IHdpdGhSZXR1cm5TdGF0ZW1lbnQgfTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgbmV3T2JqZWN0KG5vZGU6IE5ld09iamVjdE5vZGUpOiBTdGFja1R5cGUge1xyXG5cclxuICAgICAgICBpZiAobm9kZS5jbGFzc1R5cGUgPT0gbnVsbCB8fCBub2RlLmNsYXNzVHlwZS5yZXNvbHZlZFR5cGUgPT0gbnVsbCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIGxldCByZXNvbHZlZFR5cGU6IEtsYXNzID0gPEtsYXNzPm5vZGUuY2xhc3NUeXBlLnJlc29sdmVkVHlwZTtcclxuICAgICAgICBpZiAoIShyZXNvbHZlZFR5cGUgaW5zdGFuY2VvZiBLbGFzcykpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3Iobm9kZS5jbGFzc1R5cGUuaWRlbnRpZmllciArIFwiIGlzdCBrZWluZSBLbGFzc2UsIGRhaGVyIGthbm4gZGF2b24gbWl0ICduZXcnIGtlaW4gT2JqZWt0IGVyemV1Z3Qgd2VyZGVuLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVzb2x2ZWRUeXBlLmlzQWJzdHJhY3QpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoYCR7bm9kZS5jbGFzc1R5cGUuaWRlbnRpZmllcn0gaXN0IGVpbmUgYWJzdHJha3RlIEtsYXNzZSwgZGFoZXIga2FubiB2b24gaWhyIG1pdCAnbmV3JyBrZWluIE9iamVrdCBpbnN0YW56aWVydCB3ZXJkZW4uIEZhbGxzICR7bm9kZS5jbGFzc1R5cGUuaWRlbnRpZmllcn0gbmljaHQtYWJzdHJha3RlIEtpbmRrbGFzc2VuIGJlc2l0enQsIGvDtm5udGVzdCBEdSB2b24gREVORU4gbWl0IG5ldyBPYmpla3RlIGluc3RhbnppZXJlbi4uLmAsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vdGhpcy5wdXNoVHlwZVBvc2l0aW9uKG5vZGUucmlnaHRCcmFja2V0UG9zaXRpb24sIGNsYXNzVHlwZSk7XHJcblxyXG4gICAgICAgIGlmIChyZXNvbHZlZFR5cGUubW9kdWxlICE9IHRoaXMubW9kdWxlICYmIHJlc29sdmVkVHlwZS52aXNpYmlsaXR5ICE9IFZpc2liaWxpdHkucHVibGljKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIEtsYXNzZSBcIiArIHJlc29sdmVkVHlwZS5pZGVudGlmaWVyICsgXCIgaXN0IGhpZXIgbmljaHQgc2ljaHRiYXIuXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IG5ld1N0YXRlbWVudDogTmV3T2JqZWN0U3RhdGVtZW50ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUubmV3T2JqZWN0LFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgY2xhc3M6IHJlc29sdmVkVHlwZSxcclxuICAgICAgICAgICAgc3Vic2VxdWVudENvbnN0cnVjdG9yQ2FsbDogZmFsc2UsXHJcbiAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogdHJ1ZVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMobmV3U3RhdGVtZW50KTtcclxuICAgICAgICB0aGlzLnB1c2hUeXBlUG9zaXRpb24obm9kZS5yaWdodEJyYWNrZXRQb3NpdGlvbiwgcmVzb2x2ZWRUeXBlKTsgLy8gdG8gZW5hYmxlIGNvZGUgY29tcGxldGlvbiB3aGVuIHR5cGluZyBhIHBvaW50IGFmdGVyIHRoZSBjbG9zaW5nIGJyYWNrZXRcclxuXHJcbiAgICAgICAgbGV0IHBhcmFtZXRlclR5cGVzOiBUeXBlW10gPSBbXTtcclxuICAgICAgICBsZXQgcGFyYW1ldGVyU3RhdGVtZW50czogU3RhdGVtZW50W11bXSA9IFtdO1xyXG4gICAgICAgIGxldCBhbGxTdGF0ZW1lbnRzID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzO1xyXG5cclxuICAgICAgICBpZiAobm9kZS5jb25zdHJ1Y3Rvck9wZXJhbmRzPy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHAgb2Ygbm9kZS5jb25zdHJ1Y3Rvck9wZXJhbmRzKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcHJvZ3JhbVBvaW50ZXIgPSBhbGxTdGF0ZW1lbnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIGxldCB0eXBlTm9kZSA9IHRoaXMucHJvY2Vzc05vZGUocCk7XHJcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJTdGF0ZW1lbnRzLnB1c2goYWxsU3RhdGVtZW50cy5zcGxpY2UocHJvZ3JhbVBvaW50ZXIsIGFsbFN0YXRlbWVudHMubGVuZ3RoIC0gcHJvZ3JhbVBvaW50ZXIpKTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlTm9kZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyVHlwZXMucHVzaCh2b2lkUHJpbWl0aXZlVHlwZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtZXRlclR5cGVzLnB1c2godHlwZU5vZGUudHlwZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB1cFRvVmlzaWJpbGl0eSA9IGdldFZpc2liaWxpdHlVcFRvKHJlc29sdmVkVHlwZSwgdGhpcy5jdXJyZW50U3ltYm9sVGFibGUuY2xhc3NDb250ZXh0KTtcclxuXHJcbiAgICAgICAgLy8gbGV0IG1ldGhvZHMgPSByZXNvbHZlZFR5cGUuZ2V0TWV0aG9kc1RoYXRGaXRXaXRoQ2FzdGluZyhyZXNvbHZlZFR5cGUuaWRlbnRpZmllcixcclxuICAgICAgICAvLyAgICAgcGFyYW1ldGVyVHlwZXMsIHRydWUsIHVwVG9WaXNpYmlsaXR5KTtcclxuXHJcbiAgICAgICAgbGV0IG1ldGhvZHMgPSByZXNvbHZlZFR5cGUuZ2V0Q29uc3RydWN0b3IocGFyYW1ldGVyVHlwZXMsIHVwVG9WaXNpYmlsaXR5KTtcclxuXHJcbiAgICAgICAgdGhpcy5tb2R1bGUucHVzaE1ldGhvZENhbGxQb3NpdGlvbihub2RlLnBvc2l0aW9uLCBub2RlLmNvbW1hUG9zaXRpb25zLCByZXNvbHZlZFR5cGUuZ2V0TWV0aG9kcyhWaXNpYmlsaXR5LnB1YmxpYywgcmVzb2x2ZWRUeXBlLmlkZW50aWZpZXIpLCBub2RlLnJpZ2h0QnJhY2tldFBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgLy8gaWYgdGhlcmUncyBubyBwYXJhbWV0ZXJsZXNzIGNvbnN0cnVjdG9yIHRoZW4gcmV0dXJuIHdpdGhvdXQgZXJyb3I6XHJcbiAgICAgICAgaWYgKHBhcmFtZXRlclR5cGVzLmxlbmd0aCA+IDAgfHwgcmVzb2x2ZWRUeXBlLmhhc0NvbnN0cnVjdG9yKCkpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChtZXRob2RzLmVycm9yICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKG1ldGhvZHMuZXJyb3IsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogcmVzb2x2ZWRUeXBlLCBpc0Fzc2lnbmFibGU6IGZhbHNlIH07IC8vIHRyeSB0byBjb250aW51ZS4uLlxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgbWV0aG9kID0gbWV0aG9kcy5tZXRob2RMaXN0WzBdO1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hVc2FnZVBvc2l0aW9uKG5vZGUucG9zaXRpb24sIG1ldGhvZCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgc3RhdGljQ2xhc3NDb250ZXh0ID0gbnVsbDtcclxuICAgICAgICAgICAgbGV0IGNsYXNzQ29udGV4dCA9IHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dDtcclxuICAgICAgICAgICAgaWYgKGNsYXNzQ29udGV4dCAhPSBudWxsICYmIGNsYXNzQ29udGV4dCBpbnN0YW5jZW9mIEtsYXNzKSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0aWNDbGFzc0NvbnRleHQgPSBjbGFzc0NvbnRleHQuc3RhdGljQ2xhc3M7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChtZXRob2QudmlzaWJpbGl0eSA9PSBWaXNpYmlsaXR5LnByaXZhdGUgJiYgcmVzb2x2ZWRUeXBlICE9IGNsYXNzQ29udGV4dCAmJiByZXNvbHZlZFR5cGUgIT0gc3RhdGljQ2xhc3NDb250ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRpZSBLb25zdHJ1a3Rvcm1ldGhvZGUgaXN0IHByaXZhdGUgdW5kIGRhaGVyIGhpZXIgbmljaHQgc2ljaHRiYXIuXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgbGV0IGRlc3RUeXBlOiBUeXBlID0gbnVsbDtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJhbWV0ZXJUeXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPCBtZXRob2QuZ2V0UGFyYW1ldGVyQ291bnQoKSkgeyAgLy8gcG9zc2libGUgZWxsaXBzaXMhXHJcbiAgICAgICAgICAgICAgICAgICAgZGVzdFR5cGUgPSBtZXRob2QuZ2V0UGFyYW1ldGVyVHlwZShpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PSBtZXRob2QuZ2V0UGFyYW1ldGVyQ291bnQoKSAtIDEgJiYgbWV0aG9kLmhhc0VsbGlwc2lzKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdFR5cGUgPSAoPEFycmF5VHlwZT5kZXN0VHlwZSkuYXJyYXlPZlR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGV0IHNyY1R5cGUgPSBwYXJhbWV0ZXJUeXBlc1tpXTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IHN0IG9mIHBhcmFtZXRlclN0YXRlbWVudHNbaV0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHMucHVzaChzdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZW5zdXJlQXV0b21hdGljQ2FzdGluZyhzcmNUeXBlLCBkZXN0VHlwZSwgbm9kZS5jb25zdHJ1Y3Rvck9wZXJhbmRzW2ldLnBvc2l0aW9uLCBub2RlLmNvbnN0cnVjdG9yT3BlcmFuZHNbaV0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgV2VydCB2b20gRGF0ZW50eXAgXCIgKyBzcmNUeXBlLmlkZW50aWZpZXIgKyBcIiBrYW5uIG5pY2h0IGFscyBQYXJhbWV0ZXIgKERhdGVudHlwIFwiICsgZGVzdFR5cGUuaWRlbnRpZmllciArIFwiKSB2ZXJ3ZW5kZXQgd2VyZGVuLlwiLCBub2RlLmNvbnN0cnVjdG9yT3BlcmFuZHNbaV0ucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHN0YWNrZnJhbWVEZWx0YSA9IDA7XHJcbiAgICAgICAgICAgIGlmIChtZXRob2QuaGFzRWxsaXBzaXMoKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGVsbGlwc2lzUGFyYW1ldGVyQ291bnQgPSBwYXJhbWV0ZXJUeXBlcy5sZW5ndGggLSBtZXRob2QuZ2V0UGFyYW1ldGVyQ291bnQoKSArIDE7IC8vIGxhc3QgcGFyYW1ldGVyIGFuZCBzdWJzZXF1ZW50IG9uZXNcclxuICAgICAgICAgICAgICAgIHN0YWNrZnJhbWVEZWx0YSA9IC0gKGVsbGlwc2lzUGFyYW1ldGVyQ291bnQgLSAxKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5tYWtlRWxsaXBzaXNBcnJheSxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5jb25zdHJ1Y3Rvck9wZXJhbmRzW21ldGhvZC5nZXRQYXJhbWV0ZXJDb3VudCgpIC0gMV0ucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyQ291bnQ6IGVsbGlwc2lzUGFyYW1ldGVyQ291bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBhcnJheVR5cGU6IG1ldGhvZC5nZXRQYXJhbWV0ZXIobWV0aG9kLmdldFBhcmFtZXRlckNvdW50KCkgLSAxKS50eXBlXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2FsbE1ldGhvZCxcclxuICAgICAgICAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICBpc1N1cGVyQ2FsbDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IHJlc29sdmVkVHlwZS5nZXRQb3N0Q29uc3RydWN0b3JDYWxsYmFja3MoKSA9PSBudWxsLFxyXG4gICAgICAgICAgICAgICAgc3RhY2tmcmFtZUJlZ2luOiAtKHBhcmFtZXRlclR5cGVzLmxlbmd0aCArIDEgKyBzdGFja2ZyYW1lRGVsdGEpIC8vIHRoaXMtb2JqZWN0IGZvbGxvd2VkIGJ5IHBhcmFtZXRlcnNcclxuICAgICAgICAgICAgfSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICBuZXdTdGF0ZW1lbnQuc3Vic2VxdWVudENvbnN0cnVjdG9yQ2FsbCA9IHRydWU7XHJcbiAgICAgICAgICAgIG5ld1N0YXRlbWVudC5zdGVwRmluaXNoZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVzb2x2ZWRUeXBlLmdldFBvc3RDb25zdHJ1Y3RvckNhbGxiYWNrcygpICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHJvY2Vzc1Bvc3RDb25zdHJ1Y3RvckNhbGxiYWNrcyxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiB0cnVlXHJcbiAgICAgICAgICAgIH0sIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogcmVzb2x2ZWRUeXBlLCBpc0Fzc2lnbmFibGU6IGZhbHNlIH07XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1c2hBdHRyaWJ1dGUobm9kZTogU2VsZWN0QXJyaWJ1dGVOb2RlKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUub2JqZWN0ID09IG51bGwgfHwgbm9kZS5pZGVudGlmaWVyID09IG51bGwpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBsZXQgb3QgPSB0aGlzLnByb2Nlc3NOb2RlKG5vZGUub2JqZWN0KTtcclxuICAgICAgICBpZiAob3QgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcignTGlua3Mgdm9tIFB1bmt0IHN0ZWh0IGtlaW4gT2JqZWt0LicsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghKG90LnR5cGUgaW5zdGFuY2VvZiBLbGFzcyB8fCBvdC50eXBlIGluc3RhbmNlb2YgU3RhdGljQ2xhc3MgfHwgb3QudHlwZSBpbnN0YW5jZW9mIEFycmF5VHlwZSkpIHtcclxuICAgICAgICAgICAgaWYgKG90LnR5cGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoJ0RlciBBdXNkcnVjayBsaW5rcyB2b20gUHVua3QgaGF0IGtlaW4gQXR0cmlidXQgJyArIG5vZGUuaWRlbnRpZmllciArIFwiLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKCdMaW5rcyB2b20gUHVua3Qgc3RlaHQgZWluIEF1c2RydWNrIHZvbSBEYXRlbnR5cCAnICsgb3QudHlwZS5pZGVudGlmaWVyICsgXCIuIERpZXNlciBoYXQga2VpbiBBdHRyaWJ1dCBcIiArIG5vZGUuaWRlbnRpZmllciArIFwiLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBvYmplY3RUeXBlOiBLbGFzcyB8IFN0YXRpY0NsYXNzIHwgQXJyYXlUeXBlID0gb3QudHlwZTtcclxuXHJcbiAgICAgICAgaWYgKG9iamVjdFR5cGUgaW5zdGFuY2VvZiBLbGFzcykge1xyXG5cclxuICAgICAgICAgICAgbGV0IHZpc2liaWxpdHlVcFRvID0gZ2V0VmlzaWJpbGl0eVVwVG8ob2JqZWN0VHlwZSwgdGhpcy5jdXJyZW50U3ltYm9sVGFibGUuY2xhc3NDb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgIGxldCBhdHRyaWJ1dGVXaXRoRXJyb3IgPSBvYmplY3RUeXBlLmdldEF0dHJpYnV0ZShub2RlLmlkZW50aWZpZXIsIHZpc2liaWxpdHlVcFRvKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBzdGF0aWNBdHRyaWJ1dGVXaXRoRXJyb3I6IHsgYXR0cmlidXRlOiBBdHRyaWJ1dGUsIGVycm9yOiBzdHJpbmcsIGZvdW5kQnV0SW52aXNpYmxlOiBib29sZWFuLCBzdGF0aWNDbGFzczogU3RhdGljQ2xhc3N9IFxyXG4gICAgICAgICAgICAgICA9IG51bGw7XHJcbiAgICAgICAgICAgIGlmIChhdHRyaWJ1dGVXaXRoRXJyb3IuYXR0cmlidXRlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHN0YXRpY0F0dHJpYnV0ZVdpdGhFcnJvciA9IG9iamVjdFR5cGUuc3RhdGljQ2xhc3MuZ2V0QXR0cmlidXRlKG5vZGUuaWRlbnRpZmllciwgdmlzaWJpbGl0eVVwVG8pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYXR0cmlidXRlV2l0aEVycm9yLmF0dHJpYnV0ZSA9PSBudWxsICYmIHN0YXRpY0F0dHJpYnV0ZVdpdGhFcnJvci5hdHRyaWJ1dGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZVdpdGhFcnJvci5mb3VuZEJ1dEludmlzaWJsZSB8fCAhc3RhdGljQXR0cmlidXRlV2l0aEVycm9yLmZvdW5kQnV0SW52aXNpYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoYXR0cmlidXRlV2l0aEVycm9yLmVycm9yLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3Ioc3RhdGljQXR0cmlidXRlV2l0aEVycm9yLmVycm9yLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogb2JqZWN0VHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBpc0Fzc2lnbmFibGU6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYXR0cmlidXRlOiBBdHRyaWJ1dGU7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXR0cmlidXRlV2l0aEVycm9yLmF0dHJpYnV0ZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoQXR0cmlidXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlSW5kZXg6IGF0dHJpYnV0ZVdpdGhFcnJvci5hdHRyaWJ1dGUuaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUlkZW50aWZpZXI6IGF0dHJpYnV0ZVdpdGhFcnJvci5hdHRyaWJ1dGUuaWRlbnRpZmllcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlVGhpc09iamVjdDogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVXaXRoRXJyb3IuYXR0cmlidXRlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5kZWNyZWFzZVN0YWNrcG9pbnRlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcENvdW50OiAxXHJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaFN0YXRpY0F0dHJpYnV0ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGtsYXNzOiAoPEtsYXNzPm9iamVjdFR5cGUpLnN0YXRpY0NsYXNzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBrbGFzczogc3RhdGljQXR0cmlidXRlV2l0aEVycm9yLnN0YXRpY0NsYXNzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVJbmRleDogc3RhdGljQXR0cmlidXRlV2l0aEVycm9yLmF0dHJpYnV0ZS5pbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlSWRlbnRpZmllcjogc3RhdGljQXR0cmlidXRlV2l0aEVycm9yLmF0dHJpYnV0ZS5pZGVudGlmaWVyXHJcbiAgICAgICAgICAgICAgICAgICAgfV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZSA9IHN0YXRpY0F0dHJpYnV0ZVdpdGhFcnJvci5hdHRyaWJ1dGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoVXNhZ2VQb3NpdGlvbihub2RlLnBvc2l0aW9uLCBhdHRyaWJ1dGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogYXR0cmlidXRlLnR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgaXNBc3NpZ25hYmxlOiAhYXR0cmlidXRlLmlzRmluYWxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKG9iamVjdFR5cGUgaW5zdGFuY2VvZiBTdGF0aWNDbGFzcykge1xyXG4gICAgICAgICAgICAvLyBTdGF0aWMgY2xhc3NcclxuICAgICAgICAgICAgaWYgKG9iamVjdFR5cGUuS2xhc3MgaW5zdGFuY2VvZiBFbnVtKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUxhc3RTdGF0ZW1lbnQoKTsgLy8gcmVtb3ZlIHB1c2ggc3RhdGljIGVudW0gY2xhc3MgdG8gc3RhY2tcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgZW51bUluZm8gPSBvYmplY3RUeXBlLktsYXNzLmVudW1JbmZvTGlzdC5maW5kKGVpID0+IGVpLmlkZW50aWZpZXIgPT0gbm9kZS5pZGVudGlmaWVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZW51bUluZm8gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIGVudW0tS2xhc3NlIFwiICsgb2JqZWN0VHlwZS5pZGVudGlmaWVyICsgXCIgaGF0IGtlaW5lbiBlbnVtLVdlcnQgbWl0IGRlbSBCZXplaWNobmVyIFwiICsgbm9kZS5pZGVudGlmaWVyLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaEVudW1WYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBlbnVtQ2xhc3M6IG9iamVjdFR5cGUuS2xhc3MsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVJZGVudGlmaWVyOiBub2RlLmlkZW50aWZpZXJcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogb2JqZWN0VHlwZS5LbGFzcyxcclxuICAgICAgICAgICAgICAgICAgICBpc0Fzc2lnbmFibGU6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGV0IHVwVG9WaXNpYmlsaXR5ID0gZ2V0VmlzaWJpbGl0eVVwVG8ob2JqZWN0VHlwZSwgdGhpcy5jdXJyZW50U3ltYm9sVGFibGUuY2xhc3NDb250ZXh0KTtcclxuICAgICAgICAgICAgICAgIGxldCBzdGF0aWNBdHRyaWJ1dGVXaXRoRXJyb3IgPSBvYmplY3RUeXBlLmdldEF0dHJpYnV0ZShub2RlLmlkZW50aWZpZXIsIHVwVG9WaXNpYmlsaXR5KTtcclxuICAgICAgICAgICAgICAgIGlmIChzdGF0aWNBdHRyaWJ1dGVXaXRoRXJyb3IuYXR0cmlidXRlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RhdGljQXR0cmlidXRlV2l0aEVycm9yLmF0dHJpYnV0ZS51cGRhdGVWYWx1ZSAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgdGhpcy5yZW1vdmVMYXN0U3RhdGVtZW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hTdGF0aWNBdHRyaWJ1dGVJbnRyaW5zaWMsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIGF0dHJpYnV0ZTogc3RhdGljQXR0cmlidXRlV2l0aEVycm9yLmF0dHJpYnV0ZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAvLyB9IGVsc2UgXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUxhc3RTdGF0ZW1lbnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaFN0YXRpY0F0dHJpYnV0ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlSW5kZXg6IHN0YXRpY0F0dHJpYnV0ZVdpdGhFcnJvci5hdHRyaWJ1dGUuaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVJZGVudGlmaWVyOiBzdGF0aWNBdHRyaWJ1dGVXaXRoRXJyb3IuYXR0cmlidXRlLmlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrbGFzczogc3RhdGljQXR0cmlidXRlV2l0aEVycm9yLnN0YXRpY0NsYXNzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hVc2FnZVBvc2l0aW9uKG5vZGUucG9zaXRpb24sIHN0YXRpY0F0dHJpYnV0ZVdpdGhFcnJvci5hdHRyaWJ1dGUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogc3RhdGljQXR0cmlidXRlV2l0aEVycm9yLmF0dHJpYnV0ZS50eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0Fzc2lnbmFibGU6ICFzdGF0aWNBdHRyaWJ1dGVXaXRoRXJyb3IuYXR0cmlidXRlLmlzRmluYWxcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKHN0YXRpY0F0dHJpYnV0ZVdpdGhFcnJvci5lcnJvciwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogb2JqZWN0VHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNBc3NpZ25hYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgaWYgKG5vZGUuaWRlbnRpZmllciAhPSBcImxlbmd0aFwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcignRGVyIFdlcnQgdm9tIERhdGVudHlwICcgKyBvdC50eXBlLmlkZW50aWZpZXIgKyBcIiBoYXQga2VpbiBBdHRyaWJ1dCBcIiArIG5vZGUuaWRlbnRpZmllciwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaEFycmF5TGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb25cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZWxlbWVudDogQXR0cmlidXRlID0gbmV3IEF0dHJpYnV0ZShcImxlbmd0aFwiLCBpbnRQcmltaXRpdmVUeXBlLCBudWxsLCB0cnVlLCBWaXNpYmlsaXR5LnB1YmxpYywgdHJ1ZSwgXCJMw6RuZ2UgZGVzIEFycmF5c1wiKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubW9kdWxlLmFkZElkZW50aWZpZXJQb3NpdGlvbihub2RlLnBvc2l0aW9uLCBlbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAgICAgaXNBc3NpZ25hYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1c2hUaGlzT3JTdXBlcihub2RlOiBUaGlzTm9kZSB8IFN1cGVyTm9kZSwgaXNTdXBlcjogYm9vbGVhbik6IFN0YWNrVHlwZSB7XHJcblxyXG4gICAgICAgIGxldCBjbGFzc0NvbnRleHQgPSB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZS5jbGFzc0NvbnRleHQ7XHJcblxyXG4gICAgICAgIGlmIChpc1N1cGVyICYmIGNsYXNzQ29udGV4dCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGNsYXNzQ29udGV4dCA9IGNsYXNzQ29udGV4dC5iYXNlQ2xhc3M7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbWV0aG9kQ29udGV4dCA9IHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLm1ldGhvZDtcclxuXHJcbiAgICAgICAgaWYgKGNsYXNzQ29udGV4dCA9PSBudWxsIHx8IG1ldGhvZENvbnRleHQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRhcyBPYmpla3QgXCIgKyAoaXNTdXBlciA/IFwic3VwZXJcIiA6IFwidGhpc1wiKSArIFwiIGV4aXN0aWVydCBudXIgaW5uZXJoYWxiIGVpbmVyIE1ldGhvZGVuZGVrbGFyYXRpb24uXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoTG9jYWxWYXJpYWJsZVRvU3RhY2ssXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIHN0YWNrcG9zT2ZWYXJpYWJsZTogMFxyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgdGhpcy5wdXNoVHlwZVBvc2l0aW9uKG5vZGUucG9zaXRpb24sIGNsYXNzQ29udGV4dCk7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IGNsYXNzQ29udGV4dCwgaXNBc3NpZ25hYmxlOiBmYWxzZSwgaXNTdXBlcjogaXNTdXBlciB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgc3VwZXJjb25zdHJ1Y3RvckNhbGwobm9kZTogU3VwZXJjb25zdHJ1Y3RvckNhbGxOb2RlKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgbGV0IGNsYXNzQ29udGV4dCA9IHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dDtcclxuXHJcbiAgICAgICAgaWYgKGNsYXNzQ29udGV4dD8uYmFzZUNsYXNzID09IG51bGwgfHwgY2xhc3NDb250ZXh0LmJhc2VDbGFzcy5pZGVudGlmaWVyID09IFwiT2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgS2xhc3NlIGlzdCBudXIgS2luZGtsYXNzZSBkZXIgS2xhc3NlIE9iamVjdCwgZGFoZXIgaXN0IGRlciBBdWZydWYgZGVzIFN1cGVya29uc3RydWt0b3JzIG5pY2h0IG3DtmdsaWNoLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBtZXRob2RDb250ZXh0ID0gdGhpcy5jdXJyZW50U3ltYm9sVGFibGUubWV0aG9kO1xyXG5cclxuICAgICAgICBpZiAoY2xhc3NDb250ZXh0ID09IG51bGwgfHwgbWV0aG9kQ29udGV4dCA9PSBudWxsIHx8ICFtZXRob2RDb250ZXh0LmlzQ29uc3RydWN0b3IpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJFaW4gQXVmcnVmIGRlcyBTdXBlcmtvbnN0cnVjdG9ycyBpc3QgbnVyIGlubmVyaGFsYiBkZXMgS29uc3RydWt0b3JzIGVpbmVyIEtsYXNzZSBtw7ZnbGljaC5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHN1cGVyY2xhc3NUeXBlOiBLbGFzcyA9IDxLbGFzcz5jbGFzc0NvbnRleHQuYmFzZUNsYXNzO1xyXG4gICAgICAgIGlmIChzdXBlcmNsYXNzVHlwZSBpbnN0YW5jZW9mIFN0YXRpY0NsYXNzKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiU3RhdGlzY2hlIE1ldGhvZGVuIGhhYmVuIGtlaW5lIHN1cGVyLU1ldGhvZGVuLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogbnVsbCwgaXNBc3NpZ25hYmxlOiBmYWxzZSB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3VwZXJjbGFzc1R5cGUgPT0gbnVsbCkgc3VwZXJjbGFzc1R5cGUgPSA8S2xhc3M+dGhpcy5tb2R1bGVTdG9yZS5nZXRUeXBlKFwiT2JqZWN0XCIpLnR5cGU7XHJcblxyXG4gICAgICAgIC8vIFB1c2ggdGhpcy1vYmplY3QgdG8gc3RhY2s6XHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoTG9jYWxWYXJpYWJsZVRvU3RhY2ssXHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICBzdGFja3Bvc09mVmFyaWFibGU6IDBcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IHBhcmFtZXRlclR5cGVzOiBUeXBlW10gPSBbXTtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUub3BlcmFuZHMgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBsZXQgZXJyb3JJbk9wZXJhbmRzOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHAgb2Ygbm9kZS5vcGVyYW5kcykge1xyXG4gICAgICAgICAgICAgICAgbGV0IHB0ID0gdGhpcy5wcm9jZXNzTm9kZShwKTtcclxuICAgICAgICAgICAgICAgIGlmIChwdCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyVHlwZXMucHVzaChwdC50eXBlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JJbk9wZXJhbmRzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZXJyb3JJbk9wZXJhbmRzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyB0eXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlLCBpc0Fzc2lnbmFibGU6IGZhbHNlIH07IC8vIHRyeSB0byBjb250aW51ZS4uLlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbWV0aG9kcyA9IHN1cGVyY2xhc3NUeXBlLmdldENvbnN0cnVjdG9yKHBhcmFtZXRlclR5cGVzLCBWaXNpYmlsaXR5LnByb3RlY3RlZCk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kdWxlLnB1c2hNZXRob2RDYWxsUG9zaXRpb24obm9kZS5wb3NpdGlvbiwgbm9kZS5jb21tYVBvc2l0aW9ucywgc3VwZXJjbGFzc1R5cGUuZ2V0TWV0aG9kcyhWaXNpYmlsaXR5LnByb3RlY3RlZCwgc3VwZXJjbGFzc1R5cGUuaWRlbnRpZmllciksXHJcbiAgICAgICAgICAgIG5vZGUucmlnaHRCcmFja2V0UG9zaXRpb24pO1xyXG5cclxuICAgICAgICBpZiAobWV0aG9kcy5lcnJvciAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKG1ldGhvZHMuZXJyb3IsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlLCBpc0Fzc2lnbmFibGU6IGZhbHNlIH07IC8vIHRyeSB0byBjb250aW51ZS4uLlxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IG1ldGhvZCA9IG1ldGhvZHMubWV0aG9kTGlzdFswXTtcclxuXHJcbiAgICAgICAgdGhpcy5wdXNoVXNhZ2VQb3NpdGlvbihub2RlLnBvc2l0aW9uLCBtZXRob2QpO1xyXG5cclxuICAgICAgICBsZXQgc3RhY2tmcmFtZURlbHRhID0gMDtcclxuICAgICAgICBpZiAobWV0aG9kLmhhc0VsbGlwc2lzKCkpIHtcclxuICAgICAgICAgICAgbGV0IGVsbGlwc2lzUGFyYW1ldGVyQ291bnQgPSBwYXJhbWV0ZXJUeXBlcy5sZW5ndGggLSBtZXRob2QuZ2V0UGFyYW1ldGVyQ291bnQoKSArIDE7IC8vIGxhc3QgcGFyYW1ldGVyIGFuZCBzdWJzZXF1ZW50IG9uZXNcclxuICAgICAgICAgICAgc3RhY2tmcmFtZURlbHRhID0gLSAoZWxsaXBzaXNQYXJhbWV0ZXJDb3VudCAtIDEpO1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5tYWtlRWxsaXBzaXNBcnJheSxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLm9wZXJhbmRzW21ldGhvZC5nZXRQYXJhbWV0ZXJDb3VudCgpIC0gMV0ucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJDb3VudDogZWxsaXBzaXNQYXJhbWV0ZXJDb3VudCxcclxuICAgICAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBhcnJheVR5cGU6IG1ldGhvZC5nZXRQYXJhbWV0ZXIobWV0aG9kLmdldFBhcmFtZXRlckNvdW50KCkgLSAxKS50eXBlXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmNhbGxNZXRob2QsXHJcbiAgICAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxyXG4gICAgICAgICAgICBpc1N1cGVyQ2FsbDogdHJ1ZSxcclxuICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgIHN0YWNrZnJhbWVCZWdpbjogLShwYXJhbWV0ZXJUeXBlcy5sZW5ndGggKyAxICsgc3RhY2tmcmFtZURlbHRhKSAvLyB0aGlzLW9iamVjdCBmb2xsb3dlZCBieSBwYXJhbWV0ZXJzXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gUGFic3QsIDIxLjEwLjIwMjA6XHJcbiAgICAgICAgLy8gc3VwZXIgbWV0aG9kIGlzIGNvbnN0cnVjdG9yID0+IHJldHVybnMgbm90aGluZyBldmVuIGl2IG1ldGhvZC5nZXRSZXR1cm5UeXBlKCkgaXMgY2xhc3Mgb2JqZWN0XHJcbiAgICAgICAgLy8gcmV0dXJuIHsgdHlwZTogbWV0aG9kLmdldFJldHVyblR5cGUoKSwgaXNBc3NpZ25hYmxlOiBmYWxzZSB9O1xyXG4gICAgICAgIHJldHVybiB7IHR5cGU6IG51bGwsIGlzQXNzaWduYWJsZTogZmFsc2UgfTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5jcmVtZW50RGVjcmVtZW50QmVmb3JlT3JBZnRlcihub2RlOiBJbmNyZW1lbnREZWNyZW1lbnROb2RlKTogU3RhY2tUeXBlIHtcclxuICAgICAgICBsZXQgdHlwZSA9IHRoaXMucHJvY2Vzc05vZGUobm9kZS5vcGVyYW5kKTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGUgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiAoIXR5cGUuaXNBc3NpZ25hYmxlKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIE9wZXJhdG9yZW4gKysgdW5kIC0tIGvDtm5uZW4gbnVyIGF1ZiBWYXJpYWJsZW4gYW5nZXdlbmRldCB3ZXJkZW4sIG5pY2h0IGF1ZiBrb25zdGFudGUgV2VydGUgb2RlciBSw7xja2dhYmV3ZXJ0ZSB2b24gTWV0aG9kZW4uXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICByZXR1cm4gdHlwZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdHlwZS50eXBlLmNhbkNhc3RUbyhmbG9hdFByaW1pdGl2ZVR5cGUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIE9wZXJhdG9yZW4gKysgdW5kIC0tIGvDtm5uZW4gbnVyIGF1ZiBaYWhsZW4gYW5nZXdlbmRldCB3ZXJkZW4sIG5pY2h0IGF1ZiBXZXJ0ZSBkZXMgRGF0ZW50eXBzIFwiICsgdHlwZS50eXBlLmlkZW50aWZpZXIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICByZXR1cm4gdHlwZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICB0eXBlOiBub2RlLnR5cGUsXHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICBpbmNyZW1lbnREZWNyZW1lbnRCeTogbm9kZS5vcGVyYXRvciA9PSBUb2tlblR5cGUuZG91YmxlTWludXMgPyAtIDEgOiAxXHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gdHlwZTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2VsZWN0QXJyYXlFbGVtZW50KG5vZGU6IFNlbGVjdEFycmF5RWxlbWVudE5vZGUpOiBTdGFja1R5cGUge1xyXG5cclxuICAgICAgICBsZXQgYXJyYXlUeXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLm9iamVjdCk7IC8vIHB1c2ggYXJyYXktb2JqZWN0IFxyXG4gICAgICAgIGxldCBpbmRleFR5cGUgPSB0aGlzLnByb2Nlc3NOb2RlKG5vZGUuaW5kZXgpOyAvLyBwdXNoIGluZGV4XHJcblxyXG4gICAgICAgIGlmIChhcnJheVR5cGUgPT0gbnVsbCB8fCBpbmRleFR5cGUgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiAoIShhcnJheVR5cGUudHlwZSBpbnN0YW5jZW9mIEFycmF5VHlwZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgVHlwIGRlciBWYXJpYWJsZW4gaXN0IGtlaW4gQXJyYXksIGRhaGVyIGlzdCBbXSBuaWNodCB6dWzDpHNzaWcuIFwiLCBub2RlLm9iamVjdC5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5tb2R1bGUuYWRkSWRlbnRpZmllclBvc2l0aW9uKHtcclxuICAgICAgICAgICAgbGluZTogbm9kZS5wb3NpdGlvbi5saW5lLFxyXG4gICAgICAgICAgICBjb2x1bW46IG5vZGUucG9zaXRpb24uY29sdW1uICsgbm9kZS5wb3NpdGlvbi5sZW5ndGgsXHJcbiAgICAgICAgICAgIGxlbmd0aDogMCAgLy8gTW9kdWxlLmdldFR5cGVBdFBvc2l0aW9uIG5lZWRzIGxlbmd0aCA9PSAwIGhlcmUgdG8ga25vdyB0aGF0IHRoaXMgdHlwZS1wb3NpdGlvbiBpcyBub3QgaW4gc3RhdGljIGNvbnRleHQgZm9yIGNvZGUgY29tcGxldGlvblxyXG4gICAgICAgIH0sIGFycmF5VHlwZS50eXBlLmFycmF5T2ZUeXBlKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmVuc3VyZUF1dG9tYXRpY0Nhc3RpbmcoaW5kZXhUeXBlLnR5cGUsIGludFByaW1pdGl2ZVR5cGUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiQWxzIEluZGV4IGVpbmVzIEFycmF5cyB3aXJkIGVpbiBnYW56emFobGlnZXIgV2VydCBlcndhcnRldC4gR2VmdW5kZW4gd3VyZGUgZWluIFdlcnQgdm9tIFR5cCBcIiArIGluZGV4VHlwZS50eXBlLmlkZW50aWZpZXIgKyBcIi5cIiwgbm9kZS5pbmRleC5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6ICg8QXJyYXlUeXBlPmFycmF5VHlwZS50eXBlKS5hcnJheU9mVHlwZSwgaXNBc3NpZ25hYmxlOiBhcnJheVR5cGUuaXNBc3NpZ25hYmxlIH07XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5zZWxlY3RBcnJheUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogKDxBcnJheVR5cGU+YXJyYXlUeXBlLnR5cGUpLmFycmF5T2ZUeXBlLCBpc0Fzc2lnbmFibGU6IGFycmF5VHlwZS5pc0Fzc2lnbmFibGUgfTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVzaFR5cGVQb3NpdGlvbihwb3NpdGlvbjogVGV4dFBvc2l0aW9uLCB0eXBlOiBUeXBlKSB7XHJcbiAgICAgICAgaWYgKHBvc2l0aW9uID09IG51bGwpIHJldHVybjtcclxuICAgICAgICBpZiAocG9zaXRpb24ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBwb3NpdGlvbiA9IHtcclxuICAgICAgICAgICAgICAgIGxpbmU6IHBvc2l0aW9uLmxpbmUsXHJcbiAgICAgICAgICAgICAgICBjb2x1bW46IHBvc2l0aW9uLmNvbHVtbiArIHBvc2l0aW9uLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGxlbmd0aDogMFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubW9kdWxlLmFkZElkZW50aWZpZXJQb3NpdGlvbihwb3NpdGlvbiwgdHlwZSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdXNoVXNhZ2VQb3NpdGlvbihwb3NpdGlvbjogVGV4dFBvc2l0aW9uLCBlbGVtZW50OiBLbGFzcyB8IEludGVyZmFjZSB8IE1ldGhvZCB8IEF0dHJpYnV0ZSB8IFZhcmlhYmxlKSB7XHJcblxyXG4gICAgICAgIHRoaXMubW9kdWxlLmFkZElkZW50aWZpZXJQb3NpdGlvbihwb3NpdGlvbiwgZWxlbWVudCk7XHJcblxyXG4gICAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgUHJpbWl0aXZlVHlwZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcG9zaXRpb25MaXN0OiBUZXh0UG9zaXRpb25bXSA9IGVsZW1lbnQudXNhZ2VQb3NpdGlvbnMuZ2V0KHRoaXMubW9kdWxlKTtcclxuICAgICAgICBpZiAocG9zaXRpb25MaXN0ID09IG51bGwpIHtcclxuICAgICAgICAgICAgcG9zaXRpb25MaXN0ID0gW107XHJcbiAgICAgICAgICAgIGVsZW1lbnQudXNhZ2VQb3NpdGlvbnMuc2V0KHRoaXMubW9kdWxlLCBwb3NpdGlvbkxpc3QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcG9zaXRpb25MaXN0LnB1c2gocG9zaXRpb24pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICByZXNvbHZlSWRlbnRpZmllcihub2RlOiBJZGVudGlmaWVyTm9kZSk6IFN0YWNrVHlwZSB7XHJcblxyXG4gICAgICAgIGlmIChub2RlLmlkZW50aWZpZXIgPT0gbnVsbCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIGxldCB2YXJpYWJsZSA9IHRoaXMuZmluZExvY2FsVmFyaWFibGUobm9kZS5pZGVudGlmaWVyKTtcclxuICAgICAgICBpZiAodmFyaWFibGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoTG9jYWxWYXJpYWJsZVRvU3RhY2ssXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIHN0YWNrcG9zT2ZWYXJpYWJsZTogdmFyaWFibGUuc3RhY2tQb3NcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIHRoaXMucHVzaFVzYWdlUG9zaXRpb24obm9kZS5wb3NpdGlvbiwgdmFyaWFibGUpO1xyXG4gICAgICAgICAgICBub2RlLnZhcmlhYmxlID0gdmFyaWFibGU7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiB2YXJpYWJsZS50eXBlLCBpc0Fzc2lnbmFibGU6ICF2YXJpYWJsZS5pc0ZpbmFsIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5oZWFwICE9IG51bGwpIHtcclxuICAgICAgICAgICAgbGV0IHZhcmlhYmxlID0gdGhpcy5oZWFwW25vZGUuaWRlbnRpZmllcl07XHJcbiAgICAgICAgICAgIGlmICh2YXJpYWJsZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaEZyb21IZWFwVG9TdGFjayxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBub2RlLmlkZW50aWZpZXJcclxuICAgICAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoVXNhZ2VQb3NpdGlvbihub2RlLnBvc2l0aW9uLCB2YXJpYWJsZSk7XHJcbiAgICAgICAgICAgICAgICBub2RlLnZhcmlhYmxlID0gdmFyaWFibGU7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHZhcmlhYmxlLnR5cGUsIGlzQXNzaWduYWJsZTogIXZhcmlhYmxlLmlzRmluYWwgfTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBhdHRyaWJ1dGUgPSB0aGlzLmZpbmRBdHRyaWJ1dGUobm9kZS5pZGVudGlmaWVyLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICBpZiAoYXR0cmlidXRlICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChhdHRyaWJ1dGUuaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjYyA9IHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dDtcclxuICAgICAgICAgICAgICAgIGxldCBzY2MgPSAoY2MgaW5zdGFuY2VvZiBTdGF0aWNDbGFzcykgPyBjYyA6IGNjLnN0YXRpY0NsYXNzO1xyXG5cclxuICAgICAgICAgICAgICAgIHdoaWxlKHNjYyAhPSBudWxsICYmIHNjYy5hdHRyaWJ1dGVzLmluZGV4T2YoYXR0cmlidXRlKSA9PSAtMSl7XHJcbiAgICAgICAgICAgICAgICAgICAgc2NjID0gc2NjLmJhc2VDbGFzcztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaFN0YXRpY0F0dHJpYnV0ZSxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBrbGFzczogc2NjLFxyXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUluZGV4OiBhdHRyaWJ1dGUuaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlSWRlbnRpZmllcjogYXR0cmlidXRlLmlkZW50aWZpZXJcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hBdHRyaWJ1dGUsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlSW5kZXg6IGF0dHJpYnV0ZS5pbmRleCxcclxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVJZGVudGlmaWVyOiBhdHRyaWJ1dGUuaWRlbnRpZmllcixcclxuICAgICAgICAgICAgICAgICAgICB1c2VUaGlzT2JqZWN0OiB0cnVlXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIHRoaXMucHVzaFVzYWdlUG9zaXRpb24obm9kZS5wb3NpdGlvbiwgYXR0cmlidXRlKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IGF0dHJpYnV0ZS50eXBlLCBpc0Fzc2lnbmFibGU6ICFhdHRyaWJ1dGUuaXNGaW5hbCB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGtsYXNzTW9kdWxlID0gdGhpcy5tb2R1bGVTdG9yZS5nZXRUeXBlKG5vZGUuaWRlbnRpZmllcik7XHJcbiAgICAgICAgaWYgKGtsYXNzTW9kdWxlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgbGV0IGtsYXNzID0ga2xhc3NNb2R1bGUudHlwZTtcclxuICAgICAgICAgICAgaWYgKCEoa2xhc3MgaW5zdGFuY2VvZiBLbGFzcyB8fCBrbGFzcyBpbnN0YW5jZW9mIEludGVyZmFjZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVyIFR5cCBcIiArIGtsYXNzLmlkZW50aWZpZXIgKyBcIiBoYXQga2VpbmUgc3RhdGlzY2hlbiBBdHRyaWJ1dGUvTWV0aG9kZW4uXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hTdGF0aWNDbGFzc09iamVjdCxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBrbGFzczoga2xhc3NcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFVzYWdlUG9zaXRpb24obm9kZS5wb3NpdGlvbiwga2xhc3MpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZToga2xhc3MgaW5zdGFuY2VvZiBLbGFzcyA/IGtsYXNzLnN0YXRpY0NsYXNzIDoga2xhc3MsXHJcbiAgICAgICAgICAgICAgICAgICAgaXNBc3NpZ25hYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgdHlwZToga2xhc3MsXHJcbiAgICAgICAgICAgICAgICBpc0Fzc2lnbmFibGU6IGZhbHNlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVyIEJlemVpY2huZXIgXCIgKyBub2RlLmlkZW50aWZpZXIgKyBcIiBpc3QgaGllciBuaWNodCBiZWthbm50LlwiLCBub2RlLnBvc2l0aW9uKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZmluZExvY2FsVmFyaWFibGUoaWRlbnRpZmllcjogc3RyaW5nKTogVmFyaWFibGUge1xyXG4gICAgICAgIGxldCBzdCA9IHRoaXMuY3VycmVudFN5bWJvbFRhYmxlO1xyXG5cclxuICAgICAgICB3aGlsZSAoc3QgIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgbGV0IHZhcmlhYmxlID0gc3QudmFyaWFibGVNYXAuZ2V0KGlkZW50aWZpZXIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhcmlhYmxlICE9IG51bGwgJiYgdmFyaWFibGUuc3RhY2tQb3MgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhcmlhYmxlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzdCA9IHN0LnBhcmVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBmaW5kQXR0cmlidXRlKGlkZW50aWZpZXI6IHN0cmluZywgcG9zaXRpb246IFRleHRQb3NpdGlvbik6IEF0dHJpYnV0ZSB7XHJcbiAgICAgICAgbGV0IGNsYXNzQ29udGV4dCA9IHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dDtcclxuICAgICAgICBpZiAoY2xhc3NDb250ZXh0ID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYXR0cmlidXRlID0gY2xhc3NDb250ZXh0LmdldEF0dHJpYnV0ZShpZGVudGlmaWVyLCBWaXNpYmlsaXR5LnByaXZhdGUpO1xyXG4gICAgICAgIGlmIChhdHRyaWJ1dGUuYXR0cmlidXRlICE9IG51bGwpIHJldHVybiBhdHRyaWJ1dGUuYXR0cmlidXRlO1xyXG5cclxuICAgICAgICBpZiAoY2xhc3NDb250ZXh0IGluc3RhbmNlb2YgS2xhc3MpIHtcclxuICAgICAgICAgICAgbGV0IHN0YXRpY0F0dHJpYnV0ZSA9IGNsYXNzQ29udGV4dC5zdGF0aWNDbGFzcy5nZXRBdHRyaWJ1dGUoaWRlbnRpZmllciwgVmlzaWJpbGl0eS5wcml2YXRlKTtcclxuICAgICAgICAgICAgaWYgKHN0YXRpY0F0dHJpYnV0ZS5hdHRyaWJ1dGUgIT0gbnVsbCkgcmV0dXJuIHN0YXRpY0F0dHJpYnV0ZS5hdHRyaWJ1dGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB0aGlzLnB1c2hFcnJvcihhdHRyaWJ1dGUuZXJyb3IsIHBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY2FsbE1ldGhvZChub2RlOiBNZXRob2RjYWxsTm9kZSk6IFN0YWNrVHlwZSB7XHJcblxyXG4gICAgICAgIGxldCBvYmplY3ROb2RlOiBTdGFja1R5cGUgPSBudWxsO1xyXG5cclxuICAgICAgICBpZiAobm9kZS5vYmplY3QgPT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgLy8gY2FsbCBtZXRob2Qgb2YgdGhpcy1jbGFzcz9cclxuXHJcbiAgICAgICAgICAgIGxldCB0aGlzQ2xhc3MgPSB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZS5jbGFzc0NvbnRleHQ7XHJcbiAgICAgICAgICAgIGlmICh0aGlzQ2xhc3MgIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoTG9jYWxWYXJpYWJsZVRvU3RhY2ssXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhY2twb3NPZlZhcmlhYmxlOiAwXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBvYmplY3ROb2RlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHRoaXNDbGFzcyxcclxuICAgICAgICAgICAgICAgICAgICBpc0Fzc2lnbmFibGU6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJFaW4gTWV0aG9kZW5hdWZydWYgKGhpZXI6IFwiICsgbm9kZS5pZGVudGlmaWVyICtcclxuICAgICAgICAgICAgICAgICAgICBcIikgb2huZSBQdW5rdHNjaHJlaWJ3ZWlzZSBpc3QgbnVyIGlubmVyaGFsYiBhbmRlcmVyIE1ldGhvZGVuIG3DtmdsaWNoLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG9iamVjdE5vZGUgPSB0aGlzLnByb2Nlc3NOb2RlKG5vZGUub2JqZWN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChvYmplY3ROb2RlID09IG51bGwpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBpZiAoIShcclxuICAgICAgICAgICAgKG9iamVjdE5vZGUudHlwZSBpbnN0YW5jZW9mIEtsYXNzKSB8fCAob2JqZWN0Tm9kZS50eXBlIGluc3RhbmNlb2YgU3RhdGljQ2xhc3MpIHx8XHJcbiAgICAgICAgICAgIChvYmplY3ROb2RlLnR5cGUgaW5zdGFuY2VvZiBJbnRlcmZhY2UpIHx8IChvYmplY3ROb2RlLnR5cGUgaW5zdGFuY2VvZiBFbnVtKSkpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChvYmplY3ROb2RlLnR5cGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJXZXJ0ZSBkaWVzZXMgRGF0ZW50eXBzIGJlc2l0emVuIGtlaW5lIE1ldGhvZGVuLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKCdXZXJ0ZSBkZXMgRGF0ZW50eXBzICcgKyBvYmplY3ROb2RlLnR5cGUuaWRlbnRpZmllciArIFwiIGJlc2l0emVuIGtlaW5lIE1ldGhvZGVuLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgb2JqZWN0VHlwZTogS2xhc3MgfCBTdGF0aWNDbGFzcyB8IEludGVyZmFjZSA9IDxhbnk+b2JqZWN0Tm9kZS50eXBlO1xyXG5cclxuICAgICAgICBsZXQgcG9zQmVmb3JlUGFyYW1ldGVyRXZhbHVhdGlvbiA9IHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGxldCBwYXJhbWV0ZXJUeXBlczogVHlwZVtdID0gW107XHJcbiAgICAgICAgbGV0IHBhcmFtZXRlclN0YXRlbWVudHM6IFN0YXRlbWVudFtdW10gPSBbXTtcclxuXHJcbiAgICAgICAgbGV0IGFsbFN0YXRlbWVudHMgPSB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHM7XHJcbiAgICAgICAgaWYgKG5vZGUub3BlcmFuZHMgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBwIG9mIG5vZGUub3BlcmFuZHMpIHtcclxuICAgICAgICAgICAgICAgIGxldCBwcm9ncmFtUG9pbnRlciA9IGFsbFN0YXRlbWVudHMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgbGV0IHR5cGVOb2RlID0gdGhpcy5wcm9jZXNzTm9kZShwKTtcclxuICAgICAgICAgICAgICAgIHBhcmFtZXRlclN0YXRlbWVudHMucHVzaChhbGxTdGF0ZW1lbnRzLnNwbGljZShwcm9ncmFtUG9pbnRlciwgYWxsU3RhdGVtZW50cy5sZW5ndGggLSBwcm9ncmFtUG9pbnRlcikpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVOb2RlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJUeXBlcy5wdXNoKHZvaWRQcmltaXRpdmVUeXBlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyVHlwZXMucHVzaCh0eXBlTm9kZS50eXBlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIGxldCBtZXRob2RzOiB7IGVycm9yOiBzdHJpbmcsIG1ldGhvZExpc3Q6IE1ldGhvZFtdIH07XHJcbiAgICAgICAgaWYgKG9iamVjdFR5cGUgaW5zdGFuY2VvZiBJbnRlcmZhY2UpIHtcclxuICAgICAgICAgICAgbWV0aG9kcyA9IG9iamVjdFR5cGUuZ2V0TWV0aG9kc1RoYXRGaXRXaXRoQ2FzdGluZyhub2RlLmlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJUeXBlcywgZmFsc2UpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCB1cFRvVmlzaWJpbGl0eSA9IGdldFZpc2liaWxpdHlVcFRvKG9iamVjdFR5cGUsIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICBtZXRob2RzID0gb2JqZWN0VHlwZS5nZXRNZXRob2RzVGhhdEZpdFdpdGhDYXN0aW5nKG5vZGUuaWRlbnRpZmllcixcclxuICAgICAgICAgICAgICAgIHBhcmFtZXRlclR5cGVzLCBmYWxzZSwgdXBUb1Zpc2liaWxpdHkpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubW9kdWxlLnB1c2hNZXRob2RDYWxsUG9zaXRpb24obm9kZS5wb3NpdGlvbiwgbm9kZS5jb21tYVBvc2l0aW9ucywgb2JqZWN0VHlwZS5nZXRNZXRob2RzKFZpc2liaWxpdHkucHJpdmF0ZSwgbm9kZS5pZGVudGlmaWVyKSwgbm9kZS5yaWdodEJyYWNrZXRQb3NpdGlvbik7XHJcblxyXG4gICAgICAgIGlmIChtZXRob2RzLmVycm9yICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IobWV0aG9kcy5lcnJvciwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGlzQXNzaWduYWJsZTogZmFsc2UgfTsgLy8gdHJ5IHRvIGNvbnRpbnVlLi4uXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbWV0aG9kID0gbWV0aG9kcy5tZXRob2RMaXN0WzBdO1xyXG5cclxuICAgICAgICB0aGlzLnB1c2hVc2FnZVBvc2l0aW9uKG5vZGUucG9zaXRpb24sIG1ldGhvZCk7XHJcblxyXG4gICAgICAgIC8vIFlvdSBDQU4gY2FsbCBhIHN0YXRpYyBtZXRob2Qgb24gYSBvYmplY3QuLi4sIHNvOlxyXG4gICAgICAgIGlmIChtZXRob2QuaXNTdGF0aWMgJiYgb2JqZWN0VHlwZSBpbnN0YW5jZW9mIEtsYXNzICYmIG9iamVjdFR5cGUuaWRlbnRpZmllciAhPSBcIlByaW50U3RyZWFtXCIpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJFcyBpc3Qga2VpbiBndXRlciBQcm9ncmFtbWllcnN0aWwsIHN0YXRpc2NoZSBNZXRob2RlbiBlaW5lciBLbGFzc2UgbWl0aGlsZmUgZWluZXMgT2JqZWt0cyBhdWZ6dXJ1ZmVuLiBCZXNzZXIgd8OkcmUgaGllciBcIiArIG9iamVjdFR5cGUuaWRlbnRpZmllciArIFwiLlwiICsgbWV0aG9kLmlkZW50aWZpZXIgKyBcIiguLi4pLlwiLCBub2RlLnBvc2l0aW9uLCBcImluZm9cIik7XHJcbiAgICAgICAgICAgIHRoaXMuaW5zZXJ0U3RhdGVtZW50cyhwb3NCZWZvcmVQYXJhbWV0ZXJFdmFsdWF0aW9uLCBbe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmRlY3JlYXNlU3RhY2twb2ludGVyLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICBwb3BDb3VudDogMVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaFN0YXRpY0NsYXNzT2JqZWN0LFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICBrbGFzczogb2JqZWN0VHlwZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGRlc3RUeXBlOiBUeXBlID0gbnVsbDtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmFtZXRlclR5cGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChpIDwgbWV0aG9kLmdldFBhcmFtZXRlckNvdW50KCkpIHsgIC8vIHBvc3NpYmxlIGVsbGlwc2lzIVxyXG4gICAgICAgICAgICAgICAgZGVzdFR5cGUgPSBtZXRob2QuZ2V0UGFyYW1ldGVyVHlwZShpKTtcclxuICAgICAgICAgICAgICAgIGlmIChpID09IG1ldGhvZC5nZXRQYXJhbWV0ZXJDb3VudCgpIC0gMSAmJiBtZXRob2QuaGFzRWxsaXBzaXMoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlc3RUeXBlID0gKDxBcnJheVR5cGU+ZGVzdFR5cGUpLmFycmF5T2ZUeXBlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBzcmNUeXBlID0gcGFyYW1ldGVyVHlwZXNbaV07XHJcbiAgICAgICAgICAgIGZvciAobGV0IHN0IG9mIHBhcmFtZXRlclN0YXRlbWVudHNbaV0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5wdXNoKHN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuZW5zdXJlQXV0b21hdGljQ2FzdGluZyhzcmNUeXBlLCBkZXN0VHlwZSwgbm9kZS5vcGVyYW5kc1tpXS5wb3NpdGlvbiwgbm9kZS5vcGVyYW5kc1tpXSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVyIFdlcnQgdm9tIERhdGVudHlwIFwiICsgc3JjVHlwZS5pZGVudGlmaWVyICsgXCIga2FubiBuaWNodCBhbHMgUGFyYW1ldGVyIChEYXRlbnR5cCBcIiArIGRlc3RUeXBlLmlkZW50aWZpZXIgKyBcIikgdmVyd2VuZGV0IHdlcmRlbi5cIiwgbm9kZS5vcGVyYW5kc1tpXS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGlmIChzcmNUeXBlIGluc3RhbmNlb2YgUHJpbWl0aXZlVHlwZSAmJiBkZXN0VHlwZSBpbnN0YW5jZW9mIFByaW1pdGl2ZVR5cGUpIHtcclxuICAgICAgICAgICAgLy8gICAgIGlmIChzcmNUeXBlLmdldENhc3RJbmZvcm1hdGlvbihkZXN0VHlwZSkubmVlZHNTdGF0ZW1lbnQpIHtcclxuICAgICAgICAgICAgLy8gICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmNhc3RWYWx1ZSxcclxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgcG9zaXRpb246IG51bGwsXHJcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIG5ld1R5cGU6IGRlc3RUeXBlLFxyXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBzdGFja1Bvc1JlbGF0aXZlOiAtcGFyYW1ldGVyVHlwZXMubGVuZ3RoICsgMSArIGlcclxuICAgICAgICAgICAgLy8gICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzdGFja2ZyYW1lRGVsdGEgPSAwO1xyXG4gICAgICAgIGlmIChtZXRob2QuaGFzRWxsaXBzaXMoKSkge1xyXG4gICAgICAgICAgICBsZXQgZWxsaXBzaXNQYXJhbWV0ZXJDb3VudCA9IHBhcmFtZXRlclR5cGVzLmxlbmd0aCAtIG1ldGhvZC5nZXRQYXJhbWV0ZXJDb3VudCgpICsgMTsgLy8gbGFzdCBwYXJhbWV0ZXIgYW5kIHN1YnNlcXVlbnQgb25lc1xyXG4gICAgICAgICAgICBzdGFja2ZyYW1lRGVsdGEgPSAtIChlbGxpcHNpc1BhcmFtZXRlckNvdW50IC0gMSk7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLm1ha2VFbGxpcHNpc0FycmF5LFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUub3BlcmFuZHNbbWV0aG9kLmdldFBhcmFtZXRlckNvdW50KCkgLSAxXS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIHBhcmFtZXRlckNvdW50OiBlbGxpcHNpc1BhcmFtZXRlckNvdW50LFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGFycmF5VHlwZTogbWV0aG9kLmdldFBhcmFtZXRlcihtZXRob2QuZ2V0UGFyYW1ldGVyQ291bnQoKSAtIDEpLnR5cGVcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtZXRob2QudmlzaWJpbGl0eSAhPSBWaXNpYmlsaXR5LnB1YmxpYykge1xyXG5cclxuICAgICAgICAgICAgbGV0IHZpc2libGUgPSB0cnVlO1xyXG4gICAgICAgICAgICBsZXQgY2xhc3NDb250ZXh0ID0gdGhpcy5jdXJyZW50U3ltYm9sVGFibGUuY2xhc3NDb250ZXh0O1xyXG4gICAgICAgICAgICBpZiAoY2xhc3NDb250ZXh0ID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmIChjbGFzc0NvbnRleHQgIT0gb2JqZWN0VHlwZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICEoY2xhc3NDb250ZXh0IGluc3RhbmNlb2YgS2xhc3MgJiYgY2xhc3NDb250ZXh0LmltcGxlbWVudHMuaW5kZXhPZig8SW50ZXJmYWNlPm9iamVjdFR5cGUpID4gMCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWV0aG9kLnZpc2liaWxpdHkgPT0gVmlzaWJpbGl0eS5wcml2YXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmxlID0gY2xhc3NDb250ZXh0Lmhhc0FuY2VzdG9yT3JJcyg8S2xhc3MgfCBTdGF0aWNDbGFzcz5vYmplY3RUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCF2aXNpYmxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRpZSBNZXRob2RlIFwiICsgbWV0aG9kLmlkZW50aWZpZXIgKyBcIiBpc3QgYW4gZGllc2VyIFN0ZWxsZSBkZXMgUHJvZ3JhbW1zIG5pY2h0IHNpY2h0YmFyLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1ldGhvZC5pc1N0YXRpYyAmJiBvYmplY3ROb2RlLnR5cGUgIT0gbnVsbCAmJlxyXG4gICAgICAgICAgICAob2JqZWN0Tm9kZS50eXBlIGluc3RhbmNlb2YgU3RhdGljQ2xhc3MpICYmXHJcbiAgICAgICAgICAgIChvYmplY3ROb2RlLnR5cGUuS2xhc3MgaW5zdGFuY2VvZiBJbnB1dENsYXNzKSkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2FsbElucHV0TWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBtZXRob2QsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0YWNrZnJhbWVCZWdpbjogLShwYXJhbWV0ZXJUeXBlcy5sZW5ndGggKyAxICsgc3RhY2tmcmFtZURlbHRhKSAvLyB0aGlzLW9iamVjdCBmb2xsb3dlZCBieSBwYXJhbWV0ZXJzXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5jYWxsTWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBtZXRob2QsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIGlzU3VwZXJDYWxsOiBvYmplY3ROb2RlLmlzU3VwZXIgPT0gbnVsbCA/IGZhbHNlIDogb2JqZWN0Tm9kZS5pc1N1cGVyLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3RhY2tmcmFtZUJlZ2luOiAtKHBhcmFtZXRlclR5cGVzLmxlbmd0aCArIDEgKyBzdGFja2ZyYW1lRGVsdGEpIC8vIHRoaXMtb2JqZWN0IGZvbGxvd2VkIGJ5IHBhcmFtZXRlcnNcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcblxyXG4gICAgICAgIHRoaXMucHVzaFR5cGVQb3NpdGlvbihub2RlLnJpZ2h0QnJhY2tldFBvc2l0aW9uLCBtZXRob2QuZ2V0UmV0dXJuVHlwZSgpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogbWV0aG9kLmdldFJldHVyblR5cGUoKSwgaXNBc3NpZ25hYmxlOiBmYWxzZSB9O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwdXNoQ29uc3RhbnQobm9kZTogQ29uc3RhbnROb2RlKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgbGV0IHR5cGU6IFR5cGU7XHJcblxyXG4gICAgICAgIHN3aXRjaCAobm9kZS5jb25zdGFudFR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuaW50ZWdlckNvbnN0YW50OlxyXG4gICAgICAgICAgICAgICAgdHlwZSA9IGludFByaW1pdGl2ZVR5cGU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuYm9vbGVhbkNvbnN0YW50OlxyXG4gICAgICAgICAgICAgICAgdHlwZSA9IGJvb2xlYW5QcmltaXRpdmVUeXBlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmZsb2F0aW5nUG9pbnRDb25zdGFudDpcclxuICAgICAgICAgICAgICAgIHR5cGUgPSBmbG9hdFByaW1pdGl2ZVR5cGU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuc3RyaW5nQ29uc3RhbnQ6XHJcbiAgICAgICAgICAgICAgICB0eXBlID0gc3RyaW5nUHJpbWl0aXZlVHlwZTtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFR5cGVQb3NpdGlvbihub2RlLnBvc2l0aW9uLCB0eXBlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5jaGFyQ29uc3RhbnQ6XHJcbiAgICAgICAgICAgICAgICB0eXBlID0gY2hhclByaW1pdGl2ZVR5cGU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZE51bGw6XHJcbiAgICAgICAgICAgICAgICB0eXBlID0gbnVsbFR5cGVcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoQ29uc3RhbnQsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiB0eXBlLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgdmFsdWU6IG5vZGUuY29uc3RhbnRcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICByZXR1cm4geyB0eXBlOiB0eXBlLCBpc0Fzc2lnbmFibGU6IGZhbHNlIH07XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NCaW5hcnlPcChub2RlOiBCaW5hcnlPcE5vZGUpOiBTdGFja1R5cGUge1xyXG5cclxuICAgICAgICBsZXQgaXNBc3NpZ25tZW50ID0gQ29kZUdlbmVyYXRvci5hc3NpZ25tZW50T3BlcmF0b3JzLmluZGV4T2Yobm9kZS5vcGVyYXRvcikgPj0gMDtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUub3BlcmF0b3IgPT0gVG9rZW5UeXBlLnRlcm5hcnlPcGVyYXRvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzVGVybmFyeU9wZXJhdG9yKG5vZGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGxlZnRUeXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLmZpcnN0T3BlcmFuZCwgaXNBc3NpZ25tZW50KTtcclxuXHJcbiAgICAgICAgbGV0IHByb2dyYW1Qb3NBZnRlckxlZnRPcG9lcmFuZCA9IHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGxldCBsYXp5RXZhbHVhdGlvbkRlc3QgPSBudWxsO1xyXG4gICAgICAgIGlmIChub2RlLm9wZXJhdG9yID09IFRva2VuVHlwZS5hbmQpIHtcclxuICAgICAgICAgICAgbGF6eUV2YWx1YXRpb25EZXN0ID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXIuaW5zZXJ0SnVtcE5vZGUoVG9rZW5UeXBlLmp1bXBJZkZhbHNlQW5kTGVhdmVPblN0YWNrLCBub2RlLmZpcnN0T3BlcmFuZC5wb3NpdGlvbiwgdGhpcyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLm9wZXJhdG9yID09IFRva2VuVHlwZS5vcikge1xyXG4gICAgICAgICAgICBsYXp5RXZhbHVhdGlvbkRlc3QgPSB0aGlzLmN1cnJlbnRQcm9ncmFtLmxhYmVsTWFuYWdlci5pbnNlcnRKdW1wTm9kZShUb2tlblR5cGUuanVtcElmVHJ1ZUFuZExlYXZlT25TdGFjaywgbm9kZS5maXJzdE9wZXJhbmQucG9zaXRpb24sIHRoaXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJpZ2h0VHlwZSA9IHRoaXMucHJvY2Vzc05vZGUobm9kZS5zZWNvbmRPcGVyYW5kKTtcclxuXHJcbiAgICAgICAgaWYgKGxlZnRUeXBlID09IG51bGwgfHwgbGVmdFR5cGUudHlwZSA9PSBudWxsIHx8IHJpZ2h0VHlwZSA9PSBudWxsIHx8IHJpZ2h0VHlwZS50eXBlID09IG51bGwpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBpZiAoaXNBc3NpZ25tZW50KSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5lbnN1cmVBdXRvbWF0aWNDYXN0aW5nKHJpZ2h0VHlwZS50eXBlLCBsZWZ0VHlwZS50eXBlLCBub2RlLnBvc2l0aW9uLCBub2RlLmZpcnN0T3BlcmFuZCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVyIFdlcnQgdm9tIERhdGVudHlwIFwiICsgcmlnaHRUeXBlLnR5cGUuaWRlbnRpZmllciArIFwiIGF1ZiBkZXIgcmVjaHRlbiBTZWl0ZSBrYW5uIGRlciBWYXJpYWJsZW4gYXVmIGRlciBsaW5rZW4gU2VpdGUgKERhdGVudHlwIFwiICsgbGVmdFR5cGUudHlwZS5pZGVudGlmaWVyICsgXCIpIG5pY2h0IHp1Z2V3aWVzZW4gd2VyZGVuLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0VHlwZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFsZWZ0VHlwZS5pc0Fzc2lnbmFibGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVtIFRlcm0vZGVyIFZhcmlhYmxlbiBhdWYgZGVyIGxpbmtlbiBTZWl0ZSBkZXMgWnV3ZWlzdW5nc29wZXJhdG9ycyAoPSkga2FubiBrZWluIFdlcnQgenVnZXdpZXNlbiB3ZXJkZW4uXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgc3RhdGVtZW50OiBBc3NpZ25tZW50U3RhdGVtZW50ID0ge1xyXG4gICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBub2RlLm9wZXJhdG9yLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBsZWF2ZVZhbHVlT25TdGFjazogdHJ1ZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyhzdGF0ZW1lbnQpO1xyXG5cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBsZWZ0VHlwZTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChub2RlLmZpcnN0T3BlcmFuZC50eXBlID09IFRva2VuVHlwZS5pZGVudGlmaWVyICYmIG5vZGUuZmlyc3RPcGVyYW5kLnZhcmlhYmxlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGxldCB2ID0gbm9kZS5maXJzdE9wZXJhbmQudmFyaWFibGU7XHJcbiAgICAgICAgICAgICAgICBpZiAodi5pbml0aWFsaXplZCAhPSBudWxsICYmICF2LmluaXRpYWxpemVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdi51c2VkQmVmb3JlSW5pdGlhbGl6YXRpb24gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIFZhcmlhYmxlIFwiICsgdi5pZGVudGlmaWVyICsgXCIgd2lyZCBoaWVyIGJlbnV0enQgYmV2b3Igc2llIGluaXRpYWxpc2llcnQgd3VyZGUuXCIsIG5vZGUucG9zaXRpb24sIFwiaW5mb1wiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHJlc3VsdFR5cGUgPSBsZWZ0VHlwZS50eXBlLmdldFJlc3VsdFR5cGUobm9kZS5vcGVyYXRvciwgcmlnaHRUeXBlLnR5cGUpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHVuYm94YWJsZUxlZnQgPSBsZWZ0VHlwZS50eXBlW1widW5ib3hhYmxlQXNcIl07XHJcbiAgICAgICAgICAgIGxldCB1bmJveGFibGVSaWdodCA9IHJpZ2h0VHlwZS50eXBlW1widW5ib3hhYmxlQXNcIl07XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzdWx0VHlwZSA9PSBudWxsICYmICh1bmJveGFibGVMZWZ0ICE9IG51bGwgfHwgdW5ib3hhYmxlUmlnaHQgIT0gbnVsbCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBsZWZ0VHlwZXM6IFR5cGVbXSA9IHVuYm94YWJsZUxlZnQgPT0gbnVsbCA/IFtsZWZ0VHlwZS50eXBlXSA6IHVuYm94YWJsZUxlZnQ7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmlnaHRUeXBlczogVHlwZVtdID0gdW5ib3hhYmxlUmlnaHQgPT0gbnVsbCA/IFtyaWdodFR5cGUudHlwZV0gOiB1bmJveGFibGVSaWdodDtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBsdCBvZiBsZWZ0VHlwZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBydCBvZiByaWdodFR5cGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFR5cGUgPSBsdC5nZXRSZXN1bHRUeXBlKG5vZGUub3BlcmF0b3IsIHJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdFR5cGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdFR5cGUudHlwZSA9IGx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHRUeXBlLnR5cGUgPSBydDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHRUeXBlICE9IG51bGwpIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTaXR1YXRpb24gT2JqZWN0ICsgU3RyaW5nOiBpbnNlcnQgdG9TdHJpbmcoKS1NZXRob2RcclxuICAgICAgICAgICAgaWYgKHJlc3VsdFR5cGUgPT0gbnVsbCAmJiBub2RlLm9wZXJhdG9yID09IFRva2VuVHlwZS5wbHVzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobGVmdFR5cGUudHlwZSBpbnN0YW5jZW9mIEtsYXNzICYmIHJpZ2h0VHlwZS50eXBlID09IHN0cmluZ1ByaW1pdGl2ZVR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluc2VydFN0YXRlbWVudHMocHJvZ3JhbVBvc0FmdGVyTGVmdE9wb2VyYW5kLCB0aGlzLmdldFRvU3RyaW5nU3RhdGVtZW50KGxlZnRUeXBlLnR5cGUsIG5vZGUuZmlyc3RPcGVyYW5kLnBvc2l0aW9uKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0VHlwZSA9IHN0cmluZ1ByaW1pdGl2ZVR5cGU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJpZ2h0VHlwZS50eXBlIGluc3RhbmNlb2YgS2xhc3MgJiYgbGVmdFR5cGUudHlwZSA9PSBzdHJpbmdQcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh0aGlzLmdldFRvU3RyaW5nU3RhdGVtZW50KHJpZ2h0VHlwZS50eXBlLCBub2RlLmZpcnN0T3BlcmFuZC5wb3NpdGlvbikpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFR5cGUgPSBzdHJpbmdQcmltaXRpdmVUeXBlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgaWYgKG5vZGUub3BlcmF0b3IgaW4gW1Rva2VuVHlwZS5hbmQsIFRva2VuVHlwZS5vcl0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tJZkFzc2lnbm1lbnRJbnN0ZWRPZkVxdWFsKG5vZGUuZmlyc3RPcGVyYW5kKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tJZkFzc2lnbm1lbnRJbnN0ZWRPZkVxdWFsKG5vZGUuc2Vjb25kT3BlcmFuZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZXN1bHRUeXBlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGxldCBiaXRPcGVyYXRvcnMgPSBbVG9rZW5UeXBlLmFtcGVyc2FuZCwgVG9rZW5UeXBlLk9SXTtcclxuICAgICAgICAgICAgICAgIGxldCBib29sZWFuT3BlcmF0b3JzID0gW1wiJiYgKGJvb2xlc2NoZXIgVU5ELU9wZXJhdG9yKVwiLCBcInx8IChib29sZXNjaGVyIE9ERVItT3BlcmF0b3IpXCJdO1xyXG4gICAgICAgICAgICAgICAgbGV0IGJldHRlck9wZXJhdG9ycyA9IFtcIiYgJlwiLCBcInx8XCJdO1xyXG4gICAgICAgICAgICAgICAgbGV0IG9wSW5kZXggPSBiaXRPcGVyYXRvcnMuaW5kZXhPZihub2RlLm9wZXJhdG9yKTtcclxuICAgICAgICAgICAgICAgIGlmKG9wSW5kZXggPj0gMCAmJiBsZWZ0VHlwZS50eXBlID09IGJvb2xlYW5QcmltaXRpdmVUeXBlICYmIHJpZ2h0VHlwZS50eXBlID09IGJvb2xlYW5QcmltaXRpdmVUeXBlKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRpZSBPcGVyYXRpb24gXCIgKyBUb2tlblR5cGVSZWFkYWJsZVtub2RlLm9wZXJhdG9yXSArIFwiIGlzdCBmw7xyIGRpZSBPcGVyYW5kZW4gZGVyIFR5cGVuIFwiICsgbGVmdFR5cGUudHlwZS5pZGVudGlmaWVyICsgXCIgdW5kIFwiICsgcmlnaHRUeXBlLnR5cGUuaWRlbnRpZmllciArIFwiIG5pY2h0IGRlZmluaWVydC4gRHUgbWVpbnRlc3Qgd2FocnNjaGVpbmxpY2ggZGVuIE9wZXJhdG9yIFwiICsgYm9vbGVhbk9wZXJhdG9yc1tvcEluZGV4XSArIFwiLlwiLCBub2RlLnBvc2l0aW9uLCBcImVycm9yXCIsXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJPcGVyYXRvciBcIiArIGJldHRlck9wZXJhdG9yc1tvcEluZGV4XSArIFwiIHZlcndlbmRlbiBzdGF0dCBcIiArIFRva2VuVHlwZVJlYWRhYmxlW25vZGUub3BlcmF0b3JdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0c1Byb3ZpZGVyOiAodXJpKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2U6IHVyaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHsgc3RhcnRMaW5lTnVtYmVyOiBub2RlLnBvc2l0aW9uLmxpbmUsIHN0YXJ0Q29sdW1uOiBub2RlLnBvc2l0aW9uLmNvbHVtbiwgZW5kTGluZU51bWJlcjogbm9kZS5wb3NpdGlvbi5saW5lLCBlbmRDb2x1bW46IG5vZGUucG9zaXRpb24uY29sdW1uIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBUb2tlblR5cGVSZWFkYWJsZVtub2RlLm9wZXJhdG9yXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIE9wZXJhdGlvbiBcIiArIFRva2VuVHlwZVJlYWRhYmxlW25vZGUub3BlcmF0b3JdICsgXCIgaXN0IGbDvHIgZGllIE9wZXJhbmRlbiBkZXIgVHlwZW4gXCIgKyBsZWZ0VHlwZS50eXBlLmlkZW50aWZpZXIgKyBcIiB1bmQgXCIgKyByaWdodFR5cGUudHlwZS5pZGVudGlmaWVyICsgXCIgbmljaHQgZGVmaW5pZXJ0LlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0VHlwZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmJpbmFyeU9wLFxyXG4gICAgICAgICAgICAgICAgbGVmdFR5cGU6IGxlZnRUeXBlLnR5cGUsXHJcbiAgICAgICAgICAgICAgICBvcGVyYXRvcjogbm9kZS5vcGVyYXRvcixcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKGxhenlFdmFsdWF0aW9uRGVzdCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtLmxhYmVsTWFuYWdlci5tYXJrSnVtcERlc3RpbmF0aW9uKDEsIGxhenlFdmFsdWF0aW9uRGVzdCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHJlc3VsdFR5cGUsIGlzQXNzaWduYWJsZTogZmFsc2UgfTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzVGVybmFyeU9wZXJhdG9yKG5vZGU6IEJpbmFyeU9wTm9kZSk6IFN0YWNrVHlwZSB7XHJcblxyXG4gICAgICAgIGxldCBsZWZ0VHlwZSA9IHRoaXMucHJvY2Vzc05vZGUobm9kZS5maXJzdE9wZXJhbmQpO1xyXG5cclxuICAgICAgICBpZiAobGVmdFR5cGUgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5lbnN1cmVBdXRvbWF0aWNDYXN0aW5nKGxlZnRUeXBlLnR5cGUsIGJvb2xlYW5QcmltaXRpdmVUeXBlLCBudWxsLCBub2RlLmZpcnN0T3BlcmFuZCkpIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBzZWNvbmRPcGVyYW5kID0gbm9kZS5zZWNvbmRPcGVyYW5kO1xyXG4gICAgICAgICAgICBpZiAoc2Vjb25kT3BlcmFuZCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2Vjb25kT3BlcmFuZC50eXBlICE9IFRva2VuVHlwZS5iaW5hcnlPcCB8fCBzZWNvbmRPcGVyYW5kLm9wZXJhdG9yICE9IFRva2VuVHlwZS5jb2xvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiQXVmIGRlbiBGcmFnZXplaWNoZW5vcGVyYXRvciBtw7xzc2VuIC0gbWl0IERvcHBlbHB1bmt0IGdldHJlbm50IC0gendlaSBBbHRlcm5hdGl2dGVybWUgZm9sZ2VuLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGxtID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhcmlhbnRGYWxzZUxhYmVsID0gbG0uaW5zZXJ0SnVtcE5vZGUoVG9rZW5UeXBlLmp1bXBJZkZhbHNlLCBub2RlLnBvc2l0aW9uLCB0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZmlyc3RUeXBlID0gdGhpcy5wcm9jZXNzTm9kZShzZWNvbmRPcGVyYW5kLmZpcnN0T3BlcmFuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGVuZExhYmVsID0gbG0uaW5zZXJ0SnVtcE5vZGUoVG9rZW5UeXBlLmp1bXBBbHdheXMsIHNlY29uZE9wZXJhbmQuZmlyc3RPcGVyYW5kLnBvc2l0aW9uLCB0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEsIHZhcmlhbnRGYWxzZUxhYmVsKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2Vjb25kVHlwZSA9IHRoaXMucHJvY2Vzc05vZGUoc2Vjb25kT3BlcmFuZC5zZWNvbmRPcGVyYW5kKTtcclxuICAgICAgICAgICAgICAgICAgICBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEsIGVuZExhYmVsKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSBmaXJzdFR5cGUudHlwZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSAhPSBzZWNvbmRUeXBlLnR5cGUgJiYgdHlwZS5jYW5DYXN0VG8oc2Vjb25kVHlwZS50eXBlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gc2Vjb25kVHlwZS50eXBlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNBc3NpZ25hYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzVW5hcnlPcChub2RlOiBVbmFyeU9wTm9kZSk6IFN0YWNrVHlwZSB7XHJcbiAgICAgICAgbGV0IGxlZnRUeXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLm9wZXJhbmQpO1xyXG5cclxuICAgICAgICBpZiAobGVmdFR5cGUgPT0gbnVsbCB8fCBsZWZ0VHlwZS50eXBlID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUub3BlcmF0b3IgPT0gVG9rZW5UeXBlLm1pbnVzKSB7XHJcbiAgICAgICAgICAgIGlmICghbGVmdFR5cGUudHlwZS5jYW5DYXN0VG8oZmxvYXRQcmltaXRpdmVUeXBlKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgT3BlcmF0b3IgLSBpc3QgZsO8ciBkZW4gVHlwIFwiICsgbGVmdFR5cGUudHlwZS5pZGVudGlmaWVyICsgXCIgbmljaHQgZGVmaW5pZXJ0LlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0VHlwZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChub2RlLm9wZXJhdG9yID09IFRva2VuVHlwZS5ub3QpIHtcclxuICAgICAgICAgICAgaWYgKCEobGVmdFR5cGUudHlwZSA9PSBib29sZWFuUHJpbWl0aXZlVHlwZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tJZkFzc2lnbm1lbnRJbnN0ZWRPZkVxdWFsKG5vZGUub3BlcmFuZCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBPcGVyYXRvciAhIGlzdCBmw7xyIGRlbiBUeXAgXCIgKyBsZWZ0VHlwZS50eXBlLmlkZW50aWZpZXIgKyBcIiBuaWNodCBkZWZpbmllcnQuXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRUeXBlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS51bmFyeU9wLFxyXG4gICAgICAgICAgICBvcGVyYXRvcjogbm9kZS5vcGVyYXRvcixcclxuICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb25cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGxlZnRUeXBlO1xyXG4gICAgfVxyXG5cclxufSJdfQ==