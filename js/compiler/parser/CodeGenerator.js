import { TokenType, TokenTypeReadable } from "../lexer/Token.js";
import { ArrayType } from "../types/Array.js";
import { Klass, Interface, StaticClass, Visibility, getVisibilityUpTo } from "../types/Class.js";
import { booleanPrimitiveType, charPrimitiveType, floatPrimitiveType, intPrimitiveType, stringPrimitiveType, objectType, nullType, voidPrimitiveType, varType, doublePrimitiveType } from "../types/PrimitiveTypes.js";
import { Attribute, PrimitiveType, getTypeIdentifier, Parameterlist } from "../types/Types.js";
import { LabelManager } from "./LabelManager.js";
import { SymbolTable } from "./SymbolTable.js";
import { Enum } from "../types/Enum.js";
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
        let destType = null;
        for (let i = 0; i < parameterTypes.length; i++) {
            if (i < method.getParameterCount()) { // possible ellipsis!
                destType = method.getParameterType(i);
                if (i == method.getParameterCount() - 1 && method.hasEllipsis()) {
                    destType = destType.arrayOfType;
                }
            }
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
        let stackframeDelta = 0;
        if (method.hasEllipsis()) {
            let ellipsisParameterCount = parameterTypes.length - method.getParameterCount() + 1; // last parameter and subsequent ones
            stackframeDelta = -(ellipsisParameterCount - 1);
            this.pushStatements({
                type: TokenType.makeEllipsisArray,
                position: parameterNodes[method.getParameterCount() - 1].position,
                parameterCount: ellipsisParameterCount,
                stepFinished: false,
                arrayType: method.getParameter(method.getParameterCount() - 1).type
            });
        }
        this.pushStatements({
            type: TokenType.callMethod,
            method: method,
            position: position,
            stepFinished: true,
            isSuperCall: false,
            stackframeBegin: -(parameterTypes.length + 1 + stackframeDelta) // this-object followed by parameters
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
                let m = methodNode.resolvedType;
                if (m != null && m.annotation == "@Override") {
                    if (klass.baseClass != null) {
                        if (klass.baseClass.getMethodBySignature(m.signature) == null) {
                            this.pushError("Die Methode " + m.signature + " ist mit @Override annotiert, überschreibt aber keine Methode gleicher Signatur einer Oberklasse.", methodNode.position, "warning");
                        }
                    }
                }
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
    getSuperconstructorCalls(nodes, superconstructorCallsFound, isFirstStatement) {
        for (let node of nodes) {
            if (node == null)
                continue;
            if (node.type == TokenType.superConstructorCall) {
                if (!isFirstStatement) {
                    if (superconstructorCallsFound.length > 0) {
                        this.pushError("Ein Konstruktor darf nur einen einzigen Aufruf des Superkonstruktors enthalten.", node.position, "error");
                    }
                    else {
                        this.pushError("Vor dem Aufruf des Superkonstruktors darf keine andere Anweisung stehen.", node.position, "error");
                    }
                }
                superconstructorCallsFound.push(node);
                isFirstStatement = false;
            }
            else if (node.type == TokenType.scopeNode && node.statements != null) {
                isFirstStatement = isFirstStatement && this.getSuperconstructorCalls(node.statements, superconstructorCallsFound, isFirstStatement);
            }
            else {
                isFirstStatement = false;
            }
        }
        return isFirstStatement;
    }
    compileMethod(methodNode) {
        var _a, _b, _c;
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
        if (method.isConstructor && this.currentSymbolTable.classContext instanceof Klass && methodNode.statements != null) {
            let c = this.currentSymbolTable.classContext;
            let superconstructorCalls = [];
            this.getSuperconstructorCalls(methodNode.statements, superconstructorCalls, true);
            let superconstructorCallEnsured = superconstructorCalls.length > 0;
            // if (methodNode.statements.length > 0 && methodNode.statements[0].type == TokenType.scopeNode) {
            //     let stm = methodNode.statements[0].statements;
            //     if (stm.length > 0 && [TokenType.superConstructorCall, TokenType.constructorCall].indexOf(stm[0].type) >= 0) {
            //         superconstructorCallEnsured = true;
            //     }
            // } else if ([TokenType.superConstructorCall, TokenType.constructorCall].indexOf(methodNode.statements[0].type) >= 0) {
            //     superconstructorCallEnsured = true;
            // }
            if (c != null && ((_a = c.baseClass) === null || _a === void 0 ? void 0 : _a.hasConstructor()) && !((_b = c.baseClass) === null || _b === void 0 ? void 0 : _b.hasParameterlessConstructor())) {
                let error = false;
                if (methodNode.statements == null || methodNode.statements.length == 0)
                    error = true;
                if (!error) {
                    error = !superconstructorCallEnsured;
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
                    this.pushError("Die Basisklasse der Klasse " + c.identifier + " besitzt keinen parameterlosen Konstruktor, daher muss diese Konstruktordefinition mit einem Aufruf eines Konstruktors der Basisklasse (super(...)) beginnen.", methodNode.position, "error", quickFix);
                }
            }
            else if (!superconstructorCallEnsured && ((_c = c.baseClass) === null || _c === void 0 ? void 0 : _c.hasParameterlessConstructor())) {
                // invoke parameterless constructor
                let baseClassConstructor = c.baseClass.getParameterlessConstructor();
                this.pushStatements([
                    // Push this-object to stack:
                    {
                        type: TokenType.pushLocalVariableToStack,
                        position: methodNode.position,
                        stackposOfVariable: 0
                    },
                    {
                        type: TokenType.callMethod,
                        method: baseClassConstructor,
                        isSuperCall: true,
                        position: methodNode.position,
                        stackframeBegin: -1 // this-object followed by parameters
                    }
                ]);
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
                stepFinished: false,
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
        if (typeFrom == null || typeTo == null)
            return false;
        if (typeFrom.equals(typeTo)) {
            return true;
        }
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
                if (this.lastStatement != null && this.lastStatement.type != TokenType.noOp)
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
        if (this.currentProgram.labelManager != null) {
            this.currentProgram.labelManager.removeNode(lst);
        }
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
            case TokenType.constructorCall:
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
        var _a;
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
                    this.pushError("Der Datentyp des Terms (" + ((_a = sType.type) === null || _a === void 0 ? void 0 : _a.identifier) + ") kann nicht in den Datentyp " + (targetType === null || targetType === void 0 ? void 0 : targetType.identifier) + " konvertiert werden.", ain.position);
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
                    this.pushError("Die Methode " + method.identifier + " erwartet einen Rückgabewert vom Typ " + method.getReturnType().identifier + ". Gefunden wurde ein Wert vom Typ " + type.type.identifier + ".", node.position);
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
                // default case
                let label = lm.markJumpDestination(1);
                let statements = this.generateStatements(caseNode.statements);
                if ((statements === null || statements === void 0 ? void 0 : statements.withReturnStatement) == null || !statements.withReturnStatement) {
                    withReturnStatement = false;
                }
                switchStatement.defaultDestination = label;
            }
        }
        if (switchStatement.defaultDestination == null) {
            withReturnStatement = false;
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
            if (collectionType.typeVariables.length == 0) {
                collectionElementType = objectType;
            }
            else {
                collectionElementType = collectionType.typeVariables[0].type;
            }
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
        let pc = this.currentProgram.statements.length;
        let statements = this.generateStatements(node.statements);
        let withReturnStatement = statements.withReturnStatement;
        if (this.currentProgram.statements.length == pc) {
            this.insertNoOp(node.scopeTo, false);
        }
        this.closeContinueScope(conditionBeginLabel, lm);
        lm.insertJumpNode(TokenType.jumpAlways, statements.endPosition, this, conditionBeginLabel);
        lm.markJumpDestination(1, afterWhileStatementLabel);
        this.closeBreakScope(afterWhileStatementLabel, lm);
        this.popSymbolTable();
        return { type: null, isAssignable: false, withReturnStatement: withReturnStatement };
    }
    insertNoOp(position, stepFinished) {
        this.pushStatements({
            type: TokenType.noOp,
            position: position,
            stepFinished: stepFinished
        });
    }
    processDo(node) {
        let lm = this.currentProgram.labelManager;
        this.pushNewSymbolTable(false, node.scopeFrom, node.scopeTo);
        let statementsBeginLabel = lm.markJumpDestination(1);
        this.openBreakScope();
        this.openContinueScope();
        let pc = this.currentProgram.statements.length;
        let statements = this.generateStatements(node.statements);
        let withReturnStatement = statements.withReturnStatement;
        if (this.currentProgram.statements.length == pc) {
            this.insertNoOp(node.scopeTo, false);
        }
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
        // let parameterStatements: Statement[][] = [];
        let positionsAfterParameterStatements = [];
        let allStatements = this.currentProgram.statements;
        if (((_a = node.constructorOperands) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            // for (let p of node.constructorOperands) {
            for (let j = 0; j < node.constructorOperands.length; j++) {
                let p = node.constructorOperands[j];
                // let programPointer = allStatements.length;
                let typeNode = this.processNode(p);
                // parameterStatements.push(allStatements.splice(programPointer, allStatements.length - programPointer));
                positionsAfterParameterStatements.push(allStatements.length);
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
                let ok = (resolvedType == classContext || resolvedType != staticClassContext || (classContext instanceof StaticClass && resolvedType == classContext.Klass));
                if (!ok) {
                    this.pushError("Die Konstruktormethode ist private und daher hier nicht sichtbar.", node.position);
                }
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
                // for (let st of parameterStatements[i]) {
                //     this.currentProgram.statements.push(st);
                // }
                let programPosition = allStatements.length;
                if (!this.ensureAutomaticCasting(srcType, destType, node.constructorOperands[i].position, node.constructorOperands[i])) {
                    this.pushError("Der Wert vom Datentyp " + srcType.identifier + " kann nicht als Parameter (Datentyp " + destType.identifier + ") verwendet werden.", node.constructorOperands[i].position);
                }
                if (allStatements.length > programPosition) {
                    let castingStatements = allStatements.splice(programPosition, allStatements.length - programPosition);
                    allStatements.splice(positionsAfterParameterStatements[i], 0, ...castingStatements);
                    this.currentProgram.labelManager.correctPositionsAfterInsert(positionsAfterParameterStatements[i], castingStatements.length);
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
        let isSuperConstructorCall = node.type == TokenType.superConstructorCall;
        if (isSuperConstructorCall) {
            if ((classContext === null || classContext === void 0 ? void 0 : classContext.baseClass) == null || classContext.baseClass.identifier == "Object") {
                this.pushError("Die Klasse ist nur Kindklasse der Klasse Object, daher ist der Aufruf des Superkonstruktors nicht möglich.", node.position);
            }
        }
        let methodContext = this.currentSymbolTable.method;
        if (classContext == null || methodContext == null || !methodContext.isConstructor) {
            this.pushError("Ein Aufruf des Konstruktors oder des Superkonstructors ist nur innerhalb des Konstruktors einer Klasse möglich.", node.position);
            return null;
        }
        let superclassType;
        if (isSuperConstructorCall) {
            superclassType = classContext.baseClass;
            if (superclassType instanceof StaticClass) {
                this.pushError("Statische Methoden haben keine super-Methodenaufrufe.", node.position);
                return { type: null, isAssignable: false };
            }
            if (superclassType == null)
                superclassType = this.moduleStore.getType("Object").type;
        }
        else {
            superclassType = classContext;
            if (superclassType instanceof StaticClass) {
                this.pushError("Statische Methoden haben keine this-Methodenaufrufe.", node.position);
                return { type: null, isAssignable: false };
            }
        }
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
            isSuperCall: isSuperConstructorCall,
            position: node.position,
            stackframeBegin: -(parameterTypes.length + 1 + stackframeDelta) // this-object followed by parameters
        });
        // Pabst, 21.10.2020:
        // super method is constructor => returns nothing even if method.getReturnType() is class object
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
                node.attribute = attribute;
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
            (objectNode.type instanceof Interface && (node.object["variable"] != null || node.object["attribute"] != null || node.object["termInsideBrackets"] != null)) || (objectNode.type instanceof Enum))) {
            if (objectNode.type == null) {
                this.pushError("Werte dieses Datentyps besitzen keine Methoden.", node.position);
            }
            else {
                if (objectNode.type instanceof Interface) {
                    this.pushError('Methodendefinitionen eines Interfaces können nicht statisch aufgerufen werden.', node.position);
                }
                else {
                    this.pushError('Werte des Datentyps ' + objectNode.type.identifier + " besitzen keine Methoden.", node.position);
                }
            }
            return null;
        }
        let objectType = objectNode.type;
        let posBeforeParameterEvaluation = this.currentProgram.statements.length;
        let parameterTypes = [];
        // let parameterStatements: Statement[][] = [];
        let positionsAfterParameterStatements = [];
        let allStatements = this.currentProgram.statements;
        if (node.operands != null) {
            // for (let p of node.operands) {
            for (let j = 0; j < node.operands.length; j++) {
                let p = node.operands[j];
                // let programPointer = allStatements.length;
                let typeNode = this.processNode(p);
                // parameterStatements.push(allStatements.splice(programPointer, allStatements.length - programPointer));
                positionsAfterParameterStatements.push(allStatements.length);
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
            // Marker 1
            let srcType = parameterTypes[i];
            // for (let st of parameterStatements[i]) {
            //     this.currentProgram.statements.push(st);
            // }
            let programPosition = allStatements.length;
            if (!this.ensureAutomaticCasting(srcType, destType, node.operands[i].position, node.operands[i])) {
                this.pushError("Der Wert vom Datentyp " + srcType.identifier + " kann nicht als Parameter (Datentyp " + destType.identifier + ") verwendet werden.", node.operands[i].position);
            }
            if (allStatements.length > programPosition) {
                let castingStatements = allStatements.splice(programPosition, allStatements.length - programPosition);
                allStatements.splice(positionsAfterParameterStatements[i], 0, ...castingStatements);
                this.currentProgram.labelManager.correctPositionsAfterInsert(positionsAfterParameterStatements[i], castingStatements.length);
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
        let isSystemMethod = false;
        if (method.isStatic && objectNode.type != null &&
            (objectNode.type instanceof StaticClass)) {
            let classIdentifier = objectNode.type.Klass.identifier;
            switch (classIdentifier) {
                case "Input":
                    this.pushStatements({
                        type: TokenType.callInputMethod,
                        method: method,
                        position: node.position,
                        stepFinished: true,
                        stackframeBegin: -(parameterTypes.length + 1 + stackframeDelta) // this-object followed by parameters
                    });
                    isSystemMethod = true;
                    break;
                case "SystemTools":
                case "Robot":
                    if (["pause", "warten"].indexOf(method.identifier) >= 0) {
                        this.pushStatements([{
                                type: TokenType.setPauseDuration,
                                position: node.position,
                                stepFinished: true
                            }, {
                                type: TokenType.pause,
                                position: node.position,
                                stepFinished: true
                            }
                        ]);
                        isSystemMethod = true;
                    }
                    break;
            }
        }
        if (!isSystemMethod) {
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
                    leftType.type = stringPrimitiveType;
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
                    if (secondType != null && type != secondType.type && type.canCastTo(secondType.type)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29kZUdlbmVyYXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jbGllbnQvY29tcGlsZXIvcGFyc2VyL0NvZGVHZW5lcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFnQixTQUFTLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUMvRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDOUMsT0FBTyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQ2pHLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3ZOLE9BQU8sRUFBRSxTQUFTLEVBQXlCLGFBQWEsRUFBZ0MsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFFcEosT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBR2pELE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUMvQyxPQUFPLEVBQUUsSUFBSSxFQUFZLE1BQU0sa0JBQWtCLENBQUM7QUFVbEQsTUFBTSxPQUFPLGFBQWE7SUFBMUI7UUE4L0JJLHdCQUFtQixHQUE4QixFQUFFLENBQUM7SUFrd0V4RCxDQUFDO0lBenVHRyxxQkFBcUIsQ0FBQyxNQUFjLEVBQUUsV0FBd0IsRUFBRSxXQUF3QixFQUFFLElBQVU7UUFFaEcsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFFckIsSUFBSSxDQUFDLGdC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QUFDLGtCQUFrQixFQUFFLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxTQUFTLENBQUMsMkJBQTJCLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEVycm9yLCBRdWlja0ZpeCwgRXJyb3JMZXZlbCB9IGZyb20gXCIuLi9sZXhlci9MZXhlci5qc1wiO1xyXG5pbXBvcnQgeyBUZXh0UG9zaXRpb24sIFRva2VuVHlwZSwgVG9rZW5UeXBlUmVhZGFibGUgfSBmcm9tIFwiLi4vbGV4ZXIvVG9rZW4uanNcIjtcclxuaW1wb3J0IHsgQXJyYXlUeXBlIH0gZnJvbSBcIi4uL3R5cGVzL0FycmF5LmpzXCI7XHJcbmltcG9ydCB7IEtsYXNzLCBJbnRlcmZhY2UsIFN0YXRpY0NsYXNzLCBWaXNpYmlsaXR5LCBnZXRWaXNpYmlsaXR5VXBUbyB9IGZyb20gXCIuLi90eXBlcy9DbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBib29sZWFuUHJpbWl0aXZlVHlwZSwgY2hhclByaW1pdGl2ZVR5cGUsIGZsb2F0UHJpbWl0aXZlVHlwZSwgaW50UHJpbWl0aXZlVHlwZSwgc3RyaW5nUHJpbWl0aXZlVHlwZSwgb2JqZWN0VHlwZSwgbnVsbFR5cGUsIHZvaWRQcmltaXRpdmVUeXBlLCB2YXJUeXBlLCBkb3VibGVQcmltaXRpdmVUeXBlIH0gZnJvbSBcIi4uL3R5cGVzL1ByaW1pdGl2ZVR5cGVzLmpzXCI7XHJcbmltcG9ydCB7IEF0dHJpYnV0ZSwgVHlwZSwgVmFyaWFibGUsIFZhbHVlLCBQcmltaXRpdmVUeXBlLCBVc2FnZVBvc2l0aW9ucywgTWV0aG9kLCBIZWFwLCBnZXRUeXBlSWRlbnRpZmllciwgUGFyYW1ldGVybGlzdCB9IGZyb20gXCIuLi90eXBlcy9UeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBBU1ROb2RlLCBBdHRyaWJ1dGVEZWNsYXJhdGlvbk5vZGUsIEJpbmFyeU9wTm9kZSwgQ2xhc3NEZWNsYXJhdGlvbk5vZGUsIENvbnN0YW50Tm9kZSwgRG9XaGlsZU5vZGUsIEZvck5vZGUsIElkZW50aWZpZXJOb2RlLCBJZk5vZGUsIEluY3JlbWVudERlY3JlbWVudE5vZGUsIE1ldGhvZGNhbGxOb2RlLCBNZXRob2REZWNsYXJhdGlvbk5vZGUsIE5ld09iamVjdE5vZGUsIFJldHVybk5vZGUsIFNlbGVjdEFycmF5RWxlbWVudE5vZGUsIFNlbGVjdEFycmlidXRlTm9kZSwgU3VwZXJjb25zdHJ1Y3RvckNhbGxOb2RlLCBTdXBlck5vZGUsIFRoaXNOb2RlLCBVbmFyeU9wTm9kZSwgV2hpbGVOb2RlLCBMb2NhbFZhcmlhYmxlRGVjbGFyYXRpb25Ob2RlLCBBcnJheUluaXRpYWxpemF0aW9uTm9kZSwgTmV3QXJyYXlOb2RlLCBQcmludE5vZGUsIENhc3RNYW51YWxseU5vZGUsIEVudW1EZWNsYXJhdGlvbk5vZGUsIFRlcm1Ob2RlLCBTd2l0Y2hOb2RlLCBTY29wZU5vZGUsIFBhcmFtZXRlck5vZGUsIEZvck5vZGVPdmVyQ29sbGVjaW9uLCBDb25zdHJ1Y3RvckNhbGxOb2RlIH0gZnJvbSBcIi4vQVNULmpzXCI7XHJcbmltcG9ydCB7IExhYmVsTWFuYWdlciB9IGZyb20gXCIuL0xhYmVsTWFuYWdlci5qc1wiO1xyXG5pbXBvcnQgeyBNb2R1bGUsIE1vZHVsZVN0b3JlLCBNZXRob2RDYWxsUG9zaXRpb24gfSBmcm9tIFwiLi9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgQXNzaWdubWVudFN0YXRlbWVudCwgSW5pdFN0YWNrZnJhbWVTdGF0ZW1lbnQsIEp1bXBBbHdheXNTdGF0ZW1lbnQsIFByb2dyYW0sIFN0YXRlbWVudCwgQmVnaW5BcnJheVN0YXRlbWVudCwgTmV3T2JqZWN0U3RhdGVtZW50LCBKdW1wT25Td2l0Y2hTdGF0ZW1lbnQsIEJyZWFrcG9pbnQsIEV4dGVuZGVkRm9yTG9vcENoZWNrQ291bnRlckFuZEdldEVsZW1lbnQgfSBmcm9tIFwiLi9Qcm9ncmFtLmpzXCI7XHJcbmltcG9ydCB7IFN5bWJvbFRhYmxlIH0gZnJvbSBcIi4vU3ltYm9sVGFibGUuanNcIjtcclxuaW1wb3J0IHsgRW51bSwgRW51bUluZm8gfSBmcm9tIFwiLi4vdHlwZXMvRW51bS5qc1wiO1xyXG5pbXBvcnQgeyBJbnB1dENsYXNzIH0gZnJvbSBcIi4uLy4uL3J1bnRpbWVsaWJyYXJ5L0lucHV0LmpzXCI7XHJcblxyXG50eXBlIFN0YWNrVHlwZSA9IHtcclxuICAgIHR5cGU6IFR5cGUsXHJcbiAgICBpc0Fzc2lnbmFibGU6IGJvb2xlYW4sXHJcbiAgICBpc1N1cGVyPzogYm9vbGVhbiwgLy8gdXNlZCBmb3IgbWV0aG9kIGNhbGxzIHdpdGggc3VwZXIuXHJcbiAgICB3aXRoUmV0dXJuU3RhdGVtZW50PzogYm9vbGVhblxyXG59O1xyXG5cclxuZXhwb3J0IGNsYXNzIENvZGVHZW5lcmF0b3Ige1xyXG5cclxuICAgIHN0YXRpYyBhc3NpZ25tZW50T3BlcmF0b3JzID0gW1Rva2VuVHlwZS5hc3NpZ25tZW50LCBUb2tlblR5cGUucGx1c0Fzc2lnbm1lbnQsIFRva2VuVHlwZS5taW51c0Fzc2lnbm1lbnQsXHJcbiAgICBUb2tlblR5cGUubXVsdGlwbGljYXRpb25Bc3NpZ25tZW50LCBUb2tlblR5cGUuZGl2aXNpb25Bc3NpZ25tZW50LCBUb2tlblR5cGUuQU5EQXNzaWdtZW50LCBUb2tlblR5cGUuT1JBc3NpZ21lbnQsXHJcbiAgICBUb2tlblR5cGUuWE9SQXNzaWdtZW50LCBUb2tlblR5cGUuc2hpZnRMZWZ0QXNzaWdtZW50LCBUb2tlblR5cGUuc2hpZnRSaWdodEFzc2lnbWVudCwgVG9rZW5UeXBlLnNoaWZ0UmlnaHRVbnNpZ25lZEFzc2lnbWVudF07XHJcblxyXG4gICAgbW9kdWxlU3RvcmU6IE1vZHVsZVN0b3JlO1xyXG4gICAgbW9kdWxlOiBNb2R1bGU7XHJcblxyXG4gICAgc3ltYm9sVGFibGVTdGFjazogU3ltYm9sVGFibGVbXTtcclxuICAgIGN1cnJlbnRTeW1ib2xUYWJsZTogU3ltYm9sVGFibGU7XHJcblxyXG4gICAgaGVhcDogSGVhcDtcclxuXHJcbiAgICBjdXJyZW50UHJvZ3JhbTogUHJvZ3JhbTtcclxuXHJcbiAgICBlcnJvckxpc3Q6IEVycm9yW107XHJcblxyXG4gICAgbmV4dEZyZWVSZWxhdGl2ZVN0YWNrUG9zOiBudW1iZXI7XHJcblxyXG4gICAgYnJlYWtOb2RlU3RhY2s6IEp1bXBBbHdheXNTdGF0ZW1lbnRbXVtdO1xyXG4gICAgY29udGludWVOb2RlU3RhY2s6IEp1bXBBbHdheXNTdGF0ZW1lbnRbXVtdO1xyXG5cclxuICAgIHN0YXJ0QWRob2NDb21waWxhdGlvbihtb2R1bGU6IE1vZHVsZSwgbW9kdWxlU3RvcmU6IE1vZHVsZVN0b3JlLCBzeW1ib2xUYWJsZTogU3ltYm9sVGFibGUsIGhlYXA6IEhlYXApOiBFcnJvcltdIHtcclxuXHJcbiAgICAgICAgdGhpcy5tb2R1bGVTdG9yZSA9IG1vZHVsZVN0b3JlO1xyXG4gICAgICAgIHRoaXMubW9kdWxlID0gbW9kdWxlO1xyXG5cclxuICAgICAgICB0aGlzLnN5bWJvbFRhYmxlU3RhY2sgPSBbXTtcclxuICAgICAgICB0aGlzLnN5bWJvbFRhYmxlU3RhY2sucHVzaChzeW1ib2xUYWJsZSk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50U3ltYm9sVGFibGUgPSBzeW1ib2xUYWJsZTtcclxuXHJcbiAgICAgICAgdGhpcy5oZWFwID0gaGVhcDtcclxuXHJcbiAgICAgICAgbGV0IG9sZFN0YWNrZnJhbWVTaXplID0gc3ltYm9sVGFibGUuc3RhY2tmcmFtZVNpemU7XHJcbiAgICAgICAgdGhpcy5uZXh0RnJlZVJlbGF0aXZlU3RhY2tQb3MgPSBvbGRTdGFja2ZyYW1lU2l6ZTtcclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5lcnJvckxpc3QgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5icmVha05vZGVTdGFjayA9IFtdO1xyXG4gICAgICAgIHRoaXMuY29udGludWVOb2RlU3RhY2sgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5nZW5lcmF0ZU1haW4odHJ1ZSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmVycm9yTGlzdDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnQobW9kdWxlOiBNb2R1bGUsIG1vZHVsZVN0b3JlOiBNb2R1bGVTdG9yZSkge1xyXG5cclxuICAgICAgICB0aGlzLm1vZHVsZVN0b3JlID0gbW9kdWxlU3RvcmU7XHJcbiAgICAgICAgdGhpcy5tb2R1bGUgPSBtb2R1bGU7XHJcblxyXG4gICAgICAgIHRoaXMuc3ltYm9sVGFibGVTdGFjayA9IFtdO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlID0gbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbSA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5lcnJvckxpc3QgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0RnJlZVJlbGF0aXZlU3RhY2tQb3MgPSAwO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5tb2R1bGUudG9rZW5MaXN0Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgbGV0IGxhc3RUb2tlbiA9IHRoaXMubW9kdWxlLnRva2VuTGlzdFt0aGlzLm1vZHVsZS50b2tlbkxpc3QubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgICAgIHRoaXMubW9kdWxlLm1haW5TeW1ib2xUYWJsZS5wb3NpdGlvblRvID0geyBsaW5lOiBsYXN0VG9rZW4ucG9zaXRpb24ubGluZSwgY29sdW1uOiBsYXN0VG9rZW4ucG9zaXRpb24uY29sdW1uICsgMSwgbGVuZ3RoOiAxIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN5bWJvbFRhYmxlU3RhY2sucHVzaCh0aGlzLm1vZHVsZS5tYWluU3ltYm9sVGFibGUpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlID0gdGhpcy5tb2R1bGUubWFpblN5bWJvbFRhYmxlO1xyXG5cclxuICAgICAgICB0aGlzLmJyZWFrTm9kZVN0YWNrID0gW107XHJcbiAgICAgICAgdGhpcy5jb250aW51ZU5vZGVTdGFjayA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmdlbmVyYXRlTWFpbigpO1xyXG5cclxuICAgICAgICB0aGlzLmdlbmVyYXRlQ2xhc3NlcygpO1xyXG5cclxuICAgICAgICB0aGlzLmxvb2tGb3JTdGF0aWNWb2lkTWFpbigpO1xyXG5cclxuICAgICAgICB0aGlzLm1vZHVsZS5lcnJvcnNbM10gPSB0aGlzLmVycm9yTGlzdDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgbG9va0ZvclN0YXRpY1ZvaWRNYWluKCkge1xyXG5cclxuICAgICAgICBsZXQgbWFpblByb2dyYW0gPSB0aGlzLm1vZHVsZS5tYWluUHJvZ3JhbTtcclxuXHJcbiAgICAgICAgaWYgKG1haW5Qcm9ncmFtICE9IG51bGwgJiYgbWFpblByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGggPiAyKSByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBtYWluTWV0aG9kOiBNZXRob2QgPSBudWxsO1xyXG4gICAgICAgIGxldCBzdGF0aWNDbGFzczogU3RhdGljQ2xhc3MgPSBudWxsO1xyXG4gICAgICAgIGxldCBjbGFzc05vZGUxOiBBU1ROb2RlO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjbGFzc05vZGUgb2YgdGhpcy5tb2R1bGUuY2xhc3NEZWZpbml0aW9uc0FTVCkge1xyXG4gICAgICAgICAgICBpZiAoY2xhc3NOb2RlLnR5cGUgPT0gVG9rZW5UeXBlLmtleXdvcmRDbGFzcykge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBjdCA9IGNsYXNzTm9kZS5yZXNvbHZlZFR5cGU7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbSBvZiBjdC5zdGF0aWNDbGFzcy5tZXRob2RzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG0uaWRlbnRpZmllciA9PSBcIm1haW5cIiAmJiBtLnBhcmFtZXRlcmxpc3QucGFyYW1ldGVycy5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHQgPSBtLnBhcmFtZXRlcmxpc3QucGFyYW1ldGVyc1swXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHB0LnR5cGUgaW5zdGFuY2VvZiBBcnJheVR5cGUgJiYgcHQudHlwZS5hcnJheU9mVHlwZSA9PSBzdHJpbmdQcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWFpbk1ldGhvZCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJFcyBleGlzdGllcmVuIG1laHJlcmUgS2xhc3NlbiBtaXQgc3RhdGlzY2hlbiBtYWluLU1ldGhvZGVuLlwiLCBjbGFzc05vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYWluTWV0aG9kID0gbTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0aWNDbGFzcyA9IGN0LnN0YXRpY0NsYXNzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTm9kZTEgPSBjbGFzc05vZGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtYWluTWV0aG9kICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBwb3NpdGlvbjogVGV4dFBvc2l0aW9uID0gbWFpbk1ldGhvZC51c2FnZVBvc2l0aW9uc1swXTtcclxuICAgICAgICAgICAgaWYgKG1haW5NZXRob2QucHJvZ3JhbSAhPSBudWxsICYmIG1haW5NZXRob2QucHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gbWFpbk1ldGhvZC5wcm9ncmFtLnN0YXRlbWVudHNbMF0ucG9zaXRpb247XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuaW5pdEN1cnJlbnRQcm9ncmFtKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1vZHVsZS5tYWluUHJvZ3JhbSA9IHRoaXMuY3VycmVudFByb2dyYW07XHJcblxyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKFt7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2FsbE1haW5NZXRob2QsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBtYWluTWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgc3RhdGljQ2xhc3M6IHN0YXRpY0NsYXNzXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5jbG9zZVN0YWNrZnJhbWUsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbWFpbk1ldGhvZC51c2FnZVBvc2l0aW9ucy5nZXQodGhpcy5tb2R1bGUpWzBdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXSwgZmFsc2UpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlQ2xhc3NlcygpIHtcclxuICAgICAgICBpZiAodGhpcy5tb2R1bGUuY2xhc3NEZWZpbml0aW9uc0FTVCA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGZvciAobGV0IGNsYXNzTm9kZSBvZiB0aGlzLm1vZHVsZS5jbGFzc0RlZmluaXRpb25zQVNUKSB7XHJcbiAgICAgICAgICAgIGlmIChjbGFzc05vZGUudHlwZSA9PSBUb2tlblR5cGUua2V5d29yZENsYXNzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlQ2xhc3MoY2xhc3NOb2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoY2xhc3NOb2RlLnR5cGUgPT0gVG9rZW5UeXBlLmtleXdvcmRFbnVtKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlRW51bShjbGFzc05vZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChjbGFzc05vZGUudHlwZSA9PSBUb2tlblR5cGUua2V5d29yZEludGVyZmFjZSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGludGVyZiA9IGNsYXNzTm9kZS5yZXNvbHZlZFR5cGU7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW50ZXJmICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoZWNrRG91YmxlTWV0aG9kRGVjbGFyYXRpb24oaW50ZXJmKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlRW51bShlbnVtTm9kZTogRW51bURlY2xhcmF0aW9uTm9kZSkge1xyXG5cclxuICAgICAgICBpZiAoZW51bU5vZGUucmVzb2x2ZWRUeXBlID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5wdXNoTmV3U3ltYm9sVGFibGUoZmFsc2UsIGVudW1Ob2RlLnNjb3BlRnJvbSwgZW51bU5vZGUuc2NvcGVUbyk7XHJcblxyXG4gICAgICAgIGxldCBlbnVtQ2xhc3MgPSA8RW51bT5lbnVtTm9kZS5yZXNvbHZlZFR5cGU7XHJcblxyXG4gICAgICAgIC8vIHRoaXMucHVzaFVzYWdlUG9zaXRpb24oZW51bU5vZGUucG9zaXRpb24sIGVudW1DbGFzcyk7XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dCA9IGVudW1DbGFzcztcclxuICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtID0gZW51bUNsYXNzLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYXR0cmlidXRlIG9mIGVudW1Ob2RlLmF0dHJpYnV0ZXMpIHtcclxuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZSAhPSBudWxsICYmICFhdHRyaWJ1dGUuaXNTdGF0aWMgJiYgYXR0cmlidXRlLmluaXRpYWxpemF0aW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZUF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZW51bUNsYXNzLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucmV0dXJuLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHRoaXMubGFzdFN0YXRlbWVudC5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIGNvcHlSZXR1cm5WYWx1ZVRvU3RhY2tmcmFtZVBvczA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGxlYXZlVGhpc09iamVjdE9uU3RhY2s6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXIucmVzb2x2ZU5vZGVzKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IG1ldGhvZE5vZGUgb2YgZW51bU5vZGUubWV0aG9kcykge1xyXG4gICAgICAgICAgICBpZiAobWV0aG9kTm9kZSAhPSBudWxsICYmICFtZXRob2ROb2RlLmlzQWJzdHJhY3QgJiYgIW1ldGhvZE5vZGUuaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29tcGlsZU1ldGhvZChtZXRob2ROb2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wb3BTeW1ib2xUYWJsZShudWxsKTtcclxuXHJcbiAgICAgICAgLy8gY29uc3RydWN0b3IgY2FsbHNcclxuICAgICAgICB0aGlzLnB1c2hOZXdTeW1ib2xUYWJsZShmYWxzZSwgZW51bU5vZGUuc2NvcGVGcm9tLCBlbnVtTm9kZS5zY29wZVRvKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgZW51bVZhbHVlTm9kZSBvZiBlbnVtTm9kZS52YWx1ZXMpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChlbnVtVmFsdWVOb2RlLmNvbnN0cnVjdG9yUGFyYW1ldGVycyAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHA6IFByb2dyYW0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlOiB0aGlzLm1vZHVsZSxcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbE1hbmFnZXI6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVtZW50czogW11cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtID0gcDtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaEVudW1WYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogZW51bVZhbHVlTm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBlbnVtQ2xhc3M6IGVudW1DbGFzcyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZUlkZW50aWZpZXI6IGVudW1WYWx1ZU5vZGUuaWRlbnRpZmllclxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzRW51bUNvbnN0cnVjdG9yQ2FsbChlbnVtQ2xhc3MsIGVudW1WYWx1ZU5vZGUuY29uc3RydWN0b3JQYXJhbWV0ZXJzLFxyXG4gICAgICAgICAgICAgICAgICAgIGVudW1WYWx1ZU5vZGUucG9zaXRpb24sIGVudW1WYWx1ZU5vZGUuY29tbWFQb3NpdGlvbnMsIGVudW1WYWx1ZU5vZGUucmlnaHRCcmFja2V0UG9zaXRpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wcm9ncmFtRW5kLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBlbnVtVmFsdWVOb2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGVudW1JbmZvOiBFbnVtSW5mbyA9IGVudW1DbGFzcy5pZGVudGlmaWVyVG9JbmZvTWFwW2VudW1WYWx1ZU5vZGUuaWRlbnRpZmllcl07XHJcbiAgICAgICAgICAgICAgICBlbnVtSW5mby5jb25zdHJ1Y3RvckNhbGxQcm9ncmFtID0gcDtcclxuICAgICAgICAgICAgICAgIGVudW1JbmZvLnBvc2l0aW9uID0gZW51bVZhbHVlTm9kZS5wb3NpdGlvbjtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnBvcFN5bWJvbFRhYmxlKG51bGwpO1xyXG5cclxuXHJcbiAgICAgICAgLy8gc3RhdGljIGF0dHJpYnV0ZXMvbWV0aG9kc1xyXG4gICAgICAgIHRoaXMucHVzaE5ld1N5bWJvbFRhYmxlKGZhbHNlLCBlbnVtTm9kZS5zY29wZUZyb20sIGVudW1Ob2RlLnNjb3BlVG8pO1xyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZS5jbGFzc0NvbnRleHQgPSBlbnVtQ2xhc3Muc3RhdGljQ2xhc3M7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbSA9IGVudW1DbGFzcy5zdGF0aWNDbGFzcy5hdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW07XHJcblxyXG4gICAgICAgIGZvciAobGV0IGF0dHJpYnV0ZSBvZiBlbnVtTm9kZS5hdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChhdHRyaWJ1dGUgIT0gbnVsbCAmJiBhdHRyaWJ1dGUuaXNTdGF0aWMgJiYgYXR0cmlidXRlLmluaXRpYWxpemF0aW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZUF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtLmxhYmVsTWFuYWdlci5yZXNvbHZlTm9kZXMoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbWV0aG9kTm9kZSBvZiBlbnVtTm9kZS5tZXRob2RzKSB7XHJcbiAgICAgICAgICAgIGlmIChtZXRob2ROb2RlICE9IG51bGwgJiYgbWV0aG9kTm9kZS5pc1N0YXRpYykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21waWxlTWV0aG9kKG1ldGhvZE5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY2hlY2tEb3VibGVNZXRob2REZWNsYXJhdGlvbihlbnVtQ2xhc3MpO1xyXG5cclxuICAgICAgICB0aGlzLnBvcFN5bWJvbFRhYmxlKG51bGwpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzRW51bUNvbnN0cnVjdG9yQ2FsbChlbnVtQ2xhc3M6IEVudW0sIHBhcmFtZXRlck5vZGVzOiBUZXJtTm9kZVtdLFxyXG4gICAgICAgIHBvc2l0aW9uOiBUZXh0UG9zaXRpb24sIGNvbW1hUG9zaXRpb25zOiBUZXh0UG9zaXRpb25bXSwgcmlnaHRCcmFja2V0UG9zaXRpb246IFRleHRQb3NpdGlvbikge1xyXG4gICAgICAgIGxldCBwYXJhbWV0ZXJUeXBlczogVHlwZVtdID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IHAgb2YgcGFyYW1ldGVyTm9kZXMpIHtcclxuICAgICAgICAgICAgbGV0IHR5cGVOb2RlID0gdGhpcy5wcm9jZXNzTm9kZShwKTtcclxuICAgICAgICAgICAgaWYgKHR5cGVOb2RlID09IG51bGwpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBwYXJhbWV0ZXJUeXBlcy5wdXNoKHR5cGVOb2RlLnR5cGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IG1ldGhvZHMgPSBlbnVtQ2xhc3MuZ2V0TWV0aG9kc1RoYXRGaXRXaXRoQ2FzdGluZyhlbnVtQ2xhc3MuaWRlbnRpZmllcixcclxuICAgICAgICAgICAgcGFyYW1ldGVyVHlwZXMsIHRydWUsIFZpc2liaWxpdHkucHJpdmF0ZSk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kdWxlLnB1c2hNZXRob2RDYWxsUG9zaXRpb24ocG9zaXRpb24sIGNvbW1hUG9zaXRpb25zLCBlbnVtQ2xhc3MuZ2V0TWV0aG9kcyhWaXNpYmlsaXR5LnByaXZhdGUsIGVudW1DbGFzcy5pZGVudGlmaWVyKSwgcmlnaHRCcmFja2V0UG9zaXRpb24pO1xyXG5cclxuXHJcbiAgICAgICAgaWYgKG1ldGhvZHMuZXJyb3IgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihtZXRob2RzLmVycm9yLCBwb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGlzQXNzaWduYWJsZTogZmFsc2UgfTsgLy8gdHJ5IHRvIGNvbnRpbnVlLi4uXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbWV0aG9kID0gbWV0aG9kcy5tZXRob2RMaXN0WzBdO1xyXG5cclxuICAgICAgICBsZXQgZGVzdFR5cGU6IFR5cGUgPSBudWxsO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyYW1ldGVyVHlwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGkgPCBtZXRob2QuZ2V0UGFyYW1ldGVyQ291bnQoKSkgeyAgLy8gcG9zc2libGUgZWxsaXBzaXMhXHJcbiAgICAgICAgICAgICAgICBkZXN0VHlwZSA9IG1ldGhvZC5nZXRQYXJhbWV0ZXJUeXBlKGkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gbWV0aG9kLmdldFBhcmFtZXRlckNvdW50KCkgLSAxICYmIG1ldGhvZC5oYXNFbGxpcHNpcygpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVzdFR5cGUgPSAoPEFycmF5VHlwZT5kZXN0VHlwZSkuYXJyYXlPZlR5cGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBzcmNUeXBlID0gcGFyYW1ldGVyVHlwZXNbaV07XHJcbiAgICAgICAgICAgIGlmICghc3JjVHlwZS5lcXVhbHMoZGVzdFR5cGUpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNyY1R5cGUgaW5zdGFuY2VvZiBQcmltaXRpdmVUeXBlICYmIGRlc3RUeXBlIGluc3RhbmNlb2YgUHJpbWl0aXZlVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzcmNUeXBlLmdldENhc3RJbmZvcm1hdGlvbihkZXN0VHlwZSkubmVlZHNTdGF0ZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2FzdFZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdUeXBlOiBkZXN0VHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrUG9zUmVsYXRpdmU6IC1wYXJhbWV0ZXJUeXBlcy5sZW5ndGggKyAxICsgaVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc3RhY2tmcmFtZURlbHRhID0gMDtcclxuICAgICAgICBpZiAobWV0aG9kLmhhc0VsbGlwc2lzKCkpIHtcclxuICAgICAgICAgICAgbGV0IGVsbGlwc2lzUGFyYW1ldGVyQ291bnQgPSBwYXJhbWV0ZXJUeXBlcy5sZW5ndGggLSBtZXRob2QuZ2V0UGFyYW1ldGVyQ291bnQoKSArIDE7IC8vIGxhc3QgcGFyYW1ldGVyIGFuZCBzdWJzZXF1ZW50IG9uZXNcclxuICAgICAgICAgICAgc3RhY2tmcmFtZURlbHRhID0gLSAoZWxsaXBzaXNQYXJhbWV0ZXJDb3VudCAtIDEpO1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5tYWtlRWxsaXBzaXNBcnJheSxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwYXJhbWV0ZXJOb2Rlc1ttZXRob2QuZ2V0UGFyYW1ldGVyQ291bnQoKSAtIDFdLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgcGFyYW1ldGVyQ291bnQ6IGVsbGlwc2lzUGFyYW1ldGVyQ291bnQsXHJcbiAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgYXJyYXlUeXBlOiBtZXRob2QuZ2V0UGFyYW1ldGVyKG1ldGhvZC5nZXRQYXJhbWV0ZXJDb3VudCgpIC0gMSkudHlwZVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5jYWxsTWV0aG9kLFxyXG4gICAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcclxuICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICBzdGVwRmluaXNoZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIGlzU3VwZXJDYWxsOiBmYWxzZSxcclxuICAgICAgICAgICAgc3RhY2tmcmFtZUJlZ2luOiAtKHBhcmFtZXRlclR5cGVzLmxlbmd0aCArIDEgKyBzdGFja2ZyYW1lRGVsdGEpIC8vIHRoaXMtb2JqZWN0IGZvbGxvd2VkIGJ5IHBhcmFtZXRlcnNcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZUNsYXNzKGNsYXNzTm9kZTogQ2xhc3NEZWNsYXJhdGlvbk5vZGUpIHtcclxuXHJcbiAgICAgICAgaWYgKGNsYXNzTm9kZS5yZXNvbHZlZFR5cGUgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLnB1c2hOZXdTeW1ib2xUYWJsZShmYWxzZSwgY2xhc3NOb2RlLnNjb3BlRnJvbSwgY2xhc3NOb2RlLnNjb3BlVG8pO1xyXG5cclxuICAgICAgICBsZXQga2xhc3MgPSA8S2xhc3M+Y2xhc3NOb2RlLnJlc29sdmVkVHlwZTtcclxuXHJcbiAgICAgICAgLy90aGlzLnB1c2hVc2FnZVBvc2l0aW9uKGNsYXNzTm9kZS5wb3NpdGlvbiwga2xhc3MpO1xyXG5cclxuICAgICAgICBsZXQgaW5oZXJpdGFuY2VFcnJvciA9IGtsYXNzLmNoZWNrSW5oZXJpdGFuY2UoKTtcclxuXHJcbiAgICAgICAgaWYgKGluaGVyaXRhbmNlRXJyb3IubWVzc2FnZSAhPSBcIlwiKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKGluaGVyaXRhbmNlRXJyb3IubWVzc2FnZSwgY2xhc3NOb2RlLnBvc2l0aW9uLCBcImVycm9yXCIsIHRoaXMuZ2V0SW5oZXJpdGFuY2VRdWlja0ZpeChjbGFzc05vZGUuc2NvcGVUbywgaW5oZXJpdGFuY2VFcnJvcikpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGJhc2VDbGFzcyA9IGtsYXNzLmJhc2VDbGFzcztcclxuICAgICAgICBpZiAoYmFzZUNsYXNzICE9IG51bGwgJiYgYmFzZUNsYXNzLm1vZHVsZSAhPSBrbGFzcy5tb2R1bGUgJiYgYmFzZUNsYXNzLnZpc2liaWxpdHkgPT0gVmlzaWJpbGl0eS5wcml2YXRlKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIEJhc2lza2xhc3NlIFwiICsgYmFzZUNsYXNzLmlkZW50aWZpZXIgKyBcIiBkZXIgS2xhc3NlIFwiICsga2xhc3MuaWRlbnRpZmllciArIFwiIGlzdCBoaWVyIG5pY2h0IHNpY2h0YmFyLlwiLCBjbGFzc05vZGUucG9zaXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50U3ltYm9sVGFibGUuY2xhc3NDb250ZXh0ID0ga2xhc3M7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbSA9IGtsYXNzLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYXR0cmlidXRlIG9mIGNsYXNzTm9kZS5hdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChhdHRyaWJ1dGUgIT0gbnVsbCAmJiAhYXR0cmlidXRlLmlzU3RhdGljICYmIGF0dHJpYnV0ZS5pbml0aWFsaXphdGlvbiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRpYWxpemVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGtsYXNzLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucmV0dXJuLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHRoaXMubGFzdFN0YXRlbWVudC5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIGNvcHlSZXR1cm5WYWx1ZVRvU3RhY2tmcmFtZVBvczA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGxlYXZlVGhpc09iamVjdE9uU3RhY2s6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXIucmVzb2x2ZU5vZGVzKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IG1ldGhvZE5vZGUgb2YgY2xhc3NOb2RlLm1ldGhvZHMpIHtcclxuICAgICAgICAgICAgaWYgKG1ldGhvZE5vZGUgIT0gbnVsbCAmJiAhbWV0aG9kTm9kZS5pc0Fic3RyYWN0ICYmICFtZXRob2ROb2RlLmlzU3RhdGljKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBpbGVNZXRob2QobWV0aG9kTm9kZSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgbTogTWV0aG9kID0gbWV0aG9kTm9kZS5yZXNvbHZlZFR5cGU7XHJcbiAgICAgICAgICAgICAgICBpZiAobSAhPSBudWxsICYmIG0uYW5ub3RhdGlvbiA9PSBcIkBPdmVycmlkZVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtsYXNzLmJhc2VDbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrbGFzcy5iYXNlQ2xhc3MuZ2V0TWV0aG9kQnlTaWduYXR1cmUobS5zaWduYXR1cmUpID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIE1ldGhvZGUgXCIgKyBtLnNpZ25hdHVyZSArIFwiIGlzdCBtaXQgQE92ZXJyaWRlIGFubm90aWVydCwgw7xiZXJzY2hyZWlidCBhYmVyIGtlaW5lIE1ldGhvZGUgZ2xlaWNoZXIgU2lnbmF0dXIgZWluZXIgT2JlcmtsYXNzZS5cIiwgbWV0aG9kTm9kZS5wb3NpdGlvbiwgXCJ3YXJuaW5nXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jaGVja0RvdWJsZU1ldGhvZERlY2xhcmF0aW9uKGtsYXNzKTtcclxuXHJcbiAgICAgICAgdGhpcy5wb3BTeW1ib2xUYWJsZShudWxsKTtcclxuXHJcbiAgICAgICAgLy8gc3RhdGljIGF0dHJpYnV0ZXMvbWV0aG9kc1xyXG4gICAgICAgIHRoaXMucHVzaE5ld1N5bWJvbFRhYmxlKGZhbHNlLCBjbGFzc05vZGUuc2NvcGVGcm9tLCBjbGFzc05vZGUuc2NvcGVUbyk7XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dCA9IGtsYXNzLnN0YXRpY0NsYXNzO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0gPSBrbGFzcy5zdGF0aWNDbGFzcy5hdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW07XHJcblxyXG4gICAgICAgIGZvciAobGV0IGF0dHJpYnV0ZSBvZiBjbGFzc05vZGUuYXR0cmlidXRlcykge1xyXG4gICAgICAgICAgICBpZiAoYXR0cmlidXRlICE9IG51bGwgJiYgYXR0cmlidXRlLmlzU3RhdGljICYmIGF0dHJpYnV0ZS5pbml0aWFsaXphdGlvbiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRpYWxpemVBdHRyaWJ1dGUoYXR0cmlidXRlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGtsYXNzLnN0YXRpY0NsYXNzLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucmV0dXJuLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHRoaXMubGFzdFN0YXRlbWVudC5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIGNvcHlSZXR1cm5WYWx1ZVRvU3RhY2tmcmFtZVBvczA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGxlYXZlVGhpc09iamVjdE9uU3RhY2s6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXIucmVzb2x2ZU5vZGVzKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IG1ldGhvZE5vZGUgb2YgY2xhc3NOb2RlLm1ldGhvZHMpIHtcclxuICAgICAgICAgICAgaWYgKG1ldGhvZE5vZGUgIT0gbnVsbCAmJiBtZXRob2ROb2RlLmlzU3RhdGljKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBpbGVNZXRob2QobWV0aG9kTm9kZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucG9wU3ltYm9sVGFibGUobnVsbCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNoZWNrRG91YmxlTWV0aG9kRGVjbGFyYXRpb24oY2llOiBLbGFzcyB8IEludGVyZmFjZSkgeyAgLy8gTi5CLjogRW51bSBleHRlbmRzIEtsYXNzXHJcblxyXG4gICAgICAgIGxldCBzaWduYXR1cmVNYXA6IHsgW2tleTogc3RyaW5nXTogTWV0aG9kIH0gPSB7fTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbSBvZiBjaWUubWV0aG9kcykge1xyXG5cclxuICAgICAgICAgICAgbGV0IHNpZ25hdHVyZSA9IG0uZ2V0U2lnbmF0dXJlV2l0aFJldHVyblBhcmFtZXRlcigpO1xyXG4gICAgICAgICAgICBpZiAoc2lnbmF0dXJlTWFwW3NpZ25hdHVyZV0gIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBjaWVUeXBlOiBTdHJpbmcgPSBcIkluIGRlciBLbGFzc2UgXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2llIGluc3RhbmNlb2YgSW50ZXJmYWNlKSBjaWVUeXBlID0gXCJJbSBJbnRlcmZhY2UgXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2llIGluc3RhbmNlb2YgRW51bSkgY2llVHlwZSA9IFwiSW0gRW51bSBcIjtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihjaWVUeXBlICsgY2llLmlkZW50aWZpZXIgKyBcIiBnaWJ0IGVzIHp3ZWkgTWV0aG9kZW4gbWl0IGRlcnNlbGJlbiBTaWduYXR1cjogXCIgKyBzaWduYXR1cmUsIG0udXNhZ2VQb3NpdGlvbnMuZ2V0KHRoaXMubW9kdWxlKVswXSwgXCJlcnJvclwiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKGNpZVR5cGUgKyBjaWUuaWRlbnRpZmllciArIFwiIGdpYnQgZXMgendlaSBNZXRob2RlbiBtaXQgZGVyc2VsYmVuIFNpZ25hdHVyOiBcIiArIHNpZ25hdHVyZSwgc2lnbmF0dXJlTWFwW3NpZ25hdHVyZV0udXNhZ2VQb3NpdGlvbnMuZ2V0KHRoaXMubW9kdWxlKVswXSwgXCJlcnJvclwiKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzaWduYXR1cmVNYXBbc2lnbmF0dXJlXSA9IG07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXRJbmhlcml0YW5jZVF1aWNrRml4KHBvc2l0aW9uOiBUZXh0UG9zaXRpb24sIGluaGVyaXRhbmNlRXJyb3I6IHsgbWVzc2FnZTogc3RyaW5nOyBtaXNzaW5nTWV0aG9kczogTWV0aG9kW107IH0pOiBRdWlja0ZpeCB7XHJcblxyXG4gICAgICAgIGxldCBzOiBzdHJpbmcgPSBcIlwiO1xyXG4gICAgICAgIGZvciAobGV0IG0gb2YgaW5oZXJpdGFuY2VFcnJvci5taXNzaW5nTWV0aG9kcykge1xyXG4gICAgICAgICAgICBzICs9IFwiXFx0cHVibGljIFwiICsgKG0ucmV0dXJuVHlwZSA9PSBudWxsID8gXCIgdm9pZFwiIDogZ2V0VHlwZUlkZW50aWZpZXIobS5yZXR1cm5UeXBlKSkgKyBcIiBcIiArIG0uaWRlbnRpZmllciArIFwiKFwiO1xyXG4gICAgICAgICAgICBzICs9IG0ucGFyYW1ldGVybGlzdC5wYXJhbWV0ZXJzLm1hcChwID0+IGdldFR5cGVJZGVudGlmaWVyKHAudHlwZSkgKyBcIiBcIiArIHAuaWRlbnRpZmllcikuam9pbihcIiwgXCIpO1xyXG4gICAgICAgICAgICBzICs9IFwiKSB7XFxuXFx0XFx0Ly9UT0RPOiBNZXRob2RlIGbDvGxsZW5cXG5cXHR9XFxuXFxuXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJGZWhsZW5kZSBNZXRob2RlbiBlaW5mw7xnZW5cIixcclxuICAgICAgICAgICAgZWRpdHNQcm92aWRlcjogKHVyaSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlOiB1cmksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlOiB7IHN0YXJ0TGluZU51bWJlcjogcG9zaXRpb24ubGluZSwgc3RhcnRDb2x1bW46IHBvc2l0aW9uLmNvbHVtbiAtIDEsIGVuZExpbmVOdW1iZXI6IHBvc2l0aW9uLmxpbmUsIGVuZENvbHVtbjogcG9zaXRpb24uY29sdW1uIC0gMSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0U3VwZXJjb25zdHJ1Y3RvckNhbGxzKG5vZGVzOiBBU1ROb2RlW10sIHN1cGVyY29uc3RydWN0b3JDYWxsc0ZvdW5kOiBBU1ROb2RlW10sIGlzRmlyc3RTdGF0ZW1lbnQ6IGJvb2xlYW4pOiBib29sZWFuIHtcclxuICAgICAgICBmb3IgKGxldCBub2RlIG9mIG5vZGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChub2RlID09IG51bGwpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBpZiAobm9kZS50eXBlID09IFRva2VuVHlwZS5zdXBlckNvbnN0cnVjdG9yQ2FsbCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghaXNGaXJzdFN0YXRlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdXBlcmNvbnN0cnVjdG9yQ2FsbHNGb3VuZC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRWluIEtvbnN0cnVrdG9yIGRhcmYgbnVyIGVpbmVuIGVpbnppZ2VuIEF1ZnJ1ZiBkZXMgU3VwZXJrb25zdHJ1a3RvcnMgZW50aGFsdGVuLlwiLCBub2RlLnBvc2l0aW9uLCBcImVycm9yXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiVm9yIGRlbSBBdWZydWYgZGVzIFN1cGVya29uc3RydWt0b3JzIGRhcmYga2VpbmUgYW5kZXJlIEFud2Vpc3VuZyBzdGVoZW4uXCIsIG5vZGUucG9zaXRpb24sIFwiZXJyb3JcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHN1cGVyY29uc3RydWN0b3JDYWxsc0ZvdW5kLnB1c2gobm9kZSk7XHJcbiAgICAgICAgICAgICAgICBpc0ZpcnN0U3RhdGVtZW50ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobm9kZS50eXBlID09IFRva2VuVHlwZS5zY29wZU5vZGUgJiYgbm9kZS5zdGF0ZW1lbnRzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGlzRmlyc3RTdGF0ZW1lbnQgPSBpc0ZpcnN0U3RhdGVtZW50ICYmIHRoaXMuZ2V0U3VwZXJjb25zdHJ1Y3RvckNhbGxzKG5vZGUuc3RhdGVtZW50cywgc3VwZXJjb25zdHJ1Y3RvckNhbGxzRm91bmQsIGlzRmlyc3RTdGF0ZW1lbnQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaXNGaXJzdFN0YXRlbWVudCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBpc0ZpcnN0U3RhdGVtZW50O1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBjb21waWxlTWV0aG9kKG1ldGhvZE5vZGU6IE1ldGhvZERlY2xhcmF0aW9uTm9kZSkge1xyXG4gICAgICAgIC8vIEFzc3VtcHRpb246IG1ldGhvZE5vZGUgIT0gbnVsbFxyXG4gICAgICAgIGxldCBtZXRob2QgPSBtZXRob2ROb2RlLnJlc29sdmVkVHlwZTtcclxuXHJcbiAgICAgICAgdGhpcy5jaGVja0lmTWV0aG9kSXNWaXJ0dWFsKG1ldGhvZCk7XHJcblxyXG4gICAgICAgIGlmIChtZXRob2QgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyB0aGlzLnB1c2hVc2FnZVBvc2l0aW9uKG1ldGhvZE5vZGUucG9zaXRpb24sIG1ldGhvZCk7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdEN1cnJlbnRQcm9ncmFtKCk7XHJcbiAgICAgICAgbWV0aG9kLnByb2dyYW0gPSB0aGlzLmN1cnJlbnRQcm9ncmFtO1xyXG5cclxuICAgICAgICB0aGlzLnB1c2hOZXdTeW1ib2xUYWJsZShmYWxzZSwgbWV0aG9kTm9kZS5zY29wZUZyb20sIG1ldGhvZE5vZGUuc2NvcGVUbyk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50U3ltYm9sVGFibGUubWV0aG9kID0gbWV0aG9kO1xyXG5cclxuICAgICAgICBsZXQgc3RhY2tQb3M6IG51bWJlciA9IDE7XHJcblxyXG4gICAgICAgIGZvciAobGV0IHYgb2YgbWV0aG9kLmdldFBhcmFtZXRlckxpc3QoKS5wYXJhbWV0ZXJzKSB7XHJcbiAgICAgICAgICAgIHYuc3RhY2tQb3MgPSBzdGFja1BvcysrO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50U3ltYm9sVGFibGUudmFyaWFibGVNYXAuc2V0KHYuaWRlbnRpZmllciwgdik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBcIiArIDFcIiBpcyBmb3IgXCJ0aGlzXCItb2JqZWN0XHJcbiAgICAgICAgdGhpcy5uZXh0RnJlZVJlbGF0aXZlU3RhY2tQb3MgPSBtZXRob2ROb2RlLnBhcmFtZXRlcnMubGVuZ3RoICsgMTtcclxuXHJcbiAgICAgICAgaWYgKG1ldGhvZC5pc0NvbnN0cnVjdG9yICYmIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dCBpbnN0YW5jZW9mIEtsYXNzICYmIG1ldGhvZE5vZGUuc3RhdGVtZW50cyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxldCBjOiBLbGFzcyA9IHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dDtcclxuXHJcbiAgICAgICAgICAgIGxldCBzdXBlcmNvbnN0cnVjdG9yQ2FsbHM6IEFTVE5vZGVbXSA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLmdldFN1cGVyY29uc3RydWN0b3JDYWxscyhtZXRob2ROb2RlLnN0YXRlbWVudHMsIHN1cGVyY29uc3RydWN0b3JDYWxscywgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgc3VwZXJjb25zdHJ1Y3RvckNhbGxFbnN1cmVkOiBib29sZWFuID0gc3VwZXJjb25zdHJ1Y3RvckNhbGxzLmxlbmd0aCA+IDA7XHJcblxyXG4gICAgICAgICAgICAvLyBpZiAobWV0aG9kTm9kZS5zdGF0ZW1lbnRzLmxlbmd0aCA+IDAgJiYgbWV0aG9kTm9kZS5zdGF0ZW1lbnRzWzBdLnR5cGUgPT0gVG9rZW5UeXBlLnNjb3BlTm9kZSkge1xyXG4gICAgICAgICAgICAvLyAgICAgbGV0IHN0bSA9IG1ldGhvZE5vZGUuc3RhdGVtZW50c1swXS5zdGF0ZW1lbnRzO1xyXG4gICAgICAgICAgICAvLyAgICAgaWYgKHN0bS5sZW5ndGggPiAwICYmIFtUb2tlblR5cGUuc3VwZXJDb25zdHJ1Y3RvckNhbGwsIFRva2VuVHlwZS5jb25zdHJ1Y3RvckNhbGxdLmluZGV4T2Yoc3RtWzBdLnR5cGUpID49IDApIHtcclxuICAgICAgICAgICAgLy8gICAgICAgICBzdXBlcmNvbnN0cnVjdG9yQ2FsbEVuc3VyZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAvLyB9IGVsc2UgaWYgKFtUb2tlblR5cGUuc3VwZXJDb25zdHJ1Y3RvckNhbGwsIFRva2VuVHlwZS5jb25zdHJ1Y3RvckNhbGxdLmluZGV4T2YobWV0aG9kTm9kZS5zdGF0ZW1lbnRzWzBdLnR5cGUpID49IDApIHtcclxuICAgICAgICAgICAgLy8gICAgIHN1cGVyY29uc3RydWN0b3JDYWxsRW5zdXJlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChjICE9IG51bGwgJiYgYy5iYXNlQ2xhc3M/Lmhhc0NvbnN0cnVjdG9yKCkgJiYgIWMuYmFzZUNsYXNzPy5oYXNQYXJhbWV0ZXJsZXNzQ29uc3RydWN0b3IoKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGVycm9yOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBpZiAobWV0aG9kTm9kZS5zdGF0ZW1lbnRzID09IG51bGwgfHwgbWV0aG9kTm9kZS5zdGF0ZW1lbnRzLmxlbmd0aCA9PSAwKSBlcnJvciA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3IgPSAhc3VwZXJjb25zdHJ1Y3RvckNhbGxFbnN1cmVkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHF1aWNrRml4OiBRdWlja0ZpeCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNvbnN0cnVjdG9ycyA9IGMuYmFzZUNsYXNzLm1ldGhvZHMuZmlsdGVyKG0gPT4gbS5pc0NvbnN0cnVjdG9yKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY29uc3RydWN0b3JzLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtZXRob2RDYWxsID0gXCJzdXBlcihcIiArIGNvbnN0cnVjdG9yc1swXS5wYXJhbWV0ZXJsaXN0LnBhcmFtZXRlcnMubWFwKHAgPT4gcC5pZGVudGlmaWVyKS5qb2luKFwiLCBcIikgKyBcIik7XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwb3NpdGlvbiA9IG1ldGhvZE5vZGUucG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1aWNrRml4ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdBdWZydWYgZGVzIEtvbnN0cnVrdG9ycyBkZXIgQmFzaXNrbGFzc2UgZWluZsO8Z2VuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vMDYuMDYuMjAyMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdHNQcm92aWRlcjogKHVyaSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZTogdXJpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0TGluZU51bWJlcjogcG9zaXRpb24ubGluZSArIDEsIHN0YXJ0Q29sdW1uOiAwLCBlbmRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lICsgMSwgZW5kQ29sdW1uOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V2ZXJpdHk6IG1vbmFjby5NYXJrZXJTZXZlcml0eS5FcnJvclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiXFx0XFx0XCIgKyBtZXRob2RDYWxsICsgXCJcXG5cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgQmFzaXNrbGFzc2UgZGVyIEtsYXNzZSBcIiArIGMuaWRlbnRpZmllciArIFwiIGJlc2l0enQga2VpbmVuIHBhcmFtZXRlcmxvc2VuIEtvbnN0cnVrdG9yLCBkYWhlciBtdXNzIGRpZXNlIEtvbnN0cnVrdG9yZGVmaW5pdGlvbiBtaXQgZWluZW0gQXVmcnVmIGVpbmVzIEtvbnN0cnVrdG9ycyBkZXIgQmFzaXNrbGFzc2UgKHN1cGVyKC4uLikpIGJlZ2lubmVuLlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2ROb2RlLnBvc2l0aW9uLCBcImVycm9yXCIsIHF1aWNrRml4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICghc3VwZXJjb25zdHJ1Y3RvckNhbGxFbnN1cmVkICYmIGMuYmFzZUNsYXNzPy5oYXNQYXJhbWV0ZXJsZXNzQ29uc3RydWN0b3IoKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gaW52b2tlIHBhcmFtZXRlcmxlc3MgY29uc3RydWN0b3JcclxuICAgICAgICAgICAgICAgIGxldCBiYXNlQ2xhc3NDb25zdHJ1Y3RvciA9IGMuYmFzZUNsYXNzLmdldFBhcmFtZXRlcmxlc3NDb25zdHJ1Y3RvcigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyhbXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUHVzaCB0aGlzLW9iamVjdCB0byBzdGFjazpcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoTG9jYWxWYXJpYWJsZVRvU3RhY2ssXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBtZXRob2ROb2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFja3Bvc09mVmFyaWFibGU6IDBcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmNhbGxNZXRob2QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogYmFzZUNsYXNzQ29uc3RydWN0b3IsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzU3VwZXJDYWxsOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbWV0aG9kTm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tmcmFtZUJlZ2luOiAtMSAvLyB0aGlzLW9iamVjdCBmb2xsb3dlZCBieSBwYXJhbWV0ZXJzXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBhY3RvckNsYXNzID0gPEtsYXNzPnRoaXMubW9kdWxlU3RvcmUuZ2V0VHlwZShcIkFjdG9yXCIpLnR5cGU7XHJcbiAgICAgICAgbGV0IG1ldGhvZElkZW50aWZpZXJzID0gW1wiYWN0XCIsIFwib25LZXlUeXBlZFwiLCBcIm9uS2V5RG93blwiLCBcIm9uS2V5VXBcIixcclxuICAgICAgICAgICAgXCJvbk1vdXNlRG93blwiLCBcIm9uTW91c2VVcFwiLCBcIm9uTW91c2VNb3ZlXCIsIFwib25Nb3VzZUVudGVyXCIsIFwib25Nb3VzZUxlYXZlXCJdO1xyXG4gICAgICAgIGlmIChtZXRob2RJZGVudGlmaWVycy5pbmRleE9mKG1ldGhvZC5pZGVudGlmaWVyKSA+PSAwICYmIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dC5oYXNBbmNlc3Rvck9ySXMoYWN0b3JDbGFzcykpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyhbXHJcblxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5yZXR1cm5JZkRlc3Ryb3llZCxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbWV0aG9kTm9kZS5wb3NpdGlvblxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgd2l0aFJldHVyblN0YXRlbWVudCA9IHRoaXMuZ2VuZXJhdGVTdGF0ZW1lbnRzKG1ldGhvZE5vZGUuc3RhdGVtZW50cykud2l0aFJldHVyblN0YXRlbWVudDtcclxuXHJcbiAgICAgICAgaWYgKCF3aXRoUmV0dXJuU3RhdGVtZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnJldHVybixcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBtZXRob2ROb2RlLnNjb3BlVG8sXHJcbiAgICAgICAgICAgICAgICBjb3B5UmV0dXJuVmFsdWVUb1N0YWNrZnJhbWVQb3MwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGxlYXZlVGhpc09iamVjdE9uU3RhY2s6IGZhbHNlXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgbGV0IHJ0ID0gbWV0aG9kLmdldFJldHVyblR5cGUoKTtcclxuICAgICAgICAgICAgaWYgKCFtZXRob2QuaXNDb25zdHJ1Y3RvciAmJiBydCAhPSBudWxsICYmIHJ0ICE9IHZvaWRQcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRpZSBEZWtsYXJhdGlvbiBkZXIgTWV0aG9kZSB2ZXJsYW5ndCBkaWUgUsO8Y2tnYWJlIGVpbmVzIFdlcnRlcyB2b20gVHlwIFwiICsgcnQuaWRlbnRpZmllciArIFwiLiBFcyBmZWhsdCAobWluZGVzdGVucykgZWluZSBlbnRzcHJlY2hlbmRlIHJldHVybi1BbndlaXN1bmcuXCIsIG1ldGhvZE5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtZXRob2QucmVzZXJ2ZVN0YWNrRm9yTG9jYWxWYXJpYWJsZXMgPSB0aGlzLm5leHRGcmVlUmVsYXRpdmVTdGFja1Bvc1xyXG4gICAgICAgICAgICAtIG1ldGhvZE5vZGUucGFyYW1ldGVycy5sZW5ndGggLSAxO1xyXG5cclxuICAgICAgICB0aGlzLnBvcFN5bWJvbFRhYmxlKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXIucmVzb2x2ZU5vZGVzKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2hlY2tzIGlmIGNoaWxkIGNsYXNzZXMgaGF2ZSBtZXRob2Qgd2l0aCBzYW1lIHNpZ25hdHVyZVxyXG4gICAgICovXHJcbiAgICBjaGVja0lmTWV0aG9kSXNWaXJ0dWFsKG1ldGhvZDogTWV0aG9kKSB7XHJcblxyXG4gICAgICAgIGxldCBrbGFzcyA9IHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dDtcclxuICAgICAgICBpZiAoa2xhc3MgIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgbW8gb2YgdGhpcy5tb2R1bGVTdG9yZS5nZXRNb2R1bGVzKGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYyBvZiBtby50eXBlU3RvcmUudHlwZUxpc3QpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYyBpbnN0YW5jZW9mIEtsYXNzICYmIGMgIT0ga2xhc3MgJiYgYy5oYXNBbmNlc3Rvck9ySXMoa2xhc3MpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG0gb2YgYy5tZXRob2RzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobSAhPSBudWxsICYmIG1ldGhvZCAhPSBudWxsICYmIG0uc2lnbmF0dXJlID09IG1ldGhvZC5zaWduYXR1cmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2QuaXNWaXJ0dWFsID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBpbml0aWFsaXplQXR0cmlidXRlKGF0dHJpYnV0ZTogQXR0cmlidXRlRGVjbGFyYXRpb25Ob2RlKSB7XHJcblxyXG4gICAgICAgIGlmIChhdHRyaWJ1dGUgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBhc3N1bXB0aW9uOiBhdHRyaWJ1dGUgIT0gbnVsbFxyXG4gICAgICAgIGlmIChhdHRyaWJ1dGUuaWRlbnRpZmllciA9PSBudWxsIHx8IGF0dHJpYnV0ZS5pbml0aWFsaXphdGlvbiA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmIChhdHRyaWJ1dGUuaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaFN0YXRpY0F0dHJpYnV0ZSxcclxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUluZGV4OiBhdHRyaWJ1dGUucmVzb2x2ZWRUeXBlLmluZGV4LFxyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlSWRlbnRpZmllcjogYXR0cmlidXRlLnJlc29sdmVkVHlwZS5pZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IGF0dHJpYnV0ZS5pbml0aWFsaXphdGlvbi5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIGtsYXNzOiA8U3RhdGljQ2xhc3M+KHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dClcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaEF0dHJpYnV0ZSxcclxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUluZGV4OiBhdHRyaWJ1dGUucmVzb2x2ZWRUeXBlLmluZGV4LFxyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlSWRlbnRpZmllcjogYXR0cmlidXRlLmlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogYXR0cmlidXRlLmluaXRpYWxpemF0aW9uLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgdXNlVGhpc09iamVjdDogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBsZXQgaW5pdGlhbGl6YXRpb25UeXBlID0gdGhpcy5wcm9jZXNzTm9kZShhdHRyaWJ1dGUuaW5pdGlhbGl6YXRpb24pO1xyXG5cclxuICAgICAgICBpZiAoaW5pdGlhbGl6YXRpb25UeXBlICE9IG51bGwgJiYgaW5pdGlhbGl6YXRpb25UeXBlLnR5cGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuZW5zdXJlQXV0b21hdGljQ2FzdGluZyhpbml0aWFsaXphdGlvblR5cGUudHlwZSwgYXR0cmlidXRlLmF0dHJpYnV0ZVR5cGUucmVzb2x2ZWRUeXBlKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChhdHRyaWJ1dGUuYXR0cmlidXRlVHlwZS5yZXNvbHZlZFR5cGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVyIERhdGVudHlwIHZvbiBcIiArIGF0dHJpYnV0ZS5pZGVudGlmaWVyICsgXCIga29ubnRlIG5pY2h0IGVybWl0dGVsdCB3ZXJkZW4uIFwiLCBhdHRyaWJ1dGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBXZXJ0IGRlcyBUZXJtIHZvbSBEYXRlbnR5cCBcIiArIGluaXRpYWxpemF0aW9uVHlwZS50eXBlICsgXCIga2FubiBkZW0gQXR0cmlidXQgXCIgKyBhdHRyaWJ1dGUuaWRlbnRpZmllciArIFwiIHZvbSBUeXAgXCIgKyBhdHRyaWJ1dGUuYXR0cmlidXRlVHlwZS5yZXNvbHZlZFR5cGUuaWRlbnRpZmllciArIFwiIG5pY2h0IHp1Z2V3aWVzZW4gd2VyZGVuLlwiLCBhdHRyaWJ1dGUuaW5pdGlhbGl6YXRpb24ucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmFzc2lnbm1lbnQsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogYXR0cmlidXRlLmluaXRpYWxpemF0aW9uLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGxlYXZlVmFsdWVPblN0YWNrOiBmYWxzZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgaW5pdEN1cnJlbnRQcm9ncmFtKCkge1xyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtID0ge1xyXG4gICAgICAgICAgICBtb2R1bGU6IHRoaXMubW9kdWxlLFxyXG4gICAgICAgICAgICBzdGF0ZW1lbnRzOiBbXSxcclxuICAgICAgICAgICAgbGFiZWxNYW5hZ2VyOiBudWxsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXIgPSBuZXcgTGFiZWxNYW5hZ2VyKHRoaXMuY3VycmVudFByb2dyYW0pO1xyXG5cclxuICAgICAgICB0aGlzLmxhc3RTdGF0ZW1lbnQgPSBudWxsO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZU1haW4oaXNBZGhvY0NvbXBpbGF0aW9uOiBib29sZWFuID0gZmFsc2UpIHtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0Q3VycmVudFByb2dyYW0oKTtcclxuXHJcbiAgICAgICAgbGV0IHBvc2l0aW9uOiBUZXh0UG9zaXRpb24gPSB7IGxpbmU6IDEsIGNvbHVtbjogMSwgbGVuZ3RoOiAwIH07XHJcblxyXG4gICAgICAgIGxldCBtYWluUHJvZ3JhbUFzdCA9IHRoaXMubW9kdWxlLm1haW5Qcm9ncmFtQXN0O1xyXG4gICAgICAgIGlmIChtYWluUHJvZ3JhbUFzdCAhPSBudWxsICYmIG1haW5Qcm9ncmFtQXN0Lmxlbmd0aCA+IDAgJiYgbWFpblByb2dyYW1Bc3RbMF0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBwb3NpdGlvbiA9IHRoaXMubW9kdWxlLm1haW5Qcm9ncmFtQXN0WzBdLnBvc2l0aW9uO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFpc0FkaG9jQ29tcGlsYXRpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoTmV3U3ltYm9sVGFibGUodHJ1ZSwgcG9zaXRpb24sIHsgbGluZTogMTAwMDAwLCBjb2x1bW46IDEsIGxlbmd0aDogMCB9LCB0aGlzLmN1cnJlbnRQcm9ncmFtKTtcclxuICAgICAgICAgICAgdGhpcy5oZWFwID0ge307XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm1vZHVsZS5tYWluUHJvZ3JhbSA9IHRoaXMuY3VycmVudFByb2dyYW07XHJcblxyXG4gICAgICAgIGxldCBoYXNNYWluUHJvZ3JhbTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5tb2R1bGUubWFpblByb2dyYW1Bc3QgIT0gbnVsbCAmJiB0aGlzLm1vZHVsZS5tYWluUHJvZ3JhbUFzdC5sZW5ndGggPiAwKSB7XHJcblxyXG4gICAgICAgICAgICBoYXNNYWluUHJvZ3JhbSA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVTdGF0ZW1lbnRzKHRoaXMubW9kdWxlLm1haW5Qcm9ncmFtQXN0KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc0FkaG9jQ29tcGlsYXRpb24gJiYgdGhpcy5sYXN0U3RhdGVtZW50ICE9IG51bGwgJiYgdGhpcy5sYXN0U3RhdGVtZW50LnR5cGUgPT0gVG9rZW5UeXBlLmRlY3JlYXNlU3RhY2twb2ludGVyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUxhc3RTdGF0ZW1lbnQoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5sYXN0UG9zaXRpb24gPSB0aGlzLm1vZHVsZS5tYWluUHJvZ3JhbUVuZDtcclxuICAgICAgICAgICAgaWYgKHRoaXMubGFzdFBvc2l0aW9uID09IG51bGwpIHRoaXMubGFzdFBvc2l0aW9uID0geyBsaW5lOiAxMDAwMDAsIGNvbHVtbjogMCwgbGVuZ3RoOiAwIH07XHJcbiAgICAgICAgICAgIC8vIGlmKHRoaXMubGFzdFBvc2l0aW9uID09IG51bGwpIHRoaXMubGFzdFBvc2l0aW9uID0ge2xpbmU6IDEwMDAwMCwgY29sdW1uOiAwLCBsZW5ndGg6IDB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50U3ltYm9sVGFibGUucG9zaXRpb25UbyA9IHRoaXMubGFzdFBvc2l0aW9uO1xyXG4gICAgICAgICAgICBpZiAoIWlzQWRob2NDb21waWxhdGlvbikgdGhpcy5wb3BTeW1ib2xUYWJsZSh0aGlzLmN1cnJlbnRQcm9ncmFtLCB0cnVlKTtcclxuICAgICAgICAgICAgdGhpcy5oZWFwID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnByb2dyYW1FbmQsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5sYXN0UG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBwYXVzZUFmdGVyUHJvZ3JhbUVuZDogdHJ1ZVxyXG4gICAgICAgICAgICB9LCB0cnVlKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtLmxhYmVsTWFuYWdlci5yZXNvbHZlTm9kZXMoKTtcclxuXHJcbiAgICAgICAgaWYgKCFpc0FkaG9jQ29tcGlsYXRpb24gJiYgIWhhc01haW5Qcm9ncmFtKSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9wU3ltYm9sVGFibGUodGhpcy5jdXJyZW50UHJvZ3JhbSk7XHJcbiAgICAgICAgICAgIHRoaXMuaGVhcCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBlbnN1cmVBdXRvbWF0aWNDYXN0aW5nKHR5cGVGcm9tOiBUeXBlLCB0eXBlVG86IFR5cGUsIHBvc2l0aW9uPzogVGV4dFBvc2l0aW9uLCBub2RlRnJvbT86IEFTVE5vZGUpOiBib29sZWFuIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVGcm9tID09IG51bGwgfHwgdHlwZVRvID09IG51bGwpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVGcm9tLmVxdWFscyh0eXBlVG8pKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0eXBlRnJvbS5jYW5DYXN0VG8odHlwZVRvKSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVUbyA9PSBib29sZWFuUHJpbWl0aXZlVHlwZSAmJiBub2RlRnJvbSAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja0lmQXNzaWdubWVudEluc3RlZE9mRXF1YWwobm9kZUZyb20pO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlRnJvbVtcInVuYm94YWJsZUFzXCJdICE9IG51bGwgJiYgdHlwZUZyb21bXCJ1bmJveGFibGVBc1wiXS5pbmRleE9mKHR5cGVUbykgPj0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlRnJvbSBpbnN0YW5jZW9mIEtsYXNzICYmIHR5cGVUbyA9PSBzdHJpbmdQcmltaXRpdmVUeXBlKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgdG9TdHJpbmdTdGF0ZW1lbnQgPSB0aGlzLmdldFRvU3RyaW5nU3RhdGVtZW50KHR5cGVGcm9tLCBwb3NpdGlvbik7XHJcblxyXG4gICAgICAgICAgICBpZiAodG9TdHJpbmdTdGF0ZW1lbnQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh0b1N0cmluZ1N0YXRlbWVudCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIGlmICh0eXBlRnJvbSBpbnN0YW5jZW9mIFByaW1pdGl2ZVR5cGUgJiYgKHR5cGVUbyBpbnN0YW5jZW9mIFByaW1pdGl2ZVR5cGUgfHwgdHlwZVRvID09IHN0cmluZ1ByaW1pdGl2ZVR5cGUpKSB7XHJcbiAgICAgICAgICAgIGxldCBjYXN0SW5mbyA9IHR5cGVGcm9tLmdldENhc3RJbmZvcm1hdGlvbih0eXBlVG8pO1xyXG4gICAgICAgICAgICBpZiAoIWNhc3RJbmZvLmF1dG9tYXRpYykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChjYXN0SW5mby5uZWVkc1N0YXRlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmNhc3RWYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBuZXdUeXBlOiB0eXBlVG8sXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldFRvU3RyaW5nU3RhdGVtZW50KHR5cGU6IEtsYXNzLCBwb3NpdGlvbjogVGV4dFBvc2l0aW9uKTogU3RhdGVtZW50IHtcclxuICAgICAgICBsZXQgdG9TdHJpbmdNZXRob2QgPSB0eXBlLmdldE1ldGhvZEJ5U2lnbmF0dXJlKFwidG9TdHJpbmcoKVwiKTtcclxuICAgICAgICBpZiAodG9TdHJpbmdNZXRob2QgIT0gbnVsbCAmJiB0b1N0cmluZ01ldGhvZC5nZXRSZXR1cm5UeXBlKCkgPT0gc3RyaW5nUHJpbWl0aXZlVHlwZSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5jYWxsTWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiB0b1N0cmluZ01ldGhvZCxcclxuICAgICAgICAgICAgICAgIGlzU3VwZXJDYWxsOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHN0YWNrZnJhbWVCZWdpbjogLTEsXHJcbiAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlXHJcbiAgICAgICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2hlY2tJZkFzc2lnbm1lbnRJbnN0ZWRPZkVxdWFsKG5vZGVGcm9tOiBBU1ROb2RlLCBjb25kaXRpb25UeXBlPzogVHlwZSkge1xyXG4gICAgICAgIGlmIChub2RlRnJvbSA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmIChub2RlRnJvbS50eXBlID09IFRva2VuVHlwZS5iaW5hcnlPcCAmJiBub2RlRnJvbS5vcGVyYXRvciA9PSBUb2tlblR5cGUuYXNzaWdubWVudCkge1xyXG4gICAgICAgICAgICBsZXQgcG9zID0gbm9kZUZyb20ucG9zaXRpb247XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiPSBpc3QgZGVyIFp1d2Vpc3VuZ3NvcGVyYXRvci4gRHUgd2lsbHN0IHNpY2hlciB6d2VpIFdlcnRlIHZlcmdsZWljaGVuLiBEYXp1IGJlbsO2dGlnc3QgRHUgZGVuIFZlcmdsZWljaHNvcGVyYXRvciA9PS5cIixcclxuICAgICAgICAgICAgICAgIHBvcywgY29uZGl0aW9uVHlwZSA9PSBib29sZWFuUHJpbWl0aXZlVHlwZSA/IFwid2FybmluZ1wiIDogXCJlcnJvclwiLCB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJz0gZHVyY2ggPT0gZXJzZXR6ZW4nLFxyXG4gICAgICAgICAgICAgICAgZWRpdHNQcm92aWRlcjogKHVyaSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZTogdXJpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0TGluZU51bWJlcjogcG9zLmxpbmUsIHN0YXJ0Q29sdW1uOiBwb3MuY29sdW1uLCBlbmRMaW5lTnVtYmVyOiBwb3MubGluZSwgZW5kQ29sdW1uOiBwb3MuY29sdW1uICsgMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldmVyaXR5OiBtb25hY28uTWFya2VyU2V2ZXJpdHkuRXJyb3JcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIj09XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlU3RhdGVtZW50cyhub2RlczogQVNUTm9kZVtdKTogeyB3aXRoUmV0dXJuU3RhdGVtZW50OiBib29sZWFuLCBlbmRQb3NpdGlvbj86IFRleHRQb3NpdGlvbiB9IHtcclxuXHJcblxyXG4gICAgICAgIGlmIChub2RlcyA9PSBudWxsIHx8IG5vZGVzLmxlbmd0aCA9PSAwIHx8IG5vZGVzWzBdID09IG51bGwpIHJldHVybiB7IHdpdGhSZXR1cm5TdGF0ZW1lbnQ6IGZhbHNlIH07XHJcblxyXG4gICAgICAgIGxldCB3aXRoUmV0dXJuU3RhdGVtZW50OiBib29sZWFuID0gdGhpcy5wcm9jZXNzU3RhdGVtZW50c0luc2lkZUJsb2NrKG5vZGVzKTtcclxuXHJcbiAgICAgICAgbGV0IGxhc3ROb2RlID0gbm9kZXNbbm9kZXMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgbGV0IGVuZFBvc2l0aW9uOiBUZXh0UG9zaXRpb247XHJcbiAgICAgICAgaWYgKGxhc3ROb2RlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgaWYgKGxhc3ROb2RlLnR5cGUgPT0gVG9rZW5UeXBlLnNjb3BlTm9kZSkge1xyXG4gICAgICAgICAgICAgICAgZW5kUG9zaXRpb24gPSBsYXN0Tm9kZS5wb3NpdGlvblRvO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZW5kUG9zaXRpb24gPSBPYmplY3QuYXNzaWduKHt9LCBsYXN0Tm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICBpZiAoZW5kUG9zaXRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVuZFBvc2l0aW9uLmNvbHVtbiArPSBlbmRQb3NpdGlvbi5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5kUG9zaXRpb24ubGVuZ3RoID0gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmxhc3RQb3NpdGlvbiA9IGVuZFBvc2l0aW9uO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGVuZFBvc2l0aW9uID0gdGhpcy5sYXN0UG9zaXRpb247XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geyB3aXRoUmV0dXJuU3RhdGVtZW50OiB3aXRoUmV0dXJuU3RhdGVtZW50LCBlbmRQb3NpdGlvbjogZW5kUG9zaXRpb24gfTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc1N0YXRlbWVudHNJbnNpZGVCbG9jayhub2RlczogQVNUTm9kZVtdKSB7XHJcbiAgICAgICAgbGV0IHdpdGhSZXR1cm5TdGF0ZW1lbnQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbm9kZSBvZiBub2Rlcykge1xyXG5cclxuICAgICAgICAgICAgaWYgKG5vZGUgPT0gbnVsbCkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICBsZXQgdHlwZSA9IHRoaXMucHJvY2Vzc05vZGUobm9kZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZSAhPSBudWxsICYmIHR5cGUud2l0aFJldHVyblN0YXRlbWVudCAhPSBudWxsICYmIHR5cGUud2l0aFJldHVyblN0YXRlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgd2l0aFJldHVyblN0YXRlbWVudCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIElmIGxhc3QgU3RhdGVtZW50IGhhcyB2YWx1ZSB3aGljaCBpcyBub3QgdXNlZCBmdXJ0aGVyIHRoZW4gcG9wIHRoaXMgdmFsdWUgZnJvbSBzdGFjay5cclxuICAgICAgICAgICAgLy8gZS5nLiBzdGF0ZW1lbnQgMTIgKyAxNyAtNztcclxuICAgICAgICAgICAgLy8gUGFyc2VyIGlzc3VlcyBhIHdhcm5pbmcgaW4gdGhpcyBjYXNlLCBzZWUgUGFyc2VyLmNoZWNrSWZTdGF0ZW1lbnRIYXNOb0VmZmVrdFxyXG4gICAgICAgICAgICBpZiAodHlwZSAhPSBudWxsICYmIHR5cGUudHlwZSAhPSBudWxsICYmIHR5cGUudHlwZSAhPSB2b2lkUHJpbWl0aXZlVHlwZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxhc3RTdGF0ZW1lbnQgIT0gbnVsbCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGFzdFN0YXRlbWVudC50eXBlID09IFRva2VuVHlwZS5hc3NpZ25tZW50ICYmIHRoaXMubGFzdFN0YXRlbWVudC5sZWF2ZVZhbHVlT25TdGFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGFzdFN0YXRlbWVudC5sZWF2ZVZhbHVlT25TdGFjayA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmRlY3JlYXNlU3RhY2twb2ludGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9wQ291bnQ6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH0sIHRydWUpXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHdpdGhSZXR1cm5TdGF0ZW1lbnQ7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGxhc3RQb3NpdGlvbjogVGV4dFBvc2l0aW9uO1xyXG4gICAgbGFzdFN0YXRlbWVudDogU3RhdGVtZW50O1xyXG5cclxuICAgIGluc2VydFN0YXRlbWVudHMocG9zOiBudW1iZXIsIHN0YXRlbWVudHM6IFN0YXRlbWVudCB8IFN0YXRlbWVudFtdKSB7XHJcbiAgICAgICAgaWYgKHN0YXRlbWVudHMgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShzdGF0ZW1lbnRzKSkgc3RhdGVtZW50cyA9IFtzdGF0ZW1lbnRzXTtcclxuICAgICAgICBmb3IgKGxldCBzdCBvZiBzdGF0ZW1lbnRzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5zcGxpY2UocG9zKyssIDAsIHN0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVzaFN0YXRlbWVudHMoc3RhdGVtZW50OiBTdGF0ZW1lbnQgfCBTdGF0ZW1lbnRbXSwgZGVsZXRlU3RlcEZpbmlzaGVkRmxhZ09uU3RlcEJlZm9yZTogYm9vbGVhbiA9IGZhbHNlKSB7XHJcblxyXG4gICAgICAgIGlmIChzdGF0ZW1lbnQgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiAoZGVsZXRlU3RlcEZpbmlzaGVkRmxhZ09uU3RlcEJlZm9yZSAmJiB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBsZXQgc3RlcEJlZm9yZTogU3RhdGVtZW50ID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzW3RoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgc3RlcEJlZm9yZS5zdGVwRmluaXNoZWQgPSBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHN0YXRlbWVudCkpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgc3Qgb2Ygc3RhdGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHMucHVzaChzdCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3QudHlwZSA9PSBUb2tlblR5cGUucmV0dXJuIHx8IHN0LnR5cGUgPT0gVG9rZW5UeXBlLmp1bXBBbHdheXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5sYXN0U3RhdGVtZW50ICE9IG51bGwpIHRoaXMubGFzdFN0YXRlbWVudC5zdGVwRmluaXNoZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzdC5wb3NpdGlvbiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0UG9zaXRpb24gPSBzdC5wb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3QucG9zaXRpb24gPSB0aGlzLmxhc3RQb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdFN0YXRlbWVudCA9IHN0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzLnB1c2goc3RhdGVtZW50KTtcclxuICAgICAgICAgICAgaWYgKHN0YXRlbWVudC50eXBlID09IFRva2VuVHlwZS5yZXR1cm4gfHwgc3RhdGVtZW50LnR5cGUgPT0gVG9rZW5UeXBlLmp1bXBBbHdheXMpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxhc3RTdGF0ZW1lbnQgIT0gbnVsbCAmJiB0aGlzLmxhc3RTdGF0ZW1lbnQudHlwZSAhPSBUb2tlblR5cGUubm9PcCkgdGhpcy5sYXN0U3RhdGVtZW50LnN0ZXBGaW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzdGF0ZW1lbnQucG9zaXRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0UG9zaXRpb24gPSBzdGF0ZW1lbnQucG9zaXRpb247XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZW1lbnQucG9zaXRpb24gPSB0aGlzLmxhc3RQb3NpdGlvbjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5sYXN0U3RhdGVtZW50ID0gc3RhdGVtZW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVMYXN0U3RhdGVtZW50KCkge1xyXG4gICAgICAgIGxldCBsc3QgPSB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHMucG9wKCk7XHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFByb2dyYW0ubGFiZWxNYW5hZ2VyICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXIucmVtb3ZlTm9kZShsc3QpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbml0U3RhY2tGcmFtZU5vZGVzOiBJbml0U3RhY2tmcmFtZVN0YXRlbWVudFtdID0gW107XHJcblxyXG5cclxuICAgIHB1c2hOZXdTeW1ib2xUYWJsZShiZWdpbk5ld1N0YWNrZnJhbWU6IGJvb2xlYW4sIHBvc2l0aW9uRnJvbTogVGV4dFBvc2l0aW9uLCBwb3NpdGlvblRvOiBUZXh0UG9zaXRpb24sXHJcbiAgICAgICAgcHJvZ3JhbT86IFByb2dyYW0pOiBTeW1ib2xUYWJsZSB7XHJcblxyXG4gICAgICAgIGxldCBzdCA9IG5ldyBTeW1ib2xUYWJsZSh0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZSwgcG9zaXRpb25Gcm9tLCBwb3NpdGlvblRvKTtcclxuXHJcbiAgICAgICAgdGhpcy5zeW1ib2xUYWJsZVN0YWNrLnB1c2godGhpcy5jdXJyZW50U3ltYm9sVGFibGUpO1xyXG5cclxuICAgICAgICBpZiAoYmVnaW5OZXdTdGFja2ZyYW1lKSB7XHJcbiAgICAgICAgICAgIHN0LmJlZ2luc05ld1N0YWNrZnJhbWUgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZS5zdGFja2ZyYW1lU2l6ZSA9IHRoaXMubmV4dEZyZWVSZWxhdGl2ZVN0YWNrUG9zO1xyXG4gICAgICAgICAgICB0aGlzLm5leHRGcmVlUmVsYXRpdmVTdGFja1BvcyA9IDA7XHJcblxyXG4gICAgICAgICAgICBpZiAocHJvZ3JhbSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaW5pdFN0YWNrRnJhbWVOb2RlOiBJbml0U3RhY2tmcmFtZVN0YXRlbWVudCA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuaW5pdFN0YWNrZnJhbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uRnJvbSxcclxuICAgICAgICAgICAgICAgICAgICByZXNlcnZlRm9yTG9jYWxWYXJpYWJsZXM6IDBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBwcm9ncmFtLnN0YXRlbWVudHMucHVzaChpbml0U3RhY2tGcmFtZU5vZGUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbml0U3RhY2tGcmFtZU5vZGVzLnB1c2goaW5pdFN0YWNrRnJhbWVOb2RlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlID0gc3Q7XHJcblxyXG4gICAgICAgIHJldHVybiBzdDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcG9wU3ltYm9sVGFibGUocHJvZ3JhbT86IFByb2dyYW0sIGRlbGV0ZVN0ZXBGaW5pc2hlZEZsYWdPblN0ZXBCZWZvcmU6IGJvb2xlYW4gPSBmYWxzZSk6IHZvaWQge1xyXG5cclxuICAgICAgICBsZXQgc3QgPSB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZSA9IHRoaXMuc3ltYm9sVGFibGVTdGFjay5wb3AoKTtcclxuXHJcbiAgICAgICAgLy8gaWYgdi5kZWNsYXJhdGlvbkVycm9yICE9IG51bGwgdGhlbiB2YXJpYWJsZSBoYXMgYmVlbiB1c2VkIGJlZm9yZSBpbml0aWFsaXphdGlvbi5cclxuICAgICAgICBzdC52YXJpYWJsZU1hcC5mb3JFYWNoKHYgPT4ge1xyXG4gICAgICAgICAgICBpZiAodi5kZWNsYXJhdGlvbkVycm9yICE9IG51bGwgJiYgdi51c2VkQmVmb3JlSW5pdGlhbGl6YXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3JMaXN0LnB1c2godi5kZWNsYXJhdGlvbkVycm9yKTtcclxuICAgICAgICAgICAgICAgIHYuZGVjbGFyYXRpb25FcnJvciA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gaWYgKCFzdC5iZWdpbnNOZXdTdGFja2ZyYW1lICYmIHN0LnZhcmlhYmxlTWFwLnNpemUgPT0gMCAmJiByZW1vdmVJKSB7XHJcbiAgICAgICAgLy8gICAgIC8vIGVtcHR5IHN5bWJvbCB0YWJsZSA9PiByZW1vdmUgaXQhXHJcbiAgICAgICAgLy8gICAgIGlmIChzdC5wYXJlbnQgIT0gbnVsbCkge1xyXG4gICAgICAgIC8vICAgICAgICAgc3QucGFyZW50LmNoaWxkU3ltYm9sVGFibGVzLnBvcCgpO1xyXG4gICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgLy8gfSBlbHNlIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8gVE9ETzogYWRkIGxlbmd0aCBvZiB0b2tlblxyXG5cclxuICAgICAgICAgICAgaWYgKHN0LmJlZ2luc05ld1N0YWNrZnJhbWUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBzdC5zdGFja2ZyYW1lU2l6ZSA9IHRoaXMubmV4dEZyZWVSZWxhdGl2ZVN0YWNrUG9zO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0RnJlZVJlbGF0aXZlU3RhY2tQb3MgPSB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZS5zdGFja2ZyYW1lU2l6ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocHJvZ3JhbSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGluaXRTdGFja2ZyYW1lTm9kZSA9IHRoaXMuaW5pdFN0YWNrRnJhbWVOb2Rlcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5pdFN0YWNrZnJhbWVOb2RlICE9IG51bGwpIGluaXRTdGFja2ZyYW1lTm9kZS5yZXNlcnZlRm9yTG9jYWxWYXJpYWJsZXMgPSBzdC5zdGFja2ZyYW1lU2l6ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGggPiAwICYmIGRlbGV0ZVN0ZXBGaW5pc2hlZEZsYWdPblN0ZXBCZWZvcmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHN0YXRlbWVudCA9IHByb2dyYW0uc3RhdGVtZW50c1twcm9ncmFtLnN0YXRlbWVudHMubGVuZ3RoIC0gMV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkb24ndCBzZXQgc3RlcEZpbmlzaGVkID0gZmFsc2UgaW4ganVtcC1zdGF0ZW1lbnRzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFzIHRoaXMgY291bGQgbGVhZCB0byBpbmZpbml0eS1sb29wIGlzIHVzZXIgc2V0cyBcIndoaWxlKHRydWUpO1wiIGp1c3QgYmVmb3JlIHByb2dyYW0gZW5kXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChbVG9rZW5UeXBlLmp1bXBBbHdheXMsIFRva2VuVHlwZS5qdW1wSWZUcnVlLCBUb2tlblR5cGUuanVtcElmRmFsc2UsIFRva2VuVHlwZS5qdW1wSWZGYWxzZUFuZExlYXZlT25TdGFjaywgVG9rZW5UeXBlLmp1bXBJZlRydWVBbmRMZWF2ZU9uU3RhY2tdLmluZGV4T2Yoc3RhdGVtZW50LnR5cGUpID09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmFtLnN0YXRlbWVudHNbcHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCAtIDFdLnN0ZXBGaW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBwcm9ncmFtLnN0YXRlbWVudHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5jbG9zZVN0YWNrZnJhbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBzdC5wb3NpdGlvblRvXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVzaEVycm9yKHRleHQ6IHN0cmluZywgcG9zaXRpb246IFRleHRQb3NpdGlvbiwgZXJyb3JMZXZlbDogRXJyb3JMZXZlbCA9IFwiZXJyb3JcIiwgcXVpY2tGaXg/OiBRdWlja0ZpeCkge1xyXG4gICAgICAgIHRoaXMuZXJyb3JMaXN0LnB1c2goe1xyXG4gICAgICAgICAgICB0ZXh0OiB0ZXh0LFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24sXHJcbiAgICAgICAgICAgIHF1aWNrRml4OiBxdWlja0ZpeCxcclxuICAgICAgICAgICAgbGV2ZWw6IGVycm9yTGV2ZWxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBvcGVuQnJlYWtTY29wZSgpIHtcclxuICAgICAgICB0aGlzLmJyZWFrTm9kZVN0YWNrLnB1c2goW10pO1xyXG4gICAgfVxyXG5cclxuICAgIG9wZW5Db250aW51ZVNjb3BlKCkge1xyXG4gICAgICAgIHRoaXMuY29udGludWVOb2RlU3RhY2sucHVzaChbXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVzaEJyZWFrTm9kZShicmVha05vZGU6IEp1bXBBbHdheXNTdGF0ZW1lbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5icmVha05vZGVTdGFjay5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkVpbmUgYnJlYWstQW53ZWlzdW5nIGlzdCBudXIgaW5uZXJoYWxiIGVpbmVyIHVtZ2ViZW5kZW4gU2NobGVpZmUgb2RlciBzd2l0Y2gtQW53ZWlzdW5nIHNpbm52b2xsLlwiLCBicmVha05vZGUucG9zaXRpb24pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuYnJlYWtOb2RlU3RhY2tbdGhpcy5icmVha05vZGVTdGFjay5sZW5ndGggLSAxXS5wdXNoKGJyZWFrTm9kZSk7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoYnJlYWtOb2RlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVzaENvbnRpbnVlTm9kZShjb250aW51ZU5vZGU6IEp1bXBBbHdheXNTdGF0ZW1lbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5jb250aW51ZU5vZGVTdGFjay5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkVpbmUgY29udGludWUtQW53ZWlzdW5nIGlzdCBudXIgaW5uZXJoYWxiIGVpbmVyIHVtZ2ViZW5kZW4gU2NobGVpZmUgb2RlciBzd2l0Y2gtQW53ZWlzdW5nIHNpbm52b2xsLlwiLCBjb250aW51ZU5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGludWVOb2RlU3RhY2tbdGhpcy5jb250aW51ZU5vZGVTdGFjay5sZW5ndGggLSAxXS5wdXNoKGNvbnRpbnVlTm9kZSk7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoY29udGludWVOb2RlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xvc2VCcmVha1Njb3BlKGJyZWFrVGFyZ2V0TGFiZWw6IG51bWJlciwgbG06IExhYmVsTWFuYWdlcikge1xyXG4gICAgICAgIGxldCBicmVha05vZGVzID0gdGhpcy5icmVha05vZGVTdGFjay5wb3AoKTtcclxuICAgICAgICBmb3IgKGxldCBibiBvZiBicmVha05vZGVzKSB7XHJcbiAgICAgICAgICAgIGxtLnJlZ2lzdGVySnVtcE5vZGUoYm4sIGJyZWFrVGFyZ2V0TGFiZWwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbG9zZUNvbnRpbnVlU2NvcGUoY29udGludWVUYXJnZXRMYWJlbDogbnVtYmVyLCBsbTogTGFiZWxNYW5hZ2VyKSB7XHJcbiAgICAgICAgbGV0IGNvbnRpbnVlTm9kZXMgPSB0aGlzLmNvbnRpbnVlTm9kZVN0YWNrLnBvcCgpO1xyXG4gICAgICAgIGZvciAobGV0IGJuIG9mIGNvbnRpbnVlTm9kZXMpIHtcclxuICAgICAgICAgICAgbG0ucmVnaXN0ZXJKdW1wTm9kZShibiwgY29udGludWVUYXJnZXRMYWJlbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGJyZWFrT2NjdXJlZCgpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5icmVha05vZGVTdGFjay5sZW5ndGggPiAwICYmIHRoaXMuYnJlYWtOb2RlU3RhY2tbdGhpcy5icmVha05vZGVTdGFjay5sZW5ndGggLSAxXS5sZW5ndGggPiAwO1xyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NOb2RlKG5vZGU6IEFTVE5vZGUsIGlzTGVmdFNpZGVPZkFzc2lnbm1lbnQ6IGJvb2xlYW4gPSBmYWxzZSk6IFN0YWNrVHlwZSB7XHJcblxyXG4gICAgICAgIGlmIChub2RlID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgc3dpdGNoIChub2RlLnR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuYmluYXJ5T3A6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzQmluYXJ5T3Aobm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnVuYXJ5T3A6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzVW5hcnlPcChub2RlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucHVzaENvbnN0YW50OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVzaENvbnN0YW50KG5vZGUpO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5jYWxsTWV0aG9kOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZChub2RlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuaWRlbnRpZmllcjpcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc3RhY2tUeXBlID0gdGhpcy5yZXNvbHZlSWRlbnRpZmllcihub2RlKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdiA9IG5vZGUudmFyaWFibGU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHYgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNMZWZ0U2lkZU9mQXNzaWdubWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXYudXNlZEJlZm9yZUluaXRpYWxpemF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdi5kZWNsYXJhdGlvbkVycm9yID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2LmluaXRpYWxpemVkICE9IG51bGwgJiYgIXYuaW5pdGlhbGl6ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2LnVzZWRCZWZvcmVJbml0aWFsaXphdGlvbiA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgVmFyaWFibGUgXCIgKyB2LmlkZW50aWZpZXIgKyBcIiB3aXJkIGhpZXIgYmVudXR6dCBiZXZvciBzaWUgaW5pdGlhbGlzaWVydCB3dXJkZS5cIiwgbm9kZS5wb3NpdGlvbiwgXCJpbmZvXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdGFja1R5cGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnNlbGVjdEFycmF5RWxlbWVudDpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNlbGVjdEFycmF5RWxlbWVudChub2RlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuaW5jcmVtZW50RGVjcmVtZW50QmVmb3JlOlxyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5pbmNyZW1lbnREZWNyZW1lbnRBZnRlcjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmluY3JlbWVudERlY3JlbWVudEJlZm9yZU9yQWZ0ZXIobm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnN1cGVyQ29uc3RydWN0b3JDYWxsOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3VwZXJjb25zdHJ1Y3RvckNhbGwobm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmNvbnN0cnVjdG9yQ2FsbDpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN1cGVyY29uc3RydWN0b3JDYWxsKG5vZGUpO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkVGhpczpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnB1c2hUaGlzT3JTdXBlcihub2RlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmRTdXBlcjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnB1c2hUaGlzT3JTdXBlcihub2RlLCB0cnVlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucHVzaEF0dHJpYnV0ZTpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnB1c2hBdHRyaWJ1dGUobm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLm5ld09iamVjdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm5ld09iamVjdChub2RlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZFdoaWxlOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvY2Vzc1doaWxlKG5vZGUpO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkRG86XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzRG8obm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmRGb3I6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzRm9yKG5vZGUpO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5mb3JMb29wT3ZlckNvbGxlY3Rpb246XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzRm9yTG9vcE92ZXJDb2xsZWN0aW9uKG5vZGUpO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkSWY6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzSWYobm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmRTd2l0Y2g6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzU3dpdGNoKG5vZGUpO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkUmV0dXJuOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvY2Vzc1JldHVybihub2RlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubG9jYWxWYXJpYWJsZURlY2xhcmF0aW9uOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUpO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5hcnJheUluaXRpYWxpemF0aW9uOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvY2Vzc0FycmF5TGl0ZXJhbChub2RlKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubmV3QXJyYXk6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzTmV3QXJyYXkobm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmRQcmludDpcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZFByaW50bG46XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzUHJpbnQobm9kZSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmNhc3RWYWx1ZTpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnByb2Nlc3NNYW51YWxDYXN0KG5vZGUpO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkQnJlYWs6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hCcmVha05vZGUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5qdW1wQWx3YXlzLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkQ29udGludWU6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hDb250aW51ZU5vZGUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5qdW1wQWx3YXlzLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5yaWdodEJyYWNrZXQ6XHJcbiAgICAgICAgICAgICAgICBsZXQgdHlwZSA9IHRoaXMucHJvY2Vzc05vZGUobm9kZS50ZXJtSW5zaWRlQnJhY2tldHMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgIT0gbnVsbCAmJiB0eXBlLnR5cGUgaW5zdGFuY2VvZiBLbGFzcykgdGhpcy5wdXNoVHlwZVBvc2l0aW9uKG5vZGUucG9zaXRpb24sIHR5cGUudHlwZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuc2NvcGVOb2RlOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoTmV3U3ltYm9sVGFibGUoZmFsc2UsIG5vZGUucG9zaXRpb24sIG5vZGUucG9zaXRpb25Ubyk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHdpdGhSZXR1cm5TdGF0ZW1lbnQgPSB0aGlzLnByb2Nlc3NTdGF0ZW1lbnRzSW5zaWRlQmxvY2sobm9kZS5zdGF0ZW1lbnRzKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcFN5bWJvbFRhYmxlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogbnVsbCwgaXNBc3NpZ25hYmxlOiBmYWxzZSwgd2l0aFJldHVyblN0YXRlbWVudDogd2l0aFJldHVyblN0YXRlbWVudCB9O1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NNYW51YWxDYXN0KG5vZGU6IENhc3RNYW51YWxseU5vZGUpOiBTdGFja1R5cGUge1xyXG5cclxuICAgICAgICBsZXQgdHlwZUZyb20xID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLndoYXRUb0Nhc3QpO1xyXG5cclxuICAgICAgICBpZiAodHlwZUZyb20xID09IG51bGwgfHwgdHlwZUZyb20xLnR5cGUgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIGxldCB0eXBlRnJvbTogVHlwZSA9IHR5cGVGcm9tMS50eXBlO1xyXG5cclxuICAgICAgICBpZiAodHlwZUZyb20gIT0gbnVsbCAmJiBub2RlLmNhc3RUb1R5cGUgIT0gbnVsbCAmJiBub2RlLmNhc3RUb1R5cGUucmVzb2x2ZWRUeXBlICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgIGxldCB0eXBlVG8gPSBub2RlLmNhc3RUb1R5cGUucmVzb2x2ZWRUeXBlO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVGcm9tLmNhbkNhc3RUbyh0eXBlVG8pKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVGcm9tIGluc3RhbmNlb2YgUHJpbWl0aXZlVHlwZSAmJiB0eXBlVG8gaW5zdGFuY2VvZiBQcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNhc3RJbmZvID0gdHlwZUZyb20uZ2V0Q2FzdEluZm9ybWF0aW9uKHR5cGVUbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhc3RJbmZvLm5lZWRzU3RhdGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmNhc3RWYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VHlwZTogdHlwZVRvXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZUZyb20gaW5zdGFuY2VvZiBLbGFzcyAmJiB0eXBlVG8gPT0gc3RyaW5nUHJpbWl0aXZlVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB0b1N0cmluZ01ldGhvZCA9IHR5cGVGcm9tLmdldE1ldGhvZEJ5U2lnbmF0dXJlKFwidG9TdHJpbmcoKVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodG9TdHJpbmdNZXRob2QgIT0gbnVsbCAmJiB0b1N0cmluZ01ldGhvZC5nZXRSZXR1cm5UeXBlKCkgPT0gc3RyaW5nUHJpbWl0aXZlVHlwZSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2FsbE1ldGhvZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiB0b1N0cmluZ01ldGhvZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzU3VwZXJDYWxsOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrZnJhbWVCZWdpbjogLTEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBEYXRlbnR5cCBcIiArIHR5cGVGcm9tLmlkZW50aWZpZXIgKyBcIiBrYW5uICh6dW1pbmRlc3QgZHVyY2ggY2FzdGluZykgbmljaHQgaW4gZGVuIERhdGVudHlwIFwiICsgdHlwZVRvLmlkZW50aWZpZXIgKyBcIiB1bWdld2FuZGVsdCB3ZXJkZW4uXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5jYXN0VmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1R5cGU6IHR5cGVUb1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXNBc3NpZ25hYmxlOiB0eXBlRnJvbTEuaXNBc3NpZ25hYmxlLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGVUb1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICgodHlwZUZyb20gaW5zdGFuY2VvZiBLbGFzcyB8fCB0eXBlRnJvbSBpbnN0YW5jZW9mIEludGVyZmFjZSkgJiYgKHR5cGVUbyBpbnN0YW5jZW9mIEtsYXNzIHx8IHR5cGVUbyBpbnN0YW5jZW9mIEludGVyZmFjZSkpXHJcblxyXG4gICAgICAgICAgICAvLyBpZiAodHlwZUZyb20gaW5zdGFuY2VvZiBLbGFzcyAmJlxyXG4gICAgICAgICAgICAvLyAgICAgKHR5cGVUbyBpbnN0YW5jZW9mIEtsYXNzICYmICF0eXBlRnJvbS5oYXNBbmNlc3Rvck9ySXModHlwZVRvKSAmJiB0eXBlVG8uaGFzQW5jZXN0b3JPcklzKHR5cGVGcm9tKSkgfHxcclxuICAgICAgICAgICAgLy8gICAgICh0eXBlVG8gaW5zdGFuY2VvZiBJbnRlcmZhY2UgJiYgISg8S2xhc3M+dHlwZUZyb20pLmltcGxlbWVudHNJbnRlcmZhY2UodHlwZVRvKSkpIFxyXG4gICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmNoZWNrQ2FzdCxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBuZXdUeXBlOiB0eXBlVG8sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBpc0Fzc2lnbmFibGU6IHR5cGVGcm9tMS5pc0Fzc2lnbmFibGUsXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogdHlwZVRvXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgRGF0ZW50eXAgXCIgKyB0eXBlRnJvbS5pZGVudGlmaWVyICsgXCIga2FubiAoenVtaW5kZXN0IGR1cmNoIGNhc3RpbmcpIG5pY2h0IGluIGRlbiBEYXRlbnR5cCBcIiArIHR5cGVUby5pZGVudGlmaWVyICsgXCIgdW1nZXdhbmRlbHQgd2VyZGVuLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NQcmludChub2RlOiBQcmludE5vZGUpOiBTdGFja1R5cGUge1xyXG5cclxuICAgICAgICBsZXQgdHlwZSA9IG5vZGUudHlwZSA9PSBUb2tlblR5cGUua2V5d29yZFByaW50ID8gVG9rZW5UeXBlLnByaW50IDogVG9rZW5UeXBlLnByaW50bG47XHJcblxyXG4gICAgICAgIHRoaXMubW9kdWxlLnB1c2hNZXRob2RDYWxsUG9zaXRpb24obm9kZS5wb3NpdGlvbiwgbm9kZS5jb21tYVBvc2l0aW9ucywgVG9rZW5UeXBlUmVhZGFibGVbbm9kZS50eXBlXSwgbm9kZS5yaWdodEJyYWNrZXRQb3NpdGlvbik7XHJcblxyXG4gICAgICAgIGlmIChub2RlLnRleHQgIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgbGV0IHR5cGUgPSB0aGlzLnByb2Nlc3NOb2RlKG5vZGUudGV4dCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZW5zdXJlQXV0b21hdGljQ2FzdGluZyh0eXBlLnR5cGUsIHN0cmluZ1ByaW1pdGl2ZVR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgTWV0aG9kZW4gcHJpbnQgdW5kIHByaW50bG4gZXJ3YXJ0ZW4gZWluZW4gUGFyYW1ldGVyIHZvbSBUeXAgU3RyaW5nLiBHZWZ1bmRlbiB3dXJkZSBlaW4gV2VydCB2b20gVHlwIFwiICsgdHlwZS50eXBlPy5pZGVudGlmaWVyICsgXCIuXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHdpdGhDb2xvcjogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAobm9kZS5jb2xvciAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgdHlwZSA9IHRoaXMucHJvY2Vzc05vZGUobm9kZS5jb2xvcik7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZS50eXBlICE9IHN0cmluZ1ByaW1pdGl2ZVR5cGUgJiYgdHlwZS50eXBlICE9IGludFByaW1pdGl2ZVR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZW5zdXJlQXV0b21hdGljQ2FzdGluZyh0eXBlLnR5cGUsIHN0cmluZ1ByaW1pdGl2ZVR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIE1ldGhvZGVuIHByaW50IHVuZCBwcmludGxuIGVyd2FydGVuIGFscyBGYXJiZSBlaW5lbiBQYXJhbWV0ZXIgdm9tIFR5cCBTdHJpbmcgb2RlciBpbnQuIEdlZnVuZGVuIHd1cmRlIGVpbiBXZXJ0IHZvbSBUeXAgXCIgKyB0eXBlLnR5cGUuaWRlbnRpZmllciArIFwiLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHdpdGhDb2xvciA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICBlbXB0eTogKG5vZGUudGV4dCA9PSBudWxsKSxcclxuICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiB0cnVlLFxyXG4gICAgICAgICAgICB3aXRoQ29sb3I6IHdpdGhDb2xvclxyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc05ld0FycmF5KG5vZGU6IE5ld0FycmF5Tm9kZSk6IFN0YWNrVHlwZSB7XHJcblxyXG4gICAgICAgIGlmIChub2RlLmluaXRpYWxpemF0aW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvY2Vzc0FycmF5TGl0ZXJhbChub2RlLmluaXRpYWxpemF0aW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGludFs3XVsyXVtdIGFyZSA3IGFycmF5cyBlYWNoIHdpdGggYXJyYXlzIG9mIGxlbmd0aCAyIHdoaWNoIGFyZSBlbXB0eVxyXG5cclxuICAgICAgICBsZXQgZGltZW5zaW9uID0gMDtcclxuICAgICAgICBmb3IgKGxldCBlYyBvZiBub2RlLmVsZW1lbnRDb3VudCkge1xyXG4gICAgICAgICAgICBpZiAoZWMgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzTm9kZShlYyk7IC8vIHB1c2ggbnVtYmVyIG9mIGVsZW1lbnRzIGZvciB0aGlzIGRpbWVuc2lvbiBvbiBzdGFja1xyXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uKys7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZm9yIHRoZSBhcnJheSBhYm92ZTogYXJyYXlUeXBlIGlzIGFycmF5IG9mIGFycmF5IG9mIGludDsgZGltZW5zaW9uIGlzIDI7IHN0YWNrOiA3IDJcclxuICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hFbXB0eUFycmF5LFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgYXJyYXlUeXBlOiBub2RlLmFycmF5VHlwZS5yZXNvbHZlZFR5cGUsXHJcbiAgICAgICAgICAgIGRpbWVuc2lvbjogZGltZW5zaW9uXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGlzQXNzaWduYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHR5cGU6IG5vZGUuYXJyYXlUeXBlLnJlc29sdmVkVHlwZVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByb2Nlc3NBcnJheUxpdGVyYWwobm9kZTogQXJyYXlJbml0aWFsaXphdGlvbk5vZGUpOiBTdGFja1R5cGUge1xyXG5cclxuICAgICAgICBsZXQgYmVzOiBCZWdpbkFycmF5U3RhdGVtZW50ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuYmVnaW5BcnJheSxcclxuICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgIGFycmF5VHlwZTogbm9kZS5hcnJheVR5cGUucmVzb2x2ZWRUeXBlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyhiZXMpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBhaW4gb2Ygbm9kZS5ub2Rlcykge1xyXG5cclxuICAgICAgICAgICAgLy8gRGlkIGFuIGVycm9yIG9jY3VyIHdoZW4gcGFyc2luZyBhIGNvbnN0YW50P1xyXG4gICAgICAgICAgICBpZiAoYWluID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYWluLnR5cGUgPT0gVG9rZW5UeXBlLmFycmF5SW5pdGlhbGl6YXRpb24pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc0FycmF5TGl0ZXJhbChhaW4pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGV0IHNUeXBlID0gdGhpcy5wcm9jZXNzTm9kZShhaW4pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNUeXBlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0VHlwZSA9ICg8QXJyYXlUeXBlPm5vZGUuYXJyYXlUeXBlLnJlc29sdmVkVHlwZSkuYXJyYXlPZlR5cGU7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZW5zdXJlQXV0b21hdGljQ2FzdGluZyhzVHlwZS50eXBlLCB0YXJnZXRUeXBlLCBhaW4ucG9zaXRpb24pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgRGF0ZW50eXAgZGVzIFRlcm1zIChcIiArIHNUeXBlLnR5cGU/LmlkZW50aWZpZXIgKyBcIikga2FubiBuaWNodCBpbiBkZW4gRGF0ZW50eXAgXCIgKyB0YXJnZXRUeXBlPy5pZGVudGlmaWVyICsgXCIga29udmVydGllcnQgd2VyZGVuLlwiLCBhaW4ucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5hZGRUb0FycmF5LFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgbnVtYmVyT2ZFbGVtZW50c1RvQWRkOiBub2RlLm5vZGVzLmxlbmd0aFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBpc0Fzc2lnbmFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICB0eXBlOiBub2RlLmFycmF5VHlwZS5yZXNvbHZlZFR5cGVcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGxvY2FsVmFyaWFibGVEZWNsYXJhdGlvbihub2RlOiBMb2NhbFZhcmlhYmxlRGVjbGFyYXRpb25Ob2RlLCBkb250V2FybldoZW5Ob0luaXRpYWxpemF0aW9uOiBib29sZWFuID0gZmFsc2UpOiBTdGFja1R5cGUge1xyXG5cclxuICAgICAgICBpZiAobm9kZS52YXJpYWJsZVR5cGUucmVzb2x2ZWRUeXBlID09IG51bGwpIHtcclxuICAgICAgICAgICAgbm9kZS52YXJpYWJsZVR5cGUucmVzb2x2ZWRUeXBlID0gbnVsbFR5cGU7IC8vIE1ha2UgdGhlIGJlc3Qgb3V0IG9mIGl0Li4uXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZGVjbGFyZVZhcmlhYmxlT25IZWFwID0gKHRoaXMuaGVhcCAhPSBudWxsICYmIHRoaXMuc3ltYm9sVGFibGVTdGFjay5sZW5ndGggPD0gMik7XHJcblxyXG4gICAgICAgIGxldCB2YXJpYWJsZTogVmFyaWFibGUgPSB7XHJcbiAgICAgICAgICAgIGlkZW50aWZpZXI6IG5vZGUuaWRlbnRpZmllcixcclxuICAgICAgICAgICAgc3RhY2tQb3M6IGRlY2xhcmVWYXJpYWJsZU9uSGVhcCA/IG51bGwgOiB0aGlzLm5leHRGcmVlUmVsYXRpdmVTdGFja1BvcysrLFxyXG4gICAgICAgICAgICB0eXBlOiBub2RlLnZhcmlhYmxlVHlwZS5yZXNvbHZlZFR5cGUsXHJcbiAgICAgICAgICAgIHVzYWdlUG9zaXRpb25zOiBuZXcgTWFwKCksXHJcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uOiB7IG1vZHVsZTogdGhpcy5tb2R1bGUsIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uIH0sXHJcbiAgICAgICAgICAgIGlzRmluYWw6IG5vZGUuaXNGaW5hbFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMucHVzaFVzYWdlUG9zaXRpb24obm9kZS5wb3NpdGlvbiwgdmFyaWFibGUpO1xyXG5cclxuICAgICAgICBpZiAoZGVjbGFyZVZhcmlhYmxlT25IZWFwKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5oZWFwVmFyaWFibGVEZWNsYXJhdGlvbixcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgcHVzaE9uVG9wT2ZTdGFja0ZvckluaXRpYWxpemF0aW9uOiBub2RlLmluaXRpYWxpemF0aW9uICE9IG51bGwsXHJcbiAgICAgICAgICAgICAgICB2YXJpYWJsZTogdmFyaWFibGUsXHJcbiAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IG5vZGUuaW5pdGlhbGl6YXRpb24gPT0gbnVsbFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmhlYXBbdmFyaWFibGUuaWRlbnRpZmllcl0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIFZhcmlhYmxlIFwiICsgbm9kZS5pZGVudGlmaWVyICsgXCIgZGFyZiBpbSBzZWxiZW4gU2ljaHRiYXJrZWl0c2JlcmVpY2ggKFNjb3BlKSBuaWNodCBtZWhybWFscyBkZWZpbmllcnQgd2VyZGVuLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5oZWFwW3ZhcmlhYmxlLmlkZW50aWZpZXJdID0gdmFyaWFibGU7XHJcbiAgICAgICAgICAgIC8vIG9ubHkgZm9yIGNvZGUgY29tcGxldGlvbjpcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50U3ltYm9sVGFibGUudmFyaWFibGVNYXAuc2V0KG5vZGUuaWRlbnRpZmllciwgdmFyaWFibGUpO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLnZhcmlhYmxlTWFwLmdldChub2RlLmlkZW50aWZpZXIpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRpZSBWYXJpYWJsZSBcIiArIG5vZGUuaWRlbnRpZmllciArIFwiIGRhcmYgaW0gc2VsYmVuIFNpY2h0YmFya2VpdHNiZXJlaWNoIChTY29wZSkgbmljaHQgbWVocm1hbHMgZGVmaW5pZXJ0IHdlcmRlbi5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLnZhcmlhYmxlTWFwLnNldChub2RlLmlkZW50aWZpZXIsIHZhcmlhYmxlKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmxvY2FsVmFyaWFibGVEZWNsYXJhdGlvbixcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgcHVzaE9uVG9wT2ZTdGFja0ZvckluaXRpYWxpemF0aW9uOiBub2RlLmluaXRpYWxpemF0aW9uICE9IG51bGwsXHJcbiAgICAgICAgICAgICAgICB2YXJpYWJsZTogdmFyaWFibGUsXHJcbiAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IG5vZGUuaW5pdGlhbGl6YXRpb24gPT0gbnVsbFxyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChub2RlLmluaXRpYWxpemF0aW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgbGV0IGluaXRUeXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLmluaXRpYWxpemF0aW9uKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpbml0VHlwZSAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlLnR5cGUgPT0gdmFyVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlLnR5cGUgPSBpbml0VHlwZS50eXBlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpbml0VHlwZS50eXBlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBUeXAgZGVzIFRlcm1zIGF1ZiBkZXIgcmVjaHRlbiBTZWl0ZSBkZXMgWnV3ZWlzdW5nc29wZXJhdG9ycyAoPSkga29ubnRlIG5pY2h0IGJlc3RpbW10IHdlcmRlbi5cIiwgbm9kZS5pbml0aWFsaXphdGlvbi5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZW5zdXJlQXV0b21hdGljQ2FzdGluZyhpbml0VHlwZS50eXBlLCB2YXJpYWJsZS50eXBlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBUZXJtIHZvbSBUeXAgXCIgKyBpbml0VHlwZS50eXBlLmlkZW50aWZpZXIgKyBcIiBrYW5uIGRlciBWYXJpYWJsZSB2b20gVHlwIFwiICsgdmFyaWFibGUudHlwZS5pZGVudGlmaWVyICsgXCIgbmljaHQgenVnZW9yZG5ldCB3ZXJkZW4uXCIsIG5vZGUuaW5pdGlhbGl6YXRpb24ucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuYXNzaWdubWVudCxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5pbml0aWFsaXphdGlvbi5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbGVhdmVWYWx1ZU9uU3RhY2s6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodmFyaWFibGUudHlwZSA9PSB2YXJUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRpZSBWZXJ3ZW5kdW5nIHZvbiB2YXIgaXN0IG51ciBkYW5uIHp1bMOkc3NpZywgd2VubiBlaW5lIGxva2FsZSBWYXJpYWJsZSBpbiBlaW5lciBBbndlaXN1bmcgZGVrbGFyaWVydCB1bmQgaW5pdGlhbGlzaWVydCB3aXJkLCBhbHNvIHouQi4gdmFyIGkgPSAxMjtcIiwgbm9kZS52YXJpYWJsZVR5cGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGV0IGluaXRpYWxpemVyOiBzdHJpbmcgPSBcIiA9IG51bGxcIjtcclxuICAgICAgICAgICAgICAgIGlmICh2YXJpYWJsZS50eXBlID09IGludFByaW1pdGl2ZVR5cGUpIGluaXRpYWxpemVyID0gXCIgPSAwXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFyaWFibGUudHlwZSA9PSBkb3VibGVQcmltaXRpdmVUeXBlKSBpbml0aWFsaXplciA9IFwiID0gMC4wXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFyaWFibGUudHlwZSA9PSBib29sZWFuUHJpbWl0aXZlVHlwZSkgaW5pdGlhbGl6ZXIgPSBcIiA9IGZhbHNlXCI7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFyaWFibGUudHlwZSA9PSBjaGFyUHJpbWl0aXZlVHlwZSkgaW5pdGlhbGl6ZXIgPSBcIiA9ICcgJ1wiO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlLnR5cGUgPT0gc3RyaW5nUHJpbWl0aXZlVHlwZSkgaW5pdGlhbGl6ZXIgPSAnID0gXCJcIic7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyaWFibGUuZGVjbGFyYXRpb25FcnJvciA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIkplZGUgbG9rYWxlIFZhcmlhYmxlIHNvbGx0ZSB2b3IgaWhyZXIgZXJzdGVuIFZlcndlbmR1bmcgaW5pdGlhbGlzaWVydCB3ZXJkZW4uXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgcXVpY2tGaXg6XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogaW5pdGlhbGl6ZXIgKyBcIiBlcmfDpG56ZW5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdHNQcm92aWRlcjogKHVyaSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHBvcyA9IG5vZGUucG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2U6IHVyaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHsgc3RhcnRMaW5lTnVtYmVyOiBwb3MubGluZSwgc3RhcnRDb2x1bW46IHBvcy5jb2x1bW4gKyBwb3MubGVuZ3RoLCBlbmRMaW5lTnVtYmVyOiBwb3MubGluZSwgZW5kQ29sdW1uOiBwb3MuY29sdW1uICsgcG9zLmxlbmd0aCB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogaW5pdGlhbGl6ZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgbGV2ZWw6IFwiaW5mb1wiXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyaWFibGUudXNlZEJlZm9yZUluaXRpYWxpemF0aW9uID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB2YXJpYWJsZS5pbml0aWFsaXplZCA9IGRvbnRXYXJuV2hlbk5vSW5pdGlhbGl6YXRpb247XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc1JldHVybihub2RlOiBSZXR1cm5Ob2RlKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgbGV0IG1ldGhvZCA9IHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLm1ldGhvZDtcclxuXHJcbiAgICAgICAgaWYgKG1ldGhvZCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRWluZSByZXR1cm4tQW53ZWlzdW5nIGlzdCBudXIgaW0gS29udGV4dCBlaW5lciBNZXRob2RlIGVybGF1YnQuXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChub2RlLnRlcm0gIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKG1ldGhvZC5nZXRSZXR1cm5UeXBlKCkgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgTWV0aG9kZSBcIiArIG1ldGhvZC5pZGVudGlmaWVyICsgXCIgZXJ3YXJ0ZXQga2VpbmVuIFLDvGNrZ2FiZXdlcnQuXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCB0eXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLnRlcm0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmVuc3VyZUF1dG9tYXRpY0Nhc3RpbmcodHlwZS50eXBlLCBtZXRob2QuZ2V0UmV0dXJuVHlwZSgpLCBudWxsLCBub2RlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIE1ldGhvZGUgXCIgKyBtZXRob2QuaWRlbnRpZmllciArIFwiIGVyd2FydGV0IGVpbmVuIFLDvGNrZ2FiZXdlcnQgdm9tIFR5cCBcIiArIG1ldGhvZC5nZXRSZXR1cm5UeXBlKCkuaWRlbnRpZmllciArIFwiLiBHZWZ1bmRlbiB3dXJkZSBlaW4gV2VydCB2b20gVHlwIFwiICsgdHlwZS50eXBlLmlkZW50aWZpZXIgKyBcIi5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChtZXRob2QuZ2V0UmV0dXJuVHlwZSgpICE9IG51bGwgJiYgbWV0aG9kLmdldFJldHVyblR5cGUoKSAhPSB2b2lkUHJpbWl0aXZlVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgTWV0aG9kZSBcIiArIG1ldGhvZC5pZGVudGlmaWVyICsgXCIgZXJ3YXJ0ZXQgZWluZW4gUsO8Y2tnYWJld2VydCB2b20gVHlwIFwiICsgbWV0aG9kLmdldFJldHVyblR5cGUoKS5pZGVudGlmaWVyICsgXCIsIGRhaGVyIGlzdCBkaWUgbGVlcmUgUmV0dXJuLUFud2Vpc3VuZyAocmV0dXJuOykgbmljaHQgYXVzcmVpY2hlbmQuXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnJldHVybixcclxuICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgIGNvcHlSZXR1cm5WYWx1ZVRvU3RhY2tmcmFtZVBvczA6IG5vZGUudGVybSAhPSBudWxsLFxyXG4gICAgICAgICAgICBzdGVwRmluaXNoZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIGxlYXZlVGhpc09iamVjdE9uU3RhY2s6IGZhbHNlXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiB7IHR5cGU6IG51bGwsIGlzQXNzaWduYWJsZTogZmFsc2UsIHdpdGhSZXR1cm5TdGF0ZW1lbnQ6IHRydWUgfTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc1N3aXRjaChub2RlOiBTd2l0Y2hOb2RlKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgbGV0IGxtID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXI7XHJcblxyXG4gICAgICAgIHRoaXMucHVzaE5ld1N5bWJvbFRhYmxlKGZhbHNlLCBub2RlLnNjb3BlRnJvbSwgbm9kZS5zY29wZVRvKTtcclxuXHJcbiAgICAgICAgbGV0IGN0ID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLmNvbmRpdGlvbik7XHJcbiAgICAgICAgaWYgKGN0ID09IG51bGwgfHwgY3QudHlwZSA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBjb25kaXRpb25UeXBlID0gY3QudHlwZTtcclxuXHJcbiAgICAgICAgbGV0IGlzU3RyaW5nID0gY29uZGl0aW9uVHlwZSA9PSBzdHJpbmdQcmltaXRpdmVUeXBlIHx8IGNvbmRpdGlvblR5cGUgPT0gY2hhclByaW1pdGl2ZVR5cGU7XHJcbiAgICAgICAgbGV0IGlzSW50ZWdlciA9IGNvbmRpdGlvblR5cGUgPT0gaW50UHJpbWl0aXZlVHlwZTtcclxuICAgICAgICBsZXQgaXNFbnVtID0gY29uZGl0aW9uVHlwZSBpbnN0YW5jZW9mIEVudW07XHJcblxyXG4gICAgICAgIGlmICghKGlzU3RyaW5nIHx8IGlzSW50ZWdlciB8fCBpc0VudW0pKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVyIFVudGVyc2NoZWlkdW5nc3Rlcm1zIGVpbmVyIHN3aXRjaC1BbndlaXN1bmcgbXVzcyBkZW4gRGF0ZW50eXAgU3RyaW5nLCBjaGFyLCBpbnQgb2RlciBlbnVtIGJlc2l0emVuLiBEaWVzZXIgaGllciBpc3Qgdm9tIFR5cCBcIiArIGNvbmRpdGlvblR5cGUuaWRlbnRpZmllciwgbm9kZS5jb25kaXRpb24ucG9zaXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlzRW51bSkge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5jYXN0VmFsdWUsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5jb25kaXRpb24ucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICBuZXdUeXBlOiBpbnRQcmltaXRpdmVUeXBlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHN3aXRjaFN0YXRlbWVudDogSnVtcE9uU3dpdGNoU3RhdGVtZW50ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUua2V5d29yZFN3aXRjaCxcclxuICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgIGRlZmF1bHREZXN0aW5hdGlvbjogbnVsbCxcclxuICAgICAgICAgICAgc3dpdGNoVHlwZTogaXNTdHJpbmcgPyBcInN0cmluZ1wiIDogXCJudW1iZXJcIixcclxuICAgICAgICAgICAgZGVzdGluYXRpb25MYWJlbHM6IFtdLFxyXG4gICAgICAgICAgICBkZXN0aW5hdGlvbk1hcDoge31cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoc3dpdGNoU3RhdGVtZW50KTtcclxuXHJcbiAgICAgICAgLy8gaWYgdmFsdWUgbm90IGluY2x1ZGVkIGluIGNhc2Utc3RhdGVtZW50IGFuZCBubyBkZWZhdWx0LXN0YXRlbWVudCBwcmVzZW50OlxyXG4gICAgICAgIGxldCBlbmRMYWJlbCA9IGxtLmluc2VydEp1bXBOb2RlKFRva2VuVHlwZS5qdW1wQWx3YXlzLCBub2RlLnBvc2l0aW9uLCB0aGlzKTtcclxuXHJcbiAgICAgICAgc3dpdGNoU3RhdGVtZW50LnN0ZXBGaW5pc2hlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIGxtLnJlZ2lzdGVyU3dpdGNoU3RhdGVtZW50KHN3aXRjaFN0YXRlbWVudCk7XHJcblxyXG4gICAgICAgIHRoaXMub3BlbkJyZWFrU2NvcGUoKTtcclxuXHJcbiAgICAgICAgbGV0IHdpdGhSZXR1cm5TdGF0ZW1lbnQgPSBub2RlLmNhc2VOb2Rlcy5sZW5ndGggPiAwO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjYXNlTm9kZSBvZiBub2RlLmNhc2VOb2Rlcykge1xyXG5cclxuICAgICAgICAgICAgbGV0IGlzRGVmYXVsdCA9IGNhc2VOb2RlLmNhc2VUZXJtID09IG51bGw7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWlzRGVmYXVsdCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBjb25zdGFudDogc3RyaW5nIHwgbnVtYmVyID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNFbnVtICYmIGNhc2VOb2RlLmNhc2VUZXJtLnR5cGUgPT0gVG9rZW5UeXBlLmlkZW50aWZpZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZW46IEVudW0gPSA8RW51bT5jb25kaXRpb25UeXBlO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBpbmZvID0gZW4uaWRlbnRpZmllclRvSW5mb01hcFtjYXNlTm9kZS5jYXNlVGVybS5pZGVudGlmaWVyXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mbyA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIEVudW0tS2xhc3NlIFwiICsgY29uZGl0aW9uVHlwZS5pZGVudGlmaWVyICsgXCIgaGF0IGtlaW4gRWxlbWVudCBtaXQgZGVtIEJlemVpY2huZXIgXCIgKyBjYXNlTm9kZS5jYXNlVGVybS5pZGVudGlmaWVyLCBjYXNlTm9kZS5wb3NpdGlvbiwgXCJlcnJvclwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdGFudCA9IGluZm8ub3JkaW5hbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjYXNlVGVybSA9IHRoaXMucHJvY2Vzc05vZGUoY2FzZU5vZGUuY2FzZVRlcm0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgbHMgPSB0aGlzLmxhc3RTdGF0ZW1lbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChscy50eXBlID09IFRva2VuVHlwZS5wdXNoQ29uc3RhbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3RhbnQgPSBscy52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChscy50eXBlID09IFRva2VuVHlwZS5wdXNoRW51bVZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0YW50ID0gbHMuZW51bUNsYXNzLmdldE9yZGluYWwobHMudmFsdWVJZGVudGlmaWVyKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGFzdFN0YXRlbWVudCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjb25zdGFudCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgVGVybSBiZWkgY2FzZSBtdXNzIGtvbnN0YW50IHNlaW4uXCIsIGNhc2VOb2RlLmNhc2VUZXJtLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbGFiZWwgPSBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHN0YXRlbWVudHMgPSB0aGlzLmdlbmVyYXRlU3RhdGVtZW50cyhjYXNlTm9kZS5zdGF0ZW1lbnRzKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGVtZW50cz8ud2l0aFJldHVyblN0YXRlbWVudCA9PSBudWxsIHx8ICFzdGF0ZW1lbnRzLndpdGhSZXR1cm5TdGF0ZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB3aXRoUmV0dXJuU3RhdGVtZW50ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc3dpdGNoU3RhdGVtZW50LmRlc3RpbmF0aW9uTGFiZWxzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0YW50OiBjb25zdGFudCxcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogbGFiZWxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gZGVmYXVsdCBjYXNlXHJcbiAgICAgICAgICAgICAgICBsZXQgbGFiZWwgPSBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHN0YXRlbWVudHMgPSB0aGlzLmdlbmVyYXRlU3RhdGVtZW50cyhjYXNlTm9kZS5zdGF0ZW1lbnRzKTtcclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZW1lbnRzPy53aXRoUmV0dXJuU3RhdGVtZW50ID09IG51bGwgfHwgIXN0YXRlbWVudHMud2l0aFJldHVyblN0YXRlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpdGhSZXR1cm5TdGF0ZW1lbnQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHN3aXRjaFN0YXRlbWVudC5kZWZhdWx0RGVzdGluYXRpb24gPSBsYWJlbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHN3aXRjaFN0YXRlbWVudC5kZWZhdWx0RGVzdGluYXRpb24gPT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHdpdGhSZXR1cm5TdGF0ZW1lbnQgPSBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxtLm1hcmtKdW1wRGVzdGluYXRpb24oMSwgZW5kTGFiZWwpO1xyXG5cclxuICAgICAgICB0aGlzLmNsb3NlQnJlYWtTY29wZShlbmRMYWJlbCwgbG0pO1xyXG5cclxuICAgICAgICB0aGlzLnBvcFN5bWJvbFRhYmxlKG51bGwpO1xyXG5cclxuICAgICAgICByZXR1cm4geyB0eXBlOiBudWxsLCBpc0Fzc2lnbmFibGU6IGZhbHNlLCB3aXRoUmV0dXJuU3RhdGVtZW50OiB3aXRoUmV0dXJuU3RhdGVtZW50IH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc0lmKG5vZGU6IElmTm9kZSk6IFN0YWNrVHlwZSB7XHJcblxyXG4gICAgICAgIGxldCBsbSA9IHRoaXMuY3VycmVudFByb2dyYW0ubGFiZWxNYW5hZ2VyO1xyXG5cclxuICAgICAgICBsZXQgY29uZGl0aW9uVHlwZSA9IHRoaXMucHJvY2Vzc05vZGUobm9kZS5jb25kaXRpb24pO1xyXG5cclxuICAgICAgICB0aGlzLmNoZWNrSWZBc3NpZ25tZW50SW5zdGVkT2ZFcXVhbChub2RlLmNvbmRpdGlvbiwgY29uZGl0aW9uVHlwZT8udHlwZSk7XHJcbiAgICAgICAgaWYgKGNvbmRpdGlvblR5cGUgIT0gbnVsbCAmJiBjb25kaXRpb25UeXBlLnR5cGUgIT0gYm9vbGVhblByaW1pdGl2ZVR5cGUpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgV2VydCBkZXMgVGVybXMgaW4gS2xhbW1lcm4gaGludGVyICdpZicgbXVzcyBkZW4gRGF0ZW50eXAgYm9vbGVhbiBiZXNpdHplbi5cIiwgbm9kZS5jb25kaXRpb24ucG9zaXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGJlZ2luRWxzZSA9IGxtLmluc2VydEp1bXBOb2RlKFRva2VuVHlwZS5qdW1wSWZGYWxzZSwgbnVsbCwgdGhpcyk7XHJcblxyXG4gICAgICAgIGxldCB3aXRoUmV0dXJuU3RhdGVtZW50SWYgPSB0aGlzLmdlbmVyYXRlU3RhdGVtZW50cyhub2RlLnN0YXRlbWVudHNJZlRydWUpLndpdGhSZXR1cm5TdGF0ZW1lbnQ7XHJcblxyXG4gICAgICAgIGxldCBlbmRPZklmOiBudW1iZXI7XHJcbiAgICAgICAgaWYgKG5vZGUuc3RhdGVtZW50c0lmRmFsc2UgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBlbmRPZklmID0gbG0uaW5zZXJ0SnVtcE5vZGUoVG9rZW5UeXBlLmp1bXBBbHdheXMsIG51bGwsIHRoaXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbG0ubWFya0p1bXBEZXN0aW5hdGlvbigxLCBiZWdpbkVsc2UpO1xyXG5cclxuICAgICAgICBsZXQgd2l0aFJldHVyblN0YXRlbWVudEVsc2U6IGJvb2xlYW47XHJcbiAgICAgICAgaWYgKG5vZGUuc3RhdGVtZW50c0lmRmFsc2UgPT0gbnVsbCB8fCBub2RlLnN0YXRlbWVudHNJZkZhbHNlLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgIHdpdGhSZXR1cm5TdGF0ZW1lbnRFbHNlID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgd2l0aFJldHVyblN0YXRlbWVudEVsc2UgPSB0aGlzLmdlbmVyYXRlU3RhdGVtZW50cyhub2RlLnN0YXRlbWVudHNJZkZhbHNlKS53aXRoUmV0dXJuU3RhdGVtZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGVuZE9mSWYgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEsIGVuZE9mSWYpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogbnVsbCwgaXNBc3NpZ25hYmxlOiBmYWxzZSwgd2l0aFJldHVyblN0YXRlbWVudDogd2l0aFJldHVyblN0YXRlbWVudElmICYmIHdpdGhSZXR1cm5TdGF0ZW1lbnRFbHNlIH07XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcm9jZXNzRm9yKG5vZGU6IEZvck5vZGUpOiBTdGFja1R5cGUge1xyXG5cclxuICAgICAgICBsZXQgbG0gPSB0aGlzLmN1cnJlbnRQcm9ncmFtLmxhYmVsTWFuYWdlcjtcclxuXHJcbiAgICAgICAgdGhpcy5wdXNoTmV3U3ltYm9sVGFibGUoZmFsc2UsIG5vZGUuc2NvcGVGcm9tLCBub2RlLnNjb3BlVG8pO1xyXG5cclxuICAgICAgICB0aGlzLmdlbmVyYXRlU3RhdGVtZW50cyhub2RlLnN0YXRlbWVudHNCZWZvcmUpO1xyXG5cclxuICAgICAgICBsZXQgbGFiZWxCZWZvcmVDb25kaXRpb24gPSBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEpO1xyXG5cclxuICAgICAgICBsZXQgY29uZGl0aW9uVHlwZSA9IHRoaXMucHJvY2Vzc05vZGUobm9kZS5jb25kaXRpb24pO1xyXG5cclxuICAgICAgICBpZiAoY29uZGl0aW9uVHlwZSAhPSBudWxsICYmIGNvbmRpdGlvblR5cGUudHlwZSAhPSBib29sZWFuUHJpbWl0aXZlVHlwZSkge1xyXG4gICAgICAgICAgICB0aGlzLmNoZWNrSWZBc3NpZ25tZW50SW5zdGVkT2ZFcXVhbChub2RlLmNvbmRpdGlvbik7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVyIFdlcnQgZGVyIEJlZGluZ3VuZyBtdXNzIGRlbiBEYXRlbnR5cCBib29sZWFuIGJlc2l0emVuLlwiLCBub2RlLmNvbmRpdGlvbi5wb3NpdGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbGFiZWxBZnRlckZvckxvb3AgPSBsbS5pbnNlcnRKdW1wTm9kZShUb2tlblR5cGUuanVtcElmRmFsc2UsIG51bGwsIHRoaXMpO1xyXG5cclxuICAgICAgICB0aGlzLm9wZW5CcmVha1Njb3BlKCk7XHJcbiAgICAgICAgdGhpcy5vcGVuQ29udGludWVTY29wZSgpO1xyXG5cclxuICAgICAgICBsZXQgc3RhdGVtZW50cyA9IHRoaXMuZ2VuZXJhdGVTdGF0ZW1lbnRzKG5vZGUuc3RhdGVtZW50cyk7XHJcbiAgICAgICAgbGV0IHdpdGhSZXR1cm5TdGF0ZW1lbnQgPSBzdGF0ZW1lbnRzLndpdGhSZXR1cm5TdGF0ZW1lbnQ7XHJcblxyXG4gICAgICAgIGxldCBjb250aW51ZUxhYmVsSW5kZXggPSBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEpO1xyXG4gICAgICAgIHRoaXMuY2xvc2VDb250aW51ZVNjb3BlKGNvbnRpbnVlTGFiZWxJbmRleCwgbG0pO1xyXG4gICAgICAgIHRoaXMuZ2VuZXJhdGVTdGF0ZW1lbnRzKG5vZGUuc3RhdGVtZW50c0FmdGVyKTtcclxuXHJcbiAgICAgICAgbG0uaW5zZXJ0SnVtcE5vZGUoVG9rZW5UeXBlLmp1bXBBbHdheXMsIHN0YXRlbWVudHMuZW5kUG9zaXRpb24sIHRoaXMsIGxhYmVsQmVmb3JlQ29uZGl0aW9uKTtcclxuXHJcbiAgICAgICAgbG0ubWFya0p1bXBEZXN0aW5hdGlvbigxLCBsYWJlbEFmdGVyRm9yTG9vcCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2xvc2VCcmVha1Njb3BlKGxhYmVsQWZ0ZXJGb3JMb29wLCBsbSk7XHJcblxyXG4gICAgICAgIHRoaXMucG9wU3ltYm9sVGFibGUoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogbnVsbCwgaXNBc3NpZ25hYmxlOiBmYWxzZSwgd2l0aFJldHVyblN0YXRlbWVudDogd2l0aFJldHVyblN0YXRlbWVudCB9O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzRm9yTG9vcE92ZXJDb2xsZWN0aW9uKG5vZGU6IEZvck5vZGVPdmVyQ29sbGVjaW9uKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgbGV0IGxtID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXI7XHJcblxyXG4gICAgICAgIHRoaXMucHVzaE5ld1N5bWJvbFRhYmxlKGZhbHNlLCBub2RlLnNjb3BlRnJvbSwgbm9kZS5zY29wZVRvKTtcclxuXHJcbiAgICAgICAgLy8gcmVzZXJ2ZSBwb3NpdGlvbiBvbiBzdGFjayBmb3IgY29sbGVjdGlvblxyXG4gICAgICAgIGxldCBzdGFja1Bvc0ZvckNvbGxlY3Rpb24gPSB0aGlzLm5leHRGcmVlUmVsYXRpdmVTdGFja1BvcysrO1xyXG5cclxuICAgICAgICAvLyBhc3NpZ24gdmFsdWUgb2YgY29sbGVjdGlvbiB0ZXJtIHRvIGNvbGxlY3Rpb25cclxuICAgICAgICBsZXQgY3QgPSB0aGlzLnByb2Nlc3NOb2RlKG5vZGUuY29sbGVjdGlvbik7XHJcbiAgICAgICAgaWYgKGN0ID09IG51bGwpIHJldHVybjtcclxuICAgICAgICBsZXQgY29sbGVjdGlvblR5cGUgPSBjdC50eXBlO1xyXG5cclxuICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnBvcEFuZFN0b3JlSW50b1ZhcmlhYmxlLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5jb2xsZWN0aW9uLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICBzdGFja3Bvc09mVmFyaWFibGU6IHN0YWNrUG9zRm9yQ29sbGVjdGlvbixcclxuICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGxldCBjb2xsZWN0aW9uRWxlbWVudFR5cGU6IFR5cGU7XHJcblxyXG4gICAgICAgIGxldCBraW5kOiBcImFycmF5XCIgfCBcImludGVybmFsTGlzdFwiIHwgXCJncm91cFwiIHwgXCJ1c2VyRGVmaW5lZEl0ZXJhYmxlXCIgPSBudWxsO1xyXG5cclxuICAgICAgICBpZiAoY29sbGVjdGlvblR5cGUgaW5zdGFuY2VvZiBBcnJheVR5cGUpIHtcclxuICAgICAgICAgICAgY29sbGVjdGlvbkVsZW1lbnRUeXBlID0gY29sbGVjdGlvblR5cGUuYXJyYXlPZlR5cGU7XHJcbiAgICAgICAgICAgIGtpbmQgPSBcImFycmF5XCI7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb2xsZWN0aW9uVHlwZSBpbnN0YW5jZW9mIEtsYXNzICYmIGNvbGxlY3Rpb25UeXBlLmdldEltcGxlbWVudGVkSW50ZXJmYWNlKFwiSXRlcmFibGVcIikgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBpZiAoY29sbGVjdGlvblR5cGUubW9kdWxlLmlzU3lzdGVtTW9kdWxlKSB7XHJcbiAgICAgICAgICAgICAgICBraW5kID0gXCJpbnRlcm5hbExpc3RcIjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGtpbmQgPSBcInVzZXJEZWZpbmVkSXRlcmFibGVcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgaXRlcmFibGVJbnRlcmZhY2UgPSBjb2xsZWN0aW9uVHlwZS5nZXRJbXBsZW1lbnRlZEludGVyZmFjZShcIkl0ZXJhYmxlXCIpO1xyXG4gICAgICAgICAgICBpZihjb2xsZWN0aW9uVHlwZS50eXBlVmFyaWFibGVzLmxlbmd0aCA9PSAwKXtcclxuICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25FbGVtZW50VHlwZSA9IG9iamVjdFR5cGU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uRWxlbWVudFR5cGUgPSBjb2xsZWN0aW9uVHlwZS50eXBlVmFyaWFibGVzWzBdLnR5cGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKGNvbGxlY3Rpb25UeXBlIGluc3RhbmNlb2YgS2xhc3MgJiYgY29sbGVjdGlvblR5cGUuaWRlbnRpZmllciA9PSBcIkdyb3VwXCIpIHtcclxuICAgICAgICAgICAga2luZCA9IFwiZ3JvdXBcIjtcclxuICAgICAgICAgICAgY29sbGVjdGlvbkVsZW1lbnRUeXBlID0gdGhpcy5tb2R1bGVTdG9yZS5nZXRUeXBlKFwiU2hhcGVcIikudHlwZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiTWl0IGRlciB2ZXJlaW5mYWNodGVuIGZvci1TY2hsZWlmZSAoZm9yIGlkZW50aWZpZXIgOiBjb2xsZWN0aW9uT3JBcnJheSkga2FubiBtYW4gbnVyIMO8YmVyIEFycmF5cyBvZGVyIEtsYXNzZW4sIGRpZSBkYXMgSW50ZXJmYWNlIEl0ZXJhYmxlIGltcGxlbWVudGllcmVuLCBpdGVyaWVyZW4uXCIsIG5vZGUuY29sbGVjdGlvbi5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHZhcmlhYmxlVHlwZSA9IG5vZGUudmFyaWFibGVUeXBlLnJlc29sdmVkVHlwZTtcclxuICAgICAgICBpZiAodmFyaWFibGVUeXBlID09IG51bGwpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBsZXQgbm9DYXN0aW5nTmVlZGVkID0gdmFyaWFibGVUeXBlID09IHZhclR5cGU7XHJcbiAgICAgICAgaWYgKG5vQ2FzdGluZ05lZWRlZCkge1xyXG4gICAgICAgICAgICB2YXJpYWJsZVR5cGUgPSBjb2xsZWN0aW9uRWxlbWVudFR5cGU7XHJcbiAgICAgICAgICAgIG5vZGUudmFyaWFibGVUeXBlLnJlc29sdmVkVHlwZSA9IGNvbGxlY3Rpb25FbGVtZW50VHlwZVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICghY29sbGVjdGlvbkVsZW1lbnRUeXBlLmNhbkNhc3RUbyh2YXJpYWJsZVR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBFbGVtZW50VHlwIFwiICsgY29sbGVjdGlvbkVsZW1lbnRUeXBlLmlkZW50aWZpZXIgKyBcIiBkZXIgQ29sbGVjdGlvbiBrYW5uIG5pY2h0IGluIGRlbiBUeXAgXCIgKyB2YXJpYWJsZVR5cGUuaWRlbnRpZmllciArIFwiIGRlciBJdGVyYXRpb25zdmFyaWFibGUgXCIgKyBub2RlLnZhcmlhYmxlSWRlbnRpZmllciArIFwiIGtvbnZlcnRpZXJ0IHdlcmRlbi5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5sb2NhbFZhcmlhYmxlRGVjbGFyYXRpb24oe1xyXG4gICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUubG9jYWxWYXJpYWJsZURlY2xhcmF0aW9uLFxyXG4gICAgICAgICAgICBpZGVudGlmaWVyOiBub2RlLnZhcmlhYmxlSWRlbnRpZmllcixcclxuICAgICAgICAgICAgaW5pdGlhbGl6YXRpb246IG51bGwsXHJcbiAgICAgICAgICAgIGlzRmluYWw6IGZhbHNlLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogbm9kZS52YXJpYWJsZVBvc2l0aW9uLFxyXG4gICAgICAgICAgICB2YXJpYWJsZVR5cGU6IG5vZGUudmFyaWFibGVUeXBlXHJcbiAgICAgICAgfSwgdHJ1ZSlcclxuXHJcbiAgICAgICAgbGV0IHZhcmlhYmxlU3RhY2tQb3MgPSB0aGlzLm5leHRGcmVlUmVsYXRpdmVTdGFja1BvcyAtIDE7XHJcbiAgICAgICAgbGV0IHN0YWNrUG9zT2ZDb3VudGVyVmFyaWFibGVPckl0ZXJhdG9yID0gdGhpcy5uZXh0RnJlZVJlbGF0aXZlU3RhY2tQb3MrKztcclxuXHJcbiAgICAgICAgaWYgKGtpbmQgPT0gXCJhcnJheVwiIHx8IGtpbmQgPT0gXCJpbnRlcm5hbExpc3RcIiB8fCBraW5kID09IFwiZ3JvdXBcIikge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKFt7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuZXh0ZW5kZWRGb3JMb29wSW5pdCxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHN0YWNrUG9zT2ZDb2xsZWN0aW9uOiBzdGFja1Bvc0ZvckNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICBzdGFja1Bvc09mRWxlbWVudDogdmFyaWFibGVTdGFja1BvcyxcclxuICAgICAgICAgICAgICAgIHR5cGVPZkVsZW1lbnQ6IHZhcmlhYmxlVHlwZSxcclxuICAgICAgICAgICAgICAgIHN0YWNrUG9zT2ZDb3VudGVyOiBzdGFja1Bvc09mQ291bnRlclZhcmlhYmxlT3JJdGVyYXRvclxyXG4gICAgICAgICAgICB9XSwgdHJ1ZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gZ2V0IEl0ZXJhdG9yIGZyb20gY29sbGVjdGlvblxyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaExvY2FsVmFyaWFibGVUb1N0YWNrLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrcG9zT2ZWYXJpYWJsZTogc3RhY2tQb3NPZkNvdW50ZXJWYXJpYWJsZU9ySXRlcmF0b3IsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaExvY2FsVmFyaWFibGVUb1N0YWNrLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrcG9zT2ZWYXJpYWJsZTogc3RhY2tQb3NGb3JDb2xsZWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogZmFsc2VcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmNhbGxNZXRob2QsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBpc1N1cGVyQ2FsbDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBjb2xsZWN0aW9uVHlwZS5nZXRNZXRob2QoXCJpdGVyYXRvclwiLCBuZXcgUGFyYW1ldGVybGlzdChbXSkpLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrZnJhbWVCZWdpbjogLTFcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmFzc2lnbm1lbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGxlYXZlVmFsdWVPblN0YWNrOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfV0sIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGxhYmVsQmVmb3JlQ29uZGl0aW9uID0gbG0ubWFya0p1bXBEZXN0aW5hdGlvbigxKTtcclxuICAgICAgICBsZXQgbGFiZWxBZnRlckZvckxvb3A6IG51bWJlcjtcclxuICAgICAgICBsZXQgbGFzdFN0YXRlbWVudEJlZm9yZUNhc3Rpbmc6IFN0YXRlbWVudDtcclxuXHJcbiAgICAgICAgaWYgKGtpbmQgPT0gXCJhcnJheVwiIHx8IGtpbmQgPT0gXCJpbnRlcm5hbExpc3RcIiB8fCBraW5kID09IFwiZ3JvdXBcIikge1xyXG4gICAgICAgICAgICBsZXQganVtcE5vZGU6IEV4dGVuZGVkRm9yTG9vcENoZWNrQ291bnRlckFuZEdldEVsZW1lbnQgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuZXh0ZW5kZWRGb3JMb29wQ2hlY2tDb3VudGVyQW5kR2V0RWxlbWVudCxcclxuICAgICAgICAgICAgICAgIGtpbmQ6IGtpbmQsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS52YXJpYWJsZVBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3RhY2tQb3NPZkNvbGxlY3Rpb246IHN0YWNrUG9zRm9yQ29sbGVjdGlvbixcclxuICAgICAgICAgICAgICAgIHN0YWNrUG9zT2ZFbGVtZW50OiB2YXJpYWJsZVN0YWNrUG9zLFxyXG4gICAgICAgICAgICAgICAgc3RhY2tQb3NPZkNvdW50ZXI6IHN0YWNrUG9zT2ZDb3VudGVyVmFyaWFibGVPckl0ZXJhdG9yLFxyXG4gICAgICAgICAgICAgICAgZGVzdGluYXRpb246IDAgLy8gZ2V0cyBmaWxsZWQgaW4gbGF0ZXIsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGxhc3RTdGF0ZW1lbnRCZWZvcmVDYXN0aW5nID0ganVtcE5vZGU7XHJcbiAgICAgICAgICAgIGxhYmVsQWZ0ZXJGb3JMb29wID0gbG0ucmVnaXN0ZXJKdW1wTm9kZShqdW1wTm9kZSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKFxyXG4gICAgICAgICAgICAgICAganVtcE5vZGVcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gY2FsbCBjb2xsZWN0aW9uLmhhc05leHQoKVxyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaExvY2FsVmFyaWFibGVUb1N0YWNrLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnZhcmlhYmxlUG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhY2twb3NPZlZhcmlhYmxlOiBzdGFja1Bvc0ZvckNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2FsbE1ldGhvZCxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIGlzU3VwZXJDYWxsOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IGNvbGxlY3Rpb25UeXBlLmdldE1ldGhvZChcImhhc05leHRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW10pKSxcclxuICAgICAgICAgICAgICAgICAgICBzdGFja2ZyYW1lQmVnaW46IC0xXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICAgICAgbGFiZWxBZnRlckZvckxvb3AgPSBsbS5pbnNlcnRKdW1wTm9kZShUb2tlblR5cGUuanVtcElmRmFsc2UsIG51bGwsIHRoaXMpO1xyXG4gICAgICAgICAgICAvLyBjYWxsIGNvbGxlY3Rpb24ubmV4dCgpIGFuZCBhc3NpZ24gdG8gbG9vcCB2YXJpYWJsZVxyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaExvY2FsVmFyaWFibGVUb1N0YWNrLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrcG9zT2ZWYXJpYWJsZTogdmFyaWFibGVTdGFja1BvcyxcclxuICAgICAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoTG9jYWxWYXJpYWJsZVRvU3RhY2ssXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhY2twb3NPZlZhcmlhYmxlOiBzdGFja1Bvc0ZvckNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2FsbE1ldGhvZCxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIGlzU3VwZXJDYWxsOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IGNvbGxlY3Rpb25UeXBlLmdldE1ldGhvZChcIm5leHRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW10pKSxcclxuICAgICAgICAgICAgICAgICAgICBzdGFja2ZyYW1lQmVnaW46IC0xXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5hc3NpZ25tZW50LFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBsZWF2ZVZhbHVlT25TdGFjazogZmFsc2VcclxuICAgICAgICAgICAgICAgIH1dKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghbm9DYXN0aW5nTmVlZGVkKSB7XHJcbiAgICAgICAgICAgIGxldCBvbGRTdGF0ZW1lbnRDb3VudCA9IHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGg7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hMb2NhbFZhcmlhYmxlVG9TdGFjayxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgc3RhY2twb3NPZlZhcmlhYmxlOiB2YXJpYWJsZVN0YWNrUG9zLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5lbnN1cmVBdXRvbWF0aWNDYXN0aW5nKGNvbGxlY3Rpb25FbGVtZW50VHlwZSwgdmFyaWFibGVUeXBlKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGggPCBvbGRTdGF0ZW1lbnRDb3VudCArIDIpIHtcclxuICAgICAgICAgICAgICAgIC8vIGNhc3RpbmcgbmVlZGVkIG5vIHN0YXRlbWVudCwgc28gZGVsZXRlIHB1c2hMb2NhbFZhcmlhYmxldG9TdGFjay1TdGF0ZW1lbnRcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5wb3AoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wb3BBbmRTdG9yZUludG9WYXJpYWJsZSxcclxuICAgICAgICAgICAgICAgICAgICBzdGFja3Bvc09mVmFyaWFibGU6IHZhcmlhYmxlU3RhY2tQb3MsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiB0cnVlXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGxhc3RTdGF0ZW1lbnRCZWZvcmVDYXN0aW5nLnN0ZXBGaW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm9wZW5CcmVha1Njb3BlKCk7XHJcbiAgICAgICAgdGhpcy5vcGVuQ29udGludWVTY29wZSgpO1xyXG5cclxuICAgICAgICBsZXQgc3RhdGVtZW50cyA9IHRoaXMuZ2VuZXJhdGVTdGF0ZW1lbnRzKG5vZGUuc3RhdGVtZW50cyk7XHJcbiAgICAgICAgbGV0IHdpdGhSZXR1cm5TdGF0ZW1lbnQgPSBzdGF0ZW1lbnRzLndpdGhSZXR1cm5TdGF0ZW1lbnQ7XHJcblxyXG4gICAgICAgIGxldCBjb250aW51ZUxhYmVsSW5kZXggPSBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEpO1xyXG4gICAgICAgIHRoaXMuY2xvc2VDb250aW51ZVNjb3BlKGNvbnRpbnVlTGFiZWxJbmRleCwgbG0pO1xyXG5cclxuICAgICAgICBsbS5pbnNlcnRKdW1wTm9kZShUb2tlblR5cGUuanVtcEFsd2F5cywgc3RhdGVtZW50cy5lbmRQb3NpdGlvbiwgdGhpcywgbGFiZWxCZWZvcmVDb25kaXRpb24pO1xyXG5cclxuICAgICAgICBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEsIGxhYmVsQWZ0ZXJGb3JMb29wKTtcclxuXHJcbiAgICAgICAgdGhpcy5jbG9zZUJyZWFrU2NvcGUobGFiZWxBZnRlckZvckxvb3AsIGxtKTtcclxuXHJcbiAgICAgICAgdGhpcy5wb3BTeW1ib2xUYWJsZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4geyB0eXBlOiBudWxsLCBpc0Fzc2lnbmFibGU6IGZhbHNlLCB3aXRoUmV0dXJuU3RhdGVtZW50OiB3aXRoUmV0dXJuU3RhdGVtZW50IH07XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NXaGlsZShub2RlOiBXaGlsZU5vZGUpOiBTdGFja1R5cGUge1xyXG5cclxuICAgICAgICBsZXQgbG0gPSB0aGlzLmN1cnJlbnRQcm9ncmFtLmxhYmVsTWFuYWdlcjtcclxuXHJcbiAgICAgICAgdGhpcy5wdXNoTmV3U3ltYm9sVGFibGUoZmFsc2UsIG5vZGUuc2NvcGVGcm9tLCBub2RlLnNjb3BlVG8pO1xyXG5cclxuICAgICAgICBsZXQgY29uZGl0aW9uQmVnaW5MYWJlbCA9IGxtLm1hcmtKdW1wRGVzdGluYXRpb24oMSk7XHJcblxyXG4gICAgICAgIGxldCBjb25kaXRpb25UeXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLmNvbmRpdGlvbik7XHJcblxyXG4gICAgICAgIGlmIChjb25kaXRpb25UeXBlICE9IG51bGwgJiYgY29uZGl0aW9uVHlwZS50eXBlICE9IGJvb2xlYW5QcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hlY2tJZkFzc2lnbm1lbnRJbnN0ZWRPZkVxdWFsKG5vZGUuY29uZGl0aW9uKTtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgV2VydCBkZXMgVGVybXMgaW4gS2xhbW1lcm4gaGludGVyICd3aGlsZScgbXVzcyBkZW4gRGF0ZW50eXAgYm9vbGVhbiBiZXNpdHplbi5cIiwgbm9kZS5jb25kaXRpb24ucG9zaXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gbm9kZS5wb3NpdGlvbjtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUuY29uZGl0aW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgcG9zaXRpb24gPSBub2RlLmNvbmRpdGlvbi5wb3NpdGlvbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBhZnRlcldoaWxlU3RhdGVtZW50TGFiZWwgPSBsbS5pbnNlcnRKdW1wTm9kZShUb2tlblR5cGUuanVtcElmRmFsc2UsIHBvc2l0aW9uLCB0aGlzKTtcclxuXHJcbiAgICAgICAgdGhpcy5vcGVuQnJlYWtTY29wZSgpO1xyXG4gICAgICAgIHRoaXMub3BlbkNvbnRpbnVlU2NvcGUoKTtcclxuXHJcbiAgICAgICAgbGV0IHBjID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aDsgICAgICAgIFxyXG4gICAgICAgIGxldCBzdGF0ZW1lbnRzID0gdGhpcy5nZW5lcmF0ZVN0YXRlbWVudHMobm9kZS5zdGF0ZW1lbnRzKTtcclxuICAgICAgICBsZXQgd2l0aFJldHVyblN0YXRlbWVudCA9IHN0YXRlbWVudHMud2l0aFJldHVyblN0YXRlbWVudDtcclxuXHJcbiAgICAgICAgaWYodGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCA9PSBwYyl7XHJcbiAgICAgICAgICAgIHRoaXMuaW5zZXJ0Tm9PcChub2RlLnNjb3BlVG8sIGZhbHNlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY2xvc2VDb250aW51ZVNjb3BlKGNvbmRpdGlvbkJlZ2luTGFiZWwsIGxtKTtcclxuICAgICAgICBsbS5pbnNlcnRKdW1wTm9kZShUb2tlblR5cGUuanVtcEFsd2F5cywgc3RhdGVtZW50cy5lbmRQb3NpdGlvbiwgdGhpcywgY29uZGl0aW9uQmVnaW5MYWJlbCk7XHJcblxyXG4gICAgICAgIGxtLm1hcmtKdW1wRGVzdGluYXRpb24oMSwgYWZ0ZXJXaGlsZVN0YXRlbWVudExhYmVsKTtcclxuXHJcbiAgICAgICAgdGhpcy5jbG9zZUJyZWFrU2NvcGUoYWZ0ZXJXaGlsZVN0YXRlbWVudExhYmVsLCBsbSk7XHJcblxyXG4gICAgICAgIHRoaXMucG9wU3ltYm9sVGFibGUoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogbnVsbCwgaXNBc3NpZ25hYmxlOiBmYWxzZSwgd2l0aFJldHVyblN0YXRlbWVudDogd2l0aFJldHVyblN0YXRlbWVudCB9O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBpbnNlcnROb09wKHBvc2l0aW9uOiBUZXh0UG9zaXRpb24sIHN0ZXBGaW5pc2hlZDogYm9vbGVhbil7XHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5ub09wLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24sXHJcbiAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogc3RlcEZpbmlzaGVkXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzRG8obm9kZTogRG9XaGlsZU5vZGUpOiBTdGFja1R5cGUge1xyXG5cclxuICAgICAgICBsZXQgbG0gPSB0aGlzLmN1cnJlbnRQcm9ncmFtLmxhYmVsTWFuYWdlcjtcclxuXHJcbiAgICAgICAgdGhpcy5wdXNoTmV3U3ltYm9sVGFibGUoZmFsc2UsIG5vZGUuc2NvcGVGcm9tLCBub2RlLnNjb3BlVG8pO1xyXG5cclxuICAgICAgICBsZXQgc3RhdGVtZW50c0JlZ2luTGFiZWwgPSBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEpO1xyXG5cclxuICAgICAgICB0aGlzLm9wZW5CcmVha1Njb3BlKCk7XHJcbiAgICAgICAgdGhpcy5vcGVuQ29udGludWVTY29wZSgpO1xyXG5cclxuICAgICAgICBsZXQgcGMgPSB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHMubGVuZ3RoOyAgICAgICAgXHJcbiAgICAgICAgbGV0IHN0YXRlbWVudHMgPSB0aGlzLmdlbmVyYXRlU3RhdGVtZW50cyhub2RlLnN0YXRlbWVudHMpO1xyXG4gICAgICAgIGxldCB3aXRoUmV0dXJuU3RhdGVtZW50ID0gc3RhdGVtZW50cy53aXRoUmV0dXJuU3RhdGVtZW50O1xyXG5cclxuICAgICAgICBpZih0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHMubGVuZ3RoID09IHBjKXtcclxuICAgICAgICAgICAgdGhpcy5pbnNlcnROb09wKG5vZGUuc2NvcGVUbywgZmFsc2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGNvbnRpbnVlTGFiZWxJbmRleCA9IGxtLm1hcmtKdW1wRGVzdGluYXRpb24oMSk7XHJcbiAgICAgICAgdGhpcy5jbG9zZUNvbnRpbnVlU2NvcGUoY29udGludWVMYWJlbEluZGV4LCBsbSk7XHJcblxyXG4gICAgICAgIGxldCBjb25kaXRpb25UeXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLmNvbmRpdGlvbik7XHJcblxyXG4gICAgICAgIGlmIChjb25kaXRpb25UeXBlICE9IG51bGwgJiYgY29uZGl0aW9uVHlwZS50eXBlICE9IGJvb2xlYW5QcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hlY2tJZkFzc2lnbm1lbnRJbnN0ZWRPZkVxdWFsKG5vZGUuY29uZGl0aW9uKTtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgV2VydCBkZXMgVGVybXMgaW4gS2xhbW1lcm4gaGludGVyICd3aGlsZScgbXVzcyBkZW4gRGF0ZW50eXAgYm9vbGVhbiBiZXNpdHplbi5cIiwgbm9kZS5jb25kaXRpb24ucG9zaXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbG0uaW5zZXJ0SnVtcE5vZGUoVG9rZW5UeXBlLmp1bXBJZlRydWUsIHN0YXRlbWVudHMuZW5kUG9zaXRpb24sIHRoaXMsIHN0YXRlbWVudHNCZWdpbkxhYmVsKTtcclxuXHJcbiAgICAgICAgbGV0IGVuZExhYmVsID0gbG0ubWFya0p1bXBEZXN0aW5hdGlvbigxKTtcclxuXHJcbiAgICAgICAgdGhpcy5jbG9zZUJyZWFrU2NvcGUoZW5kTGFiZWwsIGxtKTtcclxuXHJcbiAgICAgICAgdGhpcy5wb3BTeW1ib2xUYWJsZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4geyB0eXBlOiBudWxsLCBpc0Fzc2lnbmFibGU6IGZhbHNlLCB3aXRoUmV0dXJuU3RhdGVtZW50OiB3aXRoUmV0dXJuU3RhdGVtZW50IH07XHJcblxyXG4gICAgfVxyXG5cclxuICAgIG5ld09iamVjdChub2RlOiBOZXdPYmplY3ROb2RlKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUuY2xhc3NUeXBlID09IG51bGwgfHwgbm9kZS5jbGFzc1R5cGUucmVzb2x2ZWRUeXBlID09IG51bGwpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBsZXQgcmVzb2x2ZWRUeXBlOiBLbGFzcyA9IDxLbGFzcz5ub2RlLmNsYXNzVHlwZS5yZXNvbHZlZFR5cGU7XHJcbiAgICAgICAgaWYgKCEocmVzb2x2ZWRUeXBlIGluc3RhbmNlb2YgS2xhc3MpKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKG5vZGUuY2xhc3NUeXBlLmlkZW50aWZpZXIgKyBcIiBpc3Qga2VpbmUgS2xhc3NlLCBkYWhlciBrYW5uIGRhdm9uIG1pdCAnbmV3JyBrZWluIE9iamVrdCBlcnpldWd0IHdlcmRlbi5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlc29sdmVkVHlwZS5pc0Fic3RyYWN0KSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKGAke25vZGUuY2xhc3NUeXBlLmlkZW50aWZpZXJ9IGlzdCBlaW5lIGFic3RyYWt0ZSBLbGFzc2UsIGRhaGVyIGthbm4gdm9uIGlociBtaXQgJ25ldycga2VpbiBPYmpla3QgaW5zdGFuemllcnQgd2VyZGVuLiBGYWxscyAke25vZGUuY2xhc3NUeXBlLmlkZW50aWZpZXJ9IG5pY2h0LWFic3RyYWt0ZSBLaW5ka2xhc3NlbiBiZXNpdHp0LCBrw7ZubnRlc3QgRHUgdm9uIERFTkVOIG1pdCBuZXcgT2JqZWt0ZSBpbnN0YW56aWVyZW4uLi5gLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3RoaXMucHVzaFR5cGVQb3NpdGlvbihub2RlLnJpZ2h0QnJhY2tldFBvc2l0aW9uLCBjbGFzc1R5cGUpO1xyXG5cclxuICAgICAgICBpZiAocmVzb2x2ZWRUeXBlLm1vZHVsZSAhPSB0aGlzLm1vZHVsZSAmJiByZXNvbHZlZFR5cGUudmlzaWJpbGl0eSAhPSBWaXNpYmlsaXR5LnB1YmxpYykge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRpZSBLbGFzc2UgXCIgKyByZXNvbHZlZFR5cGUuaWRlbnRpZmllciArIFwiIGlzdCBoaWVyIG5pY2h0IHNpY2h0YmFyLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBuZXdTdGF0ZW1lbnQ6IE5ld09iamVjdFN0YXRlbWVudCA9IHtcclxuICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLm5ld09iamVjdCxcclxuICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgIGNsYXNzOiByZXNvbHZlZFR5cGUsXHJcbiAgICAgICAgICAgIHN1YnNlcXVlbnRDb25zdHJ1Y3RvckNhbGw6IGZhbHNlLFxyXG4gICAgICAgICAgICBzdGVwRmluaXNoZWQ6IHRydWVcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKG5ld1N0YXRlbWVudCk7XHJcbiAgICAgICAgdGhpcy5wdXNoVHlwZVBvc2l0aW9uKG5vZGUucmlnaHRCcmFja2V0UG9zaXRpb24sIHJlc29sdmVkVHlwZSk7IC8vIHRvIGVuYWJsZSBjb2RlIGNvbXBsZXRpb24gd2hlbiB0eXBpbmcgYSBwb2ludCBhZnRlciB0aGUgY2xvc2luZyBicmFja2V0XHJcblxyXG4gICAgICAgIGxldCBwYXJhbWV0ZXJUeXBlczogVHlwZVtdID0gW107XHJcbiAgICAgICAgLy8gbGV0IHBhcmFtZXRlclN0YXRlbWVudHM6IFN0YXRlbWVudFtdW10gPSBbXTtcclxuICAgICAgICBsZXQgcG9zaXRpb25zQWZ0ZXJQYXJhbWV0ZXJTdGF0ZW1lbnRzOiBudW1iZXJbXSA9IFtdXHJcbiAgICAgICAgbGV0IGFsbFN0YXRlbWVudHMgPSB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHM7XHJcblxyXG4gICAgICAgIGlmIChub2RlLmNvbnN0cnVjdG9yT3BlcmFuZHM/Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgLy8gZm9yIChsZXQgcCBvZiBub2RlLmNvbnN0cnVjdG9yT3BlcmFuZHMpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBub2RlLmNvbnN0cnVjdG9yT3BlcmFuZHMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIGxldCBwID0gbm9kZS5jb25zdHJ1Y3Rvck9wZXJhbmRzW2pdO1xyXG4gICAgICAgICAgICAgICAgLy8gbGV0IHByb2dyYW1Qb2ludGVyID0gYWxsU3RhdGVtZW50cy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBsZXQgdHlwZU5vZGUgPSB0aGlzLnByb2Nlc3NOb2RlKHApO1xyXG4gICAgICAgICAgICAgICAgLy8gcGFyYW1ldGVyU3RhdGVtZW50cy5wdXNoKGFsbFN0YXRlbWVudHMuc3BsaWNlKHByb2dyYW1Qb2ludGVyLCBhbGxTdGF0ZW1lbnRzLmxlbmd0aCAtIHByb2dyYW1Qb2ludGVyKSk7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbnNBZnRlclBhcmFtZXRlclN0YXRlbWVudHMucHVzaChhbGxTdGF0ZW1lbnRzLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZU5vZGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtZXRlclR5cGVzLnB1c2godm9pZFByaW1pdGl2ZVR5cGUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJUeXBlcy5wdXNoKHR5cGVOb2RlLnR5cGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdXBUb1Zpc2liaWxpdHkgPSBnZXRWaXNpYmlsaXR5VXBUbyhyZXNvbHZlZFR5cGUsIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dCk7XHJcblxyXG4gICAgICAgIC8vIGxldCBtZXRob2RzID0gcmVzb2x2ZWRUeXBlLmdldE1ldGhvZHNUaGF0Rml0V2l0aENhc3RpbmcocmVzb2x2ZWRUeXBlLmlkZW50aWZpZXIsXHJcbiAgICAgICAgLy8gICAgIHBhcmFtZXRlclR5cGVzLCB0cnVlLCB1cFRvVmlzaWJpbGl0eSk7XHJcblxyXG4gICAgICAgIGxldCBtZXRob2RzID0gcmVzb2x2ZWRUeXBlLmdldENvbnN0cnVjdG9yKHBhcmFtZXRlclR5cGVzLCB1cFRvVmlzaWJpbGl0eSk7XHJcblxyXG4gICAgICAgIHRoaXMubW9kdWxlLnB1c2hNZXRob2RDYWxsUG9zaXRpb24obm9kZS5wb3NpdGlvbiwgbm9kZS5jb21tYVBvc2l0aW9ucywgcmVzb2x2ZWRUeXBlLmdldE1ldGhvZHMoVmlzaWJpbGl0eS5wdWJsaWMsIHJlc29sdmVkVHlwZS5pZGVudGlmaWVyKSwgbm9kZS5yaWdodEJyYWNrZXRQb3NpdGlvbik7XHJcblxyXG4gICAgICAgIC8vIGlmIHRoZXJlJ3Mgbm8gcGFyYW1ldGVybGVzcyBjb25zdHJ1Y3RvciB0aGVuIHJldHVybiB3aXRob3V0IGVycm9yOlxyXG4gICAgICAgIGlmIChwYXJhbWV0ZXJUeXBlcy5sZW5ndGggPiAwIHx8IHJlc29sdmVkVHlwZS5oYXNDb25zdHJ1Y3RvcigpKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAobWV0aG9kcy5lcnJvciAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihtZXRob2RzLmVycm9yLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHJlc29sdmVkVHlwZSwgaXNBc3NpZ25hYmxlOiBmYWxzZSB9OyAvLyB0cnkgdG8gY29udGludWUuLi5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IG1ldGhvZCA9IG1ldGhvZHMubWV0aG9kTGlzdFswXTtcclxuICAgICAgICAgICAgdGhpcy5wdXNoVXNhZ2VQb3NpdGlvbihub2RlLnBvc2l0aW9uLCBtZXRob2QpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHN0YXRpY0NsYXNzQ29udGV4dCA9IG51bGw7XHJcbiAgICAgICAgICAgIGxldCBjbGFzc0NvbnRleHQgPSB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZS5jbGFzc0NvbnRleHQ7XHJcbiAgICAgICAgICAgIGlmIChjbGFzc0NvbnRleHQgIT0gbnVsbCAmJiBjbGFzc0NvbnRleHQgaW5zdGFuY2VvZiBLbGFzcykge1xyXG4gICAgICAgICAgICAgICAgc3RhdGljQ2xhc3NDb250ZXh0ID0gY2xhc3NDb250ZXh0LnN0YXRpY0NsYXNzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobWV0aG9kLnZpc2liaWxpdHkgPT0gVmlzaWJpbGl0eS5wcml2YXRlICYmIHJlc29sdmVkVHlwZSAhPSBjbGFzc0NvbnRleHQgJiYgcmVzb2x2ZWRUeXBlICE9IHN0YXRpY0NsYXNzQ29udGV4dCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG9rID0gKHJlc29sdmVkVHlwZSA9PSBjbGFzc0NvbnRleHQgfHwgcmVzb2x2ZWRUeXBlICE9IHN0YXRpY0NsYXNzQ29udGV4dCB8fCAoY2xhc3NDb250ZXh0IGluc3RhbmNlb2YgU3RhdGljQ2xhc3MgJiYgcmVzb2x2ZWRUeXBlID09IGNsYXNzQ29udGV4dC5LbGFzcykpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFvaykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIEtvbnN0cnVrdG9ybWV0aG9kZSBpc3QgcHJpdmF0ZSB1bmQgZGFoZXIgaGllciBuaWNodCBzaWNodGJhci5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBkZXN0VHlwZTogVHlwZSA9IG51bGw7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyYW1ldGVyVHlwZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChpIDwgbWV0aG9kLmdldFBhcmFtZXRlckNvdW50KCkpIHsgIC8vIHBvc3NpYmxlIGVsbGlwc2lzIVxyXG4gICAgICAgICAgICAgICAgICAgIGRlc3RUeXBlID0gbWV0aG9kLmdldFBhcmFtZXRlclR5cGUoaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT0gbWV0aG9kLmdldFBhcmFtZXRlckNvdW50KCkgLSAxICYmIG1ldGhvZC5oYXNFbGxpcHNpcygpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RUeXBlID0gKDxBcnJheVR5cGU+ZGVzdFR5cGUpLmFycmF5T2ZUeXBlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgc3JjVHlwZSA9IHBhcmFtZXRlclR5cGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgLy8gZm9yIChsZXQgc3Qgb2YgcGFyYW1ldGVyU3RhdGVtZW50c1tpXSkge1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5wdXNoKHN0KTtcclxuICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICAgIGxldCBwcm9ncmFtUG9zaXRpb24gPSBhbGxTdGF0ZW1lbnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5lbnN1cmVBdXRvbWF0aWNDYXN0aW5nKHNyY1R5cGUsIGRlc3RUeXBlLCBub2RlLmNvbnN0cnVjdG9yT3BlcmFuZHNbaV0ucG9zaXRpb24sIG5vZGUuY29uc3RydWN0b3JPcGVyYW5kc1tpXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBXZXJ0IHZvbSBEYXRlbnR5cCBcIiArIHNyY1R5cGUuaWRlbnRpZmllciArIFwiIGthbm4gbmljaHQgYWxzIFBhcmFtZXRlciAoRGF0ZW50eXAgXCIgKyBkZXN0VHlwZS5pZGVudGlmaWVyICsgXCIpIHZlcndlbmRldCB3ZXJkZW4uXCIsIG5vZGUuY29uc3RydWN0b3JPcGVyYW5kc1tpXS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGFsbFN0YXRlbWVudHMubGVuZ3RoID4gcHJvZ3JhbVBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNhc3RpbmdTdGF0ZW1lbnRzID0gYWxsU3RhdGVtZW50cy5zcGxpY2UocHJvZ3JhbVBvc2l0aW9uLCBhbGxTdGF0ZW1lbnRzLmxlbmd0aCAtIHByb2dyYW1Qb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxsU3RhdGVtZW50cy5zcGxpY2UocG9zaXRpb25zQWZ0ZXJQYXJhbWV0ZXJTdGF0ZW1lbnRzW2ldLCAwLCAuLi5jYXN0aW5nU3RhdGVtZW50cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXIuY29ycmVjdFBvc2l0aW9uc0FmdGVySW5zZXJ0KHBvc2l0aW9uc0FmdGVyUGFyYW1ldGVyU3RhdGVtZW50c1tpXSwgY2FzdGluZ1N0YXRlbWVudHMubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBzdGFja2ZyYW1lRGVsdGEgPSAwO1xyXG4gICAgICAgICAgICBpZiAobWV0aG9kLmhhc0VsbGlwc2lzKCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBlbGxpcHNpc1BhcmFtZXRlckNvdW50ID0gcGFyYW1ldGVyVHlwZXMubGVuZ3RoIC0gbWV0aG9kLmdldFBhcmFtZXRlckNvdW50KCkgKyAxOyAvLyBsYXN0IHBhcmFtZXRlciBhbmQgc3Vic2VxdWVudCBvbmVzXHJcbiAgICAgICAgICAgICAgICBzdGFja2ZyYW1lRGVsdGEgPSAtIChlbGxpcHNpc1BhcmFtZXRlckNvdW50IC0gMSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUubWFrZUVsbGlwc2lzQXJyYXksXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUuY29uc3RydWN0b3JPcGVyYW5kc1ttZXRob2QuZ2V0UGFyYW1ldGVyQ291bnQoKSAtIDFdLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtZXRlckNvdW50OiBlbGxpcHNpc1BhcmFtZXRlckNvdW50LFxyXG4gICAgICAgICAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJyYXlUeXBlOiBtZXRob2QuZ2V0UGFyYW1ldGVyKG1ldGhvZC5nZXRQYXJhbWV0ZXJDb3VudCgpIC0gMSkudHlwZVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmNhbGxNZXRob2QsXHJcbiAgICAgICAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgaXNTdXBlckNhbGw6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiByZXNvbHZlZFR5cGUuZ2V0UG9zdENvbnN0cnVjdG9yQ2FsbGJhY2tzKCkgPT0gbnVsbCxcclxuICAgICAgICAgICAgICAgIHN0YWNrZnJhbWVCZWdpbjogLShwYXJhbWV0ZXJUeXBlcy5sZW5ndGggKyAxICsgc3RhY2tmcmFtZURlbHRhKSAvLyB0aGlzLW9iamVjdCBmb2xsb3dlZCBieSBwYXJhbWV0ZXJzXHJcbiAgICAgICAgICAgIH0sIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgbmV3U3RhdGVtZW50LnN1YnNlcXVlbnRDb25zdHJ1Y3RvckNhbGwgPSB0cnVlO1xyXG4gICAgICAgICAgICBuZXdTdGF0ZW1lbnQuc3RlcEZpbmlzaGVkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlc29sdmVkVHlwZS5nZXRQb3N0Q29uc3RydWN0b3JDYWxsYmFja3MoKSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnByb2Nlc3NQb3N0Q29uc3RydWN0b3JDYWxsYmFja3MsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogdHJ1ZVxyXG4gICAgICAgICAgICB9LCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7IHR5cGU6IHJlc29sdmVkVHlwZSwgaXNBc3NpZ25hYmxlOiBmYWxzZSB9O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwdXNoQXR0cmlidXRlKG5vZGU6IFNlbGVjdEFycmlidXRlTm9kZSk6IFN0YWNrVHlwZSB7XHJcblxyXG4gICAgICAgIGlmIChub2RlLm9iamVjdCA9PSBudWxsIHx8IG5vZGUuaWRlbnRpZmllciA9PSBudWxsKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgbGV0IG90ID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLm9iamVjdCk7XHJcbiAgICAgICAgaWYgKG90ID09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoJ0xpbmtzIHZvbSBQdW5rdCBzdGVodCBrZWluIE9iamVrdC4nLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIShvdC50eXBlIGluc3RhbmNlb2YgS2xhc3MgfHwgb3QudHlwZSBpbnN0YW5jZW9mIFN0YXRpY0NsYXNzIHx8IG90LnR5cGUgaW5zdGFuY2VvZiBBcnJheVR5cGUpKSB7XHJcbiAgICAgICAgICAgIGlmIChvdC50eXBlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKCdEZXIgQXVzZHJ1Y2sgbGlua3Mgdm9tIFB1bmt0IGhhdCBrZWluIEF0dHJpYnV0ICcgKyBub2RlLmlkZW50aWZpZXIgKyBcIi5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcignTGlua3Mgdm9tIFB1bmt0IHN0ZWh0IGVpbiBBdXNkcnVjayB2b20gRGF0ZW50eXAgJyArIG90LnR5cGUuaWRlbnRpZmllciArIFwiLiBEaWVzZXIgaGF0IGtlaW4gQXR0cmlidXQgXCIgKyBub2RlLmlkZW50aWZpZXIgKyBcIi5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgb2JqZWN0VHlwZTogS2xhc3MgfCBTdGF0aWNDbGFzcyB8IEFycmF5VHlwZSA9IG90LnR5cGU7XHJcblxyXG4gICAgICAgIGlmIChvYmplY3RUeXBlIGluc3RhbmNlb2YgS2xhc3MpIHtcclxuXHJcbiAgICAgICAgICAgIGxldCB2aXNpYmlsaXR5VXBUbyA9IGdldFZpc2liaWxpdHlVcFRvKG9iamVjdFR5cGUsIHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgYXR0cmlidXRlV2l0aEVycm9yID0gb2JqZWN0VHlwZS5nZXRBdHRyaWJ1dGUobm9kZS5pZGVudGlmaWVyLCB2aXNpYmlsaXR5VXBUbyk7XHJcblxyXG4gICAgICAgICAgICBsZXQgc3RhdGljQXR0cmlidXRlV2l0aEVycm9yOiB7IGF0dHJpYnV0ZTogQXR0cmlidXRlLCBlcnJvcjogc3RyaW5nLCBmb3VuZEJ1dEludmlzaWJsZTogYm9vbGVhbiwgc3RhdGljQ2xhc3M6IFN0YXRpY0NsYXNzIH1cclxuICAgICAgICAgICAgICAgID0gbnVsbDtcclxuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZVdpdGhFcnJvci5hdHRyaWJ1dGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgc3RhdGljQXR0cmlidXRlV2l0aEVycm9yID0gb2JqZWN0VHlwZS5zdGF0aWNDbGFzcy5nZXRBdHRyaWJ1dGUobm9kZS5pZGVudGlmaWVyLCB2aXNpYmlsaXR5VXBUbyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhdHRyaWJ1dGVXaXRoRXJyb3IuYXR0cmlidXRlID09IG51bGwgJiYgc3RhdGljQXR0cmlidXRlV2l0aEVycm9yLmF0dHJpYnV0ZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYXR0cmlidXRlV2l0aEVycm9yLmZvdW5kQnV0SW52aXNpYmxlIHx8ICFzdGF0aWNBdHRyaWJ1dGVXaXRoRXJyb3IuZm91bmRCdXRJbnZpc2libGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihhdHRyaWJ1dGVXaXRoRXJyb3IuZXJyb3IsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihzdGF0aWNBdHRyaWJ1dGVXaXRoRXJyb3IuZXJyb3IsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBvYmplY3RUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGlzQXNzaWduYWJsZTogZmFsc2VcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxldCBhdHRyaWJ1dGU6IEF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgICAgIGlmIChhdHRyaWJ1dGVXaXRoRXJyb3IuYXR0cmlidXRlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hBdHRyaWJ1dGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVJbmRleDogYXR0cmlidXRlV2l0aEVycm9yLmF0dHJpYnV0ZS5pbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlSWRlbnRpZmllcjogYXR0cmlidXRlV2l0aEVycm9yLmF0dHJpYnV0ZS5pZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VUaGlzT2JqZWN0OiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZVdpdGhFcnJvci5hdHRyaWJ1dGU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmRlY3JlYXNlU3RhY2twb2ludGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9wQ291bnQ6IDFcclxuICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoU3RhdGljQXR0cmlidXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8ga2xhc3M6ICg8S2xhc3M+b2JqZWN0VHlwZSkuc3RhdGljQ2xhc3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtsYXNzOiBzdGF0aWNBdHRyaWJ1dGVXaXRoRXJyb3Iuc3RhdGljQ2xhc3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUluZGV4OiBzdGF0aWNBdHRyaWJ1dGVXaXRoRXJyb3IuYXR0cmlidXRlLmluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVJZGVudGlmaWVyOiBzdGF0aWNBdHRyaWJ1dGVXaXRoRXJyb3IuYXR0cmlidXRlLmlkZW50aWZpZXJcclxuICAgICAgICAgICAgICAgICAgICB9XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlID0gc3RhdGljQXR0cmlidXRlV2l0aEVycm9yLmF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hVc2FnZVBvc2l0aW9uKG5vZGUucG9zaXRpb24sIGF0dHJpYnV0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBhdHRyaWJ1dGUudHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBpc0Fzc2lnbmFibGU6ICFhdHRyaWJ1dGUuaXNGaW5hbFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAob2JqZWN0VHlwZSBpbnN0YW5jZW9mIFN0YXRpY0NsYXNzKSB7XHJcbiAgICAgICAgICAgIC8vIFN0YXRpYyBjbGFzc1xyXG4gICAgICAgICAgICBpZiAob2JqZWN0VHlwZS5LbGFzcyBpbnN0YW5jZW9mIEVudW0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGFzdFN0YXRlbWVudCgpOyAvLyByZW1vdmUgcHVzaCBzdGF0aWMgZW51bSBjbGFzcyB0byBzdGFja1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBlbnVtSW5mbyA9IG9iamVjdFR5cGUuS2xhc3MuZW51bUluZm9MaXN0LmZpbmQoZWkgPT4gZWkuaWRlbnRpZmllciA9PSBub2RlLmlkZW50aWZpZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChlbnVtSW5mbyA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgZW51bS1LbGFzc2UgXCIgKyBvYmplY3RUeXBlLmlkZW50aWZpZXIgKyBcIiBoYXQga2VpbmVuIGVudW0tV2VydCBtaXQgZGVtIEJlemVpY2huZXIgXCIgKyBub2RlLmlkZW50aWZpZXIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoRW51bVZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIGVudW1DbGFzczogb2JqZWN0VHlwZS5LbGFzcyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZUlkZW50aWZpZXI6IG5vZGUuaWRlbnRpZmllclxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBvYmplY3RUeXBlLktsYXNzLFxyXG4gICAgICAgICAgICAgICAgICAgIGlzQXNzaWduYWJsZTogZmFsc2VcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdXBUb1Zpc2liaWxpdHkgPSBnZXRWaXNpYmlsaXR5VXBUbyhvYmplY3RUeXBlLCB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZS5jbGFzc0NvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHN0YXRpY0F0dHJpYnV0ZVdpdGhFcnJvciA9IG9iamVjdFR5cGUuZ2V0QXR0cmlidXRlKG5vZGUuaWRlbnRpZmllciwgdXBUb1Zpc2liaWxpdHkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXRpY0F0dHJpYnV0ZVdpdGhFcnJvci5hdHRyaWJ1dGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGF0aWNBdHRyaWJ1dGVXaXRoRXJyb3IuYXR0cmlidXRlLnVwZGF0ZVZhbHVlICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICB0aGlzLnJlbW92ZUxhc3RTdGF0ZW1lbnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaFN0YXRpY0F0dHJpYnV0ZUludHJpbnNpYyxcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgYXR0cmlidXRlOiBzdGF0aWNBdHRyaWJ1dGVXaXRoRXJyb3IuYXR0cmlidXRlXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIH0gZWxzZSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGFzdFN0YXRlbWVudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoU3RhdGljQXR0cmlidXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVJbmRleDogc3RhdGljQXR0cmlidXRlV2l0aEVycm9yLmF0dHJpYnV0ZS5pbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUlkZW50aWZpZXI6IHN0YXRpY0F0dHJpYnV0ZVdpdGhFcnJvci5hdHRyaWJ1dGUuaWRlbnRpZmllcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtsYXNzOiBzdGF0aWNBdHRyaWJ1dGVXaXRoRXJyb3Iuc3RhdGljQ2xhc3NcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFVzYWdlUG9zaXRpb24obm9kZS5wb3NpdGlvbiwgc3RhdGljQXR0cmlidXRlV2l0aEVycm9yLmF0dHJpYnV0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBzdGF0aWNBdHRyaWJ1dGVXaXRoRXJyb3IuYXR0cmlidXRlLnR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQXNzaWduYWJsZTogIXN0YXRpY0F0dHJpYnV0ZVdpdGhFcnJvci5hdHRyaWJ1dGUuaXNGaW5hbFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3Ioc3RhdGljQXR0cmlidXRlV2l0aEVycm9yLmVycm9yLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBvYmplY3RUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0Fzc2lnbmFibGU6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICBpZiAobm9kZS5pZGVudGlmaWVyICE9IFwibGVuZ3RoXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKCdEZXIgV2VydCB2b20gRGF0ZW50eXAgJyArIG90LnR5cGUuaWRlbnRpZmllciArIFwiIGhhdCBrZWluIEF0dHJpYnV0IFwiICsgbm9kZS5pZGVudGlmaWVyLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoQXJyYXlMZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvblxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGxldCBlbGVtZW50OiBBdHRyaWJ1dGUgPSBuZXcgQXR0cmlidXRlKFwibGVuZ3RoXCIsIGludFByaW1pdGl2ZVR5cGUsIG51bGwsIHRydWUsIFZpc2liaWxpdHkucHVibGljLCB0cnVlLCBcIkzDpG5nZSBkZXMgQXJyYXlzXCIpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tb2R1bGUuYWRkSWRlbnRpZmllclBvc2l0aW9uKG5vZGUucG9zaXRpb24sIGVsZW1lbnQpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgICAgICBpc0Fzc2lnbmFibGU6IGZhbHNlXHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVzaFRoaXNPclN1cGVyKG5vZGU6IFRoaXNOb2RlIHwgU3VwZXJOb2RlLCBpc1N1cGVyOiBib29sZWFuKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgbGV0IGNsYXNzQ29udGV4dCA9IHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dDtcclxuXHJcbiAgICAgICAgaWYgKGlzU3VwZXIgJiYgY2xhc3NDb250ZXh0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgY2xhc3NDb250ZXh0ID0gY2xhc3NDb250ZXh0LmJhc2VDbGFzcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBtZXRob2RDb250ZXh0ID0gdGhpcy5jdXJyZW50U3ltYm9sVGFibGUubWV0aG9kO1xyXG5cclxuICAgICAgICBpZiAoY2xhc3NDb250ZXh0ID09IG51bGwgfHwgbWV0aG9kQ29udGV4dCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGFzIE9iamVrdCBcIiArIChpc1N1cGVyID8gXCJzdXBlclwiIDogXCJ0aGlzXCIpICsgXCIgZXhpc3RpZXJ0IG51ciBpbm5lcmhhbGIgZWluZXIgTWV0aG9kZW5kZWtsYXJhdGlvbi5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hMb2NhbFZhcmlhYmxlVG9TdGFjayxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgc3RhY2twb3NPZlZhcmlhYmxlOiAwXHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICB0aGlzLnB1c2hUeXBlUG9zaXRpb24obm9kZS5wb3NpdGlvbiwgY2xhc3NDb250ZXh0KTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogY2xhc3NDb250ZXh0LCBpc0Fzc2lnbmFibGU6IGZhbHNlLCBpc1N1cGVyOiBpc1N1cGVyIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzdXBlcmNvbnN0cnVjdG9yQ2FsbChub2RlOiBTdXBlcmNvbnN0cnVjdG9yQ2FsbE5vZGUgfCBDb25zdHJ1Y3RvckNhbGxOb2RlKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgbGV0IGNsYXNzQ29udGV4dCA9IHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dDtcclxuXHJcbiAgICAgICAgbGV0IGlzU3VwZXJDb25zdHJ1Y3RvckNhbGw6IGJvb2xlYW4gPSBub2RlLnR5cGUgPT0gVG9rZW5UeXBlLnN1cGVyQ29uc3RydWN0b3JDYWxsO1xyXG5cclxuICAgICAgICBpZiAoaXNTdXBlckNvbnN0cnVjdG9yQ2FsbCkge1xyXG4gICAgICAgICAgICBpZiAoY2xhc3NDb250ZXh0Py5iYXNlQ2xhc3MgPT0gbnVsbCB8fCBjbGFzc0NvbnRleHQuYmFzZUNsYXNzLmlkZW50aWZpZXIgPT0gXCJPYmplY3RcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgS2xhc3NlIGlzdCBudXIgS2luZGtsYXNzZSBkZXIgS2xhc3NlIE9iamVjdCwgZGFoZXIgaXN0IGRlciBBdWZydWYgZGVzIFN1cGVya29uc3RydWt0b3JzIG5pY2h0IG3DtmdsaWNoLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IG1ldGhvZENvbnRleHQgPSB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZS5tZXRob2Q7XHJcblxyXG4gICAgICAgIGlmIChjbGFzc0NvbnRleHQgPT0gbnVsbCB8fCBtZXRob2RDb250ZXh0ID09IG51bGwgfHwgIW1ldGhvZENvbnRleHQuaXNDb25zdHJ1Y3Rvcikge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkVpbiBBdWZydWYgZGVzIEtvbnN0cnVrdG9ycyBvZGVyIGRlcyBTdXBlcmtvbnN0cnVjdG9ycyBpc3QgbnVyIGlubmVyaGFsYiBkZXMgS29uc3RydWt0b3JzIGVpbmVyIEtsYXNzZSBtw7ZnbGljaC5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIGxldCBzdXBlcmNsYXNzVHlwZTogS2xhc3MgfCBTdGF0aWNDbGFzcztcclxuXHJcbiAgICAgICAgaWYgKGlzU3VwZXJDb25zdHJ1Y3RvckNhbGwpIHtcclxuICAgICAgICAgICAgc3VwZXJjbGFzc1R5cGUgPSA8S2xhc3M+Y2xhc3NDb250ZXh0LmJhc2VDbGFzcztcclxuICAgICAgICAgICAgaWYgKHN1cGVyY2xhc3NUeXBlIGluc3RhbmNlb2YgU3RhdGljQ2xhc3MpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiU3RhdGlzY2hlIE1ldGhvZGVuIGhhYmVuIGtlaW5lIHN1cGVyLU1ldGhvZGVuYXVmcnVmZS5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyB0eXBlOiBudWxsLCBpc0Fzc2lnbmFibGU6IGZhbHNlIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHN1cGVyY2xhc3NUeXBlID09IG51bGwpIHN1cGVyY2xhc3NUeXBlID0gPEtsYXNzPnRoaXMubW9kdWxlU3RvcmUuZ2V0VHlwZShcIk9iamVjdFwiKS50eXBlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN1cGVyY2xhc3NUeXBlID0gPEtsYXNzPmNsYXNzQ29udGV4dDtcclxuICAgICAgICAgICAgaWYgKHN1cGVyY2xhc3NUeXBlIGluc3RhbmNlb2YgU3RhdGljQ2xhc3MpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiU3RhdGlzY2hlIE1ldGhvZGVuIGhhYmVuIGtlaW5lIHRoaXMtTWV0aG9kZW5hdWZydWZlLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IG51bGwsIGlzQXNzaWduYWJsZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUHVzaCB0aGlzLW9iamVjdCB0byBzdGFjazpcclxuICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hMb2NhbFZhcmlhYmxlVG9TdGFjayxcclxuICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgIHN0YWNrcG9zT2ZWYXJpYWJsZTogMFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgcGFyYW1ldGVyVHlwZXM6IFR5cGVbXSA9IFtdO1xyXG5cclxuICAgICAgICBpZiAobm9kZS5vcGVyYW5kcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxldCBlcnJvckluT3BlcmFuZHM6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgICAgICAgICAgZm9yIChsZXQgcCBvZiBub2RlLm9wZXJhbmRzKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcHQgPSB0aGlzLnByb2Nlc3NOb2RlKHApO1xyXG4gICAgICAgICAgICAgICAgaWYgKHB0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJUeXBlcy5wdXNoKHB0LnR5cGUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBlcnJvckluT3BlcmFuZHMgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChlcnJvckluT3BlcmFuZHMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGlzQXNzaWduYWJsZTogZmFsc2UgfTsgLy8gdHJ5IHRvIGNvbnRpbnVlLi4uXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBtZXRob2RzID0gc3VwZXJjbGFzc1R5cGUuZ2V0Q29uc3RydWN0b3IocGFyYW1ldGVyVHlwZXMsIFZpc2liaWxpdHkucHJvdGVjdGVkKTtcclxuXHJcbiAgICAgICAgdGhpcy5tb2R1bGUucHVzaE1ldGhvZENhbGxQb3NpdGlvbihub2RlLnBvc2l0aW9uLCBub2RlLmNvbW1hUG9zaXRpb25zLCBzdXBlcmNsYXNzVHlwZS5nZXRNZXRob2RzKFZpc2liaWxpdHkucHJvdGVjdGVkLCBzdXBlcmNsYXNzVHlwZS5pZGVudGlmaWVyKSxcclxuICAgICAgICAgICAgbm9kZS5yaWdodEJyYWNrZXRQb3NpdGlvbik7XHJcblxyXG4gICAgICAgIGlmIChtZXRob2RzLmVycm9yICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IobWV0aG9kcy5lcnJvciwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGlzQXNzaWduYWJsZTogZmFsc2UgfTsgLy8gdHJ5IHRvIGNvbnRpbnVlLi4uXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbWV0aG9kID0gbWV0aG9kcy5tZXRob2RMaXN0WzBdO1xyXG5cclxuICAgICAgICB0aGlzLnB1c2hVc2FnZVBvc2l0aW9uKG5vZGUucG9zaXRpb24sIG1ldGhvZCk7XHJcblxyXG4gICAgICAgIGxldCBzdGFja2ZyYW1lRGVsdGEgPSAwO1xyXG4gICAgICAgIGlmIChtZXRob2QuaGFzRWxsaXBzaXMoKSkge1xyXG4gICAgICAgICAgICBsZXQgZWxsaXBzaXNQYXJhbWV0ZXJDb3VudCA9IHBhcmFtZXRlclR5cGVzLmxlbmd0aCAtIG1ldGhvZC5nZXRQYXJhbWV0ZXJDb3VudCgpICsgMTsgLy8gbGFzdCBwYXJhbWV0ZXIgYW5kIHN1YnNlcXVlbnQgb25lc1xyXG4gICAgICAgICAgICBzdGFja2ZyYW1lRGVsdGEgPSAtIChlbGxpcHNpc1BhcmFtZXRlckNvdW50IC0gMSk7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLm1ha2VFbGxpcHNpc0FycmF5LFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUub3BlcmFuZHNbbWV0aG9kLmdldFBhcmFtZXRlckNvdW50KCkgLSAxXS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIHBhcmFtZXRlckNvdW50OiBlbGxpcHNpc1BhcmFtZXRlckNvdW50LFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGFycmF5VHlwZTogbWV0aG9kLmdldFBhcmFtZXRlcihtZXRob2QuZ2V0UGFyYW1ldGVyQ291bnQoKSAtIDEpLnR5cGVcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2FsbE1ldGhvZCxcclxuICAgICAgICAgICAgbWV0aG9kOiBtZXRob2QsXHJcbiAgICAgICAgICAgIGlzU3VwZXJDYWxsOiBpc1N1cGVyQ29uc3RydWN0b3JDYWxsLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgc3RhY2tmcmFtZUJlZ2luOiAtKHBhcmFtZXRlclR5cGVzLmxlbmd0aCArIDEgKyBzdGFja2ZyYW1lRGVsdGEpIC8vIHRoaXMtb2JqZWN0IGZvbGxvd2VkIGJ5IHBhcmFtZXRlcnNcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBQYWJzdCwgMjEuMTAuMjAyMDpcclxuICAgICAgICAvLyBzdXBlciBtZXRob2QgaXMgY29uc3RydWN0b3IgPT4gcmV0dXJucyBub3RoaW5nIGV2ZW4gaWYgbWV0aG9kLmdldFJldHVyblR5cGUoKSBpcyBjbGFzcyBvYmplY3RcclxuICAgICAgICAvLyByZXR1cm4geyB0eXBlOiBtZXRob2QuZ2V0UmV0dXJuVHlwZSgpLCBpc0Fzc2lnbmFibGU6IGZhbHNlIH07XHJcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogbnVsbCwgaXNBc3NpZ25hYmxlOiBmYWxzZSB9O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBpbmNyZW1lbnREZWNyZW1lbnRCZWZvcmVPckFmdGVyKG5vZGU6IEluY3JlbWVudERlY3JlbWVudE5vZGUpOiBTdGFja1R5cGUge1xyXG4gICAgICAgIGxldCB0eXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLm9wZXJhbmQpO1xyXG5cclxuICAgICAgICBpZiAodHlwZSA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmICghdHlwZS5pc0Fzc2lnbmFibGUpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgT3BlcmF0b3JlbiArKyB1bmQgLS0ga8O2bm5lbiBudXIgYXVmIFZhcmlhYmxlbiBhbmdld2VuZGV0IHdlcmRlbiwgbmljaHQgYXVmIGtvbnN0YW50ZSBXZXJ0ZSBvZGVyIFLDvGNrZ2FiZXdlcnRlIHZvbiBNZXRob2Rlbi5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiB0eXBlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0eXBlLnR5cGUuY2FuQ2FzdFRvKGZsb2F0UHJpbWl0aXZlVHlwZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgT3BlcmF0b3JlbiArKyB1bmQgLS0ga8O2bm5lbiBudXIgYXVmIFphaGxlbiBhbmdld2VuZGV0IHdlcmRlbiwgbmljaHQgYXVmIFdlcnRlIGRlcyBEYXRlbnR5cHMgXCIgKyB0eXBlLnR5cGUuaWRlbnRpZmllciwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybiB0eXBlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgIHR5cGU6IG5vZGUudHlwZSxcclxuICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgIGluY3JlbWVudERlY3JlbWVudEJ5OiBub2RlLm9wZXJhdG9yID09IFRva2VuVHlwZS5kb3VibGVNaW51cyA/IC0gMSA6IDFcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0eXBlO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZWxlY3RBcnJheUVsZW1lbnQobm9kZTogU2VsZWN0QXJyYXlFbGVtZW50Tm9kZSk6IFN0YWNrVHlwZSB7XHJcblxyXG4gICAgICAgIGxldCBhcnJheVR5cGUgPSB0aGlzLnByb2Nlc3NOb2RlKG5vZGUub2JqZWN0KTsgLy8gcHVzaCBhcnJheS1vYmplY3QgXHJcbiAgICAgICAgbGV0IGluZGV4VHlwZSA9IHRoaXMucHJvY2Vzc05vZGUobm9kZS5pbmRleCk7IC8vIHB1c2ggaW5kZXhcclxuXHJcbiAgICAgICAgaWYgKGFycmF5VHlwZSA9PSBudWxsIHx8IGluZGV4VHlwZSA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmICghKGFycmF5VHlwZS50eXBlIGluc3RhbmNlb2YgQXJyYXlUeXBlKSkge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRlciBUeXAgZGVyIFZhcmlhYmxlbiBpc3Qga2VpbiBBcnJheSwgZGFoZXIgaXN0IFtdIG5pY2h0IHp1bMOkc3NpZy4gXCIsIG5vZGUub2JqZWN0LnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm1vZHVsZS5hZGRJZGVudGlmaWVyUG9zaXRpb24oe1xyXG4gICAgICAgICAgICBsaW5lOiBub2RlLnBvc2l0aW9uLmxpbmUsXHJcbiAgICAgICAgICAgIGNvbHVtbjogbm9kZS5wb3NpdGlvbi5jb2x1bW4gKyBub2RlLnBvc2l0aW9uLmxlbmd0aCxcclxuICAgICAgICAgICAgbGVuZ3RoOiAwICAvLyBNb2R1bGUuZ2V0VHlwZUF0UG9zaXRpb24gbmVlZHMgbGVuZ3RoID09IDAgaGVyZSB0byBrbm93IHRoYXQgdGhpcyB0eXBlLXBvc2l0aW9uIGlzIG5vdCBpbiBzdGF0aWMgY29udGV4dCBmb3IgY29kZSBjb21wbGV0aW9uXHJcbiAgICAgICAgfSwgYXJyYXlUeXBlLnR5cGUuYXJyYXlPZlR5cGUpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuZW5zdXJlQXV0b21hdGljQ2FzdGluZyhpbmRleFR5cGUudHlwZSwgaW50UHJpbWl0aXZlVHlwZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJBbHMgSW5kZXggZWluZXMgQXJyYXlzIHdpcmQgZWluIGdhbnp6YWhsaWdlciBXZXJ0IGVyd2FydGV0LiBHZWZ1bmRlbiB3dXJkZSBlaW4gV2VydCB2b20gVHlwIFwiICsgaW5kZXhUeXBlLnR5cGUuaWRlbnRpZmllciArIFwiLlwiLCBub2RlLmluZGV4LnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogKDxBcnJheVR5cGU+YXJyYXlUeXBlLnR5cGUpLmFycmF5T2ZUeXBlLCBpc0Fzc2lnbmFibGU6IGFycmF5VHlwZS5pc0Fzc2lnbmFibGUgfTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnNlbGVjdEFycmF5RWxlbWVudCxcclxuICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb25cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICByZXR1cm4geyB0eXBlOiAoPEFycmF5VHlwZT5hcnJheVR5cGUudHlwZSkuYXJyYXlPZlR5cGUsIGlzQXNzaWduYWJsZTogYXJyYXlUeXBlLmlzQXNzaWduYWJsZSB9O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwdXNoVHlwZVBvc2l0aW9uKHBvc2l0aW9uOiBUZXh0UG9zaXRpb24sIHR5cGU6IFR5cGUpIHtcclxuICAgICAgICBpZiAocG9zaXRpb24gPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIGlmIChwb3NpdGlvbi5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uID0ge1xyXG4gICAgICAgICAgICAgICAgbGluZTogcG9zaXRpb24ubGluZSxcclxuICAgICAgICAgICAgICAgIGNvbHVtbjogcG9zaXRpb24uY29sdW1uICsgcG9zaXRpb24ubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgbGVuZ3RoOiAwXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5tb2R1bGUuYWRkSWRlbnRpZmllclBvc2l0aW9uKHBvc2l0aW9uLCB0eXBlKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1c2hVc2FnZVBvc2l0aW9uKHBvc2l0aW9uOiBUZXh0UG9zaXRpb24sIGVsZW1lbnQ6IEtsYXNzIHwgSW50ZXJmYWNlIHwgTWV0aG9kIHwgQXR0cmlidXRlIHwgVmFyaWFibGUpIHtcclxuXHJcbiAgICAgICAgdGhpcy5tb2R1bGUuYWRkSWRlbnRpZmllclBvc2l0aW9uKHBvc2l0aW9uLCBlbGVtZW50KTtcclxuXHJcbiAgICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBQcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBwb3NpdGlvbkxpc3Q6IFRleHRQb3NpdGlvbltdID0gZWxlbWVudC51c2FnZVBvc2l0aW9ucy5nZXQodGhpcy5tb2R1bGUpO1xyXG4gICAgICAgIGlmIChwb3NpdGlvbkxpc3QgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBwb3NpdGlvbkxpc3QgPSBbXTtcclxuICAgICAgICAgICAgZWxlbWVudC51c2FnZVBvc2l0aW9ucy5zZXQodGhpcy5tb2R1bGUsIHBvc2l0aW9uTGlzdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwb3NpdGlvbkxpc3QucHVzaChwb3NpdGlvbik7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJlc29sdmVJZGVudGlmaWVyKG5vZGU6IElkZW50aWZpZXJOb2RlKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUuaWRlbnRpZmllciA9PSBudWxsKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgbGV0IHZhcmlhYmxlID0gdGhpcy5maW5kTG9jYWxWYXJpYWJsZShub2RlLmlkZW50aWZpZXIpO1xyXG4gICAgICAgIGlmICh2YXJpYWJsZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hMb2NhbFZhcmlhYmxlVG9TdGFjayxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgc3RhY2twb3NPZlZhcmlhYmxlOiB2YXJpYWJsZS5zdGFja1Bvc1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgdGhpcy5wdXNoVXNhZ2VQb3NpdGlvbihub2RlLnBvc2l0aW9uLCB2YXJpYWJsZSk7XHJcbiAgICAgICAgICAgIG5vZGUudmFyaWFibGUgPSB2YXJpYWJsZTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IHZhcmlhYmxlLnR5cGUsIGlzQXNzaWduYWJsZTogIXZhcmlhYmxlLmlzRmluYWwgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmhlYXAgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBsZXQgdmFyaWFibGUgPSB0aGlzLmhlYXBbbm9kZS5pZGVudGlmaWVyXTtcclxuICAgICAgICAgICAgaWYgKHZhcmlhYmxlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoRnJvbUhlYXBUb1N0YWNrLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IG5vZGUuaWRlbnRpZmllclxyXG4gICAgICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hVc2FnZVBvc2l0aW9uKG5vZGUucG9zaXRpb24sIHZhcmlhYmxlKTtcclxuICAgICAgICAgICAgICAgIG5vZGUudmFyaWFibGUgPSB2YXJpYWJsZTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogdmFyaWFibGUudHlwZSwgaXNBc3NpZ25hYmxlOiAhdmFyaWFibGUuaXNGaW5hbCB9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGF0dHJpYnV0ZSA9IHRoaXMuZmluZEF0dHJpYnV0ZShub2RlLmlkZW50aWZpZXIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgIGlmIChhdHRyaWJ1dGUgIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZS5pc1N0YXRpYykge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNjID0gdGhpcy5jdXJyZW50U3ltYm9sVGFibGUuY2xhc3NDb250ZXh0O1xyXG4gICAgICAgICAgICAgICAgbGV0IHNjYyA9IChjYyBpbnN0YW5jZW9mIFN0YXRpY0NsYXNzKSA/IGNjIDogY2Muc3RhdGljQ2xhc3M7XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHNjYyAhPSBudWxsICYmIHNjYy5hdHRyaWJ1dGVzLmluZGV4T2YoYXR0cmlidXRlKSA9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNjYyA9IHNjYy5iYXNlQ2xhc3M7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hTdGF0aWNBdHRyaWJ1dGUsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAga2xhc3M6IHNjYyxcclxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVJbmRleDogYXR0cmlidXRlLmluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUlkZW50aWZpZXI6IGF0dHJpYnV0ZS5pZGVudGlmaWVyXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoQXR0cmlidXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZUluZGV4OiBhdHRyaWJ1dGUuaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlSWRlbnRpZmllcjogYXR0cmlidXRlLmlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgdXNlVGhpc09iamVjdDogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBub2RlLmF0dHJpYnV0ZSA9IGF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIHRoaXMucHVzaFVzYWdlUG9zaXRpb24obm9kZS5wb3NpdGlvbiwgYXR0cmlidXRlKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IGF0dHJpYnV0ZS50eXBlLCBpc0Fzc2lnbmFibGU6ICFhdHRyaWJ1dGUuaXNGaW5hbCB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGtsYXNzTW9kdWxlID0gdGhpcy5tb2R1bGVTdG9yZS5nZXRUeXBlKG5vZGUuaWRlbnRpZmllcik7XHJcbiAgICAgICAgaWYgKGtsYXNzTW9kdWxlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgbGV0IGtsYXNzID0ga2xhc3NNb2R1bGUudHlwZTtcclxuICAgICAgICAgICAgaWYgKCEoa2xhc3MgaW5zdGFuY2VvZiBLbGFzcyB8fCBrbGFzcyBpbnN0YW5jZW9mIEludGVyZmFjZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVyIFR5cCBcIiArIGtsYXNzLmlkZW50aWZpZXIgKyBcIiBoYXQga2VpbmUgc3RhdGlzY2hlbiBBdHRyaWJ1dGUvTWV0aG9kZW4uXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hTdGF0aWNDbGFzc09iamVjdCxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBrbGFzczoga2xhc3NcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFVzYWdlUG9zaXRpb24obm9kZS5wb3NpdGlvbiwga2xhc3MpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZToga2xhc3MgaW5zdGFuY2VvZiBLbGFzcyA/IGtsYXNzLnN0YXRpY0NsYXNzIDoga2xhc3MsXHJcbiAgICAgICAgICAgICAgICAgICAgaXNBc3NpZ25hYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgdHlwZToga2xhc3MsXHJcbiAgICAgICAgICAgICAgICBpc0Fzc2lnbmFibGU6IGZhbHNlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVyIEJlemVpY2huZXIgXCIgKyBub2RlLmlkZW50aWZpZXIgKyBcIiBpc3QgaGllciBuaWNodCBiZWthbm50LlwiLCBub2RlLnBvc2l0aW9uKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZmluZExvY2FsVmFyaWFibGUoaWRlbnRpZmllcjogc3RyaW5nKTogVmFyaWFibGUge1xyXG4gICAgICAgIGxldCBzdCA9IHRoaXMuY3VycmVudFN5bWJvbFRhYmxlO1xyXG5cclxuICAgICAgICB3aGlsZSAoc3QgIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgbGV0IHZhcmlhYmxlID0gc3QudmFyaWFibGVNYXAuZ2V0KGlkZW50aWZpZXIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhcmlhYmxlICE9IG51bGwgJiYgdmFyaWFibGUuc3RhY2tQb3MgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhcmlhYmxlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzdCA9IHN0LnBhcmVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBmaW5kQXR0cmlidXRlKGlkZW50aWZpZXI6IHN0cmluZywgcG9zaXRpb246IFRleHRQb3NpdGlvbik6IEF0dHJpYnV0ZSB7XHJcbiAgICAgICAgbGV0IGNsYXNzQ29udGV4dCA9IHRoaXMuY3VycmVudFN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dDtcclxuICAgICAgICBpZiAoY2xhc3NDb250ZXh0ID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYXR0cmlidXRlID0gY2xhc3NDb250ZXh0LmdldEF0dHJpYnV0ZShpZGVudGlmaWVyLCBWaXNpYmlsaXR5LnByaXZhdGUpO1xyXG4gICAgICAgIGlmIChhdHRyaWJ1dGUuYXR0cmlidXRlICE9IG51bGwpIHJldHVybiBhdHRyaWJ1dGUuYXR0cmlidXRlO1xyXG5cclxuICAgICAgICBpZiAoY2xhc3NDb250ZXh0IGluc3RhbmNlb2YgS2xhc3MpIHtcclxuICAgICAgICAgICAgbGV0IHN0YXRpY0F0dHJpYnV0ZSA9IGNsYXNzQ29udGV4dC5zdGF0aWNDbGFzcy5nZXRBdHRyaWJ1dGUoaWRlbnRpZmllciwgVmlzaWJpbGl0eS5wcml2YXRlKTtcclxuICAgICAgICAgICAgaWYgKHN0YXRpY0F0dHJpYnV0ZS5hdHRyaWJ1dGUgIT0gbnVsbCkgcmV0dXJuIHN0YXRpY0F0dHJpYnV0ZS5hdHRyaWJ1dGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB0aGlzLnB1c2hFcnJvcihhdHRyaWJ1dGUuZXJyb3IsIHBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY2FsbE1ldGhvZChub2RlOiBNZXRob2RjYWxsTm9kZSk6IFN0YWNrVHlwZSB7XHJcblxyXG4gICAgICAgIGxldCBvYmplY3ROb2RlOiBTdGFja1R5cGUgPSBudWxsO1xyXG5cclxuICAgICAgICBpZiAobm9kZS5vYmplY3QgPT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgLy8gY2FsbCBtZXRob2Qgb2YgdGhpcy1jbGFzcz9cclxuXHJcbiAgICAgICAgICAgIGxldCB0aGlzQ2xhc3MgPSB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZS5jbGFzc0NvbnRleHQ7XHJcbiAgICAgICAgICAgIGlmICh0aGlzQ2xhc3MgIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoTG9jYWxWYXJpYWJsZVRvU3RhY2ssXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhY2twb3NPZlZhcmlhYmxlOiAwXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBvYmplY3ROb2RlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHRoaXNDbGFzcyxcclxuICAgICAgICAgICAgICAgICAgICBpc0Fzc2lnbmFibGU6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJFaW4gTWV0aG9kZW5hdWZydWYgKGhpZXI6IFwiICsgbm9kZS5pZGVudGlmaWVyICtcclxuICAgICAgICAgICAgICAgICAgICBcIikgb2huZSBQdW5rdHNjaHJlaWJ3ZWlzZSBpc3QgbnVyIGlubmVyaGFsYiBhbmRlcmVyIE1ldGhvZGVuIG3DtmdsaWNoLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG9iamVjdE5vZGUgPSB0aGlzLnByb2Nlc3NOb2RlKG5vZGUub2JqZWN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChvYmplY3ROb2RlID09IG51bGwpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBpZiAoIShcclxuICAgICAgICAgICAgKG9iamVjdE5vZGUudHlwZSBpbnN0YW5jZW9mIEtsYXNzKSB8fCAob2JqZWN0Tm9kZS50eXBlIGluc3RhbmNlb2YgU3RhdGljQ2xhc3MpIHx8XHJcbiAgICAgICAgICAgIChvYmplY3ROb2RlLnR5cGUgaW5zdGFuY2VvZiBJbnRlcmZhY2UgJiYgKG5vZGUub2JqZWN0W1widmFyaWFibGVcIl0gIT0gbnVsbCB8fCBub2RlLm9iamVjdFtcImF0dHJpYnV0ZVwiXSAhPSBudWxsIHx8IG5vZGUub2JqZWN0W1widGVybUluc2lkZUJyYWNrZXRzXCJdICE9IG51bGwpKSB8fCAob2JqZWN0Tm9kZS50eXBlIGluc3RhbmNlb2YgRW51bSkpKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAob2JqZWN0Tm9kZS50eXBlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiV2VydGUgZGllc2VzIERhdGVudHlwcyBiZXNpdHplbiBrZWluZSBNZXRob2Rlbi5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob2JqZWN0Tm9kZS50eXBlIGluc3RhbmNlb2YgSW50ZXJmYWNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoJ01ldGhvZGVuZGVmaW5pdGlvbmVuIGVpbmVzIEludGVyZmFjZXMga8O2bm5lbiBuaWNodCBzdGF0aXNjaCBhdWZnZXJ1ZmVuIHdlcmRlbi4nLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoJ1dlcnRlIGRlcyBEYXRlbnR5cHMgJyArIG9iamVjdE5vZGUudHlwZS5pZGVudGlmaWVyICsgXCIgYmVzaXR6ZW4ga2VpbmUgTWV0aG9kZW4uXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBvYmplY3RUeXBlOiBLbGFzcyB8IFN0YXRpY0NsYXNzIHwgSW50ZXJmYWNlID0gPGFueT5vYmplY3ROb2RlLnR5cGU7XHJcblxyXG4gICAgICAgIGxldCBwb3NCZWZvcmVQYXJhbWV0ZXJFdmFsdWF0aW9uID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgbGV0IHBhcmFtZXRlclR5cGVzOiBUeXBlW10gPSBbXTtcclxuICAgICAgICAvLyBsZXQgcGFyYW1ldGVyU3RhdGVtZW50czogU3RhdGVtZW50W11bXSA9IFtdO1xyXG4gICAgICAgIGxldCBwb3NpdGlvbnNBZnRlclBhcmFtZXRlclN0YXRlbWVudHM6IG51bWJlcltdID0gW11cclxuXHJcbiAgICAgICAgbGV0IGFsbFN0YXRlbWVudHMgPSB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHM7XHJcbiAgICAgICAgaWYgKG5vZGUub3BlcmFuZHMgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAvLyBmb3IgKGxldCBwIG9mIG5vZGUub3BlcmFuZHMpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBub2RlLm9wZXJhbmRzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcCA9IG5vZGUub3BlcmFuZHNbal07XHJcbiAgICAgICAgICAgICAgICAvLyBsZXQgcHJvZ3JhbVBvaW50ZXIgPSBhbGxTdGF0ZW1lbnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIGxldCB0eXBlTm9kZSA9IHRoaXMucHJvY2Vzc05vZGUocCk7XHJcbiAgICAgICAgICAgICAgICAvLyBwYXJhbWV0ZXJTdGF0ZW1lbnRzLnB1c2goYWxsU3RhdGVtZW50cy5zcGxpY2UocHJvZ3JhbVBvaW50ZXIsIGFsbFN0YXRlbWVudHMubGVuZ3RoIC0gcHJvZ3JhbVBvaW50ZXIpKTtcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uc0FmdGVyUGFyYW1ldGVyU3RhdGVtZW50cy5wdXNoKGFsbFN0YXRlbWVudHMubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlTm9kZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyVHlwZXMucHVzaCh2b2lkUHJpbWl0aXZlVHlwZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtZXRlclR5cGVzLnB1c2godHlwZU5vZGUudHlwZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBsZXQgbWV0aG9kczogeyBlcnJvcjogc3RyaW5nLCBtZXRob2RMaXN0OiBNZXRob2RbXSB9O1xyXG4gICAgICAgIGlmIChvYmplY3RUeXBlIGluc3RhbmNlb2YgSW50ZXJmYWNlKSB7XHJcbiAgICAgICAgICAgIG1ldGhvZHMgPSBvYmplY3RUeXBlLmdldE1ldGhvZHNUaGF0Rml0V2l0aENhc3Rpbmcobm9kZS5pZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgcGFyYW1ldGVyVHlwZXMsIGZhbHNlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgdXBUb1Zpc2liaWxpdHkgPSBnZXRWaXNpYmlsaXR5VXBUbyhvYmplY3RUeXBlLCB0aGlzLmN1cnJlbnRTeW1ib2xUYWJsZS5jbGFzc0NvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgbWV0aG9kcyA9IG9iamVjdFR5cGUuZ2V0TWV0aG9kc1RoYXRGaXRXaXRoQ2FzdGluZyhub2RlLmlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJUeXBlcywgZmFsc2UsIHVwVG9WaXNpYmlsaXR5KTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm1vZHVsZS5wdXNoTWV0aG9kQ2FsbFBvc2l0aW9uKG5vZGUucG9zaXRpb24sIG5vZGUuY29tbWFQb3NpdGlvbnMsIG9iamVjdFR5cGUuZ2V0TWV0aG9kcyhWaXNpYmlsaXR5LnByaXZhdGUsIG5vZGUuaWRlbnRpZmllciksIG5vZGUucmlnaHRCcmFja2V0UG9zaXRpb24pO1xyXG5cclxuICAgICAgICBpZiAobWV0aG9kcy5lcnJvciAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKG1ldGhvZHMuZXJyb3IsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlLCBpc0Fzc2lnbmFibGU6IGZhbHNlIH07IC8vIHRyeSB0byBjb250aW51ZS4uLlxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IG1ldGhvZCA9IG1ldGhvZHMubWV0aG9kTGlzdFswXTtcclxuXHJcbiAgICAgICAgdGhpcy5wdXNoVXNhZ2VQb3NpdGlvbihub2RlLnBvc2l0aW9uLCBtZXRob2QpO1xyXG5cclxuICAgICAgICAvLyBZb3UgQ0FOIGNhbGwgYSBzdGF0aWMgbWV0aG9kIG9uIGEgb2JqZWN0Li4uLCBzbzpcclxuICAgICAgICBpZiAobWV0aG9kLmlzU3RhdGljICYmIG9iamVjdFR5cGUgaW5zdGFuY2VvZiBLbGFzcyAmJiBvYmplY3RUeXBlLmlkZW50aWZpZXIgIT0gXCJQcmludFN0cmVhbVwiKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRXMgaXN0IGtlaW4gZ3V0ZXIgUHJvZ3JhbW1pZXJzdGlsLCBzdGF0aXNjaGUgTWV0aG9kZW4gZWluZXIgS2xhc3NlIG1pdGhpbGZlIGVpbmVzIE9iamVrdHMgYXVmenVydWZlbi4gQmVzc2VyIHfDpHJlIGhpZXIgXCIgKyBvYmplY3RUeXBlLmlkZW50aWZpZXIgKyBcIi5cIiArIG1ldGhvZC5pZGVudGlmaWVyICsgXCIoLi4uKS5cIiwgbm9kZS5wb3NpdGlvbiwgXCJpbmZvXCIpO1xyXG4gICAgICAgICAgICB0aGlzLmluc2VydFN0YXRlbWVudHMocG9zQmVmb3JlUGFyYW1ldGVyRXZhbHVhdGlvbiwgW3tcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5kZWNyZWFzZVN0YWNrcG9pbnRlcixcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgcG9wQ291bnQ6IDFcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hTdGF0aWNDbGFzc09iamVjdCxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAga2xhc3M6IG9iamVjdFR5cGVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBkZXN0VHlwZTogVHlwZSA9IG51bGw7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJhbWV0ZXJUeXBlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoaSA8IG1ldGhvZC5nZXRQYXJhbWV0ZXJDb3VudCgpKSB7ICAvLyBwb3NzaWJsZSBlbGxpcHNpcyFcclxuICAgICAgICAgICAgICAgIGRlc3RUeXBlID0gbWV0aG9kLmdldFBhcmFtZXRlclR5cGUoaSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA9PSBtZXRob2QuZ2V0UGFyYW1ldGVyQ291bnQoKSAtIDEgJiYgbWV0aG9kLmhhc0VsbGlwc2lzKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBkZXN0VHlwZSA9ICg8QXJyYXlUeXBlPmRlc3RUeXBlKS5hcnJheU9mVHlwZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTWFya2VyIDFcclxuICAgICAgICAgICAgbGV0IHNyY1R5cGUgPSBwYXJhbWV0ZXJUeXBlc1tpXTtcclxuICAgICAgICAgICAgLy8gZm9yIChsZXQgc3Qgb2YgcGFyYW1ldGVyU3RhdGVtZW50c1tpXSkge1xyXG4gICAgICAgICAgICAvLyAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzLnB1c2goc3QpO1xyXG4gICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgIGxldCBwcm9ncmFtUG9zaXRpb24gPSBhbGxTdGF0ZW1lbnRzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5lbnN1cmVBdXRvbWF0aWNDYXN0aW5nKHNyY1R5cGUsIGRlc3RUeXBlLCBub2RlLm9wZXJhbmRzW2ldLnBvc2l0aW9uLCBub2RlLm9wZXJhbmRzW2ldKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgV2VydCB2b20gRGF0ZW50eXAgXCIgKyBzcmNUeXBlLmlkZW50aWZpZXIgKyBcIiBrYW5uIG5pY2h0IGFscyBQYXJhbWV0ZXIgKERhdGVudHlwIFwiICsgZGVzdFR5cGUuaWRlbnRpZmllciArIFwiKSB2ZXJ3ZW5kZXQgd2VyZGVuLlwiLCBub2RlLm9wZXJhbmRzW2ldLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGFsbFN0YXRlbWVudHMubGVuZ3RoID4gcHJvZ3JhbVBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2FzdGluZ1N0YXRlbWVudHMgPSBhbGxTdGF0ZW1lbnRzLnNwbGljZShwcm9ncmFtUG9zaXRpb24sIGFsbFN0YXRlbWVudHMubGVuZ3RoIC0gcHJvZ3JhbVBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIGFsbFN0YXRlbWVudHMuc3BsaWNlKHBvc2l0aW9uc0FmdGVyUGFyYW1ldGVyU3RhdGVtZW50c1tpXSwgMCwgLi4uY2FzdGluZ1N0YXRlbWVudHMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXIuY29ycmVjdFBvc2l0aW9uc0FmdGVySW5zZXJ0KHBvc2l0aW9uc0FmdGVyUGFyYW1ldGVyU3RhdGVtZW50c1tpXSwgY2FzdGluZ1N0YXRlbWVudHMubGVuZ3RoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIC8vIGlmIChzcmNUeXBlIGluc3RhbmNlb2YgUHJpbWl0aXZlVHlwZSAmJiBkZXN0VHlwZSBpbnN0YW5jZW9mIFByaW1pdGl2ZVR5cGUpIHtcclxuICAgICAgICAgICAgLy8gICAgIGlmIChzcmNUeXBlLmdldENhc3RJbmZvcm1hdGlvbihkZXN0VHlwZSkubmVlZHNTdGF0ZW1lbnQpIHtcclxuICAgICAgICAgICAgLy8gICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmNhc3RWYWx1ZSxcclxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgcG9zaXRpb246IG51bGwsXHJcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIG5ld1R5cGU6IGRlc3RUeXBlLFxyXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBzdGFja1Bvc1JlbGF0aXZlOiAtcGFyYW1ldGVyVHlwZXMubGVuZ3RoICsgMSArIGlcclxuICAgICAgICAgICAgLy8gICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzdGFja2ZyYW1lRGVsdGEgPSAwO1xyXG4gICAgICAgIGlmIChtZXRob2QuaGFzRWxsaXBzaXMoKSkge1xyXG4gICAgICAgICAgICBsZXQgZWxsaXBzaXNQYXJhbWV0ZXJDb3VudCA9IHBhcmFtZXRlclR5cGVzLmxlbmd0aCAtIG1ldGhvZC5nZXRQYXJhbWV0ZXJDb3VudCgpICsgMTsgLy8gbGFzdCBwYXJhbWV0ZXIgYW5kIHN1YnNlcXVlbnQgb25lc1xyXG4gICAgICAgICAgICBzdGFja2ZyYW1lRGVsdGEgPSAtIChlbGxpcHNpc1BhcmFtZXRlckNvdW50IC0gMSk7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLm1ha2VFbGxpcHNpc0FycmF5LFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUub3BlcmFuZHNbbWV0aG9kLmdldFBhcmFtZXRlckNvdW50KCkgLSAxXS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIHBhcmFtZXRlckNvdW50OiBlbGxpcHNpc1BhcmFtZXRlckNvdW50LFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGFycmF5VHlwZTogbWV0aG9kLmdldFBhcmFtZXRlcihtZXRob2QuZ2V0UGFyYW1ldGVyQ291bnQoKSAtIDEpLnR5cGVcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtZXRob2QudmlzaWJpbGl0eSAhPSBWaXNpYmlsaXR5LnB1YmxpYykge1xyXG5cclxuICAgICAgICAgICAgbGV0IHZpc2libGUgPSB0cnVlO1xyXG4gICAgICAgICAgICBsZXQgY2xhc3NDb250ZXh0ID0gdGhpcy5jdXJyZW50U3ltYm9sVGFibGUuY2xhc3NDb250ZXh0O1xyXG4gICAgICAgICAgICBpZiAoY2xhc3NDb250ZXh0ID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmIChjbGFzc0NvbnRleHQgIT0gb2JqZWN0VHlwZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICEoY2xhc3NDb250ZXh0IGluc3RhbmNlb2YgS2xhc3MgJiYgY2xhc3NDb250ZXh0LmltcGxlbWVudHMuaW5kZXhPZig8SW50ZXJmYWNlPm9iamVjdFR5cGUpID4gMCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWV0aG9kLnZpc2liaWxpdHkgPT0gVmlzaWJpbGl0eS5wcml2YXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmxlID0gY2xhc3NDb250ZXh0Lmhhc0FuY2VzdG9yT3JJcyg8S2xhc3MgfCBTdGF0aWNDbGFzcz5vYmplY3RUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCF2aXNpYmxlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRpZSBNZXRob2RlIFwiICsgbWV0aG9kLmlkZW50aWZpZXIgKyBcIiBpc3QgYW4gZGllc2VyIFN0ZWxsZSBkZXMgUHJvZ3JhbW1zIG5pY2h0IHNpY2h0YmFyLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGlzU3lzdGVtTWV0aG9kOiBib29sZWFuID0gZmFsc2U7ICAgICAgICBcclxuICAgICAgICBpZiAobWV0aG9kLmlzU3RhdGljICYmIG9iamVjdE5vZGUudHlwZSAhPSBudWxsICYmXHJcbiAgICAgICAgICAgIChvYmplY3ROb2RlLnR5cGUgaW5zdGFuY2VvZiBTdGF0aWNDbGFzcykpe1xyXG4gICAgICAgICAgICAgICAgbGV0IGNsYXNzSWRlbnRpZmllciA9IG9iamVjdE5vZGUudHlwZS5LbGFzcy5pZGVudGlmaWVyO1xyXG5cclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoY2xhc3NJZGVudGlmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIklucHV0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmNhbGxJbnB1dE1ldGhvZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFja2ZyYW1lQmVnaW46IC0ocGFyYW1ldGVyVHlwZXMubGVuZ3RoICsgMSArIHN0YWNrZnJhbWVEZWx0YSkgLy8gdGhpcy1vYmplY3QgZm9sbG93ZWQgYnkgcGFyYW1ldGVyc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNTeXN0ZW1NZXRob2QgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiU3lzdGVtVG9vbHNcIjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUm9ib3RcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoW1wicGF1c2VcIiwgXCJ3YXJ0ZW5cIl0uaW5kZXhPZihtZXRob2QuaWRlbnRpZmllcikgPj0gMCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnNldFBhdXNlRHVyYXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucGF1c2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNTeXN0ZW1NZXRob2QgPSB0cnVlOyAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmKCFpc1N5c3RlbU1ldGhvZCkge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hTdGF0ZW1lbnRzKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5jYWxsTWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBtZXRob2QsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIGlzU3VwZXJDYWxsOiBvYmplY3ROb2RlLmlzU3VwZXIgPT0gbnVsbCA/IGZhbHNlIDogb2JqZWN0Tm9kZS5pc1N1cGVyLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3RhY2tmcmFtZUJlZ2luOiAtKHBhcmFtZXRlclR5cGVzLmxlbmd0aCArIDEgKyBzdGFja2ZyYW1lRGVsdGEpIC8vIHRoaXMtb2JqZWN0IGZvbGxvd2VkIGJ5IHBhcmFtZXRlcnNcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcblxyXG4gICAgICAgIHRoaXMucHVzaFR5cGVQb3NpdGlvbihub2RlLnJpZ2h0QnJhY2tldFBvc2l0aW9uLCBtZXRob2QuZ2V0UmV0dXJuVHlwZSgpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogbWV0aG9kLmdldFJldHVyblR5cGUoKSwgaXNBc3NpZ25hYmxlOiBmYWxzZSB9O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwdXNoQ29uc3RhbnQobm9kZTogQ29uc3RhbnROb2RlKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgbGV0IHR5cGU6IFR5cGU7XHJcblxyXG4gICAgICAgIHN3aXRjaCAobm9kZS5jb25zdGFudFR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuaW50ZWdlckNvbnN0YW50OlxyXG4gICAgICAgICAgICAgICAgdHlwZSA9IGludFByaW1pdGl2ZVR5cGU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuYm9vbGVhbkNvbnN0YW50OlxyXG4gICAgICAgICAgICAgICAgdHlwZSA9IGJvb2xlYW5QcmltaXRpdmVUeXBlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmZsb2F0aW5nUG9pbnRDb25zdGFudDpcclxuICAgICAgICAgICAgICAgIHR5cGUgPSBmbG9hdFByaW1pdGl2ZVR5cGU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuc3RyaW5nQ29uc3RhbnQ6XHJcbiAgICAgICAgICAgICAgICB0eXBlID0gc3RyaW5nUHJpbWl0aXZlVHlwZTtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFR5cGVQb3NpdGlvbihub2RlLnBvc2l0aW9uLCB0eXBlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5jaGFyQ29uc3RhbnQ6XHJcbiAgICAgICAgICAgICAgICB0eXBlID0gY2hhclByaW1pdGl2ZVR5cGU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZE51bGw6XHJcbiAgICAgICAgICAgICAgICB0eXBlID0gbnVsbFR5cGVcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoQ29uc3RhbnQsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiB0eXBlLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgdmFsdWU6IG5vZGUuY29uc3RhbnRcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICByZXR1cm4geyB0eXBlOiB0eXBlLCBpc0Fzc2lnbmFibGU6IGZhbHNlIH07XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NCaW5hcnlPcChub2RlOiBCaW5hcnlPcE5vZGUpOiBTdGFja1R5cGUge1xyXG5cclxuICAgICAgICBsZXQgaXNBc3NpZ25tZW50ID0gQ29kZUdlbmVyYXRvci5hc3NpZ25tZW50T3BlcmF0b3JzLmluZGV4T2Yobm9kZS5vcGVyYXRvcikgPj0gMDtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUub3BlcmF0b3IgPT0gVG9rZW5UeXBlLnRlcm5hcnlPcGVyYXRvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wcm9jZXNzVGVybmFyeU9wZXJhdG9yKG5vZGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGxlZnRUeXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLmZpcnN0T3BlcmFuZCwgaXNBc3NpZ25tZW50KTtcclxuXHJcbiAgICAgICAgbGV0IHByb2dyYW1Qb3NBZnRlckxlZnRPcG9lcmFuZCA9IHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGxldCBsYXp5RXZhbHVhdGlvbkRlc3QgPSBudWxsO1xyXG4gICAgICAgIGlmIChub2RlLm9wZXJhdG9yID09IFRva2VuVHlwZS5hbmQpIHtcclxuICAgICAgICAgICAgbGF6eUV2YWx1YXRpb25EZXN0ID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5sYWJlbE1hbmFnZXIuaW5zZXJ0SnVtcE5vZGUoVG9rZW5UeXBlLmp1bXBJZkZhbHNlQW5kTGVhdmVPblN0YWNrLCBub2RlLmZpcnN0T3BlcmFuZC5wb3NpdGlvbiwgdGhpcyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLm9wZXJhdG9yID09IFRva2VuVHlwZS5vcikge1xyXG4gICAgICAgICAgICBsYXp5RXZhbHVhdGlvbkRlc3QgPSB0aGlzLmN1cnJlbnRQcm9ncmFtLmxhYmVsTWFuYWdlci5pbnNlcnRKdW1wTm9kZShUb2tlblR5cGUuanVtcElmVHJ1ZUFuZExlYXZlT25TdGFjaywgbm9kZS5maXJzdE9wZXJhbmQucG9zaXRpb24sIHRoaXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJpZ2h0VHlwZSA9IHRoaXMucHJvY2Vzc05vZGUobm9kZS5zZWNvbmRPcGVyYW5kKTtcclxuXHJcbiAgICAgICAgaWYgKGxlZnRUeXBlID09IG51bGwgfHwgbGVmdFR5cGUudHlwZSA9PSBudWxsIHx8IHJpZ2h0VHlwZSA9PSBudWxsIHx8IHJpZ2h0VHlwZS50eXBlID09IG51bGwpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBpZiAoaXNBc3NpZ25tZW50KSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5lbnN1cmVBdXRvbWF0aWNDYXN0aW5nKHJpZ2h0VHlwZS50eXBlLCBsZWZ0VHlwZS50eXBlLCBub2RlLnBvc2l0aW9uLCBub2RlLmZpcnN0T3BlcmFuZCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVyIFdlcnQgdm9tIERhdGVudHlwIFwiICsgcmlnaHRUeXBlLnR5cGUuaWRlbnRpZmllciArIFwiIGF1ZiBkZXIgcmVjaHRlbiBTZWl0ZSBrYW5uIGRlciBWYXJpYWJsZW4gYXVmIGRlciBsaW5rZW4gU2VpdGUgKERhdGVudHlwIFwiICsgbGVmdFR5cGUudHlwZS5pZGVudGlmaWVyICsgXCIpIG5pY2h0IHp1Z2V3aWVzZW4gd2VyZGVuLlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0VHlwZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFsZWZ0VHlwZS5pc0Fzc2lnbmFibGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVtIFRlcm0vZGVyIFZhcmlhYmxlbiBhdWYgZGVyIGxpbmtlbiBTZWl0ZSBkZXMgWnV3ZWlzdW5nc29wZXJhdG9ycyAoPSkga2FubiBrZWluIFdlcnQgenVnZXdpZXNlbiB3ZXJkZW4uXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgc3RhdGVtZW50OiBBc3NpZ25tZW50U3RhdGVtZW50ID0ge1xyXG4gICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBub2RlLm9wZXJhdG9yLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBsZWF2ZVZhbHVlT25TdGFjazogdHJ1ZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyhzdGF0ZW1lbnQpO1xyXG5cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBsZWZ0VHlwZTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChub2RlLmZpcnN0T3BlcmFuZC50eXBlID09IFRva2VuVHlwZS5pZGVudGlmaWVyICYmIG5vZGUuZmlyc3RPcGVyYW5kLnZhcmlhYmxlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGxldCB2ID0gbm9kZS5maXJzdE9wZXJhbmQudmFyaWFibGU7XHJcbiAgICAgICAgICAgICAgICBpZiAodi5pbml0aWFsaXplZCAhPSBudWxsICYmICF2LmluaXRpYWxpemVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdi51c2VkQmVmb3JlSW5pdGlhbGl6YXRpb24gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIFZhcmlhYmxlIFwiICsgdi5pZGVudGlmaWVyICsgXCIgd2lyZCBoaWVyIGJlbnV0enQgYmV2b3Igc2llIGluaXRpYWxpc2llcnQgd3VyZGUuXCIsIG5vZGUucG9zaXRpb24sIFwiaW5mb1wiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHJlc3VsdFR5cGUgPSBsZWZ0VHlwZS50eXBlLmdldFJlc3VsdFR5cGUobm9kZS5vcGVyYXRvciwgcmlnaHRUeXBlLnR5cGUpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHVuYm94YWJsZUxlZnQgPSBsZWZ0VHlwZS50eXBlW1widW5ib3hhYmxlQXNcIl07XHJcbiAgICAgICAgICAgIGxldCB1bmJveGFibGVSaWdodCA9IHJpZ2h0VHlwZS50eXBlW1widW5ib3hhYmxlQXNcIl07XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzdWx0VHlwZSA9PSBudWxsICYmICh1bmJveGFibGVMZWZ0ICE9IG51bGwgfHwgdW5ib3hhYmxlUmlnaHQgIT0gbnVsbCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBsZWZ0VHlwZXM6IFR5cGVbXSA9IHVuYm94YWJsZUxlZnQgPT0gbnVsbCA/IFtsZWZ0VHlwZS50eXBlXSA6IHVuYm94YWJsZUxlZnQ7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmlnaHRUeXBlczogVHlwZVtdID0gdW5ib3hhYmxlUmlnaHQgPT0gbnVsbCA/IFtyaWdodFR5cGUudHlwZV0gOiB1bmJveGFibGVSaWdodDtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBsdCBvZiBsZWZ0VHlwZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBydCBvZiByaWdodFR5cGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFR5cGUgPSBsdC5nZXRSZXN1bHRUeXBlKG5vZGUub3BlcmF0b3IsIHJ0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdFR5cGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdFR5cGUudHlwZSA9IGx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHRUeXBlLnR5cGUgPSBydDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHRUeXBlICE9IG51bGwpIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTaXR1YXRpb24gT2JqZWN0ICsgU3RyaW5nOiBpbnNlcnQgdG9TdHJpbmcoKS1NZXRob2RcclxuICAgICAgICAgICAgaWYgKHJlc3VsdFR5cGUgPT0gbnVsbCAmJiBub2RlLm9wZXJhdG9yID09IFRva2VuVHlwZS5wbHVzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobGVmdFR5cGUudHlwZSBpbnN0YW5jZW9mIEtsYXNzICYmIHJpZ2h0VHlwZS50eXBlID09IHN0cmluZ1ByaW1pdGl2ZVR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluc2VydFN0YXRlbWVudHMocHJvZ3JhbVBvc0FmdGVyTGVmdE9wb2VyYW5kLCB0aGlzLmdldFRvU3RyaW5nU3RhdGVtZW50KGxlZnRUeXBlLnR5cGUsIG5vZGUuZmlyc3RPcGVyYW5kLnBvc2l0aW9uKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0VHlwZSA9IHN0cmluZ1ByaW1pdGl2ZVR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgbGVmdFR5cGUudHlwZSA9IHN0cmluZ1ByaW1pdGl2ZVR5cGU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJpZ2h0VHlwZS50eXBlIGluc3RhbmNlb2YgS2xhc3MgJiYgbGVmdFR5cGUudHlwZSA9PSBzdHJpbmdQcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh0aGlzLmdldFRvU3RyaW5nU3RhdGVtZW50KHJpZ2h0VHlwZS50eXBlLCBub2RlLmZpcnN0T3BlcmFuZC5wb3NpdGlvbikpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFR5cGUgPSBzdHJpbmdQcmltaXRpdmVUeXBlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgaWYgKG5vZGUub3BlcmF0b3IgaW4gW1Rva2VuVHlwZS5hbmQsIFRva2VuVHlwZS5vcl0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tJZkFzc2lnbm1lbnRJbnN0ZWRPZkVxdWFsKG5vZGUuZmlyc3RPcGVyYW5kKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tJZkFzc2lnbm1lbnRJbnN0ZWRPZkVxdWFsKG5vZGUuc2Vjb25kT3BlcmFuZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZXN1bHRUeXBlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGxldCBiaXRPcGVyYXRvcnMgPSBbVG9rZW5UeXBlLmFtcGVyc2FuZCwgVG9rZW5UeXBlLk9SXTtcclxuICAgICAgICAgICAgICAgIGxldCBib29sZWFuT3BlcmF0b3JzID0gW1wiJiYgKGJvb2xlc2NoZXIgVU5ELU9wZXJhdG9yKVwiLCBcInx8IChib29sZXNjaGVyIE9ERVItT3BlcmF0b3IpXCJdO1xyXG4gICAgICAgICAgICAgICAgbGV0IGJldHRlck9wZXJhdG9ycyA9IFtcIiYgJlwiLCBcInx8XCJdO1xyXG4gICAgICAgICAgICAgICAgbGV0IG9wSW5kZXggPSBiaXRPcGVyYXRvcnMuaW5kZXhPZihub2RlLm9wZXJhdG9yKTtcclxuICAgICAgICAgICAgICAgIGlmIChvcEluZGV4ID49IDAgJiYgbGVmdFR5cGUudHlwZSA9PSBib29sZWFuUHJpbWl0aXZlVHlwZSAmJiByaWdodFR5cGUudHlwZSA9PSBib29sZWFuUHJpbWl0aXZlVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGllIE9wZXJhdGlvbiBcIiArIFRva2VuVHlwZVJlYWRhYmxlW25vZGUub3BlcmF0b3JdICsgXCIgaXN0IGbDvHIgZGllIE9wZXJhbmRlbiBkZXIgVHlwZW4gXCIgKyBsZWZ0VHlwZS50eXBlLmlkZW50aWZpZXIgKyBcIiB1bmQgXCIgKyByaWdodFR5cGUudHlwZS5pZGVudGlmaWVyICsgXCIgbmljaHQgZGVmaW5pZXJ0LiBEdSBtZWludGVzdCB3YWhyc2NoZWlubGljaCBkZW4gT3BlcmF0b3IgXCIgKyBib29sZWFuT3BlcmF0b3JzW29wSW5kZXhdICsgXCIuXCIsIG5vZGUucG9zaXRpb24sIFwiZXJyb3JcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiT3BlcmF0b3IgXCIgKyBiZXR0ZXJPcGVyYXRvcnNbb3BJbmRleF0gKyBcIiB2ZXJ3ZW5kZW4gc3RhdHQgXCIgKyBUb2tlblR5cGVSZWFkYWJsZVtub2RlLm9wZXJhdG9yXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRzUHJvdmlkZXI6ICh1cmkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZTogdXJpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlOiB7IHN0YXJ0TGluZU51bWJlcjogbm9kZS5wb3NpdGlvbi5saW5lLCBzdGFydENvbHVtbjogbm9kZS5wb3NpdGlvbi5jb2x1bW4sIGVuZExpbmVOdW1iZXI6IG5vZGUucG9zaXRpb24ubGluZSwgZW5kQ29sdW1uOiBub2RlLnBvc2l0aW9uLmNvbHVtbiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFRva2VuVHlwZVJlYWRhYmxlW25vZGUub3BlcmF0b3JdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWUgT3BlcmF0aW9uIFwiICsgVG9rZW5UeXBlUmVhZGFibGVbbm9kZS5vcGVyYXRvcl0gKyBcIiBpc3QgZsO8ciBkaWUgT3BlcmFuZGVuIGRlciBUeXBlbiBcIiArIGxlZnRUeXBlLnR5cGUuaWRlbnRpZmllciArIFwiIHVuZCBcIiArIHJpZ2h0VHlwZS50eXBlLmlkZW50aWZpZXIgKyBcIiBuaWNodCBkZWZpbmllcnQuXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxlZnRUeXBlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgdGhpcy5wdXNoU3RhdGVtZW50cyh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuYmluYXJ5T3AsXHJcbiAgICAgICAgICAgICAgICBsZWZ0VHlwZTogbGVmdFR5cGUudHlwZSxcclxuICAgICAgICAgICAgICAgIG9wZXJhdG9yOiBub2RlLm9wZXJhdG9yLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IG5vZGUucG9zaXRpb25cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAobGF6eUV2YWx1YXRpb25EZXN0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0ubGFiZWxNYW5hZ2VyLm1hcmtKdW1wRGVzdGluYXRpb24oMSwgbGF6eUV2YWx1YXRpb25EZXN0KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogcmVzdWx0VHlwZSwgaXNBc3NpZ25hYmxlOiBmYWxzZSB9O1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NUZXJuYXJ5T3BlcmF0b3Iobm9kZTogQmluYXJ5T3BOb2RlKTogU3RhY2tUeXBlIHtcclxuXHJcbiAgICAgICAgbGV0IGxlZnRUeXBlID0gdGhpcy5wcm9jZXNzTm9kZShub2RlLmZpcnN0T3BlcmFuZCk7XHJcblxyXG4gICAgICAgIGlmIChsZWZ0VHlwZSA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmVuc3VyZUF1dG9tYXRpY0Nhc3RpbmcobGVmdFR5cGUudHlwZSwgYm9vbGVhblByaW1pdGl2ZVR5cGUsIG51bGwsIG5vZGUuZmlyc3RPcGVyYW5kKSkge1xyXG5cclxuICAgICAgICAgICAgbGV0IHNlY29uZE9wZXJhbmQgPSBub2RlLnNlY29uZE9wZXJhbmQ7XHJcbiAgICAgICAgICAgIGlmIChzZWNvbmRPcGVyYW5kICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzZWNvbmRPcGVyYW5kLnR5cGUgIT0gVG9rZW5UeXBlLmJpbmFyeU9wIHx8IHNlY29uZE9wZXJhbmQub3BlcmF0b3IgIT0gVG9rZW5UeXBlLmNvbG9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJBdWYgZGVuIEZyYWdlemVpY2hlbm9wZXJhdG9yIG3DvHNzZW4gLSBtaXQgRG9wcGVscHVua3QgZ2V0cmVubnQgLSB6d2VpIEFsdGVybmF0aXZ0ZXJtZSBmb2xnZW4uXCIsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbG0gPSB0aGlzLmN1cnJlbnRQcm9ncmFtLmxhYmVsTWFuYWdlcjtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmFyaWFudEZhbHNlTGFiZWwgPSBsbS5pbnNlcnRKdW1wTm9kZShUb2tlblR5cGUuanVtcElmRmFsc2UsIG5vZGUucG9zaXRpb24sIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBmaXJzdFR5cGUgPSB0aGlzLnByb2Nlc3NOb2RlKHNlY29uZE9wZXJhbmQuZmlyc3RPcGVyYW5kKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGVuZExhYmVsID0gbG0uaW5zZXJ0SnVtcE5vZGUoVG9rZW5UeXBlLmp1bXBBbHdheXMsIHNlY29uZE9wZXJhbmQuZmlyc3RPcGVyYW5kLnBvc2l0aW9uLCB0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEsIHZhcmlhbnRGYWxzZUxhYmVsKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2Vjb25kVHlwZSA9IHRoaXMucHJvY2Vzc05vZGUoc2Vjb25kT3BlcmFuZC5zZWNvbmRPcGVyYW5kKTtcclxuICAgICAgICAgICAgICAgICAgICBsbS5tYXJrSnVtcERlc3RpbmF0aW9uKDEsIGVuZExhYmVsKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGUgPSBmaXJzdFR5cGUudHlwZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2Vjb25kVHlwZSAhPSBudWxsICYmIHR5cGUgIT0gc2Vjb25kVHlwZS50eXBlICYmIHR5cGUuY2FuQ2FzdFRvKHNlY29uZFR5cGUudHlwZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IHNlY29uZFR5cGUudHlwZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQXNzaWduYWJsZTogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc1VuYXJ5T3Aobm9kZTogVW5hcnlPcE5vZGUpOiBTdGFja1R5cGUge1xyXG4gICAgICAgIGxldCBsZWZ0VHlwZSA9IHRoaXMucHJvY2Vzc05vZGUobm9kZS5vcGVyYW5kKTtcclxuXHJcbiAgICAgICAgaWYgKGxlZnRUeXBlID09IG51bGwgfHwgbGVmdFR5cGUudHlwZSA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmIChub2RlLm9wZXJhdG9yID09IFRva2VuVHlwZS5taW51cykge1xyXG4gICAgICAgICAgICBpZiAoIWxlZnRUeXBlLnR5cGUuY2FuQ2FzdFRvKGZsb2F0UHJpbWl0aXZlVHlwZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVyIE9wZXJhdG9yIC0gaXN0IGbDvHIgZGVuIFR5cCBcIiArIGxlZnRUeXBlLnR5cGUuaWRlbnRpZmllciArIFwiIG5pY2h0IGRlZmluaWVydC5cIiwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGVmdFR5cGU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobm9kZS5vcGVyYXRvciA9PSBUb2tlblR5cGUubm90KSB7XHJcbiAgICAgICAgICAgIGlmICghKGxlZnRUeXBlLnR5cGUgPT0gYm9vbGVhblByaW1pdGl2ZVR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrSWZBc3NpZ25tZW50SW5zdGVkT2ZFcXVhbChub2RlLm9wZXJhbmQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgT3BlcmF0b3IgISBpc3QgZsO8ciBkZW4gVHlwIFwiICsgbGVmdFR5cGUudHlwZS5pZGVudGlmaWVyICsgXCIgbmljaHQgZGVmaW5pZXJ0LlwiLCBub2RlLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBsZWZ0VHlwZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucHVzaFN0YXRlbWVudHMoe1xyXG4gICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUudW5hcnlPcCxcclxuICAgICAgICAgICAgb3BlcmF0b3I6IG5vZGUub3BlcmF0b3IsXHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiBub2RlLnBvc2l0aW9uXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBsZWZ0VHlwZTtcclxuICAgIH1cclxuXHJcbn0iXX0=