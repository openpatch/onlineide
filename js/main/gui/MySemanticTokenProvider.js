import { Interface, Klass } from "../../compiler/types/Class.js";
import { Attribute, Method, PrimitiveType, Type } from "../../compiler/types/Types.js";
export class MySemanticTokenProvider {
    constructor(main) {
        this.main = main;
        this.tokenTypes = [
            'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 'namespace',
            'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 'function',
            'member', 'macro', 'variable', 'parameter', 'property', 'label'
        ];
        this.tokenModifiers = ['declaration', 'documentation', 'readonly', 'static', 'abstract', 'deprecated',
            'modification', 'async'];
        this.legend = {
            tokenTypes: this.tokenTypes,
            tokenModifiers: this.tokenModifiers
        };
    }
    provideDocumentRangeSemanticTokens(model, range, token) {
        var _a;
        let module = this.main.getCurrentlyEditedModule();
        if (module.model.id != model.id)
            return {
                data: new Uint32Array(),
                resultId: null
            };
        let lastPos = {
            line: 0,
            column: 0
        };
        let data = [];
        for (let line = range.startLineNumber; line <= range.endLineNumber; line++) {
            let identifierPositions = module.identifierPositions[line];
            if (identifierPositions != null) {
                for (let ip of identifierPositions) {
                    let element = ip.element;
                    if (element instanceof Klass || element instanceof Method || element instanceof Interface
                        || element instanceof Attribute) {
                        if (element instanceof Attribute) {
                            this.registerToken(ip.position, element.identifier, lastPos, data, this.tokenTypes.indexOf("property"), 0);
                        }
                    }
                    else if (element instanceof PrimitiveType) {
                    }
                    else if (!(element instanceof Type)) {
                        // Variable
                        let typeIdentifier = (_a = element === null || element === void 0 ? void 0 : element.type) === null || _a === void 0 ? void 0 : _a.identifier;
                    }
                }
            }
        }
        return {
            data: new Uint32Array(data),
            resultId: null
        };
    }
    getLegend() {
        return this.legend;
    }
    registerToken(position, identifier, lastPos, data, tokenTypeIndex, tokenModifierIndex) {
        data.push(position.line - 1 - lastPos.line, position.line - 1 == lastPos.line ? position.column - 1 - lastPos.column : position.column - 1, identifier.length, tokenTypeIndex, tokenModifierIndex);
        lastPos.line = position.line - 1;
        lastPos.column = position.column - 1;
    }
    releaseDocumentSemanticTokens(resultId) {
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXlTZW1hbnRpY1Rva2VuUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L21haW4vZ3VpL015U2VtYW50aWNUb2tlblByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFDakUsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBSXZGLE1BQU0sT0FBTyx1QkFBdUI7SUFXaEMsWUFBb0IsSUFBYztRQUFkLFNBQUksR0FBSixJQUFJLENBQVU7UUFUbEMsZUFBVSxHQUFHO1lBQ1QsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsV0FBVztZQUMzRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxVQUFVO1lBQzNFLFFBQVEsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsT0FBTztTQUNsRSxDQUFDO1FBQ0YsbUJBQWMsR0FBRyxDQUFDLGFBQWEsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsWUFBWTtZQUM1RixjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFJekIsSUFBSSxDQUFDLE1BQU0sR0FBRztZQUNWLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtZQUMzQixjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWM7U0FDdEMsQ0FBQTtJQUNMLENBQUM7SUFFRCxrQ0FBa0MsQ0FBQyxLQUErQixFQUFFLEtBQW1CLEVBQUUsS0FBK0I7O1FBRXBILElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUNsRCxJQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLEtBQUssQ0FBQyxFQUFFO1lBQUUsT0FBTztnQkFDbkMsSUFBSSxFQUFFLElBQUksV0FBVyxFQUFFO2dCQUN2QixRQUFRLEVBQUUsSUFBSTthQUNqQixDQUFDO1FBQ0YsSUFBSSxPQUFPLEdBQUc7WUFDVixJQUFJLEVBQUUsQ0FBQztZQUNQLE1BQU0sRUFBRSxDQUFDO1NBQ1osQ0FBQTtRQUVELElBQUksSUFBSSxHQUFhLEVBQUUsQ0FBQztRQUV4QixLQUFJLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxlQUFlLEVBQUUsSUFBSSxJQUFJLEtBQUssQ0FBQyxhQUFhLEVBQUUsSUFBSSxFQUFFLEVBQUM7WUFDdEUsSUFBSSxtQkFBbUIsR0FBRyxNQUFNLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0QsSUFBRyxtQkFBbUIsSUFBSSxJQUFJLEVBQUM7Z0JBQzNCLEtBQUksSUFBSSxFQUFFLElBQUksbUJBQW1CLEVBQUM7b0JBRTlCLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUM7b0JBRXpCLElBQUksT0FBTyxZQUFZLEtBQUssSUFBSSxPQUFPLFlBQVksTUFBTSxJQUFJLE9BQU8sWUFBWSxTQUFTOzJCQUNsRixPQUFPLFlBQVksU0FBUyxFQUFFO3dCQUU3QixJQUFHLE9BQU8sWUFBWSxTQUFTLEVBQUM7NEJBQzVCLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQzdELElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3lCQUMvQztxQkFHUjt5QkFBTSxJQUFJLE9BQU8sWUFBWSxhQUFhLEVBQUU7cUJBQzVDO3lCQUFNLElBQUcsQ0FBQyxDQUFDLE9BQU8sWUFBWSxJQUFJLENBQUMsRUFBQzt3QkFDakMsV0FBVzt3QkFDWCxJQUFJLGNBQWMsU0FBVyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsSUFBSSwwQ0FBRSxVQUFVLENBQUM7cUJBRTFEO2lCQUVKO2FBQ0o7U0FDSjtRQUVELE9BQU87WUFDSCxJQUFJLEVBQUUsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDO1lBQzNCLFFBQVEsRUFBRSxJQUFJO1NBQ2pCLENBQUM7SUFFTixDQUFDO0lBSUQsU0FBUztRQUNMLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBR0QsYUFBYSxDQUFDLFFBQXNCLEVBQUUsVUFBa0IsRUFDcEQsT0FBMEMsRUFBRSxJQUFjLEVBQUUsY0FBc0IsRUFBRSxrQkFBMEI7UUFDMUcsSUFBSSxDQUFDLElBQUksQ0FDTCxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsSUFBSSxFQUNoQyxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFDOUYsVUFBVSxDQUFDLE1BQU0sRUFDakIsY0FBYyxFQUNkLGtCQUFrQixDQUNyQixDQUFDO1FBQ0YsT0FBTyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNqQyxPQUFPLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRCw2QkFBNkIsQ0FBQyxRQUFnQjtJQUU5QyxDQUFDO0NBS0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZXh0UG9zaXRpb24gfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvbGV4ZXIvVG9rZW4uanNcIjtcclxuaW1wb3J0IHsgU3ltYm9sVGFibGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvcGFyc2VyL1N5bWJvbFRhYmxlLmpzXCI7XHJcbmltcG9ydCB7IEludGVyZmFjZSwgS2xhc3MgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgQXR0cmlidXRlLCBNZXRob2QsIFByaW1pdGl2ZVR5cGUsIFR5cGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuLi9NYWluLmpzXCI7XHJcbmltcG9ydCB7IE1haW5CYXNlIH0gZnJvbSBcIi4uL01haW5CYXNlLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgTXlTZW1hbnRpY1Rva2VuUHJvdmlkZXIgaW1wbGVtZW50cyBtb25hY28ubGFuZ3VhZ2VzLkRvY3VtZW50UmFuZ2VTZW1hbnRpY1Rva2Vuc1Byb3ZpZGVyIHtcclxuICAgIFxyXG4gICAgdG9rZW5UeXBlcyA9IFtcclxuICAgICAgICAnY29tbWVudCcsICdzdHJpbmcnLCAna2V5d29yZCcsICdudW1iZXInLCAncmVnZXhwJywgJ29wZXJhdG9yJywgJ25hbWVzcGFjZScsXHJcbiAgICAgICAgJ3R5cGUnLCAnc3RydWN0JywgJ2NsYXNzJywgJ2ludGVyZmFjZScsICdlbnVtJywgJ3R5cGVQYXJhbWV0ZXInLCAnZnVuY3Rpb24nLFxyXG4gICAgICAgICdtZW1iZXInLCAnbWFjcm8nLCAndmFyaWFibGUnLCAncGFyYW1ldGVyJywgJ3Byb3BlcnR5JywgJ2xhYmVsJ1xyXG4gICAgXTtcclxuICAgIHRva2VuTW9kaWZpZXJzID0gWydkZWNsYXJhdGlvbicsICdkb2N1bWVudGF0aW9uJywgJ3JlYWRvbmx5JywgJ3N0YXRpYycsICdhYnN0cmFjdCcsICdkZXByZWNhdGVkJyxcclxuICAgICAgICAnbW9kaWZpY2F0aW9uJywgJ2FzeW5jJ107XHJcbiAgICBsZWdlbmQ6IG1vbmFjby5sYW5ndWFnZXMuU2VtYW50aWNUb2tlbnNMZWdlbmQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBtYWluOiBNYWluQmFzZSl7XHJcbiAgICAgICAgdGhpcy5sZWdlbmQgPSB7XHJcbiAgICAgICAgICAgIHRva2VuVHlwZXM6IHRoaXMudG9rZW5UeXBlcyxcclxuICAgICAgICAgICAgdG9rZW5Nb2RpZmllcnM6IHRoaXMudG9rZW5Nb2RpZmllcnNcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdmlkZURvY3VtZW50UmFuZ2VTZW1hbnRpY1Rva2Vucyhtb2RlbDogbW9uYWNvLmVkaXRvci5JVGV4dE1vZGVsLCByYW5nZTogbW9uYWNvLlJhbmdlLCB0b2tlbjogbW9uYWNvLkNhbmNlbGxhdGlvblRva2VuKTogbW9uYWNvLmxhbmd1YWdlcy5Qcm92aWRlclJlc3VsdDxtb25hY28ubGFuZ3VhZ2VzLlNlbWFudGljVG9rZW5zPiB7XHJcblxyXG4gICAgICAgIGxldCBtb2R1bGUgPSB0aGlzLm1haW4uZ2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKCk7XHJcbiAgICAgICAgaWYobW9kdWxlLm1vZGVsLmlkICE9IG1vZGVsLmlkKSByZXR1cm4ge1xyXG4gICAgICAgICAgICBkYXRhOiBuZXcgVWludDMyQXJyYXkoKSxcclxuICAgICAgICAgICAgcmVzdWx0SWQ6IG51bGxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGxldCBsYXN0UG9zID0ge1xyXG4gICAgICAgICAgICBsaW5lOiAwLFxyXG4gICAgICAgICAgICBjb2x1bW46IDBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBkYXRhOiBudW1iZXJbXSA9IFtdO1xyXG5cclxuICAgICAgICBmb3IobGV0IGxpbmUgPSByYW5nZS5zdGFydExpbmVOdW1iZXI7IGxpbmUgPD0gcmFuZ2UuZW5kTGluZU51bWJlcjsgbGluZSsrKXtcclxuICAgICAgICAgICAgbGV0IGlkZW50aWZpZXJQb3NpdGlvbnMgPSBtb2R1bGUuaWRlbnRpZmllclBvc2l0aW9uc1tsaW5lXTtcclxuICAgICAgICAgICAgaWYoaWRlbnRpZmllclBvc2l0aW9ucyAhPSBudWxsKXtcclxuICAgICAgICAgICAgICAgIGZvcihsZXQgaXAgb2YgaWRlbnRpZmllclBvc2l0aW9ucyl7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBlbGVtZW50ID0gaXAuZWxlbWVudDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBLbGFzcyB8fCBlbGVtZW50IGluc3RhbmNlb2YgTWV0aG9kIHx8IGVsZW1lbnQgaW5zdGFuY2VvZiBJbnRlcmZhY2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgZWxlbWVudCBpbnN0YW5jZW9mIEF0dHJpYnV0ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGVsZW1lbnQgaW5zdGFuY2VvZiBBdHRyaWJ1dGUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJUb2tlbihpcC5wb3NpdGlvbiwgZWxlbWVudC5pZGVudGlmaWVyLCBsYXN0UG9zLCBkYXRhLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b2tlblR5cGVzLmluZGV4T2YoXCJwcm9wZXJ0eVwiKSwgMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBQcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKCEoZWxlbWVudCBpbnN0YW5jZW9mIFR5cGUpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFyaWFibGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHR5cGVJZGVudGlmaWVyOiBzdHJpbmcgPSBlbGVtZW50Py50eXBlPy5pZGVudGlmaWVyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBkYXRhOiBuZXcgVWludDMyQXJyYXkoZGF0YSksXHJcbiAgICAgICAgICAgIHJlc3VsdElkOiBudWxsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgb25EaWRDaGFuZ2U/OiBtb25hY28uSUV2ZW50PHZvaWQ+O1xyXG5cclxuICAgIGdldExlZ2VuZCgpOiBtb25hY28ubGFuZ3VhZ2VzLlNlbWFudGljVG9rZW5zTGVnZW5kIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5sZWdlbmQ7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHJlZ2lzdGVyVG9rZW4ocG9zaXRpb246IFRleHRQb3NpdGlvbiwgaWRlbnRpZmllcjogc3RyaW5nLCBcclxuICAgICAgICBsYXN0UG9zOiB7IGxpbmU6IG51bWJlcjsgY29sdW1uOiBudW1iZXI7IH0sIGRhdGE6IG51bWJlcltdLCB0b2tlblR5cGVJbmRleDogbnVtYmVyLCB0b2tlbk1vZGlmaWVySW5kZXg6IG51bWJlcikge1xyXG4gICAgICAgICAgICBkYXRhLnB1c2goXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbi5saW5lIC0gMSAtIGxhc3RQb3MubGluZSxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uLmxpbmUgLSAxID09IGxhc3RQb3MubGluZSA/IHBvc2l0aW9uLmNvbHVtbiAtIDEgLSBsYXN0UG9zLmNvbHVtbiA6IHBvc2l0aW9uLmNvbHVtbiAtIDEsXHJcbiAgICAgICAgICAgICAgICBpZGVudGlmaWVyLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIHRva2VuVHlwZUluZGV4LFxyXG4gICAgICAgICAgICAgICAgdG9rZW5Nb2RpZmllckluZGV4XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGxhc3RQb3MubGluZSA9IHBvc2l0aW9uLmxpbmUgLSAxO1xyXG4gICAgICAgICAgICBsYXN0UG9zLmNvbHVtbiA9IHBvc2l0aW9uLmNvbHVtbiAtIDE7XHJcbiAgICB9XHJcblxyXG4gICAgcmVsZWFzZURvY3VtZW50U2VtYW50aWNUb2tlbnMocmVzdWx0SWQ6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgICAgIFxyXG4gICAgfVxyXG5cclxuXHJcblxyXG5cclxufSJdfQ==