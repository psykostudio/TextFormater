define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const WSP = /[\t\n\f ]/;
    const ALPHA = /[A-Za-z]/;
    const CRLF = /\r\n?/g;
    function isSpace(char) {
        return WSP.test(char);
    }
    exports.isSpace = isSpace;
    function isAlpha(char) {
        return ALPHA.test(char);
    }
    exports.isAlpha = isAlpha;
    function preprocessInput(input) {
        return input.replace(CRLF, '\n');
    }
    exports.preprocessInput = preprocessInput;
});
//# sourceMappingURL=utils.js.map