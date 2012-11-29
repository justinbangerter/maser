"""
Some basic tests for the Conversion widget
"""
from django.test import TestCase
from decimal import Decimal
from units_of_measure.models import Unit
from units_of_measure.models import Quantity
from units_of_measure.models import Dimension


class ConversionTests(TestCase):
    def test_roundingError(self):
        """
        Test that conversions between units can be executed thousands of times without rounding errors
        """
        print ' Testing for rounding errors...'

        #TODO make this test all units in the fixture
        milliliter = Unit.units.get(name='Milliliter')
        liter = Unit.units.get(name='Liter')
        quantity = Quantity.quantities.create_quantity('1', milliliter)
        reference = quantity
        iterationCount = 1000
        for i in range(iterationCount):
            quantity = quantity.convertToUnit(liter)
            quantity = quantity.convertToUnit(milliliter)

        # assert that no changes occurred
        errMsg = "Rounding errors are propagating during conversions."
        errMsg += "Divergence after %s iterations: %s"
        divergence = quantity.scalar.compare(reference.scalar)

        assert divergence == Decimal('0'),\
        errMsg % (str(iterationCount), str(divergence))

    def test_dimensionConsistency(self):
        """
        Test that conversions between units of different dimensions result in an exception
        """
        print ' Testing cross dimension conversions...'
        try:
            #TODO make this test all dimensions in the fixture
            milliliter = Unit.units.get(name='Milliliter')
            meter = Unit.units.get(name='Meter')
            quantity = Quantity.quantities.create_quantity(1, milliliter)
            quantity.convertToUnit(meter)
            assert False, "Conversions between inconsistent dimensions are allowed"
        except ValueError:
            pass

    def test_expectedValues(self):
        """
        Tests that some units are normalized to something that makes sense.
        """
        print ' Testing selected values for conversion behavior...'
        inch = Unit.units.get(name='Inch')
        meter = Unit.units.get(name='Meter')
        q = Quantity.quantities.create_quantity('1', inch)
        r = q.convertToUnit(meter)
        comparison = r.scalar.compare(Decimal('0.0254'))
        assert comparison == Decimal('0'), "1 inch should convert to 0.0254 meters, but was " + str(r.scalar)

    def test_normalization(self):
        print ' Testing selected values for normalization behavior...'
        length = Dimension.objects.get(name='Length')
        meter = Unit.units.get(name='Meter')
        inch = Unit.units.get(name='Inch')

        length.normal_unit = meter

        inch.normalize()

        normalizedToMeter = inch.normalized_quantity.unit == meter
        assert normalizedToMeter, "The inch was not normalized."

        normalizedScalar = inch.normalized_quantity.scalar
        normalizedToScalar = normalizedScalar.compare(Decimal('0.0254')) == Decimal('0')
        assert normalizedToScalar,\
        "1 inch should be normalized to 0.0254 meters, but was " + str(normalizedScalar)

