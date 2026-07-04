# Healthcare Agent GitHub Ready Folder

This folder is a clean GitHub upload copy of the Healthcare Agent project.

It includes:

- Frontend PWA in `web/`
- Root static app files for local preview
- Python backend agent package in `healthcare_agent/`
- Local API/store server in `serve_local.ps1`
- Streamlit demo in `streamlit_app.py`
- Agent tests in `tests/`
- Medical FAQ and medication data in `data/`
- Local launcher scripts
- GitHub Pages workflow
- File-size guard that fails if any file is larger than 15 MB

Before upload:

```powershell
.\scripts\check-file-sizes.ps1
python -m pytest -q
```

Recommended upload:

```powershell
git init -b main
git add .
git commit -m "Initial Healthcare Agent"
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```

In GitHub repository settings, enable Pages with GitHub Actions as the source.

The workflow publishes the `web/` folder after running file-size, JavaScript, and Python agent checks.
