# powerup

`/powerups`: las lecciones de Claude Code en un panel con botones, en el terminal y en la app de escritorio. Es un *mod* de function hooks: responde a cada clic sin pasar por el modelo, así que no gasta tokens.

## Requisitos

- Claude Code 2.1.284 o posterior.
- Function hooks activados. En `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1"
  }
}
```

## Instalación

Dentro de Claude Code:

```
/plugin marketplace add betobetico/powerup
/plugin install powerup@powerup
```

O desde el terminal:

```bash
claude plugin marketplace add betobetico/powerup
claude plugin install powerup@powerup
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

El progreso se guarda entre sesiones. El comando se registra al arrancar la sesión, así que en la app de escritorio no aparece en el menú de autocompletado: escríbelo entero y envíalo.

## Probarlo sin instalar

```bash
claude --plugin-dir ./powerup
```
