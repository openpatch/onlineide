export class EmbeddedStarter1 {
}
$(function () {
    let embeddedStarter = new EmbeddedStarter1();
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
        // embeddedStarter.initEditor();
        // main.initGUI();
    });
    PIXI.Loader
        .shared.add("assets/graphics/spritesheet.json")
        .load(() => { });
});
//# sourceMappingURL=EmbeddedStarter1.js.map