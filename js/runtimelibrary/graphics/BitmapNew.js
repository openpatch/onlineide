// import { Module } from "../../compiler/parser/Module.js";
// import { Klass } from "../../compiler/types/Class.js";
// import { doublePrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType, booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
// import { Method, Parameterlist } from "../../compiler/types/Types.js";
// import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
// import { FilledShapeHelper } from "./FilledShape.js";
// import { WorldHelper } from "./World.js";
// import { Interpreter } from "../../interpreter/Interpreter.js";
// import { ShapeHelper } from "./Shape.js";
// import { ColorHelper } from "./ColorHelper.js";
// import { ColorClassIntrinsicData } from "./Color.js";
// export class BitmapClassNew extends Klass {
//     constructor(module: Module) {
//         super("BitmapNew", module, "Rechteckige Bitmap mit beliebiger Auflösung und Positionierung in der Grafikausgabe");
//         this.setBaseClass(<Klass>module.typeStore.getType("Shape"));
//         // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));
//         let colorType: Klass = <Klass>this.module.typeStore.getType("Color");
//         this.addMethod(new Method("BitmapNew", new Parameterlist([
//             { identifier: "pointsX", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "pointsY", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "left", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "top", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "height", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), null,
//             (parameters) => {
//                 let o: RuntimeObject = parameters[0].value;
//                 let pointsX: number = parameters[1].value;
//                 let pointsY: number = parameters[2].value;
//                 let left: number = parameters[3].value;
//                 let top: number = parameters[4].value;
//                 let width: number = parameters[5].value;
//                 let height: number = parameters[6].value;
//                 let rh = new BitmapHelperNew(pointsX, pointsY, left, top, width, height, module.main.getInterpreter(), o);
//                 o.intrinsicData["Actor"] = rh;
//             }, false, false, 'Instanziert eine neue Bitmap. pointsX bzw. pointsY bezeichnet Anzahl der Bildpunkte in x bzw. y-Richtung, (left, top) sind die Koordinaten der linken oberen Ecke.', true));
//         this.addMethod(new Method("getColor", new Parameterlist([
//             { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), colorType,
//             (parameters) => {
//                 let o: RuntimeObject = parameters[0].value;
//                 let x: number = parameters[1].value;
//                 let y: number = parameters[2].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];
//                 return sh.getFarbeAsObject(x, y, colorType);
//             }, false, false, 'Gibt die Farbe des Punkts (x, y) zurück.', false));
//         this.addMethod(new Method("setColor", new Parameterlist([
//             { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), voidPrimitiveType,
//             (parameters) => {
//                 let o: RuntimeObject = parameters[0].value;
//                 let x: number = parameters[1].value;
//                 let y: number = parameters[2].value;
//                 let color: number = parameters[3].value;
//                 let alpha: number = parameters[4].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];
//                 sh.setzeFarbe(x, y, color, alpha);
//             }, false, false, 'Setzt die Farbe des Pixels bei (x, y). Die Farbe wird als int-Wert gegeben, wobei farbe == 255*255*rot + 255*grün + blau und 0.0 <= alpha <= 1.0.', false));
//         this.addMethod(new Method("setColor", new Parameterlist([
//             { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
//         ]), voidPrimitiveType,
//             (parameters) => {
//                 let o: RuntimeObject = parameters[0].value;
//                 let x: number = parameters[1].value;
//                 let y: number = parameters[2].value;
//                 let color: number = parameters[3].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];
//                 sh.setzeFarbe(x, y, color);
//             }, false, false, 'Setzt die Farbe des Pixels bei (x, y). Die Farbe wird als int-Wert gegeben, wobei farbe == 255*255*rot + 255*grün + blau.', false));
//         this.addMethod(new Method("setColor", new Parameterlist([
//             { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "color", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), voidPrimitiveType,
//             (parameters) => {
//                 let o: RuntimeObject = parameters[0].value;
//                 let x: number = parameters[1].value;
//                 let y: number = parameters[2].value;
//                 let color: string = parameters[3].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];
//                 sh.setzeFarbe(x, y, color);
//             }, false, false, 'Setzt die Farbe des Pixels bei (x, y). Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)"', false));
//         this.addMethod(new Method("setColor", new Parameterlist([
//             { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "color", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), voidPrimitiveType,
//             (parameters) => {
//                 let o: RuntimeObject = parameters[0].value;
//                 let x: number = parameters[1].value;
//                 let y: number = parameters[2].value;
//                 let color: string = parameters[3].value;
//                 let alpha: number = parameters[4].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];
//                 sh.setzeFarbe(x, y, color, alpha);
//             }, false, false, 'Setzt die Farbe des Pixels bei (x, y). Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)". 0.0 <= alpha <= 1.0.', false));
//         this.addMethod(new Method("isColor", new Parameterlist([
//             { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "colorAsRGBAString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), booleanPrimitiveType,
//             (parameters) => {
//                 let o: RuntimeObject = parameters[0].value;
//                 let x: number = parameters[1].value;
//                 let y: number = parameters[2].value;
//                 let color: string = parameters[3].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];
//                 return sh.istFarbe(x, y, color);
//             }, false, false, 'Gibt genau dann true zurück, wenn das Pixel bei (x, y) die angegebene Farbe besitzt. Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)"', false));
//         this.addMethod(new Method("isColor", new Parameterlist([
//             { identifier: "x", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "y", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
//         ]), booleanPrimitiveType,
//             (parameters) => {
//                 let o: RuntimeObject = parameters[0].value;
//                 let x: number = parameters[1].value;
//                 let y: number = parameters[2].value;
//                 let color: number = parameters[3].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];
//                 return sh.istFarbe(x, y, color, 1);
//             }, false, false, 'Gibt genau dann true zurück, wenn das Pixel bei (x, y) die angegebene Farbe besitzt. Die Farbe wird als int-Wert gegeben, wobei farbe == 255*255*rot + 255*grün + blau und 0.0 <= alpha <= 1.0', false));
//         this.addMethod(new Method("fillAll", new Parameterlist([
//             { identifier: "color", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             { identifier: "alpha", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), voidPrimitiveType,
//             (parameters) => {
//                 let o: RuntimeObject = parameters[0].value;
//                 let color: number = parameters[1].value;
//                 let alpha: number = parameters[2].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];
//                 sh.fillAll(color, alpha);
//             }, false, false, 'Füllt die ganze Bitmap mit einer Farbe. Die Farbe wird als int-Wert gegeben, wobei farbe == 255*255*rot + 255*grün + blau und 0.0 <= alpha <= 1.0', false));
//         this.addMethod(new Method("fillAll", new Parameterlist([
//             { identifier: "colorAsRGBAString", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), voidPrimitiveType,
//             (parameters) => {
//                 let o: RuntimeObject = parameters[0].value;
//                 let color: number = parameters[1].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];
//                 sh.fillAll(color);
//             }, false, false, 'Füllt die ganze Bitmap mit einer Farbe. Die Farbe ist entweder eine vordefinierte Farbe (Color.black, Color.red, ...) oder eine css-Farbe der Art "#ffa7b3" (ohne alpha), "#ffa7b380" (mit alpha), "rgb(172, 22, 18)" oder "rgba(123, 22,18, 0.3)"', false));
//         this.addMethod(new Method("copy", new Parameterlist([
//         ]), this,
//             (parameters) => {
//                 let o: RuntimeObject = parameters[0].value;
//                 let sh: BitmapHelperNew = o.intrinsicData["Actor"];
//                 if (sh.testdestroyed("copy")) return;
//                 return sh.getCopy(<Klass>o.class);
//             }, false, false, 'Erstellt eine Kopie des Bitmap-Objekts und git sie zurück.', false));
//     }
// }
// export class BitmapHelperNew extends ShapeHelper {
//     renderTexture: PIXI.RenderTexture;
//     getCopy(klass: Klass): RuntimeObject {
//         let ro: RuntimeObject = new RuntimeObject(klass);
//         let bh: BitmapHelperNew = new BitmapHelperNew(this.anzahlX, this.anzahlY, this.left, this.top, this.width, this.height, this.worldHelper.interpreter, ro);
//         // TODO
//         ro.intrinsicData["Actor"] = bh;
//         bh.copyFrom(this);
//         bh.render();
//         return ro;
//     }
//     constructor(public anzahlX, public anzahlY, public left: number, public top: number, public width: number, public height: number,
//         interpreter: Interpreter, runtimeObject: RuntimeObject) {
//         super(interpreter, runtimeObject);
//         this.centerXInitial = left + width / 2;
//         this.centerYInitial = top + height / 2;
//         this.hitPolygonInitial = [
//             { x: left, y: top }, { x: left, y: top + height }, { x: left + width, y: top + height }, { x: left + width, y: top }
//         ];
//         this.render();
//         let sprite = <PIXI.Sprite>this.displayObject;
//         sprite.localTransform.scale(width/anzahlY, height/anzahlY);
//         sprite.localTransform.translate(left, top);
//         sprite.transform.onChange();
//         let p = new PIXI.Point(this.centerXInitial, this.centerYInitial);
//         sprite.localTransform.applyInverse(p, p);
//         this.centerXInitial = p.x;
//         this.centerYInitial = p.y;
//         this.addToDefaultGroup();
//     }
//     render(): void {
//         if (this.displayObject == null) {
//             this.initGraphics();
//             this.worldHelper.stage.addChild(this.displayObject);
//         }
//     };
//     protected initGraphics() {
//         this.renderTexture = PIXI.RenderTexture.create({ width: this.anzahlX, height: this.anzahlY, scaleMode: PIXI.SCALE_MODES.NEAREST });
//         this.displayObject = new PIXI.Sprite(this.renderTexture);
//     }
//     public getFarbeAsObject(x: number, y: number, colorType: Klass): RuntimeObject {
//         //@ts-ignore
//         let pixels: Uint8ClampedArray = this.renderTexture.getPixel(x, y);
//         let rto: RuntimeObject = new RuntimeObject(colorType);
//         let id: ColorClassIntrinsicData = {
//             red: Math.round(pixels[0] * 255),
//             green: Math.round(pixels[1] * 255),
//             blue: Math.round(pixels[2] * 255),
//             hex: ColorHelper.intColorToHexRGB(Math.round(pixels[0] * 255) * 0x10000 + Math.round(pixels[1] * 255) * 0x100 + Math.round(pixels[2] * 255))
//         }
//         rto.intrinsicData = id;
//         return rto;
//     }
//     public istFarbe(x: number, y: number, color: string | number, alpha?: number) {
//         //@ts-ignore
//         let pixels: Uint8ClampedArray = this.renderTexture.getPixel(x, y);
//         let c: number;
//         if (typeof color == "string") {
//             let ch = ColorHelper.parseColorToOpenGL(color);
//             c = ch.color;
//             alpha = ch.alpha;
//         } else {
//             c = color;
//         }
//         let r = ((c & 0xff0000) >> 16) / 255;
//         let g = ((c & 0xff00) >> 8) / 255;
//         let b = ((c & 0xff)) / 255;
//         let r1 = pixels[0];
//         let g1 = pixels[1];
//         let b1 = pixels[2];
//         return Math.abs(r - r1) < 0.5 && Math.abs(g - g1) < 0.5 && Math.abs(b - b1) < 0.5;
//     }
//     public setzeFarbe(x: number, y: number, color: string | number, alpha?: number) {
//         let c: number;
//         if (typeof color == "string") {
//             let ch = ColorHelper.parseColorToOpenGL(color);
//             c = ch.color;
//             if (alpha == null) alpha = ch.alpha;
//         } else {
//             c = color;
//             if (alpha == null) alpha = 1.0;
//         }
//         let brush = new PIXI.Graphics();
//         brush.beginFill(c);
//         brush.drawRect(x, y, 1, 1);
//         brush.endFill();
//         this.worldHelper.app.renderer.render(brush, 
//             {
//                 //@ts-ignore
//                 renderTexture: this.renderTexture,
//                 clear: false,
//                 transform: null,
//                 skipUpdateTransform: false
//             });
//     }
//     public fillAll(color: string | number, alpha?: number) {
//         let c: number;
//         if (typeof color == "string") {
//             let ch = ColorHelper.parseColorToOpenGL(color);
//             c = ch.color;
//             alpha = ch.alpha;
//         } else {
//             c = color;
//         }
//         let brush = new PIXI.Graphics();
//         brush.beginFill(c, 1);
//         brush.drawRect(0, 0, this.anzahlX, this.anzahlY);
//         brush.endFill();
//         this.worldHelper.app.renderer.render(brush, 
//             {
//                 //@ts-ignore
//                 renderTexture: this.renderTexture,
//                 clear: false,
//                 transform: null,
//                 skipUpdateTransform: false
//             });
//     }
//     public setzeFarbeRGBA(x: number, y: number, r: number, g: number, b: number, alpha: number) {
//         let c = alpha + b*0x100 + g * 0x10000 + r * 0x1000000;
//         let brush = new PIXI.Graphics();
//         brush.beginFill(c);
//         brush.drawRect(x, y, 1, 1);
//         brush.endFill();
//         this.worldHelper.app.renderer.render(brush, 
//             {
//                 //@ts-ignore
//                 renderTexture: this.renderTexture,
//                 clear: false,
//                 transform: null,
//                 skipUpdateTransform: false
//             });
//     }
//     public getFarbe(x: number, y: number): number {
//         //@ts-ignore
//         let pixels: Uint8ClampedArray = this.renderTexture.getPixel(x, y);
//         return pixels[0] *  0x10000 + pixels[1] * 0x100 + pixels[2];
//     }
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQml0bWFwTmV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9CaXRtYXBOZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsNERBQTREO0FBQzVELHlEQUF5RDtBQUN6RCxnS0FBZ0s7QUFDaEsseUVBQXlFO0FBQ3pFLHNFQUFzRTtBQUN0RSx3REFBd0Q7QUFDeEQsNENBQTRDO0FBQzVDLGtFQUFrRTtBQUNsRSw0Q0FBNEM7QUFDNUMsa0RBQWtEO0FBQ2xELHdEQUF3RDtBQUV4RCw4Q0FBOEM7QUFFOUMsb0NBQW9DO0FBRXBDLDZIQUE2SDtBQUU3SCx1RUFBdUU7QUFFdkUseUtBQXlLO0FBRXpLLGdGQUFnRjtBQUVoRixxRUFBcUU7QUFDckUseUhBQXlIO0FBQ3pILHlIQUF5SDtBQUN6SCx5SEFBeUg7QUFDekgsd0hBQXdIO0FBQ3hILDBIQUEwSDtBQUMxSCwySEFBMkg7QUFDM0gsb0JBQW9CO0FBQ3BCLGdDQUFnQztBQUVoQyw4REFBOEQ7QUFDOUQsNkRBQTZEO0FBQzdELDZEQUE2RDtBQUM3RCwwREFBMEQ7QUFDMUQseURBQXlEO0FBQ3pELDJEQUEyRDtBQUMzRCw0REFBNEQ7QUFFNUQsNkhBQTZIO0FBQzdILGlEQUFpRDtBQUVqRCw2TUFBNk07QUFFN00sb0VBQW9FO0FBQ3BFLG1IQUFtSDtBQUNuSCxtSEFBbUg7QUFDbkgseUJBQXlCO0FBQ3pCLGdDQUFnQztBQUVoQyw4REFBOEQ7QUFDOUQsdURBQXVEO0FBQ3ZELHVEQUF1RDtBQUN2RCxzRUFBc0U7QUFFdEUsK0RBQStEO0FBRS9ELG9GQUFvRjtBQUVwRixvRUFBb0U7QUFDcEUsbUhBQW1IO0FBQ25ILG1IQUFtSDtBQUNuSCx1SEFBdUg7QUFDdkgsMEhBQTBIO0FBQzFILGlDQUFpQztBQUNqQyxnQ0FBZ0M7QUFFaEMsOERBQThEO0FBQzlELHVEQUF1RDtBQUN2RCx1REFBdUQ7QUFDdkQsMkRBQTJE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QUNoQiwrQkFBK0I7QUFDL0IscURBQXFEO0FBQ3JELGdDQUFnQztBQUNoQyxtQ0FBbUM7QUFDbkMsNkNBQTZDO0FBQzdDLGtCQUFrQjtBQUVsQixRQUFRO0FBRVIsb0dBQW9HO0FBQ3BHLGlFQUFpRTtBQUNqRSwyQ0FBMkM7QUFDM0MsOEJBQThCO0FBQzlCLHNDQUFzQztBQUN0QywyQkFBMkI7QUFFM0IsdURBQXVEO0FBQ3ZELGdCQUFnQjtBQUNoQiwrQkFBK0I7QUFDL0IscURBQXFEO0FBQ3JELGdDQUFnQztBQUNoQyxtQ0FBbUM7QUFDbkMsNkNBQTZDO0FBQzdDLGtCQUFrQjtBQUNsQixRQUFRO0FBRVIsc0RBQXNEO0FBQ3RELHVCQUF1QjtBQUN2Qiw2RUFBNkU7QUFDN0UsdUVBQXVFO0FBRXZFLFFBQVE7QUFHUixJQUFJIiwic291cmNlc0NvbnRlbnQiOlsiLy8gaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuLy8gaW1wb3J0IHsgS2xhc3MgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvQ2xhc3MuanNcIjtcclxuLy8gaW1wb3J0IHsgZG91YmxlUHJpbWl0aXZlVHlwZSwgaW50UHJpbWl0aXZlVHlwZSwgc3RyaW5nUHJpbWl0aXZlVHlwZSwgdm9pZFByaW1pdGl2ZVR5cGUsIGJvb2xlYW5QcmltaXRpdmVUeXBlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL1ByaW1pdGl2ZVR5cGVzLmpzXCI7XHJcbi8vIGltcG9ydCB7IE1ldGhvZCwgUGFyYW1ldGVybGlzdCB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9UeXBlcy5qc1wiO1xyXG4vLyBpbXBvcnQgeyBSdW50aW1lT2JqZWN0IH0gZnJvbSBcIi4uLy4uL2ludGVycHJldGVyL1J1bnRpbWVPYmplY3QuanNcIjtcclxuLy8gaW1wb3J0IHsgRmlsbGVkU2hhcGVIZWxwZXIgfSBmcm9tIFwiLi9GaWxsZWRTaGFwZS5qc1wiO1xyXG4vLyBpbXBvcnQgeyBXb3JsZEhlbHBlciB9IGZyb20gXCIuL1dvcmxkLmpzXCI7XHJcbi8vIGltcG9ydCB7IEludGVycHJldGVyIH0gZnJvbSBcIi4uLy4uL2ludGVycHJldGVyL0ludGVycHJldGVyLmpzXCI7XHJcbi8vIGltcG9ydCB7IFNoYXBlSGVscGVyIH0gZnJvbSBcIi4vU2hhcGUuanNcIjtcclxuLy8gaW1wb3J0IHsgQ29sb3JIZWxwZXIgfSBmcm9tIFwiLi9Db2xvckhlbHBlci5qc1wiO1xyXG4vLyBpbXBvcnQgeyBDb2xvckNsYXNzSW50cmluc2ljRGF0YSB9IGZyb20gXCIuL0NvbG9yLmpzXCI7XHJcblxyXG4vLyBleHBvcnQgY2xhc3MgQml0bWFwQ2xhc3NOZXcgZXh0ZW5kcyBLbGFzcyB7XHJcblxyXG4vLyAgICAgY29uc3RydWN0b3IobW9kdWxlOiBNb2R1bGUpIHtcclxuXHJcbi8vICAgICAgICAgc3VwZXIoXCJCaXRtYXBOZXdcIiwgbW9kdWxlLCBcIlJlY2h0ZWNraWdlIEJpdG1hcCBtaXQgYmVsaWViaWdlciBBdWZsw7ZzdW5nIHVuZCBQb3NpdGlvbmllcnVuZyBpbiBkZXIgR3JhZmlrYXVzZ2FiZVwiKTtcclxuXHJcbi8vICAgICAgICAgdGhpcy5zZXRCYXNlQ2xhc3MoPEtsYXNzPm1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShcIlNoYXBlXCIpKTtcclxuXHJcbi8vICAgICAgICAgLy8gdGhpcy5hZGRBdHRyaWJ1dGUobmV3IEF0dHJpYnV0ZShcIlBJXCIsIGRvdWJsZVByaW1pdGl2ZVR5cGUsIChvYmplY3QpID0+IHsgcmV0dXJuIE1hdGguUEkgfSwgdHJ1ZSwgVmlzaWJpbGl0eS5wdWJsaWMsIHRydWUsIFwiRGllIEtyZWlzemFobCBQaSAoMy4xNDE1Li4uKVwiKSk7XHJcblxyXG4vLyAgICAgICAgIGxldCBjb2xvclR5cGU6IEtsYXNzID0gPEtsYXNzPnRoaXMubW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiQ29sb3JcIik7XHJcblxyXG4vLyAgICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJCaXRtYXBOZXdcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4vLyAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwicG9pbnRzWFwiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuLy8gICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInBvaW50c1lcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJsZWZ0XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4vLyAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwidG9wXCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4vLyAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwid2lkdGhcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJoZWlnaHRcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgXSksIG51bGwsXHJcbi8vICAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4vLyAgICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4vLyAgICAgICAgICAgICAgICAgbGV0IHBvaW50c1g6IG51bWJlciA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgcG9pbnRzWTogbnVtYmVyID0gcGFyYW1ldGVyc1syXS52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgIGxldCBsZWZ0OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzNdLnZhbHVlO1xyXG4vLyAgICAgICAgICAgICAgICAgbGV0IHRvcDogbnVtYmVyID0gcGFyYW1ldGVyc1s0XS52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgIGxldCB3aWR0aDogbnVtYmVyID0gcGFyYW1ldGVyc1s1XS52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgIGxldCBoZWlnaHQ6IG51bWJlciA9IHBhcmFtZXRlcnNbNl0udmFsdWU7XHJcblxyXG4vLyAgICAgICAgICAgICAgICAgbGV0IHJoID0gbmV3IEJpdG1hcEhlbHBlck5ldyhwb2ludHNYLCBwb2ludHNZLCBsZWZ0LCB0b3AsIHdpZHRoLCBoZWlnaHQsIG1vZHVsZS5tYWluLmdldEludGVycHJldGVyKCksIG8pO1xyXG4vLyAgICAgICAgICAgICAgICAgby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl0gPSByaDtcclxuXHJcbi8vICAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0luc3RhbnppZXJ0IGVpbmUgbmV1ZSBCaXRtYXAuIHBvaW50c1ggYnp3LiBwb2ludHNZIGJlemVpY2huZXQgQW56YWhsIGRlciBCaWxkcHVua3RlIGluIHggYnp3LiB5LVJpY2h0dW5nLCAobGVmdCwgdG9wKSBzaW5kIGRpZSBLb29yZGluYXRlbiBkZXIgbGlua2VuIG9iZXJlbiBFY2tlLicsIHRydWUpKTtcclxuXHJcbi8vICAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImdldENvbG9yXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuLy8gICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInhcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ5XCIsIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4vLyAgICAgICAgIF0pLCBjb2xvclR5cGUsXHJcbi8vICAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4vLyAgICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4vLyAgICAgICAgICAgICAgICAgbGV0IHg6IG51bWJlciA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgeTogbnVtYmVyID0gcGFyYW1ldGVyc1syXS52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgIGxldCBzaDogQml0bWFwSGVscGVyTmV3ID0gby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHNoLmdldEZhcmJlQXNPYmplY3QoeCwgeSwgY29sb3JUeXBlKTtcclxuXHJcbi8vICAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0dpYnQgZGllIEZhcmJlIGRlcyBQdW5rdHMgKHgsIHkpIHp1csO8Y2suJywgZmFsc2UpKTtcclxuXHJcbi8vICAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInNldENvbG9yXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuLy8gICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInhcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ5XCIsIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4vLyAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiY29sb3JcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJhbHBoYVwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuLy8gICAgICAgICBdKSwgdm9pZFByaW1pdGl2ZVR5cGUsXHJcbi8vICAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4vLyAgICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4vLyAgICAgICAgICAgICAgICAgbGV0IHg6IG51bWJlciA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgeTogbnVtYmVyID0gcGFyYW1ldGVyc1syXS52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgIGxldCBjb2xvcjogbnVtYmVyID0gcGFyYW1ldGVyc1szXS52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgIGxldCBhbHBoYTogbnVtYmVyID0gcGFyYW1ldGVyc1s0XS52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgIGxldCBzaDogQml0bWFwSGVscGVyTmV3ID0gby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4vLyAgICAgICAgICAgICAgICAgc2guc2V0emVGYXJiZSh4LCB5LCBjb2xvciwgYWxwaGEpO1xyXG5cclxuLy8gICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnU2V0enQgZGllIEZhcmJlIGRlcyBQaXhlbHMgYmVpICh4LCB5KS4gRGllIEZhcmJlIHdpcmQgYWxzIGludC1XZXJ0IGdlZ2ViZW4sIHdvYmVpIGZhcmJlID09IDI1NSoyNTUqcm90ICsgMjU1Kmdyw7xuICsgYmxhdSB1bmQgMC4wIDw9IGFscGhhIDw9IDEuMC4nLCBmYWxzZSkpO1xyXG5cclxuLy8gICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwic2V0Q29sb3JcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4vLyAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwieFwiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuLy8gICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInlcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJjb2xvclwiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfVxyXG4vLyAgICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuLy8gICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbi8vICAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgeDogbnVtYmVyID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgIGxldCB5OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzJdLnZhbHVlO1xyXG4vLyAgICAgICAgICAgICAgICAgbGV0IGNvbG9yOiBudW1iZXIgPSBwYXJhbWV0ZXJzWzNdLnZhbHVlO1xyXG4vLyAgICAgICAgICAgICAgICAgbGV0IHNoOiBCaXRtYXBIZWxwZXJOZXcgPSBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbi8vICAgICAgICAgICAgICAgICBzaC5zZXR6ZUZhcmJlKHgsIHksIGNvbG9yKTtcclxuXHJcbi8vICAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ1NldHp0IGRpZSBGYXJiZSBkZXMgUGl4ZWxzIGJlaSAoeCwgeSkuIERpZSBGYXJiZSB3aXJkIGFscyBpbnQtV2VydCBnZWdlYmVuLCB3b2JlaSBmYXJiZSA9PSAyNTUqMjU1KnJvdCArIDI1NSpncsO8biArIGJsYXUuJywgZmFsc2UpKTtcclxuXHJcbi8vICAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInNldENvbG9yXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuLy8gICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInhcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ5XCIsIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4vLyAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiY29sb3JcIiwgdHlwZTogc3RyaW5nUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgXSksIHZvaWRQcmltaXRpdmVUeXBlLFxyXG4vLyAgICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuLy8gICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgIGxldCB4OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4vLyAgICAgICAgICAgICAgICAgbGV0IHk6IG51bWJlciA9IHBhcmFtZXRlcnNbMl0udmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgY29sb3I6IHN0cmluZyA9IHBhcmFtZXRlcnNbM10udmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgc2g6IEJpdG1hcEhlbHBlck5ldyA9IG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuLy8gICAgICAgICAgICAgICAgIHNoLnNldHplRmFyYmUoeCwgeSwgY29sb3IpO1xyXG5cclxuLy8gICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnU2V0enQgZGllIEZhcmJlIGRlcyBQaXhlbHMgYmVpICh4LCB5KS4gRGllIEZhcmJlIGlzdCBlbnR3ZWRlciBlaW5lIHZvcmRlZmluaWVydGUgRmFyYmUgKENvbG9yLmJsYWNrLCBDb2xvci5yZWQsIC4uLikgb2RlciBlaW5lIGNzcy1GYXJiZSBkZXIgQXJ0IFwiI2ZmYTdiM1wiIChvaG5lIGFscGhhKSwgXCIjZmZhN2IzODBcIiAobWl0IGFscGhhKSwgXCJyZ2IoMTcyLCAyMiwgMTgpXCIgb2RlciBcInJnYmEoMTIzLCAyMiwxOCwgMC4zKVwiJywgZmFsc2UpKTtcclxuXHJcbi8vICAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInNldENvbG9yXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuLy8gICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInhcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ5XCIsIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4vLyAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiY29sb3JcIiwgdHlwZTogc3RyaW5nUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJhbHBoYVwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuLy8gICAgICAgICBdKSwgdm9pZFByaW1pdGl2ZVR5cGUsXHJcbi8vICAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4vLyAgICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4vLyAgICAgICAgICAgICAgICAgbGV0IHg6IG51bWJlciA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgeTogbnVtYmVyID0gcGFyYW1ldGVyc1syXS52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgIGxldCBjb2xvcjogc3RyaW5nID0gcGFyYW1ldGVyc1szXS52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgIGxldCBhbHBoYTogbnVtYmVyID0gcGFyYW1ldGVyc1s0XS52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgIGxldCBzaDogQml0bWFwSGVscGVyTmV3ID0gby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4vLyAgICAgICAgICAgICAgICAgc2guc2V0emVGYXJiZSh4LCB5LCBjb2xvciwgYWxwaGEpO1xyXG5cclxuLy8gICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnU2V0enQgZGllIEZhcmJlIGRlcyBQaXhlbHMgYmVpICh4LCB5KS4gRGllIEZhcmJlIGlzdCBlbnR3ZWRlciBlaW5lIHZvcmRlZmluaWVydGUgRmFyYmUgKENvbG9yLmJsYWNrLCBDb2xvci5yZWQsIC4uLikgb2RlciBlaW5lIGNzcy1GYXJiZSBkZXIgQXJ0IFwiI2ZmYTdiM1wiIChvaG5lIGFscGhhKSwgXCIjZmZhN2IzODBcIiAobWl0IGFscGhhKSwgXCJyZ2IoMTcyLCAyMiwgMTgpXCIgb2RlciBcInJnYmEoMTIzLCAyMiwxOCwgMC4zKVwiLiAwLjAgPD0gYWxwaGEgPD0gMS4wLicsIGZhbHNlKSk7XHJcblxyXG4vLyAgICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJpc0NvbG9yXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuLy8gICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInhcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ5XCIsIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4vLyAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiY29sb3JBc1JHQkFTdHJpbmdcIiwgdHlwZTogc3RyaW5nUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgXSksIGJvb2xlYW5QcmltaXRpdmVUeXBlLFxyXG4vLyAgICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuLy8gICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgIGxldCB4OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4vLyAgICAgICAgICAgICAgICAgbGV0IHk6IG51bWJlciA9IHBhcmFtZXRlcnNbMl0udmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgY29sb3I6IHN0cmluZyA9IHBhcmFtZXRlcnNbM10udmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgc2g6IEJpdG1hcEhlbHBlck5ldyA9IG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuLy8gICAgICAgICAgICAgICAgIHJldHVybiBzaC5pc3RGYXJiZSh4LCB5LCBjb2xvcik7XHJcblxyXG4vLyAgICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdHaWJ0IGdlbmF1IGRhbm4gdHJ1ZSB6dXLDvGNrLCB3ZW5uIGRhcyBQaXhlbCBiZWkgKHgsIHkpIGRpZSBhbmdlZ2ViZW5lIEZhcmJlIGJlc2l0enQuIERpZSBGYXJiZSBpc3QgZW50d2VkZXIgZWluZSB2b3JkZWZpbmllcnRlIEZhcmJlIChDb2xvci5ibGFjaywgQ29sb3IucmVkLCAuLi4pIG9kZXIgZWluZSBjc3MtRmFyYmUgZGVyIEFydCBcIiNmZmE3YjNcIiAob2huZSBhbHBoYSksIFwiI2ZmYTdiMzgwXCIgKG1pdCBhbHBoYSksIFwicmdiKDE3MiwgMjIsIDE4KVwiIG9kZXIgXCJyZ2JhKDEyMywgMjIsMTgsIDAuMylcIicsIGZhbHNlKSk7XHJcblxyXG4vLyAgICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJpc0NvbG9yXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuLy8gICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInhcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ5XCIsIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4vLyAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiY29sb3JcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuLy8gICAgICAgICBdKSwgYm9vbGVhblByaW1pdGl2ZVR5cGUsXHJcbi8vICAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4vLyAgICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4vLyAgICAgICAgICAgICAgICAgbGV0IHg6IG51bWJlciA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgeTogbnVtYmVyID0gcGFyYW1ldGVyc1syXS52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgIGxldCBjb2xvcjogbnVtYmVyID0gcGFyYW1ldGVyc1szXS52YWx1ZTtcclxuLy8gICAgICAgICAgICAgICAgIGxldCBzaDogQml0bWFwSGVscGVyTmV3ID0gby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4vLyAgICAgICAgICAgICAgICAgcmV0dXJuIHNoLmlzdEZhcmJlKHgsIHksIGNvbG9yLCAxKTtcclxuXHJcbi8vICAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0dpYnQgZ2VuYXUgZGFubiB0cnVlIHp1csO8Y2ssIHdlbm4gZGFzIFBpeGVsIGJlaSAoeCwgeSkgZGllIGFuZ2VnZWJlbmUgRmFyYmUgYmVzaXR6dC4gRGllIEZhcmJlIHdpcmQgYWxzIGludC1XZXJ0IGdlZ2ViZW4sIHdvYmVpIGZhcmJlID09IDI1NSoyNTUqcm90ICsgMjU1Kmdyw7xuICsgYmxhdSB1bmQgMC4wIDw9IGFscGhhIDw9IDEuMCcsIGZhbHNlKSk7XHJcblxyXG5cclxuLy8gICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiZmlsbEFsbFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbi8vICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJjb2xvclwiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuLy8gICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImFscGhhXCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4vLyAgICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuLy8gICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbi8vICAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgY29sb3I6IG51bWJlciA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgYWxwaGE6IG51bWJlciA9IHBhcmFtZXRlcnNbMl0udmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgc2g6IEJpdG1hcEhlbHBlck5ldyA9IG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuLy8gICAgICAgICAgICAgICAgIHNoLmZpbGxBbGwoY29sb3IsIGFscGhhKTtcclxuXHJcbi8vICAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0bDvGxsdCBkaWUgZ2FuemUgQml0bWFwIG1pdCBlaW5lciBGYXJiZS4gRGllIEZhcmJlIHdpcmQgYWxzIGludC1XZXJ0IGdlZ2ViZW4sIHdvYmVpIGZhcmJlID09IDI1NSoyNTUqcm90ICsgMjU1Kmdyw7xuICsgYmxhdSB1bmQgMC4wIDw9IGFscGhhIDw9IDEuMCcsIGZhbHNlKSk7XHJcblxyXG4vLyAgICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJmaWxsQWxsXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuLy8gICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImNvbG9yQXNSR0JBU3RyaW5nXCIsIHR5cGU6IHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4vLyAgICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuLy8gICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbi8vICAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgY29sb3I6IG51bWJlciA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgc2g6IEJpdG1hcEhlbHBlck5ldyA9IG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuLy8gICAgICAgICAgICAgICAgIHNoLmZpbGxBbGwoY29sb3IpO1xyXG5cclxuLy8gICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnRsO8bGx0IGRpZSBnYW56ZSBCaXRtYXAgbWl0IGVpbmVyIEZhcmJlLiBEaWUgRmFyYmUgaXN0IGVudHdlZGVyIGVpbmUgdm9yZGVmaW5pZXJ0ZSBGYXJiZSAoQ29sb3IuYmxhY2ssIENvbG9yLnJlZCwgLi4uKSBvZGVyIGVpbmUgY3NzLUZhcmJlIGRlciBBcnQgXCIjZmZhN2IzXCIgKG9obmUgYWxwaGEpLCBcIiNmZmE3YjM4MFwiIChtaXQgYWxwaGEpLCBcInJnYigxNzIsIDIyLCAxOClcIiBvZGVyIFwicmdiYSgxMjMsIDIyLDE4LCAwLjMpXCInLCBmYWxzZSkpO1xyXG5cclxuLy8gICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiY29weVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbi8vICAgICAgICAgXSksIHRoaXMsXHJcbi8vICAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4vLyAgICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4vLyAgICAgICAgICAgICAgICAgbGV0IHNoOiBCaXRtYXBIZWxwZXJOZXcgPSBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbi8vICAgICAgICAgICAgICAgICBpZiAoc2gudGVzdGRlc3Ryb3llZChcImNvcHlcIikpIHJldHVybjtcclxuXHJcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gc2guZ2V0Q29weSg8S2xhc3M+by5jbGFzcyk7XHJcblxyXG4vLyAgICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdFcnN0ZWxsdCBlaW5lIEtvcGllIGRlcyBCaXRtYXAtT2JqZWt0cyB1bmQgZ2l0IHNpZSB6dXLDvGNrLicsIGZhbHNlKSk7XHJcblxyXG5cclxuLy8gICAgIH1cclxuXHJcbi8vIH1cclxuXHJcbi8vIGV4cG9ydCBjbGFzcyBCaXRtYXBIZWxwZXJOZXcgZXh0ZW5kcyBTaGFwZUhlbHBlciB7XHJcblxyXG4vLyAgICAgcmVuZGVyVGV4dHVyZTogUElYSS5SZW5kZXJUZXh0dXJlO1xyXG5cclxuLy8gICAgIGdldENvcHkoa2xhc3M6IEtsYXNzKTogUnVudGltZU9iamVjdCB7XHJcblxyXG4vLyAgICAgICAgIGxldCBybzogUnVudGltZU9iamVjdCA9IG5ldyBSdW50aW1lT2JqZWN0KGtsYXNzKTtcclxuLy8gICAgICAgICBsZXQgYmg6IEJpdG1hcEhlbHBlck5ldyA9IG5ldyBCaXRtYXBIZWxwZXJOZXcodGhpcy5hbnphaGxYLCB0aGlzLmFuemFobFksIHRoaXMubGVmdCwgdGhpcy50b3AsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLndvcmxkSGVscGVyLmludGVycHJldGVyLCBybyk7XHJcblxyXG4vLyAgICAgICAgIC8vIFRPRE9cclxuXHJcbi8vICAgICAgICAgcm8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdID0gYmg7XHJcblxyXG4vLyAgICAgICAgIGJoLmNvcHlGcm9tKHRoaXMpO1xyXG4vLyAgICAgICAgIGJoLnJlbmRlcigpO1xyXG5cclxuLy8gICAgICAgICByZXR1cm4gcm87XHJcbi8vICAgICB9XHJcblxyXG5cclxuLy8gICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBhbnphaGxYLCBwdWJsaWMgYW56YWhsWSwgcHVibGljIGxlZnQ6IG51bWJlciwgcHVibGljIHRvcDogbnVtYmVyLCBwdWJsaWMgd2lkdGg6IG51bWJlciwgcHVibGljIGhlaWdodDogbnVtYmVyLFxyXG4vLyAgICAgICAgIGludGVycHJldGVyOiBJbnRlcnByZXRlciwgcnVudGltZU9iamVjdDogUnVudGltZU9iamVjdCkge1xyXG4vLyAgICAgICAgIHN1cGVyKGludGVycHJldGVyLCBydW50aW1lT2JqZWN0KTtcclxuLy8gICAgICAgICB0aGlzLmNlbnRlclhJbml0aWFsID0gbGVmdCArIHdpZHRoIC8gMjtcclxuLy8gICAgICAgICB0aGlzLmNlbnRlcllJbml0aWFsID0gdG9wICsgaGVpZ2h0IC8gMjtcclxuXHJcbi8vICAgICAgICAgdGhpcy5oaXRQb2x5Z29uSW5pdGlhbCA9IFtcclxuLy8gICAgICAgICAgICAgeyB4OiBsZWZ0LCB5OiB0b3AgfSwgeyB4OiBsZWZ0LCB5OiB0b3AgKyBoZWlnaHQgfSwgeyB4OiBsZWZ0ICsgd2lkdGgsIHk6IHRvcCArIGhlaWdodCB9LCB7IHg6IGxlZnQgKyB3aWR0aCwgeTogdG9wIH1cclxuLy8gICAgICAgICBdO1xyXG5cclxuLy8gICAgICAgICB0aGlzLnJlbmRlcigpO1xyXG5cclxuLy8gICAgICAgICBsZXQgc3ByaXRlID0gPFBJWEkuU3ByaXRlPnRoaXMuZGlzcGxheU9iamVjdDtcclxuXHJcbi8vICAgICAgICAgc3ByaXRlLmxvY2FsVHJhbnNmb3JtLnNjYWxlKHdpZHRoL2FuemFobFksIGhlaWdodC9hbnphaGxZKTtcclxuLy8gICAgICAgICBzcHJpdGUubG9jYWxUcmFuc2Zvcm0udHJhbnNsYXRlKGxlZnQsIHRvcCk7XHJcbi8vICAgICAgICAgc3ByaXRlLnRyYW5zZm9ybS5vbkNoYW5nZSgpO1xyXG5cclxuLy8gICAgICAgICBsZXQgcCA9IG5ldyBQSVhJLlBvaW50KHRoaXMuY2VudGVyWEluaXRpYWwsIHRoaXMuY2VudGVyWUluaXRpYWwpO1xyXG4vLyAgICAgICAgIHNwcml0ZS5sb2NhbFRyYW5zZm9ybS5hcHBseUludmVyc2UocCwgcCk7XHJcbi8vICAgICAgICAgdGhpcy5jZW50ZXJYSW5pdGlhbCA9IHAueDtcclxuLy8gICAgICAgICB0aGlzLmNlbnRlcllJbml0aWFsID0gcC55O1xyXG5cclxuXHJcbi8vICAgICAgICAgdGhpcy5hZGRUb0RlZmF1bHRHcm91cCgpO1xyXG4vLyAgICAgfVxyXG5cclxuLy8gICAgIHJlbmRlcigpOiB2b2lkIHtcclxuXHJcbi8vICAgICAgICAgaWYgKHRoaXMuZGlzcGxheU9iamVjdCA9PSBudWxsKSB7XHJcbi8vICAgICAgICAgICAgIHRoaXMuaW5pdEdyYXBoaWNzKCk7XHJcbi8vICAgICAgICAgICAgIHRoaXMud29ybGRIZWxwZXIuc3RhZ2UuYWRkQ2hpbGQodGhpcy5kaXNwbGF5T2JqZWN0KTtcclxuLy8gICAgICAgICB9XHJcblxyXG4vLyAgICAgfTtcclxuXHJcbi8vICAgICBwcm90ZWN0ZWQgaW5pdEdyYXBoaWNzKCkge1xyXG5cclxuLy8gICAgICAgICB0aGlzLnJlbmRlclRleHR1cmUgPSBQSVhJLlJlbmRlclRleHR1cmUuY3JlYXRlKHsgd2lkdGg6IHRoaXMuYW56YWhsWCwgaGVpZ2h0OiB0aGlzLmFuemFobFksIHNjYWxlTW9kZTogUElYSS5TQ0FMRV9NT0RFUy5ORUFSRVNUIH0pO1xyXG4vLyAgICAgICAgIHRoaXMuZGlzcGxheU9iamVjdCA9IG5ldyBQSVhJLlNwcml0ZSh0aGlzLnJlbmRlclRleHR1cmUpO1xyXG5cclxuLy8gICAgIH1cclxuXHJcbi8vICAgICBwdWJsaWMgZ2V0RmFyYmVBc09iamVjdCh4OiBudW1iZXIsIHk6IG51bWJlciwgY29sb3JUeXBlOiBLbGFzcyk6IFJ1bnRpbWVPYmplY3Qge1xyXG5cclxuLy8gICAgICAgICAvL0B0cy1pZ25vcmVcclxuLy8gICAgICAgICBsZXQgcGl4ZWxzOiBVaW50OENsYW1wZWRBcnJheSA9IHRoaXMucmVuZGVyVGV4dHVyZS5nZXRQaXhlbCh4LCB5KTtcclxuXHJcbi8vICAgICAgICAgbGV0IHJ0bzogUnVudGltZU9iamVjdCA9IG5ldyBSdW50aW1lT2JqZWN0KGNvbG9yVHlwZSk7XHJcblxyXG4vLyAgICAgICAgIGxldCBpZDogQ29sb3JDbGFzc0ludHJpbnNpY0RhdGEgPSB7XHJcbi8vICAgICAgICAgICAgIHJlZDogTWF0aC5yb3VuZChwaXhlbHNbMF0gKiAyNTUpLFxyXG4vLyAgICAgICAgICAgICBncmVlbjogTWF0aC5yb3VuZChwaXhlbHNbMV0gKiAyNTUpLFxyXG4vLyAgICAgICAgICAgICBibHVlOiBNYXRoLnJvdW5kKHBpeGVsc1syXSAqIDI1NSksXHJcbi8vICAgICAgICAgICAgIGhleDogQ29sb3JIZWxwZXIuaW50Q29sb3JUb0hleFJHQihNYXRoLnJvdW5kKHBpeGVsc1swXSAqIDI1NSkgKiAweDEwMDAwICsgTWF0aC5yb3VuZChwaXhlbHNbMV0gKiAyNTUpICogMHgxMDAgKyBNYXRoLnJvdW5kKHBpeGVsc1syXSAqIDI1NSkpXHJcbi8vICAgICAgICAgfVxyXG5cclxuLy8gICAgICAgICBydG8uaW50cmluc2ljRGF0YSA9IGlkO1xyXG5cclxuLy8gICAgICAgICByZXR1cm4gcnRvO1xyXG5cclxuLy8gICAgIH1cclxuXHJcblxyXG4vLyAgICAgcHVibGljIGlzdEZhcmJlKHg6IG51bWJlciwgeTogbnVtYmVyLCBjb2xvcjogc3RyaW5nIHwgbnVtYmVyLCBhbHBoYT86IG51bWJlcikge1xyXG5cclxuLy8gICAgICAgICAvL0B0cy1pZ25vcmVcclxuLy8gICAgICAgICBsZXQgcGl4ZWxzOiBVaW50OENsYW1wZWRBcnJheSA9IHRoaXMucmVuZGVyVGV4dHVyZS5nZXRQaXhlbCh4LCB5KTtcclxuXHJcblxyXG4vLyAgICAgICAgIGxldCBjOiBudW1iZXI7XHJcblxyXG4vLyAgICAgICAgIGlmICh0eXBlb2YgY29sb3IgPT0gXCJzdHJpbmdcIikge1xyXG4vLyAgICAgICAgICAgICBsZXQgY2ggPSBDb2xvckhlbHBlci5wYXJzZUNvbG9yVG9PcGVuR0woY29sb3IpO1xyXG4vLyAgICAgICAgICAgICBjID0gY2guY29sb3I7XHJcbi8vICAgICAgICAgICAgIGFscGhhID0gY2guYWxwaGE7XHJcbi8vICAgICAgICAgfSBlbHNlIHtcclxuLy8gICAgICAgICAgICAgYyA9IGNvbG9yO1xyXG4vLyAgICAgICAgIH1cclxuXHJcbi8vICAgICAgICAgbGV0IHIgPSAoKGMgJiAweGZmMDAwMCkgPj4gMTYpIC8gMjU1O1xyXG4vLyAgICAgICAgIGxldCBnID0gKChjICYgMHhmZjAwKSA+PiA4KSAvIDI1NTtcclxuLy8gICAgICAgICBsZXQgYiA9ICgoYyAmIDB4ZmYpKSAvIDI1NTtcclxuXHJcbi8vICAgICAgICAgbGV0IHIxID0gcGl4ZWxzWzBdO1xyXG4vLyAgICAgICAgIGxldCBnMSA9IHBpeGVsc1sxXTtcclxuLy8gICAgICAgICBsZXQgYjEgPSBwaXhlbHNbMl07XHJcblxyXG4vLyAgICAgICAgIHJldHVybiBNYXRoLmFicyhyIC0gcjEpIDwgMC41ICYmIE1hdGguYWJzKGcgLSBnMSkgPCAwLjUgJiYgTWF0aC5hYnMoYiAtIGIxKSA8IDAuNTtcclxuXHJcbi8vICAgICB9XHJcblxyXG4vLyAgICAgcHVibGljIHNldHplRmFyYmUoeDogbnVtYmVyLCB5OiBudW1iZXIsIGNvbG9yOiBzdHJpbmcgfCBudW1iZXIsIGFscGhhPzogbnVtYmVyKSB7XHJcblxyXG4vLyAgICAgICAgIGxldCBjOiBudW1iZXI7XHJcblxyXG4vLyAgICAgICAgIGlmICh0eXBlb2YgY29sb3IgPT0gXCJzdHJpbmdcIikge1xyXG4vLyAgICAgICAgICAgICBsZXQgY2ggPSBDb2xvckhlbHBlci5wYXJzZUNvbG9yVG9PcGVuR0woY29sb3IpO1xyXG4vLyAgICAgICAgICAgICBjID0gY2guY29sb3I7XHJcbi8vICAgICAgICAgICAgIGlmIChhbHBoYSA9PSBudWxsKSBhbHBoYSA9IGNoLmFscGhhO1xyXG4vLyAgICAgICAgIH0gZWxzZSB7XHJcbi8vICAgICAgICAgICAgIGMgPSBjb2xvcjtcclxuLy8gICAgICAgICAgICAgaWYgKGFscGhhID09IG51bGwpIGFscGhhID0gMS4wO1xyXG4vLyAgICAgICAgIH1cclxuXHJcbi8vICAgICAgICAgbGV0IGJydXNoID0gbmV3IFBJWEkuR3JhcGhpY3MoKTtcclxuLy8gICAgICAgICBicnVzaC5iZWdpbkZpbGwoYyk7XHJcbi8vICAgICAgICAgYnJ1c2guZHJhd1JlY3QoeCwgeSwgMSwgMSk7XHJcbi8vICAgICAgICAgYnJ1c2guZW5kRmlsbCgpO1xyXG5cclxuLy8gICAgICAgICB0aGlzLndvcmxkSGVscGVyLmFwcC5yZW5kZXJlci5yZW5kZXIoYnJ1c2gsIFxyXG4vLyAgICAgICAgICAgICB7XHJcbi8vICAgICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuLy8gICAgICAgICAgICAgICAgIHJlbmRlclRleHR1cmU6IHRoaXMucmVuZGVyVGV4dHVyZSxcclxuLy8gICAgICAgICAgICAgICAgIGNsZWFyOiBmYWxzZSxcclxuLy8gICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogbnVsbCxcclxuLy8gICAgICAgICAgICAgICAgIHNraXBVcGRhdGVUcmFuc2Zvcm06IGZhbHNlXHJcbi8vICAgICAgICAgICAgIH0pO1xyXG4vLyAgICAgfVxyXG5cclxuLy8gICAgIHB1YmxpYyBmaWxsQWxsKGNvbG9yOiBzdHJpbmcgfCBudW1iZXIsIGFscGhhPzogbnVtYmVyKSB7XHJcbi8vICAgICAgICAgbGV0IGM6IG51bWJlcjtcclxuXHJcbi8vICAgICAgICAgaWYgKHR5cGVvZiBjb2xvciA9PSBcInN0cmluZ1wiKSB7XHJcbi8vICAgICAgICAgICAgIGxldCBjaCA9IENvbG9ySGVscGVyLnBhcnNlQ29sb3JUb09wZW5HTChjb2xvcik7XHJcbi8vICAgICAgICAgICAgIGMgPSBjaC5jb2xvcjtcclxuLy8gICAgICAgICAgICAgYWxwaGEgPSBjaC5hbHBoYTtcclxuLy8gICAgICAgICB9IGVsc2Uge1xyXG4vLyAgICAgICAgICAgICBjID0gY29sb3I7XHJcbi8vICAgICAgICAgfVxyXG5cclxuLy8gICAgICAgICBsZXQgYnJ1c2ggPSBuZXcgUElYSS5HcmFwaGljcygpO1xyXG4vLyAgICAgICAgIGJydXNoLmJlZ2luRmlsbChjLCAxKTtcclxuLy8gICAgICAgICBicnVzaC5kcmF3UmVjdCgwLCAwLCB0aGlzLmFuemFobFgsIHRoaXMuYW56YWhsWSk7XHJcbi8vICAgICAgICAgYnJ1c2guZW5kRmlsbCgpO1xyXG5cclxuLy8gICAgICAgICB0aGlzLndvcmxkSGVscGVyLmFwcC5yZW5kZXJlci5yZW5kZXIoYnJ1c2gsIFxyXG4vLyAgICAgICAgICAgICB7XHJcbi8vICAgICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuLy8gICAgICAgICAgICAgICAgIHJlbmRlclRleHR1cmU6IHRoaXMucmVuZGVyVGV4dHVyZSxcclxuLy8gICAgICAgICAgICAgICAgIGNsZWFyOiBmYWxzZSxcclxuLy8gICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogbnVsbCxcclxuLy8gICAgICAgICAgICAgICAgIHNraXBVcGRhdGVUcmFuc2Zvcm06IGZhbHNlXHJcbi8vICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4vLyAgICAgfVxyXG4gICAgXHJcbi8vICAgICBwdWJsaWMgc2V0emVGYXJiZVJHQkEoeDogbnVtYmVyLCB5OiBudW1iZXIsIHI6IG51bWJlciwgZzogbnVtYmVyLCBiOiBudW1iZXIsIGFscGhhOiBudW1iZXIpIHtcclxuLy8gICAgICAgICBsZXQgYyA9IGFscGhhICsgYioweDEwMCArIGcgKiAweDEwMDAwICsgciAqIDB4MTAwMDAwMDtcclxuLy8gICAgICAgICBsZXQgYnJ1c2ggPSBuZXcgUElYSS5HcmFwaGljcygpO1xyXG4vLyAgICAgICAgIGJydXNoLmJlZ2luRmlsbChjKTtcclxuLy8gICAgICAgICBicnVzaC5kcmF3UmVjdCh4LCB5LCAxLCAxKTtcclxuLy8gICAgICAgICBicnVzaC5lbmRGaWxsKCk7XHJcbiAgICAgICAgXHJcbi8vICAgICAgICAgdGhpcy53b3JsZEhlbHBlci5hcHAucmVuZGVyZXIucmVuZGVyKGJydXNoLCBcclxuLy8gICAgICAgICAgICAge1xyXG4vLyAgICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbi8vICAgICAgICAgICAgICAgICByZW5kZXJUZXh0dXJlOiB0aGlzLnJlbmRlclRleHR1cmUsXHJcbi8vICAgICAgICAgICAgICAgICBjbGVhcjogZmFsc2UsXHJcbi8vICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IG51bGwsXHJcbi8vICAgICAgICAgICAgICAgICBza2lwVXBkYXRlVHJhbnNmb3JtOiBmYWxzZVxyXG4vLyAgICAgICAgICAgICB9KTtcclxuLy8gICAgIH1cclxuXHJcbi8vICAgICBwdWJsaWMgZ2V0RmFyYmUoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBudW1iZXIge1xyXG4vLyAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4vLyAgICAgICAgIGxldCBwaXhlbHM6IFVpbnQ4Q2xhbXBlZEFycmF5ID0gdGhpcy5yZW5kZXJUZXh0dXJlLmdldFBpeGVsKHgsIHkpO1xyXG4vLyAgICAgICAgIHJldHVybiBwaXhlbHNbMF0gKiAgMHgxMDAwMCArIHBpeGVsc1sxXSAqIDB4MTAwICsgcGl4ZWxzWzJdO1xyXG5cclxuLy8gICAgIH1cclxuXHJcblxyXG4vLyB9XHJcbiJdfQ==