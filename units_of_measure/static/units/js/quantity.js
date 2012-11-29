//////////////
// Quantity //
//////////////

(function () {
    /**
     * This is a quantity like 1 m, 32.1 L, 1.23 lb etc...
     *
     * @param {Number} scalar a scalar representation of this quantity
     * @param {org.units.Unit} unit a unit representation of this quantity
     * @constructor
     */
    var Quantity = function (scalar, unit) {
        var badScalarError = new Error("A bad scalar was used to define a Quantity.");
        var badUnitError = new Error("A bad unit was used to define a Quantity.");

        if (typeof scalar === 'string') {
            if (!org.units.isDecimal(scalar)) throw badScalarError;
            scalar = parseFloat(scalar);
        }
        //it's ok to have a null scalar
        if (scalar && typeof scalar !== 'number') throw badScalarError;
        if (scalar === NaN) throw badScalarError;
        this.scalar = scalar;

        //it's ok to have a null unit
        if (unit && typeof unit !== 'object') throw badUnitError;
        this.scalar = scalar;
        this.unit = unit;
    };


    /**
     * Get an equivalent quantity expressed in the supplied unit.
     *
     * @param {org.units.Unit} unit the unit of the target quantity
     * @return {org.units.Quantity}
     */
    Quantity.prototype.convertTo = function (unit) {
        var ratio = this.unit.getRatioToTarget(unit);
        if (ratio == null) return null;
        var newScalar = this.scalar * ratio;
        newScalar = parseFloat(newScalar.toFixed(12).toString());
        return new Quantity(newScalar, unit);
    };

    /**
     * True if this quantity is equal to the supplied object
     * @param o another quantity
     * @return equality
     */
    Quantity.prototype.equalTo = function (o) {
        if (this.scalar != o.scalar) return false;
        return this.unit.equalTo(o.unit);

    };

//reference the object in the global scope
    org.units.Quantity = Quantity;

})();