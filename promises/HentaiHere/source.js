(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeHTML = exports.decodeHTMLStrict = exports.decodeXML = void 0;
var entities_json_1 = __importDefault(require("./maps/entities.json"));
var legacy_json_1 = __importDefault(require("./maps/legacy.json"));
var xml_json_1 = __importDefault(require("./maps/xml.json"));
var decode_codepoint_1 = __importDefault(require("./decode_codepoint"));
exports.decodeXML = getStrictDecoder(xml_json_1.default);
exports.decodeHTMLStrict = getStrictDecoder(entities_json_1.default);
function getStrictDecoder(map) {
    var keys = Object.keys(map).join("|");
    var replace = getReplacer(map);
    keys += "|#[xX][\\da-fA-F]+|#\\d+";
    var re = new RegExp("&(?:" + keys + ");", "g");
    return function (str) { return String(str).replace(re, replace); };
}
var sorter = function (a, b) { return (a < b ? 1 : -1); };
exports.decodeHTML = (function () {
    var legacy = Object.keys(legacy_json_1.default).sort(sorter);
    var keys = Object.keys(entities_json_1.default).sort(sorter);
    for (var i = 0, j = 0; i < keys.length; i++) {
        if (legacy[j] === keys[i]) {
            keys[i] += ";?";
            j++;
        }
        else {
            keys[i] += ";";
        }
    }
    var re = new RegExp("&(?:" + keys.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g");
    var replace = getReplacer(entities_json_1.default);
    function replacer(str) {
        if (str.substr(-1) !== ";")
            str += ";";
        return replace(str);
    }
    // TODO consider creating a merged map
    return function (str) { return String(str).replace(re, replacer); };
})();
function getReplacer(map) {
    return function replace(str) {
        if (str.charAt(1) === "#") {
            var secondChar = str.charAt(2);
            if (secondChar === "X" || secondChar === "x") {
                return decode_codepoint_1.default(parseInt(str.substr(3), 16));
            }
            return decode_codepoint_1.default(parseInt(str.substr(2), 10));
        }
        return map[str.slice(1, -1)];
    };
}

},{"./decode_codepoint":2,"./maps/entities.json":6,"./maps/legacy.json":7,"./maps/xml.json":8}],2:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var decode_json_1 = __importDefault(require("./maps/decode.json"));
// Modified version of https://github.com/mathiasbynens/he/blob/master/src/he.js#L94-L119
function decodeCodePoint(codePoint) {
    if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
        return "\uFFFD";
    }
    if (codePoint in decode_json_1.default) {
        codePoint = decode_json_1.default[codePoint];
    }
    var output = "";
    if (codePoint > 0xffff) {
        codePoint -= 0x10000;
        output += String.fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800);
        codePoint = 0xdc00 | (codePoint & 0x3ff);
    }
    output += String.fromCharCode(codePoint);
    return output;
}
exports.default = decodeCodePoint;

},{"./maps/decode.json":5}],3:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escape = exports.encodeHTML = exports.encodeXML = void 0;
var xml_json_1 = __importDefault(require("./maps/xml.json"));
var inverseXML = getInverseObj(xml_json_1.default);
var xmlReplacer = getInverseReplacer(inverseXML);
exports.encodeXML = getInverse(inverseXML, xmlReplacer);
var entities_json_1 = __importDefault(require("./maps/entities.json"));
var inverseHTML = getInverseObj(entities_json_1.default);
var htmlReplacer = getInverseReplacer(inverseHTML);
exports.encodeHTML = getInverse(inverseHTML, htmlReplacer);
function getInverseObj(obj) {
    return Object.keys(obj)
        .sort()
        .reduce(function (inverse, name) {
        inverse[obj[name]] = "&" + name + ";";
        return inverse;
    }, {});
}
function getInverseReplacer(inverse) {
    var single = [];
    var multiple = [];
    for (var _i = 0, _a = Object.keys(inverse); _i < _a.length; _i++) {
        var k = _a[_i];
        if (k.length === 1) {
            // Add value to single array
            single.push("\\" + k);
        }
        else {
            // Add value to multiple array
            multiple.push(k);
        }
    }
    // Add ranges to single characters.
    single.sort();
    for (var start = 0; start < single.length - 1; start++) {
        // Find the end of a run of characters
        var end = start;
        while (end < single.length - 1 &&
            single[end].charCodeAt(1) + 1 === single[end + 1].charCodeAt(1)) {
            end += 1;
        }
        var count = 1 + end - start;
        // We want to replace at least three characters
        if (count < 3)
            continue;
        single.splice(start, count, single[start] + "-" + single[end]);
    }
    multiple.unshift("[" + single.join("") + "]");
    return new RegExp(multiple.join("|"), "g");
}
var reNonASCII = /(?:[\x80-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g;
function singleCharReplacer(c) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return "&#x" + c.codePointAt(0).toString(16).toUpperCase() + ";";
}
function getInverse(inverse, re) {
    return function (data) {
        return data
            .replace(re, function (name) { return inverse[name]; })
            .replace(reNonASCII, singleCharReplacer);
    };
}
var reXmlChars = getInverseReplacer(inverseXML);
function escape(data) {
    return data
        .replace(reXmlChars, singleCharReplacer)
        .replace(reNonASCII, singleCharReplacer);
}
exports.escape = escape;

},{"./maps/entities.json":6,"./maps/xml.json":8}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeXMLStrict = exports.decodeHTML5Strict = exports.decodeHTML4Strict = exports.decodeHTML5 = exports.decodeHTML4 = exports.decodeHTMLStrict = exports.decodeHTML = exports.decodeXML = exports.encodeHTML5 = exports.encodeHTML4 = exports.escape = exports.encodeHTML = exports.encodeXML = exports.encode = exports.decodeStrict = exports.decode = void 0;
var decode_1 = require("./decode");
var encode_1 = require("./encode");
/**
 * Decodes a string with entities.
 *
 * @param data String to decode.
 * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
 */
function decode(data, level) {
    return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTML)(data);
}
exports.decode = decode;
/**
 * Decodes a string with entities. Does not allow missing trailing semicolons for entities.
 *
 * @param data String to decode.
 * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
 */
function decodeStrict(data, level) {
    return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTMLStrict)(data);
}
exports.decodeStrict = decodeStrict;
/**
 * Encodes a string with entities.
 *
 * @param data String to encode.
 * @param level Optional level to encode at. 0 = XML, 1 = HTML. Default is 0.
 */
function encode(data, level) {
    return (!level || level <= 0 ? encode_1.encodeXML : encode_1.encodeHTML)(data);
}
exports.encode = encode;
var encode_2 = require("./encode");
Object.defineProperty(exports, "encodeXML", { enumerable: true, get: function () { return encode_2.encodeXML; } });
Object.defineProperty(exports, "encodeHTML", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
Object.defineProperty(exports, "escape", { enumerable: true, get: function () { return encode_2.escape; } });
// Legacy aliases
Object.defineProperty(exports, "encodeHTML4", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
Object.defineProperty(exports, "encodeHTML5", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
var decode_2 = require("./decode");
Object.defineProperty(exports, "decodeXML", { enumerable: true, get: function () { return decode_2.decodeXML; } });
Object.defineProperty(exports, "decodeHTML", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTMLStrict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
// Legacy aliases
Object.defineProperty(exports, "decodeHTML4", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTML5", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTML4Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
Object.defineProperty(exports, "decodeHTML5Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
Object.defineProperty(exports, "decodeXMLStrict", { enumerable: true, get: function () { return decode_2.decodeXML; } });

},{"./decode":1,"./encode":3}],5:[function(require,module,exports){
module.exports={"0":65533,"128":8364,"130":8218,"131":402,"132":8222,"133":8230,"134":8224,"135":8225,"136":710,"137":8240,"138":352,"139":8249,"140":338,"142":381,"145":8216,"146":8217,"147":8220,"148":8221,"149":8226,"150":8211,"151":8212,"152":732,"153":8482,"154":353,"155":8250,"156":339,"158":382,"159":376}

},{}],6:[function(require,module,exports){
module.exports={"Aacute":"??","aacute":"??","Abreve":"??","abreve":"??","ac":"???","acd":"???","acE":"?????","Acirc":"??","acirc":"??","acute":"??","Acy":"??","acy":"??","AElig":"??","aelig":"??","af":"???","Afr":"????","afr":"????","Agrave":"??","agrave":"??","alefsym":"???","aleph":"???","Alpha":"??","alpha":"??","Amacr":"??","amacr":"??","amalg":"???","amp":"&","AMP":"&","andand":"???","And":"???","and":"???","andd":"???","andslope":"???","andv":"???","ang":"???","ange":"???","angle":"???","angmsdaa":"???","angmsdab":"???","angmsdac":"???","angmsdad":"???","angmsdae":"???","angmsdaf":"???","angmsdag":"???","angmsdah":"???","angmsd":"???","angrt":"???","angrtvb":"???","angrtvbd":"???","angsph":"???","angst":"??","angzarr":"???","Aogon":"??","aogon":"??","Aopf":"????","aopf":"????","apacir":"???","ap":"???","apE":"???","ape":"???","apid":"???","apos":"'","ApplyFunction":"???","approx":"???","approxeq":"???","Aring":"??","aring":"??","Ascr":"????","ascr":"????","Assign":"???","ast":"*","asymp":"???","asympeq":"???","Atilde":"??","atilde":"??","Auml":"??","auml":"??","awconint":"???","awint":"???","backcong":"???","backepsilon":"??","backprime":"???","backsim":"???","backsimeq":"???","Backslash":"???","Barv":"???","barvee":"???","barwed":"???","Barwed":"???","barwedge":"???","bbrk":"???","bbrktbrk":"???","bcong":"???","Bcy":"??","bcy":"??","bdquo":"???","becaus":"???","because":"???","Because":"???","bemptyv":"???","bepsi":"??","bernou":"???","Bernoullis":"???","Beta":"??","beta":"??","beth":"???","between":"???","Bfr":"????","bfr":"????","bigcap":"???","bigcirc":"???","bigcup":"???","bigodot":"???","bigoplus":"???","bigotimes":"???","bigsqcup":"???","bigstar":"???","bigtriangledown":"???","bigtriangleup":"???","biguplus":"???","bigvee":"???","bigwedge":"???","bkarow":"???","blacklozenge":"???","blacksquare":"???","blacktriangle":"???","blacktriangledown":"???","blacktriangleleft":"???","blacktriangleright":"???","blank":"???","blk12":"???","blk14":"???","blk34":"???","block":"???","bne":"=???","bnequiv":"??????","bNot":"???","bnot":"???","Bopf":"????","bopf":"????","bot":"???","bottom":"???","bowtie":"???","boxbox":"???","boxdl":"???","boxdL":"???","boxDl":"???","boxDL":"???","boxdr":"???","boxdR":"???","boxDr":"???","boxDR":"???","boxh":"???","boxH":"???","boxhd":"???","boxHd":"???","boxhD":"???","boxHD":"???","boxhu":"???","boxHu":"???","boxhU":"???","boxHU":"???","boxminus":"???","boxplus":"???","boxtimes":"???","boxul":"???","boxuL":"???","boxUl":"???","boxUL":"???","boxur":"???","boxuR":"???","boxUr":"???","boxUR":"???","boxv":"???","boxV":"???","boxvh":"???","boxvH":"???","boxVh":"???","boxVH":"???","boxvl":"???","boxvL":"???","boxVl":"???","boxVL":"???","boxvr":"???","boxvR":"???","boxVr":"???","boxVR":"???","bprime":"???","breve":"??","Breve":"??","brvbar":"??","bscr":"????","Bscr":"???","bsemi":"???","bsim":"???","bsime":"???","bsolb":"???","bsol":"\\","bsolhsub":"???","bull":"???","bullet":"???","bump":"???","bumpE":"???","bumpe":"???","Bumpeq":"???","bumpeq":"???","Cacute":"??","cacute":"??","capand":"???","capbrcup":"???","capcap":"???","cap":"???","Cap":"???","capcup":"???","capdot":"???","CapitalDifferentialD":"???","caps":"??????","caret":"???","caron":"??","Cayleys":"???","ccaps":"???","Ccaron":"??","ccaron":"??","Ccedil":"??","ccedil":"??","Ccirc":"??","ccirc":"??","Cconint":"???","ccups":"???","ccupssm":"???","Cdot":"??","cdot":"??","cedil":"??","Cedilla":"??","cemptyv":"???","cent":"??","centerdot":"??","CenterDot":"??","cfr":"????","Cfr":"???","CHcy":"??","chcy":"??","check":"???","checkmark":"???","Chi":"??","chi":"??","circ":"??","circeq":"???","circlearrowleft":"???","circlearrowright":"???","circledast":"???","circledcirc":"???","circleddash":"???","CircleDot":"???","circledR":"??","circledS":"???","CircleMinus":"???","CirclePlus":"???","CircleTimes":"???","cir":"???","cirE":"???","cire":"???","cirfnint":"???","cirmid":"???","cirscir":"???","ClockwiseContourIntegral":"???","CloseCurlyDoubleQuote":"???","CloseCurlyQuote":"???","clubs":"???","clubsuit":"???","colon":":","Colon":"???","Colone":"???","colone":"???","coloneq":"???","comma":",","commat":"@","comp":"???","compfn":"???","complement":"???","complexes":"???","cong":"???","congdot":"???","Congruent":"???","conint":"???","Conint":"???","ContourIntegral":"???","copf":"????","Copf":"???","coprod":"???","Coproduct":"???","copy":"??","COPY":"??","copysr":"???","CounterClockwiseContourIntegral":"???","crarr":"???","cross":"???","Cross":"???","Cscr":"????","cscr":"????","csub":"???","csube":"???","csup":"???","csupe":"???","ctdot":"???","cudarrl":"???","cudarrr":"???","cuepr":"???","cuesc":"???","cularr":"???","cularrp":"???","cupbrcap":"???","cupcap":"???","CupCap":"???","cup":"???","Cup":"???","cupcup":"???","cupdot":"???","cupor":"???","cups":"??????","curarr":"???","curarrm":"???","curlyeqprec":"???","curlyeqsucc":"???","curlyvee":"???","curlywedge":"???","curren":"??","curvearrowleft":"???","curvearrowright":"???","cuvee":"???","cuwed":"???","cwconint":"???","cwint":"???","cylcty":"???","dagger":"???","Dagger":"???","daleth":"???","darr":"???","Darr":"???","dArr":"???","dash":"???","Dashv":"???","dashv":"???","dbkarow":"???","dblac":"??","Dcaron":"??","dcaron":"??","Dcy":"??","dcy":"??","ddagger":"???","ddarr":"???","DD":"???","dd":"???","DDotrahd":"???","ddotseq":"???","deg":"??","Del":"???","Delta":"??","delta":"??","demptyv":"???","dfisht":"???","Dfr":"????","dfr":"????","dHar":"???","dharl":"???","dharr":"???","DiacriticalAcute":"??","DiacriticalDot":"??","DiacriticalDoubleAcute":"??","DiacriticalGrave":"`","DiacriticalTilde":"??","diam":"???","diamond":"???","Diamond":"???","diamondsuit":"???","diams":"???","die":"??","DifferentialD":"???","digamma":"??","disin":"???","div":"??","divide":"??","divideontimes":"???","divonx":"???","DJcy":"??","djcy":"??","dlcorn":"???","dlcrop":"???","dollar":"$","Dopf":"????","dopf":"????","Dot":"??","dot":"??","DotDot":"???","doteq":"???","doteqdot":"???","DotEqual":"???","dotminus":"???","dotplus":"???","dotsquare":"???","doublebarwedge":"???","DoubleContourIntegral":"???","DoubleDot":"??","DoubleDownArrow":"???","DoubleLeftArrow":"???","DoubleLeftRightArrow":"???","DoubleLeftTee":"???","DoubleLongLeftArrow":"???","DoubleLongLeftRightArrow":"???","DoubleLongRightArrow":"???","DoubleRightArrow":"???","DoubleRightTee":"???","DoubleUpArrow":"???","DoubleUpDownArrow":"???","DoubleVerticalBar":"???","DownArrowBar":"???","downarrow":"???","DownArrow":"???","Downarrow":"???","DownArrowUpArrow":"???","DownBreve":"??","downdownarrows":"???","downharpoonleft":"???","downharpoonright":"???","DownLeftRightVector":"???","DownLeftTeeVector":"???","DownLeftVectorBar":"???","DownLeftVector":"???","DownRightTeeVector":"???","DownRightVectorBar":"???","DownRightVector":"???","DownTeeArrow":"???","DownTee":"???","drbkarow":"???","drcorn":"???","drcrop":"???","Dscr":"????","dscr":"????","DScy":"??","dscy":"??","dsol":"???","Dstrok":"??","dstrok":"??","dtdot":"???","dtri":"???","dtrif":"???","duarr":"???","duhar":"???","dwangle":"???","DZcy":"??","dzcy":"??","dzigrarr":"???","Eacute":"??","eacute":"??","easter":"???","Ecaron":"??","ecaron":"??","Ecirc":"??","ecirc":"??","ecir":"???","ecolon":"???","Ecy":"??","ecy":"??","eDDot":"???","Edot":"??","edot":"??","eDot":"???","ee":"???","efDot":"???","Efr":"????","efr":"????","eg":"???","Egrave":"??","egrave":"??","egs":"???","egsdot":"???","el":"???","Element":"???","elinters":"???","ell":"???","els":"???","elsdot":"???","Emacr":"??","emacr":"??","empty":"???","emptyset":"???","EmptySmallSquare":"???","emptyv":"???","EmptyVerySmallSquare":"???","emsp13":"???","emsp14":"???","emsp":"???","ENG":"??","eng":"??","ensp":"???","Eogon":"??","eogon":"??","Eopf":"????","eopf":"????","epar":"???","eparsl":"???","eplus":"???","epsi":"??","Epsilon":"??","epsilon":"??","epsiv":"??","eqcirc":"???","eqcolon":"???","eqsim":"???","eqslantgtr":"???","eqslantless":"???","Equal":"???","equals":"=","EqualTilde":"???","equest":"???","Equilibrium":"???","equiv":"???","equivDD":"???","eqvparsl":"???","erarr":"???","erDot":"???","escr":"???","Escr":"???","esdot":"???","Esim":"???","esim":"???","Eta":"??","eta":"??","ETH":"??","eth":"??","Euml":"??","euml":"??","euro":"???","excl":"!","exist":"???","Exists":"???","expectation":"???","exponentiale":"???","ExponentialE":"???","fallingdotseq":"???","Fcy":"??","fcy":"??","female":"???","ffilig":"???","fflig":"???","ffllig":"???","Ffr":"????","ffr":"????","filig":"???","FilledSmallSquare":"???","FilledVerySmallSquare":"???","fjlig":"fj","flat":"???","fllig":"???","fltns":"???","fnof":"??","Fopf":"????","fopf":"????","forall":"???","ForAll":"???","fork":"???","forkv":"???","Fouriertrf":"???","fpartint":"???","frac12":"??","frac13":"???","frac14":"??","frac15":"???","frac16":"???","frac18":"???","frac23":"???","frac25":"???","frac34":"??","frac35":"???","frac38":"???","frac45":"???","frac56":"???","frac58":"???","frac78":"???","frasl":"???","frown":"???","fscr":"????","Fscr":"???","gacute":"??","Gamma":"??","gamma":"??","Gammad":"??","gammad":"??","gap":"???","Gbreve":"??","gbreve":"??","Gcedil":"??","Gcirc":"??","gcirc":"??","Gcy":"??","gcy":"??","Gdot":"??","gdot":"??","ge":"???","gE":"???","gEl":"???","gel":"???","geq":"???","geqq":"???","geqslant":"???","gescc":"???","ges":"???","gesdot":"???","gesdoto":"???","gesdotol":"???","gesl":"??????","gesles":"???","Gfr":"????","gfr":"????","gg":"???","Gg":"???","ggg":"???","gimel":"???","GJcy":"??","gjcy":"??","gla":"???","gl":"???","glE":"???","glj":"???","gnap":"???","gnapprox":"???","gne":"???","gnE":"???","gneq":"???","gneqq":"???","gnsim":"???","Gopf":"????","gopf":"????","grave":"`","GreaterEqual":"???","GreaterEqualLess":"???","GreaterFullEqual":"???","GreaterGreater":"???","GreaterLess":"???","GreaterSlantEqual":"???","GreaterTilde":"???","Gscr":"????","gscr":"???","gsim":"???","gsime":"???","gsiml":"???","gtcc":"???","gtcir":"???","gt":">","GT":">","Gt":"???","gtdot":"???","gtlPar":"???","gtquest":"???","gtrapprox":"???","gtrarr":"???","gtrdot":"???","gtreqless":"???","gtreqqless":"???","gtrless":"???","gtrsim":"???","gvertneqq":"??????","gvnE":"??????","Hacek":"??","hairsp":"???","half":"??","hamilt":"???","HARDcy":"??","hardcy":"??","harrcir":"???","harr":"???","hArr":"???","harrw":"???","Hat":"^","hbar":"???","Hcirc":"??","hcirc":"??","hearts":"???","heartsuit":"???","hellip":"???","hercon":"???","hfr":"????","Hfr":"???","HilbertSpace":"???","hksearow":"???","hkswarow":"???","hoarr":"???","homtht":"???","hookleftarrow":"???","hookrightarrow":"???","hopf":"????","Hopf":"???","horbar":"???","HorizontalLine":"???","hscr":"????","Hscr":"???","hslash":"???","Hstrok":"??","hstrok":"??","HumpDownHump":"???","HumpEqual":"???","hybull":"???","hyphen":"???","Iacute":"??","iacute":"??","ic":"???","Icirc":"??","icirc":"??","Icy":"??","icy":"??","Idot":"??","IEcy":"??","iecy":"??","iexcl":"??","iff":"???","ifr":"????","Ifr":"???","Igrave":"??","igrave":"??","ii":"???","iiiint":"???","iiint":"???","iinfin":"???","iiota":"???","IJlig":"??","ijlig":"??","Imacr":"??","imacr":"??","image":"???","ImaginaryI":"???","imagline":"???","imagpart":"???","imath":"??","Im":"???","imof":"???","imped":"??","Implies":"???","incare":"???","in":"???","infin":"???","infintie":"???","inodot":"??","intcal":"???","int":"???","Int":"???","integers":"???","Integral":"???","intercal":"???","Intersection":"???","intlarhk":"???","intprod":"???","InvisibleComma":"???","InvisibleTimes":"???","IOcy":"??","iocy":"??","Iogon":"??","iogon":"??","Iopf":"????","iopf":"????","Iota":"??","iota":"??","iprod":"???","iquest":"??","iscr":"????","Iscr":"???","isin":"???","isindot":"???","isinE":"???","isins":"???","isinsv":"???","isinv":"???","it":"???","Itilde":"??","itilde":"??","Iukcy":"??","iukcy":"??","Iuml":"??","iuml":"??","Jcirc":"??","jcirc":"??","Jcy":"??","jcy":"??","Jfr":"????","jfr":"????","jmath":"??","Jopf":"????","jopf":"????","Jscr":"????","jscr":"????","Jsercy":"??","jsercy":"??","Jukcy":"??","jukcy":"??","Kappa":"??","kappa":"??","kappav":"??","Kcedil":"??","kcedil":"??","Kcy":"??","kcy":"??","Kfr":"????","kfr":"????","kgreen":"??","KHcy":"??","khcy":"??","KJcy":"??","kjcy":"??","Kopf":"????","kopf":"????","Kscr":"????","kscr":"????","lAarr":"???","Lacute":"??","lacute":"??","laemptyv":"???","lagran":"???","Lambda":"??","lambda":"??","lang":"???","Lang":"???","langd":"???","langle":"???","lap":"???","Laplacetrf":"???","laquo":"??","larrb":"???","larrbfs":"???","larr":"???","Larr":"???","lArr":"???","larrfs":"???","larrhk":"???","larrlp":"???","larrpl":"???","larrsim":"???","larrtl":"???","latail":"???","lAtail":"???","lat":"???","late":"???","lates":"??????","lbarr":"???","lBarr":"???","lbbrk":"???","lbrace":"{","lbrack":"[","lbrke":"???","lbrksld":"???","lbrkslu":"???","Lcaron":"??","lcaron":"??","Lcedil":"??","lcedil":"??","lceil":"???","lcub":"{","Lcy":"??","lcy":"??","ldca":"???","ldquo":"???","ldquor":"???","ldrdhar":"???","ldrushar":"???","ldsh":"???","le":"???","lE":"???","LeftAngleBracket":"???","LeftArrowBar":"???","leftarrow":"???","LeftArrow":"???","Leftarrow":"???","LeftArrowRightArrow":"???","leftarrowtail":"???","LeftCeiling":"???","LeftDoubleBracket":"???","LeftDownTeeVector":"???","LeftDownVectorBar":"???","LeftDownVector":"???","LeftFloor":"???","leftharpoondown":"???","leftharpoonup":"???","leftleftarrows":"???","leftrightarrow":"???","LeftRightArrow":"???","Leftrightarrow":"???","leftrightarrows":"???","leftrightharpoons":"???","leftrightsquigarrow":"???","LeftRightVector":"???","LeftTeeArrow":"???","LeftTee":"???","LeftTeeVector":"???","leftthreetimes":"???","LeftTriangleBar":"???","LeftTriangle":"???","LeftTriangleEqual":"???","LeftUpDownVector":"???","LeftUpTeeVector":"???","LeftUpVectorBar":"???","LeftUpVector":"???","LeftVectorBar":"???","LeftVector":"???","lEg":"???","leg":"???","leq":"???","leqq":"???","leqslant":"???","lescc":"???","les":"???","lesdot":"???","lesdoto":"???","lesdotor":"???","lesg":"??????","lesges":"???","lessapprox":"???","lessdot":"???","lesseqgtr":"???","lesseqqgtr":"???","LessEqualGreater":"???","LessFullEqual":"???","LessGreater":"???","lessgtr":"???","LessLess":"???","lesssim":"???","LessSlantEqual":"???","LessTilde":"???","lfisht":"???","lfloor":"???","Lfr":"????","lfr":"????","lg":"???","lgE":"???","lHar":"???","lhard":"???","lharu":"???","lharul":"???","lhblk":"???","LJcy":"??","ljcy":"??","llarr":"???","ll":"???","Ll":"???","llcorner":"???","Lleftarrow":"???","llhard":"???","lltri":"???","Lmidot":"??","lmidot":"??","lmoustache":"???","lmoust":"???","lnap":"???","lnapprox":"???","lne":"???","lnE":"???","lneq":"???","lneqq":"???","lnsim":"???","loang":"???","loarr":"???","lobrk":"???","longleftarrow":"???","LongLeftArrow":"???","Longleftarrow":"???","longleftrightarrow":"???","LongLeftRightArrow":"???","Longleftrightarrow":"???","longmapsto":"???","longrightarrow":"???","LongRightArrow":"???","Longrightarrow":"???","looparrowleft":"???","looparrowright":"???","lopar":"???","Lopf":"????","lopf":"????","loplus":"???","lotimes":"???","lowast":"???","lowbar":"_","LowerLeftArrow":"???","LowerRightArrow":"???","loz":"???","lozenge":"???","lozf":"???","lpar":"(","lparlt":"???","lrarr":"???","lrcorner":"???","lrhar":"???","lrhard":"???","lrm":"???","lrtri":"???","lsaquo":"???","lscr":"????","Lscr":"???","lsh":"???","Lsh":"???","lsim":"???","lsime":"???","lsimg":"???","lsqb":"[","lsquo":"???","lsquor":"???","Lstrok":"??","lstrok":"??","ltcc":"???","ltcir":"???","lt":"<","LT":"<","Lt":"???","ltdot":"???","lthree":"???","ltimes":"???","ltlarr":"???","ltquest":"???","ltri":"???","ltrie":"???","ltrif":"???","ltrPar":"???","lurdshar":"???","luruhar":"???","lvertneqq":"??????","lvnE":"??????","macr":"??","male":"???","malt":"???","maltese":"???","Map":"???","map":"???","mapsto":"???","mapstodown":"???","mapstoleft":"???","mapstoup":"???","marker":"???","mcomma":"???","Mcy":"??","mcy":"??","mdash":"???","mDDot":"???","measuredangle":"???","MediumSpace":"???","Mellintrf":"???","Mfr":"????","mfr":"????","mho":"???","micro":"??","midast":"*","midcir":"???","mid":"???","middot":"??","minusb":"???","minus":"???","minusd":"???","minusdu":"???","MinusPlus":"???","mlcp":"???","mldr":"???","mnplus":"???","models":"???","Mopf":"????","mopf":"????","mp":"???","mscr":"????","Mscr":"???","mstpos":"???","Mu":"??","mu":"??","multimap":"???","mumap":"???","nabla":"???","Nacute":"??","nacute":"??","nang":"??????","nap":"???","napE":"?????","napid":"?????","napos":"??","napprox":"???","natural":"???","naturals":"???","natur":"???","nbsp":"??","nbump":"?????","nbumpe":"?????","ncap":"???","Ncaron":"??","ncaron":"??","Ncedil":"??","ncedil":"??","ncong":"???","ncongdot":"?????","ncup":"???","Ncy":"??","ncy":"??","ndash":"???","nearhk":"???","nearr":"???","neArr":"???","nearrow":"???","ne":"???","nedot":"?????","NegativeMediumSpace":"???","NegativeThickSpace":"???","NegativeThinSpace":"???","NegativeVeryThinSpace":"???","nequiv":"???","nesear":"???","nesim":"?????","NestedGreaterGreater":"???","NestedLessLess":"???","NewLine":"\n","nexist":"???","nexists":"???","Nfr":"????","nfr":"????","ngE":"?????","nge":"???","ngeq":"???","ngeqq":"?????","ngeqslant":"?????","nges":"?????","nGg":"?????","ngsim":"???","nGt":"??????","ngt":"???","ngtr":"???","nGtv":"?????","nharr":"???","nhArr":"???","nhpar":"???","ni":"???","nis":"???","nisd":"???","niv":"???","NJcy":"??","njcy":"??","nlarr":"???","nlArr":"???","nldr":"???","nlE":"?????","nle":"???","nleftarrow":"???","nLeftarrow":"???","nleftrightarrow":"???","nLeftrightarrow":"???","nleq":"???","nleqq":"?????","nleqslant":"?????","nles":"?????","nless":"???","nLl":"?????","nlsim":"???","nLt":"??????","nlt":"???","nltri":"???","nltrie":"???","nLtv":"?????","nmid":"???","NoBreak":"???","NonBreakingSpace":"??","nopf":"????","Nopf":"???","Not":"???","not":"??","NotCongruent":"???","NotCupCap":"???","NotDoubleVerticalBar":"???","NotElement":"???","NotEqual":"???","NotEqualTilde":"?????","NotExists":"???","NotGreater":"???","NotGreaterEqual":"???","NotGreaterFullEqual":"?????","NotGreaterGreater":"?????","NotGreaterLess":"???","NotGreaterSlantEqual":"?????","NotGreaterTilde":"???","NotHumpDownHump":"?????","NotHumpEqual":"?????","notin":"???","notindot":"?????","notinE":"?????","notinva":"???","notinvb":"???","notinvc":"???","NotLeftTriangleBar":"?????","NotLeftTriangle":"???","NotLeftTriangleEqual":"???","NotLess":"???","NotLessEqual":"???","NotLessGreater":"???","NotLessLess":"?????","NotLessSlantEqual":"?????","NotLessTilde":"???","NotNestedGreaterGreater":"?????","NotNestedLessLess":"?????","notni":"???","notniva":"???","notnivb":"???","notnivc":"???","NotPrecedes":"???","NotPrecedesEqual":"?????","NotPrecedesSlantEqual":"???","NotReverseElement":"???","NotRightTriangleBar":"?????","NotRightTriangle":"???","NotRightTriangleEqual":"???","NotSquareSubset":"?????","NotSquareSubsetEqual":"???","NotSquareSuperset":"?????","NotSquareSupersetEqual":"???","NotSubset":"??????","NotSubsetEqual":"???","NotSucceeds":"???","NotSucceedsEqual":"?????","NotSucceedsSlantEqual":"???","NotSucceedsTilde":"?????","NotSuperset":"??????","NotSupersetEqual":"???","NotTilde":"???","NotTildeEqual":"???","NotTildeFullEqual":"???","NotTildeTilde":"???","NotVerticalBar":"???","nparallel":"???","npar":"???","nparsl":"??????","npart":"?????","npolint":"???","npr":"???","nprcue":"???","nprec":"???","npreceq":"?????","npre":"?????","nrarrc":"?????","nrarr":"???","nrArr":"???","nrarrw":"?????","nrightarrow":"???","nRightarrow":"???","nrtri":"???","nrtrie":"???","nsc":"???","nsccue":"???","nsce":"?????","Nscr":"????","nscr":"????","nshortmid":"???","nshortparallel":"???","nsim":"???","nsime":"???","nsimeq":"???","nsmid":"???","nspar":"???","nsqsube":"???","nsqsupe":"???","nsub":"???","nsubE":"?????","nsube":"???","nsubset":"??????","nsubseteq":"???","nsubseteqq":"?????","nsucc":"???","nsucceq":"?????","nsup":"???","nsupE":"?????","nsupe":"???","nsupset":"??????","nsupseteq":"???","nsupseteqq":"?????","ntgl":"???","Ntilde":"??","ntilde":"??","ntlg":"???","ntriangleleft":"???","ntrianglelefteq":"???","ntriangleright":"???","ntrianglerighteq":"???","Nu":"??","nu":"??","num":"#","numero":"???","numsp":"???","nvap":"??????","nvdash":"???","nvDash":"???","nVdash":"???","nVDash":"???","nvge":"??????","nvgt":">???","nvHarr":"???","nvinfin":"???","nvlArr":"???","nvle":"??????","nvlt":"<???","nvltrie":"??????","nvrArr":"???","nvrtrie":"??????","nvsim":"??????","nwarhk":"???","nwarr":"???","nwArr":"???","nwarrow":"???","nwnear":"???","Oacute":"??","oacute":"??","oast":"???","Ocirc":"??","ocirc":"??","ocir":"???","Ocy":"??","ocy":"??","odash":"???","Odblac":"??","odblac":"??","odiv":"???","odot":"???","odsold":"???","OElig":"??","oelig":"??","ofcir":"???","Ofr":"????","ofr":"????","ogon":"??","Ograve":"??","ograve":"??","ogt":"???","ohbar":"???","ohm":"??","oint":"???","olarr":"???","olcir":"???","olcross":"???","oline":"???","olt":"???","Omacr":"??","omacr":"??","Omega":"??","omega":"??","Omicron":"??","omicron":"??","omid":"???","ominus":"???","Oopf":"????","oopf":"????","opar":"???","OpenCurlyDoubleQuote":"???","OpenCurlyQuote":"???","operp":"???","oplus":"???","orarr":"???","Or":"???","or":"???","ord":"???","order":"???","orderof":"???","ordf":"??","ordm":"??","origof":"???","oror":"???","orslope":"???","orv":"???","oS":"???","Oscr":"????","oscr":"???","Oslash":"??","oslash":"??","osol":"???","Otilde":"??","otilde":"??","otimesas":"???","Otimes":"???","otimes":"???","Ouml":"??","ouml":"??","ovbar":"???","OverBar":"???","OverBrace":"???","OverBracket":"???","OverParenthesis":"???","para":"??","parallel":"???","par":"???","parsim":"???","parsl":"???","part":"???","PartialD":"???","Pcy":"??","pcy":"??","percnt":"%","period":".","permil":"???","perp":"???","pertenk":"???","Pfr":"????","pfr":"????","Phi":"??","phi":"??","phiv":"??","phmmat":"???","phone":"???","Pi":"??","pi":"??","pitchfork":"???","piv":"??","planck":"???","planckh":"???","plankv":"???","plusacir":"???","plusb":"???","pluscir":"???","plus":"+","plusdo":"???","plusdu":"???","pluse":"???","PlusMinus":"??","plusmn":"??","plussim":"???","plustwo":"???","pm":"??","Poincareplane":"???","pointint":"???","popf":"????","Popf":"???","pound":"??","prap":"???","Pr":"???","pr":"???","prcue":"???","precapprox":"???","prec":"???","preccurlyeq":"???","Precedes":"???","PrecedesEqual":"???","PrecedesSlantEqual":"???","PrecedesTilde":"???","preceq":"???","precnapprox":"???","precneqq":"???","precnsim":"???","pre":"???","prE":"???","precsim":"???","prime":"???","Prime":"???","primes":"???","prnap":"???","prnE":"???","prnsim":"???","prod":"???","Product":"???","profalar":"???","profline":"???","profsurf":"???","prop":"???","Proportional":"???","Proportion":"???","propto":"???","prsim":"???","prurel":"???","Pscr":"????","pscr":"????","Psi":"??","psi":"??","puncsp":"???","Qfr":"????","qfr":"????","qint":"???","qopf":"????","Qopf":"???","qprime":"???","Qscr":"????","qscr":"????","quaternions":"???","quatint":"???","quest":"?","questeq":"???","quot":"\"","QUOT":"\"","rAarr":"???","race":"?????","Racute":"??","racute":"??","radic":"???","raemptyv":"???","rang":"???","Rang":"???","rangd":"???","range":"???","rangle":"???","raquo":"??","rarrap":"???","rarrb":"???","rarrbfs":"???","rarrc":"???","rarr":"???","Rarr":"???","rArr":"???","rarrfs":"???","rarrhk":"???","rarrlp":"???","rarrpl":"???","rarrsim":"???","Rarrtl":"???","rarrtl":"???","rarrw":"???","ratail":"???","rAtail":"???","ratio":"???","rationals":"???","rbarr":"???","rBarr":"???","RBarr":"???","rbbrk":"???","rbrace":"}","rbrack":"]","rbrke":"???","rbrksld":"???","rbrkslu":"???","Rcaron":"??","rcaron":"??","Rcedil":"??","rcedil":"??","rceil":"???","rcub":"}","Rcy":"??","rcy":"??","rdca":"???","rdldhar":"???","rdquo":"???","rdquor":"???","rdsh":"???","real":"???","realine":"???","realpart":"???","reals":"???","Re":"???","rect":"???","reg":"??","REG":"??","ReverseElement":"???","ReverseEquilibrium":"???","ReverseUpEquilibrium":"???","rfisht":"???","rfloor":"???","rfr":"????","Rfr":"???","rHar":"???","rhard":"???","rharu":"???","rharul":"???","Rho":"??","rho":"??","rhov":"??","RightAngleBracket":"???","RightArrowBar":"???","rightarrow":"???","RightArrow":"???","Rightarrow":"???","RightArrowLeftArrow":"???","rightarrowtail":"???","RightCeiling":"???","RightDoubleBracket":"???","RightDownTeeVector":"???","RightDownVectorBar":"???","RightDownVector":"???","RightFloor":"???","rightharpoondown":"???","rightharpoonup":"???","rightleftarrows":"???","rightleftharpoons":"???","rightrightarrows":"???","rightsquigarrow":"???","RightTeeArrow":"???","RightTee":"???","RightTeeVector":"???","rightthreetimes":"???","RightTriangleBar":"???","RightTriangle":"???","RightTriangleEqual":"???","RightUpDownVector":"???","RightUpTeeVector":"???","RightUpVectorBar":"???","RightUpVector":"???","RightVectorBar":"???","RightVector":"???","ring":"??","risingdotseq":"???","rlarr":"???","rlhar":"???","rlm":"???","rmoustache":"???","rmoust":"???","rnmid":"???","roang":"???","roarr":"???","robrk":"???","ropar":"???","ropf":"????","Ropf":"???","roplus":"???","rotimes":"???","RoundImplies":"???","rpar":")","rpargt":"???","rppolint":"???","rrarr":"???","Rrightarrow":"???","rsaquo":"???","rscr":"????","Rscr":"???","rsh":"???","Rsh":"???","rsqb":"]","rsquo":"???","rsquor":"???","rthree":"???","rtimes":"???","rtri":"???","rtrie":"???","rtrif":"???","rtriltri":"???","RuleDelayed":"???","ruluhar":"???","rx":"???","Sacute":"??","sacute":"??","sbquo":"???","scap":"???","Scaron":"??","scaron":"??","Sc":"???","sc":"???","sccue":"???","sce":"???","scE":"???","Scedil":"??","scedil":"??","Scirc":"??","scirc":"??","scnap":"???","scnE":"???","scnsim":"???","scpolint":"???","scsim":"???","Scy":"??","scy":"??","sdotb":"???","sdot":"???","sdote":"???","searhk":"???","searr":"???","seArr":"???","searrow":"???","sect":"??","semi":";","seswar":"???","setminus":"???","setmn":"???","sext":"???","Sfr":"????","sfr":"????","sfrown":"???","sharp":"???","SHCHcy":"??","shchcy":"??","SHcy":"??","shcy":"??","ShortDownArrow":"???","ShortLeftArrow":"???","shortmid":"???","shortparallel":"???","ShortRightArrow":"???","ShortUpArrow":"???","shy":"??","Sigma":"??","sigma":"??","sigmaf":"??","sigmav":"??","sim":"???","simdot":"???","sime":"???","simeq":"???","simg":"???","simgE":"???","siml":"???","simlE":"???","simne":"???","simplus":"???","simrarr":"???","slarr":"???","SmallCircle":"???","smallsetminus":"???","smashp":"???","smeparsl":"???","smid":"???","smile":"???","smt":"???","smte":"???","smtes":"??????","SOFTcy":"??","softcy":"??","solbar":"???","solb":"???","sol":"/","Sopf":"????","sopf":"????","spades":"???","spadesuit":"???","spar":"???","sqcap":"???","sqcaps":"??????","sqcup":"???","sqcups":"??????","Sqrt":"???","sqsub":"???","sqsube":"???","sqsubset":"???","sqsubseteq":"???","sqsup":"???","sqsupe":"???","sqsupset":"???","sqsupseteq":"???","square":"???","Square":"???","SquareIntersection":"???","SquareSubset":"???","SquareSubsetEqual":"???","SquareSuperset":"???","SquareSupersetEqual":"???","SquareUnion":"???","squarf":"???","squ":"???","squf":"???","srarr":"???","Sscr":"????","sscr":"????","ssetmn":"???","ssmile":"???","sstarf":"???","Star":"???","star":"???","starf":"???","straightepsilon":"??","straightphi":"??","strns":"??","sub":"???","Sub":"???","subdot":"???","subE":"???","sube":"???","subedot":"???","submult":"???","subnE":"???","subne":"???","subplus":"???","subrarr":"???","subset":"???","Subset":"???","subseteq":"???","subseteqq":"???","SubsetEqual":"???","subsetneq":"???","subsetneqq":"???","subsim":"???","subsub":"???","subsup":"???","succapprox":"???","succ":"???","succcurlyeq":"???","Succeeds":"???","SucceedsEqual":"???","SucceedsSlantEqual":"???","SucceedsTilde":"???","succeq":"???","succnapprox":"???","succneqq":"???","succnsim":"???","succsim":"???","SuchThat":"???","sum":"???","Sum":"???","sung":"???","sup1":"??","sup2":"??","sup3":"??","sup":"???","Sup":"???","supdot":"???","supdsub":"???","supE":"???","supe":"???","supedot":"???","Superset":"???","SupersetEqual":"???","suphsol":"???","suphsub":"???","suplarr":"???","supmult":"???","supnE":"???","supne":"???","supplus":"???","supset":"???","Supset":"???","supseteq":"???","supseteqq":"???","supsetneq":"???","supsetneqq":"???","supsim":"???","supsub":"???","supsup":"???","swarhk":"???","swarr":"???","swArr":"???","swarrow":"???","swnwar":"???","szlig":"??","Tab":"\t","target":"???","Tau":"??","tau":"??","tbrk":"???","Tcaron":"??","tcaron":"??","Tcedil":"??","tcedil":"??","Tcy":"??","tcy":"??","tdot":"???","telrec":"???","Tfr":"????","tfr":"????","there4":"???","therefore":"???","Therefore":"???","Theta":"??","theta":"??","thetasym":"??","thetav":"??","thickapprox":"???","thicksim":"???","ThickSpace":"??????","ThinSpace":"???","thinsp":"???","thkap":"???","thksim":"???","THORN":"??","thorn":"??","tilde":"??","Tilde":"???","TildeEqual":"???","TildeFullEqual":"???","TildeTilde":"???","timesbar":"???","timesb":"???","times":"??","timesd":"???","tint":"???","toea":"???","topbot":"???","topcir":"???","top":"???","Topf":"????","topf":"????","topfork":"???","tosa":"???","tprime":"???","trade":"???","TRADE":"???","triangle":"???","triangledown":"???","triangleleft":"???","trianglelefteq":"???","triangleq":"???","triangleright":"???","trianglerighteq":"???","tridot":"???","trie":"???","triminus":"???","TripleDot":"???","triplus":"???","trisb":"???","tritime":"???","trpezium":"???","Tscr":"????","tscr":"????","TScy":"??","tscy":"??","TSHcy":"??","tshcy":"??","Tstrok":"??","tstrok":"??","twixt":"???","twoheadleftarrow":"???","twoheadrightarrow":"???","Uacute":"??","uacute":"??","uarr":"???","Uarr":"???","uArr":"???","Uarrocir":"???","Ubrcy":"??","ubrcy":"??","Ubreve":"??","ubreve":"??","Ucirc":"??","ucirc":"??","Ucy":"??","ucy":"??","udarr":"???","Udblac":"??","udblac":"??","udhar":"???","ufisht":"???","Ufr":"????","ufr":"????","Ugrave":"??","ugrave":"??","uHar":"???","uharl":"???","uharr":"???","uhblk":"???","ulcorn":"???","ulcorner":"???","ulcrop":"???","ultri":"???","Umacr":"??","umacr":"??","uml":"??","UnderBar":"_","UnderBrace":"???","UnderBracket":"???","UnderParenthesis":"???","Union":"???","UnionPlus":"???","Uogon":"??","uogon":"??","Uopf":"????","uopf":"????","UpArrowBar":"???","uparrow":"???","UpArrow":"???","Uparrow":"???","UpArrowDownArrow":"???","updownarrow":"???","UpDownArrow":"???","Updownarrow":"???","UpEquilibrium":"???","upharpoonleft":"???","upharpoonright":"???","uplus":"???","UpperLeftArrow":"???","UpperRightArrow":"???","upsi":"??","Upsi":"??","upsih":"??","Upsilon":"??","upsilon":"??","UpTeeArrow":"???","UpTee":"???","upuparrows":"???","urcorn":"???","urcorner":"???","urcrop":"???","Uring":"??","uring":"??","urtri":"???","Uscr":"????","uscr":"????","utdot":"???","Utilde":"??","utilde":"??","utri":"???","utrif":"???","uuarr":"???","Uuml":"??","uuml":"??","uwangle":"???","vangrt":"???","varepsilon":"??","varkappa":"??","varnothing":"???","varphi":"??","varpi":"??","varpropto":"???","varr":"???","vArr":"???","varrho":"??","varsigma":"??","varsubsetneq":"??????","varsubsetneqq":"??????","varsupsetneq":"??????","varsupsetneqq":"??????","vartheta":"??","vartriangleleft":"???","vartriangleright":"???","vBar":"???","Vbar":"???","vBarv":"???","Vcy":"??","vcy":"??","vdash":"???","vDash":"???","Vdash":"???","VDash":"???","Vdashl":"???","veebar":"???","vee":"???","Vee":"???","veeeq":"???","vellip":"???","verbar":"|","Verbar":"???","vert":"|","Vert":"???","VerticalBar":"???","VerticalLine":"|","VerticalSeparator":"???","VerticalTilde":"???","VeryThinSpace":"???","Vfr":"????","vfr":"????","vltri":"???","vnsub":"??????","vnsup":"??????","Vopf":"????","vopf":"????","vprop":"???","vrtri":"???","Vscr":"????","vscr":"????","vsubnE":"??????","vsubne":"??????","vsupnE":"??????","vsupne":"??????","Vvdash":"???","vzigzag":"???","Wcirc":"??","wcirc":"??","wedbar":"???","wedge":"???","Wedge":"???","wedgeq":"???","weierp":"???","Wfr":"????","wfr":"????","Wopf":"????","wopf":"????","wp":"???","wr":"???","wreath":"???","Wscr":"????","wscr":"????","xcap":"???","xcirc":"???","xcup":"???","xdtri":"???","Xfr":"????","xfr":"????","xharr":"???","xhArr":"???","Xi":"??","xi":"??","xlarr":"???","xlArr":"???","xmap":"???","xnis":"???","xodot":"???","Xopf":"????","xopf":"????","xoplus":"???","xotime":"???","xrarr":"???","xrArr":"???","Xscr":"????","xscr":"????","xsqcup":"???","xuplus":"???","xutri":"???","xvee":"???","xwedge":"???","Yacute":"??","yacute":"??","YAcy":"??","yacy":"??","Ycirc":"??","ycirc":"??","Ycy":"??","ycy":"??","yen":"??","Yfr":"????","yfr":"????","YIcy":"??","yicy":"??","Yopf":"????","yopf":"????","Yscr":"????","yscr":"????","YUcy":"??","yucy":"??","yuml":"??","Yuml":"??","Zacute":"??","zacute":"??","Zcaron":"??","zcaron":"??","Zcy":"??","zcy":"??","Zdot":"??","zdot":"??","zeetrf":"???","ZeroWidthSpace":"???","Zeta":"??","zeta":"??","zfr":"????","Zfr":"???","ZHcy":"??","zhcy":"??","zigrarr":"???","zopf":"????","Zopf":"???","Zscr":"????","zscr":"????","zwj":"???","zwnj":"???"}

},{}],7:[function(require,module,exports){
module.exports={"Aacute":"??","aacute":"??","Acirc":"??","acirc":"??","acute":"??","AElig":"??","aelig":"??","Agrave":"??","agrave":"??","amp":"&","AMP":"&","Aring":"??","aring":"??","Atilde":"??","atilde":"??","Auml":"??","auml":"??","brvbar":"??","Ccedil":"??","ccedil":"??","cedil":"??","cent":"??","copy":"??","COPY":"??","curren":"??","deg":"??","divide":"??","Eacute":"??","eacute":"??","Ecirc":"??","ecirc":"??","Egrave":"??","egrave":"??","ETH":"??","eth":"??","Euml":"??","euml":"??","frac12":"??","frac14":"??","frac34":"??","gt":">","GT":">","Iacute":"??","iacute":"??","Icirc":"??","icirc":"??","iexcl":"??","Igrave":"??","igrave":"??","iquest":"??","Iuml":"??","iuml":"??","laquo":"??","lt":"<","LT":"<","macr":"??","micro":"??","middot":"??","nbsp":"??","not":"??","Ntilde":"??","ntilde":"??","Oacute":"??","oacute":"??","Ocirc":"??","ocirc":"??","Ograve":"??","ograve":"??","ordf":"??","ordm":"??","Oslash":"??","oslash":"??","Otilde":"??","otilde":"??","Ouml":"??","ouml":"??","para":"??","plusmn":"??","pound":"??","quot":"\"","QUOT":"\"","raquo":"??","reg":"??","REG":"??","sect":"??","shy":"??","sup1":"??","sup2":"??","sup3":"??","szlig":"??","THORN":"??","thorn":"??","times":"??","Uacute":"??","uacute":"??","Ucirc":"??","ucirc":"??","Ugrave":"??","ugrave":"??","uml":"??","Uuml":"??","uuml":"??","Yacute":"??","yacute":"??","yen":"??","yuml":"??"}

},{}],8:[function(require,module,exports){
module.exports={"amp":"&","apos":"'","gt":">","lt":"<","quot":"\""}

},{}],9:[function(require,module,exports){

},{}],10:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Madara = void 0;
const _1 = require(".");
const models_1 = require("../models");
class Madara extends _1.Source {
    constructor() {
        super(...arguments);
        /**
         * The path that precedes a manga page not including the base URL.
         * Eg. for https://www.webtoon.xyz/read/limit-breaker/ it would be 'read'.
         * Used in all functions.
         */
        this.sourceTraversalPathName = 'manga';
        /**
         * By default, the homepage of a Madara is not its true homepage.
         * Accessing the site directory and sorting by the latest title allows
         * functions to step through the multiple pages easier, without a lot of custom
         * logic for each source.
         *
         * This variable holds the latter half of the website path which is required to reach the
         * directory page.
         * Eg. 'webtoons' for https://www.webtoon.xyz/webtoons/?m_orderby=latest
         */
        this.homePage = 'manga';
        /**
         * Some Madara sources have a different selector which is required in order to parse
         * out the popular manga. This defaults to the most common selector
         * but can be overridden by other sources which need it.
         */
        this.popularMangaSelector = "div.page-item-detail";
        /**
         * Much like {@link popularMangaSelector} this will default to the most used CheerioJS
         * selector to extract URLs from popular manga. This is available to be overridden.
         */
        this.popularMangaUrlSelector = "div.post-title a";
        /**
         * Different Madara sources might have a slightly different selector which is required to parse out
         * each manga object while on a search result page. This is the selector
         * which is looped over. This may be overridden if required.
         */
        this.searchMangaSelector = "div.c-tabs-item__content";
    }
    parseDate(dateString) {
        // Primarily we see dates for the format: "1 day ago" or "16 Apr 2020"
        let dateStringModified = dateString.replace('day', 'days').replace('month', 'months').replace('hour', 'hours');
        return new Date(this.convertTime(dateStringModified));
    }
    getMangaDetails(mangaId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${this.baseUrl}/${this.sourceTraversalPathName}/${mangaId}`,
                method: 'GET'
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let numericId = $('a.wp-manga-action-button').attr('data-post');
            let title = $('div.post-title h1').first().text().replace(/NEW/, '').replace('\\n', '').trim();
            let author = $('div.author-content').first().text().replace("\\n", '').trim();
            let artist = $('div.artist-content').first().text().replace("\\n", '').trim();
            let summary = $('p', $('div.description-summary')).text();
            let image = (_a = $('div.summary_image img').first().attr('data-src')) !== null && _a !== void 0 ? _a : '';
            let rating = $('span.total_votes').text().replace('Your Rating', '');
            let isOngoing = $('div.summary-content').text().toLowerCase().trim() == "ongoing";
            let genres = [];
            for (let obj of $('div.genres-content a').toArray()) {
                let genre = $(obj).text();
                genres.push(createTag({ label: genre, id: genre }));
            }
            // If we cannot parse out the data-id for this title, we cannot complete subsequent requests
            if (!numericId) {
                throw (`Could not parse out the data-id for ${mangaId} - This method might need overridden in the implementing source`);
            }
            return createManga({
                id: numericId,
                titles: [title],
                image: image,
                author: author,
                artist: artist,
                desc: summary,
                status: isOngoing ? models_1.MangaStatus.ONGOING : models_1.MangaStatus.COMPLETED,
                rating: Number(rating)
            });
        });
    }
    getChapters(mangaId) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${this.baseUrl}/wp-admin/admin-ajax.php`,
                method: 'POST',
                headers: {
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "referer": this.baseUrl
                },
                data: `action=manga_get_chapters&manga=${mangaId}`
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let chapters = [];
            // Capture the manga title, as this differs from the ID which this function is fed
            let realTitle = (_a = $('a', $('li.wp-manga-chapter  ').first()).attr('href')) === null || _a === void 0 ? void 0 : _a.replace(`${this.baseUrl}/${this.sourceTraversalPathName}/`, '').replace(/\/chapter.*/, '');
            if (!realTitle) {
                throw (`Failed to parse the human-readable title for ${mangaId}`);
            }
            // For each available chapter..
            for (let obj of $('li.wp-manga-chapter  ').toArray()) {
                let id = (_b = $('a', $(obj)).first().attr('href')) === null || _b === void 0 ? void 0 : _b.replace(`${this.baseUrl}/${this.sourceTraversalPathName}/${realTitle}/`, '').replace('/', '');
                let chapNum = Number($('a', $(obj)).first().text().replace(/\D/g, ''));
                let releaseDate = $('i', $(obj)).text();
                if (!id) {
                    throw (`Could not parse out ID when getting chapters for ${mangaId}`);
                }
                chapters.push({
                    id: id,
                    mangaId: realTitle,
                    langCode: this.languageCode,
                    chapNum: chapNum,
                    time: this.parseDate(releaseDate)
                });
            }
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${this.baseUrl}/${this.sourceTraversalPathName}/${mangaId}/${chapterId}`,
                method: 'GET',
                cookies: [createCookie({ name: 'wpmanga-adault', value: "1", domain: this.baseUrl })]
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let pages = [];
            for (let obj of $('div.page-break').toArray()) {
                let page = $('img', $(obj)).attr('data-src');
                if (!page) {
                    throw (`Could not parse page for ${mangaId}/${chapterId}`);
                }
                pages.push(page.replace(/[\t|\n]/g, ''));
            }
            return createChapterDetails({
                id: chapterId,
                mangaId: mangaId,
                pages: pages,
                longStrip: false
            });
        });
    }
    searchRequest(query, metadata) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            // If we're supplied a page that we should be on, set our internal reference to that page. Otherwise, we start from page 0.
            let page = (_a = metadata.page) !== null && _a !== void 0 ? _a : 0;
            const request = createRequestObject({
                url: `${this.baseUrl}/page/${page}?s=${query.title}&post_type=wp-manga`,
                method: 'GET',
                cookies: [createCookie({ name: 'wpmanga-adault', value: "1", domain: this.baseUrl })]
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let results = [];
            for (let obj of $(this.searchMangaSelector).toArray()) {
                let id = (_b = $('a', $(obj)).attr('href')) === null || _b === void 0 ? void 0 : _b.replace(`${this.baseUrl}/${this.sourceTraversalPathName}/`, '').replace('/', '');
                let title = createIconText({ text: (_c = $('a', $(obj)).attr('title')) !== null && _c !== void 0 ? _c : '' });
                let image = $('img', $(obj)).attr('data-src');
                if (!id || !title.text || !image) {
                    // Something went wrong with our parsing, return a detailed error
                    throw (`Failed to parse searchResult for ${this.baseUrl} using ${this.searchMangaSelector} as a loop selector`);
                }
                results.push(createMangaTile({
                    id: id,
                    title: title,
                    image: image
                }));
            }
            // Check to see whether we need to navigate to the next page or not
            if ($('div.wp-pagenavi')) {
                // There ARE multiple pages available, now we must check if we've reached the last or not
                let pageContext = $('span.pages').text().match(/(\d)/g);
                if (!pageContext || !pageContext[0] || !pageContext[1]) {
                    throw (`Failed to parse whether this search has more pages or not. This source may need to have it's searchRequest method overridden`);
                }
                // Because we used the \d regex, we can safely cast each capture to a numeric value
                if (Number(pageContext[1]) != Number(pageContext[2])) {
                    metadata.page = page + 1;
                }
                else {
                    metadata.page = undefined;
                }
            }
            return createPagedResults({
                results: results,
                metadata: metadata.page !== undefined ? metadata : undefined
            });
        });
    }
    /**
     * It's hard to capture a default logic for homepages. So for madara sources,
     * instead we've provided a homesection reader for the base_url/webtoons/ endpoint.
     * This supports having paged views in almost all cases.
     * @param sectionCallback
     */
    getHomePageSections(sectionCallback) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let section = createHomeSection({ id: "latest", title: "Latest Titles" });
            sectionCallback(section);
            // Parse all of the available data
            const request = createRequestObject({
                url: `${this.baseUrl}/${this.homePage}/?m_orderby=latest`,
                method: 'GET',
                cookies: [createCookie({ name: 'wpmanga-adault', value: "1", domain: this.baseUrl })]
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let items = [];
            for (let obj of $('div.manga').toArray()) {
                let image = $('img', $(obj)).attr('data-src');
                let title = $('a', $('h3.h5', $(obj))).text();
                let id = (_a = $('a', $('h3.h5', $(obj))).attr('href')) === null || _a === void 0 ? void 0 : _a.replace(`${this.baseUrl}/${this.sourceTraversalPathName}/`, '').replace('/', '');
                if (!id || !title || !image) {
                    throw (`Failed to parse homepage sections for ${this.baseUrl}/${this.sourceTraversalPathName}/`);
                }
                items.push(createMangaTile({
                    id: id,
                    title: createIconText({ text: title }),
                    image: image
                }));
            }
            section.items = items;
            sectionCallback(section);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // We only have one homepage section ID, so we don't need to worry about handling that any
            let page = (_a = metadata.page) !== null && _a !== void 0 ? _a : 0; // Default to page 0
            const request = createRequestObject({
                url: `${this.baseUrl}/${this.homePage}/page/${page}/?m_orderby=latest`,
                method: 'GET',
                cookies: [createCookie({ name: 'wpmanga-adault', value: "1", domain: this.baseUrl })]
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let items = [];
            for (let obj of $('div.manga').toArray()) {
                let image = $('img', $(obj)).attr('data-src');
                let title = $('a', $('h3.h5', $(obj))).text();
                let id = (_b = $('a', $('h3.h5', $(obj))).attr('href')) === null || _b === void 0 ? void 0 : _b.replace(`${this.baseUrl}/${this.sourceTraversalPathName}/`, '').replace('/', '');
                if (!id || !title || !image) {
                    throw (`Failed to parse homepage sections for ${this.baseUrl}/${this.sourceTraversalPathName}`);
                }
                items.push(createMangaTile({
                    id: id,
                    title: createIconText({ text: title }),
                    image: image
                }));
            }
            // Set up to go to the next page. If we are on the last page, remove the logic.
            metadata.page = page + 1;
            if (!$('a.last')) {
                metadata = undefined;
            }
            return createPagedResults({
                results: items,
                metadata: metadata
            });
        });
    }
}
exports.Madara = Madara;

},{".":12,"../models":33}],11:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Source = void 0;
class Source {
    constructor(cheerio) {
        // <-----------        OPTIONAL METHODS        -----------> //
        /**
         * Manages the ratelimits and the number of requests that can be done per second
         * This is also used to fetch pages when a chapter is downloading
         */
        this.requestManager = createRequestManager({
            requestsPerSecond: 2.5,
            requestTimeout: 5000
        });
        this.cheerio = cheerio;
    }
    /**
     * (OPTIONAL METHOD) This function is called when ANY request is made by the Paperback Application out to the internet.
     * By modifying the parameter and returning it, the user can inject any additional headers, cookies, or anything else
     * a source may need to load correctly.
     * The most common use of this function is to add headers to image requests, since you cannot directly access these requests through
     * the source implementation itself.
     *
     * NOTE: This does **NOT** influence any requests defined in the source implementation. This function will only influence requests
     * which happen behind the scenes and are not defined in your source.
     */
    globalRequestHeaders() { return {}; }
    globalRequestCookies() { return []; }
    /**
     * (OPTIONAL METHOD) Given a manga ID, return a URL which Safari can open in a browser to display.
     * @param mangaId
     */
    getMangaShareUrl(mangaId) { return null; }
    /**
     * If a source is secured by Cloudflare, this method should be filled out.
     * By returning a request to the website, this source will attempt to create a session
     * so that the source can load correctly.
     * Usually the {@link Request} url can simply be the base URL to the source.
     */
    getCloudflareBypassRequest() { return null; }
    /**
     * (OPTIONAL METHOD) A function which communicates with a given source, and returns a list of all possible tags which the source supports.
     * These tags are generic and depend on the source. They could be genres such as 'Isekai, Action, Drama', or they can be
     * listings such as 'Completed, Ongoing'
     * These tags must be tags which can be used in the {@link searchRequest} function to augment the searching capability of the application
     */
    getTags() { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) A function which should scan through the latest updates section of a website, and report back with a list of IDs which have been
     * updated BEFORE the supplied timeframe.
     * This function may have to scan through multiple pages in order to discover the full list of updated manga.
     * Because of this, each batch of IDs should be returned with the mangaUpdatesFoundCallback. The IDs which have been reported for
     * one page, should not be reported again on another page, unless the relevent ID has been detected again. You do not want to persist
     * this internal list between {@link Request} calls
     * @param mangaUpdatesFoundCallback A callback which is used to report a list of manga IDs back to the API
     * @param time This function should find all manga which has been updated between the current time, and this parameter's reported time.
     *             After this time has been passed, the system should stop parsing and return
     */
    filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) A function which should readonly allf the available homepage sections for a given source, and return a {@link HomeSection} object.
     * The sectionCallback is to be used for each given section on the website. This may include a 'Latest Updates' section, or a 'Hot Manga' section.
     * It is recommended that before anything else in your source, you first use this sectionCallback and send it {@link HomeSection} objects
     * which are blank, and have not had any requests done on them just yet. This way, you provide the App with the sections to render on screen,
     * which then will be populated with each additional sectionCallback method called. This is optional, but recommended.
     * @param sectionCallback A callback which is run for each independant HomeSection.
     */
    getHomePageSections(sectionCallback) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) This function will take a given homepageSectionId and metadata value, and with this information, should return
     * all of the manga tiles supplied for the given state of parameters. Most commonly, the metadata value will contain some sort of page information,
     * and this request will target the given page. (Incrementing the page in the response so that the next call will return relevent data)
     * @param homepageSectionId The given ID to the homepage defined in {@link getHomePageSections} which this method is to readonly moreata about
     * @param metadata This is a metadata parameter which is filled our in the {@link getHomePageSections}'s return
     * function. Afterwards, if the metadata value returned in the {@link PagedResults} has been modified, the modified version
     * will be supplied to this function instead of the origional {@link getHomePageSections}'s version.
     * This is useful for keeping track of which page a user is on, pagnating to other pages as ViewMore is called multiple times.
     */
    getViewMoreItems(homepageSectionId, metadata) { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) This function is to return the entire library of a manga website, page by page.
     * If there is an additional page which needs to be called, the {@link PagedResults} value should have it's metadata filled out
     * with information needed to continue pulling information from this website.
     * Note that if the metadata value of {@link PagedResults} is undefined, this method will not continue to run when the user
     * attempts to readonly morenformation
     * @param metadata Identifying information as to what the source needs to call in order to readonly theext batch of data
     * of the directory. Usually this is a page counter.
     */
    getWebsiteMangaDirectory(metadata) { return Promise.resolve(null); }
    // <-----------        PROTECTED METHODS        -----------> //
    // Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
    convertTime(timeAgo) {
        var _a;
        let time;
        let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
        trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
        if (timeAgo.includes('minutes')) {
            time = new Date(Date.now() - trimmed * 60000);
        }
        else if (timeAgo.includes('hours')) {
            time = new Date(Date.now() - trimmed * 3600000);
        }
        else if (timeAgo.includes('days')) {
            time = new Date(Date.now() - trimmed * 86400000);
        }
        else if (timeAgo.includes('year') || timeAgo.includes('years')) {
            time = new Date(Date.now() - trimmed * 31556952000);
        }
        else {
            time = new Date(Date.now());
        }
        return time;
    }
}
exports.Source = Source;

},{}],12:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);
__exportStar(require("./Madara"), exports);

},{"./Madara":10,"./Source":11}],13:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);
__exportStar(require("./APIWrapper"), exports);

},{"./APIWrapper":9,"./base":12,"./models":33}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],15:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],16:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],17:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCode = void 0;
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["UNKNOWN"] = "_unknown";
    LanguageCode["BENGALI"] = "bd";
    LanguageCode["BULGARIAN"] = "bg";
    LanguageCode["BRAZILIAN"] = "br";
    LanguageCode["CHINEESE"] = "cn";
    LanguageCode["CZECH"] = "cz";
    LanguageCode["GERMAN"] = "de";
    LanguageCode["DANISH"] = "dk";
    LanguageCode["ENGLISH"] = "gb";
    LanguageCode["SPANISH"] = "es";
    LanguageCode["FINNISH"] = "fi";
    LanguageCode["FRENCH"] = "fr";
    LanguageCode["WELSH"] = "gb";
    LanguageCode["GREEK"] = "gr";
    LanguageCode["CHINEESE_HONGKONG"] = "hk";
    LanguageCode["HUNGARIAN"] = "hu";
    LanguageCode["INDONESIAN"] = "id";
    LanguageCode["ISRELI"] = "il";
    LanguageCode["INDIAN"] = "in";
    LanguageCode["IRAN"] = "ir";
    LanguageCode["ITALIAN"] = "it";
    LanguageCode["JAPANESE"] = "jp";
    LanguageCode["KOREAN"] = "kr";
    LanguageCode["LITHUANIAN"] = "lt";
    LanguageCode["MONGOLIAN"] = "mn";
    LanguageCode["MEXIAN"] = "mx";
    LanguageCode["MALAY"] = "my";
    LanguageCode["DUTCH"] = "nl";
    LanguageCode["NORWEGIAN"] = "no";
    LanguageCode["PHILIPPINE"] = "ph";
    LanguageCode["POLISH"] = "pl";
    LanguageCode["PORTUGUESE"] = "pt";
    LanguageCode["ROMANIAN"] = "ro";
    LanguageCode["RUSSIAN"] = "ru";
    LanguageCode["SANSKRIT"] = "sa";
    LanguageCode["SAMI"] = "si";
    LanguageCode["THAI"] = "th";
    LanguageCode["TURKISH"] = "tr";
    LanguageCode["UKRAINIAN"] = "ua";
    LanguageCode["VIETNAMESE"] = "vn";
})(LanguageCode = exports.LanguageCode || (exports.LanguageCode = {}));

},{}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],20:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],21:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],22:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],23:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],24:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],25:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],26:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],27:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],28:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],29:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = void 0;
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Five types are available: blue, green, grey, yellow and red, the default one is blue.
 * Common colors are red for (Broken), yellow for (+18), grey for (Country-Proof)
 */
var TagType;
(function (TagType) {
    TagType["BLUE"] = "default";
    TagType["GREEN"] = "success";
    TagType["GREY"] = "info";
    TagType["YELLOW"] = "warning";
    TagType["RED"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],31:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],32:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],33:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Chapter"), exports);
__exportStar(require("./ChapterDetails"), exports);
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./Manga"), exports);
__exportStar(require("./MangaTile"), exports);
__exportStar(require("./RequestObject"), exports);
__exportStar(require("./SearchRequest"), exports);
__exportStar(require("./TagSection"), exports);
__exportStar(require("./SourceTag"), exports);
__exportStar(require("./Languages"), exports);
__exportStar(require("./Constants"), exports);
__exportStar(require("./MangaUpdate"), exports);
__exportStar(require("./PagedResults"), exports);
__exportStar(require("./ResponseObject"), exports);
__exportStar(require("./RequestManager"), exports);
__exportStar(require("./RequestHeaders"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./TrackObject"), exports);
__exportStar(require("./OAuth"), exports);

},{"./Chapter":14,"./ChapterDetails":15,"./Constants":16,"./HomeSection":17,"./Languages":18,"./Manga":19,"./MangaTile":20,"./MangaUpdate":21,"./OAuth":22,"./PagedResults":23,"./RequestHeaders":24,"./RequestManager":25,"./RequestObject":26,"./ResponseObject":27,"./SearchRequest":28,"./SourceInfo":29,"./SourceTag":30,"./TagSection":31,"./TrackObject":32}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HentaiHere = exports.HentaiHereInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const HentaiHereParser_1 = require("./HentaiHereParser");
const HH_DOMAIN = 'https://hentaihere.com';
const method = 'GET';
exports.HentaiHereInfo = {
    version: '1.0.4',
    name: 'HentaiHere',
    icon: 'icon.png',
    author: 'Netsky',
    authorWebsite: 'https://github.com/TheNetsky',
    description: 'Extension that pulls manga from HentaiHere',
    hentaiSource: false,
    websiteBaseURL: HH_DOMAIN,
    sourceTags: [
        {
            text: "18+",
            type: paperback_extensions_common_1.TagType.YELLOW
        }
    ]
};
class HentaiHere extends paperback_extensions_common_1.Source {
    getMangaShareUrl(mangaId) { return `${HH_DOMAIN}/m/${mangaId}`; }
    ;
    async getMangaDetails(mangaId) {
        const request = createRequestObject({
            url: `${HH_DOMAIN}/m/`,
            method,
            param: mangaId,
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        return HentaiHereParser_1.parseMangaDetails($, mangaId);
    }
    async getChapters(mangaId) {
        const request = createRequestObject({
            url: `${HH_DOMAIN}/m/`,
            method,
            param: mangaId,
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        return HentaiHereParser_1.parseChapters($, mangaId);
    }
    async getChapterDetails(mangaId, chapterId) {
        const request = createRequestObject({
            url: `${HH_DOMAIN}/m/${mangaId}/${chapterId}/1`,
            method: method,
        });
        const response = await this.requestManager.schedule(request, 1);
        return HentaiHereParser_1.parseChapterDetails(response.data, mangaId, chapterId);
    }
    async getHomePageSections(sectionCallback) {
        const section1 = createHomeSection({ id: 'staff_pick', title: 'Staff Pick', view_more: true });
        const section2 = createHomeSection({ id: 'recently_added', title: 'Recently Added', view_more: true });
        const section3 = createHomeSection({ id: 'trending', title: 'Trending', view_more: true });
        const sections = [section1, section2, section3];
        const request = createRequestObject({
            url: HH_DOMAIN,
            method,
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        HentaiHereParser_1.parseHomeSections($, sections, sectionCallback);
    }
    async getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
        let param = '';
        switch (homepageSectionId) {
            case "staff_pick":
                param = `/directory/staff-pick?page=${page}`;
                break;
            case "recently_added":
                param = `/directory/newest?page=${page}`;
                break;
            case "trending":
                param = `/directory/trending?page=${page}`;
                break;
            default:
                return Promise.resolve(null);
                ;
        }
        const request = createRequestObject({
            url: HH_DOMAIN,
            method,
            param
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const manga = HentaiHereParser_1.parseViewMore($);
        metadata = !HentaiHereParser_1.isLastPage($) ? { page: page + 1 } : undefined;
        return createPagedResults({
            results: manga,
            metadata,
        });
    }
    async searchRequest(query, metadata) {
        var _a;
        let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
        const search = HentaiHereParser_1.generateSearch(query);
        const request = createRequestObject({
            url: `${HH_DOMAIN}/search?s=`,
            method,
            param: `${search}&page=${page}`
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const manga = HentaiHereParser_1.parseSearch($);
        metadata = !HentaiHereParser_1.isLastPage($) ? { page: page + 1 } : undefined;
        return createPagedResults({
            results: manga,
            metadata
        });
    }
    async getTags() {
        const request = createRequestObject({
            url: `${HH_DOMAIN}/tags/category`,
            method,
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        return HentaiHereParser_1.parseTags($);
    }
}
exports.HentaiHere = HentaiHere;

},{"./HentaiHereParser":35,"paperback-extensions-common":13}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastPage = exports.parseTags = exports.parseViewMore = exports.parseSearch = exports.generateSearch = exports.parseHomeSections = exports.parseChapterDetails = exports.parseChapters = exports.parseMangaDetails = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const entities = require("entities"); //Import package for decoding HTML entities
const HH_DOMAIN = 'https://hentaihere.com';
exports.parseMangaDetails = ($, mangaId) => {
    var _a, _b, _c, _d, _e;
    const titles = [];
    const title = $("h4 > a").first().text().trim();
    if (!title)
        throw new Error("Unable to parse title!"); //If not title is present, throw error!
    titles.push(decodeHTMLEntity(title));
    const artist = $("span:contains(Artist:)").next().text().trim(); //Only displays first artist, can't find any hentai that had multiple artists lol
    const image = (_a = $("img", "div#cover").attr('src')) !== null && _a !== void 0 ? _a : "https://i.imgur.com/GYUxEX8.png"; //Super cool fallback image, since the app doesn't have one yet.
    //Content Tags
    const arrayTags = [];
    for (const tag of $("a.tagbutton", $("span:contains(Content:)").parent()).toArray()) {
        const label = $(tag).text().trim();
        const id = encodeURI((_c = (_b = $(tag).attr("href")) === null || _b === void 0 ? void 0 : _b.replace(`/search/`, "").trim()) !== null && _c !== void 0 ? _c : "");
        if (!id || !label)
            continue;
        arrayTags.push({ id: id, label: label });
    }
    //Category Tags
    for (const tag of $("a.tagbutton", $("span:contains(Catergory:)").parent()).toArray()) {
        const label = $(tag).text().trim();
        const id = encodeURI((_e = (_d = $(tag).attr("href")) === null || _d === void 0 ? void 0 : _d.replace(`/search/`, "").trim()) !== null && _e !== void 0 ? _e : "");
        if (!id || !label)
            continue;
        arrayTags.push({ id: id, label: label });
    }
    const tagSections = [createTagSection({ id: '0', label: 'genres', tags: arrayTags.map(x => createTag(x)) })];
    const description = decodeHTMLEntity($("span:contains(Brief Summary:)").parent().text().replace($("span:contains(Brief Summary:)").text(), "").trim());
    const customDescription = `Description \n${description == "" ? "No description available!" : description}\n\nTags \n${arrayTags.map(t => t.label).join(", ")}`;
    const rawStatus = $("span:contains(Status:)").next().text().trim();
    let status = paperback_extensions_common_1.MangaStatus.ONGOING;
    switch (rawStatus.toUpperCase()) {
        case 'ONGOING':
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
            break;
        case 'COMPLETED':
            status = paperback_extensions_common_1.MangaStatus.COMPLETED;
            break;
        default:
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
            break;
    }
    return createManga({
        id: mangaId,
        titles: titles,
        image,
        rating: 0,
        status: status,
        author: artist,
        artist: artist,
        tags: tagSections,
        desc: customDescription,
        //hentai: true
        hentai: false //MangaDex down
    });
};
exports.parseChapters = ($, mangaId) => {
    var _a;
    const chapters = [];
    for (const c of $("li.sub-chp", "ul.arf-list").toArray()) {
        const title = decodeHTMLEntity($("span.pull-left", c).text().replace($("span.pull-left i.text-muted", c).text(), "").trim());
        const rawID = (_a = $("a", c).attr('href')) !== null && _a !== void 0 ? _a : "";
        const id = /m\/[A-z0-9]+\/(\d+)/.test(rawID) ? rawID.match(/m\/[A-z0-9]+\/(\d+)/)[1] : "";
        if (id == "")
            continue;
        const date = new Date(Date.now() - 2208986640000); // *Lennyface* 
        const chapterNumber = isNaN(Number(id)) ? 0 : id;
        chapters.push(createChapter({
            id: id,
            mangaId,
            name: title,
            langCode: paperback_extensions_common_1.LanguageCode.ENGLISH,
            chapNum: Number(chapterNumber),
            time: date,
        }));
    }
    return chapters;
};
exports.parseChapterDetails = (data, mangaId, chapterId) => {
    var _a, _b;
    const pages = [];
    let obj = (_b = (_a = /var rff_imageList = (.*);/.exec(data)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : ""; //Get the data else return null.
    if (obj == "")
        throw new Error("Unable to parse chapter details!"); //If null, throw error, else parse data to json.
    obj = JSON.parse(obj);
    for (const i of obj) {
        const page = "https://hentaicdn.com/hentai" + i;
        pages.push(page);
    }
    const chapterDetails = createChapterDetails({
        id: chapterId,
        mangaId: mangaId,
        pages: pages,
        longStrip: false
    });
    return chapterDetails;
};
exports.parseHomeSections = ($, sections, sectionCallback) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    for (const section of sections)
        sectionCallback(section);
    //Staff Pick
    const staffPick = [];
    for (const manga of $("div.item", "div#staffpick").toArray()) {
        const id = (_a = $("a", manga).attr('href')) === null || _a === void 0 ? void 0 : _a.replace(`${HH_DOMAIN}/m/`, "").trim();
        const image = (_b = $("img", manga).attr('src')) !== null && _b !== void 0 ? _b : "";
        const title = decodeHTMLEntity((_d = String((_c = $("img", manga).attr('alt')) === null || _c === void 0 ? void 0 : _c.trim())) !== null && _d !== void 0 ? _d : "");
        const subtitle = $("b.text-danger", manga).text();
        if (!id || !title)
            continue;
        staffPick.push(createMangaTile({
            id: id,
            image: image,
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    sections[0].items = staffPick;
    sectionCallback(sections[0]);
    //Recently Added
    const recentlyAdded = [];
    for (const manga of $($("div.row.row-sm")[1]).children("div").toArray()) {
        const id = (_e = $("a", manga).attr('href')) === null || _e === void 0 ? void 0 : _e.replace(`${HH_DOMAIN}/m/`, "").trim();
        const image = (_f = $("img", manga).attr('src')) !== null && _f !== void 0 ? _f : "";
        const title = decodeHTMLEntity(String((_h = (_g = $("img", manga).attr('alt')) === null || _g === void 0 ? void 0 : _g.trim()) !== null && _h !== void 0 ? _h : ""));
        if (!id || !title)
            continue;
        recentlyAdded.push(createMangaTile({
            id: id,
            image: image,
            title: createIconText({ text: decodeHTMLEntity(title) }),
        }));
    }
    sections[1].items = recentlyAdded;
    sectionCallback(sections[1]);
    //Trending
    const Trending = [];
    for (const manga of $("li.list-group-item", "ul.list-group").toArray()) {
        const id = (_j = $("a", manga).attr('href')) === null || _j === void 0 ? void 0 : _j.split(`/m/`)[1]; //Method required since authors pages are included in the list, but don't use /m/
        const image = (_k = $("img", manga).attr('src')) !== null && _k !== void 0 ? _k : "";
        const title = decodeHTMLEntity((_m = String((_l = $("img", manga).attr('alt')) === null || _l === void 0 ? void 0 : _l.trim())) !== null && _m !== void 0 ? _m : "");
        if (!id || !title)
            continue;
        Trending.push(createMangaTile({
            id: id,
            image: image,
            title: createIconText({ text: decodeHTMLEntity(title) }),
        }));
    }
    sections[2].items = Trending;
    sectionCallback(sections[2]);
    for (const section of sections)
        sectionCallback(section);
};
exports.generateSearch = (query) => {
    var _a;
    let search = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(search);
};
exports.parseSearch = ($) => {
    var _a, _b, _c;
    const mangas = [];
    for (const obj of $("div.item", "div.row.row-sm").toArray()) {
        const id = (_a = $("a", obj).attr('href')) === null || _a === void 0 ? void 0 : _a.replace(`${HH_DOMAIN}/m/`, "").trim();
        const image = (_b = $("img", obj).attr('src')) !== null && _b !== void 0 ? _b : "";
        const title = decodeHTMLEntity(String((_c = $("img", obj).attr('alt')) === null || _c === void 0 ? void 0 : _c.trim()));
        const subtitle = $("b.text-danger", obj).text();
        if (!id || !title)
            continue;
        mangas.push(createMangaTile({
            id,
            image: image,
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }
    return mangas;
};
exports.parseViewMore = ($) => {
    var _a, _b, _c;
    const manga = [];
    const collectedIds = [];
    for (const obj of $("div.item", "div.row.row-sm").toArray()) {
        const id = (_a = $("a", obj).attr('href')) === null || _a === void 0 ? void 0 : _a.replace(`${HH_DOMAIN}/m/`, "").trim();
        const image = (_b = $("img", obj).attr('src')) !== null && _b !== void 0 ? _b : "";
        const title = decodeHTMLEntity(String((_c = $("img", obj).attr('alt')) === null || _c === void 0 ? void 0 : _c.trim()));
        const subtitle = $("b.text-danger", obj).text();
        if (!id || !title)
            continue;
        if (!collectedIds.includes(id)) {
            manga.push(createMangaTile({
                id,
                image: image,
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: subtitle }),
            }));
            collectedIds.push(id);
        }
    }
    return manga;
};
exports.parseTags = ($) => {
    var _a, _b;
    const arrayTags = [];
    for (const tag of $("div.list-group", "div.col-xs-12").toArray()) {
        const label = $("span.clear > span", tag).text().trim();
        const id = (_b = (_a = $("a.list-group-item", tag).attr('href')) === null || _a === void 0 ? void 0 : _a.replace(`${HH_DOMAIN}/search/`, "").trim()) !== null && _b !== void 0 ? _b : "";
        if (!id || !label)
            continue;
        arrayTags.push({ id: id, label: label });
    }
    const tagSections = [createTagSection({ id: '0', label: 'genres', tags: arrayTags.map(x => createTag(x)) })];
    return tagSections;
};
exports.isLastPage = ($) => {
    let isLast = false;
    const pages = [];
    for (const page of $("li", "ul.pagination").toArray()) {
        const p = Number($(page).text().trim());
        if (isNaN(p))
            continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("li.active").text().trim());
    if (currentPage >= lastPage)
        isLast = true;
    return isLast;
};
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};

},{"entities":4,"paperback-extensions-common":13}]},{},[34])(34)
});
