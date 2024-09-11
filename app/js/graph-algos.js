var graphAlgos = {
  pathsFromTo: function (limit) {
    return `
    UNWIND $idList AS a
UNWIND $idList AS b
WITH a, b
WHERE a <> b  // Ensure a and b are different
MATCH p=(n)-[*]-(m)  // Match paths of any length
WHERE id(n) = a AND id(m) = b 
  AND NONE(r IN relationships(p) WHERE type(r) IN ['belongs_to_compartment', 'belongs_to_submap', 'belongs_to_complex'])  // Exclude specific relationships
WITH p, 
     [x IN nodes(p) WHERE NOT x.class IN ['process', 'omitted_process','uncertain_process','association','dissociation','phenotype']] AS filteredNodes  // Filter out multiple node classes
WHERE size(filteredNodes) - 1 <= ${limit}  // Ensure that the non-excluded nodes count is within the length limit
RETURN nodes(p), relationships(p);
    `;
    // return `UNWIND $sourceArray as source WITH source 
    //           UNWIND $targetArray as target 
    //           WITH source, target 
    //           match p=(a)-[rels*..${limit}]-(b) 
    //           WHERE id(a) = source and id(b) = target and NONE (r IN rels WHERE type(r)= 'belongs_to_compartment')  
    //           and  NONE (r IN rels WHERE type(r)= 'belongs_to_submap')
    //           and  NONE (r IN rels WHERE type(r)= 'belongs_to_complex')
    //           return nodes(p), relationships(p)`;
  },

  pathsBetween: function ( lengthLimit) {
    // var query = `UNWIND $idList as a 
    // UNWIND $idList as b 
    // WITH   a, b 
    // MATCH p=(n )-[rels*..${lengthLimit}]-(m)
    // WHERE id(n) = a and id(m) = b and a <>b and NONE (r IN rels WHERE type(r)= 'belongs_to_compartment')  
    //         and  NONE (r IN rels WHERE type(r)= 'belongs_to_submap')
    //         and  NONE (r IN rels WHERE type(r)= 'belongs_to_complex')
    //         return nodes(p), relationships(p)`;
    var query=`
    UNWIND $idList AS a
UNWIND $idList AS b
WITH a, b
WHERE a <> b  // Ensure a and b are different
MATCH p=(n)-[*]-(m)  // Match paths of any length
WHERE id(n) = a AND id(m) = b 
  AND NONE(r IN relationships(p) WHERE type(r) IN ['belongs_to_compartment', 'belongs_to_submap', 'belongs_to_complex'])  // Exclude specific relationships
WITH p, 
     [x IN nodes(p) WHERE NOT x.class IN ['process', 'omitted_process','uncertain_process','association','dissociation','phenotype']] AS filteredNodes  // Filter out multiple node classes
WHERE size(filteredNodes) - 1 <= ${lengthLimit}  // Ensure that the non-excluded nodes count is within the length limit
RETURN nodes(p), relationships(p);`
    return query;
  },
  neighborhood: function ( lengthLimit) {
    var query = `UNWIND $idList as ids
        MATCH p=(a)-[rels*..${lengthLimit}]-(b)
        WHERE id(a) = ids and  NONE (r IN rels WHERE type(r)= 'belongs_to_compartment')  
        and  NONE (r IN rels WHERE type(r)= 'belongs_to_submap')
        and  NONE (r IN rels WHERE type(r)= 'belongs_to_complex')
        RETURN nodes(p), relationships(p)`;
    return query;
  },

  //Doesn't work for now
  //Uses user defined function written in : https://github.com/iVis-at-Bilkent/visuall-advanced-query/
  //Contact Yusuf Canbaz for more info
  commonStream: function (idList, lengthLimit) {
    var pageSize = 100000;
    var query = `CALL commonStream([${idList}], [], ${lengthLimit}, 1,
            ${pageSize}, 1, '', true, '', 0,{}, 0, 0, 0, 100000, [])`;
    return query;
  },
  upstream: function (idList, lengthLimit) {
    var pageSize = 100000;
    var query = `CALL commonStream([${idList}], [], ${lengthLimit}, 1,
            ${pageSize}, 1, '', true, '', 0,{}, 0, 0, 0, 100000, [])`;
    return query;
  },
  downstream: function (idList, lengthLimit) {
    var pageSize = 100000;
    var query = `CALL commonStream([${idList}], [], ${lengthLimit}, 0,
            ${pageSize}, 1, '', true, '', 0,{}, 0, 0, 0, 100000, [])`;
    return query;
  },
};
module.exports = graphAlgos;
