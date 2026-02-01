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
                    'Content-Type': 'application
