import { TokenType } from "../../compiler/lexer/Token.js";
import { Enum } from "../../compiler/types/Enum.js";
export class GNGSymbolArtClass extends Enum {
    constructor(module) {
        super("SymbolArt", module, ["Kreis", "Rechteck"].map((identifier) => {
            return {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: identifier
            };
        }));
        this.documentation = "Aufzählung der Sprite-Grafiken";
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR05HU3ltYm9sQXJ0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9ydW50aW1lbGlicmFyeS9nbmcvR05HU3ltYm9sQXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUUxRCxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFFcEQsTUFBTSxPQUFPLGlCQUFrQixTQUFRLElBQUk7SUFFdkMsWUFBWSxNQUFjO1FBQ3RCLEtBQUssQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFVBQWtCLEVBQUUsRUFBRTtZQUN4RSxPQUFPO2dCQUNILElBQUksRUFBRSxTQUFTLENBQUMsYUFBYTtnQkFDN0IsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsVUFBVSxFQUFFLFVBQVU7YUFDekIsQ0FBQTtRQUNMLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFSixJQUFJLENBQUMsYUFBYSxHQUFHLGdDQUFnQyxDQUFBO0lBQ3pELENBQUM7Q0FFSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRva2VuVHlwZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci9sZXhlci9Ub2tlbi5qc1wiO1xuaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcbmltcG9ydCB7IEVudW0gfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvRW51bS5qc1wiO1xuXG5leHBvcnQgY2xhc3MgR05HU3ltYm9sQXJ0Q2xhc3MgZXh0ZW5kcyBFbnVtIHtcblxuICAgIGNvbnN0cnVjdG9yKG1vZHVsZTogTW9kdWxlKSB7XG4gICAgICAgIHN1cGVyKFwiU3ltYm9sQXJ0XCIsIG1vZHVsZSwgW1wiS3JlaXNcIiwgXCJSZWNodGVja1wiXS5tYXAoKGlkZW50aWZpZXI6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaEVudW1WYWx1ZSxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbnVsbCxcbiAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBpZGVudGlmaWVyXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLmRvY3VtZW50YXRpb24gPSBcIkF1ZnrDpGhsdW5nIGRlciBTcHJpdGUtR3JhZmlrZW5cIlxuICAgIH1cblxufSJdfQ==