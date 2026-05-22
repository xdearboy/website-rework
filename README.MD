# xdearboy — personal site

personal portfolio, blog, donate page, and photo gallery.

---

## stack

**frontend**
- [Vite 5](https://vitejs.dev/) — build tool
- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [React Router v6](https://reactrouter.com/) — client-side routing
- [Tailwind CSS v4](https://tailwindcss.com/) — styling
- [shadcn/ui](https://ui.shadcn.com/) — ui components

**backend**
- [Elysia](https://elysiajs.com/) — TypeScript API framework
- [exifr](https://github.com/MikeKovarik/exifr) — EXIF data extraction
- [sharp](https://sharp.pixelplumbing.com/) — image thumbnail generation (WebP)

**content**
- markdown files in `content/blog/`
- custom vite plugin generates static JSON manifest at build time
- photos in `public/photos/` with automatic EXIF parsing and thumbnail generation

**storage**
- [Git LFS](https://git-lfs.com/) — stores large image files
- local filesystem for photos and thumbnails (synced via LFS)

**infra**
- [Docker](https://www.docker.com/) — multi-stage build with Bun
- [Bun](https://bun.sh/) — runtime for both backend and bundling
- [nginx](https://nginx.org/) — reverse proxy (frontend + API routing)
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
bun install
bun run dev       # http://localhost:5173 (frontend + API proxy)
bun run build     # production build → dist/
```

**frontend** runs on :5173 (Vite)
**backend** API runs on :3000 (Elysia) — proxied to /api in dev

## gallery

photo gallery with:
- hierarchical folder organization
- automatic EXIF data extraction (ISO, shutter speed, aperture, focal length, camera, date, etc.)
- on-demand WebP thumbnail generation (300px)
- high-quality image viewer with zoom (Shift+scroll) and pan
- keyboard navigation (arrow keys, Escape)

photos stored in `public/photos/` tracked via Git LFS.

## deploy

push to `main` → GitHub Actions builds docker image → pushes to ghcr.io → deploys to k3s cluster.

container runs both nginx (frontend proxy) and Elysia backend on port 80/443.

### kubernetes setup

photos and thumbnails need persistent storage across pod restarts:

```bash
# create persistent volumes for photos and thumbnails
kubectl apply -f k8s/pvc.yaml

# deploy app
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

**storage requirements:**
- `portfolio-photos-pvc`: 50Gi (original photos from Git LFS)
- `portfolio-thumbs-pvc`: 10Gi (generated WebP thumbnails)

storage provider must support `ReadWriteMany` (NFS, local path provisioner, etc.)
