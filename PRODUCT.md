# Product

## Register

product

## Users

Contadores mexicanos independientes y en despachos contables. Cualquier contador puede crear un **Despacho** (firma/oficina) y convertirse en su administrador. Dentro del despacho, todos los miembros comparten la visibilidad de contribuyentes, XMLs y registros de los demás. El contexto de uso es laboral-profesional: escritorio o laptop, durante horario de trabajo, revisando y procesando facturas de clientes.

## Product Purpose

Herramienta web para procesar CFDIs XML del SAT mexicano: leer archivos XML, extraer y visualizar datos fiscales (emisor, receptor, impuestos, conceptos), exportar a Excel y PDF. En su evolución, añade cuentas de usuario con Google, almacenamiento persistente de contribuyentes por cuenta, sistema de alertas de vencimiento de eFirma, y colaboración en despachos contables multi-usuario. El éxito es que un contador pueda gestionar todos sus contribuyentes desde un solo lugar, con su equipo, sin perder información entre sesiones.

## Brand Personality

Profesional, confiable, limpia. Tono institucional sin frialdad: seria como una herramienta fiscal, pero sin la burocracia visual de los portales gubernamentales. La interfaz se hace invisible para que el contador se concentre en los datos.

## Anti-references

- Portales SAT/IMSS: anticuados, lentos, grises, sin UX pensada.
- Software contable tradicional mexicano (ContPAQi era): denso sin jerarquía, interfaces de los 2000s.
- SaaS genérico americano: gradientes púrpura-azul, glassmorphism decorativo, cards idénticas en grid, hero con métricas gigantes.

## Design Principles

1. **Los datos son el producto**: la UI sirve a la información, no al revés. Jerarquía clara, sin decoración que compita con los números.
2. **Confianza visible**: estados claros (cargando, vacío, error, éxito), feedback inmediato, sin ambigüedad en acciones destructivas.
3. **Familiar por razón**: usar patrones estándar donde el usuario ya los conoce (tablas, formularios, navegación). Solo romper el patrón cuando hay ganancia real.
4. **Colaboración sin fricción**: las funciones de despacho deben sentirse naturales, no como un módulo pegado. Ver el trabajo de un colega no debería requerir pasos extra.
5. **Alertas que actúan, no que gritan**: el sistema de alertas de eFirma informa con claridad y urgencia proporcional, sin alarmar por defecto.

## Accessibility & Inclusion

WCAG AA como objetivo. Contraste mínimo 4.5:1 para texto. Navegación por teclado funcional en todos los flujos críticos (upload, export, gestión de contribuyentes). Respeto por `prefers-reduced-motion`. Sin dependencias de color como único indicador de estado (siempre acompañado de texto o icono).
