# JsMVA

[![Binder](http://mybinder.org/badge.svg)](http://mybinder.org/repo/qati/GSOC16)


### Setup stuff
* We have to add the following lines to JupyROOT/__init__.py
```python
import sys, os.path
sys.path.append(os.path.expanduser("PATH TO JsMVA"));
import JsMVA
```
* TMVA::Configurable.h we need to make Log() function public, because we need access to this function in python.

* TMVA::DataLoader.h we need to make DefaultDataSetInfo() public

