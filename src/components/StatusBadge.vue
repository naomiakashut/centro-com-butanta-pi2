<script setup>
const props = defineProps({ status: { type: String, required: true } })

const labels = {
  pending: 'Cadastrado',
  active: 'Ativado',
  overdue: 'Mensalidade atrasada',
  inactive: 'Desativado',
  approved: 'Aprovado',
  rejected: 'Reprovado',
}
</script>

<template>
  <span class="status-badge" :class="`status-badge--${props.status}`">
    <span class="status-badge__dot"></span>{{ labels[props.status] || props.status }}
  </span>
</template>
