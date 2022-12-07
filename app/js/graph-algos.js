var jquery = ($ = require("jquery"));

var graphAlgos = {
    pathsFromTo: function(sourceArray, targetArray, limit)
    {
        return `UNWIND $sourceArray as source WITH source 
        UNWIND $targetArray as target 
        WITH source, target 
        match p=(a {entityName: source})-[*..${limit}]-(b {entityName: target}) 
        return a, b, p`
    }
}
module.exports = graphAlgos;
