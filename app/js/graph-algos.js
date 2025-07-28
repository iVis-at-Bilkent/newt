var graphAlgos = {
  pathsFromTo: function (limit,simpleChemicalDegreeThreshold=1000000) {
    return `
    UNWIND $idList AS a
    UNWIND $idList AS b
    WITH a, b
    WHERE a <> b  // Ensure a and b are different
    MATCH p=(n)-[*]-(m)  // Match paths of any length
    WHERE id(n) = a AND id(m) = b 
      AND NONE(r IN relationships(p) WHERE type(r) IN ['belongs_to_compartment', 'belongs_to_submap', 'belongs_to_complex'])  // Exclude specific relationships
      AND ALL(x IN nodes(p) WHERE x.class <> 'simple_chemical' OR apoc.node.degree(x, null) < ${simpleChemicalDegreeThreshold})
    WITH p, 
        [x IN nodes(p) WHERE NOT x.category <> 'process' ] AS filteredNodes  // Filter out multiple node classes
    WHERE size(filteredNodes) - 1 <= ${limit}  // Ensure that the non-excluded nodes count is within the length limit
    unwind nodes(p) as node
      unwind relationships(p) as rel
      WITH collect(DISTINCT node) as nodes,
            collect(DISTINCT rel) as relationships,
            collect(DISTINCT node.language) as languages
      
      return nodes,
            relationships,
            CASE
              WHEN size(languages) > 1 THEN 'HybridAny'
              ELSE head(languages)
            END AS language
    `;
  },

  pathsBetween: function (lengthLimit,simpleChemicalDegreeThreshold=1000000) {
    var query = `
      UNWIND $idList as a 
      UNWIND $idList as b 
      WITH a, b 
      MATCH p=(n)-[rels*]-(m)
      WHERE id(n) = a 
        AND id(m) = b 
        AND a <> b 
        AND NONE(r IN rels WHERE type(r) IN [
            'belongs_to_compartment',
            'belongs_to_submap',
            'belongs_to_complex'
        ])
        AND ALL(x IN nodes(p) 
            WHERE x.class <> 'simple_chemical' 
            OR apoc.node.degree(x, null) <= ${simpleChemicalDegreeThreshold}
        )
      WITH p,
          [n in nodes(p) where n.category <> 'process'] AS realNodes
      WHERE size(realNodes) - 1 <= ${lengthLimit}

      UNWIND nodes(p) as node
      UNWIND relationships(p) as rel
      WITH collect(DISTINCT node) as nodes,
          collect(DISTINCT rel) as relationships,
          collect(DISTINCT node.language) as languages
      RETURN nodes,
            relationships,
            CASE
              WHEN size(languages) > 1 THEN 'HybridAny'
              ELSE head(languages)
            END AS language

    `;
    return query;
  },
  neighborhood: function ( lengthLimit,simpleChemicalDegreeThreshold=1000000) {
    // AND  ALL(n IN nodes(p)
    //         WHERE n.class <> 'simple_chemical'
    //               OR apoc.node.degree(n, null) < ${simpleChemicalDegreeThreshold})
    const query = `
    UNWIND $idList AS startId
    MATCH  p = (a)-[rels*]-(b)
    WHERE  id(a) = startId
      AND  NONE(r IN rels
                WHERE type(r) IN ['belongs_to_compartment',
                                  'belongs_to_submap',
                                  'belongs_to_complex'])
    WITH  p,
          [n IN nodes(p) WHERE n.category <> 'process'] AS realNodes
    WHERE size(realNodes) - 1 <= ${lengthLimit}

    /* ───────── aggregate everything into ONE record ───────── */
    UNWIND nodes(p)            AS n
    UNWIND relationships(p)    AS r
    WITH  collect(DISTINCT n)  AS nodes,
          collect(DISTINCT r)  AS edges,
          collect(DISTINCT n.language) AS languages

    RETURN nodes,
          edges,
          CASE
            WHEN size(languages) > 1 THEN 'HybridAny'
            ELSE head(languages)
          END AS language
    `;
    return query;
  },

  //Doesn't work for now
  //Uses user defined function written in : https://github.com/iVis-at-Bilkent/visuall-advanced-query/
  //Contact Yusuf Canbaz for more info
  commonStream: function (idList, lengthLimit) {
    idList = idList.map((id) => {
      return `${id}`;
    });
    console.log(idList);
    idList = idList.map(id => `'${id}'`).join(',');
    var pageSize = 100000;
    var query = `CALL commonStream([${idList}], [], ${lengthLimit}, -1,
            ${pageSize}, 1, '', true, '', 2,{}, 0, 0, 0, 100000, null)`;
    // var query = `CALL commonStream([${idList}], [], ${lengthLimit}, -1,
    //         ${pageSize}, 1, '', true, '', 0,{}, 0, 0, 0, 100000, [])`;
    return query;
  },
  upstream: function (idList, lengthLimit) {
    var pageSize = 100000;
    var query = `CALL commonStream([${idList}], [], ${lengthLimit}, 1,
            ${pageSize}, 1, '', true, '', 0,{}, 0, 0, 0, 100000, null)`;
    // var query = `CALL commonStream([${idList}], [], ${lengthLimit}, 1,
    //         ${pageSize}, 1, '', true, '', 0,{}, 0, 0, 0, 100000, [])`;
    return query;
  },
  downstream: function (idList, lengthLimit) {
    var pageSize = 100000;
    var query = `CALL commonStream([${idList}], [], ${lengthLimit}, 0,
            ${pageSize}, 1, '', true, '', 0,{}, 0, 0, 0, 100000, null)`;
    // var query = `CALL commonStream([${idList}], [], ${lengthLimit}, 0,
    //         ${pageSize}, 1, '', true, '', 0,{}, 0, 0, 0, 100000, [])`;
    return query;
  },
};
module.exports = graphAlgos;
