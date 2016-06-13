/**
 * Created by Attila Bagoly <battila93@gmail.com> on 6/7/16.
 */

(function(factory){

    var blogjsmva = factory({});

    require.config({
        paths: {
            'JsMVA':'https://rawgit.com/qati/GSOC16/master/src/js/JsMVA.min'
        }
    });

    define(['JsMVA'], function(jsmva){
        blogjsmva.set_JsMVA(jsmva);
        return blogjsmva;
    });

}(function(blog){

    var datURL = "http://qati.github.io/data/json/";
    var parts  = ["", "part1/"];

    var JsMVA;

    blog.set_JsMVA = function(jsmva){
        JsMVA = jsmva;
    }

    blog.getData = function(part, file, func){
        var xmlhttp = new XMLHttpRequest();
        var url = datURL+parts[part]+file+".json";

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                func(xmlhttp.responseText);
            }
        };
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }
    
    blog.draw = function (part, file, method, divid) {
        blog.getData(part, file, function (dat) {
            JsMVA[method](divid, dat);
        });
    }


    return blog;
}));
