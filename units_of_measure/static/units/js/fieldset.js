(function () {

    /**
     * Create a field set with the given shared id
     *
     * @param converter a reference to the converter object in use
     * @param opts the options supplied to the template that generates unit fieldsets
     * @param appendTo (optional) append this fieldset to the given id
     * @constructor
     */
    var FieldSet = function (converter, opts, appendTo) {
        this.converter = converter;
        this.opts = opts;
        this.appended = false;
        this.sharedId = opts.quantityId;

        this.storeLimit = 3;
        this.prevQuantities = [];
        this.nextQuantities = [];
        this.currentQuantity = null;
        this.defaultQuantity = null;

        if (appendTo != null) this.appendTo(appendTo);
        if (opts.quantity != null && opts.quantity.unit != null) {
            this.defaultQuantity = opts.quantity;
            this.setFields(this.defaultQuantity);
            this._storeQuantity();
        }
        else {
            this.resetButton.hide();
        }

    };

    /**
     * Append this fieldset to the element with the given selector
     * @param appendTo a selector that specifies
     */
    FieldSet.prototype.appendTo = function (appendTo) {
        if (this.appended) throw new Error("This FieldSet has already been added to the ui.");
        if (!appendTo) throw new Error("Missing value for FieldSet.appendTo.");

        //TODO cache the template
        $('#unitInputTemplate').tmpl(this.opts).appendTo(appendTo);
        this.appended = true;

        //Find the components and store them for later access by this object
        this._findComponents();
        this._assignListeners();
    };

    /**
     * Read the scalar and return a Float or null if that can't be done.
     * @return {number}
     */
    FieldSet.prototype._readScalar = function () {
        var scalar = this.scalarField.val();
        if (!org.units.isDecimal(scalar)) return null;
        scalar = $.trim(scalar);
        scalar = parseFloat(scalar);
        return scalar;
    };

    /**
     * Read the current quantity from this fieldset and return it.
     * Return null if the scalar or unit are not readable.
     * @return {org.units.Quantity}
     */
    FieldSet.prototype.readQuantity = function () {
        var scalar = this._readScalar();
        if (scalar == null) return null;
        var unit = this.getSelectedUnit();
        if (unit == null) return null;
        return new org.units.Quantity(scalar, unit);
    };

    /**
     * Get the currently selected system in this fieldset.
     * @return {org.units.UnitSystem}
     */
    FieldSet.prototype.getSelectedSystem = function () {
        if (!this.appended) this._throwError('notAppended', 'FieldSet.getSelectedSystem');
        var systemCode = this.systemField.val();
        return this.converter.getSystem(systemCode);
    };

    /**
     * Get the currently selected dimension in this fieldset.
     * @return {org.units.Dimension}
     */
    FieldSet.prototype.getSelectedDimension = function () {
        if (!this.appended) this._throwError('notAppended', 'FieldSet.getSelectedDimension');
        var dimensionCode = this.dimensionField.val();
        return this.converter.getDimension(dimensionCode);
    };

    /**
     * Get the currently selected unit in this fieldset.
     * @return {org.units.Unit}
     */
    FieldSet.prototype.getSelectedUnit = function () {
        if (!this.appended) this._throwError('notAppended', 'FieldSet.getSelectedUnit');
        var unitCode = this.unitField.val();
        return this.converter.getUnit(unitCode);
    };

    /**
     * Reset this field to the value initially provided to it
     * @private
     */
    FieldSet.prototype._reset = function () {
        this.setFields(this.defaultQuantity);
        this._storeQuantity();
        this._updateScalarActivity();
    };

    /**
     * Undo the latest change to the field set
     * @private
     */
    FieldSet.prototype._undo = function () {
        //push the current state to the future
        if (this.currentQuantity != null) {
            this.nextQuantities.unshift(this.currentQuantity);
        }
        //set the most recent state to the current state
        this.currentQuantity = this.prevQuantities.pop();
        this.setFields(this.currentQuantity);
        this._syncButtons();
    };

    /**
     * Redo the latest undo operation on the field set
     * @private
     */
    FieldSet.prototype._redo = function () {
        //push the current state back to the history
        this.prevQuantities.push(this.currentQuantity);
        //grab the next state and set it to the current one
        this.currentQuantity = this.nextQuantities.shift();
        this.setFields(this.currentQuantity);
        this._syncButtons();
    };

    /**
     * Assign listeners to components in the fieldset
     * @private
     */
    FieldSet.prototype._assignListeners = function () {
        var fieldset = this;
        //noinspection JSUnusedLocalSymbols
        this.systemField.change(function (e) {
            fieldset.nextQuantities = [];
            fieldset._updateDimensions();
            fieldset._updateUnits();
            var converted = fieldset._convertQuantity();
            if (!converted) fieldset._pushCurrentQuantityToHistory();
            fieldset._syncButtons();
        });
        //noinspection JSUnusedLocalSymbols
        this.dimensionField.change(function (e) {
            fieldset._updateUnits();
            fieldset._clearQuantity();
            fieldset._syncButtons();
        });
        //noinspection JSUnusedLocalSymbols
        this.unitField.change(function (e) {
            var converted = fieldset._convertQuantity();
            if (!converted) fieldset._pushCurrentQuantityToHistory();
            fieldset._syncButtons();
        });
        //noinspection JSUnusedLocalSymbols
        this.scalarField.blur(function (e) {
            fieldset._storeQuantity();
        });
        //noinspection JSUnusedLocalSymbols
        this.resetButton.click(function (e) {
            fieldset._reset();
        });
        //noinspection JSUnusedLocalSymbols
        this.undoButton.click(function (e) {
            fieldset._undo();
        });
        //noinspection JSUnusedLocalSymbols
        this.redoButton.click(function (e) {
            fieldset._redo();
        });
    };

    /**
     * Update the dimensions combobox based on the the currently selected system
     * @private
     */
    FieldSet.prototype._updateDimensions = function () {
        if (!this.appended) this._throwError('notAppended', 'FieldSet._updateDimensions');

        //prepare the options
        var system = this.getSelectedSystem();
        var dimension = this.getSelectedDimension();
        var dimensionOpts = system.getDimensionOpts();
        var hasDimension = system.containsDimension(dimension);
        if (!hasDimension) {
            var opt = dimension.getOpt();
            dimensionOpts = dimensionOpts.concat(opt);
        }

        $('option', this.dimensionField).remove();
        //TODO cache the template
        this.sortOptions($('#optionTemplate').tmpl(dimensionOpts)).appendTo(this.dimensionField);
        $('option[value="' + dimension.getCode() + '"]', this.dimensionField).attr('selected', 'selected');
    };

    /**
     * Update the units combobox based on the currently selected dimension
     * @private
     */
    FieldSet.prototype._updateUnits = function () {
        if (!this.appended) this._throwError('notAppended', 'FieldSet._updateUnits');
        var system = this.getSelectedSystem();
        var dimension = this.getSelectedDimension();
        var unitOpts = dimension.getUnitOpts(system);
        $('option', this.unitField).remove();
        //TODO cache the template
        this.sortOptions($('#optionTemplate').tmpl(unitOpts)).appendTo(this.unitField);
        this._updateScalarActivity();
    };

    FieldSet.prototype.sortOptions = function (opts) {
        return opts.sort(function (a, b) {
            return a.text == b.text ? 0 : a.text < b.text ? -1 : 1
        });
    };

    /**
     * Convert the current scalar from its original unit to the selected on
     * @private
     * @return {boolean} whether the conversion was a success
     */
    FieldSet.prototype._convertQuantity = function () {
        if (!this.appended) this._throwError('notAppended', 'FieldSet._updateQuantity');
        if (this.unitField.val() == null) return false;
        var targetUnit = this.getSelectedUnit();
        //get the last quantity
        //convert it
        if (this.currentQuantity == null) return false; //abort if the current state is malformed
        var newQuantity = this.currentQuantity.convertTo(targetUnit);
        if (newQuantity == null) return false; //abort if conversion fails
        //update the scalar
        this.scalarField.val(newQuantity.scalar);
        //store it
        this._storeQuantity();
        this._syncButtons();
        return true;
    };

    /**
     * If there is a null value in the unit combobox, disable the scalar field.
     * Otherwise, enable it.
     * @private
     */
    FieldSet.prototype._updateScalarActivity = function () {
        if (this.unitField.val() == null) {
            this.scalarField.attr('disabled', 'disabled');
        }
        else {
            this.scalarField.removeAttr('disabled');
        }
    };

    /**
     * Clear the current scalar
     * @private
     */
    FieldSet.prototype._clearQuantity = function () {
        if (!this.appended) this._throwError('notAppended', 'FieldSet._clearQuantity');
        //push the current state back to the history
        this.nextQuantities = [];
        this._pushCurrentQuantityToHistory();
        this.scalarField.val('');
        this._syncButtons();
    };

    /**
     * Store the quantity defined by the current state of the fieldset in memory.
     */
    FieldSet.prototype._storeQuantity = function () {
        var readQuantity = this.readQuantity();
        if (readQuantity == null) return; //abort if the quantity is unreadable

        //manage this object's undo/redo state

        //update the history
        if (this.currentQuantity != null) {
            var noChange = this.currentQuantity.equalTo(readQuantity);
            if (noChange) return; //if there hasn't been any change, abort
            this._pushCurrentQuantityToHistory();
        }

        //The new quantity is ready to be updated

        //update the current state
        this.currentQuantity = readQuantity;
        //abandon the next quantities
        this.nextQuantities = [];

        //synchronize the undo/redo buttons
        this._syncButtons();
    };

    /**
     * Read the state of this fieldset and enable/disable buttons as needed
     * @private
     */
    FieldSet.prototype._syncButtons = function () {
        var enableUndo = this.prevQuantities.length > 0;
        org.units.buttonActive(this.undoButton, enableUndo);

        var enableRedo = this.nextQuantities.length > 0;
        org.units.buttonActive(this.redoButton, enableRedo);
    };

    /**
     * Update this fieldset to display the provided quantity
     * @param quantity
     */
    FieldSet.prototype.setFields = function (quantity) {
        this.scalarField.val(quantity.scalar);
        var unit = quantity.unit;
        this.systemField.val(unit.getSystemCode());
        this.dimensionField.val(unit.getDimensionCode());
        this._updateUnits();
        this.unitField.val(unit.getCode());
    };

    /**
     * Push the currently stored quantity to the most recent history slot
     * @private
     */
    FieldSet.prototype._pushCurrentQuantityToHistory = function () {
        if (this.currentQuantity == null) return; //abort if their is no state to commit
        this.prevQuantities.push(this.currentQuantity);
        if (this.prevQuantities.length > this.storeLimit) {
            this.prevQuantities.shift();
        }
        this.currentQuantity = null;
    };

    /**
     * Find all of the components that belong to this fieldset.
     * This should only be called after the fieldset has been added to something.
     * @private
     */
    FieldSet.prototype._findComponents = function () {
        if (!this.appended) this._throwError('notAppended', 'FieldSet._findComponents()');
        this.fieldset = $('#unitFieldset-' + this.sharedId);
        this.scalarField = $('#activeScalar-' + this.sharedId, this.fieldset);
        this.systemField = $('#activeSystem-' + this.sharedId, this.fieldset);
        this.dimensionField = $('#activeDimension-' + this.sharedId, this.fieldset);
        this.unitField = $('#activeUnit-' + this.sharedId, this.fieldset);
        this.undoButton = $('#undo-' + this.sharedId, this.fieldset);
        this.redoButton = $('#redo-' + this.sharedId, this.fieldset);
        this.resetButton = $('#reset-' + this.sharedId, this.fieldset);
    };

    /**
     * Throw an error related to this function
     *
     * @param type
     * @private
     */
    FieldSet.prototype._throwError = function (type, reference) {
        var msg = undefined;
        switch (type) {
            case 'notAppended':
                msg += "Tried to find field set components before adding them to the page.";
                break;
        }
        if (reference) msg += "  See " + reference;
        throw new Error(msg);
    };


//reference the object in the global scope
    org.units.FieldSet = FieldSet;
})();