/**
 * @name Columnimate
 * @author Miguel Mota <hello@miguelmota.com>
 *
 * Gotta warn ya; code is ugly at the moment
 */

Columnimate = (function(opts) {
    'use strict';

    opts = opts || {};

    /* Defaults */

    var defaults = {
        container: '.columnimate-container',
        containerHeight: null,
        columns: {
            left: '.columnimate-column-left',
            right: '.columnimate-column-right'
        },
        columnHeight: null,
        sections: '.columnimate-section',
        next: '.columnimate-next',
        prev: '.columnimate-previous',
        animate: 'blur',
        transition: 2000,
        pagination: '.columnimate-pagination',
        onStart: noop(),
        onEnd: noop()
    };

    /* Elements */

    opts = merge(defaults, opts);

    var body = document.body;
    var container = element(opts.container);
    var sections = element(opts.sections);
    var section = sections;
    var columns = {
        left: element(opts.columns.left),
        right: element(opts.columns.right)
    };
    var next = element(opts.next);
    var prev = element(opts.prev);
    var pagination = element(opts.pagination);
    var invertedColumn = 'left';
    var sectionCount = size(columns[invertedColumn].querySelectorAll(opts.sections));
    var timer;
    var scrollPoints;
    var paginationAttributeName = 'data-columnimate-go-to';
    var paginationNextAttributeName = 'data-columnimate-next';
    var paginationPrevAttributeName = 'data-columnimate-prev';
    var scrollTime = 600;
    var slideStartCallback = opts.onStart;
    var slideEndCallback = opts.onEnd;
    var CURRENT_INDEX = 0;
    var PREV_INDEX = 0;

    var SCROLL_DIRECTION = null;
    var IS_ANIMATING = false;

    /* Functions */

    function noop() {
        return function(){};
    }

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

    function existy(x) {
        return x != null;
    }

    function truthy(x) {
        return x !== false;
    }

    function falsy(x) {
        return !truthy(x);
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
        var elements = document.querySelectorAll(selector);
        return elements.length && elements.length > 1 ? elements : (elements.length ? elements[0] : null);
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

    function height(el) {
        for (var i = 0; i < el.length; i++) {
            return el[i].offsetHeight;
        }
        return el.offsetHeight;
    }

    function setHeight(el, height) {
        for (var i = 0; i < el.length; i++) {
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
    }

    function half(n) {
        return n / 2;
    }

    function sum() {
        return _.reduce(flat(arguments), function (acc, n) {
            return acc += n;
        }, 0);
    }

    function containerHeight() {
        if (typeof opts.containerHeight === 'function') {
            return opts.containerHeight();
        } else if (existy(opts.containerHeight)) {
            return opts.containerHeight;
        } else {
            return columnHeight() * sectionCount;
        }
    }

    function columnHeight() {
        if (typeof opts.columnHeight === 'function') {
            return opts.columnHeight();
        } else if (existy(opts.columnHeight)) {
            return opts.columnHeight;
        } else {
            return height(columns[invertedColumn]);
        }
    }

    function columnOffset() {
        return columnHeight() - containerHeight();
    }

    function boxHeight() {
        return columnHeight();
    }

    function absoluteMarginTop(el) {
        return Math.abs(parseInt(getCssProp(el, 'margin-top'), 10));
    }

    function scrollNext() {
        var leftVal = -(absoluteMarginTop(columns[invertedColumn]) - boxHeight());
        var rightVal = -(absoluteMarginTop(columns.right) + boxHeight());
        if (absoluteMarginTop(columns[invertedColumn]) > 0 ) {
            setColumnMarginTop('left', leftVal);
            setColumnMarginTop('right', rightVal);
            paginationButton(next, 'show');
            paginationButton(prev, 'show');
            PREV_INDEX = currentIndex();
            slideStartCallback(PREV_INDEX);
        } else {
            paginationButton(next, 'hide');
        }

        animateCallback();
    }

    function scrollPrev() {

        var leftVal = -(absoluteMarginTop(columns[invertedColumn]) + boxHeight());
        var rightVal = -(absoluteMarginTop(columns.right) - boxHeight());
        if (absoluteMarginTop(columns.right) > 0 ) {
            setColumnMarginTop('left', leftVal);
            setColumnMarginTop('right', rightVal);
            paginationButton(next, 'show');
            PREV_INDEX = currentIndex();
            slideStartCallback(PREV_INDEX);
        } else {
            paginationButton(next, 'hide');
        }

        animateCallback();
    }

    function animateCallback() {
        var animateTimeout = setTimeout(function() {
            clearTimeout(animateTimeout);
            removeClass(container, 'columnimate-blur');
            if ( Math.abs(parseInt(getCssProp(columns[invertedColumn], 'margin-top'), 10)) <= 0 ) {
                paginationButton(next, 'hide');
            }
            if ( Math.abs(parseInt(getCssProp(columns.right, 'margin-top'), 10)) <= 0 ) {
                paginationButton(prev, 'hide');
            }
            CURRENT_INDEX = currentIndex();
            slideEndCallback(PREV_INDEX, CURRENT_INDEX);
        }, scrollTime);
    }

    function paginationButton(button, display) {
        if (button) {
            button.style.display = (display === 'show') ? 'block' : 'none';
        }
    }

    function setColumnMarginTop(column, amount, callback) {
        addClass(container, 'columnimate-blur');
        return setCss(columns[column], {
            marginTop: [amount, 'px'].join('')
        });
    }

    function mouseWheelScroll(event) {
        if (IS_ANIMATING) {
            event.preventDefault();
            return;
        }

        IS_ANIMATING = true;
        SCROLL_DIRECTION = scrollDirection(event.wheelDelta);
        animate();
    }

    function animate() {

        if (SCROLL_DIRECTION === 'down') {
            scrollNext();
        } else {
            scrollPrev();
        }

        timer = setTimeout(function() {
            clearTimeout(timer);
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

    function anchor(i) {
        var a = document.createElement('a');
        a.setAttribute(paginationAttributeName, i);
        a.textContent = i;
        return a;
    }

    function paginationLinks() {
        if (!pagination) return;
        pagination.innerHTML = '';
        for (var i = 1; i <= scrollPoints.length; i++) {
            pagination.appendChild(anchor(i));
        }
    }

    function setScrollPoints() {
        scrollPoints = [];
        for (var i = 1; i <= sectionCount; i++) {
            scrollPoints.push(Math.abs(((containerHeight() / sectionCount) * i) - containerHeight()));
        }
        scrollPoints.reverse();
        return scrollPoints;
    }

    function init() {
        setHeight(columns.left, containerHeight() * sectionCount);
        setHeight(columns.right, containerHeight() * sectionCount);
        setHeight(sections, boxHeight());
        setMarginTop(columns[invertedColumn], -Math.abs(columnOffset()));
        setMarginTop(columns.right, 0);
        if (pagination) {
            paginationButton(prev, 'hide');
        }
        setTimeout(function() {
            addClass(columns.left, 'columnimate-column');
            addClass(columns.right, 'columnimate-column');
            addClass(columns.left, 'columnimate-column-left');
            addClass(columns.right, 'columnimate-column-right');
        }, 0);
        setScrollPoints();
        paginationLinks();
    }

    function paginationNavigate(e) {
        if (e.target.hasAttribute(paginationAttributeName)) {
            goTo(e.target.getAttribute(paginationAttributeName));
        }
        if (e.target.hasAttribute(paginationNextAttributeName)) {
            scrollNext();
        }
        if (e.target.hasAttribute(paginationPrevAttributeName)) {
            scrollPrev();
        }
    }

    addEvent(window, 'resize', resize);
    addEvent(window, 'mousewheel', mouseWheelScroll);
    if (next && prev) {
        addEvent(next, 'click', scrollNext);
        addEvent(prev, 'click', scrollPrev);
    }
    addEvent(document, 'click', paginationNavigate);

    swipedetect(container, function(swipeDirection){
        SCROLL_DIRECTION = (swipeDirection === 'down' ? 'up' : 'down');
        animate();
    });

    function currentTopPosition() {
        return absoluteMarginTop(columns.right);
    }

    function currentIndex() {
        return scrollPoints.indexOf(currentTopPosition());
    }

    function goTo(index) {
        if (scrollPoints[index - 1] > currentTopPosition()) {
            scrollNext();
            for (var i = currentIndex(); i < index-2; i++) {
                (function() {
                    setTimeout(function() {
                        scrollNext();
                    }, scrollTime);
                })();
            }
        }

        if (scrollPoints[index - 1] < currentTopPosition()) {
           scrollPrev();
            for (var i = index-1; i < currentIndex(); i++) {
                (function() {
                    setTimeout(function() {
                        scrollPrev();
                    }, scrollTime);
                })();
            }
        }
    }

    init();

    return {
        goTo: goTo,
        scrollNext: scrollNext,
        scrollPrev: scrollPrev
    };
});

/**
 * @credit http://www.javascriptkit.com/javatutors/touchevents2.shtml
 */
function swipedetect(el, callback){

    var touchsurface = el,
    swipedir,
    startX,
    startY,
    distX,
    distY,
    threshold = 150, //required min distance traveled to be considered swipe
    restraint = 100, // maximum distance allowed at the same time in perpendicular direction
    allowedTime = 300, // maximum time allowed to travel that distance
    elapsedTime,
    startTime,
    handleswipe = callback || function(swipedir){};

    touchsurface.addEventListener('touchstart', function(e){
        var touchobj = e.changedTouches[0];
        swipedir = 'none';
        dist = 0;
        startX = touchobj.pageX;
        startY = touchobj.pageY;
        startTime = new Date().getTime();
        e.preventDefault();

    }, false);

    touchsurface.addEventListener('touchmove', function(e){
        e.preventDefault();
    }, false);

    touchsurface.addEventListener('touchend', function(e){
        var touchobj = e.changedTouches[0];
        distX = touchobj.pageX - startX; // get horizontal dist traveled by finger while in contact with surface
        distY = touchobj.pageY - startY; // get vertical dist traveled by finger while in contact with surface
        elapsedTime = new Date().getTime() - startTime; // get time elapsed
        if (elapsedTime <= allowedTime) { // first condition for awipe met
            if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint){ // 2nd condition for horizontal swipe met
                swipedir = (distX < 0)? 'left' : 'right'; // if dist traveled is negative, it indicates left swipe
            } else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint) { // 2nd condition for vertical swipe met
                swipedir = (distY < 0)? 'up' : 'down'; // if dist traveled is negative, it indicates up swipe
            }
        }
        handleswipe(swipedir);
        e.preventDefault();
    }, false);
}
