const storageKey = "nutrimenu-categorias";

const initialCategories = [
  ["Legumes", "Alimentos", "Abobrinha, cenoura, chuchu, beterraba"],
  ["Verduras", "Alimentos", "Alface, couve, rúcula, acelga"],
  ["Grãos", "Alimentos", "Arroz, feijão, lentilha, grão-de-bico"],
  ["Proteínas", "Alimentos", "Frango, carne, peixe, ovos"],
  ["Frutas", "Alimentos", "Banana, mamão, maçã, melancia"],
  ["Sobremesas", "Alimentos", "Gelatina, compota, doce diet"],
  ["Dietas especiais", "Dietas", "Hipossódica, diabética, sem lactose"],
  ["Texturas", "Dietas", "Branda, pastosa, líquida, semissólida"],
  ["Guarnições", "Pratos", "Purê, legumes cozidos, farofa"],
  ["Saladas", "Pratos", "Cruas, cozidas, compostas"],
  ["Processos", "Processos", "Molhos, caldos, bases e refogados"],
  ["Molhos", "Processos", "Bolonhesa, sugo, branco, madeira"]
];

const weekDates = [
  ["Segunda-feira, 21 de abril de 2025", "Segunda", "21/04"],
  ["Terça-feira, 22 de abril de 2025", "Terça", "22/04"],
  ["Quarta-feira, 23 de abril de 2025", "Quarta", "23/04"],
  ["Quinta-feira, 24 de abril de 2025", "Quinta", "24/04"],
  ["Sexta-feira, 25 de abril de 2025", "Sexta", "25/04"],
  ["Sábado, 26 de abril de 2025", "Sábado", "26/04"],
  ["Domingo, 27 de abril de 2025", "Domingo", "27/04"]
];

let categories = loadCategories();

const categoryGrid = document.getElementById("categoryGrid");
const categoryForm = document.getElementById("categoryForm");
const categoryName = document.getElementById("categoryName");
const categoryGroup = document.getElementById("categoryGroup");
const excelInput = document.getElementById("excelInput");
const dayTitle = document.querySelector(".day-heading h2");
const validationPill = document.querySelector(".validation-pill");

function loadCategories() {
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return initialCategories;

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : initialCategories;
  } catch {
    return initialCategories;
  }
}

function saveCategories() {
  window.localStorage.setItem(storageKey, JSON.stringify(categories));
}

function renderCategories() {
  categoryGrid.innerHTML = "";
  categories.forEach(([name, group, examples]) => {
    const card = document.createElement("article");
    card.className = "category-card";
    card.innerHTML = `
      <strong>${escapeHtml(name)}</strong>
      <span>${escapeHtml(examples)}</span>
      <em>${escapeHtml(group)}</em>
    `;
    categoryGrid.appendChild(card);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

categoryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = categoryName.value.trim();
  if (!name) return;

  const exists = categories.some(([category]) => category.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"));
  if (!exists) {
    categories.push([name, categoryGroup.value, "Categoria cadastrada para a base mestre"]);
    saveCategories();
    renderCategories();
  }

  categoryName.value = "";
});

document.querySelectorAll(".week-tabs button").forEach((button, index) => {
  button.addEventListener("click", () => {
    document.querySelector(".week-tabs button.active")?.classList.remove("active");
    button.classList.add("active");
    dayTitle.textContent = weekDates[index][0];
  });
});

excelInput.addEventListener("change", () => {
  const file = excelInput.files && excelInput.files[0];
  if (!file) return;

  validationPill.textContent = "Excel selecionado";
  validationPill.classList.add("selected-file");
});

renderCategories();
