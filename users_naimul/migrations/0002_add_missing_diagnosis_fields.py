from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users_naimul", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="diagnosisprocedure",
            name="patient_name",
            field=models.CharField(max_length=100),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="diagnosisprocedure",
            name="patient_age",
            field=models.PositiveIntegerField(),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="diagnosisprocedure",
            name="patient_gender",
            field=models.CharField(
                max_length=10,
                choices=[
                    ("Male", "Male"),
                    ("Female", "Female"),
                    ("Other", "Other"),
                ],
            ),
            preserve_default=False,
        ),
    ]
