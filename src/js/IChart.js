/**
 * Created by Attila Bagoly <battila93@gmail.com> on 6/23/16.
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
})(function(IChart, d3){

    var style = {
        line: {
            palette: ["red", "blue", "green"],
            width: "2px"
        },
        scale: {
            padding: 0.02
        },
        aduration: 1000
    };

    var margin = {
        top: 20,
        bottom: 30,
        left: 50,
        right: 20
    };

    var data = [];
    var map  = {};

    var mapNextIndex = function(){
        var vals = [];
        for(var key in map){
            vals.push(map[key]);
        }
        return vals.length==0 ? 0 : Math.max(...vals)+1;
    };

    var setScaleDomain = function(){
        var minX=1e20, minY=1e20, maxX=-1e20, maxY=-1e20;
        for(var i=0;i<data.length;i++){
            for(var j=0;j<data[i].length;j++){
                if (data[i][j].x<minX) minX = data[i][j].x;
                if (data[i][j].y<minY) minY = data[i][j].y;
                if (data[i][j].x>maxX) maxX = data[i][j].x;
                if (data[i][j].y>maxY) maxY = data[i][j].y;
            }
        }
        var paddingX = (maxX-minX)*style.scale.padding,
            paddingY = (maxY-minY)*style.scale.padding;
        scaleX.domain([minX-paddingX, maxX+paddingX]);
        scaleY.domain([minY-paddingY, maxY+paddingY]);
    };


    var scaleX = d3.scale.linear(),
        scaleY = d3.scale.linear();

    var xAxis = d3.svg.axis()
        .scale(scaleX)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(scaleY)
        .orient("left");

    var line = d3.svg.line()
        .x(function(d){return scaleX(d.x);})
        .y(function(d){return scaleY(d.y);});

    var canvas, svg;

    var drawChart = function(){
        svg.selectAll("g.lineContainer")
            .data(data)
            .enter()
            .append("g").attr("class", "lineContainer")
            .append("path")
            .attr("class", "line")
            .attr("d", function(d){return line(d)})
            .style("fill", "none")
            .style("stroke", function(d,i){return style.line.palette[i];})
            .style("stroke-width", style.line.width)
    };

    var updateChart = function(){
        setScaleDomain();
        svg.selectAll("path.line").transition().duration(style.aduration)
            .attr("class", "line")
            .attr("d", function(d){return line(d)})
            .style("fill", "none")
            .style("stroke", function(d,i){return style.line.palette[i];})
            .style("stroke-width", style.line.width);

        svg.select("g.xaxis").transition().duration(style.aduration)
            .call(xAxis);
        svg.select("g.yaxis").transition().duration(style.aduration)
            .call(yAxis);

        svg.selectAll("g.xaxis>g.tick>line, g.yaxis>g.tick>line")
            .style("fill", "none")
            .style("stroke", "#000")
            .style("stroke-width", 1);
    };

    IChart.addData = function(dat){
        for(var key in dat){
            if (key in map) {
                data[map[key]].push(dat[key]);
            } else {
                map[key] = mapNextIndex();
                data[map[key]] = [];
            }
        }
        if (data.length>1) updateChart();
    };

    IChart.clearData = function(){
        data = [];
    };

    IChart.draw = function(divid, dat, labels){
        IChart.clearData();
        var div = d3.select("#"+divid);

        canvas = {
            width:  div.property("style")["width"],
            height: div.property("style")["height"]
        };

        svg = div.append("svg")
            .attr("width", canvas.width)
            .attr("height", canvas.height)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        Object.keys(canvas).forEach(function (key) {
            canvas[key] = Number(canvas[key].replace("px",""));
            canvas[key] -= key=="width" ? (margin.left + margin.right) : (margin.top + margin.bottom);
        });

        scaleX.range([0, canvas.width]);
        scaleY.range([canvas.height, 0]);

        svg.append("g")
            .attr("class", "xaxis")
            .attr("transform", "translate(0, "+canvas.height+")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "yaxis")
            .call(yAxis);

        svg.selectAll("g.xaxis>path, g.yaxis>path")
            .style("fill", "none")
            .style("stroke", "#000")
            .style("stroke-width", 1);

        svg.selectAll("g.xaxis>g.tick>line, g.yaxis>g.tick>line")
            .style("fill", "none")
            .style("stroke", "#000")
            .style("stroke-width", 1);

        var legendContainer = svg.append("g").attr("class", "legend")
            .selectAll("g.legend")
            .data(labels.legend)
            .enter()
            .append("g")
            .attr("transform", function(d,i){
                return "translate("+(canvas.width-150)+","+(i*20)+")";
            });
        legendContainer.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", function(d, i){return style.line.palette[i];});
        legendContainer.append("text")
            .text(function(d){return d;})
            .attr("dx", 13)
            .attr("dy", 10);

        svg.append("g")
            .attr("transform", "translate("+0.5*canvas.width+", 0)")
            .append("text")
            .style("font-weight", "bold")
            .text(labels.ylabel+" vs. "+ labels.xlabel);

        IChart.addData(dat);
        drawChart();
    };

    Object.seal(IChart);
   return IChart;
});