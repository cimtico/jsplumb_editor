$(function() {
    $("#demo").jsplumb_editor({
        modules:{
            "object":{
                "label": "Object",
                "cssClass": "object",
                acceptedConnections: ["object"],
                image: "images/network.png",
                endPoints:[{position: 'left'}],
                events: {
                    click: function(){
                        alert("Clicked object");
                    }
                }
            },
            "attribute":{
                "label": "Attribute",
                "cssClass": "attribute",
                acceptedConnections: ["object"],
                image: "images/package.png",
                endPoints:[{}],
                events: {
                    click: function(){
                        alert("Clicked attribute");
                    }
                }
            }
        },
        buttons: {
            search: {
                label: "Search",
                action: function(editor){
                    alert("search");
                }
            }
        },
        wireLabel: function(info, sourceContainer, targetContainer){
            var connection = info.connection;
            var result = false;
            if((sourceContainer.module == "object") && (targetContainer.module == "object")){
                result = {
                    label: objectsWireLabel()
                };
            }
            return result;
        },
        save:{
            url: ""
        },
        load:{
            data: {
                containers: [
                {
                    module: "object",
                    label: "Client",
                    metadata: {
                        id: 1,
                        name: "Client"
                    },
                    position:{
                        top: 20,
                        left: 40
                    }
                },
                {
                    module: "attribute",
                    label: "Name",
                    metadata: {
                        id: 1,
                        name: "Name"
                    },
                    position:{
                        top: 90,
                        left: 100
                    }
                }
                ]
            }
        }
    });
});

function objectsWireLabel(){
    var result = $("<div></div>");
    var select = $("<select></select>");
    select.append("<option>1 - N</option>");
    select.append("<option>N - N</option>");
    result.append(select);
    return result.html();
}