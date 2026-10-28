import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '@/App.vue'

let values
let wrapper
beforeEach(() => {
  values = {}
  vi.stubGlobal('localStorage', { getItem: (key) => values[key] ?? null, setItem: (key, value) => { values[key] = value } })
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
})
afterEach(() => {
  wrapper?.unmount()
  delete document.documentElement.dataset.fontSize
  delete document.documentElement.dataset.theme
  vi.unstubAllGlobals()
})
function render() {
  wrapper = mount(App, { global: { stubs: { RouterView: true } } })
}
describe('preferências de acessibilidade', () => {
  it('ajusta, restaura e persiste o tamanho do texto', async () => {
    render()
    await wrapper.get('[aria-label="Aumentar tamanho do texto"]').trigger('click')
    expect(document.documentElement.dataset.fontSize).toBe('large')
    expect(values['centro-font-size']).toBe('large')
    expect(wrapper.get('[aria-label="Aumentar tamanho do texto"]').attributes('aria-pressed')).toBe('true')
    await wrapper.get('[aria-label="Diminuir tamanho do texto"]').trigger('click')
    expect(document.documentElement.dataset.fontSize).toBe('small')
    await wrapper.get('[aria-label="Restaurar tamanho padrão do texto"]').trigger('click')
    expect(document.documentElement.dataset.fontSize).toBe('default')
  })
  it('alterna e persiste os temas escuro e claro', async () => {
    render()
    await wrapper.get('[aria-label="Ativar modo escuro"]').trigger('click')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(values['centro-theme']).toBe('dark')
    await wrapper.get('[aria-label="Ativar modo claro"]').trigger('click')
    expect(document.documentElement.dataset.theme).toBe('light')
  })
  it('restaura as preferências salvas ao abrir o app', () => {
    values['centro-font-size'] = 'large'
    values['centro-theme'] = 'dark'
    render()
    expect(document.documentElement.dataset.fontSize).toBe('large')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
