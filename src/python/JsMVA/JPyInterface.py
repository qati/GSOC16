# -*- coding: utf-8 -*-
#  Authors: Attila Bagoly <battila93@gmail.com>

from IPython.core.display import display, HTML
from string import Template
import ROOT
import DataLoader
import Factory


class functions:
    __dlFunctions      = ["GetInputVariableHist"]
    __facFunctions     = ["GetOutputDistribution", "GetProbabilityDistribution"]
    __dlDrawFunctions  = ["DrawCorrelationMatrix", "DrawInputVariable"]
    __facDrawFunctions = ["DrawROCCurve", "DrawOutputDistribution", "DrawProbabilityDistribution"]

    @staticmethod
    def __register(target, source, *args):
        for arg in args:
            if hasattr(target, arg):
                continue
            setattr(target, arg, getattr(source, arg))

    @staticmethod
    def __unregister(target, *args):
        for arg in args:
            if hasattr(target, arg):
                delattr(target, arg)

    @staticmethod
    def register():
        functions.__register(ROOT.TMVA.DataLoader, DataLoader, *functions.__dlFunctions)
        functions.__register(ROOT.TMVA.Factory,    Factory,    *functions.__facFunctions)
        functions.__register(ROOT.TMVA.DataLoader, JsDraw,     *functions.__dlDrawFunctions)
        functions.__register(ROOT.TMVA.Factory,    JsDraw,     *functions.__facDrawFunctions)

    @staticmethod
    def unregister():
        functions.__unregister(ROOT.TMVA.DataLoader, DataLoader, *functions.__dlFunctions)
        functions.__unregister(ROOT.TMVA.Factory,    Factory,    *functions.__facFunctions)
        functions.__unregister(ROOT.TMVA.DataLoader, JsDraw,     *functions.__dlDrawFunctionss)
        functions.__unregister(ROOT.TMVA.Factory,    JsDraw,     *functions.__facDrawFunctions)


class JsDraw:
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
    def Draw(obj, jsDrawMethod='draw'):
        dat = ROOT.TBufferJSON.ConvertToJSON(obj)
        dat = str(dat).replace("\n","")
        display(HTML(JsDraw.__jsCode.substitute({
            'funcName': jsDrawMethod,
            'divid':'jstmva_'+str(JsDraw.__divUID),
            'dat': dat,
            'PATH': JsDraw.__jsTMVASourceDir,
            'width': JsDraw.__jsCanvasWidth,
            'height': JsDraw.__jsCanvasHeight
         })));
        JsDraw.__divUID += 1

    @staticmethod
    def DrawCorrelationMatrix(dl, className):
        th2 = dl.GetCorrelationMatrix(className)
        JsDraw.Draw(th2, 'drawTH2')

    @staticmethod
    def DrawROCCurve(fac, datasetName):
        canvas = fac.GetROCCurve(datasetName)
        JsDraw.Draw(canvas)

    @staticmethod
    def DrawInputVariable(dl, variableName, numBin=100, processTrfs=""):
        sig = dl.GetInputVariableHist( "Signal",     variableName, numBin, processTrfs)
        bkg = dl.GetInputVariableHist( "Background", variableName, numBin, processTrfs)
        c, l = JsDraw.sbPlot(sig, bkg, {"xaxis": sig.GetTitle(),
                                        "yaxis": "N",
                                        "plot": "Input variable: "+sig.GetTitle()})
        JsDraw.Draw(c)

    @staticmethod
    def DrawOutputDistribution(fac, datasetName, method):
        sig, bkg =  fac.GetOutputDistribution(datasetName, method)
        c, l = JsDraw.sbPlot(sig, bkg, {"xaxis": method+" response",
                                        "yaxis": "(1/N) dN^{ }/^{ }dx",
                                        "plot": "TMVA response for classifier: "+method})
        JsDraw.Draw(c)

    @staticmethod
    def DrawProbabilityDistribution(fac, datasetName, method):
        sig, bkg = fac.GetProbabilityDistribution(datasetName, method)
        c, l = JsDraw.sbPlot(sig, bkg, {"xaxis": "Signal probability",
                                        "yaxis": "(1/N) dN^{ }/^{ }dx",
                                        "plot": "TMVA probability for classifier: "+method})
        JsDraw.Draw(c)

    @staticmethod
    def sbPlot(sig, bkg, title):
        canvas = ROOT.TCanvas("csbplot", title["plot"], 800, 600)
        #ROOT.TMVA.TMVAGlob.SetSignalAndBackgroundStyle(sig, bkg)
        #ROOT.TMVA.TMVAGlob.SetFrameStyle(sig, 1.2)
        sig.SetMaximum(ROOT.TMath.Max(sig.GetMaximum(),bkg.GetMaximum()*1.1))
        sig.SetTitle(sig.GetTitle().replace("(Signal)",""))
        sig.GetXaxis().SetTitle(title["xaxis"])
        sig.GetYaxis().SetTitle(title["yaxis"])
        sig.SetTitle(title["plot"])
        bkg.SetFillColorAlpha(ROOT.kRed, 0.3)
        sig.SetFillColor(ROOT.kBlue)
        bkg.SetLineColor(ROOT.kRed)
        sig.Draw("hist")
        bkg.Draw("histsame")

        legend = ROOT.TLegend(1-canvas.GetLeftMargin()-0.39, 1-canvas.GetTopMargin()-0.15,
                              1-canvas.GetLeftMargin()-0.01, 1-canvas.GetTopMargin()-0.01)
        legend.SetFillStyle(1)
        legend.AddEntry(sig, "Signal", "F")
        legend.AddEntry(bkg, "Background", "F")
        legend.SetBorderSize(1)
        legend.SetMargin(0.3)
        legend.Draw()

        return (canvas, legend)