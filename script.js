// Ждём, пока Telegram SDK будет готов
Telegram.WebApp.ready();                            // :contentReference[oaicite:3]{index=3}

// Получаем профиль пользователя
const user = Telegram.WebApp.initDataUnsafe.user;   // :contentReference[oaicite:4]{index=4}

// Находим элементы по id
const avatarEl  = document.getElementById('avatarImg');    // :contentReference[oaicite:5]{index=5}
const nameEl    = document.getElementById('userName');
const eye       = document.getElementById('toggleEye');
const balanceEl = document.getElementById('balanceValue');

// Заполняем данные пользователя
if (user.photo_url) {
  avatarEl.src = user.photo_url;
} else {
  avatarEl.src = 'assets/default-avatar.png';
}
nameEl.textContent = user.username 
  ? '@' + user.username 
  : `${user.first_name || ''} ${user.last_name || ''}`.trim();

// Логика показа/скрытия баланса
let visible = true;
eye.addEventListener('click', () => {                   // :contentReference[oaicite:6]{index=6}
  visible = !visible;
  balanceEl.textContent = visible ? '0.0' : '•••';
});

// 1. Находим кнопку Scan по id
const scanBtn = document.getElementById('scanBtn');

// 2. Вешаем обработчик клика
scanBtn.addEventListener('click', () => {                       // :contentReference[oaicite:7]{index=7} :contentReference[oaicite:8]{index=8}
  // 3. Открываем нативный QR-сканер с подсказкой
  Telegram.WebApp.showScanQrPopup({                              // :contentReference[oaicite:9]{index=9} :contentReference[oaicite:10]{index=10}
    text: 'Сканируйте QR-код для оплаты'
  }).catch(err => console.error('Не удалось открыть сканер:', err));
});

// 4. Обработка успешного сканирования
Telegram.WebApp.onEvent('qrTextReceived', ({ data }) => {        // :contentReference[oaicite:11]{index=11}
  console.log('QR-код отсканирован, данные:', data);

  // Например, закрываем сканер и запускаем оплату
  Telegram.WebApp.closeScanQrPopup();                            // :contentReference[oaicite:12]{index=12}

  // TODO: здесь ваш код для обработки data (например, openInvoice)
});

// 5. (Опционально) Обработка отмены сканера
Telegram.WebApp.onEvent('scanQrPopupClosed', () => {             // :contentReference[oaicite:13]{index=13}
  console.log('Сканер был закрыт без сканирования');
});

// Навигация по пунктам нижнего меню
const navItems = document.querySelectorAll('.nav-item');      // 
const pages    = document.querySelectorAll('.page');          // 

navItems.forEach(item => {
  item.addEventListener('click', () => {                      // 
    const pageName = item.dataset.page;                      
    
    // 1. Снимаем active с меню
    navItems.forEach(i => i.classList.remove('active'));
    // 2. Делаем кликнутый пункт активным
    item.classList.add('active');

    // 3. Скрываем все страницы
    pages.forEach(p => p.classList.remove('active'));
    // 4. Показываем нужную
    const pageEl = document.getElementById(`page-${pageName}`);
    if (pageEl) pageEl.classList.add('active');
  });
});

// === Балансы пользователя (пример) ===
// Поставь тут реальное значение баланса в USDT (можно позже получать с бэкенда):
const balances = {
  usdt: 125.50,  // <-- твой "некоторый баланс" в USDT
  ton: 0
};

// === Элементы USDT на карточке ===
const usdtRateEl      = document.getElementById('usdtRate');
const usdtFiatValueEl = document.getElementById('usdtFiatValue');
const usdtBalanceEl   = document.getElementById('usdtBalance');

// Форматирование
const fmtRub = n => `${(n ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`;
const fmtNum = n => (n ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Курс USD/RUB по ЦБ (используем как USDT/RUB)
let usdRub = 0;

// Получение курса ЦБ РФ (daily_json.js)
async function fetchUsdRubFromCBR() {
  // ЦБ обновляет курсы 1 раз в день; cache: 'no-store' — чтобы не залипало в кэше WebView
  const resp = await fetch('https://www.cbr-xml-daily.ru/daily_json.js', { cache: 'no-store' });
  const data = await resp.json();
  // Берём официальный курс доллара (USDT ≈ USD)
  const v = data?.Valute?.USD?.Value;
  if (typeof v === 'number') usdRub = v;
}

// Перерисовка
function renderMoney() {
  // Подпись под USDT — курс 1 USDT в рублях по ЦБ
  if (usdRub > 0) usdtRateEl.textContent = fmtRub(usdRub);

  // Правый столбец USDT
  usdtBalanceEl.textContent   = `${fmtNum(balances.usdt)} USDT`;
  usdtFiatValueEl.textContent = fmtRub(balances.usdt * usdRub);

  // Total balance — суммарно в рублях (пока только USDT)
  const totalRub = balances.usdt * usdRub; // + balances.ton * tonRub (если добавишь курс TON)
  balanceEl.textContent = visible ? fmtNum(totalRub) : '•••';
}

// Обновляем курс и экран
async function refresh() {
  try {
    await fetchUsdRubFromCBR();
  } catch (e) {
    console.error('Ошибка получения курса ЦБ:', e);
  } finally {
    renderMoney();
  }
}

// Обновление по таймеру (например, раз в минуту)
refresh();
setInterval(refresh, 60_000);

// Обновляем обработчик «глазика», чтобы он скрывал/показывал уже посчитанный Total
eye.addEventListener('click', () => {
  visible = !visible;
  renderMoney();
});



// === 0) Укажите адрес вашего бэкенда (HTTPS!):
//const API_BASE = 'https://<ВАШ-ДОМЕН-БЭКЕНДА>'; // например, https://my-miniapp-api.onrender.com

// Универсальный POST к вашему API с подписью Telegram
//async function api(path, body = {}) {
  //const r = await fetch(`${API_BASE}${path}`, {
    //method: 'POST',
    //headers: { 'Content-Type': 'application/json' },
    //body: JSON.stringify({ initData: Telegram.WebApp.initData, ...body }),
  //});
  //if (!r.ok) throw new Error(await r.text());
  //return r.json();
//}

// === 1) Сканер → заявка оператору → опрос статуса ===
//document.getElementById('scanBtn').addEventListener('click', () => {
  //Telegram.WebApp.showScanQrPopup({ text: 'Сканируйте SBP-QR' });
//});

//Telegram.WebApp.onEvent('qrTextReceived', async ({ data }) => {
  //try {
    //Telegram.WebApp.closeScanQrPopup();
    //if (!/^https?:\/\/qr\.nspk\.ru\//i.test(data)) {
      //return Telegram.WebApp.showPopup({ title: 'Не платёжный QR', message: data.slice(0,200) });
    //}
    // Сумма (если её нет в QR — спросим вручную)
    //const amountStr = prompt('Введите сумму чека, ₽ (например 990.00)');
    //if (!amountStr) return;
    //const amountKop = Math.round(parseFloat(amountStr.replace(',', '.')) * 100);

    // 1) создаём ЗАЯВКУ и ставим hold на внутреннем балансе
    //const { requestId, holdId } = await api('/api/approvals/create', {
      //amount: amountKop,
      //sbpLink: data,
      //note: 'Покупка в магазине по SBP',
    //});

    //Telegram.WebApp.showPopup({ title: 'Отправлено оператору', message: 'Ожидаем подтверждения оплаты.' });

    // 2) поллим статус (можно заменить на WebSocket/SSE)
    //const timer = setInterval(async () => {
      //const { status } = await api('/api/approvals/status', { requestId });
      //if (status === 'APPROVED') {
        //clearInterval(timer);
        //await api('/api/balance/commit', { holdId });
        //Telegram.WebApp.showToast('Оплата подтверждена. Баланс списан.');
      //}
      //if (status === 'REJECTED' || status === 'EXPIRED') {
        //clearInterval(timer);
        //await api('/api/balance/release', { holdId });
        //Telegram.WebApp.showToast('Отклонено. Бронь снята.');
      //}
    //}, 3000);
  //} catch (e) {
    //console.error(e);
    //Telegram.WebApp.showPopup({ title: 'Ошибка', message: 'Не удалось обработать QR' });
  //}
//});


// …и так далее для остальных функций (меню, кнопки, API-запросы)
