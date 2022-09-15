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
    TokenType[TokenType["constructorCall"] = 147] = "constructorCall";
    TokenType[TokenType["newArray"] = 148] = "newArray";
    TokenType[TokenType["arrayInitialization"] = 149] = "arrayInitialization";
    TokenType[TokenType["print"] = 150] = "print";
    TokenType[TokenType["println"] = 151] = "println";
    TokenType[TokenType["pushEnumValue"] = 152] = "pushEnumValue";
    TokenType[TokenType["initializeEnumValue"] = 153] = "initializeEnumValue";
    TokenType[TokenType["scopeNode"] = 154] = "scopeNode";
    TokenType[TokenType["returnIfDestroyed"] = 155] = "returnIfDestroyed";
    TokenType[TokenType["extendedForLoopInit"] = 156] = "extendedForLoopInit";
    TokenType[TokenType["extendedForLoopCheckCounterAndGetElement"] = 157] = "extendedForLoopCheckCounterAndGetElement";
    TokenType[TokenType["setPauseDuration"] = 158] = "setPauseDuration";
    TokenType[TokenType["pause"] = 159] = "pause";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9rZW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L2NvbXBpbGVyL2xleGVyL1Rva2VuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBTixJQUFZLFNBbU1YO0FBbk1ELFdBQVksU0FBUztJQUNqQixxREFBVSxDQUFBO0lBQ1YsWUFBWTtJQUNaLCtEQUFlLENBQUE7SUFDZiwyRUFBcUIsQ0FBQTtJQUNyQiwrREFBZSxDQUFBO0lBQ2YsNkRBQWMsQ0FBQTtJQUNkLHlEQUFZLENBQUE7SUFDWix5Q0FBSSxDQUFBO0lBQ0osMkNBQUssQ0FBQTtJQUNMLFdBQVc7SUFDWCx5REFBWSxDQUFBO0lBQ1osNkRBQWMsQ0FBQTtJQUNkLDBEQUFZLENBQUE7SUFDWix3REFBVyxDQUFBO0lBQ1gsMERBQVksQ0FBQTtJQUNaLHNEQUFVLENBQUE7SUFDVixrRUFBZ0IsQ0FBQTtJQUNoQix3REFBVyxDQUFBO0lBQ1gsd0RBQVcsQ0FBQTtJQUNYLGdFQUFlLENBQUE7SUFDZiw0REFBYSxDQUFBO0lBQ2Isa0VBQWdCLENBQUE7SUFDaEIsOERBQWMsQ0FBQTtJQUNkLGtFQUFnQixDQUFBO0lBQ2hCLDREQUFhLENBQUE7SUFDYiw4REFBYyxDQUFBO0lBQ2Qsb0VBQWlCLENBQUE7SUFDakIsMERBQVksQ0FBQTtJQUNaLG9EQUFTLENBQUE7SUFDVCxzREFBVSxDQUFBO0lBQ1YsNERBQWEsQ0FBQTtJQUNiLHdEQUFXLENBQUE7SUFDWCw4REFBYyxDQUFBO0lBQ2Qsb0RBQVMsQ0FBQTtJQUNULHdEQUFXLENBQUE7SUFDWCx3REFBVyxDQUFBO0lBQ1gsNERBQWEsQ0FBQTtJQUNiLDBEQUFZLENBQUE7SUFDWixnRUFBZSxDQUFBO0lBQ2Ysd0RBQVcsQ0FBQTtJQUNYLDBEQUFZLENBQUE7SUFDWixvRUFBaUIsQ0FBQTtJQUNqQixjQUFjO0lBQ2Qsa0JBQWtCO0lBQ2xCLGlCQUFpQjtJQUNqQixnQkFBZ0I7SUFDaEIs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QUFTO1FBQ3BFLG9DQUFvQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsbUJBQW1CLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztBQUNqSixDQUFDO0FBRUQsTUFBTSxVQUFVLGlCQUFpQixDQUFDLEVBQWE7SUFDM0MsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ1gsS0FBSSxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUM7UUFDWixDQUFDLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztLQUNoQztJQUNELE9BQU8sQ0FBQyxDQUFDO0FBQ2IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIFRva2VuVHlwZSB7XHJcbiAgICBpZGVudGlmaWVyLFxyXG4gICAgLy8gY29uc3RhbnRzXHJcbiAgICBpbnRlZ2VyQ29uc3RhbnQsXHJcbiAgICBmbG9hdGluZ1BvaW50Q29uc3RhbnQsXHJcbiAgICBib29sZWFuQ29uc3RhbnQsXHJcbiAgICBzdHJpbmdDb25zdGFudCxcclxuICAgIGNoYXJDb25zdGFudCxcclxuICAgIHRydWUsXHJcbiAgICBmYWxzZSxcclxuICAgIC8vIGtleXdvcmRzXHJcbiAgICBrZXl3b3JkUHJpbnQsXHJcbiAgICBrZXl3b3JkUHJpbnRsbixcclxuICAgIGtleXdvcmRDbGFzcyxcclxuICAgIGtleXdvcmRUaGlzLFxyXG4gICAga2V5d29yZFN1cGVyLFxyXG4gICAga2V5d29yZE5ldyxcclxuICAgIGtleXdvcmRJbnRlcmZhY2UsXHJcbiAgICBrZXl3b3JkRW51bSxcclxuICAgIGtleXdvcmRWb2lkLFxyXG4gICAga2V5d29yZEFic3RyYWN0LFxyXG4gICAga2V5d29yZFB1YmxpYyxcclxuICAgIGtleXdvcmRQcm90ZWN0ZWQsXHJcbiAgICBrZXl3b3JkUHJpdmF0ZSxcclxuICAgIGtleXdvcmRUcmFuc2llbnQsXHJcbiAgICBrZXl3b3JkU3RhdGljLFxyXG4gICAga2V5d29yZEV4dGVuZHMsXHJcbiAgICBrZXl3b3JkSW1wbGVtZW50cyxcclxuICAgIGtleXdvcmRXaGlsZSxcclxuICAgIGtleXdvcmREbyxcclxuICAgIGtleXdvcmRGb3IsXHJcbiAgICBrZXl3b3JkU3dpdGNoLFxyXG4gICAga2V5d29yZENhc2UsXHJcbiAgICBrZXl3b3JkRGVmYXVsdCxcclxuICAgIGtleXdvcmRJZixcclxuICAgIGtleXdvcmRUaGVuLFxyXG4gICAga2V5d29yZEVsc2UsXHJcbiAgICBrZXl3b3JkUmV0dXJuLFxyXG4gICAga2V5d29yZEJyZWFrLFxyXG4gICAga2V5d29yZENvbnRpbnVlLFxyXG4gICAga2V5d29yZE51bGwsXHJcbiAgICBrZXl3b3JkRmluYWwsXHJcbiAgICBrZXl3b3JkSW5zdGFuY2VvZixcclxuICAgIC8vIGtleXdvcmRJbnQsXHJcbiAgICAvLyBrZXl3b3JkQm9vbGVhbixcclxuICAgIC8vIGtleXdvcmRTdHJpbmcsXHJcbiAgICAvLyBrZXl3b3JkRmxvYXQsXHJcbiAgICAvLyBrZXl3b3JkQ2hhcixcclxuXHJcbiAgICAvLyBicmFja2V0c1xyXG4gICAgbGVmdEJyYWNrZXQsIC8vICgpXHJcbiAgICByaWdodEJyYWNrZXQsXHJcbiAgICBsZWZ0U3F1YXJlQnJhY2tldCwgLy8gW11cclxuICAgIHJpZ2h0U3F1YXJlQnJhY2tldCxcclxuICAgIGxlZnRDdXJseUJyYWNrZXQsIC8vIHt9XHJcbiAgICByaWdodEN1cmx5QnJhY2tldCxcclxuICAgIGxlZnRSaWdodFNxdWFyZUJyYWNrZXQsIC8vIFtdXHJcbiAgICBcclxuICAgIC8vIG9wZXJhdG9yc1xyXG4gICAgZG91YmxlTWludXMsIGRvdWJsZVBsdXMsXHJcblxyXG4gICAgLy8gYmluYXJ5IG9wZXJhdG9yc1xyXG4gICAgZG90LCAvLy5cclxuICAgIG1vZHVsbyxcclxuICAgIG1pbnVzLCBwbHVzLCBtdWx0aXBsaWNhdGlvbiwgZGl2aXNpb24sXHJcbiAgICBzaW5nbGVRdW90ZSwgZG91YmxlUXVvdGUsIC8vICcsIFwiXHJcbiAgICBsb3dlciwgZ3JlYXRlciwgbG93ZXJPckVxdWFsLCBncmVhdGVyT3JFcXVhbCwgXHJcbiAgICBlcXVhbCwgLy8gPT1cclxuICAgIG5vdEVxdWFsLCAvLyAhPVxyXG4gICAgYXNzaWdubWVudCwgLy8gPVxyXG4gICAgcGx1c0Fzc2lnbm1lbnQsIC8vICs9XHJcbiAgICBtaW51c0Fzc2lnbm1lbnQsIC8vIC09XHJcbiAgICBtdWx0aXBsaWNhdGlvbkFzc2lnbm1lbnQsIC8vICo9XHJcbiAgICBkaXZpc2lvbkFzc2lnbm1lbnQsIC8vIC89XHJcbiAgICBtb2R1bG9Bc3NpZ25tZW50LCAvLyAvJT1cclxuICAgIGFuZCwgb3IsICAgLy8gJiYsIHx8XHJcbiAgICBhbXBlcnNhbmQsIC8vICZcclxuXHJcbiAgICBBTkRBc3NpZ21lbnQsXHJcbiAgICBYT1JBc3NpZ21lbnQsXHJcbiAgICBPUkFzc2lnbWVudCxcclxuICAgIHNoaWZ0TGVmdEFzc2lnbWVudCxcclxuICAgIHNoaWZ0UmlnaHRBc3NpZ21lbnQsXHJcbiAgICBzaGlmdFJpZ2h0VW5zaWduZWRBc3NpZ21lbnQsXHJcbiAgICBPUiwgLy8gfFxyXG4gICAgWE9SLCAvLyBeXHJcbiAgICAvLyBBTkQsIC8vICYgc2VlIFRva2VuVHlwZS5hbXBlcnNhbmQgYWJvdmVcclxuICAgIHRpbGRlLCAvLyB+XHJcbiAgICBzaGlmdFJpZ2h0VW5zaWduZWQsIC8vID4+PlxyXG4gICAgc2hpZnRSaWdodCwgLy8gPj5cclxuICAgIHNoaWZ0TGVmdCwgLy8gPDxcclxuXHJcbiAgICB0ZXJuYXJ5T3BlcmF0b3IsXHJcbiAgICBjb2xvbiwgLy86XHJcbiAgICBlbGxpcHNpcywgLy8gLi4uXHJcblxyXG4gICAgbm90LCAgICAvLyAhXHJcbiAgICBcclxuICAgIC8vIHNlbWljb2xvblxyXG4gICAgc2VtaWNvbG9uLCAvLyA7XHJcblxyXG4gICAgLy8gY29tbWFcclxuICAgIGNvbW1hLCAvLyAsXHJcblxyXG4gICAgLy8gYmFja3NsYXNoXHJcbiAgICBiYWNrc2xhc2gsXHJcblxyXG4gICAgLy8gQFxyXG4gICAgYXQsXHJcblxyXG4gICAgLy8gd2hpdGVzcGFjZVxyXG4gICAgc3BhY2UsXHJcblxyXG4gICAgdGFiLFxyXG5cclxuICAgIC8vIG5ld2xpbmVcclxuICAgIG5ld2xpbmUsXHJcblxyXG4gICAgLy8gbGluZSBmZWVkXHJcbiAgICBsaW5lZmVlZCxcclxuXHJcbiAgICAvLyBvbmx5IGxleGVyLWludGVybmFsXHJcbiAgICBpZGVudGlmaWVyQ2hhciwgIC8vIG5vbmUgb2YgdGhlIHNwZWNpYWwgY2hhcnMgYWJvdmUgYS4uekEuLlpfw4TDti4uLlxyXG5cclxuICAgIC8vIENvbW1lbnRcclxuICAgIGNvbW1lbnQsXHJcblxyXG4gICAgLy8gdXNlZCBieSBwYXJzZXJcclxuICAgIG5lZ2F0aW9uLCBcclxuICAgIHJlZmVyZW5jZUVsZW1lbnQsIC8vIGZvciBhcnJheXNcclxuXHJcbiAgICBlbmRvZlNvdXJjZWNvZGUsIC8vIHdpbGwgYmUgZ2VuZXJhdGVkIGFmdGVyIHNvdXJjZWNvZGUgZW5kXHJcbiAgICBcclxuICAgIC8vIFByb2dyYW0gc3RhdGVtZW50IHR5cGVzOlxyXG4gICAgYmluYXJ5T3AsIC8vICssIC0sICosIDw9LCAuLi5cclxuICAgIHVuYXJ5T3AsIC8vICEgYW5kIC0gXHJcbiAgICBsb2NhbFZhcmlhYmxlRGVjbGFyYXRpb24sXHJcbiAgICBoZWFwVmFyaWFibGVEZWNsYXJhdGlvbixcclxuICAgIHB1c2hMb2NhbFZhcmlhYmxlVG9TdGFjaywgLy8gcHVzaCB2YWx1ZSBvZiBhIGxvY2FsIHZhcmlhYmxlIHRvIHN0YWNrXHJcbiAgICBwb3BBbmRTdG9yZUludG9WYXJpYWJsZSxcclxuICAgIHB1c2hGcm9tSGVhcFRvU3RhY2ssIC8vIHB1c2ggdmFsdWUgZnJvbSBoZWFwIHRvIHN0YWNrXHJcbiAgICBwdXNoQXR0cmlidXRlLCAvLyB2YWx1ZSBvZiBhIGF0dHJpYnV0ZSB0byBzdGFja1xyXG4gICAgcHVzaEFycmF5TGVuZ3RoLCBcclxuICAgIHB1c2hDb25zdGFudCwgLy8gbGl0ZXJhbFxyXG4gICAgcHVzaFN0YXRpY0NsYXNzT2JqZWN0LCAvLyBwdXNoIGNsYXNzLU9iamVjdCB0byBzdGFjayAod2hpY2ggaG9sZHMgc3RhdGljIGF0dHJpYnV0ZXMpXHJcbiAgICBwdXNoU3RhdGljQXR0cmlidXRlLCAvLyBwdXNoIHN0YXRpYyBhdHRyaWJ1dGUgdG8gc3RhY2tcclxuICAgIHB1c2hTdGF0aWNBdHRyaWJ1dGVJbnRyaW5zaWMsIC8vIHB1c2ggc3RhdGljIGF0dHJpYnV0ZSB0byBzdGFja1xyXG4gICAgY2hlY2tDYXN0LCAvLyBjaGVjayBpZiBvYmplY3QgbWF5IGdldCBjYXN0ZWQgdG8gY2xhc3Mgb3IgaW50ZXJmYWNlXHJcbiAgICBjYXN0VmFsdWUsIC8vIGNhc3QgdmFsdWUgb24gdG9wIG9mIHN0YWNrIHRvIG90aGVyIHR5cGVcclxuICAgIHNlbGVjdEFycmF5RWxlbWVudCwgLy8gc2VsZWN0IEVsZW1lbnQgZnJvbSBBcnJheSAoZS5nLiBhWzIwXSlcclxuICAgIGNhbGxNZXRob2QsXHJcbiAgICBjYWxsTWFpbk1ldGhvZCxcclxuICAgIHByb2Nlc3NQb3N0Q29uc3RydWN0b3JDYWxsYmFja3MsIFxyXG4gICAgY2FsbElucHV0TWV0aG9kLCAvLyBNZXRob2RzIG9mIElucHV0IGNsYXNzXHJcbiAgICBtYWtlRWxsaXBzaXNBcnJheSxcclxuICAgIGRlY3JlYXNlU3RhY2twb2ludGVyLCAvLyBkZWNyZWFzZSBzdGFjay1wb2ludGVyLCBub3RoaW5nIGVsc2VcclxuICAgIGluaXRTdGFja2ZyYW1lLFxyXG4gICAgY2xvc2VTdGFja2ZyYW1lLFxyXG4gICAgaW5jcmVhc2VTcGFjZUZvckxvY2FsVmFyaWFibGVzLFxyXG4gICAgcmV0dXJuLFxyXG4gICAgbmV3T2JqZWN0LFxyXG4gICAganVtcElmRmFsc2UsXHJcbiAgICBqdW1wSWZUcnVlLFxyXG4gICAganVtcElmRmFsc2VBbmRMZWF2ZU9uU3RhY2ssXHJcbiAgICBqdW1wSWZUcnVlQW5kTGVhdmVPblN0YWNrLFxyXG4gICAganVtcEFsd2F5cyxcclxuICAgIG5vT3AsIC8vIGFjdHMgYXMganVtcCBkZXN0aW5hdGlvblxyXG4gICAgaW5jcmVtZW50RGVjcmVtZW50QmVmb3JlLCAvLyArK2ksIC0taVxyXG4gICAgaW5jcmVtZW50RGVjcmVtZW50QWZ0ZXIsIC8vIGkrKywgaS0tXHJcbiAgICBwcm9ncmFtRW5kLFxyXG4gICAgYmVnaW5BcnJheSwgLy8gcHVzaCBlbXB0eSBhcnJheSB0byBzdGFja1xyXG4gICAgYWRkVG9BcnJheSwgLy8gcG9wIGVsZW1lbnQgZm9ybSBzdGFjayBhbmQgYWRkIGl0IHRvIGFycmF5IChvbiBzZWNvbmQgc3RhY2sgcG9zaXRpb24pXHJcbiAgICBwdXNoRW1wdHlBcnJheSwgLy8gcHVzaCBtdWx0aWRpbWVuc2lvbmFsIGVtcHR5IGFycmF5IHRvIHN0YWNrXHJcbiAgICBmb3JMb29wT3ZlckNvbGxlY3Rpb24sXHJcblxyXG4gICAgLy8gYWRkaXRpb25hbCBBU1Qgbm9kZSB0eXBlc1xyXG4gICAgdHlwZSwgLy8gZS5nLiBpbnRbXVtdXHJcbiAgICB0eXBlUGFyYW1ldGVyLCAvLyBlLmcuIDxFIGV4dGVuZHMgU3RyaW5nIGltcGxlbWVudHMgQ29tcGFyYWJsZTxFPj5cclxuICAgIGF0dHJpYnV0ZURlY2xhcmF0aW9uLFxyXG4gICAgbWV0aG9kRGVjbGFyYXRpb24sXHJcbiAgICBwYXJhbWV0ZXJEZWNsYXJhdGlvbixcclxuICAgIHN1cGVyQ29uc3RydWN0b3JDYWxsLFxyXG4gICAgY29uc3RydWN0b3JDYWxsLCAgICAgICAvLyBjYWxsIGNvbnN0cnVjdG9yIHdpdGggdGhpcygpIGluc2lkZSBhbm90aGVyIGNvbnN0cnVjdG9yXHJcbiAgICBuZXdBcnJheSxcclxuICAgIGFycmF5SW5pdGlhbGl6YXRpb24sXHJcbiAgICBwcmludCxcclxuICAgIHByaW50bG4sIFxyXG4gICAgcHVzaEVudW1WYWx1ZSxcclxuICAgIGluaXRpYWxpemVFbnVtVmFsdWUsIFxyXG4gICAgc2NvcGVOb2RlLFxyXG4gICAgcmV0dXJuSWZEZXN0cm95ZWQsXHJcbiAgICBleHRlbmRlZEZvckxvb3BJbml0LFxyXG4gICAgZXh0ZW5kZWRGb3JMb29wQ2hlY2tDb3VudGVyQW5kR2V0RWxlbWVudCxcclxuICAgIHNldFBhdXNlRHVyYXRpb24sXHJcbiAgICBwYXVzZVxyXG59XHJcblxyXG5leHBvcnQgdmFyIFRva2VuVHlwZVJlYWRhYmxlOiB7W3R0OiBudW1iZXJdOiBzdHJpbmd9ID0ge1xyXG4gICAgW1Rva2VuVHlwZS5pZGVudGlmaWVyXTogXCJlaW4gQmV6ZWljaG5lclwiLFxyXG4gICAgLy8gY29uc3RhbnRzXHJcbiAgICBbVG9rZW5UeXBlLmludGVnZXJDb25zdGFudF06IFwiZWluZSBJbnRlZ2VyLUtvbnN0YW50ZVwiLFxyXG4gICAgW1Rva2VuVHlwZS5mbG9hdGluZ1BvaW50Q29uc3RhbnRdOiBcImVpbmUgRmxpZcOfa29tbWEtS29uc3RhbnRlXCIsXHJcbiAgICBbVG9rZW5UeXBlLmJvb2xlYW5Db25zdGFudF06IFwiZWluZSBib29sZXNjaGUgS29uc3RhbnRlXCIsXHJcbiAgICBbVG9rZW5UeXBlLnN0cmluZ0NvbnN0YW50XTogXCJlaW5lIFplaWNoZW5rZXR0ZW4tS29uc3RhbnRlXCIsXHJcbiAgICBbVG9rZW5UeXBlLmNoYXJDb25zdGFudF06IFwiZWluZSBjaGFyLUtvbnN0YW50ZVwiLFxyXG4gICAgW1Rva2VuVHlwZS50cnVlXTogXCJ0cnVlXCIsXHJcbiAgICBbVG9rZW5UeXBlLmZhbHNlXTogXCJmYWxzZVwiLFxyXG4gICAgLy8ga2V5d29yZHNcclxuICAgIFtUb2tlblR5cGUua2V5d29yZENsYXNzXTogXCJjbGFzc1wiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkVGhpc106IFwidGhpc1wiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkU3VwZXJdOiBcInN1cGVyXCIsXHJcbiAgICBbVG9rZW5UeXBlLmtleXdvcmROZXddOiBcIm5ld1wiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkSW50ZXJmYWNlXTogXCJpbnRlcmZhY2VcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZEVudW1dOiBcImVudW1cIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZFZvaWRdOiBcInZvaWRcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZEFic3RyYWN0XTogXCJhYnN0cmFjdFwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkUHVibGljXTogXCJwdWJsaWNcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZFByb3RlY3RlZF06IFwicHJvdGVjdGVkXCIsXHJcbiAgICBbVG9rZW5UeXBlLmtleXdvcmRQcml2YXRlXTogXCJwcml2YXRlXCIsXHJcbiAgICBbVG9rZW5UeXBlLmtleXdvcmRUcmFuc2llbnRdOiBcInRyYW5zaWVudFwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkU3RhdGljXTogXCJzdGF0aWNcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZEV4dGVuZHNdOiBcImV4dGVuZHNcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZEltcGxlbWVudHNdOiBcImltcGxlbWVudHNcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZFdoaWxlXTogXCJ3aGlsZVwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkRG9dOiBcImRvXCIsXHJcbiAgICBbVG9rZW5UeXBlLmtleXdvcmRGb3JdOiBcImZvclwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkU3dpdGNoXTogXCJzd2l0Y2hcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZENhc2VdOiBcImNhc2VcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZERlZmF1bHRdOiBcImRlZmF1bHRcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZElmXTogXCJpZlwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkVGhlbl06IFwidGhlblwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkRWxzZV06IFwiZWxzZVwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkUmV0dXJuXTogXCJyZXR1cm5cIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZEJyZWFrXTogXCJicmVha1wiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkQ29udGludWVdOiBcImNvbnRpbnVlXCIsXHJcbiAgICBbVG9rZW5UeXBlLmtleXdvcmROdWxsXTogXCJudWxsXCIsXHJcbiAgICBbVG9rZW5UeXBlLmtleXdvcmRGaW5hbF06IFwiZmluYWxcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZEluc3RhbmNlb2ZdOiBcImluc3RhbmNlb2ZcIixcclxuICAgIFtUb2tlblR5cGUua2V5d29yZFByaW50XTogXCJwcmludFwiLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkUHJpbnRsbl06IFwicHJpbnRsblwiLFxyXG4gICAgLy8ga2V5d29yZEludCxcclxuICAgIC8vIGtleXdvcmRCb29sZWFuLFxyXG4gICAgLy8ga2V5d29yZFN0cmluZyxcclxuICAgIC8vIGtleXdvcmRGbG9hdCxcclxuICAgIC8vIGtleXdvcmRDaGFyLFxyXG5cclxuICAgIC8vIGJyYWNrZXRzXHJcbiAgICBbVG9rZW5UeXBlLmxlZnRCcmFja2V0XTogXCIoXCIsIC8vICgpXHJcbiAgICBbVG9rZW5UeXBlLnJpZ2h0QnJhY2tldF06IFwiKVwiLFxyXG4gICAgW1Rva2VuVHlwZS5sZWZ0U3F1YXJlQnJhY2tldF06IFwiW1wiLCAvLyBbXVxyXG4gICAgW1Rva2VuVHlwZS5yaWdodFNxdWFyZUJyYWNrZXRdOiBcIl1cIixcclxuICAgIFtUb2tlblR5cGUubGVmdEN1cmx5QnJhY2tldF06IFwie1wiLCAvLyB7fVxyXG4gICAgW1Rva2VuVHlwZS5yaWdodEN1cmx5QnJhY2tldF06IFwifVwiLFxyXG4gICAgW1Rva2VuVHlwZS5sZWZ0UmlnaHRTcXVhcmVCcmFja2V0XTogXCJbXVwiLCBcclxuICAgIFxyXG4gICAgLy8gb3BlcmF0b3JzXHJcbiAgICBbVG9rZW5UeXBlLmRvdF06IFwiLlwiLCAvLy5cclxuICAgIFtUb2tlblR5cGUubWludXNdOiBcIi1cIiwgXHJcbiAgICBbVG9rZW5UeXBlLm1vZHVsb106IFwiJVwiLCBcclxuICAgIFtUb2tlblR5cGUucGx1c106IFwiK1wiLCBcclxuICAgIFtUb2tlblR5cGUubXVsdGlwbGljYXRpb25dOiBcIipcIiwgXHJcbiAgICBbVG9rZW5UeXBlLmRpdmlzaW9uXTogXCIvXCIsXHJcbiAgICBbVG9rZW5UeXBlLnNpbmdsZVF1b3RlXTogXCInXCIsIFxyXG4gICAgW1Rva2VuVHlwZS5kb3VibGVRdW90ZV06IFwiXFxcIlwiLCAvLyAnXTogXCJcIiwgXCJcclxuICAgIFtUb2tlblR5cGUuZG91YmxlTWludXNdOiBcIi0tXCIsIFxyXG4gICAgW1Rva2VuVHlwZS5kb3VibGVQbHVzXTogXCIrK1wiLFxyXG4gICAgW1Rva2VuVHlwZS5sb3dlcl06IFwiPFwiLCBcclxuICAgIFtUb2tlblR5cGUuZ3JlYXRlcl06IFwiPlwiLCBcclxuICAgIFtUb2tlblR5cGUubG93ZXJPckVxdWFsXTogXCI8PVwiLCBcclxuICAgIFtUb2tlblR5cGUuZ3JlYXRlck9yRXF1YWxdOiBcIj49XCIsIFxyXG4gICAgW1Rva2VuVHlwZS5lcXVhbF06IFwiPT1cIiwgLy8gPT1cclxuICAgIFtUb2tlblR5cGUubm90RXF1YWxdOiBcIiE9XCIsIC8vICE9XHJcbiAgICBbVG9rZW5UeXBlLmFzc2lnbm1lbnRdOiBcIj1cIiwgLy8gPVxyXG4gICAgW1Rva2VuVHlwZS5wbHVzQXNzaWdubWVudF06IFwiKz1cIiwgLy8gKz1cclxuICAgIFtUb2tlblR5cGUubWludXNBc3NpZ25tZW50XTogXCItPVwiLCAvLyAtPVxyXG4gICAgW1Rva2VuVHlwZS5tdWx0aXBsaWNhdGlvbkFzc2lnbm1lbnRdOiBcIio9XCIsIC8vICo9XHJcbiAgICBbVG9rZW5UeXBlLmRpdmlzaW9uQXNzaWdubWVudF06IFwiLz1cIiwgLy8gLz1cclxuICAgIFtUb2tlblR5cGUubW9kdWxvQXNzaWdubWVudF06IFwiJT1cIixcclxuICAgIFtUb2tlblR5cGUuYW1wZXJzYW5kXTogXCImXCIsIFxyXG4gICAgW1Rva2VuVHlwZS5hbmRdOiBcIiYmXCIsIFxyXG4gICAgW1Rva2VuVHlwZS5vcl06IFwifHxcIiwgXHJcbiAgICBbVG9rZW5UeXBlLm5vdF06IFwiIVwiLCBcclxuXHJcbiAgICBbVG9rZW5UeXBlLkFOREFzc2lnbWVudF06IFwiJj1cIixcclxuICAgIFtUb2tlblR5cGUuWE9SQXNzaWdtZW50XTogXCJePVwiLFxyXG4gICAgW1Rva2VuVHlwZS5PUkFzc2lnbWVudF06IFwifD1cIixcclxuICAgIFtUb2tlblR5cGUuc2hpZnRMZWZ0QXNzaWdtZW50XTogXCI8PD1cIixcclxuICAgIFtUb2tlblR5cGUuc2hpZnRSaWdodEFzc2lnbWVudF06IFwiPj49XCIsXHJcbiAgICBbVG9rZW5UeXBlLnNoaWZ0UmlnaHRVbnNpZ25lZEFzc2lnbWVudF06IFwiPj4+PVwiLFxyXG4gICAgLy8gW1Rva2VuVHlwZS5BTkRdOiBcIiZcIiwgXHJcbiAgICBbVG9rZW5UeXBlLk9SXTogXCJ8XCIsXHJcbiAgICBbVG9rZW5UeXBlLlhPUl06IFwiXlwiLFxyXG4gICAgW1Rva2VuVHlwZS50aWxkZV06IFwiflwiLFxyXG4gICAgW1Rva2VuVHlwZS5zaGlmdExlZnRdOiBcIjw8XCIsXHJcbiAgICBbVG9rZW5UeXBlLnNoaWZ0UmlnaHRdOiBcIj4+XCIsXHJcbiAgICBbVG9rZW5UeXBlLnNoaWZ0UmlnaHRVbnNpZ25lZF06IFwiPj4+XCIsXHJcblxyXG5cclxuICAgIFtUb2tlblR5cGUudGVybmFyeU9wZXJhdG9yXTogXCI/XCIsIFxyXG4gICAgXHJcbiAgICAvLyBzZW1pY29sb25cclxuICAgIFtUb2tlblR5cGUuc2VtaWNvbG9uXTogXCI7XCIsIC8vIDtcclxuXHJcbiAgICBbVG9rZW5UeXBlLmNvbG9uXTogXCI6XCIsIC8vIDtcclxuICAgIFtUb2tlblR5cGUuZWxsaXBzaXNdOiBcIi4uLlwiLCAvLyA7XHJcblxyXG4gICAgLy8gY29tbWFcclxuICAgIFtUb2tlblR5cGUuY29tbWFdOiBcIixcIiwgXHJcblxyXG4gICAgLy8gYmFja3NsYXNoXHJcbiAgICBbVG9rZW5UeXBlLmJhY2tzbGFzaF06IFwiXFxcXFwiLFxyXG5cclxuICAgIC8vIGF0XHJcbiAgICBbVG9rZW5UeXBlLmF0XTogXCJAXCIsXHJcblxyXG4gICAgLy8gd2hpdGVzcGFjZVxyXG4gICAgW1Rva2VuVHlwZS5zcGFjZV06IFwiZWluIExlZXJ6ZWljaGVuXCIsXHJcbiAgICBbVG9rZW5UeXBlLnRhYl06IFwiZWluIFRhYnVsYXRvcnplaWNoZW5cIixcclxuXHJcbiAgICAvLyBuZXdsaW5lXHJcbiAgICBbVG9rZW5UeXBlLm5ld2xpbmVdOiBcImVpbiBaZWlsZW51bWJydWNoXCIsXHJcblxyXG4gICAgLy8gb25seSBsZXhlci1pbnRlcm5hbFxyXG4gICAgW1Rva2VuVHlwZS5pZGVudGlmaWVyQ2hhcl06IFwiZWluZXMgZGVyIFplaWNoZW4gYS4ueiwgQS4uWiwgX1wiLCAgLy8gbm9uZSBvZiB0aGUgc3BlY2lhbCBjaGFycyBhYm92ZSBhLi56QS4uWl/DhMO2Li4uXHJcblxyXG4gICAgLy8gQ29tbWVudFxyXG4gICAgW1Rva2VuVHlwZS5jb21tZW50XTogXCJlaW4gS29tbWVudGFyXCIsXHJcblxyXG4gICAgW1Rva2VuVHlwZS5lbmRvZlNvdXJjZWNvZGVdOiBcImRhcyBFbmRlIGRlcyBQcm9ncmFtbWVzXCJcclxuXHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgc3BlY2lhbENoYXJMaXN0OiB7W2tleXdvcmQ6IHN0cmluZ106VG9rZW5UeXBlfSA9IHtcclxuICAgICcoJzogVG9rZW5UeXBlLmxlZnRCcmFja2V0LCAvLyAoKVxyXG4gICAgJyknOiBUb2tlblR5cGUucmlnaHRCcmFja2V0LFxyXG4gICAgJ1snOiBUb2tlblR5cGUubGVmdFNxdWFyZUJyYWNrZXQsIC8vIFtdXHJcbiAgICAnXSc6IFRva2VuVHlwZS5yaWdodFNxdWFyZUJyYWNrZXQsXHJcbiAgICAneyc6IFRva2VuVHlwZS5sZWZ0Q3VybHlCcmFja2V0LCAvLyB7fVxyXG4gICAgJ30nOiBUb2tlblR5cGUucmlnaHRDdXJseUJyYWNrZXQsXHJcbiAgICBcclxuICAgIC8vIG9wZXJhdG9yc1xyXG4gICAgJy4nOiBUb2tlblR5cGUuZG90LCAvLy5cclxuICAgICcsJzogVG9rZW5UeXBlLmNvbW1hLCAvLy5cclxuICAgICctJzogVG9rZW5UeXBlLm1pbnVzLFxyXG4gICAgJyUnOiBUb2tlblR5cGUubW9kdWxvLFxyXG4gICAgJysnOiBUb2tlblR5cGUucGx1cywgXHJcbiAgICAnKic6IFRva2VuVHlwZS5tdWx0aXBsaWNhdGlvbiwgXHJcbiAgICAnLyc6IFRva2VuVHlwZS5kaXZpc2lvbixcclxuICAgICdcXFxcJzogVG9rZW5UeXBlLmJhY2tzbGFzaCxcclxuICAgICdAJzogVG9rZW5UeXBlLmF0LFxyXG4gICAgJ1xcJyc6IFRva2VuVHlwZS5zaW5nbGVRdW90ZSwgXHJcbiAgICAnXCInOiBUb2tlblR5cGUuZG91YmxlUXVvdGUsIC8vICcsIFwiXHJcbiAgICBcIjxcIjogVG9rZW5UeXBlLmxvd2VyLFxyXG4gICAgXCI+XCI6IFRva2VuVHlwZS5ncmVhdGVyLFxyXG4gICAgXCI9XCI6IFRva2VuVHlwZS5hc3NpZ25tZW50LFxyXG4gICAgXCImXCI6IFRva2VuVHlwZS5hbmQsXHJcbiAgICBcInxcIjogVG9rZW5UeXBlLm9yLFxyXG4gICAgXCIhXCI6IFRva2VuVHlwZS5ub3QsXHJcbiAgICBcIj9cIjogVG9rZW5UeXBlLnRlcm5hcnlPcGVyYXRvcixcclxuXHJcbiAgICBcIl5cIjogVG9rZW5UeXBlLlhPUixcclxuICAgIFwiflwiOiBUb2tlblR5cGUudGlsZGUsXHJcbiAgICBcclxuICAgICc7JzogVG9rZW5UeXBlLnNlbWljb2xvbiwgLy8gO1xyXG4gICAgJzonOiBUb2tlblR5cGUuY29sb24sIC8vIDtcclxuXHJcbiAgICAnLi4uJzogVG9rZW5UeXBlLmVsbGlwc2lzLFxyXG5cclxuICAgIC8vIHdoaXRlc3BhY2VcclxuICAgICcgJzogVG9rZW5UeXBlLnNwYWNlLFxyXG4gICAgJ1xcdCc6IFRva2VuVHlwZS50YWIsXHJcblxyXG4gICAgLy8gbmV3bGluZVxyXG4gICAgJ1xcbic6IFRva2VuVHlwZS5uZXdsaW5lLFxyXG4gICAgJ1xccic6IFRva2VuVHlwZS5saW5lZmVlZFxyXG59XHJcblxyXG5leHBvcnQgdmFyIGtleXdvcmRMaXN0OiB7W2tleXdvcmQ6IHN0cmluZ106VG9rZW5UeXBlfSA9IHtcclxuICAgIFwiY2xhc3NcIjogVG9rZW5UeXBlLmtleXdvcmRDbGFzcyxcclxuICAgIFwidGhpc1wiOiBUb2tlblR5cGUua2V5d29yZFRoaXMsXHJcbiAgICBcInN1cGVyXCI6IFRva2VuVHlwZS5rZXl3b3JkU3VwZXIsXHJcbiAgICBcIm5ld1wiOiBUb2tlblR5cGUua2V5d29yZE5ldyxcclxuICAgIFwiaW50ZXJmYWNlXCI6IFRva2VuVHlwZS5rZXl3b3JkSW50ZXJmYWNlLFxyXG4gICAgXCJlbnVtXCI6IFRva2VuVHlwZS5rZXl3b3JkRW51bSxcclxuICAgIFwidm9pZFwiOiBUb2tlblR5cGUua2V5d29yZFZvaWQsXHJcbiAgICBcImFic3RyYWN0XCI6IFRva2VuVHlwZS5rZXl3b3JkQWJzdHJhY3QsXHJcbiAgICBcInB1YmxpY1wiOiBUb2tlblR5cGUua2V5d29yZFB1YmxpYyxcclxuICAgIFwicHJvdGVjdGVkXCI6IFRva2VuVHlwZS5rZXl3b3JkUHJvdGVjdGVkLFxyXG4gICAgXCJwcml2YXRlXCI6IFRva2VuVHlwZS5rZXl3b3JkUHJpdmF0ZSxcclxuICAgIFwidHJhbnNpZW50XCI6IFRva2VuVHlwZS5rZXl3b3JkVHJhbnNpZW50LFxyXG4gICAgXCJzdGF0aWNcIjogVG9rZW5UeXBlLmtleXdvcmRTdGF0aWMsXHJcbiAgICBcImV4dGVuZHNcIjogVG9rZW5UeXBlLmtleXdvcmRFeHRlbmRzLFxyXG4gICAgXCJpbXBsZW1lbnRzXCI6IFRva2VuVHlwZS5rZXl3b3JkSW1wbGVtZW50cyxcclxuICAgIFwid2hpbGVcIjogVG9rZW5UeXBlLmtleXdvcmRXaGlsZSxcclxuICAgIFwiZG9cIjogVG9rZW5UeXBlLmtleXdvcmREbyxcclxuICAgIFwiZm9yXCI6IFRva2VuVHlwZS5rZXl3b3JkRm9yLFxyXG4gICAgXCJzd2l0Y2hcIjogVG9rZW5UeXBlLmtleXdvcmRTd2l0Y2gsXHJcbiAgICBcImNhc2VcIjogVG9rZW5UeXBlLmtleXdvcmRDYXNlLFxyXG4gICAgXCJkZWZhdWx0XCI6IFRva2VuVHlwZS5rZXl3b3JkRGVmYXVsdCxcclxuICAgIFwiaWZcIjogVG9rZW5UeXBlLmtleXdvcmRJZixcclxuICAgIFwidGhlblwiOiBUb2tlblR5cGUua2V5d29yZFRoZW4sXHJcbiAgICBcImVsc2VcIjogVG9rZW5UeXBlLmtleXdvcmRFbHNlLFxyXG4gICAgXCJyZXR1cm5cIjogVG9rZW5UeXBlLmtleXdvcmRSZXR1cm4sXHJcbiAgICBcImJyZWFrXCI6IFRva2VuVHlwZS5rZXl3b3JkQnJlYWssXHJcbiAgICBcImNvbnRpbnVlXCI6IFRva2VuVHlwZS5rZXl3b3JkQ29udGludWUsXHJcbiAgICBcIm51bGxcIjogVG9rZW5UeXBlLmtleXdvcmROdWxsLFxyXG4gICAgXCJmaW5hbFwiOiBUb2tlblR5cGUua2V5d29yZEZpbmFsLFxyXG4gICAgXCJpbnN0YW5jZW9mXCI6IFRva2VuVHlwZS5rZXl3b3JkSW5zdGFuY2VvZixcclxuICAgIFwidHJ1ZVwiOiBUb2tlblR5cGUudHJ1ZSxcclxuICAgIFwiZmFsc2VcIjogVG9rZW5UeXBlLmZhbHNlLFxyXG4gICAgXCJwcmludFwiOiBUb2tlblR5cGUua2V5d29yZFByaW50LFxyXG4gICAgXCJwcmludGxuXCI6IFRva2VuVHlwZS5rZXl3b3JkUHJpbnRsbixcclxuICAgIC8vIFwiaW50XCI6IFRva2VuVHlwZS5rZXl3b3JkSW50LFxyXG4gICAgLy8gXCJib29sZWFuXCI6IFRva2VuVHlwZS5rZXl3b3JkQm9vbGVhbixcclxuICAgIC8vIFwiU3RyaW5nXCI6IFRva2VuVHlwZS5rZXl3b3JkU3RyaW5nLFxyXG4gICAgLy8gXCJmbG9hdFwiOiBUb2tlblR5cGUua2V5d29yZEZsb2F0LFxyXG4gICAgLy8gXCJjaGFyXCI6IFRva2VuVHlwZS5rZXl3b3JkQ2hhclxyXG59O1xyXG5cclxuZXhwb3J0IHZhciBFc2NhcGVTZXF1ZW5jZUxpc3Q6IHtba2V5d29yZDogc3RyaW5nXTpzdHJpbmd9ID0ge1xyXG4gICAgXCJuXCI6IFwiXFxuXCIsXHJcbiAgICBcInJcIjogXCJcXHJcIixcclxuICAgIFwidFwiOiBcIlxcdFwiLFxyXG4gICAgXCJcXFwiXCI6IFwiXFxcIlwiLFxyXG4gICAgXCInXCI6IFwiJ1wiLFxyXG4gICAgXCJcXFxcXCI6IFwiXFxcXFwiXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFRleHRQb3NpdGlvbiA9IHtcclxuICAgIGxpbmU6IG51bWJlcixcclxuICAgIGNvbHVtbjogbnVtYmVyLCBcclxuICAgIGxlbmd0aDogbnVtYmVyXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFRleHRQb3NpdGlvbldpdGhvdXRMZW5ndGggPSB7XHJcbiAgICBsaW5lOiBudW1iZXIsXHJcbiAgICBjb2x1bW46IG51bWJlclxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBUb2tlbiA9IHtcclxuICAgIHR0OiBUb2tlblR5cGUsXHJcbiAgICB2YWx1ZTogc3RyaW5nfG51bWJlcnxib29sZWFuLFxyXG4gICAgcG9zaXRpb246IFRleHRQb3NpdGlvbixcclxuICAgIGNvbW1lbnRCZWZvcmU/OiBUb2tlblxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBUb2tlbkxpc3QgPSBUb2tlbltdO1xyXG5cclxuZnVuY3Rpb24gdG9rZW5Ub1N0cmluZyh0OiBUb2tlbil7XHJcbiAgICByZXR1cm4gXCI8ZGl2PjxzcGFuIHN0eWxlPSdmb250LXdlaWdodDogYm9sZCc+XCIgKyBUb2tlblR5cGVbdC50dF0gKyBcIjwvc3Bhbj5cIiArXHJcbiAgICAgICAgICAgIFwiPHNwYW4gc3R5bGU9J2NvbG9yOiBibHVlJz4gJm5ic3A7J1wiICsgdC52YWx1ZSArIFwiJzwvc3Bhbj4gKGwmbmJzcDtcIiArIHQucG9zaXRpb24ubGluZSArIFwiLCBjJm5ic3A7XCIgKyB0LnBvc2l0aW9uLmNvbHVtbiArIFwiKTwvZGl2PlwiO1xyXG59XHJcbiBcclxuZXhwb3J0IGZ1bmN0aW9uIHRva2VuTGlzdFRvU3RyaW5nKHRsOiBUb2tlbkxpc3QpOnN0cmluZ3tcclxuICAgIGxldCBzID0gXCJcIjtcclxuICAgIGZvcihsZXQgdCBvZiB0bCl7XHJcbiAgICAgICAgcyArPSB0b2tlblRvU3RyaW5nKHQpICsgXCJcXG5cIjtcclxuICAgIH1cclxuICAgIHJldHVybiBzO1xyXG59Il19