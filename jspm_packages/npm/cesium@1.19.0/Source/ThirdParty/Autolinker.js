/* */ 
"format cjs";
(function(process) {
  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      define([], function() {
        return (root['Autolinker'] = factory());
      });
    } else if (typeof exports === 'object') {
      module.exports = factory();
    } else {
      root['Autolinker'] = factory();
    }
  }(this, function() {
    var Autolinker = function(cfg) {
      Autolinker.Util.assign(this, cfg);
      var hashtag = this.hashtag;
      if (hashtag !== false && hashtag !== 'twitter' && hashtag !== 'facebook') {
        throw new Error("invalid `hashtag` cfg - see docs");
      }
    };
    Autolinker.prototype = {
      constructor: Autolinker,
      urls: true,
      email: true,
      twitter: true,
      phone: true,
      hashtag: false,
      newWindow: true,
      stripPrefix: true,
      truncate: undefined,
      className: "",
      htmlParser: undefined,
      matchParser: undefined,
      tagBuilder: undefined,
      link: function(textOrHtml) {
        var htmlParser = this.getHtmlParser(),
            htmlNodes = htmlParser.parse(textOrHtml),
            anchorTagStackCount = 0,
            resultHtml = [];
        for (var i = 0,
            len = htmlNodes.length; i < len; i++) {
          var node = htmlNodes[i],
              nodeType = node.getType(),
              nodeText = node.getText();
          if (nodeType === 'element') {
            if (node.getTagName() === 'a') {
              if (!node.isClosing()) {
                anchorTagStackCount++;
              } else {
                anchorTagStackCount = Math.max(anchorTagStackCount - 1, 0);
              }
            }
            resultHtml.push(nodeText);
          } else if (nodeType === 'entity' || nodeType === 'comment') {
            resultHtml.push(nodeText);
          } else {
            if (anchorTagStackCount === 0) {
              var linkifiedStr = this.linkifyStr(nodeText);
              resultHtml.push(linkifiedStr);
            } else {
              resultHtml.push(nodeText);
            }
          }
        }
        return resultHtml.join("");
      },
      linkifyStr: function(str) {
        return this.getMatchParser().replace(str, this.createMatchReturnVal, this);
      },
      createMatchReturnVal: function(match) {
        var replaceFnResult;
        if (this.replaceFn) {
          replaceFnResult = this.replaceFn.call(this, this, match);
        }
        if (typeof replaceFnResult === 'string') {
          return replaceFnResult;
        } else if (replaceFnResult === false) {
          return match.getMatchedText();
        } else if (replaceFnResult instanceof Autolinker.HtmlTag) {
          return replaceFnResult.toAnchorString();
        } else {
          var tagBuilder = this.getTagBuilder(),
              anchorTag = tagBuilder.build(match);
          return anchorTag.toAnchorString();
        }
      },
      getHtmlParser: function() {
        var htmlParser = this.htmlParser;
        if (!htmlParser) {
          htmlParser = this.htmlParser = new Autolinker.htmlParser.HtmlParser();
        }
        return htmlParser;
      },
      getMatchParser: function() {
        var matchParser = this.matchParser;
        if (!matchParser) {
          matchParser = this.matchParser = new Autolinker.matchParser.MatchParser({
            urls: this.urls,
            email: this.email,
            twitter: this.twitter,
            phone: this.phone,
            hashtag: this.hashtag,
            stripPrefix: this.stripPrefix
          });
        }
        return matchParser;
      },
      getTagBuilder: function() {
        var tagBuilder = this.tagBuilder;
        if (!tagBuilder) {
          tagBuilder = this.tagBuilder = new Autolinker.AnchorTagBuilder({
            newWindow: this.newWindow,
            truncate: this.truncate,
            className: this.className
          });
        }
        return tagBuilder;
      }
    };
    Autolinker.link = function(textOrHtml, options) {
      var autolinker = new Autolinker(options);
      return autolinker.link(textOrHtml);
    };
    Autolinker.match = {};
    Autolinker.htmlParser = {};
    Autolinker.matchParser = {};
    Autolinker.Util = {
      abstractMethod: function() {
        throw "abstract";
      },
      trimRegex: /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
      assign: function(dest, src) {
        for (var prop in src) {
          if (src.hasOwnProperty(prop)) {
            dest[prop] = src[prop];
          }
        }
        return dest;
      },
      extend: function(superclass, protoProps) {
        var superclassProto = superclass.prototype;
        var F = function() {};
        F.prototype = superclassProto;
        var subclass;
        if (protoProps.hasOwnProperty('constructor')) {
          subclass = protoProps.constructor;
        } else {
          subclass = function() {
            superclassProto.constructor.apply(this, arguments);
          };
        }
        var subclassProto = subclass.prototype = new F();
        subclassProto.constructor = subclass;
        subclassProto.superclass = superclassProto;
        delete protoProps.constructor;
        Autolinker.Util.assign(subclassProto, protoProps);
        return subclass;
      },
      ellipsis: function(str, truncateLen, ellipsisChars) {
        if (str.length > truncateLen) {
          ellipsisChars = (ellipsisChars == null) ? '..' : ellipsisChars;
          str = str.substring(0, truncateLen - ellipsisChars.length) + ellipsisChars;
        }
        return str;
      },
      indexOf: function(arr, element) {
        if (Array.prototype.indexOf) {
          return arr.indexOf(element);
        } else {
          for (var i = 0,
              len = arr.length; i < len; i++) {
            if (arr[i] === element)
              return i;
          }
          return -1;
        }
      },
      splitAndCapture: function(str, splitRegex) {
        if (!splitRegex.global)
          throw new Error("`splitRegex` must have the 'g' flag set");
        var result = [],
            lastIdx = 0,
            match;
        while (match = splitRegex.exec(str)) {
          result.push(str.substring(lastIdx, match.index));
          result.push(match[0]);
          lastIdx = match.index + match[0].length;
        }
        result.push(str.substring(lastIdx));
        return result;
      },
      trim: function(str) {
        return str.replace(this.trimRegex, '');
      }
    };
    Autolinker.HtmlTag = Autolinker.Util.extend(Object, {
      whitespaceRegex: /\s+/,
      constructor: function(cfg) {
        Autolinker.Util.assign(this, cfg);
        this.innerHtml = this.innerHtml || this.innerHTML;
      },
      setTagName: function(tagName) {
        this.tagName = tagName;
        return this;
      },
      getTagName: function() {
        return this.tagName || "";
      },
      setAttr: function(attrName, attrValue) {
        var tagAttrs = this.getAttrs();
        tagAttrs[attrName] = attrValue;
        return this;
      },
      getAttr: function(attrName) {
        return this.getAttrs()[attrName];
      },
      setAttrs: function(attrs) {
        var tagAttrs = this.getAttrs();
        Autolinker.Util.assign(tagAttrs, attrs);
        return this;
      },
      getAttrs: function() {
        return this.attrs || (this.attrs = {});
      },
      setClass: function(cssClass) {
        return this.setAttr('class', cssClass);
      },
      addClass: function(cssClass) {
        var classAttr = this.getClass(),
            whitespaceRegex = this.whitespaceRegex,
            indexOf = Autolinker.Util.indexOf,
            classes = (!classAttr) ? [] : classAttr.split(whitespaceRegex),
            newClasses = cssClass.split(whitespaceRegex),
            newClass;
        while (newClass = newClasses.shift()) {
          if (indexOf(classes, newClass) === -1) {
            classes.push(newClass);
          }
        }
        this.getAttrs()['class'] = classes.join(" ");
        return this;
      },
      removeClass: function(cssClass) {
        var classAttr = this.getClass(),
            whitespaceRegex = this.whitespaceRegex,
            indexOf = Autolinker.Util.indexOf,
            classes = (!classAttr) ? [] : classAttr.split(whitespaceRegex),
            removeClasses = cssClass.split(whitespaceRegex),
            removeClass;
        while (classes.length && (removeClass = removeClasses.shift())) {
          var idx = indexOf(classes, removeClass);
          if (idx !== -1) {
            classes.splice(idx, 1);
          }
        }
        this.getAttrs()['class'] = classes.join(" ");
        return this;
      },
      getClass: function() {
        return this.getAttrs()['class'] || "";
      },
      hasClass: function(cssClass) {
        return (' ' + this.getClass() + ' ').indexOf(' ' + cssClass + ' ') !== -1;
      },
      setInnerHtml: function(html) {
        this.innerHtml = html;
        return this;
      },
      getInnerHtml: function() {
        return this.innerHtml || "";
      },
      toAnchorString: function() {
        var tagName = this.getTagName(),
            attrsStr = this.buildAttrsStr();
        attrsStr = (attrsStr) ? ' ' + attrsStr : '';
        return ['<', tagName, attrsStr, '>', this.getInnerHtml(), '</', tagName, '>'].join("");
      },
      buildAttrsStr: function() {
        if (!this.attrs)
          return "";
        var attrs = this.getAttrs(),
            attrsArr = [];
        for (var prop in attrs) {
          if (attrs.hasOwnProperty(prop)) {
            attrsArr.push(prop + '="' + attrs[prop] + '"');
          }
        }
        return attrsArr.join(" ");
      }
    });
    Autolinker.AnchorTagBuilder = Autolinker.Util.extend(Object, {
      constructor: function(cfg) {
        Autolinker.Util.assign(this, cfg);
      },
      build: function(match) {
        var tag = new Autolinker.HtmlTag({
          tagName: 'a',
          attrs: this.createAttrs(match.getType(), match.getAnchorHref()),
          innerHtml: this.processAnchorText(match.getAnchorText())
        });
        return tag;
      },
      createAttrs: function(matchType, anchorHref) {
        var attrs = {'href': anchorHref};
        var cssClass = this.createCssClass(matchType);
        if (cssClass) {
          attrs['class'] = cssClass;
        }
        if (this.newWindow) {
          attrs['target'] = "_blank";
        }
        return attrs;
      },
      createCssClass: function(matchType) {
        var className = this.className;
        if (!className)
          return "";
        else
          return className + " " + className + "-" + matchType;
      },
      processAnchorText: function(anchorText) {
        anchorText = this.doTruncate(anchorText);
        return anchorText;
      },
      doTruncate: function(anchorText) {
        return Autolinker.Util.ellipsis(anchorText, this.truncate || Number.POSITIVE_INFINITY);
      }
    });
    Autolinker.htmlParser.HtmlParser = Autolinker.Util.extend(Object, {
      htmlRegex: (function() {
        var commentTagRegex = /!--([\s\S]+?)--/,
            tagNameRegex = /[0-9a-zA-Z][0-9a-zA-Z:]*/,
            attrNameRegex = /[^\s\0"'>\/=\x01-\x1F\x7F]+/,
            attrValueRegex = /(?:"[^"]*?"|'[^']*?'|[^'"=<>`\s]+)/,
            nameEqualsValueRegex = attrNameRegex.source + '(?:\\s*=\\s*' + attrValueRegex.source + ')?';
        return new RegExp(['(?:', '<(!DOCTYPE)', '(?:', '\\s+', '(?:', nameEqualsValueRegex, '|', attrValueRegex.source + ')', ')*', '>', ')', '|', '(?:', '<(/)?', '(?:', commentTagRegex.source, '|', '(?:', '(' + tagNameRegex.source + ')', '(?:', '\\s+', nameEqualsValueRegex, ')*', '\\s*/?', ')', ')', '>', ')'].join(""), 'gi');
      })(),
      htmlCharacterEntitiesRegex: /(&nbsp;|&#160;|&lt;|&#60;|&gt;|&#62;|&quot;|&#34;|&#39;)/gi,
      parse: function(html) {
        var htmlRegex = this.htmlRegex,
            currentResult,
            lastIndex = 0,
            textAndEntityNodes,
            nodes = [];
        while ((currentResult = htmlRegex.exec(html)) !== null) {
          var tagText = currentResult[0],
              commentText = currentResult[3],
              tagName = currentResult[1] || currentResult[4],
              isClosingTag = !!currentResult[2],
              inBetweenTagsText = html.substring(lastIndex, currentResult.index);
          if (inBetweenTagsText) {
            textAndEntityNodes = this.parseTextAndEntityNodes(inBetweenTagsText);
            nodes.push.apply(nodes, textAndEntityNodes);
          }
          if (commentText) {
            nodes.push(this.createCommentNode(tagText, commentText));
          } else {
            nodes.push(this.createElementNode(tagText, tagName, isClosingTag));
          }
          lastIndex = currentResult.index + tagText.length;
        }
        if (lastIndex < html.length) {
          var text = html.substring(lastIndex);
          if (text) {
            textAndEntityNodes = this.parseTextAndEntityNodes(text);
            nodes.push.apply(nodes, textAndEntityNodes);
          }
        }
        return nodes;
      },
      parseTextAndEntityNodes: function(text) {
        var nodes = [],
            textAndEntityTokens = Autolinker.Util.splitAndCapture(text, this.htmlCharacterEntitiesRegex);
        for (var i = 0,
            len = textAndEntityTokens.length; i < len; i += 2) {
          var textToken = textAndEntityTokens[i],
              entityToken = textAndEntityTokens[i + 1];
          if (textToken)
            nodes.push(this.createTextNode(textToken));
          if (entityToken)
            nodes.push(this.createEntityNode(entityToken));
        }
        return nodes;
      },
      createCommentNode: function(tagText, commentText) {
        return new Autolinker.htmlParser.CommentNode({
          text: tagText,
          comment: Autolinker.Util.trim(commentText)
        });
      },
      createElementNode: function(tagText, tagName, isClosingTag) {
        return new Autolinker.htmlParser.ElementNode({
          text: tagText,
          tagName: tagName.toLowerCase(),
          closing: isClosingTag
        });
      },
      createEntityNode: function(text) {
        return new Autolinker.htmlParser.EntityNode({text: text});
      },
      createTextNode: function(text) {
        return new Autolinker.htmlParser.TextNode({text: text});
      }
    });
    Autolinker.htmlParser.HtmlNode = Autolinker.Util.extend(Object, {
      text: "",
      constructor: function(cfg) {
        Autolinker.Util.assign(this, cfg);
      },
      getType: Autolinker.Util.abstractMethod,
      getText: function() {
        return this.text;
      }
    });
    Autolinker.htmlParser.CommentNode = Autolinker.Util.extend(Autolinker.htmlParser.HtmlNode, {
      comment: '',
      getType: function() {
        return 'comment';
      },
      getComment: function() {
        return this.comment;
      }
    });
    Autolinker.htmlParser.ElementNode = Autolinker.Util.extend(Autolinker.htmlParser.HtmlNode, {
      tagName: '',
      closing: false,
      getType: function() {
        return 'element';
      },
      getTagName: function() {
        return this.tagName;
      },
      isClosing: function() {
        return this.closing;
      }
    });
    Autolinker.htmlParser.EntityNode = Autolinker.Util.extend(Autolinker.htmlParser.HtmlNode, {getType: function() {
        return 'entity';
      }});
    Autolinker.htmlParser.TextNode = Autolinker.Util.extend(Autolinker.htmlParser.HtmlNode, {getType: function() {
        return 'text';
      }});
    Autolinker.matchParser.MatchParser = Autolinker.Util.extend(Object, {
      urls: true,
      email: true,
      twitter: true,
      phone: true,
      hashtag: false,
      stripPrefix: true,
      matcherRegex: (function() {
        var twitterRegex = /(^|[^\w])@(\w{1,15})/,
            hashtagRegex = /(^|[^\w])#(\w{1,15})/,
            emailRegex = /(?:[\-;:&=\+\$,\w\.]+@)/,
            phoneRegex = /(?:\+?\d{1,3}[-\s.])?\(?\d{3}\)?[-\s.]?\d{3}[-\s.]\d{4}/,
            protocolRegex = /(?:[A-Za-z][-.+A-Za-z0-9]+:(?![A-Za-z][-.+A-Za-z0-9]+:\/\/)(?!\d+\/?)(?:\/\/)?)/,
            wwwRegex = /(?:www\.)/,
            domainNameRegex = /[A-Za-z0-9\.\-]*[A-Za-z0-9\-]/,
            tldRegex = /\.(?:international|construction|contractors|enterprises|photography|productions|foundation|immobilien|industries|management|properties|technology|christmas|community|directory|education|equipment|institute|marketing|solutions|vacations|bargains|boutique|builders|catering|cleaning|clothing|computer|democrat|diamonds|graphics|holdings|lighting|partners|plumbing|supplies|training|ventures|academy|careers|company|cruises|domains|exposed|flights|florist|gallery|guitars|holiday|kitchen|neustar|okinawa|recipes|rentals|reviews|shiksha|singles|support|systems|agency|berlin|camera|center|coffee|condos|dating|estate|events|expert|futbol|kaufen|luxury|maison|monash|museum|nagoya|photos|repair|report|social|supply|tattoo|tienda|travel|viajes|villas|vision|voting|voyage|actor|build|cards|cheap|codes|dance|email|glass|house|mango|ninja|parts|photo|shoes|solar|today|tokyo|tools|watch|works|aero|arpa|asia|best|bike|blue|buzz|camp|club|cool|coop|farm|fish|gift|guru|info|jobs|kiwi|kred|land|limo|link|menu|mobi|moda|name|pics|pink|post|qpon|rich|ruhr|sexy|tips|vote|voto|wang|wien|wiki|zone|bar|bid|biz|cab|cat|ceo|com|edu|gov|int|kim|mil|net|onl|org|pro|pub|red|tel|uno|wed|xxx|xyz|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cw|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw)\b/,
            urlSuffixRegex = /[\-A-Za-z0-9+&@#\/%=~_()|'$*\[\]?!:,.;]*[\-A-Za-z0-9+&@#\/%=~_()|'$*\[\]]/;
        return new RegExp(['(', twitterRegex.source, ')', '|', '(', emailRegex.source, domainNameRegex.source, tldRegex.source, ')', '|', '(', '(?:', '(', protocolRegex.source, domainNameRegex.source, ')', '|', '(?:', '(.?//)?', wwwRegex.source, domainNameRegex.source, ')', '|', '(?:', '(.?//)?', domainNameRegex.source, tldRegex.source, ')', ')', '(?:' + urlSuffixRegex.source + ')?', ')', '|', '(', phoneRegex.source, ')', '|', '(', hashtagRegex.source, ')'].join(""), 'gi');
      })(),
      charBeforeProtocolRelMatchRegex: /^(.)?\/\//,
      constructor: function(cfg) {
        Autolinker.Util.assign(this, cfg);
        this.matchValidator = new Autolinker.MatchValidator();
      },
      replace: function(text, replaceFn, contextObj) {
        var me = this;
        return text.replace(this.matcherRegex, function(matchStr, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) {
          var matchDescObj = me.processCandidateMatch(matchStr, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
          if (!matchDescObj) {
            return matchStr;
          } else {
            var replaceStr = replaceFn.call(contextObj, matchDescObj.match);
            return matchDescObj.prefixStr + replaceStr + matchDescObj.suffixStr;
          }
        });
      },
      processCandidateMatch: function(matchStr, twitterMatch, twitterHandlePrefixWhitespaceChar, twitterHandle, emailAddressMatch, urlMatch, protocolUrlMatch, wwwProtocolRelativeMatch, tldProtocolRelativeMatch, phoneMatch, hashtagMatch, hashtagPrefixWhitespaceChar, hashtag) {
        var protocolRelativeMatch = wwwProtocolRelativeMatch || tldProtocolRelativeMatch,
            match,
            prefixStr = "",
            suffixStr = "";
        if ((urlMatch && !this.urls) || (emailAddressMatch && !this.email) || (phoneMatch && !this.phone) || (twitterMatch && !this.twitter) || (hashtagMatch && !this.hashtag) || !this.matchValidator.isValidMatch(urlMatch, protocolUrlMatch, protocolRelativeMatch)) {
          return null;
        }
        if (this.matchHasUnbalancedClosingParen(matchStr)) {
          matchStr = matchStr.substr(0, matchStr.length - 1);
          suffixStr = ")";
        }
        if (emailAddressMatch) {
          match = new Autolinker.match.Email({
            matchedText: matchStr,
            email: emailAddressMatch
          });
        } else if (twitterMatch) {
          if (twitterHandlePrefixWhitespaceChar) {
            prefixStr = twitterHandlePrefixWhitespaceChar;
            matchStr = matchStr.slice(1);
          }
          match = new Autolinker.match.Twitter({
            matchedText: matchStr,
            twitterHandle: twitterHandle
          });
        } else if (phoneMatch) {
          var cleanNumber = matchStr.replace(/\D/g, '');
          match = new Autolinker.match.Phone({
            matchedText: matchStr,
            number: cleanNumber
          });
        } else if (hashtagMatch) {
          if (hashtagPrefixWhitespaceChar) {
            prefixStr = hashtagPrefixWhitespaceChar;
            matchStr = matchStr.slice(1);
          }
          match = new Autolinker.match.Hashtag({
            matchedText: matchStr,
            serviceName: this.hashtag,
            hashtag: hashtag
          });
        } else {
          if (protocolRelativeMatch) {
            var charBeforeMatch = protocolRelativeMatch.match(this.charBeforeProtocolRelMatchRegex)[1] || "";
            if (charBeforeMatch) {
              prefixStr = charBeforeMatch;
              matchStr = matchStr.slice(1);
            }
          }
          match = new Autolinker.match.Url({
            matchedText: matchStr,
            url: matchStr,
            protocolUrlMatch: !!protocolUrlMatch,
            protocolRelativeMatch: !!protocolRelativeMatch,
            stripPrefix: this.stripPrefix
          });
        }
        return {
          prefixStr: prefixStr,
          suffixStr: suffixStr,
          match: match
        };
      },
      matchHasUnbalancedClosingParen: function(matchStr) {
        var lastChar = matchStr.charAt(matchStr.length - 1);
        if (lastChar === ')') {
          var openParensMatch = matchStr.match(/\(/g),
              closeParensMatch = matchStr.match(/\)/g),
              numOpenParens = (openParensMatch && openParensMatch.length) || 0,
              numCloseParens = (closeParensMatch && closeParensMatch.length) || 0;
          if (numOpenParens < numCloseParens) {
            return true;
          }
        }
        return false;
      }
    });
    Autolinker.MatchValidator = Autolinker.Util.extend(Object, {
      invalidProtocolRelMatchRegex: /^[\w]\/\//,
      hasFullProtocolRegex: /^[A-Za-z][-.+A-Za-z0-9]+:\/\//,
      uriSchemeRegex: /^[A-Za-z][-.+A-Za-z0-9]+:/,
      hasWordCharAfterProtocolRegex: /:[^\s]*?[A-Za-z]/,
      isValidMatch: function(urlMatch, protocolUrlMatch, protocolRelativeMatch) {
        if ((protocolUrlMatch && !this.isValidUriScheme(protocolUrlMatch)) || this.urlMatchDoesNotHaveProtocolOrDot(urlMatch, protocolUrlMatch) || this.urlMatchDoesNotHaveAtLeastOneWordChar(urlMatch, protocolUrlMatch) || this.isInvalidProtocolRelativeMatch(protocolRelativeMatch)) {
          return false;
        }
        return true;
      },
      isValidUriScheme: function(uriSchemeMatch) {
        var uriScheme = uriSchemeMatch.match(this.uriSchemeRegex)[0].toLowerCase();
        return (uriScheme !== 'javascript:' && uriScheme !== 'vbscript:');
      },
      urlMatchDoesNotHaveProtocolOrDot: function(urlMatch, protocolUrlMatch) {
        return (!!urlMatch && (!protocolUrlMatch || !this.hasFullProtocolRegex.test(protocolUrlMatch)) && urlMatch.indexOf('.') === -1);
      },
      urlMatchDoesNotHaveAtLeastOneWordChar: function(urlMatch, protocolUrlMatch) {
        if (urlMatch && protocolUrlMatch) {
          return !this.hasWordCharAfterProtocolRegex.test(urlMatch);
        } else {
          return false;
        }
      },
      isInvalidProtocolRelativeMatch: function(protocolRelativeMatch) {
        return (!!protocolRelativeMatch && this.invalidProtocolRelMatchRegex.test(protocolRelativeMatch));
      }
    });
    Autolinker.match.Match = Autolinker.Util.extend(Object, {
      constructor: function(cfg) {
        Autolinker.Util.assign(this, cfg);
      },
      getType: Autolinker.Util.abstractMethod,
      getMatchedText: function() {
        return this.matchedText;
      },
      getAnchorHref: Autolinker.Util.abstractMethod,
      getAnchorText: Autolinker.Util.abstractMethod
    });
    Autolinker.match.Email = Autolinker.Util.extend(Autolinker.match.Match, {
      getType: function() {
        return 'email';
      },
      getEmail: function() {
        return this.email;
      },
      getAnchorHref: function() {
        return 'mailto:' + this.email;
      },
      getAnchorText: function() {
        return this.email;
      }
    });
    Autolinker.match.Hashtag = Autolinker.Util.extend(Autolinker.match.Match, {
      getType: function() {
        return 'hashtag';
      },
      getHashtag: function() {
        return this.hashtag;
      },
      getAnchorHref: function() {
        var serviceName = this.serviceName,
            hashtag = this.hashtag;
        switch (serviceName) {
          case 'twitter':
            return 'https://twitter.com/hashtag/' + hashtag;
          case 'facebook':
            return 'https://www.facebook.com/hashtag/' + hashtag;
          default:
            throw new Error('Unknown service name to point hashtag to: ', serviceName);
        }
      },
      getAnchorText: function() {
        return '#' + this.hashtag;
      }
    });
    Autolinker.match.Phone = Autolinker.Util.extend(Autolinker.match.Match, {
      getType: function() {
        return 'phone';
      },
      getNumber: function() {
        return this.number;
      },
      getAnchorHref: function() {
        return 'tel:' + this.number;
      },
      getAnchorText: function() {
        return this.matchedText;
      }
    });
    Autolinker.match.Twitter = Autolinker.Util.extend(Autolinker.match.Match, {
      getType: function() {
        return 'twitter';
      },
      getTwitterHandle: function() {
        return this.twitterHandle;
      },
      getAnchorHref: function() {
        return 'https://twitter.com/' + this.twitterHandle;
      },
      getAnchorText: function() {
        return '@' + this.twitterHandle;
      }
    });
    Autolinker.match.Url = Autolinker.Util.extend(Autolinker.match.Match, {
      urlPrefixRegex: /^(https?:\/\/)?(www\.)?/i,
      protocolRelativeRegex: /^\/\//,
      protocolPrepended: false,
      getType: function() {
        return 'url';
      },
      getUrl: function() {
        var url = this.url;
        if (!this.protocolRelativeMatch && !this.protocolUrlMatch && !this.protocolPrepended) {
          url = this.url = 'http://' + url;
          this.protocolPrepended = true;
        }
        return url;
      },
      getAnchorHref: function() {
        var url = this.getUrl();
        return url.replace(/&amp;/g, '&');
      },
      getAnchorText: function() {
        var anchorText = this.getUrl();
        if (this.protocolRelativeMatch) {
          anchorText = this.stripProtocolRelativePrefix(anchorText);
        }
        if (this.stripPrefix) {
          anchorText = this.stripUrlPrefix(anchorText);
        }
        anchorText = this.removeTrailingSlash(anchorText);
        return anchorText;
      },
      stripUrlPrefix: function(text) {
        return text.replace(this.urlPrefixRegex, '');
      },
      stripProtocolRelativePrefix: function(text) {
        return text.replace(this.protocolRelativeRegex, '');
      },
      removeTrailingSlash: function(anchorText) {
        if (anchorText.charAt(anchorText.length - 1) === '/') {
          anchorText = anchorText.slice(0, -1);
        }
        return anchorText;
      }
    });
    return Autolinker;
  }));
})(require('process'));
