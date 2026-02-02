from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import os
import json
import time
from datetime import datetime

app = Flask(__name__, 
            static_folder='static',
            static_url_path='/static')

app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['SESSION_PERMANENT'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = 1800

# Store configuration
STORE_CONFIG = {
    'admin_username': 'admin',
    'admin_password': '#Pass#@!'
}

# Sample products database
PRODUCTS = [
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
    },
    {
        'id': 7,
        'name': 'Bluetooth Speaker',
        'price': 69.99,
        'category': 'Electronics',
        'image': '🔊',
        'stock': 18,
        'description': 'Portable speaker with 12-hour battery'
    },
    {
        'id': 8,
        'name': 'Desk Lamp',
        'price': 39.99,
        'category': 'Home',
        'image': '💡',
        'stock': 30,
        'description': 'Adjustable LED desk lamp with touch controls'
    }
]

# Orders database
ORDERS = []

def get_next_id():
    if not PRODUCTS:
        return 1
    return max(p['id'] for p in PRODUCTS) + 1

def get_next_order_id():
    if not ORDERS:
        return 1001
    return max(o['id'] for o in ORDERS) + 1

@app.before_request
def check_auth():
    if request.path.startswith('/admin/') and not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    if 'cart' not in session:
        session['cart'] = []

@app.route('/')
def home():
    featured = [p for p in PRODUCTS if p.get('featured', False)]
    categories = list(set(p['category'] for p in PRODUCTS))
    return render_template('store.html', 
                         products=PRODUCTS, 
                         featured=featured,
                         categories=categories)

@app.route('/user')
def user_dashboard():
    return redirect('/')

@app.route('/user/admin')
def admin_panel():
    if session.get('is_admin'):
        recent_orders = ORDERS[-5:] if len(ORDERS) > 5 else ORDERS
        return render_template('admin_panel.html', 
                             products=PRODUCTS, 
                             orders=recent_orders,
                             total_orders=len(ORDERS))
    return render_template('neon.html')

# ... [Keep all previous API endpoints: /api/login, /api/cart/*, etc.] ...

# Add these new order endpoints:

@app.route('/api/orders', methods=['GET'])
def get_orders():
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify(ORDERS)

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
            'customer_name': 'Guest Customer',  # In real app, get from user
            'customer_email': 'guest@example.com'
        }
        
        # Update product stock
        for item in cart:
            product = next((p for p in PRODUCTS if p['id'] == item['id']), None)
            if product:
                product['stock'] = max(0, product['stock'] - item['quantity'])
        
        # Add to orders
        ORDERS.append(order)
        
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
        
        order = next((o for o in ORDERS if o['id'] == order_id), None)
        if not order:
            return jsonify({'success': False, 'message': 'Order not found'}), 404
        
        order['status'] = new_status
        return jsonify({'success': True, 'order': order})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)