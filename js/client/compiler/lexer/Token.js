export var TokenType;
(function (TokenType) {
    TokenType[TokenType["identifier"] = 0] = "identifier";
    // constants
    TokenType[TokenType["integerConstant"] = 1] = "integerConstant";
    TokenType[TokenType["floatingPointConstant"] = 2] = "floatingPointConstant";
    TokenType[TokenType["booleanConstant"] = 3] = "booleanConstant";
    TokenType[TokenType["stringConstant"] = 4] = "stringConstant";
    TokenType[TokenType["charConstant"] = 5] = "charConstant";
    TokenType[TokenType["true"] = 6] = "true";
    TokenType[TokenType["false"] = 7] = "false";
    // keywords
    TokenType[TokenType["keywordPrint"] = 8] = "keywordPrint";
    TokenType[TokenType["keywordPrintln"] = 9] = "keywordPrintln";
    TokenType[TokenType["keywordClass"] = 10] = "keywordClass";
    TokenType[TokenType["keywordThis"] = 11] = "keywordThis";
    TokenType[TokenType["keywordSuper"] = 12] = "keywordSuper";
    TokenType[TokenType["keywordNew"] = 13] = "keywordNew";
    TokenType[TokenType["keywordInterface"] = 14] = "keywordInterface";
    TokenType[TokenType["keywordEnum"] = 15] = "keywordEnum";
    TokenType[TokenType["keywordVoid"] = 16] = "keywordVoid";
    TokenType[TokenType["keywordAbstract"] = 17] = "keywordAbstract";
    TokenType[TokenType["keywordPublic"] = 18] = "keywordPublic";
    TokenType[TokenType["keywordProtected"] = 19] = "keywordProtected";
    TokenType[TokenType["keywordPrivate"] = 20] = "keywordPrivate";
    TokenType[TokenType["keywordTransient"] = 21] = "keywordTransient";
    TokenType[TokenType["keywordStatic"] = 22] = "keywordStatic";
    TokenType[TokenType["keywordExtends"] = 23] = "keywordExtends";
    TokenType[TokenType["keywordImplements"] = 24] = "keywordImplements";
    TokenType[TokenType["keywordWhile"] = 25] = "keywordWhile";
    TokenType[TokenType["keywordDo"] = 26] = "keywordDo";
    TokenType[TokenType["keywordFor"] = 27] = "keywordFor";
    TokenType[TokenType["keywordSwitch"] = 28] = "keywordSwitch";
    TokenType[TokenType["keywordCase"] = 29] = "keywordCase";
    TokenType[TokenType["keywordDefault"] = 30] = "keywordDefault";
    TokenType[TokenType["keywordIf"] = 31] = "keywordIf";
    TokenType[TokenType["keywordThen"] = 32] = "keywordThen";
    TokenType[TokenType["keywordElse"] = 33] = "keywordElse";
    TokenType[TokenType["keywordReturn"] = 34] = "keywordReturn";
    TokenType[TokenType["keywordBreak"] = 35] = "keywordBreak";
    TokenType[TokenType["keywordContinue"] = 36] = "keywordContinue";
    TokenType[TokenType["keywordNull"] = 37] = "keywordNull";
    TokenType[TokenType["keywordFinal"] = 38] = "keywordFinal";
    TokenType[TokenType["keywordInstanceof"] = 39] = "keywordInstanceof";
    // keywordInt,
    // keywordBoolean,
    // keywordString,
    // keywordFloat,
    // keywordChar,
    // brackets
    TokenType[TokenType["leftBracket"] = 40] = "leftBracket";
    TokenType[TokenType["rightBracket"] = 41] = "rightBracket";
    TokenType[TokenType["leftSquareBracket"] = 42] = "leftSquareBracket";
    TokenType[TokenType["rightSquareBracket"] = 43] = "rightSquareBracket";
    TokenType[TokenType["leftCurlyBracket"] = 44] = "leftCurlyBracket";
    TokenType[TokenType["rightCurlyBracket"] = 45] = "rightCurlyBracket";
    TokenType[TokenType["leftRightSquareBracket"] = 46] = "leftRightSquareBracket";
    // operators
    TokenType[TokenType["doubleMinus"] = 47] = "doubleMinus";
    TokenType[TokenType["doublePlus"] = 48] = "doublePlus";
    // binary operators
    TokenType[TokenType["dot"] = 49] = "dot";
    TokenType[TokenType["modulo"] = 50] = "modulo";
    TokenType[TokenType["minus"] = 51] = "minus";
    TokenType[TokenType["plus"] = 52] = "plus";
    TokenType[TokenType["multiplication"] = 53] = "multiplication";
    TokenType[TokenType["division"] = 54] = "division";
    TokenType[TokenType["singleQuote"] = 55] = "singleQuote";
    TokenType[TokenType["doubleQuote"] = 56] = "doubleQuote";
    TokenType[TokenType["lower"] = 57] = "lower";
    TokenType[TokenType["greater"] = 58] = "greater";
    TokenType[TokenType["lowerOrEqual"] = 59] = "lowerOrEqual";
    TokenType[TokenType["greaterOrEqual"] = 60] = "greaterOrEqual";
    TokenType[TokenType["equal"] = 61] = "equal";
    TokenType[TokenType["notEqual"] = 62] = "notEqual";
    TokenType[TokenType["assignment"] = 63] = "assignment";
    TokenType[TokenType["plusAssignment"] = 64] = "plusAssignment";
    TokenType[TokenType["minusAssignment"] = 65] = "minusAssignment";
    TokenType[TokenType["multiplicationAssignment"] = 66] = "multiplicationAssignment";
    TokenType[TokenType["divisionAssignment"] = 67] = "divisionAssignment";
    TokenType[TokenType["moduloAssignment"] = 68] = "moduloAssignment";
    TokenType[TokenType["and"] = 69] = "and";
    TokenType[TokenType["or"] = 70] = "or";
    TokenType[TokenType["ampersand"] = 71] = "ampersand";
    TokenType[TokenType["ANDAssigment"] = 72] = "ANDAssigment";
    TokenType[TokenType["XORAssigment"] = 73] = "XORAssigment";
    TokenType[TokenType["ORAssigment"] = 74] = "ORAssigment";
    TokenType[TokenType["shiftLeftAssigment"] = 75] = "shiftLeftAssigment";
    TokenType[TokenType["shiftRightAssigment"] = 76] = "shiftRightAssigment";
    TokenType[TokenType["shiftRightUnsignedAssigment"] = 77] = "shiftRightUnsignedAssigment";
    TokenType[TokenType["OR"] = 78] = "OR";
    TokenType[TokenType["XOR"] = 79] = "XOR";
    // AND, // & see TokenType.ampersand above
    TokenType[TokenType["tilde"] = 80] = "tilde";
    TokenType[TokenType["shiftRightUnsigned"] = 81] = "shiftRightUnsigned";
    TokenType[TokenType["shiftRight"] = 82] = "shiftRight";
    TokenType[TokenType["shiftLeft"] = 83] = "shiftLeft";
    TokenType[TokenType["ternaryOperator"] = 84] = "ternaryOperator";
    TokenType[TokenType["colon"] = 85] = "colon";
    TokenType[TokenType["ellipsis"] = 86] = "ellipsis";
    TokenType[TokenType["not"] = 87] = "not";
    // semicolon
    TokenType[TokenType["semicolon"] = 88] = "semicolon";
    // comma
    TokenType[TokenType["comma"] = 89] = "comma";
    // backslash
    TokenType[TokenType["backslash"] = 90] = "backslash";
    // @
    TokenType[TokenType["at"] = 91] = "at";
    // whitespace
    TokenType[TokenType["space"] = 92] = "space";
    TokenType[TokenType["tab"] = 93] = "tab";
    // newline
    TokenType[TokenType["newline"] = 94] = "newline";
    // line feed
    TokenType[TokenType["linefeed"] = 95] = "linefeed";
    // only lexer-internal
    TokenType[TokenType["identifierChar"] = 96] = "identifierChar";
    // Comment
    TokenType[TokenType["comment"] = 97] = "comment";
    // used by parser
    TokenType[TokenType["negation"] = 98] = "negation";
    TokenType[TokenType["referenceElement"] = 99] = "referenceElement";
    TokenType[TokenType["endofSourcecode"] = 100] = "endofSourcecode";
    // Program statement types:
    TokenType[TokenType["binaryOp"] = 101] = "binaryOp";
    TokenType[TokenType["unaryOp"] = 102] = "unaryOp";
    TokenType[TokenType["localVariableDeclaration"] = 103] = "localVariableDeclaration";
    TokenType[TokenType["heapVariableDeclaration"] = 104] = "heapVariableDeclaration";
    TokenType[TokenType["pushLocalVariableToStack"] = 105] = "pushLocalVariableToStack";
    TokenType[TokenType["popAndStoreIntoVariable"] = 106] = "popAndStoreIntoVariable";
    TokenType[TokenType["pushFromHeapToStack"] = 107] = "pushFromHeapToStack";
    TokenType[TokenType["pushAttribute"] = 108] = "pushAttribute";
    TokenType[TokenType["pushArrayLength"] = 109] = "pushArrayLength";
    TokenType[TokenType["pushConstant"] = 110] = "pushConstant";
    TokenType[TokenType["pushStaticClassObject"] = 111] = "pushStaticClassObject";
    TokenType[TokenType["pushStaticAttribute"] = 112] = "pushStaticAttribute";
    TokenType[TokenType["pushStaticAttributeIntrinsic"] = 113] = "pushStaticAttributeIntrinsic";
    TokenType[TokenType["checkCast"] = 114] = "checkCast";
    TokenType[TokenType["castValue"] = 115] = "castValue";
    TokenType[TokenType["selectArrayElement"] = 116] = "selectArrayElement";
    TokenType[TokenType["callMethod"] = 117] = "callMethod";
    TokenType[TokenType["callMainMethod"] = 118] = "callMainMethod";
    TokenType[TokenType["processPostConstructorCallbacks"] = 119] = "processPostConstructorCallbacks";
    TokenType[TokenType["callInputMethod"] = 120] = "callInputMethod";
    TokenType[TokenType["makeEllipsisArray"] = 121] = "makeEllipsisArray";
    TokenType[TokenType["decreaseStackpointer"] = 122] = "decreaseStackpointer";
    TokenType[TokenType["initStackframe"] = 123] = "initStackframe";
    TokenType[TokenType["closeStackframe"] = 124] = "closeStackframe";
    TokenType[TokenType["increaseSpaceForLocalVariables"] = 125] = "increaseSpaceForLocalVariables";
    TokenType[TokenType["return"] = 126] = "return";
    TokenType[TokenType["newObject"] = 127] = "newObject";
    TokenType[TokenType["jumpIfFalse"] = 128] = "jumpIfFalse";
    TokenType[TokenType["jumpIfTrue"] = 129] = "jumpIfTrue";
    TokenType[TokenType["jumpIfFalseAndLeaveOnStack"] = 130] = "jumpIfFalseAndLeaveOnStack";
    TokenType[TokenType["jumpIfTrueAndLeaveOnStack"] = 131] = "jumpIfTrueAndLeaveOnStack";
    TokenType[TokenType["jumpAlways"] = 132] = "jumpAlways";
    TokenType[TokenType["noOp"] = 133] = "noOp";
    TokenType[TokenType["incrementDecrementBefore"] = 134] = "incrementDecrementBefore";
    TokenType[TokenType["incrementDecrementAfter"] = 135] = "incrementDecrementAfter";
    TokenType[TokenType["programEnd"] = 136] = "programEnd";
    TokenType[TokenType["beginArray"] = 137] = "beginArray";
    TokenType[TokenType["addToArray"] = 138] = "addToArray";
    TokenType[TokenType["pushEmptyArray"] = 139] = "pushEmptyArray";
    TokenType[TokenType["forLoopOverCollection"] = 140] = "forLoopOverCollection";
    // additional AST node types
    TokenType[TokenType["type"] = 141] = "type";
    TokenType[TokenType["typeParameter"] = 142] = "typeParameter";
    TokenType[TokenType["attributeDeclaration"] = 143] = "attributeDeclaration";
    TokenType[TokenType["methodDeclaration"] = 144] = "methodDeclaration";
    TokenType[TokenType["parameterDeclaration"] = 145] = "parameterDeclaration";
    TokenType[TokenType["superConstructorCall"] = 146] = "superConstructorCall";
    TokenType[TokenType["newArray"] = 147] = "newArray";
    TokenType[TokenType["arrayInitialization"] = 148] = "arrayInitialization";
    TokenType[TokenType["print"] = 149] = "print";
    TokenType[TokenType["println"] = 150] = "println";
    TokenType[TokenType["pushEnumValue"] = 151] = "pushEnumValue";
    TokenType[TokenType["initializeEnumValue"] = 152] = "initializeEnumValue";
    TokenType[TokenType["scopeNode"] = 153] = "scopeNode";
    TokenType[TokenType["returnIfDestroyed"] = 154] = "returnIfDestroyed";
    TokenType[TokenType["extendedForLoopInit"] = 155] = "extendedForLoopInit";
    TokenType[TokenType["extendedForLoopCheckCounterAndGetElement"] = 156] = "extendedForLoopCheckCounterAndGetElement";
})(TokenType || (TokenType = {}));
export var TokenTypeReadable = {
    [TokenType.identifier]: "ein Bezeichner",
    // constants
    [TokenType.integerConstant]: "eine Integer-Konstante",
    [TokenType.floatingPointConstant]: "eine Fließkomma-Konstante",
    [TokenType.booleanConstant]: "eine boolesche Konstante",
    [TokenType.stringConstant]: "eine Zeichenketten-Konstante",
    [TokenType.charConstant]: "eine char-Konstante",
    [TokenType.true]: "true",
    [TokenType.false]: "false",
    // keywords
    [TokenType.keywordClass]: "class",
    [TokenType.keywordThis]: "this",
    [TokenType.keywordSuper]: "super",
    [TokenType.keywordNew]: "new",
    [TokenType.keywordInterface]: "interface",
    [TokenType.keywordEnum]: "enum",
    [TokenType.keywordVoid]: "void",
    [TokenType.keywordAbstract]: "abstract",
    [TokenType.keywordPublic]: "public",
    [TokenType.keywordProtected]: "protected",
    [TokenType.keywordPrivate]: "private",
    [TokenType.keywordTransient]: "transient",
    [TokenType.keywordStatic]: "static",
    [TokenType.keywordExtends]: "extends",
    [TokenType.keywordImplements]: "implements",
    [TokenType.keywordWhile]: "while",
    [TokenType.keywordDo]: "do",
    [TokenType.keywordFor]: "for",
    [TokenType.keywordSwitch]: "switch",
    [TokenType.keywordCase]: "case",
    [TokenType.keywordDefault]: "default",
    [TokenType.keywordIf]: "if",
    [TokenType.keywordThen]: "then",
    [TokenType.keywordElse]: "else",
    [TokenType.keywordReturn]: "return",
    [TokenType.keywordBreak]: "break",
    [TokenType.keywordContinue]: "continue",
    [TokenType.keywordNull]: "null",
    [TokenType.keywordFinal]: "final",
    [TokenType.keywordInstanceof]: "instanceof",
    [TokenType.keywordPrint]: "print",
    [TokenType.keywordPrintln]: "println",
    // keywordInt,
    // keywordBoolean,
    // keywordString,
    // keywordFloat,
    // keywordChar,
    // brackets
    [TokenType.leftBracket]: "(",
    [TokenType.rightBracket]: ")",
    [TokenType.leftSquareBracket]: "[",
    [TokenType.rightSquareBracket]: "]",
    [TokenType.leftCurlyBracket]: "{",
    [TokenType.rightCurlyBracket]: "}",
    [TokenType.leftRightSquareBracket]: "[]",
    // operators
    [TokenType.dot]: ".",
    [TokenType.minus]: "-",
    [TokenType.modulo]: "%",
    [TokenType.plus]: "+",
    [TokenType.multiplication]: "*",
    [TokenType.division]: "/",
    [TokenType.singleQuote]: "'",
    [TokenType.doubleQuote]: "\"",
    [TokenType.doubleMinus]: "--",
    [TokenType.doublePlus]: "++",
    [TokenType.lower]: "<",
    [TokenType.greater]: ">",
    [TokenType.lowerOrEqual]: "<=",
    [TokenType.greaterOrEqual]: ">=",
    [TokenType.equal]: "==",
    [TokenType.notEqual]: "!=",
    [TokenType.assignment]: "=",
    [TokenType.plusAssignment]: "+=",
    [TokenType.minusAssignment]: "-=",
    [TokenType.multiplicationAssignment]: "*=",
    [TokenType.divisionAssignment]: "/=",
    [TokenType.moduloAssignment]: "%=",
    [TokenType.ampersand]: "&",
    [TokenType.and]: "&&",
    [TokenType.or]: "||",
    [TokenType.not]: "!",
    [TokenType.ANDAssigment]: "&=",
    [TokenType.XORAssigment]: "^=",
    [TokenType.ORAssigment]: "|=",
    [TokenType.shiftLeftAssigment]: "<<=",
    [TokenType.shiftRightAssigment]: ">>=",
    [TokenType.shiftRightUnsignedAssigment]: ">>>=",
    // [TokenType.AND]: "&", 
    [TokenType.OR]: "|",
    [TokenType.XOR]: "^",
    [TokenType.tilde]: "~",
    [TokenType.shiftLeft]: "<<",
    [TokenType.shiftRight]: ">>",
    [TokenType.shiftRightUnsigned]: ">>>",
    [TokenType.ternaryOperator]: "?",
    // semicolon
    [TokenType.semicolon]: ";",
    [TokenType.colon]: ":",
    [TokenType.ellipsis]: "...",
    // comma
    [TokenType.comma]: ",",
    // backslash
    [TokenType.backslash]: "\\",
    // at
    [TokenType.at]: "@",
    // whitespace
    [TokenType.space]: "ein Leerzeichen",
    [TokenType.tab]: "ein Tabulatorzeichen",
    // newline
    [TokenType.newline]: "ein Zeilenumbruch",
    // only lexer-internal
    [TokenType.identifierChar]: "eines der Zeichen a..z, A..Z, _",
    // Comment
    [TokenType.comment]: "ein Kommentar",
    [TokenType.endofSourcecode]: "das Ende des Programmes"
};
export var specialCharList = {
    '(': TokenType.leftBracket,
    ')': TokenType.rightBracket,
    '[': TokenType.leftSquareBracket,
    ']': TokenType.rightSquareBracket,
    '{': TokenType.leftCurlyBracket,
    '}': TokenType.rightCurlyBracket,
    // operators
    '.': TokenType.dot,
    ',': TokenType.comma,
    '-': TokenType.minus,
    '%': TokenType.modulo,
    '+': TokenType.plus,
    '*': TokenType.multiplication,
    '/': TokenType.division,
    '\\': TokenType.backslash,
    '@': TokenType.at,
    '\'': TokenType.singleQuote,
    '"': TokenType.doubleQuote,
    "<": TokenType.lower,
    ">": TokenType.greater,
    "=": TokenType.assignment,
    "&": TokenType.and,
    "|": TokenType.or,
    "!": TokenType.not,
    "?": TokenType.ternaryOperator,
    "^": TokenType.XOR,
    "~": TokenType.tilde,
    ';': TokenType.semicolon,
    ':': TokenType.colon,
    '...': TokenType.ellipsis,
    // whitespace
    ' ': TokenType.space,
    '\t': TokenType.tab,
    // newline
    '\n': TokenType.newline,
    '\r': TokenType.linefeed
};
export var keywordList = {
    "class": TokenType.keywordClass,
    "this": TokenType.keywordThis,
    "super": TokenType.keywordSuper,
    "new": TokenType.keywordNew,
    "interface": TokenType.keywordInterface,
    "enum": TokenType.keywordEnum,
    "void": TokenType.keywordVoid,
    "abstract": TokenType.keywordAbstract,
    "public": TokenType.keywordPublic,
    "protected": TokenType.keywordProtected,
    "private": TokenType.keywordPrivate,
    "transient": TokenType.keywordTransient,
    "static": TokenType.keywordStatic,
    "extends": TokenType.keywordExtends,
    "implements": TokenType.keywordImplements,
    "while": TokenType.keywordWhile,
    "do": TokenType.keywordDo,
    "for": TokenType.keywordFor,
    "switch": TokenType.keywordSwitch,
    "case": TokenType.keywordCase,
    "default": TokenType.keywordDefault,
    "if": TokenType.keywordIf,
    "then": TokenType.keywordThen,
    "else": TokenType.keywordElse,
    "return": TokenType.keywordReturn,
    "break": TokenType.keywordBreak,
    "continue": TokenType.keywordContinue,
    "null": TokenType.keywordNull,
    "final": TokenType.keywordFinal,
    "instanceof": TokenType.keywordInstanceof,
    "true": TokenType.true,
    "false": TokenType.false,
    "print": TokenType.keywordPrint,
    "println": TokenType.keywordPrintln,
};
export var EscapeSequenceList = {
    "n": "\n",
    "r": "\r",
    "t": "\t",
    "\"": "\"",
    "'": "'",
    "\\": "\\"
};
function tokenToString(t) {
    return "<div><span style='font-weight: bold'>" + TokenType[t.tt] + "</span>" +
        "<span style='color: blue'> &nbsp;'" + t.value + "'</span> (l&nbsp;" + t.position.line + ", c&nbsp;" + t.position.column + ")</div>";
}
export function tokenListToString(tl) {
    let s = "";
    for (let t of tl) {
        s += tokenToString(t) + "\n";
    }
    return s;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9rZW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY2xpZW50L2NvbXBpbGVyL2xleGVyL1Rva2VuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBTixJQUFZLFNBZ01YO0FBaE1ELFdBQVksU0FBUztJQUNqQixxREFBVSxDQUFBO0lBQ1YsWUFBWTtJQUNaLCtEQUFlLENBQUE7SUFDZiwyRUFBcUIsQ0FBQTtJQUNyQiwrREFBZSxDQUFBO0lBQ2YsNkRBQWMsQ0FBQTtJQUNkLHlEQUFZLENBQUE7SUFDWix5Q0FBSSxDQUFBO0lBQ0osMkNBQUssQ0FBQTtJQUNMLFdBQVc7SUFDWCx5REFBWSxDQUFBO0lBQ1osNkRBQWMsQ0FBQTtJQUNkLDBEQUFZLENBQUE7SUFDWix3REFBVyxDQUFBO0lBQ1gsMERBQVksQ0FBQTtJQUNaLHNEQUFVLENBQUE7SUFDVixrRUFBZ0IsQ0FBQTtJQUNoQix3REFBVyxDQUFBO0lBQ1gsd0RBQVcsQ0FBQTtJQUNYLGdFQUFlLENBQUE7SUFDZiw0REFBYSxDQUFBO0lBQ2Isa0VBQWdCLENBQUE7SUFDaEIsOERBQWMsQ0FBQTtJQUNkLGtFQUFnQixDQUFBO0lBQ2hCLDREQUFhLENBQUE7SUFDYiw4REFBYyxDQUFBO0lBQ2Qsb0VBQWlCLENBQUE7SUFDakIsMERBQVksQ0FBQTtJQUNaLG9EQUFTLENBQUE7SUFDVCxzREFBVSxDQUFBO0lBQ1YsNERBQWEsQ0FBQTtJQUNiLHdEQUFXLENBQUE7SUFDWCw4REFBYyxDQUFBO0lBQ2Qsb0RBQVMsQ0FBQTtJQUNULHdEQUFXLENBQUE7SUFDWCx3REFBVyxDQUFBO0lBQ1gsNERBQWEsQ0FBQTtJQUNiLDBEQUFZLENBQUE7SUFDWixnRUFBZSxDQUFBO0lBQ2Ysd0RBQVcsQ0FBQTtJQUNYLDBEQUFZLENBQUE7SUFDWixvRUFBaUIsQ0FBQTtJQUNqQixjQUFjO0lBQ2Qsa0JBQWtCO0lBQ2xCLGlCQUFpQjtJQUNqQixnQkFBZ0I7SUFD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QixHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLFdBQVcsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7QUFDakosQ0FBQztBQUVELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxFQUFhO0lBQzNDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNYLEtBQUksSUFBSSxDQUFDLElBQUksRUFBRSxFQUFDO1FBQ1osQ0FBQyxJQUFJLGFBQWEsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDaEM7SUFDRCxPQUFPLENBQUMsQ0FBQztBQUNiLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZW51bSBUb2tlblR5cGUge1xyXG4gICAgaWRlbnRpZmllcixcclxuICAgIC8vIGNvbnN0YW50c1xyXG4gICAgaW50ZWdlckNvbnN0YW50LFxyXG4gICAgZmxvYXRpbmdQb2ludENvbnN0YW50LFxyXG4gICAgYm9vbGVhbkNvbnN0YW50LFxyXG4gICAgc3RyaW5nQ29uc3RhbnQsXHJcbiAgICBjaGFyQ29uc3RhbnQsXHJcbiAgICB0cnVlLFxyXG4gICAgZmFsc2UsXHJcbiAgICAvLyBrZXl3b3Jkc1xyXG4gICAga2V5d29yZFByaW50LFxyXG4gICAga2V5d29yZFByaW50bG4sXHJcbiAgICBrZXl3b3JkQ2xhc3MsXHJcbiAgICBrZXl3b3JkVGhpcyxcclxuICAgIGtleXdvcmRTdXBlcixcclxuICAgIGtleXdvcmROZXcsXHJcbiAgICBrZXl3b3JkSW50ZXJmYWNlLFxyXG4gICAga2V5d29yZEVudW0sXHJcbiAgICBrZXl3b3JkVm9pZCxcclxuICAgIGtleXdvcmRBYnN0cmFjdCxcclxuICAgIGtleXdvcmRQdWJsaWMsXHJcbiAgICBrZXl3b3JkUHJvdGVjdGVkLFxyXG4gICAga2V5d29yZFByaXZhdGUsXHJcbiAgICBrZXl3b3JkVHJhbnNpZW50LFxyXG4gICAga2V5d29yZFN0YXRpYyxcclxuICAgIGtleXdvcmRFeHRlbmRzLFxyXG4gICAga2V5d29yZEltcGxlbWVudHMsXHJcbiAgICBrZXl3b3JkV2hpbGUsXHJcbiAgICBrZXl3b3JkRG8sXHJcbiAgICBrZXl3b3JkRm9yLFxyXG4gICAga2V5d29yZFN3aXRjaCxcclxuICAgIGtleXdvcmRDYXNlLFxyXG4gICAga2V5d29yZERlZmF1bHQsXHJcbiAgICBrZXl3b3JkSWYsXHJcbiAgICBrZXl3b3JkVGhlbixcclxuICAgIGtleXdvcmRFbHNlLFxyXG4gICAga2V5d29yZFJldHVybixcclxuICAgIGtleXdvcmRCcmVhayxcclxuICAgIGtleXdvcmRDb250aW51ZSxcclxuICAgIGtleXdvcmROdWxsLFxyXG4gICAga2V5d29yZEZpbmFsLFxyXG4gICAga2V5d29yZEluc3RhbmNlb2YsXHJcbiAgICAvLyBrZXl3b3JkSW50LFxyXG4gICAgLy8ga2V5d29yZEJvb2xlYW4sXHJcbiAgICAvLyBrZXl3b3JkU3RyaW5nLFxyXG4gICAgLy8ga2V5d29yZEZsb2F0LFxyXG4gICAgLy8ga2V5d29yZENoYXIsXHJcblxyXG4gICAgLy8gYnJhY2tldHNcclxuICAgIGxlZnRCcmFja2V0LCAvLyAoKVxyXG4gICAgcmlnaHRCcmFja2V0LFxyXG4gICAgbGVmdFNxdWFyZUJyYWNrZXQsIC8vIFtdXHJcbiAgICByaWdodFNxdWFyZUJyYWNrZXQsXHJcbiAgICBsZWZ0Q3VybHlCcmFja2V0LCAvLyB7fVxyXG4gICAgcmlnaHRDdXJseUJyYWNrZXQsXHJcbiAgICBsZWZ0UmlnaHRTcXVhcmVCcmFja2V0LCAvLyBbXVxyXG4gICAgXHJcbiAgICAvLyBvcGVyYXRvcnNcclxuICAgIGRvdWJsZU1pbnVzLCBkb3VibGVQbHVzLFxyXG5cclxuICAgIC8vIGJpbmFyeSBvcGVyYXRvcnNcclxuICAgIGRvdCwgLy8uXHJcbiAgICBtb2R1bG8sXHJcbiAgICBtaW51cywgcGx1cywgbXVsdGlwbGljYXRpb24sIGRpdmlzaW9uLFxyXG4gICAgc2luZ2xlUXVvdGUsIGRvdWJsZVF1b3RlLCAvLyAnLCBcIlxyXG4gICAgbG93ZXIsIGdyZWF0ZXIsIGxvd2VyT3JFcXVhbCwgZ3JlYXRlck9yRXF1YWwsIFxyXG4gICAgZXF1YWwsIC8vID09XHJcbiAgICBub3RFcXVhbCwgLy8gIT1cclxuICAgIGFzc2lnbm1lbnQsIC8vID1cclxuICAgIHBsdXNBc3NpZ25tZW50LCAvLyArPVxyXG4gICAgbWludXNBc3NpZ25tZW50LCAvLyAtPVxyXG4gICAgbXVsdGlwbGljYXRpb25Bc3NpZ25tZW50LCAvLyAqPVxyXG4gICAgZGl2aXNpb25Bc3NpZ25tZW50LCAvLyAvPVxyXG4gICAgbW9kdWxvQXNzaWdubWVudCwgLy8gLyU9XHJcbiAgICBhbmQsIG9yLCAgIC8vICYmLCB8fFxyXG4gICAgYW1wZXJzYW5kLCAvLyAmXHJcblxyXG4gICAgQU5EQXNzaWdtZW50LFxyXG4gICAgWE9SQXNzaWdtZW50LFxyXG4gICAgT1JBc3NpZ21lbnQsXHJcbiAgICBzaGlmdExlZnRBc3NpZ21lbnQsXHJcbiAgICBzaGlmdFJpZ2h0QXNzaWdtZW50LFxyXG4gICAgc2hpZnRSaWdodFVuc2lnbmVkQXNzaWdtZW50LFxyXG4gICAgT1IsIC8vIHxcclxuICAgIFhPUiwgLy8gXlxyXG4gICAgLy8gQU5ELCAvLyAmIHNlZSBUb2tlblR5cGUuYW1wZXJzYW5kIGFib3ZlXHJcbiAgICB0aWxkZSwgLy8gflxyXG4gICAgc2hpZnRSaWdodFVuc2lnbmVkLCAvLyA+Pj5cclxuICAgIHNoaWZ0UmlnaHQsIC8vID4+XHJcbiAgICBzaGlmdExlZnQsIC8vIDw8XHJcblxyXG4gICAgdGVybmFyeU9wZXJhdG9yLFxyXG4gICAgY29sb24sIC8vOlxyXG4gICAgZWxsaXBzaXMsIC8vIC4uLlxyXG5cclxuICAgIG5vdCwgICAgLy8gIVxyXG4gICAgXHJcbiAgICAvLyBzZW1pY29sb25cclxuICAgIHNlbWljb2xvbiwgLy8gO1xyXG5cclxuICAgIC8vIGNvbW1hXHJcbiAgICBjb21tYSwgLy8gLFxyXG5cclxuICAgIC8vIGJhY2tzbGFzaFxyXG4gICAgYmFja3NsYXNoLFxyXG5cclxuICAgIC8vIEBcclxuICAgIGF0LFxyXG5cclxuICAgIC8vIHdoaXRlc3BhY2VcclxuICAgIHNwYWNlLFxyXG5cclxuICAgIHRhYixcclxuXHJcbiAgICAvLyBuZXdsaW5lXHJcbiAgICBuZXdsaW5lLFxyXG5cclxuICAgIC8vIGxpbmUgZmVlZFxyXG4gICAgbGluZWZlZWQsXHJcblxyXG4gICAgLy8gb25seSBsZXhlci1pbnRlcm5hbFxyXG4gICAgaWRlbnRpZmllckNoYXIsICAvLyBub25lIG9mIHRoZSBzcGVjaWFsIGNoYXJzIGFib3ZlIGEuLnpBLi5aX8OEw7YuLi5cclxuXHJcbiAgICAvLyBDb21tZW50XHJcbiAgICBjb21tZW50LFxyXG5cclxuICAgIC8vIHVzZWQgYnkgcGFyc2VyXHJcbiAgICBuZWdhdGlvbiwgXHJcbiAgICByZWZlcmVuY2VFbGVtZW50LCAvLyBmb3IgYXJyYXlzXHJcblxyXG4gICAgZW5kb2ZTb3VyY2Vjb2RlLCAvLyB3aWxsIGJlIGdlbmVyYXRlZCBhZnRlciBzb3VyY2Vjb2RlIGVuZFxyXG4gICAgXHJcbiAgICAvLyBQcm9ncmFtIHN0YXRlbWVudCB0eXBlczpcclxuICAgIGJpbmFyeU9wLCAvLyArLCAtLCAqLCA8PSwgLi4uXHJcbiAgICB1bmFyeU9wLCAvLyAhIGFuZCAtIFxyXG4gICAgbG9jYWxWYXJpYWJsZURlY2xhcmF0aW9uLFxyXG4gICAgaGVhcFZhcmlhYmxlRGVjbGFyYXRpb24sXHJcbiAgICBwdXNoTG9jYWxWYXJpYWJsZVRvU3RhY2ssIC8vIHB1c2ggdmFsdWUgb2YgYSBsb2NhbCB2YXJpYWJsZSB0byBzdGFja1xyXG4gICAgcG9wQW5kU3RvcmVJbnRvVmFyaWFibGUsXHJcbiAgICBwdXNoRnJvbUhlYXBUb1N0YWNrLCAvLyBwdXNoIHZhbHVlIGZyb20gaGVhcCB0byBzdGFja1xyXG4gICAgcHVzaEF0dHJpYnV0ZSwgLy8gdmFsdWUgb2YgYSBhdHRyaWJ1dGUgdG8gc3RhY2tcclxuICAgIHB1c2hBcnJheUxlbmd0aCwgXHJcbiAgICBwdXNoQ29uc3RhbnQsIC8vIGxpdGVyYWxcclxuICAgIHB1c2hTdGF0aWNDbGFzc09iamVjdCwgLy8gcHVzaCBjbGFzcy1PYmplY3QgdG8gc3RhY2sgKHdoaWNoIGhvbGRzIHN0YXRpYyBhdHRyaWJ1dGVzKVxyXG4gICAgcHVzaFN0YXRpY0F0dHJpYnV0ZSwgLy8gcHVzaCBzdGF0aWMgYXR0cmlidXRlIHRvIHN0YWNrXHJcbiAgICBwdXNoU3RhdGljQXR0cmlidXRlSW50cmluc2ljLCAvLyBwdXNoIHN0YXRpYyBhdHRyaWJ1dGUgdG8gc3RhY2tcclxuICAgIGNoZWNrQ2FzdCwgLy8gY2hlY2sgaWYgb2JqZWN0IG1heSBnZXQgY2FzdGVkIHRvIGNsYXNzIG9yIGludGVyZmFjZVxyXG4gICAgY2FzdFZhbHVlLCAvLyBjYXN0IHZhbHVlIG9uIHRvcCBvZiBzdGFjayB0byBvdGhlciB0eXBlXHJcbiAgICBzZWxlY3RBcnJheUVsZW1lbnQsIC8vIHNlbGVjdCBFbGVtZW50IGZyb20gQXJyYXkgKGUuZy4gYVsyMF0pXHJcbiAgICBjYWxsTWV0aG9kLFxyXG4gICAgY2FsbE1haW5NZXRob2QsXHJcbiAgICBwcm9jZXNzUG9zdENvbnN0cnVjdG9yQ2FsbGJhY2tzLCBcclxuICAgIGNhbGxJbnB1dE1ldGhvZCwgLy8gTWV0aG9kcyBvZiBJbnB1dCBjbGFzc1xyXG4gICAgbWFrZUVsbGlwc2lzQXJyYXksXHJcbiAgICBkZWNyZWFzZVN0YWNrcG9pbnRlciwgLy8gZGVjcmVhc2Ugc3RhY2stcG9pbnRlciwgbm90aGluZyBlbHNlXHJcbiAgICBpbml0U3RhY2tmcmFtZSxcclxuICAgIGNsb3NlU3RhY2tmcmFtZSxcclxuICAgIGluY3JlYXNlU3BhY2VGb3JMb2NhbFZhcmlhYmxlcyxcclxuICAgIHJldHVybixcclxuICAgIG5ld09iamVjdCxcclxuICAgIGp1bXBJZkZhbHNlLFxyXG4gICAganVtcElmVHJ1ZSxcclxuICAgIGp1bXBJZkZhbHNlQW5kTGVhdmVPblN0YWNrLFxyXG4gICAganVtcElmVHJ1ZUFuZExlYXZlT25TdGFjayxcclxuICAgIGp1bXBBbHdheXMsXHJcbiAgICBub09wLCAvLyBhY3RzIGFzIGp1bXAgZGVzdGluYXRpb25cclxuICAgIGluY3JlbWVudERlY3JlbWVudEJlZm9yZSwgLy8gKytpLCAtLWlcclxuICAgIGluY3JlbWVudERlY3JlbWVudEFmdGVyLCAvLyBpKyssIGktLVxyXG4gICAgcHJvZ3JhbUVuZCxcclxuICAgIGJlZ2luQXJyYXksIC8vIHB1c2ggZW1wdHkgYXJyYXkgdG8gc3RhY2tcclxuICAgIGFkZFRvQXJyYXksIC8vIHBvcCBlbGVtZW50IGZvcm0gc3RhY2sgYW5kIGFkZCBpdCB0byBhcnJheSAob24gc2Vjb25kIHN0YWNrIHBvc2l0aW9uKVxyXG4gICAgcHVzaEVtcHR5QXJyYXksIC8vIHB1c2ggbXVsdGlkaW1lbnNpb25hbCBlbXB0eSBhcnJheSB0byBzdGFja1xyXG4gICAgZm9yTG9vcE92ZXJDb2xsZWN0aW9uLFxyXG5cclxuICAgIC8vIGFkZGl0aW9uYWwgQVNUIG5vZGUgdHlwZXNcclxuICAgIHR5cGUsIC8vIGUuZy4gaW50W11bXVxyXG4gICAgdHlwZVBhcmFtZXRlciwgLy8gZS5nLiA8RSBleHRlbmRzIFN0cmluZyBpbXBsZW1lbnRzIENvbXBhcmFibGU8RT4+XHJcbiAgICBhdHRyaWJ1dGVEZWNsYXJhdGlvbixcclxuICAgIG1ldGhvZERlY2xhcmF0aW9uLFxyXG4gICAgcGFyYW1ldGVyRGVjbGFyYXRpb24sXHJcbiAgICBzdXBlckNvbnN0cnVjdG9yQ2FsbCxcclxuICAgIG5ld0FycmF5LFxyXG4gICAgYXJyYXlJbml0aWFsaXphdGlvbixcclxuICAgIHByaW50LFxyXG4gICAgcHJpbnRsbiwgXHJcbiAgICBwdXNoRW51bVZhbHVlLFxyXG4gICAgaW5pdGlhbGl6ZUVudW1WYWx1ZSwgXHJcbiAgICBzY29wZU5vZGUsXHJcbiAgICByZXR1cm5JZkRlc3Ryb3llZCxcclxuICAgIGV4dGVuZGVkRm9yTG9vcEluaXQsXHJcbiAgICBleHRlbmRlZEZvckxvb3BDaGVja0NvdW50ZXJBbmRHZXRFbGVtZW50LFxyXG59XHJcblxyXG5leHBvcnQgdmFyIFRva2VuVHlwZVJlYWRhYmxlOiB7W3R0OiBudW1iZXJdOiBzdHJpbmd9ID0ge1xyXG4gICAgW1Rva2VuVHlwZS5pZGVudGlmaWVyXTogXCJlaW4gQmV6ZWljaG5lclwiLFxyXG4gICAgLy8gY29uc3RhbnRzXHJcbiAgICBbVG9rZW5UeXBlLmludGVnZXJDb25zdGFudF06IFwiZWluZSBJbnRlZ2VyLUtvbnN0YW50ZVwiLFxyXG4gICAgW1Rva2VuVHlwZS5mbG9hdGluZ1BvaW50Q29uc3RhbnRdOiBcImVpbmUgRmxpZcOfa29tbWEtS29uc3RhbnRlXCIsXHJcbiAgICBbVG9rZW5UeXBlLmJvb2xlYW5Db25zdGFudF06IFwiZWluZSBib29sZXNjaGUgS29uc3RhbnRlXCIsXHJcbiAgICBbVG9rZW5UeXBlLnN0cmluZ0NvbnN0YW50XTogXCJlaW5lIFplaWNoZW5rZXR0ZW4tS29uc3RhbnRlXCIsXHJcbiAgICBbVG9rZW5UeXBlLmNoYXJDb25zdGFudF06IFwiZWluZSBjaGFyLUtvbnN0YW50ZVwiLFxyXG4gICAgW1Rva2VuVHlwZS50cnVlXTogXCJ0cnVlXCIsXHJcbiAgICBbVG9rZW5UeXBlLmZhbHNlXTogXCJmYWxzZVwiLFxyXG4gICAgLy8ga2V5d29yZHNcclxuICAgIFtUb2tlblR5cGUua2V5d29yZENsYXNzXTogXCJjbGFzc1wiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkVGhpc106IFwidGhpc1wiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkU3VwZXJdOiBcInN1cGVyXCIsXHJcbiAgICBbVG9rZW5UeXBlLmtleXdvcmROZXddOiBcIm5ld1wiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkSW50ZXJmYWNlXTogXCJpbnRlcmZhY2VcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZEVudW1dOiBcImVudW1cIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZFZvaWRdOiBcInZvaWRcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZEFic3RyYWN0XTogXCJhYnN0cmFjdFwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkUHVibGljXTogXCJwdWJsaWNcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZFByb3RlY3RlZF06IFwicHJvdGVjdGVkXCIsXHJcbiAgICBbVG9rZW5UeXBlLmtleXdvcmRQcml2YXRlXTogXCJwcml2YXRlXCIsXHJcbiAgICBbVG9rZW5UeXBlLmtleXdvcmRUcmFuc2llbnRdOiBcInRyYW5zaWVudFwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkU3RhdGljXTogXCJzdGF0aWNcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZEV4dGVuZHNdOiBcImV4dGVuZHNcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZEltcGxlbWVudHNdOiBcImltcGxlbWVudHNcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZFdoaWxlXTogXCJ3aGlsZVwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkRG9dOiBcImRvXCIsXHJcbiAgICBbVG9rZW5UeXBlLmtleXdvcmRGb3JdOiBcImZvclwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkU3dpdGNoXTogXCJzd2l0Y2hcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZENhc2VdOiBcImNhc2VcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZERlZmF1bHRdOiBcImRlZmF1bHRcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZElmXTogXCJpZlwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkVGhlbl06IFwidGhlblwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkRWxzZV06IFwiZWxzZVwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkUmV0dXJuXTogXCJyZXR1cm5cIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZEJyZWFrXTogXCJicmVha1wiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkQ29udGludWVdOiBcImNvbnRpbnVlXCIsXHJcbiAgICBbVG9rZW5UeXBlLmtleXdvcmROdWxsXTogXCJudWxsXCIsXHJcbiAgICBbVG9rZW5UeXBlLmtleXdvcmRGaW5hbF06IFwiZmluYWxcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZEluc3RhbmNlb2ZdOiBcImluc3RhbmNlb2ZcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZFByaW50XTogXCJwcmludFwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkUHJpbnRsbl06IFwicHJpbnRsblwiLFxyXG4gICAgLy8ga2V5d29yZEludCxcclxuICAgIC8vIGtleXdvcmRCb29sZWFuLFxyXG4gICAgLy8ga2V5d29yZFN0cmluZyxcclxuICAgIC8vIGtleXdvcmRGbG9hdCxcclxuICAgIC8vIGtleXdvcmRDaGFyLFxyXG5cclxuICAgIC8vIGJyYWNrZXRzXHJcbiAgICBbVG9rZW5UeXBlLmxlZnRCcmFja2V0XTogXCIoXCIsIC8vICgpXHJcbiAgICBbVG9rZW5UeXBlLnJpZ2h0QnJhY2tldF06IFwiKVwiLFxyXG4gICAgW1Rva2VuVHlwZS5sZWZ0U3F1YXJlQnJhY2tldF06IFwiW1wiLCAvLyBbXVxyXG4gICAgW1Rva2VuVHlwZS5yaWdodFNxdWFyZUJyYWNrZXRdOiBcIl1cIixcclxuICAgIFtUb2tlblR5cGUubGVmdEN1cmx5QnJhY2tldF06IFwie1wiLCAvLyB7fVxyXG4gICAgW1Rva2VuVHlwZS5yaWdodEN1cmx5QnJhY2tldF06IFwifVwiLFxyXG4gICAgW1Rva2VuVHlwZS5sZWZ0UmlnaHRTcXVhcmVCcmFja2V0XTogXCJbXVwiLCBcclxuICAgIFxyXG4gICAgLy8gb3BlcmF0b3JzXHJcbiAgICBbVG9rZW5UeXBlLmRvdF06IFwiLlwiLCAvLy5cclxuICAgIFtUb2tlblR5cGUubWludXNdOiBcIi1cIiwgXHJcbiAgICBbVG9rZW5UeXBlLm1vZHVsb106IFwiJVwiLCBcclxuICAgIFtUb2tlblR5cGUucGx1c106IFwiK1wiLCBcclxuICAgIFtUb2tlblR5cGUubXVsdGlwbGljYXRpb25dOiBcIipcIiwgXHJcbiAgICBbVG9rZW5UeXBlLmRpdmlzaW9uXTogXCIvXCIsXHJcbiAgICBbVG9rZW5UeXBlLnNpbmdsZVF1b3RlXTogXCInXCIsIFxyXG4gICAgW1Rva2VuVHlwZS5kb3VibGVRdW90ZV06IFwiXFxcIlwiLCAvLyAnXTogXCJcIiwgXCJcclxuICAgIFtUb2tlblR5cGUuZG91YmxlTWludXNdOiBcIi0tXCIsIFxyXG4gICAgW1Rva2VuVHlwZS5kb3VibGVQbHVzXTogXCIrK1wiLFxyXG4gICAgW1Rva2VuVHlwZS5sb3dlcl06IFwiPFwiLCBcclxuICAgIFtUb2tlblR5cGUuZ3JlYXRlcl06IFwiPlwiLCBcclxuICAgIFtUb2tlblR5cGUubG93ZXJPckVxdWFsXTogXCI8PVwiLCBcclxuICAgIFtUb2tlblR5cGUuZ3JlYXRlck9yRXF1YWxdOiBcIj49XCIsIFxyXG4gICAgW1Rva2VuVHlwZS5lcXVhbF06IFwiPT1cIiwgLy8gPT1cclxuICAgIFtUb2tlblR5cGUubm90RXF1YWxdOiBcIiE9XCIsIC8vICE9XHJcbiAgICBbVG9rZW5UeXBlLmFzc2lnbm1lbnRdOiBcIj1cIiwgLy8gPVxyXG4gICAgW1Rva2VuVHlwZS5wbHVzQXNzaWdubWVudF06IFwiKz1cIiwgLy8gKz1cclxuICAgIFtUb2tlblR5cGUubWludXNBc3NpZ25tZW50XTogXCItPVwiLCAvLyAtPVxyXG4gICAgW1Rva2VuVHlwZS5tdWx0aXBsaWNhdGlvbkFzc2lnbm1lbnRdOiBcIio9XCIsIC8vICo9XHJcbiAgICBbVG9rZW5UeXBlLmRpdmlzaW9uQXNzaWdubWVudF06IFwiLz1cIiwgLy8gLz1cclxuICAgIFtUb2tlblR5cGUubW9kdWxvQXNzaWdubWVudF06IFwiJT1cIixcclxuICAgIFtUb2tlblR5cGUuYW1wZXJzYW5kXTogXCImXCIsIFxyXG4gICAgW1Rva2VuVHlwZS5hbmRdOiBcIiYmXCIsIFxyXG4gICAgW1Rva2VuVHlwZS5vcl06IFwifHxcIiwgXHJcbiAgICBbVG9rZW5UeXBlLm5vdF06IFwiIVwiLCBcclxuXHJcbiAgICBbVG9rZW5UeXBlLkFOREFzc2lnbWVudF06IFwiJj1cIixcclxuICAgIFtUb2tlblR5cGUuWE9SQXNzaWdtZW50XTogXCJePVwiLFxyXG4gICAgW1Rva2VuVHlwZS5PUkFzc2lnbWVudF06IFwifD1cIixcclxuICAgIFtUb2tlblR5cGUuc2hpZnRMZWZ0QXNzaWdtZW50XTogXCI8PD1cIixcclxuICAgIFtUb2tlblR5cGUuc2hpZnRSaWdodEFzc2lnbWVudF06IFwiPj49XCIsXHJcbiAgICBbVG9rZW5UeXBlLnNoaWZ0UmlnaHRVbnNpZ25lZEFzc2lnbWVudF06IFwiPj4+PVwiLFxyXG4gICAgLy8gW1Rva2VuVHlwZS5BTkRdOiBcIiZcIiwgXHJcbiAgICBbVG9rZW5UeXBlLk9SXTogXCJ8XCIsXHJcbiAgICBbVG9rZW5UeXBlLlhPUl06IFwiXlwiLFxyXG4gICAgW1Rva2VuVHlwZS50aWxkZV06IFwiflwiLFxyXG4gICAgW1Rva2VuVHlwZS5zaGlmdExlZnRdOiBcIjw8XCIsXHJcbiAgICBbVG9rZW5UeXBlLnNoaWZ0UmlnaHRdOiBcIj4+XCIsXHJcbiAgICBbVG9rZW5UeXBlLnNoaWZ0UmlnaHRVbnNpZ25lZF06IFwiPj4+XCIsXHJcblxyXG5cclxuICAgIFtUb2tlblR5cGUudGVybmFyeU9wZXJhdG9yXTogXCI/XCIsIFxyXG4gICAgXHJcbiAgICAvLyBzZW1pY29sb25cclxuICAgIFtUb2tlblR5cGUuc2VtaWNvbG9uXTogXCI7XCIsIC8vIDtcclxuXHJcbiAgICBbVG9rZW5UeXBlLmNvbG9uXTogXCI6XCIsIC8vIDtcclxuICAgIFtUb2tlblR5cGUuZWxsaXBzaXNdOiBcIi4uLlwiLCAvLyA7XHJcblxyXG4gICAgLy8gY29tbWFcclxuICAgIFtUb2tlblR5cGUuY29tbWFdOiBcIixcIiwgXHJcblxyXG4gICAgLy8gYmFja3NsYXNoXHJcbiAgICBbVG9rZW5UeXBlLmJhY2tzbGFzaF06IFwiXFxcXFwiLFxyXG5cclxuICAgIC8vIGF0XHJcbiAgICBbVG9rZW5UeXBlLmF0XTogXCJAXCIsXHJcblxyXG4gICAgLy8gd2hpdGVzcGFjZVxyXG4gICAgW1Rva2VuVHlwZS5zcGFjZV06IFwiZWluIExlZXJ6ZWljaGVuXCIsXHJcbiAgICBbVG9rZW5UeXBlLnRhYl06IFwiZWluIFRhYnVsYXRvcnplaWNoZW5cIixcclxuXHJcbiAgICAvLyBuZXdsaW5lXHJcbiAgICBbVG9rZW5UeXBlLm5ld2xpbmVdOiBcImVpbiBaZWlsZW51bWJydWNoXCIsXHJcblxyXG4gICAgLy8gb25seSBsZXhlci1pbnRlcm5hbFxyXG4gICAgW1Rva2VuVHlwZS5pZGVudGlmaWVyQ2hhcl06IFwiZWluZXMgZGVyIFplaWNoZW4gYS4ueiwgQS4uWiwgX1wiLCAgLy8gbm9uZSBvZiB0aGUgc3BlY2lhbCBjaGFycyBhYm92ZSBhLi56QS4uWl/DhMO2Li4uXHJcblxyXG4gICAgLy8gQ29tbWVudFxyXG4gICAgW1Rva2VuVHlwZS5jb21tZW50XTogXCJlaW4gS29tbWVudGFyXCIsXHJcblxyXG4gICAgW1Rva2VuVHlwZS5lbmRvZlNvdXJjZWNvZGVdOiBcImRhcyBFbmRlIGRlcyBQcm9ncmFtbWVzXCJcclxuXHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgc3BlY2lhbENoYXJMaXN0OiB7W2tleXdvcmQ6IHN0cmluZ106VG9rZW5UeXBlfSA9IHtcclxuICAgICcoJzogVG9rZW5UeXBlLmxlZnRCcmFja2V0LCAvLyAoKVxyXG4gICAgJyknOiBUb2tlblR5cGUucmlnaHRCcmFja2V0LFxyXG4gICAgJ1snOiBUb2tlblR5cGUubGVmdFNxdWFyZUJyYWNrZXQsIC8vIFtdXHJcbiAgICAnXSc6IFRva2VuVHlwZS5yaWdodFNxdWFyZUJyYWNrZXQsXHJcbiAgICAneyc6IFRva2VuVHlwZS5sZWZ0Q3VybHlCcmFja2V0LCAvLyB7fVxyXG4gICAgJ30nOiBUb2tlblR5cGUucmlnaHRDdXJseUJyYWNrZXQsXHJcbiAgICBcclxuICAgIC8vIG9wZXJhdG9yc1xyXG4gICAgJy4nOiBUb2tlblR5cGUuZG90LCAvLy5cclxuICAgICcsJzogVG9rZW5UeXBlLmNvbW1hLCAvLy5cclxuICAgICctJzogVG9rZW5UeXBlLm1pbnVzLFxyXG4gICAgJyUnOiBUb2tlblR5cGUubW9kdWxvLFxyXG4gICAgJysnOiBUb2tlblR5cGUucGx1cywgXHJcbiAgICAnKic6IFRva2VuVHlwZS5tdWx0aXBsaWNhdGlvbiwgXHJcbiAgICAnLyc6IFRva2VuVHlwZS5kaXZpc2lvbixcclxuICAgICdcXFxcJzogVG9rZW5UeXBlLmJhY2tzbGFzaCxcclxuICAgICdAJzogVG9rZW5UeXBlLmF0LFxyXG4gICAgJ1xcJyc6IFRva2VuVHlwZS5zaW5nbGVRdW90ZSwgXHJcbiAgICAnXCInOiBUb2tlblR5cGUuZG91YmxlUXVvdGUsIC8vICcsIFwiXHJcbiAgICBcIjxcIjogVG9rZW5UeXBlLmxvd2VyLFxyXG4gICAgXCI+XCI6IFRva2VuVHlwZS5ncmVhdGVyLFxyXG4gICAgXCI9XCI6IFRva2VuVHlwZS5hc3NpZ25tZW50LFxyXG4gICAgXCImXCI6IFRva2VuVHlwZS5hbmQsXHJcbiAgICBcInxcIjogVG9rZW5UeXBlLm9yLFxyXG4gICAgXCIhXCI6IFRva2VuVHlwZS5ub3QsXHJcbiAgICBcIj9cIjogVG9rZW5UeXBlLnRlcm5hcnlPcGVyYXRvcixcclxuXHJcbiAgICBcIl5cIjogVG9rZW5UeXBlLlhPUixcclxuICAgIFwiflwiOiBUb2tlblR5cGUudGlsZGUsXHJcbiAgICBcclxuICAgICc7JzogVG9rZW5UeXBlLnNlbWljb2xvbiwgLy8gO1xyXG4gICAgJzonOiBUb2tlblR5cGUuY29sb24sIC8vIDtcclxuXHJcbiAgICAnLi4uJzogVG9rZW5UeXBlLmVsbGlwc2lzLFxyXG5cclxuICAgIC8vIHdoaXRlc3BhY2VcclxuICAgICcgJzogVG9rZW5UeXBlLnNwYWNlLFxyXG4gICAgJ1xcdCc6IFRva2VuVHlwZS50YWIsXHJcblxyXG4gICAgLy8gbmV3bGluZVxyXG4gICAgJ1xcbic6IFRva2VuVHlwZS5uZXdsaW5lLFxyXG4gICAgJ1xccic6IFRva2VuVHlwZS5saW5lZmVlZFxyXG59XHJcblxyXG5leHBvcnQgdmFyIGtleXdvcmRMaXN0OiB7W2tleXdvcmQ6IHN0cmluZ106VG9rZW5UeXBlfSA9IHtcclxuICAgIFwiY2xhc3NcIjogVG9rZW5UeXBlLmtleXdvcmRDbGFzcyxcclxuICAgIFwidGhpc1wiOiBUb2tlblR5cGUua2V5d29yZFRoaXMsXHJcbiAgICBcInN1cGVyXCI6IFRva2VuVHlwZS5rZXl3b3JkU3VwZXIsXHJcbiAgICBcIm5ld1wiOiBUb2tlblR5cGUua2V5d29yZE5ldyxcclxuICAgIFwiaW50ZXJmYWNlXCI6IFRva2VuVHlwZS5rZXl3b3JkSW50ZXJmYWNlLFxyXG4gICAgXCJlbnVtXCI6IFRva2VuVHlwZS5rZXl3b3JkRW51bSxcclxuICAgIFwidm9pZFwiOiBUb2tlblR5cGUua2V5d29yZFZvaWQsXHJcbiAgICBcImFic3RyYWN0XCI6IFRva2VuVHlwZS5rZXl3b3JkQWJzdHJhY3QsXHJcbiAgICBcInB1YmxpY1wiOiBUb2tlblR5cGUua2V5d29yZFB1YmxpYyxcclxuICAgIFwicHJvdGVjdGVkXCI6IFRva2VuVHlwZS5rZXl3b3JkUHJvdGVjdGVkLFxyXG4gICAgXCJwcml2YXRlXCI6IFRva2VuVHlwZS5rZXl3b3JkUHJpdmF0ZSxcclxuICAgIFwidHJhbnNpZW50XCI6IFRva2VuVHlwZS5rZXl3b3JkVHJhbnNpZW50LFxyXG4gICAgXCJzdGF0aWNcIjogVG9rZW5UeXBlLmtleXdvcmRTdGF0aWMsXHJcbiAgICBcImV4dGVuZHNcIjogVG9rZW5UeXBlLmtleXdvcmRFeHRlbmRzLFxyXG4gICAgXCJpbXBsZW1lbnRzXCI6IFRva2VuVHlwZS5rZXl3b3JkSW1wbGVtZW50cyxcclxuICAgIFwid2hpbGVcIjogVG9rZW5UeXBlLmtleXdvcmRXaGlsZSxcclxuICAgIFwiZG9cIjogVG9rZW5UeXBlLmtleXdvcmREbyxcclxuICAgIFwiZm9yXCI6IFRva2VuVHlwZS5rZXl3b3JkRm9yLFxyXG4gICAgXCJzd2l0Y2hcIjogVG9rZW5UeXBlLmtleXdvcmRTd2l0Y2gsXHJcbiAgICBcImNhc2VcIjogVG9rZW5UeXBlLmtleXdvcmRDYXNlLFxyXG4gICAgXCJkZWZhdWx0XCI6IFRva2VuVHlwZS5rZXl3b3JkRGVmYXVsdCxcclxuICAgIFwiaWZcIjogVG9rZW5UeXBlLmtleXdvcmRJZixcclxuICAgIFwidGhlblwiOiBUb2tlblR5cGUua2V5d29yZFRoZW4sXHJcbiAgICBcImVsc2VcIjogVG9rZW5UeXBlLmtleXdvcmRFbHNlLFxyXG4gICAgXCJyZXR1cm5cIjogVG9rZW5UeXBlLmtleXdvcmRSZXR1cm4sXHJcbiAgICBcImJyZWFrXCI6IFRva2VuVHlwZS5rZXl3b3JkQnJlYWssXHJcbiAgICBcImNvbnRpbnVlXCI6IFRva2VuVHlwZS5rZXl3b3JkQ29udGludWUsXHJcbiAgICBcIm51bGxcIjogVG9rZW5UeXBlLmtleXdvcmROdWxsLFxyXG4gICAgXCJmaW5hbFwiOiBUb2tlblR5cGUua2V5d29yZEZpbmFsLFxyXG4gICAgXCJpbnN0YW5jZW9mXCI6IFRva2VuVHlwZS5rZXl3b3JkSW5zdGFuY2VvZixcclxuICAgIFwidHJ1ZVwiOiBUb2tlblR5cGUudHJ1ZSxcclxuICAgIFwiZmFsc2VcIjogVG9rZW5UeXBlLmZhbHNlLFxyXG4gICAgXCJwcmludFwiOiBUb2tlblR5cGUua2V5d29yZFByaW50LFxyXG4gICAgXCJwcmludGxuXCI6IFRva2VuVHlwZS5rZXl3b3JkUHJpbnRsbixcclxuICAgIC8vIFwiaW50XCI6IFRva2VuVHlwZS5rZXl3b3JkSW50LFxyXG4gICAgLy8gXCJib29sZWFuXCI6IFRva2VuVHlwZS5rZXl3b3JkQm9vbGVhbixcclxuICAgIC8vIFwiU3RyaW5nXCI6IFRva2VuVHlwZS5rZXl3b3JkU3RyaW5nLFxyXG4gICAgLy8gXCJmbG9hdFwiOiBUb2tlblR5cGUua2V5d29yZEZsb2F0LFxyXG4gICAgLy8gXCJjaGFyXCI6IFRva2VuVHlwZS5rZXl3b3JkQ2hhclxyXG59O1xyXG5cclxuZXhwb3J0IHZhciBFc2NhcGVTZXF1ZW5jZUxpc3Q6IHtba2V5d29yZDogc3RyaW5nXTpzdHJpbmd9ID0ge1xyXG4gICAgXCJuXCI6IFwiXFxuXCIsXHJcbiAgICBcInJcIjogXCJcXHJcIixcclxuICAgIFwidFwiOiBcIlxcdFwiLFxyXG4gICAgXCJcXFwiXCI6IFwiXFxcIlwiLFxyXG4gICAgXCInXCI6IFwiJ1wiLFxyXG4gICAgXCJcXFxcXCI6IFwiXFxcXFwiXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFRleHRQb3NpdGlvbiA9IHtcclxuICAgIGxpbmU6IG51bWJlcixcclxuICAgIGNvbHVtbjogbnVtYmVyLCBcclxuICAgIGxlbmd0aDogbnVtYmVyXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFRleHRQb3NpdGlvbldpdGhvdXRMZW5ndGggPSB7XHJcbiAgICBsaW5lOiBudW1iZXIsXHJcbiAgICBjb2x1bW46IG51bWJlclxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBUb2tlbiA9IHtcclxuICAgIHR0OiBUb2tlblR5cGUsXHJcbiAgICB2YWx1ZTogc3RyaW5nfG51bWJlcnxib29sZWFuLFxyXG4gICAgcG9zaXRpb246IFRleHRQb3NpdGlvbixcclxuICAgIGNvbW1lbnRCZWZvcmU/OiBUb2tlblxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBUb2tlbkxpc3QgPSBUb2tlbltdO1xyXG5cclxuZnVuY3Rpb24gdG9rZW5Ub1N0cmluZyh0OiBUb2tlbil7XHJcbiAgICByZXR1cm4gXCI8ZGl2PjxzcGFuIHN0eWxlPSdmb250LXdlaWdodDogYm9sZCc+XCIgKyBUb2tlblR5cGVbdC50dF0gKyBcIjwvc3Bhbj5cIiArXHJcbiAgICAgICAgICAgIFwiPHNwYW4gc3R5bGU9J2NvbG9yOiBibHVlJz4gJm5ic3A7J1wiICsgdC52YWx1ZSArIFwiJzwvc3Bhbj4gKGwmbmJzcDtcIiArIHQucG9zaXRpb24ubGluZSArIFwiLCBjJm5ic3A7XCIgKyB0LnBvc2l0aW9uLmNvbHVtbiArIFwiKTwvZGl2PlwiO1xyXG59XHJcbiBcclxuZXhwb3J0IGZ1bmN0aW9uIHRva2VuTGlzdFRvU3RyaW5nKHRsOiBUb2tlbkxpc3QpOnN0cmluZ3tcclxuICAgIGxldCBzID0gXCJcIjtcclxuICAgIGZvcihsZXQgdCBvZiB0bCl7XHJcbiAgICAgICAgcyArPSB0b2tlblRvU3RyaW5nKHQpICsgXCJcXG5cIjtcclxuICAgIH1cclxuICAgIHJldHVybiBzO1xyXG59Il19