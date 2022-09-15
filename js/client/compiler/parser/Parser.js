import { TokenType, TokenTypeReadable } from "../lexer/Token.js";
import { Visibility } from "../types/Class.js";
import { intPrimitiveType, TokenTypeToDataTypeMap } from "../types/PrimitiveTypes.js";
export class Parser {
    constructor(isInConsoleMode) {
        this.isInConsoleMode = isInConsoleMode;
        this.lookahead = 4;
        this.endToken = {
            position: { line: 0, column: 0, length: 1 },
            tt: TokenType.endofSourcecode,
            value: "das Ende des Programms"
        };
        this.tokensNotAfterCasting = [TokenType.multiplication, TokenType.division, TokenType.plus,
            TokenType.minus, TokenType.dot, TokenType.modulo, TokenType.semicolon, TokenType.rightBracket];
    }
    parse(m) {
        this.module = m;
        this.tokenList = m.tokenList;
        this.errorList = [];
        if (this.tokenList.length == 0) {
            this.module.mainProgramAst = [];
            this.module.classDefinitionsAST = [];
            this.module.typeNodes = [];
            this.module.errors[1] = this.errorList;
            return;
        }
        this.pos = 0;
        this.initializeLookahead();
        this.typeNodes = [];
        let lastToken = this.tokenList[this.tokenList.length - 1];
        this.endToken.position = { line: lastToken.position.line, column: lastToken.position.column + lastToken.position.length, length: 1 };
        let astNodes = this.parseMain();
        this.module.mainProgramAst = astNodes.mainProgramAST;
        this.module.classDefinitionsAST = astNodes.classDefinitionAST;
        this.module.mainProgramEnd = astNodes.mainProgramEnd;
        this.module.typeNodes = this.typeNodes;
        this.module.errors[1] = this.errorList;
    }
    initializeLookahead() {
        this.ct = [];
        for (let i = 0; i < this.lookahead; i++) {
            let token = this.endToken;
            while (true) {
                if (this.pos >= this.tokenList.length)
                    break;
                let token1 = this.tokenList[this.pos];
                if (token1.tt == TokenType.comment) {
                    this.lastComment = token1;
                }
                if (token1.tt != TokenType.newline && token1.tt != TokenType.space && token1.tt != TokenType.comment) {
                    token = token1;
                    if (this.lastComment != null) {
                        token.commentBefore = this.lastComment;
                        this.lastComment = null;
                    }
                    break;
                }
                this.pos++;
            }
            this.ct.push(token);
            if (i < this.lookahead - 1) {
                this.pos++;
            }
        }
        this.cct = this.ct[0];
        this.tt = this.cct.tt;
        this.position = this.cct.position;
    }
    nextToken() {
        let token;
        this.lastToken = this.cct;
        while (true) {
            this.pos++;
            if (this.pos >= this.tokenList.length) {
                token = this.endToken;
                break;
            }
            token = this.tokenList[this.pos];
            if (token.tt == TokenType.comment) {
                this.lastComment = token;
            }
            if (token.tt != TokenType.newline && token.tt != TokenType.space && token.tt != TokenType.comment) {
                token.commentBefore = this.lastComment;
                this.lastComment = null;
                break;
            }
        }
        for (let i = 0; i < this.lookahead - 1; i++) {
            this.ct[i] = this.ct[i + 1];
        }
        this.ct[this.lookahead - 1] = token;
        this.cct = this.ct[0];
        this.tt = this.cct.tt;
        this.position = this.cct.position;
    }
    pushError(text, errorLevel = "error", position, quickFix) {
        if (position == null)
            position = Object.assign({}, this.position);
        this.errorList.push({
            text: text,
            position: position,
            quickFix: quickFix,
            level: errorLevel
        });
    }
    expect(tt, skip = true, invokeSemicolonAngel = false) {
        if (this.tt != tt) {
            if (tt == TokenType.semicolon && this.tt == TokenType.endofSourcecode) {
                return true;
            }
            let position = this.cct.position;
            if (tt == TokenType.semicolon && this.lastToken != null) {
                if (this.lastToken.position.line < position.line) {
                    position = {
                        line: this.lastToken.position.line,
                        column: this.lastToken.position.column + this.lastToken.position.length,
                        length: 1
                    };
                }
            }
            let quickFix = null;
            if (tt == TokenType.semicolon && this.lastToken.position.line < this.cct.position.line &&
                !this.isOperatorOrDot(this.lastToken.tt)) {
                quickFix = {
                    title: 'Strichpunkt hier einfügen',
                    editsProvider: (uri) => {
                        return [{
                                resource: uri,
                                edit: {
                                    range: {
                                        startLineNumber: position.line, startColumn: position.column, endLineNumber: position.line, endColumn: position.column,
                                        message: "",
                                        severity: monaco.MarkerSeverity.Error
                                    },
                                    text: ";"
                                }
                            }
                        ];
                    }
                };
                if (invokeSemicolonAngel) {
                    this.module.main.getSemicolonAngel().register(position, this.module);
                }
            }
            this.pushError("Erwartet wird: " + TokenTypeReadable[tt] + " - Gefunden wurde: " + TokenTypeReadable[this.tt], "error", position, quickFix);
            return false;
        }
        if (skip) {
            this.nextToken();
        }
        return true;
    }
    isOperatorOrDot(tt) {
        if (tt == TokenType.dot)
            return true;
        for (let op of Parser.operatorPrecedence) {
            for (let operator of op) {
                if (tt == operator)
                    return true;
            }
        }
    }
    isEnd() {
        return this.cct == this.endToken;
    }
    comesToken(token) {
        if (!Array.isArray(token)) {
            return this.tt == token;
        }
        return token.indexOf(this.tt) >= 0;
    }
    getCurrentPosition() {
        return Object.assign({}, this.position);
    }
    getEndOfCurrentToken() {
        let position = this.getCurrentPosition();
        position.column = position.column + this.position.length;
        position.length = 0;
        return position;
    }
    parseMain() {
        let mainProgram = [];
        let classDefinitions = [];
        let mainProgramEnd = {
            column: 0,
            line: 10000,
            length: 1
        };
        while (!this.isEnd()) {
            let oldPos = this.pos;
            if (this.comesToken(Parser.BeforeClassDefinitionTokens)) {
                let cd = this.parseClassDefinition();
                if (cd != null)
                    classDefinitions = classDefinitions.concat(cd);
            }
            else {
                let st = this.parseStatement();
                if (st != null) {
                    mainProgram = mainProgram.concat(st);
                }
                mainProgramEnd = this.getCurrentPosition();
            }
            // emergency-forward:
            if (this.pos == oldPos) {
                this.pos++;
                this.initializeLookahead();
            }
        }
        return {
            mainProgramAST: mainProgram,
            classDefinitionAST: classDefinitions,
            mainProgramEnd: mainProgramEnd
        };
    }
    checkIfStatementHasNoEffekt(st) {
        if (this.isInConsoleMode)
            return;
        if ((st.type == TokenType.binaryOp && Parser.assignmentOperators.indexOf(st.operator) < 0)) {
            let s = "dieses Terms";
            switch (st.operator) {
                case TokenType.plus:
                    s = "dieser Summe";
                    break;
                case TokenType.minus:
                    s = "dieser Differenz";
                    break;
                case TokenType.multiplication:
                    s = "dieses Produkts";
                    break;
                case TokenType.division:
                    s = "dieses Quotienten";
                    break;
            }
            s += " (Operator " + TokenTypeReadable[st.operator] + ")";
            this.pushError(`Der Wert ${s} wird zwar berechnet, aber danach verworfen. Möchtest Du ihn vielleicht einer Variablen zuweisen?`, "info", st.position);
        }
        else if ([TokenType.unaryOp, TokenType.pushConstant,
            TokenType.identifier, TokenType.selectArrayElement].indexOf(st.type) >= 0) {
            this.pushError("Der Wert dieses Terms wird zwar berechnet, aber danach verworfen. Möchtest Du ihn vielleicht einer Variablen zuweisen?", "info", st.position);
        }
    }
    parseStatement(expectSemicolon = true) {
        let retStatements = null;
        switch (this.tt) {
            case TokenType.leftBracket:
            case TokenType.identifier:
            case TokenType.keywordThis:
            case TokenType.keywordSuper:
            case TokenType.keywordFinal:
            case TokenType.charConstant:
            case TokenType.integerConstant:
            case TokenType.stringConstant:
            case TokenType.booleanConstant:
            case TokenType.floatingPointConstant:
            case TokenType.keywordNew:
                let ret = this.parseVariableDeclarationOrTerm();
                if (expectSemicolon)
                    this.expect(TokenType.semicolon, true, true);
                retStatements = ret;
                break;
            case TokenType.leftCurlyBracket:
                let statements = [];
                let positionFrom = this.getCurrentPosition();
                this.nextToken();
                //@ts-ignore
                while (this.tt != TokenType.rightCurlyBracket && this.tt != TokenType.endofSourcecode
                    && Parser.BeforeClassDefinitionTokens.indexOf(this.tt) < 0) {
                    statements = statements.concat(this.parseStatement());
                }
                let positionTo = this.getCurrentPosition();
                positionTo.column = positionTo.column + positionTo.length;
                positionTo.length = 0;
                this.expect(TokenType.rightCurlyBracket);
                retStatements = [{
                        type: TokenType.scopeNode,
                        position: positionFrom,
                        positionTo: positionTo,
                        statements: statements
                    }];
                break;
            case TokenType.keywordWhile:
                retStatements = this.parseWhile();
                break;
            case TokenType.keywordFor:
                retStatements = this.parseFor();
                break;
            case TokenType.keywordDo:
                retStatements = this.parseDo();
                break;
            case TokenType.keywordIf:
                retStatements = this.parseIf();
                break;
            case TokenType.keywordReturn:
                retStatements = this.parseReturn();
                break;
            case TokenType.keywordPrint:
            case TokenType.keywordPrintln:
                retStatements = this.parsePrint();
                break;
            case TokenType.keywordSwitch:
                retStatements = this.parseSwitch();
                break;
            case TokenType.keywordBreak:
                let position = this.getCurrentPosition();
                this.nextToken();
                retStatements = [{
                        type: TokenType.keywordBreak,
                        position: position
                    }];
                break;
            case TokenType.keywordContinue:
                let position1 = this.getCurrentPosition();
                this.nextToken();
                retStatements = [{
                        type: TokenType.keywordContinue,
                        position: position1
                    }];
                break;
            case TokenType.semicolon:
                break;
            default:
                let s = TokenTypeReadable[this.tt];
                if (s != this.cct.value)
                    s += "(" + this.cct.value + ")";
                s += " wird hier nicht erwartet.";
                this.pushError(s);
                let dontSkip = Parser.BeforeClassDefinitionTokens.indexOf(this.tt) >= 0;
                if (!dontSkip) {
                    this.nextToken();
                }
                break;
        }
        if (retStatements == null) {
            // skip additional semicolons if present...
            while (this.tt == TokenType.semicolon && expectSemicolon) {
                this.nextToken();
            }
        }
        if (retStatements != null && retStatements.length > 0) {
            let retStmt = retStatements[retStatements.length - 1];
            if (retStmt != null) {
                this.checkIfStatementHasNoEffekt(retStatements[retStatements.length - 1]);
            }
            else {
                retStatements = null;
            }
        }
        return retStatements;
    }
    parseReturn() {
        let position = this.getCurrentPosition();
        this.nextToken();
        let term;
        if (!(this.tt == TokenType.semicolon)) {
            term = this.parseTerm();
            this.expect(TokenType.semicolon, true, true);
        }
        return [{
                type: TokenType.keywordReturn,
                position: position,
                term: term
            }];
    }
    parseWhile() {
        let position = this.getCurrentPosition();
        this.nextToken(); // consume while
        let scopeFrom = this.getCurrentPosition();
        if (this.expect(TokenType.leftBracket, true)) {
            let condition = this.parseTerm();
            let rightBracketPosition = this.getCurrentPosition();
            this.module.pushMethodCallPosition(position, [], "while", rightBracketPosition);
            this.expect(TokenType.rightBracket, true);
            if (this.tt == TokenType.semicolon) {
                this.pushError("Diese while-loop wiederholt nur den Strichpunkt (leere Anweisung).", "warning");
            }
            let statements = this.parseStatement();
            let scopeTo = this.getCurrentPosition();
            scopeTo.length = 0;
            if (statements != null && statements.length > 0 && statements[0].type == TokenType.scopeNode) {
                scopeTo = statements[0].positionTo;
            }
            return [
                {
                    type: TokenType.keywordWhile,
                    position: position,
                    scopeFrom: scopeFrom,
                    scopeTo: scopeTo,
                    condition: condition,
                    statements: statements
                }
            ];
        }
        return [];
    }
    parseFor() {
        let position = this.getCurrentPosition();
        let semicolonPositions = [];
        this.nextToken(); // consume for
        let scopeFrom = this.getCurrentPosition();
        if (this.expect(TokenType.leftBracket, true)) {
            if (this.ct[2].tt == TokenType.colon) {
                return this.parseForLoopOverCollection(position, scopeFrom);
            }
            let statementsBefore = this.parseStatement(false);
            semicolonPositions.push(this.getCurrentPosition());
            this.expect(TokenType.semicolon);
            let condition = this.parseTerm();
            semicolonPositions.push(this.getCurrentPosition());
            this.expect(TokenType.semicolon, true);
            let statementsAfter = this.parseStatement(false);
            let rightBracketPosition = this.getCurrentPosition();
            this.expect(TokenType.rightBracket, true);
            this.module.pushMethodCallPosition(position, semicolonPositions, "for", rightBracketPosition);
            if (this.tt == TokenType.semicolon) {
                this.pushError("Diese for-loop wiederholt nur den Strichpunkt (leere Anweisung).", "warning");
            }
            let statements = this.parseStatement();
            let scopeTo = this.getCurrentPosition();
            scopeTo.length = 0;
            if (statements != null && statements.length > 0 && statements[0].type == TokenType.scopeNode) {
                scopeTo = statements[0].positionTo;
            }
            if (condition == null) {
                condition = {
                    type: TokenType.pushConstant,
                    position: this.getCurrentPosition(),
                    constantType: TokenType.booleanConstant,
                    constant: true
                };
            }
            return [
                {
                    type: TokenType.keywordFor,
                    position: position,
                    scopeFrom: scopeFrom,
                    scopeTo: scopeTo,
                    condition: condition,
                    statementsBefore: statementsBefore,
                    statementsAfter: statementsAfter,
                    statements: statements
                }
            ];
        }
        return [];
    }
    parseForLoopOverCollection(position, scopeFrom) {
        let variableType = this.parseType();
        let variableIdentifier = this.cct.value;
        let variableIdentifierPosition = this.getCurrentPosition();
        this.nextToken();
        this.expect(TokenType.colon, true);
        let collection = this.parseTerm();
        this.expect(TokenType.rightBracket, true);
        if (this.tt == TokenType.semicolon) {
            this.pushError("Diese for-loop wiederholt nur den Strichpunkt (leere Anweisung).", "warning");
        }
        let statements = this.parseStatement();
        let scopeTo = this.getCurrentPosition();
        scopeTo.length = 0;
        if (statements != null && statements.length > 0 && statements[0].type == TokenType.scopeNode) {
            scopeTo = statements[0].positionTo;
        }
        if (collection == null || variableType == null || statements == null)
            return [];
        return [
            {
                type: TokenType.forLoopOverCollection,
                position: position,
                scopeFrom: scopeFrom,
                scopeTo: scopeTo,
                variableIdentifier: variableIdentifier,
                variableType: variableType,
                variablePosition: variableIdentifierPosition,
                collection: collection,
                statements: statements
            }
        ];
    }
    parsePrint() {
        let tt = this.tt;
        let position = this.getCurrentPosition();
        this.nextToken();
        if (this.expect(TokenType.leftBracket, false)) {
            let mcp = this.parseMethodCallParameters();
            let paramenters = mcp.nodes;
            if (paramenters.length > 2) {
                this.pushError("Die Methoden print und println haben maximal zwei Parameter.", "error", position);
            }
            this.expect(TokenType.semicolon, true, true);
            return [{
                    //@ts-ignore
                    type: tt,
                    position: position,
                    text: paramenters.length == 0 ? null : paramenters[0],
                    color: paramenters.length <= 1 ? null : paramenters[1],
                    commaPositions: mcp.commaPositions,
                    rightBracketPosition: mcp.rightBracketPosition
                }];
        }
        return null;
    }
    parseSwitch() {
        let position = this.getCurrentPosition();
        this.nextToken();
        if (this.expect(TokenType.leftBracket, true)) {
            let switchTerm = this.parseTerm();
            this.module.pushMethodCallPosition(position, [], "switch", this.getCurrentPosition());
            this.expect(TokenType.rightBracket);
            let scopeFrom = this.getCurrentPosition();
            this.expect(TokenType.leftCurlyBracket, true);
            let switchNode = {
                type: TokenType.keywordSwitch,
                position: position,
                scopeFrom: scopeFrom,
                scopeTo: null,
                condition: switchTerm,
                caseNodes: []
            };
            let defaultAlreadyThere = false;
            while (this.tt == TokenType.keywordCase || this.tt == TokenType.keywordDefault) {
                let casePosition = this.getCurrentPosition();
                let isDefault = this.tt == TokenType.keywordDefault;
                if (isDefault) {
                    if (defaultAlreadyThere) {
                        this.pushError("Eine switch-Anweisung darf nur maximal einen default-Zweig haben.", "error", casePosition);
                    }
                    else {
                        defaultAlreadyThere = true;
                    }
                }
                this.nextToken();
                let caseTerm = null;
                if (!isDefault) {
                    caseTerm = this.parseTerm();
                }
                this.expect(TokenType.colon, true);
                let statements = [];
                //@ts-ignore
                while (this.tt != TokenType.rightCurlyBracket && this.tt != TokenType.endofSourcecode
                    && this.tt != TokenType.keywordCase && this.tt != TokenType.keywordDefault) {
                    let statement = this.parseStatement();
                    if (statement != null) {
                        statements = statements.concat(statement);
                    }
                }
                let switchCaseNode = {
                    type: TokenType.keywordCase,
                    position: casePosition,
                    caseTerm: caseTerm,
                    statements: statements
                };
                switchNode.caseNodes.push(switchCaseNode);
            }
            switchNode.scopeTo = this.getEndOfCurrentToken();
            this.expect(TokenType.rightCurlyBracket, true);
            return [switchNode];
        }
        return null;
    }
    parseIf() {
        let position = this.getCurrentPosition();
        this.nextToken(); // consume if
        if (this.expect(TokenType.leftBracket, true)) {
            let condition = this.parseTerm();
            let rightBracketPosition = this.getCurrentPosition();
            this.module.pushMethodCallPosition(position, [], "if", rightBracketPosition);
            this.expect(TokenType.rightBracket, true);
            if (this.tt == TokenType.semicolon) {
                this.pushError("Falls die Bedingung zutrifft, wird nur der Strichpunkt ausgeführt (leere Anweisung).", "warning");
            }
            let statements = this.parseStatement();
            if (this.tt == TokenType.semicolon) {
                this.nextToken();
            }
            let elseStatements = null;
            if (this.comesToken(TokenType.keywordElse)) {
                this.nextToken();
                elseStatements = this.parseStatement();
            }
            if (condition == null && this.errorList.length == 0) {
                condition = {
                    type: TokenType.pushConstant,
                    position: this.getCurrentPosition(),
                    constantType: TokenType.booleanConstant,
                    constant: true
                };
            }
            return [
                {
                    type: TokenType.keywordIf,
                    position: position,
                    condition: condition,
                    statementsIfTrue: statements,
                    statementsIfFalse: elseStatements
                }
            ];
        }
        return [];
    }
    parseDo() {
        // let i = 10;
        // do {
        //     i = i +7;
        // } while (i < 100);
        let position = this.getCurrentPosition();
        let scopeFrom = this.getCurrentPosition();
        this.nextToken(); // consume do
        let statements = this.parseStatement();
        if (this.expect(TokenType.keywordWhile, true)) {
            if (this.expect(TokenType.leftBracket, true)) {
                let condition = this.parseTerm();
                let scopeTo = this.getEndOfCurrentToken();
                this.expect(TokenType.rightBracket, true);
                return [
                    {
                        type: TokenType.keywordDo,
                        position: position,
                        scopeFrom: scopeFrom,
                        scopeTo: scopeTo,
                        condition: condition,
                        statements: statements
                    }
                ];
            }
        }
        return [];
    }
    comesGenericType() {
        if (this.ct[1].tt != TokenType.lower)
            return false;
        if (this.ct[2].tt != TokenType.identifier)
            return false;
        return this.ct[3].tt == TokenType.greater || this.ct[3].tt == TokenType.comma;
    }
    parseVariableDeclarationOrTerm() {
        // Two identifiers in a row or identifier[]
        if ((this.tt == TokenType.identifier || this.tt == TokenType.keywordFinal) &&
            (this.ct[1].tt == TokenType.identifier
                || this.ct[1].tt == TokenType.leftRightSquareBracket ||
                this.comesGenericType())) {
            let ret = [];
            let type = null;
            do {
                if (type != null)
                    this.expect(TokenType.comma, true);
                let vd = this.parseVariableDeclaration(type);
                ret.push(vd);
                type = vd === null || vd === void 0 ? void 0 : vd.variableType;
                //@ts-ignore
            } while (this.tt == TokenType.comma);
            return ret;
        }
        else {
            return [this.parseTerm()];
        }
    }
    parseTerm() {
        return this.parseTermBinary(0);
    }
    parseTermBinary(precedence) {
        let left;
        if (precedence < Parser.operatorPrecedence.length - 1) {
            left = this.parseTermBinary(precedence + 1);
        }
        else {
            left = this.parsePlusPlusMinusMinus();
        }
        let operators = Parser.operatorPrecedence[precedence];
        if (left == null || operators.indexOf(this.tt) < 0) {
            return left;
        }
        let first = true;
        if (this.tt == TokenType.colon) {
            return left;
        }
        while (first || operators.indexOf(this.tt) >= 0) {
            let operator = this.tt;
            first = false;
            let position = this.getCurrentPosition();
            this.nextToken();
            for (let opData of [{ op: TokenType.lower, wrong: "=<", right: "<=", correctOp: TokenType.lowerOrEqual },
                { op: TokenType.greater, wrong: "=>", right: ">=", correctOp: TokenType.greaterOrEqual }]) {
                if (operator == TokenType.assignment && this.tt == opData.op) {
                    let position2 = this.getCurrentPosition();
                    this.pushError(`Den Operator ${opData.wrong} gibt es nicht. Du meintest sicher: ${opData.right}`, "error", Object.assign({}, position, { length: 2 }), {
                        title: `${opData.wrong} durch ${opData.right} ersetzen`,
                        editsProvider: (uri) => {
                            return [
                                {
                                    resource: uri,
                                    edit: {
                                        range: { startLineNumber: position.line, startColumn: position.column, endLineNumber: position.line, endColumn: position2.column + position2.length },
                                        text: opData.right
                                    }
                                }
                            ];
                        }
                    });
                    this.nextToken();
                    operator = opData.correctOp;
                }
            }
            let right;
            if (precedence < Parser.operatorPrecedence.length - 1) {
                right = this.parseTermBinary(precedence + 1);
            }
            else {
                right = this.parsePlusPlusMinusMinus();
            }
            if (right != null) {
                let constantFolding = false;
                if (this.isConstant(left) && this.isConstant(right)) {
                    let pcLeft = left;
                    let pcRight = right;
                    let typeLeft = TokenTypeToDataTypeMap[pcLeft.constantType];
                    let typeRight = TokenTypeToDataTypeMap[pcRight.constantType];
                    let resultType = typeLeft.getResultType(operator, typeRight);
                    if (resultType != null) {
                        constantFolding = true;
                        let result = typeLeft.compute(operator, { type: typeLeft, value: pcLeft.constant }, { type: typeRight, value: pcRight.constant });
                        this.considerIntDivisionWarning(operator, typeLeft, pcLeft.constant, typeRight, pcRight.constant, position);
                        pcLeft.constantType = resultType.toTokenType();
                        pcLeft.constant = result;
                        pcLeft.position.length = pcRight.position.column + pcRight.position.length - pcLeft.position.column;
                    }
                }
                if (!constantFolding)
                    left = {
                        type: TokenType.binaryOp,
                        position: position,
                        operator: operator,
                        firstOperand: left,
                        secondOperand: right
                    };
            }
        }
        return left;
    }
    considerIntDivisionWarning(operator, typeLeft, leftConstant, typeRight, rightConstant, position) {
        if (operator == TokenType.division) {
            if (this.isIntegerType(typeLeft) && this.isIntegerType(typeRight)) {
                if (rightConstant != 0 && leftConstant / rightConstant != Math.floor(leftConstant / rightConstant)) {
                    this.pushError("Da " + leftConstant + " und " + rightConstant + " ganzzahlige Werte sind, wird diese Division als Ganzzahldivision ausgeführt und ergibt den Wert " + Math.floor(leftConstant / rightConstant) + ". Falls das nicht gewünscht ist, hänge '.0' an einen der Operanden.", "info", position);
                }
            }
        }
    }
    isIntegerType(type) {
        return type == intPrimitiveType;
    }
    isConstant(node) {
        return (node != null && node.type == TokenType.pushConstant);
    }
    parsePlusPlusMinusMinus() {
        let incrementDecrementBefore = null;
        let position = null;
        if (this.comesToken([TokenType.doublePlus, TokenType.doubleMinus])) {
            incrementDecrementBefore = this.tt;
            position = this.getCurrentPosition();
            this.nextToken();
        }
        let t = this.parseUnary();
        if (incrementDecrementBefore != null) {
            t = {
                type: TokenType.incrementDecrementBefore,
                position: position,
                operator: incrementDecrementBefore,
                operand: t
            };
        }
        if (this.comesToken([TokenType.doublePlus, TokenType.doubleMinus])) {
            t = {
                type: TokenType.incrementDecrementAfter,
                position: this.getCurrentPosition(),
                operator: this.tt,
                operand: t
            };
            this.nextToken();
        }
        return t;
    }
    // -, not, this, super, a.b.c[][].d, a.b(), b() (== this.b()), super.b(), super()
    parseUnary() {
        let term;
        let position = this.getCurrentPosition();
        switch (this.tt) {
            case TokenType.leftBracket:
                return this.parseDotOrArrayChains(this.bracketOrCasting());
            case TokenType.minus:
            case TokenType.not:
            case TokenType.tilde:
                position = position;
                let tt1 = this.tt;
                this.nextToken();
                term = this.parseUnary();
                if (this.isConstant(term)) {
                    let pcTerm = term;
                    let typeTerm = TokenTypeToDataTypeMap[pcTerm.constantType];
                    let resultType = typeTerm.getResultType(tt1);
                    if (resultType != null) {
                        let result = typeTerm.compute(tt1, { type: typeTerm, value: pcTerm.constant });
                        pcTerm.constantType = resultType.toTokenType();
                        pcTerm.constant = result;
                        position.length = pcTerm.position.column - position.column + 1;
                        return pcTerm;
                    }
                }
                return {
                    type: TokenType.unaryOp,
                    position: position,
                    operand: term,
                    operator: tt1
                };
            case TokenType.keywordSuper:
                if (this.ct[1].tt == TokenType.leftBracket) {
                    this.nextToken(); // skip "super"
                    let parameters = this.parseMethodCallParameters();
                    term = {
                        type: TokenType.superConstructorCall,
                        position: position,
                        operands: parameters.nodes,
                        commaPositions: parameters.commaPositions,
                        rightBracketPosition: parameters.rightBracketPosition
                    };
                    return term;
                }
                else {
                    term = {
                        type: TokenType.keywordSuper,
                        position: position
                    };
                }
                this.nextToken();
                return this.parseDotOrArrayChains(term);
            case TokenType.keywordThis:
                term = {
                    type: TokenType.keywordThis,
                    position: position
                };
                this.nextToken();
                return this.parseDotOrArrayChains(term);
            case TokenType.keywordNew:
                return this.parseDotOrArrayChains(this.parseNew());
            case TokenType.integerConstant:
            case TokenType.charConstant:
            case TokenType.floatingPointConstant:
            case TokenType.stringConstant:
            case TokenType.booleanConstant:
                term = {
                    type: TokenType.pushConstant,
                    position: this.getCurrentPosition(),
                    constantType: this.tt,
                    constant: this.cct.value
                };
                let isStringConstant = this.tt == TokenType.stringConstant;
                this.nextToken();
                if (isStringConstant)
                    return this.parseDotOrArrayChains(term);
                return term;
            case TokenType.keywordNull:
                term = {
                    type: TokenType.pushConstant,
                    position: this.getCurrentPosition(),
                    constantType: TokenType.keywordNull,
                    constant: null
                };
                this.nextToken();
                return term;
            case TokenType.identifier: // attribute of current class or local variable
                let identifier1 = this.cct.value;
                let position1 = this.getCurrentPosition();
                this.nextToken();
                //@ts-ignore
                if (this.tt == TokenType.leftBracket) {
                    let parameters = this.parseMethodCallParameters();
                    let rightBracketPosition = parameters.rightBracketPosition;
                    term = {
                        type: TokenType.callMethod,
                        position: position1,
                        rightBracketPosition: rightBracketPosition,
                        operands: parameters.nodes,
                        object: term,
                        identifier: identifier1,
                        commaPositions: parameters.commaPositions
                    };
                }
                else {
                    term = {
                        type: TokenType.identifier,
                        identifier: identifier1,
                        position: position
                    };
                }
                return this.parseDotOrArrayChains(term);
            default:
                this.pushError("Erwartet wird eine Variable, ein Methodenaufruf oder this oder super. Gefunden wurde: " + this.cct.value);
                return null;
        }
    }
    bracketOrCasting() {
        let position = this.getCurrentPosition();
        this.nextToken(); // consume (
        if (this.tt == TokenType.identifier && this.ct[1].tt == TokenType.rightBracket &&
            this.tokensNotAfterCasting.indexOf(this.ct[2].tt) < 0) {
            let castToType = this.parseType();
            let position1 = this.getCurrentPosition(); // Position of )
            position.length = position1.column - position.column + 1;
            this.expect(TokenType.rightBracket, true);
            let whatToCast = this.parsePlusPlusMinusMinus();
            return {
                type: TokenType.castValue,
                position: position,
                castToType: castToType,
                whatToCast: whatToCast
            };
        }
        else {
            let term = this.parseTerm();
            let rightBracketPosition = this.getCurrentPosition();
            this.expect(TokenType.rightBracket, true);
            if (this.isConstant(term)) {
                return term;
            }
            let bracketsNode = {
                position: rightBracketPosition,
                type: TokenType.rightBracket,
                termInsideBrackets: term
            };
            return bracketsNode;
        }
    }
    parseNew() {
        this.nextToken();
        let position = this.getCurrentPosition();
        if (this.expect(TokenType.identifier, false)) {
            let identifier = this.cct.value;
            let identifierPosition = this.getCurrentPosition();
            this.nextToken();
            let genericParameterTypes = null;
            if (this.tt == TokenType.lower) {
                genericParameterTypes = [];
                let first = true;
                this.nextToken();
                //@ts-ignore
                while ((first && this.tt == TokenType.identifier) || (!first && this.tt == TokenType.comma)) {
                    if (!first)
                        this.nextToken(); // consume comma
                    first = false;
                    genericParameterTypes.push(this.parseType());
                }
                this.expect(TokenType.greater);
                if (genericParameterTypes.length == 0)
                    genericParameterTypes = null;
            }
            if (this.tt == TokenType.leftSquareBracket || this.tt == TokenType.leftRightSquareBracket) {
                let typenode = {
                    type: TokenType.type,
                    position: position,
                    arrayDimension: 0,
                    identifier: identifier,
                    genericParameterTypes: genericParameterTypes
                };
                this.typeNodes.push(typenode);
                let elementCount = [];
                while (this.tt == TokenType.leftSquareBracket || this.tt == TokenType.leftRightSquareBracket) {
                    typenode.arrayDimension++;
                    //@ts-ignore
                    if (this.tt == TokenType.leftRightSquareBracket) {
                        elementCount.push(null);
                        this.nextToken();
                    }
                    else {
                        this.nextToken();
                        elementCount.push(this.parseTerm());
                        this.expect(TokenType.rightSquareBracket, true);
                    }
                }
                let initialization = null;
                if (this.tt == TokenType.leftCurlyBracket) {
                    initialization = this.parseArrayLiteral(typenode);
                }
                let newArrayNode = {
                    type: TokenType.newArray,
                    position: position,
                    arrayType: typenode,
                    elementCount: elementCount,
                    initialization: initialization
                };
                return newArrayNode;
            }
            else if (this.tt == TokenType.leftBracket) {
                let parameters = this.parseMethodCallParameters();
                let classType = {
                    type: TokenType.type,
                    position: identifierPosition,
                    arrayDimension: 0,
                    identifier: identifier,
                    genericParameterTypes: genericParameterTypes
                };
                this.typeNodes.push(classType);
                return {
                    type: TokenType.newObject,
                    position: position,
                    classType: classType,
                    constructorOperands: parameters.nodes,
                    rightBracketPosition: parameters.rightBracketPosition,
                    commaPositions: parameters.commaPositions
                };
            }
            else {
                this.pushError("Konstruktoraufruf (also runde Klammer auf) oder Array-Intanzierung (eckige Klammer auf) erwartet.", "error", this.getCurrentPosition());
            }
        }
        return null;
    }
    parseArrayLiteral(arrayType) {
        // expects { as next token
        let nodes = [];
        let position = this.getCurrentPosition();
        let dimension = null;
        this.expect(TokenType.leftCurlyBracket, true);
        if (this.tt != TokenType.rightCurlyBracket) {
            let first = true;
            while (first || this.tt == TokenType.comma) {
                let position1 = this.getCurrentPosition();
                if (!first) {
                    this.nextToken(); // consume comma
                }
                first = false;
                let newDimension;
                if (this.tt == TokenType.leftCurlyBracket) {
                    let newType = {
                        type: TokenType.type,
                        position: this.getCurrentPosition(),
                        arrayDimension: arrayType.arrayDimension - 1,
                        identifier: arrayType.identifier
                    };
                    this.typeNodes.push(newType);
                    let al = this.parseArrayLiteral(newType);
                    newDimension = al.dimension + 1;
                    nodes.push(al);
                }
                else {
                    nodes.push(this.parseTerm());
                    newDimension = 1;
                }
                if (dimension != null) {
                    if (dimension != newDimension) {
                        this.pushError("Die Dimension dieses Array-Literals (" + (newDimension - 1) + " ist ungleich derjenigen der vorangegangenen Array-Literale (" + (dimension - 1) + ").", "error", position1);
                    }
                }
                dimension = newDimension;
            }
        }
        this.expect(TokenType.rightCurlyBracket, true);
        let ain = {
            type: TokenType.arrayInitialization,
            position: position,
            arrayType: arrayType,
            dimension: dimension,
            nodes: nodes
        };
        return ain;
    }
    parseMethodCallParameters() {
        // Assumption: current token is (        
        this.nextToken();
        if (this.tt == TokenType.rightBracket) {
            let rightBracketPosition = this.getCurrentPosition();
            this.nextToken();
            return { rightBracketPosition: rightBracketPosition, nodes: [], commaPositions: [] };
        }
        let parameters = [];
        let commaPositions = [];
        while (true) {
            let pos = this.pos;
            let parameter = this.parseTerm();
            if (parameter != null) {
                parameters.push(parameter);
            }
            if (this.tt != TokenType.comma) {
                break;
            }
            else {
                commaPositions.push(this.getCurrentPosition());
                this.nextToken(); // consume comma
            }
            // emergency-step:
            if (this.pos == pos) {
                this.nextToken();
            }
        }
        let position = this.getCurrentPosition();
        let rightBracketFound = this.expect(TokenType.rightBracket, true);
        return { rightBracketPosition: rightBracketFound ? position : null, nodes: parameters, commaPositions: commaPositions };
    }
    parseDotOrArrayChains(term) {
        if (term == null)
            return null;
        while (this.comesToken([TokenType.dot, TokenType.leftSquareBracket])) {
            if (this.tt == TokenType.dot) {
                this.nextToken();
                //@ts-ignore
                if (this.tt != TokenType.identifier) {
                    this.pushError("Erwartet wird der Bezeichner eines Attributs oder einer Methode, gefunden wurde: " + this.cct.value);
                    return term;
                }
                let identifier = this.cct.value;
                let position = this.getCurrentPosition();
                this.nextToken();
                //@ts-ignore
                if (this.tt == TokenType.leftBracket) {
                    let parameters = this.parseMethodCallParameters();
                    term = {
                        type: TokenType.callMethod,
                        position: position,
                        rightBracketPosition: parameters.rightBracketPosition,
                        operands: parameters.nodes,
                        object: term,
                        identifier: identifier,
                        commaPositions: parameters.commaPositions
                    };
                }
                else {
                    term = {
                        type: TokenType.pushAttribute,
                        position: position,
                        identifier: identifier,
                        object: term
                    };
                }
            }
            else {
                // let position = this.getCurrentPosition();
                let position = term.position;
                this.nextToken();
                let index = this.parseTerm();
                let positionEnd = this.getCurrentPosition();
                let position1 = Object.assign({}, position);
                this.expect(TokenType.rightSquareBracket, true);
                if (positionEnd.line == position.line) {
                    position1.length = positionEnd.column + positionEnd.length - position1.column;
                }
                else {
                    position1 = positionEnd;
                }
                term = {
                    type: TokenType.selectArrayElement,
                    position: position1,
                    index: index,
                    object: term
                };
            }
        }
        return term;
    }
    parseVariableDeclaration(type) {
        let isFinal = false;
        if (this.tt == TokenType.keywordFinal) {
            isFinal = true;
            this.nextToken();
        }
        if (type == null) {
            type = this.parseType();
        }
        if (this.tt != TokenType.identifier) {
            this.pushError("Hier wird ein Bezeichner (Name) einer Variable erwartet.", "error", this.getCurrentPosition());
            return null;
        }
        let identifier = this.cct.value;
        let position = this.getCurrentPosition();
        this.nextToken();
        let initialization = null;
        //@ts-ignore
        if (this.tt == TokenType.assignment) {
            this.nextToken();
            //@ts-ignore
            if (type.arrayDimension > 0 && this.tt == TokenType.leftCurlyBracket) {
                initialization = this.parseArrayLiteral(type);
            }
            else {
                initialization = this.parseTerm();
            }
        }
        //@ts-ignore
        if (this.tt == TokenType.endofSourcecode && type == null && identifier == null)
            return null;
        return {
            type: TokenType.localVariableDeclaration,
            position: position,
            identifier: identifier,
            variableType: type,
            initialization: initialization,
            isFinal: isFinal
        };
    }
    parseType() {
        /**
         * e.g. int, int[][], Integer, ArrayList<Integer> ,HashMap<Integer, ArrayList<String>>[][]
         */
        if (this.tt != TokenType.identifier && this.tt != TokenType.keywordVoid) {
            this.pushError("Erwartet wird ein Datentyp. Dieser muss mit einem Bezeichner beginnen. Gefunden wurde: " + this.cct.value, "error", this.getCurrentPosition());
            this.nextToken();
            return {
                type: TokenType.type,
                position: this.getCurrentPosition(),
                arrayDimension: 0,
                identifier: "int",
                genericParameterTypes: []
            };
        }
        let identifier = this.cct.value;
        let position = this.getCurrentPosition();
        this.nextToken();
        let genericParameterTypes = null;
        //@ts-ignore
        if (this.tt == TokenType.lower) {
            genericParameterTypes = [];
            let first = true;
            this.nextToken();
            //@ts-ignore
            while ((first && this.tt == TokenType.identifier) || (!first && this.tt == TokenType.comma)) {
                if (!first)
                    this.nextToken(); // consume comma
                first = false;
                genericParameterTypes.push(this.parseType());
            }
            this.expect(TokenType.greater);
        }
        let arrayDimension = 0;
        //@ts-ignore
        while (this.tt == TokenType.leftRightSquareBracket) {
            arrayDimension++;
            position.length += 2;
            this.nextToken();
        }
        let typenode = {
            type: TokenType.type,
            position: position,
            arrayDimension: arrayDimension,
            identifier: identifier,
            genericParameterTypes: genericParameterTypes
        };
        this.typeNodes.push(typenode);
        return typenode;
    }
    parseClassDefinition() {
        let commentBefore = this.cct.commentBefore;
        let modifiers = this.collectModifiers();
        if (!this.comesToken(Parser.ClassTokens)) {
            this.pushError("Erwartet wird class, interface oder enum. Gefunden wurde: " + this.cct.value);
            return null;
        }
        let classType = this.tt;
        this.nextToken();
        if (this.expect(TokenType.identifier, false)) {
            let identifier = this.cct.value;
            let position = this.getCurrentPosition();
            this.nextToken();
            let typeParameters = [];
            // For Generics: parse expression like <E, F extends Test implements Comparable<Test>>
            if (this.tt == TokenType.lower) {
                typeParameters = this.parseTypeParameterDefinition();
            }
            let extendsImplements = this.parseExtendsImplements(classType == TokenType.keywordInterface);
            if (classType == TokenType.keywordEnum) {
                return this.parseEnum(identifier, extendsImplements, position, modifiers.visibility, commentBefore);
            }
            let scopeFrom = this.getCurrentPosition();
            if (this.expect(TokenType.leftCurlyBracket, true)) {
                let methodsAndAttributes = this.parseClassBody(classType, identifier);
                let scopeTo = this.getEndOfCurrentToken();
                this.expect(TokenType.rightCurlyBracket, true);
                switch (classType) {
                    case TokenType.keywordClass: return {
                        type: TokenType.keywordClass,
                        position: position,
                        scopeFrom: scopeFrom,
                        scopeTo: scopeTo,
                        identifier: identifier,
                        attributes: methodsAndAttributes.attributes,
                        methods: methodsAndAttributes.methods,
                        isAbstract: modifiers.isAbstract,
                        visibility: modifiers.visibility,
                        extends: extendsImplements.extends,
                        implements: extendsImplements.implements,
                        typeParameters: typeParameters,
                        commentBefore: commentBefore
                    };
                    case TokenType.keywordInterface: return {
                        type: TokenType.keywordInterface,
                        position: position,
                        identifier: identifier,
                        scopeFrom: scopeFrom,
                        scopeTo: scopeTo,
                        methods: methodsAndAttributes.methods,
                        typeParameters: typeParameters,
                        extends: extendsImplements.implements,
                        commentBefore: commentBefore
                    };
                }
            }
        }
    }
    parseTypeParameterDefinition() {
        let typeParameters = [];
        let identifierMap = {};
        this.expect(TokenType.lower, true);
        let first = true;
        while ((first && this.tt == TokenType.identifier) || (!first && this.tt == TokenType.comma)) {
            if (!first)
                this.expect(TokenType.comma, true);
            let tp = {
                type: TokenType.typeParameter,
                position: this.getCurrentPosition(),
                identifier: this.cct.value,
                extends: null,
                implements: null
            };
            if (identifierMap[tp.identifier] != null) {
                this.pushError("Zwei Typparameter dürfe nicht denselben Bezeichner tragen.");
            }
            identifierMap[tp.identifier] = true;
            this.nextToken();
            let extendsImplements = this.parseTypeParameterBounds();
            tp.extends = extendsImplements.extends;
            if (tp.extends != null && tp.extends.arrayDimension > 0) {
                this.pushError("Der Datentyp des Typparameters " + tp.identifier + " darf kein Array sein.");
            }
            tp.implements = extendsImplements.implements;
            tp.implements.forEach((im) => {
                if (im.arrayDimension > 0) {
                    this.pushError("Der Datentyp des Typparameters " + tp.identifier + " darf kein Array sein.");
                }
            });
            first = false;
            typeParameters.push(tp);
        }
        this.expect(TokenType.greater, true);
        return typeParameters;
    }
    parseEnum(identifier, extendsImplements, position, visibility, commentBefore) {
        if (extendsImplements.extends != null) {
            this.pushError("Ein enum kann nicht mit extends erweitert werden.");
        }
        if (extendsImplements.implements.length > 0) {
            this.pushError("Ein enum kann kein Interface implementieren.");
        }
        let scopeFrom = this.getCurrentPosition();
        if (this.expect(TokenType.leftCurlyBracket, true)) {
            let values = this.parseEnumValues();
            let methodsAndAttributes = this.parseClassBody(TokenType.keywordEnum, identifier);
            let scopeTo = this.getEndOfCurrentToken();
            this.expect(TokenType.rightCurlyBracket, true);
            return {
                type: TokenType.keywordEnum,
                position: position,
                scopeFrom: scopeFrom,
                scopeTo: scopeTo,
                attributes: methodsAndAttributes.attributes,
                methods: methodsAndAttributes.methods,
                identifier: identifier,
                values: values,
                visibility: visibility,
                commentBefore: commentBefore
            };
        }
        return null;
    }
    parseEnumValues() {
        let values = [];
        let pos = 0;
        let first = true;
        while ((first && this.tt == TokenType.identifier) || this.tt == TokenType.comma) {
            pos = this.pos;
            if (!first)
                this.nextToken(); // skip comma
            first = false;
            if (this.expect(TokenType.identifier, false)) {
                let identifier = this.cct.value;
                let position = this.getCurrentPosition();
                this.nextToken();
                let constructorParameters = null;
                let commaPositions = [];
                let rightBracketPosition = null;
                //@ts-ignore
                if (this.tt == TokenType.leftBracket) {
                    let mcp = this.parseMethodCallParameters();
                    constructorParameters = mcp.nodes;
                    commaPositions = mcp.commaPositions;
                    rightBracketPosition = mcp.rightBracketPosition;
                }
                values.push({
                    type: TokenType.pushEnumValue,
                    constructorParameters: constructorParameters,
                    identifier: identifier,
                    position: position,
                    commaPositions: commaPositions,
                    rightBracketPosition: rightBracketPosition
                });
            }
            ;
            if (this.pos == pos) {
                this.nextToken(); // in case of parsing-emergency
            }
        }
        if (this.tt == TokenType.semicolon) {
            this.nextToken();
        }
        return values;
    }
    parseClassBody(classType, className) {
        // Assumption: { is already consumed
        let methods = [];
        let attributes = [];
        while (true) {
            if (this.tt == TokenType.rightCurlyBracket || this.tt == TokenType.endofSourcecode) {
                break;
            }
            let commentBefore = this.cct.commentBefore;
            let annotation = null;
            if (this.tt == TokenType.at) {
                annotation = this.cct.value;
            }
            let modifiers = this.collectModifiers();
            let isConstructor = false;
            let position = this.getCurrentPosition();
            if (this.tt == TokenType.identifier && this.cct.value == className && this.ct[1].tt == TokenType.leftBracket) {
                isConstructor = true;
            }
            let type = this.parseType();
            if (isConstructor) {
                type = {
                    identifier: "void",
                    arrayDimension: 0,
                    position: type.position,
                    type: TokenType.type
                };
            }
            if (isConstructor || this.expect(TokenType.identifier, false)) {
                let identifier = className;
                if (!isConstructor) {
                    position = this.getCurrentPosition();
                    identifier = this.cct.value;
                    this.nextToken();
                }
                if (this.tt == TokenType.leftBracket) {
                    if (isConstructor && classType == TokenType.keywordEnum && modifiers.visibility != Visibility.private) {
                        this.pushError("Konstruktoren in enums müssen private sein.", "error", position);
                    }
                    let parameters = this.parseMethodDeclarationParameters();
                    let statements;
                    let scopeFrom = this.getCurrentPosition();
                    let scopeTo = scopeFrom;
                    if (modifiers.isAbstract) {
                        this.expect(TokenType.semicolon, true);
                        if (isConstructor) {
                            this.pushError("Ein Konstruktor kann nicht abstrakt sein.", "error", position);
                        }
                        statements = [];
                    }
                    else {
                        scopeFrom = this.getCurrentPosition();
                        statements = this.parseStatement();
                        scopeTo = this.getEndOfCurrentToken();
                        if (statements != null && statements.length > 0 && statements[0].type == TokenType.scopeNode) {
                            let scopeNode = statements[0];
                            scopeFrom = scopeNode.position;
                            scopeTo = scopeNode.positionTo;
                        }
                    }
                    methods.push({
                        type: TokenType.methodDeclaration,
                        identifier: identifier,
                        position: position,
                        scopeFrom: scopeFrom,
                        scopeTo: scopeTo,
                        parameters: parameters,
                        statements: statements,
                        visibility: modifiers.visibility,
                        isAbstract: modifiers.isAbstract || classType == TokenType.keywordInterface,
                        isStatic: modifiers.isStatic,
                        isConstructor: isConstructor,
                        returnType: type,
                        annotation: annotation,
                        isTransient: modifiers.isTransient,
                        commentBefore: commentBefore
                    });
                }
                else {
                    if (identifier == className) {
                        this.pushError("Das Attribut " + className + " darf nicht denselben Bezeichner haben wie die Klasse.", "error", position);
                    }
                    let initialization = null;
                    if (this.tt == TokenType.assignment) {
                        this.nextToken();
                        //@ts-ignore
                        if (type.arrayDimension > 0 && this.tt == TokenType.leftCurlyBracket) {
                            initialization = this.parseArrayLiteral(type);
                        }
                        else {
                            initialization = this.parseTerm();
                        }
                    }
                    this.expect(TokenType.semicolon);
                    attributes.push({
                        type: TokenType.attributeDeclaration,
                        identifier: identifier,
                        position: position,
                        attributeType: type,
                        isStatic: modifiers.isStatic,
                        isFinal: modifiers.isFinal,
                        visibility: modifiers.visibility,
                        initialization: initialization,
                        annotation: annotation,
                        isTransient: modifiers.isTransient,
                        commentBefore: commentBefore
                    });
                    if (classType == TokenType.keywordInterface) {
                        this.pushError("Interfaces dürfen keine Attribute enthalten.", "error", position);
                    }
                }
            }
        }
        return { methods: methods, attributes: attributes };
    }
    parseMethodDeclarationParameters() {
        // Assumption: next token is (
        let parameters = [];
        this.nextToken();
        if (this.tt == TokenType.rightBracket) {
            this.nextToken();
            return [];
        }
        let ellipsis = false;
        while (true) {
            if (ellipsis) {
                this.pushError("Nur der letzte Parameter darf als Ellipsis (...) definiert werden.");
            }
            let isFinal = this.tt == TokenType.keywordFinal;
            if (isFinal)
                this.nextToken();
            let type = this.parseType();
            ellipsis = this.tt == TokenType.ellipsis;
            if (ellipsis) {
                this.nextToken();
                type.arrayDimension++;
            }
            if (this.expect(TokenType.identifier, false)) {
                let identifier = this.cct.value;
                parameters.push({
                    type: TokenType.parameterDeclaration,
                    position: this.getCurrentPosition(),
                    identifier: identifier,
                    parameterType: type,
                    isFinal: isFinal,
                    isEllipsis: ellipsis
                });
                this.nextToken();
            }
            if (this.tt != TokenType.comma) {
                break;
            }
            this.nextToken(); // consume comma
        }
        this.expect(TokenType.rightBracket, true);
        return parameters;
    }
    parseExtendsImplements(isInterface) {
        let sextends = null;
        let simplements = [];
        while (this.comesToken([TokenType.keywordExtends, TokenType.keywordImplements])) {
            if (this.comesToken(TokenType.keywordExtends) && !isInterface) {
                if (sextends != null) {
                    this.pushError("Eine Klasse kann nicht Unterklasse von zwei anderen Klassen sein, es darf also hier nur ein Mal 'extends...' stehen.", "error", sextends.position);
                }
                this.nextToken(); // skip extends
                sextends = this.parseType();
                if (sextends != null && sextends.arrayDimension > 0) {
                    this.pushError("Der Datentyp der Basisklasse darf kein Array sein.", "error", sextends.position);
                }
            }
            if ((!isInterface && this.comesToken(TokenType.keywordImplements)) || (isInterface && this.comesToken(TokenType.keywordExtends))) {
                if (simplements.length > 0) {
                    this.pushError("Es darf hier nur ein Mal 'implements' stehen, hinter 'implements' ist aber eine kommaseparierte Liste von Interfaces erlaubt.", "warning");
                }
                this.nextToken(); // Skip implements/extends
                let first = true;
                while ((first && this.tt == TokenType.identifier) || (!first && this.tt == TokenType.comma)) {
                    if (!first)
                        this.nextToken(); // skip comma
                    first = false;
                    simplements.push(this.parseType());
                }
            }
        }
        simplements.forEach((im) => {
            if (im.arrayDimension > 0) {
                this.pushError(im.identifier + "[] ist kein Interface, sondern ein Array. Array-Datentypen sind hier nicht erlaubt.");
            }
        });
        return {
            extends: sextends, implements: simplements
        };
    }
    parseTypeParameterBounds() {
        let sextends = null;
        let simplements = [];
        if (this.comesToken(TokenType.keywordExtends)) {
            this.nextToken(); // skip extends
            sextends = this.parseType();
        }
        while (this.comesToken(TokenType.ampersand)) {
            this.nextToken(); // Skip ampersand
            simplements.push(this.parseType());
        }
        return {
            extends: sextends, implements: simplements
        };
    }
    collectModifiers() {
        let visibility = Visibility.public;
        let isAbstract = false;
        let isStatic = false;
        let isFinal = false;
        let isTransient = false;
        let done = false;
        while (!done) {
            switch (this.tt) {
                case TokenType.keywordPublic:
                    visibility = Visibility.public;
                    this.nextToken();
                    break;
                case TokenType.keywordPrivate:
                    visibility = Visibility.private;
                    this.nextToken();
                    break;
                case TokenType.keywordProtected:
                    visibility = Visibility.protected;
                    this.nextToken();
                    break;
                case TokenType.keywordStatic:
                    isStatic = true;
                    this.nextToken();
                    break;
                case TokenType.keywordAbstract:
                    isAbstract = true;
                    this.nextToken();
                    break;
                case TokenType.keywordFinal:
                    isFinal = true;
                    this.nextToken();
                    break;
                case TokenType.keywordTransient:
                    isTransient = true;
                    this.nextToken();
                    break;
                default: done = true;
            }
        }
        return { isAbstract: isAbstract, isStatic: isStatic, visibility: visibility, isFinal: isFinal, isTransient: isTransient };
    }
}
Parser.assignmentOperators = [TokenType.assignment, TokenType.plusAssignment, TokenType.minusAssignment,
    TokenType.multiplicationAssignment, TokenType.divisionAssignment, TokenType.moduloAssignment,
    TokenType.ANDAssigment, TokenType.XORAssigment, TokenType.ORAssigment,
    TokenType.shiftLeftAssigment, TokenType.shiftRightAssigment, TokenType.shiftRightUnsignedAssigment];
Parser.operatorPrecedence = [Parser.assignmentOperators,
    [TokenType.ternaryOperator], [TokenType.colon],
    [TokenType.or], [TokenType.and], [TokenType.OR], [TokenType.XOR], [TokenType.ampersand],
    [TokenType.equal, TokenType.notEqual],
    [TokenType.keywordInstanceof, TokenType.lower, TokenType.lowerOrEqual, TokenType.greater, TokenType.greaterOrEqual],
    [TokenType.shiftLeft, TokenType.shiftRight, TokenType.shiftRightUnsigned],
    // [TokenType.or], [TokenType.and],
    // [TokenType.keywordInstanceof, TokenType.lower, TokenType.lowerOrEqual, TokenType.greater, TokenType.greaterOrEqual, TokenType.equal, TokenType.notEqual],
    [TokenType.plus, TokenType.minus], [TokenType.multiplication, TokenType.division, TokenType.modulo]
];
Parser.TokenTypeToVisibilityMap = {
    [TokenType.keywordPublic]: Visibility.public,
    [TokenType.keywordPrivate]: Visibility.private,
    [TokenType.keywordProtected]: Visibility.protected
};
Parser.forwardToInsideClass = [TokenType.keywordPublic, TokenType.keywordPrivate, TokenType.keywordProtected, TokenType.keywordVoid,
    TokenType.identifier, TokenType.rightCurlyBracket, TokenType.keywordStatic, TokenType.keywordAbstract,
    TokenType.keywordClass, TokenType.keywordEnum, TokenType.keywordInterface];
Parser.ClassTokens = [TokenType.keywordClass, TokenType.keywordEnum, TokenType.keywordInterface];
Parser.VisibilityTokens = [TokenType.keywordPrivate, TokenType.keywordProtected, TokenType.keywordPublic];
Parser.BeforeClassDefinitionTokens = Parser.ClassTokens.concat(Parser.VisibilityTokens).concat(TokenType.keywordAbstract).concat(Parser.ClassTokens);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9jb21waWxlci9wYXJzZXIvUGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBa0MsU0FBUyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDakcsT0FBTyxFQUFFLFVBQVUsRUFBUyxNQUFNLG1CQUFtQixDQUFDO0FBR3RELE9BQU8sRUFBdUIsZ0JBQWdCLEVBQXFCLHNCQUFzQixFQUFxQixNQUFNLDRCQUE0QixDQUFDO0FBTWpKLE1BQU0sT0FBTyxNQUFNO0lBc0RmLFlBQW9CLGVBQXdCO1FBQXhCLG9CQUFlLEdBQWYsZUFBZSxDQUFTO1FBZjVDLGNBQVMsR0FBRyxDQUFDLENBQUM7UUFRZCxhQUFRLEdBQVU7WUFDZCxRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRTtZQUMzQyxFQUFFLEVBQUUsU0FBUyxDQUFDLGVBQWU7WUFDN0IsS0FBSyxFQUFFLHdCQUF3QjtTQUNsQyxDQUFDO1FBeWxDRiwwQkFBcUIsR0FBZ0IsQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDbEcsU0FBUyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7SUFybEMvRixDQUFDO0lBRUQsS0FBSyxDQUFDLENBQVM7UUFFWCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUVoQixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDN0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFFcEIsSUFBSSxJ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QWMsRUFBRSxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLFdBQVc7SUFDbkksU0FBUyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsaUJBQWlCLEVBQUUsU0FBUyxDQUFDLGFBQWEsRUFBRSxTQUFTLENBQUMsZUFBZTtJQUNyRyxTQUFTLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUF1UHBFLGtCQUFXLEdBQWdCLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3ZHLHVCQUFnQixHQUFnQixDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUNoSCxrQ0FBMkIsR0FBZ0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXJyb3IsIFF1aWNrRml4LCBFcnJvckxldmVsIH0gZnJvbSBcIi4uL2xleGVyL0xleGVyLmpzXCI7XHJcbmltcG9ydCB7IFRleHRQb3NpdGlvbiwgVG9rZW4sIFRva2VuTGlzdCwgVG9rZW5UeXBlLCBUb2tlblR5cGVSZWFkYWJsZSB9IGZyb20gXCIuLi9sZXhlci9Ub2tlbi5qc1wiO1xyXG5pbXBvcnQgeyBWaXNpYmlsaXR5LCBLbGFzcyB9IGZyb20gXCIuLi90eXBlcy9DbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBBcnJheUluaXRpYWxpemF0aW9uTm9kZSwgQVNUTm9kZSwgQXR0cmlidXRlRGVjbGFyYXRpb25Ob2RlLCBNZXRob2REZWNsYXJhdGlvbk5vZGUsIE5ld0FycmF5Tm9kZSwgUGFyYW1ldGVyTm9kZSwgVGVybU5vZGUsIFR5cGVOb2RlLCBFbnVtVmFsdWVOb2RlLCBTd2l0Y2hOb2RlLCBTd2l0Y2hDYXNlTm9kZSwgQ29uc3RhbnROb2RlLCBCcmFja2V0c05vZGUsIFNjb3BlTm9kZSwgVHlwZVBhcmFtZXRlck5vZGUsIExvY2FsVmFyaWFibGVEZWNsYXJhdGlvbk5vZGUgfSBmcm9tIFwiLi9BU1QuanNcIjtcclxuaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4vTW9kdWxlLmpzXCI7XHJcbmltcG9ydCB7IHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGludFByaW1pdGl2ZVR5cGUsIGNoYXJQcmltaXRpdmVUeXBlLCBUb2tlblR5cGVUb0RhdGFUeXBlTWFwLCB2b2lkUHJpbWl0aXZlVHlwZSB9IGZyb20gXCIuLi90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBFbnVtIH0gZnJvbSBcIi4uL3R5cGVzL0VudW0uanNcIjtcclxuaW1wb3J0IHsgUHJpbWl0aXZlVHlwZSwgVHlwZSB9IGZyb20gXCIuLi90eXBlcy9UeXBlcy5qc1wiO1xyXG5cclxudHlwZSBBU1ROb2RlcyA9IEFTVE5vZGVbXTtcclxuXHJcbmV4cG9ydCBjbGFzcyBQYXJzZXIge1xyXG5cclxuICAgIHN0YXRpYyBhc3NpZ25tZW50T3BlcmF0b3JzID0gW1Rva2VuVHlwZS5hc3NpZ25tZW50LCBUb2tlblR5cGUucGx1c0Fzc2lnbm1lbnQsIFRva2VuVHlwZS5taW51c0Fzc2lnbm1lbnQsIFxyXG4gICAgICAgIFRva2VuVHlwZS5tdWx0aXBsaWNhdGlvbkFzc2lnbm1lbnQsIFRva2VuVHlwZS5kaXZpc2lvbkFzc2lnbm1lbnQsIFRva2VuVHlwZS5tb2R1bG9Bc3NpZ25tZW50LCBcclxuICAgICAgICBUb2tlblR5cGUuQU5EQXNzaWdtZW50LCBUb2tlblR5cGUuWE9SQXNzaWdtZW50LCBUb2tlblR5cGUuT1JBc3NpZ21lbnQsIFxyXG4gICAgICAgIFRva2VuVHlwZS5zaGlmdExlZnRBc3NpZ21lbnQsIFRva2VuVHlwZS5zaGlmdFJpZ2h0QXNzaWdtZW50LCBUb2tlblR5cGUuc2hpZnRSaWdodFVuc2lnbmVkQXNzaWdtZW50XTtcclxuXHJcbiAgICBzdGF0aWMgb3BlcmF0b3JQcmVjZWRlbmNlOiBUb2tlblR5cGVbXVtdID0gW1BhcnNlci5hc3NpZ25tZW50T3BlcmF0b3JzLFxyXG4gICAgW1Rva2VuVHlwZS50ZXJuYXJ5T3BlcmF0b3JdLCBbVG9rZW5UeXBlLmNvbG9uXSxcclxuXHJcbiAgICBbVG9rZW5UeXBlLm9yXSwgW1Rva2VuVHlwZS5hbmRdLCBbVG9rZW5UeXBlLk9SXSwgW1Rva2VuVHlwZS5YT1JdLCBbVG9rZW5UeXBlLmFtcGVyc2FuZF0sXHJcbiAgICBbVG9rZW5UeXBlLmVxdWFsLCBUb2tlblR5cGUubm90RXF1YWxdLFxyXG4gICAgW1Rva2VuVHlwZS5rZXl3b3JkSW5zdGFuY2VvZiwgVG9rZW5UeXBlLmxvd2VyLCBUb2tlblR5cGUubG93ZXJPckVxdWFsLCBUb2tlblR5cGUuZ3JlYXRlciwgVG9rZW5UeXBlLmdyZWF0ZXJPckVxdWFsXSxcclxuICAgIFtUb2tlblR5cGUuc2hpZnRMZWZ0LCBUb2tlblR5cGUuc2hpZnRSaWdodCwgVG9rZW5UeXBlLnNoaWZ0UmlnaHRVbnNpZ25lZF0sXHJcblxyXG4gICAgLy8gW1Rva2VuVHlwZS5vcl0sIFtUb2tlblR5cGUuYW5kXSxcclxuICAgIC8vIFtUb2tlblR5cGUua2V5d29yZEluc3RhbmNlb2YsIFRva2VuVHlwZS5sb3dlciwgVG9rZW5UeXBlLmxvd2VyT3JFcXVhbCwgVG9rZW5UeXBlLmdyZWF0ZXIsIFRva2VuVHlwZS5ncmVhdGVyT3JFcXVhbCwgVG9rZW5UeXBlLmVxdWFsLCBUb2tlblR5cGUubm90RXF1YWxdLFxyXG4gICAgXHJcbiAgICBbVG9rZW5UeXBlLnBsdXMsIFRva2VuVHlwZS5taW51c10sIFtUb2tlblR5cGUubXVsdGlwbGljYXRpb24sIFRva2VuVHlwZS5kaXZpc2lvbiwgVG9rZW5UeXBlLm1vZHVsb11cclxuICAgIF07XHJcblxyXG4gICAgc3RhdGljIFRva2VuVHlwZVRvVmlzaWJpbGl0eU1hcCA9IHtcclxuICAgICAgICBbVG9rZW5UeXBlLmtleXdvcmRQdWJsaWNdOiBWaXNpYmlsaXR5LnB1YmxpYyxcclxuICAgICAgICBbVG9rZW5UeXBlLmtleXdvcmRQcml2YXRlXTogVmlzaWJpbGl0eS5wcml2YXRlLFxyXG4gICAgICAgIFtUb2tlblR5cGUua2V5d29yZFByb3RlY3RlZF06IFZpc2liaWxpdHkucHJvdGVjdGVkXHJcbiAgICB9O1xyXG5cclxuICAgIHN0YXRpYyBmb3J3YXJkVG9JbnNpZGVDbGFzcyA9IFtUb2tlblR5cGUua2V5d29yZFB1YmxpYywgVG9rZW5UeXBlLmtleXdvcmRQcml2YXRlLCBUb2tlblR5cGUua2V5d29yZFByb3RlY3RlZCwgVG9rZW5UeXBlLmtleXdvcmRWb2lkLFxyXG4gICAgVG9rZW5UeXBlLmlkZW50aWZpZXIsIFRva2VuVHlwZS5yaWdodEN1cmx5QnJhY2tldCwgVG9rZW5UeXBlLmtleXdvcmRTdGF0aWMsIFRva2VuVHlwZS5rZXl3b3JkQWJzdHJhY3QsXHJcbiAgICBUb2tlblR5cGUua2V5d29yZENsYXNzLCBUb2tlblR5cGUua2V5d29yZEVudW0sIFRva2VuVHlwZS5rZXl3b3JkSW50ZXJmYWNlXTtcclxuXHJcbiAgICBtb2R1bGU6IE1vZHVsZTtcclxuXHJcbiAgICBwb3M6IG51bWJlcjtcclxuICAgIHRva2VuTGlzdDogVG9rZW5MaXN0O1xyXG5cclxuICAgIGVycm9yTGlzdDogRXJyb3JbXTtcclxuICAgIHR5cGVOb2RlczogVHlwZU5vZGVbXTtcclxuXHJcbiAgICBsb29rYWhlYWQgPSA0O1xyXG4gICAgY3Q6IFRva2VuW107XHJcbiAgICBsYXN0VG9rZW46IFRva2VuO1xyXG4gICAgY2N0OiBUb2tlbjtcclxuICAgIHR0OiBUb2tlblR5cGU7XHJcbiAgICBwb3NpdGlvbjogVGV4dFBvc2l0aW9uO1xyXG4gICAgbGFzdENvbW1lbnQ6IFRva2VuO1xyXG5cclxuICAgIGVuZFRva2VuOiBUb2tlbiA9IHtcclxuICAgICAgICBwb3NpdGlvbjogeyBsaW5lOiAwLCBjb2x1bW46IDAsIGxlbmd0aDogMSB9LFxyXG4gICAgICAgIHR0OiBUb2tlblR5cGUuZW5kb2ZTb3VyY2Vjb2RlLFxyXG4gICAgICAgIHZhbHVlOiBcImRhcyBFbmRlIGRlcyBQcm9ncmFtbXNcIlxyXG4gICAgfTtcclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBpc0luQ29uc29sZU1vZGU6IGJvb2xlYW4pe1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwYXJzZShtOiBNb2R1bGUpIHtcclxuXHJcbiAgICAgICAgdGhpcy5tb2R1bGUgPSBtO1xyXG5cclxuICAgICAgICB0aGlzLnRva2VuTGlzdCA9IG0udG9rZW5MaXN0O1xyXG4gICAgICAgIHRoaXMuZXJyb3JMaXN0ID0gW107XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnRva2VuTGlzdC5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLm1vZHVsZS5tYWluUHJvZ3JhbUFzdCA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLm1vZHVsZS5jbGFzc0RlZmluaXRpb25zQVNUID0gW107XHJcbiAgICAgICAgICAgIHRoaXMubW9kdWxlLnR5cGVOb2RlcyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLm1vZHVsZS5lcnJvcnNbMV0gPSB0aGlzLmVycm9yTGlzdDtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wb3MgPSAwO1xyXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZUxvb2thaGVhZCgpO1xyXG5cclxuICAgICAgICB0aGlzLnR5cGVOb2RlcyA9IFtdO1xyXG5cclxuICAgICAgICBsZXQgbGFzdFRva2VuID0gdGhpcy50b2tlbkxpc3RbdGhpcy50b2tlbkxpc3QubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgdGhpcy5lbmRUb2tlbi5wb3NpdGlvbiA9IHsgbGluZTogbGFzdFRva2VuLnBvc2l0aW9uLmxpbmUsIGNvbHVtbjogbGFzdFRva2VuLnBvc2l0aW9uLmNvbHVtbiArIGxhc3RUb2tlbi5wb3NpdGlvbi5sZW5ndGgsIGxlbmd0aDogMSB9O1xyXG5cclxuICAgICAgICBsZXQgYXN0Tm9kZXMgPSB0aGlzLnBhcnNlTWFpbigpO1xyXG4gICAgICAgIHRoaXMubW9kdWxlLm1haW5Qcm9ncmFtQXN0ID0gYXN0Tm9kZXMubWFpblByb2dyYW1BU1Q7XHJcbiAgICAgICAgdGhpcy5tb2R1bGUuY2xhc3NEZWZpbml0aW9uc0FTVCA9IGFzdE5vZGVzLmNsYXNzRGVmaW5pdGlvbkFTVDtcclxuICAgICAgICB0aGlzLm1vZHVsZS5tYWluUHJvZ3JhbUVuZCA9IGFzdE5vZGVzLm1haW5Qcm9ncmFtRW5kO1xyXG4gICAgICAgIHRoaXMubW9kdWxlLnR5cGVOb2RlcyA9IHRoaXMudHlwZU5vZGVzO1xyXG5cclxuICAgICAgICB0aGlzLm1vZHVsZS5lcnJvcnNbMV0gPSB0aGlzLmVycm9yTGlzdDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdGlhbGl6ZUxvb2thaGVhZCgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jdCA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubG9va2FoZWFkOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIGxldCB0b2tlbjogVG9rZW4gPSB0aGlzLmVuZFRva2VuO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wb3MgPj0gdGhpcy50b2tlbkxpc3QubGVuZ3RoKSBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgdG9rZW4xID0gdGhpcy50b2tlbkxpc3RbdGhpcy5wb3NdXHJcbiAgICAgICAgICAgICAgICBpZih0b2tlbjEudHQgPT0gVG9rZW5UeXBlLmNvbW1lbnQpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGFzdENvbW1lbnQgPSB0b2tlbjE7XHJcbiAgICAgICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0b2tlbjEudHQgIT0gVG9rZW5UeXBlLm5ld2xpbmUgJiYgdG9rZW4xLnR0ICE9IFRva2VuVHlwZS5zcGFjZSAmJiB0b2tlbjEudHQgIT0gVG9rZW5UeXBlLmNvbW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0b2tlbiA9IHRva2VuMTtcclxuICAgICAgICAgICAgICAgICAgICBpZih0aGlzLmxhc3RDb21tZW50ICE9IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbi5jb21tZW50QmVmb3JlID0gdGhpcy5sYXN0Q29tbWVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0Q29tbWVudCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucG9zKys7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmN0LnB1c2godG9rZW4pO1xyXG5cclxuICAgICAgICAgICAgaWYgKGkgPCB0aGlzLmxvb2thaGVhZCAtIDEpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9zKys7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmNjdCA9IHRoaXMuY3RbMF07XHJcbiAgICAgICAgdGhpcy50dCA9IHRoaXMuY2N0LnR0O1xyXG4gICAgICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLmNjdC5wb3NpdGlvbjtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgbmV4dFRva2VuKCkge1xyXG5cclxuICAgICAgICBsZXQgdG9rZW46IFRva2VuO1xyXG4gICAgICAgIHRoaXMubGFzdFRva2VuID0gdGhpcy5jY3Q7XHJcblxyXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBvcysrO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMucG9zID49IHRoaXMudG9rZW5MaXN0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdG9rZW4gPSB0aGlzLmVuZFRva2VuO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRva2VuID0gdGhpcy50b2tlbkxpc3RbdGhpcy5wb3NdXHJcbiAgICAgICAgICAgIGlmKHRva2VuLnR0ID09IFRva2VuVHlwZS5jb21tZW50KXtcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdENvbW1lbnQgPSB0b2tlbjtcclxuICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgIGlmICh0b2tlbi50dCAhPSBUb2tlblR5cGUubmV3bGluZSAmJiB0b2tlbi50dCAhPSBUb2tlblR5cGUuc3BhY2UgJiYgdG9rZW4udHQgIT0gVG9rZW5UeXBlLmNvbW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIHRva2VuLmNvbW1lbnRCZWZvcmUgPSB0aGlzLmxhc3RDb21tZW50O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0Q29tbWVudCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sb29rYWhlYWQgLSAxOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5jdFtpXSA9IHRoaXMuY3RbaSArIDFdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jdFt0aGlzLmxvb2thaGVhZCAtIDFdID0gdG9rZW47XHJcblxyXG4gICAgICAgIHRoaXMuY2N0ID0gdGhpcy5jdFswXTtcclxuICAgICAgICB0aGlzLnR0ID0gdGhpcy5jY3QudHQ7XHJcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMuY2N0LnBvc2l0aW9uO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwdXNoRXJyb3IodGV4dDogc3RyaW5nLCBlcnJvckxldmVsOiBFcnJvckxldmVsID0gXCJlcnJvclwiLCBwb3NpdGlvbj86IFRleHRQb3NpdGlvbiwgcXVpY2tGaXg/OiBRdWlja0ZpeCkge1xyXG4gICAgICAgIGlmIChwb3NpdGlvbiA9PSBudWxsKSBwb3NpdGlvbiA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMucG9zaXRpb24pO1xyXG4gICAgICAgIHRoaXMuZXJyb3JMaXN0LnB1c2goe1xyXG4gICAgICAgICAgICB0ZXh0OiB0ZXh0LFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24sXHJcbiAgICAgICAgICAgIHF1aWNrRml4OiBxdWlja0ZpeCxcclxuICAgICAgICAgICAgbGV2ZWw6IGVycm9yTGV2ZWxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBleHBlY3QodHQ6IFRva2VuVHlwZSwgc2tpcDogYm9vbGVhbiA9IHRydWUsIGludm9rZVNlbWljb2xvbkFuZ2VsOiBib29sZWFuID0gZmFsc2UpOiBib29sZWFuIHtcclxuICAgICAgICBpZiAodGhpcy50dCAhPSB0dCkge1xyXG4gICAgICAgICAgICBpZiAodHQgPT0gVG9rZW5UeXBlLnNlbWljb2xvbiAmJiB0aGlzLnR0ID09IFRva2VuVHlwZS5lbmRvZlNvdXJjZWNvZGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgcG9zaXRpb246IFRleHRQb3NpdGlvbiA9IHRoaXMuY2N0LnBvc2l0aW9uO1xyXG4gICAgICAgICAgICBpZiAodHQgPT0gVG9rZW5UeXBlLnNlbWljb2xvbiAmJiB0aGlzLmxhc3RUb2tlbiAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGFzdFRva2VuLnBvc2l0aW9uLmxpbmUgPCBwb3NpdGlvbi5saW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmU6IHRoaXMubGFzdFRva2VuLnBvc2l0aW9uLmxpbmUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbHVtbjogdGhpcy5sYXN0VG9rZW4ucG9zaXRpb24uY29sdW1uICsgdGhpcy5sYXN0VG9rZW4ucG9zaXRpb24ubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IDFcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBxdWlja0ZpeDogUXVpY2tGaXggPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAodHQgPT0gVG9rZW5UeXBlLnNlbWljb2xvbiAmJiB0aGlzLmxhc3RUb2tlbi5wb3NpdGlvbi5saW5lIDwgdGhpcy5jY3QucG9zaXRpb24ubGluZSAmJlxyXG4gICAgICAgICAgICAgICAgIXRoaXMuaXNPcGVyYXRvck9yRG90KHRoaXMubGFzdFRva2VuLnR0KSBcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICBxdWlja0ZpeCA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ1N0cmljaHB1bmt0IGhpZXIgZWluZsO8Z2VuJyxcclxuICAgICAgICAgICAgICAgICAgICBlZGl0c1Byb3ZpZGVyOiAodXJpKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2U6IHVyaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydExpbmVOdW1iZXI6IHBvc2l0aW9uLmxpbmUsIHN0YXJ0Q29sdW1uOiBwb3NpdGlvbi5jb2x1bW4sIGVuZExpbmVOdW1iZXI6IHBvc2l0aW9uLmxpbmUsIGVuZENvbHVtbjogcG9zaXRpb24uY29sdW1uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXZlcml0eTogbW9uYWNvLk1hcmtlclNldmVyaXR5LkVycm9yXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIjtcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpbnZva2VTZW1pY29sb25BbmdlbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW9kdWxlLm1haW4uZ2V0U2VtaWNvbG9uQW5nZWwoKS5yZWdpc3Rlcihwb3NpdGlvbiwgdGhpcy5tb2R1bGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJFcndhcnRldCB3aXJkOiBcIiArIFRva2VuVHlwZVJlYWRhYmxlW3R0XSArIFwiIC0gR2VmdW5kZW4gd3VyZGU6IFwiICsgVG9rZW5UeXBlUmVhZGFibGVbdGhpcy50dF0sIFwiZXJyb3JcIiwgcG9zaXRpb24sIHF1aWNrRml4KTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNraXApIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgaXNPcGVyYXRvck9yRG90KHR0OiBUb2tlblR5cGUpOiBib29sZWFuIHtcclxuICAgICAgICBpZiAodHQgPT0gVG9rZW5UeXBlLmRvdCkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgZm9yIChsZXQgb3Agb2YgUGFyc2VyLm9wZXJhdG9yUHJlY2VkZW5jZSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBvcGVyYXRvciBvZiBvcCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR0ID09IG9wZXJhdG9yKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpc0VuZCgpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jY3QgPT0gdGhpcy5lbmRUb2tlbjtcclxuICAgIH1cclxuXHJcbiAgICBjb21lc1Rva2VuKHRva2VuOiBUb2tlblR5cGUgfCBUb2tlblR5cGVbXSk6IGJvb2xlYW4ge1xyXG5cclxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodG9rZW4pKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnR0ID09IHRva2VuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRva2VuLmluZGV4T2YodGhpcy50dCkgPj0gMDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q3VycmVudFBvc2l0aW9uKCk6IFRleHRQb3NpdGlvbiB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXMucG9zaXRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEVuZE9mQ3VycmVudFRva2VuKCk6IFRleHRQb3NpdGlvbiB7XHJcblxyXG4gICAgICAgIGxldCBwb3NpdGlvbiA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcbiAgICAgICAgcG9zaXRpb24uY29sdW1uID0gcG9zaXRpb24uY29sdW1uICsgdGhpcy5wb3NpdGlvbi5sZW5ndGg7XHJcbiAgICAgICAgcG9zaXRpb24ubGVuZ3RoID0gMDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHBvc2l0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBDbGFzc1Rva2VuczogVG9rZW5UeXBlW10gPSBbVG9rZW5UeXBlLmtleXdvcmRDbGFzcywgVG9rZW5UeXBlLmtleXdvcmRFbnVtLCBUb2tlblR5cGUua2V5d29yZEludGVyZmFjZV07XHJcbiAgICBzdGF0aWMgVmlzaWJpbGl0eVRva2VuczogVG9rZW5UeXBlW10gPSBbVG9rZW5UeXBlLmtleXdvcmRQcml2YXRlLCBUb2tlblR5cGUua2V5d29yZFByb3RlY3RlZCwgVG9rZW5UeXBlLmtleXdvcmRQdWJsaWNdO1xyXG4gICAgc3RhdGljIEJlZm9yZUNsYXNzRGVmaW5pdGlvblRva2VuczogVG9rZW5UeXBlW10gPSBQYXJzZXIuQ2xhc3NUb2tlbnMuY29uY2F0KFBhcnNlci5WaXNpYmlsaXR5VG9rZW5zKS5jb25jYXQoVG9rZW5UeXBlLmtleXdvcmRBYnN0cmFjdCkuY29uY2F0KFBhcnNlci5DbGFzc1Rva2Vucyk7XHJcblxyXG4gICAgcGFyc2VNYWluKCk6IHsgbWFpblByb2dyYW1BU1Q6IEFTVE5vZGVzLCBtYWluUHJvZ3JhbUVuZDogVGV4dFBvc2l0aW9uLCBjbGFzc0RlZmluaXRpb25BU1Q6IEFTVE5vZGVzIH0ge1xyXG5cclxuICAgICAgICBsZXQgbWFpblByb2dyYW06IEFTVE5vZGVzID0gW107XHJcbiAgICAgICAgbGV0IGNsYXNzRGVmaW5pdGlvbnM6IEFTVE5vZGVzID0gW107XHJcblxyXG4gICAgICAgIGxldCBtYWluUHJvZ3JhbUVuZDogVGV4dFBvc2l0aW9uID0ge1xyXG4gICAgICAgICAgICBjb2x1bW46IDAsXHJcbiAgICAgICAgICAgIGxpbmU6IDEwMDAwLFxyXG4gICAgICAgICAgICBsZW5ndGg6IDFcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdoaWxlICghdGhpcy5pc0VuZCgpKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgb2xkUG9zID0gdGhpcy5wb3M7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5jb21lc1Rva2VuKFBhcnNlci5CZWZvcmVDbGFzc0RlZmluaXRpb25Ub2tlbnMpKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2QgPSB0aGlzLnBhcnNlQ2xhc3NEZWZpbml0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2QgIT0gbnVsbCkgY2xhc3NEZWZpbml0aW9ucyA9IGNsYXNzRGVmaW5pdGlvbnMuY29uY2F0KGNkKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxldCBzdCA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc3QgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1haW5Qcm9ncmFtID0gbWFpblByb2dyYW0uY29uY2F0KHN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIG1haW5Qcm9ncmFtRW5kID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZW1lcmdlbmN5LWZvcndhcmQ6XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvcyA9PSBvbGRQb3MpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9zKys7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRpYWxpemVMb29rYWhlYWQoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG1haW5Qcm9ncmFtQVNUOiBtYWluUHJvZ3JhbSxcclxuICAgICAgICAgICAgY2xhc3NEZWZpbml0aW9uQVNUOiBjbGFzc0RlZmluaXRpb25zLFxyXG4gICAgICAgICAgICBtYWluUHJvZ3JhbUVuZDogbWFpblByb2dyYW1FbmRcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBjaGVja0lmU3RhdGVtZW50SGFzTm9FZmZla3Qoc3Q6IEFTVE5vZGUpIHtcclxuICAgICAgICBcclxuICAgICAgICBpZih0aGlzLmlzSW5Db25zb2xlTW9kZSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZiAoKHN0LnR5cGUgPT0gVG9rZW5UeXBlLmJpbmFyeU9wICYmIFBhcnNlci5hc3NpZ25tZW50T3BlcmF0b3JzLmluZGV4T2Yoc3Qub3BlcmF0b3IpIDwgMCkpIHtcclxuICAgICAgICAgICAgbGV0IHMgPSBcImRpZXNlcyBUZXJtc1wiO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHN0Lm9wZXJhdG9yKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5wbHVzOiBzID0gXCJkaWVzZXIgU3VtbWVcIjsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5taW51czogcyA9IFwiZGllc2VyIERpZmZlcmVuelwiOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLm11bHRpcGxpY2F0aW9uOiBzID0gXCJkaWVzZXMgUHJvZHVrdHNcIjsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5kaXZpc2lvbjogcyA9IFwiZGllc2VzIFF1b3RpZW50ZW5cIjsgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcyArPSBcIiAoT3BlcmF0b3IgXCIgKyBUb2tlblR5cGVSZWFkYWJsZVtzdC5vcGVyYXRvcl0gKyBcIilcIlxyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihgRGVyIFdlcnQgJHtzfSB3aXJkIHp3YXIgYmVyZWNobmV0LCBhYmVyIGRhbmFjaCB2ZXJ3b3JmZW4uIE3DtmNodGVzdCBEdSBpaG4gdmllbGxlaWNodCBlaW5lciBWYXJpYWJsZW4genV3ZWlzZW4/YCxcclxuICAgICAgICAgICAgICAgIFwiaW5mb1wiLCBzdC5wb3NpdGlvbik7XHJcbiAgICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICAgICAgW1Rva2VuVHlwZS51bmFyeU9wLCBUb2tlblR5cGUucHVzaENvbnN0YW50LFxyXG4gICAgICAgICAgICBUb2tlblR5cGUuaWRlbnRpZmllciwgVG9rZW5UeXBlLnNlbGVjdEFycmF5RWxlbWVudF0uaW5kZXhPZihzdC50eXBlKSA+PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVyIFdlcnQgZGllc2VzIFRlcm1zIHdpcmQgendhciBiZXJlY2huZXQsIGFiZXIgZGFuYWNoIHZlcndvcmZlbi4gTcO2Y2h0ZXN0IER1IGlobiB2aWVsbGVpY2h0IGVpbmVyIFZhcmlhYmxlbiB6dXdlaXNlbj9cIixcclxuICAgICAgICAgICAgICAgIFwiaW5mb1wiLCBzdC5wb3NpdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlU3RhdGVtZW50KGV4cGVjdFNlbWljb2xvbjogYm9vbGVhbiA9IHRydWUpOiBBU1ROb2RlW10ge1xyXG5cclxuICAgICAgICBsZXQgcmV0U3RhdGVtZW50czogQVNUTm9kZVtdID0gbnVsbDtcclxuXHJcbiAgICAgICAgc3dpdGNoICh0aGlzLnR0KSB7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmxlZnRCcmFja2V0OlxyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5pZGVudGlmaWVyOlxyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkVGhpczpcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZFN1cGVyOlxyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkRmluYWw6XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmNoYXJDb25zdGFudDpcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuaW50ZWdlckNvbnN0YW50OlxyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5zdHJpbmdDb25zdGFudDpcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuYm9vbGVhbkNvbnN0YW50OlxyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5mbG9hdGluZ1BvaW50Q29uc3RhbnQ6XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmROZXc6XHJcbiAgICAgICAgICAgICAgICBsZXQgcmV0ID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25PclRlcm0oKTtcclxuICAgICAgICAgICAgICAgIGlmIChleHBlY3RTZW1pY29sb24pIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5zZW1pY29sb24sIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0U3RhdGVtZW50cyA9IHJldDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5sZWZ0Q3VybHlCcmFja2V0OlxyXG4gICAgICAgICAgICAgICAgbGV0IHN0YXRlbWVudHM6IEFTVE5vZGVbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgbGV0IHBvc2l0aW9uRnJvbSA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG4gICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy50dCAhPSBUb2tlblR5cGUucmlnaHRDdXJseUJyYWNrZXQgJiYgdGhpcy50dCAhPSBUb2tlblR5cGUuZW5kb2ZTb3VyY2Vjb2RlXHJcbiAgICAgICAgICAgICAgICAgICAgJiYgUGFyc2VyLkJlZm9yZUNsYXNzRGVmaW5pdGlvblRva2Vucy5pbmRleE9mKHRoaXMudHQpIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHMgPSBzdGF0ZW1lbnRzLmNvbmNhdCh0aGlzLnBhcnNlU3RhdGVtZW50KCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGV0IHBvc2l0aW9uVG8gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgcG9zaXRpb25Uby5jb2x1bW4gPSBwb3NpdGlvblRvLmNvbHVtbiArIHBvc2l0aW9uVG8ubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgcG9zaXRpb25Uby5sZW5ndGggPSAwO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLnJpZ2h0Q3VybHlCcmFja2V0KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXRTdGF0ZW1lbnRzID0gW3tcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuc2NvcGVOb2RlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbkZyb20sXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25UbzogcG9zaXRpb25UbyxcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzOiBzdGF0ZW1lbnRzXHJcbiAgICAgICAgICAgICAgICB9XTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZFdoaWxlOlxyXG4gICAgICAgICAgICAgICAgcmV0U3RhdGVtZW50cyA9IHRoaXMucGFyc2VXaGlsZSgpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmRGb3I6XHJcbiAgICAgICAgICAgICAgICByZXRTdGF0ZW1lbnRzID0gdGhpcy5wYXJzZUZvcigpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmREbzpcclxuICAgICAgICAgICAgICAgIHJldFN0YXRlbWVudHMgPSB0aGlzLnBhcnNlRG8oKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkSWY6XHJcbiAgICAgICAgICAgICAgICByZXRTdGF0ZW1lbnRzID0gdGhpcy5wYXJzZUlmKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZFJldHVybjpcclxuICAgICAgICAgICAgICAgIHJldFN0YXRlbWVudHMgPSB0aGlzLnBhcnNlUmV0dXJuKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZFByaW50OlxyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkUHJpbnRsbjpcclxuICAgICAgICAgICAgICAgIHJldFN0YXRlbWVudHMgPSB0aGlzLnBhcnNlUHJpbnQoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkU3dpdGNoOlxyXG4gICAgICAgICAgICAgICAgcmV0U3RhdGVtZW50cyA9IHRoaXMucGFyc2VTd2l0Y2goKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkQnJlYWs6XHJcbiAgICAgICAgICAgICAgICBsZXQgcG9zaXRpb24gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICAgICAgICAgIHJldFN0YXRlbWVudHMgPSBbe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5rZXl3b3JkQnJlYWssXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICB9XTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkQ29udGludWU6XHJcbiAgICAgICAgICAgICAgICBsZXQgcG9zaXRpb24xID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcbiAgICAgICAgICAgICAgICByZXRTdGF0ZW1lbnRzID0gW3tcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUua2V5d29yZENvbnRpbnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbjFcclxuICAgICAgICAgICAgICAgIH1dO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnNlbWljb2xvbjpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgbGV0IHMgPSBUb2tlblR5cGVSZWFkYWJsZVt0aGlzLnR0XTtcclxuICAgICAgICAgICAgICAgIGlmIChzICE9IHRoaXMuY2N0LnZhbHVlKSBzICs9IFwiKFwiICsgdGhpcy5jY3QudmFsdWUgKyBcIilcIjtcclxuICAgICAgICAgICAgICAgIHMgKz0gXCIgd2lyZCBoaWVyIG5pY2h0IGVyd2FydGV0LlwiO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3Iocyk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGRvbnRTa2lwID0gUGFyc2VyLkJlZm9yZUNsYXNzRGVmaW5pdGlvblRva2Vucy5pbmRleE9mKHRoaXMudHQpID49IDA7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWRvbnRTa2lwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYocmV0U3RhdGVtZW50cyA9PSBudWxsKXtcclxuICAgICAgICAgICAgLy8gc2tpcCBhZGRpdGlvbmFsIHNlbWljb2xvbnMgaWYgcHJlc2VudC4uLlxyXG4gICAgICAgICAgICB3aGlsZSAodGhpcy50dCA9PSBUb2tlblR5cGUuc2VtaWNvbG9uICYmIGV4cGVjdFNlbWljb2xvbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYocmV0U3RhdGVtZW50cyAhPSBudWxsICYmIHJldFN0YXRlbWVudHMubGVuZ3RoID4gMCl7XHJcbiAgICAgICAgICAgIGxldCByZXRTdG10ID0gcmV0U3RhdGVtZW50c1tyZXRTdGF0ZW1lbnRzLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICBpZihyZXRTdG10ICE9IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGVja0lmU3RhdGVtZW50SGFzTm9FZmZla3QocmV0U3RhdGVtZW50c1tyZXRTdGF0ZW1lbnRzLmxlbmd0aCAtIDFdKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldFN0YXRlbWVudHMgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmV0U3RhdGVtZW50cztcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2VSZXR1cm4oKTogQVNUTm9kZVtdIHtcclxuXHJcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuXHJcbiAgICAgICAgbGV0IHRlcm06IFRlcm1Ob2RlO1xyXG5cclxuICAgICAgICBpZiAoISh0aGlzLnR0ID09IFRva2VuVHlwZS5zZW1pY29sb24pKSB7XHJcbiAgICAgICAgICAgIHRlcm0gPSB0aGlzLnBhcnNlVGVybSgpO1xyXG4gICAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuc2VtaWNvbG9uLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBbe1xyXG4gICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUua2V5d29yZFJldHVybixcclxuICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICB0ZXJtOiB0ZXJtXHJcbiAgICAgICAgfV07XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlV2hpbGUoKTogQVNUTm9kZVtdIHtcclxuXHJcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTsgLy8gY29uc3VtZSB3aGlsZVxyXG4gICAgICAgIGxldCBzY29wZUZyb20gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5leHBlY3QoVG9rZW5UeXBlLmxlZnRCcmFja2V0LCB0cnVlKSkge1xyXG4gICAgICAgICAgICBsZXQgY29uZGl0aW9uID0gdGhpcy5wYXJzZVRlcm0oKTtcclxuICAgICAgICAgICAgbGV0IHJpZ2h0QnJhY2tldFBvc2l0aW9uICA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1vZHVsZS5wdXNoTWV0aG9kQ2FsbFBvc2l0aW9uKHBvc2l0aW9uLCBbXSwgXCJ3aGlsZVwiLCByaWdodEJyYWNrZXRQb3NpdGlvbik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUucmlnaHRCcmFja2V0LCB0cnVlKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMudHQgPT0gVG9rZW5UeXBlLnNlbWljb2xvbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWVzZSB3aGlsZS1sb29wIHdpZWRlcmhvbHQgbnVyIGRlbiBTdHJpY2hwdW5rdCAobGVlcmUgQW53ZWlzdW5nKS5cIiwgXCJ3YXJuaW5nXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBzdGF0ZW1lbnRzID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xyXG4gICAgICAgICAgICBsZXQgc2NvcGVUbyA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgIHNjb3BlVG8ubGVuZ3RoID0gMDtcclxuXHJcbiAgICAgICAgICAgIGlmIChzdGF0ZW1lbnRzICE9IG51bGwgJiYgc3RhdGVtZW50cy5sZW5ndGggPiAwICYmIHN0YXRlbWVudHNbMF0udHlwZSA9PSBUb2tlblR5cGUuc2NvcGVOb2RlKSB7XHJcbiAgICAgICAgICAgICAgICBzY29wZVRvID0gKDxTY29wZU5vZGU+c3RhdGVtZW50c1swXSkucG9zaXRpb25UbztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUua2V5d29yZFdoaWxlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBzY29wZUZyb206IHNjb3BlRnJvbSxcclxuICAgICAgICAgICAgICAgICAgICBzY29wZVRvOiBzY29wZVRvLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbjogY29uZGl0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHM6IHN0YXRlbWVudHNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gW107XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlRm9yKCk6IEFTVE5vZGVbXSB7XHJcblxyXG4gICAgICAgIGxldCBwb3NpdGlvbiA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgIGxldCBzZW1pY29sb25Qb3NpdGlvbnM6IFRleHRQb3NpdGlvbltdID0gW107XHJcblxyXG4gICAgICAgIHRoaXMubmV4dFRva2VuKCk7IC8vIGNvbnN1bWUgZm9yXHJcblxyXG4gICAgICAgIGxldCBzY29wZUZyb20gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5leHBlY3QoVG9rZW5UeXBlLmxlZnRCcmFja2V0LCB0cnVlKSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY3RbMl0udHQgPT0gVG9rZW5UeXBlLmNvbG9uKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUZvckxvb3BPdmVyQ29sbGVjdGlvbihwb3NpdGlvbiwgc2NvcGVGcm9tKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHN0YXRlbWVudHNCZWZvcmUgPSB0aGlzLnBhcnNlU3RhdGVtZW50KGZhbHNlKTtcclxuICAgICAgICAgICAgc2VtaWNvbG9uUG9zaXRpb25zLnB1c2godGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKSk7XHJcbiAgICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5zZW1pY29sb24pO1xyXG4gICAgICAgICAgICBsZXQgY29uZGl0aW9uID0gdGhpcy5wYXJzZVRlcm0oKTtcclxuICAgICAgICAgICAgc2VtaWNvbG9uUG9zaXRpb25zLnB1c2godGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKSk7XHJcbiAgICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5zZW1pY29sb24sIHRydWUpO1xyXG4gICAgICAgICAgICBsZXQgc3RhdGVtZW50c0FmdGVyID0gdGhpcy5wYXJzZVN0YXRlbWVudChmYWxzZSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgcmlnaHRCcmFja2V0UG9zaXRpb24gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUucmlnaHRCcmFja2V0LCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubW9kdWxlLnB1c2hNZXRob2RDYWxsUG9zaXRpb24ocG9zaXRpb24sIHNlbWljb2xvblBvc2l0aW9ucywgXCJmb3JcIiwgcmlnaHRCcmFja2V0UG9zaXRpb24pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMudHQgPT0gVG9rZW5UeXBlLnNlbWljb2xvbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEaWVzZSBmb3ItbG9vcCB3aWVkZXJob2x0IG51ciBkZW4gU3RyaWNocHVua3QgKGxlZXJlIEFud2Vpc3VuZykuXCIsIFwid2FybmluZ1wiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGxldCBzdGF0ZW1lbnRzID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xyXG4gICAgICAgICAgICBsZXQgc2NvcGVUbyA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgIHNjb3BlVG8ubGVuZ3RoID0gMDtcclxuXHJcbiAgICAgICAgICAgIGlmIChzdGF0ZW1lbnRzICE9IG51bGwgJiYgc3RhdGVtZW50cy5sZW5ndGggPiAwICYmIHN0YXRlbWVudHNbMF0udHlwZSA9PSBUb2tlblR5cGUuc2NvcGVOb2RlKSB7XHJcbiAgICAgICAgICAgICAgICBzY29wZVRvID0gKDxTY29wZU5vZGU+c3RhdGVtZW50c1swXSkucG9zaXRpb25UbztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGNvbmRpdGlvbiA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjb25kaXRpb24gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hDb25zdGFudCxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKSxcclxuICAgICAgICAgICAgICAgICAgICBjb25zdGFudFR5cGU6IFRva2VuVHlwZS5ib29sZWFuQ29uc3RhbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3RhbnQ6IHRydWVcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUua2V5d29yZEZvcixcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgc2NvcGVGcm9tOiBzY29wZUZyb20sXHJcbiAgICAgICAgICAgICAgICAgICAgc2NvcGVUbzogc2NvcGVUbyxcclxuICAgICAgICAgICAgICAgICAgICBjb25kaXRpb246IGNvbmRpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzQmVmb3JlOiBzdGF0ZW1lbnRzQmVmb3JlLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHNBZnRlcjogc3RhdGVtZW50c0FmdGVyLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHM6IHN0YXRlbWVudHNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gW107XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlRm9yTG9vcE92ZXJDb2xsZWN0aW9uKHBvc2l0aW9uOiBUZXh0UG9zaXRpb24sIHNjb3BlRnJvbTogVGV4dFBvc2l0aW9uKTogQVNUTm9kZVtdIHtcclxuXHJcbiAgICAgICAgbGV0IHZhcmlhYmxlVHlwZSA9IHRoaXMucGFyc2VUeXBlKCk7XHJcblxyXG4gICAgICAgIGxldCB2YXJpYWJsZUlkZW50aWZpZXIgPSA8c3RyaW5nPnRoaXMuY2N0LnZhbHVlO1xyXG4gICAgICAgIGxldCB2YXJpYWJsZUlkZW50aWZpZXJQb3NpdGlvbiA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuXHJcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLmNvbG9uLCB0cnVlKTtcclxuXHJcbiAgICAgICAgbGV0IGNvbGxlY3Rpb24gPSB0aGlzLnBhcnNlVGVybSgpO1xyXG5cclxuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUucmlnaHRCcmFja2V0LCB0cnVlKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMudHQgPT0gVG9rZW5UeXBlLnNlbWljb2xvbikge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRpZXNlIGZvci1sb29wIHdpZWRlcmhvbHQgbnVyIGRlbiBTdHJpY2hwdW5rdCAobGVlcmUgQW53ZWlzdW5nKS5cIiwgXCJ3YXJuaW5nXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHN0YXRlbWVudHMgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XHJcbiAgICAgICAgbGV0IHNjb3BlVG8gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG4gICAgICAgIHNjb3BlVG8ubGVuZ3RoID0gMDtcclxuXHJcbiAgICAgICAgaWYgKHN0YXRlbWVudHMgIT0gbnVsbCAmJiBzdGF0ZW1lbnRzLmxlbmd0aCA+IDAgJiYgc3RhdGVtZW50c1swXS50eXBlID09IFRva2VuVHlwZS5zY29wZU5vZGUpIHtcclxuICAgICAgICAgICAgc2NvcGVUbyA9ICg8U2NvcGVOb2RlPnN0YXRlbWVudHNbMF0pLnBvc2l0aW9uVG87XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY29sbGVjdGlvbiA9PSBudWxsIHx8IHZhcmlhYmxlVHlwZSA9PSBudWxsIHx8IHN0YXRlbWVudHMgPT0gbnVsbCkgcmV0dXJuIFtdO1xyXG5cclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuZm9yTG9vcE92ZXJDb2xsZWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgc2NvcGVGcm9tOiBzY29wZUZyb20sXHJcbiAgICAgICAgICAgICAgICBzY29wZVRvOiBzY29wZVRvLFxyXG4gICAgICAgICAgICAgICAgdmFyaWFibGVJZGVudGlmaWVyOiB2YXJpYWJsZUlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICB2YXJpYWJsZVR5cGU6IHZhcmlhYmxlVHlwZSxcclxuICAgICAgICAgICAgICAgIHZhcmlhYmxlUG9zaXRpb246IHZhcmlhYmxlSWRlbnRpZmllclBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbjogY29sbGVjdGlvbixcclxuICAgICAgICAgICAgICAgIHN0YXRlbWVudHM6IHN0YXRlbWVudHNcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF07XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlUHJpbnQoKTogQVNUTm9kZVtdIHtcclxuXHJcbiAgICAgICAgbGV0IHR0ID0gdGhpcy50dDtcclxuICAgICAgICBsZXQgcG9zaXRpb24gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG5cclxuICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5leHBlY3QoVG9rZW5UeXBlLmxlZnRCcmFja2V0LCBmYWxzZSkpIHtcclxuICAgICAgICAgICAgbGV0IG1jcCA9IHRoaXMucGFyc2VNZXRob2RDYWxsUGFyYW1ldGVycygpO1xyXG4gICAgICAgICAgICBsZXQgcGFyYW1lbnRlcnMgPSBtY3Aubm9kZXM7XHJcbiAgICAgICAgICAgIGlmIChwYXJhbWVudGVycy5sZW5ndGggPiAyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRpZSBNZXRob2RlbiBwcmludCB1bmQgcHJpbnRsbiBoYWJlbiBtYXhpbWFsIHp3ZWkgUGFyYW1ldGVyLlwiLCBcImVycm9yXCIsIHBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLnNlbWljb2xvbiwgdHJ1ZSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gW3tcclxuICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgdHlwZTogdHQsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICB0ZXh0OiBwYXJhbWVudGVycy5sZW5ndGggPT0gMCA/IG51bGwgOiBwYXJhbWVudGVyc1swXSxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiBwYXJhbWVudGVycy5sZW5ndGggPD0gMSA/IG51bGwgOiBwYXJhbWVudGVyc1sxXSxcclxuICAgICAgICAgICAgICAgIGNvbW1hUG9zaXRpb25zOiBtY3AuY29tbWFQb3NpdGlvbnMsXHJcbiAgICAgICAgICAgICAgICByaWdodEJyYWNrZXRQb3NpdGlvbjogbWNwLnJpZ2h0QnJhY2tldFBvc2l0aW9uXHJcbiAgICAgICAgICAgIH1dO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlU3dpdGNoKCk6IEFTVE5vZGVbXSB7XHJcblxyXG4gICAgICAgIGxldCBwb3NpdGlvbiA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICBpZiAodGhpcy5leHBlY3QoVG9rZW5UeXBlLmxlZnRCcmFja2V0LCB0cnVlKSkge1xyXG5cclxuICAgICAgICAgICAgbGV0IHN3aXRjaFRlcm0gPSB0aGlzLnBhcnNlVGVybSgpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tb2R1bGUucHVzaE1ldGhvZENhbGxQb3NpdGlvbihwb3NpdGlvbiwgW10sIFwic3dpdGNoXCIsIHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCkpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLnJpZ2h0QnJhY2tldCk7XHJcbiAgICAgICAgICAgIGxldCBzY29wZUZyb20gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLmxlZnRDdXJseUJyYWNrZXQsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHN3aXRjaE5vZGU6IFN3aXRjaE5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUua2V5d29yZFN3aXRjaCxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIHNjb3BlRnJvbTogc2NvcGVGcm9tLFxyXG4gICAgICAgICAgICAgICAgc2NvcGVUbzogbnVsbCxcclxuICAgICAgICAgICAgICAgIGNvbmRpdGlvbjogc3dpdGNoVGVybSxcclxuICAgICAgICAgICAgICAgIGNhc2VOb2RlczogW11cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGRlZmF1bHRBbHJlYWR5VGhlcmUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlICh0aGlzLnR0ID09IFRva2VuVHlwZS5rZXl3b3JkQ2FzZSB8fCB0aGlzLnR0ID09IFRva2VuVHlwZS5rZXl3b3JkRGVmYXVsdCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNhc2VQb3NpdGlvbiA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGlzRGVmYXVsdCA9IHRoaXMudHQgPT0gVG9rZW5UeXBlLmtleXdvcmREZWZhdWx0O1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzRGVmYXVsdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWZhdWx0QWxyZWFkeVRoZXJlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRWluZSBzd2l0Y2gtQW53ZWlzdW5nIGRhcmYgbnVyIG1heGltYWwgZWluZW4gZGVmYXVsdC1ad2VpZyBoYWJlbi5cIiwgXCJlcnJvclwiLCBjYXNlUG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRBbHJlYWR5VGhlcmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBjYXNlVGVybSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlzRGVmYXVsdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2VUZXJtID0gdGhpcy5wYXJzZVRlcm0oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuY29sb24sIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBzdGF0ZW1lbnRzOiBBU1ROb2RlW10gPSBbXTtcclxuICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMudHQgIT0gVG9rZW5UeXBlLnJpZ2h0Q3VybHlCcmFja2V0ICYmIHRoaXMudHQgIT0gVG9rZW5UeXBlLmVuZG9mU291cmNlY29kZVxyXG4gICAgICAgICAgICAgICAgICAgICYmIHRoaXMudHQgIT0gVG9rZW5UeXBlLmtleXdvcmRDYXNlICYmIHRoaXMudHQgIT0gVG9rZW5UeXBlLmtleXdvcmREZWZhdWx0XHJcbiAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc3RhdGVtZW50ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0ZW1lbnQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzID0gc3RhdGVtZW50cy5jb25jYXQoc3RhdGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHN3aXRjaENhc2VOb2RlOiBTd2l0Y2hDYXNlTm9kZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUua2V5d29yZENhc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGNhc2VQb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBjYXNlVGVybTogY2FzZVRlcm0sXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVtZW50czogc3RhdGVtZW50c1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHN3aXRjaE5vZGUuY2FzZU5vZGVzLnB1c2goc3dpdGNoQ2FzZU5vZGUpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc3dpdGNoTm9kZS5zY29wZVRvID0gdGhpcy5nZXRFbmRPZkN1cnJlbnRUb2tlbigpO1xyXG4gICAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUucmlnaHRDdXJseUJyYWNrZXQsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIFtzd2l0Y2hOb2RlXTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2VJZigpOiBBU1ROb2RlW10ge1xyXG5cclxuICAgICAgICBsZXQgcG9zaXRpb24gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG5cclxuICAgICAgICB0aGlzLm5leHRUb2tlbigpOyAvLyBjb25zdW1lIGlmXHJcbiAgICAgICAgaWYgKHRoaXMuZXhwZWN0KFRva2VuVHlwZS5sZWZ0QnJhY2tldCwgdHJ1ZSkpIHtcclxuICAgICAgICAgICAgbGV0IGNvbmRpdGlvbiA9IHRoaXMucGFyc2VUZXJtKCk7XHJcbiAgICAgICAgICAgIGxldCByaWdodEJyYWNrZXRQb3NpdGlvbiA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgIHRoaXMubW9kdWxlLnB1c2hNZXRob2RDYWxsUG9zaXRpb24ocG9zaXRpb24sIFtdLCBcImlmXCIsIHJpZ2h0QnJhY2tldFBvc2l0aW9uKTtcclxuICAgICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLnJpZ2h0QnJhY2tldCwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy50dCA9PSBUb2tlblR5cGUuc2VtaWNvbG9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkZhbGxzIGRpZSBCZWRpbmd1bmcgenV0cmlmZnQsIHdpcmQgbnVyIGRlciBTdHJpY2hwdW5rdCBhdXNnZWbDvGhydCAobGVlcmUgQW53ZWlzdW5nKS5cIiwgXCJ3YXJuaW5nXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgc3RhdGVtZW50cyA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnR0ID09IFRva2VuVHlwZS5zZW1pY29sb24pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBlbHNlU3RhdGVtZW50czogQVNUTm9kZVtdID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbWVzVG9rZW4oVG9rZW5UeXBlLmtleXdvcmRFbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICAgICAgICAgIGVsc2VTdGF0ZW1lbnRzID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoY29uZGl0aW9uID09IG51bGwgJiYgdGhpcy5lcnJvckxpc3QubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbmRpdGlvbiA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaENvbnN0YW50LFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0YW50VHlwZTogVG9rZW5UeXBlLmJvb2xlYW5Db25zdGFudCxcclxuICAgICAgICAgICAgICAgICAgICBjb25zdGFudDogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5rZXl3b3JkSWYsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbjogY29uZGl0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHNJZlRydWU6IHN0YXRlbWVudHMsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVtZW50c0lmRmFsc2U6IGVsc2VTdGF0ZW1lbnRzXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF07XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwYXJzZURvKCk6IEFTVE5vZGVbXSB7XHJcblxyXG4gICAgICAgIC8vIGxldCBpID0gMTA7XHJcbiAgICAgICAgLy8gZG8ge1xyXG4gICAgICAgIC8vICAgICBpID0gaSArNztcclxuICAgICAgICAvLyB9IHdoaWxlIChpIDwgMTAwKTtcclxuXHJcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgbGV0IHNjb3BlRnJvbSA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTsgLy8gY29uc3VtZSBkb1xyXG4gICAgICAgIGxldCBzdGF0ZW1lbnRzID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5leHBlY3QoVG9rZW5UeXBlLmtleXdvcmRXaGlsZSwgdHJ1ZSkpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZXhwZWN0KFRva2VuVHlwZS5sZWZ0QnJhY2tldCwgdHJ1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjb25kaXRpb24gPSB0aGlzLnBhcnNlVGVybSgpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNjb3BlVG8gPSB0aGlzLmdldEVuZE9mQ3VycmVudFRva2VuKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLnJpZ2h0QnJhY2tldCwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5rZXl3b3JkRG8sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVGcm9tOiBzY29wZUZyb20sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlVG86IHNjb3BlVG8sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmRpdGlvbjogY29uZGl0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzOiBzdGF0ZW1lbnRzXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjb21lc0dlbmVyaWNUeXBlKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGlmICh0aGlzLmN0WzFdLnR0ICE9IFRva2VuVHlwZS5sb3dlcikgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGlmICh0aGlzLmN0WzJdLnR0ICE9IFRva2VuVHlwZS5pZGVudGlmaWVyKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3RbM10udHQgPT0gVG9rZW5UeXBlLmdyZWF0ZXIgfHwgdGhpcy5jdFszXS50dCA9PSBUb2tlblR5cGUuY29tbWE7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbk9yVGVybSgpOiBBU1ROb2RlW10ge1xyXG5cclxuICAgICAgICAvLyBUd28gaWRlbnRpZmllcnMgaW4gYSByb3cgb3IgaWRlbnRpZmllcltdXHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAodGhpcy50dCA9PSBUb2tlblR5cGUuaWRlbnRpZmllciB8fCB0aGlzLnR0ID09IFRva2VuVHlwZS5rZXl3b3JkRmluYWwpICYmXHJcbiAgICAgICAgICAgICh0aGlzLmN0WzFdLnR0ID09IFRva2VuVHlwZS5pZGVudGlmaWVyXHJcbiAgICAgICAgICAgICAgICB8fCB0aGlzLmN0WzFdLnR0ID09IFRva2VuVHlwZS5sZWZ0UmlnaHRTcXVhcmVCcmFja2V0IHx8XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbWVzR2VuZXJpY1R5cGUoKSBcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICBsZXQgcmV0OiBBU1ROb2RlW10gPSBbXTtcclxuICAgICAgICAgICAgbGV0IHR5cGU6IFR5cGVOb2RlID0gbnVsbDtcclxuICAgICAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgIT0gbnVsbCkgdGhpcy5leHBlY3QoVG9rZW5UeXBlLmNvbW1hLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGxldCB2ZCA9IHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKHR5cGUpO1xyXG4gICAgICAgICAgICAgICAgcmV0LnB1c2godmQpO1xyXG4gICAgICAgICAgICAgICAgdHlwZSA9IHZkPy52YXJpYWJsZVR5cGU7XHJcbiAgICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgfSB3aGlsZSAodGhpcy50dCA9PSBUb2tlblR5cGUuY29tbWEpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gW3RoaXMucGFyc2VUZXJtKCldO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2VUZXJtKCk6IFRlcm1Ob2RlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVRlcm1CaW5hcnkoMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2VUZXJtQmluYXJ5KHByZWNlZGVuY2U6IG51bWJlcik6IFRlcm1Ob2RlIHtcclxuXHJcbiAgICAgICAgbGV0IGxlZnQ6IFRlcm1Ob2RlO1xyXG4gICAgICAgIGlmIChwcmVjZWRlbmNlIDwgUGFyc2VyLm9wZXJhdG9yUHJlY2VkZW5jZS5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgIGxlZnQgPSB0aGlzLnBhcnNlVGVybUJpbmFyeShwcmVjZWRlbmNlICsgMSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGVmdCA9IHRoaXMucGFyc2VQbHVzUGx1c01pbnVzTWludXMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBvcGVyYXRvcnMgPSBQYXJzZXIub3BlcmF0b3JQcmVjZWRlbmNlW3ByZWNlZGVuY2VdO1xyXG5cclxuICAgICAgICBpZiAobGVmdCA9PSBudWxsIHx8IG9wZXJhdG9ycy5pbmRleE9mKHRoaXMudHQpIDwgMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbGVmdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBmaXJzdCA9IHRydWU7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnR0ID09IFRva2VuVHlwZS5jb2xvbikge1xyXG4gICAgICAgICAgICByZXR1cm4gbGVmdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdoaWxlIChmaXJzdCB8fCBvcGVyYXRvcnMuaW5kZXhPZih0aGlzLnR0KSA+PSAwKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgb3BlcmF0b3I6IFRva2VuVHlwZSA9IHRoaXMudHQ7XHJcblxyXG4gICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBsZXQgcG9zaXRpb24gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IG9wRGF0YSBvZiBbeyBvcDogVG9rZW5UeXBlLmxvd2VyLCB3cm9uZzogXCI9PFwiLCByaWdodDogXCI8PVwiLCBjb3JyZWN0T3A6IFRva2VuVHlwZS5sb3dlck9yRXF1YWwgfSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBvcDogVG9rZW5UeXBlLmdyZWF0ZXIsIHdyb25nOiBcIj0+XCIsIHJpZ2h0OiBcIj49XCIsIGNvcnJlY3RPcDogVG9rZW5UeXBlLmdyZWF0ZXJPckVxdWFsIH1dKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob3BlcmF0b3IgPT0gVG9rZW5UeXBlLmFzc2lnbm1lbnQgJiYgdGhpcy50dCA9PSBvcERhdGEub3ApIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcG9zaXRpb24yID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihgRGVuIE9wZXJhdG9yICR7b3BEYXRhLndyb25nfSBnaWJ0IGVzIG5pY2h0LiBEdSBtZWludGVzdCBzaWNoZXI6ICR7b3BEYXRhLnJpZ2h0fWAsIFwiZXJyb3JcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih7fSwgcG9zaXRpb24sIHsgbGVuZ3RoOiAyIH0pLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBgJHtvcERhdGEud3Jvbmd9IGR1cmNoICR7b3BEYXRhLnJpZ2h0fSBlcnNldHplbmAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRzUHJvdmlkZXI6ICh1cmkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZTogdXJpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZTogeyBzdGFydExpbmVOdW1iZXI6IHBvc2l0aW9uLmxpbmUsIHN0YXJ0Q29sdW1uOiBwb3NpdGlvbi5jb2x1bW4sIGVuZExpbmVOdW1iZXI6IHBvc2l0aW9uLmxpbmUsIGVuZENvbHVtbjogcG9zaXRpb24yLmNvbHVtbiArIHBvc2l0aW9uMi5sZW5ndGggfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IG9wRGF0YS5yaWdodFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICAgICAgICAgICAgICBvcGVyYXRvciA9IG9wRGF0YS5jb3JyZWN0T3A7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCByaWdodDogVGVybU5vZGU7XHJcbiAgICAgICAgICAgIGlmIChwcmVjZWRlbmNlIDwgUGFyc2VyLm9wZXJhdG9yUHJlY2VkZW5jZS5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VUZXJtQmluYXJ5KHByZWNlZGVuY2UgKyAxKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZVBsdXNQbHVzTWludXNNaW51cygpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmlnaHQgIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBjb25zdGFudEZvbGRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzQ29uc3RhbnQobGVmdCkgJiYgdGhpcy5pc0NvbnN0YW50KHJpZ2h0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwY0xlZnQgPSA8Q29uc3RhbnROb2RlPmxlZnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBjUmlnaHQgPSA8Q29uc3RhbnROb2RlPnJpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB0eXBlTGVmdCA9IFRva2VuVHlwZVRvRGF0YVR5cGVNYXBbcGNMZWZ0LmNvbnN0YW50VHlwZV07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGVSaWdodCA9IFRva2VuVHlwZVRvRGF0YVR5cGVNYXBbcGNSaWdodC5jb25zdGFudFR5cGVdO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHRUeXBlID0gdHlwZUxlZnQuZ2V0UmVzdWx0VHlwZShvcGVyYXRvciwgdHlwZVJpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0VHlwZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0YW50Rm9sZGluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSB0eXBlTGVmdC5jb21wdXRlKG9wZXJhdG9yLCB7IHR5cGU6IHR5cGVMZWZ0LCB2YWx1ZTogcGNMZWZ0LmNvbnN0YW50IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IHR5cGU6IHR5cGVSaWdodCwgdmFsdWU6IHBjUmlnaHQuY29uc3RhbnQgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnNpZGVySW50RGl2aXNpb25XYXJuaW5nKG9wZXJhdG9yLCB0eXBlTGVmdCwgcGNMZWZ0LmNvbnN0YW50LCB0eXBlUmlnaHQsIHBjUmlnaHQuY29uc3RhbnQsIHBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBjTGVmdC5jb25zdGFudFR5cGUgPSAoPFByaW1pdGl2ZVR5cGU+cmVzdWx0VHlwZSkudG9Ub2tlblR5cGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGNMZWZ0LmNvbnN0YW50ID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwY0xlZnQucG9zaXRpb24ubGVuZ3RoID0gcGNSaWdodC5wb3NpdGlvbi5jb2x1bW4gKyBwY1JpZ2h0LnBvc2l0aW9uLmxlbmd0aCAtIHBjTGVmdC5wb3NpdGlvbi5jb2x1bW47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICghY29uc3RhbnRGb2xkaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgIGxlZnQgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5iaW5hcnlPcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVyYXRvcjogb3BlcmF0b3IsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0T3BlcmFuZDogbGVmdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2Vjb25kT3BlcmFuZDogcmlnaHRcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbGVmdDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgY29uc2lkZXJJbnREaXZpc2lvbldhcm5pbmcob3BlcmF0b3I6IFRva2VuVHlwZSwgdHlwZUxlZnQ6IFR5cGUsIGxlZnRDb25zdGFudDogYW55LCB0eXBlUmlnaHQ6IFR5cGUsIHJpZ2h0Q29uc3RhbnQ6IGFueSwgcG9zaXRpb246IFRleHRQb3NpdGlvbikge1xyXG4gICAgXHJcbiAgICAgICAgaWYob3BlcmF0b3IgPT0gVG9rZW5UeXBlLmRpdmlzaW9uKXtcclxuICAgICAgICAgICAgaWYodGhpcy5pc0ludGVnZXJUeXBlKHR5cGVMZWZ0KSAmJiB0aGlzLmlzSW50ZWdlclR5cGUodHlwZVJpZ2h0KSl7XHJcbiAgICAgICAgICAgICAgICBpZihyaWdodENvbnN0YW50ICE9IDAgJiYgbGVmdENvbnN0YW50L3JpZ2h0Q29uc3RhbnQgIT0gTWF0aC5mbG9vcihsZWZ0Q29uc3RhbnQvcmlnaHRDb25zdGFudCkpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGEgXCIgKyBsZWZ0Q29uc3RhbnQgKyBcIiB1bmQgXCIgKyByaWdodENvbnN0YW50ICsgXCIgZ2FuenphaGxpZ2UgV2VydGUgc2luZCwgd2lyZCBkaWVzZSBEaXZpc2lvbiBhbHMgR2FuenphaGxkaXZpc2lvbiBhdXNnZWbDvGhydCB1bmQgZXJnaWJ0IGRlbiBXZXJ0IFwiICsgTWF0aC5mbG9vcihsZWZ0Q29uc3RhbnQvcmlnaHRDb25zdGFudCkgKyBcIi4gRmFsbHMgZGFzIG5pY2h0IGdld8O8bnNjaHQgaXN0LCBow6RuZ2UgJy4wJyBhbiBlaW5lbiBkZXIgT3BlcmFuZGVuLlwiLCBcImluZm9cIiwgcG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICB9XHJcblxyXG4gICAgaXNJbnRlZ2VyVHlwZSh0eXBlOiBUeXBlKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHR5cGUgPT0gaW50UHJpbWl0aXZlVHlwZTtcclxuICAgIH1cclxuXHJcbiAgICBpc0NvbnN0YW50KG5vZGU6IFRlcm1Ob2RlKSB7XHJcblxyXG4gICAgICAgIHJldHVybiAobm9kZSAhPSBudWxsICYmIG5vZGUudHlwZSA9PSBUb2tlblR5cGUucHVzaENvbnN0YW50KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2VQbHVzUGx1c01pbnVzTWludXMoKTogVGVybU5vZGUge1xyXG5cclxuICAgICAgICBsZXQgaW5jcmVtZW50RGVjcmVtZW50QmVmb3JlOiBUb2tlblR5cGUgPSBudWxsO1xyXG4gICAgICAgIGxldCBwb3NpdGlvbiA9IG51bGw7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmNvbWVzVG9rZW4oW1Rva2VuVHlwZS5kb3VibGVQbHVzLCBUb2tlblR5cGUuZG91YmxlTWludXNdKSkge1xyXG4gICAgICAgICAgICBpbmNyZW1lbnREZWNyZW1lbnRCZWZvcmUgPSB0aGlzLnR0O1xyXG4gICAgICAgICAgICBwb3NpdGlvbiA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdDogVGVybU5vZGUgPSB0aGlzLnBhcnNlVW5hcnkoKTtcclxuXHJcbiAgICAgICAgaWYgKGluY3JlbWVudERlY3JlbWVudEJlZm9yZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHQgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuaW5jcmVtZW50RGVjcmVtZW50QmVmb3JlLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6IGluY3JlbWVudERlY3JlbWVudEJlZm9yZSxcclxuICAgICAgICAgICAgICAgIG9wZXJhbmQ6IHRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY29tZXNUb2tlbihbVG9rZW5UeXBlLmRvdWJsZVBsdXMsIFRva2VuVHlwZS5kb3VibGVNaW51c10pKSB7XHJcbiAgICAgICAgICAgIHQgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuaW5jcmVtZW50RGVjcmVtZW50QWZ0ZXIsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKSxcclxuICAgICAgICAgICAgICAgIG9wZXJhdG9yOiB0aGlzLnR0LFxyXG4gICAgICAgICAgICAgICAgb3BlcmFuZDogdFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgLy8gLSwgbm90LCB0aGlzLCBzdXBlciwgYS5iLmNbXVtdLmQsIGEuYigpLCBiKCkgKD09IHRoaXMuYigpKSwgc3VwZXIuYigpLCBzdXBlcigpXHJcbiAgICBwYXJzZVVuYXJ5KCk6IFRlcm1Ob2RlIHtcclxuXHJcbiAgICAgICAgbGV0IHRlcm06IFRlcm1Ob2RlO1xyXG4gICAgICAgIGxldCBwb3NpdGlvbjogVGV4dFBvc2l0aW9uID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgc3dpdGNoICh0aGlzLnR0KSB7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmxlZnRCcmFja2V0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VEb3RPckFycmF5Q2hhaW5zKHRoaXMuYnJhY2tldE9yQ2FzdGluZygpKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubWludXM6XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLm5vdDpcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUudGlsZGU6XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uO1xyXG4gICAgICAgICAgICAgICAgbGV0IHR0MSA9IHRoaXMudHQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG4gICAgICAgICAgICAgICAgdGVybSA9IHRoaXMucGFyc2VVbmFyeSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzQ29uc3RhbnQodGVybSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcGNUZXJtID0gPENvbnN0YW50Tm9kZT50ZXJtO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB0eXBlVGVybSA9IFRva2VuVHlwZVRvRGF0YVR5cGVNYXBbcGNUZXJtLmNvbnN0YW50VHlwZV07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlc3VsdFR5cGUgPSB0eXBlVGVybS5nZXRSZXN1bHRUeXBlKHR0MSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdFR5cGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gdHlwZVRlcm0uY29tcHV0ZSh0dDEsIHsgdHlwZTogdHlwZVRlcm0sIHZhbHVlOiBwY1Rlcm0uY29uc3RhbnQgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBjVGVybS5jb25zdGFudFR5cGUgPSAoPFByaW1pdGl2ZVR5cGU+cmVzdWx0VHlwZSkudG9Ub2tlblR5cGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGNUZXJtLmNvbnN0YW50ID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi5sZW5ndGggPSBwY1Rlcm0ucG9zaXRpb24uY29sdW1uIC0gcG9zaXRpb24uY29sdW1uICsgMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBjVGVybTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUudW5hcnlPcCxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgb3BlcmFuZDogdGVybSxcclxuICAgICAgICAgICAgICAgICAgICBvcGVyYXRvcjogdHQxXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkU3VwZXI6XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jdFsxXS50dCA9PSBUb2tlblR5cGUubGVmdEJyYWNrZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpOyAvLyBza2lwIFwic3VwZXJcIlxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwYXJhbWV0ZXJzID0gdGhpcy5wYXJzZU1ldGhvZENhbGxQYXJhbWV0ZXJzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGVybSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnN1cGVyQ29uc3RydWN0b3JDYWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZXJhbmRzOiBwYXJhbWV0ZXJzLm5vZGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tYVBvc2l0aW9uczogcGFyYW1ldGVycy5jb21tYVBvc2l0aW9ucyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHRCcmFja2V0UG9zaXRpb246IHBhcmFtZXRlcnMucmlnaHRCcmFja2V0UG9zaXRpb25cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0ZXJtO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXJtID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUua2V5d29yZFN1cGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb25cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlRG90T3JBcnJheUNoYWlucyh0ZXJtKTtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZFRoaXM6XHJcbiAgICAgICAgICAgICAgICB0ZXJtID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5rZXl3b3JkVGhpcyxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb25cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VEb3RPckFycmF5Q2hhaW5zKHRlcm0pO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkTmV3OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VEb3RPckFycmF5Q2hhaW5zKHRoaXMucGFyc2VOZXcoKSk7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmludGVnZXJDb25zdGFudDpcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuY2hhckNvbnN0YW50OlxyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5mbG9hdGluZ1BvaW50Q29uc3RhbnQ6XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnN0cmluZ0NvbnN0YW50OlxyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5ib29sZWFuQ29uc3RhbnQ6XHJcbiAgICAgICAgICAgICAgICB0ZXJtID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoQ29uc3RhbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCksXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3RhbnRUeXBlOiB0aGlzLnR0LFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0YW50OiB0aGlzLmNjdC52YWx1ZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGxldCBpc1N0cmluZ0NvbnN0YW50ID0gdGhpcy50dCA9PSBUb2tlblR5cGUuc3RyaW5nQ29uc3RhbnQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpc1N0cmluZ0NvbnN0YW50KSByZXR1cm4gdGhpcy5wYXJzZURvdE9yQXJyYXlDaGFpbnModGVybSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRlcm07XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmROdWxsOlxyXG4gICAgICAgICAgICAgICAgdGVybSA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaENvbnN0YW50LFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0YW50VHlwZTogVG9rZW5UeXBlLmtleXdvcmROdWxsLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0YW50OiBudWxsXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0ZXJtO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5pZGVudGlmaWVyOiAvLyBhdHRyaWJ1dGUgb2YgY3VycmVudCBjbGFzcyBvciBsb2NhbCB2YXJpYWJsZVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBpZGVudGlmaWVyMSA9IDxzdHJpbmc+dGhpcy5jY3QudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgcG9zaXRpb24xID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG4gICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50dCA9PSBUb2tlblR5cGUubGVmdEJyYWNrZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcGFyYW1ldGVycyA9IHRoaXMucGFyc2VNZXRob2RDYWxsUGFyYW1ldGVycygpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCByaWdodEJyYWNrZXRQb3NpdGlvbiA9IHBhcmFtZXRlcnMucmlnaHRCcmFja2V0UG9zaXRpb247XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRlcm0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5jYWxsTWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24xLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByaWdodEJyYWNrZXRQb3NpdGlvbjogcmlnaHRCcmFja2V0UG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wZXJhbmRzOiBwYXJhbWV0ZXJzLm5vZGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IHRlcm0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IGlkZW50aWZpZXIxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tYVBvc2l0aW9uczogcGFyYW1ldGVycy5jb21tYVBvc2l0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGVybSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IGlkZW50aWZpZXIxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb25cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VEb3RPckFycmF5Q2hhaW5zKHRlcm0pO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJFcndhcnRldCB3aXJkIGVpbmUgVmFyaWFibGUsIGVpbiBNZXRob2RlbmF1ZnJ1ZiBvZGVyIHRoaXMgb2RlciBzdXBlci4gR2VmdW5kZW4gd3VyZGU6IFwiICsgdGhpcy5jY3QudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICB0b2tlbnNOb3RBZnRlckNhc3Rpbmc6IFRva2VuVHlwZVtdID0gW1Rva2VuVHlwZS5tdWx0aXBsaWNhdGlvbiwgVG9rZW5UeXBlLmRpdmlzaW9uLCBUb2tlblR5cGUucGx1cyxcclxuICAgIFRva2VuVHlwZS5taW51cywgVG9rZW5UeXBlLmRvdCwgVG9rZW5UeXBlLm1vZHVsbywgVG9rZW5UeXBlLnNlbWljb2xvbiwgVG9rZW5UeXBlLnJpZ2h0QnJhY2tldF07XHJcblxyXG4gICAgYnJhY2tldE9yQ2FzdGluZygpOiBUZXJtTm9kZSB7XHJcblxyXG4gICAgICAgIGxldCBwb3NpdGlvbiA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgIHRoaXMubmV4dFRva2VuKCk7IC8vIGNvbnN1bWUgKFxyXG5cclxuICAgICAgICBpZiAodGhpcy50dCA9PSBUb2tlblR5cGUuaWRlbnRpZmllciAmJiB0aGlzLmN0WzFdLnR0ID09IFRva2VuVHlwZS5yaWdodEJyYWNrZXQgJiZcclxuICAgICAgICAgICAgdGhpcy50b2tlbnNOb3RBZnRlckNhc3RpbmcuaW5kZXhPZih0aGlzLmN0WzJdLnR0KSA8IDApIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBjYXN0VG9UeXBlID0gdGhpcy5wYXJzZVR5cGUoKTtcclxuICAgICAgICAgICAgbGV0IHBvc2l0aW9uMSA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7IC8vIFBvc2l0aW9uIG9mIClcclxuICAgICAgICAgICAgcG9zaXRpb24ubGVuZ3RoID0gcG9zaXRpb24xLmNvbHVtbiAtIHBvc2l0aW9uLmNvbHVtbiArIDE7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUucmlnaHRCcmFja2V0LCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIGxldCB3aGF0VG9DYXN0ID0gdGhpcy5wYXJzZVBsdXNQbHVzTWludXNNaW51cygpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5jYXN0VmFsdWUsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICBjYXN0VG9UeXBlOiBjYXN0VG9UeXBlLFxyXG4gICAgICAgICAgICAgICAgd2hhdFRvQ2FzdDogd2hhdFRvQ2FzdFxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgbGV0IHRlcm0gPSB0aGlzLnBhcnNlVGVybSgpO1xyXG4gICAgICAgICAgICBsZXQgcmlnaHRCcmFja2V0UG9zaXRpb24gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUucmlnaHRCcmFja2V0LCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQ29uc3RhbnQodGVybSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0ZXJtO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgYnJhY2tldHNOb2RlOiBCcmFja2V0c05vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogcmlnaHRCcmFja2V0UG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucmlnaHRCcmFja2V0LFxyXG4gICAgICAgICAgICAgICAgdGVybUluc2lkZUJyYWNrZXRzOiB0ZXJtXHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYnJhY2tldHNOb2RlO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlTmV3KCk6IFRlcm1Ob2RlIHtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICBsZXQgcG9zaXRpb24gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5leHBlY3QoVG9rZW5UeXBlLmlkZW50aWZpZXIsIGZhbHNlKSkge1xyXG4gICAgICAgICAgICBsZXQgaWRlbnRpZmllciA9IDxzdHJpbmc+dGhpcy5jY3QudmFsdWU7XHJcbiAgICAgICAgICAgIGxldCBpZGVudGlmaWVyUG9zaXRpb24gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG5cclxuXHJcbiAgICAgICAgICAgIGxldCBnZW5lcmljUGFyYW1ldGVyVHlwZXM6IFR5cGVOb2RlW10gPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMudHQgPT0gVG9rZW5UeXBlLmxvd2VyKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgZ2VuZXJpY1BhcmFtZXRlclR5cGVzID0gW107XHJcbiAgICAgICAgICAgICAgICBsZXQgZmlyc3Q6IGJvb2xlYW4gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgIHdoaWxlICgoZmlyc3QgJiYgdGhpcy50dCA9PSBUb2tlblR5cGUuaWRlbnRpZmllcikgfHwgKCFmaXJzdCAmJiB0aGlzLnR0ID09IFRva2VuVHlwZS5jb21tYSkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmaXJzdCkgdGhpcy5uZXh0VG9rZW4oKTsgLy8gY29uc3VtZSBjb21tYVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBnZW5lcmljUGFyYW1ldGVyVHlwZXMucHVzaCh0aGlzLnBhcnNlVHlwZSgpKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLmdyZWF0ZXIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGdlbmVyaWNQYXJhbWV0ZXJUeXBlcy5sZW5ndGggPT0gMCkgZ2VuZXJpY1BhcmFtZXRlclR5cGVzID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMudHQgPT0gVG9rZW5UeXBlLmxlZnRTcXVhcmVCcmFja2V0IHx8IHRoaXMudHQgPT0gVG9rZW5UeXBlLmxlZnRSaWdodFNxdWFyZUJyYWNrZXQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgdHlwZW5vZGU6IFR5cGVOb2RlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS50eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBhcnJheURpbWVuc2lvbjogMCxcclxuICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBpZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgICAgIGdlbmVyaWNQYXJhbWV0ZXJUeXBlczogZ2VuZXJpY1BhcmFtZXRlclR5cGVzXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGVOb2Rlcy5wdXNoKHR5cGVub2RlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgZWxlbWVudENvdW50OiBUZXJtTm9kZVtdID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMudHQgPT0gVG9rZW5UeXBlLmxlZnRTcXVhcmVCcmFja2V0IHx8IHRoaXMudHQgPT0gVG9rZW5UeXBlLmxlZnRSaWdodFNxdWFyZUJyYWNrZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlbm9kZS5hcnJheURpbWVuc2lvbisrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50dCA9PSBUb2tlblR5cGUubGVmdFJpZ2h0U3F1YXJlQnJhY2tldCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50Q291bnQucHVzaChudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50Q291bnQucHVzaCh0aGlzLnBhcnNlVGVybSgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLnJpZ2h0U3F1YXJlQnJhY2tldCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgaW5pdGlhbGl6YXRpb24gPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnR0ID09IFRva2VuVHlwZS5sZWZ0Q3VybHlCcmFja2V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5pdGlhbGl6YXRpb24gPSB0aGlzLnBhcnNlQXJyYXlMaXRlcmFsKHR5cGVub2RlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbmV3QXJyYXlOb2RlOiBOZXdBcnJheU5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLm5ld0FycmF5LFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBhcnJheVR5cGU6IHR5cGVub2RlLFxyXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRDb3VudDogZWxlbWVudENvdW50LFxyXG4gICAgICAgICAgICAgICAgICAgIGluaXRpYWxpemF0aW9uOiBpbml0aWFsaXphdGlvblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXdBcnJheU5vZGU7XHJcblxyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnR0ID09IFRva2VuVHlwZS5sZWZ0QnJhY2tldCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHBhcmFtZXRlcnMgPSB0aGlzLnBhcnNlTWV0aG9kQ2FsbFBhcmFtZXRlcnMoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgY2xhc3NUeXBlOiBUeXBlTm9kZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUudHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogaWRlbnRpZmllclBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIGFycmF5RGltZW5zaW9uOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IGlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgZ2VuZXJpY1BhcmFtZXRlclR5cGVzOiBnZW5lcmljUGFyYW1ldGVyVHlwZXNcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGVOb2Rlcy5wdXNoKGNsYXNzVHlwZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUubmV3T2JqZWN0LFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBjbGFzc1R5cGU6IGNsYXNzVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBjb25zdHJ1Y3Rvck9wZXJhbmRzOiBwYXJhbWV0ZXJzLm5vZGVzLFxyXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0QnJhY2tldFBvc2l0aW9uOiBwYXJhbWV0ZXJzLnJpZ2h0QnJhY2tldFBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hUG9zaXRpb25zOiBwYXJhbWV0ZXJzLmNvbW1hUG9zaXRpb25zXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIktvbnN0cnVrdG9yYXVmcnVmIChhbHNvIHJ1bmRlIEtsYW1tZXIgYXVmKSBvZGVyIEFycmF5LUludGFuemllcnVuZyAoZWNraWdlIEtsYW1tZXIgYXVmKSBlcndhcnRldC5cIiwgXCJlcnJvclwiLCB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2VBcnJheUxpdGVyYWwoYXJyYXlUeXBlOiBUeXBlTm9kZSk6IEFycmF5SW5pdGlhbGl6YXRpb25Ob2RlIHtcclxuICAgICAgICAvLyBleHBlY3RzIHsgYXMgbmV4dCB0b2tlblxyXG5cclxuICAgICAgICBsZXQgbm9kZXM6IChBcnJheUluaXRpYWxpemF0aW9uTm9kZSB8IFRlcm1Ob2RlKVtdID0gW107XHJcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuICAgICAgICBsZXQgZGltZW5zaW9uID0gbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLmxlZnRDdXJseUJyYWNrZXQsIHRydWUpO1xyXG4gICAgICAgIGlmICh0aGlzLnR0ICE9IFRva2VuVHlwZS5yaWdodEN1cmx5QnJhY2tldCkge1xyXG5cclxuICAgICAgICAgICAgbGV0IGZpcnN0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgd2hpbGUgKGZpcnN0IHx8IHRoaXMudHQgPT0gVG9rZW5UeXBlLmNvbW1hKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcG9zaXRpb24xID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpcnN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTsgLy8gY29uc3VtZSBjb21tYVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZmlyc3QgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbmV3RGltZW5zaW9uOiBudW1iZXI7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50dCA9PSBUb2tlblR5cGUubGVmdEN1cmx5QnJhY2tldCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdUeXBlOiBUeXBlTm9kZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJheURpbWVuc2lvbjogYXJyYXlUeXBlLmFycmF5RGltZW5zaW9uIC0gMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogYXJyYXlUeXBlLmlkZW50aWZpZXJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50eXBlTm9kZXMucHVzaChuZXdUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgYWwgPSB0aGlzLnBhcnNlQXJyYXlMaXRlcmFsKG5ld1R5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld0RpbWVuc2lvbiA9IGFsLmRpbWVuc2lvbiArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMucHVzaChhbCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGVzLnB1c2godGhpcy5wYXJzZVRlcm0oKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3RGltZW5zaW9uID0gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZGltZW5zaW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGltZW5zaW9uICE9IG5ld0RpbWVuc2lvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRpZSBEaW1lbnNpb24gZGllc2VzIEFycmF5LUxpdGVyYWxzIChcIiArIChuZXdEaW1lbnNpb24gLSAxKSArIFwiIGlzdCB1bmdsZWljaCBkZXJqZW5pZ2VuIGRlciB2b3JhbmdlZ2FuZ2VuZW4gQXJyYXktTGl0ZXJhbGUgKFwiICsgKGRpbWVuc2lvbiAtIDEpICsgXCIpLlwiLCBcImVycm9yXCIsIHBvc2l0aW9uMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZGltZW5zaW9uID0gbmV3RGltZW5zaW9uO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5yaWdodEN1cmx5QnJhY2tldCwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIGxldCBhaW46IEFycmF5SW5pdGlhbGl6YXRpb25Ob2RlID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuYXJyYXlJbml0aWFsaXphdGlvbixcclxuICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICBhcnJheVR5cGU6IGFycmF5VHlwZSxcclxuICAgICAgICAgICAgZGltZW5zaW9uOiBkaW1lbnNpb24sXHJcbiAgICAgICAgICAgIG5vZGVzOiBub2Rlc1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGFpbjtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2VNZXRob2RDYWxsUGFyYW1ldGVycygpOiB7IHJpZ2h0QnJhY2tldFBvc2l0aW9uOiBUZXh0UG9zaXRpb24sIG5vZGVzOiBUZXJtTm9kZVtdLCBjb21tYVBvc2l0aW9uczogVGV4dFBvc2l0aW9uW10gfSB7XHJcbiAgICAgICAgLy8gQXNzdW1wdGlvbjogY3VycmVudCB0b2tlbiBpcyAoICAgICAgICBcclxuICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG4gICAgICAgIGlmICh0aGlzLnR0ID09IFRva2VuVHlwZS5yaWdodEJyYWNrZXQpIHtcclxuICAgICAgICAgICAgbGV0IHJpZ2h0QnJhY2tldFBvc2l0aW9uID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICAgICAgcmV0dXJuIHsgcmlnaHRCcmFja2V0UG9zaXRpb246IHJpZ2h0QnJhY2tldFBvc2l0aW9uLCBub2RlczogW10sIGNvbW1hUG9zaXRpb25zOiBbXSB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHBhcmFtZXRlcnM6IFRlcm1Ob2RlW10gPSBbXTtcclxuICAgICAgICBsZXQgY29tbWFQb3NpdGlvbnM6IFRleHRQb3NpdGlvbltdID0gW107XHJcblxyXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XHJcbiAgICAgICAgICAgIGxldCBwb3MgPSB0aGlzLnBvcztcclxuXHJcbiAgICAgICAgICAgIGxldCBwYXJhbWV0ZXIgPSB0aGlzLnBhcnNlVGVybSgpO1xyXG4gICAgICAgICAgICBpZiAocGFyYW1ldGVyICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHBhcmFtZXRlcnMucHVzaChwYXJhbWV0ZXIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy50dCAhPSBUb2tlblR5cGUuY29tbWEpIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29tbWFQb3NpdGlvbnMucHVzaCh0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7IC8vIGNvbnN1bWUgY29tbWFcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gZW1lcmdlbmN5LXN0ZXA6XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBvcyA9PSBwb3MpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcG9zaXRpb24gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG4gICAgICAgIGxldCByaWdodEJyYWNrZXRGb3VuZCA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5yaWdodEJyYWNrZXQsIHRydWUpO1xyXG5cclxuICAgICAgICByZXR1cm4geyByaWdodEJyYWNrZXRQb3NpdGlvbjogcmlnaHRCcmFja2V0Rm91bmQgPyBwb3NpdGlvbiA6IG51bGwsIG5vZGVzOiBwYXJhbWV0ZXJzLCBjb21tYVBvc2l0aW9uczogY29tbWFQb3NpdGlvbnMgfTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2VEb3RPckFycmF5Q2hhaW5zKHRlcm06IFRlcm1Ob2RlKTogVGVybU5vZGUge1xyXG5cclxuICAgICAgICBpZiAodGVybSA9PSBudWxsKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgd2hpbGUgKHRoaXMuY29tZXNUb2tlbihbVG9rZW5UeXBlLmRvdCwgVG9rZW5UeXBlLmxlZnRTcXVhcmVCcmFja2V0XSkpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMudHQgPT0gVG9rZW5UeXBlLmRvdCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcbiAgICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnR0ICE9IFRva2VuVHlwZS5pZGVudGlmaWVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJFcndhcnRldCB3aXJkIGRlciBCZXplaWNobmVyIGVpbmVzIEF0dHJpYnV0cyBvZGVyIGVpbmVyIE1ldGhvZGUsIGdlZnVuZGVuIHd1cmRlOiBcIiArIHRoaXMuY2N0LnZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGVybTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgaWRlbnRpZmllciA9IDxzdHJpbmc+dGhpcy5jY3QudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgcG9zaXRpb24gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudHQgPT0gVG9rZW5UeXBlLmxlZnRCcmFja2V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBhcmFtZXRlcnMgPSB0aGlzLnBhcnNlTWV0aG9kQ2FsbFBhcmFtZXRlcnMoKTtcclxuICAgICAgICAgICAgICAgICAgICB0ZXJtID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2FsbE1ldGhvZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByaWdodEJyYWNrZXRQb3NpdGlvbjogcGFyYW1ldGVycy5yaWdodEJyYWNrZXRQb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmFuZHM6IHBhcmFtZXRlcnMubm9kZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdDogdGVybSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogaWRlbnRpZmllcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWFQb3NpdGlvbnM6IHBhcmFtZXRlcnMuY29tbWFQb3NpdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRlcm0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wdXNoQXR0cmlidXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IGlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdDogdGVybVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBsZXQgcG9zaXRpb24gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHBvc2l0aW9uID0gdGVybS5wb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSB0aGlzLnBhcnNlVGVybSgpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHBvc2l0aW9uRW5kID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuICAgICAgICAgICAgICAgIGxldCBwb3NpdGlvbjE6IFRleHRQb3NpdGlvbiA9IE9iamVjdC5hc3NpZ24oe30sIHBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5yaWdodFNxdWFyZUJyYWNrZXQsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uRW5kLmxpbmUgPT0gcG9zaXRpb24ubGluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uMS5sZW5ndGggPSBwb3NpdGlvbkVuZC5jb2x1bW4gKyBwb3NpdGlvbkVuZC5sZW5ndGggLSBwb3NpdGlvbjEuY29sdW1uO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjEgPSBwb3NpdGlvbkVuZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRlcm0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnNlbGVjdEFycmF5RWxlbWVudCxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24xLFxyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IHRlcm1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0ZXJtO1xyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbih0eXBlOiBUeXBlTm9kZSk6IExvY2FsVmFyaWFibGVEZWNsYXJhdGlvbk5vZGUge1xyXG5cclxuICAgICAgICBsZXQgaXNGaW5hbCA9IGZhbHNlO1xyXG4gICAgICAgIGlmICh0aGlzLnR0ID09IFRva2VuVHlwZS5rZXl3b3JkRmluYWwpIHtcclxuICAgICAgICAgICAgaXNGaW5hbCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHR5cGUgPSB0aGlzLnBhcnNlVHlwZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodGhpcy50dCAhPSBUb2tlblR5cGUuaWRlbnRpZmllcil7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiSGllciB3aXJkIGVpbiBCZXplaWNobmVyIChOYW1lKSBlaW5lciBWYXJpYWJsZSBlcndhcnRldC5cIiwgXCJlcnJvclwiLCB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpKTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgaWRlbnRpZmllciA9IDxzdHJpbmc+dGhpcy5jY3QudmFsdWU7XHJcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG5cclxuICAgICAgICBsZXQgaW5pdGlhbGl6YXRpb246IFRlcm1Ob2RlID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgaWYgKHRoaXMudHQgPT0gVG9rZW5UeXBlLmFzc2lnbm1lbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgIGlmICh0eXBlLmFycmF5RGltZW5zaW9uID4gMCAmJiB0aGlzLnR0ID09IFRva2VuVHlwZS5sZWZ0Q3VybHlCcmFja2V0KSB7XHJcbiAgICAgICAgICAgICAgICBpbml0aWFsaXphdGlvbiA9IHRoaXMucGFyc2VBcnJheUxpdGVyYWwodHlwZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpbml0aWFsaXphdGlvbiA9IHRoaXMucGFyc2VUZXJtKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgIGlmICh0aGlzLnR0ID09IFRva2VuVHlwZS5lbmRvZlNvdXJjZWNvZGUgJiYgdHlwZSA9PSBudWxsICYmIGlkZW50aWZpZXIgPT0gbnVsbCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5sb2NhbFZhcmlhYmxlRGVjbGFyYXRpb24sXHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbixcclxuICAgICAgICAgICAgaWRlbnRpZmllcjogaWRlbnRpZmllcixcclxuICAgICAgICAgICAgdmFyaWFibGVUeXBlOiB0eXBlLFxyXG4gICAgICAgICAgICBpbml0aWFsaXphdGlvbjogaW5pdGlhbGl6YXRpb24sXHJcbiAgICAgICAgICAgIGlzRmluYWw6IGlzRmluYWxcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlVHlwZSgpOiBUeXBlTm9kZSB7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIGUuZy4gaW50LCBpbnRbXVtdLCBJbnRlZ2VyLCBBcnJheUxpc3Q8SW50ZWdlcj4gLEhhc2hNYXA8SW50ZWdlciwgQXJyYXlMaXN0PFN0cmluZz4+W11bXVxyXG4gICAgICAgICAqL1xyXG5cclxuXHJcbiAgICAgICAgaWYodGhpcy50dCAhPSBUb2tlblR5cGUuaWRlbnRpZmllciAmJiB0aGlzLnR0ICE9IFRva2VuVHlwZS5rZXl3b3JkVm9pZCl7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRXJ3YXJ0ZXQgd2lyZCBlaW4gRGF0ZW50eXAuIERpZXNlciBtdXNzIG1pdCBlaW5lbSBCZXplaWNobmVyIGJlZ2lubmVuLiBHZWZ1bmRlbiB3dXJkZTogXCIgKyB0aGlzLmNjdC52YWx1ZSwgXCJlcnJvclwiLCB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUudHlwZSxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpLFxyXG4gICAgICAgICAgICAgICAgYXJyYXlEaW1lbnNpb246IDAsXHJcbiAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBcImludFwiLFxyXG4gICAgICAgICAgICAgICAgZ2VuZXJpY1BhcmFtZXRlclR5cGVzOiBbXVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGlkZW50aWZpZXIgPSA8c3RyaW5nPnRoaXMuY2N0LnZhbHVlO1xyXG4gICAgICAgIGxldCBwb3NpdGlvbiA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuXHJcbiAgICAgICAgbGV0IGdlbmVyaWNQYXJhbWV0ZXJUeXBlczogVHlwZU5vZGVbXSA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgIGlmICh0aGlzLnR0ID09IFRva2VuVHlwZS5sb3dlcikge1xyXG5cclxuICAgICAgICAgICAgZ2VuZXJpY1BhcmFtZXRlclR5cGVzID0gW107XHJcbiAgICAgICAgICAgIGxldCBmaXJzdDogYm9vbGVhbiA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcblxyXG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgd2hpbGUgKChmaXJzdCAmJiB0aGlzLnR0ID09IFRva2VuVHlwZS5pZGVudGlmaWVyKSB8fCAoIWZpcnN0ICYmIHRoaXMudHQgPT0gVG9rZW5UeXBlLmNvbW1hKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghZmlyc3QpIHRoaXMubmV4dFRva2VuKCk7IC8vIGNvbnN1bWUgY29tbWFcclxuXHJcbiAgICAgICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIGdlbmVyaWNQYXJhbWV0ZXJUeXBlcy5wdXNoKHRoaXMucGFyc2VUeXBlKCkpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLmdyZWF0ZXIpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBhcnJheURpbWVuc2lvbiA9IDA7XHJcbiAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgd2hpbGUgKHRoaXMudHQgPT0gVG9rZW5UeXBlLmxlZnRSaWdodFNxdWFyZUJyYWNrZXQpIHtcclxuICAgICAgICAgICAgYXJyYXlEaW1lbnNpb24rKztcclxuICAgICAgICAgICAgcG9zaXRpb24ubGVuZ3RoICs9IDI7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdHlwZW5vZGU6IFR5cGVOb2RlID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUudHlwZSxcclxuICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICBhcnJheURpbWVuc2lvbjogYXJyYXlEaW1lbnNpb24sXHJcbiAgICAgICAgICAgIGlkZW50aWZpZXI6IGlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgIGdlbmVyaWNQYXJhbWV0ZXJUeXBlczogZ2VuZXJpY1BhcmFtZXRlclR5cGVzXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnR5cGVOb2Rlcy5wdXNoKHR5cGVub2RlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHR5cGVub2RlO1xyXG5cclxuICAgIH1cclxuXHJcblxyXG4gICAgcGFyc2VDbGFzc0RlZmluaXRpb24oKTogQVNUTm9kZSB7XHJcblxyXG4gICAgICAgIGxldCBjb21tZW50QmVmb3JlID0gdGhpcy5jY3QuY29tbWVudEJlZm9yZTtcclxuICAgICAgICBsZXQgbW9kaWZpZXJzID0gdGhpcy5jb2xsZWN0TW9kaWZpZXJzKCk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5jb21lc1Rva2VuKFBhcnNlci5DbGFzc1Rva2VucykpIHtcclxuICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJFcndhcnRldCB3aXJkIGNsYXNzLCBpbnRlcmZhY2Ugb2RlciBlbnVtLiBHZWZ1bmRlbiB3dXJkZTogXCIgKyB0aGlzLmNjdC52YWx1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGNsYXNzVHlwZSA9IHRoaXMudHQ7XHJcbiAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZXhwZWN0KFRva2VuVHlwZS5pZGVudGlmaWVyLCBmYWxzZSkpIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBpZGVudGlmaWVyID0gPHN0cmluZz50aGlzLmNjdC52YWx1ZTtcclxuICAgICAgICAgICAgbGV0IHBvc2l0aW9uID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuXHJcbiAgICAgICAgICAgIGxldCB0eXBlUGFyYW1ldGVyczogVHlwZVBhcmFtZXRlck5vZGVbXSA9IFtdO1xyXG4gICAgICAgICAgICAvLyBGb3IgR2VuZXJpY3M6IHBhcnNlIGV4cHJlc3Npb24gbGlrZSA8RSwgRiBleHRlbmRzIFRlc3QgaW1wbGVtZW50cyBDb21wYXJhYmxlPFRlc3Q+PlxyXG4gICAgICAgICAgICBpZiAodGhpcy50dCA9PSBUb2tlblR5cGUubG93ZXIpIHtcclxuICAgICAgICAgICAgICAgIHR5cGVQYXJhbWV0ZXJzID0gdGhpcy5wYXJzZVR5cGVQYXJhbWV0ZXJEZWZpbml0aW9uKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBleHRlbmRzSW1wbGVtZW50cyA9IHRoaXMucGFyc2VFeHRlbmRzSW1wbGVtZW50cyhjbGFzc1R5cGUgPT0gVG9rZW5UeXBlLmtleXdvcmRJbnRlcmZhY2UpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNsYXNzVHlwZSA9PSBUb2tlblR5cGUua2V5d29yZEVudW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlRW51bShpZGVudGlmaWVyLCBleHRlbmRzSW1wbGVtZW50cywgcG9zaXRpb24sIG1vZGlmaWVycy52aXNpYmlsaXR5LCBjb21tZW50QmVmb3JlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHNjb3BlRnJvbSA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmV4cGVjdChUb2tlblR5cGUubGVmdEN1cmx5QnJhY2tldCwgdHJ1ZSkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbWV0aG9kc0FuZEF0dHJpYnV0ZXMgPSB0aGlzLnBhcnNlQ2xhc3NCb2R5KGNsYXNzVHlwZSwgaWRlbnRpZmllcik7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2NvcGVUbyA9IHRoaXMuZ2V0RW5kT2ZDdXJyZW50VG9rZW4oKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5yaWdodEN1cmx5QnJhY2tldCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGNsYXNzVHlwZSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkQ2xhc3M6IHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5rZXl3b3JkQ2xhc3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVGcm9tOiBzY29wZUZyb20sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlVG86IHNjb3BlVG8sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IGlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IG1ldGhvZHNBbmRBdHRyaWJ1dGVzLmF0dHJpYnV0ZXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZHM6IG1ldGhvZHNBbmRBdHRyaWJ1dGVzLm1ldGhvZHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQWJzdHJhY3Q6IG1vZGlmaWVycy5pc0Fic3RyYWN0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiBtb2RpZmllcnMudmlzaWJpbGl0eSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZW5kczogZXh0ZW5kc0ltcGxlbWVudHMuZXh0ZW5kcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wbGVtZW50czogZXh0ZW5kc0ltcGxlbWVudHMuaW1wbGVtZW50cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZVBhcmFtZXRlcnM6IHR5cGVQYXJhbWV0ZXJzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50QmVmb3JlOiBjb21tZW50QmVmb3JlXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkSW50ZXJmYWNlOiByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUua2V5d29yZEludGVyZmFjZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBpZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZUZyb206IHNjb3BlRnJvbSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVUbzogc2NvcGVUbyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kczogbWV0aG9kc0FuZEF0dHJpYnV0ZXMubWV0aG9kcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZVBhcmFtZXRlcnM6IHR5cGVQYXJhbWV0ZXJzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRlbmRzOiBleHRlbmRzSW1wbGVtZW50cy5pbXBsZW1lbnRzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50QmVmb3JlOiBjb21tZW50QmVmb3JlXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBwYXJzZVR5cGVQYXJhbWV0ZXJEZWZpbml0aW9uKCk6IFR5cGVQYXJhbWV0ZXJOb2RlW10ge1xyXG5cclxuICAgICAgICBsZXQgdHlwZVBhcmFtZXRlcnM6IFR5cGVQYXJhbWV0ZXJOb2RlW10gPSBbXTtcclxuXHJcbiAgICAgICAgbGV0IGlkZW50aWZpZXJNYXAgPSB7fTtcclxuXHJcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLmxvd2VyLCB0cnVlKTtcclxuICAgICAgICBsZXQgZmlyc3Q6IGJvb2xlYW4gPSB0cnVlO1xyXG5cclxuICAgICAgICB3aGlsZSAoKGZpcnN0ICYmIHRoaXMudHQgPT0gVG9rZW5UeXBlLmlkZW50aWZpZXIpIHx8ICghZmlyc3QgJiYgdGhpcy50dCA9PSBUb2tlblR5cGUuY29tbWEpKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB0aGlzLmV4cGVjdChUb2tlblR5cGUuY29tbWEsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHRwOiBUeXBlUGFyYW1ldGVyTm9kZSA9IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS50eXBlUGFyYW1ldGVyLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCksXHJcbiAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiA8c3RyaW5nPnRoaXMuY2N0LnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgZXh0ZW5kczogbnVsbCxcclxuICAgICAgICAgICAgICAgIGltcGxlbWVudHM6IG51bGxcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpZGVudGlmaWVyTWFwW3RwLmlkZW50aWZpZXJdICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiWndlaSBUeXBwYXJhbWV0ZXIgZMO8cmZlIG5pY2h0IGRlbnNlbGJlbiBCZXplaWNobmVyIHRyYWdlbi5cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlkZW50aWZpZXJNYXBbdHAuaWRlbnRpZmllcl0gPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBleHRlbmRzSW1wbGVtZW50cyA9IHRoaXMucGFyc2VUeXBlUGFyYW1ldGVyQm91bmRzKCk7XHJcblxyXG4gICAgICAgICAgICB0cC5leHRlbmRzID0gZXh0ZW5kc0ltcGxlbWVudHMuZXh0ZW5kcztcclxuXHJcbiAgICAgICAgICAgIGlmICh0cC5leHRlbmRzICE9IG51bGwgJiYgdHAuZXh0ZW5kcy5hcnJheURpbWVuc2lvbiA+IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRGVyIERhdGVudHlwIGRlcyBUeXBwYXJhbWV0ZXJzIFwiICsgdHAuaWRlbnRpZmllciArIFwiIGRhcmYga2VpbiBBcnJheSBzZWluLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdHAuaW1wbGVtZW50cyA9IGV4dGVuZHNJbXBsZW1lbnRzLmltcGxlbWVudHM7XHJcblxyXG4gICAgICAgICAgICB0cC5pbXBsZW1lbnRzLmZvckVhY2goKGltKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW0uYXJyYXlEaW1lbnNpb24gPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgRGF0ZW50eXAgZGVzIFR5cHBhcmFtZXRlcnMgXCIgKyB0cC5pZGVudGlmaWVyICsgXCIgZGFyZiBrZWluIEFycmF5IHNlaW4uXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB0eXBlUGFyYW1ldGVycy5wdXNoKHRwKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuZ3JlYXRlciwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0eXBlUGFyYW1ldGVycztcclxuICAgIH1cclxuXHJcbiAgICBwYXJzZUVudW0oaWRlbnRpZmllcjogc3RyaW5nLCBleHRlbmRzSW1wbGVtZW50czoge1xyXG4gICAgICAgIGV4dGVuZHM6IFR5cGVOb2RlO1xyXG4gICAgICAgIGltcGxlbWVudHM6IFR5cGVOb2RlW107XHJcbiAgICB9LCBwb3NpdGlvbjogVGV4dFBvc2l0aW9uLCB2aXNpYmlsaXR5OiBWaXNpYmlsaXR5LCBjb21tZW50QmVmb3JlOiBUb2tlbik6IEFTVE5vZGUge1xyXG5cclxuICAgICAgICBpZiAoZXh0ZW5kc0ltcGxlbWVudHMuZXh0ZW5kcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKFwiRWluIGVudW0ga2FubiBuaWNodCBtaXQgZXh0ZW5kcyBlcndlaXRlcnQgd2VyZGVuLlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGV4dGVuZHNJbXBsZW1lbnRzLmltcGxlbWVudHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkVpbiBlbnVtIGthbm4ga2VpbiBJbnRlcmZhY2UgaW1wbGVtZW50aWVyZW4uXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHNjb3BlRnJvbSA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcbiAgICAgICAgaWYgKHRoaXMuZXhwZWN0KFRva2VuVHlwZS5sZWZ0Q3VybHlCcmFja2V0LCB0cnVlKSkge1xyXG5cclxuICAgICAgICAgICAgbGV0IHZhbHVlczogRW51bVZhbHVlTm9kZVtdID0gdGhpcy5wYXJzZUVudW1WYWx1ZXMoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBtZXRob2RzQW5kQXR0cmlidXRlcyA9IHRoaXMucGFyc2VDbGFzc0JvZHkoVG9rZW5UeXBlLmtleXdvcmRFbnVtLCBpZGVudGlmaWVyKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBzY29wZVRvID0gdGhpcy5nZXRFbmRPZkN1cnJlbnRUb2tlbigpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLnJpZ2h0Q3VybHlCcmFja2V0LCB0cnVlKTtcclxuXHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmtleXdvcmRFbnVtLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgc2NvcGVGcm9tOiBzY29wZUZyb20sXHJcbiAgICAgICAgICAgICAgICBzY29wZVRvOiBzY29wZVRvLFxyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlczogbWV0aG9kc0FuZEF0dHJpYnV0ZXMuYXR0cmlidXRlcyxcclxuICAgICAgICAgICAgICAgIG1ldGhvZHM6IG1ldGhvZHNBbmRBdHRyaWJ1dGVzLm1ldGhvZHMsXHJcbiAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBpZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgdmFsdWVzOiB2YWx1ZXMsXHJcbiAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiB2aXNpYmlsaXR5LFxyXG4gICAgICAgICAgICAgICAgY29tbWVudEJlZm9yZTogY29tbWVudEJlZm9yZVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlRW51bVZhbHVlcygpOiBFbnVtVmFsdWVOb2RlW10ge1xyXG5cclxuICAgICAgICBsZXQgdmFsdWVzOiBFbnVtVmFsdWVOb2RlW10gPSBbXTtcclxuXHJcbiAgICAgICAgbGV0IHBvczogbnVtYmVyID0gMDtcclxuICAgICAgICBsZXQgZmlyc3Q6IGJvb2xlYW4gPSB0cnVlO1xyXG5cclxuICAgICAgICB3aGlsZSAoKGZpcnN0ICYmIHRoaXMudHQgPT0gVG9rZW5UeXBlLmlkZW50aWZpZXIpIHx8IHRoaXMudHQgPT0gVG9rZW5UeXBlLmNvbW1hKSB7XHJcbiAgICAgICAgICAgIHBvcyA9IHRoaXMucG9zO1xyXG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB0aGlzLm5leHRUb2tlbigpOyAvLyBza2lwIGNvbW1hXHJcbiAgICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5leHBlY3QoVG9rZW5UeXBlLmlkZW50aWZpZXIsIGZhbHNlKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBpZGVudGlmaWVyID0gPHN0cmluZz50aGlzLmNjdC52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBwb3NpdGlvbiA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbnN0cnVjdG9yUGFyYW1ldGVyczogVGVybU5vZGVbXSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGNvbW1hUG9zaXRpb25zOiBUZXh0UG9zaXRpb25bXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgbGV0IHJpZ2h0QnJhY2tldFBvc2l0aW9uOiBUZXh0UG9zaXRpb24gPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50dCA9PSBUb2tlblR5cGUubGVmdEJyYWNrZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWNwID0gdGhpcy5wYXJzZU1ldGhvZENhbGxQYXJhbWV0ZXJzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3RydWN0b3JQYXJhbWV0ZXJzID0gbWNwLm5vZGVzO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hUG9zaXRpb25zID0gbWNwLmNvbW1hUG9zaXRpb25zO1xyXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0QnJhY2tldFBvc2l0aW9uID0gbWNwLnJpZ2h0QnJhY2tldFBvc2l0aW9uO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaEVudW1WYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBjb25zdHJ1Y3RvclBhcmFtZXRlcnM6IGNvbnN0cnVjdG9yUGFyYW1ldGVycyxcclxuICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBpZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBjb21tYVBvc2l0aW9uczogY29tbWFQb3NpdGlvbnMsXHJcbiAgICAgICAgICAgICAgICAgICAgcmlnaHRCcmFja2V0UG9zaXRpb246IHJpZ2h0QnJhY2tldFBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5wb3MgPT0gcG9zKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpOyAvLyBpbiBjYXNlIG9mIHBhcnNpbmctZW1lcmdlbmN5XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnR0ID09IFRva2VuVHlwZS5zZW1pY29sb24pIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlQ2xhc3NCb2R5KGNsYXNzVHlwZTogVG9rZW5UeXBlLCBjbGFzc05hbWU6IHN0cmluZyk6IHsgbWV0aG9kczogTWV0aG9kRGVjbGFyYXRpb25Ob2RlW10sIGF0dHJpYnV0ZXM6IEF0dHJpYnV0ZURlY2xhcmF0aW9uTm9kZVtdIH0ge1xyXG5cclxuICAgICAgICAvLyBBc3N1bXB0aW9uOiB7IGlzIGFscmVhZHkgY29uc3VtZWRcclxuXHJcbiAgICAgICAgbGV0IG1ldGhvZHM6IE1ldGhvZERlY2xhcmF0aW9uTm9kZVtdID0gW107XHJcbiAgICAgICAgbGV0IGF0dHJpYnV0ZXM6IEF0dHJpYnV0ZURlY2xhcmF0aW9uTm9kZVtdID0gW107XHJcblxyXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy50dCA9PSBUb2tlblR5cGUucmlnaHRDdXJseUJyYWNrZXQgfHwgdGhpcy50dCA9PSBUb2tlblR5cGUuZW5kb2ZTb3VyY2Vjb2RlKSB7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGNvbW1lbnRCZWZvcmU6IFRva2VuID0gdGhpcy5jY3QuY29tbWVudEJlZm9yZTtcclxuXHJcbiAgICAgICAgICAgIGxldCBhbm5vdGF0aW9uID0gbnVsbDtcclxuICAgICAgICAgICAgaWYodGhpcy50dCA9PSBUb2tlblR5cGUuYXQpe1xyXG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbiA9IHRoaXMuY2N0LnZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCBtb2RpZmllcnMgPSB0aGlzLmNvbGxlY3RNb2RpZmllcnMoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBpc0NvbnN0cnVjdG9yID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGxldCBwb3NpdGlvbiA9IHRoaXMuZ2V0Q3VycmVudFBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy50dCA9PSBUb2tlblR5cGUuaWRlbnRpZmllciAmJiA8c3RyaW5nPnRoaXMuY2N0LnZhbHVlID09IGNsYXNzTmFtZSAmJiB0aGlzLmN0WzFdLnR0ID09IFRva2VuVHlwZS5sZWZ0QnJhY2tldCkge1xyXG4gICAgICAgICAgICAgICAgaXNDb25zdHJ1Y3RvciA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCB0eXBlID0gdGhpcy5wYXJzZVR5cGUoKTtcclxuXHJcbiAgICAgICAgICAgIGlmKGlzQ29uc3RydWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIHR5cGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogXCJ2b2lkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJyYXlEaW1lbnNpb246IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHR5cGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnR5cGVcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGlzQ29uc3RydWN0b3IgfHwgdGhpcy5leHBlY3QoVG9rZW5UeXBlLmlkZW50aWZpZXIsIGZhbHNlKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBpZGVudGlmaWVyID0gY2xhc3NOYW1lO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghaXNDb25zdHJ1Y3Rvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllciA9IDxzdHJpbmc+dGhpcy5jY3QudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50dCA9PSBUb2tlblR5cGUubGVmdEJyYWNrZXQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzQ29uc3RydWN0b3IgJiYgY2xhc3NUeXBlID09IFRva2VuVHlwZS5rZXl3b3JkRW51bSAmJiBtb2RpZmllcnMudmlzaWJpbGl0eSAhPSBWaXNpYmlsaXR5LnByaXZhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJLb25zdHJ1a3RvcmVuIGluIGVudW1zIG3DvHNzZW4gcHJpdmF0ZSBzZWluLlwiLCBcImVycm9yXCIsIHBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwYXJhbWV0ZXJzOiBQYXJhbWV0ZXJOb2RlW10gPSB0aGlzLnBhcnNlTWV0aG9kRGVjbGFyYXRpb25QYXJhbWV0ZXJzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBzdGF0ZW1lbnRzOiBBU1ROb2RlW107XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNjb3BlRnJvbTogVGV4dFBvc2l0aW9uID0gdGhpcy5nZXRDdXJyZW50UG9zaXRpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2NvcGVUbzogVGV4dFBvc2l0aW9uID0gc2NvcGVGcm9tO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAobW9kaWZpZXJzLmlzQWJzdHJhY3QpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLnNlbWljb2xvbiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc0NvbnN0cnVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkVpbiBLb25zdHJ1a3RvciBrYW5uIG5pY2h0IGFic3RyYWt0IHNlaW4uXCIsIFwiZXJyb3JcIiwgcG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudHMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZUZyb20gPSB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZVRvID0gdGhpcy5nZXRFbmRPZkN1cnJlbnRUb2tlbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdGVtZW50cyAhPSBudWxsICYmIHN0YXRlbWVudHMubGVuZ3RoID4gMCAmJiBzdGF0ZW1lbnRzWzBdLnR5cGUgPT0gVG9rZW5UeXBlLnNjb3BlTm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNjb3BlTm9kZSA9IDxTY29wZU5vZGU+c3RhdGVtZW50c1swXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlRnJvbSA9IHNjb3BlTm9kZS5wb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlVG8gPSBzY29wZU5vZGUucG9zaXRpb25UbztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5tZXRob2REZWNsYXJhdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogaWRlbnRpZmllcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZUZyb206IHNjb3BlRnJvbSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVUbzogc2NvcGVUbyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyczogcGFyYW1ldGVycyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVtZW50czogc3RhdGVtZW50cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogbW9kaWZpZXJzLnZpc2liaWxpdHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQWJzdHJhY3Q6IG1vZGlmaWVycy5pc0Fic3RyYWN0IHx8IGNsYXNzVHlwZSA9PSBUb2tlblR5cGUua2V5d29yZEludGVyZmFjZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNTdGF0aWM6IG1vZGlmaWVycy5pc1N0YXRpYyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNDb25zdHJ1Y3RvcjogaXNDb25zdHJ1Y3RvcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuVHlwZTogdHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYW5ub3RhdGlvbjogYW5ub3RhdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNUcmFuc2llbnQ6IG1vZGlmaWVycy5pc1RyYW5zaWVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudEJlZm9yZTogY29tbWVudEJlZm9yZVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpZGVudGlmaWVyID09IGNsYXNzTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkRhcyBBdHRyaWJ1dCBcIiArIGNsYXNzTmFtZSArIFwiIGRhcmYgbmljaHQgZGVuc2VsYmVuIEJlemVpY2huZXIgaGFiZW4gd2llIGRpZSBLbGFzc2UuXCIsIFwiZXJyb3JcIiwgcG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGluaXRpYWxpemF0aW9uOiBUZXJtTm9kZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnR0ID09IFRva2VuVHlwZS5hc3NpZ25tZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZS5hcnJheURpbWVuc2lvbiA+IDAgJiYgdGhpcy50dCA9PSBUb2tlblR5cGUubGVmdEN1cmx5QnJhY2tldCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbGl6YXRpb24gPSB0aGlzLnBhcnNlQXJyYXlMaXRlcmFsKHR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbGl6YXRpb24gPSB0aGlzLnBhcnNlVGVybSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuc2VtaWNvbG9uKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmF0dHJpYnV0ZURlY2xhcmF0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBpZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVR5cGU6IHR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzU3RhdGljOiBtb2RpZmllcnMuaXNTdGF0aWMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzRmluYWw6IG1vZGlmaWVycy5pc0ZpbmFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5OiBtb2RpZmllcnMudmlzaWJpbGl0eSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbGl6YXRpb246IGluaXRpYWxpemF0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbm5vdGF0aW9uOiBhbm5vdGF0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpc1RyYW5zaWVudDogbW9kaWZpZXJzLmlzVHJhbnNpZW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50QmVmb3JlOiBjb21tZW50QmVmb3JlXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjbGFzc1R5cGUgPT0gVG9rZW5UeXBlLmtleXdvcmRJbnRlcmZhY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJJbnRlcmZhY2VzIGTDvHJmZW4ga2VpbmUgQXR0cmlidXRlIGVudGhhbHRlbi5cIiwgXCJlcnJvclwiLCBwb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7IG1ldGhvZHM6IG1ldGhvZHMsIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXMgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBwYXJzZU1ldGhvZERlY2xhcmF0aW9uUGFyYW1ldGVycygpOiBQYXJhbWV0ZXJOb2RlW10ge1xyXG5cclxuICAgICAgICAvLyBBc3N1bXB0aW9uOiBuZXh0IHRva2VuIGlzIChcclxuICAgICAgICBsZXQgcGFyYW1ldGVyczogUGFyYW1ldGVyTm9kZVtdID0gW107XHJcbiAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMudHQgPT0gVG9rZW5UeXBlLnJpZ2h0QnJhY2tldCkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZWxsaXBzaXMgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgICAgICAgaWYgKGVsbGlwc2lzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIk51ciBkZXIgbGV0enRlIFBhcmFtZXRlciBkYXJmIGFscyBFbGxpcHNpcyAoLi4uKSBkZWZpbmllcnQgd2VyZGVuLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgaXNGaW5hbCA9IHRoaXMudHQgPT0gVG9rZW5UeXBlLmtleXdvcmRGaW5hbDtcclxuXHJcbiAgICAgICAgICAgIGlmIChpc0ZpbmFsKSB0aGlzLm5leHRUb2tlbigpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHR5cGU6IFR5cGVOb2RlID0gdGhpcy5wYXJzZVR5cGUoKTtcclxuXHJcbiAgICAgICAgICAgIGVsbGlwc2lzID0gdGhpcy50dCA9PSBUb2tlblR5cGUuZWxsaXBzaXM7XHJcbiAgICAgICAgICAgIGlmIChlbGxpcHNpcykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICAgICAgICAgIHR5cGUuYXJyYXlEaW1lbnNpb24rKztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuZXhwZWN0KFRva2VuVHlwZS5pZGVudGlmaWVyLCBmYWxzZSkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBpZGVudGlmaWVyID0gPHN0cmluZz50aGlzLmNjdC52YWx1ZTtcclxuICAgICAgICAgICAgICAgIHBhcmFtZXRlcnMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnBhcmFtZXRlckRlY2xhcmF0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmdldEN1cnJlbnRQb3NpdGlvbigpLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IGlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyVHlwZTogdHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBpc0ZpbmFsOiBpc0ZpbmFsLFxyXG4gICAgICAgICAgICAgICAgICAgIGlzRWxsaXBzaXM6IGVsbGlwc2lzXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMudHQgIT0gVG9rZW5UeXBlLmNvbW1hKSB7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpOyAvLyBjb25zdW1lIGNvbW1hXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUucmlnaHRCcmFja2V0LCB0cnVlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHBhcmFtZXRlcnM7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHBhcnNlRXh0ZW5kc0ltcGxlbWVudHMoaXNJbnRlcmZhY2U6IGJvb2xlYW4pOiB7IGV4dGVuZHM6IFR5cGVOb2RlLCBpbXBsZW1lbnRzOiBUeXBlTm9kZVtdIH0ge1xyXG5cclxuICAgICAgICBsZXQgc2V4dGVuZHM6IFR5cGVOb2RlID0gbnVsbDtcclxuICAgICAgICBsZXQgc2ltcGxlbWVudHM6IFR5cGVOb2RlW10gPSBbXTtcclxuXHJcbiAgICAgICAgd2hpbGUodGhpcy5jb21lc1Rva2VuKFtUb2tlblR5cGUua2V5d29yZEV4dGVuZHMsIFRva2VuVHlwZS5rZXl3b3JkSW1wbGVtZW50c10pKXtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY29tZXNUb2tlbihUb2tlblR5cGUua2V5d29yZEV4dGVuZHMpICYmICFpc0ludGVyZmFjZSkge1xyXG4gICAgICAgICAgICAgICAgaWYoc2V4dGVuZHMgIT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJFaW5lIEtsYXNzZSBrYW5uIG5pY2h0IFVudGVya2xhc3NlIHZvbiB6d2VpIGFuZGVyZW4gS2xhc3NlbiBzZWluLCBlcyBkYXJmIGFsc28gaGllciBudXIgZWluIE1hbCAnZXh0ZW5kcy4uLicgc3RlaGVuLlwiLCBcImVycm9yXCIsIHNleHRlbmRzLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7IC8vIHNraXAgZXh0ZW5kc1xyXG4gICAgICAgICAgICAgICAgc2V4dGVuZHMgPSB0aGlzLnBhcnNlVHlwZSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNleHRlbmRzICE9IG51bGwgJiYgc2V4dGVuZHMuYXJyYXlEaW1lbnNpb24gPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoRXJyb3IoXCJEZXIgRGF0ZW50eXAgZGVyIEJhc2lza2xhc3NlIGRhcmYga2VpbiBBcnJheSBzZWluLlwiLCBcImVycm9yXCIsIHNleHRlbmRzLnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgICAgIGlmICgoIWlzSW50ZXJmYWNlICYmIHRoaXMuY29tZXNUb2tlbihUb2tlblR5cGUua2V5d29yZEltcGxlbWVudHMpKSB8fCAoaXNJbnRlcmZhY2UgJiYgdGhpcy5jb21lc1Rva2VuKFRva2VuVHlwZS5rZXl3b3JkRXh0ZW5kcykpKSB7XHJcbiAgICAgICAgICAgICAgICBpZihzaW1wbGVtZW50cy5sZW5ndGggPiAwKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2hFcnJvcihcIkVzIGRhcmYgaGllciBudXIgZWluIE1hbCAnaW1wbGVtZW50cycgc3RlaGVuLCBoaW50ZXIgJ2ltcGxlbWVudHMnIGlzdCBhYmVyIGVpbmUga29tbWFzZXBhcmllcnRlIExpc3RlIHZvbiBJbnRlcmZhY2VzIGVybGF1YnQuXCIsIFwid2FybmluZ1wiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7IC8vIFNraXAgaW1wbGVtZW50cy9leHRlbmRzXHJcbiAgICAgICAgICAgICAgICBsZXQgZmlyc3QgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKChmaXJzdCAmJiB0aGlzLnR0ID09IFRva2VuVHlwZS5pZGVudGlmaWVyKSB8fCAoIWZpcnN0ICYmIHRoaXMudHQgPT0gVG9rZW5UeXBlLmNvbW1hKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlyc3QpIHRoaXMubmV4dFRva2VuKCk7IC8vIHNraXAgY29tbWFcclxuICAgICAgICAgICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHNpbXBsZW1lbnRzLnB1c2godGhpcy5wYXJzZVR5cGUoKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNpbXBsZW1lbnRzLmZvckVhY2goKGltKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChpbS5hcnJheURpbWVuc2lvbiA+IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucHVzaEVycm9yKGltLmlkZW50aWZpZXIgKyBcIltdIGlzdCBrZWluIEludGVyZmFjZSwgc29uZGVybiBlaW4gQXJyYXkuIEFycmF5LURhdGVudHlwZW4gc2luZCBoaWVyIG5pY2h0IGVybGF1YnQuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGV4dGVuZHM6IHNleHRlbmRzLCBpbXBsZW1lbnRzOiBzaW1wbGVtZW50c1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwYXJzZVR5cGVQYXJhbWV0ZXJCb3VuZHMoKTogeyBleHRlbmRzOiBUeXBlTm9kZSwgaW1wbGVtZW50czogVHlwZU5vZGVbXSB9IHtcclxuXHJcbiAgICAgICAgbGV0IHNleHRlbmRzOiBUeXBlTm9kZSA9IG51bGw7XHJcbiAgICAgICAgbGV0IHNpbXBsZW1lbnRzOiBUeXBlTm9kZVtdID0gW107XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmNvbWVzVG9rZW4oVG9rZW5UeXBlLmtleXdvcmRFeHRlbmRzKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpOyAvLyBza2lwIGV4dGVuZHNcclxuICAgICAgICAgICAgc2V4dGVuZHMgPSB0aGlzLnBhcnNlVHlwZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2hpbGUgKHRoaXMuY29tZXNUb2tlbihUb2tlblR5cGUuYW1wZXJzYW5kKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpOyAvLyBTa2lwIGFtcGVyc2FuZFxyXG4gICAgICAgICAgICBzaW1wbGVtZW50cy5wdXNoKHRoaXMucGFyc2VUeXBlKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZXh0ZW5kczogc2V4dGVuZHMsIGltcGxlbWVudHM6IHNpbXBsZW1lbnRzXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBjb2xsZWN0TW9kaWZpZXJzKCk6IHsgaXNBYnN0cmFjdDogYm9vbGVhbiwgaXNTdGF0aWM6IGJvb2xlYW4sIHZpc2liaWxpdHk6IFZpc2liaWxpdHksIGlzRmluYWw6IGJvb2xlYW4sIGlzVHJhbnNpZW50OiBib29sZWFuIH0ge1xyXG5cclxuICAgICAgICBsZXQgdmlzaWJpbGl0eSA9IFZpc2liaWxpdHkucHVibGljO1xyXG4gICAgICAgIGxldCBpc0Fic3RyYWN0ID0gZmFsc2U7XHJcbiAgICAgICAgbGV0IGlzU3RhdGljID0gZmFsc2U7XHJcbiAgICAgICAgbGV0IGlzRmluYWwgPSBmYWxzZTtcclxuICAgICAgICBsZXQgaXNUcmFuc2llbnQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgbGV0IGRvbmUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgd2hpbGUgKCFkb25lKSB7XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2ggKHRoaXMudHQpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmRQdWJsaWM6XHJcbiAgICAgICAgICAgICAgICAgICAgdmlzaWJpbGl0eSA9IFZpc2liaWxpdHkucHVibGljO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkUHJpdmF0ZTpcclxuICAgICAgICAgICAgICAgICAgICB2aXNpYmlsaXR5ID0gVmlzaWJpbGl0eS5wcml2YXRlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkUHJvdGVjdGVkOlxyXG4gICAgICAgICAgICAgICAgICAgIHZpc2liaWxpdHkgPSBWaXNpYmlsaXR5LnByb3RlY3RlZDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZFN0YXRpYzpcclxuICAgICAgICAgICAgICAgICAgICBpc1N0YXRpYyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0VG9rZW4oKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmRBYnN0cmFjdDpcclxuICAgICAgICAgICAgICAgICAgICBpc0Fic3RyYWN0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZEZpbmFsOlxyXG4gICAgICAgICAgICAgICAgICAgIGlzRmluYWwgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dFRva2VuKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkVHJhbnNpZW50OlxyXG4gICAgICAgICAgICAgICAgICAgIGlzVHJhbnNpZW50ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHRUb2tlbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZG9uZSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geyBpc0Fic3RyYWN0OiBpc0Fic3RyYWN0LCBpc1N0YXRpYzogaXNTdGF0aWMsIHZpc2liaWxpdHk6IHZpc2liaWxpdHksIGlzRmluYWw6IGlzRmluYWwsIGlzVHJhbnNpZW50OiBpc1RyYW5zaWVudCB9O1xyXG5cclxuICAgIH1cclxuXHJcblxyXG59Il19