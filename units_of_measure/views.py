from django.http import HttpResponse
from django.template import RequestContext, loader
import json

def index(request):
    """
    Load the widget display
    """
    f = open('units_of_measure/static/units/js/unit.data.json')
    j = json.load(f)
    t = loader.get_template('units-of-measure/index.html')
    c = RequestContext(request, {
        'converterData': json.dumps(j),
        })
    return HttpResponse(t.render(c))