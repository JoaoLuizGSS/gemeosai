const chatContainer = document.getElementById('chatContainer');
const welcomeScreen = document.getElementById('welcomeScreen');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');
const historyContainer = document.getElementById('historyContainer');
const userBadge = document.getElementById('userBadge');
const logoutBtn = document.getElementById('logoutBtn');

// Elementos de Login
const authOverlay = document.getElementById('authOverlay');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authUsernameInput = document.getElementById('authUsername');
const authPasswordInput = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleLink = document.getElementById('authToggleLink');

// Variáveis de Controle do Estado
let currentUser = null;
let currentChatId = null;
let isLoginMode = true;

// --- SISTEMA DE CONTAS (AUTH) ---
authToggleLink.addEventListener('click', () => {
isLoginMode = !isLoginMode;
if (isLoginMode) {
authTitle.innerText = "Entrar no Gêmeos";
authSubtitle.innerText = "Faça login para salvar suas conversas";
authSubmitBtn.innerText = "Entrar";
authToggleLink.innerText = "Cadastre-se";
} else {
authTitle.innerText = "Criar Conta";
authSubtitle.innerText = "Cadastre um usuário para gerenciar seus chats";
authSubmitBtn.innerText = "Cadastrar";
authToggleLink.innerText = "Faça Login";
}
});

authSubmitBtn.addEventListener('click', () => {
const username = authUsernameInput.value.trim().toLowerCase();
const password = authPasswordInput.value.trim();
if (!username || !password) return alert("Preencha todos os campos!");

let users = JSON.parse(localStorage.getItem('gemini_users')) || {};

if (isLoginMode) {
    if (users[username] && users[username] === password) { login(username); } 
    else { alert("Usuário ou senha incorretos."); }
} else {
    if (users[username]) { alert("Este usuário já existe!"); } 
    else {
        users[username] = password;
        localStorage.setItem('gemini_users', JSON.stringify(users));
        alert("Conta criada com sucesso! Faça login.");
        isLoginMode = true; authToggleLink.click();
    }
}
});

function login(username) {
currentUser = username;
authOverlay.style.display = 'none';
userBadge.innerText = username.charAt(0);
loadUserHistory();
startNewChat();
}

logoutBtn.addEventListener('click', () => {
currentUser = null; currentChatId = null;
authOverlay.style.display = 'flex';
historyContainer.innerHTML = ""; chatContainer.innerHTML = "";
});

// --- SISTEMA DE CHATS ---
function startNewChat() {
currentChatId = null;
chatContainer.innerHTML = <div class="welcome-screen" id="welcomeScreen"> <h1>Olá, eu sou o Gêmeos.</h1> <p>Envie uma mensagem para iniciar e salvar esta conversa.</p> </div>;
}

function saveMessageToHistory(type, content, fileName = null) {
let allChats = JSON.parse(localStorage.getItem('gemini_chats')) || [];
if (!currentChatId) {
currentChatId = 'chat_' + Date.now();
let previewText = type === 'text' ? content : Arquivo: ${fileName};
if (previewText.length > 25) previewText = previewText.substring(0, 25) + '...';
allChats.push({ id: currentChatId, user: currentUser, title: previewText, messages: [] });
}
const chatIndex = allChats.findIndex(c => c.id === currentChatId);
if (chatIndex !== -1) { allChats[chatIndex].messages.push({ type, sender: 'user', content, fileName }); }
localStorage.setItem('gemini_chats', JSON.stringify(allChats));
loadUserHistory();
}

function loadUserHistory() {
historyContainer.innerHTML = "";
let allChats = JSON.parse(localStorage.getItem('gemini_chats')) || [];
let userChats = allChats.filter(chat => chat.user === currentUser);
userChats.forEach(chat => {
const item = document.createElement('div');
item.classList.add('history-item');
item.innerHTML = <i class="fa-regular fa-message"></i> ${chat.title};
item.addEventListener('click', () => loadSpecificChat(chat.id));
historyContainer.appendChild(item);
});
}

function loadSpecificChat(chatId) {
currentChatId = chatId;
chatContainer.innerHTML = "";
let allChats = JSON.parse(localStorage.getItem('gemini_chats')) || [];
let activeChat = allChats.find(c => c.id === chatId);
if (activeChat) {
activeChat.messages.forEach(msg => {
if (msg.type === 'text') createUserMessageElement(msg.content);
else if (msg.type === 'image') createImageMessageElement(msg.content);
else createFileCardElement(msg.fileName, msg.content);
});
}
}

function sendMessage() {
const text = userInput.value.trim();
if (text === "") return;

hideWelcomeScreen();
createUserMessageElement(text);
saveMessageToHistory('text', text);

userInput.value = "";
userInput.style.height = '24px';

createBotResponse(text);
}

// --- EFEITO DE DIGITAÇÃO ULTRA-RÁPIDA COM SUPORTE A MARKDOWN ---
function typeResponseFast(element, text) {
let i = 0;
element.innerText = "";

function type() {
    if (i < text.length) {
        element.innerText += text.substring(i, i + 3);
        i += 3;
        scrollToBottom();
        setTimeout(type, 2);
    } else {
        // Quando a digitação termina, o Marked traduz o texto bruto em Markdown estruturado
        element.innerHTML = marked.parse(text);
        scrollToBottom();
    }
}
type();
}

// --- INTEGRAÇÃO COM A IA (VERSÃO VERCEL COM GERADOR DE IMAGENS E MARKDOWN) ---
async function createBotResponse(userText) {
const messageDiv = document.createElement('div');
messageDiv.classList.add('message', 'bot');
messageDiv.innerHTML = <span class="sender-name">Gêmeos</span><div class="bot-payload">Digitando...</div>;
chatContainer.appendChild(messageDiv);
scrollToBottom();

const payloadTarget = messageDiv.querySelector('.bot-payload');
const textoMinusculo = userText.toLowerCase();

// Filtro completo para interceptar qualquer intenção ou comando de geração de imagem
const termosImagem = ['imagem', 'imagens', 'image', 'images', 'desenhe', 'desenho', 'desenha', 'crie uma foto', 'gere uma foto', 'ilustre', 'ilustração', 'foto de', 'pinte', 'gerar foto', 'criar foto', 'avatar'];
const isImageRequest = termosImagem.some(palavra => textoMinusculo.includes(palavra)) || textoMinusculo.startsWith("/imagem");

if (isImageRequest) {
    let imagePrompt = userText
        .replace(/\/imagem /i, "")
        .replace(/crie uma imagem (de )?(um )?(uma )?/i, "")
        .replace(/gere uma imagem (de )?(um )?(uma )?/i, "")
        .replace(/desenhe (um )?(uma )?/i, "")
        .replace(/ilustre (um )?(uma )?/i, "")
        .replace(/crie uma foto (de )?(um )?(uma )?/i, "")
        .replace(/gere uma foto (de )?(um )?(uma )?/i, "")
        .trim();

    payloadTarget.innerText = "Preparando os pincéis... Gerando sua imagem 🎨";