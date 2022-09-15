import { booleanPrimitiveType, charPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType, IntegerType, FloatType, DoubleType, CharacterType, BooleanType } from "../compiler/types/PrimitiveTypes.js";
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
        IntegerType.init();
        FloatType.init();
        DoubleType.init();
        CharacterType.init();
        BooleanType.init();
    }
    start() {
        this.initJavaOnlineDivs();
        // let that = this;
        // setTimeout(() => {
        //     that.monaco_editor.layout();
        // }, 200);
    }
    initJavaOnlineDivs() {
        jQuery('.java-online').each((index, element) => {
            let $div = jQuery(element);
            let scriptList = [];
            $div.find('script').each((index, element) => {
                let $script = jQuery(element);
                let type = "java";
                if ($script.data('type') != null)
                    type = ($script.data('type'));
                let script = {
                    type: type,
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
jQuery(function () {
    let embeddedStarter = new EmbeddedStarter();
    let prefix = "";
    let editorPath = "lib/monaco-editor/dev/vs";
    //@ts-ignore
    if (window.javaOnlineDir != null) {
        //@ts-ignore
        prefix = window.javaOnlineDir;
    }
    //@ts-ignore
    if (window.monacoEditorPath != null) {
        //@ts-ignore
        editorPath = window.monacoEditorPath;
    }
    //@ts-ignore
    window.require.config({ paths: { 'vs': prefix + editorPath } });
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
        .shared.add(prefix + "assets/graphics/spritesheet.json")
        .load(() => { });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW1iZWRkZWRTdGFydGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9lbWJlZGRlZC9FbWJlZGRlZFN0YXJ0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLG9CQUFvQixFQUFFLGlCQUFpQixFQUFFLG1CQUFtQixFQUFFLGtCQUFrQixFQUFFLGdCQUFnQixFQUFFLG1CQUFtQixFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsTUFBTSxxQ0FBcUMsQ0FBQztBQUNqUSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDckQsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBQzNELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQVlqRCxNQUFNLE9BQU8sZUFBZTtJQUE1QjtRQUdJLG9CQUFlLEdBQUcsQ0FBQyxDQUFDO1FBSXBCLHFCQUFnQixHQUFtQixFQUFFLENBQUM7SUFpSDFDLENBQUM7SUEvR0csT0FBTztRQUVILElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUVqQixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUU1QixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUU1QixJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsNkNBQTZDO1FBRXJFLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztJQUMzQyxDQUFDO0lBRUQsb0JBQW9CO1FBRWhCLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLGVBQWUsR0FBRyxVQUFVLGVBQWU7WUFDaEUsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztZQUM3QixJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFD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LElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUd6QixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvb2xlYW5QcmltaXRpdmVUeXBlLCBjaGFyUHJpbWl0aXZlVHlwZSwgZG91YmxlUHJpbWl0aXZlVHlwZSwgZmxvYXRQcmltaXRpdmVUeXBlLCBpbnRQcmltaXRpdmVUeXBlLCBzdHJpbmdQcmltaXRpdmVUeXBlLCB2b2lkUHJpbWl0aXZlVHlwZSwgSW50ZWdlclR5cGUsIEZsb2F0VHlwZSwgRG91YmxlVHlwZSwgQ2hhcmFjdGVyVHlwZSwgQm9vbGVhblR5cGUgfSBmcm9tIFwiLi4vY29tcGlsZXIvdHlwZXMvUHJpbWl0aXZlVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgRm9ybWF0dGVyIH0gZnJvbSBcIi4uL21haW4vZ3VpL0Zvcm1hdHRlci5qc1wiO1xyXG5pbXBvcnQgeyBUaGVtZU1hbmFnZXIgfSBmcm9tIFwiLi4vbWFpbi9ndWkvVGhlbWVNYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IE1haW5FbWJlZGRlZCB9IGZyb20gXCIuL01haW5FbWJlZGRlZC5qc1wiO1xyXG5cclxuLy8gZGVjbGFyZSBjb25zdCByZXF1aXJlOiBhbnk7XHJcblxyXG5leHBvcnQgdHlwZSBTY3JpcHRUeXBlID0gXCJqYXZhXCIgfCBcImhpbnRcIjtcclxuXHJcbmV4cG9ydCB0eXBlIEpPU2NyaXB0ID0ge1xyXG4gICAgdHlwZTogU2NyaXB0VHlwZTtcclxuICAgIHRpdGxlOiBzdHJpbmc7XHJcbiAgICB0ZXh0OiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBFbWJlZGRlZFN0YXJ0ZXIge1xyXG5cclxuXHJcbiAgICBzdGFydHVwQ29tcGxldGUgPSAyO1xyXG5cclxuICAgIHRoZW1lTWFuYWdlcjogVGhlbWVNYW5hZ2VyO1xyXG5cclxuICAgIG1haW5FbWJlZGRlZExpc3Q6IE1haW5FbWJlZGRlZFtdID0gW107XHJcblxyXG4gICAgaW5pdEdVSSgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0VHlwZXMoKTtcclxuXHJcbiAgICAgICAgdGhpcy5jaGVja1N0YXJ0dXBDb21wbGV0ZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmNvcnJlY3RQSVhJVHJhbnNmb3JtKCk7XHJcblxyXG4gICAgICAgIFBJWEkudXRpbHMuc2tpcEhlbGxvKCk7IC8vIGRvbid0IHNob3cgUElYSS1NZXNzYWdlIGluIGJyb3dzZXIgY29uc29sZVxyXG5cclxuICAgICAgICB0aGlzLnRoZW1lTWFuYWdlciA9IG5ldyBUaGVtZU1hbmFnZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBjb3JyZWN0UElYSVRyYW5zZm9ybSgpIHtcclxuXHJcbiAgICAgICAgUElYSS5UcmFuc2Zvcm0ucHJvdG90eXBlLnVwZGF0ZVRyYW5zZm9ybSA9IGZ1bmN0aW9uIChwYXJlbnRUcmFuc2Zvcm0pIHtcclxuICAgICAgICAgICAgdmFyIGx0ID0gdGhpcy5sb2NhbFRyYW5zZm9ybTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2xvY2FsSUQgIT09IHRoaXMuX2N1cnJlbnRMb2NhbElEKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50TG9jYWxJRCA9IHRoaXMuX2xvY2FsSUQ7XHJcbiAgICAgICAgICAgICAgICAvLyBmb3JjZSBhbiB1cGRhdGUuLlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyZW50SUQgPSAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgaWYgKHRoaXMuX3BhcmVudElEICE9PSBwYXJlbnRUcmFuc2Zvcm0uX3dvcmxkSUQpIHtcclxuICAgICAgICAgICAgICAgIC8vIGNvbmNhdCB0aGUgcGFyZW50IG1hdHJpeCB3aXRoIHRoZSBvYmplY3RzIHRyYW5zZm9ybS5cclxuICAgICAgICAgICAgICAgIHZhciBwdCA9IHBhcmVudFRyYW5zZm9ybS53b3JsZFRyYW5zZm9ybTtcclxuICAgICAgICAgICAgICAgIHZhciB3dCA9IHRoaXMud29ybGRUcmFuc2Zvcm07XHJcbiAgICAgICAgICAgICAgICB3dC5hID0gKGx0LmEgKiBwdC5hKSArIChsdC5iICogcHQuYyk7XHJcbiAgICAgICAgICAgICAgICB3dC5iID0gKGx0LmEgKiBwdC5iKSArIChsdC5iICogcHQuZCk7XHJcbiAgICAgICAgICAgICAgICB3dC5jID0gKGx0LmMgKiBwdC5hKSArIChsdC5kICogcHQuYyk7XHJcbiAgICAgICAgICAgICAgICB3dC5kID0gKGx0LmMgKiBwdC5iKSArIChsdC5kICogcHQuZCk7XHJcbiAgICAgICAgICAgICAgICB3dC50eCA9IChsdC50eCAqIHB0LmEpICsgKGx0LnR5ICogcHQuYykgKyBwdC50eDtcclxuICAgICAgICAgICAgICAgIHd0LnR5ID0gKGx0LnR4ICogcHQuYikgKyAobHQudHkgKiBwdC5kKSArIHB0LnR5O1xyXG4gICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJlbnRJRCA9IHBhcmVudFRyYW5zZm9ybS5fd29ybGRJRDtcclxuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgaWQgb2YgdGhlIHRyYW5zZm9ybS4uXHJcbiAgICAgICAgICAgICAgICB0aGlzLl93b3JsZElEKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdEVkaXRvcigpIHtcclxuICAgICAgICBuZXcgRm9ybWF0dGVyKCkuaW5pdCgpO1xyXG4gICAgICAgIHRoaXMuY2hlY2tTdGFydHVwQ29tcGxldGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBjaGVja1N0YXJ0dXBDb21wbGV0ZSgpIHtcclxuICAgICAgICB0aGlzLnN0YXJ0dXBDb21wbGV0ZS0tO1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXJ0dXBDb21wbGV0ZSA9PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdFR5cGVzKCkge1xyXG4gICAgICAgIHZvaWRQcmltaXRpdmVUeXBlLmluaXQoKTtcclxuICAgICAgICBpbnRQcmltaXRpdmVUeXBlLmluaXQoKTtcclxuICAgICAgICBmbG9hdFByaW1pdGl2ZVR5cGUuaW5pdCgpO1xyXG4gICAgICAgIGRvdWJsZVByaW1pdGl2ZVR5cGUuaW5pdCgpO1xyXG4gICAgICAgIGJvb2xlYW5QcmltaXRpdmVUeXBlLmluaXQoKTtcclxuICAgICAgICBzdHJpbmdQcmltaXRpdmVUeXBlLmluaXQoKTtcclxuICAgICAgICBjaGFyUHJpbWl0aXZlVHlwZS5pbml0KCk7XHJcblxyXG4gICAgICAgIEludGVnZXJUeXBlLmluaXQoKTtcclxuICAgICAgICBGbG9hdFR5cGUuaW5pdCgpO1xyXG4gICAgICAgIERvdWJsZVR5cGUuaW5pdCgpO1xyXG4gICAgICAgIENoYXJhY3RlclR5cGUuaW5pdCgpO1xyXG4gICAgICAgIEJvb2xlYW5UeXBlLmluaXQoKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGFydCgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0SmF2YU9ubGluZURpdnMoKTtcclxuXHJcbiAgICAgICAgLy8gbGV0IHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIC8vIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIC8vICAgICB0aGF0Lm1vbmFjb19lZGl0b3IubGF5b3V0KCk7XHJcbiAgICAgICAgLy8gfSwgMjAwKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdEphdmFPbmxpbmVEaXZzKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGpRdWVyeSgnLmphdmEtb25saW5lJykuZWFjaCgoaW5kZXg6IG51bWJlciwgZWxlbWVudDogSFRNTEVsZW1lbnQpID0+IHtcclxuICAgICAgICAgICAgbGV0ICRkaXYgPSBqUXVlcnkoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIGxldCBzY3JpcHRMaXN0OiBKT1NjcmlwdFtdID0gW107XHJcbiAgICAgICAgICAgICRkaXYuZmluZCgnc2NyaXB0JykuZWFjaCgoaW5kZXg6IG51bWJlciwgZWxlbWVudDogSFRNTEVsZW1lbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCAkc2NyaXB0ID0galF1ZXJ5KGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHR5cGU6IFNjcmlwdFR5cGUgPSBcImphdmFcIjtcclxuICAgICAgICAgICAgICAgIGlmKCRzY3JpcHQuZGF0YSgndHlwZScpICE9IG51bGwpIHR5cGUgPSA8U2NyaXB0VHlwZT4oJHNjcmlwdC5kYXRhKCd0eXBlJykpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNjcmlwdDogSk9TY3JpcHQgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJHNjcmlwdC5hdHRyKCd0aXRsZScpLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICRzY3JpcHQudGV4dCgpLnRyaW0oKVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHNjcmlwdExpc3QucHVzaChzY3JpcHQpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaW5pdERpdigkZGl2LCBzY3JpcHRMaXN0KTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGluaXREaXYoJGRpdjogSlF1ZXJ5PEhUTUxFbGVtZW50Piwgc2NyaXB0TGlzdDogSk9TY3JpcHRbXSkge1xyXG5cclxuICAgICAgICBsZXQgbWU6IE1haW5FbWJlZGRlZCA9IG5ldyBNYWluRW1iZWRkZWQoJGRpdiwgc2NyaXB0TGlzdCk7XHJcblxyXG4gICAgfVxyXG5cclxufVxyXG5cclxualF1ZXJ5KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICBsZXQgZW1iZWRkZWRTdGFydGVyID0gbmV3IEVtYmVkZGVkU3RhcnRlcigpO1xyXG5cclxuICAgIGxldCBwcmVmaXggPSBcIlwiO1xyXG4gICAgbGV0IGVkaXRvclBhdGggPSBcImxpYi9tb25hY28tZWRpdG9yL2Rldi92c1wiXHJcbiAgICAvL0B0cy1pZ25vcmVcclxuICAgIGlmKHdpbmRvdy5qYXZhT25saW5lRGlyICE9IG51bGwpe1xyXG4gICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgIHByZWZpeCA9IHdpbmRvdy5qYXZhT25saW5lRGlyO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgaWYod2luZG93Lm1vbmFjb0VkaXRvclBhdGggIT0gbnVsbCl7XHJcbiAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgZWRpdG9yUGF0aCA9IHdpbmRvdy5tb25hY29FZGl0b3JQYXRoO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgd2luZG93LnJlcXVpcmUuY29uZmlnKHsgcGF0aHM6IHsgJ3ZzJzogcHJlZml4ICsgZWRpdG9yUGF0aCB9IH0pO1xyXG4gICAgLy9AdHMtaWdub3JlXHJcbiAgICB3aW5kb3cucmVxdWlyZS5jb25maWcoe1xyXG4gICAgICAgICd2cy9ubHMnOiB7XHJcbiAgICAgICAgICAgIGF2YWlsYWJsZUxhbmd1YWdlczoge1xyXG4gICAgICAgICAgICAgICAgJyonOiAnZGUnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGlnbm9yZUR1cGxpY2F0ZU1vZHVsZXM6IFtcInZzL2VkaXRvci9lZGl0b3IubWFpblwiXVxyXG4gICAgfSk7XHJcbiAgICAvL0B0cy1pZ25vcmVcclxuICAgIHdpbmRvdy5yZXF1aXJlKFsndnMvZWRpdG9yL2VkaXRvci5tYWluJ10sIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgZW1iZWRkZWRTdGFydGVyLmluaXRFZGl0b3IoKTtcclxuICAgICAgICBlbWJlZGRlZFN0YXJ0ZXIuaW5pdEdVSSgpO1xyXG5cclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICBQSVhJLkxvYWRlclxyXG4gICAgICAgIC5zaGFyZWQuYWRkKHByZWZpeCArIFwiYXNzZXRzL2dyYXBoaWNzL3Nwcml0ZXNoZWV0Lmpzb25cIilcclxuICAgICAgICAubG9hZCgoKSA9PiB7IH0pO1xyXG5cclxuXHJcbn0pO1xyXG4iXX0=