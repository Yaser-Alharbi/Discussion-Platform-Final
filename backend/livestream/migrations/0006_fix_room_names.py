from django.db import migrations

def fix_room_names(apps, schema_editor):
    # Don't need to do anything here since we're adding the name field fresh
    pass

def reverse_fix(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('livestream', '0005_auto_20250503_0832'),
    ]

    operations = [
        migrations.RunPython(fix_room_names, reverse_fix),
    ]