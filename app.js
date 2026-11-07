/* Памятка пассажира — логика чек-листа.
   Никаких запросов в сеть, cookies и аналитики. Отметки хранятся только
   в localStorage вашего браузера и никуда не отправляются. */
(function () {
  "use strict";

  var STORAGE_KEY = "passenger-memo-v1";

  var CATEGORIES = [
    { id: "docs", icon: "📄", title: "Документы и деньги" },
    { id: "carry", icon: "🎒", title: "Ручная кладь" },
    { id: "tech", icon: "🔌", title: "Электроника" },
    { id: "health", icon: "💊", title: "Здоровье и гигиена" },
    { id: "comfort", icon: "😴", title: "Комфорт в полёте" },
    { id: "bag", icon: "🧳", title: "Багаж" }
  ];

  var ITEMS = [
    ["docs", "Паспорт", "Проверьте срок действия — для многих стран нужен запас"],
    ["docs", "Билет и посадочный талон", "Электронный и, на всякий случай, распечатанный"],
    ["docs", "Виза, страховка, бронь отеля", "Если требуются для вашего направления"],
    ["docs", "Документы на ребёнка", "Свидетельство о рождении, доверенность — по необходимости"],
    ["docs", "Банковская карта и немного наличных", ""],
    ["carry", "Прозрачный пакет с жидкостями", "Ёмкости небольшого объёма — уточните лимиты"],
    ["carry", "Сменная одежда", "На случай задержки багажа"],
    ["carry", "Тёплая кофта или плед", "В салоне часто прохладно"],
    ["carry", "Пустая бутылка для воды", "Наполните после досмотра"],
    ["carry", "Перекус", "Орехи, батончики, сухофрукты"],
    ["carry", "Ручка", "Пригодится для заполнения анкет"],
    ["tech", "Телефон и зарядное устройство", ""],
    ["tech", "Powerbank — только в ручной клади", "Литиевые батареи, как правило, в багаж нельзя"],
    ["tech", "Наушники", ""],
    ["tech", "Переходник для розеток", "Если страна использует другой стандарт"],
    ["tech", "Билеты, карты и книги офлайн", "Скачайте заранее"],
    ["health", "Личные лекарства в оригинальной упаковке", "Рецепт или справка — для сильнодействующих"],
    ["health", "Гигиенические салфетки и маска", ""],
    ["health", "Очки или линзы с запасом", ""],
    ["health", "Мини-набор гигиены", "Зубная щётка, паста в небольшой таре"],
    ["comfort", "Подушка для шеи", ""],
    ["comfort", "Беруши и маска для сна", ""],
    ["comfort", "Тёплые носки", ""],
    ["comfort", "Бальзам для губ и крем для рук", "В самолёте сухой воздух"],
    ["comfort", "Леденцы или жвачка", "Помогают при взлёте и посадке"],
    ["bag", "Бирка с контактами на чемодане", ""],
    ["bag", "Фото чемодана на телефон", "Поможет найти багаж, если он потеряется"],
    ["bag", "Острое, хрупкое и крупные жидкости — в багаж", "Если авиакомпания разрешает перевозку"],
    ["bag", "Свободное место для покупок", ""]
  ];

  var state = loadState();
  var filter = "all";

  var listEl = document.getElementById("checklist");
  var barEl = document.getElementById("bar");
  var countEl = document.getElementById("count");
  var pctEl = document.getElementById("pct");
  var toastEl = document.getElementById("toast");
  var celebrated = false;

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* хранилище недоступно — работаем без сохранения */ }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function render() {
    listEl.textContent = "";
    CATEGORIES.forEach(function (cat) {
      if (filter !== "all" && filter !== cat.id) return;

      var title = el("h3", "group-title", cat.icon + " " + cat.title);
      listEl.appendChild(title);

      var grid = el("div", "grid");
      ITEMS.forEach(function (item, idx) {
        if (item[0] !== cat.id) return;
        var id = "i" + idx;

        var label = el("label", "check");
        var input = document.createElement("input");
        input.type = "checkbox";
        input.id = id;
        input.checked = !!state[id];
        input.addEventListener("change", function () {
          if (input.checked) { state[id] = 1; } else { delete state[id]; }
          saveState();
          updateProgress(true);
        });

        var box = el("span", "box");
        box.setAttribute("aria-hidden", "true");
        box.textContent = "✓";

        var txt = el("span", "txt", item[1]);
        if (item[2]) txt.appendChild(el("small", "", item[2]));

        label.appendChild(input);
        label.appendChild(box);
        label.appendChild(txt);
        grid.appendChild(label);
      });
      listEl.appendChild(grid);
    });
    updateProgress(false);
  }

  function updateProgress(canCelebrate) {
    var total = ITEMS.length;
    var done = Object.keys(state).filter(function (k) {
      return /^i\d+$/.test(k) && Number(k.slice(1)) < total;
    }).length;
    var pct = Math.round((done / total) * 100);
    barEl.style.width = pct + "%";
    barEl.parentNode.setAttribute("aria-valuenow", String(pct));
    countEl.textContent = done + " из " + total;
    pctEl.textContent = pct + "%";
    if (done === total && canCelebrate && !celebrated) {
      celebrated = true;
      toast("Всё собрано! Счастливого пути ✈️");
    }
    if (done < total) celebrated = false;
  }

  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 3200);
  }

  // Фильтры
  var chips = document.querySelectorAll("[data-filter]");
  Array.prototype.forEach.call(chips, function (chip) {
    chip.addEventListener("click", function () {
      filter = chip.getAttribute("data-filter");
      Array.prototype.forEach.call(chips, function (c) {
        c.setAttribute("aria-pressed", c === chip ? "true" : "false");
      });
      render();
    });
  });

  // Сброс
  document.getElementById("reset").addEventListener("click", function () {
    if (!window.confirm("Снять все отметки в чек-листе?")) return;
    state = {};
    saveState();
    render();
    toast("Чек-лист очищен");
  });

  // Печать
  document.getElementById("print").addEventListener("click", function () {
    window.print();
  });
  var print2 = document.getElementById("print2");
  if (print2) print2.addEventListener("click", function () { window.print(); });

  // Год в подвале
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  render();
})();
