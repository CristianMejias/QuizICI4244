# Cuestionario con index.json

## Ejecutar

No abras el HTML directamente con doble clic si vas a cargar JSON desde la carpeta, porque `fetch` puede fallar por seguridad del navegador.

Opción recomendada:

```bash
cd QuizICI4244
python -m http.server 5500
```

Luego abre:

```text
http://localhost:5500
```

Para detener:
```text
Control + C
```


También puedes usar la extensión Live Server de VSCode.

## Cómo se cargan los bancos de preguntas

La lista de archivos ya no está dentro de `app.js`.

Ahora está en:

```text
preguntas/index.json
```

Ejemplo:

```json
[
  {
    "label": "Unidad 5 - Calidad de software",
    "path": "preguntas/unidad5.json"
  },
  {
    "label": "Ejemplo mixto",
    "path": "preguntas/ejemplo-mixto.json"
  }
]
```

## Agregar más archivos JSON

1. Crea otro archivo dentro de `preguntas/`, por ejemplo:

```text
preguntas/unidad6.json
```

2. Agrega una entrada en `preguntas/index.json`:

```json
{
  "label": "Unidad 6",
  "path": "preguntas/unidad6.json"
}
```

No necesitas modificar `app.js`.

## Reglas de la seed

La seed debe ser un número entero entre `1` y `999999`.

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
