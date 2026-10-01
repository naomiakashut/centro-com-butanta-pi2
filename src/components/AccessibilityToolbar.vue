<script setup>
defineProps({
  fontSize: { type: String, required: true },
  isDarkMode: { type: Boolean, required: true },
})

defineEmits(['set-font-size', 'toggle-theme'])
</script>

<template>
  <aside class="accessibility-bar" aria-label="Ferramentas de acessibilidade">
    <div class="container accessibility-bar__content">
      <span class="accessibility-bar__context">Centro Comunitário · Butantã</span>
      <div class="accessibility-tools">
        <span class="accessibility-tools__label">Tamanho do texto</span>
        <div class="btn-group btn-group-sm" role="group" aria-label="Alterar tamanho do texto">
          <button
            class="btn accessibility-button"
            :class="{ active: fontSize === 'small' }"
            type="button"
            aria-label="Diminuir tamanho do texto"
            :aria-pressed="fontSize === 'small'"
            @click="$emit('set-font-size', 'small')"
          >
            A−
          </button>
          <button
            class="btn accessibility-button"
            :class="{ active: fontSize === 'default' }"
            type="button"
            aria-label="Restaurar tamanho padrão do texto"
            :aria-pressed="fontSize === 'default'"
            @click="$emit('set-font-size', 'default')"
          >
            A
          </button>
          <button
            class="btn accessibility-button"
            :class="{ active: fontSize === 'large' }"
            type="button"
            aria-label="Aumentar tamanho do texto"
            :aria-pressed="fontSize === 'large'"
            @click="$emit('set-font-size', 'large')"
          >
            A+
          </button>
        </div>
        <span class="accessibility-tools__divider" aria-hidden="true"></span>
        <button
          class="btn accessibility-button accessibility-button--theme"
          type="button"
          :aria-label="isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'"
          :title="isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'"
          :aria-pressed="isDarkMode"
          @click="$emit('toggle-theme')"
        >
          <svg v-if="isDarkMode" aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" />
            <path
              d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"
            />
          </svg>
          <svg v-else aria-hidden="true" viewBox="0 0 24 24">
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
          </svg>
          <span>{{ isDarkMode ? 'Modo claro' : 'Modo escuro' }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>
