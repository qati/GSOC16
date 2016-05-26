# -*- coding: utf-8 -*-
#  Authors: Attila Bagoly <battila93@gmail.com>

import ROOT


class InputVariables:
    @staticmethod
    def sbPlot(sig, bkg):
        canvas = ROOT.TCanvas("csbplot", "InputVariables", 800, 600)
        #ROOT.TMVA.TMVAGlob.SetSignalAndBackgroundStyle(sig, bkg)
        #ROOT.TMVA.TMVAGlob.SetFrameStyle(sig, 1.2)
        sig.SetMaximum(ROOT.TMath.Max(sig.GetMaximum(),bkg.GetMaximum()*1.1))
        sig.SetTitle(sig.GetTitle().replace("(Signal)",""))
        sig.GetXaxis().SetTitle(sig.GetTitle())
        sig.GetYaxis().SetTitle("N")
        sig.SetTitle("Input variable:"+sig.GetTitle())
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
