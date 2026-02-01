// Login Form 2 - Neon Minimalist Style JavaScript
// This file extends form-utils.js with form-specific functionality

class LoginForm2 {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.submitBtn = this.form.querySelector('.login-btn');
        this.passwordToggle = document.getElementById('passwordToggle');
        this.passwordInput = document.getElementById('password');
        this.successMessage = document.getElementById('successMessage');
        this.isSubmitting = false;
        
        this.validators = {
            username: this.validateUsername,
            password: this.validatePassword
        };
        
        this.init();
    }
    
    init() {
        this.addEventListeners();
        this.setupFloatingLabels();
        this.addInputAnimations();
        this.setupPasswordToggle();
        this.addBackgroundEffects();
    }
    
    addEventListeners() {
        // Form submission - PREVENT DEFAULT BEHAVIOR
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation
        Object.keys(this.validators).forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field) {
                field.addEventListener('blur', () => this.validateField(fieldName));
                field.addEventListener('input', () => this.clearError(fieldName));
            }
        });
        
        // Enhanced focus effects
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', (e) => this.handleFocus(e));
            input.addEventListener('blur', (e) => this.handleBlur(e));
        });
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }
    
    setupFloatingLabels() {
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            // Check if field has value on page load
            if (input.value.trim() !== '') {
                input.classList.add('has-value');
            }
            
            input.addEventListener('input', () => {
                if (input.value.trim() !== '') {
                    input.classList.add('has-value');
                } else {
                    input.classList.remove('has-value');
                }
            });
        });
    }
    
    addInputAnimations() {
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach((input, index) => {
            // Stagger animation on page load
            input.style.opacity = '0';
            input.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                input.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                input.style.opacity = '1';
                input.style.transform = 'translateX(0)';
            }, index * 200);
        });
    }
    
    setupPasswordToggle() {
        if (this.passwordToggle && this.passwordInput) {
            this.passwordToggle.addEventListener('click', () => {
                const isPassword = this.passwordInput.type === 'password';
                const toggleIcon = this.passwordToggle.querySelector('.toggle-icon');
                
                this.passwordInput.type = isPassword ? 'text' : 'password';
                toggleIcon.classList.toggle('show-password', isPassword);
                
                // Add neon pulse effect
                this.passwordToggle.style.boxShadow = '0 0 15px rgba(0, 255, 136, 0.5)';
                setTimeout(() => {
                    this.passwordToggle.style.boxShadow = '';
                }, 300);
                
                // Keep focus on password input
                this.passwordInput.focus();
            });
        }
    }
    
    addBackgroundEffects() {
        // Add mouse move parallax effect to glow orbs
        document.addEventListener('mousemove', (e) => {
            const orbs = document.querySelectorAll('.glow-orb');
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            orbs.forEach((orb, index) => {
                const speed = (index + 1) * 0.5;
                const moveX = (x - 0.5) * speed * 20;
                const moveY = (y - 0.5) * speed * 20;
                orb.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
        });
    }
    
    handleFocus(e) {
        const wrapper = e.target.closest('.input-wrapper');
        if (wrapper) {
            wrapper.classList.add('focused');
            // Add subtle glow effect
            const input = wrapper.querySelector('input');
            input.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.1)';
        }
    }
    
    handleBlur(e) {
        const wrapper = e.target.closest('.input-wrapper');
        if (wrapper) {
            wrapper.classList.remove('focused');
            // Remove glow effect
            const input = wrapper.querySelector('input');
            input.style.boxShadow = '';
        }
    }
    
    async handleSubmit(e) {
        e.preventDefault(); // CRITICAL: Prevent default form submission
        
        if (this.isSubmitting) return;
        
        const isValid = this.validateForm();
        
        if (isValid) {
            await this.submitForm();
        } else {
            this.shakeForm();
        }
    }
    
    validateForm() {
        let isValid = true;
        
        Object.keys(this.validators).forEach(fieldName => {
            if (!this.validateField(fieldName)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    validateField(fieldName) {
        const field = document.getElementById(fieldName);
        const validator = this.validators[fieldName];
        
        if (!field || !validator) return true;
        
        const result = validator(field.value.trim());
        
        if (result.isValid) {
            this.clearError(fieldName);
            this.showSuccess(fieldName);
        } else {
            this.showError(fieldName, result.message);
        }
        
        return result.isValid;
    }
    
    validateUsername(value) {
        if (!value) {
            return { isValid: false, message: 'Username is required' };
        }
        if (value.length < 3) {
            return { isValid: false, message: 'Username must be at least 3 characters' };
        }
        return { isValid: true };
    }
    
    validatePassword(value) {
        if (!value) {
            return { isValid: false, message: 'Password is required' };
        }
        if (value.length < 6) {
            return { isValid: false, message: 'Password must be at least 6 characters' };
        }
        return { isValid: true };
    }
    
    showError(fieldName, message) {
        const formGroup = document.getElementById(fieldName).closest('.form-group');
        const errorElement = document.getElementById(fieldName + 'Error');
        
        if (formGroup && errorElement) {
            formGroup.classList.add('error');
            errorElement.textContent = message;
            errorElement.classList.add('show');
            
            // Add shake animation with neon effect
            const field = document.getElementById(fieldName);
            if (field) {
                field.style.animation = 'shake 0.5s ease-in-out';
                field.style.boxShadow = '0 0 15px rgba(255, 0, 128, 0.5)';
                setTimeout(() => {
                    field.style.animation = '';
                    field.style.boxShadow = '';
                }, 500);
            }
        }
    }
    
    clearError(fieldName) {
        const formGroup = document.getElementById(fieldName)?.closest('.form-group');
        const errorElement = document.getElementById(fieldName + 'Error');
        
        if (formGroup && errorElement) {
            formGroup.classList.remove('error');
            errorElement.classList.remove('show');
            setTimeout(() => {
                errorElement.textContent = '';
            }, 300);
        }
    }
    
    showSuccess(fieldName) {
        const field = document.getElementById(fieldName);
        const wrapper = field?.closest('.input-wrapper');
        
        if (field && wrapper) {
            // Add subtle success indication with neon glow
            wrapper.style.borderColor = '#00ff88';
            field.style.boxShadow = '0 0 10px rgba(0, 255, 136, 0.3)';
            setTimeout(() => {
                wrapper.style.borderColor = '';
                field.style.boxShadow = '';
            }, 2000);
        }
    }
    
    shakeForm() {
        const card = document.querySelector('.login-card');
        if (card) {
            card.style.animation = 'shake 0.5s ease-in-out';
            card.style.boxShadow = '0 0 30px rgba(255, 0, 128, 0.3)';
            setTimeout(() => {
                card.style.animation = '';
                card.style.boxShadow = '';
            }, 500);
        }
    }
    
    async submitForm() {
        this.isSubmitting = true;
        this.submitBtn.classList.add('loading');
        
        // Add neon loading effect
        this.submitBtn.style.boxShadow = '0 0 30px rgba(0, 255, 136, 0.6)';
        
        try {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            console.log('Submitting login:', { username, password }); // Debug
            
            // Make actual API call to your Flask backend
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            const result = await response.json();
            console.log('Login response:', result); // Debug
            
            if (result.success) {
                this.showSuccessMessage();
                // Redirect to admin panel
                setTimeout(() => {
                    window.location.href = result.redirect || '/user/admin';
                }, 1500);
            } else {
                throw new Error(result.message || 'Login failed');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showLoginError(error.message);
        } finally {
            this.isSubmitting = false;
            this.submitBtn.classList.remove('loading');
            this.submitBtn.style.boxShadow = '';
        }
    }
    
    showSuccessMessage() {
        // Hide form with smooth animation and neon effects
        if (this.form) {
            this.form.style.opacity = '0';
            this.form.style.transform = 'translateY(-20px) scale(0.95)';
        }
        
        // Add success glow to card
        const card = document.querySelector('.login-card');
        if (card) {
            card.style.boxShadow = '0 0 50px rgba(0, 255, 136, 0.4)';
        }
        
        setTimeout(() => {
            if (this.form) {
                this.form.style.display = 'none';
            }
            
            if (this.successMessage) {
                this.successMessage.classList.add('show');
            }
        }, 300);
    }
    
    showLoginError(message) {
        this.showNotification(message || 'Login failed. Please try again.', 'error');
        
        // Shake the entire card with neon error effect
        const card = document.querySelector('.login-card');
        if (card) {
            card.style.animation = 'shake 0.5s ease-in-out';
            card.style.boxShadow = '0 0 40px rgba(255, 0, 128, 0.5)';
            setTimeout(() => {
                card.style.animation = '';
                card.style.boxShadow = '';
            }, 500);
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
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
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Enter key submits form if focus is on form elements
            if (e.key === 'Enter' && e.target.closest('#loginForm')) {
                e.preventDefault();
                this.handleSubmit(e);
            }
            
            // Escape key clears errors
            if (e.key === 'Escape') {
                Object.keys(this.validators).forEach(fieldName => {
                    this.clearError(fieldName);
                });
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add entrance animation to login card with neon effect
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        loginCard.style.opacity = '0';
        loginCard.style.transform = 'translateY(30px) scale(0.9)';
        
        setTimeout(() => {
            loginCard.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            loginCard.style.opacity = '1';
            loginCard.style.transform = 'translateY(0) scale(1)';
        }, 200);
    }
    
    // Initialize the login form
    new LoginForm2();
});