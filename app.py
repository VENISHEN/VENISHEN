from flask import Flask, render_template, request, jsonify, session, redirect
import os
from datetime import datetime

app = Flask(__name__,
            static_folder='static',
            static_url_path='/static')

app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key')

# =========================
# DATA (prototype storage)
# =========================

STORE_CONFIG = {
    'admin_username': 'admin',
    'admin_password': '123456'
}

PRODUCTS = [
    {
        'id': 1,
        'name': 'Wireless Headphones',
        'price': 129.99,
        'category': 'Electronics',
        'image': '🎧',
        'stock': 15,
        'description': 'Premium wireless headphones',
    },
    {
        'id': 2,
        'name': 'Smart Watch',
        'price': 299.99,
        'category': 'Electronics',
        'image': '⌚',
        'stock': 8,
        'description': 'Fitness tracker watch',
    }
]

ORDERS = []


# =========================
# HELPERS
# =========================

def get_next_id():
    return max([p['id'] for p in PRODUCTS], default=0) + 1

def get_next_order_id():
    return max([o['id'] for o in ORDERS], default=1000) + 1


# =========================
# BEFORE REQUEST (auth guard)
# =========================

@app.before_request
def protect_admin_api():
    if request.path.startswith('/admin/api/'):
        if not session.get('is_admin'):
            return jsonify({'error': 'Unauthorized'}), 401


# =========================
# PAGES
# =========================

@app.route('/')
def home():
    return render_template('store.html', products=PRODUCTS)


@app.route('/user/admin')
def admin_page():
    if session.get('is_admin'):
        return render_template('admin_panel.html', products=PRODUCTS)
    return render_template('neon.html')


# =========================
# AUTH API
# =========================

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')

    if username == STORE_CONFIG['admin_username'] and password == STORE_CONFIG['admin_password']:
        session['is_admin'] = True
        return jsonify({
            'success': True,
            'redirect': '/user/admin'
        })

    return jsonify({
        'success': False,
        'message': 'Invalid credentials'
    }), 401


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})


# =========================
# ADMIN PRODUCT APIs
# =========================

@app.route('/admin/api/products', methods=['GET'])
def get_products():
    return jsonify(PRODUCTS)


@app.route('/admin/api/products/add', methods=['POST'])
def add_product():
    data = request.get_json()

    product = {
        'id': get_next_id(),
        'name': data.get('name'),
        'price': float(data.get('price', 0)),
        'stock': int(data.get('stock', 0)),
        'category': data.get('category'),
        'image': data.get('image', '📦'),
        'description': data.get('description', '')
    }

    PRODUCTS.append(product)

    return jsonify({'success': True, 'product': product})


@app.route('/admin/api/products/update/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    data = request.get_json()

    product = next((p for p in PRODUCTS if p['id'] == product_id), None)
    if not product:
        return jsonify({'success': False, 'message': 'Not found'}), 404

    product['name'] = data.get('name', product['name'])
    product['price'] = float(data.get('price', product['price']))
    product['stock'] = int(data.get('stock', product['stock']))
    product['category'] = data.get('category', product['category'])
    product['image'] = data.get('image', product['image'])
    product['description'] = data.get('description', product['description'])

    return jsonify({'success': True, 'product': product})


@app.route('/admin/api/products/delete/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    global PRODUCTS

    PRODUCTS = [p for p in PRODUCTS if p['id'] != product_id]

    return jsonify({'success': True})


# =========================
# CART API
# =========================

@app.route('/api/cart', methods=['GET'])
def get_cart():
    return jsonify({'success': True, 'cart': session.get('cart', [])})


@app.route('/api/cart/add', methods=['POST'])
def add_to_cart():
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)

    product = next((p for p in PRODUCTS if p['id'] == product_id), None)
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404

    cart = session.get('cart', [])
    item = next((i for i in cart if i['id'] == product_id), None)

    if item:
        item['quantity'] = max(1, item['quantity'] + quantity)
    else:
        cart.append({
            'id': product['id'],
            'name': product['name'],
            'price': product['price'],
            'image': product['image'],
            'quantity': max(1, quantity)
        })

    session['cart'] = cart
    return jsonify({'success': True, 'cart': cart})


@app.route('/api/cart/remove', methods=['POST'])
def remove_from_cart():
    data = request.get_json()
    product_id = data.get('product_id')

    cart = [i for i in session.get('cart', []) if i['id'] != product_id]
    session['cart'] = cart

    return jsonify({'success': True, 'cart': cart})


# =========================
# ORDERS (optional prototype)
# =========================

@app.route('/api/orders', methods=['GET'])
def orders():
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify(ORDERS)


@app.route('/api/checkout', methods=['POST'])
def checkout():
    cart = session.get('cart', [])

    if not cart:
        return jsonify({'success': False, 'message': 'Cart empty'}), 400

    total = sum(item['price'] * item['quantity'] for item in cart)

    order = {
        'id': get_next_order_id(),
        'items': cart,
        'total': total,
        'timestamp': datetime.now().isoformat()
    }

    ORDERS.append(order)
    session['cart'] = []

    return jsonify({
        'success': True,
        'message': 'Order placed successfully!',
        'order_id': order['id'],
        'order': order
    })


# =========================
# RUN
# =========================

if __name__ == '__main__':
    app.run(debug=True)
