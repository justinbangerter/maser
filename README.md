maser
=====

This is a Django plugin that manages unit conversions both in a client-side widget and in the database.

There is support for multiple unit systems, multiple dimensions, and multiple units, of course.

There is an undo/redo feature on the widget in the UI.

**Example**

Here is a screenshot of the widget.

![Maser Widget](/justinbangerter/maser/blob/master/maser-widget.png?raw=true)


**Setup**

You can add it to your project by copying the units_of_measure folder into your project and adding this line to your INSTALLED_APPS list.

    'units_of_measure',
    
The provided fixture in fixtures/initial_data.json has some sample cooking units defined already.  These should be loaded into the database.

You can run manage.py syncUnits to read the database and generate a json object that will be used to populate the widget on the front end.


**Issues**

If you're entering your units from scratch, you will have to leave the first unit defined in a dimension as undefined and define it after you have established other relations.  I would have liked to work on this a bit more, but the disappearance of my personal need for this system led me to move away from it early.

Let me know if you have any questions or if you need any help.