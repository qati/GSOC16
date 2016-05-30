# -*- coding: utf-8 -*-
#  Authors: Attila Bagoly <battila93@gmail.com>

from ROOT import TH1F, TMVA


def GetInputVariableHist(self, className, variableName, numBin, processTrfs=""):
    dsinfo = self.DefaultDataSetInfo()
    vi = 0;
    ivar = 0;
    for i in range(dsinfo.GetNVariables()):
        if dsinfo.GetVariableInfo(i).GetLabel()==variableName:
            vi   = dsinfo.GetVariableInfo(i)
            ivar = i
            break
    if vi==0:
        return 0

    h = TH1F(className, str(vi.GetExpression()) + " ("+className+")", numBin, vi.GetMin(), vi.GetMax())

    clsn = dsinfo.GetClassInfo(className).GetNumber()
    ds   = dsinfo.GetDataSet()

    trfsDef = processTrfs.split(';')
    trfs    = [];
    for trfDef in trfsDef:
        trfs.append(TMVA.TransformationHandler(dsinfo, "DataLoader"))
        TMVA.MethodBase.CreateVariableTransforms( trfDef, dsinfo, trfs[-1], self.Log())

    inputEvents = ds.GetEventCollection()
    transformed = 0
    tmp         = 0
    #FIXME CalcTransformations calls PlotVariables: in my opinion here we shouldn't call that method
    for trf in trfs:
        if transformed==0:
            transformed = trf.CalcTransformations(inputEvents, 1)
        else:
            tmp = trf.CalcTransformations(transformed, 1)
            del transformed[:]
            transformed = tmp

    if transformed!=0:
        for event in transformed:
            if event.GetClass() != clsn:
                continue
            h.Fill(event.GetValue(ivar))
        del transformed
    else:
        for event in inputEvents:
            if event.GetClass() != clsn:
                continue
            h.Fill(event.GetValue(ivar))
    return (h)