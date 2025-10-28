// Import modules
import { DashboardModule } from './modules/dashboard.js';
import { InventoryModule } from './modules/inventory.js';
import { SalesModule } from './modules/sales.js';
import { ReportsModule } from './modules/reports.js';
import { DataSchema } from './data/schema.js';

class InventoryApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        
        // Initialize modules
        this.dataSchema = new DataSchema();
        this.dashboard = new DashboardModule(this.dataSchema);
        this.inventory = new InventoryModule(this.dataSchema);
        this.sales = new SalesModule(this.dataSchema);
        this.reports = new ReportsModule(this.dataSchema);
        
        this.init();
    }

    async init() {
        try {
            // Initialize data schema and load data
            await this.dataSchema.init();
            
            // Setup event listeners
            this.setupNavigation();
            this.setupModals();
            this.setupForms();
            this.setupConnectionStatus();
            this.setupSidebar();
            this.setupSettings();
            
            // Initialize modules
            await this.dashboard.init();
            await this.inventory.init();
            await this.sales.init();
            await this.reports.init();
            
            // Load initial page
            this.showPage('dashboard');
            
            // Setup auto-save and sync
            this.setupAutoSave();
            
            this.showToast('Application loaded successfully', 'success');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showToast('Failed to load application', 'error');
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.showPage(page);
            });
        });
    }

    showPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show selected page
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-page="${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        this.currentPage = pageName;
        
        // Update page content
        this.updatePageContent(pageName);
    }

    async updatePageContent(pageName) {
        try {
            switch (pageName) {
                case 'dashboard':
                    await this.dashboard.refresh();
                    break;
                case 'products':
                    await this.inventory.refreshProducts();
                    break;
                case 'stock-in':
                    await this.inventory.refreshStockIn();
                    break;
                case 'sales':
                    await this.sales.refresh();
                    break;
                case 'reports':
                    await this.reports.refresh();
                    break;
            }
        } catch (error) {
            console.error(`Failed to update ${pageName} content:`, error);
        }
    }

    setupModals() {
        // Product Modal
        const productModal = document.getElementById('productModal');
        const addProductBtn = document.getElementById('addProductBtn');
        const closeProductModal = document.getElementById('closeProductModal');
        const cancelProductBtn = document.getElementById('cancelProductBtn');

        addProductBtn?.addEventListener('click', () => {
            this.inventory.showProductModal();
        });

        closeProductModal?.addEventListener('click', () => {
            this.inventory.hideProductModal();
        });

        cancelProductBtn?.addEventListener('click', () => {
            this.inventory.hideProductModal();
        });

        // Stock In Modal
        const stockInModal = document.getElementById('stockInModal');
        const addStockInBtn = document.getElementById('addStockInBtn');
        const closeStockInModal = document.getElementById('closeStockInModal');
        const cancelStockInBtn = document.getElementById('cancelStockInBtn');

        addStockInBtn?.addEventListener('click', () => {
            this.inventory.showStockInModal();
        });

        closeStockInModal?.addEventListener('click', () => {
            this.inventory.hideStockInModal();
        });

        cancelStockInBtn?.addEventListener('click', () => {
            this.inventory.hideStockInModal();
        });

        // Sale Modal
        const saleModal = document.getElementById('saleModal');
        const addSaleBtn = document.getElementById('addSaleBtn');
        const closeSaleModal = document.getElementById('closeSaleModal');
        const cancelSaleBtn = document.getElementById('cancelSaleBtn');

        addSaleBtn?.addEventListener('click', () => {
            this.sales.showSaleModal();
        });

        closeSaleModal?.addEventListener('click', () => {
            this.sales.hideSaleModal();
        });

        cancelSaleBtn?.addEventListener('click', () => {
            this.sales.hideSaleModal();
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    setupForms() {
        // Product Form
        const productForm = document.getElementById('productForm');
        productForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.inventory.handleProductSubmit(e);
        });

        // Stock In Form
        const stockInForm = document.getElementById('stockInForm');
        stockInForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.inventory.handleStockInSubmit(e);
        });

        // Sale Form
        const saleForm = document.getElementById('saleForm');
        saleForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sales.handleSaleSubmit(e);
        });

        // Auto-calculate totals
        this.setupAutoCalculations();
    }

    setupAutoCalculations() {
        // Stock In calculations
        const stockInQuantity = document.getElementById('stockInQuantity');
        const stockInUnitCost = document.getElementById('stockInUnitCost');
        const stockInTotalCost = document.getElementById('stockInTotalCost');

        const calculateStockInTotal = () => {
            const quantity = parseFloat(stockInQuantity?.value) || 0;
            const unitCost = parseFloat(stockInUnitCost?.value) || 0;
            const total = quantity * unitCost;
            if (stockInTotalCost) {
                stockInTotalCost.value = total.toFixed(2);
            }
        };

        stockInQuantity?.addEventListener('input', calculateStockInTotal);
        stockInUnitCost?.addEventListener('input', calculateStockInTotal);

        // Sale calculations
        const saleQuantity = document.getElementById('saleQuantity');
        const saleUnitPrice = document.getElementById('saleUnitPrice');
        const saleTotalPrice = document.getElementById('saleTotalPrice');
        const saleProfit = document.getElementById('saleProfit');
        const saleProduct = document.getElementById('saleProduct');

        const calculateSaleTotal = () => {
            const quantity = parseFloat(saleQuantity?.value) || 0;
            const unitPrice = parseFloat(saleUnitPrice?.value) || 0;
            const total = quantity * unitPrice;
            
            if (saleTotalPrice) {
                saleTotalPrice.value = total.toFixed(2);
            }

            // Calculate profit if product is selected
            const productSku = saleProduct?.dataset.sku;
            if (productSku && saleProfit) {
                const product = this.dataSchema.getProduct(productSku);
                if (product) {
                    const costPrice = this.dataSchema.getAverageCostPrice(productSku);
                    const profit = (unitPrice - costPrice) * quantity;
                    saleProfit.value = profit.toFixed(2);
                }
            }
        };

        saleQuantity?.addEventListener('input', calculateSaleTotal);
        saleUnitPrice?.addEventListener('input', calculateSaleTotal);
        saleProduct?.addEventListener('change', calculateSaleTotal);
    }

    setupConnectionStatus() {
        const updateConnectionStatus = () => {
            const statusElement = document.getElementById('connectionStatus');
            const icon = statusElement?.querySelector('i');
            const text = statusElement?.querySelector('span');
            
            if (this.isOnline) {
                statusElement?.classList.remove('offline');
                if (icon) icon.className = 'fas fa-wifi';
                if (text) text.textContent = 'Online';
            } else {
                statusElement?.classList.add('offline');
                if (icon) icon.className = 'fas fa-wifi-slash';
                if (text) text.textContent = 'Offline';
            }
        };

        window.addEventListener('online', () => {
            this.isOnline = true;
            updateConnectionStatus();
            this.syncData();
            this.showToast('Connection restored - syncing data', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            updateConnectionStatus();
            this.showToast('Working offline - changes will sync when online', 'warning');
        });

        updateConnectionStatus();
    }

    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mainContent = document.getElementById('mainContent');

        sidebarToggle?.addEventListener('click', () => {
            if (window.innerWidth > 768) {
                sidebar?.classList.toggle('collapsed');
                mainContent?.classList.toggle('expanded');
            } else {
                sidebar?.classList.toggle('active');
            }
        });

        // Close sidebar on mobile when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar?.contains(e.target) && !sidebarToggle?.contains(e.target)) {
                    sidebar?.classList.remove('active');
                }
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                sidebar?.classList.remove('active');
            }
        });
    }

    setupSettings() {
        // Business Form
        const businessForm = document.getElementById('businessForm');
        businessForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBusinessSettings();
        });

        // Data Management
        const exportDataBtn = document.getElementById('exportDataBtn');
        const clearDataBtn = document.getElementById('clearDataBtn');
        const loadSampleDataBtn = document.getElementById('loadSampleDataBtn');

        exportDataBtn?.addEventListener('click', () => {
            this.exportAllData();
        });

        clearDataBtn?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                this.clearAllData();
            }
        });

        loadSampleDataBtn?.addEventListener('click', () => {
            if (confirm('This will load sample data and may overwrite existing data. Continue?')) {
                this.loadSampleData();
            }
        });

        // Sync button
        const syncBtn = document.getElementById('syncBtn');
        syncBtn?.addEventListener('click', () => {
            this.syncData();
        });

        // Load business settings
        this.loadBusinessSettings();
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => {
            this.autoSave();
        }, 30000);

        // Save on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.autoSave();
            }
        });

        // Save on beforeunload
        window.addEventListener('beforeunload', () => {
            this.autoSave();
        });
    }

    autoSave() {
        try {
            this.dataSchema.saveToLocalStorage();
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    async syncData() {
        if (!this.isOnline) {
            this.showToast('Cannot sync while offline', 'warning');
            return;
        }

        try {
            this.showLoading(true);
            
            // Process sync queue
            for (const operation of this.syncQueue) {
                await this.processSyncOperation(operation);
            }
            
            this.syncQueue = [];
            this.showToast('Data synced successfully', 'success');
        } catch (error) {
            console.error('Sync failed:', error);
            this.showToast('Sync failed - will retry later', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async processSyncOperation(operation) {
        // In a real implementation, this would make API calls to MySQL backend
        // For now, we'll just simulate the operation
        console.log('Processing sync operation:', operation);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    saveBusinessSettings() {
        const settings = {
            storeName: document.getElementById('storeName')?.value || '',
            storePhone: document.getElementById('storePhone')?.value || '',
            storeEmail: document.getElementById('storeEmail')?.value || '',
            storeAddress: document.getElementById('storeAddress')?.value || ''
        };

        localStorage.setItem('businessSettings', JSON.stringify(settings));
        this.showToast('Business settings saved', 'success');
    }

    loadBusinessSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('businessSettings') || '{}');
            
            if (document.getElementById('storeName')) {
                document.getElementById('storeName').value = settings.storeName || '';
            }
            if (document.getElementById('storePhone')) {
                document.getElementById('storePhone').value = settings.storePhone || '';
            }
            if (document.getElementById('storeEmail')) {
                document.getElementById('storeEmail').value = settings.storeEmail || '';
            }
            if (document.getElementById('storeAddress')) {
                document.getElementById('storeAddress').value = settings.storeAddress || '';
            }
        } catch (error) {
            console.error('Failed to load business settings:', error);
        }
    }

    exportAllData() {
        try {
            const allData = {
                products: this.dataSchema.products,
                suppliers: this.dataSchema.suppliers,
                stockIn: this.dataSchema.stockIn,
                sales: this.dataSchema.sales,
                customers: this.dataSchema.customers,
                inventoryMovements: this.dataSchema.inventoryMovements,
                businessSettings: JSON.parse(localStorage.getItem('businessSettings') || '{}'),
                exportDate: new Date().toISOString()
            };

            const dataStr = JSON.stringify(allData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showToast('Data exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('Export failed', 'error');
        }
    }

    clearAllData() {
        try {
            this.dataSchema.clearAllData();
            this.showToast('All data cleared', 'success');
            
            // Refresh current page
            this.updatePageContent(this.currentPage);
        } catch (error) {
            console.error('Failed to clear data:', error);
            this.showToast('Failed to clear data', 'error');
        }
    }

    async loadSampleData() {
        try {
            this.showLoading(true);
            await this.dataSchema.loadSampleData();
            this.showToast('Sample data loaded', 'success');
            
            // Refresh current page
            this.updatePageContent(this.currentPage);
        } catch (error) {
            console.error('Failed to load sample data:', error);
            this.showToast('Failed to load sample data', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (show) {
            loadingOverlay?.classList.add('active');
        } else {
            loadingOverlay?.classList.remove('active');
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    getToastIcon(type) {
        switch (type) {
            case 'success':
                return 'fas fa-check-circle';
            case 'error':
                return 'fas fa-exclamation-circle';
            case 'warning':
                return 'fas fa-exclamation-triangle';
            default:
                return 'fas fa-info-circle';
        }
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }

    formatDateTime(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.inventoryApp = new InventoryApp();
});

// Export for use in modules
export { InventoryApp };