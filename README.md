# MediControl – Gestión de medicamentos

Propuesta de innovación (ACA) y prototipo MVP de MediControl, un sistema digital de apoyo para organizar, consultar y hacer seguimiento de la información de medicamentos en farmacias.

Sitio estático (HTML, CSS y JavaScript). No necesita instalación ni servidor.

En línea: **https://dayanacifuentes28.github.io/medicontrol/**

> El sitio ya está publicado con GitHub Pages. El siguiente bloque «Subir a GitHub» es solo de referencia para otros equipos; si modificas los archivos, basta con hacer `git add . && git commit -m "mensaje" && git push` para que el flujo de GitHub Actions lo actualice automáticamente.

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

Es una demo sin servidor: acepta cualquier usuario y contraseña (se muestra un ejemplo bajo el formulario). Los datos (medicamentos, actividades, configuración de alertas, Kardex y encuestas) se guardan en el **localStorage del navegador** con la clave `medicontrol.v2`, por lo que se conservan al recargar la página pero no se comparten entre dispositivos. Usa «Reiniciar prototipo» para volver a los datos de ejemplo.

Incluye las seis funciones del MVP: pantalla de acceso, panel principal, registro de medicamentos, búsqueda y consulta, módulo de alertas, y registro y consulta de actividades. Además agrega funcionalidades de nivel profesional:

- **Ficha completa por medicamento**: categoría, laboratorio y registro sanitario INVIMA (además de lote, stock y vencimiento), con edición y eliminación.
- **Kardex**: historial de entradas, salidas y saldo por medicamento.
- **Gráficos en el panel**: stock bajo y próximos vencimientos visibles de un vistazo.
- **Exportar inventario a CSV** compatible con Excel (separador `;`, doble BOM UTF-8).
- **Encuesta de validación** con los indicadores de la sección 5.3 (facilidad, comprensión, satisfacción, tiempo y dificultades); las respuestas quedan guardadas en el navegador.

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

Este proyecto ya está publicado. La publicación usa el flujo **GitHub Actions** que se encuentra en `.github/workflows/static.yml`: cada vez que se hace `push` a la rama `main`, el sitio se reconstruye y despliega solo.

Descripción del flujo (por si se desea replicar en otro repositorio):

- `actions/configure-pages`, `upload-pages-artifact` (con `path: "."`) y `deploy-pages`.
- En el repositorio, **Settings > Pages** debe tener habilitado **GitHub Actions** como origen de Build and deployment (ya está configurado).

GitHub Pages en cuentas gratuitas requiere que el repositorio sea público. Antes de hacerlo público, revisa que estés de acuerdo con que aparezcan los nombres de los autores y del docente.

## Nota

MediControl es una propuesta académica en etapa de validación. No reemplaza las responsabilidades del personal ni los controles sanitarios del establecimiento.
