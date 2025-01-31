import sys
import json
from libsbml import *
import tellurium as te

sbmlString: str = sys.argv[1]
start: int = int(sys.argv[2])
stop: int = int(sys.argv[3])
step: int = int(sys.argv[4])

document: SBMLDocument = readSBMLFromString(sbmlString)

r = te.loadSBMLModel(sbmlString)
output = r.simulate(start, stop, step)


column_dict = {}
for i in range(output.shape[1]):
    id = output.colnames[i]
    values = list(output[0:, i]) 
    concentration = False
    if id[0] == "[":
        id = id[1:-1]
        concentration = True
    if id != "time" and document.getElementBySId(id).getName() is not None: 
        id = document.getElementBySId(id).getName()
    if concentration:
        id = "[" + id + "]"
    column_dict[id] = values

print(json.dumps(column_dict))
