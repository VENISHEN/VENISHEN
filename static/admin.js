// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.products = [];
        this.productToDelete = null;
        this.orderToApprove = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadProducts();
        this.loadPendingOrders();
        this.loadSalesStats();
        this.setupAuthCheck();
        this.setupTabCloseWarning();
    }
    
    setupAuthCheck() {
        this.checkAuth().then(isAuthenticated => {
            if (!isAuthenticated) {
                window.location.href = '/user/admin';
            }
        });
    }
    
    setupTabCloseWarning() {
        window.addEventListener('beforeunload', (e) => {
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
        const addProductBtn = document.getElementById('addProductBtn');
        const modalClose = document.getElementById('modalClose');
        const modalCancel = document.getElementById('modalCancel');
        const modalSave = document.getElementById('modalSave');
        const confirmCancel = document.getElementById('confirmCancel');
        const confirmDelete = document.getElementById('confirmDelete');
        const invoiceModalClose = document.getElementById('invoiceModalClose');
        const invoiceCancel = document.getElementById('invoiceCancel');
        const invoiceConfirmApprove = document.getElementById('invoiceConfirmApprove');
        
        if (addProductBtn) addProductBtn.addEventListener('click', () => this.openAddModal());
        if (modalClose) modalClose.addEventListener('click', () => this.closeModal());
        if (modalCancel) modalCancel.addEventListener('click', () => this.closeModal());
        if (modalSave) modalSave.addEventListener('click', () => this.saveProduct());
        if (confirmCancel) confirmCancel.addEventListener('click', () => this.closeConfirmModal());
        if (confirmDelete) confirmDelete.addEventListener('click', () => this.deleteProduct());
        if (invoiceModalClose) invoiceModalClose.addEventListener('click', () => this.closeInvoiceModal());
        if (invoiceCancel) invoiceCancel.addEventListener('click', () => this.closeInvoiceModal());
        if (invoiceConfirmApprove) invoiceConfirmApprove.addEventListener('click', () => this.approveOrder());
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (modal.id === 'productModal') this.closeModal();
                    if (modal.id === 'confirmModal') this.closeConfirmModal();
                    if (modal.id === 'invoiceModal') this.closeInvoiceModal();
                }
            });
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeConfirmModal();
                this.closeInvoiceModal();
            }
        });
    }
    
    async loadProducts() {
        try {
            const response = await fetch('/admin/api/products');
            
            if (response.status === 401) {
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
            
            if (error.message.includes('401')) {
                window.location.href = '/user/admin';
            }
        }
    }

    async loadPendingOrders() {
        try {
            const response = await fetch('/admin/api/orders/pending');
            if (!response.ok) throw new Error('Failed to load orders');

            this.pendingOrders = await response.json();
            this.renderPendingOrders();
        } catch (error) {
            console.error('Error loading pending orders:', error);
        }
    }

    async loadSalesStats() {
        try {
            const response = await fetch('/admin/api/stats/sales');
            if (!response.ok) throw new Error('Failed to load sales stats');

            const stats = await response.json();
            document.getElementById('totalRevenue').textContent = `$${stats.total_revenue.toFixed(2)}`;
            document.getElementById('totalItemsSold').textContent = stats.total_items_sold;
        } catch (error) {
            console.error('Error loading sales stats:', error);
        }
    }

    renderPendingOrders() {
        const tbody = document.getElementById('pendingOrdersBody');

        if (!this.pendingOrders || this.pendingOrders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-pending">
                        <i class="fas fa-check-circle"></i> No pending orders right now.
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        this.pendingOrders.forEach(order => {
            const itemsPreview = order.items
                .map(i => `${i.quantity}x ${i.name}`)
                .join(', ');

            const placedDate = new Date(order.created_at).toLocaleString();

            html += `
                <tr>
                    <td><span class="invoice-badge">${order.invoice_no}</span></td>
                    <td><span class="order-items-preview">${itemsPreview}</span></td>
                    <td class="price-cell">$${order.total.toFixed(2)}</td>
                    <td>${placedDate}</td>
                    <td>
                        <button class="approve-btn" onclick="admin.openInvoiceModal(${order.id})">
                            <i class="fas fa-truck"></i> Review & Ship
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    openInvoiceModal(orderId) {
        const order = this.pendingOrders.find(o => o.id === orderId);
        if (!order) return;

        this.orderToApprove = orderId;

        document.getElementById('invoiceNo').textContent = order.invoice_no;

        let itemsHtml = '';
        order.items.forEach(item => {
            itemsHtml += `
                <div class="invoice-modal-row">
                    <span>${item.quantity} x ${item.name}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `;
        });
        document.getElementById('invoiceItemsList').innerHTML = itemsHtml;
        document.getElementById('invoiceTotal').textContent = `$${order.total.toFixed(2)}`;

        document.getElementById('invoiceModal').classList.add('active');
    }

    closeInvoiceModal() {
        this.orderToApprove = null;
        document.getElementById('invoiceModal').classList.remove('active');
    }

    async approveOrder() {
        if (!this.orderToApprove) return;

        try {
            const response = await fetch(`/admin/api/orders/approve/${this.orderToApprove}`, {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('Order approved and stock updated!');
                this.closeInvoiceModal();
                await this.loadPendingOrders();
                await this.loadProducts();
                await this.loadSalesStats();
            } else {
                throw new Error(data.message || 'Approval failed');
            }
        } catch (error) {
            console.error('Approve order error:', error);
            this.showToast(error.message || 'Failed to approve order', 'error');
        }
    }
    
    renderProducts() {
        const tableBody = document.getElementById('productsTableBody');
        
        if (this.products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 4rem;">
                        <div class="empty-state">
                            <i class="fas fa-box-open"></i>
                            <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;">No products found</p>
                            <p style="color: var(--admin-text-muted); margin-bottom: 1.5rem;">Add your first product to get started!</p>
                            <button class="btn-primary" onclick="admin.openAddModal()">
                                <i class="fas fa-plus"></i> Add First Product
                            </button>
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
        
        const emojiInput = document.querySelector('input[name="emoji"]:checked');
        const image = emojiInput ? emojiInput.value : '📦';
        
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
                response = await fetch(`/admin/api/products/update/${productId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(productData)
                });
            } else {
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
                await this.loadProducts();
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
                await this.loadProducts();
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
        
        toast.style.background = type === 'error' ? '#ff4757' : '#00ff88';
        toast.style.color = type === 'error' ? 'white' : '#0a0a0f';
        
        const icon = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
        toast.innerHTML = `<i class="${icon}"></i> ${message}`;
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize admin panel
let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new AdminPanel();
    window.admin = admin;
});

window.editProduct = (id) => admin.editProduct(id);
window.confirmDelete = (id) => admin.confirmDelete(id);
