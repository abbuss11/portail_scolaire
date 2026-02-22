from django.apps import AppConfig


class WebConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "web"
    verbose_name = "Gestion Scolaire Application"

    def ready(self):
        from . import signals  # noqa: F401
