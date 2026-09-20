# MediControl – Gestión de medicamentos

Propuesta de innovación (ACA) y prototipo MVP de MediControl, un sistema digital de apoyo para organizar, consultar y hacer seguimiento de la información de medicamentos en farmacias.

Sitio estático (HTML, CSS y JavaScript). No necesita instalación ni servidor.

## Estructura

```
medicontrol/
├── index.html      Propuesta completa (secciones 1 a 12) y Anexo b con el prototipo
├── css/styles.css  Estilos del sitio y del prototipo
├── js/app.js       Lógica del prototipo (acceso, panel, registro, consulta, alertas, actividades)
└── README.md
```

## Ver el proyecto en local

- Opción rápida: abre `index.html` en el navegador.
- Con VS Code: instala la extensión **Live Server**, clic derecho sobre `index.html` y elige **Open with Live Server**.

## Prototipo

Es una demo sin servidor: acepta cualquier usuario y contraseña. Los datos (medicamentos, actividades y configuración de alertas) se guardan en el **localStorage del navegador**, por lo que se conservan al recargar la página pero no se comparten entre dispositivos. Usa «Reiniciar prototipo» para volver a los datos de ejemplo. Incluye las seis funciones del MVP: pantalla de acceso, panel principal, registro de medicamentos, búsqueda y consulta, módulo de alertas, y registro y consulta de actividades.

## Subir a GitHub

```bash
cd medicontrol
git init
git add .
git commit -m "MediControl: propuesta y prototipo MVP"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/medicontrol.git
git push -u origin main
```

Crea antes el repositorio vacío `medicontrol` en GitHub (sin README ni .gitignore, para evitar conflictos).

## Publicar con GitHub Pages

1. En el repositorio: **Settings > Pages**.
2. En **Build and deployment**, elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
3. Guarda. En uno o dos minutos el sitio queda en `https://TU_USUARIO.github.io/medicontrol/`.

GitHub Pages en cuentas gratuitas requiere que el repositorio sea público. Antes de hacerlo público, revisa que estés de acuerdo con que aparezcan los nombres de los autores y del docente.

## Nota

MediControl es una propuesta académica en etapa de validación. No reemplaza las responsabilidades del personal ni los controles sanitarios del establecimiento.
