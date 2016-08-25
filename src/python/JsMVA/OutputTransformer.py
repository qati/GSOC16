# -*- coding: utf-8 -*-
## @package JsMVA.FormatedOutput
# @author Attila Bagoly <battila93@gmail.com>
# This class will transform the TMVA original output to HTML formated output.

import JPyInterface
import DataLoader
from ROOT import TMVA
import re

class transformTMVAOutputToHTML:

    def __init__(self):
        self.__eventsUID = 0

    def __processGroupContentLine(self, line):
        if re.match(r"^\s*:?\s*-*\s*$", line)!=None:
            return ""
        if line.find("Booking method")!=-1:
            line = "Booking method: <b>" + line.split(":")[1].replace("\x1b[1m", "").replace("[0m", "")+"</b>"
        return "<td>"+str(line)+"</td>"

    def __isEmpty(self, line):
        return re.match(r"^\s*:?\s*-*$", line)!=None

    def __transformDatasetSpecificContent(self, firstLine, startIndex, maxlen):
        tmp_str = ""
        count = 0
        for l in xrange(1, maxlen):
            nextline = self.lines[startIndex+l]
            if self.__isEmpty(nextline):
                count += 1
                continue
            DatasetName = re.match(r".*(\[.*\])\s*:\s*(.*)", nextline)
            if DatasetName:
                count += 1
                tmp_str += "<tr>"+self.__processGroupContentLine(DatasetName.group(2))
                tmp_str += "<td class='tmva_output_hidden_td'></td></tr>"
            else:
                break
        DatasetName = re.match(r".*(\[.*\])\s*:\s*(.*)", firstLine)
        self.__lastDataSetName = DatasetName.group(1).replace("[", "").replace("]", "")
        tbodyclass = ""
        if count > 0:
            tbodyclass = " class='tmva_output_tbody_multiple_row'"
        rstr = "<table class='tmva_output_dataset'><tbody"+tbodyclass+">"
        rstr += "<tr><td rowspan='"+str(count+1)+"'>Dataset: "+self.__lastDataSetName+"</td>"
        rstr += self.__processGroupContentLine(DatasetName.group(2)) + "<td class='tmva_output_hidden_td'></td></tr>"
        rstr += tmp_str
        rstr += "</tbody></table>"
        return (count, rstr)

    def __transformNumEvtSpecificContent(self, firstLine, startIndex, maxlen):
        tmp_str = ""
        count = 0
        tmpmap = {}
        for l in xrange(1, maxlen):
            nextline = self.lines[startIndex+l]
            if self.__isEmpty(nextline):
                count += 1
                continue
            NumberOfEvents = re.match(r"\s+:\s*\w+\s*-\s*-\s*((training\sevents)|(testing\sevents)|(training\sand\stesting\sevents))\s*:\s*\d+", nextline)
            if NumberOfEvents:
                lc = re.findall(r"\w+", nextline)
                t = ""
                for i in range(1, len(lc) - 1):
                    t += lc[i] + " "
                t = t[:-1]
                if lc[0] not in tmpmap:
                    tmpmap[lc[0]] = []
                count += 1
                tmpmap[lc[0]].append({"name": t, "value": lc[len(lc) - 1]})
            else:
                break
        rstr = "<table class='tmva_output_traintestevents'>"
        rstr += "<tr><td colspan='3'><center>"+firstLine+"</center></td></tr>"
        for key in tmpmap:
            rstr += "<tr>"
            rstr += "<td rowspan='"+str(len(tmpmap[key]))+"'>"+key+"</td>"
            rstr += "<td>"+tmpmap[key][0]["name"]+"</td><td>"+tmpmap[key][0]["value"]+"</td>"
            rstr += "<td class='tmva_output_hidden_td'></td>"
            rstr += "</tr>"
            for i in xrange(1, len(tmpmap[key])):
                rstr += "<tr><td>"+tmpmap[key][i]["name"]+"</td><td>"+tmpmap[key][i]["value"]+"</td>"
                rstr += "<td class='tmva_output_hidden_td'></td></tr>"
        rstr += tmp_str
        rstr += "</table>"
        return (count, rstr)

    def __transformVariableMeanSpecificContent(self, headerMatch, startIndex, maxlen):
        count = 0
        table = [[]]
        for j in range(1, 6):
            table[0].append(headerMatch.group(j))
        for l in xrange(1, maxlen):
            nextline = self.lines[startIndex + l]
            if self.__isEmpty(nextline):
                count += 1
                continue
            VariableMean = re.match(r"\s*:?\s*(\w+):?\s*(-?\d*\.?\d*)\s*(-?\d*\.?\d*)\s*\[\s*(-?\d*\.?\d*)\s*(-?\d*\.?\d*)\s*\].*", nextline, re.I)
            if VariableMean:
                count += 1
                tmp = []
                for j in range(1, 6):
                    tmp.append(VariableMean.group(j))
                table.append(tmp)
            else:
                break
        rstr = "<table class='tmva_output_varmeanrms'>"
        for i in xrange(len(table)):
            rstr += "<tr>"
            for j in xrange(len(table[i])):
                rstr += "<td>" + str(table[i][j])
            rstr += "<td class='tmva_output_hidden_td'></td>"
            rstr += "</tr>"
        rstr += "</table>"
        return (count, rstr)

    def __correlationMatrix(self, title, className):
        id = "jsmva_outputtansformer_events_"+str(self.__eventsUID)+"_onclick"
        self.__eventsUID += 1
        loaders = JPyInterface.functions.captureObjects(TMVA.DataLoader)["TMVA::DataLoader"]
        for ldl in loaders:
            try:
                if ldl.GetName()==self.__lastDataSetName:
                    loader = ldl
            except TypeError:
                pass
        json = DataLoader.GetCorrelationMatrixInJSON(loader, className)
        jsCall = "require(['JsMVA'],function(jsmva){jsmva.outputShowCorrelationMatrix('"+id+"');});"
        rstr = "<div id='"+id+"' style='display: none;'>"+json+"</div>"
        rstr += self.__processGroupContentLine("<a onclick=\""+jsCall+"\" class='tmva_output_corrmat_link'>" + title + " (" + className + ")</a>")
        return rstr

    def __transformOneGroup(self, firstLine):
        tmp_str = ""
        processed_lines = 0
        lineIter = iter(xrange(len(self.lines) - self.lineIndex))
        for j in lineIter:
            if j==0:
                nextline = firstLine
            else:
                nextline = self.lines[self.lineIndex + j]
            Header = re.match(r"^(\w+.*\s+)(\s+)(:)\s*(.*)", nextline)
            DatasetName = re.match(r".*(\[.*\])\s*:\s*(.*)", nextline)
            NumEvents = re.match(r"(.*)(number\sof\straining\sand\stesting\sevents)", nextline, re.I)
            CorrelationMatrixHeader = re.match(r"\s*:?\s*(correlation\s*matrix)\s*\((\w+)\)\s*:\s*", nextline, re.I)
            VariableMeanHeader = re.match(r"\s*:?\s*(variable)\s*(mean)\s*(rms)\s*\[\s*(min)\s*(max)\s*\].*", nextline, re.I)
            if Header == None or j==0:
                if j!=0:
                    processed_lines += 1
                    self.iterLines.next()
                    tmp_str += "<tr>"
                if DatasetName or NumEvents or VariableMeanHeader:
                    if DatasetName:
                        func = self.__transformDatasetSpecificContent
                        fLine = nextline
                    elif NumEvents:
                        func = self.__transformNumEvtSpecificContent
                        fLine = NumEvents.group(2)
                    else:
                        func = self.__transformVariableMeanSpecificContent
                        fLine = VariableMeanHeader
                    count, tmp = func(fLine, self.lineIndex + j, len(self.lines) - self.lineIndex - j)
                    for x in xrange(count):
                        lineIter.next()
                        self.iterLines.next()
                    tmp_str += self.__processGroupContentLine(tmp)
                elif CorrelationMatrixHeader:
                    tmp_str += self.__correlationMatrix(CorrelationMatrixHeader.group(1), CorrelationMatrixHeader.group(2))
                    ik = 1
                    while True:
                        corrMatLine = re.match(r"\s*:\s*(var\d+)|(var\d+[+-]var\d+):\s*\+(\S*)+", self.lines[self.lineIndex+j+ik])
                        if corrMatLine or self.__isEmpty(self.lines[self.lineIndex+j+ik]):
                            ik += 1
                            self.iterLines.next()
                            lineIter.next()
                        else:
                            break
                else:
                    lmatch = re.match(r"\s*:\s*(.*)", nextline)
                    if lmatch:
                        tmp_str += self.__processGroupContentLine(lmatch.group(1))
                    else:
                        tmp_str += self.__processGroupContentLine(nextline)
                tmp_str += "</tr>"
            else:
                break
        tbodyclass = ""
        if processed_lines > 0:
            tbodyclass = " class='tmva_output_tbody_multiple_row'"
        self.out += "<tbody"+tbodyclass+"><tr><td rowspan='" + str(processed_lines + 1) + "' class='tmva_output_header'>" + self.__currentHeaderName + "</td>"
        self.out += tmp_str + "</tbody>"

    def transform(self, output, error):
        self.err = ""
        if str(error).find(", time left:")==-1:
            self.err = error
        self.out = "<table class='tmva_output_table'>"
        self.lines = output.splitlines()
        self.iterLines = iter(xrange(len(self.lines)))
        for self.lineIndex in self.iterLines:
            line = self.lines[self.lineIndex]
            Header = re.match(r"^(\w+.*\s+)(\s+)(:)\s*(.*)", line)
            if Header:
                self.__currentHeaderName = Header.group(1)
                self.__transformOneGroup(Header.group(4))
        self.out += "</table>"
        return (self.out, self.err, "html")