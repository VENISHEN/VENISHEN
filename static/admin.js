// Admin Panel Scripts
class AdminPanel {
    constructor() {
        this.currentSection = 'overview';
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupMenu();
        this.loadAdminData();
        this.setupAnimations();
        this.setupLogout();
        this.setupHelpSupport();
    }
    
    setupEventListeners() {
        // Menu items
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleMenuClick(e));
        });
        
        // Action buttons
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleActionClick(e));
        });
        
        // Product actions
        const editButtons = document.querySelectorAll('.edit-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => this.editProduct(e));
        });
        
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => this.deleteProduct(e));
        });
        
        // View all orders button
        const viewAllBtn = document.querySelector('.view-all-btn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => this.viewAllOrders());
        }
        
        // Add product button
        const addProductBtn = document.querySelector('.add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => this.addProduct());
        }
        
        // Help button
        const helpBtn = document.querySelector('.help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.showHelp());
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }
    
    setupMenu() {
        // Highlight current section based on URL hash
        const hash = window.location.hash.substring(1) || 'overview';
        this.switchSection(hash);
        
        // Update menu active states
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${hash}`) {
                item.classList.add('active');
            }
        });
    }
    
    handleMenuClick(e) {
        e.preventDefault();
        const menuItem = e.currentTarget;
        const section = menuItem.getAttribute('href').substring(1);
        
        // Update active state
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        menuItem.classList.add('active');
        
        // Switch section
        this.switchSection(section);
        
        // Add click animation
        menuItem.style.transform = 'scale(0.95)';
        setTimeout(() => {
            menuItem.style.transform = '';
        }, 150);
        
        // Update URL hash
        window.location.hash = section;
    }
    
    switchSection(section) {
        this.currentSection = section;
        
        // Hide all sections (in a real app, you'd have actual section elements)
        // For now, just update the page content
        const sectionTitles = {
            'overview': 'Dashboard Overview',
            'analytics': 'Analytics Dashboard',
            'products': 'Product Management',
            'orders': 'Order Management',
            'customers': 'Customer Management',
            'settings': 'System Settings',
            'security': 'Security Settings',
            'logs': 'Activity Logs'
        };
        
        const welcomeHeader = document.querySelector('.welcome-header h2');
        if (welcomeHeader) {
            welcomeHeader.textContent = sectionTitles[section] || 'Admin Panel';
        }
        
        // Show notification
        this.showNotification(`Switched to ${sectionTitles[section] || section}`, 'info');
    }
    
    handleActionClick(e) {
        const button = e.currentTarget;
        const action = button.className.includes('view-btn') ? 'view' :
                      button.className.includes('process-btn') ? 'process' :
                      button.className.includes('track-btn') ? 'track' : 'action';
        
        // Add click animation
        button.style.transform = 'scale(0.9)';
        button.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.5)';
        
        setTimeout(() => {
            button.style.transform = '';
            button.style.boxShadow = '';
        }, 150);
        
        const messages = {
            'view': 'Viewing order details...',
            'process': 'Processing order...',
            'track': 'Tracking shipment...'
        };
        
        if (messages[action]) {
            this.showNotification(messages[action], 'info');
        }
    }
    
    editProduct(e) {
        const button = e.currentTarget;
        const productCard = button.closest('.product-card');
        const productName = productCard.querySelector('h4').textContent;
        
        // Add animation
        button.style.transform = 'scale(0.9)';
        button.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.5)';
        
        setTimeout(() => {
            button.style.transform = '';
            button.style.boxShadow = '';
        }, 150);
        
        this.showNotification(`Editing "${productName}"...`, 'info');
    }
    
    deleteProduct(e) {
        const button = e.currentTarget;
        const productCard = button.closest('.product-card');
        const productName = productCard.querySelector('h4').textContent;
        
        // Add animation
        button.style.transform = 'scale(0.9)';
        button.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.5)';
        
        setTimeout(() => {
            button.style.transform = '';
            button.style.boxShadow = '';
        }, 150);
        
        // Show confirmation dialog
        if (confirm(`Are you sure you want to delete "${productName}"?`)) {
            // In a real app, you would make an API call here
            productCard.style.opacity = '0';
            productCard.style.transform = 'scale(0.8)';
            productCard.style.marginLeft = '100%';
            
            setTimeout(() => {
                productCard.style.display = 'none';
                this.showNotification(`Deleted "${productName}"`, 'success');
            }, 300);
        }
    }
    
    viewAllOrders() {
        this.showNotification('Loading all orders...', 'info');
        // In a real app, you would navigate to the orders page or load more data
    }
    
    addProduct() {
        this.showNotification('Opening product creation form...', 'info');
        // In a real app, you would show a modal or navigate to a form
    }
    
    async loadAdminData() {
        // Simulate loading admin data
        try {
            // Add loading animation to stats
            const statValues = document.querySelectorAll('.stat-value');
            statValues.forEach(stat => {
                const originalText = stat.textContent;
                stat.textContent = '...';
                
                setTimeout(() => {
                    stat.textContent = originalText;
                    stat.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        stat.style.transform = '';
                    }, 300);
                }, 800 + Math.random() * 800);
            });
            
        } catch (error) {
            console.error('Failed to load admin data:', error);
            this.showNotification('Failed to load data. Please try again.', 'error');
        }
    }
    
    setupAnimations() {
        // Add entrance animations
        const animateElements = (elements, delay = 100) => {
            elements.forEach((element, index) => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, index * delay);
            });
        };
        
        // Animate stat cards
        const statCards = document.querySelectorAll('.stat-card');
        animateElements(statCards, 150);
        
        // Animate table rows
        const tableRows = document.querySelectorAll('.orders-table tbody tr');
        setTimeout(() => animateElements(tableRows, 50), 300);
        
        // Animate product cards
        const productCards = document.querySelectorAll('.product-card');
        setTimeout(() => animateElements(productCards, 100), 500);
        
        // Add pulse animation to system status
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) {
            setInterval(() => {
                statusIndicator.style.boxShadow = '0 0 0 0 rgba(16, 185, 129, 0.7)';
                setTimeout(() => {
                    statusIndicator.style.boxShadow = '0 0 0 10px rgba(16, 185, 129, 0)';
                }, 300);
            }, 2000);
        }
    }
    
    setupLogout() {
        // Logout function will be called by the button's onclick attribute
        window.logoutAdmin = async () => {
            try {
                const response = await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    this.showNotification('Logged out successfully', 'success');
                    setTimeout(() => {
                        window.location.href = result.redirect || '/';
                    }, 1000);
                } else {
                    throw new Error(result.message || 'Logout failed');
                }
                
            } catch (error) {
                console.error('Logout error:', error);
                this.showNotification('Logout failed. Please try again.', 'error');
            }
        };
    }
    
    setupHelpSupport() {
        // This would be expanded with actual help functionality
        window.showHelpModal = () => {
            this.showNotification('Opening help center...', 'info');
        };
    }
    
    handleKeyboardShortcuts(e) {
        // Ctrl + S: Save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.showNotification('Saving changes...', 'info');
        }
        
        // Ctrl + L: Logout
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            logoutAdmin();
        }
        
        // Esc: Close modal or clear selection
        if (e.key === 'Escape') {
            this.showNotification('Cleared selection', 'info');
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `admin-notification admin-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                                 type === 'error' ? 'times-circle' : 
                                 type === 'warning' ? 'exclamation-circle' : 
                                 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 
                       type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                       type === 'warning' ? 'rgba(245, 158, 11, 0.9)' : 
                       'rgba(59, 130, 246, 0.9)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            min-width: 300px;
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            z-index: 9999;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Add close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.transform = 'translateX(400px)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(400px)';
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
    
    // Check if user is authenticated
    fetch('/api/check-auth')
        .then(response => response.json())
        .then(data => {
            if (!data.is_authenticated) {
                // User is not authenticated, redirect to login
                window.location.href = '/user/admin';
            }
        })
        .catch(error => {
            console.error('Auth check failed:', error);
        });
});