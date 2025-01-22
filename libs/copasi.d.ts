import type exp from "constants";

export interface SimResult {
    num_variables: number;
    recorded_steps: number;
    titles: string[];
    columns: string[];
}

export interface SpeciesInfo {
    compartment: string;
    concentration: number;
    id: string;
    name: string;
    initial_concentration: number;
    initial_particle_number: number;
    particle_number: number;
    type: string;
}

export interface CompartmentInfo {
    id: string;
    name: string;
    size: number;
    type: string;
}
export interface LocalParamterInfo {
    name: string;
    value: number;
}

export interface ReactionInfo {
    id: string;
    name: string;
    reversible: boolean;
    scheme: string;
    local_paramters: LocalParamterInfo[];
}

export interface ModelName
{
    name: string;
    notes: string;
}

export interface GlobalParamterInfo {   
    name: string;
    value: number;
    initial_value: number;
    id: string;
    type: string;
}

export interface ModelInfo {
    species: SpeciesInfo[];
    compartments: CompartmentInfo[];
    reactions: ReactionInfo[];
    global_parameters: GlobalParamterInfo[];
    model : ModelName;
    time: number;
    status: string;
    messages: string;
}

export default class COPASI {
    constructor(module: any);
    reset(): void;
    resetAll(): void;
    readonly version: string;
    _vectorToArray(v: any): any[];
    loadExample(path: string) : ModelInfo;
    loadModel(modelCode: string): ModelInfo;
    simulate() : object;
    simulate2D() : number[][];
    simulateEx(startTime : number, endTime : number, numPoints : number) : SimResult;
    simulateEx2D(startTime : number, endTime : number, numPoints : number) : number[][];
    simulateYaml(yamlProcessingOptions : string|object) : SimResult;
    simulateYaml2D(yamlProcessingOptions : string|object) : SimResult;
    getValue(nameOrId: string): number;
    setValue(nameOrId: string, value: number): void;
    readonly floatingSpeciesConcentrations : number[];
    readonly ratesOfChange : number[];
    readonly floatingSpeciesNames : string[];
    readonly floatingSpeciesIds : string[];
    readonly boundarySpeciesConcentrations : number[];
    readonly boundarySpeciesNames : string[];
    readonly boundarySpeciesIds : string[];
    readonly reactionNames : string[];
    readonly reactionIds : string[];
    readonly reactionRates : number[];
    readonly compartmentNames : string[];
    readonly compartmentIds : string[];
    readonly compartmentSizes : number[];
    readonly globalParameterNames : string[];
    readonly globalParameterIds : string[];
    readonly globalParameterValues : number[];
    readonly localParameterNames : string[];
    readonly localParameterValues : number[];
    readonly jacobian: object;
    readonly jacobian2D: number[][];
    readonly eigenValues2D: number[][];
    readonly reducedJacobian: object;
    readonly reducedJacobian2D: number[][];
    readonly eigenValuesReduced2D: number[][];
    
    getFluxControlCoefficients(scaled: boolean): object;
    getFluxControlCoefficients2D(scaled: boolean): number[][];
    getConcentrationControlCoefficients(scaled: boolean): object;
    getConcentrationControlCoefficients2D(scaled: boolean): number[][];
    getElasticities(scaled: boolean): object;
    getElasticities2D(scaled: boolean): number[][];

}

export {COPASI};
export default COPASI;