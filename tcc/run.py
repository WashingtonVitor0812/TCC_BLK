try:
    from tcc.blk_app import create_app
except ModuleNotFoundError:
    from blk_app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
