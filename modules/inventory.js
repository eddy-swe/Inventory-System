export class InventoryModule {
    constructor(dataSchema) {
        this.dataSchema = dataSchema;
        this.currentEditingSku = null;
        this.currentEditingStockInId = null;
    }

    async init() {
        this.setupEventListeners();
        console.log('Inventory module initialized');
    }

    setupEventListeners() {
        // Product search and filters
        const productSearch = document.getElementById('productSearch');
        const categoryFilter = document.getElementById('categoryFilter');

        productSearch?.addEventListener('input', (e) => {
            this.filterProducts(e.target.value, categoryFilter?.value);
        });

        categoryFilter?.addEventListener('change', (e) => {
            this.filterProducts(productSearch?.value, e.target.value);
        });

        // Stock in search and filters
        const stockInSearch = document.getElementById('stockInSearch');
        const stockInDateFilter = document.getElementById('stockInDateFilter');

        stockInSearch?.addEventListener('input', (e) => {
            this.filterStockIn(e.target.value, stockInDateFilter?.value);
        });

        stockInDateFilter?.addEventListener('change', (e) => {
            this.filterStockIn(stockInSearch?.value, e.target.value);
        });

        // Setup autocomplete
        this.setupAutocomplete();
    }

    setupAutocomplete() {
        // Product autocomplete for stock in
        const stockInProductInput = document.getElementById('stockInProduct');
        this.setupProductAutocomplete(stockInProductInput);

        // Supplier autocomplete
        const stockInSupplierInput = document.getElementById('stockInSupplier');
        this.setupSupplierAutocomplete(stockInSupplierInput);
    }

    setupProductAutocomplete(input) {
        if (!input) return;

        let autocompleteList = null;

        input.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            this.clearAutocomplete();

            if (value.length < 2) return;

            const products = this.dataSchema.searchProducts(value);
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
                    <div style="font-size: 0.875rem; color: #6b7280;">SKU: ${product.sku} | Stock: ${product.currentStock}</div>
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

    setupSupplierAutocomplete(input) {
        if (!input) return;

        let autocompleteList = null;

        input.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            this.clearSupplierAutocomplete();

            if (value.length < 2) return;

            const suppliers = this.dataSchema.getAllSuppliers()
                .filter(supplier => supplier.name.toLowerCase().includes(value));

            if (suppliers.length === 0) return;

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

            suppliers.slice(0, 5).forEach(supplier => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.style.cssText = `
                    padding: 0.75rem;
                    cursor: pointer;
                    border-bottom: 1px solid #f3f4f6;
                    transition: background-color 0.2s;
                `;
                item.innerHTML = `
                    <div style="font-weight: 500;">${supplier.name}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${supplier.contactPerson} | ${supplier.phone}</div>
                `;

                item.addEventListener('mouseenter', () => {
                    item.style.backgroundColor = '#f3f4f6';
                });

                item.addEventListener('mouseleave', () => {
                    item.style.backgroundColor = 'white';
                });

                item.addEventListener('click', () => {
                    input.value = supplier.name;
                    this.clearSupplierAutocomplete();
                });

                autocompleteList.appendChild(item);
            });

            input.parentNode.style.position = 'relative';
            input.parentNode.appendChild(autocompleteList);
        });

        input.addEventListener('blur', () => {
            setTimeout(() => this.clearSupplierAutocomplete(), 200);
        });

        this.clearSupplierAutocomplete = () => {
            if (autocompleteList) {
                autocompleteList.remove();
                autocompleteList = null;
            }
        };
    }

    async refreshProducts() {
        this.populateCategoryFilter();
        this.renderProductsTable();
    }

    populateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        const categories = [...new Set(this.dataSchema.getAllProducts().map(p => p.category))];
        
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    renderProductsTable(products = null) {
        const tableBody = document.getElementById('productsTableBody');
        if (!tableBody) return;

        const productsToRender = products || this.dataSchema.getAllProducts();

        if (productsToRender.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-gray-500 py-8">
                        No products found. <a href="#" onclick="window.inventoryApp.inventory.showProductModal()" class="text-blue-600 hover:underline">Add your first product</a>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = productsToRender.map(product => {
            const statusClass = this.getProductStatusClass(product);
            const statusText = this.getProductStatusText(product);

            return `
                <tr>
                    <td class="font-mono text-sm">${product.sku}</td>
                    <td class="font-medium">${product.name}</td>
                    <td>${product.category}</td>
                    <td class="text-center">
                        <span class="${statusClass}">${product.currentStock} ${product.unitOfMeasure}</span>
                    </td>
                    <td class="text-center">${product.reorderLevel}</td>
                    <td class="text-right">${this.formatCurrency(product.standardPrice)}</td>
                    <td>
                        <span class="status-badge ${statusClass.includes('text-red') ? 'out-of-stock' : statusClass.includes('text-orange') ? 'low-stock' : 'active'}">
                            ${statusText}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit" onclick="window.inventoryApp.inventory.editProduct('${product.sku}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="window.inventoryApp.inventory.deleteProduct('${product.sku}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getProductStatusClass(product) {
        if (product.currentStock === 0) {
            return 'text-red-600 font-semibold';
        } else if (product.currentStock <= product.reorderLevel) {
            return 'text-orange-600 font-semibold';
        }
        return 'text-green-600';
    }

    getProductStatusText(product) {
        if (product.currentStock === 0) {
            return 'Out of Stock';
        } else if (product.currentStock <= product.reorderLevel) {
            return 'Low Stock';
        }
        return 'In Stock';
    }

    filterProducts(searchTerm = '', category = '') {
        let products = this.dataSchema.getAllProducts();

        if (searchTerm) {
            products = this.dataSchema.searchProducts(searchTerm);
        }

        if (category) {
            products = products.filter(p => p.category === category);
        }

        this.renderProductsTable(products);
    }

    async refreshStockIn() {
        this.renderStockInTable();
    }

    renderStockInTable(stockInRecords = null) {
        const tableBody = document.getElementById('stockInTableBody');
        if (!tableBody) return;

        const recordsToRender = stockInRecords || this.dataSchema.getAllStockIn();

        if (recordsToRender.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-gray-500 py-8">
                        No stock in records found. <a href="#" onclick="window.inventoryApp.inventory.showStockInModal()" class="text-blue-600 hover:underline">Record your first stock in</a>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = recordsToRender.map(record => `
            <tr>
                <td>${this.formatDate(record.date)}</td>
                <td class="font-mono text-sm">${record.poNumber}</td>
                <td>${record.supplierName}</td>
                <td>${record.productName}</td>
                <td class="text-center">${record.quantity}</td>
                <td class="text-right">${this.formatCurrency(record.unitCost)}</td>
                <td class="text-right font-semibold">${this.formatCurrency(record.totalCost)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="window.inventoryApp.inventory.editStockIn(${record.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="window.inventoryApp.inventory.deleteStockIn(${record.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterStockIn(searchTerm = '', dateFilter = '') {
        let records = this.dataSchema.getAllStockIn();

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            records = records.filter(record => 
                record.productName.toLowerCase().includes(term) ||
                record.supplierName.toLowerCase().includes(term) ||
                record.poNumber.toLowerCase().includes(term)
            );
        }

        if (dateFilter) {
            records = records.filter(record => record.date === dateFilter);
        }

        this.renderStockInTable(records);
    }

    showProductModal(sku = null) {
        const modal = document.getElementById('productModal');
        const form = document.getElementById('productForm');
        const title = document.getElementById('productModalTitle');
        
        if (!modal || !form) return;

        // Reset form
        form.reset();
        this.currentEditingSku = sku;

        if (sku) {
            // Edit mode
            const product = this.dataSchema.getProduct(sku);
            if (product) {
                title.textContent = 'Edit Product';
                document.getElementById('productSku').value = product.sku;
                document.getElementById('productName').value = product.name;
                document.getElementById('productCategory').value = product.category;
                document.getElementById('productDescription').value = product.description;
                document.getElementById('productUnit').value = product.unitOfMeasure;
                document.getElementById('productReorderLevel').value = product.reorderLevel;
                document.getElementById('productStandardPrice').value = product.standardPrice;
                document.getElementById('productSupplier').value = product.preferredSupplier;
                
                // Disable SKU editing
                document.getElementById('productSku').readOnly = true;
            }
        } else {
            // Add mode
            title.textContent = 'Add Product';
            document.getElementById('productSku').readOnly = false;
            
            // Set today's date and generate next PO number for stock in
            const today = new Date().toISOString().split('T')[0];
            const dateInput = document.getElementById('stockInDate');
            if (dateInput) dateInput.value = today;
        }

        modal.classList.add('active');
    }

    hideProductModal() {
        const modal = document.getElementById('productModal');
        modal?.classList.remove('active');
        this.currentEditingSku = null;
    }

    async handleProductSubmit(event) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const productData = {
                sku: formData.get('productSku') || document.getElementById('productSku').value,
                name: formData.get('productName') || document.getElementById('productName').value,
                category: formData.get('productCategory') || document.getElementById('productCategory').value,
                description: formData.get('productDescription') || document.getElementById('productDescription').value,
                unitOfMeasure: formData.get('productUnit') || document.getElementById('productUnit').value,
                reorderLevel: formData.get('productReorderLevel') || document.getElementById('productReorderLevel').value,
                standardPrice: formData.get('productStandardPrice') || document.getElementById('productStandardPrice').value,
                preferredSupplier: formData.get('productSupplier') || document.getElementById('productSupplier').value
            };

            // Validation
            if (!productData.sku || !productData.name || !productData.category || !productData.unitOfMeasure) {
                throw new Error('Please fill in all required fields');
            }

            if (this.currentEditingSku) {
                // Update existing product
                this.dataSchema.updateProduct(this.currentEditingSku, productData);
                this.showToast('Product updated successfully', 'success');
            } else {
                // Check if SKU already exists
                if (this.dataSchema.getProduct(productData.sku)) {
                    throw new Error('SKU already exists');
                }
                
                // Add new product
                this.dataSchema.addProduct(productData);
                this.showToast('Product added successfully', 'success');
            }

            this.hideProductModal();
            this.refreshProducts();
        } catch (error) {
            console.error('Failed to save product:', error);
            this.showToast(error.message, 'error');
        }
    }

    editProduct(sku) {
        this.showProductModal(sku);
    }

    deleteProduct(sku) {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }

        try {
            this.dataSchema.deleteProduct(sku);
            this.showToast('Product deleted successfully', 'success');
            this.refreshProducts();
        } catch (error) {
            console.error('Failed to delete product:', error);
            this.showToast('Failed to delete product', 'error');
        }
    }

    showStockInModal(productSku = null) {
        const modal = document.getElementById('stockInModal');
        const form = document.getElementById('stockInForm');
        
        if (!modal || !form) return;

        // Reset form
        form.reset();
        this.currentEditingStockInId = null;

        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('stockInDate').value = today;

        // Generate next PO number
        const stockInRecords = this.dataSchema.getAllStockIn();
        const nextPONumber = `PO${String(stockInRecords.length + 1).padStart(3, '0')}`;
        document.getElementById('stockInPO').value = nextPONumber;

        // Pre-select product if provided
        if (productSku) {
            const product = this.dataSchema.getProduct(productSku);
            if (product) {
                const productInput = document.getElementById('stockInProduct');
                productInput.value = product.name;
                productInput.dataset.sku = product.sku;
                
                // Pre-fill supplier if available
                if (product.preferredSupplier) {
                    document.getElementById('stockInSupplier').value = product.preferredSupplier;
                }
            }
        }

        modal.classList.add('active');
    }

    hideStockInModal() {
        const modal = document.getElementById('stockInModal');
        modal?.classList.remove('active');
        this.currentEditingStockInId = null;
    }

    async handleStockInSubmit(event) {
        event.preventDefault();
        
        try {
            const stockInData = {
                poNumber: document.getElementById('stockInPO').value,
                date: document.getElementById('stockInDate').value,
                supplierName: document.getElementById('stockInSupplier').value,
                productSku: document.getElementById('stockInProduct').dataset.sku,
                productName: document.getElementById('stockInProduct').value,
                quantity: document.getElementById('stockInQuantity').value,
                unitCost: document.getElementById('stockInUnitCost').value,
                totalCost: document.getElementById('stockInTotalCost').value,
                paymentMethod: document.getElementById('stockInPaymentMethod').value,
                invoiceReference: document.getElementById('stockInInvoice').value,
                notes: document.getElementById('stockInNotes').value
            };

            // Validation
            if (!stockInData.poNumber || !stockInData.date || !stockInData.supplierName || 
                !stockInData.productSku || !stockInData.quantity || !stockInData.unitCost || 
                !stockInData.paymentMethod) {
                throw new Error('Please fill in all required fields');
            }

            // Ensure product exists
            if (!this.dataSchema.getProduct(stockInData.productSku)) {
                throw new Error('Selected product not found');
            }

            // Add supplier if new
            if (!this.dataSchema.getSupplier(stockInData.supplierName)) {
                this.dataSchema.addSupplier({ name: stockInData.supplierName });
            }

            this.dataSchema.addStockIn(stockInData);
            this.showToast('Stock in recorded successfully', 'success');
            
            this.hideStockInModal();
            this.refreshStockIn();
        } catch (error) {
            console.error('Failed to save stock in:', error);
            this.showToast(error.message, 'error');
        }
    }

    editStockIn(id) {
        // Implementation for editing stock in records
        console.log('Edit stock in:', id);
        this.showToast('Edit functionality coming soon', 'info');
    }

    deleteStockIn(id) {
        if (!confirm('Are you sure you want to delete this stock in record? This will affect inventory levels.')) {
            return;
        }

        try {
            // In a full implementation, this would reverse the stock changes
            this.showToast('Delete functionality coming soon', 'info');
        } catch (error) {
            console.error('Failed to delete stock in:', error);
            this.showToast('Failed to delete stock in record', 'error');
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