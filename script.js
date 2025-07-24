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

// …и так далее для остальных функций (меню, кнопки, API-запросы)
