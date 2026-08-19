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

Si una solicitud está fuera de las capacidades conocidas de Trinity 3D, explica que debe ser evaluada por el equipo.

Tu meta es transformar una conversación casual en una necesidad bien definida y lista para evaluación comercial.

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

async function obtenerRespuestaIA(telefono, texto) {
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
                temperature: 0.4,
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

        return 'En este momento estoy teniendo una demora para procesar tu solicitud. Puedes intentarlo nuevamente en unos segundos.';
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















