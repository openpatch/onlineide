import { Klass } from "../../compiler/types/Class.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ShapeHelper } from "./Shape.js";
export class RobotClass extends Klass {
    constructor(module) {
        super("Robot", module, "Java Karol");
        this.setBaseClass(module.typeStore.getType("Shape"));
        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));
        this.addMethod(new Method("Robot", new Parameterlist([
        // { identifier: "left", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        // { identifier: "top", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        // { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        // { identifier: "height", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let rh = new RobotHelper(module.main.getInterpreter(), o);
            o.intrinsicData["Actor"] = rh;
        }, false, false, 'Instanziert ein neues Robot-Objekt', true));
        // this.addMethod(new Method("setWidth", new Parameterlist([
        //     { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        // ]), null,
        // (parameters) => {
        //     let o: RuntimeObject = parameters[0].value;
        //     let sh: RectangleHelper = o.intrinsicData["Actor"];
        //     let width: number = parameters[1].value;
        //     if (sh.testdestroyed("setWidth")) return;
        //     sh.width = width / sh.displayObject.scale.x;
        //     sh.centerXInitial = sh.left + sh.width/2;
        //     sh.render();
        // }, false, false, "Setzt die Breite des Rechtecks.", false));
    }
}
export class RobotHelper extends ShapeHelper {
    constructor(interpreter, runtimeObject) {
        super(interpreter, runtimeObject);
        this.centerXInitial = 0;
        this.centerYInitial = 0;
        this.render();
        this.addToDefaultGroupAndSetDefaultVisibility();
    }
    getCopy(klass) {
        let ro = new RuntimeObject(klass);
        let rh = new RobotHelper(this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;
        rh.copyFrom(this);
        rh.render();
        this.addToDefaultGroupAndSetDefaultVisibility();
        return ro;
    }
    render() {
        this.hitPolygonInitial = [];
        this.worldHelper.app.renderer.backgroundColor = 0xffffff;
        if (this.displayObject == null) {
            let cube = Pixi3d.Mesh3D.createCube();
            let cubeMaterial = cube.material;
            // cubeMaterial.baseColor = new Pixi3d.Color(1, 0, 0, 1); // The base color will be blended together with base color texture (if available).
            cubeMaterial.baseColorTexture = new Pixi3d.StandardMaterialTexture(PIXI.Texture.from('assets/graphics/robot/minecraft_grass.png').baseTexture);
            cube.y += 0.5;
            let plane = Pixi3d.Mesh3D.createPlane();
            plane.material.baseColor = new Pixi3d.Color(0, 1, 0, 1); // The base color will be blended together with base color texture (if available).
            plane.y = -0.5;
            plane.scale.set(10);
            let container3D = new Pixi3d.Container3D();
            container3D.addChild(cube);
            container3D.addChild(plane);
            this.displayObject = container3D;
            this.worldHelper.stage.addChild(this.displayObject);
            let light1 = Object.assign(new Pixi3d.Light(), {
                type: Pixi3d.LightType.point,
                range: 100,
                intensity: 60,
                color: new Pixi3d.Color(1, 1, 1)
            });
            light1.position.set(-4, 7, 4);
            let light2 = Object.assign(new Pixi3d.Light(), {
                type: Pixi3d.LightType.point,
                range: 100,
                intensity: 60,
                color: new Pixi3d.Color(1, 1, 1)
            });
            light2.position.set(4, 7, -4);
            // light.rotationQuaternion.setEulerAngles(45, 45, 0);
            let lightingEnvironment = new Pixi3d.LightingEnvironment(this.worldHelper.app.renderer);
            lightingEnvironment.lights.push(light1, light2);
            let camera = new Pixi3d.Camera(this.worldHelper.app.renderer);
            for (let mesh of container3D.children) {
                let material = mesh.material;
                material.lightingEnvironment = lightingEnvironment;
                material.camera = camera;
                material.unlit = false; // Set unlit = true to disable all lighting.
            }
            // material.alphaMode = Pixi3d.StandardMaterialAlphaMode.opaque; // Set alpha mode to "blend" for transparency (base color alpha less than 1).
            // material.exposure = 2; // Set exposure to be able to control the brightness.
            // material.metallic = 0; // Set to 1 for a metallic material.
            // material.roughness = 0.3; // Value between 0 and 1 which describes the roughness of the material.
            // material.emissive = new Pixi3d.Color(1.0, 0.0, 0.0, 1.0);
            // material.baseColor = new Pixi3d.Color(1.0, 0.3, 0.3, 1.0);
            let control = new Pixi3d.CameraOrbitControl(this.worldHelper.app.view, camera);
            control.angles.x = 20;
        }
    }
    ;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUm9ib3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1JvYm90LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUV0RCxPQUFPLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ3RFLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUtuRSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRXpDLE1BQU0sT0FBTyxVQUFXLFNBQVEsS0FBSztJQUVqQyxZQUFZLE1BQWM7UUFFdEIsS0FBSyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFFckMsSUFBSSxDQUFDLFlBQVksQ0FBUSxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRTVELDhKQUE4SjtRQUU5SixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLGFBQWEsQ0FBQztRQUNqRCw2R0FBNkc7UUFDN0csNEdBQTRHO1FBQzVHLDhHQUE4RztRQUM5RywrR0FBK0c7U0FDbEgsQ0FBQyxFQUFFLElBQUksRUFDSixDQUFDLFVBQVUsRUFBRSxFQUFFO1lBRVgsSUFBSSxDQUFDLEdBQWtCLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFFM0MsSUFBSSxFQUFFLEdBQUcsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxRCxDQUFDLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUVsQyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxv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RCxRQUFRLENBQUMsbUJBQW1CLEdBQUcsbUJBQW1CLENBQUM7Z0JBQ25ELFFBQVEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO2dCQUN6QixRQUFRLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLDRDQUE0QzthQUN2RTtZQUNELDhJQUE4STtZQUM5SSwrRUFBK0U7WUFDL0UsOERBQThEO1lBQzlELG9HQUFvRztZQUVwRyw0REFBNEQ7WUFDNUQsNkRBQTZEO1lBRTdELElBQUksT0FBTyxHQUFHLElBQUksTUFBTSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMvRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDekI7SUFHTCxDQUFDO0lBQUEsQ0FBQztDQUdMIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgS2xhc3MgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgZG91YmxlUHJpbWl0aXZlVHlwZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBNZXRob2QsIFBhcmFtZXRlcmxpc3QgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgUnVudGltZU9iamVjdCB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9SdW50aW1lT2JqZWN0LmpzXCI7XHJcbmltcG9ydCB7IEZpbGxlZFNoYXBlSGVscGVyIH0gZnJvbSBcIi4vRmlsbGVkU2hhcGUuanNcIjtcclxuaW1wb3J0IHsgV29ybGRIZWxwZXIgfSBmcm9tIFwiLi9Xb3JsZC5qc1wiO1xyXG5pbXBvcnQgeyBJbnRlcnByZXRlciB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9JbnRlcnByZXRlci5qc1wiO1xyXG5pbXBvcnQgeyBGaWxsZWRTaGFwZURlZmF1bHRzIH0gZnJvbSBcIi4vRmlsbGVkU2hhcGVEZWZhdWx0cy5qc1wiO1xyXG5pbXBvcnQgeyBTaGFwZUhlbHBlciB9IGZyb20gXCIuL1NoYXBlLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUm9ib3RDbGFzcyBleHRlbmRzIEtsYXNzIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihtb2R1bGU6IE1vZHVsZSkge1xyXG5cclxuICAgICAgICBzdXBlcihcIlJvYm90XCIsIG1vZHVsZSwgXCJKYXZhIEthcm9sXCIpO1xyXG5cclxuICAgICAgICB0aGlzLnNldEJhc2VDbGFzcyg8S2xhc3M+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiU2hhcGVcIikpO1xyXG5cclxuICAgICAgICAvLyB0aGlzLmFkZEF0dHJpYnV0ZShuZXcgQXR0cmlidXRlKFwiUElcIiwgZG91YmxlUHJpbWl0aXZlVHlwZSwgKG9iamVjdCkgPT4geyByZXR1cm4gTWF0aC5QSSB9LCB0cnVlLCBWaXNpYmlsaXR5LnB1YmxpYywgdHJ1ZSwgXCJEaWUgS3JlaXN6YWhsIFBpICgzLjE0MTUuLi4pXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIlJvYm90XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgLy8geyBpZGVudGlmaWVyOiBcImxlZnRcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIC8vIHsgaWRlbnRpZmllcjogXCJ0b3BcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIC8vIHsgaWRlbnRpZmllcjogXCJ3aWR0aFwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgLy8geyBpZGVudGlmaWVyOiBcImhlaWdodFwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGxldCByaCA9IG5ldyBSb2JvdEhlbHBlcihtb2R1bGUubWFpbi5nZXRJbnRlcnByZXRlcigpLCBvKTtcclxuICAgICAgICAgICAgICAgIG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdID0gcmg7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnSW5zdGFuemllcnQgZWluIG5ldWVzIFJvYm90LU9iamVrdCcsIHRydWUpKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJzZXRXaWR0aFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIC8vICAgICB7IGlkZW50aWZpZXI6IFwid2lkdGhcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICAgICAgLy8gXSksIG51bGwsXHJcbiAgICAgICAgICAgIC8vIChwYXJhbWV0ZXJzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgLy8gICAgIGxldCBzaDogUmVjdGFuZ2xlSGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcbiAgICAgICAgICAgIC8vICAgICBsZXQgd2lkdGg6IG51bWJlciA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gICAgIGlmIChzaC50ZXN0ZGVzdHJveWVkKFwic2V0V2lkdGhcIikpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIC8vICAgICBzaC53aWR0aCA9IHdpZHRoIC8gc2guZGlzcGxheU9iamVjdC5zY2FsZS54O1xyXG4gICAgICAgICAgICAvLyAgICAgc2guY2VudGVyWEluaXRpYWwgPSBzaC5sZWZ0ICsgc2gud2lkdGgvMjtcclxuXHJcbiAgICAgICAgICAgIC8vICAgICBzaC5yZW5kZXIoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIH0sIGZhbHNlLCBmYWxzZSwgXCJTZXR6dCBkaWUgQnJlaXRlIGRlcyBSZWNodGVja3MuXCIsIGZhbHNlKSk7XHJcblxyXG4gICAgXHJcblxyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFJvYm90SGVscGVyIGV4dGVuZHMgU2hhcGVIZWxwZXIge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGludGVycHJldGVyOiBJbnRlcnByZXRlciwgcnVudGltZU9iamVjdDogUnVudGltZU9iamVjdCkge1xyXG4gICAgICAgIHN1cGVyKGludGVycHJldGVyLCBydW50aW1lT2JqZWN0KTtcclxuICAgICAgICB0aGlzLmNlbnRlclhJbml0aWFsID0gMDtcclxuICAgICAgICB0aGlzLmNlbnRlcllJbml0aWFsID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRUb0RlZmF1bHRHcm91cEFuZFNldERlZmF1bHRWaXNpYmlsaXR5KCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldENvcHkoa2xhc3M6IEtsYXNzKTogUnVudGltZU9iamVjdCB7XHJcblxyXG4gICAgICAgIGxldCBybzogUnVudGltZU9iamVjdCA9IG5ldyBSdW50aW1lT2JqZWN0KGtsYXNzKTtcclxuICAgICAgICBsZXQgcmggPSBuZXcgUm9ib3RIZWxwZXIodGhpcy53b3JsZEhlbHBlci5pbnRlcnByZXRlciwgcm8pO1xyXG4gICAgICAgIHJvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXSA9IHJoO1xyXG5cclxuICAgICAgICByaC5jb3B5RnJvbSh0aGlzKTtcclxuICAgICAgICByaC5yZW5kZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRUb0RlZmF1bHRHcm91cEFuZFNldERlZmF1bHRWaXNpYmlsaXR5KCk7XHJcblxyXG4gICAgICAgIHJldHVybiBybztcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoKTogdm9pZCB7XHJcblxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5oaXRQb2x5Z29uSW5pdGlhbCA9IFtcclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICB0aGlzLndvcmxkSGVscGVyLmFwcC5yZW5kZXJlci5iYWNrZ3JvdW5kQ29sb3IgPSAweGZmZmZmZjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZGlzcGxheU9iamVjdCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxldCBjdWJlID0gUGl4aTNkLk1lc2gzRC5jcmVhdGVDdWJlKCk7XHJcbiAgICAgICAgICAgIGxldCBjdWJlTWF0ZXJpYWwgPSA8UGl4aTNkLlN0YW5kYXJkTWF0ZXJpYWw+Y3ViZS5tYXRlcmlhbDtcclxuICAgICAgICAgICAgLy8gY3ViZU1hdGVyaWFsLmJhc2VDb2xvciA9IG5ldyBQaXhpM2QuQ29sb3IoMSwgMCwgMCwgMSk7IC8vIFRoZSBiYXNlIGNvbG9yIHdpbGwgYmUgYmxlbmRlZCB0b2dldGhlciB3aXRoIGJhc2UgY29sb3IgdGV4dHVyZSAoaWYgYXZhaWxhYmxlKS5cclxuICAgICAgICAgICAgY3ViZU1hdGVyaWFsLmJhc2VDb2xvclRleHR1cmUgPSBuZXcgUGl4aTNkLlN0YW5kYXJkTWF0ZXJpYWxUZXh0dXJlKFBJWEkuVGV4dHVyZS5mcm9tKCdhc3NldHMvZ3JhcGhpY3Mvcm9ib3QvbWluZWNyYWZ0X2dyYXNzLnBuZycpLmJhc2VUZXh0dXJlKTtcclxuICAgICAgICAgICAgY3ViZS55ICs9IDAuNTtcclxuXHJcbiAgICAgICAgICAgIGxldCBwbGFuZSA9IFBpeGkzZC5NZXNoM0QuY3JlYXRlUGxhbmUoKTtcclxuICAgICAgICAgICAgKDxQaXhpM2QuU3RhbmRhcmRNYXRlcmlhbD5wbGFuZS5tYXRlcmlhbCkuYmFzZUNvbG9yID0gbmV3IFBpeGkzZC5Db2xvcigwLCAxLCAwLCAxKTsgLy8gVGhlIGJhc2UgY29sb3Igd2lsbCBiZSBibGVuZGVkIHRvZ2V0aGVyIHdpdGggYmFzZSBjb2xvciB0ZXh0dXJlIChpZiBhdmFpbGFibGUpLlxyXG4gICAgICAgICAgICBwbGFuZS55ID0gLTAuNTtcclxuICAgICAgICAgICAgcGxhbmUuc2NhbGUuc2V0KDEwKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjb250YWluZXIzRCA9IG5ldyBQaXhpM2QuQ29udGFpbmVyM0QoKTtcclxuICAgICAgICAgICAgY29udGFpbmVyM0QuYWRkQ2hpbGQoY3ViZSk7XHJcbiAgICAgICAgICAgIGNvbnRhaW5lcjNELmFkZENoaWxkKHBsYW5lKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheU9iamVjdCA9IGNvbnRhaW5lcjNEO1xyXG4gICAgICAgICAgICB0aGlzLndvcmxkSGVscGVyLnN0YWdlLmFkZENoaWxkKHRoaXMuZGlzcGxheU9iamVjdCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgbGlnaHQxID0gT2JqZWN0LmFzc2lnbihuZXcgUGl4aTNkLkxpZ2h0KCksIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFBpeGkzZC5MaWdodFR5cGUucG9pbnQsXHJcbiAgICAgICAgICAgICAgICByYW5nZTogMTAwLFxyXG4gICAgICAgICAgICAgICAgaW50ZW5zaXR5OiA2MCxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiBuZXcgUGl4aTNkLkNvbG9yKDEsIDEsIDEpXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGxpZ2h0MS5wb3NpdGlvbi5zZXQoLTQsIDcsIDQpO1xyXG4gICAgICAgICAgICBsZXQgbGlnaHQyID0gT2JqZWN0LmFzc2lnbihuZXcgUGl4aTNkLkxpZ2h0KCksIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFBpeGkzZC5MaWdodFR5cGUucG9pbnQsXHJcbiAgICAgICAgICAgICAgICByYW5nZTogMTAwLFxyXG4gICAgICAgICAgICAgICAgaW50ZW5zaXR5OiA2MCxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiBuZXcgUGl4aTNkLkNvbG9yKDEsIDEsIDEpXHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGxpZ2h0Mi5wb3NpdGlvbi5zZXQoNCwgNywgLTQpO1xyXG4gICAgICAgICAgICAvLyBsaWdodC5yb3RhdGlvblF1YXRlcm5pb24uc2V0RXVsZXJBbmdsZXMoNDUsIDQ1LCAwKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBsZXQgbGlnaHRpbmdFbnZpcm9ubWVudCA9IG5ldyBQaXhpM2QuTGlnaHRpbmdFbnZpcm9ubWVudCg8UElYSS5SZW5kZXJlcj50aGlzLndvcmxkSGVscGVyLmFwcC5yZW5kZXJlcik7XHJcbiAgICAgICAgICAgIGxpZ2h0aW5nRW52aXJvbm1lbnQubGlnaHRzLnB1c2gobGlnaHQxLCBsaWdodDIpO1xyXG4gICAgICAgICAgICBsZXQgY2FtZXJhID0gbmV3IFBpeGkzZC5DYW1lcmEoPFBJWEkuUmVuZGVyZXI+dGhpcy53b3JsZEhlbHBlci5hcHAucmVuZGVyZXIpO1xyXG5cclxuICAgICAgICAgICAgZm9yKGxldCBtZXNoIG9mIGNvbnRhaW5lcjNELmNoaWxkcmVuIGFzIFBpeGkzZC5NZXNoM0RbXSl7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWF0ZXJpYWwgPSA8UGl4aTNkLlN0YW5kYXJkTWF0ZXJpYWw+bWVzaC5tYXRlcmlhbDtcclxuICAgICAgICAgICAgICAgIG1hdGVyaWFsLmxpZ2h0aW5nRW52aXJvbm1lbnQgPSBsaWdodGluZ0Vudmlyb25tZW50O1xyXG4gICAgICAgICAgICAgICAgbWF0ZXJpYWwuY2FtZXJhID0gY2FtZXJhO1xyXG4gICAgICAgICAgICAgICAgbWF0ZXJpYWwudW5saXQgPSBmYWxzZTsgLy8gU2V0IHVubGl0ID0gdHJ1ZSB0byBkaXNhYmxlIGFsbCBsaWdodGluZy5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBtYXRlcmlhbC5hbHBoYU1vZGUgPSBQaXhpM2QuU3RhbmRhcmRNYXRlcmlhbEFscGhhTW9kZS5vcGFxdWU7IC8vIFNldCBhbHBoYSBtb2RlIHRvIFwiYmxlbmRcIiBmb3IgdHJhbnNwYXJlbmN5IChiYXNlIGNvbG9yIGFscGhhIGxlc3MgdGhhbiAxKS5cclxuICAgICAgICAgICAgLy8gbWF0ZXJpYWwuZXhwb3N1cmUgPSAyOyAvLyBTZXQgZXhwb3N1cmUgdG8gYmUgYWJsZSB0byBjb250cm9sIHRoZSBicmlnaHRuZXNzLlxyXG4gICAgICAgICAgICAvLyBtYXRlcmlhbC5tZXRhbGxpYyA9IDA7IC8vIFNldCB0byAxIGZvciBhIG1ldGFsbGljIG1hdGVyaWFsLlxyXG4gICAgICAgICAgICAvLyBtYXRlcmlhbC5yb3VnaG5lc3MgPSAwLjM7IC8vIFZhbHVlIGJldHdlZW4gMCBhbmQgMSB3aGljaCBkZXNjcmliZXMgdGhlIHJvdWdobmVzcyBvZiB0aGUgbWF0ZXJpYWwuXHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIG1hdGVyaWFsLmVtaXNzaXZlID0gbmV3IFBpeGkzZC5Db2xvcigxLjAsIDAuMCwgMC4wLCAxLjApO1xyXG4gICAgICAgICAgICAvLyBtYXRlcmlhbC5iYXNlQ29sb3IgPSBuZXcgUGl4aTNkLkNvbG9yKDEuMCwgMC4zLCAwLjMsIDEuMCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBsZXQgY29udHJvbCA9IG5ldyBQaXhpM2QuQ2FtZXJhT3JiaXRDb250cm9sKHRoaXMud29ybGRIZWxwZXIuYXBwLnZpZXcsIGNhbWVyYSk7XHJcbiAgICAgICAgICAgIGNvbnRyb2wuYW5nbGVzLnggPSAyMDtcclxuICAgICAgICB9IFxyXG5cclxuXHJcbiAgICB9O1xyXG5cclxuXHJcbn1cclxuIl19