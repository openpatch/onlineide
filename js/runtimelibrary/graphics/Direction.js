import { Enum } from "../../compiler/types/Enum.js";
import { TokenType } from "../../compiler/lexer/Token.js";
export class DirectionClass extends Enum {
    constructor(module) {
        super("Direction", module, [
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "top"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "right"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "bottom"
            },
            {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: "left"
            }
        ]);
        this.documentation = "Richtung (oben, rechts, unten, links)";
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGlyZWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9EaXJlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBRXBELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUUxRCxNQUFNLE9BQU8sY0FBZSxTQUFRLElBQUk7SUFFcEMsWUFBWSxNQUFjO1FBQ3RCLEtBQUssQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFO1lBQ3ZCO2dCQUNJLElBQUksRUFBRSxTQUFTLENBQUMsYUFBYTtnQkFDN0IsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsVUFBVSxFQUFFLEtBQUs7YUFDcEI7WUFDRDtnQkFDSSxJQUFJLEVBQUUsU0FBUyxDQUFDLGFBQWE7Z0JBQzdCLFFBQVEsRUFBRSxJQUFJO2dCQUNkLFVBQVUsRUFBRSxPQUFPO2FBQ3RCO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLFNBQVMsQ0FBQyxhQUFhO2dCQUM3QixRQUFRLEVBQUUsSUFBSTtnQkFDZCxVQUFVLEVBQUUsUUFBUTthQUN2QjtZQUNEO2dCQUNJLElBQUksRUFBRSxTQUFTLENBQUMsYUFBYTtnQkFDN0IsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsVUFBVSxFQUFFLE1BQU07YUFDckI7U0FDSixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsYUFBYSxHQUFHLHVDQUF1QyxDQUFBO0lBQ2hFLENBQUM7Q0FFSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEVudW0gfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvRW51bS5qc1wiO1xuaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcbmltcG9ydCB7IFRva2VuVHlwZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci9sZXhlci9Ub2tlbi5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRGlyZWN0aW9uQ2xhc3MgZXh0ZW5kcyBFbnVtIHtcblxuICAgIGNvbnN0cnVjdG9yKG1vZHVsZTogTW9kdWxlKXtcbiAgICAgICAgc3VwZXIoXCJEaXJlY3Rpb25cIiwgbW9kdWxlLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hFbnVtVmFsdWUsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IG51bGwsXG4gICAgICAgICAgICAgICAgaWRlbnRpZmllcjogXCJ0b3BcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaEVudW1WYWx1ZSxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbnVsbCxcbiAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBcInJpZ2h0XCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hFbnVtVmFsdWUsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IG51bGwsXG4gICAgICAgICAgICAgICAgaWRlbnRpZmllcjogXCJib3R0b21cIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaEVudW1WYWx1ZSxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogbnVsbCxcbiAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBcImxlZnRcIlxuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcblxuICAgICAgICB0aGlzLmRvY3VtZW50YXRpb24gPSBcIlJpY2h0dW5nIChvYmVuLCByZWNodHMsIHVudGVuLCBsaW5rcylcIlxuICAgIH1cblxufSJdfQ==