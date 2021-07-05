var ns = {};

ns.Language = Object.freeze({
	AF: "activity flow",
    ER: "entity relationship",
    PD: "process description"
});

ns.Orientation = Object.freeze({
	HORIZONTAL: "horizontal",
    VERTICAL: "vertical"
});

ns.GlyphClass = Object.freeze({
	/*
	    Enumeration with all possible values for the class attribute of Glyphs in SBGN-ML.
	    This includes both top-level glyphs and sub-glyphs.
    */
    UNSPECIFIED_ENTITY: "unspecified entity",
    SIMPLE_CHEMICAL: "simple chemical",
    MACROMOLECULE: "macromolecule",
    NUCLEIC_ACID_FEATURE: "nucleic acid feature",
    SIMPLE_CHEMICAL_MULTIMER: "simple chemical multimer",
    MACROMOLECULE_MULTIMER: "macromolecule multimer",
    NUCLEIC_ACID_FEATURE_MULTIMER: "nucleic acid feature multimer",
    COMPLEX: "complex",
    COMPLEX_MULTIMER: "complex multimer",
    SOURCE_AND_SINK: "source and sink",
    PERTURBATION: "perturbation",
    BIOLOGICAL_ACTIVITY: "biological activity",
    PERTURBING_AGENT: "perturbing agent",
    COMPARTMENT: "compartment",
    SUBMAP: "submap",
    TAG: "tag",
    TERMINAL: "terminal",
    PROCESS: "process",
    OMITTED_PROCESS: "omitted process",
    UNCERTAIN_PROCESS: "uncertain process",
    ASSOCIATION: "association",
    DISSOCIATION: "dissociation",
    PHENOTYPE: "phenotype",
    AND: "and",
    OR: "or",
    NOT: "not",
    STATE_VARIABLE: "state variable",
    UNIT_OF_INFORMATION: "unit of information",

    ENTITY: "entity",
    OUTCOME: "outcome",

    INTERACTION: "interaction",
    ANNOTATION: "annotation",
    VARIABLE_VALUE: "variable value",
    IMPLICIT_XOR: "implicit xor",
    DELAY: "delay",
    EXISTENCE: "existence",
    LOCATION: "location",
	CARDINALITY: "cardinality"
});

ns.ArcClass = Object.freeze({
	/*
    	Enumeration with all possible values for the class attribute of Arcs in SBGN-ML.
    */
    PRODUCTION: "production",
    CONSUMPTION: "consumption",
    CATALYSIS: "catalysis",
    MODULATION: "modulation",
    STIMULATION: "stimulation",
    INHIBITION: "inhibition",
    ASSIGNMENT: "assignment",
    INTERACTION: "interaction",
    ABSOLUTE_INHIBITION: "absolute inhibition",
    ABSOLUTE_STIMULATION: "absolute stimulation",
    POSITIVE_INFLUENCE: "positive influence",
    NEGATIVE_INFLUENCE: "negative influence",
    UNKNOWN_INFLUENCE: "unknown influence",
    EQUIVALENCE_ARC: "equivalence arc",
    NECESSARY_STIMULATION: "necessary stimulation",
	LOGIC_ARC: "logic arc"
});

module.exports = ns;
   
    

