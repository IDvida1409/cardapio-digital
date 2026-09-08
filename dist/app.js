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

let categories = loadCategories();

const categoryGrid = document.getElementById("categoryGrid");
const categoryForm = document.getElementById("categoryForm");
const categoryName = document.getElementById("categoryName");
const categoryGroup = document.getElementById("categoryGroup");
const excelInput = document.getElementById("excelInput");
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

excelInput.addEventListener("change", () => {
  const file = excelInput.files && excelInput.files[0];
  if (!file) return;

  validationPill.textContent = "Excel selecionado";
  validationPill.classList.add("selected-file");
});

renderCategories();
