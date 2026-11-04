# Concilia · Registro del director

Versión independiente para que un director registre y descargue la carga docente de un programa y periodo. No tiene consola administrativa, roles simulados ni conciliación entre programas. Incluye los 53 posgrados transcritos del organigrama, excluyendo entrenamientos médicos avanzados.

## Uso

Abra `index.html` o la versión autocontenida `Concilia-director.html`. Seleccione programa e ingrese responsable y periodo. Pulse Agregar fila, escriba curso o actividad, créditos completos, profesor, porcentaje del curso, número de trabajos de grado, horas semanales de gestión administrativa y de investigación. Las horas se calculan automáticamente.

Gestión e investigación se registran una sola vez por profesor para no duplicarlas entre cursos. Para actividades sin curso use cero créditos y un nombre de actividad. Los campos de profesor y curso son abiertos. Se agrupan mayúsculas, tildes y espacios; abreviaturas, orden distinto y homónimos requieren revisión humana.

Descargar registro CSV produce una tabla de 21 columnas ordenada por profesor y curso, con identificador de registro y fila, responsable, programa, periodo, entradas, desglose y totales. Se usa UTF-8 con BOM, separador de punto y coma y coma decimal para facilitar apertura en Excel en español. El consolidado CSV contiene una fila por profesor. Los CSV contienen valores calculados, no fórmulas editables: para continuar el trabajo use Guardar copia editable y Abrir copia (JSON).

Las filas incompletas se guardan como borradores y se excluyen del consolidado; deben completarse o eliminarse antes de descargar los CSV. Las distribuciones de curso inconsistentes se señalan y se incluyen como observaciones en la descarga. Las alertas sobre 40 horas solo contemplan este registro.

## Reglas

Clase semanal = créditos × porcentaje / 100 × 16 / 20. Preparación/evaluación semanal = clase / 2. Dirección semanal = número de trabajos × 32 / 20. Total exacto semanal = clase + preparación + dirección + gestión administrativa + investigación. Total para nómina = entero inferior por fila. Total semestral = total semanal truncado × 20. La suma de componentes exactos puede superar el total truncado, tal como se definió en el Excel.

## Datos y privacidad

Sin servidor ni cuentas. Las entradas se guardan en localStorage del navegador y se descargan al equipo. No se incluyen datos personales ni registros de nómina en el código, repositorio o despliegue. No hay analítica, bibliotecas remotas ni peticiones de red de la aplicación. Otro usuario del mismo perfil del navegador podría acceder al registro local; use un perfil personal y conserve las copias descargadas según las políticas institucionales. No existe sincronización ni respaldo remoto automático. El identificador estable ayuda a reconocer revisiones del mismo documento, pero no es una garantía de autenticidad ni un registro de auditoría.

## Publicación

Sitio estático sin instalación ni compilación. Publicar el contenido de `dist/` en un servidor de archivos estáticos. El archivo autocontenido también funciona directamente. El repositorio contiene solo código y documentación. Para GitHub Pages, configurar la publicación de la raíz de la rama principal. El repositorio puede mantenerse privado; la disponibilidad de Pages con repositorios privados depende de la cuenta. No se habilita publicación pública automáticamente.
