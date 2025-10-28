export class DashboardModule {
    constructor(dataSchema) {
        this.dataSchema = dataSchema;
    }

    async init() {
        console.log('Dashboard module initialized');
    }

    async refresh() {
        try {
            this.updateKPIs();
            this.updateTopSellingChart();
            this.updateReorderAlerts();
        } catch (error) {
            console.error('Failed to refresh dashboard:', error);
        }
    }

    updateKPIs() {
        // Total Inventory Value
        const totalValue = this.dataSchema.getTotalInventoryValue();
        const totalValueElement = document.getElementById('totalInventoryValue');
        if (totalValueElement) {
            totalValueElement.textContent = this.formatCurrency(totalValue);
        }

        // Monthly Sales
        const monthlySales = this.dataSchema.getMonthlySales();
        const monthlySalesElement = document.getElementById('monthlySales');
        if (monthlySalesElement) {
            monthlySalesElement.textContent = this.formatCurrency(monthlySales);
        }

        // Low Stock Count
        const lowStockProducts = this.dataSchema.getLowStockProducts();
        const lowStockElement = document.getElementById('lowStockCount');
        if (lowStockElement) {
            lowStockElement.textContent = lowStockProducts.length;
        }

        // Gross Profit Margin
        const monthlyProfit = this.dataSchema.getMonthlyProfit();
        const profitMargin = monthlySales > 0 ? (monthlyProfit / monthlySales) * 100 : 0;
        const profitMarginElement = document.getElementById('grossProfitMargin');
        if (profitMarginElement) {
            profitMarginElement.textContent = `${profitMargin.toFixed(1)}%`;
        }
    }

    updateTopSellingChart() {
        const topProducts = this.dataSchema.getTopSellingProducts(5);
        const chartContainer = document.getElementById('topSellingChart');
        
        if (!chartContainer) return;

        if (topProducts.length === 0) {
            chartContainer.innerHTML = '<p class="text-gray-500">No sales data available</p>';
            return;
        }

        // Create a simple bar chart using CSS
        const maxRevenue = Math.max(...topProducts.map(p => p.revenue));
        
        let chartHTML = '<div class="chart-bars">';
        topProducts.forEach((product, index) => {
            const percentage = (product.revenue / maxRevenue) * 100;
            const color = this.getChartColor(index);
            
            chartHTML += `
                <div class="chart-bar-item" style="margin-bottom: 1rem;">
                    <div class="chart-bar-label" style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.875rem;">
                        <span>${product.name.substring(0, 20)}${product.name.length > 20 ? '...' : ''}</span>
                        <span>${this.formatCurrency(product.revenue)}</span>
                    </div>
                    <div class="chart-bar-track" style="background: #f3f4f6; height: 20px; border-radius: 10px; overflow: hidden;">
                        <div class="chart-bar-fill" style="background: ${color}; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `;
        });
        chartHTML += '</div>';

        chartContainer.innerHTML = chartHTML;
    }

    updateReorderAlerts() {
        const lowStockProducts = this.dataSchema.getLowStockProducts();
        const outOfStockProducts = this.dataSchema.getOutOfStockProducts();
        const alertContainer = document.getElementById('reorderAlerts');
        
        if (!alertContainer) return;

        let alertsHTML = '';

        // Out of stock alerts (critical)
        outOfStockProducts.forEach(product => {
            alertsHTML += `
                <div class="alert-item critical">
                    <div class="alert-content">
                        <div class="alert-title">Out of Stock: ${product.name}</div>
                        <div class="alert-description">SKU: ${product.sku} - Immediate reorder required</div>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="window.inventoryApp.inventory.showStockInModal('${product.sku}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            `;
        });

        // Low stock alerts
        lowStockProducts.filter(p => p.currentStock > 0).forEach(product => {
            const suggestedQuantity = Math.max(product.reorderLevel * 2 - product.currentStock, product.reorderLevel);
            
            alertsHTML += `
                <div class="alert-item">
                    <div class="alert-content">
                        <div class="alert-title">Low Stock: ${product.name}</div>
                        <div class="alert-description">
                            Current: ${product.currentStock} ${product.unitOfMeasure} | 
                            Reorder Level: ${product.reorderLevel} | 
                            Suggested: ${suggestedQuantity}
                        </div>
                    </div>
                    <button class="btn btn-warning btn-sm" onclick="window.inventoryApp.inventory.showStockInModal('${product.sku}')">
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                </div>
            `;
        });

        if (alertsHTML === '') {
            alertsHTML = '<div class="alert-item" style="border-left-color: #059669;"><div class="alert-content"><div class="alert-title">All Good!</div><div class="alert-description">No items need reordering at this time.</div></div></div>';
        }

        alertContainer.innerHTML = alertsHTML;

        // Show browser notification for critical alerts
        if (outOfStockProducts.length > 0 && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('Inventory Alert', {
                    body: `${outOfStockProducts.length} item(s) are out of stock!`,
                    icon: 'https://public-frontend-cos.metadl.com/mgx/img/favicon.png'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification('Inventory Alert', {
                            body: `${outOfStockProducts.length} item(s) are out of stock!`,
                            icon: 'https://public-frontend-cos.metadl.com/mgx/img/favicon.png'
                        });
                    }
                });
            }
        }
    }

    getChartColor(index) {
        const colors = [
            '#2563eb', // Blue
            '#059669', // Green
            '#d97706', // Orange
            '#dc2626', // Red
            '#0891b2', // Cyan
            '#7c3aed', // Purple
            '#be185d', // Pink
            '#374151'  // Gray
        ];
        return colors[index % colors.length];
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }
}