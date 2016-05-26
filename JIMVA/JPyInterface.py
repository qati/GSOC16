# -*- coding: utf-8 -*-
#  Authors: Attila Bagoly <battila93@gmail.com>

import ROOT
from IPython.core.display import display, HTML
from string import Template
from variables import InputVariables


dlDrawFunctions  = ["DrawCorrelationMatrix", "DrawInputVariable"]
facDrawFunctions = ["DrawROCCurve"]

def enableJsMVA():
    global dlDrawFunctions, facDrawFunctions
    JPyInterface.enableJS()
    __registerFunctions(ROOT.TMVA.DataLoader, JPyInterface, *dlDrawFunctions)
    __registerFunctions(ROOT.TMVA.Factory,    JPyInterface, *facDrawFunctions)

def disableJsMVA():
    global dlDrawFunctions, facDrawFunctions
    JPyInterface.disableJS()
    __unregisterFunctions(ROOT.TMVA.DataLoader, *dlDrawFunctions)
    __unregisterFunctions(ROOT.TMVA.Factory,    *facDrawFunctions)
    __registerFunctions(ROOT.TMVA.DataLoader, JPyInterface, "InputVariable")

def __registerFunctions(target, source, *args):
    for arg in args:
        setattr(target, arg, getattr(source, arg))

def __unregisterFunctions(target, *args):
    for arg in args:
        if hasattr(target, arg):
            delattr(target, arg)

def __captureObjects(*args):
    ip      = get_ipython()
    vList   = [ip.user_ns[key] for key in ip.user_ns]
    res     = {}
    for ttype in args:
        res[ttype.__name__] = [ttype]
    for var in vList:
        for ttype in args:
            if type(var) == ttype:
                res[ttype.__name__].append( var )
    return res


class JPyInterface:
    __jsTMVASourceDir = "https://rawgit.com/qati/GSOC16/master/JIMVA/js"
    __jsCanvasWidth   = 800
    __jsCanvasHeight  = 600

    __divUID = 1

    __jsCode=Template("""
<div id="$divid" style="width: ${width}px; height:${height}px"></div>
<script>
    require.config({
        paths: {
            'JsMVA':'$PATH/JsMVA'
        }
    });
    if ((console!==undefined) && (typeof console.log == 'function')){
        console.log("JsTMVA source_dir="+"$PATH");
    }
    require(['JsMVA'],function(jsmva){
        jsmva.$funcName('$divid','$dat');
    });
</script>
""")

    __jsVisualization = True

    @staticmethod
    def enableJS():
        JPyInterface.__jsVisualization = True

    @staticmethod
    def disableJS():
        JPyInterface.__jsVisualization = False

    @staticmethod
    def Draw(obj, jsDrawMethod='draw'):
        dat = ROOT.TBufferJSON.ConvertToJSON(obj)
        dat = str(dat).replace("\n","")
        display(HTML(JPyInterface.__jsCode.substitute({
            'funcName': jsDrawMethod,
            'divid':'jstmva_'+str(JPyInterface.__divUID),
            'dat': dat,
            'PATH': JPyInterface.__jsTMVASourceDir,
            'width': JPyInterface.__jsCanvasWidth,
            'height': JPyInterface.__jsCanvasHeight
         })));
        JPyInterface.__divUID += 1

    @staticmethod
    def DrawCorrelationMatrix(dl, className):
        th2 = dl.GetCorrelationMatrix(className)
        if not JPyInterface.__jsVisualization:
            return
        JPyInterface.Draw(th2, 'drawTH2')


    @staticmethod
    def DrawROCCurve(fac, datasetName):
        canvas = fac.GetROCCurve(datasetName)
        if not JPyInterface.__jsVisualization:
            return
        JPyInterface.Draw(canvas)

    @staticmethod
    def InputVariable(dl, variableName, numBin=100, processTrfs=""):
        sig = dl.GetInputVariableHist("Signal",     variableName, numBin, processTrfs)
        bkg = dl.GetInputVariableHist("Background", variableName, numBin, processTrfs)
        return InputVariables.sbPlot(sig, bkg)

    @staticmethod
    def DrawInputVariable(dl, variableName, numBin=100, processTrfs=""):
        if not JPyInterface.__jsVisualization:
            return
        c, l = JPyInterface.InputVariable(dl, variableName, numBin, processTrfs)
        JPyInterface.Draw(c)
