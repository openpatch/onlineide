import { Class } from "../../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { ShapeHelper } from "./Shape.js";
import { HitPolygonStore } from "./PolygonStore.js";
import { ArrayType } from "../../compiler/types/Array.js";
export class SpriteClass extends Class {
    constructor(module) {
        super("Sprite", module);
        this.setBaseClass(module.typeStore.getType("Shape"));
        this.isAbstract = true;
        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));
        this.addMethod(new Method("Sprite", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "spriteLibraryEntry", type: module.typeStore.getType("SpriteLibrary"), declaration: null, usagePositions: null, isFinal: true },
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let x = parameters[1].value;
            let y = parameters[2].value;
            let spriteLibraryEntry = parameters[3].value;
            let index = parameters[4].value;
            let rh = new SpriteHelper(x, y, spriteLibraryEntry.enumValue.identifier, index, module.main.interpreter.worldHelper, o);
            o.intrinsicData["Actor"] = rh;
        }, false, false, 'Instanziert ein neues Sprite und stellt es an der Position (x, y) dar. SpriteLibraryEntry ist ein Auzählungstyp (enum). Gib einfach SpriteLibraryEntry gefolgt von einem Punkt ein, dann erhältst Du ein Auswahl von Bildern.', true));
        this.addMethod(new Method("Sprite", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "spriteLibraryEntry", type: module.typeStore.getType("SpriteLibrary"), declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let x = parameters[1].value;
            let y = parameters[2].value;
            let spriteLibraryEntry = parameters[3].value;
            let rh = new SpriteHelper(x, y, spriteLibraryEntry.enumValue.identifier, null, module.main.interpreter.worldHelper, o);
            o.intrinsicData["Actor"] = rh;
        }, false, false, 'Instanziert ein neues Sprite und stellt es an der Position (x, y) dar. SpriteLibraryEntry ist ein Auzählungstyp (enum). Gib einfach SpriteLibraryEntry gefolgt von einem Punkt ein, dann erhältst Du ein Auswahl von Bildern.', true));
        this.addMethod(new Method("setImage", new Parameterlist([
            { identifier: "spriteLibraryEntry", type: module.typeStore.getType("SpriteLibrary"), declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let spriteLibraryEntry = parameters[1].value;
            let sh = o.intrinsicData["Actor"];
            sh.setTexture(spriteLibraryEntry.enumValue.identifier);
        }, false, false, 'Ändert das Bild des Sprites. SpriteLibraryEntry ist ein Auzählungstyp (enum). Gib einfach SpriteLibraryEntry gefolgt von einem Punkt ein, dann erhältst Du ein Auswahl von Bildern.', false));
        this.addMethod(new Method("setImage", new Parameterlist([
            { identifier: "spriteLibraryEntry", type: module.typeStore.getType("SpriteLibrary"), declaration: null, usagePositions: null, isFinal: true },
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let spriteLibraryEntry = parameters[1].value;
            let index = parameters[2].value;
            let sh = o.intrinsicData["Actor"];
            sh.setTexture(spriteLibraryEntry.enumValue.identifier, index);
        }, false, false, 'Ändert das Bild des Sprites. SpriteLibraryEntry ist ein Auzählungstyp (enum). Gib einfach SpriteLibraryEntry gefolgt von einem Punkt ein, dann erhältst Du ein Auswahl von Bildern.', false));
        this.addMethod(new Method("playAnimation", new Parameterlist([
            { identifier: "indexArray", type: new ArrayType(intPrimitiveType), declaration: null, usagePositions: null, isFinal: true },
            { identifier: "repeatType", type: module.typeStore.getType("RepeatType"), declaration: null, usagePositions: null, isFinal: true },
            { identifier: "imagesPerSecond", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let indexArray = parameters[1].value;
            let repeatType = parameters[2].value;
            let imagesPerSecond = parameters[3].value;
            let sh = o.intrinsicData["Actor"];
            let indices = [];
            for (let v of indexArray) {
                indices.push(v.value);
            }
            sh.playAnimation(indices, repeatType.enumValue.identifier, imagesPerSecond);
        }, false, false, 'Spielt eine Animation ab.', false));
        this.addMethod(new Method("playAnimation", new Parameterlist([
            { identifier: "fromIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "toIndex", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "repeatType", type: module.typeStore.getType("RepeatType"), declaration: null, usagePositions: null, isFinal: true },
            { identifier: "imagesPerSecond", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let fromIndex = parameters[1].value;
            let toIndex = parameters[2].value;
            let repeatType = parameters[3].value;
            let imagesPerSecond = parameters[4].value;
            let sh = o.intrinsicData["Actor"];
            let indices = [];
            if (fromIndex < toIndex && toIndex - fromIndex < 10000) {
                for (let i = fromIndex; i < toIndex; i++)
                    indices.push(i);
            }
            sh.playAnimation(indices, repeatType.enumValue.identifier, imagesPerSecond);
        }, false, false, 'Spielt eine Animation ab.', false));
        this.addMethod(new Method("stopAnimation", new Parameterlist([]), null, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            sh.stopAnimation(true);
        }, false, false, 'Stoppt die gerade laufende Animation und macht das Sprite unsichtbar.', false));
    }
}
export class SpriteHelper extends ShapeHelper {
    constructor(x, y, name, index, worldHelper, runtimeObject) {
        super(worldHelper, runtimeObject);
        this.x = x;
        this.y = y;
        this.name = name;
        this.index = index;
        this.animationIndices = [];
        this.animationRuns = false;
        this.imagesPerMillisecond = 1;
        this.animationTime = 0;
        this.repeatType = "once";
        this.setTexture(null, index);
        let sprite = this.displayObject;
        sprite.anchor.x = 0;
        sprite.anchor.y = 0;
        this.displayObject.localTransform.translate(this.x - sprite.width / 2, this.y - sprite.height / 2);
        this.displayObject.transform.onChange();
        this.worldHelper.stage.addChild(sprite);
        this.centerXInitial = 0;
        this.centerYInitial = 0;
        this.render();
    }
    setTexture(name, index) {
        if (name == this.name && index == this.index)
            return;
        if (name == null)
            name = this.name;
        if (index == null)
            index = 0;
        this.index = index;
        let sheet = PIXI.Loader.shared.resources["assets/graphics/spritesheet.json"];
        name = name + "#" + index;
        let texture = sheet.textures[name];
        if (texture != null) {
            let sprite = this.displayObject;
            if (sprite == null) {
                if (texture != null) {
                    sprite = new PIXI.Sprite(texture);
                }
                this.displayObject = sprite;
            }
            else {
                sprite.texture = sheet.textures[name];
            }
            this.hitPolygonInitial = HitPolygonStore.getPolygonForTexture(name, index, this);
            this.hitPolygonDirty = true;
        }
        else {
            if (this.displayObject == null) {
                this.displayObject = new PIXI.Sprite();
            }
        }
    }
    render() {
    }
    ;
    playAnimation(indexArray, repeatType, imagesPerSecond) {
        this.stopAnimation(false);
        this.animationIndices = indexArray;
        this.repeatType = repeatType;
        this.imagesPerMillisecond = imagesPerSecond / 1000;
        this.animationTime = 0;
        this.animationRuns = true;
        this.worldHelper.spriteAnimations.push(this);
    }
    stopAnimation(setInvisible) {
        if (this.animationRuns) {
            let spriteHelperList = this.worldHelper.spriteAnimations;
            let i = spriteHelperList.indexOf(this);
            spriteHelperList.splice(i, 1);
        }
        this.animationRuns = false;
        if (setInvisible)
            this.setVisible(false);
    }
    tick(deltaTime) {
        let image;
        if (this.repeatType == "backAndForth") {
            let period2 = this.animationIndices.length * 2 / this.imagesPerMillisecond;
            let numberOfPeriodsDone = Math.trunc(this.animationTime / period2);
            let timeIntoPeriod = this.animationTime - numberOfPeriodsDone * period2;
            image = this.imagesPerMillisecond * timeIntoPeriod;
            if (image >= this.animationIndices.length) {
                image = 2 * this.animationIndices.length - image;
            }
            image = Math.trunc(image);
        }
        else if (this.repeatType == "loop") {
            let period = this.animationIndices.length / this.imagesPerMillisecond;
            let numberOfPeriodsDone = Math.trunc(this.animationTime / period);
            let timeIntoPeriod = this.animationTime - numberOfPeriodsDone * period;
            image = this.imagesPerMillisecond * timeIntoPeriod;
            image = Math.trunc(image);
        }
        else {
            image = Math.trunc(this.imagesPerMillisecond * this.animationTime);
            if (image >= this.animationIndices.length) {
                this.stopAnimation(true);
                return;
            }
        }
        this.animationTime += deltaTime;
        this.setTexture(null, this.animationIndices[image]);
    }
}
//# sourceMappingURL=Sprite copy.js.map