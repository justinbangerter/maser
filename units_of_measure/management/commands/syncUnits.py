import json
import units_of_measure.models as models
from django.core.management import base

class Command(base.BaseCommand):
    """
    These are some utilities for writing units into json for consumption by the client

    The structure will resemble this:
    -systems
    |-metadata
    |-dimensions
    ||-units
    -dimensions
    |-metadata
    |-units
    -units
    |-metadata
    """
    help = "Update unit.data.json with values from the database."

    def handle(self, *args, **options):
        self._writeToFile()

    def _writeToFile(self):
        f = open('units_of_measure/static/js/unit/unit.data.json', 'w')
        try:
            data = self._getUnitData()
            json.dump(data, f)
        finally:
            f.close()

    def _getUnitData(self):
        """
        get all of the unit system models
        store all of the units in their systems with their respective dimensions
        """
        #First, make sure all of the units are normalized
        models.Unit.units.normalizeAll()

        #read the systems and dimensions
        systemsDict = self._getSystemsDict()
        dimensionsDict = self._getDimensionsDict()
        unitsDict = self._getUnitsDict()

        return {'systems': systemsDict, 'dimensions': dimensionsDict, 'units': unitsDict}

    def _getSystemsDict(self):
        """
        Read the systems and dimensions into a dictionary
        """
        result = {}
        systems = models.UnitSystem.objects.all()
        for system in systems:
            systemData = self._getSystemDict(system)
            if systemData is not None:
                result[system.abbreviation] = systemData
        return result

    def _getSystemDict(self, system):
        """
        Read a system and its contained dimensions into a dictionary

        :system: the system for which we are getting a dictionary
        :dimensions: the dimensions that belong to this system
        """
        systemUnits = system.getUnits()
        dimensions = system.getDimensions()
        return {
            'system': system.asDict(),
            'dimensions': self._getDimensionsDict(dimensions, systemUnits)
        }

    def _getDimensionsDict(self, dimensions=models.Dimension.objects.all(), systemUnits=None):
        """
        Get a dictionary for a set of dimensions.

        :dimensions: (optional)the dimensions to loop through
        :systemUnits: (optional) only consider units in this set
        """
        result = {}
        for dimension in dimensions:
            dimensionData = self._getDimensionDict(dimension, systemUnits)
            if dimensionData is not None:
                result[dimension.abbreviation] = dimensionData
        return result

    def _getDimensionDict(self, dimension, systemUnits=None):
        """
        Read a dimension from a unit system into a dictionary
        """
        dimensionUnits = dimension.getUnits(systemUnits)
        if len(dimensionUnits) > 0:
            return {
                'dimension': dimension.asDict(),
                'units': self._getUnitsDict(dimensionUnits)
            }

    def _getUnitsDict(self, units=models.Unit.units.all()):
        """
        Return a set of units as a dictionary

        :units: (optional) a set of units to loop through
        """
        result = {}
        for unit in units:
            result[unit.getCode()] = unit.asDict()
        return result