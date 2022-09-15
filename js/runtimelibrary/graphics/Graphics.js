import { Class } from "../../compiler/types/Class.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
export class GraphicsClass extends Class {
    constructor(module) {
        super("Graphics", module);
        this.setBaseClass(module.typeStore.getType("Object"));
        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));
        this.addMethod(new Method("Graphics", new Parameterlist([
            { identifier: "breite", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "höhe", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let breite = parameters[1].value;
            let höhe = parameters[2].value;
            let gh = new GraphicsHelper(breite, höhe);
            o.intrinsicData = gh;
        }, false, false, "Legt einen neuen Grafikbereich an", true));
        this.addMethod(new Method("Graphics", new Parameterlist([]), null, (parameters) => {
            let o = parameters[0].value;
            let gh = new GraphicsHelper(800, 600);
            o.intrinsicData = gh;
        }, false, false, "Legt einen neuen Grafikbereich an. Das Koordinatensystem geht von 0 bis 800 in x-Richtung und von 0 - 600 in y-Richtung.", true));
    }
}
export class GraphicsHelper {
    constructor(breite, höhe) {
        this.breite = breite;
        this.höhe = höhe;
        this.$containerOuter = $('<div></div>');
        let ratio = Math.round(höhe / breite * 100);
        this.$containerOuter.css('padding-bottom', ratio + "%");
        let $containerInner = $('<div></div>');
        this.$containerOuter.append($containerInner);
        $('#graphics').append(this.$containerOuter);
        this.app = new PIXI.Application({ antialias: true,
            width: breite, height: höhe,
        });
        this.stage = new PIXI.Container();
        this.app.stage.addChild(this.stage);
        $containerInner.append(this.app.view);
        // this.stage.localTransform.translate(-400, -300);
        // this.stage.localTransform.rotate(45/180*Math.PI);
        // this.stage.localTransform.translate(400,300);
        // this.stage.transform.onChange();
        GraphicsHelper.helperList.push(this);
    }
    removeGraphic() {
        this.app.destroy();
        this.$containerOuter.remove();
    }
    static removeGraphic() {
        for (let helper of GraphicsHelper.helperList) {
            helper.removeGraphic();
        }
        GraphicsHelper.helperList = [];
    }
    static getDefaultGraphicHelper() {
        if (GraphicsHelper.helperList.length == 0) {
            GraphicsHelper.helperList.push(new GraphicsHelper(800, 600));
        }
        return GraphicsHelper.helperList[0];
    }
}
GraphicsHelper.helperList = [];
//# sourceMappingURL=Graphics.js.map