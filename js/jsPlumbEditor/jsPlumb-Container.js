//Namespace
var jsPlumbEditor = (jsPlumbEditor || {});
//Class definition
(function( $ ){
    jsPlumbEditor.Container = function(options, canvas, jsplumb_instance, editor, methods){
        var data = $(editor).data('jsplumb_editor');
        this.jsplumb_instance = jsplumb_instance;
        this.editor = editor;
        this.editor_methods = methods;
        this.canvas = canvas;
        this.springyLayout = data.springyLayout;
        this.init(options);
    }
    //Class Methods
    $.extend(jsPlumbEditor.Container.prototype, {
        //Initialize the container
        init: function(options){
            this.setOptions(options);
            this.render();
            this.el.data({jsplumb_container: this});
        },
        //Setup the container's options
        setOptions: function(options){
            var defaults = {
                closeButton: true 
            };
            this.options = $.extend(true, {}, defaults, options || {});
            this.module = this.options.module || "default";
            this.acceptedConnections = this.options.acceptedConnections || "all";
            this.endPoints = (this.options.endPoints || []);
            this.events = (this.options.events || []);
            
            //Make container draggable
            this.draggable = ((typeof this.options.draggable == "undefined") ? true : this.options.draggable);
            
            //Make container a target
            this.isTarget = ((typeof this.options.isTarget == "undefined") ? true : this.options.isTarget);
            this.targetOptions = $.extend(true, {}, {
                dropOptions:{
                    hoverClass:"jsplumb-editor-drag-hover"
                },
                anchor:"Continuous"
            }, (options.targetOptions || {}));
            this.metadata = options.metadata || {};
        },
        //Set the container's position
        setPosition: function(position){
            position = $.extend(true, {} , {
                top: 0, 
                left: 0
            }, position || {})
            if(position.left < 0)
                position.left = 0;
            if(position.top < 0)
                position.top = 0;
            this.el.css("left",position.left);
            this.el.css("top",position.top);
            this.options.position = position;
            this.jsplumb_instance.repaint(this.el);
        },
        //Get the container's position
        getPosition: function(){
            return this.options.position || $(this.el).offset();
        },
        //Render the component
        render: function(){
            var self = this;
            var jsplumb_instance = this.jsplumb_instance;
            this.el = $("<div></div>");
            this.el.addClass("jsplumb-editor-container");
            this.el.addClass("jsplumb-editor-"+this.module);
            
            this.canvas.append(this.el);
            
            // initialise draggable elements.  note: jsPlumb does not do this by default from version 1.3.4 onwards.
            if(this.draggable){
                jsplumb_instance.draggable(this.el, {
                    stop: function(event, ui) { 
                        self.setPosition(ui.position);
                        self.updateSpringyPosition();
                    }
                });
            }
            if(this.isTarget)
                jsplumb_instance.makeTarget(this.el, this.targetOptions);
            if(this.options.image)
                this.el.append("<img src=\""+this.options.image+"\">");
            if(this.options.label)
                this.el.append("<label>"+this.options.label+"</label>");
            
            this.bindEvents();
            this.renderButtons();
            this.renderEndPoints();
            this.setPosition(this.options.position);
        },
        //Bind the container's events
        bindEvents: function(events){
            var self = this;
            this.el.bind("click drag", function(){
                self.canvas.find(".jsplumb-editor-selected-container").removeClass("jsplumb-editor-selected-container");
                $(this).addClass("jsplumb-editor-selected-container");
            });
            for(var event in self.events){
                this.el.bind(event, function(e){
                    self.events[event].call(this, e, self, self.el);
                });
            }
        },
        //Render the container's buttons
        renderButtons: function(){
            var self = this;
            this.buttons = [];
            
            if(this.options.closeButton){
                var closeButton = $("<div></div>");
                closeButton.addClass("jsplumb-editor-container-button");
                closeButton.addClass("ss_sprite ss_delete");
                this.el.prepend(closeButton);
                closeButton.click(function(e){
                    stopPropagation(e)
                    self.close();
                });
                this.buttons.push(closeButton);
            }
            
        },
        //Render the container's endpoints
        renderEndPoints: function(){
            var jsplumb_instance = this.jsplumb_instance;
            var self = $(this.el);
            var defaults = {
                parent:self,
                //anchor:"BottomCenter",
                anchor:"Continuous",
                connector:[ "StateMachine", {
                    curviness:20
                } ],
                connectorStyle:{
                    strokeStyle: "#AABBCC", 
                    lineWidth:2
                },
                maxConnections:-1,
                position: "right"
            };
            //Initialize the end points
            for(var index = 0; index < this.endPoints.length; index++){
                var endPoint = this.endPoints[index];
                var config = $.extend(true, {}, defaults, endPoint);
                var endPointEl = $("<div></div>");
                var endPointButtons = $("<div></div>");
                
                endPointEl.addClass("jsplumb-editor-end-point");
                endPointEl.addClass("jsplumb-editor-end-point-"+config.position);
                
                self.append(endPointEl);
                self.append(endPointButtons);
                
                this.renderEndpointButtons(endPointButtons, endPointEl, config);
                
                jsplumb_instance.makeSource(endPointEl, config);
                endPointEl.get(0).jsPlumbConfig = config;
            }
        },
        //Render the endpoint buttons
        renderEndpointButtons: function(container, endPoint, config){
            var button;
            var self = this;
            container.addClass("jsplumb-editor-ep-buttons jsplumb-editor-ep-buttons-"+config.position);
            
            button = $("<div></div>");
            container.append(button);
            button.addClass("jsplumb-editor-ep-button ss_sprite ss_cut");
            button.click(function(e){
                var eps;
                stopPropagation(e);
                eps = self.jsplumb_instance.getEndpoints(self.el)
                //self.jsplumb_instance.detachAllConnections(ep);
                for(var index = 0; index < eps.length; index++){
                    if(eps[index].isSource)
                        eps[index].detachAll();
                }
            });
            
            //Setup buttons container behavior
            endPoint.hover(function(){
                container.show();
            }, function(){
                container.hide();
            });
            container.hover(function(){
                container.show();
            }, function(){
                container.hide();
            });
            container.hide();
        },
        //Remove a container from the editor
        close: function(){
            var jsplumb_instance = this.jsplumb_instance;
            //Remove any existing connections to this element
            jsplumb_instance.detachAllConnections(this.el, {
                fireEvent: true
            });
            //Detach from DOM
            this.el.detach();
            //Trigger remove event
            this.el.trigger("jsplumb-remove-container", this);
        },
        // Initialize the springy positions
        initializeSpringyPosition: function(){
            this.updateSpringyPosition();
        },
        //Update the container's springy position
        updateSpringyPosition: function(){
            var self = this;
            if(typeof self.springyNode == "object"){
                var position = self.getPosition();
                position.x = position.left;
                position.y = position.top;
                var newPoint = self.editor_methods.springyFromScreen.call(self.editor, position);
                var point = self.springyLayout.point(self.springyNode);
                point.p.x = newPoint.x;
                point.p.y = newPoint.y;
            }
        },
        // Get the container's data
        getData: function(){
            var result = {
                metadata: $.extend(true, {}, this.metadata),
                config:{
                    id: this.editor_methods.getContainerIndex.call(this.editor, this),
                    module: this.module,
                    position: this.getPosition()
                }
            }
            return result;
        }
    });
})( jQuery );