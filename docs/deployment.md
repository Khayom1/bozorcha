# Дастури насб ва истифодаи Bozorcha

## Талабот
- Акаунти Supabase
- Акаунти GitHub

## Қадамҳои насб

### 1. Эҷоди лоиҳа дар Supabase
1. Ба supabase.com равед ва ворид шавед.
2. Тугмаи **"New project"** -ро пахш кунед.
3. Ном ва рамзи махфиро ворид кунед, минтақаро интихоб намоед.
4. Интизори сохтани лоиҳа шавед.

### 2. Иҷрои муҳоҷират (migrations)
1. Ба **SQL Editor** равед.
2. Файлҳои `supabase/migrations/*.sql`-ро пай дар пай иҷро кунед (!! Лутфан диққат диҳед, зеро баъзе фармонҳо такрор омадаанд. Бори аввал иҷро карда будам ва бори 2 -юм бо сабабҳое иваз ё ташрир кардам!).
   - `20240101000000_initial_schema.sql`
   - `20240102000000_enable_rls_and_policies.sql`
   - `20240103000000_create_business_functions.sql`
   - `20240104000000_optimization_indexes_and_audit.sql`

### 3. Танзими аутентификатсия
1. Ба **Authentication** → **Providers** гузаред.
2. **Email**-ро фаъол кунед (ва дигар провайдерҳо дар сурати лозим).

### 4. Насби Edge Functions
1. Ба **Edge Functions** гузаред.
2. Барои ҳар як функсия (search-products, get-profile, create-order, payment-webhook) тугмаи **"Create a new function"** -ро пахш кунед.
3. Кодро аз папкаи `supabase/functions/` нусхабардорӣ кунед ва часпонед.
4. Тугмаи **"Save and Deploy"** -ро пахш кунед.

### 5. Танзими секретҳо
Барои функсияи `payment-webhook` секрет илова кунед:
1. Ба **Edge Functions** → **payment-webhook** → **Details** гузаред.
2. Дар **Environment variables** тугмаи **"Add secret"** -ро пахш кунед.
3. Ном: `WEBHOOK_SECRET`, қимат: рамзи тасодуфии дароз.

## Санҷиш
- Барои санҷиши search-products: `https://<project-ref>.supabase.co/functions/v1/search-products?q=телефон`
- Барои санҷиши дигар функсияҳо, аз тугмаи **"Execute"** дар саҳифаи ҳар функсия истифода баред.

## Қайдҳо
- Дар версияи ҷорӣ, барои санҷиш функсияҳои get-profile ва create-order бе JWT кор мекунанд (версияи санҷишӣ).
- Барои истифодаи воқеӣ, JWT-ро тавассути клиент гирифта, ба дархостҳо илова кунед.
