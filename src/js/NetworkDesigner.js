/**
 * This is the Deep Neural Network Designer: it produces an interactive interface, where we can build easily the
 * deep network. This script can transform the graphical representation of the network to an option string.
 * By using IPython JavaScript API, this script is able to communicate with the python kernel and book the method,
 * and print out the kernel response.
 * Used libraries/plugins:
 *               - jquery
 *               - jquery-ui
 *               - jquery.connections
 *               - jquery-timing
 * Author: Attila Bagoly <battila93@gmail.com>
 * Created: 8/3/2016
 */

(function (factory) {
    var baseURL = require.toUrl("./NetworkDesigner.js");
    baseURL = baseURL.substr(0, baseURL.lastIndexOf("/")+1);
    require.config({
        paths: {
            "jquery-connections": baseURL + "jquery.connections.min",
            "jquery-timing": baseURL + "jquery-timing.min",
            "d3": "https://root.cern.ch/js/notebook/scripts/d3.v3.min"
        },
        shim: {
            "jquery-ui": {
                exports: "jquery.ui",
                deps: ['jquery']
            },
            "jquery-connections":{
                deps: ['jquery']
            },
            "jquery-timing": {
                deps: ['jquery']
            }
        }
    });
    define(['jquery', 'd3', 'jquery-ui', 'jquery-connections', 'jquery-timing'], function (jQ, d3) {
        return factory({}, jQ, d3);
    })
})(function (NetworkDesigner, $, d3) {

    var containerID;

    var globalOptions = {
        H: false,
        V: false,
        VerbosityLevel: "Default",
        VarTransform: "Normalize",
        ErrorStrategy: "CROSSENTROPY",
        WeightInitialization: "XAVIER",
        CreateMVAPdfs: false,
        IgnoreNegWeightsInTraining: false,
        Architecture: "STANDARD"
    };

    var layers = Array();
    var layersID;
    var layer_ids = {
        ReLU: "layer_relu",
        TANH: "layer_tanh",
        SYMMReLU: "layer_symmrelu",
        SOFTSIGN: "layer_SOFTSIGN",
        Sigmoid: "layer_sigmoid",
        LINEAR: "layer_linear",
        GAUSS: "layer_gauss"
    };
    var trainingStrategies = Array();

    var connection_queue = [];

    var helpMessages = [];

    var colors = {
        layer: {
            input: "#00A000",
            output: "#F6BD00",
            hidden: ["steelblue", "red"]
        }
    };

    var layer_color = d3.scale.linear()
        .domain([0, 100]).range(colors.layer.hidden)
        .interpolate(d3.interpolateRgb);


    var getText = function(key){
        for(var k in layer_ids){
            if (key==layer_ids[k]) return k;
        }
    };

    var drawConnection = function(e, id){
        if ($("#drawConnectionHelper")[0]!==undefined){
            $("#drawConnectionHelper").remove();
        }
        connection_queue = [];
        $("#"+containerID).append("<div id='drawConnectionHelper'>div_"+id+"</div>");
        var helper = $("#drawConnectionHelper");
        var offset = $("#"+containerID).offset();
        helper.css({
            top:  (e.pageY -offset.top) + "px",
            left: (e.pageX -offset.left)+ "px"
        });
        helper.draggable();
        var counter = 0;
        helper.on("click", function () {
            if (counter==2) {
                connection_queue.push($(this).text());
                $(this).remove();
                counter = 0;
            } else {
                counter++;
            }
        });
        $("#div_"+id).connections({to: "#drawConnectionHelper"});
    };

    var initTrainingStrategy = function(i){
        trainingStrategies[i] = {
            LearningRate: 1e-3,
                Momentum: 0.3,
            Repetitions: 3,
            ConvergenceSteps: 100,
            BatchSize: 30,
            TestRepetitions: 7,
            WeightDecay: 0.0,
            Regularization: "NONE",
            DropConfig: "",
            DropRepetitions: 3,
            Multithreading: true
        };
    };

    var initLayer = function(i, type){
        layers[ i ] = {
            type: type,
            neurons: 0,
            connected: {
                before: null,
                after: null
            }
        };
        if (type.toLowerCase().indexOf("output")!=-1){
            layers[i]["func"]
        }
    };

    var connectLayers  = function(target){
        var source;
        if (connection_queue.length!=1) {
            var helper = $("#drawConnectionHelper");
            source = String(helper.text());
            helper.remove();
        } else {
            source = String(connection_queue.pop());
        }
        $("#"+source).connections({to: "#"+target});
        updateLayer(source, false, false, target);
    };

    var updateLayer = function (id, neuron_num, connected_before, connected_after) {
        var arr = id.split("_");
        var idx = Number(arr[arr.length-1]);
        if (neuron_num) layers[idx].neurons = neuron_num;
        if (connected_before){
            arr = connected_before.split("_");
            var other_idx = Number(arr[arr.length-1]);
            layers[idx].connected.before = other_idx;
            layers[other_idx].connected.after = idx;
        }
        if (connected_after){
            arr = connected_after.split("_");
            var other_idx = Number(arr[arr.length-1]);
            layers[other_idx].connected.before = idx;
            layers[idx].connected.after        = other_idx;
        }
    };

    var addLayer = function(id, addButton, connectionSource, connectionTarget, addText){
        var lid = id + "_" + layersID++;
        $("#"+containerID).append("<div class='layer_box' id='div_"+lid+"'></div>");
        var layer = $("#div_"+lid);
        var bkg_color = id.indexOf("input")!=-1 ? colors.layer.input
                        : id.indexOf("output")!=-1 ? colors.layer.output
                        : colors.layer.hidden[0];
        layer.css({
            position: "relative",
            top: "100px",
            left: "100px",
            "z-index": 90,
            "background-color": bkg_color
        });
        layer.draggable();
        if (addButton) {
            layer.html("<input type='button' id='button_" + lid + "' style='display: none;' value='0' />"
                + "<input type='button' id='options_"+lid+"' class='button_layer' value='Options' / >"
                        + "<span>" + getText(id) + "</span>");
            layer.on("click", "#options_" + lid, function () {
                $("#neuronnum_layer_dialog").data('buttonID', lid);
                $("#neuronnum_layer_dialog").dialog("open");
            });
        }
        if (connectionSource){
            var counter = 0;
            layer.on("click",function(e){
                if (counter>=2) {
                    drawConnection(e, lid);
                    counter = 0;
                } else {
                    counter += 1;
                }
            });
        }
        if (connectionTarget) {
            layer.droppable({
                drop: function () {
                    connectLayers("div_" + lid);
                }
            });
        }
        if (addText){
            layer.append(addText);
            if (addText.toLowerCase().indexOf("output")!=-1){
                layer.append("<input type='button' id='options_"+lid+"' class='button_layer_output' value='Options' / >");
                layer.on("click", "#options_" + lid, function () {
                    $("#output_layer_dialog").data('buttonID', lid);
                    $("#output_layer_dialog").dialog("open");
                });
            }
        }
        var arr = lid.split("_");
        initLayer( Number(arr[arr.length-1]), arr[arr.length-2]);
    };

    var addNeuronsToLayer = function(){
        $("#"+containerID).append("<div id='neuronnum_layer_dialog' title='Add neurons' style='display: none'>\
            <form><label>Number of neurons: </label><input type='text'></form>\
            </div>");
        $("#neuronnum_layer_dialog").dialog({
            autoOpen: false,
            show: {
                effect: "fade",
                duration: 500
            },
            hide: {
                effect: "fade",
                duration: 500
            },
            open: function(){
                $("#neuronnum_layer_dialog form input").val($("#button_"+$(this).data("buttonID")).val());
            },
            buttons: {
                "OK": function(){
                    var neuron_num = $("#neuronnum_layer_dialog form input").val();
                    var button = $("#button_"+$(this).data("buttonID"));
                    //button.css({left: String(40-neuron_num.length*5)+"%"});
                    neuron_num = Number(neuron_num);
                    button.val(neuron_num);
                    button.parent().css({ "background":  layer_color(neuron_num)});
                    updateLayer($(this).data("buttonID"), neuron_num);
                    $(this).dialog("close");
                },
                "Close": function() {
                    $(this).dialog("close");
                }
            }
        }).data('buttonID', '-1');
        $("#neuronnum_layer_dialog form input").on("keypress keydown keyup", function(e) {
            e.stopPropagation();
        });
    };

    var outputLayerOptionsDialog = function(){
        var layertype = "<select id='output_layer_type'>";
        for(var lt in layer_ids){
            layertype += "<option value='"+lt+"'>"+lt+"</option>";
        }
        layertype += "</select>";
        $("#"+containerID).append("<div id='output_layer_dialog' title='Layer type' style='display: none'>\
            <form><label>Type of layer: </label>"+layertype+"</form>\
            </div>");
        $("#output_layer_dialog").dialog({
            autoOpen: false,
            show: {
                effect: "fade",
                duration: 500
            },
            hide: {
                effect: "fade",
                duration: 500
            },
            open:  function(){
                var arr = $(this).data("buttonID").split("_");
                arr   = Number(arr[arr.length-1]);
                if (layers[arr].func!==undefined) {
                    $("#output_layer_type").val(layers[arr].func);
                }
            },
            buttons: {
                "OK": function(){
                    var arr = $(this).data("buttonID").split("_");
                    arr  = Number(arr[arr.length-1]);
                    layers[arr]["func"] = $("#output_layer_type").val();
                    $(this).dialog("close");
                },
                "Close": function() {
                    $(this).dialog("close");
                }
            }
        }).data('buttonID', '-1');
    };

    var createForm = function(id, form){
        var string = "<table>";
        form.forEach(function(opts, optID){
            string += "<tr>";
            if ("title" in  opts){
                string += "<td><label>"+opts["title"]+"</label></td>";
            } else {
                string += "<td><label>"+optID+"</label></td>";
            }
            string += "<td>";
            if (opts["type"]=="select"){
                string += "<select id=\""+id+"_"+optID+"\">";
                for(var i=0; i<opts["options"].length;i++){
                    string += "<option value=\""+opts["options"][i]+"\">"+opts["options"][i]+"</option>";
                }
                string += "</select>";
            } else {
                string += "<input type=\"" + opts["type"] + "\" id=\"" + id + "_" + optID + "\" />";
            }
            string += "</td>";
            string += "</tr>";
        });
        string += "</table>";
        return string;
    };

    var syncForm = function(id, form, options){
        for(var opt in options){
            if (options[opt]===true || options[opt]===false){
                $("#"+id+"_"+opt).prop("checked", options[opt]);
                $("#"+id+"_"+opt).change(function(){
                    $(this).attr("value", this.checked ? 1 : 0);
                });
                if (options[opt]==true){
                    $("#"+id+"_" + opt).val(1);
                } else {
                    $("#" + id + "_" + opt).val(0);
                }
            } else {
                $("#"+id+"_" + opt).val(options[opt]);
            }
        }
    };

    var trainingStrategyForm = function(){
        var form = new Map();
        form.set("LearningRate", {
            type: "text"
        });
        form.set("Momentum", {
            type: "text"
        });
        form.set("Repetitions", {
            type: "text"
        });
        form.set("ConvergenceSteps", {
            type: "text"
        });
        form.set("BatchSize", {
            type: "text"
        });
        form.set("TestRepetitions", {
            type: "text"
        });
        form.set("WeightDecay", {
            type: "text"
        });
        form.set("Regularization", {
            type: "select",
            options: ["NONE", "L1", "L2", "L1MAX"]
        });
        form.set("DropConfig", {
            type: "text"
        });
        form.set("DropRepetitions", {
            type: "text"
        });
        form.set("Multithreading", {
            type: "checkbox"
        });
        $("#"+containerID).append("<div id='trainingstrategy_dialog' title='Training Strategy' style='display: none'>"
            + createForm("trainingstrategy", form)
            + "<div id='ts_link'><input id='training_strategy_removebutton' type='button' class='ui-button' value='Remove' /></div>"
            + "</div>");
        $("#trainingstrategy_dialog").dialog({
            autoOpen: false,
            width: 400,
            show: {
                effect: "fade",
                duration: 500
            },
            hide: {
                effect: "fade",
                duration: 500
            },
            open: function(){
                var i   = Number($(this).data("tsformID"));
                syncForm("trainingstrategy", form, trainingStrategies[i]);
            },
            buttons: {
                "OK": function(){
                    var idx   = Number($(this).data("tsformID"));
                    arr = $("#trainingstrategy_dialog input, #trainingstrategy_dialog select");
                    var id;
                    for(var i=0;i<arr.length;i++){
                        if (arr[i].id=="training_strategy_removebutton") continue;
                        id = arr[i].id.split("_")[1];
                        if (form.get(id)["type"]=="checkbox"){
                            if (Number(arr[i].value)==1){
                                trainingStrategies[idx][id] = true;
                            } else {
                                trainingStrategies[idx][id] = false;
                            }
                        } else {
                            trainingStrategies[idx][id] = arr[i].value;
                        }
                    }
                    $(this).dialog("close");
                },
                "Close": function() {
                    $(this).dialog("close");
                }
            }
        }).data('tsformID', '-1');
        $("#training_strategy_removebutton").on("click", function(){
            var tfi= Number($("#trainingstrategy_dialog").data("tsformID"));
            trainingStrategies[tfi] = undefined;
            $("#jsmvatsmenuentry_"+tfi).remove();
            $("#trainingstrategy_dialog").dialog("close");

        });
        $("#trainingstrategy_dialog input").on("keypress keydown keyup", function(e) {
            e.stopPropagation();
        });
    };

    var globalOptionsForm = function(){
        var form = new Map();
        form.set("V", {
            type: "checkbox",
            title: "Verbose"
        });
        form.set("VerbosityLevel", {
            type: "select",
            options: ["Default", "Debug", "Verbose", "Info", "Warning", "Error", "Fatal"]
        });
        form.set("H", {
            type: "checkbox",
            title: "Help messages"
        });
        form.set("VarTransform", {
            type: "text"
        });
        form.set("CreateMVAPdfs",{
            type: "checkbox"
        });
        form.set("IgnoreNegWeightsInTraining", {
            type: "checkbox"
        });
        form.set("ErrorStrategy", {
            type: "select",
            options: ["CROSSENTROPY", "SUMOFSQUARES"]
        });
        form.set("WeightInitialization", {
            type: "select",
            options: ["XAVIER", "XAVIERUNIFORM", "LAYERSIZE"]
        });
        form.set("Architecture", {
            type: "select",
            options: ["STANDARD", "CPU", "GPU", "OPENCL"]
        });
        $("#"+containerID).append("<div id='globopts_dialog' title='Global options' style='display: none'>"
            + createForm("globopts", form)
            + "</div>");
        $("#globopts_dialog").dialog({
            autoOpen: false,
            width: 440,
            show: {
                effect: "fade",
                duration: 500
            },
            hide: {
                effect: "fade",
                duration: 500
            },
            open: function(){
                syncForm("globopts", form, globalOptions);
            },
            buttons: {
                "OK": function(){
                    var arr = $("#globopts_dialog input, #globopts_dialog select");
                    var id;
                    for(var i=0;i<arr.length;i++){
                        id = arr[i].id.split("_")[1];
                        if (form.get(id)["type"]=="checkbox"){
                            if (Number(arr[i].value)==1){
                                globalOptions[id] = true;
                            } else {
                                globalOptions[id] = false;
                            }
                        } else {
                            globalOptions[id] = arr[i].value;
                        }
                    }
                    $(this).dialog("close");
                },
                "Close": function() {
                    $(this).dialog("close");
                }
            }
        });
        $("#globopts_dialog input").on("keypress keydown keyup", function(e) {
            e.stopPropagation();
        });
    };

    var MessageBox = function(id, title, message){
        $("#"+containerID).append("<div id='"+id+"_dialog' title='"+title+"' style='display: none'>\
            <p>"+message+"</p></div>");
        $("#"+id+"_dialog").dialog({
            autoOpen: false,
            show: {
                effect: "puff",
                duration: 700
            },
            hide: {
                effect: "puff",
                duration: 700
            },
            buttons: {
                "Close": function() {
                    $(this).dialog("close");
                }
            }
        });

        this.getID = function(){
            return id;
        };

        this.show = function(){
            $("#"+id+"_dialog").dialog("open");
        };

        this.openOnClick = function(){
            $("#"+id).on("click", function () {
                $("#"+id+"_dialog").dialog("open");
            });
        };

        this.menuEntry = function () {
            return "<li class='nd_menu_element' id='"+id+"'><div>"+title+"</div></li>";
        };
    };

    var getMessageBox = function(id){
        for(var i=0;i<helpMessages.length;i++){
            if (helpMessages[i].getID()==id) return helpMessages[i];
        }
    };

    var createMenu = function(){
        var html = "";

        html += "<div id='nd_menu_div'><ul id='nd_menu'>";

        html += "<li class='nd_menu_element'><div id='globopts_menu'>Global options</div></li>";

        html += "<li class='nd_menu_dropdown'><div>Training strategies</div><ul class='nd_menu_dropdown_content' id='trainingstrategy_menu'>";
        html += "<li id='add_trainingstrategy_menu'><div>New</div></li>";
        html += "</ul></li>";

        html += "<li class='nd_menu_dropdown'><div>Add layer</div><ul class='nd_menu_dropdown_content'>";
        for(var i in layer_ids){
            html += "<li id='"+layer_ids[i]+"'><div>"+getText(layer_ids[i])+"</div></li>";
        }
        html += "</ul></li>";

        for(var i in helpMessages){
            if (helpMessages[i].getID().indexOf("warning")!=-1) continue;
            html += helpMessages[i].menuEntry();
        }

        html += "<li class='nd_menu_element' id='scale_layer_color'><div>Scale colors</div></li>";

        html += "<li class='nd_menu_element' id='save_net'><div>Save network</div></li>";

        html += "</ul></div>";

        $("#"+containerID).append(html);
        
    };

    var scale_colors = function () {
        var layer_boxes = $(".layer_box");
        var min=1e20, max=-1e20;
        var val;
        for(var i=0;i<layers.length;i++){
            val =Number(layers[i].neurons);
            if (val<min) min = val;
            if (val>max) max = val;
        }
        layer_color.domain([min, max]);
        for(var i=0;i<layer_boxes.length;i++){
            if (layer_boxes[i].id.indexOf("input")!=-1) continue;
            if (layer_boxes[i].id.indexOf("output")!=-1) continue;
            var idx = layer_boxes[i].getElementsByClassName("button_layer")[0].id.split("_");
            idx = Number(idx[idx.length-1]);
            layer_boxes[i].style["background-color"] = layer_color(layers[idx].neurons);
        }
    };

    var getInputLayer = function(){
        if (layers[0].type=="input") return layers[0];
        for(var i=0;i<layers.length;i++){
            if(layers[i].type=="input") return layers[i];
        }
        console.log("Something went wrong in NetworkDesigner.getInputLayer...");
        return null;
    };

    var genLayerString = function(input){
        if (input===undefined || input.type===undefined) return "";
        if (input.type=="output") return input.func;
        if (input.type=="input") return "" + genLayerString(layers[input.connected.after]);
        if (input.type!="input" && input.type!="output"){
            return (input.type.toUpperCase()+"|"+input.neurons)+","+genLayerString(layers[input.connected.after]);
        }
    };

    var genOneTrainingStrategyString = function(input){
        var str = "";
        for(var key in input){
            if (String(input[key]).length<1) continue;
            str += key + "=" + String(input[key]) + ",";
        }
        return str.substr(0, str.length-1);
    };

    var genTrainingStrategyString = function(){
        var str = "";
        for(var i=0;i<trainingStrategies.length;i++){
            if (trainingStrategies[i]===undefined) continue;
            str += genOneTrainingStrategyString(trainingStrategies[i]) + "|";
        }
        return str.substr(0, str.length-1);
    };

    var genOptString = function(){
        var opt = "";
        for(var k in globalOptions){
            if (typeof(globalOptions[k]) == "boolean"){
                if (globalOptions[k]==true){
                    opt += k + ":";
                } else {
                    opt += "!"+k+":";
                }
            } else {
                opt += k + "=" + globalOptions[k] + ":";
            }
        }
        var input_layer = getInputLayer();
        var layout = genLayerString(input_layer);
        var training_strategy = genTrainingStrategyString();
        if (layout.length<2 || training_strategy.length<2){
            getMessageBox("warning_nonet").show();
            console.log("Layout="+layout);
            console.log("TrainingStrategy="+training_strategy);
            return "";
        }
        if (layout[layout.length-1]==","){
            layout = layout.substr(0, layout.length-1);
        }
        opt += "Layout="+layout + ":TrainingStrategy="+training_strategy;
        return opt;
    };

    var handle_save_net_output = function(out){
        $("<div>"+out.content.data["text/html"]+"</div>").insertAfter("#"+containerID);
    };

    var save_net = function(){
        var kernel = IPython.notebook.kernel;
        var optString = genOptString();
        if (optString.length<1){
            return;
        }
        console.log(optString);
        var callback = {
            iopub: {
                output: handle_save_net_output
            }
        };
        var command = "from JsMVA.Factory import __BookDNNHelper";
        kernel.execute(command);
        command = "__BookDNNHelper(\""+optString+"\")";
        kernel.execute(command, callback);
        command = "del __BookDNNHelper";
        kernel.execute(command);
        return;
    };

    var events = function(){
        for(var key in layer_ids){
            $("#"+layer_ids[key]).on("click", function(){
                addLayer($(this)[0].id, true, true, true);
            });
        }
        for(var i in helpMessages){
            helpMessages[i].openOnClick();
        }
        $("#globopts_menu").on("click", function(){
           $("#globopts_dialog").dialog("open");
        });
        $("#add_trainingstrategy_menu").on("click", function () {
            var d = $("#trainingstrategy_dialog");
            if (d.dialog("isOpen")===true) return;
            trainingStrategies.push(undefined);
            var idx = trainingStrategies.length-1;
            initTrainingStrategy(idx);
            $("#trainingstrategy_menu").append("<li value='"+idx+"' id='jsmvatsmenuentry_"+idx+"'><div>"+(idx+1)+". Training strategy</div></li>");
            $("#jsmvatsmenuentry_"+idx).on("click", function(){
                var dd = $("#trainingstrategy_dialog");
                if (dd.dialog("isOpen")===true){
                    alert("Dialog already open! Please close before you try to open a new one.");
                    return;
                }
                dd.data("tsformID", idx);
                dd.dialog("open");
            });
            d.data("tsformID", trainingStrategies.length-1);
            d.dialog("open");
        });
        $("#scale_layer_color").on("click", scale_colors);
        $("#save_net").on("click", save_net);
        $.repeat().add('connection').each($).connections('update').wait(0);
    };

    NetworkDesigner.draw = function(id){
        containerID = id;
        layersID    = 0;
        $("#"+containerID).css({"z-index": 90, "position": "relative"});

        connection_queue = [];
        helpMessages     = [];
        layers = Array();
        trainingStrategies = Array();

        helpMessages.push(new MessageBox("connect_layer", "Connect layers",
            "To connect two layer double click on first layer, grab the arrow and move inside the other layer."));
        helpMessages.push(new MessageBox("warning_nonet", "No network/training strategy",
            "You haven't built a network (no valid network found:  the first layer needs to connect to input layer and the last to output layer) " +
            "or you didn't add at least one training strategy!"));

        createMenu();

        events();

        addLayer("layer_input", false, true, false, "<center>Input layer</center>");
        addLayer("layer_output", false, false, true, "<center>Output layer</center>");

        addNeuronsToLayer();
        trainingStrategyForm();
        globalOptionsForm();
        outputLayerOptionsDialog();
    };

    return NetworkDesigner;
});