var jsPlumbEditor = (jsPlumbEditor || {});
(function( $ ){
    var methods = {
        //Initialize plugin
        init : function( options ) {
            return this.each(function(){
                var jsplumb_instance;
                var self = $(this);
                var data = self.data('jsplumb_editor');
                // If the plugin hasn't been initialized yet
                if(!data){
                    data = methods.setData.call(this, self, options);
                    self.data('jsplumb_editor', data);
                }
                jsplumb_instance = data.jsplumb_instance;
                methods.renderEditor.call(this, self, jsplumb_instance, data);
                if(data.options.autoload){
                    methods.load.call(this, data.options);
                }
            });
        },
        //Destroy plugin
        destroy : function( ) {
            return this.each(function(){
                var self = $(this);
                var data = self.data('jsplumb_editor');
                $(window).unbind('.jsplumb_editor');
                data.jsplumb_editor.remove();
                self.removeData('jsplumb_editor');
            })
        },
        //Setup plugin options
        setOptions: function(options){
            var defaults = {
                autoload: true,
                modules: {},
                wireLabel: function(){
                    return {}
                },
                buttons: {
                    save: {
                        label: "Save",
                        action: function(e, editor){
                            methods.save.call(editor.get(0), editor);
                        },
                        icon: "database_save"
                    },
                    clear: {
                        label: "Clear",
                        action: function(e, editor){
                            methods.clear.call(editor.get(0), editor);
                        },
                        icon: "page_white_delete"
                    },
                    reload: {
                        label: "Reload",
                        action: function(e, editor){
                            methods.reload.call(editor.get(0), editor);
                        },
                        icon: "arrow_refresh"
                    },
                    sort: {
                        label: "Organize",
                        action: function(e, editor){
                            methods.sort.call(editor.get(0), editor);
                        },
                        icon: "shape_move_back "
                    }
                }
            };
            options = $.extend(true, {}, defaults, options || {});
        
            return options;
        },
        //Setup plugin options
        setData: function(self, options){
            var data;
            options = methods.setOptions.call(this, options);
            data = {
                container : this,
                jsplumb_editor : self,
                jsplumb_instance: jsPlumb.getInstance(),
                options: options,
                modules: options.modules,
                buttons: options.buttons,
                containers: [],
                connections: []
            };
            return data;
        },
        //Render the editor inside the provided container
        renderEditor: function(self, jsplumb_instance, data){
            var menubar = $("<div></div>");
            var toolbar = $("<div></div>");
            var canvas = $("<div></div>");
        
            self.addClass("jsPlumb-editor");
            toolbar.addClass("jsPlumb-editor-toolbar");
            canvas.addClass("jsPlumb-editor-canvas");
            menubar.addClass("jsPlumb-editor-menubar");
        
            data.canvas = canvas;
            data.toolbar = toolbar;
            data.menubar = menubar;
        
            self.prepend(menubar);
            self.append(toolbar);
            self.append(canvas);
            
            methods.renderMenuItems.call(self, menubar, data);
            methods.renderModules.call(self, toolbar, data);
            methods.initializeJsPlumb.call(self, jsplumb_instance, canvas, data);
            methods.initializeSpringy.call(self, data);
            
            toolbar.find(".jsPlumb-editor-module").each(function(i, module){
                $(module).draggable({
                    helper: "clone"
                });
            });
            
            canvas.droppable({
                accept: ".jsPlumb-editor-module",
                drop: function(event, ui){
                    var moduleEl = $(ui.draggable);
                    var moduleKey = moduleEl.attr("data-module-key");
                    if(moduleKey && (!moduleEl.hasClass("jsplumb-editor-container"))){
                        var position = ui.position;
                        var offset = canvas.position();
                        //Correct drop window position vs canvas position
                        position.left -= offset.left;
                        position.top -= offset.top;
                        //Add container to canvas
                        methods.addContainer.call(self, {
                            module: moduleKey,
                            position: position
                        });
                    }
                }
            });
            
            
        },
        //Render the modules list
        renderModules: function(toolbar, data){
            var modules = data.modules;
            var title = $("<div>Tools</div>");
            var list = $("<ul></ul>");
            title.addClass("jsPlumb-editor-toolbar-title");
            list.addClass("jsPlumb-editor-toolbar-list");
            toolbar.append(title);
            toolbar.append(list);
            for(var key in modules){
                methods.renderModule.call(this, list, modules[key], key);
            }
        },
        //Render a module list item
        renderModule: function(list, moduleOptions, key){
            var moduleEl = $("<div></div>");
            var listItemEl = $("<li></li>");
            var defaults = {
                visibleLabel: false,
                label: ""
            }
            moduleOptions = $.extend(true, {}, defaults, moduleOptions || {});
            listItemEl.addClass("jsPlumb-editor-toolbar-item");
            moduleEl.addClass("jsPlumb-editor-module");
            moduleEl.attr("title", moduleOptions.label);
            moduleEl.attr("data-module-key", key);
            
            if(moduleOptions.image){
                moduleEl.append("<img src=\""+moduleOptions.image+"\">");
            }
            
            if(moduleOptions.visibleLabel){
                moduleEl.append("<label>"+moduleOptions.label+"</label>");
            }
            
            listItemEl.append(moduleEl);
            list.append(listItemEl);
        },
        //Render the modules list
        renderMenuItems: function(menubar, data){
            var buttons = data.buttons;
            var list = $("<ul></ul>");
            list.addClass("jsPlumb-editor-menubar-list");
            menubar.append(list);
            for(var key in buttons){
                methods.renderMenuItem.call(this, list, buttons[key], key);
            }
        },
        //Render a module list item
        renderMenuItem: function(list, buttonOptions, key){
            var self = $(this);
            var buttonEl = $("<button></button>");
            var listItemEl = $("<li></li>");
            var defaults = {
                label: "",
                action: function(){},
                css: ""
            }
            buttonOptions = $.extend(true, {}, defaults, buttonOptions || {});
            listItemEl.addClass("jsPlumb-editor-menubar-item");
            buttonEl.addClass("jsPlumb-editor-menu-button");
            buttonEl.addClass(buttonOptions.css);
            buttonEl.attr("title", buttonOptions.label);
            buttonEl.append(buttonOptions.label);
            buttonEl.click(function(e){
                stopPropagation(e);
                buttonOptions.action.call(this, e, self);
            });
            if(buttonOptions.icon){
                var icon = $("<span></span>");
                icon.addClass("ss_sprite ss_"+buttonOptions.icon);
                buttonEl.prepend(icon);
            }
            
            listItemEl.append(buttonEl);
            list.append(listItemEl);
        },
        //Initialize the jsplumb component
        initializeJsPlumb: function(jsplumb_instance, canvas, data){
            var self = this;
            var wireLabel = data.options.wireLabel;
            var curColourIndex = 1, maxColourIndex = 24, nextColour = function() {
                var R,G,B;
                R = parseInt(128+Math.sin((curColourIndex*3+0)*1.3)*128);
                G = parseInt(128+Math.sin((curColourIndex*3+1)*1.3)*128);
                B = parseInt(128+Math.sin((curColourIndex*3+2)*1.3)*128);
                curColourIndex = curColourIndex + 1;
                if (curColourIndex > maxColourIndex) curColourIndex = 1;
                return "rgb(" + R + "," + G + "," + B + ")";
            };
        
            jsplumb_instance.bind("jsPlumbConnection", function(eventData) {
                eventData.connection.setPaintStyle({
                    strokeStyle:nextColour()
                });
                eventData.connection.getOverlay("label").setLabel(eventData.connection.id);
            });
        
            //Validate connection
            jsplumb_instance.bind("beforeDrop", function(eventData) {
                var result = false;
                var source = $("#"+eventData.sourceId);
                var target = $("#"+eventData.targetId);
                var sourceType = source.data("jsplumb_container").module;
                var acceptedTypes = target.data("jsplumb_container").acceptedConnections
                
                if((acceptedTypes == "all")||(acceptedTypes.indexOf(sourceType) > -1)){
                    result = true
                }
                else{
                    result = false
                }
                    
                return result;
            });
            if(wireLabel){
                jsplumb_instance.bind("jsPlumbConnection", function(info) {
                    var connection = info.connection;
                    var source = info.source;
                    var target = info.target;
                    var wireLabelOptions;
                    if(typeof wireLabel == "function"){
                        wireLabelOptions = wireLabel.call(this, info, source.data("jsplumb_container"), target.data("jsplumb_container"));
                    }
                    else{
                        wireLabelOptions = wireLabel;
                    }
                    if(wireLabelOptions){
                        wireLabelOptions.cssClass = "jsplumb-editor-connection-label " + (wireLabelOptions.cssClass || "")
                        connection.addOverlay([ "Label", wireLabelOptions]);
                    }
                });
            }
        
            //Register connection
            jsplumb_instance.bind("jsPlumbConnection", function(eventData) {
                methods._connectionAdded.call(self, eventData);
            });
        
            //Un-register connection
            jsplumb_instance.bind("jsPlumbConnectionDetached", function(eventData) {
                methods._connectionRemoved.call(self, eventData);
            });
        
        
            jsplumb_instance.importDefaults({
                Endpoint : ["Dot", {
                    radius:2
                }],
                HoverPaintStyle : {
                    strokeStyle:"#42a62c", 
                    lineWidth:2
                },
                ConnectionOverlays : [
                [ "Arrow", { 
                    location:1,
                    id:"arrow",
                    length:14,
                    foldback:0.8
                }]
                ]
            });
            
            // bind a click listener to each connection; the connection is deleted.
            jsplumb_instance.bind("dblclick", function(connection) { 
                jsplumb_instance.detach(connection);
            });
        
        },
        //Load json data
        loadJson: function(json){
            var connections, containers;
            var self = $(this);
            json = ((typeof json == "object") ? json : {});
            
            connections = json.connections || [];
            containers = json.containers || [];
        
            for(var index = 0; index < containers.length; index++){
                methods.addContainer.call(this, containers[index]);
            }

            for(var index = 0; index < connections.length; index++){
                methods.addConnection.call(this, connections[index]);
            }
        },
        //Add a new container
        addContainer: function(containerData){
            var self = $(this);
            var data = self.data('jsplumb_editor');
            var canvas = data.canvas;
            var jsplumb_instance = data.jsplumb_instance;
            var moduleOptions = data.modules[containerData.module];
            var containerOptions = $.extend(true, {}, moduleOptions, containerData);
            var container = new jsPlumbEditor.Container(containerOptions, canvas, jsplumb_instance, self, methods);
            
            container.el.bind("jsplumb-remove-container", function(event, deletedContainer){
                methods.removeContainer.call(self.get(0), deletedContainer);
            });
            //canvas.append(containerEl);
            data.containers.push(container);
            methods.springyAddContainer.call(this, container);
        },
        //Remove a container
        removeContainer: function(container){
            var self = $(this);
            var data = self.data('jsplumb_editor');
            var index = methods.getContainerIndex.call(this, container);
            if(index > -1){
                data.containers.splice(index, 1); //1 indicates to remove only that item
            }
            methods.springyRemoveContainer.call(this, container);
        },
        //Get a container's index
        getContainerIndex: function(container){
            var self = $(this);
            var data = self.data('jsplumb_editor');
            return data.containers.indexOf(container);
        },
        //Add a connection between containers
        addConnection: function(connectionConfig){
            var self = $(this);
            var data = self.data('jsplumb_editor');
            var jsplumb_instance = data.jsplumb_instance;
            var defaults = {
                
            };
            connectionConfig = $.extend(true, {}, defaults, connectionConfig || {});
            jsplumb_instance.connect(connectionConfig);
        },
        //Get the data hash for the instance
        getData: function(){
            var self = $(this);
            var data = self.data('jsplumb_editor');
            var result = {
                containers: [],
                connections: []
            }
            for(var index = 0; index < data.containers.length; index++){
                var container = data.containers[index];
                result.containers.push(container.getData());
            }
            for(var index = 0; index < data.connections.length; index++){
                var connection = data.connections[index];
                result.connections.push(connection.getData());
            }
            return result;
        },
        //Get the data arrays for the instance
        getDataArrays: function(){
            var self = $(this);
            var data = self.data('jsplumb_editor');
            var result = {
                containers: data.containers,
                connections: data.connections
            }
            return result;
        },
        //Save the wirings
        save: function(self){
            var data = self.data('jsplumb_editor');
            var wiresData = methods.getData.call(this);
            var saveData = (data.options.save || {});
            var url;
            data.options.save = saveData;
            if(typeof saveData.url == "function"){
                url = saveData.url.call(this, self);
            }
            else{
                url = saveData.url;
            }
            if(url && (url != "")){
                $.ajax({
                    url: url,
                    data: {
                        wirings: wiresData
                    },
                    type: "POST",
                    dataType: "JSON",
                    success: function(response){
                        methods.onSaveSuccess.call(self.get(0), response);
                    },
                    error: function(response){
                        methods.onSaveError.call(self.get(0), response);
                    }
                });
            }
        },
        //Save wirings success
        onSaveSucess: function(response){
            alert(response.message);
        },
        //Save wirings error
        onSaveError: function(response){
            alert(response);
        },
        
        //Load the wirings
        load: function(loadParameters){
            var self = $(this);
            var data = self.data('jsplumb_editor');
            var loadData = $.extend(true, {}, (data.options.load || {}));
            data.options.load = loadData;
            data.loadParameters = (loadParameters || data.loadParameters || {});
            
            methods.clear.call(this);
            if(typeof loadData.data == "object"){
                methods.onLoadSuccess.call(self.get(0), loadData.data);
            }
            else{
                var url;
                if(typeof loadData.url == "function"){
                    url = loadData.url.call(this, self);
                }
                else{
                    url = loadData.url;
                }
                $.ajax({
                    url: url,
                    data: loadData.parameters,
                    type: "GET",
                    dataType: "JSON",
                    success: function(response){
                        methods.onLoadSuccess.call(self.get(0), response);
                    },
                    error: function(response){
                        methods.onLoadError.call(self.get(0), response);
                    }
                });
            }
        },
        //Load wirings success
        onLoadSuccess: function(response){
            methods.loadJson.call(this, response);
        },
        //Load wirings error
        onLoadError: function(response){
            alert(response);
        },
        //Reload the editor's data
        reload: function(){
            methods.load.call(this);
        },
        //Clear all the canvas containers
        clear: function(){
            var self = $(this);
            var data = self.data('jsplumb_editor');
            var containers = data.containers;
            while (containers.length > 0){
                containers.pop().close();
            }
        },
        //Sort the canvas containers
        sort: function(){
            var self = $(this);
            var data = self.data('jsplumb_editor');
            if(typeof data.springyRenderer == "object"){
                data.springyRenderer.start(function(){
                    });
            }
        },
        
        //Setup springy component variables
        initializeSpringy: function(data){
            var self = $(this);
            data.springyGraph = new Graph();
            data.springyLayout = new Layout.ForceDirected(data.springyGraph, 400.0, 400.0, 0.5);
            data.springyRenderer = new Renderer(100, data.springyLayout,
                function clear() {
                },
                function drawEdge(edge, p1, p2) {
                },
                function drawNode(node, p) {
                    var position = methods.springyToScreen.call(self.get(0), p);
                    var width = $(node.data.container.el).width();
                    var height = $(node.data.container.el).height();
                    node.data.container.setPosition({
                        left: position[0], 
                        top: position[1]
                    }, width, height);
                });
            data.springyRenderer.graphChanged = function(e){};
        },
        //Obtain springy node screen coordinates
        springyToScreen : function(p, containerWidth, containerHeight) {
            var data = $(this).data('jsplumb_editor');
            // calculate bounding box of graph layout.. with ease-in
            var currentBB = data.springyLayout.getBoundingBox();
            var screen = methods.springyScreenSize.call(this);
            var xOffset = (containerWidth / 2) || 0;
            var yOffset = (containerHeight / 2) || 0;
            // convert to/from screen coordinates
            var size = currentBB.topright.subtract(currentBB.bottomleft);
            var sx = (p.subtract(currentBB.bottomleft).divide(size.x).x * screen.x);
            var sy = (p.subtract(currentBB.bottomleft).divide(size.y).y * screen.y);
            return [sx, sy];
        },
        //Get springy node internal coordinates
        springyFromScreen : function(s) {
            var data = $(this).data('jsplumb_editor');
            var screen = methods.springyScreenSize.call(this);
            var currentBB = data.springyLayout.getBoundingBox();
            var size = currentBB.topright.subtract(currentBB.bottomleft);
                    
            var px = (s.x / screen.x) * size.x + currentBB.bottomleft.x;
            var py = (s.y / screen.y) * size.y + currentBB.bottomleft.y;
            return new Vector(px, py);
        },
        //Obtain springy screen size
        springyScreenSize: function() {
            var data = $(this).data('jsplumb_editor');
            var containers = data.containers.length;
            var delta = Math.pow(1.75, Math.round(Math.sqrt(containers)));
            var canvasWidth = delta*75;
            var canvasHeight = delta*50;
            return {
                x: canvasWidth, 
                y: canvasHeight
            }
        },
        //Add springy wire
        springyAddConnection: function(connection){
            var data = $(this).data('jsplumb_editor');
            var source = connection.source.springyNode;
            var target = connection.target.springyNode;
            if(source && target){
                var newData = {
                    length: 7
                };
                connection.springyEdge = data.springyGraph.newEdge(source, target, newData);
            }
        },
        //Remove springy wire
        springyRemoveConnection: function(connection){
            var data = $(this).data('jsplumb_editor');
            if(connection.springyEdge){
                data.springyGraph.removeEdge(connection.springyEdge);
            }
        },
        //Add springy node
        springyAddContainer: function(container){
            var data = $(this).data('jsplumb_editor');
            container.springyNode = data.springyGraph.newNode({
                container: container
            });
            container.initializeSpringyPosition();
        },
        //Remove springy node
        springyRemoveContainer: function(container){
            var data = $(this).data('jsplumb_editor');
            if(container.springyNode)
                data.springyGraph.removeNode(container.springyNode);
        },
        //Initialize the springy component positions
        initializeSpringyPositions: function(){
            var data = $(this).data('jsplumb_editor');
            for(var index = 0; index < this.containers.length; index++){
                data.containers[index].initializeSpringyPosition();
            }
        },
        
        
        
        
        
        
        
        /************************
        * "Private" Methods
        ************************/
        _connectionAdded: function(eventData){
            var self = $(this);
            var data = self.data('jsplumb_editor');
            var jsplumb_instance = data.jsplumb_instance;
            var connection = new jsPlumbEditor.Connection(eventData, jsplumb_instance, self, methods);
            data.connections.push(connection);
            methods.springyAddConnection.call(this, connection);
        },
        _connectionRemoved: function(eventData){
            var self = $(this);
            var data = self.data('jsplumb_editor');
            var jspConnection = eventData.connection;
            var connection = jspConnection.editorConnection;
            var index = data.connections.indexOf(connection);
            if(index > -1){
                data.connections.splice(index, 1); //1 indicates to remove only that item
            }
            methods.springyRemoveConnection.call(this, connection);
        },
        _getJsPlumbInstance: function(){
            var self = $(this);
            var data = self.data('jsplumb_editor');
            return data.jsplumb_instance;
        }
    };

    $.fn.jsplumb_editor = function( method ) {
    
        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.jsplumb_editor' );
        }    
  
    };

})( jQuery );
//Stop the event's propagation
function stopPropagation(e){
    //IE9 & Other Browsers
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    //IE8 and Lower
    else {
        e.cancelBubble = true;
    }

}