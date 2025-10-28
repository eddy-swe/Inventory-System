export class ReportsModule {
    constructor(dataSchema) {
        this.dataSchema = dataSchema;
    }

    async init() {
        this.setupEventListeners();
        console.log('Reports module initialized');
    }

    setupEventListeners() {
        const exportReportsBtn = document.getElementById('exportReportsBtn');
        exportReportsBtn?.addEventListener('click', () => {
            this.exportAllReports();
        });
    }

    async refresh() {
        this.updateTurnoverReport();
        this.updateABCAnalysis();
        this.updateProfitMargins();
        this.updateDeadStock();
    }

    updateTurnoverReport() {
        const container = document.getElementById('turnoverReport');
        if (!container) return;

        const products = this.dataSchema.getAllProducts();
        const turnoverData = products.map(product => ({
            ...product,
            turnover: this.dataSchema.getInventoryTurnover(product.sku),
            category: this.getTurnoverCategory(this.dataSchema.getInventoryTurnover(product.sku))
        })).sort((a, b) => b.turnover - a.turnover);

        if (turnoverData.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No data available</p>';
            return;
        }

        let html = `
            <div class="turnover-summary mb-4">
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div class="bg-green-50 p-3 rounded">
                        <div class="text-2xl font-bold text-green-600">${turnoverData.filter(p => p.category === 'Fast').length}</div>
                        <div class="text-sm text-green-700">Fast Movers</div>
                    </div>
                    <div class="bg-yellow-50 p-3 rounded">
                        <div class="text-2xl font-bold text-yellow-600">${turnoverData.filter(p => p.category === 'Medium').length}</div>
                        <div class="text-sm text-yellow-700">Medium Movers</div>
                    </div>
                    <div class="bg-red-50 p-3 rounded">
                        <div class="text-2xl font-bold text-red-600">${turnoverData.filter(p => p.category === 'Slow').length}</div>
                        <div class="text-sm text-red-700">Slow Movers</div>
                    </div>
                </div>
            </div>
            <div class="turnover-list max-h-64 overflow-y-auto">
        `;

        turnoverData.slice(0, 10).forEach(product => {
            const categoryClass = this.getTurnoverCategoryClass(product.category);
            html += `
                <div class="flex justify-between items-center py-2 border-b border-gray-100">
                    <div class="flex-1">
                        <div class="font-medium text-sm">${product.name}</div>
                        <div class="text-xs text-gray-500">${product.sku}</div>
                    </div>
                    <div class="text-right">
                        <div class="font-semibold">${product.turnover.toFixed(2)}x</div>
                        <span class="text-xs px-2 py-1 rounded ${categoryClass}">${product.category}</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    getTurnoverCategory(turnover) {
        if (turnover >= 6) return 'Fast';
        if (turnover >= 2) return 'Medium';
        return 'Slow';
    }

    getTurnoverCategoryClass(category) {
        switch (category) {
            case 'Fast': return 'bg-green-100 text-green-800';
            case 'Medium': return 'bg-yellow-100 text-yellow-800';
            case 'Slow': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    updateABCAnalysis() {
        const container = document.getElementById('abcAnalysis');
        if (!container) return;

        const abcData = this.dataSchema.getABCAnalysis();

        if (abcData.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No sales data available</p>';
            return;
        }

        const aItems = abcData.filter(item => item.category === 'A');
        const bItems = abcData.filter(item => item.category === 'B');
        const cItems = abcData.filter(item => item.category === 'C');

        let html = `
            <div class="abc-summary mb-4">
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div class="bg-blue-50 p-3 rounded">
                        <div class="text-2xl font-bold text-blue-600">${aItems.length}</div>
                        <div class="text-sm text-blue-700">A Items (80% Revenue)</div>
                    </div>
                    <div class="bg-green-50 p-3 rounded">
                        <div class="text-2xl font-bold text-green-600">${bItems.length}</div>
                        <div class="text-sm text-green-700">B Items (15% Revenue)</div>
                    </div>
                    <div class="bg-orange-50 p-3 rounded">
                        <div class="text-2xl font-bold text-orange-600">${cItems.length}</div>
                        <div class="text-sm text-orange-700">C Items (5% Revenue)</div>
                    </div>
                </div>
            </div>
            <div class="abc-details max-h-64 overflow-y-auto">
        `;

        ['A', 'B', 'C'].forEach(category => {
            const items = abcData.filter(item => item.category === category);
            const categoryClass = this.getABCCategoryClass(category);
            
            html += `<div class="mb-3">
                <h4 class="font-semibold text-sm mb-2 ${categoryClass}">Category ${category} Items</h4>`;
            
            items.slice(0, 5).forEach(item => {
                html += `
                    <div class="flex justify-between items-center py-1 text-sm">
                        <span class="truncate flex-1 mr-2">${item.name}</span>
                        <span class="font-medium">${this.formatCurrency(item.revenue)}</span>
                    </div>
                `;
            });
            
            if (items.length > 5) {
                html += `<div class="text-xs text-gray-500">... and ${items.length - 5} more</div>`;
            }
            
            html += '</div>';
        });

        html += '</div>';
        container.innerHTML = html;
    }

    getABCCategoryClass(category) {
        switch (category) {
            case 'A': return 'text-blue-600';
            case 'B': return 'text-green-600';
            case 'C': return 'text-orange-600';
            default: return 'text-gray-600';
        }
    }

    updateProfitMargins() {
        const container = document.getElementById('profitMargins');
        if (!container) return;

        const sales = this.dataSchema.getAllSales();
        if (sales.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No sales data available</p>';
            return;
        }

        // Calculate profit margins by product
        const productProfits = new Map();
        sales.forEach(sale => {
            const current = productProfits.get(sale.productSku) || {
                name: sale.productName,
                sku: sale.productSku,
                totalRevenue: 0,
                totalProfit: 0,
                salesCount: 0
            };
            
            current.totalRevenue += sale.totalPrice;
            current.totalProfit += sale.profit;
            current.salesCount += 1;
            productProfits.set(sale.productSku, current);
        });

        const profitData = Array.from(productProfits.values())
            .map(item => ({
                ...item,
                profitMargin: item.totalRevenue > 0 ? (item.totalProfit / item.totalRevenue) * 100 : 0
            }))
            .sort((a, b) => b.profitMargin - a.profitMargin);

        // Overall metrics
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
        const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
        const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        let html = `
            <div class="profit-summary mb-4">
                <div class="bg-green-50 p-4 rounded">
                    <div class="text-center">
                        <div class="text-3xl font-bold text-green-600">${overallMargin.toFixed(1)}%</div>
                        <div class="text-sm text-green-700">Overall Profit Margin</div>
                        <div class="text-xs text-gray-600 mt-1">
                            ${this.formatCurrency(totalProfit)} profit on ${this.formatCurrency(totalRevenue)} revenue
                        </div>
                    </div>
                </div>
            </div>
            <div class="profit-list max-h-64 overflow-y-auto">
        `;

        profitData.slice(0, 10).forEach(item => {
            const marginClass = this.getProfitMarginClass(item.profitMargin);
            html += `
                <div class="flex justify-between items-center py-2 border-b border-gray-100">
                    <div class="flex-1">
                        <div class="font-medium text-sm">${item.name}</div>
                        <div class="text-xs text-gray-500">${item.salesCount} sales</div>
                    </div>
                    <div class="text-right">
                        <div class="font-semibold ${marginClass}">${item.profitMargin.toFixed(1)}%</div>
                        <div class="text-xs text-gray-600">${this.formatCurrency(item.totalProfit)}</div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    getProfitMarginClass(margin) {
        if (margin >= 50) return 'text-green-600';
        if (margin >= 30) return 'text-blue-600';
        if (margin >= 10) return 'text-yellow-600';
        return 'text-red-600';
    }

    updateDeadStock() {
        const container = document.getElementById('deadStock');
        if (!container) return;

        const deadStock60 = this.dataSchema.getDeadStock(60);
        const deadStock90 = this.dataSchema.getDeadStock(90);

        let html = `
            <div class="dead-stock-summary mb-4">
                <div class="grid grid-cols-2 gap-4 text-center">
                    <div class="bg-orange-50 p-3 rounded">
                        <div class="text-2xl font-bold text-orange-600">${deadStock60.length}</div>
                        <div class="text-sm text-orange-700">No Sales (60 days)</div>
                    </div>
                    <div class="bg-red-50 p-3 rounded">
                        <div class="text-2xl font-bold text-red-600">${deadStock90.length}</div>
                        <div class="text-sm text-red-700">No Sales (90 days)</div>
                    </div>
                </div>
            </div>
        `;

        if (deadStock90.length === 0) {
            html += '<p class="text-green-600 text-center">Great! No dead stock found.</p>';
        } else {
            html += '<div class="dead-stock-list max-h-64 overflow-y-auto">';
            
            deadStock90.forEach(product => {
                const inventoryValue = product.currentStock * this.dataSchema.getAverageCostPrice(product.sku);
                const daysClass = deadStock60.includes(product) ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800';
                const daysText = deadStock60.includes(product) ? '90+ days' : '60+ days';
                
                html += `
                    <div class="flex justify-between items-center py-2 border-b border-gray-100">
                        <div class="flex-1">
                            <div class="font-medium text-sm">${product.name}</div>
                            <div class="text-xs text-gray-500">Stock: ${product.currentStock} ${product.unitOfMeasure}</div>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold">${this.formatCurrency(inventoryValue)}</div>
                            <span class="text-xs px-2 py-1 rounded ${daysClass}">${daysText}</span>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            
            const totalDeadStockValue = deadStock90.reduce((sum, product) => 
                sum + (product.currentStock * this.dataSchema.getAverageCostPrice(product.sku)), 0
            );
            
            html += `
                <div class="mt-3 p-3 bg-gray-50 rounded">
                    <div class="text-sm font-medium">Total Dead Stock Value: ${this.formatCurrency(totalDeadStockValue)}</div>
                    <div class="text-xs text-gray-600 mt-1">Consider promotional pricing or bundling to move these items</div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    exportAllReports() {
        try {
            const reportData = {
                generatedDate: new Date().toISOString(),
                inventoryTurnover: this.generateTurnoverReport(),
                abcAnalysis: this.dataSchema.getABCAnalysis(),
                profitMargins: this.generateProfitMarginsReport(),
                deadStock: {
                    sixtyDays: this.dataSchema.getDeadStock(60),
                    ninetyDays: this.dataSchema.getDeadStock(90)
                },
                summary: this.generateSummaryReport()
            };

            // Create CSV format for easy Excel import
            let csvContent = this.convertToCSV(reportData);
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `inventory_reports_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            this.showToast('Reports exported successfully', 'success');
        } catch (error) {
            console.error('Failed to export reports:', error);
            this.showToast('Failed to export reports', 'error');
        }
    }

    generateTurnoverReport() {
        const products = this.dataSchema.getAllProducts();
        return products.map(product => ({
            sku: product.sku,
            name: product.name,
            category: product.category,
            currentStock: product.currentStock,
            turnoverRate: this.dataSchema.getInventoryTurnover(product.sku),
            turnoverCategory: this.getTurnoverCategory(this.dataSchema.getInventoryTurnover(product.sku))
        }));
    }

    generateProfitMarginsReport() {
        const sales = this.dataSchema.getAllSales();
        const productProfits = new Map();
        
        sales.forEach(sale => {
            const current = productProfits.get(sale.productSku) || {
                sku: sale.productSku,
                name: sale.productName,
                totalRevenue: 0,
                totalProfit: 0,
                salesCount: 0
            };
            
            current.totalRevenue += sale.totalPrice;
            current.totalProfit += sale.profit;
            current.salesCount += 1;
            productProfits.set(sale.productSku, current);
        });

        return Array.from(productProfits.values()).map(item => ({
            ...item,
            profitMargin: item.totalRevenue > 0 ? (item.totalProfit / item.totalRevenue) * 100 : 0
        }));
    }

    generateSummaryReport() {
        const totalInventoryValue = this.dataSchema.getTotalInventoryValue();
        const monthlySales = this.dataSchema.getMonthlySales();
        const monthlyProfit = this.dataSchema.getMonthlyProfit();
        const lowStockCount = this.dataSchema.getLowStockProducts().length;
        const outOfStockCount = this.dataSchema.getOutOfStockProducts().length;
        
        return {
            totalInventoryValue,
            monthlySales,
            monthlyProfit,
            profitMargin: monthlySales > 0 ? (monthlyProfit / monthlySales) * 100 : 0,
            lowStockCount,
            outOfStockCount,
            totalProducts: this.dataSchema.getAllProducts().length,
            totalSales: this.dataSchema.getAllSales().length
        };
    }

    convertToCSV(reportData) {
        let csv = 'Beauty Supply Store - Inventory Reports\n';
        csv += `Generated: ${new Date(reportData.generatedDate).toLocaleString()}\n\n`;
        
        // Summary
        csv += 'SUMMARY REPORT\n';
        csv += 'Metric,Value\n';
        csv += `Total Inventory Value,${reportData.summary.totalInventoryValue}\n`;
        csv += `Monthly Sales,${reportData.summary.monthlySales}\n`;
        csv += `Monthly Profit,${reportData.summary.monthlyProfit}\n`;
        csv += `Profit Margin,${reportData.summary.profitMargin.toFixed(2)}%\n`;
        csv += `Low Stock Items,${reportData.summary.lowStockCount}\n`;
        csv += `Out of Stock Items,${reportData.summary.outOfStockCount}\n`;
        csv += `Total Products,${reportData.summary.totalProducts}\n`;
        csv += `Total Sales,${reportData.summary.totalSales}\n\n`;
        
        // ABC Analysis
        csv += 'ABC ANALYSIS\n';
        csv += 'SKU,Product Name,Revenue,Revenue %,Cumulative %,Category\n';
        reportData.abcAnalysis.forEach(item => {
            csv += `${item.sku},${item.name},${item.revenue},${item.revenuePercentage.toFixed(2)},${item.cumulativePercentage.toFixed(2)},${item.category}\n`;
        });
        csv += '\n';
        
        // Inventory Turnover
        csv += 'INVENTORY TURNOVER\n';
        csv += 'SKU,Product Name,Category,Current Stock,Turnover Rate,Turnover Category\n';
        reportData.inventoryTurnover.forEach(item => {
            csv += `${item.sku},${item.name},${item.category},${item.currentStock},${item.turnoverRate.toFixed(2)},${item.turnoverCategory}\n`;
        });
        csv += '\n';
        
        // Dead Stock
        csv += 'DEAD STOCK (90+ Days)\n';
        csv += 'SKU,Product Name,Category,Current Stock,Estimated Value\n';
        reportData.deadStock.ninetyDays.forEach(item => {
            const value = item.currentStock * this.dataSchema.getAverageCostPrice(item.sku);
            csv += `${item.sku},${item.name},${item.category},${item.currentStock},${value.toFixed(2)}\n`;
        });
        
        return csv;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    }

    showToast(message, type = 'info') {
        if (window.inventoryApp) {
            window.inventoryApp.showToast(message, type);
        }
    }
}