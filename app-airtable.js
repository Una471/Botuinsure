// app-airtable.js - FIXED FOR PERSONAL & BUSINESS CATEGORIES - FULL VERSION
const AIRTABLE_TOKEN = 'pat3O0ibg4EKppGFd.404fe41eea77ee6e66e2d8e72179250447c20021f4aed351a51134c04d6a4cdb';
const AIRTABLE_BASE_ID = 'appyCd1RKcaY8q1We';
const AIRTABLE_TABLE = 'Products';

// Load existing selections
let selectedProducts = new Set(JSON.parse(localStorage.getItem('selectedProducts') || '[]'));

// Get current page category
function getCurrentCategory() {
    const path = window.location.pathname;
    const pageName = path.split('/').pop().replace('.html', '');
    
    if (path === '/' || path.endsWith('index.html') || path === '') return null;
    
    // ONLY 7 CATEGORIES NOW
    const pageToCategory = {
        'medical': 'medical',
        'life': 'life',
        'funeral': 'funeral',
        'health': 'health',
        'property': 'property',
        'liability': 'liability',
        'workers-compensation': 'workers_compensation'
    };
    
    return pageToCategory[pageName] || null;
}

// Auto-fix navigation on EVERY page
function fixNavigation() {
    // Get current page
    const path = window.location.pathname;
    const currentPage = path.split('/').pop().replace('.html', '');
    
    // Don't fix homepage
    if (currentPage === 'index' || currentPage === '') return;
    
    // Find the navbar in the page
    const navbar = document.querySelector('.navbar-collapse');
    if (!navbar) return;
    
    // Check if already fixed
    if (navbar.innerHTML.includes('Personal Insurance')) return;
    
    // Create new navigation HTML
    const isPersonalPage = ['life', 'funeral', 'medical', 'health'].includes(currentPage);
    const isBusinessPage = ['property', 'liability', 'workers-compensation'].includes(currentPage);
    
    let activePersonal = isPersonalPage ? 'active' : '';
    let activeBusiness = isBusinessPage ? 'active' : '';
    
    // Set active for specific page
    let lifeActive = currentPage === 'life' ? 'active' : '';
    let funeralActive = currentPage === 'funeral' ? 'active' : '';
    let medicalActive = currentPage === 'medical' ? 'active' : '';
    let healthActive = currentPage === 'health' ? 'active' : '';
    let propertyActive = currentPage === 'property' ? 'active' : '';
    let liabilityActive = currentPage === 'liability' ? 'active' : '';
    let workersActive = currentPage === 'workers-compensation' ? 'active' : '';
    
    const newNavHTML = `
        <ul class="navbar-nav ms-auto main-nav">
            <li class="nav-item">
                <a class="nav-link" href="../index.html">
                    <i class="fas fa-home"></i><span>Home</span>
                </a>
            </li>
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle ${activePersonal}" href="#" id="personalDropdown" role="button" data-bs-toggle="dropdown">
                    <i class="fas fa-user"></i><span>Personal Insurance</span>
                </a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item ${lifeActive}" href="life.html"><i class="fas fa-user-shield"></i> Life Insurance</a></li>
                    <li><a class="dropdown-item ${funeralActive}" href="funeral.html"><i class="fas fa-cross"></i> Funeral Insurance</a></li>
                    <li><a class="dropdown-item ${medicalActive}" href="medical.html"><i class="fas fa-heartbeat"></i> Medical Aid</a></li>
                    <li><a class="dropdown-item ${healthActive}" href="health.html"><i class="fas fa-stethoscope"></i> Health Insurance</a></li>
                </ul>
            </li>
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle ${activeBusiness}" href="#" id="businessDropdown" role="button" data-bs-toggle="dropdown">
                    <i class="fas fa-briefcase"></i><span>Business Insurance</span>
                </a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item ${propertyActive}" href="property.html"><i class="fas fa-warehouse"></i> Property Insurance</a></li>
                    <li><a class="dropdown-item ${liabilityActive}" href="liability.html"><i class="fas fa-users"></i> Liability Insurance</a></li>
                    <li><a class="dropdown-item ${workersActive}" href="workers-compensation.html"><i class="fas fa-hard-hat"></i> Workers Compensation</a></li>
                </ul>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showComparison()">
                    <i class="fas fa-balance-scale"></i>
                    <span>Compare</span>
                    <span id="selectedCount" class="badge bg-danger ms-1">0</span>
                </a>
            </li>
        </ul>
    `;
    
    navbar.innerHTML = newNavHTML;
    console.log('Navigation fixed for', currentPage);
}

// Load everything when page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Fix navigation FIRST
    fixNavigation();
    
    const currentCategory = getCurrentCategory();
    await loadProducts(currentCategory);
    setupEventListeners();
    updatePageHeader(currentCategory);
    setupBreadcrumb(currentCategory);
    updateSelectedCount();
});

async function loadProducts(filterCategory = null) {
    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}?sort%5B0%5D%5Bfield%5D=ID`,
            {
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) throw new Error('Airtable error');
        
        const data = await response.json();
        
        window.allProducts = data.records.map((record, index) => {
            const fields = record.fields;
            
            let premiums = [];
            if (fields['Premiums JSON']) {
                try {
                    premiums = JSON.parse(fields['Premiums JSON'].replace(/(\w+):/g, '"$1":'));
                } catch(e) {}
            }
            
            const productId = fields.ID && fields.ID !== 0 ? String(fields.ID) : 
                              record.id ? record.id : 
                              String(index + 1);
            
            return {
                id: productId, 
                name: fields.Name || '',
                category: fields.Category || '',
                company: { 
                    name: fields['Company Name'] || '',
                    logoUrl: fields['Company Logo URL'] || '',
                    logoColor: fields['Logo Color'] || '#6c757d',
                    logoText: fields['Logo Text'] || 'INS'
                },
                sum_assured: fields['Sum Assured'] || null,
                annual_limit: fields['Annual Limit'] || null,
                premiums: premiums,
                waiting_period_natural: fields['Waiting Period Natural'] || '',
                co_payment: fields['Co Payment'] || null,
                hospital_network: fields['Hospital Network'] || '',
                key_features: fields['Key Features'] ? fields['Key Features'].split('\n').filter(f => f.trim()) : [],
                product_image: fields['Product Image URL'] || '',
                plan_tiers: fields['Plan Tiers'] || '',
                basic_price: fields['Basic Price'] || null,
                standard_price: fields['Standard Price'] || null,
                premium_price: fields['Premium Price'] || null,
                price_notes: fields['Price Notes'] || ''
            };
        });
        
        console.log(`Loaded ${window.allProducts.length} products from Airtable`);
        
        if (filterCategory) {
            window.filteredProducts = window.allProducts.filter(p => p.category === filterCategory);
            console.log(`Filtered to ${window.filteredProducts.length} products in ${filterCategory} category`);
            displayFilteredProducts(filterCategory);
        } else {
            displayAllProducts();
        }

        document.querySelectorAll('.compare-checkbox').forEach(cb => {
            if (selectedProducts.has(cb.getAttribute('data-product-id'))) {
                cb.checked = true;
            }
        });
        
    } catch (error) {
        console.error('Failed to load:', error);
        loadFallbackData(filterCategory);
    }
}

function loadFallbackData(filterCategory = null) {
    const script = document.createElement('script');
    script.src = 'data.js';
    script.onload = function() {
        console.log('Using fallback data.js');
        if (filterCategory) {
            window.filteredProducts = window.allProducts.filter(p => p.category === filterCategory);
            displayFilteredProducts(filterCategory);
        } else {
            displayAllProducts();
        }
    };
    document.head.appendChild(script);
}

// ============== displayAllProducts (Home Page) ==============
function displayAllProducts() {
    if (!window.allProducts || window.allProducts.length === 0) {
        console.log('No products to display');
        const compareSection = document.getElementById('compare');
        if (compareSection) {
            compareSection.innerHTML = `
                <div class="container text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h3>No Insurance Plans Available</h3>
                    <p class="lead">No products found in Airtable database.</p>
                </div>
            `;
        }
        return;
    }
    
    // Get all unique categories from products
    const allCategories = [...new Set(window.allProducts.map(p => p.category))];
    
    // Group by Personal vs Business
    const personalCategories = ['life', 'funeral', 'medical', 'health'];
    const businessCategories = ['property', 'liability', 'workers_compensation'];
    
    console.log('=== HOME PAGE DEBUG ===');
    console.log('All categories found in data:', allCategories);
    console.log('Personal categories to check:', personalCategories);
    console.log('Business categories to check:', businessCategories);
    
    // Check which categories actually have products
    const personalToShow = personalCategories.filter(cat => allCategories.includes(cat));
    const businessToShow = businessCategories.filter(cat => allCategories.includes(cat));
    
    console.log('Personal categories with products:', personalToShow);
    console.log('Business categories with products:', businessToShow);
    
    // Clear the compare section first
    const compareSection = document.getElementById('compare');
    if (compareSection) {
        compareSection.innerHTML = '';
    }
    
    // Display Personal Insurance Section if we have personal products
    if (personalToShow.length > 0) {
        console.log('Displaying Personal Insurance section');
        displayCategoryGroup('Personal Insurance', personalToShow);
    } else {
        console.log('No personal insurance products found');
    }
    
    // Display Business Insurance Section if we have business products
    if (businessToShow.length > 0) {
        console.log('Displaying Business Insurance section');
        displayCategoryGroup('Business Insurance', businessToShow);
    } else {
        console.log('No business insurance products found');
    }
    
    // If nothing shows at all, show a help message
    if (personalToShow.length === 0 && businessToShow.length === 0) {
        console.log('No products in any category');
        if (compareSection) {
            compareSection.innerHTML = `
                <div class="container text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h3>No Insurance Plans Available</h3>
                    <p class="lead">Products found, but none are in the correct categories.</p>
                    <div class="mt-4">
                        <p><strong>Your products are in these categories:</strong></p>
                        <div class="alert alert-info">
                            ${allCategories.map(cat => `<span class="badge bg-primary me-2">${cat}</span>`).join('')}
                        </div>
                        <p><strong>Required Categories:</strong></p>
                        <div class="row justify-content-center">
                            <div class="col-md-6">
                                <h5>Personal Insurance</h5>
                                <ul class="list-unstyled">
                                    <li><i class="fas fa-check text-success"></i> life</li>
                                    <li><i class="fas fa-check text-success"></i> funeral</li>
                                    <li><i class="fas fa-check text-success"></i> medical</li>
                                    <li><i class="fas fa-check text-success"></i> health</li>
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <h5>Business Insurance</h5>
                                <ul class="list-unstyled">
                                    <li><i class="fas fa-check text-success"></i> property</li>
                                    <li><i class="fas fa-check text-success"></i> liability</li>
                                    <li><i class="fas fa-check text-success"></i> workers_compensation</li>
                                </ul>
                            </div>
                        </div>
                        <p class="mt-3">Go to Airtable and update the "Category" field for your products.</p>
                    </div>
                </div>
            `;
        }
    }
}

function displayCategoryGroup(groupName, categories) {
    if (categories.length === 0) {
        console.log(`No categories to display for ${groupName}`);
        return;
    }
    
    const compareSection = document.getElementById('compare');
    if (!compareSection) {
        console.log('No compare section found');
        return;
    }
    
    const section = document.createElement('section');
    section.id = groupName.toLowerCase().replace(' ', '_');
    section.className = 'py-5';
    
        // NO BACKGROUND COLORS - both sections look the same
    // Remove bg-light class to make both sections normal
    
    let groupHTML = `
        <div class="container">
            <h2 class="text-center mb-5">
                <i class="fas ${groupName === 'Personal Insurance' ? 'fa-user' : 'fa-briefcase'}"></i> 
                ${groupName}
            </h2>
            <div class="row">
    `;
    
    // Add category cards for EACH category
    categories.forEach(categoryId => {
        const categoryInfo = getCategoryInfo(categoryId);
        const products = window.allProducts.filter(p => p.category === categoryId);
        
        console.log(`Category ${categoryId}: ${products.length} products`);
        
                groupHTML += `
            <div class="col-md-3 col-6 mb-4">
                <a href="${categoryInfo.page}" class="category-link">
                    <div class="category-card">
                        <i class="fas ${categoryInfo.icon}"></i>
                        <h5>${categoryInfo.name}</h5>
                        <p>${products.length} plan${products.length !== 1 ? 's' : ''} available</p>
                    </div>
                </a>
            </div>
        `;
    });
    
    groupHTML += `
            </div>
        </div>
    `;
    
    section.innerHTML = groupHTML;
    
    // Insert before the compare section
    if (compareSection.parentElement) {
        compareSection.parentElement.insertBefore(section, compareSection);
        console.log(`Added ${groupName} section with ${categories.length} categories`);
    } else {
        // If no parent, just append to compare section
        compareSection.appendChild(section);
    }
}

// ============== displayFilteredProducts (Category Page) ==============
function displayFilteredProducts(categoryId) {
    if (!window.filteredProducts || window.filteredProducts.length === 0) {
        const container = document.getElementById('productsContainer');
        if (container) {
                        container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <h3>No products available</h3>
                    <p>There are currently no ${getCategoryName(categoryId)} plans available.</p>
                    <a href="index.html" class="btn btn-primary">
                        <i class="fas fa-home"></i> Back to Home
                    </a>
                </div>
            `;
        }
        return;
    }
    
    const container = document.getElementById('productsContainer');
    if (container) {
        container.innerHTML = '';
        
        window.filteredProducts.forEach(product => {
            container.appendChild(createCard(product));
        });
    }
}

function updatePageHeader(category) {
    if (!category) return;
    
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    
    if (pageTitle) {
        const categoryInfo = getCategoryInfo(category);
        pageTitle.innerHTML = `<i class="fas ${categoryInfo.icon}"></i> ${categoryInfo.name}`;
    }
    
    if (pageSubtitle) {
        const productCount = window.filteredProducts ? window.filteredProducts.length : 0;
        pageSubtitle.textContent = `Compare ${productCount} ${getCategoryName(category)} plans from top insurers`;
    }
}

function setupBreadcrumb(category) {
    if (!category) return;
    
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        const categoryInfo = getCategoryInfo(category);
        breadcrumb.innerHTML = `
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="index.html"><i class="fas fa-home"></i> Home</a></li>
                    <li class="breadcrumb-item active" aria-current="page">${categoryInfo.name}</li>
                </ol>
            </nav>
        `;
    }
}

function getCategoryInfo(categoryId) {
    // UPDATED CATEGORY INFO - ONLY 7 CATEGORIES
    const categoryInfo = {
        'medical': { name: 'Medical Aid', icon: 'fa-heartbeat', page: 'medical.html' },
        'life': { name: 'Life Insurance', icon: 'fa-user-shield', page: 'life.html' },
        'funeral': { name: 'Funeral Insurance', icon: 'fa-cross', page: 'funeral.html' },
        'health': { name: 'Health Insurance', icon: 'fa-stethoscope', page: 'health.html' },
        'property': { name: 'Property Insurance', icon: 'fa-warehouse', page: 'property.html' },
        'liability': { name: 'Liability Insurance', icon: 'fa-users', page: 'liability.html' },
        'workers_compensation': { name: 'Workers Compensation', icon: 'fa-hard-hat', page: 'workers-compensation.html' }
    };
    
    return categoryInfo[categoryId] || { 
        name: categoryId.replace(/_/g, ' ').toUpperCase(), 
        icon: 'fa-shield-alt',
        page: categoryId.replace('_', '-') + '.html'
    };
}

function getCategoryName(categoryId) {
    const info = getCategoryInfo(categoryId);
    return info.name;
}

function createCard(product) {
    const div = document.createElement('div');
    div.className = 'col-md-4 mb-4';
    
    const productImage = getProductImage(product);
    const logoData = getLogoData(product);
    
    let priceHtml = '';
    
    if (product.basic_price || product.standard_price || product.premium_price) {
        const prices = [];
        if (product.basic_price) prices.push(product.basic_price);
        if (product.standard_price) prices.push(product.standard_price);
        if (product.premium_price) prices.push(product.premium_price);
        
        if (prices.length > 0) {
            const min = Math.min(...prices);
            priceHtml = `<div class="price-badge">From P${min}/month</div>`;
            
            if (product.plan_tiers) {
                priceHtml += `<div class="price-tiers mt-2 small text-muted">${product.plan_tiers.replace(/\n/g, '<br>')}</div>`;
            }
        }
    } 
    else if (product.premiums && product.premiums.length > 0) {
        const min = Math.min(...product.premiums.map(p => p.monthly_premium).filter(p => p));
        priceHtml = `<div class="price-badge">From P${min}/month</div>`;
    } else {
        priceHtml = '<div class="price-badge text-muted">Contact for quote</div>';
    }
    
    if (product.price_notes) {
        priceHtml += `<div class="price-notes mt-2 small">${product.price_notes}</div>`;
    }
    
    let logoHtml = '';
    if (logoData.image) {
        logoHtml = `<div class="company-logo-container"><img src="${logoData.image}" class="company-logo"></div>`;
    } else {
        logoHtml = `<div class="company-logo-container"><div class="company-logo-placeholder" style="background:${logoData.bgColor}">${logoData.text}</div></div>`;
    }
    
    let featuresHtml = `
        <div class="company-highlight mb-3">
            <strong><i class="fas fa-building"></i> Company:</strong> ${product.company.name}
        </div>
    `;
    
    if (product.sum_assured) {
        featuresHtml += `<p><strong><i class="fas fa-shield-alt"></i> Coverage:</strong> ${product.sum_assured}</p>`;
    }
    if (product.annual_limit) {
        featuresHtml += `<p><strong><i class="fas fa-calendar-alt"></i> Annual Limit:</strong> P${product.annual_limit.toLocaleString()}</p>`;
    }
    if (product.waiting_period_natural) {
        featuresHtml += `<p><strong><i class="fas fa-clock"></i> Waiting Period:</strong> ${product.waiting_period_natural}</p>`;
    }
    
    if (product.key_features && product.key_features.length > 0) {
        featuresHtml += `<p><strong><i class="fas fa-star"></i> Key Benefits:</strong> ${product.key_features.slice(0, 2).join(', ')}</p>`;
    }
    
    div.innerHTML = `
        <div class="card product-card h-100">
            <div class="product-image" style="background-image:url('${productImage}')">
                <div class="product-overlay"></div>
                ${logoHtml}
            </div>
            <div class="card-body">
                <h5 class="product-title">${product.name}</h5>
                ${priceHtml}
                <div class="product-features">${featuresHtml}</div>
                <div class="mt-3 d-flex justify-content-between">
                    <button class="btn btn-get-quote" onclick="showLeadForm('${product.id}')">
                        <i class="fas fa-quote-right"></i> Get Quote
                    </button>
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input compare-checkbox" id="compare${product.id}" data-product-id="${product.id}">
                        <label class="form-check-label" for="compare${product.id}">
                            <i class="fas fa-balance-scale"></i> Compare
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return div;
}

// ============== SIMPLE COMPARISON FUNCTIONS ==============
document.addEventListener('change', function(e) {
    if (e.target && e.target.classList.contains('compare-checkbox')) {
        handleCompareCheckbox(e);
    }
});

function handleCompareCheckbox(event) {
    const checkbox = event.target;
    const productId = checkbox.getAttribute('data-product-id');
    
    if (checkbox.checked) {
        selectedProducts.add(productId);
    } else {
        selectedProducts.delete(productId);
    }
    
    localStorage.setItem('selectedProducts', JSON.stringify(Array.from(selectedProducts)));
    updateSelectedCount();
}

function updateSelectedCount() {
    const count = document.getElementById('selectedCount');
    if (count) {
        count.textContent = selectedProducts.size;
        
        const compareBtn = document.querySelector('button[onclick="showComparison()"]');
        if (compareBtn) {
            if (selectedProducts.size === 0) {
                compareBtn.innerHTML = '<i class="fas fa-balance-scale"></i> Show Comparison';
                compareBtn.classList.remove('btn-success');
                compareBtn.classList.add('btn-primary');
            } else {
                compareBtn.innerHTML = `<i class="fas fa-balance-scale"></i> Compare (${selectedProducts.size})`;
                compareBtn.classList.remove('btn-primary');
                compareBtn.classList.add('btn-success');
            }
        }
    }
}

function showComparison() {
    if (selectedProducts.size < 2) {
        alert('Please select at least 2 plans to compare');
        return;
    }
    
    const selectedIds = Array.from(selectedProducts);
    const products = window.allProducts.filter(p => selectedIds.includes(String(p.id)));
    
    if (products.length < 2) {
        alert('Error: Could not find selected products in the current list.');
        return;
    }
    
    let comparisonHtml = '<div class="table-responsive"><table class="table comparison-table table-striped">';
    
    comparisonHtml += '<thead><tr>';
    comparisonHtml += '<th style="width: 20%;">Feature</th>';
    products.forEach(product => {
        comparisonHtml += `
            <th style="width: ${80/products.length}%;">
                <div class="text-center">
                    <div class="comparison-product-image mb-3" style="background-image:url('${getProductImage(product)}')">
                        <div class="comparison-logo-container">
                            ${getComparisonLogo(product)}
                        </div>
                    </div>
                    <div class="comparison-product-info">
                        <strong>${product.name}</strong><br>
                        <small class="text-muted"><i class="fas fa-building"></i> ${product.company.name}</small>
                    </div>
                </div>
            </th>
        `;
    });
    comparisonHtml += '</tr></thead><tbody>';
    
    comparisonHtml += '<tr><td><strong><i class="fas fa-money-bill-wave"></i> Monthly Premium</strong></td>';
    products.forEach(product => {
        let priceText = 'Contact for quote';
        
        if (product.basic_price || product.standard_price || product.premium_price) {
            const prices = [];
            if (product.basic_price) prices.push(product.basic_price);
            if (product.standard_price) prices.push(product.standard_price);
            if (product.premium_price) prices.push(product.premium_price);
            
            if (prices.length > 0) {
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                priceText = min === max ? `P${min}` : `P${min} - P${max}`;
                
                if (product.plan_tiers) {
                    priceText += `<br><small class="text-muted">${product.plan_tiers.split('\n')[0]}</small>`;
                }
            }
        }
        else if (product.premiums && product.premiums.length > 0) {
            const prices = product.premiums.map(p => p.monthly_premium).filter(p => p);
            if (prices.length > 0) {
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                priceText = min === max ? `P${min}` : `P${min} - P${max}`;
            }
        }
        
        comparisonHtml += `<td><strong class="text-primary">${priceText}</strong></td>`;
    });
    comparisonHtml += '</tr>';
    
    const features = [
        { name: 'Coverage Amount', icon: 'fa-shield-alt', key: 'sum_assured', format: v => v || 'N/A' },
        { name: 'Annual Limit', icon: 'fa-calendar-alt', key: 'annual_limit', format: v => v ? `P${v.toLocaleString()}` : 'N/A' },
        { name: 'Waiting Period', icon: 'fa-clock', key: 'waiting_period_natural', format: v => v || 'No waiting period' },
        { name: 'Co-payment', icon: 'fa-hand-holding-usd', key: 'co_payment', format: v => v || 'None' }
    ];
    
    features.forEach(feature => {
        comparisonHtml += `<tr><td><strong><i class="fas ${feature.icon}"></i> ${feature.name}</strong></td>`;
        products.forEach(product => {
            comparisonHtml += `<td>${feature.format(product[feature.key])}</td>`;
        });
        comparisonHtml += '</tr>';
    });
    
    comparisonHtml += '<tr><td><strong><i class="fas fa-star"></i> Key Benefits</strong></td>';
    products.forEach(product => {
        let featuresHtml = '';
        if (product.key_features && product.key_features.length > 0) {
            featuresHtml = '<ul class="small mb-0 ps-3">';
            product.key_features.slice(0, 4).forEach(feature => {
                featuresHtml += `<li>${feature}</li>`;
            });
            if (product.key_features.length > 4) {
                featuresHtml += `<li class="text-muted">+${product.key_features.length - 4} more</li>`;
            }
            featuresHtml += '</ul>';
        } else {
            featuresHtml = '<span class="text-muted">N/A</span>';
        }
        comparisonHtml += `<td>${featuresHtml}</td>`;
    });
    comparisonHtml += '</tr>';
    
    comparisonHtml += '<tr><td><strong><i class="fas fa-quote-right"></i> Get Quote</strong></td>';
    products.forEach(product => {
        comparisonHtml += `
            <td>
                <button class="btn btn-sm btn-primary" onclick="showLeadForm('${product.id}')">
                    <i class="fas fa-envelope"></i> Request Quote
                </button>
            </td>
        `;
    });
    comparisonHtml += '</tr>';
    
    comparisonHtml += '<tr><td><strong><i class="fas fa-trash-alt"></i> Clear Selection</strong></td>';
    products.forEach(product => {
        comparisonHtml += `
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="removeFromComparison('${product.id}')">
                    <i class="fas fa-times"></i> Remove
                </button>
            </td>
        `;
    });
    comparisonHtml += '</tr>';
    
    comparisonHtml += '</tbody></table></div>';
    document.getElementById('comparisonTable').innerHTML = comparisonHtml;
    
    const modal = new bootstrap.Modal(document.getElementById('compareModal'));
    modal.show();
}

function removeFromComparison(id) {
    selectedProducts.delete(id);
    localStorage.setItem('selectedProducts', JSON.stringify(Array.from(selectedProducts)));
    
    const checkbox = document.getElementById(`compare${id}`);
    if (checkbox) {
        checkbox.checked = false;
    }
    updateSelectedCount();
    
    if (selectedProducts.size < 2) {
        bootstrap.Modal.getInstance(document.getElementById('compareModal')).hide();
        if (selectedProducts.size === 0) {
            alert('Comparison cleared. Select 2 or more products to compare again.');
        }
    } else {
        showComparison();
    }
}

function getComparisonLogo(product) {
    const logoData = getLogoData(product);
    if (logoData.image) {
        return `<img src="${logoData.image}" alt="${product.company.name}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 8px;">`;
    } else {
        return `<div style="width: 50px; height: 50px; background:${logoData.bgColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 8px;">${logoData.text}</div>`;
    }
}

function getLogoData(product) {
    if (product.company.logoUrl && product.company.logoUrl.trim()) {
        return {
            image: product.company.logoUrl,
            bgColor: product.company.logoColor,
            text: product.company.logoText
        };
    }
    
    const company = product.company.name;
    if (company.includes('Pula')) {
        return { image: 'images/logos/pulamed.png', bgColor: '#4CAF50', text: 'PM' };
    } else if (company.includes('BPOMAS')) {
        return { image: 'images/logos/bpomas.png', bgColor: '#2196F3', text: 'BP' };
    } else if (company.includes('Botsogo')) {
        return { image: 'images/logos/botsogo.png', bgColor: '#FF9800', text: 'BH' };
    } else if (company.includes('Liberty')) {
        return { image: 'images/logos/liberty.png', bgColor: '#9C27B0', text: 'LL' };
    } else if (company.includes('Metropolitan')) {
        return { image: 'images/logos/metropolitan.png', bgColor: '#F44336', text: 'ML' };
    }
    
    return { image: null, bgColor: '#6c757d', text: product.company.name.substring(0,2) };
}

function getProductImage(product) {
    if (product.product_image && product.product_image.trim()) {
        return product.product_image;
    }
    
    const name = product.name;
    if (name.includes('Executive')) return 'images/products/pulamed/executive.jpg';
    if (name.includes('Deluxe')) return 'images/products/pulamed/deluxe.jpg';
    if (name.includes('Galaxy')) return 'images/products/pulamed/galaxy.jpg';
    if (name.includes('Flexi')) return 'images/products/pulamed/flexi.jpg';
    if (name.includes('Diamond')) return 'images/products/botsogo/diamond.jpg';
    if (name.includes('Platinum')) return 'images/products/botsogo/platinum.jpg';
    if (name.includes('Ruby')) return 'images/products/botsogo/ruby.jpg';
    if (name.includes('Bronze')) return 'images/products/botsogo/bronze.jpg';
    if (name.includes('Standard')) return 'images/products/bpomas/standard.jpg';
    if (name.includes('High')) return 'images/products/bpomas/high.jpg';
    if (name.includes('Premium')) return 'images/products/bpomas/premium.jpg';
    if (name.includes('Lifeline')) return 'images/products/metropolitan/lifeline.jpg';
    if (name.includes('Term Shield')) return 'images/products/metropolitan/termshield.jpg';
    if (name.includes('Home Secure')) return 'images/products/metropolitan/homesecure.jpg';
    if (name.includes('Boago')) return 'images/products/liberty/boago.jpg';
    
    return 'images/products/default.jpg';
}

function showLeadForm(id) {
    document.getElementById('selectedProductId').value = id;
    new bootstrap.Modal(document.getElementById('leadModal')).show();
}

function submitLead(e) {
    e.preventDefault();
    alert('Thank you! Insurer will contact you.');
    bootstrap.Modal.getInstance(document.getElementById('leadModal')).hide();
    e.target.reset();
}

function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({behavior:'smooth'});
}

function setupEventListeners() {
    const leadForm = document.getElementById('leadForm');
    if (leadForm) {
        leadForm.addEventListener('submit', submitLead);
    }
}

function navigateToCategory(categoryId) {
    const page = getCategoryInfo(categoryId).page;
    window.location.href = `pages/${page}`;
}