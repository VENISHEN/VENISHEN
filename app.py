from flask import Flask, render_template, request, jsonify, session, redirect
import os
from datetime import datetime
import db

app = Flask(__name__,
            static_folder='static',
            static_url_path='/static')

app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key')

db.init_db()

STORE_CONFIG = {
    'admin_username': 'admin',
    'admin_password': '123456'
}


@app.before_request
def protect_admin_api():
    if request.path.startswith('/admin/api/'):
        if not session.get('is_admin'):
            return jsonify({'error': 'Unauthorized'}), 401


@app.route('/')
def home():
    products = db.get_all_products()
    return render_template('store.html', products=products)


@app.route('/user/admin')
def admin_page():
    if session.get('is_admin'):
        products = db.get_all_products()
        return render_template('admin_panel.html', products=products)
    return render_template('neon.html')


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if username == STORE_CONFIG['admin_username'] and password == STORE_CONFIG['admin_password']:
        session['is_admin'] = True
        return jsonify({'success': True, 'redirect': '/user/admin'})

    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})


@app.route('/admin/api/products', methods=['GET'])
def get_products():
    return jsonify(db.get_all_products())


@app.route('/admin/api/products/add', methods=['POST'])
def api_add_product():
    data = request.get_json()
    product = db.add_product(data)
    return jsonify({'success': True, 'product': product})


@app.route('/admin/api/products/update/<int:product_id>', methods=['PUT'])
def api_update_product(product_id):
    data = request.get_json()
    product = db.update_product(product_id, data)
    if not product:
        return jsonify({'success': False, 'message': 'Not found'}), 404
    return jsonify({'success': True, 'product': product})


@app.route('/admin/api/products/delete/<int:product_id>', methods=['DELETE'])
def api_delete_product(product_id):
    db.delete_product(product_id)
    return jsonify({'success': True})


@app.route('/api/cart', methods=['GET'])
def get_cart():
    return jsonify({'success': True, 'cart': session.get('cart', [])})


@app.route('/api/cart/add', methods=['POST'])
def add_to_cart():
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)

    product = db.get_product(product_id)
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404

    cart = session.get('cart', [])
    item = next((i for i in cart if i['id'] == product_id), None)
    current_qty_in_cart = item['quantity'] if item else 0
    new_qty = max(1, current_qty_in_cart + quantity)

    if new_qty > product['stock']:
        return jsonify({
            'success': False,
            'message': f"Only {product['stock']} left in stock"
        }), 400

    if item:
        item['quantity'] = new_qty
    else:
        cart.append({
            'id': product['id'],
            'name': product['name'],
            'price': product['price'],
            'image': product['image'],
            'quantity': new_qty
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


@app.route('/api/checkout', methods=['POST'])
def checkout():
    cart = session.get('cart', [])

    if not cart:
        return jsonify({'success': False, 'message': 'Cart empty'}), 400

    for item in cart:
        current = db.get_product(item['id'])
        if not current or current['stock'] < item['quantity']:
            return jsonify({
                'success': False,
                'message': f"Not enough stock for {item['name']}"
            }), 400

    total = sum(item['price'] * item['quantity'] for item in cart)
    order = db.create_order(cart, total)

    session['cart'] = []

    return jsonify({
        'success': True,
        'message': 'Order placed! Waiting for approval and shipping.',
        'order_id': order['invoice_no'],
        'order': order
    })


# =========================
# ADMIN ORDERS
# =========================

@app.route('/admin/api/orders/pending', methods=['GET'])
def api_pending_orders():
    return jsonify(db.get_pending_orders())


@app.route('/admin/api/orders/approve/<int:order_id>', methods=['POST'])
def api_approve_order(order_id):
    order = db.approve_order(order_id)
    if not order:
        return jsonify({'success': False, 'message': 'Order not found or already processed'}), 404
    return jsonify({'success': True, 'order': order})


@app.route('/admin/api/stats/sales', methods=['GET'])
def api_sales_stats():
    return jsonify(db.get_sales_stats())


if __name__ == '__main__':
    app.run(debug=True)
