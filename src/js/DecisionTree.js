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
        node: {
            padding: 10,
            width: 40,
            height: 20
        },
        edge: {
            e: 1
        }
    };

    var canvas, svg, roottree, variables;

    var calcHeight = function(tree){
        return 1+Math.max(("l" in tree)?calcHeight(tree["l"]):0, ("r" in tree)?calcHeight(tree["r"]):0);
    };

    var generateNodesPosition = function () {
        var attrs = Array();
        var index = 0;
        var traverseTree = function(tree, stage, parent_position){
            attrs.push({
                position: {
                    x: stage.x1+0.5*(stage.x2-stage.x1)-0.5*style.node.width,
                    y: stage.y1
                },
                purity: tree.info["purity"],
                cut: tree.info["Cut"],
                varlabel: variables[tree.info["IVar"]],
                parent: parent_position,
                key: index++
            });
            var height = calcHeight(tree);
            if ("l" in tree){
                traverseTree(tree["l"], {
                    x1: stage.x1,
                    x2: 0.5*(stage.x2-stage.x1),
                    y1: stage.y1+(stage.y2-stage.y1)/height,
                    y2: stage.y2
                }, attrs[attrs.length-1].position);
            }
            if ("r" in tree){
                traverseTree(tree["r"], {
                    x1: 0.5*(stage.x2-stage.x1),
                    x2: stage.x2,
                    y1: stage.y1+(stage.y2-stage.y1)/height,
                    y2: stage.y2
                }, attrs[attrs.length-1].position);
            }
            return;
        };
        traverseTree(roottree, {
            x1:style.node.padding,
            y1:style.node.padding,
            x2: (canvas.width-style.node.padding),
            y2: (canvas.height-style.node.padding)
        }, {});
        return attrs;
    };

    var drawTree = function(){
        console.log(roottree);
        var tree = generateNodesPosition(roottree);
        console.log(tree);
        svg.selectAll("rect")
            .data(tree)
            .enter()
            .append("rect")
            .attr("x", function(d){return d.position.x;})
            .attr("y", function (d){return d.position.y;})
            .attr("width", style.node.width)
            .attr("height", style.node.width)
            .attr("fill", "blue");
    };

    DecisionTree.draw = function(divid, pyobj){
        roottree = pyobj["tree"];
        variables = pyobj["variables"];
        var div = d3.select("#"+divid);
        canvas = {
            width:  div.property("style")["width"],
            height: div.property("style")["height"]
        };
        if (Object.size(roottree)==0){
            div.innerHTML = "<b style='color:red;'>Tree empty...</b>";
            return;
        }
        svg = div.append("svg")
            .attr("width", canvas.width)
            .attr("height", canvas.height);
        Object.keys(canvas).forEach(function (key) {
            canvas[key] = Number(canvas[key].replace("px",""))
        });
        console.log(roottree)
        var tree = d3.layout.tree();
        var nodes = tree.nodes(roottree);
        console.log(nodes);
        svg.selectAll("g")
            .data(nodes)
            .enter()
            .append("g")
            .attr("translate", function(d){return "transform("+d.x+","+d.y+")";})
            .append("circle")
            .attr("r",10)
            .attr("fill", "blue");

    };

    Object.seal(DecisionTree);
    return DecisionTree;
});