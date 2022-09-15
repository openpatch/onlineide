import { Attribute } from "../../compiler/types/Types.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
export class KeyClass extends Klass {
    constructor(module) {
        super("Key", module, "Aufzählung von Sondertasten zur Benutzung in den Methoden Actor.onKeyUp, Actor.onKeyTyped und Actor.onKeyDown");
        this.setBaseClass(module.typeStore.getType("Object"));
        this.addAttribute(new Attribute("ArrowUp", stringPrimitiveType, (value) => { value.value = "ArrowUp"; }, true, Visibility.public, true, ""));
        this.addAttribute(new Attribute("ArrowDown", stringPrimitiveType, (value) => { value.value = "ArrowDown"; }, true, Visibility.public, true, ""));
        this.addAttribute(new Attribute("ArrowLeft", stringPrimitiveType, (value) => { value.value = "ArrowLeft"; }, true, Visibility.public, true, ""));
        this.addAttribute(new Attribute("ArrowRight", stringPrimitiveType, (value) => { value.value = "ArrowRight"; }, true, Visibility.public, true, ""));
        this.addAttribute(new Attribute("Enter", stringPrimitiveType, (value) => { value.value = "Enter"; }, true, Visibility.public, true, ""));
        this.addAttribute(new Attribute("Space", stringPrimitiveType, (value) => { value.value = " "; }, true, Visibility.public, true, ""));
        this.addAttribute(new Attribute("Shift", stringPrimitiveType, (value) => { value.value = "Shift"; }, true, Visibility.public, true, ""));
        this.addAttribute(new Attribute("Alt", stringPrimitiveType, (value) => { value.value = "Alt"; }, true, Visibility.public, true, ""));
        this.addAttribute(new Attribute("Strg", stringPrimitiveType, (value) => { value.value = "Control"; }, true, Visibility.public, true, ""));
        this.addAttribute(new Attribute("PageUp", stringPrimitiveType, (value) => { value.value = "PageUp"; }, true, Visibility.public, true, ""));
        this.addAttribute(new Attribute("PageDown", stringPrimitiveType, (value) => { value.value = "PageDown"; }, true, Visibility.public, true, ""));
        this.addAttribute(new Attribute("Backspace", stringPrimitiveType, (value) => { value.value = "Backspace"; }, true, Visibility.public, true, ""));
        this.addAttribute(new Attribute("Escape", stringPrimitiveType, (value) => { value.value = "Escape"; }, true, Visibility.public, true, ""));
        this.addAttribute(new Attribute("Entf", stringPrimitiveType, (value) => { value.value = "Delete"; }, true, Visibility.public, true, ""));
        this.addAttribute(new Attribute("Einf", stringPrimitiveType, (value) => { value.value = "Insert"; }, true, Visibility.public, true, ""));
        this.addAttribute(new Attribute("Ende", stringPrimitiveType, (value) => { value.value = "End"; }, true, Visibility.public, true, ""));
        this.staticClass.setupAttributeIndicesRecursive();
        this.staticClass.classObject = new RuntimeObject(this.staticClass);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiS2V5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9LZXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFzQyxTQUFTLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUM5RixPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ2xFLE9BQU8sRUFBRSxtQkFBbUIsRUFBNkQsTUFBTSx3Q0FBd0MsQ0FBQztBQUd4SSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sb0NBQW9DLENBQUM7QUFFbkUsTUFBTSxPQUFPLFFBQVMsU0FBUSxLQUFLO0lBRS9CLFlBQVksTUFBYztRQUN0QixLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSwrR0FBK0csQ0FBQyxDQUFDO1FBRXRJLElBQUksQ0FBQyxZQUFZLENBQVEsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUU3RCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDLFNBQVMsRUFBRSxtQkFBbUIsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUksSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxXQUFXLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFBLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2hKLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxTQUFTLENBQUMsV0FBVyxFQUFFLG1CQUFtQixFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNoSixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDLFlBQVksRUFBRSxtQkFBbUIsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxZQUFZLENBQUEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEosSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFBLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3hJLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFLG1CQUFtQixFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNwSSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDeEksSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFBLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3BJLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFLG1CQUFtQixFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN6SSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRSxtQkFBbUIsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUksSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxVQUFVLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFBLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzlJLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxTQUFTLENBQUMsV0FBVyxFQUFFLG1CQUFtQixFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNoSixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRSxtQkFBbUIsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUksSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFBLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3hJLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFLG1CQUFtQixFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN4SSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRSxtQkFBbUIsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFckksSUFBSSxDQUFDLFdBQVcsQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO1FBRWxELElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxHQUFHLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUd2RSxDQUFDO0NBRUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUeXBlLCBNZXRob2QsIFBhcmFtZXRlcmxpc3QsIFZhbHVlLCBBdHRyaWJ1dGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgS2xhc3MsIFZpc2liaWxpdHkgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgc3RyaW5nUHJpbWl0aXZlVHlwZSwgZG91YmxlUHJpbWl0aXZlVHlwZSwgZmxvYXRQcmltaXRpdmVUeXBlLCBpbnRQcmltaXRpdmVUeXBlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL1ByaW1pdGl2ZVR5cGVzLmpzXCI7XHJcbmltcG9ydCB7IE1vZHVsZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci9wYXJzZXIvTW9kdWxlLmpzXCI7XHJcbmltcG9ydCB7IFByaW50TWFuYWdlciB9IGZyb20gXCIuLi8uLi9tYWluL2d1aS9QcmludE1hbmFnZXIuanNcIjtcclxuaW1wb3J0IHsgUnVudGltZU9iamVjdCB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9SdW50aW1lT2JqZWN0LmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgS2V5Q2xhc3MgZXh0ZW5kcyBLbGFzcyB7XHJcblxyXG4gICAgY29uc3RydWN0b3IobW9kdWxlOiBNb2R1bGUpIHtcclxuICAgICAgICBzdXBlcihcIktleVwiLCBtb2R1bGUsIFwiQXVmesOkaGx1bmcgdm9uIFNvbmRlcnRhc3RlbiB6dXIgQmVudXR6dW5nIGluIGRlbiBNZXRob2RlbiBBY3Rvci5vbktleVVwLCBBY3Rvci5vbktleVR5cGVkIHVuZCBBY3Rvci5vbktleURvd25cIik7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0QmFzZUNsYXNzKDxLbGFzcz5tb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJPYmplY3RcIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZEF0dHJpYnV0ZShuZXcgQXR0cmlidXRlKFwiQXJyb3dVcFwiLCBzdHJpbmdQcmltaXRpdmVUeXBlLCAodmFsdWUpID0+IHsgdmFsdWUudmFsdWUgPSBcIkFycm93VXBcIiB9LCB0cnVlLCBWaXNpYmlsaXR5LnB1YmxpYywgdHJ1ZSwgXCJcIikpO1xyXG4gICAgICAgIHRoaXMuYWRkQXR0cmlidXRlKG5ldyBBdHRyaWJ1dGUoXCJBcnJvd0Rvd25cIiwgc3RyaW5nUHJpbWl0aXZlVHlwZSwgKHZhbHVlKSA9PiB7IHZhbHVlLnZhbHVlID0gXCJBcnJvd0Rvd25cIiB9LCB0cnVlLCBWaXNpYmlsaXR5LnB1YmxpYywgdHJ1ZSwgXCJcIikpO1xyXG4gICAgICAgIHRoaXMuYWRkQXR0cmlidXRlKG5ldyBBdHRyaWJ1dGUoXCJBcnJvd0xlZnRcIiwgc3RyaW5nUHJpbWl0aXZlVHlwZSwgKHZhbHVlKSA9PiB7IHZhbHVlLnZhbHVlID0gXCJBcnJvd0xlZnRcIiB9LCB0cnVlLCBWaXNpYmlsaXR5LnB1YmxpYywgdHJ1ZSwgXCJcIikpO1xyXG4gICAgICAgIHRoaXMuYWRkQXR0cmlidXRlKG5ldyBBdHRyaWJ1dGUoXCJBcnJvd1JpZ2h0XCIsIHN0cmluZ1ByaW1pdGl2ZVR5cGUsICh2YWx1ZSkgPT4geyB2YWx1ZS52YWx1ZSA9IFwiQXJyb3dSaWdodFwiIH0sIHRydWUsIFZpc2liaWxpdHkucHVibGljLCB0cnVlLCBcIlwiKSk7XHJcbiAgICAgICAgdGhpcy5hZGRBdHRyaWJ1dGUobmV3IEF0dHJpYnV0ZShcIkVudGVyXCIsIHN0cmluZ1ByaW1pdGl2ZVR5cGUsICh2YWx1ZSkgPT4geyB2YWx1ZS52YWx1ZSA9IFwiRW50ZXJcIiB9LCB0cnVlLCBWaXNpYmlsaXR5LnB1YmxpYywgdHJ1ZSwgXCJcIikpO1xyXG4gICAgICAgIHRoaXMuYWRkQXR0cmlidXRlKG5ldyBBdHRyaWJ1dGUoXCJTcGFjZVwiLCBzdHJpbmdQcmltaXRpdmVUeXBlLCAodmFsdWUpID0+IHsgdmFsdWUudmFsdWUgPSBcIiBcIiB9LCB0cnVlLCBWaXNpYmlsaXR5LnB1YmxpYywgdHJ1ZSwgXCJcIikpO1xyXG4gICAgICAgIHRoaXMuYWRkQXR0cmlidXRlKG5ldyBBdHRyaWJ1dGUoXCJTaGlmdFwiLCBzdHJpbmdQcmltaXRpdmVUeXBlLCAodmFsdWUpID0+IHsgdmFsdWUudmFsdWUgPSBcIlNoaWZ0XCIgfSwgdHJ1ZSwgVmlzaWJpbGl0eS5wdWJsaWMsIHRydWUsIFwiXCIpKTtcclxuICAgICAgICB0aGlzLmFkZEF0dHJpYnV0ZShuZXcgQXR0cmlidXRlKFwiQWx0XCIsIHN0cmluZ1ByaW1pdGl2ZVR5cGUsICh2YWx1ZSkgPT4geyB2YWx1ZS52YWx1ZSA9IFwiQWx0XCIgfSwgdHJ1ZSwgVmlzaWJpbGl0eS5wdWJsaWMsIHRydWUsIFwiXCIpKTtcclxuICAgICAgICB0aGlzLmFkZEF0dHJpYnV0ZShuZXcgQXR0cmlidXRlKFwiU3RyZ1wiLCBzdHJpbmdQcmltaXRpdmVUeXBlLCAodmFsdWUpID0+IHsgdmFsdWUudmFsdWUgPSBcIkNvbnRyb2xcIiB9LCB0cnVlLCBWaXNpYmlsaXR5LnB1YmxpYywgdHJ1ZSwgXCJcIikpO1xyXG4gICAgICAgIHRoaXMuYWRkQXR0cmlidXRlKG5ldyBBdHRyaWJ1dGUoXCJQYWdlVXBcIiwgc3RyaW5nUHJpbWl0aXZlVHlwZSwgKHZhbHVlKSA9PiB7IHZhbHVlLnZhbHVlID0gXCJQYWdlVXBcIiB9LCB0cnVlLCBWaXNpYmlsaXR5LnB1YmxpYywgdHJ1ZSwgXCJcIikpO1xyXG4gICAgICAgIHRoaXMuYWRkQXR0cmlidXRlKG5ldyBBdHRyaWJ1dGUoXCJQYWdlRG93blwiLCBzdHJpbmdQcmltaXRpdmVUeXBlLCAodmFsdWUpID0+IHsgdmFsdWUudmFsdWUgPSBcIlBhZ2VEb3duXCIgfSwgdHJ1ZSwgVmlzaWJpbGl0eS5wdWJsaWMsIHRydWUsIFwiXCIpKTtcclxuICAgICAgICB0aGlzLmFkZEF0dHJpYnV0ZShuZXcgQXR0cmlidXRlKFwiQmFja3NwYWNlXCIsIHN0cmluZ1ByaW1pdGl2ZVR5cGUsICh2YWx1ZSkgPT4geyB2YWx1ZS52YWx1ZSA9IFwiQmFja3NwYWNlXCIgfSwgdHJ1ZSwgVmlzaWJpbGl0eS5wdWJsaWMsIHRydWUsIFwiXCIpKTtcclxuICAgICAgICB0aGlzLmFkZEF0dHJpYnV0ZShuZXcgQXR0cmlidXRlKFwiRXNjYXBlXCIsIHN0cmluZ1ByaW1pdGl2ZVR5cGUsICh2YWx1ZSkgPT4geyB2YWx1ZS52YWx1ZSA9IFwiRXNjYXBlXCIgfSwgdHJ1ZSwgVmlzaWJpbGl0eS5wdWJsaWMsIHRydWUsIFwiXCIpKTtcclxuICAgICAgICB0aGlzLmFkZEF0dHJpYnV0ZShuZXcgQXR0cmlidXRlKFwiRW50ZlwiLCBzdHJpbmdQcmltaXRpdmVUeXBlLCAodmFsdWUpID0+IHsgdmFsdWUudmFsdWUgPSBcIkRlbGV0ZVwiIH0sIHRydWUsIFZpc2liaWxpdHkucHVibGljLCB0cnVlLCBcIlwiKSk7XHJcbiAgICAgICAgdGhpcy5hZGRBdHRyaWJ1dGUobmV3IEF0dHJpYnV0ZShcIkVpbmZcIiwgc3RyaW5nUHJpbWl0aXZlVHlwZSwgKHZhbHVlKSA9PiB7IHZhbHVlLnZhbHVlID0gXCJJbnNlcnRcIiB9LCB0cnVlLCBWaXNpYmlsaXR5LnB1YmxpYywgdHJ1ZSwgXCJcIikpO1xyXG4gICAgICAgIHRoaXMuYWRkQXR0cmlidXRlKG5ldyBBdHRyaWJ1dGUoXCJFbmRlXCIsIHN0cmluZ1ByaW1pdGl2ZVR5cGUsICh2YWx1ZSkgPT4geyB2YWx1ZS52YWx1ZSA9IFwiRW5kXCIgfSwgdHJ1ZSwgVmlzaWJpbGl0eS5wdWJsaWMsIHRydWUsIFwiXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5zdGF0aWNDbGFzcy5zZXR1cEF0dHJpYnV0ZUluZGljZXNSZWN1cnNpdmUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5zdGF0aWNDbGFzcy5jbGFzc09iamVjdCA9IG5ldyBSdW50aW1lT2JqZWN0KHRoaXMuc3RhdGljQ2xhc3MpO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG59Il19