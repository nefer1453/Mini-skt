document.addEventListener('DOMContentLoaded', () => {
    // Arayüz Elementleri
    const mainScreen = document.getElementById('mainScreen');
    const wizardScreen = document.getElementById('wizardScreen');
    const startWizardBtn = document.getElementById('startWizardBtn');
    const cancelWizard = document.getElementById('cancelWizard');
    const productList = document.getElementById('productList');
    
    // Sihirbaz Adımları ve Başlıkları
    const steps = ['step-0', 'step-1', 'step-2', 'step-3', 'step-4', 'step-5'];
    const titles = ['Ürün Adı', 'Gün (1-31)', 'Ay (1-12)', 'Yıl', 'Adet Miktarı', 'Uyarı Kategorisi'];
    let currentStep = 0;

    // Veritabanı (LocalStorage)
    let products = JSON.parse(localStorage.getItem('sktProducts')) || [];

    // --- PWA Service Worker ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .catch(err => console.log('SW Hatası:', err));
    }

    // --- LİSTELEME VE UYARI MOTORU ---
    function renderProducts() {
        productList.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Tarihe göre sırala (En yakın tarih en üstte)
        products.sort((a, b) => new Date(a.date) - new Date(b.date));

        products.forEach((product, index) => {
            const expDate = new Date(product.date);
            const diffTime = expDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const li = document.createElement('li');
            li.className = 'product-item';

            // Seçilen uyarı gününe göre kırmızı flaşör uyarısı!
            if (diffDays <= product.warningCategory) {
                li.classList.add('danger-flash');
            }

            // SADECE ÜRÜN İSMİ VE SİL BUTONU
            li.innerHTML = `
                <div style="font-size:1.5rem; font-weight:bold; color:#2c3e50;">
                    ${product.name}
                </div>
                <button class="delete-btn" onclick="deleteProduct(${index})">SİL</button>
            `;
            productList.appendChild(li);
        });
    }

    window.deleteProduct = (index) => {
        products.splice(index, 1);
        localStorage.setItem('sktProducts', JSON.stringify(products));
        renderProducts();
    };

    // --- SİHİRBAZ (TIKLA-GEÇ) MOTORU ---
    startWizardBtn.addEventListener('click', () => {
        mainScreen.classList.add('hidden');
        wizardScreen.classList.remove('hidden');
        
        // Formu temizle ve bugünün tarihiyle hızlandır
        document.getElementById('wName').value = '';
        document.getElementById('wDay').value = '';
        document.getElementById('wMonth').value = new Date().getMonth() + 1; // Hız için bulunduğun ayı atar
        document.getElementById('wYear').value = new Date().getFullYear(); // Hız için bulunduğun yılı atar
        document.getElementById('wQty').value = '1';

        goToStep(0);
    });

    cancelWizard.addEventListener('click', () => {
        wizardScreen.classList.add('hidden');
        mainScreen.classList.remove('hidden');
    });

    function goToStep(stepIndex) {
        // Eski adımı gizle
        document.getElementById(steps[currentStep]).classList.add('hidden');
        
        // Yeni adımı göster
        currentStep = stepIndex;
        document.getElementById(steps[currentStep]).classList.remove('hidden');
        document.getElementById('wizardTitle').innerText = titles[currentStep];

        // Focus ol ve İçeriği seç (direkt yazmaya başlansın diye)
        const input = document.getElementById(steps[currentStep]).querySelector('input');
        if (input) {
            input.focus();
            input.select();
            document.getElementById('helpText').classList.remove('hidden');
        } else {
            // Son adımdaysa (Kategori butonları) Enter metnini gizle
            document.getElementById('helpText').classList.add('hidden');
        }
    }

    // Inputlarda Enter tuşu yakalama
    document.querySelectorAll('.wizard-input').forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Form gönderimini engelle
                if (this.value.trim() !== '') {
                    goToStep(currentStep + 1);
                }
            }
        });
    });

    // --- SON ADIM: Kategori Seçimi ve Kaydetme ---
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const warningDays = parseInt(this.getAttribute('data-days'));
            saveProduct(warningDays);
        });
    });

    function saveProduct(warningDays) {
        const name = document.getElementById('wName').value;
        const day = document.getElementById('wDay').value.padStart(2, '0');
        const month = document.getElementById('wMonth').value.padStart(2, '0');
        const year = document.getElementById('wYear').value;
        const qty = document.getElementById('wQty').value;

        const dateStr = `${year}-${month}-${day}`;

        products.push({ 
            name: name, 
            date: dateStr, 
            qty: qty, 
            warningCategory: warningDays 
        });

        localStorage.setItem('sktProducts', JSON.stringify(products));
        
        // Ana ekrana dön ve listeyi yenile
        wizardScreen.classList.add('hidden');
        mainScreen.classList.remove('hidden');
        renderProducts();
    }

    // İlk Yükleme
    renderProducts();
});
                          
