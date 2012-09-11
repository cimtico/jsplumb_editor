//Namespace
var jsPlumbEditor = (jsPlumbEditor || {});
//Class definition
(function( $ ){
    jsPlumbEditor.Connection = function(options, jsplumb_instance, editor, methods){
        this.connection = options.connection;
        this.jsplumb_instance = jsplumb_instance;
        this.editor = editor;
        this.editor_methods = methods;
        this.options = options;
        this.init(options);
    }
    //Class Methods
    $.extend(jsPlumbEditor.Connection.prototype, {
        //Initialize the connection
        init: function(options){
            var source, target;
            this.connection.editorConnection = this
            source = this.connection.source.data("jsplumb_container");
            target = this.connection.target.data("jsplumb_container");
            this.source = source;
            this.target = target;
            this.metadata = options.metadata || {};
        },
        // Get the connection's data
        getData: function(){
            var source = this.connection.source.data("jsplumb_container");
            var target = this.connection.target.data("jsplumb_container");
            var result = {
                metadata: $.extend(true, {}, this.metadata),
                config:{
                    sourceId: this.editor_methods.getContainerIndex.call(this.editor, source),
                    targetId: this.editor_methods.getContainerIndex.call(this.editor, target)
                }
            }
            return result;
        }
    });
})( jQuery );