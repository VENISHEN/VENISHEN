from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
import os
import json
import time
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from urllib.parse import urlparse

app = Flask(__name__, 
            static_folder='static',
            static_url_path='/static')

# CORS for API
CORS(app, origins=['https://venishen.vercel.app', 'http://localhost:3000', 'http://localhost:5000'])

# Configuration
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['SESSION_PERMANENT'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = 1800

# Database connection helper
def get_db_connection():
    DATABASE_URL = os.environ.get('DATABASE_URL')
    
    if not DATABASE_URL:
        # For local development without database
        return None
    
    # Fix for Render's postgres:// vs postgresql://
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    
    try:
        conn = psycopg2.connect(DATABASE_URL, sslmode='require')
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

# Initialize database tables
def init_db():
    conn = get_db_connection()
    if not conn:
        print("⚠️ Running without database (in-memory mode)")
        return
    
    try:
        cur = conn.cursor()
        
        # Create products table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                category VARCHAR(100),
                image VARCHAR(10),
                stock INTEGER DEFAULT 0,
                description TEXT,
                featured BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create orders table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_number INTEGER UNIQUE,
                items JSONB,
                total DECIMAL(10, 2),
                status VARCHAR(50) DEFAULT 'pending',
                customer_name VARCHAR(200),
                customer_email VARCHAR(200),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Check if we need to seed initial products
        cur.execute('SELECT COUNT(*) FROM products')
        count = cur.fetchone()[0]
        
        if count == 0:
            # Seed initial products
            products = [
                (1, 'Wireless Headphones', 129.99, 'Electronics', '🎧', 15, 'Premium wireless headphones with noise cancellation', True),
                (2, 'Smart Watch', 299.99, 'Electronics', '⌚', 8, 'Fitness tracker with heart rate monitor', True),
                (3, 'Gaming Laptop', 1299.99, 'Computers', '💻', 5, 'High-performance gaming laptop with RTX graphics', True),
                (4, 'Coffee Maker', 89.99, 'Home', '☕', 20, 'Programmable coffee maker with thermal carafe', False),
                (5, 'Running Shoes', 79.99, 'Sports', '👟', 12, 'Lightweight running shoes with cushioning', False),
                (6, 'Backpack', 49.99, 'Accessories', '🎒', 25, 'Water-resistant backpack with laptop compartment', False),
                (7, 'Bluetooth Speaker', 69.99, 'Electronics', '🔊', 18, 'Portable speaker with 12-hour battery', False),
                (8, 'Desk Lamp', 39.99, 'Home', '💡', 30, 'Adjustable LED desk lamp with touch controls', False)
            ]
            
            for p in products:
                cur.execute('''
                    INSERT INTO products (id, name, price, category, image, stock, description, featured)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                ''', p)
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Database initialized successfully!")
        
    except Exception as e:
        print(f"Database init error: {e}")

# Load products from database or in-memory fallback
def get_products():
    conn = get_db_connection()
    if not conn:
        # Fallback to in-memory products if no database
        return PRODUCTS_IN_MEMORY
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT * FROM products ORDER BY id')
        products = cur.fetchall()
        cur.close()
        conn.close()
        return products
    except Exception as e:
        print(f"Error loading products: {e}")
        return PRODUCTS_IN_MEMORY

def update_product_stock(product_id, quantity_to_reduce):
    conn = get_db_connection()
    if not conn:
        # Update in-memory fallback
        product = next((p for p in PRODUCTS_IN_MEMORY if p['id'] == product_id), None)
        if product:
            product['stock'] = max(0, product['stock'] - quantity_to_reduce)
        return
    
    try:
        cur = conn.cursor()
        cur.execute('UPDATE products SET stock = GREATEST(0, stock - %s) WHERE id = %s', 
                   (quantity_to_reduce, product_id))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error updating stock: {e}")

def save_order(order):
    conn = get_db_connection()
    if not conn:
        # Save to in-memory orders
        ORDERS_IN_MEMORY.append(order)
        return
    
    try:
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO orders (order_number, items, total, status, customer_name, customer_email)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (order['id'], json.dumps(order['items']), order['total'], 
              order['status'], order['customer_name'], order['customer_email']))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error saving order: {e}")

def get_orders():
    conn = get_db_connection()
    if not conn:
        return ORDERS_IN_MEMORY
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT * FROM orders ORDER BY timestamp DESC')
        orders = cur.fetchall()
        cur.close()
        conn.close()
        return orders
    except Exception as e:
        print(f"Error loading orders: {e}")
        return ORDERS_IN_MEMORY

# In-memory fallback data (used when no database)
PRODUCTS_IN_MEMORY = [
    {
        'id': 1,
        'name': 'Wireless Headphones',
        'price': 129.99,
        'category': 'Electronics',
        'image': '🎧',
        'stock': 15,
        'description': 'Premium wireless headphones with noise cancellation',
        'featured': True
    },
    {
        'id': 2,
        'name': 'Smart Watch',
        'price': 299.99,
        'category': 'Electronics',
        'image': '⌚',
        'stock': 8,
        'description': 'Fitness tracker with heart rate monitor',
        'featured': True
    },
    {
        'id': 3,
        'name': 'Gaming Laptop',
        'price': 1299.99,
        'category': 'Computers',
        'image': '💻',
        'stock': 5,
        'description': 'High-performance gaming laptop with RTX graphics',
        'featured': True
    },
    {
        'id': 4,
        'name': 'Coffee Maker',
        'price': 89.99,
        'category': 'Home',
        'image': '☕',
        'stock': 20,
        'description': 'Programmable coffee maker with thermal carafe',
        'featured': False
    },
    {
        'id': 5,
        'name': 'Running Shoes',
        'price': 79.99,
        'category': 'Sports',
        'image': '👟',
        'stock': 12,
        'description': 'Lightweight running shoes with cushioning',
        'featured': False
    },
    {
        'id': 6,
        'name': 'Backpack',
        'price': 49.99,
        'category': 'Accessories',
        'image': '🎒',
        'stock': 25,
        'description': 'Water-resistant backpack with laptop compartment',
        'featured': False
    },
    {
        'id': 7,
        'name': 'Bluetooth Speaker',
        'price': 69.99,
        'category': 'Electronics',
        'image': '🔊',
        'stock': 18,
        'description': 'Portable speaker with 12-hour battery',
        'featured': False
    },
    {
        'id': 8,
        'name': 'Desk Lamp',
        'price': 39.99,
        'category': 'Home',
        'image': '💡',
        'stock': 30,
        'description': 'Adjustable LED desk lamp with touch controls',
        'featured': False
    }
]

ORDERS_IN_MEMORY = []

# Store configuration
STORE_CONFIG = {
    'admin_username': os.environ.get('ADMIN_USERNAME', 'a'),
    'admin_password': os.environ.get('ADMIN_PASSWORD', 'a')
}

def get_next_id():
    products = get_products()
    if not products:
        return 1
    return max(p['id'] for p in products) + 1

def get_next_order_id():
    orders = get_orders()
    if not orders:
        return 1001
    return max(o['id'] for o in orders) + 1

@app.before_request
def check_auth():
    if request.path.startswith('/admin/') and not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    if 'cart' not in session:
        session['cart'] = []

@app.route('/')
def home():
    products = get_products()
    featured = [p for p in products if p.get('featured', False)]
    categories = list(set(p['category'] for p in products))
    return render_template('store.html', 
                         products=products, 
                         featured=featured,
                         categories=categories)

@app.route('/user')
def user_dashboard():
    return redirect('/')

@app.route('/user/admin')
def admin_panel():
    if session.get('is_admin'):
        orders = get_orders()
        products = get_products()
        recent_orders = orders[-5:] if len(orders) > 5 else orders
        return render_template('admin_panel.html', 
                             products=products, 
                             orders=recent_orders,
                             total_orders=len(orders))
    return render_template('neon.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username == STORE_CONFIG['admin_username'] and password == STORE_CONFIG['admin_password']:
        session['is_admin'] = True
        return jsonify({'success': True, 'message': 'Login successful'})
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('is_admin', None)
    return jsonify({'success': True, 'message': 'Logged out'})

@app.route('/api/cart', methods=['GET'])
def get_cart():
    return jsonify(session.get('cart', []))

@app.route('/api/cart/add', methods=['POST'])
def add_to_cart():
    try:
        data = request.get_json()
        product_id = data.get('id')
        quantity = data.get('quantity', 1)
        
        products = get_products()
        product = next((p for p in products if p['id'] == product_id), None)
        
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        cart = session.get('cart', [])
        
        # Check if product already in cart
        for item in cart:
            if item['id'] == product_id:
                item['quantity'] += quantity
                break
        else:
            cart.append({
                'id': product['id'],
                'name': product['name'],
                'price': float(product['price']),
                'quantity': quantity,
                'image': product['image']
            })
        
        session['cart'] = cart
        session.modified = True
        
        return jsonify({
            'success': True,
            'message': 'Added to cart',
            'cart': cart
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cart/remove/<int:product_id>', methods=['DELETE'])
def remove_from_cart(product_id):
    try:
        cart = session.get('cart', [])
        cart = [item for item in cart if item['id'] != product_id]
        session['cart'] = cart
        session.modified = True
        
        return jsonify({
            'success': True,
            'message': 'Removed from cart',
            'cart': cart
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cart/update', methods=['PUT'])
def update_cart():
    try:
        data = request.get_json()
        product_id = data.get('id')
        quantity = data.get('quantity', 1)
        
        cart = session.get('cart', [])
        
        for item in cart:
            if item['id'] == product_id:
                if quantity <= 0:
                    cart.remove(item)
                else:
                    item['quantity'] = quantity
                break
        
        session['cart'] = cart
        session.modified = True
        
        return jsonify({
            'success': True,
            'message': 'Cart updated',
            'cart': cart
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/products', methods=['GET'])
def get_products_api():
    products = get_products()
    return jsonify(products)

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    products = get_products()
    product = next((p for p in products if p['id'] == product_id), None)
    if product:
        return jsonify(product)
    return jsonify({'error': 'Product not found'}), 404

@app.route('/api/orders', methods=['GET'])
def get_orders_api():
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    orders = get_orders()
    return jsonify(orders)

@app.route('/api/checkout', methods=['POST'])
def checkout():
    try:
        cart = session.get('cart', [])
        
        if not cart:
            return jsonify({'success': False, 'message': 'Cart is empty'}), 400
        
        # Calculate total
        total = sum(item['price'] * item['quantity'] for item in cart)
        
        # Create order
        order = {
            'id': get_next_order_id(),
            'items': cart.copy(),
            'total': total,
            'status': 'pending',
            'timestamp': datetime.now().isoformat(),
            'customer_name': 'Guest Customer',
            'customer_email': 'guest@example.com'
        }
        
        # Update product stock
        for item in cart:
            update_product_stock(item['id'], item['quantity'])
        
        # Save order
        save_order(order)
        
        # Clear cart
        session['cart'] = []
        
        return jsonify({
            'success': True,
            'message': 'Order placed successfully!',
            'order_id': order['id'],
            'order': order
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        # Update in database
        conn = get_db_connection()
        if conn:
            cur = conn.cursor()
            cur.execute('UPDATE orders SET status = %s WHERE order_number = %s', 
                       (new_status, order_id))
            conn.commit()
            cur.close()
            conn.close()
        else:
            # Update in-memory
            order = next((o for o in ORDERS_IN_MEMORY if o['id'] == order_id), None)
            if order:
                order['status'] = new_status
        
        return jsonify({'success': True, 'message': 'Order status updated'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    conn = get_db_connection()
    db_status = 'connected' if conn else 'disconnected'
    if conn:
        conn.close()
    
    return jsonify({
        'status': 'healthy',
        'database': db_status,
        'products_count': len(get_products()),
        'orders_count': len(get_orders())
    })

# Initialize database on startup
init_db()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
