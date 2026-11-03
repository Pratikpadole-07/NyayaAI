# NyayAI

AI-powered legal assistance platform for lawyers.

## Run locally

Backend:
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Frontend:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```