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
    },
    neighborhood: function(idList, lengthLimit)
    {
        var pageSize = 100000;
        var query = `CALL neighborhood([${idList}], [], ${lengthLimit}, false,
            ${pageSize}, 1, '', true, '', 0,{}, 0, 0, 0, 100000, [])`;
            return query
    },
    commonStream: function(idList, lengthLimit)
    {
        var pageSize = 100000;
        var query = `CALL commonStream([${idList}],, [], ${lengthLimit}, 1,
            ${pageSize}, 1, '', true, '', 0,{}, 0, 0, 0, 100000, [])`;
            return query
    },
    upstream: function(idList, lenghtLimit)
    {
        var pageSize = 100000;
        var query = `CALL commonStream([${idList}],, [], ${lengthLimit}, 1,
            ${pageSize}, 1, '', true, '', 0,{}, 0, 0, 0, 100000, [])`;
            return query
    },
    downstream: function(idList, lengthLimit)
    {
        var pageSize = 100000;
        var query = `CALL commonStream([${idList}],, [], ${lengthLimit}, 0,
            ${pageSize}, 1, '', true, '', 0,{}, 0, 0, 0, 100000, [])`;
            return query
    }
}
module.exports = graphAlgos;
