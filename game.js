// ===== DEFAULT DATA =====
const defaultData = {
    gains: 0,
    lastUpdate: Date.now(),

    items: [
        { id: "pushups", name: "Carry your Grandma's Groceries", desc: "Basic bodyweight exercise. Reliable early gains.", count: 1, base: 1, cost: 10 },
        { id: "dumbbells", name: "Do 1 Daily Pushup", desc: "Simple weights that improve strength training efficiency.", count: 0, base: 5, cost: 100 },
        { id: "bench", name: "Post about your Mewing", desc: "Heavy compound lift. Massive strength gains.", count: 0, base: 20, cost: 500 }
    ],

    shop: [
        { id: "protein", name: "Self Help book from a millionaire", desc: "Boosts muscle recovery and overall gains.", cost: 100, bought: false, effect: 1.2 },
        { id: "preworkout", name: "Professional Discord Profile Picture", desc: "Increases energy and performance output.", cost: 300, bought: false, effect: 1.5 }
    ],

    enemies: [
        { id: "slime", name: "Washing the Dishes", desc: "A weak gelatinous creature. Easy first opponent.", power: 50, drop: "Slimy Badge" },
        { id: "rat", name: "Showering", desc: "A seasoned lifter who lives in the gym.", power: 200, drop: "Gym Gloves" },
        { id: "titan", name: "Cleaning the house", desc: "A massive being of pure strength.", power: 1000, drop: "Titan Core" }
    ],

    inventory: []
};

// ===== LOAD + MERGE =====
let savedRaw = localStorage.getItem("gainsSave");
let saved = null;

try {
    saved = savedRaw ? JSON.parse(savedRaw) : null;
} catch {
    saved = null;
}

let state = structuredClone(defaultData);

if (saved && typeof saved === "object") {
    state.gains = saved.gains ?? 0;
    state.lastUpdate = saved.lastUpdate ?? Date.now();

    state.items.forEach(def => {
        let old = saved.items?.find(i => i.id === def.id);
        if (old) {
            def.count = old.count;
            def.cost = old.cost;
        }
    });

    state.shop.forEach(def => {
        let old = saved.shop?.find(i => i.id === def.id);
        if (old) {
            def.bought = old.bought;
        }
    });

    state.inventory = saved.inventory ?? [];
}

// ===== SAVE =====
function save() {
    if (!state) return;
    localStorage.setItem("gainsSave", JSON.stringify(state));
}

// ===== RESET =====
function resetProgress() {
    if (confirm("Reset all progress?")) {
        clearInterval(gameInterval);
        localStorage.removeItem("gainsSave");
        window.location.href = window.location.pathname;
    }
}

// ===== GAME LOGIC =====
function gainMultiplier() {
    let mult = 1;
    state.shop.forEach(u => { if (u.bought) mult *= u.effect; });
    mult *= Math.pow(1.1, state.inventory.length);
    return mult;
}

function gainRate() {
    return state.items.reduce((sum, i) => sum + i.count * i.base, 0) * gainMultiplier();
}

function updateOffline() {
    let now = Date.now();
    let diff = Math.min((now - state.lastUpdate) / 1000, 3600);
    state.gains += diff * gainRate();
    state.lastUpdate = now;
}

function clickItem(i) {
    let item = state.items[i];
    state.gains += item.count * item.base * gainMultiplier();
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

// ===== UI =====
function showTab(id) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// ===== RENDER =====
function render() {
    document.getElementById("gains").innerText = Math.floor(state.gains);

    // Gains tab
    let g = document.getElementById("gainsTab");
    g.innerHTML = "";
    state.items.forEach((item, i) => {
        g.innerHTML += `
      <div class="card">
        <b>${item.name}</b> (${item.count})<br>
        <div class="desc">${item.desc}</div>
        Passive: ${item.base * item.count}/s<br>
        Click Gain: ${item.base * item.count}<br>
        <button onclick="clickItem(${i})">Click</button>
        <button onclick="buyItem(${i})">Buy (${item.cost})</button>
      </div>
    `;
    });

    // Shop tab
    let s = document.getElementById("shopTab");
    s.innerHTML = "";
    state.shop.forEach((u, i) => {
        s.innerHTML += u.bought
            ? `<div class="card"><b>${u.name}</b><div class="desc">${u.desc}</div>Owned (x${u.effect})</div>`
            : `<div class="card"><b>${u.name}</b><div class="desc">${u.desc}</div>x${u.effect}<br>
         <button onclick="buyUpgrade(${i})">Buy (${u.cost})</button></div>`;
    });

    // Inventory tab
    let inv = document.getElementById("inventoryTab");
    inv.innerHTML = state.inventory.length === 0
        ? "<div class='card'>No items</div>"
        : state.inventory.map(i => `
        <div class="card">
          <b>${i}</b><br>
          <div class="desc">Provides +10% total gains.</div>
        </div>`).join("");

    // Combat tab
    let c = document.getElementById("combatTab");
    c.innerHTML = "";
    state.enemies.forEach((e, i) => {
        if (state.gains >= e.power) {
            c.innerHTML += `<div class="card">
        <b>${e.name}</b><br>
        <div class="desc">${e.desc}</div>
        Power: ${e.power}<br>
        Win Chance: ${Math.min(90, Math.floor((state.gains / e.power) * 100))}%<br>
        Drop: ${e.drop}<br>
        <button onclick="fight(${i})">Fight</button>
      </div>`;
        } else {
            c.innerHTML += `<div class="card">
        <span class="hidden">???</span><br>
        Requires ${e.power} gains
      </div>`;
        }
    });
}

// ===== GAME LOOP =====
function gameLoop() {
    updateOffline();
    state.gains += gainRate() / 10;
    render();
    save();
}

let gameInterval = setInterval(gameLoop, 100);