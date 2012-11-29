from django.contrib import admin

from units_of_measure import models as units

class QuantityAdmin(admin.ModelAdmin):
    pass

admin.site.register(units.Quantity, QuantityAdmin)

class UnitAdmin(admin.ModelAdmin):
    exclude = ['normalized_quantity']
    pass

admin.site.register(units.Unit, UnitAdmin)


class DimensionAdmin(admin.ModelAdmin):
    pass

admin.site.register(units.Dimension, DimensionAdmin)


class UnitSystemAdmin(admin.ModelAdmin):
    pass

admin.site.register(units.UnitSystem, UnitSystemAdmin)
