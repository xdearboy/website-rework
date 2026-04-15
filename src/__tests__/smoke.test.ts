import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Smoke tests — build artifacts', () => {
  it('dist/index.html exists after build', () => {
    expect(fs.existsSync(path.resolve('dist/index.html'))).toBe(true)
  })

  it('dist/assets/ contains hashed JS and CSS files', () => {
    const assetsDir = path.resolve('dist/assets')
    expect(fs.existsSync(assetsDir)).toBe(true)
    const files = fs.readdirSync(assetsDir)
    const jsFiles = files.filter((f) => f.endsWith('.js') && /-[\w]{6,}\.js$/.test(f))
    const cssFiles = files.filter((f) => f.endsWith('.css') && /-[\w]{6,}\.css$/.test(f))
    expect(jsFiles.length).toBeGreaterThan(0)
    expect(cssFiles.length).toBeGreaterThan(0)
  })

  it('public/blog-manifest.json is valid JSON with posts array', () => {
    const manifestPath = path.resolve('public/blog-manifest.json')
    expect(fs.existsSync(manifestPath)).toBe(true)
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    expect(Array.isArray(manifest.posts)).toBe(true)
  })

  it('nginx.conf contains try_files and Cache-Control', () => {
    const nginxConf = fs.readFileSync(path.resolve('nginx.conf'), 'utf8')
    expect(nginxConf).toContain('try_files')
    expect(nginxConf).toContain('Cache-Control')
  })

  it('Dockerfile uses multi-stage build', () => {
    const dockerfile = fs.readFileSync(path.resolve('Dockerfile'), 'utf8')
    expect(dockerfile).toContain('AS builder')
    expect(dockerfile).toContain('AS runner')
    expect(dockerfile).toContain('nginx:alpine')
  })

  it('k8s manifests exist', () => {
    expect(fs.existsSync(path.resolve('k8s/deployment.yaml'))).toBe(true)
    expect(fs.existsSync(path.resolve('k8s/service.yaml'))).toBe(true)
    expect(fs.existsSync(path.resolve('k8s/ingress.yaml'))).toBe(true)
    expect(fs.existsSync(path.resolve('k8s/hpa.yaml'))).toBe(true)
  })

  it('ingress.yaml uses haproxy ingressClassName', () => {
    const ingress = fs.readFileSync(path.resolve('k8s/ingress.yaml'), 'utf8')
    expect(ingress).toContain('ingressClassName: haproxy')
    expect(ingress).toContain('haproxy.org/ssl-redirect')
  })

  it('GitHub Actions workflow exists', () => {
    expect(fs.existsSync(path.resolve('.github/workflows/deploy.yml'))).toBe(true)
    const workflow = fs.readFileSync(path.resolve('.github/workflows/deploy.yml'), 'utf8')
    expect(workflow).toContain('ghcr.io')
    expect(workflow).toContain('kubectl')
  })
})
