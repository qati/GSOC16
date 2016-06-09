/**
 * Created by battila on 5/14/16.
 */

(function(factory){

    var JSROOT_source_dir = "https://root.cern.ch/js/notebook/scripts/";

    console.log("source:"+require.toUrl());

    require.config({
        paths: {
            'JsRootCore': JSROOT_source_dir+'JSRootCore.min',
            'nn': 'NeuralNetwork'
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

    };

    Objec.seal(JsMVA);
    return JsMVA;
}));
