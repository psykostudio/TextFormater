define(["require", "exports", "./utils"], function (require, exports, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EventedTokenizer {
        constructor(delegate, entityParser) {
            this.delegate = delegate;
            this.entityParser = entityParser;
            this.state = "beforeData" /* beforeData */;
            this.line = -1;
            this.column = -1;
            this.input = '';
            this.index = -1;
            this.tagNameBuffer = '';
            this.states = {
                beforeData() {
                    let char = this.peek();
                    if (char === '<') {
                        this.transitionTo("tagOpen" /* tagOpen */);
                        this.markTagStart();
                        this.consume();
                    }
                    else {
                        if (char === '\n') {
                            let tag = this.tagNameBuffer.toLowerCase();
                            if (tag === 'pre' || tag === 'textarea') {
                                this.consume();
                            }
                        }
                        this.transitionTo("data" /* data */);
                        this.delegate.beginData();
                    }
                },
                data() {
                    let char = this.peek();
                    if (char === '<') {
                        this.delegate.finishData();
                        this.transitionTo("tagOpen" /* tagOpen */);
                        this.markTagStart();
                        this.consume();
                    }
                    else if (char === '&') {
                        this.consume();
                        this.delegate.appendToData(this.consumeCharRef() || '&');
                    }
                    else {
                        this.consume();
                        this.delegate.appendToData(char);
                    }
                },
                tagOpen() {
                    let char = this.consume();
                    if (char === '!') {
                        this.transitionTo("markupDeclarationOpen" /* markupDeclarationOpen */);
                    }
                    else if (char === '/') {
                        this.transitionTo("endTagOpen" /* endTagOpen */);
                    }
                    else if (char === '@' || char === ':' || utils_1.isAlpha(char)) {
                        this.transitionTo("tagName" /* tagName */);
                        this.tagNameBuffer = '';
                        this.delegate.beginStartTag();
                        this.appendToTagName(char);
                    }
                },
                tagName() {
                    let char = this.consume();
                    if (utils_1.isSpace(char)) {
                        this.transitionTo("beforeAttributeName" /* beforeAttributeName */);
                    }
                    else if (char === '/') {
                        this.transitionTo("selfClosingStartTag" /* selfClosingStartTag */);
                    }
                    else if (char === '>') {
                        this.delegate.finishTag();
                        this.transitionTo("beforeData" /* beforeData */);
                    }
                    else {
                        this.appendToTagName(char);
                    }
                },
                beforeAttributeName() {
                    let char = this.peek();
                    if (utils_1.isSpace(char)) {
                        this.consume();
                        return;
                    }
                    else if (char === '/') {
                        this.transitionTo("selfClosingStartTag" /* selfClosingStartTag */);
                        this.consume();
                    }
                    else if (char === '>') {
                        this.consume();
                        this.delegate.finishTag();
                        this.transitionTo("beforeData" /* beforeData */);
                    }
                    else if (char === '=') {
                        this.delegate.reportSyntaxError('attribute name cannot start with equals sign');
                        this.transitionTo("attributeName" /* attributeName */);
                        this.delegate.beginAttribute();
                        this.consume();
                        this.delegate.appendToAttributeName(char);
                    }
                    else {
                        this.transitionTo("attributeName" /* attributeName */);
                        this.delegate.beginAttribute();
                    }
                },
                attributeName() {
                    let char = this.peek();
                    if (utils_1.isSpace(char)) {
                        this.transitionTo("afterAttributeName" /* afterAttributeName */);
                        this.consume();
                    }
                    else if (char === '/') {
                        this.delegate.beginAttributeValue(false);
                        this.delegate.finishAttributeValue();
                        this.consume();
                        this.transitionTo("selfClosingStartTag" /* selfClosingStartTag */);
                    }
                    else if (char === '=') {
                        this.transitionTo("beforeAttributeValue" /* beforeAttributeValue */);
                        this.consume();
                    }
                    else if (char === '>') {
                        this.delegate.beginAttributeValue(false);
                        this.delegate.finishAttributeValue();
                        this.consume();
                        this.delegate.finishTag();
                        this.transitionTo("beforeData" /* beforeData */);
                    }
                    else if (char === '"' || char === "'" || char === '<') {
                        this.delegate.reportSyntaxError(char + ' is not a valid character within attribute names');
                        this.consume();
                        this.delegate.appendToAttributeName(char);
                    }
                    else {
                        this.consume();
                        this.delegate.appendToAttributeName(char);
                    }
                },
                afterAttributeName() {
                    let char = this.peek();
                    if (utils_1.isSpace(char)) {
                        this.consume();
                        return;
                    }
                    else if (char === '/') {
                        this.delegate.beginAttributeValue(false);
                        this.delegate.finishAttributeValue();
                        this.consume();
                        this.transitionTo("selfClosingStartTag" /* selfClosingStartTag */);
                    }
                    else if (char === '=') {
                        this.consume();
                        this.transitionTo("beforeAttributeValue" /* beforeAttributeValue */);
                    }
                    else if (char === '>') {
                        this.delegate.beginAttributeValue(false);
                        this.delegate.finishAttributeValue();
                        this.consume();
                        this.delegate.finishTag();
                        this.transitionTo("beforeData" /* beforeData */);
                    }
                    else {
                        this.delegate.beginAttributeValue(false);
                        this.delegate.finishAttributeValue();
                        this.transitionTo("attributeName" /* attributeName */);
                        this.delegate.beginAttribute();
                        this.consume();
                        this.delegate.appendToAttributeName(char);
                    }
                },
                beforeAttributeValue() {
                    let char = this.peek();
                    if (utils_1.isSpace(char)) {
                        this.consume();
                    }
                    else if (char === '"') {
                        this.transitionTo("attributeValueDoubleQuoted" /* attributeValueDoubleQuoted */);
                        this.delegate.beginAttributeValue(true);
                        this.consume();
                    }
                    else if (char === "'") {
                        this.transitionTo("attributeValueSingleQuoted" /* attributeValueSingleQuoted */);
                        this.delegate.beginAttributeValue(true);
                        this.consume();
                    }
                    else if (char === '>') {
                        this.delegate.beginAttributeValue(false);
                        this.delegate.finishAttributeValue();
                        this.consume();
                        this.delegate.finishTag();
                        this.transitionTo("beforeData" /* beforeData */);
                    }
                    else {
                        this.transitionTo("attributeValueUnquoted" /* attributeValueUnquoted */);
                        this.delegate.beginAttributeValue(false);
                        this.consume();
                        this.delegate.appendToAttributeValue(char);
                    }
                },
                attributeValueDoubleQuoted() {
                    let char = this.consume();
                    if (char === '"') {
                        this.delegate.finishAttributeValue();
                        this.transitionTo("afterAttributeValueQuoted" /* afterAttributeValueQuoted */);
                    }
                    else if (char === '&') {
                        this.delegate.appendToAttributeValue(this.consumeCharRef() || '&');
                    }
                    else {
                        this.delegate.appendToAttributeValue(char);
                    }
                },
                attributeValueSingleQuoted() {
                    let char = this.consume();
                    if (char === "'") {
                        this.delegate.finishAttributeValue();
                        this.transitionTo("afterAttributeValueQuoted" /* afterAttributeValueQuoted */);
                    }
                    else if (char === '&') {
                        this.delegate.appendToAttributeValue(this.consumeCharRef() || '&');
                    }
                    else {
                        this.delegate.appendToAttributeValue(char);
                    }
                },
                attributeValueUnquoted() {
                    let char = this.peek();
                    if (utils_1.isSpace(char)) {
                        this.delegate.finishAttributeValue();
                        this.consume();
                        this.transitionTo("beforeAttributeName" /* beforeAttributeName */);
                    }
                    else if (char === '/') {
                        this.delegate.finishAttributeValue();
                        this.consume();
                        this.transitionTo("selfClosingStartTag" /* selfClosingStartTag */);
                    }
                    else if (char === '&') {
                        this.consume();
                        this.delegate.appendToAttributeValue(this.consumeCharRef() || '&');
                    }
                    else if (char === '>') {
                        this.delegate.finishAttributeValue();
                        this.consume();
                        this.delegate.finishTag();
                        this.transitionTo("beforeData" /* beforeData */);
                    }
                    else {
                        this.consume();
                        this.delegate.appendToAttributeValue(char);
                    }
                },
                afterAttributeValueQuoted() {
                    let char = this.peek();
                    if (utils_1.isSpace(char)) {
                        this.consume();
                        this.transitionTo("beforeAttributeName" /* beforeAttributeName */);
                    }
                    else if (char === '/') {
                        this.consume();
                        this.transitionTo("selfClosingStartTag" /* selfClosingStartTag */);
                    }
                    else if (char === '>') {
                        this.consume();
                        this.delegate.finishTag();
                        this.transitionTo("beforeData" /* beforeData */);
                    }
                    else {
                        this.transitionTo("beforeAttributeName" /* beforeAttributeName */);
                    }
                },
                selfClosingStartTag() {
                    let char = this.peek();
                    if (char === '>') {
                        this.consume();
                        this.delegate.markTagAsSelfClosing();
                        this.delegate.finishTag();
                        this.transitionTo("beforeData" /* beforeData */);
                    }
                    else {
                        this.transitionTo("beforeAttributeName" /* beforeAttributeName */);
                    }
                },
                endTagOpen() {
                    let char = this.consume();
                    if (char === '@' || char === ':' || utils_1.isAlpha(char)) {
                        this.transitionTo("tagName" /* tagName */);
                        this.tagNameBuffer = '';
                        this.delegate.beginEndTag();
                        this.appendToTagName(char);
                    }
                }
            };
            this.reset();
        }
        reset() {
            this.transitionTo("beforeData" /* beforeData */);
            this.input = '';
            this.index = 0;
            this.line = 1;
            this.column = 0;
            this.delegate.reset();
        }
        transitionTo(state) {
            this.state = state;
        }
        tokenize(input) {
            this.reset();
            this.tokenizePart(input);
            this.tokenizeEOF();
        }
        tokenizePart(input) {
            this.input += utils_1.preprocessInput(input);
            while (this.index < this.input.length) {
                let handler = this.states[this.state];
                if (handler !== undefined) {
                    handler.call(this);
                }
                else {
                    throw new Error(`unhandled state ${this.state}`);
                }
            }
        }
        tokenizeEOF() {
            this.flushData();
        }
        flushData() {
            if (this.state === 'data') {
                this.delegate.finishData();
                this.transitionTo("beforeData" /* beforeData */);
            }
        }
        peek() {
            return this.input.charAt(this.index);
        }
        consume() {
            let char = this.peek();
            this.index++;
            if (char === '\n') {
                this.line++;
                this.column = 0;
            }
            else {
                this.column++;
            }
            return char;
        }
        consumeCharRef() {
            let endIndex = this.input.indexOf(';', this.index);
            if (endIndex === -1) {
                return;
            }
            let entity = this.input.slice(this.index, endIndex);
            let chars = this.entityParser.parse(entity);
            if (chars) {
                let count = entity.length;
                // consume the entity chars
                while (count) {
                    this.consume();
                    count--;
                }
                // consume the `;`
                this.consume();
                return chars;
            }
        }
        markTagStart() {
            this.delegate.tagOpen();
        }
        appendToTagName(char) {
            this.tagNameBuffer += char;
            this.delegate.appendToTagName(char);
        }
    }
    exports.default = EventedTokenizer;
});
//# sourceMappingURL=evented-tokenizer.js.map