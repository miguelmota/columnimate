(function() {
    var columnimate = new Columnimate({
        container: '.column-container',
        columns: {
            left: '.column-left',
            right: '.column-right'
        },
        sections: '.box',
        next: '.next',
        prev: '.prev',
        pagination: '.pagination',
        callback: function(currentIndex) {
            console.log(currentIndex);
        }
    });
})();
