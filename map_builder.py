import libsbgnpy.libsbgn as libsbgn
from libsbgnpy.libsbgnTypes import *
from libsbgnpy import utils 
import json
import collections
import sys
import re

from openai import OpenAI

PD_ONTOLOGY_STRINGS_INTO_TYPES = {
    "unspecified entity": GlyphClass.UNSPECIFIED_ENTITY,
    "simple chemical": GlyphClass.SIMPLE_CHEMICAL,
    "macromolecule": GlyphClass.MACROMOLECULE,
    "nucleic acid feature": GlyphClass.NUCLEIC_ACID_FEATURE,
    "perturbing agent": GlyphClass.PERTURBING_AGENT,
    "source and sink": GlyphClass.SOURCE_AND_SINK,
    "complex": GlyphClass.COMPLEX
}

PD_ENTITY_POOL_NODES = [
    GlyphClass.UNSPECIFIED_ENTITY,
    GlyphClass.SIMPLE_CHEMICAL,
    GlyphClass.MACROMOLECULE,
    GlyphClass.NUCLEIC_ACID_FEATURE,
    GlyphClass.PERTURBING_AGENT,
    GlyphClass.SOURCE_AND_SINK,
    GlyphClass.COMPLEX
]

PD_MAP_ARCS = [
    ArcClass.CONSUMPTION,
    ArcClass.PRODUCTION,
    ArcClass.MODULATION,
    ArcClass.STIMULATION,
    ArcClass.CATALYSIS,
    ArcClass.INHIBITION,
    ArcClass.NECESSARY_STIMULATION
]

PD_MODULATION_ARCS = [
    ArcClass.MODULATION,
    ArcClass.STIMULATION,
    ArcClass.CATALYSIS,
    ArcClass.INHIBITION,
    ArcClass.NECESSARY_STIMULATION
]

PD_MODULATION_STRING_INTO_TYPES = {
    "modulation": ArcClass.MODULATION,
    "stimulation": ArcClass.STIMULATION,
    "catalysis": ArcClass.CATALYSIS,
    "inhibition": ArcClass.INHIBITION,
    "necessary stimulation": ArcClass.NECESSARY_STIMULATION
}

PD_PROCESS_STRING_INTO_TYPES = {
    "process": GlyphClass.PROCESS,
    "omitted process": GlyphClass.OMITTED_PROCESS,
    "uncertain process": GlyphClass.UNCERTAIN_PROCESS,
    "association": GlyphClass.ASSOCIATION,
    "dissociation": GlyphClass.DISSOCIATION
}


def get_chatgpt_output(pathway_description: str) -> str:
    openai_key = ""
    with open("api_key.txt", "r") as file:
        openai_key = file.read().strip()

    client = OpenAI(
        api_key=openai_key
    )
    standard_prompt: str = """
You are a biological knowledge-to-graph converter specialized in the Process Description (PD) language of the Systems Biology Graphical Notation (SBGN).

Your task is to translate biological pathway descriptions into structured JSON objects, where each object represents a single biochemical process, in accordance with SBGN-PD semantics.

You MUST follow the constraints and semantics defined below.

JSON Format:

{
    map: [
        {
            "note": "Human-readable explanation (optional)",
            "reaction_type": "process", // One of: "process", "association", "dissociation", "omitted process", "uncertain process".
            "substances": ["A", "B"], // Entities consumed in the reaction
            "products": ["C", "D"], // Entities produced by the reaction
            "modulation": [ // Optional array of regulation arcs
                {
                    "type": "stimulation", // One of: "modulation", "stimulation", "catalysis", "inhibition"
                    "source": "X" // Entity that performs the regulation
                }
            ],
            "location": "cytoplasm" // Optional compartment
        }
    ],
    ontology: [
        {
            "entity_name": "A", // For every entity used above, there must be exactly one entry in this list
            "ontology": "macromolecule", // One of: "unspecified entity", "simple chemical", "macromolecule", "nucleic acid feature", "perturbing agent", "source and sink", "phenotype", "complex"
            "constituent": [ // Only fill this array if ontology is complex
                {
                    "name": "sub-entity 1",
                    "ontology": "macromolecule" // Options are same as the above ontology field
                }
            ]
        }
    ]
}

Each JSON object corresponds to a process node in SBGN-PD. These nodes represent the central event (reaction or interaction) and are classified by reaction_type:

Explanation of SBGN reaction types:

"process"
A typical biochemical transformation (e.g., enzymatic reaction, phosphorylation, transport).
Requires at least one substance and one product.

"association"
Binding of two or more entities into a complex.
Substances are the individual components; product is the complex.

"dissociation"
Disassembly of a complex into its parts.
Substance is the complex; products are the individual components.

"omitted process"
A process exists but is not specified or detailed (used when skipped for simplicity).

"uncertain process"
A process that might happen, but its existence or nature is unclear or hypothetical.

Explanation of Modulation Types (SBGN-PD):

"modulation": Generic regulatory influence, nature unknown or ambiguous.
"stimulation": Promotes or activates the process (e.g., signaling, allosteric effect).
"catalysis": Enzyme-catalyzed acceleration of a chemical reaction.
"inhibition": Repression or negative regulation of the process.

SBGN Ontology Information:

Macromolecule: Represents large biomolecules such as proteins or polysaccharides. These entities may include state variables to indicate modifications (like phosphorylation) and can have clone markers if needed.
Simple Chemical: Represents small molecules, such as ions or metabolites. These are often substrates or products in biochemical reactions.
Unspecified Entity: Used when the specific nature of the entity is unknown or not detailed. It allows inclusion of undefined elements in the network.
Nucleic Acid Feature: Represents specific regions or features of nucleic acids, like promoters or binding sites on DNA or RNA.
Complex: Represents a stable association of multiple entities, such as protein complexes. The components of the complex may be detailed internally.
Source and Sink: 'Source' represents the origin of entities entering the system; 'Sink' represents the removal or degradation of entities leaving the system.

Important Rules:

Every reaction MUST have at least one substance and one product.
Do NOT generate very high-level maps unless explicitly requested. Try to include more detailed steps.
Do NOT list modifiers outside of the modulation block.
Do NOT describe high-level steps — only break them down into elementary reactions.
Entities MUST be clearly defined objects, and generally NOT described by adjectives.
As much as possible, the generated map MUST be connected. Try using products from the previous reaction in the substances of the next reaction.
Reaction substances should NOT be included in the modulation section, except for very rare cases where this is what actually happens.
Locations go in the "location" field, not the entity name.

State Variables vs. Units of Information:

Use square brackets [ ] to denote state variables, which describe concrete, modifiable properties of an entity (e.g., phosphorylation sites, conformational changes).
Examples: "MEK [P]", "STAT [active]", "Receptor [open]"
These correspond to SBGN state variable glyphs.

Use curly braces { } to denote units of information, which describe abstract, structural, or contextual features of the entity (e.g., domains, roles, annotations).
Examples: "NFkB {DNA-binding domain}", "GeneA {promoter}", "ProteinX {kinase}"
These correspond to SBGN unit of information glyphs.

Use state variables and units of information sparingly — only when biologically meaningful and necessary for understanding the mechanism. Avoid cluttering entity names with excessive or vague labels.

Your output should have NOTHING but the pure json. NOT EVEN "```json" and "```".
Now convert the following pathway to structured JSON:
"""
    # with open("./prompts/json_prompt.txt") as file:
    #     standard_prompt = file.read()


    completion = client.chat.completions.create(
        model="gpt-4o-mini",  
        store=False,
        messages=[
            {
                "role": "developer",
                "content": standard_prompt
            },
            {
                "role": "user", 
                "content": "Give me a map based on the following description: " + pathway_description
            }
        ]
    )

    return completion.choices[0].message.content

def convert_to_sbgn(pathway_json: str):
    map = libsbgn.map(language=Language.PD)
    sbgn = libsbgn.sbgn(map=map)

    obj = json.loads(pathway_json)
    map_obj = obj["map"]
    ontology_obj = obj["ontology"]
    ontology_lookup = {entry["entity_name"]: entry for entry in ontology_obj}

    glyphs: list[str] = []
    for reaction in map_obj:
        glyphs += reaction["substances"]
        glyphs += reaction["products"]
        if "modulation" in reaction:
            for modulator in reaction["modulation"]:
                glyphs.append(modulator["source"])
    glyph_counts = collections.Counter(glyphs)

    compartments = {reaction["location"] for reaction in map_obj}
    for comp in compartments:
        g1 = libsbgn.glyph(
            class_=GlyphClass.COMPARTMENT, 
            id="comp_"+comp,
            label=libsbgn.label(text=comp),
            bbox=libsbgn.bbox(x=0, y=0, w=60, h=30)
        )
        map.add_glyph(g1)

    count = 0
    for reaction in map_obj:
        uniq_id = 'process' + str(count)
        g = libsbgn.glyph(
            class_=PD_PROCESS_STRING_INTO_TYPES[reaction["reaction_type"]], 
            id=uniq_id,
            bbox=libsbgn.bbox(x=0, y=0, w=20, h=20),
            port=[
                libsbgn.port(x=25,y=10,id=uniq_id + ".1"),
                libsbgn.port(x=-5,y=10,id=uniq_id + ".2")
            ],
            compartmentRef="comp_"+reaction["location"]
        )
        map.add_glyph(g)
        count += 1

        for substance in reaction["substances"]:
            if glyph_counts[substance] < 4:
                uniq_id1 = 'common' + substance
            else:
                uniq_id1 = 'glyph' + str(count)

            state_match = re.search(r'\[(.*?)\]', substance)
            unit_match = re.search(r'\{(.*?)\}', substance)
            clean_name = re.sub(r'[\[\{].*?[\]\}]', '', substance).strip()

            result = ontology_lookup.get(clean_name)
            substrate_class = GlyphClass.SIMPLE_CHEMICAL
            if result:
                substrate_class = PD_ONTOLOGY_STRINGS_INTO_TYPES[result["ontology"]]

            g1 = libsbgn.glyph(
                class_=substrate_class,
                id=uniq_id1,
                label=libsbgn.label(text=clean_name),
                bbox=libsbgn.bbox(x=0, y=0, w=60, h=30),
                compartmentRef="comp_" + reaction["location"]
            )

            if state_match:
                state_value = state_match.group(1)
                state_glyph = libsbgn.glyph(
                    class_=GlyphClass.STATE_VARIABLE,
                    id=uniq_id1 + "_state",
                    state=libsbgn.stateType(value=state_value),
                    bbox=libsbgn.bbox(x=0, y=0, w=20, h=20)
                )
                g1.add_glyph(state_glyph)

            if unit_match:
                unit_value = unit_match.group(1)
                unit_glyph = libsbgn.glyph(
                    class_=GlyphClass.UNIT_OF_INFORMATION,
                    id=uniq_id1 + "_unit",
                    label=libsbgn.label(text=unit_value),
                    bbox=libsbgn.bbox(x=0, y=0, w=20, h=20)
                )
                g1.add_glyph(unit_glyph)

            if result and result["ontology"] == "complex" and result.get("constituent"):
                for ii, element in enumerate(result["constituent"]):
                    complex_inner_class = GlyphClass.SIMPLE_CHEMICAL
                    if element.get("ontology"):
                        complex_inner_class = PD_ONTOLOGY_STRINGS_INTO_TYPES[element["ontology"]]
                    g2 = libsbgn.glyph(
                        class_=complex_inner_class,
                        id=uniq_id1 + "_complex_" + str(ii),
                        label=libsbgn.label(text=element["name"]),
                        bbox=libsbgn.bbox(x=0, y=0, w=60, h=30),
                        compartmentRef="comp_" + reaction["location"]
                    )
                    g1.add_glyph(g2)

            map.add_glyph(g1)

            arc1 = libsbgn.arc(
                class_=ArcClass.CONSUMPTION, 
                source=uniq_id1, 
                target=uniq_id + ".1", 
                id="arc"+str(count),
            )   
            map.add_arc(arc1)
            count += 1

        for product in reaction["products"]:
            if glyph_counts[product] < 4:
                uniq_id1 = 'common' + product
            else:
                uniq_id1 = 'glyph' + str(count)

            state_match = re.search(r'\[(.*?)\]', product)
            unit_match = re.search(r'\{(.*?)\}', product)
            clean_name = re.sub(r'[\[\{].*?[\]\}]', '', product).strip()

            result = ontology_lookup.get(clean_name)
            product_class = GlyphClass.SIMPLE_CHEMICAL
            if result:
                product_class = PD_ONTOLOGY_STRINGS_INTO_TYPES[result["ontology"]]

            g1 = libsbgn.glyph(
                class_=product_class,
                id=uniq_id1,
                label=libsbgn.label(text=clean_name),
                bbox=libsbgn.bbox(x=0, y=0, w=60, h=30),
                compartmentRef="comp_" + reaction["location"]
            )

            if state_match:
                state_value = state_match.group(1)
                state_glyph = libsbgn.glyph(
                    class_=GlyphClass.STATE_VARIABLE,
                    id=uniq_id1 + "_state",
                    state=libsbgn.stateType(value=state_value),
                    bbox=libsbgn.bbox(x=0, y=0, w=20, h=20)
                )
                g1.add_glyph(state_glyph)

            if unit_match:
                unit_value = unit_match.group(1)
                unit_glyph = libsbgn.glyph(
                    class_=GlyphClass.UNIT_OF_INFORMATION,
                    id=uniq_id1 + "_unit",
                    label=libsbgn.label(text=unit_value),
                    bbox=libsbgn.bbox(x=0, y=0, w=20, h=20)
                )
                g1.add_glyph(unit_glyph)

            if result and result["ontology"] == "complex" and result.get("constituent"):
                for ii, element in enumerate(result["constituent"]):
                    complex_inner_class = GlyphClass.SIMPLE_CHEMICAL
                    if element.get("ontology"):
                        complex_inner_class = PD_ONTOLOGY_STRINGS_INTO_TYPES[element["ontology"]]
                    g2 = libsbgn.glyph(
                        class_=complex_inner_class,
                        id=uniq_id1 + "_complex_" + str(ii),
                        label=libsbgn.label(text=element["name"]),
                        bbox=libsbgn.bbox(x=0, y=0, w=60, h=30),
                        compartmentRef="comp_" + reaction["location"]
                    )
                    g1.add_glyph(g2)

            map.add_glyph(g1)

            arc1 = libsbgn.arc(
                class_=ArcClass.PRODUCTION, 
                source=uniq_id + ".2", 
                target=uniq_id1, 
                id="arc"+str(count),
            )
            map.add_arc(arc1)
            count += 1

        if "modulation" in reaction:
            for modulator in reaction["modulation"]:
                modulator_name = modulator["source"]
                if glyph_counts[modulator_name] < 4:
                    uniq_id1 = 'common' + modulator_name
                else:
                    uniq_id1 = 'glyph' + str(count)

                state_match = re.search(r'\[(.*?)\]', modulator_name)
                unit_match = re.search(r'\{(.*?)\}', modulator_name)
                clean_name = re.sub(r'[\[\{].*?[\]\}]', '', modulator_name).strip()

                modulator_class = GlyphClass.SIMPLE_CHEMICAL
                result = ontology_lookup.get(clean_name)
                if result:
                    modulator_class = PD_ONTOLOGY_STRINGS_INTO_TYPES[result["ontology"]]

                g1 = libsbgn.glyph(
                    class_=modulator_class, 
                    id=uniq_id1,
                    label=libsbgn.label(text=clean_name),
                    bbox=libsbgn.bbox(x=0, y=0, w=60, h=30),
                    compartmentRef="comp_"+reaction["location"]
                )

                if state_match:
                    state_value = state_match.group(1)
                    state_glyph = libsbgn.glyph(
                        class_=GlyphClass.STATE_VARIABLE,
                        id=uniq_id1 + "_state",
                        state=libsbgn.stateType(value=state_value),
                        bbox=libsbgn.bbox(x=0, y=0, w=20, h=20)
                    )
                    g1.add_glyph(state_glyph)

                if unit_match:
                    unit_value = unit_match.group(1)
                    unit_glyph = libsbgn.glyph(
                        class_=GlyphClass.UNIT_OF_INFORMATION,
                        id=uniq_id1 + "_unit",
                        label=libsbgn.label(text=unit_value),
                        bbox=libsbgn.bbox(x=0, y=0, w=20, h=20)
                    )
                    g1.add_glyph(unit_glyph)

                if result and result["ontology"] == "complex" and result.get("constituent"):
                    for ii, element in enumerate(result["constituent"]):
                        complex_inner_class = GlyphClass.SIMPLE_CHEMICAL
                        if element.get("ontology"):
                            complex_inner_class = PD_ONTOLOGY_STRINGS_INTO_TYPES[element["ontology"]]
                        g2 = libsbgn.glyph(
                            class_=complex_inner_class,
                            id=uniq_id1+"_complex_"+str(ii),
                            label=libsbgn.label(text=element["name"]),
                            bbox=libsbgn.bbox(x=0, y=0, w=60, h=30),
                            compartmentRef="comp_"+reaction["location"]
                        )
                        g1.add_glyph(g2)

                map.add_glyph(g1)

                arc1 = libsbgn.arc(
                    class_=PD_MODULATION_STRING_INTO_TYPES[modulator["type"]], 
                    source=uniq_id1, 
                    target=uniq_id, 
                    id="arc"+str(count),
                )
                map.add_arc(arc1)
                count += 1

    return utils.write_to_string(sbgn)


if __name__ == "__main__":
    pathway_description: str = sys.argv[1]
    output = get_chatgpt_output(pathway_description)
    sbgn_map = convert_to_sbgn(output)
    print(sbgn_map)
