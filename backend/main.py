"""Vercel Services 진입점 (vercel.json의 backend.entrypoint = "main:app")."""

from app.main import app

__all__ = ["app"]
