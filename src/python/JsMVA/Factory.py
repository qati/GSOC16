# -*- coding: utf-8 -*-
#  Authors: Attila Bagoly <battila93@gmail.com>

import ROOT
from ROOT import TMVA
import JPyInterface
from xml.etree.ElementTree import ElementTree
import json
from IPython.core.display import display, clear_output
from ipywidgets import widgets
from threading import Thread, Timer



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
        return None
    return (method[0])


def GetDeepNetwork(xml_file):
    tree = ElementTree()
    tree.parse(xml_file)
    roottree = tree.getroot()
    network  = {}
    network["variables"] = []
    for v in roottree.find("Variables"):
        network["variables"].append(v.get('Title'))
    layout = roottree.find("Weights").find("Layout")
    net    = []
    for layer in layout:
        net.append({"Connection": layer.get("Connection"),
        "Nodes": layer.get("Nodes"),
        "ActivationFunction": layer.get("ActivationFunction"),
        "OutputMode": layer.get("OutputMode")
         })
    network["layers"] = net
    Synapses = roottree.find("Weights").find("Synapses")
    synapses = {
        "InputSize": Synapses.get("InputSize"),
        "OutputSize": Synapses.get("OutputSize"),
        "NumberSynapses": Synapses.get("NumberSynapses"),
        "synapses": []
    }
    for i in Synapses.text.split(" "):
        tmp = i.replace("\n", "")
        if len(tmp)>1:
            synapses["synapses"].append(tmp)
    network["synapses"] = synapses
    return json.dumps(network)


def GetNetwork(xml_file):
    tree = ElementTree()
    tree.parse(xml_file)
    roottree = tree.getroot()
    network  = {}
    network["variables"] = []
    for v in roottree.find("Variables"):
        network["variables"].append(v.get('Title'))
    layout = roottree.find("Weights").find("Layout")

    net    = { "nlayers": layout.get("NLayers") }
    for layer in layout:
        neuron_num = int(layer.get("NNeurons"))
        neurons    = { "nneurons": neuron_num }
        i = 0
        for neuron in layer:
            label = "neuron_"+str(i)
            i    += 1
            nsynapses = int(neuron.get('NSynapses'))
            neurons[label] = {"nsynapses": nsynapses}
            if nsynapses == 0:
                break
            text = str(neuron.text)
            wall = text.replace("\n","").split(" ")
            weights = []
            for w in wall:
                if w!="":
                    weights.append(float(w))
            neurons[label]["weights"] = weights
        net["layer_"+str(layer.get('Index'))] = neurons
    network["layout"] = net
    return json.dumps(network)


class TreeReader:
    """Reads Decision Tree from XML file"""

    def __init__(self, fileName):
        self.__xmltree = ElementTree()
        self.__xmltree.parse(fileName)
        self.__NTrees = int(self.__xmltree.find("Weights").get('NTrees'))

    def getNTrees(self):
        return (self.__NTrees)

    def __getBinaryTree(self, itree):
        if self.__NTrees<=itree:
            print( "to big number, tree number must be less then %s"%self.__NTrees )
            return 0
        return self.__xmltree.find("Weights").find("BinaryTree["+str(itree+1)+"]")

    def __readTree(self, binaryTree, tree={}, depth=0):
        nodes = binaryTree.findall("Node")
        if len(nodes)==0:
            return
        if len(nodes)==1 and nodes[0].get("pos")=="s":
            info = {
                "IVar":   nodes[0].get("IVar"),
                "Cut" :   nodes[0].get("Cut"),
                "purity": nodes[0].get("purity"),
                "pos":    0
            }
            tree["info"]     = info
            tree["children"] = []
            self.__readTree(nodes[0], tree, 1)
            return
        for node in nodes:
            info = {
                "IVar":   node.get("IVar"),
                "Cut" :   node.get("Cut"),
                "purity": node.get("purity"),
                "pos":    node.get("pos")
            }
            tree["children"].append({
               "info": info,
                "children": []
            })
            self.__readTree(node, tree["children"][-1], depth+1)

    def getTree(self, itree):
        binaryTree = self.__getBinaryTree(itree)
        if binaryTree==0:
            return {}
        tree = {}
        self.__readTree(binaryTree, tree)
        return tree

    def getVariables(self):
        variables = []
        varstree = self.__xmltree.find("Variables").findall("Variable")
        variables = [None]*len(varstree)
        for v in varstree:
            variables[int(v.get('VarIndex'))] = v.get('Expression')
        return variables



def DrawROCCurve(fac, datasetName):
    canvas = fac.GetROCCurve(datasetName)
    JPyInterface.JsDraw.Draw(canvas)


def DrawOutputDistribution(fac, datasetName, methodName):
    method = GetMethodObject(fac, datasetName, methodName)
    if method==None:
        return None
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

    c = ROOT.TCanvas( "canvasCutEff","Cut efficiencies for "+methodName+" classifier", JPyInterface.JsDraw.jsCanvasWidth,
                      JPyInterface.JsDraw.jsCanvasHeight)

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
    wx = (sigE.GetXaxis().GetXmax()+abs(sigE.GetXaxis().GetXmin()))*0.135
    rightAxis = ROOT.TGaxis( sigE.GetXaxis().GetXmax()+wx,
                             c.GetUymin()-0.3,
                             sigE.GetXaxis().GetXmax()+wx,
                             0.7, 0, 1.1*maxSignificance,510, "+L")
    rightAxis.SetLineColor ( signifColor )
    rightAxis.SetLabelColor( signifColor )
    rightAxis.SetTitleColor( signifColor )

    rightAxis.SetTitleSize( sSig.GetXaxis().GetTitleSize() )
    rightAxis.SetTitle( "Significance" )
    rightAxis.Draw()

    c.Update()

    JPyInterface.JsDraw.Draw(c)


def DrawNeuralNetwork(fac, datasetName, methodName):
    m = GetMethodObject(fac, datasetName, methodName)
    if m==None:
        return None
    if (methodName=="DNN"):
        net = GetDeepNetwork(str(m.GetWeightFileName()))
    else:
        net = GetNetwork(str(m.GetWeightFileName()))
    JPyInterface.JsDraw.Draw(net, "drawNeuralNetwork", True)


def DrawDecisionTree(fac, datasetName, methodName):
    m = GetMethodObject(fac, datasetName, methodName)
    if m==None:
        return None
    tr = TreeReader(str(m.GetWeightFileName()))

    variables = tr.getVariables();

    def clicked(b):
        if treeSelector.value>tr.getNTrees():
            treeSelector.value = tr.getNTrees()
        clear_output()
        toJs = {
            "variables": variables,
            "tree": tr.getTree(treeSelector.value)
        }
        json_str = json.dumps(toJs)
        JPyInterface.JsDraw.Draw(json_str, "drawDecisionTree", True)

    mx = str(tr.getNTrees()-1)

    treeSelector = widgets.IntText(value=0, font_weight="bold")
    drawTree     = widgets.Button(description="Draw", font_weight="bold")
    label        = widgets.HTML("<div style='padding: 6px;font-weight:bold;color:#333;'>Decision Tree [0-"+mx+"]:</div>")

    drawTree.on_click(clicked)
    container = widgets.HBox([label,treeSelector, drawTree])
    display(container)


def __UpdateData(m):
    if not m.TrainingEnded():
        Timer(0.5, __UpdateData, args=[m]).start()
    res = m.GetInteractiveTrainingData()
    dat = json.dumps({
        "l1": {"x": res[0], "y": res[1]},
        "l2": {"x": res[0], "y": res[2]}
    })
    #clear_output()
    JPyInterface.JsDraw.InsertData(dat)

def __TrainAllMethods(fac, dataset):
    m = GetMethodObject(fac, dataset, "MLP")
    ROOT.TMVA.Factory.MyTrain._threaded = True
    t = Thread(target=ROOT.TMVA.Factory.MyTrain, args=[fac])
    t.start()
    def stop(b):
        m.ExitFromTraining()
    stopTraining = widgets.Button(description="Stop", font_weight="bold")
    stopTraining.on_click(stop)
    display(stopTraining)
    ROOT.gSystem.Sleep._threaded = True
    ROOT.gSystem.Sleep(1500)
    res = m.GetInteractiveTrainingData()
    dat = json.dumps({
        "l1": {"x": res[0], "y": res[1]},
        "l2": {"x": res[0], "y": res[2]}
    })
    JPyInterface.JsDraw.Draw(dat, "drawTrainingTestingErrors", True)
    __UpdateData(m)
    return

ROOT.TMVA.Factory.TrainAllMethods2 = __TrainAllMethods