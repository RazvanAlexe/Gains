let state = JSON.parse(localStorage.getItem("gainsSave")) || {
    gains: 0,
    lastUpdate: Date.now(),
    items: [
        { name: "Pushups", count: 1, base: 1, cost: 10 },
        { name: "Dumbbells", count: 0, base: 5, cost: 100 },
        { name: "Bench Press", count: 0, base: 20, cost: 500 }
    ],
    shop: [
        { name: "Protein Powder", cost: 100, bought: false, effect: 1.2 },
        { name: "Pre-Workout", cost: 300, bought: false, effect: 1.5 }
    ],
    inventory: [],
    enemies: [
        { name: "Slime", power: 50, drop: "Slimy Badge" },
        { name: "Gym Rat", power: 200, drop: "Gym Gloves" },
        { name: "Titan", power: 1000, drop: "Titan Core" }
    ]
};

function save() {
    localStorage.setItem("gainsSave", JSON.stringify(state));
}

function gainMultiplier() {
    let mult = 1;
    state.shop.forEach(u => { if (u.bought) mult *= u.effect; });
    mult *= Math.pow(1.1, state.inventory.length);
    return mult;
}

function gainRate() {
    let total = 0;
    state.items.forEach(i => total += i.count * i.base);
    return total * gainMultiplier();
}

function updateOffline() {
    let now = Date.now();
    let diff = Math.min((now - state.lastUpdate) / 1000, 3600);
    state.gains += diff * gainRate();
    state.lastUpdate = now;
}

function clickItem(i) {
    let item = state.items[i];
    if (item.count > 0) {
        state.gains += item.count * item.base * gainMultiplier();
    }
}

function buyItem(i) {
    let item = state.items[i];
    if (state.gains >= item.cost) {
        state.gains -= item.cost;
        item.count++;
        item.cost = Math.floor(item.cost * 1.4);
    }
}

function buyUpgrade(i) {
    let u = state.shop[i];
    if (!u.bought && state.gains >= u.cost) {
        state.gains -= u.cost;
        u.bought = true;
    }
}

function fight(i) {
    let enemy = state.enemies[i];
    let chance = Math.min(0.9, state.gains / enemy.power);

    if (Math.random() < chance) {
        alert("Victory! You got " + enemy.drop);
        state.inventory.push(enemy.drop);
    } else {
        alert("Defeat!");
    }
}

function showTab(id) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

function render() {
    document.getElementById("gains").innerText = Math.floor(state.gains);

    let g = document.getElementById("gainsTab");
    g.innerHTML = "";
    state.items.forEach((item, i) => {
        g.innerHTML += `
      <div class="card">
        <b>${item.name}</b> (${item.count})<br>
        Passive: ${item.base * item.count}/s<br>
        <button onclick="clickItem(${i})">Click</button>
        <button onclick="buyItem(${i})">Buy (${item.cost})</button>
      </div>
    `;
    });

    let s = document.getElementById("shopTab");
    s.innerHTML = "";
    state.shop.forEach((u, i) => {
        s.innerHTML += u.bought
            ? `<div class="card">${u.name} (Owned)</div>`
            : `<div class="card">${u.name}<br>x${u.effect}
         <button onclick="buyUpgrade(${i})">Buy (${u.cost})</button></div>`;
    });

    let inv = document.getElementById("inventoryTab");
    inv.innerHTML = state.inventory.length === 0
        ? "<div class='card'>No items</div>"
        : state.inventory.map(i => `<div class="card">${i}</div>`).join("");

    let c = document.getElementById("combatTab");
    c.innerHTML = "";
    state.enemies.forEach((e, i) => {
        if (state.gains >= e.power) {
            c.innerHTML += `<div class="card">
        ${e.name} (${e.power})
        <button onclick="fight(${i})">Fight</button>
      </div>`;
        } else {
            c.innerHTML += `<div class="card">
        <span class="hidden">???</span><br>
        Requires ${e.power}
      </div>`;
        }
    });
}

function gameLoop() {
    updateOffline();
    state.gains += gainRate() / 10;
    render();
    save();
}

setInterval(gameLoop, 100);