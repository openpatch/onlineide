import { Lexer } from "../../compiler/lexer/Lexer.js";
import { TokenType } from "../../compiler/lexer/Token.js";
export class Formatter {
    constructor(
    // private main: Main
    ) {
        this.autoFormatTriggerCharacters = ['\n'];
        this.displayName = "Java-Autoformat";
    }
    init() {
        monaco.languages.registerDocumentFormattingEditProvider('myJava', this);
        monaco.languages.registerOnTypeFormattingEditProvider('myJava', this);
    }
    provideOnTypeFormattingEdits(model, position, ch, options, token) {
        let edits = this.format(model);
        return Promise.resolve(edits);
    }
    deleteOverlappingRanges(edits) {
        for (let i = 0; i < edits.length - 1; i++) {
            let e = edits[i];
            let e1 = edits[i + 1];
            if (e.range.endLineNumber < e1.range.startLineNumber)
                continue;
            if (e.range.endLineNumber == e1.range.startLineNumber) {
                if (e.range.endColumn >= e1.range.startColumn) {
                    edits.splice(i + 1, 1);
                }
                else {
                    if (e.range.endColumn == 0 && e.text.length > 0 && e1.range.startColumn == 1 && e1.range.endColumn > e1.range.startColumn && e1.text == "") {
                        let delta = e.text.length - (e1.range.endColumn - e1.range.startColumn);
                        if (delta > 0) {
                            e.text = e.text.substr(0, delta);
                            edits.splice(i + 1, 1);
                        }
                        else if (delta < 0) {
                            //@ts-ignore
                            e1.range.endColumn = e1.range.startColumn - delta;
                            edits.splice(i, 1);
                            i--;
                        }
                        else {
                            edits.splice(i, 2);
                            i--;
                        }
                    }
                }
            }
        }
    }
    provideDocumentFormattingEdits(model, options, token) {
        let edits = this.format(model);
        return Promise.resolve(edits);
    }
    format(model) {
        let edits = [];
        // if (this.main.currentWorkspace == null || this.main.currentWorkspace.currentlyOpenModule == null) {
        //     return [];
        // }
        // let text = this.main.monaco_editor.getValue({ preserveBOM: false, lineEnding: "\n" });
        let text = model.getValue(monaco.editor.EndOfLinePreference.LF);
        let tokenlist = new Lexer().lex(text).tokens;
        // let tokenlist = this.main.currentWorkspace.currentlyOpenModule.tokenList;
        if (tokenlist == null)
            return [];
        // TODO:
        // { at the end of line, with one space before; followed only by spaces and \n
        // indent lines according to { and }
        // Beware: int i[] = { ... }
        // exactly one space before/after binary operators
        // no space after ( and no space before )
        // (   ) -> ()
        // (  ()) -> (())
        // (()  ) -> (())
        let lastNonSpaceToken = null;
        let indentLevel = 0;
        let tabSize = 3;
        let curlyBracesOpenAtLines = [];
        let indentLevelAtSwitchStatements = [];
        let switchHappend = false;
        let lastTokenWasNewLine = 0;
        let roundBracketsOpen = 0;
        for (let i = 0; i < tokenlist.length; i++) {
            let t = tokenlist[i];
            lastTokenWasNewLine--;
            switch (t.tt) {
                case TokenType.keywordSwitch:
                    switchHappend = true;
                    break;
                case TokenType.keywordCase:
                    // outdent: line with case:
                    if (t.position.column > 3) {
                        this.deleteSpaces(edits, t.position.line, 1, 3);
                    }
                    break;
                case TokenType.leftCurlyBracket:
                    if (switchHappend) {
                        switchHappend = false;
                        indentLevelAtSwitchStatements.push(indentLevel + 2);
                        indentLevel++;
                    }
                    indentLevel++;
                    curlyBracesOpenAtLines.push(t.position.line);
                    if (lastNonSpaceToken != null) {
                        let tt = lastNonSpaceToken.tt;
                        if (tt == TokenType.rightBracket || tt == TokenType.identifier || tt == TokenType.leftRightSquareBracket) {
                            this.replaceBetween(lastNonSpaceToken, t, edits, " ");
                        }
                    }
                    if (i < tokenlist.length - 1) {
                        let token1 = tokenlist[i + 1];
                        if (token1.tt != TokenType.newline && token1.tt != TokenType.space) {
                            this.insertSpaces(edits, token1.position.line, token1.position.column, 1);
                        }
                    }
                    break;
                case TokenType.rightCurlyBracket:
                    if (indentLevelAtSwitchStatements[indentLevelAtSwitchStatements.length - 1] == indentLevel) {
                        indentLevelAtSwitchStatements.pop();
                        indentLevel--;
                        // if(t.position.column >= 3){
                        this.deleteSpaces(edits, t.position.line, 1, 3);
                        // }    
                    }
                    indentLevel--;
                    let openedAtLine = curlyBracesOpenAtLines.pop();
                    if (openedAtLine != null && openedAtLine != t.position.line) {
                        if (lastNonSpaceToken != null && lastNonSpaceToken.position.line == t.position.line) {
                            this.replace(edits, t.position, t.position, "\n" + " ".repeat(indentLevel * tabSize));
                        }
                    }
                    else {
                        if (i > 0) {
                            let token1 = tokenlist[i - 1];
                            if (token1.tt != TokenType.space && token1.tt != TokenType.newline) {
                                this.insertSpaces(edits, t.position.line, t.position.column, 1);
                            }
                        }
                    }
                    break;
                case TokenType.leftBracket:
                    roundBracketsOpen++;
                    if (i < tokenlist.length - 2) {
                        let nextToken1 = tokenlist[i + 1];
                        let nextToken2 = tokenlist[i + 2];
                        if (nextToken1.tt == TokenType.space && nextToken2.tt != TokenType.newline) {
                            this.deleteSpaces(edits, nextToken1.position.line, nextToken1.position.column, nextToken1.position.length);
                            i++;
                            if (nextToken2.tt == TokenType.rightBracket) {
                                i++;
                                roundBracketsOpen--;
                            }
                        }
                    }
                    if (i > 1) {
                        let lastToken1 = tokenlist[i - 1];
                        let lastToken2 = tokenlist[i - 2];
                        if (lastToken1.tt == TokenType.space && lastToken2.tt != TokenType.newline && !this.isBinaryOperator(lastToken2.tt)) {
                            if (lastToken1.position.length == 1) {
                                this.deleteSpaces(edits, lastToken1.position.line, lastToken1.position.column, 1);
                            }
                        }
                    }
                    break;
                case TokenType.rightBracket:
                    roundBracketsOpen--;
                    if (i > 1) {
                        let nextToken1 = tokenlist[i - 1];
                        let nextToken2 = tokenlist[i - 2];
                        if (nextToken1.tt == TokenType.space && nextToken2.tt != TokenType.newline) {
                            this.deleteSpaces(edits, nextToken1.position.line, nextToken1.position.column, nextToken1.position.length);
                        }
                    }
                    break;
                case TokenType.newline:
                    lastTokenWasNewLine = 2;
                    if (i < tokenlist.length - 2) {
                        let lastTokenIsOperator = this.isBinaryOperator(lastNonSpaceToken === null || lastNonSpaceToken === void 0 ? void 0 : lastNonSpaceToken.tt);
                        let nextTokenIsOperator = this.isBinaryOperator(this.getNextNonSpaceToken(i, tokenlist).tt);
                        let beginNextLine = tokenlist[i + 1];
                        let token2 = tokenlist[i + 2];
                        let currentIndentation = 0;
                        if (beginNextLine.tt == TokenType.newline) {
                            break;
                        }
                        let delta = 0;
                        if (beginNextLine.tt == TokenType.space) {
                            if (token2.tt == TokenType.newline) {
                                break;
                            }
                            currentIndentation = beginNextLine.position.length;
                            i++;
                            if (token2.tt == TokenType.rightCurlyBracket) {
                                delta = -1;
                            }
                        }
                        if (beginNextLine.tt == TokenType.rightCurlyBracket) {
                            delta = -1;
                            // indentLevel--;
                            // curlyBracesOpenAtLines.pop();
                            // lastNonSpaceToken = beginNextLine;
                            // i++;
                        }
                        if (nextTokenIsOperator || lastTokenIsOperator)
                            delta = 1;
                        let il = indentLevel + delta;
                        if (roundBracketsOpen > 0) {
                            il++;
                        }
                        if (il < 0)
                            il = 0;
                        let correctIndentation = il * tabSize;
                        if (correctIndentation > currentIndentation) {
                            this.insertSpaces(edits, t.position.line + 1, 0, correctIndentation - currentIndentation);
                        }
                        else if (correctIndentation < currentIndentation) {
                            this.deleteSpaces(edits, t.position.line + 1, 0, currentIndentation - correctIndentation);
                        }
                    }
                    break;
                case TokenType.space:
                    if (i < tokenlist.length - 1) {
                        let nextToken = tokenlist[i + 1];
                        if (nextToken.tt != TokenType.comment) {
                            if (i > 0) {
                                let lastToken = tokenlist[i - 1];
                                if (lastToken.tt != TokenType.newline) {
                                    if (t.position.length > 1) {
                                        this.deleteSpaces(edits, t.position.line, t.position.column, t.position.length - 1);
                                    }
                                }
                            }
                        }
                    }
                    break;
                case TokenType.comma:
                case TokenType.semicolon:
                    if (i > 1) {
                        let lastToken1 = tokenlist[i - 1];
                        let lastToken2 = tokenlist[i - 2];
                        if (lastToken1.tt != TokenType.newline && lastToken2.tt != TokenType.newline && !this.isBinaryOperator(lastToken2.tt)) {
                            if (lastToken1.tt == TokenType.space && lastToken1.position.length == 1) {
                                this.deleteSpaces(edits, lastToken1.position.line, lastToken1.position.column, 1);
                            }
                        }
                    }
                    if (i < tokenlist.length - 1) {
                        let nextToken = tokenlist[i + 1];
                        if (nextToken.tt != TokenType.comment && nextToken.tt != TokenType.space && nextToken.tt != TokenType.newline) {
                            this.insertSpaces(edits, nextToken.position.line, nextToken.position.column, 1);
                        }
                    }
                    break;
                case TokenType.rightSquareBracket:
                    if (lastNonSpaceToken != null && lastNonSpaceToken.tt == TokenType.leftSquareBracket) {
                        this.replaceBetween(lastNonSpaceToken, t, edits, "");
                    }
                    break;
            }
            // binary operator?
            if (this.isBinaryOperator(t.tt)) {
                let lowerGeneric = t.tt == TokenType.lower && this.lowerBelongsToGenericExpression(i, tokenlist);
                let greaterGeneric = t.tt == TokenType.greater && this.greaterBelongsToGenericExpression(i, tokenlist);
                if (lastTokenWasNewLine <= 0 && lastNonSpaceToken != null && [TokenType.leftBracket, TokenType.assignment, TokenType.comma].indexOf(lastNonSpaceToken.tt) < 0) {
                    if (i > 0) {
                        let tokenBefore = tokenlist[i - 1];
                        let spaces = (lowerGeneric || greaterGeneric) ? 0 : 1;
                        if (tokenBefore.tt == TokenType.space) {
                            if (tokenBefore.position.length != spaces) {
                                this.insertSpaces(edits, tokenBefore.position.line, tokenBefore.position.column, spaces - tokenBefore.position.length);
                            }
                        }
                        else {
                            if (spaces == 1)
                                this.insertSpaces(edits, t.position.line, t.position.column, 1);
                        }
                    }
                    if (i < tokenlist.length - 1) {
                        let nextToken = tokenlist[i + 1];
                        let spaces = (lowerGeneric) ? 0 : 1;
                        if (nextToken.tt == TokenType.space) {
                            if (greaterGeneric && i < tokenlist.length - 2 && tokenlist[i + 2].tt == TokenType.leftBracket) {
                                spaces = 0;
                            }
                            if (nextToken.position.length != spaces) {
                                this.insertSpaces(edits, nextToken.position.line, nextToken.position.column, spaces - nextToken.position.length);
                            }
                        }
                        else {
                            if (greaterGeneric && nextToken.tt == TokenType.leftBracket) {
                                spaces = 0;
                            }
                            if (spaces == 1)
                                this.insertSpaces(edits, nextToken.position.line, nextToken.position.column, 1);
                        }
                    }
                }
            }
            if (t.tt != TokenType.space && t.tt != TokenType.newline) {
                lastNonSpaceToken = t;
            }
        }
        this.deleteOverlappingRanges(edits);
        return edits;
    }
    getNextNonSpaceToken(currentIndex, tokenlist) {
        if (currentIndex == tokenlist.length - 1)
            return tokenlist[currentIndex];
        let j = currentIndex + 1;
        while (j < tokenlist.length - 1 && (tokenlist[j].tt == TokenType.space || tokenlist[j].tt == TokenType.return)) {
            j++;
        }
        return tokenlist[j];
    }
    lowerBelongsToGenericExpression(position, tokenlist) {
        let i = position + 1;
        while (i < tokenlist.length) {
            let tt = tokenlist[i].tt;
            if (tt == TokenType.greater) {
                return true;
            }
            if ([TokenType.space, TokenType.comma, TokenType.identifier].indexOf(tt) < 0) {
                return false;
            }
            i++;
        }
        return false;
    }
    greaterBelongsToGenericExpression(position, tokenlist) {
        let i = position - 1;
        while (i >= 0) {
            let tt = tokenlist[i].tt;
            if (tt == TokenType.lower) {
                return true;
            }
            if ([TokenType.space, TokenType.comma, TokenType.identifier].indexOf(tt) < 0) {
                return false;
            }
            i--;
        }
        return false;
    }
    isBinaryOperator(token) {
        return token != null && token >= TokenType.modulo && token <= TokenType.colon;
    }
    replaceBetween(lastNonSpaceToken, t, edits, text) {
        let positionFrom = {
            line: lastNonSpaceToken.position.line,
            column: lastNonSpaceToken.position.column + lastNonSpaceToken.position.length
        };
        let positionTo = {
            line: t.position.line,
            column: t.position.column
        };
        if (positionFrom.line != positionTo.line ||
            positionTo.column - positionFrom.column != text.length) {
            this.replace(edits, positionFrom, positionTo, text);
        }
    }
    deleteSpaces(edits, line, column, numberOfSpaces) {
        edits.push({
            range: {
                startColumn: column,
                startLineNumber: line,
                endColumn: column + numberOfSpaces + (column == 0 ? 1 : 0),
                endLineNumber: line
            },
            text: ""
        });
    }
    insertSpaces(edits, line, column, numberOfSpaces) {
        if (numberOfSpaces < 0) {
            this.deleteSpaces(edits, line, column, -numberOfSpaces);
            return;
        }
        edits.push({
            range: {
                startColumn: column,
                startLineNumber: line,
                endColumn: column,
                endLineNumber: line
            },
            text: " ".repeat(numberOfSpaces)
        });
    }
    replace(edits, positionFrom, positionTo, text) {
        edits.push({
            range: {
                startColumn: positionFrom.column,
                startLineNumber: positionFrom.line,
                endColumn: positionTo.column,
                endLineNumber: positionTo.line
            },
            text: text
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRm9ybWF0dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9Gb3JtYXR0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ3RELE9BQU8sRUFBb0IsU0FBUyxFQUFxQixNQUFNLCtCQUErQixDQUFDO0FBRS9GLE1BQU0sT0FBTyxTQUFTO0lBUWxCO0lBQ0kscUJBQXFCOztRQU56QixnQ0FBMkIsR0FBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRS9DLGdCQUFXLEdBQVksaUJBQWlCLENBQUM7SUFPekMsQ0FBQztJQUVELElBQUk7UUFDQSxNQUFNLENBQUMsU0FBUyxDQUFDLHNDQUFzQyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN4RSxNQUFNLENBQUMsU0FBUyxDQUFDLG9DQUFvQyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMxRSxDQUFDO0lBRUQsNEJBQTRCLENBQUMsS0FBK0IsRUFBRSxRQUF5QixFQUFFLEVBQVUsRUFBRSxPQUEyQyxFQUFFLEtBQStCO1FBRTdLLElBQUksS0FBSyxHQUFnQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRTVELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FDbEIsS0FBSyxDQUNSLENBQUM7SUFFTixDQUFDO0lBQ0QsdUJBQXVCLENBQUMsS0FBa0M7UUFDdEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3ZDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQixJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLElBQUksQ0FBQyxD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QUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUN4RCxPQUFPO1NBQ1Y7UUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDO1lBQ1AsS0FBSyxFQUFFO2dCQUNILFdBQVcsRUFBRSxNQUFNO2dCQUNuQixlQUFlLEVBQUUsSUFBSTtnQkFDckIsU0FBUyxFQUFFLE1BQU07Z0JBQ2pCLGFBQWEsRUFBRSxJQUFJO2FBQ3RCO1lBQ0QsSUFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDO1NBQ25DLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxPQUFPLENBQUMsS0FBa0MsRUFBRSxZQUErQyxFQUFFLFVBQTZDLEVBQUUsSUFBWTtRQUVwSixLQUFLLENBQUMsSUFBSSxDQUFDO1lBQ1AsS0FBSyxFQUFFO2dCQUNILFdBQVcsRUFBRSxZQUFZLENBQUMsTUFBTTtnQkFDaEMsZUFBZSxFQUFFLFlBQVksQ0FBQyxJQUFJO2dCQUNsQyxTQUFTLEVBQUUsVUFBVSxDQUFDLE1BQU07Z0JBQzVCLGFBQWEsRUFBRSxVQUFVLENBQUMsSUFBSTthQUNqQztZQUNELElBQUksRUFBRSxJQUFJO1NBQ2IsQ0FBQyxDQUFDO0lBRVAsQ0FBQztDQU9KIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTGV4ZXIgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvbGV4ZXIvTGV4ZXIuanNcIjtcclxuaW1wb3J0IHsgVG9rZW4sIFRva2VuTGlzdCwgVG9rZW5UeXBlLCB0b2tlbkxpc3RUb1N0cmluZyB9IGZyb20gXCIuLi8uLi9jb21waWxlci9sZXhlci9Ub2tlbi5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEZvcm1hdHRlciBpbXBsZW1lbnRzIG1vbmFjby5sYW5ndWFnZXMuRG9jdW1lbnRGb3JtYXR0aW5nRWRpdFByb3ZpZGVyLFxyXG4gICAgbW9uYWNvLmxhbmd1YWdlcy5PblR5cGVGb3JtYXR0aW5nRWRpdFByb3ZpZGVyIHtcclxuXHJcbiAgICBhdXRvRm9ybWF0VHJpZ2dlckNoYXJhY3RlcnM6IHN0cmluZ1tdID0gWydcXG4nXTtcclxuXHJcbiAgICBkaXNwbGF5TmFtZT86IHN0cmluZyA9IFwiSmF2YS1BdXRvZm9ybWF0XCI7XHJcblxyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIC8vIHByaXZhdGUgbWFpbjogTWFpblxyXG4gICAgKSB7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGluaXQoKSB7XHJcbiAgICAgICAgbW9uYWNvLmxhbmd1YWdlcy5yZWdpc3RlckRvY3VtZW50Rm9ybWF0dGluZ0VkaXRQcm92aWRlcignbXlKYXZhJywgdGhpcyk7XHJcbiAgICAgICAgbW9uYWNvLmxhbmd1YWdlcy5yZWdpc3Rlck9uVHlwZUZvcm1hdHRpbmdFZGl0UHJvdmlkZXIoJ215SmF2YScsIHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHByb3ZpZGVPblR5cGVGb3JtYXR0aW5nRWRpdHMobW9kZWw6IG1vbmFjby5lZGl0b3IuSVRleHRNb2RlbCwgcG9zaXRpb246IG1vbmFjby5Qb3NpdGlvbiwgY2g6IHN0cmluZywgb3B0aW9uczogbW9uYWNvLmxhbmd1YWdlcy5Gb3JtYXR0aW5nT3B0aW9ucywgdG9rZW46IG1vbmFjby5DYW5jZWxsYXRpb25Ub2tlbik6IG1vbmFjby5sYW5ndWFnZXMuUHJvdmlkZXJSZXN1bHQ8bW9uYWNvLmxhbmd1YWdlcy5UZXh0RWRpdFtdPiB7XHJcblxyXG4gICAgICAgIGxldCBlZGl0czogbW9uYWNvLmxhbmd1YWdlcy5UZXh0RWRpdFtdID0gdGhpcy5mb3JtYXQobW9kZWwpO1xyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxyXG4gICAgICAgICAgICBlZGl0c1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgfVxyXG4gICAgZGVsZXRlT3ZlcmxhcHBpbmdSYW5nZXMoZWRpdHM6IG1vbmFjby5sYW5ndWFnZXMuVGV4dEVkaXRbXSkge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWRpdHMubGVuZ3RoIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBlID0gZWRpdHNbaV07XHJcbiAgICAgICAgICAgIGxldCBlMSA9IGVkaXRzW2kgKyAxXTtcclxuICAgICAgICAgICAgaWYgKGUucmFuZ2UuZW5kTGluZU51bWJlciA8IGUxLnJhbmdlLnN0YXJ0TGluZU51bWJlcikgY29udGludWU7XHJcbiAgICAgICAgICAgIGlmIChlLnJhbmdlLmVuZExpbmVOdW1iZXIgPT0gZTEucmFuZ2Uuc3RhcnRMaW5lTnVtYmVyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZS5yYW5nZS5lbmRDb2x1bW4gPj0gZTEucmFuZ2Uuc3RhcnRDb2x1bW4pIHtcclxuICAgICAgICAgICAgICAgICAgICBlZGl0cy5zcGxpY2UoaSArIDEsIDEpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZS5yYW5nZS5lbmRDb2x1bW4gPT0gMCAmJiBlLnRleHQubGVuZ3RoID4gMCAmJiBlMS5yYW5nZS5zdGFydENvbHVtbiA9PSAxICYmIGUxLnJhbmdlLmVuZENvbHVtbiA+IGUxLnJhbmdlLnN0YXJ0Q29sdW1uICYmIGUxLnRleHQgPT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZGVsdGEgPSBlLnRleHQubGVuZ3RoIC0gKGUxLnJhbmdlLmVuZENvbHVtbiAtIGUxLnJhbmdlLnN0YXJ0Q29sdW1uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlbHRhID4gMCkgeyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUudGV4dCA9IGUudGV4dC5zdWJzdHIoMCwgZGVsdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdHMuc3BsaWNlKGkrMSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZGVsdGEgPCAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlMS5yYW5nZS5lbmRDb2x1bW4gPSBlMS5yYW5nZS5zdGFydENvbHVtbiAtIGRlbHRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdHMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaS0tO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0cy5zcGxpY2UoaSwgMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpLS07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByb3ZpZGVEb2N1bWVudEZvcm1hdHRpbmdFZGl0cyhtb2RlbDogbW9uYWNvLmVkaXRvci5JVGV4dE1vZGVsLFxyXG4gICAgICAgIG9wdGlvbnM6IG1vbmFjby5sYW5ndWFnZXMuRm9ybWF0dGluZ09wdGlvbnMsXHJcbiAgICAgICAgdG9rZW46IG1vbmFjby5DYW5jZWxsYXRpb25Ub2tlbik6IG1vbmFjby5sYW5ndWFnZXMuUHJvdmlkZXJSZXN1bHQ8bW9uYWNvLmxhbmd1YWdlcy5UZXh0RWRpdFtdPiB7XHJcblxyXG4gICAgICAgIGxldCBlZGl0czogbW9uYWNvLmxhbmd1YWdlcy5UZXh0RWRpdFtdID0gdGhpcy5mb3JtYXQobW9kZWwpO1xyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxyXG4gICAgICAgICAgICBlZGl0c1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGZvcm1hdChtb2RlbDogbW9uYWNvLmVkaXRvci5JVGV4dE1vZGVsKTogbW9uYWNvLmxhbmd1YWdlcy5UZXh0RWRpdFtdIHtcclxuXHJcbiAgICAgICAgbGV0IGVkaXRzOiBtb25hY28ubGFuZ3VhZ2VzLlRleHRFZGl0W10gPSBbXTtcclxuXHJcbiAgICAgICAgLy8gaWYgKHRoaXMubWFpbi5jdXJyZW50V29ya3NwYWNlID09IG51bGwgfHwgdGhpcy5tYWluLmN1cnJlbnRXb3Jrc3BhY2UuY3VycmVudGx5T3Blbk1vZHVsZSA9PSBudWxsKSB7XHJcbiAgICAgICAgLy8gICAgIHJldHVybiBbXTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIC8vIGxldCB0ZXh0ID0gdGhpcy5tYWluLm1vbmFjb19lZGl0b3IuZ2V0VmFsdWUoeyBwcmVzZXJ2ZUJPTTogZmFsc2UsIGxpbmVFbmRpbmc6IFwiXFxuXCIgfSk7XHJcblxyXG4gICAgICAgIGxldCB0ZXh0ID0gbW9kZWwuZ2V0VmFsdWUobW9uYWNvLmVkaXRvci5FbmRPZkxpbmVQcmVmZXJlbmNlLkxGKTtcclxuXHJcbiAgICAgICAgbGV0IHRva2VubGlzdCA9IG5ldyBMZXhlcigpLmxleCh0ZXh0KS50b2tlbnM7XHJcblxyXG4gICAgICAgIC8vIGxldCB0b2tlbmxpc3QgPSB0aGlzLm1haW4uY3VycmVudFdvcmtzcGFjZS5jdXJyZW50bHlPcGVuTW9kdWxlLnRva2VuTGlzdDtcclxuXHJcbiAgICAgICAgaWYgKHRva2VubGlzdCA9PSBudWxsKSByZXR1cm4gW107XHJcblxyXG4gICAgICAgIC8vIFRPRE86XHJcbiAgICAgICAgLy8geyBhdCB0aGUgZW5kIG9mIGxpbmUsIHdpdGggb25lIHNwYWNlIGJlZm9yZTsgZm9sbG93ZWQgb25seSBieSBzcGFjZXMgYW5kIFxcblxyXG4gICAgICAgIC8vIGluZGVudCBsaW5lcyBhY2NvcmRpbmcgdG8geyBhbmQgfVxyXG4gICAgICAgIC8vIEJld2FyZTogaW50IGlbXSA9IHsgLi4uIH1cclxuICAgICAgICAvLyBleGFjdGx5IG9uZSBzcGFjZSBiZWZvcmUvYWZ0ZXIgYmluYXJ5IG9wZXJhdG9yc1xyXG4gICAgICAgIC8vIG5vIHNwYWNlIGFmdGVyICggYW5kIG5vIHNwYWNlIGJlZm9yZSApXHJcbiAgICAgICAgLy8gKCAgICkgLT4gKClcclxuICAgICAgICAvLyAoICAoKSkgLT4gKCgpKVxyXG4gICAgICAgIC8vICgoKSAgKSAtPiAoKCkpXHJcblxyXG4gICAgICAgIGxldCBsYXN0Tm9uU3BhY2VUb2tlbjogVG9rZW4gPSBudWxsO1xyXG4gICAgICAgIGxldCBpbmRlbnRMZXZlbCA9IDA7XHJcbiAgICAgICAgbGV0IHRhYlNpemUgPSAzO1xyXG4gICAgICAgIGxldCBjdXJseUJyYWNlc09wZW5BdExpbmVzOiBudW1iZXJbXSA9IFtdO1xyXG4gICAgICAgIGxldCBpbmRlbnRMZXZlbEF0U3dpdGNoU3RhdGVtZW50czogbnVtYmVyW10gPSBbXTtcclxuICAgICAgICBsZXQgc3dpdGNoSGFwcGVuZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgICAgIGxldCBsYXN0VG9rZW5XYXNOZXdMaW5lOiBudW1iZXIgPSAwO1xyXG4gICAgICAgIGxldCByb3VuZEJyYWNrZXRzT3BlbjogbnVtYmVyID0gMDtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbmxpc3QubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIGxldCB0ID0gdG9rZW5saXN0W2ldO1xyXG4gICAgICAgICAgICBsYXN0VG9rZW5XYXNOZXdMaW5lLS07XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2ggKHQudHQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkU3dpdGNoOlxyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaEhhcHBlbmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUua2V5d29yZENhc2U6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gb3V0ZGVudDogbGluZSB3aXRoIGNhc2U6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQucG9zaXRpb24uY29sdW1uID4gMykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlbGV0ZVNwYWNlcyhlZGl0cywgdC5wb3NpdGlvbi5saW5lLCAxLCAzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5sZWZ0Q3VybHlCcmFja2V0OlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzd2l0Y2hIYXBwZW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaEhhcHBlbmQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZW50TGV2ZWxBdFN3aXRjaFN0YXRlbWVudHMucHVzaChpbmRlbnRMZXZlbCArIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRlbnRMZXZlbCsrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpbmRlbnRMZXZlbCsrO1xyXG4gICAgICAgICAgICAgICAgICAgIGN1cmx5QnJhY2VzT3BlbkF0TGluZXMucHVzaCh0LnBvc2l0aW9uLmxpbmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXN0Tm9uU3BhY2VUb2tlbiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0dCA9IGxhc3ROb25TcGFjZVRva2VuLnR0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHQgPT0gVG9rZW5UeXBlLnJpZ2h0QnJhY2tldCB8fCB0dCA9PSBUb2tlblR5cGUuaWRlbnRpZmllciB8fCB0dCA9PSBUb2tlblR5cGUubGVmdFJpZ2h0U3F1YXJlQnJhY2tldCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXBsYWNlQmV0d2VlbihsYXN0Tm9uU3BhY2VUb2tlbiwgdCwgZWRpdHMsIFwiIFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoaSA8IHRva2VubGlzdC5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0b2tlbjEgPSB0b2tlbmxpc3RbaSArIDFdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodG9rZW4xLnR0ICE9IFRva2VuVHlwZS5uZXdsaW5lICYmIHRva2VuMS50dCAhPSBUb2tlblR5cGUuc3BhY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5zZXJ0U3BhY2VzKGVkaXRzLCB0b2tlbjEucG9zaXRpb24ubGluZSwgdG9rZW4xLnBvc2l0aW9uLmNvbHVtbiwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5yaWdodEN1cmx5QnJhY2tldDpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZW50TGV2ZWxBdFN3aXRjaFN0YXRlbWVudHNbaW5kZW50TGV2ZWxBdFN3aXRjaFN0YXRlbWVudHMubGVuZ3RoIC0gMV0gPT0gaW5kZW50TGV2ZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZW50TGV2ZWxBdFN3aXRjaFN0YXRlbWVudHMucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGVudExldmVsLS07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmKHQucG9zaXRpb24uY29sdW1uID49IDMpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlbGV0ZVNwYWNlcyhlZGl0cywgdC5wb3NpdGlvbi5saW5lLCAxLCAzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gfSAgICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50TGV2ZWwtLTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgb3BlbmVkQXRMaW5lID0gY3VybHlCcmFjZXNPcGVuQXRMaW5lcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BlbmVkQXRMaW5lICE9IG51bGwgJiYgb3BlbmVkQXRMaW5lICE9IHQucG9zaXRpb24ubGluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdE5vblNwYWNlVG9rZW4gIT0gbnVsbCAmJiBsYXN0Tm9uU3BhY2VUb2tlbi5wb3NpdGlvbi5saW5lID09IHQucG9zaXRpb24ubGluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXBsYWNlKGVkaXRzLCB0LnBvc2l0aW9uLCB0LnBvc2l0aW9uLCBcIlxcblwiICsgXCIgXCIucmVwZWF0KGluZGVudExldmVsICogdGFiU2l6ZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdG9rZW4xID0gdG9rZW5saXN0W2kgLSAxXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b2tlbjEudHQgIT0gVG9rZW5UeXBlLnNwYWNlICYmIHRva2VuMS50dCAhPSBUb2tlblR5cGUubmV3bGluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5zZXJ0U3BhY2VzKGVkaXRzLCB0LnBvc2l0aW9uLmxpbmUsIHQucG9zaXRpb24uY29sdW1uLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmxlZnRCcmFja2V0OlxyXG4gICAgICAgICAgICAgICAgICAgIHJvdW5kQnJhY2tldHNPcGVuKys7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPCB0b2tlbmxpc3QubGVuZ3RoIC0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dFRva2VuMSA9IHRva2VubGlzdFtpICsgMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXh0VG9rZW4yID0gdG9rZW5saXN0W2kgKyAyXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5leHRUb2tlbjEudHQgPT0gVG9rZW5UeXBlLnNwYWNlICYmIG5leHRUb2tlbjIudHQgIT0gVG9rZW5UeXBlLm5ld2xpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGVsZXRlU3BhY2VzKGVkaXRzLCBuZXh0VG9rZW4xLnBvc2l0aW9uLmxpbmUsIG5leHRUb2tlbjEucG9zaXRpb24uY29sdW1uLCBuZXh0VG9rZW4xLnBvc2l0aW9uLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV4dFRva2VuMi50dCA9PSBUb2tlblR5cGUucmlnaHRCcmFja2V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvdW5kQnJhY2tldHNPcGVuLS07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsYXN0VG9rZW4xID0gdG9rZW5saXN0W2kgLSAxXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxhc3RUb2tlbjIgPSB0b2tlbmxpc3RbaSAtIDJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdFRva2VuMS50dCA9PSBUb2tlblR5cGUuc3BhY2UgJiYgbGFzdFRva2VuMi50dCAhPSBUb2tlblR5cGUubmV3bGluZSAmJiAhdGhpcy5pc0JpbmFyeU9wZXJhdG9yKGxhc3RUb2tlbjIudHQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdFRva2VuMS5wb3NpdGlvbi5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGVsZXRlU3BhY2VzKGVkaXRzLCBsYXN0VG9rZW4xLnBvc2l0aW9uLmxpbmUsIGxhc3RUb2tlbjEucG9zaXRpb24uY29sdW1uLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnJpZ2h0QnJhY2tldDpcclxuICAgICAgICAgICAgICAgICAgICByb3VuZEJyYWNrZXRzT3Blbi0tO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dFRva2VuMSA9IHRva2VubGlzdFtpIC0gMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXh0VG9rZW4yID0gdG9rZW5saXN0W2kgLSAyXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5leHRUb2tlbjEudHQgPT0gVG9rZW5UeXBlLnNwYWNlICYmIG5leHRUb2tlbjIudHQgIT0gVG9rZW5UeXBlLm5ld2xpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGVsZXRlU3BhY2VzKGVkaXRzLCBuZXh0VG9rZW4xLnBvc2l0aW9uLmxpbmUsIG5leHRUb2tlbjEucG9zaXRpb24uY29sdW1uLCBuZXh0VG9rZW4xLnBvc2l0aW9uLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5uZXdsaW5lOlxyXG4gICAgICAgICAgICAgICAgICAgIGxhc3RUb2tlbldhc05ld0xpbmUgPSAyO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpIDwgdG9rZW5saXN0Lmxlbmd0aCAtIDIpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsYXN0VG9rZW5Jc09wZXJhdG9yID0gdGhpcy5pc0JpbmFyeU9wZXJhdG9yKGxhc3ROb25TcGFjZVRva2VuPy50dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXh0VG9rZW5Jc09wZXJhdG9yID0gdGhpcy5pc0JpbmFyeU9wZXJhdG9yKHRoaXMuZ2V0TmV4dE5vblNwYWNlVG9rZW4oaSwgdG9rZW5saXN0KS50dCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYmVnaW5OZXh0TGluZSA9IHRva2VubGlzdFtpICsgMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0b2tlbjIgPSB0b2tlbmxpc3RbaSArIDJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY3VycmVudEluZGVudGF0aW9uID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChiZWdpbk5leHRMaW5lLnR0ID09IFRva2VuVHlwZS5uZXdsaW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGRlbHRhOiBudW1iZXIgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmVnaW5OZXh0TGluZS50dCA9PSBUb2tlblR5cGUuc3BhY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b2tlbjIudHQgPT0gVG9rZW5UeXBlLm5ld2xpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRJbmRlbnRhdGlvbiA9IGJlZ2luTmV4dExpbmUucG9zaXRpb24ubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRva2VuMi50dCA9PSBUb2tlblR5cGUucmlnaHRDdXJseUJyYWNrZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWx0YSA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmVnaW5OZXh0TGluZS50dCA9PSBUb2tlblR5cGUucmlnaHRDdXJseUJyYWNrZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhID0gLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbmRlbnRMZXZlbC0tO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY3VybHlCcmFjZXNPcGVuQXRMaW5lcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxhc3ROb25TcGFjZVRva2VuID0gYmVnaW5OZXh0TGluZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGkrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYobmV4dFRva2VuSXNPcGVyYXRvciB8fCBsYXN0VG9rZW5Jc09wZXJhdG9yKSBkZWx0YSA9IDE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaWwgPSBpbmRlbnRMZXZlbCArIGRlbHRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihyb3VuZEJyYWNrZXRzT3BlbiA+IDApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWwrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaWwgPCAwKSBpbCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgY29ycmVjdEluZGVudGF0aW9uID0gaWwgKiB0YWJTaXplO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvcnJlY3RJbmRlbnRhdGlvbiA+IGN1cnJlbnRJbmRlbnRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnNlcnRTcGFjZXMoZWRpdHMsIHQucG9zaXRpb24ubGluZSArIDEsIDAsIGNvcnJlY3RJbmRlbnRhdGlvbiAtIGN1cnJlbnRJbmRlbnRhdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29ycmVjdEluZGVudGF0aW9uIDwgY3VycmVudEluZGVudGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlbGV0ZVNwYWNlcyhlZGl0cywgdC5wb3NpdGlvbi5saW5lICsgMSwgMCwgY3VycmVudEluZGVudGF0aW9uIC0gY29ycmVjdEluZGVudGF0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnNwYWNlOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpIDwgdG9rZW5saXN0Lmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5leHRUb2tlbiA9IHRva2VubGlzdFtpICsgMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXh0VG9rZW4udHQgIT0gVG9rZW5UeXBlLmNvbW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsYXN0VG9rZW4gPSB0b2tlbmxpc3RbaSAtIDFdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0VG9rZW4udHQgIT0gVG9rZW5UeXBlLm5ld2xpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHQucG9zaXRpb24ubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZWxldGVTcGFjZXMoZWRpdHMsIHQucG9zaXRpb24ubGluZSwgdC5wb3NpdGlvbi5jb2x1bW4sIHQucG9zaXRpb24ubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5jb21tYTpcclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnNlbWljb2xvbjpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaSA+IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxhc3RUb2tlbjEgPSB0b2tlbmxpc3RbaSAtIDFdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbGFzdFRva2VuMiA9IHRva2VubGlzdFtpIC0gMl07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0VG9rZW4xLnR0ICE9IFRva2VuVHlwZS5uZXdsaW5lICYmIGxhc3RUb2tlbjIudHQgIT0gVG9rZW5UeXBlLm5ld2xpbmUgJiYgIXRoaXMuaXNCaW5hcnlPcGVyYXRvcihsYXN0VG9rZW4yLnR0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RUb2tlbjEudHQgPT0gVG9rZW5UeXBlLnNwYWNlICYmIGxhc3RUb2tlbjEucG9zaXRpb24ubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlbGV0ZVNwYWNlcyhlZGl0cywgbGFzdFRva2VuMS5wb3NpdGlvbi5saW5lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0VG9rZW4xLnBvc2l0aW9uLmNvbHVtbiwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPCB0b2tlbmxpc3QubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV4dFRva2VuID0gdG9rZW5saXN0W2kgKyAxXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5leHRUb2tlbi50dCAhPSBUb2tlblR5cGUuY29tbWVudCAmJiBuZXh0VG9rZW4udHQgIT0gVG9rZW5UeXBlLnNwYWNlICYmIG5leHRUb2tlbi50dCAhPSBUb2tlblR5cGUubmV3bGluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnNlcnRTcGFjZXMoZWRpdHMsIG5leHRUb2tlbi5wb3NpdGlvbi5saW5lLCBuZXh0VG9rZW4ucG9zaXRpb24uY29sdW1uLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnJpZ2h0U3F1YXJlQnJhY2tldDpcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdE5vblNwYWNlVG9rZW4gIT0gbnVsbCAmJiBsYXN0Tm9uU3BhY2VUb2tlbi50dCA9PSBUb2tlblR5cGUubGVmdFNxdWFyZUJyYWNrZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXBsYWNlQmV0d2VlbihsYXN0Tm9uU3BhY2VUb2tlbiwgdCwgZWRpdHMsIFwiXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBiaW5hcnkgb3BlcmF0b3I/XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQmluYXJ5T3BlcmF0b3IodC50dCkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbG93ZXJHZW5lcmljID0gdC50dCA9PSBUb2tlblR5cGUubG93ZXIgJiYgdGhpcy5sb3dlckJlbG9uZ3NUb0dlbmVyaWNFeHByZXNzaW9uKGksIHRva2VubGlzdCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgZ3JlYXRlckdlbmVyaWMgPSB0LnR0ID09IFRva2VuVHlwZS5ncmVhdGVyICYmIHRoaXMuZ3JlYXRlckJlbG9uZ3NUb0dlbmVyaWNFeHByZXNzaW9uKGksIHRva2VubGlzdCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGxhc3RUb2tlbldhc05ld0xpbmUgPD0gMCAmJiBsYXN0Tm9uU3BhY2VUb2tlbiAhPSBudWxsICYmIFtUb2tlblR5cGUubGVmdEJyYWNrZXQsIFRva2VuVHlwZS5hc3NpZ25tZW50LCBUb2tlblR5cGUuY29tbWFdLmluZGV4T2YobGFzdE5vblNwYWNlVG9rZW4udHQpIDwgMCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoaSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRva2VuQmVmb3JlID0gdG9rZW5saXN0W2kgLSAxXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNwYWNlcyA9IChsb3dlckdlbmVyaWMgfHwgZ3JlYXRlckdlbmVyaWMpID8gMCA6IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b2tlbkJlZm9yZS50dCA9PSBUb2tlblR5cGUuc3BhY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b2tlbkJlZm9yZS5wb3NpdGlvbi5sZW5ndGggIT0gc3BhY2VzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnNlcnRTcGFjZXMoZWRpdHMsIHRva2VuQmVmb3JlLnBvc2l0aW9uLmxpbmUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2VuQmVmb3JlLnBvc2l0aW9uLmNvbHVtbiwgc3BhY2VzIC0gdG9rZW5CZWZvcmUucG9zaXRpb24ubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFjZXMgPT0gMSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc2VydFNwYWNlcyhlZGl0cywgdC5wb3NpdGlvbi5saW5lLCB0LnBvc2l0aW9uLmNvbHVtbiwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpIDwgdG9rZW5saXN0Lmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5leHRUb2tlbiA9IHRva2VubGlzdFtpICsgMV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzcGFjZXMgPSAobG93ZXJHZW5lcmljKSA/IDAgOiAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV4dFRva2VuLnR0ID09IFRva2VuVHlwZS5zcGFjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdyZWF0ZXJHZW5lcmljICYmIGkgPCB0b2tlbmxpc3QubGVuZ3RoIC0gMiAmJiB0b2tlbmxpc3RbaSArIDJdLnR0ID09IFRva2VuVHlwZS5sZWZ0QnJhY2tldCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNlcyA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV4dFRva2VuLnBvc2l0aW9uLmxlbmd0aCAhPSBzcGFjZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluc2VydFNwYWNlcyhlZGl0cywgbmV4dFRva2VuLnBvc2l0aW9uLmxpbmUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRUb2tlbi5wb3NpdGlvbi5jb2x1bW4sIHNwYWNlcyAtIG5leHRUb2tlbi5wb3NpdGlvbi5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdyZWF0ZXJHZW5lcmljICYmIG5leHRUb2tlbi50dCA9PSBUb2tlblR5cGUubGVmdEJyYWNrZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGFjZXMgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYWNlcyA9PSAxKSB0aGlzLmluc2VydFNwYWNlcyhlZGl0cywgbmV4dFRva2VuLnBvc2l0aW9uLmxpbmUsIG5leHRUb2tlbi5wb3NpdGlvbi5jb2x1bW4sIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHQudHQgIT0gVG9rZW5UeXBlLnNwYWNlICYmIHQudHQgIT0gVG9rZW5UeXBlLm5ld2xpbmUpIHtcclxuICAgICAgICAgICAgICAgIGxhc3ROb25TcGFjZVRva2VuID0gdDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZGVsZXRlT3ZlcmxhcHBpbmdSYW5nZXMoZWRpdHMpO1xyXG5cclxuICAgICAgICByZXR1cm4gZWRpdHM7XHJcblxyXG4gICAgfVxyXG4gICAgZ2V0TmV4dE5vblNwYWNlVG9rZW4oY3VycmVudEluZGV4OiBudW1iZXIsIHRva2VubGlzdDogVG9rZW5MaXN0KTogIFRva2VuIHtcclxuXHJcbiAgICAgICAgaWYoY3VycmVudEluZGV4ID09IHRva2VubGlzdC5sZW5ndGggLSAxKSByZXR1cm4gdG9rZW5saXN0W2N1cnJlbnRJbmRleF07XHJcblxyXG4gICAgICAgIGxldCBqID0gY3VycmVudEluZGV4ICsgMTtcclxuICAgICAgICB3aGlsZShqIDwgdG9rZW5saXN0Lmxlbmd0aCAtIDEgJiYgKHRva2VubGlzdFtqXS50dCA9PSBUb2tlblR5cGUuc3BhY2UgfHwgdG9rZW5saXN0W2pdLnR0ID09IFRva2VuVHlwZS5yZXR1cm4pKXtcclxuICAgICAgICAgICAgaisrO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdG9rZW5saXN0W2pdO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBsb3dlckJlbG9uZ3NUb0dlbmVyaWNFeHByZXNzaW9uKHBvc2l0aW9uOiBudW1iZXIsIHRva2VubGlzdDogVG9rZW5MaXN0KSB7XHJcbiAgICAgICAgbGV0IGkgPSBwb3NpdGlvbiArIDE7XHJcbiAgICAgICAgd2hpbGUgKGkgPCB0b2tlbmxpc3QubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGxldCB0dCA9IHRva2VubGlzdFtpXS50dDtcclxuICAgICAgICAgICAgaWYgKHR0ID09IFRva2VuVHlwZS5ncmVhdGVyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoW1Rva2VuVHlwZS5zcGFjZSwgVG9rZW5UeXBlLmNvbW1hLCBUb2tlblR5cGUuaWRlbnRpZmllcl0uaW5kZXhPZih0dCkgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZ3JlYXRlckJlbG9uZ3NUb0dlbmVyaWNFeHByZXNzaW9uKHBvc2l0aW9uOiBudW1iZXIsIHRva2VubGlzdDogVG9rZW5MaXN0KSB7XHJcbiAgICAgICAgbGV0IGkgPSBwb3NpdGlvbiAtIDE7XHJcbiAgICAgICAgd2hpbGUgKGkgPj0gMCkge1xyXG4gICAgICAgICAgICBsZXQgdHQgPSB0b2tlbmxpc3RbaV0udHQ7XHJcbiAgICAgICAgICAgIGlmICh0dCA9PSBUb2tlblR5cGUubG93ZXIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChbVG9rZW5UeXBlLnNwYWNlLCBUb2tlblR5cGUuY29tbWEsIFRva2VuVHlwZS5pZGVudGlmaWVyXS5pbmRleE9mKHR0KSA8IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpLS07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBpc0JpbmFyeU9wZXJhdG9yKHRva2VuOiBUb2tlblR5cGUpIHtcclxuICAgICAgICByZXR1cm4gdG9rZW4gIT0gbnVsbCAmJiB0b2tlbiA+PSBUb2tlblR5cGUubW9kdWxvICYmIHRva2VuIDw9IFRva2VuVHlwZS5jb2xvbjtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlcGxhY2VCZXR3ZWVuKGxhc3ROb25TcGFjZVRva2VuOiBUb2tlbiwgdDogVG9rZW4sIGVkaXRzOiBtb25hY28ubGFuZ3VhZ2VzLlRleHRFZGl0W10sIHRleHQ6IHN0cmluZykge1xyXG4gICAgICAgIGxldCBwb3NpdGlvbkZyb20gPSB7XHJcbiAgICAgICAgICAgIGxpbmU6IGxhc3ROb25TcGFjZVRva2VuLnBvc2l0aW9uLmxpbmUsXHJcbiAgICAgICAgICAgIGNvbHVtbjogbGFzdE5vblNwYWNlVG9rZW4ucG9zaXRpb24uY29sdW1uICsgbGFzdE5vblNwYWNlVG9rZW4ucG9zaXRpb24ubGVuZ3RoXHJcbiAgICAgICAgfTtcclxuICAgICAgICBsZXQgcG9zaXRpb25UbyA9IHtcclxuICAgICAgICAgICAgbGluZTogdC5wb3NpdGlvbi5saW5lLFxyXG4gICAgICAgICAgICBjb2x1bW46IHQucG9zaXRpb24uY29sdW1uXHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAocG9zaXRpb25Gcm9tLmxpbmUgIT0gcG9zaXRpb25Uby5saW5lIHx8XHJcbiAgICAgICAgICAgIHBvc2l0aW9uVG8uY29sdW1uIC0gcG9zaXRpb25Gcm9tLmNvbHVtbiAhPSB0ZXh0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICB0aGlzLnJlcGxhY2UoZWRpdHMsIHBvc2l0aW9uRnJvbSwgcG9zaXRpb25UbywgdGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRlbGV0ZVNwYWNlcyhlZGl0czogbW9uYWNvLmxhbmd1YWdlcy5UZXh0RWRpdFtdLCBsaW5lOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyLCBudW1iZXJPZlNwYWNlczogbnVtYmVyKSB7XHJcbiAgICAgICAgZWRpdHMucHVzaCh7XHJcbiAgICAgICAgICAgIHJhbmdlOiB7XHJcbiAgICAgICAgICAgICAgICBzdGFydENvbHVtbjogY29sdW1uLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRMaW5lTnVtYmVyOiBsaW5lLFxyXG4gICAgICAgICAgICAgICAgZW5kQ29sdW1uOiBjb2x1bW4gKyBudW1iZXJPZlNwYWNlcyArIChjb2x1bW4gPT0gMCA/IDEgOiAwKSxcclxuICAgICAgICAgICAgICAgIGVuZExpbmVOdW1iZXI6IGxpbmVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGV4dDogXCJcIlxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGluc2VydFNwYWNlcyhlZGl0czogbW9uYWNvLmxhbmd1YWdlcy5UZXh0RWRpdFtdLCBsaW5lOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyLCBudW1iZXJPZlNwYWNlczogbnVtYmVyKSB7XHJcblxyXG4gICAgICAgIGlmIChudW1iZXJPZlNwYWNlcyA8IDApIHtcclxuICAgICAgICAgICAgdGhpcy5kZWxldGVTcGFjZXMoZWRpdHMsIGxpbmUsIGNvbHVtbiwgLW51bWJlck9mU3BhY2VzKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWRpdHMucHVzaCh7XHJcbiAgICAgICAgICAgIHJhbmdlOiB7XHJcbiAgICAgICAgICAgICAgICBzdGFydENvbHVtbjogY29sdW1uLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRMaW5lTnVtYmVyOiBsaW5lLFxyXG4gICAgICAgICAgICAgICAgZW5kQ29sdW1uOiBjb2x1bW4sXHJcbiAgICAgICAgICAgICAgICBlbmRMaW5lTnVtYmVyOiBsaW5lXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRleHQ6IFwiIFwiLnJlcGVhdChudW1iZXJPZlNwYWNlcylcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXBsYWNlKGVkaXRzOiBtb25hY28ubGFuZ3VhZ2VzLlRleHRFZGl0W10sIHBvc2l0aW9uRnJvbTogeyBsaW5lOiBudW1iZXI7IGNvbHVtbjogbnVtYmVyOyB9LCBwb3NpdGlvblRvOiB7IGxpbmU6IG51bWJlcjsgY29sdW1uOiBudW1iZXI7IH0sIHRleHQ6IHN0cmluZykge1xyXG5cclxuICAgICAgICBlZGl0cy5wdXNoKHtcclxuICAgICAgICAgICAgcmFuZ2U6IHtcclxuICAgICAgICAgICAgICAgIHN0YXJ0Q29sdW1uOiBwb3NpdGlvbkZyb20uY29sdW1uLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRMaW5lTnVtYmVyOiBwb3NpdGlvbkZyb20ubGluZSxcclxuICAgICAgICAgICAgICAgIGVuZENvbHVtbjogcG9zaXRpb25Uby5jb2x1bW4sXHJcbiAgICAgICAgICAgICAgICBlbmRMaW5lTnVtYmVyOiBwb3NpdGlvblRvLmxpbmVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGV4dDogdGV4dFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxufSJdfQ==