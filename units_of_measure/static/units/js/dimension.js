///////////////
// Dimension //
///////////////

(function () {
    /**
     * This is a dimension like Length, Volume, Mass, etc...
     *
     * @param dimensionData {*} metadata and the units that belong to this dimension,
     *  mapped by their code names.
     * @constructor
     */
    var Dimension = function (dimensionData) {
        //noinspection JSUnresolvedVariable
        this.metadata = dimensionData.dimension;
        this.units = dimensionData.units;
    };

    /**
     * Get the units in this dimension
     * @return {Object}
     */
    Dimension.prototype.getUnits = function (system) {
        var units = {};
        for (var i in this.units) if (this.units.hasOwnProperty(i)) {
            var unit = org.units.converter.getUnit(i);
            if (system && unit.getSystemCode() !== system.getCode()) continue;
            units[i] = unit;
        }
        return units;
    };

    /**
     * Get some select box options for the units in this dimension
     * @return {*} options to be used in a combo box template
     */
    Dimension.prototype.getUnitOpts = function (system) {
        return org.units._getOpts(this.getUnits(system), 'code', 'name');
    };

    /**
     * Get a select box option for this dimension
     * @return {*} an option to be used in a combo box template
     */
    Dimension.prototype.getOpt = function () {
        var code = this.getCode();
        var opts = {};
        opts[code] = this;
        return org.units._getOpts(opts, 'code', 'name');
    };

    /**
     * Return this unit's code
     *
     * @return {string}
     */
    Dimension.prototype.getCode = function () {
        return this.metadata.code;
    };


    /**
     * Return this unit's label
     *
     * @return {string}
     */
    Dimension.prototype.getLabel = function () {
        return this.metadata.name;
    };

//reference the dimension in the global scope
    org.units.Dimension = Dimension;
})();
