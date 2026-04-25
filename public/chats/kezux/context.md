Сидел в чате **Play2go.cloud**. Увидел человека с ником **Kezux**, в био был его сайт. Зашёл - был в ахуе, потому что это было навайбкоженное дерьмо. Когда открыл сурсы, увидел комментарии от ИИ:

```js
// Очистка старых виджетов перед перерендером (особенно важно для Turnstile)
if (this.state.captchaType === 'turnstile' && window.turnstile) {
  if (this.state.captchas.donate) try { turnstile.remove(this.state.captchas.donate); } catch(e){}
  if (this.state.captchas.feedback) try { turnstile.remove(this.state.captchas.feedback); } catch(e){}
}
containerDonate.innerHTML = '';
containerFeedback.innerHTML = '';
```

Таких мест там куча. Сайт написан на **чистом JS + статике** — автор не имеет понятия что такое фреймворки типа React. Если бы там был хоть React - я бы не смог зайти в отладчик и посмотреть полный код. Я бы даже не приебался.

После того как написал что сайт - хуйня, через 30 минут прилетело первое сообщение. Дальше можно смотреть диалог.
