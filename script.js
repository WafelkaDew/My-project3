const STORAGE_KEY = 'my_notes';

// Все элементы страницы
const notesList = document.querySelector('.notes-list');
const addButton = document.querySelector('.btn-addnewnote');
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.btn-search');
const tagButtons = document.querySelectorAll('.tag');

// Элементы модального окна
const modal = document.querySelector('#noteModal');
const modalTitle = document.querySelector('.modal__title');
const noteForm = document.querySelector('#noteForm');
const titleInput = document.querySelector('input[name="title"]');
const contentInput = document.querySelector('textarea[name="content"]');
const tagSelect = document.querySelector('select[name="tag"]');

// Состояние приложения
let allNotes = [];
let activeTag = 'Все';
let searchText = '';

// Загрузка хранилища заметокк
function loadNotes() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.log('Ошибка загрузки:', error);
        return [];
    }
}

function saveNotes(notes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// Функции работы с заметками
function showNotes() {
    // Фильтруем заметки
    let filteredNotes = [...allNotes];
    
    // Фильтр по тегу
    if (activeTag !== 'Все') {
        filteredNotes = filteredNotes.filter(note => note.tag === currentTag);
    }
    
    // Фильтр по поиску
    if (searchText.trim()) {
        const query = searchText.toLowerCase();
        filteredNotes = filteredNotes.filter(note => 
            note.title.toLowerCase().includes(query) || 
            note.content.toLowerCase().includes(query)
        );
    }
    
    // Сортируем по дате (новые сверху)
    filteredNotes.sort((a, b) => b.updatedAt - a.updatedAt);
    
    // Очищаем список
    notesList.innerHTML = '';
    
    // Если нет заметок
    if (filteredNotes.length === 0) {
        notesList.innerHTML = '<div class="empty">Заметок не найдено</div>';
        return;
    }
    
    // Показываем заметки
    filteredNotes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.setAttribute('data-id', note.id);
        
        noteElement.innerHTML = `
            <div class="note__tag">${note.tag}</div>
            <div class="note__title">${note.title}</div>
            <div class="note__content">${note.content.replace(/\n/g, '<br>')}</div>
            <div class="note__footer">
                <div class="note__meta">${formatDate(note.createdAt)}</div>
            </div>
            <div class="note__actions">
                <button class="btn btn-danger" onclick="deleteNote('${note.id}')">Удалить</button>
            </div>
        `;
        
        notesList.appendChild(noteElement);
    });
}

// Обозначаем дату заметки
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU');
}

function openModal(mode = 'create', noteData = null) {
    modal.style.display = 'block';
    
    if (mode === 'create') {
        modalTitle.textContent = 'Новая заметка';
        titleInput.value = '';
        contentInput.value = '';
        tagSelect.value = 'Идеи';
    } else {
        modalTitle.textContent = 'Редактировать заметку';
        titleInput.value = noteData.title;
        contentInput.value = noteData.content;
        tagSelect.value = noteData.tag;
        // Сохраняем ID для редактирования
        titleInput.setAttribute('data-edit-id', noteData.id);
    }
}

function closeModal() {
    modal.style.display = 'none';
    titleInput.removeAttribute('data-edit-id');
}

function createNote() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const tag = tagSelect.value;
    
    if (!title || !content) {
        alert('Заполните заголовок и текст!');
        return;
    }
    
    const newNote = {
        id: Date.now().toString(),
        title: title,
        content: content,
        tag: tag,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    allNotes.push(newNote);
    saveNotes(allNotes);
    showNotes();
    closeModal();
}

function editNote() {
    const noteId = titleInput.getAttribute('data-edit-id');
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const tag = tagSelect.value;
    
    if (!title || !content) {
        alert('Заполните заголовок и текст!');
        return;
    }
    
    const noteIndex = allNotes.findIndex(note => note.id === noteId);
    if (noteIndex !== -1) {
        allNotes[noteIndex].title = title;
        allNotes[noteIndex].content = content;
        allNotes[noteIndex].tag = tag;
        allNotes[noteIndex].updatedAt = Date.now();
        
        saveNotes(allNotes);
        showNotes();
        closeModal();
    }
}

function deleteNote(noteId) {
    if (!confirm('Удалить эту заметку?')) return;
    
    allNotes = allNotes.filter(note => note.id !== noteId);
    saveNotes(allNotes);
    showNotes();
}


// Добавление заметок
addButton.addEventListener('click', () => openModal('create'));

// Закрытие модального окна
modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.classList.contains('close')) {
        closeModal();
    }
});

// Форма заметки
noteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    
    if (titleInput.hasAttribute('data-edit-id')) {
        editNote();
    } else {
        createNote();
    }
});

// Клик по заметке для редактирования
notesList.addEventListener('click', (event) => {
    const noteElement = event.target.closest('.note');
    if (noteElement && !event.target.classList.contains('btn-danger')) {
        const noteId = noteElement.getAttribute('data-id');
        const note = allNotes.find(n => n.id === noteId);
        if (note) {
            openModal('edit', note);
        }
    }
});

searchButton.addEventListenerEventListener('click', () => {
    searchText = searchInput.value;
    showNotes();
})

searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter'){
        searchText = searchInput.value;
        showNotes();
    }
})



function initApp() {
    allNotes = loadNotes();
    
    showNotes();
}

showNotes();
initApp();