var jquery = ($ = require("jquery"));

var graphAlgos = {
    pathsFromTo: function(sourceArray, targetArray, limit)
    {
        return `UNWIND $sourceArray as source WITH source 
        UNWIND $targetArray as target 
        WITH source, target 
        match p=(a {entityName: source})-[*..${limit}]-(b {entityName: target}) 
        return a, b, p`
    },

    pathsBetween: function(idList, lengthLimit)
    {
        console.log("idList",idList)
        var pageSize = 100000;
        var query = `CALL graphOfInterest([${idList}], [], ${lengthLimit}, false,
        ${pageSize}, 1, '', true, '', 0, {}, 0, 1000, 0, 1000000, [])`;
        return query
    }
}
module.exports = graphAlgos;
