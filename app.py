from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_from_directory
import os

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Store configuration
STORE_CONFIG = {
    'admin_username': 'admin',
    'admin_password': '#Pass#@!'
}

# Protected routes that require admin authentication
PROTECTED_ROUTES = ['/user/admin']

@app.before_request
def check_auth():
    # Check if accessing protected route
    if request.path in PROTECTED_ROUTES:
        # Check if user is authenticated as admin
        if not session.get('is_admin'):
            # If not authenticated, show login page
            return render_template('neon.html')

@app.route('/')
def home():
    """Main dashboard/store homepage"""
    return render_template('dashboard.html')

@app.route('/user')
def user_dashboard():
    """User dashboard"""
    return render_template('dashboard.html')

@app.route('/user/admin')
def admin_panel():
    """Admin panel - only accessible with proper credentials"""
    if session.get('is_admin'):
        return render_template('admin_panel.html')
    return redirect(url_for('home'))

@app.route('/api/login', methods=['POST'])
def login():
    """Handle login requests"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        print(f"Login attempt: {username}, {password}")  # Debug
        
        # Check admin credentials
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
        print(f"Login error: {e}")  # Debug
        return jsonify({
            'success': False,
            'message': 'Server error. Please try again.'
        }), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """Handle logout"""
    session.clear()
    return jsonify({
        'success': True,
        'message': 'Logged out successfully',
        'redirect': '/'
    })

@app.route('/api/check-auth', methods=['GET'])
def check_auth_status():
    """Check if user is authenticated"""
    return jsonify({
        'is_authenticated': session.get('is_admin', False),
        'username': session.get('username')
    })

if __name__ == '__main__':
    app.run(debug=True)