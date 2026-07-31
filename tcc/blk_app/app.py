import json
import os
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, flash, session
from flask_cors import CORS
from .extensions import db, migrate


RAIZ_PROJETO = Path(__file__).resolve().parents[2]
load_dotenv(RAIZ_PROJETO / ".env")


def create_app():
    database_url = os.getenv("DATABASE_URL")
    secret_key = os.getenv("FLASK_SECRET_KEY")

    if not database_url:
        raise RuntimeError(
            "DATABASE_URL nao foi configurada. Crie o arquivo .env a partir de .env.example."
        )

    if not secret_key:
        raise RuntimeError(
            "FLASK_SECRET_KEY nao foi configurada. Crie o arquivo .env a partir de .env.example."
        )

    app = Flask(__name__, template_folder="../templates", static_folder="../static")
    app.config.update(
        SECRET_KEY=secret_key,
        SQLALCHEMY_DATABASE_URI=database_url,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SQLALCHEMY_ENGINE_OPTIONS={"pool_pre_ping": True},
    )
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    @app.after_request
    def toast_json(response):
        if not response.is_json:
            return response
        data = response.get_json(silent=True)
        if not isinstance(data, dict) or "_toast" in data:
            return response
        category = "error" if response.status_code >= 400 or data.get("success") is False else "success"
        message = data.get("erro") or data.get("error") if category == "error" else data.get("mensagem")
        if not message:
            return response
        quantidade_anterior = len(session.get("_flashes", []))
        flash(message, category)
        flashes = session.get("_flashes", [])
        del flashes[quantidade_anterior:]
        if flashes:
            session["_flashes"] = flashes
        else:
            session.pop("_flashes", None)
        data["_toast"] = {"category": category, "message": message}
        response.set_data(json.dumps(data, ensure_ascii=False, default=str))
        response.content_type = "application/json; charset=utf-8"
        return response

    from .routes import web
    app.register_blueprint(web)
    return app
