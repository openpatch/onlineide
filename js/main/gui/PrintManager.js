export class PrintManager {
    constructor($runDiv, main) {
        this.$runDiv = $runDiv;
        this.main = main;
        this.color = "";
        this.lastSpan = "";
        this.maxLines = 2000;
        this.$lines = [];
        this.newLines = 0;
        this.printCommands = [];
        this.currentLinelength = 0;
        this.beginOfLineState = true; // Spaces at begin of line are converted to &nbsp;
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
        // If there are more than maxLines in next output batch: 
        // Delete surplus lines before printing them and empty output-div
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
        // reopen last printed span-element
        if (this.$lastSpan != null) {
            this.$lastSpan.remove();
            if (this.lastSpan.endsWith("</span>"))
                this.lastSpan = this.lastSpan.substring(0, this.lastSpan.length - 7);
        }
        for (let pc of this.printCommands) {
            // replace spaces with &nbsp;'s
            // pc.text = pc.text.replace(/ /g, "&nbsp;");
            if (this.beginOfLineState && pc.text.startsWith(" ")) {
                let match = pc.text.match(/^( *)(.*)$/);
                if (match[2].length > 0)
                    this.beginOfLineState = false;
            }
            else {
                if (pc.text.length > 0)
                    this.beginOfLineState = false;
            }
            pc.text = pc.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            if (pc.color == null)
                pc.color = "var(--defaultOutputColor)";
            if (this.lastSpan == "" || this.color != pc.color) {
                if (this.lastSpan != "")
                    this.lastSpan += "</span>"; // new color => close old span
                this.lastSpan += '<span style="color: ' + pc.color + '">';
                if (pc.newLine && pc.text == "")
                    this.lastSpan += "\u200b"; // makes empty lines possible; \u200b is a space with 0 width but full height.
                this.color = pc.color;
            }
            if (this.currentLinelength <= 10000) {
                this.lastSpan += pc.text;
                this.currentLinelength += pc.text.length;
            }
            if (pc.newLine) {
                this.beginOfLineState = true;
                if (!this.lastSpan.endsWith("</span>"))
                    this.lastSpan += "</span>";
                this.$lastSpan = jQuery(this.lastSpan);
                this.$lastDiv.append(this.$lastSpan);
                this.lastSpan = "";
                this.$lastSpan = null;
                this.$lastDiv = jQuery('<div></div>');
                let $input = this.main.getInterpreter().inputManager.$input;
                if ($input != null) {
                    this.$lastDiv.insertBefore($input);
                }
                else {
                    this.$outputDiv.append(this.$lastDiv);
                }
                this.$lines.push(this.$lastDiv);
                this.currentLinelength = 0;
            }
        }
        if (this.lastSpan != "") {
            if (!this.lastSpan.endsWith("</span>"))
                this.lastSpan += "</span>";
            this.$lastSpan = jQuery(this.lastSpan);
            this.$lastDiv.append(this.$lastSpan);
        }
        if (this.$lines.length > this.maxLines * 1.5) {
            let that = this;
            let linesToDelete = that.$lines.length - that.maxLines;
            let $linesToDelete = that.$lines.splice(0, linesToDelete);
            for (let $line of $linesToDelete) {
                $line.remove();
            }
        }
        this.printCommands = [];
    }
    clear() {
        this.$outputDiv.empty();
        this.$lastDiv = jQuery('<div></div>');
        this.$lines.push(this.$lastDiv);
        this.$outputDiv.append(this.$lastDiv);
        this.currentLinelength = 0;
        this.color = "";
        this.lastSpan = "";
        this.printCommands = [];
    }
    print(text, color) {
        if (text == null)
            return;
        if (typeof color == "number") {
            color = color.toString(16);
            while (color.length < 6)
                color = "0" + color;
            color = "#" + color;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJpbnRNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9QcmludE1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBUUEsTUFBTSxPQUFPLFlBQVk7SUFtQnJCLFlBQW9CLE9BQTRCLEVBQVUsSUFBYztRQUFwRCxZQUFPLEdBQVAsT0FBTyxDQUFxQjtRQUFVLFNBQUksR0FBSixJQUFJLENBQVU7UUFqQnhFLFVBQUssR0FBVyxFQUFFLENBQUM7UUFDbkIsYUFBUSxHQUFXLEVBQUUsQ0FBQztRQU10QixhQUFRLEdBQVcsSUFBSSxDQUFDO1FBQ3hCLFdBQU0sR0FBMEIsRUFBRSxDQUFDO1FBRW5DLGFBQVEsR0FBVyxDQUFDLENBQUM7UUFFckIsa0JBQWEsR0FBbUIsRUFBRSxDQUFDO1FBRW5DLHNCQUFpQixHQUFXLENBQUMsQ0FBQztRQUM5QixxQkFBZ0IsR0FBWSxJQUFJLENBQUMsQ0FBQyxrREFBa0Q7UUFHaEYsTUFBTSxDQUFDLEdBQUcsRUFBRTtZQUNSLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFYixJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7WUFFaEIsSUFBSSxDQUFDLEdBQVcsQ0FBQyxDQUFDO1lBRWxCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNsQixJQUFJLFlBQVksR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFckMsV0FBVyxDQUFDLEdBQUcsRUFBRTtnQkFDYixJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDL0IsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNsQixJQUFJLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxZQUFZLEdBQUcsR0FBRyxFQUFFO3dCQUN4QyxJQUFJ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QUMsUUFBUSxFQUFFLENBQUM7YUFDaEM7U0FDSjthQUFNO1lBQ0gsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUM7Z0JBQ3BCLElBQUksRUFBRSxJQUFJO2dCQUNWLEtBQUssRUFBRSxLQUFLO2dCQUNaLE9BQU8sRUFBRSxLQUFLO2FBQ2pCLENBQUMsQ0FBQztTQUNOO0lBQ0wsQ0FBQztJQUVELE9BQU8sQ0FBQyxJQUFtQixFQUFFLEtBQXFCO1FBQzlDLElBQUksSUFBSSxJQUFJLElBQUk7WUFBRSxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQzVCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNuQyxDQUFDO0NBRUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNYWluQmFzZSB9IGZyb20gXCIuLi9NYWluQmFzZS5qc1wiO1xyXG5cclxudHlwZSBQcmludENvbW1hbmQgPSB7XHJcbiAgICB0ZXh0OiBzdHJpbmc7XHJcbiAgICBjb2xvcjogc3RyaW5nO1xyXG4gICAgbmV3TGluZTogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFByaW50TWFuYWdlciB7XHJcblxyXG4gICAgY29sb3I6IHN0cmluZyA9IFwiXCI7XHJcbiAgICBsYXN0U3Bhbjogc3RyaW5nID0gXCJcIjtcclxuICAgICRsYXN0U3BhbjogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuXHJcbiAgICAkbGFzdERpdjogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgICRvdXRwdXREaXY6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcblxyXG4gICAgbWF4TGluZXM6IG51bWJlciA9IDIwMDA7XHJcbiAgICAkbGluZXM6IEpRdWVyeTxIVE1MRWxlbWVudD5bXSA9IFtdO1xyXG5cclxuICAgIG5ld0xpbmVzOiBudW1iZXIgPSAwO1xyXG5cclxuICAgIHByaW50Q29tbWFuZHM6IFByaW50Q29tbWFuZFtdID0gW107XHJcblxyXG4gICAgY3VycmVudExpbmVsZW5ndGg6IG51bWJlciA9IDA7XHJcbiAgICBiZWdpbk9mTGluZVN0YXRlOiBib29sZWFuID0gdHJ1ZTsgLy8gU3BhY2VzIGF0IGJlZ2luIG9mIGxpbmUgYXJlIGNvbnZlcnRlZCB0byAmbmJzcDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlICRydW5EaXY6IEpRdWVyeTxIVE1MRWxlbWVudD4sIHByaXZhdGUgbWFpbjogTWFpbkJhc2UpIHtcclxuICAgICAgICBqUXVlcnkoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLiRvdXRwdXREaXYgPSAkcnVuRGl2LmZpbmQoJy5qb19vdXRwdXQnKTtcclxuICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgbGV0IG46IG51bWJlciA9IDA7XHJcblxyXG4gICAgICAgICAgICBsZXQgZGlydHkgPSBmYWxzZTtcclxuICAgICAgICAgICAgbGV0IGxhc3RQcmludGluZyA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG5cclxuICAgICAgICAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoYXQucHJpbnRDb21tYW5kcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5kb1ByaW50aW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBlcmZvcm1hbmNlLm5vdygpIC0gbGFzdFByaW50aW5nID4gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuJG91dHB1dERpdlswXS5zY3JvbGxUb3AgPSB0aGF0LiRvdXRwdXREaXZbMF0uc2Nyb2xsSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdFByaW50aW5nID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG4rKyAlIDIwID09IDAgJiYgZGlydHkpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC4kb3V0cHV0RGl2WzBdLnNjcm9sbFRvcCA9IHRoYXQuJG91dHB1dERpdlswXS5zY3JvbGxIZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcnR5ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgMjAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0sIDUwKTtcclxuXHJcblxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEdyYXBoaWNzRGl2KCk6SlF1ZXJ5PEhUTUxFbGVtZW50PiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuJHJ1bkRpdi5maW5kKCcuam9fZ3JhcGhpY3MnKTtcclxuICAgIH1cclxuXHJcbiAgICBzaG93UHJvZ3JhbUVuZCgpIHtcclxuICAgICAgICBsZXQgJHByb2dyYW1FbmREaXYgPSB0aGlzLiRydW5EaXYuZmluZCgnLmpvX3J1bi1wcm9ncmFtZW5kJyk7XHJcbiAgICAgICAgJHByb2dyYW1FbmREaXYuc2hvdygpO1xyXG4gICAgICAgICRwcm9ncmFtRW5kRGl2LmFkZENsYXNzKCdqb19wcm9ncmFtZW5ka2YnKTtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgJHByb2dyYW1FbmREaXYucmVtb3ZlQ2xhc3MoJ2pvX3Byb2dyYW1lbmRrZicpO1xyXG4gICAgICAgICAgICAkcHJvZ3JhbUVuZERpdi5oaWRlKCk7XHJcbiAgICAgICAgfSwgMzAwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgZG9QcmludGluZygpIHtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG1vcmUgdGhhbiBtYXhMaW5lcyBpbiBuZXh0IG91dHB1dCBiYXRjaDogXHJcbiAgICAgICAgLy8gRGVsZXRlIHN1cnBsdXMgbGluZXMgYmVmb3JlIHByaW50aW5nIHRoZW0gYW5kIGVtcHR5IG91dHB1dC1kaXZcclxuICAgICAgICBpZiAodGhpcy5uZXdMaW5lcyA+PSB0aGlzLm1heExpbmVzKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLiRvdXRwdXREaXYuZW1wdHkoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBpID0gdGhpcy5wcmludENvbW1hbmRzLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgICAgIGxldCBubCA9IDA7XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAoaSA+PSAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJpbnRDb21tYW5kc1tpXS5uZXdMaW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmwrKztcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmwgPj0gdGhpcy5tYXhMaW5lcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50Q29tbWFuZHMuc3BsaWNlKDAsIGkgKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaS0tO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5uZXdMaW5lcyA9IDA7XHJcblxyXG4gICAgICAgIC8vIHJlb3BlbiBsYXN0IHByaW50ZWQgc3Bhbi1lbGVtZW50XHJcbiAgICAgICAgaWYodGhpcy4kbGFzdFNwYW4gIT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHRoaXMuJGxhc3RTcGFuLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBpZih0aGlzLmxhc3RTcGFuLmVuZHNXaXRoKFwiPC9zcGFuPlwiKSkgdGhpcy5sYXN0U3BhbiA9IHRoaXMubGFzdFNwYW4uc3Vic3RyaW5nKDAsIHRoaXMubGFzdFNwYW4ubGVuZ3RoIC0gNyk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgZm9yIChsZXQgcGMgb2YgdGhpcy5wcmludENvbW1hbmRzKSB7XHJcblxyXG4gICAgICAgICAgICAvLyByZXBsYWNlIHNwYWNlcyB3aXRoICZuYnNwOydzXHJcbiAgICAgICAgICAgIC8vIHBjLnRleHQgPSBwYy50ZXh0LnJlcGxhY2UoLyAvZywgXCImbmJzcDtcIik7XHJcblxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuYmVnaW5PZkxpbmVTdGF0ZSAmJiBwYy50ZXh0LnN0YXJ0c1dpdGgoXCIgXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWF0Y2ggPSBwYy50ZXh0Lm1hdGNoKC9eKCAqKSguKikkLyk7XHJcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hbMl0ubGVuZ3RoID4gMCkgdGhpcy5iZWdpbk9mTGluZVN0YXRlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGMudGV4dC5sZW5ndGggPiAwKSB0aGlzLmJlZ2luT2ZMaW5lU3RhdGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcGMudGV4dCA9IHBjLnRleHQucmVwbGFjZSgvPC9nLCBcIiZsdDtcIikucmVwbGFjZSgvPi9nLCBcIiZndDtcIik7XHJcblxyXG4gICAgICAgICAgICBpZiAocGMuY29sb3IgPT0gbnVsbCkgcGMuY29sb3IgPSBcInZhcigtLWRlZmF1bHRPdXRwdXRDb2xvcilcIjtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxhc3RTcGFuID09IFwiXCIgfHwgdGhpcy5jb2xvciAhPSBwYy5jb2xvcikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGFzdFNwYW4gIT0gXCJcIikgdGhpcy5sYXN0U3BhbiArPSBcIjwvc3Bhbj5cIjsgICAgICAvLyBuZXcgY29sb3IgPT4gY2xvc2Ugb2xkIHNwYW5cclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdFNwYW4gKz0gJzxzcGFuIHN0eWxlPVwiY29sb3I6ICcgKyBwYy5jb2xvciArICdcIj4nO1xyXG4gICAgICAgICAgICAgICAgaWYocGMubmV3TGluZSAmJiBwYy50ZXh0ID09IFwiXCIpIHRoaXMubGFzdFNwYW4gKz0gXCJcXHUyMDBiXCI7IC8vIG1ha2VzIGVtcHR5IGxpbmVzIHBvc3NpYmxlOyBcXHUyMDBiIGlzIGEgc3BhY2Ugd2l0aCAwIHdpZHRoIGJ1dCBmdWxsIGhlaWdodC5cclxuICAgICAgICAgICAgICAgIHRoaXMuY29sb3IgPSBwYy5jb2xvcjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudExpbmVsZW5ndGggPD0gMTAwMDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdFNwYW4gKz0gcGMudGV4dDtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudExpbmVsZW5ndGggKz0gcGMudGV4dC5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICBpZiAocGMubmV3TGluZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5iZWdpbk9mTGluZVN0YXRlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5sYXN0U3Bhbi5lbmRzV2l0aChcIjwvc3Bhbj5cIikpIHRoaXMubGFzdFNwYW4gKz0gXCI8L3NwYW4+XCI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRsYXN0U3BhbiA9IGpRdWVyeSh0aGlzLmxhc3RTcGFuKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGxhc3REaXYuYXBwZW5kKHRoaXMuJGxhc3RTcGFuKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0U3BhbiA9IFwiXCI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRsYXN0U3BhbiA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy4kbGFzdERpdiA9IGpRdWVyeSgnPGRpdj48L2Rpdj4nKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgJGlucHV0ID0gdGhpcy5tYWluLmdldEludGVycHJldGVyKCkuaW5wdXRNYW5hZ2VyLiRpbnB1dDtcclxuICAgICAgICAgICAgICAgIGlmKCRpbnB1dCAhPSBudWxsKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLiRsYXN0RGl2Lmluc2VydEJlZm9yZSgkaW5wdXQpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLiRvdXRwdXREaXYuYXBwZW5kKHRoaXMuJGxhc3REaXYpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuJGxpbmVzLnB1c2godGhpcy4kbGFzdERpdik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRMaW5lbGVuZ3RoID0gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmxhc3RTcGFuICE9IFwiXCIpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmxhc3RTcGFuLmVuZHNXaXRoKFwiPC9zcGFuPlwiKSkgdGhpcy5sYXN0U3BhbiArPSBcIjwvc3Bhbj5cIjtcclxuICAgICAgICAgICAgdGhpcy4kbGFzdFNwYW4gPSBqUXVlcnkodGhpcy5sYXN0U3Bhbik7XHJcbiAgICAgICAgICAgIHRoaXMuJGxhc3REaXYuYXBwZW5kKHRoaXMuJGxhc3RTcGFuKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLiRsaW5lcy5sZW5ndGggPiB0aGlzLm1heExpbmVzICogMS41KSB7XHJcbiAgICAgICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICAgICAgbGV0IGxpbmVzVG9EZWxldGUgPSB0aGF0LiRsaW5lcy5sZW5ndGggLSB0aGF0Lm1heExpbmVzO1xyXG5cclxuICAgICAgICAgICAgbGV0ICRsaW5lc1RvRGVsZXRlID0gdGhhdC4kbGluZXMuc3BsaWNlKDAsIGxpbmVzVG9EZWxldGUpO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgJGxpbmUgb2YgJGxpbmVzVG9EZWxldGUpIHtcclxuICAgICAgICAgICAgICAgICRsaW5lLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wcmludENvbW1hbmRzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy4kb3V0cHV0RGl2LmVtcHR5KCk7XHJcbiAgICAgICAgdGhpcy4kbGFzdERpdiA9IGpRdWVyeSgnPGRpdj48L2Rpdj4nKTtcclxuICAgICAgICB0aGlzLiRsaW5lcy5wdXNoKHRoaXMuJGxhc3REaXYpO1xyXG4gICAgICAgIHRoaXMuJG91dHB1dERpdi5hcHBlbmQodGhpcy4kbGFzdERpdik7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50TGluZWxlbmd0aCA9IDA7XHJcbiAgICAgICAgdGhpcy5jb2xvciA9IFwiXCI7XHJcbiAgICAgICAgdGhpcy5sYXN0U3BhbiA9IFwiXCI7XHJcbiAgICAgICAgdGhpcy5wcmludENvbW1hbmRzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgcHJpbnQodGV4dDogc3RyaW5nIHwgbnVsbCwgY29sb3I/OiBzdHJpbmd8bnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKHRleHQgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZih0eXBlb2YgY29sb3IgPT0gXCJudW1iZXJcIil7XHJcbiAgICAgICAgICAgIGNvbG9yID0gY29sb3IudG9TdHJpbmcoMTYpO1xyXG4gICAgICAgICAgICB3aGlsZShjb2xvci5sZW5ndGggPCA2KSBjb2xvciA9IFwiMFwiICsgY29sb3I7XHJcbiAgICAgICAgICAgIGNvbG9yID0gXCIjXCIgKyBjb2xvcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRleHQgPSB0ZXh0LnRvU3RyaW5nKCk7XHJcbiAgICAgICAgaWYgKHRleHQuaW5kZXhPZihcIlxcblwiKSA+PSAwKSB7XHJcbiAgICAgICAgICAgIGxldCB0TGlzdCA9IHRleHQuc3BsaXQoXCJcXG5cIik7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdExpc3QubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGxldCB0ID0gdExpc3RbaV07XHJcbiAgICAgICAgICAgICAgICBsZXQgbmV3TGluZSA9IGkgPCB0TGlzdC5sZW5ndGggLSAxO1xyXG4gICAgICAgICAgICAgICAgaWYgKHQgPT0gXCJcIiAmJiBpID09IHRMaXN0Lmxlbmd0aCAtIDEpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcmludENvbW1hbmRzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHQsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IGNvbG9yLFxyXG4gICAgICAgICAgICAgICAgICAgIG5ld0xpbmU6IG5ld0xpbmVcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5ld0xpbmUpIHRoaXMubmV3TGluZXMrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJpbnRDb21tYW5kcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHRleHQ6IHRleHQsXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogY29sb3IsXHJcbiAgICAgICAgICAgICAgICBuZXdMaW5lOiBmYWxzZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpbnRsbih0ZXh0OiBzdHJpbmcgfCBudWxsLCBjb2xvcj86IHN0cmluZ3xudW1iZXIpIHtcclxuICAgICAgICBpZiAodGV4dCA9PSBudWxsKSB0ZXh0ID0gXCJcIjtcclxuICAgICAgICB0aGlzLnByaW50KHRleHQgKyBcIlxcblwiLCBjb2xvcik7XHJcbiAgICB9XHJcblxyXG59Il19