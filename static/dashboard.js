// Dashboard Scripts
class Dashboard {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadStats();
        this.setupAnimations();
        this.setupTheme();
    }
    
    setupEventListeners() {
        // Action buttons
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleActionClick(e));
        });
        
        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });
        
        // Theme toggle (if added later)
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Admin link special effect
        const adminLink = document.querySelector('.admin-link');
        if (adminLink) {
            adminLink.addEventListener('mouseenter', () => {
                adminLink.style.transform = 'translateY(-2px)';
                adminLink.style.boxShadow = '0 5px 15px rgba(16, 185, 129, 0.4)';
            });
            
            adminLink.addEventListener('mouseleave', () => {
                adminLink.style.transform = '';
                adminLink.style.boxShadow = '';
            });
        }
    }
    
    handleActionClick(e) {
        const button = e.currentTarget;
        const action = button.querySelector('span').textContent;
        
        // Add click animation
        button.style.transform = 'scale(0.95)';
        button.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.5)';
        
        setTimeout(() => {
            button.style.transform = '';
            button.style.boxShadow = '';
        }, 150);
        
        // Show notification based on action
        const messages = {
            'Add Product': 'Opening product creation form...',
            'View Orders': 'Loading order dashboard...',
            'Analytics': 'Opening analytics dashboard...',
            'Settings': 'Opening settings panel...'
        };
        
        if (messages[action]) {
            this.showNotification(messages[action], 'info');
        }
    }
    
    handleNavClick(e) {
        e.preventDefault();
        const link = e.currentTarget;
        const href = link.getAttribute('href');
        
        // Update active state
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.remove('active');
        });
        link.classList.add('active');
        
        // Add click animation
        link.style.transform = 'scale(0.95)';
        setTimeout(() => {
            link.style.transform = '';
        }, 150);
        
        // Simulate navigation (in real app, this would be actual navigation)
        if (href === '/user/admin') {
            // Admin panel requires login, so show loading
            this.showNotification('Loading admin panel...', 'info');
        }
    }
    
    async loadStats() {
        // Simulate loading stats from API
        try {
            // In a real app, you would fetch from your API
            // const response = await fetch('/api/stats');
            // const stats = await response.json();
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Update stats with animation
            const statNumbers = document.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                this.animateCounter(stat, 0, parseInt(stat.textContent.replace(/,/g, '')) || 0, 1000);
            });
            
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }
    
    animateCounter(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value.toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
    
    setupAnimations() {
        // Add entrance animations to elements
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
        animateElements(statCards);
        
        // Animate action buttons
        const actionButtons = document.querySelectorAll('.action-btn');
        setTimeout(() => animateElements(actionButtons, 50), 300);
        
        // Animate activity items
        const activityItems = document.querySelectorAll('.activity-item');
        setTimeout(() => animateElements(activityItems, 80), 600);
    }
    
    setupTheme() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('dashboard-theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }
    
    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('dashboard-theme', isDark ? 'dark' : 'light');
        
        const themeToggle = document.querySelector('.theme-toggle i');
        if (themeToggle) {
            themeToggle.classList.toggle('fa-sun');
            themeToggle.classList.toggle('fa-moon');
        }
        
        this.showNotification(`Switched to ${isDark ? 'dark' : 'light'} theme`, 'info');
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 
                       type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
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
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
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

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
    
    // Add any additional initialization code here
    console.log('Dashboard initialized');
});

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-close {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        padding: 5px;
        opacity: 0.7;
        transition: opacity 0.2s;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
`;
document.head.appendChild(notificationStyles);