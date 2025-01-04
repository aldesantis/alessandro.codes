'use strict';

var obsidian = require('obsidian');
require('console');

const VIEW_TYPE_DANGLING_LINKS = "dangling-links";
const ICONS = { FILE_ICON: "M14,4v92h72V29.2l-0.6-0.6l-24-24L60.8,4L14,4z M18,8h40v24h24v60H18L18,8z M62,10.9L79.1,28H62V10.9z",
    FOLDER_ICON: "M 6.1 8 c -3.3 0 -6 2.7 -6 6 v 73.8 c -0.1 0.5 -0.1 0.9 0.1 1.4 c 0.6 2.7 3 4.8 5.9 4.8 h 78 c 3 0 5.4 -2.2 5.9 -5.1 c 0 -0.1 0.1 -0.2 0.1 -0.4 c 0 0 0 -0.1 0 -0.1 l 0.1 -0.3 c 0 0 0 0 0 -0.1 l 9.9 -53.6 l 0.1 -0.2 V 34 c 0 -3.3 -2.7 -6 -6 -6 v -6 c 0 -3.3 -2.7 -6 -6 -6 H 36.1 c 0 0 0 0 -0.1 0 c -0.1 0 -0.2 -0.2 -0.6 -0.6 c -0.5 -0.6 -1.1 -1.5 -1.7 -2.5 c -0.6 -1 -1.3 -2.1 -2.1 -3 C 30.9 9 29.7 8 28.1 8 L 6.1 8 Z M 6.1 12 h 22 c -0.1 0 0.1 0 0.6 0.6 c 0.5 0.6 1.1 1.5 1.7 2.5 c 0.6 1 1.3 2.1 2.1 3 c 0.8 0.9 1.9 1.9 3.6 1.9 h 52 c 1.1 0 2 0.9 2 2 v 6 h -74 c -3.1 0 -5.7 2.5 -5.9 5.6 h -0.1 L 10.1 34 l -6 32.4 V 14 C 4.1 12.9 4.9 12 6.1 12 Z M 16.1 32 h 78 c 1.1 0 2 0.9 2 2 l -9.8 53.1 l -0.1 0.1 c 0 0.1 0 0.2 -0.1 0.2 c 0 0.1 0 0.2 -0.1 0.2 c 0 0 0 0.1 0 0.1 c 0 0 0 0 0 0.1 c 0 0.1 0 0.2 -0.1 0.3 c 0 0.1 0 0.1 0 0.2 c 0 0.1 0 0.2 0 0.2 c -0.3 0.8 -1 1.4 -1.9 1.4 h -78 c -1.1 0 -2 -0.9 -2 -2 L 14 34.4 l 0.1 -0.2 V 34 C 14.1 32.9 14.9 32 16.1 32 L 16.1 32 Z",
    SORT_ICON: "M 25.8 5.9 c -0.1 0 -0.2 0 -0.3 0.1 c -0.1 0 -0.1 0 -0.2 0.1 c -0.1 0 -0.1 0 -0.2 0.1 c -0.1 0.1 -0.3 0.2 -0.4 0.3 c -0.1 0.1 -0.2 0.1 -0.3 0.2 c -0.1 0.1 -0.2 0.2 -0.3 0.3 L 8.6 22.6 c -0.8 0.8 -0.8 2.1 0 2.9 c 0.8 0.8 2.1 0.8 2.9 0 L 24 12.9 V 76 c 0 0.7 0.4 1.4 1 1.8 c 0.6 0.4 1.4 0.4 2 0 c 0.6 -0.4 1 -1 1 -1.8 V 12.9 l 12.6 12.6 c 0.8 0.8 2.1 0.8 2.9 0 c 0.8 -0.8 0.8 -2.1 0 -2.9 L 27.7 6.9 c -0.1 -0.2 -0.3 -0.4 -0.6 -0.6 c -0.2 -0.2 -0.5 -0.3 -0.8 -0.3 C 26.2 6 26 5.9 25.8 5.9 L 25.8 5.9 Z M 74 6 c -1.1 0 -2 0.9 -2 2 s 0.9 2 2 2 s 2 -0.9 2 -2 S 75.1 6 74 6 Z M 74 14 c -1.1 0 -2 0.9 -2 2 s 0.9 2 2 2 s 2 -0.9 2 -2 S 75.1 14 74 14 Z M 73.8 21.9 c -0.1 0 -0.2 0 -0.3 0.1 c -0.9 0.2 -1.6 1 -1.6 2 v 63.1 L 59.4 74.6 c -0.5 -0.5 -1.2 -0.7 -1.9 -0.6 c -0.8 0.1 -1.4 0.7 -1.6 1.4 c -0.2 0.7 0 1.5 0.6 2 l 15.8 15.7 c 0 0.1 0.1 0.1 0.1 0.2 l 0.1 0.1 c 0 0 0.1 0.1 0.1 0.1 c 0 0 0 0 0.1 0 c 0.1 0.1 0.3 0.2 0.4 0.3 c 0 0 0 0 0.1 0 c 0 0 0.1 0 0.1 0.1 c 0 0 0 0 0.1 0 c 0.1 0 0.1 0 0.2 0.1 c 0.2 0 0.4 0 0.6 0 c 0 0 0.1 0 0.1 0 c 0.2 0 0.3 -0.1 0.5 -0.2 c 0.3 -0.1 0.5 -0.3 0.7 -0.6 l 15.9 -15.8 c 0.8 -0.8 0.8 -2.1 0 -2.9 c -0.8 -0.8 -2.1 -0.8 -2.9 0 L 76 87.1 V 24 c 0 -0.6 -0.2 -1.1 -0.6 -1.5 C 75 22.1 74.4 21.9 73.8 21.9 L 73.8 21.9 Z M 26 82 c -1.1 0 -2 0.9 -2 2 c 0 1.1 0.9 2 2 2 c 1.1 0 2 -0.9 2 -2 C 28 82.9 27.1 82 26 82 Z M 26 90 c -1.1 0 -2 0.9 -2 2 s 0.9 2 2 2 c 1.1 0 2 -0.9 2 -2 C 28 90.9 27.1 90 26 90 Z",
    LINK_ICON: "M 74 8 c -4.8 0 -9.3 1.9 -12.7 5.3 l -10 10 c -2.9 2.9 -4.7 6.6 -5.1 10.6 C 46 34.6 46 35.3 46 36 c 0 2.7 0.6 5.4 1.8 7.8 l 3.1 -3.1 C 50.3 39.2 50 37.6 50 36 c 0 -3.7 1.5 -7.3 4.1 -9.9 l 10 -10 c 2.6 -2.6 6.2 -4.1 9.9 -4.1 s 7.3 1.5 9.9 4.1 c 2.6 2.6 4.1 6.2 4.1 9.9 s -1.5 7.3 -4.1 9.9 l -10 10 C 71.3 48.5 67.7 50 64 50 c -1.6 0 -3.2 -0.3 -4.7 -0.8 l -3.1 3.1 c 2.4 1.1 5 1.8 7.8 1.8 c 4.8 0 9.3 -1.9 12.7 -5.3 l 10 -10 C 90.1 35.3 92 30.8 92 26 s -1.9 -9.3 -5.3 -12.7 C 83.3 9.9 78.8 8 74 8 L 74 8 Z M 62 36 c -0.5 0 -1 0.2 -1.4 0.6 l -24 24 c -0.5 0.5 -0.7 1.2 -0.6 1.9 c 0.2 0.7 0.7 1.2 1.4 1.4 c 0.7 0.2 1.4 0 1.9 -0.6 l 24 -24 c 0.6 -0.6 0.8 -1.5 0.4 -2.2 C 63.5 36.4 62.8 36 62 36 Z M 36 46 c -4.8 0 -9.3 1.9 -12.7 5.3 l -10 10 c -3.1 3.1 -5 7.2 -5.2 11.6 c 0 0.4 0 0.8 0 1.2 c 0 4.8 1.9 9.3 5.3 12.7 C 16.7 90.1 21.2 92 26 92 s 9.3 -1.9 12.7 -5.3 l 10 -10 C 52.1 73.3 54 68.8 54 64 c 0 -2.7 -0.6 -5.4 -1.8 -7.8 l -3.1 3.1 c 0.5 1.5 0.8 3.1 0.8 4.7 c 0 3.7 -1.5 7.3 -4.1 9.9 l -10 10 C 33.3 86.5 29.7 88 26 88 s -7.3 -1.5 -9.9 -4.1 S 12 77.7 12 74 c 0 -3.7 1.5 -7.3 4.1 -9.9 l 10 -10 c 2.6 -2.6 6.2 -4.1 9.9 -4.1 c 1.6 0 3.2 0.3 4.7 0.8 l 3.1 -3.1 C 41.4 46.6 38.7 46 36 46 L 36 46 Z M 80 60 c -10.3 0 -18.8 7.9 -19.9 17.9 C 60 78.6 60 79.3 60 80 c 0 11 9 20 20 20 s 20 -9 20 -20 S 91 60 80 60 Z M 80 64 c 8.8 0 16 7.2 16 16 s -7.2 16 -16 16 s -16 -7.2 -16 -16 S 71.2 64 80 64 Z M 73.2 71 c -0.1 0 -0.3 0 -0.4 0 h -0.2 c -1 0.2 -1.8 1.2 -1.6 2.4 c 0 0.4 0.2 0.8 0.6 1.2 l 5.6 5.6 l -5.6 5.6 c -0.8 0.8 -0.8 2 0 2.8 c 0.8 0.8 2 0.8 2.8 0 L 80 83 l 5.6 5.6 c 0.8 0.8 2 0.8 2.8 0 c 0.8 -0.8 0.8 -2 0 -2.8 L 82.8 80 l 5.6 -5.6 c 0.8 -0.8 0.8 -2 0.2 -2.8 c -0.4 -0.4 -1.2 -0.8 -1.8 -0.6 c -0.4 0 -0.8 0.2 -1.2 0.6 L 80 77.2 l -5.6 -5.6 C 74.1 71.3 73.7 71 73.2 71 Z"
};
var NAVIGATION_TAB;
(function (NAVIGATION_TAB) {
    NAVIGATION_TAB[NAVIGATION_TAB["FILE"] = 0] = "FILE";
    NAVIGATION_TAB[NAVIGATION_TAB["FOLDER"] = 1] = "FOLDER";
    NAVIGATION_TAB[NAVIGATION_TAB["LINK"] = 2] = "LINK";
    NAVIGATION_TAB[NAVIGATION_TAB["SORT"] = 3] = "SORT";
})(NAVIGATION_TAB || (NAVIGATION_TAB = {}));
var SORT_ORDER;
(function (SORT_ORDER) {
    SORT_ORDER[SORT_ORDER["ASC"] = 0] = "ASC";
    SORT_ORDER[SORT_ORDER["DESC"] = 1] = "DESC";
    SORT_ORDER[SORT_ORDER["LINK"] = 2] = "LINK";
})(SORT_ORDER || (SORT_ORDER = {}));

var Config;
(function (Config) {
    const DEFAULT_SETTINGS = {
        selectedTab: NAVIGATION_TAB.FILE,
        sortOrder: SORT_ORDER.ASC,
        reducedIndices: [],
        ignoredFolders: []
    };
    async function loadSettings(plugin) {
        this.plugin = plugin;
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData());
    }
    Config.loadSettings = loadSettings;
    function getSettings() { return this.settings; }
    Config.getSettings = getSettings;
    function saveSettings() { this.plugin.saveData(this.settings); }
    Config.saveSettings = saveSettings;
})(Config || (Config = {}));

var top = 'top';
var bottom = 'bottom';
var right = 'right';
var left = 'left';
var auto = 'auto';
var basePlacements = [top, bottom, right, left];
var start = 'start';
var end = 'end';
var clippingParents = 'clippingParents';
var viewport = 'viewport';
var popper = 'popper';
var reference = 'reference';
var variationPlacements = /*#__PURE__*/basePlacements.reduce(function (acc, placement) {
  return acc.concat([placement + "-" + start, placement + "-" + end]);
}, []);
var placements = /*#__PURE__*/[].concat(basePlacements, [auto]).reduce(function (acc, placement) {
  return acc.concat([placement, placement + "-" + start, placement + "-" + end]);
}, []); // modifiers that need to read the DOM

var beforeRead = 'beforeRead';
var read = 'read';
var afterRead = 'afterRead'; // pure-logic modifiers

var beforeMain = 'beforeMain';
var main = 'main';
var afterMain = 'afterMain'; // modifier with the purpose to write to the DOM (or write into a framework state)

var beforeWrite = 'beforeWrite';
var write = 'write';
var afterWrite = 'afterWrite';
var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];

function getNodeName(element) {
  return element ? (element.nodeName || '').toLowerCase() : null;
}

function getWindow(node) {
  if (node == null) {
    return window;
  }

  if (node.toString() !== '[object Window]') {
    var ownerDocument = node.ownerDocument;
    return ownerDocument ? ownerDocument.defaultView || window : window;
  }

  return node;
}

function isElement(node) {
  var OwnElement = getWindow(node).Element;
  return node instanceof OwnElement || node instanceof Element;
}

function isHTMLElement(node) {
  var OwnElement = getWindow(node).HTMLElement;
  return node instanceof OwnElement || node instanceof HTMLElement;
}

function isShadowRoot(node) {
  // IE 11 has no ShadowRoot
  if (typeof ShadowRoot === 'undefined') {
    return false;
  }

  var OwnElement = getWindow(node).ShadowRoot;
  return node instanceof OwnElement || node instanceof ShadowRoot;
}

// and applies them to the HTMLElements such as popper and arrow

function applyStyles(_ref) {
  var state = _ref.state;
  Object.keys(state.elements).forEach(function (name) {
    var style = state.styles[name] || {};
    var attributes = state.attributes[name] || {};
    var element = state.elements[name]; // arrow is optional + virtual elements

    if (!isHTMLElement(element) || !getNodeName(element)) {
      return;
    } // Flow doesn't support to extend this property, but it's the most
    // effective way to apply styles to an HTMLElement
    // $FlowFixMe[cannot-write]


    Object.assign(element.style, style);
    Object.keys(attributes).forEach(function (name) {
      var value = attributes[name];

      if (value === false) {
        element.removeAttribute(name);
      } else {
        element.setAttribute(name, value === true ? '' : value);
      }
    });
  });
}

function effect(_ref2) {
  var state = _ref2.state;
  var initialStyles = {
    popper: {
      position: state.options.strategy,
      left: '0',
      top: '0',
      margin: '0'
    },
    arrow: {
      position: 'absolute'
    },
    reference: {}
  };
  Object.assign(state.elements.popper.style, initialStyles.popper);
  state.styles = initialStyles;

  if (state.elements.arrow) {
    Object.assign(state.elements.arrow.style, initialStyles.arrow);
  }

  return function () {
    Object.keys(state.elements).forEach(function (name) {
      var element = state.elements[name];
      var attributes = state.attributes[name] || {};
      var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]); // Set all values to an empty string to unset them

      var style = styleProperties.reduce(function (style, property) {
        style[property] = '';
        return style;
      }, {}); // arrow is optional + virtual elements

      if (!isHTMLElement(element) || !getNodeName(element)) {
        return;
      }

      Object.assign(element.style, style);
      Object.keys(attributes).forEach(function (attribute) {
        element.removeAttribute(attribute);
      });
    });
  };
} // eslint-disable-next-line import/no-unused-modules


var applyStyles$1 = {
  name: 'applyStyles',
  enabled: true,
  phase: 'write',
  fn: applyStyles,
  effect: effect,
  requires: ['computeStyles']
};

function getBasePlacement(placement) {
  return placement.split('-')[0];
}

function getBoundingClientRect(element) {
  var rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    x: rect.left,
    y: rect.top
  };
}

// means it doesn't take into account transforms.

function getLayoutRect(element) {
  var clientRect = getBoundingClientRect(element); // Use the clientRect sizes if it's not been transformed.
  // Fixes https://github.com/popperjs/popper-core/issues/1223

  var width = element.offsetWidth;
  var height = element.offsetHeight;

  if (Math.abs(clientRect.width - width) <= 1) {
    width = clientRect.width;
  }

  if (Math.abs(clientRect.height - height) <= 1) {
    height = clientRect.height;
  }

  return {
    x: element.offsetLeft,
    y: element.offsetTop,
    width: width,
    height: height
  };
}

function contains(parent, child) {
  var rootNode = child.getRootNode && child.getRootNode(); // First, attempt with faster native method

  if (parent.contains(child)) {
    return true;
  } // then fallback to custom implementation with Shadow DOM support
  else if (rootNode && isShadowRoot(rootNode)) {
      var next = child;

      do {
        if (next && parent.isSameNode(next)) {
          return true;
        } // $FlowFixMe[prop-missing]: need a better way to handle this...


        next = next.parentNode || next.host;
      } while (next);
    } // Give up, the result is false


  return false;
}

function getComputedStyle(element) {
  return getWindow(element).getComputedStyle(element);
}

function isTableElement(element) {
  return ['table', 'td', 'th'].indexOf(getNodeName(element)) >= 0;
}

function getDocumentElement(element) {
  // $FlowFixMe[incompatible-return]: assume body is always available
  return ((isElement(element) ? element.ownerDocument : // $FlowFixMe[prop-missing]
  element.document) || window.document).documentElement;
}

function getParentNode(element) {
  if (getNodeName(element) === 'html') {
    return element;
  }

  return (// this is a quicker (but less type safe) way to save quite some bytes from the bundle
    // $FlowFixMe[incompatible-return]
    // $FlowFixMe[prop-missing]
    element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
    element.parentNode || ( // DOM Element detected
    isShadowRoot(element) ? element.host : null) || // ShadowRoot detected
    // $FlowFixMe[incompatible-call]: HTMLElement is a Node
    getDocumentElement(element) // fallback

  );
}

function getTrueOffsetParent(element) {
  if (!isHTMLElement(element) || // https://github.com/popperjs/popper-core/issues/837
  getComputedStyle(element).position === 'fixed') {
    return null;
  }

  return element.offsetParent;
} // `.offsetParent` reports `null` for fixed elements, while absolute elements
// return the containing block


function getContainingBlock(element) {
  var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
  var isIE = navigator.userAgent.indexOf('Trident') !== -1;

  if (isIE && isHTMLElement(element)) {
    // In IE 9, 10 and 11 fixed elements containing block is always established by the viewport
    var elementCss = getComputedStyle(element);

    if (elementCss.position === 'fixed') {
      return null;
    }
  }

  var currentNode = getParentNode(element);

  while (isHTMLElement(currentNode) && ['html', 'body'].indexOf(getNodeName(currentNode)) < 0) {
    var css = getComputedStyle(currentNode); // This is non-exhaustive but covers the most common CSS properties that
    // create a containing block.
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block

    if (css.transform !== 'none' || css.perspective !== 'none' || css.contain === 'paint' || ['transform', 'perspective'].indexOf(css.willChange) !== -1 || isFirefox && css.willChange === 'filter' || isFirefox && css.filter && css.filter !== 'none') {
      return currentNode;
    } else {
      currentNode = currentNode.parentNode;
    }
  }

  return null;
} // Gets the closest ancestor positioned element. Handles some edge cases,
// such as table ancestors and cross browser bugs.


function getOffsetParent(element) {
  var window = getWindow(element);
  var offsetParent = getTrueOffsetParent(element);

  while (offsetParent && isTableElement(offsetParent) && getComputedStyle(offsetParent).position === 'static') {
    offsetParent = getTrueOffsetParent(offsetParent);
  }

  if (offsetParent && (getNodeName(offsetParent) === 'html' || getNodeName(offsetParent) === 'body' && getComputedStyle(offsetParent).position === 'static')) {
    return window;
  }

  return offsetParent || getContainingBlock(element) || window;
}

function getMainAxisFromPlacement(placement) {
  return ['top', 'bottom'].indexOf(placement) >= 0 ? 'x' : 'y';
}

var max = Math.max;
var min = Math.min;
var round = Math.round;

function within(min$1, value, max$1) {
  return max(min$1, min(value, max$1));
}

function getFreshSideObject() {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };
}

function mergePaddingObject(paddingObject) {
  return Object.assign({}, getFreshSideObject(), paddingObject);
}

function expandToHashMap(value, keys) {
  return keys.reduce(function (hashMap, key) {
    hashMap[key] = value;
    return hashMap;
  }, {});
}

var toPaddingObject = function toPaddingObject(padding, state) {
  padding = typeof padding === 'function' ? padding(Object.assign({}, state.rects, {
    placement: state.placement
  })) : padding;
  return mergePaddingObject(typeof padding !== 'number' ? padding : expandToHashMap(padding, basePlacements));
};

function arrow(_ref) {
  var _state$modifiersData$;

  var state = _ref.state,
      name = _ref.name,
      options = _ref.options;
  var arrowElement = state.elements.arrow;
  var popperOffsets = state.modifiersData.popperOffsets;
  var basePlacement = getBasePlacement(state.placement);
  var axis = getMainAxisFromPlacement(basePlacement);
  var isVertical = [left, right].indexOf(basePlacement) >= 0;
  var len = isVertical ? 'height' : 'width';

  if (!arrowElement || !popperOffsets) {
    return;
  }

  var paddingObject = toPaddingObject(options.padding, state);
  var arrowRect = getLayoutRect(arrowElement);
  var minProp = axis === 'y' ? top : left;
  var maxProp = axis === 'y' ? bottom : right;
  var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets[axis] - state.rects.popper[len];
  var startDiff = popperOffsets[axis] - state.rects.reference[axis];
  var arrowOffsetParent = getOffsetParent(arrowElement);
  var clientSize = arrowOffsetParent ? axis === 'y' ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
  var centerToReference = endDiff / 2 - startDiff / 2; // Make sure the arrow doesn't overflow the popper if the center point is
  // outside of the popper bounds

  var min = paddingObject[minProp];
  var max = clientSize - arrowRect[len] - paddingObject[maxProp];
  var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
  var offset = within(min, center, max); // Prevents breaking syntax highlighting...

  var axisProp = axis;
  state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset, _state$modifiersData$.centerOffset = offset - center, _state$modifiersData$);
}

function effect$1(_ref2) {
  var state = _ref2.state,
      options = _ref2.options;
  var _options$element = options.element,
      arrowElement = _options$element === void 0 ? '[data-popper-arrow]' : _options$element;

  if (arrowElement == null) {
    return;
  } // CSS selector


  if (typeof arrowElement === 'string') {
    arrowElement = state.elements.popper.querySelector(arrowElement);

    if (!arrowElement) {
      return;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    if (!isHTMLElement(arrowElement)) {
      console.error(['Popper: "arrow" element must be an HTMLElement (not an SVGElement).', 'To use an SVG arrow, wrap it in an HTMLElement that will be used as', 'the arrow.'].join(' '));
    }
  }

  if (!contains(state.elements.popper, arrowElement)) {
    if (process.env.NODE_ENV !== "production") {
      console.error(['Popper: "arrow" modifier\'s `element` must be a child of the popper', 'element.'].join(' '));
    }

    return;
  }

  state.elements.arrow = arrowElement;
} // eslint-disable-next-line import/no-unused-modules


var arrow$1 = {
  name: 'arrow',
  enabled: true,
  phase: 'main',
  fn: arrow,
  effect: effect$1,
  requires: ['popperOffsets'],
  requiresIfExists: ['preventOverflow']
};

var unsetSides = {
  top: 'auto',
  right: 'auto',
  bottom: 'auto',
  left: 'auto'
}; // Round the offsets to the nearest suitable subpixel based on the DPR.
// Zooming can change the DPR, but it seems to report a value that will
// cleanly divide the values into the appropriate subpixels.

function roundOffsetsByDPR(_ref) {
  var x = _ref.x,
      y = _ref.y;
  var win = window;
  var dpr = win.devicePixelRatio || 1;
  return {
    x: round(round(x * dpr) / dpr) || 0,
    y: round(round(y * dpr) / dpr) || 0
  };
}

function mapToStyles(_ref2) {
  var _Object$assign2;

  var popper = _ref2.popper,
      popperRect = _ref2.popperRect,
      placement = _ref2.placement,
      offsets = _ref2.offsets,
      position = _ref2.position,
      gpuAcceleration = _ref2.gpuAcceleration,
      adaptive = _ref2.adaptive,
      roundOffsets = _ref2.roundOffsets;

  var _ref3 = roundOffsets === true ? roundOffsetsByDPR(offsets) : typeof roundOffsets === 'function' ? roundOffsets(offsets) : offsets,
      _ref3$x = _ref3.x,
      x = _ref3$x === void 0 ? 0 : _ref3$x,
      _ref3$y = _ref3.y,
      y = _ref3$y === void 0 ? 0 : _ref3$y;

  var hasX = offsets.hasOwnProperty('x');
  var hasY = offsets.hasOwnProperty('y');
  var sideX = left;
  var sideY = top;
  var win = window;

  if (adaptive) {
    var offsetParent = getOffsetParent(popper);
    var heightProp = 'clientHeight';
    var widthProp = 'clientWidth';

    if (offsetParent === getWindow(popper)) {
      offsetParent = getDocumentElement(popper);

      if (getComputedStyle(offsetParent).position !== 'static') {
        heightProp = 'scrollHeight';
        widthProp = 'scrollWidth';
      }
    } // $FlowFixMe[incompatible-cast]: force type refinement, we compare offsetParent with window above, but Flow doesn't detect it


    offsetParent = offsetParent;

    if (placement === top) {
      sideY = bottom; // $FlowFixMe[prop-missing]

      y -= offsetParent[heightProp] - popperRect.height;
      y *= gpuAcceleration ? 1 : -1;
    }

    if (placement === left) {
      sideX = right; // $FlowFixMe[prop-missing]

      x -= offsetParent[widthProp] - popperRect.width;
      x *= gpuAcceleration ? 1 : -1;
    }
  }

  var commonStyles = Object.assign({
    position: position
  }, adaptive && unsetSides);

  if (gpuAcceleration) {
    var _Object$assign;

    return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? '0' : '', _Object$assign[sideX] = hasX ? '0' : '', _Object$assign.transform = (win.devicePixelRatio || 1) < 2 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", _Object$assign));
  }

  return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : '', _Object$assign2[sideX] = hasX ? x + "px" : '', _Object$assign2.transform = '', _Object$assign2));
}

function computeStyles(_ref4) {
  var state = _ref4.state,
      options = _ref4.options;
  var _options$gpuAccelerat = options.gpuAcceleration,
      gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat,
      _options$adaptive = options.adaptive,
      adaptive = _options$adaptive === void 0 ? true : _options$adaptive,
      _options$roundOffsets = options.roundOffsets,
      roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;

  if (process.env.NODE_ENV !== "production") {
    var transitionProperty = getComputedStyle(state.elements.popper).transitionProperty || '';

    if (adaptive && ['transform', 'top', 'right', 'bottom', 'left'].some(function (property) {
      return transitionProperty.indexOf(property) >= 0;
    })) {
      console.warn(['Popper: Detected CSS transitions on at least one of the following', 'CSS properties: "transform", "top", "right", "bottom", "left".', '\n\n', 'Disable the "computeStyles" modifier\'s `adaptive` option to allow', 'for smooth transitions, or remove these properties from the CSS', 'transition declaration on the popper element if only transitioning', 'opacity or background-color for example.', '\n\n', 'We recommend using the popper element as a wrapper around an inner', 'element that can have any CSS property transitioned for animations.'].join(' '));
    }
  }

  var commonStyles = {
    placement: getBasePlacement(state.placement),
    popper: state.elements.popper,
    popperRect: state.rects.popper,
    gpuAcceleration: gpuAcceleration
  };

  if (state.modifiersData.popperOffsets != null) {
    state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
      offsets: state.modifiersData.popperOffsets,
      position: state.options.strategy,
      adaptive: adaptive,
      roundOffsets: roundOffsets
    })));
  }

  if (state.modifiersData.arrow != null) {
    state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
      offsets: state.modifiersData.arrow,
      position: 'absolute',
      adaptive: false,
      roundOffsets: roundOffsets
    })));
  }

  state.attributes.popper = Object.assign({}, state.attributes.popper, {
    'data-popper-placement': state.placement
  });
} // eslint-disable-next-line import/no-unused-modules


var computeStyles$1 = {
  name: 'computeStyles',
  enabled: true,
  phase: 'beforeWrite',
  fn: computeStyles,
  data: {}
};

var passive = {
  passive: true
};

function effect$2(_ref) {
  var state = _ref.state,
      instance = _ref.instance,
      options = _ref.options;
  var _options$scroll = options.scroll,
      scroll = _options$scroll === void 0 ? true : _options$scroll,
      _options$resize = options.resize,
      resize = _options$resize === void 0 ? true : _options$resize;
  var window = getWindow(state.elements.popper);
  var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);

  if (scroll) {
    scrollParents.forEach(function (scrollParent) {
      scrollParent.addEventListener('scroll', instance.update, passive);
    });
  }

  if (resize) {
    window.addEventListener('resize', instance.update, passive);
  }

  return function () {
    if (scroll) {
      scrollParents.forEach(function (scrollParent) {
        scrollParent.removeEventListener('scroll', instance.update, passive);
      });
    }

    if (resize) {
      window.removeEventListener('resize', instance.update, passive);
    }
  };
} // eslint-disable-next-line import/no-unused-modules


var eventListeners = {
  name: 'eventListeners',
  enabled: true,
  phase: 'write',
  fn: function fn() {},
  effect: effect$2,
  data: {}
};

var hash = {
  left: 'right',
  right: 'left',
  bottom: 'top',
  top: 'bottom'
};
function getOppositePlacement(placement) {
  return placement.replace(/left|right|bottom|top/g, function (matched) {
    return hash[matched];
  });
}

var hash$1 = {
  start: 'end',
  end: 'start'
};
function getOppositeVariationPlacement(placement) {
  return placement.replace(/start|end/g, function (matched) {
    return hash$1[matched];
  });
}

function getWindowScroll(node) {
  var win = getWindow(node);
  var scrollLeft = win.pageXOffset;
  var scrollTop = win.pageYOffset;
  return {
    scrollLeft: scrollLeft,
    scrollTop: scrollTop
  };
}

function getWindowScrollBarX(element) {
  // If <html> has a CSS width greater than the viewport, then this will be
  // incorrect for RTL.
  // Popper 1 is broken in this case and never had a bug report so let's assume
  // it's not an issue. I don't think anyone ever specifies width on <html>
  // anyway.
  // Browsers where the left scrollbar doesn't cause an issue report `0` for
  // this (e.g. Edge 2019, IE11, Safari)
  return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
}

function getViewportRect(element) {
  var win = getWindow(element);
  var html = getDocumentElement(element);
  var visualViewport = win.visualViewport;
  var width = html.clientWidth;
  var height = html.clientHeight;
  var x = 0;
  var y = 0; // NB: This isn't supported on iOS <= 12. If the keyboard is open, the popper
  // can be obscured underneath it.
  // Also, `html.clientHeight` adds the bottom bar height in Safari iOS, even
  // if it isn't open, so if this isn't available, the popper will be detected
  // to overflow the bottom of the screen too early.

  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height; // Uses Layout Viewport (like Chrome; Safari does not currently)
    // In Chrome, it returns a value very close to 0 (+/-) but contains rounding
    // errors due to floating point numbers, so we need to check precision.
    // Safari returns a number <= 0, usually < -1 when pinch-zoomed
    // Feature detection fails in mobile emulation mode in Chrome.
    // Math.abs(win.innerWidth / visualViewport.scale - visualViewport.width) <
    // 0.001
    // Fallback here: "Not Safari" userAgent

    if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
      x = visualViewport.offsetLeft;
      y = visualViewport.offsetTop;
    }
  }

  return {
    width: width,
    height: height,
    x: x + getWindowScrollBarX(element),
    y: y
  };
}

// of the `<html>` and `<body>` rect bounds if horizontally scrollable

function getDocumentRect(element) {
  var _element$ownerDocumen;

  var html = getDocumentElement(element);
  var winScroll = getWindowScroll(element);
  var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
  var width = max(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
  var height = max(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
  var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
  var y = -winScroll.scrollTop;

  if (getComputedStyle(body || html).direction === 'rtl') {
    x += max(html.clientWidth, body ? body.clientWidth : 0) - width;
  }

  return {
    width: width,
    height: height,
    x: x,
    y: y
  };
}

function isScrollParent(element) {
  // Firefox wants us to check `-x` and `-y` variations as well
  var _getComputedStyle = getComputedStyle(element),
      overflow = _getComputedStyle.overflow,
      overflowX = _getComputedStyle.overflowX,
      overflowY = _getComputedStyle.overflowY;

  return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
}

function getScrollParent(node) {
  if (['html', 'body', '#document'].indexOf(getNodeName(node)) >= 0) {
    // $FlowFixMe[incompatible-return]: assume body is always available
    return node.ownerDocument.body;
  }

  if (isHTMLElement(node) && isScrollParent(node)) {
    return node;
  }

  return getScrollParent(getParentNode(node));
}

/*
given a DOM element, return the list of all scroll parents, up the list of ancesors
until we get to the top window object. This list is what we attach scroll listeners
to, because if any of these parent elements scroll, we'll need to re-calculate the
reference element's position.
*/

function listScrollParents(element, list) {
  var _element$ownerDocumen;

  if (list === void 0) {
    list = [];
  }

  var scrollParent = getScrollParent(element);
  var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
  var win = getWindow(scrollParent);
  var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
  var updatedList = list.concat(target);
  return isBody ? updatedList : // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
  updatedList.concat(listScrollParents(getParentNode(target)));
}

function rectToClientRect(rect) {
  return Object.assign({}, rect, {
    left: rect.x,
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height
  });
}

function getInnerBoundingClientRect(element) {
  var rect = getBoundingClientRect(element);
  rect.top = rect.top + element.clientTop;
  rect.left = rect.left + element.clientLeft;
  rect.bottom = rect.top + element.clientHeight;
  rect.right = rect.left + element.clientWidth;
  rect.width = element.clientWidth;
  rect.height = element.clientHeight;
  rect.x = rect.left;
  rect.y = rect.top;
  return rect;
}

function getClientRectFromMixedType(element, clippingParent) {
  return clippingParent === viewport ? rectToClientRect(getViewportRect(element)) : isHTMLElement(clippingParent) ? getInnerBoundingClientRect(clippingParent) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
} // A "clipping parent" is an overflowable container with the characteristic of
// clipping (or hiding) overflowing elements with a position different from
// `initial`


function getClippingParents(element) {
  var clippingParents = listScrollParents(getParentNode(element));
  var canEscapeClipping = ['absolute', 'fixed'].indexOf(getComputedStyle(element).position) >= 0;
  var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;

  if (!isElement(clipperElement)) {
    return [];
  } // $FlowFixMe[incompatible-return]: https://github.com/facebook/flow/issues/1414


  return clippingParents.filter(function (clippingParent) {
    return isElement(clippingParent) && contains(clippingParent, clipperElement) && getNodeName(clippingParent) !== 'body';
  });
} // Gets the maximum area that the element is visible in due to any number of
// clipping parents


function getClippingRect(element, boundary, rootBoundary) {
  var mainClippingParents = boundary === 'clippingParents' ? getClippingParents(element) : [].concat(boundary);
  var clippingParents = [].concat(mainClippingParents, [rootBoundary]);
  var firstClippingParent = clippingParents[0];
  var clippingRect = clippingParents.reduce(function (accRect, clippingParent) {
    var rect = getClientRectFromMixedType(element, clippingParent);
    accRect.top = max(rect.top, accRect.top);
    accRect.right = min(rect.right, accRect.right);
    accRect.bottom = min(rect.bottom, accRect.bottom);
    accRect.left = max(rect.left, accRect.left);
    return accRect;
  }, getClientRectFromMixedType(element, firstClippingParent));
  clippingRect.width = clippingRect.right - clippingRect.left;
  clippingRect.height = clippingRect.bottom - clippingRect.top;
  clippingRect.x = clippingRect.left;
  clippingRect.y = clippingRect.top;
  return clippingRect;
}

function getVariation(placement) {
  return placement.split('-')[1];
}

function computeOffsets(_ref) {
  var reference = _ref.reference,
      element = _ref.element,
      placement = _ref.placement;
  var basePlacement = placement ? getBasePlacement(placement) : null;
  var variation = placement ? getVariation(placement) : null;
  var commonX = reference.x + reference.width / 2 - element.width / 2;
  var commonY = reference.y + reference.height / 2 - element.height / 2;
  var offsets;

  switch (basePlacement) {
    case top:
      offsets = {
        x: commonX,
        y: reference.y - element.height
      };
      break;

    case bottom:
      offsets = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;

    case right:
      offsets = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;

    case left:
      offsets = {
        x: reference.x - element.width,
        y: commonY
      };
      break;

    default:
      offsets = {
        x: reference.x,
        y: reference.y
      };
  }

  var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;

  if (mainAxis != null) {
    var len = mainAxis === 'y' ? 'height' : 'width';

    switch (variation) {
      case start:
        offsets[mainAxis] = offsets[mainAxis] - (reference[len] / 2 - element[len] / 2);
        break;

      case end:
        offsets[mainAxis] = offsets[mainAxis] + (reference[len] / 2 - element[len] / 2);
        break;
    }
  }

  return offsets;
}

function detectOverflow(state, options) {
  if (options === void 0) {
    options = {};
  }

  var _options = options,
      _options$placement = _options.placement,
      placement = _options$placement === void 0 ? state.placement : _options$placement,
      _options$boundary = _options.boundary,
      boundary = _options$boundary === void 0 ? clippingParents : _options$boundary,
      _options$rootBoundary = _options.rootBoundary,
      rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary,
      _options$elementConte = _options.elementContext,
      elementContext = _options$elementConte === void 0 ? popper : _options$elementConte,
      _options$altBoundary = _options.altBoundary,
      altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary,
      _options$padding = _options.padding,
      padding = _options$padding === void 0 ? 0 : _options$padding;
  var paddingObject = mergePaddingObject(typeof padding !== 'number' ? padding : expandToHashMap(padding, basePlacements));
  var altContext = elementContext === popper ? reference : popper;
  var referenceElement = state.elements.reference;
  var popperRect = state.rects.popper;
  var element = state.elements[altBoundary ? altContext : elementContext];
  var clippingClientRect = getClippingRect(isElement(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary);
  var referenceClientRect = getBoundingClientRect(referenceElement);
  var popperOffsets = computeOffsets({
    reference: referenceClientRect,
    element: popperRect,
    strategy: 'absolute',
    placement: placement
  });
  var popperClientRect = rectToClientRect(Object.assign({}, popperRect, popperOffsets));
  var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect; // positive = overflowing the clipping rect
  // 0 or negative = within the clipping rect

  var overflowOffsets = {
    top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
    bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
    left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
    right: elementClientRect.right - clippingClientRect.right + paddingObject.right
  };
  var offsetData = state.modifiersData.offset; // Offsets can be applied only to the popper element

  if (elementContext === popper && offsetData) {
    var offset = offsetData[placement];
    Object.keys(overflowOffsets).forEach(function (key) {
      var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
      var axis = [top, bottom].indexOf(key) >= 0 ? 'y' : 'x';
      overflowOffsets[key] += offset[axis] * multiply;
    });
  }

  return overflowOffsets;
}

function computeAutoPlacement(state, options) {
  if (options === void 0) {
    options = {};
  }

  var _options = options,
      placement = _options.placement,
      boundary = _options.boundary,
      rootBoundary = _options.rootBoundary,
      padding = _options.padding,
      flipVariations = _options.flipVariations,
      _options$allowedAutoP = _options.allowedAutoPlacements,
      allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
  var variation = getVariation(placement);
  var placements$1 = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function (placement) {
    return getVariation(placement) === variation;
  }) : basePlacements;
  var allowedPlacements = placements$1.filter(function (placement) {
    return allowedAutoPlacements.indexOf(placement) >= 0;
  });

  if (allowedPlacements.length === 0) {
    allowedPlacements = placements$1;

    if (process.env.NODE_ENV !== "production") {
      console.error(['Popper: The `allowedAutoPlacements` option did not allow any', 'placements. Ensure the `placement` option matches the variation', 'of the allowed placements.', 'For example, "auto" cannot be used to allow "bottom-start".', 'Use "auto-start" instead.'].join(' '));
    }
  } // $FlowFixMe[incompatible-type]: Flow seems to have problems with two array unions...


  var overflows = allowedPlacements.reduce(function (acc, placement) {
    acc[placement] = detectOverflow(state, {
      placement: placement,
      boundary: boundary,
      rootBoundary: rootBoundary,
      padding: padding
    })[getBasePlacement(placement)];
    return acc;
  }, {});
  return Object.keys(overflows).sort(function (a, b) {
    return overflows[a] - overflows[b];
  });
}

function getExpandedFallbackPlacements(placement) {
  if (getBasePlacement(placement) === auto) {
    return [];
  }

  var oppositePlacement = getOppositePlacement(placement);
  return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
}

function flip(_ref) {
  var state = _ref.state,
      options = _ref.options,
      name = _ref.name;

  if (state.modifiersData[name]._skip) {
    return;
  }

  var _options$mainAxis = options.mainAxis,
      checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
      _options$altAxis = options.altAxis,
      checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis,
      specifiedFallbackPlacements = options.fallbackPlacements,
      padding = options.padding,
      boundary = options.boundary,
      rootBoundary = options.rootBoundary,
      altBoundary = options.altBoundary,
      _options$flipVariatio = options.flipVariations,
      flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio,
      allowedAutoPlacements = options.allowedAutoPlacements;
  var preferredPlacement = state.options.placement;
  var basePlacement = getBasePlacement(preferredPlacement);
  var isBasePlacement = basePlacement === preferredPlacement;
  var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
  var placements = [preferredPlacement].concat(fallbackPlacements).reduce(function (acc, placement) {
    return acc.concat(getBasePlacement(placement) === auto ? computeAutoPlacement(state, {
      placement: placement,
      boundary: boundary,
      rootBoundary: rootBoundary,
      padding: padding,
      flipVariations: flipVariations,
      allowedAutoPlacements: allowedAutoPlacements
    }) : placement);
  }, []);
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var checksMap = new Map();
  var makeFallbackChecks = true;
  var firstFittingPlacement = placements[0];

  for (var i = 0; i < placements.length; i++) {
    var placement = placements[i];

    var _basePlacement = getBasePlacement(placement);

    var isStartVariation = getVariation(placement) === start;
    var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
    var len = isVertical ? 'width' : 'height';
    var overflow = detectOverflow(state, {
      placement: placement,
      boundary: boundary,
      rootBoundary: rootBoundary,
      altBoundary: altBoundary,
      padding: padding
    });
    var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;

    if (referenceRect[len] > popperRect[len]) {
      mainVariationSide = getOppositePlacement(mainVariationSide);
    }

    var altVariationSide = getOppositePlacement(mainVariationSide);
    var checks = [];

    if (checkMainAxis) {
      checks.push(overflow[_basePlacement] <= 0);
    }

    if (checkAltAxis) {
      checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
    }

    if (checks.every(function (check) {
      return check;
    })) {
      firstFittingPlacement = placement;
      makeFallbackChecks = false;
      break;
    }

    checksMap.set(placement, checks);
  }

  if (makeFallbackChecks) {
    // `2` may be desired in some cases – research later
    var numberOfChecks = flipVariations ? 3 : 1;

    var _loop = function _loop(_i) {
      var fittingPlacement = placements.find(function (placement) {
        var checks = checksMap.get(placement);

        if (checks) {
          return checks.slice(0, _i).every(function (check) {
            return check;
          });
        }
      });

      if (fittingPlacement) {
        firstFittingPlacement = fittingPlacement;
        return "break";
      }
    };

    for (var _i = numberOfChecks; _i > 0; _i--) {
      var _ret = _loop(_i);

      if (_ret === "break") break;
    }
  }

  if (state.placement !== firstFittingPlacement) {
    state.modifiersData[name]._skip = true;
    state.placement = firstFittingPlacement;
    state.reset = true;
  }
} // eslint-disable-next-line import/no-unused-modules


var flip$1 = {
  name: 'flip',
  enabled: true,
  phase: 'main',
  fn: flip,
  requiresIfExists: ['offset'],
  data: {
    _skip: false
  }
};

function getSideOffsets(overflow, rect, preventedOffsets) {
  if (preventedOffsets === void 0) {
    preventedOffsets = {
      x: 0,
      y: 0
    };
  }

  return {
    top: overflow.top - rect.height - preventedOffsets.y,
    right: overflow.right - rect.width + preventedOffsets.x,
    bottom: overflow.bottom - rect.height + preventedOffsets.y,
    left: overflow.left - rect.width - preventedOffsets.x
  };
}

function isAnySideFullyClipped(overflow) {
  return [top, right, bottom, left].some(function (side) {
    return overflow[side] >= 0;
  });
}

function hide(_ref) {
  var state = _ref.state,
      name = _ref.name;
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var preventedOffsets = state.modifiersData.preventOverflow;
  var referenceOverflow = detectOverflow(state, {
    elementContext: 'reference'
  });
  var popperAltOverflow = detectOverflow(state, {
    altBoundary: true
  });
  var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
  var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
  var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
  var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
  state.modifiersData[name] = {
    referenceClippingOffsets: referenceClippingOffsets,
    popperEscapeOffsets: popperEscapeOffsets,
    isReferenceHidden: isReferenceHidden,
    hasPopperEscaped: hasPopperEscaped
  };
  state.attributes.popper = Object.assign({}, state.attributes.popper, {
    'data-popper-reference-hidden': isReferenceHidden,
    'data-popper-escaped': hasPopperEscaped
  });
} // eslint-disable-next-line import/no-unused-modules


var hide$1 = {
  name: 'hide',
  enabled: true,
  phase: 'main',
  requiresIfExists: ['preventOverflow'],
  fn: hide
};

function distanceAndSkiddingToXY(placement, rects, offset) {
  var basePlacement = getBasePlacement(placement);
  var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;

  var _ref = typeof offset === 'function' ? offset(Object.assign({}, rects, {
    placement: placement
  })) : offset,
      skidding = _ref[0],
      distance = _ref[1];

  skidding = skidding || 0;
  distance = (distance || 0) * invertDistance;
  return [left, right].indexOf(basePlacement) >= 0 ? {
    x: distance,
    y: skidding
  } : {
    x: skidding,
    y: distance
  };
}

function offset(_ref2) {
  var state = _ref2.state,
      options = _ref2.options,
      name = _ref2.name;
  var _options$offset = options.offset,
      offset = _options$offset === void 0 ? [0, 0] : _options$offset;
  var data = placements.reduce(function (acc, placement) {
    acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset);
    return acc;
  }, {});
  var _data$state$placement = data[state.placement],
      x = _data$state$placement.x,
      y = _data$state$placement.y;

  if (state.modifiersData.popperOffsets != null) {
    state.modifiersData.popperOffsets.x += x;
    state.modifiersData.popperOffsets.y += y;
  }

  state.modifiersData[name] = data;
} // eslint-disable-next-line import/no-unused-modules


var offset$1 = {
  name: 'offset',
  enabled: true,
  phase: 'main',
  requires: ['popperOffsets'],
  fn: offset
};

function popperOffsets(_ref) {
  var state = _ref.state,
      name = _ref.name;
  // Offsets are the actual position the popper needs to have to be
  // properly positioned near its reference element
  // This is the most basic placement, and will be adjusted by
  // the modifiers in the next step
  state.modifiersData[name] = computeOffsets({
    reference: state.rects.reference,
    element: state.rects.popper,
    strategy: 'absolute',
    placement: state.placement
  });
} // eslint-disable-next-line import/no-unused-modules


var popperOffsets$1 = {
  name: 'popperOffsets',
  enabled: true,
  phase: 'read',
  fn: popperOffsets,
  data: {}
};

function getAltAxis(axis) {
  return axis === 'x' ? 'y' : 'x';
}

function preventOverflow(_ref) {
  var state = _ref.state,
      options = _ref.options,
      name = _ref.name;
  var _options$mainAxis = options.mainAxis,
      checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
      _options$altAxis = options.altAxis,
      checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis,
      boundary = options.boundary,
      rootBoundary = options.rootBoundary,
      altBoundary = options.altBoundary,
      padding = options.padding,
      _options$tether = options.tether,
      tether = _options$tether === void 0 ? true : _options$tether,
      _options$tetherOffset = options.tetherOffset,
      tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
  var overflow = detectOverflow(state, {
    boundary: boundary,
    rootBoundary: rootBoundary,
    padding: padding,
    altBoundary: altBoundary
  });
  var basePlacement = getBasePlacement(state.placement);
  var variation = getVariation(state.placement);
  var isBasePlacement = !variation;
  var mainAxis = getMainAxisFromPlacement(basePlacement);
  var altAxis = getAltAxis(mainAxis);
  var popperOffsets = state.modifiersData.popperOffsets;
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var tetherOffsetValue = typeof tetherOffset === 'function' ? tetherOffset(Object.assign({}, state.rects, {
    placement: state.placement
  })) : tetherOffset;
  var data = {
    x: 0,
    y: 0
  };

  if (!popperOffsets) {
    return;
  }

  if (checkMainAxis || checkAltAxis) {
    var mainSide = mainAxis === 'y' ? top : left;
    var altSide = mainAxis === 'y' ? bottom : right;
    var len = mainAxis === 'y' ? 'height' : 'width';
    var offset = popperOffsets[mainAxis];
    var min$1 = popperOffsets[mainAxis] + overflow[mainSide];
    var max$1 = popperOffsets[mainAxis] - overflow[altSide];
    var additive = tether ? -popperRect[len] / 2 : 0;
    var minLen = variation === start ? referenceRect[len] : popperRect[len];
    var maxLen = variation === start ? -popperRect[len] : -referenceRect[len]; // We need to include the arrow in the calculation so the arrow doesn't go
    // outside the reference bounds

    var arrowElement = state.elements.arrow;
    var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
      width: 0,
      height: 0
    };
    var arrowPaddingObject = state.modifiersData['arrow#persistent'] ? state.modifiersData['arrow#persistent'].padding : getFreshSideObject();
    var arrowPaddingMin = arrowPaddingObject[mainSide];
    var arrowPaddingMax = arrowPaddingObject[altSide]; // If the reference length is smaller than the arrow length, we don't want
    // to include its full size in the calculation. If the reference is small
    // and near the edge of a boundary, the popper can overflow even if the
    // reference is not overflowing as well (e.g. virtual elements with no
    // width or height)

    var arrowLen = within(0, referenceRect[len], arrowRect[len]);
    var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - tetherOffsetValue : minLen - arrowLen - arrowPaddingMin - tetherOffsetValue;
    var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + tetherOffsetValue : maxLen + arrowLen + arrowPaddingMax + tetherOffsetValue;
    var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
    var clientOffset = arrowOffsetParent ? mainAxis === 'y' ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
    var offsetModifierValue = state.modifiersData.offset ? state.modifiersData.offset[state.placement][mainAxis] : 0;
    var tetherMin = popperOffsets[mainAxis] + minOffset - offsetModifierValue - clientOffset;
    var tetherMax = popperOffsets[mainAxis] + maxOffset - offsetModifierValue;

    if (checkMainAxis) {
      var preventedOffset = within(tether ? min(min$1, tetherMin) : min$1, offset, tether ? max(max$1, tetherMax) : max$1);
      popperOffsets[mainAxis] = preventedOffset;
      data[mainAxis] = preventedOffset - offset;
    }

    if (checkAltAxis) {
      var _mainSide = mainAxis === 'x' ? top : left;

      var _altSide = mainAxis === 'x' ? bottom : right;

      var _offset = popperOffsets[altAxis];

      var _min = _offset + overflow[_mainSide];

      var _max = _offset - overflow[_altSide];

      var _preventedOffset = within(tether ? min(_min, tetherMin) : _min, _offset, tether ? max(_max, tetherMax) : _max);

      popperOffsets[altAxis] = _preventedOffset;
      data[altAxis] = _preventedOffset - _offset;
    }
  }

  state.modifiersData[name] = data;
} // eslint-disable-next-line import/no-unused-modules


var preventOverflow$1 = {
  name: 'preventOverflow',
  enabled: true,
  phase: 'main',
  fn: preventOverflow,
  requiresIfExists: ['offset']
};

function getHTMLElementScroll(element) {
  return {
    scrollLeft: element.scrollLeft,
    scrollTop: element.scrollTop
  };
}

function getNodeScroll(node) {
  if (node === getWindow(node) || !isHTMLElement(node)) {
    return getWindowScroll(node);
  } else {
    return getHTMLElementScroll(node);
  }
}

// Composite means it takes into account transforms as well as layout.

function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
  if (isFixed === void 0) {
    isFixed = false;
  }

  var documentElement = getDocumentElement(offsetParent);
  var rect = getBoundingClientRect(elementOrVirtualElement);
  var isOffsetParentAnElement = isHTMLElement(offsetParent);
  var scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  var offsets = {
    x: 0,
    y: 0
  };

  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== 'body' || // https://github.com/popperjs/popper-core/issues/1078
    isScrollParent(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }

    if (isHTMLElement(offsetParent)) {
      offsets = getBoundingClientRect(offsetParent);
      offsets.x += offsetParent.clientLeft;
      offsets.y += offsetParent.clientTop;
    } else if (documentElement) {
      offsets.x = getWindowScrollBarX(documentElement);
    }
  }

  return {
    x: rect.left + scroll.scrollLeft - offsets.x,
    y: rect.top + scroll.scrollTop - offsets.y,
    width: rect.width,
    height: rect.height
  };
}

function order(modifiers) {
  var map = new Map();
  var visited = new Set();
  var result = [];
  modifiers.forEach(function (modifier) {
    map.set(modifier.name, modifier);
  }); // On visiting object, check for its dependencies and visit them recursively

  function sort(modifier) {
    visited.add(modifier.name);
    var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
    requires.forEach(function (dep) {
      if (!visited.has(dep)) {
        var depModifier = map.get(dep);

        if (depModifier) {
          sort(depModifier);
        }
      }
    });
    result.push(modifier);
  }

  modifiers.forEach(function (modifier) {
    if (!visited.has(modifier.name)) {
      // check for visited object
      sort(modifier);
    }
  });
  return result;
}

function orderModifiers(modifiers) {
  // order based on dependencies
  var orderedModifiers = order(modifiers); // order based on phase

  return modifierPhases.reduce(function (acc, phase) {
    return acc.concat(orderedModifiers.filter(function (modifier) {
      return modifier.phase === phase;
    }));
  }, []);
}

function debounce(fn) {
  var pending;
  return function () {
    if (!pending) {
      pending = new Promise(function (resolve) {
        Promise.resolve().then(function () {
          pending = undefined;
          resolve(fn());
        });
      });
    }

    return pending;
  };
}

function format(str) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  return [].concat(args).reduce(function (p, c) {
    return p.replace(/%s/, c);
  }, str);
}

var INVALID_MODIFIER_ERROR = 'Popper: modifier "%s" provided an invalid %s property, expected %s but got %s';
var MISSING_DEPENDENCY_ERROR = 'Popper: modifier "%s" requires "%s", but "%s" modifier is not available';
var VALID_PROPERTIES = ['name', 'enabled', 'phase', 'fn', 'effect', 'requires', 'options'];
function validateModifiers(modifiers) {
  modifiers.forEach(function (modifier) {
    Object.keys(modifier).forEach(function (key) {
      switch (key) {
        case 'name':
          if (typeof modifier.name !== 'string') {
            console.error(format(INVALID_MODIFIER_ERROR, String(modifier.name), '"name"', '"string"', "\"" + String(modifier.name) + "\""));
          }

          break;

        case 'enabled':
          if (typeof modifier.enabled !== 'boolean') {
            console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"enabled"', '"boolean"', "\"" + String(modifier.enabled) + "\""));
          }

        case 'phase':
          if (modifierPhases.indexOf(modifier.phase) < 0) {
            console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"phase"', "either " + modifierPhases.join(', '), "\"" + String(modifier.phase) + "\""));
          }

          break;

        case 'fn':
          if (typeof modifier.fn !== 'function') {
            console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"fn"', '"function"', "\"" + String(modifier.fn) + "\""));
          }

          break;

        case 'effect':
          if (typeof modifier.effect !== 'function') {
            console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"effect"', '"function"', "\"" + String(modifier.fn) + "\""));
          }

          break;

        case 'requires':
          if (!Array.isArray(modifier.requires)) {
            console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"requires"', '"array"', "\"" + String(modifier.requires) + "\""));
          }

          break;

        case 'requiresIfExists':
          if (!Array.isArray(modifier.requiresIfExists)) {
            console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"requiresIfExists"', '"array"', "\"" + String(modifier.requiresIfExists) + "\""));
          }

          break;

        case 'options':
        case 'data':
          break;

        default:
          console.error("PopperJS: an invalid property has been provided to the \"" + modifier.name + "\" modifier, valid properties are " + VALID_PROPERTIES.map(function (s) {
            return "\"" + s + "\"";
          }).join(', ') + "; but \"" + key + "\" was provided.");
      }

      modifier.requires && modifier.requires.forEach(function (requirement) {
        if (modifiers.find(function (mod) {
          return mod.name === requirement;
        }) == null) {
          console.error(format(MISSING_DEPENDENCY_ERROR, String(modifier.name), requirement, requirement));
        }
      });
    });
  });
}

function uniqueBy(arr, fn) {
  var identifiers = new Set();
  return arr.filter(function (item) {
    var identifier = fn(item);

    if (!identifiers.has(identifier)) {
      identifiers.add(identifier);
      return true;
    }
  });
}

function mergeByName(modifiers) {
  var merged = modifiers.reduce(function (merged, current) {
    var existing = merged[current.name];
    merged[current.name] = existing ? Object.assign({}, existing, current, {
      options: Object.assign({}, existing.options, current.options),
      data: Object.assign({}, existing.data, current.data)
    }) : current;
    return merged;
  }, {}); // IE11 does not support Object.values

  return Object.keys(merged).map(function (key) {
    return merged[key];
  });
}

var INVALID_ELEMENT_ERROR = 'Popper: Invalid reference or popper argument provided. They must be either a DOM element or virtual element.';
var INFINITE_LOOP_ERROR = 'Popper: An infinite loop in the modifiers cycle has been detected! The cycle has been interrupted to prevent a browser crash.';
var DEFAULT_OPTIONS = {
  placement: 'bottom',
  modifiers: [],
  strategy: 'absolute'
};

function areValidElements() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return !args.some(function (element) {
    return !(element && typeof element.getBoundingClientRect === 'function');
  });
}

function popperGenerator(generatorOptions) {
  if (generatorOptions === void 0) {
    generatorOptions = {};
  }

  var _generatorOptions = generatorOptions,
      _generatorOptions$def = _generatorOptions.defaultModifiers,
      defaultModifiers = _generatorOptions$def === void 0 ? [] : _generatorOptions$def,
      _generatorOptions$def2 = _generatorOptions.defaultOptions,
      defaultOptions = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
  return function createPopper(reference, popper, options) {
    if (options === void 0) {
      options = defaultOptions;
    }

    var state = {
      placement: 'bottom',
      orderedModifiers: [],
      options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions),
      modifiersData: {},
      elements: {
        reference: reference,
        popper: popper
      },
      attributes: {},
      styles: {}
    };
    var effectCleanupFns = [];
    var isDestroyed = false;
    var instance = {
      state: state,
      setOptions: function setOptions(options) {
        cleanupModifierEffects();
        state.options = Object.assign({}, defaultOptions, state.options, options);
        state.scrollParents = {
          reference: isElement(reference) ? listScrollParents(reference) : reference.contextElement ? listScrollParents(reference.contextElement) : [],
          popper: listScrollParents(popper)
        }; // Orders the modifiers based on their dependencies and `phase`
        // properties

        var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers, state.options.modifiers))); // Strip out disabled modifiers

        state.orderedModifiers = orderedModifiers.filter(function (m) {
          return m.enabled;
        }); // Validate the provided modifiers so that the consumer will get warned
        // if one of the modifiers is invalid for any reason

        if (process.env.NODE_ENV !== "production") {
          var modifiers = uniqueBy([].concat(orderedModifiers, state.options.modifiers), function (_ref) {
            var name = _ref.name;
            return name;
          });
          validateModifiers(modifiers);

          if (getBasePlacement(state.options.placement) === auto) {
            var flipModifier = state.orderedModifiers.find(function (_ref2) {
              var name = _ref2.name;
              return name === 'flip';
            });

            if (!flipModifier) {
              console.error(['Popper: "auto" placements require the "flip" modifier be', 'present and enabled to work.'].join(' '));
            }
          }

          var _getComputedStyle = getComputedStyle(popper),
              marginTop = _getComputedStyle.marginTop,
              marginRight = _getComputedStyle.marginRight,
              marginBottom = _getComputedStyle.marginBottom,
              marginLeft = _getComputedStyle.marginLeft; // We no longer take into account `margins` on the popper, and it can
          // cause bugs with positioning, so we'll warn the consumer


          if ([marginTop, marginRight, marginBottom, marginLeft].some(function (margin) {
            return parseFloat(margin);
          })) {
            console.warn(['Popper: CSS "margin" styles cannot be used to apply padding', 'between the popper and its reference element or boundary.', 'To replicate margin, use the `offset` modifier, as well as', 'the `padding` option in the `preventOverflow` and `flip`', 'modifiers.'].join(' '));
          }
        }

        runModifierEffects();
        return instance.update();
      },
      // Sync update – it will always be executed, even if not necessary. This
      // is useful for low frequency updates where sync behavior simplifies the
      // logic.
      // For high frequency updates (e.g. `resize` and `scroll` events), always
      // prefer the async Popper#update method
      forceUpdate: function forceUpdate() {
        if (isDestroyed) {
          return;
        }

        var _state$elements = state.elements,
            reference = _state$elements.reference,
            popper = _state$elements.popper; // Don't proceed if `reference` or `popper` are not valid elements
        // anymore

        if (!areValidElements(reference, popper)) {
          if (process.env.NODE_ENV !== "production") {
            console.error(INVALID_ELEMENT_ERROR);
          }

          return;
        } // Store the reference and popper rects to be read by modifiers


        state.rects = {
          reference: getCompositeRect(reference, getOffsetParent(popper), state.options.strategy === 'fixed'),
          popper: getLayoutRect(popper)
        }; // Modifiers have the ability to reset the current update cycle. The
        // most common use case for this is the `flip` modifier changing the
        // placement, which then needs to re-run all the modifiers, because the
        // logic was previously ran for the previous placement and is therefore
        // stale/incorrect

        state.reset = false;
        state.placement = state.options.placement; // On each update cycle, the `modifiersData` property for each modifier
        // is filled with the initial data specified by the modifier. This means
        // it doesn't persist and is fresh on each update.
        // To ensure persistent data, use `${name}#persistent`

        state.orderedModifiers.forEach(function (modifier) {
          return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
        });
        var __debug_loops__ = 0;

        for (var index = 0; index < state.orderedModifiers.length; index++) {
          if (process.env.NODE_ENV !== "production") {
            __debug_loops__ += 1;

            if (__debug_loops__ > 100) {
              console.error(INFINITE_LOOP_ERROR);
              break;
            }
          }

          if (state.reset === true) {
            state.reset = false;
            index = -1;
            continue;
          }

          var _state$orderedModifie = state.orderedModifiers[index],
              fn = _state$orderedModifie.fn,
              _state$orderedModifie2 = _state$orderedModifie.options,
              _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2,
              name = _state$orderedModifie.name;

          if (typeof fn === 'function') {
            state = fn({
              state: state,
              options: _options,
              name: name,
              instance: instance
            }) || state;
          }
        }
      },
      // Async and optimistically optimized update – it will not be executed if
      // not necessary (debounced to run at most once-per-tick)
      update: debounce(function () {
        return new Promise(function (resolve) {
          instance.forceUpdate();
          resolve(state);
        });
      }),
      destroy: function destroy() {
        cleanupModifierEffects();
        isDestroyed = true;
      }
    };

    if (!areValidElements(reference, popper)) {
      if (process.env.NODE_ENV !== "production") {
        console.error(INVALID_ELEMENT_ERROR);
      }

      return instance;
    }

    instance.setOptions(options).then(function (state) {
      if (!isDestroyed && options.onFirstUpdate) {
        options.onFirstUpdate(state);
      }
    }); // Modifiers have the ability to execute arbitrary code before the first
    // update cycle runs. They will be executed in the same order as the update
    // cycle. This is useful when a modifier adds some persistent data that
    // other modifiers need to use, but the modifier is run after the dependent
    // one.

    function runModifierEffects() {
      state.orderedModifiers.forEach(function (_ref3) {
        var name = _ref3.name,
            _ref3$options = _ref3.options,
            options = _ref3$options === void 0 ? {} : _ref3$options,
            effect = _ref3.effect;

        if (typeof effect === 'function') {
          var cleanupFn = effect({
            state: state,
            name: name,
            instance: instance,
            options: options
          });

          var noopFn = function noopFn() {};

          effectCleanupFns.push(cleanupFn || noopFn);
        }
      });
    }

    function cleanupModifierEffects() {
      effectCleanupFns.forEach(function (fn) {
        return fn();
      });
      effectCleanupFns = [];
    }

    return instance;
  };
}

var defaultModifiers = [eventListeners, popperOffsets$1, computeStyles$1, applyStyles$1, offset$1, flip$1, preventOverflow$1, arrow$1, hide$1];
var createPopper = /*#__PURE__*/popperGenerator({
  defaultModifiers: defaultModifiers
}); // eslint-disable-next-line import/no-unused-modules

const wrapAround = (value, size) => {
    return ((value % size) + size) % size;
};
class Suggest {
    constructor(owner, containerEl, scope) {
        this.owner = owner;
        this.containerEl = containerEl;
        containerEl.on('click', '.suggestion-item', this.onSuggestionClick.bind(this));
        containerEl.on('mousemove', '.suggestion-item', this.onSuggestionMouseover.bind(this));
        scope.register([], 'ArrowUp', (event) => {
            if (!event.isComposing) {
                this.setSelectedItem(this.selectedItem - 1, true);
                return false;
            }
        });
        scope.register([], 'ArrowDown', (event) => {
            if (!event.isComposing) {
                this.setSelectedItem(this.selectedItem + 1, true);
                return false;
            }
        });
        scope.register([], 'Enter', (event) => {
            if (!event.isComposing) {
                this.useSelectedItem(event);
                return false;
            }
        });
    }
    onSuggestionClick(event, el) {
        event.preventDefault();
        const item = this.suggestions.indexOf(el);
        this.setSelectedItem(item, false);
        this.useSelectedItem(event);
    }
    onSuggestionMouseover(_event, el) {
        const item = this.suggestions.indexOf(el);
        this.setSelectedItem(item, false);
    }
    setSuggestions(values) {
        this.containerEl.empty();
        const suggestionEls = [];
        values.forEach((value) => {
            const suggestionEl = this.containerEl.createDiv('suggestion-item');
            this.owner.renderSuggestion(value, suggestionEl);
            suggestionEls.push(suggestionEl);
        });
        this.values = values;
        this.suggestions = suggestionEls;
        this.setSelectedItem(0, false);
    }
    useSelectedItem(event) {
        const currentValue = this.values[this.selectedItem];
        if (currentValue) {
            this.owner.selectSuggestion(currentValue, event);
        }
    }
    setSelectedItem(selectedIndex, scrollIntoView) {
        const normalizedIndex = wrapAround(selectedIndex, this.suggestions.length);
        const prevSelectedSuggestion = this.suggestions[this.selectedItem];
        const selectedSuggestion = this.suggestions[normalizedIndex];
        prevSelectedSuggestion === null || prevSelectedSuggestion === void 0 ? void 0 : prevSelectedSuggestion.removeClass('is-selected');
        selectedSuggestion === null || selectedSuggestion === void 0 ? void 0 : selectedSuggestion.addClass('is-selected');
        this.selectedItem = normalizedIndex;
        if (scrollIntoView) {
            selectedSuggestion.scrollIntoView(false);
        }
    }
}
class TextInputSuggest {
    constructor(app, inputEl) {
        this.app = app;
        this.inputEl = inputEl;
        this.scope = new obsidian.Scope();
        this.suggestEl = createDiv('suggestion-container');
        const suggestion = this.suggestEl.createDiv('suggestion');
        this.suggest = new Suggest(this, suggestion, this.scope);
        this.scope.register([], 'Escape', this.close.bind(this));
        this.inputEl.addEventListener('input', this.onInputChanged.bind(this));
        this.inputEl.addEventListener('focus', this.onInputChanged.bind(this));
        this.inputEl.addEventListener('blur', this.close.bind(this));
        this.suggestEl.on('mousedown', '.suggestion-container', (event) => {
            event.preventDefault();
        });
    }
    onInputChanged() {
        const inputStr = this.inputEl.value;
        const suggestions = this.getSuggestions(inputStr);
        if (suggestions.length > 0) {
            this.suggest.setSuggestions(suggestions);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.open(this.app.dom.appContainerEl, this.inputEl);
        }
    }
    open(container, inputEl) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.app.keymap.pushScope(this.scope);
        container.appendChild(this.suggestEl);
        this.popper = createPopper(inputEl, this.suggestEl, {
            placement: 'bottom-start',
            modifiers: [
                {
                    name: 'sameWidth',
                    enabled: true,
                    fn: ({ state, instance }) => {
                        // Note: positioning needs to be calculated twice -
                        // first pass - positioning it according to the width of the popper
                        // second pass - position it with the width bound to the reference element
                        // we need to early exit to avoid an infinite loop
                        const targetWidth = `${state.rects.reference.width}px`;
                        if (state.styles.popper.width === targetWidth) {
                            return;
                        }
                        state.styles.popper.width = targetWidth;
                        instance.update();
                    },
                    phase: 'beforeWrite',
                    requires: ['computeStyles'],
                },
            ],
        });
    }
    close() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.app.keymap.popScope(this.scope);
        this.suggest.setSuggestions([]);
        this.popper.destroy();
        this.suggestEl.detach();
    }
}

class DanglingSettingsTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        let { containerEl } = this;
        const settings = Config.getSettings();
        this.containerEl.empty();
        this.containerEl.createEl('h2', {
            text: 'Settings',
        });
        this.containerEl.createEl('h4', {
            text: 'You can ignore folders (and their subfolders) with entries you add here.',
        });
        settings.ignoredFolders.forEach((folder, index) => {
            const div = containerEl.createEl('div');
            div.addClass('settings-div');
            new obsidian.Setting(containerEl)
                .setDesc(`Ignored Folder #${index + 1}`)
                .addExtraButton((extra) => {
                extra
                    .setIcon('cross')
                    .setTooltip('Delete')
                    .onClick(() => {
                    settings.ignoredFolders.remove(settings.ignoredFolders[index]);
                    // Force refresh
                    Config.saveSettings();
                    this.plugin.view.redraw();
                    this.display();
                });
            })
                .addText((text) => {
                const t = text
                    .setPlaceholder('Folder name')
                    .setValue(folder)
                    .onChange((newFolder) => {
                    settings.ignoredFolders[index] = newFolder;
                    Config.saveSettings();
                    this.plugin.view.redraw();
                });
                new FolderSuggest(this.app, text.inputEl);
                t.inputEl.addClass('templater_template');
                return t;
            });
        });
        const div = containerEl.createEl('div');
        div.addClass('div');
        const setting = new obsidian.Setting(containerEl).addButton((button) => {
            const b = button
                .setButtonText('Ignore another folder')
                .onClick(() => {
                settings.ignoredFolders.push('');
                // Force refresh
                this.display();
            });
            b.buttonEl.addClass('templater_button');
            return b;
        });
        setting.infoEl.remove();
        div.appendChild(containerEl.lastChild);
    }
}
class FolderSuggest extends TextInputSuggest {
    getSuggestions(inputStr) {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        const folders = [];
        const lowerCaseInputStr = inputStr.toLowerCase();
        abstractFiles.forEach((folder) => {
            if (folder instanceof obsidian.TFolder &&
                folder.path.toLowerCase().contains(lowerCaseInputStr)) {
                folders.push(folder);
            }
        });
        return folders;
    }
    renderSuggestion(file, el) {
        el.setText(file.path);
    }
    selectSuggestion(file) {
        this.inputEl.value = file.path;
        this.inputEl.trigger('input');
        this.close();
    }
}

function noop() { }
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error('Function called outside component initialization');
    return current_component;
}
function afterUpdate(fn) {
    get_current_component().$$.after_update.push(fn);
}
function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

/* view/Dangling.svelte generated by Svelte v3.29.7 */

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[17] = list[i][0];
	child_ctx[18] = list[i][1];
	child_ctx[19] = list;
	child_ctx[20] = i;
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[21] = list[i];
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[24] = list[i];
	return child_ctx;
}

// (69:4) {:else}
function create_else_block_1(ctx) {
	let path;
	let path_d_value;

	return {
		c() {
			path = svg_element("path");
			attr(path, "fill", "currentColor");
			attr(path, "stroke", "currentColor");
			attr(path, "d", path_d_value = /*navigationItem*/ ctx[24].iconPath);
		},
		m(target, anchor) {
			insert(target, path, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*navigationItems*/ 4 && path_d_value !== (path_d_value = /*navigationItem*/ ctx[24].iconPath)) {
				attr(path, "d", path_d_value);
			}
		},
		d(detaching) {
			if (detaching) detach(path);
		}
	};
}

// (67:4) {#if navigationItem.tabIdentifier == settings.selectedTab }
function create_if_block_1(ctx) {
	let path;
	let path_d_value;

	return {
		c() {
			path = svg_element("path");
			attr(path, "fill", "currentColor");
			attr(path, "stroke-width", "5");
			attr(path, "stroke", "currentColor");
			attr(path, "d", path_d_value = /*navigationItem*/ ctx[24].iconPath);
		},
		m(target, anchor) {
			insert(target, path, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*navigationItems*/ 4 && path_d_value !== (path_d_value = /*navigationItem*/ ctx[24].iconPath)) {
				attr(path, "d", path_d_value);
			}
		},
		d(detaching) {
			if (detaching) detach(path);
		}
	};
}

// (65:4) {#each navigationItems as navigationItem}
function create_each_block_2(ctx) {
	let span;
	let svg;
	let span_title_value;
	let mounted;
	let dispose;

	function select_block_type(ctx, dirty) {
		if (/*navigationItem*/ ctx[24].tabIdentifier == /*settings*/ ctx[4].selectedTab) return create_if_block_1;
		return create_else_block_1;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type(ctx);

	function click_handler() {
		return /*click_handler*/ ctx[9](/*navigationItem*/ ctx[24]);
	}

	return {
		c() {
			span = element("span");
			svg = svg_element("svg");
			if_block.c();
			attr(svg, "viewBox", "0 0 100 100");
			attr(svg, "class", "folder");
			attr(svg, "width", "20");
			attr(svg, "height", "20");
			attr(span, "class", "nav-action-button");
			attr(span, "title", span_title_value = /*navigationItem*/ ctx[24].title);
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, svg);
			if_block.m(svg, null);

			if (!mounted) {
				dispose = listen(span, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(svg, null);
				}
			}

			if (dirty & /*navigationItems*/ 4 && span_title_value !== (span_title_value = /*navigationItem*/ ctx[24].title)) {
				attr(span, "title", span_title_value);
			}
		},
		d(detaching) {
			if (detaching) detach(span);
			if_block.d();
			mounted = false;
			dispose();
		}
	};
}

// (88:12) {:else}
function create_else_block(ctx) {
	let li;
	let t0;
	let t1_value = /*dangle*/ ctx[21].line + 1 + "";
	let t1;
	let t2;
	let a;
	let t3_value = /*dangle*/ ctx[21].link + "";
	let t3;
	let a_href_value;
	let t4;
	let mounted;
	let dispose;

	function click_handler_2(...args) {
		return /*click_handler_2*/ ctx[11](/*dangle*/ ctx[21], ...args);
	}

	return {
		c() {
			li = element("li");
			t0 = text("line ");
			t1 = text(t1_value);
			t2 = text(": \n                \"");
			a = element("a");
			t3 = text(t3_value);
			t4 = text("\"\n            ");
			attr(a, "href", a_href_value = /*dangle*/ ctx[21].link);
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, t0);
			append(li, t1);
			append(li, t2);
			append(li, a);
			append(a, t3);
			append(li, t4);

			if (!mounted) {
				dispose = listen(a, "click", click_handler_2);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*dangling*/ 1 && t1_value !== (t1_value = /*dangle*/ ctx[21].line + 1 + "")) set_data(t1, t1_value);
			if (dirty & /*dangling*/ 1 && t3_value !== (t3_value = /*dangle*/ ctx[21].link + "")) set_data(t3, t3_value);

			if (dirty & /*dangling*/ 1 && a_href_value !== (a_href_value = /*dangle*/ ctx[21].link)) {
				attr(a, "href", a_href_value);
			}
		},
		d(detaching) {
			if (detaching) detach(li);
			mounted = false;
			dispose();
		}
	};
}

// (84:12) {#if dangle.path != index}
function create_if_block(ctx) {
	let li;
	let t0;
	let t1_value = /*dangle*/ ctx[21].filename + "";
	let t1;
	let t2;
	let t3_value = /*dangle*/ ctx[21].line + 1 + "";
	let t3;
	let t4;
	let a;
	let t5_value = /*dangle*/ ctx[21].link + "";
	let t5;
	let a_href_value;
	let t6;
	let mounted;
	let dispose;

	function click_handler_1(...args) {
		return /*click_handler_1*/ ctx[10](/*dangle*/ ctx[21], ...args);
	}

	return {
		c() {
			li = element("li");
			t0 = text("(");
			t1 = text(t1_value);
			t2 = text(") line ");
			t3 = text(t3_value);
			t4 = text(": \n                \"");
			a = element("a");
			t5 = text(t5_value);
			t6 = text("\"\n            ");
			attr(a, "href", a_href_value = /*dangle*/ ctx[21].link);
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, t0);
			append(li, t1);
			append(li, t2);
			append(li, t3);
			append(li, t4);
			append(li, a);
			append(a, t5);
			append(li, t6);

			if (!mounted) {
				dispose = listen(a, "click", click_handler_1);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*dangling*/ 1 && t1_value !== (t1_value = /*dangle*/ ctx[21].filename + "")) set_data(t1, t1_value);
			if (dirty & /*dangling*/ 1 && t3_value !== (t3_value = /*dangle*/ ctx[21].line + 1 + "")) set_data(t3, t3_value);
			if (dirty & /*dangling*/ 1 && t5_value !== (t5_value = /*dangle*/ ctx[21].link + "")) set_data(t5, t5_value);

			if (dirty & /*dangling*/ 1 && a_href_value !== (a_href_value = /*dangle*/ ctx[21].link)) {
				attr(a, "href", a_href_value);
			}
		},
		d(detaching) {
			if (detaching) detach(li);
			mounted = false;
			dispose();
		}
	};
}

// (83:12) {#each dangles as dangle}
function create_each_block_1(ctx) {
	let if_block_anchor;

	function select_block_type_1(ctx, dirty) {
		if (/*dangle*/ ctx[21].path != /*index*/ ctx[17]) return create_if_block;
		return create_else_block;
	}

	let current_block_type = select_block_type_1(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			}
		},
		d(detaching) {
			if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (78:0) {#each dangling as [index, dangles], cnt}
function create_each_block(ctx) {
	let details_1;
	let summary;
	let t0_value = /*index*/ ctx[17] + "";
	let t0;
	let t1;
	let ul;
	let t2;
	let details_1_id_value;
	let cnt = /*cnt*/ ctx[20];
	let mounted;
	let dispose;
	let each_value_1 = /*dangles*/ ctx[18];
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	const assign_details_1 = () => /*details_1_binding*/ ctx[12](details_1, cnt);
	const unassign_details_1 = () => /*details_1_binding*/ ctx[12](null, cnt);

	function click_handler_3(...args) {
		return /*click_handler_3*/ ctx[13](/*index*/ ctx[17], ...args);
	}

	return {
		c() {
			details_1 = element("details");
			summary = element("summary");
			t0 = text(t0_value);
			t1 = space();
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t2 = space();
			attr(details_1, "id", details_1_id_value = /*index*/ ctx[17]);
		},
		m(target, anchor) {
			insert(target, details_1, anchor);
			append(details_1, summary);
			append(summary, t0);
			append(details_1, t1);
			append(details_1, ul);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			append(details_1, t2);
			assign_details_1();

			if (!mounted) {
				dispose = listen(details_1, "click", click_handler_3);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*dangling*/ 1 && t0_value !== (t0_value = /*index*/ ctx[17] + "")) set_data(t0, t0_value);

			if (dirty & /*dangling, visitDangle*/ 3) {
				each_value_1 = /*dangles*/ ctx[18];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(ul, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_1.length;
			}

			if (dirty & /*dangling*/ 1 && details_1_id_value !== (details_1_id_value = /*index*/ ctx[17])) {
				attr(details_1, "id", details_1_id_value);
			}

			if (cnt !== /*cnt*/ ctx[20]) {
				unassign_details_1();
				cnt = /*cnt*/ ctx[20];
				assign_details_1();
			}
		},
		d(detaching) {
			if (detaching) detach(details_1);
			destroy_each(each_blocks, detaching);
			unassign_details_1();
			mounted = false;
			dispose();
		}
	};
}

function create_fragment(ctx) {
	let div1;
	let div0;
	let t0;
	let h3;
	let t2;
	let each_value_2 = /*navigationItems*/ ctx[2];
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	let each_value = /*dangling*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			div1 = element("div");
			div0 = element("div");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t0 = space();
			h3 = element("h3");
			h3.textContent = "Dangling links";
			t2 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(div0, "class", "nav-header");
			attr(div1, "id", "dangling-links");
			attr(div1, "class", "container");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(div0, null);
			}

			append(div1, t0);
			append(div1, h3);
			append(div1, t2);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div1, null);
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*navigationItems, handleClick, settings*/ 52) {
				each_value_2 = /*navigationItems*/ ctx[2];
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_2(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(div0, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_2.length;
			}

			if (dirty & /*dangling, details, expand, visitDangle*/ 75) {
				each_value = /*dangling*/ ctx[0];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div1);
			destroy_each(each_blocks_1, detaching);
			destroy_each(each_blocks, detaching);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P
			? value
			: new P(function (resolve) {
						resolve(value);
					});
		}

		return new (P || (P = Promise))(function (resolve, reject) {
				function fulfilled(value) {
					try {
						step(generator.next(value));
					} catch(e) {
						reject(e);
					}
				}

				function rejected(value) {
					try {
						step(generator["throw"](value));
					} catch(e) {
						reject(e);
					}
				}

				function step(result) {
					result.done
					? resolve(result.value)
					: adopt(result.value).then(fulfilled, rejected);
				}

				step((generator = generator.apply(thisArg, _arguments || [])).next());
			});
	};

	
	
	
	let { dangling } = $$props;
	let { visitDangle } = $$props;
	let { navigationItems } = $$props;
	let { sortableItems } = $$props;
	let { redraw } = $$props;
	let details = new Array();
	let settings = Config.getSettings();
	let activeNavigation = sortableItems.find(element => element.tabIdentifier == settings.selectedTab);
	init();

	afterUpdate(() => {
		$$invalidate(3, details = details.filter(detail => detail));

		details.forEach(detail => {
			if (settings.reducedIndices.contains(detail.id)) {
				detail.removeAttribute("open");
			} else {
				detail.setAttribute("open", "open");
			}
		});
	});

	function init() {
		return __awaiter(this, void 0, void 0, function* () {
			$$invalidate(4, settings = Config.getSettings());
			activeNavigation = sortableItems.find(element => element.tabIdentifier == settings.selectedTab);
			yield redraw();
		});
	}

	function handleClick(event) {
		event.onclick();
		init();
	}

	function expand(event, index) {
		if (event.target.tagName != "SUMMARY") {
			return;
		}

		if (settings.reducedIndices.contains(index)) {
			settings.reducedIndices.remove(index);
		} else {
			settings.reducedIndices.push(index);
		}

		Config.saveSettings();
	}

	onDestroy(() => null);
	const click_handler = navigationItem => handleClick(navigationItem);
	const click_handler_1 = (dangle, e) => visitDangle(dangle);
	const click_handler_2 = (dangle, e) => visitDangle(dangle);

	function details_1_binding($$value, cnt) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			details[cnt] = $$value;
			$$invalidate(3, details);
		});
	}

	const click_handler_3 = (index, event) => {
		expand(event, index);
	};

	$$self.$$set = $$props => {
		if ("dangling" in $$props) $$invalidate(0, dangling = $$props.dangling);
		if ("visitDangle" in $$props) $$invalidate(1, visitDangle = $$props.visitDangle);
		if ("navigationItems" in $$props) $$invalidate(2, navigationItems = $$props.navigationItems);
		if ("sortableItems" in $$props) $$invalidate(7, sortableItems = $$props.sortableItems);
		if ("redraw" in $$props) $$invalidate(8, redraw = $$props.redraw);
	};

	return [
		dangling,
		visitDangle,
		navigationItems,
		details,
		settings,
		handleClick,
		expand,
		sortableItems,
		redraw,
		click_handler,
		click_handler_1,
		click_handler_2,
		details_1_binding,
		click_handler_3
	];
}

class Dangling extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance, create_fragment, safe_not_equal, {
			dangling: 0,
			visitDangle: 1,
			navigationItems: 2,
			sortableItems: 7,
			redraw: 8
		});
	}
}

class Dangle {
    constructor(path, filename, lnk, ln, cl) {
        this.path = path;
        this.filename = filename;
        this.link = lnk;
        this.line = ln;
        this.col = cl;
    }
}

class DanglingNavigationItem {
    constructor(iconPath, tabIdentifier, title, app) {
        this.iconPath = iconPath;
        this.tabIdentifier = tabIdentifier;
        this.title = title;
        this.onclick = () => {
            Config.getSettings().selectedTab = this.tabIdentifier;
            Config.saveSettings();
        };
        this.app = app;
    }
}
class Sortable extends DanglingNavigationItem {
    sort(unsorted) {
        let settings = Config.getSettings();
        if (settings.sortOrder == SORT_ORDER.ASC) {
            return Array.from(unsorted).sort((a, b) => a[0].localeCompare(b[0]));
        }
        else {
            return Array.from(unsorted).sort((a, b) => b[0].localeCompare(a[0]));
        }
    }
    _getDanglingLinks(indexer = (dangle) => dangle.path) {
        let dangles = [];
        let danglingLinks = new Map();
        let ignoredFolders = Config.getSettings().ignoredFolders;
        for (let file of this.app.vault.getMarkdownFiles()) {
            if (ignoredFolders.find((ignoredFolder) => { var _a; return (_a = file.path) === null || _a === void 0 ? void 0 : _a.startsWith(ignoredFolder + '/'); })) {
                continue;
            }
            let meta = this.app.metadataCache.getFileCache(file);
            if (meta.links) {
                for (let link of meta.links) {
                    let linkPath = obsidian.getLinkpath(link.link);
                    // Try to resolve `SomeTargetFile` from context of file.path
                    let target = this.app.metadataCache.getFirstLinkpathDest(linkPath, file.path);
                    //con.log(`examining link ${link.link} in ${file.path}`);
                    if (target == null) {
                        // con.log(`found dangling link ${link.link} in ${file.path}`);
                        dangles.push(new Dangle(file.path, file.name, link.link, link.position.start.line, link.position.start.col));
                    }
                }
            }
        }
        dangles.forEach((dangle) => {
            let index = indexer(dangle);
            //index = index == '' ? this.app.vault.getName() : index;
            if (danglingLinks.has(index)) {
                var dangles = [...danglingLinks.get(index), dangle];
            }
            else {
                var dangles = [dangle];
            }
            // con.log(`adding ${dangles.length} dangling links for ${file.path}`);
            danglingLinks.set(index, dangles);
        });
        return danglingLinks;
    }
}

class DanglingFolderItem extends Sortable {
    constructor(app) {
        super(ICONS.FOLDER_ICON, NAVIGATION_TAB.FOLDER, 'Group by folder containing notes with dangling links', app);
    }
    getDanglingLinks() {
        let danglingLinks = this._getDanglingLinks((dangle) => dangle.path.substr(0, dangle.path.lastIndexOf('/')));
        return danglingLinks;
    }
}

class DanglingFileItem extends Sortable {
    constructor(app) {
        super(ICONS.FILE_ICON, NAVIGATION_TAB.FILE, 'Group by note containing dangling link', app);
    }
    getDanglingLinks() {
        let danglingLinks = this._getDanglingLinks((dangle) => dangle.path);
        return danglingLinks;
    }
}

class DanglingLinkItem extends Sortable {
    constructor(app) {
        super(ICONS.LINK_ICON, NAVIGATION_TAB.LINK, 'Group by dangling link', app);
    }
    getDanglingLinks() {
        let danglingLinks = this._getDanglingLinks((dangle) => dangle.link);
        return danglingLinks;
    }
}

class DanglingSortItem extends DanglingNavigationItem {
    constructor(app) {
        super(ICONS.SORT_ICON, NAVIGATION_TAB.SORT, 'Change sort order', app);
        this.onclick = () => {
            let settings = Config.getSettings();
            settings.sortOrder =
                settings.sortOrder == SORT_ORDER.ASC
                    ? SORT_ORDER.DESC
                    : SORT_ORDER.ASC;
            Config.saveSettings();
        };
    }
}

class DanglingLinksView extends obsidian.ItemView {
    constructor(leaf) {
        super(leaf);
        this.redraw = this.redraw.bind(this);
        this.visitDangle = this.visitDangle.bind(this);
        this.registerEvent(this.app.metadataCache.on('resolved', this.redraw));
        this.registerEvent(this.app.metadataCache.on('changed', this.redraw));
        this.sortableItems = [
            new DanglingFolderItem(this.app),
            new DanglingFileItem(this.app),
            new DanglingLinkItem(this.app),
        ];
        this.navigationItems = [
            ...this.sortableItems,
            new DanglingSortItem(this.app),
        ];
    }
    getViewType() {
        return VIEW_TYPE_DANGLING_LINKS;
    }
    getDisplayText() {
        return 'Dangling links';
    }
    getIcon() {
        return 'broken-link';
    }
    onClose() {
        if (this.dangling) {
            this.dangling.$destroy();
        }
        return Promise.resolve();
    }
    visitDangle(dangle) {
        let file = this.app.vault.getAbstractFileByPath(dangle.path);
        if (file instanceof obsidian.TFile) {
            let leaf = this.app.workspace.getUnpinnedLeaf();
            leaf.openFile(file).then(() => {
                if (leaf.view instanceof obsidian.MarkdownView) {
                    this.app.workspace.setActiveLeaf(leaf, true, true);
                    leaf.view.editor.setCursor(dangle.line, dangle.col);
                }
            });
        }
    }
    async onOpen() {
        let dangling = this.getDangling();
        this.dangling = new Dangling({
            target: this.contentEl,
            props: {
                visitDangle: this.visitDangle,
                redraw: this.redraw,
                dangling,
                sortableItems: this.sortableItems,
                navigationItems: this.navigationItems,
            },
        });
    }
    async redraw() {
        var _a;
        let dangling = this.getDangling();
        (_a = this.dangling) === null || _a === void 0 ? void 0 : _a.$set({ dangling });
    }
    getDangling() {
        let settings = Config.getSettings();
        let activeNavigation = this.sortableItems.find((element) => element.tabIdentifier == settings.selectedTab);
        return activeNavigation.sort(activeNavigation.getDanglingLinks());
    }
}

class DanglingLinkPlugin extends obsidian.Plugin {
    async onload() {
        await Config.loadSettings(this);
        this.registerView(VIEW_TYPE_DANGLING_LINKS, (leaf) => (this.view = new DanglingLinksView(leaf)));
        this.addCommand({
            id: 'show-dangling-links-view',
            name: 'Open view',
            callback: () => this.showPanel(),
        });
        this.addRibbonIcon('broken-link', 'Show dangling links panel', (e) => this.showPanel());
        this.addSettingTab(new DanglingSettingsTab(this.app, this));
    }
    showPanel() {
        this.app.workspace
            .getRightLeaf(true)
            .setViewState({ type: VIEW_TYPE_DANGLING_LINKS });
    }
    onunload() {
        this.app.workspace
            .getLeavesOfType(VIEW_TYPE_DANGLING_LINKS)
            .forEach((leaf) => leaf.detach());
    }
}

module.exports = DanglingLinkPlugin;


/* nosourcemap */