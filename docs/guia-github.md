# Comandos básicos de GitHub a la hora de trabajar en el repositorio

1. El primer comando siempre será `git status`, para verificar los cambios hechos por los demás y evitar tener problemas de merge incluso en el repositorio local.
2. Si no se han hecho cambios sobre la rama en la que uno está trabajando, es necesario hace `git pull` para tener el repositorio al día y que no haya conflicto a la hora de hacer commit y push.
3. Una vez el trabajo de la sesión hauya terminado, es imperativo hacer `git commit` seguido de `git push`. Este último tiene variaciones según si la rama es exclusiva del repo local y aún no existe en el repositorio remoto.

## ¿Vas a trabajar en una tarea nueva que aún no tiene su rama propia?

### Sí
- `git checkout -b "nombreDeTuRama"`
    
(las comillas no van)

---

### No:

#### Empiezas a trabajar:

1. `git status`

#### ¿Alguien pusheó algo a tu rama de trabajo?

##### Sí
- Ver cómo se solucoina

##### No
2. `git pull`

#### 3. Trabajar de manera normal
Al finalizar el trabajo debes hacer lo siguiente:   
`git commit -m "commit convencional"
git push
`   
(las comillas no van)
## ¿Tu trabajo es de una rama que NO existe en el repositorio remoto?
El push lo debes hacer de la siguiente manera:    
`git push -u origin "nombreDeTuRama"`
(las comillas no van)

---

## Todos los comandos utiles:
- `git status`
- `git log`
- `git log --oneline`
- `git checkout -b rama` | (crea una nueva rama y te cambia a ella)
- `git checkout rama` | (te cambia a una rama ya existente)
- `git add nombre_de_archivo.extension` | (añade tu archivo al stage para ser commiteado)
- `git add .` | (añade TODOS los cambios que refleja el `git status`)
- `git commit -m ""`
- `git push` | (push a una rama ya existente en el repo remoto)
- `git push -u rama` | (pushea una rama completamente nueva al repo remoto)
