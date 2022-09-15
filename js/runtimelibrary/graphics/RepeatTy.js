import { Enum } from "../../compiler/types/Enum.js";
import { TokenType } from "../../compiler/lexer/Token.js";
export class AlignmentClass extends Enum {
    constructor(module) {
        super("Alignment", module, [
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "left"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "center"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "right"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "top"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "bottom"
            },
        ]);
    }
}
//# sourceMappingURL=RepeatTy.js.map