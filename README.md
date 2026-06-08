
# desactualizado
# desactualizado

## Cómo se cargan los bancos de preguntas

La lista de archivos está en:

```text
preguntas/index.json
```

Ejemplo:

```json
[
  {
    "label": "Unidad 2 - Set 1",
    "path": "preguntas/u2-01.json"
  },
  {
    "label": "Unidad 3 - Set 1",
    "path": "preguntas/u3-01.json"
  },
]
```

## Agregar más archivos JSON

1. Crea otro archivo dentro de `preguntas/`, por ejemplo:

- u2 -> Unidad 2
- -02 -> segundo set de preguntas
```text
preguntas/u2-02.json
```

2. Agrega una entrada en `preguntas/index.json`:

```json
{
  "label": "Unidad 2 - Set 2",
  "path": "preguntas/u2-02.json"
}
```


## Reglas de la seed

La seed debe ser un número entero entre `1` y `9999`.

## Formatos soportados

### Verdadero / falso

```json
{
  "id": 1,
  "unidad": 5,
  "tipo": "verdadero-falso",
  "pregunta": "Texto de la pregunta",
  "respuesta": false,
  "justificacion": "Explicación opcional"
}
```

### Alternativas con una o varias correctas

```json
{
  "id": 2,
  "unidad": 5,
  "tipo": "alternativas",
  "pregunta": "Texto de la pregunta",
  "alternativas": ["A", "B", "C"],
  "correctas": [0, 2]
}
```

### Desarrollo

```json
{
  "id": 3,
  "unidad": 5,
  "tipo": "desarrollo",
  "pregunta": "Texto de la pregunta",
  "respuesta_esperada": "Texto esperado para autocorrección"
}
```
