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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3ltYm9sQXJ0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9ydW50aW1lbGlicmFyeS9nbmcvU3ltYm9sQXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUUxRCxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFFcEQsTUFBTSxPQUFPLGlCQUFrQixTQUFRLElBQUk7SUFFdkMsWUFBWSxNQUFjO1FBQ3RCLEtBQUssQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFVBQWtCLEVBQUUsRUFBRTtZQUN4RSxPQUFPO2dCQUNILElBQUksRUFBRSxTQUFTLENBQUMsYUFBYTtnQkFDN0IsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsVUFBVSxFQUFFLFVBQVU7YUFDekIsQ0FBQTtRQUNMLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFSixJQUFJLENBQUMsYUFBYSxHQUFHLGdDQUFnQyxDQUFBO0lBQ3pELENBQUM7Q0FFSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRva2VuVHlwZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci9sZXhlci9Ub2tlbi5qc1wiO1xyXG5pbXBvcnQgeyBNb2R1bGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBFbnVtIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL0VudW0uanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBHTkdTeW1ib2xBcnRDbGFzcyBleHRlbmRzIEVudW0ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1vZHVsZTogTW9kdWxlKSB7XHJcbiAgICAgICAgc3VwZXIoXCJTeW1ib2xBcnRcIiwgbW9kdWxlLCBbXCJLcmVpc1wiLCBcIlJlY2h0ZWNrXCJdLm1hcCgoaWRlbnRpZmllcjogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaEVudW1WYWx1ZSxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgaWRlbnRpZmllcjogaWRlbnRpZmllclxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLmRvY3VtZW50YXRpb24gPSBcIkF1ZnrDpGhsdW5nIGRlciBTcHJpdGUtR3JhZmlrZW5cIlxyXG4gICAgfVxyXG5cclxufSJdfQ==