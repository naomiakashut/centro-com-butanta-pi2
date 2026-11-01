import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PaymentStatusForm from '@/components/PaymentStatusForm.vue'

describe('registro de pagamento ou atraso', () => {
  it('exige data válida e envia somente a data, sem horário', async () => {
    const wrapper = mount(PaymentStatusForm)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Informe uma data válida')
    expect(wrapper.emitted('submit')).toBeUndefined()
    const date = wrapper.get('input:not([type="checkbox"])')
    await date.setValue('31022026')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    await date.setValue('01112026')
    expect(date.element.value).toBe('01/11/2026')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')[0]).toEqual([{ atraso: false, data_pagamento: '2026-11-01' }])
  })
  it('desabilita a data ao marcar atraso e não envia uma data antiga', async () => {
    const wrapper = mount(PaymentStatusForm)
    const date = wrapper.get('input:not([type="checkbox"])')
    await date.setValue('01112026')
    await wrapper.get('input[type="checkbox"]').setValue(true)
    expect(date.element.disabled).toBe(true)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')[0]).toEqual([{ atraso: true, data_pagamento: null }])
    await wrapper.get('input[type="checkbox"]').setValue(false)
    expect(date.element.disabled).toBe(false)
  })
  it('preenche o checkbox conforme a situação atual e bloqueia reenvio enquanto salva', async () => {
    const wrapper = mount(PaymentStatusForm, { props: { overdue: true } })
    expect(wrapper.get('input[type="checkbox"]').element.checked).toBe(true)
    await wrapper.setProps({ busy: true })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.get('button').element.disabled).toBe(true)
  })
})
