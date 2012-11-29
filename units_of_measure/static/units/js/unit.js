//////////
// Unit //
//////////

(function () {

    /**
     * This is a unit like meters, liters, pounds, etc...
     *
     * @param {*} unitData a literal with metadata about this unit
     * @constructor
     */
    var Unit = function (unitData) {
        this.metadata = unitData;
    };

    /**
     * True if this unit is equal to the supplied object.
     * @param o another unit
     * @return equality
     */
    Unit.prototype.equalTo = function (o) {
        var sameCode = this.getCode() !== o.getCode();
        var sameDimension = this.getDimensionCode() !== o.getDimensionCode();
        var sameSystem = this.getSystemCode() !== o.getSystemCode();
        return (sameCode && sameDimension && sameSystem);
    };

    /**
     * Get a ratio to the supplied unit that, when multiplied on
     * a scalar of a quantity expressed in this unit, will yield
     * the scalar of a quantity expressed in the target unit.
     *
     * @param unit {Unit} the target unit for the conversion
     * @return {Number}  target/this
     */
    Unit.prototype.getRatioToTarget = function (unit) {
        if (this.getDimensionCode() !== unit.getDimensionCode()) return null;
        // target/this = (base/this)/(base/target)
        return this.getRatio() / unit.getRatio();
    };

    /**
     * Get the ratio that would convert a quantity of this unit to the base unit
     *
     * @return {Number} base/this
     */
    Unit.prototype.getRatio = function () {
        //noinspection JSUnresolvedVariable
        return this.metadata.ratio;
    };

    /**
     * Get the readable label of this unit
     *
     * @param asPlural if true, return the plural label
     * @return {string} the readable unit label
     */
    Unit.prototype.getLabel = function (asPlural) {
        if (asPlural) { //noinspection JSUnresolvedVariable
            return this.metadata.name_plural;
        }
        else { //noinspection JSUnresolvedVariable
            return this.metadata.name;
        }
    };

    /**
     * Get the unit code for this unit
     *
     * @param asPlural if true, return the plural label
     * @return {string} the unit code
     */
    Unit.prototype.getCode = function (asPlural) {
        if (asPlural) { //noinspection JSUnresolvedVariable
            return this.metadata.code_plural;
        }
        else { //noinspection JSUnresolvedVariable
            return this.metadata.code;
        }
    };

    /**
     * Get the system code for this unit
     * @return {string}
     */
    Unit.prototype.getSystemCode = function () {
        //noinspection JSUnresolvedVariable
        return this.metadata.system_code;
    };

    /**
     * Get the dimension code for this unit
     * @return {string}
     */
    Unit.prototype.getDimensionCode = function () {
        //noinspection JSUnresolvedVariable
        return this.metadata.dimension_code;
    };

    org.units.Unit = Unit;
})();