/**
 * Created by attila on 6/11/16.
 */


(function(factory){
    
    require.config({
       paths:{
           d3: "https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min"
       } 
    });

    define(["d3"], function(d3){
        return factory({}, d3);
    });

})(function(DecisionTree, d3){

    Object.size = function(obj){
        return Object.keys(obj).length;
    };

    var style = {
        margin: {
            x: 20,
            y: 20
        },
        node: {
            padding: 10,
            yspace: 50,
            xspace: 10,
            width: 150,
            height: 40,
            mwidth: 150,
            mheight: 60,
            colors: {
                focus: "#033A00",
                closed: "#00A62B",
                pureBkg: "red",
                pureSig: "blue"
            },
            swidth: "4px",
        },
        link: {
            colors:{
                default: "#ccc",
                focus: "#033A00"
            },
            width: "4px",
            focus_width: "8px"
        },
        aduration: 1500,
        legend: {
            size: 20,
            rect_width: 100,
            rect_height: 30,
            rect_fucus_width: 115
        },
        text: {
            color: "#DEDEDE"
        }
    };


    var nodeColor = d3.scale.linear()
        .range([style.node.colors.pureBkg, style.node.colors.pureSig]);

    var canvas, svg, roottree, variables;

    var d3tree = d3.layout.tree();
    var d3path = (function(){
        var diagonal = d3.svg.diagonal();
        var forEachData = function(d, i, hidden){
            if (hidden) return diagonal(d);
            return diagonal({
                source: {
                    x: (d.source.x + style.node.width),
                    y: d.source.y
                },
                target: {
                    x: (d.target.x + style.node.width),
                    y:  d.target.y - style.node.height
                }
            });
        };
        return forEachData;
    })();

    var clickOnNode = function(d){
        if ("children" in d){
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        drawTree(d);
    };

    var drawLabels = function(nodeContainer){
        nodeContainer.append("text")
            .attr("dy", (style.node.height*0.35)+"px")
            .attr("class", function(d){
                d.labelid = 1;
                return "label1";
            })
            .style("fill-opacity", 1e-6)
            .style("cursor", "pointer")
            .style("fill", style.text.color)
            .style("font-weight", "bold")
            .text(function(d){
                return "S/(S+B)="+Number(d.info.purity).toFixed(3);
            })
            .style("font-size", function(d) {
                d.font_size=10*style.node.width / (this.getComputedTextLength()) + "px";
                return d.font_size;
            })
            .attr("dx", function(d){
                return (style.node.width*0.5-this.getComputedTextLength()*0.5)+"px";
            });
        nodeContainer.append("text")
            .attr("class", function(d){
                d.labelid = 2;
                return "label2";
            })
            .attr("dy", (style.node.height*0.75)+"px")
            .style("fill-opacity", 1e-6)
            .style("cursor", "pointer")
            .text(function(d){
                return d.info.IVar!=-1
                    ? variables[d.info.IVar]+">"+(Number(d.info.Cut).toFixed(3))
                    : "";
            })
            .style("font-size", function(d) { return d.font_size;})
            .style("fill", style.text.color)
            .style("font-weight", "bold")
            .attr("dx", function(d){
                return (style.node.width*0.5-this.getComputedTextLength()*0.5)+"px"
            });
    };

    var drawNodes = function(nodeSelector, father){
        var nodeContainer = nodeSelector.enter()
            .append("g").attr("class", "nodes")
            .attr("transform", function(d){return "translate("+father.x0+","+father.y0+")";})
            .style("cursor","pointer")
            .filter(function(d){
                return d.parent;
            })
            .on("click", clickOnNode)
            .on("mouseover", path)
            .on("mouseout", function(d, i){return path(d, i, 1);});

        nodeContainer.append("rect")
            .attr("width", 1e-6)
            .attr("height", 1e-6);

        drawLabels(nodeContainer);

        nodeSelector.transition().duration(style.aduration)
            .attr("transform", function(d){
                return "translate("
                    + (d.x+style.node.width*0.5) + ","
                    + (d.y-style.node.height) + ")";
            });

        nodeSelector.select("rect").transition().duration(style.aduration)
            .attr("width", style.node.width)
            .attr("height", style.node.height)
            .attr("fill", function(d){return nodeColor(Number(d.info.purity));})
            .style("stroke-width", style.node.swidth)
            .style("stroke", function(d){
                return (d._children) ? style.node.colors.closed : "";
            });

        nodeSelector.selectAll("text").transition().duration(style.aduration*2)
            .style("fill-opacity", 1);

        var nodeExit = nodeSelector.exit()
            .transition().duration(style.aduration)
            .attr("transform", function(d){
                return "translate("
                    + (father.x+style.node.width) + ","
                    + father.y + ")";
            })
            .remove();

        nodeExit.select("rect")
            .attr("width", 1e-6)
            .attr("height", 1e-6);

        nodeExit.selectAll("text")
            .style("fill-opacity", 1e-6);
    };

    var drawLinks = function(linkSelector, father){
        linkSelector.enter()
            .insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d, i){
                var o = {x:father.x0, y:father.y0};
                return d3path({source: o, target: o},i, 1);
            });

        linkSelector.transition().duration(style.aduration)
            .attr("d", d3path)
            .style("fill", "none")
            .style("stroke", style.link.colors.default)
            .style("stroke-width", style.link.width)
            .attr("id", function(d){return "link"+d.target.id;});

        linkSelector.exit()
            .transition().duration(style.aduration)
            .attr("d", function(d, i){
                var o = {x:father.x+style.node.width, y:father.y};
                return d3path({source:o, target:o},i, 1);
            })
            .remove();
    };

    var path = function(node, i, clear){
        svg.selectAll("path.link").filter(function(d){return d.target.id==node.id})
            .style("stroke-width", (clear) ? style.link.width : style.link.focus_width)
            .style("stroke", (clear) ? style.link.colors.default : style.link.colors.focus);
        svg.selectAll("g.nodes rect").filter(function(d){return d.id==node.id})
            .style("stroke-width", style.node.swidth)
            .style("stroke", function(d){
                return (clear)
                    ? (d._children) ? style.node.colors.closed : nodeColor(d.info.purity)
                    : style.node.colors.focus;
            });
        if (node.parent) path(node.parent, i, clear);
    };

    var drawTree = function(father){
        var nodes = d3tree.nodes(roottree),
            links = d3tree.links(nodes);

        var maxDepth = 0;
        nodes.forEach(function(d){
           if (maxDepth<Number(d.depth)) maxDepth = Number(d.depth);
        });

        nodes.forEach(function(d){
           d.y = d.depth * canvas.height / maxDepth;
        });

        if (!("x0") in father || !("y0" in father)){
            father.x0 = nodes[0].x+style.node.width*0.5;
            father.y0 = nodes[0].y-style.node.height;
        }

        var nodeSelector = svg.selectAll("g.nodes")
            .data(nodes, function(d, i ){return d.id || (d.id =  i);});

        drawNodes(nodeSelector, father);

        var linkSelector = svg.selectAll("path.link")
            .data(links, function(d){return d.target.id;});

        drawLinks(linkSelector, father);

        nodes.forEach(function(d){
            d.x0 = d.x+style.node.width;
            d.y0 = d.y;
        });
    };

    var treeHeight = function(tree){
        if (tree.length!==undefined){
            var sum = 0;
            for(var i in tree){
                sum += treeHeight(tree[i]);
            }
            return sum;
        }
        if (!("children" in tree) || tree["children"].length==0) return 0;
        return 1+treeHeight(tree["children"]);
    };

    var treeWidth = function(nodes){
        var posxs = Array();
        for (var i in nodes) {
            if (posxs.indexOf(Math.round(nodes[i].x))==-1){
                posxs.push(Math.round(nodes[i].x));
            }
        }
        return posxs.length+1;
    };

    var purityToColor = function(nodes){
        var min = 1e6,
            max = -1e6;
        var pur;
        for (var i in nodes) {
            pur = Number(nodes[i].info.purity);
            if (pur<min) min = pur;
            if (pur>max) max = pur;
        }
        return [min, max];
    };

    var updateSizesColors = function(){
        var nodes = d3tree.nodes(roottree);
        style.node.height = canvas.height/(treeHeight(nodes[0])+1)-style.node.yspace;
        if (style.node.height>style.node.mheight) style.node.height = style.node.mheight;
        style.node.width  = canvas.width/(treeWidth(nodes)+1)-style.node.xspace;
        if (style.node.width>style.node.mwidth) style.node.height = style.node.mwidth;
        d3tree.size([canvas.width, canvas.height]);
        nodeColor.domain(purityToColor(nodes));
    };

    var drawLegend = function(svgOriginal){
        var labels = [
            {text: "Pure Backg.", id: "label1", color: nodeColor(nodeColor.domain()[0]), x:5,y:5},
            {text: "Pure Signal", id: "label2", color: nodeColor(nodeColor.domain()[1]), x:5,y:40}
        ];
        var legend = svgOriginal.append("g")
            .attr("transform", "translate(5,5)");

        var group = legend.selectAll("g")
            .data(labels, function(d){return d.id;})
            .enter()
            .append("g")
            .style("cursor", "pointer")
            .attr("transform", function(d){return "translate("+d.x+","+d.y+")";});

        group.on("mouseover", function(d){
            d3.select("#"+d.id).style("font-weight", "bold");
            d3.select("#"+d.id+"_rect").attr("width", style.legend.rect_fucus_width);
        });
        group.on("mouseout", function(d){
            d3.select("#"+d.id).style("font-weight", "normal");
            d3.select("#"+d.id+"_rect").attr("width", style.legend.rect_width);

        });

        group.append("rect")
            .attr("id", function(d){return d.id+"_rect";})
            .attr("width", style.legend.rect_width)
            .attr("height", style.legend.rect_height)
            .attr("fill", function(d){return d.color;});

        group.append("text")
            .attr("id", function(d){return d.id;})
            .attr("x", function(d){return 5;})
            .attr("y", function(d){return 20;})
            .text(function(d){return d.text;})
            .style("fill", style.text.color);
    };

    DecisionTree.draw = function(divid, pyobj){
        var div = d3.select("#"+divid);

        roottree  = pyobj["tree"];
        variables = pyobj["variables"];

        if (Object.size(roottree)==0){
            div.innerHTML = "<b style='color:red;'>Tree empty...</b>";
            return;
        }

        canvas = {
            width:  div.property("style")["width"],
            height: div.property("style")["height"]
        };

        svg = div.append("svg")
            .attr("width", canvas.width)
            .attr("height", canvas.height);
        var svgOriginal = svg;
        Object.keys(canvas).forEach(function (key) {
            canvas[key] = Number(canvas[key].replace("px",""));
            canvas[key] -= key=="width" ? 2*style.margin.x+style.node.width : 2*style.margin.y+style.node.height;
        });

        updateSizesColors();

        var zoom = d3.behavior.zoom()
            .scaleExtent([1, 10])
            .on("zoom", function(){
                svg.attr("transform",
                    "translate("+(-style.node.width)+", "+style.node.height
                    +")translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            });
        svg = svg
            .on("dblclick", function(){
                zoom.scale(1);
                zoom.translate([0, 0]);
                svg.transition().attr("transform", "translate("+(-style.node.width)+", "+style.node.height+")scale(1)");
            })
            .append("g").call(zoom).append("g")
            .attr("transform", "translate("+(-style.node.width)+", "+style.node.height+")");

        drawLegend(svgOriginal);

        drawTree(roottree);
    };

    Object.seal(DecisionTree);
    return DecisionTree;
});