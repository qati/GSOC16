/**
 * Created by battila on 5/14/16.
 */

(function(factory){

    var JSROOT_source_dir = "https://root.cern.ch/js/notebook/scripts/";

    var url = "";
    if (require.s.contexts.hasOwnProperty("_")) {
        url = require.s.contexts._.config.paths["JsMVA"].replace("JsMVA","");
    }
    if ((console!==undefined) && (typeof console.log == 'function')) {
        if (url!=""){
            console.log("JsMVA source dir:" + url.substring(0, url.length-1));
        } else {
            console.log("JsMVA source dir can't be resolved, requireJS doesn't have context '_', this will be a problem!");
        }
    }

    require.config({
        paths: {
            'JsRootCore': JSROOT_source_dir+'JSRootCore.min',
            'nn': url+'NeuralNetwork'
        }
    });

    define(['JsRootCore'], function(jsroot){
        return factory({}, jsroot);
    });

}(function(JsMVA, JSROOT){

    JsMVA.drawTH2 = function(divid, dat_json){
        var obj = JSROOT.parse(dat_json);
        JSROOT.draw(divid, obj, "colz");
    };

    JsMVA.draw = function(divid, dat_json){
        var obj = JSROOT.parse(dat_json);
        JSROOT.draw(divid, obj);
    };

    JsMVA.drawNeuralNetwork = function(divid, dat_json){
        var obj = JSON.parse(dat_json);
        require(['nn'], function(nn){
            nn.draw(divid, obj);
        });
    };

    return JsMVA;
}));
