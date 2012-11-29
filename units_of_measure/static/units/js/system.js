/////////////////
// Unit System //
/////////////////

(function () {

    /**
     * This is a system of units like US, SI, EN, etc...
     *
     * @param systemData metadata and the dimensions that belong to this system of units,
     *  mapped by their code names
     * @constructor
     */
    var UnitSystem = function (systemData) {
        //noinspection JSUnresolvedVariable
        this.metadata = systemData.system;
        this.dimensions = systemData.dimensions;
    };

    /**
     * Get the code for this system
     *
     * @return {string} this system's code
     */
    UnitSystem.prototype.getCode = function () {
        return this.metadata.code;
    };
    /**
     * Get the dimensions in this unit system
     *
     * @return {Object}
     */
    UnitSystem.prototype.getDimensions = function () {
        var dimensions = {};
        for (var i in this.dimensions) if (this.dimensions.hasOwnProperty(i)) {
            dimensions[i] = org.units.converter.getDimension(i);
        }
        return dimensions;
    };

    /**
     * Get some select box options for the dimensions in this system
     */
    UnitSystem.prototype.getDimensionOpts = function () {
        return org.units._getOpts(this.getDimensions(), 'code', 'name');
    };

    /**
     * Check if this dimension exists in the unit system
     * @param dimension a dimension object or dimension code
     * @return {boolean} true if the dimension is in this unit system
     */
    UnitSystem.prototype.containsDimension = function (dimension) {
        if (typeof dimension === 'object') {
            dimension = dimension.getCode();
        }
        return this.getDimensions()[dimension] != null;
    };

    org.units.UnitSystem = UnitSystem;
})();