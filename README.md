# JsMVA

[![Binder](http://mybinder.org/badge.svg)](http://mybinder.org/repo/qati/GSOC16)


### Setup stuff
* We have to add the following lines to JupyROOT/__init__.py
```python
import sys, os.path
sys.path.append(os.path.expanduser("PATH TO JsMVA"));
import JsMVA
```

* We have to make `TMVA::MethodBase::CreateVariableTransforms` function public.

