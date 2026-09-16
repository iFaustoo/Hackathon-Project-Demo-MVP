// Apuntamos al backend local de Flask
const API_BASE = "http://localhost:5000/api/projects";

// Referencias a los elementos del DOM (HTML)
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggle-sidebar");
const projectList = document.getElementById("project-list");
const projectTitle = document.getElementById("project-title");
const projectDesc = document.getElementById("project-description");
const projectStatus = document.getElementById("project-status");
const loader = document.getElementById("loader");
const summaryContainer = document.getElementById("summary-container");

// 1. Lógica para colapsar/expandir la barra lateral
toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
});

// 2. Cargar la lista de proyectos al iniciar la app
async function loadProjects() {
    try {
        const response = await fetch(API_BASE);
        const projects = await response.json();

        projectList.innerHTML = ""; // Limpiar lista por las dudas

        projects.forEach(proj => {
            const li = document.createElement("li");
            li.className = "project-item";
            // Icono de carpeta tech + nombre
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

// 3. Lógica al seleccionar un proyecto
async function selectProject(project, element) {
    // Pintar de verde el proyecto seleccionado
    document.querySelectorAll(".project-item").forEach(el => el.classList.remove("active"));
    element.classList.add("active");

    // Actualizar los textos de la cabecera
    projectTitle.textContent = project.project_name;
    projectDesc.textContent = project.description;
    projectStatus.textContent = project.status;
    projectStatus.classList.remove("hidden");

    // Ocultar resultados anteriores y mostrar el Loader futurista
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

// 4. Dibujar las tarjetas con la respuesta del LLM
function renderSummary(data) {
    let html = "";

    // Función auxiliar para crear cada tarjeta visual
    const createCard = (title, icon, content, isFull = false) => {
        // Si la IA devolvió una lista vacía para esta sección, no la dibujamos
        if (!content || (Array.isArray(content) && content.length === 0)) return "";
        
        let body = "";
        if (Array.isArray(content)) {
            body = `<ul>${content.map(item => `<li>${item}</li>`).join("")}</ul>`;
        } else {
            body = `<p>${content}</p>`;
        }

        return `
            <div class="card ${isFull ? 'full-width' : ''}">
                <h3><span>${icon}</span> ${title}</h3>
                ${body}
            </div>
        `;
    };

    // Mapeamos el JSON estructurado a nuestras tarjetas de la UI
    html += createCard("Resumen General", "📝", data.resumen_general, true); // Ocupa todo el ancho
    html += createCard("Avances", "🚀", data.avances);
    html += createCard("Próximos Pasos", "🎯", data.proximos_pasos);
    html += createCard("Pendientes (Backlog)", "📋", data.pendientes_backlog);
    html += createCard("Bloqueos o Riesgos", "⚠️", data.bloqueos_o_riesgos);
    html += createCard("Dudas del Cliente", "❓", data.preguntas_frecuentes_cliente);

    summaryContainer.innerHTML = html;
    summaryContainer.classList.remove("hidden");
}

// Función para mostrar errores en la UI
function renderError(message) {
    summaryContainer.innerHTML = `
        <div class="card full-width" style="border-color: #ef4444; box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);">
            <h3 style="color: #ef4444;"><span>❌</span> Error del Sistema</h3>
            <p>${message}</p>
        </div>
    `;
    summaryContainer.classList.remove("hidden");
}

// Arrancar la app
loadProjects();