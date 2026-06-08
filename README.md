# AppQuiz - Bancos de preguntas

Este proyecto carga bancos de preguntas desde archivos JSON ubicados en la carpeta `preguntas/`. La página usa el **formato nuevo** de preguntas; el formato antiguo ya no debe usarse.

## Estructura general

La lista de bancos disponibles se define en:

```text
preguntas/index.json
```

Cada entrada del índice debe tener:

```json
{
  "label": "Software-u2-vf",
  "path": "preguntas/software-u2-vf.json"
}
```

- `label`: nombre visible en la página.
- `path`: ruta del archivo JSON dentro del proyecto.

Ejemplo de índice:

```json
[
  {
    "label": "Software-u2-vf",
    "path": "preguntas/software-u2-vf.json"
  },
  {
    "label": "Software-u2-alt",
    "path": "preguntas/software-u2-alt.json"
  },
  {
    "label": "Software-u2-des",
    "path": "preguntas/software-u2-des.json"
  }
]
```

## Cómo agregar preguntas a archivos existentes

Para agregar más preguntas a un banco existente, abre el archivo correspondiente dentro de `preguntas/` y agrega nuevos objetos al final del arreglo JSON.

Por ejemplo, si quieres agregar preguntas de verdadero/falso a la unidad 2:

```text
preguntas/software-u2-vf.json
```

Agrega la nueva pregunta antes del `]` final, separándola con coma respecto a la pregunta anterior.

Ejemplo:

```json
[
  {
    "ramo": "software",
    "unidad": 2,
    "tipo": "vf",
    "numero": 1,
    "pregunta": "Texto de la pregunta.",
    "respuesta": true,
    "justificacion": "Explicación de la respuesta."
  },
  {
    "ramo": "software",
    "unidad": 2,
    "tipo": "vf",
    "numero": 2,
    "pregunta": "Nueva pregunta agregada.",
    "respuesta": false,
    "justificacion": "Explicación de por qué es falsa."
  }
]
```

Recomendaciones al agregar preguntas:

- Mantén el mismo `tipo` dentro del archivo. Por ejemplo, no mezcles `vf`, `alt` y `des` en un mismo archivo.
- Usa `numero` correlativo dentro de cada archivo.
- No repitas el mismo `numero` dentro del mismo archivo.
- Revisa que el JSON siga siendo válido: comas entre objetos, comillas dobles y sin coma sobrante después del último objeto.
- Si agregas preguntas a un archivo ya usado por otros usuarios, los códigos de cuestionario antiguos seguirán considerando solo el límite guardado en el código.

## Formato de preguntas

### Verdadero / falso

Usa `tipo: "vf"`.

```json
{
  "ramo": "software",
  "unidad": 2,
  "tipo": "vf",
  "numero": 1,
  "pregunta": "Texto de la afirmación.",
  "respuesta": true,
  "justificacion": "Explicación de la respuesta."
}
```

Reglas:

- `respuesta` debe ser `true` o `false`.
- `justificacion` debe explicar la respuesta correcta.

### Alternativas

Usa `tipo: "alt"`.

```json
{
  "ramo": "software",
  "unidad": 2,
  "tipo": "alt",
  "numero": 1,
  "pregunta": "Texto de la pregunta.",
  "opciones": [
    "Opción A",
    "Opción B",
    "Opción C",
    "Opción D"
  ],
  "ningunaCorrecta": false,
  "respuesta": [0, 2],
  "justificacion": "Explicación de las alternativas correctas."
}
```

Reglas:

- `opciones` debe ser un arreglo de textos.
- `respuesta` debe ser un arreglo con los índices correctos.
- Los índices parten desde `0`.
- Si la primera y tercera opción son correctas, usa `respuesta: [0, 2]`.
- Si no hay alternativas correctas, usa:

```json
{
  "ningunaCorrecta": true,
  "respuesta": []
}
```

### Desarrollo

Usa `tipo: "des"`.

```json
{
  "ramo": "software",
  "unidad": 2,
  "tipo": "des",
  "numero": 1,
  "pregunta": "Explica el concepto solicitado.",
  "respuesta": "Respuesta esperada para que el usuario pueda autocorregirse."
}
```

Reglas:

- `respuesta` debe ser un texto.
- La corrección es manual/autocorregida por el usuario.

## Cómo agregar nuevos archivos

Para crear un banco nuevo, sigue estos pasos.

### 1. Crear el archivo JSON

Crea un archivo dentro de la carpeta `preguntas/`.

Convención recomendada:

```text
preguntas/software-u6-vf.json
preguntas/software-u6-alt.json
preguntas/software-u6-des.json
```

Donde:

- `software` indica el ramo.
- `u6` indica la unidad.
- `vf`, `alt` o `des` indica el tipo de preguntas.

### 2. Agregar preguntas en formato nuevo

Ejemplo para un archivo nuevo de alternativas:

```json
[
  {
    "ramo": "software",
    "unidad": 6,
    "tipo": "alt",
    "numero": 1,
    "pregunta": "¿Qué afirmaciones son correctas?",
    "opciones": [
      "Primera afirmación.",
      "Segunda afirmación.",
      "Tercera afirmación.",
      "Cuarta afirmación."
    ],
    "ningunaCorrecta": false,
    "respuesta": [0, 2],
    "justificacion": "La primera y la tercera afirmación son correctas."
  }
]
```

### 3. Registrar el archivo en `preguntas/index.json`

Agrega una entrada al índice:

```json
{
  "label": "Software-u6-alt",
  "path": "preguntas/software-u6-alt.json"
}
```

Ejemplo con el nuevo archivo agregado:

```json
[
  {
    "label": "Software-u5-des",
    "path": "preguntas/software-u5-des.json"
  },
  {
    "label": "Software-u6-alt",
    "path": "preguntas/software-u6-alt.json"
  }
]
```

Importante: el archivo solo aparecerá en la página si está registrado en `preguntas/index.json`.

## Código de cuestionario y seed

La página permite generar un código de cuestionario para compartir el mismo intento con otros usuarios.

El código guarda:

- seed usada.
- cantidad total de preguntas.
- archivos seleccionados.
- límite de preguntas considerado por cada archivo.

El límite siempre parte desde la pregunta `1` de cada archivo y llega hasta la cantidad existente al momento de generar el código.

Esto permite que el cuestionario sea determinista aunque después se agreguen más preguntas al mismo archivo. Por ejemplo, si el código fue creado cuando `software-u2-vf.json` tenía 40 preguntas, seguirá usando solo las preguntas `1..40`, aunque luego el archivo tenga 60.

## Información importante

- En el formato nuevo, el campo `respuesta` cambia según el tipo:
  - `vf`: booleano (`true` o `false`).
  - `alt`: arreglo de índices (`[0, 2]`).
  - `des`: texto con la respuesta esperada.
- Los archivos deben contener un arreglo JSON, no un objeto suelto.
- Las rutas de `preguntas/index.json` deben coincidir exactamente con los nombres reales de los archivos.
- Después de modificar JSON, prueba la página con Live Server o con:

```bash
python -m http.server
```

- Si el navegador muestra error al cargar preguntas, revisa primero:
  - que el JSON no tenga comas sobrantes;
  - que el archivo esté registrado en `preguntas/index.json`;
  - que el `path` sea correcto;
  - que el tipo sea `vf`, `alt` o `des`;
  - que `respuesta` tenga el tipo de dato correcto.
