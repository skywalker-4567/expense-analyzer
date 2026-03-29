from fastapi import FastAPI
from pydantic import BaseModel
from model import train_model, predict_category

app = FastAPI()

model = train_model()


class PredictRequest(BaseModel):
    description: str


@app.post("/predict-category")
def predict(request: PredictRequest):
    category = predict_category(model, request.description)
    return {"category": category}

@app.get("/health")
def health():
    return {"status": "ok"}
# uvicorn main:app --reload --port 8000
