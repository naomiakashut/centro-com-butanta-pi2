import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { useResidentsStore } from '@/stores/residents'

let wrapper
beforeEach(() => {
  const values = { 'ccb-access-token': 'test-token', 'ccb-auth': 'true' }
  vi.stubGlobal('sessionStorage', {
    getItem: (key) => values[key] ?? null,
    removeItem: (key) => { delete values[key] },
  })
  vi.stubGlobal('fetch', vi.fn())
})
afterEach(() => {
  wrapper?.unmount()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function render() {
  const pinia = createPinia()
  const store = useResidentsStore(pinia)
  store.residents = [{ id: 1, name: 'Morador preservado' }]
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/app', name: 'dashboard', component: { template: '<div>Painel</div>' } },
      { path: '/app/moradores', component: { template: '<div>Moradores</div>' } },
      { path: '/app/cadastro', component: { template: '<div>Cadastro</div>' } },
      { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    ],
  })
  await router.push('/app')
  wrapper = mount(AppShell, { global: { plugins: [pinia, router] } })
  return { store, router }
}

describe('saída do painel', () => {
  it('encerra a sessão e redireciona sem depender do evento global ou excluir registros', async () => {
    const { store, router } = await render()
    vi.spyOn(window, 'dispatchEvent').mockReturnValue(true)
    await wrapper.get('button[aria-label="Sair"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('login')
    expect(sessionStorage.getItem('ccb-access-token')).toBeNull()
    expect(store.residents).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('abre o login por recarga quando a navegação da SPA falha', async () => {
    const { store, router } = await render()
    const originalWindow = window
    const fallback = vi.fn()
    const windowWithFallback = Object.create(originalWindow)
    Object.defineProperty(windowWithFallback, 'location', { value: { replace: fallback } })
    windowWithFallback.removeEventListener = originalWindow.removeEventListener.bind(originalWindow)
    vi.stubGlobal('window', windowWithFallback)
    vi.spyOn(router, 'replace').mockRejectedValue(new Error('Falha ao carregar a tela de login'))
    await wrapper.get('button[aria-label="Sair"]').trigger('click')
    await flushPromises()
    expect(fallback).toHaveBeenCalledWith('/login')
    expect(sessionStorage.getItem('ccb-access-token')).toBeNull()
    expect(store.residents).toHaveLength(1)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('mantém os dados na tela até concluir o redirecionamento', async () => {
    const { store, router } = await render()
    let finish
    vi.spyOn(router, 'replace').mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    await wrapper.get('button[aria-label="Sair"]').trigger('click')
    expect(store.residents).toHaveLength(1)
    // Encerra a navegação pendente para permitir a limpeza do componente.
    await router.push('/login')
    finish()
    await flushPromises()
    expect(store.residents).toEqual([])
  })
})
