# İstoç Changelog

3 reponun (`tradehub_core`, `tradehubfront`, `admin-panel`) `CHANGELOG.md` dosyalarını otomatik birleştirip filtrelenebilir bir timeline olarak yayınlar.

**Canlı:** https://tradehub-tr.github.io/istoc-changelog/

## Geliştirme

```bash
npm install
USE_LOCAL_FIXTURES=1 npm run sync   # local fixture ile JSON üret
npm run dev
```

`SOURCE_REPO_PAT` ortam değişkeni ile gerçek repolardan çekilir:

```bash
SOURCE_REPO_PAT=ghp_xxx npm run sync
```

## Otomatik güncelleme

1. Kaynak repolardaki release workflow'ları CHANGELOG.md'yi commit'ler
2. Workflow son adımı `repository_dispatch` ile bu repoyu tetikler
3. `.github/workflows/sync-and-deploy.yml` SOURCE_REPO_PAT ile CHANGELOG'ları çeker, parse eder, build alır ve GitHub Pages'e deploy eder
4. Yedek: 6 saatte bir `schedule` aynı işi yapar

## Secrets

`istoc-changelog` repo settings → Secrets and variables → Actions:

- `SOURCE_REPO_PAT` — fine-grained PAT, 3 kaynak repoda `Contents: Read`

Kaynak repolarda (her birinde):

- `CHANGELOG_DISPATCH_PAT` — fine-grained PAT, `istoc-changelog`'da `Actions: Write`
