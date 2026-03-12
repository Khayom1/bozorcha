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



```markdown
# API-и Bozorcha

## Edge Functions

### 1. search-products
**Ҷустуҷӯи маҳсулот**

- **URL**: `/functions/v1/search-products`
- **Метод**: `GET`
- **Параметрҳо** (дар query string):
  - `q` (ихтиёрӣ): калимаи ҷустуҷӯ (масалан, `телефон`)
  - `category_id` (ихтиёрӣ): ID категория
  - `min_price` (ихтиёрӣ): нархи минималӣ
  - `max_price` (ихтиёрӣ): нархи максималӣ
  - `seller_id` (ихтиёрӣ): ID фурӯшанда
  - `sort_by` (ихтиёрӣ): `relevance`, `price_asc`, `price_desc`, `rating`, `newest` (пешфарз: `relevance`)
  - `limit` (ихтиёрӣ): шумораи натиҷаҳо (пешфарз: 20)
  - `offset` (ихтиёрӣ): барои саҳифабандӣ (пешфарз: 0)

- **Намунаи дархост**:
```

GET /functions/v1/search-products?q=Samsung&sort_by=rating&limit=5

```

- **Намунаи посух**:
  ```json
  [
    {
      "id": "e3e3bc29-cb6a-4e55-8d5d-b7c1d3df0d7c",
      "title": "Samsung Galaxy A35",
      "description": "Смартфони санҷишӣ",
      "price": 500,
      "rating": 0,
      "seller_id": "323004b6-8f14-4b98-b0ac-b4358a7e63e0",
      "seller_name": null,
      "category_id": "2725feb9-cff9-401e-bb43-08e61524bf61",
      "category_name": "Электроника",
      "image_url": null,
      "relevance": 0.0607927
    }
  ]
```

2. get-profile

Гирифтани маълумоти профили корбари воридшуда

· URL: /functions/v1/get-profile
· Метод: GET
· Сарлавҳа: Authorization: Bearer <token> (барои версияи амн; версияи санҷишӣ бе токен кор мекунад)
· Намунаи посух:
  ```json
  {
    "user": { ... },
    "profile": { ... }
  }
  ```

3. create-order

Эҷоди фармоиши нав

· URL: /functions/v1/create-order
· Метод: POST
· Сарлавҳа: Authorization: Bearer <token> (барои версияи амн; версияи санҷишӣ бе токен кор мекунад)
· Body (JSON):
  ```json
  {
    "items": [
      {
        "product_id": "e3e3bc29-cb6a-4e55-8d5d-b7c1d3df0d7c",
        "quantity": 1
      }
    ],
    "shipping_address": { "city": "Душанбе", "street": "..." },
    "notes": "comments"
  }
  ```
· Намунаи посух:
  ```json
  {
    "success": true,
    "order_id": "some-uuid",
    "total": 500,
    "fee": 25,
    "status": "pending",
    "message": "Order created successfully"
  }
  ```

4. payment-webhook

Вебхук барои қабули пардохт аз системаҳои пардохтӣ

· URL: /functions/v1/payment-webhook
· Метод: POST
· Сарлавҳа: Authorization: Bearer <webhook_secret>
· Body (JSON):
  ```json
  {
    "order_id": "some-uuid",
    "status": "success",
    "payment_method": "card",
    "transaction_id": "txn_123456"
  }
  ```
· Намунаи посух:
  ```json
  {
    "success": true,
    "order_id": "...",
    "payment_id": "...",
    "status": "paid"
  }
  ```

```
