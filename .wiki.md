# Project Summary
The Beauty Supply Store Inventory Management System is a comprehensive, production-ready application designed to streamline inventory tracking and sales processes for a beauty supply store. This system manages various products including hair extensions, cosmetics, and accessories, and provides essential features such as stock-in tracking, sales management, and detailed reporting to optimize business operations and improve profitability.

# Project Module Description
The system consists of the following functional modules:
1. **Dashboard**: Displays real-time KPIs such as total inventory value, monthly sales, low stock alerts, and top-selling items.
2. **Stock-In Management**: Records all purchase orders, tracks supplier information, and manages inventory levels.
3. **Sales Management**: Enhances sales tracking with automatic profit calculations and customer management.
4. **Product Master List**: Allows for comprehensive product management including SKU definitions, pricing, and stock levels.
5. **Reports & Analytics**: Provides insights into inventory turnover, ABC analysis, profit margins, and dead stock identification.

# Directory Tree
```
html_template/
│
├── data/
│   └── schema.js                   # Database schema definitions and sample data management
│
├── modules/
│   ├── dashboard.js                # Dashboard module for KPI calculations and charts
│   ├── inventory.js                # Inventory management module for product and stock-in handling
│   ├── reports.js                  # Reporting module for generating analytics and export functionality
│   └── sales.js                    # Sales management module for transaction recording
│
├── index.html                      # Main HTML structure for the single-page application
├── package.json                    # Project dependencies and scripts
├── script.js                       # Main application controller and routing logic
├── style.css                       # Styles for the application
└── template_config.json            # Configuration for templates and modals
```

# File Description Inventory
- **schema.js**: Defines the data structure for products, suppliers, stock-in records, sales, and customers.
- **dashboard.js**: Manages dashboard functionalities, including KPI updates and charts.
- **inventory.js**: Handles product management and stock-in operations.
- **reports.js**: Generates various reports and analytics for business insights.
- **sales.js**: Manages sales transactions and customer interactions.
- **index.html**: The entry point for the application, containing the layout and structure.
- **package.json**: Lists project dependencies and contains scripts for building and running the application.
- **script.js**: Controls the application flow and integrates all modules.
- **style.css**: Contains the styling rules for the application.

# Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: MySQL (simulated with JavaScript objects for local storage)
- **Architecture**: Offline-first with local caching and synchronization capabilities.

# Usage
1. **Install Dependencies**: Run `pnpm install` to install all necessary packages.
2. **Build the Application**: Execute `pnpm run build` to compile the application.
3. **Run the Application**: Use `pnpm run lint` to check for code quality issues.
