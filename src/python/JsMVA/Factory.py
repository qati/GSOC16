# -*- coding: utf-8 -*-
#  Authors: Attila Bagoly <battila93@gmail.com>

from ROOT import TMVA


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

def GetOutputDistribution(fac, datasetName, methodName):
    method  = GetMethodObject(fac, datasetName, methodName)
    mvaRes  = method.Data().GetResults(method.GetMethodName(), TMVA.Types.kTesting, TMVA.Types.kMaxAnalysisType)
    return ( mvaRes.GetHist("MVA_S"), mvaRes.GetHist("MVA_B") )

def GetProbabilityDistribution(fac, datasetName, methodName):
    method  = GetMethodObject(fac, datasetName, methodName)
    mvaRes  = method.Data().GetResults(method.GetMethodName(), TMVA.Types.kTesting, TMVA.Types.kMaxAnalysisType)
    return ( mvaRes.GetHist("Prob_S"), mvaRes.GetHist("Prob_B") ) #Rar_S