# Guía de Contribución

¡Gracias por tu interés en contribuir a **MC Support System**!

Este documento establece las pautas para contribuir al proyecto y asegurar la calidad del código.

## Proceso de Desarrollo

1.  **Ramas (Branches)**:
    *   `main`: Rama de producción (estable).
    *   `develop`: Rama de integración (código probado).
    *   `feature/nombre-de-feature`: Para nuevas funcionalidades.
    *   `fix/nombre-del-bug`: Para corrección de errores.

2.  **Commits**:
    Usamos la convención de *Conventional Commits*:
    *   `feat: nueva funcionalidad de login`
    *   `fix: error en cálculo de reportes`
    *   `docs: actualización del manual`
    *   `style: corrección de espaciado`

## Estándares de Código

*   **TypeScript**: Siempre tipar variables y funciones. Evitar `any` en la medida de lo posible.
*   **Componentes**: Usar componentes funcionales y Hooks.
*   **Estilos**: Utilizar Tailwind CSS. Evitar CSS modules si es posible para mantener consistencia.
*   **Server Actions**: Colocar la lógica de negocio mutacional en `actions/`.

## Reportando Bugs

Si encuentras un error, por favor abre un Issue (si usamos GitHub/GitLab) o notifica al Líder Técnico con:
*   Pasos para reproducir.
*   Comportamiento esperado vs real.
*   Screenshots si aplica.

## Configuración de Entorno

Consulta la [Guía Técnica](doc/Guia_Tecnica.md) para detalles sobre cómo levantar el entorno local, base de datos y variables de entorno.
