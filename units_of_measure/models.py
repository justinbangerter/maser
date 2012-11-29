from django.db import models
from decimal import *

############
# Managers #
############
class UnitManager(models.Manager):
    """
    Table-wide interactions with units
    """

    def normalizeAll(self):
        """
        Normalize all units in the table
        """
        units = super(UnitManager, self).all()
        for unit in units:
            unit.normalize()


class QuantityManager(models.Manager):
    """
    Table-wide interactions with quantities
    """

    def create_quantity(self, scalar, unit):
        """
        Create a quantity instance
        """
        quantity = self.create(scalar=Decimal(scalar), unit=unit)
        return quantity

##########
# Models #
##########

class Unit(models.Model):
    """
    This is a unit (eg pounds, meters, miles, hectares, etc...)
    """
    name = models.CharField(max_length=40)
    name_plural = models.CharField(max_length=40)

    abbreviation = models.CharField(max_length=15)
    abbreviation_plural = models.CharField(max_length=15)

    #The system to which this unit belongs
    system = models.ForeignKey('UnitSystem')

    #The dimension of the unit is used to make sure that units cannot be
    #converted into different dimensions without a supplied conversion ratio
    dimension = models.ForeignKey('Dimension')

    #The quantity by which this unit is defined
    defining_quantity = models.ForeignKey('Quantity', related_name='unit_defining_quantity', blank=True, null=True, )

    #By normalizing the definition to a common standard among units,
    #part of the conversion calculation can be done at declaration
    #instead of by request.
    normalized_quantity = models.ForeignKey('Quantity', related_name='unit_normalized_quantity', blank=True, null=True
        , )

    #Leave a place to say where the information came from
    information_source = models.CharField(max_length=256)

    #Manager
    units = UnitManager()

    def __eq__(self, other):
        if type(other) is not Unit: return False
        return self.pk == other.pk

    def __unicode__(self):
        return '%s [%s] %s' % (self.abbreviation, self.dimension.abbreviation, self.system.abbreviation,)

    def checkConsistentDimensions(self, unit):
        """
        Make sure the dimension is the same
        """
        if unit.dimension.pk != self.dimension.pk:
            raise ValueError('Tried to convert between %s and %s for %s and %s' % (
                unit.dimension.name, self.dimension.name, unit, self))

    def getRatioForTarget(self, unit):
        """
        Get a conversion ratio that can multiplied by a quantity
        with this unit to retrieve a quantity with the target unit.
        """
        self.checkConsistentDimensions(unit)

        if self.normalized_quantity is None:
            self.normalize()

        if unit.normalized_quantity is None:
            unit.normalize()

        #if going from cm to m, normalized in m
        #self.normalized_scalar will be .001m
        #unit.normalized_scalar will be 1m
        #we want 1/100
        return self.normalized_quantity.scalar / unit.normalized_quantity.scalar

    def getRatioForSource(self, unit):
        """
        Get a conversion ratio that can multiplied by a quantity
        with the source unit to retrieve a quantity with this unit.
        """
        return Decimal(1) / self.getRatioForTarget(unit)

    def normalize(self):
        """
        Set the normalized data on this unit.
        The normal unit in this unit's dimension is used as a reference.
        """
        #identify the normal unit from the dimension
        print 'normalizing: ' + str(self)
        if self.dimension.normal_unit is None:
            raise ValueError('No normal unit was defined for this dimension ' + str(self.dimension))


        #identify the normal quantity and normalize it
        normal_unit = self.dimension.normal_unit

        #if this unit is the normal unit, store it as such
        #This is needed to prevent infinite recursion
        if self == normal_unit:
            self.normalized_quantity = Quantity.quantities.create_quantity(1, self)
        else:
            self.normalized_quantity = self.defining_quantity.convertToUnit(normal_unit)

        #save the changes
        self.save()


    def getCode(self):
        return '%s %s %s' % (self.system.abbreviation, self.dimension.abbreviation, self.abbreviation)

    def getName(self):
        return '%s (%s)' % (self.name, self.abbreviation)

    def asDict(self):
        return {
            "name": self.getName(),
            "name_plural": self.name_plural,
            "code": self.getCode(),
            #quantity_this * ratio = quantity_base
            "ratio": self.normalized_quantity.scalar,
            "system_code": self.system.abbreviation,
            "dimension_code": self.dimension.abbreviation
        }


class UnitSystem(models.Model):
    """
    Represents a system of units, SI, Imperial, UK, FDA, US, Natural, etc...
    """
    name = models.CharField(max_length=40, unique=True)
    abbreviation = models.CharField(max_length=15, unique=True)
    description = models.TextField(max_length=512)

    def getUnits(self, units=Unit.units):
        """
        Get all of the units that belong to this system.

        :units: (Optional) a set of units that can be filtered for presence
        in this system
        """
        return units.filter(system=self)

    def getDimensions(self):
        """
        Get all of the dimensions that belong to this system.
        """
        dimensions = set()
        for unit in self.getUnits():
            dimensions.add(unit.dimension)
        return dimensions

    def __unicode__(self):
        return self.name

    def asDict(self):
        return {"name": self.name, "code": self.abbreviation, "description": self.description}


class Dimension(models.Model):
    """
    This is a dimension (eg length, volume, area, mass, etc...)

    Its purpose is to ensure that different kinds of units won't convert
    without a supplied conversion factor.
    """
    name = models.CharField(max_length=40, unique=True)
    name_plural = models.CharField(max_length=40, unique=True)

    abbreviation = models.CharField(max_length=15, unique=True)

    #This is the base unit for all units in this dimension
    #TODO add constraint that this unit's dimension must be the same as this
    normal_unit = models.ForeignKey('Unit', related_name='dimension_normal_unit', blank=True, null=True)

    def getUnits(self, units=None):
        """
        Get all of the units are defined in this dimension.

        You may pass in an optional units set that can be filtered for
        presence in this dimension.
        """
        if units is None: units = Unit.units.all()
        return units.filter(dimension=self)

    def __unicode__(self):
        return self.name

    def asDict(self):
        return {"name": self.name, "code": self.abbreviation, "normal_unit": self.normal_unit.abbreviation}


class Quantity(models.Model):
    """
    This is a quantity: a scalar and a unit
    It is a helper object and not a table in the database.
    Its purpose is to clean up the code for converting units.
    """
    scalar = models.DecimalField(decimal_places=9, max_digits=18)
    unit = models.ForeignKey(Unit)

    #Manager object
    quantities = QuantityManager()

    def __unicode__(self):
        return '%s %s' % (self.scalar.to_eng_string(), self.unit.abbreviation)

    def convertToUnit(self, unit):
        """
        Convert this quantity to an equivalent one expressed in the supplied unit
        """
        #if the quantity is already in this unit, return it
        if unit is self.unit:
            return self.unit

        ratio = self.unit.getRatioForTarget(unit)
        return Quantity.quantities.create_quantity(self.scalar * ratio, unit)