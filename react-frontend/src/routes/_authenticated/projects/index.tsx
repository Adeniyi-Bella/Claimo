import Projects from '@/pages/projects'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/projects/')({
  head: () => ({ meta: [{ title: "Projects — Claimo" }] }),
  component: Projects,
})
