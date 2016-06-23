# -*- coding: utf-8 -*-
#  Authors: Attila Bagoly <battila93@gmail.com>

from IPython.core.display import display, HTML
from string import Template
import ROOT
import DataLoader
import Factory


class functions:
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
    def __getMethods(module, selector):
        methods = []
        for method in dir(module):
            if method.find(selector)!=-1:
                methods.append(method)
        return methods

    @staticmethod
    def register():
        functions.__register(ROOT.TMVA.DataLoader, DataLoader, *functions.__getMethods(DataLoader, "Draw"))
        functions.__register(ROOT.TMVA.Factory,    Factory,    *functions.__getMethods(Factory,    "Draw"))

    @staticmethod
    def unregister():
        functions.__register(ROOT.TMVA.DataLoader, DataLoader, *functions.__getMethods(DataLoader, "Draw"))
        functions.__register(ROOT.TMVA.Factory,    Factory,    *functions.__getMethods(Factory,    "Draw"))


class JsDraw:
    __jsMVASourceDir = "https://rawgit.com/qati/GSOC16/master/src/js"
    #__jsMVASourceDir = "http://localhost:8888/notebooks/GSOC/wd/src/js"

    jsCanvasWidth   = 800
    jsCanvasHeight  = 450

    __divUID = 1

    __jsCode = Template("""
<div id="$divid" style="width: ${width}px; height:${height}px"></div>
<script>
    require.config({
        paths: {
            'JsMVA':'$PATH/JsMVA.min'
        }
    });
    require(['JsMVA'],function(jsmva){
        jsmva.$funcName('$divid','$dat');
    });
</script>
""")
    __jsCodeForDataInsert = Template("""<script id="dataInserterScript">
require(['JsMVA'],function(jsmva){
jsmva.$funcName('$dat');
var script = document.getElementById("dataInserterScript");
script.parentElement.parentElement.remove();
});
</script>""")

    @staticmethod
    def Draw(obj, jsDrawMethod='draw', objIsJSON=False):
        if objIsJSON:
            dat = obj
        else:
            dat = ROOT.TBufferJSON.ConvertToJSON(obj)
            dat = str(dat).replace("\n","")

        display(HTML(JsDraw.__jsCode.substitute({
            'funcName': jsDrawMethod,
            'divid':'jstmva_'+str(JsDraw.__divUID),
            'dat': dat,
            'PATH': JsDraw.__jsMVASourceDir,
            'width': JsDraw.jsCanvasWidth,
            'height': JsDraw.jsCanvasHeight
         })))
        JsDraw.__divUID += 1

    @staticmethod
    def InsertData(dat, dataInserterMethod="IChartDataInserter"):
        display(HTML(JsDraw.__jsCodeForDataInsert.substitute({
            'funcName': dataInserterMethod,
            'dat': dat
         })))

    @staticmethod
    def sbPlot(sig, bkg, title):
        canvas = ROOT.TCanvas("csbplot", title["plot"], JsDraw.jsCanvasWidth, JsDraw.jsCanvasHeight)
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