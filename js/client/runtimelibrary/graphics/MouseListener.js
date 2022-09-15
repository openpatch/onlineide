import { Interface, Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
export class MouseListenerInterface extends Interface {
    constructor(module) {
        super("MouseListener", module, "Interface mit Methoden, die aufgerufen werden, wenn Maus-Ereignisse eintreten. Ein Objekt dieser Klasse muss zuvor aber mit world.addMouseListener() registriert werden, wobei world das aktuelle World-Objekt ist.");
        this.addMethod(new Method("onMouseUp", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "button", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, null, // no implementation!
        false, false, "Wird aufgerufen, wenn eine Maustaste über dem Grafikbereich losgelassen wird."));
        this.addMethod(new Method("onMouseDown", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "button", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, null, // no implementation!
        false, false, "Wird aufgerufen, wenn eine Maustaste über dem Grafikbereich gedrückt wird."));
        this.addMethod(new Method("onMouseMove", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, null, // no implementation!
        false, false, "Wird aufgerufen, wenn der Mauszeiger über dem Grafikbereich bewegt wird."));
        this.addMethod(new Method("onMouseEnter", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, null, // no implementation!
        false, false, "Wird aufgerufen, wenn der Mauszeiger in den Grafikbereich hineinbewegt wird."));
        this.addMethod(new Method("onMouseLeave", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, null, // no implementation!
        false, false, "Wird aufgerufen, wenn der Mauszeiger aus dem Grafikbereich herausbewegt wird."));
    }
}
export class MouseAdapterClass extends Klass {
    constructor(module) {
        super("MouseAdapter", module, "Klasse mit leeren Methoden, die aufgerufen werden, wenn Maus-Ereignisse eintreten. Ein Objekt einer Kindklasse dieser Klasse muss zuvor aber mit world.addMouseListener() registriert werden, wobei world das aktuelle World-Objekt ist.");
        let mouseListenerType = module.typeStore.getType("MouseListener");
        this.implements.push(mouseListenerType);
        this.addMethod(new Method("onMouseUp", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "button", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, null, // no implementation!
        false, false, "Wird aufgerufen, wenn eine Maustaste über dem Grafikbereich losgelassen wird."));
        this.addMethod(new Method("onMouseDown", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "button", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, null, // no implementation!
        false, false, "Wird aufgerufen, wenn eine Maustaste über dem Grafikbereich gedrückt wird."));
        this.addMethod(new Method("onMouseMove", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, null, // no implementation!
        false, false, "Wird aufgerufen, wenn der Mauszeiger über dem Grafikbereich bewegt wird."));
        this.addMethod(new Method("onMouseEnter", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, null, // no implementation!
        false, false, "Wird aufgerufen, wenn der Mauszeiger in den Grafikbereich hineinbewegt wird."));
        this.addMethod(new Method("onMouseLeave", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, null, // no implementation!
        false, false, "Wird aufgerufen, wenn der Mauszeiger aus dem Grafikbereich herausbewegt wird."));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW91c2VMaXN0ZW5lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jbGllbnQvcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvTW91c2VMaXN0ZW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ2pFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHdDQUF3QyxDQUFDO0FBQ2xILE9BQU8sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFFdEUsTUFBTSxPQUFPLHNCQUF1QixTQUFRLFNBQVM7SUFFakQsWUFBWSxNQUFjO1FBQ3RCLEtBQUssQ0FBQyxlQUFlLEVBQUUsTUFBTSxFQUFFLHFOQUFxTixDQUFDLENBQUM7UUFFdFAsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxXQUFXLEVBQUUsSUFBSSxhQUFhLENBQUM7WUFDckQsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtZQUN0RyxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO1lBQ3RHLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7U0FDM0csQ0FBQyxFQUFFLGlCQUFpQixFQUNqQixJQUFJLEVBQUcscUJBQXFCO1FBQzVCLEtBQUssRUFB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LEVBQUU7U0FDekcsQ0FBQyxFQUFFLGlCQUFpQixFQUNqQixJQUFJLEVBQUcscUJBQXFCO1FBQzVCLEtBQUssRUFBRSxLQUFLLEVBQUUsOEVBQThFLENBQUMsQ0FBQyxDQUFDO1FBRW5HLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsY0FBYyxFQUFFLElBQUksYUFBYSxDQUFDO1lBQ3hELEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7WUFDdEcsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtTQUN6RyxDQUFDLEVBQUUsaUJBQWlCLEVBQ2pCLElBQUksRUFBRyxxQkFBcUI7UUFDNUIsS0FBSyxFQUFFLEtBQUssRUFBRSwrRUFBK0UsQ0FBQyxDQUFDLENBQUM7SUFHeEcsQ0FBQztDQUVKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgSW50ZXJmYWNlLCBLbGFzcyB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9DbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBkb3VibGVQcmltaXRpdmVUeXBlLCBpbnRQcmltaXRpdmVUeXBlLCB2b2lkUHJpbWl0aXZlVHlwZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBNZXRob2QsIFBhcmFtZXRlcmxpc3QgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvVHlwZXMuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBNb3VzZUxpc3RlbmVySW50ZXJmYWNlIGV4dGVuZHMgSW50ZXJmYWNlIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihtb2R1bGU6IE1vZHVsZSkge1xyXG4gICAgICAgIHN1cGVyKFwiTW91c2VMaXN0ZW5lclwiLCBtb2R1bGUsIFwiSW50ZXJmYWNlIG1pdCBNZXRob2RlbiwgZGllIGF1ZmdlcnVmZW4gd2VyZGVuLCB3ZW5uIE1hdXMtRXJlaWduaXNzZSBlaW50cmV0ZW4uIEVpbiBPYmpla3QgZGllc2VyIEtsYXNzZSBtdXNzIHp1dm9yIGFiZXIgbWl0IHdvcmxkLmFkZE1vdXNlTGlzdGVuZXIoKSByZWdpc3RyaWVydCB3ZXJkZW4sIHdvYmVpIHdvcmxkIGRhcyBha3R1ZWxsZSBXb3JsZC1PYmpla3QgaXN0LlwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIm9uTW91c2VVcFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ4XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwieVwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImJ1dHRvblwiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgdm9pZFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIG51bGwsICAvLyBubyBpbXBsZW1lbnRhdGlvbiFcclxuICAgICAgICAgICAgZmFsc2UsIGZhbHNlLCBcIldpcmQgYXVmZ2VydWZlbiwgd2VubiBlaW5lIE1hdXN0YXN0ZSDDvGJlciBkZW0gR3JhZmlrYmVyZWljaCBsb3NnZWxhc3NlbiB3aXJkLlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJvbk1vdXNlRG93blwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ4XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwieVwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImJ1dHRvblwiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgdm9pZFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIG51bGwsICAvLyBubyBpbXBsZW1lbnRhdGlvbiFcclxuICAgICAgICAgICAgZmFsc2UsIGZhbHNlLCBcIldpcmQgYXVmZ2VydWZlbiwgd2VubiBlaW5lIE1hdXN0YXN0ZSDDvGJlciBkZW0gR3JhZmlrYmVyZWljaCBnZWRyw7xja3Qgd2lyZC5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwib25Nb3VzZU1vdmVcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwieFwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInlcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgXSksIHZvaWRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICBudWxsLCAgLy8gbm8gaW1wbGVtZW50YXRpb24hXHJcbiAgICAgICAgICAgIGZhbHNlLCBmYWxzZSwgXCJXaXJkIGF1ZmdlcnVmZW4sIHdlbm4gZGVyIE1hdXN6ZWlnZXIgw7xiZXIgZGVtIEdyYWZpa2JlcmVpY2ggYmV3ZWd0IHdpcmQuXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIm9uTW91c2VFbnRlclwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ4XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwieVwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgdm9pZFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIG51bGwsICAvLyBubyBpbXBsZW1lbnRhdGlvbiFcclxuICAgICAgICAgICAgZmFsc2UsIGZhbHNlLCBcIldpcmQgYXVmZ2VydWZlbiwgd2VubiBkZXIgTWF1c3plaWdlciBpbiBkZW4gR3JhZmlrYmVyZWljaCBoaW5laW5iZXdlZ3Qgd2lyZC5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwib25Nb3VzZUxlYXZlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInhcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ5XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgbnVsbCwgIC8vIG5vIGltcGxlbWVudGF0aW9uIVxyXG4gICAgICAgICAgICBmYWxzZSwgZmFsc2UsIFwiV2lyZCBhdWZnZXJ1ZmVuLCB3ZW5uIGRlciBNYXVzemVpZ2VyIGF1cyBkZW0gR3JhZmlrYmVyZWljaCBoZXJhdXNiZXdlZ3Qgd2lyZC5cIikpO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTW91c2VBZGFwdGVyQ2xhc3MgZXh0ZW5kcyBLbGFzcyB7XHJcblxyXG4gICAgY29uc3RydWN0b3IobW9kdWxlOiBNb2R1bGUpIHtcclxuICAgICAgICBzdXBlcihcIk1vdXNlQWRhcHRlclwiLCBtb2R1bGUsIFwiS2xhc3NlIG1pdCBsZWVyZW4gTWV0aG9kZW4sIGRpZSBhdWZnZXJ1ZmVuIHdlcmRlbiwgd2VubiBNYXVzLUVyZWlnbmlzc2UgZWludHJldGVuLiBFaW4gT2JqZWt0IGVpbmVyIEtpbmRrbGFzc2UgZGllc2VyIEtsYXNzZSBtdXNzIHp1dm9yIGFiZXIgbWl0IHdvcmxkLmFkZE1vdXNlTGlzdGVuZXIoKSByZWdpc3RyaWVydCB3ZXJkZW4sIHdvYmVpIHdvcmxkIGRhcyBha3R1ZWxsZSBXb3JsZC1PYmpla3QgaXN0LlwiKTtcclxuXHJcbiAgICAgICAgbGV0IG1vdXNlTGlzdGVuZXJUeXBlID0gPE1vdXNlTGlzdGVuZXJJbnRlcmZhY2U+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiTW91c2VMaXN0ZW5lclwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5pbXBsZW1lbnRzLnB1c2gobW91c2VMaXN0ZW5lclR5cGUpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwib25Nb3VzZVVwXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInhcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ5XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiYnV0dG9uXCIsIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgbnVsbCwgIC8vIG5vIGltcGxlbWVudGF0aW9uIVxyXG4gICAgICAgICAgICBmYWxzZSwgZmFsc2UsIFwiV2lyZCBhdWZnZXJ1ZmVuLCB3ZW5uIGVpbmUgTWF1c3Rhc3RlIMO8YmVyIGRlbSBHcmFmaWtiZXJlaWNoIGxvc2dlbGFzc2VuIHdpcmQuXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIm9uTW91c2VEb3duXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInhcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ5XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiYnV0dG9uXCIsIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgbnVsbCwgIC8vIG5vIGltcGxlbWVudGF0aW9uIVxyXG4gICAgICAgICAgICBmYWxzZSwgZmFsc2UsIFwiV2lyZCBhdWZnZXJ1ZmVuLCB3ZW5uIGVpbmUgTWF1c3Rhc3RlIMO8YmVyIGRlbSBHcmFmaWtiZXJlaWNoIGdlZHLDvGNrdCB3aXJkLlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJvbk1vdXNlTW92ZVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ4XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwieVwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgdm9pZFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIG51bGwsICAvLyBubyBpbXBsZW1lbnRhdGlvbiFcclxuICAgICAgICAgICAgZmFsc2UsIGZhbHNlLCBcIldpcmQgYXVmZ2VydWZlbiwgd2VubiBkZXIgTWF1c3plaWdlciDDvGJlciBkZW0gR3JhZmlrYmVyZWljaCBiZXdlZ3Qgd2lyZC5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwib25Nb3VzZUVudGVyXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInhcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ5XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgbnVsbCwgIC8vIG5vIGltcGxlbWVudGF0aW9uIVxyXG4gICAgICAgICAgICBmYWxzZSwgZmFsc2UsIFwiV2lyZCBhdWZnZXJ1ZmVuLCB3ZW5uIGRlciBNYXVzemVpZ2VyIGluIGRlbiBHcmFmaWtiZXJlaWNoIGhpbmVpbmJld2VndCB3aXJkLlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJvbk1vdXNlTGVhdmVcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwieFwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInlcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgXSksIHZvaWRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICBudWxsLCAgLy8gbm8gaW1wbGVtZW50YXRpb24hXHJcbiAgICAgICAgICAgIGZhbHNlLCBmYWxzZSwgXCJXaXJkIGF1ZmdlcnVmZW4sIHdlbm4gZGVyIE1hdXN6ZWlnZXIgYXVzIGRlbSBHcmFmaWtiZXJlaWNoIGhlcmF1c2Jld2VndCB3aXJkLlwiKSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcbn1cclxuXHJcbiJdfQ==