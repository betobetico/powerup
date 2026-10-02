# powerup

`/powerups`: las lecciones de Claude Code en un panel con botones, en el terminal y en la app de escritorio. Es un *mod* de function hooks: responde a cada clic sin pasar por el modelo, así que no gasta tokens.

Las lecciones no van dentro del plugin: se descargan con tu **clave de acceso** y se renuevan cada semana. Al abrir una sesión con lecciones nuevas, el plugin avisa con un toast.

## Requisitos

- Claude Code 2.1.284 o posterior. Los mods vienen activados; no hace falta ninguna variable de entorno.
- Una clave de acceso. Pídesela a Alberto (a@g8.ventures).

## Instalación

Dentro de Claude Code:

```
/plugin marketplace add betobetico/powerup
/plugin install powerup@powerup
/plugin configure powerup@powerup
```

y pega la clave en «Clave de acceso» (se guarda en el almacén seguro del sistema, no en `settings.json`).

O desde el terminal, todo en uno:

```bash
claude plugin marketplace add betobetico/powerup
claude plugin install powerup@powerup --config clave=TU_CLAVE
```

Reinicia la sesión y escribe `/powerups`.

## Uso

| Comando | Qué hace |
|---|---|
| `/powerups` | Abre el panel con el menú de lecciones |
| `/powerups 3` | Abre la lección 3 |
| `/powerups lista` | El menú como texto (útil en el móvil) |
| `/powerups reiniciar` | Borra el progreso |
| `/powerups cerrar` | Cierra el panel |

El progreso y la última copia de las lecciones se guardan entre sesiones: sin red, sigues leyendo la copia. El comando se registra al arrancar la sesión, así que en la app de escritorio no aparece en el menú de autocompletado: escríbelo entero y envíalo.

## Probarlo sin instalar

```bash
claude --plugin-dir ./powerup
```
