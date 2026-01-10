# RAG Pipeline + Clasificador de Negocios por Tipo de Comida (DOBLEU)

Este repositorio implementa un **sistema de inteligencia comercial** para **DOBLEU**, combinando:

1. **Pipeline de preparación de datos para RAG (Retrieval-Augmented Generation)**  
2. **Clasificador de negocios por tipo de comida usando Machine Learning**

El objetivo es transformar datos crudos de negocios locales (menús, productos, descripciones) en **documentos enriquecidos**, **clasificados**, **etiquetados** y **listos para búsqueda semántica, chatbots y sistemas de recomendación**.

---

## Objetivos del Proyecto

- Convertir datos reales de negocios en **documentos RAG de alta calidad**
- Inferir automáticamente el **tipo de comida** de un negocio
- Generar **labels oficiales reutilizables** para UI y filtros
- Detectar **tags semánticos** (ingredientes, estilos, variantes)
- Permitir que el sistema **evolucione solo** conforme crecen los datos
- Preparar la base para:
  - Chatbots con RAG
  - Búsqueda semántica
  - Recomendaciones inteligentes
  - Analítica de consumo

---

## Arquitectura General

datos.json (datos crudos)
↓
Normalización + NLP ligero
↓
Clasificación por reglas (LABEL_RULES)
↓
Clasificador ML (tipo de comida)
↓
Generación documentos RAG (2 niveles)
↓
Labels oficiales + tags + metadata
↓
Auto-promoción de labels

## Qué genera este proyecto

### Salidas principales

| Archivo | Descripción |
|------|------------|
| `docs_rag.json` | Documentos finales para RAG (negocio + producto) |
| `label_registry.json` | Registro canónico de labels oficiales |
| `labels_pendientes.json` | Candidatos automáticos a nuevos labels |
| `datos.json` | Fuente principal de datos (input) |

---

## Descripción de Archivos

### `datos.json`
Archivo de entrada principal. Contiene información real de negocios:

- Nombre del negocio
- Descripción
- Dirección
- Horarios
- Productos
- Precios

Es la **fuente única de verdad** del pipeline.

---

### `docs_rag.json`
Salida principal del sistema RAG.

Genera **dos tipos de documentos**:

#### Documento de negocio
Incluye:
- Descripción general
- Horarios
- Dirección
- Labels oficiales
- Tags semánticos
- Texto optimizado para embeddings

#### Documento por producto
Incluye:
- Nombre del producto
- Descripción
- Precio
- Relación con el negocio
- Labels + tags heredados

Cada documento incluye:
- `text` → listo para embeddings
- `metadata` → filtros, flags, ids
- `labels_str` / `tags_str` → indexación rápida

---

### `label_registry.json`
Registro **canónico y oficial** de labels del sistema.

Incluye:
- Labels activos (para UI y filtros)
- Conteo de negocios por label
- Auto-promociones por uso real
- Fecha de generación
- Notas de uso

Este archivo debe consumirse directamente por frontend y APIs.

---

### `labels_pendientes.json`
Sistema de **inteligencia evolutiva**.

Contiene:
- Términos detectados frecuentemente
- Número de menciones
- Negocios involucrados
- Tipo (`tag` o `label`)
- Estado de promoción

Sirve para:
- Detectar nuevas categorías
- Evitar hardcodear taxonomías
- Escalar a nuevas regiones automáticamente

---

### `MySQLconection.ipynb`
Notebook de apoyo para:

- Conectarse a MySQL / MariaDB
- Extraer negocios y productos reales
- Transformar datos
- Exportar a `datos.json`

Pensado para integrarse con el backend real de DOBLEU.

---

## Labels vs Tags (Concepto Clave)

| Tipo | Descripción |
|----|----|
| **Label** | Categoría oficial estable (UI, filtros, navegación) |
| **Tag** | Término semántico detectado automáticamente |

Ejemplo:
- Label: `tacos`
- Tags: `arrachera`, `quesillo`, `cebolla ahumada`

Los tags pueden **promoverse automáticamente a labels** cuando alcanzan suficiente uso real.

---

## Clasificador de Negocios por Tipo de Comida (ML)

Proyecto en Python usando Jupyter Notebook para **inferir el tipo de comida** de un negocio a partir de:

- Descripción del negocio
- Productos del menú

### Tecnologías
- Python
- Pandas
- Scikit-learn
- Jupyter Notebook

### Qué aporta al sistema
- Validación de labels generadas por reglas
- Inferencia cuando el texto es ambiguo
- Señal adicional para ranking y recomendaciones
- Base para futuros modelos híbridos (ML + RAG)

---

No subí el .env por obvias razones 
