#!/usr/bin/env python
"""Root entrypoint for Django management commands."""
import os
import sys
from pathlib import Path


def main() -> None:
    project_root = Path(__file__).resolve().parent
    backend_dir = project_root / "backend"

    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "gestion_scolaire.settings")

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Install dependencies then retry:\n"
            "pip install -r requirements.txt"
        ) from exc

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
