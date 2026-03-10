-- Фаъол кардани RLS барои profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Фаъол кардани RLS барои categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Фаъол кардани RLS барои products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Фаъол кардани RLS барои orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Фаъол кардани RLS барои order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Фаъол кардани RLS барои reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Фаъол кардани RLS барои payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Фаъол кардани RLS барои audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Политика барои хондани профили худ (ҳар корбар метавонад профили худро бинад)
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Политика барои навсозии профили худ
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Политика барои мудирон (админҳо) - дастрасии пурра
CREATE POLICY "Admins can do everything on profiles" 
ON profiles FOR ALL 
USING (auth.jwt() ->> 'role' LIKE '%admin%');

-- Ҳама метавонанд категорияҳоро бинанд
CREATE POLICY "Anyone can view categories" 
ON categories FOR SELECT 
USING (true);

-- Танҳо мудирон метавонанд категорияҳоро илова, тағйир ё нест кунанд
CREATE POLICY "Admins can manage categories" 
ON categories FOR ALL 
USING (auth.jwt() ->> 'role' LIKE '%admin%');

-- Ҳама метавонанд маҳсулоти фаъолро бинанд
CREATE POLICY "Anyone can view active products" 
ON products FOR SELECT 
USING (status = 'active');

-- Фурӯшандагон метавонанд маҳсулоти худро бинанд (ҳатто ғайрифаъол)
CREATE POLICY "Sellers can view their own products" 
ON products FOR SELECT 
USING (seller_id = auth.uid());

-- Фурӯшандагон метавонанд маҳсулоти худро эҷод, навсозӣ ва нест кунанд
CREATE POLICY "Sellers can manage their own products" 
ON products FOR ALL 
USING (seller_id = auth.uid()) 
WITH CHECK (seller_id = auth.uid());

-- Мудирон ҳама чизро идора мекунанд
CREATE POLICY "Admins can manage all products" 
ON products FOR ALL 
USING (auth.jwt() ->> 'role' LIKE '%admin%');

-- Харидорон метавонанд фармоишҳои худро бинанд
CREATE POLICY "Buyers can view their own orders" 
ON orders FOR SELECT 
USING (buyer_id = auth.uid());

-- Фурӯшандагон метавонанд фармоишҳое, ки маҳсулоти онҳо доранд, тавассути order_items бинанд
-- Барои ин мо ба ҷадвали order_items низ политика лозим аст. Аммо барои худи orders, мо метавонем политикаи махсус созем, ки бо order_items ҳамроҳ шавад.
-- Усули осонтар: дар ҷадвали order_items политикае месозем, ки ба фурӯшанда иҷозат диҳад order_id-ҳои марбутро бинад. Сипас дар orders, мо метавонем аз EXISTS истифода кунем.

-- Политика барои фурӯшандагон дар orders
CREATE POLICY "Sellers can view orders containing their products" 
ON orders FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM order_items 
    JOIN products ON order_items.product_id = products.id
    WHERE order_items.order_id = orders.id 
    AND products.seller_id = auth.uid()
  )
);

-- Мудирон ҳамаро мебинанд
CREATE POLICY "Admins can view all orders" 
ON orders FOR SELECT 
USING (auth.jwt() ->> 'role' LIKE '%admin%');

-- Танҳо мудирон метавонанд фармоишҳоро навсозӣ кунанд (барои тағйири статус)
CREATE POLICY "Admins can update orders" 
ON orders FOR UPDATE 
USING (auth.jwt() ->> 'role' LIKE '%admin%');

-- Харидорон метавонанд ашёи фармоишҳои худро бинанд
CREATE POLICY "Buyers can view their order items" 
ON order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.buyer_id = auth.uid()
  )
);

-- Фурӯшандагон метавонанд ашёи фармоишҳое, ки маҳсулоти онҳо доранд, бинанд
CREATE POLICY "Sellers can view order items with their products" 
ON order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = order_items.product_id 
    AND products.seller_id = auth.uid()
  )
);

-- Мудирон ҳамаро мебинанд
CREATE POLICY "Admins can view all order items" 
ON order_items FOR SELECT 
USING (auth.jwt() ->> 'role' LIKE '%admin%');

-- Ҳеҷ кас (ғайр аз мудир) наметавонад order_items-ро тағйир диҳад, зеро онҳо пас аз эҷод бетағйир бояд монанд.
-- Барои INSERT, он тавассути функсияи create_order иҷро мешавад, ки бо service_role кор мекунад.
-- Пас, политикаи INSERT-ро танҳо барои мудирон мегузорем.
CREATE POLICY "Admins can insert order items" 
ON order_items FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' LIKE '%admin%');

-- Ҳама метавонанд тақризҳоро бинанд
CREATE POLICY "Anyone can view reviews" 
ON reviews FOR SELECT 
USING (true);

-- Корбарон метавонанд тақризҳои худро эҷод, навсозӣ ва нест кунанд
CREATE POLICY "Users can manage their own reviews" 
ON reviews FOR ALL 
USING (author_id = auth.uid()) 
WITH CHECK (author_id = auth.uid());

-- Мудирон метавонанд ҳамаро идора кунанд
CREATE POLICY "Admins can manage all reviews" 
ON reviews FOR ALL 
USING (auth.jwt() ->> 'role' LIKE '%admin%');

-- Харидорон метавонанд пардохтҳои фармоишҳои худро бинанд
CREATE POLICY "Buyers can view their payments" 
ON payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = payments.order_id 
    AND orders.buyer_id = auth.uid()
  )
);

-- Фурӯшандагон метавонанд пардохтҳои фармоишҳое, ки маҳсулоти онҳо доранд, бинанд
CREATE POLICY "Sellers can view payments for their orders" 
ON payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM order_items 
    JOIN products ON order_items.product_id = products.id
    WHERE order_items.order_id = payments.order_id 
    AND products.seller_id = auth.uid()
  )
);

-- Мудирон ҳамаро мебинанд
CREATE POLICY "Admins can view all payments" 
ON payments FOR SELECT 
USING (auth.jwt() ->> 'role' LIKE '%admin%');

-- Танҳо система (service_role) ва мудирон метавонанд пардохтҳоро эҷод ё навсозӣ кунанд
CREATE POLICY "Admins can insert/update payments" 
ON payments FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' LIKE '%admin%');

CREATE POLICY "Admins can update payments" 
ON payments FOR UPDATE 
USING (auth.jwt() ->> 'role' LIKE '%admin%');

-- Танҳо мудирон метавонанд логи аудитро бинанд
CREATE POLICY "Admins can view audit log" 
ON audit_log FOR SELECT 
USING (auth.jwt() ->> 'role' LIKE '%admin%');

-- Ҳеҷ кас (ғайр аз система) наметавонад ба audit_log нависад ё тағйир диҳад
-- INSERT тавассути функсияҳо бо service_role анҷом мешавад
CREATE POLICY "No insert for users" 
ON audit_log FOR INSERT 
WITH CHECK (false);
