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
                    if (type.getNonGenericIdentifier() == i.getNonGenericIdentifier()) {
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
            if (this.baseClass != null && !this.isAbstract) {
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
            if (missingAbstractMethods.length > 0) {
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
Klass.dontInheritFrom = ["Integer", "Float", "Double", "Boolean", "Character", "String"];
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
        let s = "{";
        let attributes = this.getAttributes(Visibility.private);
        let object = this.classObject;
        for (let i = 0; i < attributes.length; i++) {
            let attribute = attributes[i];
            s += attribute.identifier + ": " + object == null ? '---' : attribute.type.debugOutput(object.getValue(attribute.index), maxLength / 2);
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
                kind: monaco.languages.CompletionItemKind.Field,
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
        return this.methods;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xhc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY2xpZW50L2NvbXBpbGVyL3R5cGVzL0NsYXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUNuRSxPQUFPLEVBQWdCLFNBQVMsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQzVELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUl6RCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ3ZDLE9BQU8sRUFBRSxRQUFRLEVBQUUsbUJBQW1CLEVBQXFCLE1BQU0scUJBQXFCLENBQUM7QUFDdkYsT0FBTyxFQUFvQyxhQUFhLEVBQUUsSUFBSSxFQUFTLE1BQU0sWUFBWSxDQUFDO0FBRzFGLE1BQU0sQ0FBTixJQUFZLFVBQXlDO0FBQXJELFdBQVksVUFBVTtJQUFHLCtDQUFNLENBQUE7SUFBRSxxREFBUyxDQUFBO0lBQUUsaURBQU8sQ0FBQTtBQUFDLENBQUMsRUFBekMsVUFBVSxLQUFWLFVBQVUsUUFBK0I7QUFBQSxDQUFDO0FBRXRELElBQUksd0JBQTZCLENBQUM7QUFDbEMsTUFBTSxVQUFVLDJCQUEyQixDQUFDLEdBQVM7SUFDakQsd0JBQXdCLEdBQUcsR0FBRyxDQUFDO0FBQ25DLENBQUM7QUFnQkQsTUFBTSxPQUFPLEtBQU0sU0FBUSxJQUFJO0lBcUMzQixZQUFZLFVBQWtCLEVBQUUsTUFBYyxFQUFFLGFBQXNCO1FBQ2xFLEtBQUssRUFBRSxDQUFDO1FBcENaLGdCQUFnQjtRQUNoQixrQkFBYSxHQUFtQixFQUFFLENBQUM7UUFFbkMsbUJBQWMsR0FBWSxLQUFLLENBQUM7UUFDaEMsdUJBQWtCLEdBQVksSUFBSSxDQUFDO1FBYW5DLGVBQVUsR0FBZ0IsRUFBRSxDQUFDO1FBQzdCLHdCQUFtQixHQUFhLEVBQUUsQ0FBQztRQUVuQyxlQUFVLEdB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S0FDN0I7SUFFRCxJQUFJLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUNqRCxPQUFPLFVBQVUsQ0FBQyxTQUFTLENBQUM7S0FDL0I7SUFFRCxPQUFPLFVBQVUsQ0FBQyxNQUFNLENBQUM7QUFFN0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByb2dyYW1TdGFja0VsZW1lbnQgfSBmcm9tIFwiLi4vLi4vaW50ZXJwcmV0ZXIvSW50ZXJwcmV0ZXIuanNcIjtcclxuaW1wb3J0IHsgUnVudGltZU9iamVjdCB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9SdW50aW1lT2JqZWN0LmpzXCI7XHJcbmltcG9ydCB7IFRleHRQb3NpdGlvbiwgVG9rZW5UeXBlIH0gZnJvbSBcIi4uL2xleGVyL1Rva2VuLmpzXCI7XHJcbmltcG9ydCB7IExhYmVsTWFuYWdlciB9IGZyb20gXCIuLi9wYXJzZXIvTGFiZWxNYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IE1vZHVsZSB9IGZyb20gXCIuLi9wYXJzZXIvTW9kdWxlLmpzXCI7XHJcbmltcG9ydCB7IFByb2dyYW0gfSBmcm9tIFwiLi4vcGFyc2VyL1Byb2dyYW0uanNcIjtcclxuaW1wb3J0IHsgU3ltYm9sVGFibGUgfSBmcm9tIFwiLi4vcGFyc2VyL1N5bWJvbFRhYmxlLmpzXCI7XHJcbmltcG9ydCB7IEFycmF5VHlwZSB9IGZyb20gXCIuL0FycmF5LmpzXCI7XHJcbmltcG9ydCB7IG51bGxUeXBlLCBzdHJpbmdQcmltaXRpdmVUeXBlLCB2b2lkUHJpbWl0aXZlVHlwZSB9IGZyb20gXCIuL1ByaW1pdGl2ZVR5cGVzLmpzXCI7XHJcbmltcG9ydCB7IEF0dHJpYnV0ZSwgTWV0aG9kLCBQYXJhbWV0ZXJsaXN0LCBQcmltaXRpdmVUeXBlLCBUeXBlLCBWYWx1ZSB9IGZyb20gXCIuL1R5cGVzLmpzXCI7XHJcblxyXG5cclxuZXhwb3J0IGVudW0gVmlzaWJpbGl0eSB7IHB1YmxpYywgcHJvdGVjdGVkLCBwcml2YXRlIH07XHJcblxyXG52YXIgYm9vbGVhblByaW1pdGl2ZVR5cGVDb3B5OiBhbnk7XHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRCb29sZWFuUHJpbWl0aXZlVHlwZUNvcHkoYnB0OiBUeXBlKSB7XHJcbiAgICBib29sZWFuUHJpbWl0aXZlVHlwZUNvcHkgPSBicHQ7XHJcbn1cclxuXHJcbi8vIFVzZWQgZm9yIGNsYXNzIGRpYWdyYW1zOlxyXG5leHBvcnQgdHlwZSBDb21wb3N0aW9uRGF0YSA9IHsga2xhc3M6IEtsYXNzIHwgSW50ZXJmYWNlLCBtdWx0aXBsZXM6IGJvb2xlYW4sIGlkZW50aWZpZXI6IHN0cmluZyB9O1xyXG5cclxuLyoqXHJcbiAqIEZvciBHZW5lcmljIHR5cGVzXHJcbiAqL1xyXG5leHBvcnQgdHlwZSBUeXBlVmFyaWFibGUgPSB7XHJcbiAgICBpZGVudGlmaWVyOiBzdHJpbmc7XHJcbiAgICB0eXBlOiBLbGFzcztcclxuICAgIHNjb3BlRnJvbTogVGV4dFBvc2l0aW9uO1xyXG4gICAgc2NvcGVUbzogVGV4dFBvc2l0aW9uO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEtsYXNzIGV4dGVuZHMgVHlwZSB7XHJcblxyXG4gICAgLy8gZm9yIEdlbmVyaWNzOlxyXG4gICAgdHlwZVZhcmlhYmxlczogVHlwZVZhcmlhYmxlW10gPSBbXTtcclxuICAgIGlzR2VuZXJpY1ZhcmlhbnRGcm9tOiBLbGFzcztcclxuICAgIGlzVHlwZVZhcmlhYmxlOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICB0eXBlVmFyaWFibGVzUmVhZHk6IGJvb2xlYW4gPSB0cnVlO1xyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIGRvbnRJbmhlcml0RnJvbTogc3RyaW5nW10gPSBbXCJJbnRlZ2VyXCIsIFwiRmxvYXRcIiwgXCJEb3VibGVcIiwgXCJCb29sZWFuXCIsIFwiQ2hhcmFjdGVyXCIsIFwiU3RyaW5nXCJdO1xyXG5cclxuICAgIGJhc2VDbGFzczogS2xhc3M7XHJcbiAgICBmaXJzdFBhc3NCYXNlQ2xhc3M6IHN0cmluZztcclxuXHJcbiAgICBzdGF0aWNDbGFzczogU3RhdGljQ2xhc3M7XHJcblxyXG4gICAgbW9kdWxlOiBNb2R1bGU7XHJcblxyXG4gICAgdmlzaWJpbGl0eTogVmlzaWJpbGl0eTtcclxuXHJcbiAgICBpbXBsZW1lbnRzOiBJbnRlcmZhY2VbXSA9IFtdO1xyXG4gICAgZmlyc3RQYXNzSW1wbGVtZW50czogc3RyaW5nW10gPSBbXTtcclxuXHJcbiAgICBpc0Fic3RyYWN0OiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgYXR0cmlidXRlSW5pdGlhbGl6YXRpb25Qcm9ncmFtOiBQcm9ncmFtO1xyXG5cclxuICAgIHBvc3RDb25zdHJ1Y3RvckNhbGxiYWNrczogKChyOiBSdW50aW1lT2JqZWN0KSA9PiB2b2lkKVtdID0gbnVsbDtcclxuXHJcbiAgICBwdWJsaWMgbWV0aG9kczogTWV0aG9kW10gPSBbXTtcclxuICAgIHByaXZhdGUgbWV0aG9kTWFwOiBNYXA8c3RyaW5nLCBNZXRob2Q+ID0gbmV3IE1hcCgpO1xyXG5cclxuICAgIHB1YmxpYyBhdHRyaWJ1dGVzOiBBdHRyaWJ1dGVbXSA9IFtdO1xyXG4gICAgcHVibGljIGF0dHJpYnV0ZU1hcDogTWFwPHN0cmluZywgQXR0cmlidXRlPiA9IG5ldyBNYXAoKTtcclxuICAgIHB1YmxpYyBudW1iZXJPZkF0dHJpYnV0ZXNJbmNsdWRpbmdCYXNlQ2xhc3M6IG51bWJlciA9IG51bGw7XHJcblxyXG4gICAgcHVibGljIHN5bWJvbFRhYmxlOiBTeW1ib2xUYWJsZTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihpZGVudGlmaWVyOiBzdHJpbmcsIG1vZHVsZTogTW9kdWxlLCBkb2N1bWVudGF0aW9uPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kb2N1bWVudGF0aW9uID0gZG9jdW1lbnRhdGlvbjtcclxuXHJcbiAgICAgICAgdGhpcy5pZGVudGlmaWVyID0gaWRlbnRpZmllcjtcclxuICAgICAgICB0aGlzLm1vZHVsZSA9IG1vZHVsZTtcclxuICAgICAgICB0aGlzLnZpc2liaWxpdHkgPSBWaXNpYmlsaXR5LnB1YmxpYztcclxuXHJcbiAgICAgICAgdGhpcy5zdGF0aWNDbGFzcyA9IG5ldyBTdGF0aWNDbGFzcyh0aGlzKTtcclxuXHJcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW0gPSB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogbnVsbCxcclxuICAgICAgICAgICAgbW9kdWxlOiB0aGlzLm1vZHVsZSxcclxuICAgICAgICAgICAgc3RhdGVtZW50czogW10sXHJcbiAgICAgICAgICAgIGxhYmVsTWFuYWdlcjogbnVsbFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlSW5pdGlhbGl6YXRpb25Qcm9ncmFtLmxhYmVsTWFuYWdlciA9IG5ldyBMYWJlbE1hbmFnZXIodGhpcy5hdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZXR1cEF0dHJpYnV0ZUluZGljZXNSZWN1cnNpdmUoKSB7XHJcbiAgICAgICAgaWYodGhpcy5iYXNlQ2xhc3MgIT0gbnVsbCAmJiB0aGlzLmJhc2VDbGFzcy5udW1iZXJPZkF0dHJpYnV0ZXNJbmNsdWRpbmdCYXNlQ2xhc3MgPT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHRoaXMuYmFzZUNsYXNzLnNldHVwQXR0cmlidXRlSW5kaWNlc1JlY3Vyc2l2ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgbnVtYmVyT2ZBdHRyaWJ1dGVzSW5CYXNlQ2xhc3NlcyA9IHRoaXMuYmFzZUNsYXNzID09IG51bGwgPyAwIDogdGhpcy5iYXNlQ2xhc3MubnVtYmVyT2ZBdHRyaWJ1dGVzSW5jbHVkaW5nQmFzZUNsYXNzO1xyXG5cclxuICAgICAgICBmb3IobGV0IGEgb2YgdGhpcy5hdHRyaWJ1dGVzKXtcclxuICAgICAgICAgICAgYS5pbmRleCA9IG51bWJlck9mQXR0cmlidXRlc0luQmFzZUNsYXNzZXMrKztcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5pZGVudGlmaWVyICsgXCIuXCIgKyBhLmlkZW50aWZpZXIrIFwiOiBcIiArIGEuaW5kZXgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5udW1iZXJPZkF0dHJpYnV0ZXNJbmNsdWRpbmdCYXNlQ2xhc3MgPSBudW1iZXJPZkF0dHJpYnV0ZXNJbkJhc2VDbGFzc2VzO1xyXG5cclxuICAgIH1cclxuXHJcblxyXG4gICAgZ2V0Tm9uR2VuZXJpY0NsYXNzKCk6IEtsYXNzIHtcclxuICAgICAgICBsZXQgazogS2xhc3MgPSB0aGlzO1xyXG4gICAgICAgIHdoaWxlIChrLmlzR2VuZXJpY1ZhcmlhbnRGcm9tICE9IG51bGwpIGsgPSBrLmlzR2VuZXJpY1ZhcmlhbnRGcm9tO1xyXG4gICAgICAgIHJldHVybiBrO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE5vbkdlbmVyaWNJZGVudGlmaWVyKCk6IHN0cmluZyB7XHJcbiAgICAgICAgbGV0IGs6IEtsYXNzID0gdGhpcztcclxuICAgICAgICB3aGlsZSAoay5pc0dlbmVyaWNWYXJpYW50RnJvbSAhPSBudWxsKSBrID0gay5pc0dlbmVyaWNWYXJpYW50RnJvbTtcclxuICAgICAgICByZXR1cm4gay5pZGVudGlmaWVyO1xyXG4gICAgfVxyXG5cclxuICAgIGltcGxlbWVudHNJbnRlcmZhY2UoaTogSW50ZXJmYWNlKTogYm9vbGVhbiB7XHJcbiAgICAgICAgbGV0IGtsYXNzOiBLbGFzcyA9IHRoaXM7XHJcbiAgICAgICAgd2hpbGUgKGtsYXNzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaTEgb2Yga2xhc3MuaW1wbGVtZW50cykge1xyXG4gICAgICAgICAgICAgICAgaWYoaTEuZ2V0VGhpc09yRXh0ZW5kZWRJbnRlcmZhY2UoaS5nZXROb25HZW5lcmljSWRlbnRpZmllcigpKSAhPSBudWxsKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBrbGFzcyA9IGtsYXNzLmJhc2VDbGFzcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0SW1wbGVtZW50ZWRJbnRlcmZhY2UoaWRlbnRpZmllcjogc3RyaW5nKTogSW50ZXJmYWNlIHtcclxuICAgICAgICBsZXQga2xhc3M6IEtsYXNzID0gdGhpcztcclxuICAgICAgICB3aGlsZSAoa2xhc3MgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpMSBvZiBrbGFzcy5pbXBsZW1lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgaTI6IEludGVyZmFjZSA9IGkxLmdldFRoaXNPckV4dGVuZGVkSW50ZXJmYWNlKGlkZW50aWZpZXIpO1xyXG4gICAgICAgICAgICAgICAgaWYoaTIgIT0gbnVsbCkgcmV0dXJuIGkyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGtsYXNzID0ga2xhc3MuYmFzZUNsYXNzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICByZWdpc3RlclVzZWRTeXN0ZW1DbGFzc2VzKHVzZWRTeXN0ZW1DbGFzc2VzOiAoS2xhc3MgfCBJbnRlcmZhY2UpW10pIHtcclxuICAgICAgICBpZiAodGhpcy5iYXNlQ2xhc3MgIT0gbnVsbCAmJiB0aGlzLmJhc2VDbGFzcy5tb2R1bGUgIT0gbnVsbCAmJiB0aGlzLmJhc2VDbGFzcy5tb2R1bGUuaXNTeXN0ZW1Nb2R1bGUgJiZcclxuICAgICAgICAgICAgdXNlZFN5c3RlbUNsYXNzZXMuaW5kZXhPZih0aGlzLmJhc2VDbGFzcykgPCAwKSB7XHJcbiAgICAgICAgICAgIHVzZWRTeXN0ZW1DbGFzc2VzLnB1c2godGhpcy5iYXNlQ2xhc3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCBjZCBvZiB0aGlzLmdldENvbXBvc2l0ZURhdGEoKSkge1xyXG4gICAgICAgICAgICBpZiAoY2Qua2xhc3MgIT0gbnVsbCAmJiBjZC5rbGFzcy5tb2R1bGUgIT0gbnVsbCAmJiBjZC5rbGFzcy5tb2R1bGUuaXNTeXN0ZW1Nb2R1bGUgJiZcclxuICAgICAgICAgICAgICAgIHVzZWRTeXN0ZW1DbGFzc2VzLmluZGV4T2YoY2Qua2xhc3MpIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdXNlZFN5c3RlbUNsYXNzZXMucHVzaChjZC5rbGFzcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQgaW50ZXJmIG9mIHRoaXMuaW1wbGVtZW50cykge1xyXG4gICAgICAgICAgICBpZiAoaW50ZXJmICE9IG51bGwgJiYgaW50ZXJmLm1vZHVsZS5pc1N5c3RlbU1vZHVsZSAmJlxyXG4gICAgICAgICAgICAgICAgdXNlZFN5c3RlbUNsYXNzZXMuaW5kZXhPZihpbnRlcmYpIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdXNlZFN5c3RlbUNsYXNzZXMucHVzaChpbnRlcmYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldENvbXBvc2l0ZURhdGEoKTogQ29tcG9zdGlvbkRhdGFbXSB7XHJcblxyXG4gICAgICAgIGxldCBjZDogQ29tcG9zdGlvbkRhdGFbXSA9IFtdO1xyXG4gICAgICAgIGxldCBjZE1hcDogTWFwPEtsYXNzIHwgSW50ZXJmYWNlLCBDb21wb3N0aW9uRGF0YT4gPSBuZXcgTWFwKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGEgb2YgdGhpcy5hdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChhLnR5cGUgaW5zdGFuY2VvZiBLbGFzcyB8fCBhLnR5cGUgaW5zdGFuY2VvZiBJbnRlcmZhY2UpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjZGEgPSBjZE1hcC5nZXQoYS50eXBlKTtcclxuICAgICAgICAgICAgICAgIGlmIChjZGEgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNkYSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAga2xhc3M6IGEudHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGVzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogYS5pZGVudGlmaWVyXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBjZE1hcC5zZXQoYS50eXBlLCBjZGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNkLnB1c2goY2RhKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2RhLmlkZW50aWZpZXIgKz0gXCIsIFwiICsgYS5pZGVudGlmaWVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGV0IHR5cGU6IFR5cGUgPSBhLnR5cGU7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAodHlwZSBpbnN0YW5jZW9mIEFycmF5VHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPSB0eXBlLmFycmF5T2ZUeXBlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgaW5zdGFuY2VvZiBLbGFzcyB8fCB0eXBlIGluc3RhbmNlb2YgSW50ZXJmYWNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNkYSA9IGNkTWFwLmdldCh0eXBlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2RhID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2RhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2xhc3M6IHR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZXM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBhLmlkZW50aWZpZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2RNYXAuc2V0KHR5cGUsIGNkYSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNkLnB1c2goY2RhKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjZGEuaWRlbnRpZmllciArPSBcIiwgXCIgKyBhLmlkZW50aWZpZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNkYS5tdWx0aXBsZXMgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNkO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBjbGVhclVzYWdlUG9zaXRpb25zKCkge1xyXG4gICAgICAgIHN1cGVyLmNsZWFyVXNhZ2VQb3NpdGlvbnMoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbSBvZiB0aGlzLm1ldGhvZHMpIHtcclxuICAgICAgICAgICAgbS5jbGVhclVzYWdlUG9zaXRpb25zKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBhIG9mIHRoaXMuYXR0cmlidXRlcykge1xyXG4gICAgICAgICAgICBhLnVzYWdlUG9zaXRpb25zID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGljQ2xhc3MgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRpY0NsYXNzLmNsZWFyVXNhZ2VQb3NpdGlvbnMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBnZXRQb3N0Q29uc3RydWN0b3JDYWxsYmFja3MoKTogKChyOiBSdW50aW1lT2JqZWN0KSA9PiB2b2lkKVtdIHtcclxuICAgICAgICBsZXQgYzogS2xhc3MgPSB0aGlzO1xyXG4gICAgICAgIGxldCBjYWxsYmFja3M6ICgocjogUnVudGltZU9iamVjdCkgPT4gdm9pZClbXSA9IG51bGw7XHJcblxyXG4gICAgICAgIHdoaWxlIChjICE9IG51bGwpIHtcclxuICAgICAgICAgICAgaWYgKGMucG9zdENvbnN0cnVjdG9yQ2FsbGJhY2tzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFja3MgPT0gbnVsbCkgeyBjYWxsYmFja3MgPSBjLnBvc3RDb25zdHJ1Y3RvckNhbGxiYWNrczsgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzID0gY2FsbGJhY2tzLmNvbmNhdChjLnBvc3RDb25zdHJ1Y3RvckNhbGxiYWNrcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYyA9IGMuYmFzZUNsYXNzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY2FsbGJhY2tzO1xyXG4gICAgfVxyXG5cclxuICAgIGdldENvbXBsZXRpb25JdGVtcyh2aXNpYmlsaXR5VXBUbzogVmlzaWJpbGl0eSxcclxuICAgICAgICBsZWZ0QnJhY2tldEFscmVhZHlUaGVyZTogYm9vbGVhbiwgaWRlbnRpZmllckFuZEJyYWNrZXRBZnRlckN1cnNvcjogc3RyaW5nLFxyXG4gICAgICAgIHJhbmdlVG9SZXBsYWNlOiBtb25hY28uSVJhbmdlLCBjdXJyZW50TWV0aG9kPzogTWV0aG9kKTogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbVtdIHtcclxuXHJcbiAgICAgICAgbGV0IGl0ZW1MaXN0OiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10gPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYXR0cmlidXRlIG9mIHRoaXMuZ2V0QXR0cmlidXRlcyh2aXNpYmlsaXR5VXBUbykpIHtcclxuICAgICAgICAgICAgaXRlbUxpc3QucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogYXR0cmlidXRlLmlkZW50aWZpZXIgKyBcIlwiLFxyXG4gICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuRmllbGQsXHJcbiAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBhdHRyaWJ1dGUuaWRlbnRpZmllcixcclxuICAgICAgICAgICAgICAgIHJhbmdlOiByYW5nZVRvUmVwbGFjZSxcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50YXRpb246IGF0dHJpYnV0ZS5kb2N1bWVudGF0aW9uID09IG51bGwgPyB1bmRlZmluZWQgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGF0dHJpYnV0ZS5kb2N1bWVudGF0aW9uXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgbWV0aG9kIG9mIHRoaXMuZ2V0TWV0aG9kcyh2aXNpYmlsaXR5VXBUbykpIHtcclxuICAgICAgICAgICAgaWYgKG1ldGhvZC5pc0NvbnN0cnVjdG9yKXtcclxuICAgICAgICAgICAgICAgIGlmKGN1cnJlbnRNZXRob2Q/LmlzQ29uc3RydWN0b3IgJiYgY3VycmVudE1ldGhvZCAhPSBtZXRob2QgJiYgdGhpcy5iYXNlQ2xhc3MubWV0aG9kcy5pbmRleE9mKG1ldGhvZCkgPj0gMCl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoU3VwZXJDb21wbGV0aW9uSXRlbShpdGVtTGlzdCwgbWV0aG9kLCBsZWZ0QnJhY2tldEFscmVhZHlUaGVyZSwgcmFuZ2VUb1JlcGxhY2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaXRlbUxpc3QucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogbWV0aG9kLmdldENvbXBsZXRpb25MYWJlbCgpLFxyXG4gICAgICAgICAgICAgICAgZmlsdGVyVGV4dDogbWV0aG9kLmlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICBjb21tYW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwiZWRpdG9yLmFjdGlvbi50cmlnZ2VyUGFyYW1ldGVySGludHNcIixcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJzEyMycsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLk1ldGhvZCxcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IG1ldGhvZC5nZXRDb21wbGV0aW9uU25pcHBldChsZWZ0QnJhY2tldEFscmVhZHlUaGVyZSksXHJcbiAgICAgICAgICAgICAgICByYW5nZTogcmFuZ2VUb1JlcGxhY2UsXHJcbiAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudGF0aW9uOiBtZXRob2QuZG9jdW1lbnRhdGlvbiA9PSBudWxsID8gdW5kZWZpbmVkIDoge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBtZXRob2QuZG9jdW1lbnRhdGlvblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGl0ZW1MaXN0ID0gaXRlbUxpc3QuY29uY2F0KHRoaXMuc3RhdGljQ2xhc3MuZ2V0Q29tcGxldGlvbkl0ZW1zKHZpc2liaWxpdHlVcFRvLFxyXG4gICAgICAgICAgICBsZWZ0QnJhY2tldEFscmVhZHlUaGVyZSwgaWRlbnRpZmllckFuZEJyYWNrZXRBZnRlckN1cnNvcixcclxuICAgICAgICAgICAgcmFuZ2VUb1JlcGxhY2UpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGl0ZW1MaXN0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1c2hTdXBlckNvbXBsZXRpb25JdGVtKGl0ZW1MaXN0OiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10sIG1ldGhvZDogTWV0aG9kLCBsZWZ0QnJhY2tldEFscmVhZHlUaGVyZTogYm9vbGVhbixcclxuICAgICAgICByYW5nZVRvUmVwbGFjZTogbW9uYWNvLklSYW5nZSkge1xyXG4gICAgICAgIGl0ZW1MaXN0LnB1c2goe1xyXG4gICAgICAgICAgICBsYWJlbDogbWV0aG9kLmdldENvbXBsZXRpb25MYWJlbCgpLnJlcGxhY2UobWV0aG9kLmlkZW50aWZpZXIsIFwic3VwZXJcIiksXHJcbiAgICAgICAgICAgIGZpbHRlclRleHQ6IFwic3VwZXJcIixcclxuICAgICAgICAgICAgY29tbWFuZDoge1xyXG4gICAgICAgICAgICAgICAgaWQ6IFwiZWRpdG9yLmFjdGlvbi50cmlnZ2VyUGFyYW1ldGVySGludHNcIixcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAnMTIzJyxcclxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW11cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuTWV0aG9kLFxyXG4gICAgICAgICAgICBpbnNlcnRUZXh0OiBtZXRob2QuZ2V0Q29tcGxldGlvblNuaXBwZXQobGVmdEJyYWNrZXRBbHJlYWR5VGhlcmUpLnJlcGxhY2UobWV0aG9kLmlkZW50aWZpZXIsIFwic3VwZXJcIiksXHJcbiAgICAgICAgICAgIHJhbmdlOiByYW5nZVRvUmVwbGFjZSxcclxuICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICBkb2N1bWVudGF0aW9uOiBtZXRob2QuZG9jdW1lbnRhdGlvbiA9PSBudWxsID8gdW5kZWZpbmVkIDoge1xyXG4gICAgICAgICAgICAgICAgdmFsdWU6IG1ldGhvZC5kb2N1bWVudGF0aW9uXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVzaFN0YXRpY0luaXRpYWxpemF0aW9uUHJvZ3JhbXMocHJvZ3JhbVN0YWNrOiBQcm9ncmFtU3RhY2tFbGVtZW50W10pIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGljQ2xhc3MuYXR0cmlidXRlSW5pdGlhbGl6YXRpb25Qcm9ncmFtLnN0YXRlbWVudHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBwcm9ncmFtU3RhY2sucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBwcm9ncmFtOiB0aGlzLnN0YXRpY0NsYXNzLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbSxcclxuICAgICAgICAgICAgICAgIHByb2dyYW1Qb3NpdGlvbjogMCxcclxuICAgICAgICAgICAgICAgIHRleHRQb3NpdGlvbjogeyBsaW5lOiAxLCBjb2x1bW46IDEsIGxlbmd0aDogMCB9LFxyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIkluaXRpYWxpc2llcnVuZyBzdGF0aXNjaGVyIFZhcmlhYmxlbiBkZXIgS2xhc3NlIFwiICsgdGhpcy5zdGF0aWNDbGFzcy5pZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tBZnRlclJldHVybjogbnVsbCxcclxuICAgICAgICAgICAgICAgIGlzQ2FsbGVkRnJvbU91dHNpZGU6IFwiSW5pdGlhbGlzaWVydW5nIHN0YXRpc2NoZXIgQXR0cmlidXRlXCJcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXRNZXRob2RCeVNpZ25hdHVyZShzaWduYXR1cmU6IHN0cmluZyk6IE1ldGhvZCB7XHJcblxyXG4gICAgICAgIGxldCBjOiBLbGFzcyA9IHRoaXM7XHJcbiAgICAgICAgd2hpbGUgKGMgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBsZXQgbWV0aG9kID0gYy5tZXRob2RNYXAuZ2V0KHNpZ25hdHVyZSk7XHJcbiAgICAgICAgICAgIGlmIChtZXRob2QgIT0gbnVsbCkgcmV0dXJuIG1ldGhvZDtcclxuICAgICAgICAgICAgYyA9IGMuYmFzZUNsYXNzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlcXVhbHModHlwZTogVHlwZSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0eXBlID09IHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0QmFzZUNsYXNzKGJhc2VDbGFzczogS2xhc3MpIHtcclxuICAgICAgICB0aGlzLmJhc2VDbGFzcyA9IGJhc2VDbGFzcztcclxuICAgICAgICB0aGlzLnN0YXRpY0NsYXNzLmJhc2VDbGFzcyA9IGJhc2VDbGFzcy5zdGF0aWNDbGFzcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkTWV0aG9kKG1ldGhvZDogTWV0aG9kKSB7XHJcbiAgICAgICAgaWYobWV0aG9kLmlzQ29uc3RydWN0b3Ipe1xyXG4gICAgICAgICAgICBtZXRob2QucmV0dXJuVHlwZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChtZXRob2QuaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgdGhpcy5zdGF0aWNDbGFzcy5hZGRNZXRob2QobWV0aG9kKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLm1ldGhvZHMucHVzaChtZXRob2QpO1xyXG4gICAgICAgICAgICB0aGlzLm1ldGhvZE1hcC5zZXQobWV0aG9kLnNpZ25hdHVyZSwgbWV0aG9kKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZEF0dHJpYnV0ZShhdHRyaWJ1dGU6IEF0dHJpYnV0ZSkge1xyXG4gICAgICAgIGlmIChhdHRyaWJ1dGUuaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgdGhpcy5zdGF0aWNDbGFzcy5hZGRBdHRyaWJ1dGUoYXR0cmlidXRlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZXMucHVzaChhdHRyaWJ1dGUpO1xyXG4gICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcC5zZXQoYXR0cmlidXRlLmlkZW50aWZpZXIsIGF0dHJpYnV0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRSZXN1bHRUeXBlKG9wZXJhdGlvbjogVG9rZW5UeXBlLCBzZWNvbmRPcGVyYW5kVHlwZT86IFR5cGUpOiBUeXBlIHtcclxuXHJcbiAgICAgICAgaWYgKG9wZXJhdGlvbiA9PSBUb2tlblR5cGUuZXF1YWwgfHwgb3BlcmF0aW9uID09IFRva2VuVHlwZS5ub3RFcXVhbCkge1xyXG4gICAgICAgICAgICBpZiAoc2Vjb25kT3BlcmFuZFR5cGUgaW5zdGFuY2VvZiBLbGFzcyB8fCBzZWNvbmRPcGVyYW5kVHlwZSA9PSBudWxsVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJvb2xlYW5QcmltaXRpdmVUeXBlQ29weTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG9wZXJhdGlvbiA9PSBUb2tlblR5cGUua2V5d29yZEluc3RhbmNlb2YpIHtcclxuICAgICAgICAgICAgaWYgKHNlY29uZE9wZXJhbmRUeXBlIGluc3RhbmNlb2YgU3RhdGljQ2xhc3MgfHwgc2Vjb25kT3BlcmFuZFR5cGUgaW5zdGFuY2VvZiBJbnRlcmZhY2UpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBib29sZWFuUHJpbWl0aXZlVHlwZUNvcHk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29tcHV0ZShvcGVyYXRpb246IFRva2VuVHlwZSwgZmlyc3RPcGVyYW5kOiBWYWx1ZSwgc2Vjb25kT3BlcmFuZD86IFZhbHVlKSB7XHJcbiAgICAgICAgaWYgKG9wZXJhdGlvbiA9PSBUb2tlblR5cGUuZXF1YWwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZpcnN0T3BlcmFuZC52YWx1ZSA9PSBzZWNvbmRPcGVyYW5kLnZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG9wZXJhdGlvbiA9PSBUb2tlblR5cGUubm90RXF1YWwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZpcnN0T3BlcmFuZC52YWx1ZSAhPSBzZWNvbmRPcGVyYW5kLnZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG9wZXJhdGlvbiA9PSBUb2tlblR5cGUua2V5d29yZEluc3RhbmNlb2YpIHtcclxuICAgICAgICAgICAgbGV0IGZpcnN0T3BDbGFzcyA9IGZpcnN0T3BlcmFuZD8udmFsdWU/LmNsYXNzO1xyXG4gICAgICAgICAgICBpZihmaXJzdE9wQ2xhc3MgPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICBsZXQgdHlwZUxlZnQ6IEtsYXNzID0gPEtsYXNzPmZpcnN0T3BDbGFzcztcclxuICAgICAgICAgICAgbGV0IHR5cGVSaWdodCA9IHNlY29uZE9wZXJhbmQudHlwZTtcclxuICAgICAgICAgICAgaWYgKHR5cGVSaWdodCBpbnN0YW5jZW9mIFN0YXRpY0NsYXNzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHR5cGVMZWZ0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZUxlZnQgPT09IHR5cGVSaWdodC5LbGFzcykgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZUxlZnQgPSB0eXBlTGVmdC5iYXNlQ2xhc3M7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHR5cGVSaWdodCBpbnN0YW5jZW9mIEludGVyZmFjZSkge1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHR5cGVMZWZ0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpIG9mIHR5cGVMZWZ0LmltcGxlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT09IHR5cGVSaWdodCkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGVMZWZ0ID0gdHlwZUxlZnQuYmFzZUNsYXNzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBhbGwgdmlzaWJsZSBtZXRob2RzIG9mIHRoaXMgY2xhc3MgYW5kIGFsbCBvZiBpdHMgYmFzZSBjbGFzc2VzXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXRNZXRob2RzKHVwVG9WaXNpYmlsaXR5OiBWaXNpYmlsaXR5LCBpZGVudGlmaWVyPzogc3RyaW5nKTogTWV0aG9kW10ge1xyXG5cclxuICAgICAgICBsZXQgbWV0aG9kczogTWV0aG9kW10gPSB0aGlzLm1ldGhvZHMuZmlsdGVyKChtZXRob2QpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG1ldGhvZC52aXNpYmlsaXR5IDw9IHVwVG9WaXNpYmlsaXR5ICYmIChpZGVudGlmaWVyID09IG51bGwgfHwgbWV0aG9kLmlkZW50aWZpZXIgPT0gaWRlbnRpZmllcik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJhc2VDbGFzcyAhPSBudWxsICYmIChpZGVudGlmaWVyID09IG51bGwgfHwgaWRlbnRpZmllciAhPSB0aGlzLmlkZW50aWZpZXIgfHwgbWV0aG9kcy5sZW5ndGggPT0gMCkpIHtcclxuICAgICAgICAgICAgbGV0IGJhc2VDbGFzc1VwdG9WaXNpYmlsaXR5ID0gdXBUb1Zpc2liaWxpdHkgPT0gVmlzaWJpbGl0eS5wdWJsaWMgPyB1cFRvVmlzaWJpbGl0eSA6IFZpc2liaWxpdHkucHJvdGVjdGVkO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgbSBvZiB0aGlzLmJhc2VDbGFzcy5nZXRNZXRob2RzKGJhc2VDbGFzc1VwdG9WaXNpYmlsaXR5LCBpZGVudGlmaWVyID09IHRoaXMuaWRlbnRpZmllciA/IHRoaXMuYmFzZUNsYXNzLmlkZW50aWZpZXIgOiBpZGVudGlmaWVyKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbTEgb2YgbWV0aG9kcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtMS5zaWduYXR1cmUgPT0gbS5zaWduYXR1cmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHMucHVzaChtKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBtZXRob2RzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBhbGwgdmlzaWJsZSBhdHRyaWJ1dGVzIG9mIHRoaXMgY2xhc3MgYW5kIGFsbCBvZiBpdHMgYmFzZSBjbGFzc2VzXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXRBdHRyaWJ1dGVzKHVwVG9WaXNpYmlsaXR5OiBWaXNpYmlsaXR5KTogQXR0cmlidXRlW10ge1xyXG5cclxuICAgICAgICBsZXQgYXR0cmlidXRlczogQXR0cmlidXRlW10gPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBhIG9mIHRoaXMuYXR0cmlidXRlcykge1xyXG4gICAgICAgICAgICBpZiAoYS52aXNpYmlsaXR5IDw9IHVwVG9WaXNpYmlsaXR5KSB7XHJcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzLnB1c2goYSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJhc2VDbGFzcyAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgdXBUb1Zpc2liaWxpdHlJbkJhc2VDbGFzcyA9IHVwVG9WaXNpYmlsaXR5ID09IFZpc2liaWxpdHkucHVibGljID8gdXBUb1Zpc2liaWxpdHkgOiBWaXNpYmlsaXR5LnByb3RlY3RlZDtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGEgb2YgdGhpcy5iYXNlQ2xhc3MuZ2V0QXR0cmlidXRlcyh1cFRvVmlzaWJpbGl0eUluQmFzZUNsYXNzKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChhLnZpc2liaWxpdHkgPiB1cFRvVmlzaWJpbGl0eUluQmFzZUNsYXNzKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBhMSBvZiBhdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGExLmlkZW50aWZpZXIgPT0gYS5pZGVudGlmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICghZm91bmQpIHtcclxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzLnB1c2goYSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXR0cmlidXRlcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaGFzQ29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgZm9yIChsZXQgbSBvZiB0aGlzLm1ldGhvZHMpIHtcclxuICAgICAgICAgICAgaWYgKG0uaXNDb25zdHJ1Y3RvcikgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5iYXNlQ2xhc3MgIT0gbnVsbCkgcmV0dXJuIHRoaXMuYmFzZUNsYXNzLmhhc0NvbnN0cnVjdG9yKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0Q29uc3RydWN0b3IocGFyYW1ldGVyVHlwZXM6IFR5cGVbXSwgdXBUb1Zpc2liaWxpdHk6IFZpc2liaWxpdHksIGNsYXNzSWRlbnRpZmllcjogc3RyaW5nID0gdGhpcy5pZGVudGlmaWVyKTogeyBlcnJvcjogc3RyaW5nLCBtZXRob2RMaXN0OiBNZXRob2RbXSB9IHtcclxuXHJcbiAgICAgICAgbGV0IGNvbnN0cnVjdG9yczogTWV0aG9kW10gPSB0aGlzLm1ldGhvZHMuZmlsdGVyKChtKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBtLmlzQ29uc3RydWN0b3I7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChjb25zdHJ1Y3RvcnMubGVuZ3RoID09IDAgJiYgdGhpcy5iYXNlQ2xhc3MgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5iYXNlQ2xhc3MuZ2V0Q29uc3RydWN0b3IocGFyYW1ldGVyVHlwZXMsIHVwVG9WaXNpYmlsaXR5LCBjbGFzc0lkZW50aWZpZXIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmaW5kU3VpdGFibGVNZXRob2RzKGNvbnN0cnVjdG9ycywgdGhpcy5pZGVudGlmaWVyLCBwYXJhbWV0ZXJUeXBlcywgY2xhc3NJZGVudGlmaWVyLCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRNZXRob2RzVGhhdEZpdFdpdGhDYXN0aW5nKGlkZW50aWZpZXI6IHN0cmluZywgcGFyYW1ldGVyVHlwZXM6IFR5cGVbXSxcclxuICAgICAgICBzZWFyY2hDb25zdHJ1Y3RvcjogYm9vbGVhbiwgdXBUb1Zpc2liaWxpdHk6IFZpc2liaWxpdHkpOiB7IGVycm9yOiBzdHJpbmcsIG1ldGhvZExpc3Q6IE1ldGhvZFtdIH0ge1xyXG5cclxuICAgICAgICBsZXQgYWxsTWV0aG9kcyA9IHRoaXMuZ2V0TWV0aG9kcyh1cFRvVmlzaWJpbGl0eSk7XHJcblxyXG4gICAgICAgIGxldCBtZXRob2RzID0gZmluZFN1aXRhYmxlTWV0aG9kcyhhbGxNZXRob2RzLCBpZGVudGlmaWVyLCBwYXJhbWV0ZXJUeXBlcywgdGhpcy5pZGVudGlmaWVyLCBzZWFyY2hDb25zdHJ1Y3Rvcik7XHJcblxyXG4gICAgICAgIGlmIChtZXRob2RzLm1ldGhvZExpc3QubGVuZ3RoID09IDAgJiYgIXNlYXJjaENvbnN0cnVjdG9yKSB7XHJcbiAgICAgICAgICAgIGxldCBzdGF0aWNNZXRob2RzID0gdGhpcy5zdGF0aWNDbGFzcy5nZXRNZXRob2RzVGhhdEZpdFdpdGhDYXN0aW5nKGlkZW50aWZpZXIsIHBhcmFtZXRlclR5cGVzLCBmYWxzZSwgdXBUb1Zpc2liaWxpdHkpO1xyXG4gICAgICAgICAgICBpZiAoc3RhdGljTWV0aG9kcy5lcnJvciA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGljTWV0aG9kcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1ldGhvZHM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbWV0aG9kcztcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE1ldGhvZChpZGVudGlmaWVyOiBzdHJpbmcsIHBhcmFtZXRlcmxpc3Q6IFBhcmFtZXRlcmxpc3QpOiBNZXRob2Qge1xyXG5cclxuICAgICAgICBsZXQgbWV0aG9kID0gdGhpcy5tZXRob2RNYXAuZ2V0KGlkZW50aWZpZXIgKyBwYXJhbWV0ZXJsaXN0LmlkKTtcclxuXHJcbiAgICAgICAgaWYgKG1ldGhvZCA9PSBudWxsICYmIHRoaXMuYmFzZUNsYXNzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmFzZUNsYXNzLmdldE1ldGhvZChpZGVudGlmaWVyLCBwYXJhbWV0ZXJsaXN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBtZXRob2Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEF0dHJpYnV0ZShpZGVudGlmaWVyOiBzdHJpbmcsIHVwVG9WaXNpYmlsaXR5OiBWaXNpYmlsaXR5KTogeyBhdHRyaWJ1dGU6IEF0dHJpYnV0ZSwgZXJyb3I6IHN0cmluZywgZm91bmRCdXRJbnZpc2libGU6IGJvb2xlYW4gfSB7XHJcblxyXG4gICAgICAgIGxldCBlcnJvciA9IG51bGw7XHJcbiAgICAgICAgbGV0IGZvdW5kQnV0SW52aXNpYmxlOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGxldCBhdHRyaWJ1dGUgPSB0aGlzLmF0dHJpYnV0ZU1hcC5nZXQoaWRlbnRpZmllcik7XHJcbiAgICAgICAgbGV0IGF0dHJpYnV0ZU5vdEZvdW5kID0gYXR0cmlidXRlID09IG51bGw7XHJcblxyXG4gICAgICAgIGlmIChhdHRyaWJ1dGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBlcnJvciA9IFwiRGFzIEF0dHJpYnV0IFwiICsgaWRlbnRpZmllciArIFwiIGthbm4gbmljaHQgZ2VmdW5kZW4gd2VyZGVuLlwiO1xyXG4gICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICBpZiAoYXR0cmlidXRlLnZpc2liaWxpdHkgPiB1cFRvVmlzaWJpbGl0eSkge1xyXG4gICAgICAgICAgICAgICAgZXJyb3IgPSBcIkRhcyBBdHRyaWJ1dCBcIiArIGlkZW50aWZpZXIgKyBcIiBoYXQgZGllIFNpY2h0YmFya2VpdCBcIiArIFZpc2liaWxpdHlbYXR0cmlidXRlLnZpc2liaWxpdHldICsgXCIgdW5kIGlzdCBkYWhlciBoaWVyIG5pY2h0IHNpY2h0YmFyLlwiO1xyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGZvdW5kQnV0SW52aXNpYmxlID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXR0cmlidXRlID09IG51bGwgJiYgdGhpcy5iYXNlQ2xhc3MgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBsZXQgdXBUb1Zpc2liaWxpdHlJbkJhc2VDbGFzcyA9IHVwVG9WaXNpYmlsaXR5ID09IFZpc2liaWxpdHkucHVibGljID8gdXBUb1Zpc2liaWxpdHkgOiBWaXNpYmlsaXR5LnByb3RlY3RlZDtcclxuXHJcbiAgICAgICAgICAgIGxldCBiYXNlQ2xhc3NBdHRyaWJ1dGUgPSB0aGlzLmJhc2VDbGFzcy5nZXRBdHRyaWJ1dGUoaWRlbnRpZmllciwgdXBUb1Zpc2liaWxpdHlJbkJhc2VDbGFzcyk7XHJcbiAgICAgICAgICAgIGlmIChiYXNlQ2xhc3NBdHRyaWJ1dGUuYXR0cmlidXRlICE9IG51bGwgfHwgYXR0cmlidXRlTm90Rm91bmQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBiYXNlQ2xhc3NBdHRyaWJ1dGU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geyBhdHRyaWJ1dGU6IGF0dHJpYnV0ZSwgZXJyb3I6IGVycm9yLCBmb3VuZEJ1dEludmlzaWJsZTogZm91bmRCdXRJbnZpc2libGUgfTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FuQ2FzdFRvKHR5cGU6IFR5cGUpOiBib29sZWFuIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGUgPT0gc3RyaW5nUHJpbWl0aXZlVHlwZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlIGluc3RhbmNlb2YgS2xhc3MpIHtcclxuICAgICAgICAgICAgbGV0IGJhc2VDbGFzczogS2xhc3MgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKGJhc2VDbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZS5nZXROb25HZW5lcmljSWRlbnRpZmllcigpID09IGJhc2VDbGFzcy5nZXROb25HZW5lcmljSWRlbnRpZmllcigpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUudHlwZVZhcmlhYmxlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuOiBudW1iZXIgPSBNYXRoLm1pbih0eXBlLnR5cGVWYXJpYWJsZXMubGVuZ3RoLCBiYXNlQ2xhc3MudHlwZVZhcmlhYmxlcy5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFiYXNlQ2xhc3MudHlwZVZhcmlhYmxlc1tpXS50eXBlLmNhbkNhc3RUbyh0eXBlLnR5cGVWYXJpYWJsZXNbaV0udHlwZSkpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBiYXNlQ2xhc3MgPSBiYXNlQ2xhc3MuYmFzZUNsYXNzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIEludGVyZmFjZSkge1xyXG5cclxuICAgICAgICAgICAgbGV0IGtsYXNzOiBLbGFzcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIHdoaWxlKGtsYXNzICE9IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSBvZiBrbGFzcy5pbXBsZW1lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUuZ2V0Tm9uR2VuZXJpY0lkZW50aWZpZXIoKSA9PSBpLmdldE5vbkdlbmVyaWNJZGVudGlmaWVyKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAga2xhc3MgPSBrbGFzcy5iYXNlQ2xhc3M7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhc3RUbyh2YWx1ZTogVmFsdWUsIHR5cGU6IFR5cGUpOiBWYWx1ZSB7XHJcblxyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgY2hlY2tJbmhlcml0YW5jZSgpOiB7IG1lc3NhZ2U6IHN0cmluZywgbWlzc2luZ01ldGhvZHM6IE1ldGhvZFtdIH0ge1xyXG5cclxuICAgICAgICBpZiAodGhpcy5iYXNlQ2xhc3MgIT0gbnVsbCAmJiBLbGFzcy5kb250SW5oZXJpdEZyb20uaW5kZXhPZih0aGlzLmJhc2VDbGFzcy5pZGVudGlmaWVyKSA+PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IG1lc3NhZ2U6IFwiQXVzIFBlcmZvcm1hbmNlZ3LDvG5kZW4gaXN0IGVzIGxlaWRlciBuaWNodCBtw7ZnbGljaCwgVW50ZXJrbGFzc2VuIGRlciBLbGFzc2VuIFN0cmluZywgQm9vbGVhbiwgQ2hhcmFjdGVyLCBJbnRlZ2VyLCBGbG9hdCB1bmQgRG91YmxlIHp1IGJpbGRlbi5cIiwgbWlzc2luZ01ldGhvZHM6IFtdIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbWVzc2FnZSA9IFwiXCI7XHJcbiAgICAgICAgbGV0IG1pc3NpbmdBYnN0cmFjdE1ldGhvZHM6IE1ldGhvZFtdID0gW107XHJcbiAgICAgICAgbGV0IGltcGxlbWVudGVkTWV0aG9kczogTWV0aG9kW10gPSBbXTtcclxuXHJcbiAgICAgICAgbGV0IG1pc3NpbmdJbnRlcmZhY2VNZXRob2RzOiBNZXRob2RbXSA9IFtdO1xyXG5cclxuICAgICAgICBsZXQga2xhc3M6IEtsYXNzID0gdGhpcztcclxuICAgICAgICBsZXQgaGllcmFyY2h5OiBzdHJpbmdbXSA9IFtrbGFzcy5pZGVudGlmaWVyXTtcclxuICAgICAgICB3aGlsZSAoa2xhc3MuYmFzZUNsYXNzICE9IG51bGwpIHtcclxuICAgICAgICAgICAga2xhc3MgPSBrbGFzcy5iYXNlQ2xhc3M7XHJcbiAgICAgICAgICAgIGlmIChoaWVyYXJjaHkuaW5kZXhPZihrbGFzcy5pZGVudGlmaWVyKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBrbGFzcy5iYXNlQ2xhc3MgPSBudWxsOyAgLy8gVGhpcyBpcyBuZWNlc3NhcnkgdG8gYXZvaWQgaW5maW5pdGUgbG9vcHMgaW4gZnVydGhlciBjb21waWxhdGlvblxyXG4gICAgICAgICAgICAgICAgaGllcmFyY2h5ID0gW2tsYXNzLmlkZW50aWZpZXJdLmNvbmNhdChoaWVyYXJjaHkpO1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IFwiRGllIEtsYXNzZSBcIiArIGtsYXNzLmlkZW50aWZpZXIgKyBcIiBlcmJ0IHZvbiBzaWNoIHNlbGJzdDogXCI7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlICs9IFwiKFwiICsgaGllcmFyY2h5LmpvaW4oXCIgZXh0ZW5kcyBcIikgKyBcIilcIjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGhpZXJhcmNoeSA9IFtrbGFzcy5pZGVudGlmaWVyXS5jb25jYXQoaGllcmFyY2h5KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtZXNzYWdlID09IFwiXCIpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmJhc2VDbGFzcyAhPSBudWxsICYmICF0aGlzLmlzQWJzdHJhY3QpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgYWJzdHJhY3RNZXRob2RzOiBNZXRob2RbXSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBrbGFzczogS2xhc3MgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbGxlY3QgYWJzdHJhY3QgTWV0aG9kc1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGtsYXNzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBtIG9mIGtsYXNzLm1ldGhvZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG0uaXNBYnN0cmFjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWJzdHJhY3RNZXRob2RzLnB1c2gobSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaXNJbXBsZW1lbnRlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yKGxldCBtMSBvZiBpbXBsZW1lbnRlZE1ldGhvZHMpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKG0xLmltcGxlbWVudHMobSkpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0ltcGxlbWVudGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoIWlzSW1wbGVtZW50ZWQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pc3NpbmdBYnN0cmFjdE1ldGhvZHMucHVzaChtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcGxlbWVudGVkTWV0aG9kcy5wdXNoKG0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGtsYXNzID0ga2xhc3MuYmFzZUNsYXNzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG1pc3NpbmdBYnN0cmFjdE1ldGhvZHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IFwiRGllIEtsYXNzZSBcIiArIHRoaXMuaWRlbnRpZmllciArIFwiIG11c3Mgbm9jaCBmb2xnZW5kZSBNZXRob2RlbiBpaHJlciBhYnN0cmFrdGVuIEJhc2lza2xhc3NlbiBpbXBsZW1lbnRpZXJlbjogXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZSArPSBtaXNzaW5nQWJzdHJhY3RNZXRob2RzLm1hcCgobSkgPT4gbS5nZXRTaWduYXR1cmVXaXRoUmV0dXJuUGFyYW1ldGVyKCkpLmpvaW4oXCIsIFwiKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgb2YgdGhpcy5pbXBsZW1lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBtIG9mIGkuZ2V0TWV0aG9kcygpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGlzSW1wbGVtZW50ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IobGV0IG0xIG9mIGltcGxlbWVudGVkTWV0aG9kcyl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKG0xLmltcGxlbWVudHMobSkpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNJbXBsZW1lbnRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZighaXNJbXBsZW1lbnRlZCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pc3NpbmdJbnRlcmZhY2VNZXRob2RzLnB1c2gobSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobWlzc2luZ0ludGVyZmFjZU1ldGhvZHMubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlICE9IFwiXCIpIG1lc3NhZ2UgKz0gXCJcXG5cIjtcclxuXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlICs9IFwiRGllIEtsYXNzZSBcIiArIHRoaXMuaWRlbnRpZmllciArIFwiIG11c3Mgbm9jaCBmb2xnZW5kZSBNZXRob2RlbiBkZXIgdm9uIGlociBpbXBsZW1lbnRpZXJ0ZW4gSW50ZXJmYWNlcyBpbXBsZW1lbnRpZXJlbjogXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZSArPSBtaXNzaW5nSW50ZXJmYWNlTWV0aG9kcy5tYXAoKG0pID0+IG0uc2lnbmF0dXJlKS5qb2luKFwiLCBcIik7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHsgbWVzc2FnZTogbWVzc2FnZSwgbWlzc2luZ01ldGhvZHM6IG1pc3NpbmdBYnN0cmFjdE1ldGhvZHMuY29uY2F0KG1pc3NpbmdJbnRlcmZhY2VNZXRob2RzKSB9O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBoYXNBbmNlc3Rvck9ySXMoYTogS2xhc3MgfCBTdGF0aWNDbGFzcykge1xyXG4gICAgICAgIGxldCBjOiBLbGFzcyB8IFN0YXRpY0NsYXNzID0gdGhpcztcclxuICAgICAgICBsZXQgaWQgPSBhLmlkZW50aWZpZXI7XHJcbiAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBLbGFzcykgaWQgPSBhLmdldE5vbkdlbmVyaWNJZGVudGlmaWVyKCk7XHJcblxyXG4gICAgICAgIHdoaWxlIChjICE9IG51bGwpIHtcclxuICAgICAgICAgICAgaWYgKGMuZ2V0Tm9uR2VuZXJpY0lkZW50aWZpZXIoKSA9PSBpZCkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGMgPSBjLmJhc2VDbGFzcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZWJ1Z091dHB1dCh2YWx1ZTogVmFsdWUsIG1heExlbmd0aDogbnVtYmVyID0gNDApOiBzdHJpbmcge1xyXG5cclxuICAgICAgICBsZXQgczogc3RyaW5nID0gXCJ7XCI7XHJcbiAgICAgICAgbGV0IGF0dHJpYnV0ZXMgPSB0aGlzLmdldEF0dHJpYnV0ZXMoVmlzaWJpbGl0eS5wcml2YXRlKTtcclxuICAgICAgICBsZXQgb2JqZWN0ID0gPFJ1bnRpbWVPYmplY3Q+dmFsdWUudmFsdWU7XHJcblxyXG4gICAgICAgIGlmIChvYmplY3QgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJudWxsXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2ldO1xyXG4gICAgICAgICAgICBsZXQgdiA9IG9iamVjdC5nZXRWYWx1ZShhdHRyaWJ1dGUuaW5kZXgpO1xyXG4gICAgICAgICAgICBpZiAoYXR0cmlidXRlLnR5cGUgaW5zdGFuY2VvZiBQcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICBzICs9IGF0dHJpYnV0ZS5pZGVudGlmaWVyICsgXCI6Jm5ic3A7XCIgKyBhdHRyaWJ1dGUudHlwZS5kZWJ1Z091dHB1dCh2LCBtYXhMZW5ndGggLyAyKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHMgKz0gYXR0cmlidXRlLmlkZW50aWZpZXIgKyBcIjombmJzcDsgey4uLn1cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaSA8IGF0dHJpYnV0ZXMubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgcyArPSBcIiwmbmJzcDtcIjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzICsgXCJ9XCI7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc3RhdGljIGNvdW50OiBudW1iZXIgPSAwO1xyXG4gICAgY2xvbmUoKTogS2xhc3Mge1xyXG4gICAgICAgIC8vIEtsYXNzLmNvdW50Kys7XHJcblxyXG4gICAgICAgIGxldCBuZXdLbGFzczogS2xhc3MgPSBPYmplY3QuY3JlYXRlKHRoaXMpO1xyXG5cclxuICAgICAgICBuZXdLbGFzcy5pbXBsZW1lbnRzID0gdGhpcy5pbXBsZW1lbnRzLnNsaWNlKDApO1xyXG4gICAgICAgIG5ld0tsYXNzLnVzYWdlUG9zaXRpb25zID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIG5ld0tsYXNzLmlzR2VuZXJpY1ZhcmlhbnRGcm9tID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ld0tsYXNzO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFN0YXRpY0NsYXNzIGV4dGVuZHMgVHlwZSB7XHJcblxyXG4gICAgYmFzZUNsYXNzOiBTdGF0aWNDbGFzcztcclxuICAgIEtsYXNzOiBLbGFzcztcclxuICAgIC8vIFRPRE86IEluaXRpYWxpemVcclxuICAgIGNsYXNzT2JqZWN0OiBSdW50aW1lT2JqZWN0O1xyXG5cclxuICAgIGF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbTogUHJvZ3JhbTtcclxuXHJcbiAgICBwdWJsaWMgbWV0aG9kczogTWV0aG9kW10gPSBbXTtcclxuICAgIHByaXZhdGUgbWV0aG9kTWFwOiBNYXA8c3RyaW5nLCBNZXRob2Q+ID0gbmV3IE1hcCgpO1xyXG5cclxuICAgIHB1YmxpYyBhdHRyaWJ1dGVzOiBBdHRyaWJ1dGVbXSA9IFtdO1xyXG4gICAgcHVibGljIGF0dHJpYnV0ZU1hcDogTWFwPHN0cmluZywgQXR0cmlidXRlPiA9IG5ldyBNYXAoKTtcclxuICAgIHB1YmxpYyBudW1iZXJPZkF0dHJpYnV0ZXNJbmNsdWRpbmdCYXNlQ2xhc3M6IG51bWJlciA9IG51bGw7XHJcblxyXG4gICAgY29uc3RydWN0b3Ioa2xhc3M6IEtsYXNzKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5LbGFzcyA9IGtsYXNzO1xyXG4gICAgICAgIHRoaXMuaWRlbnRpZmllciA9IGtsYXNzLmlkZW50aWZpZXI7XHJcblxyXG4gICAgICAgIGlmIChrbGFzcy5iYXNlQ2xhc3MgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLmJhc2VDbGFzcyA9IGtsYXNzLmJhc2VDbGFzcy5zdGF0aWNDbGFzcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlSW5pdGlhbGl6YXRpb25Qcm9ncmFtID0ge1xyXG4gICAgICAgICAgICBtZXRob2Q6IG51bGwsXHJcbiAgICAgICAgICAgIG1vZHVsZTogdGhpcy5LbGFzcy5tb2R1bGUsXHJcbiAgICAgICAgICAgIHN0YXRlbWVudHM6IFtdLFxyXG4gICAgICAgICAgICBsYWJlbE1hbmFnZXI6IG51bGxcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlSW5pdGlhbGl6YXRpb25Qcm9ncmFtLmxhYmVsTWFuYWdlciA9IG5ldyBMYWJlbE1hbmFnZXIodGhpcy5hdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZXR1cEF0dHJpYnV0ZUluZGljZXNSZWN1cnNpdmUoKSB7XHJcbiAgICAgICAgaWYodGhpcy5iYXNlQ2xhc3MgIT0gbnVsbCAmJiB0aGlzLmJhc2VDbGFzcy5udW1iZXJPZkF0dHJpYnV0ZXNJbmNsdWRpbmdCYXNlQ2xhc3MgPT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHRoaXMuYmFzZUNsYXNzLnNldHVwQXR0cmlidXRlSW5kaWNlc1JlY3Vyc2l2ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgbnVtYmVyT2ZBdHRyaWJ1dGVzSW5CYXNlQ2xhc3NlcyA9IHRoaXMuYmFzZUNsYXNzID09IG51bGwgPyAwIDogdGhpcy5iYXNlQ2xhc3MubnVtYmVyT2ZBdHRyaWJ1dGVzSW5jbHVkaW5nQmFzZUNsYXNzO1xyXG5cclxuICAgICAgICBmb3IobGV0IGEgb2YgdGhpcy5hdHRyaWJ1dGVzKXtcclxuICAgICAgICAgICAgYS5pbmRleCA9IG51bWJlck9mQXR0cmlidXRlc0luQmFzZUNsYXNzZXMrKztcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5pZGVudGlmaWVyICsgXCIuXCIgKyBhLmlkZW50aWZpZXIrIFwiOiBcIiArIGEuaW5kZXgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5udW1iZXJPZkF0dHJpYnV0ZXNJbmNsdWRpbmdCYXNlQ2xhc3MgPSBudW1iZXJPZkF0dHJpYnV0ZXNJbkJhc2VDbGFzc2VzO1xyXG5cclxuICAgIH1cclxuXHJcblxyXG4gICAgY2xlYXJVc2FnZVBvc2l0aW9ucygpIHtcclxuICAgICAgICBzdXBlci5jbGVhclVzYWdlUG9zaXRpb25zKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IG0gb2YgdGhpcy5tZXRob2RzKSB7XHJcbiAgICAgICAgICAgIG0uY2xlYXJVc2FnZVBvc2l0aW9ucygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgYSBvZiB0aGlzLmF0dHJpYnV0ZXMpIHtcclxuICAgICAgICAgICAgYS51c2FnZVBvc2l0aW9ucyA9IG5ldyBNYXAoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZWJ1Z091dHB1dCh2YWx1ZTogVmFsdWUsIG1heExlbmd0aDogbnVtYmVyID0gNDApOiBzdHJpbmcge1xyXG5cclxuICAgICAgICBsZXQgczogc3RyaW5nID0gXCJ7XCI7XHJcbiAgICAgICAgbGV0IGF0dHJpYnV0ZXMgPSB0aGlzLmdldEF0dHJpYnV0ZXMoVmlzaWJpbGl0eS5wcml2YXRlKTtcclxuICAgICAgICBsZXQgb2JqZWN0ID0gdGhpcy5jbGFzc09iamVjdDtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgYXR0cmlidXRlID0gYXR0cmlidXRlc1tpXTtcclxuICAgICAgICAgICAgcyArPSBhdHRyaWJ1dGUuaWRlbnRpZmllciArIFwiOiBcIiArIG9iamVjdCA9PSBudWxsID8gJy0tLScgOiBhdHRyaWJ1dGUudHlwZS5kZWJ1Z091dHB1dChvYmplY3QuZ2V0VmFsdWUoYXR0cmlidXRlLmluZGV4KSwgbWF4TGVuZ3RoIC8gMik7XHJcbiAgICAgICAgICAgIGlmIChpIDwgYXR0cmlidXRlcy5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICBzICs9IFwiLCBcIjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzICsgXCJ9XCI7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGdldENvbXBsZXRpb25JdGVtcyh2aXNpYmlsaXR5VXBUbzogVmlzaWJpbGl0eSxcclxuICAgICAgICBsZWZ0QnJhY2tldEFscmVhZHlUaGVyZTogYm9vbGVhbiwgaWRlbnRpZmllckFuZEJyYWNrZXRBZnRlckN1cnNvcjogc3RyaW5nLFxyXG4gICAgICAgIHJhbmdlVG9SZXBsYWNlOiBtb25hY28uSVJhbmdlKTogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbVtdIHtcclxuXHJcbiAgICAgICAgbGV0IGl0ZW1MaXN0OiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10gPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYXR0cmlidXRlIG9mIHRoaXMuZ2V0QXR0cmlidXRlcyh2aXNpYmlsaXR5VXBUbykpIHtcclxuICAgICAgICAgICAgaXRlbUxpc3QucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogYXR0cmlidXRlLmlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5GaWVsZCxcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IGF0dHJpYnV0ZS5pZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgcmFuZ2U6IHJhbmdlVG9SZXBsYWNlLFxyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnRhdGlvbjogYXR0cmlidXRlLmRvY3VtZW50YXRpb24gPT0gbnVsbCA/IHVuZGVmaW5lZCA6IHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogYXR0cmlidXRlLmRvY3VtZW50YXRpb25cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBtZXRob2Qgb2YgdGhpcy5nZXRNZXRob2RzKHZpc2liaWxpdHlVcFRvKSkge1xyXG4gICAgICAgICAgICBpdGVtTGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGxhYmVsOiBtZXRob2QuZ2V0Q29tcGxldGlvbkxhYmVsKCksXHJcbiAgICAgICAgICAgICAgICBmaWx0ZXJUZXh0OiBtZXRob2QuaWRlbnRpZmllcixcclxuICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLk1ldGhvZCxcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IG1ldGhvZC5nZXRDb21wbGV0aW9uU25pcHBldChsZWZ0QnJhY2tldEFscmVhZHlUaGVyZSksXHJcbiAgICAgICAgICAgICAgICByYW5nZTogcmFuZ2VUb1JlcGxhY2UsXHJcbiAgICAgICAgICAgICAgICBjb21tYW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwiZWRpdG9yLmFjdGlvbi50cmlnZ2VyUGFyYW1ldGVySGludHNcIixcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJzEyMycsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50YXRpb246IG1ldGhvZC5kb2N1bWVudGF0aW9uID09IG51bGwgPyB1bmRlZmluZWQgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG1ldGhvZC5kb2N1bWVudGF0aW9uXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGl0ZW1MaXN0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlcXVhbHModHlwZTogVHlwZSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0eXBlID09IHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZE1ldGhvZChtZXRob2Q6IE1ldGhvZCkge1xyXG4gICAgICAgIHRoaXMubWV0aG9kcy5wdXNoKG1ldGhvZCk7XHJcbiAgICAgICAgdGhpcy5tZXRob2RNYXAuc2V0KG1ldGhvZC5zaWduYXR1cmUsIG1ldGhvZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFkZEF0dHJpYnV0ZShhdHRyaWJ1dGU6IEF0dHJpYnV0ZSkge1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5wdXNoKGF0dHJpYnV0ZSk7XHJcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVNYXAuc2V0KGF0dHJpYnV0ZS5pZGVudGlmaWVyLCBhdHRyaWJ1dGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRSZXN1bHRUeXBlKG9wZXJhdGlvbjogVG9rZW5UeXBlLCBzZWNvbmRPcGVyYW5kVHlwZT86IFR5cGUpOiBUeXBlIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb21wdXRlKG9wZXJhdGlvbjogVG9rZW5UeXBlLCBmaXJzdE9wZXJhbmQ6IFZhbHVlLCBzZWNvbmRPcGVyYW5kPzogVmFsdWUpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0TWV0aG9kc1RoYXRGaXRXaXRoQ2FzdGluZyhpZGVudGlmaWVyOiBzdHJpbmcsIHBhcmFtZXRlclR5cGVzOiBUeXBlW10sXHJcbiAgICAgICAgc2VhcmNoQ29uc3RydWN0b3I6IGJvb2xlYW4sIHVwVG9WaXNpYmlsaXR5OiBWaXNpYmlsaXR5KTogeyBlcnJvcjogc3RyaW5nLCBtZXRob2RMaXN0OiBNZXRob2RbXSB9IHtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZpbmRTdWl0YWJsZU1ldGhvZHModGhpcy5nZXRNZXRob2RzKHVwVG9WaXNpYmlsaXR5KSwgaWRlbnRpZmllciwgcGFyYW1ldGVyVHlwZXMsXHJcbiAgICAgICAgICAgIHRoaXMuS2xhc3MuaWRlbnRpZmllciwgc2VhcmNoQ29uc3RydWN0b3IpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJldHVybnMgYWxsIG1ldGhvZHMgb2YgdGhpcyBjbGFzcyBhbmQgYWxsIG9mIGl0cyBiYXNlIGNsYXNzZXNcclxuICAgICAqIEBwYXJhbSBpc1N0YXRpYyByZXR1cm5zIG9ubHkgc3RhdGljIG1ldGhvZHMgaWYgdHJ1ZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZ2V0TWV0aG9kcyh1cFRvVmlzaWJpbGl0eTogVmlzaWJpbGl0eSwgaWRlbnRpZmllcj86IHN0cmluZyk6IE1ldGhvZFtdIHtcclxuXHJcbiAgICAgICAgbGV0IG1ldGhvZHM6IE1ldGhvZFtdID0gdGhpcy5tZXRob2RzLnNsaWNlKCkuZmlsdGVyKChtZXRob2QpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG1ldGhvZC52aXNpYmlsaXR5IDw9IHVwVG9WaXNpYmlsaXR5ICYmIChpZGVudGlmaWVyID09IG51bGwgfHwgaWRlbnRpZmllciA9PSBtZXRob2QuaWRlbnRpZmllcik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJhc2VDbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxldCBiYXNlQ2xhc3NVcHRvVmlzaWJpbGl0eSA9IHVwVG9WaXNpYmlsaXR5ID09IFZpc2liaWxpdHkucHVibGljID8gVmlzaWJpbGl0eS5wdWJsaWMgOiBWaXNpYmlsaXR5LnByb3RlY3RlZDtcclxuICAgICAgICAgICAgZm9yIChsZXQgbSBvZiB0aGlzLmJhc2VDbGFzcy5nZXRNZXRob2RzKGJhc2VDbGFzc1VwdG9WaXNpYmlsaXR5LCBpZGVudGlmaWVyKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbTEgb2YgbWV0aG9kcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtMS5zaWduYXR1cmUgPT0gbS5zaWduYXR1cmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHMucHVzaChtKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBtZXRob2RzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBhbGwgYXR0cmlidXRlcyBvZiB0aGlzIGNsYXNzIGFuZCBhbGwgb2YgaXRzIGJhc2UgY2xhc3Nlc1xyXG4gICAgICogQHBhcmFtIGlzU3RhdGljIHJldHVybiBvbmx5IHN0YXRpYyBhdHRyaWJ1dGVzIGlmIHRydWVcclxuICAgICAqL1xyXG4gICAgcHVibGljIGdldEF0dHJpYnV0ZXModmlzaWJpbGl0eVVwVG86IFZpc2liaWxpdHkpOiBBdHRyaWJ1dGVbXSB7XHJcblxyXG4gICAgICAgIGxldCBhdHRyaWJ1dGVzOiBBdHRyaWJ1dGVbXSA9IHRoaXMuYXR0cmlidXRlcy5maWx0ZXIoKGF0dHJpYnV0ZSkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gYXR0cmlidXRlLnZpc2liaWxpdHkgPD0gdmlzaWJpbGl0eVVwVG87XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJhc2VDbGFzcyAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgdmlzaWJpbGl0eVVwVG9CYXNlQ2xhc3MgPSB2aXNpYmlsaXR5VXBUbyA9PSBWaXNpYmlsaXR5LnB1YmxpYyA/IHZpc2liaWxpdHlVcFRvIDogVmlzaWJpbGl0eS5wcm90ZWN0ZWQ7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBhIG9mIHRoaXMuYmFzZUNsYXNzLmdldEF0dHJpYnV0ZXModmlzaWJpbGl0eVVwVG9CYXNlQ2xhc3MpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYTEgb2YgYXR0cmlidXRlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhMS5pZGVudGlmaWVyID09IGEuaWRlbnRpZmllcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWZvdW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlcy5wdXNoKGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE1ldGhvZChpZGVudGlmaWVyOiBzdHJpbmcsIHBhcmFtZXRlcmxpc3Q6IFBhcmFtZXRlcmxpc3QpOiBNZXRob2Qge1xyXG5cclxuICAgICAgICBsZXQgbWV0aG9kID0gdGhpcy5tZXRob2RNYXAuZ2V0KGlkZW50aWZpZXIgKyBwYXJhbWV0ZXJsaXN0LmlkKTtcclxuXHJcbiAgICAgICAgaWYgKG1ldGhvZCA9PSBudWxsICYmIHRoaXMuYmFzZUNsYXNzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmFzZUNsYXNzLmdldE1ldGhvZChpZGVudGlmaWVyLCBwYXJhbWV0ZXJsaXN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBtZXRob2Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEF0dHJpYnV0ZShpZGVudGlmaWVyOiBzdHJpbmcsIHVwVG9WaXNpYmlsaXR5OiBWaXNpYmlsaXR5KTogeyBhdHRyaWJ1dGU6IEF0dHJpYnV0ZSwgZXJyb3I6IHN0cmluZywgZm91bmRCdXRJbnZpc2libGU6IGJvb2xlYW4sIHN0YXRpY0NsYXNzOiBTdGF0aWNDbGFzc30ge1xyXG5cclxuICAgICAgICBsZXQgZXJyb3IgPSBcIlwiO1xyXG4gICAgICAgIGxldCBub3RGb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgIGxldCBhdHRyaWJ1dGUgPSB0aGlzLmF0dHJpYnV0ZU1hcC5nZXQoaWRlbnRpZmllcik7XHJcblxyXG4gICAgICAgIGlmIChhdHRyaWJ1dGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBub3RGb3VuZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGVycm9yID0gXCJEYXMgQXR0cmlidXQgXCIgKyBpZGVudGlmaWVyICsgXCIga29ubnRlIG5pY2h0IGdlZnVuZGVuIHdlcmRlbi5cIjtcclxuICAgICAgICB9IGVsc2UgaWYgKGF0dHJpYnV0ZS52aXNpYmlsaXR5ID4gdXBUb1Zpc2liaWxpdHkpIHtcclxuICAgICAgICAgICAgZXJyb3IgPSBcIkRhcyBBdHRyaWJ1dCBcIiArIGlkZW50aWZpZXIgKyBcIiBoYXQgZGllIFNpY2h0YmFya2VpdCBcIiArIFZpc2liaWxpdHlbYXR0cmlidXRlLnZpc2liaWxpdHldICsgXCIgdW5kIGlzdCBoaWVyIGRhaGVyIG5pY2h0IHNpY2h0YmFyLlwiO1xyXG4gICAgICAgICAgICBhdHRyaWJ1dGUgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGF0dHJpYnV0ZSA9PSBudWxsICYmIHRoaXMuYmFzZUNsYXNzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgbGV0IHVwVG9WaXNpYmlsaXR5SW5CYXNlQ2xhc3MgPSB1cFRvVmlzaWJpbGl0eSA9PSBWaXNpYmlsaXR5LnB1YmxpYyA/IHVwVG9WaXNpYmlsaXR5IDogVmlzaWJpbGl0eS5wcm90ZWN0ZWQ7XHJcblxyXG4gICAgICAgICAgICBsZXQgYmFzZUNsYXNzQXR0cmlidXRlV2l0aEVycm9yID0gdGhpcy5iYXNlQ2xhc3MuZ2V0QXR0cmlidXRlKGlkZW50aWZpZXIsIHVwVG9WaXNpYmlsaXR5SW5CYXNlQ2xhc3MpO1xyXG4gICAgICAgICAgICBpZiAobm90Rm91bmQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBiYXNlQ2xhc3NBdHRyaWJ1dGVXaXRoRXJyb3I7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7IGF0dHJpYnV0ZTogYXR0cmlidXRlLCBlcnJvcjogZXJyb3IsIGZvdW5kQnV0SW52aXNpYmxlOiAhbm90Rm91bmQgLCBzdGF0aWNDbGFzczogdGhpc307XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhbkNhc3RUbyh0eXBlOiBUeXBlKTogYm9vbGVhbiB7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhc3RUbyh2YWx1ZTogVmFsdWUsIHR5cGU6IFR5cGUpOiBWYWx1ZSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIGhhc0FuY2VzdG9yT3JJcyhhOiBLbGFzcyB8IFN0YXRpY0NsYXNzKSB7XHJcbiAgICAgICAgbGV0IGM6IEtsYXNzIHwgU3RhdGljQ2xhc3MgPSB0aGlzO1xyXG4gICAgICAgIHdoaWxlIChjICE9IG51bGwpIHtcclxuICAgICAgICAgICAgaWYgKGMgPT0gYSkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGMgPSBjLmJhc2VDbGFzcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEludGVyZmFjZSBleHRlbmRzIFR5cGUge1xyXG5cclxuICAgIC8vIGZvciBHZW5lcmljczpcclxuICAgIHR5cGVWYXJpYWJsZXM6IFR5cGVWYXJpYWJsZVtdID0gW107XHJcbiAgICBpc0dlbmVyaWNWYXJpYW50RnJvbTogSW50ZXJmYWNlO1xyXG4gICAgdHlwZVZhcmlhYmxlc1JlYWR5OiBib29sZWFuID0gdHJ1ZTtcclxuXHJcbiAgICBwdWJsaWMgbW9kdWxlOiBNb2R1bGU7XHJcblxyXG4gICAgcHVibGljIGV4dGVuZHM6IEludGVyZmFjZVtdID0gW107XHJcblxyXG4gICAgcHVibGljIG1ldGhvZHM6IE1ldGhvZFtdID0gW107XHJcbiAgICBwcml2YXRlIG1ldGhvZE1hcDogTWFwPHN0cmluZywgTWV0aG9kPiA9IG5ldyBNYXAoKTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihpZGVudGlmaWVyOiBzdHJpbmcsIG1vZHVsZTogTW9kdWxlLCBkb2N1bWVudGF0aW9uPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmRvY3VtZW50YXRpb24gPSBkb2N1bWVudGF0aW9uO1xyXG4gICAgICAgIHRoaXMuaWRlbnRpZmllciA9IGlkZW50aWZpZXI7XHJcbiAgICAgICAgdGhpcy5tb2R1bGUgPSBtb2R1bGU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Tm9uR2VuZXJpY0lkZW50aWZpZXIoKTogc3RyaW5nIHtcclxuICAgICAgICBsZXQgazogSW50ZXJmYWNlID0gdGhpcztcclxuICAgICAgICB3aGlsZSAoay5pc0dlbmVyaWNWYXJpYW50RnJvbSAhPSBudWxsKSBrID0gay5pc0dlbmVyaWNWYXJpYW50RnJvbTtcclxuICAgICAgICByZXR1cm4gay5pZGVudGlmaWVyO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFRoaXNPckV4dGVuZGVkSW50ZXJmYWNlKGlkZW50aWZpZXI6IFN0cmluZyl7XHJcbiAgICAgICAgaWYodGhpcy5nZXROb25HZW5lcmljSWRlbnRpZmllcigpID09IGlkZW50aWZpZXIpIHJldHVybiB0aGlzO1xyXG4gICAgICAgIGZvcihsZXQgaWYxIG9mIHRoaXMuZXh0ZW5kcyl7XHJcbiAgICAgICAgICAgIGxldCBpZjIgPSBpZjEuZ2V0VGhpc09yRXh0ZW5kZWRJbnRlcmZhY2UoaWRlbnRpZmllcik7XHJcbiAgICAgICAgICAgIGlmKGlmMiAhPSBudWxsKSByZXR1cm4gaWYyO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBzdGF0aWMgY291bnQ6IG51bWJlciA9IDA7XHJcbiAgICBjbG9uZSgpOiBJbnRlcmZhY2Uge1xyXG4gICAgICAgIC8vIEludGVyZmFjZS5jb3VudCsrO1xyXG4gICAgICAgIGxldCBuZXdJbnRlcmZhY2U6IEludGVyZmFjZSA9IE9iamVjdC5jcmVhdGUodGhpcyk7XHJcblxyXG4gICAgICAgIG5ld0ludGVyZmFjZS51c2FnZVBvc2l0aW9ucyA9IG5ldyBNYXAoKTtcclxuICAgICAgICBuZXdJbnRlcmZhY2UuaXNHZW5lcmljVmFyaWFudEZyb20gPSB0aGlzO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3SW50ZXJmYWNlO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyVXNhZ2VQb3NpdGlvbnMoKSB7XHJcbiAgICAgICAgc3VwZXIuY2xlYXJVc2FnZVBvc2l0aW9ucygpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBtIG9mIHRoaXMubWV0aG9kcykge1xyXG4gICAgICAgICAgICBtLmNsZWFyVXNhZ2VQb3NpdGlvbnMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBnZXRDb21wbGV0aW9uSXRlbXMobGVmdEJyYWNrZXRBbHJlYWR5VGhlcmU6IGJvb2xlYW4sIGlkZW50aWZpZXJBbmRCcmFja2V0QWZ0ZXJDdXJzb3I6IHN0cmluZyxcclxuICAgICAgICByYW5nZVRvUmVwbGFjZTogbW9uYWNvLklSYW5nZSk6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1bXSB7XHJcblxyXG4gICAgICAgIGxldCBpdGVtTGlzdDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbVtdID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IG1ldGhvZCBvZiB0aGlzLmdldE1ldGhvZHMoKSkge1xyXG4gICAgICAgICAgICBpdGVtTGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGxhYmVsOiBtZXRob2QuZ2V0Q29tcGxldGlvbkxhYmVsKCksXHJcbiAgICAgICAgICAgICAgICBmaWx0ZXJUZXh0OiBtZXRob2QuaWRlbnRpZmllcixcclxuICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLk1ldGhvZCxcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IG1ldGhvZC5nZXRDb21wbGV0aW9uU25pcHBldChsZWZ0QnJhY2tldEFscmVhZHlUaGVyZSksXHJcbiAgICAgICAgICAgICAgICByYW5nZTogcmFuZ2VUb1JlcGxhY2UsXHJcbiAgICAgICAgICAgICAgICBjb21tYW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwiZWRpdG9yLmFjdGlvbi50cmlnZ2VyUGFyYW1ldGVySGludHNcIixcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJzEyMycsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50YXRpb246IG1ldGhvZC5kb2N1bWVudGF0aW9uID09IG51bGwgPyB1bmRlZmluZWQgOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG1ldGhvZC5kb2N1bWVudGF0aW9uXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGl0ZW1MaXN0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZWJ1Z091dHB1dCh2YWx1ZTogVmFsdWUsIG1heExlbmd0aDogbnVtYmVyID0gNDApOiBzdHJpbmcge1xyXG4gICAgICAgIGlmICh2YWx1ZS52YWx1ZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcIm51bGxcIjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUudmFsdWUgaW5zdGFuY2VvZiBSdW50aW1lT2JqZWN0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUudmFsdWUuY2xhc3MuZGVidWdPdXRwdXQodmFsdWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiey4uLn1cIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZXF1YWxzKHR5cGU6IFR5cGUpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdHlwZSA9PSB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhZGRNZXRob2QobWV0aG9kOiBNZXRob2QpIHtcclxuICAgICAgICB0aGlzLm1ldGhvZHMucHVzaChtZXRob2QpO1xyXG4gICAgICAgIHRoaXMubWV0aG9kTWFwLnNldChtZXRob2Quc2lnbmF0dXJlLCBtZXRob2QpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRSZXN1bHRUeXBlKG9wZXJhdGlvbjogVG9rZW5UeXBlLCBzZWNvbmRPcGVyYW5kVHlwZT86IFR5cGUpOiBUeXBlIHtcclxuXHJcbiAgICAgICAgaWYgKG9wZXJhdGlvbiA9PSBUb2tlblR5cGUuZXF1YWwgfHwgb3BlcmF0aW9uID09IFRva2VuVHlwZS5ub3RFcXVhbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYm9vbGVhblByaW1pdGl2ZVR5cGVDb3B5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG9wZXJhdGlvbiA9PSBUb2tlblR5cGUua2V5d29yZEluc3RhbmNlb2YpIHtcclxuICAgICAgICAgICAgaWYgKHNlY29uZE9wZXJhbmRUeXBlIGluc3RhbmNlb2YgU3RhdGljQ2xhc3MgfHwgc2Vjb25kT3BlcmFuZFR5cGUgaW5zdGFuY2VvZiBJbnRlcmZhY2UpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBib29sZWFuUHJpbWl0aXZlVHlwZUNvcHk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29tcHV0ZShvcGVyYXRpb246IFRva2VuVHlwZSwgZmlyc3RPcGVyYW5kOiBWYWx1ZSwgc2Vjb25kT3BlcmFuZD86IFZhbHVlKSB7XHJcblxyXG4gICAgICAgIGlmIChvcGVyYXRpb24gPT0gVG9rZW5UeXBlLmVxdWFsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmaXJzdE9wZXJhbmQudmFsdWUgPT0gc2Vjb25kT3BlcmFuZC52YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChvcGVyYXRpb24gPT0gVG9rZW5UeXBlLm5vdEVxdWFsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmaXJzdE9wZXJhbmQudmFsdWUgIT0gc2Vjb25kT3BlcmFuZC52YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJldHVybnMgYWxsIG1ldGhvZHMgb2YgdGhpcyBpbnRlcmZhY2VcclxuICAgICAqIEBwYXJhbSBpc1N0YXRpYyBpcyBub3QgdXNlZCBpbiBpbnRlcmZhY2VzXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXRNZXRob2RzKCk6IE1ldGhvZFtdIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWV0aG9kcztcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldE1ldGhvZChpZGVudGlmaWVyOiBzdHJpbmcsIHBhcmFtZXRlcmxpc3Q6IFBhcmFtZXRlcmxpc3QpOiBNZXRob2Qge1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5tZXRob2RNYXAuZ2V0KGlkZW50aWZpZXIgKyBwYXJhbWV0ZXJsaXN0LmlkKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNhbkNhc3RUbyh0eXBlOiBUeXBlKTogYm9vbGVhbiB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlIGluc3RhbmNlb2YgSW50ZXJmYWNlKSB7XHJcbiAgICAgICAgICAgIGxldCBub25HZW5lcmljQ2FzdGFibGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgaWYgKHR5cGUuZ2V0Tm9uR2VuZXJpY0lkZW50aWZpZXIoKSA9PSB0aGlzLmdldE5vbkdlbmVyaWNJZGVudGlmaWVyKCkpIHtcclxuICAgICAgICAgICAgICAgIG5vbkdlbmVyaWNDYXN0YWJsZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50eXBlVmFyaWFibGVzLmxlbmd0aCA9PSAwKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB0eXBlMiA9IDxJbnRlcmZhY2U+dHlwZTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnR5cGVWYXJpYWJsZXMubGVuZ3RoICE9IHR5cGUyLnR5cGVWYXJpYWJsZXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudHlwZVZhcmlhYmxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB0diA9IHRoaXMudHlwZVZhcmlhYmxlc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdHZPdGhlciA9IHR5cGUyLnR5cGVWYXJpYWJsZXNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0dk90aGVyLnR5cGUuY2FuQ2FzdFRvKHR2LnR5cGUpKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB0eXBlMSBvZiB0aGlzLmV4dGVuZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZTEuY2FuQ2FzdFRvKHR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgaW5zdGFuY2VvZiBLbGFzcyAmJiB0eXBlLmdldE5vbkdlbmVyaWNJZGVudGlmaWVyKCkgPT0gXCJPYmplY3RcIikge1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyByZXR1cm4gKHR5cGUgaW5zdGFuY2VvZiBLbGFzcykgfHwgKHR5cGUgaW5zdGFuY2VvZiBJbnRlcmZhY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjYXN0VG8odmFsdWU6IFZhbHVlLCB0eXBlOiBUeXBlKTogVmFsdWUge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZ2V0TWV0aG9kc1RoYXRGaXRXaXRoQ2FzdGluZyhpZGVudGlmaWVyOiBzdHJpbmcsIHBhcmFtZXRlclR5cGVzOiBUeXBlW10sIHNlYXJjaENvbnN0cnVjdG9yOiBib29sZWFuKTogeyBlcnJvcjogc3RyaW5nLCBtZXRob2RMaXN0OiBNZXRob2RbXSB9IHtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZpbmRTdWl0YWJsZU1ldGhvZHModGhpcy5nZXRNZXRob2RzKCksIGlkZW50aWZpZXIsIHBhcmFtZXRlclR5cGVzLCB0aGlzLmlkZW50aWZpZXIsIHNlYXJjaENvbnN0cnVjdG9yKTtcclxuXHJcbiAgICB9XHJcblxyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gZmluZFN1aXRhYmxlTWV0aG9kcyhtZXRob2RMaXN0OiBNZXRob2RbXSwgaWRlbnRpZmllcjogc3RyaW5nLCBwYXJhbWV0ZXJUeXBlczogVHlwZVtdLFxyXG4gICAgY2xhc3NJZGVudGlmaWVyOiBzdHJpbmcsXHJcbiAgICBzZWFyY2hDb25zdHJ1Y3RvcjogYm9vbGVhbik6IHsgZXJyb3I6IHN0cmluZywgbWV0aG9kTGlzdDogTWV0aG9kW10gfSB7XHJcblxyXG4gICAgbGV0IHN1aXRhYmxlTWV0aG9kczogTWV0aG9kW10gPSBbXTtcclxuICAgIGxldCBob3dNYW55Q2FzdGluZ3NNYXg6IG51bWJlciA9IDEwMDAwO1xyXG4gICAgbGV0IGVycm9yID0gbnVsbDtcclxuXHJcbiAgICBsZXQgb25lV2l0aENvcnJlY3RJZGVudGlmaWVyRm91bmQgPSBmYWxzZTtcclxuXHJcbiAgICBmb3IgKGxldCBtIG9mIG1ldGhvZExpc3QpIHtcclxuXHJcbiAgICAgICAgbGV0IGhvd01hbnlDYXN0aW5ncyA9IDA7XHJcbiAgICAgICAgaWYgKG0uaWRlbnRpZmllciA9PSBpZGVudGlmaWVyIHx8IG0uaXNDb25zdHJ1Y3RvciAmJiBzZWFyY2hDb25zdHJ1Y3Rvcikge1xyXG5cclxuICAgICAgICAgICAgb25lV2l0aENvcnJlY3RJZGVudGlmaWVyRm91bmQgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgbGV0IGlzRWxsaXBzaXMgPSBtLmhhc0VsbGlwc2lzKCk7XHJcbiAgICAgICAgICAgIGlmIChtLmdldFBhcmFtZXRlckNvdW50KCkgPT0gcGFyYW1ldGVyVHlwZXMubGVuZ3RoIHx8IChpc0VsbGlwc2lzICYmIG0uZ2V0UGFyYW1ldGVyQ291bnQoKSA8PSBwYXJhbWV0ZXJUeXBlcy5sZW5ndGgpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHN1aXRzID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgaSA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG0uZ2V0UGFyYW1ldGVyQ291bnQoKSAtIChpc0VsbGlwc2lzID8gMSA6IDApOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbVBhcmFtZXRlclR5cGUgPSBtLmdldFBhcmFtZXRlclR5cGUoaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGdpdmVuVHlwZSA9IHBhcmFtZXRlclR5cGVzW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ2l2ZW5UeXBlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VpdHMgPSBmYWxzZTsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAobVBhcmFtZXRlclR5cGUgPT0gZ2l2ZW5UeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdpdmVuVHlwZS5jYW5DYXN0VG8obVBhcmFtZXRlclR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvd01hbnlDYXN0aW5ncysrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHN1aXRzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRWxsaXBzaXMhXHJcbiAgICAgICAgICAgICAgICBpZihzdWl0cyAmJiBpc0VsbGlwc2lzKXtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbVBhcmFtZXRlckVsbGlwc2lzID0gbS5nZXRQYXJhbWV0ZXIoaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1QYXJhbWV0ZXJUeXBlRWxsaXNwc2lzID0gKDxBcnJheVR5cGU+bVBhcmFtZXRlckVsbGlwc2lzLnR5cGUpLmFycmF5T2ZUeXBlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSBpOyBqIDwgcGFyYW1ldGVyVHlwZXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBnaXZlblR5cGUgPSBwYXJhbWV0ZXJUeXBlc1tpXTtcclxuICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnaXZlblR5cGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1aXRzID0gZmFsc2U7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1QYXJhbWV0ZXJUeXBlRWxsaXNwc2lzID09IGdpdmVuVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdpdmVuVHlwZS5jYW5DYXN0VG8obVBhcmFtZXRlclR5cGVFbGxpc3BzaXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaG93TWFueUNhc3RpbmdzKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWl0cyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc3VpdHMgJiYgaG93TWFueUNhc3RpbmdzIDw9IGhvd01hbnlDYXN0aW5nc01heCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChob3dNYW55Q2FzdGluZ3MgPCBob3dNYW55Q2FzdGluZ3NNYXgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VpdGFibGVNZXRob2RzID0gW107XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHN1aXRhYmxlTWV0aG9kcy5wdXNoKG0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGhvd01hbnlDYXN0aW5nc01heCA9IGhvd01hbnlDYXN0aW5ncztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGlmIChzdWl0YWJsZU1ldGhvZHMubGVuZ3RoID09IDApIHtcclxuXHJcbiAgICAgICAgaWYgKG9uZVdpdGhDb3JyZWN0SWRlbnRpZmllckZvdW5kKSB7XHJcbiAgICAgICAgICAgIGlmKHBhcmFtZXRlclR5cGVzLmxlbmd0aCA9PSAwKXtcclxuICAgICAgICAgICAgICAgIGVycm9yID0gc2VhcmNoQ29uc3RydWN0b3IgPyBcIkVzIGdpYnQga2VpbmVuIHBhcmFtZXRlcmxvc2VuIEtvbnN0cnVrdG9yIGRlciBLbGFzc2UgXCIgKyBjbGFzc0lkZW50aWZpZXIgOiBcIkRpZSB2b3JoYW5kZW5lbiBNZXRob2RlbiBtaXQgZGVtIEJlemVpY2huZXIgXCIgKyBpZGVudGlmaWVyICsgXCIgaGFiZW4gYWxsZSBtaW5kZXN0ZW5zIGVpbmVuIFBhcmFtZXRlci4gSGllciB3aXJkIGFiZXIga2VpbiBQYXJhbWV0ZXJ3ZXJ0IMO8YmVyZ2ViZW4uXCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdHlwZVN0cmluZyA9IHBhcmFtZXRlclR5cGVzLm1hcCh0eXBlID0+IHR5cGU/LmlkZW50aWZpZXIpLmpvaW4oXCIsIFwiKTtcclxuICAgICAgICAgICAgICAgIGVycm9yID0gc2VhcmNoQ29uc3RydWN0b3IgPyBgRGllIFBhcmFtZXRlcnR5cGVuICgke3R5cGVTdHJpbmd9KSBwYXNzZW4genUga2VpbmVtIEtvbnN0cnVrdG9yIGRlciBLbGFzc2UgJHtjbGFzc0lkZW50aWZpZXJ9YCA6IGBEaWUgUGFyYW1ldGVydHlwZW4gKCR7dHlwZVN0cmluZ30pIHBhc3NlbiB6dSBrZWluZXIgZGVyIHZvcmhhbmRlbmVuIE1ldGhvZGVuIG1pdCBkZW0gQmV6ZWljaG5lciAke2lkZW50aWZpZXJ9LmA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBlcnJvciA9IFwiRGVyIFR5cCBcIiArIGNsYXNzSWRlbnRpZmllciArIFwiIGJlc2l0enQga2VpbmUgTWV0aG9kZSBtaXQgZGVtIEJlemVpY2huZXIgXCIgKyBpZGVudGlmaWVyICsgXCIuXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBpZiAoc3VpdGFibGVNZXRob2RzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICBzdWl0YWJsZU1ldGhvZHMgPSBzdWl0YWJsZU1ldGhvZHMuc2xpY2UoMCwgMSk7XHJcbiAgICAgICAgLy8gZXJyb3IgPSBcIlp1IGRlbiBnZWdlYmVuZW4gUGFyYW1ldGVybiBoYXQgZGVyIFR5cCBcIiArIGNsYXNzSWRlbnRpZmllciArIFwiIG1laHJlcmUgcGFzc2VuZGUgTWV0aG9kZW4uXCI7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICAgICAgbWV0aG9kTGlzdDogc3VpdGFibGVNZXRob2RzXHJcbiAgICB9O1xyXG5cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFZpc2liaWxpdHlVcFRvKG9iamVjdFR5cGU6IEtsYXNzIHwgU3RhdGljQ2xhc3MsIGN1cnJlbnRDbGFzc0NvbnRleHQ6IEtsYXNzIHwgU3RhdGljQ2xhc3MpOiBWaXNpYmlsaXR5IHtcclxuXHJcbiAgICBpZiAoY3VycmVudENsYXNzQ29udGV4dCA9PSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuIFZpc2liaWxpdHkucHVibGljO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvYmplY3RUeXBlIGluc3RhbmNlb2YgU3RhdGljQ2xhc3MpIG9iamVjdFR5cGUgPSBvYmplY3RUeXBlLktsYXNzO1xyXG4gICAgaWYgKGN1cnJlbnRDbGFzc0NvbnRleHQgaW5zdGFuY2VvZiBTdGF0aWNDbGFzcykgY3VycmVudENsYXNzQ29udGV4dCA9IGN1cnJlbnRDbGFzc0NvbnRleHQuS2xhc3M7XHJcblxyXG4gICAgaWYgKG9iamVjdFR5cGUgPT0gY3VycmVudENsYXNzQ29udGV4dCkge1xyXG4gICAgICAgIHJldHVybiBWaXNpYmlsaXR5LnByaXZhdGU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGN1cnJlbnRDbGFzc0NvbnRleHQuaGFzQW5jZXN0b3JPcklzKG9iamVjdFR5cGUpKSB7XHJcbiAgICAgICAgcmV0dXJuIFZpc2liaWxpdHkucHJvdGVjdGVkO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBWaXNpYmlsaXR5LnB1YmxpYztcclxuXHJcbn1cclxuXHJcbiJdfQ==