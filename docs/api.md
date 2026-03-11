# API-и Bozorcha

## Edge Functions

### search-products
- **URL**: `/functions/v1/search-products`
- **Метод**: GET
- **Параметрҳо**:
  - `q` (ихтиёрӣ) - калимаи ҷустуҷӯ
  - `category_id` - ID категория
  - `min_price` - нархи минималӣ
  - `max_price` - нархи максималӣ
  - `sort_by` - 'relevance', 'price_asc', 'price_desc', 'rating', 'newest'
  - `limit` - шумораи натиҷаҳо (default 20)
  - `offset` - барои саҳифабандӣ
- **Намуна**: 
