define(["require", "exports", "./types", "./generated/html5-named-char-refs", "./entity-parser", "./evented-tokenizer", "./tokenizer", "./tokenize"], function (require, exports, types_1, html5_named_char_refs_1, entity_parser_1, evented_tokenizer_1, tokenizer_1, tokenize_1) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(types_1);
    exports.HTML5NamedCharRefs = html5_named_char_refs_1.default;
    exports.EntityParser = entity_parser_1.default;
    exports.EventedTokenizer = evented_tokenizer_1.default;
    exports.Tokenizer = tokenizer_1.default;
    exports.tokenize = tokenize_1.default;
});
//# sourceMappingURL=index.js.map