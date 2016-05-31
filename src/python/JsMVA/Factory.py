# -*- coding: utf-8 -*-
#  Authors: Attila Bagoly <battila93@gmail.com>

import numpy as np
import ROOT
from ROOT import TMVA
import JPyInterface


def GetMethodObject(fac, datasetName, methodName):
    method = []
    for methodMapElement in fac.fMethodsMap:
        if methodMapElement[0] != datasetName:
            continue;
        methods = methodMapElement[1]
        for m in methods:
            if m.GetName() == methodName:
                method.append( m )
                break
    if len(method) != 1:
        print("Factory.GetMethodObject: no method object found")
        return 0
    return (method[0])


def DrawROCCurve(fac, datasetName):
    canvas = fac.GetROCCurve(datasetName)
    JPyInterface.JsDraw.Draw(canvas)

def DrawOutputDistribution(fac, datasetName, methodName):
    method = GetMethodObject(fac, datasetName, methodName)
    if method==0:
        return
    mvaRes = method.Data().GetResults(method.GetMethodName(), TMVA.Types.kTesting, TMVA.Types.kMaxAnalysisType)
    sig    = mvaRes.GetHist("MVA_S")
    bgd    = mvaRes.GetHist("MVA_B")
    c, l = JPyInterface.JsDraw.sbPlot(sig, bgd, {"xaxis": methodName+" response",
                                    "yaxis": "(1/N) dN^{ }/^{ }dx",
                                    "plot": "TMVA response for classifier: "+methodName})
    JPyInterface.JsDraw.Draw(c)

def DrawProbabilityDistribution(fac, datasetName, methodName):
    method = GetMethodObject(fac, datasetName, methodName)
    if method==0:
        return
    mvaRes = method.Data().GetResults(method.GetMethodName(), TMVA.Types.kTesting, TMVA.Types.kMaxAnalysisType)
    sig    = mvaRes.GetHist("Prob_S")
    bgd    = mvaRes.GetHist("Prob_B") #Rar_S
    c, l   = JPyInterface.JsDraw.sbPlot(sig, bgd, {"xaxis": "Signal probability",
                                        "yaxis": "(1/N) dN^{ }/^{ }dx",
                                        "plot": "TMVA probability for classifier: "+methodName})
    JPyInterface.JsDraw.Draw(c)

#TODO more nice structure here
#TODO not fixed formule (now S/sqrt{S+B})
def DrawCutEfficiencies(fac, datasetName, methodName):
    method = GetMethodObject(fac, datasetName, methodName)
    if method==0:
        return
    mvaRes = method.Data().GetResults(method.GetMethodName(), TMVA.Types.kTesting, TMVA.Types.kMaxAnalysisType)
    sigE = mvaRes.GetHist("MVA_EFF_S")
    bgdE = mvaRes.GetHist("MVA_EFF_B")

    fNSignal = 1000
    fNBackground = 1000

    f = ROOT.TFormula("sigf", "x/sqrt(x+y)")

    pname    = "purS_"         + methodName
    epname   = "effpurS_"      + methodName
    ssigname = "significance_" + methodName

    nbins = sigE.GetNbinsX()
    low   = sigE.GetBinLowEdge(1)
    high  = sigE.GetBinLowEdge(nbins+1)

    purS    = ROOT.TH1F(pname, pname, nbins, low, high)
    sSig    = ROOT.TH1F(ssigname, ssigname, nbins, low, high)
    effpurS = ROOT.TH1F(epname, epname, nbins, low, high)

    #chop off useless stuff
    sigE.SetTitle( "Cut efficiencies for "+methodName+" classifier")

    TMVA.TMVAGlob.SetSignalAndBackgroundStyle( sigE, bgdE )
    TMVA.TMVAGlob.SetSignalAndBackgroundStyle( purS, bgdE )
    TMVA.TMVAGlob.SetSignalAndBackgroundStyle( effpurS, bgdE )
    sigE.SetFillStyle( 0 )
    bgdE.SetFillStyle( 0 )
    sSig.SetFillStyle( 0 )
    sigE.SetLineWidth( 3 )
    bgdE.SetLineWidth( 3 )
    sSig.SetLineWidth( 3 )

    purS.SetFillStyle( 0 )
    purS.SetLineWidth( 2 )
    purS.SetLineStyle( 5 )
    effpurS.SetFillStyle( 0 )
    effpurS.SetLineWidth( 2 )
    effpurS.SetLineStyle( 6 )
    sig = 0
    maxSigErr = 0
    for i in range(1,sigE.GetNbinsX()+1):
        eS = sigE.GetBinContent( i )
        S = eS * fNSignal
        B = bgdE.GetBinContent( i ) * fNBackground
        if (S+B)==0:
            purS.SetBinContent( i, 0)
        else:
            purS.SetBinContent( i, S/(S+B) )

        sSig.SetBinContent( i, f.Eval(S,B) )
        effpurS.SetBinContent( i, eS*purS.GetBinContent( i ) )

    maxSignificance = sSig.GetMaximum()
    maxSignificanceErr = 0
    sSig.Scale(1/maxSignificance)

    c = ROOT.TCanvas( "canvasCutEff","Cut efficiencies for "+methodName+" classifier", 800,600 )

    c.SetGrid(1)
    c.SetTickx(0)
    c.SetTicky(0)

    TMVAStyle = ROOT.gROOT.GetStyle("Plain")
    TMVAStyle.SetLineStyleString( 5, "[32 22]" )
    TMVAStyle.SetLineStyleString( 6, "[12 22]" )

    c.SetTopMargin(.2)

    effpurS.SetTitle("Cut efficiencies and optimal cut value")
    if methodName.find("Cuts")!=-1:
        effpurS.GetXaxis().SetTitle( "Signal Efficiency" )
    else:
        effpurS.GetXaxis().SetTitle( "Cut value applied on " + methodName + " output" )
    effpurS.GetYaxis().SetTitle( "Efficiency (Purity)" )
    TMVA.TMVAGlob.SetFrameStyle( effpurS )

    c.SetTicks(0,0)
    c.SetRightMargin ( 2.0 )

    effpurS.SetMaximum(1.1)
    effpurS.Draw("histl")

    purS.Draw("samehistl")

    sigE.Draw("samehistl")
    bgdE.Draw("samehistl")

    signifColor = ROOT.TColor.GetColor( "#00aa00" )

    sSig.SetLineColor( signifColor )
    sSig.Draw("samehistl")

    effpurS.Draw( "sameaxis" )


    legend1 = ROOT.TLegend( c.GetLeftMargin(), 1 - c.GetTopMargin(),
                                     c.GetLeftMargin() + 0.4, 1 - c.GetTopMargin() + 0.12 )
    legend1.SetFillStyle( 1 )
    legend1.AddEntry(sigE,"Signal efficiency","L")
    legend1.AddEntry(bgdE,"Background efficiency","L")
    legend1.Draw("same")
    legend1.SetBorderSize(1)
    legend1.SetMargin( 0.3 )


    legend2 = ROOT.TLegend( c.GetLeftMargin() + 0.4, 1 - c.GetTopMargin(),
                                     1 - c.GetRightMargin(), 1 - c.GetTopMargin() + 0.12 )
    legend2.SetFillStyle( 1 )
    legend2.AddEntry(purS,"Signal purity","L")
    legend2.AddEntry(effpurS,"Signal efficiency*purity","L")
    legend2.AddEntry(sSig, "S/#sqrt{ S+B }","L")
    legend2.Draw("same")
    legend2.SetBorderSize(1)
    legend2.SetMargin( 0.3 )

    effline = ROOT.TLine( sSig.GetXaxis().GetXmin(), 1, sSig.GetXaxis().GetXmax(), 1 )
    effline.SetLineWidth( 1 )
    effline.SetLineColor( 1 )
    effline.Draw()

    c.Update()

    tl = ROOT.TLatex()
    tl.SetNDC()
    tl.SetTextSize( 0.033 )
    maxbin = sSig.GetMaximumBin()
    line1 = tl.DrawLatex( 0.15, 0.23, "For %1.0f signal and %1.0f background"%(fNSignal, fNBackground))
    tl.DrawLatex( 0.15, 0.19, "events the maximum S/#sqrt{S+B} is")

    if maxSignificanceErr > 0:
        line2 = tl.DrawLatex( 0.15, 0.15, "%5.2f +- %4.2f when cutting at %5.2f"%(
                                                      maxSignificance,
                                                      maxSignificanceErr,
                                                      sSig.GetXaxis().GetBinCenter(maxbin)) )
    else:
        line2 = tl.DrawLatex( 0.15, 0.15, "%4.2f when cutting at %5.2f"%(
                                                      maxSignificance,
                                                      sSig.GetXaxis().GetBinCenter(maxbin)) )

    if methodName.find("Cuts")!=-1:
        tl.DrawLatex( 0.13, 0.77, "Method Cuts provides a bundle of cut selections, each tuned to a")
        tl.DrawLatex(0.13, 0.74, "different signal efficiency. Shown is the purity for each cut selection.")

    #FIXME xaxis coordinates and not attached to coordinate system
    rightAxis = ROOT.TGaxis(1.134, sSig.GetYaxis().GetXmin()-0.33,
                            1.134, sSig.GetYaxis().GetXmax()-0.23, 0, 1.1*maxSignificance,110, "+L")
    rightAxis.SetLineColor ( signifColor )
    rightAxis.SetLabelColor( signifColor )
    rightAxis.SetTitleColor( signifColor )

    rightAxis.SetTitleSize( sSig.GetXaxis().GetTitleSize() )
    rightAxis.SetTitle( "Significance" )
    rightAxis.Draw()

    c.Update()

    JPyInterface.JsDraw.Draw(c)