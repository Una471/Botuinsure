// airtable-simple.js - COMPLETE AIRTABLE WITH IMAGES
// This replaces data.js completely

// ================= CONFIGURATION =================
// CHANGE THESE 3 VALUES ONLY:
const AIRTABLE_TOKEN = '';      // Your Personal Access Token
const AIRTABLE_BASE_ID = '';   // Your Base ID
const AIRTABLE_TABLE = 'Products';              // Table name (must be "Products")

// ================= DON'T TOUCH BELOW =================

// Load all data from Airtable
async function loadFromAirtable() {
    console.log('🔄 Loading from Airtable...');
    
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
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        
        // Convert Airtable to your data.js format
        const products = data.records.map(record => {
            const fields = record.fields;
            
            // Parse premiums
            let premiums = [];
            if (fields['Premiums JSON']) {
                try {
                    const fixedJson = fields['Premiums JSON']
                        .replace(/(\w+):/g, '"$1":')
                        .replace(/,\s*}/g, '}')
                        .replace(/,\s*]/g, ']');
                    premiums = JSON.parse(fixedJson);
                } catch (e) {
                    console.warn('Could not parse premiums:', e);
                }
            }
            
            // Parse key features
            const keyFeatures = fields['Key Features'] 
                ? fields['Key Features'].split('\n').filter(f => f.trim()).map(f => f.trim())
                : [];
            
            // NEW: Get image URLs from Airtable
            const logoUrl = fields['Company Logo URL'] || '';
            const productImageUrl = fields['Product Image URL'] || '';
            
            return {
                id: fields.ID || 0,
                name: fields.Name || '',
                category: fields.Category || '',
                company: { 
                    name: fields['Company Name'] || '',
                    // NEW: Store logo info
                    logoUrl: logoUrl,
                    logoColor: fields['Logo Color'] || '#6c757d',
                    logoText: fields['Logo Text'] || fields['Company Name']?.substring(0, 2).toUpperCase() || 'INS'
                },
                sum_assured: fields['Sum Assured'] || null,
                annual_limit: fields['Annual Limit'] || null,
                premiums: premiums,
                waiting_period_natural: fields['Waiting Period Natural'] || '',
                waiting_period_accidental: fields['Waiting Period Accidental'] || '',
                co_payment: fields['Co Payment'] || null,
                hospital_network: fields['Hospital Network'] || '',
                key_features: keyFeatures,
                // NEW: Store product image URL
                product_image: productImageUrl
            };
        });
        
        console.log(`✅ Loaded ${products.length} products from Airtable`);
        console.log('Sample product:', products[0]);
        return products;
        
    } catch (error) {
        console.error('❌ Failed to load from Airtable:', error);
        
        // Try to use local data.js as last resort
        if (window.allProducts && window.allProducts.length > 0) {
            console.log('🔄 Falling back to local data.js...');
            return window.allProducts;
        }
        
        return [];
    }
}

// Override your getCompanyLogo function to use Airtable data
function getCompanyLogo(companyName) {
    // First, check if we have Airtable data
    if (window.allProducts) {
        const product = window.allProducts.find(p => 
            p.company && p.company.name === companyName
        );
        
        if (product && product.company) {
            // Check if we have a logo URL from Airtable
            if (product.company.logoUrl && 
                (product.company.logoUrl.startsWith('http://') || 
                 product.company.logoUrl.startsWith('https://'))) {
                return {
                    image: product.company.logoUrl,
                    bgColor: product.company.logoColor || '#6c757d',
                    text: product.company.logoText || companyName.substring(0, 2).toUpperCase(),
                    name: companyName.split(' ')[0]
                };
            }
            
            // If no URL but we have color/text
            return {
                image: null,
                bgColor: product.company.logoColor || '#6c757d',
                text: product.company.logoText || companyName.substring(0, 2).toUpperCase(),
                name: companyName.split(' ')[0]
            };
        }
    }
    
    // Fallback to original hardcoded logos (backward compatibility)
    const logos = {
        'Pula Medical Aid Fund (Pulamed)': {
            image: 'images/logos/pulamed.png',
            bgColor: '#4CAF50',
            text: 'PM',
            name: 'PulaMed'
        },
        'Botswana Public Officers Medical Aid Scheme (BPOMAS)': {
            image: 'images/logos/bpomas.png',
            bgColor: '#2196F3',
            text: 'BP',
            name: 'BPOMAS'
        },
        'Botsogo Health Plan': {
            image: 'images/logos/botsogo.png',
            bgColor: '#FF9800',
            text: 'BH',
            name: 'Botsogo'
        },
        'Liberty Life Botswana (Pty) Limited': {
            image: 'images/logos/liberty.png',
            bgColor: '#9C27B0',
            text: 'LL',
            name: 'Liberty'
        },
        'Metropolitan Life Botswana': {
            image: 'images/logos/metropolitan.png',
            bgColor: '#F44336',
            text: 'ML',
            name: 'Metro'
        }
    };
    
    for (const [key, value] of Object.entries(logos)) {
        if (companyName.includes(key.split(' ')[0])) {
            return value;
        }
    }
    
    // Ultimate fallback
    return {
        image: null,
        bgColor: '#6c757d',
        text: companyName.substring(0, 2).toUpperCase(),
        name: companyName.split(' ')[0]
    };
}

// Override your getProductImage function to use Airtable data
function getProductImage(productName, companyName) {
    // First, check if we have Airtable data
    if (window.allProducts) {
        const product = window.allProducts.find(p => 
            p.name === productName && p.company.name === companyName
        );
        
        if (product && product.product_image && 
            (product.product_image.startsWith('http://') || 
             product.product_image.startsWith('https://'))) {
            return product.product_image;
        }
    }
    
    // Fallback to original image mapping
    const imageMap = {
        'Executive': 'images/products/pulamed/executive.jpg',
        'Deluxe': 'images/products/pulamed/deluxe.jpg',
        'Galaxy': 'images/products/pulamed/galaxy.jpg',
        'Flexi': 'images/products/pulamed/flexi.jpg',
        'Standard Benefit Option': 'images/products/bpomas/standard.jpg',
        'High Benefit Option': 'images/products/bpomas/high.jpg',
        'Premium Benefit Option': 'images/products/bpomas/premium.jpg',
        'Diamond': 'images/products/botsogo/diamond.jpg',
        'Platinum': 'images/products/botsogo/platinum.jpg',
        'Ruby': 'images/products/botsogo/ruby.jpg',
        'Bronze': 'images/products/botsogo/bronze.jpg',
        'Mothusi Life Cover - Lifeline': 'images/products/metropolitan/lifeline.jpg',
        'Mothusi Life Cover - Term Shield': 'images/products/metropolitan/termshield.jpg',
        'Mothusi Life Cover - Home Secure': 'images/products/metropolitan/homesecure.jpg',
        'Boago Funeral Plan': 'images/products/liberty/boago.jpg',
        'Hospital Cash Back Benefit': 'images/products/liberty/hospitalcash.jpg'
    };
    
    for (const [key, value] of Object.entries(imageMap)) {
        if (productName.includes(key)) {
            return value;
        }
    }
    
    // Company-based fallback
    if (companyName.includes('Pula') || companyName.includes('Pulamed')) {
        return 'images/products/pulamed/executive.jpg';
    } else if (companyName.includes('BPOMAS')) {
        return 'images/products/bpomas/standard.jpg';
    } else if (companyName.includes('Botsogo')) {
        return 'images/products/botsogo/diamond.jpg';
    } else if (companyName.includes('Metropolitan')) {
        return 'images/products/metropolitan/lifeline.jpg';
    } else if (companyName.includes('Liberty')) {
        return 'images/products/liberty/boago.jpg';
    }
    
    return 'images/products/default.jpg';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 BotsuInsure starting with Airtable...');
    
    // Load data from Airtable
    const products = await loadFromAirtable();
    window.allProducts = products;
    
    // Override your functions with our Airtable-aware versions
    window.getCompanyLogo = getCompanyLogo;
    window.getProductImage = getProductImage;
    
    // Call your original loadAllProducts
    if (typeof loadAllProducts === 'function') {
        console.log('📞 Calling your original loadAllProducts...');
        loadAllProducts();
    } else {
        console.error('❌ loadAllProducts function not found!');
    }
    
    // Add refresh button
    addRefreshButton();
    
    // Auto-refresh every 10 minutes
    setInterval(async () => {
        console.log('🔄 Auto-refreshing from Airtable...');
        const newProducts = await loadFromAirtable();
        if (newProducts.length > 0) {
            window.allProducts = newProducts;
            if (typeof loadAllProducts === 'function') {
                loadAllProducts();
            }
        }
    }, 10 * 60 * 1000);
});

// Add refresh button to navbar
function addRefreshButton() {
    setTimeout(() => {
        const navbar = document.querySelector('.navbar .container');
        if (!navbar || document.getElementById('refresh-airtable-btn')) return;
        
        const button = document.createElement('button');
        button.id = 'refresh-airtable-btn';
        button.className = 'btn btn-sm btn-outline-light ms-3';
        button.innerHTML = '<i class="fas fa-sync-alt me-1"></i> Refresh';
        button.title = 'Refresh data from Airtable';
        
        button.onclick = async function() {
            button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>';
            button.disabled = true;
            
            try {
                const newProducts = await loadFromAirtable();
                if (newProducts.length > 0) {
                    window.allProducts = newProducts;
                    
                    if (typeof loadAllProducts === 'function') {
                        loadAllProducts();
                    }
                    
                    showMessage('✅ Refreshed from Airtable!', 'success');
                }
            } catch (error) {
                showMessage('❌ Refresh failed', 'danger');
            } finally {
                button.innerHTML = '<i class="fas fa-sync-alt me-1"></i> Refresh';
                button.disabled = false;
            }
        };
        
        navbar.appendChild(button);
    }, 1000);
}

// Show temporary message
function showMessage(text, type = 'info') {
    const oldMsg = document.getElementById('airtable-message');
    if (oldMsg) oldMsg.remove();
    
    const msg = document.createElement('div');
    msg.id = 'airtable-message';
    msg.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    msg.style.zIndex = '9999';
    msg.innerHTML = `${text} <button class="btn-close" onclick="this.parentElement.remove()"></button>`;
    
    document.body.appendChild(msg);
    
    setTimeout(() => {
        if (msg.parentElement) msg.remove();
    }, 3000);
}

// Manual refresh function
window.refreshFromAirtable = async function() {
    const newProducts = await loadFromAirtable();
    if (newProducts.length > 0) {
        window.allProducts = newProducts;
        if (typeof loadAllProducts === 'function') {
            loadAllProducts();
            alert('✅ Refreshed from Airtable!');
        }
    }
};