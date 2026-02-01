// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.products = [];
        this.productToDelete = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadProducts();
        this.setupAuthCheck();
        this.setupTabCloseWarning();
    }
    
    setupAuthCheck() {
        // Check if user is authenticated
        this.checkAuth().then(isAuthenticated => {
            if (!isAuthenticated) {
                // Redirect to login if not authenticated
                window.location.href = '/user/admin';
            }
        });
    }
    
    setupTabCloseWarning() {
        // Warn user about session ending on tab close
        window.addEventListener('beforeunload', (e) => {
            // This shows a warning when user tries to close the tab
            // But we can't prevent it, just warn
            e.returnValue = 'Your admin session will end when you close this tab. Are you sure?';
        });
    }
    
    async checkAuth() {
        try {
            const response = await fetch('/admin/api/products');
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    setupEventListeners() {
        // Modal buttons
        const addProductBtn = document.getElementById('addProductBtn');
        const modalClose = document.getElementById('modalClose');
        const modalCancel = document.getElementById('modalCancel');
        const modalSave = document.getElementById('modalSave');
        const confirmCancel = document.getElementById('confirmCancel');
        const confirmDelete = document.getElementById('confirmDelete');
        
        if (addProductBtn) addProductBtn.addEventListener('click', () => this.openAddModal());
        if (modalClose) modalClose.addEventListener('click', () => this.closeModal());
        if (modalCancel) modalCancel.addEventListener('click', () => this.closeModal());
        if (modalSave) modalSave.addEventListener('click', () => this.saveProduct());
        if (confirmCancel) confirmCancel.addEventListener('click', () => this.closeConfirmModal());
        if (confirmDelete) confirmDelete.addEventListener('click', () => this.deleteProduct());
        
        // Close modals on overlay click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (modal.id === 'productModal') this.closeModal();
                    if (modal.id === 'confirmModal') this.closeConfirmModal();
                }
            });
        });
        
        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeConfirmModal();
            }
        });
    }
    
    async loadProducts() {
        try {
            const response = await fetch('/admin/api/products');
            
            if (response.status === 401) {
                // Unauthorized - redirect to login
                window.location.href = '/user/admin';
                return;
            }
            
            if (!response.ok) {
                throw new Error('Failed to load products');
            }
            
            this.products = await response.json();
            this.renderProducts();
            this.updateStats();
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showToast('Failed to load products', 'error');
            
            // Check if it's an auth error
            if (error.message.includes('401')) {
                window.location.href = '/user/admin';
            }
        }
    }
    
    renderProducts() {
        const tableBody = document.getElementById('productsTableBody');
        
        if (this.products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem;">
                        <div style="color: #94a3b8;">
                            <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                            <p>No products found</p>
                            <p>Add your first product to get started!</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        
        this.products.forEach(product => {
            const stockClass = product.stock > 10 ? 'stock-high' : 
                              product.stock > 0 ? 'stock-medium' : 'stock-low';
            
            html += `
                <tr class="product-row">
                    <td>#${product.id}</td>
                    <td>
                        <div class="product-cell">
                            <div class="product-emoji">${product.image}</div>
                            <div class="product-info">
                                <h4>${product.name}</h4>
                                <span class="category">${product.category}</span>
                            </div>
                        </div>
                    </td>
                    <td>${product.category}</td>
                    <td class="price-cell">$${product.price.toFixed(2)}</td>
                    <td>
                        <span class="stock-cell ${stockClass}">
                            ${product.stock} units
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit-btn" onclick="admin.editProduct(${product.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" onclick="admin.confirmDelete(${product.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    }
    
    updateStats() {
        const totalProducts = this.products.length;
        const totalStock = this.products.reduce((sum, p) => sum + p.stock, 0);
        const totalValue = this.products.reduce((sum, p) => sum + (p.price * p.stock), 0);
        const lowStock = this.products.filter(p => p.stock <= 5 && p.stock > 0).length;
        
        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('totalStock').textContent = totalStock;
        document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('lowStock').textContent = lowStock;
    }
    
    openAddModal() {
        document.getElementById('modalTitle').textContent = 'Add New Product';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        
        // Clear emoji selection
        document.querySelectorAll('input[name="emoji"]').forEach(radio => {
            radio.checked = false;
        });
        
        document.getElementById('productModal').classList.add('active');
    }
    
    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productDescription').value = product.description;
        
        // Set emoji selection
        document.querySelectorAll('input[name="emoji"]').forEach(radio => {
            radio.checked = radio.value === product.image;
        });
        
        document.getElementById('productModal').classList.add('active');
    }
    
    closeModal() {
        document.getElementById('productModal').classList.remove('active');
    }
    
    async saveProduct() {
        const productId = document.getElementById('productId').value;
        const name = document.getElementById('productName').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
        const stock = parseInt(document.getElementById('productStock').value);
        const category = document.getElementById('productCategory').value;
        const description = document.getElementById('productDescription').value.trim();
        
        // Get selected emoji
        const emojiInput = document.querySelector('input[name="emoji"]:checked');
        const image = emojiInput ? emojiInput.value : '📦';
        
        // Validation
        if (!name || !price || price <= 0 || stock < 0 || !category) {
            this.showToast('Please fill all required fields correctly', 'error');
            return;
        }
        
        const productData = {
            name,
            price,
            stock,
            category,
            image,
            description
        };
        
        try {
            let response;
            
            if (productId) {
                // Update existing product
                response = await fetch(`/admin/api/products/update/${productId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(productData)
                });
            } else {
                // Add new product
                response = await fetch('/admin/api/products/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(productData)
                });
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast(`Product ${productId ? 'updated' : 'added'} successfully!`);
                this.closeModal();
                await this.loadProducts(); // Reload products
            } else {
                throw new Error(data.message || 'Operation failed');
            }
            
        } catch (error) {
            console.error('Save product error:', error);
            this.showToast(error.message || 'Failed to save product', 'error');
        }
    }
    
    confirmDelete(productId) {
        this.productToDelete = productId;
        document.getElementById('confirmModal').classList.add('active');
    }
    
    closeConfirmModal() {
        this.productToDelete = null;
        document.getElementById('confirmModal').classList.remove('active');
    }
    
    async deleteProduct() {
        if (!this.productToDelete) return;
        
        try {
            const response = await fetch(`/admin/api/products/delete/${this.productToDelete}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Product deleted successfully!');
                this.closeConfirmModal();
                await this.loadProducts(); // Reload products
            } else {
                throw new Error(data.message || 'Delete failed');
            }
            
        } catch (error) {
            console.error('Delete product error:', error);
            this.showToast(error.message || 'Failed to delete product', 'error');
        }
    }
    
    showToast(message, type = 'success') {
        const toast = document.getElementById('adminToast');
        
        // Set toast style based on type
        toast.style.background = type === 'error' ? '#ff4757' : '#00ff88';
        toast.style.color = type === 'error' ? 'white' : '#0a0a0f';
        
        // Set icon based on type
        const icon = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
        toast.innerHTML = `<i class="${icon}"></i> ${message}`;
        
        toast.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize admin panel
let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new AdminPanel();
    window.admin = admin; // Make globally accessible
});

// Make functions available globally for onclick handlers
window.editProduct = (id) => admin.editProduct(id);
window.confirmDelete = (id) => admin.confirmDelete(id);