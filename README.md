# Columnimate v0.0.2

Simple column sliding animation

## Demo

[http://lab.miguelmota.com/columnimate/demo.html](http://lab.miguelmota.com/columnimate/demo.html)

## Install

Available via [bower](http://bower.io/)

```bash
bower install columnimate
```

## Usage

```html
<link ref="stylesheet" href="columnimate.css">
<script src="columnimate.js">
```

```html
<div class="column-container">
    <div class="column">
        <div class="section"></div>
        <div class="section"></div>
        <div class="section"></div>
    </div>
    <div class="column">
        <div class="section"></div>
        <div class="section"></div>
        <div class="section"></div>
    </div>
</div>
<a class="next">next</a>
<a class="prev">prev</a>
<div class="pagination"></div>
```

```javascript
var columnimate = new Columnimate({
    container: '.column-container',
    columns: {
        left: '.column-left',
        right: '.column-right'
    },
    sections: '.section',
    next: '.next',
    prev: '.prev',
    pagination: '.pagination:',
    onStart: function(currentIndex) {},
    onEnd: function(previousIndex, currentIndex) {}
});
```

## License

Released under the MIT License.
