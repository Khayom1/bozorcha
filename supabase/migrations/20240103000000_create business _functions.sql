CREATE OR REPLACE FUNCTION create_order_with_items(
    p_buyer_id UUID,
    p_items JSONB,
    p_shipping_address JSONB DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Бо ҳуқуқи созанда иҷро мешавад
AS $$
DECLARE
    v_order_id UUID;
    v_total DECIMAL(10,2) := 0;
    v_fee DECIMAL(10,2) := 0;
    v_item JSONB;
    v_product_id UUID;
    v_quantity INTEGER;
    v_price DECIMAL(10,2);
    v_seller_id UUID;
    v_commission_rate FLOAT;
    v_category_id UUID;
    v_result JSONB;
BEGIN
    -- Санҷиши маҷмӯи ашё
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Items array cannot be empty';
    END IF;

    -- Эҷоди сабти фармоиш
    INSERT INTO orders (buyer_id, total, fee, status, shipping_address, notes)
    VALUES (p_buyer_id, 0, 0, 'pending', p_shipping_address, p_notes)
    RETURNING id INTO v_order_id;

    -- Гузаштан аз тамоми ашё
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;

        -- Санҷиши миқдор
        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Quantity must be positive for product %', v_product_id;
        END IF;

        -- Қулф кардани сатри маҳсулот барои пешгирии тағйироти ҳамзамон
        SELECT price, seller_id, category_id INTO v_price, v_seller_id, v_category_id
        FROM products
        WHERE id = v_product_id AND status = 'active'
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found or inactive: %', v_product_id;
        END IF;

        -- Санҷиши миқдори анбор
        IF (SELECT stock FROM products WHERE id = v_product_id) < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product: %. Available: %, requested: %', 
                v_product_id, (SELECT stock FROM products WHERE id = v_product_id), v_quantity;
        END IF;

        -- Кам кардани миқдори анбор
        UPDATE products 
        SET stock = stock - v_quantity,
            order_count = order_count + 1
        WHERE id = v_product_id;

        -- Гирифтани фоизи комиссия аз категория
        SELECT commission_rate INTO v_commission_rate
        FROM categories
        WHERE id = v_category_id;

        -- Ҳисоби маблағ ва комиссия
        v_total := v_total + (v_price * v_quantity);
        v_fee := v_fee + (v_price * v_quantity * v_commission_rate);

        -- Илова кардани ашё ба фармоиш
        INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
        VALUES (v_order_id, v_product_id, v_quantity, v_price);
    END LOOP;

    -- Навсозии маблағҳо дар фармоиш
    UPDATE orders 
    SET total = v_total, 
        fee = v_fee 
    WHERE id = v_order_id;

    -- Сабт дар audit_log
    INSERT INTO audit_log (user_id, action, table_name, record_id, new_data)
    VALUES (p_buyer_id, 'INSERT', 'orders', v_order_id, 
            jsonb_build_object('total', v_total, 'fee', v_fee, 'items', p_items));

    -- Баргардонидани натиҷа
    v_result := jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'total', v_total,
        'fee', v_fee,
        'status', 'pending',
        'message', 'Order created successfully'
    );
    
    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    -- Агар хато шавад, онро сабт кун ва баргардон
    v_result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_avg_rating FLOAT;
    v_review_count INTEGER;
    v_global_avg FLOAT;
    v_m FLOAT := 10; -- параметри байезӣ
BEGIN
    -- Ҳисоби миёнаи баҳо барои ин маҳсулот
    SELECT AVG(rating), COUNT(*) INTO v_avg_rating, v_review_count
    FROM reviews
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id);

    -- Ҳисоби миёнаи глобалӣ (барои тамоми маҳсулот)
    SELECT AVG(rating) INTO v_global_avg
    FROM reviews;

    -- Агар глобалӣ холӣ бошад, 3.0-ро истифода кун
    IF v_global_avg IS NULL THEN
        v_global_avg := 3.0;
    END IF;

    -- Формулаи байезӣ: (sum + m * C) / (count + m)
    UPDATE products
    SET rating = ( (v_avg_rating * v_review_count) + (v_m * v_global_avg) ) / (v_review_count + v_m)
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);

    RETURN NEW;
END;
$$;

-- Триггер барои даъвати функсия пас аз илова/тағйир/нест кардани тақриз
CREATE TRIGGER trigger_update_product_rating
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();


CREATE OR REPLACE FUNCTION update_balance(
    p_user_id UUID,
    p_amount DECIMAL(10,2),
    p_reason TEXT,
    p_order_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance DECIMAL(10,2);
    v_new_balance DECIMAL(10,2);
    v_result JSONB;
BEGIN
    -- Санҷиши маблағ
    IF p_amount = 0 THEN
        RAISE EXCEPTION 'Amount cannot be zero';
    END IF;

    -- Қулф кардани профил
    SELECT balance INTO v_current_balance
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;

    -- Санҷиши кифоятии баланс барои кам кардан
    IF p_amount < 0 AND v_current_balance + p_amount < 0 THEN
        RAISE EXCEPTION 'Insufficient balance. Current: %, requested: %', 
            v_current_balance, p_amount;
    END IF;

    -- Навсозии баланс
    v_new_balance := v_current_balance + p_amount;
    
    UPDATE profiles
    SET balance = v_new_balance
    WHERE id = p_user_id;

    -- Сабт дар audit_log
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
        p_user_id, 
        'UPDATE_BALANCE', 
        'profiles', 
        p_user_id,
        jsonb_build_object('balance', v_current_balance, 'reason', p_reason, 'order_id', p_order_id),
        jsonb_build_object('balance', v_new_balance, 'amount', p_amount, 'reason', p_reason, 'order_id', p_order_id)
    );

    v_result := jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'old_balance', v_current_balance,
        'new_balance', v_new_balance,
        'change', p_amount,
        'reason', p_reason
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    v_result := jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION create_order_with_items(
    p_buyer_id UUID,
    p_items JSONB,
    p_shipping_address JSONB DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Бо ҳуқуқи созанда иҷро мешавад
AS $$
DECLARE
    v_order_id UUID;
    v_total DECIMAL(10,2) := 0;
    v_fee DECIMAL(10,2) := 0;
    v_item JSONB;
    v_product_id UUID;
    v_quantity INTEGER;
    v_price DECIMAL(10,2);
    v_seller_id UUID;
    v_commission_rate FLOAT;
    v_category_id UUID;
    v_result JSONB;
BEGIN
    -- Санҷиши маҷмӯи ашё
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Items array cannot be empty';
    END IF;

    -- Эҷоди сабти фармоиш
    INSERT INTO orders (buyer_id, total, fee, status, shipping_address, notes)
    VALUES (p_buyer_id, 0, 0, 'pending', p_shipping_address, p_notes)
    RETURNING id INTO v_order_id;

    -- Гузаштан аз тамоми ашё
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;

        -- Санҷиши миқдор
        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Quantity must be positive for product %', v_product_id;
        END IF;

        -- Қулф кардани сатри маҳсулот барои пешгирии тағйироти ҳамзамон
        SELECT price, seller_id, category_id INTO v_price, v_seller_id, v_category_id
        FROM products
        WHERE id = v_product_id AND status = 'active'
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found or inactive: %', v_product_id;
        END IF;

        -- Санҷиши миқдори анбор
        IF (SELECT stock FROM products WHERE id = v_product_id) < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product: %. Available: %, requested: %', 
                v_product_id, (SELECT stock FROM products WHERE id = v_product_id), v_quantity;
        END IF;

        -- Кам кардани миқдори анбор
        UPDATE products 
        SET stock = stock - v_quantity,
            order_count = order_count + 1
        WHERE id = v_product_id;

        -- Гирифтани фоизи комиссия аз категория
        SELECT commission_rate INTO v_commission_rate
        FROM categories
        WHERE id = v_category_id;

        -- Ҳисоби маблағ ва комиссия
        v_total := v_total + (v_price * v_quantity);
        v_fee := v_fee + (v_price * v_quantity * v_commission_rate);

        -- Илова кардани ашё ба фармоиш
        INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
        VALUES (v_order_id, v_product_id, v_quantity, v_price);
    END LOOP;

    -- Навсозии маблағҳо дар фармоиш
    UPDATE orders 
    SET total = v_total, 
        fee = v_fee 
    WHERE id = v_order_id;

    -- Сабт дар audit_log
    INSERT INTO audit_log (user_id, action, table_name, record_id, new_data)
    VALUES (p_buyer_id, 'INSERT', 'orders', v_order_id, 
            jsonb_build_object('total', v_total, 'fee', v_fee, 'items', p_items));

    -- Баргардонидани натиҷа
    v_result := jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'total', v_total,
        'fee', v_fee,
        'status', 'pending',
        'message', 'Order created successfully'
    );
    
    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    -- Агар хато шавад, онро сабт кун ва баргардон
    v_result := jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION complete_order(
    p_order_id UUID,
    p_payment_method TEXT,
    p_provider_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_payment_id UUID;
    v_result JSONB;
BEGIN
    -- Гирифтани маълумоти фармоиш
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id AND status = 'pending'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found or not in pending status: %', p_order_id;
    END IF;

    -- Эҷоди сабти пардохт
    INSERT INTO payments (order_id, amount, status, method, provider_data)
    VALUES (p_order_id, v_order.total, 'success', p_payment_method, p_provider_data)
    RETURNING id INTO v_payment_id;

    -- Навсозии ҳолати фармоиш
    UPDATE orders
    SET status = 'paid',
        payment_method = p_payment_method,
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Сабт дар audit_log
    INSERT INTO audit_log (user_id, action, table_name, record_id, new_data)
    VALUES (
        v_order.buyer_id, 
        'COMPLETE_ORDER', 
        'orders', 
        p_order_id,
        jsonb_build_object('payment_id', v_payment_id, 'method', p_payment_method)
    );

    v_result := jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'payment_id', v_payment_id,
        'status', 'paid',
        'message', 'Order completed successfully'
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    v_result := jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
    RETURN v_result;
END;
$$;

-- Ҷустуҷӯи маҳсулот бо калимаи "телефон"
SELECT * FROM search_products('телефон', NULL, NULL, NULL, NULL, 'relevance', 10, 0);

-- Ҷустуҷӯ бо филтрҳо
SELECT * FROM search_products(
    p_search => 'либос',
    p_min_price => 100,
    p_max_price => 500,
    p_sort_by => 'price_asc'
);
