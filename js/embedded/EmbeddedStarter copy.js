import { booleanPrimitiveType, charPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Formatter } from "../main/gui/Formatter.js";
import { ThemeManager } from "../main/gui/ThemeManager.js";
import { MainEmbedded } from "./MainEmbedded.js";
export class EmbeddedStarter {
    constructor() {
        this.startupComplete = 2;
        this.mainEmbeddedList = [];
    }
    initGUI() {
        this.initTypes();
        this.checkStartupComplete();
        this.correctPIXITransform();
        PIXI.utils.skipHello(); // don't show PIXI-Message in browser console
        this.themeManager = new ThemeManager();
    }
    correctPIXITransform() {
        PIXI.Transform.prototype.updateTransform = function (parentTransform) {
            var lt = this.localTransform;
            if (this._localID !== this._currentLocalID) {
                this._currentLocalID = this._localID;
                // force an update..
                this._parentID = -1;
            }
            //@ts-ignore
            if (this._parentID !== parentTransform._worldID) {
                // concat the parent matrix with the objects transform.
                var pt = parentTransform.worldTransform;
                var wt = this.worldTransform;
                wt.a = (lt.a * pt.a) + (lt.b * pt.c);
                wt.b = (lt.a * pt.b) + (lt.b * pt.d);
                wt.c = (lt.c * pt.a) + (lt.d * pt.c);
                wt.d = (lt.c * pt.b) + (lt.d * pt.d);
                wt.tx = (lt.tx * pt.a) + (lt.ty * pt.c) + pt.tx;
                wt.ty = (lt.tx * pt.b) + (lt.ty * pt.d) + pt.ty;
                //@ts-ignore
                this._parentID = parentTransform._worldID;
                // update the id of the transform..
                this._worldID++;
            }
        };
    }
    initEditor() {
        new Formatter().init();
        this.checkStartupComplete();
    }
    checkStartupComplete() {
        this.startupComplete--;
        if (this.startupComplete == 0) {
            this.start();
        }
    }
    initTypes() {
        voidPrimitiveType.init();
        intPrimitiveType.init();
        floatPrimitiveType.init();
        doublePrimitiveType.init();
        booleanPrimitiveType.init();
        stringPrimitiveType.init();
        charPrimitiveType.init();
    }
    start() {
        this.initJavaOnlineDivs();
        // let that = this;
        // setTimeout(() => {
        //     that.monaco_editor.layout();
        // }, 200);
    }
    initJavaOnlineDivs() {
        $('.javaOnline').each((index, element) => {
            let $div = $(element);
            let scriptList = [];
            $div.find('script').each((index, element) => {
                let $script = $(element);
                let script = {
                    title: $script.attr('title'),
                    text: $script.text().trim()
                };
                scriptList.push(script);
            });
            this.initDiv($div, scriptList);
        });
    }
    initDiv($div, scriptList) {
        let me = new MainEmbedded($div, scriptList);
    }
}
$(function () {
    let embeddedStarter = new EmbeddedStarter();
    //@ts-ignore
    window.require.config({ paths: { 'vs': 'lib/monaco-editor/dev/vs' } });
    //@ts-ignore
    window.require.config({
        'vs/nls': {
            availableLanguages: {
                '*': 'de'
            }
        },
        ignoreDuplicateModules: ["vs/editor/editor.main"]
    });
    //@ts-ignore
    window.require(['vs/editor/editor.main'], function () {
        embeddedStarter.initEditor();
        embeddedStarter.initGUI();
    });
    PIXI.Loader
        .shared.add("assets/graphics/spritesheet.json")
        .load(() => { });
});
//# sourceMappingURL=EmbeddedStarter copy.js.map