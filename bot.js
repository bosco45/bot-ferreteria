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
entre 40 y 140 caracteres cuando sea posible.

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
Maximo 160 caracteres.
Conversacion natural.
Sin discursos.
Sin listas de servicios.
Sin inventar.

RAZONAMIENTO CONVERSACIONAL AMPLIO V4

No actues como formulario.

Antes de responder analiza el mensaje completo y decide que accion aporta mas valor.

ACCIONES POSIBLES

Puedes:

- responder una pregunta
- aportar informacion util
- aclarar una ambiguedad
- profundizar en un objetivo importante
- recomendar una posible solucion de Trinity
- pedir un unico dato relevante
- cerrar sin hacer otra pregunta
- escalar al equipo
- pausar el bot cuando ya existe handoff

NO conviertas automaticamente cada campo vacio en una pregunta.

PREGUNTA SOLO SI LA RESPUESTA PUEDE CAMBIAR:

- la comprension del problema
- la solucion posible
- el alcance
- la viabilidad
- la siguiente decision comercial

RESPONDER PRIMERO

Si el cliente pregunta algo, responde primero.

No fuerces inmediatamente otra pregunta.

Una respuesta puede terminar sin interrogante.

HECHOS VS PREGUNTAS

Una palabra dentro de una pregunta no es un dato confirmado.

Ejemplo:

"¿Necesito tener planos?"

NO significa:

materiales = planos

EXTRACCION MULTIPLE

Un mensaje puede contener sector, objetivo, audiencia, materiales, alcance y plazo simultaneamente.

Extrae todos los hechos confirmados.

No preguntes nuevamente lo que ya sabes.

CORRECCIONES

Si el cliente corrige informacion anterior, actualizala.

No discutas.
No repitas el dato.
No obligues al cliente a responder otra vez.

INFERENCIAS

Distingue entre informacion confirmada e inferida.

No presentes una inferencia incierta como un hecho.

Si una inferencia importante tiene baja confianza, aclara solo cuando sea necesario.

NO INTERROGATORIO

Evita cadenas como:

pregunta
pregunta
pregunta
pregunta

Si ya hiciste varias preguntas, aporta valor, recomienda una direccion o espera informacion del cliente antes de continuar.

IMPACTO

El impacto no es obligatorio.

Preguntalo solamente cuando ayude realmente a definir la necesidad.

PRESUPUESTO

No es obligatorio en el chatbot.

Nunca lo preguntes al inicio.

Si el cliente lo menciona, guardalo.

RECOMENDACIONES

No inventes servicios ni capacidades.

Puedes sugerir solamente capacidades conocidas de Trinity:

- modelado 3D
- visualizacion y renderizado
- inteligencia artificial
- VR
- AR
- XR
- experiencias inmersivas
- simulacion digital
- entornos virtuales
- activos digitales 3D

Una recomendacion debe basarse en el contexto conocido.

Si todavia hay demasiada incertidumbre, pregunta antes de recomendar.

FUERA DE FOCO

La impresion 3D fisica no es el foco principal de Trinity.

No inicies un embudo comercial de impresion fisica.

Si el cliente necesita primero modelado 3D digital, esa parte si puede evaluarse.

ASESOR

Si el cliente solicita una persona, asesor, humano o agente:

- escala inmediatamente
- no sigas calificando
- activa modo de atencion humana

ESTILO WHATSAPP

Respuesta natural y directa.

Ideal:
1 frase.

Maximo:
2 frases.

Maximo una pregunta.

Evita:

"Entiendo"
"Comprendo"
"Perfecto"
"Excelente"
"Claro"
"Por lo que me cuentas"

No parafrasees innecesariamente lo que el cliente acaba de decir.

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

/*
====================================================================
TRINITY 3D - MOTOR CONVERSACIONAL V4
====================================================================

Motor basado en:

mensaje
  ↓
analisis
  ↓
hechos + preguntas + correcciones
  ↓
memoria
  ↓
acciones candidatas
  ↓
puntuacion
  ↓
mejor siguiente accion
  ↓
respuesta

No usa una lista rigida de campos.
*/


/*
====================================================================
UTILIDADES
====================================================================
*/

function datoVacioV4(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {
        return true;
    }


    if (
        typeof valor === 'string' &&
        valor.trim() === ''
    ) {
        return true;
    }


    if (
        Array.isArray(valor) &&
        valor.length === 0
    ) {
        return true;
    }


    return false;
}


function resumirTextoV4(
    texto,
    maximo = 180
) {

    const limpio =
        String(texto || '')
            .replace(/\s+/g, ' ')
            .trim();


    if (
        limpio.length <=
        maximo
    ) {
        return limpio;
    }


    const corte =
        limpio.slice(
            0,
            maximo - 1
        );


    const espacio =
        corte.lastIndexOf(' ');


    return (
        espacio > 40
            ? corte.slice(0, espacio)
            : corte
    ).trim();
}


function textoReglasV4(texto) {

    return limpiarTextoParaReglas(
        String(texto || '')
    );
}


/*
====================================================================
CONTEXTO
====================================================================
*/

function asegurarContextoConversacionalV4(
    prospecto
) {

    if (
        !prospecto.contextoV4 ||
        typeof prospecto.contextoV4 !== 'object'
    ) {

        prospecto.contextoV4 = {

            version:
                4,

            turnos:
                0,

            preguntaPendiente:
                null,

            ultimaPregunta:
                null,

            preguntasRealizadas:
                [],

            accionesRecientes:
                [],

            temasExplorados:
                [],

            hechosConfirmados:
                {},

            inferencias:
                {},

            contradicciones:
                [],

            reintentos:
                {},

            ultimaAccion:
                null,

            ultimoMensajeCliente:
                null,

            ultimaRespuestaTrinity:
                null,

            modoFallback:
                false,

            proximoIntentoIA:
                0,

            modoAsesor:
                false,

            recomendacionEmitida:
                false,

            revisionOfrecida:
                false,

            solucionSugerida:
                null
        };
    }


    const contexto =
        prospecto.contextoV4;


    const listas = [

        'preguntasRealizadas',

        'accionesRecientes',

        'temasExplorados',

        'contradicciones'
    ];


    for (
        const nombre
        of listas
    ) {

        if (
            !Array.isArray(
                contexto[nombre]
            )
        ) {

            contexto[nombre] = [];
        }
    }


    const objetos = [

        'hechosConfirmados',

        'inferencias',

        'reintentos'
    ];


    for (
        const nombre
        of objetos
    ) {

        if (
            !contexto[nombre] ||
            typeof contexto[nombre] !==
                'object'
        ) {

            contexto[nombre] = {};
        }
    }


    const camposAdicionales = [

        'tipoProyecto',

        'tipoNecesidad',

        'audiencia',

        'usoFinal',

        'cantidad',

        'restricciones'
    ];


    for (
        const campo
        of camposAdicionales
    ) {

        if (
            prospecto[campo] ===
            undefined
        ) {

            prospecto[campo] =
                null;
        }
    }


    if (
        prospecto.modoAsesor ===
        undefined
    ) {

        prospecto.modoAsesor =
            false;
    }


    if (
        prospecto.etapa ===
        'handoff'
    ) {

        prospecto.modoAsesor =
            true;

        contexto.modoAsesor =
            true;
    }


    return contexto;
}


/*
====================================================================
HISTORIAL DE ACCIONES
====================================================================
*/

function registrarAccionV4(
    prospecto,
    accion
) {

    const contexto =
        asegurarContextoConversacionalV4(
            prospecto
        );


    contexto.ultimaAccion =
        accion.tipo;


    contexto.accionesRecientes.push(
        accion.tipo
    );


    if (
        contexto.accionesRecientes.length >
        8
    ) {

        contexto.accionesRecientes =
            contexto.accionesRecientes.slice(
                -8
            );
    }
}


function contarPreguntasRecientesV4(
    prospecto
) {

    const contexto =
        asegurarContextoConversacionalV4(
            prospecto
        );


    let cantidad =
        0;


    for (
        let i =
            contexto.accionesRecientes.length - 1;

        i >= 0;

        i--
    ) {

        const accion =
            contexto.accionesRecientes[i];


        if (
            accion.startsWith(
                'PREGUNTAR_'
            ) ||
            accion.startsWith(
                'ACLARAR_'
            )
        ) {

            cantidad++;

        } else {

            break;
        }
    }


    return cantidad;
}


/*
====================================================================
RESET DE PRUEBA
====================================================================
*/

function esComandoResetV4(
    texto
) {

    const limpio =
        textoReglasV4(
            texto
        );


    return /^(reiniciar conversacion|reinicia conversacion|reset conversacion|reset trinity|nueva conversacion)$/.test(
        limpio
    );
}


function reiniciarConversacionV4(
    telefono
) {

    if (
        prospectos instanceof Map
    ) {

        prospectos.delete(
            telefono
        );
    }


    if (
        conversaciones instanceof Map
    ) {

        conversaciones.delete(
            telefono
        );

    } else if (
        conversaciones &&
        typeof conversaciones ===
            'object'
    ) {

        delete conversaciones[
            telefono
        ];
    }
}


/*
====================================================================
ASESOR
====================================================================
*/

function clientePideAsesorV4(
    texto
) {

    const limpio =
        textoReglasV4(
            texto
        );


    if (
        /^(asesor|asesora|humano|persona|agente|vendedor|comercial)$/.test(
            limpio
        )
    ) {

        return true;
    }


    return (
        /\b(quiero|necesito|quisiera|puedo|me gustaria)\s+(?:hablar|comunicarme|contactar|pasar)\s+(?:con\s+)?(?:un\s+|una\s+|el\s+|la\s+)?(?:asesor|asesora|persona|humano|agente|equipo)\b/.test(
            limpio
        ) ||

        /\b(pasame|paseme|comunicame|comuniqueme|contactame)\s+(?:con\s+)?(?:un\s+|una\s+)?(?:asesor|asesora|persona|humano|agente)\b/.test(
            limpio
        ) ||

        /\b(hablar con alguien|persona real|atencion humana|asesor humano)\b/.test(
            limpio
        )
    );
}


function activarModoAsesorV4(
    prospecto
) {

    const contexto =
        asegurarContextoConversacionalV4(
            prospecto
        );


    prospecto.modoAsesor =
        true;


    prospecto.necesitaAsesor =
        true;


    prospecto.etapa =
        'handoff';


    contexto.modoAsesor =
        true;


    contexto.preguntaPendiente =
        null;


    prospecto.actualizado =
        new Date().toISOString();
}


async function escalarAsesorV4(
    telefono,
    texto,
    motivo
) {

    const prospecto =
        obtenerProspecto(
            telefono
        );


    activarModoAsesorV4(
        prospecto
    );


    await notificarAsesor(
        telefono,
        texto,
        motivo
    );
}


/*
====================================================================
SEGMENTACION
====================================================================
*/

function esPreguntaV4(
    texto
) {

    const original =
        String(texto || '')
            .trim();


    const limpio =
        textoReglasV4(
            original
        );


    if (!original) {
        return false;
    }


    if (
        original.includes('?') ||
        original.includes('¿')
    ) {

        return true;
    }


    return (
        /^(que|como|cuando|cuanto|cual|donde|por que|pueden|hacen|ofrecen|tienen|manejan|trabajan|necesito|se puede)\b/.test(
            limpio
        ) ||

        /\b(cuanto cuesta|cuanto vale|que precio|ustedes hacen|ustedes pueden|me puedes decir)\b/.test(
            limpio
        )
    );
}


function separarSegmentosV4(
    texto
) {

    let preparado =
        String(texto || '')
            .replace(/\r/g, ' ')
            .replace(
                /\s+(?:pero|y)\s+(?=(?:¿?\s*)?(?:que|qué|como|cómo|cuando|cuándo|cuanto|cuánto|cual|cuál|donde|dónde|por que|por qué|pueden|hacen|ofrecen|tienen|manejan|trabajan|se puede)\b)/gi,
                '. '
            );


    const partes =
        preparado.match(
            /[^.!?\n]+[.!?]?/g
        ) || [
            preparado
        ];


    return partes
        .map(
            parte =>
                parte.trim()
        )
        .filter(Boolean)
        .map(
            parte => ({

                texto:
                    parte,

                esPregunta:
                    esPreguntaV4(
                        parte
                    )
            })
        );
}


/*
====================================================================
PREGUNTA DIRECTA
====================================================================
*/

function analizarPreguntaDirectaV4(
    texto
) {

    const preguntas =
        separarSegmentosV4(
            texto
        )
            .filter(
                segmento =>
                    segmento.esPregunta
            );


    if (
        preguntas.length ===
        0
    ) {

        return {

            existe:
                false,

            tipo:
                null,

            texto:
                null
        };
    }


    const pregunta =
        preguntas
            .map(
                segmento =>
                    segmento.texto
            )
            .join(' ');


    const limpio =
        textoReglasV4(
            pregunta
        );


    if (
        /\b(cuanto cuesta|cuanto vale|precio|costo|valor|cotizacion)\b/.test(
            limpio
        )
    ) {

        return {

            existe:
                true,

            tipo:
                'precio',

            texto:
                pregunta
        };
    }


    if (
        /\b(cuanto tarda|cuanto demora|cuanto tiempo|tiempo de entrega|fecha de entrega|cuando estaria)\b/.test(
            limpio
        )
    ) {

        return {

            existe:
                true,

            tipo:
                'tiempo',

            texto:
                pregunta
        };
    }


    if (
        /\b(que hacen|que servicios|servicios ofrecen|que ofrecen|a que se dedican)\b/.test(
            limpio
        )
    ) {

        return {

            existe:
                true,

            tipo:
                'servicios',

            texto:
                pregunta
        };
    }


    if (
        /\b(pueden|hacen|ofrecen|manejan|trabajan con|se puede)\b/.test(
            limpio
        )
    ) {

        return {

            existe:
                true,

            tipo:
                'capacidad',

            texto:
                pregunta
        };
    }


    if (
        /\b(necesito|se necesita|hace falta|requisito|requisitos)\b/.test(
            limpio
        )
    ) {

        return {

            existe:
                true,

            tipo:
                'requisitos',

            texto:
                pregunta
        };
    }


    return {

        existe:
            true,

        tipo:
            'otra',

        texto:
            pregunta
    };
}


/*
====================================================================
FUERA DE FOCO
====================================================================
*/

function detectarSolicitudFueraDeFocoV4(
    texto
) {

    const limpio =
        textoReglasV4(
            texto
        );


    const impresionFisica =

        /\b(imprimir|impresion|impresora|fabricar|fabricacion)\b[^.]{0,40}\b3d\b/.test(
            limpio
        ) ||

        /\b3d\b[^.]{0,40}\b(imprimir|impresion|impresora|fabricar|fabricacion)\b/.test(
            limpio
        );


    if (!impresionFisica) {

        return {

            fueraDeFoco:
                false,

            tipo:
                null,

            componenteDigital:
                false
        };
    }


    const componenteDigital =
        /\b(modelo 3d|modelado 3d|crear el modelo|hacer el modelo|archivo 3d|asset 3d)\b/.test(
            limpio
        );


    return {

        fueraDeFoco:
            !componenteDigital,

        tipo:
            'impresion_3d_fisica',

        componenteDigital
    };
}


/*
====================================================================
DETECTAR SECTOR POR PUNTUACION
====================================================================
*/

function puntuarPatronesV4(
    texto,
    reglas
) {

    let puntos =
        0;


    for (
        const regla
        of reglas
    ) {

        if (
            regla.patron.test(
                texto
            )
        ) {

            puntos +=
                regla.peso;
        }
    }


    return puntos;
}


function detectarSectorV4(
    texto
) {

    const limpio =
        textoReglasV4(
            texto
        );


    if (!limpio) {
        return null;
    }


    const sectores = {

        salud: [

            {
                patron:
                    /\b(clinica|hospital|paciente|pacientes|medico|medica|medicina|odontologia|cirugia|salud|tratamiento)\b/,

                peso:
                    5
            },

            {
                patron:
                    /\b(procedimiento)\b/,

                peso:
                    1
            }
        ],


        industria: [

            {
                patron:
                    /\b(maquina|maquinaria|industria|industrial|fabrica|manufactura|planta|ensamble)\b/,

                peso:
                    5
            },

            {
                patron:
                    /\b(mantenimiento|operacion|linea de produccion|proceso industrial)\b/,

                peso:
                    4
            },

            {
                patron:
                    /\b(procedimiento|proceso)\b/,

                peso:
                    1
            }
        ],


        inmobiliario: [

            {
                patron:
                    /\b(inmobiliaria|inmobiliario|constructora|apartamentos|venta sobre planos|proyecto inmobiliario)\b/,

                peso:
                    5
            },

            {
                patron:
                    /\b(inversionistas|compradores|sala de ventas)\b/,

                peso:
                    2
            }
        ],


        arquitectura: [

            {
                patron:
                    /\b(arquitectura|arquitectonico|arquitectonica|fachada|interiorismo|urbanismo)\b/,

                peso:
                    5
            },

            {
                patron:
                    /\b(edificio|vivienda|casa|planos)\b/,

                peso:
                    2
            }
        ],


        educacion: [

            {
                patron:
                    /\b(educacion|educativo|colegio|universidad|estudiante|estudiantes|curso|capacitacion|aprendizaje)\b/,

                peso:
                    5
            }
        ],


        videojuegos: [

            {
                patron:
                    /\b(videojuego|videojuegos|gaming|unreal|unity|uefn|game)\b/,

                peso:
                    5
            }
        ],


        producto: [

            {
                patron:
                    /\b(producto|productos|catalogo|packaging|empaque|mueble|mobiliario|prototipo)\b/,

                peso:
                    5
            }
        ],


        publicidad: [

            {
                patron:
                    /\b(publicidad|marketing|campana|marca|redes sociales|promocion)\b/,

                peso:
                    5
            }
        ],


        tecnologia: [

            {
                patron:
                    /\b(software|aplicacion|app|plataforma|sistema|automatizacion|inteligencia artificial|chatbot)\b/,

                peso:
                    5
            }
        ]
    };


    let mejor =
        null;


    let mejorPuntaje =
        0;


    let segundoPuntaje =
        0;


    for (
        const [
            sector,
            reglas
        ]
        of Object.entries(
            sectores
        )
    ) {

        const puntaje =
            puntuarPatronesV4(
                limpio,
                reglas
            );


        if (
            puntaje >
            mejorPuntaje
        ) {

            segundoPuntaje =
                mejorPuntaje;


            mejorPuntaje =
                puntaje;


            mejor =
                sector;

        } else if (
            puntaje >
            segundoPuntaje
        ) {

            segundoPuntaje =
                puntaje;
        }
    }


    if (
        mejorPuntaje <
        2
    ) {

        return null;
    }


    let confianza =
        0.65 +
        Math.min(
            0.3,
            mejorPuntaje * 0.04
        );


    if (
        segundoPuntaje > 0 &&
        mejorPuntaje -
            segundoPuntaje <=
            1
    ) {

        confianza -=
            0.2;
    }


    return {

        valor:
            mejor,

        confianza:
            Math.max(
                0.45,
                Math.min(
                    0.98,
                    confianza
                )
            )
    };
}


/*
====================================================================
TIPO DE NECESIDAD
====================================================================
*/

function detectarTipoNecesidadV4(
    texto
) {

    const limpio =
        textoReglasV4(
            texto
        );


    const reglas = [

        {
            valor:
                'inmersivo',

            patron:
                /\b(realidad virtual|realidad aumentada|\bvr\b|\bar\b|\bxr\b|recorrido virtual|inmersivo|inmersiva|recorrer virtualmente)\b/,

            confianza:
                0.95
        },

        {
            valor:
                'inteligencia_artificial',

            patron:
                /\b(inteligencia artificial|\bia\b|chatbot|asistente virtual|automatizacion con ia)\b/,

            confianza:
                0.94
        },

        {
            valor:
                'simulacion',

            patron:
                /\b(simular|simulacion|entrenamiento virtual|funcionamiento|operacion)\b/,

            confianza:
                0.86
        },

        {
            valor:
                'presentacion',

            patron:
                /\b(presentar|presentacion|inversionista|inversionistas|mostrar a clientes|vender proyecto|convencer)\b/,

            confianza:
                0.86
        },

        {
            valor:
                'visualizacion',

            patron:
                /\b(visualizar|render|renders|renderizado|modelo 3d|modelado 3d|ver como queda|ver como quedaria)\b/,

            confianza:
                0.84
        },

        {
            valor:
                'explicacion',

            patron:
                /\b(explicar|comprender|entender|comunicar|ensenar|mostrar como funciona)\b/,

            confianza:
                0.8
        }
    ];


    for (
        const regla
        of reglas
    ) {

        if (
            regla.patron.test(
                limpio
            )
        ) {

            return {

                valor:
                    regla.valor,

                confianza:
                    regla.confianza
            };
        }
    }


    return null;
}


/*
====================================================================
AUDIENCIA
====================================================================
*/

function detectarAudienciaV4(
    texto
) {

    const limpio =
        textoReglasV4(
            texto
        );


    const reglas = [

        [
            'pacientes',
            /\bpacientes?\b/
        ],

        [
            'inversionistas',
            /\binversionistas?\b/
        ],

        [
            'clientes',
            /\bclientes?\b/
        ],

        [
            'compradores',
            /\bcompradores?\b/
        ],

        [
            'estudiantes',
            /\bestudiantes?\b/
        ],

        [
            'personal medico',
            /\b(personal medico|doctores|medicos)\b/
        ],

        [
            'operadores',
            /\boperadores?\b/
        ],

        [
            'equipo interno',
            /\b(equipo interno|empleados|personal interno)\b/
        ],

        [
            'usuarios',
            /\busuarios?\b/
        ]
    ];


    for (
        const [
            valor,
            patron
        ]
        of reglas
    ) {

        if (
            patron.test(
                limpio
            )
        ) {

            return {

                valor,

                confianza:
                    0.92
            };
        }
    }


    return null;
}


/*
====================================================================
MATERIALES
====================================================================
*/

function detectarMaterialesV4(
    texto,
    contextoRespuesta = false
) {

    let limpio =
        textoReglasV4(
            texto
        );


    const posesion =
        /\b(ya tengo|ya tenemos|tengo|tenemos|cuento con|contamos con|dispongo de|disponemos de|me entregaron|nos entregaron|me enviaron|nos enviaron)\b/.test(
            limpio
        );


    const sinMaterial =
        /\b(no tengo nada|no tenemos nada|solo tengo la idea|solo tenemos la idea|desde cero|no tengo material|no tenemos material)\b/.test(
            limpio
        );


    if (
        !posesion &&
        !sinMaterial &&
        !contextoRespuesta
    ) {

        return null;
    }


    if (sinMaterial) {

        return {

            valor:
                'sin material disponible',

            confianza:
                0.96
        };
    }


    const reglas = [

        [
            'planos',
            /\bplanos?\b/
        ],

        [
            'renders',
            /\brenders?\b/
        ],

        [
            'imagenes',
            /\bimagenes?\b/
        ],

        [
            'fotografias',
            /\b(fotos|fotografias?)\b/
        ],

        [
            'videos',
            /\bvideos?\b/
        ],

        [
            'modelo 3D',
            /\b(modelo 3d|modelos 3d)\b/
        ],

        [
            'archivos CAD',
            /\b(cad|dwg|dxf)\b/
        ],

        [
            'documentacion',
            /\b(documentacion|documentos|manuales|guias)\b/
        ],

        [
            'bocetos',
            /\b(bocetos?|sketch)\b/
        ],

        [
            'referencias',
            /\breferencias?\b/
        ]
    ];


    const encontrados =
        [];


    for (
        const [
            valor,
            patron
        ]
        of reglas
    ) {

        if (
            patron.test(
                limpio
            )
        ) {

            encontrados.push(
                valor
            );
        }
    }


    if (
        encontrados.length ===
        0
    ) {

        return null;
    }


    return {

        valor:
            encontrados.join(', '),

        confianza:
            posesion
                ? 0.96
                : 0.82
    };
}


/*
====================================================================
PLAZO
====================================================================
*/

function detectarPlazoV4(
    texto
) {

    const limpio =
        textoReglasV4(
            texto
        );


    const numero =
        '(?:\\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|quince|veinte|treinta)';


    const patrones = [

        new RegExp(
            `\\b(?:en|dentro de)\\s+${numero}\\s+(?:dias?|semanas?|meses?)\\b`
        ),

        /\b(?:esta|la proxima|proxima)\s+semana\b/,

        /\b(?:este|el proximo|proximo)\s+mes\b/,

        /\bpara\s+(?:manana|hoy|esta semana|la proxima semana|el proximo mes)\b/,

        /\bfin de mes\b/,

        /\bfinales de [a-z]+\b/
    ];


    for (
        const patron
        of patrones
    ) {

        const match =
            limpio.match(
                patron
            );


        if (match) {

            return {

                valor:
                    match[0],

                confianza:
                    0.94
            };
        }
    }


    return null;
}


/*
====================================================================
PRESUPUESTO
====================================================================
*/

function detectarPresupuestoV4(
    texto
) {

    const limpio =
        textoReglasV4(
            texto
        );


    const monto =
        limpio.match(
            /\b\d+(?:[.,]\d+)?\s*(?:mil|millones?|cop|usd|pesos?|dolares?)\b/
        );


    if (monto) {

        return {

            valor:
                monto[0],

            confianza:
                0.96
        };
    }


    if (
        /\b(mi presupuesto es|tenemos un presupuesto|podemos invertir|rango de inversion)\b/.test(
            limpio
        )
    ) {

        return {

            valor:
                resumirTextoV4(
                    texto,
                    120
                ),

            confianza:
                0.85
        };
    }


    return null;
}


/*
====================================================================
USO FINAL
====================================================================
*/

function detectarUsoFinalV4(
    texto
) {

    const limpio =
        textoReglasV4(
            texto
        );


    const patrones = [

        /\bpara vender(?:lo|la|los|las)?\b[^.?!]*/,

        /\bpara presentar(?:lo|la|los|las)?\b[^.?!]*/,

        /\bpara mostrar(?:lo|la|los|las)?\b[^.?!]*/,

        /\bpara capacitar\b[^.?!]*/,

        /\bpara entrenar\b[^.?!]*/,

        /\bpara explicar\b[^.?!]*/,

        /\bpara promocionar\b[^.?!]*/,

        /\bpara inversionistas\b[^.?!]*/
    ];


    for (
        const patron
        of patrones
    ) {

        const match =
            limpio.match(
                patron
            );


        if (match) {

            return {

                valor:
                    resumirTextoV4(
                        match[0],
                        130
                    ),

                confianza:
                    0.88
            };
        }
    }


    return null;
}


/*
====================================================================
ALCANCE EXPLICITO
====================================================================
*/

function detectarAlcanceV4(
    texto,
    contextoRespuesta = false
) {

    const limpio =
        textoReglasV4(
            texto
        );


    const explicito =
        limpio.match(
            /\b(?:solo necesito|solo queremos|primera etapa|incluir|incluya|parte principal|inicialmente)\b[^.?!]*/
        );


    if (explicito) {

        return {

            valor:
                resumirTextoV4(
                    explicito[0],
                    150
                ),

            confianza:
                0.88
        };
    }


    if (
        contextoRespuesta
    ) {

        const palabras =
            limpio
                .split(/\s+/)
                .filter(Boolean);


        if (
            palabras.length >= 1 &&
            palabras.length <= 12 &&
            !esPreguntaV4(
                texto
            )
        ) {

            return {

                valor:
                    resumirTextoV4(
                        texto,
                        120
                    ),

                confianza:
                    0.74
            };
        }
    }


    return null;
}


/*
====================================================================
OBJETIVO / DOLOR / BENEFICIO
====================================================================
*/

function detectarObjetivoV4(
    texto
) {

    const limpio =
        textoReglasV4(
            texto
        );


    if (
        /\b(necesito|necesitamos|quiero|queremos|busco|buscamos|me gustaria)\b/.test(
            limpio
        )
    ) {

        return {

            valor:
                resumirTextoV4(
                    texto,
                    170
                ),

            confianza:
                0.86
        };
    }


    return null;
}


function detectarDolorV4(
    texto
) {

    const limpio =
        textoReglasV4(
            texto
        );


    if (
        /\b(problema|dificil|dificultad|cuesta|no entienden|no entiende|no podemos|no puedo|no logro|no logran|falla|confunde|complicado)\b/.test(
            limpio
        )
    ) {

        return {

            valor:
                resumirTextoV4(
                    texto,
                    160
                ),

            confianza:
                0.86
        };
    }


    return null;
}


function detectarBeneficioV4(
    texto
) {

    const limpio =
        textoReglasV4(
            texto
        );


    if (
        /\b(quiero que|queremos que|me gustaria que|busco que|necesito que)\b/.test(
            limpio
        )
    ) {

        return {

            valor:
                resumirTextoV4(
                    texto,
                    160
                ),

            confianza:
                0.84
        };
    }


    return null;
}


/*
====================================================================
CORRECCION
====================================================================
*/

function esCorreccionV4(
    texto
) {

    const limpio =
        textoReglasV4(
            texto
        );


    return /\b(te dije|ya te dije|como te dije|en realidad|corrijo|correccion|mejor dicho|quise decir|no es|no, es)\b/.test(
        limpio
    );
}


/*
====================================================================
EXTRAER HECHOS
====================================================================
*/

function extraerHechosMensajeV4(
    texto,
    prospecto
) {

    const contexto =
        asegurarContextoConversacionalV4(
            prospecto
        );


    const segmentos =
        separarSegmentosV4(
            texto
        );


    const afirmaciones =
        segmentos
            .filter(
                segmento =>
                    !segmento.esPregunta
            );


    const textoAfirmativo =
        afirmaciones
            .map(
                segmento =>
                    segmento.texto
            )
            .join('. ')
            .trim();


    const hechos =
        {};


    if (!textoAfirmativo) {

        return hechos;
    }


    const sector =
        detectarSectorV4(
            textoAfirmativo
        );


    if (sector) {
        hechos.sector =
            sector;
    }


    const tipo =
        detectarTipoNecesidadV4(
            textoAfirmativo
        );


    if (tipo) {
        hechos.tipoNecesidad =
            tipo;
    }


    const audiencia =
        detectarAudienciaV4(
            textoAfirmativo
        );


    if (audiencia) {
        hechos.audiencia =
            audiencia;
    }


    const materiales =
        detectarMaterialesV4(
            textoAfirmativo,
            contexto.preguntaPendiente ===
                'materiales'
        );


    if (materiales) {
        hechos.materiales =
            materiales;
    }


    const plazo =
        detectarPlazoV4(
            textoAfirmativo
        );


    if (plazo) {
        hechos.plazo =
            plazo;
    }


    const presupuesto =
        detectarPresupuestoV4(
            textoAfirmativo
        );


    if (presupuesto) {
        hechos.presupuesto =
            presupuesto;
    }


    const usoFinal =
        detectarUsoFinalV4(
            textoAfirmativo
        );


    if (usoFinal) {
        hechos.usoFinal =
            usoFinal;
    }


    const alcance =
        detectarAlcanceV4(
            textoAfirmativo,
            contexto.preguntaPendiente ===
                'alcance'
        );


    if (alcance) {
        hechos.alcance =
            alcance;
    }


    for (
        const segmento
        of afirmaciones
    ) {

        const objetivo =
            detectarObjetivoV4(
                segmento.texto
            );


        if (objetivo) {
            hechos.objetivo =
                objetivo;
        }


        const dolor =
            detectarDolorV4(
                segmento.texto
            );


        if (dolor) {
            hechos.dolor =
                dolor;
        }


        const beneficio =
            detectarBeneficioV4(
                segmento.texto
            );


        if (beneficio) {
            hechos.beneficioEsperado =
                beneficio;
        }
    }


    if (
        !hechos.objetivo &&
        textoAfirmativo.length >= 18 &&
        !/^(si|no|ok|okay|listo|vale|bien)$/i.test(
            textoAfirmativo.trim()
        )
    ) {

        hechos.necesidad = {

            valor:
                resumirTextoV4(
                    textoAfirmativo,
                    180
                ),

            confianza:
                0.68
        };
    }


    return hechos;
}


/*
====================================================================
ANALIZADOR CENTRAL
====================================================================
*/

function analizarMensajeClienteV4(
    texto,
    prospecto
) {

    const pregunta =
        analizarPreguntaDirectaV4(
            texto
        );


    const fueraFoco =
        detectarSolicitudFueraDeFocoV4(
            texto
        );


    const hechos =
        extraerHechosMensajeV4(
            texto,
            prospecto
        );


    const limpio =
        textoReglasV4(
            texto
        );


    return {

        textoOriginal:
            String(texto || '')
                .trim(),

        pideAsesor:
            clientePideAsesorV4(
                texto
            ),

        reset:
            esComandoResetV4(
                texto
            ),

        saludo:
            /^(hola|holi|buenas|buenos dias|buenas tardes|buenas noches|hey|hello)[\s!.,¿?]*$/.test(
                limpio
            ),

        agradecimiento:
            /^(gracias|muchas gracias|mil gracias|gracias trinity)[\s!.,]*$/.test(
                limpio
            ),

        despedida:
            /^(adios|hasta luego|nos vemos|chao|chau|hasta pronto)[\s!.,]*$/.test(
                limpio
            ),

        confirmacion:
            /^(si|dale|claro|por favor|de acuerdo|hagamoslo|okey)$/.test(
                limpio
            ),

        negacion:
            /^(no|todavia no|aun no|prefiero no|no gracias)$/.test(
                limpio
            ),

        confirmacionVacia:
            /^(ok|okay|listo|vale|entendido|bien)$/.test(
                limpio
            ),

        correccion:
            esCorreccionV4(
                texto
            ),

        pregunta,

        fueraFoco,

        hechos
    };
}


/*
====================================================================
ACTUALIZAR PROSPECTO CON CONFIANZA
====================================================================
*/

function actualizarProspectoV4(
    prospecto,
    analisis
) {

    const contexto =
        asegurarContextoConversacionalV4(
            prospecto
        );


    for (
        const [
            campo,
            dato
        ]
        of Object.entries(
            analisis.hechos ||
            {}
        )
    ) {

        if (
            !dato ||
            dato.valor ===
                undefined ||
            dato.valor ===
                null
        ) {

            continue;
        }


        const valor =
            resumirTextoV4(
                dato.valor,
                200
            );


        const confianza =
            Number(
                dato.confianza ||
                0
            );


        if (
            confianza <
            0.65
        ) {

            contexto.inferencias[
                campo
            ] = {

                valor,

                confianza
            };


            continue;
        }


        const anterior =
            prospecto[
                campo
            ];


        if (
            !datoVacioV4(
                anterior
            ) &&
            String(anterior)
                .toLowerCase() !==
            String(valor)
                .toLowerCase()
        ) {

            if (
                analisis.correccion
            ) {

                prospecto[
                    campo
                ] =
                    valor;

            } else {

                contexto.contradicciones.push({

                    campo,

                    anterior:

                        String(
                            anterior
                        ),

                    nuevo:
                        valor,

                    fecha:
                        new Date()
                            .toISOString()
                });


                continue;
            }

        } else if (
            datoVacioV4(
                anterior
            )
        ) {

            prospecto[
                campo
            ] =
                valor;
        }


        contexto.hechosConfirmados[
            campo
        ] = {

            valor:
                prospecto[
                    campo
                ],

            confianza,

            actualizado:
                new Date()
                    .toISOString()
        };
    }


    prospecto.actualizado =
        new Date()
            .toISOString();
}


/*
====================================================================
VALIDAR RESPUESTA SEGUN EL CAMPO
====================================================================
*/

function validarRespuestaCampoV4(
    campo,
    texto,
    prospecto,
    analisis
) {

    if (
        !campo ||
        analisis.pregunta.existe ||
        analisis.confirmacionVacia
    ) {

        return null;
    }


    if (
        campo ===
        'sector'
    ) {

        return detectarSectorV4(
            texto
        );
    }


    if (
        campo ===
        'materiales'
    ) {

        return detectarMaterialesV4(
            texto,
            true
        );
    }


    if (
        campo ===
        'plazo'
    ) {

        return detectarPlazoV4(
            texto
        );
    }


    if (
        campo ===
        'presupuesto'
    ) {

        return detectarPresupuestoV4(
            texto
        );
    }


    if (
        campo ===
        'audiencia'
    ) {

        return detectarAudienciaV4(
            texto
        );
    }


    if (
        campo ===
        'usoFinal'
    ) {

        const uso =
            detectarUsoFinalV4(
                texto
            );


        if (uso) {
            return uso;
        }
    }


    if (
        campo ===
        'alcance'
    ) {

        return detectarAlcanceV4(
            texto,
            true
        );
    }


    const limpio =
        textoReglasV4(
            texto
        );


    const palabras =
        limpio
            .split(/\s+/)
            .filter(Boolean);


    if (
        palabras.length <
        2
    ) {

        return null;
    }


    if (
        campo ===
        'objetivo'
    ) {

        return {

            valor:
                resumirTextoV4(
                    texto,
                    170
                ),

            confianza:
                0.74
        };
    }


    if (
        campo ===
        'dolor'
    ) {

        return {

            valor:
                resumirTextoV4(
                    texto,
                    170
                ),

            confianza:
                0.72
        };
    }


    if (
        campo ===
        'beneficioEsperado'
    ) {

        return {

            valor:
                resumirTextoV4(
                    texto,
                    170
                ),

            confianza:
                0.72
        };
    }


    return null;
}


/*
====================================================================
PREGUNTA PENDIENTE
====================================================================
*/

function resolverPreguntaPendienteV4(
    prospecto,
    texto,
    analisis
) {

    const contexto =
        asegurarContextoConversacionalV4(
            prospecto
        );


    const campo =
        contexto.preguntaPendiente;


    if (!campo) {

        return {

            accion:
                null
        };
    }


    if (
        campo ===
        'confirmarRevision'
    ) {

        if (
            analisis.confirmacion
        ) {

            contexto.preguntaPendiente =
                null;


            return {

                accion:
                    'ESCALAR'
            };
        }


        if (
            analisis.negacion
        ) {

            contexto.preguntaPendiente =
                null;


            contexto.revisionOfrecida =
                false;


            return {

                accion:
                    'NO_ESCALAR'
            };
        }


        if (
            analisis.pregunta.existe
        ) {

            return {

                accion:
                    'INTERRUPCION'
            };
        }


        return {

            accion:
                null
        };
    }


    if (
        analisis.pregunta.existe
    ) {

        return {

            accion:
                'INTERRUPCION'
        };
    }


    const validado =
        validarRespuestaCampoV4(

            campo,

            texto,

            prospecto,

            analisis
        );


    if (validado) {

        if (
            datoVacioV4(
                prospecto[
                    campo
                ]
            )
        ) {

            prospecto[
                campo
            ] =
                validado.valor;
        }


        contexto.hechosConfirmados[
            campo
        ] = {

            valor:
                prospecto[
                    campo
                ],

            confianza:
                validado.confianza,

            actualizado:
                new Date()
                    .toISOString()
        };


        contexto.preguntaPendiente =
            null;


        return {

            accion:
                'RESPUESTA_VALIDA',

            campo
        };
    }


    if (
        analisis.confirmacionVacia
    ) {

        contexto.reintentos[
            campo
        ] =
            Number(
                contexto.reintentos[
                    campo
                ] ||
                0
            ) + 1;


        return {

            accion:
                'RESPUESTA_VACIA',

            campo
        };
    }


    /*
    La respuesta no corresponde claramente al campo.
    NO se guarda a la fuerza.
    */

    contexto.reintentos[
        campo
    ] =
        Number(
            contexto.reintentos[
                campo
            ] ||
            0
        ) + 1;


    if (
        contexto.reintentos[
            campo
        ] >= 1
    ) {

        contexto.preguntaPendiente =
            null;
    }


    return {

        accion:
            'RESPUESTA_NO_CORRESPONDE',

        campo
    };
}


/*
====================================================================
CAPACIDADES TRINITY
====================================================================
*/

function detectarCapacidadConocidaV4(
    texto
) {

    const limpio =
        textoReglasV4(
            texto
        );


    const capacidades = [

        [
            'modelado 3D',
            /\b(modelado 3d|modelo 3d|modelos 3d)\b/
        ],

        [
            'visualización y renderizado',
            /\b(render|renders|renderizado|visualizacion 3d|visualizacion digital)\b/
        ],

        [
            'experiencias de realidad virtual',
            /\b(realidad virtual|\bvr\b|recorrido virtual|entorno virtual)\b/
        ],

        [
            'realidad aumentada',
            /\b(realidad aumentada|\bar\b)\b/
        ],

        [
            'experiencias XR',
            /\b(xr|realidad extendida)\b/
        ],

        [
            'simulación digital',
            /\b(simulacion|simular)\b/
        ],

        [
            'soluciones con inteligencia artificial',
            /\b(inteligencia artificial|\bia\b|chatbot|asistente virtual)\b/
        ]
    ];


    for (
        const [
            nombre,
            patron
        ]
        of capacidades
    ) {

        if (
            patron.test(
                limpio
            )
        ) {

            return nombre;
        }
    }


    return null;
}


/*
====================================================================
RESPONDER PREGUNTA
====================================================================
*/

function responderPreguntaDirectaV4(
    analisis
) {

    if (
        !analisis.pregunta.existe
    ) {

        return null;
    }


    const tipo =
        analisis.pregunta.tipo;


    const texto =
        analisis.pregunta.texto;


    if (
        tipo ===
        'precio'
    ) {

        return (
            'El valor depende del alcance, nivel de detalle y material disponible.'
        );
    }


    if (
        tipo ===
        'tiempo'
    ) {

        return (
            'El tiempo depende del alcance y del material disponible.'
        );
    }


    if (
        tipo ===
        'servicios'
    ) {

        return (
            'Trabajamos modelado 3D, visualización, IA, simulación y experiencias VR, AR y XR.'
        );
    }


    if (
        tipo ===
        'requisitos'
    ) {

        return (
            'Podemos evaluar el proyecto desde el material que ya tengas; los requisitos dependen del alcance.'
        );
    }


    if (
        tipo ===
        'capacidad'
    ) {

        const capacidad =
            detectarCapacidadConocidaV4(
                texto
            );


        if (capacidad) {

            return (
                `Sí, trabajamos ${capacidad}.`
            );
        }


        return (
            'Ese requerimiento específico necesita validación del equipo.'
        );
    }


    return (
        'Necesito un poco más de contexto para responder ese punto con precisión.'
    );
}


/*
====================================================================
SOLUCION PROBABLE
====================================================================
*/

function inferirSolucionTrinityV4(
    prospecto
) {

    const tipo =
        prospecto.tipoNecesidad;


    const sector =
        prospecto.sector;


    if (
        tipo ===
        'inmersivo'
    ) {

        return {

            nombre:
                'una experiencia virtual o inmersiva',

            confianza:
                0.9
        };
    }


    if (
        tipo ===
        'simulacion'
    ) {

        return {

            nombre:
                'una simulación digital',

            confianza:
                0.88
        };
    }


    if (
        tipo ===
        'inteligencia_artificial'
    ) {

        return {

            nombre:
                'una solución con inteligencia artificial',

            confianza:
                0.88
        };
    }


    if (
        tipo ===
        'visualizacion'
    ) {

        return {

            nombre:
                'visualización o renderizado 3D',

            confianza:
                0.86
        };
    }


    if (
        (
            sector ===
                'inmobiliario' ||
            sector ===
                'arquitectura'
        ) &&
        tipo ===
            'presentacion'
    ) {

        return {

            nombre:
                'visualización 3D o una experiencia virtual para la presentación',

            confianza:
                0.82
        };
    }


    if (
        sector ===
            'salud' &&
        tipo ===
            'explicacion'
    ) {

        return {

            nombre:
                'visualización o simulación 3D para apoyar la explicación',

            confianza:
                0.76
        };
    }


    if (
        sector ===
            'industria' &&
        !datoVacioV4(
            prospecto.objetivo
        )
    ) {

        return {

            nombre:
                'visualización o simulación digital del proceso',

            confianza:
                0.72
        };
    }


    if (
        sector ===
            'producto' ||
        sector ===
            'publicidad'
    ) {

        return {

            nombre:
                'modelado y visualización 3D',

            confianza:
                0.74
        };
    }


    return null;
}


/*
====================================================================
PUNTUAR CONTEXTO
====================================================================
*/

function puntuacionContextoV4(
    prospecto
) {

    let puntos =
        0;


    if (
        !datoVacioV4(
            prospecto.objetivo
        )
    ) {
        puntos += 2;
    }


    if (
        !datoVacioV4(
            prospecto.necesidad
        )
    ) {
        puntos += 1.5;
    }


    if (
        !datoVacioV4(
            prospecto.tipoNecesidad
        )
    ) {
        puntos += 1;
    }


    if (
        !datoVacioV4(
            prospecto.sector
        )
    ) {
        puntos += 0.75;
    }


    if (
        !datoVacioV4(
            prospecto.audiencia
        )
    ) {
        puntos += 1;
    }


    if (
        !datoVacioV4(
            prospecto.usoFinal
        )
    ) {
        puntos += 1;
    }


    if (
        !datoVacioV4(
            prospecto.materiales
        )
    ) {
        puntos += 1;
    }


    if (
        !datoVacioV4(
            prospecto.alcance
        )
    ) {
        puntos += 1;
    }


    if (
        !datoVacioV4(
            prospecto.plazo
        )
    ) {
        puntos += 0.5;
    }


    if (
        !datoVacioV4(
            prospecto.dolor
        )
    ) {
        puntos += 0.5;
    }


    return puntos;
}


function contextoSuficienteV4(
    prospecto
) {

    const tieneProposito =

        !datoVacioV4(
            prospecto.objetivo
        ) ||

        !datoVacioV4(
            prospecto.necesidad
        ) ||

        !datoVacioV4(
            prospecto.dolor
        );


    const tieneDefinicion =

        !datoVacioV4(
            prospecto.usoFinal
        ) ||

        !datoVacioV4(
            prospecto.materiales
        ) ||

        !datoVacioV4(
            prospecto.alcance
        ) ||

        !datoVacioV4(
            prospecto.audiencia
        );


    return (
        tieneProposito &&
        tieneDefinicion &&
        puntuacionContextoV4(
            prospecto
        ) >= 5.5
    );
}


/*
====================================================================
VALOR DE INFORMACION
====================================================================
*/

function valorInformacionCampoV4(
    campo,
    prospecto
) {

    if (
        !datoVacioV4(
            prospecto[
                campo
            ]
        )
    ) {

        return -100;
    }


    const sector =
        prospecto.sector;


    const tipo =
        prospecto.tipoNecesidad;


    if (
        campo ===
        'objetivo'
    ) {

        return 10;
    }


    if (
        campo ===
        'usoFinal'
    ) {

        return 8;
    }


    if (
        campo ===
        'audiencia'
    ) {

        if (
            tipo ===
                'presentacion' ||
            tipo ===
                'explicacion' ||
            sector ===
                'educacion'
        ) {

            return 8;
        }


        return 5;
    }


    if (
        campo ===
        'alcance'
    ) {

        return 7;
    }


    if (
        campo ===
        'materiales'
    ) {

        return 6;
    }


    if (
        campo ===
        'beneficioEsperado'
    ) {

        if (
            tipo ===
                'explicacion' ||
            sector ===
                'salud'
        ) {

            return 7;
        }


        return 4;
    }


    if (
        campo ===
        'dolor'
    ) {

        if (
            tipo ===
                'explicacion' ||
            sector ===
                'salud'
        ) {

            return 6;
        }


        return 3;
    }


    if (
        campo ===
        'sector'
    ) {

        return (
            datoVacioV4(
                prospecto.tipoNecesidad
            )
                ? 5
                : 2
        );
    }


    if (
        campo ===
        'plazo'
    ) {

        return 3;
    }


    return 1;
}


/*
====================================================================
PREGUNTAS CONTEXTUALES
====================================================================
*/

function preguntaCampoV4(
    campo,
    prospecto
) {

    const sector =
        prospecto.sector;


    const tipo =
        prospecto.tipoNecesidad;


    if (
        campo ===
        'objetivo'
    ) {

        if (
            tipo ===
            'presentacion'
        ) {

            return (
                '¿Qué quieres que la audiencia comprenda o valore del proyecto?'
            );
        }


        if (
            tipo ===
            'inmersivo'
        ) {

            return (
                '¿Qué debería poder experimentar la persona dentro de la solución?'
            );
        }


        if (
            tipo ===
            'simulacion'
        ) {

            return (
                '¿Qué parte del funcionamiento necesitas representar?'
            );
        }


        return (
            '¿Qué resultado quieres conseguir con el proyecto?'
        );
    }


    if (
        campo ===
        'audiencia'
    ) {

        return (
            '¿Quién necesita ver, entender o usar el resultado?'
        );
    }


    if (
        campo ===
        'usoFinal'
    ) {

        return (
            '¿Para qué vas a utilizar el resultado final?'
        );
    }


    if (
        campo ===
        'materiales'
    ) {

        if (
            sector ===
                'arquitectura' ||
            sector ===
                'inmobiliario'
        ) {

            return (
                '¿Con qué material del proyecto cuentas actualmente?'
            );
        }


        if (
            sector ===
            'salud'
        ) {

            return (
                '¿Qué información visual o técnica del procedimiento tienes disponible?'
            );
        }


        return (
            '¿Con qué material o información cuentas actualmente?'
        );
    }


    if (
        campo ===
        'alcance'
    ) {

        if (
            sector ===
            'salud'
        ) {

            return (
                '¿Qué procedimiento o parte necesitas trabajar primero?'
            );
        }


        if (
            sector ===
                'arquitectura' ||
            sector ===
                'inmobiliario'
        ) {

            return (
                '¿Qué parte del proyecto necesitas desarrollar primero?'
            );
        }


        return (
            '¿Qué necesitas incluir en una primera etapa?'
        );
    }


    if (
        campo ===
        'beneficioEsperado'
    ) {

        if (
            sector ===
            'salud'
        ) {

            return (
                '¿Qué quieres que el paciente comprenda mejor?'
            );
        }


        return (
            '¿Qué debería mejorar para quien use o vea el resultado?'
        );
    }


    if (
        campo ===
        'dolor'
    ) {

        if (
            sector ===
            'salud'
        ) {

            return (
                '¿Qué parte les cuesta más entender a los pacientes?'
            );
        }


        if (
            sector ===
            'industria'
        ) {

            return (
                '¿Qué parte del proceso es más difícil de explicar o visualizar?'
            );
        }


        return (
            '¿Qué es lo más difícil de resolver actualmente?'
        );
    }


    if (
        campo ===
        'sector'
    ) {

        return (
            '¿En qué tipo de proyecto estás trabajando?'
        );
    }


    if (
        campo ===
        'plazo'
    ) {

        return (
            '¿Para cuándo necesitas tenerlo listo?'
        );
    }


    return (
        '¿Qué parte del proyecto quieres definir primero?'
    );
}


/*
====================================================================
ACCIONES CANDIDATAS
====================================================================
*/

function generarAccionesCandidatasV4(
    prospecto,
    analisis
) {

    const contexto =
        asegurarContextoConversacionalV4(
            prospecto
        );


    const acciones =
        [];


    if (
        prospecto.modoAsesor ||
        contexto.modoAsesor
    ) {

        acciones.push({

            tipo:
                'PAUSAR_BOT',

            puntaje:
                100
        });


        return acciones;
    }


    if (
        analisis.pideAsesor
    ) {

        acciones.push({

            tipo:
                'ESCALAR_ASESOR',

            puntaje:
                100
        });


        return acciones;
    }


    if (
        analisis.fueraFoco
            .fueraDeFoco
    ) {

        acciones.push({

            tipo:
                'RESPONDER_FUERA_FOCO',

            puntaje:
                100
        });


        return acciones;
    }


    if (
        analisis.pregunta.existe
    ) {

        acciones.push({

            tipo:
                'RESPONDER_PREGUNTA',

            puntaje:
                95
        });


        return acciones;
    }


    const solucion =
        inferirSolucionTrinityV4(
            prospecto
        );


    const preguntasSeguidas =
        contarPreguntasRecientesV4(
            prospecto
        );


    if (
        solucion &&
        solucion.confianza >= 0.76 &&
        !contexto.recomendacionEmitida
    ) {

        acciones.push({

            tipo:
                'RECOMENDAR_SOLUCION',

            puntaje:
                9 +
                Math.min(
                    3,
                    preguntasSeguidas * 1.5
                ),

            solucion
        });
    }


    if (
        contextoSuficienteV4(
            prospecto
        ) &&
        !contexto.revisionOfrecida
    ) {

        acciones.push({

            tipo:
                'PROPONER_REVISION',

            puntaje:
                contexto.recomendacionEmitida
                    ? 9
                    : 6.5
        });
    }


    const campos = [

        'objetivo',

        'usoFinal',

        'audiencia',

        'alcance',

        'materiales',

        'beneficioEsperado',

        'dolor',

        'sector',

        'plazo'
    ];


    for (
        const campo
        of campos
    ) {

        let puntaje =
            valorInformacionCampoV4(
                campo,
                prospecto
            );


        if (
            puntaje <=
            0
        ) {

            continue;
        }


        if (
            contexto.preguntasRealizadas.includes(
                campo
            )
        ) {

            puntaje -=
                3;
        }


        if (
            preguntasSeguidas ===
            1
        ) {

            puntaje -=
                1.5;
        }


        if (
            preguntasSeguidas >=
            2
        ) {

            puntaje -=
                5;
        }


        acciones.push({

            tipo:
                `PREGUNTAR_${campo.toUpperCase()}`,

            campo,

            puntaje
        });
    }


    acciones.push({

        tipo:
            'CONTINUAR_SIN_PREGUNTA',

        puntaje:
            preguntasSeguidas >= 2
                ? 6
                : 1
    });


    return acciones;
}


/*
====================================================================
PUNTUAR Y ELEGIR
====================================================================
*/

function puntuarAccionesV4(
    acciones
) {

    return [
        ...acciones
    ].sort(
        (
            a,
            b
        ) =>
            Number(
                b.puntaje ||
                0
            ) -
            Number(
                a.puntaje ||
                0
            )
    );
}


function decidirSiguienteAccionV4(
    prospecto,
    analisis
) {

    const acciones =
        generarAccionesCandidatasV4(
            prospecto,
            analisis
        );


    const ordenadas =
        puntuarAccionesV4(
            acciones
        );


    return (
        ordenadas[0] || {

            tipo:
                'CONTINUAR_SIN_PREGUNTA',

            puntaje:
                0
        }
    );
}


/*
====================================================================
REGISTRAR PREGUNTA
====================================================================
*/

function registrarPreguntaV4(
    prospecto,
    campo,
    pregunta
) {

    const contexto =
        asegurarContextoConversacionalV4(
            prospecto
        );


    contexto.preguntaPendiente =
        campo;


    contexto.ultimaPregunta =
        pregunta;


    if (
        !contexto
            .preguntasRealizadas
            .includes(
                campo
            )
    ) {

        contexto
            .preguntasRealizadas
            .push(
                campo
            );
    }
}


/*
====================================================================
ETAPA
====================================================================
*/

function actualizarEtapaV4(
    prospecto
) {

    if (
        prospecto.modoAsesor
    ) {

        prospecto.etapa =
            'handoff';

        return;
    }


    if (
        contextoSuficienteV4(
            prospecto
        )
    ) {

        prospecto.etapa =
            'recomendacion';


        prospecto.listoParaComercial =
            true;


        return;
    }


    if (
        !datoVacioV4(
            prospecto.alcance
        ) ||
        !datoVacioV4(
            prospecto.materiales
        )
    ) {

        prospecto.etapa =
            'alcance';

        return;
    }


    if (
        !datoVacioV4(
            prospecto.objetivo
        ) ||
        !datoVacioV4(
            prospecto.dolor
        )
    ) {

        prospecto.etapa =
            'necesidad';

        return;
    }


    prospecto.etapa =
        'descubrimiento';
}


/*
====================================================================
GENERADOR DE RESPUESTA
====================================================================
*/

async function generarRespuestaV4(
    telefono,
    texto,
    prospecto,
    analisis,
    accion
) {

    const contexto =
        asegurarContextoConversacionalV4(
            prospecto
        );


    if (
        accion.tipo ===
        'PAUSAR_BOT'
    ) {

        return (
            'Tu conversación ya está en revisión por el equipo de Trinity 3D.'
        );
    }


    if (
        accion.tipo ===
        'ESCALAR_ASESOR'
    ) {

        await escalarAsesorV4(
            telefono,
            texto,
            'El cliente solicito atencion humana'
        );


        return (
            'Dejo tu conversación para atención del equipo de Trinity 3D.'
        );
    }


    if (
        accion.tipo ===
        'RESPONDER_FUERA_FOCO'
    ) {

        return (
            'La impresión 3D física no es nuestro foco principal; Trinity trabaja principalmente soluciones digitales 3D.'
        );
    }


    if (
        accion.tipo ===
        'RESPONDER_PREGUNTA'
    ) {

        return (
            responderPreguntaDirectaV4(
                analisis
            ) ||
            'Necesito un poco más de contexto para responder ese punto.'
        );
    }


    if (
        accion.tipo ===
        'RECOMENDAR_SOLUCION'
    ) {

        contexto.recomendacionEmitida =
            true;


        contexto.solucionSugerida =
            accion.solucion.nombre;


        prospecto.solucionTrinity =
            accion.solucion.nombre;


        return (
            `Tiene sentido evaluar ${accion.solucion.nombre} para este caso.`
        );
    }


    if (
        accion.tipo ===
        'PROPONER_REVISION'
    ) {

        contexto.revisionOfrecida =
            true;


        const pregunta =
            '¿Quieres que deje este contexto listo para revisión del equipo?';


        registrarPreguntaV4(
            prospecto,
            'confirmarRevision',
            pregunta
        );


        return (
            'Ya hay suficiente contexto. ¿Quieres que lo deje para revisión del equipo?'
        );
    }


    if (
        accion.tipo.startsWith(
            'PREGUNTAR_'
        )
    ) {

        const campo =
            accion.campo;


        const pregunta =
            preguntaCampoV4(
                campo,
                prospecto
            );


        registrarPreguntaV4(
            prospecto,
            campo,
            pregunta
        );


        return pregunta;
    }


    if (
        accion.tipo ===
        'CONTINUAR_SIN_PREGUNTA'
    ) {

        const solucion =
            inferirSolucionTrinityV4(
                prospecto
            );


        if (
            solucion &&
            solucion.confianza >=
                0.7
        ) {

            return (
                `Con lo que ya tenemos, ${solucion.nombre} es una línea razonable para evaluar.`
            );
        }


        return (
            'Ya tengo mejor contexto del proyecto; puedes contarme el punto que quieras definir ahora.'
        );
    }


    return (
        'Puedes contarme qué parte del proyecto quieres definir ahora.'
    );
}


/*
====================================================================
MOTOR FALLBACK V4
====================================================================
*/

async function procesarConversacionFallbackV4(
    telefono,
    texto
) {

    const prospecto =
        obtenerProspecto(
            telefono
        );


    const contexto =
        asegurarContextoConversacionalV4(
            prospecto
        );


    contexto.turnos =
        Number(
            contexto.turnos ||
            0
        ) + 1;


    contexto.modoFallback =
        true;


    contexto.ultimoMensajeCliente =
        String(texto || '')
            .trim();


    /*
    Modo asesor detiene el embudo.
    */

    if (
        prospecto.modoAsesor ||
        contexto.modoAsesor
    ) {

        const accion = {

            tipo:
                'PAUSAR_BOT',

            puntaje:
                100
        };


        registrarAccionV4(
            prospecto,
            accion
        );


        return generarRespuestaV4(
            telefono,
            texto,
            prospecto,
            {

                pregunta: {

                    existe:
                        false
                }
            },
            accion
        );
    }


    const analisis =
        analizarMensajeClienteV4(
            texto,
            prospecto
        );


    if (
        analisis.reset
    ) {

        reiniciarConversacionV4(
            telefono
        );


        return (
            'Conversación reiniciada. ¿En qué proyecto o idea estás trabajando?'
        );
    }


    if (
        analisis.pideAsesor
    ) {

        await escalarAsesorV4(
            telefono,
            texto,
            'El cliente solicito atencion humana'
        );


        return (
            'Dejo tu conversación para atención del equipo de Trinity 3D.'
        );
    }


    /*
    Resolver respuesta a una pregunta previa.
    */

    const pendiente =
        resolverPreguntaPendienteV4(
            prospecto,
            texto,
            analisis
        );


    if (
        pendiente.accion ===
        'ESCALAR'
    ) {

        await escalarAsesorV4(
            telefono,
            texto,
            'Cliente confirmo revision del proyecto'
        );


        return (
            'Listo. Dejo el proyecto para revisión del equipo de Trinity 3D.'
        );
    }


    if (
        pendiente.accion ===
        'NO_ESCALAR'
    ) {

        return (
            'Puedes seguir definiendo el proyecto aquí cuando quieras.'
        );
    }


    /*
    Actualizar todos los hechos independientes
    encontrados en el mensaje.
    */

    actualizarProspectoV4(
        prospecto,
        analisis
    );


    actualizarEtapaV4(
        prospecto
    );


    /*
    Elegir la acción con mayor utilidad.
    */

    const accion =
        decidirSiguienteAccionV4(
            prospecto,
            analisis
        );


    const respuesta =
        await generarRespuestaV4(
            telefono,
            texto,
            prospecto,
            analisis,
            accion
        );


    registrarAccionV4(
        prospecto,
        accion
    );


    contexto.ultimaRespuestaTrinity =
        respuesta;


    prospecto.actualizado =
        new Date()
            .toISOString();


    console.log(
        'V4 accion:',
        accion.tipo,
        'puntaje:',
        accion.puntaje
    );


    console.log(
        'V4 estado:',
        JSON.stringify(
            prospecto,
            null,
            2
        )
    );


    return respuesta;
}


/*
====================================================================
MENSAJES DIRECTOS V4
====================================================================
*/

async function procesarMensajeDirectoV4(
    telefono,
    texto
) {

    /*
    Reset siempre tiene prioridad,
    incluso si estaba en modo asesor.
    */

    if (
        esComandoResetV4(
            texto
        )
    ) {

        reiniciarConversacionV4(
            telefono
        );


        return (
            'Conversación reiniciada. ¿En qué proyecto o idea estás trabajando?'
        );
    }


    const prospecto =
        obtenerProspecto(
            telefono
        );


    const contexto =
        asegurarContextoConversacionalV4(
            prospecto
        );


    const limpio =
        textoReglasV4(
            texto
        );


    /*
    Cliente solicita humano.
    */

    if (
        clientePideAsesorV4(
            texto
        )
    ) {

        await escalarAsesorV4(
            telefono,
            texto,
            'El cliente solicito atencion humana'
        );


        return (
            'Dejo tu conversación para atención del equipo de Trinity 3D.'
        );
    }


    /*
    Si ya hubo handoff no volver al embudo.
    */

    if (
        prospecto.modoAsesor ||
        contexto.modoAsesor
    ) {

        return (
            'Tu conversación ya está en revisión por el equipo de Trinity 3D.'
        );
    }


    /*
    Fuera de foco:
    detener antes de IA y antes del embudo.
    */

    const fueraFoco =
        detectarSolicitudFueraDeFocoV4(
            texto
        );


    if (
        fueraFoco.fueraDeFoco
    ) {

        return (
            'La impresión 3D física no es nuestro foco principal; Trinity trabaja principalmente soluciones digitales 3D.'
        );
    }


    /*
    Saludo.
    */

    if (
        /^(hola|holi|buenas|buenos dias|buenas tardes|buenas noches|hey|hello)[\s!.,¿?]*$/.test(
            limpio
        )
    ) {

        const tieneContexto =

            !datoVacioV4(
                prospecto.objetivo
            ) ||

            !datoVacioV4(
                prospecto.necesidad
            ) ||

            contexto.turnos > 0;


        if (
            tieneContexto
        ) {

            return (
                'Hola. Podemos continuar con el proyecto cuando quieras.'
            );
        }


        return (
            'Hola, ¿en qué proyecto o idea estás trabajando?'
        );
    }


    /*
    Gracias.
    */

    if (
        /^(gracias|muchas gracias|mil gracias|gracias trinity)[\s!.,]*$/.test(
            limpio
        )
    ) {

        return (
            'Con gusto.'
        );
    }


    /*
    Despedida.
    */

    if (
        /^(adios|hasta luego|nos vemos|chao|chau|hasta pronto)[\s!.,]*$/.test(
            limpio
        )
    ) {

        return (
            'Gracias por escribir a Trinity 3D. Hasta pronto.'
        );
    }


    /*
    Cuando BazaarLink ya dio 429,
    usar V4 directamente durante el periodo de cooldown.
    */

    if (
        contexto.modoFallback ===
            true &&
        Number(
            contexto.proximoIntentoIA ||
            0
        ) > Date.now()
    ) {

        return await procesarConversacionFallbackV4(
            telefono,
            texto
        );
    }


    /*
    BazaarLink puede intentarse normalmente.
    */

    return null;
}


/*
====================================================================
HISTORIAL FALLBACK
====================================================================
*/

function registrarRespuestaFallbackHistorialV4(
    telefono,
    respuesta
) {

    if (!respuesta) {
        return;
    }


    if (
        conversaciones instanceof Map
    ) {

        if (
            !conversaciones.has(
                telefono
            )
        ) {

            conversaciones.set(
                telefono,
                []
            );
        }


        const historial =
            conversaciones.get(
                telefono
            );


        const ultimo =
            historial[
                historial.length - 1
            ];


        if (
            !ultimo ||
            ultimo.role !==
                'assistant' ||
            ultimo.content !==
                respuesta
        ) {

            historial.push({

                role:
                    'assistant',

                content:
                    respuesta
            });
        }


        if (
            historial.length >
            12
        ) {

            historial.splice(
                0,
                historial.length - 12
            );
        }


        return;
    }


    if (
        conversaciones &&
        typeof conversaciones ===
            'object'
    ) {

        if (
            !conversaciones[
                telefono
            ]
        ) {

            conversaciones[
                telefono
            ] = [];
        }


        conversaciones[
            telefono
        ].push({

            role:
                'assistant',

            content:
                respuesta
        });


        if (
            conversaciones[
                telefono
            ].length >
            12
        ) {

            conversaciones[
                telefono
            ] =
                conversaciones[
                    telefono
                ].slice(
                    -12
                );
        }
    }
}

async function manejarLimiteIA(telefono, texto) {

    console.log(
        `BazaarLink sin cuota para ${telefono}. Activando Motor Conversacional V4.`
    );


    const prospecto =
        obtenerProspecto(
            telefono
        );


    const contexto =
        asegurarContextoConversacionalV4(
            prospecto
        );


    /*
    Evitar llamar nuevamente a BazaarLink en cada turno
    después de un 429.
    */

    contexto.modoFallback =
        true;


    contexto.proximoIntentoIA =
        Date.now() +
        (
            60 *
            60 *
            1000
        );


    try {

        let respuesta =
            await procesarConversacionFallbackV4(
                telefono,
                texto
            );


        respuesta =
            normalizarRespuestaWhatsApp(
                respuesta
            );


        if (!respuesta) {

            throw new Error(
                'Motor Conversacional V4 genero respuesta vacia'
            );
        }


        registrarRespuestaFallbackHistorialV4(
            telefono,
            respuesta
        );


        contexto.ultimaRespuestaTrinity =
            respuesta;


        console.log(
            `Fallback V4 ${telefono}: ${respuesta}`
        );


        return respuesta;


    } catch (error) {

        console.error(
            'ERROR MOTOR CONVERSACIONAL V4:',
            error.message
        );


        try {

            await notificarAsesor(
                telefono,
                texto,
                'Fallo del sistema conversacional automatico'
            );

        } catch (errorAsesor) {

            console.error(
                'No fue posible notificar al asesor:',
                errorAsesor.message
            );
        }


        return (
            'No pude procesar correctamente el mensaje. Lo dejo para revisión del equipo.'
        );
    }
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
        await procesarMensajeDirectoV4(
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





















