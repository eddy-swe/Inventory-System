export class DataSchema {
    constructor() {
        this.products = new Map();
        this.suppliers = new Map();
        this.stockIn = new Map();
        this.sales = new Map();
        this.customers = new Map();
        this.inventoryMovements = new Map();
        
        // Counters for auto-incrementing IDs
        this.counters = {
            product: 1,
            supplier: 1,
            stockIn: 1,
            sale: 1,
            customer: 1,
            movement: 1
        };
    }

    async init() {
        try {
            this.loadFromLocalStorage();
            console.log('Data schema initialized');
        } catch (error) {
            console.error('Failed to initialize data schema:', error);
            // Initialize with empty data if loading fails
            this.initializeEmpty();
        }
    }

    initializeEmpty() {
        this.products.clear();
        this.suppliers.clear();
        this.stockIn.clear();
        this.sales.clear();
        this.customers.clear();
        this.inventoryMovements.clear();
        
        this.counters = {
            product: 1,
            supplier: 1,
            stockIn: 1,
            sale: 1,
            customer: 1,
            movement: 1
        };
    }

    // Product Management
    addProduct(productData) {
        const product = {
            id: this.counters.product++,
            sku: productData.sku,
            name: productData.name,
            category: productData.category,
            description: productData.description || '',
            unitOfMeasure: productData.unitOfMeasure,
            reorderLevel: parseFloat(productData.reorderLevel) || 0,
            currentStock: 0,
            standardPrice: parseFloat(productData.standardPrice) || 0,
            preferredSupplier: productData.preferredSupplier || '',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.products.set(product.sku, product);
        this.saveToLocalStorage();
        return product;
    }

    updateProduct(sku, updates) {
        const product = this.products.get(sku);
        if (!product) {
            throw new Error('Product not found');
        }

        Object.assign(product, updates, {
            updatedAt: new Date().toISOString()
        });

        this.products.set(sku, product);
        this.saveToLocalStorage();
        return product;
    }

    deleteProduct(sku) {
        const deleted = this.products.delete(sku);
        if (deleted) {
            this.saveToLocalStorage();
        }
        return deleted;
    }

    getProduct(sku) {
        return this.products.get(sku);
    }

    getAllProducts() {
        return Array.from(this.products.values());
    }

    searchProducts(query) {
        const products = this.getAllProducts();
        if (!query) return products;

        const searchTerm = query.toLowerCase();
        return products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.sku.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }

    // Supplier Management
    addSupplier(supplierData) {
        const supplier = {
            id: this.counters.supplier++,
            name: supplierData.name,
            contactPerson: supplierData.contactPerson || '',
            phone: supplierData.phone || '',
            email: supplierData.email || '',
            address: supplierData.address || '',
            paymentTerms: supplierData.paymentTerms || '',
            rating: parseFloat(supplierData.rating) || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.suppliers.set(supplier.name, supplier);
        this.saveToLocalStorage();
        return supplier;
    }

    getSupplier(name) {
        return this.suppliers.get(name);
    }

    getAllSuppliers() {
        return Array.from(this.suppliers.values());
    }

    // Stock In Management
    addStockIn(stockInData) {
        const stockIn = {
            id: this.counters.stockIn++,
            poNumber: stockInData.poNumber,
            date: stockInData.date,
            supplierId: stockInData.supplierId,
            supplierName: stockInData.supplierName,
            productSku: stockInData.productSku,
            productName: stockInData.productName,
            quantity: parseInt(stockInData.quantity),
            unitCost: parseFloat(stockInData.unitCost),
            totalCost: parseFloat(stockInData.totalCost),
            paymentMethod: stockInData.paymentMethod,
            invoiceReference: stockInData.invoiceReference || '',
            notes: stockInData.notes || '',
            receivedBy: stockInData.receivedBy || 'System',
            createdAt: new Date().toISOString()
        };

        this.stockIn.set(stockIn.id, stockIn);

        // Update product stock
        this.updateProductStock(stockIn.productSku, stockIn.quantity, 'stock-in');

        // Add inventory movement
        this.addInventoryMovement({
            productSku: stockIn.productSku,
            movementType: 'stock-in',
            quantity: stockIn.quantity,
            referenceId: stockIn.id,
            date: stockIn.date,
            user: stockIn.receivedBy
        });

        this.saveToLocalStorage();
        return stockIn;
    }

    getAllStockIn() {
        return Array.from(this.stockIn.values()).sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
    }

    // Sales Management
    addSale(saleData) {
        const product = this.getProduct(saleData.productSku);
        if (!product) {
            throw new Error('Product not found');
        }

        if (product.currentStock < saleData.quantity) {
            throw new Error('Insufficient stock');
        }

        const costPrice = this.getAverageCostPrice(saleData.productSku);
        const profit = (parseFloat(saleData.unitPrice) - costPrice) * parseInt(saleData.quantity);

        const sale = {
            id: this.counters.sale++,
            date: saleData.date,
            productSku: saleData.productSku,
            productName: saleData.productName,
            customerName: saleData.customerName || '',
            quantity: parseInt(saleData.quantity),
            unitPrice: parseFloat(saleData.unitPrice),
            totalPrice: parseFloat(saleData.totalPrice),
            costPrice: costPrice,
            profit: profit,
            paymentMethod: saleData.paymentMethod,
            salesperson: saleData.salesperson || 'System',
            notes: saleData.notes || '',
            createdAt: new Date().toISOString()
        };

        this.sales.set(sale.id, sale);

        // Update product stock
        this.updateProductStock(sale.productSku, -sale.quantity, 'sale');

        // Add inventory movement
        this.addInventoryMovement({
            productSku: sale.productSku,
            movementType: 'sale',
            quantity: -sale.quantity,
            referenceId: sale.id,
            date: sale.date,
            user: sale.salesperson
        });

        // Update customer if provided
        if (sale.customerName) {
            this.updateCustomer(sale.customerName, sale.totalPrice);
        }

        this.saveToLocalStorage();
        return sale;
    }

    getAllSales() {
        return Array.from(this.sales.values()).sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
    }

    // Customer Management
    updateCustomer(customerName, purchaseAmount) {
        let customer = this.customers.get(customerName);
        
        if (!customer) {
            customer = {
                id: this.counters.customer++,
                name: customerName,
                phone: '',
                email: '',
                totalPurchases: 0,
                lastPurchaseDate: null,
                notes: '',
                createdAt: new Date().toISOString()
            };
        }

        customer.totalPurchases += purchaseAmount;
        customer.lastPurchaseDate = new Date().toISOString();
        customer.updatedAt = new Date().toISOString();

        this.customers.set(customerName, customer);
        return customer;
    }

    getAllCustomers() {
        return Array.from(this.customers.values());
    }

    // Inventory Movement Management
    addInventoryMovement(movementData) {
        const movement = {
            id: this.counters.movement++,
            productSku: movementData.productSku,
            movementType: movementData.movementType,
            quantity: parseInt(movementData.quantity),
            referenceId: movementData.referenceId,
            date: movementData.date,
            user: movementData.user || 'System',
            createdAt: new Date().toISOString()
        };

        this.inventoryMovements.set(movement.id, movement);
        return movement;
    }

    getInventoryMovements(productSku = null) {
        const movements = Array.from(this.inventoryMovements.values());
        
        if (productSku) {
            return movements.filter(m => m.productSku === productSku);
        }
        
        return movements.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Stock Management
    updateProductStock(productSku, quantityChange, reason) {
        const product = this.products.get(productSku);
        if (!product) {
            throw new Error('Product not found');
        }

        product.currentStock += quantityChange;
        product.updatedAt = new Date().toISOString();

        // Ensure stock doesn't go negative
        if (product.currentStock < 0) {
            product.currentStock = 0;
        }

        this.products.set(productSku, product);
    }

    getAverageCostPrice(productSku) {
        const stockInRecords = Array.from(this.stockIn.values())
            .filter(record => record.productSku === productSku)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (stockInRecords.length === 0) {
            return 0;
        }

        // Use weighted average of last 5 purchases
        const recentRecords = stockInRecords.slice(0, 5);
        let totalCost = 0;
        let totalQuantity = 0;

        recentRecords.forEach(record => {
            totalCost += record.totalCost;
            totalQuantity += record.quantity;
        });

        return totalQuantity > 0 ? totalCost / totalQuantity : 0;
    }

    // Analytics and Reports
    getLowStockProducts() {
        return this.getAllProducts().filter(product => 
            product.currentStock <= product.reorderLevel && product.status === 'active'
        );
    }

    getOutOfStockProducts() {
        return this.getAllProducts().filter(product => 
            product.currentStock === 0 && product.status === 'active'
        );
    }

    getTotalInventoryValue() {
        return this.getAllProducts().reduce((total, product) => {
            const avgCost = this.getAverageCostPrice(product.sku);
            return total + (product.currentStock * avgCost);
        }, 0);
    }

    getMonthlySales(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        return this.getAllSales()
            .filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate >= startDate && saleDate <= endDate;
            })
            .reduce((total, sale) => total + sale.totalPrice, 0);
    }

    getMonthlyProfit(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        return this.getAllSales()
            .filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate >= startDate && saleDate <= endDate;
            })
            .reduce((total, sale) => total + sale.profit, 0);
    }

    getTopSellingProducts(limit = 10) {
        const productSales = new Map();

        this.getAllSales().forEach(sale => {
            const current = productSales.get(sale.productSku) || { 
                sku: sale.productSku, 
                name: sale.productName, 
                quantity: 0, 
                revenue: 0 
            };
            
            current.quantity += sale.quantity;
            current.revenue += sale.totalPrice;
            productSales.set(sale.productSku, current);
        });

        return Array.from(productSales.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    }

    getInventoryTurnover(productSku) {
        const product = this.getProduct(productSku);
        if (!product) return 0;

        const sales = this.getAllSales()
            .filter(sale => sale.productSku === productSku);

        const totalSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
        const averageStock = product.currentStock > 0 ? 
            (product.currentStock + totalSold) / 2 : 
            totalSold / 2;

        return averageStock > 0 ? totalSold / averageStock : 0;
    }

    getABCAnalysis() {
        const productRevenues = this.getTopSellingProducts(1000);
        const totalRevenue = productRevenues.reduce((sum, p) => sum + p.revenue, 0);

        let cumulativeRevenue = 0;
        const analysis = productRevenues.map(product => {
            cumulativeRevenue += product.revenue;
            const cumulativePercentage = (cumulativeRevenue / totalRevenue) * 100;
            
            let category;
            if (cumulativePercentage <= 80) {
                category = 'A';
            } else if (cumulativePercentage <= 95) {
                category = 'B';
            } else {
                category = 'C';
            }

            return {
                ...product,
                revenuePercentage: (product.revenue / totalRevenue) * 100,
                cumulativePercentage,
                category
            };
        });

        return analysis;
    }

    getDeadStock(days = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return this.getAllProducts().filter(product => {
            const recentSales = this.getAllSales().filter(sale => 
                sale.productSku === product.sku && 
                new Date(sale.date) >= cutoffDate
            );
            
            return recentSales.length === 0 && product.currentStock > 0;
        });
    }

    // Data Persistence
    saveToLocalStorage() {
        try {
            const data = {
                products: Array.from(this.products.entries()),
                suppliers: Array.from(this.suppliers.entries()),
                stockIn: Array.from(this.stockIn.entries()),
                sales: Array.from(this.sales.entries()),
                customers: Array.from(this.customers.entries()),
                inventoryMovements: Array.from(this.inventoryMovements.entries()),
                counters: this.counters,
                lastSaved: new Date().toISOString()
            };

            localStorage.setItem('inventoryData', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('inventoryData') || '{}');
            
            if (data.products) {
                this.products = new Map(data.products);
            }
            if (data.suppliers) {
                this.suppliers = new Map(data.suppliers);
            }
            if (data.stockIn) {
                this.stockIn = new Map(data.stockIn);
            }
            if (data.sales) {
                this.sales = new Map(data.sales);
            }
            if (data.customers) {
                this.customers = new Map(data.customers);
            }
            if (data.inventoryMovements) {
                this.inventoryMovements = new Map(data.inventoryMovements);
            }
            if (data.counters) {
                this.counters = data.counters;
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            this.initializeEmpty();
        }
    }

    clearAllData() {
        this.initializeEmpty();
        localStorage.removeItem('inventoryData');
        this.saveToLocalStorage();
    }

    async loadSampleData() {
        // Clear existing data
        this.initializeEmpty();

        // Sample suppliers
        const suppliers = [
            { name: 'Beauty Supply Co', contactPerson: 'John Smith', phone: '555-0101', email: 'john@beautysupply.com' },
            { name: 'Hair World Inc', contactPerson: 'Sarah Johnson', phone: '555-0102', email: 'sarah@hairworld.com' },
            { name: 'Cosmetic Distributors', contactPerson: 'Mike Brown', phone: '555-0103', email: 'mike@cosmeticdist.com' }
        ];

        suppliers.forEach(supplier => this.addSupplier(supplier));

        // Sample products
        const products = [
            { sku: 'HE001', name: 'Brazilian Straight Hair 18"', category: 'Hair Extensions', unitOfMeasure: 'Bundle', reorderLevel: 5, standardPrice: 89.99, preferredSupplier: 'Hair World Inc' },
            { sku: 'HE002', name: 'Peruvian Curly Hair 20"', category: 'Hair Extensions', unitOfMeasure: 'Bundle', reorderLevel: 3, standardPrice: 95.99, preferredSupplier: 'Hair World Inc' },
            { sku: 'BR001', name: 'Kanekalon Braiding Hair Black', category: 'Braids', unitOfMeasure: 'Pack', reorderLevel: 10, standardPrice: 3.99, preferredSupplier: 'Beauty Supply Co' },
            { sku: 'BR002', name: 'Synthetic Braiding Hair Brown', category: 'Braids', unitOfMeasure: 'Pack', reorderLevel: 8, standardPrice: 4.99, preferredSupplier: 'Beauty Supply Co' },
            { sku: 'WV001', name: 'Lace Front Wig Straight', category: 'Weaves', unitOfMeasure: 'Piece', reorderLevel: 2, standardPrice: 129.99, preferredSupplier: 'Hair World Inc' },
            { sku: 'CS001', name: 'Foundation Makeup Set', category: 'Cosmetics', unitOfMeasure: 'Set', reorderLevel: 5, standardPrice: 24.99, preferredSupplier: 'Cosmetic Distributors' },
            { sku: 'CS002', name: 'Lipstick Collection', category: 'Cosmetics', unitOfMeasure: 'Set', reorderLevel: 3, standardPrice: 19.99, preferredSupplier: 'Cosmetic Distributors' },
            { sku: 'AC001', name: 'Hair Clips Set', category: 'Accessories', unitOfMeasure: 'Set', reorderLevel: 15, standardPrice: 8.99, preferredSupplier: 'Beauty Supply Co' },
            { sku: 'PF001', name: 'Designer Perfume 50ml', category: 'Perfumes', unitOfMeasure: 'Bottle', reorderLevel: 4, standardPrice: 45.99, preferredSupplier: 'Cosmetic Distributors' },
            { sku: 'JW001', name: 'Fashion Earrings Gold', category: 'Jewelry', unitOfMeasure: 'Pair', reorderLevel: 6, standardPrice: 15.99, preferredSupplier: 'Beauty Supply Co' }
        ];

        products.forEach(product => this.addProduct(product));

        // Sample stock in records
        const stockInRecords = [
            { poNumber: 'PO001', date: '2024-10-01', supplierName: 'Hair World Inc', productSku: 'HE001', quantity: 20, unitCost: 65.00, paymentMethod: 'Bank Transfer' },
            { poNumber: 'PO002', date: '2024-10-03', supplierName: 'Beauty Supply Co', productSku: 'BR001', quantity: 50, unitCost: 2.50, paymentMethod: 'Cash' },
            { poNumber: 'PO003', date: '2024-10-05', supplierName: 'Cosmetic Distributors', productSku: 'CS001', quantity: 15, unitCost: 18.00, paymentMethod: 'Check' },
            { poNumber: 'PO004', date: '2024-10-07', supplierName: 'Hair World Inc', productSku: 'HE002', quantity: 12, unitCost: 70.00, paymentMethod: 'Bank Transfer' },
            { poNumber: 'PO005', date: '2024-10-10', supplierName: 'Beauty Supply Co', productSku: 'AC001', quantity: 25, unitCost: 6.00, paymentMethod: 'Cash' }
        ];

        stockInRecords.forEach(record => {
            const product = this.getProduct(record.productSku);
            this.addStockIn({
                ...record,
                productName: product.name,
                totalCost: record.quantity * record.unitCost
            });
        });

        // Sample sales
        const salesRecords = [
            { date: '2024-10-15', productSku: 'HE001', customerName: 'Maria Garcia', quantity: 2, unitPrice: 89.99, paymentMethod: 'Card' },
            { date: '2024-10-16', productSku: 'BR001', customerName: 'Ashley Johnson', quantity: 5, unitPrice: 3.99, paymentMethod: 'Cash' },
            { date: '2024-10-17', productSku: 'CS001', customerName: 'Jennifer Smith', quantity: 1, unitPrice: 24.99, paymentMethod: 'Card' },
            { date: '2024-10-18', productSku: 'WV001', customerName: 'Lisa Brown', quantity: 1, unitPrice: 129.99, paymentMethod: 'Card' },
            { date: '2024-10-20', productSku: 'AC001', customerName: 'Diana Wilson', quantity: 3, unitPrice: 8.99, paymentMethod: 'Cash' },
            { date: '2024-10-22', productSku: 'HE002', customerName: 'Maria Garcia', quantity: 1, unitPrice: 95.99, paymentMethod: 'Card' },
            { date: '2024-10-25', productSku: 'PF001', customerName: 'Sarah Davis', quantity: 2, unitPrice: 45.99, paymentMethod: 'Card' }
        ];

        salesRecords.forEach(record => {
            const product = this.getProduct(record.productSku);
            this.addSale({
                ...record,
                productName: product.name,
                totalPrice: record.quantity * record.unitPrice
            });
        });

        this.saveToLocalStorage();
    }
}