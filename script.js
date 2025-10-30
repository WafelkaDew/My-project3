// Для того, чтобы JS бил меня по рукам, если я неправильно пишу
'use strict';

const STORAGE_KEY = 'my_notes_app';

const notesList = document.querySelector('.notes-list');
const addButton = document.querySelector('.btn-addnewnote');
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.btn-search');
const tagButtons = document.querySelectorAll('.tag');

const modal = document.querySelector('#noteModal');
const modalTitle = document.querySelector('.modal__title');
const noteForm = document.querySelector('#noteForm');
const titleInput = document.querySelector('input[name="title"]');
const contentInput = document.querySelector('textarea[name="content"]');
const tagSelect = document.querySelector('select[name="tag"]');
const closeButtons = document.querySelectorAll('[data-close-modal]');

// Состояние приложения
let allNotes = [];
let currentTag = 'Все';
let searchText = '';

// Загрузка локального хранилищща
function loadNotesFromStorage() {
    try {
        const savedNotes = localStorage.getItem(STORAGE_KEY);
        return savedNotes ? JSON.parse(savedNotes) : [];
    } catch (error) {
        console.log('Ошибка загрузки заметок:', error);
        return [];
    }
}

function saveNotesToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotes));
}


function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}


function rendererNotes() {
    // Фильтр по тегу
    let filteredNotes = allNotes.filter(note => {
        if (currentTag === 'Все') return true;
        return note.tag === currentTag;
    });
    
    //Фильтр по поиску
    if (searchText.trim()) {
        const query = searchText.toLowerCase();
        filteredNotes = filteredNotes.filter(note => 
            note.title.toLowerCase().includes(query) || 
            note.content.toLowerCase().includes(query)
        );
    }
    
    // Сортировка по дате
    filteredNotes.sort((a, b) => b.updatedAt - a.updatedAt);
    
    //Очищаем список
    notesList.innerHTML = '';
    
    //Послание свыше для тех, кто ещё не вводил заметок
    if (filteredNotes.length === 0) {
        notesList.innerHTML = '<div class="empty">Заметок не найдено</div>';
        return;
    }
    
    //Показ заметок после фильтрации
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
                <button class="btn btn-danger btn-delete" data-id="${note.id}">Удалить</button>
            </div>
        `;
        
        notesList.appendChild(noteElement);
    });
}


function openModal() {
    modal.classList.add('show');
    modalTitle.textContent = 'Новая заметка';
    titleInput.value = '';
    contentInput.value = '';
    tagSelect.value = 'Идеи';
    
    // Убираем ID редактирования
    titleInput.removeAttribute('data-edit-id');
    
    // Фокусируемся на поле заголовка
    setTimeout(() => titleInput.focus(), 100);
}

function openEditModal(noteId) {
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;
    
    modal.classList.add('show');
    modalTitle.textContent = 'Редактировать заметку';
    titleInput.value = note.title;
    contentInput.value = note.content;
    tagSelect.value = note.tag;
    
    // Сохраняем ID для редактирования
    titleInput.setAttribute('data-edit-id', note.id);
    
    setTimeout(() => titleInput.focus(), 100);
}

function closeModal() {
    modal.classList.remove('show');
    titleInput.removeAttribute('data-edit-id');
}

// Создание заметок и их редактирование
function handleFormSubmit(event) {
    event.preventDefault();
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const tag = tagSelect.value;
    

    if (!title || !content) {
        alert('Заполните заголовок и текст заметки!');
        return;
    }
    
    const editId = titleInput.getAttribute('data-edit-id');
    
    if (editId) {
        const noteIndex = allNotes.findIndex(note => note.id === editId);
        if (noteIndex !== -1) {
            allNotes[noteIndex].title = title;
            allNotes[noteIndex].content = content;
            allNotes[noteIndex].tag = tag;
            allNotes[noteIndex].updatedAt = Date.now();
        }
    } else {
        const newNote = {
            id: Date.now().toString(), // Простой ID на основе времени
            title: title,
            content: content,
            tag: tag,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        allNotes.push(newNote);
    }
    
    saveNotesToStorage();
    rendererNotes();
    closeModal();
}

function deleteNote(noteId) {
    const note = allNotes.find(n => n.id === noteId);
    if (!note) return;
    
    if (confirm(`Удалить заметку "${note.title}"?`)) {
        allNotes = allNotes.filter(n => n.id !== noteId);
        saveNotesToStorage();
        rendererNotes();
    }
}

function handleSearch() {
    searchText = searchInput.value;
    rendererNotes();
}

//Система работы тегов
function handleTagClick(tagElement) {

    tagButtons.forEach(btn => btn.classList.remove('active'));
    tagElement.classList.add('active');
    currentTag = tagElement.getAttribute('data-tag');
    rendererNotes();
}

// Функции взаимодействия с записями
function setupEventListeners() {
    addButton.addEventListener('click', openModal);
    
    // Закрытие заметки
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    
    // Форма сохранения заметки
    noteForm.addEventListener('submit', handleFormSubmit);
    
    // Клики по списку заметок
    notesList.addEventListener('click', (event) => {
        const deleteButton = event.target.closest('.btn-delete');
        const noteElement = event.target.closest('.note');
        
        if (deleteButton) {
            const noteId = deleteButton.getAttribute('data-id');
            deleteNote(noteId);
        } else if (noteElement && !event.target.closest('.note__actions')) {
            const noteId = noteElement.getAttribute('data-id');
            openEditModal(noteId);
        }
    });
    
    // Кнопки тегов
    tagButtons.forEach(button => {
        button.addEventListener('click', () => handleTagClick(button));
    });
    
    // Поиск
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
    
}

// Инициализируем сайт
function initApp() {
    allNotes = loadNotesFromStorage();
    
    // Если заметок нет - создаем стартовые заметки
    if (allNotes.length === 0) {
        const now = Date.now();
        allNotes = [
            {
                id: '1',
                title: 'Добро пожаловать!',
                content: 'Это ваша первая заметка.',
                tag: 'Личное',
                createdAt: now,
                updatedAt: now
            },
        ];
        saveNotesToStorage();
    }
    

    setupEventListeners();
    
    rendererNotes();
}


document.addEventListener('DOMContentLoaded', initApp);