# Healthcare Agent Local Install

## Install on devices

Use the hosted web app in a modern browser, then choose **Install App** from the front page. If the browser does not show the install prompt, use the browser menu:

- iOS Safari: Share, then Add to Home Screen.
- Android Chrome/Edge: Install app or Add to Home screen.
- Windows Chrome/Edge: Install app from the address bar or browser menu.
- macOS Chrome/Edge/Safari: Add to Dock or Install app when available.

## Run locally

1. Extract the local app package.
2. On Windows, run `launch_app.cmd`.
3. The front page opens in your browser.
4. Choose **Download**, **Login on Web**, or **Use Local Mode**.

If port `8501` is already busy, the launcher automatically uses the next available port and opens it in your browser. The exact local address is shown in the launcher window.

When the app is running from `localhost`, demo memory is saved in the extracted app folder under `.localhost_store/`. The hosted web app still uses browser storage. Use **Clear Memory** inside the app to remove the current patient's saved local conversation and profile.

The local app does not diagnose, prescribe, or replace medical care.

## Developer model checks

The ZIP also includes the Python agent model in `healthcare_agent/`.

After installing Python dependencies, run:

```powershell
pip install -r requirements.txt
python -m pytest -q
streamlit run streamlit_app.py
```
