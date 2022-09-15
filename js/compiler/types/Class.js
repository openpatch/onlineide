import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { TokenType } from "../lexer/Token.js";
import { LabelManager } from "../parser/LabelManager.js";
import { ArrayType } from "./Array.js";
import { nullType, stringPrimitiveType } from "./PrimitiveTypes.js";
import { PrimitiveType, Type } from "./Types.js";
export var Visibility;
(function (Visibility) {
    Visibility[Visibility["public"] = 0] = "public";
    Visibility[Visibility["protected"] = 1] = "protected";
    Visibility[Visibility["private"] = 2] = "private";
})(Visibility || (Visibility = {}));
;
var booleanPrimitiveTypeCopy;
export function setBooleanPrimitiveTypeCopy(bpt) {
    booleanPrimitiveTypeCopy = bpt;
}
export class Klass extends Type {
    constructor(identifier, module, documentation) {
        super();
        // for Generics:
        this.typeVariables = [];
        this.isTypeVariable = false;
        this.typeVariablesReady = true;
        this.implements = [];
        this.firstPassImplements = [];
        this.isAbstract = false;
        this.postConstructorCallbacks = null;
        this.methods = [];
        this.methodMap = new Map();
        this.attributes = [];
        this.attributeMap = new Map();
        this.numberOfAttributesIncludingBaseClass = null;
        this.documentation = documentation;
        this.identifier = identifier;
        this.module = module;
        this.visibility = Visibility.public;
        this.staticClass = new StaticClass(this);
        this.attributeInitializationProgram = {
            method: null,
            module: this.module,
            statements: [],
            labelManager: null
        };
        this.attributeInitializationProgram.labelManager = new LabelManager(this.attributeInitializationProgram);
    }
    setupAttributeIndicesRecursive() {
        if (this.baseClass != null && this.baseClass.numberOfAttributesIncludingBaseClass == null) {
            this.baseClass.setupAttributeIndicesRecursive();
        }
        let numberOfAttributesInBaseClasses = this.baseClass == null ? 0 : this.baseClass.numberOfAttributesIncludingBaseClass;
        for (let a of this.attributes) {
            a.index = numberOfAttributesInBaseClasses++;
            // console.log(this.identifier + "." + a.identifier+ ": " + a.index);
        }
        this.numberOfAttributesIncludingBaseClass = numberOfAttributesInBaseClasses;
    }
    getNonGenericClass() {
        let k = this;
        while (k.isGenericVariantFrom != null)
            k = k.isGenericVariantFrom;
        return k;
    }
    getNonGenericIdentifier() {
        let k = this;
        while (k.isGenericVariantFrom != null)
            k = k.isGenericVariantFrom;
        return k.identifier;
    }
    implementsInterface(i) {
        let klass = this;
        while (klass != null) {
            for (let i1 of klass.implements) {
                if (i1.getThisOrExtendedInterface(i.getNonGenericIdentifier()) != null)
                    return true;
            }
            klass = klass.baseClass;
        }
        return false;
    }
    getImplementedInterface(identifier) {
        let klass = this;
        while (klass != null) {
            for (let i1 of klass.implements) {
                let i2 = i1.getThisOrExtendedInterface(identifier);
                if (i2 != null)
                    return i2;
            }
            klass = klass.baseClass;
        }
        return null;
    }
    registerUsedSystemClasses(usedSystemClasses) {
        if (this.baseClass != null && this.baseClass.module != null && this.baseClass.module.isSystemModule &&
            usedSystemClasses.indexOf(this.baseClass) < 0) {
            usedSystemClasses.push(this.baseClass);
        }
        for (let cd of this.getCompositeData()) {
            if (cd.klass != null && cd.klass.module != null && cd.klass.module.isSystemModule &&
                usedSystemClasses.indexOf(cd.klass) < 0) {
                usedSystemClasses.push(cd.klass);
            }
        }
        for (let interf of this.implements) {
            if (interf != null && interf.module.isSystemModule &&
                usedSystemClasses.indexOf(interf) < 0) {
                usedSystemClasses.push(interf);
            }
        }
    }
    getCompositeData() {
        let cd = [];
        let cdMap = new Map();
        for (let a of this.attributes) {
            if (a.type instanceof Klass || a.type instanceof Interface) {
                let cda = cdMap.get(a.type);
                if (cda == null) {
                    cda = {
                        klass: a.type,
                        multiples: false,
                        identifier: a.identifier
                    };
                    cdMap.set(a.type, cda);
                    cd.push(cda);
                }
                else {
                    cda.identifier += ", " + a.identifier;
                }
            }
            else {
                let type = a.type;
                while (type instanceof ArrayType) {
                    type = type.arrayOfType;
                }
                if (type instanceof Klass || type instanceof Interface) {
                    let cda = cdMap.get(type);
                    if (cda == null) {
                        cda = {
                            klass: type,
                            multiples: true,
                            identifier: a.identifier
                        };
                        cdMap.set(type, cda);
                        cd.push(cda);
                    }
                    else {
                        cda.identifier += ", " + a.identifier;
                        cda.multiples = true;
                    }
                }
            }
        }
        return cd;
    }
    clearUsagePositions() {
        super.clearUsagePositions();
        for (let m of this.methods) {
            m.clearUsagePositions();
        }
        for (let a of this.attributes) {
            a.usagePositions = new Map();
        }
        if (this.staticClass != null) {
            this.staticClass.clearUsagePositions();
        }
    }
    getPostConstructorCallbacks() {
        let c = this;
        let callbacks = null;
        while (c != null) {
            if (c.postConstructorCallbacks != null) {
                if (callbacks == null) {
                    callbacks = c.postConstructorCallbacks;
                }
                else {
                    callbacks = callbacks.concat(c.postConstructorCallbacks);
                }
            }
            c = c.baseClass;
        }
        return callbacks;
    }
    getCompletionItems(visibilityUpTo, leftBracketAlreadyThere, identifierAndBracketAfterCursor, rangeToReplace, currentMethod) {
        let itemList = [];
        for (let attribute of this.getAttributes(visibilityUpTo)) {
            itemList.push({
                label: attribute.identifier + "",
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: attribute.identifier,
                range: rangeToReplace,
                documentation: attribute.documentation == null ? undefined : {
                    value: attribute.documentation
                }
            });
        }
        for (let method of this.getMethods(visibilityUpTo)) {
            if (method.isConstructor) {
                if ((currentMethod === null || currentMethod === void 0 ? void 0 : currentMethod.isConstructor) && currentMethod != method && this.baseClass.methods.indexOf(method) >= 0) {
                    this.pushSuperCompletionItem(itemList, method, leftBracketAlreadyThere, rangeToReplace);
                    continue;
                }
                else {
                    continue;
                }
            }
            itemList.push({
                label: method.getCompletionLabel(),
                filterText: method.identifier,
                command: {
                    id: "editor.action.triggerParameterHints",
                    title: '123',
                    arguments: []
                },
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: method.getCompletionSnippet(leftBracketAlreadyThere),
                range: rangeToReplace,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: method.documentation == null ? undefined : {
                    value: method.documentation
                }
            });
        }
        itemList = itemList.concat(this.staticClass.getCompletionItems(visibilityUpTo, leftBracketAlreadyThere, identifierAndBracketAfterCursor, rangeToReplace));
        return itemList;
    }
    pushSuperCompletionItem(itemList, method, leftBracketAlreadyThere, rangeToReplace) {
        itemList.push({
            label: method.getCompletionLabel().replace(method.identifier, "super"),
            filterText: "super",
            command: {
                id: "editor.action.triggerParameterHints",
                title: '123',
                arguments: []
            },
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: method.getCompletionSnippet(leftBracketAlreadyThere).replace(method.identifier, "super"),
            range: rangeToReplace,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: method.documentation == null ? undefined : {
                value: method.documentation
            }
        });
    }
    pushStaticInitializationPrograms(programStack) {
        if (this.staticClass.attributeInitializationProgram.statements.length > 0) {
            programStack.push({
                program: this.staticClass.attributeInitializationProgram,
                programPosition: 0,
                textPosition: { line: 1, column: 1, length: 0 },
                method: "Initialisierung statischer Variablen der Klasse " + this.staticClass.identifier,
                callbackAfterReturn: null,
                isCalledFromOutside: "Initialisierung statischer Attribute"
            });
        }
    }
    getMethodBySignature(signature) {
        let c = this;
        while (c != null) {
            let method = c.methodMap.get(signature);
            if (method != null)
                return method;
            c = c.baseClass;
        }
        return null;
    }
    equals(type) {
        return type == this;
    }
    setBaseClass(baseClass) {
        this.baseClass = baseClass;
        this.staticClass.baseClass = baseClass.staticClass;
    }
    addMethod(method) {
        if (method.isConstructor) {
            method.returnType = null;
        }
        if (method.isStatic) {
            this.staticClass.addMethod(method);
        }
        else {
            this.methods.push(method);
            this.methodMap.set(method.signature, method);
        }
    }
    addAttribute(attribute) {
        if (attribute.isStatic) {
            this.staticClass.addAttribute(attribute);
        }
        else {
            this.attributes.push(attribute);
            this.attributeMap.set(attribute.identifier, attribute);
        }
    }
    getResultType(operation, secondOperandType) {
        if (operation == TokenType.equal || operation == TokenType.notEqual) {
            if (secondOperandType instanceof Klass || secondOperandType == nullType) {
                return booleanPrimitiveTypeCopy;
            }
        }
        if (operation == TokenType.keywordInstanceof) {
            if (secondOperandType instanceof StaticClass || secondOperandType instanceof Interface) {
                return booleanPrimitiveTypeCopy;
            }
        }
        return null;
    }
    compute(operation, firstOperand, secondOperand) {
        var _a;
        if (operation == TokenType.equal) {
            return firstOperand.value == secondOperand.value;
        }
        if (operation == TokenType.notEqual) {
            return firstOperand.value != secondOperand.value;
        }
        if (operation == TokenType.keywordInstanceof) {
            let firstOpClass = (_a = firstOperand === null || firstOperand === void 0 ? void 0 : firstOperand.value) === null || _a === void 0 ? void 0 : _a.class;
            if (firstOpClass == null)
                return false;
            let typeLeft = firstOpClass;
            let typeRight = secondOperand.type;
            if (typeRight instanceof StaticClass) {
                while (typeLeft != null) {
                    if (typeLeft === typeRight.Klass)
                        return true;
                    typeLeft = typeLeft.baseClass;
                }
                return false;
            }
            if (typeRight instanceof Interface) {
                while (typeLeft != null) {
                    for (let i of typeLeft.implements) {
                        if (i === typeRight)
                            return true;
                    }
                    typeLeft = typeLeft.baseClass;
                }
            }
            return false;
        }
        return null;
    }
    /**
     * returns all visible methods of this class and all of its base classes
     */
    getMethods(upToVisibility, identifier) {
        let methods = this.methods.filter((method) => {
            return method.visibility <= upToVisibility && (identifier == null || method.identifier == identifier);
        });
        if (this.baseClass != null && (identifier == null || identifier != this.identifier || methods.length == 0)) {
            let baseClassUptoVisibility = upToVisibility == Visibility.public ? upToVisibility : Visibility.protected;
            for (let m of this.baseClass.getMethods(baseClassUptoVisibility, identifier == this.identifier ? this.baseClass.identifier : identifier)) {
                let found = false;
                for (let m1 of methods) {
                    if (m1.signature == m.signature) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    methods.push(m);
                }
            }
        }
        return methods;
    }
    /**
     * returns all visible attributes of this class and all of its base classes
     */
    getAttributes(upToVisibility) {
        let attributes = [];
        for (let a of this.attributes) {
            if (a.visibility <= upToVisibility) {
                attributes.push(a);
            }
        }
        if (this.baseClass != null) {
            let upToVisibilityInBaseClass = upToVisibility == Visibility.public ? upToVisibility : Visibility.protected;
            for (let a of this.baseClass.getAttributes(upToVisibilityInBaseClass)) {
                let found = false;
                if (a.visibility > upToVisibilityInBaseClass)
                    continue;
                for (let a1 of attributes) {
                    if (a1.identifier == a.identifier) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    attributes.push(a);
                }
            }
        }
        return attributes;
    }
    hasConstructor() {
        for (let m of this.methods) {
            if (m.isConstructor)
                return true;
        }
        if (this.baseClass != null)
            return this.baseClass.hasConstructor();
        return false;
    }
    hasParameterlessConstructor() {
        let hasConstructorWithParameters = false;
        for (let m of this.methods) {
            if (m.isConstructor) {
                if (m.parameterlist.parameters.length == 0) {
                    return true;
                }
                else {
                    hasConstructorWithParameters = true;
                }
            }
        }
        if (!hasConstructorWithParameters && this.baseClass != null) {
            return this.baseClass.hasParameterlessConstructor();
        }
        return false;
    }
    getParameterlessConstructor() {
        for (let m of this.methods) {
            if (m.isConstructor && m.parameterlist.parameters.length == 0)
                return m;
        }
        if (this.baseClass != null) {
            return this.baseClass.getParameterlessConstructor();
        }
        return null;
    }
    getConstructor(parameterTypes, upToVisibility, classIdentifier = this.identifier) {
        let constructors = this.methods.filter((m) => {
            return m.isConstructor;
        });
        if (constructors.length == 0 && this.baseClass != null) {
            return this.baseClass.getConstructor(parameterTypes, upToVisibility, classIdentifier);
        }
        else {
            return findSuitableMethods(constructors, this.identifier, parameterTypes, classIdentifier, true);
        }
    }
    getMethodsThatFitWithCasting(identifier, parameterTypes, searchConstructor, upToVisibility) {
        let allMethods = this.getMethods(upToVisibility);
        let methods = findSuitableMethods(allMethods, identifier, parameterTypes, this.identifier, searchConstructor);
        if (methods.methodList.length == 0 && !searchConstructor) {
            let staticMethods = this.staticClass.getMethodsThatFitWithCasting(identifier, parameterTypes, false, upToVisibility);
            if (staticMethods.error == null) {
                return staticMethods;
            }
            return methods;
        }
        return methods;
    }
    getMethod(identifier, parameterlist) {
        let method = this.methodMap.get(identifier + parameterlist.id);
        if (method == null && this.baseClass != null) {
            return this.baseClass.getMethod(identifier, parameterlist);
        }
        return method;
    }
    getAttribute(identifier, upToVisibility) {
        let error = null;
        let foundButInvisible = false;
        let attribute = this.attributeMap.get(identifier);
        let attributeNotFound = attribute == null;
        if (attribute == null) {
            error = "Das Attribut " + identifier + " kann nicht gefunden werden.";
        }
        else if (attribute.visibility > upToVisibility) {
            error = "Das Attribut " + identifier + " hat die Sichtbarkeit " + Visibility[attribute.visibility] + " und ist daher hier nicht sichtbar.";
            attribute = null;
            foundButInvisible = true;
        }
        if (attribute == null && this.baseClass != null) {
            let upToVisibilityInBaseClass = upToVisibility == Visibility.public ? upToVisibility : Visibility.protected;
            let baseClassAttribute = this.baseClass.getAttribute(identifier, upToVisibilityInBaseClass);
            if (baseClassAttribute.attribute != null || attributeNotFound) {
                return baseClassAttribute;
            }
        }
        return { attribute: attribute, error: error, foundButInvisible: foundButInvisible };
    }
    canCastTo(type) {
        if (type == stringPrimitiveType) {
            return true;
        }
        if (type instanceof Klass) {
            let baseClass = this;
            while (baseClass != null) {
                if (type.getNonGenericIdentifier() == baseClass.getNonGenericIdentifier()) {
                    if (type.typeVariables.length > 0) {
                        let n = Math.min(type.typeVariables.length, baseClass.typeVariables.length);
                        for (let i = 0; i < n; i++) {
                            if (!baseClass.typeVariables[i].type.canCastTo(type.typeVariables[i].type))
                                return false;
                        }
                        return true;
                    }
                    return true;
                }
                baseClass = baseClass.baseClass;
            }
        }
        if (type instanceof Interface) {
            let klass = this;
            while (klass != null) {
                for (let i of klass.implements) {
                    let shouldImplement = type.getNonGenericIdentifier();
                    // look recursively into interface inheritance chain:                    
                    if (i.getThisOrExtendedInterface(shouldImplement) != null) {
                        return true;
                    }
                }
                klass = klass.baseClass;
            }
        }
        return false;
    }
    castTo(value, type) {
        return value;
    }
    checkInheritance() {
        if (this.baseClass != null && Klass.dontInheritFrom.indexOf(this.baseClass.identifier) >= 0) {
            return { message: "Aus Performancegründen ist es leider nicht möglich, Unterklassen der Klassen String, Boolean, Character, Integer, Float und Double zu bilden.", missingMethods: [] };
        }
        let message = "";
        let missingAbstractMethods = [];
        let implementedMethods = [];
        let missingInterfaceMethods = [];
        let klass = this;
        let hierarchy = [klass.identifier];
        while (klass.baseClass != null) {
            klass = klass.baseClass;
            if (hierarchy.indexOf(klass.identifier) >= 0) {
                klass.baseClass = null; // This is necessary to avoid infinite loops in further compilation
                hierarchy = [klass.identifier].concat(hierarchy);
                message = "Die Klasse " + klass.identifier + " erbt von sich selbst: ";
                message += "(" + hierarchy.join(" extends ") + ")";
                break;
            }
            hierarchy = [klass.identifier].concat(hierarchy);
        }
        if (message == "") {
            if (this.baseClass != null) {
                let abstractMethods = [];
                let klass = this;
                // collect abstract Methods
                while (klass != null) {
                    for (let m of klass.methods) {
                        if (m.isAbstract) {
                            abstractMethods.push(m);
                            let isImplemented = false;
                            for (let m1 of implementedMethods) {
                                if (m1.implements(m)) {
                                    isImplemented = true;
                                    break;
                                }
                            }
                            if (!isImplemented) {
                                missingAbstractMethods.push(m);
                            }
                        }
                        else {
                            implementedMethods.push(m);
                        }
                    }
                    klass = klass.baseClass;
                }
            }
            if (missingAbstractMethods.length > 0 && !this.isAbstract) {
                message = "Die Klasse " + this.identifier + " muss noch folgende Methoden ihrer abstrakten Basisklassen implementieren: ";
                message += missingAbstractMethods.map((m) => m.getSignatureWithReturnParameter()).join(", ");
            }
            for (let i of this.implements) {
                for (let m of i.getMethods()) {
                    let isImplemented = false;
                    for (let m1 of implementedMethods) {
                        if (m1.implements(m)) {
                            isImplemented = true;
                            break;
                        }
                    }
                    if (!isImplemented) {
                        missingInterfaceMethods.push(m);
                    }
                }
            }
            if (missingInterfaceMethods.length > 0) {
                if (message != "")
                    message += "\n";
                message += "Die Klasse " + this.identifier + " muss noch folgende Methoden der von ihr implementierten Interfaces implementieren: ";
                message += missingInterfaceMethods.map((m) => m.signature).join(", ");
            }
        }
        return { message: message, missingMethods: missingAbstractMethods.concat(missingInterfaceMethods) };
    }
    hasAncestorOrIs(a) {
        let c = this;
        let id = a.identifier;
        if (a instanceof Klass)
            id = a.getNonGenericIdentifier();
        while (c != null) {
            if (c.getNonGenericIdentifier() == id)
                return true;
            c = c.baseClass;
        }
        return false;
    }
    debugOutput(value, maxLength = 40) {
        let s = "{";
        let attributes = this.getAttributes(Visibility.private);
        let object = value.value;
        if (object == null) {
            return "null";
        }
        for (let i = 0; i < attributes.length; i++) {
            let attribute = attributes[i];
            let v = object.getValue(attribute.index);
            if (attribute.type instanceof PrimitiveType) {
                s += attribute.identifier + ":&nbsp;" + attribute.type.debugOutput(v, maxLength / 2);
            }
            else {
                s += attribute.identifier + ":&nbsp; {...}";
            }
            if (i < attributes.length - 1) {
                s += ",&nbsp;";
            }
        }
        return s + "}";
    }
    // static count: number = 0;
    clone() {
        // Klass.count++;
        let newKlass = Object.create(this);
        newKlass.implements = this.implements.slice(0);
        newKlass.usagePositions = new Map();
        newKlass.isGenericVariantFrom = this;
        return newKlass;
    }
}
Klass.dontInheritFrom = ["Integer", "Float", "Double", "Boolean", "Character", "String", "Shape", "FilledShape"];
export class StaticClass extends Type {
    constructor(klass) {
        super();
        this.methods = [];
        this.methodMap = new Map();
        this.attributes = [];
        this.attributeMap = new Map();
        this.numberOfAttributesIncludingBaseClass = null;
        this.Klass = klass;
        this.identifier = klass.identifier;
        if (klass.baseClass != null) {
            this.baseClass = klass.baseClass.staticClass;
        }
        this.attributeInitializationProgram = {
            method: null,
            module: this.Klass.module,
            statements: [],
            labelManager: null
        };
        this.attributeInitializationProgram.labelManager = new LabelManager(this.attributeInitializationProgram);
    }
    setupAttributeIndicesRecursive() {
        if (this.baseClass != null && this.baseClass.numberOfAttributesIncludingBaseClass == null) {
            this.baseClass.setupAttributeIndicesRecursive();
        }
        let numberOfAttributesInBaseClasses = this.baseClass == null ? 0 : this.baseClass.numberOfAttributesIncludingBaseClass;
        for (let a of this.attributes) {
            a.index = numberOfAttributesInBaseClasses++;
            // console.log(this.identifier + "." + a.identifier+ ": " + a.index);
        }
        this.numberOfAttributesIncludingBaseClass = numberOfAttributesInBaseClasses;
    }
    clearUsagePositions() {
        super.clearUsagePositions();
        for (let m of this.methods) {
            m.clearUsagePositions();
        }
        for (let a of this.attributes) {
            a.usagePositions = new Map();
        }
    }
    debugOutput(value, maxLength = 40) {
        var _a;
        let s = "{";
        let attributes = this.getAttributes(Visibility.private);
        let object = this.classObject;
        for (let i = 0; i < attributes.length; i++) {
            let attribute = attributes[i];
            s += attribute.identifier + ": " + object == null ? '---' : (_a = attribute.type) === null || _a === void 0 ? void 0 : _a.debugOutput(object.getValue(attribute.index), maxLength / 2);
            if (i < attributes.length - 1) {
                s += ", ";
            }
        }
        return s + "}";
    }
    getCompletionItems(visibilityUpTo, leftBracketAlreadyThere, identifierAndBracketAfterCursor, rangeToReplace) {
        let itemList = [];
        for (let attribute of this.getAttributes(visibilityUpTo)) {
            itemList.push({
                label: attribute.identifier,
                //@ts-ignore
                detail: attribute.color ? attribute.color : undefined,
                //@ts-ignore
                kind: attribute.color ? monaco.languages.CompletionItemKind.Color : monaco.languages.CompletionItemKind.Field,
                insertText: attribute.identifier,
                range: rangeToReplace,
                documentation: attribute.documentation == null ? undefined : {
                    value: attribute.documentation
                }
            });
        }
        for (let method of this.getMethods(visibilityUpTo)) {
            itemList.push({
                label: method.getCompletionLabel(),
                filterText: method.identifier,
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: method.getCompletionSnippet(leftBracketAlreadyThere),
                range: rangeToReplace,
                command: {
                    id: "editor.action.triggerParameterHints",
                    title: '123',
                    arguments: []
                },
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: method.documentation == null ? undefined : {
                    value: method.documentation
                }
            });
        }
        return itemList;
    }
    equals(type) {
        return type == this;
    }
    addMethod(method) {
        this.methods.push(method);
        this.methodMap.set(method.signature, method);
    }
    addAttribute(attribute) {
        this.attributes.push(attribute);
        this.attributeMap.set(attribute.identifier, attribute);
    }
    getResultType(operation, secondOperandType) {
        return null;
    }
    compute(operation, firstOperand, secondOperand) {
        return null;
    }
    getMethodsThatFitWithCasting(identifier, parameterTypes, searchConstructor, upToVisibility) {
        return findSuitableMethods(this.getMethods(upToVisibility), identifier, parameterTypes, this.Klass.identifier, searchConstructor);
    }
    /**
     * returns all methods of this class and all of its base classes
     * @param isStatic returns only static methods if true
     */
    getMethods(upToVisibility, identifier) {
        let methods = this.methods.slice().filter((method) => {
            return method.visibility <= upToVisibility && (identifier == null || identifier == method.identifier);
        });
        if (this.baseClass != null) {
            let baseClassUptoVisibility = upToVisibility == Visibility.public ? Visibility.public : Visibility.protected;
            for (let m of this.baseClass.getMethods(baseClassUptoVisibility, identifier)) {
                let found = false;
                for (let m1 of methods) {
                    if (m1.signature == m.signature) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    methods.push(m);
                }
            }
        }
        return methods;
    }
    /**
     * returns all attributes of this class and all of its base classes
     * @param isStatic return only static attributes if true
     */
    getAttributes(visibilityUpTo) {
        let attributes = this.attributes.filter((attribute) => {
            return attribute.visibility <= visibilityUpTo;
        });
        if (this.baseClass != null) {
            let visibilityUpToBaseClass = visibilityUpTo == Visibility.public ? visibilityUpTo : Visibility.protected;
            for (let a of this.baseClass.getAttributes(visibilityUpToBaseClass)) {
                let found = false;
                for (let a1 of attributes) {
                    if (a1.identifier == a.identifier) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    attributes.push(a);
                }
            }
        }
        return attributes;
    }
    getMethod(identifier, parameterlist) {
        let method = this.methodMap.get(identifier + parameterlist.id);
        if (method == null && this.baseClass != null) {
            return this.baseClass.getMethod(identifier, parameterlist);
        }
        return method;
    }
    getAttribute(identifier, upToVisibility) {
        let error = "";
        let notFound = false;
        let attribute = this.attributeMap.get(identifier);
        if (attribute == null) {
            notFound = true;
            error = "Das Attribut " + identifier + " konnte nicht gefunden werden.";
        }
        else if (attribute.visibility > upToVisibility) {
            error = "Das Attribut " + identifier + " hat die Sichtbarkeit " + Visibility[attribute.visibility] + " und ist hier daher nicht sichtbar.";
            attribute = null;
        }
        if (attribute == null && this.baseClass != null) {
            let upToVisibilityInBaseClass = upToVisibility == Visibility.public ? upToVisibility : Visibility.protected;
            let baseClassAttributeWithError = this.baseClass.getAttribute(identifier, upToVisibilityInBaseClass);
            if (notFound) {
                return baseClassAttributeWithError;
            }
        }
        return { attribute: attribute, error: error, foundButInvisible: !notFound, staticClass: this };
    }
    canCastTo(type) {
        return false;
    }
    castTo(value, type) {
        return value;
    }
    hasAncestorOrIs(a) {
        let c = this;
        while (c != null) {
            if (c == a)
                return true;
            c = c.baseClass;
        }
        return false;
    }
}
export class Interface extends Type {
    constructor(identifier, module, documentation) {
        super();
        // for Generics:
        this.typeVariables = [];
        this.typeVariablesReady = true;
        this.extends = [];
        this.methods = [];
        this.methodMap = new Map();
        this.documentation = documentation;
        this.identifier = identifier;
        this.module = module;
    }
    getNonGenericIdentifier() {
        let k = this;
        while (k.isGenericVariantFrom != null)
            k = k.isGenericVariantFrom;
        return k.identifier;
    }
    getThisOrExtendedInterface(identifier) {
        if (this.getNonGenericIdentifier() == identifier)
            return this;
        for (let if1 of this.extends) {
            let if2 = if1.getThisOrExtendedInterface(identifier);
            if (if2 != null)
                return if2;
        }
        return null;
    }
    // static count: number = 0;
    clone() {
        // Interface.count++;
        let newInterface = Object.create(this);
        newInterface.usagePositions = new Map();
        newInterface.isGenericVariantFrom = this;
        return newInterface;
    }
    clearUsagePositions() {
        super.clearUsagePositions();
        for (let m of this.methods) {
            m.clearUsagePositions();
        }
    }
    getCompletionItems(leftBracketAlreadyThere, identifierAndBracketAfterCursor, rangeToReplace) {
        let itemList = [];
        for (let method of this.getMethods()) {
            itemList.push({
                label: method.getCompletionLabel(),
                filterText: method.identifier,
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: method.getCompletionSnippet(leftBracketAlreadyThere),
                range: rangeToReplace,
                command: {
                    id: "editor.action.triggerParameterHints",
                    title: '123',
                    arguments: []
                },
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: method.documentation == null ? undefined : {
                    value: method.documentation
                }
            });
        }
        return itemList;
    }
    debugOutput(value, maxLength = 40) {
        if (value.value == null) {
            return "null";
        }
        else {
            if (value.value instanceof RuntimeObject) {
                return value.value.class.debugOutput(value);
            }
            else {
                return "{...}";
            }
        }
    }
    equals(type) {
        return type == this;
    }
    addMethod(method) {
        method.isAbstract = true;
        this.methods.push(method);
        this.methodMap.set(method.signature, method);
    }
    getResultType(operation, secondOperandType) {
        if (operation == TokenType.equal || operation == TokenType.notEqual) {
            return booleanPrimitiveTypeCopy;
        }
        if (operation == TokenType.keywordInstanceof) {
            if (secondOperandType instanceof StaticClass || secondOperandType instanceof Interface) {
                return booleanPrimitiveTypeCopy;
            }
        }
        return null;
    }
    compute(operation, firstOperand, secondOperand) {
        if (operation == TokenType.equal) {
            return firstOperand.value == secondOperand.value;
        }
        if (operation == TokenType.notEqual) {
            return firstOperand.value != secondOperand.value;
        }
        return null;
    }
    /**
     * returns all methods of this interface
     * @param isStatic is not used in interfaces
     */
    getMethods() {
        if (this.extends.length == 0)
            return this.methods;
        if (this.methodsWithSubInterfaces != null)
            return this.methodsWithSubInterfaces;
        let visitedInterfaces = {};
        let visitedMethods = {};
        this.methodsWithSubInterfaces = this.methods.slice(0);
        for (let m of this.methods)
            visitedMethods[m.signature] = true;
        visitedInterfaces[this.identifier] = true;
        let todo = this.extends.slice(0);
        while (todo.length > 0) {
            let interf = todo.pop();
            for (let m of interf.methods) {
                if (!visitedMethods[m.signature]) {
                    this.methodsWithSubInterfaces.push(m);
                    visitedMethods[m.signature] = true;
                }
            }
            for (let i of interf.extends) {
                if (!visitedInterfaces[i.identifier]) {
                    todo.push(i);
                    visitedInterfaces[i.identifier] = true;
                }
            }
        }
        return this.methodsWithSubInterfaces;
    }
    getMethod(identifier, parameterlist) {
        return this.methodMap.get(identifier + parameterlist.id);
    }
    canCastTo(type) {
        if (type instanceof Interface) {
            let nonGenericCastable = false;
            if (type.getNonGenericIdentifier() == this.getNonGenericIdentifier()) {
                nonGenericCastable = true;
                if (this.typeVariables.length == 0)
                    return true;
                let type2 = type;
                if (this.typeVariables.length != type2.typeVariables.length)
                    return false;
                for (let i = 0; i < this.typeVariables.length; i++) {
                    let tv = this.typeVariables[i];
                    let tvOther = type2.typeVariables[i];
                    if (!tvOther.type.canCastTo(tv.type))
                        return false;
                }
                return false;
            }
            else {
                for (let type1 of this.extends) {
                    if (type1.canCastTo(type)) {
                        return true;
                    }
                }
            }
            return false;
        }
        else {
            if (type instanceof Klass && type.getNonGenericIdentifier() == "Object") {
                return true;
            }
            return false;
        }
        // return (type instanceof Klass) || (type instanceof Interface);
    }
    castTo(value, type) {
        return value;
    }
    getMethodsThatFitWithCasting(identifier, parameterTypes, searchConstructor) {
        return findSuitableMethods(this.getMethods(), identifier, parameterTypes, this.identifier, searchConstructor);
    }
}
function findSuitableMethods(methodList, identifier, parameterTypes, classIdentifier, searchConstructor) {
    let suitableMethods = [];
    let howManyCastingsMax = 10000;
    let error = null;
    let oneWithCorrectIdentifierFound = false;
    for (let m of methodList) {
        let howManyCastings = 0;
        if (m.identifier == identifier || m.isConstructor && searchConstructor) {
            oneWithCorrectIdentifierFound = true;
            let isEllipsis = m.hasEllipsis();
            if (m.getParameterCount() == parameterTypes.length || (isEllipsis && m.getParameterCount() <= parameterTypes.length)) {
                let suits = true;
                let i = 0;
                for (i = 0; i < m.getParameterCount() - (isEllipsis ? 1 : 0); i++) {
                    let mParameterType = m.getParameterType(i);
                    let givenType = parameterTypes[i];
                    if (givenType == null) {
                        suits = false;
                        break;
                    }
                    if (mParameterType == givenType) {
                        continue;
                    }
                    if (givenType.canCastTo(mParameterType)) {
                        howManyCastings++;
                        /**
                         * Rechteck r;
                         * GNGFigur f;
                         * Bei f.berührt(r) gibt es eine Variante mit Parametertyp String (schlecht!) und
                         * eine mit Parametertyp Object. Letztere soll genommen werden, also:
                         */
                        if (mParameterType == stringPrimitiveType)
                            howManyCastings += 0.5;
                        continue;
                    }
                    suits = false;
                    break;
                }
                // Ellipsis!
                if (suits && isEllipsis) {
                    let mParameterEllipsis = m.getParameter(i);
                    let mParameterTypeEllispsis = mParameterEllipsis.type.arrayOfType;
                    for (let j = i; j < parameterTypes.length; j++) {
                        let givenType = parameterTypes[i];
                        if (givenType == null) {
                            suits = false;
                            break;
                        }
                        if (mParameterTypeEllispsis == givenType) {
                            continue;
                        }
                        if (givenType.canCastTo(mParameterTypeEllispsis)) {
                            howManyCastings++;
                            /**
                             * Rechteck r;
                             * GNGFigur f;
                             * Bei f.berührt(r) gibt es eine Variante mit Parametertyp String (schlecht!) und
                             * eine mit Parametertyp Object. Letztere soll genommen werden, also:
                             */
                            if (mParameterTypeEllispsis == stringPrimitiveType)
                                howManyCastings += 0.5;
                            continue;
                        }
                        suits = false;
                        break;
                    }
                }
                if (suits && howManyCastings <= howManyCastingsMax) {
                    if (howManyCastings < howManyCastingsMax) {
                        suitableMethods = [];
                    }
                    suitableMethods.push(m);
                    howManyCastingsMax = howManyCastings;
                }
            }
        }
    }
    if (suitableMethods.length == 0) {
        if (oneWithCorrectIdentifierFound) {
            if (parameterTypes.length == 0) {
                error = searchConstructor ? "Es gibt keinen parameterlosen Konstruktor der Klasse " + classIdentifier : "Die vorhandenen Methoden mit dem Bezeichner " + identifier + " haben alle mindestens einen Parameter. Hier wird aber kein Parameterwert übergeben.";
            }
            else {
                let typeString = parameterTypes.map(type => type === null || type === void 0 ? void 0 : type.identifier).join(", ");
                error = searchConstructor ? `Die Parametertypen (${typeString}) passen zu keinem Konstruktor der Klasse ${classIdentifier}` : `Die Parametertypen (${typeString}) passen zu keiner der vorhandenen Methoden mit dem Bezeichner ${identifier}.`;
            }
        }
        else {
            error = "Der Typ " + classIdentifier + " besitzt keine Methode mit dem Bezeichner " + identifier + ".";
            if (identifier == 'setCenter') {
                error += ' Tipp: Die Methode setCenter der Klasse Shape wurde umbenannt in "moveTo".';
            }
        }
    }
    if (suitableMethods.length > 1) {
        suitableMethods = suitableMethods.slice(0, 1);
        // error = "Zu den gegebenen Parametern hat der Typ " + classIdentifier + " mehrere passende Methoden.";
    }
    return {
        error: error,
        methodList: suitableMethods
    };
}
export function getVisibilityUpTo(objectType, currentClassContext) {
    if (currentClassContext == null) {
        return Visibility.public;
    }
    if (objectType instanceof StaticClass)
        objectType = objectType.Klass;
    if (currentClassContext instanceof StaticClass)
        currentClassContext = currentClassContext.Klass;
    if (objectType == currentClassContext) {
        return Visibility.private;
    }
    if (currentClassContext.hasAncestorOrIs(objectType)) {
        return Visibility.protected;
    }
    return Visibility.public;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xhc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L2NvbXBpbGVyL3R5cGVzL0NsYXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUNuRSxPQUFPLEVBQWdCLFNBQVMsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQzVELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUl6RCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ3ZDLE9BQU8sRUFBRSxRQUFRLEVBQUUsbUJBQW1CLEVBQXFCLE1BQU0scUJBQXFCLENBQUM7QUFDdkYsT0FBTyxFQUFvQyxhQUFhLEVBQUUsSUFBSSxFQUFTLE1BQU0sWUFBWSxDQUFDO0FBRzFGLE1BQU0sQ0FBTixJQUFZLFVBQXlDO0FBQXJELFdBQVksVUFBVTtJQUFHLCtDQUFNLENBQUE7SUFBRSxxREFBUyxDQUFBO0lBQUUsaURBQU8sQ0FBQTtBQUFDLENBQUMsRUFBekMsVUFBVSxLQUFWLFVBQVUsUUFBK0I7QUFBQSxDQUFDO0FBRXRELElBQUksd0JBQTZCLENBQUM7QUFDbEMsTUFBTSxVQUFVLDJCQUEyQixDQUFDLEdBQVM7SUFDakQsd0JBQXdCLEdBQUcsR0FBRyxDQUFDO0FBQ25DLENBQUM7QUFnQkQsTUFBTSxPQUFPLEtBQU0sU0FBUSxJQUFJO0lBcUMzQixZQUFZLFVBQWtCLEVBQUUsTUFBYyxFQUFFLGFBQXNCO1FBQ2xFLEtBQUssRUFBRSxDQUFDO1FBcENaLGdCQUFnQjtRQUNoQixrQkFBYSxHQUFtQixFQUFFLENBQUM7UUFFbkMsbUJBQWMsR0FBWSxLQUFLLENBQUM7UUFDaEMsdUJBQWtCLEdBQVksSUFBSSxDQUFDO1FBYW5DLGVBQVUsR0FBZ0IsRUFBRSxDQUFDO1FBQzdCLHdCQUFtQixHQUFhLEVBQUUsQ0FBQztRQUVuQyxlQUFVLEdBQVks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S0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5Qyx3R0FBd0c7S0FDM0c7SUFFRCxPQUFPO1FBQ0gsS0FBSyxFQUFFLEtBQUs7UUFDWixVQUFVLEVBQUUsZUFBZTtLQUM5QixDQUFDO0FBRU4sQ0FBQztBQUVELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxVQUErQixFQUFFLG1CQUF3QztJQUV2RyxJQUFJLG1CQUFtQixJQUFJLElBQUksRUFBRTtRQUM3QixPQUFPLFVBQVUsQ0FBQyxNQUFNLENBQUM7S0FDNUI7SUFFRCxJQUFJLFVBQVUsWUFBWSxXQUFXO1FBQUUsVUFBVSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7SUFDckUsSUFBSSxtQkFBbUIsWUFBWSxXQUFXO1FBQUUsbUJBQW1CLEdBQUcsbUJBQW1CLENBQUMsS0FBSyxDQUFDO0lBRWhHLElBQUksVUFBVSxJQUFJLG1CQUFtQixFQUFFO1FBQ25DLE9BQU8sVUFBVSxDQUFDLE9BQU8sQ0FBQztLQUM3QjtJQUVELElBQUksbUJBQW1CLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sVUFBVSxDQUFDLFNBQVMsQ0FBQztLQUMvQjtJQUVELE9BQU8sVUFBVSxDQUFDLE1BQU0sQ0FBQztBQUU3QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUHJvZ3JhbVN0YWNrRWxlbWVudCB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9JbnRlcnByZXRlci5qc1wiO1xyXG5pbXBvcnQgeyBSdW50aW1lT2JqZWN0IH0gZnJvbSBcIi4uLy4uL2ludGVycHJldGVyL1J1bnRpbWVPYmplY3QuanNcIjtcclxuaW1wb3J0IHsgVGV4dFBvc2l0aW9uLCBUb2tlblR5cGUgfSBmcm9tIFwiLi4vbGV4ZXIvVG9rZW4uanNcIjtcclxuaW1wb3J0IHsgTGFiZWxNYW5hZ2VyIH0gZnJvbSBcIi4uL3BhcnNlci9MYWJlbE1hbmFnZXIuanNcIjtcclxuaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgUHJvZ3JhbSB9IGZyb20gXCIuLi9wYXJzZXIvUHJvZ3JhbS5qc1wiO1xyXG5pbXBvcnQgeyBTeW1ib2xUYWJsZSB9IGZyb20gXCIuLi9wYXJzZXIvU3ltYm9sVGFibGUuanNcIjtcclxuaW1wb3J0IHsgQXJyYXlUeXBlIH0gZnJvbSBcIi4vQXJyYXkuanNcIjtcclxuaW1wb3J0IHsgbnVsbFR5cGUsIHN0cmluZ1ByaW1pdGl2ZVR5cGUsIHZvaWRQcmltaXRpdmVUeXBlIH0gZnJvbSBcIi4vUHJpbWl0aXZlVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgQXR0cmlidXRlLCBNZXRob2QsIFBhcmFtZXRlcmxpc3QsIFByaW1pdGl2ZVR5cGUsIFR5cGUsIFZhbHVlIH0gZnJvbSBcIi4vVHlwZXMuanNcIjtcclxuXHJcblxyXG5leHBvcnQgZW51bSBWaXNpYmlsaXR5IHsgcHVibGljLCBwcm90ZWN0ZWQsIHByaXZhdGUgfTtcclxuXHJcbnZhciBib29sZWFuUHJpbWl0aXZlVHlwZUNvcHk6IGFueTtcclxuZXhwb3J0IGZ1bmN0aW9uIHNldEJvb2xlYW5QcmltaXRpdmVUeXBlQ29weShicHQ6IFR5cGUpIHtcclxuICAgIGJvb2xlYW5QcmltaXRpdmVUeXBlQ29weSA9IGJwdDtcclxufVxyXG5cclxuLy8gVXNlZCBmb3IgY2xhc3MgZGlhZ3JhbXM6XHJcbmV4cG9ydCB0eXBlIENvbXBvc3Rpb25EYXRhID0geyBrbGFzczogS2xhc3MgfCBJbnRlcmZhY2UsIG11bHRpcGxlczogYm9vbGVhbiwgaWRlbnRpZmllcjogc3RyaW5nIH07XHJcblxyXG4vKipcclxuICogRm9yIEdlbmVyaWMgdHlwZXNcclxuICovXHJcbmV4cG9ydCB0eXBlIFR5cGVWYXJpYWJsZSA9IHtcclxuICAgIGlkZW50aWZpZXI6IHN0cmluZztcclxuICAgIHR5cGU6IEtsYXNzO1xyXG4gICAgc2NvcGVGcm9tOiBUZXh0UG9zaXRpb247XHJcbiAgICBzY29wZVRvOiBUZXh0UG9zaXRpb247XHJcbn1cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgS2xhc3MgZXh0ZW5kcyBUeXBlIHtcclxuXHJcbiAgICAvLyBmb3IgR2VuZXJpY3M6XHJcbiAgICB0eXBlVmFyaWFibGVzOiBUeXBlVmFyaWFibGVbXSA9IFtdO1xyXG4gICAgaXNHZW5lcmljVmFyaWFudEZyb206IEtsYXNzO1xyXG4gICAgaXNUeXBlVmFyaWFibGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHR5cGVWYXJpYWJsZXNSZWFkeTogYm9vbGVhbiA9IHRydWU7XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgZG9udEluaGVyaXRGcm9tOiBzdHJpbmdbXSA9IFtcIkludGVnZXJcIiwgXCJGbG9hdFwiLCBcIkRvdWJsZVwiLCBcIkJvb2xlYW5cIiwgXCJDaGFyYWN0ZXJcIiwgXCJTdHJpbmdcIiwgXCJTaGFwZVwiLCBcIkZpbGxlZFNoYXBlXCJdO1xyXG5cclxuICAgIGJhc2VDbGFzczogS2xhc3M7XHJcbiAgICBmaXJzdFBhc3NCYXNlQ2xhc3M6IHN0cmluZztcclxuXHJcbiAgICBzdGF0aWNDbGFzczogU3RhdGljQ2xhc3M7XHJcblxyXG4gICAgbW9kdWxlOiBNb2R1bGU7XHJcblxyXG4gICAgdmlzaWJpbGl0eTogVmlzaWJpbGl0eTtcclxuXHJcbiAgICBpbXBsZW1lbnRzOiBJbnRlcmZhY2VbXSA9IFtdO1xyXG4gICAgZmlyc3RQYXNzSW1wbGVtZW50czogc3RyaW5nW10gPSBbXTtcclxuXHJcbiAgICBpc0Fic3RyYWN0OiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgYXR0cmlidXRlSW5pdGlhbGl6YXRpb25Qcm9ncmFtOiBQcm9ncmFtO1xyXG5cclxuICAgIHBvc3RDb25zdHJ1Y3RvckNhbGxiYWNrczogKChyOiBSdW50aW1lT2JqZWN0KSA9PiB2b2lkKVtdID0gbnVsbDtcclxuXHJcbiAgICBwdWJsaWMgbWV0aG9kczogTWV0aG9kW10gPSBbXTtcclxuICAgIHByaXZhdGUgbWV0aG9kTWFwOiBNYXA8c3RyaW5nLCBNZXRob2Q+ID0gbmV3IE1hcCgpO1xyXG5cclxuICAgIHB1YmxpYyBhdHRyaWJ1dGVzOiBBdHRyaWJ1dGVbXSA9IFtdO1xyXG4gICAgcHVibGljIGF0dHJpYnV0ZU1hcDogTWFwPHN0cmluZywgQXR0cmlidXRlPiA9IG5ldyBNYXAoKTtcclxuICAgIHB1YmxpYyBudW1iZXJPZkF0dHJpYnV0ZXNJbmNsdWRpbmdCYXNlQ2xhc3M6IG51bWJlciA9IG51bGw7XHJcblxyXG4gICAgcHVibGljIHN5bWJvbFRhYmxlOiBTeW1ib2xUYWJsZTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihpZGVudGlmaWVyOiBzdHJpbmcsIG1vZHVsZTogTW9kdWxlLCBkb2N1bWVudGF0aW9uPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kb2N1bWVudGF0aW9uID0gZG9jdW1lbnRhdGlvbjtcclxuXHJcbiAgICAgICAgdGhpcy5pZGVudGlmaWVyID0gaWRlbnRpZmllcjtcclxuICAgICAgICB0aGlzLm1vZHVsZSA9IG1vZHVsZTtcclxuICAgICAgICB0aGlzLnZpc2liaWxpdHkgPSBWaXNpYmlsaXR5LnB1YmxpYztcclxuXHJcbiAgICAgICAgdGhpcy5zdGF0aWNDbGFzcyA9IG5ldyBTdGF0aWNDbGFzcyh0aGlzKTtcclxuXHJcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW0gPSB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogbnVsbCxcclxuICAgICAgICAgICAgbW9kdWxlOiB0aGlzLm1vZHVsZSxcclxuICAgICAgICAgICAgc3RhdGVtZW50czogW10sXHJcbiAgICAgICAgICAgIGxhYmVsTWFuYWdlcjogbnVsbFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlSW5pdGlhbGl6YXRpb25Qcm9ncmFtLmxhYmVsTWFuYWdlciA9IG5ldyBMYWJlbE1hbmFnZXIodGhpcy5hdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZXR1cEF0dHJpYnV0ZUluZGljZXNSZWN1cnNpdmUoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYmFzZUNsYXNzICE9IG51bGwgJiYgdGhpcy5iYXNlQ2xhc3MubnVtYmVyT2ZBdHRyaWJ1dGVzSW5jbHVkaW5nQmFzZUNsYXNzID09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5iYXNlQ2xhc3Muc2V0dXBBdHRyaWJ1dGVJbmRpY2VzUmVjdXJzaXZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBudW1iZXJPZkF0dHJpYnV0ZXNJbkJhc2VDbGFzc2VzID0gdGhpcy5iYXNlQ2xhc3MgPT0gbnVsbCA/IDAgOiB0aGlzLmJhc2VDbGFzcy5udW1iZXJPZkF0dHJpYnV0ZXNJbmNsdWRpbmdCYXNlQ2xhc3M7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGEgb2YgdGhpcy5hdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICAgIGEuaW5kZXggPSBudW1iZXJPZkF0dHJpYnV0ZXNJbkJhc2VDbGFzc2VzKys7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuaWRlbnRpZmllciArIFwiLlwiICsgYS5pZGVudGlmaWVyKyBcIjogXCIgKyBhLmluZGV4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubnVtYmVyT2ZBdHRyaWJ1dGVzSW5jbHVkaW5nQmFzZUNsYXNzID0gbnVtYmVyT2ZBdHRyaWJ1dGVzSW5CYXNlQ2xhc3NlcztcclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIGdldE5vbkdlbmVyaWNDbGFzcygpOiBLbGFzcyB7XHJcbiAgICAgICAgbGV0IGs6IEtsYXNzID0gdGhpcztcclxuICAgICAgICB3aGlsZSAoay5pc0dlbmVyaWNWYXJpYW50RnJvbSAhPSBudWxsKSBrID0gay5pc0dlbmVyaWNWYXJpYW50RnJvbTtcclxuICAgICAgICByZXR1cm4gaztcclxuICAgIH1cclxuXHJcbiAgICBnZXROb25HZW5lcmljSWRlbnRpZmllcigpOiBzdHJpbmcge1xyXG4gICAgICAgIGxldCBrOiBLbGFzcyA9IHRoaXM7XHJcbiAgICAgICAgd2hpbGUgKGsuaXNHZW5lcmljVmFyaWFudEZyb20gIT0gbnVsbCkgayA9IGsuaXNHZW5lcmljVmFyaWFudEZyb207XHJcbiAgICAgICAgcmV0dXJuIGsuaWRlbnRpZmllcjtcclxuICAgIH1cclxuXHJcbiAgICBpbXBsZW1lbnRzSW50ZXJmYWNlKGk6IEludGVyZmFjZSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGxldCBrbGFzczogS2xhc3MgPSB0aGlzO1xyXG4gICAgICAgIHdoaWxlIChrbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkxIG9mIGtsYXNzLmltcGxlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpMS5nZXRUaGlzT3JFeHRlbmRlZEludGVyZmFjZShpLmdldE5vbkdlbmVyaWNJZGVudGlmaWVyKCkpICE9IG51bGwpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGtsYXNzID0ga2xhc3MuYmFzZUNsYXNzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXRJbXBsZW1lbnRlZEludGVyZmFjZShpZGVudGlmaWVyOiBzdHJpbmcpOiBJbnRlcmZhY2Uge1xyXG4gICAgICAgIGxldCBrbGFzczogS2xhc3MgPSB0aGlzO1xyXG4gICAgICAgIHdoaWxlIChrbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkxIG9mIGtsYXNzLmltcGxlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgIGxldCBpMjogSW50ZXJmYWNlID0gaTEuZ2V0VGhpc09yRXh0ZW5kZWRJbnRlcmZhY2UoaWRlbnRpZmllcik7XHJcbiAgICAgICAgICAgICAgICBpZiAoaTIgIT0gbnVsbCkgcmV0dXJuIGkyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGtsYXNzID0ga2xhc3MuYmFzZUNsYXNzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICByZWdpc3RlclVzZWRTeXN0ZW1DbGFzc2VzKHVzZWRTeXN0ZW1DbGFzc2VzOiAoS2xhc3MgfCBJbnRlcmZhY2UpW10pIHtcclxuICAgICAgICBpZiAodGhpcy5iYXNlQ2xhc3MgIT0gbnVsbCAmJiB0aGlzLmJhc2VDbGFzcy5tb2R1bGUgIT0gbnVsbCAmJiB0aGlzLmJhc2VDbGFzcy5tb2R1bGUuaXNTeXN0ZW1Nb2R1bGUgJiZcclxuICAgICAgICAgICAgdXNlZFN5c3RlbUNsYXNzZXMuaW5kZXhPZih0aGlzLmJhc2VDbGFzcykgPCAwKSB7XHJcbiAgICAgICAgICAgIHVzZWRTeXN0ZW1DbGFzc2VzLnB1c2godGhpcy5iYXNlQ2xhc3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCBjZCBvZiB0aGlzLmdldENvbXBvc2l0ZURhdGEoKSkge1xyXG4gICAgICAgICAgICBpZiAoY2Qua2xhc3MgIT0gbnVsbCAmJiBjZC5rbGFzcy5tb2R1bGUgIT0gbnVsbCAmJiBjZC5rbGFzcy5tb2R1bGUuaXNTeXN0ZW1Nb2R1bGUgJiZcclxuICAgICAgICAgICAgICAgIHVzZWRTeXN0ZW1DbGFzc2VzLmluZGV4T2YoY2Qua2xhc3MpIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdXNlZFN5c3RlbUNsYXNzZXMucHVzaChjZC5rbGFzcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQgaW50ZXJmIG9mIHRoaXMuaW1wbGVtZW50cykge1xyXG4gICAgICAgICAgICBpZiAoaW50ZXJmICE9IG51bGwgJiYgaW50ZXJmLm1vZHVsZS5pc1N5c3RlbU1vZHVsZSAmJlxyXG4gICAgICAgICAgICAgICAgdXNlZFN5c3RlbUNsYXNzZXMuaW5kZXhPZihpbnRlcmYpIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdXNlZFN5c3RlbUNsYXNzZXMucHVzaChpbnRlcmYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldENvbXBvc2l0ZURhdGEoKTogQ29tcG9zdGlvbkRhdGFbXSB7XHJcblxyXG4gICAgICAgIGxldCBjZDogQ29tcG9zdGlvbkRhdGFbXSA9IFtdO1xyXG4gICAgICAgIGxldCBjZE1hcDogTWFwPEtsYXNzIHwgSW50ZXJmYWNlLCBDb21wb3N0aW9uRGF0YT4gPSBuZXcgTWFwKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGEgb2YgdGhpcy5hdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChhLnR5cGUgaW5zdGFuY2VvZiBLbGFzcyB8fCBhLnR5cGUgaW5zdGFuY2VvZiBJbnRlcmZhY2UpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjZGEgPSBjZE1hcC5nZXQoYS50eXBlKTtcclxuICAgICAgICAgICAgICAgIGlmIChjZGEgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNkYSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAga2xhc3M6IGEudHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGVzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogYS5pZGVudGlmaWVyXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBjZE1hcC5zZXQoYS50eXBlLCBjZGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNkLnB1c2goY2RhKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2RhLmlkZW50aWZpZXIgKz0gXCIsIFwiICsgYS5pZGVudGlmaWVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGV0IHR5cGU6IFR5cGUgPSBhLnR5cGU7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAodHlwZSBpbnN0YW5jZW9mIEFycmF5VHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLmFycmF5T2ZUeXBlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgaW5zdGFuY2VvZiBLbGFzcyB8fCB0eXBlIGluc3RhbmNlb2YgSW50ZXJmYWNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNkYSA9IGNkTWFwLmdldCh0eXBlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2RhID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2RhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2xhc3M6IHR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZXM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBhLmlkZW50aWZpZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2RNYXAuc2V0KHR5cGUsIGNkYSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNkLnB1c2goY2RhKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjZGEuaWRlbnRpZmllciArPSBcIiwgXCIgKyBhLmlkZW50aWZpZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNkYS5tdWx0aXBsZXMgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNkO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBjbGVhclVzYWdlUG9zaXRpb25zKCkge1xyXG4gICAgICAgIHN1cGVyLmNsZWFyVXNhZ2VQb3NpdGlvbnMoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbSBvZiB0aGlzLm1ldGhvZHMpIHtcclxuICAgICAgICAgICAgbS5jbGVhclVzYWdlUG9zaXRpb25zKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBhIG9mIHRoaXMuYXR0cmlidXRlcykge1xyXG4gICAgICAgICAgICBhLnVzYWdlUG9zaXRpb25zID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGljQ2xhc3MgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRpY0NsYXNzLmNsZWFyVXNhZ2VQb3NpdGlvbnMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBnZXRQb3N0Q29uc3RydWN0b3JDYWxsYmFja3MoKTogKChyOiBSdW50aW1lT2JqZWN0KSA9PiB2b2lkKVtdIHtcclxuICAgICAgICBsZXQgYzogS2xhc3MgPSB0aGlzO1xyXG4gICAgICAgIGxldCBjYWxsYmFja3M6ICgocjogUnVudGltZU9iamVjdCkgPT4gdm9pZClbXSA9IG51bGw7XHJcblxyXG4gICAgICAgIHdoaWxlIChjICE9IG51bGwpIHtcclxuICAgICAgICAgICAgaWYgKGMucG9zdENvbnN0cnVjdG9yQ2FsbGJhY2tzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFja3MgPT0gbnVsbCkgeyBjYWxsYmFja3MgPSBjLnBvc3RDb25zdHJ1Y3RvckNhbGxiYWNrczsgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzID0gY2FsbGJhY2tzLmNvbmNhdChjLnBvc3RDb25zdHJ1Y3RvckNhbGxiYWNrcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYyA9IGMuYmFzZUNsYXNzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY2FsbGJhY2tzO1xyXG4gICAgfVxyXG5cclxuICAgIGdldENvbXBsZXRpb25JdGVtcyh2aXNpYmlsaXR5VXBUbzogVmlzaWJpbGl0eSxcclxuICAgICAgICBsZWZ0QnJhY2tldEFscmVhZHlUaGVyZTogYm9vbGVhbiwgaWRlbnRpZmllckFuZEJyYWNrZXRBZnRlckN1cnNvcjogc3RyaW5nLFxyXG4gICAgICAgIHJhbmdlVG9SZXBsYWNlOiBtb25hY28uSVJhbmdlLCBjdXJyZW50TWV0aG9kPzogTWV0aG9kKTogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbVtdIHtcclxuXHJcbiAgICAgICAgbGV0IGl0ZW1MaXN0OiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10gPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYXR0cmlidXRlIG9mIHRoaXMuZ2V0QXR0cmlidXRlcyh2aXNpYmlsaXR5VXBUbykpIHtcclxuICAgICAgICAgICAgaXRlbUxpc3QucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogYXR0cmlidXRlLmlkZW50aWZpZXIgKyBcIlwiLFxyXG4gICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuRmllbGQsXHJcbiAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBhdHRyaWJ1dGUuaWRlbnRpZmllcixcclxuICAgICAgICAgICAgICAgIHJhbmdlOiByYW5nZVRvUmVwbGFjZSxcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50YXRpb246IGF0dHJpYnV0ZS5kb2N1bWVudGF0aW9uID09IG51bGwgPyB1bmRlZmluZWQgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGF0dHJpYnV0ZS5kb2N1bWVudGF0aW9uXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgbWV0aG9kIG9mIHRoaXMuZ2V0TWV0aG9kcyh2aXNpYmlsaXR5VXBUbykpIHtcclxuICAgICAgICAgICAgaWYgKG1ldGhvZC5pc0NvbnN0cnVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudE1ldGhvZD8uaXNDb25zdHJ1Y3RvciAmJiBjdXJyZW50TWV0aG9kICE9IG1ldGhvZCAmJiB0aGlzLmJhc2VDbGFzcy5tZXRob2RzLmluZGV4T2YobWV0aG9kKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoU3VwZXJDb21wbGV0aW9uSXRlbShpdGVtTGlzdCwgbWV0aG9kLCBsZWZ0QnJhY2tldEFscmVhZHlUaGVyZSwgcmFuZ2VUb1JlcGxhY2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaXRlbUxpc3QucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogbWV0aG9kLmdldENvbXBsZXRpb25MYWJlbCgpLFxyXG4gICAgICAgICAgICAgICAgZmlsdGVyVGV4dDogbWV0aG9kLmlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICBjb21tYW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwiZWRpdG9yLmFjdGlvbi50cmlnZ2VyUGFyYW1ldGVySGludHNcIixcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJzEyMycsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLk1ldGhvZCxcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IG1ldGhvZC5nZXRDb21wbGV0aW9uU25pcHBldChsZWZ0QnJhY2tldEFscmVhZHlUaGVyZSksXHJcbiAgICAgICAgICAgICAgICByYW5nZTogcmFuZ2VUb1JlcGxhY2UsXHJcbiAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudGF0aW9uOiBtZXRob2QuZG9jdW1lbnRhdGlvbiA9PSBudWxsID8gdW5kZWZpbmVkIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBtZXRob2QuZG9jdW1lbnRhdGlvblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGl0ZW1MaXN0ID0gaXRlbUxpc3QuY29uY2F0KHRoaXMuc3RhdGljQ2xhc3MuZ2V0Q29tcGxldGlvbkl0ZW1zKHZpc2liaWxpdHlVcFRvLFxyXG4gICAgICAgICAgICBsZWZ0QnJhY2tldEFscmVhZHlUaGVyZSwgaWRlbnRpZmllckFuZEJyYWNrZXRBZnRlckN1cnNvcixcclxuICAgICAgICAgICAgcmFuZ2VUb1JlcGxhY2UpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGl0ZW1MaXN0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1c2hTdXBlckNvbXBsZXRpb25JdGVtKGl0ZW1MaXN0OiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10sIG1ldGhvZDogTWV0aG9kLCBsZWZ0QnJhY2tldEFscmVhZHlUaGVyZTogYm9vbGVhbixcclxuICAgICAgICByYW5nZVRvUmVwbGFjZTogbW9uYWNvLklSYW5nZSkge1xyXG4gICAgICAgIGl0ZW1MaXN0LnB1c2goe1xyXG4gICAgICAgICAgICBsYWJlbDogbWV0aG9kLmdldENvbXBsZXRpb25MYWJlbCgpLnJlcGxhY2UobWV0aG9kLmlkZW50aWZpZXIsIFwic3VwZXJcIiksXHJcbiAgICAgICAgICAgIGZpbHRlclRleHQ6IFwic3VwZXJcIixcclxuICAgICAgICAgICAgY29tbWFuZDoge1xyXG4gICAgICAgICAgICAgICAgaWQ6IFwiZWRpdG9yLmFjdGlvbi50cmlnZ2VyUGFyYW1ldGVySGludHNcIixcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAnMTIzJyxcclxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW11cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuTWV0aG9kLFxyXG4gICAgICAgICAgICBpbnNlcnRUZXh0OiBtZXRob2QuZ2V0Q29tcGxldGlvblNuaXBwZXQobGVmdEJyYWNrZXRBbHJlYWR5VGhlcmUpLnJlcGxhY2UobWV0aG9kLmlkZW50aWZpZXIsIFwic3VwZXJcIiksXHJcbiAgICAgICAgICAgIHJhbmdlOiByYW5nZVRvUmVwbGFjZSxcclxuICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICBkb2N1bWVudGF0aW9uOiBtZXRob2QuZG9jdW1lbnRhdGlvbiA9PSBudWxsID8gdW5kZWZpbmVkIDoge1xyXG4gICAgICAgICAgICAgICAgdmFsdWU6IG1ldGhvZC5kb2N1bWVudGF0aW9uXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVzaFN0YXRpY0luaXRpYWxpemF0aW9uUHJvZ3JhbXMocHJvZ3JhbVN0YWNrOiBQcm9ncmFtU3RhY2tFbGVtZW50W10pIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGljQ2xhc3MuYXR0cmlidXRlSW5pdGlhbGl6YXRpb25Qcm9ncmFtLnN0YXRlbWVudHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBwcm9ncmFtU3RhY2sucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBwcm9ncmFtOiB0aGlzLnN0YXRpY0NsYXNzLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbSxcclxuICAgICAgICAgICAgICAgIHByb2dyYW1Qb3NpdGlvbjogMCxcclxuICAgICAgICAgICAgICAgIHRleHRQb3NpdGlvbjogeyBsaW5lOiAxLCBjb2x1bW46IDEsIGxlbmd0aDogMCB9LFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIkluaXRpYWxpc2llcnVuZyBzdGF0aXNjaGVyIFZhcmlhYmxlbiBkZXIgS2xhc3NlIFwiICsgdGhpcy5zdGF0aWNDbGFzcy5pZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tBZnRlclJldHVybjogbnVsbCxcclxuICAgICAgICAgICAgICAgIGlzQ2FsbGVkRnJvbU91dHNpZGU6IFwiSW5pdGlhbGlzaWVydW5nIHN0YXRpc2NoZXIgQXR0cmlidXRlXCJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXRNZXRob2RCeVNpZ25hdHVyZShzaWduYXR1cmU6IHN0cmluZyk6IE1ldGhvZCB7XHJcblxyXG4gICAgICAgIGxldCBjOiBLbGFzcyA9IHRoaXM7XHJcbiAgICAgICAgd2hpbGUgKGMgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBsZXQgbWV0aG9kID0gYy5tZXRob2RNYXAuZ2V0KHNpZ25hdHVyZSk7XHJcbiAgICAgICAgICAgIGlmIChtZXRob2QgIT0gbnVsbCkgcmV0dXJuIG1ldGhvZDtcclxuICAgICAgICAgICAgYyA9IGMuYmFzZUNsYXNzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlcXVhbHModHlwZTogVHlwZSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0eXBlID09IHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0QmFzZUNsYXNzKGJhc2VDbGFzczogS2xhc3MpIHtcclxuICAgICAgICB0aGlzLmJhc2VDbGFzcyA9IGJhc2VDbGFzcztcclxuICAgICAgICB0aGlzLnN0YXRpY0NsYXNzLmJhc2VDbGFzcyA9IGJhc2VDbGFzcy5zdGF0aWNDbGFzcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkTWV0aG9kKG1ldGhvZDogTWV0aG9kKSB7XHJcbiAgICAgICAgaWYgKG1ldGhvZC5pc0NvbnN0cnVjdG9yKSB7XHJcbiAgICAgICAgICAgIG1ldGhvZC5yZXR1cm5UeXBlID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG1ldGhvZC5pc1N0YXRpYykge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRpY0NsYXNzLmFkZE1ldGhvZChtZXRob2QpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMubWV0aG9kcy5wdXNoKG1ldGhvZCk7XHJcbiAgICAgICAgICAgIHRoaXMubWV0aG9kTWFwLnNldChtZXRob2Quc2lnbmF0dXJlLCBtZXRob2QpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkQXR0cmlidXRlKGF0dHJpYnV0ZTogQXR0cmlidXRlKSB7XHJcbiAgICAgICAgaWYgKGF0dHJpYnV0ZS5pc1N0YXRpYykge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRpY0NsYXNzLmFkZEF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5wdXNoKGF0dHJpYnV0ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlTWFwLnNldChhdHRyaWJ1dGUuaWRlbnRpZmllciwgYXR0cmlidXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFJlc3VsdFR5cGUob3BlcmF0aW9uOiBUb2tlblR5cGUsIHNlY29uZE9wZXJhbmRUeXBlPzogVHlwZSk6IFR5cGUge1xyXG5cclxuICAgICAgICBpZiAob3BlcmF0aW9uID09IFRva2VuVHlwZS5lcXVhbCB8fCBvcGVyYXRpb24gPT0gVG9rZW5UeXBlLm5vdEVxdWFsKSB7XHJcbiAgICAgICAgICAgIGlmIChzZWNvbmRPcGVyYW5kVHlwZSBpbnN0YW5jZW9mIEtsYXNzIHx8IHNlY29uZE9wZXJhbmRUeXBlID09IG51bGxUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYm9vbGVhblByaW1pdGl2ZVR5cGVDb3B5O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAob3BlcmF0aW9uID09IFRva2VuVHlwZS5rZXl3b3JkSW5zdGFuY2VvZikge1xyXG4gICAgICAgICAgICBpZiAoc2Vjb25kT3BlcmFuZFR5cGUgaW5zdGFuY2VvZiBTdGF0aWNDbGFzcyB8fCBzZWNvbmRPcGVyYW5kVHlwZSBpbnN0YW5jZW9mIEludGVyZmFjZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJvb2xlYW5QcmltaXRpdmVUeXBlQ29weTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb21wdXRlKG9wZXJhdGlvbjogVG9rZW5UeXBlLCBmaXJzdE9wZXJhbmQ6IFZhbHVlLCBzZWNvbmRPcGVyYW5kPzogVmFsdWUpIHtcclxuICAgICAgICBpZiAob3BlcmF0aW9uID09IFRva2VuVHlwZS5lcXVhbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmlyc3RPcGVyYW5kLnZhbHVlID09IHNlY29uZE9wZXJhbmQudmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAob3BlcmF0aW9uID09IFRva2VuVHlwZS5ub3RFcXVhbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmlyc3RPcGVyYW5kLnZhbHVlICE9IHNlY29uZE9wZXJhbmQudmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAob3BlcmF0aW9uID09IFRva2VuVHlwZS5rZXl3b3JkSW5zdGFuY2VvZikge1xyXG4gICAgICAgICAgICBsZXQgZmlyc3RPcENsYXNzID0gZmlyc3RPcGVyYW5kPy52YWx1ZT8uY2xhc3M7XHJcbiAgICAgICAgICAgIGlmIChmaXJzdE9wQ2xhc3MgPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICBsZXQgdHlwZUxlZnQ6IEtsYXNzID0gPEtsYXNzPmZpcnN0T3BDbGFzcztcclxuICAgICAgICAgICAgbGV0IHR5cGVSaWdodCA9IHNlY29uZE9wZXJhbmQudHlwZTtcclxuICAgICAgICAgICAgaWYgKHR5cGVSaWdodCBpbnN0YW5jZW9mIFN0YXRpY0NsYXNzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHR5cGVMZWZ0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZUxlZnQgPT09IHR5cGVSaWdodC5LbGFzcykgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZUxlZnQgPSB0eXBlTGVmdC5iYXNlQ2xhc3M7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHR5cGVSaWdodCBpbnN0YW5jZW9mIEludGVyZmFjZSkge1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHR5cGVMZWZ0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpIG9mIHR5cGVMZWZ0LmltcGxlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT09IHR5cGVSaWdodCkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGVMZWZ0ID0gdHlwZUxlZnQuYmFzZUNsYXNzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBhbGwgdmlzaWJsZSBtZXRob2RzIG9mIHRoaXMgY2xhc3MgYW5kIGFsbCBvZiBpdHMgYmFzZSBjbGFzc2VzXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXRNZXRob2RzKHVwVG9WaXNpYmlsaXR5OiBWaXNpYmlsaXR5LCBpZGVudGlmaWVyPzogc3RyaW5nKTogTWV0aG9kW10ge1xyXG5cclxuICAgICAgICBsZXQgbWV0aG9kczogTWV0aG9kW10gPSB0aGlzLm1ldGhvZHMuZmlsdGVyKChtZXRob2QpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG1ldGhvZC52aXNpYmlsaXR5IDw9IHVwVG9WaXNpYmlsaXR5ICYmIChpZGVudGlmaWVyID09IG51bGwgfHwgbWV0aG9kLmlkZW50aWZpZXIgPT0gaWRlbnRpZmllcik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJhc2VDbGFzcyAhPSBudWxsICYmIChpZGVudGlmaWVyID09IG51bGwgfHwgaWRlbnRpZmllciAhPSB0aGlzLmlkZW50aWZpZXIgfHwgbWV0aG9kcy5sZW5ndGggPT0gMCkpIHtcclxuICAgICAgICAgICAgbGV0IGJhc2VDbGFzc1VwdG9WaXNpYmlsaXR5ID0gdXBUb1Zpc2liaWxpdHkgPT0gVmlzaWJpbGl0eS5wdWJsaWMgPyB1cFRvVmlzaWJpbGl0eSA6IFZpc2liaWxpdHkucHJvdGVjdGVkO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgbSBvZiB0aGlzLmJhc2VDbGFzcy5nZXRNZXRob2RzKGJhc2VDbGFzc1VwdG9WaXNpYmlsaXR5LCBpZGVudGlmaWVyID09IHRoaXMuaWRlbnRpZmllciA/IHRoaXMuYmFzZUNsYXNzLmlkZW50aWZpZXIgOiBpZGVudGlmaWVyKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbTEgb2YgbWV0aG9kcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtMS5zaWduYXR1cmUgPT0gbS5zaWduYXR1cmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHMucHVzaChtKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBtZXRob2RzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBhbGwgdmlzaWJsZSBhdHRyaWJ1dGVzIG9mIHRoaXMgY2xhc3MgYW5kIGFsbCBvZiBpdHMgYmFzZSBjbGFzc2VzXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXRBdHRyaWJ1dGVzKHVwVG9WaXNpYmlsaXR5OiBWaXNpYmlsaXR5KTogQXR0cmlidXRlW10ge1xyXG5cclxuICAgICAgICBsZXQgYXR0cmlidXRlczogQXR0cmlidXRlW10gPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBhIG9mIHRoaXMuYXR0cmlidXRlcykge1xyXG4gICAgICAgICAgICBpZiAoYS52aXNpYmlsaXR5IDw9IHVwVG9WaXNpYmlsaXR5KSB7XHJcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzLnB1c2goYSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJhc2VDbGFzcyAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgdXBUb1Zpc2liaWxpdHlJbkJhc2VDbGFzcyA9IHVwVG9WaXNpYmlsaXR5ID09IFZpc2liaWxpdHkucHVibGljID8gdXBUb1Zpc2liaWxpdHkgOiBWaXNpYmlsaXR5LnByb3RlY3RlZDtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGEgb2YgdGhpcy5iYXNlQ2xhc3MuZ2V0QXR0cmlidXRlcyh1cFRvVmlzaWJpbGl0eUluQmFzZUNsYXNzKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChhLnZpc2liaWxpdHkgPiB1cFRvVmlzaWJpbGl0eUluQmFzZUNsYXNzKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBhMSBvZiBhdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGExLmlkZW50aWZpZXIgPT0gYS5pZGVudGlmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICghZm91bmQpIHtcclxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzLnB1c2goYSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXR0cmlidXRlcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaGFzQ29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgZm9yIChsZXQgbSBvZiB0aGlzLm1ldGhvZHMpIHtcclxuICAgICAgICAgICAgaWYgKG0uaXNDb25zdHJ1Y3RvcikgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5iYXNlQ2xhc3MgIT0gbnVsbCkgcmV0dXJuIHRoaXMuYmFzZUNsYXNzLmhhc0NvbnN0cnVjdG9yKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaGFzUGFyYW1ldGVybGVzc0NvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIGxldCBoYXNDb25zdHJ1Y3RvcldpdGhQYXJhbWV0ZXJzOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICAgICAgZm9yIChsZXQgbSBvZiB0aGlzLm1ldGhvZHMpIHtcclxuICAgICAgICAgICAgaWYgKG0uaXNDb25zdHJ1Y3Rvcikge1xyXG4gICAgICAgICAgICAgICAgaWYgKG0ucGFyYW1ldGVybGlzdC5wYXJhbWV0ZXJzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGhhc0NvbnN0cnVjdG9yV2l0aFBhcmFtZXRlcnMgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFoYXNDb25zdHJ1Y3RvcldpdGhQYXJhbWV0ZXJzICYmIHRoaXMuYmFzZUNsYXNzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmFzZUNsYXNzLmhhc1BhcmFtZXRlcmxlc3NDb25zdHJ1Y3RvcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRQYXJhbWV0ZXJsZXNzQ29uc3RydWN0b3IoKTogTWV0aG9kIHtcclxuICAgICAgICBmb3IgKGxldCBtIG9mIHRoaXMubWV0aG9kcykge1xyXG4gICAgICAgICAgICBpZiAobS5pc0NvbnN0cnVjdG9yICYmIG0ucGFyYW1ldGVybGlzdC5wYXJhbWV0ZXJzLmxlbmd0aCA9PSAwKSByZXR1cm4gbTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJhc2VDbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJhc2VDbGFzcy5nZXRQYXJhbWV0ZXJsZXNzQ29uc3RydWN0b3IoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q29uc3RydWN0b3IocGFyYW1ldGVyVHlwZXM6IFR5cGVbXSwgdXBUb1Zpc2liaWxpdHk6IFZpc2liaWxpdHksIGNsYXNzSWRlbnRpZmllcjogc3RyaW5nID0gdGhpcy5pZGVudGlmaWVyKTogeyBlcnJvcjogc3RyaW5nLCBtZXRob2RMaXN0OiBNZXRob2RbXSB9IHtcclxuXHJcbiAgICAgICAgbGV0IGNvbnN0cnVjdG9yczogTWV0aG9kW10gPSB0aGlzLm1ldGhvZHMuZmlsdGVyKChtKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBtLmlzQ29uc3RydWN0b3I7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChjb25zdHJ1Y3RvcnMubGVuZ3RoID09IDAgJiYgdGhpcy5iYXNlQ2xhc3MgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5iYXNlQ2xhc3MuZ2V0Q29uc3RydWN0b3IocGFyYW1ldGVyVHlwZXMsIHVwVG9WaXNpYmlsaXR5LCBjbGFzc0lkZW50aWZpZXIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmaW5kU3VpdGFibGVNZXRob2RzKGNvbnN0cnVjdG9ycywgdGhpcy5pZGVudGlmaWVyLCBwYXJhbWV0ZXJUeXBlcywgY2xhc3NJZGVudGlmaWVyLCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRNZXRob2RzVGhhdEZpdFdpdGhDYXN0aW5nKGlkZW50aWZpZXI6IHN0cmluZywgcGFyYW1ldGVyVHlwZXM6IFR5cGVbXSxcclxuICAgICAgICBzZWFyY2hDb25zdHJ1Y3RvcjogYm9vbGVhbiwgdXBUb1Zpc2liaWxpdHk6IFZpc2liaWxpdHkpOiB7IGVycm9yOiBzdHJpbmcsIG1ldGhvZExpc3Q6IE1ldGhvZFtdIH0ge1xyXG5cclxuICAgICAgICBsZXQgYWxsTWV0aG9kcyA9IHRoaXMuZ2V0TWV0aG9kcyh1cFRvVmlzaWJpbGl0eSk7XHJcblxyXG4gICAgICAgIGxldCBtZXRob2RzID0gZmluZFN1aXRhYmxlTWV0aG9kcyhhbGxNZXRob2RzLCBpZGVudGlmaWVyLCBwYXJhbWV0ZXJUeXBlcywgdGhpcy5pZGVudGlmaWVyLCBzZWFyY2hDb25zdHJ1Y3Rvcik7XHJcblxyXG4gICAgICAgIGlmIChtZXRob2RzLm1ldGhvZExpc3QubGVuZ3RoID09IDAgJiYgIXNlYXJjaENvbnN0cnVjdG9yKSB7XHJcbiAgICAgICAgICAgIGxldCBzdGF0aWNNZXRob2RzID0gdGhpcy5zdGF0aWNDbGFzcy5nZXRNZXRob2RzVGhhdEZpdFdpdGhDYXN0aW5nKGlkZW50aWZpZXIsIHBhcmFtZXRlclR5cGVzLCBmYWxzZSwgdXBUb1Zpc2liaWxpdHkpO1xyXG4gICAgICAgICAgICBpZiAoc3RhdGljTWV0aG9kcy5lcnJvciA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGljTWV0aG9kcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1ldGhvZHM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbWV0aG9kcztcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE1ldGhvZChpZGVudGlmaWVyOiBzdHJpbmcsIHBhcmFtZXRlcmxpc3Q6IFBhcmFtZXRlcmxpc3QpOiBNZXRob2Qge1xyXG5cclxuICAgICAgICBsZXQgbWV0aG9kID0gdGhpcy5tZXRob2RNYXAuZ2V0KGlkZW50aWZpZXIgKyBwYXJhbWV0ZXJsaXN0LmlkKTtcclxuXHJcbiAgICAgICAgaWYgKG1ldGhvZCA9PSBudWxsICYmIHRoaXMuYmFzZUNsYXNzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmFzZUNsYXNzLmdldE1ldGhvZChpZGVudGlmaWVyLCBwYXJhbWV0ZXJsaXN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBtZXRob2Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEF0dHJpYnV0ZShpZGVudGlmaWVyOiBzdHJpbmcsIHVwVG9WaXNpYmlsaXR5OiBWaXNpYmlsaXR5KTogeyBhdHRyaWJ1dGU6IEF0dHJpYnV0ZSwgZXJyb3I6IHN0cmluZywgZm91bmRCdXRJbnZpc2libGU6IGJvb2xlYW4gfSB7XHJcblxyXG4gICAgICAgIGxldCBlcnJvciA9IG51bGw7XHJcbiAgICAgICAgbGV0IGZvdW5kQnV0SW52aXNpYmxlOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGxldCBhdHRyaWJ1dGUgPSB0aGlzLmF0dHJpYnV0ZU1hcC5nZXQoaWRlbnRpZmllcik7XHJcbiAgICAgICAgbGV0IGF0dHJpYnV0ZU5vdEZvdW5kID0gYXR0cmlidXRlID09IG51bGw7XHJcblxyXG4gICAgICAgIGlmIChhdHRyaWJ1dGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBlcnJvciA9IFwiRGFzIEF0dHJpYnV0IFwiICsgaWRlbnRpZmllciArIFwiIGthbm4gbmljaHQgZ2VmdW5kZW4gd2VyZGVuLlwiO1xyXG4gICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICBpZiAoYXR0cmlidXRlLnZpc2liaWxpdHkgPiB1cFRvVmlzaWJpbGl0eSkge1xyXG4gICAgICAgICAgICAgICAgZXJyb3IgPSBcIkRhcyBBdHRyaWJ1dCBcIiArIGlkZW50aWZpZXIgKyBcIiBoYXQgZGllIFNpY2h0YmFya2VpdCBcIiArIFZpc2liaWxpdHlbYXR0cmlidXRlLnZpc2liaWxpdHldICsgXCIgdW5kIGlzdCBkYWhlciBoaWVyIG5pY2h0IHNpY2h0YmFyLlwiO1xyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGZvdW5kQnV0SW52aXNpYmxlID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXR0cmlidXRlID09IG51bGwgJiYgdGhpcy5iYXNlQ2xhc3MgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBsZXQgdXBUb1Zpc2liaWxpdHlJbkJhc2VDbGFzcyA9IHVwVG9WaXNpYmlsaXR5ID09IFZpc2liaWxpdHkucHVibGljID8gdXBUb1Zpc2liaWxpdHkgOiBWaXNpYmlsaXR5LnByb3RlY3RlZDtcclxuXHJcbiAgICAgICAgICAgIGxldCBiYXNlQ2xhc3NBdHRyaWJ1dGUgPSB0aGlzLmJhc2VDbGFzcy5nZXRBdHRyaWJ1dGUoaWRlbnRpZmllciwgdXBUb1Zpc2liaWxpdHlJbkJhc2VDbGFzcyk7XHJcbiAgICAgICAgICAgIGlmIChiYXNlQ2xhc3NBdHRyaWJ1dGUuYXR0cmlidXRlICE9IG51bGwgfHwgYXR0cmlidXRlTm90Rm91bmQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBiYXNlQ2xhc3NBdHRyaWJ1dGU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geyBhdHRyaWJ1dGU6IGF0dHJpYnV0ZSwgZXJyb3I6IGVycm9yLCBmb3VuZEJ1dEludmlzaWJsZTogZm91bmRCdXRJbnZpc2libGUgfTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FuQ2FzdFRvKHR5cGU6IFR5cGUpOiBib29sZWFuIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGUgPT0gc3RyaW5nUHJpbWl0aXZlVHlwZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlIGluc3RhbmNlb2YgS2xhc3MpIHtcclxuICAgICAgICAgICAgbGV0IGJhc2VDbGFzczogS2xhc3MgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKGJhc2VDbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZS5nZXROb25HZW5lcmljSWRlbnRpZmllcigpID09IGJhc2VDbGFzcy5nZXROb25HZW5lcmljSWRlbnRpZmllcigpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUudHlwZVZhcmlhYmxlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuOiBudW1iZXIgPSBNYXRoLm1pbih0eXBlLnR5cGVWYXJpYWJsZXMubGVuZ3RoLCBiYXNlQ2xhc3MudHlwZVZhcmlhYmxlcy5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFiYXNlQ2xhc3MudHlwZVZhcmlhYmxlc1tpXS50eXBlLmNhbkNhc3RUbyh0eXBlLnR5cGVWYXJpYWJsZXNbaV0udHlwZSkpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBiYXNlQ2xhc3MgPSBiYXNlQ2xhc3MuYmFzZUNsYXNzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIEludGVyZmFjZSkge1xyXG5cclxuICAgICAgICAgICAgbGV0IGtsYXNzOiBLbGFzcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIHdoaWxlIChrbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpIG9mIGtsYXNzLmltcGxlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2hvdWxkSW1wbGVtZW50ID0gdHlwZS5nZXROb25HZW5lcmljSWRlbnRpZmllcigpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGxvb2sgcmVjdXJzaXZlbHkgaW50byBpbnRlcmZhY2UgaW5oZXJpdGFuY2UgY2hhaW46ICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaS5nZXRUaGlzT3JFeHRlbmRlZEludGVyZmFjZShzaG91bGRJbXBsZW1lbnQpICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAga2xhc3MgPSBrbGFzcy5iYXNlQ2xhc3M7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhc3RUbyh2YWx1ZTogVmFsdWUsIHR5cGU6IFR5cGUpOiBWYWx1ZSB7XHJcblxyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgY2hlY2tJbmhlcml0YW5jZSgpOiB7IG1lc3NhZ2U6IHN0cmluZywgbWlzc2luZ01ldGhvZHM6IE1ldGhvZFtdIH0ge1xyXG5cclxuICAgICAgICBpZiAodGhpcy5iYXNlQ2xhc3MgIT0gbnVsbCAmJiBLbGFzcy5kb250SW5oZXJpdEZyb20uaW5kZXhPZih0aGlzLmJhc2VDbGFzcy5pZGVudGlmaWVyKSA+PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IG1lc3NhZ2U6IFwiQXVzIFBlcmZvcm1hbmNlZ3LDvG5kZW4gaXN0IGVzIGxlaWRlciBuaWNodCBtw7ZnbGljaCwgVW50ZXJrbGFzc2VuIGRlciBLbGFzc2VuIFN0cmluZywgQm9vbGVhbiwgQ2hhcmFjdGVyLCBJbnRlZ2VyLCBGbG9hdCB1bmQgRG91YmxlIHp1IGJpbGRlbi5cIiwgbWlzc2luZ01ldGhvZHM6IFtdIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbWVzc2FnZSA9IFwiXCI7XHJcbiAgICAgICAgbGV0IG1pc3NpbmdBYnN0cmFjdE1ldGhvZHM6IE1ldGhvZFtdID0gW107XHJcbiAgICAgICAgbGV0IGltcGxlbWVudGVkTWV0aG9kczogTWV0aG9kW10gPSBbXTtcclxuXHJcbiAgICAgICAgbGV0IG1pc3NpbmdJbnRlcmZhY2VNZXRob2RzOiBNZXRob2RbXSA9IFtdO1xyXG5cclxuICAgICAgICBsZXQga2xhc3M6IEtsYXNzID0gdGhpcztcclxuICAgICAgICBsZXQgaGllcmFyY2h5OiBzdHJpbmdbXSA9IFtrbGFzcy5pZGVudGlmaWVyXTtcclxuICAgICAgICB3aGlsZSAoa2xhc3MuYmFzZUNsYXNzICE9IG51bGwpIHtcclxuICAgICAgICAgICAga2xhc3MgPSBrbGFzcy5iYXNlQ2xhc3M7XHJcbiAgICAgICAgICAgIGlmIChoaWVyYXJjaHkuaW5kZXhPZihrbGFzcy5pZGVudGlmaWVyKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBrbGFzcy5iYXNlQ2xhc3MgPSBudWxsOyAgLy8gVGhpcyBpcyBuZWNlc3NhcnkgdG8gYXZvaWQgaW5maW5pdGUgbG9vcHMgaW4gZnVydGhlciBjb21waWxhdGlvblxyXG4gICAgICAgICAgICAgICAgaGllcmFyY2h5ID0gW2tsYXNzLmlkZW50aWZpZXJdLmNvbmNhdChoaWVyYXJjaHkpO1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IFwiRGllIEtsYXNzZSBcIiArIGtsYXNzLmlkZW50aWZpZXIgKyBcIiBlcmJ0IHZvbiBzaWNoIHNlbGJzdDogXCI7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlICs9IFwiKFwiICsgaGllcmFyY2h5LmpvaW4oXCIgZXh0ZW5kcyBcIikgKyBcIilcIjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGhpZXJhcmNoeSA9IFtrbGFzcy5pZGVudGlmaWVyXS5jb25jYXQoaGllcmFyY2h5KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtZXNzYWdlID09IFwiXCIpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmJhc2VDbGFzcyAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFic3RyYWN0TWV0aG9kczogTWV0aG9kW10gPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQga2xhc3M6IEtsYXNzID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb2xsZWN0IGFic3RyYWN0IE1ldGhvZHNcclxuICAgICAgICAgICAgICAgIHdoaWxlIChrbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgbSBvZiBrbGFzcy5tZXRob2RzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtLmlzQWJzdHJhY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFic3RyYWN0TWV0aG9kcy5wdXNoKG0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGlzSW1wbGVtZW50ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG0xIG9mIGltcGxlbWVudGVkTWV0aG9kcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtMS5pbXBsZW1lbnRzKG0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzSW1wbGVtZW50ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzSW1wbGVtZW50ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaXNzaW5nQWJzdHJhY3RNZXRob2RzLnB1c2gobSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbXBsZW1lbnRlZE1ldGhvZHMucHVzaChtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBrbGFzcyA9IGtsYXNzLmJhc2VDbGFzcztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChtaXNzaW5nQWJzdHJhY3RNZXRob2RzLmxlbmd0aCA+IDAgJiYgIXRoaXMuaXNBYnN0cmFjdCkge1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IFwiRGllIEtsYXNzZSBcIiArIHRoaXMuaWRlbnRpZmllciArIFwiIG11c3Mgbm9jaCBmb2xnZW5kZSBNZXRob2RlbiBpaHJlciBhYnN0cmFrdGVuIEJhc2lza2xhc3NlbiBpbXBsZW1lbnRpZXJlbjogXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZSArPSBtaXNzaW5nQWJzdHJhY3RNZXRob2RzLm1hcCgobSkgPT4gbS5nZXRTaWduYXR1cmVXaXRoUmV0dXJuUGFyYW1ldGVyKCkpLmpvaW4oXCIsIFwiKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgb2YgdGhpcy5pbXBsZW1lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBtIG9mIGkuZ2V0TWV0aG9kcygpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGlzSW1wbGVtZW50ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBtMSBvZiBpbXBsZW1lbnRlZE1ldGhvZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG0xLmltcGxlbWVudHMobSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzSW1wbGVtZW50ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0ltcGxlbWVudGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pc3NpbmdJbnRlcmZhY2VNZXRob2RzLnB1c2gobSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobWlzc2luZ0ludGVyZmFjZU1ldGhvZHMubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlICE9IFwiXCIpIG1lc3NhZ2UgKz0gXCJcXG5cIjtcclxuXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlICs9IFwiRGllIEtsYXNzZSBcIiArIHRoaXMuaWRlbnRpZmllciArIFwiIG11c3Mgbm9jaCBmb2xnZW5kZSBNZXRob2RlbiBkZXIgdm9uIGlociBpbXBsZW1lbnRpZXJ0ZW4gSW50ZXJmYWNlcyBpbXBsZW1lbnRpZXJlbjogXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZSArPSBtaXNzaW5nSW50ZXJmYWNlTWV0aG9kcy5tYXAoKG0pID0+IG0uc2lnbmF0dXJlKS5qb2luKFwiLCBcIik7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHsgbWVzc2FnZTogbWVzc2FnZSwgbWlzc2luZ01ldGhvZHM6IG1pc3NpbmdBYnN0cmFjdE1ldGhvZHMuY29uY2F0KG1pc3NpbmdJbnRlcmZhY2VNZXRob2RzKSB9O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBoYXNBbmNlc3Rvck9ySXMoYTogS2xhc3MgfCBTdGF0aWNDbGFzcykge1xyXG4gICAgICAgIGxldCBjOiBLbGFzcyB8IFN0YXRpY0NsYXNzID0gdGhpcztcclxuICAgICAgICBsZXQgaWQgPSBhLmlkZW50aWZpZXI7XHJcbiAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBLbGFzcykgaWQgPSBhLmdldE5vbkdlbmVyaWNJZGVudGlmaWVyKCk7XHJcblxyXG4gICAgICAgIHdoaWxlIChjICE9IG51bGwpIHtcclxuICAgICAgICAgICAgaWYgKGMuZ2V0Tm9uR2VuZXJpY0lkZW50aWZpZXIoKSA9PSBpZCkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGMgPSBjLmJhc2VDbGFzcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZWJ1Z091dHB1dCh2YWx1ZTogVmFsdWUsIG1heExlbmd0aDogbnVtYmVyID0gNDApOiBzdHJpbmcge1xyXG5cclxuICAgICAgICBsZXQgczogc3RyaW5nID0gXCJ7XCI7XHJcbiAgICAgICAgbGV0IGF0dHJpYnV0ZXMgPSB0aGlzLmdldEF0dHJpYnV0ZXMoVmlzaWJpbGl0eS5wcml2YXRlKTtcclxuICAgICAgICBsZXQgb2JqZWN0ID0gPFJ1bnRpbWVPYmplY3Q+dmFsdWUudmFsdWU7XHJcblxyXG4gICAgICAgIGlmIChvYmplY3QgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJudWxsXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2ldO1xyXG4gICAgICAgICAgICBsZXQgdiA9IG9iamVjdC5nZXRWYWx1ZShhdHRyaWJ1dGUuaW5kZXgpO1xyXG4gICAgICAgICAgICBpZiAoYXR0cmlidXRlLnR5cGUgaW5zdGFuY2VvZiBQcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICBzICs9IGF0dHJpYnV0ZS5pZGVudGlmaWVyICsgXCI6Jm5ic3A7XCIgKyBhdHRyaWJ1dGUudHlwZS5kZWJ1Z091dHB1dCh2LCBtYXhMZW5ndGggLyAyKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHMgKz0gYXR0cmlidXRlLmlkZW50aWZpZXIgKyBcIjombmJzcDsgey4uLn1cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaSA8IGF0dHJpYnV0ZXMubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgcyArPSBcIiwmbmJzcDtcIjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzICsgXCJ9XCI7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc3RhdGljIGNvdW50OiBudW1iZXIgPSAwO1xyXG4gICAgY2xvbmUoKTogS2xhc3Mge1xyXG4gICAgICAgIC8vIEtsYXNzLmNvdW50Kys7XHJcblxyXG4gICAgICAgIGxldCBuZXdLbGFzczogS2xhc3MgPSBPYmplY3QuY3JlYXRlKHRoaXMpO1xyXG5cclxuICAgICAgICBuZXdLbGFzcy5pbXBsZW1lbnRzID0gdGhpcy5pbXBsZW1lbnRzLnNsaWNlKDApO1xyXG4gICAgICAgIG5ld0tsYXNzLnVzYWdlUG9zaXRpb25zID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIG5ld0tsYXNzLmlzR2VuZXJpY1ZhcmlhbnRGcm9tID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ld0tsYXNzO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFN0YXRpY0NsYXNzIGV4dGVuZHMgVHlwZSB7XHJcblxyXG4gICAgYmFzZUNsYXNzOiBTdGF0aWNDbGFzcztcclxuICAgIEtsYXNzOiBLbGFzcztcclxuICAgIC8vIFRPRE86IEluaXRpYWxpemVcclxuICAgIGNsYXNzT2JqZWN0OiBSdW50aW1lT2JqZWN0O1xyXG5cclxuICAgIGF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbTogUHJvZ3JhbTtcclxuXHJcbiAgICBwdWJsaWMgbWV0aG9kczogTWV0aG9kW10gPSBbXTtcclxuICAgIHByaXZhdGUgbWV0aG9kTWFwOiBNYXA8c3RyaW5nLCBNZXRob2Q+ID0gbmV3IE1hcCgpO1xyXG5cclxuICAgIHB1YmxpYyBhdHRyaWJ1dGVzOiBBdHRyaWJ1dGVbXSA9IFtdO1xyXG4gICAgcHVibGljIGF0dHJpYnV0ZU1hcDogTWFwPHN0cmluZywgQXR0cmlidXRlPiA9IG5ldyBNYXAoKTtcclxuICAgIHB1YmxpYyBudW1iZXJPZkF0dHJpYnV0ZXNJbmNsdWRpbmdCYXNlQ2xhc3M6IG51bWJlciA9IG51bGw7XHJcblxyXG4gICAgY29uc3RydWN0b3Ioa2xhc3M6IEtsYXNzKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5LbGFzcyA9IGtsYXNzO1xyXG4gICAgICAgIHRoaXMuaWRlbnRpZmllciA9IGtsYXNzLmlkZW50aWZpZXI7XHJcblxyXG4gICAgICAgIGlmIChrbGFzcy5iYXNlQ2xhc3MgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLmJhc2VDbGFzcyA9IGtsYXNzLmJhc2VDbGFzcy5zdGF0aWNDbGFzcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlSW5pdGlhbGl6YXRpb25Qcm9ncmFtID0ge1xyXG4gICAgICAgICAgICBtZXRob2Q6IG51bGwsXHJcbiAgICAgICAgICAgIG1vZHVsZTogdGhpcy5LbGFzcy5tb2R1bGUsXHJcbiAgICAgICAgICAgIHN0YXRlbWVudHM6IFtdLFxyXG4gICAgICAgICAgICBsYWJlbE1hbmFnZXI6IG51bGxcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlSW5pdGlhbGl6YXRpb25Qcm9ncmFtLmxhYmVsTWFuYWdlciA9IG5ldyBMYWJlbE1hbmFnZXIodGhpcy5hdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZXR1cEF0dHJpYnV0ZUluZGljZXNSZWN1cnNpdmUoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYmFzZUNsYXNzICE9IG51bGwgJiYgdGhpcy5iYXNlQ2xhc3MubnVtYmVyT2ZBdHRyaWJ1dGVzSW5jbHVkaW5nQmFzZUNsYXNzID09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5iYXNlQ2xhc3Muc2V0dXBBdHRyaWJ1dGVJbmRpY2VzUmVjdXJzaXZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBudW1iZXJPZkF0dHJpYnV0ZXNJbkJhc2VDbGFzc2VzID0gdGhpcy5iYXNlQ2xhc3MgPT0gbnVsbCA/IDAgOiB0aGlzLmJhc2VDbGFzcy5udW1iZXJPZkF0dHJpYnV0ZXNJbmNsdWRpbmdCYXNlQ2xhc3M7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGEgb2YgdGhpcy5hdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICAgIGEuaW5kZXggPSBudW1iZXJPZkF0dHJpYnV0ZXNJbkJhc2VDbGFzc2VzKys7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuaWRlbnRpZmllciArIFwiLlwiICsgYS5pZGVudGlmaWVyKyBcIjogXCIgKyBhLmluZGV4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubnVtYmVyT2ZBdHRyaWJ1dGVzSW5jbHVkaW5nQmFzZUNsYXNzID0gbnVtYmVyT2ZBdHRyaWJ1dGVzSW5CYXNlQ2xhc3NlcztcclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIGNsZWFyVXNhZ2VQb3NpdGlvbnMoKSB7XHJcbiAgICAgICAgc3VwZXIuY2xlYXJVc2FnZVBvc2l0aW9ucygpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBtIG9mIHRoaXMubWV0aG9kcykge1xyXG4gICAgICAgICAgICBtLmNsZWFyVXNhZ2VQb3NpdGlvbnMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGEgb2YgdGhpcy5hdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICAgIGEudXNhZ2VQb3NpdGlvbnMgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZGVidWdPdXRwdXQodmFsdWU6IFZhbHVlLCBtYXhMZW5ndGg6IG51bWJlciA9IDQwKTogc3RyaW5nIHtcclxuXHJcbiAgICAgICAgbGV0IHM6IHN0cmluZyA9IFwie1wiO1xyXG4gICAgICAgIGxldCBhdHRyaWJ1dGVzID0gdGhpcy5nZXRBdHRyaWJ1dGVzKFZpc2liaWxpdHkucHJpdmF0ZSk7XHJcbiAgICAgICAgbGV0IG9iamVjdCA9IHRoaXMuY2xhc3NPYmplY3Q7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgbGV0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbaV07XHJcbiAgICAgICAgICAgIHMgKz0gYXR0cmlidXRlLmlkZW50aWZpZXIgKyBcIjogXCIgKyBvYmplY3QgPT0gbnVsbCA/ICctLS0nIDogYXR0cmlidXRlLnR5cGU/LmRlYnVnT3V0cHV0KG9iamVjdC5nZXRWYWx1ZShhdHRyaWJ1dGUuaW5kZXgpLCBtYXhMZW5ndGggLyAyKTtcclxuICAgICAgICAgICAgaWYgKGkgPCBhdHRyaWJ1dGVzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgIHMgKz0gXCIsIFwiO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHMgKyBcIn1cIjtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZ2V0Q29tcGxldGlvbkl0ZW1zKHZpc2liaWxpdHlVcFRvOiBWaXNpYmlsaXR5LFxyXG4gICAgICAgIGxlZnRCcmFja2V0QWxyZWFkeVRoZXJlOiBib29sZWFuLCBpZGVudGlmaWVyQW5kQnJhY2tldEFmdGVyQ3Vyc29yOiBzdHJpbmcsXHJcbiAgICAgICAgcmFuZ2VUb1JlcGxhY2U6IG1vbmFjby5JUmFuZ2UpOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10ge1xyXG5cclxuICAgICAgICBsZXQgaXRlbUxpc3Q6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1bXSA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBhdHRyaWJ1dGUgb2YgdGhpcy5nZXRBdHRyaWJ1dGVzKHZpc2liaWxpdHlVcFRvKSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaXRlbUxpc3QucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogYXR0cmlidXRlLmlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgIGRldGFpbDogYXR0cmlidXRlLmNvbG9yPyBhdHRyaWJ1dGUuY29sb3IgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgIGtpbmQ6IGF0dHJpYnV0ZS5jb2xvcj8gbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuQ29sb3IgOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5GaWVsZCxcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IGF0dHJpYnV0ZS5pZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgcmFuZ2U6IHJhbmdlVG9SZXBsYWNlLFxyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnRhdGlvbjogYXR0cmlidXRlLmRvY3VtZW50YXRpb24gPT0gbnVsbCA/IHVuZGVmaW5lZCA6IHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogYXR0cmlidXRlLmRvY3VtZW50YXRpb25cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBtZXRob2Qgb2YgdGhpcy5nZXRNZXRob2RzKHZpc2liaWxpdHlVcFRvKSkge1xyXG4gICAgICAgICAgICBpdGVtTGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGxhYmVsOiBtZXRob2QuZ2V0Q29tcGxldGlvbkxhYmVsKCksXHJcbiAgICAgICAgICAgICAgICBmaWx0ZXJUZXh0OiBtZXRob2QuaWRlbnRpZmllcixcclxuICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLk1ldGhvZCxcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IG1ldGhvZC5nZXRDb21wbGV0aW9uU25pcHBldChsZWZ0QnJhY2tldEFscmVhZHlUaGVyZSksXHJcbiAgICAgICAgICAgICAgICByYW5nZTogcmFuZ2VUb1JlcGxhY2UsXHJcbiAgICAgICAgICAgICAgICBjb21tYW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwiZWRpdG9yLmFjdGlvbi50cmlnZ2VyUGFyYW1ldGVySGludHNcIixcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJzEyMycsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50YXRpb246IG1ldGhvZC5kb2N1bWVudGF0aW9uID09IG51bGwgPyB1bmRlZmluZWQgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG1ldGhvZC5kb2N1bWVudGF0aW9uXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGl0ZW1MaXN0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlcXVhbHModHlwZTogVHlwZSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0eXBlID09IHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZE1ldGhvZChtZXRob2Q6IE1ldGhvZCkge1xyXG4gICAgICAgIHRoaXMubWV0aG9kcy5wdXNoKG1ldGhvZCk7XHJcbiAgICAgICAgdGhpcy5tZXRob2RNYXAuc2V0KG1ldGhvZC5zaWduYXR1cmUsIG1ldGhvZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZEF0dHJpYnV0ZShhdHRyaWJ1dGU6IEF0dHJpYnV0ZSkge1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5wdXNoKGF0dHJpYnV0ZSk7XHJcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVNYXAuc2V0KGF0dHJpYnV0ZS5pZGVudGlmaWVyLCBhdHRyaWJ1dGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRSZXN1bHRUeXBlKG9wZXJhdGlvbjogVG9rZW5UeXBlLCBzZWNvbmRPcGVyYW5kVHlwZT86IFR5cGUpOiBUeXBlIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb21wdXRlKG9wZXJhdGlvbjogVG9rZW5UeXBlLCBmaXJzdE9wZXJhbmQ6IFZhbHVlLCBzZWNvbmRPcGVyYW5kPzogVmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0TWV0aG9kc1RoYXRGaXRXaXRoQ2FzdGluZyhpZGVudGlmaWVyOiBzdHJpbmcsIHBhcmFtZXRlclR5cGVzOiBUeXBlW10sXHJcbiAgICAgICAgc2VhcmNoQ29uc3RydWN0b3I6IGJvb2xlYW4sIHVwVG9WaXNpYmlsaXR5OiBWaXNpYmlsaXR5KTogeyBlcnJvcjogc3RyaW5nLCBtZXRob2RMaXN0OiBNZXRob2RbXSB9IHtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZpbmRTdWl0YWJsZU1ldGhvZHModGhpcy5nZXRNZXRob2RzKHVwVG9WaXNpYmlsaXR5KSwgaWRlbnRpZmllciwgcGFyYW1ldGVyVHlwZXMsXHJcbiAgICAgICAgICAgIHRoaXMuS2xhc3MuaWRlbnRpZmllciwgc2VhcmNoQ29uc3RydWN0b3IpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJldHVybnMgYWxsIG1ldGhvZHMgb2YgdGhpcyBjbGFzcyBhbmQgYWxsIG9mIGl0cyBiYXNlIGNsYXNzZXNcclxuICAgICAqIEBwYXJhbSBpc1N0YXRpYyByZXR1cm5zIG9ubHkgc3RhdGljIG1ldGhvZHMgaWYgdHJ1ZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0TWV0aG9kcyh1cFRvVmlzaWJpbGl0eTogVmlzaWJpbGl0eSwgaWRlbnRpZmllcj86IHN0cmluZyk6IE1ldGhvZFtdIHtcclxuXHJcbiAgICAgICAgbGV0IG1ldGhvZHM6IE1ldGhvZFtdID0gdGhpcy5tZXRob2RzLnNsaWNlKCkuZmlsdGVyKChtZXRob2QpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG1ldGhvZC52aXNpYmlsaXR5IDw9IHVwVG9WaXNpYmlsaXR5ICYmIChpZGVudGlmaWVyID09IG51bGwgfHwgaWRlbnRpZmllciA9PSBtZXRob2QuaWRlbnRpZmllcik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJhc2VDbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxldCBiYXNlQ2xhc3NVcHRvVmlzaWJpbGl0eSA9IHVwVG9WaXNpYmlsaXR5ID09IFZpc2liaWxpdHkucHVibGljID8gVmlzaWJpbGl0eS5wdWJsaWMgOiBWaXNpYmlsaXR5LnByb3RlY3RlZDtcclxuICAgICAgICAgICAgZm9yIChsZXQgbSBvZiB0aGlzLmJhc2VDbGFzcy5nZXRNZXRob2RzKGJhc2VDbGFzc1VwdG9WaXNpYmlsaXR5LCBpZGVudGlmaWVyKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbTEgb2YgbWV0aG9kcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtMS5zaWduYXR1cmUgPT0gbS5zaWduYXR1cmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHMucHVzaChtKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBtZXRob2RzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBhbGwgYXR0cmlidXRlcyBvZiB0aGlzIGNsYXNzIGFuZCBhbGwgb2YgaXRzIGJhc2UgY2xhc3Nlc1xyXG4gICAgICogQHBhcmFtIGlzU3RhdGljIHJldHVybiBvbmx5IHN0YXRpYyBhdHRyaWJ1dGVzIGlmIHRydWVcclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldEF0dHJpYnV0ZXModmlzaWJpbGl0eVVwVG86IFZpc2liaWxpdHkpOiBBdHRyaWJ1dGVbXSB7XHJcblxyXG4gICAgICAgIGxldCBhdHRyaWJ1dGVzOiBBdHRyaWJ1dGVbXSA9IHRoaXMuYXR0cmlidXRlcy5maWx0ZXIoKGF0dHJpYnV0ZSkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gYXR0cmlidXRlLnZpc2liaWxpdHkgPD0gdmlzaWJpbGl0eVVwVG87XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJhc2VDbGFzcyAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgdmlzaWJpbGl0eVVwVG9CYXNlQ2xhc3MgPSB2aXNpYmlsaXR5VXBUbyA9PSBWaXNpYmlsaXR5LnB1YmxpYyA/IHZpc2liaWxpdHlVcFRvIDogVmlzaWJpbGl0eS5wcm90ZWN0ZWQ7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBhIG9mIHRoaXMuYmFzZUNsYXNzLmdldEF0dHJpYnV0ZXModmlzaWJpbGl0eVVwVG9CYXNlQ2xhc3MpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYTEgb2YgYXR0cmlidXRlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhMS5pZGVudGlmaWVyID09IGEuaWRlbnRpZmllcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWZvdW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlcy5wdXNoKGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE1ldGhvZChpZGVudGlmaWVyOiBzdHJpbmcsIHBhcmFtZXRlcmxpc3Q6IFBhcmFtZXRlcmxpc3QpOiBNZXRob2Qge1xyXG5cclxuICAgICAgICBsZXQgbWV0aG9kID0gdGhpcy5tZXRob2RNYXAuZ2V0KGlkZW50aWZpZXIgKyBwYXJhbWV0ZXJsaXN0LmlkKTtcclxuXHJcbiAgICAgICAgaWYgKG1ldGhvZCA9PSBudWxsICYmIHRoaXMuYmFzZUNsYXNzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmFzZUNsYXNzLmdldE1ldGhvZChpZGVudGlmaWVyLCBwYXJhbWV0ZXJsaXN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBtZXRob2Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEF0dHJpYnV0ZShpZGVudGlmaWVyOiBzdHJpbmcsIHVwVG9WaXNpYmlsaXR5OiBWaXNpYmlsaXR5KTogeyBhdHRyaWJ1dGU6IEF0dHJpYnV0ZSwgZXJyb3I6IHN0cmluZywgZm91bmRCdXRJbnZpc2libGU6IGJvb2xlYW4sIHN0YXRpY0NsYXNzOiBTdGF0aWNDbGFzcyB9IHtcclxuXHJcbiAgICAgICAgbGV0IGVycm9yID0gXCJcIjtcclxuICAgICAgICBsZXQgbm90Rm91bmQgPSBmYWxzZTtcclxuICAgICAgICBsZXQgYXR0cmlidXRlID0gdGhpcy5hdHRyaWJ1dGVNYXAuZ2V0KGlkZW50aWZpZXIpO1xyXG5cclxuICAgICAgICBpZiAoYXR0cmlidXRlID09IG51bGwpIHtcclxuICAgICAgICAgICAgbm90Rm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICBlcnJvciA9IFwiRGFzIEF0dHJpYnV0IFwiICsgaWRlbnRpZmllciArIFwiIGtvbm50ZSBuaWNodCBnZWZ1bmRlbiB3ZXJkZW4uXCI7XHJcbiAgICAgICAgfSBlbHNlIGlmIChhdHRyaWJ1dGUudmlzaWJpbGl0eSA+IHVwVG9WaXNpYmlsaXR5KSB7XHJcbiAgICAgICAgICAgIGVycm9yID0gXCJEYXMgQXR0cmlidXQgXCIgKyBpZGVudGlmaWVyICsgXCIgaGF0IGRpZSBTaWNodGJhcmtlaXQgXCIgKyBWaXNpYmlsaXR5W2F0dHJpYnV0ZS52aXNpYmlsaXR5XSArIFwiIHVuZCBpc3QgaGllciBkYWhlciBuaWNodCBzaWNodGJhci5cIjtcclxuICAgICAgICAgICAgYXR0cmlidXRlID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhdHRyaWJ1dGUgPT0gbnVsbCAmJiB0aGlzLmJhc2VDbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxldCB1cFRvVmlzaWJpbGl0eUluQmFzZUNsYXNzID0gdXBUb1Zpc2liaWxpdHkgPT0gVmlzaWJpbGl0eS5wdWJsaWMgPyB1cFRvVmlzaWJpbGl0eSA6IFZpc2liaWxpdHkucHJvdGVjdGVkO1xyXG5cclxuICAgICAgICAgICAgbGV0IGJhc2VDbGFzc0F0dHJpYnV0ZVdpdGhFcnJvciA9IHRoaXMuYmFzZUNsYXNzLmdldEF0dHJpYnV0ZShpZGVudGlmaWVyLCB1cFRvVmlzaWJpbGl0eUluQmFzZUNsYXNzKTtcclxuICAgICAgICAgICAgaWYgKG5vdEZvdW5kKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYmFzZUNsYXNzQXR0cmlidXRlV2l0aEVycm9yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geyBhdHRyaWJ1dGU6IGF0dHJpYnV0ZSwgZXJyb3I6IGVycm9yLCBmb3VuZEJ1dEludmlzaWJsZTogIW5vdEZvdW5kLCBzdGF0aWNDbGFzczogdGhpcyB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjYW5DYXN0VG8odHlwZTogVHlwZSk6IGJvb2xlYW4ge1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjYXN0VG8odmFsdWU6IFZhbHVlLCB0eXBlOiBUeXBlKTogVmFsdWUge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBoYXNBbmNlc3Rvck9ySXMoYTogS2xhc3MgfCBTdGF0aWNDbGFzcykge1xyXG4gICAgICAgIGxldCBjOiBLbGFzcyB8IFN0YXRpY0NsYXNzID0gdGhpcztcclxuICAgICAgICB3aGlsZSAoYyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGlmIChjID09IGEpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICBjID0gYy5iYXNlQ2xhc3M7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBJbnRlcmZhY2UgZXh0ZW5kcyBUeXBlIHtcclxuXHJcbiAgICAvLyBmb3IgR2VuZXJpY3M6XHJcbiAgICB0eXBlVmFyaWFibGVzOiBUeXBlVmFyaWFibGVbXSA9IFtdO1xyXG4gICAgaXNHZW5lcmljVmFyaWFudEZyb206IEludGVyZmFjZTtcclxuICAgIHR5cGVWYXJpYWJsZXNSZWFkeTogYm9vbGVhbiA9IHRydWU7XHJcblxyXG4gICAgcHVibGljIG1vZHVsZTogTW9kdWxlO1xyXG5cclxuICAgIHB1YmxpYyBleHRlbmRzOiBJbnRlcmZhY2VbXSA9IFtdO1xyXG5cclxuICAgIHB1YmxpYyBtZXRob2RzOiBNZXRob2RbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBtZXRob2RNYXA6IE1hcDxzdHJpbmcsIE1ldGhvZD4gPSBuZXcgTWFwKCk7XHJcblxyXG4gICAgY29uc3RydWN0b3IoaWRlbnRpZmllcjogc3RyaW5nLCBtb2R1bGU6IE1vZHVsZSwgZG9jdW1lbnRhdGlvbj86IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5kb2N1bWVudGF0aW9uID0gZG9jdW1lbnRhdGlvbjtcclxuICAgICAgICB0aGlzLmlkZW50aWZpZXIgPSBpZGVudGlmaWVyO1xyXG4gICAgICAgIHRoaXMubW9kdWxlID0gbW9kdWxlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE5vbkdlbmVyaWNJZGVudGlmaWVyKCk6IHN0cmluZyB7XHJcbiAgICAgICAgbGV0IGs6IEludGVyZmFjZSA9IHRoaXM7XHJcbiAgICAgICAgd2hpbGUgKGsuaXNHZW5lcmljVmFyaWFudEZyb20gIT0gbnVsbCkgayA9IGsuaXNHZW5lcmljVmFyaWFudEZyb207XHJcbiAgICAgICAgcmV0dXJuIGsuaWRlbnRpZmllcjtcclxuICAgIH1cclxuXHJcbiAgICBnZXRUaGlzT3JFeHRlbmRlZEludGVyZmFjZShpZGVudGlmaWVyOiBTdHJpbmcpOiBJbnRlcmZhY2Uge1xyXG4gICAgICAgIGlmICh0aGlzLmdldE5vbkdlbmVyaWNJZGVudGlmaWVyKCkgPT0gaWRlbnRpZmllcikgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgZm9yIChsZXQgaWYxIG9mIHRoaXMuZXh0ZW5kcykge1xyXG4gICAgICAgICAgICBsZXQgaWYyID0gaWYxLmdldFRoaXNPckV4dGVuZGVkSW50ZXJmYWNlKGlkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICBpZiAoaWYyICE9IG51bGwpIHJldHVybiBpZjI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHN0YXRpYyBjb3VudDogbnVtYmVyID0gMDtcclxuICAgIGNsb25lKCk6IEludGVyZmFjZSB7XHJcbiAgICAgICAgLy8gSW50ZXJmYWNlLmNvdW50Kys7XHJcbiAgICAgICAgbGV0IG5ld0ludGVyZmFjZTogSW50ZXJmYWNlID0gT2JqZWN0LmNyZWF0ZSh0aGlzKTtcclxuXHJcbiAgICAgICAgbmV3SW50ZXJmYWNlLnVzYWdlUG9zaXRpb25zID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIG5ld0ludGVyZmFjZS5pc0dlbmVyaWNWYXJpYW50RnJvbSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXdJbnRlcmZhY2U7XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXJVc2FnZVBvc2l0aW9ucygpIHtcclxuICAgICAgICBzdXBlci5jbGVhclVzYWdlUG9zaXRpb25zKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IG0gb2YgdGhpcy5tZXRob2RzKSB7XHJcbiAgICAgICAgICAgIG0uY2xlYXJVc2FnZVBvc2l0aW9ucygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIGdldENvbXBsZXRpb25JdGVtcyhsZWZ0QnJhY2tldEFscmVhZHlUaGVyZTogYm9vbGVhbiwgaWRlbnRpZmllckFuZEJyYWNrZXRBZnRlckN1cnNvcjogc3RyaW5nLFxyXG4gICAgICAgIHJhbmdlVG9SZXBsYWNlOiBtb25hY28uSVJhbmdlKTogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbVtdIHtcclxuXHJcbiAgICAgICAgbGV0IGl0ZW1MaXN0OiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10gPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbWV0aG9kIG9mIHRoaXMuZ2V0TWV0aG9kcygpKSB7XHJcbiAgICAgICAgICAgIGl0ZW1MaXN0LnB1c2goe1xyXG4gICAgICAgICAgICAgICAgbGFiZWw6IG1ldGhvZC5nZXRDb21wbGV0aW9uTGFiZWwoKSxcclxuICAgICAgICAgICAgICAgIGZpbHRlclRleHQ6IG1ldGhvZC5pZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuTWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogbWV0aG9kLmdldENvbXBsZXRpb25TbmlwcGV0KGxlZnRCcmFja2V0QWxyZWFkeVRoZXJlKSxcclxuICAgICAgICAgICAgICAgIHJhbmdlOiByYW5nZVRvUmVwbGFjZSxcclxuICAgICAgICAgICAgICAgIGNvbW1hbmQ6IHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogXCJlZGl0b3IuYWN0aW9uLnRyaWdnZXJQYXJhbWV0ZXJIaW50c1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnMTIzJyxcclxuICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHM6IFtdXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnRhdGlvbjogbWV0aG9kLmRvY3VtZW50YXRpb24gPT0gbnVsbCA/IHVuZGVmaW5lZCA6IHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbWV0aG9kLmRvY3VtZW50YXRpb25cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaXRlbUxpc3Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlYnVnT3V0cHV0KHZhbHVlOiBWYWx1ZSwgbWF4TGVuZ3RoOiBudW1iZXIgPSA0MCk6IHN0cmluZyB7XHJcbiAgICAgICAgaWYgKHZhbHVlLnZhbHVlID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwibnVsbFwiO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS52YWx1ZSBpbnN0YW5jZW9mIFJ1bnRpbWVPYmplY3QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS52YWx1ZS5jbGFzcy5kZWJ1Z091dHB1dCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJ7Li4ufVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlcXVhbHModHlwZTogVHlwZSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0eXBlID09IHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZE1ldGhvZChtZXRob2Q6IE1ldGhvZCkge1xyXG4gICAgICAgIG1ldGhvZC5pc0Fic3RyYWN0ID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLm1ldGhvZHMucHVzaChtZXRob2QpO1xyXG4gICAgICAgIHRoaXMubWV0aG9kTWFwLnNldChtZXRob2Quc2lnbmF0dXJlLCBtZXRob2QpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRSZXN1bHRUeXBlKG9wZXJhdGlvbjogVG9rZW5UeXBlLCBzZWNvbmRPcGVyYW5kVHlwZT86IFR5cGUpOiBUeXBlIHtcclxuXHJcbiAgICAgICAgaWYgKG9wZXJhdGlvbiA9PSBUb2tlblR5cGUuZXF1YWwgfHwgb3BlcmF0aW9uID09IFRva2VuVHlwZS5ub3RFcXVhbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYm9vbGVhblByaW1pdGl2ZVR5cGVDb3B5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG9wZXJhdGlvbiA9PSBUb2tlblR5cGUua2V5d29yZEluc3RhbmNlb2YpIHtcclxuICAgICAgICAgICAgaWYgKHNlY29uZE9wZXJhbmRUeXBlIGluc3RhbmNlb2YgU3RhdGljQ2xhc3MgfHwgc2Vjb25kT3BlcmFuZFR5cGUgaW5zdGFuY2VvZiBJbnRlcmZhY2UpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBib29sZWFuUHJpbWl0aXZlVHlwZUNvcHk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29tcHV0ZShvcGVyYXRpb246IFRva2VuVHlwZSwgZmlyc3RPcGVyYW5kOiBWYWx1ZSwgc2Vjb25kT3BlcmFuZD86IFZhbHVlKSB7XHJcblxyXG4gICAgICAgIGlmIChvcGVyYXRpb24gPT0gVG9rZW5UeXBlLmVxdWFsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmaXJzdE9wZXJhbmQudmFsdWUgPT0gc2Vjb25kT3BlcmFuZC52YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChvcGVyYXRpb24gPT0gVG9rZW5UeXBlLm5vdEVxdWFsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmaXJzdE9wZXJhbmQudmFsdWUgIT0gc2Vjb25kT3BlcmFuZC52YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBtZXRob2RzV2l0aFN1YkludGVyZmFjZXM6IE1ldGhvZFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBhbGwgbWV0aG9kcyBvZiB0aGlzIGludGVyZmFjZVxyXG4gICAgICogQHBhcmFtIGlzU3RhdGljIGlzIG5vdCB1c2VkIGluIGludGVyZmFjZXNcclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldE1ldGhvZHMoKTogTWV0aG9kW10ge1xyXG5cclxuICAgICAgICBpZiAodGhpcy5leHRlbmRzLmxlbmd0aCA9PSAwKSByZXR1cm4gdGhpcy5tZXRob2RzO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5tZXRob2RzV2l0aFN1YkludGVyZmFjZXMgIT0gbnVsbCkgcmV0dXJuIHRoaXMubWV0aG9kc1dpdGhTdWJJbnRlcmZhY2VzO1xyXG5cclxuICAgICAgICBsZXQgdmlzaXRlZEludGVyZmFjZXM6IHsgW2tleTogc3RyaW5nXTogYm9vbGVhbiB9ID0ge307XHJcbiAgICAgICAgbGV0IHZpc2l0ZWRNZXRob2RzOiB7IFtzaWduYXR1cmU6IHN0cmluZ106IGJvb2xlYW4gfSA9IHt9O1xyXG5cclxuICAgICAgICB0aGlzLm1ldGhvZHNXaXRoU3ViSW50ZXJmYWNlcyA9IHRoaXMubWV0aG9kcy5zbGljZSgwKTtcclxuICAgICAgICBmb3IgKGxldCBtIG9mIHRoaXMubWV0aG9kcykgdmlzaXRlZE1ldGhvZHNbbS5zaWduYXR1cmVdID0gdHJ1ZTtcclxuICAgICAgICB2aXNpdGVkSW50ZXJmYWNlc1t0aGlzLmlkZW50aWZpZXJdID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgbGV0IHRvZG86IEludGVyZmFjZVtdID0gdGhpcy5leHRlbmRzLnNsaWNlKDApO1xyXG5cclxuICAgICAgICB3aGlsZSAodG9kby5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGxldCBpbnRlcmYgPSB0b2RvLnBvcCgpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBtIG9mIGludGVyZi5tZXRob2RzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXZpc2l0ZWRNZXRob2RzW20uc2lnbmF0dXJlXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWV0aG9kc1dpdGhTdWJJbnRlcmZhY2VzLnB1c2gobSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmlzaXRlZE1ldGhvZHNbbS5zaWduYXR1cmVdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKGxldCBpIG9mIGludGVyZi5leHRlbmRzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXZpc2l0ZWRJbnRlcmZhY2VzW2kuaWRlbnRpZmllcl0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0b2RvLnB1c2goaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmlzaXRlZEludGVyZmFjZXNbaS5pZGVudGlmaWVyXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLm1ldGhvZHNXaXRoU3ViSW50ZXJmYWNlcztcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE1ldGhvZChpZGVudGlmaWVyOiBzdHJpbmcsIHBhcmFtZXRlcmxpc3Q6IFBhcmFtZXRlcmxpc3QpOiBNZXRob2Qge1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5tZXRob2RNYXAuZ2V0KGlkZW50aWZpZXIgKyBwYXJhbWV0ZXJsaXN0LmlkKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhbkNhc3RUbyh0eXBlOiBUeXBlKTogYm9vbGVhbiB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlIGluc3RhbmNlb2YgSW50ZXJmYWNlKSB7XHJcbiAgICAgICAgICAgIGxldCBub25HZW5lcmljQ2FzdGFibGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgaWYgKHR5cGUuZ2V0Tm9uR2VuZXJpY0lkZW50aWZpZXIoKSA9PSB0aGlzLmdldE5vbkdlbmVyaWNJZGVudGlmaWVyKCkpIHtcclxuICAgICAgICAgICAgICAgIG5vbkdlbmVyaWNDYXN0YWJsZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50eXBlVmFyaWFibGVzLmxlbmd0aCA9PSAwKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB0eXBlMiA9IDxJbnRlcmZhY2U+dHlwZTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnR5cGVWYXJpYWJsZXMubGVuZ3RoICE9IHR5cGUyLnR5cGVWYXJpYWJsZXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudHlwZVZhcmlhYmxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB0diA9IHRoaXMudHlwZVZhcmlhYmxlc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdHZPdGhlciA9IHR5cGUyLnR5cGVWYXJpYWJsZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0dk90aGVyLnR5cGUuY2FuQ2FzdFRvKHR2LnR5cGUpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB0eXBlMSBvZiB0aGlzLmV4dGVuZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZTEuY2FuQ2FzdFRvKHR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgaW5zdGFuY2VvZiBLbGFzcyAmJiB0eXBlLmdldE5vbkdlbmVyaWNJZGVudGlmaWVyKCkgPT0gXCJPYmplY3RcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gcmV0dXJuICh0eXBlIGluc3RhbmNlb2YgS2xhc3MpIHx8ICh0eXBlIGluc3RhbmNlb2YgSW50ZXJmYWNlKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FzdFRvKHZhbHVlOiBWYWx1ZSwgdHlwZTogVHlwZSk6IFZhbHVlIHtcclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE1ldGhvZHNUaGF0Rml0V2l0aENhc3RpbmcoaWRlbnRpZmllcjogc3RyaW5nLCBwYXJhbWV0ZXJUeXBlczogVHlwZVtdLCBzZWFyY2hDb25zdHJ1Y3RvcjogYm9vbGVhbik6IHsgZXJyb3I6IHN0cmluZywgbWV0aG9kTGlzdDogTWV0aG9kW10gfSB7XHJcblxyXG4gICAgICAgIHJldHVybiBmaW5kU3VpdGFibGVNZXRob2RzKHRoaXMuZ2V0TWV0aG9kcygpLCBpZGVudGlmaWVyLCBwYXJhbWV0ZXJUeXBlcywgdGhpcy5pZGVudGlmaWVyLCBzZWFyY2hDb25zdHJ1Y3Rvcik7XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRTdWl0YWJsZU1ldGhvZHMobWV0aG9kTGlzdDogTWV0aG9kW10sIGlkZW50aWZpZXI6IHN0cmluZywgcGFyYW1ldGVyVHlwZXM6IFR5cGVbXSxcclxuICAgIGNsYXNzSWRlbnRpZmllcjogc3RyaW5nLFxyXG4gICAgc2VhcmNoQ29uc3RydWN0b3I6IGJvb2xlYW4pOiB7IGVycm9yOiBzdHJpbmcsIG1ldGhvZExpc3Q6IE1ldGhvZFtdIH0ge1xyXG5cclxuICAgIGxldCBzdWl0YWJsZU1ldGhvZHM6IE1ldGhvZFtdID0gW107XHJcbiAgICBsZXQgaG93TWFueUNhc3RpbmdzTWF4OiBudW1iZXIgPSAxMDAwMDtcclxuICAgIGxldCBlcnJvciA9IG51bGw7XHJcblxyXG4gICAgbGV0IG9uZVdpdGhDb3JyZWN0SWRlbnRpZmllckZvdW5kID0gZmFsc2U7XHJcblxyXG4gICAgZm9yIChsZXQgbSBvZiBtZXRob2RMaXN0KSB7XHJcblxyXG4gICAgICAgIGxldCBob3dNYW55Q2FzdGluZ3MgPSAwO1xyXG4gICAgICAgIGlmIChtLmlkZW50aWZpZXIgPT0gaWRlbnRpZmllciB8fCBtLmlzQ29uc3RydWN0b3IgJiYgc2VhcmNoQ29uc3RydWN0b3IpIHtcclxuXHJcbiAgICAgICAgICAgIG9uZVdpdGhDb3JyZWN0SWRlbnRpZmllckZvdW5kID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIGxldCBpc0VsbGlwc2lzID0gbS5oYXNFbGxpcHNpcygpO1xyXG4gICAgICAgICAgICBpZiAobS5nZXRQYXJhbWV0ZXJDb3VudCgpID09IHBhcmFtZXRlclR5cGVzLmxlbmd0aCB8fCAoaXNFbGxpcHNpcyAmJiBtLmdldFBhcmFtZXRlckNvdW50KCkgPD0gcGFyYW1ldGVyVHlwZXMubGVuZ3RoKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBzdWl0cyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGkgPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBtLmdldFBhcmFtZXRlckNvdW50KCkgLSAoaXNFbGxpcHNpcyA/IDEgOiAwKTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1QYXJhbWV0ZXJUeXBlID0gbS5nZXRQYXJhbWV0ZXJUeXBlKGkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBnaXZlblR5cGUgPSBwYXJhbWV0ZXJUeXBlc1tpXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdpdmVuVHlwZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1aXRzID0gZmFsc2U7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1QYXJhbWV0ZXJUeXBlID09IGdpdmVuVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChnaXZlblR5cGUuY2FuQ2FzdFRvKG1QYXJhbWV0ZXJUeXBlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBob3dNYW55Q2FzdGluZ3MrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIFJlY2h0ZWNrIHI7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBHTkdGaWd1ciBmO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBCZWkgZi5iZXLDvGhydChyKSBnaWJ0IGVzIGVpbmUgVmFyaWFudGUgbWl0IFBhcmFtZXRlcnR5cCBTdHJpbmcgKHNjaGxlY2h0ISkgdW5kXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIGVpbmUgbWl0IFBhcmFtZXRlcnR5cCBPYmplY3QuIExldHp0ZXJlIHNvbGwgZ2Vub21tZW4gd2VyZGVuLCBhbHNvOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYobVBhcmFtZXRlclR5cGUgPT0gc3RyaW5nUHJpbWl0aXZlVHlwZSkgaG93TWFueUNhc3RpbmdzICs9IDAuNTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBzdWl0cyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEVsbGlwc2lzIVxyXG4gICAgICAgICAgICAgICAgaWYgKHN1aXRzICYmIGlzRWxsaXBzaXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbVBhcmFtZXRlckVsbGlwc2lzID0gbS5nZXRQYXJhbWV0ZXIoaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1QYXJhbWV0ZXJUeXBlRWxsaXNwc2lzID0gKDxBcnJheVR5cGU+bVBhcmFtZXRlckVsbGlwc2lzLnR5cGUpLmFycmF5T2ZUeXBlO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IGk7IGogPCBwYXJhbWV0ZXJUeXBlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZ2l2ZW5UeXBlID0gcGFyYW1ldGVyVHlwZXNbaV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2l2ZW5UeXBlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1aXRzID0gZmFsc2U7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobVBhcmFtZXRlclR5cGVFbGxpc3BzaXMgPT0gZ2l2ZW5UeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdpdmVuVHlwZS5jYW5DYXN0VG8obVBhcmFtZXRlclR5cGVFbGxpc3BzaXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3dNYW55Q2FzdGluZ3MrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIFJlY2h0ZWNrIHI7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBHTkdGaWd1ciBmO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKiBCZWkgZi5iZXLDvGhydChyKSBnaWJ0IGVzIGVpbmUgVmFyaWFudGUgbWl0IFBhcmFtZXRlcnR5cCBTdHJpbmcgKHNjaGxlY2h0ISkgdW5kXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAqIGVpbmUgbWl0IFBhcmFtZXRlcnR5cCBPYmplY3QuIExldHp0ZXJlIHNvbGwgZ2Vub21tZW4gd2VyZGVuLCBhbHNvOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgIGlmKG1QYXJhbWV0ZXJUeXBlRWxsaXNwc2lzID09IHN0cmluZ1ByaW1pdGl2ZVR5cGUpIGhvd01hbnlDYXN0aW5ncyArPSAwLjU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VpdHMgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc3VpdHMgJiYgaG93TWFueUNhc3RpbmdzIDw9IGhvd01hbnlDYXN0aW5nc01heCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChob3dNYW55Q2FzdGluZ3MgPCBob3dNYW55Q2FzdGluZ3NNYXgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VpdGFibGVNZXRob2RzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHN1aXRhYmxlTWV0aG9kcy5wdXNoKG0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGhvd01hbnlDYXN0aW5nc01heCA9IGhvd01hbnlDYXN0aW5ncztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGlmIChzdWl0YWJsZU1ldGhvZHMubGVuZ3RoID09IDApIHtcclxuXHJcbiAgICAgICAgaWYgKG9uZVdpdGhDb3JyZWN0SWRlbnRpZmllckZvdW5kKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJhbWV0ZXJUeXBlcy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgZXJyb3IgPSBzZWFyY2hDb25zdHJ1Y3RvciA/IFwiRXMgZ2lidCBrZWluZW4gcGFyYW1ldGVybG9zZW4gS29uc3RydWt0b3IgZGVyIEtsYXNzZSBcIiArIGNsYXNzSWRlbnRpZmllciA6IFwiRGllIHZvcmhhbmRlbmVuIE1ldGhvZGVuIG1pdCBkZW0gQmV6ZWljaG5lciBcIiArIGlkZW50aWZpZXIgKyBcIiBoYWJlbiBhbGxlIG1pbmRlc3RlbnMgZWluZW4gUGFyYW1ldGVyLiBIaWVyIHdpcmQgYWJlciBrZWluIFBhcmFtZXRlcndlcnQgw7xiZXJnZWJlbi5cIjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxldCB0eXBlU3RyaW5nID0gcGFyYW1ldGVyVHlwZXMubWFwKHR5cGUgPT4gdHlwZT8uaWRlbnRpZmllcikuam9pbihcIiwgXCIpO1xyXG4gICAgICAgICAgICAgICAgZXJyb3IgPSBzZWFyY2hDb25zdHJ1Y3RvciA/IGBEaWUgUGFyYW1ldGVydHlwZW4gKCR7dHlwZVN0cmluZ30pIHBhc3NlbiB6dSBrZWluZW0gS29uc3RydWt0b3IgZGVyIEtsYXNzZSAke2NsYXNzSWRlbnRpZmllcn1gIDogYERpZSBQYXJhbWV0ZXJ0eXBlbiAoJHt0eXBlU3RyaW5nfSkgcGFzc2VuIHp1IGtlaW5lciBkZXIgdm9yaGFuZGVuZW4gTWV0aG9kZW4gbWl0IGRlbSBCZXplaWNobmVyICR7aWRlbnRpZmllcn0uYDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGVycm9yID0gXCJEZXIgVHlwIFwiICsgY2xhc3NJZGVudGlmaWVyICsgXCIgYmVzaXR6dCBrZWluZSBNZXRob2RlIG1pdCBkZW0gQmV6ZWljaG5lciBcIiArIGlkZW50aWZpZXIgKyBcIi5cIjtcclxuICAgICAgICAgICAgaWYgKGlkZW50aWZpZXIgPT0gJ3NldENlbnRlcicpIHtcclxuICAgICAgICAgICAgICAgIGVycm9yICs9ICcgVGlwcDogRGllIE1ldGhvZGUgc2V0Q2VudGVyIGRlciBLbGFzc2UgU2hhcGUgd3VyZGUgdW1iZW5hbm50IGluIFwibW92ZVRvXCIuJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBpZiAoc3VpdGFibGVNZXRob2RzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICBzdWl0YWJsZU1ldGhvZHMgPSBzdWl0YWJsZU1ldGhvZHMuc2xpY2UoMCwgMSk7XHJcbiAgICAgICAgLy8gZXJyb3IgPSBcIlp1IGRlbiBnZWdlYmVuZW4gUGFyYW1ldGVybiBoYXQgZGVyIFR5cCBcIiArIGNsYXNzSWRlbnRpZmllciArIFwiIG1laHJlcmUgcGFzc2VuZGUgTWV0aG9kZW4uXCI7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICAgICAgbWV0aG9kTGlzdDogc3VpdGFibGVNZXRob2RzXHJcbiAgICB9O1xyXG5cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFZpc2liaWxpdHlVcFRvKG9iamVjdFR5cGU6IEtsYXNzIHwgU3RhdGljQ2xhc3MsIGN1cnJlbnRDbGFzc0NvbnRleHQ6IEtsYXNzIHwgU3RhdGljQ2xhc3MpOiBWaXNpYmlsaXR5IHtcclxuXHJcbiAgICBpZiAoY3VycmVudENsYXNzQ29udGV4dCA9PSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuIFZpc2liaWxpdHkucHVibGljO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvYmplY3RUeXBlIGluc3RhbmNlb2YgU3RhdGljQ2xhc3MpIG9iamVjdFR5cGUgPSBvYmplY3RUeXBlLktsYXNzO1xyXG4gICAgaWYgKGN1cnJlbnRDbGFzc0NvbnRleHQgaW5zdGFuY2VvZiBTdGF0aWNDbGFzcykgY3VycmVudENsYXNzQ29udGV4dCA9IGN1cnJlbnRDbGFzc0NvbnRleHQuS2xhc3M7XHJcblxyXG4gICAgaWYgKG9iamVjdFR5cGUgPT0gY3VycmVudENsYXNzQ29udGV4dCkge1xyXG4gICAgICAgIHJldHVybiBWaXNpYmlsaXR5LnByaXZhdGU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGN1cnJlbnRDbGFzc0NvbnRleHQuaGFzQW5jZXN0b3JPcklzKG9iamVjdFR5cGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIFZpc2liaWxpdHkucHJvdGVjdGVkO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBWaXNpYmlsaXR5LnB1YmxpYztcclxuXHJcbn1cclxuXHJcbiJdfQ==