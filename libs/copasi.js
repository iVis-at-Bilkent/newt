/**
 * @class COPASI
 * 
 * This class wraps all the functions exported from
 * emscripten and provides a more convenient interface.
 */
class COPASI {
    /**
     * Constructs a new COPASI instance from the WASM module
     * @param Module the WASM module
     * 
    */
   constructor(Module) {
        /**
         * @enum {string} TC
         * 
         * enum for method names
         * 
         * @property {string} LSODA Deterministic (LSODA)
         * @property {string} RADAU5 Deterministic (RADAU5)
         * @property {string} DIRECT_METHOD Stochastic (Direct method)
         * @property {string} GIBSON_BRUCK Stochastic (Gibson + Bruck)
         * @property {string} TAULEAP Stochastic (τ-Leap)
         */
        this.TC = {
            LSODA: 'Deterministic (LSODA)',
            RADAU5: 'Deterministic (RADAU5)',
            DIRECT_METHOD: 'Stochastic (Direct method)',
            GIBSON_BRUCK: 'Stochastic (Gibson + Bruck)',
            TAULEAP: 'Stochastic (τ-Leap)',
        };
        this.Module = Module;

        // initialize wasm methods
        this.getVersion = Module.getVersion
        this.getMessages = Module.getMessages;
        this.steadyState = Module.steadyState;
        this.computeMca = Module.computeMca;
        this.oneStep = Module.oneStep;
        this.initCps = Module.initCps;
        this.destroy = Module.destroy;
        this.getValue = Module.getValue;
        this.setValue = Module.setValue;
        this.resetAll = Module.resetAll;

        // init runtime
        this.initCps();
    }

    /**
     * loads an example (if the WASM module was compiled with FS support)
     * 
     * @param {string} path 
     * @returns model information as an object
     */
    loadExample(path) 
    {
        return JSON.parse(this.Module.loadFromFile(path));
    }

    /**
     * Loads a model from a string containing the model in 
     * SBML or COPASI format. 
     * 
     * @param {string} modelCode in SBML or COPASI format
     * @returns model information as an object
     */
    loadModel(modelCode)
    {
        return JSON.parse(this.Module.loadModel(modelCode));
    }

    /**
     * simulates the currently loaded model with its current 
     * time course settings.
     * 
     * @returns {object} simulation results as object
     */
    simulate() {
        return JSON.parse(this.Module.simulate());
    }

    /**
     * simulates the currently loaded model with its current 
     * time course settings.
     * 
     * @returns {number[][]} simulation results as 2D array
     */
    simulate2D() {
        this.Module.simulate();
        return this._vector2dToArray(this.Module.getSimulationResults2D());
    }

    /**
     * simulates the currently loaded model from startTime to 
     * endTime with numPoints points.
     * 
     * @param {number} startTime
     * @param {number} endTime
     * @param {number} numPoints
     * 
     * @returns {object} simulation results as object
     */
    simulateEx(startTime, endTime, numPoints) {
        return JSON.parse(this.Module.simulateEx(startTime, endTime, numPoints));
    }

    /**
     * simulates the currently loaded model from startTime to 
     * endTime with numPoints points.
     * 
     * @param {number} startTime
     * @param {number} endTime
     * @param {number} numPoints
     * 
     * @returns {number[][]} simulation results as 2D array
     */
    simulateEx2D(startTime, endTime, numPoints) {
        this.Module.simulateEx(startTime, endTime, numPoints);
        return this._vector2dToArray(this.Module.getSimulationResults2D());
    }

    /**
     * simulates the currently loaded model after applying
     * the processing instructions: 
     * 
     * @param {object|string} yamlProcessingOptions
     * @returns {object} simulation results as object
     */
    simulateYaml(yamlProcessingOptions) {
        if (typeof yamlProcessingOptions !== 'string') {
            yamlProcessingOptions = JSON.stringify(yamlProcessingOptions);
        }
        return JSON.parse(this.Module.simulateYaml(yamlProcessingOptions));
    }

    /**
     * simulates the currently loaded model after applying
     * the processing instructions: 
     * 
     * @param {object|string} yamlProcessingOptions
     * @returns {number[][]} simulation results as 2D array
     */
    simulateYaml2D(yamlProcessingOptions) {
        if (typeof yamlProcessingOptions !== 'string') {
            yamlProcessingOptions = JSON.stringify(yamlProcessingOptions);
        }
        this.Module.simulateYaml(yamlProcessingOptions);
        return this._vector2dToArray(this.Module.getSimulationResults2D());
    }

    /**
     * resets the model
     * 
     * after loading the model, its state was saved as parameterset, 
     * calling reset will apply that parameter set.
     */
    reset() {
        // Add code here to reset the simulator
        this.Module.reset();
    }


    /**
     * @property {string} version returns the COPASI version
     * 
     * @example
     * var copasi = new COPASI(Module);
     * console.log(copasi.version);
     * // prints something like:
     * // 4.32.284
     */
    get version() {
        return this.Module.getVersion();
    }

    _vectorToArray(v) {
        var result = [];
        for (var i = 0; i < v.size(); i++) {
            result.push(v.get(i));
        }
        return result;
    }

    // convert 2d vector to Array
    _vector2dToArray(v) {
        var result = [];
        for (var i = 0; i < v.size(); i++) {
            result.push(this._vectorToArray(v.get(i)));
        }
        return result;
    }

    /**
     * @property {number[]} floatingSpeciesConcentrations returns floating species concentrations
     */
    get floatingSpeciesConcentrations() {
        return this._vectorToArray(this.Module.getFloatingSpeciesConcentrations());
    }

    /**
     * @property {number[]} ratesOfChange returns rates of change of floating species
     */
    get ratesOfChange() {
        return this._vectorToArray(this.Module.getRatesOfChange());
    }

    /**
     * @property {string[]} floatingSpeciesNames returns floating species names
     */
    get floatingSpeciesNames() {
        return this._vectorToArray(this.Module.getFloatingSpeciesNames());
    }

    /**
     * @property {string[]} floatingSpeciesIds returns floating species ids
     */
    get floatingSpeciesIds() {
        return this._vectorToArray(this.Module.getFloatingSpeciesIds());
    }

    /**
     * @property {number[]} boundarySpeciesConcentrations returns boundary species concentrations
     */
    get boundarySpeciesConcentrations() {
        return this._vectorToArray(this.Module.getBoundarySpeciesConcentrations());
    }

    /**
     * @property {string[]} boundarySpeciesNames returns boundary species names
     */
    get boundarySpeciesNames() {
        return this._vectorToArray(this.Module.getBoundarySpeciesNames());
    }

    /**
     * @property {string[]} boundarySpeciesIds returns boundary species ids
     */
    get boundarySpeciesIds() {
        return this._vectorToArray(this.Module.getBoundarySpeciesIds());
    }

    /**
     * @property {string[]} reactionNames returns reaction names
     */
    get reactionNames() {
        return this._vectorToArray(this.Module.getReactionNames());
    }
    
    /**
     * @property {string[]} reactionIds returns reaction ids
     */
    get reactionIds() {
        return this._vectorToArray(this.Module.getReactionIds());
    }
    /**
     * @property {number[]} reactionRates returns reaction rates
     */
    get reactionRates() {
        return this._vectorToArray(this.Module.getReactionRates());
    }

    /**
     * @property {string[]} compartmentNames returns compartment names
     */
    get compartmentNames() {
        return this._vectorToArray(this.Module.getCompartmentNames());
    }

    /**
     * @property {string[]} compartmentIds returns compartment ids
     */
    get compartmentIds() {
        return this._vectorToArray(this.Module.getCompartmentIds());
    }
    /**
     * @property {number[]} compartmentSizes returns compartment sizes
     */
    get compartmentSizes() {
        return this._vectorToArray(this.Module.getCompartmentSizes());
    }

    /**
     * @property {string[]} globalParameterNames returns global parameter names
     */
    get globalParameterNames() {
        return this._vectorToArray(this.Module.getGlobalParameterNames());
    }

    /**
     * @property {string[]} globalParameterIds returns global parameter ids
     */
    get globalParameterIds() {
        return this._vectorToArray(this.Module.getGlobalParameterIds());
    }
    /**
     * @property {number[]} globalParameterValues returns global parameter values
     */
    get globalParameterValues() {
        return this._vectorToArray(this.Module.getGlobalParameterValues());
    }

    /**
     * @property {string[]} localParameterNames returns local parameter names
     * 
     * Local parameter names, consist of the reaction name in brackets, followed by a dot 
     * and the parameter name. So for example: `(reaction1).k1` for the 
     * local parameter `k1` of the reaction `reaction1`.
     */
    get localParameterNames() {
        return this._vectorToArray(this.Module.getLocalParameterNames());
    }

    /**
     * @property {number[]} localParameterValues returns local parameter values
     */
    get localParameterValues() {
        return this._vectorToArray(this.Module.getLocalParameterValues());
    }

    /**
     * @property {object} timeCourseSettings returns the time course settings as json object
     * 
     * @param {object|string} arg the time course settings to set
     */
    get timeCourseSettings() {
        return JSON.parse(this.Module.getTimeCourseSettings());
    }

    set timeCourseSettings(arg) {
        // test wether arg is string, otherwise stringify
        if (typeof arg !== 'string') {
            arg = JSON.stringify(arg);
        }
        return this.Module.setTimeCourseSettings(arg);
    }

    /**
     * @property {object} modelInfo model information as object
     */
    get modelInfo() {
        return JSON.parse(this.Module.getModelInfo());
    }

    /**
     * @property {string[]} selectionList returns the selection list
     * 
     * The selection list controls what will be in the output of the 
     * simulation calls. 
     */
    get selectionList() {
        return this._vectorToArray(this.Module.getSelectionList());
    }

    set selectionList(arg) 
    {
        var vector = new this.Module.StringVector();
        arg.forEach((item) => vector.push_back(item));
        return this.Module.setSelectionList(vector);
    }

    /**
     * @property {number[]} selectedValues returns the selected values
     */
    get selectedValues() {
        return this._vectorToArray(this.Module.getSelectedValues());
    }

    /**
     * @property {object} jacobian the jacobian as object
     */
    get jacobian() {
        return JSON.parse(this.Module.getJacobian());
    }

    /**
     * @property {number[][]} jacobian2D returns the jacobian as 2D array
     */
    get jacobian2D() {
        return this._vector2dToArray(this.Module.getJacobian2D());
    }

    /**
     * @property { number[][]} eigenValues2D returns the eigenvalues as 2D array
     */
    get eigenValues2D() {
        return this._vector2dToArray(this.Module.getEigenValues2D());
    }

    /**
     * @property {object} reducedJacobian the reduced jacobian as object
     */
    get reducedJacobian() {
        return JSON.parse(this.Module.getJacobianReduced());
    }

    /**
     * @property {number[][]} reducedJacobian2D returns the reduced jacobian as 2D array
     */
    get reducedJacobian2D() {
        return this._vector2dToArray(this.Module.getJacobianReduced2D());
    }

    /**
     * @property { number[][]} eigenValuesReduced2D returns the eigenvalues of the reduced Jacobian as 2D array
     */
    get eigenValuesReduced2D() {
        return this._vector2dToArray(this.Module.getEigenValuesReduced2D());
    }

    /**
     * Retrieves the flux control coefficients for the model 
     * 
     * Note that computeMca must be called before this method
     * 
     * @param {bool} scaled indicating whether the scaled (true) or unscaled coefficients should be returned 
     * @returns {object} the flux control coefficients as object
     */
    getFluxControlCoefficients(scaled)
    {
        return JSON.parse(this.Module.getFluxControlCoefficients(scaled));
    }

    /**
     * Retrieves the flux control coefficients for the model as 2d array
     * @param {bool} scaled indicating whether the scaled (true) or unscaled coefficients should be returned 
     * @returns {number[][]} the flux control coefficients as 2D array
     */
    getFluxControlCoefficients2D(scaled)
    {
        return this._vector2dToArray(this.Module.getFluxControlCoefficients2D(scaled));
    }
    
    /**
     * Retrieves the concentration control coefficients for the model 
     * 
     * Note that computeMca must be called before this method
     * 
     * @param {bool} scaled indicating whether the scaled (true) or unscaled coefficients should be returned 
     * @returns {object} the concentration control coefficients as object
     */
    getConcentrationControlCoefficients(scaled)
    {
        return JSON.parse(this.Module.getConcentrationControlCoefficients(scaled));
    }

    /**
     * Retrieves the concentration control coefficients for the model as 2d array
     * @param {bool} scaled indicating whether the scaled (true) or unscaled coefficients should be returned 
     * @returns {number[][]} the concentration control coefficients as 2D array
     */
    getConcentrationControlCoefficients2D(scaled)
    {
        return this._vector2dToArray(this.Module.getConcentrationControlCoefficients2D(scaled));
    }

    /**
     * Retrieves the elasticities
     * 
     * @param {bool} scaled indicating whether the scaled (true) or unscaled coefficients should be returned 
     * @returns {object} the elasticites as object
     */
    getElasticities(scaled)
    {
        return JSON.parse(this.Module.getElasticities(scaled));
    }

    /**
     * Retrieves the elasticities
     * 
     * @param {bool} scaled indicating whether the scaled (true) or unscaled coefficients should be returned 
     * @returns {number[][]} the elasticities as 2D array
     */
    getElasticities2D(scaled)
    {
        return this._vector2dToArray(this.Module.getElasticities2D(scaled));
    }

}

// if module is defined, export the COPASI class
if (typeof module !== 'undefined') {
    module.exports = COPASI;
}

//export default COPASI;
//export {COPASI};
