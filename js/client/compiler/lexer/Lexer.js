import { specialCharList, TokenType, EscapeSequenceList, keywordList, TokenTypeReadable } from "./Token.js";
var LexerState;
(function (LexerState) {
    LexerState[LexerState["number"] = 0] = "number";
    LexerState[LexerState["identifier"] = 1] = "identifier";
    LexerState[LexerState["stringConstant"] = 2] = "stringConstant";
    LexerState[LexerState["characterConstant"] = 3] = "characterConstant";
    LexerState[LexerState["multilineComment"] = 4] = "multilineComment";
    LexerState[LexerState["EndoflineComment"] = 5] = "EndoflineComment";
})(LexerState || (LexerState = {}));
var endChar = "►"; // \u10000
export class Lexer {
    constructor() {
        this.spaceTokens = [
            TokenType.space, TokenType.tab, TokenType.newline
        ];
        this.correspondingBracket = {};
        this.correspondingBracket[TokenType.leftBracket] = TokenType.rightBracket;
        this.correspondingBracket[TokenType.leftCurlyBracket] = TokenType.rightCurlyBracket;
        this.correspondingBracket[TokenType.leftSquareBracket] = TokenType.rightSquareBracket;
        this.correspondingBracket[TokenType.rightBracket] = TokenType.leftBracket;
        this.correspondingBracket[TokenType.rightCurlyBracket] = TokenType.leftCurlyBracket;
        this.correspondingBracket[TokenType.rightSquareBracket] = TokenType.leftSquareBracket;
    }
    lex(input) {
        this.input = input.replace("\u00a0", " ");
        this.tokenList = [];
        this.errorList = [];
        this.bracketError = null;
        this.bracketStack = [];
        this.pos = 0;
        this.line = 1;
        this.column = 1;
        this.nonSpaceLastTokenType = null;
        if (input.length == 0) {
            return { tokens: this.tokenList, errors: this.errorList, bracketError: null };
        }
        this.currentChar = input.charAt(0);
        this.nextChar = input.length > 1 ? input.charAt(1) : endChar;
        while (this.currentChar != endChar) {
            this.mainState();
        }
        if (this.bracketStack.length > 0) {
            let bracketOpen = this.bracketStack.pop();
            let bracketClosed = this.correspondingBracket[bracketOpen];
            this.setBracketError(TokenTypeReadable[bracketOpen] + " " + TokenTypeReadable[bracketClosed]);
        }
        return {
            tokens: this.tokenList,
            errors: this.errorList,
            bracketError: this.bracketError
        };
    }
    checkClosingBracket(tt) {
        if (this.bracketStack.length == 0) {
            let bracketOpen = this.correspondingBracket[tt];
            this.setBracketError(TokenTypeReadable[bracketOpen] + " " + TokenTypeReadable[tt]);
            return;
        }
        let openBracket = this.bracketStack.pop();
        let correspondingBracket = this.correspondingBracket[openBracket];
        if (tt != correspondingBracket) {
            this.setBracketError(TokenTypeReadable[openBracket] + " " + TokenTypeReadable[correspondingBracket]);
        }
    }
    setBracketError(error) {
        if (this.bracketError == null)
            this.bracketError = error;
    }
    next() {
        this.pos++;
        this.currentChar = this.nextChar;
        if (this.pos + 1 < this.input.length) {
            this.nextChar = this.input.charAt(this.pos + 1);
        }
        else {
            this.nextChar = endChar;
        }
        this.column++; // column of current char
    }
    mainState() {
        let char = this.currentChar;
        let specialCharToken = specialCharList[char];
        if (specialCharToken != null) {
            switch (specialCharToken) {
                case TokenType.leftSquareBracket:
                    if (this.nextChar == "]") {
                        this.pushToken(TokenType.leftRightSquareBracket, "[]");
                        this.next();
                        this.next();
                        return;
                    }
                    else {
                        this.pushToken(TokenType.leftSquareBracket, "[");
                        this.bracketStack.push(specialCharToken);
                        this.next();
                        return;
                    }
                case TokenType.rightSquareBracket:
                    this.checkClosingBracket(specialCharToken);
                    break;
                case TokenType.leftBracket:
                    this.bracketStack.push(specialCharToken);
                    break;
                case TokenType.rightBracket:
                    this.checkClosingBracket(specialCharToken);
                    break;
                case TokenType.leftCurlyBracket:
                    this.bracketStack.push(specialCharToken);
                    break;
                case TokenType.rightCurlyBracket:
                    this.checkClosingBracket(specialCharToken);
                    break;
                case TokenType.and:
                    if (this.nextChar == "&") {
                        this.pushToken(TokenType.and, "&&");
                        this.next();
                        this.next();
                        return;
                    }
                    else if (this.nextChar == "=") {
                        this.pushToken(TokenType.ANDAssigment, "&=");
                        this.next();
                        this.next();
                        return;
                    }
                    else {
                        this.pushToken(TokenType.ampersand, "&");
                        this.next();
                        return;
                    }
                case TokenType.or:
                    if (this.nextChar == "|") {
                        this.pushToken(TokenType.or, "||");
                        this.next();
                        this.next();
                        return;
                    }
                    else if (this.nextChar == "=") {
                        this.pushToken(TokenType.ORAssigment, "&=");
                        this.next();
                        this.next();
                        return;
                    }
                    else {
                        this.pushToken(TokenType.OR, "|");
                        this.next();
                        return;
                    }
                case TokenType.XOR:
                    if (this.nextChar == "=") {
                        this.pushToken(TokenType.XORAssigment, "^=");
                        this.next();
                        this.next();
                        return;
                    }
                    else {
                        this.pushToken(TokenType.XOR, "^");
                        this.next();
                        return;
                    }
                case TokenType.multiplication:
                    if (this.nextChar == "=") {
                        this.pushToken(TokenType.multiplicationAssignment, "*=");
                        this.next();
                        this.next();
                        return;
                    }
                    else {
                        this.pushToken(TokenType.multiplication, "*");
                        this.next();
                        return;
                    }
                case TokenType.not:
                    if (this.nextChar == "=") {
                        this.pushToken(TokenType.notEqual, "!=");
                        this.next();
                        this.next();
                        return;
                    }
                    else {
                        this.pushToken(TokenType.not, "!");
                        this.next();
                        return;
                    }
                case TokenType.division:
                    if (this.nextChar == "=") {
                        this.pushToken(TokenType.divisionAssignment, "/=");
                        this.next();
                        this.next();
                        return;
                    }
                    else if (this.nextChar == '*') {
                        this.lexMultilineComment();
                        return;
                    }
                    else if (this.nextChar == '/') {
                        this.lexEndofLineComment();
                        return;
                    }
                    this.pushToken(TokenType.division, '/');
                    this.next();
                    return;
                case TokenType.modulo:
                    if (this.nextChar == "=") {
                        this.pushToken(TokenType.moduloAssignment, "%=");
                        this.next();
                        this.next();
                        return;
                    }
                    else {
                        this.pushToken(TokenType.modulo, "/");
                        this.next();
                        return;
                    }
                case TokenType.plus:
                    if (this.nextChar == '+') {
                        this.pushToken(TokenType.doublePlus, '++');
                        this.next();
                        this.next();
                        return;
                    }
                    else if (this.nextChar == '=') {
                        this.pushToken(TokenType.plusAssignment, '+=');
                        this.next();
                        this.next();
                        return;
                    }
                    else {
                        this.pushToken(TokenType.plus, '+');
                        this.next();
                        return;
                    }
                case TokenType.lower:
                    if (this.nextChar == '=') {
                        this.pushToken(TokenType.lowerOrEqual, '<=');
                        this.next();
                        this.next();
                        return;
                    }
                    else if (this.nextChar == '<') {
                        this.lexShiftLeft();
                        return;
                    }
                    else {
                        this.pushToken(TokenType.lower, '<');
                        this.next();
                        return;
                    }
                case TokenType.greater:
                    if (this.nextChar == '=') {
                        this.pushToken(TokenType.greaterOrEqual, '>=');
                        this.next();
                        this.next();
                        return;
                    }
                    else if (this.nextChar == '>') {
                        this.lexShiftRight();
                        return;
                    }
                    else {
                        this.pushToken(TokenType.greater, '>');
                        this.next();
                        return;
                    }
                case TokenType.dot:
                    if (this.nextChar == '.' && this.pos + 2 < this.input.length && this.input[this.pos + 2] == ".") {
                        this.pushToken(TokenType.ellipsis, '...');
                        this.next();
                        this.next();
                        this.next();
                        return;
                    }
                    else {
                        this.pushToken(TokenType.dot, '.');
                        this.next();
                        return;
                    }
                case TokenType.assignment:
                    if (this.nextChar == '=') {
                        this.pushToken(TokenType.equal, '==');
                        this.next();
                        this.next();
                        return;
                    }
                    else {
                        this.pushToken(TokenType.assignment, '=');
                        this.next();
                        return;
                    }
                case TokenType.minus:
                    if (this.nextChar == '-') {
                        this.pushToken(TokenType.doubleMinus, '--');
                        this.next();
                        this.next();
                        return;
                    }
                    else if (this.isDigit(this.nextChar, 10) && !([TokenType.identifier, TokenType.integerConstant, TokenType.floatingPointConstant, TokenType.rightBracket].indexOf(this.nonSpaceLastTokenType) >= 0)) {
                        this.lexNumber();
                        return;
                    }
                    else if (this.nextChar == '=') {
                        this.pushToken(TokenType.minusAssignment, '-=');
                        this.next();
                        this.next();
                        return;
                    }
                    else {
                        this.pushToken(TokenType.minus, '-');
                        this.next();
                        return;
                    }
                case TokenType.singleQuote:
                    this.lexCharacterConstant();
                    return;
                case TokenType.doubleQuote:
                    this.lexStringConstant();
                    return;
                case TokenType.newline:
                    this.pushToken(TokenType.newline, '\n');
                    this.line++;
                    this.column = 0;
                    this.next();
                    return;
                case TokenType.space:
                case TokenType.tab:
                    this.lexSpace();
                    return;
                case TokenType.linefeed:
                    this.next();
                    return;
                case TokenType.at:
                    this.lexAnnotation();
                    return;
            }
            this.pushToken(specialCharToken, char);
            this.next();
            return;
        }
        // no special char. Number?
        if (this.isDigit(char, 10)) {
            this.lexNumber();
            return;
        }
        this.lexIdentifierOrKeyword();
    }
    lexShiftRight() {
        this.next(); // Consume first > of >>
        if (this.nextChar == ">") {
            this.lexShiftRightUnsigned();
        }
        else if (this.nextChar == "=") {
            this.pushToken(TokenType.shiftRightAssigment, ">>=");
            this.next(); // Consume second >
            this.next(); // Consume =
        }
        else {
            this.pushToken(TokenType.shiftRight, ">>");
            this.next(); // Consume second >
        }
        return;
    }
    lexShiftRightUnsigned() {
        this.next(); // Consume second > of >>>
        if (this.nextChar == "=") {
            this.pushToken(TokenType.shiftRightUnsignedAssigment, ">>>=");
            this.next(); // Consume second >
            this.next(); // Consume =
        }
        else {
            this.pushToken(TokenType.shiftRightUnsigned, ">>>");
            this.next(); // Consume next
        }
        return;
    }
    lexShiftLeft() {
        this.next(); // Consume first < of <<
        if (this.nextChar == '=') {
            this.pushToken(TokenType.shiftLeftAssigment, "<<=");
            this.next(); // Consume second <
            this.next(); // Consume =
        }
        else {
            this.pushToken(TokenType.shiftLeft, "<<");
            this.next(); // Consume second <
        }
        return;
    }
    pushToken(tt, text, line = this.line, column = this.column, length = ("" + text).length) {
        let t = {
            tt: tt,
            value: text,
            position: {
                column: column,
                line: line,
                length: length
            }
        };
        if (!(this.spaceTokens.indexOf(tt) >= 0)) {
            this.nonSpaceLastTokenType = tt;
        }
        this.tokenList.push(t);
    }
    pushError(text, length, errorLevel = "error", line = this.line, column = this.column) {
        this.errorList.push({
            text: text,
            position: {
                line: line,
                column: column,
                length: length
            },
            level: errorLevel
        });
    }
    isDigit(a, base) {
        var charCode = a.charCodeAt(0);
        if (base == 10)
            return (charCode >= 48 && charCode <= 57); // 0 - 9
        if (base == 2)
            return (charCode >= 48 && charCode <= 49); // 0, 1
        if (base == 8)
            return (charCode >= 48 && charCode <= 55); // 0 - 7
        if (base == 16)
            return (charCode >= 48 && charCode <= 57) || (charCode >= 97 && charCode <= 102) ||
                (charCode >= 65 && charCode <= 70); // 0 - 9 || a - f || A - F
    }
    lexSpace() {
        let column = this.column;
        let line = this.line;
        let posStart = this.pos;
        while (this.currentChar == " " || this.currentChar == "\t") {
            this.next();
        }
        let posEnd = this.pos;
        this.pushToken(TokenType.space, this.input.substring(posStart, posEnd), line, column);
        return;
    }
    lexCharacterConstant() {
        let column = this.column;
        let line = this.line;
        this.next();
        let char = this.currentChar;
        if (char == "\\") {
            let escapeChar = EscapeSequenceList[this.nextChar];
            if (escapeChar == null) {
                this.pushError('Die Escape-Sequenz \\' + this.nextChar + ' gibt es nicht.', 2);
                if (this.nextChar != "'") {
                    char = this.nextChar;
                    this.next();
                }
            }
            else {
                char = escapeChar;
                this.next();
            }
        }
        this.next();
        if (this.currentChar != "'") {
            this.pushError("Das Ende der char-Konstante wird erwartet (').", 1);
        }
        else {
            this.next();
        }
        this.pushToken(TokenType.charConstant, char, line, column);
    }
    lexStringConstant() {
        let line = this.line;
        let column = this.column;
        let text = "";
        this.next();
        while (true) {
            let char = this.currentChar;
            if (char == "\\") {
                if (this.nextChar == "u") {
                    this.next();
                }
                else {
                    let escapeChar = EscapeSequenceList[this.nextChar];
                    if (escapeChar == null) {
                        this.pushError('Die Escape-Sequenz \\' + this.nextChar + ' gibt es nicht.', 2);
                    }
                    else {
                        char = escapeChar;
                        this.next();
                    }
                }
            }
            else if (char == '"') {
                this.next();
                break;
            }
            else if (char == "\n" || char == endChar) {
                this.pushError('Innerhalb einer String-Konstante wurde das Zeilenende erreicht.', text.length + 1, "error", line, column);
                break;
            }
            text += char;
            this.next();
        }
        this.pushToken(TokenType.stringConstant, text, line, column, text.length + 2);
    }
    lexMultilineComment() {
        let line = this.line;
        let column = this.column;
        let lastCharWasNewline = false;
        let text = "/*";
        this.next();
        this.next();
        while (true) {
            let char = this.currentChar;
            if (char == "*" && this.nextChar == "/") {
                this.next();
                this.next();
                text += "*/";
                break;
            }
            if (char == endChar) {
                this.pushError("Innerhalb eines Mehrzeilenkommentars (/*... */) wurde das Dateiende erreicht.", 1);
                break;
            }
            if (char == "\n") {
                this.line++;
                this.column = 0;
                lastCharWasNewline = true;
                text += char;
            }
            else if (!(lastCharWasNewline && char == " ")) {
                text += char;
                lastCharWasNewline = false;
            }
            this.next();
        }
        this.pushToken(TokenType.comment, text, line, column);
    }
    lexEndofLineComment() {
        let line = this.line;
        let column = this.column;
        let text = "//";
        this.next();
        this.next();
        while (true) {
            let char = this.currentChar;
            if (char == "\n") {
                break;
            }
            if (char == endChar) {
                // this.pushError("Innerhalb eines Einzeilenkommentars (//... ) wurde das Dateiende erreicht.", 1);
                break;
            }
            text += char;
            this.next();
        }
        this.pushToken(TokenType.comment, text, line, column);
    }
    lexNumber() {
        let line = this.line;
        let column = this.column;
        let sign = 1;
        if (this.currentChar == '-') {
            sign = -1;
            this.next();
        }
        let posStart = this.pos;
        let firstChar = this.currentChar;
        this.next();
        let radix = 10;
        if (firstChar == '0' && (['b', 'x', '0', '1', '2', '3', '4', '5', '6', '7'].indexOf(this.currentChar) >= 0)) {
            if (this.currentChar == 'x') {
                radix = 16;
                this.next();
            }
            else if (this.currentChar == 'b') {
                radix = 2;
                this.next();
            }
            else
                radix = 8;
            posStart = this.pos;
        }
        while (this.isDigit(this.currentChar, radix)) {
            this.next();
        }
        let tt = TokenType.integerConstant;
        if (this.currentChar == ".") {
            tt = TokenType.floatingPointConstant;
            this.next();
            while (this.isDigit(this.currentChar, 10)) {
                this.next();
            }
            if (radix != 10) {
                this.pushError("Eine float/double-Konstante darf nicht mit 0, 0b oder 0x beginnen.", this.pos - posStart, "error", this.line, this.column - (this.pos - posStart));
            }
        }
        let base = this.input.substring(posStart, this.pos);
        posStart = this.pos;
        let exponent = 0;
        let hasExponential = false;
        //@ts-ignore
        if (this.currentChar == "e") {
            hasExponential = true;
            this.next();
            let posExponentStart = this.pos;
            //@ts-ignore
            if (this.currentChar == '-') {
                this.next();
            }
            while (this.isDigit(this.currentChar, 10)) {
                this.next();
            }
            if (radix != 10) {
                this.pushError("Eine float/double-Konstante darf nicht mit 0, 0b oder 0x beginnen.", this.pos - posStart, "error", this.line, this.column - (this.pos - posStart));
            }
            let exponentString = this.input.substring(posExponentStart, this.pos);
            exponent = Number.parseInt(exponentString);
        }
        if (this.currentChar == 'd' || this.currentChar == 'f') {
            tt == TokenType.floatingPointConstant;
            this.next();
            if (radix != 10) {
                this.pushError("Eine float/double-Konstante darf nicht mit 0, 0b oder 0x beginnen.", this.pos - posStart, "error", this.line, this.column - (this.pos - posStart));
            }
        }
        let value = (tt == TokenType.integerConstant) ? Number.parseInt(base, radix) : Number.parseFloat(base);
        value *= sign;
        if (exponent != 0)
            value *= Math.pow(10, exponent);
        this.pushToken(tt, value, line, column);
    }
    lexAnnotation() {
        let line = this.line;
        let column = this.column - 1;
        let posStart = this.pos;
        this.next(); // consume @
        let char = this.currentChar;
        while (specialCharList[char] == null && !this.isSpace(char) && !(char == endChar)) {
            this.next();
            char = this.currentChar;
        }
        let posEnd = this.pos;
        let text = this.input.substring(posStart, posEnd);
        this.pushToken(TokenType.at, text, line, column, text.length + 1);
    }
    lexIdentifierOrKeyword() {
        let line = this.line;
        let column = this.column;
        let posStart = this.pos;
        let char = this.currentChar;
        while (specialCharList[char] == null && !this.isSpace(char) && !(char == endChar)) {
            this.next();
            char = this.currentChar;
        }
        let posEnd = this.pos;
        let text = this.input.substring(posStart, posEnd);
        let tt = keywordList[text];
        if (tt != null && typeof tt == "number") {
            switch (tt) {
                case TokenType.true:
                    this.pushToken(TokenType.booleanConstant, true, line, column);
                    break;
                case TokenType.false:
                    this.pushToken(TokenType.booleanConstant, false, line, column);
                    break;
                case TokenType.keywordPrint:
                case TokenType.keywordPrintln:
                    if (this.nonSpaceLastTokenType == TokenType.dot) {
                        this.pushToken(TokenType.identifier, text, line, column);
                    }
                    else {
                        this.pushToken(tt, text, line, column);
                    }
                    break;
                default:
                    this.pushToken(tt, text, line, column);
                    break;
            }
            return;
        }
        this.pushToken(TokenType.identifier, text, line, column);
    }
    isSpace(char) {
        return char == " " || char == "\n";
    }
}
export function errorListToString(errorList) {
    let s = "";
    for (let error of errorList) {
        s += "Z " + error.position.line + ", S " + error.position.column + ": ";
        s += error.text + "<br>";
    }
    return s;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGV4ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY2xpZW50L2NvbXBpbGVyL2xleGVyL0xleGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBYSxlQUFlLEVBQUUsU0FBUyxFQUFTLGtCQUFrQixFQUFFLFdBQVcsRUFBZ0IsaUJBQWlCLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFHNUksSUFBSyxVQUVKO0FBRkQsV0FBSyxVQUFVO0lBQ1gsK0NBQU0sQ0FBQTtJQUFFLHVEQUFVLENBQUE7SUFBRSwrREFBYyxDQUFBO0lBQUUscUVBQWlCLENBQUE7SUFBRSxtRUFBZ0IsQ0FBQTtJQUFFLG1FQUFnQixDQUFBO0FBQzdGLENBQUMsRUFGSSxVQUFVLEtBQVYsVUFBVSxRQUVkO0FBRUQsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLENBQUMsVUFBVTtBQWdCN0IsTUFBTSxPQUFPLEtBQUs7SUF1QmQ7UUFSQSxnQkFBVyxHQUFnQjtZQUN2QixTQUFTLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLE9BQU87U0FDcEQsQ0FBQztRQUlGLHlCQUFvQixHQUFpQyxFQUFFLENBQUM7UUFHcEQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsR0FBRyxTQUFTLENBQUMsWUFBWSxDQUFDO1FBQzFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxTQUFTLENBQUMsaUJBQWlCLENBQUM7UUFDcEYsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQztRQUN0RixJQUFJLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUM7UUFDMUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFNB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LEdBQUcsRUFBRTt3QkFDN0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7cUJBQzVEO3lCQUFNO3dCQUNILElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7cUJBQzFDO29CQUNELE1BQU07Z0JBQ1Y7b0JBQ0ksSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDdkMsTUFBTTthQUNiO1lBRUQsT0FBTztTQUNWO1FBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFN0QsQ0FBQztJQUVELE9BQU8sQ0FBQyxJQUFZO1FBQ2hCLE9BQU8sSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDO0lBQ3ZDLENBQUM7Q0FHSjtBQUVELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxTQUFrQjtJQUNoRCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFWCxLQUFLLElBQUksS0FBSyxJQUFJLFNBQVMsRUFBRTtRQUV6QixDQUFDLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLE1BQU0sR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFDeEUsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO0tBRTVCO0lBRUQsT0FBTyxDQUFDLENBQUM7QUFDYixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVG9rZW5MaXN0LCBzcGVjaWFsQ2hhckxpc3QsIFRva2VuVHlwZSwgVG9rZW4sIEVzY2FwZVNlcXVlbmNlTGlzdCwga2V5d29yZExpc3QsIFRleHRQb3NpdGlvbiwgVG9rZW5UeXBlUmVhZGFibGUgfSBmcm9tIFwiLi9Ub2tlbi5qc1wiO1xyXG5pbXBvcnQgeyB0ZXh0IH0gZnJvbSBcImV4cHJlc3NcIjtcclxuXHJcbmVudW0gTGV4ZXJTdGF0ZSB7XHJcbiAgICBudW1iZXIsIGlkZW50aWZpZXIsIHN0cmluZ0NvbnN0YW50LCBjaGFyYWN0ZXJDb25zdGFudCwgbXVsdGlsaW5lQ29tbWVudCwgRW5kb2ZsaW5lQ29tbWVudFxyXG59XHJcblxyXG52YXIgZW5kQ2hhciA9IFwi4pa6XCI7IC8vIFxcdTEwMDAwXHJcblxyXG5leHBvcnQgdHlwZSBRdWlja0ZpeCA9IHtcclxuICAgIHRpdGxlOiBzdHJpbmcsXHJcbiAgICBlZGl0c1Byb3ZpZGVyOiAodXJpOiBtb25hY28uVXJpKSA9PiBtb25hY28ubGFuZ3VhZ2VzLldvcmtzcGFjZVRleHRFZGl0W11cclxufVxyXG5cclxuZXhwb3J0IHR5cGUgRXJyb3JMZXZlbCA9IFwiaW5mb1wiIHwgXCJlcnJvclwiIHwgXCJ3YXJuaW5nXCI7XHJcblxyXG5leHBvcnQgdHlwZSBFcnJvciA9IHtcclxuICAgIHBvc2l0aW9uOiBUZXh0UG9zaXRpb24sXHJcbiAgICB0ZXh0OiBzdHJpbmcsXHJcbiAgICBxdWlja0ZpeD86IFF1aWNrRml4LFxyXG4gICAgbGV2ZWw6IEVycm9yTGV2ZWxcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIExleGVyIHtcclxuXHJcbiAgICB0b2tlbkxpc3Q6IFRva2VuTGlzdDtcclxuICAgIG5vblNwYWNlTGFzdFRva2VuVHlwZTogVG9rZW5UeXBlO1xyXG5cclxuICAgIGVycm9yTGlzdDogRXJyb3JbXTtcclxuICAgIHBvczogbnVtYmVyO1xyXG4gICAgbGluZTogbnVtYmVyO1xyXG4gICAgY29sdW1uOiBudW1iZXI7XHJcblxyXG4gICAgY3VycmVudENoYXI6IHN0cmluZztcclxuICAgIG5leHRDaGFyOiBzdHJpbmc7XHJcblxyXG4gICAgaW5wdXQ6IHN0cmluZztcclxuXHJcbiAgICBzcGFjZVRva2VuczogVG9rZW5UeXBlW10gPSBbXHJcbiAgICAgICAgVG9rZW5UeXBlLnNwYWNlLCBUb2tlblR5cGUudGFiLCBUb2tlblR5cGUubmV3bGluZVxyXG4gICAgXTtcclxuXHJcbiAgICBicmFja2V0U3RhY2s6IFRva2VuVHlwZVtdO1xyXG4gICAgYnJhY2tldEVycm9yOiBzdHJpbmc7XHJcbiAgICBjb3JyZXNwb25kaW5nQnJhY2tldDogeyBba2V5OiBudW1iZXJdOiBUb2tlblR5cGUgfSA9IHt9O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuY29ycmVzcG9uZGluZ0JyYWNrZXRbVG9rZW5UeXBlLmxlZnRCcmFja2V0XSA9IFRva2VuVHlwZS5yaWdodEJyYWNrZXQ7XHJcbiAgICAgICAgdGhpcy5jb3JyZXNwb25kaW5nQnJhY2tldFtUb2tlblR5cGUubGVmdEN1cmx5QnJhY2tldF0gPSBUb2tlblR5cGUucmlnaHRDdXJseUJyYWNrZXQ7XHJcbiAgICAgICAgdGhpcy5jb3JyZXNwb25kaW5nQnJhY2tldFtUb2tlblR5cGUubGVmdFNxdWFyZUJyYWNrZXRdID0gVG9rZW5UeXBlLnJpZ2h0U3F1YXJlQnJhY2tldDtcclxuICAgICAgICB0aGlzLmNvcnJlc3BvbmRpbmdCcmFja2V0W1Rva2VuVHlwZS5yaWdodEJyYWNrZXRdID0gVG9rZW5UeXBlLmxlZnRCcmFja2V0O1xyXG4gICAgICAgIHRoaXMuY29ycmVzcG9uZGluZ0JyYWNrZXRbVG9rZW5UeXBlLnJpZ2h0Q3VybHlCcmFja2V0XSA9IFRva2VuVHlwZS5sZWZ0Q3VybHlCcmFja2V0O1xyXG4gICAgICAgIHRoaXMuY29ycmVzcG9uZGluZ0JyYWNrZXRbVG9rZW5UeXBlLnJpZ2h0U3F1YXJlQnJhY2tldF0gPSBUb2tlblR5cGUubGVmdFNxdWFyZUJyYWNrZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgbGV4KGlucHV0OiBzdHJpbmcpOiB7IHRva2VuczogVG9rZW5MaXN0LCBlcnJvcnM6IEVycm9yW10sIGJyYWNrZXRFcnJvcjogc3RyaW5nIH0ge1xyXG5cclxuICAgICAgICB0aGlzLmlucHV0ID0gaW5wdXQucmVwbGFjZShcIlxcdTAwYTBcIiwgXCIgXCIpO1xyXG4gICAgICAgIHRoaXMudG9rZW5MaXN0ID0gW107XHJcbiAgICAgICAgdGhpcy5lcnJvckxpc3QgPSBbXTtcclxuICAgICAgICB0aGlzLmJyYWNrZXRFcnJvciA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5icmFja2V0U3RhY2sgPSBbXTtcclxuICAgICAgICB0aGlzLnBvcyA9IDA7XHJcbiAgICAgICAgdGhpcy5saW5lID0gMTtcclxuICAgICAgICB0aGlzLmNvbHVtbiA9IDE7XHJcbiAgICAgICAgdGhpcy5ub25TcGFjZUxhc3RUb2tlblR5cGUgPSBudWxsO1xyXG5cclxuXHJcbiAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHRva2VuczogdGhpcy50b2tlbkxpc3QsIGVycm9yczogdGhpcy5lcnJvckxpc3QsIGJyYWNrZXRFcnJvcjogbnVsbCB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50Q2hhciA9IGlucHV0LmNoYXJBdCgwKTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0Q2hhciA9IGlucHV0Lmxlbmd0aCA+IDEgPyBpbnB1dC5jaGFyQXQoMSkgOiBlbmRDaGFyO1xyXG5cclxuXHJcbiAgICAgICAgd2hpbGUgKHRoaXMuY3VycmVudENoYXIgIT0gZW5kQ2hhcikge1xyXG4gICAgICAgICAgICB0aGlzLm1haW5TdGF0ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuYnJhY2tldFN0YWNrLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgbGV0IGJyYWNrZXRPcGVuID0gdGhpcy5icmFja2V0U3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgIGxldCBicmFja2V0Q2xvc2VkID0gdGhpcy5jb3JyZXNwb25kaW5nQnJhY2tldFticmFja2V0T3Blbl07XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNldEJyYWNrZXRFcnJvcihUb2tlblR5cGVSZWFkYWJsZVticmFja2V0T3Blbl0gKyBcIiBcIiArIFRva2VuVHlwZVJlYWRhYmxlW2JyYWNrZXRDbG9zZWRdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRva2VuczogdGhpcy50b2tlbkxpc3QsXHJcbiAgICAgICAgICAgIGVycm9yczogdGhpcy5lcnJvckxpc3QsXHJcbiAgICAgICAgICAgIGJyYWNrZXRFcnJvcjogdGhpcy5icmFja2V0RXJyb3JcclxuICAgICAgICB9O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjaGVja0Nsb3NpbmdCcmFja2V0KHR0OiBUb2tlblR5cGUpIHtcclxuICAgICAgICBpZiAodGhpcy5icmFja2V0U3RhY2subGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgbGV0IGJyYWNrZXRPcGVuID0gdGhpcy5jb3JyZXNwb25kaW5nQnJhY2tldFt0dF07XHJcbiAgICAgICAgICAgIHRoaXMuc2V0QnJhY2tldEVycm9yKFRva2VuVHlwZVJlYWRhYmxlW2JyYWNrZXRPcGVuXSArIFwiIFwiICsgVG9rZW5UeXBlUmVhZGFibGVbdHRdKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgb3BlbkJyYWNrZXQgPSB0aGlzLmJyYWNrZXRTdGFjay5wb3AoKTtcclxuICAgICAgICBsZXQgY29ycmVzcG9uZGluZ0JyYWNrZXQgPSB0aGlzLmNvcnJlc3BvbmRpbmdCcmFja2V0W29wZW5CcmFja2V0XTtcclxuICAgICAgICBpZiAodHQgIT0gY29ycmVzcG9uZGluZ0JyYWNrZXQpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRCcmFja2V0RXJyb3IoVG9rZW5UeXBlUmVhZGFibGVbb3BlbkJyYWNrZXRdICsgXCIgXCIgKyBUb2tlblR5cGVSZWFkYWJsZVtjb3JyZXNwb25kaW5nQnJhY2tldF0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRCcmFja2V0RXJyb3IoZXJyb3I6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0aGlzLmJyYWNrZXRFcnJvciA9PSBudWxsKSB0aGlzLmJyYWNrZXRFcnJvciA9IGVycm9yO1xyXG4gICAgfVxyXG5cclxuICAgIG5leHQoKSB7XHJcbiAgICAgICAgdGhpcy5wb3MrKztcclxuICAgICAgICB0aGlzLmN1cnJlbnRDaGFyID0gdGhpcy5uZXh0Q2hhcjtcclxuICAgICAgICBpZiAodGhpcy5wb3MgKyAxIDwgdGhpcy5pbnB1dC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0Q2hhciA9IHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zICsgMSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0Q2hhciA9IGVuZENoYXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY29sdW1uKys7IC8vIGNvbHVtbiBvZiBjdXJyZW50IGNoYXJcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIG1haW5TdGF0ZSgpIHtcclxuXHJcbiAgICAgICAgbGV0IGNoYXIgPSB0aGlzLmN1cnJlbnRDaGFyO1xyXG5cclxuICAgICAgICBsZXQgc3BlY2lhbENoYXJUb2tlbiA9IHNwZWNpYWxDaGFyTGlzdFtjaGFyXTtcclxuXHJcbiAgICAgICAgaWYgKHNwZWNpYWxDaGFyVG9rZW4gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHNwZWNpYWxDaGFyVG9rZW4pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmxlZnRTcXVhcmVCcmFja2V0OlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm5leHRDaGFyID09IFwiXVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFRva2VuKFRva2VuVHlwZS5sZWZ0UmlnaHRTcXVhcmVCcmFja2V0LCBcIltdXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hUb2tlbihUb2tlblR5cGUubGVmdFNxdWFyZUJyYWNrZXQsIFwiW1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5icmFja2V0U3RhY2sucHVzaChzcGVjaWFsQ2hhclRva2VuKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5yaWdodFNxdWFyZUJyYWNrZXQ6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVja0Nsb3NpbmdCcmFja2V0KHNwZWNpYWxDaGFyVG9rZW4pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubGVmdEJyYWNrZXQ6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5icmFja2V0U3RhY2sucHVzaChzcGVjaWFsQ2hhclRva2VuKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnJpZ2h0QnJhY2tldDpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoZWNrQ2xvc2luZ0JyYWNrZXQoc3BlY2lhbENoYXJUb2tlbik7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5sZWZ0Q3VybHlCcmFja2V0OlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYnJhY2tldFN0YWNrLnB1c2goc3BlY2lhbENoYXJUb2tlbik7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5yaWdodEN1cmx5QnJhY2tldDpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoZWNrQ2xvc2luZ0JyYWNrZXQoc3BlY2lhbENoYXJUb2tlbik7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5hbmQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubmV4dENoYXIgPT0gXCImXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLmFuZCwgXCImJlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLm5leHRDaGFyID09IFwiPVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFRva2VuKFRva2VuVHlwZS5BTkRBc3NpZ21lbnQsIFwiJj1cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFRva2VuKFRva2VuVHlwZS5hbXBlcnNhbmQsIFwiJlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5vcjpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5uZXh0Q2hhciA9PSBcInxcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hUb2tlbihUb2tlblR5cGUub3IsIFwifHxcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5uZXh0Q2hhciA9PSBcIj1cIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hUb2tlbihUb2tlblR5cGUuT1JBc3NpZ21lbnQsIFwiJj1cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFRva2VuKFRva2VuVHlwZS5PUiwgXCJ8XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLlhPUjpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5uZXh0Q2hhciA9PSBcIj1cIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hUb2tlbihUb2tlblR5cGUuWE9SQXNzaWdtZW50LCBcIl49XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hUb2tlbihUb2tlblR5cGUuWE9SLCBcIl5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubXVsdGlwbGljYXRpb246XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubmV4dENoYXIgPT0gXCI9XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLm11bHRpcGxpY2F0aW9uQXNzaWdubWVudCwgXCIqPVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLm11bHRpcGxpY2F0aW9uLCBcIipcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubm90OlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm5leHRDaGFyID09IFwiPVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFRva2VuKFRva2VuVHlwZS5ub3RFcXVhbCwgXCIhPVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLm5vdCwgXCIhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmRpdmlzaW9uOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm5leHRDaGFyID09IFwiPVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFRva2VuKFRva2VuVHlwZS5kaXZpc2lvbkFzc2lnbm1lbnQsIFwiLz1cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5uZXh0Q2hhciA9PSAnKicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sZXhNdWx0aWxpbmVDb21tZW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMubmV4dENoYXIgPT0gJy8nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGV4RW5kb2ZMaW5lQ29tbWVudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFRva2VuKFRva2VuVHlwZS5kaXZpc2lvbiwgJy8nKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5tb2R1bG86XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubmV4dENoYXIgPT0gXCI9XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLm1vZHVsb0Fzc2lnbm1lbnQsIFwiJT1cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFRva2VuKFRva2VuVHlwZS5tb2R1bG8sIFwiL1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5wbHVzOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm5leHRDaGFyID09ICcrJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hUb2tlbihUb2tlblR5cGUuZG91YmxlUGx1cywgJysrJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5uZXh0Q2hhciA9PSAnPScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLnBsdXNBc3NpZ25tZW50LCAnKz0nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLnBsdXMsICcrJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubG93ZXI6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubmV4dENoYXIgPT0gJz0nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFRva2VuKFRva2VuVHlwZS5sb3dlck9yRXF1YWwsICc8PScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMubmV4dENoYXIgPT0gJzwnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGV4U2hpZnRMZWZ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hUb2tlbihUb2tlblR5cGUubG93ZXIsICc8Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuZ3JlYXRlcjpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5uZXh0Q2hhciA9PSAnPScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLmdyZWF0ZXJPckVxdWFsLCAnPj0nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLm5leHRDaGFyID09ICc+Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxleFNoaWZ0UmlnaHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFRva2VuKFRva2VuVHlwZS5ncmVhdGVyLCAnPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmRvdDpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5uZXh0Q2hhciA9PSAnLicgJiYgdGhpcy5wb3MgKyAyIDwgdGhpcy5pbnB1dC5sZW5ndGggJiYgdGhpcy5pbnB1dFt0aGlzLnBvcyArIDJdID09IFwiLlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFRva2VuKFRva2VuVHlwZS5lbGxpcHNpcywgJy4uLicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLmRvdCwgJy4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuYXNzaWdubWVudDpcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5uZXh0Q2hhciA9PSAnPScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLmVxdWFsLCAnPT0nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLmFzc2lnbm1lbnQsICc9Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubWludXM6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubmV4dENoYXIgPT0gJy0nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFRva2VuKFRva2VuVHlwZS5kb3VibGVNaW51cywgJy0tJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLmlzRGlnaXQodGhpcy5uZXh0Q2hhciwgMTApICYmICFcclxuICAgICAgICAgICAgICAgICAgICAgICAgKFtUb2tlblR5cGUuaWRlbnRpZmllciwgVG9rZW5UeXBlLmludGVnZXJDb25zdGFudCwgVG9rZW5UeXBlLmZsb2F0aW5nUG9pbnRDb25zdGFudCwgVG9rZW5UeXBlLnJpZ2h0QnJhY2tldF0uaW5kZXhPZih0aGlzLm5vblNwYWNlTGFzdFRva2VuVHlwZSkgPj0gMClcclxuICAgICAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sZXhOdW1iZXIoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLm5leHRDaGFyID09ICc9Jykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hUb2tlbihUb2tlblR5cGUubWludXNBc3NpZ25tZW50LCAnLT0nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLm1pbnVzLCAnLScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnNpbmdsZVF1b3RlOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGV4Q2hhcmFjdGVyQ29uc3RhbnQoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5kb3VibGVRdW90ZTpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxleFN0cmluZ0NvbnN0YW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubmV3bGluZTpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hUb2tlbihUb2tlblR5cGUubmV3bGluZSwgJ1xcbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZSsrO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29sdW1uID0gMDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5zcGFjZTpcclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnRhYjpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxleFNwYWNlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubGluZWZlZWQ6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuYXQ6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sZXhBbm5vdGF0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnB1c2hUb2tlbihzcGVjaWFsQ2hhclRva2VuLCBjaGFyKTtcclxuICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBubyBzcGVjaWFsIGNoYXIuIE51bWJlcj9cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNEaWdpdChjaGFyLCAxMCkpIHtcclxuICAgICAgICAgICAgdGhpcy5sZXhOdW1iZXIoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5sZXhJZGVudGlmaWVyT3JLZXl3b3JkKCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGxleFNoaWZ0UmlnaHQoKXtcclxuICAgICAgICB0aGlzLm5leHQoKTsgLy8gQ29uc3VtZSBmaXJzdCA+IG9mID4+XHJcblxyXG4gICAgICAgIGlmKHRoaXMubmV4dENoYXIgPT0gXCI+XCIpe1xyXG4gICAgICAgICAgICB0aGlzLmxleFNoaWZ0UmlnaHRVbnNpZ25lZCgpO1xyXG4gICAgICAgIH0gZWxzZSBpZih0aGlzLm5leHRDaGFyID09IFwiPVwiKXtcclxuICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLnNoaWZ0UmlnaHRBc3NpZ21lbnQsIFwiPj49XCIpXHJcbiAgICAgICAgICAgIHRoaXMubmV4dCgpOyAvLyBDb25zdW1lIHNlY29uZCA+XHJcbiAgICAgICAgICAgIHRoaXMubmV4dCgpOyAvLyBDb25zdW1lID1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hUb2tlbihUb2tlblR5cGUuc2hpZnRSaWdodCwgXCI+PlwiKTtcclxuICAgICAgICAgICAgdGhpcy5uZXh0KCk7IC8vIENvbnN1bWUgc2Vjb25kID5cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGxleFNoaWZ0UmlnaHRVbnNpZ25lZCgpe1xyXG4gICAgICAgIHRoaXMubmV4dCgpOyAvLyBDb25zdW1lIHNlY29uZCA+IG9mID4+PlxyXG5cclxuICAgICAgICBpZih0aGlzLm5leHRDaGFyID09IFwiPVwiKXtcclxuICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLnNoaWZ0UmlnaHRVbnNpZ25lZEFzc2lnbWVudCwgXCI+Pj49XCIpXHJcbiAgICAgICAgICAgIHRoaXMubmV4dCgpOyAvLyBDb25zdW1lIHNlY29uZCA+XHJcbiAgICAgICAgICAgIHRoaXMubmV4dCgpOyAvLyBDb25zdW1lID1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hUb2tlbihUb2tlblR5cGUuc2hpZnRSaWdodFVuc2lnbmVkLCBcIj4+PlwiKTtcclxuICAgICAgICAgICAgdGhpcy5uZXh0KCk7IC8vIENvbnN1bWUgbmV4dFxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGV4U2hpZnRMZWZ0KCl7XHJcbiAgICAgICAgdGhpcy5uZXh0KCk7IC8vIENvbnN1bWUgZmlyc3QgPCBvZiA8PFxyXG5cclxuICAgICAgICBpZih0aGlzLm5leHRDaGFyID09ICc9Jyl7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFRva2VuKFRva2VuVHlwZS5zaGlmdExlZnRBc3NpZ21lbnQsIFwiPDw9XCIpXHJcbiAgICAgICAgICAgIHRoaXMubmV4dCgpOyAvLyBDb25zdW1lIHNlY29uZCA8XHJcbiAgICAgICAgICAgIHRoaXMubmV4dCgpOyAvLyBDb25zdW1lID1cclxuICAgICAgICB9IGVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaFRva2VuKFRva2VuVHlwZS5zaGlmdExlZnQsIFwiPDxcIilcclxuICAgICAgICAgICAgdGhpcy5uZXh0KCk7IC8vIENvbnN1bWUgc2Vjb25kIDxcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdXNoVG9rZW4odHQ6IFRva2VuVHlwZSwgdGV4dDogc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiwgbGluZTogbnVtYmVyID0gdGhpcy5saW5lLCBjb2x1bW46IG51bWJlciA9IHRoaXMuY29sdW1uLCBsZW5ndGg6IG51bWJlciA9IChcIlwiICsgdGV4dCkubGVuZ3RoKSB7XHJcbiAgICAgICAgbGV0IHQ6IFRva2VuID0ge1xyXG4gICAgICAgICAgICB0dDogdHQsXHJcbiAgICAgICAgICAgIHZhbHVlOiB0ZXh0LFxyXG4gICAgICAgICAgICBwb3NpdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgY29sdW1uOiBjb2x1bW4sXHJcbiAgICAgICAgICAgICAgICBsaW5lOiBsaW5lLFxyXG4gICAgICAgICAgICAgICAgbGVuZ3RoOiBsZW5ndGhcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCEodGhpcy5zcGFjZVRva2Vucy5pbmRleE9mKHR0KSA+PSAwKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5vblNwYWNlTGFzdFRva2VuVHlwZSA9IHR0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy50b2tlbkxpc3QucHVzaCh0KTtcclxuICAgIH1cclxuXHJcbiAgICBwdXNoRXJyb3IodGV4dDogc3RyaW5nLCBsZW5ndGg6IG51bWJlciwgZXJyb3JMZXZlbDogRXJyb3JMZXZlbCA9IFwiZXJyb3JcIiwgbGluZTogbnVtYmVyID0gdGhpcy5saW5lLCBjb2x1bW46IG51bWJlciA9IHRoaXMuY29sdW1uKSB7XHJcbiAgICAgICAgdGhpcy5lcnJvckxpc3QucHVzaCh7XHJcbiAgICAgICAgICAgIHRleHQ6IHRleHQsXHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBsaW5lOiBsaW5lLFxyXG4gICAgICAgICAgICAgICAgY29sdW1uOiBjb2x1bW4sXHJcbiAgICAgICAgICAgICAgICBsZW5ndGg6IGxlbmd0aFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBsZXZlbDogZXJyb3JMZXZlbFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgaXNEaWdpdChhOiBzdHJpbmcsIGJhc2U6IG51bWJlcikge1xyXG4gICAgICAgIHZhciBjaGFyQ29kZSA9IGEuY2hhckNvZGVBdCgwKTtcclxuXHJcbiAgICAgICAgaWYgKGJhc2UgPT0gMTApIHJldHVybiAoY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpOyAvLyAwIC0gOVxyXG4gICAgICAgIGlmIChiYXNlID09IDIpIHJldHVybiAoY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNDkpOyAvLyAwLCAxXHJcbiAgICAgICAgaWYgKGJhc2UgPT0gOCkgcmV0dXJuIChjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1NSk7IC8vIDAgLSA3XHJcbiAgICAgICAgaWYgKGJhc2UgPT0gMTYpIHJldHVybiAoY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpIHx8IChjaGFyQ29kZSA+PSA5NyAmJiBjaGFyQ29kZSA8PSAxMDIpIHx8XHJcbiAgICAgICAgICAgIChjaGFyQ29kZSA+PSA2NSAmJiBjaGFyQ29kZSA8PSA3MCk7IC8vIDAgLSA5IHx8IGEgLSBmIHx8IEEgLSBGXHJcbiAgICB9XHJcblxyXG4gICAgbGV4U3BhY2UoKSB7XHJcbiAgICAgICAgbGV0IGNvbHVtbiA9IHRoaXMuY29sdW1uO1xyXG4gICAgICAgIGxldCBsaW5lID0gdGhpcy5saW5lO1xyXG5cclxuICAgICAgICBsZXQgcG9zU3RhcnQgPSB0aGlzLnBvcztcclxuICAgICAgICB3aGlsZSAodGhpcy5jdXJyZW50Q2hhciA9PSBcIiBcIiB8fCB0aGlzLmN1cnJlbnRDaGFyID09IFwiXFx0XCIpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcG9zRW5kID0gdGhpcy5wb3M7XHJcbiAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLnNwYWNlLCB0aGlzLmlucHV0LnN1YnN0cmluZyhwb3NTdGFydCwgcG9zRW5kKSwgbGluZSwgY29sdW1uKTtcclxuICAgICAgICByZXR1cm47XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGxleENoYXJhY3RlckNvbnN0YW50KCkge1xyXG4gICAgICAgIGxldCBjb2x1bW4gPSB0aGlzLmNvbHVtbjtcclxuICAgICAgICBsZXQgbGluZSA9IHRoaXMubGluZTtcclxuICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICBsZXQgY2hhciA9IHRoaXMuY3VycmVudENoYXI7XHJcbiAgICAgICAgaWYgKGNoYXIgPT0gXCJcXFxcXCIpIHtcclxuICAgICAgICAgICAgbGV0IGVzY2FwZUNoYXIgPSBFc2NhcGVTZXF1ZW5jZUxpc3RbdGhpcy5uZXh0Q2hhcl07XHJcbiAgICAgICAgICAgIGlmIChlc2NhcGVDaGFyID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKCdEaWUgRXNjYXBlLVNlcXVlbnogXFxcXCcgKyB0aGlzLm5leHRDaGFyICsgJyBnaWJ0IGVzIG5pY2h0LicsIDIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubmV4dENoYXIgIT0gXCInXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjaGFyID0gdGhpcy5uZXh0Q2hhcjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNoYXIgPSBlc2NhcGVDaGFyO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudENoYXIgIT0gXCInXCIpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEYXMgRW5kZSBkZXIgY2hhci1Lb25zdGFudGUgd2lyZCBlcndhcnRldCAoJykuXCIsIDEpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLmNoYXJDb25zdGFudCwgY2hhciwgbGluZSwgY29sdW1uKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgbGV4U3RyaW5nQ29uc3RhbnQoKSB7XHJcbiAgICAgICAgbGV0IGxpbmUgPSB0aGlzLmxpbmU7XHJcbiAgICAgICAgbGV0IGNvbHVtbiA9IHRoaXMuY29sdW1uO1xyXG4gICAgICAgIGxldCB0ZXh0ID0gXCJcIjtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0KCk7XHJcblxyXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XHJcbiAgICAgICAgICAgIGxldCBjaGFyID0gdGhpcy5jdXJyZW50Q2hhcjtcclxuICAgICAgICAgICAgaWYgKGNoYXIgPT0gXCJcXFxcXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5leHRDaGFyID09IFwidVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZXNjYXBlQ2hhciA9IEVzY2FwZVNlcXVlbmNlTGlzdFt0aGlzLm5leHRDaGFyXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXNjYXBlQ2hhciA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKCdEaWUgRXNjYXBlLVNlcXVlbnogXFxcXCcgKyB0aGlzLm5leHRDaGFyICsgJyBnaWJ0IGVzIG5pY2h0LicsIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYXIgPSBlc2NhcGVDaGFyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hhciA9PSAnXCInKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoYXIgPT0gXCJcXG5cIiB8fCBjaGFyID09IGVuZENoYXIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKCdJbm5lcmhhbGIgZWluZXIgU3RyaW5nLUtvbnN0YW50ZSB3dXJkZSBkYXMgWmVpbGVuZW5kZSBlcnJlaWNodC4nLCB0ZXh0Lmxlbmd0aCArIDEsIFwiZXJyb3JcIiwgbGluZSwgY29sdW1uKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRleHQgKz0gY2hhcjtcclxuICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnB1c2hUb2tlbihUb2tlblR5cGUuc3RyaW5nQ29uc3RhbnQsIHRleHQsIGxpbmUsIGNvbHVtbiwgdGV4dC5sZW5ndGggKyAyKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgbGV4TXVsdGlsaW5lQ29tbWVudCgpIHtcclxuICAgICAgICBsZXQgbGluZSA9IHRoaXMubGluZTtcclxuICAgICAgICBsZXQgY29sdW1uID0gdGhpcy5jb2x1bW47XHJcbiAgICAgICAgbGV0IGxhc3RDaGFyV2FzTmV3bGluZTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgICAgICBsZXQgdGV4dCA9IFwiLypcIjtcclxuICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICB0aGlzLm5leHQoKTtcclxuXHJcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgICAgICAgbGV0IGNoYXIgPSB0aGlzLmN1cnJlbnRDaGFyO1xyXG4gICAgICAgICAgICBpZiAoY2hhciA9PSBcIipcIiAmJiB0aGlzLm5leHRDaGFyID09IFwiL1wiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBcIiovXCI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoY2hhciA9PSBlbmRDaGFyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIklubmVyaGFsYiBlaW5lcyBNZWhyemVpbGVua29tbWVudGFycyAoLyouLi4gKi8pIHd1cmRlIGRhcyBEYXRlaWVuZGUgZXJyZWljaHQuXCIsIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGNoYXIgPT0gXCJcXG5cIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5saW5lKys7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbHVtbiA9IDA7XHJcbiAgICAgICAgICAgICAgICBsYXN0Q2hhcldhc05ld2xpbmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBjaGFyO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCEobGFzdENoYXJXYXNOZXdsaW5lICYmIGNoYXIgPT0gXCIgXCIpKSB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IGNoYXI7XHJcbiAgICAgICAgICAgICAgICBsYXN0Q2hhcldhc05ld2xpbmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnB1c2hUb2tlbihUb2tlblR5cGUuY29tbWVudCwgdGV4dCwgbGluZSwgY29sdW1uKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgbGV4RW5kb2ZMaW5lQ29tbWVudCgpIHtcclxuICAgICAgICBsZXQgbGluZSA9IHRoaXMubGluZTtcclxuICAgICAgICBsZXQgY29sdW1uID0gdGhpcy5jb2x1bW47XHJcblxyXG4gICAgICAgIGxldCB0ZXh0ID0gXCIvL1wiO1xyXG4gICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgIHRoaXMubmV4dCgpO1xyXG5cclxuICAgICAgICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgICAgICAgICBsZXQgY2hhciA9IHRoaXMuY3VycmVudENoYXI7XHJcbiAgICAgICAgICAgIGlmIChjaGFyID09IFwiXFxuXCIpIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChjaGFyID09IGVuZENoYXIpIHtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMucHVzaEVycm9yKFwiSW5uZXJoYWxiIGVpbmVzIEVpbnplaWxlbmtvbW1lbnRhcnMgKC8vLi4uICkgd3VyZGUgZGFzIERhdGVpZW5kZSBlcnJlaWNodC5cIiwgMSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0ZXh0ICs9IGNoYXI7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLmNvbW1lbnQsIHRleHQsIGxpbmUsIGNvbHVtbik7XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBsZXhOdW1iZXIoKSB7XHJcbiAgICAgICAgbGV0IGxpbmUgPSB0aGlzLmxpbmU7XHJcbiAgICAgICAgbGV0IGNvbHVtbiA9IHRoaXMuY29sdW1uO1xyXG5cclxuICAgICAgICBsZXQgc2lnbjogbnVtYmVyID0gMTtcclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50Q2hhciA9PSAnLScpIHtcclxuICAgICAgICAgICAgc2lnbiA9IC0xO1xyXG4gICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBwb3NTdGFydCA9IHRoaXMucG9zO1xyXG5cclxuICAgICAgICBsZXQgZmlyc3RDaGFyID0gdGhpcy5jdXJyZW50Q2hhcjtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0KCk7XHJcblxyXG4gICAgICAgIGxldCByYWRpeDogbnVtYmVyID0gMTA7XHJcblxyXG4gICAgICAgIGlmIChmaXJzdENoYXIgPT0gJzAnICYmIChbJ2InLCAneCcsICcwJywgJzEnLCAnMicsICczJywgJzQnLCAnNScsICc2JywgJzcnXS5pbmRleE9mKHRoaXMuY3VycmVudENoYXIpID49IDApKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRDaGFyID09ICd4Jykge1xyXG4gICAgICAgICAgICAgICAgcmFkaXggPSAxNjtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY3VycmVudENoYXIgPT0gJ2InKSB7XHJcbiAgICAgICAgICAgICAgICByYWRpeCA9IDI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHJhZGl4ID0gODtcclxuICAgICAgICAgICAgcG9zU3RhcnQgPSB0aGlzLnBvcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdoaWxlICh0aGlzLmlzRGlnaXQodGhpcy5jdXJyZW50Q2hhciwgcmFkaXgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHR0ID0gVG9rZW5UeXBlLmludGVnZXJDb25zdGFudDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudENoYXIgPT0gXCIuXCIpIHtcclxuICAgICAgICAgICAgdHQgPSBUb2tlblR5cGUuZmxvYXRpbmdQb2ludENvbnN0YW50O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgIHdoaWxlICh0aGlzLmlzRGlnaXQodGhpcy5jdXJyZW50Q2hhciwgMTApKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHJhZGl4ICE9IDEwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkVpbmUgZmxvYXQvZG91YmxlLUtvbnN0YW50ZSBkYXJmIG5pY2h0IG1pdCAwLCAwYiBvZGVyIDB4IGJlZ2lubmVuLlwiLCB0aGlzLnBvcyAtIHBvc1N0YXJ0LCBcImVycm9yXCIsIHRoaXMubGluZSwgdGhpcy5jb2x1bW4gLSAodGhpcy5wb3MgLSBwb3NTdGFydCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGJhc2UgPSB0aGlzLmlucHV0LnN1YnN0cmluZyhwb3NTdGFydCwgdGhpcy5wb3MpO1xyXG5cclxuICAgICAgICBwb3NTdGFydCA9IHRoaXMucG9zO1xyXG4gICAgICAgIGxldCBleHBvbmVudDogbnVtYmVyID0gMDtcclxuXHJcbiAgICAgICAgbGV0IGhhc0V4cG9uZW50aWFsOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudENoYXIgPT0gXCJlXCIpIHtcclxuICAgICAgICAgICAgaGFzRXhwb25lbnRpYWwgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgbGV0IHBvc0V4cG9uZW50U3RhcnQ6IG51bWJlciA9IHRoaXMucG9zO1xyXG5cclxuICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRDaGFyID09ICctJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHdoaWxlICh0aGlzLmlzRGlnaXQodGhpcy5jdXJyZW50Q2hhciwgMTApKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmFkaXggIT0gMTApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRWluZSBmbG9hdC9kb3VibGUtS29uc3RhbnRlIGRhcmYgbmljaHQgbWl0IDAsIDBiIG9kZXIgMHggYmVnaW5uZW4uXCIsIHRoaXMucG9zIC0gcG9zU3RhcnQsIFwiZXJyb3JcIiwgdGhpcy5saW5lLCB0aGlzLmNvbHVtbiAtICh0aGlzLnBvcyAtIHBvc1N0YXJ0KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IGV4cG9uZW50U3RyaW5nID0gdGhpcy5pbnB1dC5zdWJzdHJpbmcocG9zRXhwb25lbnRTdGFydCwgdGhpcy5wb3MpO1xyXG4gICAgICAgICAgICBleHBvbmVudCA9IE51bWJlci5wYXJzZUludChleHBvbmVudFN0cmluZyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50Q2hhciA9PSAnZCcgfHwgdGhpcy5jdXJyZW50Q2hhciA9PSAnZicpIHtcclxuICAgICAgICAgICAgdHQgPT0gVG9rZW5UeXBlLmZsb2F0aW5nUG9pbnRDb25zdGFudDtcclxuICAgICAgICAgICAgdGhpcy5uZXh0KCk7XHJcbiAgICAgICAgICAgIGlmIChyYWRpeCAhPSAxMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJFaW5lIGZsb2F0L2RvdWJsZS1Lb25zdGFudGUgZGFyZiBuaWNodCBtaXQgMCwgMGIgb2RlciAweCBiZWdpbm5lbi5cIiwgdGhpcy5wb3MgLSBwb3NTdGFydCwgXCJlcnJvclwiLCB0aGlzLmxpbmUsIHRoaXMuY29sdW1uIC0gKHRoaXMucG9zIC0gcG9zU3RhcnQpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHZhbHVlOiBudW1iZXIgPSAodHQgPT0gVG9rZW5UeXBlLmludGVnZXJDb25zdGFudCkgPyBOdW1iZXIucGFyc2VJbnQoYmFzZSwgcmFkaXgpIDogTnVtYmVyLnBhcnNlRmxvYXQoYmFzZSk7XHJcbiAgICAgICAgdmFsdWUgKj0gc2lnbjtcclxuICAgICAgICBpZiAoZXhwb25lbnQgIT0gMCkgdmFsdWUgKj0gTWF0aC5wb3coMTAsIGV4cG9uZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy5wdXNoVG9rZW4odHQsIHZhbHVlLCBsaW5lLCBjb2x1bW4pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBsZXhBbm5vdGF0aW9uKCkge1xyXG4gICAgICAgIGxldCBsaW5lID0gdGhpcy5saW5lO1xyXG4gICAgICAgIGxldCBjb2x1bW4gPSB0aGlzLmNvbHVtbiAtIDE7XHJcbiAgICAgICAgbGV0IHBvc1N0YXJ0ID0gdGhpcy5wb3M7XHJcblxyXG4gICAgICAgIHRoaXMubmV4dCgpOyAvLyBjb25zdW1lIEBcclxuICAgICAgICBsZXQgY2hhciA9IHRoaXMuY3VycmVudENoYXI7XHJcblxyXG4gICAgICAgIHdoaWxlIChzcGVjaWFsQ2hhckxpc3RbY2hhcl0gPT0gbnVsbCAmJiAhdGhpcy5pc1NwYWNlKGNoYXIpICYmICEoY2hhciA9PSBlbmRDaGFyKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICAgICAgY2hhciA9IHRoaXMuY3VycmVudENoYXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcG9zRW5kID0gdGhpcy5wb3M7XHJcblxyXG4gICAgICAgIGxldCB0ZXh0ID0gdGhpcy5pbnB1dC5zdWJzdHJpbmcocG9zU3RhcnQsIHBvc0VuZCk7XHJcbiAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLmF0LCB0ZXh0LCBsaW5lLCBjb2x1bW4sIHRleHQubGVuZ3RoICsgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV4SWRlbnRpZmllck9yS2V5d29yZCgpIHtcclxuICAgICAgICBsZXQgbGluZSA9IHRoaXMubGluZTtcclxuICAgICAgICBsZXQgY29sdW1uID0gdGhpcy5jb2x1bW47XHJcblxyXG4gICAgICAgIGxldCBwb3NTdGFydCA9IHRoaXMucG9zO1xyXG4gICAgICAgIGxldCBjaGFyID0gdGhpcy5jdXJyZW50Q2hhcjtcclxuXHJcbiAgICAgICAgd2hpbGUgKHNwZWNpYWxDaGFyTGlzdFtjaGFyXSA9PSBudWxsICYmICF0aGlzLmlzU3BhY2UoY2hhcikgJiYgIShjaGFyID09IGVuZENoYXIpKSB7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgICAgICBjaGFyID0gdGhpcy5jdXJyZW50Q2hhcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBwb3NFbmQgPSB0aGlzLnBvcztcclxuXHJcbiAgICAgICAgbGV0IHRleHQgPSB0aGlzLmlucHV0LnN1YnN0cmluZyhwb3NTdGFydCwgcG9zRW5kKTtcclxuXHJcbiAgICAgICAgbGV0IHR0ID0ga2V5d29yZExpc3RbdGV4dF07XHJcbiAgICAgICAgaWYgKHR0ICE9IG51bGwgJiYgdHlwZW9mIHR0ID09IFwibnVtYmVyXCIpIHtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAodHQpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnRydWU6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLmJvb2xlYW5Db25zdGFudCwgdHJ1ZSwgbGluZSwgY29sdW1uKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmZhbHNlOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaFRva2VuKFRva2VuVHlwZS5ib29sZWFuQ29uc3RhbnQsIGZhbHNlLCBsaW5lLCBjb2x1bW4pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZFByaW50OlxyXG4gICAgICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZFByaW50bG46XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubm9uU3BhY2VMYXN0VG9rZW5UeXBlID09IFRva2VuVHlwZS5kb3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLmlkZW50aWZpZXIsIHRleHQsIGxpbmUsIGNvbHVtbik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoVG9rZW4odHQsIHRleHQsIGxpbmUsIGNvbHVtbik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hUb2tlbih0dCwgdGV4dCwgbGluZSwgY29sdW1uKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoVG9rZW4oVG9rZW5UeXBlLmlkZW50aWZpZXIsIHRleHQsIGxpbmUsIGNvbHVtbik7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGlzU3BhY2UoY2hhcjogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIGNoYXIgPT0gXCIgXCIgfHwgY2hhciA9PSBcIlxcblwiO1xyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBlcnJvckxpc3RUb1N0cmluZyhlcnJvckxpc3Q6IEVycm9yW10pOiBzdHJpbmcge1xyXG4gICAgbGV0IHMgPSBcIlwiO1xyXG5cclxuICAgIGZvciAobGV0IGVycm9yIG9mIGVycm9yTGlzdCkge1xyXG5cclxuICAgICAgICBzICs9IFwiWiBcIiArIGVycm9yLnBvc2l0aW9uLmxpbmUgKyBcIiwgUyBcIiArIGVycm9yLnBvc2l0aW9uLmNvbHVtbiArIFwiOiBcIjtcclxuICAgICAgICBzICs9IGVycm9yLnRleHQgKyBcIjxicj5cIjtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHM7XHJcbn0iXX0=