# HATA KAYITLARI VE COZUMLERI

> **ONEMLI:** Bu dosya yeni LLM'lerin hizli erisimi icin tasarlanmistir.
> Tum hatalar, cozumler ve basarisizlik nedenleri burada kayit altindadir.

---

## AKTIF HATALAR

### ERR-001: @supabase/ssr Module Not Found
**Tarih:** 2026-04-05  
**Durum:** COZULDU (gecici)  
**Oncelik:** P0 - Kritik

**Hata Mesaji:**
```
Module not found: Can't resolve '@supabase/ssr'
> 1 | import { createServerClient } from '@supabase/ssr'
```

**Etkilenen Dosyalar:**
- `middleware.ts`
- `lib/supabase/proxy.ts`
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`

**Kok Neden:**
- `@supabase/ssr` ve `@supabase/supabase-js` paketleri package.json'a eklendi
- Ancak v0 sandbox ortaminda paket kurulumu otomatik tetiklenmedi
- Turbopack build sirasinda proxy.ts'deki static import basarisiz oluyor

**Gecici Cozum (UYGULANDI):**
```typescript
// middleware.ts - Supabase devre disi birakildi
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}
```

**Kalici Cozum:**
```bash
pnpm add @supabase/ssr @supabase/supabase-js
```

**Ogrenilenler:**
1. v0 sandbox'ta paket kurulumu her zaman otomatik tetiklenmez
2. Edge middleware'de static import kullanilamaz (dynamic import gerekli)
3. Turbopack compile-time'da tum importlari resolve etmeye calisir

---

## COZULMUS HATALAR ARSIVI

### ERR-000: Template (Ornek Format)
**Tarih:** YYYY-MM-DD  
**Durum:** COZULDU | DEVAM EDIYOR | ERTELENDI  
**Oncelik:** P0 | P1 | P2

**Hata Mesaji:**
```
Hata mesaji buraya
```

**Etkilenen Dosyalar:**
- dosya1.ts
- dosya2.tsx

**Kok Neden:**
Kok nedenin aciklamasi

**Cozum:**
Uygulanan cozumun detayli aciklamasi

**Ogrenilenler:**
1. Ogrenilen ders 1
2. Ogrenilen ders 2

---

## BILINEN KISITLAMALAR

### v0 Sandbox Ortami
1. **Paket Kurulumu:** Otomatik tetiklenmeyebilir, package.json degisikligi gerekebilir
2. **Edge Runtime:** Static import sorunlari yasanabilir
3. **Turbopack:** Tum importlari compile-time'da resolve eder

### Next.js 16 Middleware
1. **Async/Await:** params, searchParams, headers, cookies async olmali
2. **Edge Runtime:** Node.js API'leri kullanılamaz
3. **Dynamic Import:** Static import yerine dynamic import tercih edilmeli

---

## HATA RAPORLAMA FORMATI

Yeni hata eklerken asagidaki formati kullanin:

```markdown
### ERR-XXX: Kisa Baslik
**Tarih:** YYYY-MM-DD  
**Durum:** DEVAM EDIYOR  
**Oncelik:** P0 | P1 | P2

**Hata Mesaji:**
\`\`\`
Tam hata mesaji
\`\`\`

**Etkilenen Dosyalar:**
- dosya listesi

**Kok Neden:**
Aciklama

**Cozum:**
Uygulanan veya onerilen cozum

**Ogrenilenler:**
1. Ders 1
2. Ders 2
```

---

## HIZLI REFERANS

| Hata Kodu | Baslik | Durum | Dosya |
|-----------|--------|-------|-------|
| ERR-001 | @supabase/ssr Not Found | GECICI COZULDU | middleware.ts |

---

## ILGILI DOKUMANLAR

- [MASTER_PLAN.md](../MASTER_PLAN.md) - Ana proje plani
- [HISTORY.md](../HISTORY.md) - Degisiklik gecmisi
- [PRODUCTION-GAPS.md](./PRODUCTION-GAPS.md) - Uretim eksiklikleri
