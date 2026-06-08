# AppQuiz

Aplicación web estática para crear intentos de cuestionario desde bancos de preguntas en JSON.

## Archivos principales

```text
index.html
styles.css
app.js
preguntas/index.json
preguntas/*.json
```

## Instrucciones para agregar preguntas a archivos JSON ya existentes

Para mantener funcionando los códigos de cuestionario ya compartidos, las preguntas nuevas deben agregarse con cuidado.

### Regla principal

Agrega preguntas nuevas **solo al final del archivo JSON**.

No modifiques, elimines ni reordenes preguntas existentes.

Esto es importante porque el código de cuestionario guarda un límite por archivo, por ejemplo:

```text
software-u2-vf.json: preguntas 1..40
software-u2-alt.json: preguntas 1..35
```
Si luego se agregan preguntas nuevas al final, por ejemplo de la 41 a la 50, los códigos antiguos compartidos seguirán usando solo las preguntas 1..40.

# 🚧🚧🚧🚧🚧🚧🚧🚧 Lo de abajo aun no se revisa 🚧🚧🚧🚧🚧🚧🚧🚧

## Cómo se cargan los bancos de preguntas

La lista de bancos está en:

```text
preguntas/index.json
```

Cada elemento debe tener:

- `label`: nombre visible del banco en la interfaz.
- `path`: ruta relativa al archivo JSON de preguntas.

Ejemplo basado en la estructura actual:

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
  ...
]
```

La aplicación carga esa lista al iniciar y muestra los bancos disponibles para selección.

## Agregar más archivos JSON

1. Crea un archivo dentro de `preguntas/`.

Ejemplo:

```text
preguntas/software-u6-vf.json
```

2. Agrega una entrada en `preguntas/index.json`.

```json
{
  "label": "Software-u6-vf",
  "path": "preguntas/software-u6-vf.json"
}
```

3. Verifica que el archivo nuevo sea un arreglo JSON y que todas sus preguntas usen el formato nuevo descrito abajo.

## Formato nuevo de preguntas

Todos los archivos de preguntas deben ser arreglos JSON:

```json
[
  {
    "ramo": "software",
    "unidad": 2,
    "tipo": "vf",
    "numero": 1,
    "pregunta": "Texto de la pregunta",
    "respuesta": true,
    "justificacion": "Explicación de la respuesta"
  }
]
```

Campos comunes:

| Campo | Tipo | Obligatorio | Descripción |
|---|---:|---:|---|
| `ramo` | string | Recomendado | Área o asignatura del banco. |
| `unidad` | number | Sí | Unidad asociada a la pregunta. |
| `tipo` | string | Sí | Tipo de pregunta: `vf`, `alt` o `des`. |
| `numero` | number | Sí | Número de la pregunta dentro del archivo. |
| `pregunta` | string | Sí | Enunciado de la pregunta. |
| `respuesta` | boolean / array / string | Sí | Respuesta correcta o esperada, según el tipo. |
| `justificacion` | string | Recomendado en `vf` y `alt` | Explicación que se muestra al corregir. |

## Tipo `vf`: verdadero / falso

Usa `tipo: "vf"` y `respuesta` como booleano.

```json
{
  "ramo": "software",
  "unidad": 2,
  "tipo": "vf",
  "numero": 1,
  "pregunta": "Scrum divide el trabajo en sprints.",
  "respuesta": true,
  "justificacion": "Correcto. Scrum organiza el trabajo en ciclos cortos llamados sprints."
}
```

Reglas:

- `respuesta` debe ser `true` o `false`.
- `justificacion` es recomendable para explicar por qué la afirmación es correcta o falsa.

## Tipo `alt`: alternativas

Usa `tipo: "alt"`, `opciones` como arreglo de textos y `respuesta` como arreglo de índices correctos.

```json
{
  "ramo": "software",
  "unidad": 2,
  "tipo": "alt",
  "numero": 1,
  "pregunta": "Selecciona los roles de Scrum.",
  "opciones": [
    "Product Owner",
    "Scrum Master",
    "Developers",
    "WIP"
  ],
  "ningunaCorrecta": false,
  "respuesta": [0, 1, 2],
  "justificacion": "Product Owner, Scrum Master y Developers son roles de Scrum. WIP pertenece a Kanban."
}
```

Reglas:

- `opciones` debe ser un arreglo con al menos una alternativa.
- `respuesta` debe ser un arreglo de índices base cero.
- Los índices deben existir dentro de `opciones`.
- Puede haber una o varias respuestas correctas.
- Si no hay opciones correctas, usa `respuesta: []` y `ningunaCorrecta: true`.

Ejemplo con ninguna correcta:

```json
{
  "ramo": "software",
  "unidad": 2,
  "tipo": "alt",
  "numero": 2,
  "pregunta": "Selecciona las opciones que son eventos formales de Scrum.",
  "opciones": [
    "Product Backlog",
    "Sprint Backlog",
    "Incremento",
    "WIP"
  ],
  "ningunaCorrecta": true,
  "respuesta": [],
  "justificacion": "Ninguna opción corresponde a un evento formal de Scrum."
}
```

## Tipo `des`: desarrollo

Usa `tipo: "des"` y `respuesta` como texto esperado para autocorrección.

```json
{
  "ramo": "software",
  "unidad": 2,
  "tipo": "des",
  "numero": 1,
  "pregunta": "Explica la diferencia entre Scrum y Kanban.",
  "respuesta": "Scrum trabaja con sprints, roles, eventos y artefactos definidos. Kanban trabaja con flujo continuo, tablero visual y límites WIP."
}
```

Reglas:

- `respuesta` debe ser un string no vacío.
- La aplicación muestra la respuesta esperada y el usuario marca manualmente si su respuesta fue correcta o incorrecta.

## Código de cuestionario

La aplicación puede generar un **código de cuestionario** para repetir exactamente los mismos parámetros en otro navegador o equipo.

El código incluye:

- Seed.
- Cantidad total de preguntas del intento.
- Lista de archivos usados.
- Límite de preguntas considerado por archivo, siempre desde `1` hasta `N`.

El código se muestra en el panel izquierdo durante el cuestionario y se puede copiar con el icono de copiar.

## Usar un código antes de iniciar

En la pantalla inicial existe un campo para pegar un código de cuestionario.

Al aplicar el código, la aplicación selecciona automáticamente:

- Los archivos usados.
- La seed.
- La cantidad total de preguntas.
- Los límites por archivo.

Después de aplicar el código, inicia el intento normalmente.

## Reglas de determinismo

Para que dos usuarios obtengan el mismo cuestionario:

1. Deben usar el mismo código.
2. Los archivos indicados en el código deben existir en `preguntas/index.json`.
3. Cada archivo debe conservar al menos la cantidad de preguntas indicada por su límite.
4. La aplicación solo considera preguntas desde `1` hasta el límite guardado en el código.
5. Si después alguien agrega más preguntas al final de un archivo, esas preguntas nuevas no afectan los cuestionarios generados con códigos anteriores.

Esto permite que varios usuarios hagan commits agregando preguntas sin romper cuestionarios ya compartidos.

## Reglas de la seed

La seed debe ser un número entero entre `1` y `9999`.

Cuando se inicia manualmente, el usuario puede escribir una seed o generar una aleatoria.

Cuando se inicia desde un código, la seed viene incluida en el código y se aplica automáticamente.

## Validaciones principales

La aplicación valida que:

- `preguntas/index.json` exista y sea un arreglo.
- Cada entrada del índice tenga `label` y `path`.
- Cada archivo de preguntas sea un arreglo no vacío.
- Cada pregunta tenga `tipo`, `unidad`, `numero`, `pregunta` y `respuesta`.
- El tipo sea solo `vf`, `alt` o `des`.
- Las preguntas `vf` tengan respuesta booleana.
- Las preguntas `alt` tengan opciones válidas y respuestas como índices existentes.
- Las preguntas `des` tengan respuesta esperada como texto.
- Los códigos pegados correspondan a archivos existentes y límites válidos.

## Estructura recomendada de nombres

No es obligatorio, pero se recomienda mantener nombres consistentes:

```text
preguntas/software-u2-vf.json
preguntas/software-u2-alt.json
preguntas/software-u2-des.json
```

Convención sugerida:

- `software`: ramo o asignatura.
- `u2`: unidad.
- `vf`, `alt`, `des`: tipo de preguntas.

