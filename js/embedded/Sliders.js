import { ZoomControl } from "./diagrams/ZoomControl.js";
export class Sliders {
    constructor(main) {
        this.main = main;
    }
    initSliders() {
        let that = this;
        $('#slider1').on("mousedown", (md) => {
            let pe = $('#leftpanel');
            let me = $('#editor>.monaco-editor');
            let x = md.clientX;
            $(document).on("mousemove.slider1", (mm) => {
                let dx = mm.clientX - x;
                let width = Number.parseInt(pe.css('width').replace('px', ''));
                pe.css('width', (width + dx) + "px");
                let mewidth = Number.parseInt(me.css('width').replace('px', ''));
                me.css('width', (mewidth - dx) + "px");
                that.main.getMonacoEditor().layout();
                x = mm.clientX;
            });
            $(document).on("mouseup.slider1", () => {
                $(document).off("mousemove.slider1");
                $(document).off("mouseup.slider1");
            });
        });
        $('#slider2').on("mousedown", (md) => {
            let ee = $('#bottomdiv-outer');
            let me = $('#editor>.monaco-editor');
            let y = md.clientY;
            $(document).on("mousemove.slider2", (mm) => {
                let dy = mm.clientY - y;
                let height = Number.parseInt(ee.css('height').replace('px', ''));
                ee.css('height', (height - dy) + "px");
                let meheight = Number.parseInt(me.css('height').replace('px', ''));
                me.css('height', (meheight + dy) + "px");
                that.main.getMonacoEditor().layout();
                y = mm.clientY;
            });
            $(document).on("mouseup.slider2", () => {
                $(document).off("mousemove.slider2");
                $(document).off("mouseup.slider2");
            });
        });
        $('#slider3').on("mousedown", (md) => {
            let pe = $('#rightdiv');
            let me = $('#editor>.monaco-editor');
            let x = md.clientX;
            ZoomControl.preventFading = true;
            $(document).on("mousemove.slider3", (mm) => {
                let dx = mm.clientX - x;
                let width = Number.parseInt(pe.css('width').replace('px', ''));
                pe.css('width', (width - dx) + "px");
                let mewidth = Number.parseInt(me.css('width').replace('px', ''));
                me.css('width', (mewidth + dx) + "px");
                that.main.getMonacoEditor().layout();
                width += dx;
                x = mm.clientX;
                mm.stopPropagation();
            });
            $(document).on("mouseup.slider3", () => {
                $(document).off("mousemove.slider3");
                $(document).off("mouseup.slider3");
                ZoomControl.preventFading = false;
            });
        });
    }
}
//# sourceMappingURL=Sliders.js.map