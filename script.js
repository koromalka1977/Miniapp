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


// …и так далее для остальных функций (меню, кнопки, API-запросы)
