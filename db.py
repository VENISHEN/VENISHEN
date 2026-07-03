import os
import psycopg2
import psycopg2.extras

DATABASE_URL = os.environ.get('DATABASE_URL')


def get_connection():
    return psycopg2.connect(DATABASE_URL, sslmode='require')


def init_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            price NUMERIC(10,2) NOT NULL DEFAULT 0,
            category TEXT,
            image TEXT,
            stock INTEGER NOT NULL DEFAULT 0,
            description TEXT
        );
    ''')
    conn.commit()

    cur.execute('SELECT COUNT(*) FROM products;')
    count = cur.fetchone()[0]

    if count == 0:
        cur.execute('''
            INSERT INTO products (name, price, category, image, stock, description)
            VALUES
                (%s, %s, %s, %s, %s, %s),
                (%s, %s, %s, %s, %s, %s)
        ''', (
            'Wireless Headphones', 129.99, 'Electronics', '🎧', 15, 'Premium wireless headphones',
            'Smart Watch', 299.99, 'Electronics', '⌚', 8, 'Fitness tracker watch'
        ))
        conn.commit()

    cur.close()
    conn.close()


def row_to_dict(row):
    return {
        'id': row['id'],
        'name': row['name'],
        'price': float(row['price']),
        'category': row['category'],
        'image': row['image'],
        'stock': row['stock'],
        'description': row['description']
    }


def get_all_products():
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute('SELECT * FROM products ORDER BY id;')
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [row_to_dict(r) for r in rows]


def get_product(product_id):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute('SELECT * FROM products WHERE id = %s;', (product_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row_to_dict(row) if row else None

def get_stock(product_id):
    product = get_product(product_id)
    return product['stock'] if product else 0
    
def add_product(data):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute('''
        INSERT INTO products (name, price, category, image, stock, description)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING *;
    ''', (
        data.get('name'),
        float(data.get('price', 0)),
        data.get('category'),
        data.get('image', '📦'),
        int(data.get('stock', 0)),
        data.get('description', '')
    ))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return row_to_dict(row)


def update_product(product_id, data):
    existing = get_product(product_id)
    if not existing:
        return None

    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute('''
        UPDATE products
        SET name = %s, price = %s, category = %s, image = %s, stock = %s, description = %s
        WHERE id = %s
        RETURNING *;
    ''', (
        data.get('name', existing['name']),
        float(data.get('price', existing['price'])),
        data.get('category', existing['category']),
        data.get('image', existing['image']),
        int(data.get('stock', existing['stock'])),
        data.get('description', existing['description']),
        product_id
    ))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return row_to_dict(row)


def delete_product(product_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM products WHERE id = %s;', (product_id,))
    conn.commit()
    cur.close()
    conn.close()


def decrement_stock(product_id, quantity):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute('''
        UPDATE products SET stock = GREATEST(stock - %s, 0)
        WHERE id = %s;
    ''', (quantity, product_id))
    conn.commit()
    cur.close()
    conn.close()
