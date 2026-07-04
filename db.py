import os
import json
import psycopg2
import psycopg2.extras
from datetime import datetime

DATABASE_URL = os.environ.get('DATABASE_URL') or os.environ.get('POSTGRES_URL')


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

    cur.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            invoice_no TEXT,
            items JSONB NOT NULL,
            total NUMERIC(10,2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            shipped_at TIMESTAMP
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


# =========================
# ORDERS
# =========================

def order_row_to_dict(row):
    return {
        'id': row['id'],
        'invoice_no': row['invoice_no'],
        'items': row['items'],
        'total': float(row['total']),
        'status': row['status'],
        'created_at': row['created_at'].isoformat() if row['created_at'] else None,
        'shipped_at': row['shipped_at'].isoformat() if row['shipped_at'] else None
    }


def create_order(items, total):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute('''
        INSERT INTO orders (items, total, status)
        VALUES (%s, %s, 'pending')
        RETURNING id;
    ''', (psycopg2.extras.Json(items), total))
    order_id = cur.fetchone()['id']

    invoice_no = f"INV-{order_id:05d}"
    cur.execute('''
        UPDATE orders SET invoice_no = %s WHERE id = %s
        RETURNING *;
    ''', (invoice_no, order_id))
    row = cur.fetchone()

    conn.commit()
    cur.close()
    conn.close()
    return order_row_to_dict(row)


def get_pending_orders():
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at ASC;")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [order_row_to_dict(r) for r in rows]


def get_order(order_id):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute('SELECT * FROM orders WHERE id = %s;', (order_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return order_row_to_dict(row) if row else None


def approve_order(order_id):
    order = get_order(order_id)
    if not order or order['status'] != 'pending':
        return None

    for item in order['items']:
        decrement_stock(item['id'], item['quantity'])

    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute('''
        UPDATE orders SET status = 'shipped', shipped_at = NOW()
        WHERE id = %s
        RETURNING *;
    ''', (order_id,))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return order_row_to_dict(row)


def get_sales_stats():
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute('SELECT items, total FROM orders;')
    rows = cur.fetchall()
    cur.close()
    conn.close()

    total_revenue = sum(float(r['total']) for r in rows)
    total_items_sold = sum(
        item['quantity'] for r in rows for item in r['items']
    )

    return {
        'total_revenue': total_revenue,
        'total_items_sold': total_items_sold
    }
