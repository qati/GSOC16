import JsMVA.JPyInterface as jpy
import ROOT
from IPython.core.display import display, HTML
from string import Template


__obj = ""

__jsTMVASourceDir = "https://rawgit.com/qati/GSOC16/master/src/js"
__jsCanvasWidth   = 800
__jsCanvasHeight  = 600

__divUID = 1

__jsCode = Template("""
<div id="$divid" style="width: ${width}px; height:${height}px"></div>
<script>
    require.config({
        paths: {
            'JsMVA':'$PATH/JsMVA'
        }
    });
    if ((console!==undefined) && (typeof console.log == 'function')){
        console.log("JsMVA source_dir="+"$PATH");
    }
    require(['JsMVA'],function(jsmva){
	console.log(jsmva);
        jsmva.$funcName('$divid','$dat');
    });
</script>
""")


@staticmethod
def __Draw(obj, jsDrawMethod="draw", objIsJSON=False):
    global __obj, __jsCode, __jsCanvasWidth, __jsCanvasHeight, __jsTMVASourceDir, __divUID
    if objIsJSON:
        dat = obj
    else:
        dat = ROOT.TBufferJSON.ConvertToJSON(obj)
        dat = str(dat).replace("\n","")
    display(HTML(__jsCode.substitute({
        'funcName': jsDrawMethod,
        'divid':'jstmva_'+str(__divUID),
        'dat': dat,
        'PATH': __jsTMVASourceDir,
        'width': __jsCanvasWidth,
        'height': __jsCanvasHeight
    })));
    __divUID += 1
    __obj = (dat)

def save(fileName):
    global __obj
    f = open("blogJSON/"+fileName+".json", "w")
    f.write(__obj)
    f.close()


setattr(jpy.JsDraw, "Draw", __Draw)