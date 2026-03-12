/**
 * GrowWiser Pro - Final Clean Code
 * Developed for: Vishal (Apurv AI)
 * Fixed: Balance Logic, Portfolio Rendering, Real Mode Validation
 */

// ==========================================
// 1. GLOBAL STATE & CONFIGURATION
// ==========================================

const API_KEY = "AIzaSyC3zJA5rlahnOeh-BhG4Of4tJKD2Sf3UYw"; 

let appState = {
    virtualBalance: 1000000, // $10 Lakhs Virtual Money
    realBalance: 0,          // $0 Real Money (Initially)
    isRealMode: false,       // Default is Virtual
    holdings: [],            // List of active trades
    purchasedCourses: ['free'],
    currentTrade: {        
        symbol: "NSE:NIFTY",
        name: "NIFTY 50",
        price: 22150.00
    },
    activeTrade: null 
};

// ==========================================
// 2. INITIALIZATION
// ==========================================

// on line 523

// ==========================================
// 3. CORE FUNCTIONS (SAVE/LOAD)
// ==========================================

function saveUserData() {
    localStorage.setItem('gw_virtualBalance', appState.virtualBalance.toFixed(2));
    localStorage.setItem('gw_realBalance', appState.realBalance.toFixed(2));
    localStorage.setItem('gw_holdings', JSON.stringify(appState.holdings));
    localStorage.setItem('gw_courses', JSON.stringify(appState.purchasedCourses));
    refreshUI(); 
}

function loadUserData() {
    const vBal = localStorage.getItem('gw_virtualBalance');
    if (vBal) appState.virtualBalance = parseFloat(vBal);

    const rBal = localStorage.getItem('gw_realBalance');
    if (rBal) appState.realBalance = parseFloat(rBal);

    const savedHoldings = localStorage.getItem('gw_holdings');
    if (savedHoldings) {
        try { 
            appState.holdings = JSON.parse(savedHoldings); 
            
            // CRITICAL FIX: Restore active trade memory after page refresh
            if(appState.holdings.length > 0) {
                appState.activeTrade = appState.holdings[0];
                
                // Re-enable close button automatically
                const closeBtn = document.getElementById('close-btn');
                if(closeBtn) {
                    closeBtn.disabled = false;
                    closeBtn.style.opacity = '1';
                }
            }
        } catch (e) { appState.holdings = []; }
    }
}


// ==========================================
// 4. TRADING LOGIC (HEART OF THE APP)
// ==========================================

// १. नवीन changeAsset चा कोड 
// १. नवीन changeAsset चा कोड (अमेरिकन स्टॉक्स ट्रेडिंगव्ह्यूवर लोड करण्यासाठी)
function changeAsset(symbol, price, element) {
    appState.currentTrade.symbol = symbol;
    appState.currentTrade.name = symbol;
    appState.currentTrade.price = price;

    document.getElementById('active-symbol').innerHTML = `${symbol} <span class="live-tag">LIVE</span>`;
    document.getElementById('chart-price-main').innerText = `$${price.toFixed(2)}`;

    document.querySelectorAll('.asset-item').forEach(el => el.classList.remove('active'));
    if(element) element.classList.add('active');
    
    // TradingView साठी योग्य सिम्बॉल सेट करणे
    let tvSymbol = "BINANCE:XRPUSDT";
    if(symbol === "BTC/USD") tvSymbol = "BINANCE:BTCUSDT";
    if(symbol === "AAPL") tvSymbol = "NASDAQ:AAPL";
    if(symbol === "TSLA") tvSymbol = "NASDAQ:TSLA";
    if(symbol === "MSFT") tvSymbol = "NASDAQ:MSFT";

    initAdvancedChart(tvSymbol);
}


// २. TradingView चा 'Real' Chart लोड करणारे नवीन फंक्शन
function initAdvancedChart(tvSymbol) {
    if (document.getElementById('tradingview_advanced_chart')) {
        document.getElementById('tradingview_advanced_chart').innerHTML = ""; // जुना चार्ट पुसून नवीन टाकण्यासाठी
        new TradingView.widget({
            "autosize": true,
            "symbol": tvSymbol,
            "interval": "1", // 1 मिनिटाचा चार्ट
            "timezone": "Asia/Kolkata",
            "theme": "dark",
            "style": "1", // 1 म्हणजे Candlestick
            "locale": "in",
            "enable_publishing": false,
            "backgroundColor": "#131722",
            "gridColor": "rgba(255, 255, 255, 0.05)",
            "hide_top_toolbar": false, // हे false ठेवल्याने तुला सर्व टूल्स आणि इंडिकेटर्स दिसतील
            "hide_legend": false,
            "save_image": false,
            "container_id": "tradingview_advanced_chart",
            "allow_symbol_change": true, // युजर स्वतः चार्टवर सिम्बॉल बदलू शकतो
            "toolbar_bg": "#131722",
            "studies": [
                "Volume@tv-basicstudies" // चार्टवर व्हॉल्यूम पण दिसेल
            ]
        });
    }
}


function openPosition(type) {
    const currentAppMode = appState.isRealMode ? "REAL" : "VIRTUAL";
    
    // १. चेक करणे की 'याच कॉईनचा' ट्रेड 'याच मोडमध्ये' आधीच चालू आहे का?
    const existingTrade = appState.holdings.find(t => t.symbol === appState.currentTrade.symbol && t.mode === currentAppMode);
    
    if(existingTrade) {
        alert(`You already have an open trade for ${appState.currentTrade.symbol} in ${currentAppMode} mode. Please close it first.`);
        return;
    }

    let currentBalance = appState.isRealMode ? appState.realBalance : appState.virtualBalance;
    const qty = 10; 
    const tradeValue = appState.currentTrade.price * qty;

    if (currentBalance < tradeValue) {
        alert(`Insufficient Funds! \nRequired: $${tradeValue.toFixed(2)}\nAvailable: $${currentBalance.toFixed(2)}`);
        return;
    }

    // २. नवीन ट्रेड तयार करणे आणि सरळ Holdings मध्ये टाकणे (Multiple Trades साठी)
    const newTrade = {
        id: Date.now(),
        symbol: appState.currentTrade.symbol,
        name: appState.currentTrade.name,
        type: type,
        entryPrice: appState.currentTrade.price,
        qty: qty,
        mode: currentAppMode 
    };

    appState.holdings.push(newTrade);

    alert(`${type} Order Placed Successfully for ${appState.currentTrade.symbol} (${currentAppMode} Mode)!`);
    
    saveUserData();
    refreshUI();
}

function closePosition() {
    const currentAppMode = appState.isRealMode ? "REAL" : "VIRTUAL";
    
    // १. आपण ज्या चार्टवर आहोत, फक्त त्याचाच ट्रेड शोधणे
    const tradeIndex = appState.holdings.findIndex(t => t.symbol === appState.currentTrade.symbol && t.mode === currentAppMode);

    if (tradeIndex === -1) {
        return; // ट्रेड नसेल तर काहीच करू नका
    }

    const tradeToClose = appState.holdings[tradeIndex];
    const currentPrice = appState.currentTrade.price;
    const entry = tradeToClose.entryPrice;
    const qty = tradeToClose.qty;
    
    // २. प्रॉफिट/लॉस कॅल्क्युलेट करणे
    let pnl = (tradeToClose.type === 'BUY') ? (currentPrice - entry) * qty : (entry - currentPrice) * qty;

    // ३. बॅलन्स अपडेट करणे
    if (appState.isRealMode) {
        appState.realBalance += pnl;
    } else {
        appState.virtualBalance += pnl;
    }

    // ४. तोच विशिष्ट ट्रेड Holdings मधून काढून टाकणे
    appState.holdings.splice(tradeIndex, 1);

    alert(`${tradeToClose.symbol} Trade Closed! P&L: $${pnl.toFixed(2)}`);

    // ५. बटण रिसेट करणे
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
        closeBtn.disabled = true;
        closeBtn.style.opacity = '0.5';
        closeBtn.innerText = "Close Position";
        closeBtn.style.backgroundColor = "#ff5252"; 
        closeBtn.style.color = "white";
    }

    saveUserData();
    refreshUI();
}




// ==========================================
// 5. UI UPDATES & PORTFOLIO
// ==========================================

function refreshUI() {
    // 1. Select Balance based on Mode
    let currentBalance = appState.isRealMode ? appState.realBalance : appState.virtualBalance;
    
    // 2. Update Header
    const headerBal = document.getElementById('header-bal-val');
    if(headerBal) {
        // Convert to Lakhs logic
        let displayVal = (currentBalance / 100000).toFixed(2) + "L";
        if (currentBalance < 100000 && currentBalance > -100000) displayVal = currentBalance.toFixed(2); // Small amounts
        
        headerBal.innerText = "$" + displayVal;
        headerBal.style.color = appState.isRealMode ? "var(--jupiter-yellow)" : "var(--primary-neon)";
    }
    
    // 3. Update Hero Section
    const heroBal = document.getElementById('balance-display');
    if(heroBal) {
        heroBal.innerText = "$" + currentBalance.toLocaleString('en-IN', {minimumFractionDigits: 2});
        heroBal.style.color = appState.isRealMode ? "var(--jupiter-yellow)" : "var(--primary-neon)";
    }

    renderPortfolio(); 
}

function renderPortfolio() {
    const list = document.getElementById('portfolio-items-list');
    if (!list) return;

    // Filter: Show only REAL trades in Real Mode, VIRTUAL in Virtual Mode
    const currentMode = appState.isRealMode ? "REAL" : "VIRTUAL";
    const visibleHoldings = appState.holdings.filter(h => h.mode === currentMode);

    // Totals for Portfolio Header
    let totalInv = 0;
    let totalCur = 0;

    if (visibleHoldings.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding: 40px; color: #a0aec0;">
                <i class="fa-solid fa-box-open" style="font-size: 2rem; margin-bottom:10px;"></i>
                <p>No active positions in ${currentMode} Mode.</p>
            </div>`;
    } else {
        list.innerHTML = visibleHoldings.map(h => {
            // Calculate live P&L for display
            // Note: In a real app, you'd fetch live price for each symbol. 
            // Here we use currentTrade price if symbol matches, otherwise stored price.
            let livePrice = h.entryPrice; 
            if(h.symbol === appState.currentTrade.symbol) {
                livePrice = appState.currentTrade.price;
            }

            const invVal = h.qty * h.entryPrice;
            const curVal = h.qty * livePrice;
            
            // P&L Logic
            let pnl = 0;
            if(h.type === 'BUY') pnl = curVal - invVal;
            else pnl = invVal - curVal; // Short selling logic

            totalInv += invVal;
            totalCur += (h.type === 'BUY' ? curVal : (invVal + pnl));

            const color = pnl >= 0 ? "#00ffba" : "#ff4757";

            return `
                <div class="glass-card" style="margin-bottom: 10px; padding: 15px; border-left: 4px solid ${color};">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>${h.symbol} <span style="font-size:0.7rem; background:#333; padding:2px 5px; border-radius:4px;">${h.type}</span></strong>
                        <span style="color:${color}; font-weight:bold;">$${pnl.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-top: 5px; color: #ccc;">
                        <span>Qty: ${h.qty}</span>
                        <span>Entry: ${h.entryPrice.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update Portfolio Totals
    const totalInvEl = document.getElementById('total-invested');
    const totalCurEl = document.getElementById('total-current');
    if(totalInvEl) totalInvEl.innerText = "$" + totalInv.toFixed(2);
    if(totalCurEl) totalCurEl.innerText = "$" + totalCur.toFixed(2);
}

// ==========================================
// 6. MODE SWITCHING
// ==========================================

function handleModeSwitch() {
    const switchBtn = document.getElementById('realModeSwitch');
    const modeText = document.getElementById('mode-text');

    if (switchBtn.checked) {
        let pin = prompt("Security Check: Enter PIN for Real Trading:");
        if (pin === "1211") {
            appState.isRealMode = true;
            document.body.classList.add('real-mode-active');
            if(modeText) {
                modeText.innerText = "REAL TRADING ACTIVE";
                modeText.style.color = "#FFD700";
            }
            alert("Switched to Real Mode.\nBalance: $" + appState.realBalance);
        } else {
            alert("Incorrect PIN!");
            switchBtn.checked = false;
        }
    } else {
        appState.isRealMode = false;
        document.body.classList.remove('real-mode-active');
        if(modeText) {
            modeText.innerText = "Virtual Mode";
            modeText.style.color = "#00ffba";
        }
        alert("Switched back to Virtual Mode.");
    }
    refreshUI(); // Important to update balance display immediately
}

// ==========================================
// 7. SIMULATION LOOP (PRICE MOVEMENT)
// ==========================================

function startMarketSimulation() {
    setInterval(() => {
        // Price Movement
        let volatility = appState.currentTrade.price * 0.001;
        appState.currentTrade.price += (Math.random() - 0.5) * volatility;
        const curPrice = appState.currentTrade.price;

        // UI Update
        const priceEl = document.getElementById('chart-price-main');
        if(priceEl) {
             priceEl.innerText = `$${curPrice.toFixed(2)}`;
             // Randomly change color for effect
             priceEl.style.color = Math.random() > 0.5 ? "var(--primary-neon)" : "white";
        }

        // Active Trade P&L Updates (The Floating Badge)
        if (appState.activeTrade) {
            const entry = appState.activeTrade.entryPrice;
            const type = appState.activeTrade.type;
            const qty = appState.activeTrade.qty;
            
            let pnl = (type === 'BUY') ? (curPrice - entry) * qty : (entry - curPrice) * qty;
            let pnlPercent = (pnl / (entry * qty)) * 100;

            const pnlBadge = document.getElementById('pnl-float');
            if(pnlBadge) {
                pnlBadge.style.display = 'block';
                pnlBadge.innerText = `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`;
                pnlBadge.style.background = pnl >= 0 ? "var(--primary-neon)" : "var(--danger-neon)";
            }

            // Move the line
            const currentLine = document.getElementById('current-line');
            if(currentLine) {
                let move = 50 - (pnlPercent * 50); // Amplify movement
                currentLine.style.top = `${Math.max(5, Math.min(95, move))}%`;
            }
            
            // Also refresh portfolio to show live P&L there
            renderPortfolio();
        }

        // Add Candle Visuals
        addProCandle(curPrice);

    }, 1000);
}



// ==========================================
// 8. EXTRAS (AI & INPUTS)
// ==========================================

function setupInputs() {
    const input = document.getElementById('user-input');
    if(input) {
        input.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                askApurv();
            }
        });
    }
}

async function askApurv() {
    const inputField = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-history');
    const question = inputField.value.trim();

    if (!question) return;

    // १. युजरचा मेसेज स्क्रीनवर दाखवा
    chatBox.innerHTML += `<div class="user-msg glass-msg" style="text-align:right; margin-left:auto; border-color:#00ffba;">${question}</div>`;
    inputField.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    // २. 'विचार करत आहे...' असा मेसेज दाखवा
    const loadingId = "loading-" + Date.now();
    chatBox.innerHTML += `<div class="ai-msg glass-msg" id="${loadingId}"><i class="fa-solid fa-robot"></i> अपूर्वा विचार करत आहे...</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // ३. Gemini API ला रिक्वेस्ट पाठवा
        // टीप: सध्या Gemini 2.5 Flash हे सर्वात वेगात चालणारं मॉडेल आहे
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `तू एक शेअर मार्केट एक्सपर्ट 'Apurv AI' आहेस. युजरचे नाव विशाल आहे. त्याला या प्रश्नाचे थोडक्यात उत्तर दे: ${question}` }]
                }]
            })
        });

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        // ४. स्क्रीनवर आलेलं उत्तर दाखवा
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.innerHTML = `<i class="fa-solid fa-robot"></i> ${aiResponse}`;
        }

    } catch (error) {
        console.error("AI Error:", error);
        document.getElementById(loadingId).innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> माफ कर विशाल, काहीतरी तांत्रिक अडचण आली आहे.`;
    }
    
    chatBox.scrollTop = chatBox.scrollHeight;
}



// ==========================================
// NAVIGATION SYSTEM (FIX)
// ==========================================

function tabChange(tabId, btn) {
    // 1. सर्व सेक्शन्स लपवा
    const sections = ['home', 'trade', 'ai', 'courses', 'portfolio'];
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.style.display = 'none';
    });

    // 2. फक्त निवडलेला सेक्शन दाखवा
    const activeSection = document.getElementById(tabId);
    if (activeSection) {
        activeSection.style.display = 'block';
        // जर पोर्टफोलिओ उघडला तर तो रिफ्रेश करा
        if(tabId === 'portfolio') renderPortfolio();
    }

    // 3. नेव्हिगेशन बटन्सची स्टाईल बदला
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    if (btn) btn.classList.add('active');

    console.log("Tab Changed to: " + tabId);
}



// होम पेजवर लाईव्ह प्राईस अपडेट करण्यासाठी
function updateHomeChart() {
    const homePrice = document.getElementById('balance-display'); // किंवा तुमचा चार्ट व्हॅल्यू आयडी
    if(homePrice) {
        // हा भाग आपोआप refreshUI मधून अपडेट होईल
    }
}

// ==========================================
// 9. TRADINGVIEW WIDGET (HOME PAGE GOLD CHART)
// ==========================================
function initGoldChart() {
    if(document.getElementById('tradingview_gold')) {
        new TradingView.widget({
            "autosize": true,
            "symbol": "OANDA:XAUUSD",
            "interval": "15",
            "timezone": "Asia/Kolkata",
            "theme": "dark",
            "style": "1",
            "locale": "in",
            "backgroundColor": "rgba(0, 0, 0, 0.2)",
            "gridColor": "rgba(255, 255, 255, 0.05)",
            "hide_top_toolbar": true,
            "hide_legend": true,
            "save_image": false,
            "container_id": "tradingview_gold"
        });
    }
}




// ==========================================
// LIVE MARKET PRICE FETCHER (BINANCE API + ADVANCED US STOCKS SIMULATION)
// ==========================================
function startLivePriceUpdates() {
    setInterval(async () => {
        let symbol = appState.currentTrade.symbol;
        let currentPrice = appState.currentTrade.price;

        try {
            if (symbol === "XRP/USD") {
                let res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=XRPUSDT");
                let data = await res.json();
                currentPrice = parseFloat(data.price);
            } else if (symbol === "BTC/USD") {
                let res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
                let data = await res.json();
                currentPrice = parseFloat(data.price);
            } else {
                let volatility = currentPrice * 0.00015;
                let randomTick = (Math.random() - 0.48) * volatility; 
                currentPrice += randomTick;
            }

            appState.currentTrade.price = currentPrice;
            
            const priceEl = document.getElementById('chart-price-main');
            if(priceEl) {
                if (symbol === "XRP/USD") {
                    priceEl.innerText = `$${currentPrice.toFixed(4)}`; 
                } else {
                    priceEl.innerText = `$${currentPrice.toFixed(2)}`;
                }
                priceEl.style.color = Math.random() > 0.5 ? "var(--primary-neon)" : "white";
            }

            // --- CRITICAL FIX: Update PnL specifically for current coin and current mode ---
            const currentAppMode = appState.isRealMode ? "REAL" : "VIRTUAL";
            const activeTradeForCurrentChart = appState.holdings.find(t => t.symbol === symbol && t.mode === currentAppMode);
            
            const closeBtn = document.getElementById('close-btn');
            
            if (activeTradeForCurrentChart) {
                const entry = activeTradeForCurrentChart.entryPrice;
                const type = activeTradeForCurrentChart.type;
                const qty = activeTradeForCurrentChart.qty;
                
                let pnl = (type === 'BUY') ? (currentPrice - entry) * qty : (entry - currentPrice) * qty;
                
                if (closeBtn) {
                    closeBtn.disabled = false;
                    closeBtn.style.opacity = '1';
                    let sign = pnl >= 0 ? "+" : "";
                    closeBtn.innerText = `Close Position (${sign}$${pnl.toFixed(2)})`;
                    closeBtn.style.backgroundColor = pnl >= 0 ? "#00ffba" : "#ff4757";
                    closeBtn.style.color = pnl >= 0 ? "black" : "white";
                }
            } else {
                if (closeBtn) {
                    closeBtn.disabled = true;
                    closeBtn.style.opacity = '0.5';
                    closeBtn.innerText = "Close Position";
                    closeBtn.style.backgroundColor = "#ff5252";
                    closeBtn.style.color = "white";
                }
            }
            
            renderPortfolio();

        } catch(e) {
            console.error("GrowWiser API Error:", e);
        }
    }, 1500); 
}

                





window.onload = function() {
    console.log("GrowWiser Pro: System Started");
    loadUserData();
    refreshUI();
    setupInputs();
    initGoldChart(); 
    initAdvancedChart("BINANCE:XRPUSDT"); 
    startLivePriceUpdates(); // <-- हा नवीन लाईव्ह प्राईसचा कोड सुरू करण्यासाठी
};

