///////////////
// Converter //
///////////////

(function () {
    /**
     * This is a conversion utility that is initialized with the description of
     * a set of org.units and their relationships to each other.
     *
     * @param {*} converterData a json literal of metadata and unit systems,
     *  which contain dimensions, which contain units.
     * @constructor
     */
    var Converter = function (converterData) {
        this.converterData = converterData;

        /** Keep track of a number to use when making unique ids */
        this.nextId = 0;
        this.systems = this._buildItems(this.converterData.systems, org.units.UnitSystem);
        this.dimensions = this._buildItems(this.converterData.dimensions, org.units.Dimension);
        this.units = this._buildItems(this.converterData.units, org.units.Unit);
    };

    /**
     * Build a set of units, dimensions, or systems
     *
     * @param rawData the raw data to work with
     * @param constructor the constructor to operate on the raw data
     * @return {Object}
     * @private
     */
    Converter.prototype._buildItems = function (rawData, constructor) {
        var result = {};
        for (var i in rawData) if (rawData.hasOwnProperty(i)) {
            result[i] = new constructor(rawData[i]);
        }
        return result;
    };

    /**
     * Get a system of units that is represented by the given code
     * @param code
     * @return {*}
     */
    Converter.prototype.getSystem = function (code) {
        return this.systems[code];
    };

    /**
     * Get a dimension that is represented by the given code
     * @param code
     * @return {*}
     */
    Converter.prototype.getDimension = function (code) {
        return this.dimensions[code];
    };

    /**
     * Get a unit that is represented by the given code
     * @param code
     * @return {*}
     */
    Converter.prototype.getUnit = function (code) {
        return this.units[code];
    };

    /**
     * Get the next number to be used in an id set
     * @return {Number} the number to be used
     */
    Converter.prototype.getNextId = function () {
        var id = this.nextId;
        this.nextId++;
        return id;
    };

    /**
     * Get an unit input set
     * @param appendTo (optional) a jquery selector for the element to which this input will be appended.
     * @param quantity (optional) initialize this set to use this quantity
     * @return {*} the options generated for this input
     */
    Converter.prototype.createInputSet = function (appendTo, quantity) {
        //if a quantity is provided, remember it as the default
        var thisId = this.getNextId();
        var quantityId = 'quantity' + thisId;
        if (quantity == null) quantity = new org.units.Quantity();

        //build input options for the template and fieldset object
        var systemOpts = this.getSystemOpts();
        var selectedSystemCode = quantity.unit ? quantity.unit.getSystemCode() : systemOpts[0].value;
        var selectedSystem = this.getSystem(selectedSystemCode);
        var dimensionOpts = selectedSystem.getDimensionOpts();
        var selectedDimensionCode = quantity.unit ? quantity.unit.getDimensionCode() : dimensionOpts[0].value;
        var selectedDimension = this.getDimension(selectedDimensionCode);
        var unitOpts = selectedDimension.getUnitOpts(selectedSystem);
        var selectedUnitCode = quantity.unit ? quantity.unit.getCode() : unitOpts[0].value;
        var selectedUnit = this.getUnit(selectedUnitCode);

        var opts = {
            "thisId":thisId,
            "quantityId":quantityId,
            "quantity":quantity,
            "systemOpts":systemOpts,
            "dimensionOpts":dimensionOpts,
            "unitOpts":unitOpts,
            "selectedSystem":selectedSystem,
            "selectedDimension":selectedDimension,
            "selectedUnit":selectedUnit
        };

        //It's ok if appendTo is undefined, that just means FieldSet.appendTo will need to be called later
        return new org.units.FieldSet(this, opts, appendTo);
    };

    /**
     * Get some select box options for the known unit systems
     */
    Converter.prototype.getSystemOpts = function () {
        return org.units._getOpts(this.systems, 'code', 'code');
    };

//Reference the object in the global scope
    org.units.Converter = Converter;
})();
