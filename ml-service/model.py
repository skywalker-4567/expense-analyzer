from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

texts = [
    "swiggy order", "zomato food", "pizza restaurant",
    "uber ride", "bus ticket", "flight booking",
    "amazon shopping", "flipkart order",
    "electricity bill", "mobile recharge",
]

labels = [
    "Food", "Food", "Food",
    "Travel", "Travel", "Travel",
    "Shopping", "Shopping",
    "Bills", "Bills",
]


def train_model() -> Pipeline:
    pipeline = Pipeline([
        ("vectorizer", CountVectorizer()),
        ("classifier", MultinomialNB()),
    ])
    pipeline.fit(texts, labels)
    return pipeline


def predict_category(model: Pipeline, description: str) -> str:
    result = model.predict([description.lower()])
    return result[0]
