export class Type {
    constructor() {
        this.onlyFirstPass = false;
        this.usagePositions = new Map();
        this.documentation = "";
    }
    toTokenType() {
        return null;
    }
    ;
    clearUsagePositions() {
        this.usagePositions = new Map();
    }
}
export class PrimitiveType extends Type {
    constructor() {
        super(...arguments);
        this.initialValue = null;
        this.description = "";
    }
    equals(type) {
        return type == this;
    }
    getResultType(operation, secondOperandType) {
        let opTypeMap = this.operationTable[operation];
        if (opTypeMap == null) {
            return null; // Operation not possible
        }
        if (secondOperandType != null) {
            return opTypeMap[secondOperandType.identifier];
        }
        return opTypeMap["none"];
    }
    canCastTo(type) {
        return this.canCastToMap[type.identifier] != null;
    }
    getCastInformation(type) {
        return this.canCastToMap[type.identifier];
    }
}
export class Attribute {
    constructor(name, type, updateValue, isStatic, visibility, isFinal, documentation) {
        this.onlyFirstPass = false;
        this.identifier = name;
        this.type = type;
        this.updateValue = updateValue;
        this.isStatic = isStatic;
        this.visibility = visibility;
        this.isFinal = isFinal;
        this.usagePositions = new Map();
        this.documentation = documentation;
    }
}
export class Method extends Type {
    constructor(name, parameterlist, returnType, invokeOrAST, isAbstract, isStatic, documentation, isConstructor = false) {
        super();
        this.onlyFirstPass = false;
        this.isConstructor = false;
        this.isVirtual = false; // true, if child class has method with same signature
        this.reserveStackForLocalVariables = 0;
        this.genericTypeMap = null;
        this.identifier = name;
        this.parameterlist = parameterlist;
        this.returnType = returnType;
        this.isAbstract = isAbstract;
        this.isStatic = isStatic;
        this.visibility = 0;
        this.documentation = documentation;
        this.isConstructor = isConstructor;
        if (invokeOrAST != null) {
            if (typeof invokeOrAST == "function") {
                this.invoke = invokeOrAST;
            }
            else {
                this.program = invokeOrAST;
                invokeOrAST.method = this;
            }
        }
        this.signature = name + parameterlist.id;
        for (let p of parameterlist.parameters) {
            if (p["isTypeVariable"] == true) {
                this.hasGenericTypes = true;
                break;
            }
        }
        this.hasGenericTypes = this.hasGenericTypes || (this.returnType != null && this.returnType["isTypeVariable"] == true);
    }
    implements(m) {
        if (this.identifier != m.identifier)
            return false;
        if (this.returnType == null || this.returnType.identifier == "void") {
            if (m.returnType != null && m.returnType.identifier != "void")
                return false;
        }
        else {
            if (m.returnType instanceof PrimitiveType) {
                if (m.returnType != this.returnType) {
                    return false;
                }
            }
            else if (!this.returnType.canCastTo(m.returnType)) {
                return false;
            }
        }
        if (this.parameterlist.parameters.length != m.parameterlist.parameters.length)
            return false;
        for (let i = 0; i < this.parameterlist.parameters.length; i++) {
            let myParameter = this.parameterlist.parameters[i];
            let mParameter = m.parameterlist.parameters[i];
            if (mParameter.type instanceof PrimitiveType) {
                if (mParameter.type != myParameter.type) {
                    return false;
                }
            }
            else if (!mParameter.type.canCastTo(myParameter.type))
                return false;
        }
        return true;
    }
    hasEllipsis() {
        if (this.parameterlist.parameters.length == 0)
            return false;
        return this.parameterlist.parameters[this.parameterlist.parameters.length - 1].isEllipsis;
    }
    getParameterType(index) {
        return this.parameterlist.parameters[index].type;
    }
    getParameter(index) {
        return this.parameterlist.parameters[index];
    }
    getReturnType() {
        return this.returnType;
    }
    getParameterCount() {
        return this.parameterlist.parameters.length;
    }
    getParameterList() {
        return this.parameterlist;
    }
    getSignatureWithReturnParameter() {
        if (this.returnType != null) {
            return this.returnType.identifier + " " + this.signature;
        }
        else {
            return "void " + this.signature;
        }
    }
    getCompletionLabel() {
        let label = "";
        if (this.returnType != null && this.returnType.identifier != "void") {
            label += getTypeIdentifier(this.returnType) + " ";
        }
        label += this.identifier + "(";
        let parameters = this.parameterlist.parameters;
        for (let i = 0; i < parameters.length; i++) {
            let p = parameters[i];
            if (p.isEllipsis) {
                let arrayType = p.type;
                label += getTypeIdentifier(arrayType.arrayOfType) + "... " + p.identifier;
            }
            else {
                label += getTypeIdentifier(p.type) + " " + p.identifier;
            }
            if (i < parameters.length - 1) {
                label += ", ";
            }
        }
        label += ")";
        return label;
    }
    getCompletionSnippet(leftBracketAlreadyThere) {
        if (leftBracketAlreadyThere)
            return this.identifier + "($0";
        let snippet = "";
        snippet += this.identifier + "(";
        let isVoidReturn = this.returnType == null || this.returnType.identifier == "void";
        let isVoidReturnDelta = isVoidReturn ? 1 : 0;
        let parameters = this.parameterlist.parameters;
        for (let i = 0; i < parameters.length; i++) {
            let p = parameters[i];
            snippet += "${" + ((i + 1) % (parameters.length + isVoidReturnDelta)) + ":" + p.identifier + "}";
            if (i < parameters.length - 1) {
                snippet += ", ";
            }
        }
        snippet += ")";
        if (this.returnType == null || this.returnType.identifier == "void") {
            snippet += ";$0";
        }
        return snippet;
    }
    debugOutput(value) {
        return "";
    }
    equals(type) {
        return type == this;
    }
    getResultType(operation, secondOperandType) {
        return null;
    }
    compute(operation, firstOperand, secondOperand) {
        return null;
    }
    canCastTo(type) {
        return false;
    }
    castTo(value, type) { return value; }
}
export class Parameterlist {
    constructor(parameters) {
        this.parameters = parameters;
        this.computeId();
    }
    computeId() {
        this.id = "(";
        let i = 0;
        while (i < this.parameters.length) {
            this.id += this.parameters[i].type.identifier;
            if (i < this.parameters.length - 1) {
                this.id += ", ";
            }
            i++;
        }
        this.id += ")";
    }
}
export function getTypeIdentifier(type) {
    var _a, _b;
    if (type["typeVariables"]) {
        if (type["typeVariables"].length > 0) {
            let s = (type["isTypeVariable"] ? (type.identifier + " extends " + ((_a = type["isGenericVariantFrom"]) === null || _a === void 0 ? void 0 : _a.identifier)) : type.identifier)
                + "<";
            s += type["typeVariables"].map(tv => getTypeIdentifier(tv.type)).join(", ");
            return s + ">";
        }
    }
    return type["isTypeVariable"] ? (type.identifier + " extends " + ((_b = type["isGenericVariantFrom"]) === null || _b === void 0 ? void 0 : _b.identifier)) : type.identifier;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L2NvbXBpbGVyL3R5cGVzL1R5cGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQW9CQSxNQUFNLE9BQWdCLElBQUk7SUFVdEI7UUFSTyxrQkFBYSxHQUFHLEtBQUssQ0FBQztRQUV0QixtQkFBYyxHQUFtQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBSTNDLGtCQUFhLEdBQVcsRUFBRSxDQUFDO0lBR2xDLENBQUM7SUFZTSxXQUFXO1FBQ2QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUFBLENBQUM7SUFJRixtQkFBbUI7UUFDZixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7SUFDcEMsQ0FBQztDQUVKO0FBRUQsTUFBTSxPQUFnQixhQUFjLFNBQVEsSUFBSTtJQUFoRDs7UUFFVyxpQkFBWSxHQUFRLElBQUksQ0FBQztRQUV6QixnQkFBVyxHQUFXLEVBQUUsQ0FBQztJQWtDcEMsQ0FBQztJQTVCVSxNQUFNLENBQUMsSUFBVTtRQUNwQixPQUFPLElBQUksSUFBSSxJQUFJLENBQUM7SUFDeEIsQ0FBQztJQUVNLGFBQWEsQ0FBQyxTQUFvQixFQUFFLGlCQUF3QjtRQUUvRCxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRS9DLElBQUksU0FBUyxJQUFJLElBQUksRUFBRTtZQUNuQixPQUFPLElBQUksQ0FBQyxDQUFDLHlCQUF5QjtTQUN6QztRQUVELElBQUksaUJBQWlCLElBQUksSUFBSSxFQUFFO1lBQzNCLE9BQU8sU0FBUyxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ2xEO1FBRUQsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFN0IsQ0FBQztJQUVNLFNBQVMsQ0FBQyxJQUFVO1FBQ3ZCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENB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QUksQ0FBQyxHQUFXLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxXQUFXLFVBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLDBDQUFFLFVBQVUsQ0FBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7a0JBQ3JJLEdBQUcsQ0FBQztZQUNILENBQUMsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9FLE9BQU8sQ0FBQyxHQUFHLEdBQUcsQ0FBQztTQUNsQjtLQUNKO0lBRUQsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLFdBQVcsVUFBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsMENBQUUsVUFBVSxDQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUNqSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUnVudGltZU9iamVjdCB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9SdW50aW1lT2JqZWN0LmpzXCI7XHJcbmltcG9ydCB7IFRleHRQb3NpdGlvbiwgVG9rZW5UeXBlIH0gZnJvbSBcIi4uL2xleGVyL1Rva2VuLmpzXCI7XHJcbmltcG9ydCB7IE1vZHVsZSB9IGZyb20gXCIuLi9wYXJzZXIvTW9kdWxlLmpzXCI7XHJcbmltcG9ydCB7IFByb2dyYW0gfSBmcm9tIFwiLi4vcGFyc2VyL1Byb2dyYW0uanNcIjtcclxuaW1wb3J0IHsgQXJyYXlUeXBlIH0gZnJvbSBcIi4vQXJyYXkuanNcIjtcclxuaW1wb3J0IHsgVmlzaWJpbGl0eSwgVHlwZVZhcmlhYmxlIH0gZnJvbSBcIi4vQ2xhc3MuanNcIjtcclxuXHJcbmV4cG9ydCB0eXBlIFVzYWdlUG9zaXRpb25zID0gTWFwPE1vZHVsZSwgVGV4dFBvc2l0aW9uW10+O1xyXG5cclxuZXhwb3J0IHR5cGUgVGV4dFBvc2l0aW9uV2l0aE1vZHVsZSA9IHtcclxuICAgIG1vZHVsZTogTW9kdWxlLFxyXG4gICAgcG9zaXRpb246IFRleHRQb3NpdGlvbixcclxuICAgIG1vbmFjb01vZGVsPzogbW9uYWNvLmVkaXRvci5JVGV4dE1vZGVsXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIENhc3RJbmZvcm1hdGlvbiA9IHtcclxuICAgIGF1dG9tYXRpYzogYm9vbGVhbixcclxuICAgIG5lZWRzU3RhdGVtZW50OiBib29sZWFuXHJcbn1cclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBUeXBlIHtcclxuXHJcbiAgICBwdWJsaWMgb25seUZpcnN0UGFzcyA9IGZhbHNlO1xyXG5cclxuICAgIHB1YmxpYyB1c2FnZVBvc2l0aW9uczogVXNhZ2VQb3NpdGlvbnMgPSBuZXcgTWFwKCk7XHJcbiAgICBwdWJsaWMgZGVjbGFyYXRpb246IFRleHRQb3NpdGlvbldpdGhNb2R1bGU7XHJcblxyXG4gICAgcHVibGljIGlkZW50aWZpZXI6IHN0cmluZztcclxuICAgIHB1YmxpYyBkb2N1bWVudGF0aW9uOiBzdHJpbmcgPSBcIlwiO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBhYnN0cmFjdCBnZXRSZXN1bHRUeXBlKG9wZXJhdGlvbjogVG9rZW5UeXBlLCBzZWNvbmRPcGVyYW5kVHlwZT86IFR5cGUpOiBUeXBlO1xyXG5cclxuICAgIHB1YmxpYyBhYnN0cmFjdCBjb21wdXRlKG9wZXJhdGlvbjogVG9rZW5UeXBlLCBmaXJzdE9wZXJhbmQ6IFZhbHVlLCBzZWNvbmRPcGVyYW5kPzogVmFsdWUpOiBhbnk7XHJcblxyXG4gICAgcHVibGljIGFic3RyYWN0IGNhbkNhc3RUbyh0eXBlOiBUeXBlKTogYm9vbGVhbjtcclxuXHJcbiAgICBwdWJsaWMgYWJzdHJhY3QgY2FzdFRvKHZhbHVlOiBWYWx1ZSwgdHlwZTogVHlwZSk6IFZhbHVlO1xyXG5cclxuICAgIHB1YmxpYyBhYnN0cmFjdCBlcXVhbHModHlwZTogVHlwZSk6IGJvb2xlYW47XHJcblxyXG4gICAgcHVibGljIHRvVG9rZW5UeXBlKCk6IFRva2VuVHlwZSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9O1xyXG5cclxuICAgIHB1YmxpYyBhYnN0cmFjdCBkZWJ1Z091dHB1dCh2YWx1ZTogVmFsdWUsIG1heExlbmd0aD86IG51bWJlcik6IHN0cmluZztcclxuXHJcbiAgICBjbGVhclVzYWdlUG9zaXRpb25zKCkge1xyXG4gICAgICAgIHRoaXMudXNhZ2VQb3NpdGlvbnMgPSBuZXcgTWFwKCk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUHJpbWl0aXZlVHlwZSBleHRlbmRzIFR5cGUge1xyXG5cclxuICAgIHB1YmxpYyBpbml0aWFsVmFsdWU6IGFueSA9IG51bGw7XHJcblxyXG4gICAgcHVibGljIGRlc2NyaXB0aW9uOiBzdHJpbmcgPSBcIlwiO1xyXG5cclxuICAgIHByb3RlY3RlZCBvcGVyYXRpb25UYWJsZTogeyBbb3BlcmF0aW9uOiBudW1iZXJdOiB7IFt0eXBlbmFtZTogc3RyaW5nXTogVHlwZSB9IH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgY2FuQ2FzdFRvTWFwOiB7IFt0eXBlOiBzdHJpbmddOiBDYXN0SW5mb3JtYXRpb24gfTtcclxuXHJcbiAgICBwdWJsaWMgZXF1YWxzKHR5cGU6IFR5cGUpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdHlwZSA9PSB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRSZXN1bHRUeXBlKG9wZXJhdGlvbjogVG9rZW5UeXBlLCBzZWNvbmRPcGVyYW5kVHlwZT86IFR5cGUpOiBUeXBlIHtcclxuXHJcbiAgICAgICAgbGV0IG9wVHlwZU1hcCA9IHRoaXMub3BlcmF0aW9uVGFibGVbb3BlcmF0aW9uXTtcclxuXHJcbiAgICAgICAgaWYgKG9wVHlwZU1hcCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyBPcGVyYXRpb24gbm90IHBvc3NpYmxlXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2Vjb25kT3BlcmFuZFR5cGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gb3BUeXBlTWFwW3NlY29uZE9wZXJhbmRUeXBlLmlkZW50aWZpZXJdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG9wVHlwZU1hcFtcIm5vbmVcIl07XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjYW5DYXN0VG8odHlwZTogVHlwZSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNhbkNhc3RUb01hcFt0eXBlLmlkZW50aWZpZXJdICE9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldENhc3RJbmZvcm1hdGlvbih0eXBlOiBUeXBlKTogQ2FzdEluZm9ybWF0aW9uIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jYW5DYXN0VG9NYXBbdHlwZS5pZGVudGlmaWVyXTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBBdHRyaWJ1dGUge1xyXG5cclxuICAgIG9ubHlGaXJzdFBhc3M6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICBpZGVudGlmaWVyOiBzdHJpbmc7XHJcblxyXG4gICAgaW5kZXg6IG51bWJlcjtcclxuXHJcbiAgICB0eXBlOiBUeXBlO1xyXG4gICAgaXNTdGF0aWM6IGJvb2xlYW47XHJcbiAgICBpc0ZpbmFsOiBib29sZWFuO1xyXG4gICAgaXNUcmFuc2llbnQ6IGJvb2xlYW47XHJcbiAgICB2aXNpYmlsaXR5OiBWaXNpYmlsaXR5O1xyXG4gICAgdXBkYXRlVmFsdWU6ICh2YWx1ZTogVmFsdWUpID0+IHZvaWQ7XHJcbiAgICB1c2FnZVBvc2l0aW9uczogVXNhZ2VQb3NpdGlvbnM7XHJcbiAgICBkZWNsYXJhdGlvbjogVGV4dFBvc2l0aW9uV2l0aE1vZHVsZTtcclxuICAgIGRvY3VtZW50YXRpb246IHN0cmluZztcclxuICAgIGFubm90YXRpb24/OiBzdHJpbmc7XHJcblxyXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCB0eXBlOiBUeXBlLCB1cGRhdGVWYWx1ZTogKHZhbHVlOiBWYWx1ZSkgPT4gdm9pZCxcclxuICAgICAgICBpc1N0YXRpYzogYm9vbGVhbiwgdmlzaWJpbGl0eTogVmlzaWJpbGl0eSwgaXNGaW5hbDogYm9vbGVhbiwgZG9jdW1lbnRhdGlvbj86IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuaWRlbnRpZmllciA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcclxuICAgICAgICB0aGlzLnVwZGF0ZVZhbHVlID0gdXBkYXRlVmFsdWU7XHJcbiAgICAgICAgdGhpcy5pc1N0YXRpYyA9IGlzU3RhdGljO1xyXG4gICAgICAgIHRoaXMudmlzaWJpbGl0eSA9IHZpc2liaWxpdHk7XHJcbiAgICAgICAgdGhpcy5pc0ZpbmFsID0gaXNGaW5hbDtcclxuICAgICAgICB0aGlzLnVzYWdlUG9zaXRpb25zID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIHRoaXMuZG9jdW1lbnRhdGlvbiA9IGRvY3VtZW50YXRpb247XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNZXRob2QgZXh0ZW5kcyBUeXBlIHtcclxuXHJcbiAgICBvbmx5Rmlyc3RQYXNzOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgdmlzaWJpbGl0eTogVmlzaWJpbGl0eTtcclxuXHJcbiAgICBpc0Fic3RyYWN0OiBib29sZWFuO1xyXG4gICAgaXNTdGF0aWM6IGJvb2xlYW47XHJcbiAgICBpc0NvbnN0cnVjdG9yOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBpc1ZpcnR1YWw6IGJvb2xlYW4gPSBmYWxzZTsgLy8gdHJ1ZSwgaWYgY2hpbGQgY2xhc3MgaGFzIG1ldGhvZCB3aXRoIHNhbWUgc2lnbmF0dXJlXHJcblxyXG4gICAgcGFyYW1ldGVybGlzdDogUGFyYW1ldGVybGlzdDtcclxuICAgIHJldHVyblR5cGU6IFR5cGU7XHJcbiAgICBhbm5vdGF0aW9uPzogc3RyaW5nO1xyXG5cclxuICAgIGludm9rZT86IChwYXJhbWV0ZXJzOiBWYWx1ZVtdKSA9PiBhbnk7ICAvLyBvbmx5IGZvciBzeXN0ZW0gZnVuY3Rpb25zXHJcbiAgICBwcm9ncmFtPzogUHJvZ3JhbTtcclxuXHJcbiAgICByZXNlcnZlU3RhY2tGb3JMb2NhbFZhcmlhYmxlczogbnVtYmVyID0gMDtcclxuXHJcbiAgICBoYXNHZW5lcmljVHlwZXM6IGJvb2xlYW47XHJcblxyXG4gICAgZ2VuZXJpY1R5cGVNYXA6IHsgW2lkZW50aWZpZXI6IHN0cmluZ106IFR5cGUgfSA9IG51bGw7XHJcblxyXG4gICAgcHVibGljIHNpZ25hdHVyZTogc3RyaW5nO1xyXG5cclxuICAgIGltcGxlbWVudHMobTogTWV0aG9kKTogYm9vbGVhbiB7XHJcbiAgICAgICAgaWYodGhpcy5pZGVudGlmaWVyICE9IG0uaWRlbnRpZmllcikgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGlmKHRoaXMucmV0dXJuVHlwZSA9PSBudWxsIHx8IHRoaXMucmV0dXJuVHlwZS5pZGVudGlmaWVyID09IFwidm9pZFwiKXtcclxuICAgICAgICAgICAgaWYobS5yZXR1cm5UeXBlICE9IG51bGwgJiYgbS5yZXR1cm5UeXBlLmlkZW50aWZpZXIgIT0gXCJ2b2lkXCIpIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgaWYobS5yZXR1cm5UeXBlIGluc3RhbmNlb2YgUHJpbWl0aXZlVHlwZSl7XHJcbiAgICAgICAgICAgICAgICBpZihtLnJldHVyblR5cGUgIT0gdGhpcy5yZXR1cm5UeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYoIXRoaXMucmV0dXJuVHlwZS5jYW5DYXN0VG8obS5yZXR1cm5UeXBlKSl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHRoaXMucGFyYW1ldGVybGlzdC5wYXJhbWV0ZXJzLmxlbmd0aCAhPSBtLnBhcmFtZXRlcmxpc3QucGFyYW1ldGVycy5sZW5ndGgpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRoaXMucGFyYW1ldGVybGlzdC5wYXJhbWV0ZXJzLmxlbmd0aDsgaSsrKXtcclxuICAgICAgICAgICAgbGV0IG15UGFyYW1ldGVyID0gdGhpcy5wYXJhbWV0ZXJsaXN0LnBhcmFtZXRlcnNbaV07XHJcbiAgICAgICAgICAgIGxldCBtUGFyYW1ldGVyID0gbS5wYXJhbWV0ZXJsaXN0LnBhcmFtZXRlcnNbaV07XHJcblxyXG4gICAgICAgICAgICBpZihtUGFyYW1ldGVyLnR5cGUgaW5zdGFuY2VvZiBQcmltaXRpdmVUeXBlKXtcclxuICAgICAgICAgICAgICAgIGlmKG1QYXJhbWV0ZXIudHlwZSAhPSBteVBhcmFtZXRlci50eXBlKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZighbVBhcmFtZXRlci50eXBlLmNhbkNhc3RUbyhteVBhcmFtZXRlci50eXBlKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgaGFzRWxsaXBzaXMoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgaWYodGhpcy5wYXJhbWV0ZXJsaXN0LnBhcmFtZXRlcnMubGVuZ3RoID09IDApIHJldHVybiBmYWxzZTtcclxuICAgICAgICByZXR1cm4gdGhpcy5wYXJhbWV0ZXJsaXN0LnBhcmFtZXRlcnNbdGhpcy5wYXJhbWV0ZXJsaXN0LnBhcmFtZXRlcnMubGVuZ3RoIC0gMV0uaXNFbGxpcHNpcztcclxuICAgIH1cclxuXHJcblxyXG4gICAgZ2V0UGFyYW1ldGVyVHlwZShpbmRleDogbnVtYmVyKTogVHlwZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyYW1ldGVybGlzdC5wYXJhbWV0ZXJzW2luZGV4XS50eXBlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFBhcmFtZXRlcihpbmRleDogbnVtYmVyKTogVmFyaWFibGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBhcmFtZXRlcmxpc3QucGFyYW1ldGVyc1tpbmRleF07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0UmV0dXJuVHlwZSgpOiBUeXBlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXR1cm5UeXBlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFBhcmFtZXRlckNvdW50KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBhcmFtZXRlcmxpc3QucGFyYW1ldGVycy5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0UGFyYW1ldGVyTGlzdCgpOiBQYXJhbWV0ZXJsaXN0IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wYXJhbWV0ZXJsaXN0O1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBwYXJhbWV0ZXJsaXN0OiBQYXJhbWV0ZXJsaXN0LCByZXR1cm5UeXBlOiBUeXBlLFxyXG4gICAgICAgIGludm9rZU9yQVNUOiAoKHBhcmFtZXRlcnM6IFZhbHVlW10pID0+IGFueSkgfCBQcm9ncmFtLFxyXG4gICAgICAgIGlzQWJzdHJhY3Q6IGJvb2xlYW4sIGlzU3RhdGljOiBib29sZWFuLCBkb2N1bWVudGF0aW9uPzogc3RyaW5nLCBpc0NvbnN0cnVjdG9yOiBib29sZWFuID0gZmFsc2UpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuaWRlbnRpZmllciA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJsaXN0ID0gcGFyYW1ldGVybGlzdDtcclxuICAgICAgICB0aGlzLnJldHVyblR5cGUgPSByZXR1cm5UeXBlO1xyXG4gICAgICAgIHRoaXMuaXNBYnN0cmFjdCA9IGlzQWJzdHJhY3Q7XHJcbiAgICAgICAgdGhpcy5pc1N0YXRpYyA9IGlzU3RhdGljO1xyXG4gICAgICAgIHRoaXMudmlzaWJpbGl0eSA9IDA7XHJcbiAgICAgICAgdGhpcy5kb2N1bWVudGF0aW9uID0gZG9jdW1lbnRhdGlvbjtcclxuICAgICAgICB0aGlzLmlzQ29uc3RydWN0b3IgPSBpc0NvbnN0cnVjdG9yO1xyXG5cclxuICAgICAgICBpZiAoaW52b2tlT3JBU1QgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGludm9rZU9yQVNUID09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnZva2UgPSBpbnZva2VPckFTVDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvZ3JhbSA9IGludm9rZU9yQVNUO1xyXG4gICAgICAgICAgICAgICAgaW52b2tlT3JBU1QubWV0aG9kID0gdGhpcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zaWduYXR1cmUgPSBuYW1lICsgcGFyYW1ldGVybGlzdC5pZDtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgcCBvZiBwYXJhbWV0ZXJsaXN0LnBhcmFtZXRlcnMpIHtcclxuICAgICAgICAgICAgaWYgKHBbXCJpc1R5cGVWYXJpYWJsZVwiXSA9PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0dlbmVyaWNUeXBlcyA9IHRydWU7IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmhhc0dlbmVyaWNUeXBlcyA9IHRoaXMuaGFzR2VuZXJpY1R5cGVzIHx8ICh0aGlzLnJldHVyblR5cGUgIT0gbnVsbCAmJiB0aGlzLnJldHVyblR5cGVbXCJpc1R5cGVWYXJpYWJsZVwiXSA9PSB0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRTaWduYXR1cmVXaXRoUmV0dXJuUGFyYW1ldGVyKCl7XHJcbiAgICAgICAgaWYodGhpcy5yZXR1cm5UeXBlICE9IG51bGwpe1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXR1cm5UeXBlLmlkZW50aWZpZXIgKyBcIiBcIiArIHRoaXMuc2lnbmF0dXJlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcInZvaWQgXCIgKyB0aGlzLnNpZ25hdHVyZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q29tcGxldGlvbkxhYmVsKCkge1xyXG5cclxuICAgICAgICBsZXQgbGFiZWwgPSBcIlwiO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5yZXR1cm5UeXBlICE9IG51bGwgJiYgdGhpcy5yZXR1cm5UeXBlLmlkZW50aWZpZXIgIT0gXCJ2b2lkXCIpIHtcclxuICAgICAgICAgICAgbGFiZWwgKz0gZ2V0VHlwZUlkZW50aWZpZXIodGhpcy5yZXR1cm5UeXBlKSArIFwiIFwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGFiZWwgKz0gdGhpcy5pZGVudGlmaWVyICsgXCIoXCI7XHJcblxyXG4gICAgICAgIGxldCBwYXJhbWV0ZXJzID0gdGhpcy5wYXJhbWV0ZXJsaXN0LnBhcmFtZXRlcnM7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJhbWV0ZXJzLmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgcCA9IHBhcmFtZXRlcnNbaV07XHJcbiAgICAgICAgICAgIGlmKHAuaXNFbGxpcHNpcyl7XHJcbiAgICAgICAgICAgICAgICBsZXQgYXJyYXlUeXBlOiBBcnJheVR5cGUgPSA8YW55PnAudHlwZTtcclxuICAgICAgICAgICAgICAgIGxhYmVsICs9IGdldFR5cGVJZGVudGlmaWVyKGFycmF5VHlwZS5hcnJheU9mVHlwZSkgKyBcIi4uLiBcIiArIHAuaWRlbnRpZmllcjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxhYmVsICs9IGdldFR5cGVJZGVudGlmaWVyKHAudHlwZSkgKyBcIiBcIiArIHAuaWRlbnRpZmllcjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGkgPCBwYXJhbWV0ZXJzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgIGxhYmVsICs9IFwiLCBcIjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxhYmVsICs9IFwiKVwiO1xyXG5cclxuICAgICAgICByZXR1cm4gbGFiZWw7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGdldENvbXBsZXRpb25TbmlwcGV0KGxlZnRCcmFja2V0QWxyZWFkeVRoZXJlOiBib29sZWFuKSB7XHJcblxyXG4gICAgICAgIGlmIChsZWZ0QnJhY2tldEFscmVhZHlUaGVyZSkgcmV0dXJuIHRoaXMuaWRlbnRpZmllciArIFwiKCQwXCI7XHJcblxyXG4gICAgICAgIGxldCBzbmlwcGV0ID0gXCJcIjtcclxuXHJcbiAgICAgICAgc25pcHBldCArPSB0aGlzLmlkZW50aWZpZXIgKyBcIihcIjtcclxuXHJcbiAgICAgICAgbGV0IGlzVm9pZFJldHVybiA9IHRoaXMucmV0dXJuVHlwZSA9PSBudWxsIHx8IHRoaXMucmV0dXJuVHlwZS5pZGVudGlmaWVyID09IFwidm9pZFwiO1xyXG4gICAgICAgIGxldCBpc1ZvaWRSZXR1cm5EZWx0YSA9IGlzVm9pZFJldHVybiA/IDEgOiAwO1xyXG5cclxuICAgICAgICBsZXQgcGFyYW1ldGVycyA9IHRoaXMucGFyYW1ldGVybGlzdC5wYXJhbWV0ZXJzO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyYW1ldGVycy5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgbGV0IHAgPSBwYXJhbWV0ZXJzW2ldO1xyXG4gICAgICAgICAgICBzbmlwcGV0ICs9IFwiJHtcIiArICgoaSArIDEpICUgKHBhcmFtZXRlcnMubGVuZ3RoICsgaXNWb2lkUmV0dXJuRGVsdGEpKSArIFwiOlwiICsgcC5pZGVudGlmaWVyICsgXCJ9XCI7XHJcblxyXG4gICAgICAgICAgICBpZiAoaSA8IHBhcmFtZXRlcnMubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgc25pcHBldCArPSBcIiwgXCI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzbmlwcGV0ICs9IFwiKVwiO1xyXG5cclxuICAgICAgICBpZih0aGlzLnJldHVyblR5cGUgPT0gbnVsbCB8fCB0aGlzLnJldHVyblR5cGUuaWRlbnRpZmllciA9PSBcInZvaWRcIil7XHJcbiAgICAgICAgICAgIHNuaXBwZXQgKz0gXCI7JDBcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzbmlwcGV0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZWJ1Z091dHB1dCh2YWx1ZTogVmFsdWUpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBlcXVhbHModHlwZTogVHlwZSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0eXBlID09IHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldFJlc3VsdFR5cGUob3BlcmF0aW9uOiBUb2tlblR5cGUsIHNlY29uZE9wZXJhbmRUeXBlPzogVHlwZSk6IFR5cGUge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjb21wdXRlKG9wZXJhdGlvbjogVG9rZW5UeXBlLCBmaXJzdE9wZXJhbmQ6IFZhbHVlLCBzZWNvbmRPcGVyYW5kPzogVmFsdWUpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjYW5DYXN0VG8odHlwZTogVHlwZSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FzdFRvKHZhbHVlOiBWYWx1ZSwgdHlwZTogVHlwZSk6IFZhbHVlIHsgcmV0dXJuIHZhbHVlIH1cclxuXHJcblxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUGFyYW1ldGVybGlzdCB7XHJcblxyXG4gICAgaWQ6IHN0cmluZztcclxuXHJcbiAgICBwYXJhbWV0ZXJzOiBWYXJpYWJsZVtdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHBhcmFtZXRlcnM6IFZhcmlhYmxlW10pIHtcclxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzO1xyXG4gICAgICAgIHRoaXMuY29tcHV0ZUlkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29tcHV0ZUlkKCkge1xyXG4gICAgICAgIHRoaXMuaWQgPSBcIihcIjtcclxuICAgICAgICBsZXQgaSA9IDA7XHJcbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLnBhcmFtZXRlcnMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaWQgKz0gdGhpcy5wYXJhbWV0ZXJzW2ldLnR5cGUuaWRlbnRpZmllcjtcclxuICAgICAgICAgICAgaWYgKGkgPCB0aGlzLnBhcmFtZXRlcnMubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pZCArPSBcIiwgXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmlkICs9IFwiKVwiO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBWYXJpYWJsZSA9IHtcclxuICAgIGlkZW50aWZpZXI6IHN0cmluZyxcclxuICAgIHR5cGU6IFR5cGUsXHJcbiAgICBzdGFja1Bvcz86IG51bWJlcjtcclxuICAgIHVzYWdlUG9zaXRpb25zOiBVc2FnZVBvc2l0aW9ucyxcclxuICAgIGRlY2xhcmF0aW9uOiBUZXh0UG9zaXRpb25XaXRoTW9kdWxlLFxyXG4gICAgaXNGaW5hbDogYm9vbGVhbixcclxuICAgIGlzRWxsaXBzaXM/OiBib29sZWFuLFxyXG4gICAgdmFsdWU/OiBWYWx1ZSAvLyBvbmx5IGZvciB2YXJpYWJsZXMgb24gaGVhcCxcclxuICAgIGRlY2xhcmF0aW9uRXJyb3I/OiBhbnksICAgICAvLyBpZiB2LmRlY2xhcmF0aW9uRXJyb3IgIT0gbnVsbCB0aGVuIHZhcmlhYmxlIGhhcyBiZWVuIHVzZWQgYmVmb3JlIGluaXRpYWxpemF0aW9uLlxyXG4gICAgdXNlZEJlZm9yZUluaXRpYWxpemF0aW9uPzogYm9vbGVhbixcclxuICAgIGluaXRpYWxpemVkPzogYm9vbGVhblxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBIZWFwID0geyBbaWRlbnRpZmllcjogc3RyaW5nXTogVmFyaWFibGUgfTtcclxuXHJcbmV4cG9ydCB0eXBlIFZhbHVlID0ge1xyXG4gICAgdHlwZTogVHlwZTtcclxuICAgIHZhbHVlOiBhbnk7XHJcbiAgICB1cGRhdGVWYWx1ZT86ICh2YWx1ZTogVmFsdWUpID0+IHZvaWQ7XHJcbiAgICBvYmplY3Q/OiBSdW50aW1lT2JqZWN0O1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFR5cGVJZGVudGlmaWVyKHR5cGU6IFR5cGUpOiBzdHJpbmcge1xyXG4gICAgaWYodHlwZVtcInR5cGVWYXJpYWJsZXNcIl0pe1xyXG4gICAgICAgIGlmKHR5cGVbXCJ0eXBlVmFyaWFibGVzXCJdLmxlbmd0aCA+IDApe1xyXG4gICAgICAgICAgICBsZXQgczogc3RyaW5nID0gKHR5cGVbXCJpc1R5cGVWYXJpYWJsZVwiXSA/ICh0eXBlLmlkZW50aWZpZXIgKyBcIiBleHRlbmRzIFwiICsgdHlwZVtcImlzR2VuZXJpY1ZhcmlhbnRGcm9tXCJdPy5pZGVudGlmaWVyKSA6IHR5cGUuaWRlbnRpZmllcikgXHJcbiAgICAgICAgICAgICsgXCI8XCI7XHJcbiAgICAgICAgICAgICAgIHMgKz0gdHlwZVtcInR5cGVWYXJpYWJsZXNcIl0ubWFwKHR2ID0+IGdldFR5cGVJZGVudGlmaWVyKHR2LnR5cGUpKS5qb2luKFwiLCBcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBzICsgXCI+XCI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0eXBlW1wiaXNUeXBlVmFyaWFibGVcIl0gPyAodHlwZS5pZGVudGlmaWVyICsgXCIgZXh0ZW5kcyBcIiArIHR5cGVbXCJpc0dlbmVyaWNWYXJpYW50RnJvbVwiXT8uaWRlbnRpZmllcikgOiB0eXBlLmlkZW50aWZpZXI7XHJcbn1cclxuIl19