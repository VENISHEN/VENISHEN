// Store JavaScript - Customer Side
class Store {
    constructor() {
        this.cart = [];
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadCart();
        this.updateCartUI();
        this.setupAnimations();
    }
    
    setupEventListeners() {
        // Cart toggle
        const cartButton = document.getElementById('cartButton');
        const closeCart = document.getElementById('closeCart');
        const cartOverlay = document.getElementById('cartOverlay');
        const continueShopping = document.getElementById('continueShopping');
        
        if (cartButton) {
            cartButton.addEventListener('click', () => this.toggleCart());
        }
        
        if (closeCart) {
            closeCart.addEventListener('click', () => this.toggleCart());
        }
        
        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => this.toggleCart());
        }
        
        if (continueShopping) {
            continueShopping.addEventListener('click', () => this.toggleCart());
        }
        
        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.addToCart(e));
        });
        
        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.checkout());
        }
    }
    
    setupAnimations() {
        // Animate product cards on load
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    async loadCart() {
        try {
            const response = await fetch('/api/cart');
            const data = await response.json();
            
            if (data.success) {
                this.cart = data.cart;
                this.updateCartUI();
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
        }
    }
    
    async addToCart(e) {
        const button = e.currentTarget;
        const productId = parseInt(button.getAttribute('data-id'));
        
        // Disable button during request
        button.disabled = true;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        
        try {
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: 1
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.cart = data.cart;
                this.updateCartUI();
                this.showToast('Product added to cart!');
                
                // Show cart if not already open
                if (!document.getElementById('cartSidebar').classList.contains('active')) {
                    this.toggleCart();
                }
            } else {
                throw new Error(data.message);
            }
            
        } catch (error) {
            console.error('Add to cart error:', error);
            this.showToast('Failed to add product', 'error');
        } finally {
            // Re-enable button
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }
    
    async removeFromCart(productId) {
        try {
            const response = await fetch('/api/cart/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: productId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.cart = data.cart;
                this.updateCartUI();
                this.showToast('Product removed from cart');
            }
        } catch (error) {
            console.error('Remove from cart error:', error);
            this.showToast('Failed to remove product', 'error');
        }
    }
    
    async updateQuantity(productId, change) {
        // Find item in cart
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;
        
        const newQuantity = item.quantity + change;
        
        if (newQuantity < 1) {
            // Remove if quantity becomes 0
            await this.removeFromCart(productId);
            return;
        }
        
        // Update quantity
        item.quantity = newQuantity;
        
        try {
            // In a real app, you would send update to server
            // For now, we'll just update locally and save to session
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: change // Send delta
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.cart = data.cart;
                this.updateCartUI();
            }
        } catch (error) {
            console.error('Update quantity error:', error);
        }
    }
    
    updateCartUI() {
        // Update cart count
        const cartCount = document.querySelector('.cart-count');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
        
        // Update cart items
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.querySelector('.total-amount');
        
        if (cartItems && cartTotal) {
            if (this.cart.length === 0) {
                cartItems.innerHTML = `
                    <div class="empty-cart">
                        <i class="fas fa-shopping-cart"></i>
                        <p>Your cart is empty</p>
                        <p>Add some products to get started!</p>
                    </div>
                `;
                cartTotal.textContent = '$0.00';
                document.getElementById('checkoutBtn').disabled = true;
            } else {
                let total = 0;
                let itemsHTML = '';
                
                this.cart.forEach(item => {
                    const itemTotal = item.price * item.quantity;
                    total += itemTotal;
                    
                    itemsHTML += `
                        <div class="cart-item" data-id="${item.id}">
                            <div class="cart-item-image">
                                ${item.image}
                            </div>
                            <div class="cart-item-info">
                                <div class="cart-item-name">${item.name}</div>
                                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                                <div class="cart-item-quantity">
                                    <button class="quantity-btn decrease" onclick="store.updateQuantity(${item.id}, -1)">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <span>${item.quantity}</span>
                                    <button class="quantity-btn increase" onclick="store.updateQuantity(${item.id}, 1)">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            <button class="cart-item-remove" onclick="store.removeFromCart(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                });
                
                cartItems.innerHTML = itemsHTML;
                cartTotal.textContent = `$${total.toFixed(2)}`;
                document.getElementById('checkoutBtn').disabled = false;
            }
        }
    }
    
    toggleCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        const cartOverlay = document.getElementById('cartOverlay');
        
        cartSidebar.classList.toggle('active');
        cartOverlay.classList.toggle('active');
        
        // Prevent body scroll when cart is open
        document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : '';
    }
    
    async checkout() {
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast(data.message, 'success');
                this.cart = [];
                this.updateCartUI();
                this.toggleCart();
                
                // Show success message
                setTimeout(() => {
                    alert(`🎉 ${data.message}\nOrder ID: ${data.order_id}`);
                }, 500);
            } else {
                throw new Error(data.message);
            }
            
        } catch (error) {
            console.error('Checkout error:', error);
            this.showToast('Checkout failed: ' + error.message, 'error');
        }
    }
    
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        
        // Set toast color based on type
        if (type === 'error') {
            toast.style.background = '#ff4757';
        } else if (type === 'success') {
            toast.style.background = '#00ff88';
            toast.style.color = '#0a0a0f';
        }
        
        toast.textContent = message;
        toast.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize store when DOM is loaded
let store;
document.addEventListener('DOMContentLoaded', () => {
    store = new Store();
    window.store = store; // Make store globally accessible
});

// Make functions available globally for onclick handlers
window.updateQuantity = (productId, change) => store.updateQuantity(productId, change);
window.removeFromCart = (productId) => store.removeFromCart(productId);
