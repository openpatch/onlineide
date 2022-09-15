export class SpriteLibraryPage {
    start() {
        let $entries = $('#entries');
        let $set;
        let nameOld = "";
        for (let e of SpriteLibrary) {
            if (e.name != nameOld) {
                nameOld = e.name;
                $set = $('<div class="spritelibrary-set"></div>');
                $entries.append($('<div class="spritelibrary-heading">' + e.name + "</div>"));
                $('#entries').append($set);
            }
            let index = e.index == null ? 0 : e.index;
            let $sh = $('<div class="' + e.name + "_" + index + '"></div>');
            let width;
            let height;
            let $box = $('<div class="spritelibrary-box"></div>');
            if (e.scale != null) {
                let $sh1 = $('<div class="transformed-sprite" style="transform: scale(' + e.scale + '); transform-origin: top left"></div>');
                $sh1.append($sh);
                $box.append($sh1);
                $set.append($box);
                width = $sh.width();
                height = $sh.height();
                $sh1.css({ width: width * e.scale + "px", height: height * e.scale + "px" });
            }
            else {
                $box.append($sh);
                $set.append($box);
                width = $sh.width();
                height = $sh.height();
            }
            $box.append('<div>Nr. ' + index + '</div>');
            $box.append('<div>' + width + ' x ' + height + '</div>');
        }
    }
}
$(() => {
    new SpriteLibraryPage().start();
});
//# sourceMappingURL=SpriteLibraryPage.js.map