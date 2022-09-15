export class PrintManager {
    constructor($runDiv) {
        this.$runDiv = $runDiv;
        this.color = "";
        this.lastSpan = "";
        this.maxLines = 2000;
        this.$lines = [];
        this.newLines = 0;
        this.printCommands = [];
        this.currentLinelength = 0;
        this.beginOfLineState = true; // Spaces at begin of line are converted to &nbsp;
        this.lastCharIsSpace = false;
        jQuery(() => {
            this.$outputDiv = $runDiv.find('.jo_output');
            this.clear();
            let that = this;
            let n = 0;
            let dirty = false;
            let lastPrinting = performance.now();
            setInterval(() => {
                if (that.printCommands.length > 0) {
                    that.doPrinting();
                    if (performance.now() - lastPrinting > 200) {
                        that.$outputDiv[0].scrollTop = that.$outputDiv[0].scrollHeight;
                    }
                    else {
                        dirty = true;
                    }
                    lastPrinting = performance.now();
                }
                if (n++ % 20 == 0 && dirty) {
                    setTimeout(() => {
                        that.$outputDiv[0].scrollTop = that.$outputDiv[0].scrollHeight;
                        dirty = false;
                    }, 200);
                }
            }, 50);
        });
    }
    getGraphicsDiv() {
        return this.$runDiv.find('.jo_graphics');
    }
    showProgramEnd() {
        let $programEndDiv = this.$runDiv.find('.jo_run-programend');
        $programEndDiv.show();
        $programEndDiv.addClass('jo_programendkf');
        setTimeout(() => {
            $programEndDiv.removeClass('jo_programendkf');
            $programEndDiv.hide();
        }, 3000);
    }
    doPrinting() {
        // if (this.printCommands.length > 0) {
        // this.$runDiv.find('.jo_run-caption').hide();
        // }
        if (this.newLines >= this.maxLines) {
            this.$outputDiv.empty();
            let i = this.printCommands.length - 1;
            let nl = 0;
            while (i >= 0) {
                if (this.printCommands[i].newLine) {
                    nl++;
                    if (nl >= this.maxLines) {
                        this.printCommands.splice(0, i + 1);
                        break;
                    }
                }
                i--;
            }
        }
        this.newLines = 0;
        for (let pc of this.printCommands) {
            // replace spaces at begin of line with &nbsp;'s
            if (this.beginOfLineState && pc.text.startsWith(" ")) {
                let match = pc.text.match(/^( *)(.*)$/);
                pc.text = match[1].replace(/ /g, "&nbsp;") + match[2];
                if (match[2].length > 0)
                    this.beginOfLineState = false;
            }
            else {
                if (pc.text.length > 0)
                    this.beginOfLineState = false;
            }
            if (this.lastCharIsSpace && pc.text.startsWith(" "))
                pc.text = pc.text.replace(/ /, "&#160;");
            this.lastCharIsSpace = false;
            pc.text = pc.text.replace(/  /g, "&#160; ").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            if (pc.color == null)
                pc.color = "var(--defaultOutputColor)";
            if (this.lastSpan == "" || this.color != pc.color) {
                if (this.lastSpan != "")
                    this.lastSpan += "</span>";
                this.lastSpan += '<span style="color: ' + pc.color + '">';
                if (pc.newLine && pc.text == "")
                    this.lastSpan += "\u200b";
                this.color = pc.color;
            }
            if (this.currentLinelength <= 10000) {
                this.lastSpan += pc.text;
                if (this.lastSpan.endsWith("  ")) {
                    this.lastSpan = this.lastSpan.substr(0, this.lastSpan.length - 2) + "&#160; ";
                }
                this.currentLinelength += pc.text.length;
            }
            if (pc.newLine) {
                this.beginOfLineState = true;
                if (!this.lastSpan.endsWith("</span>"))
                    this.lastSpan += "</span>";
                this.lastDiv.append(this.lastSpan);
                this.lastSpan = "";
                this.lastDiv = jQuery('<div></div>');
                this.$outputDiv.append(this.lastDiv);
                this.$lines.push(this.lastDiv);
                this.currentLinelength = 0;
            }
        }
        this.lastCharIsSpace = this.lastSpan.endsWith(" ");
        if (this.lastSpan != "" && !this.lastSpan.endsWith("> ")) {
            if (!this.lastSpan.endsWith("</span>"))
                this.lastSpan += "</span>";
            this.lastDiv.append(this.lastSpan);
            this.lastSpan = "";
        }
        if (this.$lines.length > this.maxLines * 1.5) {
            let that = this;
            // setTimeout(() => {
            let linesToDelete = that.$lines.length - that.maxLines;
            // let $linesToDelete = that.$lines.slice(0, linesToDelete);
            // that.$lines.splice(0, linesToDelete);
            let $linesToDelete = that.$lines.splice(0, linesToDelete);
            for (let $line of $linesToDelete) {
                $line.remove();
            }
            // }, 1000);
        }
        this.printCommands = [];
    }
    clear() {
        this.$outputDiv.empty();
        this.lastDiv = jQuery('<div></div>');
        this.$lines.push(this.lastDiv);
        this.$outputDiv.append(this.lastDiv);
        this.currentLinelength = 0;
        this.color = "";
        this.lastSpan = "";
        // jQuery('#run-caption').show();
    }
    print(text, color) {
        if (text == null)
            return;
        text = text.toString();
        if (text.indexOf("\n") >= 0) {
            let tList = text.split("\n");
            for (let i = 0; i < tList.length; i++) {
                let t = tList[i];
                let newLine = i < tList.length - 1;
                if (t == "" && i == tList.length - 1)
                    continue;
                this.printCommands.push({
                    text: t,
                    color: color,
                    newLine: newLine
                });
                if (newLine)
                    this.newLines++;
            }
        }
        else {
            this.printCommands.push({
                text: text,
                color: color,
                newLine: false
            });
        }
    }
    println(text, color) {
        if (text == null)
            text = "";
        this.print(text + "\n", color);
    }
}
//# sourceMappingURL=PrintManager copy.js.map