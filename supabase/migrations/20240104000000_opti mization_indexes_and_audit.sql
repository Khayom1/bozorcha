CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT 
  query,
  calls,
  total_exec_time / 1000 as total_seconds,
  mean_exec_time / 1000 as mean_seconds,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Индекси мураккаб барои филтрҳои зуд-зуд истифодашаванда
CREATE INDEX idx_products_composite_search ON products(category_id, price, rating) 
WHERE status = 'active';

-- Индекси partial барои маҳсулоти серталаб
CREATE INDEX idx_products_high_demand ON products(order_count DESC, rating DESC) 
WHERE status = 'active' AND order_count > 10;

-- Индекси барои ҷустуҷӯи фурӯшандагон
CREATE INDEX idx_products_seller_status ON products(seller_id, status) 
WHERE status = 'active';

CREATE OR REPLACE FUNCTION get_tj_date(t timestamp with time zone) 
RETURNS date AS $$
BEGIN
  RETURN (t AT TIME ZONE 'Asia/Dushanbe')::date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 1. Индекси асосӣ
CREATE INDEX idx_orders_user_status 
ON orders(buyer_id, status, created_at DESC);

-- 2. Индекси ислоҳшуда барои санаи Тоҷикистон
CREATE INDEX idx_orders_created_date_tj 
ON orders (get_tj_date(created_at)) 
WHERE status = 'paid';

SELECT * FROM orders 
WHERE get_tj_date(created_at) = CURRENT_DATE 
AND status = 'paid';

-- Барои саҳифаи маҳсулот
CREATE INDEX idx_reviews_product_rating ON reviews(product_id, rating DESC, created_at DESC);

-- Функсия барои сабти аудит
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, new_data)
    VALUES (
      auth.uid(),
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      row_to_json(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
      auth.uid(),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      row_to_json(OLD),
      row_to_json(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data)
    VALUES (
      auth.uid(),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      row_to_json(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Триггер барои products
CREATE TRIGGER audit_products
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Триггер барои orders
CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();

-- Триггер барои payments
CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger_function();
