(function() {
    var columnimate = new Columnimate({
        container: '.column-container',
        columns: {
            left: '.column-left',
            right: '.column-right'
        },
        sections: '.box',
        pagination: '.pagination',
        onStart: function(currentIndex) {
            console.log(currentIndex);
        },
        onEnd: function(previousIndex, currentIndex) {

        }
    });
})();
