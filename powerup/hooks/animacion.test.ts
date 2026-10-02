import { test, expect, mock } from 'claude-code/testing'

// Prueba de la animación de /powerups: monta el Pane en terminal y escritorio, pulsa Siguiente y
// comprueba que las líneas aparecen de una en una y que, con el reloj simulado avanzado, sale la lección entera.
const cuerpo = (n: number) => Array.from({ length: n }, (_, i) => `línea ${i + 1} de la lección`)
const lecciones = [
  { titulo: 'Uno', resumen: 'r1', cuerpo: cuerpo(3) },
  { titulo: 'Dos', resumen: 'r2', cuerpo: cuerpo(5), consejo: 'consejo final' },
]

for (const surface of ['terminal', 'desktop'] as const) {
  test(`animación de Siguiente en ${surface}`, async ($, on) => {
    mock.store(on, { lecciones: { version: 'v-test', lecciones } })
    on('session.start', async (_$, e) => ({ cwd: e.cwd }))
    const reloj = mock.clock(on)
    await $.session.start({ cwd: '/tmp', surface, isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'powerup', surface, component: 'Pane', props: { title: 'Power-ups', focused: false } as never, requestId: 'powerups' })
    // el panel arranca en el menú: abrir la lección 1 y pasar a la 2 con Siguiente
    await ui.press({ key: 'abrir:0' })
    await reloj.advance(1000)
    expect(await ui.find({ text: 'línea 3 de la lección' })).toBeDefined()
    await ui.press({ key: 'siguiente' })
    expect(await ui.find({ text: 'línea 1 de la lección' })).toBeDefined()
    expect(await ui.find({ text: 'línea 5 de la lección' })).toBeUndefined()
    expect(await ui.find({ text: 'consejo final' })).toBeUndefined()
    expect(await ui.find({ text: '[1/5]' })).toBeDefined()
    expect(await ui.find({ key: 'siguiente' })).toBeUndefined() // última lección: ya no hay Siguiente
    await reloj.advance(100)
    expect(await ui.find({ text: 'línea 2 de la lección' })).toBeDefined()
    await reloj.advance(1000)
    expect(await ui.find({ text: 'línea 5 de la lección' })).toBeDefined()
    expect(await ui.find({ text: 'consejo final' })).toBeDefined()
    expect(await ui.find({ text: '[5/5]' })).toBeUndefined()
  })
}

test('un redibujado ajeno a mitad de animación muestra la lección entera', async ($, on) => {
  mock.store(on, { lecciones: { version: 'v-test', lecciones } })
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  const reloj = mock.clock(on)
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ plugin: 'powerup', surface: 'terminal', component: 'Pane', props: { title: 'Power-ups', focused: false } as never, requestId: 'powerups' })
  await ui.press({ key: 'abrir:1' })
  await reloj.advance(100)
  expect(await ui.find({ text: 'línea 5 de la lección' })).toBeUndefined()
  await ui.redraw()
  await ui.redraw()
  expect(await ui.find({ text: 'línea 5 de la lección' })).toBeDefined()
  expect(await ui.find({ text: 'consejo final' })).toBeDefined()
})
