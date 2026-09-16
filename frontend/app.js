const API_BASE = "http://localhost:5000/api/projects";

// Referencias a los elementos del DOM (HTML)
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggle-sidebar");
const projectList = document.getElementById("project-list");

const homeView = document.getElementById("home-view");
const projectView = document.getElementById("project-view");
const btnHome = document.getElementById("btn-home");

const projectTitle = document.getElementById("project-title");
const projectDesc = document.getElementById("project-description");
const projectStatus = document.getElementById("project-status");
const healthIndicator = document.getElementById("health-indicator");
const exportBtn = document.getElementById("export-btn");
const loader = document.getElementById("loader");
const summaryContainer = document.getElementById("summary-container");

// 1. Eventos UI Básicos
toggleBtn.addEventListener("click", () => sidebar.classList.toggle("collapsed"));
exportBtn.addEventListener("click", () => window.print());

// 2. Navegación al Home
btnHome.addEventListener("click", () => {
    document.querySelectorAll(".project-item").forEach(el => el.classList.remove("active"));
    btnHome.classList.add("active");
    projectView.classList.add("hidden");
    homeView.classList.remove("hidden");
});

// 3. Cargar Proyectos en el Menú
async function loadProjects() {
    try {
        const response = await fetch(API_BASE);
        const projects = await response.json();
        projectList.innerHTML = ""; 

        projects.forEach(proj => {
            const li = document.createElement("li");
            li.className = "project-item";
            li.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                <span class="brand-text">${proj.project_name.split("—")[0].trim()}</span> 
            `;
            li.addEventListener("click", () => selectProject(proj, li));
            projectList.appendChild(li);
        });
    } catch (error) {
        console.error("Error al cargar proyectos. ¿Está corriendo Flask?", error);
    }
}

// 4. Seleccionar un Proyecto y Llamar a la IA
async function selectProject(project, element) {
    document.querySelectorAll(".project-item").forEach(el => el.classList.remove("active"));
    btnHome.classList.remove("active"); 
    element.classList.add("active");

    homeView.classList.add("hidden");
    projectView.classList.remove("hidden");

    projectTitle.textContent = project.project_name;
    projectDesc.textContent = project.description;
    projectStatus.textContent = project.status;
    projectStatus.classList.remove("hidden");
    healthIndicator.classList.add("hidden");
    exportBtn.classList.add("hidden");

    summaryContainer.classList.add("hidden");
    summaryContainer.innerHTML = "";
    document.getElementById("roi-calculator").classList.add("hidden");
    loader.classList.remove("hidden");

    // Cronómetro
    const startTime = performance.now();

    try {
        // Ejecución concurrente: pedimos resumen (IA) y cantidad de mensajes crudos a la vez
        const [summaryRes, messagesRes] = await Promise.all([
            fetch(`${API_BASE}/${project.project_id}/summary`),
            fetch(`${API_BASE}/${project.project_id}/messages`)
        ]);
        
        const summary = await summaryRes.json();
        const messages = await messagesRes.json();
        
        const endTime = performance.now();
        const aiTimeSeconds = ((endTime - startTime) / 1000).toFixed(2);
        
        if(summary.error) {
            renderError(summary.error);
        } else {
            renderROI(messages.length, aiTimeSeconds);
            renderSummary(summary);
        }
    } catch (error) {
        renderError("Hubo un error de conexión con el servidor. Revisá que Flask esté encendido.");
    } finally {
        loader.classList.add("hidden");
    }
}

// 5. Inyectar Calculador de ROI
function renderROI(messageCount, aiTime) {
    const humanMinutes = messageCount * 3; // 3 mins por mensaje como métrica base
    document.getElementById("roi-messages").textContent = messageCount;
    document.getElementById("roi-human").textContent = `${humanMinutes} min`;
    document.getElementById("roi-ai").textContent = `${aiTime} s`;
    document.getElementById("roi-calculator").classList.remove("hidden");
}

// 6. Generar Tarjetas y Lógica Visual
function renderSummary(data) {
    // A. Indicador de Salud
    if (data.bloqueos_o_riesgos && data.bloqueos_o_riesgos.length > 0) {
        healthIndicator.textContent = "🔴 EN RIESGO";
        healthIndicator.className = "badge risk";
    } else {
        healthIndicator.textContent = "🟢 SALUDABLE";
        healthIndicator.className = "badge healthy";
    }
    healthIndicator.classList.remove("hidden");
    exportBtn.classList.remove("hidden");

    // B. Preparar HTML
    let html = "";
    const createCard = (title, icon, content, isFull = false, id = "") => {
        if (!content || (Array.isArray(content) && content.length === 0)) return "";
        let body = Array.isArray(content) 
            ? `<ul>${content.map(item => `<li>${item}</li>`).join("")}</ul>` 
            : `<p id="${id}"></p>`;

        return `
            <div class="card ${isFull ? 'full-width' : ''}">
                <h3><span>${icon}</span> ${title}</h3>
                ${body}
            </div>
        `;
    };

    html += createCard("Resumen General", "📝", data.resumen_general, true, "typing-text");
    html += createCard("Avances", "🚀", data.avances);
    html += createCard("Próximos Pasos", "🎯", data.proximos_pasos);
    html += createCard("Pendientes (Backlog)", "📋", data.pendientes_backlog);
    html += createCard("Bloqueos o Riesgos", "⚠️", data.bloqueos_o_riesgos);
    html += createCard("Dudas del Cliente", "❓", data.preguntas_frecuentes_cliente);

    summaryContainer.innerHTML = html;
    summaryContainer.classList.remove("hidden");

    // C. Efecto Máquina de Escribir
    const summaryText = data.resumen_general;
    const typingElement = document.getElementById("typing-text");
    
    if (typingElement && summaryText) {
        typingElement.classList.add("cursor-typing");
        let index = 0;
        
        const typingInterval = setInterval(() => {
            if (index < summaryText.length) {
                typingElement.textContent += summaryText.charAt(index);
                index++;
            } else {
                clearInterval(typingInterval);
                setTimeout(() => typingElement.classList.remove("cursor-typing"), 2000);
            }
        }, 15);
    }
}

// 7. Renderizado de Error
function renderError(message) {
    summaryContainer.innerHTML = `<div class="card full-width"><h3 style="color:#ef4444;">❌ Error</h3><p>${message}</p></div>`;
    summaryContainer.classList.remove("hidden");
}

// Inicializar la app
loadProjects();