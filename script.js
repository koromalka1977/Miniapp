// Ждём, пока Telegram SDK будет готов
Telegram.WebApp.ready();

// Получаем профиль пользователя
const user = Telegram.WebApp.initDataUnsafe.user;

// Находим элементы по id
const avatarEl  = document.getElementById('avatarImg');
const nameEl    = document.getElementById('userName');
const eye       = document.getElementById('toggleEye');
const balanceEl = document.getElementById('balanceValue');

// Заполняем данные пользователя
if (user?.photo_url) {
  avatarEl.src = user.photo_url;
} else {
  avatarEl.src = 'assets/default-avatar.png';
}
nameEl.textContent = user?.username
  ? '@' + user.username
  : `${user?.first_name || ''} ${user?.last_name || ''}`.trim();

// Логика показа/скрытия баланса
let visible = true;

// Клик по «глазику» — просто перерисовываем суммы (не затираем 0.0)
eye.addEventListener('click', () => {
  visible = !visible;
  renderMoney();
});

// === Кнопка Scan ===
const scanBtn = document.getElementById('scanBtn');
scanBtn.addEventListener('click', () => {
  Telegram.WebApp.showScanQrPopup({ text: 'Сканируйте QR-код для оплаты' })
    .catch(err => console.error('Не удалось открыть сканер:', err));
});
Telegram.WebApp.onEvent('qrTextReceived', ({ data }) => {
  console.log('QR-код отсканирован, данные:', data);
  Telegram.WebApp.closeScanQrPopup();
  // TODO: здесь ваш код обработки data (например, openInvoice)
});
Telegram.WebApp.onEvent('scanQrPopupClosed', () => {
  console.log('Сканер был закрыт без сканирования');
});

// === Навигация по нижнему меню ===
const navItems = document.querySelectorAll('.nav-item');
const pages    = document.querySelectorAll('.page');
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const pageName = item.dataset.page;
    navItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    pages.forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById(`page-${pageName}`);
    if (pageEl) pageEl.classList.add('active');
  });
});

// ==================== КУРС ЦБ + БАЛАНС USDT ====================

// Элементы карточки USDT
const usdtRateEl      = document.getElementById('usdtRate');       // подпись «— ₽» под USDT
const usdtFiatValueEl = document.getElementById('usdtFiatValue');  // справа, верхняя строка (₽)
const usdtBalanceEl   = document.getElementById('usdtBalance');    // справа, нижняя строка (USDT)

// Форматирование
const fmtRub = n => `${(n ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`;
const fmtNum = n => (n ?? 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Тестовые балансы по пользователю (можно по username или по user.id)
const userUsdtByUsername = {
  // Пример «персонального» баланса:
  'Alexsasasss': 321.45
};
const defaultUsdt = 125.50;

// Итоговый мок баланса
const balances = {
  usdt: (user && userUsdtByUsername[user.username]) ?? defaultUsdt,
  ton: 0
};

// Курс USD/RUB по ЦБ РФ (используем как USDT/RUB)
let usdRub = Number(localStorage.getItem('usdRub')) || 0;

// Получение курса: 1 USD (≈ 1 USDT) в рублях по ЦБ
async function fetchUsdRubFromCBR() {
  const resp = await fetch('https://www.cbr-xml-daily.ru/daily_json.js', { cache: 'no-store' });
  if (!resp.ok) throw new Error('CBR fetch failed');
  const data = await resp.json();
  const v = data?.Valute?.USD?.Value;
  if (typeof v === 'number') {
    usdRub = v;
    localStorage.setItem('usdRub', String(usdRub));
  }
}

// Отрисовка всех сумм
function renderMoney() {
  // Подпись под USDT — курс
  if (usdtRateEl) usdtRateEl.textContent = usdRub > 0 ? fmtRub(usdRub) : '— ₽';

  // Справа от USDT
  if (usdtBalanceEl)   usdtBalanceEl.textContent   = `${fmtNum(balances.usdt)} USDT`;
  if (usdtFiatValueEl) usdtFiatValueEl.textContent = usdRub > 0 ? fmtRub(balances.usdt * usdRub) : '— ₽';

  // Total balance — сумма в ₽ по курсу ЦБ (пока учитываем только USDT)
  const totalRub = usdRub > 0 ? balances.usdt * usdRub : 0;
  balanceEl.textContent = visible ? fmtNum(totalRub) : '•••';
}

// Обновление курса и экрана
async function refresh() {
  try { await fetchUsdRubFromCBR(); } catch (e) { console.error('Ошибка получения курса ЦБ:', e); }
  renderMoney();
}

// Первичный рендер и периодическое обновление (ЦБ раз в день, но опросим раз в 10 мин)
renderMoney();
refresh();
setInterval(refresh, 10 * 60 * 1000);




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
