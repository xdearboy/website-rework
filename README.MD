# xdearboy — personal site

personal portfolio, blog and donate page.

---

## stack

**frontend**
- [Vite 5](https://vitejs.dev/) — build tool
- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [React Router v6](https://reactrouter.com/) — client-side routing
- [Tailwind CSS v4](https://tailwindcss.com/) — styling
- [shadcn/ui](https://ui.shadcn.com/) — ui components

**content**
- markdown files in `content/blog/`
- custom vite plugin generates static JSON manifest at build time — no server needed

**infra**
- [Docker](https://www.docker.com/) — multi-stage build (node → nginx:alpine)
- [k3s](https://k3s.io/) — lightweight kubernetes
- [HAProxy Ingress](https://haproxy-ingress.github.io/) — ingress controller
- [cert-manager](https://cert-manager.io/) — automatic TLS via Let's Encrypt
- [HPA](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) — autoscaling 2–10 pods

**ci/cd**
- [GitHub Actions](https://github.com/features/actions) — self-hosted runner on k3s node
- [ghcr.io](https://ghcr.io) — container registry

---

## dev

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build
npm test          # run tests
```

## deploy

push to `main` → GitHub Actions builds docker image → pushes to ghcr.io → deploys to k3s cluster.
