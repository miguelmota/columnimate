Columnimate = function(opts) {
    opts = opts || {};

    var defaults = {
        container: '.columnimate-container',
        columns: {
            left: '.columnimate-column-left',
            right: '.columnimate-column-right'
        },
        sections: '.columnimate-section',
        next: '.columnimate-next',
        prev: '.columnimate-previous',
        animate: 'blur',
        transition: 2000
    };

    function merge(obj1, obj2){
        var obj3 = {},
        attrname;
        for (attrname in obj1) {
            obj3[attrname] = obj1[attrname];
        }
        for (attrname in obj2) {
            obj3[attrname] = obj2[attrname];
        }
        return obj3;
    }

    function hasClass(elem, className) {
        return new RegExp(' ' + className + ' ').test(' ' + elem.className + ' ');
    }

    function addClass(elem, className) {
        if (!hasClass(elem, className)) {
            elem.className += ' ' + className;
        }
    }

    function removeClass(elem, className) {
        var newClass = ' ' + elem.className.replace( /[\t\r\n]/g, ' ') + ' ';
        if (hasClass(elem, className)) {
            while (newClass.indexOf(' ' + className + ' ') >= 0 ) {
                newClass = newClass.replace(' ' + className + ' ', ' ');
            }
            elem.className = newClass.replace(/^\s+|\s+$/g, '');
        }
    }

    function element(selector) {
        return document.querySelectorAll(selector);
    }

    function forOwn(obj, func) {
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                func(k, obj[k]);
            }
        }
    }

    function addEvent(element, eventName, func) {
        if (element.addEventListener) {
            return element.addEventListener(eventName, func, false);
        } else if (element.attachEvent) {
            return element.attachEvent("on" + eventName, func);
        }
    }

    function flat(ary) {
        return [].concat.apply([], Array.isArray(ary) ? ary.map(function(item) {
            return Array.isArray(item) ? flat(item) : item;
        }) : [ary]);
    }

    function isElement(o){
        return (
            typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
            o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
        );
    }

    function isNode(o){
        return (
            typeof Node === "object" ? o instanceof Node :
            o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
        );
    }

    function getCssProp(el, prop) {
        return window.getComputedStyle(el).getPropertyValue(prop);
    }

    opts = merge(defaults, opts);

    /* Elements */

    var body = document.body;
    var container = element(opts.container)[0];
    var sections = element(opts.sections);
    var section = sections[0];
    var columns = {
        left: element(opts.columns.left)[0],
        right: element(opts.columns.right)[0]
    };
    var next = element(opts.next)[0];
    var prev = element(opts.prev)[0];
    var invertedColumn = 'left';
    var sectionCount = size(columns[invertedColumn].querySelectorAll(opts.sections));
    var timer;

    var SCROLL_DIRECTION = null;
    var IS_ANIMATING = false;

    /* Helpers */

    function height(el) {
        for (var i = 0; i < el.length; i++) {
           return el[i].offsetHeight;
        }
        return el.offsetHeight;
    }

    function setHeight(el, height) {
        for (var i = 0; i < el.length; i++) {
            console.log(el[i], height);
            el[i].style.height = [height, 'px'].join('');
        }
    }

    function size(ary) {
        return ary.length;
    }

    function bodyHeight() {
        return height(body);
    }

    function setMarginTop(el, amount) {
        el.style.marginTop = [amount, 'px'].join('');
    }

    function setCss(el, obj) {
        forOwn(obj, function(key, value) {
            el.style[key] = value;
        });
    console.log(el);
    }

    function half(n) {
        return n / 2;
    }

    function sum() {
        return _.reduce(flat(arguments), function (acc, n) {
            return acc += n;
        }, 0);
    }

    /* Applied functions */

    function containerHeight() {
        //return height(container);
        return columnHeight() * sectionCount;
    }

    function columnHeight() {
        return height(columns[invertedColumn]);
    }

    function columnOffset() {
        return columnHeight() - containerHeight();
    }

    function boxHeight() {
        //return columnHeight() / sectionCount;
        return columnHeight();
    }

    function scrollNext() {
        var leftVal = -(Math.abs(parseInt(getCssProp(columns[invertedColumn], 'margin-top'), 10)) - boxHeight());
        var rightVal = -(Math.abs(parseInt(getCssProp(columns['right'], 'margin-top'), 10)) + boxHeight());
        if ( Math.abs(parseInt(getCssProp(columns[invertedColumn], 'margin-top'), 10)) > 0 ) {
            setColumnMarginTop('left', leftVal);
            setColumnMarginTop('right', rightVal);
            paginationButton(next, 'show')
            paginationButton(prev, 'show')
        } else {
            paginationButton(next, 'hide')
        }

        animateCallback();
    }

    function scrollPrev() {

        var leftVal = -(Math.abs(parseInt(getCssProp(columns[invertedColumn], 'margin-top'), 10)) + boxHeight());
        var rightVal = -(Math.abs(parseInt(getCssProp(columns['right'], 'margin-top'), 10)) - boxHeight());
        if ( Math.abs(parseInt(getCssProp(columns['right'], 'margin-top'), 10)) > 0 ) {
            setColumnMarginTop('left', leftVal);
            setColumnMarginTop('right', rightVal);
            paginationButton(next, 'show')
        } else {
            paginationButton(next, 'hide')
        }

        animateCallback();
    }

    function animateCallback() {
        clearTimeout(this.animateTimeout);
        this.animateTimeout = setTimeout(function() {
            removeClass(container, 'columnimate-blur');
            if ( Math.abs(parseInt(getCssProp(columns[invertedColumn], 'margin-top'), 10)) <= 0 ) {
                paginationButton(next, 'hide')
            }
            if ( Math.abs(parseInt(getCssProp(columns['right'], 'margin-top'), 10)) <= 0 ) {
                paginationButton(prev, 'hide')
            }
        }, 600);
    }

    function paginationButton(button, display) {
        button.style.display = (display === 'show') ? 'block' : 'none';
    }

    function setColumnMarginTop(column, amount, callback) {
        addClass(container, 'columnimate-blur');
        console.log([amount, 'px'].join(''));
        return setCss(columns[column], {
            marginTop: [amount, 'px'].join('')
        });
    }

    /* Implementation */

    function mouseWheelScroll(event) {
        if (IS_ANIMATING === true) {
            event.preventDefault();
            return;
        }

        IS_ANIMATING = true;
        SCROLL_DIRECTION = scrollDirection(event.wheelDelta);
        console.log(SCROLL_DIRECTION);
        if (SCROLL_DIRECTION === 'down') {
            scrollNext();
        } else {
            scrollPrev();
        }

        timer = setTimeout(function() {
            IS_ANIMATING = false;
        }, 2000);
    }

    function scrollDirection(delta) {
        if (delta >= 0) {
            return 'up';
        } else {
            return 'down';
        }
    }

    function resize() {
        init();
    }

    function init() {
        setHeight(columns.left, containerHeight() * sectionCount);
        setHeight(columns.right, containerHeight() * sectionCount);
        setHeight(sections, boxHeight());
        setMarginTop(columns[invertedColumn], -Math.abs(columnOffset()));
        setMarginTop(columns['right'], 0);
        paginationButton(prev, 'hide');
        setTimeout(function() {
            addClass(columns.left, 'columnimate-column');
            addClass(columns.right, 'columnimate-column');
        }, 0);
        console.log('containerHeight', containerHeight());
        console.log('columnOffset', columnOffset());
    }

    /* Bindings */

    addEvent(window, 'resize', resize);
    addEvent(window, 'mousewheel', mouseWheelScroll);
    addEvent(next, 'click', scrollNext);
    addEvent(prev, 'click', scrollPrev);

    /* Start */

    init();
};
