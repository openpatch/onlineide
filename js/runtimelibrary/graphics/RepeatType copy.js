import { Enum } from "../../compiler/types/Enum.js";
import { TokenType } from "../../compiler/lexer/Token.js";
export class RepeatTypeClass extends Enum {
    constructor(module) {
        super("RepeatType", module, [
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "once"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "loop"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "backAndForth"
            },
        ]);
    }
}
//# sourceMappingURL=RepeatType copy.js.map