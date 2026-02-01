from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import os
import json
import time

app = Flask(__name__, 
            static_folder='static',
            static_url_path='/static')

# Use a permanent session that expires when browser closes
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['SESSION_PERMANENT'] = False  # Session ends when browser closes
app.config['PERMANENT_SESSION_LIFETIME'] = 1800  # 30 minutes max if browser stays open

# Store configuration
STORE_CONFIG = {
    'admin_username': 'admin',
    'admin_password': '#Pass#@!'
}

# Sample products database - Now in a mutable list
PRODUCTS = [
    {
        'id': 1,
        'name': 'Wireless Headphones',
        'price': 129.99,
        'category': 'Electronics',
        'image': '🎧',
        'stock': 15,
        'description': 'Premium wireless headphones with noise cancellation'
    },
    {
        'id': 2,
        'name': 'Smart Watch',
        'price': 299.99,
        'category': 'Electronics',
        'image': '⌚',
        'stock': 8,
        'description': 'Fitness tracker with heart rate monitor'
    },
    {
        'id': 3,
        'name': 'Gaming Laptop',
        'price': 1299.99,
        'category': 'Computers',
        'image': '💻',
        'stock': 5,
        'description': 'High-performance gaming laptop with RTX graphics'
    },
    {
        'id': 4,
        'name': 'Coffee Maker',
        'price': 89.99,
        'category': 'Home',
        'image': '☕',
        'stock': 20,
        'description': 'Programmable coffee maker with thermal carafe'
    },
    {
        'id': 5,
        'name': 'Running Shoes',
        'price': 79.99,
        'category': 'Sports',
        'image': '👟',
        'stock': 12,
        'description': 'Lightweight running shoes with cushioning'
    },
    {
        'id': 6,
        'name': 'Backpack',
        'price': 49.99,
        'category': 'Accessories',
        'image': '🎒',
        'stock': 25,
        'description': 'Water-resistant backpack with laptop compartment'
    }
]

# Helper to get next product ID
def get_next_id():
    if not PRODUCTS:
        return 1
    return max(p['id'] for p in PRODUCTS) + 1

@app.before_request
def check_auth():
    # Check if accessing admin panel without auth
    if request.path.startswith('/admin/') and not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Initialize cart if not exists
    if 'cart' not in session:
        session['cart'] = []

@app.route('/')
def home():
    return render_template('store.html', products=PRODUCTS)

@app.route('/user')
def user_dashboard():
    return render_template('store.html', products=PRODUCTS)

@app.route('/user/admin')
def admin_panel():
    if session.get('is_admin'):
        return render_template('admin_panel.html', products=PRODUCTS)
    return render_template('neon.html')

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if username == STORE_CONFIG['admin_username'] and password == STORE_CONFIG['admin_password']:
            session['is_admin'] = True
            session['username'] = username
            # Set session to non-permanent (expires when browser closes)
            session.permanent = False
            return jsonify({
                'success': True,
                'message': 'Login successful!',
                'redirect': '/user/admin'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid credentials!'
            }), 401
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Server error'
        }), 500

# Admin product management APIs
@app.route('/admin/api/products', methods=['GET'])
def get_products():
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify(PRODUCTS)

@app.route('/admin/api/products/add', methods=['POST'])
def add_product():
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        
        new_product = {
            'id': get_next_id(),
            'name': data.get('name', '').strip(),
            'price': float(data.get('price', 0)),
            'category': data.get('category', '').strip(),
            'image': data.get('image', '📦'),
            'stock': int(data.get('stock', 0)),
            'description': data.get('description', '').strip()
        }
        
        PRODUCTS.append(new_product)
        return jsonify({'success': True, 'product': new_product})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/api/products/update/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json()
        
        for product in PRODUCTS:
            if product['id'] == product_id:
                product.update({
                    'name': data.get('name', product['name']).strip(),
                    'price': float(data.get('price', product['price'])),
                    'category': data.get('category', product['category']).strip(),
                    'image': data.get('image', product['image']),
                    'stock': int(data.get('stock', product['stock'])),
                    'description': data.get('description', product['description']).strip()
                })
                return jsonify({'success': True, 'product': product})
        
        return jsonify({'success': False, 'message': 'Product not found'}), 404
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/api/products/delete/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        global PRODUCTS
        PRODUCTS = [p for p in PRODUCTS if p['id'] != product_id]
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Store APIs (same as before)
@app.route('/api/cart/add', methods=['POST'])
def add_to_cart():
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        product = next((p for p in PRODUCTS if p['id'] == product_id), None)
        
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        cart = session.get('cart', [])
        
        for item in cart:
            if item['id'] == product_id:
                item['quantity'] += quantity
                break
        else:
            cart.append({
                'id': product_id,
                'name': product['name'],
                'price': product['price'],
                'image': product['image'],
                'quantity': quantity
            })
        
        session['cart'] = cart
        return jsonify({'success': True, 'cart': cart})
        
    except Exception as e:
        return jsonify({'success': False, 'message': 'Server error'}), 500

@app.route('/api/cart/remove', methods=['POST'])
def remove_from_cart():
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        
        cart = session.get('cart', [])
        cart = [item for item in cart if item['id'] != product_id]
        
        session['cart'] = cart
        return jsonify({'success': True, 'cart': cart})
        
    except Exception as e:
        return jsonify({'success': False, 'message': 'Server error'}), 500

@app.route('/api/cart', methods=['GET'])
def get_cart():
    cart = session.get('cart', [])
    total = sum(item['price'] * item['quantity'] for item in cart)
    
    return jsonify({
        'success': True,
        'cart': cart,
        'total': total,
        'count': len(cart)
    })

@app.route('/api/checkout', methods=['POST'])
def checkout():
    try:
        session['cart'] = []
        return jsonify({
            'success': True,
            'message': 'Order placed successfully! Thank you for your purchase.',
            'order_id': f"ORD-{int(time.time())}"
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': 'Checkout failed'}), 500

if __name__ == '__main__':
    app.run(debug=True)