from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import os
import json

app = Flask(__name__, 
            static_folder='static',
            static_url_path='/static')
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-here')

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

@app.before_request
def check_auth():
    # Check if accessing admin panel without auth
    if request.path == '/user/admin' and not session.get('is_admin'):
        return render_template('neon.html')
    
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
    return redirect('/')

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if username == STORE_CONFIG['admin_username'] and password == STORE_CONFIG['admin_password']:
            session['is_admin'] = True
            session['username'] = username
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

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({
        'success': True,
        'message': 'Logged out',
        'redirect': '/'
    })

# Store APIs
@app.route('/api/cart/add', methods=['POST'])
def add_to_cart():
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        # Find product
        product = next((p for p in PRODUCTS if p['id'] == product_id), None)
        
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        # Add to cart
        cart = session.get('cart', [])
        
        # Check if product already in cart
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
        # In a real app, you would process payment here
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
