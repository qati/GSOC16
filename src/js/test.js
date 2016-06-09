/**
 * Created by attila on 6/8/16.
 */



function NeuralNetwork(d3, net, divid) {
    var style = {
        "neuron": {
            "colors": {
                "input": "#00A000",
                "hidden": "#0000C7",
                "output": "#F6BD00",
                "bias": "#8F686F"
            },
            "mouseon": {
                "change_radius": 2,
                "alpha": 0.2
            }
        },
        "synapse": {
            "colors": {
                "negative": "#00005E",
                "positive": "#FF4B00"
            },
            "width_range": [0.5, 5],
            "alpha": 0.7,
            "mouseon": {
                "width_range": [0.5, 10],
                "alpha": 0.1
            }
        },
        "variables": {
            "labels_layer0_padding": 20
        }
    };

    var div = d3.select("#"+divid);
    var canvas = {
        width:  div.property("style")["width"],
        height: div.property("style")["height"]
    };
    var svg = div.append("svg")
        .attr("width", canvas.width)
        .attr("height", canvas.height);
    Object.keys(canvas).forEach(function (key) {
        canvas[key] = Number(canvas[key].replace("px",""))
    });

    var num_layers = Number(net["layout"]["nlayers"]);


    var getNeuronNumber = function(layer_index){
        return Number(Object.keys(net["layout"]["layer_"+layer_index]).length-1);
    };

    var getNeuronsAttr = function (layer_index) {
        var numn = getNeuronNumber(layer_index);
        var neuronsAttr = Array(numn);
        for(var i=0;i<numn;i++){
            neuronsAttr[i] = {
                "position": {
                    "x": (layer_index + 0.5) * canvas.width / (num_layers),
                    "y": (i + 0.5) * canvas.height / numn
                },
                "radius": canvas.height/(numn+(numn>5?0:5))/4,
                "type":  (i==(numn-1) ? "bias" : (layer_index==0 ? "input" : "hidden")),
                "index": i,
                "key": "layer"+layer_index+"_neuron"+i
            };
            if (layer_index==(num_layers-1)){
                neuronsAttr[i]["type"] = "output";
            }
        }
        return neuronsAttr;
    };

    var getWeights = function(layer, neuron){
        var neuron = net["layout"]["layer_"+layer]["neuron_"+neuron];
        if (neuron["nsynapses"]!=0) return neuron["weights"];
        return [];
    };

    var getMinMaxWeight = function(){
        var max = -1e30;
        var min =  1e30;
        var tmp;
        for(var i=0;i<num_layers;i++){
            for(var j=0;j<getNeuronNumber(i);j++){
                tmp = d3.max(getWeights(i, j));
                if (max < tmp) max = tmp;
                tmp = d3.min(getWeights(i, j));
                if (min > tmp) min = tmp;
            }
        }
        return {"min": min, "max": max};
    };

    var getSynapses = function(layer_index, neuron, pos, layer2){
        var weights  = getWeights(layer_index, neuron);
        var synapses = Array(weights.length);
        for(var i in weights){
            synapses[i] = {
                "key": "layer"+layer_index+"_neuron"+neuron+"_layer2neuron"+i,
                "start": pos,
                "end":   layer2[i].position,
                "weight": weights[i],
                "type":   (weights[i]<0 ? "negative" : "positive")
            };
        }
        return synapses;
    };

    var getInputLabels = function(layer0){
        var labels = net["variables"];
        labels.push("Bias node");
        var variables = Array(labels.length);
        for(var i in layer0){
            variables[i] = {
                "x": layer0[i].position.x-style["variables"]["labels_layer0_padding"],
                "y": layer0[i].position.y,
                "text": labels[i] + ":"
            };
        }
        return variables;
    };

    var drawInputLabels = function(group){
       group.append("text")
           .text(function(d){return d[1].text;})
           .attr("x", function(d){return d[1].x-this.getComputedTextLength();})
           .attr("y", function(d){return d[1].y+0.25*this.getBBox().height;});
    };

    var drawNeurons = function (neuronsattr, layer_num, input_variable_labels) {
        if (input_variable_labels!==undefined){
            var dat = d3.zip(neuronsattr, getInputLabels(neuronsattr));
            console.log(dat);
        } else {
            var dat = d3.zip(neuronsattr, Array(neuronsattr.length));
        }
        var group = svg.append("g").attr("id", "layer_"+layer_num).selectAll("g")
            .data(dat)
            .enter()
            .append("g").attr("id", function(d){return "neuron_"+layer_num+""+d[0].index;});
        group.append("circle")
            .attr('r',     function(d){return d[0].radius})
            .attr('cx',    function(d){return d[0].position.x;})
            .attr('cy',    function(d){return d[0].position.y;})
            .style("fill", function(d){return style["neuron"]["colors"][d[0].type];});
        if (input_variable_labels!==undefined){
            drawInputLabels(group)
        }
        animate(group);
    };

    var scaleSynapsisPos = d3.scale.linear()
        .range(style["synapse"]["width_range"])
        .domain([0,getMinMaxWeight().max]);
    var scaleSynapsisNeg = d3.scale.linear()
        .range(style["synapse"]["width_range"])
        .domain([0, Math.abs(getMinMaxWeight().min)]);

    var drawSynapses = function(layer1, layer1_index, layer2){
        for(var idx in layer1){
            var synapses = getSynapses(layer1_index, idx, layer1[idx].position, layer2);
            svg.select("g#neuron_"+layer1_index+""+idx).append("g")
                .selectAll("line")
                .data(synapses)
                .enter()
                .append("line")
                .attr("x1", function(d){return d.start.x;})
                .attr("y1", function(d){return d.start.y;})
                .attr("x2", function(d){return d.end.x;})
                .attr("y2", function(d){return d.end.y;})
                .attr("stroke", function(d){return style["synapse"]["colors"][d.type]})
                .attr("stroke-width", function(d){
                    return d.type=="positive" ? scaleSynapsisPos(d.weight) : scaleSynapsisNeg(Math.abs(d.weight));
                })
                .attr("stroke-opacity", style["synapse"]["alpha"]);
        }
    };

    var animate = function(group){
        group.on('mouseover', function(d) {
            scaleSynapsisPos.range(style["synapse"]["mouseon"]["width_range"]);
            scaleSynapsisNeg.range(style["synapse"]["mouseon"]["width_range"]);
            var self = d3.select(this).transition();
            self.selectAll("line")
                .style("stroke-opacity", 1)
                .attr("stroke-width", function(d){
                    return d.type=="positive" ? scaleSynapsisPos(d.weight) : scaleSynapsisNeg(Math.abs(d.weight));
                });
            self.selectAll("circle")
                .attr("r", function(d){return d[0].radius*style["neuron"]["mouseon"]["change_radius"]});
            self.selectAll("text")
                .attr("x", function(d){return d[1].x-d[0].radius-this.getComputedTextLength();});

            var allbutnotthis = svg.selectAll("g").selectAll("g")
                .filter(function(x){return d[0].key!=x[0].key;}).transition();
            allbutnotthis.selectAll("line")
                .style("stroke-opacity", style["synapse"]["mouseon"]["alpha"]);
            allbutnotthis.selectAll("circle")
                .style("fill-opacity", style["neuron"]["mouseon"]["alpha"])
                .attr("r", function(d){return d[0].radius});
            scaleSynapsisPos.range(style["synapse"]["width_range"]);
            scaleSynapsisNeg.range(style["synapse"]["width_range"]);
        });
        group.on('mouseout', function(d){
            var gg = svg.selectAll("g").selectAll("g").transition();
            gg.selectAll("circle")
                .style("fill-opacity", 1)
                .attr("r", function(d){return d[0].radius;});
            gg.selectAll("line")
                .style("stroke-opacity", style["synapse"]["alpha"])
                .attr("stroke-width", function(d){
                    return d.type=="positive" ? scaleSynapsisPos(d.weight) : scaleSynapsisNeg(Math.abs(d.weight));
                });
            gg.selectAll("text")
                .attr("x", function(d){return d[1].x-this.getComputedTextLength();});
        });
    };

    this.draw = function () {
        var layers = Array(num_layers);
        for(var i=0;i<num_layers;i++){
            layers[i] = getNeuronsAttr(i);

        }
        for(i=0;i<num_layers;i++) {
            drawNeurons(layers[i], i, i==0 ? true : undefined);
            drawSynapses(layers[i], i, layers[i + 1]);
        }
    }
}



function drawNeuralNetwork(divid, json)
{
    var net = JSON.parse(json);
    console.log(net);

    require(['d3'], function(d3){
        var network = new NeuralNetwork(d3, net, divid);
        network.draw();
    });
}