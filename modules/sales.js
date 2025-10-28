export class SalesModule {
    constructor(dataSchema) {
        this.dataSchema = dataSchema;
        this.currentEditingSaleId = null;
    }

    async init() {
        this.setupEventListeners();
        console.log('Sales module initialized');
    }

    setupEventListeners() {
        // Sales search and filters
        const salesSearch = document.getElementById('salesSearch');
        const salesDateFilter = document.getElementById('salesDateFilter');

        salesSearch?.addEventListener('input', (e) => {
            this.filterSales(e.target.value, salesDateFilter?.value);
        });

        salesDateFilter?.addEventListener('change', (e) => {
            this.filterSales(salesSearch?.value, e.target.value);
        });

        // Setup autocomplete for sale product
        const saleProductInput = document.getElementById('saleProduct');
        this.setupProductAutocomplete(saleProductInput);
    }

    setupProductAutocomplete(input) {
        if (!input) return;

        let autocompleteList = null;

        input.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            this.clearAutocomplete();

            if (value.length < 2) return;

            const products = this.dataSchema.searchProducts(value)
                .filter(p => p.currentStock > 0); // Only show products with stock

            if (products.length === 0) return;

            autocompleteList = document.createElement('div');
            autocompleteList.className = 'autocomplete-list';
            autocompleteList.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #d1d5db;
                border-top: none;
                border-radius: 0 0 0.5rem 0.5rem;
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            `;

            products.slice(0, 5).forEach(product => {
                const avgCost = this.dataSchema.getAverageCostPrice(product.sku);
                const suggestedPrice = product.standardPrice;

                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.style.cssText = `
                    padding: 0.75rem;
                    cursor: pointer;
                    border-bottom: 1px solid #f3f4f6;
                    transition: background-color 0.2s;
                `;
                item.innerHTML = `
                    <div style="font-weight: 500;">${product.name}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">
                        Stock: ${product.currentStock} | Price: ${this.formatCurrency(suggestedPrice)} | Cost: ${this.formatCurrency(avgCost)}
                    </div>
                `;

                item.addEventListener('mouseenter', () => {
                    item.style.backgroundColor = '#f3f4f6';
                });

                item.addEventListener('mouseleave', () => {
                    item.style.backgroundColor = 'white';
                });

                item.addEventListener('click', () => {
                    input.value = product.name;
                    input.dataset.sku = product.sku;
                    
                    // Auto-fill suggested price
                    const unitPriceInput = document.getElementById('saleUnitPrice');
                    if (unitPriceInput) {
                        unitPriceInput.value = suggestedPrice.toFixed(2);
                        
                        // Trigger calculation
                        const event = new Event('input');
                        unitPriceInput.dispatchEvent(event);
                    }
                    
                    this.clearAutocomplete();
                });

                autocompleteList.appendChild(item);
            });

            input.parentNode.style.position = 'relative';
            input.parentNode.appendChild(autocompleteList);
        });

        input.addEventListener('blur', () => {
            setTimeout(() => this.clearAutocomplete(), 200);
        });

        this.clearAutocomplete = () => {
            if (autocompleteList) {
                autocompleteList.remove();
                autocompleteList = null;
            }
        };
    }

    async refresh() {
        this.renderSalesTable();
    }

    renderSalesTable(sales = null) {
        const tableBody = document.getElementById('salesTableBody');
        if (!tableBody) return;

        const salesToRender = sales || this.dataSchema.getAllSales();

        if (salesToRender.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-gray-500 py-8">
                        No sales records found. <a href="#" onclick="window.inventoryApp.sales.showSaleModal()" class="text-blue-600 hover:underline">Record your first sale</a>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = salesToRender.map(sale => {
            const profitClass = sale.profit >= 0 ? 'text-green-600' : 'text-red-600';
            
            return `
                <tr>
                    <td>${this.formatDate(sale.date)}</td>
                    <td class="font-medium">${sale.productName}</td>
                    <td>${sale.customerName || 'Walk-in'}</td>
                    <td class="text-center">${sale.quantity}</td>
                    <td class="text-right">${this.formatCurrency(sale.unitPrice)}</td>
                    <td class="text-right font-semibold">${this.formatCurrency(sale.totalPrice)}</td>
                    <td class="text-right ${profitClass} font-semibold">${this.formatCurrency(sale.profit)}</td>
                    <td>
                        <span class="status-badge ${this.getPaymentMethodClass(sale.paymentMethod)}">
                            ${sale.paymentMethod}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit" onclick="window.inventoryApp.sales.editSale(${sale.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="window.inventoryApp.sales.deleteSale(${sale.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getPaymentMethodClass(paymentMethod) {
        switch (paymentMethod?.toLowerCase()) {
            case 'cash':
                return 'active';
            case 'card':
                return 'active';
            case 'credit':
                return 'low-stock';
            default:
                return 'inactive';
        }
    }

    filterSales(searchTerm = '', dateFilter = '') {
        let sales = this.dataSchema.getAllSales();

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            sales = sales.filter(sale => 
                sale.productName.toLowerCase().includes(term) ||
                sale.customerName?.toLowerCase().includes(term) ||
                sale.paymentMethod.toLowerCase().includes(term)
            );
        }

        if (dateFilter) {
            sales = sales.filter(sale => sale.date === dateFilter);
        }

        this.renderSalesTable(sales);
    }

    showSaleModal(productSku = null) {
        const modal = document.getElementById('saleModal');
        const form = document.getElementById('saleForm');
        
        if (!modal || !form) return;

        // Reset form
        form.reset();
        this.currentEditingSaleId = null;

        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('saleDate').value = today;

        // Pre-select product if provided
        if (productSku) {
            const product = this.dataSchema.getProduct(productSku);
            if (product) {
                const productInput = document.getElementById('saleProduct');
                productInput.value = product.name;
                productInput.dataset.sku = product.sku;
                
                // Set suggested price
                const unitPriceInput = document.getElementById('saleUnitPrice');
                if (unitPriceInput) {
                    unitPriceInput.value = product.standardPrice.toFixed(2);
                }
            }
        }

        modal.classList.add('active');
    }

    hideSaleModal() {
        const modal = document.getElementById('saleModal');
        modal?.classList.remove('active');
        this.currentEditingSaleId = null;
    }

    async handleSaleSubmit(event) {
        event.preventDefault();
        
        try {
            const saleData = {
                date: document.getElementById('saleDate').value,
                productSku: document.getElementById('saleProduct').dataset.sku,
                productName: document.getElementById('saleProduct').value,
                customerName: document.getElementById('saleCustomer').value,
                quantity: document.getElementById('saleQuantity').value,
                unitPrice: document.getElementById('saleUnitPrice').value,
                totalPrice: document.getElementById('saleTotalPrice').value,
                paymentMethod: document.getElementById('salePaymentMethod').value,
                notes: document.getElementById('saleNotes').value
            };

            // Validation
            if (!saleData.date || !saleData.productSku || !saleData.quantity || 
                !saleData.unitPrice || !saleData.paymentMethod) {
                throw new Error('Please fill in all required fields');
            }

            // Check if product exists and has sufficient stock
            const product = this.dataSchema.getProduct(saleData.productSku);
            if (!product) {
                throw new Error('Selected product not found');
            }

            if (product.currentStock < parseInt(saleData.quantity)) {
                throw new Error(`Insufficient stock. Available: ${product.currentStock} ${product.unitOfMeasure}`);
            }

            this.dataSchema.addSale(saleData);
            this.showToast('Sale recorded successfully', 'success');
            
            this.hideSaleModal();
            this.refresh();
        } catch (error) {
            console.error('Failed to save sale:', error);
            this.showToast(error.message, 'error');
        }
    }

    editSale(id) {
        // Implementation for editing sales
        console.log('Edit sale:', id);
        this.showToast('Edit functionality coming soon', 'info');
    }

    deleteSale(id) {
        if (!confirm('Are you sure you want to delete this sale record? This will affect inventory levels.')) {
            return;
        }

        try {
            // In a full implementation, this would reverse the stock changes
            this.showToast('Delete functionality coming soon', 'info');
        } catch (error) {
            console.error('Failed to delete sale:', error);
            this.showToast('Failed to delete sale record', 'error');
        }
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

    showToast(message, type = 'info') {
        // Use the main app's toast method
        if (window.inventoryApp) {
            window.inventoryApp.showToast(message, type);
        }
    }
}