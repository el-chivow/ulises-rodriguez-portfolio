import json
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# =========================
# 1. Cargar modelo
# =========================
print("Cargando modelo all-MiniLM-L6-v2...")
model = SentenceTransformer("all-MiniLM-L6-v2")

# =========================
# 2. Cargar documentos
# =========================
INPUT_JSON = "docs_rag.json"
OUTPUT_JSON = "docs_with_embeddings.json"

with open(INPUT_JSON, "r", encoding="utf-8") as f:
    docs = json.load(f)

print(f"Documentos cargados: {len(docs)}")

# =========================
# 3. Generar embeddings
# =========================
docs_with_embeddings = []

for doc in tqdm(docs, desc="Generando embeddings"):
    text = doc["text"]

    embedding = model.encode(
        text,
        normalize_embeddings=True  # 🔥 MUY IMPORTANTE
    )

    docs_with_embeddings.append({
        "id": doc["id"],
        "embedding": embedding.tolist(),
        "metadata": doc["metadata"]
    })

# =========================
# 4. Guardar resultado
# =========================
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(docs_with_embeddings, f, ensure_ascii=False)

print(f"Embeddings guardados en {OUTPUT_JSON}")