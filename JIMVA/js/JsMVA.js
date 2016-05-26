/**
 * Created by battila on 5/14/16.
 */

(function(factory){

    var jsmva = factory({});

    var dir = jsmva.JSROOT_source_dir + "scripts/",
        ext = jsmva.JSROOT_source_min ? ".min" : "";

    require.config({
        paths: {
            'JsRootCore': dir+'JSRootCore'+ext
        }
    });

    define(['JsRootCore'], function(jsroot){
        jsmva.set_JSROOT(jsroot);
        return jsmva;
    });

}(function(JsMVA){

    JsMVA.JSROOT_source_dir = "https://root.cern.ch/js/notebook/";
    JsMVA.JSROOT_source_min = true;

    var JSROOT;

    JsMVA.set_JSROOT = function(jsroot){
        JSROOT = jsroot;
    }

    JsMVA.drawTH2 = function(divid, dat_json){
        var obj = JSROOT.parse(dat_json);
        JSROOT.draw(divid, obj, "colz");
    }

    JsMVA.draw = function(divid, dat_json){
        var obj = JSROOT.parse(dat_json);
        JSROOT.draw(divid, obj);
    }

    return JsMVA;
}));
