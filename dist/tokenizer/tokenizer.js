define(["require", "exports", "./evented-tokenizer"], function (require, exports, evented_tokenizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Tokenizer {
        constructor(entityParser, options = {}) {
            this.options = options;
            this.token = null;
            this.startLine = 1;
            this.startColumn = 0;
            this.tokens = [];
            this.tokenizer = new evented_tokenizer_1.default(this, entityParser);
            this._currentAttribute = undefined;
        }
        tokenize(input) {
            this.tokens = [];
            this.tokenizer.tokenize(input);
            return this.tokens;
        }
        tokenizePart(input) {
            this.tokens = [];
            this.tokenizer.tokenizePart(input);
            return this.tokens;
        }
        tokenizeEOF() {
            this.tokens = [];
            this.tokenizer.tokenizeEOF();
            return this.tokens[0];
        }
        reset() {
            this.token = null;
            this.startLine = 1;
            this.startColumn = 0;
        }
        current() {
            const token = this.token;
            if (token === null) {
                throw new Error('token was unexpectedly null');
            }
            if (arguments.length === 0) {
                return token;
            }
            for (let i = 0; i < arguments.length; i++) {
                if (token.type === arguments[i]) {
                    return token;
                }
            }
            throw new Error(`token type was unexpectedly ${token.type}`);
        }
        push(token) {
            this.token = token;
            this.tokens.push(token);
        }
        currentAttribute() {
            return this._currentAttribute;
        }
        addLocInfo() {
            if (this.options.loc) {
                this.current().loc = {
                    start: {
                        line: this.startLine,
                        column: this.startColumn
                    },
                    end: {
                        line: this.tokenizer.line,
                        column: this.tokenizer.column
                    }
                };
            }
            this.startLine = this.tokenizer.line;
            this.startColumn = this.tokenizer.column;
        }
        // Data
        beginData() {
            this.push({
                type: "Chars" /* Chars */,
                chars: ''
            });
        }
        appendToData(char) {
            this.current("Chars" /* Chars */).chars += char;
        }
        finishData() {
            this.addLocInfo();
        }
        // Tags - basic
        tagOpen() { }
        beginStartTag() {
            this.push({
                type: "StartTag" /* StartTag */,
                tagName: '',
                attributes: [],
                selfClosing: false
            });
        }
        beginEndTag() {
            this.push({
                type: "EndTag" /* EndTag */,
                tagName: ''
            });
        }
        finishTag() {
            this.addLocInfo();
        }
        markTagAsSelfClosing() {
            this.current("StartTag" /* StartTag */).selfClosing = true;
        }
        // Tags - name
        appendToTagName(char) {
            this.current("StartTag" /* StartTag */, "EndTag" /* EndTag */).tagName += char;
        }
        // Tags - attributes
        beginAttribute() {
            this._currentAttribute = ['', '', false];
        }
        appendToAttributeName(char) {
            this.currentAttribute()[0] += char;
        }
        beginAttributeValue(isQuoted) {
            this.currentAttribute()[2] = isQuoted;
        }
        appendToAttributeValue(char) {
            this.currentAttribute()[1] += char;
        }
        finishAttributeValue() {
            this.current("StartTag" /* StartTag */).attributes.push(this._currentAttribute);
        }
        reportSyntaxError(message) {
            this.current().syntaxError = message;
        }
    }
    exports.default = Tokenizer;
});
//# sourceMappingURL=tokenizer.js.map