#!/usr/bin/env node
// readability.mjs: what counts as prose, what each limit catches, and the ratchet.
import assert from 'node:assert/strict';
import { measure, over, prose, LIMITS } from './readability.mjs';

let n = 0; const ok = (name, cond) => { n++; assert.ok(cond, name); };
const words = (k) => Array.from({ length: k }, (_, i) => 'word' + i).join(' ');

ok('a short plain README is within every limit', over(measure('# Tool\n\nIt checks the tokens. Run it before a push.\n\n```sh\nnode check.mjs --repo . --with many flags here\n```\n')).length === 0);
ok('a sentence over 25 words is counted', measure(`# T\n\n${words(26)}.\n`).longSentences === 1 && measure(`# T\n\n${words(25)}.\n`).longSentences === 0);
ok('a paragraph of six sentences is long; five is not', measure('# T\n\n' + 'One two three. '.repeat(6) + '\n').longParagraphs === 1 && measure('# T\n\n' + 'One two three. '.repeat(5) + '\n').longParagraphs === 0);
ok('a paragraph over 100 words is long however it is cut', measure('# T\n\n' + (words(21) + '. ').repeat(5) + '\n').longParagraphs === 1);
ok('code blocks and headings are not prose', measure('# A heading of many many many words here\n\n```\n' + words(900) + '\n```\n').words === 0);
ok('a table cell is a paragraph of its own: prose in a table is still prose', measure(`# T\n\n| a | b |\n|---|---|\n| x | ${words(30)}. |\n`).longSentences === 1);
ok('an escaped pipe inside a cell does not split it', prose('| a | b \\| c |\n|---|---|\n| one | two |\n').length === 4);
ok('a list item is a paragraph of its own', prose('- one. two.\n- three.\n').length === 2);
ok('six code spans in one paragraph is reference written as prose', measure('# T\n\nUse `a`, `b`, `c`, `d`, `e` and `f`.\n').codeParagraphs === 1);
ok('a link counts as its text', measure('# T\n\nSee [the guide](../../a/very/long/path/to/somewhere/README.md#with-an-anchor).\n').words === 3);
ok('over 800 words is named', over(measure('# T\n\n' + ('Short one here now. '.repeat(5) + '\n\n').repeat(41))).some((x) => /words of prose/.test(x)));
ok('the limits are the standard\'s numbers', JSON.stringify(LIMITS) === JSON.stringify({ words: 800, sentence: 25, paragraphSentences: 5, paragraphWords: 100, paragraphCode: 5, grade: 12 }));
ok('a ~~~ fence and a fence indented in a list are code', measure('# T\n\n~~~\n' + words(30) + '.\n~~~\n\n- item\n\n   ```\n   ' + words(30) + '\n   ```\n').words === 1);
ok('a blockquote after a blank line is its own paragraph', prose('One two.\n\n> Three four.\n').length === 2);
ok('e.g. does not end a sentence', measure('# T\n\nUse a short name, e.g. The button.\n').longSentences === 0 && prose('# T\n\nUse a name, e.g. The button.\n')[0].sentences.length === 1);
ok('a 1) list splits into items', prose('1) one.\n2) two.\n').length === 2);
console.log(`test-readability: ${n} assertions passed`);
