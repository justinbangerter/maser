//Setup the namespace
if (org == null) var org = {};
//if a javascript units library is already loaded, we have a problem...
if (org.units == null) org.units = {};
else throw new Error("A namespace of django.contrib.units already exists!");

/////////////
// Helpers //
/////////////

/**
 * A helper to abstract away the get___Opts methods.  This reads an array of objects into another array of objects.
 *
 * @param objects the objects to loop through
 * @param value the object metadata property to use as the value. objects[i].metadata[value] will be placed in {"value":___ ... }
 * @param label the object metadata property to use as the label. objects[i].metadata[label] will be placed in {"label":___ ... }
 * @private
 * @return an array of literals with "value" and "label" properties
 */
org.units._getOpts = function (objects, value, label) {
    var opts = [];
    for (var i in objects) if (objects.hasOwnProperty(i)) {
        var metadata = objects[i].metadata;
        var systemData = {
            "value":metadata[value],
            "label":metadata[label]
        };
        opts.push(systemData);
    }
    return opts;
};

/**
 * Check if the given string is in the format of a number, with or without decimals.
 * Ignore preceding and trailing space.
 * @param s the string to test
 * @return {Boolean} whether the given string is a number
 */
org.units.isDecimal = function (s) {
    return /^\s*(\+|-)?((\d+(\.\d+)?)|(\.\d+))\s*$/.test(s);
};

/**
 * Alter a button's activity.  If no active state is supplied, retrieve it.
 * If active is false, set the button to inactive.
 * If active is true, set the button to active.
 * @param button the button to alter
 * @param active (optional) the state of the button
 * @return {boolean} the state of the button
 */
org.units.buttonActive = function (button, active) {
    if (active !== null) {
        if (active) {
            button.removeAttr('disabled');
        }
        else {
            button.attr('disabled', 'disabled');
        }
    }
    return button.attr('disabled');

};