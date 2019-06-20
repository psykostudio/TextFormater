define(["require", "exports", "./tokenizer", "./entity-parser", "./generated/html5-named-char-refs"], function (require, exports, tokenizer_1, entity_parser_1, html5_named_char_refs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function tokenize(input, options) {
        let tokenizer = new tokenizer_1.default(new entity_parser_1.default(html5_named_char_refs_1.default), options);
        return tokenizer.tokenize(input);
    }
    exports.default = tokenize;
});
//# sourceMappingURL=tokenize.js.map