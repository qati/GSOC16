/**
 * Created by Attila Bagoly <battila93@gmail.com> on 6/23/16.
 */

(function(factory){
    define(["JsRootCore"], function(jsroot){
        return factory({}, jsroot);
    });
})(function(IChart, JSROOT){

    var data = [];
    var map  = {};

    var divID;

    var mapNextIndex = function(){
        var vals = [];
        for(var key in map){
            vals.push(map[key]);
        }
        return vals.length==0 ? 0 : Math.max(...vals)+1;
    };

    IChart.addData = function(dat){
        for(var key in dat){
            if (key in map) {
                data[map[key]].x.push(dat[key].x);
                data[map[key]].y.push(dat[key].y);
            } else {
                map[key] = mapNextIndex();
                data[map[key]] = {
                    x: [],
                    y: []
                };
            }
        }
        if (data[0].x.length>1) updateChart();
    };

    IChart.clearData = function(){
        data = [];
    };

    var drawChart = function(){
        var graph = JSROOT.CreateTGraph(data[0].x.length, data[0].x, data[0].y);
        graph.fTitle = "error:"+data[0].x.length;
        graph.fName = "graph";
        JSROOT.redraw(divID, graph);
    };

    var updateChart = function(){
        var graph = JSROOT.CreateTGraph(data[0].x.length, data[0].x, data[0].y);
        graph.fTitle = "error:"+data[0].x.length;
        graph.fName = "graph";
        console.log(graph);
        JSROOT.redraw(divID, graph);
    };

    IChart.draw = function(divid, dat, labels) {
        divID = divid;
        IChart.clearData();

        IChart.addData(dat);
        drawChart();
    };

    Object.seal(IChart);
    return IChart;
});