# Generated manually to align models with current schema.

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("web", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="attendance",
            name="justified",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="student",
            name="date_inscription",
            field=models.DateField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="student",
            name="date_naissance",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="student",
            name="nom",
            field=models.CharField(default="", max_length=150),
        ),
        migrations.AddField(
            model_name="student",
            name="prenom",
            field=models.CharField(default="", max_length=150),
        ),
        migrations.AddField(
            model_name="student",
            name="telephone",
            field=models.CharField(blank=True, default="", max_length=20),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="subject",
            name="coefficient",
            field=models.IntegerField(default=1),
        ),
    ]
