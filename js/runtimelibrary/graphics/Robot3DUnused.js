// import { Module } from "../../compiler/parser/Module.js";
// import { Klass } from "../../compiler/types/Class.js";
// import { doublePrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
// import { Method, Parameterlist } from "../../compiler/types/Types.js";
// import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
// import { FilledShapeHelper } from "./FilledShape.js";
// import { WorldHelper } from "./World.js";
// import { Interpreter } from "../../interpreter/Interpreter.js";
// import { FilledShapeDefaults } from "./FilledShapeDefaults.js";
// import { ShapeHelper } from "./Shape.js";
// export class RobotClass extends Klass {
//     constructor(module: Module) {
//         super("Robot", module, "Java Karol");
//         this.setBaseClass(<Klass>module.typeStore.getType("Shape"));
//         // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));
//         this.addMethod(new Method("Robot", new Parameterlist([
//             // { identifier: "left", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             // { identifier: "top", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             // { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//             // { identifier: "height", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
//         ]), null,
//             (parameters) => {
//                 let o: RuntimeObject = parameters[0].value;
//                 let rh = new RobotHelper(module.main.getInterpreter(), o);
//                 o.intrinsicData["Actor"] = rh;
//             }, false, false, 'Instanziert ein neues Robot-Objekt', true));
//             // this.addMethod(new Method("setWidth", new Parameterlist([
//             //     { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
//             // ]), null,
//             // (parameters) => {
//             //     let o: RuntimeObject = parameters[0].value;
//             //     let sh: RectangleHelper = o.intrinsicData["Actor"];
//             //     let width: number = parameters[1].value;
//             //     if (sh.testdestroyed("setWidth")) return;
//             //     sh.width = width / sh.displayObject.scale.x;
//             //     sh.centerXInitial = sh.left + sh.width/2;
//             //     sh.render();
//             // }, false, false, "Setzt die Breite des Rechtecks.", false));
//     }
// }
// export class RobotHelper extends ShapeHelper {
//     constructor(interpreter: Interpreter, runtimeObject: RuntimeObject) {
//         super(interpreter, runtimeObject);
//         this.centerXInitial = 0;
//         this.centerYInitial = 0;
//         this.render();
//         this.addToDefaultGroupAndSetDefaultVisibility();
//     }
//     getCopy(klass: Klass): RuntimeObject {
//         let ro: RuntimeObject = new RuntimeObject(klass);
//         let rh = new RobotHelper(this.worldHelper.interpreter, ro);
//         ro.intrinsicData["Actor"] = rh;
//         rh.copyFrom(this);
//         rh.render();
//         this.addToDefaultGroupAndSetDefaultVisibility();
//         return ro;
//     }
//     render(): void {
//         this.hitPolygonInitial = [
//         ];
//         this.worldHelper.app.renderer.backgroundColor = 0xffffff;
//         if (this.displayObject == null) {
//             let mesh = PIXI3D.Mesh3D.createCube()
//             let plane = PIXI3D.Mesh3D.createPlane();
//             plane.y = -0.8;
//             plane.scale.set(150);
//             let container3D = new PIXI3D.Container3D();
//             container3D.addChild(mesh);
//             container3D.addChild(plane);
//             this.displayObject = container3D;
//             this.worldHelper.stage.addChild(this.displayObject);
//             let light1 = Object.assign(new PIXI3D.Light(), {
//                 type: PIXI3D.LightType.point,
//                 range: 100,
//                 intensity: 60,
//                 color: new PIXI3D.Color(1, 1, 1)
//               });
//             light1.position.set(-4, 7, 4);
//             let light2 = Object.assign(new PIXI3D.Light(), {
//                 type: PIXI3D.LightType.point,
//                 range: 100,
//                 intensity: 60,
//                 color: new PIXI3D.Color(1, 1, 1)
//               });
//             light2.position.set(4, 7, -4);
//             // light.rotationQuaternion.setEulerAngles(45, 45, 0);
//             let lightingEnvironment = new PIXI3D.LightingEnvironment(<PIXI.Renderer>this.worldHelper.app.renderer);
//             lightingEnvironment.lights.push(light1, light2);
//             let camera = new PIXI3D.Camera(<PIXI.Renderer>this.worldHelper.app.renderer);
//             for(let mesh of container3D.children as PIXI3D.Mesh3D[]){
//                 let material = <PIXI3D.StandardMaterial>mesh.material;
//                 material.lightingEnvironment = lightingEnvironment;
//                 material.camera = camera;
//                 material.baseColor = new PIXI3D.Color(1, 0, 0, 1); // The base color will be blended together with base color texture (if available).
//                 material.unlit = false; // Set unlit = true to disable all lighting.
//             }
//             // material.alphaMode = PIXI3D.StandardMaterialAlphaMode.opaque; // Set alpha mode to "blend" for transparency (base color alpha less than 1).
//             // material.exposure = 2; // Set exposure to be able to control the brightness.
//             // material.metallic = 0; // Set to 1 for a metallic material.
//             // material.roughness = 0.3; // Value between 0 and 1 which describes the roughness of the material.
//             // material.emissive = new PIXI3D.Color(1.0, 0.0, 0.0, 1.0);
//             // material.baseColor = new PIXI3D.Color(1.0, 0.3, 0.3, 1.0);
//             let control = new PIXI3D.CameraOrbitControl(this.worldHelper.app.view, camera);
//             control.angles.x = 20;
//         } 
//     };
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUm9ib3QzRFVudXNlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jbGllbnQvcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvUm9ib3QzRFVudXNlZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSw0REFBNEQ7QUFDNUQseURBQXlEO0FBQ3pELGdGQUFnRjtBQUNoRix5RUFBeUU7QUFDekUsc0VBQXNFO0FBQ3RFLHdEQUF3RDtBQUN4RCw0Q0FBNEM7QUFDNUMsa0VBQWtFO0FBQ2xFLGtFQUFrRTtBQUNsRSw0Q0FBNEM7QUFFNUMsMENBQTBDO0FBRTFDLG9DQUFvQztBQUVwQyxnREFBZ0Q7QUFFaEQsdUVBQXVFO0FBRXZFLHlLQUF5SztBQUV6SyxpRUFBaUU7QUFDakUsNEhBQTRIO0FBQzVILDJIQUEySDtBQUMzSCw2SEFBNkg7QUFDN0gsOEhBQThIO0FBQzlILG9CQUFvQjtBQUNwQixnQ0FBZ0M7QUFFaEMsOERBQThEO0FBRTlELDZFQUE2RTtBQUM3RSxpREFBaUQ7QUFFakQsNkVBQTZFO0FBRTdFLDJFQUEyRTtBQUMzRSxnSUFBZ0k7QUFDaEksMkJBQTJCO0FBQzNCLG1DQUFtQztBQUVuQyxpRUFBaUU7QUFDakUseUVBQXlFO0FBQ3pFLDhEQUE4RDtBQUU5RCwrREFBK0Q7QUFFL0Qsa0VBQWtFO0FBQ2xFLCtEQUErRDtBQUUvRCxrQ0FBa0M7QUFFbEMsOEVBQThFO0FBSTlFLFFBQVE7QUFFUixJQUFJO0FBRUosaURBQWlEO0FBRWpELDRFQUE0RTtBQUM1RSw2Q0FBNkM7QUFDN0MsbUNBQW1DO0FBQ25DLG1DQUFtQztBQUVuQyx5QkFBeUI7QUFFekIsMkRBQTJEO0FBRTNELFFBQVE7QUFFUiw2Q0FBNkM7QUFFN0MsNERBQTREO0FBQzVELHNFQUFzRTtBQUN0RSwwQ0FBMEM7QUFFMUMsNkJBQTZCO0FBQzdCLHVCQUF1QjtBQUV2QiwyREFBMkQ7QUFFM0QscUJBQXFCO0FBQ3JCLFFBQVE7QUFFUix1QkFBdUI7QUFFdkIscUNBQXFDO0FBQ3JDLGFBQWE7QUFFYixvRUFBb0U7QUFFcEUsNENBQTRDO0FBQzVDLG9EQUFvRDtBQUNwRCx1REFBdUQ7QUFDdkQsOEJBQThCO0FBQzlCLG9DQUFvQztBQUVwQywwREFBMEQ7QUFDMUQsMENBQTBDO0FBQzFDLDJDQUEyQztBQUUzQyxnREFBZ0Q7QUFDaEQsbUVBQW1FO0FBRW5FLCtEQUErRDtBQUMvRCxnREFBZ0Q7QUFDaEQsOEJBQThCO0FBQzlCLGlDQUFpQztBQUNqQyxtREFBbUQ7QUFDbkQsb0JBQW9CO0FBQ3BCLDZDQUE2QztBQUM3QywrREFBK0Q7QUFDL0QsZ0RBQWdEO0FBQ2hELDhCQUE4QjtBQUM5QixpQ0FBaUM7QUFDakMsbURBQW1EO0FBQ25ELG9CQUFvQjtBQUNwQiw2Q0FBNkM7QUFDN0MscUVBQXFFO0FBR3JFLHNIQUFzSDtBQUN0SCwrREFBK0Q7QUFDL0QsNEZBQTRGO0FBRTVGLHdFQUF3RTtBQUN4RSx5RUFBeUU7QUFDekUsc0VBQXNFO0FBQ3RFLDRDQUE0QztBQUM1Qyx3SkFBd0o7QUFDeEosdUZBQXVGO0FBQ3ZGLGdCQUFnQjtBQUNoQiw2SkFBNko7QUFDN0osOEZBQThGO0FBQzlGLDZFQUE2RTtBQUM3RSxtSEFBbUg7QUFFbkgsMkVBQTJFO0FBQzNFLDRFQUE0RTtBQUU1RSw4RkFBOEY7QUFDOUYscUNBQXFDO0FBQ3JDLGFBQWE7QUFHYixTQUFTO0FBR1QsSUFBSSIsInNvdXJjZXNDb250ZW50IjpbIi8vIGltcG9ydCB7IE1vZHVsZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci9wYXJzZXIvTW9kdWxlLmpzXCI7XHJcbi8vIGltcG9ydCB7IEtsYXNzIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL0NsYXNzLmpzXCI7XHJcbi8vIGltcG9ydCB7IGRvdWJsZVByaW1pdGl2ZVR5cGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvUHJpbWl0aXZlVHlwZXMuanNcIjtcclxuLy8gaW1wb3J0IHsgTWV0aG9kLCBQYXJhbWV0ZXJsaXN0IH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL1R5cGVzLmpzXCI7XHJcbi8vIGltcG9ydCB7IFJ1bnRpbWVPYmplY3QgfSBmcm9tIFwiLi4vLi4vaW50ZXJwcmV0ZXIvUnVudGltZU9iamVjdC5qc1wiO1xyXG4vLyBpbXBvcnQgeyBGaWxsZWRTaGFwZUhlbHBlciB9IGZyb20gXCIuL0ZpbGxlZFNoYXBlLmpzXCI7XHJcbi8vIGltcG9ydCB7IFdvcmxkSGVscGVyIH0gZnJvbSBcIi4vV29ybGQuanNcIjtcclxuLy8gaW1wb3J0IHsgSW50ZXJwcmV0ZXIgfSBmcm9tIFwiLi4vLi4vaW50ZXJwcmV0ZXIvSW50ZXJwcmV0ZXIuanNcIjtcclxuLy8gaW1wb3J0IHsgRmlsbGVkU2hhcGVEZWZhdWx0cyB9IGZyb20gXCIuL0ZpbGxlZFNoYXBlRGVmYXVsdHMuanNcIjtcclxuLy8gaW1wb3J0IHsgU2hhcGVIZWxwZXIgfSBmcm9tIFwiLi9TaGFwZS5qc1wiO1xyXG5cclxuLy8gZXhwb3J0IGNsYXNzIFJvYm90Q2xhc3MgZXh0ZW5kcyBLbGFzcyB7XHJcblxyXG4vLyAgICAgY29uc3RydWN0b3IobW9kdWxlOiBNb2R1bGUpIHtcclxuXHJcbi8vICAgICAgICAgc3VwZXIoXCJSb2JvdFwiLCBtb2R1bGUsIFwiSmF2YSBLYXJvbFwiKTtcclxuXHJcbi8vICAgICAgICAgdGhpcy5zZXRCYXNlQ2xhc3MoPEtsYXNzPm1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShcIlNoYXBlXCIpKTtcclxuXHJcbi8vICAgICAgICAgLy8gdGhpcy5hZGRBdHRyaWJ1dGUobmV3IEF0dHJpYnV0ZShcIlBJXCIsIGRvdWJsZVByaW1pdGl2ZVR5cGUsIChvYmplY3QpID0+IHsgcmV0dXJuIE1hdGguUEkgfSwgdHJ1ZSwgVmlzaWJpbGl0eS5wdWJsaWMsIHRydWUsIFwiRGllIEtyZWlzemFobCBQaSAoMy4xNDE1Li4uKVwiKSk7XHJcblxyXG4vLyAgICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJSb2JvdFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbi8vICAgICAgICAgICAgIC8vIHsgaWRlbnRpZmllcjogXCJsZWZ0XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4vLyAgICAgICAgICAgICAvLyB7IGlkZW50aWZpZXI6IFwidG9wXCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4vLyAgICAgICAgICAgICAvLyB7IGlkZW50aWZpZXI6IFwid2lkdGhcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgICAgIC8vIHsgaWRlbnRpZmllcjogXCJoZWlnaHRcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbi8vICAgICAgICAgXSksIG51bGwsXHJcbi8vICAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4vLyAgICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgXHJcbi8vICAgICAgICAgICAgICAgICBsZXQgcmggPSBuZXcgUm9ib3RIZWxwZXIobW9kdWxlLm1haW4uZ2V0SW50ZXJwcmV0ZXIoKSwgbyk7XHJcbi8vICAgICAgICAgICAgICAgICBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXSA9IHJoO1xyXG4gICAgICAgICAgICAgICAgXHJcbi8vICAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0luc3RhbnppZXJ0IGVpbiBuZXVlcyBSb2JvdC1PYmpla3QnLCB0cnVlKSk7XHJcbiAgICAgICAgICAgIFxyXG4vLyAgICAgICAgICAgICAvLyB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwic2V0V2lkdGhcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4vLyAgICAgICAgICAgICAvLyAgICAgeyBpZGVudGlmaWVyOiBcIndpZHRoXCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9XHJcbi8vICAgICAgICAgICAgIC8vIF0pLCBudWxsLFxyXG4vLyAgICAgICAgICAgICAvLyAocGFyYW1ldGVycykgPT4ge1xyXG4gICAgICAgICAgICAgICAgXHJcbi8vICAgICAgICAgICAgIC8vICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbi8vICAgICAgICAgICAgIC8vICAgICBsZXQgc2g6IFJlY3RhbmdsZUhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG4vLyAgICAgICAgICAgICAvLyAgICAgbGV0IHdpZHRoOiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgXHJcbi8vICAgICAgICAgICAgIC8vICAgICBpZiAoc2gudGVzdGRlc3Ryb3llZChcInNldFdpZHRoXCIpKSByZXR1cm47XHJcblxyXG4vLyAgICAgICAgICAgICAvLyAgICAgc2gud2lkdGggPSB3aWR0aCAvIHNoLmRpc3BsYXlPYmplY3Quc2NhbGUueDtcclxuLy8gICAgICAgICAgICAgLy8gICAgIHNoLmNlbnRlclhJbml0aWFsID0gc2gubGVmdCArIHNoLndpZHRoLzI7XHJcblxyXG4vLyAgICAgICAgICAgICAvLyAgICAgc2gucmVuZGVyKCk7XHJcblxyXG4vLyAgICAgICAgICAgICAvLyB9LCBmYWxzZSwgZmFsc2UsIFwiU2V0enQgZGllIEJyZWl0ZSBkZXMgUmVjaHRlY2tzLlwiLCBmYWxzZSkpO1xyXG5cclxuICAgIFxyXG5cclxuLy8gICAgIH1cclxuXHJcbi8vIH1cclxuXHJcbi8vIGV4cG9ydCBjbGFzcyBSb2JvdEhlbHBlciBleHRlbmRzIFNoYXBlSGVscGVyIHtcclxuXHJcbi8vICAgICBjb25zdHJ1Y3RvcihpbnRlcnByZXRlcjogSW50ZXJwcmV0ZXIsIHJ1bnRpbWVPYmplY3Q6IFJ1bnRpbWVPYmplY3QpIHtcclxuLy8gICAgICAgICBzdXBlcihpbnRlcnByZXRlciwgcnVudGltZU9iamVjdCk7XHJcbi8vICAgICAgICAgdGhpcy5jZW50ZXJYSW5pdGlhbCA9IDA7XHJcbi8vICAgICAgICAgdGhpcy5jZW50ZXJZSW5pdGlhbCA9IDA7XHJcblxyXG4vLyAgICAgICAgIHRoaXMucmVuZGVyKCk7XHJcblxyXG4vLyAgICAgICAgIHRoaXMuYWRkVG9EZWZhdWx0R3JvdXBBbmRTZXREZWZhdWx0VmlzaWJpbGl0eSgpO1xyXG5cclxuLy8gICAgIH1cclxuXHJcbi8vICAgICBnZXRDb3B5KGtsYXNzOiBLbGFzcyk6IFJ1bnRpbWVPYmplY3Qge1xyXG5cclxuLy8gICAgICAgICBsZXQgcm86IFJ1bnRpbWVPYmplY3QgPSBuZXcgUnVudGltZU9iamVjdChrbGFzcyk7XHJcbi8vICAgICAgICAgbGV0IHJoID0gbmV3IFJvYm90SGVscGVyKHRoaXMud29ybGRIZWxwZXIuaW50ZXJwcmV0ZXIsIHJvKTtcclxuLy8gICAgICAgICByby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl0gPSByaDtcclxuXHJcbi8vICAgICAgICAgcmguY29weUZyb20odGhpcyk7XHJcbi8vICAgICAgICAgcmgucmVuZGVyKCk7XHJcblxyXG4vLyAgICAgICAgIHRoaXMuYWRkVG9EZWZhdWx0R3JvdXBBbmRTZXREZWZhdWx0VmlzaWJpbGl0eSgpO1xyXG5cclxuLy8gICAgICAgICByZXR1cm4gcm87XHJcbi8vICAgICB9XHJcblxyXG4vLyAgICAgcmVuZGVyKCk6IHZvaWQge1xyXG5cclxuLy8gICAgICAgICB0aGlzLmhpdFBvbHlnb25Jbml0aWFsID0gW1xyXG4vLyAgICAgICAgIF07XHJcblxyXG4vLyAgICAgICAgIHRoaXMud29ybGRIZWxwZXIuYXBwLnJlbmRlcmVyLmJhY2tncm91bmRDb2xvciA9IDB4ZmZmZmZmO1xyXG5cclxuLy8gICAgICAgICBpZiAodGhpcy5kaXNwbGF5T2JqZWN0ID09IG51bGwpIHtcclxuLy8gICAgICAgICAgICAgbGV0IG1lc2ggPSBQSVhJM0QuTWVzaDNELmNyZWF0ZUN1YmUoKVxyXG4vLyAgICAgICAgICAgICBsZXQgcGxhbmUgPSBQSVhJM0QuTWVzaDNELmNyZWF0ZVBsYW5lKCk7XHJcbi8vICAgICAgICAgICAgIHBsYW5lLnkgPSAtMC44O1xyXG4vLyAgICAgICAgICAgICBwbGFuZS5zY2FsZS5zZXQoMTUwKTtcclxuXHJcbi8vICAgICAgICAgICAgIGxldCBjb250YWluZXIzRCA9IG5ldyBQSVhJM0QuQ29udGFpbmVyM0QoKTtcclxuLy8gICAgICAgICAgICAgY29udGFpbmVyM0QuYWRkQ2hpbGQobWVzaCk7XHJcbi8vICAgICAgICAgICAgIGNvbnRhaW5lcjNELmFkZENoaWxkKHBsYW5lKTtcclxuXHJcbi8vICAgICAgICAgICAgIHRoaXMuZGlzcGxheU9iamVjdCA9IGNvbnRhaW5lcjNEO1xyXG4vLyAgICAgICAgICAgICB0aGlzLndvcmxkSGVscGVyLnN0YWdlLmFkZENoaWxkKHRoaXMuZGlzcGxheU9iamVjdCk7XHJcblxyXG4vLyAgICAgICAgICAgICBsZXQgbGlnaHQxID0gT2JqZWN0LmFzc2lnbihuZXcgUElYSTNELkxpZ2h0KCksIHtcclxuLy8gICAgICAgICAgICAgICAgIHR5cGU6IFBJWEkzRC5MaWdodFR5cGUucG9pbnQsXHJcbi8vICAgICAgICAgICAgICAgICByYW5nZTogMTAwLFxyXG4vLyAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiA2MCxcclxuLy8gICAgICAgICAgICAgICAgIGNvbG9yOiBuZXcgUElYSTNELkNvbG9yKDEsIDEsIDEpXHJcbi8vICAgICAgICAgICAgICAgfSk7XHJcbi8vICAgICAgICAgICAgIGxpZ2h0MS5wb3NpdGlvbi5zZXQoLTQsIDcsIDQpO1xyXG4vLyAgICAgICAgICAgICBsZXQgbGlnaHQyID0gT2JqZWN0LmFzc2lnbihuZXcgUElYSTNELkxpZ2h0KCksIHtcclxuLy8gICAgICAgICAgICAgICAgIHR5cGU6IFBJWEkzRC5MaWdodFR5cGUucG9pbnQsXHJcbi8vICAgICAgICAgICAgICAgICByYW5nZTogMTAwLFxyXG4vLyAgICAgICAgICAgICAgICAgaW50ZW5zaXR5OiA2MCxcclxuLy8gICAgICAgICAgICAgICAgIGNvbG9yOiBuZXcgUElYSTNELkNvbG9yKDEsIDEsIDEpXHJcbi8vICAgICAgICAgICAgICAgfSk7XHJcbi8vICAgICAgICAgICAgIGxpZ2h0Mi5wb3NpdGlvbi5zZXQoNCwgNywgLTQpO1xyXG4vLyAgICAgICAgICAgICAvLyBsaWdodC5yb3RhdGlvblF1YXRlcm5pb24uc2V0RXVsZXJBbmdsZXMoNDUsIDQ1LCAwKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIFxyXG4vLyAgICAgICAgICAgICBsZXQgbGlnaHRpbmdFbnZpcm9ubWVudCA9IG5ldyBQSVhJM0QuTGlnaHRpbmdFbnZpcm9ubWVudCg8UElYSS5SZW5kZXJlcj50aGlzLndvcmxkSGVscGVyLmFwcC5yZW5kZXJlcik7XHJcbi8vICAgICAgICAgICAgIGxpZ2h0aW5nRW52aXJvbm1lbnQubGlnaHRzLnB1c2gobGlnaHQxLCBsaWdodDIpO1xyXG4vLyAgICAgICAgICAgICBsZXQgY2FtZXJhID0gbmV3IFBJWEkzRC5DYW1lcmEoPFBJWEkuUmVuZGVyZXI+dGhpcy53b3JsZEhlbHBlci5hcHAucmVuZGVyZXIpO1xyXG5cclxuLy8gICAgICAgICAgICAgZm9yKGxldCBtZXNoIG9mIGNvbnRhaW5lcjNELmNoaWxkcmVuIGFzIFBJWEkzRC5NZXNoM0RbXSl7XHJcbi8vICAgICAgICAgICAgICAgICBsZXQgbWF0ZXJpYWwgPSA8UElYSTNELlN0YW5kYXJkTWF0ZXJpYWw+bWVzaC5tYXRlcmlhbDtcclxuLy8gICAgICAgICAgICAgICAgIG1hdGVyaWFsLmxpZ2h0aW5nRW52aXJvbm1lbnQgPSBsaWdodGluZ0Vudmlyb25tZW50O1xyXG4vLyAgICAgICAgICAgICAgICAgbWF0ZXJpYWwuY2FtZXJhID0gY2FtZXJhO1xyXG4vLyAgICAgICAgICAgICAgICAgbWF0ZXJpYWwuYmFzZUNvbG9yID0gbmV3IFBJWEkzRC5Db2xvcigxLCAwLCAwLCAxKTsgLy8gVGhlIGJhc2UgY29sb3Igd2lsbCBiZSBibGVuZGVkIHRvZ2V0aGVyIHdpdGggYmFzZSBjb2xvciB0ZXh0dXJlIChpZiBhdmFpbGFibGUpLlxyXG4vLyAgICAgICAgICAgICAgICAgbWF0ZXJpYWwudW5saXQgPSBmYWxzZTsgLy8gU2V0IHVubGl0ID0gdHJ1ZSB0byBkaXNhYmxlIGFsbCBsaWdodGluZy5cclxuLy8gICAgICAgICAgICAgfVxyXG4vLyAgICAgICAgICAgICAvLyBtYXRlcmlhbC5hbHBoYU1vZGUgPSBQSVhJM0QuU3RhbmRhcmRNYXRlcmlhbEFscGhhTW9kZS5vcGFxdWU7IC8vIFNldCBhbHBoYSBtb2RlIHRvIFwiYmxlbmRcIiBmb3IgdHJhbnNwYXJlbmN5IChiYXNlIGNvbG9yIGFscGhhIGxlc3MgdGhhbiAxKS5cclxuLy8gICAgICAgICAgICAgLy8gbWF0ZXJpYWwuZXhwb3N1cmUgPSAyOyAvLyBTZXQgZXhwb3N1cmUgdG8gYmUgYWJsZSB0byBjb250cm9sIHRoZSBicmlnaHRuZXNzLlxyXG4vLyAgICAgICAgICAgICAvLyBtYXRlcmlhbC5tZXRhbGxpYyA9IDA7IC8vIFNldCB0byAxIGZvciBhIG1ldGFsbGljIG1hdGVyaWFsLlxyXG4vLyAgICAgICAgICAgICAvLyBtYXRlcmlhbC5yb3VnaG5lc3MgPSAwLjM7IC8vIFZhbHVlIGJldHdlZW4gMCBhbmQgMSB3aGljaCBkZXNjcmliZXMgdGhlIHJvdWdobmVzcyBvZiB0aGUgbWF0ZXJpYWwuXHJcbiAgICAgICAgXHJcbi8vICAgICAgICAgICAgIC8vIG1hdGVyaWFsLmVtaXNzaXZlID0gbmV3IFBJWEkzRC5Db2xvcigxLjAsIDAuMCwgMC4wLCAxLjApO1xyXG4vLyAgICAgICAgICAgICAvLyBtYXRlcmlhbC5iYXNlQ29sb3IgPSBuZXcgUElYSTNELkNvbG9yKDEuMCwgMC4zLCAwLjMsIDEuMCk7XHJcbiAgICAgICAgICAgIFxyXG4vLyAgICAgICAgICAgICBsZXQgY29udHJvbCA9IG5ldyBQSVhJM0QuQ2FtZXJhT3JiaXRDb250cm9sKHRoaXMud29ybGRIZWxwZXIuYXBwLnZpZXcsIGNhbWVyYSk7XHJcbi8vICAgICAgICAgICAgIGNvbnRyb2wuYW5nbGVzLnggPSAyMDtcclxuLy8gICAgICAgICB9IFxyXG5cclxuXHJcbi8vICAgICB9O1xyXG5cclxuXHJcbi8vIH1cclxuIl19