# Ejemplo Formato para pregunta Verdadero - Falso
```json
{
    "ramo": "software",
    "unidad": 2,
    "tipo": "vf",
    "numero": 1,
    "pregunta": "¿pregunta vf?",
    "respuesta": true,
    "justificacion": "lorem ipsum lorem ipsum"
}
```

# Ejemplo Formato para pregunta alternativas
```json
{
    "ramo": "software",
    "unidad": 2,
    "tipo": "alt",
    "numero": 1,
    "pregunta": "¿pregunta alternativa?",
    "opciones": ["aaa", "bbb", "ccc", "ddd"],
    "ningunaCorrecta": false,
    "respuesta": [0, 3],
    "justificacion": "lorem ipsum lorem ipsum"
}
```

# Ejemplo Formato para pregunta desarrollo
```json
{
    "ramo": "software",
    "unidad": 2,
    "tipo": "des",
    "numero": 1,
    "pregunta": "¿pregunta desarrollo?",
    "respuesta": "lorem ipsum"
}
```


contexto: estoy diseñando una pagina en github pages para simular pruebas, varios pueden agregar preguntas por medio de commit, existe un html+css+js
vf deben ser con justificacion
alternativas pueden ser correctas 0 o 1 o ... n
desarrollo debe tener texto de respuesta esperada
dificultad varia de 1-5
no se agregara el campo tema porque son muchos y complicaria la gestion

evalua e indicame si hay algo que corregir en los json