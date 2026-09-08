<script setup lang="ts">
const props = defineProps<{
  eyebrow: string
  title: string
  lastUpdated: string
  sections: { title: string, body: string }[]
}>()

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita acentos (é -> e)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const tocItems = computed(() => props.sections.map(s => ({ title: s.title, id: slugify(s.title) })))
</script>

<template>
  <div class="legal-page">
    <header class="legal-page__header">
      <p class="legal-page__eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p class="legal-page__updated">Última actualización: {{ lastUpdated }}</p>
    </header>

    <details class="legal-page__toc-mobile">
      <summary>Índice de contenidos</summary>
      <nav>
        <a v-for="item in tocItems" :key="item.id" :href="`#${item.id}`">{{ item.title }}</a>
      </nav>
    </details>

    <div class="legal-page__layout">
      <nav class="legal-page__toc" aria-label="Índice de contenidos">
        <p class="legal-page__toc-title">En esta página</p>
        <a v-for="item in tocItems" :key="item.id" :href="`#${item.id}`">{{ item.title }}</a>
      </nav>

      <div class="legal-page__body">
        <section
          v-for="(section, i) in sections"
          :id="tocItems[i]!.id"
          :key="section.title"
          class="legal-page__section"
        >
          <h2>{{ section.title }}</h2>
          <p>{{ section.body }}</p>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.legal-page {
  max-width: 980px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
  scroll-behavior: smooth;
}
.legal-page__header {
  text-align: center;
  margin-bottom: 1.75rem;
}
.legal-page__eyebrow {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.4rem;
}
.legal-page__header h1 {
  font-size: 1.9rem;
}
.legal-page__updated {
  color: var(--color-ink-muted);
  font-size: 0.85rem;
  margin: 0.6rem 0 0;
}

.legal-page__toc-mobile {
  display: none;
  margin-bottom: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 0.9rem 1.1rem;
}
.legal-page__toc-mobile summary {
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}
.legal-page__toc-mobile nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.8rem;
}
.legal-page__toc-mobile a {
  font-size: 0.85rem;
  color: var(--color-ink-muted);
  text-decoration: none;
}
.legal-page__toc-mobile a:hover {
  color: var(--color-accent);
}

.legal-page__layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 2rem;
  align-items: start;
}
.legal-page__toc {
  position: sticky;
  top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.legal-page__toc-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-ink-faint);
  margin: 0 0 0.3rem;
}
.legal-page__toc a {
  font-size: 0.85rem;
  color: var(--color-ink-muted);
  text-decoration: none;
  line-height: 1.4;
}
.legal-page__toc a:hover {
  color: var(--color-accent);
}

.legal-page__body {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 2rem 2.25rem;
  box-shadow: var(--shadow-card);
  min-width: 0;
}
.legal-page__section {
  scroll-margin-top: 1.5rem;
}
.legal-page__section h2 {
  font-size: 1.05rem;
  margin-bottom: 0.5rem;
}
.legal-page__section p {
  color: var(--color-ink-muted);
  font-size: 0.92rem;
  margin: 0;
}

@media (max-width: 860px) {
  .legal-page__toc {
    display: none;
  }
  .legal-page__toc-mobile {
    display: block;
  }
  .legal-page__layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .legal-page__body {
    padding: 1.5rem;
  }
}
</style>
