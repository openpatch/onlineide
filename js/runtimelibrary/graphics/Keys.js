import { Attribute } from "../../compiler/types/Types.js";
import { Klass, Visibility } from "../../compiler/types/Class.js";
import { stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
export class KeysClass extends Klass {
    constructor(module) {
        super("Keys", module);
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
        this.staticClass.classObject = new RuntimeObject(this.staticClass);
        this.staticClass.classObject.initializeAttributeValues();
    }
}
//# sourceMappingURL=Keys.js.map