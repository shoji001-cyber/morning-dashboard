document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 設定: APIキー管理 (LocalStorage)
    // ==========================================

    // API Key Helper
    function getApiKey(serviceName) {
        return localStorage.getItem(`api_key_${serviceName}`) || '';
    }

    function saveApiKey(serviceName, value) {
        localStorage.setItem(`api_key_${serviceName}`, value.trim());
    }

    // Modal Logic
    const settingsModal = document.getElementById('settingsModal');
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    // Inputs
    const finnhubInput = document.getElementById('finnhubKey');
    const geminiInput = document.getElementById('geminiKey');
    const newsInput = document.getElementById('newsApiKey');

    function openSettings() {
        // Load current values
        finnhubInput.value = getApiKey('finnhub');
        geminiInput.value = getApiKey('gemini');
        newsInput.value = getApiKey('news');
        settingsModal.style.display = 'flex';
    }

    function closeSettings() {
        settingsModal.style.display = 'none';
    }

    function saveSettings() {
        saveApiKey('finnhub', finnhubInput.value);
        saveApiKey('gemini', geminiInput.value);
        saveApiKey('news', newsInput.value);

        alert('設定を保存しました。データを更新します。');
        closeSettings();
        updateAllData(); // Refresh app with new keys
    }

    if (openSettingsBtn) openSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSettings();
    });
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettings);
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettings();
    });

    // ==========================================

    // --- 天気予報の実装 (Open-Meteo) ---
    async function fetchWeather() {
        try {
            // 鹿児島県大崎町の座標 (latitude=31.42, longitude=131.05)
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=31.42&longitude=131.05&current_weather=true');
            const data = await res.json();
            const weather = data.current_weather;

            const widget = document.getElementById('weatherWidget');
            widget.innerHTML = `
                <span class="weather-icon">${getWeatherIcon(weather.weathercode)}</span>
                <span class="weather-temp">${weather.temperature}°C</span>
                <span class="weather-loc">Osaki, Kagoshima</span>
            `;
        } catch (e) {
            console.error("Weather fetch error", e);
        }
    }

    function getWeatherIcon(code) {
        // WMO Weather interpretation codes
        if (code === 0) return '☀️';
        if (code < 3) return '🌤️';
        if (code < 50) return '☁️';
        if (code < 80) return '☂️';
        return '⛈️';
    }

    // グローバル変数: 取得したニュースデータを保持
    let currentNewsData = [];

    // --- ニュースとAI要約の実装 ---
    const mockNews = [
        {
            topic: '生成AI',
            tagClass: 'tag-ai',
            title: 'スタートアップがコード生成に特化した新しい生成AIモデルを開発',
            description: 'あるスタートアップ企業が、プログラミングコードの生成に特化した新しいAIモデルを発表しました。従来のモデルよりも精度が高く、開発者の生産性を大幅に向上させることが期待されています。',
            content: 'シリコンバレーのベンチャー企業「CodeNext」は15日、エンジニア向けに最適化された新しいLLM「DevGenius 1.0」を発表しました。このモデルは数億行の高品質なコードリポジトリでトレーニングされており、Python、JavaScript、Rustなどの言語で人間レベルのコードレビューと生成が可能です。CTOのジョン・ドウ氏は「開発時間を50%削減できる」と自信を見せています。'
        },
        {
            topic: '生成AI',
            tagClass: 'tag-ai',
            title: 'LLM性能比較：Gemini vs GPT-4 最新ベンチマーク公開',
            description: 'GoogleのGeminiとOpenAIのGPT-4の最新の性能比較ベンチマークが公開されました。数学的推論やコード生成など、複数の分野で互角以上の戦いを見せています。',
            content: '第三者評価機関であるAI Metrics Labは、Gemini Ultra 1.5とGPT-4 Turboの比較レポートを公開しました。推論能力テスト（MMLU）ではGeminiがわずかにリードし、コーディング課題（HumanEval）ではほぼ同等のスコアを記録しました。また、マルチモーダル処理においてはGeminiが動画理解で優位性を示しています。'
        },
        {
            topic: '白物家電',
            tagClass: 'tag-kaden',
            title: '大手メーカー各社、冷蔵庫の新省エネ基準への対応を発表',
            description: '主要な家電メーカー各社が、来年度から適用される新しい冷蔵庫の省エネ基準への対応策を発表しました。断熱材の改良やAIによる温度管理などが導入されます。',
            content: '環境省が定める新しい「トップランナー基準」に基づき、国内家電大手3社は次期モデルの仕様を刷新します。新型断熱パネルの採用により熱漏れを20%削減するほか、庫内の食材量をカメラで認識し、冷却パワーを自動調整するAI機能を標準搭載する方針です。これにより年間電気代が約3000円削減できる見込みです。'
        },
        {
            topic: '白物家電',
            tagClass: 'tag-kaden',
            title: 'IoT連携需要でスマート洗濯機の売上が30%急増',
            description: 'スマートフォンと連携できるIoT機能付きのスマート洗濯機の売上が、前年比で30%急増しています。外出先からの操作や完了通知などの機能が支持されています。',
            content: '共働き世帯の増加に伴い、家事の効率化が求められています。最新のスマート洗濯機は、洗剤の自動投入機能に加え、帰宅時間に合わせて洗濯を完了させる予約機能が人気です。販売データによると、Wi-Fi接続機能を持つモデルの販売台数は前年同月比130%を記録しており、今後も市場拡大が予想されます。'
        },
        {
            topic: '国政',
            tagClass: 'tag-politics',
            title: '国会でAI規制と著作権法に関する新法案を審議',
            description: '本日、国会にてAIの利用規制と著作権法改正に関する新しい法案の審議が開始されました。クリエイターの権利保護と技術革新のバランスが主な争点となっています。',
            content: '「AI社会推進法案（仮）」の審議が衆議院で始まりました。焦点となっているのは、生成AIの学習データとして著作物を利用する場合の許諾ルールの明確化です。野党からは「クリエイターへの対価還元が不十分」との指摘が出る一方、産業界からは「過度な規制は日本のAI開発力を削ぐ」との懸念も示されており、議論は平行線をたどっています。'
        },
        {
            topic: '国政',
            tagClass: 'tag-politics',
            title: '首相、半導体産業の成長に向けた新たな予算配分を発表',
            description: '首相は記者会見で、国内の半導体産業を支援するために数兆円規模の新たな予算を配分すると発表しました。工場の誘致や人材育成に充てられる予定です。',
            content: '首相官邸での会見において、政府は「半導体立国復活プラン」を発表しました。熊本や北海道への工場誘致助成金として2兆円、大学での半導体人材育成プログラムに5000億円を投じる計画です。首相は「半導体は産業のコメであり、経済安全保障の要だ」と述べ、官民一体となってサプライチェーンの強靭化を進める姿勢を強調しました。'
        }
    ];

    async function fetchNewsFromAPI() {
        const apiKey = getApiKey('news');
        if (!apiKey) {
            console.log('NewsAPI key not set, utilizing mock data.');
            currentNewsData = mockNews;
            return mockNews;
        }

        try {
            // "生成AI", "家電", "日本政治" などのキーワードで検索
            const query = encodeURIComponent('生成AI OR 家電 OR 政治');
            const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=6&language=jp&apiKey=${apiKey}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error(`NewsAPI Error: ${res.status}`);
            const data = await res.json();

            if (!data.articles || data.articles.length === 0) {
                currentNewsData = mockNews;
                return mockNews;
            }

            currentNewsData = data.articles.map(article => {
                // タイトルからカテゴリを簡易判定
                let topic = 'ニュース';
                let tagClass = 'tag-politics'; // default
                const title = article.title || '';
                const desc = article.description || '';
                const content = article.content || '';

                if (title.includes('AI') || title.includes('GPT') || title.includes('Gemini')) {
                    topic = '生成AI';
                    tagClass = 'tag-ai';
                } else if (title.includes('家電') || title.includes('冷蔵庫') || title.includes('洗濯機')) {
                    topic = '白物家電';
                    tagClass = 'tag-kaden';
                } else if (title.includes('政治') || title.includes('首相') || title.includes('国会')) {
                    topic = '国政';
                    tagClass = 'tag-politics';
                }

                return {
                    topic: topic,
                    tagClass: tagClass,
                    title: title,
                    description: desc,
                    content: content
                };
            });

            return currentNewsData;

        } catch (e) {
            console.error('NewsAPI Fetch Error:', e);
            // CORSエラーなどの場合はモックにフォールバック
            currentNewsData = mockNews;
            return mockNews;
        }
    }

    async function renderNews() {
        const container = document.getElementById('newsList');
        container.innerHTML = '<div style="padding:1rem; text-align:center;">Loading News...</div>';

        // APIがあればAPIから、なければモックから取得 (currentNewsDataも更新される)
        await fetchNewsFromAPI();

        // Use global variable instead of return value for consistency logic if needed, 
        // but fetchNewsFromAPI returns the list too.
        const newsList = currentNewsData;

        container.innerHTML = '';
        newsList.forEach((news, index) => {
            const card = document.createElement('div');
            card.className = 'news-card';
            card.id = `news-${index}`;
            card.innerHTML = `
                <span class="news-tag ${news.tagClass}">${news.topic}</span>
                <div class="news-title">${news.title}</div>
                <div class="news-summary" id="summary-${index}">AI Summary: Ready to generate...</div>
            `;
            container.appendChild(card);
        });
    }

    /* --- Performance Update: Cached Model & Batched AI Summary --- */
    let currentModelName = null;

    async function generateAISummary() {
        const btn = document.getElementById('aiSummaryBtn');
        const apiKey = getApiKey('gemini');
        const cleanKey = apiKey ? apiKey.trim() : '';

        if (!cleanKey) {
            const confirmSet = confirm('Gemini APIキーが設定されていません。設定画面を開きますか？');
            if (confirmSet) openSettings();
            return;
        }

        try {
            // Cache model check to save API calls
            if (!currentModelName) {
                btn.innerText = '✨ 接続＆モデル確認中...';
                btn.disabled = true;
                const validModel = await checkConnection(cleanKey);
                if (!validModel) {
                    btn.innerText = '❌ 接続失敗';
                    return; // finally will handle disabled state if needed, but here we want it enabled? No, keep it disabled or reset text.
                    // Actually, if connection fails, we should reset.
                    // Let's rely on finally for re-enabling, but we need to set text appropriately.
                    // But wait, if I return here, finally runs.
                    throw new Error('Connection failed');
                }
                currentModelName = validModel;
                console.log('Model Cached:', currentModelName);
            }

            btn.innerText = '✨ 全ニュースを一括要約中...';
            btn.disabled = true;

            if (currentNewsData.length === 0) {
                alert('ニュースデータがありません。');
                return;
            }

            const summaryElements = [];

            // Setup Loading UI
            currentNewsData.forEach((_, index) => {
                const summaryEl = document.getElementById(`summary-${index}`);
                if (summaryEl) {
                    summaryElements.push(summaryEl);
                    summaryEl.innerHTML = '<span class="loading-summary">AI is thinking (Full Analysis)...</span>';
                }
            });

            // Enhanced Batch Prompt
            const prompt = `
            You are an expert news analyst.
            For each of the following ${currentNewsData.length} news items, utilize the Title, Description, and Content to generate a factual, specific 3-line summary in Japanese.
            
            Input Data:
            ${currentNewsData.map((n, i) => `
            [Item ${i + 1}]
            Title: ${n.title}
            Description: ${n.description}
            Content: ${n.content}
            `).join('\n')}
    
            Strictly follow this output format:
            [Summary 1 Line 1]<br>[Summary 1 Line 2]<br>[Summary 1 Line 3] ||| [Summary 2 Line 1]<br>...
            
            Rules:
            1. Use " ||| " as the separator between news items.
            2. Use "<br>" for newlines within a summary.
            3. Do not include "[Item X]" labels in the output.
            4. Focus on facts.
            `;

            console.log('Sending Prompt to Gemini...');
            const batchResult = await callGeminiAPI(prompt, cleanKey, currentModelName);
            console.log('Gemini Response received.');

            // Error Handling
            if (batchResult.startsWith('Error') || batchResult.startsWith('⚠️') || batchResult === 'Processing Error') {
                summaryElements.forEach(el => {
                    el.innerHTML = `<span style="color:red;">${batchResult}</span>`;
                });
                btn.innerText = '⚠️ エラー (再試行)';
                return;
            }

            // Split Results
            let summaries = batchResult.split('|||').map(s => s.trim());

            // Fallback split logic
            if (summaries.length < currentNewsData.length && batchResult.includes('\n')) {
                const lineSplit = batchResult.split('\n').filter(s => s.trim().length > 0);
                if (lineSplit.length === currentNewsData.length) summaries = lineSplit;
            }

            summaryElements.forEach((el, index) => {
                if (summaries[index]) {
                    el.innerHTML = summaries[index].replace(/\n/g, '<br>');
                } else {
                    el.innerHTML = 'Summary skipped.';
                }
            });

            btn.innerText = '✨ AI要約を実行';

        } catch (e) {
            console.error('Summary Error:', e);
            btn.innerText = '⚠️ 処理中にエラー発生';
            alert('処理中にエラーが発生しました: ' + e.message);
        } finally {
            btn.disabled = false;
        }
    }

    // Timeout Wrapper for Fetch
    async function fetchWithTimeout(resource, options = {}) {
        const { timeout = 30000 } = options;

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    }

    /* Update checkConnection and callGeminiAPI to use timeout not implemented here but callGeminiAPI needs update */


    // 接続診断 & モデル選定
    async function checkConnection(apiKey) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const res = await fetch(url);
            if (!res.ok) {
                const errData = await res.json();
                console.error('Connection Check Failed:', errData);
                alert(`API接続エラー:\n${errData.error?.message || res.statusText}\nGoogle Cloud ConsoleでAPI有効化を確認してください。`);
                return null;
            }

            const data = await res.json();
            const models = data.models || [];
            console.log('Available Models:', models);

            // 優先順位: 1.5-flash -> flash系 -> pro系 -> その他Gemini
            // モデル名には "models/" プレフィックスが付いている場合があるため、それを使って検索
            let targetModel = models.find(m => m.name.includes('gemini-1.5-flash'))?.name ||
                models.find(m => m.name.includes('flash'))?.name ||
                models.find(m => m.name.includes('gemini-pro'))?.name ||
                models.find(m => m.name.includes('gemini'))?.name;

            // "models/" プレフィックスが付いている場合は除去する (API呼び出し時にプレフィックス無しを期待する場合と有りの場合があるが、v1betaのgenerateContentは models/modelName 形式が安全)
            // ただしURL構築時に `models/${model}` としているため、ここでは "models/" を除去して純粋な名前だけを返す方が安全、
            // あるいはURL構築側を修正する。ここはそのままで、URL構築側を合わせるのが良い。
            // APIの `name` フィールドは通常 `models/gemini-pro` のように返ってくる。

            if (targetModel) {
                // "models/" が付いていたら外す (URL構築側で `models/${model}` としているため)
                return targetModel.replace('models/', '');
            } else {
                alert('利用可能なGeminiモデルが見つかりませんでした。');
                return null;
            }

        } catch (e) {
            console.error('Network Error:', e);
            alert('ネットワークエラーが発生しました。');
            return null;
        }
    }

    async function callGeminiAPI(text, apiKey, modelName) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{
                    parts: [{ text: text }]
                }]
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const status = response.status;
                if (status === 429) {
                    return '⚠️ Error 429: Rate Limit Exceeded. Please wait a moment.';
                }
                const errData = await response.json();
                return `⚠️ Error ${status}: ${errData.error?.message || 'API Error'}`;
            }

            const data = await response.json();
            if (data.candidates && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                return 'Summary failed.';
            }
        } catch (e) {
            return 'Processing Error';
        }
    }

    // Event Listeners
    document.getElementById('aiSummaryBtn').addEventListener('click', generateAISummary);

    // ==========================================

    // 初期の表示用銘柄リスト
    const symbols = [
        { ticker: 'AAPL', name: 'Apple Inc.' },
        { ticker: 'GOOGL', name: 'Alphabet Inc.' },
        { ticker: 'MSFT', name: 'Microsoft Corp.' },
        { ticker: 'NVDA', name: 'NVIDIA Corp.' },
        { ticker: 'TSLA', name: 'Tesla Inc.' },
        { ticker: 'AMZN', name: 'Amazon.com' }
    ];

    const listContainer = document.getElementById('stockList');

    // ユーティリティ: APIキーが設定されているか確認
    function isApiKeyConfigured() {
        return !!getApiKey('finnhub');
    }

    // ユーティリティ: 株価取得 (Finnhub Quote API)
    async function fetchStockPrice(symbol) {
        if (!isApiKeyConfigured()) {
            // APIキー未設定時のモックデータ
            return {
                c: (Math.random() * 1000).toFixed(2), // current price
                dp: (Math.random() * 4 - 2).toFixed(2) // percent change
            };
        }

        try {
            const apiKey = getApiKey('finnhub');
            const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
            if (!response.ok) throw new Error('API Error');
            return await response.json();
        } catch (error) {
            console.warn(`Error fetching data for ${symbol} (using mock):`, error);
            // Fallback to mock data on error
            return {
                c: (100 + Math.random() * 200).toFixed(2),
                dp: (Math.random() * 4 - 2).toFixed(2)
            };
        }
    }

    // 株価リストの描画
    async function renderStockList() {
        listContainer.innerHTML = '';

        if (!isApiKeyConfigured()) {
            const warning = document.createElement('div');
            warning.style.padding = '1rem';
            warning.style.color = '#ffcc00';
            warning.style.fontSize = '0.9rem';
            warning.innerHTML = '⚠️ API Key Mock Mode';
            listContainer.appendChild(warning);
        }

        // Parallel Fetching with Promise.all
        const fetchPromises = symbols.map(async (stock) => {
            const data = await fetchStockPrice(stock.ticker);
            return { stock, data };
        });

        const results = await Promise.all(fetchPromises);

        results.forEach(({ stock, data }) => {
            if (data) {
                const price = parseFloat(data.c).toFixed(2);
                const change = parseFloat(data.dp).toFixed(2);
                const isUp = change >= 0;

                const item = document.createElement('div');
                item.className = 'stock-item';
                const changeClass = isUp ? 'text-green' : 'text-red';
                const changeSign = isUp ? '+' : '';

                item.innerHTML = `
                    <div class="stock-info">
                        <span class="stock-name">${stock.ticker}</span>
                        <span class="stock-ticker">${stock.name}</span>
                    </div>
                    <div class="stock-price-info">
                        <span class="stock-price">$${price}</span>
                        <span class="stock-change ${changeClass}">${changeSign}${change}%</span>
                    </div>
                `;
                listContainer.appendChild(item);
            }
        });
    }

    // --- Manual Refresh Feature ---
    async function updateAllData() {
        const btn = document.getElementById('refreshBtn');
        if (!btn) return;

        btn.disabled = true;
        const originalText = btn.innerText;
        btn.innerText = '🔄 Updating...';

        try {
            // Run all fetch functions in parallel
            await Promise.all([
                fetchWeather(),
                renderStockList(),
                renderNews()
            ]);

            // Update Timestamp
            const now = new Date();
            const timeString = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            btn.innerHTML = `🔄 Last Update: ${timeString}`;

        } catch (error) {
            console.error('Update failed:', error);
            btn.innerText = '⚠️ Update Failed';
        } finally {
            btn.disabled = false;
        }
    }

    // Event Listener for Refresh
    document.getElementById('refreshBtn').addEventListener('click', updateAllData);

    // Initial Calls for New Features (Execute via updateAllData to set initial timestamp)
    updateAllData();
});
