import { ObjectDiagramVariant } from "./ObjectDiagramVariant.js";
import { Klass } from "../../../../compiler/types/Class.js";
import { ObjectClass } from "../../../../compiler/types/ObjectClass.js";
export class ListDiagram extends ObjectDiagramVariant {
    getSettingsElement() {
        var _a;
        let moduleStore = this.main.getCurrentWorkspace().moduleStore;
        let $element = jQuery('<span>Start der Liste:&nbsp;</span>');
        this.$selectElement = jQuery('<select></select>');
        $element.append(this.$selectElement);
        for (let module of moduleStore.getModules(false)) {
            let childSymbolTables = (_a = module.mainSymbolTable) === null || _a === void 0 ? void 0 : _a.childSymbolTables;
            if (childSymbolTables == null || childSymbolTables.length == 0)
                continue;
            let variableMap = childSymbolTables[0].variableMap;
            if (variableMap == null || childSymbolTables[0].classContext != null)
                continue;
            variableMap.forEach((variable, identifier) => {
                let type = variable.type;
                if (type != null && type instanceof Klass && type.module != null && !type.module.isSystemModule) {
                    let selected = identifier == this.rootIdentifier ? " selected" : "";
                    this.$selectElement.append('<option value="' + identifier + selected + '">' + identifier +
                        ' (Modul "' + module.file.name + '")</option>');
                }
            });
        }
        return $element;
    }
    getName() { return "Liste"; }
    updateDiagram() {
        var _a;
        let heap = this.main.getInterpreter().heap;
        let rootValue = (_a = heap[this.rootIdentifier]) === null || _a === void 0 ? void 0 : _a.value;
        if (rootValue == null) {
            this.objectDiagram.error("Konnte die Variable " + this.rootIdentifier + " nicht finden.");
            return;
        }
        if (rootValue.type == null || !(rootValue.type instanceof Klass)) {
            this.objectDiagram.error("Die Variable " + this.rootIdentifier + " zeigt auf kein Objekt.");
        }
        let klass = rootValue.type;
        let rto = rootValue.value;
        // if rootValue is self of self referncing type then this array holds values:
        let rootValueSelfReferenceType = this.analyzeSelfReference(klass);
        // ... else find referenced class which is of self referencing type;
        let attributesWithSelfReference = [];
        let selfReferenceType;
        if (rootValueSelfReferenceType == null) {
            let k = klass;
            while (k != null && !(k instanceof ObjectClass)) {
                for (let a of k.attributes) {
                    let value = rto.attributes[a.index];
                    if (!(value.type instanceof Klass))
                        continue;
                    if (selfReferenceType != null && selfReferenceType == a.type) {
                        attributesWithSelfReference.push(a.identifier);
                    }
                    else {
                        let sr = this.analyzeSelfReference(value.type);
                        if (sr != null) {
                            selfReferenceType = sr;
                        }
                    }
                }
                k = k.baseClass;
            }
        }
        if (rootValueSelfReferenceType == null && selfReferenceType == null) {
            this.objectDiagram.error("Konnte kein sich selbst referenzierendes Objekt finden.");
        }
        else {
            this.drawDiagram(rootValue, rootValueSelfReferenceType, attributesWithSelfReference, selfReferenceType);
        }
    }
    drawDiagram(rootValue, rootValueSelfReferenceType, attributesWithSelfReference, selfReferenceType) {
    }
    analyzeSelfReference(klass) {
        let tImplements = [];
        let tExtends;
        let k = klass;
        while (k != null && !(k instanceof ObjectClass)) {
            if (k.implements.length > 0)
                tImplements = tImplements.concat(k.implements);
            if (k.baseClass != null && !(k.baseClass instanceof ObjectClass)) {
                tExtends.push(k.baseClass);
            }
            k = k.baseClass;
        }
        k = klass;
        while (k != null && !(k instanceof ObjectClass)) {
            for (let a of k.attributes) {
                let type = a.type;
                if (tImplements.indexOf(type) >= 0 || tExtends.indexOf(type) >= 0) {
                    return type;
                }
            }
            k = k.baseClass;
        }
        return null;
    }
    clear() {
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlzdERpYWdyYW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvY2xpZW50L21haW4vZ3VpL2RpYWdyYW1zL29iamVjdGRpYWdyYW0vTGlzdERpYWdyYW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDakUsT0FBTyxFQUFFLEtBQUssRUFBeUIsTUFBTSxxQ0FBcUMsQ0FBQztBQUVuRixPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sMkNBQTJDLENBQUM7QUFTeEUsTUFBTSxPQUFPLFdBQVksU0FBUSxvQkFBb0I7SUFNakQsa0JBQWtCOztRQUVkLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxXQUFXLENBQUM7UUFFOUQsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLHFDQUFxQyxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUNsRCxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUVyQyxLQUFLLElBQUksTUFBTSxJQUFJLFdBQVcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDOUMsSUFBSSxpQkFBaUIsU0FBRyxNQUFNLENBQUMsZUFBZSwwQ0FBRSxpQkFBaUIsQ0FBQztZQUNsRSxJQUFJLGlCQUFpQixJQUFJLElBQUksSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLElBQUksQ0FBQztnQkFBRSxTQUFTO1lBQ3pFLElBQUksV0FBVyxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztZQUNuRCxJQUFJLFdBQVcsSUFBSSxJQUFJLElBQUksaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxJQUFJLElBQUk7Z0JBQUUsU0FBUztZQUMv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S0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsVUFBVSxFQUFFO2dCQUN4QixJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNsQixJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQVksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNqRixPQUEwQixJQUFJLENBQUM7aUJBQ2xDO2FBQ0o7WUFFRCxDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQztTQUNuQjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBRWhCLENBQUM7SUFFRCxLQUFLO0lBRUwsQ0FBQztDQU1KIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JqZWN0RGlhZ3JhbVZhcmlhbnQgfSBmcm9tIFwiLi9PYmplY3REaWFncmFtVmFyaWFudC5qc1wiO1xyXG5pbXBvcnQgeyBLbGFzcywgSW50ZXJmYWNlLCBWaXNpYmlsaXR5IH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbXBpbGVyL3R5cGVzL0NsYXNzLmpzXCI7XHJcbmltcG9ydCB7IFZhcmlhYmxlLCBWYWx1ZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21waWxlci90eXBlcy9UeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBPYmplY3RDbGFzcyB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21waWxlci90eXBlcy9PYmplY3RDbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBSdW50aW1lT2JqZWN0IH0gZnJvbSBcIi4uLy4uLy4uLy4uL2ludGVycHJldGVyL1J1bnRpbWVPYmplY3QuanNcIjtcclxuXHJcbnR5cGUgUmVmZXJlbmNlID0ge1xyXG4gICAgc291cmNlVmFsdWU6IFJ1bnRpbWVPYmplY3QsXHJcbiAgICBkZXN0VmFsdWU6IFJ1bnRpbWVPYmplY3QsXHJcbiAgICBhdHRyaWJ1dGVJZGVudGlmaWVyOiBzdHJpbmdcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIExpc3REaWFncmFtIGV4dGVuZHMgT2JqZWN0RGlhZ3JhbVZhcmlhbnQge1xyXG5cclxuICAgIHJvb3RJZGVudGlmaWVyOiBzdHJpbmc7XHJcblxyXG4gICAgJHNlbGVjdEVsZW1lbnQ6IEpRdWVyeTxIVE1MU2VsZWN0RWxlbWVudD47XHJcblxyXG4gICAgZ2V0U2V0dGluZ3NFbGVtZW50KCk6IEpRdWVyeTxIVE1MRWxlbWVudD4ge1xyXG5cclxuICAgICAgICBsZXQgbW9kdWxlU3RvcmUgPSB0aGlzLm1haW4uZ2V0Q3VycmVudFdvcmtzcGFjZSgpLm1vZHVsZVN0b3JlO1xyXG5cclxuICAgICAgICBsZXQgJGVsZW1lbnQgPSBqUXVlcnkoJzxzcGFuPlN0YXJ0IGRlciBMaXN0ZTombmJzcDs8L3NwYW4+Jyk7XHJcbiAgICAgICAgdGhpcy4kc2VsZWN0RWxlbWVudCA9IGpRdWVyeSgnPHNlbGVjdD48L3NlbGVjdD4nKTtcclxuICAgICAgICAkZWxlbWVudC5hcHBlbmQodGhpcy4kc2VsZWN0RWxlbWVudCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IG1vZHVsZSBvZiBtb2R1bGVTdG9yZS5nZXRNb2R1bGVzKGZhbHNlKSkge1xyXG4gICAgICAgICAgICBsZXQgY2hpbGRTeW1ib2xUYWJsZXMgPSBtb2R1bGUubWFpblN5bWJvbFRhYmxlPy5jaGlsZFN5bWJvbFRhYmxlcztcclxuICAgICAgICAgICAgaWYgKGNoaWxkU3ltYm9sVGFibGVzID09IG51bGwgfHwgY2hpbGRTeW1ib2xUYWJsZXMubGVuZ3RoID09IDApIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBsZXQgdmFyaWFibGVNYXAgPSBjaGlsZFN5bWJvbFRhYmxlc1swXS52YXJpYWJsZU1hcDtcclxuICAgICAgICAgICAgaWYgKHZhcmlhYmxlTWFwID09IG51bGwgfHwgY2hpbGRTeW1ib2xUYWJsZXNbMF0uY2xhc3NDb250ZXh0ICE9IG51bGwpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB2YXJpYWJsZU1hcC5mb3JFYWNoKCh2YXJpYWJsZSwgaWRlbnRpZmllcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHR5cGUgPSB2YXJpYWJsZS50eXBlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgIT0gbnVsbCAmJiB0eXBlIGluc3RhbmNlb2YgS2xhc3MgJiYgdHlwZS5tb2R1bGUgIT0gbnVsbCAmJiAhdHlwZS5tb2R1bGUuaXNTeXN0ZW1Nb2R1bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2VsZWN0ZWQ6IHN0cmluZyA9IGlkZW50aWZpZXIgPT0gdGhpcy5yb290SWRlbnRpZmllciA/IFwiIHNlbGVjdGVkXCIgOiBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJHNlbGVjdEVsZW1lbnQuYXBwZW5kKCc8b3B0aW9uIHZhbHVlPVwiJyArIGlkZW50aWZpZXIgKyBzZWxlY3RlZCArICdcIj4nICsgaWRlbnRpZmllciArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICcgKE1vZHVsIFwiJyArIG1vZHVsZS5maWxlLm5hbWUgKyAnXCIpPC9vcHRpb24+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICRlbGVtZW50O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXROYW1lKCk6IHN0cmluZyB7IHJldHVybiBcIkxpc3RlXCIgfVxyXG5cclxuICAgIHVwZGF0ZURpYWdyYW0oKTogdm9pZCB7XHJcblxyXG4gICAgICAgIGxldCBoZWFwID0gdGhpcy5tYWluLmdldEludGVycHJldGVyKCkuaGVhcDtcclxuICAgICAgICBsZXQgcm9vdFZhbHVlID0gaGVhcFt0aGlzLnJvb3RJZGVudGlmaWVyXT8udmFsdWU7XHJcbiAgICAgICAgaWYgKHJvb3RWYWx1ZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMub2JqZWN0RGlhZ3JhbS5lcnJvcihcIktvbm50ZSBkaWUgVmFyaWFibGUgXCIgKyB0aGlzLnJvb3RJZGVudGlmaWVyICsgXCIgbmljaHQgZmluZGVuLlwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJvb3RWYWx1ZS50eXBlID09IG51bGwgfHwgIShyb290VmFsdWUudHlwZSBpbnN0YW5jZW9mIEtsYXNzKSkge1xyXG4gICAgICAgICAgICB0aGlzLm9iamVjdERpYWdyYW0uZXJyb3IoXCJEaWUgVmFyaWFibGUgXCIgKyB0aGlzLnJvb3RJZGVudGlmaWVyICsgXCIgemVpZ3QgYXVmIGtlaW4gT2JqZWt0LlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBrbGFzczogS2xhc3MgPSA8S2xhc3M+cm9vdFZhbHVlLnR5cGU7XHJcbiAgICAgICAgbGV0IHJ0bzogUnVudGltZU9iamVjdCA9IHJvb3RWYWx1ZS52YWx1ZTtcclxuXHJcbiAgICAgICAgLy8gaWYgcm9vdFZhbHVlIGlzIHNlbGYgb2Ygc2VsZiByZWZlcm5jaW5nIHR5cGUgdGhlbiB0aGlzIGFycmF5IGhvbGRzIHZhbHVlczpcclxuICAgICAgICBsZXQgcm9vdFZhbHVlU2VsZlJlZmVyZW5jZVR5cGUgPSB0aGlzLmFuYWx5emVTZWxmUmVmZXJlbmNlKGtsYXNzKTtcclxuXHJcbiAgICAgICAgLy8gLi4uIGVsc2UgZmluZCByZWZlcmVuY2VkIGNsYXNzIHdoaWNoIGlzIG9mIHNlbGYgcmVmZXJlbmNpbmcgdHlwZTtcclxuICAgICAgICBsZXQgYXR0cmlidXRlc1dpdGhTZWxmUmVmZXJlbmNlOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgIGxldCBzZWxmUmVmZXJlbmNlVHlwZTogS2xhc3MgfCBJbnRlcmZhY2U7XHJcblxyXG4gICAgICAgIGlmIChyb290VmFsdWVTZWxmUmVmZXJlbmNlVHlwZSA9PSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgayA9IGtsYXNzO1xyXG4gICAgICAgICAgICB3aGlsZSAoayAhPSBudWxsICYmICEoayBpbnN0YW5jZW9mIE9iamVjdENsYXNzKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGEgb2Ygay5hdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gcnRvLmF0dHJpYnV0ZXNbYS5pbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodmFsdWUudHlwZSBpbnN0YW5jZW9mIEtsYXNzKSkgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGZSZWZlcmVuY2VUeXBlICE9IG51bGwgJiYgc2VsZlJlZmVyZW5jZVR5cGUgPT0gYS50eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXNXaXRoU2VsZlJlZmVyZW5jZS5wdXNoKGEuaWRlbnRpZmllcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNyID0gdGhpcy5hbmFseXplU2VsZlJlZmVyZW5jZSh2YWx1ZS50eXBlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNyICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGZSZWZlcmVuY2VUeXBlID0gc3I7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgayA9IGsuYmFzZUNsYXNzO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJvb3RWYWx1ZVNlbGZSZWZlcmVuY2VUeXBlID09IG51bGwgJiYgc2VsZlJlZmVyZW5jZVR5cGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLm9iamVjdERpYWdyYW0uZXJyb3IoXCJLb25udGUga2VpbiBzaWNoIHNlbGJzdCByZWZlcmVuemllcmVuZGVzIE9iamVrdCBmaW5kZW4uXCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0RpYWdyYW0ocm9vdFZhbHVlLCByb290VmFsdWVTZWxmUmVmZXJlbmNlVHlwZSwgYXR0cmlidXRlc1dpdGhTZWxmUmVmZXJlbmNlLCBzZWxmUmVmZXJlbmNlVHlwZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIGRyYXdEaWFncmFtKHJvb3RWYWx1ZTogVmFsdWUsIHJvb3RWYWx1ZVNlbGZSZWZlcmVuY2VUeXBlOiBLbGFzcyB8IEludGVyZmFjZSxcclxuICAgICAgICBhdHRyaWJ1dGVzV2l0aFNlbGZSZWZlcmVuY2U6IHN0cmluZ1tdLCBzZWxmUmVmZXJlbmNlVHlwZTogS2xhc3MgfCBJbnRlcmZhY2UpIHtcclxuXHJcbiAgICAgICAgXHJcblxyXG5cclxuICAgIH1cclxuXHJcblxyXG4gICAgYW5hbHl6ZVNlbGZSZWZlcmVuY2Uoa2xhc3M6IEtsYXNzKTogS2xhc3MgfCBJbnRlcmZhY2Uge1xyXG5cclxuICAgICAgICBsZXQgdEltcGxlbWVudHM6IEludGVyZmFjZVtdID0gW107XHJcbiAgICAgICAgbGV0IHRFeHRlbmRzOiBLbGFzc1tdO1xyXG5cclxuICAgICAgICBsZXQgayA9IGtsYXNzO1xyXG4gICAgICAgIHdoaWxlIChrICE9IG51bGwgJiYgIShrIGluc3RhbmNlb2YgT2JqZWN0Q2xhc3MpKSB7XHJcbiAgICAgICAgICAgIGlmIChrLmltcGxlbWVudHMubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgIHRJbXBsZW1lbnRzID0gdEltcGxlbWVudHMuY29uY2F0KGsuaW1wbGVtZW50cyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoay5iYXNlQ2xhc3MgIT0gbnVsbCAmJiAhKGsuYmFzZUNsYXNzIGluc3RhbmNlb2YgT2JqZWN0Q2xhc3MpKSB7XHJcbiAgICAgICAgICAgICAgICB0RXh0ZW5kcy5wdXNoKGsuYmFzZUNsYXNzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBrID0gay5iYXNlQ2xhc3M7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBrID0ga2xhc3M7XHJcbiAgICAgICAgd2hpbGUgKGsgIT0gbnVsbCAmJiAhKGsgaW5zdGFuY2VvZiBPYmplY3RDbGFzcykpIHtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGEgb2Ygay5hdHRyaWJ1dGVzKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdHlwZSA9IGEudHlwZTtcclxuICAgICAgICAgICAgICAgIGlmICh0SW1wbGVtZW50cy5pbmRleE9mKDxJbnRlcmZhY2U+dHlwZSkgPj0gMCB8fCB0RXh0ZW5kcy5pbmRleE9mKDxLbGFzcz50eXBlKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxLbGFzcyB8IEludGVyZmFjZT50eXBlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBrID0gay5iYXNlQ2xhc3M7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXIoKTogdm9pZCB7XHJcblxyXG4gICAgfVxyXG5cclxuXHJcblxyXG5cclxuXHJcbn0iXX0=