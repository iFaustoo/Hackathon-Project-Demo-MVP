const API_BASE = "http://localhost:5000/api/projects";

// Referencias a los elementos del DOM (HTML)
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggle-sidebar");
const projectList = document.getElementById("project-list");

// NUEVAS REFERENCIAS PARA LAS VISTAS
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

// 1. Colapsar/expandir sidebar
toggleBtn.addEventListener("click", () => sidebar.classList.toggle("collapsed"));

// 2. Botón Exportar PDF
exportBtn.addEventListener("click", () => window.print());

// 3. EVENTO: Clic en "Inicio" (Vista Global)
btnHome.addEventListener("click", () => {
    // Desmarcar todos los proyectos
    document.querySelectorAll(".project-item").forEach(el => el.classList.remove("active"));
    btnHome.classList.add("active");
    
    // Cambiar a vista Home
    projectView.classList.add("hidden");
    homeView.classList.remove("hidden");
});

// 4. Cargar la lista de proyectos al iniciar la app
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
            // Al hacer clic, cargamos la IA para ese proyecto
            li.addEventListener("click", () => selectProject(proj, li));
            projectList.appendChild(li);
        });
    } catch (error) {
        console.error("Error al cargar proyectos. ¿Está corriendo Flask?", error);
    }
}

// 5. Lógica al seleccionar un proyecto
async function selectProject(project, element) {
    // Desmarcar todos y marcar el actual
    document.querySelectorAll(".project-item").forEach(el => el.classList.remove("active"));
    btnHome.classList.remove("active"); // Desmarca el botón inicio
    element.classList.add("active");

    // Cambiar a vista Proyecto
    homeView.classList.add("hidden");
    projectView.classList.remove("hidden");

    // Actualizar los textos de la cabecera
    projectTitle.textContent = project.project_name;
    projectDesc.textContent = project.description;
    projectStatus.textContent = project.status;
    projectStatus.classList.remove("hidden");
    healthIndicator.classList.add("hidden");
    exportBtn.classList.add("hidden");

    // Ocultar resultados anteriores y mostrar el Loader
    summaryContainer.classList.add("hidden");
    summaryContainer.innerHTML = "";
    loader.classList.remove("hidden");

    try {
        // Llamar al LLM en el backend
        const response = await fetch(`${API_BASE}/${project.project_id}/summary`);
        const summary = await response.json();
        
        if(summary.error) {
            renderError(summary.error);
        } else {
            renderSummary(summary);
        }
    } catch (error) {
        renderError("Hubo un error de conexión con el servidor. Revisá que Flask esté encendido.");
    } finally {
        // Apagar el loader
        loader.classList.add("hidden");
    }
}

// 6. Dibujar las tarjetas con la respuesta del LLM
function renderSummary(data) {
    // Analizar "Salud" del Proyecto
    if (data.bloqueos_o_riesgos && data.bloqueos_o_riesgos.length > 0) {
        healthIndicator.textContent = "🔴 EN RIESGO";
        healthIndicator.className = "badge risk";
    } else {
        healthIndicator.textContent = "🟢 SALUDABLE";
        healthIndicator.className = "badge healthy";
    }
    healthIndicator.classList.remove("hidden");
    exportBtn.classList.remove("hidden"); // Mostramos el botón de PDF

    // Preparar las tarjetas
    let html = "";
    const createCard = (title, icon, content, isFull = false, id = "") => {
        if (!content || (Array.isArray(content) && content.length === 0)) return "";
        let body = Array.isArray(content) 
            ? `<ul>${content.map(item => `<li>${item}</li>`).join("")}</ul>` 
            : `<p id="${id}"></p>`; // Párrafo vacío para la máquina de escribir

        return `
            <div class="card ${isFull ? 'full-width' : ''}">
                <h3><span>${icon}</span> ${title}</h3>
                ${body}
            </div>
        `;
    };

    // Armamos el HTML (la primera tarjeta va vacía para el efecto)
    html += createCard("Resumen General", "📝", data.resumen_general, true, "typing-text");
    html += createCard("Avances", "🚀", data.avances);
    html += createCard("Próximos Pasos", "🎯", data.proximos_pasos);
    html += createCard("Pendientes (Backlog)", "📋", data.pendientes_backlog);
    html += createCard("Bloqueos o Riesgos", "⚠️", data.bloqueos_o_riesgos);
    html += createCard("Dudas del Cliente", "❓", data.preguntas_frecuentes_cliente);

    summaryContainer.innerHTML = html;
    summaryContainer.classList.remove("hidden");

    // Efecto Máquina de Escribir (Streaming Simulado)
    const summaryText = data.resumen_general;
    const typingElement = document.getElementById("typing-text");
    
    if (typingElement && summaryText) {
        typingElement.classList.add("cursor-typing");
        let index = 0;
        
        // Escribe una letra cada 15 milisegundos
        const typingInterval = setInterval(() => {
            if (index < summaryText.length) {
                typingElement.textContent += summaryText.charAt(index);
                index++;
            } else {
                clearInterval(typingInterval);
                setTimeout(() => typingElement.classList.remove("cursor-typing"), 2000); // Apaga el cursor
            }
        }, 15);
    }
}

// 7. Función para mostrar errores en la UI
function renderError(message) {
    summaryContainer.innerHTML = `<div class="card full-width"><h3 style="color:#ef4444;">❌ Error</h3><p>${message}</p></div>`;
    summaryContainer.classList.remove("hidden");
}

// Arrancar la app
loadProjects();