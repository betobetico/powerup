// Las 10 lecciones de /powerups. Verificadas el 15-sep-2026 contra la documentación de
// Claude Code 2.1.270 (code.claude.com/docs/en: commands, interactive-mode, desktop,
// checkpointing, memory, sub-agents). Al tocar una, volver a comprobarla allí.

export type Leccion = {
  titulo: string
  // una línea para el menú
  resumen: string
  cuerpo: readonly string[]
  // cómo se hace en la app de escritorio, cuando cambia respecto al terminal
  escritorio?: string
  // texto: lo que Pruébalo escribe en el prompt; nota: la instrucción cuando no hay nada que escribir
  prueba?: { texto?: string; nota?: string }
  consejo?: string
}

export const LECCIONES: readonly Leccion[] = [
  {
    titulo: 'Habla con tu código',
    resumen: '@archivos en el prompt',
    cuerpo: [
      'Escribe @ en cualquier parte del prompt para buscar un archivo y añadirlo al contexto.',
      'Claude lo lee antes de responder: nada de copiar y pegar código.',
      'Puedes mencionar varios archivos en el mismo prompt.',
    ],
    escritorio: '@ autocompleta el nombre (solo en sesiones locales y SSH). El botón + del prompt adjunta además imágenes y PDF.',
    prueba: { texto: 'explícame qué hace @', nota: 'Completa el nombre del archivo tras la @.' },
  },
  {
    titulo: 'Controla con modos',
    resumen: 'Manual, Accept edits, Plan, Auto',
    cuerpo: [
      'Los modos de permiso deciden cuánta autonomía tiene Claude:',
      '· Manual: pide permiso antes de editar o ejecutar.',
      '· Accept edits: acepta las ediciones solo; los comandos siguen pidiendo permiso.',
      '· Plan: planifica sin tocar nada.',
      '· Auto: ejecuta con comprobaciones de seguridad en segundo plano.',
      'En el terminal, Shift+Tab los recorre.',
    ],
    escritorio: 'Selector de modo junto al botón de enviar, o Cmd+Shift+M. Shift+Tab no funciona en la app.',
    prueba: { nota: 'Pulsa Cmd+Shift+M en la app (Shift+Tab en el terminal) y mira cómo cambia el modo.' },
    consejo: 'Plan cuando quieras entender antes de actuar; Accept edits cuando confíes y quieras ir rápido.',
  },
  {
    titulo: 'Deshaz lo que sea',
    resumen: '/rewind y los checkpoints',
    cuerpo: [
      'Claude Code guarda un checkpoint de cada prompt con las ediciones que hizo Claude.',
      '/rewind (también /checkpoint o /undo) abre el menú para volver a un punto anterior:',
      'la conversación, el código o ambos, o resumir desde un mensaje.',
      'En el terminal, Esc Esc con el prompt vacío abre el mismo menú; con texto, lo borra.',
      'Ctrl+_ deshace solo tu última edición del texto del prompt.',
    ],
    escritorio: 'Esc detiene la respuesta de Claude; no abre el rebobinado.',
    prueba: { texto: '/rewind' },
    consejo: 'Los checkpoints se guardan con la sesión: puedes rebobinar incluso después de retomarla.',
  },
  {
    titulo: 'Trabaja en segundo plano',
    resumen: 'Ctrl+B y /tasks',
    cuerpo: [
      'Un comando o un subagente largo no tiene por qué bloquearte.',
      '· Pide a Claude que lo lance en segundo plano.',
      '· En el terminal, Ctrl+B manda al fondo un comando o agente que ya está corriendo.',
      '· /tasks muestra y gestiona lo que corre de fondo en la sesión.',
      'Mientras tanto puedes seguir escribiendo: los mensajes se encolan.',
    ],
    escritorio: 'El panel de tareas (menú Views) muestra subagentes y comandos de fondo; un clic abre su salida o lo detiene.',
    prueba: { texto: 'lanza los tests en segundo plano y avísame cuando terminen' },
  },
  {
    titulo: 'Enseña tus reglas a Claude',
    resumen: 'CLAUDE.md y /memory',
    cuerpo: [
      'CLAUDE.md es donde escribes las reglas; Claude lo lee al empezar cada sesión.',
      '· CLAUDE.md en la raíz del proyecto: reglas de ese proyecto.',
      '· ~/.claude/CLAUDE.md: reglas para todos tus proyectos.',
      '/memory lista y abre esos ficheros y activa o desactiva la memoria automática.',
      'Si le dices «recuerda que…», Claude lo guarda en su memoria automática;',
      'si le dices «añade esto a CLAUDE.md», lo escribe ahí.',
    ],
    escritorio: 'La app y el terminal comparten los mismos CLAUDE.md.',
    prueba: { texto: '/memory' },
  },
  {
    titulo: 'Extiende con herramientas',
    resumen: 'MCP y conectores',
    cuerpo: [
      'MCP conecta a Claude con servicios externos: bases de datos, APIs, navegador, Figma, Notion, Gmail…',
      '/mcp gestiona las conexiones y su autenticación.',
      'Los servidores se configuran en .mcp.json (proyecto) o ~/.claude.json (usuario).',
    ],
    escritorio: 'Botón + del prompt → Connectors para añadirlos con un asistente; se gestionan en Settings → Connectors.',
    prueba: { texto: '¿qué conectores tengo configurados en esta sesión?' },
  },
  {
    titulo: 'Automatiza tu flujo',
    resumen: 'skills y hooks',
    cuerpo: [
      'Skills: instrucciones reutilizables en .claude/skills/<nombre>/SKILL.md.',
      'Claude las carga solo cuando vienen al caso, o las lanzas tú con /nombre.',
      '/skills lista las disponibles.',
      'Hooks: se configuran en settings.json y se disparan con eventos,',
      'por ejemplo pasar el linter después de cada edición.',
    ],
    escritorio: 'Botón + del prompt → Slash commands para explorar skills y comandos. Skills y hooks son los mismos que en el terminal.',
    prueba: { texto: '/skills' },
  },
  {
    titulo: 'Multiplícate',
    resumen: 'subagentes en paralelo',
    cuerpo: [
      'Los subagentes trabajan con su propio contexto y en paralelo.',
      'Claude los usa solo cuando conviene, o se lo pides tú.',
      'Los tuyos se definen en .claude/agents/ o ~/.claude/agents/;',
      'desde la 2.1.198, /agents solo recuerda que se los pidas a Claude o edites esas carpetas.',
    ],
    escritorio: 'Cada subagente aparece en el panel de tareas; un clic abre su salida.',
    prueba: { texto: 'usa subagentes en paralelo para buscar los TODO del proyecto y clasificarlos por prioridad' },
    consejo: 'Delega lo que se puede separar y devuelve un resultado corto; lo que necesita tu contexto, mejor en la sesión principal.',
  },
  {
    titulo: 'Trabaja desde cualquier sitio',
    resumen: 'Remote Control, Dispatch, nube',
    cuerpo: [
      'En el terminal:',
      '· /remote-control (o /rc) deja la sesión disponible desde claude.ai, también en el móvil.',
      '· /desktop pasa la sesión del terminal a la app de escritorio.',
      '· /teleport trae al terminal una sesión de Claude Code en la web.',
    ],
    escritorio: 'Dispatch (pestaña Cowork) recibe tareas desde el móvil y puede abrir sesiones de Code; una sesión local también se puede mandar a la nube para que siga sin tu Mac.',
    prueba: { nota: 'En el terminal, prueba /remote-control y abre la sesión desde el móvil.' },
  },
  {
    titulo: 'Ajusta el modelo',
    resumen: '/model, /effort, /fast',
    cuerpo: [
      '· /model cambia de modelo y lo deja por defecto para las sesiones nuevas.',
      '· /effort fija cuánto razona: de low a xhigh, y max.',
      '· /fast activa o desactiva el modo rápido.',
    ],
    escritorio: 'Desplegable de modelo junto al botón de enviar (Cmd+Shift+I) y menú de esfuerzo (Cmd+Shift+E).',
    prueba: { texto: '/effort' },
    consejo: 'Esfuerzo bajo para preguntas simples, alto para depurar algo difícil.',
  },
]
