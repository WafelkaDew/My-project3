// ======= Константы и хелперы =======
const LS_KEY = 'notes_app_v1';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  localStorage.setItem(LS_KEY, JSON.stringify(notes));
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString('ru-RU', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

// ======= Состояние =======
let notes = loadNotes();
let activeTag = 'Все';
let searchQuery = '';

// ======= Элементы =======
const notesList = $('.notes-list');
const btnAdd = $('.btn-addnewnote');
const searchInput = $('.search-input');
const btnSearch = $('.btn-search');
const tagButtons = $$('.tag');

// Модалка
const modal = $('#noteModal');
const modalTitle = $('.modal__title', modal);
const form = $('#noteForm');
const hiddenId = $('input[name="id"]', form);
const inputTitle = $('input[name="title"]', form);
const inputContent = $('textarea[name="content"]', form);
const selectTag = $('select[name="tag"]', form);

// ======= Рендер =======
function renderNotes() {
  // фильтрация
  let filtered = notes.slice().sort((a,b) => b.updatedAt - a.updatedAt);
  if (activeTag !== 'Все') filtered = filtered.filter(n => n.tag === activeTag);
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    );
  }

  // рендер
  notesList.innerHTML = '';
  if (!filtered.length) {
    const div = document.createElement('div');
    div.className = 'empty';
    div.textContent = 'Здесь пока пусто. Создайте заметку!';
    notesList.appendChild(div);
    return;
  }

  for (const n of filtered) {
    const el = document.createElement('div');
    el.className = 'note';
    el.dataset.id = n.id;  // нужно для клика по карточке
    el.innerHTML = `
  <div class="note__tag">${escapeHtml(n.tag)}</div>

  <div class="note__title">${escapeHtml(n.title)}</div>
  <div class="note__content">${escapeHtml(n.content).replace(/\n/g, '<br/>')}</div>

  <div class="note__footer">
    <div class="note__meta">${formatDate(n.createdAt)}</div>
  </div>

  <div class="note__actions">
    <button class="btn btn-danger btn-delete" data-action="delete" data-id="${n.id}" title="Удалить">Удалить</button>
  </div>
    `;
    notesList.appendChild(el);
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

// Модалка: открытие/закрытие 
function openModal(mode = 'create', data = null) {
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');

  if (mode === 'create') {
    modalTitle.textContent = 'Новая заметка';
    hiddenId.value = '';
    inputTitle.value = '';
    inputContent.value = '';
    //
    selectTag.value = ['Идеи','Личное','Работа','Список покупок'].includes(activeTag) ? activeTag : 'Идеи';
  } else {
    modalTitle.textContent = 'Редактирование';
    hiddenId.value = data.id;
    inputTitle.value = data.title;
    inputContent.value = data.content;
    selectTag.value = data.tag;
  }

  setTimeout(() => inputTitle.focus(), 0);
}

function closeModal() {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

// 
btnAdd.addEventListener('click', () => openModal('create'));

modal.addEventListener('click', (e) => {
  if (e.target.matches('[data-close-modal]')) closeModal();
  if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = hiddenId.value;
  const title = inputTitle.value.trim();
  const content = inputContent.value.trim();
  const tag = selectTag.value;

  if (!title || !content) return;

  if (id) {
    const idx = notes.findIndex(n => n.id === id);
    if (idx !== -1) {
      notes[idx] = { ...notes[idx], title, content, tag, updatedAt: Date.now() };
    }
  } else {
    const now = Date.now();
    notes.push({
      id: uid(),
      title, content, tag,
      createdAt: now,
      updatedAt: now
    });
  }

  saveNotes(notes);
  renderNotes();
  closeModal();
});


notesList.addEventListener('click', (e) => {
  const delBtn = e.target.closest('button[data-action="delete"]');
  if (delBtn) {
    const id = delBtn.dataset.id;
    const note = notes.find(n => n.id === id);
    if (!note) return;
    if (!confirm(`Удалить заметку «${note.title}»?`)) return;
    notes = notes.filter(n => n.id !== id);
    saveNotes(notes);
    renderNotes();
    return;
  }

 
  const card = e.target.closest('.note');
  if (card) {
    const id = card.dataset.id;
    const note = notes.find(n => n.id === id);
    if (note) openModal('edit', note);
  }
});

// Фильтрация по тегу
tagButtons.forEach(tagEl => {
  tagEl.addEventListener('click', () => {
    tagButtons.forEach(t => t.classList.remove('active'));
    tagEl.classList.add('active');
    activeTag = tagEl.dataset.tag;
    renderNotes();
  });
});


btnSearch.addEventListener('click', () => {
  searchQuery = searchInput.value;
  renderNotes();
});

let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = searchInput.value;
    renderNotes();
  }, 180);
});
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    searchQuery = searchInput.value;
    renderNotes();
  }
});

//  Первый рендер 
renderNotes();

//Демо-контент для первого запуска 
if (notes.length === 0) {
  const now = Date.now();
  notes.push(
    { id: uid(), title: 'Добро пожаловать!', content: 'Это ваша первая заметка. Кликните по карточке, чтобы отредактировать, или создайте новую.', tag: 'Личное', createdAt: now, updatedAt: now },
    { id: uid(), title: 'Идея проекта', content: 'Сделать SPA блокнот с фильтрами по тегам и быстрым поиском.', tag: 'Идеи', createdAt: now, updatedAt: now }
  );
  saveNotes(notes);
  renderNotes();
}