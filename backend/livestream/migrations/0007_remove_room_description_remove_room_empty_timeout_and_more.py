# Generated by Django 5.1 on 2025-05-03 07:24

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('livestream', '0006_fix_room_names'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RemoveField(
            model_name='room',
            name='description',
        ),
        migrations.RemoveField(
            model_name='room',
            name='empty_timeout',
        ),
        migrations.RemoveField(
            model_name='room',
            name='max_participants',
        ),
        migrations.RemoveField(
            model_name='room',
            name='title',
        ),
        migrations.AddField(
            model_name='room',
            name='name',
            field=models.CharField(max_length=100, null=True),
        ),
        migrations.RunPython(
            lambda apps, schema_editor: apps.get_model('livestream', 'Room').objects.update(name=models.F('room_id'))
        ),
        migrations.AlterField(
            model_name='room',
            name='name',
            field=models.CharField(max_length=100, unique=True),
        ),
        migrations.AlterField(
            model_name='room',
            name='host',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='hosted_rooms', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='room',
            name='metadata',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name='room',
            name='room_id',
            field=models.CharField(max_length=100, unique=True),
        ),
        migrations.CreateModel(
            name='Participant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('host', 'Host'), ('moderator', 'Moderator'), ('viewer', 'Viewer'), ('guest', 'Guest')], default='viewer', max_length=10)),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('last_active', models.DateTimeField(auto_now=True)),
                ('room', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='participants', to='livestream.room')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='room_participations', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('room', 'user')},
            },
        ),
        migrations.DeleteModel(
            name='RoomMember',
        ),
    ]
