import { Klass, Visibility } from "../../compiler/types/Class.js";
import { intPrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Attribute, Method, Parameterlist } from "../../compiler/types/Types.js";
import { TextHelper } from "../graphics/Text.js";
export class GNGTextClass extends Klass {
    constructor(module, moduleStore) {
        super("GText", module, "Text-Klasse der Graphics'n Games-Bibliothek (Cornelsen-Verlag)");
        this.setBaseClass(module.typeStore.getType("GNGBaseFigur"));
        this.addAttribute(new Attribute("text", stringPrimitiveType, (value) => {
            let text = value.object.intrinsicData["Actor"].text;
            value.value = text;
        }, false, Visibility.private, false, "Angezeigter Text"));
        this.addAttribute(new Attribute("textgröße", intPrimitiveType, (value) => {
            let fontsize = value.object.intrinsicData["Actor"].fontsize;
            value.value = Math.round(fontsize);
        }, false, Visibility.private, false, "Textgröße"));
        this.setupAttributeIndicesRecursive();
        this.addMethod(new Method("Text", new Parameterlist([]), null, (parameters) => {
            let o = parameters[0].value;
            o.intrinsicData["isGNG"] = true;
            let rh = new TextHelper(2, -8, 12, "Text", module.main.getInterpreter(), o);
            o.intrinsicData["moveAnchor"] = { x: 6, y: 16 };
            rh.setFillColor(0);
            o.intrinsicData["Actor"] = rh;
        }, false, false, 'Instanziert ein neues Text-Objekt.', true));
        this.addMethod(new Method("TextSetzen", new Parameterlist([
            { identifier: "text", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            let text = parameters[1].value;
            if (sh.testdestroyed("TextSetzen"))
                return;
            sh.setText(text);
        }, false, false, "Ändert den Text des Text-Objekts.", false));
        this.addMethod(new Method("TextGrößeSetzen", new Parameterlist([
            { identifier: "textGröße", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            let größe = parameters[1].value;
            if (sh.testdestroyed("TextGrößeSetzen"))
                return;
            sh.setFontsize(größe);
        }, false, false, "Setzt die Schriftgröße des Text-Objekts.", false));
        this.addMethod(new Method("TextVergrößern", new Parameterlist([]), null, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("TextVergrößern"))
                return;
            let size = sh.fontsize;
            if (size <= 10) {
                size += 1;
            }
            else if (size <= 40) {
                size += 2;
            }
            else {
                size += 4;
            }
            sh.setFontsize(size);
        }, false, false, "Vergrößert die Schriftgröße des Text-Objekts.", false));
        this.addMethod(new Method("TextVerkleinern", new Parameterlist([]), null, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("TextVerkleinern"))
                return;
            let size = sh.fontsize;
            if (size <= 10) {
                size -= 1;
            }
            else if (size <= 40) {
                size -= 2;
            }
            else {
                size -= 4;
            }
            if (size < 1) {
                size = 1;
            }
            sh.setFontsize(size);
        }, false, false, "Verkleinert die Schriftgröße des Text-Objekts.", false));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR05HVGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jbGllbnQvcnVudGltZWxpYnJhcnkvZ25nL0dOR1RleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUNsRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQztBQUMvRixPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQVMsTUFBTSwrQkFBK0IsQ0FBQztBQUd4RixPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFFakQsTUFBTSxPQUFPLFlBQWEsU0FBUSxLQUFLO0lBRW5DLFlBQVksTUFBYyxFQUFFLFdBQXdCO1FBRWhELEtBQUssQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLGdFQUFnRSxDQUFDLENBQUM7UUFFekYsSUFBSSxDQUFDLFlBQVksQ0FBUSxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBRW5FLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFLG1CQUFtQixFQUFFLENBQUMsS0FBWSxFQUFFLEVBQUU7WUFDMUUsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ3BELEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLENBQUMsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1FBRTFELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxTQUFTLENBQUMsV0FBVyxFQUFFLGdCQUFnQixFQUFFLENBQUMsS0FBWSxFQUFFLEVBQUU7WUFD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QyxDQUFDLEtBQUssQ0FBQztZQUMzQyxJQUFJLEVBQUUsR0FBZSxDQUFDLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTlDLElBQUksRUFBRSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQztnQkFBRSxPQUFPO1lBRWhELElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUM7WUFDdkIsSUFBSSxJQUFJLElBQUksRUFBRSxFQUFFO2dCQUNaLElBQUksSUFBSSxDQUFDLENBQUM7YUFDYjtpQkFDSSxJQUFJLElBQUksSUFBSSxFQUFFLEVBQUU7Z0JBQ2pCLElBQUksSUFBSSxDQUFDLENBQUM7YUFDYjtpQkFDSTtnQkFDRCxJQUFJLElBQUksQ0FBQyxDQUFDO2FBQ2I7WUFDRCxJQUFJLElBQUksR0FBRyxDQUFDLEVBQUU7Z0JBQ1YsSUFBSSxHQUFHLENBQUMsQ0FBQzthQUNaO1lBR0QsRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV6QixDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxnREFBZ0QsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBSW5GLENBQUM7Q0FFSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZHVsZSwgTW9kdWxlU3RvcmUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xuaW1wb3J0IHsgS2xhc3MsIFZpc2liaWxpdHkgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvQ2xhc3MuanNcIjtcbmltcG9ydCB7IGludFByaW1pdGl2ZVR5cGUsIHN0cmluZ1ByaW1pdGl2ZVR5cGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvUHJpbWl0aXZlVHlwZXMuanNcIjtcbmltcG9ydCB7IEF0dHJpYnV0ZSwgTWV0aG9kLCBQYXJhbWV0ZXJsaXN0LCBWYWx1ZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9UeXBlcy5qc1wiO1xuaW1wb3J0IHsgUnVudGltZU9iamVjdCB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9SdW50aW1lT2JqZWN0LmpzXCI7XG5pbXBvcnQgeyBDaXJjbGVIZWxwZXIgfSBmcm9tIFwiLi4vZ3JhcGhpY3MvQ2lyY2xlLmpzXCI7XG5pbXBvcnQgeyBUZXh0SGVscGVyIH0gZnJvbSBcIi4uL2dyYXBoaWNzL1RleHQuanNcIjtcblxuZXhwb3J0IGNsYXNzIEdOR1RleHRDbGFzcyBleHRlbmRzIEtsYXNzIHtcblxuICAgIGNvbnN0cnVjdG9yKG1vZHVsZTogTW9kdWxlLCBtb2R1bGVTdG9yZTogTW9kdWxlU3RvcmUpIHtcblxuICAgICAgICBzdXBlcihcIkdUZXh0XCIsIG1vZHVsZSwgXCJUZXh0LUtsYXNzZSBkZXIgR3JhcGhpY3MnbiBHYW1lcy1CaWJsaW90aGVrIChDb3JuZWxzZW4tVmVybGFnKVwiKTtcblxuICAgICAgICB0aGlzLnNldEJhc2VDbGFzcyg8S2xhc3M+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiR05HQmFzZUZpZ3VyXCIpKTtcblxuICAgICAgICB0aGlzLmFkZEF0dHJpYnV0ZShuZXcgQXR0cmlidXRlKFwidGV4dFwiLCBzdHJpbmdQcmltaXRpdmVUeXBlLCAodmFsdWU6IFZhbHVlKSA9PiB7IFxuICAgICAgICAgICAgbGV0IHRleHQgPSB2YWx1ZS5vYmplY3QuaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdLnRleHQ7XG4gICAgICAgICAgICB2YWx1ZS52YWx1ZSA9IHRleHQ7IFxuICAgICAgICB9LCBmYWxzZSwgVmlzaWJpbGl0eS5wcml2YXRlLCBmYWxzZSwgXCJBbmdlemVpZ3RlciBUZXh0XCIpKTtcblxuICAgICAgICB0aGlzLmFkZEF0dHJpYnV0ZShuZXcgQXR0cmlidXRlKFwidGV4dGdyw7bDn2VcIiwgaW50UHJpbWl0aXZlVHlwZSwgKHZhbHVlOiBWYWx1ZSkgPT4geyBcbiAgICAgICAgICAgIGxldCBmb250c2l6ZSA9IHZhbHVlLm9iamVjdC5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl0uZm9udHNpemU7XG4gICAgICAgICAgICB2YWx1ZS52YWx1ZSA9IE1hdGgucm91bmQoZm9udHNpemUpOyBcbiAgICAgICAgfSwgZmFsc2UsIFZpc2liaWxpdHkucHJpdmF0ZSwgZmFsc2UsIFwiVGV4dGdyw7bDn2VcIikpO1xuXG4gICAgICAgIHRoaXMuc2V0dXBBdHRyaWJ1dGVJbmRpY2VzUmVjdXJzaXZlKCk7XG5cbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIlRleHRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW10pLCBudWxsLFxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcblxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcbiAgICAgICAgICAgICAgICBvLmludHJpbnNpY0RhdGFbXCJpc0dOR1wiXSA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBsZXQgcmggPSBuZXcgVGV4dEhlbHBlcigyLCAtOCwgMTIsIFwiVGV4dFwiLCBtb2R1bGUubWFpbi5nZXRJbnRlcnByZXRlcigpLCBvKTtcblxuICAgICAgICAgICAgICAgIG8uaW50cmluc2ljRGF0YVtcIm1vdmVBbmNob3JcIl0gPSB7eDogNiwgeTogMTZ9O1xuXG4gICAgICAgICAgICAgICAgcmguc2V0RmlsbENvbG9yKDApO1xuICAgICAgICAgICAgICAgIG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdID0gcmg7XG5cbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0luc3RhbnppZXJ0IGVpbiBuZXVlcyBUZXh0LU9iamVrdC4nLCB0cnVlKSk7XG5cbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIlRleHRTZXR6ZW5cIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInRleHRcIiwgdHlwZTogc3RyaW5nUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cbiAgICAgICAgXSksIG51bGwsXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xuXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xuICAgICAgICAgICAgICAgIGxldCBzaDogVGV4dEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xuICAgICAgICAgICAgICAgIGxldCB0ZXh0OiBzdHJpbmcgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJUZXh0U2V0emVuXCIpKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBzaC5zZXRUZXh0KHRleHQpO1xuXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsIFwiw4RuZGVydCBkZW4gVGV4dCBkZXMgVGV4dC1PYmpla3RzLlwiLCBmYWxzZSkpO1xuXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJUZXh0R3LDtsOfZVNldHplblwiLCBuZXcgUGFyYW1ldGVybGlzdChbXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwidGV4dEdyw7bDn2VcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cbiAgICAgICAgXSksIG51bGwsXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xuXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xuICAgICAgICAgICAgICAgIGxldCBzaDogVGV4dEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xuICAgICAgICAgICAgICAgIGxldCBncsO2w59lOiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJUZXh0R3LDtsOfZVNldHplblwiKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgc2guc2V0Rm9udHNpemUoZ3LDtsOfZSk7XG5cbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgXCJTZXR6dCBkaWUgU2NocmlmdGdyw7bDn2UgZGVzIFRleHQtT2JqZWt0cy5cIiwgZmFsc2UpKTtcblxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiVGV4dFZlcmdyw7bDn2VyblwiLCBuZXcgUGFyYW1ldGVybGlzdChbXG4gICAgICAgIF0pLCBudWxsLFxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcblxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcbiAgICAgICAgICAgICAgICBsZXQgc2g6IFRleHRIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcblxuICAgICAgICAgICAgICAgIGlmIChzaC50ZXN0ZGVzdHJveWVkKFwiVGV4dFZlcmdyw7bDn2VyblwiKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgbGV0IHNpemUgPSBzaC5mb250c2l6ZTtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA8PSAxMCkge1xuICAgICAgICAgICAgICAgICAgICBzaXplICs9IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNpemUgPD0gNDApIHtcbiAgICAgICAgICAgICAgICAgICAgc2l6ZSArPSAyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2l6ZSArPSA0O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNoLnNldEZvbnRzaXplKHNpemUpO1xuXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsIFwiVmVyZ3LDtsOfZXJ0IGRpZSBTY2hyaWZ0Z3LDtsOfZSBkZXMgVGV4dC1PYmpla3RzLlwiLCBmYWxzZSkpO1xuXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJUZXh0VmVya2xlaW5lcm5cIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xuICAgICAgICBdKSwgbnVsbCxcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XG4gICAgICAgICAgICAgICAgbGV0IHNoOiBUZXh0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XG5cbiAgICAgICAgICAgICAgICBpZiAoc2gudGVzdGRlc3Ryb3llZChcIlRleHRWZXJrbGVpbmVyblwiKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgbGV0IHNpemUgPSBzaC5mb250c2l6ZTtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA8PSAxMCkge1xuICAgICAgICAgICAgICAgICAgICBzaXplIC09IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNpemUgPD0gNDApIHtcbiAgICAgICAgICAgICAgICAgICAgc2l6ZSAtPSAyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2l6ZSAtPSA0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgc2l6ZSA9IDE7XG4gICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICBzaC5zZXRGb250c2l6ZShzaXplKTtcblxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCBcIlZlcmtsZWluZXJ0IGRpZSBTY2hyaWZ0Z3LDtsOfZSBkZXMgVGV4dC1PYmpla3RzLlwiLCBmYWxzZSkpO1xuXG5cblxuICAgIH1cblxufVxuXG4iXX0=