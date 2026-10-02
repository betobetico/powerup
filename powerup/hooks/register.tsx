/* @jsx h */
import type { Hook, Register } from 'claude-code'

// el `$` que recibe cualquier hook; sirve para pasarlo a una función de primer nivel
type Motor = Parameters<Hook<'session.start'>>[0]

// /powerups: las lecciones de Claude Code en un panel con botones, sin pasar por el modelo.
// Menú → lección → Pruébalo (escribe el ejemplo en el prompt), Anterior, Siguiente, Menú, Cerrar.
//
// Desde la 0.2 las lecciones no van en el plugin: se descargan de powerup-api con la clave de acceso
// que el usuario guarda en la opción `clave` (sensible, va al almacén seguro). La última copia buena
// se guarda en $.store, así que sin red se sigue leyendo; si la versión del servidor cambia, un toast
// avisa de que hay lecciones nuevas. Sin clave, o con clave dada de baja, el comando lo explica.
// Las lecciones vistas se guardan en $.store y llevan ✓ en el menú. Donde no hay panel (el móvil),
// el comando devuelve el menú o la lección como texto.
//
// Nunca llamar `h` a una variable local: cada etiqueta JSX compila a una llamada a `h`.
// Solo props que declara el claude-code.d.ts de /plugin-types: una prop que la build no conoce
// invalida el árbol y el panel se queda vacío sin avisar (el motivo va al log de --debug).

export type Leccion = {
  titulo: string
  resumen: string
  cuerpo: readonly string[]
  escritorio?: string
  prueba?: { texto?: string; nota?: string }
  consejo?: string
}

const PLUGIN = 'powerup'
const COMANDO = 'powerups'
const PANEL = 'powerups'
const SERVIDOR_DEFECTO = 'https://powerup-api.a-be5.workers.dev'
const CONTACTO = 'a@g8.ventures'

type Vista = 'menu' | 'fin' | number
type Estado = 'cargando' | 'ok' | 'sin-clave' | 'clave-invalida' | 'sin-conexion'

// dónde está el panel; se conserva al cerrarlo, así /powerups vuelve donde lo dejaste
let vista: Vista = 'menu'
let vistas = new Set<number>()
let lecciones: Leccion[] = []
let version = ''
let estado: Estado = 'cargando'
let carga: Promise<void> | null = null

const total = () => lecciones.length
const esLista = (v: unknown): v is number[] => Array.isArray(v) && v.every(n => typeof n === 'number')
const esLeccion = (v: unknown): v is Leccion =>
  typeof v === 'object' && v !== null && typeof (v as Leccion).titulo === 'string' && typeof (v as Leccion).resumen === 'string' && Array.isArray((v as Leccion).cuerpo)
const esLecciones = (v: unknown): v is Leccion[] => Array.isArray(v) && v.length > 0 && v.every(esLeccion)

const aviso = (): string => {
  switch (estado) {
    case 'sin-clave':
      return [
        '**Power-ups necesita una clave de acceso.**',
        '',
        `Pídesela a Alberto (${CONTACTO}) y guárdala con \`/plugin configure powerup@powerup\` (campo «Clave de acceso»),`,
        `o desde el terminal: \`claude plugin install powerup@powerup --config clave=TU_CLAVE\`.`,
      ].join('\n')
    case 'clave-invalida':
      return `**La clave de acceso de Power-ups no es válida o se dio de baja.** Pide una nueva a Alberto (${CONTACTO}).`
    case 'sin-conexion':
      return '**No se pudieron descargar las lecciones y no hay copia guardada.** Comprueba la conexión y abre otra sesión.'
    case 'cargando':
      return 'Power-ups está descargando las lecciones; vuelve a escribir /powerups en un momento.'
    default:
      return ''
  }
}

const menuTexto = () =>
  [
    '**POWER-UPS · Claude Code**',
    '',
    ...lecciones.map((l, i) => `${vistas.has(i) ? '✓' : '·'} ${i + 1}. **${l.titulo}** — ${l.resumen}`),
    '',
    `${vistas.size}/${total()} vistas · /${COMANDO} <número> abre una lección${version ? ` · lecciones del ${version}` : ''}`,
  ].join('\n')

const leccionTexto = (i: number) => {
  const l = lecciones[i]
  if (!l) return menuTexto()
  return [
    `**[${i + 1}/${total()}] ${l.titulo.toUpperCase()}**`,
    '',
    ...l.cuerpo,
    ...(l.escritorio ? ['', `En la app de escritorio: ${l.escritorio}`] : []),
    ...(l.prueba ? ['', `PRUÉBALO: ${l.prueba.texto ? `\`${l.prueba.texto}\`` : ''}${l.prueba.nota ? ` ${l.prueba.nota}` : ''}`] : []),
    ...(l.consejo ? ['', `Consejo: ${l.consejo}`] : []),
    '',
    `_${i + 1 < total() ? `Siguiente: /${COMANDO} ${i + 2} · ` : ''}Menú: /${COMANDO}_`,
  ].join('\n')
}

// Descarga las lecciones. Nunca lanza: deja `estado` y, si hay copia guardada, la mantiene.
async function cargar($: Motor, clave: string, servidor: string): Promise<void> {
  if (!clave) {
    estado = lecciones.length ? 'ok' : 'sin-clave'
    return
  }
  try {
    const r = await $.http.fetch(`${servidor}/lecciones`, {
      headers: { authorization: `Bearer ${clave}`, accept: 'application/json', ...(version ? { 'if-none-match': `"${version}"` } : {}) },
    })
    if (r.status === 304) {
      estado = lecciones.length ? 'ok' : 'sin-conexion'
      return
    }
    if (r.status === 401) {
      // la clave dejó de valer: la copia guardada deja de servirse
      lecciones = []
      version = ''
      estado = 'clave-invalida'
      return
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const cuerpo = JSON.parse(r.text) as { version?: unknown; lecciones?: unknown }
    if (!esLecciones(cuerpo.lecciones) || typeof cuerpo.version !== 'string') throw new Error('respuesta sin lecciones')
    const habiaVersion = version
    lecciones = cuerpo.lecciones
    version = cuerpo.version
    estado = 'ok'
    vistas = new Set([...vistas].filter(n => n < total()))
    await $.store.set('lecciones', { version, lecciones }).catch((err: unknown) => $.ui.log(`${PLUGIN}: no se pudo guardar la copia: ${err}`))
    if (habiaVersion && habiaVersion !== version) $.ui.toast(`Power-ups: lecciones nuevas (${version}). Escribe /${COMANDO}`)
    $.ui.invalidate('ui.render')
  } catch (err) {
    $.ui.log(`${PLUGIN}: no se pudieron descargar las lecciones: ${err}`)
    estado = lecciones.length ? 'ok' : 'sin-conexion'
  }
}

export const register: Register = (on, options) => {
  const clave = typeof options.clave === 'string' ? options.clave.trim() : ''
  const servidor = (typeof options.servidor === 'string' && options.servidor.trim() ? options.servidor.trim() : SERVIDOR_DEFECTO).replace(/\/+$/, '')

  on('session.start', async ($, e, next) => {
    const r = await next(e)
    // un store ilegible cuesta el progreso o la copia, nunca el panel
    const guardadas = await $.store.get('vistas').catch(err => {
      $.ui.log(`${PLUGIN}: no se pudo leer el progreso: ${err}`)
      return undefined
    })
    if (esLista(guardadas)) vistas = new Set(guardadas.filter(n => n >= 0))
    const copia = (await $.store.get('lecciones').catch(() => undefined)) as { version?: unknown; lecciones?: unknown } | undefined
    if (copia && esLecciones(copia.lecciones) && typeof copia.version === 'string') {
      lecciones = copia.lecciones
      version = copia.version
    }
    carga = cargar($, clave, servidor)

    // si otro /powerups ya existe, este plugin se queda quieto en vez de pisarlo
    const comandos = await $.command.list().catch(() => [])
    if (comandos.some(c => c.name === COMANDO && c.plugin !== PLUGIN)) {
      $.ui.log(`${PLUGIN}: /${COMANDO} ya existe; el plugin no lo registra`)
      return r
    }
    await $.command
      .register({
        name: COMANDO,
        description: 'Lecciones de Claude Code en un panel con botones (powerup)',
        argumentHint: '[número | lista | panel | reiniciar | cerrar]',
        immediate: true,
      })
      .catch(err => $.ui.log(`${PLUGIN}: /${COMANDO} no registrado: ${err}`))
    return r
  })

  on('command.run', { command: COMANDO }, async ($, e) => {
    if (carga) await carga
    if (estado !== 'ok') return { text: aviso() }
    const arg = e.args.trim().toLowerCase()
    if (arg === 'lista') return { text: menuTexto() }
    if (arg === 'reiniciar') {
      vistas = new Set()
      vista = 'menu'
      await $.store.set('vistas', []).catch(err => $.ui.log(`${PLUGIN}: no se pudo guardar el progreso: ${err}`))
      $.ui.invalidate('ui.render')
      return { text: 'Progreso de power-ups reiniciado.' }
    }
    if (arg === 'cerrar') {
      await $.ui.close({ id: PANEL }).catch(() => undefined)
      return { text: 'Power-ups cerrado.' }
    }
    // `panel` abre el panel aunque la sesión no anuncie dónde dibujar: prueba si la app lo pinta igualmente
    const forzar = arg === 'panel'
    const n = Number(arg)
    if (arg !== '' && !forzar && !(Number.isInteger(n) && n >= 1 && n <= total())) {
      return { text: `No entiendo «${arg}». Usa /${COMANDO}, /${COMANDO} 1-${total()}, /${COMANDO} lista o /${COMANDO} reiniciar.` }
    }
    if (arg !== '' && !forzar) {
      vista = n - 1
      vistas.add(n - 1)
      await $.store.set('vistas', [...vistas]).catch(err => $.ui.log(`${PLUGIN}: no se pudo guardar el progreso: ${err}`))
    }

    // sin terminal ni escritorio (el móvil, o -p) no hay panel: la respuesta va como texto
    const superficies = await $.session.surfaces().catch(() => [])
    if (!forzar && !superficies.some(s => s !== 'mobile')) {
      // la app de escritorio no se anuncia como pantalla de dibujo (comprobado el 30-sep-2026 con la
      // 2.16120.0 y Claude Code 2.1.284), así que allí el mod vive en texto; `/powerups panel` es la sonda
      return { text: typeof vista === 'number' ? leccionTexto(vista) : menuTexto() }
    }
    await $.ui.open({ id: PANEL, title: 'Power-ups', focus: true })
    $.ui.invalidate('ui.render')
    const dónde = superficies.length ? superficies.join(', ') : 'ninguna'
    return { text: `Power-ups abierto (superficies: ${dónde}) · el botón Cerrar lo cierra · /${COMANDO} vuelve donde lo dejaste` }
  })

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (e.requestId !== PANEL || e.surface === 'mobile') return next(e)
    const { Box, Text, Button } = await $.ui.resolve(e)
    const cerrar = () => void $.ui.close({ id: PANEL }).catch(() => undefined)

    if (estado !== 'ok') {
      return (
        <Box flexDirection="column" paddingX={1}>
          <Text bold>POWER-UPS · Claude Code</Text>
          <Box marginTop={1}>
            <Text>{aviso().replace(/\*\*/g, '')}</Text>
          </Box>
          <Box flexDirection="row" columnGap={1} marginTop={1}>
            <Button key="cerrar" label="Cerrar" onPress={cerrar} />
          </Box>
        </Box>
      )
    }

    const ir = (destino: Vista) => {
      vista = destino
      if (typeof destino === 'number' && !vistas.has(destino)) {
        vistas.add(destino)
        void $.store.set('vistas', [...vistas]).catch(err => $.ui.log(`${PLUGIN}: no se pudo guardar el progreso: ${err}`))
      }
      $.ui.invalidate('ui.render')
    }
    // el panel se cierra primero: mientras tiene el teclado, el prompt no acepta el borrador
    const probar = async (texto: string) => {
      await $.ui.close({ id: PANEL }).catch(() => undefined)
      const r = await $.prompt.fill({ text: texto }).catch(() => undefined)
      if (!r?.isFilled) $.ui.toast(`Escribe en el prompt: ${texto}`)
    }

    if (vista === 'menu') {
      return (
        <Box flexDirection="column" paddingX={1}>
          <Text bold>POWER-UPS · Claude Code</Text>
          <Text dimColor>Cada power-up enseña una función que casi nadie usa. Elige una, léela, pruébala.</Text>
          <Box flexDirection="column" marginTop={1}>
            {lecciones.map((l, i) => (
              <Box key={`fila:${i}`} flexDirection="row" columnGap={1}>
                <Text color="green">{vistas.has(i) ? '✓' : ' '}</Text>
                <Button key={`abrir:${i}`} label={`${i + 1}. ${l.titulo}`} onPress={() => ir(i)} />
                <Text dimColor wrap="truncate-end">{l.resumen}</Text>
              </Box>
            ))}
          </Box>
          <Box flexDirection="row" columnGap={1} marginTop={1}>
            <Text dimColor>{`${vistas.size}/${total()} vistas · lecciones del ${version}`}</Text>
            {vistas.size > 0 ? (
              <Button
                key="reiniciar"
                label="Reiniciar progreso"
                onPress={() => {
                  vistas = new Set()
                  void $.store.set('vistas', []).catch(err => $.ui.log(`${PLUGIN}: no se pudo guardar el progreso: ${err}`))
                  $.ui.invalidate('ui.render')
                }}
              />
            ) : null}
            <Button key="cerrar" label="Cerrar" onPress={cerrar} />
          </Box>
        </Box>
      )
    }

    if (vista === 'fin') {
      return (
        <Box flexDirection="column" paddingX={1}>
          <Text bold>TODAS LAS POWER-UPS COMPLETADAS</Text>
          <Text>Ahora ve y construye algo.</Text>
          <Box flexDirection="row" columnGap={1} marginTop={1}>
            <Button key="menu" label="Menú" onPress={() => ir('menu')} />
            <Button key="cerrar" label="Cerrar" onPress={cerrar} />
          </Box>
        </Box>
      )
    }

    const i = vista
    const l = lecciones[i]
    if (!l) {
      vista = 'menu'
      return next(e)
    }
    const texto = l.prueba?.texto
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text bold>{`[${i + 1}/${total()}] ${l.titulo.toUpperCase()}`}</Text>
        <Box flexDirection="column" marginTop={1}>
          {l.cuerpo.map(linea => (
            <Text>{linea}</Text>
          ))}
        </Box>
        {l.escritorio ? (
          <Box marginTop={1}>
            <Text italic>{`En la app de escritorio: ${l.escritorio}`}</Text>
          </Box>
        ) : null}
        {l.prueba ? (
          <Box flexDirection="column" marginTop={1}>
            <Text bold>PRUÉBALO</Text>
            {texto ? <Text color="cyan">{`> ${texto}`}</Text> : null}
            {l.prueba.nota ? <Text>{l.prueba.nota}</Text> : null}
          </Box>
        ) : null}
        {l.consejo ? (
          <Box marginTop={1}>
            <Text dimColor>{`Consejo: ${l.consejo}`}</Text>
          </Box>
        ) : null}
        <Box flexDirection="row" flexWrap="wrap" columnGap={1} marginTop={1}>
          {texto ? <Button key="probar" label="Pruébalo" onPress={() => void probar(texto)} /> : null}
          {i > 0 ? <Button key="anterior" label="← Anterior" onPress={() => ir(i - 1)} /> : null}
          {i < total() - 1 ? (
            <Button key="siguiente" label="Siguiente →" onPress={() => ir(i + 1)} />
          ) : (
            <Button key="fin" label="Terminar" onPress={() => ir('fin')} />
          )}
          <Button key="menu" label="Menú" onPress={() => ir('menu')} />
          <Button key="cerrar" label="Cerrar" onPress={cerrar} />
        </Box>
      </Box>
    )
  })
}
