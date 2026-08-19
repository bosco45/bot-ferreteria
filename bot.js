const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// ==========================================
// CONFIGURACIÓN DESDE .env
// ==========================================

const {
    WHATSAPP_TOKEN,
    WHATSAPP_PHONE_ID = '1222698170925154',
    WHATSAPP_API_VERSION = 'v25.0',
    VERIFY_TOKEN = 'trinity3d_bot_2024',
    BAZAARLINK_BASE_URL = 'https://api.bazaarlink.ai/v1',
    BAZAARLINK_MODEL = 'auto:free',
    BAZAARLINK_API_KEY,
    ASESOR_PHONE = process.env.ASESOR_PHONE,
    PORT = 3000
} = process.env;

// ==========================================
// RESPUESTAS LOCALES DE TRINITY 3D
// ==========================================

function obtenerRespuestaLocalBackup(texto) {
    const mensaje = texto.toLowerCase().trim();
    
    if (mensaje.includes('hola') || mensaje.includes('buenas') || mensaje.includes('hey') || mensaje.includes('buenos dias') || mensaje.includes('buenas tardes')) {
        return '¡Hola! 👋 Soy Trinity, el asistente virtual de Trinity 3D.\n\n¿En qué puedo ayudarte hoy?\n\n📌 *Servicios:*\n• Impresión 3D\n• Diseño y modelado\n• Escaneo 3D\n• Prototipado\n\nResponde con el número de la opción que te interese.';
    }
    
    if (mensaje.includes('1') && (mensaje.includes('servicio') || mensaje.includes('impresion') || mensaje.includes('imprimir'))) {
        return '🖨️ *Servicio de Impresión 3D*\n\nOfrecemos:\n• Impresión FDM (PLA, ABS, PETG)\n• Impresión en resina\n• Piezas personalizadas\n• Prototipos rápidos\n\n*Para cotizar necesito:*\n📐 Dimensiones de la pieza\n🎨 Color deseado\n📁 Archivo STL/OBJ (si tienes)\n\n¿Me compartes estos datos?';
    }
    
    if (mensaje.includes('2') && (mensaje.includes('diseño') || mensaje.includes('diseño') || mensaje.includes('modelado'))) {
        return '🎨 *Diseño y Modelado 3D*\n\nServicios:\n• Modelado desde cero\n• Optimización de diseños\n• Conversión de formatos\n• Asesoría técnica\n\nCuéntame qué necesitas diseñar y te ayudo.';
    }
    
    if (mensaje.includes('servicio') || mensaje.includes('servicios')) {
        return '🔧 *Servicios de Trinity 3D*\n\n1️⃣ Impresión 3D personalizada\n2️⃣ Diseño y modelado 3D\n3️⃣ Escaneo 3D\n4️⃣ Prototipado rápido\n5️⃣ Asesoría técnica\n\n*Responde con el número* para más información.';
    }
    
    if (mensaje.includes('precio') || mensaje.includes('costo') || mensaje.includes('cotizacion') || mensaje.includes('cotización') || mensaje.includes('cuanto cuesta')) {
        return '💰 *Cotizaciones*\n\nPara darte un precio preciso necesito:\n\n📐 *Dimensiones* (cm)\n🔧 *Material* (PLA, ABS, PETG, resina)\n🎨 *Color*\n📁 *Archivo STL/OBJ* (si tienes)\n\nPuedes enviarme esta info y te cotizo al instante.';
    }
    
    if (mensaje.includes('material') || mensaje.includes('materiales')) {
        return '🔩 *Materiales disponibles*\n\n• *PLA*: Económico, fácil de imprimir\n• *ABS*: Resistente al calor\n• *PETG*: Resistente y flexible\n• *TPU*: Flexible\n• *Resina*: Alta precisión\n\n¿Cuál te interesa?';
    }
    
    if (mensaje.includes('tiempo') || mensaje.includes('entrega') || mensaje.includes('cuanto tarda') || mensaje.includes('demora')) {
        return '⏱️ *Tiempos de entrega*\n\n• Piezas simples: 24-48 horas\n• Piezas medianas: 3-5 días\n• Proyectos complejos: 5-10 días\n\n*Nota:* El tiempo exacto se confirma al cotizar.';
    }
    
    if (mensaje.includes('contacto') || mensaje.includes('telefono') || mensaje.includes('whatsapp') || mensaje.includes('ubicacion') || mensaje.includes('direccion') || mensaje.includes('donde estan')) {
        return '📞 *Contacto Trinity 3D*\n\n• *WhatsApp:* \n• *Horario:* Lunes a Viernes 9:00 - 18:00\n• *Ubicación:* Colombia\n\n¡Estamos para servirte! 😊';
    }
    
    if (mensaje.includes('ping')) {
        return 'pong ✅';
    }
    
    if (mensaje.includes('gracias')) {
        return '¡Con gusto! 😊 Si necesitas algo más, aquí estoy.';
    }
    
    if (mensaje.includes('adios') || mensaje.includes('chao') || mensaje.includes('hasta luego')) {
        return '¡Hasta pronto! 👋 Gracias por contactar a Trinity 3D.';
    }
    
    return 'No estoy seguro de entender. 🤔\n\nPuedo ayudarte con:\n• *Servicios* - Escribe "servicios"\n• *Cotizaciones* - Escribe "cotización"\n• *Materiales* - Escribe "materiales"\n• *Contacto* - Escribe "contacto"\n\n¿Qué te gustaría saber?';
}


// ==========================================
// IA LOCAL CON OLLAMA
// ==========================================

const conversaciones = new Map();

// Estado comercial de cada prospecto
const prospectos = new Map();

function obtenerProspecto(telefono) {
    const id = telefono || 'prueba-local';

    if (!prospectos.has(id)) {
        prospectos.set(id, {
            etapa: 'descubrimiento',
            sector: null,
            necesidad: null,
            dolor: null,
            impacto: null,
            beneficioEsperado: null,
            solucionTrinity: null,
            objetivo: null,
            materiales: null,
            alcance: null,
            plazo: null,
            presupuesto: null,
            listoParaComercial: false,
            necesitaAsesor: false,
            actualizado: new Date().toISOString()
        });
    }

    return prospectos.get(id);
}

const SYSTEM_PROMPT = `
Eres Trinity, el asistente comercial virtual de Trinity 3D.

IDENTIDAD DE LA EMPRESA

Trinity 3D es una empresa colombiana de innovación tecnológica especializada en:
- Modelado tridimensional de alta calidad.
- Visualización y renderizado 3D.
- Inteligencia artificial aplicada a proyectos digitales.
- Realidad virtual, aumentada y extendida.
- Experiencias inmersivas e interactivas.
- Simulación digital.
- Entornos virtuales.
- Desarrollo de activos y experiencias 3D.

Trinity 3D transforma ideas, planos, conceptos y proyectos en representaciones digitales claras, realistas e interactivas antes de que existan físicamente.

La propuesta de valor consiste en ayudar a empresas y profesionales a:
- Comprender mejor proyectos complejos.
- Presentar ideas a clientes e inversionistas.
- Reducir errores de planificación.
- Mejorar procesos de toma de decisiones.
- Crear experiencias digitales innovadoras.
- Comunicar productos y proyectos de manera visual e impactante.

SECTORES PRINCIPALES

Trinity 3D puede desarrollar soluciones para:
arquitectura, sector inmobiliario, industria, medicina, educación, videojuegos, producción audiovisual y economía creativa.

EJEMPLOS DE SOLUCIONES

Arquitectura:
renders, visualización arquitectónica, recorridos virtuales y presentación de proyectos.

Inmobiliario:
renders fotorrealistas, recorridos virtuales, experiencias interactivas y herramientas para preventa.

Industria:
visualización de maquinaria, procesos industriales, simulación, capacitación y entornos virtuales.

Medicina:
modelos anatómicos y visualizaciones tridimensionales educativas o profesionales.

Educación:
experiencias interactivas, modelos educativos y entornos virtuales.

Videojuegos:
modelos 3D, escenarios, objetos, personajes y experiencias interactivas.

INFORMACIÓN COMERCIAL

Fundadora: Annya Fraysheht Diaz Orozco.
Contacto Trinity 3D: disponible a través de este canal.

Trinity 3D desarrolla proyectos nacionales e internacionales.

No inventes precios, tiempos de entrega, clientes, proyectos realizados, capacidades técnicas ni información que no tengas.

Trinity 3D NO debe presentarse principalmente como una empresa de impresión 3D física.
Su enfoque principal es visualización digital, modelado 3D, inteligencia artificial, simulación y experiencias inmersivas.

OBJETIVO DE LA CONVERSACIÓN

Tu objetivo no es solamente responder preguntas.

Debes comprender al prospecto, identificar su necesidad, perfilar el proyecto y conducir naturalmente la conversación hacia una oportunidad comercial real para Trinity 3D.

EMBUDO COMERCIAL

Trabaja internamente con estas etapas, pero nunca le digas al cliente el nombre de la etapa:

DESCUBRIMIENTO:
Comprende qué quiere lograr el cliente y cuál es su problema.

PERFILADO:
Identifica el sector del cliente, el tipo de proyecto y para qué necesita la solución.

NECESIDAD:
Descubre qué resultado espera obtener.

Puede ser por ejemplo:
renders, modelos 3D, recorrido virtual, experiencia interactiva, simulación, contenido para ventas, capacitación, presentación de proyecto o desarrollo digital.

ALCANCE:
Pregunta qué información o materiales tiene disponibles:
planos, imágenes, referencias, modelos existentes, dimensiones, documentos o concepto inicial.

CALIFICACIÓN:
Cuando ya entiendas la necesidad, identifica de forma natural:
alcance aproximado,
estado actual del proyecto,
fecha o plazo esperado,
y si corresponde, presupuesto aproximado.

No preguntes presupuesto al comenzar la conversación.

RECOMENDACIÓN:
Explica brevemente qué solución de Trinity 3D podría ayudarle y por qué.

CIERRE:
Cuando tengas suficiente información, resume el proyecto en pocas líneas y pregunta:

"¿Quieres que deje esta información lista para que el equipo de Trinity 3D evalúe tu proyecto y prepare una propuesta?"

FORMA DE CONVERSAR

Habla siempre en español salvo que el cliente utilice otro idioma.

Sé profesional, cercano y consultivo.

No parezcas un formulario.

Haz solamente UNA pregunta importante por mensaje.

Usa las respuestas anteriores del cliente y no vuelvas a preguntar información que ya proporcionó.

No bombardees al cliente con menús.

No respondas con textos demasiado largos.

Cada respuesta debe tener normalmente entre 1 y 4 frases.

Haz preguntas concretas que hagan avanzar la oportunidad comercial.

Si el usuario hace una pregunta directa, respóndela primero y después continúa el perfilado de manera natural.

Nunca presiones al cliente.

Nunca inventes información para cerrar una venta.

ESCALAMIENTO A ASESOR HUMANO

Si no conoces con seguridad la respuesta, no inventes.

Si la solicitud requiere una evaluación técnica que no puedes determinar, marca:
"necesitaAsesor": true

Si el cliente pide hablar con una persona, asesor, humano o representante, marca:
"necesitaAsesor": true

Si la solicitud está fuera de la información disponible de Trinity 3D, marca:
"necesitaAsesor": true

Cuando necesite asesor, responde de forma breve:
"Esta solicitud requiere revisión del equipo de Trinity 3D. Voy a dejarla marcada para atención de un asesor."

No sigas haciendo preguntas comerciales después de decidir que necesita asesor.

REGLA DE CONVERSACION Y RECOMENDACION

No asumas que el cliente necesita renders, imagenes, recorridos virtuales u otra solucion especifica solo por mencionar su sector.

No ofrezcas dos o mas servicios para que el cliente escoja al inicio de la conversacion.

Primero entiende que quiere lograr el cliente, para quien es el proyecto y cual es el resultado que espera.

Haz una sola pregunta natural por mensaje.

Solo recomienda renders, modelado 3D, recorridos virtuales, realidad extendida, simulacion, inteligencia artificial u otros servicios de Trinity 3D cuando la conversacion ya indique que son relevantes.

No generes ni prometas entregar imagenes desde el chatbot. Trinity conversa, perfila la necesidad y prepara el proyecto para evaluacion comercial.

Si una solicitud está fuera de las capacidades conocidas de Trinity 3D, explica que debe ser evaluada por el equipo.

Tu meta es transformar una conversación casual en una necesidad bien definida y lista para evaluación comercial.

PROCESO COMERCIAL: DOLOR, IMPACTO, BENEFICIO Y SOLUCION

Tu objetivo principal no es ofrecer servicios inmediatamente.
Tu objetivo es comprender el problema real del cliente y relacionarlo con una solucion de Trinity 3D solamente cuando exista suficiente contexto.

Sigue este razonamiento comercial de forma natural:

DOLOR:
Identifica el problema, dificultad, frustracion, riesgo o necesidad que esta viviendo el cliente.
Guarda esa informacion en "dolor".

IMPACTO:
Comprende que consecuencia esta generando ese problema.
Puede afectar ventas, presentacion, comprension, decisiones, costos, tiempos, capacitacion, comunicacion, inversion, experiencia del usuario u otro aspecto expresado por el cliente.
Guarda solamente consecuencias que el cliente haya dicho o que puedan deducirse directamente de lo que dijo.
No exageres ni inventes problemas.
Guarda esta informacion en "impacto".

BENEFICIO ESPERADO:
Descubre que resultado quiere conseguir realmente el cliente.
Piensa primero en el resultado de negocio o del proyecto, no en una tecnologia.
Ejemplos de resultados pueden ser comprender mejor un proyecto, presentarlo con mayor claridad, facilitar una decision, capacitar personas, simular una situacion, mejorar una experiencia o comunicar una idea compleja.
Guarda esta informacion en "beneficioEsperado".

SOLUCION TRINITY:
Solo despues de comprender el dolor y el resultado esperado, identifica cual capacidad de Trinity 3D podria ayudar.
Guarda esa recomendacion en "solucionTrinity".

REGLAS DE CONVERSACION

No vendas primero.

No asumas una solucion solamente por conocer el sector del cliente.

Si el cliente dice que tiene un proyecto inmobiliario, medico, industrial, educativo, de videojuegos, arquitectura u otro sector, eso NO significa automaticamente que necesita renders, recorridos virtuales o una tecnologia especifica.

No presentes un menu de servicios al inicio.

No preguntes:
"Quieres renders o recorrido virtual?"
si todavia no comprendes el problema.

Primero descubre que quiere lograr el cliente y que dificultad necesita resolver.

Haz solamente UNA pregunta importante por mensaje.

No conviertas la conversacion en un formulario.

Usa la informacion que el cliente ya entrego y no vuelvas a preguntarla.

Reconoce brevemente el problema del cliente antes de hacer la siguiente pregunta cuando sea apropiado.

No repitas constantemente frases como "Entiendo" o "Perfecto".

Usa el mismo lenguaje que utiliza el cliente cuando sea posible.

Cuando identifiques un dolor, no inventes consecuencias adicionales.

Cuando hables de beneficios, explica el resultado que Trinity puede ayudar a conseguir, no solamente las caracteristicas tecnicas de un servicio.

Cuando recomiendes una solucion Trinity, explica brevemente POR QUE esa solucion responde al problema expresado por el cliente.

Ejemplo del razonamiento correcto:

Cliente:
"Los inversionistas no logran entender como quedara nuestro proyecto."

Dolor:
Los inversionistas no comprenden claramente el proyecto antes de construirlo.

Impacto:
Dificultad para comunicar el valor del proyecto y facilitar una decision de inversion.

Beneficio esperado:
Que los inversionistas comprendan claramente el proyecto antes de su construccion.

Solucion Trinity:
Una solucion de visualizacion 3D adecuada al alcance disponible podria permitir comunicar mejor los espacios y el resultado final.

La respuesta al cliente NO debe mostrar estas etiquetas internas.
No escribas "dolor:", "impacto:", "beneficio:" ni "solucion:" en la conversacion.

La conversacion visible debe sentirse natural.

Ejemplo:

Cliente:
"Tengo un proyecto inmobiliario para presentarlo a unos inversionistas."

Respuesta adecuada:
"Claro. Para orientarte bien, primero quisiera entender qué necesitas lograr con esa presentación. ¿Qué es lo principal que quieres que los inversionistas comprendan o valoren del proyecto?"

No respondas inmediatamente ofreciendo renders, imagenes, recorridos virtuales o realidad virtual.

Si el cliente responde:
"Quiero que entiendan como se va a ver terminado."

Una respuesta adecuada seria:
"Entonces el reto principal es que puedan comprender el resultado final antes de que exista fisicamente. ¿Con qué información del proyecto cuentas actualmente?"

Solamente despues de conocer suficiente informacion puedes recomendar una solucion especifica de Trinity.

CALIFICACION COMERCIAL

Antes de marcar "listoParaComercial": true procura conocer, cuando sean relevantes:

- dolor o necesidad real
- beneficio o resultado esperado
- sector o tipo de proyecto
- materiales disponibles
- alcance aproximado
- plazo esperado

El presupuesto puede preguntarse posteriormente y de forma natural.
No preguntes presupuesto al inicio.

"solucionTrinity" debe permanecer en null mientras no exista suficiente informacion para recomendar algo con fundamento.

Si no puedes determinar con seguridad la solucion adecuada, no inventes.
Continua descubriendo la necesidad o marca "necesitaAsesor": true cuando requiera evaluacion humana.

ESTILO DIRECTO Y SIN REDUNDANCIA

Habla como un asesor por WhatsApp, no como un asistente que necesita confirmar cada mensaje.

Evita comenzar respuestas con:
"Entiendo"
"Entiendo que"
"Comprendo"
"Claro"
"Perfecto"
"Excelente"
"De acuerdo"
"Gracias por compartirlo"
"Gracias por la informacion"

No necesitas reconocer verbalmente cada mensaje del cliente.

Ve directamente al punto.

REGLA PRINCIPAL:

Si puedes avanzar la conversacion solamente con una pregunta corta, haz solamente la pregunta.

Ejemplo:

Cliente:
"Los pacientes no entienden lo que va a pasar durante el procedimiento."

EVITA:
"Entiendo que el principal problema es que los pacientes no comprenden lo que sucedera durante el procedimiento. ¿Que parte es la mas dificil de explicarles?"

USA:
"¿Que parte del procedimiento les cuesta mas entender?"

NO REPITAS LO QUE EL CLIENTE ACABA DE DECIR.

Si el cliente ya explico un problema, no lo vuelvas a redactar con otras palabras antes de preguntar.

Cliente:
"Necesito conseguir inversionistas antes de construir."

EVITA:
"Entonces necesitas conseguir inversionistas antes de iniciar la construccion. ¿Que quieres mostrarles?"

USA:
"¿Que quieres que los inversionistas comprendan del proyecto?"

NO REPITAS PREGUNTAS.

Antes de formular una pregunta revisa el historial reciente.

Si esa pregunta ya fue realizada o el cliente ya entrego esa informacion, no vuelvas a preguntarla.

Avanza al siguiente dato necesario del embudo.

No preguntes nuevamente por:
sector,
dolor,
impacto,
beneficio,
objetivo,
materiales,
alcance,
plazo
o presupuesto
si el cliente ya dio esa informacion.

UNA PREGUNTA = UN OBJETIVO.

No hagas preguntas dobles.

EVITA:
"¿Que quieres lograr y para cuando lo necesitas?"

USA primero:
"¿Que quieres lograr?"

Espera la respuesta.

Luego, cuando corresponda:
"¿Para cuando lo necesitas?"

RESPUESTAS MINIMAS

Prioriza una sola frase.

Usa dos frases solamente cuando sea necesario responder una pregunta del cliente antes de continuar.

La respuesta visible ideal tiene entre 40 y 140 caracteres.

Maximo 160 caracteres.

No agregues explicaciones solo para hacer sonar la respuesta mas amable.

La amabilidad debe venir del tono, no de palabras de relleno.

NO PARAFRASEAR AUTOMATICAMENTE

No utilices estructuras como:

"Entonces lo que necesitas es..."
"Por lo que me cuentas..."
"Entiendo que buscas..."
"Comprendo que necesitas..."
"Esto significa que..."

salvo que sea realmente necesario aclarar algo.

Cuando el mensaje del cliente sea claro, continua directamente.

EJEMPLOS DE ESTILO CORRECTO

Cliente:
"Tengo una clinica y los pacientes no entienden algunos procedimientos."

Trinity:
"¿Que parte del procedimiento les cuesta mas entender?"

Cliente:
"No entienden lo que va a pasar durante la intervencion."

Trinity:
"¿Que te gustaria que comprendieran antes de realizarla?"

Cliente:
"Quiero que sepan exactamente que va a pasar."

Trinity:
"¿Con que informacion del procedimiento cuentas actualmente?"

Cliente:
"Tengo un proyecto inmobiliario para inversionistas."

Trinity:
"¿Que quieres que los inversionistas comprendan del proyecto?"

Cliente:
"Quiero que entiendan como se vera terminado."

Trinity:
"¿Con que informacion del proyecto cuentas actualmente?"

El objetivo es una conversacion agil:
pregunta corta,
respuesta del cliente,
siguiente pregunta.

No discurso.
No repeticion.
No relleno.

ESTILO ESTRICTO DE RESPUESTA PARA WHATSAPP

La conversacion debe sentirse como un chat real entre una persona y un asesor comercial.

REGLA PRINCIPAL:

La propiedad "respuesta" del JSON debe contener un mensaje MUY CORTO.

Longitud objetivo:
entre 50 y 180 caracteres cuando sea posible.

Limite maximo:
220 caracteres.

No escribas respuestas largas aunque tengas mucha informacion disponible.

MAXIMO DOS FRASES.

MAXIMO UNA PREGUNTA POR RESPUESTA.

Si puedes responder correctamente con una sola frase y una pregunta corta, hazlo.

No expliques todo lo que sabes sobre Trinity 3D.

No hagas introducciones largas.

No hagas resumenes innecesarios de lo que acaba de decir el cliente.

No escribas listas salvo que el cliente pida especificamente una lista.

No presentes varias opciones de servicios en una misma respuesta.

No uses preguntas con muchas opciones entre parentesis.

Evita frases como:

"Para poder orientarte mejor..."
"Para saber como ayudarte..."
"Con el fin de comprender mejor..."
"Gracias por compartir esta informacion..."

cuando puedan eliminarse sin perder sentido.

No empieces cada mensaje diciendo:
"Entiendo"
"Perfecto"
"Claro"
"Excelente"

Puedes utilizarlas ocasionalmente, pero no como muletilla.

PREGUNTAS NATURALES

Prefiere:

"¿Que es lo mas dificil de explicarles?"

en lugar de:

"Para poder comprender mejor tu necesidad y saber como podemos ayudarte, ¿podrias indicarme cuales son los aspectos que presentan mayores dificultades al momento de explicarlos?"

Prefiere:

"¿Que quieres lograr con esa presentacion?"

en lugar de:

"¿Te gustaria enfocarte en renders fotorrealistas o prefieres una experiencia inmersiva?"

Prefiere:

"¿Que ocurre actualmente cuando intentas mostrarles el proyecto?"

en lugar de asumir una consecuencia.

UNA SOLA IDEA POR MENSAJE

Cada respuesta debe avanzar solamente un paso de la conversacion.

Si necesitas descubrir el dolor:
pregunta por el dolor.

No preguntes tambien por materiales, fecha y presupuesto.

Si necesitas conocer el impacto:
pregunta por el impacto.

Si necesitas conocer el beneficio esperado:
pregunta por el resultado deseado.

Despues espera la respuesta del cliente.

NO REPETIR AL CLIENTE

No repitas literalmente todo lo que el cliente acaba de decir.

Puedes reconocer su situacion brevemente solamente cuando agregue valor.

Cliente:
"Los pacientes no entienden los procedimientos."

Evita:
"Entiendo que los pacientes no entienden los procedimientos y que esto puede generar ansiedad, confusion y preocupacion."

Usa:
"¿Que parte del procedimiento suele ser la mas dificil de explicarles?"

NO INVENTAR

Nunca inventes emociones, problemas, impactos o consecuencias.

Si el cliente no dijo que existe ansiedad, miedo, perdida de dinero, retrasos, confusion o desconfianza, no afirmes que existen.

Pregunta cuando necesites confirmarlo.

NO VENDER DEMASIADO PRONTO

No menciones una solucion de Trinity hasta comprender suficientemente:

- el problema
- el resultado esperado

No ofrezcas automaticamente:
renders
imagenes
recorridos virtuales
realidad virtual
realidad aumentada
modelado 3D
inteligencia artificial
simulacion

solo porque el cliente menciona un sector.

Primero comprende el problema.

Luego comprende el beneficio que busca.

Finalmente relaciona la necesidad con una solucion Trinity cuando exista fundamento.

NO GENERAR IMAGENES

El chatbot no debe prometer generar o entregar imagenes durante la conversacion.

Su funcion es:
comprender la necesidad,
calificar el proyecto,
orientar al cliente
y preparar la informacion para Trinity 3D.

CIERRE

Cuando ya exista informacion suficiente, no continues haciendo preguntas innecesarias.

Resume brevemente el objetivo del proyecto y pregunta si desea que el equipo de Trinity lo evalúe.

Si "necesitaAsesor" es true:
no hagas otra pregunta comercial.

La respuesta debe indicar brevemente que el caso requiere revision del equipo.

RECUERDA:

Mensaje corto.
Una idea.
Maximo dos frases.
Maximo una pregunta.
Maximo 220 caracteres.
Conversacion natural.
Sin discursos.
Sin listas de servicios.
Sin inventar.

FORMATO TECNICO OBLIGATORIO

Tu salida final debe ser UNICAMENTE un JSON valido.

El cliente NO vera el JSON. El sistema mostrara solamente el campo "respuesta".

Usa exactamente esta estructura:

{
  "respuesta": "Mensaje corto y natural para el cliente",
  "estado": {
    "etapa": "descubrimiento",
    "sector": null,
    "necesidad": null,
    "dolor": null,
    "impacto": null,
    "beneficioEsperado": null,
    "solucionTrinity": null,
    "objetivo": null,
    "materiales": null,
    "alcance": null,
    "plazo": null,
    "presupuesto": null,
    "listoParaComercial": false,
    "necesitaAsesor": false
  }
}

Etapas permitidas:
descubrimiento
perfilado
necesidad
alcance
calificacion
recomendacion
cierre

Conserva los datos del estado anterior si el cliente no los modifica.

Nunca inventes datos para completar campos.

Usa null cuando un dato todavia no se conozca.

"respuesta" debe contener solamente lo que leeria normalmente el cliente por WhatsApp.

La respuesta debe ser natural, normalmente de 1 a 3 frases y maximo una pregunta.

Cuando ya tengas suficiente informacion para que el equipo comercial evalúe el proyecto, usa:
"listoParaComercial": true
`;

/*
============================================================
RESPUESTAS DIRECTAS SIN IA
============================================================

Objetivo:

- No gastar cuota de BazaarLink en mensajes simples.
- Responder saludos directamente.
- Responder agradecimientos directamente.
- Responder despedidas directamente.
- Detectar solicitudes de asesor sin depender de la IA.
- Escalar al equipo cuando BazaarLink llegue al limite gratuito.
*/


function limpiarTextoParaReglas(texto) {

    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}


/*
============================================================
CREAR RESUMEN INTERNO PARA EL ASESOR
============================================================
*/

function crearResumenParaAsesor(telefono, ultimoMensaje, motivo) {

    const prospecto = obtenerProspecto(telefono);

    const lineas = [
        'TRINITY 3D - SOLICITUD DE ASESOR',
        '',
        `Cliente: ${telefono}`,
        `Motivo: ${motivo || 'Solicitud de atencion humana'}`,
        '',
        `Ultimo mensaje: ${ultimoMensaje || 'Sin mensaje'}`,
        '',
        `Sector: ${prospecto.sector || 'Sin definir'}`,
        `Necesidad: ${prospecto.necesidad || 'Sin definir'}`,
        `Dolor: ${prospecto.dolor || 'Sin definir'}`,
        `Impacto: ${prospecto.impacto || 'Sin definir'}`,
        `Beneficio esperado: ${prospecto.beneficioEsperado || 'Sin definir'}`,
        `Solucion Trinity: ${prospecto.solucionTrinity || 'Sin definir'}`,
        `Objetivo: ${prospecto.objetivo || 'Sin definir'}`,
        `Materiales: ${prospecto.materiales || 'Sin definir'}`,
        `Alcance: ${prospecto.alcance || 'Sin definir'}`,
        `Plazo: ${prospecto.plazo || 'Sin definir'}`,
        `Presupuesto: ${prospecto.presupuesto || 'Sin definir'}`
    ];

    return lineas.join('\n');
}


/*
============================================================
NOTIFICAR AL ASESOR
============================================================
*/

async function notificarAsesor(
    telefono,
    ultimoMensaje,
    motivo = 'Solicitud de atencion humana'
) {

    const prospecto = obtenerProspecto(telefono);

    prospecto.necesitaAsesor = true;
    prospecto.actualizado = new Date().toISOString();

    /*
    Evitar notificar varias veces el mismo caso
    durante la misma ejecucion del servidor.
    */

    if (prospecto.asesorNotificado === true) {

        console.log(
            `Asesor ya notificado anteriormente para ${telefono}`
        );

        return;
    }


    /*
    Si no existe numero configurado de asesor,
    simplemente dejamos marcado el prospecto.
    */

    if (!ASESOR_PHONE) {

        console.log(
            `ASESOR_PHONE no esta configurado. Prospecto marcado: ${telefono}`
        );

        return;
    }


    /*
    Evitar enviarse una notificacion a si mismo.
    Esto tambien ayuda durante pruebas.
    */

    if (String(ASESOR_PHONE) === String(telefono)) {

        console.log(
            `El cliente ${telefono} coincide con ASESOR_PHONE. No se envia auto-notificacion.`
        );

        return;
    }


    const resumen = crearResumenParaAsesor(
        telefono,
        ultimoMensaje,
        motivo
    );


    try {

        await enviarMensajeWhatsApp(
            ASESOR_PHONE,
            resumen
        );

        prospecto.asesorNotificado = true;

        console.log(
            `Asesor notificado por el prospecto ${telefono}`
        );

    } catch (error) {

        console.error(
            'No fue posible notificar al asesor:',
            error.response?.data || error.message
        );
    }
}


/*
============================================================
DETECTAR SOLICITUD DE PERSONA / ASESOR
============================================================
*/

function clientePideAsesor(texto) {

    const limpio = limpiarTextoParaReglas(texto);

    const expresiones = [

        /\basesor\b/,
        /\basesora\b/,
        /\bhumano\b/,
        /\bpersona real\b/,

        /quiero hablar con una persona/,
        /quiero hablar con alguien/,
        /quiero hablar con un asesor/,
        /quiero hablar con una asesora/,

        /hablar con una persona/,
        /hablar con alguien/,
        /hablar con un asesor/,

        /pasame con una persona/,
        /pasame con alguien/,
        /pasame con un asesor/,
        /pasame con el asesor/,

        /comunicarme con una persona/,
        /comunicarme con un asesor/,

        /quiero hablar con el equipo/,
        /hablar con el equipo/,

        /quiero hablar con el dueno/,
        /hablar con el dueno/
    ];


    return expresiones.some(
        expresion => expresion.test(limpio)
    );
}


/*
============================================================
RESPONDER MENSAJES SIMPLES SIN BAZAARLINK
============================================================
*/

async function procesarMensajeDirecto(telefono, texto) {

    const limpio = limpiarTextoParaReglas(texto);


    /*
    --------------------------------------------------------
    1. SOLICITUD DE ASESOR
    --------------------------------------------------------
    */

    if (clientePideAsesor(texto)) {

        await notificarAsesor(
            telefono,
            texto,
            'El cliente solicito hablar con una persona'
        );

        return 'Voy a pasar tu conversación al equipo de Trinity 3D para revisión.';
    }


    /*
    --------------------------------------------------------
    2. SALUDOS
    --------------------------------------------------------
    */

    const esSaludo =
        /^(hola|holi|buenas|buenos dias|buenas tardes|buenas noches|hey|hello)[\s!.,¿?]*$/.test(
            limpio
        );


    if (esSaludo) {

        return 'Hola, ¿en qué proyecto o idea estás trabajando?';
    }


    /*
    --------------------------------------------------------
    3. AGRADECIMIENTOS
    --------------------------------------------------------
    */

    const esAgradecimiento =
        /^(gracias|muchas gracias|mil gracias|gracias trinity|ok gracias|listo gracias)[\s!.,]*$/.test(
            limpio
        );


    if (esAgradecimiento) {

        return 'Con gusto.';
    }


    /*
    --------------------------------------------------------
    4. CONFIRMACIONES SIMPLES
    --------------------------------------------------------

    No incluimos "si" o "no", porque esas respuestas dependen
    del contexto de la conversacion y deben ser interpretadas.
    */

    const esConfirmacionSimple =
        /^(ok|okay|listo|vale|de acuerdo|entendido)[\s!.,]*$/.test(
            limpio
        );


    if (esConfirmacionSimple) {

        return 'Listo.';
    }


    /*
    --------------------------------------------------------
    5. DESPEDIDAS
    --------------------------------------------------------
    */

    const esDespedida =
        /^(adios|hasta luego|nos vemos|chao|chau|hasta pronto)[\s!.,]*$/.test(
            limpio
        );


    if (esDespedida) {

        return 'Gracias por escribir a Trinity 3D. Hasta pronto.';
    }


    /*
    Si retorna null significa:
    este mensaje SI necesita interpretacion.
    */

    return null;
}


/*
============================================================
MANEJO ESPECIAL DEL ERROR 429
============================================================

Cuando BazaarLink agota la cuota gratuita:

- No mentimos diciendo simplemente que existe una demora.
- Marcamos el prospecto para asesor.
- Intentamos notificar al equipo.
- Damos una respuesta corta al cliente.
*/

async function manejarLimiteIA(telefono, texto) {

    const prospecto = obtenerProspecto(telefono);

    prospecto.necesitaAsesor = true;
    prospecto.actualizado = new Date().toISOString();


    await notificarAsesor(
        telefono,
        texto,
        'Limite gratuito de IA alcanzado durante la conversacion'
    );


    return 'Voy a pasar tu solicitud al equipo de Trinity 3D para que puedan revisarla.';
}

function normalizarRespuestaWhatsApp(texto, maxCaracteres = 160) {

    if (!texto) {
        return '';
    }

    // Convertir siempre a texto
    let salida = String(texto);

    // Quitar encabezados Markdown
    salida = salida.replace(/^\s*#{1,6}\s*/gm, '');

    // Quitar viñetas
    salida = salida.replace(/^\s*[-*•]\s+/gm, '');

    // Quitar negritas Markdown
    salida = salida.replace(/\*\*/g, '');

    // Convertir saltos de linea en espacios
    salida = salida.replace(/\r?\n+/g, ' ');

    // Eliminar espacios duplicados
    salida = salida.replace(/\s+/g, ' ').trim();

    // Eliminar muletillas frecuentes al inicio
    salida = salida.replace(
        /^(entiendo(?: que)?|comprendo(?: que)?|perfecto|claro|excelente|de acuerdo|gracias por compartirlo|gracias por la informacion)[,.!:\s-]*/i,
        ''
    ).trim();

    // Eliminar introducciones redundantes
    salida = salida.replace(
        /^(por lo que me cuentas|entonces lo que necesitas es|esto significa que)[,.!:\s-]*/i,
        ''
    ).trim();

    // Empezar correctamente despues de eliminar una muletilla
    if (salida.length > 0) {
        salida = salida.charAt(0).toUpperCase() + salida.slice(1);
    }

    // Normalizar signos de pregunta repetidos
    salida = salida.replace(/\?{2,}/g, '?');

    // Separar el texto en frases
    const frases =
        salida.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [salida];

    const frasesLimpias = frases
        .map(frase => frase.trim())
        .filter(Boolean);

    // Buscar la primera pregunta
    const indicePregunta = frasesLimpias.findIndex(
        frase => frase.includes('?')
    );

    if (indicePregunta >= 0) {

        const pregunta = frasesLimpias[indicePregunta];

        // Utilizar como maximo una frase previa + una pregunta
        if (indicePregunta > 0) {

            const fraseAnterior =
                frasesLimpias[indicePregunta - 1];

            const combinado =
                `${fraseAnterior} ${pregunta}`.trim();

            if (combinado.length <= maxCaracteres) {
                salida = combinado;
            } else {
                salida = pregunta;
            }

        } else {

            salida = pregunta;
        }

    } else {

        // Si no hay pregunta, permitir maximo dos frases
        salida = frasesLimpias
            .slice(0, 2)
            .join(' ')
            .trim();
    }

    // Si aun es demasiado largo, recortar de manera segura
    if (salida.length > maxCaracteres) {

        const fragmento =
            salida.slice(0, maxCaracteres - 1);

        // Intentar terminar en una palabra completa
        const ultimoEspacio =
            fragmento.lastIndexOf(' ');

        if (ultimoEspacio > 80) {

            salida =
                fragmento
                    .slice(0, ultimoEspacio)
                    .trim() + '…';

        } else {

            salida =
                fragmento.trim() + '…';
        }
    }

    return salida.trim();
}

async function obtenerRespuestaIA(telefono, texto) {

    /*
    ========================================================
    PRIMER FILTRO: RESPONDER SIN IA CUANDO SEA POSIBLE
    ========================================================
    */

    const usuarioDirecto =
        telefono || 'prueba-local';


    const respuestaDirecta =
        await procesarMensajeDirecto(
            usuarioDirecto,
            texto
        );


    if (respuestaDirecta) {

        /*
        Guardar tambien estos mensajes en el historial
        para mantener continuidad.
        */

        if (!conversaciones.has(usuarioDirecto)) {

            conversaciones.set(
                usuarioDirecto,
                []
            );
        }


        const historialDirecto =
            conversaciones.get(usuarioDirecto);


        historialDirecto.push({
            role: 'user',
            content: texto
        });


        const respuestaFinalDirecta =
            normalizarRespuestaWhatsApp(
                respuestaDirecta
            );


        historialDirecto.push({
            role: 'assistant',
            content: respuestaFinalDirecta
        });


        /*
        Limitar memoria reciente.
        */

        if (historialDirecto.length > 10) {

            historialDirecto.splice(
                0,
                historialDirecto.length - 10
            );
        }


        console.log(
            `Respuesta directa sin IA para ${usuarioDirecto}: ${respuestaFinalDirecta}`
        );


        return respuestaFinalDirecta;
    }


    const usuario = telefono || 'prueba-local';
    const prospecto = obtenerProspecto(usuario);

    if (!conversaciones.has(usuario)) {
        conversaciones.set(usuario, []);
    }

    const historial = conversaciones.get(usuario);
    
    // Agregar mensaje del usuario al historial
    historial.push({
        role: 'user',
        content: texto
    });

    // Mantener contexto reciente sin hacer demasiado pesado el prompt
    if (historial.length > 8) {
        historial.splice(0, historial.length - 8);
    }

    try {
        console.log(`Consultando BazaarLink ${BAZAARLINK_MODEL}...`);
        const inicio = Date.now();

        const response = await axios.post(
            `${BAZAARLINK_BASE_URL}/chat/completions`,
            {
                model: BAZAARLINK_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: SYSTEM_PROMPT + '\n\nESTADO COMERCIAL ACTUAL DEL PROSPECTO:\n' + JSON.stringify(prospecto)
                    },
                    ...historial
                ],
                stream: false,
                temperature: 0.3,
                max_tokens: 1600
            },
            {
                headers: {
                    Authorization: `Bearer ${BAZAARLINK_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 300000
            }
        );

        console.log(`Ollama terminó en ${((Date.now() - inicio) / 1000).toFixed(1)} segundos`);

        let contenido = response.data?.choices?.[0]?.message?.content || '';

        // Limpiar posibles bloques de razonamiento
        contenido = contenido
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .trim();

        if (contenido.includes('</think>')) {
            contenido = contenido.split('</think>').pop().trim();
        }

        // Limpiar bloques Markdown si Ollama devuelve ```json
        contenido = contenido
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```$/i, '')
            .trim();

        if (!contenido) {
            throw new Error('BazaarLink devolvio una respuesta vacia');
        }

        let respuesta = contenido;

        try {
            const salida = JSON.parse(contenido);

            if (salida.respuesta) {
                respuesta = String(salida.respuesta).trim();
            }

            if (salida.estado && typeof salida.estado === 'object') {

                const camposPermitidos = [
                    'etapa',
                    'sector',
                    'necesidad',
                    'dolor',
                    'impacto',
                    'beneficioEsperado',
                    'solucionTrinity',
                    'objetivo',
                    'materiales',
                    'alcance',
                    'plazo',
                    'presupuesto',
                    'listoParaComercial',
                    'necesitaAsesor'
                ];

                for (const campo of camposPermitidos) {
                    if (Object.prototype.hasOwnProperty.call(salida.estado, campo)) {
                        prospecto[campo] = salida.estado[campo];
                    }
                }

                prospecto.actualizado = new Date().toISOString();

                prospectos.set(usuario, prospecto);

                console.log(
                    'Estado comercial:',
                    JSON.stringify(prospecto, null, 2)
                );
            }

        } catch (errorJson) {
            console.log(
                'BazaarLink no devolvio JSON valido. Se utilizara la respuesta como texto.'
            );
        }

        // Agregar respuesta del asistente al historial
        // Control final de la respuesta visible para WhatsApp
        respuesta = normalizarRespuestaWhatsApp(respuesta);

        if (!respuesta) {
            throw new Error('La respuesta quedo vacia despues de normalizarla');
        }

        historial.push({
            role: 'assistant',
            content: respuesta
        });

        // Mantener el historial limitado
        if (historial.length > 8) {
            historial.splice(0, historial.length - 8);
        }

        console.log('Respuesta Trinity:', respuesta);

        return respuesta;

    } catch (error) {
        console.error('================================');
        console.error('ERROR REAL DE BAZAARLINK');
        console.error('Código:', error.code || 'sin código');
        console.error('Mensaje:', error.message);

        if (error.response?.data) {
            console.error('Respuesta BazaarLink:', JSON.stringify(error.response.data));
        }

        console.error('================================');

        /*
        BazaarLink puede responder HTTP 429 cuando se agota
        la cuota gratuita diaria.
        */

        if (error.response?.status === 429) {

            console.log(
                'Limite gratuito de BazaarLink alcanzado. Activando escalamiento.'
            );

            return await manejarLimiteIA(
                usuario,
                texto
            );
        }


        /*
        Otros errores distintos de 429.
        */

        return 'En este momento no puedo procesar tu solicitud. Intenta nuevamente en unos minutos.';
    }
}

// ==========================================
// FUNCIÓN PARA ENVIAR WHATSAPP
// ==========================================

async function enviarMensajeWhatsApp(telefono, mensaje) {
    try {
        const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_ID}/messages`;
        
        const response = await axios.post(
            url,
            {
                messaging_product: 'whatsapp',
                to: telefono,
                type: 'text',
                text: {
                    body: mensaje
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Mensaje enviado a:', telefono);
        return response.data;
    } catch (error) {
        console.error('❌ Error enviando WhatsApp:', error.response?.data || error.message);
        throw error;
    }
}

// ==========================================
// WEBHOOK DE WHATSAPP
// ==========================================

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('🔍 Verificando webhook:', { mode, token });
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verificado');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Token incorrecto');
        res.sendStatus(403);
    }
});

app.post('/webhook', async (req, res) => {
    try {
        console.log('📥 Webhook recibido:', JSON.stringify(req.body, null, 2));
        
        if (req.body?.object === 'whatsapp_business_account') {
            const entry = req.body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            
            if (value?.messages) {
                const message = value.messages[0];
                const from = message.from;
                
                if (message.type === 'text') {
                    const texto = message.text.body;
                    console.log(`💬 Mensaje de ${from}: ${texto}`);
                    
                    const respuesta = await obtenerRespuestaIA(from, texto);
                    await enviarMensajeWhatsApp(from, respuesta);
                }
            }
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error en webhook:', error);
        res.sendStatus(500);
    }
});

// ==========================================
// PRUEBA LOCAL
// ==========================================

app.post('/test', async (req, res) => {
    const texto = req.body?.text || '';
    const respuesta = await obtenerRespuestaIA('prueba-local', texto);
    
    res.json({
        ok: true,
        recibido: texto,
        respuesta
    });
});

// ==========================================
// PRUEBA ENVÍO WHATSAPP
// ==========================================

app.post('/send-test', async (req, res) => {
    try {
        const numero = req.body?.to;
        const texto = req.body?.text || 'Prueba Trinity 3D';
        
        if (!numero) {
            return res.status(400).json({
                ok: false,
                error: 'Debes enviar el campo "to"'
            });
        }
        
        const resultado = await enviarMensajeWhatsApp(numero, texto);
        
        res.json({
            ok: true,
            meta: resultado
        });
    } catch (error) {
        console.error('Error en prueba:', error.response?.data || error.message);
        res.status(500).json({
            ok: false,
            error: error.response?.data || error.message
        });
    }
});

// ==========================================
// ESTADO DEL SERVIDOR
// ==========================================

app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        bot: 'Trinity 3D',
        whatsapp: Boolean(WHATSAPP_TOKEN && WHATSAPP_PHONE_ID),
        phone_id: WHATSAPP_PHONE_ID,
        version: WHATSAPP_API_VERSION,
        port: PORT
    });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('🤖 TRINITY 3D BOT ACTIVO');
    console.log('========================================');
    console.log(`📡 Servidor: http://localhost:${PORT}`);
    console.log(`🧪 Prueba local: POST http://localhost:${PORT}/test`);
    console.log(`📱 Webhook: http://localhost:${PORT}/webhook`);
    console.log(`📤 Test WhatsApp: POST http://localhost:${PORT}/send-test`);
    console.log(`📞 Phone ID: ${WHATSAPP_PHONE_ID}`);
    console.log(`🔧 Versión API: ${WHATSAPP_API_VERSION}`);
    console.log('========================================');
    console.log('');
});




















